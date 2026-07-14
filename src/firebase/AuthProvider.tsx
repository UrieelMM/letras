// La autenticación se migró a un store de zustand: ../store/authStore.
// Este archivo se mantiene solo por compatibilidad de imports.
export { useAuthStore as useAuth } from '../store/authStore';
export type { SessionUser } from '../store/authStore';
