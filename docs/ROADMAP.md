# Roadmap

Ordered by impact on the goals from the impact analysis: real speaking practice, proof of progress for parents, long-term retention, then scale.

## ✅ v1.0 (MVP)

- 26 worlds, 393 words, 155 lessons, 7 exercise types, 36 procedural 3D pets, 8 guides
- Spaced repetition, no-fail scoring, parental gate, daily limit with bedtime
- No login, offline, privacy by design. Spanish / Portuguese / English UI

## ✅ v1.1 (this release)

- **Development build:** `expo-dev-client`, EAS profiles, bundle id `com.binnicordova.ialingo`, CNG prebuild verified
- **Speaking practice:** on-device speech recognition with child-friendly, error-preserving scoring; speak exercises in every learn lesson, plus a speaking lesson per world; self-check fallback in Expo Go
- **Content:** 34 worlds (+8 Flyers-level topics), 503 words, 138 sentences, **34 picture stories** with comprehension questions, 268 lessons, 46 pets, 10 guides (Kiki and Bruno are new)
- **Cambridge YLE ladder:** Starters / Movers / Flyers levels on the map, and shareable level certificates
- **Family profiles:** up to 4 children per device with a "Who's playing?" picker
- **Voice diary** ("progress you can hear"): parent opt-in weekly voice postcard, first next to latest, local only
- **Accessibility:** calmer animations (setting + system reduced motion)

## Next

1. **Device QA:** run the dev build on low-end Android and older iPhones; tune pronunciation thresholds with real children's speech; profile the 3D pet room (target 60 fps).
2. **Android offline model helper:** in the parent area, offer `androidTriggerOfflineModelDownload('en-US')` when on-device English isn't installed.
3. **Songs and chants:** rhythmic sing-along lessons per world (TTS at a slower rate plus a beat), reusing the story engine.
4. **More UI languages:** French (Canada and France), Italian, German. The content format supports more locales; UI strings come first.
5. **Phrase patterns:** templated sentences ("I like ___", "I can ___") over each world's vocabulary for many more sentence exercises.
6. **Store release:** EAS production builds, Kids-category store listings, screenshots from `production/qa/evidence/`, and an accessibility audit (screen-reader pass on every screen).
7. **Optional sync (much later, with consent):** encrypted family backup, only with verifiable parental consent and a privacy review (see `docs/PRIVACY.md`).
