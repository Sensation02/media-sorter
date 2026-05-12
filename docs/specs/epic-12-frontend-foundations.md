# EPIC-12. Frontend Foundations Refactor

**Status:** 🟡 in progress
**Branch:** `refactor/epic-12-frontend-foundations`
**Owner:** Vasyl Kaminskyi
**Last updated:** 2026-05-12
**Depends on:** EPIC-01..EPIC-11 (every screen in scope must already exist)

## Goal

Bring the frontend up to the discipline level that CLAUDE.md already mandates: replace the 103+ inline `var(--color-X)` Tailwind escape hatches with the `@theme inline` tokens that already exist, lock the typographic and geometric scale into tokens, migrate all icon-shaped Unicode glyphs to `lucide-react`, split co-located components, decompose `SortApp` from "App + state + mappers + tables" back into a thin composition shell, reorganise the `features/sort/` directory by responsibility (`hooks/`, `mappers/`, `constants/`), and delete the dead code that accumulated during EPIC-01..EPIC-11. No visible feature change — same screens, same behavior, healthier foundation.

## Clarifications

### Assumptions

- `lucide-react@^1.14.0` is the legitimately resolved version (verified via `pnpm view lucide-react@1.14.0`). Icon names used in this epic (`ChevronRight`, `Undo2`, `Folder`, `ArrowRight`, `Sparkles`, `History`, `Settings`) all exist in that version.
- `@theme inline` block in `src/index.css` is already authored and consumed by Tailwind v4; auto-generated classes (`bg-bg`, `text-fg-1`, etc.) work today. The audit verified by inspection.
- All tests in `src/features/sort/**/*.test.{ts,tsx}` are passing on the `staging` baseline before this epic begins.
- No visible UX changes are acceptable. Every screen must render pixel-equivalent (within ±1px tolerance for renamed token rounding) after the refactor. Manual visual review on each screen is mandatory.

### Open questions

| #   | Question                                                                                                                                                                             | Proposed answer                                                                                                                                                                                                                                                               | Status   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Q1  | Should `Stat`'s drifted eyebrow (`text-[10px] tracking-[0.6px]`) be aligned to the canonical `text-eyebrow` (`text-[10.5px] tracking-[1px]`), or kept distinct as `text-eyebrow-sm`? | Align to canonical. The 0.5 px and 0.4 px diffs are accidental drift (see AP-011), not authored design. If a smaller eyebrow is later needed for stat tiles, add `text-eyebrow-sm` then.                                                                                      | resolved |
| Q2  | Do we ship the lucide-react migration in this same PR, or split it into a follow-up?                                                                                                 | Ship in this PR. Icon swap is mechanical and tied to the same files we are already touching for token replacement — splitting causes merge conflicts.                                                                                                                         | resolved |
| Q3  | Do we centralise icons in `src/features/sort/constants/icons.tsx` or in `src/components/ui/icons.tsx`?                                                                               | `src/features/sort/constants/icons.tsx`. Today every icon is used by the `sort` feature; the project has one feature. If a second feature is added later that also uses lucide, lift to `src/components/ui/`. Premature lift now would violate scope discipline (Article IV). | resolved |
| Q4  | Should we add a screenshot-diff CI step before merging?                                                                                                                              | No. Manual visual review on every screen is sufficient for this PR (Article III — simplicity over cleverness). A screenshot harness is its own epic.                                                                                                                          | resolved |
| Q5  | Is the single-PR scope acceptable given the size?                                                                                                                                    | Owner-directed: yes, ship as one PR with atomic commits (CLAUDE.md "Atomic commits — every PR has multiple commits, one logical step each"). Reviewer reads commit-by-commit.                                                                                                 | resolved |

### Edge cases

- A `bg-[var(--color-X)]` class that ends up at a focus / hover / data-state modifier (e.g. `hover:bg-[var(--color-surface-2)]`, `data-[state=open]:bg-[var(--color-surface-2)]`) — the replacement must preserve the modifier (`hover:bg-surface-2`).
- A magic value used in **exactly one place** (e.g. `tracking-[-0.1px]` in `Toolbar.tsx`) — do **not** invent a token for it; either keep the inline value or remove it if the design intent is unrecognisable.
- An icon currently rendered via `style={{ background: color, boxShadow: … }}` in `StatusDot.tsx` — lucide does not handle the glow. Keep `StatusDot` as is; its `style={}` is a justified exception, documented with a one-line comment.
- A test file co-located with a component being split (`HistoryScreen.test.tsx`) — the test must keep working through the same public import path (the barrel `index.ts`).
- The `components/index.ts` barrel under `features/sort/components/` — if it is truly unused, delete it; if any future-planned consumer exists, document why and keep it.

### Constraints

- Article III (simplicity): no new abstractions beyond what eliminates ≥3 duplicates. `<Eyebrow>` and `<ScreenFrame>` qualify (8 and 4 duplicates respectively).
- Article IV (scope discipline): zero feature changes. Zero behavior changes. Visual output must match within rounding tolerance.
- Article V (type safety): the `as SortRuleId` cast is eliminated. No new `as`-casts introduced.
- Article VI (reversibility): one PR, but composed of atomic commits — each commit individually buildable, each individually revertable in `git revert <sha>` order.
- Article VII (documentation): every commit that lands a new pattern updates `docs/workflow/anti-patterns.md` already (done up-front in PR #43); this spec ships with the PR; STATUS.md and CHANGELOG.md updated in the same PR.

## Scope

What this PR ships:

1. **`@theme inline` extension** in `src/index.css` — new typography tokens (`--text-eyebrow`, `--text-meta`, `--text-meta-sm`, `--text-caption`, `--text-body-sm`, `--text-body`, `--text-title`, `--text-subtitle`, `--text-stat`, `--text-icon-lg`, `--text-display`), new component-geometry tokens (`--switch-width`, `--switch-height`, `--switch-thumb-size`, `--switch-thumb-offset`, `--switch-thumb-checked-offset`, `--select-trigger-height`, `--progress-thickness`, `--toast-accent-width`, `--dot-size`).
2. **Mechanical Tailwind class migration** across all 20 affected files — `bg-[var(--color-X)] → bg-X`, `text-[var(--color-X)] → text-X`, `border-[var(--color-X)] → border-X`, `divide-[var(--color-X)] → divide-X`, `ring-[var(--color-X)] → ring-X`, including all `hover:`, `focus:`, `focus-visible:`, `data-[state=...]:` modifiers (103 occurrences).
3. **Typography migration** — replace every recurring `text-[Npx]` arbitrary class with its semantic token (`text-eyebrow`, `text-body`, etc.) across screens, components, and UI primitives.
4. **Geometry migration** — replace magic `w-[Npx]`, `h-[Npx]`, `translate-x-[Npx]`, `border-l-[Npx]` with token-based classes in `Switch`, `Select`, `Progress`, `Sonner`, `StatusDot`.
5. **Icon migration to lucide-react** — create `src/features/sort/constants/icons.tsx`, replace 7 distinct Unicode icon characters across 7 files with lucide components; add `aria-hidden` and explicit sizing classes.
6. **Visual-primitive extraction** — create `src/features/sort/components/eyebrow/Eyebrow.tsx` and `src/features/sort/components/screen-frame/ScreenFrame.tsx`, replace 8 + 4 copy-paste instances.
7. **Co-located component splits** — `PreviewTree` → extract `Placeholder`; `HistoryScreen` → extract `HistoryRow`, `HistoryStats`, `Centered`; `SettingsScreen` → extract `SettingsForm`.
8. **Screen constants centralisation** — create `src/features/sort/constants/screens.ts` with `SORT_SCREEN` const + derived `SortScreen` type + `TOOLBAR_TITLE`/`TOOLBAR_STATUS`/`TOOLBAR_SUBTITLE`/`SIDEBAR_ITEMS` tables; replace 15+ magic strings in `SortApp.tsx`.
9. **`SortApp.tsx` decomposition** — extract `resolveScreen`, `toSortDone`, `revertSummary`, `preferredDefaultRule` into individual files under `mappers/` / `hooks/`; extract the state-machine + handlers + effects into `hooks/use-sort-orchestration.ts`. Final `SortApp.tsx` is JSX composition only.
10. **Type-safety fixes** — add `isSortRuleId` type guard, replace `as SortRuleId` cast in `RuleSelector`; replace inline `<button>` in `ErrorBoundary` with `<Button variant="primary">`.
11. **Dead-code cleanup** — delete `CardHeader/CardContent/CardFooter`, `DEFAULT_SETTINGS`, `SortSettings` type, the unused `features/sort/components/index.ts` barrel. Rename `LEGACY_SORT_SETTINGS` → `IMMUTABLE_SORT_FLAGS`.
12. **Directory reorganisation** — move hooks under `hooks/`, mappers under `mappers/`, constants under `constants/`. Add barrels. Update all imports. Keep tests co-located with their target files.
13. **Tests** — add unit tests for `resolveScreen`, `toSortDone`, `revertSummary`, `isSortRuleId`, `Eyebrow`, `ScreenFrame`, and the new orchestration hook. Existing tests must keep passing through their public import paths.
14. **Documentation** — this spec is added; `docs/workflow/anti-patterns.md` gains AP-003..AP-013 (already landed in same PR commit 1); `docs/specs/STATUS.md` lists EPIC-12; `CHANGELOG.md` has no user-visible bullet under `[Unreleased]` because this PR is internal-only refactor (CLAUDE.md: `refactor` PRs do NOT add CHANGELOG entries).

## Decisions

### Single PR with atomic commits

Per owner direction. The PR is structured as ~25 atomic commits, each individually buildable and bisectable. Review proceeds commit-by-commit. This trades external review granularity for execution velocity and avoids cross-PR merge-conflict pain on `var(--color-X)` replacements that touch the same files.

### `as const` object pattern for screen / rule literals

Rather than reuse the literal union as-is, replace it with the `as const` object pattern (see AP-008). This makes the variant table iterable (`Object.values(SORT_SCREEN)`) and refactor-safe.

### Icon manifest co-located with the sort feature

`src/features/sort/constants/icons.tsx` rather than `src/components/ui/icons.tsx` until a second feature exists.

### No accessibility audit pass in this PR

`aria-current="page"` on the active sidebar item and `aria-hidden` on decorative icons are added because they're free side effects of the migration. A real a11y sweep (focus order, keyboard nav, contrast, screen-reader labels) is a separate epic.

### `Stat` eyebrow aligned to canonical, not preserved as variant

The drift (`text-[10px]` vs `text-[10.5px]`, `tracking-[0.6px]` vs `tracking-[1px]`) is accidental, not designed. Aligning to the canonical eyebrow at `--text-eyebrow` is the right call.

## Subtasks

The PR ships as a single branch with the following atomic commits. Each maps to one task in the implementation plan at `docs/superpowers/plans/2026-05-12-frontend-foundations.md`.

- [x] **C01** — `docs(workflow): add AP-003..AP-013 to anti-patterns` (already landed pre-execution)
- [ ] **C02** — `docs(specs): add EPIC-12 spec and update STATUS`
- [ ] **C03** — `style(theme): add typography and geometry tokens to @theme inline`
- [ ] **C04** — `refactor(ui): replace bg/text-[var(--color-X)] with @theme classes`
- [ ] **C05** — `refactor(ui): replace border/divide/ring-[var(--color-X)] with @theme classes`
- [ ] **C06** — `refactor(ui): replace text-[Npx] arbitrary sizes with typography tokens`
- [ ] **C07** — `refactor(ui): replace switch/select/progress geometry magic with tokens`
- [ ] **C08** — `feat(ui): add lucide-react icon manifest at constants/icons.tsx`
- [ ] **C09** — `refactor(ui): migrate Sidebar icons to lucide-react and type as LucideIcon`
- [ ] **C10** — `refactor(ui): migrate Tree, Preview, Progress, Setup, Done, History icons to lucide-react`
- [ ] **C11** — `feat(ui): add Eyebrow primitive with default/warning/destructive tones`
- [ ] **C12** — `feat(ui): add ScreenFrame primitive for screen + footer composition`
- [ ] **C13** — `refactor(ui): replace 8 eyebrow copies with <Eyebrow>; fix Stat drift`
- [ ] **C14** — `refactor(ui): replace 4 screen frame copies with <ScreenFrame>`
- [ ] **C15** — `refactor(ui): split PreviewTree co-located Placeholder into its own file`
- [ ] **C16** — `refactor(ui): split HistoryScreen co-located components`
- [ ] **C17** — `refactor(ui): split SettingsScreen co-located SettingsForm`
- [ ] **C18** — `feat(sort): centralize screens constants (SORT_SCREEN, TOOLBAR_*, SIDEBAR_ITEMS)`
- [ ] **C19** — `refactor(sort): extract resolveScreen, toSortDone, revertSummary, preferredDefaultRule`
- [ ] **C20** — `refactor(sort): extract useSortOrchestration hook from SortApp`
- [ ] **C21** — `feat(sort): add isSortRuleId type guard; remove cast in RuleSelector`
- [ ] **C22** — `refactor(ui): replace inline <button> in ErrorBoundary with <Button>`
- [ ] **C23** — `chore(sort): delete dead code (CardHeader/Content/Footer, DEFAULT_SETTINGS, SortSettings, components barrel)`
- [ ] **C24** — `refactor(sort): rename LEGACY_SORT_SETTINGS to IMMUTABLE_SORT_FLAGS`
- [ ] **C25** — `refactor(sort): move hooks/mappers/constants into subdirectories; update imports`
- [ ] **C26** — `chore(specs): mark EPIC-12 done; update STATUS`

## Out of scope

- Real accessibility audit pass (focus order, keyboard nav, WCAG contrast, screen-reader walkthrough). Separate epic.
- Internationalisation (i18n) of UI copy strings — owned by EPIC-10.
- New screens, new IPC commands, new sort rules, new settings fields.
- Theme toggle (dark/light mode runtime switch) — out of scope until requested.
- Replacing `Date.now()` with a time-library wrapper (CLAUDE.md "single time library" rule) — noted as an outstanding issue but **not** addressed here; tracked separately.
- Switching to `cva` for `Select`/`Switch` styles where current `cn()` pattern is already readable.
- Screenshot-diff CI tooling.
- Any change in `src-tauri/` (Rust).

## IPC contract

No IPC changes.

## References

- Constitution articles touched: III (simplicity), IV (scope discipline), V (type safety), VI (reversibility), VII (documentation), IX (tests on critical path)
- Related specs: EPIC-11 (UI Polish — separate concern; this epic does foundations, EPIC-11 keeps doing per-row polish on top)
- Anti-patterns landed in same PR: AP-003..AP-013 in `docs/workflow/anti-patterns.md`
- Implementation plan: `docs/superpowers/plans/2026-05-12-frontend-foundations.md`
- External docs: [Tailwind v4 `@theme`](https://tailwindcss.com/docs/v4-beta#using-css-variables), [lucide-react](https://lucide.dev/guide/packages/lucide-react)
