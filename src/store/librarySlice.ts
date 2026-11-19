import type { AppSettings, BackgroundConfig, LiveState, Setlist, Song, Theme } from '../types';
import type { Backup, LibrarySlice, SliceCreator, StoreState } from './types';
import { uid } from '../lib/id';
import { DEFAULT_THEMES, SAMPLE_SONGS } from '../data/seed';
import type { DataRepo, RepoSnapshot, StoredSong } from '../persistence/repo';
import { mergeSongbook } from '../persistence/songbook';
import { buildSlides } from '../lib/slides';
import { libraryLoadErrorMessage } from '../lib/userFacingError';
import { toast } from './toastStore';
import { shareLocalMedia } from '../media/libraryMedia';
import { createFirestoreRepo } from '../persistence/firestoreRepo';
import { createLocalRepo } from '../persistence/localRepo';
import { isRetiredPraiseBackground, RETIRED_PRAISE_THEME_IDS } from '../lib/removedThemes';
import { LEGACY_JERICHO_THEME_ID, restoreJerichoBackground, SCENIC_BACKGROUNDS } from '../lib/scenicBackgrounds';

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

function normalizeTheme(theme: Theme): Theme {
  const id = normalizeThemeId(theme.id);
  const retiredId = RETIRED_PRAISE_THEME_IDS.has(theme.id);
  const restored = restoreJerichoBackground(theme.background, id);
  const background = restored.kind === 'animated' && isRetiredPraiseBackground(restored)
    ? { kind: 'solid' as const, color: restored.colorB }
    : restored;
  if (!retiredId && background === theme.background) return theme;
  const fallback = DEFAULT_THEMES[0];
  return {
    ...theme,
    id: id ?? fallback.id,
    name: theme.id === LEGACY_JERICHO_THEME_ID ? SCENIC_BACKGROUNDS.jerichoCollapse.label : retiredId ? fallback.name : theme.name,
    background,
  };
}

function normalizeThemeId(id?: string) {
  if (id === LEGACY_JERICHO_THEME_ID) return SCENIC_BACKGROUNDS.jerichoCollapse.id;
  return id && !RETIRED_PRAISE_THEME_IDS.has(id) ? id : undefined;
}

function normalizeSlideBackground(background?: BackgroundConfig) {
  const restored = background && restoreJerichoBackground(background);
  return isRetiredPraiseBackground(restored) ? undefined : restored;
}

function normalizeThemes(themes: Theme[]): Theme[] {
  const byId = new Map(DEFAULT_THEMES.map((theme) => [theme.id, theme]));
  for (const theme of themes) {
    if (theme.overlay?.preset === 'emojis' || REMOVED_THEME_IDS.has(theme.id) || RETIRED_PRAISE_THEME_IDS.has(theme.id)) continue;
    const normalized = normalizeTheme(theme);
    byId.set(normalized.id, normalized);
  }
  return [...byId.values()];
}

function normalizeSong(song: Song): Song {
  const theme = song.theme && normalizeTheme(song.theme);
  const themeId = normalizeThemeId(song.themeId);
  const background = normalizeSlideBackground(song.background);
  const blocks = song.blocks.map((block) => {
    const overrides = block.slideBackgrounds;
    if (!overrides) return block;
    const normalized = overrides.flatMap((item) => {
      const bg = normalizeSlideBackground(item.background);
      return bg ? [bg === item.background ? item : { ...item, background: bg }] : [];
    });
    if (normalized.length === overrides.length && normalized.every((item, index) => item === overrides[index])) return block;
    return { ...block, slideBackgrounds: normalized };
  });
  if (theme === song.theme && themeId === song.themeId && background === song.background
    && blocks.every((block, index) => block === song.blocks[index])) return song;
  return { ...song, theme, themeId, background, blocks };
}

function normalizeSettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    defaultThemeId: normalizeThemeId(settings.defaultThemeId) ?? DEFAULT_THEMES[0].id,
    bibleThemeId: normalizeThemeId(settings.bibleThemeId),
    bibleTheme: settings.bibleTheme && normalizeTheme(settings.bibleTheme),
  };
}

/**
 * El cancionero viaja dentro del JavaScript de la app. Firestore sólo agrega
 * canciones del usuario o reemplaza una letra de fábrica cuando fue editada.
 */
function withBundledSongbook(storedSongs: StoredSong[]): Song[] {
  return mergeSongbook(SAMPLE_SONGS, storedSongs)
    .filter((song) => !REMOVED_SAMPLE_SONG_IDS.has(song.id)).map(normalizeSong);
}

function librarySnapshot(state: StoreState, snapshot: RepoSnapshot): Partial<StoreState> {
  const songs = snapshot.songs ? withBundledSongbook(snapshot.songs) : state.songs;
  const themes = snapshot.themes ? normalizeThemes(snapshot.themes) : state.themes;
  const settings = snapshot.settings !== undefined
    ? normalizeSettings(snapshot.settings ?? PLACEHOLDER_SETTINGS) : state.settings;
  const song = songs.find((item) => item.id === state.activeSongId);
  const slides = state.workspaceTab === 'lyrics' && snapshot.songs !== undefined
    ? song ? buildSlides(song) : [] : state.slides;
  let live = state.live;
  if (snapshot.settings !== undefined) live = { ...live, logoUrl: settings.logoUrl };
  // Actualiza el contenido seleccionado sin cambiar el pasaje/canción del operador.
  if (state.workspaceTab === 'lyrics' && state.live.slide && state.slides.some((slide) => slide.id === state.live.slide!.id)) {
    const slide = slides.find((item) => item.id === state.live.slide!.id) ?? null;
    const theme = song?.theme ?? themes.find((item) => item.id === (song?.themeId ?? settings.defaultThemeId)) ?? themes[0];
    live = { ...live, slide, theme };
  } else if (state.workspaceTab === 'bible' && state.live.slide?.type === 'scripture') {
    live = { ...live, theme: settings.bibleTheme ?? themes.find((item) => item.id === (settings.bibleThemeId ?? settings.defaultThemeId)) ?? themes[0] };
  }
  return {
    songs, themes, settings, slides, live,
    setlists: snapshot.setlists ?? state.setlists,
    activeSongId: song?.id ?? null,
    editingSongId: songs.some((item) => item.id === state.editingSongId) ? state.editingSongId : null,
    liveSlideIndex: state.liveSlideIndex >= 0 && live.slide ? slides.findIndex((item) => item.id === live.slide!.id) : -1,
  };
}

function browserIsOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/** Copia profunda de un tema (elimina referencias y campos undefined). */
function cloneTheme(theme: Theme): Theme {
  return JSON.parse(JSON.stringify(theme)) as Theme;
}

export const createLibrarySlice: SliceCreator<LibrarySlice> = (set, get) => {
  function reportSyncError(error: unknown) {
    console.error(error);
    const message = libraryLoadErrorMessage(error);
    set({ syncError: message });
    toast.error(message);
  }
  function applySnapshot(snapshot: RepoSnapshot) {
    const previousLive = get().live;
    set((state) => librarySnapshot(state, snapshot));
    if (get().live !== previousLive) get()._publish?.(get().live);
  }
  function subscribeToRepo(activeRepo: DataRepo, generation: number) {
    unsubscribe?.();
    unsubscribe = activeRepo.subscribe?.((snapshot) => {
      if (generation === initGeneration) applySnapshot(snapshot);
    }, (error) => {
      if (generation === initGeneration) reportSyncError(error);
    }) ?? null;
  }
  return ({
  ready: false,
  userId: null,
  syncError: null,

  songs: [],
  themes: DEFAULT_THEMES,
  setlists: [],
  settings: PLACEHOLDER_SETTINGS,

  init: (userId) => {
    const s = get();
    if (initRequest?.userId === userId) return initRequest.promise;
    if (s.ready && s.userId === userId) return Promise.resolve();

    const generation = ++initGeneration;

    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    const localSettings = { ...PLACEHOLDER_SETTINGS };
    const localTheme = DEFAULT_THEMES[0];

    // No permite editar hasta leer la biblioteca: una escritura prematura podría
    // sobrescribir una letra compartida con la copia incluida en la aplicación.
    set({
      ready: false,
      syncError: null,
      userId,
      songs: SAMPLE_SONGS,
      themes: DEFAULT_THEMES,
      setlists: [],
      settings: localSettings,
      activeSongId: null,
      workspaceTab: 'lyrics',
      slides: [],
      liveSlideIndex: -1,
      live: {
        slide: null,
        theme: localTheme,
        blackout: false,
        showLogo: false,
        clearText: false,
      },
    });

    const promise = (async () => {
      const activeRepo = userId === 'local' ? createLocalRepo() : createFirestoreRepo(userId);
      repo = activeRepo;
      if (activeRepo.prepare) {
        await activeRepo.prepare().catch((error) => {
          if (generation !== initGeneration) return;
          console.error('Migración pendiente:', error);
          toast.error(error instanceof Error && !('code' in error) ? error.message : 'No se pudieron compartir algunos datos anteriores. Pulsa Actualizar para reintentar.');
        });
      }
      if (generation !== initGeneration) return;
      let songs: Song[];
      let themes: Theme[];
      let setlists: Setlist[];
      let settings: AppSettings | null;

      const [songsResult, themesResult, setlistsResult, settingsResult] =
        await Promise.allSettled([
          activeRepo.loadSongs(),
          activeRepo.loadThemes(),
          activeRepo.loadSetlists(),
          activeRepo.loadSettings(),
        ]);
      const failedLoad = [songsResult, themesResult, setlistsResult, settingsResult].find(
        (result) => result.status === 'rejected',
      );

      if (failedLoad?.status === 'rejected' && !browserIsOffline()) {
        throw failedLoad.reason;
      }

      // Aun si una consulta concreta no estaba en la caché de Firestore, se
      // aprovechan las demás y se completa lo faltante con el bundle local.
      songs = withBundledSongbook(songsResult.status === 'fulfilled' ? songsResult.value : []);
      themes = themesResult.status === 'fulfilled' ? themesResult.value : DEFAULT_THEMES;
      setlists = setlistsResult.status === 'fulfilled' ? setlistsResult.value : [];
      settings = settingsResult.status === 'fulfilled' ? settingsResult.value : localSettings;

      // Los presets se combinan en memoria: abrir una cuenta no sobrescribe la nube
      // ni espera escrituras que podrían quedar pendientes sin conexión.
      themes = normalizeThemes(themes);
      settings = normalizeSettings(settings ?? PLACEHOLDER_SETTINGS);

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

      subscribeToRepo(activeRepo, generation);
    })();

    initRequest = { userId, promise };
    const clearRequest = () => {
      if (initRequest?.promise === promise) initRequest = null;
    };
    void promise.then(clearRequest, clearRequest);
    return promise;
  },

  refreshLibrary: async () => {
    const activeRepo = repo;
    const generation = initGeneration;
    const snapshot = activeRepo.refresh ? await activeRepo.refresh() : {
      songs: await activeRepo.loadSongs(), themes: await activeRepo.loadThemes(),
      setlists: await activeRepo.loadSetlists(), settings: await activeRepo.loadSettings(),
    };
    if (generation !== initGeneration) return;
    applySnapshot(snapshot);
    set({ syncError: null });
    subscribeToRepo(activeRepo, generation);
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
      syncError: null,
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
    return themes.find((t) => t.id === id) ?? themes[0] ?? DEFAULT_THEMES[0];
  },

  themeForPresentation: () => {
    const { workspaceTab, activeSongId, songs, settings, themes } = get();
    if (workspaceTab === 'bible') {
      if (settings.bibleTheme) return settings.bibleTheme;
      const id = settings.bibleThemeId ?? settings.defaultThemeId;
      return themes.find((theme) => theme.id === id) ?? themes[0] ?? DEFAULT_THEMES[0];
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
    repo.saveSong(updated).catch(reportSyncError);
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
    repo.saveSong(song).catch(reportSyncError);
    return id;
  },

  deleteSong: (id) => {
    set((s) => ({
      songs: s.songs.filter((x) => x.id !== id),
      activeSongId: s.activeSongId === id ? null : s.activeSongId,
      editingSongId: s.editingSongId === id ? null : s.editingSongId,
    }));
    repo.deleteSong(id).catch(reportSyncError);
  },

  saveTheme: (theme) => {
    const themes = get().themes.slice();
    const idx = themes.findIndex((t) => t.id === theme.id);
    if (idx >= 0) themes[idx] = theme;
    else themes.push(theme);
    set({ themes });
    repo.saveTheme(theme).catch(reportSyncError);
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
      repo.saveSettings(settings).catch(reportSyncError);
    } else if (activeSongId) {
      const song = songs.find((s) => s.id === activeSongId);
      if (song) {
        const updated = { ...song, theme, updatedAt: Date.now() };
        set({ songs: songs.map((s) => (s.id === activeSongId ? updated : s)) });
        repo.saveSong(updated).catch(reportSyncError);
        get().setActiveSong(activeSongId);
      }
    } else {
      get().saveTheme(theme);
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
      repo.saveSettings(newSettings).catch(reportSyncError);
    } else if (activeSongId) {
      const song = songs.find((s) => s.id === activeSongId);
      if (song) {
        const updated = { ...song, themeId, theme: fresh, updatedAt: Date.now() };
        set({ songs: songs.map((s) => (s.id === activeSongId ? updated : s)) });
        repo.saveSong(updated).catch(reportSyncError);
        get().setActiveSong(activeSongId);
      }
    } else {
      const newSettings = { ...settings, defaultThemeId: themeId };
      set({ settings: newSettings });
      repo.saveSettings(newSettings).catch(reportSyncError);
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
    DEFAULT_THEMES.forEach((d) => repo.saveTheme(d).catch(reportSyncError));
  },

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    const live = { ...get().live, logoUrl: settings.logoUrl };
    set({ settings, live });
    repo.saveSettings(settings).catch(reportSyncError);
    get()._publish?.(live);
  },

  exportData: () => {
    const { songs, themes, setlists, settings } = get();
    return { version: 2, exportedAt: Date.now(), songs, themes, setlists, settings };
  },

  importData: async (data: Backup) => {
    const userId = get().userId;
    if (userId && userId !== 'local') data = await shareLocalMedia(data, userId);
    if (data.songs) {
      const songs = data.songs.map(normalizeSong);
      set({ songs });
      await Promise.all(songs.map((s) => repo.saveSong(s)));
    }
    if (data.themes) {
      const themes = normalizeThemes(data.themes);
      set({ themes: themes.length ? themes : DEFAULT_THEMES });
      await Promise.all(themes.map((t) => repo.saveTheme(t)));
    }
    if (data.setlists) {
      set({ setlists: data.setlists });
      await Promise.all(data.setlists.map((s) => repo.saveSetlist(s)));
    }
    if (data.settings) {
      const settings = normalizeSettings(data.settings);
      set({ settings });
      await repo.saveSettings(settings);
    }
  },
  });
};
