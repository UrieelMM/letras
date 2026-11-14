import { useState, type FormEvent, type ReactNode } from 'react';
import { useLocalMediaUrl } from '../../media/useLocalMediaUrl';
import {
  formatResourceSize, RESOURCE_CATEGORIES, RESOURCE_KIND_LABELS, RESOURCE_NAME_LIMIT,
  type MediaResource, type ResourceCategory, type ResourceFilter, type ResourceFolder,
} from '../../resources/model';
import { useResourceLibrary } from '../../resources/ResourceLibrary';
import { toast } from '../../store/toastStore';
import { useStore } from '../../store/useStore';
import { ConfirmModal } from '../ConfirmModal';
import { ResourceIcon } from './ResourceIcon';
import { ResourceUploadForm } from './ResourceUploadForm';

const FILTERS = [{ id: 'all', label: 'Todas' }, ...RESOURCE_CATEGORIES] as const;
const FOLDERS_PER_PAGE = 6;
const FILES_PER_PAGE = 12;

function searchText(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');
}

function fileCount(count: number) {
  return `${count} ${count === 1 ? 'archivo' : 'archivos'}`;
}

export function ResourceCategories({ category, onChange }: { category: ResourceFilter; onChange: (value: ResourceFilter) => void }) {
  const { items } = useResourceLibrary();
  return (
    <nav aria-label="Categorías de recursos" className="space-y-2 p-2 md:p-3">
      <p className="label hidden px-2 md:block">Categorías</p>
      <div className="flex gap-1 overflow-x-auto md:grid">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            aria-pressed={category === item.id}
            onClick={() => onChange(item.id)}
            className={`flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition md:text-sm ${category === item.id
              ? 'bg-accent/15 text-white ring-1 ring-inset ring-accent/25' : 'text-white/65 hover:bg-white/5 hover:text-white'}`}
          >
            {item.label}
            <span className="rounded-md bg-white/[.06] px-1.5 py-0.5 text-xs tabular-nums text-white/65">{item.id === 'all' ? items.length : items.filter((resource) => resource.category === item.id).length}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export function ResourcesPanel({ category, onCategoryChange }: {
  category: ResourceFilter;
  onCategoryChange: (value: ResourceFilter) => void;
}) {
  const { items, folders, repo, loading, error, local } = useResourceLibrary();
  const [folderId, setFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | MediaResource['kind']>('all');
  const [unfiled, setUnfiled] = useState(false);
  const [editor, setEditor] = useState<'upload' | 'create' | 'rename' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deletion, setDeletion] = useState<{ folder: ResourceFolder } | { resource: MediaResource } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const folder = folders.find((item) => item.id === folderId);
  const selected = items.find((item) => item.id === selectedId && (category === 'all' || item.category === category));
  const names = new Map(folders.map((item) => [item.id, item.name]));
  const search = searchText(query.trim());
  const filteredItems = items.filter((item) => (category === 'all' || item.category === category) && (kind === 'all' || item.kind === kind));
  const counts = new Map<string, number>();
  for (const item of filteredItems) {
    if (item.folderId) counts.set(item.folderId, (counts.get(item.folderId) ?? 0) + 1);
  }
  const matchingFolders = !folderId && !unfiled ? folders.filter((item) =>
    searchText(item.name).includes(search) && ((category === 'all' && kind === 'all') || counts.has(item.id)),
  ) : [];
  const matchingItems = filteredItems.filter((item) => {
    if (folderId && item.folderId !== folderId) return false;
    if (!folderId && unfiled && item.folderId && names.has(item.folderId)) return false;
    return searchText(item.title).includes(search);
  });
  const pageKey = JSON.stringify([folderId, category, kind, unfiled, search]);
  const filtered = Boolean(search || kind !== 'all' || category !== 'all' || unfiled);
  const deletingFolder = deletion && 'folder' in deletion ? deletion.folder : null;
  const deletingFile = deletion && 'resource' in deletion ? deletion.resource : null;

  function openFolder(next: string | null) {
    setFolderId(next);
    setQuery('');
    setUnfiled(false);
    setSelectedId(null);
    setEditor(null);
  }

  function resetFilters() {
    setQuery('');
    setKind('all');
    setUnfiled(false);
    onCategoryChange('all');
  }

  function askToDelete(target: NonNullable<typeof deletion>) {
    setDeleteError(null);
    setDeletion(target);
  }

  async function confirmDeletion() {
    if (!repo || !deletion || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      if ('folder' in deletion) {
        await repo.deleteFolder(deletion.folder.id);
        openFolder(null);
        toast.success('Carpeta eliminada.');
      } else {
        await repo.deleteResource(deletion.resource);
        setSelectedId(null);
        toast.success('Archivo eliminado.');
      }
      setDeletion(null);
    } catch {
      setDeleteError('No se completó la eliminación. Revisa la conexión y vuelve a intentarlo.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,rgba(124,92,255,.09),transparent_48%)]">
      <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Biblioteca de recursos</h2>
            {local && <p className="mt-1 text-xs text-white/55">Almacenamiento en este dispositivo</p>}
            {!local && <p className="mt-1 text-xs text-white/55">Compartida con todas las cuentas</p>}
          </div>
          {!selected && (
            <div className="flex flex-wrap gap-2">
              <button className="btn-soft border border-white/10" disabled={!repo || editor !== null} onClick={() => setEditor('create')}>
                <ResourceIcon name="folderPlus" className="h-4 w-4" /> Nueva carpeta
              </button>
              <button className="btn-accent" disabled={!repo || editor !== null || Boolean(folderId && (!folder || folder.deleting))} onClick={() => setEditor('upload')}>
                <ResourceIcon name="upload" className="h-4 w-4" /> Subir archivos
              </button>
            </div>
          )}
        </header>
        {error && <p role="alert" className="rounded-lg bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
        {loading && <p role="status" className="text-sm text-white/60">Cargando recursos…</p>}

        {selected && (
          <ResourceDetail
            key={selected.id}
            resource={selected}
            onClose={() => setSelectedId(null)}
            onDelete={() => askToDelete({ resource: selected })}
            onSaved={(nextCategory, nextFolder) => {
              if (category !== 'all') onCategoryChange(nextCategory);
              if (nextFolder !== folderId && (folderId || unfiled)) openFolder(nextFolder);
            }}
          />
        )}
        <div hidden={Boolean(selected)} className="space-y-5">
          {folderId && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[.03] p-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                <button className="btn-ghost !px-2 !py-1.5" disabled={editor !== null} onClick={() => openFolder(null)}>
                  <ResourceIcon name="left" className="h-4 w-4" /> Biblioteca
                </button>
                <span aria-hidden="true" className="text-white/35">/</span>
                <h3 className="flex min-w-0 items-center gap-2 font-semibold">
                  <ResourceIcon name="folder" className="h-4 w-4 text-accent-soft" />
                  <span className="min-w-0 break-words">{folder?.name ?? 'Carpeta'}</span>
                </h3>
              </div>
              {folder && (
                <div className="flex flex-wrap gap-1">
                  {!folder.deleting && <button className="btn-ghost !py-1.5" disabled={editor !== null} onClick={() => setEditor('rename')}>Renombrar</button>}
                  <button className="btn-ghost !py-1.5 !text-red-300 hover:!bg-red-500/10" disabled={!repo || editor !== null} onClick={() => askToDelete({ folder })}>
                    <ResourceIcon name="trash" className="h-4 w-4" />
                    {folder.deleting ? 'Completar eliminación' : 'Eliminar carpeta'}
                  </button>
                </div>
              )}
            </div>
          )}

          {editor === 'upload' && (
            <ResourceUploadForm
              multiple
              category={category === 'all' ? 'general' : category}
              folderId={folderId}
              onCancel={() => setEditor(null)}
              onUploaded={(resources) => {
                openFolder(resources[resources.length - 1]?.folderId ?? null);
                resetFilters();
                toast.success(resources.length === 1 ? 'Recurso guardado.' : `${fileCount(resources.length)} guardados.`);
              }}
            />
          )}
          {(editor === 'create' || (editor === 'rename' && folder)) && (
            <FolderForm
              folder={editor === 'rename' ? folder : undefined}
              onCancel={() => setEditor(null)}
              onSaved={(saved) => {
                setEditor(null);
                if (editor === 'create') {
                  openFolder(saved.id);
                  resetFilters();
                }
                toast.success(editor === 'create' ? 'Carpeta creada.' : 'Carpeta renombrada.');
              }}
            />
          )}

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-ink-800/70 p-2">
            <div className="relative min-w-[min(100%,13rem)] flex-1">
              <ResourceIcon name="search" className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-white/50" />
              <input
                type="search"
                aria-label={folderId ? 'Buscar archivos' : 'Buscar carpetas y archivos'}
                placeholder={folderId ? 'Buscar archivos…' : 'Buscar carpetas y archivos…'}
                className="input !pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            {!folderId && (
              <select aria-label="Ubicación" className="input !w-auto max-w-full" value={unfiled ? 'unfiled' : 'all'} onChange={(event) => setUnfiled(event.target.value === 'unfiled')}>
                <option value="all">Todas las ubicaciones</option>
                <option value="unfiled">Sin carpeta</option>
              </select>
            )}
            <select aria-label="Tipo de archivo" className="input !w-auto max-w-full" value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>
              <option value="all">Todos los formatos</option>
              <option value="image">Imágenes</option>
              <option value="video">Videos</option>
            </select>
            {filtered && <button className="btn-ghost" onClick={resetFilters}>Limpiar filtros</button>}
          </div>

          {matchingFolders.length > 0 && (
            <ResourcePages key={`folders${pageKey}`} title="Carpetas" items={matchingFolders} pageSize={FOLDERS_PER_PAGE}>
              {(item) => (
                <button
                  key={item.id}
                  onClick={() => openFolder(item.id)}
                  disabled={editor !== null}
                  className="group flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-ink-800/80 p-3 text-left transition hover:border-accent/55 hover:bg-ink-700 focus-visible:ring-2 focus-visible:ring-accent-soft disabled:opacity-60"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent-soft"><ResourceIcon name="folder" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold" title={item.name}>{item.name}</span>
                    <span className="mt-1 block text-xs text-white/60">{fileCount(counts.get(item.id) ?? 0)}</span>
                  </span>
                  <ResourceIcon name="right" className="h-4 w-4 text-white/40 transition group-hover:text-accent-soft" />
                </button>
              )}
            </ResourcePages>
          )}
          {matchingItems.length > 0 && (
            <ResourcePages key={`files${pageKey}`} title="Archivos" items={matchingItems} pageSize={FILES_PER_PAGE}>
              {(item) => (
                <button
                  key={item.id}
                  disabled={editor !== null}
                  onClick={() => setSelectedId(item.id)}
                  className="group min-w-0 overflow-hidden rounded-xl border border-white/10 bg-ink-800/80 p-1 text-left transition hover:border-accent/60 hover:bg-ink-700 focus-visible:ring-2 focus-visible:ring-accent-soft disabled:opacity-60"
                >
                  <ResourceMedia resource={item} compact />
                  <span className="block truncate px-2 pt-2 text-sm font-semibold" title={item.title}>{item.title}</span>
                  <span className="block truncate px-2 pb-2 pt-1 text-xs text-white/60">
                    {RESOURCE_KIND_LABELS[item.kind]} · {folderId ? formatResourceSize(item.size) : names.get(item.folderId ?? '') ?? 'Sin carpeta'}
                  </span>
                </button>
              )}
            </ResourcePages>
          )}
          {!loading && !error && !matchingFolders.length && !matchingItems.length && (
            <div className="grid justify-items-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[.02] p-8 text-center">
              <ResourceIcon name={filtered ? 'search' : 'folder'} className="h-8 w-8 text-accent-soft" />
              <p className="mt-1 text-sm font-semibold">{filtered ? 'No hay coincidencias' : folderId ? 'Esta carpeta está vacía' : 'La biblioteca está vacía'}</p>
              {filtered && <p className="text-xs text-white/65">Prueba con otro nombre o limpia los filtros.</p>}
            </div>
          )}
        </div>
        <ConfirmModal
          open={deletion !== null}
          destructive
          busy={deleting}
          error={deleteError}
          title={deletingFolder ? 'Eliminar carpeta' : 'Eliminar archivo'}
          description={deletingFolder
            ? `Se eliminará “${deletingFolder.name}” junto con todos sus archivos. ${local ? '' : 'El cambio se aplica a todas las cuentas. '}Los archivos usados como fondo dejarán de estar disponibles.`
            : deletingFile
              ? `Se eliminará “${deletingFile.title}”. ${local ? '' : 'El cambio se aplica a todas las cuentas. '}Si se usa como fondo, dejará de estar disponible. Esta acción es permanente.`
              : ''}
          confirmLabel={deletingFolder ? 'Eliminar carpeta' : 'Eliminar archivo'}
          onCancel={() => setDeletion(null)}
          onConfirm={() => void confirmDeletion()}
        />
      </div>
    </div>
  );
}

function ResourcePages<T>({ title, items, pageSize, children }: {
  title: string;
  items: T[];
  pageSize: number;
  children: (item: T) => ReactNode;
}) {
  const [requestedPage, setPage] = useState(1);
  const pageCount = Math.ceil(items.length / pageSize);
  const page = Math.min(requestedPage, pageCount);
  const offset = (page - 1) * pageSize;
  const columns = title === 'Carpetas' ? 'grid-cols-[repeat(auto-fill,minmax(min(100%,185px),1fr))]' : 'grid-cols-[repeat(auto-fill,minmax(min(100%,152px),1fr))]';
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        {title} <span className="rounded-md bg-white/[.07] px-1.5 py-0.5 text-xs font-normal tabular-nums text-white/65">{items.length}</span>
      </h3>
      <div className={`grid gap-3 ${columns}`}>{items.slice(offset, offset + pageSize).map(children)}</div>
      {pageCount > 1 && (
        <nav aria-label={`Páginas de ${title.toLowerCase()}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-ink-800/60 px-3 py-2">
          <p aria-live="polite" className="text-xs tabular-nums text-white/65">{offset + 1}–{Math.min(offset + pageSize, items.length)} de {items.length}</p>
          <div className="flex items-center gap-1">
            <button className="btn-soft !p-2" aria-label="Página anterior" disabled={page === 1} onClick={() => setPage(page - 1)}><ResourceIcon name="left" className="h-4 w-4" /></button>
            <span className="px-2 text-xs tabular-nums text-white/75">{page} / {pageCount}</span>
            <button className="btn-soft !p-2" aria-label="Página siguiente" disabled={page === pageCount} onClick={() => setPage(page + 1)}><ResourceIcon name="right" className="h-4 w-4" /></button>
          </div>
        </nav>
      )}
    </section>
  );
}

function FolderForm({ folder, onCancel, onSaved }: {
  folder?: ResourceFolder;
  onCancel: () => void;
  onSaved: (folder: ResourceFolder) => void;
}) {
  const { repo } = useResourceLibrary();
  const [name, setName] = useState(folder?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextName = name.trim();
    if (!repo || !nextName || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (folder) {
        await repo.renameFolder(folder.id, nextName);
        onSaved({ ...folder, name: nextName });
      } else {
        onSaved(await repo.createFolder(nextName));
      }
    } catch {
      setError('No se pudo guardar la carpeta. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-white/10 bg-ink-800 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold"><ResourceIcon name="folder" className="h-4 w-4 text-accent-soft" /> {folder ? 'Renombrar carpeta' : 'Nueva carpeta'}</h3>
      <label className="block">
        <span className="label">Nombre de la carpeta</span>
        <input autoFocus className="input" placeholder="Ej. Reuniones del domingo" maxLength={RESOURCE_NAME_LIMIT} value={name} disabled={saving} onChange={(event) => setName(event.target.value)} />
      </label>
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" disabled={saving} onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-accent" disabled={!repo || !name.trim() || name.trim() === folder?.name || saving}>
          {saving ? 'Guardando…' : folder ? 'Guardar nombre' : 'Crear carpeta'}
        </button>
      </div>
    </form>
  );
}

function ResourceDetail({ resource, onClose, onDelete, onSaved }: {
  resource: MediaResource;
  onClose: () => void;
  onDelete: () => void;
  onSaved: (category: ResourceCategory, folderId: string | null) => void;
}) {
  const { repo, items, folders } = useResourceLibrary();
  const goLive = useStore((state) => state.goLiveResource);
  const clearLive = useStore((state) => state.clearLive);
  const live = useStore((state) => state.live.resource?.id === resource.id && !state.live.blackout);
  const [title, setTitle] = useState(resource.title);
  const [category, setCategory] = useState(resource.category);
  const [folderId, setFolderId] = useState(resource.folderId ?? '');
  const [busy, setBusy] = useState(false);
  const group = items.filter((item) => item.category === resource.category && (item.folderId ?? null) === (resource.folderId ?? null));
  const index = group.findIndex((item) => item.id === resource.id);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try { await action(); }
    catch { toast.error('No se pudo guardar el cambio. Inténtalo de nuevo.'); }
    finally { setBusy(false); }
  }

  function save(event: FormEvent) {
    event.preventDefault();
    if (!repo || !title.trim() || busy) return;
    void run(async () => {
      await repo.update(resource.id, { title: title.trim(), category, folderId: folderId || null });
      onSaved(category, folderId || null);
      toast.success('Recurso actualizado.');
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-ink-800/80 p-4 sm:p-5">
      <button className="btn-ghost !px-2 !py-1" onClick={onClose}><ResourceIcon name="left" className="h-4 w-4" /> Volver a los archivos</button>
      <ResourceMedia key={resource.url} resource={resource} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-semibold">{resource.title}</h3>
          <p className="text-xs text-white/60">{RESOURCE_KIND_LABELS[resource.kind]} · {formatResourceSize(resource.size)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {resource.kind === 'video' && <span className="text-xs text-white/55">Salida sin audio</span>}
          <button className="btn-accent" onClick={() => goLive(resource)}>{live ? 'Volver a proyectar' : 'Proyectar recurso'}</button>
          {live && <button className="btn-soft xl:hidden" onClick={clearLive}>Retirar de la salida</button>}
        </div>
      </div>
      <form onSubmit={save} className="space-y-3 border-t border-white/10 pt-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="min-w-0">
            <span className="label">Nombre</span>
            <input className="input" maxLength={RESOURCE_NAME_LIMIT} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            <span className="label">Carpeta</span>
            <select className="input" value={folderId} onChange={(event) => setFolderId(event.target.value)}>
              <option value="">Sin carpeta</option>
              {folders.map((folder) => <option key={folder.id} value={folder.id} disabled={folder.deleting}>{folder.name}</option>)}
            </select>
          </label>
          <label>
            <span className="label">Categoría</span>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ResourceCategory)}>
              {RESOURCE_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1" aria-label="Orden en su categoría y carpeta">
            {([-1, 1] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                className="btn-soft !px-2 !py-1 text-xs"
                disabled={!repo || busy || !group[index + direction]}
                onClick={() => { if (repo) void run(() => repo.swap(resource, group[index + direction])); }}
              >
                {direction === -1 ? '↑ Subir posición' : '↓ Bajar posición'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-ghost !text-red-300 hover:!bg-red-500/10" disabled={!repo || busy} onClick={onDelete}>
              <ResourceIcon name="trash" className="h-4 w-4" /> Eliminar archivo
            </button>
            <button type="submit" className="btn-soft" disabled={!repo || busy || !title.trim() || (title.trim() === resource.title && category === resource.category && folderId === (resource.folderId ?? ''))}>
              Guardar cambios
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ResourceMedia({ resource, compact = false }: { resource: MediaResource; compact?: boolean }) {
  const url = useLocalMediaUrl(compact && resource.kind === 'video' ? undefined : resource.url);
  const [failed, setFailed] = useState(false);
  return (
    <div className={`relative grid aspect-video w-full place-items-center overflow-hidden rounded-lg ${compact ? 'bg-gradient-to-br from-accent/20 via-ink-700 to-ink-900' : 'bg-black'}`} aria-label={compact ? undefined : 'Vista previa del recurso'}>
      {failed ? <span className="p-3 text-center text-xs text-white/60">No se pudo cargar la vista previa.</span>
        : resource.kind === 'image' && url ? (
          <img src={url} alt={compact ? '' : resource.title} loading={compact ? 'lazy' : 'eager'} className={`absolute h-full w-full ${compact ? 'object-cover' : 'object-contain'}`} onError={() => setFailed(true)} />
        ) : resource.kind === 'video' && url && !compact ? (
          <video src={url} controls playsInline preload="metadata" className="absolute h-full w-full object-contain" onError={() => setFailed(true)} />
        ) : compact && resource.kind === 'video'
          ? <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/25 text-white/75"><ResourceIcon name="video" /></span>
          : <span className="text-xs text-white/65">Cargando…</span>}
    </div>
  );
}
