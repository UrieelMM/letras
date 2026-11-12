export const TAU = Math.PI * 2;

export interface SceneFrame {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  t: number;
  accent: string;
  base: string;
}

export type Scene = (frame: SceneFrame) => void;
type Point = [number, number];

export function wrap(value: number, period = 1): number {
  return ((value % period) + period) % period;
}

export function sample(index: number, salt = 0): number {
  return wrap(Math.sin(index * 78.233 + salt * 37.719 + 1.3) * 43758.5453);
}

export function polygon(ctx: CanvasRenderingContext2D, points: Point[], color: string, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(...points[i]);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function wash(frame: SceneFrame, color: string, x: number, y: number, strength = 0.35) {
  const { ctx, w, h } = frame;
  const gradient = ctx.createRadialGradient(w * x, h * y, 0, w * x, h * y, Math.max(w, h) * 0.66);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'transparent');
  ctx.globalAlpha = strength;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}

export function drawFrame(scene: Scene, frame: SceneFrame) {
  const { ctx, w, h, base } = frame;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  scene(frame);

  // Los detalles de los bordes conservan el brillo. El centro deja espacio para la letra.
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(w * 0.68, h * 0.78);
  const contrast = ctx.createRadialGradient(0, 0, 0.12, 0, 0, 0.97);
  contrast.addColorStop(0, 'rgba(5, 8, 22, 0.52)');
  contrast.addColorStop(0.57, 'rgba(5, 8, 22, 0.19)');
  contrast.addColorStop(1, 'transparent');
  ctx.fillStyle = contrast;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}
