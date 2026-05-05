# EPIC-07. History + Undo

**Status:** pending
**Depends on:** EPIC-01, EPIC-06

## Goal

Після завершення — записати job у history; з history можна відкотити переміщення.

## Subtasks

- [ ] Персист журналу `MoveOp[]` per job (JSON у app data dir)
- [ ] Команди `list_history`, `revert_job(id)`
- [ ] UI-flow для revert у `HistoryScreen`
- [ ] Garbage-collection старих job-ів (за політикою з open questions)
- [ ] Тести: revert idempotent, revert під час конфліктів

## Open questions

1. **Скільки history тримати?** Last 50, last 30 days, без обмежень?
2. **Revert якщо файли вручну змінені** після sort: пропускати, спитати користувача, чи провалювати весь revert?
3. **Хешувати файли при move** (для перевірки цілісності при revert) — чи це overkill для MVP?
4. **Undo окремих файлів** з job — потрібно для MVP чи тільки revert цілої job?
5. **Storage location:** `app_data_dir/history.json` чи окремий файл per job (`app_data_dir/jobs/<id>.json`)?
6. **Покриття revert:** видаляти створені порожні теки після revert?
