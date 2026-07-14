import { create } from 'zustand';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
}

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  configured: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: isFirebaseConfigured,
  configured: isFirebaseConfigured,

  async signInEmail(email, password) {
    if (!auth) return;
    await signInWithEmailAndPassword(auth, email, password);
  },
  async signUpEmail(name, email, password) {
    if (!auth) return;
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    set({
      user: { uid: cred.user.uid, email: cred.user.email, name: name || cred.user.email },
    });
  },
  async signInGoogle() {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      // Si el navegador bloquea el popup (o COOP lo interrumpe), usa redirect.
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        code === 'auth/internal-error'
      ) {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw e;
    }
  },
  async resetPassword(email) {
    if (!auth) return;
    await sendPasswordResetEmail(auth, email);
  },
  async signOutUser() {
    if (!auth) return;
    await signOut(auth);
  },
}));

// Listener de sesión (se inicializa una sola vez al cargar el módulo).
if (isFirebaseConfigured && auth) {
  // Completa el inicio con Google si se hizo por redirect.
  getRedirectResult(auth).catch(() => {});
  onAuthStateChanged(auth, (u) => {
    useAuthStore.setState({
      user: u
        ? { uid: u.uid, email: u.email, name: u.displayName ?? u.email }
        : null,
      loading: false,
    });
  });
} else {
  useAuthStore.setState({ loading: false });
}
