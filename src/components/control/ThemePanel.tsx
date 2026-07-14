import { useStore } from '../../store/useStore';
import { SlideStage } from '../SlideStage';
import { FONT_OPTIONS, loadFont } from '../../lib/fonts';
import type {
  AnimatedBgPreset,
  BackgroundConfig,
  LiveState,
  OverlayEffectPreset,
  RenderSlide,
  TextMotionPreset,
  TextRevealPreset,
  Theme,
  TransitionPreset,
} from '../../types';

const OVERLAYS: { value: OverlayEffectPreset; label: string }[] = [
  { value: 'none', label: 'Ninguno' },
  { value: 'rain', label: 'Lluvia' },
  { value: 'snow', label: 'Nieve' },
  { value: 'stars', label: 'Estrellas' },
  { value: 'bokeh', label: 'Bokeh' },
  { value: 'confetti', label: 'Confeti' },
  { value: 'embers', label: 'Brasas' },
];

const TRANSITIONS: { value: TransitionPreset; label: string }[] = [
  { value: 'fade', label: 'Fundido' },
  { value: 'crossfade', label: 'Crossfade' },
  { value: 'slideUp', label: 'Deslizar ↑' },
  { value: 'slideDown', label: 'Deslizar ↓' },
  { value: 'slideHorizontal', label: 'Deslizar →' },
  { value: 'slideLeft', label: 'Deslizar ←' },
  { value: 'scale', label: 'Escala' },
  { value: 'zoomIn', label: 'Acercar' },
  { value: 'zoomOut', label: 'Alejar' },
  { value: 'blurIn', label: 'Desenfoque' },
  { value: 'blurScale', label: 'Desenfoque + escala' },
  { value: 'flipX', label: 'Voltear X' },
  { value: 'flipY', label: 'Voltear Y' },
  { value: 'rotateIn', label: 'Rotación' },
  { value: 'skewIn', label: 'Inclinación' },
  { value: 'riseScale', label: 'Subir + escala' },
];

const MOTIONS: { value: TextMotionPreset; label: string }[] = [
  { value: 'none', label: 'Sin movimiento' },
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

const ANIM_PRESETS: { value: AnimatedBgPreset; label: string }[] = [
  { value: 'meshGradient', label: 'Mesh gradiente' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'starfield', label: 'Estrellas' },
  { value: 'particles', label: 'Partículas' },
  { value: 'plasma', label: 'Plasma' },
  { value: 'waves', label: 'Olas multicolor' },
  { value: 'rainbow', label: 'Arcoíris fluido' },
  { value: 'confetti', label: 'Confeti' },
  { value: 'tunnel', label: 'Túnel infinito' },
  { value: 'vortex', label: 'Vórtice' },
  { value: 'kaleidoscope', label: 'Caleidoscopio' },
  { value: 'nebula', label: 'Nebulosa' },
  { value: 'liquid', label: 'Lava líquida' },
  { value: 'caustics', label: 'Cáusticas de agua' },
  { value: 'fractal', label: 'Fractal' },
  { value: 'warp', label: 'Hiperespacio' },
  { value: 'spiral', label: 'Galaxia espiral' },
  { value: 'grid', label: 'Grid synthwave' },
  { value: 'gradientFlow', label: 'Gradiente animado' },
  { value: 'dots', label: 'Dots' },
  { value: 'birds', label: 'Aves' },
  { value: 'cells', label: 'Células' },
  { value: 'matrix', label: 'Matrix' },
  { value: 'ripple', label: 'Onda expansiva' },
  { value: 'lightning', label: 'Tormenta eléctrica' },
  { value: 'smoke', label: 'Tinta / humo' },
  { value: 'fireflies', label: 'Luciérnagas' },
  { value: 'wormhole', label: 'Agujero de gusano' },
  { value: 'sunrays', label: 'Rayos de sol' },
  { value: 'neon', label: 'Neón' },
  { value: 'crystal', label: 'Prisma' },
  { value: 'silk', label: 'Seda' },
  { value: 'marble', label: 'Mármol' },
  { value: 'auroraSoft', label: 'Aurora suave' },
  { value: 'lavaLamp', label: 'Lámpara de lava' },
  { value: 'inkBloom', label: 'Tinta en agua' },
  { value: 'topographic', label: 'Topografía' },
  { value: 'satin', label: 'Satín' },
  { value: 'deepSea', label: 'Mar profundo' },
  { value: 'petals', label: 'Pétalos' },
  { value: 'liquidMetal', label: 'Metal líquido' },
  { value: 'breathingBg', label: 'Gradiente que respira' },
  { value: 'dunes', label: 'Dunas' },
  { value: 'smokeRings', label: 'Anillos de humo' },
  { value: 'cosmosDrift', label: 'Deriva cósmica' },
  { value: 'outrun', label: 'Outrun (carretera)' },
  { value: 'checkerFloor', label: 'Tablero perspectiva' },
  { value: 'retroSun', label: 'Sol vaporwave' },
  { value: 'gridTunnel', label: 'Túnel neón' },
  { value: 'wireMountains', label: 'Montañas wireframe' },
  { value: 'crt', label: 'CRT / scanlines' },
  { value: 'halftone', label: 'Halftone (puntos)' },
  { value: 'neonRings', label: 'Anillos neón' },
  { value: 'neonBurst', label: 'Sunburst sectores' },
  { value: 'vectorStars', label: 'Estrellas vector' },
  { value: 'crystal2', label: 'Prisma (colores)' },
  { value: 'cosmicWaves', label: 'Ondas cósmicas' },
  { value: 'kaliFractal', label: 'Fractal caleidoscópico' },
  { value: 'singularity', label: 'Singularidad' },
  { value: 'magicTrail', label: 'Varita mágica' },
  { value: 'galaxySpiral', label: 'Galaxia espiral (3D)' },
  { value: 'particleFlow', label: 'Vuelo de partículas' },
  { value: 'starFlow', label: 'Campo estelar' },
  { value: 'warpSpace', label: 'Viaje espacio-tiempo' },
];

export function ThemePanel() {
  const themes = useStore((s) => s.themes);
  const songs = useStore((s) => s.songs);
  const activeSongId = useStore((s) => s.activeSongId);
  const customizeTheme = useStore((s) => s.customizeTheme);
  const setActiveTheme = useStore((s) => s.setActiveTheme);
  const restoreFactoryThemes = useStore((s) => s.restoreFactoryThemes);
  const themeForSong = useStore((s) => s.themeForSong);

  const song = songs.find((s) => s.id === activeSongId) ?? null;
  const theme = themeForSong(song);

  const sampleSlide: RenderSlide = {
    id: 'sample',
    blockId: 'sample',
    type: 'verse',
    lines: song?.blocks[0]?.lines.slice(0, theme.maxLinesPerSlide) ?? [
      'Texto de ejemplo',
      'para previsualizar el tema',
    ],
    partIndex: 0,
    partCount: 1,
  };
  const previewLive: LiveState = {
    slide: sampleSlide,
    theme,
    blackout: false,
    showLogo: false,
    clearText: false,
  };

  function update(patch: Partial<Theme>) {
    customizeTheme({ ...theme, ...patch });
  }
  function updateFont(patch: Partial<Theme['font']>) {
    customizeTheme({ ...theme, font: { ...theme.font, ...patch } });
  }
  function updateContrast(patch: Partial<Theme['contrast']>) {
    customizeTheme({ ...theme, contrast: { ...theme.contrast, ...patch } });
  }
  function updateBg(bg: BackgroundConfig) {
    customizeTheme({ ...theme, background: bg });
  }
  function updateOverlay(patch: Partial<NonNullable<Theme['overlay']>>) {
    const current = theme.overlay ?? { preset: 'none' as const, color: '#ffffff', intensity: 0.6 };
    customizeTheme({ ...theme, overlay: { ...current, ...patch } });
  }

  return (
    <div className="h-full space-y-5 overflow-y-auto p-4">
      {/* Vista previa del tema */}
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10">
        <SlideStage live={previewLive} scale={0.5} />
      </div>

      {/* Selector de tema */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="label !mb-0">Tema ({themes.length})</span>
          <button
            className="text-[11px] text-accent-soft hover:text-white"
            title="Agrega/actualiza los temas de fábrica sin borrar los tuyos"
            onClick={restoreFactoryThemes}
          >
            ↺ Restaurar de fábrica
          </button>
        </div>
        <select
          className="input"
          value={theme.id}
          onChange={(e) => setActiveTheme(e.target.value)}
        >
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tipografía */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-soft">
          Tipografía
        </h3>

        <div>
          <label className="label">Fuente (Google Fonts)</label>
          <select
            className="input"
            value={theme.font.family}
            style={{ fontFamily: `'${theme.font.family}', sans-serif` }}
            onChange={(e) => {
              loadFont(e.target.value);
              updateFont({ family: e.target.value });
            }}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.family} value={f.family}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <Range
          label={`Tamaño (${theme.font.sizeVw.toFixed(1)})`}
          min={2}
          max={9}
          step={0.1}
          value={theme.font.sizeVw}
          onChange={(v) => updateFont({ sizeVw: v })}
        />
        <Range
          label={`Grosor (${theme.font.weight})`}
          min={300}
          max={900}
          step={100}
          value={theme.font.weight}
          onChange={(v) => updateFont({ weight: v })}
        />
        <Range
          label={`Interlínea (${theme.font.lineHeight.toFixed(2)})`}
          min={1}
          max={2}
          step={0.05}
          value={theme.font.lineHeight}
          onChange={(v) => updateFont({ lineHeight: v })}
        />
        <Range
          label={`Espaciado (${theme.font.letterSpacing}px)`}
          min={-2}
          max={8}
          step={0.5}
          value={theme.font.letterSpacing}
          onChange={(v) => updateFont({ letterSpacing: v })}
        />

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="label">Color texto</label>
            <input
              type="color"
              className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent"
              value={theme.color.text}
              onChange={(e) => update({ color: { ...theme.color, text: e.target.value } })}
            />
          </div>
          <Toggle
            label="Sombra"
            checked={theme.color.shadow}
            onChange={(v) => update({ color: { ...theme.color, shadow: v } })}
          />
          <Toggle
            label="MAYÚS"
            checked={theme.uppercase}
            onChange={(v) => update({ uppercase: v })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Toggle
            label="Ajuste automático"
            checked={theme.autoFit !== false}
            onChange={(v) => update({ autoFit: v })}
          />
          <Toggle
            label="Letras arcoíris"
            checked={!!theme.rainbowText}
            onChange={(v) => update({ rainbowText: v })}
          />
        </div>
      </section>

      {/* Disposición */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-soft">
          Disposición
        </h3>
        <Segmented
          label="Alineación H"
          options={[
            { value: 'left', label: '⬅' },
            { value: 'center', label: '↔' },
            { value: 'right', label: '➡' },
            { value: 'justify', label: '≣' },
          ]}
          value={theme.alignment}
          onChange={(v) => update({ alignment: v as Theme['alignment'] })}
        />
        <Segmented
          label="Alineación V"
          options={[
            { value: 'top', label: '⬆' },
            { value: 'middle', label: '↕' },
            { value: 'bottom', label: '⬇' },
          ]}
          value={theme.vAlign}
          onChange={(v) => update({ vAlign: v as Theme['vAlign'] })}
        />
        <Range
          label={`Máx. líneas por slide (${theme.maxLinesPerSlide})`}
          min={1}
          max={8}
          step={1}
          value={theme.maxLinesPerSlide}
          onChange={(v) => update({ maxLinesPerSlide: v })}
        />
      </section>

      {/* Animación */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-soft">
          Animación de texto
        </h3>
        <div>
          <label className="label">Revelado de letras (entrada)</label>
          <select
            className="input"
            value={theme.textReveal ?? 'wordsUp'}
            onChange={(e) => update({ textReveal: e.target.value as TextRevealPreset })}
          >
            {REVEALS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Movimiento continuo (todo el tiempo)</label>
          <select
            className="input"
            value={theme.textMotion ?? 'none'}
            onChange={(e) => update({ textMotion: e.target.value as TextMotionPreset })}
          >
            {MOTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Transición entre slides</label>
          <select
            className="input"
            value={theme.transition}
            onChange={(e) => update({ transition: e.target.value as TransitionPreset })}
          >
            {TRANSITIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Fondo */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-soft">
          Fondo
        </h3>
        <Segmented
          label="Tipo"
          options={[
            { value: 'animated', label: 'Animado' },
            { value: 'gradient', label: 'Gradiente' },
            { value: 'solid', label: 'Sólido' },
            { value: 'image', label: 'Imagen' },
          ]}
          value={theme.background.kind}
          onChange={(kind) => {
            if (kind === 'animated')
              updateBg({ kind: 'animated', preset: 'meshGradient', colorA: '#7c5cff', colorB: '#1a1a40' });
            else if (kind === 'gradient')
              updateBg({ kind: 'gradient', from: '#11131c', to: '#1d1633', angle: 135 });
            else if (kind === 'solid') updateBg({ kind: 'solid', color: '#0b0b12' });
            else updateBg({ kind: 'image', url: '', fit: 'cover' });
          }}
        />

        {theme.background.kind === 'animated' && (
          <>
            <select
              className="input"
              value={theme.background.preset}
              onChange={(e) =>
                updateBg({
                  ...(theme.background as Extract<BackgroundConfig, { kind: 'animated' }>),
                  preset: e.target.value as AnimatedBgPreset,
                })
              }
            >
              {ANIM_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <ColorPair
              a={theme.background.colorA}
              b={theme.background.colorB}
              onA={(c) =>
                updateBg({ ...(theme.background as Extract<BackgroundConfig, { kind: 'animated' }>), colorA: c })
              }
              onB={(c) =>
                updateBg({ ...(theme.background as Extract<BackgroundConfig, { kind: 'animated' }>), colorB: c })
              }
            />
          </>
        )}

        {theme.background.kind === 'gradient' && (
          <ColorPair
            a={theme.background.from}
            b={theme.background.to}
            onA={(c) => updateBg({ ...(theme.background as Extract<BackgroundConfig, { kind: 'gradient' }>), from: c })}
            onB={(c) => updateBg({ ...(theme.background as Extract<BackgroundConfig, { kind: 'gradient' }>), to: c })}
          />
        )}

        {theme.background.kind === 'solid' && (
          <input
            type="color"
            className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent"
            value={theme.background.color}
            onChange={(e) => updateBg({ kind: 'solid', color: e.target.value })}
          />
        )}

        {theme.background.kind === 'image' && (
          <input
            className="input"
            placeholder="URL de la imagen (https://...)"
            value={theme.background.url}
            onChange={(e) =>
              updateBg({ kind: 'image', url: e.target.value, fit: 'cover' })
            }
          />
        )}
      </section>

      {/* Efecto superpuesto */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-soft">
          Efecto sobre el fondo
        </h3>
        <p className="-mt-1 text-[11px] text-white/40">
          Se dibuja encima de cualquier fondo (incluida una imagen).
        </p>
        <select
          className="input"
          value={theme.overlay?.preset ?? 'none'}
          onChange={(e) => updateOverlay({ preset: e.target.value as OverlayEffectPreset })}
        >
          {OVERLAYS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {theme.overlay && theme.overlay.preset !== 'none' && (
          <>
            {theme.overlay.preset === 'emojis' ? (
              <div>
                <label className="label">Emojis / iconos (separados por espacio)</label>
                <input
                  className="input text-lg"
                  placeholder="🌴 🌺 🥥 ☀️ 🌊"
                  value={(theme.overlay.emojis ?? []).join(' ')}
                  onChange={(e) =>
                    updateOverlay({ emojis: e.target.value.split(/\s+/).filter(Boolean) })
                  }
                />
              </div>
            ) : (
              <div>
                <label className="label">Color del efecto</label>
                <input
                  type="color"
                  className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent"
                  value={theme.overlay.color}
                  onChange={(e) => updateOverlay({ color: e.target.value })}
                />
              </div>
            )}
            <Range
              label={`Densidad (${Math.round((theme.overlay.intensity ?? 0.6) * 100)}%)`}
              min={0.1}
              max={1}
              step={0.05}
              value={theme.overlay.intensity ?? 0.6}
              onChange={(v) => updateOverlay({ intensity: v })}
            />
          </>
        )}
      </section>

      {/* Contraste */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-soft">
          Contraste (legibilidad)
        </h3>
        <Range
          label={`Oscurecer fondo (${Math.round(theme.contrast.overlayOpacity * 100)}%)`}
          min={0}
          max={0.85}
          step={0.05}
          value={theme.contrast.overlayOpacity}
          onChange={(v) => updateContrast({ overlayOpacity: v })}
        />
        <Range
          label={`Desenfoque fondo (${theme.contrast.blurPx}px)`}
          min={0}
          max={24}
          step={1}
          value={theme.contrast.blurPx}
          onChange={(v) => updateContrast({ blurPx: v })}
        />
      </section>
    </div>
  );
}

/* ---------- Controles reutilizables ---------- */

function Range({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-accent"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
        checked ? 'bg-accent text-white' : 'bg-white/5 text-white/50'
      }`}
    >
      {label}
    </button>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-1 rounded-lg bg-ink-900/80 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
              value === o.value ? 'bg-accent text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorPair({
  a,
  b,
  onA,
  onB,
}: {
  a: string;
  b: string;
  onA: (c: string) => void;
  onB: (c: string) => void;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <label className="label">Color A</label>
        <input
          type="color"
          className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent"
          value={a}
          onChange={(e) => onA(e.target.value)}
        />
      </div>
      <div className="flex-1">
        <label className="label">Color B</label>
        <input
          type="color"
          className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent"
          value={b}
          onChange={(e) => onB(e.target.value)}
        />
      </div>
    </div>
  );
}
