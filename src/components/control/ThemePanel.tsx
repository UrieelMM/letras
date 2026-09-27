import { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { toast } from '../../store/toastStore';
import { SlideStage } from '../SlideStage';
import { FONT_OPTIONS, loadFont } from '../../lib/fonts';
import { REMOVED_BG_PRESETS, REMOVED_THEME_IDS } from '../../lib/removedThemes';
import { REACT_BITS_PRESETS, REACT_BITS_THEME_IDS } from '../../lib/reactBitsThemes';
import { saveThemeImageLocally } from '../../media/localMedia';
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

const ALL_ANIM_PRESETS: { value: AnimatedBgPreset; label: string }[] = [
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
  { value: 'shaderWaves', label: 'Shader Waves' },
  { value: 'glitterWarp', label: 'Glitter Warp' },
  { value: 'lightDroplets', label: 'Light Droplets' },
  { value: 'lightspeed', label: 'Lightspeed' },
  { value: 'ditherWave', label: 'Dither Wave' },
  { value: 'radialLiquid', label: 'Radial Liquid' },
  { value: 'chromaWaves', label: 'Chroma Waves' },
  { value: 'mosaic', label: 'Mosaic' },
  { value: 'portal', label: 'Portal' },
  { value: 'risingLines', label: 'Rising Lines' },
  { value: 'colorLoops', label: 'Color Loops' },
  { value: 'rotatingStars', label: 'Rotating Stars' },
  { value: 'starBurst', label: 'Star Burst' },
  { value: 'silkWaves', label: 'Silk Waves' },
  { value: 'fallingRays', label: 'Falling Rays' },
  { value: 'liquidBars', label: 'Liquid Bars' },
  { value: 'auroraBlur', label: 'Aurora Blur' },
  { value: 'liquidLines', label: 'Liquid Lines' },
  { value: 'squircleShift', label: 'Squircle Shift' },
  { value: 'grainWave', label: 'Grain Wave' },
  { value: 'glassFlow', label: 'Glass Flow' },
  { value: 'shadowBars', label: 'Shadow Bars' },
  { value: 'warpTwister', label: 'Warp Twister' },
  { value: 'blackHole', label: 'Black Hole' },
  { value: 'blurredRays', label: 'Blurred Rays' },
  { value: 'flamePaths', label: 'Flame Paths' },
  { value: 'gradientBars', label: 'Gradient Bars' },
  { value: 'halftoneWave', label: 'Halftone Wave' },
  { value: 'metallicSwirl', label: 'Metallic Swirl' },
  { value: 'metallicSwirlGold', label: 'Metallic Swirl Gold' },
  { value: 'retroLines', label: 'Retro Lines' },
  { value: 'rubberFluid', label: 'Rubber Fluid' },
  { value: 'squareMatrix', label: 'Square Matrix' },
  { value: 'swirlBlend', label: 'Swirl Blend' },
  { value: 'asciiTiles', label: 'ASCII Tiles' },
  { value: 'twilightLines', label: 'Twilight Lines' },
  { value: 'chromaBlinds', label: 'Chroma Blinds' },
  { value: 'glassTiles', label: 'Glass Tiles' },
  { value: 'robotLights', label: 'Cabezas móviles / reflectores' },
  { value: 'graphicWorlds', label: 'Mundos gráficos animados' },
];

const ANIM_PRESETS: { value: AnimatedBgPreset; label: string }[] = ALL_ANIM_PRESETS.filter(
  (preset): preset is { value: AnimatedBgPreset; label: string } =>
    !REMOVED_BG_PRESETS.has(preset.value),
);

function isReactBitsTheme(theme: Theme) {
  return (
    REACT_BITS_THEME_IDS.has(theme.id) ||
    (theme.background.kind === 'animated' && REACT_BITS_PRESETS.has(theme.background.preset))
  );
}

function ReactBitsStar() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5 fill-amber-300 text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.45)]"
    >
      <path d="m12 2.3 2.88 5.84 6.45.94-4.67 4.55 1.1 6.42L12 17.02l-5.76 3.03 1.1-6.42-4.67-4.55 6.45-.94L12 2.3Z" />
    </svg>
  );
}

export function ThemePanel() {
  const [themeSearch, setThemeSearch] = useState('');
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [highlightedThemeIndex, setHighlightedThemeIndex] = useState(0);
  const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const themes = useStore((s) => s.themes);
  const songs = useStore((s) => s.songs);
  const activeSongId = useStore((s) => s.activeSongId);
  const workspaceTab = useStore((s) => s.workspaceTab);
  const slides = useStore((s) => s.slides);
  const customizeTheme = useStore((s) => s.customizeTheme);
  const saveTheme = useStore((s) => s.saveTheme);
  const setActiveTheme = useStore((s) => s.setActiveTheme);
  const restoreFactoryThemes = useStore((s) => s.restoreFactoryThemes);
  const themeForPresentation = useStore((s) => s.themeForPresentation);
  const visibleThemes = themes.filter((t) => !REMOVED_THEME_IDS.has(t.id));
  const normalizedThemeSearch = themeSearch
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
  const matchingThemes = normalizedThemeSearch
    ? visibleThemes.filter((t) =>
        t.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLocaleLowerCase('es')
          .includes(normalizedThemeSearch),
      )
    : visibleThemes;

  const song = songs.find((s) => s.id === activeSongId) ?? null;
  const theme = themeForPresentation();

  const fallbackSlide: RenderSlide = {
    id: 'sample',
    blockId: 'sample',
    type: 'verse',
    lines: workspaceTab === 'lyrics' && song?.blocks[0]
      ? song.blocks[0].lines.slice(0, theme.maxLinesPerSlide)
      : [
      'Texto de ejemplo',
      'para previsualizar el tema',
    ],
    partIndex: 0,
    partCount: 1,
  };
  const sampleSlide = workspaceTab === 'bible' && slides[0] ? slides[0] : fallbackSlide;
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

  async function handleImageUpload(file: File | undefined) {
    if (!file) return;
    setImageUploadProgress(0);
    try {
      const url = await saveThemeImageLocally(file, setImageUploadProgress);
      const uploadedTheme: Theme = {
        ...theme,
        background: { kind: 'image', url, fit: 'cover' },
      };
      customizeTheme(uploadedTheme);
      // Sin una canción activa, la personalización pertenece al tema seleccionado.
      if (workspaceTab === 'lyrics' && !activeSongId) saveTheme(uploadedTheme);
      toast.success('Imagen guardada localmente en el tema.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo subir la imagen.';
      toast.error(message);
    } finally {
      setImageUploadProgress(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
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
          <span className="label !mb-0">
            Tema ({normalizedThemeSearch ? `${matchingThemes.length} de ` : ''}{visibleThemes.length})
          </span>
          <button
            className="text-[11px] text-accent-soft hover:text-white"
            title="Agrega/actualiza los temas de fábrica sin borrar los tuyos"
            onClick={restoreFactoryThemes}
          >
            ↺ Restaurar de fábrica
          </button>
        </div>
        <div className="relative">
          <div className="relative">
            <input
              type="search"
              className="input pr-9"
              value={themeSearch}
              placeholder={`Tema actual: ${theme.name}`}
              aria-label="Buscar tema"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={themeMenuOpen}
              aria-controls="theme-search-results"
              aria-activedescendant={
                themeMenuOpen && matchingThemes[highlightedThemeIndex]
                  ? `theme-option-${matchingThemes[highlightedThemeIndex].id}`
                  : undefined
              }
              onFocus={() => setThemeMenuOpen(true)}
              onClick={() => setThemeMenuOpen(true)}
              onBlur={() => setThemeMenuOpen(false)}
              onChange={(e) => {
                setThemeSearch(e.target.value);
                setHighlightedThemeIndex(0);
                setThemeMenuOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setThemeMenuOpen(true);
                  if (matchingThemes.length > 0) {
                    setHighlightedThemeIndex((i) => Math.min(i + 1, matchingThemes.length - 1));
                  }
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedThemeIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === 'Enter' && themeMenuOpen && matchingThemes[highlightedThemeIndex]) {
                  e.preventDefault();
                  setActiveTheme(matchingThemes[highlightedThemeIndex].id);
                  setThemeSearch('');
                  setThemeMenuOpen(false);
                } else if (e.key === 'Escape') {
                  setThemeMenuOpen(false);
                }
              }}
            />
            {themeSearch && (
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lg leading-none text-slate-400 hover:text-white"
                aria-label="Limpiar búsqueda de temas"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setThemeSearch('');
                  setHighlightedThemeIndex(0);
                  setThemeMenuOpen(true);
                }}
              >
                ×
              </button>
            )}
          </div>
          {themeMenuOpen && (
            <div
              id="theme-search-results"
              role="listbox"
              className="absolute z-30 mt-1.5 max-h-56 w-full overflow-y-auto rounded-lg border border-white/10 bg-slate-950/95 p-1 shadow-2xl backdrop-blur-xl"
            >
              {matchingThemes.length === 0 ? (
                <div className="px-3 py-2.5 text-sm text-slate-400">No se encontraron temas</div>
              ) : (
                matchingThemes.map((t, index) => (
                  <button
                    key={t.id}
                    id={`theme-option-${t.id}`}
                    type="button"
                    role="option"
                    aria-selected={t.id === theme.id}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      index === highlightedThemeIndex
                        ? 'bg-accent/20 text-white'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlightedThemeIndex(index)}
                    onClick={() => {
                      setActiveTheme(t.id);
                      setThemeSearch('');
                      setThemeMenuOpen(false);
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{t.name}</span>
                      {isReactBitsTheme(t) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-200">
                          <ReactBitsStar />
                          Favorites
                        </span>
                      )}
                    </span>
                    {t.id === theme.id && <span className="ml-2 text-accent-soft">✓</span>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
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
        <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-white/80">Referencia bíblica</div>
              <div className="mt-0.5 text-[10px] text-white/35">Sólo aparece en pasajes de la Biblia</div>
            </div>
            <Toggle
              label="Mostrar"
              checked={theme.reference?.show !== false}
              onChange={(show) => update({
                reference: {
                  show,
                  position: theme.reference?.position ?? 'bottom',
                  sizeVw: theme.reference?.sizeVw ?? 1.25,
                },
              })}
            />
          </div>
          <div className="space-y-3">
            <Segmented
              label="Posición"
              options={[
                { value: 'top', label: 'Arriba' },
                { value: 'bottom', label: 'Abajo' },
              ]}
              value={theme.reference?.position ?? 'bottom'}
              onChange={(position) => update({
                reference: {
                  show: theme.reference?.show !== false,
                  position: position as 'top' | 'bottom',
                  sizeVw: theme.reference?.sizeVw ?? 1.25,
                },
              })}
            />
            <Range
              label={`Tamaño de referencia (${(theme.reference?.sizeVw ?? 1.25).toFixed(2)})`}
              min={0.7}
              max={2.5}
              step={0.05}
              value={theme.reference?.sizeVw ?? 1.25}
              onChange={(sizeVw) => update({
                reference: {
                  show: theme.reference?.show !== false,
                  position: theme.reference?.position ?? 'bottom',
                  sizeVw,
                },
              })}
            />
          </div>
        </div>
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
                  {REACT_BITS_PRESETS.has(p.value) ? `★ ${p.label}` : p.label}
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
          <div className="space-y-2.5">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(e) => void handleImageUpload(e.target.files?.[0])}
            />
            <button
              type="button"
              className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-3 text-left transition hover:border-accent/60 hover:bg-accent/5 disabled:cursor-wait disabled:opacity-60"
              disabled={imageUploadProgress !== null}
              onClick={() => imageInputRef.current?.click()}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent-soft transition group-hover:bg-accent group-hover:text-white">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2">
                  <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-white">
                  {imageUploadProgress === null
                    ? 'Guardar imagen en este dispositivo'
                    : `Guardando imagen... ${imageUploadProgress}%`}
                </span>
                <span className="block text-[11px] text-white/40">JPG, PNG, WebP, GIF o AVIF · máximo 10 MB</span>
              </span>
            </button>
            {imageUploadProgress !== null && (
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-accent transition-[width]"
                  style={{ width: `${imageUploadProgress}%` }}
                />
              </div>
            )}
          </div>
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
