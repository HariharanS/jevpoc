# JEV POC

A local-first reference application for exploring **JEV as a fast decision plane around an AI agent**.

The repository is intended to be more than a codebase: it is the project's **shared research and design memory**, so a new human or AI agent can continue from the decisions and investigations already completed instead of starting again from a blank search.

## Project brain

Start with **[docs/README.md](docs/README.md)**.

It distinguishes:

- **chosen / normative design** — what to build;
- **research snapshots** — alternatives and current external findings;
- **reference scenarios / eval seeds** — concrete behavior to preserve;
- **spikes** — questions deliberately left open;
- **deferred work** — things agents should not add opportunistically.

For implementation status, see **[docs/15-decision-status-and-open-experiments.md](docs/15-decision-status-and-open-experiments.md)**.

## Product thesis

This is **not primarily a chatbot**.

The product is a live intent workspace:

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
deterministic policy + evolving typed state
      |
      v
appropriate UI / model / tool / workflow
~~~

A useful shorthand is:

> **Describe the problem. The interface appears.**

## Runtime approach

~~~text
RAW INPUT
   |
   v
deterministic normalization
   |
   v
bounded SemanticFrame
   |
   v
stage-specific JEV questions
   |
   v
deterministic policy
   |
   +--> no LLM / deterministic handler
   |
   +--> selected model or agent harness
   |
   +--> ask / wait / approval
   |
   v
governed Tool Gateway
   |
   v
completion / semantic state / memory / trace
~~~

The critical separation is:

**evidence -> JEV signals -> application policy -> execution**

JEV does not execute business actions. A model probability is not authorization.

Detailed mechanics: [docs/10-request-lifecycle-and-harness.md](docs/10-request-lifecycle-and-harness.md) and [docs/11-jev-request-modeling.md](docs/11-jev-request-modeling.md).

## Voice

Voice is a first-class path.

The design explicitly supports two different modes:

### STT / control-first

~~~text
audio
  -> streaming STT
  -> revision-aware Transcript Ledger
  -> semantic checkpoint
  -> JEV
  -> policy
  -> optional reasoning/tool
~~~

This is the first voice path to build because it exposes the semantic control plane and correction behavior.

### Native realtime speech-to-speech

A provider such as OpenAI Realtime, Gemini Live or xAI/Grok Voice can own the low-latency conversational loop.

In that mode, JEV cannot pretend to be a pre-model filter because the voice model has already heard the audio. Application control remains at:

- Tool Gateway;
- approvals;
- durable state mutation;
- delegated backend work;
- memory/persistence.

See [docs/08-voice-architecture.md](docs/08-voice-architecture.md) and the dated [voice-provider research](docs/research/2026-09-25-voice-provider-findings.md).

## Semantic state and UI

The runtime uses explicit event identity and a small mutation vocabulary:

~~~text
CREATE
PATCH
MERGE
CLOSE
CANCEL
IGNORE
WAIT
~~~

Semantic events can move through:

~~~text
draft -> soft_committed -> patch/merge -> sealed
~~~

This enables the UI to **morph rather than spam**.

Example:

~~~text
"I drank 200 ml Coke..."
    -> Hydration card: 200 ml Coke

"...no, I mean water."
    -> same card patched to 200 ml Water
~~~

See [docs/12-semantic-state-and-ui-runtime.md](docs/12-semantic-state-and-ui-runtime.md).

## Harness strategy

The JEV control plane is harness-neutral.

Research already exists for:

- a thin application-owned orchestrator;
- Microsoft Agent Framework;
- GitHub Copilot SDK;
- LangChain / LangGraph;
- Strands Agents;
- Pi.

The app should see the raw semantic request before committing to a reasoning model.

Framework-specific types stay behind adapters.

See:

- [Request lifecycle and harness integration](docs/10-request-lifecycle-and-harness.md)
- [Harness/framework research](docs/research/2026-09-25-harness-framework-evaluation.md)
- [JEV harness patterns](docs/research/2026-09-25-jev-harness-patterns.md)

## JEV request modeling

Normal runtime JEV questions are **not invented by an LLM on every request**.

The application:

1. identifies the lifecycle stage;
2. builds a bounded semantic state frame;
3. selects a versioned question set;
4. calls JEV;
5. applies calibrated deterministic policy.

An LLM may precede JEV when **candidate generation itself is open-ended**, such as reading API documentation and proposing possible integration paths.

See [docs/11-jev-request-modeling.md](docs/11-jev-request-modeling.md).

## Tool execution

All consequential actions go through the application-owned Tool Gateway.

Models, realtime voice providers, MCP, WebMCP and agent frameworks may propose calls; they do not bypass:

- schema validation;
- hard permissions;
- deterministic policy;
- JEV semantic checks where useful;
- approval;
- idempotency;
- audit/trace.

See [docs/14-tool-gateway-mcp-webmcp.md](docs/14-tool-gateway-mcp-webmcp.md).

## Memory and retrospectives

JEV can classify bounded session episodes into:

- ephemeral;
- short-term;
- retrospective;
- long-term;
- discard.

The application decides persistence.

See [docs/13-session-retro-memory.md](docs/13-session-retro-memory.md).

## Reference scenarios

Two detailed scenarios are already preserved:

- [Mixed voice utterance end-to-end](docs/examples/01-mixed-utterance-end-to-end.md)
- [API Journey Compiler](docs/examples/02-api-journey-compiler.md)

These are intended to become eval/test seeds rather than one-off examples.

## Engineering posture

- Local first; cloud deployable later.
- Modular monolith before distributed systems.
- Standard React UI before agent-UI frameworks.
- Ports/adapters around JEV, harnesses, LLMs, voice, tools and persistence.
- Preserve evidence revisions instead of flattening them.
- Do not run the full agent loop for every speech partial.
- Consequential actions always pass through policy/tool gating.
- Observable by default.
- Human approval is explicit where required.
- Prefer boring, testable code over abstractions invented for hypothetical scale.

## Initial technology direction

- TypeScript / Node.js
- React + Vite
- Fastify
- WebSocket for realtime voice/media flow
- SQLite
- Zod
- Vitest
- OpenTelemetry
- SSE for the Inspector event stream

These are starting choices rather than permanent platform commitments.

## Build order

See [docs/07-implementation-plan.md](docs/07-implementation-plan.md).

The sequence deliberately proves one vertical slice at a time rather than building a generic harness or voice platform first.

## Agent instructions

Before coding, read:

- [AGENTS.md](AGENTS.md)
- [docs/README.md](docs/README.md)
- the relevant normative docs and research snapshots for the task.

Architectural decisions live under [docs/adr](docs/adr).
