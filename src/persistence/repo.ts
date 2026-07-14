import type { AppSettings, Setlist, Song, Theme } from '../types';

/** Cambios recibidos en tiempo real desde el backend. */
export interface RepoSnapshot {
  songs?: Song[];
  themes?: Theme[];
  setlists?: Setlist[];
}

/**
 * Interfaz de persistencia. Tiene dos implementaciones:
 * - localRepo: localStorage (modo local / sin cuenta).
 * - firestoreRepo: Cloud Firestore por usuario (modo multiusuario).
 * Migrar entre backends no requiere tocar la UI ni el store.
 */
export interface DataRepo {
  loadSongs(): Promise<Song[]>;
  saveSong(song: Song): Promise<void>;
  deleteSong(id: string): Promise<void>;

  loadThemes(): Promise<Theme[]>;
  saveTheme(theme: Theme): Promise<void>;
  deleteTheme(id: string): Promise<void>;

  loadSetlists(): Promise<Setlist[]>;
  saveSetlist(setlist: Setlist): Promise<void>;
  deleteSetlist(id: string): Promise<void>;

  loadSettings(): Promise<AppSettings | null>;
  saveSettings(settings: AppSettings): Promise<void>;

  /** Suscripción en tiempo real (opcional). Devuelve función para cancelar. */
  subscribe?(onChange: (snap: RepoSnapshot) => void): () => void;
}
