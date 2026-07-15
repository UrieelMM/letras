/**
 * Apertura de la ventana de proyección.
 * Usa la Window Management API (Chrome/Edge) para colocarla automáticamente
 * en una pantalla secundaria; si no está disponible, abre una ventana normal.
 */

interface ScreenLike {
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
  isPrimary: boolean;
  label?: string;
}

interface ScreenDetailsLike {
  screens: ScreenLike[];
  currentScreen: ScreenLike;
}

declare global {
  interface Window {
    getScreenDetails?: () => Promise<ScreenDetailsLike>;
  }
}

export async function openOutputWindow(): Promise<Window | null> {
  const url = `${location.origin}${location.pathname}#/output`;

  // Intento con Window Management API (mejor experiencia en Chrome)
  if (typeof window.getScreenDetails === 'function') {
    try {
      const details = await window.getScreenDetails();
      const external = details.screens.find((s) => !s.isPrimary);
      if (external) {
        const features = [
          `left=${external.availLeft}`,
          `top=${external.availTop}`,
          `width=${external.availWidth}`,
          `height=${external.availHeight}`,
        ].join(',');
        const win = window.open(url, 'wordship-screen-output', features);
        return win;
      }
    } catch {
      // permiso denegado o no soportado → fallback
    }
  }

  // Fallback: ventana grande que el operador arrastra al proyector
  const win = window.open(url, 'wordship-screen-output', 'width=1280,height=720');
  return win;
}

export function hasMultiScreenSupport(): boolean {
  return typeof window.getScreenDetails === 'function';
}
