#!/usr/bin/env python3
"""Generate application songs from the formatted CANCIONERO.docx file.

Usage:
    python3 scripts/import_songbook.py /path/to/CANCIONERO.docx
"""

from __future__ import annotations

import argparse
import json
import math
import re
import unicodedata
import zipfile
from dataclasses import dataclass
from pathlib import Path
from xml.etree import ElementTree as ET


W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W_NS}
TAG = lambda name: f"{{{W_NS}}}{name}"

CATEGORY_TAGS = {
    "ALABANZA": "alabanza",
    "ADORACIÓN": "adoración",
}

TITLE_CORRECTIONS = {
    "Arriba!": "¡Arriba!",
    "El camino del señor": "El camino del Señor",
    "El venció": "Él venció",
    "Eres todo poderoso": "Eres todopoderoso",
    "Tomalo": "Tómalo",
    "Vivo estas": "Vivo estás",
    "Grade eres tú": "Grande eres tú",
    "Tu eres mi respirar": "Tú eres mi respirar",
    "Donde tu estas": "Donde tú estás",
    "Que dulce": "Qué dulce",
    "Temprano yo te buscare": "Temprano yo te buscaré",
}

EXACT_LINE_CORRECTIONS = {
    "abre mis ojos": "Abre mis ojos",
    "Mi realidad Él trasformo": "Mi realidad Él transformó",
    "Desde cielo tú llegaste para mi mano tomar": "Desde el cielo tú llegaste para tomar mi mano",
    "Jesús tu cantas sobre mí y tus palabras me sanan": "Jesús, tú cantas sobre mí y tus palabras me sanan",
    "Digno es el": "Digno es Él",
    "Vivo estas": "Vivo estás",
    "De nuestro lado estas": "De nuestro lado estás",
    "No hay nadie como Tu": "No hay nadie como Tú",
    "No hay nadie como Tu!": "¡No hay nadie como Tú!",
    "Pues no hay nadie como Tu": "Pues no hay nadie como Tú",
    "Cerca de tu corazon": "Cerca de tu corazón",
    "Dios todo poderoso": "Dios todopoderoso",
    "levantamos nuestras manos exaltándote": "Levantamos nuestras manos exaltándote",
    "Grande eres Tú grande Tus milagros": "Grande eres Tú, grandes Tus milagros son",
    "son no hay otro como Tú": "No hay otro como Tú",
    "Atráeme Señor": "Atráeme, Señor",
    "Cumple Señor": "Cumple, Señor",
}

VERBS_AFTER_TU = (
    "eres|estás|estas|fuiste|serás|seras|vives|puedes|sabes|vienes|cantas|"
    "cambiaste|llegaste|llamaste|diste|empiezas|llevaste|reinas|viste|"
    "hiciste|mueves|das|das|quieres|tienes|sostienes|transformas|sanaste|"
    "salvaste|moriste|resucitaste|vendrás|vendras|permaneces"
)

SECTION_MARKERS = {
    "coro": "chorus",
    "coro:": "chorus",
    "puente": "bridge",
    "puente:": "bridge",
    "estrofa": "verse",
    "verso": "verse",
}


@dataclass
class Paragraph:
    text: str
    centered: bool
    all_bold: bool
    colors: set[str]


@dataclass
class SourceSong:
    title: str
    category: str
    paragraphs: list[str]


@dataclass
class Section:
    lines: list[str]
    hinted_type: str | None = None
    repeated: bool = False


def attr(element: ET.Element | None, name: str) -> str | None:
    if element is None:
        return None
    return element.get(TAG(name))


def run_text(run: ET.Element) -> str:
    parts: list[str] = []
    for node in run.iter():
        if node.tag == TAG("t"):
            parts.append(node.text or "")
        elif node.tag in {TAG("br"), TAG("cr")}:
            parts.append("\n")
        elif node.tag == TAG("tab"):
            parts.append("\t")
    return "".join(parts)


def parse_paragraph(element: ET.Element) -> Paragraph:
    runs = [run for run in element.iter(TAG("r")) if run_text(run).strip()]
    text = "".join(run_text(run) for run in element.iter(TAG("r")))
    ppr = element.find("w:pPr", NS)
    alignment = attr(ppr.find("w:jc", NS) if ppr is not None else None, "val")

    bold_values: list[bool] = []
    colors: set[str] = set()
    for run in runs:
        rpr = run.find("w:rPr", NS)
        bold = rpr.find("w:b", NS) if rpr is not None else None
        bold_values.append(bold is not None and attr(bold, "val") not in {"0", "false", "off"})
        color = rpr.find("w:color", NS) if rpr is not None else None
        color_value = attr(color, "val")
        if color_value and color_value != "auto":
            colors.add(color_value.upper())

    return Paragraph(
        text=text.replace("\r\n", "\n").replace("\r", "\n").strip(),
        centered=alignment == "center",
        all_bold=bool(bold_values) and all(bold_values),
        colors=colors,
    )


def read_paragraphs(docx_path: Path) -> list[Paragraph]:
    with zipfile.ZipFile(docx_path) as archive:
        document_xml = archive.read("word/document.xml")
    root = ET.fromstring(document_xml)
    body = root.find("w:body", NS)
    if body is None:
        raise ValueError("The DOCX does not contain a Word document body")
    return [parse_paragraph(p) for p in body.findall("w:p", NS)]


def extract_songs(paragraphs: list[Paragraph]) -> list[SourceSong]:
    songs: list[SourceSong] = []
    category: str | None = None
    current: SourceSong | None = None

    for paragraph in paragraphs:
        category_name = CATEGORY_TAGS.get(paragraph.text.upper())
        if category_name and "4C94D8" in paragraph.colors:
            if current:
                songs.append(current)
                current = None
            category = category_name
            continue

        is_title = bool(category and paragraph.text and paragraph.centered and paragraph.all_bold)
        if is_title:
            if current:
                songs.append(current)
            current = SourceSong(
                title=TITLE_CORRECTIONS.get(paragraph.text, paragraph.text),
                category=category,
                paragraphs=[],
            )
            continue

        if current:
            current.paragraphs.append(paragraph.text)

    if current:
        songs.append(current)
    return songs


def clean_line(value: str) -> str:
    value = unicodedata.normalize("NFC", value)
    value = value.replace("\u00a0", " ").replace("\u2028", " ")
    value = re.sub(r"^\s*/+\s*", "", value)
    value = re.sub(r"\s*/+\s*$", "", value)
    value = re.sub(r"[ \t]+", " ", value).strip()
    if not value:
        return ""

    value = EXACT_LINE_CORRECTIONS.get(value, value)
    value = re.sub(r"\b([Tt])u\s+(?=(?:" + VERBS_AFTER_TU + r")\b)", lambda m: "Tú " if m.group(1) == "T" else "tú ", value, flags=re.IGNORECASE)
    value = re.sub(r"\b([Tt])u estas\b", lambda m: "Tú estás" if m.group(1) == "T" else "tú estás", value)
    value = re.sub(r"\b([Ss])e que\b", lambda m: "Sé que" if m.group(1) == "S" else "sé que", value)
    value = re.sub(r"\b([Yy])o se\b", lambda m: "Yo sé" if m.group(1) == "Y" else "yo sé", value)
    value = re.sub(r"\b([Ll])e alabare\b", lambda m: "Le alabaré" if m.group(1) == "L" else "le alabaré", value)
    value = re.sub(r"\bbuscare\b", "buscaré", value, flags=re.IGNORECASE)
    value = re.sub(r"\b(a|de|en|para|por|sin) mi(?=$|[,.!?;:])", lambda m: f"{m.group(1)} mí", value, flags=re.IGNORECASE)
    return value


def flush_single_lines(
    target: list[Section],
    pending: list[str],
    hinted_type: str | None,
) -> None:
    if not pending:
        return
    repeated = bool(re.match(r"^\s*/{2,}", pending[0])) or bool(re.search(r"/{2,}\s*$", pending[-1]))
    lines = [clean_line(line) for line in pending]
    lines = [line for line in lines if line]
    if lines:
        target.append(Section(lines=lines, hinted_type=hinted_type, repeated=repeated))
    pending.clear()


def paragraph_sections(paragraphs: list[str]) -> list[Section]:
    sections: list[Section] = []
    pending: list[str] = []
    pending_type: str | None = None

    for paragraph in paragraphs:
        if not paragraph.strip():
            flush_single_lines(sections, pending, pending_type)
            pending_type = None
            continue

        pieces = [piece for piece in re.split(r"\n\s*\n+", paragraph) if piece.strip()]
        for piece in pieces:
            raw_lines = [line.strip() for line in piece.splitlines() if line.strip()]
            if not raw_lines:
                continue

            marker = SECTION_MARKERS.get(raw_lines[0].casefold()) if len(raw_lines) == 1 else None
            if marker:
                flush_single_lines(sections, pending, pending_type)
                pending_type = marker
                continue

            if len(raw_lines) == 1:
                pending.extend(raw_lines)
                continue

            flush_single_lines(sections, pending, pending_type)
            repeated = bool(re.match(r"^\s*/{2,}", raw_lines[0])) or bool(re.search(r"/{2,}\s*$", raw_lines[-1]))
            clean_lines = [clean_line(line) for line in raw_lines]
            clean_lines = [line for line in clean_lines if line]
            if clean_lines:
                sections.append(Section(clean_lines, pending_type, repeated))
            pending_type = None

    flush_single_lines(sections, pending, pending_type)
    return sections


def balanced_chunks(lines: list[str], maximum: int = 4) -> list[list[str]]:
    if len(lines) <= maximum:
        return [lines]
    chunk_count = math.ceil(len(lines) / maximum)
    base_size, larger_chunks = divmod(len(lines), chunk_count)
    sizes = [base_size + (1 if index < larger_chunks else 0) for index in range(chunk_count)]
    chunks: list[list[str]] = []
    cursor = 0
    for size in sizes:
        chunks.append(lines[cursor : cursor + size])
        cursor += size
    return chunks


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = "".join(char for char in normalized if not unicodedata.combining(char))
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value.casefold()).strip("-")
    return slug or "cancion"


def build_song(source: SourceSong) -> dict[str, object]:
    blocks: list[dict[str, object]] = []
    known_sections: dict[str, tuple[str, str]] = {}
    verse_count = 0

    for section in paragraph_sections(source.paragraphs):
        canonical = "\n".join(line.casefold() for line in section.lines)
        section_identity = known_sections.get(canonical)
        if section_identity:
            block_type, label = section_identity
        else:
            block_type = section.hinted_type or ("chorus" if section.repeated else "verse")
            if block_type == "chorus":
                label = "Coro"
            elif block_type == "bridge":
                label = "Puente"
            else:
                verse_count += 1
                label = f"Estrofa {verse_count}"
            known_sections[canonical] = (block_type, label)

        for chunk in balanced_chunks(section.lines):
            block_number = len(blocks) + 1
            blocks.append(
                {
                    "id": f"songbook-{slugify(source.category)}-{slugify(source.title)}-b{block_number}",
                    "type": block_type,
                    "label": label,
                    "lines": chunk,
                }
            )

    return {
        "id": f"songbook-{slugify(source.category)}-{slugify(source.title)}",
        "title": source.title,
        "tags": [source.category],
        "createdAt": 0,
        "updatedAt": 0,
        "blocks": blocks,
    }


def write_typescript(songs: list[dict[str, object]], output_path: Path) -> None:
    serialized = json.dumps(songs, ensure_ascii=False, indent=2)
    content = (
        "// Generated by scripts/import_songbook.py. Do not edit manually.\n"
        "import type { Song } from '../types';\n\n"
        f"export const SONGBOOK_SONGS: Song[] = {serialized};\n"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("docx", type=Path, help="Path to CANCIONERO.docx")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("src/data/songbook.generated.ts"),
        help="Generated TypeScript output path",
    )
    args = parser.parse_args()

    source_songs = extract_songs(read_paragraphs(args.docx))
    songs = [build_song(song) for song in source_songs]
    if not songs:
        raise SystemExit("No songs were detected. Check the DOCX title and category formatting.")
    if any(not song["blocks"] for song in songs):
        empty = [song["title"] for song in songs if not song["blocks"]]
        raise SystemExit(f"Songs without lyrics: {', '.join(empty)}")

    write_typescript(songs, args.output)
    block_count = sum(len(song["blocks"]) for song in songs)
    category_counts = {
        category: sum(song["tags"] == [category] for song in songs)
        for category in CATEGORY_TAGS.values()
    }
    print(f"Generated {len(songs)} songs and {block_count} slides in {args.output}")
    print("Categories: " + ", ".join(f"{name}={count}" for name, count in category_counts.items()))


if __name__ == "__main__":
    main()
