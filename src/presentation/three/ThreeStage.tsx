import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import * as THREE from 'three';

/** What a scene gets to build itself. */
export interface StageContext {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
}

/** What a scene gives back: a per-frame update and a full cleanup. */
export interface StageController {
  update(deltaSeconds: number, elapsedSeconds: number): void;
  dispose(): void;
}

export interface ThreeStageProps {
  readonly setup: (ctx: StageContext) => StageController;
  readonly background: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

/**
 * Hosts a three.js scene inside an expo-gl GLView, which is included in Expo
 * Go. React Three Fiber is not used; the WebGLRenderer is driven directly:
 * - three.js expects a DOM canvas, so it gets a minimal canvas stand-in bound to
 *   the GL context (the same technique R3F's native renderer uses);
 * - expo-gl presents frames with `gl.endFrameEXP()`, so the loop is our own
 *   requestAnimationFrame instead of `renderer.setAnimationLoop` (no WebXR here);
 * - time comes from `THREE.Timer` (Clock is deprecated since r183);
 * - everything is disposed on unmount (geometries, materials, renderer).
 */
export function ThreeStage({ setup, background, style, testID }: ThreeStageProps) {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    cleanupRef.current?.();
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    if (Platform.OS !== 'web') silenceUnsupportedPixelStore(gl);

    const canvas = {
      width,
      height,
      style: {},
      clientWidth: width,
      clientHeight: height,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      getContext: () => gl,
    };

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas as unknown as HTMLCanvasElement,
      context: gl as unknown as WebGL2RenderingContext,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(1);
    renderer.setSize(width, height, false);
    renderer.setClearColor(new THREE.Color(background), 1);
    renderer.toneMapping = THREE.NoToneMapping;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);
    const camera = new THREE.PerspectiveCamera(30, width / Math.max(1, height), 0.1, 60);

    const controller = setup({ renderer, scene, camera });
    const timer = new THREE.Timer();
    let lastWidth = width;
    let lastHeight = height;
    let frame: number | null = null;
    let disposed = false;

    const loop = () => {
      if (disposed) return;
      frame = requestAnimationFrame(loop);
      timer.update();
      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;
      if (w !== lastWidth || h !== lastHeight) {
        lastWidth = w;
        lastHeight = h;
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(1, h);
        camera.updateProjectionMatrix();
      }
      // Clamp the delta so a paused app does not "teleport" animations on resume.
      controller.update(Math.min(timer.getDelta(), 0.1), timer.getElapsed());
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    frame = requestAnimationFrame(loop);

    cleanupRef.current = () => {
      disposed = true;
      if (frame !== null) cancelAnimationFrame(frame);
      controller.dispose();
      renderer.dispose();
      cleanupRef.current = null;
    };
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} msaaSamples={4} />
    </View>
  );
}

/**
 * expo-gl logs a warning for pixel-store flags it does not implement (used by
 * three.js only for texture uploads). Forward only the supported one.
 */
function silenceUnsupportedPixelStore(gl: ExpoWebGLRenderingContext) {
  const original = gl.pixelStorei.bind(gl);
  (gl as { pixelStorei: (pname: number, param: number | boolean) => void }).pixelStorei = (
    pname,
    param,
  ) => {
    if (pname === gl.UNPACK_FLIP_Y_WEBGL) original(pname, param as number);
  };
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});
