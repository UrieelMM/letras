import { dot, polygon, sample, TAU, wash, wrap, type Scene } from './drawing';

export const graceRain: Scene = (frame) => {
  const { ctx, w, h, t, accent, base } = frame;
  wash(frame, '#6f9cff', 0.06, 0.18, 0.6);
  wash(frame, accent, 0.93, 0.78, 0.51);
  const ground = h * 0.69;
  const water = ctx.createLinearGradient(0, ground, 0, h);
  water.addColorStop(0, 'transparent');
  water.addColorStop(1, base);
  ctx.fillStyle = water;
  ctx.fillRect(0, ground, w, h - ground);

  for (let layer = 0; layer < 3; layer++) {
    ctx.beginPath();
    for (let i = 0; i < 38; i++) {
      const id = layer * 38 + i;
      const depth = 0.58 + sample(id, 7) * 0.42;
      const length = 11 + depth * (13 + layer * 13);
      const floor = ground + (h - ground) * sample(id, 4);
      const period = floor + length + 28;
      const distance = wrap(sample(id, 3) * period + t * (151 + layer * 102) * depth, period);
      const y = distance - 26;
      const x = sample(id, 5) * (w + 136) - 96 + y * 0.15;
      if (y > floor) {
        const splash = (y - floor) / (length + 2);
        if (splash < 1) {
          ctx.moveTo(x + splash * 19, floor);
          ctx.ellipse(x, floor, splash * 19, splash * 5.5, 0, 0, TAU);
        }
      } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x - length * 0.15, y - length);
      }
    }
    ctx.strokeStyle = layer === 2 ? accent : '#b7cefb';
    ctx.lineWidth = 0.7 + layer * 0.67;
    ctx.globalAlpha = 0.19 + layer * 0.18;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (let i = 0; i < 15; i++) {
    const cycle = wrap(t * (0.71 + sample(i, 2) * 0.36) + sample(i, 6));
    const x = w * sample(i, 1);
    const y = ground + (h - ground) * sample(i, 4);
    const radius = 4 + cycle * (29 + sample(i, 8) * 27);
    ctx.strokeStyle = i % 3 ? accent : '#dacdff';
    ctx.lineWidth = 1.3;
    ctx.globalAlpha = Math.sin(cycle * Math.PI) * 0.32;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.22, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};

export const hopeSunrise: Scene = (frame) => {
  const { ctx, w, h, t, accent, base } = frame;
  const horizon = h * 0.7;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, base);
  sky.addColorStop(0.6, '#805484');
  sky.addColorStop(0.83, '#e38e7a');
  sky.addColorStop(1, '#693e65');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const sunX = w * (0.81 + Math.sin(t * 0.18) * 0.027);
  const sunY = horizon - 38 - Math.sin(t * 0.53) * 15;
  const radius = 62 + Math.sin(t * 1.8) * 6;
  wash(frame, accent, sunX / w, sunY / h, 0.71);
  dot(ctx, sunX, sunY, radius * 1.33, accent, 0.17);
  dot(ctx, sunX, sunY, radius, accent, 0.85);
  dot(ctx, sunX - 9, sunY - 12, radius * 0.62, '#fff0be', 0.51);

  for (let i = 0; i < 9; i++) {
    const a = -2.95 + i * 0.31 + Math.sin(t * 0.9 + i) * 0.12;
    const reach = h * (0.52 + sample(i, 1) * 0.42);
    polygon(ctx, [
      [sunX, sunY],
      [sunX + Math.cos(a - 0.027) * reach, sunY + Math.sin(a - 0.027) * reach],
      [sunX + Math.cos(a + 0.06) * reach, sunY + Math.sin(a + 0.06) * reach],
    ], accent, 0.07 + (1 + Math.sin(t * 2.1 - i)) * 0.033);
  }

  for (let layer = 0; layer < 3; layer++) {
    ctx.beginPath();
    ctx.moveTo(-24, h + 1);
    for (let x = -24; x <= w + 24; x += 16) {
      const y = horizon + layer * 39
        + Math.sin(x / w * (4 + layer) + t * (0.38 + layer * 0.2)) * (18 + layer * 8)
        + Math.sin(x / w * 14 - t * 0.54) * 7;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w + 24, h + 1);
    ctx.closePath();
    ctx.fillStyle = ['#82527d', '#523957', '#342e4c'][layer];
    ctx.fill();
  }

  for (let i = 0; i < 12; i++) {
    const x = wrap(sample(i, 9) * (w + 260) + t * (16 + sample(i, 2) * 35), w + 260) - 130;
    const y = h * (0.07 + sample(i, 1) * 0.35);
    const width = 43 + sample(i, 3) * 80;
    ctx.fillStyle = i % 2 ? '#ffc8b7' : '#bfb2e4';
    ctx.globalAlpha = 0.17;
    ctx.beginPath();
    ctx.ellipse(x, y, width, 3.5 + sample(i, 6) * 7, -0.05, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

export const goldenWheat: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#b37781', 0.09, 0.13, 0.65);
  wash(frame, '#f1aa59', 0.92, 0.87, 0.52);

  for (let layer = 0; layer < 3; layer++) {
    const count = Math.max(10, Math.round(w / 41));
    const palette = ['#9d718d', '#ce916a', accent];
    for (let i = 0; i < count; i++) {
      const id = i + layer * 47;
      const x = (i + 0.28 + layer * 0.31) / count * w;
      const height = 79 + layer * 31 + sample(id, 1) * (58 + layer * 25);
      const ground = h + 30;
      const wave = t * (2.5 + layer * 0.32) - x / 103 + layer;
      const gust = Math.sin(wave) * (14 + layer * 11) + Math.sin(wave * 0.49) * 9;
      const tipX = x + gust;
      const tipY = ground - height;
      const color = palette[layer];
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.44 + layer * 0.17;
      ctx.lineWidth = 1.25 + layer * 0.51;
      ctx.beginPath();
      ctx.moveTo(x, ground);
      ctx.quadraticCurveTo(x - gust * 0.17, ground - height * 0.55, tipX, tipY);
      ctx.stroke();
      ctx.save();
      ctx.translate(tipX, tipY + 8);
      ctx.rotate(gust / height * 1.5);
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let grain = 0; grain < 8; grain++) {
        const side = grain % 2 ? 1 : -1;
        const y = -13 + grain * (3.3 + layer * 0.7);
        const px = side * (3.2 + layer * 0.83);
        ctx.moveTo(px + 2, y);
        ctx.ellipse(px, y, 2 + layer * 0.35, 5 + layer * 0.83, side * 0.72, 0, TAU);
      }
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;

  for (let i = 0; i < 28; i++) {
    const x = wrap(sample(i, 4) * (w + 32) + t * (22 + sample(i, 8) * 32), w + 32) - 16;
    const y = h * (0.18 + sample(i, 2) * 0.65) + Math.sin(t * 2 + i) * 14;
    dot(ctx, x, y, 0.9 + sample(i, 3) * 2.5, accent, 0.18 + sample(i, 5) * 0.26);
  }
};

export const glorySky: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#7b6df2', 0.91, 0.13, 0.61);
  wash(frame, '#e58dc5', 0.12, 0.9, 0.42);

  for (let i = 0; i < 94; i++) {
    const near = i % 3 === 0;
    const x = wrap(sample(i, 1) * (w + 26) + t * (near ? 12 : 4), w + 26) - 13;
    const y = sample(i, 4) * h + Math.sin(t * 0.8 + i) * 7;
    const pulse = 0.63 + Math.sin(t * (1.3 + sample(i, 3)) + i) * 0.32;
    const size = (0.7 + sample(i, 6) * 2.15) * (near ? 1.4 : 1);
    dot(ctx, x, y, size, near ? accent : '#f8c9ea', pulse * 0.73);
    if (near && i % 9 === 0) {
      ctx.strokeStyle = accent;
      ctx.globalAlpha = pulse * 0.5;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(x - size * 2.5, y);
      ctx.lineTo(x + size * 2.5, y);
      ctx.moveTo(x, y - size * 2.5);
      ctx.lineTo(x, y + size * 2.5);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  for (let trail = 0; trail < 5; trail++) {
    const progress = wrap(t * (0.32 + trail * 0.021) + trail * 0.224);
    const span = w + 300;
    const x = progress * span - 145;
    const y = h * (0.13 + trail * 0.158) + Math.sin(progress * 6 + trail) * 40;
    const head = trail % 2 ? '#f8c9ea' : accent;
    const fade = Math.sin(progress * Math.PI);
    const line = ctx.createLinearGradient(x - 150, y + 31, x, y);
    line.addColorStop(0, 'transparent');
    line.addColorStop(1, head);
    ctx.beginPath();
    ctx.moveTo(x - 151, y + 31);
    ctx.quadraticCurveTo(x - 62, y + 5, x, y);
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.8 + trail * 0.25;
    ctx.globalAlpha = fade * 0.63;
    ctx.stroke();
    ctx.globalAlpha = 1;
    dot(ctx, x, y, 2.7, '#fff2e1', fade);
  }
};

export const hopeCandles: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#a76089', 0.05, 0.82, 0.6);
  wash(frame, '#bb7157', 0.96, 0.85, 0.44);
  for (let i = 0; i < 11; i++) {
    const side = i % 2 === 0;
    const x = w * (side ? 0.03 + sample(i, 4) * 0.29 : 0.7 + sample(i, 4) * 0.27);
    const y = h * (0.72 + sample(i, 7) * 0.28);
    const size = 0.62 + sample(i, 3) * 0.75;
    const phase = t * 4.2 + i * 1.7;
    const flame = Math.sin(phase) * 4 + Math.sin(phase * 1.48) * 2;
    const flameHeight = 22 + Math.sin(phase * 0.79) * 5;
    const flameY = y - 13 * size;

    const halo = ctx.createRadialGradient(x, flameY - 7, 1, x, flameY - 7, 68 * size);
    halo.addColorStop(0, accent);
    halo.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.26 + Math.sin(phase * 0.8) * 0.045;
    ctx.fillStyle = halo;
    ctx.fillRect(x - 72 * size, flameY - 80 * size, 144 * size, 150 * size);
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    const wax = ctx.createLinearGradient(-12, 0, 13, 0);
    wax.addColorStop(0, '#87566a');
    wax.addColorStop(0.5, '#f1b499');
    wax.addColorStop(1, '#936581');
    ctx.fillStyle = wax;
    ctx.fillRect(-12, 0, 25, 135);
    ctx.fillStyle = '#f4c29c';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12.5, 4.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#342338';
    ctx.fillRect(-1, -8, 2, 9);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.bezierCurveTo(-15, -9, flame - 6, -flameHeight * 0.61, flame, -flameHeight - 10);
    ctx.bezierCurveTo(flame + 3, -flameHeight * 0.67, 14, -10, 0, -6);
    ctx.fillStyle = accent;
    ctx.fill();
    dot(ctx, 0, -12, 3.6, '#fff2c1', 0.92);
    ctx.restore();

    for (let ember = 0; ember < 3; ember++) {
      const rise = wrap(t * (0.7 + ember * 0.13) + i * 0.17 + ember * 0.32);
      const glowX = x + Math.sin(phase * 0.72 + rise * 4 + ember) * rise * 22;
      const glowY = flameY - 22 - rise * 67 * size;
      dot(ctx, glowX, glowY, (2.7 - rise * 1.5) * size, accent, Math.sin(rise * Math.PI) * 0.43);
    }
  }
};
