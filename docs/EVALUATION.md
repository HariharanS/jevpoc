# Evaluation contract

The architecture is a hypothesis. Scripted fixture success proves neither semantic accuracy nor model superiority. A runnable prototype is not a production benchmark.

## Matched experiment

Run the same evidence, initial state, candidate policy, output schemas and deterministic action rules through:

| Input timing | JEV-based path | Structured-output LLM path |
|---|---|---|
| Final only | Required | Required |
| Hybrid checkpoints | Required | Required |

Separate model effects from scheduler effects. Do not compare early-streaming JEV with final-only LLM and attribute all latency improvement to JEV. Count any extraction component on each path. Neither path is allowed weaker safety/state validation.

For each run record source commit, fixture hash, reviewed-label status, model/provider/SDK, question/prompt version, threshold config, region where known, timing boundaries, retries/fallback, tokens/audio duration, parse failures and total estimated cost. Pricing is a versioned dated source record captured when the experiment runs, not a copied current-price claim in architecture prose.

## Metrics

Decision: relation/target accuracy, abstention, calibration and severity-weighted errors. State: final event fields, same-ID correction, duplicate creation, missed intent, provenance accuracy, draft/missing-field correctness. Runtime: first useful state, correction-to-visible-patch, p50/p95, checkpoint/call counts, cancellation, stale commits and UI churn. Cost: all decisions, extraction, reasoning, STT/TTS, retries and fallback.

Report total quality and coverage together. A system that abstains on difficult inputs must not look better merely because success is computed only on handled cases. Repeated runs expose variance. Separate calibration/development fixtures from a held-out set; do not relabel expected outcomes to make the model pass.

## Fixtures and thresholds

The eight consolidated scenarios are synthetic proposals, not human-reviewed ground truth. Preserve that label. The 30 acceptance cases are specifications; run them against actual code at their stated milestone. Original 15 decision examples are preserved in pinned Git history referenced by REVIEW.md; they are not a second active fixture contract.

Before model quality claims, curate at least 50 reviewed decisions, including at least 10 explicit corrections, 10 continuation/new-intent boundaries and 10 incomplete/unclear cases. Add long unsplit paragraphs, negation, ambiguous targets, names, number/unit variants, unsupported domains, malformed providers and revised segments. Split related paraphrases together to avoid train/test leakage.

Starting engineering hypotheses, not release claims: correction target/identity ≥95%; relation accuracy ≥90%; final scenario success ≥90%; duplicate rate ≤5%; bounded checkpoint LLM avoidance ≥50%. Compare quality before discussing speed/cost. The earlier relative targets (latency ≤60% and cost ≤25% of baseline) remain hypotheses only, measured on equivalent work. Small samples cannot support production reliability claims.

Thresholds live in one versioned policy module with motivating tests and false-positive/negative tradeoffs. Exact facts already known to code use deterministic checks. No universal 0.5 authorization threshold.

## Experiment report

Use a small dated report under docs/results only when an experiment actually runs. Include hypothesis, setup/versions, data/label source, commands, raw artifact paths, failures, metrics with sample counts, interpretation, limitations, decision and next task. A planned report is not evidence. Do not create empty reports for every future candidate.
