import { useState, useSyncExternalStore } from 'react';
import { toast } from '../store/toastStore';

type InstallOutcome = 'accepted' | 'dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallOutcome; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const standalone = window.matchMedia('(display-mode: standalone)');
let installed = standalone.matches;
const listeners = new Set<() => void>();

function notifyAvailability(): void {
  listeners.forEach((listener) => listener());
}

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

standalone.addEventListener('change', (event) => {
  installed = event.matches;
  if (installed) deferredPrompt = null;
  notifyAvailability();
});

function subscribeAvailability(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getInstallStatus() {
  if (installed) return 'installed';
  return deferredPrompt ? 'available' : 'manual';
}

export function useInstallStatus() {
  return useSyncExternalStore(subscribeAvailability, getInstallStatus);
}

export async function requestInstall(): Promise<InstallOutcome | null> {
  const prompt = deferredPrompt;
  if (!prompt || installed) return null;
  deferredPrompt = null;
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') installed = true;
    return choice.outcome;
  } finally {
    notifyAvailability();
  }
}

interface Props {
  className?: string;
  label?: string;
}

export function InstallAppButton({ className = 'btn-soft', label = 'Instalar app' }: Props) {
  const status = useInstallStatus();
  const [installing, setInstalling] = useState(false);

  if (status === 'installed' || (status !== 'available' && !installing)) return null;

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
      <InstallIcon />
      {installing ? 'Abriendo…' : label}
    </button>
  );
}

export function InstallIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} shrink-0 fill-none stroke-current stroke-2`} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
