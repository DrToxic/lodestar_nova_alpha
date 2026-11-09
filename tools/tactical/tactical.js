/* ============================================================ ORION TACTICAL DASHBOARD: status strip and radar (display only; reads S.found, MESH and the radio frames) */
(function () {
  const TAU = Math.PI * 2, PERIOD = 6500, reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const R = { cv: null, g: null, win: 900000, prev: 0, t0: performance.now(), lit: new Map(), ping: new Map(), mna: new Map(), rows: [], pts: [], range: 1000, rangeT: 1000, hi: "", css: null, cssAt: 0, listAt: 0, raf: 0, idx: 0, size: 0 };
  try { const w = +localStorage.getItem("orion-radarwin"); if (w === 300000 || w === 900000 || w === 3600000) R.win = w; } catch (e) { /* default */ }
  const hash = (k) => { let h = 2166136261; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const RINGS = [250, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];
  const rad = Math.PI / 180, ageText = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return s < 90 ? s + " s" : s < 5400 ? Math.round(s / 60) + " min" : Math.round(s / 3600) + " h"; };
  const fmtD = (m) => (m < 1000 ? Math.round(m) + " m" : (m / 1000).toFixed(m < 10000 ? 1 : 0) + " km");
  const distM = (a, b) => { const dl = (b[0] - a[0]) * rad, dn = (b[1] - a[1]) * rad, h = Math.sin(dl / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dn / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(h)); };
  const brg = (a, b) => { const y = Math.sin((b[1] - a[1]) * rad) * Math.cos(b[0] * rad), x = Math.cos(a[0] * rad) * Math.sin(b[0] * rad) - Math.sin(a[0] * rad) * Math.cos(b[0] * rad) * Math.cos((b[1] - a[1]) * rad); return (Math.atan2(y, x) / rad + 360) % 360; };
  const CP = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"], cpass = (d) => CP[Math.round(d / 45) % 8];
  function here() { const g = S.frame && S.frame.gps; return g && g.fix && isFinite(+g.lat) && isFinite(+g.lon) ? [+g.lat, +g.lon] : null; }
  function colours() { const t = performance.now(); if (R.css && t - R.cssAt < 1500) return R.css; const cs = getComputedStyle(document.documentElement), v = (n) => cs.getPropertyValue(n).trim(); R.cssAt = t; R.css = { ink: v("--ink"), muted: v("--muted"), accent: v("--accent"), t2: v("--rep"), t1: v("--comp"), t3: v("--room"), t4: v("--sens"), light: document.documentElement.getAttribute("data-theme") === "light" }; return R.css; }
  /* live Mesh Analyzer packets: a packet from a known contact counts as hearing it right now */
  function mnaScan() {
    const recs = MESH.recs; if (R.idx > recs.length) R.idx = 0; const t = Date.now();
    for (let i = R.idx; i < recs.length; i++) { const r = recs[i]; if (r.tx || !r.src) continue; S.found.forEach((n) => { if (typeof n.k === "string" && n.k.toLowerCase().startsWith(r.src)) { R.mna.set(n.k, t); R.ping.set(n.k, performance.now()); } }); }
    R.idx = recs.length;
  }
  function contacts() {
    const t = Date.now(), h = here(), out = [];
    S.found.forEach((n) => { const last = Math.max(n.last || 0, R.mna.get(n.k) || 0); if (!last || t - last > R.win || !(n.t >= 1)) return;
      const p = n.alat != null && n.alon != null ? [n.alat, n.alon] : null; let ang, dist = -1, pos = false; if (h && p) { ang = brg(h, p) * rad; dist = distM(h, p); pos = true; } else ang = hash(n.k) * TAU; out.push({ n, last, ang, dist, pos }); });
    let far = 0; out.forEach((c) => { if (c.pos && c.dist > far) far = c.dist; });
    R.rangeT = far ? (RINGS.find((r) => r >= far * 1.08) || RINGS[RINGS.length - 1]) : 1000;
    out.forEach((c) => { c.frac = c.pos ? Math.min(0.97, c.dist / R.range) : 0.9 - 0.75 * Math.min(1, Math.max(0, ((+c.n.sn) + 20) / 35)); });
    return out;
  }
  function fit() { const cv = R.cv, w = Math.max(200, Math.round(cv.clientWidth)), d = Math.min(2, window.devicePixelRatio || 1); if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(w * d); } R.g = cv.getContext("2d"); R.g.setTransform(cv.width / w, 0, 0, cv.width / w, 0, 0); return w; }
  function shape(g, type, x, y, r, solid, col) {
    g.beginPath();
    if (type === 2) g.arc(x, y, r, 0, TAU); else if (type === 1) { g.moveTo(x, y - r * 1.15); g.lineTo(x + r * 1.05, y + r * 0.8); g.lineTo(x - r * 1.05, y + r * 0.8); g.closePath(); } else { g.moveTo(x, y - r * 1.2); g.lineTo(x + r * 1.1, y); g.lineTo(x, y + r * 1.2); g.lineTo(x - r * 1.1, y); g.closePath(); }
    if (solid) { g.fillStyle = col; g.fill(); } else { g.lineWidth = 2; g.strokeStyle = col; g.stroke(); }
  }
  const root = document.documentElement, isTac = () => root.classList.contains("tac");
  function frame() {
    R.raf = 0; const cv = R.cv; if (!cv || document.hidden || !isTac()) return;
    mnaScan();
    const w = fit(), g = R.g, C = colours(), t = performance.now(), cx = w / 2, cy = w / 2, rd = w / 2 - 22;
    const sig = reduce ? 0 : (((t - R.t0) % PERIOD) / PERIOD) * TAU, prev = R.prev; R.prev = sig;
    R.range += (R.rangeT - R.range) * 0.05;
    const list = contacts(); R.rows = list; g.clearRect(0, 0, w, w);
    const bgc = g.createRadialGradient(cx, cy, 0, cx, cy, rd + 20); if (C.light) { bgc.addColorStop(0, "#eaf5ee"); bgc.addColorStop(1, "#cfe0d5"); } else { bgc.addColorStop(0, "#07251c"); bgc.addColorStop(1, "#020c09"); }
    g.fillStyle = bgc; g.beginPath(); g.arc(cx, cy, rd + 18, 0, TAU); g.fill(); g.strokeStyle = C.accent; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, rd + 18, 0, TAU); g.stroke();
    g.strokeStyle = C.light ? "rgba(10,90,60,.35)" : "rgba(61,255,168,.28)"; g.lineWidth = 1;
    for (let i = 1; i <= 4; i++) { g.beginPath(); g.arc(cx, cy, rd * i / 4, 0, TAU); g.stroke(); }
    for (let a = 0; a < 360; a += 30) { const r = a * rad; g.beginPath(); g.moveTo(cx + Math.sin(r) * rd * 0.06, cy - Math.cos(r) * rd * 0.06); g.lineTo(cx + Math.sin(r) * rd, cy - Math.cos(r) * rd); g.stroke(); }
    for (let a = 0; a < 360; a += 5) { const r = a * rad, l = a % 10 ? 4 : 8; g.beginPath(); g.moveTo(cx + Math.sin(r) * (rd + 18), cy - Math.cos(r) * (rd + 18)); g.lineTo(cx + Math.sin(r) * (rd + 18 - l), cy - Math.cos(r) * (rd + 18 - l)); g.stroke(); }
    g.font = "bold 13px ui-monospace, Consolas, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = C.accent;
    [["N", 0], ["E", 90], ["S", 180], ["W", 270]].forEach((d) => { const r = d[1] * rad; g.fillText(d[0], cx + Math.sin(r) * (rd + 6), cy - Math.cos(r) * (rd + 6)); });
    g.font = "11px ui-monospace, Consolas, monospace"; g.fillStyle = C.muted; g.textAlign = "left";
    for (let i = 1; i <= 4; i++) g.fillText(fmtD(R.range * i / 4), cx + 4, cy - rd * i / 4 - 7);
    if (!reduce) {
      for (let k = 0; k < 44; k++) { const a1 = sig - k * 0.028 - Math.PI / 2, a0 = a1 - 0.03, al = 0.34 * Math.pow(1 - k / 44, 2); g.fillStyle = C.light ? "rgba(10,140,80," + al * 0.8 + ")" : "rgba(61,255,168," + al + ")"; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, rd, a0, a1 + 0.002); g.closePath(); g.fill(); }
      g.strokeStyle = C.t2; g.lineWidth = 2; g.shadowColor = C.t2; g.shadowBlur = C.light ? 0 : 8; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(sig) * rd, cy - Math.cos(sig) * rd); g.stroke(); g.shadowBlur = 0;
    }
    const seen = new Set(), pts = [];
    list.forEach((c) => {
      const k = c.n.k; seen.add(k); let a = c.ang % TAU; if (a < 0) a += TAU;
      const crossed = prev <= sig ? (prev <= a && a < sig) : (a >= prev || a < sig); if (!reduce && crossed) R.lit.set(k, t);
      let al; if (reduce) al = 0.9; else { const l = R.lit.get(k); if (l === undefined) return; al = Math.pow(Math.max(0, 1 - (t - l) / (PERIOD * 1.02)), 1.3); }
      const x = cx + Math.sin(c.ang) * c.frac * rd, y = cy - Math.cos(c.ang) * c.frac * rd, col = C["t" + c.n.t] || C.t4, pg = R.ping.get(k);
      if (pg !== undefined && t - pg < 900) { g.strokeStyle = C.accent; g.globalAlpha = (1 - (t - pg) / 900) * 0.9; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 8 + (t - pg) / 22, 0, TAU); g.stroke(); g.globalAlpha = 1; }
      if (al <= 0.03) return; pts.push({ c, x, y });
      const since = reduce ? 9999 : t - R.lit.get(k); if (since < 700) { g.strokeStyle = col; g.globalAlpha = (1 - since / 700) * 0.8; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 6 + since / 18, 0, TAU); g.stroke(); }
      g.globalAlpha = al; g.shadowColor = col; g.shadowBlur = C.light ? 0 : 12 * al; shape(g, c.n.t, x, y, 6.5, c.pos, col); g.shadowBlur = 0;
      if (al > 0.4 || R.hi === k) { g.globalAlpha = Math.max(al, R.hi === k ? 1 : 0); g.font = "12px ui-monospace, Consolas, monospace"; g.textAlign = x > cx ? "left" : "right"; g.textBaseline = "middle"; g.fillStyle = C.ink; g.fillText((c.n.n || c.n.k.slice(0, 6)).slice(0, 18), x + (x > cx ? 11 : -11), y); }
      g.globalAlpha = 1;
    });
    R.pts = pts; for (const k of R.lit.keys()) if (!seen.has(k)) R.lit.delete(k);       // no longer heard: gone from the radar
    g.globalAlpha = 1; g.fillStyle = C.accent; g.beginPath(); g.arc(cx, cy, 4, 0, TAU); g.fill(); g.strokeStyle = C.accent; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, 9, 0, TAU); g.stroke();
    if (!list.length) { g.fillStyle = C.muted; g.font = "bold 15px ui-monospace, Consolas, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(S.mode === "off" ? "NO RADIO CONNECTED" : "NO CONTACTS HEARD", cx, cy + rd * 0.4); }
    g.font = "12px ui-monospace, Consolas, monospace"; g.textAlign = "left"; g.textBaseline = "top"; g.fillStyle = C.muted;
    const cnt = (ty) => list.filter((c) => (ty === 3 ? c.n.t >= 3 : c.n.t === ty)).length;
    g.fillText("REP " + cnt(2) + "  CMP " + cnt(1) + "  RM " + cnt(3), 6, 4); g.textAlign = "right"; g.fillText("RNG " + fmtD(R.range), w - 6, 4);
    g.textAlign = "left"; g.textBaseline = "bottom"; g.fillText(reduce ? "STATIC" : "SWEEP " + (PERIOD / 1000).toFixed(1) + "s", 6, w - 4);
    if (t - R.listAt > 1000) { R.listAt = t; fillList(list); }
    R.raf = requestAnimationFrame(frame);
  }
  function fillList(list) {
    const h = here(), t = Date.now(), a = list.slice().sort((x, y) => y.n.sn - x.n.sn), nm = { 1: "companion", 2: "repeater", 3: "room server", 4: "sensor" };
    const el = $("radarList");
    el.innerHTML = a.length ? a.map((c) => { const n = c.n, sym = n.t === 2 ? "&#9679;" : n.t === 1 ? "&#9650;" : "&#9670;";
      return '<div class="rr' + (R.hi === n.k ? " hi" : "") + '" data-k="' + esc(n.k) + '"><span class="sy t' + (n.t >= 1 && n.t <= 4 ? n.t : 4) + '">' + sym + '</span><span class="nm">' + esc(n.n || "(no name)") + '</span><span class="note">' + esc(nm[n.t] || "node") + '</span><span class="mt">SNR ' + esc(n.sn) + " dB &middot; RSSI " + esc(n.rs) + " &middot; " + (n.hop === 0 ? "direct" : esc(n.hop) + " hops") + " &middot; " + ageText(t - c.last) + " ago" + (c.pos && h ? " &middot; " + esc(fmtD(c.dist) + " " + cpass(c.ang / rad)) : "") + "</span></div>"; }).join("") : '<p style="margin:10px;color:var(--muted)">Nothing heard in this time.</p>';
    el.querySelectorAll(".rr").forEach((r) => { r.addEventListener("mouseenter", () => { R.hi = r.dataset.k; }); r.addEventListener("mouseleave", () => { R.hi = ""; }); });
    const np = list.filter((c) => !c.pos).length;
    $("radarNote").textContent = (reduce ? "Motion is reduced on this device, so contacts are shown steady. " : "Each contact lights when the sweep passes it and fades until the next pass; a ring flashes when the Mesh Analyzer hears a packet from it. A contact that is no longer heard leaves the radar. ") + (np ? np + " contact" + (np === 1 ? " has" : "s have") + " no known position, so " + (np === 1 ? "it is" : "they are") + " placed by signal strength (stronger is nearer the centre) at an arbitrary direction." : (h ? "" : "No GPS fix, so distances are not shown."));
  }
  function hud() {
    const d = new Date(), p = (v) => String(v).padStart(2, "0"), h = here(), live = S.mode !== "off", mnaAge = MESH.seen ? Date.now() - MESH.seen : -1;
    $("hudZ").textContent = p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds()) + "Z"; $("hudL").textContent = p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
    $("hudLink").textContent = !live ? "OFFLINE" : S.mode === "demo" ? "SAMPLE" : S.frame ? "LIVE" : "WAITING";
    const t = Date.now(), cnt = (ty) => { let k = 0; S.found.forEach((n) => { if ((ty === 3 ? n.t >= 3 : n.t === ty) && n.last && t - n.last <= 900000) k++; }); return k; };
    $("hudC").textContent = cnt(2) + "/" + cnt(1) + "/" + cnt(3); $("hudG").textContent = h ? "FIX" : S.frame && S.frame.gps ? "NO FIX" : "N/A";
    $("hudM").textContent = mnaAge >= 0 && mnaAge < 20000 ? "ONLINE" : mnaAge >= 0 ? "SILENT" : "STANDBY";
    $("hudP").textContent = MESH.rxTotal != null ? (MESH.rxTotal || 0) + "/" + (MESH.txTotal || 0) : "0/0";
    const nf = MESH.nf && MESH.nf.length ? MESH.nf[MESH.nf.length - 1].v : null; $("hudN").textContent = nf != null ? nf + " dBm" : "--";
  }
  /* this page is for LODESTAR ORION with the Mesh Analyzer: say so when the radio is something else, or the analyzer is silent */
  let warned = "", connectedAt = 0;
  function gate() {
    if (S.mode === "off") { connectedAt = 0; return; } if (!connectedAt) connectedAt = Date.now();
    if (S.mode === "demo") return;
    let msg = "";
    if (S.frame && S.frame.ed !== "orion") msg = "This is the ORION TACTICAL DASHBOARD. It is made for LODESTAR ORION firmware on a Heltec V4.3 R2 or V4 R8, but this radio reports a different firmware (" + String(S.frame.ed || "unknown").replace(/[^\w .-]/g, "").slice(0, 20) + "). Use the standard dashboard for it.";
    else if (S.frame && !MESH.seen && Date.now() - connectedAt > 25000) msg = "The Mesh Analyzer is not sending yet. It needs LODESTAR ORION with the Mesh Analyzer firmware. Contacts still show from the radio's contact list.";
    if (msg !== warned) { warned = msg; if (msg) notice(msg); else if ($("notice").textContent.indexOf("ORION TACTICAL") === 0 || $("notice").textContent.indexOf("The Mesh Analyzer is not") === 0) notice(""); }
  }
  /* ---- layout: fill the left column (it ended after Battery while the right ran on) and add two tiles ---- */
  const LOG = [], seenK = new Map(); let logInit = false;
  const hnd = (h) => [...document.querySelectorAll(".grid .panel h2")].find((e) => e.textContent.trim().toLowerCase().startsWith(h));
  function mk(id, title, note, inner) { const sec = document.createElement("section"); sec.className = "panel"; sec.id = id; sec.innerHTML = "<h2>" + title + ' <span class="note">' + note + "</span></h2>" + inner; return sec; }
  function layout() {
    const rep = hnd("repeaters this radio hears"), bat = hnd("battery, last 4 hours"), msg = hnd("messages you sent", 1), set = hnd("settings");
    const left = rep && rep.closest(".col"); if (!left) return;
    if (!orig) orig = [...document.querySelectorAll(".grid > .col")].map((c) => [c, [...c.children]]);
    if ($("bookPanel")) { rep.closest(".panel").after($("bookPanel")); const bp0 = bat && bat.closest(".panel"); if (bp0) bp0.after($("logPanel")); moveTiles(left, msg, set); return; }
    const book1 = mk("bookPanel", "Range book", "the contacts in the radar window, by the numbers", '<div class="bookgrid" id="bookGrid"></div><p class="hint" id="bookNote"></p>');
    const log1 = mk("logPanel", "Contact log", "contacts appearing on and dropping off the radar", '<ul class="clog" id="clogList"></ul><p class="empty" id="clogEmpty">Nothing yet. A line appears when a contact is first heard or has not been heard for the whole radar window.</p>');
    rep.closest(".panel").after(book1);
    const batP = bat && bat.closest(".panel"); (batP || left.lastElementChild).after(log1);
    moveTiles(left, msg, set);
  }
  let orig = null;
  // Messages you sent (the one in the grid, not the readout tile) and Settings move to the left column
  function moveTiles(left, msg, set) {
    [...document.querySelectorAll(".grid .panel h2")].filter((e) => e.textContent.trim().toLowerCase() === "messages you sent").forEach((e) => { const pn = e.closest(".panel"); if (pn && pn.parentElement !== left) left.appendChild(pn); });
    if (set) { const pn = set.closest(".panel"); if (pn && pn.parentElement !== left) left.appendChild(pn); }
  }
  function unlayout() { if (orig) orig.forEach(([c, kids]) => kids.forEach((k) => c.appendChild(k))); }
  /* keep the two columns about the same height whatever the data: move the last tile of the taller column across when that makes them closer */
  function balance() {
    if (!isTac()) return; const cols = document.querySelectorAll(".grid > .col"); if (cols.length !== 2) return; const a = cols[0], b = cols[1];
    if (a.offsetLeft === b.offsetLeft) return;   // phone layout: one column
    for (let i = 0; i < 8; i++) {
      const ch = (c) => [...c.children].reduce((t, x) => t + x.offsetHeight + 12, 0), ha = ch(a), hb = ch(b), from = ha > hb ? a : b, to = from === a ? b : a, last = from.lastElementChild; if (!last || from.children.length < 3) return;
      const h = last.offsetHeight + 12, d = Math.abs(ha - hb); if (Math.abs(Math.abs(ha - hb) - 2 * h) >= d) return;
      to.appendChild(last);
    }
  }
  function book() {
    const g = $("bookGrid"); if (!g) return;
    const list = contacts(), t = Date.now(), h = here(), cnt = { 2: 0, 1: 0, 3: 0, 4: 0 };
    list.forEach((c) => { if (cnt[c.n.t] != null) cnt[c.n.t]++; });
    const pick = (f, cmp) => list.filter(f).sort(cmp)[0], name = (c) => (c.n.n || c.n.k.slice(0, 6));
    const best = pick((c) => isFinite(+c.n.sn), (a, b) => +b.n.sn - +a.n.sn), far = pick((c) => c.pos, (a, b) => b.dist - a.dist), near = pick((c) => c.pos, (a, b) => a.dist - b.dist), fresh = pick(() => true, (a, b) => b.last - a.last);
    const direct = list.filter((c) => c.n.hop === 0).length, pl = list.filter((c) => c.pos).length;
    const tile = (k, v, sub) => '<div class="bk"><span>' + k + "</span><b>" + esc(String(v)) + "</b><small>" + esc(String(sub || "")) + "</small></div>";
    g.innerHTML =
      tile("Repeaters", cnt[2], "heard in window") + tile("Companions", cnt[1], "heard in window") + tile("Room servers", cnt[3], "heard in window") + tile("Direct", direct, "zero hops") +
      tile("Strongest", best ? (+best.n.sn).toFixed(1) + " dB" : "--", best ? name(best) : "no contact") + tile("Farthest", far ? fmtD(far.dist) : "--", far ? name(far) + " " + cpass(far.ang / rad) : (h ? "no positions" : "needs GPS fix")) +
      tile("Nearest", near ? fmtD(near.dist) : "--", near ? name(near) + " " + cpass(near.ang / rad) : (h ? "no positions" : "needs GPS fix")) + tile("Latest", fresh ? ageText(t - fresh.last) + " ago" : "--", fresh ? name(fresh) : "nobody yet");
    $("bookNote").textContent = list.length ? pl + " of " + list.length + " have a known position; the rest are placed by signal strength." : "No contacts in the last " + (R.win / 60000) + " minutes.";
    // contact log: first heard / dropped off, judged against the same window as the radar
    const now = new Set(); list.forEach((c) => now.add(c.n.k));
    if (logInit) { now.forEach((k) => { if (!seenK.has(k)) { const c = list.find((x) => x.n.k === k); LOG.unshift({ t, up: true, n: c.n }); } }); seenK.forEach((n, k) => { if (!now.has(k)) LOG.unshift({ t, up: false, n }); }); }
    seenK.clear(); list.forEach((c) => seenK.set(c.n.k, c.n)); logInit = true; if (LOG.length > 60) LOG.length = 60;
    const ul = $("clogList"), kind = { 1: "companion", 2: "repeater", 3: "room server", 4: "sensor" };
    if (ul) { ul.innerHTML = LOG.map((e) => "<li><span class=\"" + (e.up ? "up" : "dn") + "\">" + (e.up ? "HEARD" : "LOST") + "</span><span>" + esc(e.n.n || e.n.k.slice(0, 6)) + " <small>" + (kind[e.n.t] || "node") + "</small></span><time>" + new Date(e.t).toLocaleTimeString([], { hour12: false }) + "</time></li>").join(""); $("clogEmpty").hidden = LOG.length > 0; }
  }
  function init() {
    R.cv = $("radarCv"); const sel = $("radarWin"); sel.value = String(R.win);
    sel.addEventListener("change", () => { R.win = +sel.value; try { localStorage.setItem("orion-radarwin", String(R.win)); } catch (e) { /* ok */ } R.lit.clear(); });
    R.cv.addEventListener("pointermove", (ev) => { const r = R.cv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top, tip = $("radarTip"); let best = null, bd = 18; R.pts.forEach((p) => { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } });
      if (best) { const n = best.c.n; R.hi = n.k; tip.hidden = false; tip.textContent = (n.n || n.k.slice(0, 6)) + " – " + ({ 1: "companion", 2: "repeater", 3: "room server" }[n.t] || "node") + " – SNR " + n.sn + " dB – " + (n.hop === 0 ? "direct" : n.hop + " hops") + " – " + ageText(Date.now() - best.c.last) + " ago"; tip.style.left = Math.min(x + 14, r.width - 230) + "px"; tip.style.top = Math.max(0, y - 34) + "px"; } else { R.hi = ""; tip.hidden = true; } });
    R.cv.addEventListener("pointerleave", () => { R.hi = ""; $("radarTip").hidden = true; });
    document.addEventListener("visibilitychange", () => { if (!R.raf && isTac()) R.raf = requestAnimationFrame(frame); });
    const sb = document.createElement("button"); sb.id = "stdBtn"; sb.type = "button"; sb.textContent = "Standard dashboard"; sb.title = "Back to the standard dashboard (pet or shark tank)";
    const bp = $("btnPet"); if (bp && bp.parentNode) bp.parentNode.insertBefore(sb, bp); else document.body.insertBefore(sb, document.body.firstChild);
    sb.addEventListener("click", () => setMode(false));
    const tb = $("tacBtn"); if (tb) tb.addEventListener("click", (ev) => { ev.preventDefault(); setMode(true); });
    const prevAsk = window.petAsk;
    window.petAsk = function () {     // in tactical mode: no pet picture; tell the radio to show its radar (it remembers; the pet keeps ageing)
      if (isTac()) { if (typeof S !== "undefined" && S.orion && Date.now() - tacAt > 20000) { tacAt = Date.now(); sendMode(true); } return; }
      if (typeof prevAsk === "function") return prevAsk.apply(this, arguments);
    };
    setInterval(balance, 5000); window.addEventListener("resize", balance);
    setInterval(() => { if (!isTac()) return; hud(); gate(); book(); brandFix(); }, 1000);
    let want = root.classList.contains("tac"); if (!OTR) { try { if (localStorage.getItem("lodestar-tac") === "1" || location.hash === "#tactical") want = true; } catch (e) { /* none */ } }
    root.classList.remove("tac"); setMode(want, false);
  }
  /* ---- the Tactical mode switch lives in this page, so the USB connection to the radio is never closed and reopened ---- */
  let stash = null, tacAt = 0;
  const OTR = root.classList.contains("otr");
  const TBRAND = OTR ? 'ORION TACTICAL RADIO<small>OTR by LODESTAR</small>' : 'LODESTAR ORION<small>tactical dashboard</small>', TTITLE = OTR ? "OTR - Orion Tactical Radio" : "ORION TACTICAL DASHBOARD";
  function brandFix() { const b = document.querySelector(".brand"); if (b && b.innerHTML !== TBRAND) b.innerHTML = TBRAND; if (document.title !== TTITLE) document.title = TTITLE; }
  function sendMode(on) { try { if (typeof S !== "undefined" && S.writer && S.orion) send("nova tac " + (on ? 1 : 0)); } catch (e) { /* not connected */ } }
  function setMode(on, save) {
    if (OTR) on = true;                       // OTR has no other mode
    const was = isTac(); if (on === was) return;
    root.classList.toggle("tac", on);
    if (save !== false) { try { localStorage.setItem("lodestar-tac", on ? "1" : "0"); } catch (e) { /* none */ } }
    if (on) {
      const b = document.querySelector(".brand"); stash = { b: b ? b.innerHTML : "", t: document.title };
      if (window.__setTopView) window.__setTopView("none", false);           // put the tank's borrowed panels back
      layout(); brandFix(); balance(); setTimeout(balance, 1500); hud(); book(); if (!R.raf) R.raf = requestAnimationFrame(frame); tacAt = Date.now();
    } else {
      unlayout(); warned = ""; const n = $("notice").textContent; if (n.indexOf("ORION TACTICAL") === 0 || n.indexOf("The Mesh Analyzer is not") === 0) notice("");
      const b = document.querySelector(".brand"); if (stash && b) { b.innerHTML = stash.b; document.title = stash.t; }
      let v = "pet"; try { v = localStorage.getItem("lodestar-top") || "pet"; } catch (e) { /* none */ } if (window.__setTopView) window.__setTopView(v, false);
    }
    sendMode(on);
  }
  window.__tac = { set: setMode, on: isTac };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
