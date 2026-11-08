import appConfig from '../../../app.json';

/**
 * Release builds run R8, which dev builds and Expo Go never do. expo-gl ships
 * no R8 rules: Expo creates its GLView by reflection and its native code calls
 * GLContext.flush() by name, so without a keep rule every 3D screen crashes
 * only in the store build. Google Play rejected the app for it on 2026-11-08.
 */
const plugins = appConfig.expo.plugins as unknown as (string | [string, unknown])[];

function buildProperties() {
  const entry = plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties');
  return (entry as [string, { android?: { extraProguardRules?: string } }] | undefined)?.[1];
}

describe('Android release build config', () => {
  it('keeps expo-gl from being shrunk by R8', () => {
    const rules = buildProperties()?.android?.extraProguardRules ?? '';
    expect(rules).toContain('-keep class expo.modules.gl.** { *; }');
  });
});
