/** E02: pure, in-memory experiment. NOT the production validator or persistence layer. */
export const copy = (value) => structuredClone(value);
export function emptyState() {
  return { sessionId: 'fixture-session', stateVersion: 0, events: [], history: [] };
}
const fieldsByType = {
  hydration: ['amountMl', 'drink', 'occurredOn'], task: ['title', 'location', 'time'],
  reminder: ['title', 'time'], journal: ['facts', 'expressedEmotions'], generic: ['summary'],
};
function require(condition, message) { if (!condition) throw new Error(message); }
function boundary(text, n) {
  return !(n > 0 && n < text.length && /[\uD800-\uDBFF]/.test(text[n - 1]) && /[\uDC00-\uDFFF]/.test(text[n]));
}
export function validateBindings(bindings, fields, evidence, sessionId) {
  require(Array.isArray(bindings), 'bindings_required');
  for (const binding of bindings) {
    require(binding.kind === 'text', 'prototype_text_evidence_only');
    require(Object.hasOwn(fields, binding.field), 'unknown_binding_field');
    const r = binding.ref;
    const source = evidence.find(e => e.inputId === r.inputId && e.revision === r.revision);
    require(source && source.sessionId === sessionId, 'missing_or_foreign_evidence');
    require(Number.isInteger(r.startUtf16) && Number.isInteger(r.endUtf16)
      && r.startUtf16 >= 0 && r.endUtf16 > r.startUtf16 && r.endUtf16 <= source.text.length,
    'invalid_evidence_range');
    require(boundary(source.text, r.startUtf16) && boundary(source.text, r.endUtf16), 'split_surrogate');
    require(source.text.slice(r.startUtf16, r.endUtf16) === r.quote, 'quote_mismatch');
  }
  for (const [field, value] of Object.entries(fields)) {
    if (value !== null && !(Array.isArray(value) && value.length === 0)) {
      require(bindings.some(b => b.field === field), 'unbound_field:' + field);
    }
  }
}
function validateFields(type, fields, partial = false) {
  const allowed = fieldsByType[type];
  require(allowed && fields && typeof fields === 'object' && !Array.isArray(fields), 'invalid_fields');
  const keys = Object.keys(fields);
  require(keys.length > 0 && keys.every(k => allowed.includes(k)), 'unknown_field');
  require(partial || allowed.every(k => keys.includes(k)), 'missing_field');
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'amountMl') require(value === null || (Number.isFinite(value) && value > 0), 'invalid_amount');
    else if (key === 'facts' || key === 'expressedEmotions') {
      require(Array.isArray(value) && value.every(x => typeof x === 'string' && x.trim()), 'invalid_array');
    } else if (key === 'time' && value !== null) {
      require(value && typeof value === 'object' && !Array.isArray(value), 'invalid_time');
      const names = ['sourceText', 'date', 'localTime', 'timeZone', 'resolvedInstant'];
      require(Object.keys(value).length === 5 && names.every(n => Object.hasOwn(value, n)), 'invalid_time_shape');
      require(typeof value.sourceText === 'string' && value.sourceText.length > 0, 'missing_time_source');
      require(value.localTime === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(value.localTime), 'invalid_local_time');
      // This experiment captures local time only. Real resolution needs the production temporal validator.
      require(value.date === null && value.resolvedInstant === null, 'prototype_does_not_schedule');
      require(value.timeZone === 'Australia/Sydney', 'prototype_timezone');
    } else {
      require(value === null || (typeof value === 'string' && value.trim().length > 0), 'invalid_text_field');
      if (key === 'occurredOn' && value !== null) require(/^\d{4}-\d{2}-\d{2}$/.test(value), 'invalid_date');
      if (key === 'summary') require(value !== null, 'missing_summary');
    }
  }
}
export function applyBatch(state, expectedStateVersion, mutations, evidence, options = {}) {
  require(!options.cancelled, 'cancelled');
  require(state.stateVersion === expectedStateVersion, 'stale_session');
  require(Array.isArray(mutations) && mutations.length > 0, 'empty_batch');
  const next = copy(state); // Commit only the completed copy. This is NOT a database transaction test.
  const atMs = options.atMs ?? 1790294400000;
  for (const mutation of mutations) {
    if (mutation.op === 'CREATE') {
      const event = copy(mutation.event);
      require(event.sessionId === state.sessionId, 'foreign_event');
      require(!next.events.some(e => e.id === event.id), 'duplicate_event');
      require(event.version === 1 && event.schemaVersion === 1 && event.status === 'draft', 'invalid_initial_event');
      validateFields(event.type, event.fields);
      validateBindings(event.bindings, event.fields, evidence, state.sessionId);
      next.events.push(event);
      next.history.push({ op: 'CREATE', eventId: event.id, version: 1, fields: copy(event.fields) });
    } else if (mutation.op === 'PATCH') {
      const event = next.events.find(e => e.id === mutation.eventId);
      require(event, 'missing_event');
      require(event.version === mutation.expectedEventVersion, 'stale_event');
      require(event.type === mutation.change.type, 'wrong_type');
      require(event.status === 'draft' || event.status === 'soft_committed', 'explicit_amendment_required');
      require(['correction', 'continuation', 'user_edit', 'asr_revision'].includes(mutation.reason), 'invalid_reason');
      validateFields(event.type, mutation.change.fields, true);
      validateBindings(mutation.bindings, mutation.change.fields, evidence, state.sessionId);
      const before = copy(event.fields);
      Object.assign(event.fields, copy(mutation.change.fields));
      validateFields(event.type, event.fields);
      const changed = Object.keys(mutation.change.fields);
      event.bindings = [...event.bindings.filter(b => !changed.includes(b.field)), ...copy(mutation.bindings)];
      event.version += 1;
      event.updatedAtMs = atMs;
      next.history.push({ op: 'PATCH', eventId: event.id, version: event.version,
        before, fields: copy(event.fields), reason: mutation.reason });
    } else throw new Error('unsupported_mutation');
  }
  next.stateVersion += 1;
  return next;
}
function binding(source, field, quote) {
  const startUtf16 = source.text.indexOf(quote);
  require(startUtf16 >= 0, 'script_source_mismatch');
  return { kind: 'text', field, ref: { inputId: source.inputId, revision: source.revision,
    startUtf16, endUtf16: startUtf16 + quote.length, quote } };
}
export function scriptedMutations(scenario, index, state) {
  require(scenario.id === 'mixed-chunks-v2', 'unsupported_script');
  require(Number.isInteger(index) && index >= 0 && index < 6, 'unsupported_step');
  const source = scenario.evidence[index];
  const b = (field, quote) => binding(source, field, quote);
  const create = (id, type, fields, bindings) => [{ op: 'CREATE', event: {
    schemaVersion: 1, id, sessionId: state.sessionId, type, status: 'draft', version: 1,
    fields, bindings, createdAtMs: source.receivedAtMs, updatedAtMs: source.receivedAtMs,
  } }];
  const patch = (eventId, type, fields, bindings, reason) => {
    const event = state.events.find(e => e.id === eventId);
    require(event, 'script_order');
    return [{ op: 'PATCH', eventId, expectedEventVersion: event.version,
      change: { type, fields }, bindings, reason }];
  };
  // Fixed, disclosed E01 script. No interpretation of arbitrary text; expectedEvents is never read.
  if (index === 0) return create('hydration-1', 'hydration',
    { amountMl: 200, drink: 'Coke', occurredOn: '2026-09-25' },
    [b('amountMl', '200 ml'), b('drink', 'Coke'), b('occurredOn', 'Today')]);
  if (index === 1) return patch('hydration-1', 'hydration', { drink: 'water' }, [b('drink', 'water')], 'correction');
  if (index === 2) return create('parcel-1', 'task', {
    title: 'Pick up my Australia Post parcel', location: 'Australia Post',
    time: { sourceText: '2pm', date: null, localTime: '14:00', timeZone: 'Australia/Sydney', resolvedInstant: null },
  }, [b('title', 'Pick up my Australia Post parcel'), b('location', 'Australia Post'), b('time', '2pm')]);
  if (index === 3) return create('reminder-1', 'reminder', { title: 'take my medicine', time: null }, [b('title', 'take my medicine')]);
  if (index === 4) return create('journal-1', 'journal', { facts: [source.text], expressedEmotions: ['happy'] },
    [b('facts', source.text), b('expressedEmotions', 'happy')]);
  const journal = state.events.find(e => e.id === 'journal-1');
  require(journal, 'script_order');
  return patch('journal-1', 'journal', { facts: [...journal.fields.facts, source.text],
    expressedEmotions: [...journal.fields.expressedEmotions, 'sad'] },
  [...journal.bindings, b('facts', source.text), b('expressedEmotions', 'sad')], 'continuation');
}
export function missingFields(event) {
  if (event.type === 'hydration') return ['amountMl', 'drink'].filter(f => event.fields[f] === null);
  if (event.type === 'task' || event.type === 'reminder') {
    const result = event.fields.title === null ? ['title'] : [];
    if (!event.fields.time?.localTime) result.push('time');
    if (!event.fields.time?.date) result.push('date');
    return result;
  }
  return [];
}
