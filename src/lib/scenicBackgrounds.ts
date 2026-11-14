import type { BackgroundConfig } from '../types';

export const SCENIC_BACKGROUNDS = {
  comicCity: { id: 'theme-ciudad-de-tinta', label: 'Ciudad de Tinta', colorA: '#ff677c', colorB: '#211a47', font: 'Bangers', weight: 400, contrast: 0.27 },
  jerichoCollapse: { id: 'theme-caen-las-murallas', label: 'Caen las Murallas', colorA: '#ffc18a', colorB: '#3b2531', font: 'Cinzel', weight: 700, contrast: 0.23 },
  fjordStorm: { id: 'theme-tormenta-sobre-el-fiordo', label: 'Tormenta sobre el Fiordo', colorA: '#9cc9e5', colorB: '#19263e', font: 'Montserrat', weight: 700, contrast: 0.16 },
  livingReef: { id: 'theme-arrecife-bioluminiscente', label: 'Arrecife Bioluminiscente', colorA: '#55e3d8', colorB: '#071b39', font: 'Raleway', weight: 800, contrast: 0.17 },
  alpineAurora: { id: 'theme-aurora-del-valle', label: 'Aurora del Valle', colorA: '#57ebac', colorB: '#100e31', font: 'Manrope', weight: 800, contrast: 0.14 },
  rainbowForest: { id: 'theme-bosque-tras-la-lluvia', label: 'Bosque tras la Lluvia', colorA: '#d5eeb4', colorB: '#132e2a', font: 'Playfair Display', weight: 700, contrast: 0.19 },
  astronaut: { id: 'theme-astronauta-entre-galaxias', label: 'Astronauta entre Galaxias', colorA: '#8ec9ff', colorB: '#120924', font: 'Manrope', weight: 800, contrast: 0.16 },
  gloryCross: { id: 'theme-cruz-de-gloria', label: 'Cruz de Gloria', colorA: '#ffd787', colorB: '#281b37', font: 'Cinzel', weight: 700, contrast: 0.24 },
  discoEighties: { id: 'theme-discoteca-de-los-80', label: 'Discoteca de los 80', colorA: '#ff62bf', colorB: '#171640', font: 'Bangers', weight: 400, contrast: 0.23 },
} as const;

export type ScenicBackgroundPreset = keyof typeof SCENIC_BACKGROUNDS;
export const SCENIC_PRESETS = Object.keys(SCENIC_BACKGROUNDS) as ScenicBackgroundPreset[];
export const SCENIC_THEME_IDS = new Set<string>(Object.values(SCENIC_BACKGROUNDS).map(({ id }) => id));

export function isScenicBackgroundPreset(preset: string): preset is ScenicBackgroundPreset {
  return Object.prototype.hasOwnProperty.call(SCENIC_BACKGROUNDS, preset);
}

export const LEGACY_JERICHO_THEME_ID = 'theme-murallas-que-caen';

export function restoreJerichoBackground(background: BackgroundConfig, themeId?: string): BackgroundConfig {
  const { id, colorA, colorB } = SCENIC_BACKGROUNDS.jerichoCollapse;
  if (background.kind === 'animated' && String(background.preset) === 'fallingWalls') {
    return { ...background, preset: 'jerichoCollapse' };
  }
  // La versión anterior convertía el preset retirado en un fondo sólido.
  if (themeId === id && background.kind === 'solid' && background.color.toLowerCase() === colorB) {
    return { kind: 'animated', preset: 'jerichoCollapse', colorA, colorB };
  }
  return background;
}
