# ADR 0009: One journey map, jump challenges and a minimal tabbed home

- **Status:** Accepted
- **Date:** 2026-11-07

## Context

The v1.3 home stacked a hero card, the quest card, three activity tiles, six round shortcuts and a list of worlds; lessons lived one screen deeper, on each world's page. Compared side by side with Duolingo on an Android phone (`design/exercise-experience.md`, section 5), three things were missing: every unit and lesson on **one** scrolling path with a sticky unit banner, a way for a child who already knows the words to **jump ahead** ("¿Saltar aquí?"), and a **minimal** home where secondary features live in tabs. The world pages also re-derived lesson status in the UI ("current" = first unlocked lesson without stars), which disagreed with the home's own rule.

## Decision

1. **The journey is a domain concept.** `domain/curriculum/journey.ts` builds, from the worlds and the learner's progress, every world (`JourneyUnit`) and every lesson (`JourneyStep`) with a status (`done`, `current`, `open`, `locked`) taken only from the unlock policy, plus the single `current` lesson. The home map and a world's page both draw it (`journeyAtom`, `journeyUnitFor`); `LessonPath` no longer decides anything.
2. **Jump challenges (Duolingo's "jump here", without its pressure).** Any locked world can be tried. The challenge (`generateJumpChallenge`, lesson id `jump-<worldId>`) asks 12 exercises over the words of the worlds being skipped (one word from each in turn), four options per pick, no speaking (a pass must not depend on the microphone or on self-check). It is passed with `JUMP_TUNING.passAccuracy` (0.8) first-try accuracy. There are no hearts, no timer and no cost; a near miss says "Great try!" and changes nothing but mastery.
3. **What a pass does.** `finishJumpChallenge` adds the world to the new persisted `progress.jumpedTo`; the unlock policy opens a world when it, or any later world, is in that list. Skipped lessons stay unplayed (no stars) and the skipped worlds' boss eggs must still be won by playing (Pillar 2: pets are proof of progress). The pass pays like a lesson plus a one-time `jumpPassBonusBerries`. "Current" starts scanning from the furthest jumped world, so the child is not sent back to what they skipped.
4. **A minimal home with tabs.** Expo Router JavaScript tabs (`src/app/(tabs)`) with a picture-first `KidTabBar`: Learn (the map), Play (Word Gym, Play Park, sticker album), Quests (quests, chest, daily gift), Pets, Me (badges, friends, certificates, players, grown-ups). The Learn tab keeps one line on top (the pet's level, the gift when available, berries) and the map. Lessons and other screens still push above the tabs on the root stack; URLs are unchanged (`/home`, `/pets`).
5. **The map is virtualized.** 37 worlds and about 330 nodes would be heavy as one ScrollView of SVG. Every world has a fixed height (`pathHeight`), so `JourneyMap` is a `FlatList` with `getItemLayout`; lesson cards open above or below a node so they always stay inside their world's bounds (Android only delivers touches inside a view).

## Consequences

- New persisted field `progress.jumpedTo`, defaulted in `createProgress` and validated (strings, de-duplicated) in `restoreGameState`; older saves load with `[]`.
- New lesson kind `jump` and event `jump-finished`; the compiler listed every place to update (labels, economy).
- `lessonViewsFor` is gone; `finishLesson` and `finishJumpChallenge` share `rewardLearner` and `settleLearning`.
- The QA walkthrough starts lessons from the map's current node and visits the tabs.
