# EPIC-03. Metadata extraction (EXIF + dates + camera)

**Status:** pending
**Depends on:** EPIC-01

## Goal

Прочитати EXIF із фото, метадані з відео, отримати дату зйомки + make/model + GPS.

## Subtasks

- [ ] Discovery: обрати crate для фото (кандидати: `kamadak-exif`, `little_exif`, `nom-exif`)
- [ ] Discovery: підхід для відео (`nom-exif` для QuickTime atoms, парсинг MP4 boxes)
- [ ] Запис рішення у `docs/discoveries/`
- [ ] Сервіс `metadata::extract(path) -> Metadata`
- [ ] Fallback-стратегія коли EXIF немає
- [ ] Юніт-тести: корумповані файли, відсутні поля, кілька форматів

## Open questions

1. **Fallback для дати:** якщо EXIF порожній — брати file `mtime`, `birthtime`, чи позначати як "Без дати" і кидати в окрему теку?
2. **Часовий пояс:** EXIF дата зазвичай без TZ. Інтерпретувати як локальний час системи, як UTC, чи зчитувати `OffsetTimeOriginal` якщо є?
3. **Відео — пріоритет:** робимо в MVP чи відкладаємо (тоді відео сортуються тільки по `mtime`)?
4. **RAW-формати** (CR2, NEF, ARW, DNG) — повноцінний EXIF чи best-effort?
5. **Sidecar XMP**-файли (RAW + XMP пара) — читати XMP для дати, чи ігнорувати?
6. **Performance**: відкривати кожен файл синхронно vs паралельно (rayon)?
