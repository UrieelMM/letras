import type { LyricSelectionAnimation, TextAnimationConfig, Theme } from '../types';

export const DEFAULT_SELECTION_ANIMATION: TextAnimationConfig = {
  reveal: 'snapTurn',
  motion: 'none',
  speed: 'normal',
};

export function getThemeTextAnimation(theme: Theme): TextAnimationConfig {
  return theme.textAnimation ?? {
    reveal: theme.textReveal ?? 'wordsUp',
    motion: theme.textMotion ?? 'none',
    speed: 'normal',
  };
}

/** Una animación nueva reemplaza solo el tramo seleccionado de las anteriores. */
export function replaceSelectionAnimations(
  current: LyricSelectionAnimation[],
  selection: LyricSelectionAnimation[],
  lyrics: string,
): LyricSelectionAnimation[] {
  let remaining = current;
  for (const selected of selection) {
    remaining = remaining.flatMap((range) => {
      if (range.end <= selected.start || range.start >= selected.end) return [range];
      return [
        { start: range.start, end: selected.start },
        { start: selected.end, end: range.end },
      ].flatMap(({ start, end }) => {
        const text = lyrics.slice(start, end);
        const trimmed = text.trim();
        if (!trimmed) return [];
        const first = start + text.length - text.trimStart().length;
        return [{ ...range, start: first, end: first + trimmed.length }];
      });
    });
  }
  return [...remaining, ...selection].sort((a, b) => a.start - b.start);
}
