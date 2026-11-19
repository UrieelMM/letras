import { bibleBookName } from '../bible/books';
import { bibleRepo } from '../bible/bibleRepo';
import { buildScriptureSlides } from '../bible/toSlides';
import type { BibleSlice, SliceCreator } from './types';

export const createBibleSlice: SliceCreator<BibleSlice> = (set, get) => {
  let searchRequest = 0;
  let chapterRequest = 0;
  return ({
  bibleVersions: [],
  bibleVersionId: 'rv1909',
  bibleBook: 43,
  bibleChapter: 3,
  bibleChapterVerses: [],
  bibleSearchResults: [],
  bibleSlides: [],
  biblePassageLabel: '',
  bibleLoadingChapter: false,
  bibleSearching: false,
  bibleError: null,

  loadBibleVersions: async () => {
    if (get().bibleVersions.length) {
      if (!get().bibleChapterVerses.length) {
        await get().openBibleChapter(get().bibleBook, get().bibleChapter);
      }
      return;
    }
    try {
      const versions = await bibleRepo.listVersions();
      set({ bibleVersions: versions, bibleError: null });
      await get().openBibleChapter(get().bibleBook, get().bibleChapter);
    } catch (error) {
      set({
        bibleError: error instanceof Error ? error.message : 'No se pudo cargar la Biblia.',
      });
    }
  },

  setBibleVersion: async (id) => {
    searchRequest += 1;
    const version = get().bibleVersions.find((item) => item.id === id);
    set({ bibleVersionId: id, bibleSearchResults: [], bibleSearching: false, bibleError: null });
    if (version?.available === false) {
      set({
        bibleChapterVerses: [],
        bibleError: version.availabilityMessage ?? 'Esta versión todavía no está disponible.',
      });
      return;
    }
    await get().openBibleChapter(get().bibleBook, get().bibleChapter);
  },

  openBibleChapter: async (book, chapter) => {
    const request = ++chapterRequest;
    const versionId = get().bibleVersionId;
    set({
      bibleBook: book,
      bibleChapter: chapter,
      bibleLoadingChapter: true,
      bibleError: null,
    });
    try {
      const verses = await bibleRepo.getChapter(versionId, book, chapter);
      if (request !== chapterRequest || versionId !== get().bibleVersionId) return;
      set({ bibleChapterVerses: verses, bibleLoadingChapter: false });
    } catch (error) {
      if (request !== chapterRequest || versionId !== get().bibleVersionId) return;
      set({
        bibleChapterVerses: [],
        bibleLoadingChapter: false,
        bibleError:
          error instanceof Error ? error.message : 'No se pudo abrir este capítulo.',
      });
    }
  },

  searchBible: async (query) => {
    const request = ++searchRequest;
    const versionId = get().bibleVersionId;
    if (query.trim().length < 3) {
      set({ bibleSearchResults: [], bibleSearching: false });
      return;
    }
    set({ bibleSearching: true, bibleSearchResults: [], bibleError: null });
    try {
      const results = await bibleRepo.search(versionId, query);
      if (request !== searchRequest || versionId !== get().bibleVersionId) return;
      set({ bibleSearchResults: results, bibleSearching: false });
    } catch (error) {
      if (request !== searchRequest || versionId !== get().bibleVersionId) return;
      set({
        bibleSearching: false,
        bibleError:
          error instanceof Error ? error.message : 'No se pudo buscar en esta versión.',
      });
    }
  },

  clearBibleSearch: () => {
    searchRequest += 1;
    set({ bibleSearchResults: [], bibleSearching: false, bibleError: null });
  },

  projectBiblePassage: (from, to) => {
    const state = get();
    const version = state.bibleVersions.find((item) => item.id === state.bibleVersionId);
    if (!version) return;
    const low = Math.min(from, to);
    const high = Math.max(from, to);
    const verses = state.bibleChapterVerses.filter(
      (item) => item.verse <= high && (item.verseEnd ?? item.verse) >= low,
    );
    if (!verses.length) return;

    const bibleSlides = buildScriptureSlides(verses, version);
    const bookName = bibleBookName(state.bibleBook, version.lang);
    const range = low === high ? `${low}` : `${low}–${high}`;
    const biblePassageLabel = `${bookName} ${state.bibleChapter}:${range} · ${version.abbr}`;
    set({
      bibleSlides,
      biblePassageLabel,
      slides: bibleSlides,
      workspaceTab: 'bible',
      liveSlideIndex: -1,
    });
    get().goLive(0);
  },
  });
};
