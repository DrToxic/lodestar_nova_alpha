// Dashboard check for the pet controls (docs/index.html). Plain node, no packages:  node nova/test/test_dashboard_pet.js
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
  return { id, hidden: id === "pcBox" || id === "pcGuessRow", textContent: "", className: "", children: [], handlers: {}, attrs: {},
    addEventListener(t, f) { (this.handlers[t] = this.handlers[t] || []).push(f); },
    fire(t, ev) { (this.handlers[t] || []).forEach((f) => f(ev || {})); },
    appendChild(c) { this.children.push(c); return c; }, replaceChildren() { this.children = []; },
    setAttribute(k, v) { this.attrs[k] = v; } };
}
const els = {}; const sent = []; let timers = []; let nowMs = 1000000;
const ctx = {
  S: { mode: "serial" }, PET: { seen: 0 }, cmdLog: (t) => { ctx.cmdText = t; }, cmdText: "",
  $: (id) => els[id] || (els[id] = makeEl(id)),
  send: (l) => { sent.push(l); },
  document: { createElement: (t) => makeEl(t) },
  setTimeout: (f, ms) => { const t = { f, ms, on: true }; timers.push(t); return t; },
  clearTimeout: (t) => { if (t) t.on = false; },
  setInterval: () => 0, String, Array, JSON, Object, Date: { now: () => nowMs },
};
vm.createContext(ctx);
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

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
