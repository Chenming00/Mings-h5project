#!/usr/bin/env node
/* Full-boot regression for motion-reel: loads ALL js modules including main.js,
   boots with stub elements for every id parsed out of index.html, then drives
   render(t) across the whole 30s. Catches export-contract bugs (FX.scene etc.) */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJ = process.argv[2] || path.resolve(__dirname, '..');
const JS = file => fs.readFileSync(path.join(PROJ, 'js', file), 'utf8');

/* ---- Canvas2D stub ---- */
function stubCtx() {
  const grad = { addColorStop() {} };
  const noop = () => {};
  const ctx = {
    canvas: null,
    globalAlpha: 1, globalCompositeOperation: 'source-over',
    fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, lineCap: 'butt',
    lineJoin: 'miter', font: '10px sans-serif', filter: 'none',
    shadowColor: '', shadowBlur: 0, shadowOffsetY: 0, shadowOffsetX: 0,
    save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
    transform: noop, setTransform: noop, resetTransform: noop,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop,
    arcTo: noop, ellipse: noop, rect: noop, quadraticCurveTo: noop, bezierCurveTo: noop,
    fill: noop, stroke: noop, clip: noop, fillRect: noop, strokeRect: noop, clearRect: noop,
    fillText: noop, strokeText: noop,
    measureText: (s) => ({ width: String(s).length * 8 }),
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    createPattern: () => ({ setTransform: noop }),
    putImageData: noop, getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(4 * w * h) }),
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(4 * w * h) }),
    drawImage: noop, setLineDash: noop
  };
  return ctx;
}
function stubCanvas() {
  const c = {
    width: 300, height: 150, style: {},
    getContext: () => c._ctx,
    toBlob: (cb) => cb(Buffer.alloc(0)),
    addEventListener: () => {}
  };
  c._ctx = stubCtx();
  c._ctx.canvas = c;
  return c;
}

/* ---- generic stub element for every id in index.html ---- */
function stubEl(id) {
  const cls = new Set();
  const children = [];
  const el = {
    id, style: { setProperty: () => {}, removeProperty: () => {} }, dataset: {}, children,
    value: id === 'quality' ? 'high' : '',
    textContent: '', innerHTML: '',
    classList: {
      add: (...n) => n.forEach(x => cls.add(x)),
      remove: (...n) => n.forEach(x => cls.delete(x)),
      toggle: (n, f) => { (f === undefined ? !cls.has(n) : f) ? cls.add(n) : cls.delete(n); },
      contains: n => cls.has(n)
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    setAttribute: () => {}, getAttribute: () => null,
    appendChild: c => children.push(c),
    removeChild: c => { const i = children.indexOf(c); if (i >= 0) children.splice(i, 1); },
    remove: () => {},
    click: () => {},
    setPointerCapture: () => {}, releasePointerCapture: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 450, right: 800, bottom: 450 }),
    querySelector: () => null,
    querySelectorAll: () => [],
    closest: () => null,
    getBoundingClientRectUpToDate: true
  };
  return el;
}

/* parse ids from index.html — canvas elements get canvas stubs */
const html = fs.readFileSync(path.join(PROJ, 'index.html'), 'utf8');
const byId = {};
for (const m of html.matchAll(/<canvas\s+id\s*=\s*["']([^"']+)["']/g)) byId[m[1]] = stubCanvas();
for (const m of html.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)) if (!byId[m[1]]) byId[m[1]] = stubEl(m[1]);

const docDocs = [];
const doc = {
  readyState: 'complete',
  addEventListener: () => {},
  getElementById: id => byId[id] || null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: tag => (tag === 'canvas' ? stubCanvas() : stubEl('anon-' + tag)),
  createDocumentFragment: () => ({ appendChild() {} }),
  body: stubEl('body'),
  documentElement: stubEl('html'),
  fonts: null,
  fullscreenElement: null,
  exitFullscreen: () => {}
};

const errors = [];
const sandbox = {
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, Error, isNaN,
  parseFloat, parseInt, setTimeout, clearTimeout, setInterval, clearInterval,
  Promise, RegExp, TypeError, Set, Map,
  Uint8ClampedArray, Uint8Array, Float32Array,
  performance: { now: () => Date.now() },
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  devicePixelRatio: 2,
  location: { search: '', href: 'http://127.0.0.1:5173/projects/motion-reel/' },
  URLSearchParams, URL: { createObjectURL: () => '', revokeObjectURL: () => {} },
  Blob: function () {}, MediaRecorder: undefined,
  AudioContext: undefined, navigator: { clipboard: {} },
  document: doc, addEventListener: () => {}
};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const run = (code, file) => {
  try { new vm.Script(code, { filename: 'motion-reel/js/' + file }).runInContext(sandbox); }
  catch (e) { errors.push(`load ${file}: ${e.stack.split('\n').slice(0, 3).join(' | ')}`); }
};
for (const f of ['math.js', 'kit.js', 'postfx.js', 'scenes.js', 'audio.js', 'main.js']) run(JS(f), f);

const app = sandbox.REEL_APP;
if (!app) {
  console.log(errors.length ? errors.join('\n') : 'FATAL: REEL_APP not registered (boot did not complete)');
  process.exit(1);
}
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }

/* drive the real render entry across full duration */
const DUR = sandbox.REEL.DURATION;
let frames = 0;
try {
  for (let t = 0; t <= DUR + 0.001; t = +(t + 0.05).toFixed(3)) {
    app.render(Math.min(t, DUR));
    frames++;
  }
} catch (e) {
  console.log(`RENDER FAILED at frame ${frames}: ${e.stack.split('\n').slice(0, 4).join(' | ')}`);
  process.exit(1);
}

/* interactive paths */
try {
  app.setQuality('low'); app.render(2.0);
  app.setQuality('high'); app.render(2.0);
  app.setAspect('9:16'); app.render(12.0);
  app.setAspect('16:9'); app.render(12.0);
  app.seek(15.3); app.render(15.3);
  app.toggle(); app.toggle();
} catch (e) {
  console.log(`INTERACTION FAILED: ${e.stack.split('\n').slice(0, 4).join(' | ')}`);
  process.exit(1);
}

/* export contract probe */
const FX = sandbox.REEL.FX;
const probes = [
  ['FX.scene', () => FX.scene !== null && FX.scene !== undefined && typeof FX.scene.getContext === 'function'],
  ['FX.w/h', () => typeof FX.w === 'number' && typeof FX.h === 'number'],
  ['every chapter id parse', () => sandbox.REEL.CHAPTERS.length === 8]
];
const fail = probes.filter(([n, f]) => { try { return !f(); } catch { return true; } });
if (fail.length) { console.log('PROBE FAIL: ' + fail.map(f => f[0]).join(', ')); process.exit(1); }

console.log(`boot: OK | render frames: ${frames} over ${DUR}s | quality/aspect/seek/toggle: OK | FX.scene: present`);
