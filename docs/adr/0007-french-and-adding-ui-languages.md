# ADR 0007: French as a full UI language, and how to add the next ones

- **Status:** Accepted
- **Date:** 2026-11-05

## Context

Canada, France, Belgium, Switzerland and francophone Africa are large markets where families pay for English learning for their children. Québec teaches *anglais, langue seconde* from the first year of primary school. A child who can't read the instructions can't play on their own, so a UI language is only useful if **everything** is translated: instructions read aloud, titles, the meaning shown under every English word, stories, songs, pets and badges.

## Decision

- `fr` joins `SUPPORTED_LOCALES` (order es, pt, fr, en) with `fr-FR` text-to-speech for instructions. The device language picks it automatically on first launch (`expo-localization`).
- **Translations live next to the English**, as a new column in every content row (`[en, emoji, es, pt, fr]`, stories and songs `[en, emoji, es, pt, fr, keyword]`) and a `fr` field in every `LocalizedText`. `LocalizedText` stays `Record<Locale, string>`, so a missing translation is a **compile error**, never a silent English fallback.
- The rows were converted by a one-off script keyed by the English text, which failed on any missing translation and reported unused ones (1,070 placed, 0 unused). New content is written with all columns from the start.
- **Style:** standard French understood in both France and Québec. Children are addressed with *tu*, parents with *vous*. Words that differ between regions get neutral choices ("repas de midi" instead of *déjeuner*/*dîner*). Typography uses no-break spaces before `! ? : ;` and inside « ».
- **Tests:** the catalog test checks that every meaning in every locale is non-empty, and that French is a real translation (under 12% of items identical to English, which allows cognates like *pizza* or *taxi*). The store test covers the fr-FR and fr-CA listings.

## Consequences

- About 1,300 content strings and 250 UI strings are now maintained in four languages. Adding a world means writing four translations per row, which the types enforce.
- Italian or German will follow the same steps: add the locale and speech tag, add the column to `WordRow`, `SentenceRow` and `StoryLineRow` (the compiler then lists every row), add the dictionary, and extend the store listings.
- Native-speaker review of the French content is still recommended before launch in France and Québec.
