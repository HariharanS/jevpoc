# JEV POC

A local-first reference application for exploring **JEV as a fast decision plane around an AI agent**.

The repository is intended to be more than a codebase: it is the project's **shared research and design memory**, so a new human or AI agent can continue from the decisions and investigations already completed instead of starting again from a blank search.

## Start building

If you are handing this repo to a coding agent, start with **[BUILD.md](BUILD.md)**.

It assigns Milestones 0-1 only and gives the exact UI/API/test acceptance criteria so the agent can build without inventing missing contracts.

## Project brain

For the full design/research memory, start with **[docs/README.md](docs/README.md)**.

It distinguishes:

- **chosen / normative design** — what to build;
- **research snapshots** — alternatives and current external findings;
- **reference scenarios / eval seeds** — concrete behavior to preserve;
- **spikes** — questions deliberately left open;
- **deferred work** — things agents should not add opportunistically.

For implementation status, see **[docs/15-decision-status-and-open-experiments.md](docs/15-decision-status-and-open-experiments.md)**.

The concrete build contracts are now in:
- [TypeSafe AI / Jev practical reference](docs/17-typesafe-ai-reference.md)
- [Runtime contracts](docs/18-runtime-contracts.md)
- [First demo and evaluation](docs/19-first-demo-and-evaluation.md)
- [UI / UX design](docs/20-ui-ux-design.md)

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
Input/Event Envelope
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
  -> hybrid Semantic Checkpoint Scheduler
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

See [docs/08-voice-architecture.md](docs/08-voice-architecture.md), [docs/16-streaming-checkpoint-scheduler.md](docs/16-streaming-checkpoint-scheduler.md), and the [detailed voice API capability matrix](docs/research/2026-09-25-voice-api-capability-matrix.md).

## First demo

The first implementation target is **Live Intent Workspace**:

~~~text
raw / streaming input
      |
      v
JEV semantic decisions
      |
      v
typed SemanticEvents
      |
      v
cards that CREATE / PATCH / MERGE in place
~~~

The north-star scenario is the mixed-intent correction example, especially:

~~~text
"I drank 200 ml Coke"
        -> hydration draft

"no, I mean water"
        -> PATCH same event to Water
~~~

The first UI is a three-column Lab view:

~~~text
Input Stream | Processing / JEV / Policy | Intent Canvas
                       +
                 Inspector timeline
~~~

with a provider-neutral ChatGPT/Grok-style voice orb for voice input.

See [docs/19-first-demo-and-evaluation.md](docs/19-first-demo-and-evaluation.md) and [docs/20-ui-ux-design.md](docs/20-ui-ux-design.md).

## TypeSafe / Jev

The Jev integration is concrete, not an unspecified external service.

The TypeScript adapter uses the official TypeSafe SDK behind the application-owned DecisionEngine port. Question sets are versioned, independent questions sharing state are batched, and benchmark runs pin a Jev model version.

AI coding agents working on Jev should read/use the official TypeSafe agent skill first.

See [docs/17-typesafe-ai-reference.md](docs/17-typesafe-ai-reference.md).

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

Locked for the first implementation:

- pnpm workspaces
- Node.js 22+
- TypeScript
- React + Vite
- Fastify
- Zod
- built-in node:sqlite + plain SQL
- Vitest
- Biome
- OpenTelemetry
- SSE for the Inspector event stream
- WebSocket for server-mediated voice

The first general-purpose LLM adapter uses the OpenAI JS SDK behind an application port; the model ID remains configuration.

Provider/harness choices remain replaceable behind adapters.

## Build order

See [docs/07-implementation-plan.md](docs/07-implementation-plan.md).

The sequence deliberately proves one vertical slice at a time rather than building a generic harness or voice platform first.

## Agent instructions

Before coding, read:

- [AGENTS.md](AGENTS.md)
- [docs/README.md](docs/README.md)
- [docs/18-runtime-contracts.md](docs/18-runtime-contracts.md)
- the relevant normative docs, eval fixtures and research snapshots for the task.

For Jev work, also use/read the official TypeSafe agent skill.

Architectural decisions live under [docs/adr](docs/adr).
