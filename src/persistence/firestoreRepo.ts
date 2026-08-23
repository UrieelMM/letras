import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { AppSettings, Setlist, Song, Theme } from '../types';
import type { DataRepo } from './repo';

/**
 * Repositorio en Cloud Firestore, con datos aislados por usuario en:
 *   users/{uid}/songs/{songId}
 *   users/{uid}/themes/{themeId}
 *   users/{uid}/setlists/{setlistId}
 *   users/{uid}/meta/settings
 */
export function createFirestoreRepo(uid: string): DataRepo {
  if (!db) throw new Error('Firestore no está inicializado');
  const base = `users/${uid}`;
  const songsCol = collection(db, `${base}/songs`);
  const themesCol = collection(db, `${base}/themes`);
  const setlistsCol = collection(db, `${base}/setlists`);
  const settingsRef = doc(db, `${base}/meta/settings`);

  return {
    async loadSongs() {
      const s = await getDocs(songsCol);
      return s.docs.map((d) => d.data() as Song);
    },
    async saveSong(song) {
      await setDoc(doc(songsCol, song.id), song);
    },
    async deleteSong(id) {
      await deleteDoc(doc(songsCol, id));
    },

    async loadThemes() {
      const s = await getDocs(themesCol);
      return s.docs.map((d) => d.data() as Theme);
    },
    async saveTheme(theme) {
      await setDoc(doc(themesCol, theme.id), theme);
    },
    async deleteTheme(id) {
      await deleteDoc(doc(themesCol, id));
    },

    async loadSetlists() {
      const s = await getDocs(setlistsCol);
      return s.docs.map((d) => d.data() as Setlist);
    },
    async saveSetlist(setlist) {
      await setDoc(doc(setlistsCol, setlist.id), setlist);
    },
    async deleteSetlist(id) {
      await deleteDoc(doc(setlistsCol, id));
    },

    async loadSettings() {
      const d = await getDoc(settingsRef);
      return d.exists() ? (d.data() as AppSettings) : null;
    },
    async saveSettings(settings) {
      await setDoc(settingsRef, settings);
    },

    subscribe(onChange) {
      const unsubs = [
        onSnapshot(
          songsCol,
          (snap) => onChange({ songs: snap.docs.map((d) => d.data() as Song) }),
          (error) => console.warn('No se pudo sincronizar canciones:', error),
        ),
        onSnapshot(
          themesCol,
          (snap) => onChange({ themes: snap.docs.map((d) => d.data() as Theme) }),
          (error) => console.warn('No se pudo sincronizar temas:', error),
        ),
        onSnapshot(
          setlistsCol,
          (snap) => onChange({ setlists: snap.docs.map((d) => d.data() as Setlist) }),
          (error) => console.warn('No se pudo sincronizar listas:', error),
        ),
      ];
      return () => unsubs.forEach((u) => u());
    },
  };
}
