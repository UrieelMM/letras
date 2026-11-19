import { create } from 'zustand';
import type { StoreState } from './types';
import { createLibrarySlice } from './librarySlice';
import { createPresentationSlice } from './presentationSlice';
import { createBibleSlice } from './bibleSlice';

export type { Backup } from './types';

/**
 * Store principal compuesto por slices independientes (patrón escalable):
 * - librarySlice: biblioteca compartida en Firestore o datos del modo local.
 * - presentationSlice: estado de proyección y selección.
 * - bibleSlice: navegación y pasajes bíblicos offline.
 * La autenticación vive en su propio store (./authStore).
 */
export const useStore = create<StoreState>()((...a) => ({
  ...createLibrarySlice(...a),
  ...createPresentationSlice(...a),
  ...createBibleSlice(...a),
}));
