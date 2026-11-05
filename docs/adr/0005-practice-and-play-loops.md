# ADR 0005: Practice and play loops with healthy-retention rules

- **Status:** Accepted
- **Date:** 2026-11-05

## Context

To keep children coming back for months (the retention gap the impact analysis found in most kids' apps), iaLingo needs more than a linear path: practice that doesn't run out, play with what was learned, and a daily reason to open the app. The usual tools (streaks, timers, random loot, paid boosters) work by pressure, which conflicts with Pillar 4 ("healthy loops") and with regulators' focus on manipulative design for children (EU DSA guidelines, the UK Age-Appropriate Design Code).

## Decision

1. **Word Gym** (`generatePracticeLesson`, lesson id `gym`): unlimited sessions over words already met, due and weakest first. It changes mastery like a lesson but stores no lesson record, so it never unlocks anything and can't be farmed for progress.
2. **Play Park** (`domain/play`): mini-games over met words. They **do not change mastery**, because fast tapping is not evidence of recall, and their berries are **capped at 20 per day** so lessons stay the main path. The pet still gets XP equal to the berries.
3. **Daily quests** (`domain/quests`): 3 per day, always including "finish lessons", chosen deterministically from the day among the quests the child can do now. The chest is a **fixed** reward (no random loot). Quests **expire silently**: no streak counter, no "you lost" message, nothing taken away.
4. **Cross-cutting tracking:** quests advance from domain events (`trackQuests`, applied in the state layer's `run()` after every command), so no command needs to know about quests.

## Consequences

- New persisted fields `play`, `quests` and `progress.practiceSessions` are validated in `restoreGameState`; saves from v1.1 load with defaults (tested).
- The economy stays predictable: the most a child can get from games in a day is 20 berries; quests add 15.
- Future games reuse `settleMiniGame` and the same cap; future quests only need a new `QuestKind`, a target and an event mapping.
