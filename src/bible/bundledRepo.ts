import { BIBLE_BOOKS } from './books';
import type { BibleBookData, BibleRepo, BibleVerse, BibleVersion } from './types';

export const BUNDLED_BIBLE_VERSIONS: BibleVersion[] = [
  {
    id: 'rv1909',
    name: 'Reina-Valera 1909',
    abbr: 'RV1909',
    lang: 'es',
    source: 'bundled',
    available: true,
  },
  {
    id: 'kjv',
    name: 'King James Version',
    abbr: 'KJV',
    lang: 'en',
    source: 'bundled',
    available: true,
  },
];

const memory = new Map<string, BibleBookData>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function cacheKey(versionId: string, book: number) {
  return `${versionId}:${book}`;
}

function openCache(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  dbPromise = new Promise((resolve) => {
    const request = indexedDB.open('wordship-bible', 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('books')) {
        request.result.createObjectStore('books');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
  return dbPromise;
}

async function readCached(key: string): Promise<BibleBookData | null> {
  const db = await openCache();
  if (!db) return null;
  return new Promise((resolve) => {
    const request = db.transaction('books', 'readonly').objectStore('books').get(key);
    request.onsuccess = () => resolve((request.result as BibleBookData | undefined) ?? null);
    request.onerror = () => resolve(null);
  });
}

async function writeCached(key: string, value: BibleBookData): Promise<void> {
  const db = await openCache();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction('books', 'readwrite');
    tx.objectStore('books').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

async function loadBook(versionId: string, book: number): Promise<BibleBookData> {
  const key = cacheKey(versionId, book);
  const inMemory = memory.get(key);
  if (inMemory) return inMemory;

  const cached = await readCached(key);
  if (cached) {
    memory.set(key, cached);
    return cached;
  }

  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const response = await fetch(`${base}bibles/${versionId}/${book}.json`);
  if (!response.ok) throw new Error('No se pudo abrir el texto bíblico incluido.');
  const data = (await response.json()) as BibleBookData;
  memory.set(key, data);
  void writeCached(key, data);
  return data;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
}

export const bundledBibleRepo: BibleRepo = {
  async listVersions() {
    return BUNDLED_BIBLE_VERSIONS;
  },

  async getChapter(versionId, book, chapter) {
    const data = await loadBook(versionId, book);
    const found = data.chapters.find((item) => item.chapter === chapter);
    return (found?.verses ?? []).map((item) => ({ book, chapter, ...item }));
  },

  async getPassage(versionId, book, chapter, from, to) {
    const verses = await this.getChapter(versionId, book, chapter);
    return verses.filter((item) => item.verse >= from && item.verse <= to);
  },

  async search(versionId, query) {
    const needle = normalize(query.trim());
    if (needle.length < 2) return [];
    const books = await Promise.all(BIBLE_BOOKS.map((item) => loadBook(versionId, item.number)));
    const matches: BibleVerse[] = [];
    for (const data of books) {
      for (const chapter of data.chapters) {
        for (const verse of chapter.verses) {
          if (normalize(verse.text).includes(needle)) {
            matches.push({
              book: data.book,
              chapter: chapter.chapter,
              verse: verse.verse,
              text: verse.text,
            });
            if (matches.length >= 100) return matches;
          }
        }
      }
    }
    return matches;
  },
};
