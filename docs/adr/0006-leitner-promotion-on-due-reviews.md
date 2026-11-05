# ADR 0006: Leitner boxes are earned only on due reviews

- **Status:** Accepted (fixes v1.0 behavior)
- **Date:** 2026-11-05

## Context

Since v1.0, every correct answer moved a word up one Leitner box. A word that appears several times in one session (learn card, listen, match, spell, speak, then a story and a song) reached box 4, "mastered", in a single afternoon. The new sticker album made this visible ("hello" turned gold on day one), and it also inflated the parent dashboard's "words learned" and the word badges.

Spaced-repetition research is clear that the long-term benefit comes from successful retrieval after a delay; repeated correct answers within one session mostly measure short-term memory.

## Decision

`recordAnswer` promotes a word only when it is **due** (or new). A correct answer before the due day increments the counters but keeps the box and the schedule. A wrong answer still moves the word down one box and resets its schedule.

## Consequences

- "Learned" (box 2) now needs a second day; "mastered" (box 4) needs at least four review days over about a week. The album's gold stickers and the *Golden Stickers* badge mean what they say.
- Parent-facing numbers grow more slowly but are honest.
- Existing saves keep their boxes (no migration); words already inflated simply follow the normal schedule from now on.
- The Word Gym and review lessons pick due words first, so children are naturally guided to the reviews that count.
