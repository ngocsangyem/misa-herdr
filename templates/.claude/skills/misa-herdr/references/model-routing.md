# Model and provider routing

Reviewed: 2026-09-29. Use this reference before Misa starts an OMP worker. It is a
routing summary, not an availability guarantee: re-check the account/provider
entitlement before a material migration.

## Selection sequence

1. Preserve a user-specified provider, model, budget, latency target, or required
   agent surface.
2. Choose the narrowest matching business role from the live `.claude/agents/`
   definitions. The business role owns the task shape; the OMP model role is a
   separate capacity decision. Do not inherit Misa's controller model or copy a
   previous worker's model.
3. Classify the task by risk, independence, context size, required quality, latency,
   and budget. Choose the lowest tier that demonstrably meets it.
4. Pass the selected full OMP model ID and thinking tier after Herdr's `--` separator
   as shown in `commands.md`. Put the business-role boundary in the first OMP mission
   prompt; OMP model roles do not consume Claude's `--agent` role definitions.
   Exact IDs improve reproducibility; aliases are convenient but can resolve
   differently over time.
5. Routine planning, debugging, and implementation use `task` / Opus 5.5. Choose a
   higher-thinking Opus route only when the work needs it; always record the route.
6. Record `name`, business role, OMP model role, provider, effective model, reasoning tier, objective,
   dependency, and expected evidence in the work ledger before launch. A missing role
   or model is a launch blocker, not an invitation to fall back to Fable.
7. Record only a meaningful routing decision in the handoff: task, business role, OMP model role, effective model, reason,
   and observed outcome. Do not load or store a full catalog/transcript as memory.

## OMP model-role defaults

These role names are Misa's routing labels, not launch arguments accepted by OMP.
Choose a row, resolve it to its model ID and thinking tier, then pass those values
through `agent_start`. That fixed action supplies OMP's `--model` and `--thinking`
native arguments after Herdr's separator. Keep the rows aligned
with OMP's `modelRoles` in `~/.omp/agent/config.yml`; OMP's own flags such as
`--plan`, `--slow`, and `--advisor` configure OMP features and are not substitutes
for choosing the Herdr worker's main session model.

| OMP model role | Effective model | Thinking | Use |
| --- | --- | --- | --- |
| `default`, `task` | `anthropic/claude-opus-5-5` | `medium` | well-scoped everyday implementation and delegated work |
| `smol` | `anthropic/claude-haiku-4-5` | `low` | bounded discovery, extraction, triage, simple test/log analysis |
| `slow` | `anthropic/claude-opus-5-5` | `high` | deep RCA or difficult implementation |
| `plan` | `anthropic/claude-opus-5-5` | `high` | architecture or high-stakes planning |
| `advisor` | `anthropic/claude-fable-5-1` | `medium` | hard advisory judgment; keeps the limited Codex allotment for other work |
| `review` | `openai-codex/gpt-6-luna` | `high` | normal code review of Anthropic-authored work |
| `vision`, `designer` | `google-antigravity/gemini-3.8-flash` | `high` | image/UI inspection or design work |
| `commit` | `openai-codex/gpt-6-luna` | `low` | Git or GitHub write only: must use `git-manager`, authenticate as the mission's expected login, and never use a Claude agent |
| `tiny` | `google-antigravity/gemini-3.8-flash` | `low` | cheap, independently verifiable microtasks |

For an independent review of Codex-authored work, do not use the normal `review`
route. Start the independent OMP reviewer on `anthropic/claude-sonnet-5-5` at `high`.
Escalate to `anthropic/claude-opus-5-5` only with a user request, user approval, or a
verified insufficiency handoff, as required by the launch gate. The standard `review`
route uses GPT-6 Luna at `high`; the cross-provider exception preserves independence
without bypassing escalation policy.

## Business-role defaults

Read the candidate role's frontmatter before launch. Use this table when its task
matches; the task can justify a different provider, but never a generic Fable fallback.

| Task | Default business role | Default OMP model role | Escalate when |
| --- | --- | --- | --- |
| File inventory, bounded extraction, simple test/log classification | `explore` or `tester` | `smol` | Findings become ambiguous or cross-module |
| Research, documentation, routine debugging, routine implementation | `researcher`, `docs-manager`, `debugger`, or `fullstack-developer` | `task` | A verified worker handoff shows `task` is insufficient, or the user requests/approves Opus |
| Focused code review | `code-reviewer` | `review` | Security, migration, or public-contract risk needs independent review |
| Product or implementation planning | `planner` | `task` | A verified worker handoff shows `task` is insufficient, or the user requests/approves Opus |
| Design analysis or UI/UX work | `design-analyst` or `ui-ux-designer` | `designer` | High-value visual or product decision needs stronger review |
| Post-implementation UI fidelity check | `visual-verifier` | `vision` | Source image, target screenshot, viewport, or state is unavailable |
| Git-only handoff | `git-manager` | `commit` | Pin `openai-codex/gpt-6-luna` at `low`; block on any identity, expected-login authentication, release, or remote-state uncertainty |
| High-stakes advisory judgment | `kongming` or `advisor` | `advisor` | Never use as a general implementation shortcut |

## OpenAI GPT-6 (available in Codex)

| Model ID | Official position | Best routing use | Trade-off |
| --- | --- | --- | --- |
| `gpt-6-astra` | Most capable GPT-6 model | No default Misa/OMP route; use only for an explicitly selected Codex task | Highest family price; reserve `high` through `max` for measured quality-critical work |
| `gpt-6-sol` | Coding and agentic-workflow balance; recommended by OpenAI for most code generation | No default Misa/OMP route; use only for an explicitly selected Codex coding task | Use Astra when representative evidence shows Sol is insufficient for a high-risk decision |
| `gpt-6-luna` | Cost-sensitive, high-volume tier | Repetitive triage, bounded extraction, simple test analysis, and the standard review route | Do not use as sole decision-maker for ambiguous or high-risk work |

All three have a 1.05M context window and 128k maximum output. Astra supports
`low` through `max`; Sol and Luna also support `none`. Start at `medium` effort
without an evaluation baseline; use `low` or `none` only for latency-sensitive,
independently verifiable work, and raise to `high`, `xhigh`, or `max` only when a
representative evaluation shows a quality benefit.

## Anthropic Claude

| Claude API ID | Claude Code shorthand | Official position | Best routing use | Trade-off |
| --- | --- | --- | --- | --- |
| `claude-opus-5-5` | `opus` | Claude's strongest Opus model for long-running agents and complex work | Plan design, architecture, deep RCA, and difficult implementation judgment | More costly than Sonnet; use where sustained judgment is needed |
| `claude-fable-5-1` | `fable` | Most capable widely released Claude for demanding reasoning and long-horizon agentic work | Misa's coordinator role and high-stakes advice only | Keep out of planning and implementation routes |
| `claude-opus-5` | `opus` | Previous Opus release | Existing pinned work only | Do not select for new workers when Opus 5.5 is entitled and available |
| `claude-sonnet-5-5` | `sonnet` | Fast, capable model for well-scoped everyday tasks | Default worker for routine implementation, bug fixes, and documentation | Escalate complex, open-ended, or high-stakes work to Opus 5.5 |
| `claude-haiku-4-5-20251001` | no shorthand documented by this CLI | Fastest model with near-frontier intelligence | Bounded discovery, classification, simple testing, high-volume tasks | 200k context and 64k max output; no adaptive thinking |

Fable 5.1, Opus 5.5, and Sonnet 5.5 have 1M context and 128k max output with adaptive
thinking; Haiku supports extended thinking instead. Claude Code documents `fable`,
`opus`, and `sonnet` aliases plus full names. Prefer full IDs in the launch ledger
and command so an alias change cannot silently alter a worker's route.

## Team composition

| Work shape | Default OMP model role | Escalation / composition |
| --- | --- | --- |
| Repetitive discovery, inventory, focused extraction, test-log classification | `smol` | Escalate to `task` when ambiguity or cross-file reasoning appears |
| Routine implementation, debugging, test repair, codebase exploration | `task` | Use `slow` only when evidence shows deep reasoning is needed |
| Contained planning with `ak:plan` | `task` | Use the `planner` business role when scope, repository, and acceptance criteria are bounded |
| Hard planning with `ak:plan` | `task` | Promote to `plan` only with a verified insufficiency handoff or explicit user request/approval |
| Decision-gated implementation from an accepted `ak:plan` with `ak:cook` | `task` | Upgrade to `slow` only when the accepted plan's assumptions fail during delivery |
| Bounded adaptive implementation | `task` | Start with scout/domain skill/test; pause only at an authority-changing discovery |
| Implementation from an accepted `ak:plan` with unresolved hard decisions | `slow` | Escalate to `advisor` only for a specific unresolved decision, not as a general builder |
| Complex multi-step implementation, cross-repo change, deep RCA | `task` | Promote to `slow` only with a verified insufficiency handoff or explicit user request/approval; split independent subproblems first |
| Architecture, hard trade-off, security review, migration risk, high-value UI | `plan`, `advisor`, or `review` | Pin the review worker to the other provider when independent judgment justifies cost/time |

Use one primary implementation worker by default. Use cross-provider review only for
high-risk, ambiguous, security-sensitive, or expensive-to-reverse work—not as a
routine brand comparison. A model choice never extends authority: repository scope,
approval gates, and verification requirements remain in force even with bypass flags.

For a decision-gated planned delivery, Misa chooses the `task` route for the planner
and then launches `ak:cook` with `task` by default. For bounded adaptive work, route
the implementation worker through scout, the relevant domain skill, and focused
testing instead. Upgrade capacity only on a verified worker handoff or explicit user
request/approval; a high-capability planner is not a reason to escalate the
implementation worker.

If a worker fails from missing context, unclear scope, or blocked tools, correct that
constraint before escalating the model. Escalate capacity only when grounded evidence
shows the lower tier is insufficient.

Official sources:

- https://developers.openai.com/api/docs/models
- https://developers.openai.com/api/docs/guides/code-generation
- https://developers.openai.com/api/docs/guides/latest-model
- https://platform.claude.com/docs/en/about-claude/models/overview
- https://code.claude.com/docs/en/cli-usage
- https://www.anthropic.com/claude-opus-5-5
