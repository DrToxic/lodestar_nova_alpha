/*TANK-BEGIN*/
(() => {
"use strict";
/* ============================================================ Shark tank: a colour, saltwater aquarium drawn on a canvas (dashboard only).
   Logical size 1280 x 720, scaled to the screen.  Nothing here touches the radio: it only reads the data the dashboard already has. */
const W = 1280, H = 720, WATER = 96, TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (a) => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sgn = (v) => (v < 0 ? -1 : 1);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rgb = (c, a) => (a === undefined || a >= 1 ? "rgb(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + ")" : "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a + ")");
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const H2 = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

const T = {
  on: false, raf: 0, last: 0, acc: 0, time: 0, paused: false, K: 1, cw: 0, ch: 0,
  cv: null, g: null, tip: null,
  seed: 0, rs: null, lay: {}, wreck: null, floorPh: [0, 0],
  sharks: [], fish: [], schools: [], chum: [], parts: [], bubbles: [], boat: null, gulls: [], divers: [], extras: [], jelly: [], crabs: [], flakes: [],
  hears: 0, need: 35, boats: 0, clarity: 0.8, clarityT: 0.8, lightBucket: -1, dl: 0, chestOpen: 0,
  nextSchool: 6, nextRare: 40, nextBird: 30, nextDiver: 120, mouse: null, lastBubble: 0, packetRate: 0,
};

/* ---------- water colours by time of day (local clock) ---------- */
function daylight() {
  const d = new Date(), h = d.getHours() + d.getMinutes() / 60;
  // 0 = dark night, 1 = full day
  const v = h < 5 ? 0 : h < 7 ? (h - 5) / 2 : h < 17.5 ? 1 : h < 19.5 ? 1 - (h - 17.5) / 2 : 0;
  return { v: 0.22 + 0.78 * v, h, warm: (h >= 5.2 && h < 7.5) || (h >= 17.2 && h < 19.6) ? 1 : 0, night: v < 0.05 };
}
let DAY = daylight();
const WATERTOP = [60, 190, 205], WATERMID = [18, 108, 160], WATERDEEP = [6, 36, 74];
const wcol = (c, k) => mixc([2, 8, 20], c, k);

/* ---------- floor ---------- */
function floorY(x) { return 636 + 12 * Math.sin(x * 0.0055 + T.floorPh[0]) + 7 * Math.sin(x * 0.0173 + T.floorPh[1]) + (x < 90 ? (90 - x) * 0.25 : 0) + (x > W - 90 ? (x - W + 90) * 0.25 : 0); }

/* ---------- canvases ---------- */
function mk(w, h) { const c = document.createElement("canvas"); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function Ctx(c, K) { const g = c.getContext("2d"); g.setTransform(K, 0, 0, K, 0, 0); return g; }

/* ---------- drawing helpers ---------- */
function blob(g, pts, close) {
  const n = pts.length; g.beginPath();
  g.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
  if (close !== false) g.closePath();
}
function jag(rs, cx, cy, rx, ry, n, j) { const p = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, k = 1 + (rs() - 0.5) * 2 * j; p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return p; }
function poly(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
function lg(g, x0, y0, x1, y1, stops) { const q = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((s) => q.addColorStop(s[0], s[1])); return q; }
function rg(g, x, y, r0, r1, stops) { const q = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach((s) => q.addColorStop(s[0], s[1])); return q; }
