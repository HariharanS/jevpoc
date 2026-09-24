# JEV POC

A local-first reference application for exploring **JEV as a fast decision plane around an AI agent**.

The project deliberately starts small: deterministic application code owns state and actions, JEV makes typed probabilistic decisions, and an LLM is used only where open-ended reasoning or generation is actually needed.

The detailed architecture and implementation plan are being developed under `docs/`.

## Engineering posture

- Local first; cloud deployable later.
- Modular monolith before distributed systems.
- Standard web UI before agent-UI frameworks.
- Ports/adapters around JEV, LLM, voice, tools and persistence.
- Observable by default, but no heavyweight observability platform required locally.
- Human approval is explicit for consequential actions.
- Prefer boring, testable code over abstractions invented for hypothetical scale.
