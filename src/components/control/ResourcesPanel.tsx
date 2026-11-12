import { useState, type FormEvent } from 'react';
import { useLocalMediaUrl } from '../../media/useLocalMediaUrl';
import { RESOURCE_CATEGORIES, type MediaResource, type ResourceCategory, type ResourceFilter } from '../../resources/model';
import { useResourceLibrary } from '../../resources/ResourceLibrary';
import { toast } from '../../store/toastStore';
import { useStore } from '../../store/useStore';
import { ResourceUploadForm } from './ResourceUploadForm';

const FILTERS = [{ id: 'all', label: 'Todos' }, ...RESOURCE_CATEGORIES] as const;
const kindLabel = { image: 'Imagen', video: 'Video' };
const sizeFormat = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormat.format(bytes / 1024)} KB`;
  return `${sizeFormat.format(bytes / (1024 * 1024))} MB`;
}

export function ResourceCategories({ category, onChange }: { category: ResourceFilter; onChange: (value: ResourceFilter) => void }) {
  const { items } = useResourceLibrary();
  return (
    <nav aria-label="Categorías de recursos" className="space-y-2 p-3">
      <p className="label px-2">Categorías</p>
      <div className="flex flex-wrap gap-1 md:grid">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            aria-pressed={category === item.id}
            onClick={() => onChange(item.id)}
            className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${category === item.id
              ? 'bg-accent/20 text-white' : 'text-white/70 hover:bg-white/5'}`}
          >
            {item.label}
            <span className="text-xs text-white/55">{item.id === 'all' ? items.length : items.filter((resource) => resource.category === item.id).length}</span>
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
  const { items, loading, error, local } = useResourceLibrary();
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((item) => item.id === selectedId && (category === 'all' || item.category === category));
  const matching = items.filter((item) => item.title.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')));
  const groups = RESOURCE_CATEGORIES.filter((item) => category === 'all' || item.id === category);
  const hasResults = matching.some((item) => category === 'all' || item.category === category);

  return (
    <div className="h-full space-y-5 overflow-y-auto p-4 lg:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Biblioteca de recursos</h2>
          <p className="mt-1 text-xs text-white/60">{local ? 'Los recursos se guardan en este dispositivo.' : 'Imágenes y videos para proyectar o usar como fondo.'}</p>
        </div>
        {!uploading && (
          <button className="btn-accent" onClick={() => setUploading(true)}>+ Subir archivo</button>
        )}
      </header>
      {uploading && (
        <ResourceUploadForm
          category={category === 'all' ? 'general' : category}
          onCancel={() => setUploading(false)}
          onUploaded={(item) => {
            setUploading(false);
            setQuery('');
            setSelectedId(item.id);
            if (category !== 'all') onCategoryChange(item.category);
            toast.success('Recurso guardado.');
          }}
        />
      )}
      {error && <p role="alert" className="rounded-lg bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
      {loading && <p role="status" className="text-sm text-white/60">Cargando recursos…</p>}
      {selected ? (
        <ResourceDetail
          key={selected.id}
          resource={selected}
          onClose={() => setSelectedId(null)}
          onCategoryChange={(next) => { if (category !== 'all') onCategoryChange(next); }}
        />
      ) : (
        <>
          <input
            type="search"
            aria-label="Buscar recursos"
            placeholder="Buscar por nombre"
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {!loading && !hasResults && (
            <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/65">
              {query ? 'No hay recursos con ese nombre.' : 'Todavía no hay recursos en esta categoría.'}
            </div>
          )}
          {groups.map((group) => {
            const resources = matching.filter((item) => item.category === group.id);
            if (!resources.length) return null;
            return (
              <section key={group.id} className="space-y-2">
                <h3 className="text-sm font-semibold">{group.label} <span className="ml-1 text-xs font-normal text-white/55">{resources.length}</span></h3>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,140px),1fr))] gap-3">
                  {resources.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className="overflow-hidden rounded-xl border border-white/10 bg-white/[.04] text-left transition hover:border-accent/60"
                    >
                      <ResourceMedia resource={item} compact />
                      <span className="block truncate px-3 pt-2 text-sm font-medium">{item.title}</span>
                      <span className="block px-3 pb-3 pt-1 text-xs text-white/55">{kindLabel[item.kind]}</span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

function ResourceDetail({ resource, onClose, onCategoryChange }: {
  resource: MediaResource;
  onClose: () => void;
  onCategoryChange: (value: ResourceCategory) => void;
}) {
  const { repo, items } = useResourceLibrary();
  const goLive = useStore((state) => state.goLiveResource);
  const clearLive = useStore((state) => state.clearLive);
  const live = useStore((state) => state.live.resource?.id === resource.id && !state.live.blackout);
  const [title, setTitle] = useState(resource.title);
  const [category, setCategory] = useState(resource.category);
  const [busy, setBusy] = useState(false);
  const group = items.filter((item) => item.category === resource.category);
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
      await repo.update(resource.id, { title: title.trim(), category });
      onCategoryChange(category);
      toast.success('Recurso actualizado.');
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/[.035] p-4">
      <button className="btn-ghost !px-2 !py-1" onClick={onClose}>← Volver a la biblioteca</button>
      <ResourceMedia key={resource.url} resource={resource} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-semibold">{resource.title}</h3>
          <p className="text-xs text-white/55">{kindLabel[resource.kind]} · {formatSize(resource.size)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {resource.kind === 'video' && <span className="text-xs text-white/55">Salida sin audio</span>}
          <button className="btn-accent" onClick={() => goLive(resource)}>{live ? 'Volver a proyectar' : 'Proyectar recurso'}</button>
          {live && <button className="btn-soft xl:hidden" onClick={clearLive}>Retirar de la salida</button>}
        </div>
      </div>
      <form onSubmit={save} className="space-y-3 border-t border-white/10 pt-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="min-w-0">
            <span className="label">Nombre</span>
            <input className="input" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            <span className="label">Categoría</span>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ResourceCategory)}>
              {RESOURCE_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1" aria-label="Orden en su categoría">
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
          <button type="submit" className="btn-soft" disabled={!repo || busy || !title.trim() || (title.trim() === resource.title && category === resource.category)}>
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}

function ResourceMedia({ resource, compact = false }: { resource: MediaResource; compact?: boolean }) {
  const url = useLocalMediaUrl(compact && resource.kind === 'video' ? undefined : resource.url);
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative grid aspect-video w-full place-items-center overflow-hidden rounded-md bg-black" aria-label={compact ? undefined : 'Vista previa del recurso'}>
      {failed ? <span className="p-3 text-center text-xs text-white/60">No se pudo cargar la vista previa.</span>
        : resource.kind === 'image' && url ? (
          <img src={url} alt={compact ? '' : resource.title} loading={compact ? 'lazy' : 'eager'} className={`absolute h-full w-full ${compact ? 'object-cover' : 'object-contain'}`} onError={() => setFailed(true)} />
        ) : resource.kind === 'video' && url && !compact ? (
          <video src={url} controls playsInline preload="metadata" className="absolute h-full w-full object-contain" onError={() => setFailed(true)} />
        ) : <span className="text-xs text-white/65">{compact && resource.kind === 'video' ? '▶ Video' : 'Cargando…'}</span>}
    </div>
  );
}
