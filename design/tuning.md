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
