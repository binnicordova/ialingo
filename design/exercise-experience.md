# Exercise experience: Duolingo benchmark and the v1.4 lesson feel

A hands-on comparison, made on a Samsung SM-A266M (Android, 1080×2340) on 2026-11-07: one full Duolingo lesson (French for Spanish speakers, "Order at a café", lesson 2 of 4, 14 exercises, about 6.5 minutes) and iaLingo world 1, lesson 1 in a development build. Reference screenshots stay on the reviewer's machine and are not committed (they are third-party material).

The goal is not to copy Duolingo. It is to match its craft in the lesson loop (clarity, rhythm, feedback, celebration) and beat it on what matters for 6–10 year olds: no reading needed, no pressure, and the child's **own pet** as the star.

## 1. What Duolingo does in a lesson

| Moment | What happens | Why it works |
| --- | --- | --- |
| Path | A winding column of round, chunky nodes. The current node has a progress ring and a "Start" bubble; tapping it opens a popover card ("Lesson 2 of 4", "Continue +20 XP"). Chests and the mascot sit along the path. | The next step is always obvious; progress is spatial. |
| Exercise layout | Fixed skeleton: close × and progress bar on top, a tag ("NEW WORD", "PREVIOUS MISTAKE"), a bold instruction, the content, and **one button pinned at the bottom** ("Check"). A character with a speech bubble carries the audio, with a normal and a slow (turtle) replay. | The eye and thumb always know where to go. |
| Exercise types seen | Pick the picture (2×2 cards with art + word), complete the sentence (scene + blank + word bank), translate with a word bank (chips fly into lined slots; the bank keeps grey holes), pick the translation (3 rows), listen and build, match pairs (2 columns of 5). | Few interaction patterns, recombined; every chip leaves a hole so nothing reflows. |
| Correct | A green sheet slides up from the bottom: ✔ icon, a varied cheer ("Awesome!", "Good job!"), the meaning when useful, "Continue". The character in the scene reacts (cheers, dances). | Instant, readable, and the character makes it feel social. |
| In a row | "COMBO ×2 … ×12" above the progress bar. At 5 in a row the bar turns **gold**. | Momentum without punishment for the child; the bar becomes a reward. |
| Full-screen mascot | After 5 in a row, a full-screen interstitial: the owl flies in with confetti and a "+3 energy" badge, then it auto-advances (~1.5 s). | A short peak of delight that does not ask for a tap. |
| Almost right | An amber "Almost! Try again" sheet that highlights the one wrong chip and lets you retry without counting a miss. | Near misses are coached, not punished. |
| Wrong | A red sheet: "Correct answer:" with the key word in bold, "Got it". The item returns at the end. | Clear correction. |
| Mistakes round | The mascot peeks from the screen edge: "Let's fix some mistakes. No energy needed!" Retried items carry a "PREVIOUS MISTAKE" tag. | Retries are framed as a second chance. |
| Lesson complete | The mascot animates (happy tears) above a contextual headline ("A walking dictionary!"), then three stat cards count up (XP, accuracy, time). | Feels earned and personal. |
| After the lesson | 8+ screens: a cinematic sky with clouds bursting open, score milestones, a tap-to-upgrade chest (random reward), a streak flame you swipe to light, a collectible puzzle piece, an ad, a weekend challenge, quests filling, an ad-for-gems offer, a calendar prompt and a streak-goal commitment. | Strong retention, but long, random and pressure-driven. |

## 2. What we keep, what we reject

**Keep (adapted for children):** the fixed exercise skeleton with a pinned action area; varied cheers; a gentle "almost" voice; a meaning or correct-answer line; momentum shown above the progress bar with a gold bar at 5 in a row; a short, self-advancing full-screen mascot moment; the "second try" framing for retries; a winding path with an obvious current node and a popover; a complete screen with numbers that count up.

**Reject (Pillar 4, ADR 0005, Kids Category):** energy and hearts, streak flames, swipe-to-commit and streak goals, tap-to-upgrade chests (random rewards), ads and ad-for-reward offers, calendar or notification prompts, time shown as a score ("6:29, unstoppable!"), and post-lesson screen chains. iaLingo shows **one** celebration screen, then any events (level-up, egg, badge, world) one at a time.

**Beat Duolingo on:** no reading needed (pictures, spoken instructions, auto-played audio and tap-to-answer with no "Check" step for single picks); the child's own 3D pet is the mascot of every full-screen moment; a missed answer re-plays the right word aloud; slow replay for every listen; nothing is ever taken away.

## 3. iaLingo findings (before this change)

| # | Finding | Severity |
| --- | --- | --- |
| F1 | The feedback sheet is pinned to `bottom: 0` with a fixed padding, so on Android edge-to-edge the **Continue button sits under the system navigation bar** (taps near its bottom go to the system). | High |
| F2 | **Double taps advance twice.** A fast second tap on "Next" or "Continue" runs against the *next* exercise: it can mark a listen exercise wrong without the child seeing it, or skip a learn card (seen on device: "angry" was asked before its card). | High |
| F3 | Layout floats in the top half: on a 6.6" phone the bottom 40% is empty, and "Next" moves with the content height. | Medium |
| F4 | Feedback is a plain sheet: no motion on the tiles (no pop, no shake), no particles, the header pet does not react, the progress bar jumps instead of filling. | Medium |
| F5 | No momentum: answering 10 in a row feels the same as answering 1. | Medium |
| F6 | No full-screen moments in the lesson: the 3D pet appears only on the results screen. | Medium |
| F7 | Retries arrive unannounced; the child cannot tell a second try from a new question. | Low |
| F8 | The world screen is a list of cards, not a path; the current lesson is not highlighted and there is no "start here" cue. | Medium |
| F9 | The results screen is static: stars, the pet and the rewards appear at once. | Low |
| F10 | Listening has one speed; children who miss a word can only replay it at the same speed. | Low |

## 4. The v1.4 lesson feel (what this change builds)

1. **Reliable input (F1, F2).** Every answer and every "continue" names the exercise it belongs to; the state layer ignores stale ones. The sheet respects the safe area.
2. **One skeleton for every exercise (F3).** Header (close, animated progress bar, "in a row" badge, the pet), a tag ("✨ New word" / "🔁 Second try"), the instruction, the content centred in the free space, and the primary action pinned at the bottom.
3. **Feedback with weight (F4, F10).**
   - Tiles pop on a right answer and wiggle on a wrong one; matched pairs sparkle.
   - A full-screen burst of stars and confetti fires from the screen centre on every right answer (cheap Reanimated views, no GL).
   - The sheet slides up with a big icon, the guide's line, and on a miss the right answer with a speaker to hear it again.
   - The header pet hops on every right answer.
   - Every speaker gets a slow "🐢" replay.
4. **Momentum without pressure (F5).** "⭐ 3 in a row!" appears from 3; from 5 the progress bar turns gold. Missing quietly resets it: no message, nothing lost.
5. **Full-screen pet moments in 3D (F6, F7).** A three.js scene on expo-gl, with the child's own pet:
   - *In-a-row moment* every 5 in a row: a sunny sky, rotating sun rays, the pet leaps in with a spin, a burst of instanced confetti; it advances by itself after about 2 s (tap to skip).
   - *Second-try moment* before the first re-queued exercise: the pet peeks in from the side and waves ("Let's try the tricky ones again!"), no confetti.
   - Reduced motion (system or parent setting): no rays, no confetti, a soft fade and a gentle bob.
6. **A complete screen that counts up (F9).** A headline that depends on the result, stars that land one by one with a pop, the pet celebrating, and cards that count up: berries, pet XP and "correct first time".
7. **A real path (F8).** World lessons as a winding path of chunky round nodes; finished nodes turn gold with their stars, the current node pulses with a "Start!" bubble and the pet standing next to it, locked nodes are grey; tapping a node opens a popover with its words and a Start button. The view scrolls to the current node.

Tuning numbers for (4) and (5) are named constants (`LESSON_FEEL` in `domain/learning/lesson-session.ts`) and listed in `design/tuning.md`. The decision record is ADR 0008.

## 5. The home (v1.4)

Observed on the same phone on 2026-11-07: Duolingo's home is a single scrolling path. A sticky banner names the unit on screen ("STAGE 1, SECTION 3 · Talk about your family") with a guidebook button; a thin divider with the next unit's title separates units; the first node of every locked unit is a ⏩ "Jump here?" node that opens a full-screen offer (mascot, "Jump to Section 3", Start test / Not now) and a test passed with fewer than 5 mistakes; characters stand beside the path (grey while locked); a ↑ button scrolls back to the current lesson; the top bar holds four counters and a bottom bar six tabs.

**iaLingo keeps:** the single path, the sticky banner with a guidebook (the world's page: guide, words), dividers per world and a card per level, "Jump here?" on every locked world, the character beside the path (here the world's **own pet**, a "?" silhouette until the world opens), the back-to-lesson button, and a minimal top bar.

**iaLingo changes:** the jump challenge has no hearts and no cost, asks no speaking, and a near miss says "Great try!" (ADR 0009). Skipped lessons keep zero stars and skipped bosses keep their eggs (pets stay proof of progress). Five picture-first tabs instead of six (Learn, Play, Quests, Pets, Me), with no leagues, shop or ads. The child's own pet waits by the current lesson.

**Checked on the phone (2026-11-08):** the map opens on the current lesson within about half a second, the banner follows the world under it, the jump offer reads itself aloud and lists the worlds it covers, and every tab works. The Pets tab takes about 2 seconds to draw its 55 portraits the first time.
