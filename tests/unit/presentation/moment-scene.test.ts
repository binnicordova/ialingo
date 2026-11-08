import * as THREE from 'three';

import { createMomentScene, MOMENT_SCENE, type MomentStyle } from '@/presentation/three/moment-scene';
import type { StageContext } from '@/presentation/three/ThreeStage';

import { PET_SPECIES } from '@/infrastructure/content/pets';

const blueprint = PET_SPECIES[0]!.blueprint;

function context(): StageContext {
  return {
    renderer: {} as THREE.WebGLRenderer,
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(30, 390 / 844, 0.1, 60),
  };
}

describe('moment scene (full-screen pet moments)', () => {
  it.each<MomentStyle>(['cheer', 'peek', 'victory'])('%s: runs 8 s of frames, keeps the pet in view and disposes', (style) => {
    const ctx = context();
    const scene = createMomentScene(ctx, { blueprint, stage: 'baby', accessory: null, style, sky: ['#6C4BF4', '#E9E3FF'], calm: false });
    const objects = ctx.scene.children.length;
    let t = 0;
    for (let frame = 0; frame < 480; frame += 1) {
      t += 1 / 60;
      scene.update(1 / 60, t);
    }
    scene.cheer();
    for (let frame = 0; frame < 60; frame += 1) {
      t += 1 / 60;
      scene.update(1 / 60, t);
    }
    // Nothing is added per frame.
    expect(ctx.scene.children.length).toBe(objects);
    const pet = ctx.scene.children.find((c) => c.type === 'Group' && c.children.length > 0)!;
    expect(Number.isFinite(pet.position.y)).toBe(true);
    expect(pet.position.y).toBeGreaterThan(-0.5);
    scene.dispose();
    expect(ctx.scene.children.length).toBe(0);
  });

  it('calm mode never fires confetti', () => {
    const ctx = context();
    const scene = createMomentScene(ctx, { blueprint, stage: 'kid', accessory: null, style: 'cheer', sky: ['#000', '#fff'], calm: true });
    for (let frame = 1; frame <= 120; frame += 1) scene.update(1 / 60, frame / 60);
    scene.cheer();
    const confetti = ctx.scene.children.find(
      (c): c is THREE.InstancedMesh => c instanceof THREE.InstancedMesh && c.count === MOMENT_SCENE.confetti,
    )!;
    const m = new THREE.Matrix4();
    confetti.getMatrixAt(0, m);
    expect(new THREE.Vector3().setFromMatrixPosition(m).y).toBeLessThan(-10);
    scene.dispose();
  });
});
