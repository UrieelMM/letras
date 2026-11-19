import type { Song } from '../types';
import type { StoredSong } from './repo';

export function mergeSongbook(bundled: Song[], stored: StoredSong[]): Song[] {
  const byId = new Map(bundled.map((song) => [song.id, song]));
  for (const song of stored) {
    if ('deleted' in song && song.deleted) byId.delete(song.id);
    else if ('blocks' in song && !(byId.has(song.id) && song.updatedAt === 0)) byId.set(song.id, song);
  }
  return [...byId.values()];
}
