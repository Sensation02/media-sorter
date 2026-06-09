# Installing media-sorter on Windows

media-sorter for Windows is currently **unsigned** — it does not yet carry
a code-signing certificate. The app is safe, but Windows SmartScreen will
show a warning on first launch because it does not recognize the publisher.
This is a one-time prompt you can safely dismiss.

## 1. Download

Download the latest `.msi` (or `.exe` setup) from the
[Releases page](https://github.com/Sensation02/media-sorter/releases).

## 2. Run the installer

Double-click the downloaded file. Windows SmartScreen will likely show:

> **Windows protected your PC**
> Microsoft Defender SmartScreen prevented an unrecognized app from
> starting.

To continue:

1. Click **More info**.
2. A **Run anyway** button appears at the bottom of the dialog — click it.
3. Follow the installer prompts to finish.

> SmartScreen warns because the installer is unsigned, not because anything
> is wrong with it. The warning stops appearing for that build once you've
> run it; signed builds (planned for a later release) will remove it
> entirely.

## 3. Launch

Open media-sorter from the Start menu.

## Updating

media-sorter checks for updates on launch and offers to install them with
one click. You may see the SmartScreen prompt again the first time a new
unsigned version runs; the **More info → Run anyway** flow is the same.
