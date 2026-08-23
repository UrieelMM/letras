import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import type { AnimatedBgPreset } from '../types';

// Renderizamos colores tal cual el hex (sin conversión a espacio lineal),
// para que coincidan con la vista CSS y se vean vivos.
THREE.ColorManagement.enabled = false;

interface Props {
  preset: AnimatedBgPreset;
  colorA: string;
  colorB: string;
  // Efectos de postprocesado (opcionales)
  bloom?: number;
  bloomThreshold?: number;
  bloomRadius?: number;
  trails?: number;
  grain?: number;
}

// Presets que NO usan el shader quad (se renderizan con objetos Three.js).
type ObjectPreset =
  | 'particles'
  | 'confetti'
  | 'birds'
  | 'dots'
  | 'oceanWaves'
  | 'galaxySpiral'
  | 'particleFlow'
  | 'starFlow'
  | 'warpSpace';
type ExternalPreset =
  | 'shaderWaves'
  | 'glitterWarp'
  | 'lightDroplets'
  | 'lightspeed'
  | 'ditherWave'
  | 'radialLiquid'
  | 'chromaWaves'
  | 'mosaic'
  | 'portal'
  | 'risingLines'
  | 'colorLoops'
  | 'rotatingStars'
  | 'starBurst'
  | 'silkWaves'
  | 'fallingRays'
  | 'liquidBars'
  | 'auroraBlur'
  | 'liquidLines'
  | 'squircleShift'
  | 'grainWave'
  | 'glassFlow'
  | 'shadowBars'
  | 'warpTwister'
  | 'blackHole'
  | 'blurredRays'
  | 'flamePaths'
  | 'gradientBars'
  | 'halftoneWave'
  | 'metallicSwirl'
  | 'metallicSwirlGold'
  | 'retroLines'
  | 'rubberFluid'
  | 'squareMatrix'
  | 'swirlBlend'
  | 'asciiTiles'
  | 'twilightLines'
  | 'chromaBlinds'
  | 'glassTiles'
  | 'robotLights'
  | 'graphicWorlds';
type ShaderPreset = Exclude<AnimatedBgPreset, ObjectPreset | ExternalPreset>;

const MODE: Record<ShaderPreset, number> = {
  meshGradient: 0,
  aurora: 1,
  starfield: 2,
  plasma: 3,
  waves: 4,
  rainbow: 5,
  tunnel: 6,
  vortex: 7,
  kaleidoscope: 8,
  nebula: 9,
  liquid: 10,
  caustics: 11,
  fractal: 12,
  warp: 13,
  spiral: 14,
  grid: 15,
  clouds: 16,
  halo: 17,
  orb: 18,
  gradientFlow: 19,
  cells: 20,
  matrix: 21,
  ripple: 22,
  lightning: 23,
  smoke: 24,
  fireflies: 25,
  wormhole: 26,
  sunrays: 27,
  neon: 28,
  crystal: 29,
  silk: 30,
  marble: 31,
  auroraSoft: 32,
  lavaLamp: 33,
  inkBloom: 34,
  topographic: 35,
  satin: 36,
  deepSea: 37,
  petals: 38,
  liquidMetal: 39,
  breathingBg: 40,
  dunes: 41,
  smokeRings: 42,
  cosmosDrift: 43,
  outrun: 44,
  checkerFloor: 45,
  retroSun: 46,
  gridTunnel: 47,
  wireMountains: 48,
  crt: 49,
  halftone: 50,
  neonRings: 51,
  neonBurst: 52,
  vectorStars: 53,
  crystal2: 54,
  cosmicWaves: 55,
  kaliFractal: 56,
  singularity: 57,
  magicTrail: 58,
};

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform int uMode;

  vec2 hash22(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dot(hash22(i), f), dot(hash22(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
               mix(dot(hash22(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash22(i + vec2(1, 1)), f - vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.0 + vec2(1.7, 9.2); a *= 0.5; }
    return v;
  }

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  // Paleta cosenoidal (IQ) para colores vivos cíclicos.
  vec3 pal(float t) {
    return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
  }

  mat2 rot(float a) {
    float s = sin(a), c2 = cos(a);
    return mat2(c2, -s, s, c2);
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uv = vUv;
    vec2 p = vec2(uv.x * aspect, uv.y) * 3.0;
    vec2 c = vec2((uv.x - 0.5) * aspect, uv.y - 0.5); // coords centradas
    float t = uTime * 0.12;
    vec3 col;

    if (uMode == 0) {
      // Mesh gradient con domain warping (fbm)
      vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
      float n = fbm(p + 1.6 * q + 0.4 * t);
      float m = smoothstep(-0.25, 0.85, n);
      col = mix(uColorB, uColorA, m);
      col += 0.05 * vec3(fbm(p * 1.5 + 10.0 + t));
    } else if (uMode == 1) {
      // Aurora
      float bands = fbm(vec2(uv.x * 2.5, uv.y * 5.0 - t * 2.0));
      float curtain = fbm(vec2(uv.x * 1.2 + t, uv.y * 2.0));
      float glow = smoothstep(0.15, 0.9, bands + 0.3 * curtain) * (1.0 - uv.y * 0.6);
      vec3 base = mix(vec3(0.01, 0.02, 0.06), uColorB, 0.6);
      col = base + mix(uColorB, uColorA, uv.y) * glow * 1.2;
    } else if (uMode == 2) {
      // Starfield + nebulosa
      vec3 bg = mix(uColorB, uColorA, uv.y * 0.8 + 0.1) * 0.5;
      vec2 st = vec2(uv.x * aspect, uv.y) * 340.0;
      vec2 ip = floor(st);
      float rnd = fract(sin(dot(ip, vec2(12.9898, 78.233))) * 43758.5453);
      float star = smoothstep(0.992, 1.0, rnd);
      float tw = 0.5 + 0.5 * sin(uTime * 2.5 + rnd * 300.0);
      float neb = fbm(p * 0.6 + t * 0.3);
      col = bg + 0.25 * neb * uColorA + vec3(star * tw);
    } else if (uMode == 3) {
      // Plasma colorido y alegre
      float v = sin(p.x * 3.0 + uTime * 1.0)
              + sin(p.y * 3.0 + uTime * 0.75)
              + sin((p.x + p.y) * 2.0 + uTime * 0.5)
              + sin(length(p) * 4.0 - uTime * 1.0);
      v *= 0.25;
      col = 0.55 + 0.45 * cos(6.2831 * (v + vec3(0.0, 0.33, 0.67)) + uTime * 0.2);
    } else if (uMode == 4) {
      // Olas multicolor
      float w = sin(uv.x * 8.0 + uTime * 1.5) * 0.1
              + fbm(vec2(uv.x * 3.0 + uTime * 0.5, uv.y * 3.0)) * 0.5;
      float band = uv.y * 1.2 + w;
      col = hsv2rgb(vec3(fract(band + uTime * 0.05), 0.65, 1.0));
      col *= 0.85 + 0.15 * sin(uTime + uv.x * 10.0);
    } else if (uMode == 5) {
      // Arcoíris fluido
      float n = fbm(p * 0.8 + uTime * 0.15);
      float hue = fract(uv.x * 0.4 + uv.y * 0.25 + uTime * 0.06 + n * 0.4);
      col = hsv2rgb(vec3(hue, 0.6, 1.0));
    } else if (uMode == 6) {
      // Túnel infinito
      float r = length(c) + 0.0001;
      float ang = atan(c.y, c.x) / 6.28318;
      float depth = 0.30 / r + uTime * 0.5;
      float pattern = 0.5 + 0.5 * sin(depth * 12.0) * sin(ang * 40.0);
      col = pal(depth * 0.15 + ang) * (0.25 + 0.75 * pattern);
      col *= clamp(r * 1.6, 0.0, 1.0);
    } else if (uMode == 7) {
      // Vórtice
      float r = length(c);
      float a = atan(c.y, c.x);
      float swirl = a * 3.0 + r * 10.0 - uTime * 1.5;
      float v = 0.5 + 0.5 * sin(swirl);
      col = pal(r - uTime * 0.08) * (0.3 + 0.7 * v);
    } else if (uMode == 8) {
      // Caleidoscopio
      float a = atan(c.y, c.x);
      float r = length(c);
      float seg = 6.28318 / 6.0;
      a = mod(a, seg);
      a = abs(a - seg * 0.5);
      vec2 kc = vec2(cos(a), sin(a)) * r * 4.0;
      float n = fbm(kc + uTime * 0.2);
      col = pal(n + uTime * 0.05);
    } else if (uMode == 9) {
      // Nebulosa volumétrica
      vec2 q = c * 3.0;
      float n = fbm(q + uTime * 0.05);
      n += 0.5 * fbm(q * 2.0 - uTime * 0.08);
      col = mix(uColorB, uColorA, clamp(n, 0.0, 1.0));
      vec2 sp = floor(uv * 500.0);
      float star = step(0.998, fract(sin(dot(sp, vec2(12.9, 78.2))) * 43758.5));
      col += vec3(star);
    } else if (uMode == 10) {
      // Lava líquida (metaballs)
      float field = 0.0;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        vec2 ctr = 0.42 * vec2(sin(uTime * 0.6 + fi * 1.7), cos(uTime * 0.5 + fi * 2.3));
        field += 0.05 / (length(c - ctr) + 0.02);
      }
      float m = smoothstep(1.0, 2.4, field);
      col = mix(uColorB, uColorA, m);
      col += pal(field * 0.12) * 0.25;
    } else if (uMode == 11) {
      // Cáusticas de agua
      vec2 q = c * 4.0;
      float tt = uTime * 0.5;
      float v = 0.0;
      for (int i = 1; i <= 4; i++) {
        float fi = float(i);
        v += sin(q.x * fi + tt * fi) + sin(q.y * fi - tt * fi * 0.7);
      }
      v = 0.5 + 0.5 * sin(v);
      float caust = pow(v, 3.0);
      col = mix(uColorB, uColorA, caust) + caust * 0.3;
    } else if (uMode == 12) {
      // Fractal de Julia animado
      vec2 z = c * 2.6;
      vec2 cc = 0.7885 * vec2(cos(uTime * 0.25), sin(uTime * 0.25));
      float it = 0.0;
      for (int i = 0; i < 64; i++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + cc;
        if (dot(z, z) > 4.0) break;
        it += 1.0;
      }
      float f = it / 64.0;
      col = pal(f * 1.5 + uTime * 0.05);
      if (f >= 1.0) col *= 0.1;
    } else if (uMode == 13) {
      // Hiperespacio (warp)
      float r = length(c) + 0.001;
      float a = atan(c.y, c.x);
      float seed = floor((a / 6.28318 + 0.5) * 60.0);
      float rnd = fract(sin(seed * 78.233) * 43758.5);
      float pos = fract(rnd + uTime * (0.2 + rnd * 0.4));
      float d = abs(r - pos);
      float streak = smoothstep(0.015, 0.0, d) * smoothstep(0.0, 0.25, r);
      col = pal(rnd) * streak * 2.0 + vec3(streak);
    } else if (uMode == 14) {
      // Galaxia espiral
      float r = length(c);
      float a = atan(c.y, c.x);
      float arms = sin(a * 2.0 + log(r + 0.08) * 6.0 - uTime * 0.5);
      float b = smoothstep(-0.2, 0.9, arms) * smoothstep(1.1, 0.05, r);
      col = pal(r * 0.6 + uTime * 0.015) * (0.15 + b);
      col += smoothstep(0.12, 0.0, r);
    } else if (uMode == 15) {
      // Grid synthwave
      vec3 sky = mix(uColorB * 0.6, uColorA, pow(clamp(uv.y, 0.0, 1.0), 1.5));
      float sd = length((uv - vec2(0.5, 0.66)) * vec2(aspect, 1.0));
      float sun = smoothstep(0.30, 0.285, sd);
      vec3 sunc = mix(vec3(1.0, 0.85, 0.2), vec3(1.0, 0.25, 0.6), clamp((0.72 - uv.y) * 3.0, 0.0, 1.0));
      col = mix(sky, sunc, sun);
      float horizon = 0.46;
      if (uv.y < horizon) {
        float depth = horizon - uv.y + 0.02;
        float gx = abs(fract((uv.x - 0.5) / depth * 0.6) - 0.5);
        float gy = abs(fract(0.15 / depth + uTime * 0.5) - 0.5);
        float grid = smoothstep(0.05, 0.0, min(gx, gy));
        col = mix(vec3(0.03, 0.0, 0.09), vec3(0.9, 0.2, 0.95), grid);
      }
    } else if (uMode == 16) {
      // Nubes (clouds)
      vec3 sky = mix(uColorA, uColorB, clamp(uv.y, 0.0, 1.0));
      float n1 = fbm(c * 3.0 + vec2(uTime * 0.05, 0.0));
      float n2 = fbm(c * 3.0 + n1 + vec2(uTime * 0.04, uTime * 0.02));
      float clouds = smoothstep(0.05, 0.75, n2);
      col = mix(sky, vec3(1.0), clouds * 0.9);
    } else if (uMode == 17) {
      // Halo
      float r = length(c);
      float a = atan(c.y, c.x);
      float swirl = fbm(vec2(a * 1.5 + r * 3.0, r * 4.0 - uTime * 0.3));
      vec3 base = mix(uColorB, uColorA, swirl);
      float ring = smoothstep(0.03, 0.0, abs(r - 0.32));
      col = base * 0.5 + pal(swirl + uTime * 0.05) * ring * 1.6;
      col *= smoothstep(0.95, 0.15, r);
    } else if (uMode == 18) {
      // Orbe
      float r = length(c);
      float surf = fbm(c * 5.0 + uTime * 0.2);
      vec3 orbc = mix(uColorB, uColorA, surf);
      float disc = smoothstep(0.33, 0.31, r);
      float rim = smoothstep(0.29, 0.33, r) * smoothstep(0.40, 0.33, r);
      float glow = smoothstep(0.55, 0.0, r);
      col = mix(vec3(0.02, 0.02, 0.05), orbc, disc);
      col += pal(surf + uTime * 0.05) * rim * 1.4;
      col += uColorA * glow * 0.18;
    } else if (uMode == 19) {
      // Gradiente animado
      float m1 = 0.5 + 0.5 * sin(uTime * 0.4 + c.x * 2.0 + c.y * 1.5);
      float m2 = 0.5 + 0.5 * sin(uTime * 0.3 - c.x * 1.5 + c.y * 2.0 + 2.0);
      vec3 third = pal(uTime * 0.05);
      col = mix(mix(uColorA, uColorB, m1), third, m2 * 0.5);
    } else if (uMode == 20) {
      // Células (voronoi animado)
      vec2 q = c * 5.0;
      vec2 ig = floor(q);
      vec2 fg = fract(q);
      float md = 8.0;
      for (int yy = -1; yy <= 1; yy++) {
        for (int xx = -1; xx <= 1; xx++) {
          vec2 g = vec2(float(xx), float(yy));
          vec2 o = 0.5 + 0.5 * sin(uTime * 0.8 + 6.2831 * hash22(ig + g));
          vec2 rr = g + o - fg;
          md = min(md, dot(rr, rr));
        }
      }
      md = sqrt(md);
      col = mix(uColorA, uColorB, md) + pal(md * 0.5 + uTime * 0.05) * 0.2;
    } else if (uMode == 21) {
      // Matrix (lluvia de código)
      float x = floor(uv.x * aspect * 26.0);
      float speed = 0.4 + fract(sin(x * 45.23) * 43758.5) * 1.2;
      float head = fract(uTime * speed * 0.125 + fract(sin(x) * 13.0));
      float d = fract(head - uv.y);
      float bright = smoothstep(0.6, 0.0, d);
      float cell = floor(uv.y * 30.0);
      float flick = step(0.4, fract(sin((x + cell) * 11.0 + floor(uTime * 4.5)) * 43758.5));
      col = uColorA * bright * (0.3 + 0.7 * flick);
      col += vec3(0.6, 1.0, 0.7) * smoothstep(0.05, 0.0, d);
    } else if (uMode == 22) {
      // Onda expansiva
      float r = length(c);
      float w = sin(r * 40.0 - uTime * 3.0) * exp(-r * 2.5);
      col = mix(uColorB, uColorA, 0.5 + 0.5 * w);
      col += pal(r - uTime * 0.1) * abs(w) * 0.4;
    } else if (uMode == 23) {
      // Tormenta eléctrica
      float path = 0.35 * sin(c.y * 4.0 + uTime * 3.0) + 0.2 * fbm(vec2(c.y * 3.0, uTime * 0.5));
      float d = abs(c.x - path);
      float bolt = smoothstep(0.03, 0.0, d);
      float glow = smoothstep(0.3, 0.0, d);
      col = uColorB * 0.25 + uColorA * glow * 0.6 + vec3(bolt);
      col *= 0.7 + 0.3 * step(0.5, fract(sin(floor(uTime * 12.0)) * 43758.5));
    } else if (uMode == 24) {
      // Tinta / humo
      vec2 q = c * 2.0;
      float t2 = uTime * 0.1;
      vec2 w = vec2(fbm(q + t2), fbm(q + vec2(3.1, 1.7) - t2));
      float n = fbm(q + 2.0 * w + t2);
      n = pow(clamp(n * 1.2 + 0.3, 0.0, 1.0), 1.5);
      col = mix(uColorB, uColorA, smoothstep(0.1, 0.8, n));
      col += pal(n + uTime * 0.03) * 0.15;
    } else if (uMode == 25) {
      // Luciérnagas
      col = mix(uColorB, vec3(0.0), 0.3);
      for (int i = 0; i < 14; i++) {
        float fi = float(i);
        vec2 pos = vec2(sin(uTime * 0.3 + fi * 2.1), cos(uTime * 0.25 + fi * 1.7)) * 0.4
                 + vec2(sin(fi * 12.0), cos(fi * 7.0)) * 0.3;
        float d = length(c - pos);
        col += uColorA * (0.012 / (d * d + 0.001)) * (0.6 + 0.4 * sin(uTime * 3.0 + fi * 5.0));
      }
    } else if (uMode == 26) {
      // Agujero de gusano
      float r = length(c);
      float a = atan(c.y, c.x);
      float tw = a * 2.0 + 1.0 / (r + 0.1) * 3.0 - uTime * 0.75;
      float bands = 0.5 + 0.5 * sin(tw * 3.0);
      col = pal(1.0 / (r + 0.1) * 0.1 + a * 0.2) * (0.2 + 0.8 * bands) * smoothstep(0.0, 0.4, r);
      col += smoothstep(0.1, 0.0, r) * 0.5;
    } else if (uMode == 27) {
      // Rayos de sol
      float a = atan(c.y, c.x);
      float r = length(c);
      float rays = pow(0.5 + 0.5 * sin(a * 16.0 + uTime * 0.6), 2.0);
      float core = smoothstep(0.5, 0.0, r);
      col = mix(uColorB, uColorA, rays * core) + uColorA * core * 0.4;
      col += pal(a * 0.5 + uTime * 0.05) * rays * core * 0.3;
    } else if (uMode == 28) {
      // Neón: 3 líneas (arriba→derecha, centro→izquierda, abajo→derecha), lentas
      col = uColorB * 0.15;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float baseY = 0.25 + fi * 0.25;           // 0.25, 0.5, 0.75
        float dir = mod(fi, 2.0) < 0.5 ? 1.0 : -1.0; // 0:der, 1:izq, 2:der
        float yline = baseY + 0.09 * sin(uv.x * 9.0 + dir * uTime * 0.75 + fi * 1.3);
        float d = abs(uv.y - yline);
        col += pal(fi * 0.3 + uTime * 0.04) * smoothstep(0.02, 0.0, d);
      }
    } else if (uMode == 29) {
      // Prisma (facetas triangulares)
      vec2 q = c * 4.0;
      q.x += q.y * 0.5;
      vec2 ip = floor(q);
      vec2 fp = fract(q);
      float tri = step(fp.x + fp.y, 1.0);
      float id = dot(ip, vec2(7.0, 13.0)) + tri * 31.0;
      float shade = fract(sin(id) * 43758.5);
      col = pal(shade * 0.5 + uTime * 0.08 + length(c) * 0.3) * (0.6 + 0.4 * sin(uTime + shade * 6.28));
    } else if (uMode == 30) {
      // Seda (silk) — lento
      vec2 q = c * 2.0;
      float n = fbm(q + fbm(q + uTime * 0.03) * 1.5);
      float sh = 0.5 + 0.5 * sin(6.28318 * n + uTime * 0.1);
      col = mix(uColorB, uColorA, sh);
      col += pal(n * 0.3 + uTime * 0.02) * 0.12;
    } else if (uMode == 31) {
      // Mármol — vetas lentas
      vec2 q = c * 3.0;
      float t2 = fbm(q + uTime * 0.02);
      float veins = pow(abs(sin(q.x * 2.0 + t2 * 6.0)), 0.5);
      col = mix(uColorA, uColorB, veins);
    } else if (uMode == 32) {
      // Aurora suave
      float band = fbm(vec2(uv.x * 2.0 + uTime * 0.04, uv.y * 3.0));
      float glow = smoothstep(0.2, 0.9, band) * (1.0 - uv.y * 0.4);
      col = mix(uColorB * 0.4, mix(uColorB, uColorA, uv.y), glow);
    } else if (uMode == 33) {
      // Lámpara de lava — burbujas lentas
      float field = 0.0;
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float yy = fract(uTime * 0.03 + fi * 0.17) * 2.4 - 1.2;
        vec2 ctr = vec2(0.5 * sin(fi * 2.0 + uTime * 0.05), yy);
        field += 0.05 / (length(c - ctr) + 0.03);
      }
      float m = smoothstep(0.9, 1.8, field);
      col = mix(uColorB, uColorA, m);
    } else if (uMode == 34) {
      // Tinta en agua
      vec2 q = c * 2.5;
      float n = fbm(q * 1.5 + fbm(q - uTime * 0.02) * 2.0);
      float ink = smoothstep(0.35, 0.65, n);
      col = mix(uColorB, uColorA, ink);
      col += pal(n + uTime * 0.015) * 0.08;
    } else if (uMode == 35) {
      // Topografía — curvas de nivel
      vec2 q = c * 3.0;
      float h = fbm(q + uTime * 0.02);
      float lines = abs(fract(h * 10.0) - 0.5);
      float c2 = smoothstep(0.06, 0.0, lines);
      col = mix(uColorB, uColorA, h);
      col += c2 * 0.25;
    } else if (uMode == 36) {
      // Satín — barrido de luz
      vec2 q = c * 2.0;
      float n = fbm(q + uTime * 0.02);
      float sweep = 0.5 + 0.5 * sin(c.x * 3.0 + c.y * 2.0 + uTime * 0.25 + n * 3.0);
      col = mix(uColorB, uColorA, sweep);
      col += pow(sweep, 4.0) * 0.25;
    } else if (uMode == 37) {
      // Mar profundo — cáusticas lentas
      vec2 q = c * 3.0;
      float v = 0.0;
      for (int i = 1; i <= 3; i++) {
        float fi = float(i);
        v += sin(q.x * fi + uTime * 0.3 * fi) + sin(q.y * fi - uTime * 0.2 * fi);
      }
      v = 0.5 + 0.5 * sin(v);
      float caust = pow(v, 2.5);
      vec3 sea = mix(uColorB, uColorA, uv.y * 0.5);
      col = sea + caust * 0.25 * uColorA;
    } else if (uMode == 38) {
      // Pétalos — mandala suave
      float a = atan(c.y, c.x);
      float r = length(c);
      float seg = 6.28318 / 8.0;
      a = mod(a, seg);
      a = abs(a - seg * 0.5);
      vec2 kc = vec2(cos(a), sin(a)) * r * 3.0;
      float n = fbm(kc - uTime * 0.05);
      col = mix(uColorB, uColorA, smoothstep(0.2, 0.8, n));
      col += pal(n * 0.3 + uTime * 0.01) * 0.1;
    } else if (uMode == 39) {
      // Metal líquido
      vec2 q = c * 2.5;
      float n = fbm(q + fbm(q + uTime * 0.03) * 2.0);
      float metal = pow(0.5 + 0.5 * sin(n * 6.28318 * 2.0), 2.0);
      col = mix(uColorB, uColorA, metal);
      col += metal * 0.25;
    } else if (uMode == 40) {
      // Gradiente que respira (muy lento)
      float m = 0.5 + 0.5 * sin(uTime * 0.15 + uv.y * 2.0);
      float m2 = 0.5 + 0.5 * sin(uTime * 0.1 - uv.x * 1.5);
      col = mix(mix(uColorA, uColorB, m), mix(uColorB, uColorA, m2), 0.5);
    } else if (uMode == 41) {
      // Dunas
      vec2 q = c * 2.0;
      float d = fbm(vec2(q.x, q.y * 0.5 + sin(q.x + uTime * 0.05) * 0.3));
      float band = 0.5 + 0.5 * sin(q.y * 4.0 + d * 4.0 + uTime * 0.1);
      col = mix(uColorB, uColorA, band * 0.7 + d * 0.3);
    } else if (uMode == 42) {
      // Anillos de humo
      float r = length(c);
      float rings = sin(r * 12.0 - uTime * 0.4 + fbm(c * 2.0 + uTime * 0.03) * 3.0);
      float g = 0.5 + 0.5 * rings;
      col = mix(uColorB, uColorA, g) * smoothstep(1.0, 0.1, r);
    } else if (uMode == 43) {
      // Deriva cósmica
      vec2 q = c * 2.0;
      float n = fbm(q + uTime * 0.015);
      n += 0.5 * fbm(q * 2.0 - uTime * 0.02);
      col = mix(uColorB, uColorA, clamp(n, 0.0, 1.0)) * 0.7;
      vec2 sp = floor(uv * 420.0);
      float star = step(0.9985, fract(sin(dot(sp, vec2(12.9, 78.2))) * 43758.5));
      col += vec3(star) * 0.8;
    } else if (uMode == 44) {
      // Outrun — carretera + sol
      float horizon = 0.5;
      if (uv.y > horizon) {
        float skyT = (uv.y - horizon) / (1.0 - horizon);
        vec3 sky = mix(uColorA, uColorB, skyT);
        float sd = length((uv - vec2(0.5, horizon + 0.18)) * vec2(aspect, 1.0));
        float sun = smoothstep(0.16, 0.15, sd) * (step(0.5, fract(uv.y * 50.0)) * 0.5 + 0.5);
        col = mix(sky, mix(vec3(1.0, 0.9, 0.3), uColorA, skyT), sun);
      } else {
        float depth = horizon - uv.y;
        float persp = 1.0 / (depth + 0.05);
        float gx = abs(fract((uv.x - 0.5) * persp * 1.5) - 0.5);
        float gy = abs(fract(persp * 0.5 + uTime * 0.4) - 0.5);
        float grid = smoothstep(0.04, 0.0, min(gx, gy));
        col = mix(uColorB * 0.3, uColorA, grid);
      }
    } else if (uMode == 45) {
      // Tablero en perspectiva
      float horizon = 0.5;
      if (uv.y >= horizon) {
        col = mix(uColorA, uColorB, (uv.y - horizon) / (1.0 - horizon));
      } else {
        float depth = horizon - uv.y + 0.02;
        float u2 = (uv.x - 0.5) / depth;
        float v2 = 1.0 / depth + uTime * 0.5;
        float chk = mod(floor(u2 * 2.0) + floor(v2 * 2.0), 2.0);
        col = mix(uColorB * 0.4, uColorA, chk);
      }
    } else if (uMode == 46) {
      // Sol vaporwave (con barras)
      vec3 sky = mix(uColorB, uColorA, uv.y);
      float sd = length((uv - vec2(0.5, 0.55)) * vec2(aspect, 1.0));
      float disc = smoothstep(0.32, 0.31, sd);
      float bars = step(0.5, fract((0.55 - uv.y) * 30.0));
      float sun = disc * mix(1.0, bars, smoothstep(0.55, 0.40, uv.y));
      vec3 sunc = mix(vec3(1.0, 0.85, 0.2), vec3(1.0, 0.3, 0.6), uv.y);
      col = mix(sky, sunc, sun);
    } else if (uMode == 47) {
      // Túnel de rejilla (neón)
      vec2 p2 = c;
      float m = max(abs(p2.x), abs(p2.y)) + 0.001;
      float z = fract(0.25 / m - uTime * 0.3);
      float ring = smoothstep(0.08, 0.0, abs(z - 0.5));
      col = mix(uColorB * 0.15, uColorA, ring) * clamp(m * 3.0, 0.0, 1.0);
    } else if (uMode == 48) {
      // Montañas wireframe
      vec3 sky = mix(uColorB, uColorA * 0.6, uv.y);
      col = sky;
      float h1 = 0.32 + 0.10 * fbm(vec2(uv.x * 3.0 + uTime * 0.03, 1.0));
      float h2 = 0.24 + 0.08 * fbm(vec2(uv.x * 5.0 + 7.0 + uTime * 0.05, 2.0));
      col = mix(col, uColorB * 0.5, smoothstep(h1 + 0.002, h1, uv.y));
      col = mix(col, uColorB * 0.3, smoothstep(h2 + 0.002, h2, uv.y));
      col = mix(col, uColorA, smoothstep(0.004, 0.0, abs(uv.y - h1)));
      col = mix(col, uColorA, smoothstep(0.004, 0.0, abs(uv.y - h2)));
    } else if (uMode == 49) {
      // CRT / scanlines
      vec2 q = c;
      float n = fbm(q * 3.0 + uTime * 0.1);
      vec3 base = mix(uColorB, uColorA, n);
      float scan = 0.5 + 0.5 * sin(uv.y * 400.0);
      float roll = 0.5 + 0.5 * sin(uv.y * 6.0 - uTime * 1.5);
      base *= 0.75 + 0.25 * scan;
      base += uColorA * roll * 0.05;
      col = base * smoothstep(1.1, 0.4, length(c));
    } else if (uMode == 50) {
      // Halftone (puntos retro)
      vec3 base = mix(uColorB, uColorA, uv.y);
      vec2 g = c * 18.0;
      g.x += uTime * 0.2;
      vec2 cell = fract(g) - 0.5;
      float val = fbm(c * 2.0 + uTime * 0.05);
      float radius = 0.5 * val;
      float dotv = smoothstep(radius, radius - 0.1, length(cell));
      col = mix(base, uColorA, dotv);
    } else if (uMode == 51) {
      // Anillos de neón
      float r = length(c);
      float rings = sin(r * 24.0 - uTime * 1.0);
      float glow = smoothstep(0.6, 1.0, abs(rings));
      col = mix(uColorB * 0.2, uColorA, glow);
      col += pal(r * 0.5 + uTime * 0.05) * glow * 0.3;
    } else if (uMode == 52) {
      // Sunburst de sectores
      float a = atan(c.y, c.x);
      float sectors = step(0.5, fract(a / 6.28318 * 12.0 + uTime * 0.05));
      vec3 base = mix(uColorB, uColorA, sectors);
      float r = length(c);
      col = base * smoothstep(1.1, 0.1, r) + smoothstep(0.1, 0.0, r) * 0.5;
    } else if (uMode == 53) {
      // Estrellas vector
      col = mix(uColorB, uColorB * 0.3, uv.y);
      vec2 g = c * 8.0;
      vec2 id = floor(g);
      vec2 f = fract(g) - 0.5;
      float rnd = fract(sin(dot(id, vec2(12.9, 78.2))) * 43758.5);
      float tw = 0.5 + 0.5 * sin(uTime * 1.0 + rnd * 30.0);
      float star = (smoothstep(0.04, 0.0, abs(f.x)) + smoothstep(0.04, 0.0, abs(f.y))) * step(0.85, rnd);
      col += uColorA * star * tw;
    } else if (uMode == 54) {
      // Prisma 2/3 (facetas con colores del tema)
      vec2 q = c * 4.0;
      q.x += q.y * 0.5;
      vec2 ip = floor(q);
      vec2 fp = fract(q);
      float tri = step(fp.x + fp.y, 1.0);
      float id = dot(ip, vec2(7.0, 13.0)) + tri * 31.0;
      float shade = fract(sin(id) * 43758.5);
      float anim = 0.6 + 0.4 * sin(uTime * 0.5 + shade * 6.28);
      col = mix(uColorB, uColorA, shade) * anim;
      col += pal(shade * 0.2 + uTime * 0.03) * 0.1;
    } else if (uMode == 55) {
      // Ondas cósmicas (líneas glow + estrellas + glow central)
      vec2 uvc = rot(uTime * 0.05) * c;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float yo = (fi - 1.0) * 0.4;
        float wy = uvc.y + yo - 0.3 * sin(uvc.x * 2.0 + uTime * 0.4 + fi) * sin(uvc.y + uTime * 0.2);
        float line = 0.02 / (abs(wy) + 0.02);
        col += mix(uColorA, uColorB, fi * 0.5) * line * 0.5;
      }
      float d = length(c);
      col += uColorA * abs(sin(d * 4.0 - uTime)) * exp(-d * 0.6) * 0.2;
      vec2 g = floor((c + 5.0) * 40.0);
      float s = step(0.97, fract(sin(dot(g, vec2(12.9, 78.2))) * 43758.5));
      col += vec3(s) * (0.5 + 0.5 * sin(uTime * 2.0 + g.x)) * 0.7;
      col += uColorB * exp(-d * 1.5) * 0.2;
      col *= smoothstep(1.5, 0.2, d);
    } else if (uMode == 56) {
      // Fractal caleidoscópico (pliegue por inversión)
      vec2 z = c * 1.5;
      float tt = uTime * 0.1;
      for (int i = 0; i < 5; i++) {
        z = abs(z);
        z = z / (dot(z, z) + 0.0001);
        z -= 0.7;
        z = rot(tt * 0.3 + float(i) * 0.5) * z;
      }
      float d = length(z);
      float val = 0.5 + 0.5 * sin(d * 3.0 - tt * 2.0);
      col = mix(uColorB, uColorA, val);
      col += pal(d * 0.3 + tt * 0.1) * 0.2;
      col /= (d * 0.8 + 1.0);
    } else if (uMode == 57) {
      // Singularidad (disco de acreción + agujero)
      float r = length(c);
      float a = atan(c.y, c.x);
      float swirl = 0.5 + 0.5 * sin(a * 5.0 + 1.0 / (r + 0.06) * 0.6 - uTime * 0.6);
      float band = smoothstep(0.12, 0.22, r) * smoothstep(0.7, 0.25, r);
      col = mix(uColorB, uColorA, swirl) * band;
      col += pal(swirl + uTime * 0.05) * band * 0.3;
      col += vec3(1.0, 0.95, 0.9) * smoothstep(0.02, 0.0, abs(r - 0.16)) * 0.5;
      col *= smoothstep(0.10, 0.14, r);
    } else {
      // Varita mágica (filamento glow + destellos, mode 58)
      vec2 q = c;
      float t2 = uTime * 0.3;
      float path = 0.3 * sin(q.x * 2.0 + t2) + 0.2 * sin(q.x * 5.0 - t2 * 1.5) + fbm(vec2(q.x * 2.0, t2)) * 0.2;
      float d = abs(q.y - path);
      float glow = clamp(0.03 / (d + 0.02), 0.0, 1.0);
      col = mix(uColorB * 0.1, uColorA, glow);
      col += pal(q.x * 0.3 + uTime * 0.1) * smoothstep(0.06, 0.0, d) * 0.5;
      vec2 g = floor((c + 4.0) * 30.0);
      float spk = step(0.95, fract(sin(dot(g, vec2(12.9, 78.2))) * 43758.5));
      float tw = 0.5 + 0.5 * sin(uTime * 3.0 + g.x * 5.0);
      col += vec3(1.0) * spk * tw * smoothstep(0.2, 0.0, d) * 0.6;
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

function softCircleTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/** Silueta sencilla de ave (forma de "V" / alas) para el efecto birds. */
function birdTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(8, 40);
  ctx.quadraticCurveTo(24, 20, 32, 36);
  ctx.quadraticCurveTo(40, 20, 56, 40);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export function ThreeBackground({
  preset,
  colorA,
  colorB,
  bloom = 0,
  bloomThreshold = 0.6,
  bloomRadius = 0.6,
  trails = 0,
  grain = 0,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const reduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    // Respaldo CSS siempre presente: si el WebGL falla o se pierde el
    // contexto, se ve un degradado de colores en vez de negro.
    container.style.background = `linear-gradient(135deg, ${colorA}, ${colorB})`;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // Sin WebGL → queda el degradado CSS
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const w = container.clientWidth || 640;
    const h = container.clientHeight || 360;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // Si el contexto WebGL se pierde, ocultamos el canvas para que se vea
    // el degradado CSS de respaldo (evita el fondo negro).
    const canvasEl = renderer.domElement;
    const onLost = (e: Event) => {
      e.preventDefault();
      canvasEl.style.display = 'none';
    };
    const onRestored = () => {
      canvasEl.style.display = 'block';
    };
    canvasEl.addEventListener('webglcontextlost', onLost);
    canvasEl.addEventListener('webglcontextrestored', onRestored);

    const scene = new THREE.Scene();
    const disposables: { dispose: () => void }[] = [];
    let raf = 0;
    const clock = new THREE.Clock();

    let camera: THREE.Camera;
    let onResize: () => void;
    let renderFrame: () => void;

    // Compositor de postprocesado (se construye tras elegir cámara/escena).
    let composer: EffectComposer | null = null;
    // present() decide entre render directo o a través del compositor (bloom, etc.)
    const present = () => {
      if (composer) composer.render();
      else renderer.render(scene, camera);
    };

    if (preset === 'particles' || preset === 'confetti') {
      // ---------- Partículas GPU (Points) ----------
      const isConfetti = preset === 'confetti';
      camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
      (camera as THREE.PerspectiveCamera).position.z = 4;

      const cB = new THREE.Color(colorB);
      renderer.setClearColor(cB.clone().multiplyScalar(isConfetti ? 0.5 : 0.28), 1);

      const COUNT = isConfetti ? 240 : 320;
      const positions = new Float32Array(COUNT * 3);
      const colors = new Float32Array(COUNT * 3);
      const velocities = new Float32Array(COUNT); // velocidad de caída (confeti)
      const tmp = new THREE.Color();
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 8;
        positions[i * 3 + 1] = (Math.random() - 0.5) * (isConfetti ? 7 : 5);
        positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
        velocities[i] = 0.6 + Math.random() * 1.2;
        if (isConfetti) tmp.setHSL(Math.random(), 0.85, 0.6);
        else tmp.set(colorA);
        colors[i * 3] = tmp.r;
        colors[i * 3 + 1] = tmp.g;
        colors[i * 3 + 2] = tmp.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const sprite = softCircleTexture();
      const mat = new THREE.PointsMaterial({
        size: isConfetti ? 0.16 : 0.13,
        map: sprite,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: isConfetti ? THREE.NormalBlending : THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      disposables.push(geo, mat, sprite);

      const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;

      renderFrame = () => {
        const t = clock.getElapsedTime();
        if (isConfetti) {
          const dt = 1 / 60;
          for (let i = 0; i < COUNT; i++) {
            let y = posAttr.getY(i) - velocities[i] * dt;
            const x = posAttr.getX(i) + Math.sin(t * 2 + i) * 0.004;
            if (y < -3.6) y = 3.6; // recicla arriba
            posAttr.setX(i, x);
            posAttr.setY(i, y);
          }
          posAttr.needsUpdate = true;
          points.rotation.z = Math.sin(t * 0.2) * 0.05;
        } else {
          points.rotation.z = t * 0.04;
          points.rotation.y = Math.sin(t * 0.1) * 0.2;
          points.position.y = Math.sin(t * 0.3) * 0.15;
        }
        present();
      };

      onResize = () => {
        const nw = container.clientWidth || w;
        const nh = container.clientHeight || h;
        renderer.setSize(nw, nh, false);
        (camera as THREE.PerspectiveCamera).aspect = nw / nh;
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      };
    } else if (preset === 'birds') {
      // ---------- Aves (flock de triángulos) ----------
      const cam = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
      cam.position.z = 6;
      camera = cam;
      renderer.setClearColor(new THREE.Color(colorB), 1);

      const COUNT = 90;
      const positions = new Float32Array(COUNT * 3);
      const phases = new Float32Array(COUNT);
      const speeds = new Float32Array(COUNT);
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 12;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
        phases[i] = Math.random() * Math.PI * 2;
        speeds[i] = 0.5 + Math.random();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const sprite = birdTexture();
      const mat = new THREE.PointsMaterial({
        size: 0.5,
        map: sprite,
        color: new THREE.Color(colorA),
        transparent: true,
        depthWrite: false,
      });
      const flock = new THREE.Points(geo, mat);
      scene.add(flock);
      disposables.push(geo, mat, sprite);
      const posA = geo.getAttribute('position') as THREE.BufferAttribute;

      renderFrame = () => {
        const tt = clock.getElapsedTime();
        for (let i = 0; i < COUNT; i++) {
          let x = posA.getX(i) + speeds[i] * 0.012;
          const y = posA.getY(i) + Math.sin(tt * 1.5 + phases[i]) * 0.006;
          if (x > 6.5) x = -6.5;
          posA.setX(i, x);
          posA.setY(i, y);
        }
        posA.needsUpdate = true;
        present();
      };
      onResize = () => {
        const nw = container.clientWidth || w;
        const nh = container.clientHeight || h;
        renderer.setSize(nw, nh, false);
        cam.aspect = nw / nh;
        cam.updateProjectionMatrix();
      };
    } else if (preset === 'dots') {
      // ---------- Dots (rejilla 3D con onda) ----------
      const cam = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
      cam.position.set(0, 0, 7);
      camera = cam;
      renderer.setClearColor(new THREE.Color(colorB).multiplyScalar(0.4), 1);

      const SIDE = 28;
      const total = SIDE * SIDE;
      const positions = new Float32Array(total * 3);
      let k = 0;
      for (let ix = 0; ix < SIDE; ix++) {
        for (let iy = 0; iy < SIDE; iy++) {
          positions[k * 3] = (ix / (SIDE - 1) - 0.5) * 12;
          positions[k * 3 + 1] = (iy / (SIDE - 1) - 0.5) * 8;
          positions[k * 3 + 2] = 0;
          k++;
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const sprite = softCircleTexture();
      const mat = new THREE.PointsMaterial({
        size: 0.22,
        map: sprite,
        color: new THREE.Color(colorA),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const grid = new THREE.Points(geo, mat);
      grid.rotation.x = -0.6;
      scene.add(grid);
      disposables.push(geo, mat, sprite);
      const posA = geo.getAttribute('position') as THREE.BufferAttribute;

      renderFrame = () => {
        const tt = clock.getElapsedTime();
        for (let i = 0; i < total; i++) {
          const x = posA.getX(i);
          const y = posA.getY(i);
          posA.setZ(i, Math.sin(x * 0.6 + tt) * 0.5 + Math.cos(y * 0.6 + tt * 0.8) * 0.5);
        }
        posA.needsUpdate = true;
        grid.rotation.z = Math.sin(tt * 0.1) * 0.1;
        present();
      };
      onResize = () => {
        const nw = container.clientWidth || w;
        const nh = container.clientHeight || h;
        renderer.setSize(nw, nh, false);
        cam.aspect = nw / nh;
        cam.updateProjectionMatrix();
      };
    } else if (preset === 'oceanWaves') {
      // ---------- Olas 3D (plano con desplazamiento + luz) ----------
      const cam = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
      cam.position.set(0, 3.2, 6);
      cam.lookAt(0, 0, 0);
      camera = cam;
      renderer.setClearColor(new THREE.Color(colorB), 1);

      const geo = new THREE.PlaneGeometry(18, 18, 48, 48);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorA),
        flatShading: true,
        metalness: 0.2,
        roughness: 0.7,
      });
      const plane = new THREE.Mesh(geo, mat);
      scene.add(plane);
      const dir = new THREE.DirectionalLight(0xffffff, 1.1);
      dir.position.set(3, 6, 2);
      scene.add(dir);
      scene.add(new THREE.AmbientLight(0xffffff, 0.4));
      disposables.push(geo, mat);

      const posA = geo.getAttribute('position') as THREE.BufferAttribute;
      const baseX = (posA.array as Float32Array).slice();

      renderFrame = () => {
        const tt = clock.getElapsedTime();
        for (let i = 0; i < posA.count; i++) {
          const x = baseX[i * 3];
          const z = baseX[i * 3 + 2];
          const yy =
            Math.sin(x * 0.6 + tt * 1.2) * 0.5 + Math.cos(z * 0.5 + tt * 0.9) * 0.5;
          posA.setY(i, yy);
        }
        posA.needsUpdate = true;
        geo.computeVertexNormals();
        present();
      };
      onResize = () => {
        const nw = container.clientWidth || w;
        const nh = container.clientHeight || h;
        renderer.setSize(nw, nh, false);
        cam.aspect = nw / nh;
        cam.updateProjectionMatrix();
      };
    } else if (preset === 'galaxySpiral') {
      // ---------- Galaxia espiral (Points) ----------
      const cam = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
      cam.position.set(0, 1.5, 4);
      cam.lookAt(0, 0, 0);
      camera = cam;
      renderer.setClearColor(new THREE.Color(colorB).multiplyScalar(0.15), 1);

      const COUNT = 3500;
      const positions = new Float32Array(COUNT * 3);
      const colors = new Float32Array(COUNT * 3);
      const cA = new THREE.Color(colorA);
      const cB = new THREE.Color(colorB);
      const arms = 4;
      const tmp = new THREE.Color();
      for (let i = 0; i < COUNT; i++) {
        const tr = Math.pow(Math.random(), 0.6);
        const radius = tr * 3;
        const arm = Math.floor(Math.random() * arms);
        const angle = (arm / arms) * Math.PI * 2 + tr * 4 + (Math.random() - 0.5) * 0.5;
        positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.25 * (1 - tr);
        positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.2;
        tmp.copy(cA).lerp(cB, tr);
        colors[i * 3] = tmp.r;
        colors[i * 3 + 1] = tmp.g;
        colors[i * 3 + 2] = tmp.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const sprite = softCircleTexture();
      const mat = new THREE.PointsMaterial({
        size: 0.05,
        map: sprite,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geo, mat);
      points.rotation.x = -0.5;
      scene.add(points);
      disposables.push(geo, mat, sprite);

      renderFrame = () => {
        points.rotation.y = clock.getElapsedTime() * 0.05;
        present();
      };
      onResize = () => {
        const nw = container.clientWidth || w;
        const nh = container.clientHeight || h;
        renderer.setSize(nw, nh, false);
        cam.aspect = nw / nh;
        cam.updateProjectionMatrix();
      };
    } else if (preset === 'particleFlow') {
      // ---------- Vuelo a través de partículas (Points) ----------
      const cam = new THREE.PerspectiveCamera(60, w / h, 0.1, 2000);
      camera = cam;
      renderer.setClearColor(new THREE.Color(colorB).multiplyScalar(0.1), 1);

      const COUNT = 1200;
      const positions = new Float32Array(COUNT * 3);
      const colors = new Float32Array(COUNT * 3);
      const cA = new THREE.Color(colorA);
      const cB = new THREE.Color(colorB);
      for (let i = 0; i < COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const r = 10 + Math.random() * 60;
        positions[i * 3] = Math.cos(theta) * r;
        positions[i * 3 + 1] = Math.sin(theta) * r;
        positions[i * 3 + 2] = -Math.random() * 600;
        const col = Math.random() < 0.5 ? cA : cB;
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const sprite = softCircleTexture();
      const mat = new THREE.PointsMaterial({
        size: 2,
        map: sprite,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      disposables.push(geo, mat, sprite);
      const posA = geo.getAttribute('position') as THREE.BufferAttribute;

      renderFrame = () => {
        for (let i = 0; i < COUNT; i++) {
          let z = posA.getZ(i) + 4;
          if (z > 5) z = -600;
          posA.setZ(i, z);
        }
        posA.needsUpdate = true;
        points.rotation.z = clock.getElapsedTime() * 0.02;
        present();
      };
      onResize = () => {
        const nw = container.clientWidth || w;
        const nh = container.clientHeight || h;
        renderer.setSize(nw, nh, false);
        cam.aspect = nw / nh;
        cam.updateProjectionMatrix();
      };
    } else if (preset === 'starFlow') {
      // ---------- Campo estelar en movimiento (Points) ----------
      const cam = new THREE.PerspectiveCamera(60, w / h, 0.1, 2000);
      camera = cam;
      renderer.setClearColor(new THREE.Color(colorB).multiplyScalar(0.08), 1);

      const COUNT = 1800;
      const positions = new Float32Array(COUNT * 3);
      const colors = new Float32Array(COUNT * 3);
      const cA = new THREE.Color(colorA);
      const white = new THREE.Color(0xffffff);
      const tmp = new THREE.Color();
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 120;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
        positions[i * 3 + 2] = -Math.random() * 600;
        tmp.copy(cA).lerp(white, 0.5 + Math.random() * 0.5);
        colors[i * 3] = tmp.r;
        colors[i * 3 + 1] = tmp.g;
        colors[i * 3 + 2] = tmp.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const sprite = softCircleTexture();
      const mat = new THREE.PointsMaterial({
        size: 1.4,
        map: sprite,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      disposables.push(geo, mat, sprite);
      const posA = geo.getAttribute('position') as THREE.BufferAttribute;

      renderFrame = () => {
        for (let i = 0; i < COUNT; i++) {
          let z = posA.getZ(i) + 1.6;
          if (z > 5) z = -600;
          posA.setZ(i, z);
        }
        posA.needsUpdate = true;
        present();
      };
      onResize = () => {
        const nw = container.clientWidth || w;
        const nh = container.clientHeight || h;
        renderer.setSize(nw, nh, false);
        cam.aspect = nw / nh;
        cam.updateProjectionMatrix();
      };
    } else if (preset === 'warpSpace') {
      // ---------- Viaje por el espacio-tiempo (líneas warp) ----------
      const cam = new THREE.PerspectiveCamera(70, w / h, 0.1, 2000);
      camera = cam;
      renderer.setClearColor(new THREE.Color(colorB).multiplyScalar(0.05), 1);

      const COUNT = 700;
      const STREAK = 16;
      const positions = new Float32Array(COUNT * 2 * 3); // 2 vértices por línea
      const colors = new Float32Array(COUNT * 2 * 3);
      const cA = new THREE.Color(colorA);
      const cB = new THREE.Color(colorB);
      const white = new THREE.Color(0xffffff);
      const tmp = new THREE.Color();
      for (let i = 0; i < COUNT; i++) {
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 100;
        const z = -Math.random() * 600;
        positions[i * 6] = x;
        positions[i * 6 + 1] = y;
        positions[i * 6 + 2] = z;
        positions[i * 6 + 3] = x;
        positions[i * 6 + 4] = y;
        positions[i * 6 + 5] = z - STREAK;
        tmp.copy(Math.random() < 0.5 ? cA : cB).lerp(white, 0.4);
        for (let k = 0; k < 2; k++) {
          colors[i * 6 + k * 3] = tmp.r;
          colors[i * 6 + k * 3 + 1] = tmp.g;
          colors[i * 6 + k * 3 + 2] = tmp.b;
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const lines = new THREE.LineSegments(geo, mat);
      scene.add(lines);
      disposables.push(geo, mat);
      const posA = geo.getAttribute('position') as THREE.BufferAttribute;

      renderFrame = () => {
        for (let i = 0; i < COUNT; i++) {
          let z = posA.getZ(i * 2) + 9; // cabeza
          if (z > 30) z = -600;
          posA.setZ(i * 2, z);
          posA.setZ(i * 2 + 1, z - STREAK); // cola
        }
        posA.needsUpdate = true;
        present();
      };
      onResize = () => {
        const nw = container.clientWidth || w;
        const nh = container.clientHeight || h;
        renderer.setSize(nw, nh, false);
        cam.aspect = nw / nh;
        cam.updateProjectionMatrix();
      };
    } else {
      // ---------- Shader quad (mesh / aurora / starfield / plasma / waves / etc.) ----------
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const geo = new THREE.PlaneGeometry(2, 2);
      const uniforms = {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(w, h) },
        uColorA: { value: new THREE.Color(colorA) },
        uColorB: { value: new THREE.Color(colorB) },
        uMode: { value: MODE[preset as ShaderPreset] },
      };
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
      });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      disposables.push(geo, mat);

      renderFrame = () => {
        uniforms.uTime.value = reduced ? 0.5 : clock.getElapsedTime();
        present();
      };

      onResize = () => {
        const nw = container.clientWidth || w;
        const nh = container.clientHeight || h;
        renderer.setSize(nw, nh, false);
        uniforms.uResolution.value.set(
          nw * renderer.getPixelRatio(),
          nh * renderer.getPixelRatio(),
        );
      };
      onResize();
    }

    // ---------- Postprocesado (bloom cinematográfico, estelas, grano) ----------
    // Solo se activa si el tema pide algún efecto, para no afectar rendimiento.
    if (!reduced && (bloom > 0 || trails > 0 || grain > 0)) {
      try {
        composer = new EffectComposer(renderer);
        composer.setPixelRatio(renderer.getPixelRatio());
        composer.setSize(
          container.clientWidth || w,
          container.clientHeight || h,
        );
        composer.addPass(new RenderPass(scene, camera));

        if (trails > 0) {
          // Persistencia de imagen: deja estelas suaves del movimiento.
          const after = new AfterimagePass(trails);
          composer.addPass(after);
          disposables.push(after);
        }

        if (bloom > 0) {
          // Glow tipo "Unreal": solo brillan las zonas por encima del umbral.
          const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(
              container.clientWidth || w,
              container.clientHeight || h,
            ),
            bloom, // strength
            bloomRadius, // radius
            bloomThreshold, // threshold
          );
          composer.addPass(bloomPass);
          disposables.push(bloomPass);
        }

        if (grain > 0) {
          // Grano de película para un acabado más cinematográfico.
          const film = new FilmPass(grain, false);
          composer.addPass(film);
          disposables.push(film);
        }

        disposables.push(composer);
      } catch {
        composer = null; // Si algo falla, se cae al render directo.
      }
    }

    // El resize debe redimensionar también el compositor y el bloom.
    const baseResize = onResize;
    onResize = () => {
      baseResize();
      const nw = container.clientWidth || w;
      const nh = container.clientHeight || h;
      composer?.setSize(nw, nh);
    };

    const loop = () => {
      renderFrame();
      raf = requestAnimationFrame(loop);
    };

    if (reduced) {
      renderFrame(); // un solo frame estático
    } else {
      loop();
    }

    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvasEl.removeEventListener('webglcontextlost', onLost);
      canvasEl.removeEventListener('webglcontextrestored', onRestored);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [preset, colorA, colorB, bloom, bloomThreshold, bloomRadius, trails, grain]);

  return <div ref={ref} className="absolute inset-0 h-full w-full" />;
}
