# Monitoring and reporting

Use this reference to receive agent results without flooding Misa's context. Herdr
does not independently push a terminal completion into Misa's reasoning context. A
pending `agent_wait` can, however, return through its MCP call; Claude Code may
background that call and later deliver its result as a task notification. Misa owns
the roster check that turns either signal into the next coordination action.

## Roster and checkpoint loop

After each launch, store the worker name, pane ID, role, model, dependency, expected
handoff, and disposition in the active work ledger. Run `herdr agent list` immediately
after all launches in a wave, after any `agent prompt --wait` or `agent wait` returns,
before starting dependent work, and whenever Misa resumes coordination after another
request. Do not rely on a terminal's visual Done badge or a prior transcript read.
For a saved SSH machine, record its profile ID or label in that row and apply the
same `--machine` prefix to every roster, get, read, wait, and prompt command.

For a live wave with one direct dependency, call `agent_wait` without `timeout_ms`
or `until`. Herdr then waits until the worker reaches `done`, `idle`, or `blocked`,
which keeps Misa's controller turn open without polling. Do not wait only for `done`:
Herdr can change a completion from `done` to `idle` when it is seen, and both states
mean ready for input. On return, process that worker through
the decision loop before advancing dependents. On `blocked`, surface the question to
the user; Misa cannot inspect or answer a raw approval UI.

Issue that unbounded wait once per dependency. If Claude Code backgrounds the call, do
not issue repeated or parallel `agent_wait` calls for the same worker: at the next
checkpoint call `agent_get`, and when it reports `done` or `idle`, read `agent_handoff`
and process it. A delivered background result is processed the same way, once.

Use bounded waits only for independent workers, intentional progress checkpoints, or
when Misa must return control to the user. The controller allows a single explicit
timeout of up to 300,000 ms. When that wait expires, `herdr_control` returns a normal
monitoring result rather than an MCP failure. It does not mean the work failed or the
prompt was absent. Do not resend the mission after a timeout. Refresh the roster only
after that wait, a prompt result, a dependency checkpoint, or resumed coordination.
Keep `unknown` out of the completion path and recheck it at the next checkpoint.

Herdr 0.9.3 treats `idle` and `done` as ready for input, with server seen-state
distinguishing them. A CLI read does not mark a target seen, and client Done badges
can differ. Treat a lost output stream or missing final close record as transport
uncertainty: rerun `agent list` and `agent get` before deciding the worker failed or
completed.

## Monitoring ladder

1. Use `herdr_control` with `agent_list`. Keep `working` agents in the roster; inspect them only
   when overdue, a dependency is waiting, or the user asks for an update.
2. For one `done` or `blocked` target, use `herdr_control` with `agent_get` to confirm its
   hosted pane and live lifecycle state.
3. If the target is blocked, do not inspect its full terminal; report the blocker to
   the user or send an authorised, focused follow-up.
4. Only for a settled report that Misa must review, use `herdr_control` with
   `agent_handoff`. The tool fixes the read to a bounded recent terminal window. The
   worker handoff must be compact:
   status, conclusion, evidence IDs or verification result, risk, decision needed,
   and recommended next action. Do not enlarge the read just to obtain a narrative;
   ask one focused follow-up if a required field is absent.
5. Delegate evidence validation to a verification worker. Misa advances only from
   that compact verification handoff; she does not run ledger commands or inspect
   source locators. A report is a handoff, not a source of truth.

CLI reads do not mark a pane as seen; only an explicit focus command (`agent focus`)
does. Each TUI client tracks its own Done badges independently, so one client's
badge can differ from the CLI's state or another client's badge. Misa treats the
reviewed report and its evidence as the acknowledgement, so it does not need to
focus panes just to clear a visual state.

For a short task, `agent prompt --wait` settles on the first `idle`, `done`, or
`blocked` state after it observes activity. It tracks lifecycle state rather than an
individual turn, so a worker already `working` can satisfy the wait with completion
of that turn. Do not add `--until` unless Misa specifically needs an exact state.

## Decision loop

For a `blocked` worker: inspect → classify the question → answer inside verified
technical scope, or escalate to the user if it crosses a user-owned decision. Send
input through `herdr agent prompt <target> "<focused answer>"`; use `agent send-keys`
only for intentional interactive UI control.

For a `done` worker: inspect → validate decisive evidence → choose exactly one:

- accept and move the dependent wave forward;
- ask one focused follow-up;
- delegate targeted review/verification; or
- raise a concise decision or risk to the user.

After choosing, update the roster disposition before processing another completed
worker. This prevents a finished terminal from being forgotten while Misa coordinates
the rest of the wave.

When information is durable, call `misa-portfolio`, then start a dedicated
`portfolio-curator` worker through Herdr to update the relevant card or work snapshot
with evidence and a review date. Do not save raw pane output, terminal logs, or
unverified claims.

## Resource cleanup

After report, verification, decision, and memory steps are complete, Misa may clean
up only the pane it created in the current controller session. For a working worker,
send `agent_stop`; then wait for that same named agent with `until: idle` or
`until: done`, and close only its recorded pane with `pane_close`.

Do not close a user pane, an earlier-session pane, a watcher/server, a blocked or
unknown worker, or a task with pending follow-up. The constrained tool refuses those
cases. After a close, retain only the Markdown handoff and evidence pointers.

Never leave an orphan pane. If `agent_start` fails in a pane Misa split, the pane has
no settled agent, so `pane_close` refuses it. Start OMP in that pane with `agent_start`
(after `agent_not_ready`, keep the name and only wait), wait for `idle`, then close it
with `pane_close`. A pane that still cannot close is reported as `operations cleanup
needed`.

## Notification recommendation

When the user asks to configure Herdr, recommend this in their Herdr config so done
and blocked background agents reach Misa without polling:

```toml
[ui.toast]
delivery = "herdr"
delay_seconds = 1
```

Do not alter the user's Herdr configuration unless they explicitly request it.

`herdr notification show <title> [--body TEXT] [--sound none|done|request]` also
exists for an ad hoc OS notification. Misa uses it only when the user asked to be
notified, not as a routine step.
