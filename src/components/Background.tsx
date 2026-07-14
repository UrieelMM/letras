import type { BackgroundConfig } from '../types';
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
