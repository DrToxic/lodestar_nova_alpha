#!/usr/bin/env python3
"""Add the ORION tactical mode to docs/index.html (a switch inside the same page, so the USB link to the radio is never reopened),
and write docs/tactical.html: the same page, opened in tactical mode.  Run after build_tank.py.  Idempotent."""
import pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent.parent
t = root / "tools" / "tactical"
h = (root / "docs" / "index.html").read_text(encoding="utf-8")
h = re.sub(r'<style id="tactical-css">.*?</style>\n?', '', h, flags=re.S)
h = re.sub(r'<script id="tactical-js">.*?</script>\n?', '', h, flags=re.S)
h = re.sub(r'<!--TAC-HTML-BEGIN-->.*?<!--TAC-HTML-END-->\n?', '', h, flags=re.S)

def scope(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    out, i, n = [], 0, len(css)
    def block(i):                                   # index of the matching close brace for the '{' at i
        d = 0
        while i < n:
            if css[i] == '{': d += 1
            elif css[i] == '}':
                d -= 1
                if d == 0: return i
            i += 1
        raise SystemExit("unbalanced css")
    def sel(x):
        parts = [p.strip() for p in x.split(',') if p.strip()]
        r = []
        for p in parts:
            r.append("html.tac" + p[5:] if p.startswith(":root") else "html.tac " + p)
        return ", ".join(r)
    def walk(text):
        res, j, m = [], 0, len(text)
        while j < m:
            k = text.find('{', j)
            if k < 0: break
            head = text[j:k].strip(); d, e = 0, k
            while e < m:
                if text[e] == '{': d += 1
                elif text[e] == '}':
                    d -= 1
                    if d == 0: break
                e += 1
            body = text[k + 1:e]
            if head.startswith('@media') or head.startswith('@supports'): res.append(head + '{' + walk(body) + '}')
            elif head.startswith('@'): res.append(head + '{' + body + '}')
            else: res.append(sel(head) + '{' + body + '}')
            j = e + 1
        return "\n".join(res)
    return walk(css)

css = (t / "tactical.css").read_text(encoding="utf-8")
cut = css.index("/*OUTSIDE-SCOPE*/")
cssout = scope(css[:cut]) + "\n" + css[cut:]
def sub1(a, b):
    global h
    if h.count(a) != 1: sys.exit("expected exactly one: " + a[:60])
    h = h.replace(a, b)
sub1('<p id="notice" hidden></p>', '<p id="notice" hidden></p><!--TAC-HTML-BEGIN-->' + (t / "tactical.html").read_text(encoding="utf-8") + '<!--TAC-HTML-END-->')
h = h.replace('</head>', '<style id="tactical-css">' + cssout + '</style>\n</head>', 1)
i = h.rindex('</body>')
h = h[:i] + '<script id="tactical-js">' + (t / "tactical.js").read_text(encoding="utf-8") + '</script>\n' + h[i:]
(root / "docs" / "index.html").write_text(h, encoding="utf-8")
tac = h.replace('<html lang="en">', '<html lang="en" class="tac">', 1).replace("<title>LODESTAR NOVA dashboard</title>", "<title>ORION TACTICAL DASHBOARD</title>", 1)
(root / "docs" / "tactical.html").write_text(tac, encoding="utf-8")
print("docs/index.html", len(h), "docs/tactical.html", len(tac))

# OTR (Orion Tactical Radio): the same page with the pet, the shark tank and the mode switch taken out; tactical mode only
o = tac
o = re.sub(r'<script id="tank-js">.*?</script>\n?', '', o, flags=re.S)
o = re.sub(r'<style id="tank-css">.*?</style>\n?', '', o, flags=re.S)
o = re.sub(r'<!--TANK-HTML-BEGIN-->.*?<!--TANK-HTML-END-->\n?', '', o, flags=re.S)
o = o.replace('<html lang="en" class="tac">', '<html lang="en" class="tac otr">', 1).replace("<title>ORION TACTICAL DASHBOARD</title>", "<title>OTR - Orion Tactical Radio</title>", 1)
(root / "docs" / "otr.html").write_text(o, encoding="utf-8"); print("docs/otr.html", len(o))
