import type { TextAnimationConfig, TextAnimationSpeed, TextMotionPreset, TextRevealPreset } from '../../types';

const DYNAMIC_REVEALS = [
  { value: 'snapTurn', label: 'Giro con impulso', description: 'Las palabras llegan en diagonal con un giro breve y se asientan.' },
  { value: 'focusZoom', label: 'Enfoque de cámara', description: 'El texto se acerca y gana nitidez al asentarse.' },
  { value: 'letterArc', label: 'Arco de letras', description: 'Las letras se abren en abanico y vuelven a alinearse.' },
  { value: 'sideWipe', label: 'Barrido diagonal', description: 'Un corte diagonal revela el texto de izquierda a derecha.' },
  { value: 'curtain', label: 'Cortinilla', description: 'Cada línea se descubre desde abajo, como al levantar un telón.' },
  { value: 'impact', label: 'Impacto en cadena', description: 'Las palabras entran comprimidas y recuperan su forma con un rebote breve.' },
  { value: 'counterSlide', label: 'Cruce de líneas', description: 'Las líneas entran desde lados alternos.' },
  { value: 'foldLetters', label: 'Pliegue 3D', description: 'Las letras giran desde el centro hacia los extremos.' },
] as const;

const DYNAMIC_MOTIONS = [
  { value: 'doubleBeat', label: 'Doble acento', description: 'Dos pulsos breves seguidos de una pausa para leer.' },
  { value: 'pendulumArc', label: 'Péndulo 3D', description: 'El texto se balancea de lado a lado en un arco corto con perspectiva.' },
  { value: 'rollingWave', label: 'Cascada por palabras', description: 'Cada palabra sube y se asienta mientras la siguiente toma el relevo.' },
  { value: 'letterTilt', label: 'Ola de letras 3D', description: 'Las letras se inclinan en secuencia y descansan en su posición original.' },
  { value: 'wordFlow', label: 'Ola por palabras', description: 'Las palabras suben y vuelven a su sitio en secuencia.' },
  { value: 'wordPulse', label: 'Pulso desde el centro', description: 'Las palabras se expanden suavemente desde el centro de la frase.' },
] as const;

const MOTIONS: { value: TextMotionPreset; label: string }[] = [
  { value: 'float', label: 'Flotar' },
  { value: 'sway', label: 'Vaivén' },
  { value: 'pulse', label: 'Pulso' },
  { value: 'breathe', label: 'Respirar' },
  { value: 'wave', label: 'Ola' },
  { value: 'glow', label: 'Brillo' },
  { value: 'drift', label: 'Deriva' },
  { value: 'tilt', label: 'Inclinación 3D' },
  { value: 'wobble', label: 'Bamboleo' },
  { value: 'heartbeat', label: 'Latido' },
  { value: 'jelly', label: 'Gelatina' },
  { value: 'orbit', label: 'Órbita' },
  { value: 'shimmer', label: 'Destello' },
  { value: 'zoomSlow', label: 'Zoom lento' },
  { value: 'rippleText', label: 'Onda continua' },
  { value: 'bobUnits', label: 'Vaivén por unidad' },
];

const REVEALS: { value: TextRevealPreset; label: string }[] = [
  { value: 'wordsUp', label: 'Palabra por palabra' },
  { value: 'charsUp', label: 'Letra por letra' },
  { value: 'typewriter', label: 'Máquina de escribir' },
  { value: 'linesUp', label: 'Línea por línea' },
  { value: 'bounce', label: 'Rebote' },
  { value: 'pop', label: 'Pop' },
  { value: 'dance', label: 'Baile' },
  { value: 'fromLeft', label: 'Desde la izquierda' },
  { value: 'fromRight', label: 'Desde la derecha' },
  { value: 'zoomIn', label: 'Acercamiento' },
  { value: 'flip', label: 'Voltear' },
  { value: 'blurWords', label: 'Desenfoque por palabra' },
  { value: 'dropIn', label: 'Caída' },
  { value: 'swing', label: 'Columpio' },
  { value: 'glitch', label: 'Glitch' },
  { value: 'waveText', label: 'Ola' },
  { value: 'expand', label: 'Expandir' },
  { value: 'fade', label: 'Aparición suave' },
  { value: 'none', label: 'Sin animación' },
];

interface Props {
  value: TextAnimationConfig;
  onChange: (animation: TextAnimationConfig) => void;
}

export function TextAnimationFields({ value, onChange }: Props) {
  const revealHint = DYNAMIC_REVEALS.find((option) => option.value === value.reveal)?.description;
  const motionHint = DYNAMIC_MOTIONS.find((option) => option.value === value.motion)?.description;

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="label">Entrada del texto</span>
        <select
          className="input"
          value={value.reveal}
          onChange={(event) => onChange({ ...value, reveal: event.target.value as TextRevealPreset })}
        >
          <optgroup label="Dinámicas">
            {DYNAMIC_REVEALS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </optgroup>
          <optgroup label="Clásicas">
            {REVEALS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </optgroup>
        </select>
      </label>
      {revealHint && <p className="text-xs text-white/60">{revealHint}</p>}
      <label className="block">
        <span className="label">Velocidad de entrada</span>
        <select
          className="input disabled:opacity-50"
          value={value.speed ?? 'normal'}
          disabled={value.reveal === 'none'}
          onChange={(event) => onChange({ ...value, speed: event.target.value as TextAnimationSpeed })}
        >
          <option value="slow">Lenta</option>
          <option value="normal">Normal</option>
          <option value="fast">Rápida</option>
        </select>
      </label>
      <label className="block">
        <span className="label">Movimiento continuo</span>
        <select
          className="input"
          value={value.motion}
          onChange={(event) => onChange({ ...value, motion: event.target.value as TextMotionPreset })}
        >
          <option value="none">Sin movimiento</option>
          <optgroup label="Dinámicos">
            {DYNAMIC_MOTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </optgroup>
          <optgroup label="Clásicos">
            {MOTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </optgroup>
        </select>
      </label>
      {motionHint && <p className="text-xs text-white/60">{motionHint}</p>}
    </div>
  );
}
