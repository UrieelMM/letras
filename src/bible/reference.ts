import { BIBLE_BOOKS, type BibleBook } from './books';

export function normalizeBibleText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const ALIASES: Record<number, string[]> = {
  1: ['gen', 'gn'], 2: ['ex'], 3: ['lev', 'lv'], 4: ['num', 'nm'], 5: ['deut', 'dt'],
  19: ['sal', 'salmo', 'ps'], 20: ['prov', 'pr'], 22: ['cantar', 'cantar de los cantares'],
  40: ['mt', 'mat'], 41: ['mr', 'mc'], 42: ['lc'], 43: ['jn'], 44: ['hch'],
  45: ['ro', 'rom'], 46: ['1 co', '1 cor'], 47: ['2 co', '2 cor'],
  48: ['gal'], 49: ['ef'], 50: ['fil'], 51: ['col'], 52: ['1 ts'], 53: ['2 ts'],
  54: ['1 ti'], 55: ['2 ti'], 58: ['heb'], 59: ['stg'], 60: ['1 p'], 61: ['2 p'],
  62: ['1 jn'], 63: ['2 jn'], 64: ['3 jn'], 66: ['ap', 'apoc'],
};

function bookKey(value: string) {
  return normalizeBibleText(value).replace(/[.\s-]/g, '');
}

export interface BibleReference {
  books: BibleBook[];
  chapter?: number;
  from?: number;
  to?: number;
}

/** null indica una búsqueda por texto; las referencias inválidas no buscan texto. */
export function parseBibleReference(query: string): BibleReference | null {
  const value = normalizeBibleText(query.trim()).replace(/\./g, '').replace(/^(iii|ii|i)\s+/, (roman) => `${roman.trim().length} `);
  const match = value.match(/^([1-3]?\s*[a-z][a-z\s]*?)\s*(?:(\d+)(?:\s*:\s*(\d*)(?:\s*[-–—]\s*(\d*))?)?)?$/);
  if (!match) return null;
  const needle = bookKey(match[1]);
  const aliases = (book: BibleBook) => [book.es, book.en, book.usfm, ...(ALIASES[book.number] ?? [])].map(bookKey);
  const exact = BIBLE_BOOKS.filter((book) => aliases(book).includes(needle));
  const books = exact.length ? exact : BIBLE_BOOKS.filter((book) => aliases(book).some((name) => name.startsWith(needle)));
  if (!books.length) return null;
  const chapter = match[2] ? Number(match[2]) : undefined;
  const from = match[3] ? Number(match[3]) : undefined;
  const to = match[4] ? Number(match[4]) : from;
  return {
    books: books.filter((book) => (chapter === undefined || chapter >= 1 && chapter <= book.chapters)
      && (from === undefined || from >= 1) && (to === undefined || to >= (from ?? 1))),
    chapter, from, to,
  };
}
