#!/usr/bin/env node
/* SBTI behavioral regression: runs the real inline app script in a VM with
   real timers, then drives answer/auto-advance/manual-nav/restart/result
   flows and asserts timer correctness. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = fs.readFileSync(path.join(__dirname, '../../public/projects/sbti', 'index.html'), 'utf8');
const scriptMatch = SRC.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) { console.log('no script found'); process.exit(1); }

/* ---- stub element keyed by real ids in the html ---- */
const html = SRC;
const byId = {};
for (const m of html.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)) {
  byId[m[1]] = byId[m[1]] || {
    id: m[1], style: { width: '' }, dataset: {}, src: '',
    classList: {
      _s: new Set(),
      add(...n) { n.forEach(x => this._s.add(x)); },
      remove(...n) { n.forEach(x => this._s.delete(x)); },
      toggle(n, f) { (f === undefined ? !this._s.has(n) : !!f) ? this._s.add(n) : this._s.delete(n); },
      contains(n) { return this._s.has(n); }
    },
    _listeners: {},
    addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); },
    querySelectorAll(selector) {
      // persistent, always-empty registry: bindings never fire, harness drives app directly
      const store = this._qsa = this._qsa || {};
      return store[selector] = store[selector] || [];
    },
    querySelector() { return null; },
    focus() {},
    closest() { return null; },
    setAttribute() {}, getAttribute: () => null,
    removeAttribute() { this.src = ''; },
    appendChild() {},
    textContent: '', innerHTML: '', disabled: false, value: ''
  };
}
const doc = {
  getElementById: id => byId[id] || null,
  querySelectorAll: () => [],
  body: { dataset: {} },
  addEventListener: () => {}
};

// The page now persists progress and honours prefers-reduced-motion, so the
// double needs both — otherwise the harness only works by never exercising the
// new code paths.
const store = new Map();
const localStorageStub = {
  getItem: key => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => { store.set(key, String(value)); },
  removeItem: key => { store.delete(key); }
};
const sandbox = {
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, Error, isNaN,
  parseFloat, parseInt, Promise, RegExp, TypeError, Set, Map,
  setTimeout, clearTimeout, performance: { now: () => Date.now() },
  window: {
    scrollTo: () => {},
    localStorage: localStorageStub,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
  },
  localStorage: localStorageStub,
  document: doc,
  Image: function () {}
};
sandbox.window.setTimeout = setTimeout;
sandbox.window.clearTimeout = clearTimeout;
vm.createContext(sandbox);

let fatal = null;
try { new vm.Script(scriptMatch[1], { filename: 'sbti/index.html#script' }).runInContext(sandbox); }
catch (e) { fatal = e; }
if (fatal) { console.log('LOAD FAILED: ' + fatal.stack.split('\n').slice(0, 3).join(' | ')); process.exit(1); }

const grab = vm.runInContext('({ app, startTest, selectAnswer, moveQuestion, renderResult, showScreen, getVisibleQuestions })', sandbox);
if (!grab || typeof grab.selectAnswer !== 'function') { console.log('FATAL: app functions not reachable'); process.exit(1); }
const { app, startTest, selectAnswer, moveQuestion, renderResult, showScreen, getVisibleQuestions } = grab;

const sleep = ms => new Promise(r => setTimeout(r, ms));
// Must stay above the page's auto-advance delay; the exact value lives in
// index.html and is deliberately long enough to be undoable by hand.
const AUTO_ADVANCE_MS = 450;
let failures = 0;
function check(name, cond, detail) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : ' -> ' + detail}`);
  if (!cond) failures++;
}

function boot() { startTest(); return getVisibleQuestions(); }
function q() { return getVisibleQuestions(); }
function current() { return q()[app.currentIndex]; }
function optValOf(question, i) { return question.options[Math.min(i, question.options.length - 1)].value; }

(async () => {
  /* 1. rapid double answer: exactly one advance */
  let vis = boot();
  const q0 = vis[0];
  selectAnswer(q0, optValOf(q0, 1));
  selectAnswer(q0, optValOf(q0, 2));      // change mind immediately, timer rescheduled
  await sleep(AUTO_ADVANCE_MS + 70);
  check('rapid double answer advances exactly one', app.currentIndex === 1, `index=${app.currentIndex}`);

  /* 2. manual next cancels auto-advance */
  boot();
  const q0b = vis[0];
  selectAnswer(q0b, optValOf(q0b, 1));
  moveQuestion(1);                        // user steers manually
  await sleep(AUTO_ADVANCE_MS + 70);
  check('manual next cancels pending auto-advance', app.currentIndex === 1, `index=${app.currentIndex}`);

  /* 3. next then back to same question, no ghost advance */
  boot();
  const q0c = vis[0];
  selectAnswer(q0c, optValOf(q0c, 1));
  moveQuestion(1);
  moveQuestion(-1);                       // back onto the answered question within 190ms
  await sleep(AUTO_ADVANCE_MS + 70);
  check('returning to answered question does not auto-advance', app.currentIndex === 0, `index=${app.currentIndex}`);

  /* 4. restart clears pending timer */
  boot();
  const q0d = vis[0];
  selectAnswer(q0d, optValOf(q0d, 3));
  startTest(false);                       // restart while timer pending
  await sleep(AUTO_ADVANCE_MS + 70);
  check('restart clears pending auto-advance', app.currentIndex === 0 && Object.keys(app.answers).length === 0,
    `index=${app.currentIndex} answers=${JSON.stringify(app.answers)}`);

  /* 5. leaving to intro/result screen clears pending timer */
  boot();
  const q0e = vis[0];
  selectAnswer(q0e, optValOf(q0e, 1));
  showScreen('intro');
  await sleep(AUTO_ADVANCE_MS + 70);
  check('screen switch clears pending auto-advance', app.currentIndex === 0, `index=${app.currentIndex}`);

  /* 6. full walk: answer every question (single burst timing like real use), result renders */
  boot();
  vis = q();
  for (let i = 0; i < vis.length; i++) {
    const question = current();
    selectAnswer(question, optValOf(question, 1));
    await sleep(AUTO_ADVANCE_MS + 70);                     // let each auto-advance settle (delay + slack)
    if (app.currentIndex === i) { /* last question: index stays */ }
  }
  const allAnswered = q().every(question => app.answers[question.id] !== undefined);
  check('full walk answers all questions incl gate', allAnswered, `answered=${Object.keys(app.answers).length}/${q().length}`);
  check('walk ends on last question (no overflow)', app.currentIndex === q().length - 1, `index=${app.currentIndex}/${q().length - 1}`);

  /* 7. drink gate: answering non-drink clears the special follow-up answer */
  boot();
  vis = q();
  const gate = vis.find(question => question.id === 'drink_gate_q1');
  const gateIndex = vis.indexOf(gate);
  app.currentIndex = gateIndex;
  selectAnswer(gate, gate.options[0].value);          // non value-3 => gate stays closed
  app.answers['drink_gate_q2'] = 1;                   // simulate stray prior answer
  app.previewMode = false;
  selectAnswer(gate, gate.options[0].value);
  check('gate closes and removes drink_gate_q2 answer', app.answers['drink_gate_q2'] === undefined,
    `q2=${app.answers['drink_gate_q2']}`);

  /* 8. the gate question must actually appear when the answer opens it: the
        old harness always answered option[1] and therefore never proved that
        the 32-question path exists at all */
  const openGate = vis.find(question => question.id === 'drink_gate_q1');
  const openIndex = vis.indexOf(openGate);
  const drinkOption = openGate.options.find(option => option.value === 3);
  app.currentIndex = openIndex;
  selectAnswer(openGate, drinkOption.value);
  const opened = getVisibleQuestions();
  check('answering the gate opens a 32nd question',
    opened.length === vis.length + 1,
    `length=${opened.length} base=${vis.length}`);
  check('the extra question sits right after the gate',
    opened[openIndex + 1] && opened[openIndex + 1].id === 'drink_gate_q2',
    `next=${opened[openIndex + 1] && opened[openIndex + 1].id}`);

  /* 8. result render (poster + dimension list) runs without throwing */
  try { renderResult(); check('renderResult executes cleanly', true); }
  catch (e) { check('renderResult executes cleanly', false, e.message); }

  /* 9. answering LAST question never overflows index */
  boot();
  vis = q();
  app.currentIndex = vis.length - 1;
  const last = current();
  selectAnswer(last, optValOf(last, 2));
  selectAnswer(last, optValOf(last, 0));              // double change on last question
  await sleep(AUTO_ADVANCE_MS + 70);
  check('last-question double answer does not overflow', app.currentIndex === vis.length - 1, `index=${app.currentIndex}`);

  console.log(failures === 0 ? '\nALL SBTI TIMER REGRESSIONS PASS' : `\n${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
})();
