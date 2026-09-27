#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [, , inputPath, outputPath, publicId] = process.argv;

if (!inputPath || !outputPath || !publicId) {
  console.error('Uso: node scripts/ingest-bible.mjs <fuente.json> <directorio> <id-publico>');
  process.exit(1);
}

const raw = JSON.parse(await readFile(inputPath, 'utf8'));

function booksFromFlatVerses(flat) {
  const books = [];
  const byName = new Map();
  for (const [reference, value] of Object.entries(flat)) {
    const match = reference.match(/^(.+) (\d+):(\d+)$/);
    if (!match) continue;
    const [, name, chapterRaw, verseRaw] = match;
    let book = byName.get(name);
    if (!book) {
      book = { nr: books.length + 1, name, chapters: [] };
      byName.set(name, book);
      books.push(book);
    }
    const chapterNumber = Number(chapterRaw);
    let chapter = book.chapters.find((item) => item.chapter === chapterNumber);
    if (!chapter) {
      chapter = { chapter: chapterNumber, verses: [] };
      book.chapters.push(chapter);
    }
    chapter.verses.push({
      verse: Number(verseRaw),
      text: String(value).replace(/^#\s*/, '').replace(/[\[\]]/g, ''),
    });
  }
  return books;
}

function chapterNumber(sourceChapter, index) {
  if (sourceChapter.chapter !== undefined) return Number(sourceChapter.chapter);
  const usfmNumber = String(sourceChapter.usfm ?? '').match(/\.(\d+)$/)?.[1];
  return usfmNumber ? Number(usfmNumber) : index + 1;
}

function versesFromChapter(sourceChapter) {
  if (Array.isArray(sourceChapter.verses)) return sourceChapter.verses;
  if (!Array.isArray(sourceChapter.items)) return [];

  const verses = [];
  const byNumber = new Map();
  for (const item of sourceChapter.items) {
    if (item.type !== 'verse' || !Array.isArray(item.verse_numbers)) continue;
    const verseNumbers = item.verse_numbers.map(Number).filter(Number.isFinite);
    const verse = verseNumbers[0];
    const verseEnd = verseNumbers[verseNumbers.length - 1];
    const text = Array.isArray(item.lines) ? item.lines.join(' ') : '';
    if (!Number.isFinite(verse) || !text) continue;
    const existing = byNumber.get(verse);
    if (existing) {
      existing.text += ` ${text}`;
      if (verseEnd > (existing.verseEnd ?? existing.verse)) existing.verseEnd = verseEnd;
    } else {
      const value = verseEnd > verse ? { verse, verseEnd, text } : { verse, text };
      byNumber.set(verse, value);
      verses.push(value);
    }
  }
  return verses;
}

function chaptersFromBook(sourceBook) {
  const chapters = [];
  const byNumber = new Map();

  for (const [chapterIndex, sourceChapter] of sourceBook.chapters.entries()) {
    const chapter = chapterNumber(sourceChapter, chapterIndex);
    const verses = versesFromChapter(sourceChapter).map((sourceVerse) => ({
      verse: Number(sourceVerse.verse),
      ...(sourceVerse.verseEnd ? { verseEnd: Number(sourceVerse.verseEnd) } : {}),
      text: String(sourceVerse.text).replace(/\s+/g, ' ').trim(),
    }));
    const existing = byNumber.get(chapter);
    if (!existing) {
      const value = { chapter, verses };
      byNumber.set(chapter, value);
      chapters.push(value);
      continue;
    }

    for (const verse of verses) {
      const match = existing.verses.find((item) => (
        item.verse === verse.verse && item.verseEnd === verse.verseEnd
      ));
      if (!match) {
        existing.verses.push(verse);
      } else if (match.text !== verse.text && !match.text.includes(verse.text)) {
        match.text = `${match.text} ${verse.text}`;
      }
    }
    existing.verses.sort((left, right) => left.verse - right.verse);
  }

  return chapters.sort((left, right) => left.chapter - right.chapter);
}

const sourceBooks = Array.isArray(raw.books) ? raw.books : booksFromFlatVerses(raw);
if (sourceBooks.length !== 66) throw new Error(`La fuente contiene ${sourceBooks.length} libros; se esperaban 66.`);

await mkdir(outputPath, { recursive: true });

for (const [bookIndex, sourceBook] of sourceBooks.entries()) {
  const normalized = {
    book: Number(sourceBook.nr ?? bookIndex + 1),
    chapters: chaptersFromBook(sourceBook),
  };
  await writeFile(
    path.join(outputPath, `${normalized.book}.json`),
    JSON.stringify(normalized),
    'utf8',
  );
}

const manifest = {
  id: publicId,
  translation: raw.translation ?? raw.local_title ?? (publicId === 'kjv' ? 'King James Version (1769)' : publicId),
  abbreviation: raw.abbreviation ?? raw.local_abbreviation ?? publicId,
  language: typeof raw.language === 'object'
    ? raw.language.local_name ?? raw.language.language_tag ?? raw.language.iso_639_1
    : raw.language ?? (publicId === 'kjv' ? 'English' : undefined),
  source: raw.distribution_source ?? raw.repository ?? (publicId === 'kjv' ? 'https://github.com/farskipper/kjv' : undefined),
  license: raw.distribution_license ?? (publicId === 'kjv' ? 'Public Domain (Unlicense)' : undefined),
  copyright: typeof raw.copyright === 'object' ? raw.copyright.text : raw.copyright,
  sourceVersion: raw.distribution_version ?? raw.version_id,
  publisher: raw.publisher?.name,
  books: sourceBooks.length,
};
await writeFile(path.join(outputPath, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

console.log(`${publicId}: ${sourceBooks.length} libros normalizados en ${outputPath}`);
