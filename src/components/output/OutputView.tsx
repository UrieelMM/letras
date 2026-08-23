import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { createChannel } from '../../sync/channel';
import {
  announceOutputWindow,
  isOutputFullscreenRequest,
} from '../../sync/screens';
import { SlideStage } from '../SlideStage';

interface ScreenTargetFullscreenOptions extends FullscreenOptions {
  screen?: unknown;
}

/**
 * Ventana de proyección (lo que ve el público).
 * Sólo escucha el canal y renderiza el estado en vivo a pantalla completa.
 */
export function OutputView() {
  const live = useStore((s) => s.live);
  const setLive = useStore((s) => s.setLive);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [fullscreenError, setFullscreenError] = useState('');

  const enterFullscreen = useCallback(async () => {
    setFullscreenError('');

    if (document.fullscreenElement) return true;

    if (!document.fullscreenEnabled) {
      setFullscreenError('El navegador no permite pantalla completa en esta ventana. Usa F11.');
      return false;
    }

    try {
      const options: ScreenTargetFullscreenOptions = { navigationUI: 'hide' };

      // En Windows, especificar la pantalla evita que Chromium elija la
      // principal cuando el popup está en un monitor/proyector secundario.
      if (typeof window.getScreenDetails === 'function') {
        try {
          const details = await window.getScreenDetails();
          options.screen = details.currentScreen;
        } catch {
          // El Fullscreen API estándar sigue funcionando sin este permiso.
        }
      }

      await document.documentElement.requestFullscreen(options);
      return true;
    } catch (error) {
      console.error('No se pudo activar pantalla completa:', error);
      setFullscreenError(
        'Chrome u Opera bloqueó la solicitud. Haz clic en este botón dentro de la proyección o usa F11.',
      );
      return false;
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await enterFullscreen();
  }, [enterFullscreen]);

  useEffect(() => {
    document.title = 'Wordship Screen — Proyección';
    const channel = createChannel();

    const postStatus = (ready = true) => {
      announceOutputWindow();
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
    const handleControlMessage = (event: MessageEvent) => {
      if (!isOutputFullscreenRequest(event)) return;
      void enterFullscreen();
    };

    window.addEventListener('message', handleControlMessage);
    return () => window.removeEventListener('message', handleControlMessage);
  }, [enterFullscreen]);

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
            También puedes presionar F o hacer doble clic aquí. Esc sale de pantalla completa.
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
