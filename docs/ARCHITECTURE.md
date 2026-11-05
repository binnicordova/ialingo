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
| Curriculum | `domain/curriculum/*` | Worlds, words, sentences, lesson plans (balanced chunks of 4 words), the **lesson generator** (7 exercise types, distractors with unique pictures and words, deterministic seeds), answer evaluation, unlock rules |
| Learning | `domain/learning/*` | **Leitner spaced repetition** (6 boxes, gentle demotion), the lesson session (a missed exercise is re-queued once; only the first attempt is scored), stars and progress |
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

Examples: `completeOnboarding`, `finishLesson` (stars → mastery → berries → pet XP → boss egg → badges → world unlocks), `feedPet`, `buyAccessory`, `adoptPet`, `hatchEgg`, `claimDailyGift`, `recordPlayTime`, `startDay`, `resetGame`.

Events (`application/events.ts`) such as `pet-leveled-up`, `egg-earned` and `achievement-unlocked` let the UI celebrate without diffing state.

**Ports** (`application/ports.ts`) describe side effects: `GameRepository`, `SpeechService`, `SoundEffectsService`, `HapticsService`, `Clock`. `createNoopServices()` is the in-memory test double.

## State (Jotai, atomic)

- `core.ts`: `gameStateAtom` (the single saved snapshot), `servicesAtom` (dependency injection), `contentAtom`, `todayAtom` (recomputed on app resume), `pendingEventsAtom` (celebration queue).
- `selectors.ts`: small derived read atoms (`activePetAtom`, `worldViewsAtom`, `statsAtom`, `screenTimeAtom`…). A component re-renders only when its slice changes.
- `actions.ts`: write-only action atoms. Each runs one application command, stores the new state, and queues its events. Side-effect atoms (`speakAtom`, `playSfxAtom`, `hapticAtom`) apply the parent's settings in one place.
- `lesson.ts`: the transient lesson being played (not persisted: an interrupted 3-minute lesson simply restarts).
- `bootstrap.ts`: loads and restores the save, starts the day, then **autosaves** through `store.sub(gameStateAtom)` (debounced 400 ms, flushed when the app goes to the background).

```
tap → action atom → command(state) → { state, events } → gameStateAtom → selectors → UI
                                                     ↘ pendingEventsAtom → CelebrationOverlay
gameStateAtom ──store.sub──▶ debounced repository.save() (AsyncStorage)
```

## Presentation

- **Screens** (`presentation/screens`): Welcome (onboarding), Home (map), World, Lesson (player + results), Pets, Pet room, Hatch, Guides, Badges, Parents (gate + dashboard), Bedtime.
- **Exercises** (`presentation/exercises/ExerciseViews.tsx`): one view per exercise type. Audio plays automatically; the instruction is spoken (in the child's language) the first time each type appears in a lesson.
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
| `tests/integration/game-flow` | A child's journey on the real content: onboard → lessons → unlock → boss egg → hatch → feed → shop → daily gift → reset |
| `tests/integration/state` | The Jotai wiring: boot, onboard, play a whole lesson through the atoms, autosave, restore on the next boot |
| `scripts/qa-walkthrough.cjs` | Visual evidence: drives the real UI in Chromium and saves screenshots |

## Adding things

- **A world:** add a `defineWorld({...})` block (compact rows) and a reward pet. The tests will tell you if any reference is missing.
- **A pet:** add one `PetSpecies` with a blueprint (body, colors, ears, tail, extra, pattern, eyes).
- **An exercise type:** add a variant to `Exercise` and its `evaluateAnswer` case, a builder slot in the generator, and one view. The compiler's exhaustive switches point to every place to update.
- **A UI language:** add the locale to `SUPPORTED_LOCALES`, a dictionary in `strings.ts`, and translations in content rows.
