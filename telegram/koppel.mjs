#!/usr/bin/env node
/**
 * Zet de webhook van de bot op /api/telegram van deze site.
 *
 *   npm run telegram:koppel
 *
 * Leest TELEGRAM_BOT_TOKEN en TELEGRAM_WEBHOOK_SECRET uit .dev.vars (staat in
 * .gitignore). Het geheim moet gelijk zijn aan het secret in Cloudflare Pages.
 * Opnieuw uitvoeren is veilig.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WORTEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.loadEnvFile(path.join(WORTEL, '.dev.vars'));
const { TELEGRAM_BOT_TOKEN: bot, TELEGRAM_WEBHOOK_SECRET: geheim } = process.env;
const url = process.env.WEBHOOK_URL ?? 'https://breadforthehungryministries.nl/api/telegram';

if (!bot || !geheim) {
  console.error('TELEGRAM_BOT_TOKEN en TELEGRAM_WEBHOOK_SECRET moeten in .dev.vars staan.');
  process.exit(1);
}

async function telegram(methode, body = {}) {
  const antwoord = await fetch(`https://api.telegram.org/bot${bot}/${methode}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await antwoord.json();
  if (!data.ok) throw new Error(`${methode}: ${data.description}`);
  return data.result;
}

await telegram('setWebhook', { url, secret_token: geheim, allowed_updates: ['message'] });
const info = await telegram('getWebhookInfo');
const ik = await telegram('getMe');
console.log(`@${ik.username} → ${info.url} (wachtend: ${info.pending_update_count}, laatste fout: ${info.last_error_message ?? 'geen'})`);
