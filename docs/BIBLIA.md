# Plan — Proyección de la Biblia (varias versiones)

> Diseño técnico para añadir proyección de pasajes bíblicos a **Letras**,
> reutilizando el motor actual de slides, temas y animaciones.
> Enfoque **profesional**: offline-first, licencias en regla y escalable a SaaS.
> Estado: **pendiente de implementar** (este documento es la guía).

---

## 1. Objetivo

Permitir buscar, navegar y **proyectar versículos** de la Biblia en distintas
versiones, con la misma calidad visual que las canciones (temas, fondos
animados, transiciones, justificado, etc.) y mostrando la **referencia**
(p. ej. "Juan 3:16 — RVR1960").

No se construye un motor de presentación nuevo: el texto bíblico se convierte en
`RenderSlide[]` y se proyecta con `SlideStage` + `BroadcastChannel`, igual que
las canciones.

---

## 2. Principios (por qué "profesional")

1. **Offline-first.** En un servicio el wifi falla. Las versiones que podamos,
   se sirven desde **nuestro propio almacenamiento** (no una API gratuita en
   vivo): proyección instantánea y sin internet.
2. **Licencias en regla.** Separar versiones de **dominio público** (libres) de
   las **con derechos** (licenciadas vía API.Bible). Cumplir atribución, caché y
   límites.
3. **Arquitectura enchufable.** Un único `bibleRepo` con varios proveedores
   detrás (igual que el patrón de repos ya usado para Firestore). La UI no
   cambia cuando se agregan versiones.

---

## 3. Fuentes de datos y licencias

### 3.1 Dominio público (incluidas, offline)

Libres para hospedar y empaquetar. **Lanzar con estas:**

- **Reina-Valera 1909 (RV1909)** — español, dominio público.
- **King James Version (KJV)** — inglés, dominio público.
- (Opcionales: ASV, Reina-Valera Gómez según licencia, etc.)

Origen de los datos: descargar JSON normalizado desde fuentes de dominio
público (p. ej. **get.bible v2**, **wldeh/bible-api**). Se ingieren **una sola
vez** a nuestro formato (ver §6).

### 3.2 Con derechos de autor (premium, en línea vía API.Bible)

**RVR1960, NVI, NTV, LBLA**, etc. están protegidas. Se acceden con licencia
comercial mediante **API.Bible** (American Bible Society):

- Costo: **desde ~$10 USD/mes por versión** para uso comercial.
- Requisitos obligatorios:
  - **Atribución en pantalla**: nombre de la versión, abreviatura, titular de
    derechos y enlace (vienen en la metadata de la API).
  - **Caché máx. 14–30 días** (refrescar; no almacenamiento permanente).
  - **No más de 500 versículos consecutivos** por solicitud/visualización.
  - Integrar **FUMS** (Fair Use Management System) de API.Bible.
- Implicación: estas versiones son **solo en línea** (no se pueden empaquetar
  para offline permanente). Se permite caché corta de lo consultado.

### 3.3 Recomendación de lanzamiento

1. **Producción día 1:** RV1909 + KJV (dominio público, offline, gratis, legal).
2. **Premium (plan de pago):** RVR1960 / NVI / NTV vía API.Bible. El costo por
   versión se cubre con la suscripción del usuario.
3. **No usar** bolls/APIs gratuitas en producción comercial (procedencia de
   datos GPL + sin garantías de licencia/disponibilidad). Útiles solo para
   prototipar.

---

## 4. Arquitectura

```
                 ┌────────────────────────────┐
   UI Biblia ──▶ │  bibleStore (zustand slice) │
                 └──────────────┬─────────────┘
                                │
                       ┌────────▼────────┐
                       │    bibleRepo    │  (interfaz única)
                       └───┬─────────┬───┘
            offline/PD ┌───▼───┐ ┌───▼─────────┐ en línea/licencia
                       │bundled│ │  apiBible   │ + caché 14d + FUMS
                       │(JSON) │ │ (scripture) │ + atribución
                       └───────┘ └─────────────┘
                                │
                       slides ──▼──▶ SlideStage / proyección (igual que canciones)
```

### 4.1 `bibleRepo` (interfaz)

```ts
export interface BibleVersion {
  id: string;          // 'rv1909', 'kjv', 'api:592420522e16049f-01'...
  name: string;        // 'Reina-Valera 1909'
  abbr: string;        // 'RV1909'
  lang: string;        // 'es' | 'en'
  source: 'bundled' | 'apiBible';
  copyright?: string;  // texto de atribución (requerido en licenciadas)
  link?: string;       // enlace al titular de derechos
}

export interface BibleVerse {
  book: number;        // 1..66
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleRepo {
  listVersions(): Promise<BibleVersion[]>;
  getChapter(versionId: string, book: number, chapter: number): Promise<BibleVerse[]>;
  getPassage(versionId: string, book: number, chapter: number, from: number, to: number): Promise<BibleVerse[]>;
  search(versionId: string, query: string): Promise<BibleVerse[]>;
}
```

Dos implementaciones detrás de un **dispatcher** que elige por `version.source`:

- `bundledRepo`: lee JSON por libro/capítulo desde Firebase Storage / `public/`,
  con índice de búsqueda local (FlexSearch). 100% offline una vez cacheado.
- `apiBibleRepo`: cliente de `scripture.api.bible` con key, caché ≤14 días en
  IndexedDB, atribución y FUMS.

### 4.2 `bibleStore` (slice de zustand)

Mismo patrón que `librarySlice`/`presentationSlice`:

```ts
interface BibleSlice {
  versions: BibleVersion[];
  versionId: string;          // versión activa
  book: number; chapter: number;
  chapterVerses: BibleVerse[];
  searchResults: BibleVerse[];
  loadingChapter: boolean;

  loadVersions(): Promise<void>;
  setVersion(id: string): void;
  openChapter(book: number, chapter: number): Promise<void>;
  search(query: string): Promise<void>;
  projectPassage(from: number, to: number): void; // → genera slides y proyecta
}
```

Se compone en `useStore` como un slice más (o store separado `useBibleStore`).

### 4.3 Conversión a slides y proyección

- Un pasaje → `RenderSlide[]` (1 versículo por slide por defecto, configurable a
  N). Cada slide incluye:
  - `lines`: el texto del versículo (dividido por `maxLinesPerSlide`).
  - `reference`: "Juan 3:16" (+ abreviatura de versión).
- Se reutiliza `buildSlides` (o una variante `buildScriptureSlides`).
- `SlideStage` renderiza igual; se añade un slot opcional para la **referencia**
  (esquina inferior) y, en versiones licenciadas, la **atribución/copyright**.

### 4.4 Cambios mínimos al modelo de tema

Agregar (opcional, con defaults) al `Theme`:

```ts
reference?: {
  show: boolean;
  position: 'bottom' | 'top';
  sizeVw: number;
};
```

Si no existe, se usa un default ("mostrar referencia abajo, pequeña").

---

## 5. UI — Panel "Biblia"

Nueva pestaña/sección en la vista de control (junto a Biblioteca):

- **Selector de versión** (con etiqueta de idioma y candado/"premium" en
  licenciadas no contratadas).
- **Navegador**: libro (grilla 66) → capítulo (grilla) → versículos.
- **Buscador** de texto completo (instantáneo en offline; FUMS en API.Bible).
- **Rango**: seleccionar "del versículo X al Y" para proyectar.
- Botón **Proyectar** (manda a `SlideStage` con el tema activo).
- **Comparación en paralelo** (fase 2): dos versiones lado a lado.
- **Atribución** visible cuando aplica (requisito legal).

Reutiliza la misma estética del panel de Biblioteca para consistencia.

---

## 6. Pipeline de ingesta (versiones de dominio público)

Script único (Node) que corre una vez por versión:

1. Descarga el texto PD en JSON (get.bible v2 / wldeh).
2. Normaliza a `BibleVerse` y agrupa **por libro y capítulo**.
3. Genera archivos `bibles/{versionId}/{book}.json` (o por capítulo si pesa).
4. Construye un **índice de búsqueda** (`bibles/{versionId}/index.json`).
5. Sube a **Firebase Storage** (o `public/bibles/` para bundle estático).

Carga **perezosa** en runtime: solo se baja el libro/capítulo solicitado y se
cachea (IndexedDB). Mapa de **nombres de libros** localizados (es/en) y
**versificación** estándar.

---

## 7. Caché y offline

- **Dominio público**: capítulos cacheados en IndexedDB → offline total tras la
  primera visita. (Opcional: precarga de libros frecuentes.)
- **API.Bible**: caché de capítulos consultados con **TTL ≤ 14 días**; refrescar
  o purgar según términos. Nunca persistir como propio.
- La caché de Firestore del usuario puede guardar **marcadores/última posición**,
  no el texto licenciado.

---

## 8. Modelo de datos (resumen)

```ts
BibleVersion { id, name, abbr, lang, source, copyright?, link? }
BibleVerse   { book, chapter, verse, text }
Passage      { versionId, book, chapter, from, to, verses: BibleVerse[] }
Bookmark     { id, versionId, book, chapter, verse, label }   // futuro
```

Posición/marcadores del usuario → Firestore (`users/{uid}/bibleBookmarks`).
Texto bíblico → NO en Firestore (PD en Storage/CDN; licenciado solo en caché).

---

## 9. Estructura de archivos propuesta

```
src/
├── bible/
│   ├── types.ts                 # BibleVersion, BibleVerse, Passage
│   ├── bibleRepo.ts             # interfaz + dispatcher por source
│   ├── bundledRepo.ts           # versiones de dominio público (offline)
│   ├── apiBibleRepo.ts          # API.Bible (licenciadas, FUMS, atribución)
│   ├── search.ts                # índice FlexSearch para offline
│   ├── books.ts                 # nombres/orden de libros (es/en)
│   └── toSlides.ts              # pasaje → RenderSlide[]
├── store/
│   └── bibleSlice.ts            # estado de Biblia (zustand)
├── components/control/
│   ├── BiblePanel.tsx           # navegador + buscador + versión
│   └── BibleReference.tsx       # referencia/atribución en SlideStage
scripts/
└── ingest-bible.ts              # pipeline de ingesta (PD → JSON + índice)
```

---

## 10. Roadmap por fases

**Fase 1 — Base offline (PD).** `bibleRepo` + `bundledRepo` + ingesta de
RV1909 y KJV + `bibleSlice` + panel básico (navegar y proyectar) + referencia en
pantalla. *(≈ 4–5 días)*

**Fase 2 — Búsqueda y UX.** Índice FlexSearch, buscador instantáneo, selección
de rango, marcadores, nombres de libros localizados. *(≈ 3 días)*

**Fase 3 — Versiones licenciadas.** `apiBibleRepo` (key, caché 14d, FUMS,
atribución), bandera "premium", contratación de RVR1960/NVI. *(≈ 3–4 días)*

**Fase 4 — Avanzado.** Comparación en paralelo, "versículo del día", incluir
pasajes en un *setlist* junto con canciones. *(≈ 3 días)*

Total estimado versión profesional: **~1.5–2 semanas**.

---

## 11. Checklist de licencias (antes de habilitar versiones con derechos)

- [ ] Crear cuenta y key en API.Bible.
- [ ] Contratar licencia comercial de cada versión moderna a habilitar (~$10/mes c/u).
- [ ] Mostrar **atribución completa** (nombre, abreviatura, titular, enlace) en
      control y proyección.
- [ ] Implementar **FUMS** según su guía.
- [ ] Respetar **≤ 500 versículos consecutivos** y **caché ≤ 14 días**.
- [ ] No persistir texto licenciado como propio (solo caché temporal).
- [ ] Para PD: verificar que la fuente sea realmente dominio público antes de
      empaquetar.

---

## 12. Decisiones abiertas

- ¿Empaquetar PD en `public/` (bundle estático) o servir desde Firebase Storage
  (descarga perezosa)? → Storage escala mejor para muchas versiones.
- ¿`useBibleStore` separado o slice dentro de `useStore`? → Slice, salvo que
  crezca mucho.
- ¿Qué versiones PD adicionales en español interesan (RVA, RVG, etc.) según
  licencia?

---

## Fuentes

- [API.Bible — Fair Use](https://docs.api.bible/guides/fair-use/)
- [API.Bible — FAQ (licencias, ~$10/mes por versión)](https://api.bible/faq)
- [API.Bible — Términos y condiciones](https://api.bible/terms-and-conditions)
- [Get.Bible — data sets (dominio público en JSON)](https://get.bible/bible-data-sets/)
- [wldeh/bible-api (200+ versiones)](https://github.com/wldeh/bible-api)
