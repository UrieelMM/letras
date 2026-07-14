import type { AppSettings, Setlist, Song, Theme } from '../types';
import type { DataRepo } from './repo';
import { LS_KEYS, lsGet, lsSet } from './storage';

/** Repositorio basado en localStorage (modo local, un solo "usuario"). */
export function createLocalRepo(): DataRepo {
  function upsert<T extends { id: string }>(key: string, item: T) {
    const arr = lsGet<T[]>(key, []);
    const i = arr.findIndex((x) => x.id === item.id);
    if (i >= 0) arr[i] = item;
    else arr.push(item);
    lsSet(key, arr);
  }
  function remove<T extends { id: string }>(key: string, id: string) {
    lsSet(
      key,
      lsGet<T[]>(key, []).filter((x) => x.id !== id),
    );
  }

  return {
    async loadSongs() {
      return lsGet<Song[]>(LS_KEYS.songs, []);
    },
    async saveSong(song) {
      upsert(LS_KEYS.songs, song);
    },
    async deleteSong(id) {
      remove<Song>(LS_KEYS.songs, id);
    },

    async loadThemes() {
      return lsGet<Theme[]>(LS_KEYS.themes, []);
    },
    async saveTheme(theme) {
      upsert(LS_KEYS.themes, theme);
    },
    async deleteTheme(id) {
      remove<Theme>(LS_KEYS.themes, id);
    },

    async loadSetlists() {
      return lsGet<Setlist[]>(LS_KEYS.setlists, []);
    },
    async saveSetlist(setlist) {
      upsert(LS_KEYS.setlists, setlist);
    },
    async deleteSetlist(id) {
      remove<Setlist>(LS_KEYS.setlists, id);
    },

    async loadSettings() {
      return lsGet<AppSettings | null>(LS_KEYS.settings, null);
    },
    async saveSettings(settings) {
      lsSet(LS_KEYS.settings, settings);
    },
  };
}
