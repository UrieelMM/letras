import type { AppSettings, LiveState, Song, Theme } from '../types';
import type { Backup, LibrarySlice, SliceCreator } from './types';
import { uid } from '../lib/id';
import { DEFAULT_THEMES, SAMPLE_SONGS } from '../data/seed';
import type { DataRepo } from '../persistence/repo';
import { createFirestoreRepo } from '../persistence/firestoreRepo';

// Repositorio "vacío" mientras no hay sesión (no persiste en ningún lado).
const noopRepo: DataRepo = {
  async loadSongs() { return []; },
  async saveSong() {},
  async deleteSong() {},
  async loadThemes() { return []; },
  async saveTheme() {},
  async deleteTheme() {},
  async loadSetlists() { return []; },
  async saveSetlist() {},
  async deleteSetlist() {},
  async loadSettings() { return null; },
  async saveSettings() {},
};

// Estado de módulo: repositorio activo + suscripción en tiempo real.
let repo: DataRepo = noopRepo;
let unsubscribe: (() => void) | null = null;
let initGeneration = 0;
let initRequest: { userId: string; promise: Promise<void> } | null = null;

export const PLACEHOLDER_SETTINGS: AppSettings = {
  defaultThemeId: DEFAULT_THEMES[0].id,
  language: 'es',
};

const REMOVED_THEME_IDS = new Set(['theme-olas3d', 'theme-nubes', 'theme-halo', 'theme-orbe']);
const REMOVED_SAMPLE_SONG_IDS = new Set(['song-gracia', 'song-grande']);

/** Copia profunda de un tema (elimina referencias y campos undefined). */
function cloneTheme(theme: Theme): Theme {
  return JSON.parse(JSON.stringify(theme)) as Theme;
}

export const createLibrarySlice: SliceCreator<LibrarySlice> = (set, get) => ({
  ready: false,
  userId: null,

  songs: [],
  themes: DEFAULT_THEMES,
  setlists: [],
  settings: PLACEHOLDER_SETTINGS,

  init: (userId) => {
    const s = get();
    if (s.ready && s.userId === userId) return Promise.resolve();
    if (initRequest?.userId === userId) return initRequest.promise;

    const generation = ++initGeneration;

    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    set({ ready: false, userId });

    const promise = (async () => {
      const activeRepo = createFirestoreRepo(userId);
      repo = activeRepo;
      let [songs, themes, setlists, settings] = await Promise.all([
        activeRepo.loadSongs(),
        activeRepo.loadThemes(),
        activeRepo.loadSetlists(),
        activeRepo.loadSettings(),
      ]);

      // Limpieza: elimina temas retirados (emojis pesados + efectos descartados).
      const toRemove = themes.filter(
        (t) => t.overlay?.preset === 'emojis' || REMOVED_THEME_IDS.has(t.id),
      );
      if (toRemove.length) {
        const removeIds = new Set(toRemove.map((t) => t.id));
        themes = themes.filter((t) => !removeIds.has(t.id));
        await Promise.all(toRemove.map((t) => activeRepo.deleteTheme(t.id).catch(() => {})));
      }

      // Asegura que los temas de fábrica (incluidos los nuevos) estén presentes.
      const missingThemes = DEFAULT_THEMES.filter((d) => !themes.some((t) => t.id === d.id));
      if (missingThemes.length) {
        themes = [...themes, ...missingThemes];
        await Promise.all(missingThemes.map((t) => activeRepo.saveTheme(t).catch(() => {})));
      }

      // Retira las dos canciones de demostración antiguas de bibliotecas ya creadas.
      const removedSampleSongs = songs.filter((song) => REMOVED_SAMPLE_SONG_IDS.has(song.id));
      if (removedSampleSongs.length) {
        songs = songs.filter((song) => !REMOVED_SAMPLE_SONG_IDS.has(song.id));
        await Promise.all(
          removedSampleSongs.map((song) => activeRepo.deleteSong(song.id).catch(() => {})),
        );
      }
      if (songs.length === 0) {
        songs = SAMPLE_SONGS;
        await Promise.all(songs.map((song) => activeRepo.saveSong(song).catch(() => {})));
      } else if (!songs.some((song) => song.id.startsWith('songbook-'))) {
        // Importación inicial del cancionero para bibliotecas existentes.
        const songbookSongs = SAMPLE_SONGS.filter((song) => song.id.startsWith('songbook-'));
        songs = [...songs, ...songbookSongs];
        await Promise.all(
          songbookSongs.map((song) => activeRepo.saveSong(song).catch(() => {})),
        );
      }
      if (!settings) {
        settings = { defaultThemeId: themes[0].id, language: 'es' };
        await activeRepo.saveSettings(settings).catch(() => {});
      }

      const defaultTheme = themes.find((t) => t.id === settings!.defaultThemeId) ?? themes[0];

      // La sesión pudo cambiar mientras Firestore respondía; ignora una carga obsoleta.
      if (generation !== initGeneration) return;

      set({
        songs,
        themes,
        setlists,
        settings,
        activeSongId: null,
        workspaceTab: 'lyrics',
        slides: [],
        liveSlideIndex: -1,
        live: {
          slide: null,
          theme: defaultTheme,
          blackout: false,
          showLogo: false,
          logoUrl: settings.logoUrl,
          clearText: false,
        },
        ready: true,
      });

      if (activeRepo.subscribe) {
        unsubscribe = activeRepo.subscribe((snap) => {
          if (generation !== initGeneration) return;
          set((st) => ({
            songs: snap.songs ?? st.songs,
            themes: snap.themes ?? st.themes,
            setlists: snap.setlists ?? st.setlists,
          }));
        });
      }
    })();

    initRequest = { userId, promise };
    const clearRequest = () => {
      if (initRequest?.promise === promise) initRequest = null;
    };
    void promise.then(clearRequest, clearRequest);
    return promise;
  },

  reset: () => {
    initGeneration += 1;
    initRequest = null;
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    repo = noopRepo;
    set({
      ready: false,
      userId: null,
      songs: [],
      setlists: [],
      activeSongId: null,
      editingSongId: null,
      workspaceTab: 'lyrics',
      slides: [],
      liveSlideIndex: -1,
      bibleSlides: [],
      biblePassageLabel: '',
    });
  },

  themeForSong: (song) => {
    if (song?.theme) return song.theme;
    const { themes, settings } = get();
    const id = song?.themeId ?? settings.defaultThemeId;
    return themes.find((t) => t.id === id) ?? themes[0];
  },

  themeForPresentation: () => {
    const { workspaceTab, activeSongId, songs, settings, themes } = get();
    if (workspaceTab === 'bible') {
      if (settings.bibleTheme) return settings.bibleTheme;
      const id = settings.bibleThemeId ?? settings.defaultThemeId;
      return themes.find((theme) => theme.id === id) ?? themes[0];
    }
    const song = songs.find((item) => item.id === activeSongId) ?? null;
    return get().themeForSong(song);
  },

  saveSong: (song) => {
    const updated = { ...song, updatedAt: Date.now() };
    const songs = get().songs.slice();
    const idx = songs.findIndex((s) => s.id === song.id);
    if (idx >= 0) songs[idx] = updated;
    else songs.push(updated);
    set({ songs });
    repo.saveSong(updated).catch(console.error);
    if (get().activeSongId === song.id) get().setActiveSong(song.id);
  },

  createSong: () => {
    const id = uid('song-');
    const now = Date.now();
    const song: Song = {
      id,
      title: 'Nueva canción',
      author: '',
      tags: [],
      blocks: [
        { id: uid('b-'), type: 'verse', label: 'Estrofa 1', lines: ['Escribe aquí la letra...'] },
      ],
      createdAt: now,
      updatedAt: now,
    };
    set({ songs: [...get().songs, song], editingSongId: id, activeSongId: id });
    repo.saveSong(song).catch(console.error);
    return id;
  },

  deleteSong: (id) => {
    set((s) => ({
      songs: s.songs.filter((x) => x.id !== id),
      activeSongId: s.activeSongId === id ? null : s.activeSongId,
      editingSongId: s.editingSongId === id ? null : s.editingSongId,
    }));
    repo.deleteSong(id).catch(console.error);
  },

  saveTheme: (theme) => {
    const themes = get().themes.slice();
    const idx = themes.findIndex((t) => t.id === theme.id);
    if (idx >= 0) themes[idx] = theme;
    else themes.push(theme);
    set({ themes });
    repo.saveTheme(theme).catch(console.error);
  },

  customizeTheme: (theme) => {
    const { activeSongId, songs, live, liveSlideIndex, workspaceTab } = get();
    if (workspaceTab === 'bible') {
      const settings = {
        ...get().settings,
        bibleThemeId: theme.id,
        bibleTheme: theme,
      };
      set({ settings });
      repo.saveSettings(settings).catch(console.error);
    } else if (activeSongId) {
      const song = songs.find((s) => s.id === activeSongId);
      if (song) {
        const updated = { ...song, theme, updatedAt: Date.now() };
        set({ songs: songs.map((s) => (s.id === activeSongId ? updated : s)) });
        repo.saveSong(updated).catch(console.error);
        get().setActiveSong(activeSongId);
      }
    }
    const newLive: LiveState = { ...live, theme };
    set({ live: newLive });
    if (liveSlideIndex >= 0) get()._publish?.(newLive);
  },

  setActiveTheme: (themeId) => {
    const { activeSongId, songs, themes, settings, live, liveSlideIndex, workspaceTab } = get();
    const preset = themes.find((t) => t.id === themeId);
    if (!preset) return;
    const fresh = cloneTheme(preset);

    if (workspaceTab === 'bible') {
      const newSettings = {
        ...settings,
        bibleThemeId: themeId,
        bibleTheme: fresh,
      };
      set({ settings: newSettings });
      repo.saveSettings(newSettings).catch(console.error);
    } else if (activeSongId) {
      const song = songs.find((s) => s.id === activeSongId);
      if (song) {
        const updated = { ...song, themeId, theme: fresh, updatedAt: Date.now() };
        set({ songs: songs.map((s) => (s.id === activeSongId ? updated : s)) });
        repo.saveSong(updated).catch(console.error);
        get().setActiveSong(activeSongId);
      }
    } else {
      const newSettings = { ...settings, defaultThemeId: themeId };
      set({ settings: newSettings });
      repo.saveSettings(newSettings).catch(console.error);
    }

    const newLive: LiveState = { ...live, theme: fresh };
    set({ live: newLive });
    if (liveSlideIndex >= 0) get()._publish?.(newLive);
  },

  restoreFactoryThemes: () => {
    const byId = new Map(get().themes.map((t) => [t.id, t]));
    for (const d of DEFAULT_THEMES) byId.set(d.id, d);
    const themes = Array.from(byId.values());
    set({ themes });
    DEFAULT_THEMES.forEach((d) => repo.saveTheme(d).catch(console.error));
  },

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    const live = { ...get().live, logoUrl: settings.logoUrl };
    set({ settings, live });
    repo.saveSettings(settings).catch(console.error);
    get()._publish?.(live);
  },

  exportData: () => {
    const { songs, themes, setlists, settings } = get();
    return { version: 2, exportedAt: Date.now(), songs, themes, setlists, settings };
  },

  importData: async (data: Backup) => {
    if (data.songs) {
      set({ songs: data.songs });
      await Promise.all(data.songs.map((s) => repo.saveSong(s).catch(() => {})));
    }
    if (data.themes) {
      set({ themes: data.themes });
      await Promise.all(data.themes.map((t) => repo.saveTheme(t).catch(() => {})));
    }
    if (data.setlists) {
      set({ setlists: data.setlists });
      await Promise.all(data.setlists.map((s) => repo.saveSetlist(s).catch(() => {})));
    }
    if (data.settings) {
      set({ settings: data.settings });
      await repo.saveSettings(data.settings).catch(() => {});
    }
  },
});
