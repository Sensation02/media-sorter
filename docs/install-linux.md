# Installing media-sorter on Linux

media-sorter ships three Linux formats on the
[Releases page](https://github.com/Sensation02/media-sorter/releases):
an **AppImage** (runs on most distributions), a **`.deb`** (Debian /
Ubuntu), and an **`.rpm`** (Fedora / openSUSE). Pick whichever matches your
distribution.

## AppImage (portable, any distribution)

1. Download the `.AppImage` file.
2. Make it executable:

    ```bash
    chmod +x media-sorter_*.AppImage
    ```

3. Run it:

    ```bash
    ./media-sorter_*.AppImage
    ```

If the app does not start, your system may be missing FUSE. On Debian /
Ubuntu: `sudo apt install libfuse2`.

## Debian / Ubuntu (`.deb`)

```bash
sudo apt install ./media-sorter_*_amd64.deb
```

`apt` resolves the WebKitGTK runtime dependencies automatically. Launch
media-sorter from your application menu afterwards.

## Fedora / openSUSE (`.rpm`)

```bash
# Fedora
sudo dnf install ./media-sorter-*.rpm

# openSUSE
sudo zypper install ./media-sorter-*.rpm
```

## Updating

media-sorter checks for updates on launch and offers to install them with
one click. The AppImage updates itself in place. For `.deb` / `.rpm`
installs, download and install the newer package the same way.
