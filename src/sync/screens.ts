/**
 * Apertura de la ventana de proyección.
 *
 * Primero solicita, desde el clic del operador, la información protegida de
 * pantallas. La consulta no consume la activación del usuario; Window.open sí,
 * por lo que debe ejecutarse después y una sola vez.
 */

interface ScreenLike {
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
  isPrimary?: boolean;
  isInternal?: boolean;
  label?: string;
}

interface ScreenDetailsLike {
  screens: ScreenLike[];
  currentScreen: ScreenLike;
}

interface ExtendedScreen extends Screen {
  isExtended?: boolean;
}

declare global {
  interface Window {
    getScreenDetails?: () => Promise<ScreenDetailsLike>;
  }
}

export type OutputPlacement = 'external' | 'manual';

export interface OpenOutputResult {
  window: Window | null;
  placement: OutputPlacement;
  displayName?: string;
  reason?: 'popup-blocked' | 'permission-denied' | 'no-external-display' | 'unsupported';
}

const OUTPUT_WINDOW_NAME = 'wordship-screen-output';
const FALLBACK_FEATURES = [
  'popup=yes',
  'width=1280',
  'height=720',
  'menubar=no',
  'toolbar=no',
  'location=no',
  'status=no',
  'scrollbars=no',
  'resizable=yes',
].join(',');

function isSameScreen(a: ScreenLike, b: ScreenLike): boolean {
  return (
    a === b ||
    (a.availLeft === b.availLeft &&
      a.availTop === b.availTop &&
      a.availWidth === b.availWidth &&
      a.availHeight === b.availHeight)
  );
}

function findExternalScreen(details: ScreenDetailsLike): ScreenLike | undefined {
  const otherScreens = details.screens.filter(
    (screen) => !isSameScreen(screen, details.currentScreen),
  );

  // Un proyector HDMI normalmente aparece como pantalla externa. Si hay más
  // de dos monitores, evita enviar la señal de vuelta a la pantalla interna.
  return (
    otherScreens.find((screen) => screen.isInternal === false) ??
    otherScreens.find((screen) => !screen.isPrimary) ??
    otherScreens[0]
  );
}

function placeWindowOnScreen(output: Window, screen: ScreenLike): void {
  output.moveTo(screen.availLeft, screen.availTop);
  output.resizeTo(screen.availWidth, screen.availHeight);
  output.focus();
}

export async function openOutputWindow(): Promise<OpenOutputResult> {
  const url = `${location.origin}${location.pathname}#/output`;

  if (typeof window.getScreenDetails !== 'function') {
    const output = window.open(url, OUTPUT_WINDOW_NAME, FALLBACK_FEATURES);
    if (!output) {
      return { window: null, placement: 'manual', reason: 'popup-blocked' };
    }
    output.focus();
    return { window: output, placement: 'manual', reason: 'unsupported' };
  }

  try {
    const details = await window.getScreenDetails();
    const external = findExternalScreen(details);

    if (!external) {
      const output = window.open(url, OUTPUT_WINDOW_NAME, FALLBACK_FEATURES);
      if (!output) {
        return { window: null, placement: 'manual', reason: 'popup-blocked' };
      }
      output.focus();
      return { window: output, placement: 'manual', reason: 'no-external-display' };
    }

    const features = [
      'popup=yes',
      `left=${external.availLeft}`,
      `top=${external.availTop}`,
      `width=${external.availWidth}`,
      `height=${external.availHeight}`,
      'scrollbars=no',
      'resizable=yes',
    ].join(',');
    const output = window.open(url, OUTPUT_WINDOW_NAME, features);
    if (!output) {
      return { window: null, placement: 'manual', reason: 'popup-blocked' };
    }

    placeWindowOnScreen(output, external);
    return {
      window: output,
      placement: 'external',
      displayName: external.label || 'pantalla secundaria',
    };
  } catch {
    const output = window.open(url, OUTPUT_WINDOW_NAME, FALLBACK_FEATURES);
    if (!output) {
      return { window: null, placement: 'manual', reason: 'popup-blocked' };
    }
    output.focus();
    // El operador todavía puede arrastrar la salida al proyector aunque niegue
    // el permiso de administrar ventanas.
    return { window: output, placement: 'manual', reason: 'permission-denied' };
  }
}

export function hasMultiScreenSupport(): boolean {
  return typeof window.getScreenDetails === 'function';
}

/**
 * `null` significa que el navegador no expone el dato. No equivale a que no
 * haya un cable conectado: en ese caso se mantiene disponible el modo manual.
 */
export function hasExtendedDisplay(): boolean | null {
  const value = (window.screen as ExtendedScreen).isExtended;
  return typeof value === 'boolean' ? value : null;
}
