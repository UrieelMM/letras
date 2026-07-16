export interface BibleBook {
  number: number;
  es: string;
  en: string;
  usfm: string;
  apiSlug: string;
  chapters: number;
  testament: 'old' | 'new';
}

const USFM_BOOK_IDS = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
  'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
  'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'MAT',
  'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP',
  'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE',
  '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV',
] as const;

const API_BOOK_SLUGS = [
  'Genesis', 'Exodo', 'Levitico', 'Numeros', 'Deuteronomio', 'Josue', 'Jueces', 'Rut',
  '1-Samuel', '2-Samuel', '1-Reyes', '2-Reyes', '1-Cronicas', '2-Cronicas', 'Esdras',
  'Nehemias', 'Ester', 'Job', 'Salmos', 'Proverbios', 'Eclesiastes', 'Cantares',
  'Isaias', 'Jeremias', 'Lamentaciones', 'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amos',
  'Abdias', 'Jonas', 'Miqueas', 'Nahum', 'Habacuc', 'Sofonias', 'Hageo', 'Zacarias',
  'Malaquias', 'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos', '1-Corintios',
  '2-Corintios', 'Galatas', 'Efesios', 'Filipenses', 'Colosenses', '1-Tesalonicenses',
  '2-Tesalonicenses', '1-Timoteo', '2-Timoteo', 'Tito', 'Filemon', 'Hebreos',
  'Santiago', '1-Pedro', '2-Pedro', '1-Juan', '2-Juan', '3-Juan', 'Judas', 'Apocalipsis',
] as const;

const OLD: Array<[string, string, number]> = [
  ['Génesis', 'Genesis', 50],
  ['Éxodo', 'Exodus', 40],
  ['Levítico', 'Leviticus', 27],
  ['Números', 'Numbers', 36],
  ['Deuteronomio', 'Deuteronomy', 34],
  ['Josué', 'Joshua', 24],
  ['Jueces', 'Judges', 21],
  ['Rut', 'Ruth', 4],
  ['1 Samuel', '1 Samuel', 31],
  ['2 Samuel', '2 Samuel', 24],
  ['1 Reyes', '1 Kings', 22],
  ['2 Reyes', '2 Kings', 25],
  ['1 Crónicas', '1 Chronicles', 29],
  ['2 Crónicas', '2 Chronicles', 36],
  ['Esdras', 'Ezra', 10],
  ['Nehemías', 'Nehemiah', 13],
  ['Ester', 'Esther', 10],
  ['Job', 'Job', 42],
  ['Salmos', 'Psalms', 150],
  ['Proverbios', 'Proverbs', 31],
  ['Eclesiastés', 'Ecclesiastes', 12],
  ['Cantares', 'Song of Solomon', 8],
  ['Isaías', 'Isaiah', 66],
  ['Jeremías', 'Jeremiah', 52],
  ['Lamentaciones', 'Lamentations', 5],
  ['Ezequiel', 'Ezekiel', 48],
  ['Daniel', 'Daniel', 12],
  ['Oseas', 'Hosea', 14],
  ['Joel', 'Joel', 3],
  ['Amós', 'Amos', 9],
  ['Abdías', 'Obadiah', 1],
  ['Jonás', 'Jonah', 4],
  ['Miqueas', 'Micah', 7],
  ['Nahúm', 'Nahum', 3],
  ['Habacuc', 'Habakkuk', 3],
  ['Sofonías', 'Zephaniah', 3],
  ['Hageo', 'Haggai', 2],
  ['Zacarías', 'Zechariah', 14],
  ['Malaquías', 'Malachi', 4],
];

const NEW: Array<[string, string, number]> = [
  ['Mateo', 'Matthew', 28],
  ['Marcos', 'Mark', 16],
  ['Lucas', 'Luke', 24],
  ['Juan', 'John', 21],
  ['Hechos', 'Acts', 28],
  ['Romanos', 'Romans', 16],
  ['1 Corintios', '1 Corinthians', 16],
  ['2 Corintios', '2 Corinthians', 13],
  ['Gálatas', 'Galatians', 6],
  ['Efesios', 'Ephesians', 6],
  ['Filipenses', 'Philippians', 4],
  ['Colosenses', 'Colossians', 4],
  ['1 Tesalonicenses', '1 Thessalonians', 5],
  ['2 Tesalonicenses', '2 Thessalonians', 3],
  ['1 Timoteo', '1 Timothy', 6],
  ['2 Timoteo', '2 Timothy', 4],
  ['Tito', 'Titus', 3],
  ['Filemón', 'Philemon', 1],
  ['Hebreos', 'Hebrews', 13],
  ['Santiago', 'James', 5],
  ['1 Pedro', '1 Peter', 5],
  ['2 Pedro', '2 Peter', 3],
  ['1 Juan', '1 John', 5],
  ['2 Juan', '2 John', 1],
  ['3 Juan', '3 John', 1],
  ['Judas', 'Jude', 1],
  ['Apocalipsis', 'Revelation', 22],
];

export const BIBLE_BOOKS: BibleBook[] = [...OLD, ...NEW].map(
  ([es, en, chapters], index) => ({
    number: index + 1,
    es,
    en,
    usfm: USFM_BOOK_IDS[index],
    apiSlug: API_BOOK_SLUGS[index],
    chapters,
    testament: index < OLD.length ? 'old' : 'new',
  }),
);

export function bibleBook(number: number): BibleBook {
  return BIBLE_BOOKS[number - 1] ?? BIBLE_BOOKS[0];
}

export function bibleBookName(number: number, lang: 'es' | 'en' = 'es'): string {
  return bibleBook(number)[lang];
}
