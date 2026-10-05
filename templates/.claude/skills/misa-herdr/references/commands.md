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
| Start OMP in an available worker shell | `agent_start` with `name`, `pane_id`, `model`, and `thinking`; Opus 5.5 also requires `escalation_basis` and `escalation_evidence` |
| Wait for a settled worker | `agent_wait` with `target`, optional `until` and `timeout_ms` |
| Send a bounded worker mission or follow-up | `agent_prompt` with `target`, `message`, optional `wait` and `timeout_ms` |
| Create an available worker shell | `pane_split` with `cwd`, optional `direction` |

No action accepts raw shell, CLI flags, arbitrary process arguments, file paths outside
the target workspace, or a pane-close request.

## Misa session identity

Start the controlling Chief-of-Staff session as Claude Code with `claude --agent misa`
(or the installed `scripts/misa-controller`). `herdr_control` is a Claude Code project
MCP tool; OMP is only the worker runtime. Start Misa from a Herdr-managed pane so the
tool inherits session context. If it is absent, restart the Claude Code session and
approve/reconnect the `misa-herdr` server in `/mcp`; do not convert Misa into OMP or
bypass the tool with raw Bash.

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

## Opus 5.5 escalation gate

Routine planning, debugging, and implementation use the `task` / Sonnet 5.5 route.
For `anthropic/claude-opus-5-5`, `agent_start` requires both:

- `escalation_basis`: `worker_evidence`, `user_request`, or `user_approval`.
- `escalation_evidence`: a concise report reference and insufficiency finding, or the
  user's request/approval being honored.

The constrained tool rejects an Opus launch without valid metadata. This validates
provenance and completeness, not the truth of the cited report; Misa must rely on the
verified worker handoff before selecting `worker_evidence`.

`agent_start` waits for Herdr to recognize OMP. If it returns `agent_not_ready`, retain
the requested name, wait for `idle`, and do not start a second process in that pane.

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
only for a state-specific wait. The constrained controller does not expose
`agent explain`, raw key input, or pane close.

Do not request cancellation or pane cleanup merely because a worker is slow. Escalate
the decision to the user or a separately authorised operations worker.
