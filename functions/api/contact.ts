/**
 * Contactformulier — verstuurt het bericht via Resend.
 *
 * Variabelen (Cloudflare Pages → Settings → Environment variables, nooit in de repo):
 *   RESEND_API_KEY (secret), CONTACT_TO, CONTACT_FROM (adres op het geverifieerde Resend-domein),
 *   TURNSTILE_SECRET_KEY (secret) en TURNSTILE_HOSTNAMES (kommagescheiden hostnamen van de site).
 *   Zonder Turnstile-instellingen wordt geen bericht verzonden.
 *
 * Het formulier stuurt een verborgen veld `lang` ('nl' | 'en') mee; de antwoordpagina's volgen die taal.
 * De e-mail zelf is altijd Nederlands (voor het ontvangende team), met de taal van de bezoeker vermeld.
 */
interface Env {
  RESEND_API_KEY: string;
  CONTACT_TO: string;
  CONTACT_FROM: string;
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_HOSTNAMES: string;
}

type Lang = 'nl' | 'en';

const text = {
  nl: {
    html: 'nl',
    back: 'Terug naar het contactformulier',
    backHref: '/contact/',
    thanks: 'Bedankt',
    received: 'Uw bericht is ontvangen.',
    sent: 'Uw bericht is verzonden. We nemen zo snel mogelijk contact met u op.',
    checkTitle: 'Controleer uw gegevens',
    check: 'Niet alle velden zijn juist ingevuld. Ga terug en probeer het opnieuw.',
    botTitle: 'Controle mislukt',
    bot: 'We konden niet bevestigen dat u geen robot bent. Ga terug, wacht tot de controle klaar is en verstuur het formulier opnieuw.',
    errorTitle: 'Er ging iets mis',
    misconfigured: (mail: string) => `Het formulier is niet goed ingesteld. Uw bericht is niet verzonden; mail ons op ${mail}.`,
    failedTitle: 'Verzenden mislukt',
    failed: (mail: string) => `Uw bericht kon niet worden verzonden. Probeer het later opnieuw of mail ons op ${mail}.`,
  },
  en: {
    html: 'en',
    back: 'Back to the contact form',
    backHref: '/en/contact/',
    thanks: 'Thank you',
    received: 'Your message has been received.',
    sent: 'Your message has been sent. We will get back to you as soon as possible.',
    checkTitle: 'Please check your details',
    check: 'Not all fields were filled in correctly. Go back and try again.',
    botTitle: 'Verification failed',
    bot: 'We could not confirm that you are not a robot. Go back, wait until the check has finished and submit the form again.',
    errorTitle: 'Something went wrong',
    misconfigured: (mail: string) => `The form is not set up correctly. Your message has not been sent; please email us at ${mail}.`,
    failedTitle: 'Sending failed',
    failed: (mail: string) => `Your message could not be sent. Please try again later or email us at ${mail}.`,
  },
} as const;

const page = (lang: Lang, status: number, title: string, body: string) =>
  new Response(
    `<!doctype html><html lang="${text[lang].html}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><body style="font:18px/1.6 system-ui,sans-serif;max-width:36rem;margin:12vh auto;padding:0 1.25rem;color:#2b3a4a"><h1>${title}</h1><p>${body}</p><p><a href="${text[lang].backHref}">${text[lang].back}</a></p>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );

const MAIL = '<a href="mailto:info@breadforthehungryministries.nl">info@breadforthehungryministries.nl</a>';
const field = (form: FormData, name: string, max: number) => String(form.get(name) ?? '').trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TURNSTILE_ACTION = 'contact';

/**
 * Controleert het Turnstile-token bij Cloudflare (siteverify). Vereist success, de juiste action en een
 * goedgekeurde hostname. Bij een netwerk- of API-fout geldt de controle als mislukt.
 */
async function turnstileOk(token: string, secret: string, hostnames: Set<string>, ip: string | null): Promise<boolean> {
  if (!token || token.length > 2048 || hostnames.size === 0) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`siteverify ${res.status}`);
    const data = (await res.json()) as { success?: boolean; action?: string; hostname?: string; 'error-codes'?: string[] };
    const ok = data.success === true && data.action === TURNSTILE_ACTION && hostnames.has(data.hostname ?? '');
    if (!ok) console.warn('Contactformulier: Turnstile afgewezen', data['error-codes'], data.action, data.hostname);
    return ok;
  } catch (err) {
    console.error('Contactformulier: Turnstile-controle mislukt', err);
    return false;
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const form = await request.formData();
  const lang: Lang = form.get('lang') === 'en' ? 'en' : 'nl';
  const t = text[lang];
  if (form.get('website')) return page(lang, 200, t.thanks, t.received); // honeypot: bots krijgen een nep-succes

  const naam = field(form, 'naam', 400);
  const email = field(form, 'email', 400);
  const onderwerp = field(form, 'onderwerp', 400).replace(/[\r\n]+/g, ' ');
  const bericht = field(form, 'bericht', 2000);

  if (!naam || !onderwerp || !bericht || !EMAIL_RE.test(email)) {
    return page(lang, 400, t.checkTitle, t.check);
  }

  const hostnames = new Set(
    (env.TURNSTILE_HOSTNAMES ?? '').split(',').map((h) => h.trim()).filter(Boolean),
  );
  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM || !env.TURNSTILE_SECRET_KEY || hostnames.size === 0) {
    console.error('Contactformulier: ontbrekende variabelen (Resend of Turnstile)');
    return page(lang, 500, t.errorTitle, t.misconfigured(MAIL));
  }

  const token = String(form.get('cf-turnstile-response') ?? '');
  if (!(await turnstileOk(token, env.TURNSTILE_SECRET_KEY, hostnames, request.headers.get('CF-Connecting-IP')))) {
    return page(lang, 403, t.botTitle, t.bot);
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: `Website Bread for the Hungry <${env.CONTACT_FROM}>`,
        to: [env.CONTACT_TO],
        reply_to: email,
        subject: `[Contactformulier${lang === 'en' ? ' – English' : ''}] ${onderwerp}`,
        text: `Naam: ${naam}\nE-mail: ${email}\nOnderwerp: ${onderwerp}\nTaal website: ${lang === 'en' ? 'Engels' : 'Nederlands'}\n\n${bericht}\n`,
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error('Contactformulier: verzenden mislukt', err);
    return page(lang, 502, t.failedTitle, t.failed(MAIL));
  }

  return page(lang, 200, t.thanks, t.sent);
};

export const onRequest: PagesFunction<Env> = async () =>
  new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
