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
`src/assets/images/issue-<issuenummer>-<volgnummer>.<ext>` in de werkmap gezet; download ze niet opnieuw.

1. Volg de README-sectie "Een nieuwsbericht toevoegen": een Nederlands bericht in `src/content/news/`,
   een Engels bericht in `src/content/news-en/` en de koppeling in `newsSlugs` (`src/i18n/index.ts`).
2. Neem de aangeleverde Nederlandse tekst ongewijzigd over, op opmaak en duidelijke typefouten na.
   Verzin geen feiten, namen, aantallen of citaten en vul de tekst niet inhoudelijk aan.
3. Het Engelse bericht is een getrouwe vertaling.
4. `issue-<nr>-1` is de omslag; de overige foto's komen in de tekst, bij meerdere in een `<div class="gallery">`.
   Gebruik elke foto. Alt-tekst: `Foto bij ‘<titel>’` in het Nederlands, `Photo for ‘<title>’` in het Engels.
5. Gebruik als `date` de opgegeven datum, leid de slug af van de titel en maak `excerpt` een korte samenvatting
   uit de aangeleverde tekst.
6. Draai `npm run check` en `npm run build` en los fouten op.
7. Meld in de reactie op het issue wat is gemaakt, welke keuzes in de vertaling opvallen en wat ontbreekt.

Stop en meld het op het issue als er geen foto is (de omslag is verplicht) of als de tekst ontbreekt.
Video's en pdf's worden niet verwerkt: meld ze op het issue als ze zijn aangeleverd.
Wijzig bij een nieuwsbericht geen andere bestanden en merge nooit zelf.
