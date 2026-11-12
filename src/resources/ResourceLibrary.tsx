import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { compareResources, type MediaResource } from './model';
import { createResourceRepository, type ResourceRepository } from './repository';

interface ResourceLibrary {
  items: MediaResource[];
  repo: ResourceRepository | null;
  loading: boolean;
  error: string | null;
  local: boolean;
}

const LibraryContext = createContext<ResourceLibrary>({ items: [], repo: null, loading: false, error: null, local: false });

export function ResourceLibraryProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  const repo = useMemo(() => userId ? createResourceRepository(userId) : null, [userId]);
  const [items, setItems] = useState<MediaResource[]>([]);
  const [loading, setLoading] = useState(Boolean(repo));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repo) return;
    return repo.subscribe(
      (resources) => {
        setItems(resources.sort(compareResources));
        setError(null);
        setLoading(false);
      },
      () => {
        setError('No se pudo cargar la biblioteca de recursos. Revisa tu conexión y vuelve a abrir la aplicación.');
        setLoading(false);
      },
    );
  }, [repo]);

  return (
    <LibraryContext.Provider value={{ items, repo, loading, error, local: userId === 'local' }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useResourceLibrary() {
  return useContext(LibraryContext);
}
