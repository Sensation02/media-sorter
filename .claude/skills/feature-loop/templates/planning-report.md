# <Feature> — Planning report

**The reply that goes with the G-gate `PushNotification`.** It is a message to the human, not a file: written in the
conversation's language, read once, and acted on. The durable half is the **Status block** at the top of `plan.md`,
written first — that is what a later session reads, and it holds the same facts in plan terms.

<!-- It answers the four things a person returning to a stopped loop needs, in the order they need them: what
     happened, where it is, what they owe, what comes next. The gap-by-gap detail is already in the plan and the
     syntheses; repeating it here buries the decisions. -->

## Before writing it

- The Status block is at the top of `plan.md`: rounds run, the next phase and its base, what the human owes, what is
  logged open for the draft PR.
- Every count comes from the files — the reports' gap lines, the plan's row ids — never from recall.
- Every synthesis proposal the run did **not** adopt is in the plan as a decision owed, with both costs.

## The reply

```
<One or two sentences: where the run stopped and what does not exist yet.>

**What was done:**
1. <Round n: raw gaps → consolidated, and what changed in the plan / tests.> — one item per round.
2. <Anything that moved under the plan: a base branch, a merged PR, a size row that moved up.>
3. <Each proposal not adopted, why, and that it went to the human.>

**Where it is:** <path>. <Which file to read first.>

**<A warning>** — only when the human could undo the work by an ordinary action (resuming an older session,
merging the wrong branch). Otherwise leave it out.

**Decisions owed (<n>)** — <where they are written in full>:
1. <One choice per line, phrased so it can be answered with a word or a pick.>

**Next step:** Phase 6 after your "go" — <the first piece, the base it starts from>.

**What I checked:** <the mechanical checks actually run, and what each showed>.
```

## Rules

- **One thought per sentence, one sentence per list item.** The reader acts on this; a paragraph hides the ask.
- **No internal labels.** No Constitution article numbers, anti-pattern ids or synthesis gap ids — the reader has no
  key to them. The plan's row ids (`E3`, `R1`) are fine; the plan is theirs.
- **A decision the human already confirmed is never overturned by a round.** When a synthesis argues against one, it
  is not adopted: it becomes a decision owed, with both costs, and "what was done" says so.
- **"Decisions owed" lists choices, not homework.** "Undo restores into the original folder or a recovery folder" —
  not "review the undo section".
- **"What I checked" names commands and results**, not intentions. Nothing checked means saying so.

## Filled in (illustrative)

```
Planning for undo-by-batch is closed at the G gate. No branch or code exists yet.

**What was done:**
1. Round 1 (file-safety only, row 3): 9 gaps → 6, folded into plan v2; the size row moved from 3 to 1 because undo writes to user folders.
2. Round 2 (--deep, all four lenses): 8 gaps → 4, folded into plan v3 and four new edge rows.
3. Round 3 (--deep): 2 gaps → 1, folded into plan v4; Phase 5 exhausted with no open critical.
4. The synthesis proposed dropping the per-file move-log entry; it would change the reversibility you confirmed, so it is yours to decide.

**Where it is:** `docs/superpowers/loop/undo-by-batch/` (gitignored). Read `plan.md`'s Status block first.

**Decisions owed (2)** — plan, "Status":
1. Per-file move-log entries, or one entry per batch.
2. Undo into the original folder, or into a recovery folder when the original is gone.

**Next step:** Phase 6 after your "go" — backend move-log changes first, from `staging`.

**What I checked:** every edge row has an id and a named test (11 of 11); `risk-classify.sh staging` printed `media-write`.
```
