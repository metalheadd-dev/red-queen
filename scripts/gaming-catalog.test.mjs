import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    exports: module.exports, module, Request, Response,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name),
  }, { filename: file });
  return module.exports;
}

const builtIn = { id: 108600, title: "Project Zomboid", studio: "The Indie Stone", lane: "HARDCORE", setting: "Kentucky", note: "Survive", signal: "SURVIVAL", accent: "#b66147" };
const catalog = { SURVIVAL_GAMES: [builtIn] };
const row = { app_id: 12345, title: "New Survival Game", studio: "Indie Studio", lane: "HORROR", genre: "Survival Horror", tags: ["Survival", "Zombies"], setting: "Dark City", note: "A careful survival horror adventure.", signal: "HORROR", accent: "#cb4051", is_published: true };

test("public catalog merges only published admin titles and preserves built-in picks", async () => {
  const db = { from: table => {
    assert.equal(table, "gaming_catalog_entries");
    return { select: () => ({ eq: () => ({ order: async () => ({ data: [row], error: null }) }) }) };
  } };
  const server = load("lib/gaming/catalog-server.ts", { "./catalog": catalog, "@/lib/supabase": { supabase: db } });
  const result = await server.getPublishedCatalog();
  assert.equal(result.games.length, 2);
  assert.equal(result.games[0].id, 108600);
  assert.equal(result.games[1].id, 12345);
  assert.equal(result.games[1].tags[0], "Survival");
});

test("admin catalog rejects non-admin writes and invalid submissions", async () => {
  const failAuth = load("app/api/admin/gaming-catalog/route.ts", {
    "@/lib/auth-helpers": { checkAdmin: async () => false },
    "@/lib/gaming/catalog": catalog,
    "@/lib/supabase": { supabase: {} },
  });
  const request = body => new Request("https://rq.example/api/admin/gaming-catalog", { method: "POST", body: JSON.stringify(body) });
  assert.equal((await failAuth.POST(request({}))).status, 403);
  const db = { from: () => { throw new Error("Validation must run before DB write"); } };
  const allowed = load("app/api/admin/gaming-catalog/route.ts", {
    "@/lib/auth-helpers": { checkAdmin: async () => true },
    "@/lib/gaming/catalog": catalog,
    "@/lib/supabase": { supabase: db },
  });
  assert.equal((await allowed.POST(request({ appId: 12345, title: "Not enough fields" }))).status, 400);
  assert.equal((await allowed.POST(request({ appId: 108600, title: row.title, studio: row.studio, lane: row.lane, genre: row.genre, tags: row.tags, setting: row.setting, note: row.note, signal: row.signal, accent: row.accent, isPublished: true }))).status, 409);
});

test("admin can publish and later hide a curated game without deleting its row", async () => {
  const writes = [];
  const db = { from: table => {
    assert.equal(table, "gaming_catalog_entries");
    return {
      insert: value => { writes.push({ action: "insert", value }); return { select: () => ({ single: async () => ({ data: value, error: null }) }) }; },
      update: value => { writes.push({ action: "update", value }); return { eq: () => ({ select: () => ({ maybeSingle: async () => ({ data: value, error: null }) }) }) }; },
    };
  } };
  const route = load("app/api/admin/gaming-catalog/route.ts", {
    "@/lib/auth-helpers": { checkAdmin: async () => true },
    "@/lib/gaming/catalog": catalog,
    "@/lib/supabase": { supabase: db },
  });
  const payload = { appId: row.app_id, title: row.title, studio: row.studio, lane: row.lane, genre: row.genre,
    tags: row.tags, setting: row.setting, note: row.note, signal: row.signal, accent: row.accent, isPublished: true };
  const request = (method, body) => new Request("https://rq.example/api/admin/gaming-catalog", { method, body: JSON.stringify(body) });
  assert.equal((await route.POST(request("POST", payload))).status, 200);
  assert.equal(writes[0].value.is_published, true);
  assert.equal((await route.PATCH(request("PATCH", { ...payload, isPublished: false }))).status, 200);
  assert.equal(writes[1].value.is_published, false);
  assert.equal(writes.some(write => write.action === "delete"), false);
});
