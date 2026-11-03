// Telegram-bot voor nieuwsberichten: verzamelt tekst en bestanden en maakt daarmee een GitHub-issue.
// De bestanden blijven bij Telegram; de workflow haalt ze op via de regels `telegram-file: <id>`.

const MAX_FILE_BYTES = 20 * 1024 * 1024; // downloadlimiet van de Telegram Bot API
const MAX_FILES = 12; // gelijk aan download-attachments.mjs in de site-repo

const HELP = `Nieuwsbericht plaatsen:
/nieuw - start een bericht
Stuur daarna de tekst (eerste regel = titel) en de foto's en video's. De eerste foto wordt de omslag.
/opmerking <tekst> - extra instructie voor Claude
/klaar - maak het bericht aan
/annuleer - gooi het concept weg

Bijwerken:
/status - toon lopende berichten
/wijzig <tekst> - vraag een correctie op het nieuwste bericht

Tip: stuur foto's als bestand voor de beste kwaliteit.`;

const send = (env, chatId, text) =>
  fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

async function github(env, path, init = {}) {
  const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}${path}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'user-agent': 'bread-telegram-bot',
      'x-github-api-version': '2022-11-28',
    },
  });
  if (!response.ok) throw new Error(`GitHub gaf status ${response.status}`);
  return response.json();
}

const addItem = (env, messageId, kind, value) =>
  env.DB.prepare('INSERT OR IGNORE INTO draft_items (message_id, kind, value) VALUES (?, ?, ?)')
    .bind(messageId, kind, value)
    .run();

const clearDraft = (env) => env.DB.prepare('DELETE FROM draft_items').run();

async function readDraft(env) {
  const { results } = await env.DB.prepare('SELECT kind, value FROM draft_items ORDER BY message_id').all();
  return results;
}

/** Het bestand in een bericht, of null als er geen is. */
function fileOf(message) {
  if (message.photo) return { ...message.photo.at(-1), kind: 'image' };
  if (message.video) return { ...message.video, kind: 'video' };
  const type = message.document?.mime_type ?? '';
  if (type.startsWith('image/')) return { ...message.document, kind: 'image' };
  if (type.startsWith('video/')) return { ...message.document, kind: 'video' };
  return null;
}

function issueBody(title, text, files, notes) {
  return [
    `### Titel\n\n${title}`,
    '### Datum\n\n_No response_',
    `### Tekst\n\n${text}`,
    `### Foto's en video's\n\n${files.map((file) => `telegram-file: ${file}`).join('\n')}`,
    `### Opmerkingen\n\n${notes.join('\n') || '_No response_'}`,
  ].join('\n\n');
}

async function finishDraft(env, chatId, draft) {
  const values = (kind) => draft.filter((item) => item.kind === kind).map((item) => item.value);
  const [title, ...rest] = values('text').join('\n\n').trim().split('\n');
  const text = rest.join('\n').trim();
  const images = values('image');
  const files = [...images, ...values('video')];

  if (!title || !text) return send(env, chatId, 'Ik mis nog tekst: de eerste regel is de titel, daarna volgt het bericht.');
  if (!images.length) return send(env, chatId, 'Ik mis nog een foto; de omslag is verplicht.');
  if (files.length > MAX_FILES) return send(env, chatId, `Te veel bestanden: ${files.length} (maximaal ${MAX_FILES}).`);

  const issue = await github(env, '/issues', {
    method: 'POST',
    body: JSON.stringify({
      title: `Nieuwsbericht: ${title}`,
      body: issueBody(title, text, files, values('note')),
      labels: ['nieuwsbericht'],
    }),
  });
  await clearDraft(env);
  return send(env, chatId, `Claude gaat aan de slag met ${files.length} bestand(en). Je krijgt bericht als het klaar is.\n${issue.html_url}`);
}

/** Open pull requests en nieuwsbericht-issues, nieuwste eerst. */
async function openItems(env) {
  const items = await github(env, '/issues?state=open&sort=created&direction=desc&per_page=20');
  return items.filter((item) => item.pull_request || item.labels.some((label) => label.name === 'nieuwsbericht'));
}

async function handleCommand(env, chatId, messageId, command, argument, draft) {
  const open = draft.length > 0;
  switch (command) {
    case 'nieuw':
      if (open) return send(env, chatId, 'Er loopt al een concept. Rond het af met /klaar of gooi het weg met /annuleer.');
      await addItem(env, messageId, 'open', '');
      return send(env, chatId, "Stuur de tekst (eerste regel = titel) en de foto's en video's. Sluit af met /klaar.");
    case 'klaar':
      return open ? finishDraft(env, chatId, draft) : send(env, chatId, 'Er is geen concept. Start met /nieuw.');
    case 'annuleer':
      await clearDraft(env);
      return send(env, chatId, 'Concept weggegooid.');
    case 'opmerking':
      if (!open || !argument) return send(env, chatId, 'Gebruik /opmerking <tekst> binnen een concept.');
      await addItem(env, messageId, 'note', argument);
      return send(env, chatId, 'Opmerking toegevoegd.');
    case 'status': {
      const items = await openItems(env);
      const lines = items.slice(0, 5).map((item) => `${item.title}\n${item.html_url}`);
      return send(env, chatId, lines.join('\n\n') || 'Er lopen geen berichten.');
    }
    case 'wijzig': {
      if (!argument) return send(env, chatId, 'Gebruik /wijzig <wat er moet veranderen>.');
      const [latest] = await openItems(env);
      if (!latest) return send(env, chatId, 'Er loopt geen bericht om te wijzigen.');
      await github(env, `/issues/${latest.number}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: `@claude ${argument}` }),
      });
      return send(env, chatId, `Correctie doorgegeven op: ${latest.title}\n${latest.html_url}`);
    }
    default:
      return send(env, chatId, HELP);
  }
}

async function handleMessage(env, message) {
  const chatId = message.chat.id;
  const content = message.text ?? message.caption ?? '';
  const draft = await readDraft(env);

  const command = message.text?.match(/^\/(\w+)(?:@\w+)?\s*([\s\S]*)$/);
  if (command) return handleCommand(env, chatId, message.message_id, command[1].toLowerCase(), command[2].trim(), draft);

  const hasMedia = message.photo || message.video || message.document;
  if (!draft.length) return send(env, chatId, 'Start eerst een bericht met /nieuw.');

  if (hasMedia) {
    const file = fileOf(message);
    if (!file) return send(env, chatId, 'Dit bestandstype kan ik niet verwerken; stuur een foto of video.');
    if (file.file_size > MAX_FILE_BYTES) return send(env, chatId, 'Dit bestand is groter dan 20 MB en is overgeslagen.');
    await addItem(env, message.message_id, file.kind, file.file_id);
  }
  if (content) await addItem(env, message.message_id, 'text', content);

  // Bij een album van foto's zou elke foto anders een eigen bevestiging geven.
  if (!message.media_group_id) await send(env, chatId, hasMedia ? 'Bestand ontvangen.' : 'Tekst ontvangen.');
}

export default {
  async fetch(request, env) {
    const secret = request.headers.get('x-telegram-bot-api-secret-token');
    if (request.method !== 'POST' || secret !== env.TELEGRAM_WEBHOOK_SECRET) {
      return new Response('Not found', { status: 404 });
    }

    const { message } = await request.json();
    const allowed = message && String(message.from?.id) === env.ALLOWED_USER_ID && message.chat.type === 'private';
    if (allowed) {
      try {
        await handleMessage(env, message);
      } catch (error) {
        console.error(error);
        await send(env, message.chat.id, `Er ging iets mis: ${error.message}`);
      }
    }
    // Altijd 200: anders stuurt Telegram hetzelfde bericht opnieuw.
    return new Response('ok');
  },
};
