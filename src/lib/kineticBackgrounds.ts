export const KINETIC_BACKGROUNDS = {
  origamiWind: { id: 'theme-origami-viento', label: 'Origami al Viento', colorA: '#ffb892', colorB: '#192052' },
  citrusFizz: { id: 'theme-citricos-efervescentes', label: 'Cítricos Efervescentes', colorA: '#ffcf58', colorB: '#103d3a' },
  popPrint: { id: 'theme-imprenta-pop', label: 'Imprenta Pop', colorA: '#ff569d', colorB: '#262049' },
  springGarden: { id: 'theme-jardin-resorte', label: 'Jardín de Resorte', colorA: '#ff90b7', colorB: '#1b3b37' },
  magneticBlocks: { id: 'theme-bloques-magneticos', label: 'Bloques Magnéticos', colorA: '#ff9d54', colorB: '#221b41' },
  trainWindow: { id: 'theme-ventana-tren', label: 'Ventana de Tren', colorA: '#ffb675', colorB: '#3c2951' },
  movingPrisms: { id: 'theme-prisma-movimiento', label: 'Prisma en Movimiento', colorA: '#8fe1ff', colorB: '#22173f' },
  gearWorkshop: { id: 'theme-taller-engranajes', label: 'Taller de Engranajes', colorA: '#ffc76e', colorB: '#20323d' },
  fishSchool: { id: 'theme-banco-peces', label: 'Banco de Peces', colorA: '#ffd08a', colorB: '#142d55' },
  livingMap: { id: 'theme-mapa-vivo', label: 'Mapa Vivo', colorA: '#e9ef8a', colorB: '#163637' },
  graceRain: { id: 'theme-lluvia-de-gracia', label: 'Lluvia de Gracia', colorA: '#a4e8ff', colorB: '#122543' },
  hopeSunrise: { id: 'theme-amanecer-de-esperanza', label: 'Amanecer de Esperanza', colorA: '#ffca8e', colorB: '#271e46' },
  lightMantle: { id: 'theme-manto-de-luz', label: 'Manto de Luz', colorA: '#dcbaff', colorB: '#21193e' },
  livingGlass: { id: 'theme-vitral-vivo', label: 'Vitral Vivo', colorA: '#ffc682', colorB: '#1b2544' },
  goldenWheat: { id: 'theme-trigo-dorado', label: 'Trigo Dorado', colorA: '#ffdc8d', colorB: '#352822' },
  promisePages: { id: 'theme-paginas-de-promesa', label: 'Páginas de Promesa', colorA: '#ffe1a6', colorB: '#302443' },
  glorySky: { id: 'theme-firmamento-de-gloria', label: 'Firmamento de Gloria', colorA: '#c3d8ff', colorB: '#171d4e' },
  worshipIncense: { id: 'theme-incienso-de-adoracion', label: 'Incienso de Adoración', colorA: '#f2accc', colorB: '#271b39' },
  praiseEcho: { id: 'theme-eco-de-alabanza', label: 'Eco de Alabanza', colorA: '#80f5d9', colorB: '#132d39' },
  hopeCandles: { id: 'theme-velas-de-esperanza', label: 'Velas de Esperanza', colorA: '#ffbc72', colorB: '#2d2042' },
} as const;

export type KineticBackgroundPreset = keyof typeof KINETIC_BACKGROUNDS;

export const KINETIC_BACKGROUND_PRESETS = Object.keys(KINETIC_BACKGROUNDS) as KineticBackgroundPreset[];
export const KINETIC_THEME_IDS = new Set<string>(Object.values(KINETIC_BACKGROUNDS).map(({ id }) => id));

export function isKineticBackgroundPreset(value: string): value is KineticBackgroundPreset {
  return Object.prototype.hasOwnProperty.call(KINETIC_BACKGROUNDS, value);
}
