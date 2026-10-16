/**
 * Contactformulier — verstuurt het bericht via Resend.
 *
 * Variabelen (Cloudflare Pages → Settings → Environment variables, nooit in de repo):
 *   RESEND_API_KEY (secret), CONTACT_TO, CONTACT_FROM (adres op het geverifieerde Resend-domein).
 */
interface Env {
  RESEND_API_KEY: string;
  CONTACT_TO: string;
  CONTACT_FROM: string;
}

const page = (status: number, title: string, text: string) =>
  new Response(
    `<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><body style="font:18px/1.6 system-ui,sans-serif;max-width:36rem;margin:12vh auto;padding:0 1.25rem;color:#2b3a4a"><h1>${title}</h1><p>${text}</p><p><a href="/contact/">Terug naar het contactformulier</a></p>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );

const MAIL = '<a href="mailto:info@breadforthehungryministries.nl">info@breadforthehungryministries.nl</a>';
const field = (form: FormData, name: string, max: number) => String(form.get(name) ?? '').trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const form = await request.formData();
  if (form.get('website')) return page(200, 'Bedankt', 'Uw bericht is ontvangen.'); // honeypot: bots krijgen een nep-succes

  const naam = field(form, 'naam', 400);
  const email = field(form, 'email', 400);
  const onderwerp = field(form, 'onderwerp', 400).replace(/[\r\n]+/g, ' ');
  const bericht = field(form, 'bericht', 2000);

  if (!naam || !onderwerp || !bericht || !EMAIL_RE.test(email)) {
    return page(400, 'Controleer uw gegevens', 'Niet alle velden zijn juist ingevuld. Ga terug en probeer het opnieuw.');
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    return page(500, 'Er ging iets mis', `Het formulier is niet goed ingesteld. Uw bericht is niet verzonden; mail ons op ${MAIL}.`);
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: `Website Bread for the Hungry <${env.CONTACT_FROM}>`,
        to: [env.CONTACT_TO],
        reply_to: email,
        subject: `[Contactformulier] ${onderwerp}`,
        text: `Naam: ${naam}\nE-mail: ${email}\nOnderwerp: ${onderwerp}\n\n${bericht}\n`,
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error('Contactformulier: verzenden mislukt', err);
    return page(502, 'Verzenden mislukt', `Uw bericht kon niet worden verzonden. Probeer het later opnieuw of mail ons op ${MAIL}.`);
  }

  return page(200, 'Bedankt', 'Uw bericht is verzonden. We nemen zo snel mogelijk contact met u op.');
};

export const onRequest: PagesFunction<Env> = async () =>
  new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
