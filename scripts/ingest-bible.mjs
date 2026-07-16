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

const sourceBooks = Array.isArray(raw.books) ? raw.books : booksFromFlatVerses(raw);
if (sourceBooks.length !== 66) throw new Error(`La fuente contiene ${sourceBooks.length} libros; se esperaban 66.`);

await mkdir(outputPath, { recursive: true });

for (const sourceBook of sourceBooks) {
  const normalized = {
    book: Number(sourceBook.nr),
    chapters: sourceBook.chapters.map((sourceChapter) => ({
      chapter: Number(sourceChapter.chapter),
      verses: sourceChapter.verses.map((sourceVerse) => ({
        verse: Number(sourceVerse.verse),
        text: String(sourceVerse.text).replace(/\s+/g, ' ').trim(),
      })),
    })),
  };
  await writeFile(
    path.join(outputPath, `${normalized.book}.json`),
    JSON.stringify(normalized),
    'utf8',
  );
}

const manifest = {
  id: publicId,
  translation: raw.translation ?? (publicId === 'kjv' ? 'King James Version (1769)' : publicId),
  abbreviation: raw.abbreviation ?? publicId,
  language: raw.language ?? (publicId === 'kjv' ? 'English' : undefined),
  source: raw.distribution_source ?? (publicId === 'kjv' ? 'https://github.com/farskipper/kjv' : undefined),
  license: raw.distribution_license ?? (publicId === 'kjv' ? 'Public Domain (Unlicense)' : undefined),
  sourceVersion: raw.distribution_version,
  books: sourceBooks.length,
};
await writeFile(path.join(outputPath, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

console.log(`${publicId}: ${sourceBooks.length} libros normalizados en ${outputPath}`);
