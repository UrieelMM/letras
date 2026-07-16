import { apiBibleRepo } from './apiBibleRepo';
import { bundledBibleRepo } from './bundledRepo';
import { freeBibleRepo } from './freeBibleRepo';
import type { BibleRepo } from './types';

function repoFor(versionId: string): BibleRepo {
  if (versionId.startsWith('apiBible:')) return apiBibleRepo;
  if (versionId.startsWith('freeBible:')) return freeBibleRepo;
  return bundledBibleRepo;
}

/** Dispatcher único para fuentes offline, API.Bible y Bible API. */
export const bibleRepo: BibleRepo = {
  async listVersions() {
    const [bundled, apiBible, freeBible] = await Promise.all([
      bundledBibleRepo.listVersions(),
      apiBibleRepo.listVersions(),
      freeBibleRepo.listVersions(),
    ]);
    return [...bundled, ...apiBible, ...freeBible];
  },

  getChapter(versionId, book, chapter) {
    return repoFor(versionId).getChapter(versionId, book, chapter);
  },

  getPassage(versionId, book, chapter, from, to) {
    return repoFor(versionId).getPassage(versionId, book, chapter, from, to);
  },

  search(versionId, query) {
    return repoFor(versionId).search(versionId, query);
  },
};
