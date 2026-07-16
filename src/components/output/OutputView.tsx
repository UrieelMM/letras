import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { createChannel } from '../../sync/channel';
import { SlideStage } from '../SlideStage';

/**
 * Ventana de proyección (lo que ve el público).
 * Sólo escucha el canal y renderiza el estado en vivo a pantalla completa.
 */
export function OutputView() {
  const live = useStore((s) => s.live);
  const setLive = useStore((s) => s.setLive);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [fullscreenError, setFullscreenError] = useState('');

  const toggleFullscreen = useCallback(async () => {
    setFullscreenError('');

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (!document.fullscreenEnabled) {
        setFullscreenError('El navegador no permite pantalla completa en esta ventana.');
        return;
      }

      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    } catch {
      setFullscreenError('El navegador rechazó el modo. Prueba F11 o revisa el permiso.');
    }
  }, []);

  useEffect(() => {
    document.title = 'Wordship Screen — Proyección';
    const channel = createChannel();

    const postStatus = (ready = true) => {
      channel.post({
        type: 'OUTPUT_STATUS',
        payload: {
          ready,
          fullscreen: Boolean(document.fullscreenElement),
          width: window.innerWidth,
          height: window.innerHeight,
        },
      });
    };

    const unsub = channel.subscribe((msg) => {
      if (msg.type === 'LIVE') setLive(msg.payload);
      if (msg.type === 'REQUEST_OUTPUT_STATUS') postStatus();
    });

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      postStatus();
    };
    const handleResize = () => postStatus();
    const handleBeforeUnload = () => postStatus(false);

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', handleResize);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Pide el estado actual al abrir y confirma al dashboard que la salida ya
    // está escuchando. El orden evita perder el primer slide por una carrera.
    postStatus();
    channel.post({ type: 'REQUEST_STATE' });

    return () => {
      postStatus(false);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsub();
      channel.close();
    };
  }, [setLive]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'f') return;
      event.preventDefault();
      void toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  return (
    <div
      className={`fixed inset-0 overflow-hidden bg-black ${
        isFullscreen ? 'cursor-none' : 'cursor-default'
      }`}
      onContextMenu={(event) => event.preventDefault()}
      onDoubleClick={() => void toggleFullscreen()}
    >
      <SlideStage live={live} />

      {!isFullscreen && (
        <div
          className="absolute right-4 top-4 z-50 w-64 rounded-xl border border-white/15 bg-black/80 p-3 text-white shadow-2xl backdrop-blur-md"
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold">Salida de proyección</span>
            <span className="text-[10px] tabular-nums text-white/45">
              {window.innerWidth} × {window.innerHeight}
            </span>
          </div>
          <button
            type="button"
            className="w-full rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => void toggleFullscreen()}
            disabled={!document.fullscreenEnabled}
          >
            Pantalla completa (F)
          </button>
          <p className="mt-2 text-[10px] leading-relaxed text-white/45">
            También puedes hacer doble clic. Esc sale de pantalla completa.
          </p>
          {fullscreenError && (
            <p className="mt-2 text-[10px] leading-relaxed text-amber-300">
              {fullscreenError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
