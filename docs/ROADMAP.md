# Roadmap

What exists now (v1.0 MVP) and the next steps, ordered by impact on the impact analysis's goals: real speaking practice, proof of progress for parents, and long-term retention.

## v1.0 (this build)

- 26 worlds · 393 words · 106 sentences · 155 generated lessons · 7 exercise types
- 36 procedural 3D pets, 8 guide characters, 8 accessories, 10 badges
- Spaced repetition, no-fail scoring, re-queue of misses
- No login, offline, privacy-by-design, parental gate, daily limit with bedtime
- Spanish / Portuguese / English UI

## Next

1. **Device QA:** run on low-end Android and older iPhones in Expo Go; profile frame time in the pet room; tune `msaaSamples` and the pixel ratio if needed.
2. **Speaking practice (phase 2, development build):** on-device speech recognition with *error-preserving* scoring for children's voices; "repeat after me" with the pet listening. Requires a development build (not in Expo Go) and a privacy review: on-device only, no recordings kept by default.
3. **"Progress you can hear" (parent opt-in):** a weekly 30-second local recording of the child, week 1 next to week 8, shareable by the parent. On-device only; parental consent; this is the retention and word-of-mouth lever from the analysis.
4. **More content per world:** a second tier of A1 Movers vocabulary and phrase patterns; stories with the guides (listening comprehension); songs.
5. **Cambridge YLE alignment:** Pre-A1 Starters → A1 Movers → A2 Flyers ladder with printable certificates for parents.
6. **Family profiles:** up to 4 local child profiles on one device (still no accounts).
7. **More UI languages:** French (Canada/EU), Italian, German. The content format already supports more locales.
8. **Release:** EAS Build, store listings in the Kids category, accessibility audit (VoiceOver/TalkBack labels exist; add reduced-motion handling for 3D).
