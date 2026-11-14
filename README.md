# Wordship Screen — Software de Proyección de Letras para Iglesias (Web)

> Alternativa **100% web** a ProPresenter, EasyWorship, OpenLP y HolyLyrics.
> Wordship Screen con animaciones profesionales, fondos de imagen y fondos animados propios, todo personalizable.
> Persistencia inicial en **localStorage** (migrable a base de datos más adelante).

La vista de control incluye pestañas para **Letras** y **Biblia**. La Biblia
incorpora **RV1909, RVR1960, LBLA, NBLA, NTV, NVI, TLA y KJV** como archivos
JSON locales. Todas funcionan sin conexión y quedan incluidas en el precache de
la PWA; no se necesita una API key ni se consulta ningún proveedor bíblico
externo. La navegación, búsqueda, rangos y referencias reutilizan los mismos
temas, fondos y animaciones de las canciones.

Los avisos editoriales y de copyright se conservan en los manifiestos de
`public/bibles/` y se muestran en la interfaz/proyección cuando corresponde.
Antes de distribuir públicamente una compilación, verifica que cuentas con los
derechos necesarios para las traducciones protegidas.

La aplicación completa puede instalarse como PWA y usarse sin conexión. El
cancionero, las ocho Biblias, los temas, fondos animados, imágenes internas y
tipografías están empaquetados. Las canciones y ajustes del modo local se
guardan en `localStorage`; las imágenes personalizadas se guardan en IndexedDB.
Firebase es opcional y se usa solamente para cuentas y sincronización.

---

## 1. Resumen ejecutivo

**Wordship Screen** es una aplicación web para mostrar en vivo las letras de canciones (y versículos, anuncios, etc.) durante servicios de iglesia. El operador controla la presentación desde una ventana de control, mientras el público ve una ventana de proyección a pantalla completa en el proyector o segunda pantalla — exactamente el modelo de ProPresenter.

El objetivo es un producto **profesional**: transiciones suaves entre estrofas, tipografía legible a distancia, fondos con buen contraste, fondos animados generados por la propia app, y personalización total de temas, fuentes, colores y animaciones.

---

## 2. ¿Es viable hacerlo en web? — Sí

**Conclusión: totalmente viable, e incluso ventajoso.** La web moderna cubre todos los requisitos clave:

| Requisito | Tecnología web disponible | Estado |
|---|---|---|
| Doble pantalla (control + proyección) | **Window Management API** (`getScreenDetails`) + **BroadcastChannel** | Soportado en Chrome/Edge 100+ (Chromium). Fallback con ventana emergente. |
| Pantalla completa real | **Fullscreen API** | Soporte universal |
| Animaciones fluidas 60fps | **Motion / GSAP / WAAPI** (aceleradas por GPU) | Excelente |
| Fondos animados propios | **WebGL / Three.js / Canvas / shaders / tsParticles** | Excelente |
| Imágenes de fondo con contraste | CSS (overlays, blur, gradientes), `backdrop-filter` | Universal |
| Guardado local sin servidor | **localStorage** / IndexedDB | Universal |
| Funcionar sin internet | **PWA** (Service Worker, instalable como app de escritorio) | Excelente |

### Ventajas de la versión web frente a apps nativas
- **Multiplataforma sin esfuerzo**: Windows, macOS, Linux, tablet — el mismo código.
- **Cero instalación** (o instalación como PWA con un clic).
- **Actualizaciones instantáneas**, sin reinstalar.
- **Control remoto natural**: el operador podría manejarla desde el teléfono en la misma red (fase futura).

### Limitaciones honestas a tener en cuenta
- La **Window Management API** (posicionar automáticamente la ventana en el proyector) sólo funciona bien en navegadores **Chromium** (Chrome/Edge/Brave/Opera). En Firefox/Safari se usa el fallback de ventana emergente que el usuario arrastra al proyector. **Recomendación: usar Chrome/Edge** como navegador objetivo.
- Reproducción de **video de fondo pesado** puede exigir hardware decente; se mitiga con fondos WebGL/Canvas que son más ligeros.
- Sin servidor, las imágenes/videos se guardan como referencias o en IndexedDB (localStorage tiene límite ~5 MB, no sirve para binarios grandes — ver sección de datos).

---

## 3. Stack tecnológico

| Capa | Elección | Por qué |
|---|---|---|
| **Framework** | **React 18 + Vite + TypeScript** | Ecosistema más grande, mejores librerías de animación, tipado seguro, build ultrarrápido con Vite. |
| **Animaciones de letras/UI** | **Motion** (antes Framer Motion) | API declarativa que encaja con React, gestos, `layout`/`AnimatePresence` para transiciones entre estrofas. ~30 KB gzip. Cubre ~90% de los casos. |
| **Animaciones avanzadas / timelines** | **GSAP** | Para secuencias complejas, reveals letra por letra, efectos "pro". No pasa por el reconciler de React → rendimiento sólido. |
| **Fondos animados WebGL** | **Three.js** (+ shaders GLSL) y/o **tsParticles** | Gradientes animados tipo "mesh", partículas, ondas, bokeh — generados por GPU, ligeros. |
| **Estado global** | **Zustand** | Mínimo boilerplate, ideal para estado de presentación (slide activo, tema, cola). |
| **Comunicación entre ventanas** | **BroadcastChannel API** | Sincroniza control ↔ proyección en tiempo real, mismo origen, sin servidor. |
| **Persistencia** | **localStorage** (config/canciones) + **IndexedDB** (imágenes/videos vía `idb`) | localStorage para texto y ajustes; IndexedDB para binarios grandes. |
| **Estilos** | **Tailwind CSS** + CSS variables para theming | Velocidad de desarrollo + temas dinámicos en runtime. |
| **Iconos** | **lucide-react** | Limpio y ligero. |
| **Empaquetado como app** | **PWA** (`vite-plugin-pwa`) | Instalable, offline, se siente como app de escritorio. |
| **Tests** | **Vitest** + **Playwright** | Unitarios y E2E del flujo de proyección. |

### ¿Por qué Motion **y** GSAP juntos?
Motion gobierna las transiciones declarativas del flujo normal (entrar/salir de estrofas, cambios de slide). GSAP se reserva para efectos especiales y timelines precisos (reveal palabra por palabra, karaoke, secuencias encadenadas). Es un patrón común en producción: Motion para la UI de la app, GSAP para los efectos de gala.

---

## 4. Análisis de librerías de animación (2026)

**Motion (ex Framer Motion)** — ~6M descargas/semana, el estándar de facto en React. API declarativa (`<motion.div animate={...}>`), `AnimatePresence` para montar/desmontar con animación (perfecto para cambiar de estrofa), animaciones de `layout`, gestos. ~30 KB gzip. **→ Núcleo de las transiciones de letras.**

**GSAP** — el caballo de batalla profesional desde hace más de una década, framework-agnostic. Timelines precisos, `SplitText` para animar texto carácter/palabra/línea, no dispara re-renders de React. Núcleo ~27 KB. **→ Efectos avanzados y reveals.**

**React Spring** — animaciones basadas en física (resortes), naturales. Alternativa/complemento, pero Motion ya cubre lo necesario. Opcional.

**tailwindcss-motion / CSS puro / WAAPI** — para microanimaciones simples (fades, pulsos) sin coste de JS. ~5 KB. **→ Detalles ligeros.**

**Three.js** — render WebGL para fondos animados generados por la app: gradientes mesh animados con shaders, ondas, campos de partículas en 3D. La GPU hace el trabajo → menos CPU/RAM y 60fps. **→ Fondos animados premium.**

**tsParticles** — partículas configurables (nieve, polvo, bokeh, líneas conectadas) listas para usar, muy personalizables vía JSON. **→ Fondos animados rápidos de integrar.**

Veredicto: **Motion (transiciones) + GSAP (efectos) + Three.js/tsParticles (fondos)** es la combinación profesional óptima para este proyecto.

---

## 5. Arquitectura

### 5.1 Modelo de doble ventana (como ProPresenter)

```
┌─────────────────────────┐         ┌─────────────────────────┐
│   VENTANA DE CONTROL     │         │  VENTANA DE PROYECCIÓN   │
│   (laptop del operador)  │         │  (proyector / 2ª pantalla)│
│                          │         │                          │
│  • Biblioteca de cancio. │         │   ╔══════════════════╗   │
│  • Editor de estrofas    │ Broad-  │   ║                  ║   │
│  • Preview en vivo       │ cast    │   ║   GRACIA         ║   │
│  • Cola / setlist        │ Channel │   ║   SUBLIME...     ║   │
│  • Controles (◀ ▶ Black) │ ──────▶ │   ║                  ║   │
│  • Selector de tema      │         │   ╚══════════════════╝   │
└─────────────────────────┘         └─────────────────────────┘
        getScreenDetails() posiciona la ventana de proyección
        automáticamente en el proyector.
```

- La **ventana de control** mantiene el estado maestro (canción activa, índice de slide, tema, blackout).
- Cada cambio se publica por **BroadcastChannel** (`{type, payload}`); la ventana de proyección sólo *escucha y renderiza*.
- Con **Window Management API** la app detecta pantallas y abre la proyección directamente en el proyector. Un clic, doble clic o la tecla `F` dentro de esa salida activa pantalla completa. Sin esa API, se abre una ventana emergente que el operador arrastra al proyector.
- Estados clave sincronizados: `SLIDE_CHANGE`, `THEME_CHANGE`, `BLACKOUT`, `LOGO`, `CLEAR`, `BACKGROUND_CHANGE`.

### 5.2 Estructura de carpetas propuesta

```
letras/
├── public/
│   └── backgrounds/            # fondos por defecto (imágenes/presets)
├── src/
│   ├── main.tsx
│   ├── App.tsx                 # enrutado: /control y /output
│   ├── routes/
│   │   ├── ControlView.tsx     # ventana del operador
│   │   └── OutputView.tsx      # ventana de proyección
│   ├── components/
│   │   ├── library/            # biblioteca de canciones, buscador
│   │   ├── editor/             # editor de estrofas y etiquetas
│   │   ├── setlist/            # cola/lista del servicio
│   │   ├── preview/            # preview en vivo del slide
│   │   ├── slide/              # renderizador del slide (texto + capas)
│   │   ├── backgrounds/        # fondos animados (Three.js, tsParticles, CSS)
│   │   └── controls/           # toolbar, blackout, logo, clear
│   ├── animations/             # presets de animación (Motion + GSAP)
│   │   ├── textTransitions.ts
│   │   └── revealEffects.ts
│   ├── store/                  # Zustand (estado de presentación + ajustes)
│   ├── sync/                   # BroadcastChannel + Window Management
│   │   ├── channel.ts
│   │   └── screens.ts
│   ├── persistence/            # localStorage + IndexedDB (idb)
│   │   ├── songsRepo.ts
│   │   ├── themesRepo.ts
│   │   └── mediaRepo.ts
│   ├── themes/                 # temas (tipografía, colores, sombras)
│   ├── types/                  # tipos TS (Song, Slide, Theme, Setlist)
│   └── styles/
├── index.html
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

### 5.3 Flujo de datos

```
Operador edita/selecciona  →  Zustand (estado maestro)  →  persistencia (localStorage/IndexedDB)
                                        │
                                        └── BroadcastChannel.publish() ──▶ OutputView renderiza con animación
```

---

## 6. Modelo de datos (TypeScript)

```ts
type SlideBlockType = 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'custom';

interface SlideBlock {
  id: string;
  type: SlideBlockType;
  label?: string;            // "Estrofa 1", "Coro"...
  lines: string[];           // líneas de texto del slide
}

interface Song {
  id: string;
  title: string;
  author?: string;
  ccli?: string;             // número de licencia (opcional)
  tags: string[];
  blocks: SlideBlock[];
  themeId?: string;          // tema asignado a la canción (opcional)
  createdAt: number;
  updatedAt: number;
}

interface Theme {
  id: string;
  name: string;
  font: { family: string; weight: number; sizeVw: number; lineHeight: number };
  color: { text: string; outline?: string; shadow?: string };
  alignment: 'left' | 'center' | 'right';
  vAlign: 'top' | 'middle' | 'bottom';
  textTransform: 'none' | 'uppercase';
  maxLinesPerSlide: number;
  transition: TransitionPreset;     // animación de entrada/salida
  background: BackgroundConfig;     // imagen, color o fondo animado
  contrast: {                       // capa para legibilidad sobre imágenes
    overlayColor: string;           // p.ej. rgba(0,0,0,0.5)
    overlayOpacity: number;
    blurPx: number;
  };
}

type TransitionPreset =
  | 'fade' | 'slideUp' | 'slideHorizontal' | 'scale'
  | 'blurIn' | 'typewriter' | 'wordByWord' | 'crossfade';

type BackgroundConfig =
  | { kind: 'solid'; color: string }
  | { kind: 'gradient'; from: string; to: string; angle: number }
  | { kind: 'image'; mediaId: string; fit: 'cover' | 'contain' }
  | { kind: 'video'; mediaId: string }
  | { kind: 'animated'; preset: AnimatedBgPreset; params: Record<string, unknown> };

type AnimatedBgPreset =
  | 'meshGradient'    // gradiente animado WebGL (Three.js shader)
  | 'particles'       // tsParticles (bokeh, polvo, líneas)
  | 'waves'           // ondas
  | 'starfield'
  | 'aurora';

interface Setlist {           // el orden del servicio
  id: string;
  name: string;
  date: number;
  items: { songId: string; themeOverrideId?: string }[];
}

interface AppSettings {
  defaultThemeId: string;
  targetScreenId?: string;    // pantalla de proyección preferida
  language: 'es' | 'en';
}
```

### Persistencia
- **localStorage** (claves `letras.songs`, `letras.themes`, `letras.setlists`, `letras.settings`): texto y configuración (JSON). Ligero y suficiente al inicio.
- **IndexedDB** (vía `idb`): imágenes y videos de fondo (binarios), porque localStorage no debe usarse para archivos pesados (~5 MB de límite). Se guarda el blob y se referencia por `mediaId`.
- Capa de repositorio (`persistence/*Repo.ts`) que abstrae el almacenamiento → **migrar a una base de datos después sólo requiere cambiar esa capa**, sin tocar la UI. Incluir **export/import JSON** para respaldo y para portar datos cuando llegue el backend.

---

## 7. Funcionalidades

### 7.1 Núcleo (MVP)
- Biblioteca de canciones con buscador y etiquetas.
- Editor de estrofas con bloques etiquetados (Coro, Estrofa, Puente…).
- División automática de estrofas largas en varios slides (según `maxLinesPerSlide`).
- Vista de control + vista de proyección sincronizadas (BroadcastChannel).
- Pantalla completa en proyector (Window Management API + fallback).
- Navegación: siguiente/anterior slide, teclado (←/→/Espacio/Esc), clic.
- **Blackout** (pantalla negra), **Logo**, **Clear** (ocultar texto manteniendo fondo).
- Persistencia en localStorage/IndexedDB + export/import JSON.

### 7.2 Animaciones de letras (profesionales)
- Transiciones entre slides: fade, slide, scale, blur-in, crossfade (Motion + `AnimatePresence`).
- Reveals avanzados: máquina de escribir, palabra por palabra, línea por línea (GSAP `SplitText`).
- Curvas de easing configurables y duración ajustable por tema.
- Respeto a `prefers-reduced-motion` para accesibilidad.

### 7.3 Fondos
- Imagen de fondo con **capa de contraste** automática (overlay oscuro/claro + blur opcional) para garantizar legibilidad del texto.
- Video de fondo en loop.
- **Fondos animados propios de la app** (WebGL): gradiente mesh, partículas, ondas, aurora, starfield — con parámetros (velocidad, color, densidad).
- Gradientes y colores sólidos.

### 7.4 Personalización total
- Editor de temas: fuente, tamaño (responsivo en `vw`), peso, color, contorno, sombra, alineación H/V, mayúsculas, líneas por slide.
- Temas guardables y reutilizables; tema por canción o global.
- Vista previa en vivo de cada cambio antes de proyectar.

### 7.5 Fases futuras (post-MVP)
- Base de datos + sincronización en la nube y multiusuario.
- Control remoto desde el móvil (operador en el escenario).
- Biblioteca de versículos (importar Biblia) y plantillas de anuncios.
- Importación desde formatos OpenLP / OpenLyrics / ProPresenter / texto plano.
- NDI / salida a software de streaming (OBS) para transmisiones.
- Roles y permisos de equipo.

---

## 8. Roadmap por fases

**Fase 0 — Cimientos (semana 1)**
Scaffolding Vite + React + TS + Tailwind. Tipos del modelo de datos. Capa de persistencia (localStorage + IndexedDB) con repositorios y export/import.

**Fase 1 — Editor y biblioteca (semana 2)**
CRUD de canciones, editor de bloques/estrofas, buscador y etiquetas. División automática en slides.

**Fase 2 — Doble pantalla (semana 3)**
ControlView + OutputView, BroadcastChannel, Window Management API + fallback, Fullscreen, navegación por teclado, blackout/logo/clear.

**Fase 3 — Animaciones de texto (semana 4)**
Integrar Motion (`AnimatePresence`) + GSAP (`SplitText`). Presets de transición y reveals. Easing/duración por tema.

**Fase 4 — Fondos (semana 5)**
Imagen/video con capa de contraste. Fondos animados WebGL (Three.js shader mesh-gradient) y tsParticles. Parámetros configurables.

**Fase 5 — Temas y personalización (semana 6)**
Editor de temas completo, preview en vivo, temas por canción/global, ajustes de app.

**Fase 6 — Pulido y PWA (semana 7)**
PWA instalable/offline, accesibilidad (`prefers-reduced-motion`, contraste), rendimiento (60fps), tests (Vitest + Playwright), atajos de teclado, documentación de usuario.

> Estimación orientativa de ~6–7 semanas para un MVP profesional sólido (variable según dedicación).

---

## 9. Dependencias principales

```jsonc
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "zustand": "^4",
    "motion": "^11",          // ex framer-motion
    "gsap": "^3",
    "three": "^0.16x",
    "@tsparticles/react": "^3",
    "@tsparticles/engine": "^3",
    "idb": "^8",
    "lucide-react": "^0",
    "clsx": "^2"
  },
  "devDependencies": {
    "vite": "^5",
    "typescript": "^5",
    "tailwindcss": "^3",
    "vite-plugin-pwa": "^0",
    "vitest": "^2",
    "@playwright/test": "^1"
  }
}
```

---

## 10. Cómo arrancar (cuando exista el código)

```bash
cd letras
npm install      # instala React, Three.js, GSAP, Framer Motion, Zustand, etc.
npm run dev      # arranca en http://localhost:5173
```

El MVP ya implementa los fondos animados con **Three.js** (shaders WebGL: mesh
gradient con domain-warping fbm, aurora, starfield, plasma, olas, arcoíris y
partículas/confeti GPU) y el revelado de letras con **GSAP** (palabra por
palabra, letra por letra, máquina de escribir, línea por línea, rebote, pop y
baile), combinados con **Framer Motion** para las transiciones entre slides.

Además incluye una **capa de efectos superpuestos** (lluvia, nieve, estrellas,
bokeh, confeti y brasas en canvas 2D) que se dibuja sobre cualquier fondo —
incluida una imagen — para darle más dinamismo, y un selector de **tipografías
empaquetadas localmente** (Poppins, Bebas Neue, Pacifico, Anton, Fredoka,
Playfair Display, etc.) con opción de **letras arcoíris**.

Navegador recomendado: **Chrome o Edge** (para Window Management API). El dashboard del operador abre una salida independiente en `#/output` para el proyector.

### Operación con HDMI

1. Conecta el proyector y configura el sistema operativo en **Extender**, nunca
   en Duplicar/Espejo. El dashboard debe permanecer en la laptop.
2. Abre la app en Chrome o Edge y pulsa **Abrir proyección**. La primera vez,
   acepta el permiso del sitio para administrar ventanas.
3. La salida se colocará en la pantalla externa. Dentro de ella, pulsa
   **Pantalla completa**, presiona `F` o haz doble clic. `Esc` permite salir.
4. Regresa al dashboard. El indicador verde confirma que la salida está
   conectada y muestra la resolución real que recibe el proyector.
5. Si el navegador no permite la colocación automática, arrastra la ventana al
   proyector y usa `F` o `F11`; las letras, Biblia, temas y controles seguirán
   sincronizados.

La proyección es responsiva y utiliza todo el viewport, por lo que funciona con
salidas Full HD, 2K y 4K. La resolución y frecuencia finales deben configurarse
en el sistema operativo según lo que acepte la entrada HDMI del proyector.

---

## 10.5. Backend multiusuario (Firebase)

La app es **multiusuario y SaaS-ready**: cada cuenta tiene su propia biblioteca,
temas y configuración, totalmente aislados. La persistencia está detrás de una
capa de repositorios (`src/persistence/`), con dos implementaciones
intercambiables:

- **localRepo** (localStorage): modo local, sin cuenta. Se usa automáticamente
  si no hay configuración de Firebase.
- **firestoreRepo** (Cloud Firestore): modo multiusuario, datos por usuario en
  `users/{uid}/songs|themes|setlists` y `users/{uid}/meta/settings`.

El usuario también puede pulsar **Usar sin conexión** en la pantalla de acceso.
En ese modo no se requiere cuenta y todos los cambios quedan en el dispositivo.

Stack de Firebase usado:

- **Auth** (correo/contraseña + Google) para las cuentas.
- **Cloud Firestore** para los datos (documentos JSON 1:1 con el modelo), con
  **caché offline persistente** y **sincronización en tiempo real** (listeners
  `onSnapshot`) — esto habilita, por ejemplo, control remoto desde el móvil.
- **IndexedDB local** para logos e imágenes de fondo, de modo que sigan
  disponibles aunque Firebase o Internet no respondan.
- **Cloud Storage** para las imágenes y los videos de **Recursos**. Los archivos
  y sus fichas de Firestore están bajo `resources/{resourceId}`. Las carpetas
  se guardan en `resourceFolders/{folderId}`. Cualquier cuenta autenticada puede
  subir, consultar, editar y eliminar contenido de la biblioteca compartida.
  En modo sin cuenta, los archivos se guardan en IndexedDB.

### Configuración

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/),
   habilita **Authentication** (proveedores Correo/contraseña y Google) y
   **Cloud Firestore**.
2. Copia `.env.example` a `.env` y rellena las llaves del SDK
   (Configuración del proyecto → Tus apps → SDK).
3. Para usar **Recursos** con una cuenta, activa el plan Blaze del proyecto y crea
   el bucket desde **Storage → Comenzar** en Firebase Console. Copia el nombre
   exacto del bucket (sin `gs://`) en `VITE_FIREBASE_STORAGE_BUCKET`.
   [Configuración de Cloud Storage](https://firebase.google.com/docs/storage/web/start).
4. Publica las reglas con `firebase deploy --only firestore:rules,storage --project TU_PROYECTO`.
   Si solo configuraste Firestore, publica con `--only firestore:rules`.
5. `npm run dev`. Si las llaves están presentes, aparece la pantalla de login;
   si no, la app corre en **modo local** sin cuenta.

Si el navegador muestra un error CORS al subir un recurso, revisa el estado de
la solicitud `OPTIONS` en la pestaña **Red**. Un `404` puede indicar que el
bucket todavía no existe o que el nombre de `VITE_FIREBASE_STORAGE_BUCKET`
es incorrecto. Reinicia Vite después de corregir el valor de `.env`.

### Dominios autorizados para Google

Google Sign-In requiere autorizar cada host desde **Firebase Console →
Authentication → Settings → Authorized domains**. Agrega el nombre del host sin
protocolo ni puerto, por ejemplo:

- `localhost`
- `127.0.0.1`
- `letras.tudominio.com`

Una IP de red local, como `192.168.1.20`, también debe agregarse por separado.
En proyectos creados después del 28 de abril de 2025, incluso `localhost` puede
requerir autorización manual. Mantén `VITE_FIREBASE_AUTH_DOMAIN` con el valor
exacto del SDK de Firebase, normalmente `TU_PROYECTO.firebaseapp.com`; no lo
cambies por el dominio de Vercel, Netlify u otro hosting externo.

> Migrar de local a Firebase no toca la UI ni el store: sólo cambia el
> repositorio activo. Los datos se siembran (temas + canciones de ejemplo) la
> primera vez que entra una cuenta nueva.

---

## 11. Notas de compatibilidad

| Función | Chrome/Edge | Firefox | Safari |
|---|---|---|---|
| BroadcastChannel | ✅ | ✅ | ✅ |
| Fullscreen API | ✅ | ✅ | ✅ |
| Window Management API (auto-posición en proyector) | ✅ | ❌ (fallback ventana) | ❌ (fallback ventana) |
| WebGL / Three.js | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ |
| PWA instalable | ✅ | parcial | parcial |

**Recomendación operativa**: usar Chrome/Edge en la máquina de proyección para la mejor experiencia de doble pantalla.

---

## Fuentes

- [Comparing the best React animation libraries for 2026 — LogRocket](https://blog.logrocket.com/best-react-animation-libraries/)
- [GSAP vs Framer Motion vs React Spring (2026) — Good Fella Lab](https://lab.good-fella.com/blog/gsap-vs-framer-motion-vs-react-spring)
- [Framer Motion vs GSAP (2026) — PkgPulse](https://www.pkgpulse.com/compare/framer-motion-vs-gsap)
- [Window Management API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API)
- [Manage several displays with the Window Management API — Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/window-management)
- [How to use multiple screens — web.dev](https://web.dev/patterns/web-apps/multiple-screens)
- [shader-gradients (Three.js / WebGL) — GitHub](https://github.com/dage/shader-gradients)
