import { useStore } from '../../store/useStore';
import { BLOCK_LABELS } from '../../lib/slides';

const TYPE_COLOR: Record<string, string> = {
  verse: 'bg-sky-500/20 text-sky-300',
  chorus: 'bg-accent/25 text-accent-soft',
  bridge: 'bg-amber-500/20 text-amber-300',
  intro: 'bg-emerald-500/20 text-emerald-300',
  outro: 'bg-rose-500/20 text-rose-300',
  scripture: 'bg-amber-400/15 text-amber-200',
  custom: 'bg-white/10 text-white/60',
};

export function SlidesGrid() {
  const slides = useStore((s) => s.slides);
  const workspaceTab = useStore((s) => s.workspaceTab);
  const biblePassageLabel = useStore((s) => s.biblePassageLabel);
  const activeSongId = useStore((s) => s.activeSongId);
  const songs = useStore((s) => s.songs);
  const liveSlideIndex = useStore((s) => s.liveSlideIndex);
  const goLive = useStore((s) => s.goLive);
  const setEditingSong = useStore((s) => s.setEditingSong);

  const song = songs.find((s) => s.id === activeSongId);

  if (workspaceTab === 'lyrics' && !song) {
    return (
      <div className="grid h-full place-items-center text-center text-white/30">
        <div>
          <p className="text-sm">Selecciona una canción de la biblioteca</p>
        </div>
      </div>
    );
  }

  if (workspaceTab === 'bible' && slides.length === 0) {
    return (
      <div className="grid h-full place-items-center px-8 text-center text-white/30">
        <div>
          <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-amber-400/10 text-lg text-amber-200">✦</div>
          <p className="text-sm text-white/45">Elige uno o varios versículos</p>
          <p className="mt-1 text-xs">El pasaje aparecerá aquí usando el tema activo.</p>
        </div>
      </div>
    );
  }

  const title = workspaceTab === 'bible' ? biblePassageLabel : song?.title;
  const unit = workspaceTab === 'bible' ? 'versículos' : 'slides';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span className="text-xs text-white/30">
          {slides.length} {unit} · clic para proyectar
        </span>
        {workspaceTab === 'lyrics' && song && (
          <button
            className="btn-soft ml-auto !py-1.5 text-xs"
            onClick={() => setEditingSong(song.id)}
          >
            ✎ Editar letra
          </button>
        )}
      </div>
      <div className="grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto px-4 pb-4 lg:grid-cols-3 xl:grid-cols-4">
        {slides.map((slide, i) => {
          const live = i === liveSlideIndex;
          return (
            <button
              key={slide.id}
              onClick={() => goLive(i)}
              className={`group relative flex aspect-video flex-col justify-between overflow-hidden rounded-xl border p-3 text-left transition ${
                live
                  ? 'border-accent bg-accent/10 shadow-glow'
                  : 'border-white/10 bg-ink-900/60 hover:border-white/25'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_COLOR[slide.type] ?? TYPE_COLOR.custom}`}
                >
                  {slide.label ?? BLOCK_LABELS[slide.type]}
                  {slide.partCount > 1 ? ` ${slide.partIndex + 1}/${slide.partCount}` : ''}
                </span>
                {live && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-accent-soft">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-soft" />
                    EN VIVO
                  </span>
                )}
              </div>
              <div className="min-h-0 overflow-hidden text-[11px] leading-snug text-white/70">
                {slide.lines.slice(0, 4).map((l, idx) => (
                  <div
                    key={idx}
                    className={workspaceTab === 'bible' ? 'line-clamp-4' : 'truncate'}
                  >
                    {l}
                  </div>
                ))}
              </div>
              {slide.reference && (
                <div className="truncate pt-1 text-[10px] font-medium text-amber-200/70">
                  {slide.reference}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
