import { useEffect, useState } from 'react';
import { toast } from '../store/toastStore';

type InstallOutcome = 'accepted' | 'dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallOutcome; platform: string }>;
}

type AvailabilityListener = (available: boolean) => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed =
  typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
const listeners = new Set<AvailabilityListener>();

function canInstall(): boolean {
  return Boolean(deferredPrompt) && !installed;
}

function notifyAvailability(): void {
  const available = canInstall();
  listeners.forEach((listener) => listener(available));
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notifyAvailability();
  });

  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    notifyAvailability();
  });

  window.matchMedia('(display-mode: standalone)').addEventListener('change', (event) => {
    installed = event.matches;
    if (installed) deferredPrompt = null;
    notifyAvailability();
  });
}

function subscribeAvailability(listener: AvailabilityListener): () => void {
  listeners.add(listener);
  listener(canInstall());
  return () => listeners.delete(listener);
}

async function requestInstall(): Promise<InstallOutcome | null> {
  const prompt = deferredPrompt;
  if (!prompt) return null;

  await prompt.prompt();
  const choice = await prompt.userChoice;
  deferredPrompt = null;
  notifyAvailability();
  return choice.outcome;
}

interface Props {
  className?: string;
  label?: string;
}

export function InstallAppButton({ className = 'btn-soft', label = 'Instalar app' }: Props) {
  const [available, setAvailable] = useState(canInstall);
  const [installing, setInstalling] = useState(false);

  useEffect(() => subscribeAvailability(setAvailable), []);

  if (!available) return null;

  async function install() {
    setInstalling(true);
    try {
      const outcome = await requestInstall();
      if (outcome === 'accepted') toast.success('Wordship Screen se instaló correctamente.');
      else if (outcome === 'dismissed') toast.info('Instalación cancelada.');
    } catch (error) {
      console.error('No se pudo abrir el instalador PWA:', error);
      toast.error('El navegador no pudo iniciar la instalación. Usa el icono de la barra de direcciones.');
    } finally {
      setInstalling(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      disabled={installing}
      onClick={() => void install()}
      title="Instalar Wordship Screen en esta computadora"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4 fill-none stroke-current stroke-2"
      >
        <path d="M12 3v11m0 0 4-4m-4 4-4-4" />
        <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
      </svg>
      {installing ? 'Abriendo…' : label}
    </button>
  );
}
