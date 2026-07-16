import type { RenderSlide, Song } from '../types';

/**
 * Convierte los bloques de una canción en slides renderizables.
 * - Una LÍNEA EN BLANCO separa diapositivas (salto manual de slide).
 * - Nunca divide automáticamente el contenido escrito por el usuario.
 */
export function buildSlides(song: Song): RenderSlide[] {
  const slides: RenderSlide[] = [];

  for (const block of song.blocks) {
    // Agrupa las líneas separándolas en cada línea en blanco.
    const groups: string[][] = [];
    let current: string[] = [];
    for (const raw of block.lines) {
      if (raw.trim().length === 0) {
        if (current.length) {
          groups.push(current);
          current = [];
        }
      } else {
        current.push(raw);
      }
    }
    if (current.length) groups.push(current);

    if (groups.length === 0) continue;

    groups.forEach((group, idx) => {
      slides.push({
        id: `${block.id}-${idx}`,
        blockId: block.id,
        type: block.type,
        label: block.label,
        lines: group,
        partIndex: idx,
        partCount: groups.length,
      });
    });
  }

  return slides;
}

export const BLOCK_LABELS: Record<string, string> = {
  verse: 'Estrofa',
  chorus: 'Coro',
  bridge: 'Puente',
  intro: 'Intro',
  outro: 'Final',
  scripture: 'Biblia',
  custom: 'Personalizado',
};
