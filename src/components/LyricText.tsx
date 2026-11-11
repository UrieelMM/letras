import { useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { getLyricPreset, splitEmphasizedLines } from '../lib/lyricTypography';
import type { LyricAnimationSpeed, LyricTypography } from '../types';
import './lyric-text.css';

const SPEEDS: Record<LyricAnimationSpeed, number> = {
  off: 0,
  slow: 0.7,
  normal: 1,
  fast: 1.5,
};

interface Props {
  lines: string[];
  typography: LyricTypography;
  reduceMotion: boolean;
}

export function LyricText({ lines, typography, reduceMotion }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const { preset, speed, emphasis, applyToSection } = typography;
  const style = getLyricPreset(typography);
  const content = useMemo(() => splitEmphasizedLines(lines, emphasis ?? []), [lines, emphasis]);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element || reduceMotion || speed === 'off') return;

    const context = gsap.context(() => {
      const lineNodes = element.querySelectorAll('.lyric-line');
      const accents = element.querySelectorAll('.lyric-accent');
      const ink = element.querySelectorAll('.lyric-ink i');
      const entrance = gsap.timeline().timeScale(SPEEDS[speed ?? 'normal'] ?? 1);

      if (preset === 'comic') {
        if (applyToSection) entrance.from(lineNodes, {
          opacity: 0, y: '0.24em', scale: 0.94, duration: 0.32,
          ease: 'power3.out', stagger: { amount: 0.18 },
        });
        if (accents.length) entrance.from(accents, {
          opacity: 0, scale: 0.68, rotation: -7, duration: 0.46,
          ease: 'back.out(2.5)', stagger: { amount: 0.22 },
        }, 0.15);
      } else if (preset === 'handwritten') {
        if (applyToSection) entrance.from(lineNodes, {
          opacity: 0, y: '0.22em', duration: 0.46,
          ease: 'power2.out', stagger: { amount: 0.2 },
        });
        if (accents.length) entrance.from(accents, {
          opacity: 0, y: '0.23em', rotation: -6, duration: 0.45,
          ease: 'power3.out', stagger: { amount: 0.2 },
        }, 0.13);
        if (ink.length) entrance.from(ink, {
          scaleX: 0, duration: 0.3, ease: 'power2.out', stagger: { amount: 0.14 },
        }, 0.42);
      } else {
        if (applyToSection) entrance.from(lineNodes, {
          opacity: 0, y: '0.18em', duration: 0.42,
          ease: 'power3.out', stagger: { amount: 0.2 },
        });
        if (accents.length) entrance.from(accents, {
          opacity: 0, clipPath: 'inset(0 100% 0 0)', duration: 0.42,
          ease: 'power2.out', stagger: { amount: 0.18 },
        }, 0.15);
      }
    }, element);

    return () => context.revert();
  }, [applyToSection, content, preset, reduceMotion, speed]);

  if (!style) return null;

  const family = typography.family ?? style.family;
  const accentFamily = typography.accentFamily ?? style.accentFamily;

  return (
    <div
      className={`lyric-text lyric-${preset}${applyToSection ? ' lyric-section' : ''}`}
      ref={root}
      style={applyToSection ? {
        fontFamily: '"' + family + '", system-ui, sans-serif',
        fontWeight: family === style.family ? style.weight : 400,
      } : undefined}
    >
      {content.map((line, index) => (
        <div className="lyric-line" key={index}>
          {line.map(({ text, accented }, fragment) => accented ? (
            <span
              className="lyric-accent"
              key={fragment}
              style={{
                fontFamily: '"' + accentFamily + '", system-ui, sans-serif',
                fontWeight: accentFamily === style.accentFamily ? style.accentWeight : 400,
                fontSize: (typography.accentScale ?? style.accentScale) + 'em',
                color: typography.accentColor ?? style.accentColor,
              }}
            >
              {text}
              {preset === 'handwritten' && (
                <span className="lyric-ink" aria-hidden="true"><i /><i /></span>
              )}
            </span>
          ) : text)}
        </div>
      ))}
    </div>
  );
}
