import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { create } from 'zustand';
import { parseBibleReference } from '../src/bible/reference';
import { bundledBibleRepo, BUNDLED_BIBLE_VERSIONS } from '../src/bible/bundledRepo';
import { createBibleSlice } from '../src/store/bibleSlice';
import { createLibrarySlice } from '../src/store/librarySlice';
import { createPresentationSlice } from '../src/store/presentationSlice';
import { createFirestoreRepo } from '../src/persistence/firestoreRepo';
import { createLocalRepo } from '../src/persistence/localRepo';
import { mergeSongbook } from '../src/persistence/songbook';
import { DEFAULT_THEMES, SAMPLE_SONGS } from '../src/data/seed';
import { documents, serverReads } from './fixtures/firestore';
import type { StoreState } from '../src/store/types';
import type { RepoSnapshot } from '../src/persistence/repo';
import type { BibleVerse } from '../src/bible/types';
import { waitForInstallation } from '../src/pwa/updates';

const events = new EventTarget();
Object.defineProperty(globalThis, 'window', { value: Object.assign(events, { setTimeout, clearTimeout }) });
Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true });
const local = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => local.get(key) ?? null,
  setItem: (key: string, value: string) => local.set(key, value),
} });
globalThis.fetch = async (input) => new Response(await readFile(`public${String(input)}`), { status: 200 });

function store() {
  return create<StoreState>()((...args) => ({
    ...createLibrarySlice(...args), ...createPresentationSlice(...args), ...createBibleSlice(...args),
  }));
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

test('citas: prefijos, abreviaturas, acentos, numerales y rangos inválidos', () => {
  for (const query of ['Jua', 'Juan1:5-10', 'Jn. 1:5–10', 'John 1:5—10']) {
    assert.equal(parseBibleReference(query)?.books[0].number, 43);
  }
  assert.equal(parseBibleReference('Génesis 1:1')?.books[0].number, 1);
  assert.equal(parseBibleReference('II Corintios 3:2')?.books[0].number, 47);
  assert.equal(parseBibleReference('1Jn 2:3')?.books[0].number, 62);
  assert.deepEqual(parseBibleReference('Juan 0:1')?.books, []);
  assert.deepEqual(parseBibleReference('Juan 1:10-5')?.books, []);
  assert.equal(parseBibleReference('amor'), null);
});

test('Juan 1:5-10 conserva el rango y todo el texto en las ocho Biblias', async () => {
  for (const version of BUNDLED_BIBLE_VERSIONS) {
    const results = await bundledBibleRepo.search(version.id, 'Juan 1:5-10');
    const verses = await bundledBibleRepo.getPassage(version.id, 43, 1, 5, 10);
    assert.equal(results.length, 1, version.id);
    assert.equal(results[0].verse, verses[0].verse, version.id);
    assert.equal(results[0].verseEnd, verses.at(-1)!.verseEnd ?? verses.at(-1)!.verse, version.id);
    assert.equal(results[0].text, verses.map((verse) => verse.text).join(' '), version.id);
  }
  assert.deepEqual(await bundledBibleRepo.search('rv1909', 'Ju'), []);
  assert.equal((await bundledBibleRepo.search('rv1909', 'Jua')).length, 100);
  assert.deepEqual(await bundledBibleRepo.search('rv1909', 'Juan 1:999'), []);
  const text = await bundledBibleRepo.search('rv1909', 'tinieblas');
  assert.ok(text.length > 0 && text.every((verse) => verse.text.toLowerCase().includes('tinieblas')));
});

test('una búsqueda anterior no pisa la nueva ni reaparece al borrar/cambiar versión', async () => {
  const state = store();
  const original = bundledBibleRepo.search;
  try {
    const old = deferred<BibleVerse[]>();
    bundledBibleRepo.search = () => old.promise;
    const pending = state.getState().searchBible('Juan');
    bundledBibleRepo.search = async () => [{ book: 1, chapter: 1, verse: 1, text: 'actual' }];
    await state.getState().searchBible('Genesis');
    old.resolve([{ book: 43, chapter: 1, verse: 1, text: 'viejo' }]);
    await pending;
    assert.equal(state.getState().bibleSearchResults[0].text, 'actual');
    const clear = deferred<BibleVerse[]>();
    bundledBibleRepo.search = () => clear.promise;
    const clearing = state.getState().searchBible('Juan');
    state.getState().clearBibleSearch();
    clear.resolve([{ book: 43, chapter: 1, verse: 1, text: 'obsoleto' }]);
    await clearing;
    assert.deepEqual(state.getState().bibleSearchResults, []);
    assert.equal(state.getState().bibleSearching, false);
    const change = deferred<BibleVerse[]>();
    bundledBibleRepo.search = () => change.promise;
    const changing = state.getState().searchBible('Juan');
    await state.getState().setBibleVersion('kjv');
    change.resolve([{ book: 43, chapter: 1, verse: 1, text: 'versión anterior' }]);
    await changing;
    assert.deepEqual(state.getState().bibleSearchResults, []);
  } finally { bundledBibleRepo.search = original; }
});

test('un capítulo anterior no sustituye al último seleccionado', async () => {
  const state = store();
  const original = bundledBibleRepo.getChapter;
  try {
    const previous = deferred<BibleVerse[]>();
    bundledBibleRepo.getChapter = () => previous.promise;
    const pending = state.getState().openBibleChapter(43, 1);
    bundledBibleRepo.getChapter = async () => [{ book: 43, chapter: 2, verse: 1, text: 'capítulo actual' }];
    await state.getState().openBibleChapter(43, 2);
    previous.resolve([{ book: 43, chapter: 1, verse: 1, text: 'capítulo anterior' }]);
    await pending;
    assert.equal(state.getState().bibleChapter, 2);
    assert.equal(state.getState().bibleChapterVerses[0].chapter, 2);
  } finally { bundledBibleRepo.getChapter = original; }
});

test('la PWA espera la instalación completa y detecta descargas fallidas', async () => {
  const worker = Object.assign(new EventTarget(), { state: 'installing' });
  let completed = false;
  const pending = waitForInstallation(worker as unknown as ServiceWorker).then(() => { completed = true; });
  await Promise.resolve();
  assert.equal(completed, false);
  worker.state = 'installed';
  worker.dispatchEvent(new Event('statechange'));
  await pending;
  assert.equal(completed, true);
  worker.state = 'redundant';
  await assert.rejects(waitForInstallation(worker as unknown as ServiceWorker), /descargar la actualización/);
});

test('las bajas de letras incluidas sobreviven reinicios locales', async () => {
  const repo = createLocalRepo();
  await repo.deleteSong(SAMPLE_SONGS[0].id);
  const songs = mergeSongbook(SAMPLE_SONGS, await createLocalRepo().loadSongs());
  assert.ok(!songs.some((song) => song.id === SAMPLE_SONGS[0].id));
});

test('dos cuentas leen, editan y eliminan la misma biblioteca y ajustes en tiempo real', async () => {
  documents.clear();
  const first = createFirestoreRepo('cuenta-a');
  const second = createFirestoreRepo('cuenta-b');
  let snapshot: RepoSnapshot = {};
  const unsubscribe = second.subscribe!((next) => { snapshot = { ...snapshot, ...next }; }, assert.fail);
  try {
    const song = { ...SAMPLE_SONGS[0], updatedAt: Date.now(), title: 'Compartida' };
    await first.saveSong(song);
    assert.equal((snapshot.songs![0] as any).title, 'Compartida');
    await second.saveSong({ ...song, title: 'Editada por B' });
    assert.equal(((await first.loadSongs())[0] as any).title, 'Editada por B');
    await first.saveTheme({ ...DEFAULT_THEMES[0], name: 'Tema común' });
    assert.equal(snapshot.themes![0].name, 'Tema común');
    await first.saveSettings({ defaultThemeId: DEFAULT_THEMES[0].id, language: 'es', logoUrl: 'https://example.org/logo.png' });
    assert.equal(snapshot.settings!.logoUrl, 'https://example.org/logo.png');
    await second.deleteSong(song.id);
    assert.deepEqual(snapshot.songs, [{ id: song.id, deleted: true }]);
    assert.ok(!mergeSongbook(SAMPLE_SONGS, await first.loadSongs()).some((item) => item.id === song.id));
    const readsBefore = serverReads;
    await first.refresh!();
    assert.ok(serverReads > readsBefore);
    assert.ok(![...documents.keys()].some((path) => path.startsWith('users/') && path.includes('/songs/')));
  } finally { unsubscribe(); }
});

test('la migración conserva originales, no pisa ediciones ni restaura bajas compartidas', async () => {
  documents.clear();
  const legacy = { ...SAMPLE_SONGS[0], updatedAt: 10, title: 'Anterior' };
  documents.set(`users/anterior/songs/${legacy.id}`, legacy);
  documents.set(`users/anterior/songs/nueva`, { ...legacy, id: 'nueva' });
  documents.set(`libraries/shared/songs/${legacy.id}`, { id: legacy.id, deleted: true });
  await createFirestoreRepo('anterior').prepare!();
  assert.equal(documents.get('libraries/shared/songs/nueva').title, 'Anterior');
  assert.equal(documents.get(`libraries/shared/songs/${legacy.id}`).deleted, true);
  assert.ok(documents.has(`users/anterior/songs/${legacy.id}`));
  documents.set('libraries/shared/songs/nueva', { ...legacy, id: 'nueva', title: 'Actualizada' });
  await createFirestoreRepo('anterior').prepare!();
  assert.equal(documents.get('libraries/shared/songs/nueva').title, 'Actualizada');
});

test('migraciones simultáneas no sobrescriben un documento creado por otra cuenta', async () => {
  documents.clear();
  documents.set('users/a/songs/mismo-id', { ...SAMPLE_SONGS[0], id: 'mismo-id', title: 'Cuenta A', updatedAt: 1 });
  documents.set('users/b/songs/mismo-id', { ...SAMPLE_SONGS[0], id: 'mismo-id', title: 'Cuenta B', updatedAt: 2 });
  await Promise.all([createFirestoreRepo('a').prepare!(), createFirestoreRepo('b').prepare!()]);
  assert.ok(['Cuenta A', 'Cuenta B'].includes(documents.get('libraries/shared/songs/mismo-id').title));
  assert.equal([...documents.keys()].filter((path) => path === 'libraries/shared/songs/mismo-id').length, 1);
  assert.ok(documents.has('users/a/meta/sharedLibraryV1') && documents.has('users/b/meta/sharedLibraryV1'));
});

test('los cambios remotos actualizan slides, logo y borrados del store activo', async () => {
  documents.clear();
  const state = store();
  await state.getState().init('operador');
  const other = createFirestoreRepo('otro');
  const song = SAMPLE_SONGS[0];
  state.getState().setActiveSong(song.id);
  state.getState().goLive(0);
  await other.saveSong({ ...song, updatedAt: 100, blocks: [{ ...song.blocks[0], lines: ['Letra corregida'] }] });
  assert.deepEqual(state.getState().slides[0].lines, ['Letra corregida']);
  assert.deepEqual(state.getState().live.slide!.lines, ['Letra corregida']);
  await other.saveSettings({ defaultThemeId: DEFAULT_THEMES[0].id, language: 'es', logoUrl: 'https://example.org/compartido.png' });
  assert.equal(state.getState().live.logoUrl, 'https://example.org/compartido.png');
  await other.deleteSong(song.id);
  assert.equal(state.getState().activeSongId, null);
  assert.equal(state.getState().live.slide, null);
  assert.equal(state.getState().slides.length, 0);
  state.getState().reset();
});
