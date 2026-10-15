/* =============================================================
   motion-reel / audio.js
   Procedural score. No audio files — everything is synthesised.
   A lookahead scheduler (25ms tick / 120ms horizon) keeps notes
   locked to the reel clock, so seeking re-anchors cleanly.

   Signal chain:
     voices -> bus(gain) -> compressor -> master -> destination
                                            \-> analyser (visuals)
                                            \-> mediaStreamDest (export)
   ============================================================= */
(function (root) {
  'use strict';
  var REEL = root.REEL, M = REEL.M;
  var clamp01 = M.clamp01;

  var A = {
    ctx: null, master: null, bus: null, comp: null, analyser: null,
    mediaDest: null, data: null,
    bpm: 126, spb: 60 / 126,        /* seconds per beat */
    nextBeat: 0, playing: false, muted: false,
    anchorReel: 0, anchorCtx: 0,   /* reel-time <-> AudioContext clock */
    level: 0, levelSmooth: 0,
    timer: null, volume: 0.85
  };

  function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  /* A minor pentatonic-ish bed for the whole reel, with movement per section */
  var ROOTS = [45, 45, 41, 43, 45, 48, 43, 45];   /* A2 A2 F2 G2 A2 C3 G2 A2 */

  function ensure() {
    if (A.ctx) return A.ctx;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    var ctx = new AC();
    A.ctx = ctx;

    A.master = ctx.createGain();
    A.master.gain.value = A.muted ? 0 : A.volume;

    A.comp = ctx.createDynamicsCompressor();
    A.comp.threshold.value = -14;
    A.comp.knee.value = 24;
    A.comp.ratio.value = 6;
    A.comp.attack.value = 0.004;
    A.comp.release.value = 0.18;

    A.bus = ctx.createGain();
    A.bus.gain.value = 0.9;

    A.analyser = ctx.createAnalyser();
    A.analyser.fftSize = 512;
    A.analyser.smoothingTimeConstant = 0.75;
    A.data = new Uint8Array(A.analyser.frequencyBinCount);

    A.mediaDest = ctx.createMediaStreamDestination();

    A.bus.connect(A.comp);
    A.comp.connect(A.master);
    A.master.connect(ctx.destination);
    A.master.connect(A.analyser);
    A.master.connect(A.mediaDest);
    return ctx;
  }

  function resume() {
    var ctx = ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
  }

  /* ---------- voices ------------------------------------------ */
  function env(g, t, a, d, peak) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  function kick(t, amp) {
    var ctx = A.ctx;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(155, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.09);
    env(g, t, 0.004, 0.3, 0.9 * (amp || 1));
    o.connect(g); g.connect(A.bus);
    o.start(t); o.stop(t + 0.42);
    /* click */
    var cl = ctx.createOscillator(), cg = ctx.createGain();
    cl.type = 'triangle';
    cl.frequency.setValueAtTime(1400, t);
    cl.frequency.exponentialRampToValueAtTime(180, t + 0.02);
    env(cg, t, 0.001, 0.03, 0.25 * (amp || 1));
    cl.connect(cg); cg.connect(A.bus);
    cl.start(t); cl.stop(t + 0.06);
  }

  function hat(t, amp, dur) {
    var ctx = A.ctx;
    var n = ctx.createBufferSource();
    var len = Math.ceil(ctx.sampleRate * (dur || 0.05));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    n.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 7200;
    var g = ctx.createGain();
    env(g, t, 0.001, dur || 0.05, 0.13 * (amp || 1));
    n.connect(f); f.connect(g); g.connect(A.bus);
    n.start(t); n.stop(t + (dur || 0.05) + 0.02);
  }

  function snare(t, amp) {
    var ctx = A.ctx;
    var n = ctx.createBufferSource();
    var len = Math.ceil(ctx.sampleRate * 0.18);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    n.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.7;
    var g = ctx.createGain();
    env(g, t, 0.002, 0.16, 0.28 * (amp || 1));
    n.connect(f); f.connect(g); g.connect(A.bus);
    n.start(t); n.stop(t + 0.2);
    var o = ctx.createOscillator(), og = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.1);
    env(og, t, 0.002, 0.1, 0.16 * (amp || 1));
    o.connect(og); og.connect(A.bus);
    o.start(t); o.stop(t + 0.14);
  }

  function bass(t, midi, dur, amp) {
    var ctx = A.ctx;
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    var f = ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = hz(midi);
    o2.type = 'sine'; o2.frequency.value = hz(midi - 12);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1400, t);
    f.frequency.exponentialRampToValueAtTime(240, t + dur * 0.9);
    f.Q.value = 6;
    env(g, t, 0.006, dur, 0.32 * (amp || 1));
    o.connect(f); o2.connect(f); f.connect(g); g.connect(A.bus);
    o.start(t); o.stop(t + dur + 0.05);
    o2.start(t); o2.stop(t + dur + 0.05);
  }

  function pluck(t, midi, dur, amp, bright) {
    var ctx = A.ctx;
    var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'triangle';
    o.frequency.value = hz(midi);
    f.type = 'lowpass';
    f.frequency.setValueAtTime((bright || 1) * 5200, t);
    f.frequency.exponentialRampToValueAtTime(600, t + dur);
    f.Q.value = 2;
    env(g, t, 0.004, dur, 0.12 * (amp || 1));
    o.connect(f); f.connect(g); g.connect(A.bus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function pad(t, midis, dur, amp) {
    var ctx = A.ctx;
    var g = ctx.createGain();
    var f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1400; f.Q.value = 1;
    env(g, t, 0.35, dur, 0.055 * (amp || 1));
    f.connect(g); g.connect(A.bus);
    for (var i = 0; i < midis.length; i++) {
      var o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hz(midis[i]) * (1 + (i - 1) * 0.002);
      o.connect(f);
      o.start(t); o.stop(t + dur + 0.4);
    }
  }

  function riser(t, dur, amp) {
    var ctx = A.ctx;
    var n = ctx.createBufferSource();
    var len = Math.ceil(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
    n.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(400, t);
    f.frequency.exponentialRampToValueAtTime(9000, t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2 * (amp || 1), t + dur * 0.92);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    n.connect(f); f.connect(g); g.connect(A.bus);
    n.start(t); n.stop(t + dur + 0.1);
  }

  function impact(t, amp) {
    var ctx = A.ctx;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 0.7);
    env(g, t, 0.005, 0.9, 0.5 * (amp || 1));
    o.connect(g); g.connect(A.bus);
    o.start(t); o.stop(t + 1.0);
    var n = ctx.createBufferSource();
    var len = Math.ceil(ctx.sampleRate * 0.5);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var dd = buf.getChannelData(0);
    for (var i = 0; i < len; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    n.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200;
    var ng = ctx.createGain();
    env(ng, t, 0.002, 0.45, 0.3 * (amp || 1));
    n.connect(f); f.connect(ng); ng.connect(A.bus);
    n.start(t); n.stop(t + 0.55);
  }

  function whoosh(t, amp) {
    var ctx = A.ctx;
    var n = ctx.createBufferSource();
    var len = Math.ceil(ctx.sampleRate * 0.6);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      var p = i / len;
      d[i] = (Math.random() * 2 - 1) * Math.sin(p * Math.PI);
    }
    n.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(6000, t + 0.35);
    var g = ctx.createGain();
    env(g, t, 0.06, 0.4, 0.16 * (amp || 1));
    n.connect(f); f.connect(g); g.connect(A.bus);
    n.start(t); n.stop(t + 0.7);
  }

  /* ---------- sequencer --------------------------------------- */
  /* schedule one beat's worth of events at absolute audio time `when`;
     `t` is the reel position of that beat (seconds into the film)      */
  function scheduleBeat(beatIdx, when, t) {
    var b = beatIdx % 4;
    var sec = clamp01(t / REEL.DURATION);
    var energy = 0.55 + sec * 0.5;            /* builds through the reel */
    var root = ROOTS[Math.floor(beatIdx / 8) % ROOTS.length];

    /* downbeats */
    if (b === 0) {
      kick(when, 1);
      bass(when, root - 12, A.spb * 1.6, 1);
      if (beatIdx % 8 === 0) pad(when, [root, root + 7, root + 12], A.spb * 8, 1);
      if (beatIdx % 16 === 0) impact(when, 0.5);
    }
    if (b === 2) kick(when, 0.82);

    /* snare on 2 & 4 */
    if (b === 1 || b === 3) snare(when, 0.85 * energy);

    /* hats: 8ths with accents, 16ths later in the reel */
    hat(when + A.spb * 0.5, 0.7, 0.045);
    if (sec > 0.25) hat(when + A.spb * 0.75, 0.4, 0.03);
    if (sec > 0.6) hat(when + A.spb * 0.25, 0.35, 0.025);

    /* arp: pentatonic pattern that thickens in the back half */
    var arpOn = sec > 0.12 && (beatIdx % 2 === 0 || sec > 0.55);
    if (arpOn) {
      var scale = [0, 3, 5, 7, 10, 12];
      var pat = [0, 2, 4, 3, 5, 2, 1, 4];
      var ni = pat[beatIdx % pat.length];
      var note = root + 12 + scale[ni];
      pluck(when, note, A.spb * 0.7, 0.85 * energy, 0.7 + sec * 0.8);
      if (sec > 0.45) pluck(when + A.spb * 0.5, root + 24 + scale[(ni + 2) % scale.length], A.spb * 0.4, 0.4, 1.2);
    }

    /* transitions: whoosh + riser into chapter cuts */
    var chs = REEL.CHAPTERS;
    for (var i = 0; i < chs.length; i++) {
      var cut = chs[i].start;
      if (cut <= 0.001) continue;
      var dBeat = (cut - t) / A.spb;
      /* 2-beat riser leading into the cut */
      if (dBeat > 0 && dBeat <= 2 && beatIdx % 2 === 0) {
        riser(when, Math.min(dBeat * A.spb, 0.9), 0.5);
      }
      if (dBeat > -0.15 && dBeat <= 0.05) {
        whoosh(when, 1);
      }
    }

    /* final hit at 29.6 */
    if (beatIdx > 0) {
      var dEnd = (29.55 - t) / A.spb;
      if (dEnd > 0 && dEnd <= 2 && beatIdx % 2 === 0) riser(when, Math.min(dEnd * A.spb, 0.95), 0.7);
      if (dEnd <= 0.05 && dEnd > -0.4) impact(when, 0.9);
    }
  }

  function tick() {
    if (!A.ctx || !A.playing) return;
    var now = A.ctx.currentTime;
    /* advance the audio-clock-derived reel position */
    var horizonReel = A.anchorReel + (now - A.anchorCtx);
    var ahead = 0.14;                       /* schedule this far ahead */
    var limit = REEL.DURATION;
    while (A.nextBeat * A.spb < horizonReel + ahead && A.nextBeat * A.spb < limit) {
      var when = A.anchorCtx + (A.nextBeat * A.spb - A.anchorReel);
      if (when > now) scheduleBeat(A.nextBeat, when, A.nextBeat * A.spb);
      A.nextBeat++;
    }
  }

  /* ---------- transport --------------------------------------- */
  function play(t) {
    var ctx = ensure(); if (!ctx) return;
    resume();
    A.playing = true;
    A.anchorReel = t || 0;
    A.anchorCtx = ctx.currentTime;
    A.nextBeat = Math.floor((t || 0) / A.spb);
    if (!A.timer) A.timer = setInterval(tick, 25);
  }
  function pause() { A.playing = false; }
  /* the render loop calls this every frame while playing to keep audio
     locked to the video clock (handles drift + loop wrap) */
  function setTime(t) {
    if (!A.ctx || !A.playing) return;
    /* small jumps (seek/loop) => re-anchor; otherwise gently correct */
    var nowReel = A.anchorReel + (A.ctx.currentTime - A.anchorCtx);
    var d = t - nowReel;
    if (Math.abs(d) > 0.2) {
      A.anchorReel = t;
      A.anchorCtx = A.ctx.currentTime;
      A.nextBeat = Math.floor(t / A.spb);
    } else {
      A.anchorReel += d * 0.08;            /* slow slew toward video clock */
    }
  }
  function seek(t) {
    if (!A.ctx) return;
    A.anchorReel = t;
    A.anchorCtx = A.ctx.currentTime;
    A.nextBeat = Math.ceil(t / A.spb);
  }
  function setMuted(m) {
    A.muted = m;
    if (A.master) A.master.gain.value = m ? 0 : A.volume;
  }
  function setVolume(v) {
    A.volume = clamp01(v);
    if (A.master && !A.muted) A.master.gain.value = A.volume;
  }

  /* RMS level, smoothed — drives visuals */
  function level() {
    if (!A.analyser || A.muted) { A.levelSmooth *= 0.9; return A.levelSmooth; }
    A.analyser.getByteFrequencyData(A.data);
    var sum = 0;
    for (var i = 0; i < 64; i++) sum += A.data[i] * A.data[i];
    A.level = Math.sqrt(sum / 64) / 255;
    A.levelSmooth = lerpTo(A.levelSmooth, A.level, 0.2);
    return A.levelSmooth;
  }
  function lerpTo(a, b, t) { return a + (b - a) * t; }

  function mediaStream() { return A.mediaDest ? A.mediaDest.stream : null; }
  function dispose() {
    if (A.timer) clearInterval(A.timer);
    A.timer = null; A.playing = false;
    if (A.ctx) A.ctx.close();
    A.ctx = null;
  }

  REEL.Audio = {
    ensure: ensure, resume: resume, play: play, pause: pause, seek: seek, setTime: setTime,
    setMuted: setMuted, setVolume: setVolume, level: level,
    mediaStream: mediaStream, dispose: dispose,
    get muted() { return A.muted; },
    get ctx() { return A.ctx; },
    set bpm(v) { A.bpm = v; A.spb = 60 / v; },
    get bpm() { return A.bpm; }
  };
})(window);
