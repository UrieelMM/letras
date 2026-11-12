import type { SlideBlock, SlideBackgroundOverride } from '../types';
import { findLyricEdit } from './lyricTypography';
import { buildBlockSlides } from './slides';

/** Sigue el inicio del texto de cada slide cuando se insertan o quitan saltos. */
export function rebaseSlideBackgrounds(block: SlideBlock, lines: string[], caret: number): SlideBackgroundOverride[] {
  const overrides = block.slideBackgrounds ?? [];
  const before = block.lines.join('\n');
  const after = lines.join('\n');
  if (!overrides.length || before === after) return overrides;

  const edit = findLyricEdit(before, after, caret);
  const previous = buildBlockSlides(block);
  const next = buildBlockSlides({ ...block, lines, slideBackgrounds: undefined });
  const rebased = new Map<number, SlideBackgroundOverride>();
  for (const override of [...overrides].sort((a, b) => a.partIndex - b.partIndex)) {
    const source = previous[override.partIndex];
    if (!source) continue;
    const end = source.start + source.slide.lines.join('\n').length;
    const deleted = edit.start <= source.start && edit.oldEnd >= end && edit.newEnd === edit.start;
    if (deleted) continue;
    const anchor = source.start >= edit.oldEnd
      ? source.start + edit.delta
      : Math.min(source.start, edit.start);
    const target = next.find(({ start, slide }) =>
      anchor >= start && anchor < start + slide.lines.join('\n').length,
    ) ?? (source.start >= edit.start && source.start < edit.oldEnd
      ? next.find(({ start }) => start >= edit.start && start < edit.newEnd)
      : undefined);
    if (!target || rebased.has(target.slide.partIndex)) continue;
    rebased.set(target.slide.partIndex, { ...override, partIndex: target.slide.partIndex });
  }
  return [...rebased.values()];
}
