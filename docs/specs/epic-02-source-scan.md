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

- [ ] Capabilities: `dialog:allow-open` у `capabilities/default.json`
- [ ] Підключити `tauri-plugin-dialog` як залежність + `.plugin(...)` у `lib.rs`
- [ ] Команда `pick_source_dir` через `tauri-plugin-dialog` (real, не stub)
- [ ] Команда `scan_source(path) -> ScanSummary { fileCount, sizeBytes, byKind }`
- [ ] Repository-обгортка з фільтрами (extensions з `MEDIA_EXTENSIONS`, hidden files, symlinks)
- [ ] Підключити кнопку Browse у `SetupScreen`
- [ ] Прибрати `DEFAULT_SOURCE` з UI
- [ ] Loading + error states для scan flow

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
