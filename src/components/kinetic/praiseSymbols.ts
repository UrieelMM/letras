import { dot, polygon, sample, TAU, wash, wrap, type Scene } from './drawing';

function hand(ctx: CanvasRenderingContext2D, color: string) {
  ctx.beginPath();
  ctx.moveTo(-0.37, 0.79);
  ctx.lineTo(-0.49, 0.35);
  ctx.quadraticCurveTo(-0.63, 0.12, -0.72, -0.12);
  ctx.quadraticCurveTo(-0.77, -0.33, -0.6, -0.31);
  ctx.quadraticCurveTo(-0.46, -0.29, -0.39, -0.04);
  ctx.lineTo(-0.31, -0.78);
  ctx.quadraticCurveTo(-0.23, -0.98, -0.1, -0.77);
  ctx.lineTo(-0.08, -0.99);
  ctx.quadraticCurveTo(0.03, -1.17, 0.15, -0.99);
  ctx.lineTo(0.17, -0.88);
  ctx.quadraticCurveTo(0.31, -1.05, 0.4, -0.84);
  ctx.lineTo(0.39, -0.66);
  ctx.quadraticCurveTo(0.51, -0.81, 0.59, -0.64);
  ctx.quadraticCurveTo(0.58, 0.14, 0.37, 0.44);
  ctx.lineTo(0.35, 0.82);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 0.023;
  ctx.strokeStyle = '#ffd9ae';
  ctx.globalAlpha = 0.59;
  ctx.beginPath();
  ctx.moveTo(-0.34, 0.31);
  ctx.quadraticCurveTo(-0.19, 0.02, 0.07, -0.04);
  ctx.moveTo(-0.09, -0.78);
  ctx.lineTo(-0.12, -0.34);
  ctx.moveTo(0.17, -0.84);
  ctx.lineTo(0.15, -0.39);
  ctx.moveTo(0.39, -0.64);
  ctx.lineTo(0.33, -0.29);
  ctx.stroke();
  ctx.globalAlpha = 1;
  polygon(ctx, [[-0.38, 0.58], [0.35, 0.6], [0.32, 0.96], [-0.35, 0.94]], '#65395d');
  polygon(ctx, [[-0.37, 0.64], [0.35, 0.66], [0.34, 0.73], [-0.36, 0.71]], '#f5af94', 0.82);
}

export const jubilantHands: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#d65f94', 0.05, 0.82, 0.67);
  wash(frame, '#7f79e7', 0.97, 0.19, 0.58);

  for (let i = 0; i < 4; i++) {
    const cx = w * [0.16, 0.84, 0.085, 0.925][i];
    const cy = h * [0.72, 0.34, 0.27, 0.79][i];
    const size = Math.min(1, w / 710) * [57, 62, 35, 36][i];
    const beat = wrap(t * (1.42 + i * 0.055) + i * 0.26);
    const contact = Math.pow(0.5 + 0.5 * Math.cos(beat * TAU), 5);
    const angle = (0.44 + (1 - contact) * 0.52);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(cx + side * size * (0.6 + (1 - contact) * 0.63), cy);
      ctx.rotate(-side * angle);
      ctx.scale(-side * size, size);
      hand(ctx, side < 0 ? accent : (i % 2 ? '#f792ad' : '#d97e82'));
      ctx.restore();
    }
    const flash = beat < 0.28 ? Math.sin(beat / 0.28 * Math.PI) : 0;
    ctx.globalAlpha = flash * 0.69;
    ctx.strokeStyle = i % 2 ? '#ffd1e7' : '#ffe8a8';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let ray = 0; ray < 5; ray++) {
      const a = -2.8 + ray * 0.59;
      const radius = size * (0.26 + beat);
      const x = cx + Math.cos(a) * radius;
      const y = cy - size * 0.86 + Math.sin(a) * radius;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * (6 + size * 0.17), y + Math.sin(a) * (6 + size * 0.17));
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
};

function tambourine(ctx: CanvasRenderingContext2D, accent: string) {
  dot(ctx, 0.07, 0.16, 1, '#33192f', 0.79);
  dot(ctx, 0, 0.07, 1, '#bb6447');
  dot(ctx, 0, 0, 1, '#f3ab64');
  dot(ctx, 0, 0, 0.89, '#9a4b48');
  const membrane = ctx.createRadialGradient(-0.31, -0.27, 0, 0, 0, 0.9);
  membrane.addColorStop(0, '#fff0b9');
  membrane.addColorStop(0.62, accent);
  membrane.addColorStop(1, '#ce8765');
  ctx.fillStyle = membrane;
  ctx.globalAlpha = 0.84;
  ctx.beginPath();
  ctx.arc(0, 0, 0.82, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  for (let pair = 0; pair < 6; pair++) {
    const angle = pair * TAU / 6;
    ctx.save();
    ctx.translate(Math.cos(angle) * 0.92, Math.sin(angle) * 0.92);
    ctx.rotate(angle);
    ctx.fillStyle = '#633649';
    ctx.fillRect(-0.1, -0.17, 0.22, 0.34);
    dot(ctx, -0.03, -0.063, 0.105, '#f7d0a4');
    dot(ctx, 0.04, 0.061, 0.103, '#f2edc0');
    dot(ctx, 0.049, 0.059, 0.023, '#a27865');
    ctx.restore();
  }
}

export const joyfulTambourine: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#ed7a5f', 0.1, 0.22, 0.64);
  wash(frame, '#cd6c9c', 0.91, 0.78, 0.56);
  for (let i = 0; i < 5; i++) {
    const cx = w * [0.1, 0.88, 0.22, 0.73, 0.93][i];
    const cy = h * [0.3, 0.66, 0.87, 0.14, 0.11][i];
    const radius = Math.min(1, w / 720) * [96, 92, 49, 38, 31][i];
    const rhythm = t * 8.8 + i * 2;
    const pulse = Math.pow(0.5 + Math.cos(rhythm) * 0.5, 6);
    const x = cx + Math.sin(t * 2.2 + i) * 17;
    const y = cy + Math.cos(t * 3.4 + i) * 13;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * (i % 2 ? -0.51 : 0.54) + Math.sin(rhythm) * 0.14);
    ctx.scale(radius * (0.7 + Math.sin(t * 2.7 + i) * 0.16), radius * (1 + pulse * 0.06));
    tambourine(ctx, accent);
    ctx.restore();

    for (let line = 0; line < 3; line++) {
      const length = radius * (0.79 + line * 0.16 + pulse * 0.15);
      ctx.beginPath();
      ctx.ellipse(x, y, length, length * 0.92, -0.2, 0.12 + i, 1.05 + i);
      ctx.strokeStyle = '#ffefb4';
      ctx.globalAlpha = pulse * (0.55 - line * 0.12);
      ctx.lineWidth = 1.9;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
};

export const victoryFlags: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#8287ee', 0.08, 0.1, 0.72);
  wash(frame, '#ec75a2', 0.93, 0.86, 0.55);
  const colors = [accent, '#ffcd86', '#8ee6ed', '#c7a5ff'];
  for (let i = 0; i < 8; i++) {
    const right = i % 2 === 0;
    const direction = right ? -1 : 1;
    const x = w * (right ? 0.95 - (i % 4) * 0.04 : 0.05 + (i % 4) * 0.04);
    const y = h * (i < 4 ? 0.13 + i * 0.058 : 0.52 + (i - 4) * 0.1);
    const length = Math.min(w * 0.32, 162 + sample(i, 3) * 89);
    const depth = 49 + sample(i, 2) * 51;
    const wave = t * (5.25 + sample(i, 7)) + i * 1.1;
    const cloth = (u: number) => y + Math.sin(u * 6 - wave) * u * (17 + i * 2.7);
    const shade = ctx.createLinearGradient(x, y, x + direction * length, y + depth);
    shade.addColorStop(0, colors[i % colors.length]);
    shade.addColorStop(0.48, colors[(i + 1) % colors.length]);
    shade.addColorStop(1, colors[i % colors.length]);

    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let point = 1; point <= 20; point++) {
      const u = point / 20;
      ctx.lineTo(x + direction * length * u, cloth(u));
    }
    ctx.lineTo(x + direction * length * 0.77, cloth(0.77) + depth * 0.46);
    ctx.lineTo(x + direction * length, cloth(1) + depth * 0.88);
    for (let point = 19; point >= 0; point--) {
      const u = point / 20;
      ctx.lineTo(x + direction * length * u, cloth(u) + depth * (1 - u * 0.12));
    }
    ctx.closePath();
    ctx.fillStyle = shade;
    ctx.globalAlpha = i < 4 ? 0.9 : 0.75;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#e8dcf8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x, y + depth * 1.75);
    ctx.stroke();
    dot(ctx, x, y - 9, 3.1, '#fbe9ae');
  }
};

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

export const gloryCrown: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#9d63d0', 0.92, 0.2, 0.57);
  wash(frame, '#d98583', 0.08, 0.84, 0.64);

  for (let i = 0; i < 5; i++) {
    const phase = t * (2.2 + i * 0.2) + i * 1.9;
    const size = Math.min(1, w / 740) * [74, 71, 42, 35, 29][i];
    const x = w * [0.13, 0.86, 0.22, 0.78, 0.1][i] + Math.sin(phase) * 29;
    const y = h * [0.77, 0.26, 0.18, 0.84, 0.47][i] + Math.cos(phase) * 21;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(phase * 0.81) * 0.24);
    ctx.scale(size, size);
    polygon(ctx, [[-0.82, 0.48], [-1.01, -0.43], [-0.51, -0.11], [0, -0.74], [0.52, -0.11], [1.02, -0.43], [0.83, 0.48]], '#885a71', 0.72);
    polygon(ctx, [[-0.86, 0.37], [-1.04, -0.57], [-0.53, -0.22], [0, -0.88], [0.51, -0.23], [1.01, -0.57], [0.79, 0.37]], accent);
    polygon(ctx, [[-0.7, 0.25], [-0.48, -0.04], [0, -0.49], [0.45, -0.04], [0.67, 0.25]], '#e5a65b');
    polygon(ctx, [[-0.82, 0.25], [0.8, 0.25], [0.78, 0.4], [-0.8, 0.4]], '#fff0b4');
    for (let j = -1; j <= 1; j++) {
      const gx = j * 0.44;
      polygon(ctx, [[gx, -0.15], [gx + 0.11, 0.02], [gx, 0.19], [gx - 0.11, 0.02]], j ? '#e695a5' : '#8767b4');
    }
    dot(ctx, 0, -0.86, 0.09, '#fff5cc');
    ctx.restore();
  }

  for (let i = 0; i < 45; i++) {
    const rise = wrap(sample(i, 2) + t * (0.27 + sample(i, 8) * 0.29));
    const x = w * (i % 2 ? sample(i, 4) * 0.29 : 0.71 + sample(i, 4) * 0.29) + Math.sin(rise * 7 + i) * 25;
    const y = h + 20 - rise * (h + 40);
    dot(ctx, x, y, 1.1 + sample(i, 9) * 2.4, i % 3 ? accent : '#f6b9cb', Math.sin(rise * Math.PI) * 0.58);
  }
};
