import { Fragment, useLayoutEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { getLyricPreset, mergeEmphasis, splitLyricText } from '../lib/lyricTypography';
import type { LyricAnimationSpeed, LyricSelectionAnimation, LyricTypography, TextAnimationConfig } from '../types';
import { animateText, getTextUnits } from './gsapTextAnimation';
import { renderTextUnits, type TextUnits } from './textAnimationUnits';
import './lyric-text.css';

const SPEEDS: Record<LyricAnimationSpeed, number> = {
  off: 0,
  slow: 0.7,
  normal: 1,
  fast: 1.5,
};

interface Props {
  lines: string[];
  typography?: LyricTypography;
  selectionAnimations?: LyricSelectionAnimation[];
  reduceMotion: boolean;
  units?: TextUnits;
  rainbow?: boolean;
}

export function LyricText({ lines, typography, selectionAnimations, reduceMotion, units, rainbow }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const { preset, speed, emphasis, applyToSection } = typography ?? {};
  const style = getLyricPreset(typography);
  const highlights = mergeEmphasis(emphasis ?? []);
  const selections = [...(selectionAnimations ?? [])].sort((a, b) => a.start - b.start);
  const textKey = lines.join('\n');
  const accentKey = highlights.map(({ start, end }) => start + ':' + end).join(',');
  const selectionKey = selections.map(({ start, end }) => start + ':' + end).join(',');

  useLayoutEffect(() => {
    const element = root.current;
    if (!element || !preset || units || reduceMotion || speed === 'off') return;

    const context = gsap.context(() => {
      const lineNodes = element.querySelectorAll('.lyric-line');
      const outsideSelections = (selector: string) => Array.from(element.querySelectorAll(selector))
        .filter((node) => !node.closest('[data-selection-animation]'));
      const accents = outsideSelections('.lyric-accent');
      const ink = outsideSelections('.lyric-ink i');
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
  }, [applyToSection, textKey, accentKey, selectionKey, preset, reduceMotion, speed, units]);

  const family = typography?.family ?? style?.family;
  const accentFamily = typography?.accentFamily ?? style?.accentFamily;
  const accentRainbow = !style && rainbow;
  let offset = 0;

  return (
    <div
      className={style ? `lyric-text lyric-${preset}${applyToSection ? ' lyric-section' : ''}` : undefined}
      ref={root}
      style={style && applyToSection ? {
        fontFamily: '"' + family + '", system-ui, sans-serif',
        fontWeight: family === style.family ? style.weight : 400,
      } : undefined}
    >
      {lines.map((line, index) => {
        const groups = splitLyricText(line, offset, selections);
        offset += line.length + 1;
        return (
          <div className={`lyric-line g-line ${accentRainbow && units === 'lines' ? 'g-rainbow' : ''}`} key={index}>
            {groups.map((group) => {
              const animation = group.range?.animation;
              const groupUnits = animation ? getTextUnits(animation) : units ?? 'lines';
              const content = splitLyricText(group.text, group.start, highlights).map(({ text, start, range }) => {
                if (!range || !style) {
                  return <Fragment key={start}>{renderTextUnits(text, groupUnits, accentRainbow)}</Fragment>;
                }
                const singleWord = groupUnits === 'words' && !/\s/u.test(text);
                return (
                  <span
                    className={singleWord ? 'lyric-accent g-word' : 'lyric-accent'}
                    key={start}
                    style={{
                      fontFamily: '"' + accentFamily + '", system-ui, sans-serif',
                      fontWeight: accentFamily === style.accentFamily ? style.accentWeight : 400,
                      fontSize: (typography?.accentScale ?? style.accentScale) + 'em',
                      color: typography?.accentColor ?? style.accentColor,
                    }}
                  >
                    {singleWord ? text : renderTextUnits(text, groupUnits)}
                    {preset === 'handwritten' && (
                      <span className="lyric-ink" aria-hidden="true"><i /><i /></span>
                    )}
                  </span>
                );
              });
              return animation ? (
                <AnimatedSelection
                  key={group.start}
                  animation={animation}
                  reduceMotion={reduceMotion}
                  layoutKey={group.text + ':' + accentKey}
                >
                  {content}
                </AnimatedSelection>
              ) : <Fragment key={group.start}>{content}</Fragment>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function AnimatedSelection({ animation, reduceMotion, layoutKey, children }: {
  animation: TextAnimationConfig;
  reduceMotion: boolean;
  layoutKey: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reveal, motion, speed } = animation;
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reduceMotion) return;
    return animateText(root, { reveal, motion, speed }, true);
  }, [reveal, motion, speed, layoutKey, reduceMotion]);

  return (
    <span className="inline-block max-w-full" data-selection-animation ref={ref}>
      <span className="g-line g-motion inline-block max-w-full">{children}</span>
    </span>
  );
}
