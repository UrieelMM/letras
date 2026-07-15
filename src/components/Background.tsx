import type { BackgroundConfig } from '../types';
import AuroraBlur from './aurora-blur';
import ChromaWaves from './chroma-waves';
import ColorLoops from './color-loops';
import DitherWave from './dither-wave';
import FallingRays from './falling-rays';
import GlitterWarp from './glitter-warp';
import LightDroplets from './light-droplets';
import LiquidBars from './liquid-bars';
import LiquidLines from './liquid-lines';
import Lightspeed from './lightspeed';
import Mosaic from './mosaic';
import Portal from './portal';
import RadialLiquid from './radial-liquid';
import RisingLines from './rising-lines';
import RotatingStars from './rotating-stars';
import ShaderWaves from './shader-waves';
import SilkWaves from './silk-waves';
import SquircleShift from './squircle-shift';
import StarBurst from './star-burst';
import { ThreeBackground } from './ThreeBackground';

interface Props {
  bg: BackgroundConfig;
}

export function Background({ bg }: Props) {
  switch (bg.kind) {
    case 'solid':
      return <div className="absolute inset-0" style={{ background: bg.color }} />;
    case 'gradient':
      return (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})` }}
        />
      );
    case 'image':
      return (
        <div
          className="absolute inset-0 bg-center"
          style={{ backgroundImage: `url(${bg.url})`, backgroundSize: bg.fit }}
        />
      );
    case 'animated':
      if (bg.preset === 'shaderWaves') {
        return (
          <ShaderWaves
            width="100%"
            height="100%"
            color1={bg.colorA}
            color2={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'glitterWarp') {
        return (
          <GlitterWarp
            width="100%"
            height="100%"
            color={bg.colorA}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'lightDroplets') {
        return (
          <LightDroplets
            width="100%"
            height="100%"
            color={bg.colorA}
            speed={0.5}
            thickness={0.4}
            rotation={45}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'lightspeed') {
        return (
          <Lightspeed
            width="100%"
            height="100%"
            primaryColor={bg.colorA}
            secondaryColor={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'ditherWave') {
        return (
          <DitherWave
            width="100%"
            height="100%"
            primaryColor={bg.colorA}
            secondaryColor={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'radialLiquid') {
        return (
          <RadialLiquid
            width="100%"
            height="100%"
            color1={bg.colorA}
            color2={bg.colorB}
            backgroundColor={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'chromaWaves') {
        return (
          <ChromaWaves
            width="100%"
            height="100%"
            color={bg.colorA}
            backgroundColor={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'mosaic') {
        return (
          <Mosaic
            width="100%"
            height="100%"
            variant="shader"
            color1={bg.colorA}
            color2={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'portal') {
        return (
          <div className="absolute inset-0 overflow-hidden" style={{ background: bg.colorB }}>
            <Portal primaryColor={bg.colorA} secondaryColor={bg.colorB} />
          </div>
        );
      }
      if (bg.preset === 'risingLines') {
        return (
          <div className="absolute inset-0 overflow-hidden bg-black">
            <RisingLines color={bg.colorA} horizonColor={bg.colorB} haloColor={bg.colorA} />
          </div>
        );
      }
      if (bg.preset === 'colorLoops') {
        return <ColorLoops className="absolute inset-0" />;
      }
      if (bg.preset === 'rotatingStars') {
        return (
          <div className="absolute inset-0 overflow-hidden" style={{ background: bg.colorB }}>
            <RotatingStars color={bg.colorA} />
          </div>
        );
      }
      if (bg.preset === 'starBurst') {
        return (
          <div className="absolute inset-0 overflow-hidden" style={{ background: bg.colorB }}>
            <StarBurst color={bg.colorA} />
          </div>
        );
      }
      if (bg.preset === 'silkWaves') {
        return (
          <div className="absolute inset-0 overflow-hidden" style={{ background: bg.colorB }}>
            <SilkWaves colors={[bg.colorA, bg.colorB]} />
          </div>
        );
      }
      if (bg.preset === 'fallingRays') {
        return (
          <div className="absolute inset-0 overflow-hidden" style={{ background: bg.colorB }}>
            <FallingRays color1={bg.colorA} color2={bg.colorB} />
          </div>
        );
      }
      if (bg.preset === 'liquidBars') {
        return (
          <LiquidBars
            width="100%"
            height="100%"
            color={bg.colorA}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'auroraBlur') {
        return (
          <div className="absolute inset-0 overflow-hidden" style={{ background: bg.colorB }}>
            <AuroraBlur width="100%" height="100%" />
          </div>
        );
      }
      if (bg.preset === 'liquidLines') {
        return (
          <LiquidLines
            width="100%"
            height="100%"
            lineColor={bg.colorA}
            lightBackground={bg.colorB}
            darkBackground={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'squircleShift') {
        return (
          <SquircleShift
            width="100%"
            height="100%"
            colorTint={bg.colorA}
            lightBackground={bg.colorB}
            darkBackground={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      return (
        <ThreeBackground
          preset={bg.preset}
          colorA={bg.colorA}
          colorB={bg.colorB}
          bloom={bg.bloom}
          bloomThreshold={bg.bloomThreshold}
          bloomRadius={bg.bloomRadius}
          trails={bg.trails}
          grain={bg.grain}
        />
      );
    default:
      return null;
  }
}
