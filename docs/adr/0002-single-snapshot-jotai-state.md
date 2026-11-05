# ADR 0002: One immutable game snapshot in a Jotai atom, changed only by pure commands

- **Status:** Accepted
- **Date:** 2026-11-05

## Context

The game state is small (well under 100 KB even after hundreds of lessons), must survive app kills, must be easy to migrate between versions, and must never leave the device. Jotai was requested for atomic state management.

## Decision

- The whole save is **one immutable `GameState` value** in `gameStateAtom`.
- **Reads** go through small derived atoms (`selectors.ts`), so components subscribe to slices.
- **Writes** go through write-only action atoms (`actions.ts`). Each calls a **pure application command** that returns `{ state, events }`. No component mutates state.
- **Persistence** is a store subscription with a 400 ms debounce, flushed when the app goes to the background. One AsyncStorage key holds the whole snapshot.
- **Loading** runs `restoreGameState()`, which validates every field, applies versioned migrations, and repairs or rejects bad data. The app never crashes on a corrupt save.
- Services (storage, speech, audio, haptics, clock) are injected through `servicesAtom`, so tests use in-memory fakes.

`atomWithStorage` was not used, for two reasons. Its async hydration on React Native renders defaults first, which would flash onboarding for returning players. And per-atom keys would complicate migrations.

## Consequences

- All game rules are testable without React (`tests/integration/game-flow`), and the wiring is tested separately (`tests/integration/state`).
- Adding a field means: a type, a default in `createInitialGameState`, validation in `restoreGameState`, and a migration if the meaning changes.
- The transient lesson session lives in its own atom and is intentionally not persisted.
