# Eval fixtures

These fixtures are part of the product contract, not disposable prompt examples.

Read docs/19-first-demo-and-evaluation.md before changing them.

## Files

- voice-semantic-update.jsonl — new/continuation/correction/cancel/aside/unclear checkpoint decisions.
- pre-turn-routing.jsonl — deterministic vs LLM vs wait routing.

## Rules

- One JSON object per line.
- expected describes the business outcome, not necessarily the exact raw model response.
- Do not change expected labels merely to make a model pass.
- If a case is genuinely ambiguous, say so in notes and add an acceptable set.
- When question wording changes materially, bump the question-set version and rerun the old fixtures before replacing them.

The initial seed set is deliberately small. Milestone 2 should grow it to at least 50 reviewed decision fixtures before reporting benchmark results.
