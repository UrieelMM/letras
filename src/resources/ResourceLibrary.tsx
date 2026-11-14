import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { compareResources, type MediaResource, type ResourceFolder } from './model';
import { createResourceRepository, type ResourceRepository } from './repository';
import { useStore } from '../store/useStore';

interface ResourceLibrary {
  items: MediaResource[];
  folders: ResourceFolder[];
  repo: ResourceRepository | null;
  loading: boolean;
  error: string | null;
  local: boolean;
}

const LibraryContext = createContext<ResourceLibrary>({ items: [], folders: [], repo: null, loading: false, error: null, local: false });

export function ResourceLibraryProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  const repo = useMemo(() => userId ? createResourceRepository(userId) : null, [userId]);
  const [items, setItems] = useState<MediaResource[]>([]);
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [itemsStatus, setItemsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [foldersStatus, setFoldersStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!repo) return;
    let previousIds = new Set<string>();
    const unsubscribeItems = repo.subscribe(
      (resources) => {
        const nextIds = new Set(resources.map(({ id }) => id));
        const state = useStore.getState();
        const liveId = state.live.resource?.id;
        if (liveId && previousIds.has(liveId) && !nextIds.has(liveId)) state.clearLive();
        previousIds = nextIds;
        setItems(resources.sort(compareResources));
        setItemsStatus('ready');
      },
      () => setItemsStatus('error'),
    );
    const unsubscribeFolders = repo.subscribeFolders(
      (next) => {
        setFolders(next.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })));
        setFoldersStatus('ready');
      },
      () => setFoldersStatus('error'),
    );
    return () => {
      unsubscribeItems();
      unsubscribeFolders();
    };
  }, [repo]);

  const loading = Boolean(repo) && (itemsStatus === 'loading' || foldersStatus === 'loading');
  const error = itemsStatus === 'error' || foldersStatus === 'error'
    ? 'No se pudo cargar toda la biblioteca de recursos. Vuelve a abrir la aplicación para reintentar.'
    : null;

  return (
    <LibraryContext.Provider value={{ items, folders, repo, loading, error, local: userId === 'local' }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useResourceLibrary() {
  return useContext(LibraryContext);
}
