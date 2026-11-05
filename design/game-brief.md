# Game Brief: iaLingo

**One-sentence pitch:** Adopt magical pets that grow every time you learn English: voice-first mini-games a 6–10 year old can play alone, with no login and no data ever leaving the phone.

## Core loop
- Pick a world on the Adventure Map; its guide character greets the child out loud.
- Play a 3–4 minute lesson of about 12 bite-sized exercises. Every English word is spoken aloud, so no reading is required to progress.
- Earn stars, berries and pet XP. The active pet levels up and grows (baby → kid → grown). Beating a world's boss lesson earns that world's pet egg.
- Visit the 3D Pet Room to feed, play with, dress up and switch pets, then pick the next lesson.

## Player goal & fail state — what "working" looks like
- Goal: complete all 26 worlds and collect all 36 pets. A session feels complete when one lesson has been played and the pet visibly reacts (grows, eats or celebrates).
- There is no fail state. A wrong answer shows the right one, comes back once at the end of the lesson, and every lesson finishes with at least 1 star.

## MVP — what must exist to be the game
1. No-friction onboarding: pick a language, pick an egg, hatch it, choose a preset name. No account and no typing.
2. Lesson player with 7 exercise types, generated from data, plus spaced repetition (Leitner boxes).
3. 26 worlds, 393 words and 106 sentences (155 generated lessons), with 8 guide characters (en / es / pt).
4. 36 pets built procedurally in 3D (three.js on expo-gl), with leveling, feeding and accessories.
5. Parent area behind a gate: progress, daily time limit (the pet goes to sleep), settings, delete all data.
6. Everything is stored on the device (AsyncStorage). There is no network code at all.

## Out of scope — not building this
- Accounts, cloud sync, analytics SDKs, ads, in-app purchases and loot boxes.
- Speech recognition and voice recording. Expo Go can't run a speech-recognition module, and recording children's voices is a privacy decision for phase 2.
- Free text entry of names, chat or any user-generated content.
- Streak punishment and "your pet is sad" guilt mechanics.

## Build order
1. Domain rules (lesson generator, mastery, rewards, pets), covered by unit tests first.
2. Content data (worlds, pets, characters) checked by catalog-integrity tests.
3. Lesson player end to end (the core fun) → rewards → pet growth.
4. 3D Pet Room and egg hatching.
5. Parent area, screen-time limit, polish.

---
**Who it's for / what they feel:** 6–10 year olds (core 7–9), Spanish and Portuguese speakers first (LATAM). They should feel "my pet grows because I'm learning".

**Art & audio direction:** Bright candy colors, chunky rounded shapes, procedural low-poly 3D pets, big emoji pictures, a rounded font (Fredoka), short synthesized chimes, and on-device text-to-speech with a distinct pitch per character.

**Reference game:** Tamagotchi's care loop plus Duolingo's lesson cadence. We keep about 10% of each: feed and grow a pet with short lessons, with no hearts, no streak loss and no store.

## Pillars
1. **Play first, learn always.** Every interaction is a game, and audio carries everything, so a child who can't read yet can still progress.
2. **Pets are proof of progress.** Pet growth and eggs come only from learning; berries buy cosmetics and food, never XP.
3. **Safe by design.** No login, no network, no ads and no free text. The parent area is behind a gate.
4. **Healthy loops, not hooks.** Pets never get sad or die. The daily limit puts the pet to sleep instead of nagging, and nothing is random-for-money.
