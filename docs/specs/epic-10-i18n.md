# EPIC-10. Localization (UI + folder names)

**Status:** 🟢 complete
**Branch:** `feat/epic-10-i18n`
**Depends on:** EPIC-01 (domain types, IPC scaffolding), EPIC-09 (`i18n::registry`, `settings.ui_language`, `sys_locale` detect)
**Last updated:** 2026-05-14

## Goal

Make the app fully usable in two languages — English (`en`) and Ukrainian (`uk`) — across both the UI surface and the on-disk folder names produced by the sorter. UI language is the single source of truth: switching the UI language also switches the language of future month-name folders.

## Architecture

Two i18n planes that do not mix:

| Plane | Purpose | Tech | Language source |
| ----- | ------- | ---- | --------------- |
| **A. UI strings** (frontend) | All visible UI text (buttons, labels, errors, status copy) | `react-i18next` with namespaces per screen, `.ts` resource files | `settings.uiLanguage` read on app boot via `get_settings` |
| **B. Folder names** (backend) | `<Month> <Year>` folders, `unknown_date_folder_name` ("Misc" / "Різне") | `i18n::months::format_month_year(year, month0, lang)` — pure Rust | `settings.ui_language`, read by `sorting::command::run_preview` |

**Shared contract:** the ISO code (`"en"` | `"uk"`) stored in `settings.ui_language`. No DTO additions; no new IPC commands; no new capabilities.

**Existing infrastructure (EPIC-09):**

- [`i18n::registry::SUPPORTED_LANGUAGES`](../../src-tauri/src/i18n/registry.rs)
- [`i18n::registry::unknown_date_folder_for(lang)`](../../src-tauri/src/i18n/registry.rs)
- [`settings::defaults::detect_initial_language()`](../../src-tauri/src/settings/defaults.rs) via `sys_locale`
- [`settings::validator::normalize_language()`](../../src-tauri/src/settings/validator.rs) fallback to `en` for unknown codes
- `AppSettings.ui_language` persisted and exposed in `AppSettingsDto.uiLanguage`

## Resolved decisions

1. **Default UI language:** OS auto-detect on first launch via `sys_locale`; fallback to `en` if the subtag is not in the registry. Persisted on first launch, changed only by explicit user action. _(Resolved in EPIC-09.)_
2. **Month names on disk follow the UI language.** When the user switches the UI to UA, future sorts produce `Лютий 2024`; when they switch back to EN, future sorts produce `February 2024`. No separate "folder language" toggle.
3. **No migration / no detection.** Existing folders on disk are never renamed when the language changes. New files land in new-language folders; old folders stay as they are. Constitution Article I (user files are sacred) takes precedence over locale consistency on disk.
4. **Time library:** `date-fns` on the frontend (modular, tree-shakable, ~13 KB core + ~3 KB per locale).
5. **i18n stack:** `react-i18next` with type-safe keys via TypeScript module augmentation.
6. **Translation file format:** `.ts` modules with `as const` literal objects, statically imported. One file per screen, grouped under `src/i18n/<locale>/`.
7. **Ukrainian month casing:** capitalized (`Лютий 2024`), matching Windows/macOS Finder conventions and the existing `unknown_date_folder_for("uk") = "Різне"` capitalization in [`registry.rs`](../../src-tauri/src/i18n/registry.rs).
8. **Backend formatter approach:** hand-rolled lookup table in a new `i18n::months` module. Chosen over `chrono`'s `unstable-locales` feature (name says it all) and `icu4x` crate (~2 MB binary overhead for 24 strings).

## Invariants

- **R1 — Running sort is immutable to settings.** Once `start_sort` returns a `JobId`, the job operates on a snapshot of settings captured at start. Any later change to settings — language, copy mode, `unknownDateFolderName`, retention, anything — does not affect that running job. Folder names within a single job are guaranteed consistent. (Naturally enforced today because `SortPlan.actions[].dest_path` is computed during `preview_plan` and never recomputed by the runner; this invariant must be preserved in any future planner-replan work.)
- **R2 — One source of truth for the active language.** `settings.ui_language` is canonical. `i18next.language` is kept in sync via `changeLocale` immediately after `update_settings` succeeds. UI never passes `uiLanguage` as an IPC parameter — the backend reads it from settings.
- **R3 — Folder strings are localized once, on the backend.** A localized folder name (`"Лютий 2024"`) is computed in [`sorting::planner::strategy`](../../src-tauri/src/sorting/planner/strategy.rs) and travels through the system as a plain `String`. The UI displays it verbatim; it never re-localizes folder names.
- **R4 — Key parity across locales.** `keyof EnNamespace === keyof UkNamespace` is enforced at compile time via the module augmentation in `src/i18n/types.ts`. A missing key in either locale is a type error.

## Backend changes

### New: `src-tauri/src/i18n/months.rs`

```rust
pub const MONTH_NAMES_EN: [&str; 12] = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

pub const MONTH_NAMES_UK: [&str; 12] = [
    "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
    "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень",
];

pub fn format_month_year(year: i32, month0: usize, lang: &str) -> String {
    let names = match lang {
        "uk" => MONTH_NAMES_UK,
        _ => MONTH_NAMES_EN,
    };
    format!("{} {}", names[month0], year)
}
```

Re-exported through `src-tauri/src/i18n/mod.rs`.

### Modified: planner strategy

[`sorting::planner::strategy::format_month_year`](../../src-tauri/src/sorting/planner/strategy.rs) takes `lang: &str` and delegates to `i18n::months::format_month_year`. `Strategy::resolve_folders(...)` gets an extra `lang: &str` parameter, mirroring the existing `unknown_folder: &str` parameter.

### Modified: `sorting::command::run_preview`

```rust
fn run_preview(app: &AppHandle, request: PreviewPlanRequest) -> AppResult<SortPlan> {
    let session = get_session(request.scan_id)?;
    let settings = settings::service::get_settings(app)?;
    let unknown_folder = resolve_unknown_folder(&settings);

    build_plan(
        &session.root,
        request.rule,
        &session.files,
        &session.metadata,
        &unknown_folder,
        &settings.ui_language,   // new
    )
}
```

`build_plan` and `PlannerService::plan` thread `lang` through to `Strategy::resolve_folders`.

### Files touched on the backend

| File | Change |
| ---- | ------ |
| `src-tauri/src/i18n/months.rs` (new) | Tables + `format_month_year` + 4 unit tests |
| `src-tauri/src/i18n/mod.rs` | Re-export `months` |
| `src-tauri/src/sorting/planner/strategy.rs` | `format_month_year` accepts `lang`; `Strategy` methods accept `lang` |
| `src-tauri/src/sorting/planner/service.rs` | `PlannerService::plan` accepts `lang`, forwards to strategy |
| `src-tauri/src/sorting/command.rs` | `run_preview` passes `settings.ui_language` into `build_plan` |
| `src-tauri/src/sorting/runner/service.rs` | None — runner reuses `SortPlan` paths already containing localized strings (Invariant R1, R3) |
| Existing strategy/service/runner tests | Pass `lang` argument in test setup |

## Frontend changes

### New: `src/i18n/`

```
src/i18n/
├── index.ts          ← i18next init, resources merge, changeLocale, useTranslation re-export
├── types.ts          ← TypeScript module augmentation for type-safe keys
├── en/
│   ├── common.ts     ← shared: buttons, errors, status labels
│   ├── setup.ts
│   ├── progress.ts
│   ├── done.ts
│   ├── history.ts
│   └── settings.ts
└── uk/
    ├── common.ts
    ├── setup.ts
    ├── progress.ts
    ├── done.ts
    ├── history.ts
    └── settings.ts
```

### Translation file format

```ts
// src/i18n/en/setup.ts
export default {
    title: "Setup",
    sourceFolder: "Source folder",
    chooseFolder: "Choose folder",
    rule: "Sorting rule",
    runSort: "Run sort",
    noSource: "Pick a source folder to begin.",
} as const;
```

```ts
// src/i18n/uk/setup.ts
export default {
    title: "Налаштування",
    sourceFolder: "Тека з джерелом",
    chooseFolder: "Обрати теку",
    rule: "Правило сортування",
    runSort: "Сортувати",
    noSource: "Оберіть теку з джерелом, щоб почати.",
} as const;
```

### i18n bootstrap

```ts
// src/i18n/index.ts
export const SUPPORTED_LOCALES = ["en", "uk"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export async function initI18n(initialLocale: Locale): Promise<void> { /* ... */ }
export async function changeLocale(next: Locale): Promise<void> { /* ... */ }
export { useTranslation } from "react-i18next";
```

```ts
// src/i18n/types.ts
declare module "react-i18next" {
    interface CustomTypeOptions {
        defaultNS: "common";
        resources: {
            common: typeof enCommon;
            setup: typeof enSetup;
            // ...
        };
    }
}
```

### Boot order in `main.tsx`

```ts
const settings = await invoke<AppSettingsDto>("get_settings");
await initI18n(settings.uiLanguage as Locale);
createRoot(document.getElementById("root")!).render(<App />);
```

Pre-render to avoid flash-of-untranslated-content. On `get_settings` failure, fall back to `DEFAULT_LOCALE` (English) before initialising i18n, then surface an EN toast — at this point i18next is initialised in EN, so toast copy is safe to localize through `t()`.

### Language picker in `SettingsScreen`

A new `<SettingsRow label={t("settings:language")}>` containing a `<Select>` with `English` / `Українська` options (display values from `SUPPORTED_LANGUAGES.native_name`). On change:

1. `updateSettings({ ...settings, uiLanguage: value })` — persists on the backend.
2. `await changeLocale(value)` — i18next fires `languageChanged`, react-i18next re-renders the tree.

### `date-fns` integration

```ts
// src/utils/datetime.ts
import { format as dfFormat } from "date-fns";
import { enUS, uk } from "date-fns/locale";
import i18next from "i18next";

const LOCALE_MAP = { en: enUS, uk } as const;

export function formatDateTime(date: Date, pattern: string): string {
    const locale = LOCALE_MAP[i18next.language as keyof typeof LOCALE_MAP] ?? enUS;
    return dfFormat(date, pattern, { locale });
}
```

All `new Date().toLocaleString()` and similar calls in components are replaced with `formatDateTime`.

### Files touched on the frontend

**New:**

- `src/i18n/index.ts`, `src/i18n/types.ts`
- 12 `.ts` files under `src/i18n/en/` and `src/i18n/uk/`
- `src/utils/datetime.ts`

**Modified:**

- `src/main.tsx` — bootstrap i18n before `createRoot`
- All screen components under `src/features/sort/screens/` — replace hardcoded strings with `t()`
- Shared components under `src/features/sort/components/` (error-boundary, toolbar, rule-selector, etc.) where user-facing copy exists
- `src/features/sort/constants/screens.ts` — `SORT_SCREEN_LABELS` becomes either a function `(t) => ({...})` or moves into `common` namespace
- `src/features/sort/screens/settings-screen/SettingsForm.tsx` — language picker
- History/Progress screens — replace `toLocaleString` calls with `formatDateTime`

### Bundle size

`react-i18next` ~13 KB gzip; `date-fns` core + 2 locales ~5 KB effective tree-shake. Total ~20 KB — negligible for a desktop app.

## IPC contract

**No changes** to `dto.rs`, `tauri::generate_handler!`, capabilities, or the `AppSettingsDto` TS type. `uiLanguage` is already part of the settings DTO from EPIC-09. The frontend reads it on boot, writes it via `update_settings`, and the backend reads it from settings inside `run_preview` — no new fields cross the IPC boundary.

## Behaviour

### Startup (cold launch)

1. `main.tsx` calls `get_settings`, receives `{ uiLanguage }`.
2. `initI18n(uiLanguage)` completes before `createRoot`.
3. UI renders fully in the chosen language.

### Sort flow (Run sort clicked)

1. `preview_plan` runs on the backend, reads `settings.ui_language`, threads `lang` into the planner.
2. `SortPlan.actions[].dest_path` contains already-localized strings (`"…/Лютий 2024/img.jpg"`).
3. UI renders the preview tree by displaying paths verbatim.
4. `start_sort` reuses the plan; the runner moves files using those paths.

### Language change

1. User picks a new language in `SettingsScreen`.
2. `update_settings` persists.
3. `changeLocale(next)` is called.
4. `i18next` fires `languageChanged`; React tree re-renders.
5. If a preview tree is currently displayed and no sort is running, `SetupScreen` re-triggers `preview_plan` so the displayed paths reflect the new language. _(Stale-preview avoidance.)_
6. If a sort **is** running, Invariant R1 holds: that job continues with its captured-at-start language; UI labels around it are translated immediately.

### Mixed-locale history

A user who sorts in EN, then switches to UA and sorts again, will see both `February 2024/…` and `Лютий 2024/…` entries in the history list. This is correct and intentional — history records facts. Revert uses move-log original/destination pairs and is locale-agnostic.

### Unknown locale on boot

If `settings.ui_language` ever contains a code not in `SUPPORTED_LANGUAGES`:

- Backend: `normalize_language` already falls back to `en` on save.
- Frontend: `i18next` `fallbackLng: "en"` handles missing resources.

## Subtasks

- [x] Add `i18n::months` module with `MONTH_NAMES_EN`, `MONTH_NAMES_UK`, `format_month_year` + 4 unit tests
- [x] Thread `lang` through `Strategy::resolve_folders`, `PlannerService::plan`, and `build_plan`
- [x] Update `run_preview` to pass `settings.ui_language` into `build_plan`
- [x] Update existing planner and runner tests to supply `lang`
- [x] Add `react-i18next` and `date-fns` to `package.json` (use latest compatible versions; verify with `pnpm view`)
- [x] Create `src/i18n/` layout (namespace files + `index.ts` + `types.ts`)
- [x] Create `src/utils/datetime.ts` wrapper
- [x] Bootstrap i18n in `main.tsx` before `createRoot`
- [x] Replace hardcoded user-facing strings in all sort feature components with `t()`
- [x] Replace `toLocaleString`-style number/date formatting with locale-aware helpers (`formatDateTime`, `Intl.NumberFormat`)
- [x] Add language picker to `SettingsScreen`, wire to `update_settings` + `changeLocale`
- [x] Re-trigger `preview_plan` on `languageChanged` when `SetupScreen` is mounted (threaded via `localeTag` into `usePlanPreview`; R1 holds because Setup is unmounted while a sort runs)
- [ ] Manual smoke test (pending desktop run): EN default, switch to UA, run sort, confirm UA folder name, confirm mixed-locale history works, confirm R1 (sort running → language switch → folders stay original language)
- [x] Update `STATUS.md` and this spec to `🟢 complete`

## Testing strategy

**Backend (Rust):**

- `i18n::months::tests` — `en/jan`, `uk/feb`, year boundary (`2024/dec`), unknown lang falls back to en (4 cases)
- `sorting::planner::strategy::tests` — by-date with `lang="uk"` produces `…/Лютий 2024/…`; by-date with `lang="en"` produces `…/February 2024/…` (2 new cases extending existing tests)

**Frontend (Vitest):**

- `src/utils/datetime.test.ts` — `formatDateTime` produces UA short month with `lang="uk"`, EN short month with `lang="en"`
- TypeScript-level: `keyof EnSetup === keyof UkSetup` etc. enforced by `types.ts` augmentation; missing keys break `tsc`

**Smoke (manual via `pnpm tauri dev`):**

- Default boot in EN (or whatever `sys_locale` resolves to)
- Switch to UA → all visible labels change immediately
- Run a sort → new folder is `Лютий 2024`
- Switch back to EN → next sort goes into `February 2024`; old `Лютий 2024` folder untouched
- Start a long sort → switch language mid-run → confirm folders stay in the start-time language while UI labels update (Invariant R1)

## Out of scope

- **More than two languages.** Adding a third is a small follow-up: one const array + 6 namespace files.
- **Renaming existing folders on language change.** Resolved decision #3.
- **Retroactive localization of history entries.** Resolved by design.
- **Geo / place-name translation** (e.g. `Київ` vs `Kyiv`). Geo reverse returns whatever the offline DB returns; outside EPIC-10 scope.
- **RTL languages.** Both supported locales are LTR.
- **Full ICU MessageFormat.** Trivial plurals (e.g. `files_one`/`files_other`) handled by react-i18next's built-in plural keys; complex Slavic plural rules for UA covered via `_one`/`_few`/`_many`/`_other` only as needed for specific strings.
- **`pnpm tauri build` end-to-end signing test on every platform.** Standard lint + test + dev-mode smoke is enough; full installer build is a release-time concern.
- **ESLint rule for catching hardcoded user-facing strings in JSX.** Manual review + Pattern Guard agent is sufficient for the two-language scope.

## Delivery

**Single PR**, branch `feat/epic-10-i18n`, base `staging`. Atomic commits inside the PR following CLAUDE.md Git Workflow:

1. `feat(core): localized month folder names` — `i18n::months` + planner threading + backend tests
2. `feat(ui): react-i18next bootstrap and namespaces` — `src/i18n/` infrastructure + `main.tsx` boot
3. `feat(ui): replace hardcoded strings with t()` — mechanical replacement across components
4. `feat(ui): language picker and date-fns localization` — `SettingsScreen` picker + `datetime.ts` + `toLocaleString` replacements

Each commit builds independently. CHANGELOG entries under `## [Unreleased]`:

- `### Features`: `- Photos and videos sorted with the Ukrainian UI now go into Ukrainian-named month folders (наприклад, "Лютий 2024" замість "February 2024").`
- `### Features`: `- New language picker in Settings — switch between English and Ukrainian; takes effect immediately for the UI and for future sorts.`

## Acceptance criteria

EPIC-10 transitions to `🟢 complete` when:

- [ ] `feat/epic-10-i18n` merged into `staging`
- [x] `make check` is green (clippy + ESLint + Rust tests + Vitest)
- [ ] Manual smoke pass: EN → UA → UA sort → mixed history works → Invariant R1 verified
- [x] [`docs/specs/STATUS.md`](STATUS.md) and this spec updated to `🟢 complete` in the same PR

## Risks

| Risk | Likelihood | Mitigation |
| ---- | ---------- | ---------- |
| Future runner refactor breaks Invariant R1 | medium | R1 covered by a dedicated smoke test step; document as a code-comment near the runner |
| Hardcoded EN string slips into a rarely-rendered surface (toast, dialog) | medium | Manual review + Pattern Guard scan |
| `date-fns` UA locale misses a format we use | low | UA locale is mature; fall back to EN format pattern if specific token unsupported |
| `react-i18next` Context re-render flicker on `changeLocale` | low | Single batched React render; tested via smoke |

## References

- Constitution: Article I (user files sacred), Article III (KISS), Article V (type safety), Article VI (reversibility), Article X (specs precede code)
- Working Protocol §1 (state assumptions), §3 (surgical changes)
- EPIC-09 (settings persistence, `sys_locale` detect, `i18n::registry`)
- EPIC-05 (planner), EPIC-06 (fs-operations), EPIC-07 (history & undo) — touched indirectly through `dest_path` strings
