import type { RenderSlide, SlideBlock, Song } from '../types';

/**
 * Convierte los bloques de una canción en slides renderizables.
 * - Una LÍNEA EN BLANCO separa diapositivas (salto manual de slide).
 * - Nunca divide automáticamente el contenido escrito por el usuario.
 */
export function buildSlides(song: Song): RenderSlide[] {
  return song.blocks.flatMap((block) => buildBlockSlides(block).map(({ slide }) => slide));
}

export function buildBlockSlides(block: SlideBlock): { slide: RenderSlide; start: number }[] {
  const groups: { lines: string[]; start: number; end: number }[] = [];
  let offset = 0;
  let current: (typeof groups)[number] | undefined;
  for (const line of block.lines) {
    if (line.trim()) {
      if (!current) {
        current = { lines: [], start: offset, end: offset };
        groups.push(current);
      }
      current.lines.push(line);
      current.end = offset + line.length;
    } else {
      current = undefined;
    }
    offset += line.length + 1;
  }

  return groups.map(({ lines, start, end }, partIndex) => {
    const slide: RenderSlide = {
      id: `${block.id}-${partIndex}`,
      blockId: block.id,
      type: block.type,
      label: block.label,
      lines,
      partIndex,
      partCount: groups.length,
    };
    if (block.typography?.preset) {
      slide.typography = {
        ...block.typography,
        emphasis: block.typography.emphasis
          ?.filter((range) => range.start >= start && range.end <= end)
          .map((range) => ({ start: range.start - start, end: range.end - start })),
      };
    }
    return { slide, start };
  });
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
