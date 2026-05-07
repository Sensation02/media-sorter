# EPIC-02. Source selection & scanning

**Status:** in progress
**Depends on:** EPIC-01

## Goal

Користувач обирає теку → ми рахуємо, що в ній є → показуємо preview перед запуском.

## Decisions

### Scan depth — **flat (top-level only)**

Скануємо тільки безпосередній вміст вибраної теки, у підпапки не заходимо. Recursive scan відкладено як майбутнє покращення (окрема фіча).

### Symlinks — **ignore**

Не слідуємо за symlink'ами. Захищає від циклів і виходу за межі вибраного scope. Опція follow-symlinks — на потім.

### Hidden files — **hardcoded skip**

`.DS_Store`, `Thumbs.db`, всі dotfiles (`^\.`), macOS metadata sidecars (`._*`) пропускаються завжди, без UI-опції.

### Multi-source — **single source only**

Користувач за один прогін вибирає одну теку. Multi-source — окрема фіча на потім.

### Cache — **fresh scan every time**

Без кешу між сесіями. Якщо вимірювання покажуть, що scan повільний на великих бібліотеках — зробимо нормальний кеш зі smart-інвалідацією окремим епіком.

### Capabilities required

- `dialog:allow-open` — для `pick_source_dir`
- `core:default` — вже є
- FS-доступ — Tauri дозволяє читати теку, яку користувач явно вибрав через dialog (drag-and-drop / dialog scope), без додаткових `fs:*` permissions для read-only top-level scan. Якщо в реалізації виявиться, що потрібен `fs:allow-read-dir`, додамо тоді.

## Subtasks

Backend (PR #4 — open, awaiting verify + merge):

- [x] Capabilities: `dialog:allow-open` у `capabilities/default.json`
- [x] Підключити `tauri-plugin-dialog` як залежність + `.plugin(...)` у `lib.rs`
- [x] Команда `pick_source_dir` через `tauri-plugin-dialog` (real, не stub)
- [x] Команда `scan_source(path) -> ScanSummary { fileCount, sizeBytes, byKind }`
- [x] Repository-обгортка з фільтрами (`scanning::service` + `scanning::filters` + `domain::extensions`)
- [x] Unit tests на критичні гілки (класифікація, hidden, flat, symlinks, validation)

UI integration (next session, окремий PR):

- [ ] Підключити кнопку Browse у `SetupScreen` (виклик `pick_source_dir`)
- [ ] Тригерити `scan_source` після вибору теки
- [ ] Рендерити `ScanSummary` (fileCount, sizeBytes, byKind) під полем шляху
- [ ] Loading + error states (toast на `AppError`, спінер під час scan)
- [ ] Прибрати `DEFAULT_SOURCE` з UI

## Progress notes

**Виконано в PR #4:**

1. Реалізовано весь Rust-шар `pick_source_dir` + `scan_source` за рішеннями зі spec (flat, no symlinks, hardcoded hidden filter, single source).
2. Створено `domain::extensions::classify_extension` — shared classifier для майбутніх EPIC-05 (planner) та EPIC-06 (FS ops). Винесено в `domain/`, не в `scanning/`, бо це shared concept.
3. **Inline-рефактор `AppError`** (вийшов поза первісний скоп EPIC-02, але доцільно зробити до того, як error-handling розпорошиться по коду): serde-форма змінена з `{ kind, ...fields }` на `{ code, params: { ... } }` для готовності до i18n у EPIC-10. Фабрики (`internal`, `validation`, `io`) тепер приймають `impl Display`. TS-двійник `AppErrorDto` оновлений.
4. Sandbox без GTK не дозволив запустити `cargo check` на CI-етапі — code review зроблено ручно, `cargo fmt --check` зелений. Локальна верифікація на Mac в чек-листі PR #4.

**Чого свідомо НЕ робили в цьому PR:**

- UI wiring — окремий PR, бо чистий React/IPC шар; backend стабільний, готовий до підключення.
- `spawn_blocking` для `scan_directory` — для MVP scan теки <10k файлів блокування одного tokio worker'а прийнятне; винесли як можливу майбутню оптимізацію.
- Розширення `AppError` варіантами `DirectoryNotReadable / PermissionDenied` тощо — не передбачаємо, додамо за фактом use-case.

## Resolved questions

1. **Recursive чи flat?** → flat (top-level only).
2. **Symlinks** → ignore.
3. **Hidden files** → hardcoded skip, без UI-опції.
4. **Multi-source** → single source only.
5. **Cache** → fresh scan every time.

## Open questions

(none)

## Out of scope

- Recursive scan (фіча на потім)
- Multi-source (фіча на потім)
- Scan cache (фіча на потім, якщо буде потреба)
- EXIF / metadata extraction (EPIC-03)
- Tree preview UI з expand/collapse (EPIC-05 у складі planner)
