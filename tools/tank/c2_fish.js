
/* ============================================================ reef fish, schools and visitors */
const REEF = [
  { n: "Blue tang", len: 40, shape: "disc", body: [34, 96, 232], fin: [250, 214, 40], mark: "tang", w: 3 },
  { n: "Yellow tang", len: 36, shape: "disc", body: [255, 224, 28], fin: [255, 236, 90], mark: "none", w: 3 },
  { n: "Clownfish", len: 24, shape: "oval", body: [255, 118, 18], fin: [255, 150, 40], mark: "bands", home: true, w: 3 },
  { n: "Royal angelfish", len: 50, shape: "disc", body: [60, 86, 200], fin: [250, 210, 60], mark: "angel", w: 2 },
  { n: "Butterflyfish", len: 32, shape: "disc", body: [255, 238, 96], fin: [255, 230, 80], mark: "bfly", w: 3 },
  { n: "Moorish idol", len: 42, shape: "disc", body: [244, 244, 232], fin: [30, 30, 36], mark: "idol", w: 2 },
  { n: "Parrotfish", len: 58, shape: "slim", body: [38, 168, 160], fin: [236, 110, 150], mark: "parrot", w: 2 },
  { n: "Sergeant major", len: 26, shape: "oval", body: [250, 232, 96], fin: [240, 220, 90], mark: "bars", w: 3 },
  { n: "Cleaner wrasse", len: 22, shape: "slim", body: [60, 150, 250], fin: [60, 150, 250], mark: "stripe", w: 2 },
  { n: "Pufferfish", len: 34, shape: "puff", body: [214, 184, 108], fin: [200, 170, 100], mark: "spots", w: 2 },
  { n: "Lionfish", len: 54, shape: "lion", body: [196, 70, 52], fin: [232, 190, 150], mark: "lion", w: 1 },
];
function newReef(sp, x, y) { const L = sp.len * rnd(0.9, 1.15); return { sp, L, x, y, hx: x, hy: y, vx: rnd(-8, 8), vy: 0, face: pickSign(), fs: 1, ph: rnd(0, 6), tx: x, ty: y, wait: rnd(0, 3), flee: 0, big: 0 }; }
const pickSign = () => (Math.random() < 0.5 ? -1 : 1);
function reefThink(f, dt) {
  f.wait -= dt; f.big = Math.max(0, f.big - dt);
  let fx = 0, fy = 0, danger = 0;
  for (const s of T.sharks) { const d = Math.hypot(s.x - f.x, s.y - f.y); if (d < 150 + s.L * 0.3) { danger = Math.max(danger, 1 - d / (150 + s.L * 0.3)); fx += (f.x - s.x) / (d || 1); fy += (f.y - s.y) / (d || 1); } }
  for (const d of T.divers) { const dd = Math.hypot(d.x - f.x, d.y - f.y); if (dd < 90) { danger = Math.max(danger, 0.5); fx += (f.x - d.x) / (dd || 1); fy += (f.y - d.y) / (dd || 1); } }
  if (T.mouse) { const d = Math.hypot(T.mouse.x - f.x, T.mouse.y - f.y); if (d < 110) { danger = Math.max(danger, 0.6); fx += (f.x - T.mouse.x) / (d || 1); fy += (f.y - T.mouse.y) / (d || 1); } }
  if (f.sp.mark === "spots" && danger > 0.2) f.big = 2.2;                      // the pufferfish puffs up
  let sp = 18 + f.L * 0.35;
  if (danger > 0.05) { f.tx = f.x + fx * 90; f.ty = f.y + fy * 60; sp *= 1 + danger * 2.8; }
  else if (f.wait <= 0 || Math.hypot(f.tx - f.x, f.ty - f.y) < 8) {
    f.wait = rnd(1.5, 6); const r = f.sp.home ? 70 : 170;
    f.tx = clamp(f.hx + rnd(-r, r), 40, W - 40); f.ty = clamp(f.hy + rnd(-r * 0.35, r * 0.35), WATER + 90, floorY(f.tx) - 14);
    if (T.flakes.length && !f.sp.home) { const fl = T.flakes[0]; f.tx = fl.x; f.ty = fl.y; }
  }
  for (let i = T.flakes.length - 1; i >= 0; i--) { const fl = T.flakes[i]; if (Math.hypot(fl.x - f.x, fl.y - f.y) < 14) { T.flakes.splice(i, 1); } }
  if (T.chum.length && f.L < 40 && Math.random() < 0.02) { const c = T.chum[0]; f.tx = c.x + rnd(-30, 30); f.ty = c.y + rnd(-20, 20); f.wait = 1.5; }
  let dx = f.tx - f.x, dy = f.ty - f.y; const d = Math.hypot(dx, dy) || 1, v = d < 6 ? 0 : sp;
  f.vx += (dx / d * v - f.vx) * Math.min(1, dt * 3); f.vy += (dy / d * v - f.vy) * Math.min(1, dt * 3);
  f.x += f.vx * dt; f.y += f.vy * dt; if (Math.abs(f.vx) > 5) f.face = sgn(f.vx);
  f.fs += (f.face - f.fs) * Math.min(1, dt * 7); f.ph += dt * (4 + Math.hypot(f.vx, f.vy) * 0.14);
  f.y = clamp(f.y, WATER + 50, floorY(f.x) - 8);
}
function drawReef(g, f) {
  const sp = f.sp, L = f.L, body = TT(sp.body), fin = TT(sp.fin), lowK = f.lane ? 0.5 : 0;
  g.save(); g.translate(f.x, f.y); g.scale(f.fs, 1); g.rotate(clamp(Math.atan2(f.vy, Math.abs(f.vx) + 14) * 0.6, -0.5, 0.5) * 1);
  const flick = Math.sin(f.ph) * 0.45;
  let rx = L * 0.5, ry = L * 0.2;
  if (sp.shape === "disc") { rx = L * 0.36; ry = L * 0.4; } else if (sp.shape === "slim") ry = L * 0.17; else if (sp.shape === "puff") { rx = L * (f.big > 0 ? 0.52 : 0.4); ry = rx * 0.95; } else if (sp.shape === "lion") ry = L * 0.2;
  const bodyP = () => { g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); };
  /* tail */
  const tl = L * (sp.shape === "puff" ? 0.2 : 0.3);
  g.save(); g.translate(-rx * 0.92, 0); g.rotate(flick); g.beginPath(); g.moveTo(rx * 0.1, 0); g.quadraticCurveTo(-tl * 0.5, -ry * 1.1, -tl, -ry * 1.2); g.quadraticCurveTo(-tl * 0.72, 0, -tl, ry * 1.2); g.quadraticCurveTo(-tl * 0.5, ry * 1.1, rx * 0.1, 0); g.closePath(); g.fillStyle = rgb(sp.mark === "tang" ? TT([250, 214, 40]) : fin); g.fill(); g.restore();
  /* fins */
  if (sp.shape !== "puff") { g.fillStyle = rgb(fin, 0.95); g.beginPath(); g.moveTo(-rx * 0.45, -ry * 0.88); g.quadraticCurveTo(-rx * 0.05, -ry * (sp.shape === "disc" ? 1.9 : 1.55), rx * (sp.mark === "idol" ? -1.2 : 0.35), -ry * 0.8); g.closePath(); g.fill(); g.beginPath(); g.moveTo(-rx * 0.45, ry * 0.88); g.quadraticCurveTo(-rx * 0.1, ry * (sp.shape === "disc" ? 1.7 : 1.45), rx * 0.2, ry * 0.8); g.closePath(); g.fill(); }
  if (sp.shape === "lion") { g.strokeStyle = rgb(fin, 0.9); g.lineWidth = 1.6; for (let i = 0; i < 12; i++) { const a = -2.6 + i * 0.45, wv = Math.sin(f.ph * 0.5 + i) * 2; g.beginPath(); g.moveTo(rx * 0.1, 0); g.lineTo(Math.cos(a) * L * 0.62 + wv, Math.sin(a) * L * 0.62); g.stroke(); } }
  /* body */
  bodyP(); g.fillStyle = rg(g, rx * 0.2, -ry * 0.5, 1, rx * 1.4, [[0, rgb(mixc(body, [255, 255, 255], 0.35))], [0.55, rgb(body)], [1, rgb(mixc(body, [0, 0, 20], 0.38))]]); g.fill();
  g.save(); bodyP(); g.clip();
  const mk2 = sp.mark;
  if (mk2 === "tang") { g.strokeStyle = "#0d1230"; g.lineWidth = L * 0.07; g.beginPath(); g.moveTo(-rx * 0.5, -ry * 0.1); g.quadraticCurveTo(rx * 0.1, -ry * 0.9, rx * 0.35, -ry * 0.2); g.quadraticCurveTo(rx * 0.1, ry * 0.4, -rx * 0.55, ry * 0.5); g.stroke(); }
  else if (mk2 === "bands") { [-0.35, 0.18, 0.62].forEach((u, i) => { const x = rx * u, w = (i === 0 ? 0.13 : 0.1) * rx; g.fillStyle = "#101010"; g.fillRect(x - w - 1.4, -ry, w * 2 + 2.8, ry * 2); g.fillStyle = "#fbfbf6"; g.fillRect(x - w, -ry, w * 2, ry * 2); }); }
  else if (mk2 === "bars") { g.fillStyle = "rgba(20,20,30,.78)"; [-0.4, -0.05, 0.3].forEach((u) => g.fillRect(rx * u - 1.6, -ry, 3.2, ry * 2)); }
  else if (mk2 === "bfly") { g.fillStyle = "rgba(10,10,10,.85)"; g.fillRect(rx * 0.35, -ry, rx * 0.22, ry * 2); g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(rx * 0.2, -ry, rx * 0.1, ry * 2); g.strokeStyle = "rgba(20,20,20,.4)"; g.lineWidth = 1; for (let i = -6; i < 6; i++) { g.beginPath(); g.moveTo(-rx * 0.8 + i * 4, -ry); g.lineTo(-rx * 0.1 + i * 4, ry); g.stroke(); } }
  else if (mk2 === "idol") { g.fillStyle = "#14141a"; g.fillRect(rx * 0.28, -ry, rx * 0.26, ry * 2); g.fillRect(-rx * 0.62, -ry, rx * 0.22, ry * 2); g.fillStyle = "#f3d234"; g.fillRect(-rx * 0.4, -ry, rx * 0.5, ry * 2); }
  else if (mk2 === "angel") { g.strokeStyle = "rgba(250,210,60,.9)"; g.lineWidth = 2; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(-rx + i * rx * 0.3, -ry); g.lineTo(-rx * 0.5 + i * rx * 0.3, ry); g.stroke(); } g.fillStyle = "rgba(255,230,90,.85)"; g.fillRect(-rx, ry * 0.35, rx * 2, ry); }
  else if (mk2 === "parrot") { g.fillStyle = "rgba(236,110,150,.7)"; g.fillRect(-rx, ry * 0.2, rx * 2, ry); g.fillStyle = "rgba(255,230,120,.5)"; for (let i = 0; i < 9; i++) g.fillRect(-rx + i * rx * 0.24, -ry * 0.4, rx * 0.12, ry * 0.5); }
  else if (mk2 === "stripe") { g.fillStyle = "#12142a"; g.fillRect(-rx, -ry * 0.2, rx * 2, ry * 0.5); g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(-rx, ry * 0.5, rx * 2, ry * 0.5); }
  else if (mk2 === "spots") { g.fillStyle = "rgba(60,40,20,.55)"; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(-rx * 0.6 + (i % 5) * rx * 0.3, -ry * 0.5 + ((i * 7) % 5) * ry * 0.3, 2.2, 0, TAU); g.fill(); } g.fillStyle = "rgba(255,248,220,.7)"; g.beginPath(); g.ellipse(0, ry * 0.65, rx * 0.8, ry * 0.4, 0, 0, TAU); g.fill(); }
  else if (mk2 === "lion") { g.fillStyle = "rgba(250,236,220,.85)"; for (let i = 0; i < 6; i++) g.fillRect(-rx * 0.8 + i * rx * 0.3, -ry, rx * 0.1, ry * 2); }
  g.fillStyle = lg(g, 0, -ry, 0, ry, [[0, "rgba(255,255,255,.22)"], [0.35, "rgba(255,255,255,0)"], [0.75, "rgba(0,10,30,.08)"], [1, "rgba(0,10,30,.38)"]]); g.fillRect(-rx, -ry, rx * 2, ry * 2);
  g.save(); g.translate(rx * 0.1, -ry * 0.5); g.scale(1, 0.3); g.fillStyle = rg(g, 0, 0, 0, rx * 0.6, [[0, "rgba(255,255,255,.55)"], [1, "rgba(255,255,255,0)"]]); g.beginPath(); g.arc(0, 0, rx * 0.6, 0, TAU); g.fill(); g.restore();
  g.restore();
  g.strokeStyle = "rgba(0,10,30,.35)"; g.lineWidth = 1; bodyP(); g.stroke();
  const ex = rx * (sp.shape === "puff" ? 0.45 : 0.55), er = Math.max(1.8, L * 0.045);
  g.fillStyle = "#fff"; g.beginPath(); g.arc(ex, -ry * 0.2, er, 0, TAU); g.fill(); g.fillStyle = "#050505"; g.beginPath(); g.arc(ex + er * 0.2, -ry * 0.2, er * 0.62, 0, TAU); g.fill();
  if (sp.shape === "puff" && f.big > 0) { g.strokeStyle = "rgba(90,70,40,.8)"; g.lineWidth = 1.2; for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; g.beginPath(); g.moveTo(Math.cos(a) * rx, Math.sin(a) * ry); g.lineTo(Math.cos(a) * (rx + 4), Math.sin(a) * (ry + 4)); g.stroke(); } }
  g.restore();
}

/* ---------- schools ---------- */
function makeSprite(kind) {
  const c = mk(52, 20), g = c.getContext("2d"); g.translate(26, 10);
  const cols = { sardine: [[236, 242, 250], [96, 130, 176]], chromis: [[120, 190, 255], [30, 90, 210]], fusilier: [[250, 220, 70], [50, 130, 230]] }[kind];
  g.beginPath(); g.moveTo(22, 0); g.quadraticCurveTo(8, -7, -10, -3); g.lineTo(-16, -7); g.lineTo(-16, 7); g.lineTo(-10, 3); g.quadraticCurveTo(8, 7, 22, 0); g.closePath();
  g.fillStyle = lg(g, 0, -7, 0, 7, [[0, rgb(cols[1])], [0.5, rgb(mixc(cols[1], cols[0], 0.55))], [1, rgb(cols[0])]]); g.fill(); g.strokeStyle = "rgba(0,20,50,.4)"; g.lineWidth = 0.8; g.stroke();
  g.fillStyle = "#050505"; g.beginPath(); g.arc(14, -1.2, 1.5, 0, TAU); g.fill();
  if (kind === "fusilier") { g.fillStyle = "rgba(250,220,70,.9)"; g.beginPath(); g.moveTo(-9, -2.6); g.lineTo(18, -0.8); g.lineTo(18, 1); g.lineTo(-9, 0.4); g.fill(); }
  return c;
}
function startSchool(kind, n, fromChum) {
  const dir = Math.random() < 0.5 ? 1 : -1, y0 = rnd(WATER + 120, 470), x0 = dir > 0 ? -60 : W + 60;
  const sch = { kind, m: [], goal: { x: dir > 0 ? W + 160 : -160, y: y0 + rnd(-90, 90) }, dir, life: 0, wob: rnd(0, 6) };
  const cx = fromChum ? fromChum.x : x0, cy = fromChum ? WATER + 70 : y0;
  for (let i = 0; i < n; i++) sch.m.push({ x: cx + rnd(-50, 50), y: cy + rnd(-40, 40), vx: dir * rnd(50, 90), vy: rnd(-10, 10), ph: rnd(0, 6), flash: 0, ang: 0 });
  if (fromChum) { sch.goal = { x: fromChum.x + rnd(-100, 100), y: 360 }; sch.hold = 14; }
  T.schools.push(sch); return sch;
}
function schoolStep(sch, dt) {
  sch.life += dt; if (sch.hold) sch.hold -= dt;
  let cx = 0, cy = 0, vx = 0, vy = 0; const n = sch.m.length || 1;
  sch.m.forEach((f) => { cx += f.x; cy += f.y; vx += f.vx; vy += f.vy; }); cx /= n; cy /= n; vx /= n; vy /= n;
  const gx = sch.goal.x + Math.sin(sch.life * 0.6 + sch.wob) * 80, gy = sch.goal.y + Math.cos(sch.life * 0.5 + sch.wob) * 70, spd = sch.kind === "fusilier" ? 90 : 78;
  if (sch.hold && sch.hold < 0) { sch.hold = 0; sch.goal = { x: sch.dir > 0 ? W + 160 : -160, y: cy }; }
  for (const f of sch.m) {
    let ax = (cx - f.x) * 0.45 + (vx - f.vx) * 1.2, ay = (cy - f.y) * 0.45 + (vy - f.vy) * 1.2;
    const gd = Math.hypot(gx - f.x, gy - f.y) || 1; ax += ((gx - f.x) / gd) * spd * 1.2; ay += ((gy - f.y) / gd) * spd * 1.0;
    for (let k = 0; k < n; k += Math.max(1, (n / 10) | 0)) { const o = sch.m[k]; if (o === f) continue; const dx = f.x - o.x, dy = f.y - o.y, d2 = dx * dx + dy * dy; if (d2 < 150 && d2 > 0.1) { const d = Math.sqrt(d2); ax += (dx / d) * 160 * (1 - d / 12); ay += (dy / d) * 160 * (1 - d / 12); } }
    for (const s of T.sharks) { const dx = f.x - s.x, dy = f.y - s.y, d = Math.hypot(dx, dy); if (d < 190 + s.L * 0.2) { const k = (1 - d / (190 + s.L * 0.2)) * (s.state === "chase" ? 900 : 380); ax += (dx / d) * k; ay += (dy / d) * k; f.flash = Math.max(f.flash, 0.6); } }
    for (const d of T.divers) { const dx = f.x - d.x, dy = f.y - d.y, dd = Math.hypot(dx, dy); if (dd < 110) { ax += (dx / dd) * 260; ay += (dy / dd) * 260; } }
    if (T.mouse) { const dx = f.x - T.mouse.x, dy = f.y - T.mouse.y, dd = Math.hypot(dx, dy); if (dd < 100) { ax += (dx / dd) * 420; ay += (dy / dd) * 420; f.flash = 1; } }
    if (f.y < WATER + 40) ay += 200; const fl = floorY(f.x) - 30; if (f.y > fl) ay -= 260;
    f.vx += ax * dt; f.vy += ay * dt; const sp = Math.hypot(f.vx, f.vy), mx = spd * (1.2 + (f.flash > 0.1 ? 1.1 : 0)); if (sp > mx) { f.vx *= mx / sp; f.vy *= mx / sp; }
    f.x += f.vx * dt; f.y += f.vy * dt; f.ph += dt * 14; f.flash = Math.max(0, f.flash - dt * 1.5); f.ang += (Math.atan2(f.vy, Math.abs(f.vx) + 12) * (f.vx < 0 ? -1 : 1) - f.ang) * Math.min(1, dt * 8);
  }
  if (!sch.hold && (cx < -170 && sch.dir < 0 || cx > W + 170 && sch.dir > 0)) sch.m.length = 0;
}
function drawSchool(g, sch) {
  const sp = T.sprites[sch.kind];
  for (const f of sch.m) {
    if (f.x < -40 || f.x > W + 40) continue;
    const face = f.vx < 0 ? -1 : 1; g.save(); g.translate(f.x, f.y); g.scale(face, 1); g.rotate(f.ang * 0.8);
    g.globalAlpha = 0.72 + 0.28 * Math.min(1, Math.abs(Math.sin(f.ph * 0.2 + f.x * 0.01)) + f.flash);
    g.drawImage(sp, -26 * 0.7, -10 * 0.7, 52 * 0.7, 20 * 0.7);
    if (f.flash > 0.5) { g.globalAlpha = f.flash * 0.7; g.fillStyle = "#fff"; g.fillRect(-6, -2, 12, 2); }
    g.restore();
  }
  g.globalAlpha = 1;
}

/* ---------- visitors: manta, turtle, jellies, crab, diver ---------- */
function startExtra(kind) {
  const dir = pickSign(), y = kind === "turtle" ? rnd(260, 430) : rnd(WATER + 110, 380);
  T.extras.push({ kind, x: dir > 0 ? -190 : W + 190, y, dir, t: 0, ph: rnd(0, 6), v: kind === "manta" ? 52 : 38, fs: dir });
}
function drawManta(g, e) {
  const L = 230, w = Math.sin(e.ph * 0.9) * 30; g.save(); g.translate(e.x, e.y); g.scale(e.fs, 1); g.rotate(Math.sin(e.ph * 0.45) * 0.05);
  const top = TT([36, 52, 84]), bel = TT([236, 238, 240]);
  g.beginPath(); g.moveTo(L * 0.5, 4); g.bezierCurveTo(L * 0.34, -w * 0.6 - 6, L * 0.05, -w - 42, -L * 0.2, -w - 12); g.bezierCurveTo(-L * 0.27, -w * 0.4 - 6, -L * 0.12, 4, -L * 0.18, 12); g.bezierCurveTo(-L * 0.16, w * 0.3 + 28, L * 0.08, w * 0.4 + 36, L * 0.5, 4); g.closePath();
  g.fillStyle = lg(g, 0, -60, 0, 40, [[0, rgb(top)], [0.55, rgb(mixc(top, bel, 0.2))], [1, rgb(bel)]]); g.fill(); g.strokeStyle = "rgba(0,10,30,.35)"; g.lineWidth = 1.2; g.stroke();
  g.fillStyle = rgb(bel, 0.9); g.beginPath(); g.ellipse(L * 0.22, 8, L * 0.12, 5, 0.1, 0, TAU); g.fill();
  g.fillStyle = "#101820"; g.beginPath(); g.arc(L * 0.32, -4, 3, 0, TAU); g.fill();
  g.strokeStyle = rgb(top); g.lineWidth = 3; g.beginPath(); g.moveTo(-L * 0.18, 8); g.quadraticCurveTo(-L * 0.4, 10 + Math.sin(e.ph) * 10, -L * 0.62, 6 + Math.sin(e.ph + 1) * 14); g.stroke();
  g.fillStyle = rgb(top); g.beginPath(); g.moveTo(L * 0.5, 0); g.lineTo(L * 0.58, -6); g.lineTo(L * 0.52, 4); g.closePath(); g.fill();
  g.restore();
}
function drawTurtle(g, e) {
  const L = 120, fl = Math.sin(e.ph * 0.8); g.save(); g.translate(e.x, e.y); g.scale(e.fs, 1); g.rotate(Math.sin(e.ph * 0.4) * 0.04 - 0.05);
  const shell = TT([90, 110, 54]), skin = TT([130, 150, 96]);
  g.fillStyle = rgb(skin); g.beginPath(); g.ellipse(L * 0.52, -4, 16, 11, 0.1, 0, TAU); g.fill(); g.fillStyle = "#0a0a0a"; g.beginPath(); g.arc(L * 0.58, -7, 2.4, 0, TAU); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(L * 0.585, -7.6, 0.8, 0, TAU); g.fill();
  g.save(); g.translate(L * 0.22, 14); g.rotate(0.5 + fl * 0.7); g.fillStyle = rgb(skin); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(10, 20, 54, 34); g.quadraticCurveTo(24, 8, 12, -2); g.closePath(); g.fill(); g.restore();
  g.save(); g.translate(-L * 0.28, 12); g.rotate(0.5 + fl * 0.3); g.fillStyle = rgb(skin); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-6, 12, -24, 20); g.quadraticCurveTo(-6, 4, 6, -2); g.closePath(); g.fill(); g.restore();
  g.fillStyle = lg(g, 0, -40, 0, 20, [[0, rgb(mixc(shell, [255, 255, 255], 0.3))], [1, rgb(mixc(shell, [0, 0, 0], 0.35))]]); g.beginPath(); g.ellipse(0, -2, L * 0.45, 28, 0, Math.PI, TAU); g.lineTo(L * 0.43, 8); g.quadraticCurveTo(0, 22, -L * 0.43, 8); g.closePath(); g.fill();
  g.strokeStyle = "rgba(20,24,10,.55)"; g.lineWidth = 1.6; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 16, -26); g.lineTo(i * 18, 6); g.stroke(); } g.beginPath(); g.moveTo(-L * 0.4, -8); g.quadraticCurveTo(0, -14, L * 0.4, -8); g.stroke();
  g.save(); g.translate(L * 0.24, 6); g.rotate(-0.3 - fl * 0.9); g.fillStyle = rgb(skin); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(14, -18, 62, -30); g.quadraticCurveTo(28, 0, 14, 8); g.closePath(); g.fill(); g.restore();
  g.restore();
}
function startJelly() { T.jelly.push({ x: rnd(80, W - 80), y: rnd(WATER + 120, 400), r: rnd(16, 30), ph: rnd(0, 6), vx: rnd(-6, 6), col: pick([[236, 150, 230], [150, 190, 255], [255, 190, 150]]) }); }
function drawJelly(g, j) {
  const p = Math.sin(j.ph), r = j.r * (1 + p * 0.1), h = j.r * (0.8 - p * 0.12);
  g.save(); g.translate(j.x, j.y); g.strokeStyle = rgb(j.col, 0.5); g.lineWidth = 1.6; g.lineCap = "round";
  for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * r * 0.3, 0); for (let k = 1; k <= 6; k++) g.lineTo(i * r * 0.3 + Math.sin(j.ph * 0.8 + k * 0.9 + i) * 3, k * r * 0.5); g.stroke(); }
  g.fillStyle = rg(g, 0, -h * 0.4, 1, r * 1.1, [[0, rgb(mixc(j.col, [255, 255, 255], 0.6), 0.9)], [1, rgb(j.col, 0.45)]]); g.beginPath(); g.ellipse(0, 0, r, h, 0, Math.PI, TAU); g.quadraticCurveTo(r * 0.5, h * 0.3, 0, h * 0.18); g.quadraticCurveTo(-r * 0.5, h * 0.3, -r, 0); g.closePath(); g.fill();
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.stroke(); g.restore();
}
function newCrab() { const x = rnd(80, W - 80); return { x, dir: pickSign(), wait: rnd(2, 8), ph: 0, walk: 0 }; }
function drawCrab(g, c) {
  const y = floorY(c.x) + 14, l = Math.sin(c.ph) * 2; g.save(); g.translate(c.x, y); const col = TT([214, 70, 52]);
  g.strokeStyle = rgb(mixc(col, [0, 0, 0], 0.2)); g.lineWidth = 2; for (let i = -1; i <= 1; i += 2) for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(i * 8, -2); g.lineTo(i * (14 + k * 3), -7 + l * (k % 2 ? 1 : -1)); g.lineTo(i * (18 + k * 3), 2); g.stroke(); }
  g.fillStyle = rgb(col); g.beginPath(); g.ellipse(0, -5, 12, 7, 0, Math.PI, TAU); g.lineTo(11, -3); g.lineTo(-11, -3); g.closePath(); g.fill();
  const claw = (s) => { g.beginPath(); g.moveTo(s * 9, -7); g.lineTo(s * 14, -14 + (c.walk ? 0 : Math.sin(T.time * 2) * 2)); g.lineWidth = 2.4; g.stroke(); g.beginPath(); g.arc(s * 16, -17, 4.5, 0, TAU); g.fill(); g.fillStyle = "#0b0b0b"; g.beginPath(); g.arc(s * 16 + 1, -18, 1, 0, TAU); g.fill(); g.fillStyle = rgb(col); }; claw(-1); claw(1);
  g.fillStyle = "#fff"; g.beginPath(); g.arc(-4, -12, 2, 0, TAU); g.arc(4, -12, 2, 0, TAU); g.fill(); g.fillStyle = "#000"; g.beginPath(); g.arc(-4, -12, 0.9, 0, TAU); g.arc(4, -12, 0.9, 0, TAU); g.fill();
  g.restore();
}

/* ---------- a scuba diver (rare) ---------- */
function startDiver() { const dir = pickSign(); T.divers.push({ x: dir > 0 ? -90 : W + 90, y: rnd(220, 470), dir, ph: 0, vy: 0, ty: rnd(220, 470), flash: 0, nextFlash: rnd(4, 9), nextBubble: 0, fs: dir }); }
function drawDiver(g, d) {
  const k = Math.sin(d.ph), L = 92; g.save(); g.translate(d.x, d.y); g.scale(d.fs, 1); g.rotate(-0.1 + Math.sin(d.ph * 0.5) * 0.03);
  const suit = "#15181e", yel = "#f2c230";
  g.fillStyle = "#e2b83a"; g.beginPath(); g.ellipse(-10, -12, 24, 8, 0, 0, TAU); g.fill(); g.fillStyle = "#2c8f98"; g.fillRect(-28, -16, 8, 8); g.strokeStyle = "#555"; g.lineWidth = 2; g.beginPath(); g.moveTo(-8, -7); g.quadraticCurveTo(4, -3, 18, -3); g.stroke();
  g.fillStyle = suit; g.beginPath(); g.ellipse(-2, 0, 36, 9, 0, 0, TAU); g.fill(); g.fillStyle = yel; g.fillRect(-20, -4, 38, 2.4);
  g.save(); g.translate(-32, 2); g.rotate(0.12 + k * 0.32); g.fillStyle = suit; g.beginPath(); g.ellipse(-14, 0, 17, 5, 0, 0, TAU); g.fill(); g.fillStyle = "#e8742a"; g.beginPath(); g.moveTo(-26, 0); g.lineTo(-52, -9); g.lineTo(-56, 3); g.closePath(); g.fill(); g.restore();
  g.save(); g.translate(-30, 4); g.rotate(0.05 - k * 0.32); g.fillStyle = suit; g.beginPath(); g.ellipse(-14, 0, 17, 4.6, 0, 0, TAU); g.fill(); g.fillStyle = "#e8742a"; g.beginPath(); g.moveTo(-26, 0); g.lineTo(-52, -9); g.lineTo(-56, 3); g.closePath(); g.fill(); g.restore();
  g.fillStyle = "#e6b896"; g.beginPath(); g.arc(40, -3, 9, 0, TAU); g.fill(); g.fillStyle = suit; g.beginPath(); g.arc(40, -6, 9.4, Math.PI * 1.05, Math.PI * 2.0); g.fill();
  g.fillStyle = "rgba(120,200,230,.85)"; g.beginPath(); g.ellipse(46, -4, 6, 4.6, 0.1, 0, TAU); g.fill(); g.strokeStyle = "#101010"; g.lineWidth = 1.8; g.stroke(); g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.arc(44, -6, 1.2, 0, TAU); g.fill();
  g.strokeStyle = "#333"; g.lineWidth = 2.6; g.beginPath(); g.moveTo(47, 0); g.lineTo(34, 2); g.lineTo(22, -7); g.stroke();
  g.strokeStyle = suit; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.moveTo(26, 2); g.lineTo(52, 6 + k * 2); g.stroke(); g.fillStyle = "#222"; g.fillRect(50, 2 + k * 2, 14, 10); g.fillStyle = "#98a8b8"; g.beginPath(); g.arc(60, 7 + k * 2, 3.6, 0, TAU); g.fill();
  g.restore();
  if (d.flash > 0) { g.fillStyle = "rgba(255,255,255," + (d.flash * 0.8) + ")"; g.beginPath(); g.arc(d.x + d.fs * 62, d.y + 6, 70 * d.flash + 10, 0, TAU); g.fill(); }
}
