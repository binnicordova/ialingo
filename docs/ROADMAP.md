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

## ✅ v1.2 (this release): practice and play

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

## Next

1. **Device QA:** run the store build on low-end Android and older iPhones; tune pronunciation thresholds and chant timing with real children's speech; profile the 3D pet room (target 60 fps) and the Bubble Pop animations.
2. **French (Canada and France):** UI strings first (about 340 keys), then the content meanings (words, sentences, stories, songs: about 1,000 short strings). The content format already supports more locales (`LocalizedText`).
3. **Phrase patterns:** templated sentences ("I like ___", "I can see ___") over each world's vocabulary, with per-word grammar data (countable, article), for many more sentence and speaking exercises.
4. **More Play Park games:** Spelling Bee (letters falling), Sound Safari (listen and find in a scene), each reusing the domain's capped rewards.
5. **Store release:** EAS production builds, screenshots from the walkthrough at store sizes, App Review and Play review, then a soft launch in Mexico and Brazil before the US, Canada and Spain.
6. **Italian and German UI:** after French, using the same pipeline.
7. **Optional sync (much later, with consent):** encrypted family backup, only with verifiable parental consent and a privacy review (see `docs/PRIVACY.md`).
