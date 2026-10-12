# Command cookbook

Use installed `herdr --help`, `herdr agent`, and `herdr pane` output as the authority
when syntax differs from this cookbook. The command examples below explain the fixed
bindings behind `herdr_control`; Misa must invoke the tool action, never a raw command.
The tool itself enforces the Herdr-pane environment boundary.

## Misa tool mapping

| Coordination need | `herdr_control` action |
| --- | --- |
| Roster | `agent_list` |
| One worker's lifecycle metadata | `agent_get` with `target` |
| Compact final handoff only | `agent_handoff` with `target` |
| Start OMP in an available worker shell | `agent_start` with `name`, `pane_id`, `model`, and `thinking` |
| Start Figma design analysis in Claude Code | `agent_start` with `worker_kind: "claude"`, `claude_agent: "design-analyst"`, `name`, and `pane_id` |
| Ask a Misa-owned worker to stop gracefully | `agent_stop` with its live agent `target` |
| Wait for a settled worker | `agent_wait` with `target`, optional `until` and `timeout_ms` |
| Send a bounded worker mission or follow-up | `agent_prompt` with `target`, `message`, optional `wait` and `timeout_ms` |
| Create an available worker shell | `pane_split` with `cwd`, optional `direction` |
| Close a settled Misa-owned worker pane | `pane_close` with `pane_id` |

No action accepts raw shell, CLI flags, arbitrary process arguments, file paths outside
the target workspace, or a close of a pane Misa did not create and settle.

## Misa session identity

Project settings select the `misa` agent role. Start the controlling Chief-of-Staff
session with `claude --agent misa` (or `scripts/misa-controller`, which invokes that
command) from a Herdr-managed pane. `herdr_control` is a Claude Code project MCP tool;
OMP is only the worker runtime. An OMP worker receives its business-role boundary in
its first mission prompt and must never infer it from the active model.

If Misa reports `No such tool available: herdr_control`, the Claude Code project MCP
server was not loaded or has not been approved. End and restart that Claude Code Misa
session, then approve or reconnect `misa-herdr` in `/mcp`. Do not convert Misa into an
OMP session, request Bash, or bypass the constrained tool with a raw Herdr command.

## ID and checkout rules

Misa reads every target ID from a `herdr_control` response; it never predicts an ID
from layout order. The returned pane ID from `pane_split` is the only valid target
for the next `agent_start`. `<target-cwd>` must be the assigned repository or an
already-created Git worktree, never the workspace root unless the worker owns a
workspace-level task.

The controller intentionally has no action for machines, remote sessions, workspace
mutation, raw pane input, worktree commands, or arbitrary shell commands. If a job
requires one of those capabilities, Misa reports the limitation instead of bypassing
the boundary.

`agent start` expects an available interactive shell in that pane and waits up to 30
seconds by default (`--timeout`, max 300000) for Herdr to recognise the requested
agent. If the agent is blocked during startup, the command returns `agent_not_ready`
immediately, but the name stays valid for `agent read`/`agent send-keys`; wait for
idle before prompting. Native agent flags must appear after the `--` separator;
flags before it belong to Herdr. Run `herdr agent` to print the installed kind list.

## Workspace OMP launch mode

The current Herdr configuration uses a login `/bin/zsh` default shell. A newly split
pane is therefore an available shell, not an already-running OMP process. Misa must
first use `pane_split`, capture `.result.pane.pane_id`, then use `agent_start` with a
unique lowercase name, the returned pane ID, and the selected OMP model and thinking
tier. The tool emits only the supported native OMP flags after Herdr's `--` separator.

## Everyday Opus 5.5 route

Routine planning, debugging, and implementation use the `task` / Opus 5.5 route.
Pass `anthropic/claude-opus-5-5` and the route's documented thinking tier to
`agent_start`; no Opus escalation metadata is required. Select the `slow` or `plan`
route only when the task needs their higher thinking tier, and still record the
business role, effective model, reasoning tier, and expected evidence in the launch
ledger.

`agent_start` waits for Herdr to recognize OMP. If it returns `agent_not_ready`, retain
the requested name, wait for `idle`, and do not start a second process in that pane.

## Claude Code Figma analysis route

For a user-requested Figma discovery task, Misa may start only the allowlisted
read-only `design-analyst` via `worker_kind: "claude"` and
`claude_agent: "design-analyst"`. The controller launches Herdr's `claude` kind with
`claude --agent design-analyst --dangerously-skip-permissions`; the fixed launch shape
prevents arbitrary Claude arguments and relies on the user's global Claude Code Figma
MCP configuration.

This route is for retrieving node context, metadata, and screenshots. When visual
fidelity is required, the mission must include the user's Figma file or selection URL
and require all three sources: `get_design_context` and `get_metadata` for exact
structured values, plus `get_screenshot` for visual evidence. The resulting digest
names the source URL/node, observed visual facts, exact copy, states, variants, unknowns,
and a compact implementation checklist. Misa sends that digest to the subsequent OMP
implementation worker instead of asking it to infer the design from the original prompt.
If Figma cannot be retrieved, visual-fidelity work is blocked rather than guessed. This
route cannot be used for code edits, commits, pushes, PR writes, or Figma mutations.

## OMP visual-verification route

For post-implementation UI fidelity work, Misa starts an OMP `visual-verifier` on the
`vision` model route and passes `reference_image` as an existing PNG, JPEG, or WebP
inside the assigned workspace. The controller validates the path and supplies it to OMP
as an image attachment at launch. The worker captures the running UI at the mission's
specified viewport and state, then compares the source and target images with native
vision. It is read-only: its handoff is a mismatch list or `BLOCKED`/`UNVERIFIED`, not a
code change or a generic design opinion.

## Autonomous worker launch mode

The user has explicitly authorised Misa to launch Misa-owned delegated workers in
autonomous mode. In this workspace, the split-then-start sequence above is the
standard OMP launch. It deliberately omits `--auto-approve`: OMP continues to enforce its
configured approval policy, and the bounded mission prompt does not authorise a
worker to exceed the user's scope. The controller cannot inject arbitrary pane
environment variables; start a separate bounded reviewer only through the normal
split, start, and prompt sequence.

After readiness, send a compact one-line mission through `herdr agent prompt`. It
must state the business role, work ID, repository/cwd, owned paths, prohibited scope,
verification, and report contract. OMP's `--model` chooses capability; it does not
set the worker's role or grant authority.

The OMP mission prompt supplies the business-role boundary; the selected model does
not imply authority, scope, or ownership. A direct Claude Code or Codex client needs
a separate user-approved terminal configuration because the standard pane is already
occupied by OMP.

## Git and GitHub writes

For staging, commits, pushes, PR writes, merges, and tags, Misa starts a
`git-manager` OMP worker with `openai-codex/gpt-6-luna` at `low` through the `commit`
route. Do not use an Anthropic model, Claude Code, or another Claude agent for those
operations. The first mission step must verify `gh auth status` and
`gh api user --jq .login`; proceed only if it matches the expected login named in the worker mission. A failed,
different, or ambiguous authentication result blocks all Git and GitHub writes.

## Prompt, wait, and read

Use `agent_prompt`, `agent_get`, and `agent_handoff` instead of raw commands. The
controller deliberately exposes only the bounded handoff read; it does not expose
`detection` or `visible` terminal reads.

`agent prompt` rejects with `agent_blocked` before sending anything if the target is
already blocked. With `--wait`, an accepted submission starting from a non-working
state must produce observed `working` or `blocked` activity within 5000ms, else it
returns `agent_prompt_stalled`; a caller `--timeout` that expires first returns
`timeout` and includes submission time. Without a timeout, the settled-state wait is
indefinite once activity is observed. It sends prompt text plus Enter as one ordered
submission honoring the pane's live bracketed-paste mode; successful submission does
not by itself prove the agent started a turn. Multi-line prompt text can fail to
reach an interactive REPL — use a one-line prompt that points at a mission file instead.

Use `--wait` for a short bounded task only. For longer work, submit the prompt and
return to `agent list` at a checkpoint rather than holding Misa in an unbounded wait.

Choose the smallest output source that answers the current question:

| Source | Use |
| --- | --- |
| `detection` | Plain-text bottom buffer for agent-state clues |
| `visible` | Current UI, questions, and approval prompts |
| `recent` | Recent rendered output with soft wraps |
| `recent-unwrapped` | Logs and compact result/transcript reads |

`--source` defaults to `recent`. `--lines` asks for more rows from the pane's
available screen and host scrollback; if a completed response's alternate-screen
output already left the pane, a larger `--lines` cannot recover it — rows on the
alternate screen never enter Herdr's host scrollback.

Use ANSI formatting only when terminal styling itself is evidence.

## Resolve, cancel, and close

Use `agent_prompt` for a focused clarification and `agent_wait` with `until: blocked`
only for a state-specific wait. To clean up a worker, use this exact guarded sequence:

1. For a working worker, call `agent_stop` to send `ctrl+c` only to that Misa-owned
   agent. This is a graceful interruption, not a forced kill.
2. Call `agent_wait` with the same agent name and `until: idle` or `until: done`.
3. Call `pane_close` with its original returned `pane_id`.

The controller records panes returned by its own `pane_split` actions and agents
started in them. It refuses a close unless that exact pane remains controller-owned and
the matching agent was confirmed `idle` or `done` in the current session. It never
offers `agent explain`, raw key input, forced close, raw Bash, or direct `omp` invocation.

Do not request cancellation or pane cleanup merely because a worker is slow. Escalate
the decision to the user or a separately authorised operations worker.
