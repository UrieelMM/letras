import type { RenderSlide } from '../types';
import { bibleBookName } from './books';
import type { BibleVerse, BibleVersion } from './types';

/** Convierte un rango en un slide por versículo y conserva su referencia. */
export function buildScriptureSlides(
  verses: BibleVerse[],
  version: BibleVersion,
): RenderSlide[] {
  return verses.map((item, index) => {
    const bookName = bibleBookName(item.book, version.lang);
    return {
      id: `bible-${version.id}-${item.book}-${item.chapter}-${item.verse}`,
      blockId: `bible-${version.id}-${item.book}-${item.chapter}`,
      type: 'scripture',
      label: `Versículo ${item.verse}`,
      lines: [item.text.trim()],
      partIndex: index,
      partCount: verses.length,
      reference: `${bookName} ${item.chapter}:${item.verse} — ${version.abbr}`,
      attribution: version.copyright,
    };
  });
}
