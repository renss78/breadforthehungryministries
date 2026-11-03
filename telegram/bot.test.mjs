import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { beforeEach, test } from 'node:test';
import worker from './bot.js';

// Echte SQL met dezelfde vorm als D1.
let sqlite;
const DB = {
  prepare(sql) {
    const make = (args) => ({
      bind: (...values) => make(values),
      run: async () => sqlite.prepare(sql).run(...args),
      all: async () => ({ results: sqlite.prepare(sql).all(...args) }),
    });
    return make([]);
  },
};
const env = {
  DB,
  TELEGRAM_BOT_TOKEN: 'tg',
  TELEGRAM_WEBHOOK_SECRET: 's3',
  GITHUB_TOKEN: 'gh',
  ALLOWED_USER_ID: '42',
  GITHUB_REPO: 'o/r',
};

let sent;
let requests;
let openItems;
let messageId;

beforeEach(() => {
  sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  sent = [];
  requests = [];
  openItems = [];
  messageId = 0;
  globalThis.fetch = async (url, init = {}) => {
    if (url.includes('api.telegram.org')) {
      sent.push(JSON.parse(init.body).text);
      return Response.json({ ok: true });
    }
    requests.push({ url, method: init.method ?? 'GET', headers: init.headers, body: init.body && JSON.parse(init.body) });
    if (url.endsWith('/issues') && init.method === 'POST') return Response.json({ html_url: 'https://gh/issues/9' }, { status: 201 });
    if (url.includes('/comments')) return Response.json({}, { status: 201 });
    return Response.json(openItems);
  };
});

const post = (message, secret = 's3') =>
  worker.fetch(
    new Request('https://worker/', {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': secret },
      body: JSON.stringify({ message: { message_id: ++messageId, from: { id: 42 }, chat: { id: 42, type: 'private' }, ...message } }),
    }),
    env,
  );
const last = () => sent.at(-1);

test('weigert verkeerde geheimen en andere gebruikers', async () => {
  assert.equal((await post({ text: '/nieuw' }, 'fout')).status, 404);
  assert.equal((await worker.fetch(new Request('https://worker/'), env)).status, 404);
  await post({ text: '/nieuw', from: { id: 99 } });
  await post({ text: 'hoi', chat: { id: 1, type: 'group' } });
  assert.equal(sent.length, 0);
});

test('vraagt buiten een concept om /nieuw', async () => {
  await post({ text: 'hallo' });
  assert.match(last(), /\/nieuw/);
  await post({ text: '/klaar' });
  assert.match(last(), /geen concept/);
});

test('eist tekst en een foto', async () => {
  await post({ text: '/nieuw' });
  await post({ text: '/nieuw' });
  assert.match(last(), /al een concept/);
  await post({ text: '/klaar' });
  assert.match(last(), /mis nog tekst/);
  await post({ text: 'Titel\n\nTekst.' });
  await post({ text: '/klaar' });
  assert.match(last(), /foto/);
  assert.equal(requests.length, 0);
});

test('maakt een issue volgens het contract met de site', async () => {
  await post({ text: '/nieuw' });
  await post({ text: 'Mijn titel\n\nEerste alinea.\n\nTweede alinea.' });
  const before = sent.length;
  await post({ media_group_id: 'a', photo: [{ file_id: 'klein' }, { file_id: 'foto-1', file_size: 10 }], caption: 'Slotzin.' });
  await post({ media_group_id: 'a', photo: [{ file_id: 'foto-2', file_size: 10 }] });
  assert.equal(sent.length, before);
  await post({ video: { file_id: 'vid-1', file_size: 10 } });
  await post({ document: { file_id: 'doc-foto', mime_type: 'image/jpeg', file_size: 10 } });
  await post({ document: { file_id: 'x', mime_type: 'application/pdf', file_size: 10 } });
  assert.match(last(), /bestandstype/);
  await post({ video: { file_id: 'groot', file_size: 21 * 1024 * 1024 } });
  assert.match(last(), /20 MB/);
  await post({ text: '/opmerking Gebruik foto 2 als omslag.' });
  await post({ text: '/klaar' });

  const issue = requests.at(-1);
  assert.equal(issue.url, 'https://api.github.com/repos/o/r/issues');
  assert.equal(issue.headers.authorization, 'Bearer gh');
  assert.equal(issue.body.title, 'Nieuwsbericht: Mijn titel');
  assert.deepEqual(issue.body.labels, ['nieuwsbericht']);
  assert.match(issue.body.body, /### Titel\n\nMijn titel/);
  assert.match(issue.body.body, /### Tekst\n\nEerste alinea\.\n\nTweede alinea\.\n\nSlotzin\./);
  assert.match(issue.body.body, /### Opmerkingen\n\nGebruik foto 2 als omslag\./);
  assert.deepEqual(
    [...issue.body.body.matchAll(/^telegram-file: ([\w-]+)$/gm)].map((match) => match[1]),
    ['foto-1', 'foto-2', 'doc-foto', 'vid-1'],
  );
  assert.match(last(), /4 bestand/);

  await post({ text: '/klaar' });
  assert.match(last(), /geen concept/);
});

test('weigert meer dan 12 bestanden', async () => {
  await post({ text: '/nieuw' });
  await post({ text: 'Titel\n\nTekst.' });
  for (let i = 0; i < 13; i++) await post({ photo: [{ file_id: `f${i}`, file_size: 10 }] });
  await post({ text: '/klaar' });
  assert.match(last(), /Te veel bestanden/);
  assert.equal(requests.length, 0);
});

test('/annuleer gooit het concept weg', async () => {
  await post({ text: '/nieuw' });
  await post({ text: '/annuleer' });
  await post({ text: '/klaar' });
  assert.match(last(), /geen concept/);
});

test('/status en /wijzig gebruiken het nieuwste bericht', async () => {
  await post({ text: '/status' });
  assert.match(last(), /geen berichten/);
  await post({ text: '/wijzig iets' });
  assert.match(last(), /geen bericht/);
  await post({ text: '/wijzig' });
  assert.match(last(), /Gebruik \/wijzig/);

  openItems = [
    { number: 1, title: 'Ander issue', html_url: 'u1', labels: [{ name: 'bug' }] },
    { number: 7, title: 'Nieuwsbericht PR', html_url: 'u7', labels: [], pull_request: {} },
    { number: 6, title: 'Nieuwsbericht: oud', html_url: 'u6', labels: [{ name: 'nieuwsbericht' }] },
  ];
  await post({ text: '/status' });
  assert.ok(last().includes('u7') && last().includes('u6') && !last().includes('u1'));
  await post({ text: '/wijzig Maak de titel korter' });
  assert.ok(requests.at(-1).url.endsWith('/issues/7/comments'));
  assert.equal(requests.at(-1).body.body, '@claude Maak de titel korter');
});

test('meldt een GitHub-fout en geeft Telegram toch 200', async () => {
  const telegram = globalThis.fetch;
  globalThis.fetch = async (url, init) => (url.includes('api.telegram.org') ? telegram(url, init) : new Response('x', { status: 403 }));
  const originalError = console.error;
  console.error = () => {};
  assert.equal((await post({ text: '/status' })).status, 200);
  console.error = originalError;
  assert.match(last(), /403/);
});
