"""Loopback-only static prototype server. Explicit file allowlist; no write API."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote
import argparse

ROOT = Path(__file__).resolve().parents[1]
ASSETS = {
    '/': ('prototypes/workspace/index.html', 'text/html; charset=utf-8'),
    '/prototypes/workspace/': ('prototypes/workspace/index.html', 'text/html; charset=utf-8'),
    '/prototypes/workspace/index.html': ('prototypes/workspace/index.html', 'text/html; charset=utf-8'),
    '/prototypes/workspace/styles.css': ('prototypes/workspace/styles.css', 'text/css; charset=utf-8'),
    '/prototypes/workspace/app.mjs': ('prototypes/workspace/app.mjs', 'text/javascript; charset=utf-8'),
    '/prototypes/workspace/model.mjs': ('prototypes/workspace/model.mjs', 'text/javascript; charset=utf-8'),
    '/fixtures/scenarios.jsonl': ('fixtures/scenarios.jsonl', 'application/x-ndjson; charset=utf-8'),
}

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        port = self.server.server_port
        if self.headers.get('Host', '') not in (f'127.0.0.1:{port}', f'localhost:{port}'):
            self.send_error(403, 'Loopback host required')
            return
        path = unquote(urlsplit(self.path).path)
        if path not in ASSETS:
            self.send_error(404)
            return
        name, content_type = ASSETS[path]
        try:
            body = (ROOT / name).read_bytes()
        except OSError:
            self.send_error(500, 'Prototype asset missing')
            return
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
        self.end_headers()
        self.wfile.write(body)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error('Port must be 1..65535')
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print(f'Scripted prototype: http://127.0.0.1:{args.port}/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
