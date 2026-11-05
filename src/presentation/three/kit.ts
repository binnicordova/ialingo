import * as THREE from 'three';

/**
 * Owns every geometry and material a model creates, so one `dispose()` frees
 * all GPU memory (threejs-performance: dispose geometry, material and textures
 * explicitly; Object3D.dispose frees none of them). Materials are cached per
 * color, so equal colors share one shader program.
 */
export class Kit {
  private readonly geometries = new Set<THREE.BufferGeometry>();
  private readonly materials = new Map<string, THREE.Material>();

  geo<T extends THREE.BufferGeometry>(geometry: T): T {
    this.geometries.add(geometry);
    return geometry;
  }

  /** Cel-shaded material: two tones from the default toon ramp, no texture needed. */
  toon(color: string, side: THREE.Side = THREE.FrontSide): THREE.MeshToonMaterial {
    const key = `toon:${color}:${side}`;
    let material = this.materials.get(key) as THREE.MeshToonMaterial | undefined;
    if (!material) {
      material = new THREE.MeshToonMaterial({ color: new THREE.Color(color), side });
      this.materials.set(key, material);
    }
    return material;
  }

  basic(color: string, options: { opacity?: number; side?: THREE.Side } = {}): THREE.MeshBasicMaterial {
    const key = `basic:${color}:${options.opacity ?? 1}:${options.side ?? THREE.FrontSide}`;
    let material = this.materials.get(key) as THREE.MeshBasicMaterial | undefined;
    if (!material) {
      material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: options.opacity !== undefined && options.opacity < 1,
        opacity: options.opacity ?? 1,
        side: options.side ?? THREE.FrontSide,
        depthWrite: options.opacity === undefined || options.opacity >= 1,
      });
      this.materials.set(key, material);
    }
    return material;
  }

  /** A unique (uncached) material, for per-object fading. */
  fading(color: string): THREE.MeshBasicMaterial {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
    this.materials.set(`fade:${this.materials.size}`, material);
    return material;
  }

  mesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
    return new THREE.Mesh(this.geo(geometry), material);
  }

  /**
   * Inverted-hull outline: a back-face copy scaled slightly up. It is the
   * classic cartoon outline, needs no post-processing, and costs one extra draw call.
   */
  outline(mesh: THREE.Mesh, color = '#2D2A4A', thickness = 1.06): THREE.Mesh {
    const hull = new THREE.Mesh(mesh.geometry, this.basic(color, { side: THREE.BackSide }));
    hull.scale.setScalar(thickness);
    hull.renderOrder = -1;
    mesh.add(hull);
    return hull;
  }

  dispose(): void {
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials.values()) material.dispose();
    this.geometries.clear();
    this.materials.clear();
  }
}

/** Darken or lighten a hex color by a factor, as a hex string. */
export function adjust(hex: string, factor: number): string {
  const c = new THREE.Color(hex);
  if (factor < 0) c.multiplyScalar(1 + factor);
  else c.lerp(new THREE.Color('#ffffff'), factor);
  return `#${c.getHexString()}`;
}

/** Flat heart shape, used for "love" particles. */
export function heartGeometry(size = 0.18): THREE.ShapeGeometry {
  const s = size;
  const shape = new THREE.Shape();
  shape.moveTo(0, -s * 0.9);
  shape.bezierCurveTo(-s * 0.2, -s * 0.6, -s * 1.1, -s * 0.3, -s * 1.0, s * 0.25);
  shape.bezierCurveTo(-s * 0.9, s * 0.85, -s * 0.15, s * 0.9, 0, s * 0.35);
  shape.bezierCurveTo(s * 0.15, s * 0.9, s * 0.9, s * 0.85, s * 1.0, s * 0.25);
  shape.bezierCurveTo(s * 1.1, -s * 0.3, s * 0.2, -s * 0.6, 0, -s * 0.9);
  return new THREE.ShapeGeometry(shape, 12);
}
