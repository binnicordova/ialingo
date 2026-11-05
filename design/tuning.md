# Tuning knobs and formulas

All gameplay numbers live in code as named, documented constants (data-driven, never magic numbers). This page is the designer's index. Change the constant, then run `npm test`.

## Curriculum (`domain/curriculum/lesson-plans.ts`, `lesson-generator.ts`)

| Knob | Value | Rationale |
| --- | --- | --- |
| `wordsPerLesson` | 4 | Young children's working memory holds about 4 new chunks |
| Chunking | `ceil(n/4)` lessons, sizes differ by ≤ 1 | Never leaves a 1–2 word lesson (14 → 4+4+3+3) |
| Lessons per world | learn × ~4 + story + speak + review + boss | 268 lessons in total |
| `easyOptionCount` / `hardOptionCount` | 3 / 4 | Boss lessons are harder |
| `learnReviewCount` | 2 | Spaced-repetition reviews mixed into every learn lesson |
| Spell length | 3–7 letters, plus 2 distractor letters | Short plain words only |
| Learn lesson length | about 12 exercises (3–4 min) | Inside a 7-year-old's attention span |

## Spaced repetition (`domain/learning/mastery.ts`)

- Boxes 0–5. Due after `[0, 1, 2, 4, 7, 14]` days for each box.
- Correct → box + 1. Wrong → box − 1 (gentle; classic Leitner resets to box 1).
- "Learned" from box 2 and "mastered" from box 4 (shown to parents).

## Lesson scoring (`domain/learning/progress.ts`, `lesson-session.ts`)

- Accuracy = first-attempt correct ÷ scored exercises (learn cards are not scored).
- Stars: ≥ 0.9 → 3, ≥ 0.7 → 2, otherwise 1. **Never 0.**
- A missed exercise is re-queued once at the end; the retry doesn't change the score.

## Economy (`domain/economy/economy.ts`)

```
berries = 5 + 2 × stars + (perfect ? 3 : 0) + (boss ? 10 : review ? 2 : 0)
xp      = round((10 + 5 × stars + (boss ? 15 : 0)) × happinessMultiplier)
```

| Item | Cost | Lessons needed (at about 11 berries each) |
| --- | --- | --- |
| Feed a pet | 1 | — |
| Bow, flower | 20 | about 2 |
| Party hat | 25 | about 2–3 |
| Cap, scarf | 30 | about 3 |
| Glasses | 35 | about 3 |
| Headphones | 50 | about 5 |
| Crown | 80 | about 7 |
| Adopt a leftover starter | 60 | about 5–6 |
| Daily gift / welcome | +10 / +15 | — |

Berries never buy XP, eggs from worlds or badges (Pillar 2: pets are proof of progress).

## Pets (`domain/pets/leveling.ts`, `pet.ts`)

```
xpToNext(level) = 20 + 10 × (level − 1)        max level 20
stage: level 1–4 baby · 5–9 junior · 10+ grown-up   (model scale 0.75 / 0.9 / 1.05)
```

About 1 lesson reaches level 2, about 5 lessons level 5 (first growth), about 20 lessons level 10.

| Happiness knob | Value |
| --- | --- |
| Start | 80 |
| Feed | +15 (max 100) |
| Pet/play | +5 |
| Decay | −10 per day without care, **floor 50** (pets are never sad) |
| Bonus | happiness ≥ 80 → XP × 1.2 |

## Wellbeing (`domain/wellbeing/screen-time.ts`)

- Daily limit options: 10 / 15 / 20 / 30 / 45 / 60 min or none. Default 30.
- Counted in 15-second ticks only while the app is in the foreground.
- At 0 the bedtime screen is shown (the pet sleeps). A parent can add +10 min (resets at midnight).

## Parental gate (`domain/parental/gate.ts`)

- `a × b` with a and b from 6–9 (answers 36–81). A new question after each wrong answer.

## Speaking (`domain/learning/pronunciation.ts`)

| Knob | Value | Meaning |
| --- | --- | --- |
| `goodSimilarity` | 0.6 | Text or sound similarity for "good" (a gentle tip) |
| `greatTextFloor` | 0.6 | A sound-alike counts as "great" only if it is also spelled similarly |
| `sentenceGreat` / `sentenceGood` | 0.85 / 0.5 | Share of a sentence's words heard |
| `maxAttempts` | 3 | Tries before moving on |
| Recognizer | on-device, 5 alternatives, no biasing, about 6 s max | Error-preserving (see ADR 0003) |

Each learn lesson has 1 "say the word". A speaking lesson has 9 exercises (6 speak, 1 listening warm-up, 1 picture, 1 sentence).

## Stories (`lesson-generator.ts`)

5 pages read aloud, then `STORY_TUNING.questions` = 3 questions about the story's key words, plus 1 true/false.

## Rewards for new lesson kinds (`economy.ts`)

`storyBonusBerries` = 2, `speakBonusBerries` = 3 (on top of the base formula). Badges: *Chatterbox* (3 speaking lessons → Echo) and *Story Lover* (5 stories → Page).

## Voice diary (`domain/voice/voice-diary.ts`)

One postcard every 7 days, at most 6 s. The first 2 and the 10 newest are kept (12 total); turning the diary off deletes all.

## Family profiles (`domain/profiles/profiles.ts`)

At most 4 profiles per device; ids p1–p4 (p1 keeps the v1.0 save key).

## Sing-along (`lesson-generator.ts`, `presentation/exercises/SongViews.tsx`)

- A song lesson: the chant (unscored) → `SONG_TUNING.gaps` = 3 missing-word lines → `SONG_TUNING.questions` = 2 picture questions → 1 true/false → 1 "say the word" (8 exercises).
- Chant timing (`SONG_TIMING`): the guide's voice × 1.08 pitch and × 0.85 rate; a clap after each line; an echo pause of 900 ms + 380 ms per word for the child to repeat it; 260 ms before the next line; a safety timer of (1600 + 520 × words) ms ÷ rate if TTS never reports the end.
- Every line contains its key word as a whole word (tested), and the gap blanks every occurrence so repetition never gives the answer away. The line's picture is hidden until the answer.
- Reward: `songBonusBerries` = 2. Badges: *Little Singer* (5 songs → Tempo) and *Pop Star* (20 songs → 60 berries).

## Word Gym (`lesson-generator.ts`)

| Knob | Value | Meaning |
| --- | --- | --- |
| `PRACTICE_TUNING.minWords` | 4 | Words met before the gym opens (after the first lesson) |
| `PRACTICE_TUNING.focusWords` | 8 | Words per session: due first, then lower boxes, then the oldest |
| Recipe | 10 exercises | listen, picture, spell, listen, true/false, picture, match, say the word, listen, picture |
| `practiceBonusBerries` | 1 | On top of the base lesson formula |

Practice updates mastery and counts `progress.practiceSessions`, but never stores a lesson record, so it never unlocks anything. Badge: *Word Athlete* (10 sessions → Flexo).

## Leitner promotion (`domain/learning/mastery.ts`)

A correct answer moves a word up one box **only when it is due** (or new). Correct answers before the due day (the same word again in one session) are counted but keep the box and the schedule. So "learned" (box 2) needs a second day, and "mastered" (box 4) needs at least 4 review days spread over about a week. See ADR 0006.

## Play Park (`domain/play/mini-games.ts`)

| Knob | Value | Meaning |
| --- | --- | --- |
| `minWords` | 6 | Words met before the park opens |
| `berriesPerCorrect` | 1 | First-try bubble or matched pair |
| `dailyBerryCap` | 20 | Game berries per day (a 3-star lesson pays about 11) |
| `bubbleRounds` / `bubbleOptions` | 8 / 4 | Bubble Pop |
| `memoryPairs` | 6 | Memory Match (12 cards: picture + word) |
| `poolSize` | 24 | Met words drawn from (due and weak first) |

Games give the active pet XP equal to the berries earned, and never change mastery (fast tapping isn't evidence of recall). Badge: *Game Champion* (15 games → Bloop).

## Daily quests (`domain/quests/quests.ts`)

| Quest | Target | Emoji |
| --- | --- | --- |
| Finish lessons (always offered) | 2 | 📚 |
| Get 3 stars in a lesson | 1 | ⭐ |
| Feed your pet | 2 | 🍓 |
| Play in the Play Park (once ≥ 6 words met) | 1 | 🎡 |
| Train in the Word Gym (once ≥ 4 words met) | 1 | 🏋️ |
| Finish a story or a song (once one is open) | 1 | 🎵 |

3 quests per day, picked deterministically from the day. The chest pays a fixed 15 berries. Unfinished quests expire at midnight with no penalty. Badges: *Quest Hero* (7 chests → Scout) and *Quest Legend* (30 chests → 150 berries).

## Album (`domain/learning/album.ts`)

Sticker states: locked (never met) → met → learned (box ≥ 2, blue frame) → gold (box ≥ 4, gold frame and star). Badge: *Golden Stickers* (50 mastered words → Goldie).

## I Spy and Odd One Out (`domain/play/mini-games.ts`)

| Knob | Value | Meaning |
| --- | --- | --- |
| `spyItems` / `spyRounds` | 9 / 6 | Pictures in the scene (one per cell of a jittered 3×3 grid, scale 0.85–1.15, tilt ±12°) / words asked for |
| `oddRounds` | 6 | Rounds of three words from one coherent world plus one from a world of a different theme |

Both pay through `settleMiniGame` (1 berry per first-try answer, same daily cap of 20). Odd One Out opens once the child has met at least 3 words in one coherent world and 1 word in a coherent world of another theme (about world 4). Mixed worlds (`coherent: false` in `content/categories.ts`) never supply words, so a round like "cow, dog, pig + owl" cannot happen.
