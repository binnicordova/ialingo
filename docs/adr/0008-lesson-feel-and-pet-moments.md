# ADR 0008: Lesson feel, pet moments and vector emoji art

- **Status:** Accepted
- **Date:** 2026-11-07

## Context

A side-by-side session with Duolingo on an Android phone (`design/exercise-experience.md`) showed that iaLingo's lesson loop worked but felt flat: plain feedback, no momentum, no full-screen celebration in the lesson, a list instead of a path, and emoji glyphs that look different on every OS version. It also found two input bugs: the answer sheet sat under Android's navigation bar, and a fast double tap could answer the *next* exercise. Duolingo's own momentum and celebration tools include pressure mechanics (energy, streak flames, random chests) that Pillar 4 and ADR 0005 rule out.

## Decision

1. **Stale input is ignored in the state layer.** `submitAnswerAtom({ exerciseId, answer })` and `continueLessonAtom(exerciseId)` act only on the current exercise and only once per answer. The UI no longer has to be fast enough to be correct.
2. **"In a row" is a domain rule without a penalty.** `LessonSession.inARow` counts scored right answers; a miss resets it silently. `momentsBetween(before, after)` (pure) decides the full-screen moments: one every `LESSON_FEEL.inARowMoment` answers in a row, and a "second try" intro before the first re-queued exercise; none after the last exercise. Moments are queued in the transient `ActiveLesson.moments`; answers are refused while one is showing, and the next exercise mounts (and speaks) only after it.
3. **The child's own pet is the mascot of every moment.** `three/moment-scene.ts` is a second three.js scene next to `pet-scene.ts`: a vertex-colored sky dome, merged sun rays, instanced clouds and an instanced confetti burst (one draw call each, no per-frame allocation, frame-rate independent), with `cheer`, `peek` and `victory` styles. It runs in one GL context at a time (`MomentStage3D`), on the in-lesson moment and on the results screen, which replaces `PetStage3D` there. Moments fade out before unmounting so the GL view is never torn down mid-animation.
4. **Feedback is layered and cheap.** Tiles pop or wiggle (Reanimated, UI thread), a full-screen burst of views fires on right answers, the sheet springs up above the safe area, the header pet hops. None of it uses GL.
5. **Pictures are vector art.** Exercise pictures, path nodes, stars and results use `EmojiArt` (react-native-svg, already in Expo Go and the dev build) over a generated module built at development time from pinned Iconify packages: Fluent Emoji Flat (MIT) first, Noto Emoji (Apache 2.0) as a fallback, Circle Flags (MIT) for countries. Only the emoji found in the code are kept (about 850 KB of SVG text). The app makes no network requests; the art is credited in the parent area and in `THIRD_PARTY_NOTICES.md`.

## Consequences

- New presentation pieces: `components/lesson.tsx` (progress, sheet, burst, tags, motion wrappers), `components/PetMoment.tsx`, `components/LessonPath.tsx`, `screens/LessonResults.tsx`, `art/EmojiArt.tsx`, `hooks/use-calm.ts`.
- `celebrationsHeldAtom` lets a screen with its own intro hold the global celebration queue; the results screen holds it until its stars and numbers land.
- Adding content now includes `npm run emoji-art`; the emoji-art test fails otherwise.
- Rejected for children: energy or hearts, streak flames and goals, tap-to-upgrade chests, ads, time as a score, chains of post-lesson screens.
