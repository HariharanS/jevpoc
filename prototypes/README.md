# Executable experiments, not the application

## E01 — warm intent workspace

```bash
python scripts/serve.py
```

Open the printed loopback URL. A fixed six-phrase story creates four cards; water corrects Coke in place; happy and sad remain one journal; the reminder keeps its missing time. Select a card for exact evidence/history, expose Developer details for prototype mutations, or try a stale update.

No microphone, AI SDK, provider, scheduling, account, cloud or durable storage is connected. The page loads the checked-in scenario, but its shared model generates explicit scripted mutations rather than rendering expectedEvents. Refresh loses browser state. Arbitrary text input, direct card editing and full paragraph interpretation belong to the application build, not this experiment.

The design is a functional taste reference: warm brown, monospaced evidence, listening bars and a small pending marker. It is not a pixel-perfect approved production screen. App-first hierarchy and stable card identity are the important contracts.

## E02 — state and race probe

```bash
node --test prototypes/runtime/model.test.mjs
python -m pip install -r requirements.txt
python scripts/validate_repo.py
```

16 in-memory tests cover four final cards, immutable old state, same-ID correction, session/event version fences, all-or-nothing batches, unknown fields, invalid values/evidence, foreign sessions, UTF-16 emoji boundaries, cancellation, mixed feelings and card-specific missing information.

The validation script independently checks actual reducer events/mutations against the canonical schema. The small prototype validator is deliberately not the production validator. These tests do not prove SQLite transactions, HTTP, SSE, crash recovery or real concurrent processes.

## Browser smoke checks

Optional dependencies for the browser test (not needed to run the prototype):

```bash
python -m pip install playwright==1.57.0
python -m playwright install chromium
python scripts/browser_smoke.py
```

The test starts/stops its own allowlisted localhost server and checks 1440/768/360px interaction, stable DOM nodes, keyboard explanation/focus, stale rejection, reset while pending, reduced motion and horizontal overflow. It also checks unlisted paths and an untrusted Host.

For environments whose managed browser prohibits all network navigation, `python scripts/browser_smoke.py --inline` runs a disclosed injected-DOM variant. This variant does not test browser network loading/module resolution/CSP, although the HTTP server checks still run separately. Do not label it a served-browser end-to-end pass.

See [../docs/VALIDATION.md](../docs/VALIDATION.md) for executed results and [../docs/EXPERIMENTS.md](../docs/EXPERIMENTS.md) for later POCs. Do not copy prototype browser state ownership into the server-authoritative production application.
