import { useEffect, useRef } from 'react';
import type { RobotLightsVariant } from '../types';

interface RobotLightsProps {
  colorA: string;
  colorB: string;
  variant?: RobotLightsVariant;
  showRig?: boolean;
  className?: string;
}

interface MovingHead {
  x: number;
  phase: number;
  speed: number;
}

const MOVING_HEADS: MovingHead[] = [
  { x: 0.1, phase: 0.1, speed: 0.78 },
  { x: 0.3, phase: 1.8, speed: 0.62 },
  { x: 0.5, phase: 3.4, speed: 0.88 },
  { x: 0.7, phase: 4.9, speed: 0.68 },
  { x: 0.9, phase: 6.2, speed: 0.82 },
];

interface StageProfile {
  palette: string[];
  speed: number;
  sweep: number;
  beamWidth: number;
  beamOpacity: number;
  beatRate: number;
  targetY: number;
}

const STAGE_PROFILES: Record<RobotLightsVariant, StageProfile> = {
  festival: {
    palette: ['#ff3cac', '#00e5ff', '#ffe45c', '#7dff68', '#9b5cff'],
    speed: 1,
    sweep: 0.52,
    beamWidth: 1,
    beamOpacity: 1,
    beatRate: 4.8,
    targetY: 0.72,
  },
  stadium: {
    palette: ['#38bdf8', '#ffffff', '#2563eb', '#67e8f9', '#8b5cf6'],
    speed: 0.72,
    sweep: 0.46,
    beamWidth: 1.22,
    beamOpacity: 1.18,
    beatRate: 3.4,
    targetY: 0.75,
  },
  rock: {
    palette: ['#ff3b18', '#ff8a00', '#ffd166', '#ef233c', '#ff5a1f'],
    speed: 1.28,
    sweep: 0.58,
    beamWidth: 0.82,
    beamOpacity: 1.2,
    beatRate: 7.2,
    targetY: 0.7,
  },
  disco: {
    palette: ['#ff4fd8', '#15e6ff', '#ffe75c', '#8b5cff', '#62ffb0'],
    speed: 0.92,
    sweep: 0.5,
    beamWidth: 0.94,
    beamOpacity: 1.12,
    beatRate: 5.6,
    targetY: 0.73,
  },
  golden: {
    palette: ['#fff4c2', '#ffd166', '#ffb000', '#ffffff', '#e6b84f'],
    speed: 0.52,
    sweep: 0.38,
    beamWidth: 1.42,
    beamOpacity: 0.92,
    beatRate: 2.6,
    targetY: 0.76,
  },
  cyber: {
    palette: ['#39ff14', '#00e5ff', '#b026ff', '#ff2bd6', '#7dff68'],
    speed: 1.48,
    sweep: 0.6,
    beamWidth: 0.48,
    beamOpacity: 1.35,
    beatRate: 8.4,
    targetY: 0.68,
  },
  arena: {
    palette: ['#ff334f', '#ffd166', '#ffffff', '#2f7cff', '#ff7a18'],
    speed: 0.82,
    sweep: 0.48,
    beamWidth: 1.05,
    beamOpacity: 1.15,
    beatRate: 4.6,
    targetY: 0.74,
  },
  worship: {
    palette: ['#fff4c2', '#ffffff', '#64d8cb', '#7db7ff', '#e7c6ff'],
    speed: 0.46,
    sweep: 0.32,
    beamWidth: 1.58,
    beamOpacity: 0.88,
    beatRate: 2.2,
    targetY: 0.78,
  },
  edm: {
    palette: ['#00f5ff', '#ff21d0', '#8b3dff', '#d7ff38', '#ffffff'],
    speed: 1.65,
    sweep: 0.62,
    beamWidth: 0.56,
    beamOpacity: 1.38,
    beatRate: 9.6,
    targetY: 0.66,
  },
  carnival: {
    palette: ['#ff355d', '#ffe24a', '#22d3ee', '#66ff77', '#c85cff'],
    speed: 1.08,
    sweep: 0.54,
    beamWidth: 1,
    beamOpacity: 1.18,
    beatRate: 6.4,
    targetY: 0.72,
  },
  ice: {
    palette: ['#9bf6ff', '#ffffff', '#45a7ff', '#b8d8ff', '#8c7dff'],
    speed: 0.65,
    sweep: 0.42,
    beamWidth: 1.28,
    beamOpacity: 1.02,
    beatRate: 3.1,
    targetY: 0.75,
  },
  summer: {
    palette: ['#ffb703', '#ff5d8f', '#00d4ff', '#7cff6b', '#fff36b'],
    speed: 1.02,
    sweep: 0.53,
    beamWidth: 1.08,
    beamOpacity: 1.14,
    beatRate: 6.1,
    targetY: 0.72,
  },
  spring: {
    palette: ['#ff8acb', '#9bffb0', '#8ed8ff', '#fff18a', '#c8a4ff'],
    speed: 0.72,
    sweep: 0.44,
    beamWidth: 1.2,
    beamOpacity: 0.98,
    beatRate: 3.8,
    targetY: 0.76,
  },
  autumn: {
    palette: ['#ff8c42', '#ffd166', '#b85c38', '#f4a261', '#fff1c1'],
    speed: 0.58,
    sweep: 0.4,
    beamWidth: 1.34,
    beamOpacity: 0.96,
    beatRate: 3,
    targetY: 0.77,
  },
  winter: {
    palette: ['#dff8ff', '#74c7ff', '#ffffff', '#92a8ff', '#b9f5ff'],
    speed: 0.74,
    sweep: 0.46,
    beamWidth: 1.18,
    beamOpacity: 1.08,
    beatRate: 3.5,
    targetY: 0.74,
  },
  cosmic: {
    palette: ['#b55cff', '#00e5ff', '#ff4fd8', '#fff56b', '#6f7cff'],
    speed: 1.16,
    sweep: 0.57,
    beamWidth: 0.76,
    beamOpacity: 1.28,
    beatRate: 6.8,
    targetY: 0.69,
  },
  ocean: {
    palette: ['#00e5ff', '#53ffd8', '#7aa7ff', '#c16bff', '#bffcff'],
    speed: 0.46,
    sweep: 0.38,
    beamWidth: 1.3,
    beamOpacity: 0.9,
    beatRate: 2.4,
    targetY: 0.76,
  },
  enchanted: {
    palette: ['#8cff98', '#f68cff', '#80e7ff', '#ffe87a', '#b98cff'],
    speed: 0.68,
    sweep: 0.44,
    beamWidth: 1.12,
    beamOpacity: 1,
    beatRate: 3.6,
    targetY: 0.73,
  },
  city: {
    palette: ['#00e5ff', '#ff2bd6', '#ffe45c', '#735cff', '#ffffff'],
    speed: 1.24,
    sweep: 0.58,
    beamWidth: 0.68,
    beamOpacity: 1.22,
    beatRate: 7.4,
    targetY: 0.68,
  },
  volcano: {
    palette: ['#ff4d00', '#ffb000', '#ff2d20', '#ffd166', '#ffffff'],
    speed: 0.9,
    sweep: 0.48,
    beamWidth: 1.05,
    beamOpacity: 1.18,
    beatRate: 5.8,
    targetY: 0.72,
  },
  candy: {
    palette: ['#ff71ce', '#7afcff', '#fff46b', '#b967ff', '#6dff8d'],
    speed: 0.86,
    sweep: 0.5,
    beamWidth: 1,
    beamOpacity: 1.08,
    beatRate: 5.2,
    targetY: 0.72,
  },
};

const HAZE_PARTICLES = Array.from({ length: 74 }, (_, index) => ({
  x: ((index * 47) % 101) / 100,
  y: ((index * 71 + 13) % 103) / 102,
  radius: 0.45 + ((index * 19) % 16) / 10,
  phase: index * 0.83,
  speed: 0.08 + (index % 7) * 0.018,
}));

function toRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const normalized =
    value.length === 3
      ? value
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : value.padEnd(6, '0').slice(0, 6);
  const parsed = Number.parseInt(normalized, 16);

  if (Number.isNaN(parsed)) return [255, 255, 255];
  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255];
}

function rgba(color: string, alpha: number) {
  const [red, green, blue] = toRgb(color);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + corner, y);
  context.lineTo(x + width - corner, y);
  context.quadraticCurveTo(x + width, y, x + width, y + corner);
  context.lineTo(x + width, y + height - corner);
  context.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  context.lineTo(x + corner, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - corner);
  context.lineTo(x, y + corner);
  context.quadraticCurveTo(x, y, x + corner, y);
  context.closePath();
}

export default function RobotLights({
  colorA,
  colorB,
  variant = 'festival',
  showRig = true,
  className = '',
}: RobotLightsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const profile = STAGE_PROFILES[variant];
    const palette = [colorA, ...profile.palette.slice(1)];
    let width = 1;
    let height = 1;
    let animationFrame = 0;

    const resize = () => {
      const bounds = container.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const lightPosition = (head: MovingHead, index: number, time: number) => {
      const movement = time * head.speed * profile.speed + head.phase;
      const fixtureX = width * head.x;
      const fixtureY = height * (0.125 + (index % 2) * 0.018);
      const secondaryWave = variant === 'stadium' ? Math.sin(time * 0.24 + head.phase) * 0.08 : 0;
      const targetX = width * (0.5 + profile.sweep * Math.sin(movement) + secondaryWave);
      const targetY =
        height *
        (profile.targetY +
          0.17 * Math.sin(time * (head.speed * profile.speed * 0.73) + head.phase * 1.4));
      const beat =
        0.75 + 0.25 * Math.max(0, Math.sin(time * profile.beatRate + head.phase));

      return { fixtureX, fixtureY, targetX, targetY, beat, color: palette[index % palette.length] };
    };

    const drawVenuePersonality = (time: number) => {
      if (variant === 'stadium') {
        const crowdTop = height * 0.82;
        context.fillStyle = 'rgba(0, 2, 12, 0.92)';
        context.beginPath();
        context.moveTo(0, height);
        context.lineTo(0, crowdTop);
        for (let index = 0; index <= 46; index += 1) {
          const x = (index / 46) * width;
          const y = crowdTop - (8 + ((index * 17) % 22)) * Math.max(0.7, height / 720);
          context.lineTo(x, y);
        }
        context.lineTo(width, height);
        context.closePath();
        context.fill();

        for (let index = 0; index < 42; index += 1) {
          const x = (((index * 37) % 97) / 96) * width;
          const y = crowdTop + (((index * 23) % 15) / 15) * height * 0.15;
          const flicker = 0.38 + 0.28 * Math.sin(time * 2 + index);
          context.fillStyle = index % 5 === 0 ? rgba(colorA, flicker) : `rgba(220,245,255,${flicker})`;
          context.fillRect(x, y, Math.max(1.2, width * 0.0015), Math.max(2, height * 0.004));
        }
        return;
      }

      if (variant === 'rock') {
        const stackWidth = Math.max(48, width * 0.07);
        const stackHeight = height * 0.32;
        [width * 0.015, width - stackWidth - width * 0.015].forEach((x) => {
          const y = height * 0.57;
          const stackGradient = context.createLinearGradient(x, y, x + stackWidth, y);
          stackGradient.addColorStop(0, '#070707');
          stackGradient.addColorStop(0.5, '#242424');
          stackGradient.addColorStop(1, '#080808');
          context.fillStyle = stackGradient;
          roundedRect(context, x, y, stackWidth, stackHeight, 5);
          context.fill();
          context.strokeStyle = 'rgba(255,116,32,0.28)';
          context.stroke();
          [0.2, 0.5, 0.8].forEach((position, speakerIndex) => {
            const radius = stackWidth * (speakerIndex === 1 ? 0.29 : 0.23);
            context.fillStyle = '#020202';
            context.beginPath();
            context.arc(x + stackWidth / 2, y + stackHeight * position, radius, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = 'rgba(255,85,24,0.34)';
            context.lineWidth = 2;
            context.stroke();
          });
        });

        context.save();
        context.globalCompositeOperation = 'lighter';
        HAZE_PARTICLES.slice(0, 38).forEach((particle, index) => {
          const x = particle.x * width + Math.sin(time * 1.8 + particle.phase) * width * 0.018;
          const y = height * (1.05 - ((time * particle.speed * 0.48 + particle.y) % 0.72));
          const sparkSize = Math.max(1, particle.radius * width * 0.0012);
          context.fillStyle = index % 3 === 0 ? rgba('#ffd166', 0.72) : rgba(colorA, 0.58);
          context.fillRect(x, y, sparkSize, sparkSize * 2.8);
        });
        context.restore();
        return;
      }

      if (variant === 'disco') {
        const centerX = width * 0.5;
        const centerY = height * 0.28;
        const radius = Math.max(30, Math.min(width, height) * 0.075);
        context.save();
        context.globalCompositeOperation = 'lighter';
        for (let index = 0; index < 18; index += 1) {
          const angle = time * 0.12 + (index / 18) * Math.PI * 2;
          context.strokeStyle = rgba(palette[index % palette.length], 0.065);
          context.lineWidth = radius * 0.16;
          context.beginPath();
          context.moveTo(centerX, centerY);
          context.lineTo(
            centerX + Math.cos(angle) * Math.max(width, height),
            centerY + Math.sin(angle) * Math.max(width, height),
          );
          context.stroke();
        }
        context.restore();

        const ballGradient = context.createRadialGradient(
          centerX - radius * 0.3,
          centerY - radius * 0.35,
          radius * 0.08,
          centerX,
          centerY,
          radius,
        );
        ballGradient.addColorStop(0, '#ffffff');
        ballGradient.addColorStop(0.42, '#adb8d1');
        ballGradient.addColorStop(1, '#22263a');
        context.fillStyle = ballGradient;
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, Math.PI * 2);
        context.fill();
        context.save();
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, Math.PI * 2);
        context.clip();
        const tile = Math.max(6, radius * 0.22);
        for (let x = centerX - radius; x < centerX + radius; x += tile) {
          for (let y = centerY - radius; y < centerY + radius; y += tile) {
            const shimmer = 0.18 + 0.3 * Math.max(0, Math.sin(time * 2.2 + x * 0.04 + y * 0.03));
            context.strokeStyle = `rgba(255,255,255,${shimmer})`;
            context.strokeRect(x, y, tile, tile);
          }
        }
        context.restore();
        return;
      }

      if (variant === 'golden') {
        context.save();
        context.globalCompositeOperation = 'lighter';
        for (let index = 0; index < 7; index += 1) {
          const centerX = width * (0.12 + index * 0.127);
          const sway = Math.sin(time * 0.34 + index) * width * 0.028;
          const rayGradient = context.createLinearGradient(centerX, 0, centerX + sway, height);
          rayGradient.addColorStop(0, rgba(index % 2 === 0 ? '#ffffff' : colorA, 0.2));
          rayGradient.addColorStop(1, rgba('#ffbd3d', 0));
          context.fillStyle = rayGradient;
          context.beginPath();
          context.moveTo(centerX - width * 0.014, 0);
          context.lineTo(centerX + width * 0.014, 0);
          context.lineTo(centerX + sway + width * 0.09, height);
          context.lineTo(centerX + sway - width * 0.09, height);
          context.closePath();
          context.fill();
        }
        context.restore();

        for (let index = 0; index < 20; index += 1) {
          const x = (((index * 43) % 101) / 100) * width;
          const y = (((index * 67) % 83) / 82) * height;
          const radius = Math.max(2, ((index % 5) + 2) * width * 0.0016);
          const glow = context.createRadialGradient(x, y, 0, x, y, radius * 3);
          glow.addColorStop(0, rgba('#fff3bd', 0.38));
          glow.addColorStop(1, rgba('#ffd166', 0));
          context.fillStyle = glow;
          context.beginPath();
          context.arc(x, y, radius * 3, 0, Math.PI * 2);
          context.fill();
        }
        return;
      }

      if (variant === 'cyber') {
        const horizon = height * 0.57;
        context.save();
        context.globalCompositeOperation = 'lighter';
        context.strokeStyle = rgba(colorA, 0.22);
        context.lineWidth = 1;
        for (let index = -7; index <= 7; index += 1) {
          context.beginPath();
          context.moveTo(width * 0.5, horizon);
          context.lineTo(width * 0.5 + index * width * 0.11, height);
          context.stroke();
        }
        for (let index = 0; index < 9; index += 1) {
          const progress = index / 8;
          const y = horizon + progress * progress * (height - horizon);
          context.strokeStyle = rgba(index % 2 === 0 ? '#00e5ff' : colorA, 0.14 + progress * 0.14);
          context.beginPath();
          context.moveTo(0, y);
          context.lineTo(width, y);
          context.stroke();
        }
        for (let index = 0; index < 4; index += 1) {
          const y = height * (0.24 + ((time * 0.13 + index * 0.23) % 0.55));
          context.strokeStyle = rgba(palette[(index + 1) % palette.length], 0.28);
          context.lineWidth = Math.max(1, height * 0.002);
          context.beginPath();
          context.moveTo(0, y);
          context.lineTo(width, y + Math.sin(time + index) * height * 0.025);
          context.stroke();
        }
        context.restore();
        return;
      }

      if (variant === 'arena') {
        const wallX = width * 0.17;
        const wallY = height * 0.22;
        const wallWidth = width * 0.66;
        const wallHeight = height * 0.48;
        const wallGradient = context.createLinearGradient(wallX, wallY, wallX + wallWidth, wallY + wallHeight);
        wallGradient.addColorStop(0, rgba('#1a3a8a', 0.72));
        wallGradient.addColorStop(0.48, rgba(colorA, 0.42));
        wallGradient.addColorStop(1, rgba('#ff9f1c', 0.55));
        context.fillStyle = 'rgba(2, 4, 12, 0.9)';
        context.fillRect(wallX - 5, wallY - 5, wallWidth + 10, wallHeight + 10);
        context.fillStyle = wallGradient;
        context.fillRect(wallX, wallY, wallWidth, wallHeight);

        context.strokeStyle = 'rgba(255,255,255,0.08)';
        context.lineWidth = 1;
        for (let index = 1; index < 18; index += 1) {
          const x = wallX + (index / 18) * wallWidth;
          context.beginPath();
          context.moveTo(x, wallY);
          context.lineTo(x, wallY + wallHeight);
          context.stroke();
        }
        for (let index = 1; index < 9; index += 1) {
          const y = wallY + (index / 9) * wallHeight;
          context.beginPath();
          context.moveTo(wallX, y);
          context.lineTo(wallX + wallWidth, y);
          context.stroke();
        }

        context.save();
        context.globalCompositeOperation = 'lighter';
        for (let index = 0; index < 26; index += 1) {
          const barWidth = wallWidth / 32;
          const barHeight =
            wallHeight * (0.1 + 0.22 * Math.max(0, Math.sin(time * 3.4 + index * 0.72)));
          context.fillStyle = rgba(palette[index % palette.length], 0.2);
          context.fillRect(
            wallX + wallWidth * 0.08 + index * barWidth,
            wallY + wallHeight - barHeight,
            barWidth * 0.58,
            barHeight,
          );
        }
        context.restore();

        [width * 0.055, width * 0.945].forEach((towerX) => {
          context.strokeStyle = 'rgba(175,190,214,0.42)';
          context.lineWidth = Math.max(1, width * 0.0015);
          context.strokeRect(towerX - width * 0.018, height * 0.19, width * 0.036, height * 0.62);
          for (let index = 0; index < 7; index += 1) {
            const top = height * (0.19 + index * 0.088);
            context.beginPath();
            context.moveTo(towerX - width * 0.018, top);
            context.lineTo(towerX + width * 0.018, top + height * 0.088);
            context.moveTo(towerX + width * 0.018, top);
            context.lineTo(towerX - width * 0.018, top + height * 0.088);
            context.stroke();
          }
        });

        context.fillStyle = 'rgba(0,0,4,0.94)';
        context.beginPath();
        context.moveTo(0, height);
        context.lineTo(0, height * 0.88);
        for (let index = 0; index <= 52; index += 1) {
          const x = (index / 52) * width;
          const y = height * (0.86 - (((index * 29) % 10) / 260));
          context.lineTo(x, y);
        }
        context.lineTo(width, height);
        context.closePath();
        context.fill();
        return;
      }

      if (variant === 'worship') {
        const panelTop = height * 0.2;
        const panelHeight = height * 0.56;
        for (let index = 0; index < 7; index += 1) {
          const panelWidth = width * (index === 3 ? 0.095 : 0.075);
          const x = width * (0.18 + index * 0.105) - panelWidth / 2;
          const panelGradient = context.createLinearGradient(x, panelTop, x, panelTop + panelHeight);
          panelGradient.addColorStop(0, rgba(index % 2 === 0 ? '#7db7ff' : colorA, 0.42));
          panelGradient.addColorStop(0.52, rgba('#ffffff', 0.12));
          panelGradient.addColorStop(1, rgba('#173a52', 0.34));
          context.fillStyle = 'rgba(3, 8, 14, 0.82)';
          roundedRect(context, x - 3, panelTop - 3, panelWidth + 6, panelHeight + 6, 4);
          context.fill();
          context.fillStyle = panelGradient;
          roundedRect(context, x, panelTop, panelWidth, panelHeight, 3);
          context.fill();
        }

        const crossX = width * 0.5;
        const crossY = height * 0.31;
        context.save();
        context.globalCompositeOperation = 'lighter';
        context.shadowColor = colorA;
        context.shadowBlur = Math.max(24, width * 0.035);
        context.fillStyle = rgba('#ffffff', 0.46);
        context.fillRect(crossX - width * 0.009, crossY, width * 0.018, height * 0.25);
        context.fillRect(crossX - width * 0.055, crossY + height * 0.065, width * 0.11, height * 0.022);
        context.restore();

        context.fillStyle = 'rgba(0, 3, 8, 0.88)';
        context.fillRect(width * 0.12, height * 0.78, width * 0.76, height * 0.035);
        context.fillRect(width * 0.2, height * 0.815, width * 0.6, height * 0.026);
        for (let index = 0; index < 12; index += 1) {
          const x = width * (0.22 + index * 0.052);
          context.fillStyle = rgba(index % 2 === 0 ? colorA : '#7db7ff', 0.6);
          context.fillRect(x, height * 0.81, width * 0.018, height * 0.005);
        }

        context.strokeStyle = 'rgba(230,244,255,0.24)';
        context.lineWidth = Math.max(2, width * 0.002);
        context.beginPath();
        context.arc(width * 0.78, height * 0.69, height * 0.045, 0, Math.PI * 2);
        context.moveTo(width * 0.78, height * 0.735);
        context.lineTo(width * 0.78, height * 0.79);
        context.moveTo(width * 0.74, height * 0.79);
        context.lineTo(width * 0.82, height * 0.79);
        context.moveTo(width * 0.22, height * 0.73);
        context.lineTo(width * 0.34, height * 0.73);
        context.moveTo(width * 0.28, height * 0.73);
        context.lineTo(width * 0.28, height * 0.8);
        context.stroke();
        return;
      }

      if (variant === 'edm') {
        const boothX = width * 0.29;
        const boothY = height * 0.66;
        const boothWidth = width * 0.42;
        const boothHeight = height * 0.18;
        const boothGradient = context.createLinearGradient(boothX, boothY, boothX + boothWidth, boothY + boothHeight);
        boothGradient.addColorStop(0, rgba('#00f5ff', 0.38));
        boothGradient.addColorStop(0.5, rgba('#8b3dff', 0.3));
        boothGradient.addColorStop(1, rgba('#ff21d0', 0.38));
        context.fillStyle = 'rgba(3,0,12,0.94)';
        context.fillRect(boothX - 6, boothY - 6, boothWidth + 12, boothHeight + 12);
        context.fillStyle = boothGradient;
        context.fillRect(boothX, boothY, boothWidth, boothHeight);

        context.save();
        context.globalCompositeOperation = 'lighter';
        for (let index = 0; index < 32; index += 1) {
          const barWidth = boothWidth / 38;
          const energy = 0.16 + 0.72 * Math.max(0, Math.sin(time * 7.6 + index * 0.78));
          const barHeight = boothHeight * energy;
          context.fillStyle = rgba(palette[index % palette.length], 0.68);
          context.fillRect(
            boothX + boothWidth * 0.06 + index * barWidth,
            boothY + boothHeight - barHeight,
            barWidth * 0.58,
            barHeight,
          );
        }
        context.restore();

        [width * 0.075, width * 0.925].forEach((arrayX, sideIndex) => {
          for (let index = 0; index < 6; index += 1) {
            const size = Math.max(24, width * 0.037);
            const y = height * (0.28 + index * 0.075);
            context.save();
            context.translate(arrayX, y);
            context.rotate((sideIndex === 0 ? 1 : -1) * 0.08 * index);
            context.fillStyle = '#06060b';
            context.fillRect(-size / 2, -size / 2, size, size);
            context.strokeStyle = rgba(index % 2 === 0 ? '#00f5ff' : '#ff21d0', 0.5);
            context.strokeRect(-size / 2, -size / 2, size, size);
            context.fillStyle = 'rgba(0,0,0,0.9)';
            context.beginPath();
            context.arc(0, 0, size * 0.28, 0, Math.PI * 2);
            context.fill();
            context.restore();
          }
        });

        context.save();
        context.globalCompositeOperation = 'lighter';
        [0.2, 0.8].forEach((position, index) => {
          const jetX = width * position;
          const jetTop = height * (0.42 + 0.04 * Math.sin(time * 5 + index));
          const smokeGradient = context.createLinearGradient(jetX, height * 0.9, jetX, jetTop);
          smokeGradient.addColorStop(0, 'rgba(255,255,255,0.44)');
          smokeGradient.addColorStop(1, 'rgba(255,255,255,0)');
          context.fillStyle = smokeGradient;
          context.beginPath();
          context.moveTo(jetX - width * 0.01, height * 0.9);
          context.lineTo(jetX - width * 0.05, jetTop);
          context.lineTo(jetX + width * 0.05, jetTop);
          context.lineTo(jetX + width * 0.01, height * 0.9);
          context.closePath();
          context.fill();
        });
        context.restore();
        return;
      }

      if (variant === 'carnival') {
        const archCenterX = width * 0.5;
        const archCenterY = height * 0.78;
        const archRadiusX = width * 0.47;
        const archRadiusY = height * 0.6;
        context.strokeStyle = 'rgba(44, 20, 70, 0.9)';
        context.lineWidth = Math.max(10, width * 0.014);
        context.beginPath();
        context.ellipse(archCenterX, archCenterY, archRadiusX, archRadiusY, 0, Math.PI, Math.PI * 2);
        context.stroke();
        context.lineWidth = Math.max(2, width * 0.002);
        context.strokeStyle = 'rgba(255,255,255,0.26)';
        context.stroke();

        for (let index = 0; index <= 26; index += 1) {
          const angle = Math.PI + (index / 26) * Math.PI;
          const x = archCenterX + Math.cos(angle) * archRadiusX;
          const y = archCenterY + Math.sin(angle) * archRadiusY;
          const bulbColor = palette[index % palette.length];
          context.fillStyle = bulbColor;
          context.shadowColor = bulbColor;
          context.shadowBlur = 10;
          context.beginPath();
          context.arc(x, y, Math.max(2.4, width * 0.003), 0, Math.PI * 2);
          context.fill();
        }
        context.shadowBlur = 0;

        context.strokeStyle = 'rgba(255,255,255,0.34)';
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(width * 0.12, height * 0.24);
        context.quadraticCurveTo(width * 0.5, height * 0.34, width * 0.88, height * 0.24);
        context.stroke();
        for (let index = 0; index < 13; index += 1) {
          const x = width * (0.14 + index * 0.06);
          const y = height * (0.255 + 0.055 * Math.sin((index / 12) * Math.PI));
          context.fillStyle = palette[index % palette.length];
          context.beginPath();
          context.moveTo(x - width * 0.012, y);
          context.lineTo(x + width * 0.012, y);
          context.lineTo(x, y + height * 0.038);
          context.closePath();
          context.fill();
        }

        [0.18, 0.82].forEach((position, index) => {
          const drumX = width * position;
          const drumY = height * 0.75;
          context.fillStyle = rgba(index === 0 ? '#ff355d' : '#22d3ee', 0.44);
          roundedRect(context, drumX - width * 0.038, drumY, width * 0.076, height * 0.12, 7);
          context.fill();
          context.strokeStyle = 'rgba(255,255,255,0.42)';
          context.stroke();
          context.beginPath();
          context.ellipse(drumX, drumY, width * 0.038, height * 0.016, 0, 0, Math.PI * 2);
          context.stroke();
        });
        return;
      }

      if (variant === 'ice') {
        const panels = [
          { x: 0.22, y: 0.32, radius: 0.12 },
          { x: 0.5, y: 0.27, radius: 0.15 },
          { x: 0.78, y: 0.32, radius: 0.12 },
        ];
        panels.forEach((panel, panelIndex) => {
          const radius = Math.min(width, height) * panel.radius;
          const centerX = width * panel.x;
          const centerY = height * panel.y;
          const panelGradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
          panelGradient.addColorStop(0, rgba(panelIndex === 1 ? '#ffffff' : colorA, 0.4));
          panelGradient.addColorStop(1, rgba('#1c5d9f', 0.08));
          context.fillStyle = panelGradient;
          context.strokeStyle = rgba('#bfe9ff', 0.42);
          context.lineWidth = Math.max(2, width * 0.002);
          context.beginPath();
          for (let corner = 0; corner < 6; corner += 1) {
            const angle = Math.PI / 6 + (corner / 6) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            if (corner === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.closePath();
          context.fill();
          context.stroke();
        });

        context.fillStyle = 'rgba(11, 39, 72, 0.5)';
        for (let index = 0; index < 14; index += 1) {
          const x = (index / 13) * width;
          const shardHeight = height * (0.07 + ((index * 19) % 8) / 75);
          context.beginPath();
          context.moveTo(x - width * 0.045, height);
          context.lineTo(x, height - shardHeight);
          context.lineTo(x + width * 0.045, height);
          context.closePath();
          context.fill();
          context.strokeStyle = rgba(index % 2 === 0 ? colorA : '#ffffff', 0.24);
          context.stroke();
        }

        context.save();
        context.globalCompositeOperation = 'screen';
        for (let index = 0; index < 6; index += 1) {
          const y = height * (0.58 + index * 0.055 + Math.sin(time * 0.25 + index) * 0.012);
          const fog = context.createLinearGradient(0, y, width, y);
          fog.addColorStop(0, 'rgba(180,225,255,0)');
          fog.addColorStop(0.5, 'rgba(180,225,255,0.09)');
          fog.addColorStop(1, 'rgba(180,225,255,0)');
          context.fillStyle = fog;
          context.fillRect(0, y, width, height * 0.035);
        }
        context.restore();
        return;
      }

      if (variant === 'summer') {
        const sunX = width * 0.5;
        const sunY = height * 0.34;
        const sunRadius = Math.min(width, height) * 0.16;
        context.save();
        context.globalCompositeOperation = 'lighter';
        const sunGlow = context.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2.1);
        sunGlow.addColorStop(0, rgba('#fff8a6', 0.74));
        sunGlow.addColorStop(0.34, rgba('#ffb703', 0.52));
        sunGlow.addColorStop(1, rgba('#ff5d8f', 0));
        context.fillStyle = sunGlow;
        context.beginPath();
        context.arc(sunX, sunY, sunRadius * 2.1, 0, Math.PI * 2);
        context.fill();
        const sunGradient = context.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
        sunGradient.addColorStop(0, '#fff36b');
        sunGradient.addColorStop(0.58, '#ffb703');
        sunGradient.addColorStop(1, '#ff5d8f');
        context.fillStyle = sunGradient;
        context.beginPath();
        context.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        context.fill();
        for (let index = 0; index < 12; index += 1) {
          const y = sunY - sunRadius * 0.7 + index * sunRadius * 0.12;
          context.strokeStyle = 'rgba(255,255,255,0.2)';
          context.lineWidth = Math.max(1, height * 0.002);
          context.beginPath();
          context.moveTo(sunX - sunRadius * 0.86, y);
          context.lineTo(sunX + sunRadius * 0.86, y);
          context.stroke();
        }
        context.restore();

        context.strokeStyle = 'rgba(255,255,255,0.28)';
        context.lineWidth = Math.max(1.2, width * 0.0014);
        context.beginPath();
        context.moveTo(width * 0.1, height * 0.25);
        context.quadraticCurveTo(width * 0.5, height * 0.34, width * 0.9, height * 0.25);
        context.stroke();
        for (let index = 0; index < 15; index += 1) {
          const progress = index / 14;
          const x = width * (0.1 + progress * 0.8);
          const y = height * (0.25 + Math.sin(progress * Math.PI) * 0.045);
          const bulb = palette[index % palette.length];
          context.fillStyle = bulb;
          context.shadowColor = bulb;
          context.shadowBlur = 9;
          context.beginPath();
          context.arc(x, y, Math.max(2, width * 0.0028), 0, Math.PI * 2);
          context.fill();
        }
        context.shadowBlur = 0;

        [0.08, 0.92].forEach((position, side) => {
          const baseX = width * position;
          const baseY = height * 0.9;
          const topX = baseX + (side === 0 ? width * 0.035 : -width * 0.035);
          const topY = height * 0.48;
          context.strokeStyle = 'rgba(2,12,15,0.86)';
          context.lineWidth = Math.max(8, width * 0.012);
          context.beginPath();
          context.moveTo(baseX, baseY);
          context.quadraticCurveTo(baseX, height * 0.66, topX, topY);
          context.stroke();
          context.lineWidth = Math.max(4, width * 0.006);
          for (let index = 0; index < 7; index += 1) {
            const angle = -Math.PI * 0.85 + index * (Math.PI * 0.27);
            context.beginPath();
            context.moveTo(topX, topY);
            context.quadraticCurveTo(
              topX + Math.cos(angle) * width * 0.055,
              topY + Math.sin(angle) * height * 0.08,
              topX + Math.cos(angle) * width * 0.085,
              topY + Math.sin(angle) * height * 0.12,
            );
            context.stroke();
          }
        });

        context.fillStyle = 'rgba(2,7,12,0.88)';
        context.fillRect(width * 0.16, height * 0.82, width * 0.68, height * 0.055);
        for (let index = 0; index < 18; index += 1) {
          const x = width * (0.19 + index * 0.036);
          context.fillStyle = rgba(palette[index % palette.length], 0.58);
          context.fillRect(x, height * 0.835, width * 0.018, height * 0.008);
        }
        return;
      }

      if (variant === 'spring') {
        const panelTop = height * 0.22;
        const panelHeight = height * 0.52;
        for (let index = 0; index < 6; index += 1) {
          const panelWidth = width * 0.095;
          const x = width * (0.2 + index * 0.12) - panelWidth / 2;
          const panelGradient = context.createLinearGradient(x, panelTop, x, panelTop + panelHeight);
          panelGradient.addColorStop(0, rgba(palette[index % palette.length], 0.46));
          panelGradient.addColorStop(1, rgba('#1b3440', 0.1));
          context.fillStyle = 'rgba(5,12,18,0.82)';
          roundedRect(context, x - 3, panelTop - 3, panelWidth + 6, panelHeight + 6, 20);
          context.fill();
          context.fillStyle = panelGradient;
          roundedRect(context, x, panelTop, panelWidth, panelHeight, 18);
          context.fill();
        }

        context.strokeStyle = 'rgba(83,145,94,0.7)';
        context.lineWidth = Math.max(5, width * 0.006);
        context.beginPath();
        context.ellipse(width * 0.5, height * 0.73, width * 0.4, height * 0.49, 0, Math.PI, Math.PI * 2);
        context.stroke();
        for (let index = 0; index < 32; index += 1) {
          const angle = Math.PI + (index / 31) * Math.PI;
          const x = width * 0.5 + Math.cos(angle) * width * 0.4;
          const y = height * 0.73 + Math.sin(angle) * height * 0.49;
          const flowerColor = palette[index % palette.length];
          context.fillStyle = flowerColor;
          context.shadowColor = flowerColor;
          context.shadowBlur = 7;
          for (let petal = 0; petal < 5; petal += 1) {
            const petalAngle = (petal / 5) * Math.PI * 2;
            context.beginPath();
            context.arc(
              x + Math.cos(petalAngle) * width * 0.006,
              y + Math.sin(petalAngle) * width * 0.006,
              Math.max(2, width * 0.0045),
              0,
              Math.PI * 2,
            );
            context.fill();
          }
          context.fillStyle = '#fff7a8';
          context.beginPath();
          context.arc(x, y, Math.max(1.5, width * 0.0028), 0, Math.PI * 2);
          context.fill();
        }
        context.shadowBlur = 0;

        context.save();
        context.globalCompositeOperation = 'lighter';
        HAZE_PARTICLES.slice(0, 30).forEach((particle, index) => {
          const x = (particle.x + Math.sin(time * 0.22 + particle.phase) * 0.04) * width;
          const y = ((particle.y + time * particle.speed * 0.025) % 1) * height;
          context.save();
          context.translate(x, y);
          context.rotate(time * 0.35 + particle.phase);
          context.fillStyle = rgba(palette[index % palette.length], 0.32);
          context.beginPath();
          context.ellipse(0, 0, width * 0.004, height * 0.009, 0, 0, Math.PI * 2);
          context.fill();
          context.restore();
        });
        context.restore();
        return;
      }

      if (variant === 'autumn') {
        const wallX = width * 0.15;
        const wallY = height * 0.23;
        const wallWidth = width * 0.7;
        const wallHeight = height * 0.5;
        context.fillStyle = 'rgba(18,8,3,0.9)';
        context.fillRect(wallX - 6, wallY - 6, wallWidth + 12, wallHeight + 12);
        for (let index = 0; index < 18; index += 1) {
          const slatWidth = wallWidth / 18;
          const slatGradient = context.createLinearGradient(0, wallY, 0, wallY + wallHeight);
          slatGradient.addColorStop(0, rgba(index % 2 === 0 ? '#8a4f2c' : '#5f321f', 0.66));
          slatGradient.addColorStop(1, rgba('#2a1208', 0.72));
          context.fillStyle = slatGradient;
          context.fillRect(wallX + index * slatWidth, wallY, slatWidth - 2, wallHeight);
        }

        context.strokeStyle = 'rgba(45,25,14,0.92)';
        context.lineWidth = Math.max(1.5, width * 0.0018);
        context.beginPath();
        context.moveTo(width * 0.1, height * 0.2);
        context.quadraticCurveTo(width * 0.5, height * 0.34, width * 0.9, height * 0.2);
        context.stroke();
        for (let index = 0; index < 13; index += 1) {
          const progress = index / 12;
          const x = width * (0.1 + progress * 0.8);
          const y = height * (0.2 + Math.sin(progress * Math.PI) * 0.07);
          const bulbGlow = context.createRadialGradient(x, y, 0, x, y, width * 0.018);
          bulbGlow.addColorStop(0, rgba('#fff1b8', 0.8));
          bulbGlow.addColorStop(1, rgba('#ff8c42', 0));
          context.fillStyle = bulbGlow;
          context.beginPath();
          context.arc(x, y, width * 0.018, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = '#ffd18a';
          context.beginPath();
          context.arc(x, y, Math.max(2, width * 0.003), 0, Math.PI * 2);
          context.fill();
        }

        [0.12, 0.88].forEach((position, sideIndex) => {
          const guitarX = width * position;
          const guitarY = height * 0.76;
          context.save();
          context.translate(guitarX, guitarY);
          context.rotate(sideIndex === 0 ? -0.12 : 0.12);
          context.fillStyle = rgba(sideIndex === 0 ? '#d97732' : '#b85c38', 0.76);
          context.beginPath();
          context.ellipse(0, height * 0.05, width * 0.028, height * 0.057, 0, 0, Math.PI * 2);
          context.fill();
          context.beginPath();
          context.ellipse(0, 0, width * 0.021, height * 0.042, 0, 0, Math.PI * 2);
          context.fill();
          context.fillRect(-width * 0.006, -height * 0.16, width * 0.012, height * 0.17);
          context.fillStyle = '#160b06';
          context.beginPath();
          context.arc(0, height * 0.02, width * 0.008, 0, Math.PI * 2);
          context.fill();
          context.restore();
        });

        HAZE_PARTICLES.slice(0, 34).forEach((particle, index) => {
          const x = (particle.x + Math.sin(time * 0.18 + particle.phase) * 0.05) * width;
          const y = ((particle.y + time * particle.speed * 0.04) % 1) * height;
          context.save();
          context.translate(x, y);
          context.rotate(time * 0.42 + particle.phase);
          context.fillStyle = rgba(palette[index % palette.length], 0.38);
          context.beginPath();
          context.ellipse(0, 0, width * 0.005, height * 0.011, 0.55, 0, Math.PI * 2);
          context.fill();
          context.restore();
        });
        return;
      }

      if (variant === 'winter') {
        const mountainBase = height * 0.75;
        const mountainPanels = [
          { x: 0.08, width: 0.3, peak: 0.29 },
          { x: 0.3, width: 0.4, peak: 0.2 },
          { x: 0.62, width: 0.31, peak: 0.31 },
        ];
        mountainPanels.forEach((mountain, index) => {
          const gradient = context.createLinearGradient(0, height * mountain.peak, 0, mountainBase);
          gradient.addColorStop(0, rgba('#ffffff', 0.32));
          gradient.addColorStop(0.45, rgba(palette[index % palette.length], 0.28));
          gradient.addColorStop(1, rgba('#173766', 0.18));
          context.fillStyle = gradient;
          context.strokeStyle = rgba('#dff8ff', 0.3);
          context.lineWidth = Math.max(2, width * 0.0018);
          context.beginPath();
          context.moveTo(width * mountain.x, mountainBase);
          context.lineTo(width * (mountain.x + mountain.width * 0.5), height * mountain.peak);
          context.lineTo(width * (mountain.x + mountain.width), mountainBase);
          context.closePath();
          context.fill();
          context.stroke();
        });

        const snowflakeX = width * 0.5;
        const snowflakeY = height * 0.29;
        const snowflakeRadius = Math.min(width, height) * 0.095;
        context.save();
        context.globalCompositeOperation = 'lighter';
        context.strokeStyle = rgba('#ffffff', 0.48);
        context.shadowColor = colorA;
        context.shadowBlur = 16;
        context.lineWidth = Math.max(2, width * 0.002);
        for (let arm = 0; arm < 6; arm += 1) {
          const angle = (arm / 6) * Math.PI * 2;
          context.beginPath();
          context.moveTo(snowflakeX, snowflakeY);
          context.lineTo(
            snowflakeX + Math.cos(angle) * snowflakeRadius,
            snowflakeY + Math.sin(angle) * snowflakeRadius,
          );
          context.stroke();
        }
        context.restore();

        context.fillStyle = rgba('#c8f2ff', 0.28);
        for (let index = 0; index < 22; index += 1) {
          const x = width * (0.03 + index * 0.045);
          const icicleHeight = height * (0.025 + ((index * 17) % 8) / 150);
          context.beginPath();
          context.moveTo(x - width * 0.008, height * 0.11);
          context.lineTo(x, height * 0.11 + icicleHeight);
          context.lineTo(x + width * 0.008, height * 0.11);
          context.closePath();
          context.fill();
        }

        context.fillStyle = 'rgba(4,15,32,0.88)';
        for (let index = 0; index < 4; index += 1) {
          context.fillRect(
            width * (0.18 + index * 0.04),
            height * (0.79 + index * 0.026),
            width * (0.64 - index * 0.08),
            height * 0.025,
          );
        }
        return;
      }

      if (variant === 'cosmic') {
        const planetX = width * 0.5;
        const planetY = height * 0.32;
        const planetRadius = Math.min(width, height) * 0.14;
        context.save();
        context.globalCompositeOperation = 'lighter';
        context.strokeStyle = rgba('#00e5ff', 0.22);
        context.lineWidth = Math.max(2, width * 0.002);
        for (let index = 0; index < 4; index += 1) {
          context.beginPath();
          context.ellipse(
            planetX,
            planetY,
            planetRadius * (1.45 + index * 0.34),
            planetRadius * (0.42 + index * 0.11),
            time * 0.04 + index * 0.4,
            0,
            Math.PI * 2,
          );
          context.stroke();
        }
        const planetGlow = context.createRadialGradient(
          planetX - planetRadius * 0.3,
          planetY - planetRadius * 0.35,
          planetRadius * 0.08,
          planetX,
          planetY,
          planetRadius * 1.8,
        );
        planetGlow.addColorStop(0, rgba('#ffffff', 0.75));
        planetGlow.addColorStop(0.32, rgba(colorA, 0.6));
        planetGlow.addColorStop(1, rgba('#1a0b47', 0));
        context.fillStyle = planetGlow;
        context.beginPath();
        context.arc(planetX, planetY, planetRadius * 1.8, 0, Math.PI * 2);
        context.fill();
        context.restore();

        [0.14, 0.86].forEach((position, sideIndex) => {
          const centerX = width * position;
          const centerY = height * 0.48;
          const panelRadius = Math.min(width, height) * 0.11;
          context.fillStyle = rgba(sideIndex === 0 ? '#162b66' : '#401766', 0.44);
          context.strokeStyle = rgba(palette[(sideIndex + 1) % palette.length], 0.4);
          context.lineWidth = Math.max(2, width * 0.002);
          context.beginPath();
          for (let corner = 0; corner < 6; corner += 1) {
            const angle = (corner / 6) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * panelRadius;
            const y = centerY + Math.sin(angle) * panelRadius;
            if (corner === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.closePath();
          context.fill();
          context.stroke();
        });

        context.save();
        context.globalCompositeOperation = 'lighter';
        for (let index = 0; index < 44; index += 1) {
          const x = (((index * 61) % 107) / 106) * width;
          const y = (((index * 37 + 9) % 89) / 88) * height;
          const twinkle = 0.22 + 0.5 * Math.max(0, Math.sin(time * 1.8 + index));
          context.fillStyle = rgba(index % 6 === 0 ? colorA : '#ffffff', twinkle);
          context.beginPath();
          context.arc(x, y, Math.max(1, width * (0.001 + (index % 3) * 0.0004)), 0, Math.PI * 2);
          context.fill();
        }
        context.restore();

        context.strokeStyle = rgba('#8c7dff', 0.36);
        context.lineWidth = Math.max(3, width * 0.004);
        for (let index = 0; index < 3; index += 1) {
          context.beginPath();
          context.ellipse(
            width * 0.5,
            height * (0.82 + index * 0.035),
            width * (0.3 - index * 0.045),
            height * 0.045,
            0,
            0,
            Math.PI * 2,
          );
          context.stroke();
        }
        return;
      }

      if (variant === 'ocean') {
        const waterGradient = context.createLinearGradient(0, 0, 0, height);
        waterGradient.addColorStop(0, 'rgba(0, 90, 135, 0.34)');
        waterGradient.addColorStop(0.48, 'rgba(0, 35, 74, 0.26)');
        waterGradient.addColorStop(1, 'rgba(0, 8, 24, 0.72)');
        context.fillStyle = waterGradient;
        context.fillRect(0, 0, width, height);

        context.save();
        context.globalCompositeOperation = 'screen';
        for (let index = 0; index < 7; index += 1) {
          const sourceX = width * (0.08 + index * 0.14);
          const sway = Math.sin(time * 0.28 + index) * width * 0.08;
          const ray = context.createLinearGradient(sourceX, 0, sourceX + sway, height * 0.86);
          ray.addColorStop(0, rgba(index % 2 === 0 ? '#bffcff' : colorA, 0.18));
          ray.addColorStop(1, rgba(colorA, 0));
          context.fillStyle = ray;
          context.beginPath();
          context.moveTo(sourceX - width * 0.018, 0);
          context.lineTo(sourceX + width * 0.018, 0);
          context.lineTo(sourceX + sway + width * 0.12, height * 0.86);
          context.lineTo(sourceX + sway - width * 0.12, height * 0.86);
          context.closePath();
          context.fill();
        }
        context.restore();

        context.strokeStyle = rgba('#bffcff', 0.24);
        context.lineWidth = Math.max(1.5, width * 0.0018);
        for (let wave = 0; wave < 5; wave += 1) {
          const y = height * (0.08 + wave * 0.035);
          context.beginPath();
          for (let point = 0; point <= 40; point += 1) {
            const x = (point / 40) * width;
            const waveY = y + Math.sin(point * 0.72 + time * 0.7 + wave) * height * 0.008;
            if (point === 0) context.moveTo(x, waveY);
            else context.lineTo(x, waveY);
          }
          context.stroke();
        }

        for (let index = 0; index < 6; index += 1) {
          const centerX = width * (0.12 + index * 0.155) + Math.sin(time * 0.25 + index) * width * 0.025;
          const centerY =
            height * (0.28 + (index % 3) * 0.17) + Math.sin(time * 0.48 + index * 1.7) * height * 0.035;
          const radius = Math.min(width, height) * (0.032 + (index % 2) * 0.012);
          const jellyColor = palette[index % palette.length];
          const jellyGlow = context.createRadialGradient(
            centerX,
            centerY,
            0,
            centerX,
            centerY,
            radius * 2.2,
          );
          jellyGlow.addColorStop(0, rgba(jellyColor, 0.55));
          jellyGlow.addColorStop(1, rgba(jellyColor, 0));
          context.fillStyle = jellyGlow;
          context.beginPath();
          context.arc(centerX, centerY, radius * 2.2, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = rgba(jellyColor, 0.48);
          context.beginPath();
          context.arc(centerX, centerY, radius, Math.PI, 0);
          context.quadraticCurveTo(centerX + radius * 0.55, centerY + radius * 0.5, centerX, centerY + radius * 0.28);
          context.quadraticCurveTo(centerX - radius * 0.55, centerY + radius * 0.5, centerX - radius, centerY);
          context.fill();
          context.strokeStyle = rgba(jellyColor, 0.5);
          context.lineWidth = Math.max(1, width * 0.0012);
          for (let tentacle = -2; tentacle <= 2; tentacle += 1) {
            context.beginPath();
            context.moveTo(centerX + tentacle * radius * 0.3, centerY + radius * 0.2);
            for (let segment = 1; segment <= 6; segment += 1) {
              const y = centerY + radius * (0.25 + segment * 0.28);
              const x =
                centerX +
                tentacle * radius * 0.3 +
                Math.sin(time * 1.2 + segment * 0.8 + tentacle) * radius * 0.18;
              context.lineTo(x, y);
            }
            context.stroke();
          }
        }

        context.fillStyle = 'rgba(1, 20, 31, 0.9)';
        for (let index = 0; index < 18; index += 1) {
          const x = (index / 17) * width;
          const coralHeight = height * (0.05 + ((index * 13) % 9) / 55);
          context.beginPath();
          context.moveTo(x - width * 0.025, height);
          context.quadraticCurveTo(x - width * 0.012, height - coralHeight * 0.6, x, height - coralHeight);
          context.quadraticCurveTo(x + width * 0.014, height - coralHeight * 0.5, x + width * 0.03, height);
          context.closePath();
          context.fill();
        }
        return;
      }

      if (variant === 'enchanted') {
        const moonX = width * 0.5;
        const moonY = height * 0.28;
        const moonRadius = Math.min(width, height) * 0.16;
        const moonGlow = context.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonRadius * 2.4);
        moonGlow.addColorStop(0, rgba('#e8fff0', 0.52));
        moonGlow.addColorStop(0.42, rgba(colorA, 0.18));
        moonGlow.addColorStop(1, rgba(colorA, 0));
        context.fillStyle = moonGlow;
        context.beginPath();
        context.arc(moonX, moonY, moonRadius * 2.4, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = 'rgba(220,255,230,0.18)';
        context.beginPath();
        context.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        context.fill();

        [0.06, 0.94].forEach((position, sideIndex) => {
          const baseX = width * position;
          context.strokeStyle = 'rgba(4,24,17,0.95)';
          context.lineWidth = Math.max(22, width * 0.035);
          context.beginPath();
          context.moveTo(baseX, height);
          context.quadraticCurveTo(
            baseX + (sideIndex === 0 ? width * 0.02 : -width * 0.02),
            height * 0.48,
            baseX + (sideIndex === 0 ? width * 0.16 : -width * 0.16),
            height * 0.13,
          );
          context.stroke();
          context.lineWidth = Math.max(6, width * 0.009);
          for (let branch = 0; branch < 7; branch += 1) {
            const startY = height * (0.24 + branch * 0.09);
            const direction = sideIndex === 0 ? 1 : -1;
            context.beginPath();
            context.moveTo(baseX, startY);
            context.quadraticCurveTo(
              baseX + direction * width * 0.1,
              startY - height * 0.05,
              baseX + direction * width * (0.18 + (branch % 2) * 0.04),
              startY - height * 0.1,
            );
            context.stroke();
          }
        });

        context.save();
        context.globalCompositeOperation = 'lighter';
        for (let index = 0; index < 62; index += 1) {
          const x = (((index * 47) % 103) / 102) * width;
          const y = (((index * 79) % 101) / 100) * height;
          const driftX = Math.sin(time * 0.42 + index) * width * 0.018;
          const driftY = Math.cos(time * 0.33 + index * 0.7) * height * 0.018;
          const fireflyColor = palette[index % palette.length];
          const glowRadius = Math.max(4, width * (0.004 + (index % 4) * 0.001));
          const glow = context.createRadialGradient(x + driftX, y + driftY, 0, x + driftX, y + driftY, glowRadius);
          glow.addColorStop(0, rgba(fireflyColor, 0.72));
          glow.addColorStop(1, rgba(fireflyColor, 0));
          context.fillStyle = glow;
          context.beginPath();
          context.arc(x + driftX, y + driftY, glowRadius, 0, Math.PI * 2);
          context.fill();
        }
        context.restore();

        context.fillStyle = 'rgba(2,17,12,0.94)';
        context.beginPath();
        context.moveTo(0, height);
        for (let index = 0; index <= 34; index += 1) {
          const x = (index / 34) * width;
          const y = height * (0.88 - (((index * 23) % 8) / 110));
          context.lineTo(x, y);
        }
        context.lineTo(width, height);
        context.closePath();
        context.fill();
        return;
      }

      if (variant === 'city') {
        const horizon = height * 0.7;
        const buildingCount = 21;
        for (let index = 0; index < buildingCount; index += 1) {
          const buildingWidth = width / buildingCount + width * 0.006;
          const buildingHeight = height * (0.18 + ((index * 31) % 24) / 52);
          const x = index * (width / buildingCount) - width * 0.003;
          const y = horizon - buildingHeight;
          const facade = context.createLinearGradient(x, y, x + buildingWidth, horizon);
          facade.addColorStop(0, index % 3 === 0 ? '#101a39' : '#080d22');
          facade.addColorStop(1, '#02040e');
          context.fillStyle = facade;
          context.fillRect(x, y, buildingWidth, buildingHeight);
          context.strokeStyle = rgba(palette[index % palette.length], 0.2);
          context.strokeRect(x, y, buildingWidth, buildingHeight);
          for (let row = 0; row < 6; row += 1) {
            for (let column = 0; column < 3; column += 1) {
              if ((index + row + column) % 3 === 0) continue;
              const flicker = 0.2 + 0.24 * Math.max(0, Math.sin(time * 1.6 + index + row));
              context.fillStyle = rgba(palette[(index + row) % palette.length], flicker);
              context.fillRect(
                x + buildingWidth * (0.16 + column * 0.28),
                y + buildingHeight * (0.12 + row * 0.13),
                buildingWidth * 0.1,
                buildingHeight * 0.045,
              );
            }
          }
        }

        const roadGradient = context.createLinearGradient(0, horizon, 0, height);
        roadGradient.addColorStop(0, 'rgba(9,13,28,0.92)');
        roadGradient.addColorStop(1, 'rgba(0,1,6,0.98)');
        context.fillStyle = roadGradient;
        context.fillRect(0, horizon, width, height - horizon);
        context.strokeStyle = rgba('#00e5ff', 0.2);
        context.lineWidth = 1;
        for (let index = -8; index <= 8; index += 1) {
          context.beginPath();
          context.moveTo(width * 0.5, horizon);
          context.lineTo(width * 0.5 + index * width * 0.09, height);
          context.stroke();
        }

        context.save();
        context.globalCompositeOperation = 'lighter';
        for (let index = 0; index < 7; index += 1) {
          const progress = (time * (0.18 + index * 0.012) + index * 0.17) % 1;
          const y = horizon + progress * progress * (height - horizon);
          const spread = progress * width * 0.42;
          const color = index % 2 === 0 ? '#00e5ff' : '#ff2bd6';
          context.strokeStyle = rgba(color, 0.5);
          context.lineWidth = Math.max(1.5, width * 0.0025 * (0.4 + progress));
          context.beginPath();
          context.moveTo(width * 0.5 - spread, y);
          context.lineTo(width * 0.5 - spread - width * 0.08, y + height * 0.012);
          context.moveTo(width * 0.5 + spread, y);
          context.lineTo(width * 0.5 + spread + width * 0.08, y + height * 0.012);
          context.stroke();
        }
        context.restore();

        context.strokeStyle = 'rgba(135,215,255,0.15)';
        context.lineWidth = 1;
        for (let index = 0; index < 45; index += 1) {
          const x = (((index * 71) % 101) / 100) * width;
          const y = (((index * 43) % 97) / 96) * height;
          const rainOffset = (time * 90 + index * 17) % height;
          context.beginPath();
          context.moveTo(x, (y + rainOffset) % height);
          context.lineTo(x - width * 0.008, ((y + rainOffset) % height) + height * 0.035);
          context.stroke();
        }
        return;
      }

      if (variant === 'volcano') {
        const craterX = width * 0.5;
        const craterY = height * 0.52;
        const mountainGradient = context.createLinearGradient(0, craterY, 0, height);
        mountainGradient.addColorStop(0, '#38110b');
        mountainGradient.addColorStop(0.55, '#160807');
        mountainGradient.addColorStop(1, '#050203');
        context.fillStyle = mountainGradient;
        context.beginPath();
        context.moveTo(width * 0.08, height);
        context.lineTo(width * 0.33, height * 0.68);
        context.lineTo(width * 0.43, craterY);
        context.quadraticCurveTo(craterX, craterY + height * 0.035, width * 0.57, craterY);
        context.lineTo(width * 0.68, height * 0.68);
        context.lineTo(width * 0.94, height);
        context.closePath();
        context.fill();

        const craterGlow = context.createRadialGradient(craterX, craterY, 0, craterX, craterY, width * 0.22);
        craterGlow.addColorStop(0, rgba('#fff2a0', 0.72));
        craterGlow.addColorStop(0.24, rgba('#ff4d00', 0.62));
        craterGlow.addColorStop(1, rgba('#ff2d20', 0));
        context.fillStyle = craterGlow;
        context.beginPath();
        context.ellipse(craterX, craterY, width * 0.22, height * 0.12, 0, 0, Math.PI * 2);
        context.fill();

        context.save();
        context.globalCompositeOperation = 'lighter';
        for (let stream = 0; stream < 5; stream += 1) {
          const startX = craterX + (stream - 2) * width * 0.022;
          context.strokeStyle = rgba(stream % 2 === 0 ? '#ffb000' : '#ff4d00', 0.64);
          context.lineWidth = width * (0.006 + (stream % 2) * 0.004);
          context.beginPath();
          context.moveTo(startX, craterY + height * 0.015);
          context.bezierCurveTo(
            startX + Math.sin(time * 0.5 + stream) * width * 0.035,
            height * 0.68,
            startX + (stream - 2) * width * 0.04,
            height * 0.82,
            startX + (stream - 2) * width * 0.06,
            height,
          );
          context.stroke();
        }
        for (let index = 0; index < 58; index += 1) {
          const life = (time * (0.18 + (index % 7) * 0.012) + index * 0.071) % 1;
          const spread = Math.sin(index * 8.3) * width * 0.28 * life;
          const x = craterX + spread;
          const y = craterY - Math.sin(life * Math.PI) * height * (0.18 + (index % 5) * 0.025);
          const size = Math.max(1.5, width * (0.0016 + (index % 4) * 0.0006));
          context.fillStyle = rgba(palette[index % palette.length], 0.75 * (1 - life));
          context.beginPath();
          context.arc(x, y, size, 0, Math.PI * 2);
          context.fill();
        }
        context.restore();

        for (let index = 0; index < 12; index += 1) {
          const x = craterX + Math.sin(index * 4.8) * width * 0.11;
          const y = craterY - height * (0.08 + index * 0.028) - Math.sin(time * 0.24 + index) * height * 0.02;
          const radius = width * (0.02 + index * 0.0025);
          context.fillStyle = `rgba(48,38,44,${0.13 + index * 0.012})`;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        }
        return;
      }

      if (variant === 'candy') {
        const rainbowCenterX = width * 0.5;
        const rainbowCenterY = height * 0.72;
        context.lineCap = 'round';
        for (let index = 0; index < 6; index += 1) {
          context.strokeStyle = rgba(palette[index % palette.length], 0.32);
          context.lineWidth = Math.max(9, width * 0.013);
          context.beginPath();
          context.ellipse(
            rainbowCenterX,
            rainbowCenterY,
            width * (0.38 - index * 0.022),
            height * (0.48 - index * 0.03),
            0,
            Math.PI,
            Math.PI * 2,
          );
          context.stroke();
        }
        context.lineCap = 'butt';

        const hillGradient = context.createLinearGradient(0, height * 0.68, 0, height);
        hillGradient.addColorStop(0, rgba('#ff71ce', 0.54));
        hillGradient.addColorStop(1, rgba('#6a2e84', 0.72));
        context.fillStyle = hillGradient;
        context.beginPath();
        context.moveTo(0, height);
        context.lineTo(0, height * 0.78);
        context.bezierCurveTo(width * 0.16, height * 0.64, width * 0.28, height * 0.86, width * 0.44, height * 0.73);
        context.bezierCurveTo(width * 0.58, height * 0.62, width * 0.76, height * 0.84, width, height * 0.68);
        context.lineTo(width, height);
        context.closePath();
        context.fill();

        [0.12, 0.28, 0.72, 0.88].forEach((position, index) => {
          const stickTop = height * (0.5 + (index % 2) * 0.08);
          const candyColor = palette[index % palette.length];
          context.strokeStyle = 'rgba(255,245,230,0.72)';
          context.lineWidth = Math.max(4, width * 0.005);
          context.beginPath();
          context.moveTo(width * position, height * 0.86);
          context.lineTo(width * position, stickTop);
          context.stroke();
          context.strokeStyle = candyColor;
          context.lineWidth = Math.max(6, width * 0.008);
          context.beginPath();
          for (let segment = 0; segment < 36; segment += 1) {
            const angle = segment * 0.48 + time * 0.35;
            const radius = width * 0.0018 * segment;
            const x = width * position + Math.cos(angle) * radius;
            const y = stickTop + Math.sin(angle) * radius;
            if (segment === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.stroke();
        });

        for (let index = 0; index < 9; index += 1) {
          const cloudX = width * (0.08 + ((index * 23) % 83) / 100);
          const cloudY = height * (0.12 + ((index * 31) % 36) / 100) + Math.sin(time * 0.2 + index) * height * 0.012;
          const cloudColor = palette[index % palette.length];
          context.fillStyle = rgba(cloudColor, 0.2);
          for (let puff = 0; puff < 4; puff += 1) {
            context.beginPath();
            context.arc(
              cloudX + (puff - 1.5) * width * 0.012,
              cloudY - (puff % 2) * height * 0.008,
              width * 0.018,
              0,
              Math.PI * 2,
            );
            context.fill();
          }
        }

        HAZE_PARTICLES.slice(0, 44).forEach((particle, index) => {
          const x = (particle.x + Math.sin(time * 0.32 + particle.phase) * 0.035) * width;
          const y = ((particle.y + time * particle.speed * 0.035) % 1) * height;
          context.save();
          context.translate(x, y);
          context.rotate(time * 0.5 + particle.phase);
          context.fillStyle = rgba(palette[index % palette.length], 0.44);
          roundedRect(context, -width * 0.004, -height * 0.006, width * 0.008, height * 0.012, 2);
          context.fill();
          context.restore();
        });
      }
    };

    const drawBeam = (
      fixtureX: number,
      fixtureY: number,
      targetX: number,
      targetY: number,
      color: string,
      pulse: number,
    ) => {
      const direction = Math.atan2(targetY - fixtureY, targetX - fixtureX);
      const startWidth = Math.max(3, width * 0.0045);
      const endWidth = width * (0.065 + pulse * 0.014) * profile.beamWidth;
      const normalX = -Math.sin(direction);
      const normalY = Math.cos(direction);
      const beamGradient = context.createLinearGradient(fixtureX, fixtureY, targetX, targetY);
      beamGradient.addColorStop(0, rgba(color, 0.56 * pulse * profile.beamOpacity));
      beamGradient.addColorStop(0.22, rgba(color, 0.25 * pulse * profile.beamOpacity));
      beamGradient.addColorStop(1, rgba(color, 0.025));

      context.beginPath();
      context.moveTo(fixtureX + normalX * startWidth, fixtureY + normalY * startWidth);
      context.lineTo(targetX + normalX * endWidth, targetY + normalY * endWidth * 0.35);
      context.lineTo(targetX - normalX * endWidth, targetY - normalY * endWidth * 0.35);
      context.lineTo(fixtureX - normalX * startWidth, fixtureY - normalY * startWidth);
      context.closePath();
      context.fillStyle = beamGradient;
      context.fill();

      const glowRadius = endWidth * 1.28;
      const floorGlow = context.createRadialGradient(targetX, targetY, 0, targetX, targetY, glowRadius);
      floorGlow.addColorStop(0, rgba(color, 0.68 * pulse * profile.beamOpacity));
      floorGlow.addColorStop(0.34, rgba(color, 0.28 * pulse * profile.beamOpacity));
      floorGlow.addColorStop(1, rgba(color, 0));
      context.save();
      context.translate(targetX, targetY);
      context.scale(1, 0.24);
      context.fillStyle = floorGlow;
      context.beginPath();
      context.arc(0, 0, glowRadius, 0, Math.PI * 2);
      context.fill();
      context.restore();
    };

    const drawFixture = (
      anchorX: number,
      anchorY: number,
      targetX: number,
      targetY: number,
      color: string,
      pulse: number,
    ) => {
      const scale = Math.max(0.62, Math.min(width, height) / 620);
      const headWidth = 34 * scale;
      const headHeight = 45 * scale;
      const angle = Math.atan2(targetY - anchorY, targetX - anchorX) - Math.PI / 2;

      context.save();
      context.translate(anchorX, anchorY);

      context.strokeStyle = 'rgba(194, 209, 230, 0.58)';
      context.lineWidth = 3 * scale;
      context.beginPath();
      context.moveTo(-22 * scale, -8 * scale);
      context.lineTo(-22 * scale, 17 * scale);
      context.quadraticCurveTo(-22 * scale, 27 * scale, -12 * scale, 27 * scale);
      context.moveTo(22 * scale, -8 * scale);
      context.lineTo(22 * scale, 17 * scale);
      context.quadraticCurveTo(22 * scale, 27 * scale, 12 * scale, 27 * scale);
      context.stroke();

      context.fillStyle = '#111625';
      roundedRect(context, -29 * scale, -16 * scale, 58 * scale, 13 * scale, 4 * scale);
      context.fill();
      context.strokeStyle = 'rgba(255,255,255,0.22)';
      context.lineWidth = scale;
      context.stroke();

      context.rotate(angle);
      context.shadowColor = rgba(color, 0.6);
      context.shadowBlur = 11 * scale * pulse;
      const housingGradient = context.createLinearGradient(0, -headHeight / 2, 0, headHeight / 2);
      housingGradient.addColorStop(0, '#283047');
      housingGradient.addColorStop(0.48, '#090c15');
      housingGradient.addColorStop(1, '#191d2d');
      context.fillStyle = housingGradient;
      roundedRect(
        context,
        -headWidth / 2,
        -headHeight / 2,
        headWidth,
        headHeight,
        9 * scale,
      );
      context.fill();
      context.shadowBlur = 0;
      context.strokeStyle = 'rgba(255,255,255,0.34)';
      context.lineWidth = 1.25 * scale;
      context.stroke();

      context.fillStyle = rgba(color, 0.95);
      context.shadowColor = color;
      context.shadowBlur = 18 * scale * pulse;
      context.beginPath();
      context.ellipse(0, headHeight * 0.34, headWidth * 0.31, headWidth * 0.18, 0, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      context.fillStyle = 'rgba(255,255,255,0.82)';
      context.beginPath();
      context.ellipse(
        -headWidth * 0.08,
        headHeight * 0.31,
        headWidth * 0.08,
        headWidth * 0.045,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.restore();
    };

    const draw = (timeMs: number) => {
      const time = reducedMotion ? 1.7 : timeMs / 1000;
      context.clearRect(0, 0, width, height);

      const background = context.createRadialGradient(
        width * 0.5,
        height * 0.55,
        0,
        width * 0.5,
        height * 0.48,
        Math.max(width, height) * 0.78,
      );
      background.addColorStop(0, rgba(colorA, 0.17));
      background.addColorStop(0.42, rgba(colorB, 0.96));
      background.addColorStop(1, '#010107');
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      const stageGlow = context.createLinearGradient(0, height * 0.54, 0, height);
      stageGlow.addColorStop(0, 'rgba(15, 10, 35, 0)');
      stageGlow.addColorStop(1, 'rgba(8, 2, 23, 0.86)');
      context.fillStyle = stageGlow;
      context.fillRect(0, height * 0.54, width, height * 0.46);

      drawVenuePersonality(time);

      if (showRig) {
        context.save();
        context.globalCompositeOperation = 'lighter';
        MOVING_HEADS.forEach((head, index) => {
          const position = lightPosition(head, index, time);
          drawBeam(
            position.fixtureX,
            position.fixtureY + height * 0.05,
            position.targetX,
            position.targetY,
            position.color,
            position.beat,
          );
        });
        context.restore();
      }

      context.save();
      context.globalCompositeOperation = 'screen';
      HAZE_PARTICLES.forEach((particle, index) => {
        const drift = Math.sin(time * particle.speed + particle.phase) * width * 0.025;
        const rise = (particle.y - time * particle.speed * 0.04 + 2) % 1;
        const opacity = 0.1 + ((index * 17) % 10) / 90;
        context.fillStyle = index % 5 === 0 ? rgba(colorA, opacity) : `rgba(220,235,255,${opacity})`;
        context.beginPath();
        context.arc(
          particle.x * width + drift,
          rise * height,
          particle.radius * Math.max(0.7, width / 980),
          0,
          Math.PI * 2,
        );
        context.fill();
      });
      context.restore();

      if (showRig) {
        const trussY = height * 0.078;
        const trussHeight = Math.max(18, height * 0.035);
        context.strokeStyle = 'rgba(139, 156, 184, 0.48)';
        context.lineWidth = Math.max(1, height * 0.0024);
        context.beginPath();
        context.moveTo(0, trussY);
        context.lineTo(width, trussY);
        context.moveTo(0, trussY + trussHeight);
        context.lineTo(width, trussY + trussHeight);
        const cellWidth = Math.max(52, width / 14);
        for (let x = -cellWidth; x < width + cellWidth; x += cellWidth) {
          context.moveTo(x, trussY);
          context.lineTo(x + cellWidth, trussY + trussHeight);
          context.moveTo(x + cellWidth, trussY);
          context.lineTo(x, trussY + trussHeight);
        }
        context.stroke();

        MOVING_HEADS.forEach((head, index) => {
          const position = lightPosition(head, index, time);
          drawFixture(
            position.fixtureX,
            position.fixtureY,
            position.targetX,
            position.targetY,
            position.color,
            position.beat,
          );
        });
      }

      if (!reducedMotion) animationFrame = requestAnimationFrame(draw);
    };

    resize();
    draw(0);
    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reducedMotion) draw(0);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [colorA, colorB, showRig, variant]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full ${className}`} />;
}
