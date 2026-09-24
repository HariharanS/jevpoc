# ADR 0002: Use JEV as a decision plane, not as the agent

- Status: Accepted
- Date: 2026-09-24

## Context

JEV is designed for fast typed probabilistic decisions rather than natural-language generation. The system also needs open-ended reasoning, tools, state and policies.

## Decision

Use JEV for classification and control signals around the agent loop.

Examples:

- intent,
- completeness,
- model routing,
- action risk,
- approval,
- completion,
- retry/replan,
- session/memory signal classification.

Use an LLM for open-ended reasoning/generation.

Deterministic application policy interprets JEV outputs and owns consequential actions.

## Consequences

- the harness becomes more observable,
- many decisions can avoid an LLM call,
- classifier calibration becomes a first-class concern,
- JEV failure must have explicit fallback behavior,
- JEV confidence is never treated as authorization by itself.
