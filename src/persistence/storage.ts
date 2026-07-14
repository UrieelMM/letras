// Acceso de bajo nivel a localStorage (usado por el repositorio local).

export function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function lsSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('No se pudo guardar en localStorage', e);
  }
}

export const LS_KEYS = {
  songs: 'letras.songs',
  themes: 'letras.themes',
  setlists: 'letras.setlists',
  settings: 'letras.settings',
} as const;
