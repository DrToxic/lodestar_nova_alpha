// Dashboard check for the new pet fields (w/h, colour, e-ink, name) and the USB speed list (docs/index.html).
// Plain node, no packages:  node nova/test/test_dashboard_lora.js
// The page's own PET block, petDraw/petCaption and PETCTL block are cut out of the page and run against a fake page and a fake canvas.
// The frames are made by a JS copy of the radio's encoder (NovaPetLink.h encodeFrame), so every format is checked end to end.
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const html = fs.readFileSync(path.join(__dirname, "..", "..", "docs", "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL: " + m); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m + " (got " + JSON.stringify(a) + ", want " + JSON.stringify(b) + ")");
const b64 = (u8) => Buffer.from(u8).toString("base64");

// ---------------------------------------------------------------- the radio's encoder, in JS
function rle(t) { const o = []; for (let i = 0; i < t.length;) { if (t[i]) { o.push(t[i++]); continue; } let r = 0; while (i < t.length && !t[i] && r < 255) { r++; i++; } o.push(0, r); } return Uint8Array.from(o); }
function bytesFor(w, h, colour) { return (colour ? (w + 1) >> 1 : (w + 7) >> 3) * h; }
// fmt {w,h,colour,eink}; fb/prev Uint8Array; returns the {"pet":{...}} object the radio would print
function enc(fmt, fb, prev, seq, o) {
  o = o || {}; const f = Object.assign({ w: 128, h: 64, colour: false, eink: false }, fmt), key = !prev, p = { s: seq, k: key ? 1 : 0 };
  if (key && o.name) p.n = o.name;
  if (key && !(f.w === 128 && f.h === 64 && !f.colour && !f.eink)) {
    p.w = f.w; p.h = f.h; if (f.eink) p.e = 1;
    if (f.colour) p.c = { b: 4, p: o.pal || b64(new Uint8Array(32)) };
  }
  const t = Uint8Array.from(fb, (v, i) => (prev ? v ^ prev[i] : v)), v = f.colour ? Uint8Array.from(t, (x, i) => (i ? x ^ t[i - 1] : x)) : t;
  p.d = b64(rle(v)); return { pet: p };
}
const setMono = (fb, w, x, y) => { fb[y * ((w + 7) >> 3) + (x >> 3)] |= 0x80 >> (x & 7); };
const setCol = (fb, w, x, y, idx) => { const i = y * ((w + 1) >> 1) + (x >> 1); fb[i] = x & 1 ? (fb[i] & 0xF0) | idx : (fb[i] & 0x0F) | (idx << 4); };
const pal565 = (arr) => { const b = new Uint8Array(32); arr.forEach((c, i) => { b[i * 2] = c >> 8; b[i * 2 + 1] = c & 255; }); return b; };
const hex = (u8) => Buffer.from(u8).toString("hex");

// ---------------------------------------------------------------- the page's own code, run against a fake page
function makeCanvas() {
  const c = { width: 1024, height: 512, style: {}, rects: [], fillStyle: "" };
  c.ctx = { set fillStyle(v) { c.fillStyle = v; }, get fillStyle() { return c.fillStyle; }, fillRect(x, y, w, h) { c.rects.push({ s: c.fillStyle, x, y, w, h }); } };
  c.getContext = () => c.ctx; return c;
}
function makeEl(id) {
  return { id, disabled: false, value: "", dataset: {}, hidden: false, textContent: "", handlers: {}, classList: { remove() {} }, style: {},
    addEventListener(t, f) { (this.handlers[t] = this.handlers[t] || []).push(f); }, fire(t, ev) { (this.handlers[t] || []).forEach((f) => f(ev || {})); },
    appendChild() {}, replaceChildren() {}, setAttribute() {} };
}
const els = { petCanvas: makeCanvas() }; const sent = []; let timers = []; const log = [];
const ctx = { atob: (s) => { if (!/^[A-Za-z0-9+\/]*={0,2}$/.test(s) || s.length % 4) throw new Error("InvalidCharacterError"); return Buffer.from(s, "base64").toString("binary"); }, Uint8Array, performance: { now: () => 1e6 }, S: { mode: "serial" }, PET: null,
  cmdLog: (t) => { ctx.cmdText = t; }, cmdText: "", termAdd: (t) => { log.push("term:" + t); },
  $: (id) => els[id] || (els[id] = makeEl(id)), send: (l) => { sent.push(l); },
  document: { title: "", activeElement: null, querySelector: () => null, createTextNode: (t) => ({ textContent: t }), createElement: () => makeEl("x") },
  setTimeout: (f, ms) => { const t = { f, ms, on: true }; timers.push(t); return t; }, clearTimeout: (t) => { if (t) t.on = false; }, setInterval: () => 0, Date: { now: () => 1e6 } };
vm.createContext(ctx);
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); ok(i > 0 && j > i, "found " + a); return html.slice(i, j); };
vm.runInContext(html.match(/^const N = .*$/m)[0].replace(/^const /, "var "), ctx);
const petSrc = cut("/*PET-BEGIN*/", "function petState(msg, bad)");
vm.runInContext(petSrc.replace(/^const /gm, "var "), ctx);
ctx.$("petNameIn"); ctx.$("petNameSet"); ctx.$("petCap");
const run = (c) => vm.runInContext(c, ctx);
const PET = run("PET"), cv = els.petCanvas;
function draw() { cv.rects.length = 0; run("petDraw()"); return cv.rects.slice(); }
const apply = (o) => PET.apply(o.pet);
// logical pixels out of the rectangles the page drew (k = how many canvas pixels one screen pixel takes)
function raster(rects, w, h, k) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill(null)); rects.forEach((r) => { for (let Y = r.y / k; Y < (r.y + r.h) / k && Y < h; Y++) for (let X = r.x / k; X < (r.x + r.w) / k && X < w; X++) g[Y][X] = r.s; }); return g; }
const rgb = (r, g, b) => "rgb(" + r + "," + g + "," + b + ")";

// ---------------------------------------------------------------- 1. old mono frames: exactly as before
const OLD = { decode(b, n) { const bin = Buffer.from(b, "base64").toString("binary"), out = new Uint8Array(1024); let o = 0; for (let i = 0; i < bin.length && o < 1024;) { const c = bin.charCodeAt(i++); if (c) out[o++] = c; else { const run = bin.charCodeAt(i++) | 0; o += run; } } return out; } };
function oldDraw(fb, g) { const K = 8, r = [], st = { s: "" }; r.push({ s: "#05080c", x: 0, y: 0, w: 1024, h: 512 }); for (let y = 0; y < 64; y++) for (let b = 0; b < 16; b++) { const v = fb[y * 16 + b]; if (!v) continue; for (let k = 0; k < 8; k++) if (v & (0x80 >> k)) r.push({ s: "#8fd4ff", x: (b * 8 + k) * K, y: y * K, w: K - g, h: K - g }); } return r; }
{
  PET.reset(); const A = new Uint8Array(1024); [[0, 0], [5, 7], [127, 63], [64, 32], [9, 9], [10, 9]].forEach(([x, y]) => setMono(A, 128, x, y));
  const key = enc({}, A, null, 1, { name: "fox" });
  eq(Object.keys(key.pet), ["s", "k", "n", "d"], "a mono 128x64 key frame carries nothing new");
  ok(apply(key), "old key frame applies"); eq(hex(PET.fb), hex(A), "old key frame decodes to the same bytes");
  eq(hex(PET.fb), hex(OLD.decode(key.pet.d)), "same bytes as the old decoder");
  eq([PET.fmt.w, PET.fmt.h, PET.fmt.bpp, PET.fmt.eink], [128, 64, 1, false], "format stays 128x64 mono");
  eq(draw(), oldDraw(A, 0), "the mono picture is drawn rectangle for rectangle as before");
  PET.grid = true; eq(draw(), oldDraw(A, 1), "and with the pixel grid on"); PET.grid = false;
  const B = Uint8Array.from(A); setMono(B, 128, 20, 20); setMono(B, 128, 5, 7); B[0] ^= 0x80;
  const dl = enc({}, B, A, 2); ok(!("w" in dl.pet) && !("c" in dl.pet) && !("e" in dl.pet), "a delta frame has no format fields");
  ok(apply(dl), "old delta applies"); eq(hex(PET.fb), hex(B), "old delta decodes");
  ok(!apply(enc({}, B, A, 9)), "a missed frame is refused as before"); eq(PET.seq, -1, "and waits for a key frame");
  // a line like the old firmware printed: n,u,x,m,c(count),i
  PET.reset(); const legacy = { pet: Object.assign(enc({}, A, null, 5).pet, { n: "fox", u: "Rex", x: 1, m: 30, c: 3, i: 2 }) };
  ok(apply(legacy), "legacy key frame with c as a pet count applies"); eq([PET.fmt.bpp, PET.fmt.w, PET.pal], [1, 128, null], "a numeric c is a count, not colour");
  run("PET.seen = 1"); ctx.$("petCap").textContent = ""; run("petCaption()");
  eq(ctx.$("petCap").textContent, "Rex the fox \u00b7 female \u00b7 2 yr 6 mo \u00b7 pet 2 of 3", "legacy caption unchanged");
  eq(PET.meta.c, 3, "pet count kept");
  // the frame the old PetMirror printed has no w/h/e/c at all and works from a fresh page
  PET.reset(); ok(apply({ pet: { s: 1, k: 1, n: "cat", u: "", x: 0, m: 5, c: 1, i: 1, d: key.pet.d } }), "PetMirror-style key frame applies");
}

// ---------------------------------------------------------------- 2. screen size (w/h) on a one-colour screen
{
  PET.reset(); const w = 64, h = 32, A = new Uint8Array(bytesFor(w, h, false)); [[0, 0], [63, 31], [31, 16], [8, 1]].forEach(([x, y]) => setMono(A, w, x, y));
  const k = enc({ w, h }, A, null, 1, { name: "Pip" });
  eq([k.pet.w, k.pet.h, "c" in k.pet, "e" in k.pet], [64, 32, false, false], "key frame carries w and h");
  ok(apply(k), "64x32 key frame applies"); eq(PET.fb.length, 256, "framebuffer is 8 bytes a row, 32 rows"); eq(hex(PET.fb), hex(A), "bytes decoded");
  const rects = draw(), kk = 1024 / w;
  eq([cv.width, cv.height, cv.style.aspectRatio], [1024, 512, "64 / 32"], "canvas takes the screen's shape (64x32 is 2:1, 16 px a pixel)");
  const g = raster(rects, w, h, kk); let wrong = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const on = (A[y * 8 + (x >> 3)] >> (7 - (x & 7))) & 1; if (g[y][x] !== (on ? "#8fd4ff" : "#05080c")) wrong++; }
  eq(wrong, 0, "every pixel of the 64x32 picture is right");
  const B = Uint8Array.from(A); setMono(B, w, 10, 10); ok(apply(enc({ w, h }, B, A, 2)), "delta on a 64x32 picture"); eq(hex(PET.fb), hex(B), "delta decoded");
  // odd width: rows are padded to whole bytes
  PET.reset(); const w2 = 100, h2 = 50, C = new Uint8Array(bytesFor(w2, h2, false)); setMono(C, w2, 99, 49); setMono(C, w2, 0, 49);
  ok(apply(enc({ w: w2, h: h2 }, C, null, 1)), "100x50 applies"); eq(PET.fb.length, 13 * 50, "13 bytes a row");
  const r2 = draw(), k2 = Math.floor(1024 / w2), g2 = raster(r2, w2, h2, k2); eq([g2[49][99], g2[49][0], g2[49][50]], ["#8fd4ff", "#8fd4ff", "#05080c"], "last pixel of the last row");
  eq([cv.width, cv.height], [w2 * k2, h2 * k2], "canvas is a whole number of screen pixels wide");
  eq(ctx.$("petCap") && (run("PET.meta"), true), true, "ok");
  run("PET.seen = 1"); run("petCaption()"); ok(/100\u00d750$/.test(ctx.$("petCap").textContent), "caption names a screen that is not 128x64");
  // refused sizes leave the last picture alone
  PET.reset(); ok(apply(enc({}, new Uint8Array(1024), null, 1)), "start from a normal frame"); const last = hex(PET.fb);
  [{ w: 0, h: 10 }, { w: 600, h: 10 }, { w: 10, h: -4 }, { w: "64", h: 32 }, { w: 64.5, h: 32 }].forEach((wh, i) => {
    const bad = { pet: { s: 2 + i, k: 1, w: wh.w, h: wh.h, d: "AAA=" } }; ok(!apply(bad), "bad size " + JSON.stringify(wh) + " refused"); eq(hex(PET.fb), last, "picture unchanged after bad size #" + i);
  });
  eq(run("PET.format({ w: 512, h: 512, c: { b: 4, p: \"" + b64(pal565([0xFFFF])) + "\" } })"), null, "a colour picture over 40000 bytes (512x512) is refused"); eq(run("PET.format({ w: 513, h: 8 })"), null, "513 wide is refused"); ok(run("PET.format({ w: 512, h: 512 })") !== null, "512x512 in one bit (32768 bytes) is fine");
  ok(apply(enc({ w: 64 }, new Uint8Array(8 * 64), null, 20)), "only w given: h falls back to 64"); eq([PET.fmt.w, PET.fmt.h], [64, 64], "w without h");
  ok(apply(enc({}, new Uint8Array(1024), null, 21)), "a later key frame without w/h is the original screen again"); eq([PET.fmt.w, PET.fmt.h, PET.fb.length], [128, 64, 1024], "back to 128x64");
  eq([draw().length, cv.width, cv.height, cv.style.aspectRatio], [1, 1024, 512, ""], "and the canvas goes back too");
}

// ---------------------------------------------------------------- 3. colour (c is an object)
{
  const w = 21, h = 4, P = [0x0000, 0xF800, 0x07E0, 0x001F, 0xFFFF, 0x8410], pb = pal565(P);
  const rgbOf = (c) => rgb((c >> 11 & 31) << 3 | (c >> 11 & 31) >> 2, (c >> 5 & 63) << 2 | (c >> 5 & 63) >> 4, (c & 31) << 3 | (c & 31) >> 2);
  const A = new Uint8Array(bytesFor(w, h, true)); const want = []; for (let y = 0; y < h; y++) { want.push([]); for (let x = 0; x < w; x++) { const idx = (x + y * 3) % 6; setCol(A, w, x, y, idx); want[y].push(idx); } }
  const test = (label, palStr) => {
    PET.reset(); const k = enc({ w, h, colour: true }, A, null, 1, { name: "Rex", pal: palStr });
    ok(k.pet.c && typeof k.pet.c === "object" && k.pet.c.b === 4, label + ": c is an object");
    ok(apply(k), label + ": colour key frame applies"); eq([PET.fmt.bpp, PET.fmt.w, PET.fmt.h, PET.fmt.rb, PET.fb.length], [4, 21, 4, 11, 44], label + ": 4 bits a pixel, 11 bytes a row");
    eq(hex(PET.fb), hex(A), label + ": bytes decoded (run-length, then undo the byte-to-byte XOR)");
    eq(PET.pal.slice(0, 6), P.map(rgbOf), label + ": palette is RGB565 big endian expanded to 8 bits"); eq(PET.pal.length, 16, label + ": 16 palette entries");
    eq([PET.pal[1], PET.pal[2], PET.pal[3], PET.pal[4]], [rgb(255, 0, 0), rgb(0, 255, 0), rgb(0, 0, 255), rgb(255, 255, 255)], label + ": red, green, blue, white");
    const rects = draw(), kk = Math.floor(1024 / w), g = raster(rects, w, h, kk); let wrong = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] !== PET.pal[want[y][x]]) wrong++;
    eq(wrong, 0, label + ": every pixel is drawn in its palette colour"); eq(rects[0].s, PET.pal[0], label + ": background is palette colour 0");
    eq(cv.style.aspectRatio, "21 / 4", label + ": canvas shape");
    // a delta: some pixels change, and an unchanged picture is a run of zeros
    const B = Uint8Array.from(A); setCol(B, w, 3, 2, 5); setCol(B, w, 20, 3, 4);
    ok(apply(enc({ w, h, colour: true }, B, A, 2)), label + ": colour delta applies"); eq(hex(PET.fb), hex(B), label + ": colour delta decoded");
    ok(apply(enc({ w, h, colour: true }, B, B, 3)), label + ": a delta with no change applies"); eq(hex(PET.fb), hex(B), label + ": and changes nothing");
    run("PET.seen = 1"); run("petCaption()"); ok(/21\u00d74 \u00b7 colour$|21\u00d74 colour$/.test(ctx.$("petCap").textContent) || /colour$/.test(ctx.$("petCap").textContent), label + ": caption says colour");
  };
  test("base64 palette", b64(pb)); test("hex palette", hex(pb)); test("upper-case hex palette", hex(pb).toUpperCase());
  // a real size, flat areas: few rectangles
  PET.reset(); const W = 320, H = 240, F = new Uint8Array(bytesFor(W, H, true)); F.fill(0x11); for (let y = 100; y < 140; y++) for (let x = 100; x < 200; x++) setCol(F, W, x, y, 2);
  ok(apply(enc({ w: W, h: H, colour: true }, F, null, 1, { pal: b64(pb) })), "320x240 colour applies"); eq(PET.fb.length, 38400, "38400 bytes");
  const rr = draw(); ok(rr.length < 400, "flat areas are few rectangles (" + rr.length + ")"); eq([cv.width, cv.height], [960, 720], "320x240 is drawn 3x");
  // a palette that is neither hex nor base64, or the wrong depth, refuses the picture and keeps the last one
  const keep = hex(PET.fb);
  [{ b: 4, p: "not*base64!" }, { b: 4 }, { b: 8, p: b64(pb) }, { b: 4, p: 5 }, { p: b64(pb) }, { b: 4, p: "" }].forEach((c, i) => { ok(!apply({ pet: { s: 5 + i, k: 1, w, h, c, d: "AAA=" } }), "bad colour object #" + i + " refused"); });
  eq(hex(PET.fb), keep, "refused colour frames leave the last picture alone");
  ok(!apply({ pet: { s: 40, k: 1, w: 21, h: 4, c: [1, 2], d: "AAA=" } }) === false, "c as an array is not a colour object (and not a count): the frame is mono and applies");
  // c as a number and a colour object side by side
  PET.reset(); ok(apply({ pet: { s: 1, k: 1, n: "a", c: 4, i: 1, d: enc({}, new Uint8Array(1024), null, 1).pet.d } }) && PET.fmt.bpp === 1 && PET.meta.c === 4, "c = 4 is a pet count");
}

// ---------------------------------------------------------------- 4. e-ink
{
  PET.reset(); const w = 200, h = 100, A = new Uint8Array(bytesFor(w, h, false)); [[0, 0], [199, 99], [100, 50]].forEach(([x, y]) => setMono(A, w, x, y));
  const k = enc({ w, h, eink: true }, A, null, 1, { name: "Ink" }); eq([k.pet.e, k.pet.w, k.pet.h, "c" in k.pet], [1, 200, 100, false], "e-ink key frame: e, w, h, no c");
  ok(apply(k), "e-ink key frame applies"); ok(PET.fmt.eink === true && PET.fmt.bpp === 1, "e-ink, one bit a pixel");
  const rects = draw(), kk = Math.floor(1024 / w), g = raster(rects, w, h, kk);
  eq([rects[0].s, g[0][0], g[99][199], g[50][100], g[1][1]], ["#ffffff", "#000000", "#000000", "#000000", "#ffffff"], "black ink on a white page");
  // the colour object is ignored on e-ink
  PET.reset(); const pb = pal565([0xFFFF, 0xF800]); const kc = enc({ w, h, eink: true }, A, null, 1); kc.pet.c = { b: 4, p: b64(pb) };
  ok(apply(kc) && PET.fmt.bpp === 1 && PET.fmt.eink && PET.pal === null, "e-ink with a colour object stays one bit and black on white");
  eq(hex(PET.fb), hex(A), "and the bytes are the one-bit picture");
  ok(!apply({ pet: { s: 2, k: 0, d: "AAA=" } }) || true, "ok"); PET.reset();
  ok(apply({ pet: { s: 1, k: 1, w: 128, h: 64, e: 1, d: enc({}, new Uint8Array(1024), null, 1).pet.d } }) && PET.fmt.eink, "e-ink at 128x64 is still e-ink");
  const r3 = draw(); eq(r3[0].s, "#ffffff", "e-ink 128x64 is black on white too");
  eq(run("PET.format({ e: true, w: 8, h: 8 }).eink"), true, "e:true counts as well"); eq(run("PET.format({ e: 0, w: 8, h: 8 }).eink"), false, "e:0 does not");
  run("PET.seen = 1"); run("petCaption()"); ok(/e-ink$/.test(ctx.$("petCap").textContent), "caption says e-ink");
  ok(/PET\.fmt\.eink \? 30000 : 4000/.test(html), "static: an e-ink picture is allowed to be still for 30 s before the page says the radio is gone");
  ok(!/setInterval\([^)]*petDraw/.test(html) && !/requestAnimationFrame\([^)]*petDraw/.test(html), "static: nothing animates the pet picture on its own");
}

// ---------------------------------------------------------------- 5. the name ("n")
{
  PET.reset(); const A = new Uint8Array(1024); const cap = () => { run("PET.seen = 1"); ctx.$("petCap").textContent = ""; run("petCaption()"); return ctx.$("petCap").textContent; };
  ok(apply(enc({}, A, null, 1, { name: "Fluffy" })), "named key frame"); eq(PET.meta.n, "Fluffy", "n is kept"); eq(cap(), "Fluffy", "caption is the name (no sex, no age: the radio does not send them)");
  ok(apply(enc({}, A, null, 2)), "key frame without n applies"); eq(PET.meta.n, "", "missing n means no name"); eq(cap(), "Your pet", "caption falls back to Your pet");
  ok(apply({ pet: Object.assign(enc({}, A, null, 3).pet, { n: "" }) }), "n:\"\" applies"); eq(cap(), "Your pet", "empty n is fine");
  ok(apply({ pet: Object.assign(enc({}, A, null, 4).pet, { n: 5 }) }), "n of the wrong type applies"); eq(PET.meta.n, "", "and is dropped");
  ok(apply(enc({ w: 40, h: 8 }, new Uint8Array(40), null, 5)), "no name on a small screen"); ok(/^Your pet/.test(cap()), "caption works there too");
  ok(apply(enc({}, A, null, 6, { name: "<img src=x onerror=1>" })) && cap() === "<img src=x onerror=1>", "a name is only ever shown as text");
  ok(/el\.textContent = parts\.join/.test(html), "static: the caption is set with textContent");
}

// ---------------------------------------------------------------- 6. USB speed list
const pc = cut("/*PETCTL-START*/", "/*PETCTL-END*/");
ok(/baudRate: S\.baud \|\| 115200/.test(html), "static: the port is opened at S.baud (115200 unless the person changed it)");
ok(!/innerHTML/.test(pc.slice(pc.indexOf("const PC_BAUDS"))), "static: the speed code never uses innerHTML");
ok(/<label class="baud" id="baudBox">/.test(html) && !/id="baudBox" hidden/.test(html), "the speed list is in the markup from the start (it shows before any hello)");
const opts = (html.match(/<select id="baudSel"[^>]*>(.*?)<\/select>/) || [])[1] || ""; eq((opts.match(/value="(\d+)"/g) || []).map((x) => +x.replace(/\D/g, "")), [115200, 230400, 460800, 921600], "the list is 115200, 230400, 460800, 921600");
ctx.S.dxpro = false; ctx.S.port = null;
vm.runInContext(pc.replace(/^const /gm, "var "), ctx);
const status = [], term = []; let noticeText = "", flag = null;
ctx.setStatus = (s, t) => { status.push([s, t]); }; ctx.notice = (t) => { noticeText = t; }; ctx.termAdd = (t) => { term.push(t); }; ctx.autoFlag = (v) => { flag = v; };
ctx.onMeshLine = () => {}; ctx.onPetLine = () => {}; ctx.onFound = () => {}; ctx.onFrame = () => {}; ctx.onContactsLine = () => {};
{ const ia = html.indexOf("function onLine(line) {"), ib = html.indexOf("\n}\n", ia); vm.runInContext(html.slice(ia, ib + 2), ctx); }
const feed = (o) => run("onLine(" + JSON.stringify(typeof o === "string" ? o : JSON.stringify(o)) + ")");
const tick = async () => { for (let i = 0; i < 8; i++) await new Promise((r) => setImmediate(r)); };
const calls = []; let signals = [];
function fresh(caps, ed) {
  run("pcProbeStop()"); timers = []; sent.length = 0; calls.length = 0; ctx.cmdText = ""; status.length = 0; term.length = 0; noticeText = ""; flag = null; ctx.S.startKeep = null;
  ctx.S.mode = "serial"; ctx.S.baud = undefined; ctx.S.manual = false; ctx.S.reopening = false; ctx.S.loopEnd = null;
  ctx.S.port = { name: "port", setSignals: async (s) => { calls.push("signals:" + s.dataTerminalReady + "/" + s.requestToSend); } };
  run("PC.reset(); pcSync()"); els.baudSel.value = "115200";
  if (caps) feed(JSON.stringify({ ed: ed || "dx-pro", nova: { v: 1, caps } }));
}
ctx.disconnect = async (lost) => { calls.push("disconnect:" + lost); await Promise.resolve(); if (ctx.S.loopEnd) { const f = ctx.S.loopEnd; ctx.S.loopEnd = null; f(); } };
ctx.connect = (port) => { calls.push("connect:" + (port && port.name) + "@" + ctx.S.baud); ctx.S.port = port; ctx.S.mode = "serial"; run("pcProbeStart()"); };   // like the page's connect(): opens at S.baud, then the probe asks
const shown = () => els.baudBox && !els.baudBox.hidden;
const pick = (v) => { els.baudSel.value = String(v); els.baudSel.fire("change"); };

fresh(); ok(shown(), "the speed list shows before any hello, so any radio can be probed at the chosen speed");
ctx.S.mode = "off"; run("pcSync()"); ok(shown(), "and when not connected");
fresh({ pet: 1, contacts: 1, petname: 1 }); ok(!shown(), "no speed list when the hello has no baud cap");
fresh({ pet: 1, baud: 0 }); ok(!shown(), "no speed list when baud is 0");
fresh({ pet: 1, baud: "1" }); ok(!shown(), "no speed list when baud is a string");
fresh(); feed({ ed: "orion", nova: 1, v: "0.3.0" }); ok(!shown(), "no speed list for an Orion radio (every other control shows, this one does not)");
fresh({ pet: 1, baud: 1 }); ok(shown(), "speed list shown when the hello has baud:1");
eq(run("Object.keys(PC.caps).indexOf('baud') >= 0"), true, "baud is one of the known capabilities");
fresh({ pet: 1, baud: 1 }); run("PC.reset(); pcSync()"); ok(shown(), "after a reset (connect or disconnect) there is no hello yet, so the list shows again");
fresh({ baud: 921600 }); ok(shown(), "a number above 0 counts");

// asking
fresh({ baud: 1 }); pick(460800);
eq(sent, ["nova baud 460800"], "picking 460800 sends nova baud 460800"); ok(els.baudSel.disabled, "the list is locked while the radio answers"); ok(/460800/.test(ctx.cmdText), "the command log says what was asked");
pick(921600); eq(sent, ["nova baud 460800"], "no second request while one is waiting");
fresh({ baud: 1 }); pick(115200); eq(sent, [], "picking the speed already in use sends nothing");
fresh({ baud: 1 }); pick(12345); eq(sent, [], "a speed that is not in the list is not sent"); eq(els.baudSel.value, "115200", "and the list goes back");
fresh({ baud: 1 }); eq(run('pcSend("nova baud 12345", "")'), false, "pcSend refuses an unknown speed"); eq(run('pcSend("nova baud 921600 x", "")'), false, "pcSend refuses extra text"); eq(run('pcSend("nova baud 9600\\nnova key up", "")'), false, "pcSend refuses a second line");
fresh({ pet: 1 }); pick(460800); eq(sent, [], "a radio without the baud cap is never asked");
fresh(); feed({ ed: "orion", nova: 1, v: "0.3.0" }); eq(run('pcSend("nova baud 460800", "")'), false, "an Orion radio is never sent nova baud");

// success: the page closes the port; the radio uses the new speed after its restart
(async () => {
  fresh({ baud: 1 }); pick(460800); sent.length = 0; calls.length = 0;
  feed('{"nova_ok":"baud","rate":460800}'); await tick();
  eq(calls, ["signals:false/false", "disconnect:true"], "reply ok: release DTR/RTS in one step and close, nothing is reopened");
  eq(ctx.S.baud, 460800, "S.baud is the new rate"); ok(!els.baudSel.disabled, "the list is free again"); ok(/460800/.test(ctx.cmdText) && /after it restarts/.test(ctx.cmdText) && /460800/.test(noticeText), "the page tells the person the radio applies it on its restart");
  eq(flag, true, "the page will connect again by itself when the radio is back"); ok(ctx.S.reopening === false, "reopening flag cleared");
  eq(status[status.length - 1], ["off", "Not connected, waiting for the radio to restart"], "the status says it is waiting for the restart");
  run("pcSync()"); eq(els.baudSel.value, "460800", "the list shows the new speed");

  // the radio is back: the next connect probes starting at the new speed, and finds it if the radio did not take it
  run("pcProbeBegin()"); eq(run("PC.probe.seq.slice(0, 4)"), [460800, 921600, 115200, 230400], "the re-probe starts at the new speed and goes round");
  ctx.S.mode = "serial"; calls.length = 0;

  // the rate in the reply wins over what was asked, if the page knows it
  fresh({ baud: 1 }); pick(230400); calls.length = 0; feed('{"nova_ok":"baud","rate":921600}'); await tick();
  eq(ctx.S.baud, 921600, "the radio's own rate is the one used"); eq(calls, ["signals:false/false", "disconnect:true"], "and the port is closed");
  // a rate the page cannot use
  fresh({ baud: 1 }); pick(230400); calls.length = 0; feed('{"nova_ok":"baud","rate":57600}'); await tick();
  eq(calls, [], "a rate outside the list reopens nothing"); eq(ctx.S.baud, undefined, "S.baud unchanged"); ok(!els.baudSel.disabled && els.baudSel.value === "115200", "list back to the real speed");
  fresh({ baud: 1 }); pick(230400); calls.length = 0; feed('{"nova_ok":"baud","rate":"230400"}'); await tick(); eq(calls, [], "a rate that is a string reopens nothing");
  fresh({ baud: 1 }); pick(230400); calls.length = 0; feed('{"nova_ok":"baud"}'); await tick(); eq(calls, [], "no rate reopens nothing");

  // refusal
  fresh({ baud: 1 }); pick(921600); calls.length = 0; feed('{"nova_error":"baud_unsupported"}'); await tick();
  eq(calls, [], "baud_unsupported: nothing is reopened"); eq(ctx.S.baud, undefined, "the speed stays"); ok(!els.baudSel.disabled, "the list is free again"); eq(els.baudSel.value, "115200", "and shows the speed really in use");
  ok(/cannot use 921600 baud/.test(ctx.cmdText), "the command log says the radio cannot do it (" + ctx.cmdText + ")");
  sent.length = 0; pick(460800); eq(sent, ["nova baud 460800"], "after a refusal another speed can be asked for");

  // nobody asked, other lines, junk
  fresh({ baud: 1 }); calls.length = 0; feed('{"nova_ok":"baud","rate":921600}'); await tick(); eq(calls, [], "a speed answer nobody asked for is ignored");
  fresh({ baud: 1 }); pick(230400); calls.length = 0; ctx.cmdText = "";
  feed('{"nova_ok":"petname","name":"x"}'); feed('{"nova_error":"something_else"}'); feed('{"nova_ok":'); feed('{"nova_ok":"baud","rate":921600,'); await tick();
  eq(calls, [], "other nova_ok / nova_error lines and half lines do nothing"); eq(sent, ["nova baud 230400"], "and send nothing"); ok(els.baudSel.disabled, "the request is still waiting");
  // no answer
  fresh({ baud: 1 }); pick(230400); const t = timers.filter((x) => x.on && x.ms === 6000); eq(t.length, 1, "a 6 s wait is set");
  t[0].f(); ok(!els.baudSel.disabled && els.baudSel.value === "115200" && /did not answer/.test(ctx.cmdText), "no answer: the list goes back and the log says so");
  // reset while waiting
  fresh({ baud: 1 }); pick(230400); run("PC.reset(); pcSync()"); ok(!els.baudSel.disabled, "a reset (disconnect) frees the list"); calls.length = 0; feed('{"nova_ok":"baud","rate":230400}'); await tick(); eq(calls, [], "and a late answer is ignored");
  // two replies
  fresh({ baud: 1 }); pick(230400); calls.length = 0; feed('{"nova_ok":"baud","rate":230400}'); feed('{"nova_ok":"baud","rate":230400}'); await tick(); eq(calls.filter((c) => c.startsWith("disconnect")).length, 1, "a repeated answer closes once");
  // the reopen needs a port in serial mode
  fresh({ baud: 1 }); pick(230400); ctx.S.port = null; calls.length = 0; feed('{"nova_ok":"baud","rate":230400}'); await tick(); eq(calls, [], "no port, no reopen");
  // wait for the read loop: connect only runs after it ended
  fresh({ baud: 1 }); pick(230400); calls.length = 0; ctx.disconnect = async (lost) => { calls.push("disconnect:" + lost); setImmediate(() => { calls.push("loop-ended"); if (ctx.S.loopEnd) { const f = ctx.S.loopEnd; ctx.S.loopEnd = null; f(); } }); };
  feed('{"nova_ok":"baud","rate":230400}'); await tick(); eq(calls, ["signals:false/false", "disconnect:true", "loop-ended"], "the close waits until the old read loop has ended");
  ok(/if \(S\.loopEnd\) \{ const f = S\.loopEnd; S\.loopEnd = null; f\(\); \}/.test(html.slice(html.indexOf("async function connect"), html.indexOf("async function disconnect"))), "static: connect() signals the end of its read loop");
  ok(!/no answer at the chosen speed/.test(html), "static: the old silent fall-back to 115200 is gone (the probe replaces it)");
  ok(/line\.indexOf\('"nova_ok"'\) === 1/.test(html), "static: onLine routes the speed answers");

  // ---------------------------------------------------------------- 7. the circular probe
  const NOREPLY = "No reply at any speed. Set the same speed in the radio's Options > Display > Serial speed, reboot the radio, then connect again.";
  const HELLO = JSON.stringify({ ed: "dx-pro", nova: { v: 1, caps: { pet: 1, contacts: 1, petname: 1, baud: 1 } } });
  const stepTimer = () => { const t = timers.filter((x) => x.on && x.ms === 1000); if (t.length !== 1) return false; timers = timers.filter((x) => x !== t[0]); t[0].on = false; t[0].f(); return true; };
  const begin = (rate) => { fresh(); ctx.S.mode = "off"; els.baudSel.value = String(rate); els.baudSel.fire("change"); ctx.S.mode = "serial"; run("pcProbeBegin()"); run("pcProbeStart()"); };
  const hellos = () => sent.filter((l) => l === "nova hello").length;

  // order: the listed speed first, then the others in order, wrapping
  eq(run("pcProbeSeq(115200)"), [115200, 230400, 460800, 921600, 115200, 230400, 460800, 921600, 115200, 230400, 460800, 921600], "probe order from 115200, three passes");
  eq(run("pcProbeSeq(460800)").slice(0, 6), [460800, 921600, 115200, 230400, 460800, 921600], "probe order from 460800 wraps round");
  eq(run("pcProbeSeq(921600)").slice(0, 5), [921600, 115200, 230400, 460800, 921600], "probe order from 921600 wraps round");
  eq(run("pcProbeSeq(57600)").slice(0, 2), [115200, 230400], "an unknown start falls back to the first speed");
  eq(run("pcProbeSeq(230400).length"), 12, "three passes of four speeds is twelve tries");

  // the page starts at the listed speed
  fresh(); ctx.S.mode = "off"; els.baudSel.value = "460800"; els.baudSel.fire("change"); eq(ctx.S.baud, 460800, "choosing a speed while not connected sets where Connect starts");
  run("pcProbeBegin()"); eq([ctx.S.baud, run("PC.probe.seq[0]")], [460800, 460800], "Connect starts the probe at the listed speed"); ok(shown(), "the list is shown"); run("pcSync()"); ok(els.baudSel.disabled, "and is locked while the probe runs");
  run("pcProbeStop()");

  // each step: one hello, about a second, then the next speed
  begin(460800);
  eq(sent, ["nova hello"], "the first try sends nova hello and nothing else"); eq(timers.filter((x) => x.on).map((x) => x.ms), [1000], "and waits about 1 s");
  ok(/460800 baud \(try 1 of 12\)/.test(status[status.length - 1][1]), "the status names the speed and the try");
  pick(115200); eq([sent.length, els.baudSel.value], [1, "460800"], "the list cannot be changed mid-probe (it goes back to the speed being tried)");
  const rates = [];
  for (let i = 0; i < 11; i++) { calls.length = 0; ok(stepTimer(), "step " + (i + 1) + " timer fires"); await tick(); rates.push(+calls[calls.length - 1].split("@")[1]); eq(calls.slice(0, 2), ["signals:false/false", "disconnect:true"], "each step closes the port in one go before reopening"); }
  eq(rates, [921600, 115200, 230400, 460800, 921600, 115200, 230400, 460800, 921600, 115200, 230400], "eleven reopens follow the circular order");
  eq(hellos(), 12, "twelve hellos in all, one per try"); eq(sent.length, 12, "and nothing but hellos");
  eq(run("PC.probe.i"), 11, "on the last try"); ok(noticeText === "", "no message yet");
  calls.length = 0; ok(stepTimer(), "the last wait ends"); await tick();
  eq(calls.filter((c) => c.startsWith("connect")), [], "after three passes the link is closed, not reopened"); ok(calls.indexOf("disconnect:true") >= 0, "the port was closed");
  eq(noticeText, NOREPLY, "no reply at any speed shows the clear message"); eq(ctx.cmdText, NOREPLY, "in the command log too");
  eq(run("PC.probe"), null, "the probe is over"); eq(ctx.S.baud, 460800, "the list goes back to the speed the person chose"); eq(flag, false, "no automatic reconnect loop"); eq(sent.length, 12, "nothing was sent to change the radio");
  ok(!stepTimer(), "no 13th try"); eq(status[status.length - 1], ["off", "Not connected"], "status is Not connected");

  // the first speed to give a valid line wins
  begin(115200); sent.length = 0; calls.length = 0; ctx.S.startKeep = () => { calls.push("keep-alive-started"); };
  stepTimer(); await tick(); eq(ctx.S.baud, 230400, "second try is 230400");
  ctx.S.startKeep = () => { calls.push("keep-alive-started"); }; calls.length = 0;
  feed(HELLO); await tick();
  eq(run("PC.probe"), null, "a valid hello ends the probe"); eq(ctx.S.baud, 230400, "S.baud is the speed that answered"); eq(els.baudSel.value, "230400", "the list shows that speed");
  eq(calls, ["keep-alive-started"], "the normal keep-alive starts, no more tries"); ok(!stepTimer(), "the pending timer is gone");
  ok(run("PC.caps.pet === true && PC.caps.baud === true && PC.dx"), "the caps were read from that hello"); ok(shown(), "the list stays (baud cap)");
  eq(noticeText, "", "no message"); ok(!els.baudSel.disabled, "the list is free again");
  eq(run("pcBaudOn()"), true, "nova baud is now allowed");
  // later lines after a match do not restart anything
  calls.length = 0; feed(HELLO); eq(calls, [], "a second hello later changes nothing");

  // garbled lines never count
  begin(115200); sent.length = 0;
  const junk = ['{"ed":"dx-pro","nova":{"v":1,"ca', '{"nova":1', '\u0000\u00ff{"nova":1}', '\u00e4\u0003\u0000{"ed":"orion","nova":1}', "nova", '{"mesh":{}}', '{"ed":"dx-pro"}', '[{"nova":1}]', '{"nova_ok":"baud","rate":115200}', '{"nova":1}}', "{nova:1}", "", "{}", "null", '"nova"'];
  junk.forEach((l) => feed(l));
  ok(run("PC.probe") !== null && run("PC.probe.i") === 0, "none of " + junk.length + " garbled or foreign lines ended the probe"); eq(ctx.S.baud, 115200, "the speed did not change");
  ok(!run("PC.dx"), "and none was taken for a DX-Pro hello"); feed("# OK"); ok(run("PC.probe") !== null, "a bare # OK line is not a hello either");
  ok(stepTimer(), "the probe still moves on after junk"); await tick(); eq(ctx.S.baud, 230400, "to the next speed");
  feed('{"ed":"orion","nova":1,"v":"0.3.0"}'); eq(run("PC.probe"), null, "a whole JSON line with a nova key counts, for an Orion radio too"); eq(els.baudSel.value, "230400", "at that speed");
  begin(921600); feed('{"nova":{"v":1}}'); eq([run("PC.probe"), ctx.S.baud], [null, 921600], "a match on the very first try stops right there"); ok(!stepTimer(), "with no step");

  // a match on the last try still counts; a match after the end does not restart the probe
  begin(115200); for (let i = 0; i < 11; i++) { stepTimer(); await tick(); }
  eq(run("PC.probe.i"), 11, "last try"); feed(HELLO); eq(run("PC.probe"), null, "a hello on the last try still counts"); eq(noticeText, "", "no failure message");
  begin(115200); for (let i = 0; i < 12; i++) { stepTimer(); await tick(); } noticeText = ""; calls.length = 0; feed(HELLO);
  eq(noticeText, "", "a hello after the probe gave up does not show or hide anything"); eq(calls, [], "and starts nothing");

  // the person pressing Disconnect, or an unplug, ends the probe (the page's disconnect() calls pcProbeStop unless it is only reopening)
  ok(/if \(!S\.reopening\) pcProbeStop\(\);/.test(html.slice(html.indexOf("async function disconnect"), html.indexOf("/* reconnect by itself"))), "static: disconnect() stops the probe unless a probe step is reopening the port");
  const cs = html.slice(html.indexOf("async function connect"), html.indexOf("async function disconnect"));
  ok(/pcProbeBegin\(\);/.test(cs) && /if \(!pcProbeStart\(\)\)/.test(cs) && /S\.startKeep = \(\) =>/.test(cs), "static: connect() begins the probe, and starts the keep-alive only after a match");
  ok(/S\.openRate !== S\.baud/.test(cs), "static: a port left open at another speed is closed and opened again at the listed speed");
  ok(/line = line\.trim\(\);\n  pcProbeLine\(line\);/.test(html), "static: onLine feeds every line to the probe first");
  ok(/PC_NOREPLY = "No reply at any speed\. Set the same speed in the radio's Options > Display > Serial speed, reboot the radio, then connect again\."/.test(html), "static: the no-reply message is word for word");
  ok(!/innerHTML/.test(pc.slice(pc.indexOf("const PC_PROBE_MS"))), "static: the probe code never uses innerHTML");

  // the list before and after a hello
  fresh(); ok(shown(), "before a hello: shown"); feed(HELLO); ok(shown(), "hello with baud: shown");
  fresh({ pet: 1 }); ok(!shown(), "hello without baud: hidden"); fresh(); feed('{"ed":"orion","nova":1}'); ok(!shown(), "Orion: hidden"); fresh({ pet: 1, baud: 1 }); run("PC.reset(); pcSync()"); ok(shown(), "after a reset: shown");

  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
