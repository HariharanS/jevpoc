# Copilot instructions for JEV POC

Read `AGENTS.md` and the architecture docs before making architectural changes.

Priorities:

1. smallest working vertical slice,
2. deterministic/testable code,
3. typed boundaries,
4. explicit JEV decisions and policy thresholds,
5. observable behavior,
6. local-first operation.

Avoid speculative abstractions and infrastructure.

When asked to implement a feature:

- preserve the decision -> policy -> execution separation,
- keep provider SDK objects inside adapters,
- validate all tool inputs before execution,
- add tests for routing/policy behavior,
- add trace events for meaningful decisions,
- update docs when an architectural contract changes.

Do not introduce CopilotKit, LangGraph, Temporal, queues, microservices, vector databases or a generalized plugin system unless the task explicitly demonstrates why the current simple architecture is insufficient.
