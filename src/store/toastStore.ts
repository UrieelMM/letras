import { create } from 'zustand';
import { uid } from '../lib/id';

export type ToastType = 'error' | 'success' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  notify: (type: ToastType, message: string) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  notify: (type, message) => {
    const id = uid('t-');
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => get().dismiss(id), 4500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Atajo para notificar desde cualquier parte (incluidos stores no-React). */
export const toast = {
  error: (message: string) => useToastStore.getState().notify('error', message),
  success: (message: string) => useToastStore.getState().notify('success', message),
  info: (message: string) => useToastStore.getState().notify('info', message),
};
