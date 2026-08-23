import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Toolbar } from './Toolbar';
import { Library } from './Library';
import { SlidesGrid } from './SlidesGrid';
import { LivePreview } from './LivePreview';
import { ThemePanel } from './ThemePanel';
import { SongEditor } from './SongEditor';
import { BiblePanel } from './BiblePanel';
import { requestOutputFullscreen } from '../../sync/screens';

export function ControlView() {
  const editingSongId = useStore((s) => s.editingSongId);
  const setEditingSong = useStore((s) => s.setEditingSong);
  const next = useStore((s) => s.next);
  const prev = useStore((s) => s.prev);
  const toggleBlackout = useStore((s) => s.toggleBlackout);
  const toggleLogo = useStore((s) => s.toggleLogo);
  const workspaceTab = useStore((s) => s.workspaceTab);
  const setWorkspaceTab = useStore((s) => s.setWorkspaceTab);
  const [rightTab, setRightTab] = useState<'preview' | 'theme'>('preview');

  useEffect(() => {
    document.title = 'Wordship Screen — Control';
  }, []);

  // Atajos de teclado
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (editingSongId) return;
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prev();
          break;
        case 'b':
        case 'B':
          toggleBlackout();
          break;
        case 'l':
        case 'L':
          toggleLogo();
          break;
        case 'f':
        case 'F':
          if (requestOutputFullscreen()) e.preventDefault();
          break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, toggleBlackout, toggleLogo, editingSongId]);

  return (
    <div className="flex h-screen flex-col bg-ink-900 text-white">
      <Toolbar />

      <div className="grid min-h-0 flex-1 grid-cols-[320px_minmax(400px,1fr)_420px]">
        {/* Izquierda: letras / Biblia */}
        <aside className="flex min-h-0 flex-col border-r border-white/5 bg-ink-800/40">
          <div className="grid grid-cols-2 gap-1 border-b border-white/5 p-2">
            {(['lyrics', 'bible'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setWorkspaceTab(tab)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  workspaceTab === tab
                    ? 'bg-accent text-white shadow-glow'
                    : 'text-white/45 hover:bg-white/5 hover:text-white/75'
                }`}
              >
                {tab === 'lyrics' ? 'Letras' : 'Biblia'}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {workspaceTab === 'lyrics' ? (
              <Library onEdit={(id) => setEditingSong(id)} />
            ) : (
              <BiblePanel />
            )}
          </div>
        </aside>

        {/* Centro: slides */}
        <main className="min-h-0 bg-ink-900">
          <SlidesGrid />
        </main>

        {/* Derecha: preview + personalización */}
        <aside className="flex min-h-0 flex-col border-l border-white/5 bg-ink-800/40">
          <div className="flex gap-1 border-b border-white/5 p-2">
            {(['preview', 'theme'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  rightTab === tab
                    ? 'bg-accent text-white'
                    : 'text-white/50 hover:bg-white/5'
                }`}
              >
                {tab === 'preview' ? 'Vista en vivo' : 'Personalizar'}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {rightTab === 'preview' ? (
              <div className="p-4">
                <LivePreview />
              </div>
            ) : (
              <ThemePanel />
            )}
          </div>
        </aside>
      </div>

      {editingSongId && (
        <SongEditor songId={editingSongId} onClose={() => setEditingSong(null)} />
      )}
    </div>
  );
}
