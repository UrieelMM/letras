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

export function resourceUploadErrorMessage(error: unknown): string {
  const code = errorCode(error);
  switch (code) {
    case 'storage/no-default-bucket':
    case 'storage/bucket-not-found':
    case 'storage/project-not-found':
      return 'Firebase Storage no encontró el bucket. Habilita Storage en Firebase Console y revisa VITE_FIREBASE_STORAGE_BUCKET.';
    case 'storage/quota-exceeded':
      return 'Firebase Storage rechazó la carga. Revisa el plan Blaze, la facturación y la cuota del proyecto.';
    case 'storage/unauthenticated':
    case 'unauthenticated':
      return 'Tu sesión ya no es válida. Cierra sesión y vuelve a entrar.';
    case 'storage/unauthorized':
      return 'Firebase Storage rechazó la carga. Revisa que las reglas de Storage permitan guardar archivos en tu cuenta.';
    case 'storage/unauthorized-app':
      return 'Firebase Storage rechazó esta aplicación. Revisa la configuración de Firebase App Check.';
    case 'permission-denied':
      return 'Firestore rechazó el registro del recurso. Revisa las reglas de Firestore para tu cuenta.';
    case 'storage/retry-limit-exceeded':
    case 'storage/unknown':
      return browserIsOffline()
        ? 'No tienes conexión. Conéctate a internet para subir el recurso.'
        : 'No se pudo completar la carga a Firebase Storage. Verifica en Firebase Console que Storage esté habilitado y que el bucket coincida con el configurado en la app.';
    default:
      return !code && error instanceof Error && error.message
        ? error.message
        : 'No se pudo guardar el recurso. Vuelve a intentarlo.';
  }
}

/** Mensaje para fallos de fetch, que también pueden ser CORS o una caída del proveedor. */
export function remoteServiceErrorMessage(service: string): string {
  return browserIsOffline()
    ? `No tienes conexión a internet. ${service} necesita acceso a la red.`
    : `${service} no respondió. Puede estar temporalmente fuera de servicio o la solicitud puede estar bloqueada por el navegador.`;
}
