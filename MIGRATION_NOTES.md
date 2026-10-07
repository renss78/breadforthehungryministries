# Migratienotities

Bron: WordPress + Elementor (`breadforthehungryministries.nl`), uitgelezen via de REST API op 7 oktober 2026.
Alle Nederlandse tekst is **verbatim** overgenomen. Onderstaande punten zijn dingen die er onjuist, inconsistent
of onvolledig uitzien. **Niets hiervan is stilletjes aangepast** — beslis zelf wat er moet gebeuren.

## Inhoud die er verkeerd of inconsistent uitziet

1. **Kenia-kaart op de homepage toont tekst over Oeganda.** De tekst begint met "In Oostelijk Oeganda, rondom Bukobo…" en noemt "15.000" gelovigen. Overgenomen zoals op de oude site (`src/pages/index.astro`, met een opmerking bij de kaart).
2. **Tegenstrijdige Oeganda-cijfers.** De pagina Oeganda/homepage noemen "meer dan 15.000" gelovigen; de pagina Oeganda zelf en het nieuwsbericht "Nieuwsupdate Oeganda" noemen 68.000 geregistreerde bekeerlingen (en 33.000 kinderen).
3. **"Leidersteam" op de homepage** gaat over het Oegandese leidersteam, niet over het Bestuur — maar de knop "Meer info" linkt naar *Het Bestuur*.
4. **Vincent van Geerestein ontbreekt op "Het Bestuur".** Hij staat wel in het ANBI-profiel (penningmeester en contactpersoon) en wordt genoemd op de Kenia-pagina. Er is geen foto of biografie van hem.
5. **Typefouten in de brontekst (ongewijzigd gelaten):** "ondersteunt" (moet: ondersteund), "te planeten" (planten), "invulling te geven.De tijd" (spatie ontbreekt), "bisshops", "Jaarlijks vind een groot event" (vindt), "Kongo", "Ginja" (waarschijnlijk Jinja), "Bukkobo" / "Bukobo" (twee spellingen), "minstry team", "Dit heeft geresulteerd is zeven gezonde gemeenten" (in), "Niet alleen in Kenia maar ook in Sudan, Kongo en Burundi.Jaarlijks" (spatie ontbreekt), "Die stichting met name gericht op…" (ANBI, werkwoord ontbreekt), "kosten- plaatje" en "aan- spreekt" (afbrekingsstreepjes uit de opmaak).
6. **Sponsoring:** "aan- spreekt\*" heeft een asterisk zonder voetnoot. Het IBAN staat op twee manieren (`NL11RABO 0317 2284 63` op Sponsoring, `NL11RABO0317228463` in het ANBI-profiel) — zelfde nummer. Het bedrag in de tekst is "€ 35" (Sponsoring) en "€35" (overal elders).
7. **Sponsoring-projecten:** de prijzen zitten *in* de afbeeldingen (`2025/11/2.png` t/m `7.png`). `2025/11/1.png` (bluetooth-speaker) staat in de mediabibliotheek maar niet op de pagina; niet overgenomen. De alt-teksten geven de tekst uit de afbeeldingen weer.
8. **Welkom-bericht** heeft slug `hello-world` (titel "Welkom op onze nieuwe website", 27 sep 2025, tekst begint "Welkom op onze vernieuwde website"). Overgenomen als nieuwsbericht.
9. **Media-pagina:** "Foto's Kenia" is een deelverzameling van dezelfde foto's als "Foto's Oeganda" (o.a. de Oegandese vlag). Overgenomen zoals het is.
10. **Omslagfoto's van nieuwsberichten** zijn deels Canva-plaatjes ("Ontwerp zonder titel", "News Posts") en deels hergebruikt: "Oogsttijd in Oeganda" en "Nieuwsupdate Oeganda" delen dezelfde omslag, en de twee Kenia-berichten gebruiken beide een bestand "News-Posts.png".
11. **Alt-teksten** in de oude site waren automatisch gegenereerde bestandsnamen ("whatsapp image 2026 02 09…"). In nieuwsberichten staat nu een generieke alt ("Foto bij ‘<titel>’"); beschrijvende alt-teksten per foto zijn nog te schrijven. Omslagfoto's hebben `coverAlt: ""` (decoratief).
12. **Contactpagina:** alleen e-mail en telefoon; geen postadres. De ANBI-pagina noemt Zwijndrecht als statutaire zetel.
13. **Excerpts van berichten** zijn de automatische WordPress-uittreksels (afgekapt op ±55 woorden). Het component voegt "…" toe als de tekst midden in een zin stopt.
14. **De bijbeltekst op de homepage** staat op de oude site als `'Zij hoeven niet weg te gaan, Geef gij hun te eten'`; de Oeganda-pagina schrijft "geeft gij hun te eten" (kleine letter, "geeft"). Homepage overgenomen zoals die was.

## Bewuste (technische) afwijkingen van de oude site

- **Koppen** stonden in HOOFDLETTERS ("OPWEKKING", "NIEUWE GEMEENTEN"); nu zinshoofdletters voor leesbaarheid. Woorden zijn gelijk.
- **Knoppen:** "STEUN ONZE MISSIE", "MEER INFO" → "Steun onze missie", "Meer info". Extra UI-teksten die niet op de oude site stonden: "Steun ons" (header), "Lees ons nieuws", "Alle nieuws", "Lees verder", "Naar de inhoud" (skiplink), paginering en de footer-tekst "Jezus zichtbaar maken in woord en daad, gedreven door Gods liefde." (letterlijk uit het Welkom-bericht).
- **Datums:** "February 10, 2026 | by admin" → "10 februari 2026" (geen auteur).
- **Menu:** gegroepeerd in dropdowns (*Projecten*: Oeganda, Kenia, Media; *Over ons*: Over ons, Het Bestuur, ANBI Profiel). Home bereikt men via het logo.
- **Donatieplugin-pagina's** (`/donor-dashboard/`, `/donation-confirmation/`, `/donation-failed/` — leeg of Engelstalig) zijn niet gemigreerd; redirect naar `/sponsoring/`.
- **WordPress-archieven** (`/category/*`, `/author/*`, `/feed/`) bestaan niet meer; redirect naar `/nieuws/` (`public/_redirects`).
- **Reactiesysteem** (`#respond`) van WordPress is vervallen.
- **Video's:** `WhatsApp-Video-2026-01-14-at-22.53.39.mp4` (45 MB) en `…22.54.34.mp4` (36 MB) waren groter dan de limiet van Cloudflare Pages (25 MB per bestand) en zijn herencoded (H.264, crf 28, 1280px breed max). Overige video's zijn ongewijzigd (totaal ca. 100 MB in `public/media/video/`).
- **Hero-foto homepage:** de oude site had geen duidelijke hero-foto; gekozen is de tentenfoto van "Oogsttijd in Oeganda" (1024 px breed, dus iets zacht op grote schermen). Vervang `src/assets/images/2025-10-News-Posts-2.png` door een foto met hogere resolutie voor het beste resultaat.
- **Homepage missieregel:** op verzoek gewijzigd van "Onze missie is helder: Jezus zichtbaar maken door praktische hulp en geestelijke opbouw." in "Als Bread for the Hungry Ministries voelen wij ons geroepen om uit te reiken naar mensen die verlangen naar een hoopvolle toekomst." (beide zinnen komen uit de oude Over ons-pagina; die pagina zelf is ongewijzigd).
- **SEO-labels:** de eyebrow boven de titel op Oeganda en Kenia is veranderd van "Projecten" in "Zendingswerk" / "Bijbelschool en zendingswerk"; titels en meta descriptions zijn zoekwoordgericht herschreven (alleen in `<head>`, niet zichtbaar). Overweeg later ook de h1's "Oeganda"/"Kenia" te verduidelijken (bijv. "Zendingswerk in Oeganda") — dat is zichtbare tekst en is dus niet zonder jouw akkoord gedaan.
- **Contactformulier** is een dummy (zie README).
