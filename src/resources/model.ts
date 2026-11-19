import type { BackgroundConfig } from '../types';

export const RESOURCE_CATEGORIES = [
  { id: 'intro', label: 'Intro' },
  { id: 'general', label: 'Recursos' },
  { id: 'announcements', label: 'Anuncios' },
  { id: 'outro', label: 'Cierre' },
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number]['id'];
export type ResourceFilter = 'all' | ResourceCategory;

export interface ResourceFolder {
  id: string;
  name: string;
  createdAt: number;
  deleting?: boolean;
}

export const RESOURCE_NAME_LIMIT = 120;

export interface MediaResource {
  id: string;
  title: string;
  kind: 'image' | 'video';
  category: ResourceCategory;
  folderId?: string | null;
  mimeType: string;
  size: number;
  url: string;
  position: number;
  createdAt: number;
}

export const RESOURCE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,video/mp4,video/webm';
export const RESOURCE_SIZE_LIMITS = { image: 25, video: 250 } as const;
export const RESOURCE_KIND_LABELS = { image: 'Imagen', video: 'Video' } as const;

const sizeFormat = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });

export function formatResourceSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormat.format(bytes / 1024)} KB`;
  return `${sizeFormat.format(bytes / (1024 * 1024))} MB`;
}

export function validateResource(file: File) {
  const mimeType = file.type;
  if (!RESOURCE_ACCEPT.split(',').includes(mimeType)) {
    throw new Error('Selecciona una imagen JPG, PNG, WebP, GIF, AVIF o SVG, o un video MP4 o WebM.');
  }
  const kind = mimeType.startsWith('video/') ? 'video' : 'image';
  const limit = RESOURCE_SIZE_LIMITS[kind];
  if (!file.size) throw new Error('El archivo está vacío.');
  if (file.size > limit * 1024 * 1024) throw new Error(`El tamaño máximo es de ${limit} MB.`);
  return { kind, mimeType } as const;
}

export function resourceBackground(
  resource: MediaResource,
  fit: 'cover' | 'contain' = 'cover',
  loop = true,
): BackgroundConfig {
  return resource.kind === 'video'
    ? { kind: 'video', url: resource.url, fit, loop }
    : { kind: 'image', url: resource.url, fit };
}

export function compareResources(a: MediaResource, b: MediaResource): number {
  return a.position - b.position || a.createdAt - b.createdAt || a.id.localeCompare(b.id);
}
