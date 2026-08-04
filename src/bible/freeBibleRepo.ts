import { BIBLE_BOOKS, bibleBook } from './books';
import { remoteServiceErrorMessage } from '../lib/userFacingError';
import type { BibleRepo, BibleVerse, BibleVersion } from './types';

const API_BASE = 'https://bible-api.deno.dev/api';
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

interface FreeApiVersion {
  name: string;
  version: string;
}

interface FreeApiVerse {
  verse: string;
  number: number;
  id: number;
}

interface FreeApiChapter {
  chapter: number;
  name: string;
  vers: FreeApiVerse[];
}

interface FreeApiSearchVerse extends FreeApiVerse {
  book: string;
  chapter: number;
}

interface FreeApiSearchResponse {
  data: FreeApiSearchVerse[];
}

interface CachedChapter {
  cachedAt: number;
  verses: BibleVerse[];
}

const VERSION_TEMPLATES: BibleVersion[] = [
  {
    id: 'freeBible:rv1960',
    name: 'Reina-Valera 1960',
    abbr: 'RVR1960',
    lang: 'es',
    source: 'freeBible',
    available: true,
  },
  {
    id: 'freeBible:dhh',
    name: 'Dios Habla Hoy',
    abbr: 'DHH',
    lang: 'es',
    source: 'freeBible',
    available: true,
  },
  {
    id: 'freeBible:pdt',
    name: 'Palabra de Dios para Todos',
    abbr: 'PDT',
    lang: 'es',
    source: 'freeBible',
    available: true,
  },
];

const memory = new Map<string, CachedChapter>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function externalVersionId(versionId: string): string {
  const [provider, id] = versionId.split(':');
  if (provider !== 'freeBible' || !id) {
    throw new Error('La versión de Bible API solicitada no es válida.');
  }
  return id;
}

function cacheKey(versionId: string, book: number, chapter: number): string {
  return `${versionId}:${book}:${chapter}`;
}

function openCache(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  dbPromise = new Promise((resolve) => {
    const request = indexedDB.open('wordship-free-bible', 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('chapters')) {
        request.result.createObjectStore('chapters');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
  return dbPromise;
}

function isFresh(value: CachedChapter): boolean {
  return Date.now() - value.cachedAt < CACHE_TTL_MS;
}

async function readCached(key: string): Promise<CachedChapter | null> {
  const inMemory = memory.get(key);
  if (inMemory && isFresh(inMemory)) return inMemory;

  const db = await openCache();
  if (!db) return null;
  return new Promise((resolve) => {
    const request = db.transaction('chapters', 'readonly').objectStore('chapters').get(key);
    request.onsuccess = () => {
      const value = request.result as CachedChapter | undefined;
      if (value && isFresh(value)) {
        memory.set(key, value);
        resolve(value);
        return;
      }
      resolve(null);
    };
    request.onerror = () => resolve(null);
  });
}

async function writeCached(key: string, value: CachedChapter): Promise<void> {
  memory.set(key, value);
  const db = await openCache();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction('chapters', 'readwrite');
    tx.objectStore('chapters').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function bookNumberFromApiName(name: string): number | null {
  const normalized = normalize(name);
  return BIBLE_BOOKS.find((item) => (
    normalize(item.apiSlug) === normalized || normalize(item.es) === normalized
  ))?.number ?? null;
}

async function requestFreeBible<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  } catch {
    throw new Error(remoteServiceErrorMessage('Bible API'));
  }
  if (response.status === 404) throw new Error('Bible API no encontró el pasaje solicitado.');
  if (!response.ok) throw new Error(`Bible API no pudo responder (HTTP ${response.status}).`);
  return response.json() as Promise<T>;
}

async function loadChapter(versionId: string, book: number, chapter: number): Promise<BibleVerse[]> {
  const key = cacheKey(versionId, book, chapter);
  const cached = await readCached(key);
  if (cached) return cached.verses;

  const version = externalVersionId(versionId);
  const slug = bibleBook(book).apiSlug;
  const response = await requestFreeBible<FreeApiChapter>(
    `/read/${encodeURIComponent(version)}/${encodeURIComponent(slug)}/${chapter}`,
  );
  const verses = (response.vers ?? []).map((item) => ({
    book,
    chapter,
    verse: item.number,
    text: cleanText(item.verse),
  }));
  if (!verses.length) throw new Error('Bible API no devolvió versículos para este capítulo.');
  await writeCached(key, { cachedAt: Date.now(), verses });
  return verses;
}

export const freeBibleRepo: BibleRepo = {
  async listVersions() {
    try {
      const versions = await requestFreeBible<FreeApiVersion[]>('/versions');
      const availableIds = new Set(versions.map((item) => item.version));
      return VERSION_TEMPLATES.map((template) => {
        const available = availableIds.has(externalVersionId(template.id));
        return {
          ...template,
          available,
          availabilityReason: available ? undefined : 'error',
          availabilityMessage: available ? undefined : 'Esta versión no aparece en el catálogo de Bible API.',
        };
      });
    } catch (error) {
      return VERSION_TEMPLATES.map((template) => ({
        ...template,
        available: false,
        availabilityReason: 'error' as const,
        availabilityMessage: error instanceof Error ? error.message : 'Bible API no está disponible.',
      }));
    }
  },

  getChapter: loadChapter,

  async getPassage(versionId, book, chapter, from, to) {
    const verses = await loadChapter(versionId, book, chapter);
    return verses.filter((item) => item.verse >= from && item.verse <= to);
  },

  async search(versionId, query) {
    const needle = query.trim();
    if (needle.length < 2) return [];
    const version = externalVersionId(versionId);
    const params = new URLSearchParams({ q: needle, take: '100', page: '1' });
    const response = await requestFreeBible<FreeApiSearchResponse>(
      `/read/${encodeURIComponent(version)}/search?${params.toString()}`,
    );
    return (response.data ?? []).flatMap((item): BibleVerse[] => {
      const book = bookNumberFromApiName(item.book);
      const text = cleanText(item.verse);
      if (book === null || !text) return [];
      return [{ book, chapter: item.chapter, verse: item.number, text }];
    });
  },
};
