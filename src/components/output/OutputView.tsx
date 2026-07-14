import { useEffect } from 'react';
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

  useEffect(() => {
    document.title = 'Letras — Proyección';
    const channel = createChannel();
    const unsub = channel.subscribe((msg) => {
      if (msg.type === 'LIVE') setLive(msg.payload);
    });
    // Pide el estado actual al abrir
    channel.post({ type: 'REQUEST_STATE' });
    return () => {
      unsub();
      channel.close();
    };
  }, [setLive]);

  return (
    <div className="fixed inset-0 cursor-none bg-black">
      <SlideStage live={live} />
    </div>
  );
}
