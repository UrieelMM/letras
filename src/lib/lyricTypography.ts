import type { LyricEmphasis, LyricTypography, LyricTypographyPreset } from '../types';

interface Preset {
  label: string;
  family: string;
  weight: number;
  accentFamily: string;
  accentWeight: number;
  accentColor: string;
  accentScale: number;
}

export const LYRIC_PRESETS: Record<LyricTypographyPreset, Preset> = {
  handwritten: {
    label: 'Manuscrito',
    family: 'Kalam',
    weight: 400,
    accentFamily: 'Amatic SC',
    accentWeight: 700,
    accentColor: '#ffedb5',
    accentScale: 1.55,
  },
  comic: {
    label: 'Cómic',
    family: 'Bangers',
    weight: 400,
    accentFamily: 'Bangers',
    accentWeight: 400,
    accentColor: '#ffe36b',
    accentScale: 1.45,
  },
  editorial: {
    label: 'Editorial',
    family: 'Inter',
    weight: 600,
    accentFamily: 'Barlow Condensed',
    accentWeight: 800,
    accentColor: '#bdf6e9',
    accentScale: 1.25,
  },
};

export function getLyricPreset(typography?: LyricTypography): Preset | undefined {
  return typography?.preset ? LYRIC_PRESETS[typography.preset] : undefined;
}

export function hasLyricStyling(typography?: LyricTypography): boolean {
  return Boolean(getLyricPreset(typography) && (typography?.applyToSection || typography?.emphasis?.length));
}

/** Amplía la selección a palabras completas y crea un rango independiente por línea. */
export function selectionToEmphasis(text: string, selection: LyricEmphasis): LyricEmphasis[] {
  if (selection.start >= selection.end) return [];
  const ranges: LyricEmphasis[] = [];
  let offset = 0;
  for (const line of text.split('\n')) {
    const words = [...line.matchAll(/\S+/g)].filter((word) => {
      const start = offset + word.index;
      return start < selection.end && start + word[0].length > selection.start;
    });
    if (words.length) {
      const last = words[words.length - 1];
      ranges.push({ start: offset + words[0].index, end: offset + last.index + last[0].length });
    }
    offset += line.length + 1;
  }
  return ranges;
}

export function mergeEmphasis(ranges: LyricEmphasis[]): LyricEmphasis[] {
  const merged: LyricEmphasis[] = [];
  for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
    const last = merged[merged.length - 1];
    if (last && range.start < last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}

export function findLyricEdit(before: string, after: string, caret: number) {
  const delta = after.length - before.length;
  const previousCaret = caret - delta;
  // El cursor desambigua ediciones al lado de texto idéntico (p. ej. "luz luz").
  const useCaret = previousCaret >= 0 && previousCaret <= before.length
    && before.slice(previousCaret) === after.slice(caret);
  const prefixLimit = useCaret ? Math.min(caret, previousCaret) : Math.min(before.length, after.length);
  let start = 0;
  while (start < prefixLimit && before[start] === after[start]) start++;
  let oldEnd = useCaret ? previousCaret : before.length;
  let newEnd = useCaret ? caret : after.length;
  while (oldEnd > start && newEnd > start && before[oldEnd - 1] === after[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }
  return { start, oldEnd, newEnd, delta };
}

/** Conserva las marcas intactas al editar el texto a su alrededor. */
export function rebaseLyricRanges<T extends LyricEmphasis>(
  ranges: T[],
  before: string,
  after: string,
  caret: number,
): T[] {
  if (!ranges.length || before === after) return ranges;
  const { start, oldEnd, delta } = findLyricEdit(before, after, caret);
  return ranges.flatMap((range) => {
    if (range.end > start && range.start < oldEnd) return [];
    const shifted = range.end <= start
      ? range
      : { ...range, start: range.start + delta, end: range.end + delta };
    const beginsAtWord = shifted.start === 0 || /\s/.test(after[shifted.start - 1]);
    const endsAtWord = shifted.end === after.length || /\s/.test(after[shifted.end]);
    return beginsAtWord && endsAtWord ? [shifted] : [];
  });
}

/** Divide el texto por rangos ordenados, incluso si un rango cruza el inicio del fragmento. */
export function splitLyricText<T extends LyricEmphasis>(text: string, offset: number, ranges: T[]) {
  const fragments: { text: string; start: number; range?: T }[] = [];
  let cursor = 0;
  for (const range of ranges) {
    const start = Math.max(cursor, range.start - offset);
    const end = Math.min(text.length, range.end - offset);
    if (end <= start) continue;
    if (start > cursor) fragments.push({ text: text.slice(cursor, start), start: offset + cursor });
    fragments.push({ text: text.slice(start, end), start: offset + start, range });
    cursor = end;
  }
  if (cursor < text.length) fragments.push({ text: text.slice(cursor), start: offset + cursor });
  return fragments;
}
