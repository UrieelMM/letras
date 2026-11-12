import { dot, polygon, sample, wash, wrap, type Scene } from './drawing';

export const lightMantle: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#7779e7', 0.13, 0.22, 0.59);
  wash(frame, '#e18da9', 0.95, 0.83, 0.46);

  for (let edge = 0; edge < 2; edge++) {
    for (let fold = 0; fold < 6; fold++) {
      const offset = (edge ? 0.74 : 0.1) * h + fold * 15;
      const direction = edge ? -1 : 1;
      const phase = t * (2.05 + fold * 0.13) * direction + fold * 0.4;
      const yAt = (x: number) => offset + Math.sin(x / w * 5.7 - phase) * (31 + fold * 5)
        + Math.sin(x / w * 12.1 + phase * 0.71) * (6 + fold * 1.7);
      const widthAt = (x: number) => 19 + fold * 4 + Math.sin(x / w * 9 + phase) * 10;
      const fabric = ctx.createLinearGradient(0, offset - 42, w * 0.82, offset + 87);
      fabric.addColorStop(0, edge ? '#ffbdaf' : '#777be9');
      fabric.addColorStop(0.37, accent);
      fabric.addColorStop(0.72, edge ? '#8cbef6' : '#f0adc9');
      fabric.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.moveTo(0, yAt(0));
      for (let x = 12; x <= w + 12; x += 12) ctx.lineTo(x, yAt(x));
      for (let x = w + 12; x >= -12; x -= 12) ctx.lineTo(x, yAt(x) + widthAt(x));
      ctx.closePath();
      ctx.fillStyle = fabric;
      ctx.globalAlpha = 0.14 + fold * 0.065;
      ctx.fill();
      ctx.globalAlpha = 0.15 + fold * 0.032;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
};

export const livingGlass: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#507be1', 0.03, 0.35, 0.6);
  wash(frame, '#e996ad', 0.98, 0.57, 0.51);
  const colors = ['#6dd7db', '#9ea5f4', '#f297b8', accent, '#b9e7ac'];

  for (let side = 0; side < 2; side++) {
    const width = Math.min(w * 0.31, 294);
    const x = w * (side ? 0.855 : 0.145);
    const left = x - width / 2;
    const right = x + width / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(left, h + 4);
    ctx.lineTo(left, h * 0.29);
    ctx.quadraticCurveTo(left, h * 0.16, x, h * 0.045);
    ctx.quadraticCurveTo(right, h * 0.16, right, h * 0.29);
    ctx.lineTo(right, h + 4);
    ctx.closePath();
    ctx.clip();
    const cell = Math.max(15, Math.min(54, width / 4.4));
    for (let row = 0; row < Math.ceil(h / cell) + 1; row++) {
      for (let col = -1; col < 7; col++) {
        const cx = left + cell * (col + (row % 2) * 0.5);
        const cy = row * cell;
        const id = row * 9 + col + side * 173;
        const piece = colors[Math.floor(sample(id, 2) * colors.length)];
        const shimmer = (1 + Math.sin(t * 2.7 - cy * 0.029 + cx * 0.02 + side)) / 2;
        const points: [number, number][] = [[cx, cy - cell], [cx + cell / 2, cy], [cx, cy + cell], [cx - cell / 2, cy]];
        polygon(ctx, points, piece, 0.44 + shimmer * 0.42);
        polygon(ctx, [[cx, cy - cell], [cx, cy + cell], [cx - cell / 2, cy]], '#f7f1d5', shimmer * 0.15);
        ctx.beginPath();
        ctx.moveTo(...points[0]);
        for (const point of points.slice(1)) ctx.lineTo(...point);
        ctx.closePath();
        ctx.strokeStyle = '#14213b';
        ctx.lineWidth = 2.8;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  for (let i = 0; i < 7; i++) {
    const x = w * (i % 2 ? 0.83 : 0.17) + Math.sin(t * 0.74 + i) * 25;
    const y = h * (0.16 + i * 0.103);
    const spread = w * (i % 2 ? -0.4 : 0.4);
    const reflected = ctx.createLinearGradient(x, y, x + spread, y + 69);
    reflected.addColorStop(0, colors[i % colors.length]);
    reflected.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = reflected;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + spread, y + 64);
    ctx.lineTo(x + spread * 0.93, y + 88);
    ctx.lineTo(x, y + 10);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

export const promisePages: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#ca9a77', 0.04, 0.24, 0.57);
  wash(frame, '#946bb7', 0.91, 0.86, 0.58);

  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1;
    const phase = t * (1.1 + sample(i, 4) * 0.62) + i * 1.7;
    const px = w * (side > 0 ? 0.72 + sample(i, 5) * 0.29 : sample(i, 5) * 0.26) + Math.sin(phase) * 33;
    const py = h + 122 - wrap(sample(i, 3) * (h + 244) + t * (31 + sample(i, 2) * 39), h + 244);
    const size = 36 + sample(i, 6) * 33;
    const fold = 0.19 + Math.abs(Math.sin(phase * 0.9)) * 0.81;
    const paper = i % 3 ? accent : '#e4c7f4';

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(side * (0.25 + Math.sin(phase * 0.7) * 0.49));
    ctx.scale(size * fold, size);
    polygon(ctx, [[-0.7, -0.87], [0.82, -1.07], [0.88, 0.94], [-0.65, 0.99]], '#28152d', 0.53);
    ctx.beginPath();
    ctx.moveTo(-0.75, -0.95);
    ctx.quadraticCurveTo(0, -1.16, 0.77, -0.93);
    ctx.quadraticCurveTo(0.57, 0, 0.77, 0.9);
    ctx.quadraticCurveTo(0, 0.67, -0.75, 0.9);
    ctx.closePath();
    ctx.fillStyle = paper;
    ctx.globalAlpha = 0.59 + fold * 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = '#92607e';
    ctx.lineWidth = 0.023;
    ctx.strokeRect(-0.61, -0.73, 1.16, 1.42);
    dot(ctx, -0.34, -0.41, 0.14, '#a57287', 0.72);
    ctx.strokeStyle = '#876380';
    ctx.globalAlpha = 0.44;
    for (let line = 0; line < 5; line++) {
      const ly = -0.11 + line * 0.138;
      ctx.beginPath();
      ctx.moveTo(-0.44, ly);
      ctx.quadraticCurveTo(0.03, ly - 0.044, 0.45 - (line % 3) * 0.11, ly);
      ctx.stroke();
    }
    ctx.restore();
  }
};

export const worshipIncense: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#ad6bc0', 0.09, 0.71, 0.68);
  wash(frame, '#d48575', 0.94, 0.75, 0.44);

  for (let plume = 0; plume < 11; plume++) {
    const side = plume % 2 ? 1 : -1;
    const origin = w * (side === 1 ? 0.86 : 0.13);
    const phase = t * (1.56 + sample(plume, 4) * 0.53) + plume * 0.29;
    const height = h * (0.79 + sample(plume, 5) * 0.38);
    const gradient = ctx.createLinearGradient(origin, h, origin, h - height);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.28, plume % 3 ? accent : '#f3ba91');
    gradient.addColorStop(0.56, plume % 2 ? '#ad8ee0' : '#dd92be');
    gradient.addColorStop(1, 'transparent');
    ctx.beginPath();
    for (let p = 0; p <= 68; p++) {
      const u = p / 68;
      const spread = (1 + u * 3) * (8 + plume * 2);
      const dx = Math.sin(u * 10.4 - phase) * spread + Math.cos(u * 18 - phase * 0.72) * spread * 0.35;
      const x = origin + side * (8 - 34 * u) + dx;
      const y = h + 17 - u * height;
      if (p === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';
    ctx.globalAlpha = plume % 2 ? 0.22 : 0.14;
    ctx.lineWidth = 10 + plume * 1.5;
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};

export const praiseEcho: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#3fb399', 0.02, 0.17, 0.58);
  wash(frame, '#5186bd', 0.97, 0.84, 0.63);

  for (let lane = 0; lane < 7; lane++) {
    const lower = lane >= 3;
    const direction = lower ? -1 : 1;
    const phase = t * (3.2 + lane * 0.18) * direction;
    const center = h * (lower ? 0.76 + (lane - 3) * 0.048 : 0.12 + lane * 0.062);
    const color = lower ? '#a0b8ff' : accent;
    const yAt = (x: number) => {
      const u = x / w;
      const envelope = 0.42 + 0.58 * Math.pow(Math.sin(u * 4.3 + lane), 2);
      const wave = Math.sin(u * 18.6 - phase + lane * 0.6) + Math.sin(u * 37 + phase * 0.45) * 0.22;
      return center + wave * envelope * (14 + lane * 2.9);
    };
    const ink = ctx.createLinearGradient(0, 0, w, 0);
    ink.addColorStop(0, 'transparent');
    ink.addColorStop(lower ? 0.62 : 0.27, color);
    ink.addColorStop(1, 'transparent');
    ctx.beginPath();
    for (let x = 0; x <= w + 8; x += 8) {
      if (!x) ctx.moveTo(x, yAt(x));
      else ctx.lineTo(x, yAt(x));
    }
    ctx.strokeStyle = ink;
    ctx.globalAlpha = lane % 3 === 0 ? 0.66 : 0.39;
    ctx.lineWidth = lane % 3 === 0 ? 2.8 : 1.1;
    ctx.stroke();
    ctx.globalAlpha = 1;

    for (let i = 0; i < 3; i++) {
      const progress = wrap(t * direction * (0.22 + lane * 0.014) + i / 3 + lane * 0.14);
      const x = w * progress;
      const y = yAt(x);
      const strength = Math.sin(progress * Math.PI);
      dot(ctx, x, y, 8, color, strength * 0.13);
      dot(ctx, x, y, 2.4, '#f5f5d8', strength * 0.87);
    }
  }
};
