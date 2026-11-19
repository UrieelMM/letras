const listeners = new Set<() => void>();
let available = false;
let reloadRequested = false;

export function subscribeAppUpdate(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function hasAppUpdate() { return available; }

function notify(registration: ServiceWorkerRegistration) {
  available = Boolean(registration.waiting);
  listeners.forEach((listener) => listener());
}

export function waitForInstallation(worker: ServiceWorker): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => finish(new Error('La descarga está tardando. Pulsa Actualizar para reintentar.')), 120_000);
    function finish(error?: Error) {
      window.clearTimeout(timeout);
      worker.removeEventListener('statechange', check);
      if (error) reject(error);
      else resolve();
    }
    function check() {
      if (worker.state === 'installed' || worker.state === 'activated') finish();
      else if (worker.state === 'redundant') finish(new Error('No se pudo descargar la actualización. Vuelve a intentarlo.'));
    }
    worker.addEventListener('statechange', check);
    check();
  });
}

// Un único registro para la web y la PWA. Se activa la nueva versión al pulsar
// Actualizar, después de descargar todos sus archivos para uso sin conexión.
const registrationPromise = import.meta.env.PROD && 'serviceWorker' in navigator
  ? navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
    scope: import.meta.env.BASE_URL, updateViaCache: 'none',
  }).then((registration) => {
    notify(registration);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (worker) worker.addEventListener('statechange', () => notify(registration));
    });
    const check = () => {
      if (navigator.onLine && !registration.installing) void registration.update().catch(console.warn);
    };
    window.addEventListener('online', check);
    window.setInterval(check, 60 * 60 * 1000);
    return registration;
  }).catch((error) => {
    console.error('No se pudo registrar la PWA:', error);
    return null;
  })
  : Promise.resolve(null);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadRequested) window.location.reload();
  });
}

/** true significa que la nueva versión se está activando y recargará la app. */
export async function updateApplication(): Promise<boolean> {
  const registration = await registrationPromise;
  if (!registration) {
    if (import.meta.env.PROD && 'serviceWorker' in navigator) throw new Error('No se pudo preparar la actualización. Vuelve a abrir la aplicación con conexión.');
    return false;
  }
  await registration.update();
  if (registration.installing) await waitForInstallation(registration.installing);
  notify(registration);
  const waiting = registration.waiting;
  if (!waiting) return false;
  reloadRequested = true;
  waiting.postMessage({ type: 'SKIP_WAITING' });
  return true;
}
