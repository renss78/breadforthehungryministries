import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { onRequestPost } from '../functions/api/telegram.js';

// De Pages-ingang: vult de vaste waarde in die de losse Worker in wrangler.toml had.
const DB = {
  prepare: () => {
    const opdracht = { bind: () => opdracht, all: async () => ({ results: [] }), run: async () => ({}) };
    return opdracht;
  },
};
const secrets = { DB, TELEGRAM_BOT_TOKEN: 'tg', TELEGRAM_WEBHOOK_SECRET: 's3', GITHUB_TOKEN: 'gh', ALLOWED_USER_ID: '42' };
let urls;

beforeEach(() => {
  urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    return Response.json(url.includes('api.github.com') ? [] : { ok: true });
  };
});

const vraagStatus = (env) =>
  onRequestPost({
    request: new Request('https://breadforthehungryministries.nl/api/telegram', {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 's3' },
      body: JSON.stringify({ message: { message_id: 1, from: { id: 42 }, chat: { id: 42, type: 'private' }, text: '/status' } }),
    }),
    env,
  });

test('gebruikt standaard de repo van de site', async () => {
  assert.equal((await vraagStatus(secrets)).status, 200);
  assert.ok(urls.some((u) => u.startsWith('https://api.github.com/repos/renss78/breadforthehungryministries/issues')), urls.join('\n'));
});

test('een variabele in Pages gaat voor de standaard', async () => {
  await vraagStatus({ ...secrets, GITHUB_REPO: 'ander/repo' });
  assert.ok(urls.some((u) => u.startsWith('https://api.github.com/repos/ander/repo/issues')), urls.join('\n'));
});
