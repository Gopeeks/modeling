#!/usr/bin/env python3
"""
Local dev server with live reload.
Watches all HTML, CSS, JS, and image files and refreshes the browser on save.

Usage:
    python3 dev.py
"""

from livereload import Server

server = Server()

# Watch these file types for changes
watch = [
    '*.html',
    '*.css',
    '*.js',
    'photos/*',
]

for pattern in watch:
    server.watch(pattern)

print("\n  Dev server running at http://localhost:5500")
print("  Watching for changes... (Ctrl+C to stop)\n")

server.serve(port=5500, root='.', open_url_delay=1)
