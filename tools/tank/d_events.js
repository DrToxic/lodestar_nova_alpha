
/* ============================================================ particles, chum, boat, gulls, sky */
function chumPuff(x, y) {
  for (let i = 0; i < 3; i++) T.parts.push({ k: "cloud", x: x + rnd(-6, 6), y: y + rnd(-6, 6), vx: rnd(-8, 8), vy: rnd(-6, 4), r: rnd(6, 11), g: rnd(14, 24), life: 0, max: rnd(2.5, 4), col: [196, 52, 58] });
  for (let i = 0; i < 6; i++) T.parts.push({ k: "bit", x, y, vx: rnd(-50, 50), vy: rnd(-40, 20), r: rnd(1, 2.4), life: 0, max: rnd(0.8, 1.6), col: [214, 90, 84] });
  for (let i = 0; i < 3; i++) T.bubbles.push({ x: x + rnd(-8, 8), y, r: rnd(1.5, 3.5), vy: rnd(30, 60), ph: rnd(0, 6) });
}
function scalePuff(x, y) {
  for (let i = 0; i < 9; i++) T.parts.push({ k: "glint", x, y, vx: rnd(-40, 40), vy: rnd(-30, 30), r: rnd(1.5, 3), life: 0, max: rnd(0.7, 1.4), col: [230, 240, 250], ph: rnd(0, 6) });
  T.parts.push({ k: "cloud", x, y, vx: 0, vy: 0, r: 8, g: 14, life: 0, max: 1.8, col: [200, 60, 64] });
}
function splash(x) { for (let i = 0; i < 10; i++) T.parts.push({ k: "drop", x, y: WATER, vx: rnd(-40, 40), vy: rnd(-110, -40), r: rnd(1.2, 2.6), life: 0, max: 1, col: [220, 245, 255] }); for (let i = 0; i < 4; i++) T.bubbles.push({ x: x + rnd(-8, 8), y: WATER + rnd(4, 20), r: rnd(1.5, 3.5), vy: rnd(20, 50), ph: rnd(0, 6) }); }
function addChum(x) { T.chum.push({ x, y: WATER + 6, vx: rnd(-8, 8), vy: rnd(18, 28), ph: rnd(0, 6), r: rnd(3, 5), age: 0, kind: rint(0, 2) }); splash(x); }

function startBoat(name) {
  if (T.boat) return;
  const dir = pickSign(), len = 120;
  T.boat = { x: dir > 0 ? -len : W + len, dir, v: 78, t: 0, drops: rint(15, 22), dropped: 0, nextDrop: 0, name: name || "", len, fs: dir, arm: 0, flag: rnd(0, 6) };
  T.boats++;
  for (let i = 0, n = rint(2, 4); i < n; i++) T.gulls.push({ x: T.boat.x + dir * rnd(-80, 30), y: rnd(10, 54), ph: rnd(0, 6), follow: true, off: rnd(-90, 90), vx: 0 });
}
function boatStep(dt) {
  const b = T.boat; if (!b) return;
  b.t += dt; b.x += b.dir * b.v * dt; b.arm = Math.max(0, b.arm - dt * 2);
  const inView = b.x > 50 && b.x < W - 50;
  if (inView && b.dropped < b.drops) {
    b.nextDrop -= dt;
    if (b.nextDrop <= 0) { b.nextDrop = rnd(0.35, 0.9); b.arm = 1; const k = rint(1, 3); for (let i = 0; i < k && b.dropped < b.drops; i++, b.dropped++) addChum(b.x - b.dir * (b.len * 0.5) + rnd(-26, 26)); }
  }
  if ((b.dir > 0 && b.x > W + b.len + 40) || (b.dir < 0 && b.x < -b.len - 40)) T.boat = null;
}
function drawBoat(g) {
  const b = T.boat; if (!b) return;
  const bob = Math.sin(T.time * 1.6) * 1.8, rock = Math.sin(T.time * 1.2) * 0.025;
  g.save(); g.translate(b.x, WATER + bob); g.scale(b.dir, 1); g.rotate(rock);
  const day = DAY.v, hull = TT([150, 54, 44]), white = TT([236, 236, 230]), wood = TT([120, 86, 58]);
  /* wake */
  g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-70, 2); g.quadraticCurveTo(-110, 4, -150, 1 + Math.sin(T.time * 3)); g.stroke();
  g.beginPath(); g.moveTo(60, 3); g.quadraticCurveTo(80, 4, 96, 2); g.stroke();
  /* hull */
  g.beginPath(); g.moveTo(-66, -22); g.lineTo(-58, 8); g.quadraticCurveTo(0, 13, 56, 6); g.lineTo(78, -24); g.quadraticCurveTo(0, -17, -66, -22); g.closePath();
  g.fillStyle = lg(g, 0, -24, 0, 12, [[0, rgb(mixc(hull, [255, 255, 255], 0.25))], [1, rgb(mixc(hull, [0, 0, 0], 0.3))]]); g.fill();
  g.fillStyle = rgb(white); g.fillRect(-64, -22, 138, 4); g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 1; g.stroke();
  /* cabin */
  g.fillStyle = rgb(white); g.fillRect(8, -46, 36, 24); g.fillStyle = rgb(mixc(white, [0, 0, 0], 0.15)); g.fillRect(6, -49, 40, 4);
  g.fillStyle = "rgba(60,120,160,.85)"; g.fillRect(14, -41, 10, 9); g.fillRect(28, -41, 10, 9);
  if (DAY.v < 0.6) { g.fillStyle = "rgba(255,220,120,.9)"; g.fillRect(14, -41, 10, 9); g.fillRect(28, -41, 10, 9); }
  /* mast and flag */
  g.strokeStyle = rgb(wood); g.lineWidth = 2.4; g.beginPath(); g.moveTo(26, -49); g.lineTo(26, -78); g.stroke();
  g.fillStyle = "#e8c030"; const fw = Math.sin(T.time * 5 + b.flag) * 2; g.beginPath(); g.moveTo(26, -78); g.lineTo(44, -74 + fw); g.lineTo(26, -68); g.closePath(); g.fill();
  /* fisherman and chum bucket at the stern */
  const fx = -40;
  g.fillStyle = "#35506e"; g.fillRect(fx - 5, -42, 10, 20); g.fillStyle = "#e4b690"; g.beginPath(); g.arc(fx, -48, 5.5, 0, TAU); g.fill();
  g.fillStyle = "#e0a418"; g.beginPath(); g.ellipse(fx, -50, 7.5, 3.2, 0, 0, TAU); g.fill(); g.fillRect(fx - 4.5, -54, 9, 4);
  g.strokeStyle = "#35506e"; g.lineWidth = 3.4; g.lineCap = "round"; g.beginPath(); g.moveTo(fx, -38); g.lineTo(fx - 12 - b.arm * 6, -30 - b.arm * 12); g.stroke();
  g.fillStyle = "#b8bcc2"; g.beginPath(); g.moveTo(fx - 22, -32 - b.arm * 14); g.lineTo(fx - 12, -32 - b.arm * 14); g.lineTo(fx - 14, -20 - b.arm * 14); g.lineTo(fx - 20, -20 - b.arm * 14); g.closePath(); g.fill();
  g.fillStyle = "#c84048"; g.fillRect(fx - 20, -33 - b.arm * 14, 8, 3);
  g.restore();
  if (b.name) { g.save(); g.translate(b.x, WATER + bob); g.font = "bold 8px sans-serif"; g.textAlign = "center"; g.fillStyle = "rgba(255,255,255,.9)"; g.fillText(b.name.slice(0, 14).toUpperCase(), -8 * b.dir + 4 * b.dir, -8); g.restore(); }
}
function gullStep(dt) {
  for (let i = T.gulls.length - 1; i >= 0; i--) {
    const q = T.gulls[i]; q.ph += dt * 6;
    if (q.follow && T.boat) { q.vx += ((T.boat.x + q.off - q.x) * 0.6 - q.vx) * dt; q.x += q.vx * dt; q.y += (28 + Math.sin(q.ph * 0.2 + q.off) * 18 - q.y) * dt; }
    else { q.follow = false; q.x += (q.vx || (i % 2 ? 60 : -60)) * dt; q.vx = q.vx || (i % 2 ? 60 : -60); q.y -= dt * 8; }
    if (q.x < -80 || q.x > W + 80 || q.y < -20) T.gulls.splice(i, 1);
  }
}
function drawGull(g, q) {
  const w = Math.sin(q.ph) * 6; g.save(); g.translate(q.x, q.y); g.strokeStyle = "rgba(250,250,250,.95)"; g.lineWidth = 2; g.lineCap = "round";
  g.beginPath(); g.moveTo(-9, w * 0.2 - 2); g.quadraticCurveTo(-4, -w - 4, 0, 0); g.quadraticCurveTo(4, -w - 4, 9, w * 0.2 - 2); g.stroke(); g.restore();
}

/* ---------- sky, sun, moon ---------- */
function drawSky(g) {
  const d = DAY.v, h = DAY.h;
  const top = mixc([6, 10, 30], DAY.warm ? [250, 140, 90] : [90, 170, 240], d), bot = mixc([14, 20, 44], DAY.warm ? [255, 200, 130] : [190, 228, 250], d);
  g.fillStyle = lg(g, 0, 0, 0, WATER, [[0, rgb(top)], [1, rgb(bot)]]); g.fillRect(0, 0, W, WATER + 4);
  if (DAY.night) T.stars.forEach((s) => { g.globalAlpha = 0.5 + 0.5 * Math.sin(T.time * 1.5 + s[3]); g.fillStyle = "#fff"; g.fillRect(s[0], s[1], s[2], s[2]); }); g.globalAlpha = 1;
  const a = clamp((h - 6) / 12, -0.2, 1.2), sx = 90 + a * (W - 180), sy = 62 - Math.sin(clamp(a, 0, 1) * Math.PI) * 38;
  if (h >= 5.5 && h < 19.5) { g.fillStyle = rg(g, sx, sy, 4, 60, [[0, "rgba(255,248,200,.95)"], [0.2, "rgba(255,240,170,.5)"], [1, "rgba(255,240,170,0)"]]); g.fillRect(sx - 60, sy - 60, 120, 120); g.fillStyle = "#fff6c8"; g.beginPath(); g.arc(sx, sy, 11, 0, TAU); g.fill(); }
  else { const mx = W * (0.2 + ((h + 6) % 24) / 12 * 0.6 * 0.5 + 0.1) % W; g.fillStyle = "#e8ecf4"; g.beginPath(); g.arc(mx, 40, 12, 0, TAU); g.fill(); g.fillStyle = "rgba(6,10,30,.9)"; g.beginPath(); g.arc(mx + 5, 38, 11, 0, TAU); g.fill(); }
  const cc = mixc([60, 70, 100], [255, 255, 255], d);
  T.clouds.forEach((c) => { g.fillStyle = rgb(cc, 0.78); const x = c.x, y = c.y; g.beginPath(); g.ellipse(x, y, 40 * c.s, 9 * c.s, 0, 0, TAU); g.ellipse(x - 18 * c.s, y + 3, 26 * c.s, 8 * c.s, 0, 0, TAU); g.ellipse(x + 20 * c.s, y + 2, 28 * c.s, 8 * c.s, 0, 0, TAU); g.fill(); });
}
function drawSurface(g) {
  const d = DAY.v; g.save();
  g.beginPath(); g.moveTo(0, WATER + 8); for (let x = 0; x <= W; x += 10) g.lineTo(x, WATER + Math.sin(x * 0.03 + T.time * 1.4) * 2 + Math.sin(x * 0.011 - T.time * 0.9) * 2); g.lineTo(W, WATER + 12); g.closePath();
  g.fillStyle = rgb(mixc([14, 40, 70], [90, 210, 225], d), 0.95); g.fill();
  g.strokeStyle = "rgba(255,255,255," + (0.25 + 0.3 * d) + ")"; g.lineWidth = 1.6; g.beginPath(); for (let x = 0; x <= W; x += 10) { const y = WATER + Math.sin(x * 0.03 + T.time * 1.4) * 2 + Math.sin(x * 0.011 - T.time * 0.9) * 2; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.restore();
}
function drawRays(g) {
  const d = DAY.v; if (d < 0.45) return;
  g.save(); g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 7; i++) { const x0 = 80 + i * 190 + Math.sin(T.time * 0.12 + i) * 40, w = 50 + (i % 3) * 22, a = (0.04 + 0.03 * Math.sin(T.time * 0.4 + i * 1.7)) * d;
    g.fillStyle = lg(g, 0, WATER, 0, 560, [[0, "rgba(200,255,250," + a * 1.6 + ")"], [1, "rgba(200,255,250,0)"]]); g.beginPath(); g.moveTo(x0, WATER); g.lineTo(x0 + w, WATER); g.lineTo(x0 + w * 2.4 - 120, 580); g.lineTo(x0 + w * 1.1 - 150, 580); g.closePath(); g.fill(); }
  g.restore();
}
function drawCaustics(g) {
  const d = DAY.v; if (d < 0.4 || !T.lay.caustic) return;
  g.save(); g.beginPath(); g.rect(0, WATER + 6, W, H); g.clip(); g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.05 * d * T.clarity;
  const pat = T.pat || (T.pat = g.createPattern(T.lay.caustic, "repeat"));
  g.translate(Math.sin(T.time * 0.18) * 30, T.time * 6 % 256); g.fillStyle = pat; g.fillRect(-60, -256 + WATER, W + 120, 256 + 560 - WATER + 90);
  g.restore();
}
function drawGrass(g) {
  T.grass.forEach((s) => { g.strokeStyle = rgb(s.col); g.lineWidth = 3.4; g.lineCap = "round";
    for (let i = 0; i < s.n; i++) { const hh = s.h * (0.6 + 0.4 * ((i * 37) % 10) / 10), sw = Math.sin(T.time * 1.2 + s.ph + i * 0.6) * 10 + (T.cur || 0); g.beginPath(); g.moveTo(s.x + (i - s.n / 2) * 4, s.y); g.quadraticCurveTo(s.x + (i - s.n / 2) * 5 + sw * 0.4, s.y - hh * 0.5, s.x + (i - s.n / 2) * 6 + sw, s.y - hh); g.stroke(); } });
  T.anem.forEach((a) => { const n = 18; for (let i = 0; i < n; i++) { const t = i / (n - 1) - 0.5, sw = Math.sin(T.time * 1.8 + a.ph + i) * 4; g.strokeStyle = rgb(a.col); g.lineWidth = 3; g.lineCap = "round"; g.beginPath(); g.moveTo(a.x + t * a.r * 1.2, a.y); g.quadraticCurveTo(a.x + t * a.r * 1.8 + sw, a.y - a.r * 0.6, a.x + t * a.r * 2.2 + sw * 1.4, a.y - a.r * (0.9 + 0.2 * Math.cos(i))); g.stroke(); g.fillStyle = rgb(mixc(a.col, [255, 255, 255], 0.5)); g.beginPath(); g.arc(a.x + t * a.r * 2.2 + sw * 1.4, a.y - a.r * (0.9 + 0.2 * Math.cos(i)), 1.8, 0, TAU); g.fill(); } });
}
function drawChumBits(g) {
  T.chum.forEach((c) => { g.save(); g.translate(c.x, c.y); g.rotate(c.ph); g.fillStyle = c.kind === 0 ? "#c4484c" : c.kind === 1 ? "#e2a090" : "#9a3a44"; g.beginPath(); g.moveTo(-c.r, -c.r * 0.6); g.lineTo(c.r, -c.r * 0.9); g.lineTo(c.r * 0.8, c.r * 0.8); g.lineTo(-c.r * 0.9, c.r); g.closePath(); g.fill(); g.strokeStyle = "rgba(255,230,220,.5)"; g.lineWidth = 0.8; g.stroke(); g.restore(); });
}
function drawParts(g) {
  for (const p of T.parts) { const u = p.life / p.max, a = 1 - u;
    if (p.k === "cloud") { const r = p.r + p.g * u; g.fillStyle = rg(g, p.x, p.y, 0, r, [[0, rgb(p.col, 0.42 * a)], [1, rgb(p.col, 0)]]); g.fillRect(p.x - r, p.y - r, r * 2, r * 2); }
    else if (p.k === "glint") { g.fillStyle = rgb(p.col, a * (0.5 + 0.5 * Math.sin(p.life * 22 + p.ph))); g.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 1.2); }
    else { g.fillStyle = rgb(p.col, a * 0.9); g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill(); } }
}
function drawBubbles(g) {
  g.lineWidth = 1; for (const b of T.bubbles) { g.strokeStyle = "rgba(220,250,255,.65)"; g.fillStyle = "rgba(220,250,255,.12)"; g.beginPath(); g.arc(b.x + Math.sin(b.ph) * 3, b.y, b.r, 0, TAU); g.fill(); g.stroke(); g.fillStyle = "rgba(255,255,255,.8)"; g.fillRect(b.x + Math.sin(b.ph) * 3 - b.r * 0.4, b.y - b.r * 0.5, 1, 1); }
}
function drawSnow(g) {
  g.fillStyle = "rgba(220,240,240,.35)"; for (const s of T.snow) g.fillRect(s.x, s.y, s.r, s.r);
}
