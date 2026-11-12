import { useEffect, useState } from 'react';
import { isLocalMediaUrl, loadLocalMediaBlob } from './localMedia';

/** Convierte una referencia persistente de IndexedDB en una URL visible por el navegador. */
export function useLocalMediaUrl(reference: string | null | undefined): string | undefined {
  const [resolved, setResolved] = useState<{ reference: string; url: string }>();

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    if (!isLocalMediaUrl(reference)) return;

    setResolved(undefined);
    void loadLocalMediaBlob(reference).then((blob) => {
      if (!active || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setResolved({ reference, url: objectUrl });
    }).catch(() => {});

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [reference]);

  return isLocalMediaUrl(reference)
    ? (resolved?.reference === reference ? resolved?.url : undefined)
    : reference ?? undefined;
}
