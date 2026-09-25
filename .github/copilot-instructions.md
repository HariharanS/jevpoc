# Copilot instructions for JEV POC

Read `AGENTS.md` and `docs/README.md` before substantial work.

The repository contains both **normative design** and **dated research snapshots**. Research files describe evaluated alternatives and current external capabilities; they are not permission to implement every option.

Priorities:

1. smallest working vertical slice;
2. preserve raw-request -> JEV -> policy control points;
3. deterministic/testable state and action handling;
4. typed provider/harness boundaries;
5. explicit JEV question sets and policy thresholds;
6. revision-aware voice behavior;
7. observable App/Inspector behavior;
8. local-first operation.

When implementing:

- preserve evidence -> JEV decision -> deterministic policy -> execution;
- use the versioned question-registry approach in `docs/11-jev-request-modeling.md`;
- preserve SemanticEvent identity and CREATE/PATCH/MERGE semantics;
- keep provider/framework SDK objects inside adapters;
- send consequential actions through Tool Gateway;
- validate tool inputs before execution;
- add routing/policy/state-transition tests and eval fixtures;
- add trace events for meaningful decisions;
- update docs when an architectural contract changes.

Before changing harness, voice provider, UI framework or cloud platform, read the relevant dated research snapshot and `docs/15-decision-status-and-open-experiments.md`.

Do not introduce CopilotKit, LangGraph, Temporal, queues, microservices, vector databases, WebMCP as a foundation, or a generalized plugin system merely because they appear in research. A concrete requirement or successful documented spike must justify the change.
