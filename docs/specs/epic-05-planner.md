# EPIC-05. Sort planner (стратегії)

**Status:** pending
**Depends on:** EPIC-01, EPIC-03, EPIC-04 (для `ByDateAndPlace`)

## Goal

На вході — список файлів з метаданими. На виході — `SortPlan`: для кожного файла target path. Чисто функціонально, без I/O.

## Subtasks

- [ ] Trait `SortStrategy` (Strategy pattern)
- [ ] Реалізації: `ByDate`, `ByDateAndPlace`, `ByType`, `ByCamera`
- [ ] Composer для стратегій (якщо потрібен стек)
- [ ] Команда `preview_plan(scan_id, rule) -> SortPlan` для UI-preview
- [ ] Юніт-тести на кожну стратегію (критична бізнес-логіка)
- [ ] UI: реальний preview-tree замість статичного `DEFAULT_RULES.preview`

## Open questions

1. **Композиція:** користувач обирає одну стратегію (як зараз `RuleSelector`), чи стек (`ByDate` + `ByPlace` одночасно — це власне те, що описано в опису проєкту)?
2. **Default rule** для MVP — якій стратегії віддаємо пріоритет?
3. **`ByCamera` для відео:** немає make/model — куди такі файли (`Unknown camera`)?
4. **UI-preview** показує реальне дерево майбутніх тек (з `SortPlan`), чи залишається статичним як зараз?
5. **Custom strategies:** користувацькі шаблони (наприклад `{Year}/{Camera}/{Date}`) — MVP чи post-MVP?
