# Textos bíblicos incluidos

Los archivos de este directorio se generan con `scripts/ingest-bible.mjs` y se
sirven por libro para permitir carga perezosa y caché offline en IndexedDB.

- `rv1909`: Reina-Valera 1909, texto de dominio público. La fuente de ingesta
  es el módulo público de Wikisource distribuido por GetBible v2.
- `kjv`: King James Version 1769, conjunto de datos de dominio público de
  `farskipper/kjv`, publicado bajo Unlicense.

Los manifiestos de cada versión conservan la fuente y declaración de licencia
que acompañaban al conjunto de datos descargado.
