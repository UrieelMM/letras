import {
  collection, deleteDoc, doc, getDoc, getDocFromServer, getDocs, getDocsFromServer,
  onSnapshot, setDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { AppSettings, Setlist, Theme } from '../types';
import type { DataRepo, StoredSong } from './repo';
import { migratePersonalLibrary } from './sharedMigration';

/** Todas las cuentas consultan y editan la misma biblioteca. */
export function createFirestoreRepo(uid: string): DataRepo {
  if (!db) throw new Error('Firestore no está inicializado');
  const firestore = db;
  const base = 'libraries/shared';
  const songsCol = collection(firestore, `${base}/songs`);
  const themesCol = collection(firestore, `${base}/themes`);
  const setlistsCol = collection(firestore, `${base}/setlists`);
  const settingsRef = doc(firestore, `${base}/meta/settings`);
  let preparation: Promise<void> | null = null;

  function prepare() {
    if (!preparation) {
      preparation = migratePersonalLibrary(firestore, uid).finally(() => { preparation = null; });
    }
    return preparation;
  }

  return {
    prepare,
    async loadSongs() {
      return (await getDocs(songsCol)).docs.map((d) => ({ ...d.data(), id: d.id }) as StoredSong);
    },
    async saveSong(song) { await setDoc(doc(songsCol, song.id), song); },
    async deleteSong(id) {
      // Una baja explícita impide que el bundle o una migración la resuciten.
      await setDoc(doc(songsCol, id), { id, deleted: true });
    },
    async loadThemes() {
      return (await getDocs(themesCol)).docs.map((d) => ({ ...d.data(), id: d.id }) as Theme);
    },
    async saveTheme(theme) { await setDoc(doc(themesCol, theme.id), theme); },
    async deleteTheme(id) { await deleteDoc(doc(themesCol, id)); },
    async loadSetlists() {
      return (await getDocs(setlistsCol)).docs.map((d) => ({ ...d.data(), id: d.id }) as Setlist);
    },
    async saveSetlist(setlist) { await setDoc(doc(setlistsCol, setlist.id), setlist); },
    async deleteSetlist(id) { await deleteDoc(doc(setlistsCol, id)); },
    async loadSettings() {
      const snapshot = await getDoc(settingsRef);
      return snapshot.exists() ? snapshot.data() as AppSettings : null;
    },
    async saveSettings(settings) { await setDoc(settingsRef, settings); },
    async refresh() {
      await prepare();
      const [songs, themes, setlists, settings] = await Promise.all([
        getDocsFromServer(songsCol), getDocsFromServer(themesCol),
        getDocsFromServer(setlistsCol), getDocFromServer(settingsRef),
      ]);
      return {
        songs: songs.docs.map((d) => ({ ...d.data(), id: d.id }) as StoredSong),
        themes: themes.docs.map((d) => ({ ...d.data(), id: d.id }) as Theme),
        setlists: setlists.docs.map((d) => ({ ...d.data(), id: d.id }) as Setlist),
        settings: settings.exists() ? settings.data() as AppSettings : null,
      };
    },
    subscribe(onChange, onError) {
      const unsubs = [
        onSnapshot(songsCol, (snap) => onChange({ songs: snap.docs.map((d) => ({ ...d.data(), id: d.id }) as StoredSong) }), onError),
        onSnapshot(themesCol, (snap) => onChange({ themes: snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Theme) }), onError),
        onSnapshot(setlistsCol, (snap) => onChange({ setlists: snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Setlist) }), onError),
        onSnapshot(settingsRef, (snap) => onChange({ settings: snap.exists() ? snap.data() as AppSettings : null }), onError),
      ];
      const retryMigration = () => { void prepare().catch(onError); };
      window.addEventListener('online', retryMigration);
      return () => {
        unsubs.forEach((unsub) => unsub());
        window.removeEventListener('online', retryMigration);
      };
    },
  };
}
