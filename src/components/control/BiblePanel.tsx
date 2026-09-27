import { useEffect, useMemo, useState } from 'react';
import { BIBLE_BOOKS, bibleBookName } from '../../bible/books';
import type { BibleVerse } from '../../bible/types';
import { useStore } from '../../store/useStore';

export function BiblePanel() {
  const versions = useStore((state) => state.bibleVersions);
  const versionId = useStore((state) => state.bibleVersionId);
  const book = useStore((state) => state.bibleBook);
  const chapter = useStore((state) => state.bibleChapter);
  const verses = useStore((state) => state.bibleChapterVerses);
  const results = useStore((state) => state.bibleSearchResults);
  const loading = useStore((state) => state.bibleLoadingChapter);
  const searching = useStore((state) => state.bibleSearching);
  const error = useStore((state) => state.bibleError);
  const loadVersions = useStore((state) => state.loadBibleVersions);
  const setVersion = useStore((state) => state.setBibleVersion);
  const openChapter = useStore((state) => state.openBibleChapter);
  const searchBible = useStore((state) => state.searchBible);
  const clearSearch = useStore((state) => state.clearBibleSearch);
  const projectPassage = useStore((state) => state.projectBiblePassage);

  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(1);

  const version = versions.find((item) => item.id === versionId);
  const isUnavailable = version?.available === false;
  const searchDisabled = Boolean(isUnavailable);
  const selectedBook = BIBLE_BOOKS[book - 1] ?? BIBLE_BOOKS[0];
  const verseNumbers = useMemo(() => [
    ...new Set(verses.flatMap((item) => Array.from(
      { length: (item.verseEnd ?? item.verse) - item.verse + 1 },
      (_, index) => item.verse + index,
    ))),
  ], [verses]);

  useEffect(() => {
    void loadVersions();
  }, [loadVersions]);

  async function chooseResult(result: BibleVerse) {
    await openChapter(result.book, result.chapter);
    setFrom(result.verse);
    setTo(result.verseEnd ?? result.verse);
    setQuery('');
    setSearched(false);
    clearSearch();
  }

  function selectVerse(verse: number, verseEnd: number, extend: boolean) {
    if (extend) {
      setFrom(Math.min(from, verse));
      setTo(Math.max(from, verseEnd));
      return;
    }
    setFrom(verse);
    setTo(verseEnd);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-white/5 px-4 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Explorar Biblia</h2>
            <p className="mt-0.5 text-[11px] text-white/35">
              Versiones incluidas para uso offline
            </p>
          </div>
          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
            isUnavailable
              ? 'bg-amber-400/10 text-amber-300'
              : 'bg-emerald-400/10 text-emerald-300'
          }`}>
            {isUnavailable ? 'NO DISPONIBLE' : 'OFFLINE'}
          </span>
        </div>

        <div>
          <label className="label">Versión</label>
          <select
            className="input"
            value={versionId}
            disabled={!versions.length}
            onChange={(event) => {
              setFrom(1);
              setTo(1);
              setQuery('');
              setSearched(false);
              clearSearch();
              void setVersion(event.target.value);
            }}
          >
            {versions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.abbr}
              </option>
            ))}
          </select>
          {version?.copyright && (
            <div className={`mt-2 rounded-lg border p-2.5 text-[11px] leading-relaxed ${
              isUnavailable
                ? 'border-amber-400/20 bg-amber-400/10 text-amber-100/80'
                : 'border-white/10 bg-white/[0.03] text-white/45'
            }`}>
              <p className="line-clamp-2">{version.copyright}</p>
              <p className="mt-1">Texto incluido en la aplicación para uso sin conexión.</p>
              {version.link && (
                <a
                  className="mt-1 inline-block font-semibold text-sky-300 hover:text-white"
                  href={version.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver información de la versión ↗
                </a>
              )}
            </div>
          )}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearched(true);
            void searchBible(query);
          }}
        >
          <input
            type="search"
            className="input min-w-0"
            value={query}
            placeholder="Buscar texto en toda la Biblia..."
            aria-label="Buscar en la Biblia"
            disabled={searchDisabled}
            onChange={(event) => {
              setQuery(event.target.value);
              if (!event.target.value) {
                setSearched(false);
                clearSearch();
              }
            }}
          />
          <button className="btn-soft !px-3" type="submit" disabled={searchDisabled || query.trim().length < 2 || searching}>
            {searching ? '…' : 'Buscar'}
          </button>
        </form>

        <div className="grid grid-cols-[1fr_86px] gap-2">
          <div>
            <label className="label">Libro</label>
            <select
              className="input"
              value={book}
              disabled={isUnavailable}
              onChange={(event) => {
                setFrom(1);
                setTo(1);
                void openChapter(Number(event.target.value), 1);
              }}
            >
              <optgroup label="Antiguo Testamento">
                {BIBLE_BOOKS.filter((item) => item.testament === 'old').map((item) => (
                  <option key={item.number} value={item.number}>
                    {version?.lang === 'en' ? item.en : item.es}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Nuevo Testamento">
                {BIBLE_BOOKS.filter((item) => item.testament === 'new').map((item) => (
                  <option key={item.number} value={item.number}>
                    {version?.lang === 'en' ? item.en : item.es}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="label">Capítulo</label>
            <select
              className="input"
              value={chapter}
              disabled={isUnavailable}
              onChange={(event) => {
                setFrom(1);
                setTo(1);
                void openChapter(book, Number(event.target.value));
              }}
            >
              {Array.from({ length: selectedBook.chapters }, (_, index) => index + 1).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {error && (
          <div className="mx-2 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        {searching && (
          <div className="px-3 py-8 text-center text-xs text-white/40">
            Preparando la búsqueda offline por primera vez…
          </div>
        )}

        {!searching && searched && query.trim() && (
          <div>
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-white/50">
                {results.length} resultado{results.length === 1 ? '' : 's'}
                {results.length === 100 ? ' (primeros 100)' : ''}
              </span>
              <button
                className="text-[11px] text-accent-soft hover:text-white"
                onClick={() => {
                  setQuery('');
                  setSearched(false);
                  clearSearch();
                }}
              >
                Volver al capítulo
              </button>
            </div>
            <div className="space-y-1">
              {results.map((item) => (
                <button
                  key={`${item.book}-${item.chapter}-${item.verse}-${item.verseEnd ?? item.verse}`}
                  className="w-full rounded-lg px-3 py-2.5 text-left transition hover:bg-white/5"
                  onClick={() => void chooseResult(item)}
                >
                  <div className="text-[11px] font-semibold text-accent-soft">
                    {bibleBookName(item.book, version?.lang ?? 'es')} {item.chapter}:{item.verse}
                    {item.verseEnd ? `–${item.verseEnd}` : ''}
                  </div>
                  <div className="mt-1 line-clamp-3 text-xs leading-relaxed text-white/55">{item.text}</div>
                </button>
              ))}
              {results.length === 0 && (
                <p className="px-3 py-8 text-center text-xs text-white/35">No se encontraron coincidencias.</p>
              )}
            </div>
          </div>
        )}

        {!searching && !(searched && query.trim()) && (
          <>
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-white/50">
                {bibleBookName(book, version?.lang ?? 'es')} {chapter}
              </span>
              <span className="text-[10px] text-white/30">Clic · Shift+clic para rango</span>
            </div>
            {loading ? (
              <div className="px-3 py-8 text-center text-xs text-white/40">Cargando capítulo…</div>
            ) : (
              <div className="space-y-1">
                {verses.map((item) => {
                  const verseEnd = item.verseEnd ?? item.verse;
                  const selected = item.verse <= Math.max(from, to) && verseEnd >= Math.min(from, to);
                  return (
                    <button
                      key={`${item.verse}-${verseEnd}`}
                      className={`flex w-full gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${
                        selected
                          ? 'bg-accent/15 ring-1 ring-inset ring-accent/35'
                          : 'hover:bg-white/5'
                      }`}
                      onClick={(event) => selectVerse(item.verse, verseEnd, event.shiftKey)}
                    >
                      <span className={`w-5 shrink-0 pt-0.5 text-right text-[11px] font-bold ${selected ? 'text-accent-soft' : 'text-white/25'}`}>
                        {item.verseEnd ? `${item.verse}–${item.verseEnd}` : item.verse}
                      </span>
                      <span className="text-xs leading-relaxed text-white/70">{item.text}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-white/5 bg-ink-800/80 p-3 backdrop-blur-xl">
        <div className="mb-2 grid grid-cols-2 gap-2">
          <label className="text-[10px] uppercase tracking-wide text-white/35">
            Desde
            <select className="input mt-1 !py-1.5" value={from} onChange={(event) => setFrom(Number(event.target.value))}>
              {verseNumbers.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-[10px] uppercase tracking-wide text-white/35">
            Hasta
            <select className="input mt-1 !py-1.5" value={to} onChange={(event) => setTo(Number(event.target.value))}>
              {verseNumbers.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <button
          className="btn-accent w-full"
          disabled={!verses.length || loading || isUnavailable}
          onClick={() => projectPassage(from, to)}
        >
          Proyectar pasaje
        </button>
      </div>
    </div>
  );
}
