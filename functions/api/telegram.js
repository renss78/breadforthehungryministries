/**
 * POST /api/telegram — webhook van de Telegram-bot voor nieuwsberichten.
 * De bot zelf staat in telegram/bot.js; zie telegram/README.md.
 *
 * Bindings en secrets (Cloudflare Pages, nooit in de repo):
 *   DB (D1, in wrangler.toml), TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET,
 *   GITHUB_TOKEN, ALLOWED_USER_ID.
 */
import bot from '../../telegram/bot.js';

// Stond bij de losse Worker in wrangler.toml onder [vars]; een variabele in
// Pages gaat voor.
const STANDAARD = { GITHUB_REPO: 'renss78/breadforthehungryministries' };

export const onRequestPost = ({ request, env }) => bot.fetch(request, { ...STANDAARD, ...env });
