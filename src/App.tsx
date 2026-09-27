import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ControlView } from './components/control/ControlView';
import { OutputView } from './components/output/OutputView';
import { LoginScreen } from './components/auth/LoginScreen';
import { useAuthStore } from './store/authStore';
import { useStore } from './store/useStore';
import { toast } from './store/toastStore';
import { Toaster } from './components/Toaster';
import { ErrorBoundary } from './components/ErrorBoundary';
import { createChannel } from './sync/channel';
import { libraryLoadErrorMessage } from './lib/userFacingError';
import { LandingPage } from './components/landing/LandingPage';

function Splash({ label }: { label: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-900 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-accent" />
        <p className="text-sm text-white/50">{label}</p>
      </div>
    </div>
  );
}

function LibraryLoadFailure({
  message,
  onRetry,
  onSignOut,
}: {
  message: string;
  onRetry: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-900 p-6 text-white">
      <div className="glass max-w-lg rounded-2xl p-7 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-red-400/10 text-xl text-red-200">
          !
        </div>
        <h1 className="mb-2 text-lg font-bold">No se pudo abrir tu biblioteca</h1>
        <p className="text-sm leading-relaxed text-white/60">{message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button className="btn-accent" onClick={onRetry}>
            Reintentar
          </button>
          <button className="btn-ghost" onClick={onSignOut}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

/** Ventana de control: conecta el store con el canal de sincronización. */
function ControlRoute() {
  const setPublisher = useStore((s) => s.setPublisher);

  useEffect(() => {
    const channel = createChannel();
    setPublisher((live) => channel.post({ type: 'LIVE', payload: live }));
    const unsub = channel.subscribe((msg) => {
      if (msg.type === 'REQUEST_STATE') {
        channel.post({ type: 'LIVE', payload: useStore.getState().live });
      }
    });
    return () => {
      unsub();
      channel.close();
    };
  }, [setPublisher]);

  return <ControlView />;
}

/** Ruta protegida: requiere sesión y carga los datos del usuario. */
function ControlGate() {
  const { user, loading, configured, localMode, signOutUser } = useAuthStore();
  const ready = useStore((s) => s.ready);
  const init = useStore((s) => s.init);
  const reset = useStore((s) => s.reset);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    const useLocalLibrary = localMode || !configured;
    if (loading && !useLocalLibrary) return;
    const userId = useLocalLibrary ? 'local' : user?.uid;
    if (!userId) {
      reset();
      setLoadError(null);
      return;
    }
    let active = true;
    setLoadError(null);
    init(userId).catch((error) => {
      if (!active) return;
      console.error(error);
      const message = libraryLoadErrorMessage(error);
      setLoadError(message);
      toast.error(message);
    });
    return () => {
      active = false;
    };
  }, [user, loading, configured, localMode, init, reset, retryAttempt]);

  const useLocalLibrary = localMode || !configured;
  if (loading && !useLocalLibrary) return <Splash label="Cargando..." />;
  if (!useLocalLibrary && !user) return <Navigate to="/login" replace />;
  if (loadError) {
    return (
      <LibraryLoadFailure
        message={loadError}
        onRetry={() => setRetryAttempt((attempt) => attempt + 1)}
        onSignOut={() => {
          void signOutUser().catch((error) => {
            console.error(error);
            toast.error('No se pudo cerrar la sesión. Vuelve a intentarlo.');
          });
        }}
      />
    );
  }
  if (!ready) return <Splash label="Preparando tu biblioteca..." />;
  return <ControlRoute />;
}

function LoginRoute() {
  const { user, loading, configured, localMode } = useAuthStore();

  if (loading && configured && !localMode) return <Splash label="Cargando..." />;
  if (user || localMode) return <Navigate to="/app" replace />;
  return <LoginScreen />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/app" element={<ControlGate />} />
          <Route path="/output" element={<OutputView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      <Toaster />
    </ErrorBoundary>
  );
}
