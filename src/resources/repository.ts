import {
  collection, deleteDoc, doc, getDocsFromServer, onSnapshot, query, runTransaction,
  setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { removeLocalResource, saveLocalResource } from '../media/localMedia';
import { compareResources, RESOURCE_NAME_LIMIT, validateResource, type MediaResource, type ResourceFolder } from './model';

type ResourceDetails = Pick<MediaResource, 'title' | 'category'> & { folderId: string | null };
type ProgressHandler = (percent: number) => void;
const LOCAL_KEY = 'wordship.resources.v1';
const FOLDERS_KEY = 'wordship.resource-folders.v1';

export interface ResourceRepository {
  refresh(): Promise<{ items: MediaResource[]; folders: ResourceFolder[] }>;
  subscribe(onChange: (items: MediaResource[]) => void, onError: (error: Error) => void): () => void;
  subscribeFolders(onChange: (folders: ResourceFolder[]) => void, onError: (error: Error) => void): () => void;
  createFolder(name: string): Promise<ResourceFolder>;
  renameFolder(id: string, name: string): Promise<void>;
  deleteFolder(id: string): Promise<void>;
  upload(file: File, details: ResourceDetails, onProgress: ProgressHandler): Promise<MediaResource>;
  deleteResource(resource: MediaResource): Promise<void>;
  update(id: string, details: ResourceDetails): Promise<void>;
  swap(first: MediaResource, second: MediaResource): Promise<void>;
}

function describeFile(file: File, { title, category, folderId }: ResourceDetails): Omit<MediaResource, 'url'> {
  const createdAt = Date.now();
  return {
    id: crypto.randomUUID(),
    title: title.trim().slice(0, RESOURCE_NAME_LIMIT) || file.name.slice(0, RESOURCE_NAME_LIMIT),
    category,
    folderId,
    ...validateResource(file),
    size: file.size,
    createdAt,
    position: createdAt,
  };
}

function swapPositions(first: MediaResource, second: MediaResource) {
  if (first.position !== second.position) return [second.position, first.position] as const;
  // Si dos subidas coincidieron en el mismo milisegundo, resuelve el empate.
  return compareResources(first, second) < 0
    ? [first.position, second.position - 0.001] as const
    : [first.position - 0.001, second.position] as const;
}

function folderName(name: string) {
  const trimmed = name.trim().slice(0, RESOURCE_NAME_LIMIT);
  if (!trimmed) throw new Error('Escribe un nombre para la carpeta.');
  return trimmed;
}

function describeFolder(name: string): ResourceFolder {
  return { id: crypto.randomUUID(), name: folderName(name), createdAt: Date.now() };
}

function ensureOpenFolder(folder: ResourceFolder | undefined) {
  if (!folder || folder.deleting) throw new Error('La carpeta ya no está disponible. Elige otra ubicación.');
}

function withLocalLibraryLock<T>(action: () => T | Promise<T>) {
  return navigator.locks ? navigator.locks.request('wordship.resource-library', action) : Promise.resolve().then(action);
}

function localCollection<T>(key: string) {
  function read(): T[] {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[];
  }

  function write(items: T[]) {
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new Event(key));
  }

  function update(change: (items: T[]) => T[]) {
    write(change(read()));
  }

  return {
    read,
    update,
    subscribe(onChange: (items: T[]) => void, onError: (error: Error) => void) {
      function emit() {
        try { onChange(read()); }
        catch { onError(new Error('No se pudo abrir la biblioteca de este dispositivo.')); }
      }
      function sync(event: StorageEvent) {
        if (event.key === key || event.key === null) emit();
      }
      emit();
      window.addEventListener('storage', sync);
      window.addEventListener(key, emit);
      return () => {
        window.removeEventListener('storage', sync);
        window.removeEventListener(key, emit);
      };
    },
  };
}

function createLocalRepository(): ResourceRepository {
  const resources = localCollection<MediaResource>(LOCAL_KEY);
  const folders = localCollection<ResourceFolder>(FOLDERS_KEY);

  function checkFolder(id?: string | null) {
    if (id) ensureOpenFolder(folders.read().find((folder) => folder.id === id));
  }

  async function deleteResource(resource: MediaResource) {
    await removeLocalResource(resource.url);
    await withLocalLibraryLock(() => resources.update((items) => items.filter((item) => item.id !== resource.id)));
  }

  return {
    async refresh() { return { items: resources.read(), folders: folders.read() }; },
    subscribe: resources.subscribe,
    subscribeFolders: folders.subscribe,
    async createFolder(name) {
      const folder = describeFolder(name);
      await withLocalLibraryLock(() => folders.update((items) => [...items, folder]));
      return folder;
    },
    async renameFolder(id, name) {
      const nextName = folderName(name);
      await withLocalLibraryLock(() => {
        checkFolder(id);
        folders.update((items) => items.map((folder) => folder.id === id ? { ...folder, name: nextName } : folder));
      });
    },
    async deleteFolder(id) {
      const contents = await withLocalLibraryLock(() => {
        folders.update((items) => items.map((folder) => folder.id === id ? { ...folder, deleting: true } : folder));
        return resources.read().filter((item) => item.folderId === id);
      });
      for (const resource of contents) await deleteResource(resource);
      await withLocalLibraryLock(() => folders.update((items) => items.filter((folder) => folder.id !== id)));
    },
    async upload(file, details, onProgress) {
      const metadata = describeFile(file, details);
      const url = await saveLocalResource(file, (value) => onProgress(Math.min(value, 99)));
      const resource = { ...metadata, url };
      try {
        await withLocalLibraryLock(() => {
          checkFolder(details.folderId);
          resources.update((items) => [...items, resource]);
        });
      } catch (error) {
        await removeLocalResource(url).catch(() => {});
        throw error;
      }
      onProgress(100);
      return resource;
    },
    deleteResource,
    async update(id, details) {
      await withLocalLibraryLock(() => {
        checkFolder(details.folderId);
        resources.update((items) => items.map((item) => {
          if (item.id !== id) return item;
          checkFolder(item.folderId);
          return { ...item, ...details };
        }));
      });
    },
    async swap(first, second) {
      const [firstPosition, secondPosition] = swapPositions(first, second);
      await withLocalLibraryLock(() => resources.update((items) => items.map((item) => {
        if (item.id === first.id) return { ...item, position: firstPosition };
        if (item.id === second.id) return { ...item, position: secondPosition };
        return item;
      })));
    },
  };
}

export function createResourceRepository(userId: string): ResourceRepository {
  if (userId === 'local') return createLocalRepository();
  if (!db) throw new Error('Firestore no está configurado.');
  const firestore = db;
  const resources = collection(firestore, 'resources');
  const folders = collection(firestore, 'resourceFolders');

  function resourceObject(id: string) {
    if (!storage) throw new Error('Configura el bucket de Firebase Storage para gestionar archivos.');
    return ref(storage, `resources/${id}`);
  }

  async function deleteResource(resource: MediaResource) {
    try {
      await deleteObject(resourceObject(resource.id));
    } catch (error) {
      if ((error as { code?: string }).code !== 'storage/object-not-found') throw error;
    }
    await deleteDoc(doc(resources, resource.id));
  }

  return {
    async refresh() {
      const [items, allFolders] = await Promise.all([getDocsFromServer(resources), getDocsFromServer(folders)]);
      return {
        items: items.docs.map((item) => ({ ...item.data(), id: item.id }) as MediaResource),
        folders: allFolders.docs.map((item) => ({ ...item.data(), id: item.id }) as ResourceFolder),
      };
    },
    subscribe(onChange, onError) {
      return onSnapshot(resources, (snapshot) => {
        onChange(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as MediaResource));
      }, onError);
    },
    subscribeFolders(onChange, onError) {
      return onSnapshot(folders, (snapshot) => {
        onChange(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as ResourceFolder));
      }, onError);
    },
    async createFolder(name) {
      const folder = describeFolder(name);
      await setDoc(doc(folders, folder.id), folder);
      return folder;
    },
    async renameFolder(id, name) {
      const folderRef = doc(folders, id);
      const nextName = folderName(name);
      await runTransaction(firestore, async (transaction) => {
        const folder = await transaction.get(folderRef);
        ensureOpenFolder(folder.data() as ResourceFolder | undefined);
        transaction.update(folderRef, { name: nextName });
      });
    },
    async deleteFolder(id) {
      const folderRef = doc(folders, id);
      await runTransaction(firestore, async (transaction) => {
        if ((await transaction.get(folderRef)).exists()) transaction.update(folderRef, { deleting: true });
      });
      const contents = await getDocsFromServer(query(resources, where('folderId', '==', id)));
      for (const item of contents.docs) {
        await deleteResource({ ...item.data(), id: item.id } as MediaResource);
      }
      await deleteDoc(folderRef);
    },
    async upload(file, details, onProgress) {
      const metadata = describeFile(file, details);
      const object = resourceObject(metadata.id);
      const task = uploadBytesResumable(object, file, { contentType: metadata.mimeType, cacheControl: 'private, no-store' });
      const unsubscribe = task.on('state_changed', ({ bytesTransferred, totalBytes }) => {
        onProgress(Math.min(99, Math.round(bytesTransferred / totalBytes * 100)));
      });
      try {
        await task;
        try {
          const url = await getDownloadURL(object);
          const resource = { ...metadata, url };
          await setDoc(doc(resources, resource.id), resource);
          onProgress(100);
          return resource;
        } catch (error) {
          await deleteObject(object).catch(() => {});
          throw error;
        }
      } finally {
        unsubscribe();
      }
    },
    deleteResource,
    async update(id, details) {
      await updateDoc(doc(resources, id), details);
    },
    async swap(first, second) {
      const [firstPosition, secondPosition] = swapPositions(first, second);
      const batch = writeBatch(firestore);
      batch.update(doc(resources, first.id), { position: firstPosition });
      batch.update(doc(resources, second.id), { position: secondPosition });
      await batch.commit();
    },
  };
}
