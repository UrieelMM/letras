import { useLayoutEffect, useRef } from 'react';
import type { LyricSelectionAnimation, LyricTypography, TextAnimationConfig } from '../types';
import { animateText, getTextUnits } from './gsapTextAnimation';
import { LyricText } from './LyricText';
import { renderTextUnits } from './textAnimationUnits';

interface Props {
  lines: string[];
  animation: TextAnimationConfig;
  rainbow?: boolean;
  typography?: LyricTypography;
  selectionAnimations?: LyricSelectionAnimation[];
  reduceMotion: boolean;
}

export function GsapText({ lines, animation, rainbow, typography, selectionAnimations, reduceMotion }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { reveal, motion, speed } = animation;
  const units = getTextUnits(animation);
  const lineRainbow = rainbow && units === 'lines';
  const text = lines.join('\n');
  const accents = typography?.emphasis?.map(({ start, end }) => start + ':' + end).join(',');
  const selections = selectionAnimations?.map(({ start, end }) => start + ':' + end).join(',');

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reduceMotion) return;
    return animateText(root, { reveal, motion, speed });
  }, [text, reveal, motion, speed, typography?.preset, accents, selections, reduceMotion]);

  return (
    <div ref={ref}>
      <div className="g-motion">
        {typography || selectionAnimations?.length ? (
          <LyricText
            lines={lines}
            typography={typography}
            selectionAnimations={selectionAnimations}
            reduceMotion={reduceMotion}
            units={units}
            rainbow={rainbow}
          />
        ) : lines.map((line, index) => (
          <div
            key={index}
            className={`g-line ${lineRainbow ? 'g-rainbow' : ''}`}
            style={lineRainbow ? { animationDelay: `${index * 0.2}s` } : undefined}
          >
            {renderTextUnits(line || ' ', units, rainbow)}
          </div>
        ))}
      </div>
    </div>
  );
}
