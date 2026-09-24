import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);

function load(file, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    exports: module.exports, module, console, Request, Response,
    require: (name) => Object.hasOwn(mocks, name) ? mocks[name] : require(name),
  }, { filename: file });
  return module.exports;
}

const profile = load("lib/survival-profile.ts", {
  "./survival-context": { sanitizeArea: (value) => value.trim().slice(0, 80) },
});

function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test("survival profile sanitizes and deduplicates equipment", () => {
  const parsed = profile.parseSurvivalProfile({
    area: " Barcelona, Spain ", people: 2, budget: "  €50  per month ", constraints: " pet ",
    existingEquipment: [" Torch ", "Torch", " first-aid kit "],
  });
  assert.equal(parsed.area, "Barcelona, Spain");
  assert.equal(parsed.budget, "€50 per month");
  assert.deepEqual(Array.from(parsed.existingEquipment), ["Torch", "first-aid kit"]);
  assert.equal(profile.parseSurvivalProfile({ ...parsed, people: 0 }), null);
  assert.equal(profile.parseSurvivalProfile({ ...parsed, existingEquipment: Array(25).fill("kit") }), null);
});

test("local profile save preserves agent preferences and tracks freshness", () => {
  const device = storage();
  device.setItem(profile.SURVIVAL_PROFILE_STORAGE_KEY, JSON.stringify({ area: "Old city", focus: "BLACKOUT", mode: "PREPARE", location: { lat: 1, lng: 2 } }));
  profile.saveLocalSurvivalProfile(device, { area: "New city", people: 3, budget: "€100", constraints: "Pet", existingEquipment: ["Water"] }, "2026-09-23T10:00:00.000Z");
  const raw = JSON.parse(device.getItem(profile.SURVIVAL_PROFILE_STORAGE_KEY));
  assert.equal(raw.focus, "BLACKOUT");
  assert.equal(raw.mode, "PREPARE");
  assert.equal(raw.location, undefined);
  assert.equal(profile.readLocalSurvivalProfileUpdatedAt(device), Date.parse("2026-09-23T10:00:00.000Z"));
  assert.equal(profile.readLocalSurvivalProfile(device).people, 3);
});

test("private account route rejects unauthenticated reads and writes", async () => {
  const route = load("app/api/profile/survival-context/route.ts", {
    "@/lib/auth-helpers": { getAuthIdentifier: async () => null },
    "@/lib/crypto": { getHashedWallet: () => "hash" },
    "@/lib/supabase": { supabase: null },
    "@/lib/survival-profile": profile,
  });
  assert.equal((await route.GET(new Request("https://rq.example/api/profile/survival-context"))).status, 401);
  assert.equal((await route.PUT(new Request("https://rq.example/api/profile/survival-context", { method: "PUT", body: "{}" }))).status, 401);
});
