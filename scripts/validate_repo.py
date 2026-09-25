"""Check contracts, fixtures, generated types, prototype output and repository references.
--contracts-only explicitly skips task/document checks. No live provider or application claims.
"""
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import copy
import json
import math
import re
import shutil
import subprocess
import sys
import jsonschema

ROOT = Path(__file__).resolve().parents[1]

def require(ok, message):
    if not ok:
        raise AssertionError(message)

def reject_constant(value):
    raise ValueError('Non-standard JSON constant: ' + value)

def load(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'), parse_constant=reject_constant)

def rows(path):
    return [json.loads(x, parse_constant=reject_constant) for x in (ROOT / path).read_text(encoding='utf-8').splitlines() if x.strip()]

def finite(value):
    if isinstance(value, float):
        require(math.isfinite(value), 'Non-finite number')
    elif isinstance(value, dict):
        for item in value.values():
            finite(item)
    elif isinstance(value, list):
        for item in value:
            finite(item)

schema = load('contracts/mvp.schema.json')
jsonschema.Draft202012Validator.check_schema(schema)

def validate(name, value):
    finite(value)
    spec = {'$schema': schema['$schema'], '$ref': '#/$defs/' + name, '$defs': schema['$defs']}
    jsonschema.Draft202012Validator(spec, format_checker=jsonschema.FormatChecker()).validate(value)

scenarios = rows('fixtures/scenarios.jsonl')
require(len({s['id'] for s in scenarios}) == len(scenarios), 'Duplicate scenario')
spans = requests = events = 0
for s in scenarios:
    require(s['reviewStatus'] == 'proposed_synthetic_not_human_reviewed', 'Unreviewed synthetic labels must remain explicit')
    validate('CreateSessionRequest', s['session'])
    ZoneInfo(s['session']['timeZone'])
    evidence = {(e['inputId'], e['revision']): e for e in s['evidence']}
    require(len(evidence) == len(s['evidence']), 'Duplicate evidence key')
    anchor = int(datetime.fromisoformat(s['clockAnchor']).timestamp() * 1000)
    for e in s['evidence']:
        validate('InputEvidence', e)
        require(e['receivedAtMs'] >= anchor, 'Evidence before fixture clock')
    for step in s['steps']:
        validate('CreateRunRequest', step['request'])
        require(any(e['inputId'] == step['evidenceId'] for e in s['evidence']), 'Missing step evidence')
        requests += 1
    require(len({e['id'] for e in s['expectedEvents']}) == len(s['expectedEvents']), 'Duplicate event alias')
    for e in s['expectedEvents']:
        validate('SemanticEvent', e)
        events += 1
        for b in e['bindings']:
            require(b['field'] in e['fields'], 'Binding field missing')
            if b['kind'] != 'text':
                continue
            ref = b['ref']
            source = evidence[(ref['inputId'], ref['revision'])]
            require(source['sessionId'] == e['sessionId'], 'Foreign evidence')
            raw = source['text'].encode('utf-16-le')
            a, z = ref['startUtf16'], ref['endUtf16']
            require(0 <= a < z <= len(raw) // 2, 'Invalid UTF-16 range')
            require(raw[2*a:2*z].decode('utf-16-le') == ref['quote'], 'Quote mismatch or split surrogate')
            spans += 1
by_scenario = {s['id']: s for s in scenarios}
def fields(s):
    return [(e['type'], e['fields']) for e in s['expectedEvents']]
require(fields(by_scenario['mixed-chunks-v2']) == fields(by_scenario['mixed-paragraph-v2']), 'Golden fixture outcomes disagree')
print(f'PASS schema/fixtures: {len(scenarios)} scenarios, {requests} requests, {events} expected events, {spans} exact source spans')

valid_response = {'model': 'fake', 'answers': {
    'relation': {'type': 'choice', 'choice': 'correction', 'probabilities': {'correction': .9, 'new_event': .1}, 'confidence': .8},
    'complete': {'type': 'noul', 'noul': .9},
    'stability': {'type': 'score', 'score': .75, 'legend': {'0': 'unstable', '1': 'stable'}, 'probabilities': {'0': .25, '1': .75}, 'confidence': .5}},
    'usage': {'inputTokens': 0, 'outputTokens': 0}, 'latencyMs': 0}
def answer_relations(response):
    validate('DecisionResponse', response)
    for key, answer in response['answers'].items():
        if answer['type'] in ('choice', 'score'):
            require(abs(sum(answer['probabilities'].values()) - 1) <= .001, 'Invalid distribution sum')
        if answer['type'] == 'choice':
            require(set(answer['probabilities']) == {'correction', 'new_event'} and answer['choice'] in answer['probabilities'], 'Invalid choice membership')
        if answer['type'] == 'score':
            require(set(answer['legend']) == set(answer['probabilities']) == {'0', '1'} and 0 <= answer['score'] <= 1, 'Invalid score rubric')
answer_relations(valid_response)
negatives = []
for key, value in [('amountMl', -1), ('quantityMl', 200), ('time', '14:00')]:
    e = copy.deepcopy(scenarios[0]['expectedEvents'][0]); e['fields'][key] = value
    negatives.append(('SemanticEvent', e))
e = copy.deepcopy(scenarios[0]['expectedEvents'][0]); e['version'] = 0
negatives.append(('SemanticEvent', e))
negatives += [
    ('DecisionAnswer', {'type': 'noul', 'noul': 1.5}),
    ('DecisionAnswer', {'type': 'noul', 'noul': .8, 'confidence': .9}),
    ('DecisionAnswer', {'type': 'choice', 'choice': 'x', 'probabilities': {}, 'confidence': .5}),
    ('EventChange', {'type': 'task', 'fields': {}}),
    ('TemporalValue', {'sourceText': 'time', 'date': None, 'localTime': '25:00', 'timeZone': 'Australia/Sydney', 'resolvedInstant': None}),
    ('CreateRunRequest', {'requestId': 'a', 'input': {'kind': 'text'}}),
    ('DecisionRequest', {'state': True, 'questions': {'q': {'type': 'noul', 'instructions': 'Enough?'}}, 'model': 'fake'})]
for name, value in negatives:
    try:
        validate(name, value)
    except (jsonschema.ValidationError, AssertionError):
        continue
    raise AssertionError('Malformed payload accepted: ' + name)
for variant in ('unknown_choice', 'wrong_sum', 'wrong_score'):
    bad = copy.deepcopy(valid_response)
    if variant == 'unknown_choice':
        bad['answers']['relation']['choice'] = 'other'
    elif variant == 'wrong_sum':
        bad['answers']['relation']['probabilities']['correction'] = .5
    else:
        bad['answers']['stability']['score'] = 4
    try:
        answer_relations(bad)
    except (jsonschema.ValidationError, AssertionError):
        continue
    raise AssertionError('Malformed relationship accepted: ' + variant)
print('PASS 14 negative contract cases; fractional Score accepted (not a live SDK test)')

subprocess.run([sys.executable, str(ROOT / 'scripts/generate_types.py'), '--check'], check=True)
tsc = shutil.which('tsc')
if '--require-tsc' in sys.argv:
    require(tsc, 'tsc required; install the pinned validation toolchain')
if tsc:
    subprocess.run([tsc, '-p', str(ROOT / 'contracts/tsconfig.json')], check=True)
    print('PASS generated types and strict TypeScript compilation')
else:
    print('NOT RUN TypeScript compiler; generator equality passed')
node = shutil.which('node')
require(node, 'Node required for prototype output validation')
output = subprocess.run([node, str(ROOT / 'prototypes/runtime/export.mjs')], capture_output=True, text=True, check=True)
actual = json.loads(output.stdout)
for snapshot in actual['snapshots']:
    for event in snapshot:
        validate('SemanticEvent', event)
for batch in actual['batches']:
    for mutation in batch:
        validate('Mutation', mutation)
print(f"PASS actual E02 output: {len(actual['snapshots'])} snapshots / {sum(map(len, actual['snapshots']))} event payloads and {len(actual['batches'])} mutation batches")

if '--contracts-only' in sys.argv:
    print('NOT RUN task graph, document links and stale-file checks (--contracts-only)')
else:
    tasks = load('tasks.json')['tasks']; byid = {t['id']: t for t in tasks}
    require(len(byid) == len(tasks), 'Duplicate task ID')
    issues = {f'R{i:02}' for i in range(1, 29)}
    active = set(); visited = set()
    def visit(key):
        require(key in byid, 'Unknown task: ' + key)
        require(key not in active, 'Cyclic task: ' + key)
        if key in visited:
            return
        active.add(key)
        for parent in byid[key]['depends_on']:
            visit(parent)
        active.remove(key); visited.add(key)
    acceptance = rows('fixtures/acceptance.jsonl'); aids = {a['id'] for a in acceptance}
    require(len(aids) == len(acceptance), 'Duplicate acceptance ID')
    for a in acceptance:
        require(a['task'] in byid and set(a['issues']) <= issues, 'Unresolved acceptance references')
    for t in tasks:
        visit(t['id'])
        require(set(t['acceptance_ids']) <= aids and set(t['issue_ids']) <= issues, 'Unresolved task references')
        for path in t['read']:
            require((ROOT / path).is_file(), 'Missing task read: ' + path)
    require(all(i in (ROOT / 'docs/REVIEW.md').read_text(encoding='utf-8') for i in issues), 'Finding missing from review ledger')
    links = 0
    for p in ROOT.rglob('*.md'):
        if any(part in ('.git', '.artifacts', 'node_modules', '.venv') for part in p.relative_to(ROOT).parts):
            continue
        for target in re.findall(r'\[[^\]\n]*\]\(([^)]+)\)', p.read_text(encoding='utf-8')):
            target = target.split('#', 1)[0]
            if not target or re.match(r'^[A-Za-z]+:', target):
                continue
            require((p.parent / target).exists(), f'Broken file link in {p}: {target}')
            links += 1
    require(not list((ROOT / 'docs').glob('[0-9][0-9]-*.md')), 'Superseded numbered docs returned')
    require(not (ROOT / 'repo-overlay').exists() and not (ROOT / 'docs/ui').exists(), 'Retired duplicate pack/UI tree returned')
    for path in ('STATUS.md', 'BUILD.md', 'AGENTS.md', 'docs/VALIDATION.md', 'prototypes/README.md'):
        require((ROOT / path).is_file(), 'Missing entry point: ' + path)
    print(f'PASS repository: {len(tasks)} acyclic tasks, {len(acceptance)} acceptance references, {links} local Markdown links; superseded active tree absent')
print('No model accuracy, production application, live voice or external execution claim follows from these checks.')
