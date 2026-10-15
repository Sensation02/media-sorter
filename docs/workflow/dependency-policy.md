# Dependency & Vulnerability Policy

Package-level security baseline for media-sorter's two dependency trees — JS (`package.json` /
`pnpm-lock.yaml`) and Rust (`src-tauri/Cargo.toml` / `src-tauri/Cargo.lock`). Anchors to Constitution
**Article II** (privacy & secrets hygiene — a vulnerable parser or TLS stack in the shipped app is a
path for user data to leak) and **Article VI** (each fix is an atomic, revertable lockfile change).

## Audit locally

```bash
pnpm audit --audit-level high          # JS — dev + prod
pnpm audit --prod --audit-level high   # JS — what ships in the webview bundle
cd src-tauri && cargo audit            # Rust — RustSec advisory DB (install once: cargo install cargo-audit --locked)
```

Auditing sends only package names and versions from the lockfiles to the advisory databases — never
user data (Article II).

## Severity handling

| Finding                                          | Action                                                                                                                 |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| JS critical / high                               | **Fix before merge** — upgrade, replace, or override the offending package.                                            |
| Rust vulnerability (any RustSec `vulnerability`) | **Fix before merge.** `cargo audit` does not grade by severity, and every Rust crate in the tree ships inside the app. |
| JS moderate                                      | Ships only with an entry in the Accepted-risk register below.                                                          |
| JS low; Rust `unmaintained` / `unsound` warnings | Tracked, not gated. Clear them opportunistically when the parent crate or package updates.                             |

## Remediation playbook

1. **Rust crate** — `cargo update -p <crate>`; if the resolver stops short of the patched version,
   `cargo update -p <crate> --precise <version>`. Re-run `cargo audit`, then `make check`.
2. **Direct JS dependency** — bump it with `pnpm add [-D] <pkg>@^<version>`, using the latest compatible
   version (CLAUDE.md → _Package versions_).
3. **Transitive JS dependency** — add a curated entry under `pnpm.overrides` in `package.json`, then
   `pnpm install` and re-audit:
    - **Bound the target with a caret** (`"^1.1.21"`), never an open `">=1.1.21"` — an open range lets a
      1.x consumer resolve to 5.x and break it.
    - **Never commit raw `pnpm audit --fix` output.** It writes dozens of open-ended entries (including
      moderates) into a new `pnpm-workspace.yaml`; hand-pick the high/critical ones instead.
    - **Never refresh the whole lockfile to fix a transitive** (`pnpm update` / `--no-save`). It drifts
      prod dependencies, and `@tauri-apps/*` JS packages must move in lockstep with the Rust `tauri`
      crates — that is a separate, deliberate upgrade.
4. **No patch available** — evaluate replacing the package; if it must stay, record it in the
   Accepted-risk register with the exposure analysis.

## Active transitive-dependency overrides

An override forces a version the parent package never declared. Unlike an accepted risk it has no
natural expiry — the audit stays clean whether or not the override is still needed — so this table is
the signal: when a row's review trigger is true, delete the row and the override together.

| Override                                | Reached via                                    | Ships?           | Review trigger                                                       |
| --------------------------------------- | ---------------------------------------------- | ---------------- | -------------------------------------------------------------------- |
| `brace-expansion` `^1.1.21` / `^5.0.12` | `eslint` and `typescript-eslint` → `minimatch` | dev-only         | `eslint` / `typescript-eslint` pull patched `minimatch` on their own |
| `browserslist` `^4.28.7`                | `eslint-plugin-react-hooks` → `@babel/core`    | dev-only         | `@babel/helper-compilation-targets` requires `>=4.28.7`              |
| `js-yaml` `^4.3.2`                      | `eslint` → `@eslint/eslintrc`                  | dev-only         | `@eslint/eslintrc` requires `>=4.3.2`                                |
| `nanoid` `^3.3.18`, `postcss` `^8.5.23` | `vite` → `postcss`                             | dev-only         | `vite` pins a patched `postcss`                                      |
| `source-map-js` `^1.2.2`                | `@tailwindcss/vite` → `@tailwindcss/node`      | dev-only         | `@tailwindcss/node` requires `>=1.2.2`                               |
| `undici` `^7.29.1`                      | `jsdom`                                        | dev-only (tests) | `jsdom` requires `>=7.29.1`                                          |

`pnpm audit --prod` was clean before these overrides; they protect the developer machine and CI, not
the shipped bundle.

## Accepted-risk register

| Package | Severity | Where | Decision | Review |
| ------- | -------- | ----- | -------- | ------ |
| _none_  |          |       |          |        |

## See also

- `.claude/CLAUDE.md` → _Package Manager_ — `pnpm` + `cargo` only, latest compatible versions
- `docs/CONSTITUTION.md` — Articles II and VI
