import * as T from 'three';

export interface SceneOptions {
  scene: T.Scene;
  camera: T.PerspectiveCamera;
  accent: T.Color;
  base: T.Color;
}

export interface ScenePlayback {
  update: (time: number) => void;
  still: number;
}

export type BuildScene = (options: SceneOptions) => ScenePlayback;

export function randomGenerator(seed: number) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const clamp = T.MathUtils.clamp;
const lerp = T.MathUtils.lerp;
const hash = (x: number, y: number) => {
  const key = Math.imul(x, 1597334677) ^ Math.imul(y, 3812015801);
  return ((key ^ key >>> 16) >>> 0) / 4294967295;
};

export function noise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash(ix, iy), hash(ix + 1, iy), u), lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), u), v);
}

export function fractal(x: number, z: number) {
  return 0.54 * noise(x, z) + 0.28 * noise(x * 2.17 + 13, z * 2.17) +
    0.12 * noise(x * 4.29, z * 4.29 + 27) + 0.06 * noise(x * 8.41, z * 8.41);
}

export function terrain(
  width: number, depth: number, columns: number, rows: number, zCenter: number,
  height: (x: number, z: number) => number,
  tint: (x: number, y: number, z: number, slope: number) => T.Color,
) {
  const geometry = new T.PlaneGeometry(width, depth, columns, rows).rotateX(-Math.PI / 2).translate(0, 0, zCenter);
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) positions.setY(i, height(positions.getX(i), positions.getZ(i)));
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute('normal');
  const colors = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i++) {
    tint(positions.getX(i), positions.getY(i), positions.getZ(i), 1 - normals.getY(i)).toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
  return new T.Mesh(geometry, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }));
}

export interface Instance {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  rx?: number;
  ry?: number;
  rz?: number;
  color?: T.Color;
}

export function setInstances(mesh: T.InstancedMesh, instances: Instance[]) {
  const object = new T.Object3D();
  instances.forEach(({ x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color }, i) => {
    object.position.set(x, y, z);
    object.scale.set(sx, sy, sz);
    object.rotation.set(rx, ry, rz);
    object.updateMatrix();
    mesh.setMatrixAt(i, object.matrix);
    if (color) mesh.setColorAt(i, color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

export function instanced(scene: T.Scene, geometry: T.BufferGeometry, material: T.Material, instances: Instance[], animated = false) {
  const mesh = new T.InstancedMesh(geometry, material, instances.length);
  if (animated) {
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    mesh.frustumCulled = false;
  }
  setInstances(mesh, instances);
  scene.add(mesh);
  return mesh;
}

export function lighting(scene: T.Scene, sky: T.ColorRepresentation, ground: T.ColorRepresentation,
  key: T.ColorRepresentation, intensity: number, position: [number, number, number], ambient = 1.1) {
  scene.add(new T.HemisphereLight(sky, ground, ambient));
  const light = new T.DirectionalLight(key, intensity);
  light.position.set(...position);
  scene.add(light);
  return light;
}

export function skyDome(scene: T.Scene, fragment: string, accent: T.Color, base: T.Color) {
  const material = new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uAccent: { value: accent }, uBase: { value: base } },
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vWorld = (modelMatrix * vec4(position, 1.)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }
    `,
    fragmentShader: fragment,
  });
  const dome = new T.Mesh(new T.SphereGeometry(430, 32, 20), material);
  dome.renderOrder = -10;
  scene.add(dome);
  return material.uniforms.uTime;
}

export const skyUniforms = `
  uniform float uTime;
  uniform vec3 uAccent, uBase;
  varying vec3 vWorld;
  vec3 viewRay() { return normalize(vWorld - cameraPosition); }
`;

export const noiseGLSL = `
  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * .1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3. - 2.*f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
               mix(hash(i + vec2(0,1)), hash(i + 1.), u.x), u.y);
  }
  float fbm(vec2 p) {
    mat2 spin = mat2(1.63, 1.2, -1.2, 1.63);
    return .52*noise(p) + .26*noise(spin*p + 9.) + .14*noise(spin*spin*p + 4.) + .08*noise(p*8.3);
  }
`;

export function rockGeometry(seed: number, detail = 1) {
  const raw = new T.IcosahedronGeometry(1, detail);
  const position = raw.getAttribute('position');
  const shade = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const scale = 0.82 + 0.3 * noise(x * 3 + seed + y * 2, z * 3 - y * 3);
    position.setXYZ(i, x * scale, y * scale, z * scale);
    const tone = 0.77 + 0.23 * noise(x * 12 - y * 3, z * 9 + seed);
    shade.set([tone, tone, tone], i * 3);
  }
  raw.setAttribute('color', new T.BufferAttribute(shade, 3));
  raw.computeVertexNormals();
  return raw;
}

export function ridge(x: number, z: number, cx: number, cz: number, width: number, depth: number) {
  return clamp(1 - Math.hypot((x - cx) / width, (z - cz) / depth), 0, 1);
}
