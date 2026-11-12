import { dot, polygon, sample, TAU, wash, wrap, type Scene } from './drawing';

export const origamiWind: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#6d7cff', 0.08, 0.15, 0.57);
  wash(frame, accent, 0.93, 0.79, 0.46);

  for (let lane = 0; lane < 11; lane++) {
    ctx.beginPath();
    for (let x = -16; x <= w + 16; x += 16) {
      const y = h * (0.13 + lane * 0.073) + Math.sin(x / w * 6.5 + lane * 0.25 - t * 2.6) * (12 + lane * 1.9);
      if (x === -16) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.globalAlpha = lane % 3 === 0 ? 0.27 : 0.11;
    ctx.strokeStyle = lane % 2 ? '#a8c6ff' : accent;
    ctx.lineWidth = lane % 3 === 0 ? 2 : 0.8;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (let i = 0; i < 18; i++) {
    const direction = i % 3 === 0 ? -1 : 1;
    const x = wrap(sample(i, 1) * (w + 240) + t * (68 + sample(i, 5) * 92) * direction, w + 240) - 120;
    const lane = i % 2 ? 0.64 + sample(i, 3) * 0.31 : 0.05 + sample(i, 3) * 0.32;
    const y = h * lane + Math.sin(t * 2.5 + i * 0.8) * 25;
    const size = 16 + sample(i, 2) * 48;
    const flap = Math.sin(t * (6.1 + sample(i, 6) * 2.5) + i) * 0.57;
    const paper = [accent, '#a5b5ff', '#fdbade', '#b5ffed'][i % 4];

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size * direction, size);
    ctx.rotate(Math.sin(t * 2.2 + i) * 0.18 - 0.14);
    polygon(ctx, [[-1.4, 0.21], [-0.68, 0.07], [0.38, 0.27], [-0.02, 0.54]], '#100e36', 0.42);
    polygon(ctx, [[-0.64, 0.09], [-1.27, -0.21], [-0.99, 0.22], [-0.28, 0.34]], '#7f83cc');
    polygon(ctx, [[-0.62, 0.11], [-0.38, -0.87 - flap], [0.17, 0.19]], paper, 0.9);
    polygon(ctx, [[-0.64, 0.09], [0.03, 0.31], [0.63, -0.14], [0.95, -0.02], [0.41, 0.04]], '#fff1da', 0.92);
    polygon(ctx, [[-0.61, 0.13], [0.05, 0.42], [0.76, 0.54 + flap], [0.18, 0.11]], paper);
    ctx.strokeStyle = '#fff2e6';
    ctx.globalAlpha = 0.44;
    ctx.lineWidth = 0.023;
    ctx.beginPath();
    ctx.moveTo(-0.57, 0.14);
    ctx.lineTo(0.56, 0.43 + flap * 0.8);
    ctx.stroke();
    ctx.restore();
  }
};

export const citrusFizz: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#6cecc5', 0.19, 0.83, 0.5);
  wash(frame, '#fa7175', 0.95, 0.11, 0.48);
  for (let i = 0; i < 66; i++) {
    const r = 1.4 + sample(i, 0) * 9;
    const x = sample(i, 4) * w + Math.sin(t * 2.6 + i) * (8 + r);
    const y = h + 24 - wrap(sample(i, 2) * (h + 48) + t * (24 + r * 7), h + 48);
    dot(ctx, x, y, r, i % 3 ? '#cafdf4' : accent, 0.12 + r / 70);
    dot(ctx, x - r * 0.26, y - r * 0.3, r * 0.28, '#ffffff', 0.29);
  }

  for (let i = 0; i < 14; i++) {
    const r = 22 + sample(i, 8) * 47;
    const side = i % 2;
    const x = w * (side ? 0.73 + sample(i, 7) * 0.31 : -0.04 + sample(i, 7) * 0.31) + Math.sin(t * 2.4 + i) * 29;
    const y = h + 90 - wrap(sample(i, 2) * (h + 180) + t * (54 + r), h + 180);
    const rind = [accent, '#ff7b83', '#bde963'][i % 3];
    const flesh = ['#ff9c3c', '#fc506a', '#86cb52'][i % 3];

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.85 + Math.sin(t * 2.2 + i) * 0.13, 1);
    ctx.rotate(t * (i % 2 ? -0.9 : 0.8) + i);
    dot(ctx, 5, 8, r + 3, '#0b2f36', 0.52);
    dot(ctx, 0, 0, r, rind);
    dot(ctx, 0, 0, r * 0.88, '#fff1c9');
    ctx.fillStyle = flesh;
    for (let segment = 0; segment < 9; segment++) {
      const a = segment * TAU / 9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a + 0.3) * 3, Math.sin(a + 0.3) * 3);
      ctx.arc(0, 0, r * 0.79, a + 0.05, a + TAU / 9 - 0.05);
      ctx.closePath();
      ctx.fill();
      dot(ctx, Math.cos(a + 0.4) * r * 0.58, Math.sin(a + 0.4) * r * 0.58, 1.6, '#fff3bf', 0.5);
      ctx.fillStyle = flesh;
    }
    dot(ctx, -r * 0.3, -r * 0.35, r * 0.22, '#fff9dd', 0.14);
    ctx.restore();
  }
};

export const springGarden: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#9be36d', 0.1, 0.91, 0.48);
  wash(frame, '#cf7ab2', 0.95, 0.12, 0.54);
  for (let i = 0; i < 45; i++) {
    const x = wrap(sample(i, 3) * (w + 20) + t * (10 + sample(i, 6) * 23), w + 20) - 10;
    const y = h * (i % 2 ? 0.08 + sample(i, 4) * 0.2 : 0.72 + sample(i, 4) * 0.22) + Math.sin(t * 2 + i) * 12;
    dot(ctx, x, y, 1.2 + sample(i) * 3.5, i % 2 ? '#ffedaa' : '#d2f78c', 0.24);
  }
  for (let i = 0; i < 25; i++) {
    const top = i >= 16;
    const x = (i % (top ? 9 : 16)) / (top ? 8 : 15) * w + (sample(i, 2) - 0.5) * 46;
    const boundary = top ? -24 : h + 25;
    const direction = top ? 1 : -1;
    const wave = t * (2.8 + sample(i, 3)) + i * 0.59;
    const length = (70 + sample(i, 6) * 111) * (top ? 0.68 : 1);
    const dx = Math.sin(wave) * 23;
    const endY = boundary + direction * length;
    const endX = x + dx;
    ctx.strokeStyle = top ? '#59a58a' : '#66c196';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(x, boundary);
    ctx.quadraticCurveTo(x - dx * 0.45, boundary + direction * length * 0.52, endX, endY);
    ctx.stroke();

    for (let leaf = 1; leaf < 4; leaf++) {
      const leafX = x + dx * leaf / 6;
      const leafY = boundary + direction * length * leaf / 4.5;
      ctx.save();
      ctx.translate(leafX, leafY);
      ctx.rotate((leaf % 2 ? 1 : -1) * 0.75 + Math.sin(wave + leaf) * 0.22 + (top ? Math.PI : 0));
      ctx.fillStyle = leaf % 2 ? '#5fa87b' : '#a5cf71';
      ctx.beginPath();
      ctx.ellipse(0, -11, 5.4, 15, 0.1, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    const petalColor = [accent, '#ffd67b', '#a5e4ad', '#ceaeff'][i % 4];
    const radius = (13 + sample(i, 7) * 20) * (0.82 + 0.17 * Math.sin(wave * 1.4));
    for (let petal = 0; petal < 6; petal++) {
      const a = petal * TAU / 6 + wave * 0.21;
      ctx.fillStyle = petalColor;
      ctx.beginPath();
      ctx.ellipse(endX + Math.cos(a) * radius * 0.69, endY + Math.sin(a) * radius * 0.69, radius * 0.67, radius * 0.34, a, 0, TAU);
      ctx.fill();
    }
    dot(ctx, endX, endY, radius * 0.32, '#ffe3a5');
    dot(ctx, endX, endY, radius * 0.15, '#693d59', 0.83);
  }
};

export const fishSchool: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#4fcfd1', 0.74, 0.11, 0.55);
  wash(frame, '#655dce', 0.04, 0.83, 0.51);

  for (let i = 0; i < 12; i++) {
    const x = i / 11 * w;
    const stem = 50 + sample(i, 5) * 94;
    for (let j = 0; j < 3; j++) {
      const dx = Math.sin(t * 2.5 + i * 0.4 + j) * 27;
      ctx.strokeStyle = j % 2 ? '#3b8d94' : '#526f9d';
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 4 + j * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + j * 9, h + 12);
      ctx.bezierCurveTo(x - 14, h - stem * 0.3, x + dx, h - stem * 0.68, x + dx + j * 7, h - stem - j * 8);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  for (let school = 0; school < 4; school++) {
    const direction = school % 2 === 0 ? 1 : -1;
    const size = 12 + school * 5.5;
    const speed = 50 + school * 38;
    const palette = ['#77cdeb', '#aaf8db', accent, '#ff9eb4'];
    for (let i = 0; i < 22; i++) {
      const x = wrap(i / 22 * (w + 190) + school * 104 + t * speed * direction, w + 190) - 95;
      const y = h * (0.17 + school * 0.18) + Math.sin(x / w * 6 + t * 2.6 + school) * (14 + school * 5) + (sample(i, school) - 0.5) * 59;
      const r = size * (0.55 + sample(i, 4) * 0.9);
      const tail = Math.sin(t * (8 + school) + i * 1.7) * 0.39;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(r * direction, r);
      ctx.rotate(Math.sin(t * 2.6 + x * 0.013) * 0.15);
      polygon(ctx, [[-0.61, 0], [-1.3 - tail, -0.35], [-1.19, 0.01], [-1.3 - tail, 0.35]], palette[school], 0.66);
      ctx.fillStyle = palette[school];
      ctx.globalAlpha = 0.55 + school * 0.12;
      ctx.beginPath();
      ctx.moveTo(-0.69, 0);
      ctx.quadraticCurveTo(-0.06, -0.68, 0.76, 0);
      ctx.quadraticCurveTo(0.06, 0.66, -0.69, 0);
      ctx.fill();
      ctx.globalAlpha = 1;
      polygon(ctx, [[-0.19, -0.14], [0.23, -0.18], [-0.2, -0.42]], '#f3fbf6', 0.34);
      dot(ctx, 0.42, -0.045, 0.067, '#162949', 0.81);
      ctx.restore();
    }
  }
};
