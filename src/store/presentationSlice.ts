import type { LiveState } from '../types';
import type { PresentationSlice, SliceCreator } from './types';
import { buildSlides } from '../lib/slides';
import { DEFAULT_THEMES } from '../data/seed';

export const createPresentationSlice: SliceCreator<PresentationSlice> = (set, get) => ({
  activeSongId: null,
  editingSongId: null,
  live: {
    slide: null,
    theme: DEFAULT_THEMES[0],
    blackout: false,
    showLogo: false,
    clearText: false,
  },
  slides: [],
  liveSlideIndex: -1,

  _publish: null,
  setPublisher: (fn) => set({ _publish: fn }),
  setLive: (live) => set({ live }),

  setActiveSong: (id) => {
    const song = get().songs.find((s) => s.id === id) ?? null;
    const slides = song ? buildSlides(song) : [];
    set({ activeSongId: id, slides });
  },

  setEditingSong: (id) => set({ editingSongId: id }),

  goLive: (slideIndex) => {
    const { slides, activeSongId, songs } = get();
    const song = songs.find((s) => s.id === activeSongId) ?? null;
    const theme = get().themeForSong(song);
    const slide = slides[slideIndex] ?? null;
    const live: LiveState = {
      slide,
      theme,
      blackout: false,
      showLogo: false,
      clearText: false,
    };
    set({ live, liveSlideIndex: slideIndex });
    get()._publish?.(live);
  },

  next: () => {
    const { liveSlideIndex, slides } = get();
    const target = Math.min(liveSlideIndex + 1, slides.length - 1);
    if (target !== liveSlideIndex && target >= 0) get().goLive(target);
  },

  prev: () => {
    const { liveSlideIndex } = get();
    const target = Math.max(liveSlideIndex - 1, 0);
    if (target !== liveSlideIndex) get().goLive(target);
  },

  toggleBlackout: () => {
    const live = { ...get().live, blackout: !get().live.blackout, showLogo: false };
    get().setLive(live);
    get()._publish?.(live);
  },

  toggleLogo: () => {
    const live = { ...get().live, showLogo: !get().live.showLogo, blackout: false };
    get().setLive(live);
    get()._publish?.(live);
  },

  toggleClear: () => {
    const live = { ...get().live, clearText: !get().live.clearText };
    get().setLive(live);
    get()._publish?.(live);
  },

  clearLive: () => {
    const live: LiveState = {
      ...get().live,
      slide: null,
      blackout: false,
      showLogo: false,
      clearText: false,
    };
    set({ live, liveSlideIndex: -1 });
    get()._publish?.(live);
  },
});
