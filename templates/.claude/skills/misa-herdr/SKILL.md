---
name: misa-herdr
description: Manage Herdr coding-agent panes for Misa with bounded handoffs and decision-aware follow-up. Use whenever Misa starts, monitors, reads a compact report from, or responds to a Herdr-managed agent.
---

# Misa's Herdr control protocol

Reviewed against upstream Herdr skill v0.9.3 (`herdr --skill` prints the installed
upstream skill; re-diff after each Herdr update).

Herdr separates layout (workspace/tab/pane), raw terminal processes (pane), and
recognised coding-agent lifecycle (agent). Use the narrowest surface that matches
the job; use the `agent` surface for coding-agent work. Misa does not invoke the CLI:
she uses `herdr_control`, which exposes only the actions documented in the command
cookbook. In this workspace, new Herdr
panes start a neutral login `/bin/zsh` shell. Misa creates the pane, then starts OMP
in that available shell after selecting its role and model routing. Never start a
second agent in an occupied pane.

OMP may discover globally installed and project-local skills, depending on its local
configuration. A worker should use the smallest available capability relevant to its
task; require a named playbook only after confirming it exists in that runtime. Do not
paste full skill bodies into worker prompts.

## Hard preflight

Before every Herdr control action, rely on `herdr_control`'s environment check.

- If it is not `1`, `herdr_control` refuses the request. Say that Misa is outside a Herdr-managed pane and stop. Do not
  list, attach to, inspect, or control a Herdr session from outside it.
- The constrained tool can control only the local inherited Herdr session. It cannot
  use `--machine`, `--remote`, a named session, generic help, or raw terminal control.
  If a task requires one of those surfaces, state the limitation rather than bypassing
  the controller boundary.
- Never run bare `herdr` for discovery because it attaches or launches the TUI. The
  constrained tool provides agent roster and status actions; it deliberately provides
  no generic command surface, workspace mutation, or pane-run action.
- Herdr JSON responses are authoritative. Capture all workspace, tab, pane, and
  agent IDs from them; never infer an ID from screen order.
- Use `HERDR_WORKSPACE_ID`, `HERDR_TAB_ID`, and `HERDR_PANE_ID` as the caller
  context. Prefer `--current` for the caller's pane; an omitted pane target can use
  the UI-focused pane, which may belong to the user or another client.

## Progressive-disclosure router

Read only the reference needed for the current operation:

| Situation | Read next |
| --- | --- |
| Plan or launch independent workers | `references/batch-orchestration.md` |
| Launch or accept a research, review, audit, debug, or completion-evidence worker | `misa-grounded-evidence` |
| Review a completed Anthropic worker with Codex, or a completed Codex worker with Claude | `misa-cross-agent-review` |
| Select the provider, model, or reasoning tier for a worker | `references/model-routing.md` |
| Detect completion, absorb a report, or decide | `references/monitoring-and-reporting.md` |
| Need exact Herdr / OMP launch syntax | `references/commands.md` |
| State, wait, pane, or transcript behavior is unexpected | `references/troubleshooting.md` |

Do not load every reference or every pane transcript. Read the smallest applicable
reference and stop when the operational decision is grounded.

## Delegation, evidence, and acceptance

Delegate only when a worker has a bounded, independent outcome. Keep tiny,
tightly coupled decisions with Misa; do not create workers merely to create a
swarm. The normal delivery shape is one writer, one read-only reviewer only when
the risk warrants it, and a verification worker when factual evidence is decisive.

Every worker mission must state the work ID, objective, relevant context,
requirements, owned paths, prohibited paths/decisions, verification, authority,
dependency, and compact completion contract. Misa may answer a worker only when
repository evidence or the original mission settles the question. Product behavior,
public contracts, security/privacy posture, data migration, money, destructive work,
and external actions remain user decisions.

Git owns branch and worktree lifecycle. A worker's assigned checkout must already
exist before Misa splits a Herdr pane. Herdr never creates, switches, removes, or
integrates a worktree for Misa. One writer owns one worktree; reviewer and verifier
work only after that writer has stopped editing the candidate.

Herdr lifecycle status is operational data, not delivery evidence. `done` or `idle`
means that a worker may be ready for input; it does not prove the result. Misa accepts
a result only after receiving the compact handoff and, where factual claims matter,
a verification-worker handoff from `misa-grounded-evidence`.

## Worker identity is selected, never inherited

Before splitting a pane or starting an agent, Misa must choose the worker's
**business role**, **OMP model role**, provider, and effective model independently
in `model-routing.md`. The controller's own `fable` model is not a default for
delegated workers. Record the selected values in the launch ledger and pass the
effective model explicitly at launch. Business roles come from the project's live
`.claude/agents/` definitions and are stated in the OMP mission prompt; they are not
the same thing as OMP model roles.

Use Fable for Misa's coordinator role and the advisor route only. Plan design uses
Opus 5.5; well-scoped everyday implementation uses Sonnet 5.5. A simple scan, test,
documentation change, or focused review uses its mapped specialist and selected model
role.

For an active worker wave, Misa must keep a roster and revisit `herdr agent list`
after launches, after a bounded wait returns, and before starting a dependent worker.
A `done` entry is a coordination event: inspect and verify its handoff, then advance,
follow up, or surface a decision. It is never an informational badge to ignore.

## Non-negotiable guardrails

- Use `--no-focus` for Misa's background panes. Prefer `--current`, a returned pane
  ID, or a unique live agent name—not the UI-focused pane.
- A user-specified provider, model, budget, latency target, or required agent surface
  always wins. Public model IDs do not guarantee account or provider availability.
- `herdr_control` cannot close panes. Leave cleanup to the user or a separately
  authorised operations worker; never close a user-owned pane/tab/workspace/session
  or stop the Herdr server.
- `unknown` is not completion. `blocked` means a recognized approval or question UI;
  ask the user before answering it. `done` and `idle` are both ready for input, but
  server seen-state distinguishes them; reads do not mark a target seen.
- All specialists are independently managed OMP processes in Herdr panes. Do not call
  Claude Code's internal `Agent`/subagent tool; project settings deny it. Use a
  direct Claude Code or Codex process only when the user expressly requires that client
  and an approved non-OMP terminal session is available.
- Each worker pane starts in the assigned repository or worktree. Do not inherit the
  workspace root CWD unless the worker owns an explicit workspace-level task.
- Every OMP worker receives its business-role boundary in the first mission prompt.
  Do not rely on OMP's active model to imply authority, scope, or ownership.
- Persist concise, cited delivery knowledge through `misa-portfolio` and
  a dedicated Herdr `portfolio-curator` worker; never use raw terminal output as
  project memory.
- Never add `workspace close --group` merely to bypass `workspace_group_close_required`.
- Never kill the main Herdr process. Use a named `herdr session` when an experiment
  needs a completely isolated server.
- Use `--trust-repository` only after the user has verified the repository; it is
  not a routine retry for a failed worktree command.
- Do not add, remove, enable, or disable a `herdr machine` profile unless the user
  asks. IDs and live agent names are scoped to one server: selecting a machine in
  the TUI does not retarget CLI commands running in Misa's pane.
