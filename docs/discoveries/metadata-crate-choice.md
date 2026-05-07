# Discovery: metadata extraction crate

**Date:** 2026-05-07
**Author:** Claude (paired with project owner)
**Decision:** `nom-exif` 2.8 — single crate, photo + video.

## Question

Який Rust-crate використати для зчитування EXIF (фото) та QuickTime / MP4 metadata (відео) у `metadata::extract` (EPIC-03)?

## Candidates

### `kamadak-exif`

- **Pros:** найпопулярніший EXIF-crate для Rust, стабільне API, добра документація, велика test-suite.
- **Cons:**
  - Тільки фото. Для відео потрібен другий crate / ручний MP4 box-parser.
  - Не підтримує HEIC out-of-the-box (деякі версії — частково).
  - API повертає сирі рядкові EXIF-теги — повна відповідальність за парсинг date / GPS лежить на клієнті.

### `little_exif`

- **Pros:** API простіше за kamadak, орієнтований на read+write.
- **Cons:**
  - Менш зріла; менше форматів.
  - Тільки фото; відео взагалі поза сумісністю.

### `nom-exif`

- **Pros:**
  - Єдиний у Rust-екосистемі, що декларує і фото (JPEG / HEIC / HEIF / TIFF / RAW: CR2 / CR3 / NEF / ARW / DNG / RAF), і відео (MP4 / MOV / M4V QuickTime atoms).
  - Уніфікований API: `MediaParser` + `MediaSource`; `parse::<ExifIter>` для фото, `parse::<TrackInfo>` для відео.
  - Повертає типізовані значення (`EntryValue`, `chrono::NaiveDateTime + Option<FixedOffset>`).
  - Вбудований helper `get_gps_info()` для GPS.
  - Streaming-парсер (для MOV метадані можуть бути в кінці файла — crate робить seek).
- **Cons:**
  - Менше зірок на GitHub, ніж у kamadak — менший community footprint.
  - Async API — окрема feature-flag (`async`), у нас sync через `spawn_blocking`, тож ок.
  - `MediaParser` не `Send` для шерингу між нитками — кожна rayon-нитка створює свій (неважлива деталь, бо overhead алокації мінімальний).

## Decision

**`nom-exif` 2.8** — обираємо. Один crate, один контракт помилок, одна стратегія тестування. Якщо в перспективі знадобиться щось специфічне (custom RAW parser, write back), додамо точково.

## Trade-offs прийняті свідомо

1. Менший community footprint — компенсується тим, що crate активно розвивається (2.x — стабільна гілка), API чистіший за конкурентів.
2. RAW підтримка — best-effort. Якщо `nom-exif` не зчитав EXIF з якогось RAW-формату — повертаємо `Metadata::default()`, файл йде в "Без дати". Окремий RAW-парсер не пишемо.
3. XMP sidecar (`.xmp` поряд із RAW) — поза скопом. Lightroom-flow окрема фіча.

## Alternatives revisited if

- `nom-exif` падає або повільний на реальних бібліотеках (10k+ файлів) — переходимо на `kamadak-exif` для фото + ручний MP4-парсер. Але це задокументоване подвоєння кодової бази.
- З'являється потреба write-back EXIF — `little_exif`.

## References

- crates.io: <https://crates.io/crates/nom-exif>
- GitHub: <https://github.com/mindeng/nom-exif>
- Latest version at decision time: 2.8.0
