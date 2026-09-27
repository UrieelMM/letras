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
  localMode: boolean;
  useOfflineMode: () => void;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const OFFLINE_SESSION_KEY = 'wordship.auth.offline-session.v1';
const LOCAL_MODE_KEY = 'wordship.auth.local-mode.v1';

function readOfflineSession(): SessionUser | null {
  try {
    const value = localStorage.getItem(OFFLINE_SESSION_KEY);
    if (!value) return null;
    const session = JSON.parse(value) as Partial<SessionUser>;
    return typeof session.uid === 'string'
      ? {
          uid: session.uid,
          email: typeof session.email === 'string' ? session.email : null,
          name: typeof session.name === 'string' ? session.name : null,
        }
      : null;
  } catch {
    return null;
  }
}

function saveOfflineSession(session: SessionUser | null): void {
  try {
    if (session) localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(OFFLINE_SESSION_KEY);
  } catch {
    // Firebase Auth conserva su propia sesión; este espejo sólo acelera el modo offline.
  }
}

function readLocalMode(): boolean {
  try {
    return localStorage.getItem(LOCAL_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveLocalMode(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(LOCAL_MODE_KEY, 'true');
    else localStorage.removeItem(LOCAL_MODE_KEY);
  } catch {
    // El estado en memoria sigue permitiendo trabajar durante esta sesión.
  }
}

const offlineSession = readOfflineSession();
const initialLocalMode = !isFirebaseConfigured || readLocalMode();

export const useAuthStore = create<AuthState>((set) => ({
  user: offlineSession,
  loading: isFirebaseConfigured && !offlineSession && !initialLocalMode,
  configured: isFirebaseConfigured,
  localMode: initialLocalMode,

  useOfflineMode() {
    saveLocalMode(true);
    set({ localMode: true, loading: false });
  },

  async signInEmail(email, password) {
    if (!auth) return;
    await signInWithEmailAndPassword(auth, email, password);
    saveLocalMode(false);
    set({ localMode: false });
  },
  async signUpEmail(name, email, password) {
    if (!auth) return;
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    saveLocalMode(false);
    set({
      user: { uid: cred.user.uid, email: cred.user.email, name: name || cred.user.email },
      localMode: false,
    });
  },
  async signInGoogle() {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    // Popup evita los problemas de almacenamiento cross-origin del flujo redirect
    // cuando la app se publica fuera de Firebase Hosting.
    await signInWithPopup(auth, provider);
    saveLocalMode(false);
    set({ localMode: false });
  },
  async resetPassword(email) {
    if (!auth) return;
    await sendPasswordResetEmail(auth, email);
  },
  async signOutUser() {
    if (useAuthStore.getState().localMode) {
      saveLocalMode(false);
      set({ localMode: !isFirebaseConfigured, user: null });
      return;
    }
    if (!auth) return;
    saveOfflineSession(null);
    set({ user: null });
    await signOut(auth);
  },
}));

// Listener de sesión (se inicializa una sola vez al cargar el módulo).
if (isFirebaseConfigured && auth) {
  auth.languageCode = 'es';
  onAuthStateChanged(auth, (u) => {
    const user = u
      ? { uid: u.uid, email: u.email, name: u.displayName ?? u.email }
      : null;
    saveOfflineSession(user);
    if (user) saveLocalMode(false);
    useAuthStore.setState({
      user,
      loading: false,
      ...(user ? { localMode: false } : {}),
    });
  });
} else {
  useAuthStore.setState({ loading: false });
}
