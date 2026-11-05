# Roadmap

Ordered by impact on the goals from the impact analysis: real speaking practice, proof of progress for parents, long-term retention, then scale.

## ✅ v1.0 (MVP)

- 26 worlds, 393 words, 155 lessons, 7 exercise types, 36 procedural 3D pets, 8 guides
- Spaced repetition, no-fail scoring, parental gate, daily limit with bedtime
- No login, offline, privacy by design. Spanish / Portuguese / English UI

## ✅ v1.1

- **Development build:** `expo-dev-client`, EAS profiles, bundle id `com.binnicordova.ialingo`, CNG prebuild verified
- **Speaking practice:** on-device speech recognition with child-friendly, error-preserving scoring; self-check fallback in Expo Go
- **Content:** 34 worlds, 503 words, 138 sentences, 34 picture stories, 46 pets, 10 guides
- **Levels and certificates** (Starters / Movers / Flyers), **family profiles** (up to 4), **voice diary**, calmer animations

## ✅ v1.2: practice and play

- **Sing-along in every world:** 34 original chants (call and response with a clap beat), a "which word is missing?" exercise, and a speaking turn. 302 lessons in total.
- **Word Gym:** unlimited spaced-repetition practice across worlds, due and weakest words first, never new words.
- **Sticker album:** all 503 words as stickers (met → learned → gold).
- **Play Park:** Bubble Pop and Memory Match with learned words; game berries capped at 20 a day; games never change mastery.
- **Daily quests:** 3 a day (always "finish lessons"), a fixed-reward chest, no streaks and nothing lost on missed days.
- **Pets and badges:** 5 new badge pets (51 total) and 7 new badges (19 total).
- **Learning quality:** Leitner boxes are now earned only on due reviews, so "mastered" means remembered across days (ADR 0006).
- **Speaking:** Android offline English model helper in the parent area; on-device recognition turns off until English is installed.
- **Store readiness:** App Store metadata in EAS Metadata format, Google Play listings, a parent privacy policy (en/es/pt), data safety answers, a screenshot plan, and tests for every store limit.
- **Kids Category compliance:** a parental gate now comes before every microphone permission prompt.
- **Accessibility:** localized labels everywhere, header roles, spoken feedback and celebrations for screen readers.

## ✅ v1.3 (this release): French and more to explore

- **French everywhere:** a fourth UI language for France, Belgium, Switzerland, Québec and francophone Africa. 250 UI strings and about 1,300 content strings (words, sentences, stories, songs, titles, pets, badges, guides), French instructions read aloud (`fr-FR`), and French store listings (fr-FR, fr-CA) and privacy policy. ADR 0007.
- **4 new Flyers worlds** with communicative English: Magic Words (please, thank you, excuse me…), Every Day (daily-routine phrases), Let's Go Shopping (money, prices, "How much is it?") and Big Feelings (excited, worried, embarrassed…). Each has a story, a song and a reward pet: 38 worlds, 557 words, 338 lessons, 55 pets.
- **2 new Play Park games:** I Spy (find the word the guide says in a scene) and Odd One Out (category thinking; groups come only from worlds whose words share one category, so every round has exactly one answer).
- **Accessibility fix for web:** disabled, selected and checked states now reach the browser (react-native-web ignores `accessibilityState`).
- **Pronunciation:** French-speaker accents (h-dropping, th → z, s or f) are covered by tests.

## Next

1. **Device QA:** run the store build on low-end Android and older iPhones; tune pronunciation thresholds and chant timing with real children's speech (English learners from Spanish, Portuguese and French homes); profile the 3D pet room (target 60 fps).
2. **Store release:** EAS production builds, store screenshots from the walkthrough (`QA_LANG` × `QA_VIEWPORT`), App Review and Play review, then a soft launch in Mexico, Brazil and Québec before the US, France and Spain.
3. **Italian and German UI:** the same pipeline as French (ADR 0007).
4. **More communicative content:** phrase worlds such as "Ask and Answer" (question words), "At the Doctor" and "On Holiday"; templated sentence patterns only with per-word grammar data (countable, article), so generated English is always correct.
5. **More Play Park games:** Spelling Bee and a sentence-building race, reusing the capped rewards.
6. **Optional sync (much later, with consent):** encrypted family backup, only with verifiable parental consent and a privacy review (see `docs/PRIVACY.md`).
