# EPIC-06. File operations + dry-run + conflict resolution

**Status:** ⚪ pending
**Depends on:** EPIC-01, EPIC-05

## Goal

Execute the `SortPlan` on disk safely. This is the riskiest part of the system — priority #2 in `CLAUDE.md` ("safety of user files").

## Subtasks

- [ ] `FsRepo` repository wrapper (mockable in tests)
- [ ] Commands `start_sort`, `pause_sort`, `cancel_sort`
- [ ] Dry-run mode (writes nothing, only logs)
- [ ] Conflict resolution dialog (skip / overwrite / rename) with UI flow
- [ ] Atomic move where possible, copy+delete fallback across drives
- [ ] Log of every operation (for undo, EPIC-07)
- [ ] Tests: idempotent move, conflict cases, cross-device, permission denied

## Open questions

1. **Default operation:** move or copy? `DEFAULT_SETTINGS` has `copy: false` — confirm move as the default?
2. **Default conflict behavior:** apply-to-all dialog, prompt per file, or default strategy driven by the `skipDuplicates` setting?
3. **"Duplicate" definition:** same name; same name+size; same content (hash)?
4. **Cross-device move:** allow it (slower — copy+delete) or block with a message?
5. **Pause semantics:** finish the current file and stop, or stop immediately?
6. **Permissions:** how to react to permission denied — skip, abort, or modal prompt?
7. **Disk space:** check free space before starting?
