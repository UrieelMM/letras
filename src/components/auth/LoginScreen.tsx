import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';

export function LoginScreen() {
  const { signInEmail, signUpEmail, signInGoogle, resetPassword } = useAuthStore();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    try {
      await signInGoogle();
    } catch (err) {
      toast.error(friendlyError(err));
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
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink-900 p-4 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-40">
        <div
          className="absolute -inset-1/4 animate-mesh-move blur-3xl"
          style={{
            background:
              'radial-gradient(40% 40% at 30% 30%, #7c5cff 0%, transparent 60%), radial-gradient(45% 45% at 70% 60%, #9d86ff 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="glass w-full max-w-sm rounded-2xl p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-lg font-black shadow-glow">
            L
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">Letras</h1>
            <p className="text-xs text-white/40">Proyección para iglesias</p>
          </div>
        </div>

        <div className="mb-5 flex gap-1 rounded-lg bg-ink-900/80 p-1">
          {(['in', 'up'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === m ? 'bg-accent text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              {m === 'in' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'up' && (
            <div>
              <label className="label">Nombre</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre o el de tu iglesia"
              />
            </div>
          )}
          <div>
            <label className="label">Correo</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {mode === 'up' && (
            <div>
              <label className="label">Confirmar contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          )}

          <button type="submit" className="btn-accent w-full" disabled={busy}>
            {busy ? 'Espera...' : mode === 'in' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        {mode === 'in' && (
          <button
            onClick={forgot}
            className="mt-2 w-full text-center text-xs text-white/40 hover:text-white"
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}

        <div className="my-4 flex items-center gap-3 text-xs text-white/30">
          <div className="h-px flex-1 bg-white/10" />o<div className="h-px flex-1 bg-white/10" />
        </div>

        <button onClick={google} className="btn-soft w-full" disabled={busy}>
          Continuar con Google
        </button>
      </div>
    </div>
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
    default:
      return 'No se pudo completar. Intenta de nuevo.';
  }
}
