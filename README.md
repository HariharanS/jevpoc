# JEV POC — Live Intent Workspace

Speak or type naturally. Useful cards appear. Corrections update the same card.

**Current state:** canonical build specification plus two executable, scripted prototypes. The production React/Fastify/SQLite application and real AI/voice integrations are **not implemented**. See [STATUS.md](STATUS.md) for actual results and the next task.

## Start here

- **Coding agent:** [BUILD.md](BUILD.md), then [AGENTS.md](AGENTS.md).
- **Product:** [docs/PRODUCT.md](docs/PRODUCT.md) and [docs/UI.md](docs/UI.md).
- **Implementation:** [docs/RUNTIME.md](docs/RUNTIME.md), [contracts/mvp.schema.json](contracts/mvp.schema.json), [docs/PLAN.md](docs/PLAN.md), and [tasks.json](tasks.json).
- **Experiments:** [docs/EXPERIMENTS.md](docs/EXPERIMENTS.md).
- **Why the docs changed:** [docs/REVIEW.md](docs/REVIEW.md).

## Try the prototype

```bash
python scripts/serve.py
```

Open the localhost URL printed by the server. No install, microphone permission, API key, account, network AI call or cloud is required. This is an explicitly **scripted interaction prototype**, not working language understanding. Replay the mixed-intent story, step through it, inspect a correction, and test a rejected stale update.

```bash
node --test prototypes/runtime/model.test.mjs
python -m pip install -r requirements.txt
python scripts/validate_repo.py
```

See [prototypes/README.md](prototypes/README.md) and [docs/VALIDATION.md](docs/VALIDATION.md) for scope and results.

## One source of truth

The current tree contains only the current specification, fixtures, source references and labelled experiments. Superseded numbered documents, duplicate handoffs and old SVG concepts were removed from the active tree; Git history preserves them. There is no archive of competing normative instructions to read before coding.

The application/harness owns orchestration, state, policy, authorization and execution. JEV is one bounded decision component; it is not the whole system. Start local and keep provider adapters narrow. Do not build a general agent framework.
