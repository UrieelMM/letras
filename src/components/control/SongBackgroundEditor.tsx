import { useMemo, useState } from 'react';
import { buildSlides, BLOCK_LABELS } from '../../lib/slides';
import { REMOVED_THEME_IDS } from '../../lib/removedThemes';
import { RESOURCE_CATEGORIES, resourceBackground } from '../../resources/model';
import { useResourceLibrary } from '../../resources/ResourceLibrary';
import { useStore } from '../../store/useStore';
import type { BackgroundConfig, Song, Theme } from '../../types';
import { SlideStage } from '../SlideStage';
import { ResourceUploadForm } from './ResourceUploadForm';

interface Props {
  song: Song;
  theme: Theme;
  onSongBackground: (background?: BackgroundConfig) => void;
  onSlideBackground: (blockId: string, partIndex: number, background?: BackgroundConfig) => void;
}

export function SongBackgroundEditor({ song, theme, onSongBackground, onSlideBackground }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const slides = useMemo(() => buildSlides(song), [song]);
  const selected = slides.find((slide) => slide.id === selectedId);
  const selectedBlock = song.blocks.find((block) => block.id === selected?.blockId);
  const override = selected
    ? selectedBlock?.slideBackgrounds?.find((item) => item.partIndex === selected.partIndex)?.background
    : song.background;
  const inherited = selected ? song.background ?? theme.background : theme.background;
  const sample = selected ?? slides[0];

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(170px,1fr)_minmax(0,2fr)]">
      <nav aria-label="Diapositivas para cambiar el fondo" className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-white/10 p-2 md:max-h-[30rem]">
        <button
          className={rowClass(!selected)}
          aria-pressed={!selected}
          onClick={() => setSelectedId(null)}
        >
          <span className="block font-semibold">Toda la canción</span>
          <span className="text-xs text-white/60">{song.background ? 'Fondo definido' : 'Fondo del tema'}</span>
        </button>
        {slides.map((slide, index) => {
          const ownBackground = song.blocks.find((block) => block.id === slide.blockId)
            ?.slideBackgrounds?.some((item) => item.partIndex === slide.partIndex);
          return (
            <button key={slide.id} className={rowClass(slide.id === selected?.id)} aria-pressed={slide.id === selected?.id} onClick={() => setSelectedId(slide.id)}>
              <span className="block text-xs text-white/65">{index + 1}. {slide.label || BLOCK_LABELS[slide.type]}{ownBackground ? ' · Fondo propio' : ''}</span>
              <span className="block truncate text-sm">{slide.lines[0]}</span>
            </button>
          );
        })}
      </nav>
      <div className="min-w-0 space-y-3">
        <div>
          <h3 className="font-semibold">{selected ? `Diapositiva ${slides.indexOf(selected) + 1}` : 'Fondo de toda la canción'}</h3>
          <p className="text-xs text-white/60">
            {selected ? (override ? 'Esta diapositiva tiene un fondo propio.' : 'Esta diapositiva usa el fondo de la canción.')
              : 'Se aplica a las diapositivas que no tienen un fondo propio.'}
          </p>
        </div>
        <div role="region" aria-label="Vista previa del fondo" className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
          <SlideStage live={{
            slide: sample ? { ...sample, background: override ?? inherited } : null,
            theme: { ...theme, background: override ?? inherited },
            blackout: false,
            showLogo: false,
            clearText: false,
          }} />
        </div>
        <BackgroundOptions
          key={selected?.id ?? 'song'}
          background={override}
          inherited={inherited}
          resetLabel={selected ? 'Usar fondo de la canción' : 'Usar fondo del tema'}
          onChange={(background) => {
            if (selected) onSlideBackground(selected.blockId, selected.partIndex, background);
            else onSongBackground(background);
          }}
        />
      </div>
    </div>
  );
}

function rowClass(active: boolean) {
  return `block w-full rounded-lg px-3 py-2 text-left text-sm ${active ? 'bg-accent/20 text-white' : 'hover:bg-white/5'}`;
}

type Source = 'color' | 'theme' | 'media';

function BackgroundOptions({ background, inherited, resetLabel, onChange }: {
  background?: BackgroundConfig;
  inherited: BackgroundConfig;
  resetLabel: string;
  onChange: (background?: BackgroundConfig) => void;
}) {
  const themes = useStore((state) => state.themes).filter((theme) => !REMOVED_THEME_IDS.has(theme.id));
  const { items, loading, error } = useResourceLibrary();
  const current = background ?? inherited;
  const [source, setSource] = useState<Source>(
    current.kind === 'solid' ? 'color' : current.kind === 'image' || current.kind === 'video' ? 'media' : 'theme',
  );
  const [upload, setUpload] = useState(false);
  const [themeId, setThemeId] = useState('');
  const media = current.kind === 'image' || current.kind === 'video' ? current : null;
  const currentResource = items.find((item) => item.url === media?.url);

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[.035] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Origen del fondo">
          {([['color', 'Color'], ['theme', 'De un tema'], ['media', 'Imagen o video']] as const).map(([id, label]) => (
            <button
              key={id}
              aria-pressed={source === id}
              className={`btn-soft !px-2 !py-1 !text-xs ${source === id ? '!bg-accent/20 !text-white' : ''}`}
              onClick={() => setSource(id)}
            >{label}</button>
          ))}
        </div>
        {background && <button className="btn-ghost !px-2 !py-1 !text-xs" onClick={() => { setThemeId(''); onChange(); }}>{resetLabel}</button>}
      </div>
      {source === 'color' && (
        <div className="flex flex-wrap items-end gap-2">
          <label>
            <span className="label">Color del fondo</span>
            <input type="color" className="input h-9 w-16 p-1" value={current.kind === 'solid' && /^#[0-9a-f]{6}$/i.test(current.color) ? current.color : '#0b0b12'} onChange={(event) => onChange({ kind: 'solid', color: event.target.value })} />
          </label>
          {current.kind !== 'solid' && <button className="btn-soft" onClick={() => onChange({ kind: 'solid', color: '#0b0b12' })}>Aplicar color sólido</button>}
        </div>
      )}
      {source === 'theme' && (
        <label className="block">
          <span className="label">Fondo de un tema</span>
          <select className="input" value={themeId} onChange={(event) => {
            const id = event.target.value;
            const chosen = themes.find((theme) => theme.id === id);
            setThemeId(id);
            if (chosen) onChange(chosen.background);
          }}>
            <option value="" disabled>Elige un tema</option>
            {themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
          </select>
        </label>
      )}
      {source === 'media' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-0 flex-1">
              <span className="label">Recurso de la biblioteca</span>
              <select className="input" value={currentResource?.id ?? ''} onChange={(event) => {
                const item = items.find((entry) => entry.id === event.target.value);
                if (item) onChange(resourceBackground(item));
              }}>
                <option value="" disabled>{loading ? 'Cargando recursos…' : 'Elige una imagen o un video'}</option>
                {RESOURCE_CATEGORIES.map((category) => {
                  const group = items.filter((item) => item.category === category.id);
                  return group.length > 0 && (
                    <optgroup key={category.id} label={category.label}>
                      {group.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.kind === 'video' ? 'Video' : 'Imagen'}</option>)}
                    </optgroup>
                  );
                })}
              </select>
            </label>
            {!upload && <button className="btn-soft" onClick={() => setUpload(true)}>+ Subir archivo</button>}
          </div>
          {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
          {media && (
            <label className="block">
              <span className="label">Ajuste a la pantalla</span>
              <select className="input" value={media.fit} onChange={(event) => onChange({ ...media, fit: event.target.value as 'cover' | 'contain' })}>
                <option value="cover">Llenar pantalla</option>
                <option value="contain">Mostrar completo</option>
              </select>
            </label>
          )}
          {upload && <ResourceUploadForm category="general" onCancel={() => setUpload(false)} onUploaded={(item) => {
            setUpload(false);
            onChange(resourceBackground(item));
          }} />}
        </div>
      )}
    </div>
  );
}
