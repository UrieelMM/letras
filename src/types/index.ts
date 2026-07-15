// ---------- Modelo de datos de Wordship Screen ----------

export type SlideBlockType =
  | 'verse'
  | 'chorus'
  | 'bridge'
  | 'intro'
  | 'outro'
  | 'custom';

export interface SlideBlock {
  id: string;
  type: SlideBlockType;
  label?: string; // "Estrofa 1", "Coro"...
  lines: string[]; // líneas de texto crudas; una línea vacía crea un slide manual
}

export interface Song {
  id: string;
  title: string;
  author?: string;
  ccli?: string;
  tags: string[];
  blocks: SlideBlock[];
  themeId?: string; // preset en el que se basa
  theme?: Theme; // copia de trabajo personalizada (no muta el preset)
  createdAt: number;
  updatedAt: number;
}

export type TransitionPreset =
  | 'fade'
  | 'slideUp'
  | 'slideHorizontal'
  | 'scale'
  | 'blurIn'
  | 'crossfade'
  | 'slideDown'
  | 'slideLeft'
  | 'zoomIn'
  | 'zoomOut'
  | 'flipX'
  | 'flipY'
  | 'rotateIn'
  | 'blurScale'
  | 'skewIn'
  | 'riseScale';

// Revelado de las letras dentro del slide (animado con GSAP)
export type TextRevealPreset =
  | 'none'
  | 'fade'
  | 'linesUp'
  | 'wordsUp'
  | 'charsUp'
  | 'typewriter'
  | 'bounce'
  | 'pop'
  | 'dance'
  | 'fromLeft'
  | 'fromRight'
  | 'zoomIn'
  | 'flip'
  | 'blurWords'
  | 'dropIn'
  | 'swing'
  | 'glitch'
  | 'waveText'
  | 'expand';

// Movimiento continuo de las letras (se mantiene siempre, no solo al entrar)
export type TextMotionPreset =
  | 'none'
  | 'float'
  | 'sway'
  | 'pulse'
  | 'breathe'
  | 'wave'
  | 'glow'
  | 'drift'
  | 'tilt'
  | 'wobble'
  | 'heartbeat'
  | 'jelly'
  | 'orbit'
  | 'shimmer'
  | 'zoomSlow'
  | 'rippleText'
  | 'bobUnits';

export type AnimatedBgPreset =
  | 'meshGradient'
  | 'particles'
  | 'aurora'
  | 'starfield'
  | 'plasma'
  | 'waves'
  | 'rainbow'
  | 'confetti'
  | 'tunnel'
  | 'vortex'
  | 'kaleidoscope'
  | 'nebula'
  | 'liquid'
  | 'caustics'
  | 'fractal'
  | 'warp'
  | 'spiral'
  | 'grid'
  // estilo Vanta.js
  | 'clouds'
  | 'halo'
  | 'orb'
  | 'gradientFlow'
  | 'birds'
  | 'dots'
  | 'oceanWaves'
  // fondos shader únicos
  | 'cells'
  | 'matrix'
  | 'ripple'
  | 'lightning'
  | 'smoke'
  | 'fireflies'
  | 'wormhole'
  | 'sunrays'
  | 'neon'
  | 'crystal'
  // fondos lentos / envolventes
  | 'silk'
  | 'marble'
  | 'auroraSoft'
  | 'lavaLamp'
  | 'inkBloom'
  | 'topographic'
  | 'satin'
  | 'deepSea'
  | 'petals'
  | 'liquidMetal'
  | 'breathingBg'
  | 'dunes'
  | 'smokeRings'
  | 'cosmosDrift'
  // estilo retro / synthwave / vector
  | 'outrun'
  | 'checkerFloor'
  | 'retroSun'
  | 'gridTunnel'
  | 'wireMountains'
  | 'crt'
  | 'halftone'
  | 'neonRings'
  | 'neonBurst'
  | 'vectorStars'
  | 'crystal2'
  // inspirados en ejemplos (galaxia, singularidad, fractal, partículas)
  | 'cosmicWaves'
  | 'kaliFractal'
  | 'singularity'
  | 'magicTrail'
  | 'galaxySpiral'
  | 'particleFlow'
  | 'starFlow'
  | 'warpSpace'
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
  | 'glassTiles';

// Capa de efectos que se superpone SOBRE cualquier fondo (incl. imagen)
export type OverlayEffectPreset =
  | 'none'
  | 'rain'
  | 'snow'
  | 'stars'
  | 'bokeh'
  | 'confetti'
  | 'embers'
  | 'emojis';

export interface OverlayEffectConfig {
  preset: OverlayEffectPreset;
  color: string;
  intensity: number; // 0..1 (densidad)
  emojis?: string[]; // glifos a flotar cuando preset === 'emojis'
}

export type BackgroundConfig =
  | { kind: 'solid'; color: string }
  | { kind: 'gradient'; from: string; to: string; angle: number }
  | { kind: 'image'; url: string; fit: 'cover' | 'contain' }
  | {
      kind: 'animated';
      preset: AnimatedBgPreset;
      colorA: string;
      colorB: string;
      // ----- Efectos de postprocesado (cinematográficos) -----
      bloom?: number; // intensidad del glow (0 = desactivado, típico 0.4–1.6)
      bloomThreshold?: number; // umbral de brillo para el glow (0..1, default 0.6)
      bloomRadius?: number; // dispersión del glow (0..1, default 0.6)
      trails?: number; // estelas / persistencia (0 = off, típico 0.7–0.92)
      grain?: number; // grano de película (0 = off, típico 0.2–0.5)
    };

export interface Theme {
  id: string;
  name: string;
  font: {
    family: string;
    weight: number;
    sizeVw: number; // tamaño responsivo en viewport-width
    lineHeight: number;
    letterSpacing: number;
  };
  color: {
    text: string;
    shadow: boolean;
  };
  alignment: 'left' | 'center' | 'right' | 'justify';
  vAlign: 'top' | 'middle' | 'bottom';
  uppercase: boolean;
  autoFit?: boolean; // encoge la fuente para que el texto quepa (default: true)
  rainbowText?: boolean; // letras con color arcoíris animado
  maxLinesPerSlide: number;
  transition: TransitionPreset;
  textReveal: TextRevealPreset;
  textMotion?: TextMotionPreset; // animación continua de las letras
  background: BackgroundConfig;
  overlay?: OverlayEffectConfig; // efecto animado sobre el fondo
  contrast: {
    overlayColor: string;
    overlayOpacity: number; // 0..1
    blurPx: number;
  };
}

export interface SetlistItem {
  songId: string;
}

export interface Setlist {
  id: string;
  name: string;
  items: SetlistItem[];
}

export interface AppSettings {
  defaultThemeId: string;
  language: 'es' | 'en';
  logoUrl?: string;
}

// Un slide renderizable; un bloque solo se parte mediante líneas vacías manuales.
export interface RenderSlide {
  id: string;
  blockId: string;
  type: SlideBlockType;
  label?: string;
  lines: string[];
  partIndex: number;
  partCount: number;
}

// Estado que se transmite a la ventana de proyección.
export interface LiveState {
  slide: RenderSlide | null;
  theme: Theme;
  blackout: boolean;
  showLogo: boolean;
  logoUrl?: string;
  clearText: boolean; // oculta el texto, mantiene el fondo
}

export type SyncMessage =
  | { type: 'LIVE'; payload: LiveState }
  | { type: 'REQUEST_STATE' };
