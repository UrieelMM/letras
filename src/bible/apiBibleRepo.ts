import { BIBLE_BOOKS, bibleBook } from './books';
import type { BibleRepo, BibleVerse, BibleVersion } from './types';

const API_BASE = 'https://rest.api.bible/v1';
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const APP_KEY = import.meta.env.VITE_YOUVERSION_APP_KEY?.trim() ?? '';

interface ApiBibleResponse<T> {
  data: T;
  meta?: { fumsToken?: string };
}

interface ApiBibleMetadata {
  abbreviation?: string;
  abbreviationLocal?: string;
  name?: string;
  nameLocal?: string;
  copyrightStatement?: string;
}

interface ApiBibleContentNode {
  name?: string;
  text?: string;
  attrs?: {
    number?: string;
    verseId?: string;
  };
  items?: ApiBibleContentNode[];
}

interface ApiBibleChapter {
  content?: ApiBibleContentNode[];
}

interface ApiBibleSearchVerse {
  id: string;
  bookId: string;
  chapterId: string;
  text: string;
}

interface ApiBibleSearchResult {
  verses?: ApiBibleSearchVerse[];
}

interface CachedChapter {
  cachedAt: number;
  verses: BibleVerse[];
  fumsToken?: string;
}

class ApiBibleRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiBibleRequestError';
  }
}

declare global {
  interface Window {
    fums?: (command: 'trackView', token: string | string[]) => void;
    fumsData?: unknown[][];
  }
}

const VERSION_TEMPLATES: BibleVersion[] = [
  {
    id: 'apiBible:826f63861180e056-01',
    name: 'Nueva Traducción Viviente',
    abbr: 'NTV',
    lang: 'es',
    source: 'apiBible',
    available: false,
  },
  {
    id: 'apiBible:78a9f6124f344018-01',
    name: 'New International Version 2011',
    abbr: 'NIV',
    lang: 'en',
    source: 'apiBible',
    available: false,
  },
  {
    id: 'apiBible:e3f420b9665abaeb-01',
    name: 'La Biblia de las Américas',
    abbr: 'LBLA',
    lang: 'es',
    source: 'apiBible',
    available: false,
  },
];

const memory = new Map<string, CachedChapter>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function externalVersionId(versionId: string): string {
  const [provider, id] = versionId.split(':');
  if (provider !== 'apiBible' || !id) {
    throw new Error('La versión de API.Bible solicitada no es válida.');
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
    const request = indexedDB.open('wordship-api-bible', 1);
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

function apiError(status: number): ApiBibleRequestError {
  if (status === 401) {
    return new ApiBibleRequestError(
      'La llave de API.Bible no es válida. Revisa VITE_YOUVERSION_APP_KEY.',
      status,
    );
  }
  if (status === 403) {
    return new ApiBibleRequestError(
      'Esta Biblia no está autorizada para la llave actual de API.Bible.',
      status,
    );
  }
  if (status === 404) {
    return new ApiBibleRequestError('API.Bible no encontró la Biblia o el pasaje solicitado.', status);
  }
  if (status === 429) {
    return new ApiBibleRequestError(
      'API.Bible limitó temporalmente las solicitudes. Intenta de nuevo en un momento.',
      status,
    );
  }
  return new ApiBibleRequestError(`API.Bible no pudo responder (HTTP ${status}).`, status);
}

async function requestApiBible<T>(path: string): Promise<ApiBibleResponse<T>> {
  if (!APP_KEY) {
    throw new Error('Configura VITE_YOUVERSION_APP_KEY con tu llave de API.Bible.');
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: {
        Accept: 'application/json',
        'api-key': APP_KEY,
      },
    });
  } catch {
    throw new Error('No se pudo conectar con API.Bible. Revisa la conexión a internet.');
  }
  if (!response.ok) throw apiError(response.status);
  return response.json() as Promise<ApiBibleResponse<T>>;
}

function reportFums(token?: string): void {
  if (!token || typeof window === 'undefined') return;
  if (typeof window.fums === 'function') {
    window.fums('trackView', token);
    return;
  }
  window.fumsData = window.fumsData ?? [];
  window.fumsData.push(['trackView', token]);
}

function cleanText(content: string | undefined): string {
  return (content ?? '').replace(/\s+/g, ' ').trim();
}

function parseVerseNumber(verseId: string): number {
  const segments = verseId.split('.');
  const segment = segments[segments.length - 1] ?? '';
  return Number.parseInt(segment, 10);
}

function parseChapterNumber(chapterId: string): number {
  const segments = chapterId.split('.');
  const segment = segments[segments.length - 1] ?? '';
  return Number.parseInt(segment, 10);
}

function bookNumberFromUsfm(bookId: string): number | null {
  return BIBLE_BOOKS.find((item) => item.usfm === bookId)?.number ?? null;
}

function parseChapterContent(
  content: ApiBibleContentNode[] | undefined,
  book: number,
  chapter: number,
): BibleVerse[] {
  const textByVerse = new Map<string, string[]>();

  function visit(
    node: ApiBibleContentNode,
    inheritedVerseId?: string,
    skipText = false,
  ): void {
    const verseId = node.attrs?.verseId ?? inheritedVerseId;
    const isVerseNumber = node.name === 'verse' && Boolean(node.attrs?.number);
    const shouldSkipText = skipText || isVerseNumber;

    if (node.text && verseId && !shouldSkipText) {
      const pieces = textByVerse.get(verseId) ?? [];
      pieces.push(node.text);
      textByVerse.set(verseId, pieces);
    }

    for (const item of node.items ?? []) {
      visit(item, verseId, shouldSkipText);
    }
  }

  for (const node of content ?? []) visit(node);

  return [...textByVerse.entries()]
    .map(([verseId, pieces]) => ({
      book,
      chapter,
      verse: parseVerseNumber(verseId),
      text: cleanText(pieces.join('')),
    }))
    .filter((item) => Number.isFinite(item.verse) && Boolean(item.text))
    .sort((left, right) => left.verse - right.verse);
}

async function loadChapter(versionId: string, book: number, chapter: number): Promise<BibleVerse[]> {
  const key = cacheKey(versionId, book, chapter);
  const cached = await readCached(key);
  if (cached) {
    reportFums(cached.fumsToken);
    return cached.verses;
  }

  const bibleId = externalVersionId(versionId);
  const chapterId = `${bibleBook(book).usfm}.${chapter}`;
  const query = new URLSearchParams({
    'content-type': 'json',
    'include-notes': 'false',
    'include-titles': 'false',
    'include-chapter-numbers': 'false',
    'include-verse-numbers': 'true',
    'include-verse-spans': 'true',
    'fums-version': '3',
  });
  const response = await requestApiBible<ApiBibleChapter>(
    `/bibles/${bibleId}/chapters/${chapterId}?${query.toString()}`,
  );
  const verses = parseChapterContent(response.data.content, book, chapter);
  if (!verses.length) {
    throw new Error('API.Bible no devolvió texto estructurado para este capítulo.');
  }
  const cachedChapter = {
    cachedAt: Date.now(),
    verses,
    fumsToken: response.meta?.fumsToken,
  };
  await writeCached(key, cachedChapter);
  reportFums(cachedChapter.fumsToken);
  return verses;
}

async function listVersions(): Promise<BibleVersion[]> {
  if (!APP_KEY) {
    return VERSION_TEMPLATES.map((version) => ({
      ...version,
      availabilityReason: 'missingKey',
      availabilityMessage: 'Añade tu llave de API.Bible en VITE_YOUVERSION_APP_KEY y reinicia la aplicación.',
    }));
  }

  return Promise.all(VERSION_TEMPLATES.map(async (template) => {
    try {
      const response = await requestApiBible<ApiBibleMetadata>(
        `/bibles/${externalVersionId(template.id)}`,
      );
      const metadata = response.data;
      return {
        ...template,
        name: metadata.nameLocal || metadata.name || template.name,
        abbr: metadata.abbreviationLocal || metadata.abbreviation || template.abbr,
        copyright: cleanText(metadata.copyrightStatement),
        available: true,
      };
    } catch (error) {
      const status = error instanceof ApiBibleRequestError ? error.status : null;
      const unlicensed = status === 403 || status === 404;
      return {
        ...template,
        availabilityReason: unlicensed ? 'unlicensed' as const : 'error' as const,
        availabilityMessage: unlicensed
          ? `${template.abbr} no está autorizada para esta llave de API.Bible.`
          : error instanceof Error ? error.message : 'La versión no está disponible.',
      };
    }
  }));
}

export const apiBibleRepo: BibleRepo = {
  listVersions,

  getChapter: loadChapter,

  async getPassage(versionId, book, chapter, from, to) {
    const verses = await loadChapter(versionId, book, chapter);
    return verses.filter((item) => item.verse >= from && item.verse <= to);
  },

  async search(versionId, query) {
    const needle = query.trim();
    if (needle.length < 2) return [];
    const bibleId = externalVersionId(versionId);
    const params = new URLSearchParams({
      query: needle,
      limit: '100',
      offset: '0',
      'fums-version': '3',
    });
    const response = await requestApiBible<ApiBibleSearchResult>(
      `/bibles/${bibleId}/search?${params.toString()}`,
    );
    reportFums(response.meta?.fumsToken);

    return (response.data.verses ?? []).flatMap((item): BibleVerse[] => {
      const book = bookNumberFromUsfm(item.bookId);
      const chapter = parseChapterNumber(item.chapterId);
      const verse = parseVerseNumber(item.id);
      const text = cleanText(item.text);
      if (book === null || !Number.isFinite(chapter) || !Number.isFinite(verse) || !text) {
        return [];
      }
      return [{ book, chapter, verse, text }];
    });
  },
};
