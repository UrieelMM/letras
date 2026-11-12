import type { StateCreator } from 'zustand';
import type {
  AppSettings,
  LiveState,
  RenderSlide,
  Setlist,
  Song,
  Theme,
} from '../types';
import type { BibleVerse, BibleVersion } from '../bible/types';
import type { MediaResource } from '../resources/model';

export interface Backup {
  version: 2;
  exportedAt: number;
  songs: Song[];
  themes: Theme[];
  setlists: Setlist[];
  settings: AppSettings;
}

/** Datos del usuario + persistencia local o sincronizada con Firestore. */
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
  themeForPresentation: () => Theme;
  updateSettings: (patch: Partial<AppSettings>) => void;

  exportData: () => Backup;
  importData: (data: Backup) => Promise<void>;
}

/** Estado de presentación / proyección y selección. */
export interface PresentationSlice {
  workspaceTab: 'lyrics' | 'bible' | 'resources';
  activeSongId: string | null;
  editingSongId: string | null;
  live: LiveState;
  slides: RenderSlide[];
  liveSlideIndex: number;

  setWorkspaceTab: (tab: PresentationSlice['workspaceTab']) => void;
  setActiveSong: (id: string) => void;
  setEditingSong: (id: string | null) => void;

  goLive: (slideIndex: number) => void;
  goLiveResource: (resource: MediaResource) => void;
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

export interface BibleSlice {
  bibleVersions: BibleVersion[];
  bibleVersionId: string;
  bibleBook: number;
  bibleChapter: number;
  bibleChapterVerses: BibleVerse[];
  bibleSearchResults: BibleVerse[];
  bibleSlides: RenderSlide[];
  biblePassageLabel: string;
  bibleLoadingChapter: boolean;
  bibleSearching: boolean;
  bibleError: string | null;

  loadBibleVersions: () => Promise<void>;
  setBibleVersion: (id: string) => Promise<void>;
  openBibleChapter: (book: number, chapter: number) => Promise<void>;
  searchBible: (query: string) => Promise<void>;
  clearBibleSearch: () => void;
  projectBiblePassage: (from: number, to: number) => void;
}

export type StoreState = LibrarySlice & PresentationSlice & BibleSlice;

export type SliceCreator<T> = StateCreator<StoreState, [], [], T>;
