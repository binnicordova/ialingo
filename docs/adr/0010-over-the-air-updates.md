# ADR 0010: Over-the-air updates with EAS Update

- Status: accepted
- Date: 2026-11-20

## Context

Store review takes days, and the 2026-11-08 Play rejection (expo-gl stripped by R8) showed that one bad build can keep a broken app on children's devices for a week. Content fixes (a wrong translation, a lesson typo) also had to wait for a full store release.

Until now the app made no network requests of its own, and the privacy policy and store listings said so.

## Decision

- Add `expo-updates` with EAS Update at `https://u.expo.dev/<projectId>`.
- `runtimeVersion` uses the `fingerprint` policy, so an update only reaches builds whose native code matches. Any native change (a new module, a config-plugin change, an SDK bump) produces a new runtime and needs a store build.
- `checkAutomatically: ON_LOAD` with `fallbackToCacheTimeout: 0`: launch never waits for the network, and a downloaded update is applied on the **next** cold start. There is no in-app "restart now" prompt, so a child is never interrupted mid-lesson.
- Channels: `production` and `preview` build profiles carry their own channel in `eas.json`. Development builds and Expo Go have updates disabled.
- Publish with `npx eas-cli@latest update --channel production --environment production --message "…"`.

## Privacy consequences

The update check sends the runtime version, platform, channel, current update id and a random per-install id (`EAS-Client-ID`), and the IP address is visible to Expo. No game state, audio or child input is sent. `docs/PRIVACY.md`, `store/privacy-policy.md` (en/es/pt/fr), the store descriptions and `store/google-play/data-safety.md` were updated in the same change. In Play Console the Data safety form must now declare "Device or other IDs → collected, not shared, App functionality". On iOS, App Privacy should declare "Device ID → App Functionality, not linked, not tracking" before the next App Store release.

EAS Update must never be used for remote config, experiments or per-user targeting.

## Alternatives considered

- **Parent-triggered checks only** (`checkAutomatically: NEVER` plus a button in the parent area): no automatic network use, but most families would never press it, so fixes would not reach children.
- **No OTA updates:** keeps the zero-network promise, at the cost of slow fixes.
