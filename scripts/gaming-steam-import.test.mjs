import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(file, mocks = {}, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    exports: module.exports, module, Request, Response, URL, AbortSignal, ...globals,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name),
  }, { filename: file });
  return module.exports;
}

const steam = load("lib/gaming/steam-import.ts");
const tags = [{ id: 1662, name: "Survival" }, { id: 1659, name: "Zombies" }, { id: 3978, name: "Survival Horror" }];
const row = (id, tagIds) => `<a data-ds-appid="${id}" data-ds-tagids="${JSON.stringify(tagIds)}"></a>`;

test("Steam search parser ignores bundles and duplicate App IDs", () => {
  const parsed = steam.parseSearchRows(row(108600, [1662, 1659]) + row("108600,222", [1662]) + row(108600, [1662]));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].appId, 108600);
});

test("tag import keeps real games even when Steam omits a searched tag from displayed tags", async () => {
  const fetch = async url => {
    if (url.pathname.includes("search/results")) return { ok: true, json: async () => ({
      success: 1, total_count: 3, results_html: row(108600, [1659]) + row(222, [1662]) + row(333, [1662, 1659]),
    }) };
    const id = url.searchParams.get("appids");
    return { ok: true, json: async () => ({ [id]: { success: true, data: {
      type: id === "222" ? "dlc" : "game", name: "Project Zomboid", developers: ["The Indie Stone"],
      genres: [{ description: "Indie" }, { description: "Simulation" }],
      short_description: "Survive the zombie outbreak with your friends.",
    } } }) };
  };
  const importer = load("lib/gaming/steam-import.ts", {}, { fetch });
  const result = await importer.findSteamGames([1662, 1659], 0, tags);
  assert.equal(result.games.length, 2);
  assert.equal(result.games[0].appId, 108600);
  assert.equal(result.games[0].genre, "Simulation");
  assert.equal(result.games[0].tags[1], "Zombies");
});

test("admin tag import preserves existing rows on App ID conflicts", async () => {
  let saved = null;
  const db = { from: table => {
    assert.equal(table, "gaming_catalog_entries");
    return { upsert: (rows, options) => {
      saved = { rows, options };
      return { select: async () => ({ data: [{ app_id: 222 }], error: null }) };
    } };
  } };
  const route = load("app/api/admin/gaming-catalog/steam-import/route.ts", {
    "@/lib/auth-helpers": { checkAdmin: async () => true },
    "@/lib/gaming/catalog": { SURVIVAL_GAMES: [{ id: 108600 }] },
    "@/lib/gaming/steam-import": {
      FOCUS_TAGS: [1662, 3978, 1100689],
      getSteamTags: async () => tags,
      findSteamGames: async () => ({ total: 2, games: [
        { appId: 108600, title: "Built-in", isPublished: true },
        { appId: 222, title: "Imported", studio: "Studio", lane: "HARDCORE", genre: "Survival", tags: ["Survival"], setting: "Steam", note: "Survival game description", signal: "Survival", accent: "#b66147", isPublished: true },
      ] }),
    },
    "@/lib/supabase": { supabase: db },
  });
  const request = new Request("https://rq.example/api/admin/gaming-catalog/steam-import", {
    method: "POST", body: JSON.stringify({ action: "import", tagIds: [1662], page: 0 }),
  });
  const response = await route.POST(request);
  assert.equal(response.status, 200);
  assert.equal(saved.rows.length, 1);
  assert.equal(saved.rows[0].app_id, 222);
  assert.equal(saved.options.ignoreDuplicates, true);
});
