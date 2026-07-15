import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { toast } from '../../store/toastStore';
import { uid } from '../../lib/id';
import { BLOCK_LABELS } from '../../lib/slides';
import type { SlideBlock, SlideBlockType, Song } from '../../types';

interface Props {
  songId: string;
  onClose: () => void;
}

const TYPES: SlideBlockType[] = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'custom'];

export function SongEditor({ songId, onClose }: Props) {
  const songs = useStore((s) => s.songs);
  const saveSong = useStore((s) => s.saveSong);
  const original = songs.find((s) => s.id === songId);
  const [draft, setDraft] = useState<Song | null>(original ?? null);
  const [tagsText, setTagsText] = useState(original?.tags.join(', ') ?? '');

  useEffect(() => {
    setDraft(original ? { ...original } : null);
    setTagsText(original?.tags.join(', ') ?? '');
  }, [songId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si la canción llega después (carga async / Firestore), rellena el borrador.
  useEffect(() => {
    if (!draft && original) {
      setDraft({ ...original });
      setTagsText(original.tags.join(', '));
    }
  }, [draft, original]);

  if (!draft) return null;

  function set(patch: Partial<Song>) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }
  function setBlock(id: string, patch: Partial<SlideBlock>) {
    setDraft((d) =>
      d ? { ...d, blocks: d.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) } : d,
    );
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
      <div className="glass flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-semibold text-white">Editar canción</h2>
          <button className="btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
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
                  className="input min-h-[120px] resize-y font-mono text-xs leading-relaxed"
                  placeholder={'Una línea por renglón.\nDeja una línea en blanco para separar diapositivas.'}
                  value={block.lines.join('\n')}
                  onChange={(e) => setBlock(block.id, { lines: e.target.value.split('\n') })}
                />
              </div>
            ))}
          </div>
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
