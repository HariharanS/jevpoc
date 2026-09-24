# AI-agent collaboration model

The repository itself is the durable collaboration surface.

## Persist these artifacts

Keep important decisions in version control:

- architecture docs,
- ADRs,
- interfaces/schemas,
- fixtures,
- eval datasets,
- implementation plans,
- test cases,
- known limitations,
- agent handoff notes in PRs.

Do not depend on one coding agent's chat history to explain the system.

## How agents should divide work

Prefer vertical or bounded slices:

- JEV adapter + contract tests,
- policy engine + tests,
- trace model + inspector API,
- UI trace panel,
- one demo use case,
- persistence adapter.

Avoid parallel agents editing the same foundational file unless necessary.

## Contract-first collaboration

Cross-cutting components communicate through small checked-in types.

Example:

```
core/
  decisions.ts
  policy.ts
  tools.ts
  traces.ts
  sessions.ts
```

An agent implementing an adapter should not need to understand the whole UI.

An agent implementing the UI should consume stable API/trace schemas rather than model-provider SDK objects.

## Handoff template

Each PR should contain:

```
Outcome:
What changed:

Key decisions:
- ...

Tests:
- ...

Known gaps:
- ...

Next useful task:
- ...
```

## ADR rule

Write an ADR when a decision is:

- difficult to reverse,
- affects multiple modules,
- changes deployment or persistence assumptions,
- establishes a durable architectural constraint.

Do not write ADRs for ordinary implementation choices.

## Evals are collaboration artifacts

When a classifier is tuned, check in:

- input fixture,
- expected label/outcome,
- relevant policy threshold,
- observed result.

This lets another agent improve behavior without reverse-engineering prompt history.
