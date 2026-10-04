import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file, mocks = {}, fetchMock = fetch) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    exports: module.exports, module, Request, Response, URL, AbortSignal, process,
    fetch: fetchMock,
    require: name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      throw new Error(`Unmocked import: ${name}`);
    },
  }, { filename: file });
  return module.exports;
}

const catalog = { SURVIVAL_GAMES: [{ id: 108600, title: "Project Zomboid" }] };
const steamId = "76561198000000000";

test("Steam dashboard returns only curated survival games, recent playtime and profile", async () => {
  const calls = [];
  const { loadSteamDashboard } = load("lib/gaming/steam-stats.ts", { "./catalog": catalog }, async url => {
    calls.push(url);
    assert.equal(url.searchParams.get("key"), "server-secret");
    assert.equal(url.searchParams.get("steamid") || url.searchParams.get("steamids"), steamId);
    if (url.pathname.includes("GetOwnedGames")) return Response.json({ response: { games: [
      { appid: 108600, name: "Project Zomboid", playtime_forever: 900, rtime_last_played: 1720000000 },
      { appid: 42, name: "Other", playtime_forever: 120 },
    ] } });
    if (url.pathname.includes("GetRecentlyPlayedGames")) return Response.json({ response: { games: [
      { appid: 108600, name: "Project Zomboid", playtime_2weeks: 90 },
    ] } });
    return Response.json({ response: { players: [{ personaname: "Survivor", communityvisibilitystate: 3, profileurl: `https://steamcommunity.com/profiles/${steamId}` }] } });
  });
  const result = await loadSteamDashboard("server-secret", steamId);
  assert.equal(calls.length, 3);
  assert.equal(result.games.length, 1);
  assert.equal(result.games[0].survivalPick, true);
  assert.equal(result.games[0].minutesRecently, 90);
  assert.equal(result.recentlyPlayed[0].appId, 108600);
  assert.equal(result.profile.name, "Survivor");
  assert.equal(result.libraryVisibility, "VISIBLE");
  assert.equal(JSON.stringify(result).includes("server-secret"), false);
});

test("private or empty Steam library stays ambiguous, not zero ownership", async () => {
  const { loadSteamDashboard } = load("lib/gaming/steam-stats.ts", { "./catalog": catalog }, async () => Response.json({ response: {} }));
  const result = await loadSteamDashboard("server-secret", steamId);
  assert.equal(result.libraryVisibility, "NONE_OR_PRIVATE");
  assert.equal(result.games.length, 0);
});

test("achievements identify unavailable game data and map unlocked items", async () => {
  let status = 200;
  const { loadSteamAchievements } = load("lib/gaming/steam-stats.ts", { "./catalog": catalog }, async url => {
    assert.equal(url.searchParams.get("appid"), "108600");
    return status === 200 ? Response.json({ playerstats: { success: true, achievements: [
      { apiname: "SURVIVED", name: "Survived", achieved: 1, unlocktime: 1720000000 },
      { apiname: "ESCAPED", name: "Escaped", achieved: 0 },
    ] } }) : new Response("unavailable", { status });
  });
  const achievements = await loadSteamAchievements("server-secret", steamId, 108600);
  assert.equal(achievements.length, 2);
  assert.equal(achievements[0].unlocked, true);
  assert.equal(achievements[1].unlocked, false);
  status = 403;
  assert.equal(await loadSteamAchievements("server-secret", steamId, 108600), null);
});

test("private Steam routes deny requests without RQ sign-in", async () => {
  const mocks = {
    "@/lib/auth-helpers": { getAuthIdentifier: async () => null },
    "@/lib/crypto": { getHashedWallet: () => "hash" },
    "@/lib/gaming/steam-stats": {},
    "@/lib/gaming/catalog-server": {},
    "@/lib/supabase": { supabase: null },
  };
  const stats = load("app/api/gaming/steam/stats/route.ts", mocks);
  const achievements = load("app/api/gaming/steam/achievements/route.ts", mocks);
  assert.equal((await stats.GET(new Request("https://rq.example/api/gaming/steam/stats"))).status, 401);
  assert.equal((await achievements.GET(new Request("https://rq.example/api/gaming/steam/achievements?appid=108600"))).status, 401);
});
