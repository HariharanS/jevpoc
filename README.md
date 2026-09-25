# JEV POC

A local-first reference application for exploring **JEV as a fast decision plane around an AI agent**.

The project deliberately starts small: deterministic application code owns state and actions, JEV makes typed probabilistic decisions, and an LLM is used only where open-ended reasoning or generation is actually needed.

Voice is a first-class path. The design supports both a revision-aware STT/control-first pipeline and native realtime speech-to-speech providers without giving provider SDKs ownership of application policy or consequential tool execution.

## Final approach

```
text --------------------------+
                               |
voice -> Voice Gateway         |
          |                    |
          +-> Transcript Ledger+
                               v
                    application orchestrator
                               |
             +-----------------+------------------+
             |                 |                  |
             v                 v                  v
            JEV              optional LLM       Tool Gateway
             |                                    |
             v                                    v
      deterministic policy               validate / approve / execute
             |
             +--> state / memory / trace
```

The important separation is:

**evidence -> JEV signals -> application policy -> execution**

For voice specifically:

**audio -> revisable transcript/events -> semantic checkpoint -> JEV -> policy**

A transcript becoming "final" is not itself authorization to execute an action.

## Start here

For humans and coding agents:

1. [Product intent](docs/00-product-intent.md)
2. [System design](docs/01-system-design.md)
3. [Technical design](docs/02-technical-design.md)
4. [JEV decision model](docs/03-jev-decision-model.md)
5. [Observability / inspector](docs/04-observability.md)
6. [Local-to-cloud evolution](docs/05-local-to-cloud.md)
7. [AI-agent collaboration](docs/06-agent-collaboration.md)
8. [Implementation plan](docs/07-implementation-plan.md)
9. [Voice architecture](docs/08-voice-architecture.md)
10. [Agent working agreement](AGENTS.md)

Architectural decisions live in [docs/adr](docs/adr).

## Voice modes

The repo explicitly supports two different control models.

### STT/control-first

Use streaming speech-to-text, preserve partial/revised/final hypotheses in a Transcript Ledger, invoke JEV at semantic checkpoints, and keep execution behind deterministic commit rules.

This is the first voice mode to build because it makes the JEV value visible.

### Native realtime speech-to-speech

Use a provider such as OpenAI Realtime, Gemini Live or xAI/Grok Voice for the low-latency conversational loop.

In this mode the voice model may hear audio before JEV receives a transcript, so JEV is not a pre-model filter. Application control remains at the Tool Gateway, approvals, durable state mutation and persistence boundaries.

See [docs/08-voice-architecture.md](docs/08-voice-architecture.md) and [ADR 0004](docs/adr/0004-voice-control-plane.md).

## Engineering posture

- Local first; cloud deployable later.
- Modular monolith before distributed systems.
- Standard React UI before agent-UI frameworks.
- Ports/adapters around JEV, LLM, voice, tools and persistence.
- Preserve transcript revisions instead of flattening voice into one final string.
- Do not run the full agent loop for every speech partial.
- Consequential actions always pass through application policy/tool gating.
- Observable by default, without requiring a hosted observability platform locally.
- Human approval is explicit for consequential actions.
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
- SSE for the live inspector

These are starting choices rather than permanent platform commitments.

## Build order

The implementation plan deliberately starts with a walking skeleton and fake decision engine, then introduces real JEV, LLM escalation, one safe tool, session-signal classification, control-first voice, correction/commit semantics, interruption, native realtime voice comparison, and finally cloud deployment.

Do not start by building a generic harness framework or a generic voice-provider framework.
