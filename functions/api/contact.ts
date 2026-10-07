/**
 * Contactformulier — STUB.
 *
 * Er wordt nog niets verstuurd. Koppel hier later een e-mail-API (bijv. Resend) en
 * Cloudflare Turnstile aan; lees alle sleutels uit `env` (nooit in de repo).
 * Zie README.md voor de aanbevolen variabelen.
 */
interface Env {}

const page = (status: number, title: string, text: string) =>
  new Response(
    `<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><body style="font:18px/1.6 system-ui,sans-serif;max-width:36rem;margin:12vh auto;padding:0 1.25rem;color:#2b3a4a"><h1>${title}</h1><p>${text}</p><p><a href="/contact/">Terug naar het contactformulier</a></p>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  const form = await request.formData();
  if (form.get('website')) return page(200, 'Bedankt', 'Uw bericht is ontvangen.'); // honeypot: bots krijgen een nep-succes

  // TODO: valideren, Turnstile-token controleren en bericht e-mailen.
  return page(
    501,
    'Formulier nog niet actief',
    'Het contactformulier is nog niet in gebruik. Uw bericht is niet verzonden; mail ons op <a href="mailto:info@breadforthehungryministries.nl">info@breadforthehungryministries.nl</a>.',
  );
};

export const onRequest: PagesFunction<Env> = async () =>
  new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
