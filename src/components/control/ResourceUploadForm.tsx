import { useRef, useState, type FormEvent } from 'react';
import { resourceUploadErrorMessage } from '../../lib/userFacingError';
import { RESOURCE_ACCEPT, RESOURCE_CATEGORIES, validateResource, type MediaResource, type ResourceCategory } from '../../resources/model';
import { useResourceLibrary } from '../../resources/ResourceLibrary';

export function ResourceUploadForm({ category: initialCategory, onUploaded, onCancel }: {
  category: ResourceCategory;
  onUploaded: (resource: MediaResource) => void;
  onCancel: () => void;
}) {
  const { repo, local } = useResourceLibrary();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploading = useRef(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || !repo || uploading.current) return;
    uploading.current = true;
    setProgress(0);
    setError(null);
    try {
      const resource = await repo.upload(file, { title, category }, setProgress);
      onUploaded(resource);
    } catch (error) {
      setError(resourceUploadErrorMessage(error));
    } finally {
      uploading.current = false;
      setProgress(null);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-white/10 bg-white/[.035] p-4">
      <label className="block">
        <span className="label">Archivo</span>
        <input
          className="input text-xs file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-white"
          type="file"
          accept={RESOURCE_ACCEPT}
          disabled={progress !== null}
          onChange={(event) => {
            const next = event.currentTarget.files?.[0];
            if (!next) return;
            try {
              validateResource(next);
              setFile(next);
              setTitle(next.name.replace(/\.[^.]+$/, '').slice(0, 120));
              setError(null);
            } catch (error) {
              setFile(null);
              event.currentTarget.value = '';
              setError(error instanceof Error ? error.message : 'Archivo inválido.');
            }
          }}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="min-w-0">
          <span className="label">Nombre del recurso</span>
          <input className="input" value={title} maxLength={120} disabled={progress !== null} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          <span className="label">Categoría</span>
          <select className="input" value={category} disabled={progress !== null} onChange={(e) => setCategory(e.target.value as ResourceCategory)}>
            {RESOURCE_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>
      <p className="text-xs text-white/55">Imágenes hasta 25 MB · MP4 o WebM hasta 250 MB</p>
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      {progress !== null && (
        <div role="status" className="space-y-1 text-xs text-white/70">
          <p>{progress < 99 ? `Guardando archivo… ${progress} %` : 'Guardando en la biblioteca…'}</p>
          <progress className="w-full accent-accent" value={progress} max={100} />
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-ghost" disabled={progress !== null} onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-accent" disabled={!repo || !file || progress !== null}>
          {local ? 'Guardar recurso' : 'Subir recurso'}
        </button>
      </div>
    </form>
  );
}
