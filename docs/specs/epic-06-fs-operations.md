# EPIC-06. File operations + dry-run + conflict resolution

**Status:** pending
**Depends on:** EPIC-01, EPIC-05

## Goal

Виконати `SortPlan` на диску безпечно. Найризикованіша частина — пріоритет #2 у `CLAUDE.md` ("безпека користувацьких файлів").

## Subtasks

- [ ] Repository-обгортка `FsRepo` (mockable у тестах)
- [ ] Команди `start_sort`, `pause_sort`, `cancel_sort`
- [ ] Dry-run mode (нічого не пише, тільки журнал)
- [ ] Conflict resolution dialog (skip / overwrite / rename) з UI-flow
- [ ] Atomic move де можливо, fallback copy+delete між дисками
- [ ] Журнал всіх операцій (для undo, EPIC-07)
- [ ] Тести: idempotent move, conflict cases, cross-device, permission denied

## Open questions

1. **Default операція:** move чи copy? У `DEFAULT_SETTINGS` стоїть `copy: false` — підтверджуєш move як default?
2. **Конфлікт за замовчуванням:** apply-to-all dialog, чи питаємо по кожному файлу? Чи default-стратегія з `skipDuplicates` settings?
3. **"Duplicate" definition:** same name; same name+size; same content (hash)?
4. **Cross-device move:** дозволяємо (буде довше — copy+delete) чи блокуємо з повідомленням?
5. **Pause семантика:** дочекатися поточного файла і зупинитися, чи зупинитися негайно?
6. **Дозволи:** як реагувати на permission denied — skip, abort, чи modal-prompt?
7. **Місце на диску:** перевіряти free space перед стартом?
