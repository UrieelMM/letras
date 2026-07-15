import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import type { LiveState, TransitionPreset } from '../types';
import { Background } from './Background';
import { GsapText } from './GsapText';
import { OverlayEffect } from './OverlayEffect';
import { loadFont } from '../lib/fonts';
import appLogo from '../assets/3.png';

interface Props {
  live: LiveState;
  /** escala el tamaño de fuente (1 = pantalla completa; <1 para previews) */
  scale?: number;
}

const VARIANTS: Record<TransitionPreset, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  crossfade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -40 },
  },
  slideHorizontal: {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.04 },
  },
  blurIn: {
    initial: { opacity: 0, filter: 'blur(14px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(14px)' },
  },
  slideDown: {
    initial: { opacity: 0, y: -40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 40 },
  },
  slideLeft: {
    initial: { opacity: 0, x: -60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 60 },
  },
  zoomIn: {
    initial: { opacity: 0, scale: 0.7 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.7 },
  },
  zoomOut: {
    initial: { opacity: 0, scale: 1.3 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.3 },
  },
  flipX: {
    initial: { opacity: 0, rotateX: 90, transformPerspective: 700 },
    animate: { opacity: 1, rotateX: 0, transformPerspective: 700 },
    exit: { opacity: 0, rotateX: -90, transformPerspective: 700 },
  },
  flipY: {
    initial: { opacity: 0, rotateY: 90, transformPerspective: 700 },
    animate: { opacity: 1, rotateY: 0, transformPerspective: 700 },
    exit: { opacity: 0, rotateY: -90, transformPerspective: 700 },
  },
  rotateIn: {
    initial: { opacity: 0, rotate: -12, scale: 0.9 },
    animate: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: 12, scale: 0.9 },
  },
  blurScale: {
    initial: { opacity: 0, scale: 1.12, filter: 'blur(12px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 1.12, filter: 'blur(12px)' },
  },
  skewIn: {
    initial: { opacity: 0, skewX: 12, x: 40 },
    animate: { opacity: 1, skewX: 0, x: 0 },
    exit: { opacity: 0, skewX: -12, x: -40 },
  },
  riseScale: {
    initial: { opacity: 0, y: 60, scale: 0.92 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -60, scale: 1.04 },
  },
};

function originFor(align: string, vAlign: string): string {
  const x = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';
  const y = vAlign === 'top' ? 'top' : vAlign === 'bottom' ? 'bottom' : 'center';
  return `${x} ${y}`;
}

export function SlideStage({ live, scale = 1 }: Props) {
  const { theme, slide, blackout, showLogo, logoUrl, clearText } = live;
  const t = theme.transition;

  // Carga la tipografia del tema desde Google Fonts (en esta ventana).
  useEffect(() => {
    loadFont(theme.font.family);
  }, [theme.font.family]);

  // Auto-ajuste: encoge la fuente para que el texto quepa sin cortarse.
  const autoFit = theme.autoFit !== false; // activado por defecto
  const fitContainerRef = useRef<HTMLDivElement>(null);
  const textNodeRef = useRef<HTMLDivElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const [fitScale, setFitScale] = useState(1);

  const measure = useCallback(() => {
    if (!autoFit) {
      setFitScale(1);
      return;
    }
    const c = fitContainerRef.current;
    const node = textNodeRef.current;
    if (!c || !node) return;
    const cw = c.clientWidth;
    const ch = c.clientHeight;
    // Las transformaciones no afectan scrollWidth/Height: la medida es estable.
    const tw = node.scrollWidth;
    const th = node.scrollHeight;
    if (!cw || !ch || !tw || !th) return;
    const fit = Math.min(cw / tw, ch / th, 1);
    setFitScale(fit > 0 && isFinite(fit) ? fit : 1);
  }, [autoFit]);

  // Callback ref: mide cuando el nodo del slide se monta (evita el desfase de
  // AnimatePresence) y vuelve a medir en resize o al cargar la fuente.
  const setTextNode = useCallback(
    (node: HTMLDivElement | null) => {
      textNodeRef.current = node;
      if (roRef.current) {
        roRef.current.disconnect();
        roRef.current = null;
      }
      if (node) {
        measure();
        const ro = new ResizeObserver(() => measure());
        ro.observe(node);
        if (fitContainerRef.current) ro.observe(fitContainerRef.current);
        roRef.current = ro;
        document.fonts?.ready.then(measure).catch(() => {});
      }
    },
    [measure],
  );

  const justify =
    theme.vAlign === 'top'
      ? 'flex-start'
      : theme.vAlign === 'bottom'
        ? 'flex-end'
        : 'center';
  const align =
    theme.alignment === 'left'
      ? 'flex-start'
      : theme.alignment === 'right'
        ? 'flex-end'
        : 'center';

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Fondo */}
      {!blackout && <Background bg={theme.background} />}

      {/* Capa de contraste para legibilidad sobre imagenes/fondos */}
      {!blackout && theme.contrast.overlayOpacity > 0 && (
        <div
          className="absolute inset-0"
          style={{
            background: theme.contrast.overlayColor,
            opacity: theme.contrast.overlayOpacity,
            backdropFilter: theme.contrast.blurPx
              ? `blur(${theme.contrast.blurPx}px)`
              : undefined,
          }}
        />
      )}

      {/* Efecto animado superpuesto (lluvia, nieve, estrellas...) */}
      {!blackout && theme.overlay && theme.overlay.preset !== 'none' && (
        <OverlayEffect config={theme.overlay} />
      )}

      {/* Blackout */}
      {blackout && <div className="absolute inset-0 bg-black" />}

      {/* Logo */}
      <AnimatePresence>
        {showLogo && !blackout && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="flex items-center justify-center gap-5">
              <img
                src={logoUrl || appLogo}
                alt={logoUrl ? 'Logo de la organización' : 'Wordship Screen'}
                className="object-contain drop-shadow-2xl"
                style={{
                  maxWidth: `${(logoUrl ? 48 : 16) * scale}vw`,
                  maxHeight: `${(logoUrl ? 48 : 32) * scale}vh`,
                }}
              />
              {!logoUrl && (
                <span
                  className="flex flex-col font-extrabold leading-[0.88] tracking-[-0.05em] text-white text-shadow-strong"
                  style={{ fontSize: `${4 * scale}vw` }}
                >
                  <span>Wordship</span>
                  <span>Screen</span>
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Texto del slide */}
      {!blackout && !showLogo && !clearText && (
        <div className="absolute inset-0" style={{ padding: `${6 * scale}%` }}>
          <div
            ref={fitContainerRef}
            className="flex h-full w-full"
            style={{ justifyContent: align, alignItems: justify }}
          >
            <AnimatePresence mode="wait">
              {slide && (
                <motion.div
                  key={slide.id}
                  className="w-full"
                  variants={VARIANTS[t]}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <div
                    ref={setTextNode}
                    style={{
                      fontFamily: `'${theme.font.family}', system-ui, sans-serif`,
                      fontWeight: theme.font.weight,
                      fontSize: `${theme.font.sizeVw * scale}vw`,
                      lineHeight: theme.font.lineHeight,
                      letterSpacing: `${theme.font.letterSpacing}px`,
                      color: theme.color.text,
                      textTransform: theme.uppercase ? 'uppercase' : 'none',
                      textAlign: theme.alignment,
                      textAlignLast: theme.alignment === 'justify' ? 'justify' : 'auto',
                      width: '100%',
                      whiteSpace: 'normal',
                      overflowWrap: 'normal',
                      wordBreak: 'normal',
                      transform: `scale(${fitScale})`,
                      transformOrigin: originFor(theme.alignment, theme.vAlign),
                    }}
                    className={theme.color.shadow ? 'text-shadow-strong' : ''}
                  >
                    <GsapText
                      key={`${slide.id}-${theme.textReveal}-${theme.textMotion ?? 'none'}-${theme.rainbowText ? 1 : 0}`}
                      lines={slide.lines}
                      reveal={theme.textReveal ?? 'wordsUp'}
                      motion={theme.textMotion ?? 'none'}
                      rainbow={theme.rainbowText}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
