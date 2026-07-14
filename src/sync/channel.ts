import type { SyncMessage } from '../types';

const CHANNEL_NAME = 'letras-live';

/**
 * Canal de comunicación entre la ventana de control y la de proyección.
 * Usa BroadcastChannel (mismo origen, sin servidor).
 */
export function createChannel() {
  const bc = new BroadcastChannel(CHANNEL_NAME);

  return {
    post(message: SyncMessage) {
      bc.postMessage(message);
    },
    subscribe(handler: (message: SyncMessage) => void) {
      const listener = (ev: MessageEvent<SyncMessage>) => handler(ev.data);
      bc.addEventListener('message', listener);
      return () => bc.removeEventListener('message', listener);
    },
    close() {
      bc.close();
    },
  };
}
