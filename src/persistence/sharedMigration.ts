import { collection, doc, getDocFromServer, getDocsFromServer, runTransaction, setDoc, type Firestore } from 'firebase/firestore';
import { DEFAULT_THEMES, SAMPLE_SONGS } from '../data/seed';
import { shareLocalMedia } from '../media/libraryMedia';

/** Reintentable: conserva los originales y nunca pisa cambios de la biblioteca común. */
export async function migratePersonalLibrary(firestore: Firestore, uid: string): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const marker = doc(firestore, `users/${uid}/meta/sharedLibraryV1`);
  if ((await getDocFromServer(marker)).exists()) return;
  const uploads = new Map<string, string>();
  const canonical = (value: unknown): string => JSON.stringify(value, (_key, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
  const defaults = new Map(DEFAULT_THEMES.map((theme) => [theme.id, canonical(theme)]));
  const bundledIds = new Set(SAMPLE_SONGS.map((song) => song.id));
  let firstError: unknown;

  for (const name of ['songs', 'themes', 'setlists'] as const) {
    const legacy = await getDocsFromServer(collection(firestore, `users/${uid}/${name}`));
    for (const item of legacy.docs) {
      const data = item.data();
      if (name === 'songs' && bundledIds.has(item.id) && data.updatedAt === 0) continue;
      if (name === 'themes' && defaults.get(item.id) === canonical(data)) continue;
      const target = doc(firestore, `libraries/shared/${name}/${item.id}`);
      try {
        if ((await getDocFromServer(target)).exists()) continue;
        const shared = await shareLocalMedia({ ...data, id: item.id }, uid, uploads);
        await runTransaction(firestore, async (transaction) => {
          if (!(await transaction.get(target)).exists()) transaction.set(target, shared);
        });
      } catch (error) {
        firstError ??= error;
      }
    }
  }

  const oldSettings = await getDocFromServer(doc(firestore, `users/${uid}/meta/settings`));
  const settingsRef = doc(firestore, 'libraries/shared/meta/settings');
  if (oldSettings.exists() && !(await getDocFromServer(settingsRef)).exists()) {
    try {
      const shared = await shareLocalMedia(oldSettings.data(), uid, uploads);
      await runTransaction(firestore, async (transaction) => {
        if (!(await transaction.get(settingsRef)).exists()) transaction.set(settingsRef, shared);
      });
    } catch (error) {
      firstError ??= error;
    }
  }
  if (firstError) throw firstError;
  await setDoc(marker, { completedAt: Date.now() });
}
