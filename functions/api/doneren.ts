/**
 * Online doneren via Mollie.
 *
 * POST /api/doneren  — het donatieformulier op /sponsoring/ (en /en/sponsorship/). Controleert de invoer en Turnstile,
 *                      maakt een Mollie-betaling aan en stuurt de bezoeker door naar de betaalpagina van Mollie.
 *                      Het betalings-id gaat mee in een HttpOnly-cookie (alleen voor dit pad), zodat het niet in de URL staat.
 * GET  /api/doneren  — de bedankpagina (/bedankt/, /en/thank-you/) haalt hiermee de status en gegevens van díe betaling op
 *                      voor het betalingsbewijs.
 *
 * Variabelen (Cloudflare Pages → Settings → Variables and Secrets, lokaal in .dev.vars; nooit in de repo):
 *   MOLLIE_API_KEY (secret; `test_…` voor testen, `live_…` voor echt geld),
 *   TURNSTILE_SECRET_KEY (secret) en TURNSTILE_HOSTNAMES — dezelfde als bij het contactformulier.
 * Er is geen webhook: niets op de site hangt af van de status behalve het betalingsbewijs, en dat vraagt de status zelf op.
 */
interface Env {
  MOLLIE_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_HOSTNAMES: string;
}

type Lang = 'nl' | 'en';

/** Grenzen van het vrije bedrag ("Anders"). Grotere giften liever per bankoverschrijving. */
const MIN_EUR = 5;
const MAX_EUR = 10_000;
const PRESETS = new Set(['500', '250', '100', '50']);

const COOKIE = 'donatie';
const COOKIE_PATH = '/api/doneren';
const MOLLIE = 'https://api.mollie.com/v2/payments';
const PAYMENT_ID_RE = /^tr_[A-Za-z0-9]{4,64}$/;

const text = {
  nl: {
    html: 'nl',
    back: 'Terug naar het donatieformulier',
    backHref: '/sponsoring/',
    thanksPath: '/bedankt/',
    description: 'Donatie Bread for the Hungry Ministries',
    locale: 'nl_NL',
    checkTitle: 'Controleer uw gegevens',
    check: 'Niet alle velden zijn juist ingevuld. Ga terug en probeer het opnieuw.',
    amountTitle: 'Controleer het bedrag',
    amount: `Kies een bedrag, of vul bij "Anders" een bedrag in tussen € ${MIN_EUR} en € ${MAX_EUR.toLocaleString('nl-NL')}. Voor een groter bedrag kunt u ook rechtstreeks overmaken naar onze bankrekening.`,
    botTitle: 'Controle mislukt',
    bot: 'We konden niet bevestigen dat u geen robot bent. Ga terug, wacht tot de controle klaar is en verstuur het formulier opnieuw.',
    errorTitle: 'Er ging iets mis',
    failed: 'De betaling kon niet worden gestart. Probeer het later opnieuw, of maak uw gift rechtstreeks over naar onze bankrekening (zie de sponsoringpagina).',
  },
  en: {
    html: 'en',
    back: 'Back to the donation form',
    backHref: '/en/sponsorship/',
    thanksPath: '/en/thank-you/',
    description: 'Donation Bread for the Hungry Ministries',
    locale: 'en_US',
    checkTitle: 'Please check your details',
    check: 'Not all fields were filled in correctly. Go back and try again.',
    amountTitle: 'Please check the amount',
    amount: `Choose an amount, or enter an amount between € ${MIN_EUR} and € ${MAX_EUR.toLocaleString('en-GB')} under "Other". For a larger amount you can also transfer directly to our bank account.`,
    botTitle: 'Verification failed',
    bot: 'We could not confirm that you are not a robot. Go back, wait until the check has finished and submit the form again.',
    errorTitle: 'Something went wrong',
    failed: 'The payment could not be started. Please try again later, or transfer your gift directly to our bank account (see the sponsorship page).',
  },
} as const;

const page = (lang: Lang, status: number, title: string, body: string) =>
  new Response(
    `<!doctype html><html lang="${text[lang].html}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><body style="font:18px/1.6 system-ui,sans-serif;max-width:36rem;margin:12vh auto;padding:0 1.25rem;color:#2b3a4a"><h1>${title}</h1><p>${body}</p><p><a href="${text[lang].backHref}">${text[lang].back}</a></p>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const field = (form: FormData, name: string, max: number) => String(form.get(name) ?? '').trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Bedrag in centen, of null als het ongeldig is. Een gekozen vast bedrag wint; anders telt het vrije veld
 * (ook als de bezoeker "Anders" niet heeft aangevinkt maar wel een bedrag heeft ingevuld). Komma of punt als decimaalteken.
 */
function parseAmount(choice: string, other: string): number | null {
  if (PRESETS.has(choice)) return Number(choice) * 100;
  if (choice && choice !== 'anders') return null;
  const m = other.replace(/\s|€/g, '').match(/^(\d{1,6})(?:[.,](\d{1,2}))?$/);
  if (!m) return null;
  const cents = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  return cents >= MIN_EUR * 100 && cents <= MAX_EUR * 100 ? cents : null;
}

const TURNSTILE_ACTION = 'doneren';

/** Zelfde controle als in contact.ts: success, de juiste action en een goedgekeurde hostname. */
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
    if (!ok) console.warn('Doneren: Turnstile afgewezen', data['error-codes'], data.action, data.hostname);
    return ok;
  } catch (err) {
    console.error('Doneren: Turnstile-controle mislukt', err);
    return false;
  }
}

interface MolliePayment {
  id: string;
  status: string;
  amount: { value: string; currency: string };
  description: string;
  createdAt: string;
  paidAt?: string;
  method?: string | null;
  metadata?: { naam?: string; email?: string; lang?: Lang } | null;
  _links?: { checkout?: { href: string } };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const form = await request.formData();
  const lang: Lang = form.get('lang') === 'en' ? 'en' : 'nl';
  const t = text[lang];
  const origin = new URL(request.url).origin;
  // Honeypot: bots gaan stilletjes naar het formulier terug, er wordt niets aangemaakt.
  if (form.get('website')) return Response.redirect(`${origin}${t.backHref}`, 303);

  const naam = field(form, 'naam', 200).replace(/[\r\n]+/g, ' ');
  const email = field(form, 'email', 254);
  if (!naam || !EMAIL_RE.test(email)) return page(lang, 400, t.checkTitle, t.check);

  const cents = parseAmount(field(form, 'bedrag', 20), field(form, 'bedrag_anders', 20));
  if (cents === null) return page(lang, 400, t.amountTitle, t.amount);

  const hostnames = new Set((env.TURNSTILE_HOSTNAMES ?? '').split(',').map((h) => h.trim()).filter(Boolean));
  if (!env.MOLLIE_API_KEY || !env.TURNSTILE_SECRET_KEY || hostnames.size === 0) {
    console.error('Doneren: ontbrekende variabelen (Mollie of Turnstile)');
    return page(lang, 500, t.errorTitle, t.failed);
  }

  const token = String(form.get('cf-turnstile-response') ?? '');
  if (!(await turnstileOk(token, env.TURNSTILE_SECRET_KEY, hostnames, request.headers.get('CF-Connecting-IP')))) {
    return page(lang, 403, t.botTitle, t.bot);
  }

  let payment: MolliePayment;
  try {
    const res = await fetch(MOLLIE, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.MOLLIE_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        amount: { currency: 'EUR', value: (cents / 100).toFixed(2) },
        description: t.description,
        redirectUrl: `${origin}${t.thanksPath}`,
        cancelUrl: `${origin}${t.backHref}`,
        locale: t.locale,
        metadata: { naam, email, lang },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Mollie ${res.status}: ${await res.text()}`);
    payment = (await res.json()) as MolliePayment;
  } catch (err) {
    console.error('Doneren: betaling aanmaken mislukt', err);
    return page(lang, 502, t.errorTitle, t.failed);
  }

  const checkout = payment._links?.checkout?.href;
  if (!checkout || !PAYMENT_ID_RE.test(payment.id)) {
    console.error('Doneren: onverwacht antwoord van Mollie', payment.id);
    return page(lang, 502, t.errorTitle, t.failed);
  }

  return new Response(null, {
    status: 303,
    headers: {
      location: checkout,
      'cache-control': 'no-store',
      'set-cookie': `${COOKIE}=${payment.id}; Path=${COOKIE_PATH}; Max-Age=86400; HttpOnly; Secure; SameSite=Lax`,
    },
  });
};

/** Status en gegevens van de betaling uit het cookie, voor het betalingsbewijs op de bedankpagina. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const id = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((c) => c.trim().split('='))
    .find(([k]) => k === COOKIE)?.[1];
  if (!id || !PAYMENT_ID_RE.test(id)) return json(404, { status: 'unknown' });
  if (!env.MOLLIE_API_KEY) return json(500, { status: 'error' });

  try {
    const res = await fetch(`${MOLLIE}/${id}`, {
      headers: { authorization: `Bearer ${env.MOLLIE_API_KEY}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404) return json(404, { status: 'unknown' });
    if (!res.ok) throw new Error(`Mollie ${res.status}: ${await res.text()}`);
    const p = (await res.json()) as MolliePayment;
    return json(200, {
      status: p.status, // open | pending | authorized | paid | canceled | expired | failed
      id: p.id,
      amount: p.amount.value,
      currency: p.amount.currency,
      description: p.description,
      createdAt: p.createdAt,
      paidAt: p.paidAt ?? null,
      method: p.method ?? null,
      naam: p.metadata?.naam ?? '',
      email: p.metadata?.email ?? '',
    });
  } catch (err) {
    console.error('Doneren: status ophalen mislukt', err);
    return json(502, { status: 'error' });
  }
};

export const onRequest: PagesFunction<Env> = async () =>
  new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET, POST' } });
