import { useEffect, useRef } from 'react';
import type { OverlayEffectConfig } from '../types';

interface Props {
  config: OverlayEffectConfig;
}

/**
 * Capa de partículas en canvas 2D transparente que se dibuja SOBRE el fondo.
 * Sirve para añadir lluvia, nieve, estrellas, bokeh, confeti o brasas a
 * cualquier fondo (imagen, gradiente o fondo animado).
 */
const DEFAULT_EMOJIS = ['🌴', '🌺', '🥥', '☀️', '🌊'];

export function OverlayEffect({ config }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { preset, color, intensity } = config;
  const emojisKey = (config.emojis ?? []).join('|');

  useEffect(() => {
    if (preset === 'none') return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    const resize = () => {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const dens = Math.max(0.05, Math.min(1, intensity));
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      a: number;
      rot: number;
      vr: number;
      hue: number;
      phase: number;
      glyph: string;
    };

    const emojiSet =
      preset === 'emojis' && config.emojis && config.emojis.length
        ? config.emojis
        : DEFAULT_EMOJIS;

    function make(): P {
      return {
        x: rand(0, W || 1280),
        y: rand(0, H || 720),
        vx: 0,
        vy: 0,
        r: 1,
        a: rand(0.4, 1),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.1, 0.1),
        hue: rand(0, 360),
        phase: rand(0, Math.PI * 2),
        glyph: emojiSet[Math.floor(Math.random() * emojiSet.length)],
      };
    }

    const counts: Record<string, number> = {
      rain: 260,
      snow: 160,
      stars: 220,
      bokeh: 60,
      confetti: 180,
      embers: 90,
      emojis: 26,
    };
    const N = Math.round((counts[preset] ?? 120) * dens);
    const parts: P[] = Array.from({ length: N }, () => {
      const p = make();
      if (preset === 'rain') {
        p.vy = rand(700, 1100);
        p.vx = rand(-80, -40);
        p.r = rand(8, 18); // longitud de la gota
        p.a = rand(0.2, 0.55);
      } else if (preset === 'snow') {
        p.vy = rand(30, 80);
        p.r = rand(1.5, 4);
        p.a = rand(0.5, 0.95);
      } else if (preset === 'stars') {
        p.r = rand(0.6, 1.8);
      } else if (preset === 'bokeh') {
        p.vy = rand(-25, -8);
        p.r = rand(14, 46);
        p.a = rand(0.05, 0.22);
      } else if (preset === 'confetti') {
        p.vy = rand(90, 180);
        p.vx = rand(-40, 40);
        p.r = rand(4, 8);
        p.a = rand(0.7, 1);
      } else if (preset === 'embers') {
        p.vy = rand(-70, -30);
        p.vx = rand(-20, 20);
        p.r = rand(1.5, 3.5);
        p.a = rand(0.4, 0.9);
      } else if (preset === 'emojis') {
        p.vy = rand(18, 45); // caen suavemente
        p.vx = rand(-12, 12);
        p.r = rand(24, 52); // tamaño de la fuente (px)
        p.a = rand(0.75, 1);
        p.vr = rand(-0.5, 0.5);
      }
      return p;
    });

    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, W, H);

      for (const p of parts) {
        switch (preset) {
          case 'rain': {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.y > H) { p.y = -20; p.x = rand(0, W); }
            if (p.x < -20) p.x = W + 20;
            ctx.strokeStyle = color;
            ctx.globalAlpha = p.a;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.vx * 0.02, p.y + p.r);
            ctx.stroke();
            break;
          }
          case 'snow': {
            p.phase += dt * 2;
            p.x += Math.sin(p.phase) * 0.6;
            p.y += p.vy * dt;
            if (p.y > H) { p.y = -10; p.x = rand(0, W); }
            ctx.fillStyle = color;
            ctx.globalAlpha = p.a;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 'stars': {
            p.phase += dt * rand(1.5, 3.0);
            const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(p.phase));
            ctx.fillStyle = color;
            ctx.globalAlpha = p.a * tw;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 'bokeh': {
            p.y += p.vy * dt;
            p.x += Math.sin(p.phase + now * 0.0003) * 0.4;
            if (p.y < -50) { p.y = H + 50; p.x = rand(0, W); }
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            g.addColorStop(0, color);
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.globalAlpha = p.a;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 'confetti': {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rot += p.vr;
            if (p.y > H + 10) { p.y = -10; p.x = rand(0, W); }
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = p.a;
            ctx.fillStyle = `hsl(${p.hue}, 85%, 60%)`;
            ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
            ctx.restore();
            break;
          }
          case 'embers': {
            p.phase += dt * 2;
            p.x += Math.sin(p.phase) * 0.5 + p.vx * dt * 0.2;
            p.y += p.vy * dt;
            if (p.y < -20) { p.y = H + 20; p.x = rand(0, W); }
            ctx.fillStyle = color;
            ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.phase));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 'emojis': {
            p.phase += dt;
            p.x += Math.sin(p.phase * 1.5) * 0.6 + p.vx * dt;
            p.y += p.vy * dt;
            p.rot += p.vr * dt;
            if (p.y > H + 60) { p.y = -60; p.x = rand(0, W); }
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = p.a;
            ctx.font = `${p.r}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.glyph, 0, 0);
            ctx.restore();
            break;
          }
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    if (reduced) {
      draw(performance.now()); // un frame estático
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, color, intensity, emojisKey]);

  if (preset === 'none') return null;
  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
