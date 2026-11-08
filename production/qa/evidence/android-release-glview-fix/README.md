# Android release build: GLView crash fix (2026-11-08)

Google Play rejected 1.3.0 (6) under the Broken Functionality policy: "Tapping certain buttons or icons causes your app to crash". The reviewer chose a language, tapped Next, picked an egg and tapped Start!, and the app closed as the 3D hatch screen opened.

Reproduced on a release build (Pixel 7 emulator, Android 15) of `main`:

```
java.lang.IllegalStateException: Didn't find a correct constructor for class nc1   (nc1 = expo.modules.gl.GLView)
  at expo.modules.kotlin.views.SimpleViewManagerWrapper.createViewInstance
```

With only the constructor kept, the next failure was a JNI abort, because expo-gl's C++ calls `GLContext.flush()` by name:

```
JNI DETECTED ERROR IN APPLICATION: mid == null
  in expo::gl_cpp::EXGLContext::addBlockingToNextBatch
```

Fix: `-keep class expo.modules.gl.** { *; }` through `expo-build-properties` in `app.json` (see ADR 0001).

The screenshots are from the fixed release APK: onboarding, the 3D hatch, home, the 3D pet room, a full lesson with its 3D moments, and the parent area. The crash buffer stayed empty for the whole walkthrough, which also covered the tabs, badges, friends, certificates, players, sticker album, world map, Play Park games, Word Gym, guides, the language switch and an app restart (progress kept).
