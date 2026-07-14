import type { RenderSlide, Song, Theme } from '../types';

/**
 * Convierte los bloques de una canción en slides renderizables.
 * - Una LÍNEA EN BLANCO separa diapositivas (salto manual de slide).
 * - Además, los grupos largos se dividen según theme.maxLinesPerSlide.
 */
export function buildSlides(song: Song, theme: Theme): RenderSlide[] {
  const max = Math.max(1, theme.maxLinesPerSlide);
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

    // Divide cada grupo según el máximo de líneas por slide.
    const chunks: string[][] = [];
    for (const group of groups) {
      for (let i = 0; i < group.length; i += max) {
        chunks.push(group.slice(i, i + max));
      }
    }
    if (chunks.length === 0) continue;

    chunks.forEach((chunk, idx) => {
      slides.push({
        id: `${block.id}-${idx}`,
        blockId: block.id,
        type: block.type,
        label: block.label,
        lines: chunk,
        partIndex: idx,
        partCount: chunks.length,
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
  custom: 'Personalizado',
};
