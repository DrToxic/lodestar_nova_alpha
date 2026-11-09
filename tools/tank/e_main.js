
/* ============================================================ building, updating, drawing the tank */
const KEYS = Object.keys(SPECIES); KEYS.forEach((k) => { SPECIES[k].key = k; });
function reefPick(n) { const out = [], tot = REEF.reduce((a, s) => a + s.w, 0); while (out.length < n) { let r = Math.random() * tot; for (const s of REEF) { r -= s.w; if (r <= 0) { out.push(s); break; } } } return out; }

function build(newSeed) {
  if (newSeed || !T.seed) T.seed = (Math.random() * 4294967295) >>> 0;
  T.rs = mulberry(T.seed); buildScene(); T.pat = null;
  if (!T.sprites) T.sprites = { sardine: makeSprite("sardine"), chromis: makeSprite("chromis"), fusilier: makeSprite("fusilier") };
}
function populate() {
  const n = rint(2, 5), scale = n >= 4 ? 0.62 : n === 3 ? 0.72 : 0.85;
  T.sharkKeys = pickSpecies(n); T.sharks = T.sharkKeys.map((k, i) => { const s = newShark(k, scale, i); if (k === "whale") s.L *= 0.8; return s; });
  T.fish = []; reefPick(rint(9, 12)).forEach((sp) => {
    if (sp.home && T.anem.length) { const a = pick(T.anem); T.fish.push(newReef(sp, a.x + rnd(-14, 14), a.y - a.r * 0.8)); }
    else { const x = rnd(80, W - 80); T.fish.push(newReef(sp, x, rnd(WATER + 160, floorY(x) - 40))); }
  });
  T.fish.forEach((f) => { if (f.sp.home) { f.hx = f.x; f.hy = f.y; } });
  T.schools = []; T.chum = []; T.parts = []; T.bubbles = []; T.boat = null; T.gulls = []; T.divers = []; T.extras = []; T.jelly = []; T.flakes = [];
  T.crabs = [newCrab()]; if (Math.random() < 0.5) T.crabs.push(newCrab());
  for (let i = 0, k = rint(0, 2); i < k; i++) startJelly();
  T.snow = Array.from({ length: 70 }, () => ({ x: rnd(0, W), y: rnd(WATER, 640), r: rnd(1, 2.2), v: rnd(4, 12), ph: rnd(0, 6) }));
  T.nextSchool = 5; T.nextRare = rnd(50, 110); T.nextDiver = rnd(160, 320); T.nextBird = rnd(40, 90); T.chestOpen = 0; T.chestTarget = 0;
  T.vent = rnd(60, W - 60);
}

function update(dt) {
  T.time += dt;
  if (Math.floor(T.time / 30) !== T.dayTick) { T.dayTick = Math.floor(T.time / 30); DAY = daylight(); if (Math.floor(DAY.h * 2) !== T.lightBucket) T.needRebuild = true; }
  T.clarity += (T.clarityT - T.clarity) * Math.min(1, dt * 0.5);
  T.cur = Math.sin(T.time * 0.3) * 3;
  /* the creatures */
  for (const s of T.sharks) { sharkThink(s, dt); sharkMove(s, dt); }
  for (const q of T.sharks.concat(T.fish)) { if (q.z === undefined) { q.z = rnd(0, 0.7); q.zt = q.z; } if (Math.random() < dt * 0.04) q.zt = rnd(0, 0.7); q.z += (q.zt - q.z) * Math.min(1, dt * 0.3); }
  T.camx = (T.camx || 0) + (Math.sin(T.time * 0.15) + (T.mouse ? (0.5 - T.mouse.x / W) * 2 : 0) - (T.camx || 0)) * Math.min(1, dt * 1.5);
  for (const f of T.fish) reefThink(f, dt);
  for (let i = T.schools.length - 1; i >= 0; i--) { schoolStep(T.schools[i], dt); if (!T.schools[i].m.length) T.schools.splice(i, 1); }
  for (let i = T.extras.length - 1; i >= 0; i--) { const e = T.extras[i]; e.t += dt; e.x += e.dir * e.v * dt; e.ph += dt * (e.kind === "manta" ? 2.2 : 2); e.y += Math.sin(e.t * 0.5) * 6 * dt; if (e.x < -260 || e.x > W + 260) T.extras.splice(i, 1); }
  for (const j of T.jelly) { j.ph += dt * 2.2; j.y += Math.sin(j.ph) * 9 * dt - 1.5 * dt; j.x += j.vx * dt; if (j.y < WATER + 60) j.y += 12 * dt; if (j.y > 560) j.y -= 14 * dt; if (j.x < 40 || j.x > W - 40) j.vx = -j.vx; }
  for (const c of T.crabs) { c.wait -= dt; if (c.wait <= 0) { c.walk = rnd(0.8, 2); c.wait = rnd(3, 9); c.dir = pickSign(); } if (c.walk > 0) { c.walk -= dt; c.x = clamp(c.x + c.dir * 22 * dt, 40, W - 40); c.ph += dt * 14; } }
  for (let i = T.divers.length - 1; i >= 0; i--) {
    const d = T.divers[i]; d.ph += dt * 3.2; d.x += d.dir * 30 * dt; d.y += (d.ty - d.y) * dt * 0.3; if (Math.random() < dt * 0.1) d.ty = rnd(200, 480);
    d.fs += (d.dir - d.fs) * Math.min(1, dt * 5); d.flash = Math.max(0, d.flash - dt * 2.5); d.nextFlash -= dt; if (d.nextFlash <= 0) { d.flash = 1; d.nextFlash = rnd(5, 11); }
    d.nextBubble -= dt; if (d.nextBubble <= 0) { d.nextBubble = rnd(0.9, 1.8); for (let k = 0; k < 3; k++) T.bubbles.push({ x: d.x + d.dir * 52 + rnd(-3, 3), y: d.y - 6, r: rnd(2, 4.5), vy: rnd(36, 64), ph: rnd(0, 6) }); }
    if ((d.dir > 0 && d.x > W + 130) || (d.dir < 0 && d.x < -130)) T.divers.splice(i, 1);
  }
  /* chum and food flakes */
  for (let i = T.chum.length - 1; i >= 0; i--) { const c = T.chum[i]; c.age += dt; c.ph += dt; const fl = floorY(c.x) - 3; if (c.y < fl) { c.y += c.vy * dt; c.x += Math.sin(c.age * 1.3 + c.kind) * 6 * dt + c.vx * dt * 0.3; if (Math.random() < dt * 0.4) T.parts.push({ k: "cloud", x: c.x, y: c.y, vx: 0, vy: 0, r: 3, g: 8, life: 0, max: 1.6, col: [190, 60, 66] }); } if (c.age > 38) T.chum.splice(i, 1); }
  for (let i = T.flakes.length - 1; i >= 0; i--) { const f = T.flakes[i]; f.y += 24 * dt; f.x += Math.sin(T.time * 2 + f.ph) * 8 * dt; if (f.y > floorY(f.x) - 4 || f.y > 600) T.flakes.splice(i, 1); }
  boatStep(dt); gullStep(dt);
  /* particles and bubbles */
  for (let i = T.parts.length - 1; i >= 0; i--) { const p = T.parts[i]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.k === "drop") { p.vy += 260 * dt; if (p.y > WATER + 2) p.life = p.max; } else if (p.k !== "cloud") p.vy += 10 * dt; if (p.life >= p.max) T.parts.splice(i, 1); }
  if (T.parts.length > 260) T.parts.splice(0, T.parts.length - 260);
  if (Math.random() < dt * 1.1) T.bubbles.push({ x: T.vent + rnd(-4, 4), y: floorY(T.vent) - 4, r: rnd(1.5, 3.5), vy: rnd(24, 46), ph: rnd(0, 6) });
  if (T.chestOpen > 0.02 || T.chestTarget) {
    T.chestOpen += (T.chestTarget - T.chestOpen) * Math.min(1, dt * 4); T.chestTimer = (T.chestTimer || 0) - dt;
    if (T.chestTarget) { if (Math.random() < dt * 8) T.bubbles.push({ x: T.chest.x + rnd(-18, 18), y: T.chest.y - 36, r: rnd(1.5, 3.5), vy: rnd(40, 80), ph: rnd(0, 6) }); if (Math.random() < dt * 5) T.parts.push({ k: "glint", x: T.chest.x + rnd(-22, 22), y: T.chest.y - rnd(30, 60), vx: 0, vy: -rnd(10, 30), r: rnd(1.5, 2.6), life: 0, max: 0.9, col: [255, 230, 120], ph: rnd(0, 6) }); if (T.chestTimer <= 0) T.chestTarget = 0; }
  }
  if (T.bubbles.length > 160) T.bubbles.splice(0, T.bubbles.length - 160);
  for (let i = T.bubbles.length - 1; i >= 0; i--) { const b = T.bubbles[i]; b.y -= b.vy * dt; b.ph += dt * 4; b.vy += dt * 6; if (b.y < WATER + 2) T.bubbles.splice(i, 1); }
  for (const s of T.snow) { s.y += s.v * dt; s.x += Math.sin(T.time * 0.5 + s.ph) * 6 * dt; if (s.y > 650) { s.y = WATER + 4; s.x = rnd(0, W); } }
  for (const c of T.clouds) { c.x += c.v * dt; if (c.x > W + 80) c.x = -80; }
  /* the schedule of visitors */
  T.nextSchool -= dt; if (T.nextSchool <= 0 && T.schools.length < 2) { T.nextSchool = rnd(25, 50); startSchool(pick(["sardine", "chromis", "fusilier"]), rint(24, 42)); } else if (T.nextSchool <= 0) T.nextSchool = 10;
  T.nextRare -= dt; if (T.nextRare <= 0) { T.nextRare = rnd(70, 150); if (!T.extras.length) startExtra(Math.random() < 0.5 ? "manta" : "turtle"); }
  T.nextDiver -= dt; if (T.nextDiver <= 0) { T.nextDiver = rnd(200, 420); if (!T.divers.length) { startDiver(); if (Math.random() < 0.25) setTimeout(startDiver, 4000); } }
  T.nextBird -= dt; if (T.nextBird <= 0) { T.nextBird = rnd(50, 100); if (!T.boat) T.gulls.push({ x: Math.random() < 0.5 ? -30 : W + 30, y: rnd(14, 50), ph: 0, follow: false, vx: Math.random() < 0.5 ? 60 : -60 }); }
  if (T.jelly.length < 2 && Math.random() < dt * 0.01) startJelly();
  if (T.boat && !T.boatSchool && T.boat.dropped > 4) { T.boatSchool = true; if (Math.random() < 0.55 && T.schools.length < 3) startSchool("sardine", rint(26, 40), { x: T.boat.x - T.boat.dir * 60 }); }
  if (!T.boat) T.boatSchool = false;
}

const dsc = (q) => 1.1 - 0.24 * (q.z || 0);
function layer(g, img, dx, sx) { g.save(); g.translate(W / 2 + dx, 0); g.scale(sx || 1, 1); g.translate(-W / 2, 0); g.drawImage(img, 0, 0, W, H); g.restore(); }
function shadow(g, x, y, w) {
  const fy = floorY(x) + 12, a = 0.34 * clamp(1 - (fy - y) / 520, 0, 1); if (a < 0.02) return;
  g.save(); g.translate(x, fy); g.scale(1, 0.15); g.fillStyle = rg(g, 0, 0, 0, w, [[0, "rgba(0,14,26," + a + ")"], [0.55, "rgba(0,14,26," + a * 0.55 + ")"], [1, "rgba(0,14,26,0)"]]); g.beginPath(); g.arc(0, 0, w, 0, TAU); g.fill(); g.restore();
}
function inDepth(g, q, fn) { const sc = dsc(q); g.save(); g.translate(q.x, q.y); g.scale(sc, sc); g.translate(-q.x, -q.y); g.globalAlpha = 1 - 0.2 * (q.z || 0); fn(); g.restore(); }
function draw() {
  const g = T.g, K = T.K; g.setTransform(K, 0, 0, K, 0, 0); g.clearRect(0, 0, W, H);
  const L = T.lay, wk = T.wreck, c = T.camx || 0;
  drawSky(g);
  layer(g, L.bg, c * 5, 1.03);
  drawRays(g);
  layer(g, L.mid, c * 2.5, 1.012);
  drawCaustics(g);
  drawSnow(g);
  /* contact shadows on the sand: softer and fainter the higher the creature swims */
  T.sharks.forEach((s) => { if (s.lane === 0) shadow(g, s.x, s.y, s.L * 0.5 * dsc(s)); });
  T.fish.forEach((f) => shadow(g, f.x, f.y, f.L * 0.7 * dsc(f)));
  T.extras.forEach((e) => shadow(g, e.x, e.y, e.kind === "manta" ? 110 : 55));
  T.divers.forEach((d) => shadow(g, d.x, d.y, 55));
  T.extras.forEach((e) => { if (e.kind === "manta") drawManta(g, e); else drawTurtle(g, e); });
  g.drawImage(wk.back, wk.x, wk.y, wk.WW, wk.WH);
  T.sharks.forEach((s) => { if (s.lane === 1) drawShark(g, s); });
  g.drawImage(wk.front, wk.x, wk.y, wk.WW, wk.WH);
  g.save(); g.translate(-c * 5, 0);
  g.drawImage(L.fore, 0, 0, W, H);
  drawGrass(g);
  drawChest(g, T.chest.x, T.chest.y, T.chestOpen);
  T.crabs.forEach((cr) => { shadow(g, cr.x, floorY(cr.x) - 4, 20); drawCrab(g, cr); });
  g.restore();
  T.schools.forEach((s) => drawSchool(g, s));
  T.jelly.forEach((j) => drawJelly(g, j));
  /* sharks and reef fish together, far ones first */
  const crowd = T.fish.map((q) => [q, 0]).concat(T.sharks.filter((s) => s.lane === 0).map((q) => [q, 1])).sort((a, b) => (b[0].z || 0) - (a[0].z || 0));
  crowd.forEach((p) => inDepth(g, p[0], () => (p[1] ? drawShark(g, p[0]) : drawReef(g, p[0]))));
  T.divers.forEach((d) => drawDiver(g, d));
  drawChumBits(g);
  T.flakes.forEach((f) => { g.fillStyle = "#d8b878"; g.fillRect(f.x, f.y, 3, 2); });
  drawParts(g); drawBubbles(g);
  g.save(); g.translate(-c * 9, 0); g.drawImage(L.fg, 0, 0, W, H); g.restore();
  drawSurface(g); T.gulls.forEach((q) => drawGull(g, q)); drawBoat(g);
  const mu = (1 - T.clarity) * 0.5; if (mu > 0.01) { g.fillStyle = "rgba(60,80,40," + mu + ")"; g.fillRect(0, WATER, W, H - WATER); }
  g.fillStyle = rg(g, W / 2, H * 0.55, H * 0.35, W * 0.72, [[0, "rgba(0,0,0,0)"], [1, "rgba(0,8,20,.5)"]]); g.fillRect(0, WATER, W, H);
  if (DAY.night) { g.fillStyle = "rgba(0,6,24,.18)"; g.fillRect(0, WATER, W, H); }
  g.font = "600 13px system-ui, sans-serif"; g.textAlign = "right"; const msg = T.boat ? "Chum boat overhead" : "Chum boat in " + Math.max(0, T.need - T.hears) + " hears";
  g.fillStyle = "rgba(0,10,25,.55)"; const tw = g.measureText(msg).width; g.fillRect(W - tw - 26, WATER + 10, tw + 16, 22); g.fillStyle = "#e8f6ff"; g.fillText(msg, W - 18, WATER + 26); g.textAlign = "left";
}

/* ---------- loop ---------- */
function loop(ts) {
  T.raf = 0; if (!T.on) return;
  if (!T.last) T.last = ts; let dt = (ts - T.last) / 1000; T.last = ts;
  if (document.hidden) { T.raf = requestAnimationFrame(loop); return; }
  T.acc += dt; if (T.acc >= 1 / 30) {
    const step = Math.min(T.acc, 0.066); T.acc = 0;
    if (T.needRebuild) { T.needRebuild = false; build(false); }
    if (!T.paused) update(step);
    draw(); caption();
  }
  T.raf = requestAnimationFrame(loop);
}
function startLoop() { if (T.raf || !T.on) return; T.last = 0; T.raf = requestAnimationFrame(loop); }
function stopLoop() { if (T.raf) cancelAnimationFrame(T.raf); T.raf = 0; }

/* ---------- sizing ---------- */
function sizeCanvas() {
  const cv = T.cv; const cssW = cv.clientWidth || 800; const dpr = window.devicePixelRatio || 1;
  const K = clamp(Math.round((cssW * dpr / W) * 4) / 4, 0.5, 1.25);
  if (K !== T.K || !T.g) { T.K = K; cv.width = Math.round(W * K); cv.height = Math.round(H * K); T.g = cv.getContext("2d"); if (T.rs !== null) { build(false); } }
  const st = $("tkStage"); document.documentElement.style.setProperty("--tkH", Math.round(st.getBoundingClientRect().height) + "px");
}

/* ---------- data from the radio ---------- */
const HK = { age: {}, meshIdx: 0, mnaHit: 0, lastLink: 0 };
function hear(n) { if (!T.on && !T.ready) return; T.hears += n || 1; if (T.hears >= T.need) { T.hears = 0; T.need = rint(30, 40); const nm = T.boatName || ""; startBoat(nm); } }
function dataFrame(f, ts) {
  if (!f) return;
  const links = Array.isArray(f.links) ? f.links : [];
  const best = links.reduce((a, l) => Math.max(a, N(l.sc)), 0);
  T.clarityT = links.length ? 0.5 + 0.5 * clamp(best / 100, 0, 1) : 0.55;
  const bl = links.find((l) => l.best) || links[0]; T.boatName = bl && typeof bl.name === "string" ? bl.name : "";
  const live = !ts || Date.now() - ts < 4000;
  const dl = N(f.dl); if (live && T.ready && HK.dl !== undefined && dl > HK.dl) { T.chestTarget = 1; T.chestTimer = 7; } HK.dl = dl;
  links.forEach((l) => { const id = String(l.id), a = N(l.age), p = HK.age[id]; HK.age[id] = a; if (live && p !== undefined && a < p - 0.5 && Date.now() - HK.mnaHit > 60000) { HK.lastLink = Date.now(); hear(1); } });
}
function dataMesh() {
  const recs = MESH.recs; if (HK.meshIdx > recs.length) HK.meshIdx = 0;
  for (let i = HK.meshIdx; i < recs.length; i++) {
    const r = recs[i]; if (r.tx || !r.src) continue; let rep = false;
    S.found.forEach((n) => { if (!rep && n.t === 2 && typeof n.k === "string" && n.k.toLowerCase().startsWith(r.src)) rep = true; });
    if (rep) { HK.mnaHit = Date.now(); hear(1); }
  }
  HK.meshIdx = recs.length;
}
function wrap(name, fn) { const orig = window[name]; if (typeof orig !== "function") return; window[name] = function () { const r = orig.apply(this, arguments); try { fn.apply(null, arguments); } catch (e) { /* the tank must never disturb the data */ } return r; }; }
wrap("onFrame", dataFrame); wrap("onMeshLine", dataMesh);
wrap("onFound", (f) => { if (T.ready && f && T.jelly.length < 4 && Math.random() < 0.5) startJelly(); });

/* ---------- captions and tooltips ---------- */
let capAt = 0;
function caption() {
  const now = performance.now(); if (now - capAt < 500) return; capAt = now;
  const src = Date.now() - HK.mnaHit < 60000 ? "Mesh Network Analyzer packets" : "repeater list";
  const el = $("tkCap"); if (el) el.textContent = (T.boat ? "A chum boat is out. " : "") + "Next chum boat after " + Math.max(0, T.need - T.hears) + " more repeater hears (counted from the " + src + "). Boats so far: " + T.boats + ".";
  const w = $("tkWho"); if (w && T.sharkKeys && w.dataset.k !== T.sharkKeys.join()) { w.dataset.k = T.sharkKeys.join(); w.textContent = "In this tank: " + T.sharkKeys.map((k) => SPECIES[k].name + " (" + SPECIES[k].info + ")").join(", ") + "."; }
}
function logical(ev) { const r = T.cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) / r.width * W, y: (ev.clientY - r.top) / r.height * H, px: ev.clientX - r.left, py: ev.clientY - r.top, w: r.width }; }
function bindPointer() {
  const cv = T.cv, tip = $("tkTip");
  cv.addEventListener("pointermove", (ev) => {
    const p = logical(ev); T.mouse = { x: p.x, y: p.y }; let txt = "";
    for (const s of T.sharks) { if (Math.hypot(s.x - p.x, s.y - p.y) < s.L * 0.3) { txt = s.sp.name + " – " + s.sp.info + " – " + ({ cruise: "cruising", chum: "feeding", chase: "hunting", wreck: "exploring the wreck", rest: "resting" }[s.state] || ""); break; } }
    if (!txt) for (const f of T.fish) { if (Math.hypot(f.x - p.x, f.y - p.y) < f.L * 0.6) { txt = f.sp.n; break; } }
    if (!txt) for (const e of T.extras) { if (Math.hypot(e.x - p.x, e.y - p.y) < 90) { txt = e.kind === "manta" ? "Manta ray" : "Green sea turtle"; break; } }
    if (!txt) for (const d of T.divers) { if (Math.hypot(d.x - p.x, d.y - p.y) < 60) { txt = "Scuba diver"; break; } }
    if (txt) { tip.hidden = false; tip.textContent = txt; tip.style.left = Math.min(p.px + 14, p.w - 200) + "px"; tip.style.top = Math.max(0, p.py - 30) + "px"; } else tip.hidden = true;
  });
  cv.addEventListener("pointerleave", () => { T.mouse = null; tip.hidden = true; });
  cv.addEventListener("click", (ev) => { const p = logical(ev); for (let i = 0; i < 7; i++) T.flakes.push({ x: p.x + rnd(-20, 20), y: Math.max(WATER + 4, p.y) + rnd(-6, 6), ph: rnd(0, 6) }); });
}

/* ---------- bringing it up and down ---------- */
function startTank() {
  if (!T.cv) { T.cv = $("tankCv"); bindPointer(); window.addEventListener("resize", () => { clearTimeout(T.rz); T.rz = setTimeout(() => { if (T.on) sizeCanvas(); }, 200); }); if (window.ResizeObserver) new ResizeObserver(() => { if (T.on && T.cv.clientWidth) { clearTimeout(T.rz); T.rz = setTimeout(sizeCanvas, 120); } }).observe($("tkStage")); document.addEventListener("visibilitychange", () => { T.last = 0; }); }
  T.on = true;
  if (!T.ready) { T.rs = null; sizeCanvas(); build(true); populate(); T.ready = true; if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) { T.paused = true; $("tkPause").textContent = "Play"; } }
  else sizeCanvas();
  draw(); startLoop();
}
function stopTank() { T.on = false; stopLoop(); }
function newTank() { build(true); populate(); T.hears = 0; T.need = rint(30, 40); draw(); }
window.__tank = { newShark, SPECIES, drawShark, T, hear, startBoat, startDiver, startExtra, startSchool, newTank, update, draw, sizeCanvas, addChum };

/* ---------- the view switcher ---------- */
let VIEW = "pet"; const moved = [];
function toSide(node, side) { if (!node || node.parentNode === side) return; const ph = document.createComment("tank-ph"); node.parentNode.insertBefore(ph, node); moved.push([node, ph]); side.appendChild(node); }
function restore() { while (moved.length) { const m = moved.pop(); if (m[1].parentNode) { m[1].parentNode.insertBefore(m[0], m[1]); m[1].remove(); } } }
function setView(v, save) {
  if (v !== "none" && v !== "pet" && v !== "tank") v = "pet";
  VIEW = v; if (save !== false) { try { localStorage.setItem("lodestar-top", v); } catch (e) { /* private window */ } }
  document.querySelectorAll("#viewSeg button").forEach((b) => { const on = b.dataset.view === v; b.setAttribute("aria-checked", on ? "true" : "false"); b.tabIndex = on ? 0 : -1; b.classList.toggle("on", on); });
  document.body.classList.toggle("no-petpanel", v !== "pet");
  const tp = $("tankPanel"), wrapEl = document.querySelector(".wrap");
  if (v === "tank") {
    tp.hidden = false; wrapEl.classList.add("tank-wide");
    const grid = document.querySelector(".wrap > .grid"), cols = grid.querySelectorAll(":scope > .col");
    toSide(document.querySelector(".readouts"), $("tankL")); toSide(cols[0], $("tankL")); toSide($("meshPanel"), $("tankR")); toSide(cols[1], $("tankR")); grid.hidden = true;
    requestAnimationFrame(() => { startTank(); try { window.dispatchEvent(new Event("resize")); render(); if (S.map) S.map.invalidateSize(); if (typeof meshDraw === "function") meshDraw(); } catch (e) { /* later */ } });
  } else {
    stopTank(); tp.hidden = true; wrapEl.classList.remove("tank-wide"); restore(); document.querySelector(".wrap > .grid").hidden = false;
    requestAnimationFrame(() => { try { window.dispatchEvent(new Event("resize")); render(); if (S.map) S.map.invalidateSize(); } catch (e) { /* later */ } });
  }
  const note = $("viewNote"); if (note) note.textContent = v === "tank" ? "Live data sits in the side panels. Scroll them if they are long." : v === "none" ? "" : "";
}
function initUI() {
  document.querySelectorAll("#viewSeg button").forEach((b) => { b.addEventListener("click", () => setView(b.dataset.view)); b.addEventListener("keydown", (ev) => { const bs = [...document.querySelectorAll("#viewSeg button")], i = bs.indexOf(b); let j = -1; if (ev.key === "ArrowRight" || ev.key === "ArrowDown") j = (i + 1) % bs.length; else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") j = (i + bs.length - 1) % bs.length; if (j >= 0) { ev.preventDefault(); bs[j].focus(); setView(bs[j].dataset.view); } }); });
  $("tkPause").addEventListener("click", () => { T.paused = !T.paused; $("tkPause").textContent = T.paused ? "Play" : "Pause"; });
  $("tkNew").addEventListener("click", newTank);
  $("tkSave").addEventListener("click", () => { T.cv.toBlob((b) => { if (!b) return; const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "lodestar-shark-tank.png"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); }); });
  const fs = $("tkFull"); if (!document.fullscreenEnabled) fs.hidden = true; else fs.addEventListener("click", () => { const e = $("tkStage"); if (document.fullscreenElement) document.exitFullscreen(); else e.requestFullscreen().then(() => setTimeout(sizeCanvas, 200)).catch(() => {}); });
  const bp = $("btnPet"); if (bp) bp.addEventListener("click", () => { if (VIEW !== "pet") setView("pet"); }, true);
  // the standard dashboard puts the pet back on the radio's OLED (once per page load; harmless on radios without the radar)
  let tacOff = false;
  const orig = window.petAsk; if (typeof orig === "function") window.petAsk = function () { if (!tacOff && S.orion) { tacOff = true; try { send("nova tac 0"); } catch (e) { /* not connected */ } } if (VIEW === "pet") return orig.apply(this, arguments); };
  let v = "pet"; try { v = localStorage.getItem("lodestar-top") || "pet"; } catch (e) { /* none */ }
  setView(v, false);
}
window.__setTopView = setView;
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initUI); else initUI();
})();/*TANK-END*/
