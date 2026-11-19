import { useState, useSyncExternalStore } from 'react';
import { hasAppUpdate, subscribeAppUpdate, updateApplication } from '../pwa/updates';
import { useResourceLibrary } from '../resources/ResourceLibrary';
import { useStore } from '../store/useStore';
import { toast } from '../store/toastStore';
import { libraryLoadErrorMessage } from '../lib/userFacingError';

export function UpdateAppButton() {
  const available = useSyncExternalStore(subscribeAppUpdate, hasAppUpdate);
  const [updating, setUpdating] = useState(false);
  const refreshLibrary = useStore((state) => state.refreshLibrary);
  const { refresh } = useResourceLibrary();

  async function update() {
    if (!navigator.onLine) {
      toast.info('Conéctate a internet para descargar los últimos cambios.');
      return;
    }
    setUpdating(true);
    try {
      // La app puede actualizarse aunque un fallo de permisos impida leer datos.
      const [data, app] = await Promise.allSettled([
        Promise.all([refreshLibrary(), refresh()]), updateApplication(),
      ]);
      if (app.status === 'rejected') throw app.reason;
      if (data.status === 'rejected') toast.error(libraryLoadErrorMessage(data.reason));
      else if (!app.value) toast.success('Biblioteca actualizada. Ya tienes la última versión de la app.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la actualización. Vuelve a intentarlo.');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <button type="button" className={`btn-soft ${available ? '!bg-accent !text-white' : ''}`}
      disabled={updating} aria-busy={updating} onClick={() => void update()}
      title="Descargar los últimos cambios de la biblioteca y de la aplicación">
      <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-4 w-4 fill-none stroke-current stroke-2 ${updating ? 'animate-spin' : ''}`}>
        <path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1" />
      </svg>
      {updating ? 'Actualizando…' : available ? 'Actualizar app' : 'Actualizar'}
    </button>
  );
}
