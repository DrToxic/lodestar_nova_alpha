
/* ============================================================ sharks */
const SPECIES = {
  great:    { name: "Great white shark", info: "up to 6 m", L: 300, hw: 0.118, peak: 0.27, nose: 0.62, top: [96, 112, 128], belly: [240, 244, 246], split: 0.53, dors: 1.0, pec: 1.0, spd: 60, band: [0.22, 0.7], eye: 0.012, gill: 5, w: 4 },
  hammer:   { name: "Scalloped hammerhead", info: "up to 4 m", L: 235, hw: 0.088, peak: 0.28, nose: 0.5, top: [110, 118, 104], belly: [226, 228, 214], split: 0.55, dors: 1.25, pec: 1.0, spd: 66, band: [0.2, 0.62], hammer: true, eye: 0.01, gill: 5, w: 3 },
  tiger:    { name: "Tiger shark", info: "up to 5 m", L: 285, hw: 0.122, peak: 0.28, nose: 0.34, top: [104, 124, 124], belly: [226, 226, 208], split: 0.56, dors: 0.95, pec: 1.1, spd: 54, band: [0.3, 0.8], stripes: true, eye: 0.011, gill: 5, w: 3 },
  bull:     { name: "Bull shark", info: "up to 3.5 m", L: 215, hw: 0.135, peak: 0.3, nose: 0.28, top: [112, 120, 128], belly: [232, 234, 236], split: 0.55, dors: 1.0, pec: 1.0, spd: 62, band: [0.4, 0.85], eye: 0.009, gill: 5, w: 4 },
  blacktip: { name: "Blacktip reef shark", info: "up to 1.8 m", L: 150, hw: 0.092, peak: 0.28, nose: 0.55, top: [128, 118, 100], belly: [240, 238, 228], split: 0.55, dors: 1.0, pec: 1.0, spd: 74, band: [0.35, 0.9], tips: true, eye: 0.012, gill: 5, w: 5 },
  nurse:    { name: "Nurse shark", info: "up to 3 m", L: 190, hw: 0.095, peak: 0.3, nose: 0.2, top: [150, 114, 76], belly: [200, 170, 126], split: 0.62, dors: 0.8, pec: 1.2, spd: 30, band: [0.78, 0.98], eye: 0.006, gill: 5, barbels: true, rest: true, w: 3 },
  lemon:    { name: "Lemon shark", info: "up to 3.4 m", L: 205, hw: 0.11, peak: 0.3, nose: 0.3, top: [168, 150, 88], belly: [232, 220, 170], split: 0.56, dors: 1.0, pec: 1.0, spd: 46, band: [0.5, 0.9], twin: true, eye: 0.009, gill: 5, w: 4 },
  whale:    { name: "Whale shark", info: "up to 12 m", L: 400, hw: 0.1, peak: 0.3, nose: 0.2, top: [70, 96, 128], belly: [196, 214, 220], split: 0.64, dors: 0.7, pec: 1.0, spd: 24, band: [0.25, 0.55], spots: true, eye: 0.004, gill: 5, nowreck: true, rare: true, w: 1 },
};
function pickSpecies(n) {
  const keys = Object.keys(SPECIES), out = [];
  while (out.length < n) { const tot = keys.reduce((a, k) => a + (out.includes(k) ? 0 : SPECIES[k].w), 0); let r = Math.random() * tot; for (const k of keys) { if (out.includes(k)) continue; r -= SPECIES[k].w; if (r <= 0) { out.push(k); break; } } }
  return out;
}
function newShark(key, scale, i) {
  const sp = SPECIES[key], L = sp.L * scale * rnd(0.92, 1.08);
  const x = rnd(120, W - 120), y = rnd(WATER + 120, 500);
  return { key, sp, L, x, y, vx: rnd(-1, 1) * 30 || 20, vy: 0, face: 1, fs: 1, ph: rnd(0, 6), state: "cruise", tx: x, ty: y, path: [], lane: 0, laneT: 0, pitch: 0, bite: 0, fed: 0, calm: 0, rest: 0, cool: rnd(5, 20), t: 0, timer: 0, sid: i,
    spots: sp.spots ? Array.from({ length: 70 }, () => [rnd(0.1, 0.85), rnd(-0.85, 0.7), rnd(0.012, 0.03)]) : null, flinch: 0, hungryAt: 0 };
}
function pickWaypoint(s) {
  const sp = s.sp, lo = WATER + 70 + s.sp.band[0] * (floorY(W / 2) - WATER - 130), hi = WATER + 70 + sp.band[1] * (floorY(W / 2) - WATER - 130);
  s.tx = rnd(90, W - 90); s.ty = rnd(lo, hi); s.timer = rnd(8, 18);
  if (Math.abs(s.tx - s.x) < 250) s.tx = s.x + (s.x > W / 2 ? -1 : 1) * rnd(300, 500);
  s.tx = clamp(s.tx, 80, W - 80);
}
function planWreck(s) {
  const w = T.wreck, hs = w.holes; if (!w || s.sp.nowreck) return false;
  const left = s.x < w.x + w.WW / 2, order = left ? [1, 0, 3, 2] : [2, 3, 0, 1];
  const use = order.filter((i) => Math.random() < (i === 0 || i === 1 ? 1 : 0.55)); if (!use.length) use.push(0);
  const stageIn = { x: left ? w.box.x0 - 190 : w.box.x1 + 190, y: hs[use[0]].y }, stageOut = { x: left ? w.box.x1 + 200 : w.box.x0 - 200, y: hs[use[use.length - 1]].y + rnd(-30, 20) };
  stageIn.x = clamp(stageIn.x, 70, W - 70); stageOut.x = clamp(stageOut.x, 70, W - 70);
  s.path = [stageIn].concat(use.map((i) => ({ x: hs[i].x, y: hs[i].y + rnd(-5, 5), hole: i }))).concat([stageOut]);
  s.state = "wreck"; s.pi = 0; s.timer = 60; s.tx = s.path[0].x; s.ty = s.path[0].y;
  return true;
}
function sharkThink(s, dt) {
  s.t += dt; s.cool -= dt; s.timer -= dt; s.bite = Math.max(0, s.bite - dt * 2.6); s.flinch = Math.max(0, s.flinch - dt);
  const chumNear = T.chum.length && s.fed < 4 && s.calm <= 0;
  if (s.state === "cruise") {
    if (chumNear) { s.state = "chum"; return; }
    if (s.timer <= 0 || Math.hypot(s.tx - s.x, s.ty - s.y) < 55) {
      const r = Math.random();
      if (s.sp.rest && r < 0.35) { s.state = "rest"; s.rest = rnd(8, 18); s.tx = rnd(120, W - 120); s.ty = floorY(s.tx) - s.L * s.sp.hw * 1.0; return; }
      if (r < 0.12 && planWreck(s)) return;
      pickWaypoint(s);
    }
    if (s.cool <= 0 && T.schools.length && !s.sp.rest && s.sp.key !== "whale") {   // look for a snack
      const sch = pick(T.schools); const fi = sch.m.length ? sch.m[(Math.random() * sch.m.length) | 0] : null;
      if (fi && Math.hypot(fi.x - s.x, fi.y - s.y) < 520 && Math.random() < 0.5) { s.state = "chase"; s.target = fi; s.sch = sch; s.timer = 7; s.cool = rnd(18, 40); }
      else s.cool = rnd(6, 14);
    }
  } else if (s.state === "chum") {
    if (!T.chum.length || s.fed >= 4) { s.state = "cruise"; s.calm = rnd(25, 50); s.fed = 0; pickWaypoint(s); return; }
    let best = null, bd = 1e9; for (const c of T.chum) { const d = Math.hypot(c.x - s.x, c.y - s.y) + rnd(0, 40); if (d < bd) { bd = d; best = c; } }
    s.tx = best.x; s.ty = best.y; s.tgt = best;
    if (bd < s.L * 0.22 + 14 && best) { T.chum.splice(T.chum.indexOf(best), 1); s.bite = 1; s.fed++; chumPuff(best.x, best.y); }
  } else if (s.state === "chase") {
    const f = s.target;
    if (!f || !s.sch || s.sch.m.indexOf(f) < 0 || s.timer <= 0 || T.chum.length) { s.state = "cruise"; s.target = null; pickWaypoint(s); return; }
    s.tx = f.x + f.vx * 0.3; s.ty = f.y + f.vy * 0.3;
    if (Math.hypot(f.x - s.x - s.face * s.L * 0.45, f.y - s.y) < s.L * 0.18 + 12) {
      s.bite = 1;
      if (Math.random() < 0.34) { const k = s.sch.m.indexOf(f); if (k >= 0) { s.sch.m.splice(k, 1); scalePuff(f.x, f.y); } s.state = "cruise"; s.target = null; s.calm = rnd(6, 14); pickWaypoint(s); }
      else { f.flash = 1; s.timer -= 0.8; }
    }
  } else if (s.state === "wreck") {
    const p = s.path[s.pi]; s.tx = p.x; s.ty = p.y;
    if (Math.hypot(p.x - s.x, p.y - s.y) < (p.hole !== undefined ? 22 : 40)) { s.pi++; if (s.pi >= s.path.length) { s.state = "cruise"; s.calm = 0; pickWaypoint(s); } }
    if (chumNear && s.pi === 0) { s.state = "chum"; }
    if (s.timer <= 0) { s.state = "cruise"; pickWaypoint(s); }
  } else if (s.state === "rest") {
    s.rest -= dt; if (s.rest <= 0 || chumNear) { s.state = chumNear ? "chum" : "cruise"; pickWaypoint(s); }
  }
  if (s.calm > 0) s.calm -= dt;
}
function sharkMove(s, dt) {
  const sp = s.sp, base = sp.spd * (s.L / sp.L);
  let mult = 1;
  if (s.state === "chum") mult = 2.4; else if (s.state === "chase") mult = 2.6; else if (s.state === "wreck") mult = s.pi > 0 && s.pi < s.path.length - 1 ? 0.8 : 1.15; else if (s.state === "rest") mult = 0.5;
  if (s.flinch > 0) mult = 3;
  const want = base * mult;
  let dx = s.tx - s.x, dy = s.ty - s.y; const d = Math.hypot(dx, dy) || 1;
  let dvx = (dx / d) * want, dvy = (dy / d) * want;
  if (s.state === "rest" && d < 8) { dvx = 0; dvy = 0; }
  /* gentle S-curve so the path is never a ruler line */
  dvy += Math.sin(s.t * 0.7 + s.sid) * base * 0.12;
  /* keep apart from the others and off the walls */
  for (const o of T.sharks) { if (o === s || o.lane !== s.lane) continue; const ox = s.x - o.x, oy = s.y - o.y, od = Math.hypot(ox, oy) || 1, lim = (s.L + o.L) * 0.34; if (od < lim) { dvx += (ox / od) * base * 1.1 * (1 - od / lim); dvy += (oy / od) * base * 1.1 * (1 - od / lim); } }
  const fl = floorY(s.x) - s.L * sp.hw * 1.15 - 6; if (s.y > fl && s.state !== "rest") dvy -= 70 * ((s.y - fl) / 30 + 0.4);
  if (s.y < WATER + 45) dvy += 90;
  if (s.x < 50) dvx += 80; if (s.x > W - 50) dvx -= 80;
  const acc = 120 * dt;
  s.vx += clamp(dvx - s.vx, -acc, acc); s.vy += clamp(dvy - s.vy, -acc * 0.7, acc * 0.7);
  /* swimming into a turn: slow down while flipping */
  const want_face = Math.abs(s.vx) > 6 ? sgn(s.vx) : s.face;
  if (want_face !== s.face) { s.face = want_face; }
  s.fs += (s.face - s.fs) * Math.min(1, dt * 3.2);
  const flip = Math.abs(s.fs) < 0.85 ? 0.45 + 0.55 * Math.abs(s.fs) : 1;
  const sp2 = flip < 1 ? flip : 1;
  s.x += s.vx * dt * sp2; s.y += s.vy * dt * sp2;
  if (s.state === "rest" && d < 14) s.y += (s.ty - s.y) * Math.min(1, dt * 2);
  const spd = Math.hypot(s.vx, s.vy);
  s.ph += dt * (2.2 + spd * 0.075 * (s.L > 250 ? 0.8 : 1) + (s.state === "chum" || s.state === "chase" ? 4 : 0));
  s.amp = clamp(0.35 + spd / (base * 2.2), 0.3, 1.25);
  s.pitch += (clamp(Math.atan2(s.vy, Math.abs(s.vx) + 22) * 0.9, -0.5, 0.5) - s.pitch) * Math.min(1, dt * 3);
  /* lane (behind the wreck or in front) */
  const wantBack = s.state === "wreck" ? 1 : 0; s.laneT += clamp(wantBack - s.laneT, -dt * 0.55, dt * 0.55); s.lane = s.laneT > 0.5 ? 1 : 0;
}

/* ---------- drawing a shark ---------- */
function sharkShade(s) {   // colours, darker and bluer when swimming behind the hull
  const k = s.laneT * 0.55 + (DAY.v < 0.5 ? (1 - DAY.v) * 0.5 : 0), sp = s.sp;
  const dark = mixc(WATERDEEP, [0, 0, 0], 0.4);
  return { top: mixc(sp.top, dark, k), belly: mixc(sp.belly, dark, k * 0.9), fin: mixc(mixc(sp.top, [0, 0, 0], 0.18), dark, k) };
}
function drawShark(g, s) {
  const sp = s.sp, L = s.L, N = 16, C = sharkShade(s);
  const amp = L * 0.075 * s.amp * (s.state === "rest" ? 0.25 : 1);
  const sx = []; const hwMax = L * sp.hw;
  const prof = (t) => { const pk = sp.peak; let w; if (t < pk) w = Math.pow(Math.sin((t / pk) * Math.PI / 2), sp.nose); else { const u = (t - pk) / (1 - pk); w = Math.max(0.13, Math.pow(1 - u, 1.18) * 0.93 + 0.07); } return w * hwMax; };
  for (let i = 0; i <= N; i++) { const t = i / N; sx.push({ t, x: L * (0.5 - t), y: amp * Math.sin(s.ph - t * 5.4) * (0.1 + Math.pow(t, 1.8)) * 1.0, w: prof(t) }); }
  g.save(); g.translate(s.x, s.y); g.scale(s.fs, 1); g.rotate(s.pitch * 1);
  if (s.laneT > 0.01) g.globalAlpha = 1;
  const top = rgb(C.top), bel = rgb(C.belly), fin = rgb(C.fin);
  /* tail fin */
  const e = sx[N], e0 = sx[N - 2], ta = Math.atan2(e.y - e0.y, e.x - e0.x);
  const caudal = () => { g.save(); g.translate(e.x, e.y); g.rotate(ta); const F = L * 0.2; g.beginPath(); g.moveTo(F * 0.08, 0); g.bezierCurveTo(-F * 0.25, -F * 0.28, -F * 0.55, -F * 0.62, -F * 0.95, -F * 1.02); g.bezierCurveTo(-F * 0.78, -F * 0.5, -F * 0.62, -F * 0.2, -F * 0.62, F * 0.0); g.bezierCurveTo(-F * 0.62, F * 0.2, -F * 0.5, F * 0.4, -F * 0.55, F * 0.62); g.bezierCurveTo(-F * 0.2, F * 0.3, -F * 0.05, F * 0.14, F * 0.08, 0); g.closePath(); g.fillStyle = fin; g.fill(); if (sp.tips) { g.fillStyle = "rgba(10,10,14,.85)"; g.beginPath(); g.moveTo(-F * 0.95, -F * 1.02); g.bezierCurveTo(-F * 0.78, -F * 0.5, -F * 0.7, -F * 0.3, -F * 0.62, -F * 0.12); g.lineTo(-F * 0.8, -F * 0.5); g.closePath(); g.fill(); g.beginPath(); g.moveTo(-F * 0.55, F * 0.62); g.lineTo(-F * 0.58, F * 0.28); g.lineTo(-F * 0.45, F * 0.45); g.closePath(); g.fill(); } g.restore(); };
  caudal();
  /* far pectoral fin (behind the body) */
  const pectoral = (far) => { const b = sx[Math.round(N * 0.3)], flex = Math.sin(s.ph * 0.5) * 0.2; g.save(); g.translate(b.x - L * 0.01, b.y + b.w * 0.55); g.rotate(0.9 + flex + (far ? 0.12 : 0)); const F = L * 0.2 * sp.pec; g.beginPath(); g.moveTo(F * 0.1, -F * 0.07); g.bezierCurveTo(-F * 0.3, F * 0.1, -F * 0.75, F * 0.5, -F * 1.0, F * 0.95); g.bezierCurveTo(-F * 0.55, F * 0.5, -F * 0.25, F * 0.32, -F * 0.2, F * 0.14); g.closePath(); g.fillStyle = far ? rgb(mixc(C.fin, [0, 0, 0], 0.25)) : fin; g.fill(); if (sp.tips && !far) { g.fillStyle = "rgba(10,10,14,.8)"; g.beginPath(); g.moveTo(-F * 1.0, F * 0.95); g.lineTo(-F * 0.62, F * 0.55); g.lineTo(-F * 0.72, F * 0.72); g.closePath(); g.fill(); } g.restore(); };
  pectoral(true);
  /* body */
  const bodyPath = () => {
    const tp = sx.map((p) => [p.x, p.y - p.w * 0.97]), bt = sx.map((p) => [p.x, p.y + p.w * (p.t < 0.45 ? 1.03 : 0.9)]).reverse();
    g.beginPath(); g.moveTo(tp[0][0], tp[0][1]);
    for (let i = 1; i < tp.length - 1; i++) g.quadraticCurveTo(tp[i][0], tp[i][1], (tp[i][0] + tp[i + 1][0]) / 2, (tp[i][1] + tp[i + 1][1]) / 2);
    g.lineTo(tp[tp.length - 1][0], tp[tp.length - 1][1]); g.lineTo(bt[0][0], bt[0][1]);
    for (let i = 1; i < bt.length - 1; i++) g.quadraticCurveTo(bt[i][0], bt[i][1], (bt[i][0] + bt[i + 1][0]) / 2, (bt[i][1] + bt[i + 1][1]) / 2);
    g.lineTo(bt[bt.length - 1][0], bt[bt.length - 1][1]); g.closePath();
  };
  bodyPath();
  const gr = g.createLinearGradient(0, -hwMax, 0, hwMax); const sp1 = sp.split;
  gr.addColorStop(0, top); gr.addColorStop(Math.max(0.1, sp1 - 0.1), top); gr.addColorStop(Math.min(0.95, sp1 + (sp.top[0] > 140 ? 0.12 : 0.04)), bel); gr.addColorStop(1, bel);
  g.fillStyle = gr; g.fill();
  g.save(); bodyPath(); g.clip();
  if (sp.stripes) { g.fillStyle = "rgba(34,52,54,.5)"; for (let i = 0; i < 9; i++) { const p = sx[2 + i], k = 1 - i / 11; g.beginPath(); g.moveTo(p.x + L * 0.02, p.y - p.w); g.quadraticCurveTo(p.x - L * 0.005, p.y - p.w * 0.1, p.x - L * 0.02, p.y + p.w * (0.15 + 0.3 * k)); g.lineTo(p.x - L * 0.045, p.y + p.w * 0.1); g.quadraticCurveTo(p.x - L * 0.02, p.y - p.w * 0.3, p.x - L * 0.012, p.y - p.w); g.closePath(); g.fill(); } }
  if (sp.spots && s.spots) { g.fillStyle = "rgba(245,250,255,.85)"; s.spots.forEach((d) => { const p = sx[Math.min(N, Math.round(d[0] * N))]; g.beginPath(); g.arc(p.x, p.y + d[1] * p.w, d[2] * L, 0, TAU); g.fill(); }); g.strokeStyle = "rgba(220,235,245,.28)"; g.lineWidth = L * 0.014; for (let i = 3; i < 11; i++) { const p = sx[i]; g.beginPath(); g.moveTo(p.x, p.y - p.w); g.lineTo(p.x - L * 0.005, p.y + p.w); g.stroke(); } }
  /* volume: light from above, bounce light from the sand, a glossy streak along the back, darker toward the tail */
  const sh = g.createLinearGradient(0, -hwMax, 0, hwMax); sh.addColorStop(0, "rgba(255,255,255,.30)"); sh.addColorStop(0.2, "rgba(255,255,255,.12)"); sh.addColorStop(0.42, "rgba(255,255,255,0)"); sh.addColorStop(0.66, "rgba(0,20,40,.10)"); sh.addColorStop(0.9, "rgba(0,20,40,.30)"); sh.addColorStop(1, "rgba(170,220,235,.22)"); g.fillStyle = sh; g.fillRect(-L, -hwMax * 2, L * 2, hwMax * 4);
  const lo = g.createLinearGradient(L * 0.5, 0, -L * 0.5, 0); lo.addColorStop(0, "rgba(255,255,255,.08)"); lo.addColorStop(0.45, "rgba(0,0,0,0)"); lo.addColorStop(1, "rgba(0,10,28,.30)"); g.fillStyle = lo; g.fillRect(-L, -hwMax * 2, L * 2, hwMax * 4);
  g.fillStyle = rg(g, L * 0.14, -hwMax * 0.55, 1, L * 0.3, [[0, "rgba(255,255,255,.30)"], [1, "rgba(255,255,255,0)"]]); g.save(); g.translate(L * 0.14, -hwMax * 0.55); g.scale(1, hwMax * 0.16 / (L * 0.3)); g.translate(-L * 0.14, hwMax * 0.55 / (hwMax * 0.16 / (L * 0.3)) * 0 - hwMax * 0.55 * 0); g.restore();
  g.save(); g.translate(L * 0.1, -hwMax * 0.58); g.scale(1, 0.2); g.fillStyle = rg(g, 0, 0, 0, L * 0.3, [[0, "rgba(255,255,255,.34)"], [1, "rgba(255,255,255,0)"]]); g.beginPath(); g.arc(0, 0, L * 0.3, 0, TAU); g.fill(); g.restore();
  g.restore();
  g.strokeStyle = "rgba(0,12,24,.45)"; g.lineWidth = Math.max(1, L * 0.006); bodyPath(); g.stroke();
  /* head details */
  const h1 = sx[1], h2 = sx[Math.round(N * 0.08)], h3 = sx[Math.round(N * 0.2)];
  if (sp.hammer) {
    const hx = L * 0.5 - L * 0.045, hy = sx[0].y; g.save(); g.translate(hx, hy); g.rotate(-0.16); g.beginPath(); g.ellipse(0, 0, L * 0.036, hwMax * 1.18, 0, 0, TAU); g.fillStyle = gr; g.fill(); g.strokeStyle = "rgba(0,12,24,.5)"; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = "#0a0a0c"; g.beginPath(); g.arc(L * 0.004, -hwMax * 1.0, L * 0.011, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,.85)"; g.beginPath(); g.arc(L * 0.007, -hwMax * 1.03, L * 0.003, 0, TAU); g.fill();
    g.fillStyle = "rgba(0,0,0,.4)"; g.beginPath(); g.arc(L * 0.026, hwMax * 0.55, L * 0.006, 0, TAU); g.fill(); g.restore();
  } else {
    const ex = h2.x, ey = h2.y - h2.w * 0.28, er = Math.max(2.2, L * sp.eye * 1.15);
    g.fillStyle = "#07080a"; g.beginPath(); g.arc(ex, ey, er, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.arc(ex + er * 0.35, ey - er * 0.35, Math.max(0.8, er * 0.3), 0, TAU); g.fill();
    if (sp.key === "great" || true) { g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.arc(h1.x - L * 0.012, h1.y + h1.w * 0.1, Math.max(1, L * 0.005), 0, TAU); g.fill(); }
  }
  /* gills */
  g.strokeStyle = "rgba(0,10,20,.5)"; g.lineWidth = Math.max(1, L * 0.005); g.lineCap = "round";
  for (let i = 0; i < sp.gill; i++) { const p = sx[Math.round(N * (0.2 + i * 0.026))]; g.beginPath(); g.moveTo(p.x + L * 0.006, p.y - p.w * 0.55); g.quadraticCurveTo(p.x - L * 0.01, p.y - p.w * 0.1, p.x + L * 0.003, p.y + p.w * 0.38); g.stroke(); }
  /* mouth */
  const m0 = sx[1], m1 = sx[Math.round(N * 0.17)], open = Math.max(0, Math.min(1, s.bite));
  const mx0 = sp.hammer ? L * 0.5 - L * 0.04 : m0.x - L * 0.015, my0 = (sp.hammer ? m0.y : m0.y) + m0.w * 0.55 + (sp.hammer ? hwMax * 0.55 : 0);
  if (open > 0.05) { g.fillStyle = "#6a1a24"; g.beginPath(); g.moveTo(mx0, my0); g.quadraticCurveTo(mx0 - L * 0.04, my0 + L * 0.02 + open * L * 0.07, m1.x + L * 0.02, m1.y + m1.w * 0.55 + open * L * 0.012); g.quadraticCurveTo(mx0 - L * 0.04, my0 - L * 0.005, mx0, my0); g.fill(); g.fillStyle = "#f4f4ec"; for (let i = 0; i < 6; i++) { const u = i / 5, px = lerp(mx0 - L * 0.012, m1.x + L * 0.03, u), py = lerp(my0 + L * 0.002, m1.y + m1.w * 0.56, u); g.beginPath(); g.moveTo(px, py); g.lineTo(px - L * 0.004, py + L * 0.014); g.lineTo(px - L * 0.008, py); g.fill(); } }
  g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = Math.max(1, L * 0.004); g.beginPath(); g.moveTo(mx0, my0); g.quadraticCurveTo(lerp(mx0, m1.x, 0.5), my0 + L * 0.012 + open * L * 0.03, m1.x + L * 0.01, m1.y + m1.w * 0.5 + open * L * 0.01); g.stroke();
  if (sp.barbels) { g.strokeStyle = "rgba(60,40,20,.8)"; g.lineWidth = 2; g.beginPath(); g.moveTo(mx0 - L * 0.005, my0 - 3); g.lineTo(mx0 - L * 0.018, my0 + 8); g.stroke(); }
  /* dorsal, second dorsal, pelvic, anal, near pectoral */
  const dorsal = (t0, t1, h, lean, tipBlack) => { const a = sx[Math.round(N * t0)], b = sx[Math.round(N * t1)]; g.beginPath(); g.moveTo(a.x, a.y - a.w * 0.9); g.bezierCurveTo(a.x - (a.x - b.x) * 0.15, a.y - a.w - h * 0.5, a.x - (a.x - b.x) * 0.3 - lean * 0.4, a.y - a.w - h * 0.95, a.x - (a.x - b.x) * 0.45 - lean, a.y - a.w - h); g.bezierCurveTo(b.x + (a.x - b.x) * 0.3, b.y - b.w - h * 0.35, b.x + (a.x - b.x) * 0.12, b.y - b.w - h * 0.1, b.x, b.y - b.w * 0.9); g.closePath(); g.fillStyle = fin; g.fill(); g.strokeStyle = "rgba(0,12,24,.4)"; g.lineWidth = 1; g.stroke(); if (tipBlack) { g.fillStyle = "rgba(10,10,14,.85)"; g.beginPath(); g.moveTo(a.x - (a.x - b.x) * 0.45 - lean, a.y - a.w - h); g.lineTo(a.x - (a.x - b.x) * 0.38 - lean * 0.9, a.y - a.w - h * 0.62); g.lineTo(a.x - (a.x - b.x) * 0.55 - lean * 0.9, a.y - a.w - h * 0.62); g.closePath(); g.fill(); } };
  dorsal(sp.twin ? 0.36 : 0.34, sp.twin ? 0.5 : 0.47, hwMax * 1.55 * sp.dors, L * 0.06, sp.tips);
  dorsal(sp.twin ? 0.62 : 0.68, sp.twin ? 0.72 : 0.74, hwMax * (sp.twin ? 0.85 : 0.42), L * 0.025, false);
  { const a = sx[Math.round(N * 0.7)]; g.beginPath(); g.moveTo(a.x, a.y + a.w * 0.9); g.lineTo(a.x - L * 0.045, a.y + a.w + hwMax * 0.36); g.lineTo(a.x - L * 0.055, a.y + a.w * 0.7); g.closePath(); g.fillStyle = fin; g.fill(); const p = sx[Math.round(N * 0.56)]; g.beginPath(); g.moveTo(p.x, p.y + p.w * 0.9); g.lineTo(p.x - L * 0.05, p.y + p.w + hwMax * 0.4); g.lineTo(p.x - L * 0.065, p.y + p.w * 0.8); g.closePath(); g.fill(); }
  pectoral(false);
  g.restore();
}
