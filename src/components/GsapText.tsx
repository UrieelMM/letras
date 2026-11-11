import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import type { LyricTypography, TextAnimationConfig, TextMotionPreset, TextRevealPreset } from '../types';
import { LyricText } from './LyricText';
import { renderTextUnits, type TextUnits } from './textAnimationUnits';

interface Props {
  lines: string[];
  animation: TextAnimationConfig;
  rainbow?: boolean;
  typography?: LyricTypography;
  reduceMotion: boolean;
}

type Q = (sel: string) => Element[];

const SPEED = { slow: 0.7, normal: 1, fast: 1.45 };

const LETTER_REVEALS = new Set<TextRevealPreset>([
  'charsUp', 'typewriter', 'dance', 'zoomIn', 'dropIn', 'glitch', 'waveText', 'foldLetters',
]);

const WORD_REVEALS = new Set<TextRevealPreset>([
  'wordsUp', 'bounce', 'pop', 'fromLeft', 'fromRight', 'flip', 'blurWords', 'swing', 'impact',
]);

export function GsapText({ lines, animation, rainbow, typography, reduceMotion }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { reveal, motion, speed } = animation;
  const units: TextUnits = LETTER_REVEALS.has(reveal) ? 'letters'
    : WORD_REVEALS.has(reveal) || motion === 'wordFlow' || motion === 'wordPulse' ? 'words'
    : 'lines';
  const lineRainbow = rainbow && units === 'lines';

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reduceMotion) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root) as Q;
      const rate = SPEED[speed] ?? 1;
      const entrance = gsap.timeline().timeScale(rate);
      if (reveal !== 'none') {
        buildReveal(entrance, reveal, q, root);
        const ink = q('.lyric-ink');
        if (ink.length && (LETTER_REVEALS.has(reveal) || WORD_REVEALS.has(reveal))) {
          entrance.from(ink, { opacity: 0, duration: 0.22 }, Math.max(0, entrance.duration() - 0.16));
        }
      }

      const delay = Math.max(0.6, entrance.totalDuration() / rate + 0.12);
      if (motion !== 'none') {
        buildMotion(motion, q, root, delay);
      } else if (reveal === 'dance') {
        gsap.to(q('.g-char'), {
          yPercent: -28, duration: 0.5, ease: 'sine.inOut', repeat: -1,
          yoyo: true, delay, stagger: { each: 0.06, from: 'start' },
        });
      }
    }, root);

    return () => ctx.revert();
  }, [lines, reveal, motion, speed, typography, reduceMotion]);

  return (
    <div ref={ref}>
      <div className="g-motion">
        {typography ? (
          <LyricText lines={lines} typography={typography} reduceMotion={reduceMotion} units={units} />
        ) : lines.map((line, index) => (
          <div
            key={index}
            className={`g-line ${lineRainbow ? 'g-rainbow' : ''}`}
            style={lineRainbow ? { animationDelay: `${index * 0.2}s` } : undefined}
          >
            {renderTextUnits(line || ' ', units, rainbow)}
          </div>
        ))}
      </div>
    </div>
  );
}

function buildReveal(timeline: gsap.core.Timeline, reveal: TextRevealPreset, q: Q, root: HTMLElement) {
  const ease = 'power3.out';
  switch (reveal) {
    case 'fade':
      timeline.from(root, { opacity: 0, scale: 0.96, duration: 0.7, ease: 'power2.out' });
      break;
    case 'linesUp':
      timeline.from(q('.g-line'), { yPercent: 110, opacity: 0, duration: 0.7, ease, stagger: 0.12 });
      break;
    case 'wordsUp':
      timeline.from(q('.g-word'), { yPercent: 120, opacity: 0, duration: 0.6, ease, stagger: 0.05 });
      break;
    case 'charsUp':
      timeline.from(q('.g-char'), {
        yPercent: 100,
        opacity: 0,
        filter: 'blur(8px)',
        duration: 0.5,
        ease,
        stagger: 0.018,
      });
      break;
    case 'typewriter':
      timeline.from(q('.g-char'), { opacity: 0, duration: 0.01, ease: 'none', stagger: 0.035 });
      break;
    case 'bounce':
      timeline.from(q('.g-word'), {
        y: '-120%',
        opacity: 0,
        duration: 0.9,
        ease: 'bounce.out',
        stagger: 0.08,
      });
      break;
    case 'pop':
      timeline.from(q('.g-word'), {
        scale: 0,
        opacity: 0,
        transformOrigin: 'center',
        duration: 0.6,
        ease: 'back.out(2.2)',
        stagger: 0.07,
      });
      break;
    case 'dance':
      timeline.from(q('.g-char'), {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        ease: 'back.out(2)',
        stagger: 0.03,
      });
      break;
    case 'fromLeft':
      timeline.from(q('.g-word'), { xPercent: -140, opacity: 0, duration: 0.6, ease, stagger: 0.05 });
      break;
    case 'fromRight':
      timeline.from(q('.g-word'), { xPercent: 140, opacity: 0, duration: 0.6, ease, stagger: 0.05 });
      break;
    case 'zoomIn':
      timeline.from(q('.g-char'), {
        scale: 2.6,
        opacity: 0,
        transformOrigin: 'center',
        duration: 0.5,
        ease: 'power3.out',
        stagger: 0.02,
      });
      break;
    case 'flip':
      timeline.from(q('.g-word'), {
        rotationX: 90,
        transformPerspective: 500,
        transformOrigin: 'center',
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.06,
      });
      break;
    case 'blurWords':
      timeline.from(q('.g-word'), {
        opacity: 0,
        filter: 'blur(12px)',
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.06,
      });
      break;
    case 'dropIn':
      timeline.from(q('.g-char'), {
        y: '-120%',
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: { each: 0.02, from: 'random' },
      });
      break;
    case 'swing':
      timeline.from(q('.g-word'), {
        rotation: -65,
        opacity: 0,
        transformOrigin: 'top center',
        duration: 0.7,
        ease: 'back.out(1.6)',
        stagger: 0.07,
      });
      break;
    case 'glitch':
      timeline.from(q('.g-char'), {
        x: () => gsap.utils.random(-24, 24),
        y: () => gsap.utils.random(-12, 12),
        opacity: 0,
        duration: 0.35,
        ease: 'power1.out',
        stagger: 0.02,
      });
      break;
    case 'waveText':
      timeline.from(q('.g-char'), {
        yPercent: 130,
        opacity: 0,
        duration: 0.6,
        ease: 'sine.out',
        stagger: { each: 0.04, from: 'start' },
      });
      break;
    case 'expand':
      timeline.from(root, {
        scaleX: 0.35,
        opacity: 0,
        transformOrigin: 'center',
        duration: 0.7,
        ease: 'power3.out',
      });
      break;
    case 'curtain':
      timeline.fromTo(q('.g-line'),
        { clipPath: 'inset(110% -15% -20% -15%)', yPercent: 12 },
        {
          clipPath: 'inset(-20% -15% -20% -15%)', yPercent: 0, duration: 0.56,
          clearProps: 'clipPath', ease, stagger: { amount: 0.26 },
        },
      );
      break;
    case 'impact':
      timeline.from(q('.g-word'), {
        scaleX: 1.42, scaleY: 0.42, yPercent: 28, opacity: 0,
        transformOrigin: 'center bottom', duration: 0.56, ease: 'back.out(1.8)',
        stagger: { amount: 0.35 },
      });
      break;
    case 'counterSlide':
      timeline.from(q('.g-line'), {
        xPercent: (index: number) => index % 2 === 0 ? -28 : 28,
        opacity: 0, duration: 0.53, ease, stagger: { amount: 0.24 },
      });
      break;
    case 'foldLetters':
      timeline.from(q('.g-char'), {
        rotationY: (index: number) => index % 2 === 0 ? -88 : 88,
        yPercent: 22, opacity: 0, transformPerspective: 450, transformOrigin: 'center bottom',
        duration: 0.58, ease, stagger: { amount: 0.38, from: 'center' },
      });
      break;
  }
}

/** Animación continua que se mantiene mientras el slide está visible. */
function buildMotion(motion: TextMotionPreset, q: Q, root: HTMLElement, delay: number) {
  const target = (q('.g-motion')[0] as HTMLElement) ?? root;
  const common = { repeat: -1, yoyo: true, ease: 'sine.inOut', delay } as const;

  switch (motion) {
    case 'float':
      gsap.to(target, { yPercent: -3.5, duration: 2.2, ...common });
      break;
    case 'sway':
      gsap.to(target, { rotation: 1.6, transformOrigin: 'center', duration: 2.6, ...common });
      break;
    case 'pulse':
      gsap.to(target, { scale: 1.035, transformOrigin: 'center', duration: 1.4, ...common });
      break;
    case 'breathe':
      gsap.to(target, { scale: 1.025, opacity: 0.88, transformOrigin: 'center', duration: 2.0, ...common });
      break;
    case 'glow':
      gsap.to(target, { opacity: 0.65, duration: 1.2, ...common });
      break;
    case 'wave': {
      const lines = q('.g-line');
      gsap.to(lines.length ? lines : [target], {
        yPercent: -4,
        duration: 1.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay,
        stagger: { each: 0.18, from: 'start' },
      });
      break;
    }
    case 'drift':
      gsap.fromTo(target, { x: -10 }, { x: 10, duration: 3.5, immediateRender: false, ...common });
      break;
    case 'tilt':
      gsap.fromTo(
        target,
        { rotationX: -6, transformPerspective: 600, transformOrigin: 'center' },
        { rotationX: 6, duration: 3, immediateRender: false, ...common },
      );
      break;
    case 'wobble':
      gsap.fromTo(
        target,
        { rotation: -2.5, transformOrigin: 'center' },
        { rotation: 2.5, duration: 2.2, immediateRender: false, ...common },
      );
      break;
    case 'heartbeat':
      gsap.to(target, {
        scale: 1.06,
        transformOrigin: 'center',
        duration: 0.25,
        repeat: -1,
        yoyo: true,
        repeatDelay: 0.7,
        ease: 'power2.inOut',
        delay,
      });
      break;
    case 'jelly':
      gsap.fromTo(
        target,
        { scaleX: 1.05, scaleY: 0.95, transformOrigin: 'center' },
        { scaleX: 0.95, scaleY: 1.05, duration: 1.6, immediateRender: false, ...common },
      );
      break;
    case 'orbit':
      gsap.fromTo(target, { x: -8 }, { x: 8, duration: 3, immediateRender: false, ...common });
      gsap.fromTo(target, { y: -8 }, { y: 8, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: delay + 0.75, immediateRender: false });
      break;
    case 'shimmer':
      gsap.to(target, { opacity: 0.65, duration: 1.0, ...common });
      break;
    case 'zoomSlow':
      gsap.fromTo(
        target,
        { scale: 0.95, transformOrigin: 'center' },
        { scale: 1.06, duration: 4, immediateRender: false, ...common },
      );
      break;
    case 'rippleText': {
      const units = pickUnits(q);
      gsap.to(units, {
        yPercent: -16,
        duration: 1.0,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay,
        stagger: { each: 0.06, from: 'start' },
      });
      break;
    }
    case 'bobUnits': {
      const units = pickUnits(q);
      gsap.fromTo(
        units,
        { yPercent: 5 },
        {
          yPercent: -5,
          immediateRender: false,
          duration: 1.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay,
          stagger: { each: 0.05, from: 'center' },
        },
      );
      break;
    }
    case 'wordFlow':
      gsap.to(q('.g-word'), {
        yPercent: -12, rotation: -1.8, duration: 0.7, repeatDelay: 0.42,
        ...common, stagger: { amount: 0.64 },
      });
      break;
    case 'wordPulse':
      gsap.to(q('.g-word'), {
        scale: 1.075, duration: 0.46, repeatDelay: 0.36,
        ...common, stagger: { amount: 0.58, from: 'center' },
      });
      break;
  }
}

/** Elige la unidad más pequeña disponible para animar (letras, palabras o líneas). */
function pickUnits(q: Q): Element[] {
  const chars = q('.g-char');
  if (chars.length) return chars;
  const words = q('.g-word');
  if (words.length) return words;
  return q('.g-line');
}
