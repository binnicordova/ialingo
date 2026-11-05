# ADR 0004: Family profiles as separate local saves keyed by profile id

- **Status:** Accepted
- **Date:** 2026-11-05

## Context

Siblings share devices (very common in LATAM households). Each child needs their own pets, progress and daily limit, without accounts or names.

## Decision

- A **profile index** (`ialingo.profiles.v1`) lists up to 4 profile ids (`p1`–`p4`) and the active one.
- Each profile has its **own saved game**. `p1` keeps the v1.0 key `ialingo.save.v1`, so existing players migrate with zero work; others use `ialingo.save.v1.<id>`.
- A profile is identified by **its pet** (species and preset nickname); no child names are stored.
- Switching profiles is an async action atom: **flush** the pending autosave, load and restore the target save, update the index, run `startDay`. Autosave captures the profile id at change time and never writes one child's state under another's key.
- "Who's playing?" appears on launch when there are 2+ profiles. Adding and deleting profiles happens in the gated parent area. Deleting also removes that child's voice postcards. The last profile cannot be deleted (use "Delete all progress").

## Consequences

- Per-child settings (language, daily limit, speaking mode, voice diary) come for free, because settings live inside each save.
- Boot loads every profile once (at most 4 small JSON documents) to show summaries in the picker.
- Covered by integration tests: switching, restart persistence, deletion, and the never-cross-write guarantee.
