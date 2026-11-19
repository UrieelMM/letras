import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { toast } from '../../store/toastStore';
import { uid } from '../../lib/id';
import { rebaseLyricRanges } from '../../lib/lyricTypography';
import { rebaseSlideBackgrounds } from '../../lib/slideBackgrounds';
import { BLOCK_LABELS } from '../../lib/slides';
import type { LyricEmphasis, SlideBlock, SlideBlockType, Song } from '../../types';
import { LyricTypographyEditor } from './LyricTypographyEditor';
import { SongBackgroundEditor } from './SongBackgroundEditor';

interface Props {
  songId: string;
  onClose: () => void;
}

const TYPES: SlideBlockType[] = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'custom'];

export function SongEditor({ songId, onClose }: Props) {
  const songs = useStore((s) => s.songs);
  const saveSong = useStore((s) => s.saveSong);
  const original = songs.find((s) => s.id === songId);
  const [baseline, setBaseline] = useState<Song | null>(original ?? null);
  const [draft, setDraft] = useState<Song | null>(original ?? null);
  const [tagsText, setTagsText] = useState(original?.tags.join(', ') ?? '');
  const [editorTab, setEditorTab] = useState<'lyrics' | 'backgrounds'>('lyrics');
  const [typographyBlockId, setTypographyBlockId] = useState<string | null>(null);
  const [selection, setSelection] = useState<(LyricEmphasis & { blockId: string }) | null>(null);
  const theme = useStore((s) => s.themeForSong(draft));
  const localChanges = JSON.stringify(draft) !== JSON.stringify(baseline)
    || tagsText !== (baseline?.tags.join(', ') ?? '');
  const remoteChanges = Boolean(original && baseline && JSON.stringify(original) !== JSON.stringify(baseline));

  function loadSharedVersion() {
    if (!original) return;
    setBaseline(original);
    setDraft(original);
    setTagsText(original.tags.join(', '));
    setTypographyBlockId(null);
    setSelection(null);
  }

  useEffect(() => {
    setDraft(original ? { ...original } : null);
    setBaseline(original ?? null);
    setTagsText(original?.tags.join(', ') ?? '');
    setTypographyBlockId(null);
    setSelection(null);
    setEditorTab('lyrics');
  }, [songId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Un editor sin cambios sigue las correcciones de las demás cuentas. Un
  // borrador en curso se conserva hasta que el operador cargue la nueva copia.
  useEffect(() => {
    if (original && (!draft || !localChanges && remoteChanges)) loadSharedVersion();
  }, [original, draft, localChanges, remoteChanges]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!draft) return null;

  function set(patch: Partial<Song>) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }
  function setBlock(id: string, patch: Partial<SlideBlock>) {
    setDraft((d) =>
      d ? { ...d, blocks: d.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) } : d,
    );
  }
  function updateLyrics(block: SlideBlock, value: string, caret: number) {
    const typography = block.typography;
    const before = block.lines.join('\n');
    const lines = value.split('\n');
    const patch: Partial<SlideBlock> = { lines };
    if (typography?.emphasis?.length) {
      patch.typography = {
        ...typography,
        emphasis: rebaseLyricRanges(typography.emphasis, before, value, caret),
      };
    }
    if (block.selectionAnimations?.length) {
      patch.selectionAnimations = rebaseLyricRanges(block.selectionAnimations, before, value, caret);
    }
    if (block.slideBackgrounds?.length) {
      patch.slideBackgrounds = rebaseSlideBackgrounds(block, lines, caret);
    }
    setBlock(block.id, patch);
  }
  function addBlock() {
    setDraft((d) =>
      d
        ? {
            ...d,
            blocks: [
              ...d.blocks,
              { id: uid('b-'), type: 'verse', label: '', lines: [''] },
            ],
          }
        : d,
    );
  }
  function removeBlock(id: string) {
    setDraft((d) => (d ? { ...d, blocks: d.blocks.filter((b) => b.id !== id) } : d));
  }
  function move(id: string, dir: -1 | 1) {
    setDraft((d) => {
      if (!d) return d;
      const i = d.blocks.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.blocks.length) return d;
      const blocks = d.blocks.slice();
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      return { ...d, blocks };
    });
  }

  function handleSave() {
    if (!draft) return;
    if (remoteChanges) {
      toast.error('Otra cuenta actualizó esta canción. Carga la versión compartida antes de guardar.');
      return;
    }
    if (!draft.title.trim()) {
      toast.error('Ponle un título a la canción.');
      return;
    }
    const tags = tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    saveSong({ ...draft, tags: Array.from(new Set(tags)) });
    toast.success('Canción guardada.');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-semibold text-white">Editar canción</h2>
          <button className="btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        {remoteChanges && localChanges && (
          <div role="status" className="flex items-center justify-between gap-3 border-b border-amber-300/20 bg-amber-300/10 px-5 py-3 text-sm text-amber-100">
            <p>Otra cuenta actualizó esta canción. Carga sus cambios antes de seguir editando.</p>
            <button className="btn-soft shrink-0" onClick={loadSharedVersion}>Cargar versión compartida</button>
          </div>
        )}

        <nav aria-label="Opciones de edición de canción" className="flex gap-1 border-b border-white/10 px-5 py-2">
          {([['lyrics', 'Letra'], ['backgrounds', 'Fondos']] as const).map(([id, label]) => (
            <button
              key={id}
              className={`btn-soft ${editorTab === id ? '!bg-accent/20 !text-white' : ''}`}
              aria-pressed={editorTab === id}
              onClick={() => setEditorTab(id)}
            >{label}</button>
          ))}
        </nav>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {editorTab === 'backgrounds' ? (
            <SongBackgroundEditor
              song={draft}
              theme={theme}
              onSongBackground={(background) => set({ background })}
              onSlideBackground={(blockId, partIndex, background) => {
                setDraft((current) => current && {
                  ...current,
                  blocks: current.blocks.map((block) => {
                    if (block.id !== blockId) return block;
                    const others = block.slideBackgrounds?.filter((item) => item.partIndex !== partIndex) ?? [];
                    return { ...block, slideBackgrounds: background ? [...others, { partIndex, background }] : others };
                  }),
                });
              }}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Título</label>
                  <input
                    className="input"
                    value={draft.title}
                    onChange={(e) => set({ title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Autor</label>
                  <input
                    className="input"
                    value={draft.author ?? ''}
                    onChange={(e) => set({ author: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Etiquetas (separadas por coma)</label>
                <input
                  className="input"
                  value={tagsText}
                  placeholder="Ej. alabanza, adoración, himno"
                  onChange={(e) => setTagsText(e.target.value)}
                />
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    Secciones
                  </h3>
                  <button className="btn-soft !py-1.5 text-xs" onClick={addBlock}>
                    + Sección
                  </button>
                </div>
                <p className="text-[11px] text-white/40">
                  Cada sección permanece en una sola diapositiva. Solo una línea en blanco crea
                  una nueva diapositiva.
                </p>

                {draft.blocks.map((block) => (
                  <div key={block.id} className="rounded-xl border border-white/10 bg-ink-900/50 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <select
                        className="input !w-auto !py-1.5 text-xs"
                        value={block.type}
                        onChange={(e) =>
                          setBlock(block.id, { type: e.target.value as SlideBlockType })
                        }
                      >
                        {TYPES.map((t) => (
                          <option key={t} value={t}>
                            {BLOCK_LABELS[t]}
                          </option>
                        ))}
                      </select>
                      <input
                        className="input !py-1.5 text-xs"
                        placeholder="Etiqueta (opcional, ej. Estrofa 1)"
                        value={block.label ?? ''}
                        onChange={(e) => setBlock(block.id, { label: e.target.value })}
                      />
                      <div className="flex shrink-0 gap-1">
                        <button className="btn-ghost !p-1.5" onClick={() => move(block.id, -1)}>
                          ↑
                        </button>
                        <button className="btn-ghost !p-1.5" onClick={() => move(block.id, 1)}>
                          ↓
                        </button>
                        <button
                          className="btn-ghost !p-1.5 hover:!text-red-300"
                          onClick={() => removeBlock(block.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <textarea
                      aria-label={'Letra de ' + (block.label || BLOCK_LABELS[block.type])}
                      className="input min-h-[120px] resize-y font-mono text-xs leading-relaxed"
                      placeholder={'Una línea por renglón.\nDeja una línea en blanco para separar diapositivas.'}
                      value={block.lines.join('\n')}
                      onChange={(e) => {
                        setSelection(null);
                        updateLyrics(block, e.currentTarget.value, e.currentTarget.selectionStart);
                      }}
                      onSelect={(e) => {
                        const { selectionStart, selectionEnd } = e.currentTarget;
                        setSelection({ blockId: block.id, start: selectionStart, end: selectionEnd });
                      }}
                    />
                    <LyricTypographyEditor
                      block={block}
                      theme={theme}
                      songBackground={draft.background}
                      selection={selection?.blockId === block.id ? selection : null}
                      open={typographyBlockId === block.id}
                      onOpenChange={(open) => setTypographyBlockId(open ? block.id : null)}
                      onChange={(typography) => setBlock(block.id, { typography })}
                      onAnimationChange={(textAnimation) => setBlock(block.id, { textAnimation })}
                      onSelectionAnimationsChange={(selectionAnimations) => setBlock(block.id, { selectionAnimations })}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-accent" onClick={handleSave}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
