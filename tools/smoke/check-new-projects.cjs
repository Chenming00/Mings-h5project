// Deterministic event/lifecycle regressions for the two standalone pages.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function boot(slug) {
  const elements = new Map(), listeners = new Map(), windowListeners = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      hidden: id === 'overlay', inert: false, disabled: false, textContent: '', style: {},
      attrs: {}, handlers: {}, classList: { add() {}, remove() {} },
      addEventListener(type, fn) { this.handlers[type] = fn; },
      setAttribute(key, value) { this.attrs[key] = value; },
      focus() { document.activeElement = this; },
    });
    return elements.get(id);
  };
  const document = {
    hidden: false, body: { style: { overflow: '' } },
    documentElement: { style: { setProperty() {} } },
    getElementById: element,
    querySelector: () => element('main'),
    querySelectorAll: () => [element('d0'), element('d1'), element('d2')],
    addEventListener: (type, fn) => listeners.set(type, fn),
  };
  let resumeResolve = null;
  const contexts = [], intervals = new Set();
  class AudioContext {
    constructor() { this.state = 'suspended'; this.currentTime = 0; contexts.push(this); }
    createGain() { return { gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
    createOscillator() { return { frequency: {}, connect() {}, disconnect() {}, start() {}, stop() {} }; }
    resume() { return new Promise(resolve => { resumeResolve = () => { this.state = 'running'; resolve(); }; }); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
  }
  const window = { AudioContext, addEventListener: (type, fn) => windowListeners.set(type, fn) };
  const html = fs.readFileSync(path.join(__dirname, '../../public/projects', slug, 'index.html'), 'utf8');
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
  vm.runInNewContext(script, { document, window,
    setInterval(fn) { intervals.add(fn); return fn; }, clearInterval(fn) { intervals.delete(fn); },
  });
  return { document, element, listeners, windowListeners, contexts, intervals, resume: () => resumeResolve() };
}
(async () => {
  const s = boot('stellar-passport');
  s.element('d1').handlers.click();
  s.element('launch').handlers.click();
  assert.equal(s.element('ticket-name').textContent, '火星');
  assert.equal(s.element('main').inert, true);
  assert.equal(s.element('overlay').hidden, false);
  let prevented = false, stopped = false;
  s.listeners.get('keydown')({ key: 'Tab', preventDefault() { prevented = true; } });
  assert.ok(prevented);
  assert.equal(s.document.activeElement, s.element('close'));
  s.listeners.get('keydown')({ key: 'Escape', preventDefault() {}, stopPropagation() { stopped = true; } });
  assert.ok(stopped);
  assert.equal(s.element('overlay').hidden, true);
  assert.equal(s.element('main').inert, false);
  assert.equal(s.document.body.style.overflow, '');
  assert.equal(s.document.activeElement, s.element('launch'));

  const n = boot('neon-drift');
  const click = () => n.element('play').handlers.click();
  let start = click(); n.resume(); await start;
  assert.equal(n.intervals.size, 1);
  assert.equal(n.element('play').attrs['aria-pressed'], 'true');
  await click();
  assert.equal(n.intervals.size, 0);
  assert.equal(n.contexts[0].state, 'suspended');
  start = click(); n.resume(); await start;
  n.document.hidden = true; n.listeners.get('visibilitychange')();
  assert.equal(n.contexts[0].state, 'suspended');
  assert.equal(n.intervals.size, 0);
  n.document.hidden = false;
  start = click(); n.resume(); await start;
  assert.equal(n.intervals.size, 1, 'one click resumes after hiding');
  n.element('mood').handlers.click();
  assert.equal(n.intervals.size, 1, 'frequency change must not stack schedulers');
  await click();
  start = click(); // Hide while resume() is unresolved.
  n.document.hidden = true; n.listeners.get('visibilitychange')();
  n.resume(); await start;
  assert.equal(n.intervals.size, 0, 'stale resume must not start playback');
  n.windowListeners.get('pagehide')();
  assert.equal(n.contexts[0].state, 'closed');
  n.document.hidden = false;
  start = click(); n.resume(); await start;
  assert.equal(n.contexts.length, 2, 'BFCache restoration creates a fresh context');
  assert.equal(n.intervals.size, 1);
  console.log('New project regressions passed: ticket focus/Escape and radio lifecycle/races.');
})().catch(error => { console.error(error); process.exitCode = 1; });
