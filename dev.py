#!/usr/bin/env python3
"""
Local dev server with live reload and same-origin grid layout saving.

Usage:
    python3 dev.py
"""

import json
import logging
import threading
import time
import webbrowser
from pathlib import Path

from livereload import Server
from livereload.handlers import ForceReloadHandler, LiveReloadHandler, LiveReloadJSHandler
from livereload.server import LiveScriptInjector
from tornado import escape, web
from tornado.autoreload import add_reload_hook
from tornado.ioloop import IOLoop
from tornado.log import LogFormatter


ROOT = Path(__file__).resolve().parent
GRID_LAYOUT_FILE = ROOT / 'grid-layout.js'
HOST = '127.0.0.1'
PORT = 5500


def build_grid_layout_source(payload):
    order = payload.get('order', [])
    slot_sizes = payload.get('slotSizes', {})
    photo_positions = payload.get('photoPositions', {})

    normalized_slot_sizes = {
        str(int(key)): value
        for key, value in slot_sizes.items()
        if str(key).isdigit() and value in {'normal', 'tall', 'horizontal'}
    }

    export_payload = {
        'order': [value for value in order if isinstance(value, int)],
        'slotSizes': normalized_slot_sizes,
        'photoPositions': {
            str(int(key)): value.strip()
            for key, value in photo_positions.items()
            if str(key).isdigit() and isinstance(value, str) and value.strip()
        },
    }

    return "window.GRID_LAYOUT = " + json.dumps(export_payload, indent=2) + ";\n"


class GridLayoutSaveHandler(web.RequestHandler):
    def set_default_headers(self):
        self.set_header('Cache-Control', 'no-store')

    def options(self):
        self.set_status(204)
        self.finish()

    def post(self):
        try:
            payload = escape.json_decode(self.request.body or b'{}')
        except json.JSONDecodeError:
            self.set_status(400)
            self.write({'error': 'Invalid JSON payload'})
            return

        try:
            GRID_LAYOUT_FILE.write_text(build_grid_layout_source(payload), encoding='utf-8')
        except OSError as error:
            self.set_status(500)
            self.write({'error': f'Failed to write grid layout: {error}'})
            return

        self.set_status(204)
        self.finish()


def build_live_script():
    return escape.utf8(
        '<script type="text/javascript">(function(){'
        'var s=document.createElement("script");'
        'var port=(window.location.port || (window.location.protocol == "https:" ? 443 : 80));'
        's.src="//"+window.location.hostname+":"+port+"/livereload.js?port="+port;'
        'document.head.appendChild(s);'
        '})();</script>'
    )


def main():
    server = Server()

    for pattern in ['*.html', '*.css', '*.js', 'photos/*']:
        server.watch(pattern)

    channel = logging.StreamHandler()
    channel.setFormatter(LogFormatter())
    logging.getLogger('tornado').addHandler(channel)

    LiveReloadHandler.watcher = server.watcher
    LiveReloadHandler.live_css = True

    live_script = build_live_script()

    class ConfiguredTransform(LiveScriptInjector):
        script = live_script

    app = web.Application(
        handlers=[
            (r'/save-grid-layout', GridLayoutSaveHandler),
            (r'/livereload', LiveReloadHandler),
            (r'/forcereload', ForceReloadHandler),
            (r'/livereload.js', LiveReloadJSHandler),
            (r'/(.*)', web.StaticFileHandler, {
                'path': str(ROOT),
                'default_filename': 'index.html',
            }),
        ],
        debug=False,
        transforms=[ConfiguredTransform],
    )

    print(f"\n  Dev server running at http://localhost:{PORT}")
    print("  Watching for changes... (Ctrl+C to stop)\n")

    app.listen(PORT, address=HOST)

    def opener():
        time.sleep(1)
        webbrowser.open(f'http://{HOST}:{PORT}')

    threading.Thread(target=opener, daemon=True).start()

    try:
        server.watcher._changes.append(('__livereload__', 2))
        LiveReloadHandler.start_tasks()
        add_reload_hook(lambda: IOLoop.instance().stop())
        IOLoop.instance().start()
        IOLoop.current().close(all_fds=True)
    except KeyboardInterrupt:
        print("Shutting down...")


if __name__ == '__main__':
    main()
