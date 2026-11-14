import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import MetallicSwirl from '../metallic-swirl';
import { InstallAppButton } from '../InstallAppButton';
import { DesktopInstall, isDesktopInstallDevice } from './DesktopInstall';
import { useAuthStore } from '../../store/authStore';
import brandMark from '../../assets/3.png';

type LandingTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'wordship.landing.theme.v1';

function getInitialTheme(): LandingTheme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // La preferencia del sistema sigue siendo un buen valor inicial.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const features = [
  {
    icon: 'library' as const,
    label: 'Biblioteca lista',
    title: 'Tu repertorio, ordenado y siempre a mano.',
    description:
      'Encuentra canciones al instante, edita letras y prepara cada bloque sin saltar entre herramientas.',
  },
  {
    icon: 'screen' as const,
    label: 'Control en vivo',
    title: 'Cada cambio llega a pantalla en el momento.',
    description:
      'Avanza slides, activa blackout o muestra tu identidad visual sin interrumpir el flujo de la reunión.',
  },
  {
    icon: 'sparkles' as const,
    label: 'Diseño que inspira',
    title: 'Fondos vivos que se sienten parte de la experiencia.',
    description:
      'Combina tipografías, color, video y efectos generativos para crear escenas con intención.',
  },
  {
    icon: 'bible' as const,
    label: 'Biblia integrada',
    title: 'Del pasaje a la pantalla, sin fricción.',
    description:
      'Busca un texto, divídelo en slides legibles y proyéctalo desde el mismo espacio de trabajo.',
  },
];

const workflow = [
  {
    number: '01',
    title: 'Prepara el repertorio',
    short: 'Canciones listas antes de comenzar.',
    description: 'Busca en tu biblioteca, corrige una letra y ordena cada slide siguiendo el flujo real de la reunión.',
    details: ['Búsqueda instantánea', 'Editor de letras', 'Orden visual de slides'],
  },
  {
    number: '02',
    title: 'Diseña la escena',
    short: 'Una identidad visual para cada momento.',
    description: 'Define tipografía, contraste y movimiento mientras ves el resultado final antes de enviarlo a pantalla.',
    details: ['Vista previa en vivo', 'Fondos generativos', 'Tipografías y color'],
  },
  {
    number: '03',
    title: 'Añade un pasaje',
    short: 'La Biblia vive en el mismo flujo.',
    description: 'Encuentra el texto, selecciona los versículos y conviértelos en slides legibles sin salir del espacio de trabajo.',
    details: ['Varias traducciones', 'División automática', 'Referencia siempre visible'],
  },
  {
    number: '04',
    title: 'Controla la salida',
    short: 'Lo que eliges aparece en el momento.',
    description: 'Avanza con un clic o con el teclado y conserva a la vista lo que está al aire y lo que viene después.',
    details: ['Salida independiente', 'Blackout y logo', 'Control por teclado'],
  },
];

const visualScenes = [
  { id: 'aurora', name: 'Aurora', mood: 'Etéreo y contemplativo', copy: ['Tu gracia me encontró', 'y hoy puedo ver'] },
  { id: 'pulse', name: 'Pulso', mood: 'Energía y celebración', copy: ['Hay libertad', 'en este lugar'] },
  { id: 'halo', name: 'Halo', mood: 'Luz y profundidad', copy: ['Santo por siempre', 'digno es el Señor'] },
  { id: 'silk', name: 'Seda', mood: 'Cálido y orgánico', copy: ['Tu amor permanece', 'de generación en generación'] },
];

const faqItems = [
  ['¿Necesito conexión a internet durante la reunión?', 'No. Puedes activar el modo local y trabajar con la biblioteca guardada en el dispositivo. La aplicación también se puede instalar para abrirla como una app.'],
  ['¿Puedo usar una segunda pantalla o proyector?', 'Sí. Wordship Screen abre una salida independiente y puede colocarla en una pantalla externa compatible, manteniendo el panel de control sólo para el operador.'],
  ['¿Puedo proyectar canciones y textos bíblicos?', 'Sí. La biblioteca de letras y el buscador bíblico comparten el mismo espacio de trabajo y ambos generan slides listos para proyectar.'],
  ['¿Los fondos animados afectan la legibilidad?', 'Cada escena combina capas de contraste, sombra y composición tipográfica. Puedes revisar el resultado en la vista previa antes de enviarlo al proyector.'],
];

export function LandingPage() {
  const [theme, setTheme] = useState<LandingTheme>(getInitialTheme);
  const reduceMotion = useReducedMotion();
  const { user, localMode } = useAuthStore();
  const hasSession = Boolean(user) || localMode;
  const appPath = hasSession ? '/app' : '/login';
  const desktopInstall = isDesktopInstallDevice();

  useEffect(() => {
    document.title = 'Wordship Screen — Proyección para iglesias';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // El tema todavía se aplica durante esta sesión si el storage está bloqueado.
    }
  }, [theme]);

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className="landing-shell min-h-screen overflow-x-hidden" data-theme={theme}>
      <header className="landing-nav fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" className="group flex items-center gap-3" aria-label="Wordship Screen, inicio">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-[#16111e] shadow-[0_8px_24px_rgba(94,61,194,.22)] ring-1 ring-white/10 transition group-hover:-rotate-3 group-hover:scale-105">
              <img src={brandMark} alt="" className="h-10 w-10 object-contain" />
            </span>
            <span className="text-[15px] font-extrabold tracking-[-0.035em]">
              Wordship <span className="font-medium opacity-55">Screen</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold md:flex" aria-label="Navegación principal">
            <NavButton target="producto">Producto</NavButton>
            <NavButton target="funciones">Funciones</NavButton>
            <NavButton target="flujo">Cómo funciona</NavButton>
            <NavButton target="visuales">Visuales</NavButton>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="landing-icon-button"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <Link to={appPath} className="landing-nav-cta">
              <span className="hidden sm:inline">{hasSession ? 'Abrir app' : 'Iniciar sesión'}</span>
              <span className="sm:hidden">Entrar</span>
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-36 lg:pb-36">
          <div className="absolute inset-0 -z-20">
            <MetallicSwirl
              width="100%"
              height="100%"
              speed={reduceMotion ? 0 : 0.22}
              zoom={4.5}
              iterations={10}
              colorPhaseR={theme === 'dark' ? 1.05 : 0.8}
              colorPhaseG={theme === 'dark' ? 3.05 : 2.7}
              colorPhaseB={theme === 'dark' ? 0.55 : 0.25}
              colorRange={theme === 'dark' ? 0.48 : 0.34}
              colorBias={theme === 'dark' ? 0.34 : 0.68}
              brightness={theme === 'dark' ? 0.92 : 1.18}
              backgroundColor={theme === 'dark' ? '#09070f' : '#f7f4ef'}
              opacity={theme === 'dark' ? 0.72 : 0.52}
              cursorInteraction={!reduceMotion}
              cursorIntensity={0.8}
            />
          </div>
          <div className="landing-hero-wash pointer-events-none absolute inset-0 -z-10" />
          <div className="landing-grid pointer-events-none absolute inset-0 -z-10 opacity-60" />

          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-4xl text-center"
            >
              <div className="landing-pill mb-6 inline-flex items-center gap-2.5 rounded-full px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] sm:text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6577] opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff6577]" />
                </span>
                Hecho para equipos de adoración
              </div>

              <h1 className="text-balance text-[clamp(3.1rem,8.4vw,6.6rem)] font-black leading-[0.88] tracking-[-0.075em]">
                Proyecta cada palabra.
                <span className="landing-gradient-text mt-1 block pb-[0.08em]">Sin perder el momento.</span>
              </h1>
              <p className="landing-muted mx-auto mt-7 max-w-2xl text-balance text-base leading-7 sm:text-lg sm:leading-8">
                Letras, pasajes y visuales en un solo lugar. Wordship Screen ayuda a tu equipo a preparar y controlar cada proyección con calma, claridad y belleza.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to={appPath} className="landing-primary-button group w-full sm:w-auto">
                  {hasSession ? 'Abrir mi espacio' : 'Comenzar ahora'}
                  <span className="transition-transform group-hover:translate-x-1"><ArrowIcon /></span>
                </Link>
                <button
                  type="button"
                  className="landing-secondary-button w-full sm:w-auto"
                  onClick={() => scrollToSection('flujo')}
                >
                  <PlayIcon />
                  Ver cómo funciona
                </button>
              </div>

              <div className="landing-trust mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold">
                <span><CheckIcon /> Funciona sin conexión</span>
                <span><CheckIcon /> Biblia integrada</span>
                <span><CheckIcon /> Sin instalaciones complejas</span>
              </div>
            </motion.div>

            <motion.div
              id="producto"
              initial={reduceMotion ? undefined : { opacity: 0, y: 44, rotateX: 5 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.9, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto mt-14 max-w-6xl scroll-mt-28 sm:mt-16"
              style={{ perspective: 1200 }}
            >
              <div className="landing-product-glow pointer-events-none absolute inset-x-[8%] bottom-[-8%] h-1/2 blur-3xl" />
              <ProductPreview />
            </motion.div>
          </div>
        </section>

        <section id="funciones" className="landing-section scroll-mt-20 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal} className="max-w-3xl">
              <SectionEyebrow>Un espacio. Todo el servicio.</SectionEyebrow>
              <h2 className="landing-heading mt-4 text-balance text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-6xl">
                Menos ventanas abiertas. Más atención en lo importante.
              </h2>
              <p className="landing-muted mt-6 max-w-2xl text-base leading-7 sm:text-lg">
                Diseñado para que voluntarios y equipos creativos trabajen con seguridad desde el ensayo hasta el último slide.
              </p>
            </motion.div>

            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-12">
              {features.map((feature, index) => (
                <motion.article
                  key={feature.title}
                  {...reveal}
                  transition={{ duration: 0.6, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className={`landing-feature-card group relative overflow-hidden rounded-[1.75rem] p-7 sm:p-8 ${
                    index < 2 ? 'lg:col-span-6' : index === 2 ? 'lg:col-span-7' : 'lg:col-span-5'
                  }`}
                >
                  {index === 2 && <AnimatedBackdrop />}
                  <div className="relative z-10">
                    <span className="landing-feature-icon"><FeatureIcon name={feature.icon} /></span>
                    <p className="landing-kicker mt-10 text-xs font-extrabold uppercase tracking-[0.16em]">{feature.label}</p>
                    <h3 className="mt-3 max-w-lg text-2xl font-extrabold leading-tight tracking-[-0.04em] sm:text-3xl">{feature.title}</h3>
                    <p className="landing-muted mt-4 max-w-lg text-sm leading-6 sm:text-base sm:leading-7">{feature.description}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="flujo" className="landing-flow-section scroll-mt-20 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal} className="max-w-3xl">
              <SectionEyebrow>De idea a pantalla</SectionEyebrow>
              <h2 className="landing-heading mt-4 text-balance text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-6xl">
                Mira cómo se construye una proyección, paso a paso.
              </h2>
              <p className="landing-muted mt-6 max-w-2xl text-base leading-7 sm:text-lg">
                Explora cada etapa. La demostración cambia contigo para mostrar lo que ve el operador y lo que recibe la audiencia.
              </p>
            </motion.div>
            <motion.div {...reveal} className="mt-14"><WorkflowDemo reduceMotion={Boolean(reduceMotion)} /></motion.div>
          </div>
        </section>

        <section id="visuales" className="landing-section scroll-mt-20 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal} className="grid gap-8 lg:grid-cols-[.78fr_1.22fr] lg:items-end">
              <div>
                <SectionEyebrow>Visuales con intención</SectionEyebrow>
                <h2 className="landing-heading mt-4 text-balance text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-6xl">
                  Una atmósfera para cada canción.
                </h2>
              </div>
              <p className="landing-muted max-w-xl text-base leading-7 sm:text-lg lg:justify-self-end">
                Prueba distintas direcciones visuales. Los fondos se mueven en tiempo real y mantienen la letra como protagonista.
              </p>
            </motion.div>

            <motion.div {...reveal} className="mt-14"><VisualPlayground /></motion.div>
          </div>
        </section>

        <section className="landing-operations py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal} className="text-center">
              <SectionEyebrow>Preparado para el directo</SectionEyebrow>
              <h2 className="landing-heading mx-auto mt-4 max-w-3xl text-balance text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-6xl">
                La tranquilidad también es una función.
              </h2>
              <p className="landing-muted mx-auto mt-6 max-w-2xl text-base leading-7 sm:text-lg">
                Herramientas pensadas para cuando la sala está llena, el tiempo corre y todo tiene que responder.
              </p>
            </motion.div>

            <div className="mt-14 grid gap-4 lg:grid-cols-2">
              <motion.article {...reveal} className="landing-operation-main relative min-h-[480px] overflow-hidden rounded-[2rem] p-7 sm:p-10">
                <div className="relative z-10 max-w-md">
                  <span className="landing-operation-tag">Salida inteligente</span>
                  <h3 className="mt-5 text-3xl font-black leading-tight tracking-[-0.045em] sm:text-4xl">Dos pantallas. Un solo punto de control.</h3>
                  <p className="mt-4 text-sm leading-7 text-white/58 sm:text-base">El operador conserva controles, biblioteca y vista previa; la audiencia recibe únicamente la composición final.</p>
                </div>
                <DualScreenGraphic />
              </motion.article>

              <div className="grid gap-4 sm:grid-cols-2">
                <OperationCard icon="keyboard" title="Atajos que siguen tu ritmo" copy="Avanza, retrocede, activa blackout o muestra el logo sin buscar un botón." />
                <OperationCard icon="offline" title="Sigue incluso sin internet" copy="Trabaja en modo local y conserva los recursos esenciales en el dispositivo." />
                <OperationCard icon="install" title="Instalable como aplicación" copy="Ábrela desde tu equipo como cualquier otra herramienta de cabina." />
                <OperationCard icon="preview" title="Siempre sabes qué sigue" copy="Compara el slide en vivo con los siguientes antes de hacer el cambio." />
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section py-24 sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:px-10">
            <motion.div {...reveal}>
              <SectionEyebrow>Preguntas frecuentes</SectionEyebrow>
              <h2 className="landing-heading mt-4 text-balance text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl">Lo esencial, antes de comenzar.</h2>
              <p className="landing-muted mt-5 max-w-md text-base leading-7">Respuestas rápidas para preparar tu primera proyección con confianza.</p>
            </motion.div>
            <motion.div {...reveal} className="landing-faq divide-y">
              {faqItems.map(([question, answer], index) => (
                <details key={question} className="landing-faq-item group" open={index === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-left text-base font-extrabold sm:text-lg">
                    {question}
                    <span className="landing-faq-plus shrink-0" aria-hidden="true" />
                  </summary>
                  <p className="landing-muted max-w-2xl pb-6 pr-10 text-sm leading-7 sm:text-base">{answer}</p>
                </details>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="landing-section px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <motion.div {...reveal} className="landing-cta relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12 sm:py-24">
            <div className="landing-cta-orb landing-cta-orb-one" />
            <div className="landing-cta-orb landing-cta-orb-two" />
            <div className="relative z-10">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/55">Tu próxima reunión empieza aquí</p>
              <h2 className="mx-auto mt-5 max-w-4xl text-balance text-4xl font-black leading-[.98] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
                Que la tecnología acompañe el momento, no que lo interrumpa.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
                Prepara, diseña y proyecta con una herramienta creada para servir a tu equipo.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to={appPath} className="landing-cta-button group w-full sm:w-auto">
                  {hasSession ? 'Ir a mi espacio' : 'Crear mi espacio'}
                  <span className="transition-transform group-hover:translate-x-1"><ArrowIcon /></span>
                </Link>
                {!desktopInstall && <InstallAppButton className="landing-cta-install w-full sm:w-auto" label="Instalar aplicación" />}
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-lg bg-[#16111e] ring-1 ring-white/10">
              <img src={brandMark} alt="" className="h-9 w-9 object-contain" />
            </span>
            <span className="text-sm font-extrabold tracking-[-0.03em]">Wordship Screen</span>
          </div>
          <p className="landing-muted text-xs">Proyección clara para comunidades presentes.</p>
          <Link to={appPath} className="text-xs font-bold transition hover:opacity-60">
            {hasSession ? 'Abrir aplicación' : 'Iniciar sesión'} →
          </Link>
        </div>
      </footer>
      {desktopInstall && <DesktopInstall />}
    </div>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function NavButton({ target, children }: { target: string; children: React.ReactNode }) {
  return (
    <button type="button" className="landing-nav-link" onClick={() => scrollToSection(target)}>
      {children}
    </button>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="landing-kicker text-xs font-extrabold uppercase tracking-[0.18em]">{children}</p>
  );
}

function ProductPreview() {
  return (
    <div className="landing-product relative overflow-hidden rounded-[1.2rem] p-1.5 shadow-2xl sm:rounded-[1.75rem] sm:p-2">
      <div className="landing-product-inner overflow-hidden rounded-[0.9rem] sm:rounded-[1.25rem]">
        <div className="landing-product-bar flex h-11 items-center justify-between border-b px-3 sm:h-14 sm:px-5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#ff6577] sm:h-2.5 sm:w-2.5" />
            <span className="h-2 w-2 rounded-full bg-[#f6bd4f] sm:h-2.5 sm:w-2.5" />
            <span className="h-2 w-2 rounded-full bg-[#51c985] sm:h-2.5 sm:w-2.5" />
          </div>
          <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[.16em] opacity-50 sm:text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#51c985]" />
            Salida conectada
          </div>
          <div className="h-5 w-5 rounded-md bg-current opacity-10" />
        </div>

        <div className="grid min-h-[280px] grid-cols-[72px_1fr] sm:min-h-[430px] sm:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr_290px]">
          <aside className="landing-product-sidebar border-r p-2.5 sm:p-4">
            <p className="hidden text-[9px] font-extrabold uppercase tracking-[.18em] opacity-35 sm:block">Biblioteca</p>
            <div className="mt-2 space-y-1.5 sm:mt-4 sm:space-y-2">
              {['Gracia sublime', 'Eres fiel', 'Tu amor no falla', 'Santo por siempre'].map((song, index) => (
                <div key={song} className={`rounded-lg p-2 sm:px-3 sm:py-2.5 ${index === 0 ? 'landing-product-song-active' : 'opacity-55'}`}>
                  <div className="hidden text-[10px] font-bold sm:block">{song}</div>
                  <div className="mx-auto h-1.5 rounded-full bg-current opacity-25 sm:hidden" style={{ width: `${70 - index * 8}%` }} />
                  <div className="mt-1 hidden h-1 w-3/5 rounded-full bg-current opacity-15 sm:block" />
                </div>
              ))}
            </div>
            <div className="landing-product-add mt-3 hidden rounded-lg border border-dashed px-3 py-2 text-center text-[9px] font-bold sm:block">+ Nueva canción</div>
          </aside>

          <div className="landing-product-workspace min-w-0 p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between sm:mb-5">
              <div>
                <p className="text-[9px] font-extrabold sm:text-xs">Gracia sublime</p>
                <p className="mt-0.5 hidden text-[9px] opacity-40 sm:block">4 slides · Preparado</p>
              </div>
              <span className="rounded-full bg-[#7657e8]/10 px-2 py-1 text-[7px] font-extrabold text-[#7657e8] sm:px-3 sm:text-[9px]">EN VIVO</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                ['Quién rompe el poder', 'del pecado'],
                ['Su amor es fuerte', 'y poderoso'],
                ['El Rey de gloria', 'el Rey sobre todo'],
                ['Gracia sublime es', 'perfecto es tu amor'],
              ].map(([lineOne, lineTwo], index) => (
                <div key={lineOne} className={`landing-slide group relative aspect-video overflow-hidden rounded-lg sm:rounded-xl ${index === 0 ? 'landing-slide-active' : ''}`}>
                  <div className={`absolute inset-0 landing-slide-bg-${index + 1}`} />
                  <div className="absolute inset-0 bg-black/15" />
                  <p className="absolute inset-0 flex items-center justify-center px-2 text-center text-[5px] font-extrabold leading-tight text-white drop-shadow-md sm:text-[10px] lg:text-xs">
                    {lineOne}<br />{lineTwo}
                  </p>
                  <span className="absolute left-1.5 top-1.5 text-[5px] font-black text-white/50 sm:left-2 sm:top-2 sm:text-[8px]">{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="landing-product-preview hidden border-l p-4 lg:block">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] opacity-40">Vista en vivo</p>
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff6577]" />
            </div>
            <div className="landing-live-screen relative aspect-video overflow-hidden rounded-xl shadow-lg">
              <div className="landing-slide-bg-1 absolute inset-0 scale-110" />
              <div className="absolute inset-0 bg-black/25" />
              <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-extrabold leading-tight text-white drop-shadow-lg">
                Quién rompe el poder<br />del pecado
              </p>
            </div>
            <div className="mt-5 space-y-2.5">
              <div className="flex items-center justify-between text-[9px] font-bold"><span className="opacity-45">Fondo</span><span>Metallic Swirl</span></div>
              <div className="landing-control-track"><span className="w-[68%]" /></div>
              <div className="flex items-center justify-between text-[9px] font-bold"><span className="opacity-45">Tipografía</span><span>Manrope Bold</span></div>
              <div className="landing-control-track"><span className="w-[82%]" /></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function WorkflowDemo({ reduceMotion }: { reduceMotion: boolean }) {
  const demoRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(demoRef, { amount: 0.25 });
  const [activeStep, setActiveStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduceMotion || paused || !isInView) return;
    const interval = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % workflow.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [isInView, paused, reduceMotion]);

  const selected = workflow[activeStep];

  return (
    <div
      ref={demoRef}
      className="landing-workflow-shell grid overflow-hidden rounded-[2rem] lg:grid-cols-[.78fr_1.22fr]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="landing-workflow-nav p-3 sm:p-5" role="tablist" aria-label="Etapas de una proyección">
        {workflow.map((step, index) => {
          const active = activeStep === index;
          return (
            <button
              key={step.number}
              type="button"
              role="tab"
              aria-selected={active}
              className={`landing-workflow-tab relative w-full overflow-hidden rounded-2xl p-4 text-left sm:p-5 ${active ? 'is-active' : ''}`}
              onClick={() => setActiveStep(index)}
            >
              <span className="flex items-start gap-4">
                <span className="landing-workflow-number grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[10px] font-black tabular-nums">{step.number}</span>
                <span>
                  <span className="block text-sm font-extrabold sm:text-base">{step.title}</span>
                  <span className="landing-workflow-short mt-1 block text-xs leading-5 sm:text-sm">{step.short}</span>
                </span>
              </span>
              {active && !reduceMotion && !paused && <span key={`progress-${activeStep}`} className="landing-workflow-progress" />}
            </button>
          );
        })}
      </div>

      <div className="landing-workflow-stage flex min-h-[610px] flex-col p-5 sm:p-8">
        <div className="mb-6">
          <div className="max-w-2xl">
            <p className="landing-kicker text-[10px] font-extrabold uppercase tracking-[.18em]">Paso {selected.number}</p>
            <h3 className="mt-2 text-2xl font-black tracking-[-0.045em] sm:text-3xl">{selected.title}</h3>
            <p className="landing-muted mt-3 text-sm leading-6">{selected.description}</p>
          </div>
          <div className="mt-4 flex flex-wrap justify-start gap-1.5">
            {selected.details.map((detail) => <span key={detail} className="landing-detail-chip">{detail}</span>)}
          </div>
        </div>

        <div className="landing-workflow-browser min-h-0 flex-1 overflow-hidden rounded-2xl">
          <div className="landing-workflow-browser-bar flex h-11 items-center justify-between border-b px-4">
            <span className="flex gap-1.5"><i /><i /><i /></span>
            <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-white/35">Wordship Screen · Demo</span>
            <span className="h-5 w-5 rounded-md bg-white/[.06]" />
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeStep}
              initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="h-[390px] sm:h-[420px]"
            >
              <WorkflowPreview step={activeStep} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function WorkflowPreview({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="grid h-full grid-cols-[110px_1fr] bg-[#0c0b10] sm:grid-cols-[170px_1fr]">
        <div className="border-r border-white/[.07] bg-[#121017] p-3 sm:p-4">
          <p className="text-[8px] font-black uppercase tracking-[.16em] text-white/30">Canciones</p>
          <div className="mt-3 space-y-2">
            {['Gracia sublime', 'Digno y santo', 'Eres fiel', 'Libre soy'].map((song, index) => (
              <div key={song} className={`rounded-lg px-2.5 py-2 text-[8px] font-bold sm:text-[10px] ${index === 0 ? 'bg-[#7757df] text-white' : 'text-white/40'}`}>{song}</div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-white/10 py-2 text-center text-[8px] font-bold text-white/25">+ Añadir</div>
        </div>
        <div className="min-w-0 p-3 sm:p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] font-extrabold text-white sm:text-xs">Gracia sublime</p><p className="mt-1 text-[8px] text-white/30">Ordena arrastrando cada slide</p></div>
            <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[7px] font-bold text-emerald-300">GUARDADO</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
            {[1, 2, 3, 4].map((number) => (
              <div key={number} className="landing-mini-slide relative aspect-video overflow-hidden rounded-lg">
                <div className={`absolute inset-0 landing-slide-bg-${number}`} />
                <p className="absolute inset-0 grid place-items-center px-2 text-center text-[6px] font-black text-white sm:text-[9px]">{number === 1 ? 'Quién rompe el poder' : number === 2 ? 'Su amor es fuerte' : number === 3 ? 'El Rey de gloria' : 'Gracia sublime es'}</p>
                <span className="absolute left-1.5 top-1 text-[6px] font-black text-white/40">{number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="grid h-full grid-cols-[120px_1fr] bg-[#0c0b10] sm:grid-cols-[190px_1fr]">
        <div className="border-r border-white/[.07] bg-[#121017] p-3 sm:p-4">
          <p className="text-[8px] font-black uppercase tracking-[.16em] text-white/30">Personalizar</p>
          <label className="mt-4 block text-[8px] font-bold text-white/40">Tipografía</label>
          <div className="mt-1.5 rounded-lg bg-white/[.06] px-2.5 py-2 text-[8px] font-bold text-white/70">Manrope ExtraBold</div>
          <label className="mt-4 block text-[8px] font-bold text-white/40">Tamaño</label>
          <div className="mt-2 h-1 rounded-full bg-white/10"><span className="block h-full w-[72%] rounded-full bg-[#8a65ee]" /></div>
          <label className="mt-4 block text-[8px] font-bold text-white/40">Fondo</label>
          <div className="mt-2 grid grid-cols-3 gap-1.5">{[1, 2, 3].map((item) => <span key={item} className={`landing-slide-bg-${item} aspect-square rounded-md ${item === 1 ? 'ring-2 ring-[#a88dff]' : ''}`} />)}</div>
        </div>
        <div className="grid place-items-center p-4 sm:p-7">
          <div className="relative aspect-video w-full max-w-xl overflow-hidden rounded-xl shadow-2xl">
            <div className="landing-scene-aurora absolute inset-0" />
            <div className="absolute inset-0 bg-black/20" />
            <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-lg font-black leading-tight text-white drop-shadow-xl sm:text-3xl">Tu gracia me encontró<br />y hoy puedo ver</p>
            <span className="absolute bottom-3 left-3 rounded-full bg-black/25 px-2 py-1 text-[7px] font-bold text-white/55 backdrop-blur">VISTA PREVIA</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="h-full bg-[#0c0b10] p-4 sm:p-6">
        <div className="flex items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.04] px-3 py-2.5">
          <SearchIcon />
          <span className="text-[10px] text-white/55">Juan 3:16</span>
          <span className="ml-auto rounded-md bg-[#7657df] px-2.5 py-1 text-[8px] font-bold text-white">Buscar</span>
        </div>
        <div className="mt-4 grid h-[calc(100%-58px)] gap-3 sm:grid-cols-[1fr_160px]">
          <div className="overflow-hidden rounded-xl border border-white/[.07] bg-[#121017] p-4">
            <div className="flex items-center justify-between"><p className="text-[10px] font-black text-white">Juan 3</p><span className="text-[8px] text-white/30">NVI</span></div>
            <div className="mt-4 space-y-2">
              {[15, 16, 17, 18].map((verse) => (
                <div key={verse} className={`rounded-lg p-2.5 text-[8px] leading-4 sm:text-[10px] ${verse === 16 ? 'bg-[#7657df]/25 text-white ring-1 ring-[#8e72e8]/50' : 'text-white/38'}`}>
                  <b className="mr-2 text-[#aa94ff]">{verse}</b>{verse === 16 ? 'Porque tanto amó Dios al mundo, que dio a su Hijo unigénito…' : 'Texto del pasaje seleccionado para preparar la lectura…'}
                </div>
              ))}
            </div>
          </div>
          <div className="hidden rounded-xl border border-white/[.07] bg-[#121017] p-3 sm:block">
            <p className="text-[8px] font-black uppercase tracking-[.14em] text-white/30">Selección</p>
            <div className="landing-slide-bg-3 relative mt-3 aspect-video overflow-hidden rounded-lg"><p className="absolute inset-0 grid place-items-center px-3 text-center text-[7px] font-bold text-white">Porque tanto amó Dios al mundo…</p></div>
            <button className="mt-3 w-full rounded-lg bg-[#7657df] py-2 text-[8px] font-bold text-white">Crear slide</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full bg-[#0c0b10] p-3 sm:grid-cols-[1fr_155px] sm:p-5">
      <div className="min-w-0 sm:pr-4">
        <div className="mb-3 flex items-center justify-between"><span className="text-[8px] font-black uppercase tracking-[.16em] text-white/35">Salida principal</span><span className="flex items-center gap-1.5 text-[8px] font-bold text-emerald-300"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> EN VIVO</span></div>
        <div className="relative aspect-video overflow-hidden rounded-xl shadow-2xl">
          <div className="landing-scene-pulse absolute inset-0" /><div className="absolute inset-0 bg-black/20" />
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-lg font-black leading-tight text-white sm:text-2xl">Hay libertad<br />en este lugar</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button className="rounded-lg bg-white/[.06] py-2 text-[8px] font-bold text-white/50">← Anterior</button>
          <button className="rounded-lg bg-black py-2 text-[8px] font-bold text-white/70 ring-1 ring-white/10">Blackout</button>
          <button className="rounded-lg bg-[#7657df] py-2 text-[8px] font-bold text-white">Siguiente →</button>
        </div>
      </div>
      <div className="hidden border-l border-white/[.07] pl-4 sm:block">
        <p className="text-[8px] font-black uppercase tracking-[.16em] text-white/30">A continuación</p>
        {[3, 4].map((item) => <div key={item} className="relative mt-3 aspect-video overflow-hidden rounded-lg"><div className={`absolute inset-0 landing-slide-bg-${item}`} /><p className="absolute inset-0 grid place-items-center px-2 text-center text-[7px] font-bold text-white">{item === 3 ? 'Tu amor no falla' : 'Siempre cantaré'}</p></div>)}
      </div>
    </div>
  );
}

function VisualPlayground() {
  const [activeScene, setActiveScene] = useState(0);
  const scene = visualScenes[activeScene];

  return (
    <div className="landing-visual-shell grid overflow-hidden rounded-[2rem] lg:grid-cols-[1fr_300px]">
      <div className="landing-visual-display relative min-h-[430px] overflow-hidden sm:min-h-[590px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={scene.id} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: .45 }} className={`landing-scene-${scene.id} absolute inset-0`} />
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/20" />
        <div className="landing-visual-noise absolute inset-0 opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={scene.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="max-w-3xl text-center text-3xl font-black leading-[1.05] tracking-[-0.04em] text-white drop-shadow-2xl sm:text-5xl lg:text-6xl">
              {scene.copy[0]}<br />{scene.copy[1]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] text-white/70 backdrop-blur-md"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> Vista en vivo</div>
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-[9px] font-bold text-white/50"><span>16:9 · 1920 × 1080</span><span>Animación en tiempo real</span></div>
      </div>

      <div className="landing-visual-picker p-4 sm:p-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[.18em] opacity-40">Elige una atmósfera</p>
        <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-1">
          {visualScenes.map((item, index) => (
            <button key={item.id} type="button" aria-pressed={activeScene === index} onClick={() => setActiveScene(index)} className={`landing-scene-button flex items-center gap-3 rounded-xl p-2.5 text-left ${activeScene === index ? 'is-active' : ''}`}>
              <span className={`landing-scene-${item.id} h-11 w-14 shrink-0 rounded-lg`} />
              <span><span className="block text-xs font-extrabold">{item.name}</span><span className="landing-muted mt-0.5 hidden text-[10px] lg:block">{item.mood}</span></span>
            </button>
          ))}
        </div>
        <div className="landing-visual-settings mt-6 rounded-xl p-4">
          <div className="flex items-center justify-between text-[10px] font-bold"><span className="opacity-45">Movimiento</span><span>Suave</span></div>
          <div className="mt-2 h-1 rounded-full bg-current/10"><span className="block h-full w-[64%] rounded-full bg-[#8564e7]" /></div>
          <div className="mt-4 flex items-center justify-between text-[10px] font-bold"><span className="opacity-45">Contraste</span><span>82%</span></div>
          <div className="mt-2 h-1 rounded-full bg-current/10"><span className="block h-full w-[82%] rounded-full bg-[#d75dc7]" /></div>
        </div>
      </div>
    </div>
  );
}

type OperationIconName = 'keyboard' | 'offline' | 'install' | 'preview';

function OperationCard({ icon, title, copy }: { icon: OperationIconName; title: string; copy: string }) {
  return (
    <motion.article whileHover={{ y: -4 }} className="landing-operation-card rounded-[1.5rem] p-6">
      <span className="landing-operation-icon"><OperationIcon name={icon} /></span>
      <h3 className="mt-7 text-xl font-extrabold leading-tight tracking-[-0.035em]">{title}</h3>
      <p className="landing-muted mt-3 text-sm leading-6">{copy}</p>
    </motion.article>
  );
}

function DualScreenGraphic() {
  return (
    <div className="absolute inset-x-7 bottom-8 sm:inset-x-10">
      <div className="relative mx-auto max-w-[520px]">
        <div className="landing-screen-control relative z-10 w-[72%] rounded-xl p-2 shadow-2xl">
          <div className="flex h-5 items-center gap-1 border-b border-white/[.07] px-1"><i /><i /><i /></div>
          <div className="grid grid-cols-[28%_1fr] gap-2 p-2"><div className="space-y-1.5">{[1,2,3,4].map((n) => <span key={n} className={`block h-3 rounded ${n === 1 ? 'bg-[#7757df]' : 'bg-white/[.06]'}`} />)}</div><div className="grid grid-cols-2 gap-1.5">{[1,2,3,4].map((n) => <span key={n} className={`landing-slide-bg-${n} aspect-video rounded`} />)}</div></div>
        </div>
        <div className="landing-screen-output absolute -right-1 bottom-[-12px] z-20 w-[48%] rounded-xl p-1.5 shadow-2xl sm:-right-3">
          <div className="landing-scene-halo relative aspect-video overflow-hidden rounded-lg"><p className="absolute inset-0 grid place-items-center text-center text-[8px] font-black text-white sm:text-xs">Santo por siempre</p></div>
        </div>
        <svg className="absolute -bottom-5 left-[48%] z-0 h-24 w-40 overflow-visible" viewBox="0 0 160 96" aria-hidden="true"><path d="M5 15 C80 15, 55 80, 155 80" fill="none" stroke="rgba(173,148,255,.5)" strokeDasharray="4 5" /><circle cx="5" cy="15" r="4" fill="#9d86ff" /><circle cx="155" cy="80" r="4" fill="#ff6f9e" /></svg>
      </div>
    </div>
  );
}

function OperationIcon({ name }: { name: OperationIconName }) {
  if (name === 'keyboard') return <svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h.01M11 10h.01M15 10h.01M18 10h.01M8 14h8" /></svg>;
  if (name === 'offline') return <svg viewBox="0 0 24 24"><path d="M5 16.5a4.5 4.5 0 0 1 1.7-8.67A6.5 6.5 0 0 1 18.7 9.4 3.8 3.8 0 0 1 19 17H8" /><path d="m9 14-3 3 3 3M3 3l18 18" /></svg>;
  if (name === 'install') return <svg viewBox="0 0 24 24"><path d="M12 3v11m0 0 4-4m-4 4-4-4" /><path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" /></svg>;
  return <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4M7 9h4M7 12h7" /></svg>;
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-white/35 stroke-2"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>;
}

function AnimatedBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
      <span className="landing-feature-orb landing-feature-orb-one" />
      <span className="landing-feature-orb landing-feature-orb-two" />
      <span className="landing-feature-rings" />
    </div>
  );
}

type FeatureIconName = 'library' | 'screen' | 'sparkles' | 'bible';

function FeatureIcon({ name }: { name: FeatureIconName }) {
  if (name === 'library') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h11a2 2 0 0 1 2 2V20H6a2 2 0 0 1-2-2V5.5Z" /><path d="M7 4h11a2 2 0 0 1 2 2v11" /><path d="M8 10h5M8 14h5" /></svg>;
  }
  if (name === 'screen') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /><path d="m10 8 5 2.5-5 2.5V8Z" /></svg>;
  }
  if (name === 'sparkles') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c.5 4.9 3.1 7.5 8 8-4.9.5-7.5 3.1-8 8-.5-4.9-3.1-7.5-8-8 4.9-.5 7.5-3.1 8-8Z" /><path d="M19 16c.2 2 1.3 3.1 3 3.5-1.7.4-2.8 1.5-3 3.5-.2-2-1.3-3.1-3-3.5 1.7-.4 2.8-1.5 3-3.5Z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3H4V5.5Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H14v18a3 3 0 0 1 3-3h3V5.5Z" /></svg>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]"><path d="M4 10h12M11 5l5 5-5 5" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current stroke-2"><path d="m5 10 3 3 7-7" /></svg>;
}

function PlayIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current"><path d="m7 5 8 5-8 5V5Z" /></svg>;
}

function SunIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.8]"><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></svg>;
}

function MoonIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.8]"><path d="M20.5 15.2A8.8 8.8 0 0 1 8.8 3.5 9 9 0 1 0 20.5 15.2Z" /></svg>;
}
