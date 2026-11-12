import { collection, doc, onSnapshot, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { removeLocalResource, saveLocalResource } from '../media/localMedia';
import { compareResources, validateResource, type MediaResource } from './model';

type ResourceDetails = Pick<MediaResource, 'title' | 'category'>;
type ProgressHandler = (percent: number) => void;
const LOCAL_KEY = 'wordship.resources.v1';

export interface ResourceRepository {
  subscribe(onChange: (items: MediaResource[]) => void, onError: (error: Error) => void): () => void;
  upload(file: File, details: ResourceDetails, onProgress: ProgressHandler): Promise<MediaResource>;
  update(id: string, details: ResourceDetails): Promise<void>;
  swap(first: MediaResource, second: MediaResource): Promise<void>;
}

function describeFile(file: File, { title, category }: ResourceDetails): Omit<MediaResource, 'url'> {
  const createdAt = Date.now();
  return {
    id: crypto.randomUUID(),
    title: title.trim().slice(0, 120) || file.name.slice(0, 120),
    category,
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

function createLocalRepository(): ResourceRepository {
  function read(): MediaResource[] {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as MediaResource[];
  }

  function write(items: MediaResource[]) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(LOCAL_KEY));
  }

  return {
    subscribe(onChange, onError) {
      function emit() {
        try { onChange(read()); }
        catch { onError(new Error('No se pudo abrir la biblioteca de este dispositivo.')); }
      }
      function sync(event: StorageEvent) {
        if (event.key === LOCAL_KEY) emit();
      }
      emit();
      window.addEventListener('storage', sync);
      window.addEventListener(LOCAL_KEY, emit);
      return () => {
        window.removeEventListener('storage', sync);
        window.removeEventListener(LOCAL_KEY, emit);
      };
    },
    async upload(file, details, onProgress) {
      const metadata = describeFile(file, details);
      const url = await saveLocalResource(file, (value) => onProgress(Math.min(value, 99)));
      const resource = { ...metadata, url };
      try {
        write([...read(), resource]);
      } catch (error) {
        await removeLocalResource(url).catch(() => {});
        throw error;
      }
      onProgress(100);
      return resource;
    },
    async update(id, details) {
      write(read().map((item) => item.id === id ? { ...item, ...details } : item));
    },
    async swap(first, second) {
      const [firstPosition, secondPosition] = swapPositions(first, second);
      write(read().map((item) => {
        if (item.id === first.id) return { ...item, position: firstPosition };
        if (item.id === second.id) return { ...item, position: secondPosition };
        return item;
      }));
    },
  };
}

export function createResourceRepository(userId: string): ResourceRepository {
  if (userId === 'local') return createLocalRepository();
  if (!db) throw new Error('Firestore no está configurado.');
  const firestore = db;
  const resources = collection(firestore, 'users', userId, 'resources');

  return {
    subscribe(onChange, onError) {
      return onSnapshot(resources, (snapshot) => {
        onChange(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as MediaResource));
      }, onError);
    },
    async upload(file, details, onProgress) {
      if (!storage) throw new Error('Configura el bucket de Firebase Storage para subir archivos.');
      const metadata = describeFile(file, details);
      const object = ref(storage, `users/${userId}/resources/${metadata.id}`);
      const task = uploadBytesResumable(object, file, { contentType: metadata.mimeType });
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
