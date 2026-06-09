# Releases

Changelog-driven and manually gated. No bot owns versioning: the repository
owner picks the version number, cuts the CHANGELOG, pushes the tag, and
publishes the release. release-please was removed on 2026-06-09 — see
[History](#history--why-not-release-please).

## Flow

1. **Prepare.** On a branch off `staging`, run:

    ```bash
    make release-prepare VERSION=X.Y.Z
    ```

    Review the diff, commit as `chore(release): prepare X.Y.Z`, open a PR to
    `staging`, merge it.

2. **Promote.** Open the promotion PR `staging` → `production` and merge it.

3. **Tag.** On the `production` merge commit:

    ```bash
    git checkout production && git pull origin production
    git tag vX.Y.Z
    git push origin vX.Y.Z
    ```

    The tag is pushed with the owner's credentials, so
    [`release.yml`](../../.github/workflows/release.yml) always triggers
    (tags created by workflows with the default `GITHUB_TOKEN` never do).

    Alternatively, when pushing tags is not possible, either run the
    **Release** workflow manually (Actions → Release → Run workflow → branch
    `production`) or push a `release/*` branch pointing at the `production`
    head:

    ```bash
    git push origin production:refs/heads/release/vX.Y.Z
    ```

    In both modes the workflow resolves the tag from `package.json` and
    creates it on the checked-out commit itself. Delete the `release/*`
    branch after the release is published.

4. **Build.** `release.yml` validates the tag against the three version
   manifests, extracts the `## [X.Y.Z]` section from `CHANGELOG.md` as the
   release notes, builds installers on macOS, Ubuntu, and Windows, and
   attaches them — together with `.sig` files and the updater's
   `latest.json` — to a **draft** GitHub Release. Drafts stay editable even
   with the repository's immutable-releases setting enabled.

5. **Publish.** Review the draft on the Releases page and publish it
   manually. The workflow pre-ticks "pre-release"; untick it when the build
   should become `latest` — the updater endpoint reads
   `releases/latest/download/latest.json`, and pre-releases are never
   `latest`.

## What `make release-prepare` does

[`scripts/prepare-release.mjs`](../../scripts/prepare-release.mjs):

- bumps the version in `package.json`, `src-tauri/tauri.conf.json`,
  `src-tauri/Cargo.toml`, and the `media-sorter` entry in
  `src-tauri/Cargo.lock`
- renames `## [Unreleased]` in `CHANGELOG.md` to `## [X.Y.Z] - <date>`,
  dropping empty subsections, and inserts a fresh empty `[Unreleased]`
  template above it
- refuses to run when `[Unreleased]` has no entries or the manifests are
  already at the target version

## History — why not release-please

Removed on 2026-06-09 after the failed `v0.1.1` release
([run #27219556320](https://github.com/Sensation02/media-sorter/actions/runs/27219556320)):

- release-please **published** the GitHub Release before any installer
  existed; with immutable releases enabled, tauri-action could no longer
  attach assets (`Cannot upload assets to an immutable release`).
- Tags created by release-please's default `GITHUB_TOKEN` never trigger
  `release.yml`, so the build had to be kicked off by a manual tag push
  anyway.
- Its commit-headline changelog conflicted with the hand-curated
  Keep-a-Changelog `[Unreleased]` flow mandated by the project conventions,
  forcing double bookkeeping.
