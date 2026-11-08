import * as THREE from 'three';

import { STAGE_SCALE, type GrowthStage } from '@/domain/pets/leveling';
import type { PetBlueprint } from '@/domain/pets/species';

import { buildAccessory } from './accessory-model';
import { adjust, Kit } from './kit';
import { buildPetRig } from './pet-model';
import type { AccessoryLook } from './pet-scene';
import type { StageContext, StageController } from './ThreeStage';

/**
 * - `cheer`: the pet leaps up from below with a spin, lands on a cloud and a
 *   confetti burst fires (in-a-row moments).
 * - `peek`: the pet leans in from the right edge and waves (second tries).
 * - `victory`: like cheer, on a bigger cloud, and it keeps hopping (results).
 */
export type MomentStyle = 'cheer' | 'peek' | 'victory';

export interface MomentSceneOptions {
  readonly blueprint: PetBlueprint;
  readonly stage: GrowthStage;
  readonly accessory: AccessoryLook | null;
  readonly style: MomentStyle;
  /** Sky gradient, top then horizon. */
  readonly sky: readonly [string, string];
  /** Reduced motion: no confetti, no spinning rays, no leaps; a gentle bob only. */
  readonly calm: boolean;
}

export interface MomentSceneController extends StageController {
  /** Another hop with a confetti burst (for example on a tap). */
  cheer(): void;
}

/** Timing and amounts (design/tuning.md, "Lesson feel"). */
export const MOMENT_SCENE = {
  confetti: 90,
  sparkles: 8,
  rays: 12,
  /** Seconds of the entrance (leap or lean-in). */
  enter: 0.75,
  /** Seconds of one hop, and the pause between hops on the results screen. */
  hop: 0.6,
  hopPause: 0.9,
  gravity: 4.2,
} as const;

const CONFETTI_COLORS = ['#FFC93C', '#FF5A6A', '#59C3FF', '#3CC46B', '#B39DDB', '#FF8A3D', '#FFFFFF'];

const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A full-screen celebration stage for the child's own pet: a sky dome, slow
 * sun rays, clouds and an instanced confetti burst. Follows the threejs-skills
 * performance rules: one draw call for all confetti, one for all cloud puffs,
 * one for the rays; nothing is allocated per frame; static meshes skip matrix
 * updates; motion is frame-rate independent (damped and time-based).
 */
export function createMomentScene(ctx: StageContext, options: MomentSceneOptions): MomentSceneController {
  const { scene, camera } = ctx;
  const kit = new Kit();
  const { calm, style } = options;
  camera.fov = 32;
  camera.near = 0.1;
  camera.far = 80;
  camera.updateProjectionMatrix();

  scene.add(new THREE.HemisphereLight('#FFFFFF', '#B7A8FF', 1.8));
  const sun = new THREE.DirectionalLight('#FFFFFF', 2.2);
  sun.position.set(2, 6, 5);
  scene.add(sun);

  // Sky dome: a vertex-colored sphere seen from inside (no texture, one draw call).
  const skyGeo = new THREE.SphereGeometry(40, 24, 16);
  const top = new THREE.Color(options.sky[0]);
  const horizon = new THREE.Color(options.sky[1]);
  const skyColors = new Float32Array(skyGeo.attributes.position!.count * 3);
  const mixed = new THREE.Color();
  for (let i = 0; i < skyGeo.attributes.position!.count; i += 1) {
    const y = skyGeo.attributes.position!.getY(i) / 40;
    mixed.copy(horizon).lerp(top, THREE.MathUtils.clamp((y + 0.3) / 0.6, 0, 1));
    skyColors.set([mixed.r, mixed.g, mixed.b], i * 3);
  }
  skyGeo.setAttribute('color', new THREE.BufferAttribute(skyColors, 3));
  const skyMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false });
  const sky = new THREE.Mesh(skyGeo, skyMaterial);
  scene.add(sky);
  freeze(sky);

  // Sun rays: wedges in one merged geometry, slowly turning behind the pet.
  let rays: THREE.Mesh | null = null;
  if (style !== 'peek') {
    const positions: number[] = [];
    const wedge = (Math.PI * 2) / (MOMENT_SCENE.rays * 2);
    for (let i = 0; i < MOMENT_SCENE.rays; i += 1) {
      const a = i * wedge * 2;
      positions.push(0, 0, 0, Math.cos(a) * 14, Math.sin(a) * 14, 0, Math.cos(a + wedge) * 14, Math.sin(a + wedge) * 14, 0);
    }
    const rayGeo = kit.geo(new THREE.BufferGeometry());
    rayGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    rays = new THREE.Mesh(rayGeo, kit.basic('#FFFFFF', { opacity: 0.22 }));
    rays.position.set(0, 1.4, -6);
    scene.add(rays);
  }

  // Clouds: every puff of every cloud in one InstancedMesh.
  const puffGeo = kit.geo(new THREE.SphereGeometry(0.5, 14, 10));
  const cloudLayout = cloudPuffs(style);
  const clouds = new THREE.InstancedMesh(puffGeo, kit.toon('#FFFFFF'), cloudLayout.length);
  const dummy = new THREE.Object3D();
  cloudLayout.forEach(([x, y, z, s], i) => {
    dummy.position.set(x, y, z);
    dummy.scale.set(s * 1.25, s, s);
    dummy.updateMatrix();
    clouds.setMatrixAt(i, dummy.matrix);
  });
  clouds.instanceMatrix.needsUpdate = true;
  clouds.frustumCulled = false;
  scene.add(clouds);

  // The pet, with its accessory.
  const rig = buildPetRig(options.blueprint);
  const stageScale = STAGE_SCALE[options.stage] * (style === 'victory' ? 1.1 : 1);
  if (options.accessory) rig.body.add(buildAccessory(options.accessory.model, options.accessory.color, rig.mounts, kit));
  scene.add(rig.root);
  const restX = style === 'peek' ? 1.25 : 0;

  // Confetti: one InstancedMesh, opaque and double-sided (a single draw call).
  const confettiGeo = kit.geo(new THREE.PlaneGeometry(0.11, 0.19));
  const confetti = new THREE.InstancedMesh(
    confettiGeo,
    kit.basic('#FFFFFF', { side: THREE.DoubleSide }),
    MOMENT_SCENE.confetti,
  );
  const tint = new THREE.Color();
  for (let i = 0; i < MOMENT_SCENE.confetti; i += 1) {
    confetti.setColorAt(i, tint.set(CONFETTI_COLORS[i % CONFETTI_COLORS.length] as string));
  }
  confetti.frustumCulled = false;
  scene.add(confetti);
  const pos = new Float32Array(MOMENT_SCENE.confetti * 3);
  const vel = new Float32Array(MOMENT_SCENE.confetti * 3);
  const rot = new Float32Array(MOMENT_SCENE.confetti * 3);
  const life = new Float32Array(MOMENT_SCENE.confetti);
  const hideAll = () => {
    dummy.position.set(0, -50, 0);
    dummy.scale.setScalar(0.0001);
    dummy.updateMatrix();
    for (let i = 0; i < MOMENT_SCENE.confetti; i += 1) confetti.setMatrixAt(i, dummy.matrix);
    confetti.instanceMatrix.needsUpdate = true;
  };
  hideAll();

  // Sparkles: small 4-point stars twinkling around the pet.
  const sparkleGeo = kit.geo(sparkleGeometry(0.16));
  const sparkles = new THREE.InstancedMesh(sparkleGeo, kit.basic('#FFF3B0'), MOMENT_SCENE.sparkles);
  sparkles.frustumCulled = false;
  scene.add(sparkles);

  let seed = 7;
  const random = () => {
    // Small deterministic LCG: the burst looks lively without Math.random in the loop.
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  let bursting = false;
  const burst = () => {
    if (calm) return;
    bursting = true;
    for (let i = 0; i < MOMENT_SCENE.confetti; i += 1) {
      const angle = random() * Math.PI * 2;
      const speed = 2.2 + random() * 3.2;
      pos.set([restX + (random() - 0.5) * 0.4, 1.3, 0.6], i * 3);
      vel.set([Math.cos(angle) * speed * 0.8, 2.5 + random() * 4.5, (random() - 0.2) * 1.5], i * 3);
      rot.set([random() * 6, random() * 6, random() * 6], i * 3);
      life[i] = 2.2 + random() * 1.4;
    }
  };

  /** Seconds into the current hop, or -1 between hops. */
  let hop = -1;
  let nextHop = Number.POSITIVE_INFINITY;
  let burstPending = !calm && style !== 'peek';
  const euler = new THREE.Euler();

  const frameCamera = (() => {
    let framed = -1;
    return () => {
      if (camera.aspect === framed) return;
      framed = camera.aspect;
      const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      // A full phone screen: the width decides; the pet takes about 45% of it.
      const needWidth = style === 'victory' ? 3.6 : 3.9;
      const needHeight = style === 'victory' ? 3.4 : 7;
      const distance = Math.max(needHeight / (2 * halfTan), needWidth / (2 * halfTan * camera.aspect));
      camera.position.set(0, 1.6, distance);
      camera.lookAt(0, style === 'victory' ? 1.1 : 1.6, 0);
    };
  })();

  return {
    cheer() {
      hop = 0;
      burst();
    },
    update(dt, time) {
      frameCamera();
      if (rays && !calm) rays.rotation.z = time * 0.12;

      // Entrance, then idle life.
      const enter = Math.min(1, time / MOMENT_SCENE.enter);
      let x = restX;
      let y = 0;
      let spin = 0;
      let roll = 0;
      let squash = 1 + Math.sin(time * 2.6) * 0.025;
      if (calm) {
        y = Math.sin(time * 1.6) * 0.05;
      } else if (style === 'peek') {
        x = restX + (1 - easeOutCubic(enter)) * 2.6;
        roll = 0.28 * easeOutBack(enter) - Math.sin(Math.max(0, time - MOMENT_SCENE.enter) * 5) * 0.08;
      } else {
        y = -3.2 + easeOutBack(enter) * 3.2 + Math.sin(enter * Math.PI) * 0.8;
        spin = (1 - easeOutCubic(enter)) * Math.PI * 2;
        if (enter >= 1 && burstPending) {
          burstPending = false;
          burst();
          hop = 0;
        }
      }
      if (hop < 0 && time >= nextHop) hop = 0;
      if (hop >= 0) {
        hop += dt;
        const p = hop / MOMENT_SCENE.hop;
        if (p >= 1) {
          hop = -1;
          if (style === 'victory' && !calm) nextHop = time + MOMENT_SCENE.hopPause;
        } else if (p < 0.18) {
          squash = 1 - 0.22 * Math.sin((p / 0.18) * Math.PI);
        } else if (p < 0.82) {
          const q = (p - 0.18) / 0.64;
          y += 4 * 0.6 * q * (1 - q);
          squash = 1.08;
        } else {
          squash = 1 - 0.18 * Math.sin(((p - 0.82) / 0.18) * Math.PI);
        }
      }
      // Waving: the ears and wings flap faster than the idle, the tail wags.
      rig.ears.forEach((ear, i) => {
        ear.rotation.z = (ear.userData.baseRotZ as number) + Math.sin(time * 7 + i * 1.7) * 0.12;
      });
      rig.wings.forEach((wing) => {
        wing.rotation.z = (wing.userData.side as number) * Math.sin(time * (calm ? 5 : 16)) * 0.35;
      });
      if (rig.tail) rig.tail.rotation.y = Math.sin(time * 8) * 0.4;

      rig.root.position.set(x, y * stageScale, style === 'peek' ? 0.4 : 0);
      rig.root.rotation.set(0, (style === 'peek' ? -0.45 : 0) + spin, roll);
      rig.root.scale.setScalar(stageScale);
      const thin = 1 / Math.sqrt(squash);
      rig.body.scale.set(thin, squash, thin);

      // Confetti physics: gravity, air drag and a flutter.
      if (bursting) {
        let alive = 0;
        for (let i = 0; i < MOMENT_SCENE.confetti; i += 1) {
          const l = (life[i] as number) - dt;
          life[i] = l;
          const k = i * 3;
          if (l <= 0) {
            dummy.position.set(0, -50, 0);
            dummy.scale.setScalar(0.0001);
          } else {
            alive += 1;
            vel[k + 1] = (vel[k + 1] as number) - MOMENT_SCENE.gravity * dt;
            const drag = Math.exp(-1.6 * dt);
            vel[k] = (vel[k] as number) * drag;
            vel[k + 1] = Math.max(-1.4, vel[k + 1] as number);
            pos[k] = (pos[k] as number) + ((vel[k] as number) + Math.sin(time * 6 + i) * 0.35) * dt;
            pos[k + 1] = (pos[k + 1] as number) + (vel[k + 1] as number) * dt;
            pos[k + 2] = (pos[k + 2] as number) + (vel[k + 2] as number) * dt;
            rot[k] = (rot[k] as number) + dt * 5;
            rot[k + 1] = (rot[k + 1] as number) + dt * 3;
            dummy.position.set(pos[k] as number, pos[k + 1] as number, pos[k + 2] as number);
            euler.set(rot[k] as number, rot[k + 1] as number, rot[k + 2] as number);
            dummy.rotation.copy(euler);
            dummy.scale.setScalar(Math.min(1, l * 2));
          }
          dummy.updateMatrix();
          confetti.setMatrixAt(i, dummy.matrix);
        }
        confetti.instanceMatrix.needsUpdate = true;
        if (alive === 0) bursting = false;
      }

      // Sparkles twinkle on a ring around the pet.
      for (let i = 0; i < MOMENT_SCENE.sparkles; i += 1) {
        const a = (i / MOMENT_SCENE.sparkles) * Math.PI * 2 + time * 0.4;
        const twinkle = calm ? 0.7 : Math.max(0, Math.sin(time * 3 + i * 1.9));
        dummy.position.set(restX + Math.cos(a) * 1.7, 1.3 + Math.sin(a) * 1.3, -0.3);
        dummy.rotation.set(0, 0, time * 2 + i);
        dummy.scale.setScalar(0.3 + twinkle * 0.9);
        dummy.updateMatrix();
        sparkles.setMatrixAt(i, dummy.matrix);
      }
      sparkles.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      rig.kit.dispose();
      kit.dispose();
      skyGeo.dispose();
      skyMaterial.dispose();
      clouds.dispose();
      confetti.dispose();
      sparkles.dispose();
      scene.clear();
    },
  };
}

/** Static objects: compose the matrix once and skip it every frame. */
function freeze(object: THREE.Object3D) {
  object.matrixAutoUpdate = false;
  object.updateMatrix();
}

/** Puffs [x, y, z, scale]: a cloud under the pet and a soft bank along the bottom. */
function cloudPuffs(style: MomentStyle): [number, number, number, number][] {
  const under = style === 'peek' ? 1.25 : 0;
  const size = style === 'victory' ? 1.25 : 1;
  const puffs: [number, number, number, number][] = [
    [under, -0.55, 0, 1.15 * size],
    [under - 0.75 * size, -0.6, 0.1, 0.85 * size],
    [under + 0.75 * size, -0.6, 0.1, 0.85 * size],
    [under - 0.35, -0.8, 0.45, 0.75 * size],
    [under + 0.4, -0.8, 0.45, 0.75 * size],
  ];
  for (let i = 0; i < 9; i += 1) {
    const x = -4.6 + i * 1.15;
    puffs.push([x, -2.4 + (i % 2) * 0.3, -1.5, 1.4 + (i % 3) * 0.25]);
  }
  return puffs;
}

/** A flat 4-point star. */
function sparkleGeometry(size: number): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  const inner = size * 0.28;
  for (let i = 0; i < 8; i += 1) {
    const r = i % 2 === 0 ? size : inner;
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

/** Sky colors for a world tint: a deeper top and a light horizon. */
export function momentSky(color: string): [string, string] {
  return [adjust(color, -0.15), adjust(color, 0.55)];
}
