# iaLingo 🥚✨

**Learn English with magical pets.** A voice-first learning game for children aged 6–10 (core 7–9). It runs in **Expo Go** with **no login, no ads, no purchases and no network**: all progress stays on the device.

Kids hatch an original pet, play bite-sized lessons narrated by eight guide characters, and watch the pet **grow in 3D** as they learn. Pet growth and new eggs come only from learning.

| What | Amount |
| --- | --- |
| Worlds (themes) | 26: feelings, colors, numbers, animals, food, family, body, toys, clothes, home, school, sea, weather, nature, garden, transport, actions, sports, music, shapes, time, jobs, places, fantasy… |
| English words | 393, with a picture (emoji) and Spanish / Portuguese translations |
| Sentences | 106 |
| Lessons | 155 (4 per world + review + boss, generated from data, different on every replay) |
| Exercise types | 7: learn card, listen & pick, picture & pick, true/false, match pairs, spell, build a sentence |
| Pets | 36 original pets in procedural 3D (3 starters, 26 world bosses, 7 badges) |
| Guide characters | 8 original guides, each with its own voice |
| Accessories / badges | 8 / 10 |
| UI languages | Español, Português, English |

---

## Run it in Expo Go

Requirements: Node 20+, and the **Expo Go** app on your phone (Expo **SDK 58**).

```bash
npm install
npx expo start
```

Scan the QR code with the camera (iOS) or the Expo Go app (Android). If your phone and computer are on different networks, use `npx expo start --tunnel`.

Other targets: `npm run web` (browser preview), `npx expo run:ios|android` (development build).

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Expo dev server (Expo Go) |
| `npm test` | Jest unit + integration tests (95 tests) |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint with `eslint-config-expo` (React Compiler rules) |
| `npm run verify` | typecheck + lint + tests |
| `node scripts/qa-walkthrough.cjs` | Drives the web build end to end with Playwright and saves screenshots to `production/qa/evidence/` |
| `node scripts/generate-sfx.mjs` | Re-synthesizes the sound effects (WAV, no third-party audio) |
| `node scripts/generate-icons.cjs` | Re-renders the app icon, adaptive icon, splash mark and favicon |

## How it plays

1. **Onboarding (under a minute):** pick a language → pick one of 3 eggs → tap the egg until it hatches (3D) → pick a preset name. No account, email or keyboard.
2. **Adventure map:** 26 worlds on a path. The big **Play** button always jumps straight to the next lesson.
3. **Lessons (about 3–4 min):** every English word is spoken aloud by on-device text-to-speech, so no reading is required. Instructions are spoken in the child's language by the world's guide. A missed exercise comes back once at the end. Every finished lesson earns at least one star.
4. **Rewards:** stars → berries 🍓 and pet XP. The pet levels up and grows from Baby to Junior to Grown-up. Beating a world's **boss** gives that world's pet **egg**.
5. **Pet room (3D):** drag to turn the pet; tap to make it jump, spin or show love (it says its catchphrase in English); feed it berries; dress it up with accessories; choose who joins the adventure.
6. **Healthy limits:** a parent-set daily limit (30 min by default). When it runs out, **the pet falls asleep** instead of a nagging pop-up. A grown-up can add 10 minutes behind the parental gate.

## Architecture (short version)

Domain-driven, layered, with dependencies pointing inward only:

```
src/
  app/             expo-router routes (thin: params → screen)
  presentation/    screens, components, SVG art, three.js scenes, i18n, theme
  state/           Jotai atoms: one game-state atom, derived selectors, action atoms
  application/     pure commands (state, input, ctx) → { state, events }, plus ports
  domain/          pure TypeScript rules: curriculum, learning, pets, economy, wellbeing…
  infrastructure/  content data + Expo adapters (AsyncStorage, speech, audio, haptics)
```

- **Domain** has no React or Expo imports and is fully unit-tested: the lesson generator, Leitner spaced repetition, leveling, economy, screen time, parental gate and save migrations.
- **Jotai** is the atomic state layer. The saved game is one immutable atom; components subscribe to small derived atoms; changes go through action atoms that call application commands; a store subscription autosaves (debounced).
- **3D:** three.js r187 drives an `expo-gl` GLView directly (no R3F), with procedural toon-shaded pets built from data blueprints.

More detail: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · ADRs in [`docs/adr/`](docs/adr) · tuning numbers in [`design/tuning.md`](design/tuning.md) · game brief in [`design/game-brief.md`](design/game-brief.md).

## Privacy by design

No accounts. No personal data: no names (pet names are presets), no birthdays, no voice, no photos. No analytics, ads, purchases or network calls. The only stored item is one local save (`AsyncStorage`). Microphone and location permissions are blocked in `app.json`. Parents can delete everything from the gated area. See [`docs/PRIVACY.md`](docs/PRIVACY.md).

## Adding content

Content is data. Add a world in `src/infrastructure/content/worlds-part*.ts` as compact rows (`['word', '🙂', 'es', 'pt']`); lessons, exercises and distractors are generated automatically. Add a pet as one blueprint row in `pets.ts`. `tests/unit/content/catalog-integrity.test.ts` checks every reference and generates every lesson.

## Credits

- Font: [Fredoka](https://fonts.google.com/specimen/Fredoka) (SIL Open Font License) via `@expo-google-fonts/fredoka`.
- Pictures: system emoji. Pets, characters, sounds and icons were created procedurally for this project.
- Process: studio roles and quality gates adapted from *Claude Code Game Studios* (minimal workflow: game brief, data-driven tuning, tests before systems, retained screenshot evidence). three.js practices follow the *threejs-skills* guidance (r186+ APIs: `Timer`, explicit disposal, no per-frame allocation).
