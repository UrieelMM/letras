const DB_NAME = 'wordship-media';
const STORE_NAME = 'assets';
const URL_PREFIX = 'wordship-media:';

type MediaKind = 'theme' | 'logo' | 'resource';

interface StoredMedia {
  blob: Blob;
  name: string;
  type: string;
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openMediaDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el almacenamiento local.'));
  });
  return dbPromise;
}

export function isLocalMediaUrl(value: string | null | undefined): value is string {
  return Boolean(value?.startsWith(URL_PREFIX));
}

async function saveLocalImage(
  file: File,
  kind: MediaKind,
  maxBytes: number,
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen válido.');
  }
  if (file.size > maxBytes) {
    throw new Error(`La imagen no puede pesar más de ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  }

  return saveLocalMedia(file, kind, onProgress);
}

async function saveLocalMedia(
  file: File,
  kind: MediaKind,
  onProgress?: (progress: number) => void,
): Promise<string> {
  onProgress?.(10);
  const db = await openMediaDb();
  const id = `${kind}-${Date.now()}-${crypto.randomUUID()}`;
  const value: StoredMedia = {
    blob: file,
    name: file.name,
    type: file.type,
    createdAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('No se pudo guardar la imagen localmente.'));
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo guardar la imagen localmente.'));
  });

  onProgress?.(100);
  return `${URL_PREFIX}${id}`;
}

export function saveLocalResource(file: File, onProgress?: (progress: number) => void): Promise<string> {
  return saveLocalMedia(file, 'resource', onProgress);
}

export async function removeLocalResource(reference: string): Promise<void> {
  if (!reference.startsWith(`${URL_PREFIX}resource-`)) return;
  const db = await openMediaDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(reference.slice(URL_PREFIX.length));
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
  });
}

export function saveThemeImageLocally(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  return saveLocalImage(file, 'theme', 10 * 1024 * 1024, onProgress);
}

export function saveBrandLogoLocally(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  return saveLocalImage(file, 'logo', 5 * 1024 * 1024, onProgress);
}

export async function loadLocalMediaBlob(reference: string): Promise<Blob | null> {
  if (!isLocalMediaUrl(reference)) return null;
  const id = reference.slice(URL_PREFIX.length);
  const db = await openMediaDb();
  return new Promise((resolve) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    request.onsuccess = () => {
      const value = request.result as StoredMedia | Blob | undefined;
      resolve(value instanceof Blob ? value : value?.blob ?? null);
    };
    request.onerror = () => resolve(null);
  });
}
