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
} as const;

export type KineticBackgroundPreset = keyof typeof KINETIC_BACKGROUNDS;

export const KINETIC_BACKGROUND_PRESETS = Object.keys(KINETIC_BACKGROUNDS) as KineticBackgroundPreset[];

export function isKineticBackgroundPreset(value: string): value is KineticBackgroundPreset {
  return Object.prototype.hasOwnProperty.call(KINETIC_BACKGROUNDS, value);
}
