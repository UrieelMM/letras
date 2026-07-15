import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import MetallicSwirl from '../metallic-swirl';
import loginLogo from '../../assets/2.png';

export function LoginScreen() {
  const { signInEmail, signUpEmail, signInGoogle, resetPassword } = useAuthStore();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleError, setGoogleError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'up' && password !== confirm) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'in') {
        await signInEmail(email, password);
      } else {
        await signUpEmail(name, email, password);
        toast.success('¡Cuenta creada! Bienvenido.');
      }
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setGoogleError('');
    setBusy(true);
    try {
      await signInGoogle();
    } catch (err) {
      const message = friendlyError(err);
      setGoogleError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!email) {
      toast.error('Escribe tu correo para enviarte el enlace.');
      return;
    }
    try {
      await resetPassword(email);
      toast.success('Te enviamos un correo para restablecer tu contraseña.');
    } catch (err) {
      toast.error(friendlyError(err));
    }
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#080617] px-4 py-6 text-white sm:px-6 lg:grid lg:place-items-center lg:py-8"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <div className="pointer-events-none absolute inset-0">
        <MetallicSwirl
          width="100%"
          height="100%"
          className="absolute inset-0"
          speed={0.28}
          zoom={5}
          colorPhaseR={1.05}
          colorPhaseG={3.05}
          colorPhaseB={0.55}
          colorRange={0.48}
          colorBias={0.38}
          brightness={0.9}
          backgroundColor="#080617"
          opacity={0.72}
        />
        <div className="absolute inset-0 bg-indigo-600/80 mix-blend-color" />
        <div className="absolute inset-0 bg-[#0a071a]/55" />
        <div className="absolute -left-24 top-[-16rem] h-[34rem] w-[34rem] rounded-full bg-accent/20 blur-[110px]" />
        <div className="absolute -bottom-72 right-[-8rem] h-[38rem] w-[38rem] rounded-full bg-indigo-400/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.22) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'linear-gradient(to bottom, black, transparent 85%)',
          }}
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0a1b]/85 shadow-[0_32px_100px_rgba(0,0,0,.55)] backdrop-blur-xl lg:min-h-[680px] lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative flex min-h-[340px] flex-col overflow-hidden border-b border-white/10 p-7 sm:p-10 lg:min-h-0 lg:border-b-0 lg:border-r lg:p-14">
          <div className="absolute right-[-12rem] top-20 h-[28rem] w-[28rem] rounded-full border border-accent/20" />
          <div className="absolute right-[-7rem] top-40 h-[20rem] w-[20rem] rounded-full border border-accent/10" />

          <div className="relative rounded-2xl bg-[#f4f2f8]/95 shadow-[0_10px_35px_rgba(0,0,0,.18)]" style={{ backdropFilter: 'blur(12px)', width: 'fit-content' }}>
            <div className="relative h-[72px] w-[190px] px-[20px] py-[50px] overflow-hidden">
              <img
                src={loginLogo}
                alt="Wordship Screen"
                className="absolute left-1/2 top-1/2 h-52 w-52 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
              />
            </div>
          </div>

          <div className="relative my-auto max-w-xl py-10 lg:py-14">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-soft" />
              Proyección en tiempo real
            </div>
            <h1 className="max-w-lg text-4xl font-extrabold leading-[1.02] tracking-[-0.055em] text-[#f1f4eb] sm:text-5xl lg:text-[3.65rem]">
              La letra correcta, justo a tiempo.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/48 sm:text-base">
              Prepara canciones, diseña escenas y controla cada pantalla desde un solo lugar.
            </p>
          </div>

          <div className="relative hidden overflow-hidden rounded-2xl border border-white/10 bg-[#080617]/75 p-5 shadow-2xl sm:block">
            <div className="mb-7 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                <span className="h-2 w-2 rounded-full bg-accent-soft" />
                Vista de escenario
              </div>
              <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] text-white/40">EN VIVO</span>
            </div>
            <p className="text-center text-2xl font-bold leading-snug tracking-[-0.025em] text-[#f7f6ee]">
              Tu gracia me encontró<br />
              y hoy puedo ver
            </p>
            <div className="mt-7 flex items-center justify-center gap-1.5">
              <span className="h-1 w-8 rounded-full bg-accent" />
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="h-1 w-1 rounded-full bg-white/20" />
            </div>
          </div>
        </section>

        <section className="flex items-center bg-[#f4f2f8] p-6 text-[#171322] sm:p-10 lg:p-14">
          <div className="mx-auto w-full max-w-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#71678b]">
              {mode === 'in' ? 'Bienvenido de nuevo' : 'Comienza hoy'}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-[#171322]">
              {mode === 'in' ? 'Entra a tu espacio' : 'Crea tu espacio'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#716b7d]">
              {mode === 'in'
                ? 'Tu biblioteca y tus temas están listos para continuar.'
                : 'Organiza las canciones y proyecciones de tu iglesia.'}
            </p>

            <div className="my-7 grid grid-cols-2 gap-1 rounded-xl bg-[#e5e1ed] p-1">
              {(['in', 'up'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${
                    mode === m
                      ? 'bg-white text-[#171322] shadow-[0_3px_12px_rgba(39,28,68,.1)]'
                      : 'text-[#7b738d] hover:text-[#171322]'
                  }`}
                >
                  {m === 'in' ? 'Iniciar sesión' : 'Crear cuenta'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'up' && (
                <AuthField label="Nombre">
                  <input
                    className={AUTH_INPUT_CLASS}
                    aria-label="Nombre"
                    value={name}
                    autoComplete="name"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre o el de tu iglesia"
                  />
                </AuthField>
              )}
              <AuthField label="Correo">
                <input
                  type="email"
                  required
                  className={AUTH_INPUT_CLASS}
                  aria-label="Correo"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                />
              </AuthField>
              <AuthField
                label="Contraseña"
                action={
                  mode === 'in' ? (
                    <button type="button" onClick={forgot} className="font-semibold text-[#6847d8] hover:text-[#4d2eaf]">
                      ¿La olvidaste?
                    </button>
                  ) : undefined
                }
              >
                <input
                  type="password"
                  required
                  minLength={6}
                  className={AUTH_INPUT_CLASS}
                  aria-label="Contraseña"
                  value={password}
                  autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </AuthField>
              {mode === 'up' && (
                <AuthField label="Confirmar contraseña">
                  <input
                    type="password"
                    required
                    minLength={6}
                    className={AUTH_INPUT_CLASS}
                    aria-label="Confirmar contraseña"
                    value={confirm}
                    autoComplete="new-password"
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repite tu contraseña"
                  />
                </AuthField>
              )}

              <button
                type="submit"
                className="mt-1 flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(91,64,190,.24)] transition hover:-translate-y-0.5 hover:bg-accent-soft disabled:translate-y-0 disabled:cursor-wait disabled:opacity-55"
                disabled={busy}
              >
                {busy ? 'Procesando...' : mode === 'in' ? 'Entrar a Wordship Screen' : 'Crear mi cuenta'}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b95a8]">
              <div className="h-px flex-1 bg-[#d8d3e0]" />o continúa con<div className="h-px flex-1 bg-[#d8d3e0]" />
            </div>

            <button
              type="button"
              onClick={google}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#d4cfdd] bg-white px-4 py-3 text-sm font-bold text-[#292334] transition hover:border-[#aaa1bc] hover:bg-[#fbfaff] disabled:cursor-wait disabled:opacity-55"
              disabled={busy}
            >
              <GoogleIcon />
              Continuar con Google
            </button>
            {googleError && (
              <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">
                {googleError}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const AUTH_INPUT_CLASS =
  'w-full rounded-xl border border-[#d4cfdd] bg-white px-3.5 py-3 text-sm text-[#201a2b] outline-none transition placeholder:text-[#a39cab] focus:border-accent focus:ring-4 focus:ring-accent/15';

function AuthField({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#50485f]">
        {label}
        {action}
      </span>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.87A6.02 6.02 0 0 1 6.08 12c0-.65.11-1.28.31-1.87V7.51H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.49l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 6c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.62C7.18 7.76 9.39 6 12 6Z" />
    </svg>
  );
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    case 'auth/email-already-in-use':
      return 'Ese correo ya tiene una cuenta.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'Correo no válido.';
    case 'auth/popup-closed-by-user':
      return 'Se cerró la ventana de Google.';
    case 'auth/unauthorized-domain':
      return `El dominio ${window.location.hostname} no está autorizado en Firebase Authentication. Agrégalo en Settings → Authorized domains.`;
    case 'auth/operation-not-allowed':
      return 'El acceso con Google no está habilitado en Firebase Authentication.';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana de Google. Permite ventanas emergentes para este sitio e inténtalo otra vez.';
    case 'auth/cancelled-popup-request':
      return 'Ya hay una ventana de acceso abierta. Complétala o ciérrala antes de intentarlo otra vez.';
    case 'auth/network-request-failed':
      return 'No se pudo conectar con Google. Revisa la conexión e inténtalo otra vez.';
    case 'auth/account-exists-with-different-credential':
      return 'Ya existe una cuenta con ese correo usando otro método de acceso.';
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'La configuración de Firebase usa una API key inválida.';
    case 'auth/web-storage-unsupported':
      return 'El navegador está bloqueando el almacenamiento necesario para iniciar sesión.';
    default:
      return 'No se pudo completar. Intenta de nuevo.';
  }
}
