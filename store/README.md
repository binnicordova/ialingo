# Store listing kit (v1.2)

Everything needed to publish iaLingo in the App Store and Google Play, in English, Latin American Spanish, Spain Spanish and Brazilian Portuguese.

| File | What it is |
| --- | --- |
| `store.config.json` | App Store metadata in [EAS Metadata](https://docs.expo.dev/eas/metadata/) format: titles, subtitles, descriptions, keywords, release notes, categories, age rating and Kids age band. `eas.json` points `submit.production.ios.metadataPath` here. |
| `google-play/listings.json` | Google Play listing text per locale (title, short and full description, what's new). Play has no EAS Metadata support, so paste it into Play Console or use it with a Play publishing tool. |
| `google-play/data-safety.md` | Answers for Play's Data safety, target audience, permissions and content rating forms. |
| `privacy-policy.md` | Parent-facing privacy policy (en, es, pt), linked as the privacy policy URL. |

`tests/unit/content/store-metadata.test.ts` checks every store character limit and that the numbers in the descriptions match the real content (worlds, words, sentences, stories, songs, pets).

## Before the first submission

1. **Make the privacy policy URL public.** `privacyPolicyUrl` points to `store/privacy-policy.md` on GitHub, which only works if the repository is public. Otherwise publish that file somewhere public (GitHub Pages, a small site) and update the URL in `store.config.json`.
2. **Add the App Review contact** under `apple.review` (`firstName`, `lastName`, `email`, `phone`) locally before `eas metadata:push`. It is personal data, so it is not committed here. No demo account is needed (there is no login).
3. Push the Apple metadata with `eas metadata:push` (it validates the file against the schema first), then upload screenshots in App Store Connect.
4. In Play Console, fill **App content** with `google-play/data-safety.md`, then paste `google-play/listings.json`.

## Apple App Privacy ("nutrition label")

Answer **"No, we do not collect data from this app."** That is accurate because:

- there are no accounts, analytics, ads, crash reporters or network calls of our own;
- progress, voice diary recordings and settings stay on the device;
- speech recognition is done by the OS, on the device by default. Only text comes back, and the app scores it and discards it. Online recognition is a parent opt-in and is processed by Apple under Apple's terms.

## Kids Category checklist (App Store Review Guidelines 1.3 and 5.1.4; Google Families Policy)

- [x] Age band: **6–8** (`kidsAgeBand: SIX_TO_EIGHT`). The core audience is 7–9; 6–8 is the closest band, and Google Play targets both 6–8 and 9–12.
- [x] No third-party analytics or advertising, and no data sent to third parties.
- [x] No links out of the app and no purchases.
- [x] **Parental gate before**: the parent area, sharing certificates and postcards, and (new in 1.2) **every microphone permission prompt**: the first speaking exercise and the first voice postcard.
- [x] Microphone use is explained to parents in the permission texts (`app.json`).
- [x] Human-readable privacy policy in the child's languages.

## Naming and claims

- Levels are described as **CEFR Pre-A1 to A2**. Don't use "Cambridge" in store text; it is a trademark and needs permission.
- Don't claim "Teacher Approved", awards or ratings until they are granted.
- Every number in the descriptions comes from the content catalog, and the store test fails if they drift.

## ASO notes per market

| Market | Title pattern | Keyword focus |
| --- | --- | --- |
| US, Canada, UK (`en-US`) | "iaLingo: English for Kids" | learn, esl, abc, vocabulary, speak, phonics, songs, stories, pets, games, spelling |
| Mexico, LATAM, US Hispanic (`es-MX`, Play `es-419`) | "iaLingo: Inglés para niños" | aprender, vocabulario, hablar, canciones, cuentos, mascotas, juegos, escuela |
| Spain (`es-ES`) | same | as above, with "colegio" instead of "escuela" |
| Brazil (`pt-BR`) | "iaLingo: Inglês para crianças" | aprender, vocabulário, falar, músicas, histórias, bichinhos, jogos, escola |

The title carries the highest-volume search ("English for kids", "inglés para niños", "inglês para crianças"). Apple keywords never repeat words already in the title or subtitle. The subtitle is the differentiator: *speaking* with *3D pets*.

## Screenshots

Generate them with the QA walkthrough, which plays the real app in a browser:

```bash
npx expo start --web --port 8081
# iPhone 6.9"/6.7" class: 430×932 at 3x = 1290×2796
QA_VIEWPORT=430x932 node scripts/qa-walkthrough.cjs production/qa/evidence/store-iphone 3
# Google Play phone (9:16): 360×640 at 3x = 1080×1920
QA_VIEWPORT=360x640 node scripts/qa-walkthrough.cjs production/qa/evidence/store-play 3
```

Double-check the accepted sizes in App Store Connect and Play Console before uploading. The iPad build (`supportsTablet: true`) also needs 13" iPad screenshots (2064×2752: `QA_VIEWPORT=1032x1376`, scale 2).

Recommended order and captions (en / es / pt):

1. **Home and map**: "A pet that grows as you learn" / "Una mascota que crece contigo" / "Um bichinho que cresce com você"
2. **Learn card**: "500+ words with pictures and audio" / "Más de 500 palabras con imagen y audio" / "Mais de 500 palavras com figura e áudio"
3. **Speaking**: "Speak English out loud" / "Habla inglés en voz alta" / "Fale inglês em voz alta"
4. **Sing-along**: "Sing a song in every world" / "Canta en cada mundo" / "Cante em cada mundo"
5. **Pet room (3D)**: "Hatch and raise 51 pets" / "Cuida 51 mascotas" / "Cuide de 51 bichinhos"
6. **Sticker album**: "Collect every word" / "Colecciona cada palabra" / "Colecione cada palavra"
7. **Play Park**: "Games with the words you learn" / "Juegos con lo que aprendes" / "Jogos com o que você aprende"
8. **Parents**: "No ads. No data. Time limits." / "Sin anuncios. Sin datos. Con límite de tiempo." / "Sem anúncios. Sem dados. Com limite de tempo."
