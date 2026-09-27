export interface BibleVersion {
  id: string;
  name: string;
  abbr: string;
  lang: 'es' | 'en';
  source: 'bundled';
  available: boolean;
  availabilityReason?: 'missingKey' | 'unlicensed' | 'error';
  availabilityMessage?: string;
  copyright?: string;
  link?: string;
}

export interface BibleVerse {
  book: number;
  chapter: number;
  verse: number;
  verseEnd?: number;
  text: string;
}

export interface BibleBookData {
  book: number;
  chapters: Array<{
    chapter: number;
    verses: Array<{ verse: number; verseEnd?: number; text: string }>;
  }>;
}

export interface BibleRepo {
  listVersions(): Promise<BibleVersion[]>;
  getChapter(versionId: string, book: number, chapter: number): Promise<BibleVerse[]>;
  getPassage(
    versionId: string,
    book: number,
    chapter: number,
    from: number,
    to: number,
  ): Promise<BibleVerse[]>;
  search(versionId: string, query: string): Promise<BibleVerse[]>;
}
