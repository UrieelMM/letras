import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { auth, fbStorage } from './config';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function uploadThemeImage(file: File, onProgress?: (progress: number) => void) {
  if (!fbStorage || !auth?.currentUser) {
    throw new Error('Debes iniciar sesión para subir imágenes.');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen válido.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('La imagen no puede pesar más de 10 MB.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'image';
  const objectName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const objectRef = ref(
    fbStorage,
    `users/${auth.currentUser.uid}/theme-backgrounds/${objectName}`,
  );
  const task = uploadBytesResumable(objectRef, file, {
    contentType: file.type,
    customMetadata: { originalName: file.name },
  });

  return new Promise<string>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const progress = snapshot.totalBytes
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          : 0;
        onProgress?.(progress);
      },
      reject,
      () => getDownloadURL(task.snapshot.ref).then(resolve, reject),
    );
  });
}

export function uploadBrandLogo(file: File, onProgress?: (progress: number) => void) {
  if (!fbStorage || !auth?.currentUser) {
    throw new Error('Debes iniciar sesión para subir un logo.');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen válido.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('El logo no puede pesar más de 5 MB.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'image';
  const objectName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const objectRef = ref(
    fbStorage,
    `users/${auth.currentUser.uid}/branding/${objectName}`,
  );
  const task = uploadBytesResumable(objectRef, file, {
    contentType: file.type,
    customMetadata: { originalName: file.name, assetType: 'projection-logo' },
  });

  return new Promise<string>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const progress = snapshot.totalBytes
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          : 0;
        onProgress?.(progress);
      },
      reject,
      () => getDownloadURL(task.snapshot.ref).then(resolve, reject),
    );
  });
}
