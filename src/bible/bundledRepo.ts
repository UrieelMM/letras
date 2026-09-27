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
    copyright: 'Dominio público.',
  },
  {
    id: 'rvr1960',
    name: 'Biblia Reina-Valera 1960',
    abbr: 'RVR1960',
    lang: 'es',
    source: 'bundled',
    available: true,
    copyright: 'Texto bíblico Reina-Valera 1960® © Sociedades Bíblicas en América Latina, 1960. Derechos renovados 1988, Sociedades Bíblicas Unidas.',
  },
  {
    id: 'lbla',
    name: 'La Biblia de las Américas',
    abbr: 'LBLA',
    lang: 'es',
    source: 'bundled',
    available: true,
    copyright: '1986, 1995, 1997 by The Lockman Foundation.',
  },
  {
    id: 'nbla',
    name: 'Nueva Biblia de las Américas',
    abbr: 'NBLA',
    lang: 'es',
    source: 'bundled',
    available: true,
    copyright: '1986, 1995, 1997, 2005 by The Lockman Foundation.',
  },
  {
    id: 'ntv',
    name: 'Nueva Traducción Viviente',
    abbr: 'NTV',
    lang: 'es',
    source: 'bundled',
    available: true,
    copyright: 'Santa Biblia, Nueva Traducción Viviente, copyright © 2010 by Tyndale House Foundation. Used by permission of Tyndale House Publishers. All rights reserved.',
  },
  {
    id: 'nvi',
    name: 'Nueva Versión Internacional',
    abbr: 'NVI',
    lang: 'es',
    source: 'bundled',
    available: true,
    copyright: 'Santa Biblia, Nueva Versión Internacional® NVI® © 1999, 2015, 2022 por Biblica, Inc. Usado con permiso. Reservados todos los derechos en todo el mundo.',
  },
  {
    id: 'tla',
    name: 'Traducción en Lenguaje Actual',
    abbr: 'TLA',
    lang: 'es',
    source: 'bundled',
    available: true,
    copyright: 'Traducción en lenguaje actual ® © Sociedades Bíblicas Unidas, 2002, 2004.',
  },
  {
    id: 'kjv',
    name: 'King James Version',
    abbr: 'KJV',
    lang: 'en',
    source: 'bundled',
    available: true,
    copyright: 'Public Domain (Unlicense).',
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
    return verses.filter((item) => item.verse <= to && (item.verseEnd ?? item.verse) >= from);
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
              verseEnd: verse.verseEnd,
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
