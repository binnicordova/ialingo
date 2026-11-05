import * as THREE from 'three';

import type { BodyShape, PetBlueprint } from '@/domain/pets/species';

import { adjust, Kit } from './kit';

/** Handles to the animatable parts of a procedurally built pet. */
export interface PetRig {
  /** Whole pet; its origin sits on the ground. */
  readonly root: THREE.Group;
  /** Squash-and-stretch target (pivot at the feet). */
  readonly body: THREE.Group;
  readonly eyes: readonly THREE.Object3D[];
  readonly mouth: THREE.Mesh;
  readonly ears: readonly THREE.Object3D[];
  readonly tail: THREE.Object3D | null;
  readonly wings: readonly THREE.Object3D[];
  /** Where hats and crowns go (top of the head). */
  readonly mounts: AccessoryMounts;
  readonly kit: Kit;
}

export interface AccessoryMounts {
  readonly top: THREE.Vector3;
  readonly eyes: THREE.Vector3;
  /** Body radius at scarf height and that height. */
  readonly neckY: number;
  readonly neckRadius: number;
  readonly sideX: number;
}

const BODY_SCALE: Readonly<Record<BodyShape, THREE.Vector3Like>> = {
  round: { x: 1, y: 0.95, z: 0.95 },
  tall: { x: 0.86, y: 1.1, z: 0.86 },
  wide: { x: 1.16, y: 0.84, z: 1.0 },
};

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Builds a pet from its blueprint with simple primitives (spheres, cones,
 * capsules, tori and tubes), cel-shaded with inverted-hull outlines. There is no
 * asset pipeline, so every pet is a few KB of data.
 */
export function buildPetRig(bp: PetBlueprint): PetRig {
  const kit = new Kit();
  const S = BODY_SCALE[bp.body];
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const center = new THREE.Vector3(0, S.y, 0);
  const ink = adjust(bp.primary, -0.55);

  /** Point on the body ellipsoid in direction (x, y, z), plus an outward offset. */
  const surface = (x: number, y: number, z: number, out = 0): THREE.Vector3 => {
    const dir = new THREE.Vector3(x, y, z).normalize();
    const p = new THREE.Vector3(dir.x * S.x, dir.y * S.y, dir.z * S.z);
    const normal = new THREE.Vector3(p.x / (S.x * S.x), p.y / (S.y * S.y), p.z / (S.z * S.z)).normalize();
    return p.add(center).addScaledVector(normal, out);
  };
  const normalAt = (x: number, y: number, z: number): THREE.Vector3 => {
    const dir = new THREE.Vector3(x, y, z).normalize();
    return new THREE.Vector3(dir.x / S.x, dir.y / S.y, dir.z / S.z).normalize();
  };
  /** Places a mesh on the surface, oriented along the normal (+Y = outward). */
  const stick = (obj: THREE.Object3D, x: number, y: number, z: number, out = 0) => {
    obj.position.copy(surface(x, y, z, out));
    obj.quaternion.setFromUnitVectors(UP, normalAt(x, y, z));
    body.add(obj);
    return obj;
  };

  // Body
  const bodyMesh = kit.mesh(new THREE.SphereGeometry(1, 40, 28), kit.toon(bp.primary));
  bodyMesh.scale.set(S.x, S.y, S.z);
  bodyMesh.position.copy(center);
  kit.outline(bodyMesh, ink, 1.045);
  body.add(bodyMesh);

  // Belly or spots
  if (bp.pattern === 'belly') {
    const belly = kit.mesh(new THREE.SphereGeometry(1, 32, 20), kit.toon(bp.secondary));
    belly.scale.set(S.x * 0.62, S.y * 0.56, S.z * 0.42);
    belly.position.set(0, S.y * 0.7, S.z * 0.6);
    body.add(belly);
  } else if (bp.pattern === 'spots') {
    const spotGeo = kit.geo(new THREE.SphereGeometry(0.15, 16, 10));
    const spotMat = kit.toon(bp.accent);
    const spots: [number, number, number][] = [
      [-0.75, 0.15, 0.55],
      [0.7, 0.45, 0.4],
      [0.55, -0.35, 0.7],
      [-0.3, 0.75, 0.45],
      [-0.6, -0.2, -0.6],
      [0.4, 0.3, -0.85],
    ];
    for (const [x, y, z] of spots) {
      const spot = new THREE.Mesh(spotGeo, spotMat);
      spot.scale.set(1, 0.3, 1);
      stick(spot, x, y, z, -0.02);
    }
  }

  // Feet
  const footGeo = kit.geo(new THREE.SphereGeometry(0.22, 20, 12));
  const footMat = kit.toon(adjust(bp.primary, -0.25));
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.scale.set(1, 0.55, 1.25);
    foot.position.set(side * S.x * 0.42, 0.09, S.z * 0.38);
    body.add(foot);
  }

  // Eyes (groups, so blinking just scales y)
  const eyeWhiteGeo = kit.geo(new THREE.SphereGeometry(0.17, 24, 16));
  const pupilGeo = kit.geo(new THREE.SphereGeometry(bp.eyes === 'sparkle' ? 0.115 : 0.095, 20, 12));
  const glintGeo = kit.geo(new THREE.SphereGeometry(0.038, 10, 8));
  const eyes: THREE.Object3D[] = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    const white = new THREE.Mesh(eyeWhiteGeo, kit.basic('#FFFFFF'));
    white.scale.set(1, 1.12, 0.55);
    const pupil = new THREE.Mesh(pupilGeo, kit.basic('#2D2A4A'));
    pupil.position.set(0, -0.01, 0.07);
    pupil.scale.set(1, 1.1, 0.6);
    const glint = new THREE.Mesh(glintGeo, kit.basic('#FFFFFF'));
    glint.position.set(0.035, 0.05, 0.13);
    eye.add(white, pupil, glint);
    if (bp.eyes === 'sparkle') {
      const glint2 = new THREE.Mesh(glintGeo, kit.basic('#FFFFFF'));
      glint2.scale.setScalar(0.6);
      glint2.position.set(-0.04, -0.045, 0.13);
      eye.add(glint2);
    }
    eye.position.copy(surface(side * 0.34, 0.2, 0.92, -0.04));
    if (bp.eyes === 'sleepy') eye.scale.y = 0.55;
    eye.userData.baseScaleY = eye.scale.y;
    body.add(eye);
    eyes.push(eye);
  }

  // Cheeks
  const cheekGeo = kit.geo(new THREE.SphereGeometry(0.11, 16, 10));
  const cheekMat = kit.basic('#FF7FA8', { opacity: 0.55 });
  for (const side of [-1, 1]) {
    const cheek = new THREE.Mesh(cheekGeo, cheekMat);
    cheek.scale.set(1.2, 0.3, 0.75);
    stick(cheek, side * 0.6, 0.02, 0.8, -0.01);
  }

  // Mouth: half torus turned into a smile
  const mouth = kit.mesh(new THREE.TorusGeometry(0.1, 0.028, 8, 20, Math.PI), kit.basic('#2D2A4A'));
  mouth.rotation.z = Math.PI;
  mouth.position.copy(surface(0, 0.02, 1, 0.005));
  body.add(mouth);

  const ears = buildEars(bp, kit, surface, body);
  const tail = buildTail(bp, kit, surface, body, ink);
  const wings = buildExtras(bp, kit, surface, normalAt, body, S, center, ink);

  const neckY = S.y * 0.55;
  const dy = (neckY - S.y) / S.y;
  const mounts: AccessoryMounts = {
    top: new THREE.Vector3(0, S.y * 2 - 0.04, 0.02),
    eyes: surface(0, 0.2, 0.92, 0.06),
    neckY,
    neckRadius: S.x * Math.sqrt(Math.max(0, 1 - dy * dy)) + 0.03,
    sideX: S.x,
  };

  return { root, body, eyes, mouth, ears, tail, wings, mounts, kit };
}

type SurfaceFn = (x: number, y: number, z: number, out?: number) => THREE.Vector3;

function buildEars(bp: PetBlueprint, kit: Kit, surface: SurfaceFn, body: THREE.Group): THREE.Object3D[] {
  const ears: THREE.Object3D[] = [];
  const outline = adjust(bp.primary, -0.55);
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    switch (bp.ears) {
      case 'cat': {
        const cone = kit.mesh(new THREE.ConeGeometry(0.25, 0.5, 20), kit.toon(bp.primary));
        kit.outline(cone, outline, 1.07);
        const inner = kit.mesh(new THREE.ConeGeometry(0.13, 0.3, 16), kit.toon(bp.secondary));
        inner.position.set(0, -0.04, 0.1);
        cone.add(inner);
        cone.position.y = 0.2;
        ear.add(cone);
        ear.position.copy(surface(side * 0.48, 0.85, 0.05, -0.08));
        ear.rotation.z = -side * 0.32;
        break;
      }
      case 'bunny': {
        const capsule = kit.mesh(new THREE.CapsuleGeometry(0.13, 0.55, 6, 14), kit.toon(bp.primary));
        kit.outline(capsule, outline, 1.07);
        const inner = kit.mesh(new THREE.CapsuleGeometry(0.065, 0.42, 4, 10), kit.toon('#FFB3C8'));
        inner.position.set(0, 0, 0.08);
        capsule.add(inner);
        capsule.position.y = 0.42;
        ear.add(capsule);
        ear.position.copy(surface(side * 0.3, 0.92, 0.05, -0.08));
        ear.rotation.z = -side * 0.14;
        break;
      }
      case 'round': {
        const ball = kit.mesh(new THREE.SphereGeometry(0.22, 20, 14), kit.toon(bp.primary));
        ball.scale.set(1, 1, 0.55);
        kit.outline(ball, outline, 1.07);
        const inner = kit.mesh(new THREE.SphereGeometry(0.12, 16, 10), kit.toon(bp.secondary));
        inner.position.z = 0.1;
        ball.add(inner);
        ear.add(ball);
        ear.position.copy(surface(side * 0.62, 0.72, 0, 0.02));
        break;
      }
      case 'floppy': {
        const capsule = kit.mesh(new THREE.CapsuleGeometry(0.14, 0.42, 6, 14), kit.toon(bp.accent));
        kit.outline(capsule, outline, 1.07);
        capsule.position.y = -0.24;
        ear.add(capsule);
        ear.position.copy(surface(side * 0.82, 0.55, 0.15, -0.02));
        ear.rotation.z = side * 0.35;
        break;
      }
      case 'horns': {
        const horn = kit.mesh(new THREE.ConeGeometry(0.09, 0.36, 16), kit.toon('#FFF3C4'));
        kit.outline(horn, outline, 1.08);
        horn.position.y = 0.15;
        ear.add(horn);
        ear.position.copy(surface(side * 0.4, 0.88, 0.15, -0.05));
        ear.rotation.z = -side * 0.4;
        break;
      }
      case 'antenna': {
        const stalk = kit.mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.45, 8), kit.toon(outline));
        stalk.position.y = 0.22;
        const tip = kit.mesh(new THREE.SphereGeometry(0.09, 16, 10), kit.toon(bp.accent));
        tip.position.y = 0.47;
        ear.add(stalk, tip);
        ear.position.copy(surface(side * 0.24, 0.95, 0.1, -0.03));
        ear.rotation.z = -side * 0.3;
        break;
      }
      case 'none':
        continue;
    }
    ear.userData.baseRotZ = ear.rotation.z;
    body.add(ear);
    ears.push(ear);
  }
  return ears;
}

function buildTail(
  bp: PetBlueprint,
  kit: Kit,
  surface: SurfaceFn,
  body: THREE.Group,
  outline: string,
): THREE.Object3D | null {
  if (bp.tail === 'none') return null;
  const tail = new THREE.Group();
  tail.position.copy(surface(0, -0.42, -1, -0.05));
  switch (bp.tail) {
    case 'fluffy': {
      const puff = kit.mesh(new THREE.SphereGeometry(0.3, 20, 14), kit.toon(bp.secondary));
      puff.position.set(0, 0.05, -0.15);
      kit.outline(puff, outline, 1.07);
      tail.add(puff);
      break;
    }
    case 'stub': {
      const stub = kit.mesh(new THREE.SphereGeometry(0.16, 16, 10), kit.toon(bp.primary));
      stub.position.z = -0.08;
      tail.add(stub);
      break;
    }
    case 'long': {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.22, 0.12, -0.45),
        new THREE.Vector3(0.32, 0.55, -0.6),
        new THREE.Vector3(0.22, 0.92, -0.42),
      ]);
      const tube = kit.mesh(new THREE.TubeGeometry(curve, 24, 0.075, 8), kit.toon(bp.primary));
      kit.outline(tube, outline, 1.1);
      const tip = kit.mesh(new THREE.SphereGeometry(0.12, 14, 10), kit.toon(bp.accent));
      tip.position.set(0.22, 0.92, -0.42);
      tail.add(tube, tip);
      break;
    }
    case 'fish': {
      const fin = kit.mesh(new THREE.ConeGeometry(0.32, 0.5, 4), kit.toon(bp.accent));
      fin.scale.set(1, 1, 0.3);
      fin.rotation.x = -Math.PI / 2;
      fin.rotation.y = Math.PI / 4;
      fin.position.z = -0.3;
      kit.outline(fin, outline, 1.08);
      tail.add(fin);
      break;
    }
    case 'curly': {
      const curl = kit.mesh(new THREE.TorusGeometry(0.18, 0.06, 8, 24, Math.PI * 1.6), kit.toon(bp.primary));
      curl.rotation.y = Math.PI / 2;
      curl.position.set(0, 0.16, -0.12);
      kit.outline(curl, outline, 1.1);
      tail.add(curl);
      break;
    }
  }
  body.add(tail);
  return tail;
}

function buildExtras(
  bp: PetBlueprint,
  kit: Kit,
  surface: SurfaceFn,
  normalAt: (x: number, y: number, z: number) => THREE.Vector3,
  body: THREE.Group,
  S: THREE.Vector3Like,
  center: THREE.Vector3,
  outline: string,
): THREE.Object3D[] {
  const wings: THREE.Object3D[] = [];
  switch (bp.extra) {
    case 'wings': {
      for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.copy(surface(side * 0.92, 0.25, -0.35, -0.05));
        const wing = kit.mesh(new THREE.SphereGeometry(0.5, 20, 14), kit.toon(bp.secondary));
        wing.scale.set(1, 0.55, 0.14);
        wing.position.x = side * 0.38;
        wing.rotation.z = side * 0.35;
        kit.outline(wing, outline, 1.06);
        pivot.add(wing);
        pivot.userData.side = side;
        body.add(pivot);
        wings.push(pivot);
      }
      break;
    }
    case 'spikes': {
      const spikeGeo = kit.geo(new THREE.ConeGeometry(0.11, 0.32, 12));
      const spikeMat = kit.toon(bp.accent);
      for (const [y, z] of [
        [0.98, -0.1],
        [0.82, -0.55],
        [0.45, -0.88],
        [0.02, -1],
      ] as const) {
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        spike.position.copy(surface(0, y, z, 0.08));
        spike.quaternion.setFromUnitVectors(UP, normalAt(0, y, z));
        body.add(spike);
      }
      break;
    }
    case 'horn': {
      const horn = kit.mesh(new THREE.ConeGeometry(0.1, 0.55, 16), kit.toon('#FFD54F'));
      kit.outline(horn, outline, 1.08);
      horn.position.copy(surface(0, 0.95, 0.32, 0.18));
      horn.rotation.x = 0.35;
      body.add(horn);
      break;
    }
    case 'shell': {
      // Double-sided: from the front we look into the open dome, so its inner faces must render.
      const shell = kit.mesh(
        new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        kit.toon(bp.accent, THREE.DoubleSide),
      );
      // A dome on the back, wider and taller than the body so its rim frames the pet from the front.
      shell.scale.set(S.x * 1.2, S.z * 1.05, S.y * 1.16);
      shell.rotation.x = -Math.PI / 2;
      shell.position.set(0, center.y + 0.08, -0.08);
      kit.outline(shell, outline, 1.03);
      body.add(shell);
      const plateGeo = kit.geo(new THREE.CircleGeometry(0.2, 6));
      const plateMat = kit.toon(adjust(bp.accent, 0.18));
      for (const [x, y] of [
        [-0.55, 0.55],
        [0.55, 0.55],
        [0, 0.85],
        [-0.75, -0.05],
        [0.75, -0.05],
      ] as const) {
        const plate = new THREE.Mesh(plateGeo, plateMat);
        plate.position.copy(surface(x, y, -0.6, 0.01));
        plate.position.z -= 0.1;
        plate.lookAt(plate.position.clone().multiplyScalar(2));
        body.add(plate);
      }
      break;
    }
    case 'mane': {
      const mane = kit.mesh(new THREE.TorusGeometry(S.x * 0.92, 0.24, 12, 28), kit.toon(bp.accent));
      mane.position.set(0, center.y + 0.08, -0.15);
      mane.scale.set(1, S.y / S.x, 1);
      body.add(mane);
      break;
    }
    case 'fins': {
      const finGeo = kit.geo(new THREE.ConeGeometry(0.14, 0.42, 4));
      const finMat = kit.toon(bp.accent);
      for (const side of [-1, 1]) {
        const fin = new THREE.Mesh(finGeo, finMat);
        fin.scale.set(1, 1, 0.35);
        fin.position.copy(surface(side, -0.15, 0.1, 0.12));
        fin.rotation.z = -side * (Math.PI / 2 + 0.4);
        body.add(fin);
      }
      const top = new THREE.Mesh(finGeo, finMat);
      top.scale.set(0.35, 1.1, 1);
      top.position.copy(surface(0, 1, -0.35, 0.12));
      top.rotation.x = -0.4;
      body.add(top);
      break;
    }
    case 'leaf': {
      const leafGeo = kit.geo(new THREE.SphereGeometry(0.3, 16, 10));
      for (const side of [-1, 1]) {
        const leaf = new THREE.Mesh(leafGeo, kit.toon(side < 0 ? '#43A047' : '#66BB6A'));
        leaf.scale.set(1, 0.22, 0.5);
        leaf.position.set(side * 0.2, S.y * 2 + 0.1, 0);
        leaf.rotation.z = side * 0.55;
        body.add(leaf);
      }
      const stem = kit.mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.2, 8), kit.toon('#2E7D32'));
      stem.position.set(0, S.y * 2 + 0.02, 0);
      body.add(stem);
      break;
    }
    case 'none':
      break;
  }
  return wings;
}
