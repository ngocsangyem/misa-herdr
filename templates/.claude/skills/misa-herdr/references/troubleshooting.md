# Troubleshooting Herdr workers

## Not in Herdr

If `test "${HERDR_ENV:-}" = 1` fails, Misa is outside a managed pane. Stop without
calling any Herdr session-control command. The correct remedy is to launch or attach
the agent inside Herdr, then retry from that pane.

## Client/server version skew after update

Client and server versions can differ right after a Herdr update. Run `herdr status`
before relying on a new server feature. A missing method or unexpected response
shape is not permission to stop the server or trigger an upgrade — report it instead.

## `agent_not_ready` at start

`agent start` returns `agent_not_ready` when the agent was blocked during startup,
but the requested name stays valid for `agent read` and `agent send-keys`. Read the
blocked UI, then wait for idle before sending the first prompt; do not restart the
agent just because start returned this status.

## Prompt timed out or stalled

`agent prompt --wait` returns `agent_prompt_stalled` when no `working`/`blocked`
activity is observed within 5000ms of an accepted submission, or `timeout` when the
caller's `--timeout` expires first. Neither proves the prompt was never delivered —
it may have reached the terminal without producing the expected state transition.
Use `agent_get` to confirm the target is still the expected live agent. The Misa
controller intentionally cannot read raw `detection` or `visible` output; when the
worker is blocked, escalate the exact question to the user rather than guessing or
duplicating the original task.

## `unknown` lifecycle state

`unknown` is detection uncertainty, not completion. Read `visible` output first. If
classification still matters, run `herdr agent explain <target>`; then wait for a
settled state or ask the worker for a compact status handoff. Do not send approval,
destructive, or cancellation input based solely on `unknown`.

## Agent is blocked

Misa's controller cannot inspect the raw blocked UI. Surface the block to the user;
do not guess the question or use autonomous launch flags to choose on the user's
behalf.

## Expected transcript is missing

Claude Code and similar interactive apps can use an alternate screen. Large history
reads work only while the agent is settled; an active/blocked/unknown agent may
return `agent_not_idle`. Wait for a settled state, then use the bounded
`recent-unwrapped --lines 80` read. If one required detail remains unavailable, ask
the worker to write a concise Markdown handoff file and return its path; read that
file directly instead of increasing transcript size.

## Pane or agent target is wrong

Use the live agent name or the current pane ID from `agent get`. After `pane move`,
use the new pane ID returned at `.result.move_result.pane.pane_id`; old IDs are not
general targets. A missing agent name can mean the original process exited, was
released, or was replaced—inspect before restarting it.

## This is a normal terminal, not a recognised agent

Use the pane surface for shells, tests, servers, CI watchers, and raw terminal work:
`pane run` submits a command with Enter, `pane wait-output` waits for output, and
`pane read` retrieves it. Do not use lifecycle waits for an ordinary process, and do
not use raw pane input for a recognised coding agent unless performing deliberate
terminal-level recovery.

## Wrong machine/session

IDs and live agent names are scoped to one server: two saved machines, or the local
server and a named session, can each have `w1:p1` or an agent named `reviewer`.
Selecting a machine in the TUI does not retarget CLI commands running in Misa's
pane — they still use the inherited session/socket context. Run a remote command on
the intended host with its explicit session, and rediscover IDs there. `herdr
machine list` shows saved connection profiles, not a cross-machine pane inventory.

## `workspace_group_close_required`

A `worktree` workspace is a linked workspace; closing its primary workspace without
`--group` returns this error. Stop and report it to Misa/the user rather than adding
`workspace close --group` to force the close — that flag also closes every linked
worktree workspace and is not a routine bypass.

## Herdr reports an error

Herdr server errors are JSON on stderr with exit status 1; syntax errors exit 2.
Read the error and run only the relevant help group to correct syntax. Do not run
bare `herdr`, stop the server, or close unrelated panes as a recovery attempt.
