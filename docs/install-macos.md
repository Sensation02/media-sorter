# Installing media-sorter on macOS

media-sorter for macOS is currently **unsigned** — it is not notarized by
Apple. The app is safe, but because we have not yet paid for an Apple
Developer certificate, macOS Gatekeeper will block it on first launch until
you clear the quarantine flag once. This is a one-time step; automatic
updates afterwards install without re-triggering Gatekeeper.

## 1. Download

Download the latest `.dmg` from the
[Releases page](https://github.com/Sensation02/media-sorter/releases).

The current builds are **Apple Silicon (arm64)**. On an Intel Mac the app
runs through Rosetta 2, which macOS installs automatically on first launch.

## 2. Drag the app into Applications

1. Open the downloaded `.dmg`.
2. Drag **media-sorter** onto the **Applications** folder shown in the
   window.
3. Eject the disk image.

> **Install from your normal user account — do not use `sudo`.** The
> auto-updater needs permission to replace the app's own bundle later. If
> the app is owned by `root`, updates will fail.

Do not run the app directly from the mounted `.dmg` — it is read-only, and
the updater cannot write to it.

## 3. Clear the quarantine flag (one time)

Open **Terminal** and run:

```bash
xattr -cr /Applications/media-sorter.app
```

This removes the `com.apple.quarantine` attribute that macOS adds to files
downloaded from the internet. Without it, double-clicking the app shows
_"media-sorter is damaged and can't be opened"_ or _"cannot be opened
because the developer cannot be verified"_.

## 4. Launch

Open media-sorter from Applications or Launchpad as usual. It will start
normally from now on, and future updates apply in place without repeating
this step.

## Updating

media-sorter checks for updates on launch and offers to install them with
one click. Because the updater downloads and replaces the bundle directly
(not through the browser), macOS does **not** re-add the quarantine flag —
you only run the `xattr` command once, for the very first install.
