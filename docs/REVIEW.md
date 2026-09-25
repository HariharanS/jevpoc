# Consolidation record and review findings

**Reviewed source:** docs/final-approach at c4f43d9824821039eed848346fcff165e52fd636, 43 files. Source browsing: https://github.com/HariharanS/jevpoc/tree/c4f43d9824821039eed848346fcff165e52fd636 . This is a historical review record, not a competing specification.

The first review produced a downloadable pack but did not modify GitHub. This consolidation adopts its substantive resolutions in the repository, incorporates the later warm-brown UI preference, and adds explicitly labelled executable prototypes. It does not claim the production runtime bugs were fixed: the application was not implemented at the reviewed commit.

## Findings and current owner

| ID | Finding in the reviewed design | Resolution owner / remaining implementation |
|---|---|---|
| R01 | Default main branch contained only the small README. | Root navigation and adoption; B00 still builds the app. |
| R02 | Root/Copilot/plan instructions were Lab-first while newer UX was App-first. | PRODUCT/UI/BUILD now agree; B05 implementation. |
| R03 | Accepted ADR 0003 still named TraceSink/ToolExecutor. | DECISIONS and RUNTIME define current ownership. |
| R04 | Repeated incompatible event/input/decision schemas. | One contracts/mvp.schema.json and generated types; B01 validators. |
| R05 | Relation/target decisions did not define field-value extraction. | RUNTIME §3; explicit scripted/bounded/LLM stages; F02 coverage. |
| R06 | Singular route.mutation could not represent multi-intent paragraph. | Ordered atomic batches; paragraph/chunk equivalence; B03. |
| R07 | Saved, sealed, interpreted and externally completed were conflated. | Separate semantic/run/action statuses and truthful copy. |
| R08 | Session versions had no concrete concurrency/commit contract. | Version/evidence checks, coordinator and CAS; B02/B07. |
| R09 | Replay then subscribe left a gap for SSE events. | Database cursor and latched wakeup; B06/B07. |
| R10 | Voice events could precede their required traceId. | Session cursors with nullable run identity. |
| R11 | Final/end branches bypassed dedupe; scheduler lacked real timer event. | Separate content/boundary frontier; F06 tests. |
| R12 | Card editing/reset/error actions lacked API contracts. | RUNTIME §7; B04/B05. |
| R13 | Immediate 202 had no durable accepted-work/restart rule. | Persist queued first; honest restart status; B04/B07. |
| R14 | Approval was not bound to an immutable current proposal. | SAFETY; F04 digest/version/expiry tests. |
| R15 | External exactly-once execution was overpromised. | Unknown-outcome ledger and reconciliation; F04. |
| R16 | Redacted traces could not also be the only state feed. | Authorized snapshots separate from diagnostic payload. |
| R17 | Explanation needed exact spans; SVG mixed hydration and reminder details. | Revision-pinned evidence and selected-card explanation; retired SVG. |
| R18 | 2pm was treated like a schedulable instant. | Structured temporal fields; no inferred task date or alerts. |
| R19 | 15 seed labels were not an executable model benchmark. | Reviewed/held-out evaluation plan; synthetic labels remain explicit. |
| R20 | Baseline confounded timing policy with model choice. | EVALUATION matched four-cell comparison. |
| R21 | Node 22+ was too broad for unflagged SQLite. | Compatibility floor corrected; exact patch pinned in B00. |
| R22 | Provider capability labels were not model-specific. | RESEARCH evidence/status model; F06 verification. |
| R23 | Core voice proof was delayed behind tools/memory. | PLAN recommends M2/M3 then voice proof. |
| R24 | Bounds, cancellation and retry ownership were incomplete. | RUNTIME guardrails; B04/F06/F6C tests. |
| R25 | Demo identity was not production security; memory/privacy scope incomplete. | SAFETY; local/hosted gates kept distinct. |
| R26 | Project memory repeated rules instead of defining owners. | Short root pointers, task queue and one canonical file per concern. |
| R27 | Valid endpoints/connected graphs did not prove payment journey correctness. | E08 plus SAFETY semantic/failure-path checks. |
| R28 | SDK output needed runtime validation beyond TS unions. | Decision validation contract and negative fixtures; B01/F02. |

## Source coverage and removal map

All source files below are retained by the immutable commit above. No active archive is needed.

| Reviewed paths | Current home |
|---|---|
| README.md, AGENTS.md, BUILD.md, .github/copilot-instructions.md | Root entry points, STATUS and task queue. |
| docs/README.md | Root README navigation. |
| docs/00-product-intent.md, docs/09-product-capabilities-user-journeys.md | PRODUCT; future examples in EXPERIMENTS. |
| docs/01-system-design.md, docs/02-technical-design.md, docs/10-request-lifecycle-and-harness.md, docs/18-runtime-contracts.md | RUNTIME, canonical schema, SAFETY; harness sources in RESEARCH. |
| docs/03-jev-decision-model.md, docs/11-jev-request-modeling.md, docs/17-typesafe-ai-reference.md | RUNTIME decision/extraction rules and RESEARCH source register. |
| docs/04-observability.md | RUNTIME §8. |
| docs/05-local-to-cloud.md | SAFETY deployment gate and E07/F08. |
| docs/06-agent-collaboration.md, docs/07-implementation-plan.md, docs/15-decision-status-and-open-experiments.md | AGENTS, PLAN, tasks and STATUS. |
| docs/08-voice-architecture.md, docs/16-streaming-checkpoint-scheduler.md | RUNTIME voice/evidence rules, SAFETY and E05/E07. |
| docs/12-semantic-state-and-ui-runtime.md | RUNTIME and schema. |
| docs/13-session-retro-memory.md | SAFETY memory gate and F05. |
| docs/14-tool-gateway-mcp-webmcp.md | SAFETY tools; transport adapters are not business truth. |
| docs/19-first-demo-and-evaluation.md | PRODUCT, EVALUATION and fixtures. |
| docs/20-ui-ux-design.md, docs/21-core-app-experience.md, docs/22-visual-design-system-and-taste.md | One current UI contract and interactive prototype. |
| docs/adr/0001-local-first-modular-monolith.md, docs/adr/0002-jev-as-decision-plane.md, docs/adr/0003-ports-adapters-for-ai-voice-tools.md, docs/adr/0004-voice-control-plane.md | DECISIONS retains accepted principles and supersedes retired names. |
| docs/examples/01-mixed-utterance-end-to-end.md | PRODUCT and consolidated golden fixtures. |
| docs/examples/02-api-journey-compiler.md | E08 and SAFETY, explicitly later scope. |
| docs/research/2026-09-25-harness-framework-evaluation.md, docs/research/2026-09-25-jev-harness-patterns.md | Curated RESEARCH pointers and E07; no broad current-capability promise. |
| docs/research/2026-09-25-voice-api-capability-matrix.md, docs/research/2026-09-25-voice-provider-findings.md | Model-specific RESEARCH register and E05. |
| docs/ui/lab-layout.svg, docs/ui/taste-reference-v2.svg | Retired from active tree; current prototype follows updated taste brief. |
| tests/evals/README.md, tests/evals/pre-turn-routing.jsonl, tests/evals/voice-semantic-update.jsonl | Current fixtures/EVALUATION; original 15 labels remain historical regression material, not silently relabelled. |

## Known limits

No live AI, voice, payment, cloud, auth or production application tests have run merely because these documents exist. Prototype tests cover in-memory behavior only. New synthetic scenario labels still need human review. Actual checks belong in VALIDATION and STATUS; future agents must not convert a resolved design ambiguity into an implemented-feature claim.
