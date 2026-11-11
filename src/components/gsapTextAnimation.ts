import gsap from 'gsap';
import type { TextAnimationConfig, TextMotionPreset, TextRevealPreset } from '../types';
import type { TextUnits } from './textAnimationUnits';

type Q = (sel: string) => Element[];

const SPEED = { slow: 0.7, normal: 1, fast: 1.45 };

const LETTER_REVEALS = new Set<TextRevealPreset>([
  'charsUp', 'typewriter', 'dance', 'zoomIn', 'dropIn', 'glitch', 'waveText', 'foldLetters', 'letterArc',
]);

const WORD_REVEALS = new Set<TextRevealPreset>([
  'wordsUp', 'bounce', 'pop', 'fromLeft', 'fromRight', 'flip', 'blurWords', 'swing', 'impact', 'snapTurn',
]);

const WORD_MOTIONS = new Set<TextMotionPreset>(['wordFlow', 'wordPulse', 'rollingWave']);

export function getTextUnits({ reveal, motion }: TextAnimationConfig): TextUnits {
  if (LETTER_REVEALS.has(reveal) || motion === 'letterTilt') return 'letters';
  if (WORD_REVEALS.has(reveal) || WORD_MOTIONS.has(motion)) return 'words';
  return 'lines';
}

export function animateText(root: HTMLElement, { reveal, motion, speed }: TextAnimationConfig, selection = false) {
  const ctx = gsap.context(() => {
    const q: Q = (selector) => Array.from(root.querySelectorAll(selector))
      .filter((node) => selection || !node.closest('[data-selection-animation]'));
    const rate = SPEED[speed] ?? 1;
    const entrance = gsap.timeline().timeScale(rate);
    const revealUnits = LETTER_REVEALS.has(reveal) ? '.g-char' : WORD_REVEALS.has(reveal) ? '.g-word' : null;
    if (reveal !== 'none' && (!revealUnits || q(revealUnits).length)) {
      buildReveal(entrance, reveal, q, root);
      const ink = q('.lyric-ink');
      if (ink.length && revealUnits) {
        entrance.from(ink, { opacity: 0, duration: 0.22 }, Math.max(0, entrance.duration() - 0.16));
      }
    }

    const delay = Math.max(0.6, entrance.totalDuration() / rate + 0.12);
    if (motion !== 'none') {
      const motionUnits = WORD_MOTIONS.has(motion) ? '.g-word' : motion === 'letterTilt' ? '.g-char' : null;
      if (!motionUnits || q(motionUnits).length) buildMotion(motion, q, root, delay);
    } else if (reveal === 'dance' && q('.g-char').length) {
      gsap.to(q('.g-char'), {
        yPercent: -28, duration: 0.5, ease: 'sine.inOut', repeat: -1,
        yoyo: true, delay, stagger: { each: 0.06, from: 'start' },
      });
    }
  }, root);
  return () => ctx.revert();
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
    case 'snapTurn':
      timeline.from(q('.g-word'), {
        xPercent: (index: number) => index % 2 === 0 ? -38 : 38,
        yPercent: 46, scale: 0.76, rotation: (index: number) => index % 2 === 0 ? -17 : 17,
        opacity: 0, transformOrigin: 'center bottom', duration: 0.61, ease: 'back.out(1.35)',
        stagger: { amount: 0.32 },
      });
      break;
    case 'focusZoom':
      timeline.fromTo(q('.g-line'),
        { scale: 1.38, yPercent: -24, opacity: 0, filter: 'blur(0.18em)' },
        {
          scale: 1, yPercent: 0, opacity: 1, filter: 'blur(0em)', clearProps: 'filter',
          duration: 0.68, ease: 'power3.out', stagger: { amount: 0.23 },
        },
      );
      break;
    case 'letterArc': {
      const letters = q('.g-char');
      timeline.from(letters, {
        rotation: (index: number) => letters.length > 1 ? (index / (letters.length - 1) - 0.5) * 76 : -22,
        yPercent: 65, scale: 0.78, opacity: 0, transformOrigin: 'center 125%',
        duration: 0.62, ease: 'back.out(1.25)', stagger: { amount: 0.42, from: 'center' },
      });
      break;
    }
    case 'sideWipe':
      timeline.fromTo(q('.g-line'),
        { clipPath: 'polygon(-18% -25%, -18% -25%, -38% 125%, -18% 125%)', xPercent: -9 },
        {
          clipPath: 'polygon(-18% -25%, 135% -25%, 115% 125%, -18% 125%)', xPercent: 0,
          clearProps: 'clipPath', duration: 0.63, ease, stagger: { amount: 0.24 },
        },
      );
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
    case 'doubleBeat':
      gsap.timeline({ delay, repeat: -1, repeatDelay: 2.1 })
        .to(target, { scale: 1.1, duration: 0.17, ease: 'power2.out' })
        .to(target, { scale: 1, duration: 0.22, ease: 'sine.inOut' })
        .to(target, { scale: 1.065, duration: 0.16, ease: 'power2.out' })
        .to(target, { scale: 1, duration: 0.34, ease: 'power2.out' });
      break;
    case 'pendulumArc':
      gsap.timeline({ delay, repeat: -1, repeatDelay: 0.9, defaults: { ease: 'sine.inOut' } })
        .to(target, { x: '0.22em', y: '-0.13em', rotationY: 9, rotation: 1.8, transformPerspective: 650, duration: 0.67 })
        .to(target, { x: '-0.22em', y: '-0.07em', rotationY: -9, rotation: -1.8, duration: 1.18 })
        .to(target, { x: 0, y: 0, rotationY: 0, rotation: 0, duration: 0.62 });
      break;
    case 'rollingWave':
      gsap.to(q('.g-word'), {
        keyframes: [
          { yPercent: -21, rotation: -4, duration: 0.23, ease: 'power2.out' },
          { yPercent: 0, rotation: 0, duration: 0.38, ease: 'power2.inOut' },
        ],
        stagger: { amount: 0.65 }, delay, repeat: -1, repeatDelay: 1.35,
      });
      break;
    case 'letterTilt':
      gsap.to(q('.g-char'), {
        transformPerspective: 500,
        keyframes: [
          { rotationX: 22, yPercent: -12, duration: 0.26, ease: 'power2.out' },
          { rotationX: 0, yPercent: 0, duration: 0.38, ease: 'sine.inOut' },
        ],
        stagger: { amount: 0.58, from: 'center' }, delay, repeat: -1, repeatDelay: 1.45,
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
