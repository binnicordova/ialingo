# Architecture

iaLingo follows **domain-driven design** with a strict layering rule: code may only depend on layers *below* it in this list.

```
app (routes)  →  presentation  →  state (Jotai)  →  application  →  domain
                      ↘                ↘                ↗
                        infrastructure (content data, Expo adapters)
```

| Layer | Folder | Knows about | Never imports |
| --- | --- | --- | --- |
| Routes | `src/app` | presentation screens | domain, state internals |
| Presentation | `src/presentation` | state atoms, domain types | storage, Expo APIs (except UI modules) |
| State | `src/state` | application commands, ports | React components |
| Application | `src/application` | domain | React, Expo, Jotai |
| Domain | `src/domain` | nothing but itself | anything else |
| Infrastructure | `src/infrastructure` | ports and domain types | presentation |

## Domain (bounded contexts)

| Context | Files | Responsibility |
| --- | --- | --- |
| Curriculum | `domain/curriculum/*` | Worlds, words, sentences, **stories**, **songs**, levels, lesson plans (learn × n → story → song → speak → review → boss), the **lesson generator** (12 exercise types, distractors with unique pictures and words, deterministic seeds), the **Word Gym** generator (`generatePracticeLesson`, lesson id `gym`), `gapLine` for missing-word exercises, answer evaluation, unlock rules |
| Learning | `domain/learning/*` | **Leitner spaced repetition** (a box is gained only on a *due* review, see ADR 0006), the lesson session (a missed exercise is re-queued once; only the first attempt is scored), stars and progress (lessons and practice sessions), the **sticker album**, and **pronunciation scoring** (`pronunciation.ts`: normalization, phonetic folding, edit distance, verdicts) |
| Play | `domain/play/*` | Play Park rules: unlock after 6 words, daily game-berry cap, Bubble Pop rounds, the Memory Match board (flip, match, mismatch, solved) |
| Quests | `domain/quests/*` | Daily quest board (3 per day, "lessons" always included, deterministic by day), progress, chest, day rollover without penalty |
| Profiles | `domain/profiles/*` | Family profile index (up to 4, ids p1–p4, never removes the last), validation of the stored index |
| Voice | `domain/voice/*` | Voice diary rules: one postcard per week, keep the first 2 plus the 10 newest |
| Pets | `domain/pets/*` | Species blueprints, owned pets (XP, happiness with a floor so pets are never sad), the leveling curve and growth stages, the collection (eggs, hatching, active pet), accessories |
| Economy | `domain/economy/*` | Berries wallet (never negative), lesson rewards formula |
| Wellbeing | `domain/wellbeing/*` | Daily play budget with a midnight rollover and parent-granted extra time |
| Parental | `domain/parental/*` | Multiplication gate (factors 6–9) |
| Achievements | `domain/achievements/*` | Badge conditions → rewards (eggs or berries) |
| Game | `domain/game/*` | `GameState` aggregate root, the content catalog index, and **save snapshot restore and migrations** (every field validated, corrupt data falls back to defaults) |

All domain code is pure TypeScript: no I/O, no clock, no randomness except a seeded RNG passed in. This keeps it deterministic and unit-testable.

## Application

`src/application/commands.ts` holds every use case as a pure function:

```ts
(state: GameState, input, ctx: { today, content }) => { state: GameState, events: GameEvent[] }
```

Examples: `completeOnboarding`, `finishLesson` (stars → mastery → berries → pet XP → boss egg → badges → world unlocks; the Word Gym id `gym` updates mastery and counts a practice session without storing a lesson record), `finishMiniGame` (capped berries and pet XP, never mastery), `claimQuestChest`, `feedPet`, `buyAccessory`, `adoptPet`, `hatchEgg`, `claimDailyGift`, `recordPlayTime`, `startDay` (also rolls over quests and Play Park counters), `resetGame`.

**Quests are cross-cutting**: `trackQuests(result, ctx)` maps any command's events (`lesson-completed`, `pet-fed`, `mini-game-finished`) to quest progress and emits `quest-completed`. The state layer's `run()` applies it after every command, so no command has to know about quests. `availableQuestKinds` only offers quests the child can do today (no Word Gym quest before any word is met).

Events (`application/events.ts`) such as `pet-leveled-up`, `egg-earned` and `achievement-unlocked` let the UI celebrate without diffing state.

**Ports** (`application/ports.ts`) describe side effects: `GameRepository` (per-profile saves and the profile index), `SpeechService` (TTS), `SpeechRecognitionService` (capability for a language, including the Android offline model status, offline model download, permission, listen), `VoiceStore` (private postcard files), `SoundEffectsService`, `HapticsService`, `Clock`. `createNoopServices()` is the in-memory test double; it can simulate a recognizer.

Commands that need a side effect emit an event instead of doing I/O. For example, `voice-files-removed` is emitted by `deleteVoicePostcard`, by turning the diary off, or by a reset; the state layer then deletes the files.

## State (Jotai, atomic)

- `core.ts`: `gameStateAtom` (the single saved snapshot), `servicesAtom` (dependency injection), `contentAtom`, `todayAtom` (recomputed on app resume), `pendingEventsAtom` (celebration queue).
- `selectors.ts`: small derived read atoms (`activePetAtom`, `worldViewsAtom`, `statsAtom`, `screenTimeAtom`…). A component re-renders only when its slice changes.
- `actions.ts`: write-only action atoms. Each runs one application command, stores the new state, and queues its events. Side-effect atoms (`speakAtom`, `playSfxAtom`, `hapticAtom`) apply the parent's settings in one place.
- `lesson.ts`: the transient lesson being played (not persisted: an interrupted 3-minute lesson simply restarts).
- `profiles.ts`: profile summaries, `switchProfileAtom` / `addProfileAtom` / `deleteProfileAtom` (async: flush the save, load the other child, update the index).
- Speaking: `recognitionAtom` (capability and permission, probed at boot), `speakModeAtom` ('recognition' or 'self-check', from capability plus parent settings), `listenAtom`, `requestMicPermissionAtom`.
- Voice diary: `savePostcardAtom`, `deletePostcardAtom`, `canRecordPostcardAtom`.
- Practice and play (v1.2): `wordGymAtom`, `albumAtom`, `playParkAtom`, `playWordsAtom`, `questsAtom` (rolled over for today even before `startDay` runs), `finishMiniGameAtom`, `claimQuestChestAtom`. `startLessonAtom('gym')` builds a Word Gym session.
- Offline model (Android): `refreshRecognitionAtom`, `downloadOfflineModelAtom`.
- `bootstrap.ts`: loads and restores the save, starts the day, then **autosaves** through `store.sub(gameStateAtom)` (debounced 400 ms, flushed when the app goes to the background).

```
tap → action atom → command(state) → { state, events } → gameStateAtom → selectors → UI
                                                     ↘ pendingEventsAtom → CelebrationOverlay
gameStateAtom ──store.sub──▶ debounced repository.save() (AsyncStorage)
```

## Presentation

- **Screens** (`presentation/screens`): Welcome (onboarding), Profiles ("Who's playing?"), Home (map with level headers, the quest card and the Gym / Album / Park tiles), World, Lesson (player + results), **Gym**, **Album**, **Park**, **MiniGame** (Bubble Pop, Memory Match), Pets, Pet room, Hatch, Guides, Badges, Certificates, Postcard (voice diary recorder), Parents (gate + dashboard: progress, settings, players, speaking with the offline model helper, voice diary), Bedtime.
- **Exercises** (`presentation/exercises/ExerciseViews.tsx`, `SpeakAndStoryViews.tsx`, `SongViews.tsx`): one view per exercise type. Audio plays automatically; the instruction is spoken (in the child's language) the first time each type appears in a lesson (`hooks/use-exercise-intro.ts`). `SpeakView` switches between recognition (mic button, live transcript, 3 attempts; the parental gate comes before the OS permission prompt) and self-check. `SongView` chants line by line (guide voice slightly slower and higher, a clap, an echo pause sized to the line, a safety timer if TTS never reports the end).
- **Art:** `art/PetPortrait.tsx` and `art/CharacterAvatar.tsx` draw SVG from the same data blueprints used by the 3D models, so lists stay cheap (no WebGL context per card).
- **3D** (`presentation/three`): `ThreeStage` hosts three.js on expo-gl; `pet-model.ts` builds a pet rig from a blueprint; `accessory-model.ts`, `egg-model.ts`; `pet-scene.ts` is the animation state machine (idle breathing, blinking, ear twitches, tail wag, plus jump / spin / eat / love / wobble / hatch). See ADR 0001.
- **i18n** (`presentation/i18n`): typed dictionaries. Every locale must have every key (compile-time check).

## Testing

| Suite | What it proves |
| --- | --- |
| `tests/unit/curriculum` | Balanced chunking, deterministic generation, valid options, cards before tests, reviews of seen words, answer evaluation |
| `tests/unit/learning` | Leitner boxes, due dates, re-queue-once rule, stars, progress |
| `tests/unit/pets` | Leveling formula, stages, care, decay floor, collection rules |
| `tests/unit/rules` | Economy, screen time, parental gate, RNG, days, save restore and repair |
| `tests/unit/content` | Catalog integrity: unique ids, emoji unique per world, every reference resolves, every lesson of every world generates |
| `tests/integration/game-flow` | A child's journey on the real content: onboard → lessons → unlock → boss egg → hatch → feed → shop → daily gift → reset; v1.2: Word Gym payout, Play Park cap, quests from events, the chest, available quests, v1.1 save compatibility |
| `tests/integration/state` | The Jotai wiring: boot, onboard, play a whole lesson, autosave and restore; **profiles** (switch, restart, delete); **voice diary** opt-in and deletion; **speak mode** with and without a recognizer |
| `tests/unit/learning/pronunciation` | Normalization, phonetic folding, verdicts for words and sentences |
| `tests/unit/profiles` | Profile index rules and voice diary retention |
| `tests/unit/infrastructure` | The speech-recognition adapter against a fake native module (results, silence, denial, timeout, Expo Go, Android offline model status and download) |
| `tests/unit/play` | Play Park cap and rollover, Bubble Pop rounds, a full Memory Match game, quest boards, chest, album states, practice sessions |
| `tests/unit/content/store-metadata` | Store listing limits (App Store, Google Play), Kids age band, and that every number in the descriptions is the real one |
| `scripts/qa-walkthrough.cjs` | Visual evidence: drives the real UI in Chromium and saves screenshots |

## Adding things

- **A world:** add a `defineWorld({...})` block (compact rows) and a reward pet. The tests will tell you if any reference is missing.
- **A pet:** add one `PetSpecies` with a blueprint (body, colors, ears, tail, extra, pattern, eyes).
- **An exercise type:** add a variant to `Exercise` and its `evaluateAnswer` case, a builder slot in the generator, and one view. The compiler's exhaustive switches point to every place to update.
- **A UI language:** add the locale to `SUPPORTED_LOCALES`, a dictionary in `strings.ts`, and translations in content rows.

## Builds

- **Expo Go:** `npm run start:go`. Every module except speech recognition is available, and speaking falls back to self-check.
- **Development build:** `expo-dev-client` plus `expo-speech-recognition` (config plugin sets iOS usage strings, Android `RECORD_AUDIO` and speech-service package queries). `eas.json` has development / development-simulator / preview / production profiles. `ios/` and `android/` are generated by `npx expo prebuild` and are not committed.
