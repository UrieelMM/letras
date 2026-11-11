import { useMemo, useState } from 'react';
import { FONT_OPTIONS } from '../../lib/fonts';
import { uid } from '../../lib/id';
import {
  getLyricPreset, hasLyricStyling, LYRIC_PRESETS, mergeEmphasis, selectionToEmphasis,
} from '../../lib/lyricTypography';
import { buildBlockSlides } from '../../lib/slides';
import { DEFAULT_SELECTION_ANIMATION, getThemeTextAnimation, replaceSelectionAnimations } from '../../lib/textAnimation';
import type {
  LyricAnimationSpeed, LyricEmphasis, LyricSelectionAnimation, LyricTypography,
  LyricTypographyPreset, SlideBlock, TextAnimationConfig, Theme,
} from '../../types';
import { SlideStage } from '../SlideStage';
import { TextAnimationFields } from './TextAnimationFields';

interface Props {
  block: SlideBlock;
  theme: Theme;
  selection: LyricEmphasis | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (typography: LyricTypography) => void;
  onAnimationChange: (animation: TextAnimationConfig | undefined) => void;
  onSelectionAnimationsChange: (ranges: LyricSelectionAnimation[]) => void;
}

const PRESETS = Object.entries(LYRIC_PRESETS) as [LyricTypographyPreset, (typeof LYRIC_PRESETS)[LyricTypographyPreset]][];

export function LyricTypographyEditor({
  block, theme, selection, open, onOpenChange, onChange, onAnimationChange, onSelectionAnimationsChange,
}: Props) {
  const [part, setPart] = useState(0);
  const [replay, setReplay] = useState(0);
  const [animationGroupId, setAnimationGroupId] = useState<string | null>(null);
  const slides = useMemo(() => open ? buildBlockSlides(block) : [], [block, open]);
  const index = Math.min(part, Math.max(0, slides.length - 1));
  const slide = slides[index]?.slide ?? null;
  const typography = block.typography;
  const sectionAnimation = block.textAnimation;
  const customAnimation = sectionAnimation ?? theme.textAnimation;
  const preset = getLyricPreset(typography);
  const emphasis = typography?.emphasis ?? [];
  const lyrics = open || selection ? block.lines.join('\n') : '';
  const selected = selection ? selectionToEmphasis(lyrics, selection) : [];
  const panelId = 'typography-' + block.id;
  const selectionAnimations = block.selectionAnimations ?? [];
  const animationGroups = new Map<string, LyricSelectionAnimation[]>();
  for (const range of selectionAnimations) {
    const group = animationGroups.get(range.groupId);
    if (group) group.push(range);
    else animationGroups.set(range.groupId, [range]);
  }
  const activeGroup = animationGroupId ? animationGroups.get(animationGroupId) : undefined;
  const groupText = (group: LyricSelectionAnimation[]) =>
    group.map(({ start, end }) => lyrics.slice(start, end)).join(' · ');

  function selectPreset(next?: LyricTypographyPreset) {
    if (next === typography?.preset) return;
    onChange({ preset: next, speed: typography?.speed, applyToSection: typography?.applyToSection, emphasis });
  }

  function update(patch: Partial<LyricTypography>) {
    onChange({ ...typography, ...patch });
  }

  function showSlideAt(offset: number) {
    const sectionSlides = open ? slides : buildBlockSlides(block);
    const slideIndex = sectionSlides.findIndex(({ start, slide: item }) =>
      offset >= start && offset < start + item.lines.join('\n').length,
    );
    if (slideIndex >= 0) setPart(slideIndex);
  }

  function emphasizeSelection() {
    const first = selected[0];
    if (!first) return;
    showSlideAt(first.start);
    update({
      preset: typography?.preset ?? 'handwritten',
      emphasis: mergeEmphasis([...emphasis, ...selected]),
    });
    setAnimationGroupId(null);
    onOpenChange(true);
  }

  function animateSelection(targets: LyricEmphasis[]) {
    if (!targets.length) return;
    const existing = [...animationGroups.values()].find((group) =>
      group.length === targets.length && targets.every(({ start, end }, index) =>
        group[index].start === start && group[index].end === end,
      ),
    );
    const groupId = existing?.[0].groupId ?? uid('animation-');
    if (!existing) {
      const ranges = targets.map((range) => ({ ...range, groupId, animation: DEFAULT_SELECTION_ANIMATION }));
      onSelectionAnimationsChange(replaceSelectionAnimations(selectionAnimations, ranges, lyrics));
    }
    showSlideAt(targets[0].start);
    setAnimationGroupId(groupId);
    onOpenChange(true);
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="btn-accent !px-2 !py-1.5 !text-xs"
          disabled={!selected.length}
          onClick={emphasizeSelection}
        >
          Destacar selección
        </button>
        <button
          className="btn-soft !px-2 !py-1.5 !text-xs"
          disabled={!selected.length}
          onClick={() => animateSelection(selected)}
        >
          <span aria-hidden="true">↝</span>
          Animar selección
        </button>
        <button
          className="btn-soft !px-2 !py-1.5 !text-xs"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => {
            if (open && activeGroup) setAnimationGroupId(null);
            else onOpenChange(!open);
          }}
        >
          Tipografía
          <span className="text-white/60">{preset?.label ?? 'Del tema'}</span>
        </button>
        {!selected.length && !emphasis.length && (
          <p className="text-xs text-white/55">Selecciona palabras en el cuadro de letra.</p>
        )}
      </div>

      {open && (
        <div id={panelId} className="mt-3 space-y-3 border-t border-white/10 pt-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Estilo tipográfico">
            <PresetButton active={!preset} label="Del tema" onClick={() => selectPreset()} />
            {PRESETS.map(([value, style]) => (
              <PresetButton
                key={value}
                active={typography?.preset === value}
                label={style.label}
                family={style.family}
                weight={style.weight}
                onClick={() => selectPreset(value)}
              />
            ))}
          </div>

          {preset && emphasis.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Fragmentos destacados">
              {emphasis.map((range) => {
                const text = lyrics.slice(range.start, range.end);
                return (
                  <li key={range.start} className="flex min-w-0 max-w-full items-center gap-0.5">
                    <button
                      className="btn-soft min-w-0 !gap-1 !px-2 !py-1 !text-xs"
                      aria-label={'Animar texto destacado: ' + text}
                      onClick={() => animateSelection([range])}
                    >
                      <span aria-hidden="true">↝</span>
                      <span className="truncate">{text}</span>
                    </button>
                    <button
                      className="btn-ghost !px-1.5 !py-1 !text-xs"
                      aria-label={'Quitar énfasis de ' + text}
                      onClick={() => update({ emphasis: emphasis.filter((item) => item !== range) })}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {animationGroups.size > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Selecciones animadas">
              {[...animationGroups].map(([id, group]) => (
                <li key={id} className="min-w-0 max-w-full">
                  <button
                    className={'btn-soft max-w-full !gap-1.5 !px-2 !py-1 !text-xs' +
                      (id === animationGroupId ? ' !bg-accent/20 !text-accent-soft' : '')}
                    aria-label={'Editar animación de ' + groupText(group)}
                    aria-pressed={id === animationGroupId}
                    onClick={() => {
                      setAnimationGroupId(id === animationGroupId ? null : id);
                      showSlideAt(group[0].start);
                    }}
                  >
                    <span aria-hidden="true">↝</span>
                    <span className="truncate">{groupText(group)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid items-start gap-4 md:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <div
                className="aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black"
                role="region"
                aria-label="Vista previa de la sección"
              >
                {slide ? (
                  <SlideStage
                    live={{ slide, theme, blackout: false, showLogo: false, clearText: false }}
                    replay={replay}
                  />
                ) : (
                  <p className="grid h-full place-items-center px-3 text-center text-xs text-white/60">
                    Escribe la letra para ver la diapositiva.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  className="btn-soft !px-2 !py-1.5 !text-xs"
                  disabled={!slide || (!slide.selectionAnimations?.length && !customAnimation
                    && hasLyricStyling(slide.typography) && typography?.speed === 'off')}
                  onClick={() => setReplay((current) => current + 1)}
                >
                  ↻ Reproducir
                </button>
                {slides.length > 1 && (
                  <div className="flex items-center gap-1 text-xs text-white/60">
                    <button
                      className="btn-ghost !px-2 !py-1"
                      aria-label="Diapositiva anterior de la sección"
                      disabled={index === 0}
                      onClick={() => setPart(index - 1)}
                    >
                      ‹
                    </button>
                    <span aria-live="polite">{index + 1} / {slides.length}</span>
                    <button
                      className="btn-ghost !px-2 !py-1"
                      aria-label="Diapositiva siguiente de la sección"
                      disabled={index === slides.length - 1}
                      onClick={() => setPart(index + 1)}
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            </div>

            {activeGroup ? (
              <fieldset className="min-w-0 space-y-2">
                <legend className="text-xs font-semibold text-accent-soft">Animación de la selección</legend>
                <p className="break-words text-sm font-medium text-white">{groupText(activeGroup)}</p>
                <TextAnimationFields
                  value={activeGroup[0].animation}
                  onChange={(animation) => onSelectionAnimationsChange(selectionAnimations.map((range) =>
                    range.groupId === animationGroupId ? { ...range, animation } : range,
                  ))}
                />
                <button
                  className="btn-ghost !px-2 !py-1 !text-xs"
                  onClick={() => {
                    onSelectionAnimationsChange(selectionAnimations.filter((range) => range.groupId !== animationGroupId));
                    setAnimationGroupId(null);
                  }}
                >
                  Quitar animación de la selección
                </button>
              </fieldset>
            ) : preset && (
              <div className="min-w-0 space-y-3">
                <label className="flex items-center gap-2 text-xs text-white/80">
                  <input
                    type="checkbox"
                    className="accent-accent"
                    checked={typography?.applyToSection ?? false}
                    onChange={(e) => update({ applyToSection: e.target.checked })}
                  />
                  Aplicar estilo a toda la sección
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {typography?.applyToSection && (
                    <FontPicker
                      label="Fuente de la sección"
                      value={typography?.family ?? preset.family}
                      onChange={(family) => update({ family })}
                    />
                  )}
                  <FontPicker
                    label="Fuente de lo destacado"
                    value={typography?.accentFamily ?? preset.accentFamily}
                    onChange={(accentFamily) => update({ accentFamily })}
                  />
                  {!customAnimation && (
                    <label>
                      <span className="label">Velocidad del estilo</span>
                      <select
                        className="input !px-2 !py-1.5 !text-xs"
                        value={typography?.speed ?? 'normal'}
                        onChange={(e) => update({ speed: e.target.value as LyricAnimationSpeed })}
                      >
                        <option value="off">Sin animación</option>
                        <option value="slow">Suave</option>
                        <option value="normal">Normal</option>
                        <option value="fast">Rápida</option>
                      </select>
                    </label>
                  )}
                  <label>
                    <span className="label">Color de énfasis</span>
                    <input
                      type="color"
                      className="input h-[31px] cursor-pointer !px-1 !py-0.5"
                      value={typography?.accentColor ?? preset.accentColor}
                      onChange={(e) => update({ accentColor: e.target.value })}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="label flex justify-between gap-2">
                    Tamaño de énfasis
                    <span>{Math.round((typography?.accentScale ?? preset.accentScale) * 100)}%</span>
                  </span>
                  <input
                    type="range"
                    className="w-full cursor-pointer accent-accent"
                    min={1}
                    max={1.8}
                    step={0.05}
                    value={typography?.accentScale ?? preset.accentScale}
                    onChange={(e) => update({ accentScale: e.target.valueAsNumber })}
                  />
                </label>
              </div>
            )}
          </div>
          <fieldset className="space-y-3 border-t border-white/10 pt-2">
            <legend className="pr-2 text-xs font-semibold text-white/80">Animación de toda la sección</legend>
            <label className="flex items-center gap-2 text-xs text-white/80">
              <input
                type="checkbox"
                className="accent-accent"
                checked={Boolean(sectionAnimation)}
                onChange={(event) => onAnimationChange(
                  event.target.checked ? getThemeTextAnimation(theme) : undefined,
                )}
              />
              Personalizar toda la sección
            </label>
            {sectionAnimation && (
              <TextAnimationFields value={sectionAnimation} onChange={onAnimationChange} />
            )}
          </fieldset>
        </div>
      )}
    </div>
  );
}

function PresetButton({ active, label, family, weight, onClick }: {
  active: boolean;
  label: string;
  family?: string;
  weight?: number;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={'btn-soft min-w-0 border !px-2 !py-2 !text-base ' +
        (active ? 'border-accent/80 !bg-accent/20 !text-white' : 'border-white/10')}
      style={family ? { fontFamily: '"' + family + '", sans-serif', fontWeight: weight } : undefined}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function FontPicker({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="label">{label}</span>
      <select className="input !px-2 !py-1.5 !text-xs" value={value} onChange={(e) => onChange(e.target.value)}>
        {FONT_OPTIONS.map(({ family, label: name }) => (
          <option key={family} value={family}>{name}</option>
        ))}
      </select>
    </label>
  );
}
