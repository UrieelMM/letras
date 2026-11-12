import { dot, polygon, sample, TAU, wash, wrap, type Scene } from './drawing';

export const popPrint: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#8a54d9', 0.06, 0.12, 0.7);
  wash(frame, '#337ccb', 0.91, 0.86, 0.54);
  const inks = ['#42e2ff', accent, '#ffe565'];

  for (let row = 0; row < 28; row++) {
    const y = row * 21 - 11;
    const edge = Math.max(0.12, Math.abs(y / h - 0.5) * 1.85);
    ctx.beginPath();
    for (let col = 0; col <= w / 22 + 1; col++) {
      const x = col * 22 + wrap(t * 24, 22) - 22;
      const wave = (1 + Math.sin(x * 0.014 + y * 0.027 - t * 4.1)) / 2;
      const radius = 0.8 + wave * edge * 5.7;
      ctx.moveTo(x + radius, y);
      ctx.arc(x, y, radius, 0, TAU);
    }
    ctx.globalAlpha = 0.12 + edge * 0.19;
    ctx.fillStyle = inks[(row + 1) % 3];
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (let side = 0; side < 2; side++) {
    const direction = side ? -1 : 1;
    const span = w + 360;
    for (let i = 0; i < 7; i++) {
      const x = wrap(i / 7 * span + t * 115 * direction + side * 145, span) - 180;
      const y = h * (side ? 0.82 : 0.19) + Math.sin(t * 3.9 + i) * 19;
      const color = inks[(i + side) % inks.length];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(direction * (0.28 + Math.sin(t * 2 + i) * 0.15));
      const pulse = 0.84 + 0.16 * Math.sin(t * 4 + i);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#1a1638';
      ctx.fillRect(-48, -35, 122, 87);
      ctx.fillStyle = color;
      ctx.fillRect(-56, -44, 115, 85);
      ctx.fillStyle = '#291943';
      if (i % 3 === 0) {
        ctx.fillRect(-43, -28, 26, 53);
        ctx.fillRect(-10, -28, 12, 53);
        ctx.fillRect(11, -28, 33, 53);
      } else if (i % 3 === 1) {
        for (let j = 0; j < 5; j++) ctx.fillRect(-45 + j * 19, -26 + j * 7, 13, 32);
      } else {
        polygon(ctx, [[-40, 25], [-4, -32], [19, 25], [6, 25], [-5, 2], [-22, 25]], '#291943');
        dot(ctx, 36, -10, 9, '#291943');
      }
      ctx.strokeStyle = '#fff7e3';
      ctx.lineWidth = 1.3;
      ctx.globalAlpha = 0.76;
      ctx.strokeRect(-62, -49, 115, 85);
      ctx.beginPath();
      ctx.moveTo(63, 35);
      ctx.lineTo(83, 35);
      ctx.moveTo(73, 25);
      ctx.lineTo(73, 45);
      ctx.stroke();
      ctx.restore();
    }
  }
};

const BLOCK_SHAPES = [
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
];

export const magneticBlocks: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#7e62ea', 0.12, 0.24, 0.75);
  wash(frame, '#3ea7b6', 0.88, 0.74, 0.58);

  ctx.strokeStyle = '#c1b0ff';
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 1;
  for (let x = wrap(t * 14, 31) - 31; x < w; x += 31) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 11; y < h; y += 31) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (let i = 0; i < 22; i++) {
    const side = i % 2;
    const direction = side ? 1 : -1;
    const duration = 2.7 + sample(i, 4) * 2;
    const cycle = t / duration + i * 0.34;
    const step = Math.floor(cycle);
    const phase = wrap(cycle);
    const lane = side ? 0.68 + sample(i, 5) * 0.31 : 0.04 + sample(i, 5) * 0.24;
    const unit = 15 + sample(i, 7) * 10;
    const landing = side ? h * (0.63 + sample(i, 8) * 0.29) : h * (0.04 + sample(i, 8) * 0.3);
    const fall = Math.min(1, phase / 0.67);
    const ease = fall * fall * (3 - 2 * fall);
    const bounce = phase > 0.67 ? Math.sin((phase - 0.67) * 44) * Math.exp(-(phase - 0.67) * 13) * 9 : 0;
    const x = w * lane + Math.sin((1 - ease) * 4 + i) * 27 * (1 - ease);
    const y = landing + direction * ((1 - ease) * h * 0.58 + bounce);
    const color = [accent, '#84e8de', '#ba9dff', '#ff7eac', '#ffe180'][wrap(i + step, 5)];
    const shape = BLOCK_SHAPES[wrap(i + step, BLOCK_SHAPES.length)];
    const angle = (i % 4) * Math.PI / 2 + (1 - ease) * direction * Math.PI * 0.8;
    const fade = Math.min(1, phase * 16, (1 - phase) * 12);

    if (phase > 0.67 && phase < 0.91) {
      const settle = (phase - 0.67) / 0.24;
      ctx.globalAlpha = Math.sin(settle * Math.PI) * 0.46;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(w * lane, landing, unit * (1.1 + settle * 1.3), 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = fade;
    for (const [col, row] of shape) {
      const px = (col - 1) * unit;
      const py = (row - 0.5) * unit;
      ctx.fillStyle = '#150e35';
      ctx.fillRect(px + 3, py + 5, unit - 1, unit - 1);
      ctx.fillStyle = color;
      ctx.fillRect(px, py, unit - 1, unit - 1);
      ctx.fillStyle = 'rgba(255,255,255,0.37)';
      ctx.fillRect(px + 2, py + 2, unit - 5, 2);
      ctx.fillRect(px + 2, py + 2, 2, unit - 6);
      ctx.fillStyle = 'rgba(38,23,65,0.23)';
      ctx.fillRect(px + 4, py + unit - 5, unit - 6, 2);
    }
    ctx.restore();
  }
};

function gear(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, teeth: number, rotation: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let tooth = 0; tooth < teeth; tooth++) {
    for (let corner = 0; corner < 4; corner++) {
      const a = (tooth + [0, 0.23, 0.61, 0.84][corner]) * TAU / teeth;
      const radius = r * (corner === 1 || corner === 2 ? 1 : 0.88);
      const px = Math.cos(a) * radius;
      const py = Math.sin(a) * radius;
      if (tooth === 0 && corner === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(9,16,27,0.55)';
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 6;
  ctx.shadowBlur = 7;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  dot(ctx, 0, 0, r * 0.75, '#2c3a4c');
  dot(ctx, 0, 0, r * 0.69, color, 0.65);
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6;
    dot(ctx, Math.cos(a) * r * 0.48, Math.sin(a) * r * 0.48, r * 0.09, '#223145', 0.85);
  }
  dot(ctx, 0, 0, r * 0.26, '#1c2b3d');
  dot(ctx, 0, 0, r * 0.135, '#fff0bc', 0.77);
  ctx.restore();
}

export const gearWorkshop: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#6dbbc9', 0.04, 0.18, 0.64);
  wash(frame, '#7f6cc1', 0.98, 0.83, 0.56);
  const scale = Math.min(1, w / 720);
  const chains = [
    { x: w * 0.08, y: h * 0.18, tilt: 0.29, direction: 1 },
    { x: w * 0.94, y: h * 0.82, tilt: Math.PI + 0.24, direction: -1 },
  ];

  for (let row = 0; row < 8; row++) {
    ctx.beginPath();
    ctx.setLineDash([9, 12]);
    ctx.lineDashOffset = (row % 2 ? -1 : 1) * t * 71;
    ctx.moveTo(0, 31 + row * 69);
    ctx.lineTo(w, 31 + row * 69);
    ctx.strokeStyle = 'rgba(156,214,226,0.17)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  ctx.setLineDash([]);
  for (const chain of chains) {
    const radii = [106, 62, 82, 46];
    const teeth = [26, 15, 20, 11];
    const colors = [accent, '#8fd9ce', '#f3a081', '#acb4e8'];
    let distance = 0;
    radii.forEach((r, i) => {
      if (i > 0) distance += (radii[i - 1] + r) * 0.91 * scale;
      const rotation = t * chain.direction * (i % 2 ? -1 : 1) * 25 / teeth[i] + i * 0.3;
      gear(ctx, chain.x + Math.cos(chain.tilt) * distance, chain.y + Math.sin(chain.tilt) * distance, r * scale, teeth[i], rotation, colors[i]);
    });
  }
};
