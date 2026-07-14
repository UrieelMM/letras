import { useRef } from 'react';
import { useStore, type Backup } from '../../store/useStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import { openOutputWindow, hasMultiScreenSupport } from '../../sync/screens';

export function Toolbar() {
  const live = useStore((s) => s.live);
  const toggleBlackout = useStore((s) => s.toggleBlackout);
  const toggleLogo = useStore((s) => s.toggleLogo);
  const toggleClear = useStore((s) => s.toggleClear);
  const clearLive = useStore((s) => s.clearLive);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const user = useAuthStore((s) => s.user);
  const signOutUser = useAuthStore((s) => s.signOutUser);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleOpenOutput() {
    const win = await openOutputWindow();
    if (!win) {
      toast.error('No se pudo abrir la proyección. Permite las ventanas emergentes.');
    }
  }

  function handleExport() {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `letras-backup-${new Date().toISOString().slice(0, 10)}.json`;
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

  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/5 bg-ink-800/60 px-5 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent font-black text-white shadow-glow">
          L
        </div>
        <div>
          <div className="text-sm font-bold leading-none text-white">Letras</div>
          <div className="text-[10px] text-white/40">
            {hasMultiScreenSupport() ? 'Multi-pantalla activa' : 'Modo ventana'}
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
        <button
          className={`btn-soft ${live.showLogo ? '!bg-accent !text-white' : ''}`}
          onClick={toggleLogo}
        >
          Logo
        </button>
        <button
          className={`btn-soft ${live.blackout ? '!bg-red-500 !text-white' : ''}`}
          onClick={toggleBlackout}
        >
          Blackout
        </button>
        <button className="btn-ghost" onClick={clearLive} title="Quitar de proyección">
          Limpiar
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

        <button className="btn-accent" onClick={handleOpenOutput}>
          Abrir proyección
        </button>

        <div className="mx-1 h-6 w-px bg-white/10" />
        <span className="hidden max-w-[160px] truncate text-xs text-white/40 sm:inline">
          {user?.name ?? user?.email}
        </span>
        <button className="btn-ghost" onClick={handleSignOut} title="Cerrar sesión">
          Salir
        </button>
      </div>
    </header>
  );
}
