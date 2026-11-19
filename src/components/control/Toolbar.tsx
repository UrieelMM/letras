import { useEffect, useRef, useState } from 'react';
import { useStore, type Backup } from '../../store/useStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import {
  openOutputWindow,
  captureOutputWindow,
  focusOutputWindow,
  hasExtendedDisplay,
  hasMultiScreenSupport,
  requestOutputFullscreen,
} from '../../sync/screens';
import { createChannel } from '../../sync/channel';
import type { OutputStatus } from '../../types';
import { saveLibraryImage } from '../../media/libraryMedia';
import appLogo from '../../assets/3.png';
import { InstallAppButton } from '../InstallAppButton';
import { UpdateAppButton } from '../UpdateAppButton';

export function Toolbar() {
  const live = useStore((s) => s.live);
  const toggleBlackout = useStore((s) => s.toggleBlackout);
  const toggleLogo = useStore((s) => s.toggleLogo);
  const toggleClear = useStore((s) => s.toggleClear);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const updateSettings = useStore((s) => s.updateSettings);
  const userId = useStore((s) => s.userId);
  const syncError = useStore((s) => s.syncError);
  const user = useAuthStore((s) => s.user);
  const localMode = useAuthStore((s) => s.localMode);
  const authConfigured = useAuthStore((s) => s.configured);
  const signOutUser = useAuthStore((s) => s.signOutUser);
  const fileRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUploadProgress, setLogoUploadProgress] = useState<number | null>(null);
  const [openingOutput, setOpeningOutput] = useState(false);
  const [outputStatus, setOutputStatus] = useState<OutputStatus | null>(null);
  const [extendedDisplay, setExtendedDisplay] = useState<boolean | null>(() =>
    hasExtendedDisplay(),
  );
  const lastOutputStatusAt = useRef(0);

  useEffect(() => {
    const channel = createChannel();
    const unsub = channel.subscribe((message) => {
      if (message.type !== 'OUTPUT_STATUS') return;

      if (!message.payload.ready) {
        lastOutputStatusAt.current = 0;
        setOutputStatus(null);
        return;
      }

      lastOutputStatusAt.current = Date.now();
      setOutputStatus(message.payload);
    });

    const requestStatus = () => {
      setExtendedDisplay(hasExtendedDisplay());
      channel.post({ type: 'REQUEST_OUTPUT_STATUS' });

      if (
        lastOutputStatusAt.current > 0 &&
        Date.now() - lastOutputStatusAt.current > 6000
      ) {
        lastOutputStatusAt.current = 0;
        setOutputStatus(null);
      }
    };

    const handleOutputWindowMessage = (event: MessageEvent) => {
      captureOutputWindow(event);
    };

    window.addEventListener('message', handleOutputWindowMessage);
    requestStatus();
    const interval = window.setInterval(requestStatus, 2500);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('message', handleOutputWindowMessage);
      unsub();
      channel.close();
    };
  }, []);

  async function handleOpenOutput() {
    if (outputStatus && !outputStatus.fullscreen && requestOutputFullscreen()) {
      return;
    }

    if (outputStatus?.fullscreen && focusOutputWindow()) {
      return;
    }

    setOpeningOutput(true);
    try {
      const result = await openOutputWindow();
      setExtendedDisplay(hasExtendedDisplay());

      if (!result.window) {
        toast.error('No se pudo abrir la proyección. Permite las ventanas emergentes.');
        return;
      }

      if (result.placement === 'external') {
        toast.success(`Proyección enviada a ${result.displayName}. Presiona F para completar.`);
        return;
      }

      if (result.reason === 'no-external-display') {
        toast.info('No se detectó una pantalla extendida. Configura HDMI en modo Extender.');
      } else if (result.reason === 'permission-denied') {
        toast.info('La salida está abierta. Autoriza administrar ventanas o muévela al proyector.');
      } else {
        toast.info('La salida está abierta. Muévela al proyector y vuelve a presionar F.');
      }
    } finally {
      setOpeningOutput(false);
    }
  }

  const outputLabel = outputStatus
    ? outputStatus.fullscreen
      ? `Proyección activa · ${outputStatus.width}×${outputStatus.height} · completa`
      : `Proyección activa · ${outputStatus.width}×${outputStatus.height}`
    : extendedDisplay
      ? 'Pantalla extendida detectada'
      : hasMultiScreenSupport()
        ? 'HDMI: usa modo Extender'
        : 'Salida manual disponible';

  function handleExport() {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wordship-screen-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Respaldo exportado.');
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as Backup;
        void importData(data)
          .then(() => toast.success('Respaldo importado correctamente.'))
          .catch(() => toast.error('No se pudo guardar el respaldo en la nube.'));
      } catch {
        toast.error('Archivo de respaldo inválido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleSignOut() {
    signOutUser()
      .then(() => toast.info('Sesión cerrada.'))
      .catch(() => toast.error('No se pudo cerrar sesión.'));
  }

  async function handleLogoUpload(file: File | undefined) {
    if (!file) return;
    setLogoUploadProgress(0);
    try {
      if (!userId) return;
      const logoUrl = await saveLibraryImage(userId, file, 'logo', setLogoUploadProgress);
      updateSettings({ logoUrl });
      toast.success(userId === 'local' ? 'Logo guardado en este dispositivo.' : 'Logo compartido con todas las cuentas.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo subir el logo.';
      toast.error(message);
    } finally {
      setLogoUploadProgress(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/5 bg-ink-800/60 px-5 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <div className="grid h-[50px] w-[50px] place-items-center overflow-hidden bg-transparent">
          <img src={appLogo} alt="" className="h-[50px] w-[50px] max-w-none object-contain" />
        </div>
        <div className="leading-none">
          <div className="text-xs font-extrabold text-white">Wordship</div>
          <div className="mt-0.5 text-xs font-extrabold text-white">Screen</div>
          <div
            className={`mt-1 max-w-[190px] truncate text-[9px] ${
              outputStatus ? 'text-emerald-300/80' : 'text-white/40'
            }`}
            title={outputLabel}
          >
            {outputLabel}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className={`btn-soft ${live.clearText ? '!bg-white/20 !text-white' : ''}`}
          onClick={toggleClear}
          title="Ocultar texto, mantener fondo"
        >
          Clear
        </button>
        <div className="flex items-stretch">
          <button
            className={`btn-soft !rounded-r-none ${live.showLogo ? '!bg-accent !text-white' : ''}`}
            onClick={toggleLogo}
            title="Mostrar u ocultar el logo en la proyección"
          >
            Logo
          </button>
          <button
            type="button"
            className="btn-soft !rounded-l-none !border-l !border-white/10 !px-2"
            title="Cargar logo personalizado"
            aria-label="Cargar logo personalizado"
            disabled={logoUploadProgress !== null}
            onClick={() => logoInputRef.current?.click()}
          >
            {logoUploadProgress === null ? (
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2">
                <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
              </svg>
            ) : (
              <span className="text-[10px]">{logoUploadProgress}%</span>
            )}
          </button>
        </div>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
          className="hidden"
          onChange={(e) => void handleLogoUpload(e.target.files?.[0])}
        />
        <button
          className={`btn-soft ${live.blackout ? '!bg-red-500 !text-white' : ''}`}
          onClick={toggleBlackout}
        >
          Blackout
        </button>
        <div className="mx-1 h-6 w-px bg-white/10" />

        <button className="btn-ghost" onClick={handleExport} title="Exportar respaldo JSON">
          ⬇
        </button>
        <button
          className="btn-ghost"
          onClick={() => fileRef.current?.click()}
          title="Importar respaldo JSON"
        >
          ⬆
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImport}
        />

        <InstallAppButton />
        <UpdateAppButton />
        {syncError && <span role="status" title={syncError} className="text-xs text-amber-300">Sincronización pendiente</span>}

        <button
          className="btn-accent"
          onClick={() => void handleOpenOutput()}
          disabled={openingOutput}
          title="Usa el HDMI en modo Extender; el dashboard permanece en esta pantalla"
        >
          {outputStatus && <span className="h-2 w-2 rounded-full bg-emerald-300" />}
          {openingOutput
            ? 'Detectando pantalla…'
            : outputStatus
              ? outputStatus.fullscreen
                ? 'Enfocar proyección'
                : 'Pantalla completa'
              : 'Abrir proyección'}
        </button>

        <div className="mx-1 h-6 w-px bg-white/10" />
        <span className="hidden max-w-[160px] truncate text-xs text-white/40 sm:inline">
          {localMode ? 'Modo offline' : user?.name ?? user?.email}
        </span>
        {(user || (localMode && authConfigured)) && (
          <button
            className="btn-ghost"
            onClick={handleSignOut}
            title={localMode ? 'Conectar una cuenta' : 'Cerrar sesión'}
          >
            {localMode ? 'Conectar' : 'Salir'}
          </button>
        )}
      </div>
    </header>
  );
}
