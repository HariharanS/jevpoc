// Machine-readable actual E02 outputs, independently schema-checked by scripts/validate_repo.py.
import { readFileSync } from 'node:fs';
import { emptyState, applyBatch, scriptedMutations } from '../workspace/model.mjs';
const scenario = readFileSync(new URL('../../fixtures/scenarios.jsonl', import.meta.url), 'utf8')
  .trim().split('\n').map(JSON.parse).find(s => s.id === 'mixed-chunks-v2');
let state = emptyState(); const snapshots = []; const batches = [];
for (let i = 0; i < scenario.steps.length; i++) {
  const mutations = scriptedMutations(scenario, i, state);
  state = applyBatch(state, state.stateVersion, mutations, scenario.evidence, { atMs: scenario.evidence[i].receivedAtMs });
  batches.push(mutations); snapshots.push(state.events);
}
console.log(JSON.stringify({ snapshots, batches }));
