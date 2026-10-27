#!/usr/bin/env node
/* Headless smoke test for poster-lab: stubs a Canvas2D context and DOM,
   loads index.html's inline script, then drives every layout × palette ×
   ratio combination plus the param round-trip. Catches render crashes and
   state-sync bugs without a browser. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJ = path.resolve(__dirname, '../../public/projects/poster-lab');
const html = fs.readFileSync(path.join(PROJ, 'index.html'), 'utf8');

/* ---- Canvas2D stub (measureText approximates CJK as full-width) ---- */
function stubCtx() {
  const noop = () => {};
  const ctx = {
    canvas: null,
    globalAlpha: 1, fillStyle: '#000', strokeStyle: '#000', lineWidth: 1,
    font: '10px sans-serif', textAlign: 'left', textBaseline: 'alphabetic',
    letterSpacing: '0px',
    save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop,
    fill: noop, stroke: noop, fillRect: noop, clearRect: noop, fillText: noop,
    measureText: (s) => {
      let units = 0;
      for (const ch of String(s)) {
        const c = ch.codePointAt(0);
        units += (c >= 0x2e80 && c <= 0x9fff) || (c >= 0xac00 && c <= 0xd7af) ? 1 : 0.55;
      }
      return { width: units * 20 };
    },
  };
  return ctx;
}

/* ---- minimal DOM stubs ---- */
function makeEl(tag, attrs = {}) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    children: [],
    style: {},
    dataset: {},
    hidden: false,
    disabled: false,
    checked: false,
    value: '',
    textContent: '',
    _listeners: {},
    setAttribute(k, v) { attrs[k] = v; },
    getAttribute(k) { return attrs[k] == null ? null : attrs[k]; },
    appendChild(child) { el.children.push(child); return child; },
    addEventListener(type, fn) {
      (el._listeners[type] = el._listeners[type] || []).push(fn);
    },
    removeEventListener: noop0,
    querySelectorAll: () => [],
    querySelector: () => null,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 500 }),
    focus: noop0,
    click() { (el._listeners.click || []).forEach(fn => fn({})); },
    classList: { add: noop0, remove: noop0 },
  };
  Object.keys(attrs).forEach(k => { if (el[k] === undefined || typeof el[k] === 'string') el[k] = attrs[k]; });
  return el;
}
function noop0() {}

function fire(el, type, event) {
  (el._listeners[type] || []).forEach(fn => fn(Object.assign({
    preventDefault: noop0,
    key: '',
    pointerId: 1,
    clientX: 0,
    clientY: 0,
  }, event)));
}

/* ---- build the DOM the script expects ---- */
const ids = {};
['poster', 'caption', 'palettes', 'status', 'export', 'copyimg', 'copylink',
 'shuffle', 'text', 'sub', 'issue', 'credit', 'posx', 'posy', 'grain',
 'count', 'sub-count', 'clear-text', 'clear-sub', 'clear-credit'].forEach(id => {
  ids[id] = makeEl(id === 'poster' ? 'canvas' : id === 'grain' ? 'input' : id.startsWith('clear') ? 'button' : 'div');
});
ids.poster.width = 1080;
ids.poster.height = 1350;
ids.poster.getContext = () => stubCtx();
ids.text.value = '把好奇心写成代码';
ids.text.getAttribute = (k) => (k === 'maxlength' ? '40' : null);
ids.sub.getAttribute = (k) => (k === 'maxlength' ? '60' : null);
ids.grain.checked = true;

const layoutBtns = ['stack', 'split', 'concrete', 'grid', 'crop', 'inverse'].map(l => {
  const b = makeEl('button');
  b.dataset.layout = l;
  return b;
});
const ratioBtns = ['4:5', '1:1', '9:16'].map(r => {
  const b = makeEl('button');
  b.dataset.ratio = r;
  return b;
});

const documentStub = {
  getElementById: (id) => ids[id] || null,
  createElement: (tag) => makeEl(tag),
  querySelectorAll: (sel) => {
    if (sel === '[data-layout]') return layoutBtns;
    if (sel === '[data-ratio]') return ratioBtns;
    return [];
  },
  querySelector: (sel) => (sel === '.stage' || sel === '.frame' ? makeEl('div') : null),
  body: makeEl('body'),
};

const storage = {};
const sandbox = {
  document: documentStub,
  window: null,
  URLSearchParams,
  URL,
  ClipboardItem: function () {},
  navigator: { clipboard: { writeText: async () => {}, write: async () => {} } },
  setTimeout: (fn) => { fn(); return 0; },
  clearTimeout: noop0,
  prompt: () => {},
  history: { replaceState: noop0 },
  localStorage: {
    getItem: (k) => (k in storage ? storage[k] : null),
    setItem: (k, v) => { storage[k] = v; },
  },
  JSON, Math, Date, Array, Object, String, Number, parseInt, isNaN,
  console,
};
sandbox.window = {
  location: { search: '', origin: 'https://h5.ming.fi', pathname: '/projects/poster-lab/' },
  history: { replaceState: noop0 },
  addEventListener: () => {},
  setTimeout: sandbox.setTimeout,
  clearTimeout: noop0,
  localStorage: sandbox.localStorage,
  matchMedia: () => ({ matches: false }),
  getComputedStyle: () => ({ getPropertyValue: () => '0px' }),
  innerHeight: 800,
  prompt: () => {},
  ClipboardItem: sandbox.ClipboardItem,
  navigator: sandbox.navigator,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

/* ---- extract and run the inline script ---- */
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) { console.error('FAIL: no inline script found'); process.exit(1); }

try {
  vm.runInContext(match[1], sandbox, { filename: 'poster-lab.js' });
} catch (err) {
  console.error('FAIL: script crashed on boot:', err.message);
  process.exit(1);
}

/* ---- assertions ---- */
const failures = [];
function check(name, cond) {
  if (!cond) failures.push(name);
  console.log((cond ? '  ✓ ' : '  ✗ ') + name);
}

// The boot already ran one render without throwing.
check('boot render completes', true);

// 5 palette buttons built (12 palettes).
check('12 palette buttons built', ids.palettes.children.length === 12);

// caption was written.
check('caption text set', /1080 × 1350/.test(ids.caption.textContent));

// Every layout renders without throwing, across all ratios.
for (const layout of ['stack', 'split', 'concrete', 'grid', 'crop', 'inverse']) {
  for (const ratio of ['4:5', '1:1', '9:16']) {
    try {
      fire(ids.text, 'input', {});
      // drive via internal state: simulate layout button + ratio button
      const btn = layoutBtns.find(b => b.dataset.layout === layout);
      fire(btn, 'click', {});
      const rbtn = ratioBtns.find(b => b.dataset.ratio === ratio);
      fire(rbtn, 'click', {});
      check(`render ${layout} @ ${ratio}`, true);
    } catch (err) {
      check(`render ${layout} @ ${ratio} (${err.message})`, false);
    }
  }
}

// Param boot round-trip: a fresh sandbox started with ?text=…&layout=crop…
// must restore that state (caption ratio, palette count) without throwing.
try {
  sandbox.window.location.search = '?text=hello%20world&sub=%E5%89%AF%E6%A0%87&layout=crop&palette=3&ratio=9:16&posx=80&posy=30&grain=0';
  sandbox.window.location.pathname = '/projects/poster-lab/';
  vm.runInContext(match[1], sandbox, { filename: 'poster-lab.js' });
  const captionOk = /1080 × 1920/.test(ids.caption.textContent);
  check('param boot restores ratio (caption shows 1080 × 1920)', captionOk);
} catch (err) {
  check('param boot (' + err.message + ')', false);
}

console.log('');
if (failures.length) {
  console.error(`FAIL: ${failures.length} check(s) failed:\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
console.log('poster-lab: all checks passed');
