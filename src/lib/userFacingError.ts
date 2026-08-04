interface CodedError {
  code?: unknown;
}

function errorCode(error: unknown): string {
  const code = (error as CodedError | null)?.code;
  if (typeof code !== 'string') return '';
  return code.replace(/^firestore\//, '');
}

function browserIsOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/** Convierte errores de Firestore en instrucciones útiles sin culpar siempre a la red. */
export function libraryLoadErrorMessage(error: unknown): string {
  const code = errorCode(error);

  switch (code) {
    case 'permission-denied':
      return 'Firebase rechazó el acceso a tu biblioteca. Publica las reglas de Firestore y verifica que la sesión use el mismo proyecto.';
    case 'unauthenticated':
      return 'Tu sesión ya no es válida. Cierra sesión y vuelve a entrar.';
    case 'not-found':
      return 'No se encontró la base de datos de Firestore. Créala o revisa el proyecto configurado.';
    case 'failed-precondition':
      return 'Firestore todavía no está listo para esta operación. Revisa la configuración de la base de datos.';
    case 'resource-exhausted':
      return 'Se alcanzó la cuota de Firestore. Revisa el uso y la facturación del proyecto.';
    case 'deadline-exceeded':
    case 'unavailable':
      return browserIsOffline()
        ? 'No tienes conexión y esta biblioteca aún no está disponible sin internet.'
        : 'Firestore no respondió a tiempo. El servicio puede estar temporalmente no disponible; vuelve a intentarlo.';
    default:
      return code
        ? `No se pudo cargar tu biblioteca (código: ${code}). Vuelve a intentarlo.`
        : 'No se pudo cargar tu biblioteca por un error inesperado. Vuelve a intentarlo.';
  }
}

/** Mensaje para fallos de fetch, que también pueden ser CORS o una caída del proveedor. */
export function remoteServiceErrorMessage(service: string): string {
  return browserIsOffline()
    ? `No tienes conexión a internet. ${service} necesita acceso a la red.`
    : `${service} no respondió. Puede estar temporalmente fuera de servicio o la solicitud puede estar bloqueada por el navegador.`;
}
