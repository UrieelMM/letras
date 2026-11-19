import type { AppSettings, Setlist, Song, Theme } from '../types';

/** Las bajas se conservan para no restaurar letras incluidas al reiniciar. */
export type StoredSong = Song | { id: string; deleted: true };

/** Cambios recibidos en tiempo real desde el backend. */
export interface RepoSnapshot {
  songs?: StoredSong[];
  themes?: Theme[];
  setlists?: Setlist[];
  settings?: AppSettings | null;
}

/**
 * Interfaz de persistencia. Tiene dos implementaciones:
 * - localRepo: localStorage (modo local / sin cuenta).
 * - firestoreRepo: biblioteca común en Cloud Firestore (todas las cuentas).
 * Migrar entre backends no requiere tocar la UI ni el store.
 */
export interface DataRepo {
  prepare?(): Promise<void>;
  loadSongs(): Promise<StoredSong[]>;
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
  refresh?(): Promise<RepoSnapshot>;
  subscribe?(onChange: (snap: RepoSnapshot) => void, onError: (error: Error) => void): () => void;
}
