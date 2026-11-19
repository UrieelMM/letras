import { createResourceRepository } from '../resources/repository';
import { isLocalMediaUrl, loadLocalMediaBlob, saveBrandLogoLocally, saveThemeImageLocally } from './localMedia';

export async function saveLibraryImage(
  userId: string,
  file: File,
  kind: 'logo' | 'theme',
  onProgress: (progress: number) => void,
): Promise<string> {
  const maxMB = kind === 'logo' ? 5 : 10;
  if (!file.type.startsWith('image/') || file.size > maxMB * 1024 * 1024) {
    throw new Error(`Selecciona una imagen de hasta ${maxMB} MB.`);
  }
  if (userId === 'local') {
    return kind === 'logo' ? saveBrandLogoLocally(file, onProgress) : saveThemeImageLocally(file, onProgress);
  }
  const resource = await createResourceRepository(userId).upload(
    file, { title: file.name, category: 'general', folderId: null }, onProgress,
  );
  return resource.url;
}

/** Publica los archivos de IndexedDB antes de compartir sus referencias. */
export async function shareLocalMedia<T>(value: T, userId: string, uploads = new Map<string, string>()): Promise<T> {
  async function visit(item: unknown): Promise<unknown> {
    if (typeof item === 'string' && isLocalMediaUrl(item)) {
      const uploaded = uploads.get(item);
      if (uploaded) return uploaded;
      const blob = await loadLocalMediaBlob(item);
      if (!blob) throw new Error('Hay imágenes anteriores que solo están en otro equipo. Abre esa cuenta en el equipo original para compartirlas.');
      const file = new File([blob], `Imagen importada ${item.slice(-12)}`, { type: blob.type });
      const resource = await createResourceRepository(userId).upload(
        file, { title: file.name, category: 'general', folderId: null }, () => {},
      );
      uploads.set(item, resource.url);
      return resource.url;
    }
    if (Array.isArray(item)) {
      const items = [];
      for (const child of item) items.push(await visit(child));
      return items;
    }
    if (item && typeof item === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(item)) {
        if (child !== undefined) result[key] = await visit(child);
      }
      return result;
    }
    return item;
  }
  return await visit(value) as T;
}
