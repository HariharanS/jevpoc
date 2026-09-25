# Repository working agreement

Read BUILD.md and STATUS.md first. Pick the next dependency-ready task from tasks.json; consult docs/PLAN.md for its deliverables and acceptance. Read only the relevant current contract, not every historical discussion.

## Authority

1. The user's current explicit assignment determines scope.
2. contracts/mvp.schema.json owns wire structure; docs/RUNTIME.md owns behavior; docs/PRODUCT.md and docs/UI.md own product interaction.
3. tasks.json owns dependencies/status; fixtures/acceptance.jsonl owns required tests.
4. docs/DECISIONS.md records rationale; docs/RESEARCH.md and docs/REVIEW.md are evidence, not extra implementation instructions.
5. prototypes/ is experimental executable evidence, never a substitute for the production contract.

Resolve contradictions in the canonical owner and associated tests in one change. Do not add another final-approach document or copy schemas into prose. Generated types are not independently editable. No provider SDK types in core.

Keep changes small and testable. No unexpected providers, paid calls, secrets, cloud resources, autonomous loops, plugin installations or new frameworks. Scripted behavior must remain labelled. Never send fixture expected labels to a real model. Never turn a probability, transcript finality or sealed card into authorization.

Before editing, state the task ID, outcome and expected paths. Avoid parallel edits to shared contracts. Preserve user changes. Run the applicable checks, update tasks.json and STATUS.md truthfully, and record unrun tests. A plan, generated schema or prototype is not a completed application milestone.

See docs/SAFETY.md for later tools, memory and deployment boundaries. Do not reactivate superseded instructions from Git history. The default implementation assignment stops at B08/M1.
