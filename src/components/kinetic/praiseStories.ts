import { dot, polygon, sample, wash, wrap, type Scene } from './drawing';

function deer(ctx: CanvasRenderingContext2D, color: string, stride: number) {
  for (let leg = 0; leg < 4; leg++) {
    const front = leg > 1;
    const near = leg % 2 === 1;
    const x = front ? 0.47 : -0.55;
    const phase = stride + (front ? 1.25 : 0) + (near ? 0 : 2.3);
    const forward = Math.sin(phase);
    const kneeX = x + forward * 0.42 + (front ? -0.08 : 0.15);
    const kneeY = 0.54 + Math.cos(phase) * 0.15;
    ctx.beginPath();
    ctx.moveTo(x, 0.13);
    ctx.quadraticCurveTo(x - 0.07, 0.36, kneeX, kneeY);
    ctx.lineTo(x + Math.sin(phase - 0.67) * 0.63, 0.86 + Math.cos(phase - 0.75) * 0.13);
    ctx.strokeStyle = near ? color : '#b88773';
    ctx.lineWidth = near ? 0.115 : 0.082;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-0.82, -0.14);
  ctx.quadraticCurveTo(-0.29, -0.42, 0.45, -0.21);
  ctx.quadraticCurveTo(0.72, -0.4, 0.86, -0.72);
  ctx.quadraticCurveTo(1.03, -0.92, 1.22, -0.77);
  ctx.lineTo(1.43, -0.65);
  ctx.quadraticCurveTo(1.48, -0.52, 1.17, -0.51);
  ctx.quadraticCurveTo(0.94, -0.48, 0.76, -0.06);
  ctx.quadraticCurveTo(0.66, 0.26, 0.31, 0.26);
  ctx.quadraticCurveTo(-0.19, 0.16, -0.56, 0.27);
  ctx.quadraticCurveTo(-0.86, 0.23, -0.82, -0.14);
  ctx.fillStyle = color;
  ctx.fill();
  polygon(ctx, [[-0.73, -0.12], [-1.11, -0.25], [-1.03, -0.01], [-0.77, 0.02]], color);
  polygon(ctx, [[0.88, -0.76], [0.79, -1.13], [1.06, -0.86]], color);
  polygon(ctx, [[1.04, -0.79], [1.15, -1.14], [1.24, -0.84]], '#ffedbb');
  dot(ctx, 1.15, -0.7, 0.028, '#4d393a');
}

export const leapingDeer: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#81b98b', 0.07, 0.19, 0.62);
  wash(frame, '#e3a578', 0.94, 0.77, 0.55);
  for (let ridge = 0; ridge < 4; ridge++) {
    ctx.beginPath();
    ctx.moveTo(-24, h);
    for (let x = -24; x <= w + 24; x += 16) {
      const position = x + t * (28 + ridge * 23);
      const y = h * (0.69 + ridge * 0.083) + Math.sin(position / (88 - ridge * 14) + ridge) * (17 + ridge * 3);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w + 24, h);
    ctx.closePath();
    ctx.fillStyle = ['#597365', '#47665d', '#3e5c56', '#2c4847'][ridge];
    ctx.fill();
  }
  for (let i = 0; i < 8; i++) {
    const high = i % 3 === 0;
    const direction = high ? -1 : 1;
    const stride = t * (7.6 + sample(i, 2) * 3.7) + i * 2.2;
    const scale = (high ? 22 : 33) + sample(i, 3) * 22;
    const x = wrap(sample(i, 4) * (w + 300) + direction * t * (91 + i * 15), w + 300) - 150;
    const y = h * (high ? 0.16 + sample(i, 6) * 0.13 : 0.68 + sample(i, 6) * 0.17)
      - Math.pow(0.5 + 0.5 * Math.sin(stride), 2) * (14 + scale * 0.32);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale * direction, scale);
    ctx.rotate(Math.cos(stride) * 0.16);
    deer(ctx, high ? '#ccae8c' : i % 2 ? accent : '#f4a980', stride);
    ctx.restore();
  }
};

export const partedSea: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#5d9bde', 0.05, 0.36, 0.69);
  wash(frame, '#60cfbd', 0.94, 0.7, 0.53);

  for (let side = 0; side < 2; side++) {
    ctx.save();
    if (side) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    const boundary = (y: number, depth: number) => {
      const u = y / h;
      return w * (0.09 + depth * 0.057 + Math.sin(u * 5.4 - t * 2.8 + side + depth * 0.5) * 0.065)
        + Math.cos(u * 15 - t * 4.1 + depth * 0.4) * (7 + depth * 1.3);
    };
    for (let depth = 4; depth >= 0; depth--) {
      ctx.beginPath();
      ctx.moveTo(-2, -12);
      for (let y = -12; y <= h + 12; y += 12) ctx.lineTo(boundary(y, depth), y);
      ctx.lineTo(-2, h + 12);
      ctx.closePath();
      const water = ctx.createLinearGradient(0, 0, w * 0.34, h * 0.4);
      water.addColorStop(0, ['#245d88', '#277c99', '#409bc6', '#57b8cf', accent][depth]);
      water.addColorStop(1, depth > 2 ? '#76bacd' : '#235678');
      ctx.globalAlpha = 0.48 + (4 - depth) * 0.076;
      ctx.fillStyle = water;
      ctx.fill();
      ctx.lineWidth = depth === 4 ? 3 : 1.3;
      ctx.strokeStyle = depth === 4 ? '#cefff1' : '#a1e9ee';
      ctx.globalAlpha = 0.3 + depth * 0.04;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 48; i++) {
      const y = wrap(sample(i, 3) * (h + 36) - t * (87 + sample(i, 5) * 147), h + 36) - 18;
      const x = boundary(y, 4) * (0.25 + sample(i, 2) * 0.78);
      const foam = 1 + sample(i, 8) * 2.8;
      dot(ctx, x, y, foam, i % 3 ? '#dbfff4' : accent, 0.24 + sample(i, 6) * 0.51);
    }
    for (let streak = 0; streak < 11; streak++) {
      const travel = wrap(streak / 11 + t * 0.48);
      const y = travel * (h + 80) - 40;
      const edge = boundary(y, 4);
      const inner = boundary(y + 22, 2) * (0.34 + sample(streak, 4) * 0.6);
      ctx.beginPath();
      ctx.moveTo(inner, y + 24);
      ctx.quadraticCurveTo(edge * 0.82, y + 5, edge, y - 17);
      ctx.strokeStyle = '#d1fff0';
      ctx.lineWidth = streak % 3 === 0 ? 2.2 : 0.9;
      ctx.globalAlpha = Math.sin(travel * Math.PI) * 0.48;
      ctx.stroke();
    }
    ctx.restore();
  }
};

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

export const fallingWalls: Scene = (frame) => {
  const { ctx, w, h, t, accent } = frame;
  wash(frame, '#be806d', 0.07, 0.42, 0.7);
  wash(frame, '#a885bc', 0.95, 0.25, 0.61);
  const stoneWidth = Math.min(61, w * 0.084);
  const stoneHeight = 35;
  const colors = [accent, '#b98686', '#df9d85', '#c8a2b4'];
  for (let side = 0; side < 2; side++) {
    const direction = side ? 1 : -1;
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 4; col++) {
        const id = row * 4 + col + side * 40;
        const cycle = wrap(t * (0.34 + side * 0.045) - row * 0.055 + col * 0.07);
        const fall = Math.max(0, (cycle - 0.35) / 0.65);
        const x = w * (side ? 0.79 : 0.21)
          + direction * ((col + row % 2 * 0.43) * stoneWidth + fall * fall * (105 + col * 17));
        const y = h * 0.36 + row * stoneHeight + fall * fall * (112 + sample(id, 3) * 141);
        const alpha = Math.min(1, cycle * 8, (1 - cycle) * 4);
        const shade = colors[id % colors.length];
        const width = stoneWidth * (0.92 + sample(id, 7) * 0.08);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(direction * (fall * 1.48 + sample(id, 4) * 0.044));
        polygon(ctx, [[-width * 0.48, -15], [width * 0.43, -16], [width * 0.5, 12], [width * 0.37, 16], [-width * 0.47, 14]], shade, alpha * 0.83);
        polygon(ctx, [[-width * 0.48, -15], [width * 0.43, -16], [width * 0.37, -10], [-width * 0.41, -8]], '#ffe0b4', alpha * 0.37);
        ctx.globalAlpha = alpha * 0.42;
        ctx.strokeStyle = '#6c4b67';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(-width * 0.31, 7);
        ctx.lineTo(-width * 0.08, 3);
        ctx.lineTo(width * 0.17, 7);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
};

export const promisePath: Scene = (frame) => {
  const { ctx, w, h, t, accent, base } = frame;
  const horizon = h * 0.44;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, base);
  sky.addColorStop(0.55, '#765784');
  sky.addColorStop(1, '#423657');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  wash(frame, accent, 0.5, 0.44, 0.5);

  const pointAt = (depth: number, lane: number) => ({
    x: w / 2 + lane * w * depth * 0.52 + Math.sin(depth * 6.7 + t * 1.27) * depth * w * 0.13,
    y: horizon + depth * depth * h * 0.62,
  });
  for (let side = -1; side <= 1; side += 2) {
    for (let line = 0; line < 6; line++) {
      const lane = side * (0.58 + line * 0.2);
      ctx.beginPath();
      for (let i = 0; i <= 28; i++) {
        const depth = i / 28;
        const { x, y } = pointAt(depth, lane);
        const lift = Math.sin(depth * 7 + line * 0.7 - t * 1.6) * depth * 20;
        if (!i) ctx.moveTo(x, y + lift);
        else ctx.lineTo(x, y + lift);
      }
      ctx.strokeStyle = side === -1 ? '#d398b3' : accent;
      ctx.globalAlpha = 0.22 + line * 0.025;
      ctx.lineWidth = line % 3 === 0 ? 2 : 0.85;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.beginPath();
  for (let i = 0; i <= 42; i++) {
    const { x, y } = pointAt(i / 42, -0.45);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = 42; i >= 0; i--) {
    const { x, y } = pointAt(i / 42, 0.45);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  const path = ctx.createLinearGradient(0, horizon, 0, h);
  path.addColorStop(0, '#e0ae89');
  path.addColorStop(1, '#b78273');
  ctx.fillStyle = path;
  ctx.globalAlpha = 0.56;
  ctx.fill();
  ctx.strokeStyle = '#ffd6a7';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;

  for (let i = 0; i < 45; i++) {
    const p = wrap(sample(i, 3) + t * (0.61 + sample(i, 5) * 0.26));
    const depth = p * p;
    const lane = (i % 2 ? 1 : -1) * (0.16 + sample(i, 4) * 1.07);
    const { x, y } = pointAt(depth, lane);
    const length = 2 + depth * (18 + sample(i, 7) * 49);
    const slope = (x - w / 2) / w;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + slope * length, y + length * 0.53);
    ctx.globalAlpha = Math.sin(p * Math.PI) * 0.74;
    ctx.lineWidth = 0.7 + depth * 2.6;
    ctx.strokeStyle = i % 3 ? accent : '#f7bec5';
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (let i = 0; i < 6; i++) {
    const p = wrap(t * 0.64 + i / 6);
    const depth = p * p;
    const { x, y } = pointAt(depth, 0);
    const step = Math.max(1, depth * 34);
    ctx.globalAlpha = Math.sin(p * Math.PI) * 0.65;
    ctx.strokeStyle = '#fff3b8';
    ctx.lineWidth = 1.2 + depth * 2.5;
    ctx.beginPath();
    ctx.moveTo(x - step, y + step * 0.23);
    ctx.lineTo(x, y - step * 0.16);
    ctx.lineTo(x + step, y + step * 0.23);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};
