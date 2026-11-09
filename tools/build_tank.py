#!/usr/bin/env python3
"""Inject the shark tank (tools/tank) into docs/index.html. Safe to run again."""
import pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
t = root / "tools" / "tank"
idx = root / "docs" / "index.html"
h = idx.read_text(encoding="utf-8")
js = "".join((t / n).read_text(encoding="utf-8") for n in ["a_core.js", "b_scene.js", "c1_sharks.js", "c2_fish.js", "d_events.js", "e_main.js"])
css = (t / "tank.css").read_text(encoding="utf-8"); html = (t / "tank.html").read_text(encoding="utf-8")
h = re.sub(r'<script id="tank-js">.*?</script>\n?', '', h, flags=re.S)
h = re.sub(r'<style id="tank-css">.*?</style>\n?', '', h, flags=re.S)
h = re.sub(r'<!--TANK-HTML-BEGIN-->.*?<!--TANK-HTML-END-->\n?', '', h, flags=re.S)
h = h.replace('</head>', '<style id="tank-css">' + css + '</style>\n</head>', 1)
h = h.replace('<p id="notice" hidden></p>', '<p id="notice" hidden></p>\n<!--TANK-HTML-BEGIN-->' + html + '<!--TANK-HTML-END-->', 1)
assert 'TANK-HTML-BEGIN' in h
i = h.rindex('</body>')
h = h[:i] + '<script id="tank-js">' + js + '</script>\n' + h[i:]
idx.write_text(h, encoding="utf-8"); print("docs/index.html", len(h))
