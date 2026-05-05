# EPIC-02. Source selection & scanning

**Status:** pending
**Depends on:** EPIC-01

## Goal

Користувач обирає теку → ми рахуємо, що в ній є → показуємо preview перед запуском.

## Subtasks

- [ ] Команда `pick_source_dir` через `tauri-plugin-dialog`
- [ ] Команда `scan_source(path) -> ScanSummary { fileCount, sizeBytes, byKind }`
- [ ] `walkdir`-обгортка з фільтром розширень (з EPIC-01)
- [ ] Підключити кнопку Browse у `SetupScreen`
- [ ] Прибрати `DEFAULT_SOURCE` з UI

## Open questions

1. **Recursive чи flat?** Сканувати тільки верхній рівень source folder, чи рекурсивно у підтеки?
2. **Symlinks:** йти по них чи ігнорувати (ризик циклів)?
3. **Hidden files:** EPIC-01 фіксує: пропускаємо `.DS_Store`, `Thumbs.db`, dotfiles. Підтвердити чи дозволити override через settings?
4. **Multi-source:** одна тека за раз, чи можна обрати кілька джерел?
5. **Кеш сканування:** тримати між рестартами чи робити свіжий scan кожного разу?
