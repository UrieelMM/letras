// Tipografías disponibles, cargadas dinámicamente desde Google Fonts.

export interface FontOption {
  /** Nombre de la familia CSS (lo que se usa en font-family). */
  family: string;
  /** Etiqueta legible para el selector. */
  label: string;
  /** Valor para el parámetro family de la API css2 de Google Fonts. */
  google: string;
  /** Categoría para agrupar/orientar el uso. */
  category: 'sans' | 'display' | 'script' | 'serif';
}

export const FONT_OPTIONS: FontOption[] = [
  { family: 'Inter', label: 'Inter', google: 'Inter:wght@300;400;500;600;700;800;900', category: 'sans' },
  { family: 'Poppins', label: 'Poppins', google: 'Poppins:wght@300;400;500;600;700;800;900', category: 'sans' },
  { family: 'Montserrat', label: 'Montserrat', google: 'Montserrat:wght@300;400;500;600;700;800;900', category: 'sans' },
  { family: 'Nunito', label: 'Nunito', google: 'Nunito:wght@300;400;600;700;800;900', category: 'sans' },
  { family: 'Raleway', label: 'Raleway', google: 'Raleway:wght@300;400;500;600;700;800;900', category: 'sans' },
  { family: 'Quicksand', label: 'Quicksand', google: 'Quicksand:wght@400;500;600;700', category: 'sans' },
  { family: 'Oswald', label: 'Oswald', google: 'Oswald:wght@300;400;500;600;700', category: 'display' },
  { family: 'Bebas Neue', label: 'Bebas Neue', google: 'Bebas+Neue', category: 'display' },
  { family: 'Anton', label: 'Anton', google: 'Anton', category: 'display' },
  { family: 'Archivo Black', label: 'Archivo Black', google: 'Archivo+Black', category: 'display' },
  { family: 'Righteous', label: 'Righteous', google: 'Righteous', category: 'display' },
  { family: 'Fredoka', label: 'Fredoka', google: 'Fredoka:wght@400;500;600;700', category: 'display' },
  { family: 'Orbitron', label: 'Orbitron (tech)', google: 'Orbitron:wght@400;500;700;900', category: 'display' },
  { family: 'Audiowide', label: 'Audiowide', google: 'Audiowide', category: 'display' },
  { family: 'Bungee', label: 'Bungee', google: 'Bungee', category: 'display' },
  { family: 'Monoton', label: 'Monoton (neón)', google: 'Monoton', category: 'display' },
  { family: 'Press Start 2P', label: 'Press Start 2P (pixel)', google: 'Press+Start+2P', category: 'display' },
  { family: 'Permanent Marker', label: 'Permanent Marker', google: 'Permanent+Marker', category: 'script' },
  { family: 'Playfair Display', label: 'Playfair Display', google: 'Playfair+Display:wght@400;500;600;700;800;900', category: 'serif' },
  { family: 'Merriweather', label: 'Merriweather', google: 'Merriweather:wght@300;400;700;900', category: 'serif' },
  { family: 'Lobster', label: 'Lobster', google: 'Lobster', category: 'script' },
  { family: 'Pacifico', label: 'Pacifico', google: 'Pacifico', category: 'script' },
  { family: 'Dancing Script', label: 'Dancing Script', google: 'Dancing+Script:wght@400;500;600;700', category: 'script' },
  { family: 'Caveat', label: 'Caveat', google: 'Caveat:wght@400;500;600;700', category: 'script' },
];

const loaded = new Set<string>();

/**
 * Inyecta el <link> de Google Fonts para una familia (una sola vez por documento).
 * Funciona tanto en la ventana de control como en la de proyección
 * (cada una tiene su propio `document`).
 */
export function loadFont(family: string): void {
  if (!family || loaded.has(family)) return;
  const opt = FONT_OPTIONS.find((f) => f.family === family);
  if (!opt) return;
  loaded.add(family);

  const id = `gf-${opt.family.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${opt.google}&display=swap`;
  document.head.appendChild(link);
}
