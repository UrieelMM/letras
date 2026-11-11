import { useStore } from '../../store/useStore';
import { SlideStage } from '../SlideStage';

export function LivePreview() {
  const live = useStore((s) => s.live);
  const next = useStore((s) => s.next);
  const prev = useStore((s) => s.prev);
  const liveSlideIndex = useStore((s) => s.liveSlideIndex);
  const slides = useStore((s) => s.slides);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
          Vista en vivo
        </span>
        <span className="text-xs text-white/30">
          {liveSlideIndex >= 0 ? `${liveSlideIndex + 1} / ${slides.length}` : '—'}
        </span>
      </div>

      <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 shadow-lg">
        <SlideStage live={live} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button className="btn-soft flex-1" onClick={prev} disabled={liveSlideIndex <= 0}>
          ◀ Anterior
        </button>
        <button
          className="btn-accent flex-1"
          onClick={next}
          disabled={liveSlideIndex < 0 || liveSlideIndex >= slides.length - 1}
        >
          Siguiente ▶
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-white/30">
        Atajos: ← → o Espacio para navegar · B blackout · L logo
      </p>
    </div>
  );
}
