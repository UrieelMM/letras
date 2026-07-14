import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/** Captura errores de render para no dejar la app en blanco. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Error de render capturado:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-ink-900 p-6 text-white">
          <div className="glass max-w-md rounded-2xl p-7 text-center">
            <h1 className="mb-2 text-lg font-bold">Algo salió mal</h1>
            <p className="mb-5 text-sm text-white/60">
              Ocurrió un error inesperado. Recarga la página para continuar.
            </p>
            <button className="btn-accent mx-auto" onClick={() => location.reload()}>
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
