# Foretera — Testing agents

Project subagents in `.claude/agents/`. Claude Code picks these up automatically
when working in this repo; invoke by name ("run quell-release-qa") or let
Claude dispatch them per the matrix below. Each returns a structured verdict —
the release rule is simple: **nothing pushes on a FAIL.**

## The agents

| Agent | What it does | Verdict line |
|---|---|---|
| `quell-release-qa` | Full gate: `qa.ps1` (api tsc + engine tests + app tsc), known-regression greps (native imports in routes, getToken-in-deps, stacked Modals, hardcoded hex, enum-vs-CHECK drift), local D1 integrity queries | `RELEASE-QA: PASS/FAIL` |
| `quell-contract-checker` | API↔app response-shape drift (`api/src/routes/*` vs `app/types.ts` + `useApi.ts`), nullability direction, security projections, query-param parity | `CONTRACT: CLEAN / N ISSUES` |
| `quell-engine-tester` | Extends + runs the vitest scoring suite when engine/handicap/tee logic changes; encodes the WHS net match-play rules | `ENGINE: GREEN/RED` |
| `quell-ux-auditor` | Members design-system compliance (tokens, both themes, semantic colors), iOS overlay/native-import rules, a11y + haptics polish | `UX-AUDIT: CLEAN / N findings` |

## When to run what (feature-release matrix)

| Change touches… | release-qa | contract-checker | engine-tester | ux-auditor |
|---|---|---|---|---|
| Any push (always) | ✅ | | | |
| Worker route / app types / useApi | ✅ | ✅ | | |
| scoring.ts / scorecards.ts / handicaps / tees | ✅ | | ✅ | |
| New or restyled screen / component | ✅ | | | ✅ |
| Migration or seed | ✅ (runs the D1 integrity section) | ✅ if response shapes moved | | |

Independent agents run in parallel (one message, multiple Agent calls).

## The release ritual

1. Build the feature.
2. Dispatch the matrix row's agents in parallel.
3. Fix every P1/FAIL; rerun the failing agent only.
4. Commit (`git commit -F <msgfile>`), push, deploy Worker if `api/` changed.
5. Update `docs/FORETERA_WHITEPAPER.html` + `docs/QUELL_ARCHITECTURE.md` if the
   push was meaningful (standing rule — new surface, schema, or positioning).

Manual on-device testing stays Bryan's lane: the agents clear the mechanical
bar so device time is spent on feel, not crashes.
