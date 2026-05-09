# media-sorter

Desktop application that sorts photos and videos into folders shaped like
`<Month Year>` (for example `February 2024`, or the locale-equivalent
`лютий 2024`), and inside each month into geolocation folders (`Paris`,
`Kyiv`, …) derived from EXIF / GPS metadata.

> **Status:** early development (v0.1.0). The metadata extraction service
> is in place; sort planner, filesystem operations, undo/history and the
> full UI flow are still being built. See [`CHANGELOG.md`](./CHANGELOG.md)
> for what has shipped and [`docs/specs/`](./docs/specs/) for the planned
> epics.

## What it does

Given a source folder of mixed photos and videos, the app produces a
target tree like:

```
<destination-root>/
├── лютий 2024/
│   ├── Paris/
│   │   └── IMG_4821.HEIC
│   └── Unknown location/
│       └── VID_0099.MP4
└── March 2024/
    └── Kyiv/
        └── DSC_0001.NEF
```

- Capture date is read from EXIF (photos: JPEG / HEIC / TIFF / RAW)
  and QuickTime atoms (videos: MP4 / MOV / M4V).
- GPS coordinates are reverse-geocoded **offline** to a city name —
  no external network calls.
- Files without usable metadata fall through to `Unknown date` /
  `Unknown location` so a single bad file never poisons a batch.
- Every operation is reversible — the app keeps a move log and supports
  undo (planned in EPIC-07).

## Tech stack

| Layer            | Technology                              |
| ---------------- | --------------------------------------- |
| Desktop runtime  | Rust + Tauri 2                          |
| UI framework     | React 19 + TypeScript                   |
| Bundler          | Vite 8                                  |
| Styling          | Tailwind CSS 4 + shadcn/ui (Radix)      |
| EXIF / metadata  | `nom-exif` (parallelized via `rayon`)   |
| Reverse geocode  | offline lookup (no external APIs)       |
| Tests            | Vitest (UI) · `cargo test` (Rust)       |
| Lint / format    | ESLint + Prettier · rustfmt + clippy    |

## Prerequisites

You'll need:

- **Node.js ≥ 22** and **pnpm ≥ 10** — install pnpm via
  [`pnpm.io/installation`](https://pnpm.io/installation).
- **Rust (stable)** — install via [`rustup`](https://rustup.rs).
- **OS-specific Tauri system dependencies** — see the official
  [Tauri 2 prerequisites guide](https://tauri.app/start/prerequisites/):
  - **macOS** — Xcode Command Line Tools (`xcode-select --install`).
  - **Linux (Debian / Ubuntu)** —
    ```bash
    sudo apt-get update
    sudo apt-get install -y \
      libwebkit2gtk-4.1-dev \
      libappindicator3-dev \
      librsvg2-dev \
      patchelf \
      libssl-dev
    ```
  - **Windows** — Microsoft C++ Build Tools and WebView2 (usually
    pre-installed on Windows 11).

Only `pnpm` (for JS) and `cargo` (for Rust) are supported. Do not mix in
`npm` / `yarn` / `bun`.

## Installation

```bash
git clone https://github.com/Sensation02/media-sorter.git
cd media-sorter
pnpm install
```

Or, using the Makefile shortcut:

```bash
make setup
```

## Run in development

Starts the Vite dev server, the Tauri Rust shell, and opens the desktop
window with hot-reload for the UI:

```bash
pnpm tauri dev
# or
make dev
```

UI-only debugging (no Tauri shell, no native FS access — useful for
component work):

```bash
pnpm dev
```

## Build a production desktop bundle

```bash
pnpm tauri build
# or
make build
```

The platform-specific installers land in
`src-tauri/target/release/bundle/`:

- macOS — `.dmg` and `.app`
- Linux — `.deb`, `.AppImage`, `.rpm`
- Windows — `.msi`, `.exe`

Builds are unsigned by default; signing keys are configured per
release, not per local build.

## Useful commands

```bash
# Lint everything (ESLint + clippy)
make lint

# Format everything (Prettier + rustfmt)
make fmt

# Run all tests (Vitest + cargo test)
make test

# Pre-commit gate (lint + test)
make check

# Clean build artefacts
make clean
```

Or directly:

```bash
pnpm lint            # ESLint
pnpm format          # Prettier
pnpm test            # Vitest
cd src-tauri
cargo clippy --all-targets -- -D warnings
cargo fmt
cargo test
```

## Project layout

```
.
├── src/                 # React + TypeScript UI
│   ├── features/        # vertical feature modules (mirrors src-tauri)
│   ├── components/
│   ├── types/           # shared domain types (TS)
│   └── utils/
├── src-tauri/           # Rust + Tauri backend
│   └── src/
│       ├── domain/      # shared domain types (Rust)
│       ├── utils/       # cross-cutting helpers
│       ├── scanning/    # source-folder scan feature
│       ├── metadata/    # EXIF / GPS extraction feature
│       └── error.rs     # AppError / AppResult
├── docs/
│   ├── specs/           # design documents per epic
│   ├── workflow/        # process docs (anti-patterns, releases, CI/CD)
│   └── discoveries/     # research artefacts
├── CHANGELOG.md
└── Makefile
```

Architecture rules, naming conventions, and the multi-agent workflow
used to build this project live in
[`.claude/CLAUDE.md`](./.claude/CLAUDE.md).

## Contributing

The repository follows a develop-then-split workflow with atomic
commits per logical step and CHANGELOG entries on every user-visible
change. Read [`docs/workflow/`](./docs/workflow/) before opening a PR.
