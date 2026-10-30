# Bread for the Hungry Ministries

Statische Astro-site op Cloudflare Pages, tweetalig (Nederlands op de root, Engels onder `/en/`).
Structuur, commando's en werkwijzen staan in [README.md](README.md); lees die eerst.

## Vaste regels
- Schrijf "Oeganda" in Nederlandse tekst en "Uganda" in Engelse tekst.
- Gebruik voor nieuwe stukken de semantische kleuren uit de README.
- Controleer wijzigingen met `npm run check` en `npm run build`.
- Secrets horen nooit in de repo (`.dev.vars`, GitHub- of Cloudflare-secrets).

## Nieuwsbericht vanuit een GitHub-issue
Een issue met het label `nieuwsbericht` bevat de aanlevering. De workflow heeft de foto's al als
`src/assets/images/issue-<issuenummer>-<volgnummer>.<ext>` en de video's als
`public/media/video/issue-<issuenummer>-video-<volgnummer>.<ext>` in de werkmap gezet; download ze niet opnieuw.

1. Volg de README-sectie "Een nieuwsbericht toevoegen": een Nederlands bericht in `src/content/news/`,
   een Engels bericht in `src/content/news-en/` en de koppeling in `newsSlugs` (`src/i18n/index.ts`).
2. Neem de aangeleverde Nederlandse tekst ongewijzigd over, op opmaak en duidelijke typefouten na, tenzij het veld
   Opmerkingen om meer taalverbetering vraagt. Verzin nooit feiten, namen, aantallen of citaten en vul de tekst niet inhoudelijk aan.
3. De aanlevering is altijd Nederlands; vertaal die zelf naar het Engels, ook als het issue alleen Nederlands bevat.
   Het Engelse bericht is een getrouwe vertaling: vertaal `title`, `excerpt`, de tekst, de alt-teksten en de slug.
4. `issue-<nr>-1` is de omslag, tenzij het veld Opmerkingen een andere foto aanwijst. De volgnummers volgen de volgorde
   van de foto's in het issue. De overige foto's komen in de tekst, bij meerdere in een `<div class="gallery">`.
   Plaats elke video met `<video controls preload="metadata" playsinline src="/media/video/<bestand>#t=0.1"></video>`, in beide talen.
   Meerdere video's komen samen in een eigen `<div class="gallery">`, direct onder de fotogalerij, met lege regels rond elke video.
   Noemt het veld Opmerkingen een bestand dat al in `public/media/video/` staat, plaats dat dan op dezelfde manier.
   Gebruik elke foto en video. Alt-tekst: `Foto bij ‘<titel>’` in het Nederlands, `Photo for ‘<title>’` in het Engels.
5. Gebruik als `date` de opgegeven datum in de vorm `JJJJ-MM-DD`, of de aanmaakdatum van het issue als er geen datum is opgegeven. Leid de slug af van de titel en maak `excerpt` een korte samenvatting
   uit de aangeleverde tekst.
6. Draai `npm run check` en `npm run build` en los fouten op.
7. Meld in de reactie op het issue wat is gemaakt, welke keuzes in de vertaling opvallen en wat ontbreekt.

Stop en meld het op het issue als er geen foto is (de omslag is verplicht) of als de tekst ontbreekt.
Pdf's worden niet verwerkt: meld ze op het issue als ze zijn aangeleverd.
Regels `telegram-file: <id>` komen van de Telegram-bot en zijn door de workflow al als bestand neergezet.
Meld ook elke bijlage-link waarvoor geen bestand is neergezet; een video kan dan handmatig in `public/media/video/`
worden geüpload en in Opmerkingen worden genoemd.
Wijzig bij een nieuwsbericht geen andere bestanden en merge nooit zelf.
