# EPIC-09. Settings (persisted)

**Status:** pending
**Depends on:** EPIC-01

## Goal

`SortSettings` persists across app launches.

## Subtasks

- [ ] Persist to the app config dir (`tauri-plugin-store` or our own JSON)
- [ ] Hydrate at startup
- [ ] Wire the `SettingsScreen` checkboxes to real values
- [ ] Validation on load (forward-compatible: ignore unknown fields)

## Open questions

1. **Watch source folder** (`watchSource: false` in `DEFAULT_SETTINGS`) — is this auto-sort when new files appear? If so, that's a separate epic (requires a file watcher), not a settings toggle.
2. **Write report** — format: TXT, CSV, JSON? Where to save it — alongside the destination, or in `app_data_dir`?
3. **Default destination folder:** remember the last one chosen, or always prompt?
4. **Default sort rule:** remember the last one used, or keep a fixed default?
5. **Reset to defaults** — is there a button in the UI?
