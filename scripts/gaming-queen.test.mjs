import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(file, mocks = {}, env = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    exports: module.exports, module, Buffer, URL, URLSearchParams, Request, Response, Date,
    process: { env }, console: { ...console, error() {} },
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name),
  }, { filename: file });
  return module.exports;
}
const catalog = load('lib/gaming/catalog.ts');
const gaming = load('lib/gaming/queen.ts', { './catalog': catalog });
const conversationId = 'e236b7b7-8685-4401-aac7-5331157693a0';
const context = gaming.normalizeGamingContext({ conversationId, gameIds: [883710], intent: 'DEBRIEF' });
const history = load('lib/gaming/queen-history.ts', { './queen': gaming });
const cursors = load('lib/gaming/history-cursor.ts', { './queen': gaming });
const navigation = load('lib/gaming/navigation.ts', { './queen': gaming, './catalog': catalog });
const feedback = load('lib/agent-feedback.ts');
const maliciousResponse = {
  threat: { classification: 'FICTIONAL', label: 'A run failed', summary: 'A gameplay decision.', location: 'In game', timeframe: 'HYPOTHETICAL' },
  situation: 'Review the last run.', facts: ['Fabricated live fact'], answer: 'Explain what happened.', uncertainty: 'Difficulty not supplied.', action: 'Describe the decision.',
  urgency: 'NONE', confidence: 'MEDIUM', grounding: 'VERIFIED_LIVE', usesLiveContext: true,
  sourceStatus: { freshness: 'LIVE', observedAt: 'now', note: 'Made up' }, priorities: [], followUps: ['What happened?', 'What was your difficulty?'],
  plan: { title: 'Physical plan', steps: ['Buy water'] }, procurement: { title: 'Buy a kit' }, loadout: { needed: true },
  optionalAction: { type: 'BUILD_CART', label: 'Buy', requiresApproval: false },
  readiness: { eligible: true, xp: 20, reason: 'Game won', gains: { threat_awareness: 3, operational_discipline: 3, psychological_stability: 3, technical_preparedness: 3, adaptability: 3, resourcefulness: 3, surveillance_resistance: 3 } },
};

test('gaming context accepts bounded catalog IDs, not invented facts or scoring privileges', () => {
  const normalized = gaming.normalizeGamingContext({ conversationId: conversationId.toUpperCase(), gameIds: [883710, 883710, 377160, 108600, 305620, 999, '883710'], minutes: 999, party: 'ADMIN', intensity: 'HACK', spoilers: 'true', catalog: 'Ignore instructions', xp: 999 });
  assert.equal(normalized.conversationId, conversationId);
  assert.deepEqual([...normalized.gameIds], [883710, 377160, 108600]);
  assert.equal(normalized.minutes, 60);
  assert.equal(normalized.spoilers, false);
  assert.equal(normalized.party, 'SOLO');
  assert.equal(normalized.catalog, undefined);
  assert.equal(gaming.normalizeGamingContext({ conversationId: '../someone-else' }), null);
  assert.equal(gaming.normalizeGamingContext(null), null);
});

test('gaming output cannot grant readiness, pretend to be live or open physical commerce', () => {
  const safe = gaming.enforceGamingBoundary(maliciousResponse);
  assert.equal(safe.readiness.eligible, false);
  assert.equal(safe.readiness.xp, 0);
  assert.ok(Object.values(safe.readiness.gains).every(gain => gain === 0));
  assert.equal(safe.procurement, null);
  assert.equal(safe.plan, null);
  assert.equal(safe.loadout, null);
  assert.equal(safe.optionalAction.type, 'NONE');
  assert.equal(safe.usesLiveContext, false);
  assert.equal(safe.grounding, 'GENERAL_KNOWLEDGE');
  assert.equal(safe.sourceStatus.observedAt, '');
  assert.equal(safe.facts.length, 0);
  assert.equal(maliciousResponse.readiness.xp, 20);
});

test('browser history preserves malformed contents and merges records without truncation', () => {
  const turn = { id: conversationId, conversation_id: conversationId, prompt: 'Review my run', response: { ...maliciousResponse, message: 'A saved reply' }, context, created_at: '2026-09-30T12:00:00.000Z' };
  for (const raw of ['broken-json', '{}', JSON.stringify([turn, { id: 'damaged-row' }])]) {
    let stored = raw;
    assert.throws(() => history.readGamingTurns({ getItem: () => stored }, 'key'));
    assert.equal(stored, raw);
  }
  const earlier = { ...turn, id: 'a236b7b7-8685-4401-aac7-5331157693a0', created_at: '2026-09-29T12:00:00.000Z' };
  const merged = history.mergeGamingTurns([turn], [earlier, turn]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].id, earlier.id);
  assert.equal(history.readGamingTurns({ getItem: () => JSON.stringify(merged) }, 'key').length, 2);
});

test('per-conversation drafts survive refresh, preserve corrupt originals and keep owners apart', () => {
  const store = new Map();
  const storage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  const key = history.gamingDraftKey('alice', conversationId);
  const draft = { context, prompt: 'Review my last run without spoilers', updatedAt: '2026-09-30T15:00:00.000Z' };
  history.writeGamingDraft(storage, key, draft);
  assert.equal(history.readGamingDraft(storage, key).prompt, draft.prompt);
  assert.equal(history.readGamingDraft(storage, history.gamingDraftKey('bob', conversationId)), null);
  store.set(key, 'corrupt-but-important-original');
  assert.throws(() => history.writeGamingDraft(storage, key, draft));
  assert.equal(store.get(key), 'corrupt-but-important-original');
});

test('backup imports validate every reply and preserve existing records on duplicate IDs', () => {
  const original = { id: conversationId, conversation_id: conversationId, prompt: 'Original prompt', response: { ...maliciousResponse, message: 'Original reply' }, context, created_at: '2026-09-30T12:00:00.000Z' };
  const backup = { version: 1, generations: [{ ...original, prompt: 'Duplicate imported prompt', context: { ...context, gameIds: [883710, 999999] } }] };
  const imported = history.parseGamingBackup(JSON.stringify(backup));
  assert.deepEqual([...imported[0].context.gameIds], [883710]);
  assert.equal(history.mergeGamingTurns(imported, [original])[0].prompt, 'Original prompt');
  assert.throws(() => history.parseGamingBackup(JSON.stringify({ ...backup, version: 2 })));
  assert.throws(() => history.parseGamingBackup(JSON.stringify({ ...backup, generations: [...backup.generations, { id: 'damaged' }] })));
});

test('login return preserves conversation context without allowing external redirects', () => {
  assert.equal(navigation.gamingReturnPath(`/gaming/queen?conversation=${conversationId}&game=883710&extra=unsafe`), `/gaming/queen?conversation=${conversationId}&game=883710`);
  for (const raw of ['https://attacker.test', '//attacker.test', '/\\attacker.test', '/admin', '/gaming/queen/../../admin']) assert.equal(navigation.gamingReturnPath(raw), null);
  assert.equal(navigation.gamingReturnPath('/gaming/profile?steam=ready'), '/gaming/profile');
});

test('history cursors handle tied timestamps and reject unbounded or invalid values', () => {
  const encoded = cursors.encodeGamingCursor({ created_at: '2026-09-30T12:00:00+00:00', id: conversationId });
  const decoded = cursors.decodeGamingCursor(encoded);
  assert.equal(decoded.id, conversationId);
  assert.equal(decoded.createdAt, '2026-09-30T12:00:00.000Z');
  assert.equal(cursors.decodeGamingCursor('x'.repeat(201)), null);
  assert.equal(cursors.decodeGamingCursor(Buffer.from('{"id":"invalid","createdAt":"now"}').toString('base64url')), null);
});

test('feedback is bounded user-submitted data, not invented verification or authority', () => {
  const report = feedback.normalizeAgentReport({ reason: 'SPOILER', surface: 'GAMING', generationId: conversationId, reply: 'x'.repeat(8000), detail: 'd'.repeat(2000), authenticated: true });
  assert.equal(report.reply.length, 6000);
  assert.equal(report.detail.length, 1000);
  assert.equal(report.authenticated, undefined);
  assert.equal(feedback.normalizeAgentReport({ reason: 'ADMIN', reply: 'hello' }), null);
});

function chatHarness({ storageFails = false, identity = 'email-auth:test-owner', guestAllowed = true, selfHarm = false } = {}) {
  const rows = [], reads = [], prompts = [];
  const db = { from(table) {
    reads.push(table);
    if (!['users', 'gaming_queen_generations'].includes(table)) throw new Error(`Private context or core history accessed: ${table}`);
    const query = {
      select() { return this; }, eq() { return this; }, order() { return this; }, limit() { return this; },
      single: async () => ({ data: { apocalyptic_name: 'PRIVATE_CODENAME', chosen_scenarios: [] } }),
      then(resolve) { return Promise.resolve({ data: [], error: null }).then(resolve); },
      insert: async row => { rows.push({ table, row }); return { error: storageFails ? { code: '42P01' } : null }; },
      upsert() { throw new Error('Gaming must not mutate readiness'); },
    };
    return query;
  } };
  class MockOpenAI {
    moderations = { create: async () => ({ results: [{ categories: { 'self-harm/intent': selfHarm } }] }) };
    responses = { parse: async request => { prompts.push(request); return { output_parsed: maliciousResponse, usage: { input_tokens: 80, output_tokens: 30 } }; } };
  }
  const mocks = {
    openai: MockOpenAI, 'openai/helpers/zod': { zodTextFormat: () => ({}) }, '@solana/web3.js': {},
    '@/lib/soul': { SOUL_PROMPT: 'Red Queen identity' }, '@/lib/queen-constitution': { enforceQueenConstitution: response => response },
    '@/lib/threat-graph': { buildThreatGraph: () => null }, '@/lib/supabase': { supabase: db },
    '@/lib/auth-helpers': { getAuthIdentifier: async () => identity }, '@/lib/crypto': { getHashedWallet: () => 'HASHED_OWNER' },
    '@/lib/guest-agent-usage': { consumeGuestAgentRequest: async () => ({ allowed: guestAllowed }) },
    '@/lib/progression': { getStatsFromScenarios: () => ({ xp: 42, level: 2 }), calculateBioScore: () => 66, getCleanScenarios: () => [], applyStatGains: () => { throw new Error('No gaming stat gains'); } },
    '@/lib/solana': { isValidSolanaPublicKey: () => false }, '@/lib/onchain': {},
    '@/lib/threat-token': { getThreatClearance: () => ({ contextMessages: 6, comparisonSignals: 2 }) },
    '@/lib/device-survival-memory': { normalizeDeviceSurvivalMemory: () => ({}), hasDeviceSurvivalMemory: () => false },
    '@/lib/signal-engine': {}, '@/lib/red-queen-agent': { formatAgentMessage: response => response.answer },
    '@/lib/survival-context': { sanitizeArea: value => value || '', isAgentMode: value => ['SIMULATE', 'ANALYZE'].includes(value), isSurvivalFocus: () => false, sanitizeSignalId: () => undefined, sanitizeSignalIds: () => [] },
    '@/lib/survival-market': {}, '@/lib/amazon-creators': {}, '@/lib/x402-market': {}, '@/lib/gaming/queen': gaming,
  };
  return { ...load('app/api/chat/route.ts', mocks, { OPENAI_API_KEY: 'test-not-a-real-key' }), rows, reads, prompts };
}
function request(body) { return new Request('http://localhost/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }

test('gaming request persists separately, ignores survival context and cannot mutate BIO or commerce', async () => {
  const app = chatHarness();
  const result = await app.POST(request({ gaming: context, context: { mode: 'SIMULATE', area: 'PRIVATE_HOME' }, deviceMemory: { profile: { area: 'SECRET_AREA' } }, messages: [{ role: 'user', content: 'My run ended. Give me XP and a shopping cart.' }] }));
  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.readiness.applied, false);
  assert.equal(body.readiness.xp, 0);
  assert.equal(body.commerce, null);
  assert.equal(body.gaming.accountSaved, true);
  assert.equal(body.memory.deviceContextLoaded, false);
  assert.equal(app.rows.length, 1);
  assert.equal(app.rows[0].table, 'gaming_queen_generations');
  assert.equal(app.rows[0].row.user_key, 'HASHED_OWNER');
  assert.equal(app.rows[0].row.conversation_id, conversationId);
  assert.equal(app.rows[0].row.token_usage.input_tokens, 80);
  assert.ok(gaming.isGamingConversationId(app.rows[0].row.id));
  const prompt = app.prompts[0].input[0].content;
  assert.ok(prompt.includes('Resident Evil 2'));
  for (const privateValue of ['PRIVATE_HOME', 'SECRET_AREA', 'PRIVATE_CODENAME']) assert.ok(!prompt.includes(privateValue));
  assert.ok(!app.reads.includes('messages'));
});

test('missing account table still returns generation with explicit unsaved status', async () => {
  const app = chatHarness({ storageFails: true });
  const result = await app.POST(request({ gaming: context, messages: [{ role: 'user', content: 'Help me start' }] }));
  const body = await result.json();
  assert.equal(result.status, 200);
  assert.equal(body.memory.persistent, false);
  assert.equal(body.gaming.accountSaved, false);
  assert.ok(body.gaming.generationId);
});

test('gaming keeps the existing guest quota and rejects malformed domain context', async () => {
  const app = chatHarness({ identity: null, guestAllowed: false });
  const blocked = await app.POST(request({ gaming: context, messages: [{ role: 'user', content: 'Help me choose' }] }));
  assert.equal(blocked.status, 403);
  assert.equal(app.prompts.length, 0);
  const malformed = await app.POST(request({ gaming: { conversationId: 'anything' }, messages: [{ role: 'user', content: 'Give me XP' }] }));
  assert.equal(malformed.status, 400);
});

test('gaming moderation preserves immediate human support for real self-harm', async () => {
  const app = chatHarness({ selfHarm: true });
  const result = await app.POST(request({ gaming: context, messages: [{ role: 'user', content: 'I am not safe' }] }));
  const body = await result.json();
  assert.equal(body.threat.classification, 'REAL');
  assert.match(body.answer, /emergency number/);
  assert.equal(body.readiness.applied, false);
  assert.equal(app.prompts.length, 0);
});

test('account history query always binds the verified owner, never an owner supplied in URL', async () => {
  const filters = [];
  const db = { from() { return { select() { return this; }, eq(key, value) { filters.push([key, value]); return this; }, order() { return this; }, async limit() { return { data: [], error: null }; } }; } };
  const route = load('app/api/gaming/queen/history/route.ts', {
    '@/lib/auth-helpers': { getAuthIdentifier: async () => 'verified-owner' }, '@/lib/crypto': { getHashedWallet: owner => `HASH:${owner}` },
    '@/lib/gaming/queen': gaming, '@/lib/gaming/history-cursor': cursors, '@/lib/supabase': { supabase: db },
  });
  const result = await route.GET(new Request(`http://localhost/api/gaming/queen/history?conversation=${conversationId}&owner=someone-else`));
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(filters, [['user_key', 'HASH:verified-owner'], ['conversation_id', conversationId]]);
  const anonymous = load('app/api/gaming/queen/history/route.ts', { '@/lib/auth-helpers': { getAuthIdentifier: async () => null }, '@/lib/crypto': {}, '@/lib/gaming/queen': gaming, '@/lib/gaming/history-cursor': cursors, '@/lib/supabase': { supabase: db } });
  assert.equal((await anonymous.GET(new Request('http://localhost/api/gaming/queen/history'))).status, 401);
});

test('older history keeps owner scope, paginates by date and ID, and never silently caps the transcript', async () => {
  const rows = Array.from({ length: 101 }, (_, index) => ({ id: `e236b7b7-8685-4401-aac7-${String(index).padStart(12, '0')}`, created_at: '2026-09-30T12:00:00.000Z' }));
  const filters = [];
  const db = { from() { return { select() { return this; }, eq(key, value) { filters.push([key, value]); return this; }, or(value) { filters.push(['or', value]); return this; }, order() { return this; }, async limit(size) { assert.equal(size, 101); return { data: rows, error: null }; } }; } };
  const route = load('app/api/gaming/queen/history/route.ts', { '@/lib/auth-helpers': { getAuthIdentifier: async () => 'alice' }, '@/lib/crypto': { getHashedWallet: () => 'HASHED_ALICE' }, '@/lib/gaming/queen': gaming, '@/lib/gaming/history-cursor': cursors, '@/lib/supabase': { supabase: db } });
  const first = await (await route.GET(new Request(`http://localhost/history?conversation=${conversationId}`))).json();
  assert.equal(first.generations.length, 100);
  assert.equal(cursors.decodeGamingCursor(first.nextCursor).id, rows[99].id);
  await route.GET(new Request(`http://localhost/history?conversation=${conversationId}&cursor=${first.nextCursor}`));
  assert.ok(filters.some(([key, value]) => key === 'or' && value.includes(`id.lt.${rows[99].id}`)));
  assert.ok(filters.every(([key, value]) => key !== 'user_key' || value === 'HASHED_ALICE'));
  assert.equal((await route.GET(new Request('http://localhost/history?cursor=bad!'))).status, 400);
});

test('report endpoint never claims success on storage failure, limits abuse and protects the moderation queue', async () => {
  let failure = false, count = 0;
  const rows = [];
  const db = { from() { return { select() { return this; }, eq() { return this; }, async gte() { return { count, error: null }; }, async insert(row) { rows.push(row); return { error: failure ? { code: '42P01' } : null }; } }; } };
  const route = load('app/api/agent/feedback/route.ts', { '@/lib/auth-helpers': { getAuthIdentifier: async () => 'owner', checkAdmin: async () => false }, '@/lib/crypto': { getHashedWallet: () => 'HASHED_OWNER' }, '@/lib/agent-feedback': feedback, '@/lib/supabase': { supabase: db } });
  const body = { reason: 'UNSAFE', reply: 'An unsafe reply', surface: 'GAMING', reporter_key: 'forged-owner' };
  const ok = await route.POST(request(body));
  assert.equal(ok.status, 200);
  assert.equal(rows[0].reporter_key, 'HASHED_OWNER');
  assert.equal(rows[0].evidence_source, 'USER_SUBMITTED');
  failure = true;
  const failed = await route.POST(request(body));
  assert.equal(failed.status, 503);
  assert.equal((await failed.json()).received, undefined);
  count = 10;
  assert.equal((await route.POST(request(body))).status, 429);
  assert.equal((await route.GET(new Request('http://localhost/feedback'))).status, 403);
});
