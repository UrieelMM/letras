import type { TextAnimationConfig, Theme } from '../types';

export function getThemeTextAnimation(theme: Theme): TextAnimationConfig {
  return theme.textAnimation ?? {
    reveal: theme.textReveal ?? 'wordsUp',
    motion: theme.textMotion ?? 'none',
    speed: 'normal',
  };
}
