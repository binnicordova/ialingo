# Privacy by design

iaLingo is meant to be used by a child **without an adult in the learning loop**. The only adult touchpoints are optional: settings and the time limit, behind the parental gate. That makes privacy a product requirement, not a legal afterthought.

## What the app does not do

- **No accounts or login.** No email, phone number, name or birthday is ever asked for.
- **No free text.** Pet names are chosen from presets, so a child cannot type personal information.
- **No network.** There is no analytics SDK, crash reporter, remote config, ads, in-app purchases, links out or social features. The app makes no HTTP requests of its own.
- **No voice or camera.** Nothing is recorded. Microphone and location permissions are blocked in `app.json` (`android.blockedPermissions`, and the `expo-audio` plugin is configured with `microphonePermission: false`).
- **No profiling or emotion inference.** Adaptivity is a plain spaced-repetition schedule over words, computed on the device.

## What is stored, and where

One JSON document under the AsyncStorage key `ialingo.save.v1`, on the device only:

| Data | Example | Why |
| --- | --- | --- |
| Settings | UI language, voice speed, sounds, daily limit | Parent preferences |
| Progress | Lesson stars, per-word Leitner box and last review **day** | Learning and spaced repetition |
| Pets | Species, preset nickname, XP, happiness, accessory | Game state |
| Wallet, badges, daily gift day | Berries, badge ids | Game state |
| Screen time | Today's date and seconds played | Daily limit |

Only calendar days are stored, never timestamps or locations. The play-day list is capped at 400 entries. **Delete all progress** in the parent area wipes it.

Text-to-speech uses the operating system's voice engine through `expo-speech`. On some Android devices the system TTS engine may itself use a network voice; that is a device setting outside the app.

## Mapping to regulations (orientation, not legal advice)

| Regulation | Relevant requirement | How the design responds |
| --- | --- | --- |
| **US COPPA** (amended rule, compliance from Apr 22, 2026) | Verifiable parental consent before collecting children's personal information; separate consent for third-party disclosure such as AI training; data retention limits | No personal information is collected or disclosed, so there is nothing to consent to or retain. Revisit before adding any online feature |
| **EU GDPR, Art. 8** (consent age 13–16 by country) and the **AI Act** | Parental consent for information-society services; transparency and risk limits for AI in education | No personal data processing. No AI model and no automated decisions about the child; the "adaptive" part is a deterministic word schedule |
| **Brazil LGPD, Art. 14** | Processing of children's data in their best interest, with parental consent | No processing of personal data off the device |
| **Québec Law 25** (under 14) | Parental consent; privacy by default | Privacy-by-default configuration; nothing collected |
| **California SB 243** (companion chatbots, 2026) | Disclosures and safeguards for AI companions used by minors | Pets and guides are scripted, not generative chatbots. No open-ended conversation and no emotional-dependency mechanics (pets never get sad or guilt-trip) |
| **Apple Kids Category / Google Families** | No third-party analytics or ads, parental gate before settings and external links | No analytics or ads; parental gate (multiplication with factors 6–9) protects the settings and data deletion |

## Rules for future changes

1. Any feature that sends data off the device needs a privacy review and, for under-13s, verifiable parental consent *before* it ships.
2. Never add free-text input for children.
3. Keep data minimization: store days, not timestamps; aggregates, not raw events.
4. Speech recording (phase 2) must be opt-in by a parent, processed on the device, and never persisted by default.
