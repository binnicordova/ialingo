import * as THREE from 'three';

import type { PetBlueprint } from '@/domain/pets/species';

import { adjust, type Kit } from './kit';

export interface EggRig {
  readonly root: THREE.Group;
  readonly top: THREE.Group;
  readonly bottom: THREE.Group;
}

const EGG_HEIGHT = 1.7;
const SPLIT = 0.6;

/**
 * Egg radius profile at normalized height t in [0, 1]: an ellipse (rounded
 * ends) skewed so the bottom is wider than the top, like a real egg.
 */
function eggRadius(t: number): number {
  const u = 2 * Math.min(1, Math.max(0, t)) - 1;
  return 0.64 * Math.sqrt(Math.max(0, 1 - u * u)) * (1 - 0.14 * u);
}

function profile(from: number, to: number, steps: number): THREE.Vector2[] {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = from + ((to - from) * i) / steps;
    points.push(new THREE.Vector2(Math.max(0.001, eggRadius(t)), t * EGG_HEIGHT));
  }
  return points;
}

/** Two-piece lathe egg (it splits when hatching) with the pet's colors as spots. */
export function buildEggRig(bp: PetBlueprint, kit: Kit): EggRig {
  const root = new THREE.Group();
  const shellMat = kit.toon(bp.secondary);
  const ink = adjust(bp.primary, -0.5);

  const bottom = new THREE.Group();
  const bottomMesh = kit.mesh(new THREE.LatheGeometry(profile(0, SPLIT, 24), 40), shellMat);
  kit.outline(bottomMesh, ink, 1.035);
  bottom.add(bottomMesh);

  const top = new THREE.Group();
  const topMesh = kit.mesh(new THREE.LatheGeometry(profile(SPLIT, 1, 18), 40), shellMat);
  kit.outline(topMesh, ink, 1.035);
  top.add(topMesh);

  // The inner face is visible once the halves separate.
  const innerMat = kit.basic('#FFF8E1', { side: THREE.BackSide });
  bottom.add(new THREE.Mesh(bottomMesh.geometry, innerMat));
  top.add(new THREE.Mesh(topMesh.geometry, innerMat));

  const spotGeo = kit.geo(new THREE.SphereGeometry(0.13, 16, 10));
  const spots: [t: number, angle: number, color: string, size: number][] = [
    [0.25, 0.6, bp.primary, 1.1],
    [0.4, 2.4, bp.accent, 0.8],
    [0.32, 4.1, bp.primary, 1.3],
    [0.72, 1.2, bp.accent, 0.9],
    [0.8, 3.6, bp.primary, 0.8],
    [0.5, 5.4, bp.accent, 1],
  ];
  for (const [t, angle, color, size] of spots) {
    const r = eggRadius(t);
    const spot = new THREE.Mesh(spotGeo, kit.toon(color));
    spot.position.set(Math.sin(angle) * r, t * EGG_HEIGHT, Math.cos(angle) * r);
    spot.scale.set(size, size, size * 0.35);
    spot.lookAt(spot.position.clone().multiplyScalar(2).setY(t * EGG_HEIGHT));
    (t < SPLIT ? bottom : top).add(spot);
  }

  root.add(bottom, top);
  return { root, top, bottom };
}
