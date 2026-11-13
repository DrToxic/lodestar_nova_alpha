// Dashboard check for the pet controls (docs/index.html). Plain node, no packages:  node nova/test/test_dashboard_pet.js
// 3) DX-Pro: the "nova hello" answer ({"ed":"dx-pro","nova":{"v":1,"caps":{...}}}, see fixtures/dxpro_hello.json) decides which controls exist.
// 1) static: the new block is hidden in the markup; 2) the page's own JS block (between PETCTL-START and PETCTL-END) is run against a tiny fake page.
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const html = fs.readFileSync(path.join(__dirname, "..", "..", "docs", "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL: " + m); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m + " (got " + JSON.stringify(a) + ", want " + JSON.stringify(b) + ")");

// ---- 1. static checks on the markup ----
ok(/<div class="pc" id="pcBox" hidden>/.test(html), "pcBox is hidden in the markup");
const pet = html.slice(html.indexOf('id="petPanel"'), html.indexOf('id="meshPanel"'));
ok(pet.indexOf('id="pcBox"') > 0, "pcBox sits inside the pet panel");
ok(/\.pc\[hidden\][^}]*display: none !important/.test(html), "CSS keeps [hidden] winning over the grid layout");
["pcClean", "pcFeed", "pcGuessPlay", "pcGuessHi", "pcGuessLo", "pcRefresh", "pcKeyUp", "pcKeyDown", "pcKeyLeft", "pcKeyRight", "pcKeyEnter", "pcKeyBack", "pcKeyClean"]
  .forEach((id) => ok(new RegExp('<button id="' + id + '"').test(pet), "button " + id + " exists inside the pet panel"));
ok(/id="pcGuessRow" hidden/.test(html), "guess buttons are hidden until the game is started");
const a = html.indexOf("/*PETCTL-START*/"), b = html.indexOf("/*PETCTL-END*/");
ok(a > 0 && b > a, "PETCTL block found");
const block = html.slice(a, b);
ok(!/innerHTML|eval\(|new Function|insertAdjacentHTML|document\.write/.test(block), "the block never uses innerHTML or eval");
ok(/\.toLowerCase\(\)/.test(block) && /\[0-9a-fA-F\]\{12\}/.test(block), "contact ids are checked as 12 hex characters");
ok(/PC\.reset\(\); pcSync\(\);/.test(html.slice(html.indexOf("async function connect"), html.indexOf("async function disconnect"))), "connect resets the block");
ok(/PC\.reset\(\); pcSync\(\);/.test(html.slice(html.indexOf("async function disconnect"), html.indexOf("/* reconnect by itself"))), "disconnect resets the block");

// ---- 2. run the block against a fake page ----
function makeEl(id) {
  return { id, disabled: id === "petNameIn" || id === "petNameSet", value: "", dataset: {}, hidden: id === "pcBox" || id === "pcGuessRow" || id === "petNameBox" || id === "meshPanel", textContent: "", className: "", children: [], handlers: {}, attrs: {},
    addEventListener(t, f) { (this.handlers[t] = this.handlers[t] || []).push(f); },
    fire(t, ev) { (this.handlers[t] || []).forEach((f) => f(ev || {})); },
    appendChild(c) { this.children.push(c); return c; }, replaceChildren() { this.children = []; },
    setAttribute(k, v) { this.attrs[k] = v; } };
}
const els = {}; const sent = []; let timers = []; let nowMs = 1000000;
const brand = { children: [], replaceChildren() { this.children = []; }, appendChild(c) { this.children.push(c); return c; }, get textContent() { return this.children.map((c) => c.textContent).join(""); } };
const ctx = {
  S: { mode: "serial" }, performance: { now: () => nowMs }, PET: { seen: 0 }, cmdLog: (t) => { ctx.cmdText = t; }, cmdText: "",
  $: (id) => els[id] || (els[id] = makeEl(id)),
  send: (l) => { sent.push(l); },
  document: { title: "", querySelector: (s) => (s === ".brand" ? brand : null), createTextNode: (t) => ({ textContent: t }), createElement: (t) => makeEl(t) },
  setTimeout: (f, ms) => { const t = { f, ms, on: true }; timers.push(t); return t; },
  clearTimeout: (t) => { if (t) t.on = false; },
  setInterval: () => 0, String, Array, JSON, Object, Date: { now: () => nowMs },
};
vm.createContext(ctx);
vm.runInContext(html.match(/^const N = .*$/m)[0].replace(/^const /, "var "), ctx);   // the page's own N()
["pcBox", "pcGuessRow"].forEach((id) => ctx.$(id));   // the page has these from the start (hidden in the markup)
vm.runInContext(block.replace(/^const /gm, "var ").replace(/^function /gm, "function "), ctx);
const run = (code) => vm.runInContext(code, ctx);
const box = () => els.pcBox.hidden;
const click = (id) => els[id].fire("click");
const fireTimers = () => { const t = timers.filter((x) => x.on); timers = []; t.forEach((x) => { x.on = false; x.f(); }); };

// hidden until the radio answers
ok(box() === true, "box is hidden at the start");
run("pcSync()"); ok(box() === true, "still hidden before any answer");
click("pcClean"); click("pcKeyUp"); click("pcRefresh");
eq(sent, [], "nothing is sent while the controls are hidden");
run("pcNote(false)"); ok(box() === true, "a bare OK alone (not known to be Orion) keeps it hidden");
run("pcNote(true)"); ok(box() === false, "shown once the radio has answered and is an Orion radio");
ctx.S.mode = "off"; run("pcSync()"); ok(box() === true, "hidden again when the port is gone");
ctx.S.mode = "serial"; run("PC.reset(); pcSync()"); ok(box() === true, "reset hides it");
run('pcReply("OK")'); ok(box() === true, "bare '# OK' alone does not show it");
run("pcNote(true)"); ok(box() === false, "shown after the mesh/frame answer");

// pet actions and exact command strings
click("pcClean"); click("pcFeed");
click("pcGuessPlay"); ok(els.pcGuessRow.hidden === false, "Play the guess game reveals higher/lower");
click("pcGuessHi"); click("pcGuessLo");
eq(sent, ["nova clean", "nova feed", "nova guess new", "nova guess higher", "nova guess lower"], "pet action commands");
sent.length = 0;
["pcKeyUp", "pcKeyDown", "pcKeyLeft", "pcKeyRight", "pcKeyBack", "pcKeyClean"].forEach(click);
eq(sent, ["nova key up", "nova key down", "nova key left", "nova key right", "nova key back", "nova clean"], "radio key commands");
ok(sent.every((l) => !/[\r\n]/.test(l)), "no line carries a newline of its own");

// reply goes to the section log and the command log; the keep-alive OK must not wipe it
sent.length = 0; click("pcFeed");
ok(els.pcPetLog.textContent === "Sent: nova feed", "log shows what was sent");
run('ctx_t = pcReply("OK - the pet is fed")'); ok(els.pcPetLog.textContent === "OK - the pet is fed", "reply shown in the pet log");
ok(ctx.ctx_t === false, "a real reply is passed on to the command log");
ok(run('pcReply("OK")') === true, "keep-alive OK is swallowed right after a reply, so the reply stays in the command log");
nowMs += 11000; ok(run('pcReply("OK")') === false, "later the keep-alive OK goes to the command log as before");

// hold-Enter
sent.length = 0; const en = els.pcKeyEnter;
en.fire("pointerdown", { button: 0 }); en.fire("pointerup"); eq(sent, ["nova key enter"], "short press sends enter");
sent.length = 0; en.fire("pointerdown", { button: 0 }); fireTimers(); eq(sent, ["nova key hold-enter"], "holding sends hold-enter after the timer");
en.fire("pointerup"); eq(sent, ["nova key hold-enter"], "releasing after a hold sends nothing more");
sent.length = 0; en.fire("pointerdown", { button: 0 }); en.fire("pointerleave"); fireTimers(); en.fire("pointerup"); eq(sent, [], "sliding off the button cancels");
sent.length = 0; en.fire("keydown", { key: "Enter", repeat: false, preventDefault() {} }); en.fire("keydown", { key: "Enter", repeat: true, preventDefault() {} }); en.fire("keyup", { key: "Enter", preventDefault() {} });
eq(sent, ["nova key enter"], "keyboard press sends one enter");

// contacts
sent.length = 0; click("pcRefresh"); eq(sent, ["nova contacts"], "Refresh contacts sends nova contacts");
const many = []; for (let i = 0; i < 20; i++) many.push({ n: "n" + i, id: i.toString(16).padStart(12, "0") });
eq(run("pcParseContacts")(JSON.stringify({ contacts: many })).length, 16, "at most 16 contacts");
const evil = JSON.stringify({ contacts: [{ n: "<img src=x onerror=alert(1)>\u0007" + "x".repeat(60), id: "AABBCCDDEEFF" }, { n: "bad", id: "12 ping 99" }, { n: "short", id: "abc" }, { n: "x", id: "aabbccddeeff\nnova key enter" }] });
const parsed = run("pcParseContacts")(evil);
eq(parsed.length, 1, "entries with an id that is not 12 hex characters are dropped");
eq(parsed[0].id, "aabbccddeeff", "id is lower-cased");
ok(parsed[0].n.length === 32 && !/\u0007/.test(parsed[0].n), "name is cut to 32 characters and control characters are removed");
ok(run("pcParseContacts")("not json") === null && run("pcParseContacts")('{"contacts":5}') === null, "garbage gives null");
ctx.line = JSON.stringify({ contacts: [{ n: "Ann <b>", id: "0123456789ab" }, { n: "Bob", id: "ba9876543210" }] });
run("onContactsLine(line)");
eq(els.pcContacts.children.length, 2, "two list entries");
const li = els.pcContacts.children[0];
eq(li.children.map((c) => c.textContent), ["Ann <b>", "0123456789ab", "Ping", "Send pet"], "entry shows name (as text), id and the two buttons");
ok(/2 contacts/.test(els.pcMeshLog.textContent) && /2 contacts/.test(ctx.cmdText), "reply summary in the mesh log and the command log");
sent.length = 0; li.children[2].fire("click"); li.children[3].fire("click");
eq(sent, ["nova ping 0123456789ab", "nova sendpet 0123456789ab"], "Ping and Send pet commands");
run('ctx_t = pcReply("ping sent")'); ok(els.pcMeshLog.textContent === "ping sent", "ping reply shows in the mesh log");
// the page cannot send anything outside its list
sent.length = 0; ok(run('pcSend("nova ping zz", "pcMeshLog")') === false && run('pcSend("nova reboot", "pcMeshLog")') === false, "unknown or bad lines are refused");
eq(sent, [], "and nothing goes out");

// ---- 3. DX-Pro hello and capabilities ----
const HELLO = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "dxpro_hello.json"), "utf8"));
ok(HELLO.ed === "dx-pro" && HELLO.nova.v === 1, "fixture is a dx-pro hello");
// the page's own line router, run against recorders
const routed = []; let frames = 0;
ctx.onMeshLine = (l) => routed.push("mesh"); ctx.onPetLine = (l) => routed.push("pet"); ctx.onFound = () => routed.push("found"); ctx.onFrame = () => { frames++; };
const ia = html.indexOf("function onLine(line) {"), ib = html.indexOf("\n}\n", ia);
ok(ia > 0 && ib > ia, "onLine found");
vm.runInContext(html.slice(ia, ib + 2), ctx);
const feed = (o) => run("onLine(" + JSON.stringify(typeof o === "string" ? o : JSON.stringify(o)) + ")");
const vis = (id) => !ctx.$(id).hidden;
const ALL = ["pcBox", "pcPet", "pcClean", "pcFeed", "pcGuessPlay", "pcMesh", "pcRefresh", "pcContacts", "pcKeys", "pcKeyUp", "pcKeyDown", "pcKeyLeft", "pcKeyEnter", "pcKeyRight", "pcKeyBack", "pcKeyClean", "petNameBox"];
const hello = (caps, extra) => Object.assign({ ed: "dx-pro", nova: { v: 1, caps } }, extra || {});
function fresh() { ctx.S.mode = "serial"; ctx.S.dxpro = false; ctx.S.lastAt = 0; run("PC.reset(); pcSync()"); sent.length = 0; routed.length = 0; frames = 0; run("document").title = ""; brand.children = []; }

fresh();
ALL.forEach((id) => ok(!vis(id), id + " hidden before any hello"));
ok(vis("petPanel") && vis("btnPet"), "the pet panel itself is left alone until a hello says otherwise");
click("pcClean"); click("pcKeyUp"); click("pcRefresh"); eq(sent, [], "nothing is sent before a hello");

// the fixture hello (pet, contacts, petname)
feed(JSON.stringify(HELLO));
eq(frames, 0, "a hello is not a data frame");
ok(ctx.S.dxpro === true, "S.dxpro set");
ok(ctx.document.title === "LORAGOTCHI DX-PRO dashboard", "title set");
ok(brand.textContent === "LORAGOTCHI DX-PROdashboard" && brand.children[1].textContent === "dashboard", "brand set (text and a <small>, no HTML)");
ok(ctx.S.lastAt > 0, "a hello counts as a sign of life (status leaves 'waiting for data')");
ok(vis("petPanel") && vis("btnPet"), "pet panel shown by caps.pet");
ok(vis("petNameBox"), "pet name box shown by caps.petname");
ok(vis("pcBox") && vis("pcMesh") && vis("pcRefresh") && vis("pcContacts"), "Refresh contacts shown by caps.contacts");
["pcPet", "pcClean", "pcFeed", "pcGuessPlay", "pcKeys", "pcKeyUp", "pcKeyDown", "pcKeyLeft", "pcKeyEnter", "pcKeyRight", "pcKeyBack", "pcKeyClean"].forEach((id) => ok(!vis(id), id + " hidden (cap is 0)"));
ok(!vis("meshPanel"), "mesh panel stays hidden (caps.mesh 0)");
click("pcRefresh"); eq(sent, ["nova contacts"], "Refresh contacts works");
sent.length = 0; click("pcClean"); click("pcFeed"); click("pcKeyUp"); eq(sent, [], "a control whose cap is 0 sends nothing even if clicked");
sent.length = 0; ok(run('pcSend("nova clean", "pcPetLog")') === false && run('pcSend("nova key enter", "pcKeyLog")') === false && run('pcSend("nova ping 0123456789ab", "pcMeshLog")') === false, "pcSend refuses lines whose cap is off");
// contacts line reaches the parser (and Ping / Send pet follow their own caps)
routed.length = 0; feed({ contacts: [{ n: "Ann", id: "0123456789ab" }] });
eq(els.pcContacts.children.length, 1, "a {\"contacts\" line reaches the contacts parser through the router");
eq(els.pcContacts.children[0].children.map((c) => c.textContent), ["Ann", "0123456789ab"], "no Ping / Send pet buttons when caps.ping and caps.sendpet are 0");
eq(routed, [], "and it was not mistaken for a frame");
// a mesh line must not promote a DX-Pro radio to Orion
feed({ mesh: { nf: -110, p: [] } }); ok(!vis("pcKeys") && !vis("pcClean"), "a mesh line does not unlock the other controls");
// repeated hello (the page sends one every 3 s) is stable
feed(JSON.stringify(HELLO)); ok(vis("pcRefresh") && !vis("pcClean"), "a second hello changes nothing");

// all capabilities on
fresh(); feed(hello({ pet: 1, mesh: 1, contacts: 1, petname: 1, keys: 1, clean: 1, feed: 1, guess: 1, ping: 1, sendpet: 1 }));
ALL.forEach((id) => ok(vis(id), id + " shown when every cap is on"));
ok(vis("meshPanel") === false, "mesh panel is opened by mesh data, not by the hello");
feed({ mesh: { nf: -110, p: [] } }); // (page's onMeshLine is a recorder here, so check the guard text instead)
ok(/pp\.hidden && !\(PC\.dx && !pcCap\("mesh"\)\)/.test(html), "static: onMeshLine opens the mesh panel only if caps.mesh");
feed({ contacts: [{ n: "Ann", id: "0123456789ab" }] });
eq(els.pcContacts.children[0].children.map((c) => c.textContent), ["Ann", "0123456789ab", "Ping", "Send pet"], "Ping and Send pet shown with caps.ping and caps.sendpet");
click("pcClean"); click("pcFeed"); click("pcGuessPlay"); click("pcKeyUp"); click("pcKeyBack"); click("pcKeyClean");
eq(sent, ["nova clean", "nova feed", "nova guess new", "nova key up", "nova key back", "nova clean"], "every control sends its line when its cap is on");
sent.length = 0; els.pcContacts.children[0].children[2].fire("click"); els.pcContacts.children[0].children[3].fire("click"); eq(sent, ["nova ping 0123456789ab", "nova sendpet 0123456789ab"], "Ping / Send pet lines");

// each capability alone
const solo = { clean: ["pcPet", "pcClean"], feed: ["pcPet", "pcFeed"], guess: ["pcPet", "pcGuessPlay"], keys: ["pcKeys", "pcKeyUp", "pcKeyDown", "pcKeyLeft", "pcKeyEnter", "pcKeyRight", "pcKeyBack"], contacts: ["pcMesh", "pcRefresh", "pcContacts"], petname: ["petNameBox"] };
Object.keys(solo).forEach((k) => {
  fresh(); const caps = {}; caps[k] = 1; feed(hello(caps));
  ALL.forEach((id) => ok(vis(id) === (solo[k].indexOf(id) >= 0 || (id === "pcBox" && k !== "petname")), "only " + k + ": " + id + (vis(id) ? " shown" : " hidden")));
});
fresh(); feed(hello({ keys: 1 })); ok(vis("pcKeys") && !vis("pcKeyClean"), "Clean tank key needs caps.clean as well as caps.keys");
fresh(); feed(hello({ pet: 0 })); ok(!vis("petPanel") && !vis("btnPet"), "no pet panel when caps.pet is 0");
ctx.petState = () => {}; { const pa = html.indexOf("function petAsk() {"); vm.runInContext(html.slice(pa, html.indexOf("\n}\n", pa) + 2), ctx); }
const asks = []; ctx.send = (l) => asks.push(l); run("petAsk()"); eq(asks, [], "and the page does not ask that radio for a pet"); ctx.send = (l) => { sent.push(l); };

// reading caps: numbers and booleans only, unknown keys ignored, nothing else counts
fresh(); feed(hello({ pet: true, contacts: "1", keys: "yes", clean: null, feed: [1], guess: {}, mesh: -1, petname: 2, bogus: 1, __proto__: { keys: 1 }, ping: NaN }));
ok(vis("petPanel"), "true counts"); ok(!vis("pcRefresh"), "the string \"1\" does not"); ok(!vis("pcKeys") && !vis("pcClean") && !vis("pcFeed") && !vis("pcGuessPlay"), "strings, null, arrays and objects do not");
ok(!vis("meshPanel"), "-1 does not"); ok(vis("petNameBox"), "2 counts");
eq(run("Object.keys(PC.caps)"), ["pet", "mesh", "contacts", "petname", "keys", "clean", "feed", "guess", "ping", "sendpet", "baud"], "only the known capabilities are kept");
// malformed hellos change nothing
[JSON.stringify({ ed: "dx-pro", nova: { v: 1 } }), JSON.stringify({ ed: "dx-pro", nova: { v: "1", caps: { pet: 1 } } }), JSON.stringify({ ed: "dx-pro", nova: { v: 1, caps: [1] } }), JSON.stringify({ ed: "dx-pro", nova: 1 }), JSON.stringify({ ed: "dx-pro", nova: { v: 0, caps: { pet: 1 } } })].forEach((l, i) => {
  fresh(); feed(l); ok(ctx.S.dxpro === false && !vis("pcBox") && !vis("petNameBox"), "malformed hello #" + i + " is ignored");
});
// radio text never becomes HTML: the page only ever sets title/brand to its own fixed words
fresh(); feed(hello({ pet: 1 }, { ed: "dx-pro", name: "<img src=x onerror=alert(1)>" })); ok(ctx.document.title === "LORAGOTCHI DX-PRO dashboard" && brand.textContent === "LORAGOTCHI DX-PROdashboard", "nothing from the radio reaches the title or brand");

// unknown edition: not recognised, controls stay hidden, and it goes the old way (a plain frame)
fresh(); feed({ ed: "something-else", nova: 1, v: "1.0", links: [] });
ok(ctx.S.dxpro === false && !vis("pcBox") && ctx.document.title === "", "unknown ed is not recognised"); eq(frames, 1, "unknown ed is treated as a plain frame, as before");
fresh(); feed({ ed: "something-else", nova: { v: 1, caps: { pet: 1, clean: 1 } } });
ok(ctx.S.dxpro === false && !vis("pcBox") && !vis("petNameBox") && ctx.document.title === "", "unknown ed with caps is ignored for controls");

// orion: unchanged
fresh(); feed({ ed: "orion", nova: 1, v: "0.3.0" });
eq(frames, 1, "orion frame goes to onFrame as before"); ok(ctx.S.dxpro === false, "orion does not set S.dxpro");
ALL.forEach((id) => ok(vis(id), id + " shown for orion (all controls, as before)"));
click("pcClean"); click("pcKeyUp"); click("pcRefresh"); eq(sent, ["nova clean", "nova key up", "nova contacts"], "orion controls send");
ok(/f\.ed === "orion" && !S\.orion/.test(html) && /LODESTAR ORION dashboard/.test(html), "static: the Orion title/brand branch is still there");
fresh(); feed({ mesh: { nf: -100, p: [] } }); ok(routed.indexOf("mesh") === 0 && vis("pcKeys"), "a mesh line still marks an Orion radio and unlocks everything");
fresh(); feed("# OK"); ok(!vis("pcBox"), "a bare OK alone still shows nothing");
// reset (connect / disconnect) hides everything again
fresh(); feed(HELLO); ok(vis("pcBox"), "shown"); run("PC.reset(); pcSync()"); ALL.forEach((id) => ok(!vis(id), id + " hidden after reset")); ok(ctx.S.dxpro === false, "S.dxpro cleared by reset");
ctx.S.mode = "demo"; run("pcSync()"); ok(vis("petNameBox"), "sample-data mode keeps the pet name box as before"); ctx.S.mode = "serial";

// pet name box: enabled by caps.petname alone (no pet picture drawn yet), and it sends the exact line
{
  const pn = html.indexOf("function petNameSend() {"), pe = html.indexOf('$("petGrid")', pn);
  ok(pn > 0 && pe > pn, "petNameSend found");
  vm.runInContext(html.slice(pn, pe), ctx);   // the page's own petNameSend and its click / Enter wiring
  const off = () => { ctx.$("petNameIn").disabled = true; ctx.$("petNameSet").disabled = true; };
  fresh(); off(); ok(ctx.$("petNameIn").disabled && ctx.$("petNameSet").disabled, "name box disabled before any hello");
  feed(hello({ pet: 1, contacts: 1, petname: 1 }));
  ok(vis("petNameBox") && ctx.$("petNameIn").disabled === false && ctx.$("petNameSet").disabled === false, "petname:1 and no pet frame yet: input and Set name are enabled");
  fresh(); off(); feed(hello({ pet: 1, contacts: 1, petname: 0 }));
  ok(!vis("petNameBox") && ctx.$("petNameIn").disabled === true && ctx.$("petNameSet").disabled === true, "petname:0: input and Set name stay disabled");
  fresh(); off(); feed(hello({ pet: 1 })); ok(ctx.$("petNameIn").disabled && ctx.$("petNameSet").disabled, "petname missing: stays disabled");
  fresh(); off(); feed(hello({ petname: 1 })); sent.length = 0;
  ctx.$("petNameIn").value = "Rex"; click("petNameSet"); eq(sent, ["nova petname Rex"], "Set name sends the exact line");
  sent.length = 0; ctx.$("petNameIn").value = "  <b>Bo</b>!  "; click("petNameSet"); eq(sent, ["nova petname bBob!"], "the name is sanitised and cut to 7 characters");
  sent.length = 0; ctx.$("petNameIn").value = ""; click("petNameSet"); eq(sent, ["nova petname -"], "an empty name clears with a dash");
  sent.length = 0; ctx.$("petNameIn").value = "Max"; ctx.$("petNameIn").fire("keydown", { key: "Enter" }); ctx.$("petNameIn").fire("keydown", { key: "a" }); eq(sent, ["nova petname Max"], "Enter in the box sends, other keys do not");
  fresh(); off(); feed(hello({ pet: 1 })); sent.length = 0; ctx.$("petNameIn").value = "Rex"; click("petNameSet"); eq(sent, [], "petname:0 sends nothing even if clicked");
}

// status line and keep-alive: static checks on the page's own wiring
ok(/if \(!S\.frame && !S\.dxpro\) setStatus\("waiting"/.test(html), "static: a DX-Pro hello stops the 'waiting for data' status");
ok(/&& !\(PC\.dx && !pcCap\("mesh"\)\)\) send\("nova mesh"\)/.test(html), "static: no 'nova mesh' asked of a radio without caps.mesh");
ok(/\{ n: "nova hello" \}|send\("nova hello"\)/.test(html), "static: the page still says nova hello every keep-alive");
ok(!/innerHTML/.test(html.slice(html.indexOf("function pcHello"), html.indexOf("function pcSend"))), "static: hello handling never uses innerHTML");
// ---- screen-off screensaver: {"screen":"off"} sets the state, any picture (key or delta) clears it; the decoder is untouched ----
{
  const a1 = html.indexOf("/*PET-BEGIN*/"), b1 = html.indexOf("setInterval(() => {", html.indexOf("function onPetLine"));
  ok(a1 > 0 && b1 > a1, "pet block through onPetLine found");
  const src = html.slice(a1, b1);
  const texts = [], rects = []; let raf = [], cancelled = 0, rid = 0, now = 5000;
  const cv = { width: 1024, height: 512, style: {}, getContext: () => ({ set fillStyle(v) {}, fillRect(x, y, w, h) { rects.push([x, y, w, h]); }, fillText(t, x, y) { texts.push([t, x, y]); }, set font(v) {}, set textBaseline(v) {} }) };
  const E = {}; const mk = (id) => ({ id, hidden: false, textContent: "", dataset: {}, disabled: false, value: "", classList: { remove() {}, add() {}, toggle() {} } });
  const c2 = { atob: (s) => Buffer.from(s, "base64").toString("binary"), Uint8Array, Math, Number, JSON, Date: { now: () => now }, S: { mode: "serial" }, PC: {}, pcCap: () => true, send() {}, cmdLog() {}, document: { activeElement: null },
    $: (id) => (id === "petCanvas" ? cv : E[id] || (E[id] = mk(id))),
    requestAnimationFrame: (f) => { raf.push(f); return ++rid; }, cancelAnimationFrame: () => { cancelled++; }, setTimeout() { throw new Error("no timers"); }, setInterval() { throw new Error("no timers"); } };
  vm.createContext(c2);
  vm.runInContext(src.replace(/^const /gm, "var "), c2);
  const r2 = (c) => vm.runInContext(c, c2), P = r2("PET"), cap = () => E.petCap.textContent, off = () => r2("SAVER.off");
  const key = (s, d) => JSON.stringify({ pet: { s, k: 1, d: d || "gQ==" } }), delta = (s) => JSON.stringify({ pet: { s, k: 0, d: "gQ==" } });
  const line = (l) => { c2.__l = l; r2("onPetLine(__l)"); };
  ok(!/setTimeout|setInterval/.test(src.slice(src.indexOf("const SAVER"), src.indexOf("function petState"))), "the screensaver code uses no timers, only animation frames");
  ok(/line\.indexOf\('"screen"'\) === 1/.test(html), "static: onLine routes a {\"screen\":...} line to the pet code");

  // decoder output for existing frames: unchanged
  line(key(5)); eq([P.fb[0], P.seq, P.fmt.w, P.fmt.h, P.seen], [0x81, 5, 128, 64, 1], "a key frame decodes as before");
  ok(!off(), "a picture does not set screen-off");
  line(delta(6)); eq([P.fb[0], P.seq], [0, 6], "a delta decodes as before (XOR)");
  line(delta(8)); eq([P.fb[0], P.seq], [0, -1], "a missed delta is still refused");
  line(key(10)); eq([P.fb[0], P.seq], [0x81, 10], "key again");

  // screen:off sets the state, blanks, shows the label, starts the loop
  line('{"screen":"off"}');
  ok(off(), "screen:off sets the screen-off state");
  eq(cap(), "Radio screen asleep", "label shows Radio screen asleep");
  eq(raf.length, 1, "one animation frame requested");
  eq([P.fb[0], P.seq], [0x81, 10], "screen:off leaves the decoder state alone");
  line('{"screen":"off"}'); eq(raf.length, 1, "a repeated screen:off changes nothing");
  // the loop: both emoji drawn, bounce inside the canvas for a long run, independent movement
  const frame = (dt) => { now += dt; const f = raf.shift(); f(now); };
  frame(0); frame(16.7);
  eq(texts.slice(-2).map((t) => t[0]), ["\u{1F41F}", "\u{1F43A}"], "fish and wolf are drawn as text");
  let ok1 = true; const seen = [[], []]; const first = texts.slice(-2).map((t) => [t[1], t[2]]);
  for (let i = 0; i < 3000; i++) { frame(16.7); const t = texts.slice(-2); t.forEach((e, k) => { if (e[1] < 0 || e[2] < 0 || e[1] > 1024 || e[2] > 512) ok1 = false; seen[k].push(e[1]); }); }
  ok(ok1, "both emoji stay inside the canvas over 3000 frames");
  const sp = r2("SAVER.sp"); ok(Math.abs(sp[0].vx) !== Math.abs(sp[1].vx) && Math.abs(sp[0].vy) !== Math.abs(sp[1].vy), "each emoji has its own speed");
  ok(Math.max(...seen[0]) > 900 && Math.min(...seen[0]) < 50, "the fish reaches both side edges (it bounces)");
  ok(r2("SAVER.sp[0].vx") !== 0, "still moving");
  // a long pause does not make a huge jump: at most 5 fixed steps per frame
  const x0 = r2("SAVER.sp[0].x"); frame(60000); ok(Math.abs(r2("SAVER.sp[0].x") - x0) <= 5 * 1024 * 0.0042 + 1, "a long gap between frames is capped to a few fixed steps");
  // the 'check the radio' warning is not shown while the screen is off
  P.last = 0; r2("S.mode = 'serial'");
  ok(!/No new picture/.test(cap()), "no 'check the radio' text while asleep");

  // a pet key clears it
  line(key(20, "AAA="));
  ok(!off(), "a pet key clears screen-off"); ok(cancelled >= 1, "the animation loop is cancelled"); eq(P.seq, 20, "key applied after wake");
  ok(!/asleep/.test(cap()), "the asleep label is gone after a key");
  // a pet delta clears it (stream in sequence: the sleep did not disturb seq)
  line(key(30)); line('{"screen":"off"}'); ok(off(), "off again");
  line(delta(31)); ok(!off(), "a pet delta clears screen-off"); eq([P.fb[0], P.seq], [0, 31], "the delta after sleep applies in sequence");
  // a refused delta (missed one) still ends the screen-off state
  line('{"screen":"off"}'); line(delta(40)); ok(!off(), "a refused delta also ends screen-off (the radio is awake)"); eq(P.seq, -1, "and waits for a key frame as before");
  // other values of screen do nothing
  line('{"screen":"on"}'); ok(!off(), "screen other than off does not sleep"); line("null"); ok(!off(), "null line is ignored");
  // after the wake a late animation frame draws nothing more
  const n = texts.length; raf.splice(0).forEach((f) => f(now + 20)); eq(texts.length, n, "a stray frame after wake draws nothing");
}


console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
