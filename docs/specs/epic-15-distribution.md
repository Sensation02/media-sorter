# EPIC-15. Distribution pipeline (unsigned MVP)

**Status:** 🟡 in progress
**Branches:** `feat/epic-15-distribution-spec` (PR-1, current), `feat/epic-15-updater-plugin` (PR-2, planned), `feat/epic-15-release-workflow` (PR-3, planned)
**Depends on:** none (release-please and CI matrix already in place)
**Last updated:** 2026-05-15

## Goal

Ship the MVP to real users on macOS and Windows. Each release is built on
GitHub Actions for three OS targets, attached to the existing GitHub Release
created by release-please, and delivered to installed copies via the Tauri
auto-updater — without spending money on Apple Developer Program or a Windows
code-signing certificate at this stage.

## Clarifications

### Assumptions

- The repo is and will remain public (`Sensation02/media-sorter`) — required
  for free CI minutes and for a future SignPath.io Foundation application.
- release-please is the single source of truth for tags and GitHub Releases
  on `production` ([release-please-config.json](../../release-please-config.json),
  [.github/workflows/release-please.yml](../../.github/workflows/release-please.yml)).
- The repository owner has admin access to GitHub Secrets and to the GitHub
  repository's Releases page.
- "Unsigned MVP" is acceptable to early users who reach the app through a
  direct link or word of mouth. A wide public launch is **not** part of this
  epic.
- The Tauri updater downloads through `reqwest` (the Rust HTTP client) rather
  than through macOS LaunchServices, so the quarantine attribute is **not
  re-applied** to bundles replaced by the updater (validated by precedent —
  see References, `motrix-next`).
- App Sandbox is **off** and remains off in this epic — sandbox is only
  required for Mac App Store, which is explicitly EPIC-18.

### Resolved questions

| #   | Question                                                                                               | Decision                                                                                                                                                                                                                                                                  | Resolved at |
| --- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Q1  | Does the Tauri auto-updater work for unsigned macOS bundles, or does Gatekeeper re-block every update? | Works. After a one-time `xattr -cr /Applications/media-sorter.app` on first install, the updater replaces the bundle in place; quarantine is not re-added because Tauri downloads via `reqwest`, not LaunchServices. Documented for users in `docs/install-macos.md`.     | 2026-05-15  |
| Q2  | Do we change the webview CSP to allow updater traffic to `github.com`?                                 | **No.** The updater is a Rust-side plugin using `reqwest`; CSP only restricts the webview's `fetch`/`XHR`. The current CSP stays untouched.                                                                                                                               | 2026-05-15  |
| Q3  | Does tauri-action create a duplicate GitHub Release when release-please already made one?              | No, if we pass `tagName: ${{ github.ref_name }}`. tauri-action finds the existing release by tag and uploads assets to it. `releaseId` is not needed.                                                                                                                     | 2026-05-15  |
| Q4  | What is the updater check cadence?                                                                     | On app start, asynchronously (no blocking splash), plus a manual "Check for updates" button in the Settings screen. No background polling while the app is open.                                                                                                          | 2026-05-15  |
| Q5  | Is the first auto-updater-enabled release marked as a prerelease?                                      | **Yes.** `v0.2.0` is released as a GitHub prerelease — sets the expectation that the build is unsigned and beta. Removed as soon as we confirm the validation checklist passes.                                                                                           | 2026-05-15  |
| Q6  | Do we add an in-app warning banner on first launch of unsigned builds?                                 | **No.** Install docs and a README install section cover the workflow. Avoid UI noise; the warning users see comes from the OS, where it belongs.                                                                                                                          | 2026-05-15  |
| Q7  | Where is the Ed25519 updater private key stored, and what is the backup plan?                          | GitHub Secret `TAURI_SIGNING_PRIVATE_KEY` for CI usage; a copy in the maintainer's password manager (1Password or equivalent) for recovery. Losing the key permanently breaks the update channel — backup is mandatory before the first signed release.                   | 2026-05-15  |
| Q8  | How does the user install on macOS so that the updater has write access to the bundle?                 | The install doc instructs users to drag the `.app` into `/Applications` from their normal user account (not via `sudo`). This gives the running app permission to replace its own bundle. Issue [tauri-apps/tauri#8372](https://github.com/tauri-apps/tauri/issues/8372). | 2026-05-15  |
| Q9  | Is the landing site part of this epic?                                                                 | **No.** Tracked as EPIC-16 (separate repo, separate stack). EPIC-15 ships only the GitHub-Releases-based distribution channel; users reach it by direct link.                                                                                                             | 2026-05-15  |
| Q10 | Is Windows code-signing part of this epic?                                                             | **No.** Tracked as EPIC-17 (SignPath.io Foundation for OSS or Certum OSS as fallback). EPIC-15 ships **unsigned** Windows installers with an install doc that walks the user through the SmartScreen warning.                                                             | 2026-05-15  |
| Q11 | Is macOS notarization part of this epic?                                                               | **No.** Tracked as EPIC-18 (deferred until Apple Developer Program funding is available). EPIC-15 ships unsigned macOS bundles with documented `xattr` workaround.                                                                                                        | 2026-05-15  |
| Q12 | Where does the updater's `endpoints` array point?                                                      | `https://github.com/Sensation02/media-sorter/releases/latest/download/latest.json` — GitHub Releases serves the JSON as a static asset; no separate CDN, no rate-limit risk for the small audience of v0.2.x.                                                             | 2026-05-15  |

### Open questions

| #   | Question                                                                                                        | Proposed answer                                                                                                                                                                           | Status                      |
| --- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Q13 | Does the updater respect the `prerelease: true` flag on the GitHub Release, or does it pick up prereleases too? | Tauri reads whatever `latest.json` it finds at the endpoint. Workaround: keep `latest.json` pointing only at stable releases; when `v0.2.0` exits prerelease, attach `latest.json` to it. | open — verify in Validation |

### Edge cases

- User downloads `.dmg` but never moves the app to `/Applications` (runs it
  from the mounted disk image) → updater fails because the source is
  read-only. Install doc must steer users to drag into `/Applications`
  before launching.
- User installs into `/Applications` with `sudo` → bundle owned by root,
  updater fails to overwrite. Install doc explicitly forbids this.
- User has Apple Silicon but downloads the x86_64 build → Rosetta launches
  the app but updater logic still works; downloaded update will match
  Rosetta arch (one-arch-only release in v0.2.0).
- Windows SmartScreen blocks `.msi` on first run → install doc shows
  "More info → Run anyway".
- Ed25519 signature mismatch (e.g. a forgotten key rotation) → updater
  silently refuses to install. Logging it in the updater component lets
  the user file a bug.
- GitHub Releases is offline → updater check fails silently; app still runs.
  No in-app failure UI in v1; only console log.
- Repository is briefly made private → updater 404s on the public URL. Out
  of band; not in scope to mitigate.

### Constraints

- **Article I — user files are sacred.** The updater only touches its own
  bundle, never user media. No filesystem operations outside `/Applications`
  or the Windows installer scope.
- **Article II — privacy by default.** Updater requests carry only the
  current app version and OS triple. No telemetry, no metadata leakage. Same
  applies to the future EPIC-16 landing site.
- **Article III — KISS.** No staged rollouts, no canary channels, no
  geo-targeting in v1. One channel, one endpoint, one signing key.
- **Article V — strict typing.** Updater event payloads (`Update`,
  `DownloadEvent`) typed at the IPC boundary; no `any` in the frontend
  consumer.
- **Article VI — reversibility.** Each PR is independently revertable. A
  bad release can be deleted from GitHub Releases and a new tag cut; the
  updater respects whatever `latest.json` currently says.
- **Article VII — docs.** CHANGELOG entry for each user-visible change in
  PR-2 and PR-3; this spec immutable after merge.

## Scope

- **Rust:** add `tauri-plugin-updater` to `Cargo.toml`, register it in
  `src-tauri/src/lib.rs`, expose nothing extra — the plugin's own `check()`
  and `download_and_install()` are sufficient for v1.
- **Frontend:** add `@tauri-apps/plugin-updater` to `package.json`, add a
  thin `useAppUpdate` hook that calls `check()` on mount and exposes
  `{ status, downloadAndInstall, error }` to a single new component
  `<UpdatePrompt />`.
- **UI:** `<UpdatePrompt />` is a non-blocking inline toast — visible on
  any screen — offering "Update now" / "Later". No modal, no forced restart.
  Wire it into the root layout so it survives screen transitions.
- **Settings:** add a "Check for updates" button below the existing language
  picker; reuses the same `useAppUpdate` hook.
- **Capabilities:** add `updater:default` to the default capability set.
- **Config:** `tauri.conf.json` gains `plugins.updater.pubkey` (Ed25519
  public key) and `plugins.updater.endpoints`. Existing `bundle.targets:
"all"` and `bundle.icon` stay as-is.
- **CI:** new `.github/workflows/release.yml` triggered by `v*.*.*` tag
  push, using `tauri-apps/tauri-action@v0` on macOS/Windows/Ubuntu runners.
  No code-signing secrets; only `TAURI_SIGNING_PRIVATE_KEY` for the updater
  signature.
- **Docs:** `docs/install-macos.md`, `docs/install-windows.md`,
  `docs/install-linux.md`. README "Install" section linking to them.
- **STATUS:** add EPIC-15 row (this), EPIC-16 (marketing site, pending),
  EPIC-17 (Windows code signing, pending) to `docs/specs/STATUS.md`.

## Decisions

### Channel and endpoint

GitHub Releases is the only distribution channel for this epic. The updater
endpoint is `https://github.com/Sensation02/media-sorter/releases/latest/download/latest.json`,
which GitHub redirects to the asset attached to the most recent non-prerelease
release. tauri-action's `uploadUpdaterJson: true` (default) generates and
attaches `latest.json` automatically.

### release-please ↔ tauri-action handoff

release-please owns tag creation and the initial GitHub Release. tauri-action
attaches platform bundles and `latest.json` to that release using
`tagName: ${{ github.ref_name }}` — by tag name, no `releaseId` lookup
required. This keeps the two workflows decoupled: release-please owns
versioning, tauri-action owns binaries.

### Why unsigned is acceptable for v0.2.0

- macOS: a one-time `xattr -cr` is documented and well-understood by
  developer-tooling early adopters. Initial audience is not the
  general public.
- Windows: SmartScreen warning is a friction point but not a hard
  block; install doc walks through it.
- Linux: no signing required for AppImage / deb / rpm at the user-trust
  level we are targeting.
- The cost of signing ($99/year Apple + ~$30-400/year Windows OV/EV) is not
  justified before we have real users asking for it.

### Why the auto-updater ships in v0.2.0, not later

Without the updater, every user installs from a download link **and** stays
on that exact version until they manually upgrade. We have no way to push
bug fixes to anyone. The updater is the **single most important** piece of
distribution infrastructure — it makes future EPIC-15 deliveries cheap.

### Scope split — what does NOT belong here

| Topic                     | Reason it is split off                                                           | Tracked as |
| ------------------------- | -------------------------------------------------------------------------------- | ---------- |
| Marketing / landing site  | Different stack, different repo, different deploy target                         | EPIC-16    |
| Windows code-signing      | Multi-week SignPath.io Foundation approval; independent of unsigned MVP shipping | EPIC-17    |
| macOS notarization        | Requires Apple Developer Program (\$99/yr) — not budgeted                        | EPIC-18    |
| Mac App Store / MS Store  | Requires sandboxing + store review; far beyond unsigned MVP                      | future     |
| Staged rollout / channels | Premature; one channel for v0.x                                                  | future     |
| Update telemetry          | Article II — privacy first; not a need at this stage                             | never      |

## Subtasks

> Atomic, ordered. Each item maps to one commit. Split into 3 PRs + a
> Validation phase (see "PR split" and "Validation phase" below).

### PR-1 — Spec (this PR)

- [x] Create `docs/specs/epic-15-distribution.md` from template.
- [x] Update `docs/specs/STATUS.md`: add EPIC-15 🟡, EPIC-16 ⚪, EPIC-17 ⚪
      rows; bump `Last reviewed`.
- [x] Markdown lint / format passes locally.
- [x] PR labelled `skip-testing` (docs-only).

### PR-2 — Tauri updater plugin + UI prompt

- [ ] `cd src-tauri && cargo add tauri-plugin-updater`.
- [ ] `pnpm add @tauri-apps/plugin-updater`.
- [ ] Register plugin in `src-tauri/src/lib.rs` before `invoke_handler`.
- [ ] Generate Ed25519 key locally:
      `pnpm tauri signer generate -w ~/.tauri/media-sorter.key`. Store the
      private key in 1Password; store its base64 content in GitHub Secret
      `TAURI_SIGNING_PRIVATE_KEY`; commit the public key to
      `tauri.conf.json` → `plugins.updater.pubkey`.
- [ ] Add `plugins.updater.endpoints` to `tauri.conf.json`.
- [ ] Add `updater:default` capability to the default capability set.
- [ ] Implement `src/hooks/use-app-update.ts` exposing
      `{ status, downloadAndInstall, error }`.
- [ ] Implement `src/components/update-prompt/UpdatePrompt.tsx` — inline
      toast wired to the root layout.
- [ ] Add "Check for updates" button in `SettingsScreen`, reuses the hook.
- [ ] i18n keys for the prompt and button text (EN + UA).
- [ ] CHANGELOG entry under `### Features`: user-friendly wording, e.g.
      _"The app now checks for updates on launch and offers to install them with one click."_
- [ ] Local manual test: `pnpm tauri dev`, confirm the hook runs and logs
      "no updates available" (because no `latest.json` exists yet).

### PR-3 — Release workflow + install docs

- [ ] Create `.github/workflows/release.yml`: - trigger: `push` on tag `v*.*.*` - matrix: `macos-latest`, `windows-latest`, `ubuntu-latest` - uses `tauri-apps/tauri-action@v0` with: - `tagName: ${{ github.ref_name }}` - `releaseName: 'media-sorter v__VERSION__'` - `prerelease: true` for the first release; flip to `false` once
      validation passes - `includeUpdaterJson: true` (default) - secrets: `TAURI_SIGNING_PRIVATE_KEY`,
      `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (empty string if no passphrase) - **no** Apple or Windows signing secrets — unsigned MVP
- [ ] Write `docs/install-macos.md` — drag-to-Applications + `xattr -cr`
      instructions, with terminal command snippet and rationale.
- [ ] Write `docs/install-windows.md` — SmartScreen "More info → Run anyway"
      flow, screenshot-quality numbered steps.
- [ ] Write `docs/install-linux.md` — AppImage `chmod +x` + .deb / .rpm
      package manager invocations.
- [ ] Update `README.md` "Install" section with three OS columns linking
      to the docs above; link to GitHub Releases for downloads.
- [ ] CHANGELOG entry under `### Features`: e.g. _"Releases are now built
      automatically for macOS, Windows, and Linux; install instructions in
      the README."_

### Validation phase (post-merge runbook, not a PR)

Executed after PR-1, PR-2, PR-3 are merged into `staging`, and `staging` is
promoted to `production`.

- [ ] `gh pr create --base production --head staging` — promotion PR.
- [ ] Merge promotion PR; verify release-please opens its release PR on
      `production` with the bumped version.
- [ ] Merge release-please PR; verify the new `v0.2.0` tag and GitHub
      Release are created.
- [ ] Verify `release.yml` runs successfully on all three OS runners.
- [ ] Confirm `.dmg`, `.msi`, `.AppImage`, and `latest.json` are attached
      to the v0.2.0 GitHub Release.
- [ ] Manual macOS test: - download `.dmg`, drag to `/Applications`, - run `xattr -cr /Applications/media-sorter.app`, - launch, verify the app starts cleanly, - in DevTools, verify `useAppUpdate` logs "no updates available".
- [ ] Manual Windows test: download `.msi`, walk through SmartScreen,
      install, launch.
- [ ] Cut a `v0.2.1` patch release (e.g. CHANGELOG-only chore): verify
      the v0.2.0 install shows the updater prompt within 60 s of launch
      and applies cleanly **without re-prompting Gatekeeper**.
- [ ] If macOS auto-update re-quarantine occurs (validates Q13): pause
      epic, raise follow-up issue, do not flip `prerelease: false` until
      resolved.
- [ ] Flip `prerelease: true → false` on v0.2.0 in `release.yml` once
      validation clears.
- [ ] Mark EPIC-15 🟢 in `docs/specs/STATUS.md` and in this spec.

## PR split

| #    | Branch                           | Scope                                           |
| ---- | -------------------------------- | ----------------------------------------------- |
| PR-1 | `feat/epic-15-distribution-spec` | Spec + STATUS index (docs-only, `skip-testing`) |
| PR-2 | `feat/epic-15-updater-plugin`    | Tauri updater plugin + Ed25519 key + UI prompt  |
| PR-3 | `feat/epic-15-release-workflow`  | `release.yml` + install docs for all three OS   |

Each PR builds independently. PR-3 references public key already committed
in PR-2 but does not import code from it. The Validation phase is **not**
a PR — it is a manual runbook executed against `production`.

## IPC contract

No new IPC commands. The updater plugin exposes its own commands and events
through `@tauri-apps/plugin-updater`; we consume them inside `useAppUpdate`
without wrapping them in custom Tauri commands.

Events the frontend listens to (via the plugin):

| Event              | Payload                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `Update::progress` | `{ event: 'Started' \| 'Progress' \| 'Finished', data?: { contentLength?: number, chunkLength?: number } }` |

## Out of scope

- **EPIC-16 — Marketing landing site.** Astro + Cloudflare Pages in a
  separate repository. Privacy-first messaging built on Article II. Includes
  download buttons that auto-detect OS and link to GitHub Releases.
- **EPIC-17 — Windows code-signing.** SignPath.io Foundation application
  (free for OSS) as the primary path; [Certum Open Source Code Signing](https://shop.certum.eu/data-safety/code-signing-certificates/certum-open-source-code-signing.html)
  (~\$30/yr OV) as the fallback if SignPath approval drags on.
- **EPIC-18 — macOS notarization.** Apple Developer Program (\$99/yr) plus
  Developer ID Application certificate plus notarization in
  `release.yml`. Deferred until budgeted.
- **Mac App Store / Microsoft Store.** Requires sandboxing, store review,
  and a fundamentally different distribution stance. Far beyond MVP.
- **Update channels / staged rollout.** No `beta` / `stable` split in v1.
- **Telemetry on update events.** Article II.
- **Auto-install without user consent.** The prompt is opt-in per release.
- **Replacing release-please.** It works; we wrap it, not replace it.

## References

- **Constitution articles touched:** I (updater only touches its own
  bundle), II (no telemetry, no metadata leak), III (one channel, one key),
  V (typed updater payloads), VI (atomic, revertable PRs and releases),
  VII (CHANGELOG + spec ship together).
- **Related specs:** none direct; EPIC-16, EPIC-17, EPIC-18 are
  follow-ups carved out of an earlier broader scope.
- **Tauri documentation:**
    - [Tauri v2 Updater plugin](https://v2.tauri.app/plugin/updater/)
    - [`tauri-apps/tauri-action`](https://github.com/tauri-apps/tauri-action) — handoff with release-please via `tagName`
    - [Tauri v2 macOS distribution](https://v2.tauri.app/distribute/macos-application-bundle/)
- **Empirical precedent for unsigned macOS + auto-updater:**
  [`AnInsomniacy/motrix-next`](https://github.com/AnInsomniacy/motrix-next) — production Tauri app shipping unsigned with the documented `xattr -cr` workflow and a working auto-updater.
- **Tauri issues consulted:**
    - [#8372 — Updater on Mac works in /Applications](https://github.com/tauri-apps/tauri/issues/8372) (write-permission constraint)
    - [#13878 — macOS production network blocking](https://github.com/tauri-apps/tauri/issues/13878) (App Sandbox, irrelevant to us because sandbox is off)
- **Existing project pieces this epic builds on:**
    - [release-please-config.json](../../release-please-config.json) — version source of truth
    - [.github/workflows/release-please.yml](../../.github/workflows/release-please.yml) — tag/Release creation
    - [.github/workflows/ci.yml](../../.github/workflows/ci.yml) — existing build matrix template
    - [src-tauri/tauri.conf.json](../../src-tauri/tauri.conf.json) — bundle config, CSP, identifier
