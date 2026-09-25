"""Optional E01 smoke test: pip install playwright; playwright install chromium.
Uses only loopback. Not a full accessibility audit or production app test.
"""
from pathlib import Path
import subprocess
import shutil
import re
import json
import sys
import time
from urllib.request import urlopen, Request
from urllib.error import HTTPError
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
server = subprocess.Popen([sys.executable, str(ROOT / 'scripts/serve.py'), '--port', '8766'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
base = 'http://127.0.0.1:8766'
try:
    for attempt in range(40):
        try:
            urlopen(base, timeout=1).close()
            break
        except OSError:
            time.sleep(.1)
    else:
        raise AssertionError('Prototype server did not start')
    for path in ('/.env', '/docs/PRODUCT.md', '/%2e%2e/README.md'):
        try:
            urlopen(base + path)
            raise AssertionError('Unlisted path was served: ' + path)
        except HTTPError as error:
            assert error.code == 404
    try:
        urlopen(Request(base, headers={'Host': 'untrusted.example'}))
        raise AssertionError('Untrusted Host was accepted')
    except HTTPError as error:
        assert error.code == 403
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=shutil.which("chromium") or None)
        for width in (1440, 768, 360):
            page = browser.new_page(viewport={'width': width, 'height': 1000}, reduced_motion='reduce')
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            if '--inline' in sys.argv:
                # Offline DOM-only mode for browser environments that prohibit all navigation.
                html = (ROOT / 'prototypes/workspace/index.html').read_text(encoding='utf-8')
                html = re.sub(r'<script.*?</script>|<link[^>]+>', '', html, flags=re.S)
                page.set_content(html)
                page.add_style_tag(content=(ROOT / 'prototypes/workspace/styles.css').read_text(encoding='utf-8'))
                fixture_text = (ROOT / 'fixtures/scenarios.jsonl').read_text(encoding='utf-8')
                page.evaluate('text => { window.fetch = async () => ({ok:true, text:async () => text}); }', fixture_text)
                model = (ROOT / 'prototypes/workspace/model.mjs').read_text(encoding='utf-8').replace('export ', '')
                app = (ROOT / 'prototypes/workspace/app.mjs').read_text(encoding='utf-8').split('\n', 1)[1]
                page.evaluate('(async () => {\n' + model + '\n' + app + '\n})()')
            else:
                page.goto(base)
            page.locator('#step').wait_for(state='visible')
            page.locator('#step').click()
            page.wait_for_function("document.getElementById('progress').textContent === '1 / 6 phrases'")
            page.evaluate("window.firstCard = document.querySelector('[data-event-id=\"hydration-1\"]')")
            page.locator('#step').click()
            page.wait_for_function("document.getElementById('progress').textContent === '2 / 6 phrases'")
            assert page.evaluate("window.firstCard === document.querySelector('[data-event-id=\"hydration-1\"]')")
            assert 'water' in page.locator('.card-value').first.inner_text()
            page.locator('#play').click()
            page.wait_for_function("document.getElementById('progress').textContent === '6 / 6 phrases'", timeout=15000)
            assert page.locator('.card').count() == 4
            assert not page.locator('#developer').evaluate('(e) => e.open')
            page.locator('[data-event-id="hydration-1"]').focus()
            page.keyboard.press('Enter')
            assert page.locator('#explanation').evaluate('(e) => e.open')
            explanation = page.locator('#explanation-body').inner_text()
            assert 'Nothing for this captured item' in explanation
            assert 'time and date' not in explanation
            page.locator('#close').click()
            assert page.evaluate("document.activeElement.dataset.eventId === 'hydration-1'")
            page.locator('#developer summary').click()
            page.locator('#stale').click()
            assert 'Stale update rejected' in page.locator('#status').inner_text()
            assert page.locator('.card').count() == 4
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
            assert page.locator('.processor').evaluate('(e) => getComputedStyle(e).animationName') == 'none'
            if width == 1440:
                out = ROOT / '.artifacts'; out.mkdir(exist_ok=True)
                page.screenshot(path=str(out / 'prototype-desktop.png'), full_page=True)
            page.locator('#reset').click()
            page.locator('#step').click()
            page.locator('#reset').click()
            page.wait_for_timeout(700)
            assert page.locator('.card').count() == 0
            assert page.locator('#progress').inner_text() == '0 / 6 phrases'
            assert errors == [], errors
            page.close()
            print(f'PASS E01 {width}px: replay, stable DOM, explanation/focus, stale fence, reset, reduced motion, no horizontal overflow')
        browser.close()
    print('Browser mode: ' + ('offline injected DOM; no browser network navigation tested' if '--inline' in sys.argv else 'served localhost'))
    print('PASS server: allowlisted paths only; untrusted Host rejected')
finally:
    server.terminate()
    server.wait(timeout=5)
