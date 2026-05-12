# EPIC-09. Settings (persisted)

**Status:** 🟢 complete
**Branch:** `feat/epic-09-settings-*` (5 PRs — all merged)
**Depends on:** EPIC-01, EPIC-05, EPIC-06, EPIC-07
**Last updated:** 2026-05-12

## Goal

The user's preferences and last-session memo persist between app launches.
Settings drive how the planner names "unknown date" folders, how long the
history retention keeps undo logs, and whether the app prefills the last
sort rule and destination. Multi-language storage is baked in from the
start: the schema accepts any BCP-47 code, validated against an in-code
language registry that EPIC-10 will extend.

## Clarifications

### Assumptions

- `tauri-plugin-store` is the persistence layer (plain JSON file under
  `app_config_dir`). One store file, one schema version.
- The OS exposes a locale string in BCP-47-ish form (e.g. `uk-UA`,
  `en_US.UTF-8`). We only need the language subtag (`uk`, `en`).
- Settings files are small (< 1 KB). No need for streaming reads,
  partial loads, or background hydration.
- One user, one machine. No sync, no profiles.

### Resolved questions

| #   | Question                                                              | Resolution                                                                                                                       |
| --- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Persistence backend?                                                   | `tauri-plugin-store` — battle-tested, gives us atomic writes, hydration, and a typed read API on both sides.                     |
| Q2  | Single settings file or per-feature?                                   | Single `settings.json` under `app_config_dir`. Memo nested under `memo` key.                                                     |
| Q3  | Conflict policy (was settings `skipDuplicates`)?                       | **Hardcoded auto-rename** with `(1)`, `(2)`, ... suffix. No toggle, no dialog. Move-only (no copy).                              |
| Q4  | Report files (was settings `writeReport`)?                             | **None.** `HistoryScreen` is the report. EPIC-09 owns retention of those history records.                                        |
| Q5  | Include / exclude media kinds (was `includeRawFiles` / `includeVideos`)? | **Hardcoded include all.** All `MediaKind` variants are always processed.                                                       |
| Q6  | Default UI language?                                                   | Auto-detect from OS via `sys_locale` crate; fall back to `en` if the detected code is not in the registry.                       |
| Q7  | Language storage type?                                                 | `String` (BCP-47 subtag) validated against `i18n::registry::SUPPORTED_LANGUAGES`. Not a closed union — extends without migration. |
| Q8  | `unknownDateFolderName` shape?                                         | `Option<String>` / `string \| null`. `null` → locale default from registry. Explicit value wins regardless of `uiLanguage`.       |
| Q9  | Toggles S1 (remember sort rule) and S2 (remember destination) — one or two? | **Two separate** toggles. Different real-world use cases for each.                                                          |
| Q10 | `historyRetentionDays` range?                                          | Validated `[7, 365]`. Default 30. Out-of-range → clamp + warn at load time.                                                      |
| Q11 | Reset to defaults — does it also clear memo?                           | **No.** Reset only restores user-facing settings. Memo is auto-managed and survives a reset.                                     |
| Q12 | Forward-compat with unknown fields in settings.json?                   | Ignore + log. Never delete unknown fields on write — preserve them so older app versions don't lose newer-version data.          |
| Q13 | PR split?                                                              | 5 PRs: foundation → UI wiring → memo behaviour → planner behaviour → retention GC. See Scope.                                    |

### Edge cases (must be covered by tests)

- `settings.json` missing → write defaults, persist, continue.
- `settings.json` corrupt (not valid JSON) → log + overwrite with
  defaults; never block app start.
- `settings.json` has unknown field (e.g. `theme: "dark"`) → ignore on
  read, preserve on write (forward-compat).
- `settings.json` missing required field → fill with default for that
  field only, leave others untouched.
- `historyRetentionDays` is `5` or `999` → clamp to `[7, 365]`, log
  warning, write clamped value back.
- `uiLanguage` is `xx` (not registered) → fall back to `en`, log.
- `unknownDateFolderName` set to empty string `""` → treat as `null`.
- `unknownDateFolderName` contains path separators (`/`, `\`, `:`) → reject
  at IPC `set_settings` validator with `AppError::Validation`.
- `memo.lastDestination` points to a path that no longer exists → silently
  ignore at startup (Article I — don't lecture the user about their files).
- `memo.lastSortRule` is a value not in `SortRuleId` → ignore + log.
- Reset clicked → settings revert; memo is preserved.
- First launch on macOS with `LANG=uk_UA.UTF-8` → `uiLanguage` defaults
  to `uk`.

### Constraints

- Article I: settings persistence touches only `app_config_dir`. Never
  writes outside it. History GC deletes only undo-journal files, never
  user media.
- Article II: language detection is system-only (`sys_locale`), zero
  network calls.
- Article III: one store file, one schema. No DSL, no plug-in settings
  providers.
- Article V: every boundary input (IPC payload, JSON file load) is
  validated; invalid values are coerced or rejected with `AppError`.
- Article VI: `settings.json` is plain JSON. A user can edit it by hand
  and the app accepts the change on next launch (forward-compat rules
  apply).
- Article IX: integration tests cover hydration, validation, forward-compat,
  retention GC, and locale fallback.

## Scope

### PR1 (`feat/epic-09-settings-backend`) — `feat(settings)`: backend store + IPC contract

- New Rust module `src-tauri/src/settings/`:
  - `model.rs` — `AppSettings`, `SessionMemo` structs with `serde`
    derives and `Default` impls.
  - `defaults.rs` — `DEFAULT_HISTORY_RETENTION_DAYS = 30`,
    `MIN_HISTORY_RETENTION_DAYS = 7`, `MAX_HISTORY_RETENTION_DAYS = 365`,
    folder-name char blacklist.
  - `validator.rs` — `validate_settings(raw) -> AppSettings`: clamps,
    coerces, rejects bad inputs.
  - `repository.rs` — wraps `tauri-plugin-store` calls; atomic load /
    save / reset.
  - `service.rs` — hydrate at startup, expose typed accessors, log
    warnings.
  - `command.rs` — IPC: `get_settings`, `set_settings`, `reset_settings`,
    `get_memo`, `set_memo`.
  - `dto.rs` — `AppSettingsDto`, `SessionMemoDto` (camelCase mirror).
- New Rust module `src-tauri/src/i18n/`:
  - `registry.rs` — `LanguageEntry { code, native_name, unknown_date_folder }`
    + `SUPPORTED_LANGUAGES: &[LanguageEntry]` seeded with `en`, `uk`.
  - `mod.rs` — re-export + `validate_language_code()`,
    `unknown_date_folder_for(lang)`.
- New crate dependencies: `tauri-plugin-store v2.4.3`, `sys-locale v0.3.2`.
- No Tauri capability change — frontend never calls the store plugin
  directly; only our wrapper commands (`get_settings`, etc.) access the
  store via Rust-side `StoreExt`. Principle of least privilege.
- `lib.rs` — register the plugin and the 5 new commands.
- TS counterparts in `src/types/ipc.ts`: `AppSettingsDto`, `SessionMemoDto`,
  `LanguageCode` (typed alias for `string`).
- IPC wrappers added to the existing flat `src/ipc/commands.ts` (matches
  the codebase convention — no new `settings.ts` file).
- Unit tests for the validator (5) and i18n registry (4).
  AppHandle-level integration tests deferred to PR2 (UI manual testing
  + Tauri webview round-trip will validate the persistence path under
  real conditions).
- `STATUS.md` row → 🟡 **in progress**.
- `CHANGELOG.md` entry (Features).

### PR2 (`feat/epic-09-settings-ui`) — `feat(ui)`: SettingsScreen wiring

- `useSettings()` hook calling `getSettings()` / `setSettings()` /
  `resetSettings()`.
- `SettingsScreen` rebuilt to read / write real values:
  - Two toggles: "Remember last sort rule", "Remember last destination".
  - Text input: "Unknown-date folder name" with locale-aware placeholder
    ("Misc / Різне").
  - Number input: "History retention (days)" with `min=7`, `max=365`.
  - Disabled language dropdown with hint "Available in EPIC-10".
  - Reset-to-defaults button.
- `SortApp` no longer holds `useState(DEFAULT_SETTINGS)` — pulls from
  `useSettings()`.
- Empty / loading / error states for the screen.
- Vitest tests for the hook and the screen.
- `STATUS.md` unchanged (still 🟡).

### PR3 (`feat/epic-09-settings-memo`) — `feat(settings)`: apply S1 / S2 memo

- On `start_sort` (`src-tauri/src/sorting/command.rs`): call
  `settings::service::write_memo({ last_sort_rule, last_destination })`
  before the runner begins.
- `SortApp` startup logic: if `settings.rememberLastSortRule` → use
  `memo.lastSortRule ?? DEFAULT_SORT_RULE`; same for destination.
- No test bloat — one unit test on the SortApp hook prefill logic.
- `CHANGELOG.md` entry (Features).

### PR4 (`feat/sorting): apply unknownDateFolderName`

- Planner reads `settings.unknownDateFolderName ?? i18n::unknown_date_folder_for(settings.ui_language)`
  at plan-building time.
- Three planner test scenarios: EXIF present (no fallback), mtime
  fallback active (no folder needed), both absent (folder name applied
  from override OR registry default).
- `CHANGELOG.md` entry (Features).

### PR5 (`feat/history`: apply retention policy)

- `app::setup` hook calls `history::service::gc(retention_days)` once at
  startup.
- GC walks `app_data_dir/jobs/`, deletes `<jobId>.summary.json` and
  `<jobId>.jsonl` pairs older than `retention_days * 86_400_000` ms
  before "now".
- Article I guard: never delete a file outside `app_data_dir/jobs/`,
  never delete a file with mtime in the future, never delete a file
  whose `jobId` is currently the head of a running job.
- Integration test in tmpdir with a frozen clock.
- `STATUS.md` row → 🟢 **complete**.
- `CHANGELOG.md` entry (Features).

## Decisions

### Single store file, nested memo

One `app_config_dir/settings.json` holds both user-edited settings and
auto-managed `memo`. Splitting into two files would double the
hydration path and the failure surface without a real lifecycle benefit
— Article III pulls us toward the simpler shape. The `memo` key is
clearly namespaced in the JSON so a curious user reading the file can
tell it apart from settings.

### Validation always at the boundary, never inside business logic

`AppSettings` after hydration is **trusted**: every field is in range,
every enum value is registered, every path string is well-formed. The
contract is held by `validator.rs`, which runs on load and on
`set_settings`. Code that consumes settings (planner, history GC, sort
runner) does not re-validate. This concentrates the constraint
knowledge in one place and matches Article V's "validate at boundaries,
not throughout."

### Forward-compatible field handling

The validator preserves unknown JSON fields on read by parsing into a
`serde_json::Value` first, then extracting known fields by name. The
unknown fields are kept in a separate `extras: Map<String, Value>`
field on the in-memory store and written back unchanged on save. If a
newer app version writes `theme: "dark"` and an older binary loads the
file, the older binary will round-trip `theme` untouched. This is what
"forward-compatible" actually means in practice (Article VII).

### Language registry as a `&'static` table

`SUPPORTED_LANGUAGES` is a `&[LanguageEntry]` constant in
`i18n/registry.rs`. Each entry is `&'static str` fields — zero heap
allocations at startup, validator returns
`Option<&'static LanguageEntry>`. Adding a language in EPIC-10 is
exactly one row in the table; no schema migration of `settings.json`.

### OS locale detection only on first launch

`sys_locale::get_locale()` is consulted exactly once: when
`settings.json` does not exist. After the first launch, the persisted
`uiLanguage` wins until the user changes it. This avoids the surprise
of an app silently switching language because the user changed their
OS locale between sessions.

### Retention GC at startup, not on a timer

The GC runs synchronously inside `app::setup`. We accept the one-time
small latency at launch (typical case: empty or under-50 entries) in
exchange for not maintaining a background scheduler. If retention
becomes a heavy operation (10K+ jobs), a follow-up moves it to an
async post-setup spawn — not needed for MVP.

### Reset preserves memo

A user clicking "Reset to defaults" wants the settings reset. Wiping
`memo.lastDestination` and `memo.lastSortRule` at the same time would
trash a useful UX state for no semantic reason. Memo lives or dies
with its own lifecycle: it is only touched by `start_sort` write and a
hypothetical future `clear_memo` (not in this epic).

## IPC contract

| Command           | Input             | Output             | Notes                                                                    |
| ----------------- | ----------------- | ------------------ | ------------------------------------------------------------------------ |
| `get_settings`    | —                 | `AppSettingsDto`   | Returns the hydrated, validated settings.                                |
| `set_settings`    | `AppSettingsDto`  | `AppSettingsDto`   | Validates, persists, returns the post-validation value (clamps visible). |
| `reset_settings`  | —                 | `AppSettingsDto`   | Restores defaults, preserves memo, returns the new settings.             |
| `get_memo`        | —                 | `SessionMemoDto`   | Read-only accessor for `SortApp` startup prefill.                        |
| `set_memo`        | `SessionMemoDto`  | `()`               | Called from `start_sort`. UI does not call this directly.                |

DTO additions (PR1):

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettingsDto {
    pub remember_last_sort_rule: bool,
    pub remember_last_destination: bool,
    pub unknown_date_folder_name: Option<String>,
    pub history_retention_days: u16,
    pub ui_language: String,
    pub memo: SessionMemoDto,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionMemoDto {
    pub last_sort_rule: Option<SortRuleId>,
    pub last_destination: Option<PathBuf>,
}
```

TS mirror:

```ts
export type AppSettingsDto = {
  rememberLastSortRule: boolean;
  rememberLastDestination: boolean;
  unknownDateFolderName: string | null;
  historyRetentionDays: number;
  uiLanguage: string;
  memo: SessionMemoDto;
};

export type SessionMemoDto = {
  lastSortRule: SortRuleId | null;
  lastDestination: string | null;
};
```

## Subtasks

### PR1 — backend foundation

- [x] Lock decisions in this spec (Q1–Q13)
- [x] Add `tauri-plugin-store v2.4.3` and `sys-locale v0.3.2`
- [x] `i18n/registry.rs` with `en` + `uk` entries
- [x] `i18n/mod.rs` validator + lookup helpers
- [x] `AppSettings`, `SessionMemo` added to `domain/mod.rs` (cross-feature)
- [x] `settings/defaults.rs`
- [x] `settings/validator.rs` (forward-compat via plugin store key-by-key set, not `extras` blob — simpler invariant)
- [x] `settings/repository.rs` plugin-store wrapper
- [x] `settings/service.rs` hydrate + accessors
- [x] `settings/command.rs` IPC handlers
- [x] `settings/dto.rs` request envelopes
- [x] `settings/mod.rs` barrel
- [~] Capability JSON — not needed; frontend uses our wrappers only
- [x] `lib.rs` plugin + handler registration (full paths per AP-001)
- [x] TS `AppSettingsDto`, `SessionMemoDto`, `LanguageCode` in `src/types/ipc.ts`
- [x] IPC wrappers added to flat `src/ipc/commands.ts` (codebase convention)
- [~] AppHandle-level integration tests deferred to PR2
- [x] STATUS.md row → 🟡 in progress
- [x] CHANGELOG entry

### PR2 — UI wiring

- [x] `useSettings()` hook with discriminated state (loading / success / error)
- [x] `SettingsScreen` rebuilt for AppSettings shape, exposes reset button
- [x] `SortApp` switches from `useState(DEFAULT_SETTINGS)` to `useSettings()`; `LEGACY_SORT_SETTINGS` constant bridges to `startSort` until PR3 removes `SortSettingsDto`
- [x] Locale-aware placeholder for unknown-date folder input (Misc / Різне)
- [x] Disabled language hint "Available in EPIC-10" with current language native name
- [x] Loading and error states; reset preserves memo on the backend
- [x] Vitest: 5 tests on `useSettings` + 7 tests on `SettingsScreen`
- [x] CHANGELOG entry

### PR3 — memo behaviour

- [x] `sorting/command.rs::start_sort` writes memo on entry (best-effort, skips on dry-run; failure logs and does not abort the sort)
- [x] `SortApp` prefills `SetupScreen.defaultRuleId` from `memo.lastSortRule` when `rememberLastSortRule` is on
- [x] `SortApp` auto-scans `memo.lastDestination` once on first successful settings hydration when `rememberLastDestination` is on (gated by `prefillTriggeredRef`)
- [x] `SetupScreen` accepts optional `defaultRuleId`; render-phase reset pattern keeps local `ruleId` in sync if the prop changes
- [~] Unit tests for prefill — `resolveDefaultRule` is a trivial helper (skipped per CLAUDE.md §IX); backend memo write requires Tauri `mock_app` (deferred). Manual smoke-test in PR description.
- [x] CHANGELOG entry

### PR4 — planner behaviour

- [x] `SortStrategy::folder_segments` and `build_plan` accept `unknown_folder: &str` — strategies no longer hardcode `MISC_FOLDER`
- [x] `sorting/command.rs::run_preview` loads settings and resolves the folder name (`settings.unknown_date_folder_name` ∪ `i18n::unknown_date_folder_for(ui_language)`)
- [x] Two new tests: strategy-level (`by_date_uses_custom_unknown_folder_when_capture_missing`) and integration-level (`build_plan_uses_passed_unknown_folder_when_capture_missing` with a Ukrainian-localized example)
- [x] CHANGELOG entry

### PR5 — history retention

- [x] `history::gc::collect(jobs_dir, retention_days, now_ms)` walker — pure logic, takes clock as parameter for testability
- [x] Article I safety guards: scope (only iterates `jobs_dir`), future-mtime (`job_id > now_ms` → refuse), active job (`job::is_active(job_id)` → refuse). New helper `sorting::runner::job::is_active`.
- [x] `lib.rs` setup wires `collect_history_retention(handle, settings.history_retention_days)` after `settings::hydrate`. Failures and counts logged, never abort startup.
- [x] Six frozen-clock unit tests in tmpdir cover: missing dir, expired pair, recent kept, future-mtime refused, active job skipped, junk files ignored
- [x] STATUS.md row → 🟢 complete
- [x] CHANGELOG entry

## Out of scope

- File-watcher / auto-sort on new files → separate future epic.
- UI translations and the language picker → EPIC-10 (this epic only
  scaffolds the registry and the storage field).
- Theme (light / dark) → not on the MVP roadmap.
- Multi-profile / multi-user support → single-user MVP.
- Sync settings across machines → single-machine MVP.
- A schema-versioned migration framework → defer until we have a
  breaking schema change to actually migrate; forward-compat handling
  carries us until then.
- `dryRun` toggle → already covered by EPIC-05 preview tree; not a
  setting.

## References

- Constitution articles touched: I (reversibility — retention GC
  touches only undo journals), II (privacy — OS-only locale detection),
  III (simplicity — single store, no DSL), V (type safety — validation
  at boundary), VI (reversibility of code — plain JSON, human-editable),
  VII (documentation), IX (tests).
- Related specs: [EPIC-01](epic-01-foundation.md),
  [EPIC-05](epic-05-planner.md), [EPIC-06](epic-06-fs-operations.md),
  [EPIC-07](epic-07-history-undo.md), [EPIC-10](epic-10-i18n.md).
- Crate docs: [tauri-plugin-store](https://docs.rs/tauri-plugin-store/),
  [sys_locale](https://docs.rs/sys-locale/).
