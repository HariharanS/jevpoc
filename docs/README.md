# JEV POC project brain

> **Audience:** humans and AI coding agents  
> **Purpose:** Make the repository a durable continuation point for the project, including both the chosen design and the research that led to it.

This repository intentionally separates **normative design** from **research/reference**.

An AI agent should not treat every document as an instruction to implement everything it mentions.

## Status legend

| Status | Meaning |
|---|---|
| **Chosen / normative** | Current design direction. Implement unless a newer ADR changes it. |
| **Reference example** | Concrete scenario/eval seed. Use it to understand behavior; do not hard-code only for the example. |
| **Research snapshot** | Dated investigation of alternatives/capabilities. Useful evidence, not automatically the chosen architecture. Re-verify only when freshness matters. |
| **Spike required** | We deliberately have not selected the implementation/provider yet. Test the stated question before committing. |
| **Deferred** | Explicitly not part of the first build. Do not add it opportunistically. |

## The five-minute project orientation

Read these first:

1. [Product capabilities and user journeys](09-product-capabilities-user-journeys.md) — what the application is.
2. [System design](01-system-design.md) — major runtime components.
3. [Request lifecycle and harness integration](10-request-lifecycle-and-harness.md) — where JEV sits relative to the raw request, harness, model and tools.
4. [JEV request modeling](11-jev-request-modeling.md) — exactly how state/questions are constructed.
5. [Semantic state and UI runtime](12-semantic-state-and-ui-runtime.md) — CREATE/PATCH/MERGE/SEAL and morphing UI.
6. [Voice architecture](08-voice-architecture.md) — STT/control-first vs native realtime.
7. [Streaming checkpoint scheduler](16-streaming-checkpoint-scheduler.md) — how continuous/yapping input is chunked into semantic checkpoints without an LLM on every partial.
8. [TypeSafe AI / Jev practical reference](17-typesafe-ai-reference.md) — concrete API/SDK, question/answer shapes, batching, model/limits and agent skill.
9. [Runtime contracts](18-runtime-contracts.md) — IDs, trace flow, approvals, fallback, loop bounds, memory readback and locked tooling.
10. [First demo and evaluation](19-first-demo-and-evaluation.md) — chosen slice, baseline, fixtures and success metrics.
11. [Core app experience](21-core-app-experience.md) — voice-orb + cards first, transcript/processing/trace via progressive disclosure.
12. [UI / UX Lab design](20-ui-ux-design.md) — expanded three-column developer/demo view.
13. [Implementation plan](07-implementation-plan.md) — build sequence.

Then read the relevant research snapshot for the area you are changing.

## Chosen / normative design

### Product and UX

- [00 — Product intent](00-product-intent.md)
- [09 — Product capabilities and user journeys](09-product-capabilities-user-journeys.md)
- [12 — Semantic state and UI runtime](12-semantic-state-and-ui-runtime.md)

Key direction:

~~~text
language / voice
      |
      v
semantic evidence
      |
      v
JEV decisions
      |
      v
deterministic state mutation / policy
      |
      v
appropriate UI / action
~~~

This is a live intent workspace, not primarily a chatbot.

### Runtime and technical architecture

- [01 — System design](01-system-design.md)
- [02 — Technical design](02-technical-design.md)
- [10 — Request lifecycle and harness integration](10-request-lifecycle-and-harness.md)
- [14 — Tool Gateway, MCP and WebMCP](14-tool-gateway-mcp-webmcp.md)

Key direction:

~~~text
raw request
  -> deterministic normalization
  -> bounded SemanticFrame
  -> stage-specific JEV question set
  -> deterministic policy
  -> deterministic handler OR selected model/harness
  -> governed Tool Gateway
  -> completion / state / memory
~~~

### JEV / TypeSafe

- [03 — JEV decision model](03-jev-decision-model.md)
- [11 — Detailed JEV request modeling](11-jev-request-modeling.md)
- [17 — TypeSafe AI / Jev practical reference](17-typesafe-ai-reference.md)

Concrete integration is now defined: official TypeSafe SDK behind the application-owned DecisionEngine port. AI agents modifying Jev integration should read/use the official TypeSafe agent skill first.

Key rule:

> Do not put an LLM in front of JEV merely to decide what JEV should be asked.

Runtime stage selects a versioned question set. An LLM comes first only when candidate generation itself is genuinely open-ended.

### Voice

- [08 — Voice architecture](08-voice-architecture.md)
- [ADR 0004 — Voice control plane](adr/0004-voice-control-plane.md)

Two explicit modes:

1. STT/control-first: transcript evidence -> **hybrid checkpoint scheduler** -> semantic checkpoint -> JEV -> policy.
2. Native realtime speech-to-speech: provider owns conversational audio loop; application still owns tools, approval, durable mutation and memory.

For the control-first path, event normalization is deliberately dumb bookkeeping. The checkpoint scheduler decides **when to ask JEV** using cheap signals; JEV decides **what the speech means**. See [16 — Streaming input and semantic checkpoint scheduler](16-streaming-checkpoint-scheduler.md).

Do not pretend these have the same interception point.

### Runtime contracts

- [18 — Runtime contracts and ambiguity resolution](18-runtime-contracts.md)
- [19 — First demo and evaluation](19-first-demo-and-evaluation.md)

These resolve the implementation blockers: concrete typed decision answers, live traceId creation, one trace source of truth, bounded loop semantics, approval/resume, Jev fallback, memory readback, package/tooling choices and measurable success criteria.

### UI

- [21 — Core app experience](21-core-app-experience.md)
- [20 — UI / UX Lab design](20-ui-ux-design.md)

The default product is voice-orb + evolving intent cards. Transcript is optional/compact; processing is collapsible; trace/Inspector is a developer feature toggle inside the same workspace.

The three-column pipeline is the expanded Lab/developer presentation, not the permanent default UI.

### Observability

- [04 — Observability and Inspector](04-observability.md)

App mode is the normal experience.

Inspector mode exposes execution/state evidence, JEV questions and answers, routing, tools, approvals, latency and mutations — not private model chain-of-thought.

### Session/retro/memory

- [13 — Session, retrospective and memory signals](13-session-retro-memory.md)

Classify bounded episodes into ephemeral / short-term / retrospective / long-term / discard. JEV proposes classification; deterministic policy decides persistence.

### Local-to-cloud

- [05 — Local-to-cloud evolution](05-local-to-cloud.md)
- [ADR 0001 — Local-first modular monolith](adr/0001-local-first-modular-monolith.md)

Start local and simple. Cloud platform is not the domain architecture.

## Research snapshots

These files preserve the work already done so a future agent does not start from a blank search query.

### Harness/framework research

- [Harness/framework evaluation — 2026-09-25](research/2026-09-25-harness-framework-evaluation.md)
- [JEV harness patterns — 2026-09-25](research/2026-09-25-jev-harness-patterns.md)

Includes:

- Microsoft Agent Framework middleware/control points;
- GitHubCopilotAgent limitations relative to standard MAF agents;
- GitHub Copilot SDK session/model configuration;
- LangChain/LangGraph lifecycle middleware and published JEV harness;
- Strands ModelRouter and experimental BidiAgent;
- Pi before-agent JEV patterns;
- prompt-caching/tool-filtering caveats.

### Voice provider research

- [Voice provider findings — 2026-09-25](research/2026-09-25-voice-provider-findings.md)
- [Detailed voice API capability matrix — 2026-09-25](research/2026-09-25-voice-api-capability-matrix.md)

The detailed matrix extends the earlier research with current official-provider findings for OpenAI, Gemini, xAI/Grok, Deepgram, ElevenLabs and Azure Voice Live, including turn-detection, partial/final transcript behavior, tools, browser authentication and project-specific benchmark implications.

### Freshness rule

Do **not** redo this research just because it exists outside your model context.

Re-check a source when:

- implementing against the provider/framework API;
- the research snapshot is materially old for the question;
- an API/version has changed;
- a source contradicts current runtime behavior.

When research changes a durable architecture decision, add/update an ADR. Do not silently rewrite the project direction.

## Reference scenarios and eval seeds

- [Mixed voice utterance end to end](examples/01-mixed-utterance-end-to-end.md)
- [API Journey Compiler](examples/02-api-journey-compiler.md)

The mixed-utterance scenario is the primary behavioral seed for:

- partial/revised transcript handling;
- multi-intent decomposition;
- correction;
- incomplete reminder state;
- multiple simultaneously active semantic events;
- state mutation instead of duplicate chat output.

The API Journey Compiler preserves the payment/API direction:

~~~text
business intent + API docs
  -> LLM candidate generation
  -> JEV bounded decisions
  -> deterministic API/schema validation
  -> editable state-machine/integration UI
~~~

## Durable decisions

Read [ADRs](adr/) before changing major assumptions.

Current durable decisions:

- ADR 0001 — local-first modular monolith.
- ADR 0002 — JEV is the decision plane, not the agent.
- ADR 0003 — AI, voice and tools behind narrow application-owned adapters.
- ADR 0004 — voice has a Transcript Ledger and two explicit execution modes.

## What is locked for the first implementation

The first demo is **Live Intent Workspace**: mixed-intent/correction semantics text-first, then the same runtime over streaming voice.

These are not open research questions:

- application owns semantic state;
- JEV returns decision signals, not side effects;
- deterministic policy owns thresholds/actions;
- tool execution goes through Tool Gateway;
- provider SDK types stay inside adapters;
- question sets are versioned application artifacts;
- normal runtime decisions do not require an LLM to formulate JEV questions;
- voice transcript evidence is revision-aware;
- STT finality is not action permission;
- App and Inspector views share the same execution;
- first architecture is local-first and simple;
- TypeSafe/Jev uses the official SDK behind DecisionEngine;
- trace_events in SQLite is the Inspector replay source of truth;
- semantic runs create traceId before processing and stream live over SSE;
- Milestones 1-3 are single-pass; tool loops later are bounded;
- approval begins only after a concrete ToolProposal;
- memory has an explicit readback path;
- pnpm + node:sqlite + Biome are locked for initial implementation;
- the POC is measured against an LLM-first baseline.

## What needs a spike before commitment

### Harness implementation

Question:

> Which harness gives us the least code while preserving raw-request/model/tool control?

Candidates already researched:

- thin own orchestrator + provider SDK;
- Microsoft Agent Framework;
- GitHub Copilot SDK behind our JEV layer;
- LangChain/LangGraph;
- Strands.

Do not hold up the walking skeleton waiting for a permanent answer.

### Control-first voice/STT provider

Compare the current candidates using the benchmark in the voice-provider research document.

The first provider is an adapter, not a permanent product decision.

### Native realtime provider

Only after control-first voice works, compare natural conversational mode with the same Tool Gateway/state model.

### AG-UI / CopilotKit

Adopt only if it reduces UI/event plumbing without taking ownership of our semantic state model.

### Cloud host

Choose when deploying. Cloudflare/Durable Objects, Convex, AWS and ordinary container hosts are deployment/platform options, not current domain dependencies.

## Explicitly deferred

Unless a concrete requirement appears, do not introduce:

- generalized multi-agent supervisor;
- distributed workflow engine;
- WebMCP as a foundational runtime;
- vector database;
- event bus/Kafka/EventBridge;
- microservices;
- multi-cloud abstraction;
- generalized plugin marketplace;
- separate background worker fleet;
- all voice providers at once;
- arbitrary LLM-generated frontend code.

## If you are working on...

| Task | Read |
|---|---|
| Raw-request/model routing | 10, 11, harness research |
| Microsoft Agent Framework/Copilot/Strands integration | 10 + harness research |
| JEV questions/evals | 03, 11, 17, 19, tests/evals, JEV harness research |
| TypeSafe adapter / Jev API | 17, 18, TypeSafe skill |
| Voice/STT/realtime | 08, 11, 16, detailed voice capability matrix, mixed-utterance example |
| UI/cards/voice orb | 09, 12, 20 |
| Runtime contracts / APIs | 02, 18 |
| Tools/MCP/WebMCP/approvals | 14, 18, 10 |
| Memory/retro | 13, 18, 11 |
| Inspector/telemetry | 04, 18, 20 |
| Payment/API demo | examples/02 + 11 |
| Deployment | 05 + ADR 0001 |

## Rule for future research

When an agent performs substantial research that affects implementation:

1. preserve useful findings under docs/research with a date;
2. include source links;
3. distinguish facts from our interpretation;
4. update a normative document only if the design actually changes;
5. add an ADR if the change is durable and cross-cutting.

That is how this repository remains the project's shared memory rather than becoming another transient agent conversation.
