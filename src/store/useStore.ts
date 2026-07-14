import { create } from 'zustand';
import type { StoreState } from './types';
import { createLibrarySlice } from './librarySlice';
import { createPresentationSlice } from './presentationSlice';

export type { Backup } from './types';

/**
 * Store principal compuesto por slices independientes (patrón escalable):
 * - librarySlice: datos del usuario + persistencia en Firestore.
 * - presentationSlice: estado de proyección y selección.
 * La autenticación vive en su propio store (./authStore).
 */
export const useStore = create<StoreState>()((...a) => ({
  ...createLibrarySlice(...a),
  ...createPresentationSlice(...a),
}));
