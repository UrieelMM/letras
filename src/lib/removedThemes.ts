import type { AnimatedBgPreset, BackgroundConfig } from '../types';

const RETIRED_PRAISE_THEMES = {
  jubilantHands: 'theme-palmas-de-jubilo',
  joyfulTambourine: 'theme-pandero-de-gozo',
  victoryFlags: 'theme-banderas-de-victoria',
  leapingDeer: 'theme-ciervos-en-libertad',
  partedSea: 'theme-mar-abierto',
  fallingWalls: 'theme-murallas-que-caen',
  promisePath: 'theme-camino-de-promesa',
  gloryCrown: 'theme-corona-de-gloria',
} as const;

export const RETIRED_PRAISE_THEME_IDS = new Set<string>(Object.values(RETIRED_PRAISE_THEMES));
const RETIRED_PRAISE_PRESETS = new Set<string>(Object.keys(RETIRED_PRAISE_THEMES));

export function isRetiredPraiseBackground(background?: BackgroundConfig): boolean {
  return background?.kind === 'animated' && RETIRED_PRAISE_PRESETS.has(background.preset);
}

export const REMOVED_THEME_IDS = new Set([
  ...RETIRED_PRAISE_THEME_IDS,
  'theme-aurora',
  'theme-clean',
  'theme-olas',
  'theme-neon',
  'theme-graffiti',
  'theme-inferno',
  'theme-esmeralda',
  'theme-medianoche',
  'theme-vintage',
  'theme-lavanda',
  'theme-menta',
  'theme-hipnosis',
  'theme-vortice',
  'theme-mandala',
  'theme-galaxia-espiral',
  'theme-agujero',
  'theme-aurora-suave',
  'theme-lava-lamp',
  'theme-tinta-agua',
  'theme-petalos',
  'theme-respiro',
  'theme-dunas',
  'theme-niebla',
  'theme-amanecer',
  'theme-galaxia-3d',
  'theme-supernova-cine',
  'theme-via-lactea-cine',
  'theme-aurora-cine',
]);

export const REMOVED_BG_PRESETS = new Set<AnimatedBgPreset>([
  'aurora',
  'vortex',
  'spiral',
  'wormhole',
  'neon',
  'auroraSoft',
  'lavaLamp',
  'inkBloom',
  'petals',
  'dunes',
  'galaxySpiral',
]);
