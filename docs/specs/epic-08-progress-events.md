# EPIC-08. Real-time progress (events)

**Status:** pending
**Depends on:** EPIC-01, EPIC-06

## Goal

UI бачить, що відбувається, без polling.

## Subtasks

- [ ] Events: `sort:progress`, `sort:log`, `sort:done`, `sort:error`
- [ ] Backend емітить через `app.emit`
- [ ] Frontend: hook `useSortJob` з `listen()` та автоочищенням
- [ ] Throttle подій (≤ ~10/сек) щоб не задушити webview
- [ ] Підставити в `ProgressScreen` (зараз `DEFAULT_PROGRESS`)

## Open questions

1. **Гранулярність log-у:** кожен файл, чи семплінг (1 з N) для великих job?
2. **Estimate remaining time:** проста екстраполяція по середньому, чи складніша моделька?
3. **Поведінка коли вікно згорнуте:** продовжуємо емітити чи паузимось?
4. **Backpressure:** якщо UI повільний — drop events чи буферизувати?
5. **Persistence log-у після завершення:** тримаємо в пам'яті, чи пишемо у файл (для звіту)?
