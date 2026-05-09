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
- **Problem:** Registering a `#[tauri::command]` function in `tauri::generate_handler![...]` through a re-exported path (e.g. `scanning::pick_source_dir`) when the actual definition lives deeper (`scanning::command::pick_source_dir`).
- **Why it's bad:** The `#[tauri::command]` proc-macro generates two sibling macros next to the function (`__tauri_command_name_*`, `__tauri_cmd__*`). A `pub use module::name` only re-exports the named item — the function — and leaves the sibling macros behind. `generate_handler!` then does string replacement on the registration path: it takes the last segment and rewrites it to `__tauri_command_name_*`. When the path points at a re-export, the macro lookup resolves into the wrong module and the build fails on a fresh compile.
- **Fix:** Register in `generate_handler!` with the full path to where the function is actually defined: `scanning::command::pick_source_dir`. Keep `pub use command::name` re-exports only for ordinary imports from sibling modules.
- **First seen in:** PR #7 (commit `c7c503d`, EPIC-03)

- **AP-002: `Trusting third-party From<io::Error> mapping`**
- **Problem:** Calling `external_fn(path)?` at a third-party boundary — where `external_fn` opens the file internally — and assuming the resulting `io::Error` will land in the "I/O variant" of that crate's error enum.
- **Why it's bad:** Not every crate follows that convention. Example: `nom-exif` has `impl From<io::Error> for nom_exif::Error { fn from(e) -> Self { ParseFailed(e.into()) } }`, so an `io::Error` arrives as `ParseFailed`, not `IOError`. If our code matches on `IOError` to classify I/O failures, real I/O problems (missing file, permission denied) silently slip through as "format not recognised" and we return an empty result instead of `AppError::Io`.
- **Fix:** Keep the I/O boundary in our own code. Open the file ourselves (`File::open(path).map_err(...)`) **before** handing the handle to the third-party crate. The `io::Error` then flows through **our** `From<io::Error> for AppError` impl (where it lands in `AppError::Io`), and any error coming back from the third-party is guaranteed to be about format, not I/O.
- **First seen in:** PR #7 (commit `92ea1ec`, EPIC-03)
