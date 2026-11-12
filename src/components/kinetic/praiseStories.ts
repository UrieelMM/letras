import { dot, sample, wash, wrap, type Scene } from './drawing';

function flame(ctx: CanvasRenderingContext2D, x: number, y: number, height: number, width: number, curl: number, color: string, alpha: number) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - width, y - height * 0.25, x + curl * 0.48 - width * 0.42, y - height * 0.61, x + curl, y - height);
  ctx.bezierCurveTo(x + curl * 1.07 + width * 0.06, y - height * 0.57, x + width * 0.96, y - height * 0.29, x, y);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export const pentecostFire: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#c65a59', 0.03, 0.82, 0.68);
  wash(frame, '#e78359', 0.97, 0.72, 0.55);
  for (let i = 0; i < 24; i++) {
    const right = i % 2 === 0;
    const x = w * (right ? 0.67 + sample(i, 2) * 0.34 : sample(i, 2) * 0.33);
    const phase = t * (4.5 + sample(i, 5) * 3.2) + i * 0.89;
    const y = h + 9 + Math.sin(phase * 0.7) * 13;
    const height = (72 + sample(i, 6) * 159) * (0.82 + Math.sin(phase) * 0.19);
    const width = 16 + sample(i, 3) * 39;
    const curl = Math.sin(phase) * 30 + Math.cos(phase * 1.42) * 16;
    flame(ctx, x, y, height, width, curl, i % 3 ? '#e77a79' : '#bc5d8b', 0.48);
    flame(ctx, x + width * 0.12, y, height * 0.74, width * 0.63, curl * 0.64, accent, 0.81);
    flame(ctx, x, y + 5, height * 0.47, width * 0.31, curl * 0.37, '#fff0b3', 0.64);
  }

  for (let i = 0; i < 59; i++) {
    const rise = wrap(sample(i, 6) + t * (0.56 + sample(i, 4) * 0.56));
    const x = w * (i % 2 ? sample(i, 7) * 0.31 : 0.69 + sample(i, 7) * 0.31) + Math.sin(rise * 7 + i) * 27;
    const y = h - rise * (172 + sample(i, 8) * 271);
    const alpha = Math.sin(rise * Math.PI) * 0.73;
    dot(ctx, x, y, 1 + sample(i, 9) * 3.3 * (1 - rise), i % 3 ? accent : '#fff0bd', alpha);
  }
};
