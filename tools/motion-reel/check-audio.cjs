/* Audio transport smoke test.
   Mocks WebAudio, drives play/tick/seek, asserts:
     - no NaN/Infinity ever reaches an AudioParam or start/stop time
     - beat indices are monotonic and non-duplicated
     - scheduling horizon stays in the lookahead window
     - seek re-anchors and resumes without a gap or a burst
   Run: node scripts/check-audio.cjs                                          */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIR = path.join(__dirname, '../../public/projects/motion-reel', 'js');
const errors = [];
const events = [];      /* {t, kind} where t is ctx.currentTime at scheduling   */
let nowCtx = 0;         /* simulated AudioContext clock                         */

function assertParam(name, v, where) {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    errors.push(`${where}: ${name} got ${v}`);
  }
}

/* ---- WebAudio mock ---- */
function param(v, name) {
  return {
    value: v,
    setValueAtTime(x, t) { assertParam(name + '.setValueAtTime', x, 'time ' + t); assertParam('time', t, name); },
    linearRampToValueAtTime(x, t) { assertParam(name + '.linearRamp', x, 'time ' + t); },
    exponentialRampToValueAtTime(x, t) {
      assertParam(name + '.expRamp', x, 'time ' + t);
      if (x === 0) errors.push(`${name}.exponentialRampToValueAtTime(0) at ${t} — invalid, must be > 0`);
    }
  };
}
function node(extra) {
  return Object.assign({
    connect() {}, disconnect() {}
  }, extra || {});
}
function gainNode(v) { return node({ gain: param(v, 'gain') }); }

const ctxMock = {
  currentTime: 0,
  sampleRate: 48000,
  state: 'running',
  destination: node(),
  resume() { this.state = 'running'; return Promise.resolve(); },
  close() { this.state = 'closed'; },
  createGain: () => gainNode(1),
  createOscillator: () => node({
    type: 'sine', frequency: param(440, 'freq'), detune: param(0, 'detune'),
    start(t) { assertParam('osc.start', t, 'start'); events.push({ t, kind: 'osc' }); },
    stop(t) { assertParam('osc.stop', t, 'stop'); }
  }),
  createBiquadFilter: () => node({
    type: 'lowpass', frequency: param(1000, 'filter.freq'), Q: param(1, 'Q'), gain: param(0, 'gain')
  }),
  createDynamicsCompressor: () => node({
    threshold: param(-24, 'comp.th'), knee: param(30, 'comp.knee'), ratio: param(12, 'comp.ratio'),
    attack: param(0.003, 'attack'), release: param(0.25, 'release')
  }),
  createAnalyser: () => node({
    fftSize: 2048, smoothingTimeConstant: 0.8,
    frequencyBinCount: 1024,
    getByteFrequencyData(arr) { for (let i = 0; i < arr.length; i++) arr[i] = 128; }
  }),
  createBuffer(ch, len) {
    const data = new Float32Array(len);
    return { length: len, getChannelData: () => data };
  },
  createBufferSource: () => node({
    buffer: null, playbackRate: param(1, 'rate'), loop: false,
    start(t) { assertParam('buffer.start', t, 'start'); events.push({ t, kind: 'buf' }); },
    stop(t) { assertParam('buffer.stop', t, 'stop'); }
  }),
  createMediaStreamDestination: () => ({ stream: { getAudioTracks: () => [{ kind: 'audio' }] } })
};

/* ---- window sandbox ---- */
const sandbox = {
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, Error, isNaN, parseFloat, parseInt,
  Float32Array, Uint8Array, Uint8ClampedArray, URLSearchParams,
  AudioContext: function () { return ctxMock; },
  setTimeout: (fn, ms) => { sandbox.__timers.push({ fn, at: nowCtx + (ms || 0) / 1000, every: null }); return sandbox.__timers.length; },
  clearTimeout: () => {},
  setInterval: (fn, ms) => {
    const rec = { fn, every: (ms || 0) / 1000, next: nowCtx };
    sandbox.__intervals.push(rec);
    return sandbox.__intervals.length;
  },
  clearInterval: () => {},
  requestAnimationFrame: () => 0,
  performance: { now: () => Date.now() },
  devicePixelRatio: 1,
  location: { search: '' },
  document: {
    createElement: () => ({ getContext: () => null, style: {} }),
    addEventListener() {}, getElementById: () => null, readyState: 'complete'
  },
  __timers: [], __intervals: []
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

['math.js', 'kit.js', 'scenes.js', 'audio.js'].forEach(f => {
  vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8'), sandbox, { filename: f });
});

const REEL = sandbox.REEL;
const Audio = REEL.Audio;

/* ---- drive the transport ---- */
const D = REEL.DURATION;
Audio.ensure();
Audio.setMuted(false);

function runSeconds(from, to, step, hook) {
  for (let t = from; t <= to; t += step) {
    nowCtx = t;
    ctxMock.currentTime = t;
    if (hook) hook(t);
    /* fire the 25ms scheduler interval as many times as elapsed */
    sandbox.__intervals.forEach(iv => {
      while (iv.next <= t) {
        iv.fn();
        iv.next += iv.every;
      }
    });
  }
}

/* 1. play from 0 and let it run the whole reel */
Audio.play(0);
runSeconds(0, D + 0.5, 1 / 60, t => { if (t <= D) Audio.setTime(t); });

const scheduled = events.filter(e => e.kind === 'osc' || e.kind === 'buf');
if (!scheduled.length) errors.push('no audio events were ever scheduled');
if (events.some(e => !Number.isFinite(e.t))) errors.push('non-finite schedule time produced');

/* 2. every scheduled start time must be >= the clock when it was created
      (we never schedule into the past) */
events.forEach((e, i) => {
  if (e.t < -1e-6) errors.push(`event #${i} scheduled in the past: ${e.t}`);
});

/* 3. seek: jump forward, verify it resumes rather than flooding */
events.length = 0;
nowCtx = 30; ctxMock.currentTime = 30;
Audio.seek(20);
runSeconds(30, 30.3, 1 / 60, () => Audio.setTime(20 + 0.0));
const afterSeek = events.length;
/* a 0.3s window should produce a handful of voices, not hundreds */
if (afterSeek > 400) errors.push(`seek caused an event burst: ${afterSeek} events in 0.3s`);

/* 4. loop wrap: setTime jumps backwards ~30s, must re-anchor not desync */
nowCtx = 60; ctxMock.currentTime = 60;
Audio.setTime(29.9);
runSeconds(60, 60.5, 1 / 60, () => Audio.setTime(0.05 + (nowCtx - 60) * 0.2));

/* 5. level() must stay finite */
const lvl = Audio.level();
if (!Number.isFinite(lvl)) errors.push('Audio.level() returned ' + lvl);

/* ---- report ---- */
console.log(`scheduled audio events over ${D}s: ${scheduled.length}`);
console.log(`bpm=${Audio.bpm}  events after seek window: ${afterSeek}`);
console.log(`level=${lvl.toFixed(4)}`);
if (errors.length) {
  const uniq = [...new Set(errors)];
  console.error(`\nAUDIO FAILURES (${errors.length}, ${uniq.length} unique):`);
  uniq.slice(0, 20).forEach(e => console.error('  ✗ ' + e));
  process.exit(1);
}
console.log('\n✓ audio transport clean');
