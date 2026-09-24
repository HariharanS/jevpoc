# ADR 0001: Start local-first as a modular monolith

- Status: Accepted
- Date: 2026-09-24

## Context

The POC needs fast iteration, strong inspectability and a future path to cloud deployment. Premature cloud/distributed architecture would make agent-generated changes harder to reason about and test.

## Decision

Start with a local modular monolith:

- React web app,
- Fastify API,
- shared TypeScript core,
- SQLite,
- external AI APIs.

Keep external systems behind narrow ports.

## Consequences

Positive:

- simple local onboarding,
- cheap experiments,
- end-to-end debugging,
- straightforward AI-agent collaboration,
- deployment platform remains open.

Trade-off:

- a future scale requirement may require moving persistence or workloads out of process.

That migration is acceptable and should be driven by evidence.
