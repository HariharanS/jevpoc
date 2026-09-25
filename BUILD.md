# First application build assignment

Read AGENTS.md, STATUS.md, docs/PRODUCT.md, docs/PLAN.md and the task entry in tasks.json. The documentation adoption is complete; **do not repeat the review or create another pack**.

Implement **B00–B08 / M0–1 only**. Start from the current main branch. The existing prototypes are reference experiments, not the production application.

Outcome: a local React/Vite + Fastify + TypeScript + SQLite Live Intent Workspace with labelled scripted interpretation. It must replay both the six-chunk story and its pasted paragraph, producing four typed cards. Coke becomes water on the same hydration ID; happy and sad remain on one journal item; missing reminder time remains missing.

Read docs/RUNTIME.md and contracts/mvp.schema.json before implementation. UI work also reads docs/UI.md. Use fixtures/scenarios.jsonl and fixtures/acceptance.jsonl. Generated TypeScript comes from scripts/generate_types.py.

Required: pinned pnpm workspace/lockfile; pure core; runtime validation; immutable evidence; per-session ordering; version checks; atomic state/audit persistence; durable run acceptance; request dedupe; snapshot API; gap-free SSE replay; App-first UI; selected-card evidence; explicit field editing; cancellation; restart tests.

Default App view uses the warm, restrained visual direction. Processing and timeline appear only on demand. Do not implement the retired dashboard-first UI or treat decorative animation as real activity.

M1 uses ScriptedInterpreter and FakeDecisionEngine. Unknown text must be reported as unsupported/needs clarification. No real JEV, LLM, STT/TTS, microphone, external tool, memory engine, cloud or harness framework yet.

Required application commands after B00:

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
```

These commands are deliverables, not claims that the application already exists. Run the repository/prototype checks too. Update STATUS.md with actual commands, results, limitations and next task. Stop after B08; later providers require their own scoped assignment.
