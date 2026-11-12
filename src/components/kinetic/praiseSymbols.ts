import { dot, sample, wash, wrap, type Scene } from './drawing';

export const paintedPsalm: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#c160d8', 0.08, 0.34, 0.56);
  wash(frame, '#7165e4', 0.94, 0.62, 0.65);
  const pigments = [accent, '#ffe3aa', '#b8b9ff', '#86ead7', '#ef83a1'];
  for (let i = 0; i < 14; i++) {
    const bottom = i % 2 === 1;
    const progress = wrap(t * (0.58 + sample(i, 5) * 0.24) + i * 0.137);
    const spread = Math.min(w * 0.58, 260 + sample(i, 9) * 185);
    const origin = wrap(sample(i, 6) * (w + 940) + t * (bottom ? -134 : 148), w + 940) - 470;
    const y = h * (bottom ? 0.68 + sample(i, 4) * 0.24 : 0.045 + sample(i, 4) * 0.25);
    const color = pigments[i % pigments.length];
    const thickness = 7 + sample(i, 3) * 22;
    const direction = bottom ? -1 : 1;
    const curve = (u: number) => y + direction * (Math.sin(u * 4 + i) * 32 + u * 34) + Math.sin(t * 2 + i) * 10;
    const widthAt = (u: number) => thickness * Math.pow(Math.max(0, Math.sin(u * Math.PI)), 0.7);
    const limit = Math.max(0.04, Math.min(1, progress / 0.55));
    ctx.beginPath();
    ctx.moveTo(origin, curve(0));
    for (let p = 1; p <= 24; p++) {
      const u = p / 24 * limit;
      ctx.lineTo(origin + spread * u, curve(u) - widthAt(u) * 0.5);
    }
    for (let p = 24; p >= 0; p--) {
      const u = p / 24 * limit;
      ctx.lineTo(origin + spread * u, curve(u) + widthAt(u) * 0.5);
    }
    ctx.closePath();
    ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.84;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff2d7';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(origin + spread * 0.11 * limit, curve(0.11 * limit));
    ctx.quadraticCurveTo(origin + spread * 0.42 * limit, curve(0.43 * limit) - 8, origin + spread * 0.88 * limit, curve(0.88 * limit));
    ctx.stroke();
    ctx.globalAlpha = 1;
    for (let fleck = 0; fleck < 5; fleck++) {
      const u = limit * (0.35 + sample(i * 5 + fleck, 4) * 0.65);
      const scatter = (fleck % 2 ? 1 : -1) * (widthAt(u) * 0.51 + 3 + fleck * 3);
      dot(ctx, origin + spread * u, curve(u) + scatter, 0.8 + sample(fleck, 2) * 1.1, color, Math.sin(progress * Math.PI) * 0.57);
    }
  }
};
