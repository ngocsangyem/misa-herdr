# Batch orchestration

Use this reference when Misa must launch more than one worker through Herdr.

## Design the batch before creating panes

Create a compact work ledger in the Misa response or the active work snapshot. For
each worker record: work ID, objective, relevant context, requirements,
repository/cwd, exclusive path ownership, prohibited paths and decisions, authority,
dependency, expected evidence, verification, terminal disposition (`keep` or
`operations cleanup needed`), business role, OMP model role, provider, effective
model, and reasoning tier.
The objective, ownership, verification, and escalation boundary must be clear before
launch; implementation hypotheses may remain open for the worker to test. For work
with architecture, lifecycle, shared-contract, or vertical dependencies, record the
user goal, non-negotiable constraints with their source, current revisable approach,
and known unknowns separately. Misa's controller model is never a substitute for the
worker's selected model.

Group work into waves:

1. **Discovery wave:** independent read-only investigation can run in parallel.
2. **Contract wave:** shared types, interfaces, migration decisions, and shared
   configuration are sequential prerequisites; resolve them before implementation.
3. **Implementation wave:** parallel only when ownership paths do not overlap.
4. **Verification wave:** test/review agents inspect implementation results after the
   relevant workers finish, not concurrently against moving files.

Default to two concurrent implementation workers per repository. Add a third only
when task boundaries, resources, and expected merge order are all explicit. Use one
workspace per repository, task, or investigation; use a named Herdr session only
when its runtime must be completely separate.

Default to sibling panes in the current tab, each created with the assigned
repository or already-created Git worktree as its CWD. Do not inherit Misa's CWD.
Workspace root is allowed only for an explicit workspace-level task. Do not create a
workspace or tab unless the task needs that topology. Misa does not create, switch,
or remove worktrees; a separate authorised Git workflow owns that lifecycle.

## Launch a wave

1. Inspect the current pane layout. Split the calling pane right when wide, down when
   narrow/tall; avoid repeated same-direction splits that make unusable columns or
   rows. Set the pane to the worker's assigned repository or worktree with
   `pane_split`, its explicit `cwd`, and `--no-focus`. Never create a worktree
   through Herdr or the controller.
2. Read `model-routing.md`, choose the task's business role, OMP model role, explicit
   effective model, and thinking tier. Use `pane_split`, retain the returned pane ID,
   then use `agent_start` to launch OMP in that available shell. Confirm it with
   `agent_get` before prompting. Every worker identity is explicit in its mission
   prompt.
3. Prompt each worker with its work ID, objective, path ownership, required
   verification, prohibited scope, and a compact report contract. For research,
   review, audit, debugging, or completion claims, invoke
   `misa-grounded-evidence` first and append its ledger contract.
   Let OMP load relevant installed skills through normal task matching. Add an
   explicit `/skill:<name>` only when the work requires a specific, known playbook;
   this keeps the mission small and avoids loading unrelated guidance.
4. Do not read worker transcripts while the wave is `working`. Monitor the roster at
   every required checkpoint. Process `blocked` and `done` states one at a time
   through `monitoring-and-reporting.md`; resolve a completed worker before a
   dependent worker starts.
5. Do not start dependent work until the prerequisite output has been absorbed and
   verified. If a worker raises a supported `DESIGN_CHANGE_REQUEST` that changes a
   shared contract or architecture, stop only its affected dependent wave, record the
   disposition, and replan rather than patching around the conflict.

## Worker prompt contract

Append this compact contract to every Misa-owned worker prompt:

```text
Scope: modify only <owned paths>; do not change priorities, release state, secrets,
or unrelated files. Stop and report a blocker if the objective needs work outside
this boundary.

For a design-sensitive task, distinguish the user goal and non-negotiable constraints
from the current approach. The current approach is revisable unless explicitly named
as a constraint. If evidence challenges it and resolution needs another owner's scope
or a decision, report DESIGN_CHANGE_REQUEST with premise, evidence, impact, bounded
options, and requested disposition; do not apply an unowned change or bury it in a
workaround.

Memory: query MemPalace only when Misa supplies a project wing and prior decisions,
handoffs, or architecture materially matter. Treat results as leads; verify them
against source, Git, ticket, or portfolio evidence. Do not store transcripts, secrets,
customer data, or build/test output.

At completion reply with no transcript and at most 12 bullets:
OUTCOME: <result>
ASSUMPTIONS: <tested/rejected/open assumptions and any escalation trigger>
DESIGN_CHANGE_REQUEST: <none, or premise/evidence/impact/options/requested disposition>
EVIDENCE: <changed paths, commands, source links>
VERIFICATION: <command/result, or not run and why>
DECISION/BLOCKER: <none or one item>
NEXT: <one action>
```

For a grounded worker, replace the free-form `EVIDENCE` field with `[E#]` IDs
and a verified report path. A verification worker renders and verifies the shared
ledger before Misa accepts the handoff; a pane transcript is never evidence.

For code-changing work, the implementation handoff is never the acceptance record.
Launch a separate read-only verifier after the writer settles. For visual-fidelity UI
work, follow it with `visual-verifier` on the OMP `vision` route, with a reference image,
exact viewport/state, and target screenshot artifact. Missing evidence is
`BLOCKED`/`UNVERIFIED`, never a pass.

The constrained launch does not add autonomous approval flags. This explicit scope is
still mandatory and is not a substitute for the user's authority. Misa must
still escalate business priority, owner, deadline, scope, release, money, external
communication, permission, or destructive-action decisions.

## Batch completion

Finish a wave only after Misa has reviewed every completed report, received a
verification-worker handoff for decisive evidence, captured durable state where
required, and marked any pane needing user or operations cleanup. Report the batch as
a compact table: worker, outcome, verification, decision/blocker, and disposition.
