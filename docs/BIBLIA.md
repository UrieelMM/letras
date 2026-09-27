# Proyección bíblica offline

La sección **Biblia** funciona exclusivamente con archivos JSON incluidos en la
aplicación. No consulta API.Bible ni otros servicios bíblicos durante la
navegación, búsqueda o proyección.

## Versiones incluidas

| ID local | Versión | Idioma |
|---|---|---|
| `rv1909` | Reina-Valera 1909 | Español |
| `rvr1960` | Biblia Reina-Valera 1960 | Español |
| `lbla` | La Biblia de las Américas | Español |
| `nbla` | Nueva Biblia de las Américas | Español |
| `ntv` | Nueva Traducción Viviente | Español |
| `nvi` | Nueva Versión Internacional | Español |
| `tla` | Traducción en Lenguaje Actual | Español |
| `kjv` | King James Version | Inglés |

Cada versión está almacenada en `public/bibles/{id}/` y contiene:

- `manifest.json`: nombre, abreviatura, idioma, fuente, editorial y aviso legal.
- `1.json` a `66.json`: texto normalizado, un archivo por libro.

Los avisos de copyright se muestran tanto en el panel de control como en las
diapositivas proyectadas. Los archivos locales no cambian los derechos de las
traducciones; antes de redistribuir una compilación se deben verificar los
permisos de cada editorial.

## Arquitectura

```text
UI Biblia
    │
    ▼
bibleStore (Zustand)
    │
    ▼
bibleRepo
    │
    ▼
bundledBibleRepo ──► public/bibles/{versionId}/{book}.json
    │
    ├── memoria
    ├── IndexedDB
    └── búsqueda local
```

`bibleRepo` expone únicamente `bundledBibleRepo`. El catálogo se declara en
`src/bible/bundledRepo.ts`; todas las entradas tienen `source: 'bundled'`.

La carga es perezosa en tiempo de ejecución: se abre el archivo del libro
seleccionado y se conserva en memoria e IndexedDB. Además, el service worker de
la PWA precarga todos los JSON durante la instalación, por lo que las ocho
versiones quedan disponibles sin conexión.

## Modelo normalizado

```ts
interface BibleVerse {
  book: number;
  chapter: number;
  verse: number;
  verseEnd?: number;
  text: string;
}
```

`verseEnd` conserva los rangos que algunas traducciones agrupan en un solo
bloque, por ejemplo `Génesis 2:1–3`. La selección, búsqueda y proyección tratan
el rango como una unidad, sin duplicar ni descartar texto.

## Ingesta

El script `scripts/ingest-bible.mjs` convierte fuentes JSON al formato local:

```bash
node scripts/ingest-bible.mjs fuente.json public/bibles/version version
```

El importador:

1. Verifica que la fuente tenga 66 libros.
2. Normaliza libros, capítulos, versículos y espacios.
3. Conserva rangos mediante `verseEnd`.
4. Une fragmentos pertenecientes al mismo versículo.
5. Elimina capítulos idénticos duplicados en la fuente.
6. Genera el manifiesto con los metadatos disponibles.

## Funcionalidad

- Navegación por libro, capítulo y versículo.
- Selección de un versículo o rango.
- Soporte de rangos editoriales combinados.
- Búsqueda global local en la versión activa.
- Conversión a `RenderSlide[]` y proyección con `SlideStage`.
- Referencia y atribución editorial en pantalla.
- Caché en memoria e IndexedDB.
- Disponibilidad offline mediante el precache de la PWA.

Quedan como mejoras futuras los marcadores, un índice de búsqueda dedicado y la
comparación paralela entre traducciones.

## Aplicación sin conexión

La Biblia comparte el mismo service worker que el cancionero y el resto de la
interfaz. La compilación precarga los módulos JavaScript, estilos, iconos,
tipografías locales y todos los archivos de `public/bibles/`. Después de abrir
o instalar una versión actualizada de la aplicación una vez con conexión, no se
requiere Internet para navegar, buscar o proyectar letras y pasajes.
