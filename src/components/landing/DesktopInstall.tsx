import { useId, useState } from 'react';
import { InstallIcon, requestInstall, useInstallStatus } from '../InstallAppButton';

const DISMISSED_KEY = 'wordship.landing.install-dismissed.v1';

function initiallyOpen() {
  try {
    return localStorage.getItem(DISMISSED_KEY) !== 'true';
  } catch {
    return true;
  }
}

export function isDesktopInstallDevice() {
  const { userAgent, maxTouchPoints } = navigator;
  return !/Android|iPhone|iPad|iPod/i.test(userAgent) && !(/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}

export function DesktopInstall() {
  const status = useInstallStatus();
  const [open, setOpen] = useState(initiallyOpen);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [needsFocus, setNeedsFocus] = useState(false);
  const headingId = useId();
  const instructionsId = useId();

  if (status === 'installed') return null;

  function close() {
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // La tarjeta se cierra durante esta visita aunque el almacenamiento esté bloqueado.
    }
    setNeedsFocus(true);
    setOpen(false);
    setShowInstructions(false);
  }

  async function install() {
    if (status !== 'available') {
      setShowInstructions((visible) => !visible);
      return;
    }
    setInstalling(true);
    try {
      if (await requestInstall() !== 'accepted') setShowInstructions(true);
    } catch {
      setShowInstructions(true);
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-40 max-w-[calc(100%-2rem)] sm:bottom-6 sm:right-6">
      {open ? (
        <section
          aria-labelledby={headingId}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !installing) close();
          }}
          className="landing-install-card w-[335px] max-w-full rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/[.13] text-[#7657df]">
              <InstallIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={headingId} className="text-sm font-extrabold leading-5">Wordship Screen para escritorio</h2>
              <p className="landing-muted mt-1 text-xs">Disponible para Windows y macOS</p>
            </div>
            <button
              type="button"
              aria-label="Cerrar aviso de instalación"
              title="Cerrar aviso de instalación"
              className="landing-muted -mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg transition hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent"
              onClick={close}
              disabled={installing}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2"><path d="m6 6 12 12M6 18 18 6" /></svg>
            </button>
          </div>
          <button
            type="button"
            autoFocus={needsFocus}
            className="landing-primary-button mt-4 !min-h-[40px] w-full text-sm disabled:opacity-60"
            onClick={() => void install()}
            disabled={installing}
            aria-expanded={status === 'manual' ? showInstructions : undefined}
            aria-controls={status === 'manual' && showInstructions ? instructionsId : undefined}
          >
            {installing ? 'Abriendo instalador…' : status === 'available' ? 'Instalar aplicación' : 'Cómo instalar'}
          </button>
          {showInstructions && (
            <ul id={instructionsId} className="landing-muted mt-3 space-y-2 border-t border-[var(--landing-border)] pt-3 text-xs leading-relaxed">
              <li><strong>Chrome (Windows y Mac)</strong><br />Menú ⋮ → Enviar, guardar y compartir → Instalar página como aplicación.</li>
              <li><strong>Edge (Windows y Mac)</strong><br />Menú … → Más herramientas → Aplicaciones → Instalar este sitio como una aplicación.</li>
              <li><strong>Safari (macOS Sonoma 14 o posterior)</strong><br />Archivo → Añadir al Dock.</li>
            </ul>
          )}
        </section>
      ) : (
        <button
          type="button"
          className="landing-install-card flex min-h-11 items-center gap-2 rounded-full px-4 text-xs font-extrabold transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent"
          autoFocus={needsFocus}
          onClick={() => {
            setNeedsFocus(true);
            setOpen(true);
          }}
        >
          <InstallIcon /> Instalar app
        </button>
      )}
    </div>
  );
}
