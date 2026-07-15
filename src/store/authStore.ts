import { create } from 'zustand';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
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
    provider.setCustomParameters({ prompt: 'select_account' });
    // Popup evita los problemas de almacenamiento cross-origin del flujo redirect
    // cuando la app se publica fuera de Firebase Hosting.
    await signInWithPopup(auth, provider);
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
  auth.languageCode = 'es';
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
