# Telegram-bot voor nieuwsberichten

Via Telegram een nieuwsbericht aanleveren. De bot maakt een GitHub-issue met het
label `nieuwsbericht`; de workflow `.github/workflows/claude-nieuwsbericht.yml`
doet de rest. Publiceren blijft een merge op GitHub.

De bot draait als Pages Function van deze site, op `POST /api/telegram`
([`functions/api/telegram.js`](../functions/api/telegram.js) → [`bot.js`](bot.js)).
Hij stond eerder in de losse repo `telegram-website-bot-breadforthehungry`.

| Commando | Doel |
|---|---|
| `/nieuw` | Start een concept |
| `/opmerking <tekst>` | Extra instructie voor Claude |
| `/klaar` | Maak het issue aan |
| `/annuleer` | Gooi het concept weg |
| `/status` | Toon lopende berichten |
| `/wijzig <tekst>` | Plaats een `@claude`-correctie op het nieuwste bericht |

De eerste tekstregel is de titel en de eerste foto is de omslag. Bestanden mogen
maximaal 20 MB zijn (limiet van Telegram-bots).

## Contract met de workflow

Bot en workflow staan nu in dezelfde repo; wijzig ze samen
(`bot.js`, `.github/workflows/claude-nieuwsbericht.yml`,
`.github/scripts/download-attachments.mjs` en `CLAUDE.md`):

- Het issue krijgt het label `nieuwsbericht`.
- De issue-body bevat de koppen `### Titel`, `### Datum`, `### Tekst`, `### Foto's en video's` en `### Opmerkingen`.
- Elk bestand staat op een eigen regel `telegram-file: <id>`, foto's eerst.
- Er zijn maximaal 12 bestanden.
- De GitHub-token is van `renss78`; de workflow start alleen voor die gebruiker.

## Ontwikkelen

```powershell
npm test
npx wrangler pages functions build --outdir $env:TEMP\bread-functions
```

## Instellingen

- **D1** `bread-telegram-bot` (binding `DB`) staat in [`wrangler.toml`](../wrangler.toml).
  Nieuwe database nodig? `npx wrangler d1 create bread-telegram-bot`, id in
  `wrangler.toml`, daarna `npx wrangler d1 execute bread-telegram-bot --remote --file telegram/schema.sql`.
- **Secrets** in het Pages-project, nooit in de repo:

  ```powershell
  npx wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name breadforthehungryministries
  npx wrangler pages secret put TELEGRAM_WEBHOOK_SECRET --project-name breadforthehungryministries
  npx wrangler pages secret put GITHUB_TOKEN --project-name breadforthehungryministries
  npx wrangler pages secret put ALLOWED_USER_ID --project-name breadforthehungryministries
  ```

  `GITHUB_TOKEN`: fine-grained, van `renss78`, alleen `renss78/breadforthehungryministries`,
  *Issues: Read and write* en *Pull requests: Read and write* (`/wijzig` reageert ook op een pull request).
- **Actions-secrets** van deze repo: `TELEGRAM_BOT_TOKEN` en `TELEGRAM_CHAT_ID`
  (voor de melding als het bericht klaar is).
- `GITHUB_REPO` staat standaard in `functions/api/telegram.js`; een variabele in
  Pages gaat voor.

## Webhook

`npm run telegram:koppel` zet de webhook op `/api/telegram` van deze site. Het
leest `TELEGRAM_BOT_TOKEN` en `TELEGRAM_WEBHOOK_SECRET` uit `.dev.vars` (staat
in `.gitignore`); dat geheim moet gelijk zijn aan het secret in Pages. Nieuw
geheim nodig? Zet het in allebei en voer het script opnieuw uit.

Sinds 3 november 2026 draait de bot hier; de losse Worker `bread-telegram-bot`
is verwijderd. De database is dezelfde gebleven.
