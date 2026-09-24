# JEV POC

A local-first reference application for exploring **JEV as a fast decision plane around an AI agent**.

The project deliberately starts small: deterministic application code owns state and actions, JEV makes typed probabilistic decisions, and an LLM is used only where open-ended reasoning or generation is actually needed.

## Final approach

```
user / voice
     |
     v
application orchestrator
     |
     +--> JEV: fast typed decisions
     |       |
     |       v
     |   deterministic policy
     |
     +--> LLM: only for open-ended reasoning/generation
     |
     +--> tools: validated + approval-aware execution
     |
     +--> trace: every meaningful decision is inspectable
     |
     +--> session / retro / memory signal classification
```

The important separation is:

**JEV signals -> application policy -> execution**

A model probability is not itself an authorization or business action.

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
9. [Agent working agreement](AGENTS.md)

Architectural decisions live in [docs/adr](docs/adr).

## Engineering posture

- Local first; cloud deployable later.
- Modular monolith before distributed systems.
- Standard React UI before agent-UI frameworks.
- Ports/adapters around JEV, LLM, voice, tools and persistence.
- Observable by default, without requiring a hosted observability platform locally.
- Human approval is explicit for consequential actions.
- Prefer boring, testable code over abstractions invented for hypothetical scale.

## Initial technology direction

- TypeScript / Node.js
- React + Vite
- Fastify
- SQLite
- Zod
- Vitest
- OpenTelemetry
- SSE for the live inspector

These are starting choices rather than permanent platform commitments.

## Build order

The implementation plan deliberately starts with a walking skeleton and fake decision engine, then introduces real JEV, LLM escalation, one safe tool, session-signal classification, voice, and finally cloud deployment.

Do not start by building a generic harness framework.
