import { useId, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { resourceUploadErrorMessage } from '../../lib/userFacingError';
import {
  formatResourceSize, RESOURCE_ACCEPT, RESOURCE_CATEGORIES, RESOURCE_NAME_LIMIT,
  RESOURCE_SIZE_LIMITS, validateResource, type MediaResource, type ResourceCategory,
} from '../../resources/model';
import { useResourceLibrary } from '../../resources/ResourceLibrary';
import { ResourceIcon } from './ResourceIcon';

interface QueuedFile {
  id: string;
  file: File;
  title: string;
  kind: MediaResource['kind'];
  error?: string;
}

export function ResourceUploadForm({ category: initialCategory, folderId: initialFolderId = null, multiple = false, onUploaded, onCancel }: {
  category: ResourceCategory;
  folderId?: string | null;
  multiple?: boolean;
  onUploaded: (resources: MediaResource[]) => void;
  onCancel: () => void;
}) {
  const { repo, local, folders } = useResourceLibrary();
  const inputId = useId();
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [category, setCategory] = useState(initialCategory);
  const [folderId, setFolderId] = useState(initialFolderId ?? '');
  const [progress, setProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const saved = useRef<MediaResource[]>([]);
  const uploading = useRef(false);

  function selectFiles(selection: FileList) {
    if (uploading.current || !selection.length) return;
    if (!multiple && selection.length > 1) {
      setValidationErrors(['Elige un archivo para usar como fondo.']);
      return;
    }
    const accepted: QueuedFile[] = [];
    const errors: string[] = [];
    for (const file of Array.from(selection)) {
      try {
        const { kind } = validateResource(file);
        accepted.push({
          id: crypto.randomUUID(),
          file,
          title: (file.name.replace(/\.[^.]+$/, '') || file.name).slice(0, RESOURCE_NAME_LIMIT),
          kind,
        });
      } catch (error) {
        errors.push(`${file.name} · ${error instanceof Error ? error.message : 'Archivo inválido.'}`);
      }
    }
    setValidationErrors(errors);
    if (accepted.length) setFiles((previous) => multiple ? [...previous, ...accepted] : accepted);
  }

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    selectFiles(event.dataTransfer.files);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!files.length || !repo || uploading.current) return;
    uploading.current = true;
    setValidationErrors([]);
    const pending: QueuedFile[] = [];
    try {
      for (const [index, entry] of files.entries()) {
        const batch = { current: index + 1, total: files.length };
        setProgress({ ...batch, percent: 0 });
        try {
          const resource = await repo.upload(entry.file, { title: entry.title, category, folderId: folderId || null }, (percent) => {
            setProgress({ ...batch, percent });
          });
          saved.current.push(resource);
          setSavedCount(saved.current.length);
          setFiles((previous) => previous.filter((item) => item.id !== entry.id));
        } catch (error) {
          const failed = { ...entry, error: resourceUploadErrorMessage(error) };
          pending.push(failed);
          setFiles((previous) => previous.map((item) => item.id === entry.id ? failed : item));
        }
      }
      if (!pending.length) onUploaded(saved.current);
    } finally {
      uploading.current = false;
      setProgress(null);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-ink-800 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{multiple ? 'Agregar archivos' : 'Agregar un archivo'}</h3>
        <button type="button" aria-label="Cerrar carga de archivos" className="btn-ghost !p-2" disabled={progress !== null} onClick={onCancel}>
          <ResourceIcon name="close" className="h-4 w-4" />
        </button>
      </div>
      <input
        id={inputId}
        className="peer sr-only"
        type="file"
        accept={RESOURCE_ACCEPT}
        multiple={multiple}
        disabled={progress !== null}
        onChange={(event) => {
          if (event.currentTarget.files) selectFiles(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
      />
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          if (!uploading.current && event.dataTransfer.types.includes('Files')) setDragging(true);
        }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
        onDrop={drop}
        className={`!mt-1 flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition peer-focus-visible:ring-2 peer-focus-visible:ring-accent-soft ${
          progress !== null ? 'cursor-default border-white/10 opacity-50' : dragging
            ? 'cursor-copy border-accent-soft bg-accent/20'
            : 'cursor-pointer border-accent/50 bg-accent/[.07] hover:border-accent-soft hover:bg-accent/[.13]'
        }`}
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent-soft"><ResourceIcon name="upload" /></span>
        <span className="pointer-events-none text-sm font-semibold">{multiple ? 'Seleccionar o arrastrar archivos' : 'Seleccionar o arrastrar un archivo'}</span>
        <span className="pointer-events-none text-xs leading-relaxed text-white/65">
          Imágenes hasta {RESOURCE_SIZE_LIMITS.image} MB · MP4 o WebM hasta {RESOURCE_SIZE_LIMITS.video} MB por archivo
        </span>
      </label>

      {validationErrors.length > 0 && (
        <ul role="alert" className="max-h-28 space-y-1 overflow-auto rounded-lg border border-red-400/20 bg-red-950/30 p-3 text-xs text-red-200">
          {validationErrors.map((message, index) => <li key={index} className="break-words">{message}</li>)}
        </ul>
      )}

      {files.length > 0 && (
        <ul aria-label="Archivos seleccionados" className="max-h-64 divide-y divide-white/10 overflow-y-auto rounded-xl border border-white/10 bg-ink-900/50">
          {files.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3 p-3">
              <ResourceIcon name={entry.kind} className="mt-2 h-4 w-4 text-accent-soft" />
              <div className="min-w-0 flex-1">
                <input
                  className="input !py-1.5"
                  aria-label={`Nombre para ${entry.file.name}`}
                  value={entry.title}
                  maxLength={RESOURCE_NAME_LIMIT}
                  disabled={progress !== null}
                  onChange={(event) => {
                    const title = event.target.value;
                    setFiles((previous) => previous.map((item) => item.id === entry.id ? { ...item, title } : item));
                  }}
                />
                <p className="mt-1 truncate text-xs text-white/55" title={entry.file.name}>{entry.file.name} · {formatResourceSize(entry.file.size)}</p>
                {entry.error && <p role="alert" className="mt-1 text-xs text-red-300">{entry.error}</p>}
              </div>
              <button
                type="button"
                className="btn-ghost !p-2"
                aria-label={`Quitar ${entry.file.name}`}
                disabled={progress !== null}
                onClick={() => setFiles((previous) => previous.filter((item) => item.id !== entry.id))}
              >
                <ResourceIcon name="close" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="label">Carpeta de destino</span>
          <select className="input" value={folderId} disabled={progress !== null} onChange={(event) => setFolderId(event.target.value)}>
            <option value="">Sin carpeta</option>
            {folders.map((folder) => <option key={folder.id} value={folder.id} disabled={folder.deleting}>{folder.name}</option>)}
          </select>
        </label>
        <label>
          <span className="label">Categoría</span>
          <select className="input" value={category} disabled={progress !== null} onChange={(event) => setCategory(event.target.value as ResourceCategory)}>
            {RESOURCE_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>

      {progress !== null && (
        <div role="status" className="space-y-1 text-xs text-white/75">
          <p>Guardando archivo {progress.current} de {progress.total} · {progress.percent} %</p>
          <progress aria-label="Progreso del archivo actual" className="h-2 w-full accent-accent" value={progress.percent} max={100} />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-3">
        {savedCount > 0 && <p role="status" className="mr-auto text-xs text-emerald-300">{savedCount} {savedCount === 1 ? 'archivo guardado' : 'archivos guardados'}</p>}
        <button type="button" className="btn-ghost" disabled={progress !== null} onClick={onCancel}>{savedCount ? 'Cerrar' : 'Cancelar'}</button>
        <button type="submit" className="btn-accent" disabled={!repo || !files.length || progress !== null}>
          <ResourceIcon name="upload" className="h-4 w-4" />
          {progress !== null ? 'Guardando…' : `${local ? 'Guardar' : 'Subir'} ${files.length > 1 ? `${files.length} archivos` : 'archivo'}`}
        </button>
      </div>
    </form>
  );
}
