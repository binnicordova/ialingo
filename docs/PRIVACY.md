# Privacy by design

iaLingo is meant to be used by a child **without an adult in the learning loop**. The only adult touchpoints are optional: settings, the time limit, the voice diary, profiles and certificates, all behind the parental gate. That makes privacy a product requirement, not a legal afterthought.

## What the app does not do

- **No accounts or login.** No email, phone number, name or birthday is ever asked for. Family profiles are identified by their pet.
- **No free text from children.** Pet names are presets. (Certificates have a blank line to write a name *by hand* after printing.)
- **No network calls of its own.** No analytics SDK, crash reporter, remote config, ads, in-app purchases, links out or social features.
- **No profiling or emotion inference.** Adaptivity is a plain spaced-repetition schedule over words, computed on the device.

## The microphone (v1.1)

The microphone is used in exactly two places, only when the child taps a microphone or record button:

| Feature | What happens to audio | Default |
| --- | --- | --- |
| **Speaking practice** (dev or store build) | Recognized by the operating system's recognizer **on the device** (`requiresOnDeviceRecognition`). Only the text alternatives reach the app; they are scored and discarded. Nothing is recorded or saved. | On (on-device only). Parents can switch to "No microphone" (self-check). |
| Online recognition (fallback) | Only if the device cannot recognize offline **and** a parent enables "Allow online recognition". Audio is then processed by Apple or Google under their terms. | **Off** |
| **Voice diary** | A 5-second postcard, once a week, saved in the app's private documents folder (`documents/voice-diary/<profile>/`). Never uploaded. Parents can play it, share it themselves, or delete it. | **Off** (parent opt-in). Turning it off deletes every recording. |

In **Expo Go** there is no recognizer, so speaking exercises use self-check and the microphone is never opened.

Before the OS permission prompt, the app shows an "Ask a grown-up" card. Permission texts (iOS `NSMicrophoneUsageDescription` and `NSSpeechRecognitionUsageDescription`) are written for parents.

## What is stored, and where

Per child profile, one JSON document in AsyncStorage (`ialingo.save.v1`, `ialingo.save.v1.p2`…), plus the profile index (`ialingo.profiles.v1`):

| Data | Example | Why |
| --- | --- | --- |
| Settings | UI language, voice speed, sounds, daily limit, speaking mode, voice diary on/off | Parent preferences |
| Progress | Lesson stars, per-word Leitner box and last review **day** | Learning and spaced repetition |
| Pets | Species, preset nickname, XP, happiness, accessory | Game state |
| Wallet, badges, daily gift day | Berries, badge ids | Game state |
| Screen time | Today's date and seconds played | Daily limit |
| Voice diary index | Day, file name and the English prompt for up to 12 postcards | So parents can find the recordings |

Only calendar days are stored, never timestamps or locations. Voice diary retention: the first 2 postcards (the "before") and the 10 most recent are kept, and older ones in between are deleted automatically. **Delete all progress** or deleting a profile wipes that child's data and recordings.

Text-to-speech uses the operating system's voice engine. On some Android devices the system TTS engine may use a network voice; that is a device setting outside the app.

## Permissions

- **Requested:** microphone (speaking practice, voice diary) and, on iOS, speech recognition.
- **Blocked** in `app.json`: fine and coarse location, external storage read/write.
- Sharing (certificates, postcards) uses the system share sheet and only runs after the parental gate or in the parent area.

## Mapping to regulations (orientation, not legal advice)

| Regulation | Relevant requirement | How the design responds |
| --- | --- | --- |
| **US COPPA** (amended rule, compliance from Apr 22, 2026) | Verifiable parental consent before collecting children's personal information; separate consent for third-party disclosure (for example AI training); retention limits | No personal information is collected or disclosed by the app. Voice is processed on the device. The voice diary is opt-in, local and bounded. Online recognition needs explicit parent consent in the gated area |
| **EU GDPR Art. 8** and the **AI Act** | Parental consent for information-society services; transparency for AI in education; emotion recognition restricted | No data leaves the device. Speech scoring is a deterministic, explainable rule set, and there are no automated decisions about the child. No emotion inference |
| **Brazil LGPD Art. 14** | Children's data processed in their best interest, with parental consent | Local only. Diary and online recognition are opt-in by a parent |
| **Québec Law 25** (under 14) | Parental consent; privacy by default | Every optional data feature is off by default |
| **California SB 243** (companion chatbots) | Disclosures and safeguards for AI companions | Pets and guides are scripted, not generative chatbots; no open conversation, no dependency mechanics |
| **Apple Kids Category / Google Families** | No third-party analytics or ads, parental gate before settings and external actions | None included; parental gate before settings, sharing and data deletion |

## Rules for future changes

1. Any feature that sends data off the device needs a privacy review and, for under-13s, verifiable parental consent *before* it ships.
2. Never add free-text input for children.
3. Keep data minimization: days, not timestamps; aggregates, not raw events; bounded retention for recordings.
4. Keep the microphone tap-to-use only. No background listening, ever.
