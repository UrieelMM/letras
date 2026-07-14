import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';

interface Props {
  onEdit: (id: string) => void;
}

export function Library({ onEdit }: Props) {
  const songs = useStore((s) => s.songs);
  const activeSongId = useStore((s) => s.activeSongId);
  const setActiveSong = useStore((s) => s.setActiveSong);
  const createSong = useStore((s) => s.createSong);
  const deleteSong = useStore((s) => s.deleteSong);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.author?.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [songs, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
          Biblioteca
        </h2>
        <button
          className="btn-accent !px-2.5 !py-1.5 text-xs"
          onClick={() => onEdit(createSong())}
        >
          + Nueva
        </button>
      </div>

      <div className="px-4 pb-3">
        <input
          className="input"
          placeholder="Buscar canción, autor, etiqueta..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-white/30">
            Sin resultados
          </p>
        )}
        {filtered.map((song) => {
          const active = song.id === activeSongId;
          return (
            <button
              key={song.id}
              onClick={() => setActiveSong(song.id)}
              className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${
                active
                  ? 'bg-accent/20 ring-1 ring-accent/40'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">
                  {song.title}
                </div>
                {song.author && (
                  <div className="truncate text-xs text-white/40">
                    {song.author}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1 opacity-60 transition group-hover:opacity-100">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(song.id);
                  }}
                  className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
                  title="Editar"
                >
                  ✎
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`¿Eliminar "${song.title}"?`)) deleteSong(song.id);
                  }}
                  className="rounded p-1 text-white/50 hover:bg-red-500/20 hover:text-red-300"
                  title="Eliminar"
                >
                  ✕
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
