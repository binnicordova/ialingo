import * as THREE from 'three';

import type { AccessoryModel } from '@/domain/pets/accessory';
import { STAGE_SCALE, type GrowthStage } from '@/domain/pets/leveling';
import type { PetBlueprint } from '@/domain/pets/species';

import { buildAccessory } from './accessory-model';
import { buildEggRig, type EggRig } from './egg-model';
import { adjust, heartGeometry, Kit } from './kit';
import { buildPetRig, type PetRig } from './pet-model';
import type { StageContext, StageController } from './ThreeStage';

export type PetAction = 'jump' | 'spin' | 'eat' | 'love' | 'wiggle' | 'wobble' | 'hatch';

export interface AccessoryLook {
  readonly model: AccessoryModel;
  readonly color: string;
}

export interface PetSceneOptions {
  readonly blueprint: PetBlueprint;
  readonly stage: GrowthStage;
  readonly accessory: AccessoryLook | null;
  readonly sleeping: boolean;
  readonly mode: 'pet' | 'egg';
  readonly ground: string;
  /** Smaller framing for compact cards. */
  readonly closeUp?: boolean;
  /** Reduced motion: softer idle animation, no drifting clouds. */
  readonly calm?: boolean;
}

export interface PetSceneController extends StageController {
  play(action: PetAction): void;
  setAccessory(accessory: AccessoryLook | null): void;
  setStage(stage: GrowthStage): void;
  setSleeping(sleeping: boolean): void;
  /** Drag rotation in radians (null when the finger lifts). */
  dragYaw(yaw: number | null): void;
}

const ACTION_SECONDS: Readonly<Record<PetAction, number>> = {
  jump: 0.85,
  spin: 1.0,
  eat: 1.5,
  love: 1.2,
  wiggle: 0.6,
  wobble: 0.7,
  hatch: 1.6,
};

const HEART_COUNT = 6;
const BUBBLE_COUNT = 3;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/**
 * Builds the pet's little island and returns a controller that animates the
 * pet with procedural motion (breathing, blinking, ear twitches, tail wag) plus
 * one-shot actions triggered by play: jump, spin, eat, love, wobble, hatch.
 * Nothing is allocated per frame.
 */
export function createPetScene(
  ctx: StageContext,
  options: PetSceneOptions,
  callbacks: { onHatched?: () => void } = {},
): PetSceneController {
  const { scene, camera } = ctx;
  const sceneKit = new Kit();

  camera.fov = 30;
  camera.updateProjectionMatrix();

  /**
   * Fits the pet in both directions for any viewport: tall phone screens are
   * limited by width, wide cards by height. Re-runs only when the aspect changes.
   */
  let framedAspect = -1;
  const frameCamera = () => {
    if (camera.aspect === framedAspect) return;
    framedAspect = camera.aspect;
    const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const needHeight = options.closeUp ? 2.8 : 3.4;
    const needWidth = options.closeUp ? 2.7 : 3.3;
    const distance = Math.max(needHeight / (2 * halfTan), needWidth / (2 * halfTan * camera.aspect));
    const lookY = options.mode === 'egg' ? 0.9 : 1.05;
    camera.position.set(0, lookY + distance * 0.13, distance);
    camera.lookAt(0, lookY, 0);
  };

  scene.add(new THREE.HemisphereLight('#FFFFFF', '#B7A8FF', 1.7));
  const sun = new THREE.DirectionalLight('#FFFFFF', 2.3);
  sun.position.set(3, 6, 4);
  scene.add(sun);

  // Island
  const island = sceneKit.mesh(new THREE.CylinderGeometry(2.3, 2.1, 0.32, 48), sceneKit.toon(options.ground));
  island.position.y = -0.16;
  sceneKit.outline(island, adjust(options.ground, -0.45), 1.02);
  scene.add(island);
  const rim = sceneKit.mesh(new THREE.CylinderGeometry(2.1, 1.7, 0.4, 48), sceneKit.toon(adjust(options.ground, -0.25)));
  rim.position.y = -0.5;
  scene.add(rim);
  addDecorations(scene, sceneKit);

  const shadow = sceneKit.mesh(new THREE.CircleGeometry(0.95, 32), sceneKit.basic('#000000', { opacity: 0.16 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  scene.add(shadow);

  // Clouds drifting in the back
  const clouds = addClouds(scene, sceneKit);

  // Pet
  const rig: PetRig = buildPetRig(options.blueprint);
  scene.add(rig.root);
  let stageScale = STAGE_SCALE[options.stage];
  rig.root.scale.setScalar(stageScale);

  let accessoryKit: Kit | null = null;
  let accessoryObject: THREE.Object3D | null = null;
  const setAccessory = (look: AccessoryLook | null) => {
    if (accessoryObject) rig.body.remove(accessoryObject);
    accessoryKit?.dispose();
    accessoryKit = null;
    accessoryObject = null;
    if (!look) return;
    accessoryKit = new Kit();
    accessoryObject = buildAccessory(look.model, look.color, rig.mounts, accessoryKit);
    rig.body.add(accessoryObject);
  };
  setAccessory(options.accessory);

  // Egg
  let mode = options.mode;
  let egg: EggRig | null = null;
  if (mode === 'egg') {
    egg = buildEggRig(options.blueprint, sceneKit);
    scene.add(egg.root);
    rig.root.visible = false;
  }

  // Berry used by the "eat" action
  const berry = new THREE.Group();
  const berryBody = sceneKit.mesh(new THREE.SphereGeometry(0.2, 18, 12), sceneKit.toon('#E8436B'));
  const berryLeaf = sceneKit.mesh(new THREE.ConeGeometry(0.1, 0.12, 6), sceneKit.toon('#43A047'));
  berryLeaf.position.y = 0.2;
  berryLeaf.rotation.x = Math.PI;
  berry.add(berryBody, berryLeaf);
  berry.visible = false;
  scene.add(berry);

  // Particles
  const heartGeo = sceneKit.geo(heartGeometry(0.16));
  const hearts = Array.from({ length: HEART_COUNT }, (_, i) => {
    const mesh = new THREE.Mesh(heartGeo, sceneKit.fading(i % 2 ? '#FF5C8A' : '#FF8FB1'));
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, life: 0, vx: 0, vy: 0 };
  });
  const bubbleGeo = sceneKit.geo(new THREE.SphereGeometry(0.1, 12, 8));
  const bubbles = Array.from({ length: BUBBLE_COUNT }, () => {
    const mesh = new THREE.Mesh(bubbleGeo, sceneKit.fading('#BBDEFB'));
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, life: 0 };
  });

  let sleeping = options.sleeping;
  /** Idle animation strength (reduced-motion setting). */
  const motion = options.calm ? 0.35 : 1;
  let action: { name: PetAction; t: number } | null = null;
  let yaw = 0;
  let yawTarget = 0;
  let dragging = false;
  let blinkIn = 2.5;
  let blinkTime = -1;
  let bubbleTimer = 0;
  let wobbleCount = 0;

  const emitHearts = () => {
    hearts.forEach((h, i) => {
      h.life = 1 + i * 0.08;
      h.vx = (i - (HEART_COUNT - 1) / 2) * 0.32;
      h.vy = 1.2 + (i % 3) * 0.25;
      h.mesh.visible = true;
      h.mesh.position.set(0, 1.9 * stageScale, 0.6);
      h.mesh.scale.setScalar(0.4);
    });
  };

  const play = (name: PetAction) => {
    if (mode === 'egg' && name !== 'wobble' && name !== 'hatch') return;
    if (mode === 'pet' && name === 'wobble') return;
    if (sleeping && name !== 'wiggle' && name !== 'love') {
      action = { name: 'wiggle', t: 0 };
      return;
    }
    action = { name, t: 0 };
    if (name === 'love') emitHearts();
    if (name === 'wobble') wobbleCount += 1;
  };

  const updateParticles = (dt: number) => {
    for (const h of hearts) {
      if (h.life <= 0) continue;
      h.life -= dt * 0.8;
      h.mesh.position.x += h.vx * dt;
      h.mesh.position.y += h.vy * dt;
      h.mesh.scale.setScalar(Math.min(1, 0.4 + (1 - h.life) * 2));
      h.mesh.quaternion.copy(camera.quaternion);
      (h.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, Math.min(1, h.life * 1.5));
      if (h.life <= 0) h.mesh.visible = false;
    }
    if (sleeping && mode === 'pet') {
      bubbleTimer -= dt;
      if (bubbleTimer <= 0) {
        bubbleTimer = 1.1;
        const free = bubbles.find((b) => b.life <= 0);
        if (free) {
          free.life = 1;
          free.mesh.visible = true;
          free.mesh.position.set(0.45 * stageScale, 2.1 * stageScale, 0.3);
        }
      }
    }
    for (const b of bubbles) {
      if (b.life <= 0) continue;
      b.life -= dt * 0.45;
      b.mesh.position.y += dt * 0.45;
      b.mesh.position.x += dt * 0.15;
      b.mesh.scale.setScalar(0.6 + (1 - b.life) * 1.4);
      (b.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, b.life * 0.9);
      if (b.life <= 0) b.mesh.visible = false;
    }
  };

  const updateEgg = (dt: number, time: number) => {
    if (!egg) return;
    let tilt = Math.sin(time * 2.2) * 0.04;
    if (action?.name === 'wobble') {
      const p = action.t / ACTION_SECONDS.wobble;
      tilt = Math.sin(p * Math.PI * 4) * 0.22 * (1 - p) * (1 + wobbleCount * 0.15);
    }
    if (action?.name === 'hatch') {
      const p = Math.min(1, action.t / 0.7);
      egg.top.position.set(-p * 0.8, p * 1.6 - p * p * 0.6, 0);
      egg.top.rotation.z = p * 1.4;
      egg.bottom.scale.setScalar(Math.max(0.001, 1 - p * 0.9));
      egg.root.rotation.z = 0;
      if (action.t >= 0.55) {
        // Reveal the pet and keep the same action running for the pop-in.
        mode = 'pet';
        rig.root.visible = true;
        egg.root.visible = false;
        emitHearts();
        action = { name: 'hatch', t: 0 };
      }
      return;
    }
    egg.root.rotation.z = tilt;
    egg.root.position.y = 0.02 + Math.abs(tilt) * 0.2;
    void dt;
  };

  const updatePet = (dt: number, time: number) => {
    // Idle life: breathing, ears, tail, wings, blinking.
    const breatheSpeed = sleeping ? 1.3 : 2.4;
    const breathe = Math.sin(time * breatheSpeed) * motion;
    let squash = 1 + breathe * (sleeping ? 0.035 : 0.022);
    let offsetY = 0;
    let spin = 0;
    let rollZ = 0;
    let scaleIn = 1;

    rig.ears.forEach((ear, i) => {
      ear.rotation.z = (ear.userData.baseRotZ as number) + Math.sin(time * 3 + i * 1.7) * 0.07 * motion;
    });
    if (rig.tail) rig.tail.rotation.y = Math.sin(time * (sleeping ? 1.5 : 6)) * (sleeping ? 0.1 : 0.35) * motion;
    const flap = action?.name === 'jump' || action?.name === 'spin' ? 14 : 5;
    rig.wings.forEach((wing) => {
      wing.rotation.z = (wing.userData.side as number) * Math.sin(time * flap) * 0.3;
    });

    if (sleeping) {
      for (const eye of rig.eyes) eye.scale.y = 0.08;
    } else {
      blinkIn -= dt;
      if (blinkIn <= 0 && blinkTime < 0) {
        blinkTime = 0;
        blinkIn = 2 + Math.random() * 3;
      }
      let blink = 1;
      if (blinkTime >= 0) {
        blinkTime += dt;
        blink = blinkTime < 0.07 ? 1 - blinkTime / 0.07 : Math.min(1, (blinkTime - 0.07) / 0.07);
        if (blinkTime > 0.14) blinkTime = -1;
      }
      for (const eye of rig.eyes) eye.scale.y = (eye.userData.baseScaleY as number) * Math.max(0.08, blink);
    }

    rig.mouth.scale.set(1, 1, 1);
    berry.visible = false;

    if (action) {
      const duration = ACTION_SECONDS[action.name];
      const p = Math.min(1, action.t / duration);
      switch (action.name) {
        case 'jump': {
          if (p < 0.18) squash = 1 - 0.22 * Math.sin((p / 0.18) * Math.PI);
          else if (p < 0.82) {
            const q = (p - 0.18) / 0.64;
            offsetY = 4 * 1.0 * q * (1 - q);
            squash = 1.08;
          } else squash = 1 - 0.18 * Math.sin(((p - 0.82) / 0.18) * Math.PI);
          break;
        }
        case 'spin':
          spin = easeInOut(p) * Math.PI * 2;
          offsetY = Math.sin(p * Math.PI) * 0.35;
          break;
        case 'eat': {
          const mouthY = rig.mouth.position.y * stageScale;
          const mouthZ = rig.mouth.position.z * stageScale + 0.35;
          if (p < 0.35) {
            const q = p / 0.35;
            berry.visible = true;
            berry.position.set(0, 3.4 - (3.4 - mouthY) * easeInOut(q), mouthZ);
            berry.scale.setScalar(1);
            rig.mouth.scale.set(1.4, 2.2, 1);
          } else if (p < 0.7) {
            const q = (p - 0.35) / 0.35;
            berry.visible = q < 0.5;
            berry.position.set(0, mouthY, mouthZ);
            berry.scale.setScalar(Math.max(0.01, 1 - q * 2));
            rig.mouth.scale.set(1.2, 1 + Math.abs(Math.sin(q * Math.PI * 4)) * 1.6, 1);
            squash = 1 - Math.abs(Math.sin(q * Math.PI * 4)) * 0.06;
          } else if (action.t - dt < duration * 0.7) {
            emitHearts();
          }
          break;
        }
        case 'love':
          rollZ = Math.sin(p * Math.PI * 6) * 0.12 * (1 - p);
          offsetY = Math.abs(Math.sin(p * Math.PI * 3)) * 0.2 * (1 - p);
          break;
        case 'wiggle':
          rollZ = Math.sin(p * Math.PI * 6) * 0.1 * (1 - p);
          break;
        case 'hatch':
          scaleIn = Math.max(0.001, easeOutBack(Math.min(1, p * 1.4)));
          offsetY = Math.sin(Math.min(1, p * 1.4) * Math.PI) * 0.5;
          if (action.t >= duration - dt) callbacks.onHatched?.();
          break;
        case 'wobble':
          break;
      }
      action.t += dt;
      if (action.t >= duration) action = null;
    }

    if (!dragging) yawTarget = THREE.MathUtils.damp(yawTarget, 0, 1.2, dt);
    yaw = THREE.MathUtils.damp(yaw, yawTarget, 8, dt);

    rig.root.position.y = offsetY * stageScale;
    rig.root.rotation.set(0, yaw + spin, rollZ);
    rig.root.scale.setScalar(stageScale * scaleIn);
    const thin = 1 / Math.sqrt(squash);
    rig.body.scale.set(thin, squash, thin);
    shadow.scale.setScalar(Math.max(0.4, 1 - offsetY * 0.35) * stageScale * scaleIn + 0.001);
  };

  return {
    play,
    setAccessory,
    setStage(stage) {
      stageScale = STAGE_SCALE[stage];
    },
    setSleeping(value) {
      sleeping = value;
    },
    dragYaw(value) {
      dragging = value !== null;
      if (value !== null) yawTarget = value;
    },
    update(dt, time) {
      frameCamera();
      for (let i = 0; i < clouds.length && !options.calm; i += 1) {
        const cloud = clouds[i] as THREE.Object3D;
        cloud.position.x = ((cloud.userData.x0 as number) + time * 0.12 * (i + 1) + 6) % 12 - 6;
      }
      if (mode === 'egg') updateEgg(dt, time);
      else updatePet(dt, time);
      if (action && mode === 'egg') {
        action.t += dt;
        if (action.t >= ACTION_SECONDS[action.name]) action = null;
      }
      updateParticles(dt);
    },
    dispose() {
      accessoryKit?.dispose();
      rig.kit.dispose();
      sceneKit.dispose();
      scene.clear();
    },
  };
}

function addDecorations(scene: THREE.Scene, kit: Kit) {
  const stemGeo = kit.geo(new THREE.CylinderGeometry(0.025, 0.025, 0.24, 6));
  const bloomGeo = kit.geo(new THREE.SphereGeometry(0.09, 10, 8));
  const flowerColors = ['#FF8FB1', '#FFD54F', '#B39DDB', '#FFFFFF', '#FF8A65'];
  // Flowers ring the back and the sides of the island, never in front of the pet.
  for (let i = 0; i < 7; i += 1) {
    const a = Math.PI * (1.05 + i * 0.15);
    const r = 1.8 + (i % 2) * 0.22;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r * 0.8;
    const stem = new THREE.Mesh(stemGeo, kit.toon('#4CAF50'));
    stem.position.set(x, 0.12, z);
    const bloom = new THREE.Mesh(bloomGeo, kit.toon(flowerColors[i % flowerColors.length] as string));
    bloom.position.set(x, 0.27, z);
    scene.add(stem, bloom);
  }
  const rockGeo = kit.geo(new THREE.DodecahedronGeometry(0.16, 0));
  for (const [x, z, s] of [
    [-1.7, 0.2, 1],
    [1.75, 0.35, 0.7],
    [-0.9, -1.4, 0.8],
  ] as const) {
    const rock = new THREE.Mesh(rockGeo, kit.toon('#B0BEC5'));
    rock.position.set(x, 0.06, z);
    rock.scale.setScalar(s);
    scene.add(rock);
  }
}

function addClouds(scene: THREE.Scene, kit: Kit): THREE.Object3D[] {
  const puffGeo = kit.geo(new THREE.SphereGeometry(0.4, 14, 10));
  const material = kit.toon('#FFFFFF');
  return [
    [-3, 3.3, -5],
    [2.5, 2.7, -6],
  ].map(([x, y, z]) => {
    const cloud = new THREE.Group();
    for (const [dx, dy, s] of [
      [0, 0, 1],
      [0.45, 0.1, 0.8],
      [-0.45, 0.05, 0.85],
      [0.15, 0.3, 0.75],
    ] as const) {
      const puff = new THREE.Mesh(puffGeo, material);
      puff.position.set(dx, dy, 0);
      puff.scale.setScalar(s);
      cloud.add(puff);
    }
    cloud.position.set(x as number, y as number, z as number);
    cloud.userData.x0 = x;
    scene.add(cloud);
    return cloud;
  });
}
