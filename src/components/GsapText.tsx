import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import type { TextMotionPreset, TextRevealPreset } from '../types';

interface Props {
  lines: string[];
  reveal: TextRevealPreset;
  motion?: TextMotionPreset;
  rainbow?: boolean;
}

type Q = (sel: string) => Element[];

/**
 * Renderiza las líneas del slide y las anima con GSAP.
 * - reveal: animación de ENTRADA (una vez).
 * - motion: animación CONTINUA (se mantiene todo el tiempo).
 * Hace "split" manual en palabras/letras, sin plugins.
 */
export function GsapText({ lines, reveal, motion = 'none', rainbow }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const reduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root) as Q;

      // Entrada
      if (!reduced && reveal !== 'none') {
        buildReveal(reveal, q, root);
      } else {
        gsap.set(q('.g-line, .g-word, .g-char'), { opacity: 1, y: 0, filter: 'none' });
      }

      // Movimiento continuo (se mantiene siempre)
      if (!reduced && motion !== 'none') {
        buildMotion(motion, q, root);
      }
    }, ref);

    return () => ctx.revert();
  }, [lines, reveal, motion]);

  const useChars =
    reveal === 'charsUp' ||
    reveal === 'typewriter' ||
    reveal === 'dance' ||
    reveal === 'zoomIn' ||
    reveal === 'dropIn' ||
    reveal === 'glitch' ||
    reveal === 'waveText';
  const useWords =
    !useChars &&
    (reveal === 'wordsUp' ||
      reveal === 'bounce' ||
      reveal === 'pop' ||
      reveal === 'fromLeft' ||
      reveal === 'fromRight' ||
      reveal === 'flip' ||
      reveal === 'blurWords' ||
      reveal === 'swing');
  const lineRainbow = rainbow && !useChars && !useWords;

  return (
    <div ref={ref}>
      <div className="g-motion">
        {lines.map((line, li) => (
          <div
            key={li}
            className={`g-line ${lineRainbow ? 'g-rainbow' : ''}`}
            style={lineRainbow ? { animationDelay: `${li * 0.2}s` } : undefined}
          >
            {useChars ? splitChars(line, rainbow) : useWords ? splitWords(line, rainbow) : line || ' '}
          </div>
        ))}
      </div>
    </div>
  );
}

function buildReveal(reveal: TextRevealPreset, q: Q, root: HTMLElement) {
  const ease = 'power3.out';
  switch (reveal) {
    case 'fade':
      gsap.from(root, { opacity: 0, scale: 0.96, duration: 0.7, ease: 'power2.out' });
      break;
    case 'linesUp':
      gsap.from(q('.g-line'), { yPercent: 110, opacity: 0, duration: 0.7, ease, stagger: 0.12 });
      break;
    case 'wordsUp':
      gsap.from(q('.g-word'), { yPercent: 120, opacity: 0, duration: 0.6, ease, stagger: 0.05 });
      break;
    case 'charsUp':
      gsap.from(q('.g-char'), {
        yPercent: 100,
        opacity: 0,
        filter: 'blur(8px)',
        duration: 0.5,
        ease,
        stagger: 0.018,
      });
      break;
    case 'typewriter':
      gsap.from(q('.g-char'), { opacity: 0, duration: 0.01, ease: 'none', stagger: 0.035 });
      break;
    case 'bounce':
      gsap.from(q('.g-word'), {
        y: '-120%',
        opacity: 0,
        duration: 0.9,
        ease: 'bounce.out',
        stagger: 0.08,
      });
      break;
    case 'pop':
      gsap.from(q('.g-word'), {
        scale: 0,
        opacity: 0,
        transformOrigin: 'center',
        duration: 0.6,
        ease: 'back.out(2.2)',
        stagger: 0.07,
      });
      break;
    case 'dance':
      gsap.from(q('.g-char'), {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        ease: 'back.out(2)',
        stagger: 0.03,
      });
      gsap.to(q('.g-char'), {
        yPercent: -28,
        duration: 0.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: { each: 0.06, from: 'start' },
      });
      break;
    case 'fromLeft':
      gsap.from(q('.g-word'), { xPercent: -140, opacity: 0, duration: 0.6, ease, stagger: 0.05 });
      break;
    case 'fromRight':
      gsap.from(q('.g-word'), { xPercent: 140, opacity: 0, duration: 0.6, ease, stagger: 0.05 });
      break;
    case 'zoomIn':
      gsap.from(q('.g-char'), {
        scale: 2.6,
        opacity: 0,
        transformOrigin: 'center',
        duration: 0.5,
        ease: 'power3.out',
        stagger: 0.02,
      });
      break;
    case 'flip':
      gsap.from(q('.g-word'), {
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
      gsap.from(q('.g-word'), {
        opacity: 0,
        filter: 'blur(12px)',
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.06,
      });
      break;
    case 'dropIn':
      gsap.from(q('.g-char'), {
        y: '-120%',
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: { each: 0.02, from: 'random' },
      });
      break;
    case 'swing':
      gsap.from(q('.g-word'), {
        rotation: -65,
        opacity: 0,
        transformOrigin: 'top center',
        duration: 0.7,
        ease: 'back.out(1.6)',
        stagger: 0.07,
      });
      break;
    case 'glitch':
      gsap.from(q('.g-char'), {
        x: () => gsap.utils.random(-24, 24),
        y: () => gsap.utils.random(-12, 12),
        opacity: 0,
        duration: 0.35,
        ease: 'power1.out',
        stagger: 0.02,
      });
      break;
    case 'waveText':
      gsap.from(q('.g-char'), {
        yPercent: 130,
        opacity: 0,
        duration: 0.6,
        ease: 'sine.out',
        stagger: { each: 0.04, from: 'start' },
      });
      break;
    case 'expand':
      gsap.from(root, {
        scaleX: 0.35,
        opacity: 0,
        transformOrigin: 'center',
        duration: 0.7,
        ease: 'power3.out',
      });
      break;
  }
}

/** Animación continua que se mantiene mientras el slide está visible. */
function buildMotion(motion: TextMotionPreset, q: Q, root: HTMLElement) {
  const target = (q('.g-motion')[0] as HTMLElement) ?? root;
  const delay = 0.6; // deja que termine la entrada
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
        delay: 1.2,
        stagger: { each: 0.18, from: 'start' },
      });
      break;
    }
    case 'drift':
      gsap.fromTo(target, { x: -10 }, { x: 10, duration: 3.5, ...common });
      break;
    case 'tilt':
      gsap.fromTo(
        target,
        { rotationX: -6, transformPerspective: 600, transformOrigin: 'center' },
        { rotationX: 6, duration: 3, ...common },
      );
      break;
    case 'wobble':
      gsap.fromTo(
        target,
        { rotation: -2.5, transformOrigin: 'center' },
        { rotation: 2.5, duration: 2.2, ...common },
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
        { scaleX: 0.95, scaleY: 1.05, duration: 1.6, ...common },
      );
      break;
    case 'orbit':
      gsap.fromTo(target, { x: -8 }, { x: 8, duration: 3, ...common });
      gsap.fromTo(target, { y: -8 }, { y: 8, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: delay + 0.75 });
      break;
    case 'shimmer':
      gsap.to(target, { opacity: 0.65, duration: 1.0, ...common });
      break;
    case 'zoomSlow':
      gsap.fromTo(
        target,
        { scale: 0.95, transformOrigin: 'center' },
        { scale: 1.06, duration: 4, ...common },
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
        delay: 1.1,
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
          duration: 1.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 1.1,
          stagger: { each: 0.05, from: 'center' },
        },
      );
      break;
    }
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

function splitWords(line: string, rainbow?: boolean) {
  const words = line.split(' ').filter((w) => w.length > 0);
  // Palabras como inline-block (para transformaciones GSAP) separadas por un
  // espacio real, de modo que la alineación justificada pueda repartirlo.
  return words.flatMap((w, i) => {
    const span = (
      <span
        key={`w${i}`}
        className={`g-word ${rainbow ? 'g-rainbow' : ''}`}
        style={{ display: 'inline-block', animationDelay: rainbow ? `${i * 0.12}s` : undefined }}
      >
        {w}
      </span>
    );
    return i < words.length - 1 ? [span, ' '] : [span];
  });
}

function splitChars(line: string, rainbow?: boolean) {
  const words = line.split(' ').filter(Boolean);
  let charOffset = 0;

  return words.flatMap((word, wordIndex) => {
    const offset = charOffset;
    charOffset += word.length;
    const unit = (
      <span key={`word-${wordIndex}`} className="inline-block whitespace-nowrap">
        {Array.from(word).map((ch, charIndex) => (
          <span
            key={charIndex}
            className={`g-char ${rainbow ? 'g-rainbow' : ''}`}
            style={{
              display: 'inline-block',
              animationDelay: rainbow ? `${(offset + charIndex) * 0.06}s` : undefined,
            }}
          >
            {ch}
          </span>
        ))}
      </span>
    );
    return wordIndex < words.length - 1 ? [unit, ' '] : [unit];
  });
}
