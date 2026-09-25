import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { emptyState, applyBatch, scriptedMutations, missingFields, copy, validateBindings } from '../workspace/model.mjs';
const fixtures = readFileSync(new URL('../../fixtures/scenarios.jsonl', import.meta.url), 'utf8').trim().split('\n').map(JSON.parse);
const scenario = fixtures.find(s => s.id === 'mixed-chunks-v2');
function step(state, n) { return applyBatch(state, state.stateVersion, scriptedMutations(scenario, n, state), scenario.evidence); }
function replay() { let s = emptyState(); for (let n = 0; n < 6; n++) s = step(s, n); return s; }

test('six steps produce four correct cards from explicit scripts, not expectedEvents', () => {
  const state = replay();
  assert.equal(state.events.length, 4);
  for (const expected of scenario.expectedEvents) {
    const actual = state.events.find(e => e.id === expected.id);
    assert.deepEqual(actual.fields, expected.fields);
    assert.equal(actual.version, expected.version);
  }
});
test('correction preserves ID, amount and the old immutable snapshot', () => {
  const old = step(emptyState(), 0); const saved = copy(old); const next = step(old, 1);
  assert.deepEqual(old, saved);
  assert.equal(next.events[0].id, old.events[0].id);
  assert.equal(next.events[0].fields.amountMl, 200);
  assert.equal(next.events[0].fields.drink, 'water');
  assert.equal(next.history[1].before.drink, 'Coke');
});
test('stale session result is rejected', () => {
  const s = step(emptyState(), 0);
  assert.throws(() => applyBatch(s, 0, scriptedMutations(scenario, 1, s), scenario.evidence), /stale_session/);
});
test('stale event version is rejected independently of session version', () => {
  const s = step(emptyState(), 0); const mutation = scriptedMutations(scenario, 1, s);
  mutation[0].expectedEventVersion = 9;
  assert.throws(() => applyBatch(s, s.stateVersion, mutation, scenario.evidence), /stale_event/);
});
test('invalid second mutation cannot partially commit first', () => {
  const s = emptyState(); const before = copy(s); const first = scriptedMutations(scenario, 0, s);
  assert.throws(() => applyBatch(s, 0, [...first, ...first], scenario.evidence), /duplicate_event/);
  assert.deepEqual(s, before);
});
test('one valid multi-create batch increments state version once', () => {
  const s = emptyState();
  const result = applyBatch(s, 0, [...scriptedMutations(scenario, 0, s), ...scriptedMutations(scenario, 2, s)], scenario.evidence);
  assert.equal(result.stateVersion, 1); assert.equal(result.events.length, 2);
});
test('cross-domain field is rejected', () => {
  const s = step(emptyState(), 0); const m = scriptedMutations(scenario, 1, s); m[0].change.fields.title = 'wrong';
  assert.throws(() => applyBatch(s, 1, m, scenario.evidence), /unknown_field/);
});
test('non-finite or negative amounts are rejected', () => {
  for (const value of [-1, NaN, Infinity]) {
    const m = scriptedMutations(scenario, 0, emptyState()); m[0].event.fields.amountMl = value;
    assert.throws(() => applyBatch(emptyState(), 0, m, scenario.evidence), /invalid_amount/);
  }
});
test('unbound non-null value is rejected', () => {
  const m = scriptedMutations(scenario, 0, emptyState()); m[0].event.bindings = [];
  assert.throws(() => applyBatch(emptyState(), 0, m, scenario.evidence), /unbound_field/);
});
test('incorrect quote is rejected', () => {
  const m = scriptedMutations(scenario, 0, emptyState()); m[0].event.bindings[0].ref.quote = '900 ml';
  assert.throws(() => applyBatch(emptyState(), 0, m, scenario.evidence), /quote_mismatch/);
});
test('foreign-session evidence and event are rejected', () => {
  const m = scriptedMutations(scenario, 0, emptyState()); const evidence = copy(scenario.evidence);
  evidence[0].sessionId = 'another-session';
  assert.throws(() => applyBatch(emptyState(), 0, m, evidence), /foreign_evidence/);
  m[0].event.sessionId = 'another-session';
  assert.throws(() => applyBatch(emptyState(), 0, m, scenario.evidence), /foreign_event/);
});
test('UTF-16 references account for emoji and reject split surrogate pairs', () => {
  const emoji = fixtures.find(s => s.id === 'emoji-correction-v2');
  validateBindings(emoji.expectedEvents[0].bindings, emoji.expectedEvents[0].fields, emoji.evidence, 'fixture-session');
  const ref = { inputId: emoji.evidence[0].inputId, revision: 1, startUtf16: 0, endUtf16: 1, quote: '\ud83e' };
  assert.throws(() => validateBindings([{ kind: 'text', field: 'drink', ref }], { drink: 'x' }, emoji.evidence, 'fixture-session'), /split_surrogate/);
});
test('cancellation prevents a late in-memory commit', () => {
  const s = step(emptyState(), 0);
  assert.throws(() => applyBatch(s, 1, scriptedMutations(scenario, 1, s), scenario.evidence, { cancelled: true }), /cancelled/);
  assert.equal(s.events[0].fields.drink, 'Coke');
});
test('journal continuation keeps both feelings and all facts', () => {
  const journal = replay().events.find(e => e.type === 'journal');
  assert.deepEqual(journal.fields.expressedEmotions, ['happy', 'sad']);
  assert.equal(journal.fields.facts.length, 2);
});
test('needs information is specific to the selected card, never a promise to schedule', () => {
  const s = replay();
  assert.deepEqual(missingFields(s.events[0]), []);
  assert.deepEqual(missingFields(s.events[1]), ['date']);
  assert.deepEqual(missingFields(s.events[2]), ['time', 'date']);
});
test('unsupported scripts and empty batches are explicit errors', () => {
  assert.throws(() => scriptedMutations({ id: 'arbitrary-text' }, 0, emptyState()), /unsupported_script/);
  assert.throws(() => applyBatch(emptyState(), 0, [], []), /empty_batch/);
});
