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

interface DelegatedPostMessageOptions extends WindowPostMessageOptions {
  /** Chromium 104+: transfiere el gesto del usuario a la ventana de salida. */
  delegate: 'fullscreen';
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
const OUTPUT_READY_MESSAGE = 'WORDSHIP_OUTPUT_READY';
const REQUEST_FULLSCREEN_MESSAGE = 'WORDSHIP_REQUEST_FULLSCREEN';
let outputWindowRef: Window | null = null;
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

function rememberOutputWindow(output: Window): Window {
  outputWindowRef = output;
  return output;
}

function getOpenOutputWindow(): Window | null {
  try {
    return outputWindowRef && !outputWindowRef.closed ? outputWindowRef : null;
  } catch {
    outputWindowRef = null;
    return null;
  }
}

/**
 * La salida anuncia su WindowProxy junto con cada estado. Así el dashboard
 * recupera la referencia incluso después de recargarse mientras el popup
 * continúa abierto.
 */
export function announceOutputWindow(): void {
  window.opener?.postMessage({ type: OUTPUT_READY_MESSAGE }, location.origin);
}

export function captureOutputWindow(event: MessageEvent): boolean {
  if (
    event.origin !== location.origin ||
    event.data?.type !== OUTPUT_READY_MESSAGE ||
    !event.source ||
    !('focus' in event.source)
  ) {
    return false;
  }

  outputWindowRef = event.source as Window;
  return true;
}

export function isOutputFullscreenRequest(event: MessageEvent): boolean {
  return event.origin === location.origin && event.data?.type === REQUEST_FULLSCREEN_MESSAGE;
}

/**
 * Chromium permite delegar la activación de un clic/tecla a otro WindowProxy.
 * En navegadores que ignoran `delegate`, el mensaje todavía llega y la salida
 * muestra el botón local requerido por la política de activación del usuario.
 */
export function requestOutputFullscreen(): boolean {
  const output = getOpenOutputWindow();
  if (!output) return false;

  const message = { type: REQUEST_FULLSCREEN_MESSAGE };
  try {
    output.postMessage(message, {
      targetOrigin: location.origin,
      delegate: 'fullscreen',
    } as DelegatedPostMessageOptions);
  } catch {
    // Compatibilidad con motores que sólo aceptan la firma clásica.
    output.postMessage(message, location.origin);
  }
  return true;
}

export function focusOutputWindow(): boolean {
  const output = getOpenOutputWindow();
  if (!output) return false;
  output.focus();
  return true;
}

export async function openOutputWindow(): Promise<OpenOutputResult> {
  const url = `${location.origin}${location.pathname}#/output`;

  if (typeof window.getScreenDetails !== 'function') {
    const output = window.open(url, OUTPUT_WINDOW_NAME, FALLBACK_FEATURES);
    if (!output) {
      return { window: null, placement: 'manual', reason: 'popup-blocked' };
    }
    rememberOutputWindow(output);
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
      rememberOutputWindow(output);
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

    rememberOutputWindow(output);
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
    rememberOutputWindow(output);
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
