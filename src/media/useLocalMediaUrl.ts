import { useEffect, useState } from 'react';
import { isLocalMediaUrl, loadLocalMediaBlob } from './localMedia';

/** Convierte una referencia persistente de IndexedDB en una URL visible por el navegador. */
export function useLocalMediaUrl(reference: string | null | undefined): string | undefined {
  const [resolved, setResolved] = useState<string | undefined>(() => (
    reference && !isLocalMediaUrl(reference) ? reference : undefined
  ));

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    if (!reference) {
      setResolved(undefined);
      return () => { active = false; };
    }
    if (!isLocalMediaUrl(reference)) {
      setResolved(reference);
      return () => { active = false; };
    }

    setResolved(undefined);
    void loadLocalMediaBlob(reference).then((blob) => {
      if (!active || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setResolved(objectUrl);
    });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [reference]);

  return resolved;
}
