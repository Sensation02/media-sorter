# EPIC-09. Settings (persisted)

**Status:** pending
**Depends on:** EPIC-01

## Goal

`SortSettings` зберігається між запусками.

## Subtasks

- [ ] Persist у app config dir (`tauri-plugin-store` або власний JSON)
- [ ] Hydrate на старті
- [ ] Підключити чекбокси у `SettingsScreen` до реальних значень
- [ ] Validation на load (forward-compat: невідомі поля ігноруємо)

## Open questions

1. **Watch source folder** (`watchSource: false` у `DEFAULT_SETTINGS`) — це auto-sort при появі нових файлів? Якщо так, це окремий епік (вимагає file watcher), не settings-toggle.
2. **Write report** — формат: TXT, CSV, JSON? Куди зберігати — поряд з destination, чи в `app_data_dir`?
3. **Default destination folder:** запам'ятовувати останню обрану, чи завжди питати?
4. **Default sort rule:** запам'ятовувати останню, чи фіксована?
5. **Reset to defaults** — є кнопка в UI?
