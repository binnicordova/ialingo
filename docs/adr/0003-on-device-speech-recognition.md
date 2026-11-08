# ADR 0003: Speaking practice with on-device, error-preserving recognition and an Expo Go fallback

- **Status:** Accepted
- **Date:** 2026-11-05

## Context

The impact analysis found that real **speaking practice** is the main gap in kids' language apps (most are tap-and-match). Children aged 6–10 can't type, and they must be able to practice **without an adult**. Three constraints shape the solution:

1. **Privacy:** children's voices must not leave the device by default (COPPA, GDPR Art. 8, LGPD, Law 25).
2. **Children's ASR is hard:** recognizers are trained on adults and tend to *correct* children's errors into the target word, which hides the very mistakes feedback needs. Biasing toward the target word (contextual strings) makes this worse.
3. **Expo Go** does not ship a speech-recognition module, and the app must keep working there.

## Decision

- Use `expo-speech-recognition` (SDK 58 line) in a **development or store build**, with `requiresOnDeviceRecognition: true` whenever the device supports it.
- If only the online recognizer exists (Apple or Google servers), it stays **off** unless a parent enables "Allow online recognition".
- **Do not pass `contextualStrings`** (no biasing). Ask for up to 5 alternatives and score them with a lenient, **error-preserving** domain function (`domain/learning/pronunciation.ts`):
  - **great:** exact, or contains the target, or sounds the same after folding common Spanish and Portuguese sound swaps (th→t, v→b, sh/ch, silent letters) *and* is spelled similarly;
  - **good:** clearly close (≥ 0.6 text or sound similarity), with a gentle tip and the word modeled again;
  - **try-again:** anything else; up to 3 tries, then the lesson moves on (no frustration loop).
- **Capability probing:** the adapter calls `requireOptionalNativeModule('ExpoSpeechRecognition')` before requiring the package, because importing it in Expo Go throws. With no module, `speakModeAtom` resolves to **self-check**: the child says it aloud and taps "I said it!". The microphone is never opened in that mode.
- **Permission UX:** the first speaking exercise shows a short explainer card before the OS prompt. Denial falls back to self-check. *(Amended 2026-11-07, see below: no parental gate before the prompt.)*
- Parents can switch to self-check permanently ("No microphone").

## Consequences

- The same lessons work in Expo Go (self-check) and in dev or store builds (recognition). The domain and state logic are fully unit-tested, and the adapter is tested against a fake native module.
- Scoring is deliberately generous for motivation. Accuracy statistics treat self-check as a pass.
- **To do:** tune the thresholds with real child recordings (MyST- or AusKidTalk-style corpora) and on-device QA; consider a custom on-device child-speech model later.

## Amendment (2026-11-07): no grown-up gate before the speaking prompt

v1.2 put the parental gate in front of the microphone prompt of speaking practice. On a real device this made speaking exercises a dead end for a child playing alone: "Not now" led back to the same microphone button. The product owner decided that the microphone should not need an adult:

- **The OS dialog is the authorization.** Speaking practice shows a child-friendly explainer ("Let me hear you!", the voice stays on this device) and then the system prompt. Apple's Kids Category rules require a parental gate for links out and purchases, not for permission prompts; speech is recognized on the device and never stored or sent (COPPA's audio exception and Google Play Families rules are met the same way as before).
- **Never stuck.** "Not now" turns the current exercise into "I said it"; a refusal switches speaking to self-check through `speakModeAtom`, as before. The parent area can still switch speaking to self-check at any time.
- **Voice postcards keep the gate.** They save recordings, so the grown-up consents in the parent area (diary opt-in) and passes the gate before the first prompt.
