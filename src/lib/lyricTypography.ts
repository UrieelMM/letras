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

/** Conserva las marcas intactas al editar el texto a su alrededor. */
export function rebaseEmphasis(
  ranges: LyricEmphasis[],
  before: string,
  after: string,
  caret: number,
): LyricEmphasis[] {
  if (!ranges.length || before === after) return ranges;
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
  return ranges.flatMap((range) => {
    if (range.end > start && range.start < oldEnd) return [];
    const shifted = range.end <= start
      ? range
      : { start: range.start + delta, end: range.end + delta };
    const beginsAtWord = shifted.start === 0 || /\s/.test(after[shifted.start - 1]);
    const endsAtWord = shifted.end === after.length || /\s/.test(after[shifted.end]);
    return beginsAtWord && endsAtWord ? [shifted] : [];
  });
}

export function splitEmphasizedLines(lines: string[], emphasis: LyricEmphasis[]) {
  const sorted = mergeEmphasis(emphasis);
  let offset = 0;
  return lines.map((line) => {
    const fragments: { text: string; accented: boolean }[] = [];
    let cursor = 0;
    for (const range of sorted) {
      const start = range.start - offset;
      const end = range.end - offset;
      if (start < cursor || end > line.length || end <= start) continue;
      if (start > cursor) fragments.push({ text: line.slice(cursor, start), accented: false });
      fragments.push({ text: line.slice(start, end), accented: true });
      cursor = end;
    }
    if (cursor < line.length) fragments.push({ text: line.slice(cursor), accented: false });
    offset += line.length + 1;
    return fragments;
  });
}
