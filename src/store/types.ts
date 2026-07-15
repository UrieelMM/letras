import type { StateCreator } from 'zustand';
import type {
  AppSettings,
  LiveState,
  RenderSlide,
  Setlist,
  Song,
  Theme,
} from '../types';

export interface Backup {
  version: 2;
  exportedAt: number;
  songs: Song[];
  themes: Theme[];
  setlists: Setlist[];
  settings: AppSettings;
}

/** Datos del usuario + persistencia (Firestore). */
export interface LibrarySlice {
  ready: boolean;
  userId: string | null;

  songs: Song[];
  themes: Theme[];
  setlists: Setlist[];
  settings: AppSettings;

  init: (userId: string) => Promise<void>;
  reset: () => void;

  saveSong: (song: Song) => void;
  createSong: () => string;
  deleteSong: (id: string) => void;

  saveTheme: (theme: Theme) => void;
  customizeTheme: (theme: Theme) => void;
  setActiveTheme: (themeId: string) => void;
  restoreFactoryThemes: () => void;
  themeForSong: (song: Song | null) => Theme;
  updateSettings: (patch: Partial<AppSettings>) => void;

  exportData: () => Backup;
  importData: (data: Backup) => Promise<void>;
}

/** Estado de presentación / proyección y selección. */
export interface PresentationSlice {
  activeSongId: string | null;
  editingSongId: string | null;
  live: LiveState;
  slides: RenderSlide[];
  liveSlideIndex: number;

  setActiveSong: (id: string) => void;
  setEditingSong: (id: string | null) => void;

  goLive: (slideIndex: number) => void;
  next: () => void;
  prev: () => void;
  toggleBlackout: () => void;
  toggleLogo: () => void;
  toggleClear: () => void;
  clearLive: () => void;

  // Bus de sincronización con la ventana de proyección.
  _publish: ((live: LiveState) => void) | null;
  setPublisher: (fn: (live: LiveState) => void) => void;
  setLive: (live: LiveState) => void;
}

export type StoreState = LibrarySlice & PresentationSlice;

export type SliceCreator<T> = StateCreator<StoreState, [], [], T>;
