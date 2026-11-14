import AsciiTiles from './ascii-tiles';
import type { BackgroundConfig } from '../types';
import AuroraBlur from './aurora-blur';
import BlackHole from './black-hole';
import BlurredRays from './blurred-rays';
import ChromaBlinds from './chroma-blinds';
import ChromaWaves from './chroma-waves';
import ColorLoops from './color-loops';
import DitherWave from './dither-wave';
import FallingRays from './falling-rays';
import FlamePaths from './flame-paths';
import GlassFlow from './glass-flow';
import GlassTiles from './glass-tiles';
import GlitterWarp from './glitter-warp';
import GradientBars from './gradient-bars';
import GrainWave from './grain-wave';
import HalftoneWave from './halftone-wave';
import LightDroplets from './light-droplets';
import LiquidBars from './liquid-bars';
import LiquidLines from './liquid-lines';
import Lightspeed from './lightspeed';
import MetallicSwirl from './metallic-swirl';
import Mosaic from './mosaic';
import Portal from './portal';
import RadialLiquid from './radial-liquid';
import RetroLines from './retro-lines';
import RisingLines from './rising-lines';
import RobotLights from './robot-lights';
import RotatingStars from './rotating-stars';
import RubberFluid from './rubber-fluid';
import ShadowBars from './shadow-bars';
import ShaderWaves from './shader-waves';
import SilkWaves from './silk-waves';
import SquircleShift from './squircle-shift';
import SquareMatrix from './square-matrix';
import StarBurst from './star-burst';
import SwirlBlend from './swirl-blend';
import { ThreeBackground } from './ThreeBackground';
import { KineticBackground } from './KineticBackground';
import { isKineticBackgroundPreset } from '../lib/kineticBackgrounds';
import { isScenicBackgroundPreset, restoreJerichoBackground } from '../lib/scenicBackgrounds';
import ScenicBackground from './scenes/ScenicBackground';
import { isRetiredPraiseBackground } from '../lib/removedThemes';
import TwilightLines from './twilight-lines';
import WarpTwister from './warp-twister';
import { useLocalMediaUrl } from '../media/useLocalMediaUrl';
import glassFlowTexture from '../assets/glass-flow-texture.svg';

interface Props {
  bg: BackgroundConfig;
}

export function Background({ bg: original }: Props) {
  const bg = restoreJerichoBackground(original);
  const mediaUrl = useLocalMediaUrl(bg.kind === 'image' || bg.kind === 'video' ? bg.url : undefined);

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
          className="absolute inset-0 bg-center bg-no-repeat"
          style={{ backgroundImage: mediaUrl ? `url("${mediaUrl}")` : undefined, backgroundSize: bg.fit }}
        />
      );
    case 'video':
      return mediaUrl ? (
        <video
          key={mediaUrl}
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: bg.fit }}
          src={mediaUrl}
          autoPlay
          muted
          playsInline
          loop={bg.loop !== false}
          aria-hidden="true"
        />
      ) : null;
    case 'animated':
      if (isRetiredPraiseBackground(bg)) {
        return <div className="absolute inset-0" style={{ backgroundColor: bg.colorB }} />;
      }
      if (isScenicBackgroundPreset(bg.preset)) {
        return <ScenicBackground key={bg.preset} preset={bg.preset} colorA={bg.colorA} colorB={bg.colorB} />;
      }
      if (isKineticBackgroundPreset(bg.preset)) {
        return <KineticBackground preset={bg.preset} colorA={bg.colorA} colorB={bg.colorB} />;
      }
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
      if (bg.preset === 'grainWave') {
        return (
          <GrainWave
            width="100%"
            height="100%"
            startColor={bg.colorA}
            endColor={bg.colorA}
            lightBackground={bg.colorB}
            darkBackground={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'glassFlow') {
        return (
          <GlassFlow
            width="100%"
            height="100%"
            imageSrc={glassFlowTexture}
            stripeCount={6}
            angle={-13}
            lensCurvature={0.49}
            refraction={0.07}
            edgeWidth={0.02}
            edgeBrightness={0.05}
            speed={0.1}
            chromaticAberration={0.5}
            edgeSharpness={0.5}
            waveSpeed={1}
            waveAmount={0}
            frostAmount={0}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'shadowBars') {
        return <ShadowBars className="absolute inset-0" />;
      }
      if (bg.preset === 'warpTwister') {
        return (
          <WarpTwister
            radius={1.5}
            narrow={1.8}
            length={10}
            hazeSpeed={0.5}
            dustSpeed={1}
            hazeStrength={0.25}
            hazeFrequency={100}
            dustDensity={300}
            dustSize={100}
            dustOpacity={0.1}
            edgeFade={2}
            spiralTight={0.5}
            rotSpeed={0}
            baseColor={[0.753, 0.518, 0.988]}
            baseColorLight={[0.267, 0, 0.667]}
            cameraDistance={8.5}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'blackHole') {
        return (
          <BlackHole
            width="100%"
            height="100%"
            backgroundColor={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'blurredRays') {
        return (
          <BlurredRays
            width="100%"
            height="100%"
            backgroundColor={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'flamePaths') {
        return (
          <FlamePaths
            width="100%"
            height="100%"
            backgroundColor={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'gradientBars') {
        return (
          <GradientBars
            width="100%"
            height="100%"
            color={bg.colorA}
            backgroundColor={bg.colorB}
            barCount={6}
            balance={0.3}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'halftoneWave') {
        return (
          <HalftoneWave
            width="100%"
            height="100%"
            colorA={bg.colorA}
            colorB="#ffffff"
            backgroundColor={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'metallicSwirl') {
        return (
          <MetallicSwirl
            width="100%"
            height="100%"
            colorPhaseR={1}
            colorPhaseG={3}
            colorPhaseB={5}
            colorRange={0.8}
            colorBias={0.5}
            brightness={1.2}
            backgroundColor={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'metallicSwirlGold') {
        return (
          <MetallicSwirl
            width="100%"
            height="100%"
            colorPhaseR={0.5}
            colorPhaseG={1.2}
            colorPhaseB={2.8}
            colorRange={0.6}
            colorBias={0.55}
            backgroundColor="#1a1000"
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'retroLines') {
        return (
          <RetroLines
            width="100%"
            height="100%"
            color1={bg.colorA}
            color2="#ffb347"
            backgroundColor={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'rubberFluid') {
        return (
          <RubberFluid
            width="100%"
            height="100%"
            tintR={1}
            tintG={0.3}
            tintB={0.01}
            contrast={6}
            preBrightness={2.5}
            glowIntensity={1}
            backgroundColor="#0a0200"
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'squareMatrix') {
        return (
          <SquareMatrix
            width="100%"
            height="100%"
            color="#00ffcc"
            backgroundColor="#0a0a0a"
            peakBrightness={2.5}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'swirlBlend') {
        return (
          <SwirlBlend
            width="100%"
            height="100%"
            backgroundColor={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'asciiTiles') {
        return (
          <AsciiTiles
            width="100%"
            height="100%"
            glyphColor={bg.colorA}
            backgroundColor={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'twilightLines') {
        return (
          <TwilightLines
            width="100%"
            height="100%"
            lineColor={bg.colorA}
            pulseColor="#fff4d6"
            backgroundColor={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'chromaBlinds') {
        return (
          <ChromaBlinds
            width="100%"
            height="100%"
            lineCount={6}
            lineThickness={0.18}
            contrast={0.9}
            cursorInteraction={false}
            colorA={bg.colorA}
            colorB="#ff7ac6"
            colorC="#70e1ff"
            backgroundColor={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'glassTiles') {
        return (
          <GlassTiles
            width="100%"
            height="100%"
            colorA={bg.colorA}
            colorB="#ffffff"
            backgroundColor={bg.colorB}
            className="absolute inset-0"
          />
        );
      }
      if (bg.preset === 'robotLights' || bg.preset === 'graphicWorlds') {
        return (
          <div className="absolute inset-0 overflow-hidden" style={{ background: bg.colorB }}>
            <RobotLights
              colorA={bg.colorA}
              colorB={bg.colorB}
              variant={bg.robotVariant}
              showRig={bg.preset === 'robotLights'}
              className="absolute inset-0"
            />
          </div>
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
