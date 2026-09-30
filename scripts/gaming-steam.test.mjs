import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createSteamFlow, createSteamReceipt, readSteamFlow, readSteamReceipt,
  steamIdFromAssertion, steamOpenIdUrl, verifySteamAssertion,
} from '../lib/gaming/steam-openid.ts';

process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-secret-never-for-production';
const owner = 'a'.repeat(64);
const stranger = 'b'.repeat(64);
const steamId = '76561198000000000';

test('Steam redirect and assertion must match the exact callback and identity', () => {
  const login = new URL(steamOpenIdUrl('https://redqueen.space', 'f'.repeat(48)));
  const callback = login.searchParams.get('openid.return_to');
  assert.equal(login.origin, 'https://steamcommunity.com');
  assert.equal(login.searchParams.get('openid.realm'), 'https://redqueen.space');
  const assertion = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'id_res',
    'openid.op_endpoint': 'https://steamcommunity.com/openid/login',
    'openid.return_to': callback,
    'openid.claimed_id': `https://steamcommunity.com/openid/id/${steamId}`,
    'openid.identity': `https://steamcommunity.com/openid/id/${steamId}`,
    'openid.signed': 'op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle',
    'openid.sig': 'test-signature',
  });
  assert.equal(steamIdFromAssertion(assertion, callback), steamId);
  assertion.set('openid.return_to', 'https://elsewhere.example/callback');
  assert.equal(steamIdFromAssertion(assertion, callback), null);
  assertion.set('openid.return_to', callback);
  assertion.set('openid.identity', `https://steamcommunity.com/openid/id/${'9'.repeat(17)}`);
  assert.equal(steamIdFromAssertion(assertion, callback), null);
  assertion.set('openid.identity', `https://steamcommunity.com/openid/id/${steamId}`);
  assertion.append('openid.identity', `https://steamcommunity.com/openid/id/${'9'.repeat(17)}`);
  assert.equal(steamIdFromAssertion(assertion, callback), null);
});

test('Steam flow rejects changed nonce, owner and signature', () => {
  const flow = createSteamFlow(owner);
  assert.equal(readSteamFlow(flow.cookie, flow.nonce), owner);
  assert.equal(readSteamFlow(flow.cookie, '0'.repeat(48)), null);
  assert.equal(readSteamFlow(flow.cookie.replace(owner, stranger), flow.nonce), null);
});

test('Steam receipt is only usable by the RQ account that started login', () => {
  const receipt = createSteamReceipt(steamId, owner);
  assert.equal(readSteamReceipt(receipt, owner), steamId);
  assert.equal(readSteamReceipt(receipt, stranger), null);
  assert.equal(readSteamReceipt(receipt.replace(steamId, '9'.repeat(17)), owner), null);
  const now = Date.now;
  try {
    Date.now = () => now() + 181_000;
    assert.equal(readSteamReceipt(receipt, owner), null);
  } finally {
    Date.now = now;
  }
});

test('Provider verification is sent only to Steam and requires a valid response', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://steamcommunity.com/openid/login');
      assert.equal(options.method, 'POST');
      assert.equal(options.body.get('openid.mode'), 'check_authentication');
      assert.equal(options.body.has('state'), false);
      return new Response('ns:http://specs.openid.net/auth/2.0\r\nis_valid:true\r\n');
    };
    assert.equal(await verifySteamAssertion(new URLSearchParams({ 'openid.mode': 'id_res', state: 'private-state' })), true);
    globalThis.fetch = async () => new Response('is_valid:false\n');
    assert.equal(await verifySteamAssertion(new URLSearchParams()), false);
    globalThis.fetch = async () => new Response('is_valid:true\n', { status: 500 });
    assert.equal(await verifySteamAssertion(new URLSearchParams()), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
