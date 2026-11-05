import * as THREE from 'three';

import type { AccessoryModel } from '@/domain/pets/accessory';

import { adjust, type Kit } from './kit';
import type { AccessoryMounts } from './pet-model';

/** Builds an accessory sized and placed for a pet's mount points. */
export function buildAccessory(
  model: AccessoryModel,
  color: string,
  mounts: AccessoryMounts,
  kit: Kit,
): THREE.Object3D {
  const group = new THREE.Group();
  const ink = adjust(color, -0.55);
  switch (model) {
    case 'party-hat': {
      const cone = kit.mesh(new THREE.ConeGeometry(0.28, 0.62, 24), kit.toon(color));
      cone.position.y = 0.28;
      kit.outline(cone, ink, 1.06);
      const pom = kit.mesh(new THREE.SphereGeometry(0.09, 14, 10), kit.toon('#FFFFFF'));
      pom.position.y = 0.62;
      const band = kit.mesh(new THREE.TorusGeometry(0.25, 0.035, 8, 24), kit.toon('#FFEB3B'));
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.04;
      group.add(cone, pom, band);
      group.position.copy(mounts.top);
      group.rotation.z = 0.18;
      break;
    }
    case 'crown': {
      const ring = kit.mesh(new THREE.CylinderGeometry(0.3, 0.27, 0.2, 24), kit.toon(color));
      kit.outline(ring, ink, 1.05);
      ring.position.y = 0.06;
      group.add(ring);
      const spikeGeo = kit.geo(new THREE.ConeGeometry(0.07, 0.18, 10));
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(spikeGeo, kit.toon(color));
        spike.position.set(Math.sin(a) * 0.28, 0.24, Math.cos(a) * 0.28);
        group.add(spike);
      }
      const gem = kit.mesh(new THREE.OctahedronGeometry(0.06), kit.toon('#E53935'));
      gem.position.set(0, 0.08, 0.3);
      group.add(gem);
      group.position.copy(mounts.top);
      break;
    }
    case 'bow': {
      const knot = kit.mesh(new THREE.SphereGeometry(0.07, 12, 10), kit.toon(color));
      const loopGeo = kit.geo(new THREE.ConeGeometry(0.15, 0.28, 16));
      for (const side of [-1, 1]) {
        const loop = new THREE.Mesh(loopGeo, kit.toon(color));
        loop.rotation.z = side * (Math.PI / 2);
        loop.position.x = side * 0.15;
        loop.scale.set(1, 1, 0.5);
        group.add(loop);
      }
      group.add(knot);
      group.position.set(mounts.sideX * 0.45, mounts.top.y - 0.12, 0.15);
      group.rotation.z = -0.4;
      break;
    }
    case 'glasses': {
      const lensGeo = kit.geo(new THREE.TorusGeometry(0.14, 0.03, 8, 24));
      const darkGeo = kit.geo(new THREE.CircleGeometry(0.13, 24));
      for (const side of [-1, 1]) {
        const frame = new THREE.Mesh(lensGeo, kit.toon(color));
        frame.position.x = side * 0.2;
        const lens = new THREE.Mesh(darkGeo, kit.basic('#1A1A2E', { opacity: 0.75 }));
        lens.position.set(side * 0.2, 0, -0.005);
        group.add(frame, lens);
      }
      const bridge = kit.mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 6), kit.toon(color));
      bridge.rotation.z = Math.PI / 2;
      group.add(bridge);
      group.position.copy(mounts.eyes);
      group.position.y += 0.02;
      break;
    }
    case 'flower': {
      const center = kit.mesh(new THREE.SphereGeometry(0.07, 12, 10), kit.toon('#FF9800'));
      group.add(center);
      const petalGeo = kit.geo(new THREE.SphereGeometry(0.075, 12, 8));
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2;
        const petal = new THREE.Mesh(petalGeo, kit.toon(color));
        petal.scale.set(1, 1, 0.45);
        petal.position.set(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0);
        group.add(petal);
      }
      group.position.set(-mounts.sideX * 0.42, mounts.top.y - 0.1, 0.32);
      group.rotation.y = -0.4;
      break;
    }
    case 'scarf': {
      const ring = kit.mesh(new THREE.TorusGeometry(mounts.neckRadius, 0.09, 12, 32), kit.toon(color));
      ring.rotation.x = Math.PI / 2;
      ring.scale.set(1, 0.95, 1);
      const tail = kit.mesh(new THREE.BoxGeometry(0.16, 0.38, 0.06), kit.toon(color));
      tail.position.set(0.28, -0.2, mounts.neckRadius - 0.02);
      tail.rotation.z = 0.25;
      group.add(ring, tail);
      group.position.set(0, mounts.neckY, 0);
      break;
    }
    case 'headphones': {
      const arc = kit.mesh(new THREE.TorusGeometry(mounts.sideX * 0.78, 0.045, 8, 28, Math.PI), kit.toon(color));
      arc.position.y = -0.18;
      const cupGeo = kit.geo(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 20));
      for (const side of [-1, 1]) {
        const cup = new THREE.Mesh(cupGeo, kit.toon(adjust(color, -0.2)));
        cup.rotation.z = Math.PI / 2;
        cup.position.set(side * mounts.sideX * 0.78, -0.18, 0);
        group.add(cup);
      }
      group.add(arc);
      group.position.copy(mounts.top);
      break;
    }
    case 'cap': {
      const dome = kit.mesh(
        new THREE.SphereGeometry(0.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        kit.toon(color),
      );
      kit.outline(dome, ink, 1.04);
      const brim = kit.mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.035, 24, 1, false, -Math.PI / 2, Math.PI), kit.toon(color));
      brim.position.set(0, 0.01, 0.26);
      brim.scale.set(1, 1, 0.9);
      const button = kit.mesh(new THREE.SphereGeometry(0.05, 10, 8), kit.toon('#FFFFFF'));
      button.position.y = 0.4;
      group.add(dome, brim, button);
      group.position.copy(mounts.top);
      group.position.y -= 0.14;
      break;
    }
  }
  return group;
}
