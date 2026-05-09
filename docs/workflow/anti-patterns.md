# Anti-Patterns

This file is the codified memory of mistakes already made on this project. Every PR review can add new entries here.

## Format

Each entry has the structure:

- **AP-XXX: `<Short name>`**
- **Problem:** description of the bad pattern
- **Why it's bad:** consequence — what breaks, what becomes hard, what gets confusing
- **Fix:** correct approach
- **First seen in:** PR number or commit SHA

Identifiers are sequential (`AP-001`, `AP-002`, ...). Never reuse or renumber — once assigned, an AP-XXX is permanent.

## Entries

- **AP-001: `Tauri command registration via re-export`**
- **Problem:** Реєструвати `#[tauri::command]`-функцію в `tauri::generate_handler![...]` за path до її реекспорту (наприклад `scanning::pick_source_dir`), коли реальне визначення живе глибше (`scanning::command::pick_source_dir`).
- **Why it's bad:** `#[tauri::command]` proc-macro генерує поряд із функцією два sibling-macros (`__tauri_command_name_*`, `__tauri_cmd__*`). `pub use module::name` реекспортує лише іменований item — функцію, але не сусідні macros. `generate_handler!` потім робить string-replacement на path: бере останній сегмент і міняє на `__tauri_command_name_*`. Якщо path вказує на реекспорт, lookup macros веде в неправильний модуль і build падає на свіжому компіляторі.
- **Fix:** Реєструвати в `generate_handler!` за повним шляхом до місця, де функція реально визначена: `scanning::command::pick_source_dir`. Реекспорти `pub use command::name` залишати лише для звичайних import-ів з інших модулів.
- **First seen in:** PR #7 (commit `c7c503d`, EPIC-03)

- **AP-002: `Trusting third-party From<io::Error> mapping`**
- **Problem:** На boundary з зовнішнім crate робити `external_fn(path)?` (де `external_fn` всередині відкриває файл) і покладатись на те, що `io::Error` приїде у "I/O variant" їхнього error enum.
- **Why it's bad:** Не всі crate-и узгоджуються з конвенцією. Приклад: `nom-exif` має `impl From<io::Error> for nom_exif::Error { fn from(e) -> Self { ParseFailed(e.into()) } }` — `io::Error` мапиться у `ParseFailed`, не в `IOError`. Якщо ти матчиш на `IOError` для класифікації I/O помилок — пропускаєш реальні I/O проблеми (відсутній файл, permission denied) як "формат не розпізнано" і повертаєш порожній результат замість `AppError::Io`.
- **Fix:** Тримати I/O boundary в своєму коді. Відкривати файл власноруч (`File::open(path).map_err(...)`) **до** того, як передавати handle у чужий crate. Тоді `io::Error` йде через **твій** `From<io::Error> for AppError` impl (де він мапиться в `AppError::Io`), а помилки чужого crate точно стосуються формату, не I/O.
- **First seen in:** PR #7 (commit `92ea1ec`, EPIC-03)
