# EPIC-07. History + Undo

**Status:** pending
**Depends on:** EPIC-01, EPIC-06

## Goal

After a job completes, record it in history; from history the user can revert the moves.

## Subtasks

- [ ] Persist a `MoveOp[]` log per job (JSON in the app data dir)
- [ ] Commands `list_history`, `revert_job(id)`
- [ ] UI flow for revert in `HistoryScreen`
- [ ] Garbage collection of old jobs (policy from open questions)
- [ ] Tests: idempotent revert, revert during conflicts

## Open questions

1. **How much history to keep?** Last 50, last 30 days, unlimited?
2. **Revert when files were manually changed** after the sort: skip, ask the user, or fail the entire revert?
3. **Hash files on move** (to verify integrity at revert time) — or is that overkill for MVP?
4. **Undo individual files** within a job — needed for MVP, or only revert the whole job?
5. **Storage location:** `app_data_dir/history.json` or one file per job (`app_data_dir/jobs/<id>.json`)?
6. **Revert coverage:** delete empty folders created during the sort after a revert?
