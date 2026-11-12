import { useEffect, useRef } from 'react';
import type { KineticBackgroundPreset } from '../lib/kineticBackgrounds';
import { drawFrame, type Scene } from './kinetic/drawing';
import { citrusFizz, fishSchool, origamiWind, springGarden } from './kinetic/nature';
import { gearWorkshop, magneticBlocks, popPrint } from './kinetic/studio';
import { livingMap, movingPrisms, trainWindow } from './kinetic/worlds';

const SCENES: Record<KineticBackgroundPreset, Scene> = {
  origamiWind,
  citrusFizz,
  popPrint,
  springGarden,
  magneticBlocks,
  trainWindow,
  movingPrisms,
  gearWorkshop,
  fishSchool,
  livingMap,
};

const SCENE_HEIGHT = 540;

export function KineticBackground({ preset, colorA, colorB }: {
  preset: KineticBackgroundPreset;
  colorA: string;
  colorB: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !ctx) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scene = SCENES[preset];
    let visible = true;
    let frameId = 0;
    let lastFrame: number | null = null;
    let time = 0.8;
    let logicalWidth = 0;

    function render() {
      if (!ctx || !logicalWidth) return;
      drawFrame(scene, { ctx, w: logicalWidth, h: SCENE_HEIGHT, t: time, accent: colorA, base: colorB });
    }

    function frame(now: number) {
      time += lastFrame === null ? 0 : Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      render();
      frameId = requestAnimationFrame(frame);
    }

    function updatePlayback() {
      cancelAnimationFrame(frameId);
      lastFrame = null;
      if (visible && !document.hidden && !motionPreference.matches) {
        frameId = requestAnimationFrame(frame);
      } else {
        render();
      }
    }

    function resize() {
      if (!canvas || !ctx) return;
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      const density = Math.min(window.devicePixelRatio || 1, 1.5, 1920 / w, 1080 / h);
      canvas.width = Math.max(1, Math.round(w * density));
      canvas.height = Math.max(1, Math.round(h * density));
      logicalWidth = SCENE_HEIGHT * w / h;
      ctx.setTransform(canvas.width / logicalWidth, 0, 0, canvas.height / SCENE_HEIGHT, 0, 0);
      render();
    }

    const sizeObserver = new ResizeObserver(resize);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    });
    sizeObserver.observe(canvas);
    visibilityObserver.observe(canvas);
    document.addEventListener('visibilitychange', updatePlayback);
    motionPreference.addEventListener('change', updatePlayback);
    resize();
    updatePlayback();

    return () => {
      cancelAnimationFrame(frameId);
      sizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', updatePlayback);
      motionPreference.removeEventListener('change', updatePlayback);
    };
  }, [preset, colorA, colorB]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block h-full w-full"
      style={{ backgroundColor: colorB }}
      data-kinetic-background={preset}
      aria-hidden="true"
    />
  );
}
