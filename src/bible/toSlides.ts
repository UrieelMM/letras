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
    const verseLabel = item.verseEnd ? `${item.verse}–${item.verseEnd}` : `${item.verse}`;
    return {
      id: `bible-${version.id}-${item.book}-${item.chapter}-${verseLabel}`,
      blockId: `bible-${version.id}-${item.book}-${item.chapter}`,
      type: 'scripture',
      label: `Versículo ${verseLabel}`,
      lines: [item.text.trim()],
      partIndex: index,
      partCount: verses.length,
      reference: `${bookName} ${item.chapter}:${verseLabel} — ${version.abbr}`,
      attribution: version.copyright,
    };
  });
}
