
/* ============================================================ the scenery */
const CORALS = [[236, 98, 124], [250, 150, 56], [164, 92, 206], [78, 190, 168], [244, 208, 76], [250, 116, 88], [214, 80, 170], [112, 200, 90]];
const lit = () => 0.4 + 0.6 * DAY.v;
const TT = (c) => mixc([3, 10, 24], c, lit());            // colour as lit at this hour
function hazeTo(c, t) { return mixc(c, mixc(WATERMID, [2, 8, 22], 1 - DAY.v), t); }

function drawBrain(g, x, y, r, col, rs) {
  g.save(); g.beginPath(); g.ellipse(x, y, r, r * 0.72, 0, Math.PI, TAU); g.closePath();
  g.fillStyle = rg(g, x - r * 0.3, y - r * 0.5, r * 0.1, r * 1.1, [[0, rgb(mixc(col, [255, 255, 255], 0.35))], [1, rgb(mixc(col, [0, 0, 0], 0.35))]]); g.fill(); g.clip();
  g.strokeStyle = rgb(mixc(col, [0, 0, 0], 0.5), 0.55); g.lineWidth = 1.6; g.lineCap = "round";
  for (let k = 0; k < 14; k++) { let px = x - r + rs() * r * 2, py = y - r * 0.7 + rs() * r * 0.7, a = rs() * TAU; g.beginPath(); g.moveTo(px, py); for (let s = 0; s < 8; s++) { a += (rs() - 0.5) * 2.2; px += Math.cos(a) * r * 0.12; py += Math.sin(a) * r * 0.1; g.lineTo(px, py); } g.stroke(); }
  g.restore();
}
function drawStag(g, x, y, h, col, rs) {
  const tip = mixc(col, [255, 255, 255], 0.4); g.lineCap = "round";
  const br = (px, py, a, len, d, w) => {
    if (d > 4 || len < 5) return;
    const nx = px + Math.cos(a) * len, ny = py + Math.sin(a) * len;
    g.strokeStyle = rgb(mixc(col, tip, d / 4)); g.lineWidth = w; g.beginPath(); g.moveTo(px, py); g.lineTo(nx, ny); g.stroke();
    const k = 2 + ((rs() * 2) | 0);
    for (let i = 0; i < k; i++) br(nx, ny, a + (rs() - 0.5) * 1.5, len * (0.62 + rs() * 0.15), d + 1, Math.max(1.8, w * 0.7));
  };
  for (let i = 0; i < 4; i++) br(x + (i - 1.5) * 9, y, -Math.PI / 2 + (i - 1.5) * 0.38 + (rs() - 0.5) * 0.2, h * 0.34, 0, 7.5);
}
function drawTable(g, x, y, w, col, rs) {
  g.fillStyle = rgb(mixc(col, [0, 0, 0], 0.35)); g.fillRect(x - w * 0.06, y - w * 0.32, w * 0.12, w * 0.34);
  for (let i = 0; i < 3; i++) {
    const ww = w * (1 - i * 0.28) / 2, yy = y - w * 0.3 - i * w * 0.13;
    const pts = []; for (let k = 0; k < 18; k++) { const a = (k / 18) * TAU; pts.push([x + Math.cos(a) * ww * (1 + (rs() - 0.5) * 0.14), yy + Math.sin(a) * ww * 0.26]); }
    blob(g, pts); g.fillStyle = rg(g, x - ww * 0.3, yy - 4, 2, ww * 1.1, [[0, rgb(mixc(col, [255, 255, 255], 0.45))], [1, rgb(mixc(col, [0, 0, 0], 0.25))]]); g.fill();
    g.strokeStyle = rgb(mixc(col, [0, 0, 0], 0.5), 0.5); g.lineWidth = 1.2; g.stroke();
  }
}
function drawFan(g, x, y, h, col, rs) {
  g.strokeStyle = rgb(mixc(col, [0, 0, 0], 0.4)); g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h * 0.18); g.stroke();
  const cx = x, cy = y - h * 0.18, R = h * 0.82; g.lineCap = "round";
  for (let i = 0; i < 17; i++) { const a = -Math.PI * 0.95 + (i / 16) * Math.PI * 0.9; g.strokeStyle = rgb(col, 0.95); g.lineWidth = 2.4; g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + Math.cos(a) * R * 0.5 + (rs() - 0.5) * 10, cy + Math.sin(a) * R * 0.5, cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.9); g.stroke(); }
  g.strokeStyle = rgb(mixc(col, [255, 255, 255], 0.3), 0.55); g.lineWidth = 1.1;
  for (let ring = 0.3; ring < 1; ring += 0.16) { g.beginPath(); for (let i = 0; i <= 16; i++) { const a = -Math.PI * 0.95 + (i / 16) * Math.PI * 0.9, px = cx + Math.cos(a) * R * ring, py = cy + Math.sin(a) * R * ring * 0.92; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); }
}
function drawTubes(g, x, y, h, col, rs) {
  for (let i = 0; i < 4; i++) {
    const tx = x + (i - 1.5) * 13 + (rs() - 0.5) * 5, th = h * (0.5 + rs() * 0.5), tw = 7 + rs() * 4;
    g.fillStyle = lg(g, tx - tw, 0, tx + tw, 0, [[0, rgb(mixc(col, [0, 0, 0], 0.3))], [0.45, rgb(mixc(col, [255, 255, 255], 0.2))], [1, rgb(mixc(col, [0, 0, 0], 0.45))]]);
    g.beginPath(); g.moveTo(tx - tw, y); g.lineTo(tx - tw * 0.8, y - th); g.ellipse(tx, y - th, tw * 0.8, tw * 0.3, 0, Math.PI, 0, true); g.lineTo(tx + tw, y); g.closePath(); g.fill();
    g.fillStyle = rgb(mixc(col, [0, 0, 0], 0.65)); g.beginPath(); g.ellipse(tx, y - th, tw * 0.75, tw * 0.26, 0, 0, TAU); g.fill();
  }
}
function drawSoft(g, x, y, r, col, rs) {
  for (let i = 0; i < 26; i++) { const a = rs() * Math.PI, d = Math.sqrt(rs()) * r, px = x + Math.cos(a) * d * 1.3 - r * 0.0, py = y - Math.sin(a) * d * 0.85, rr = 3 + rs() * 7; g.fillStyle = rgb(mixc(col, rs() < 0.3 ? [255, 255, 255] : [0, 0, 0], rs() * 0.4)); g.beginPath(); g.arc(px, py, rr, 0, TAU); g.fill(); }
}
function drawRock(g, x, y, w, h, rs, tintc) {
  const pts = []; const n = 10;
  for (let i = 0; i < n; i++) { const a = Math.PI + (i / (n - 1)) * Math.PI; pts.push([x + Math.cos(a) * w / 2 * (0.86 + rs() * 0.25), y + Math.sin(a) * h * (0.78 + rs() * 0.3)]); }
  pts.unshift([x - w / 2 - 4, y + 3]); pts.push([x + w / 2 + 4, y + 3]);
  blob(g, pts); g.fillStyle = lg(g, x - w / 2, y - h, x + w / 2, y, [[0, rgb(mixc(tintc, [255, 255, 255], 0.18))], [1, rgb(mixc(tintc, [0, 0, 0], 0.45))]]); g.fill();
  g.save(); g.clip(); g.strokeStyle = "rgba(0,0,0,.28)"; g.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) { g.beginPath(); let px = x - w / 2 + rs() * w, py = y - rs() * h; g.moveTo(px, py); for (let s = 0; s < 4; s++) { px += (rs() - 0.5) * 22; py += rs() * 12; g.lineTo(px, py); } g.stroke(); }
  g.fillStyle = "rgba(60,150,90,.35)"; for (let i = 0; i < 10; i++) { g.beginPath(); g.arc(x - w / 2 + rs() * w, y - rs() * h * 0.7, 3 + rs() * 7, 0, TAU); g.fill(); }
  g.restore();
}
function drawAnchor(g, x, y, s) {
  g.save(); g.translate(x, y); g.rotate(-0.35); g.strokeStyle = "#3c3a3a"; g.fillStyle = "#4a4747"; g.lineWidth = 7 * s; g.lineCap = "round";
  g.beginPath(); g.moveTo(0, -48 * s); g.lineTo(0, 30 * s); g.stroke(); g.lineWidth = 5 * s; g.beginPath(); g.moveTo(-17 * s, -34 * s); g.lineTo(17 * s, -34 * s); g.stroke();
  g.lineWidth = 6 * s; g.beginPath(); g.arc(0, 8 * s, 30 * s, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  g.beginPath(); g.arc(0, -52 * s, 6 * s, 0, TAU); g.lineWidth = 3.5 * s; g.stroke();
  g.fillStyle = "rgba(70,150,100,.45)"; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc((i % 3 - 1) * 9 * s, (-30 + i * 9) * s, 4 * s, 0, TAU); g.fill(); }
  g.restore();
}
function drawAmphora(g, x, y, s, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = lg(g, -18 * s, 0, 18 * s, 0, [[0, "#8a5230"], [0.45, "#c07a48"], [1, "#6a3a22"]]);
  g.beginPath(); g.moveTo(-6 * s, -50 * s); g.quadraticCurveTo(-24 * s, -20 * s, -14 * s, 12 * s); g.quadraticCurveTo(-4 * s, 22 * s, 0, 26 * s); g.quadraticCurveTo(4 * s, 22 * s, 14 * s, 12 * s); g.quadraticCurveTo(24 * s, -20 * s, 6 * s, -50 * s); g.closePath(); g.fill();
  g.strokeStyle = "#8a5230"; g.lineWidth = 3 * s; g.beginPath(); g.ellipse(0, -52 * s, 8 * s, 3 * s, 0, 0, TAU); g.stroke();
  g.beginPath(); g.moveTo(-8 * s, -46 * s); g.bezierCurveTo(-34 * s, -50 * s, -32 * s, -18 * s, -18 * s, -14 * s); g.stroke(); g.beginPath(); g.moveTo(8 * s, -46 * s); g.bezierCurveTo(34 * s, -50 * s, 32 * s, -18 * s, 18 * s, -14 * s); g.stroke();
  g.fillStyle = "rgba(60,160,110,.4)"; g.beginPath(); g.arc(-6 * s, 4 * s, 7 * s, 0, TAU); g.fill();
  g.restore();
}
function drawChest(g, x, y, open) {
  g.save(); g.translate(x, y);
  g.fillStyle = lg(g, 0, -30, 0, 0, [[0, "#7a4a24"], [1, "#4d2c16"]]); g.fillRect(-28, -30, 56, 30);
  g.strokeStyle = "#caa24a"; g.lineWidth = 3; g.strokeRect(-28, -30, 56, 30); g.beginPath(); g.moveTo(-10, -30); g.lineTo(-10, 0); g.moveTo(10, -30); g.lineTo(10, 0); g.stroke();
  const a = open * 1.0;
  g.save(); g.translate(-28, -30); g.rotate(-a); g.fillStyle = lg(g, 0, -20, 0, 0, [[0, "#8a5a2c"], [1, "#5a3418"]]);
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(28, -26, 56, 0); g.closePath(); g.fill(); g.strokeStyle = "#caa24a"; g.lineWidth = 3; g.stroke(); g.restore();
  if (open > 0.05) { g.fillStyle = "#ffd85a"; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(-22 + (i % 6) * 9 + (i > 5 ? 4 : 0), -30 - (i > 5 ? 6 : 1), 4.2, 0, TAU); g.fill(); } g.fillStyle = "rgba(255,240,170,.35)"; g.beginPath(); g.ellipse(0, -34, 36, 14, 0, 0, TAU); g.fill(); }
  g.restore();
}
function drawUrchin(g, x, y, r, col) { g.strokeStyle = rgb(col); g.lineWidth = 1.6; g.lineCap = "round"; for (let i = 0; i < 22; i++) { const a = -Math.PI + (i / 21) * Math.PI; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r * 1.9, y + Math.sin(a) * r * 1.5); g.stroke(); } g.fillStyle = rgb(mixc(col, [0, 0, 0], 0.3)); g.beginPath(); g.ellipse(x, y, r * 0.7, r * 0.5, 0, Math.PI, TAU); g.fill(); }
function drawStar(g, x, y, r, col) { g.fillStyle = rgb(col); g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * TAU) / 10, rr = i % 2 ? r * 0.42 : r; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.5; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); g.fill(); g.fillStyle = "rgba(255,255,255,.4)"; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * TAU) / 5; g.beginPath(); g.arc(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.25, 1.2, 0, TAU); g.fill(); } }
function drawShell(g, x, y, r, col) { g.fillStyle = rgb(col); g.beginPath(); g.moveTo(x, y); for (let i = 0; i <= 7; i++) { const a = Math.PI + (i / 7) * Math.PI; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.9); } g.closePath(); g.fill(); g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 1; for (let i = 1; i < 7; i++) { const a = Math.PI + (i / 7) * Math.PI; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.9); g.stroke(); } }

/* ---------- the wreck: two layers (inside, and hull with holes) ---------- */
function buildWreck(rs) {
  const WW = 700, WH = 470, K = T.K, dayk = lit();
  const flip = rs() < 0.5;
  const back = mk(WW * K, WH * K), front = mk(WW * K, WH * K), gb = Ctx(back, K), gf = Ctx(front, K);
  const wood = TT([108, 80, 56]), woodL = TT([156, 124, 88]), woodD = TT([54, 38, 28]);
  const cx = WW / 2, cy = 300, ang = (flip ? 1 : -1) * 0.06;
  [gb, gf].forEach((g) => { if (flip) { g.translate(WW, 0); g.scale(-1, 1); } g.translate(cx, cy); g.rotate(ang * (flip ? -1 : 1)); g.translate(-cx, -cy); });
  const O = [40, 120];                                           // hull origin inside the box
  const P = (x, y) => [O[0] + x, O[1] + y];
  const hullPts = [[30, 268], [12, 236], [6, 196], [14, 150], [70, 140], [122, 138], [128, 166], [210, 170], [320, 172], [430, 162], [470, 126], [560, 118], [586, 128], [592, 180], [584, 236], [560, 262], [470, 288], [300, 300], [150, 294], [70, 282]].map((p) => P(p[0], p[1]));
  const hullPath = (g) => blob(g, hullPts);
  /* inside */
  gb.save(); hullPath(gb); gb.fillStyle = lg(gb, 0, O[1] + 130, 0, O[1] + 300, [[0, rgb(wcol([14, 50, 66], dayk))], [1, rgb(wcol([4, 16, 26], dayk))]]); gb.fill(); gb.clip();
  gb.strokeStyle = rgb(wcol([40, 70, 80], dayk), 0.8); gb.lineWidth = 7;
  for (let i = 0; i < 17; i++) { const x = O[0] + 36 + i * 33; gb.beginPath(); gb.moveTo(x, O[1] + 140); gb.quadraticCurveTo(x + 10, O[1] + 220, x - 4, O[1] + 296); gb.stroke(); }
  gb.lineWidth = 9; gb.strokeStyle = rgb(wcol([34, 60, 70], dayk), 0.9); for (let y = 190; y <= 260; y += 70) { gb.beginPath(); gb.moveTo(O[0] + 20, O[1] + y); gb.lineTo(O[0] + 590, O[1] + y - 6); gb.stroke(); }
  for (let i = 0; i < 6; i++) { const bx = O[0] + 90 + i * 76 + rs() * 20, by = O[1] + 262; gb.fillStyle = rgb(wcol([58, 42, 30], dayk)); gb.fillRect(bx, by - 34, 30, 34); gb.strokeStyle = rgb(wcol([100, 80, 50], dayk)); gb.lineWidth = 2; gb.strokeRect(bx, by - 34, 30, 34); gb.beginPath(); gb.moveTo(bx, by - 22); gb.lineTo(bx + 30, by - 22); gb.moveTo(bx, by - 10); gb.lineTo(bx + 30, by - 10); gb.stroke(); }
  gb.fillStyle = "rgba(255,215,90,.65)"; for (let i = 0; i < 26; i++) { gb.beginPath(); gb.arc(O[0] + 240 + rs() * 90, O[1] + 276 + rs() * 12, 2 + rs() * 1.6, 0, TAU); gb.fill(); }
  gb.restore();
  /* hull */
  const holes = [[270, 215, 66, 50, 0.2], [96, 214, 40, 34, 0.2], [528, 170, 30, 21, 0.1], [368, 188, 46, 13, 0.1]];
  const ports = []; for (let x = 170; x < 450; x += 40) { if (Math.abs(x - 270) < 76) continue; ports.push([x, 214]); }
  const shapes = holes.map((h) => jag(rs, O[0] + h[0], O[1] + h[1], h[2], h[3], 16, h[4]));
  gf.save(); hullPath(gf); gf.fillStyle = lg(gf, 0, O[1] + 120, 0, O[1] + 300, [[0, rgb(mixc(wood, woodL, 0.4))], [0.6, rgb(wood)], [1, rgb(woodD)]]); gf.fill(); gf.clip();
  for (let i = 0; i < 12; i++) { const y = O[1] + 142 + i * 13; gf.strokeStyle = rgb(woodD, 0.7); gf.lineWidth = 1.7; gf.beginPath(); gf.moveTo(O[0], y + 8); gf.bezierCurveTo(O[0] + 160, y - 4, O[0] + 420, y - 10, O[0] + 600, y - 8); gf.stroke(); gf.strokeStyle = rgb(woodL, 0.18); gf.beginPath(); gf.moveTo(O[0], y + 11); gf.bezierCurveTo(O[0] + 160, y - 1, O[0] + 420, y - 7, O[0] + 600, y - 5); gf.stroke(); }
  for (let i = 0; i < 70; i++) { const x = O[0] + rs() * 590, y = O[1] + 140 + rs() * 160; gf.strokeStyle = rgb(woodD, 0.55); gf.lineWidth = 1; gf.beginPath(); gf.moveTo(x, y); gf.lineTo(x + 8 + rs() * 22, y + (rs() - 0.5) * 3); gf.stroke(); }
  for (let i = 0; i < 26; i++) { gf.fillStyle = rgb(TT([60 + rs() * 40, 120 + rs() * 50, 80 + rs() * 30]), 0.34); gf.beginPath(); gf.ellipse(O[0] + rs() * 590, O[1] + 140 + rs() * 170, 16 + rs() * 30, 6 + rs() * 12, rs() * 3, 0, TAU); gf.fill(); }
  gf.fillStyle = rgb(TT([210, 205, 190]), 0.8); for (let i = 0; i < 240; i++) { gf.beginPath(); gf.arc(O[0] + rs() * 590, O[1] + 232 + rs() * 68, 0.9 + rs() * 1.5, 0, TAU); gf.fill(); }
  gf.fillStyle = rgb(woodD, 0.5); gf.fillRect(O[0] + 14, O[1] + 176, 580, 7);
  gf.strokeStyle = rgb(TT([40, 34, 30])); gf.lineWidth = 3; gf.beginPath(); gf.moveTo(O[0] + 60, O[1] + 140); gf.lineTo(O[0] + 70, O[1] + 280); gf.moveTo(O[0] + 470, O[1] + 128); gf.lineTo(O[0] + 462, O[1] + 288); gf.stroke();
  gf.restore();
  gf.globalCompositeOperation = "destination-out"; gf.fillStyle = "#000";
  shapes.forEach((s) => { blob(gf, s); gf.fill(); }); ports.forEach((p) => { gf.beginPath(); gf.arc(O[0] + p[0], O[1] + p[1], 8, 0, TAU); gf.fill(); });
  gf.globalCompositeOperation = "source-over";
  shapes.forEach((s) => { blob(gf, s); gf.strokeStyle = rgb(woodD); gf.lineWidth = 3.4; gf.stroke(); gf.strokeStyle = rgb(woodL, 0.55); gf.lineWidth = 1.2; gf.stroke(); });
  gf.strokeStyle = rgb(TT([176, 140, 70])); gf.lineWidth = 2.4; ports.forEach((p) => { gf.beginPath(); gf.arc(O[0] + p[0], O[1] + p[1], 9, 0, TAU); gf.stroke(); });
  /* splinters round the big breach */
  gf.fillStyle = rgb(woodL); for (let i = 0; i < 9; i++) { const a = rs() * TAU, x = O[0] + 270 + Math.cos(a) * 62, y = O[1] + 215 + Math.sin(a) * 46; gf.save(); gf.translate(x, y); gf.rotate(a); gf.beginPath(); gf.moveTo(0, -2); gf.lineTo(16 + rs() * 10, 0); gf.lineTo(0, 2); gf.fill(); gf.restore(); }
  /* outline */
  hullPath(gf); gf.strokeStyle = rgb(woodD); gf.lineWidth = 3; gf.stroke();
  /* stern cabin, rail, wheel */
  gf.fillStyle = rgb(mixc(wood, woodD, 0.25)); gf.fillRect(O[0] + 470, O[1] + 90, 100, 34); gf.strokeStyle = rgb(woodD); gf.lineWidth = 2.4; gf.strokeRect(O[0] + 470, O[1] + 90, 100, 34);
  gf.fillStyle = rgb(woodD); gf.fillRect(O[0] + 468, O[1] + 84, 106, 7);
  gf.strokeStyle = rgb(woodL, 0.9); gf.lineWidth = 3; for (let i = 0; i < 6; i++) { const x = O[0] + 135 + i * 62 + rs() * 8; gf.beginPath(); gf.moveTo(x, O[1] + 168); gf.lineTo(x + (rs() - 0.5) * 4, O[1] + 144 - rs() * 10); gf.stroke(); }
  gf.save(); gf.translate(O[0] + 500, O[1] + 100); gf.strokeStyle = rgb(TT([150, 110, 60])); gf.lineWidth = 3; gf.beginPath(); gf.arc(0, 0, 14, 0, TAU); gf.stroke(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; gf.beginPath(); gf.moveTo(Math.cos(a) * 7, Math.sin(a) * 7); gf.lineTo(Math.cos(a) * 20, Math.sin(a) * 20); gf.stroke(); } gf.restore();
  /* masts, spars, rigging, rags of sail */
  gf.lineCap = "round"; gf.strokeStyle = rgb(mixc(wood, woodD, 0.3)); gf.lineWidth = 10;
  const mast = (x, top, tilt) => { gf.lineWidth = 11; gf.beginPath(); gf.moveTo(O[0] + x, O[1] + 168); gf.lineTo(O[0] + x + tilt, O[1] + top); gf.stroke(); gf.lineWidth = 5; gf.beginPath(); gf.moveTo(O[0] + x + tilt, O[1] + top); gf.lineTo(O[0] + x + tilt + 8, O[1] + top - 14); gf.stroke(); };
  mast(110, 20, -6); mast(300, -60, 10); mast(500, 40, -4);
  gf.lineWidth = 6; gf.beginPath(); gf.moveTo(O[0] + 232, O[1] - 14); gf.lineTo(O[0] + 372, O[1] - 10); gf.stroke();
  gf.beginPath(); gf.moveTo(O[0] + 66, O[1] + 40); gf.lineTo(O[0] + 150, O[1] + 34); gf.stroke();
  gf.fillStyle = rgb(TT([196, 186, 160]), 0.55); blob(gf, [[O[0] + 240, O[1] - 8], [O[0] + 300, O[1] + 12], [O[0] + 366, O[1] - 4], [O[0] + 352, O[1] + 52], [O[0] + 318, O[1] + 40], [O[0] + 300, O[1] + 78], [O[0] + 270, O[1] + 46], [O[0] + 246, O[1] + 66]]); gf.fill();
  gf.strokeStyle = rgb(TT([40, 34, 30]), 0.75); gf.lineWidth = 1.4;
  [[300 + 10, -60, 40, 160], [300 + 10, -60, 460, 170], [110 - 6, 20, 20, 150], [110 - 6, 20, 190, 160], [500 - 4, 40, 440, 124], [500 - 4, 40, 580, 128]].forEach((r) => { gf.beginPath(); gf.moveTo(O[0] + r[0], O[1] + r[1]); gf.quadraticCurveTo(O[0] + (r[0] + r[2]) / 2, O[1] + (r[1] + r[3]) / 2 + 22, O[0] + r[2], O[1] + r[3]); gf.stroke(); });
  /* convert hole positions to canvas coords with the tilt (done at runtime from a DOMMatrix) */
  const m = new DOMMatrix(); const tilt = ang * (flip ? -1 : 1);
  const toBox = (x, y) => { let px = O[0] + x, py = O[1] + y; const dx = px - cx, dy = py - cy, c = Math.cos(tilt), s = Math.sin(tilt); px = cx + dx * c - dy * s; py = cy + dx * s + dy * c; if (flip) px = WW - px; return { x: px, y: py }; };
  return { back, front, WW, WH, flip, holes: holes.map((h) => { const p = toBox(h[0], h[1]); return { x: p.x, y: p.y, rx: h[2], ry: h[3] }; }), toBox, tilt };
}

/* ---------- build everything static ---------- */
function buildScene() {
  const K = T.K, rs = T.rs; DAY = daylight(); T.lightBucket = Math.floor(DAY.h * 2);
  T.floorPh = [rs() * 6, rs() * 6];
  const d = DAY.v;
  /* background: water, far reef, far sand */
  const bg = mk(W * K, H * K), g = Ctx(bg, K);
  g.fillStyle = lg(g, 0, WATER, 0, H, [[0, rgb(mixc([4, 14, 30], WATERTOP, d))], [0.38, rgb(mixc([3, 10, 26], WATERMID, d))], [1, rgb(mixc([2, 6, 16], WATERDEEP, 0.6 + 0.4 * d))]]); g.fillRect(0, WATER, W, H - WATER);
  g.fillStyle = rg(g, W * 0.5, H * 0.45, 40, 760, [[0, "rgba(120,230,240,.14)"], [1, "rgba(0,0,0,0)"]]); g.globalAlpha = d; g.fillRect(0, WATER, W, H); g.globalAlpha = 1;
  const haze = mixc(mixc([3, 12, 28], WATERMID, d), [2, 8, 20], 0.2);
  for (let layer = 0; layer < 2; layer++) {
    const base = 520 + layer * 46, col = mixc(haze, mixc(WATERMID, [30, 90, 110], 0.4), 0.3 + layer * 0.2);
    for (let i = 0; i < 14; i++) { const x = rs() * W, w = 90 + rs() * 190, h = 40 + rs() * 110; const pts = []; for (let k = 0; k < 8; k++) { const a = Math.PI + (k / 7) * Math.PI; pts.push([x + Math.cos(a) * w / 2, base + 80 + Math.sin(a) * h * (0.7 + rs() * 0.4)]); } blob(g, pts); g.fillStyle = rgb(mixc(col, [0, 0, 0], rs() * 0.2), 0.92); g.fill(); }
  }
  g.fillStyle = lg(g, 0, 560, 0, 650, [[0, "rgba(0,0,0,0)"], [1, rgb(mixc(haze, [180, 170, 130], 0.18), 0.9)]]); g.fillRect(0, 560, W, 100);
  T.lay.bg = bg;

  /* wreck */
  const wr = buildWreck(rs); const wx = clamp(rint(150, W - wr.WW - 90), 100, 620);
  T.wreck = Object.assign(wr, { x: wx, y: floorY(wx + wr.WW / 2) - 372 });
  T.wreck.holes = wr.holes.map((h) => ({ x: wx + h.x, y: T.wreck.y + h.y, rx: h.rx, ry: h.ry }));
  T.wreck.box = { x0: wx + 30, x1: wx + wr.WW - 40, y0: T.wreck.y + 120, y1: T.wreck.y + 420 };

  /* mid (sand and rocks behind the wreck) and fore (in front of it) */
  const mid = mk(W * K, H * K), gm = Ctx(mid, K), fore = mk(W * K, H * K), gf = Ctx(fore, K), fg = mk(W * K, H * K), gg = Ctx(fg, K);
  const sandA = TT([210, 190, 140]), sandB = TT([150, 128, 90]);
  gm.beginPath(); gm.moveTo(0, H); for (let x = 0; x <= W; x += 8) gm.lineTo(x, floorY(x)); gm.lineTo(W, H); gm.closePath();
  gm.fillStyle = lg(gm, 0, 590, 0, H, [[0, rgb(mixc(sandA, hazeTo(sandA, 0.3), 0.5))], [1, rgb(sandB)]]); gm.fill();
  gm.save(); gm.clip(); gm.strokeStyle = "rgba(255,255,255,.11)"; gm.lineWidth = 2;
  for (let r = 0; r < 12; r++) { gm.beginPath(); const y0 = 650 + r * 6; for (let x = 0; x <= W; x += 10) { const yy = y0 + 3 * Math.sin(x * 0.04 + r * 1.7 + rs()); x ? gm.lineTo(x, yy) : gm.moveTo(x, yy); } gm.stroke(); }
  gm.restore();
  const ao = (g2, x, y, rx, a) => { g2.save(); g2.translate(x, y); g2.scale(1, 0.18); g2.fillStyle = rg(g2, 0, 0, 0, rx, [[0, "rgba(0,12,22," + a + ")"], [0.6, "rgba(0,12,22," + a * 0.5 + ")"], [1, "rgba(0,12,22,0)"]]); g2.beginPath(); g2.arc(0, 0, rx, 0, TAU); g2.fill(); g2.restore(); };
  ao(gm, wx + wr.WW / 2 + 10, floorY(wx + wr.WW / 2) - 20, wr.WW * 0.62, 0.55);
  const wl = wx - 20, wr2 = wx + wr.WW + 20;
  const free = () => { for (let k = 0; k < 20; k++) { const x = rs() * (W - 120) + 60; if (x < wl || x > wr2) return x; } return rs() < 0.5 ? 60 : W - 60; };
  const sizes = () => 0.8 + rs() * 0.5;
  /* behind-the-wreck rocks */
  for (let i = 0; i < 4; i++) { const x = rs() * W; drawRock(gm, x, floorY(x) + 2, 90 + rs() * 120, 50 + rs() * 50, rs, TT([100, 106, 112])); }
  if (rs() < 0.65) { const x = free(); const y = floorY(x) + 2; drawRock(gm, x - 70, y, 100, 120, rs, TT([96, 104, 112])); drawRock(gm, x + 70, y, 100, 110, rs, TT([96, 104, 112])); gm.fillStyle = rgb(TT([88, 96, 104])); blob(gm, [[x - 110, y - 100], [x - 60, y - 142], [x, y - 150], [x + 62, y - 140], [x + 112, y - 96], [x + 60, y - 100], [x, y - 110], [x - 60, y - 104]]); gm.fill(); T.arch = { x, y: y - 56 }; }
  /* in front of the wreck */
  const coralsAt = [];
  const place = (n, fn) => { for (let i = 0; i < n; i++) { const x = free(); ao(gf, x, floorY(x) + 10, 70, 0.4); fn(x, floorY(x) + rint(-4, 14), rs() * 0.5 + 0.8); coralsAt.push(x); } };
  const col = () => TT(pick(CORALS));
  place(rint(2, 3), (x, y, s) => drawBrain(gf, x, y, 34 * s, col(), rs));
  place(rint(3, 4), (x, y, s) => drawStag(gf, x, y, 118 * s, col(), rs));
  place(rint(1, 2), (x, y, s) => drawTable(gf, x, y, 130 * s, col(), rs));
  place(rint(2, 3), (x, y, s) => drawFan(gf, x, y, 130 * s, TT(pick([[170, 70, 190], [230, 90, 100], [250, 150, 60]])), rs));
  place(rint(2, 3), (x, y, s) => drawTubes(gf, x, y, 70 * s, TT(pick([[236, 190, 70], [220, 100, 140], [90, 170, 210]])), rs));
  place(rint(3, 5), (x, y, s) => drawSoft(gf, x, y, 30 * s, col(), rs));
  place(rint(3, 5), (x, y, s) => drawRock(gf, x, y, 50 * s, 26 * s, rs, TT([112, 108, 100])));
  for (let i = 0; i < 3; i++) { const x = rs() * W; drawUrchin(gf, x, floorY(x) + 8, 7, TT(pick([[40, 20, 70], [20, 20, 30], [120, 40, 60]]))); }
  for (let i = 0; i < 4; i++) { const x = rs() * W; drawStar(gf, x, floorY(x) + 14, 11 + rs() * 6, TT(pick([[240, 120, 60], [230, 70, 70], [250, 190, 80]]))); }
  for (let i = 0; i < 12; i++) { const x = rs() * W; drawShell(gf, x, floorY(x) + 18 + rs() * 8, 5 + rs() * 4, TT(pick([[240, 220, 200], [230, 180, 160], [210, 190, 220]]))); }
  /* the chest, anchor, amphorae */
  const cx = clamp(wr2 + 40 + rs() * 120, 120, W - 120); T.chest = { x: cx > W - 100 ? wl - 120 : cx, y: 0 }; T.chest.y = floorY(T.chest.x) + 14;
  if (rs() < 0.7) { const x = free(); drawAnchor(gf, x, floorY(x) - 20, 1.1); }
  if (rs() < 0.8) { const x = free(); drawAmphora(gf, x, floorY(x) + 12, 0.9, -0.2); if (rs() < 0.6) drawAmphora(gf, x + 40, floorY(x) + 18, 0.75, 1.15); }
  /* seagrass and anemone homes (animated each frame) */
  T.grass = []; for (let i = 0; i < 16; i++) { const x = free(); T.grass.push({ x, y: floorY(x) + 6, h: 50 + rs() * 70, n: rint(5, 9), ph: rs() * 6, col: TT(pick([[70, 150, 90], [90, 170, 70], [60, 130, 100]])) }); }
  T.anem = []; for (let i = 0; i < 3; i++) { const x = free(); T.anem.push({ x, y: floorY(x) + 6, r: 24 + rs() * 12, col: TT(pick([[220, 90, 150], [160, 90, 200], [240, 170, 60]])), ph: rs() * 6 }); }
  T.fans = [];
  T.lay.mid = mid; T.lay.fore = fore; T.lay.fg = fg;
  /* caustic tile */
  const ct = mk(256, 256), gc = ct.getContext("2d"); gc.strokeStyle = "rgba(255,255,255,.55)"; gc.lineWidth = 2.2; gc.lineCap = "round";
  for (let i = 0; i < 46; i++) { const x = rs() * 256, y = rs() * 256, r = 10 + rs() * 22; for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { gc.beginPath(); for (let k = 0; k <= 7; k++) { const a = (k / 7) * TAU, rr = r * (0.7 + 0.5 * Math.sin(a * 3 + i)); gc.lineTo(x + ox + Math.cos(a) * rr, y + oy + Math.sin(a) * rr * 0.85); } gc.stroke(); } }
  T.lay.caustic = ct;
  /* clouds */
  T.clouds = []; for (let i = 0; i < 5; i++) T.clouds.push({ x: rs() * W, y: 8 + rs() * 40, s: 0.7 + rs() * 1.1, v: 4 + rs() * 8 });
  T.stars = []; for (let i = 0; i < 60; i++) T.stars.push([rs() * W, rs() * (WATER - 10), rs() * 1.4 + 0.4, rs() * 6]);
}
