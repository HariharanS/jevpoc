import { emptyState, applyBatch, scriptedMutations, missingFields, copy } from './model.mjs';
const $ = id => document.getElementById(id);
let scenario; let state = emptyState(); let index = 0; let busy = false; let autoplay = false;
let playToken = 0; let generation = 0; let selectedId = null; let trigger = null; let follow = true;
const nodes = new Map();
const labels = { hydration: 'Hydration', task: 'Parcel pickup', reminder: 'Reminder', journal: 'Journal', generic: 'Note' };
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function message(text) { $('status').textContent = text; }
function controls() {
  $('play').disabled = !scenario || (busy && !autoplay) || (index >= 6 && !autoplay);
  $('play').textContent = autoplay ? 'Stop replay' : 'Replay story';
  $('step').disabled = !scenario || busy || autoplay || index >= 6;
  $('reset').disabled = !scenario;
  $('stale').disabled = busy || !state.events.some(e => e.type === 'hydration' && e.version > 1);
  $('progress').textContent = `${index} / 6 phrases`;
  document.body.classList.toggle('running', busy);
  $('input-status').textContent = busy ? 'Interpreting the script' : index === 6 ? 'All four items captured' : 'Ready to replay';
}
function cardValue(e) {
  if (e.type === 'hydration') return `${e.fields.amountMl ?? '?'} ml ${e.fields.drink}`;
  if (e.type === 'journal') return 'Dream car arrived';
  return e.fields.title ?? e.fields.summary ?? 'Needs a title';
}
function render() {
  $('count').textContent = `${state.events.length} ${state.events.length === 1 ? 'item' : 'items'}`;
  $('empty').hidden = state.events.length > 0;
  for (const event of state.events) {
    let node = nodes.get(event.id);
    if (!node) {
      node = document.createElement('button'); node.className = 'card'; node.dataset.eventId = event.id;
      for (const name of ['kind', 'value', 'note', 'badge']) {
        const span = document.createElement('span'); span.className = `card-${name}`; node.append(span);
      }
      node.addEventListener('click', () => openExplanation(event.id, node));
      nodes.set(event.id, node); $('cards').append(node);
    }
    const changed = node.dataset.version !== String(event.version);
    node.dataset.version = String(event.version);
    node.querySelector('.card-kind').textContent = labels[event.type];
    node.querySelector('.card-value').textContent = cardValue(event);
    const needs = missingFields(event);
    node.classList.toggle('needs', needs.length > 0);
    node.querySelector('.card-note').textContent = event.type === 'journal' ? event.fields.expressedEmotions.join(' + ')
      : event.type === 'task' ? '2:00 PM · date not supplied' : event.type === 'hydration' ? 'Same item. Same 200 ml.' : 'Captured, not scheduled.';
    node.querySelector('.card-badge').textContent = needs.length ? `Needs ${needs.join(' + ')}`
      : event.version > 1 ? event.type === 'hydration' ? 'Coke → water · corrected' : 'Updated in place' : 'Draft · captured';
    if (changed) { node.classList.remove('changed'); void node.offsetWidth; node.classList.add('changed'); }
  }
  if ($('explanation').open) explain();
  controls();
}
function log(text) { const row = document.createElement('li'); row.textContent = text; $('timeline').append(row); }
function openExplanation(id, source) {
  selectedId = id; trigger = source; explain(); $('explanation').showModal(); $('close').focus();
}
function section(title, lines, quoted = false) {
  const s = document.createElement('section'); s.className = 'explain-section';
  const h = document.createElement('h3'); h.textContent = title; s.append(h);
  for (const text of lines) { const p = document.createElement('p'); p.textContent = text; if (quoted) p.className = 'quote'; s.append(p); }
  return s;
}
function explain() {
  const event = state.events.find(e => e.id === selectedId); if (!event) return;
  const body = $('explanation-body'); body.replaceChildren();
  body.append(section('SELECTED ITEM', [`${labels[event.type]} · ${event.id} · version ${event.version}`, cardValue(event)]));
  const seen = new Set(); const quotes = [];
  for (const binding of event.bindings) {
    const r = binding.ref; const key = `${r.inputId}:${r.revision}:${r.startUtf16}:${r.endUtf16}`;
    if (seen.has(key)) continue; seen.add(key);
    quotes.push(`“${r.quote}” — ${r.inputId}, r${r.revision}, UTF-16 ${r.startUtf16}–${r.endUtf16}`);
  }
  body.append(section('SOURCE EVIDENCE', quotes, true));
  const history = state.history.filter(h => h.eventId === event.id);
  body.append(section('HISTORY', history.map(h => h.op === 'PATCH'
    ? `${h.reason} · v${h.version}: ${JSON.stringify(h.before)} → ${JSON.stringify(h.fields)}` : `Created · v${h.version}`)));
  const missing = missingFields(event);
  body.append(section('NEEDS', [missing.length ? missing.join(' and ') : 'Nothing for this captured item. No external action was executed.']));
}
$('close').onclick = () => $('explanation').close();
$('explanation').addEventListener('close', () => trigger?.focus());
$('transcript').addEventListener('wheel', () => { follow = false; $('jump').hidden = false; }, { passive: true });
$('transcript').addEventListener('keydown', e => {
  if (['ArrowUp', 'PageUp', 'Home'].includes(e.key)) { follow = false; $('jump').hidden = false; }
});
$('jump').onclick = () => { follow = true; $('transcript').scrollTop = $('transcript').scrollHeight; $('jump').hidden = true; };
async function next() {
  if (busy || index >= 6) return;
  const epoch = generation; busy = true; controls();
  $('transcript-empty')?.remove();
  $('transcript').querySelectorAll('.latest').forEach(n => n.classList.remove('latest'));
  const line = document.createElement('p'); line.className = 'latest pending'; line.textContent = scenario.evidence[index].text;
  line.dataset.step = String(index); $('transcript').append(line);
  if (follow) $('transcript').scrollTop = $('transcript').scrollHeight;
  message('Simulated interpretation; no AI request.');
  await delay(500);
  if (epoch !== generation) return;
  try {
    const mutations = scriptedMutations(scenario, index, state);
    state = applyBatch(state, state.stateVersion, mutations, scenario.evidence, { atMs: scenario.evidence[index].receivedAtMs });
    line.classList.remove('pending');
    if (index === 1) $('transcript').querySelector('[data-step="0"]').classList.add('superseded');
    log(`SCRIPTED · state v${state.stateVersion} · ${mutations[0].op} ${mutations[0].event?.id ?? mutations[0].eventId}`);
    index += 1;
    message(index === 6 ? 'Four items captured. Select a card to inspect its source.' : 'Captured locally in memory. You can keep going.');
  } catch (error) { autoplay = false; message(`Prototype error: ${error.message}`); }
  busy = false; render();
}
$('step').onclick = next;
$('play').onclick = async () => {
  if (autoplay) { autoplay = false; playToken += 1; controls(); return; }
  autoplay = true; controls();
  const token = ++playToken; const epoch = generation;
  while (autoplay && index < 6 && epoch === generation && token === playToken) { await next(); await delay(350); }
  if (epoch === generation && token === playToken) { autoplay = false; controls(); }
};
$('reset').onclick = () => {
  generation += 1; playToken += 1; autoplay = false; busy = false; index = 0; state = emptyState(); selectedId = null; follow = true;
  if ($('explanation').open) $('explanation').close();
  $('cards').replaceChildren(); nodes.clear(); $('transcript').replaceChildren(); $('timeline').replaceChildren(); $('jump').hidden = true;
  message('Reset to a new in-memory demonstration.'); render();
};
$('stale').onclick = () => {
  const before = copy(state);
  try { applyBatch(state, state.stateVersion - 1, scriptedMutations(scenario, 1, state), scenario.evidence); message('Unexpected acceptance; review the experiment.'); }
  catch (error) { log(`REJECTED · ${error.message} · no card changed`); message('Stale update rejected. Water stays water; the card is unchanged.'); }
  if (JSON.stringify(before) !== JSON.stringify(state)) message('Unexpected state mutation; test failed.');
};
try {
  const response = await fetch('/fixtures/scenarios.jsonl');
  if (!response.ok) throw new Error(`Fixture HTTP ${response.status}`);
  scenario = (await response.text()).trim().split('\n').map(JSON.parse).find(s => s.id === 'mixed-chunks-v2');
  if (!scenario) throw new Error('Golden fixture missing');
  message('Ready. Replay the story or advance one phrase at a time.'); render();
} catch (error) { message(`Could not load prototype: ${error.message}. Start it with python scripts/serve.py.`); }
