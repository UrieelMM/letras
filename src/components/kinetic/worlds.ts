import { dot, polygon, sample, TAU, wash, wrap, type Scene } from './drawing';

export const trainWindow: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, frame.base);
  sky.addColorStop(0.54, '#9b4d83');
  sky.addColorStop(1, accent);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const sunX = w * (0.83 + Math.sin(t * 0.1) * 0.035);
  const sunY = h * 0.28;
  wash(frame, '#ffc887', sunX / w, 0.24, 0.4);
  dot(ctx, sunX, sunY, 58, '#ffd6a4', 0.79);
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, 58, 0, TAU);
  ctx.clip();
  for (let y = -58; y < 60; y += 11) {
    ctx.fillStyle = 'rgba(190,99,124,0.28)';
    ctx.fillRect(sunX - 60, sunY + y + Math.sin(t * 0.9 + y) * 2, 120, 3.5);
  }
  ctx.restore();

  const ridges = [
    { base: 0.56, span: 143, height: 102, speed: 30, color: '#70548b' },
    { base: 0.71, span: 111, height: 90, speed: 62, color: '#493767' },
    { base: 0.86, span: 76, height: 75, speed: 105, color: '#304b6a' },
    { base: 0.94, span: 64, height: 43, speed: 172, color: '#244453' },
  ];
  for (const [index, ridge] of ridges.entries()) {
    ctx.fillStyle = ridge.color;
    ctx.beginPath();
    ctx.moveTo(-ridge.span * 2, h + 1);
    const shift = t * ridge.speed;
    const first = Math.floor(shift / ridge.span) - 1;
    for (let col = first; col <= first + Math.ceil(w / ridge.span) + 3; col++) {
      const x = col * ridge.span - shift;
      const height = ridge.height * (0.24 + sample(wrap(col, 127), index) * 0.76);
      ctx.lineTo(x, h * ridge.base - height);
    }
    ctx.lineTo(w + ridge.span * 2, h + 1);
    ctx.closePath();
    ctx.fill();
  }

  for (let i = 0; i < 22; i++) {
    const x = wrap(i / 22 * (w + 170) - t * (i % 2 ? 225 : 305), w + 170) - 85;
    const height = 24 + sample(i, 6) * 55;
    const y = h * (0.89 + sample(i, 1) * 0.14);
    if (i % 5 === 0) {
      ctx.fillStyle = '#fda873';
      ctx.fillRect(x - 13, y - height * 0.49, 28, height * 0.49);
      polygon(ctx, [[x - 18, y - height * 0.49], [x + 1, y - height * 0.82], [x + 19, y - height * 0.49]], '#322d52');
      dot(ctx, x - 2, y - height * 0.27, 3, '#fff0b5');
    } else {
      polygon(ctx, [[x - height * 0.27, y], [x + Math.sin(t * 5 + i) * 4, y - height], [x + height * 0.29, y]], i % 2 ? '#6caa94' : '#488181');
    }
  }

  for (let i = 0; i < 8; i++) {
    const x = wrap(sample(i, 1) * (w + 280) - t * 245, w + 280) - 140;
    const y = i < 3 ? h * (0.09 + i * 0.025) : h * (0.87 + (i - 3) * 0.027);
    ctx.fillStyle = i < 3 ? 'rgba(255,211,162,0.21)' : 'rgba(255,189,140,0.42)';
    ctx.fillRect(x, y, 50 + sample(i, 6) * 112, i < 3 ? 1.2 : 2.8);
  }
};

export const movingPrisms: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#7268ec', 0.07, 0.61, 0.61);
  wash(frame, '#d175c2', 0.9, 0.22, 0.47);
  const facets = [accent, '#c8a7ff', '#fb98bc', '#83f2d7', '#ffcd82'];

  for (let i = 0; i < 12; i++) {
    const side = i % 2;
    const phase = t * (0.84 + sample(i, 7) * 0.55) + i * 0.8;
    const x = w * (side ? 0.73 + sample(i, 3) * 0.32 : -0.05 + sample(i, 3) * 0.33) + Math.sin(phase * 1.5) * 48;
    const y = h * (0.06 + sample(i, 4) * 0.88) + Math.cos(phase * 1.6) * 39;
    const r = 36 + sample(i, 2) * 68;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(phase);
    const squash = 0.64 + Math.abs(Math.sin(phase * 0.79)) * 0.36;
    ctx.scale(r * squash, r);

    for (let ray = 0; ray < 5; ray++) {
      const spread = (ray - 2) * 0.16;
      const beam = ctx.createLinearGradient(0.02, 0, 3.7, spread * 2);
      beam.addColorStop(0, facets[ray]);
      beam.addColorStop(1, 'transparent');
      polygon(ctx, [[0.07, -0.17], [3.65, spread * 2 - 0.17], [3.55, spread * 2 + 0.14], [0.05, 0.17]], facets[ray], 0.04);
      ctx.globalAlpha = 0.43;
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(0.23, -0.11);
      ctx.lineTo(3.4, spread * 2 - 0.09);
      ctx.lineTo(3.38, spread * 2 + 0.12);
      ctx.lineTo(0.19, 0.06);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const left = Math.sin(phase * 0.67) * 0.28;
    polygon(ctx, [[-0.96, 0.6], [0, -1], [0.93, 0.61]], '#161635', 0.82);
    polygon(ctx, [[-0.96, 0.6], [0, -1], [left, 0.18]], facets[i % 5], 0.84);
    polygon(ctx, [[0, -1], [0.93, 0.61], [left, 0.18]], facets[(i + 2) % 5], 0.56);
    polygon(ctx, [[0.93, 0.61], [-0.96, 0.6], [left, 0.18]], facets[(i + 3) % 5], 0.74);
    ctx.strokeStyle = '#fff7ec';
    ctx.lineWidth = 0.019;
    ctx.globalAlpha = 0.63;
    ctx.beginPath();
    ctx.moveTo(-0.96, 0.6);
    ctx.lineTo(0, -1);
    ctx.lineTo(0.93, 0.61);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
};

export const livingMap: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#6bc0a4', 0.12, 0.17, 0.48);
  wash(frame, '#e89162', 0.96, 0.86, 0.49);

  ctx.strokeStyle = 'rgba(181,220,174,0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 18; x < w; x += 36) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 16; y < h; y += 36) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  const hills = [
    { x: 0.08, y: 0.24, phase: 0.1, color: accent },
    { x: 0.95, y: 0.68, phase: 1.7, color: '#f7a779' },
    { x: 0.6, y: -0.1, phase: 3.2, color: '#88e5c4' },
    { x: 0.37, y: 1.13, phase: 5.4, color: '#9dcc80' },
  ];
  for (const hill of hills) {
    const cx = w * hill.x + Math.sin(t * 1.65 + hill.phase) * 32;
    const cy = h * hill.y + Math.cos(t * 1.25 + hill.phase) * 24;
    for (let ring = 0; ring < 15; ring++) {
      const radius = 19 + ring * 15;
      ctx.beginPath();
      for (let point = 0; point <= 68; point++) {
        const a = point / 68 * TAU;
        const ripple = 1 + 0.15 * Math.sin(a * 3 + t * 2.2 + hill.phase + ring * 0.13)
          + 0.085 * Math.cos(a * 5 - t * 1.8);
        const x = cx + Math.cos(a) * radius * ripple;
        const y = cy + Math.sin(a) * radius * ripple * 0.76;
        if (point === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.globalAlpha = ring % 4 === 0 ? 0.69 : 0.34;
      ctx.strokeStyle = hill.color;
      ctx.lineWidth = ring % 4 === 0 ? 2.5 : 1.15;
      ctx.stroke();
    }
  }

  for (let route = 0; route < 3; route++) {
    const xAt = (p: number) => w * p;
    const yAt = (p: number) => h * (0.21 + route * 0.29) + Math.sin(p * 8 + route + t * 0.87) * (24 + route * 7);
    ctx.beginPath();
    ctx.setLineDash([7, 8]);
    ctx.lineDashOffset = t * (route === 1 ? 49 : -49);
    for (let i = 0; i <= 60; i++) {
      const p = i / 60;
      if (i === 0) ctx.moveTo(xAt(p), yAt(p));
      else ctx.lineTo(xAt(p), yAt(p));
    }
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = route === 1 ? '#e3ffe4' : accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    for (let i = 0; i < 3; i++) {
      const p = wrap(t * (route === 1 ? -0.24 : 0.24) + i / 3 + route * 0.13, 1.14) - 0.07;
      const x = xAt(p);
      const y = yAt(p);
      dot(ctx, x, y, 11, route === 1 ? '#e3ffe4' : accent, 0.23);
      dot(ctx, x, y, 5, '#faf8cb');
      dot(ctx, x, y, 2, '#205356');
    }
  }
};
