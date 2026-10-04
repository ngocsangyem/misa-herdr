# Monitoring and reporting

Use this reference to receive agent results without flooding Misa's context. Herdr
does not push a terminal completion into Misa's reasoning context, so Misa owns the
roster check that turns a lifecycle transition into the next coordination action.

## Roster and checkpoint loop

After each launch, store the worker name, pane ID, role, model, dependency, expected
handoff, and disposition in the active work ledger. Run `herdr agent list` immediately
after all launches in a wave, after any `agent prompt --wait` or `agent wait` returns,
before starting dependent work, and whenever Misa resumes coordination after another
request. Do not rely on a terminal's visual Done badge or a prior transcript read.
For a saved SSH machine, record its profile ID or label in that row and apply the
same `--machine` prefix to every roster, get, read, wait, and prompt command.

For a live wave, wait for a meaningful deadline rather than polling every minute. The
controller allows a single `agent_wait` of up to 300,000 ms: use a shorter bounded
wait for routine work and five minutes for a longer active phase. A timeout means
continue monitoring; it does not mean the work failed or the prompt was absent. Do
not resend the mission after a timeout. Refresh the roster only after that wait, a
prompt result, a dependency checkpoint, or resumed coordination. On `done`, process
that worker through the decision loop before advancing dependents. On `blocked`,
surface the question to the user; Misa cannot inspect or answer a raw approval UI.
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

The constrained Misa tool cannot close panes. After report, verification, decision,
and memory steps are complete, leave cleanup to the user or a separately authorised
operations worker.

Do not close a pane running a watcher/server, a user process, or a task with pending
follow-up. Do not turn a `working` state into cleanup: diagnose it first. After a
close, retain only the Markdown handoff and evidence pointers.

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
