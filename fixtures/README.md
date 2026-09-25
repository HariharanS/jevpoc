# Current fixtures

scenarios.jsonl contains eight synthetic scenario proposals adopted from the review pack. They preserve the reviewed pack's business outcomes and exact source bindings. They are explicitly not human-reviewed ground truth and are not evidence of real model accuracy.

acceptance.jsonl contains 30 application acceptance specifications. Their status stays specified_not_executed until the real milestone code is tested. Passing the prototype cannot mark database/HTTP/voice tests complete.

Logical event IDs are test aliases. Compare meaningful final fields, item count, correction identity and provenance; do not assert incidental production UUIDs/timestamps. Changes to labels require rationale and review, not accommodation to the model.

E01 replays the mixed-chunks script only; E02 checks its reducer and rejection cases. Other scenarios are retained for B03/F02. No expected labels are sent to any provider. Original pre-consolidation fixtures remain at the immutable reviewed commit in docs/REVIEW.md; they are not another active schema.
