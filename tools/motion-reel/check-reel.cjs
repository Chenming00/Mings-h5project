/* Headless smoke test: stub a Canvas2D context, boot the reel modules in a
   fake window, and render every chapter across time to catch runtime errors.
   Run: node scripts/check-reel.js                                            */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIR = path.join(__dirname, '../../public/projects/motion-reel', 'js');

/* ---- Canvas2D stub: records nothing, returns plausible objects ---- */
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

function stubCanvas(w, h) {
  const c = {
    width: w || 300, height: h || 150,
    style: {},
    getContext: () => c._ctx,
    toBlob: (cb) => cb(new (require('buffer').Buffer)(0)),
    captureStream: () => ({ getTracks: () => [] }),
    addEventListener: () => {}
  };
  c._ctx = stubCtx();
  c._ctx.canvas = c;
  return c;
}

/* ---- minimal window/document ---- */
const listeners = {};
const doc = {
  readyState: 'complete',
  addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (tag) => (tag === 'canvas' ? stubCanvas() : { style: {}, appendChild() {}, addEventListener() {}, classList: { add() {}, remove() {}, toggle() {} } }),
  createDocumentFragment: () => ({ appendChild() {} }),
  fonts: null
};

const sandbox = {
  window: null, document: doc, console,
  Math, Date, JSON, Object, Array, String, Number, Boolean, Error, isNaN, parseFloat, parseInt,
  Uint8ClampedArray, Uint8Array, Float32Array, performance: { now: () => Date.now() },
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  devicePixelRatio: 2, location: { search: '' },
  URLSearchParams, URL: { createObjectURL: () => '', revokeObjectURL: () => {} },
  Blob: function () {}, MediaRecorder: undefined,
  AudioContext: undefined, addEventListener: () => {},
  MediaRecorderPolyfill: undefined,
  __listeners: listeners
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

['math.js', 'kit.js', 'postfx.js', 'scenes.js', 'audio.js'].forEach(f => {
  vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8'), sandbox, { filename: f });
});

const REEL = sandbox.REEL;
if (!REEL) { console.error('REEL namespace missing'); process.exit(1); }

const failures = [];
function check(name, fn) {
  try { fn(); } catch (e) { failures.push(name + ' :: ' + e.message); }
}

/* ---- 1. timing table integrity ---- */
const D = REEL.DURATION, CH = REEL.CHAPTERS;
check('duration', () => { if (D !== 30) throw new Error('DURATION=' + D); });
check('chapter-contiguity', () => {
  let acc = 0;
  CH.forEach((c) => {
    if (Math.abs(c.start - acc) > 1e-6) throw new Error('gap at ' + c.name + ' start=' + c.start + ' expected=' + acc);
    if (c.dur <= 0) throw new Error('non-positive dur ' + c.name);
    if (Math.abs((c.end - c.start) - c.dur) > 1e-9) throw new Error('end mismatch ' + c.name);
    acc = c.end;
  });
  if (Math.abs(acc - 30) > 1e-6) throw new Error('total=' + acc);
});

/* ---- 2. every scene renders at a dense sweep of times ---- */
const L = { W: 1920, H: 1080, cx: 960, cy: 540, scale: 1, dir: 'land' };
const LP = { W: 1080, H: 1920, cx: 540, cy: 960, scale: 1, dir: 'port' };
const LQ = { W: 1080, H: 1080, cx: 540, cy: 540, scale: 1, dir: 'port' };

for (const layout of [L, LP, LQ]) {
  for (let f = 0; f <= 300; f++) {
    const t = (f / 300) * D;
    const ch = REEL.chapterAt(t);
    const lt = t - ch.start;
    const idx = CH.indexOf(ch);
    const prev = CH[idx - 1], next = CH[idx + 1];
    let accent = ch.accents[0];
    check('draw ' + ch.id + ' t=' + t.toFixed(2) + ' ' + layout.dir, () => {
      ch.draw(stubCtx(), layout, t, lt, ch.dur, {
        quality: 'high', audio: 0.5, accent, beat: t * 2.1,
        prevAccent: prev ? prev.accents[1] : accent,
        nextAccent: next ? next.accents[0] : accent,
        cutIn: 0
      });
    });
  }
}

/* ---- 3. extreme time values (clamping robustness) ---- */
for (const layout of [L, LP]) {
  for (const t of [0, 29.999, 30, -1, 1e6, NaN]) {
    const ch = REEL.chapterAt(isNaN(t) ? 0 : Math.max(0, Math.min(D, t)));
    check('edge t=' + t, () => {
      ch.draw(stubCtx(), layout, Math.max(0, Math.min(D, t || 0)),
        Math.max(0, Math.min(D, t || 0)) - ch.start, ch.dur,
        { quality: 'low', audio: 0, accent: ch.accents[0], beat: 0 });
    });
  }
}

/* ---- 4. postfx pipeline ---- */
check('postfx-init', () => { REEL.FX.init(640, 360, 'high'); });
check('postfx-render', () => {
  const scr = stubCtx();
  REEL.FX.render(scr, 1.5, { fx: { bloom: true, bloomAmt: 0.8, aberration: 0.5, glitch: 0.7, grain: true, grainAmt: 0.06, scan: 0.05, vignette: 0.6 } });
});
check('postfx-bars', () => { REEL.FX.bars(stubCtx(), 2.39); });
check('postfx-flash', () => { REEL.FX.flash(stubCtx(), '#fff', 0.5); });

/* ---- 5. hud ---- */
check('hud', () => { REEL.K.hud(stubCtx(), L, 3.2, { hudAlpha: 0.7 }, CH, REEL.chapterAt(3.2)); });

/* ---- 6. math sanity ---- */
check('easing-range', () => {
  const e = sandbox.REEL.M.ease;
  for (const k of Object.keys(e)) {
    for (let i = 0; i <= 20; i++) {
      const v = e[k](i / 20);
      if (typeof v !== 'number' || Number.isNaN(v)) throw new Error(k + ' NaN at ' + i);
    }
  }
});
check('timecode', () => { REEL.K.timecode(29.97); });

/* ---- report ---- */
console.log('chapters: ' + CH.map(c => c.name + '@' + c.start).join(' | '));
console.log('total duration: ' + D.toFixed(3) + 's');
if (failures.length) {
  const uniq = [...new Set(failures)];
  console.error('\nFAILURES (' + failures.length + ' total, ' + uniq.length + ' unique):');
  uniq.slice(0, 25).forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
console.log('\n✓ all render paths clean');
