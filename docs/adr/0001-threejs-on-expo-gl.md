# ADR 0001: Drive three.js directly on expo-gl (no React Three Fiber)

- **Status:** Accepted
- **Date:** 2026-11-05

## Context

Pets are the core of the game and must be 3D, animated and interactive inside **Expo Go**, which only ships its bundled native modules. `expo-gl` is bundled, so three.js can run on it. The two options were:

1. React Three Fiber (`@react-three/fiber/native`) on expo-gl.
2. Plain three.js with a small host component.

The threejs-skills guidance we follow targets three r186+ (`Timer` instead of `Clock`, explicit disposal, no per-frame allocations) but does not cover React Native. Its R3F skill covers the web renderer only.

## Decision

Use **plain three.js r187** with a ~120-line `ThreeStage` host:

- `GLView.onContextCreate` → `new THREE.WebGLRenderer({ canvas: stand-in, context: gl })`. The stand-in canvas carries width/height and no-op listeners, the same technique R3F's native renderer uses.
- Our own `requestAnimationFrame` loop that ends each frame with `gl.endFrameEXP()`. `renderer.setAnimationLoop` is skipped because there is no WebXR here and expo-gl needs the explicit frame end.
- `THREE.Timer` for time; delta clamped to 100 ms so resuming from the background doesn't jump.
- A per-model `Kit` that owns every geometry and material and disposes them on unmount. Materials are cached per color.
- Procedural pets from data blueprints (spheres, cones, capsules, tori, tubes, lathes), with `MeshToonMaterial` on the default two-tone ramp (no textures) and inverted-hull outlines.
- One GL context per screen at most; lists use SVG portraits drawn from the same blueprint.

## Consequences

- No extra dependency and no R3F/React version coupling (React 19.3, RN 0.88).
- An imperative scene API (`play('jump')`, `setAccessory`, `dragYaw`) that is easy to drive from game events.
- No asset pipeline: 36 pets cost a few KB of data. Adding a pet is adding a row.
- Verified on the web build (Chromium + SwiftShader) and compiled into Hermes bundles for iOS and Android. **To do:** profile on a low-end Android device (target 60 fps; the scene is about 40–60 draw calls).
