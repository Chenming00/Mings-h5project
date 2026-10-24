/* =============================================================
   motion-reel / main.js
   Clock, render orchestration, transitions, transport, export.
   ============================================================= */
(function (root) {
  'use strict';
  var REEL = root.REEL, M = REEL.M, K = REEL.K, FX = REEL.FX, Audio = REEL.Audio;
  var clamp = M.clamp, clamp01 = M.clamp01;
  var rgba = M.rgba;

  /* ---------- state ------------------------------------------ */
  var state = {
    t: 0,
    playing: false,
    muted: false,
    loop: true,
    speed: 1,
    quality: 'high',
    aspect: '16:9',
    hudOn: true,
    showFps: false,
    letterbox: false,
    clean: false,          /* hide all UI chrome (for export) */
    exporting: false,
    fps: 60,
    frames: 0
  };

  var canvas, ctx, stage, L, W = 1920, H = 1080, dpr = 1;
  var last = 0, fpsAcc = 0, fpsCount = 0;
  var ui = {};

  /* aspect presets — design-space dimensions */
  var ASPECTS = {
    '16:9': { w: 1920, h: 1080, label: '横屏 16:9' },
    '9:16': { w: 1080, h: 1920, label: '竖屏 9:16' },
    '1:1': { w: 1080, h: 1080, label: '方形 1:1' },
    '4:5': { w: 1080, h: 1350, label: '竖版 4:5' }
  };

  function aspectDims() { return ASPECTS[state.aspect]; }

  /* ---------- layout ------------------------------------------ */
  function resize() {
    var box = stage.getBoundingClientRect();
    var dims = aspectDims();
    var d = dims.w / dims.h;
    var availW = box.width, availH = box.height;
    var cssW, cssH;
    if (availW / availH > d) { cssH = availH; cssW = cssH * d; }
    else { cssW = availW; cssH = cssW / d; }

    /* cap internal resolution by quality to protect the frame budget */
    var qScale = state.quality === 'low' ? 0.5 : state.quality === 'medium' ? 0.72 : 1;
    dpr = Math.min(root.devicePixelRatio || 1, 2) * qScale;
    /* don't exceed design space by much */
    var maxPx = dims.w * (state.quality === 'high' ? 1.35 : 1);
    var pxW = Math.min(Math.round(cssW * dpr), Math.round(maxPx));
    var pxH = Math.round(pxW * (dims.h / dims.w));

    W = pxW; H = pxH;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d', { alpha: false });
    FX.init(W, H, state.quality);

    L = {
      W: dims.w, H: dims.h,
      cx: dims.w / 2, cy: dims.h / 2,
      scale: W / dims.w,
      dir: dims.w >= dims.h ? 'land' : 'port'
    };
  }

  /* ---------- transitions ------------------------------------ */
  /* Returns fx settings + optional full-frame flash for time t. */
  function transitionFX(t) {
    var chs = REEL.CHAPTERS;
    var ab = 0, gl = 0, flashC = null, flashA = 0, hit = 0;
    var nextCut = null, sinceCut = 99;
    for (var i = 0; i < chs.length; i++) {
      var s = chs[i].start;
      if (s <= 0.001) continue;
      var d = t - s;
      if (d >= 0 && d < 0.5) { sinceCut = d; nextCut = chs[i]; }
      else if (d < 0 && d > -0.45) { sinceCut = 0.45; }
    }
    var isIgnitionFlash = t > 1.86 && t < 2.1;

    if (sinceCut < 0.5) {
      /* spike on the cut, then decay */
      var k = 1 - sinceCut / 0.5;
      gl = Math.pow(k, 1.6);
      ab = Math.pow(k, 2.4) * 1.0;
      hit = Math.pow(k, 3);
      flashA = Math.pow(k, 5) * 0.5;
      flashC = '#ffffff';
    }
    if (isIgnitionFlash) {
      var f = 1 - (t - 1.86) / 0.24;
      flashA = Math.max(flashA, f * 0.9);
      flashC = '#dff6ff';
      ab = Math.max(ab, f * 0.8);
    }
    /* continuous subtle aberration during fast sections */
    var breathe = 0.012 + 0.02 * Math.abs(Math.sin(t * 0.8));
    ab = Math.max(ab, breathe * 0.35);

    return { aberration: ab, glitch: gl, flashC: flashC, flashA: flashA, hit: hit, sinceCut: sinceCut, cut: nextCut };
  }

  /* ---------- frame ------------------------------------------ */
  function drawScene(t) {
    var sc = FX.scene.getContext('2d');
    var dims = aspectDims();
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.clearRect(0, 0, W, H);

    /* design-space transform */
    var s = W / dims.w;
    sc.setTransform(s, 0, 0, s, 0, 0);

    var ch = REEL.chapterAt(t);
    var lt = t - ch.start;
    var prev = REEL.CHAPTERS[REEL.CHAPTERS.indexOf(ch) - 1];

    /* accent colour crossfades between chapters */
    var a0 = ch.accents[0], a1 = ch.accents[1];
    var acc = M.mixHex(a0, a1, clamp01(lt / ch.dur));
    if (prev && lt < 0.5) {
      acc = M.mixHex(prev.accents[1], acc, clamp01(lt / 0.5));
    }

    /* audio-reactive amplitude */
    var amp = Audio.level();

    /* backdrop, then the chapter itself */
    K.backdrop(sc, L, t, acc);
    ch.draw(sc, L, t, lt, ch.dur, {
      quality: state.quality, audio: amp, accent: acc, beat: t * (Audio.bpm / 60)
    });

    /* framing brackets */
    K.brackets(sc, L, L.W * 0.035, L.W * 0.022, { alpha: 0.55, color: rgba('#ffffff', 0.18) });

    /* HUD — drawn in-canvas so it survives into the exported video */
    K.hud(sc, L, t, state, REEL.CHAPTERS, ch);
  }

  function render(t) {
    drawScene(t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);

    var tr = transitionFX(t);
    var fx = {
      bloom: true,
      bloomAmt: 0.8 + tr.hit * 0.5 + Audio.level() * 0.2,
      aberration: tr.aberration,
      glitch: tr.glitch,
      grain: !state.clean,
      grainAmt: state.clean ? 0.045 : 0.06,
      scan: 0.045,
      vignette: 0.6
    };
    FX.render(ctx, t, { fx: fx });
    if (tr.flashA > 0.001) FX.flash(ctx, tr.flashC, tr.flashA);
    if (state.letterbox) FX.bars(ctx, 2.39);

    if (state.showFps) {
      ctx.save();
      ctx.font = '600 14px ui-monospace, monospace';
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.fillText(Math.round(state.fps) + ' FPS · ' + state.quality + ' · ' + W + 'x' + H, 14, 20);
      ctx.restore();
    }
  }

  /* ---------- clock ------------------------------------------ */
  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    fpsAcc += dt; fpsCount++;
    if (fpsAcc > 0.5) { state.fps = fpsCount / fpsAcc; fpsAcc = 0; fpsCount = 0; }

    /* while exporting, a dedicated pump owns the clock + rendering */
    if (state.exporting) return;

    if (state.playing) {
      state.t += dt * state.speed;
      if (state.t >= REEL.DURATION) {
        if (state.loop) state.t -= REEL.DURATION;
        else { state.t = REEL.DURATION; setPlaying(false); }
      }
      Audio.setTime(state.t);
      syncTransport();
    }
    render(state.t);
  }

  /* ---------- transport -------------------------------------- */
  function setPlaying(p) {
    state.playing = p;
    if (p) { Audio.play(state.t); } else { Audio.pause(); }
    ui.play.innerHTML = icon(p ? 'pause' : 'play');
    ui.play.classList.toggle('is-playing', p);
    ui.play.setAttribute('aria-label', p ? '暂停' : '播放');
  }
  function toggle() { setPlaying(!state.playing); }
  function seekTo(t) {
    state.t = clamp(t, 0, REEL.DURATION);
    if (Audio.ctx) Audio.seek(state.t);
    syncTransport();
  }
  function scrubTo(clientX) {
    var r = ui.scrub.getBoundingClientRect();
    var p = clamp01((clientX - r.left) / r.width);
    seekTo(p * REEL.DURATION);
  }

  function fmt(t) {
    var s = Math.floor(t), f = Math.floor((t - s) * 24);
    return (s < 10 ? '0' + s : s) + ':' + (f < 10 ? '0' + f : f);
  }
  function syncTransport() {
    ui.scrub.style.setProperty('--p', (state.t / REEL.DURATION * 100) + '%');
    ui.time.textContent = fmt(state.t) + ' / 30:00';
    /* chapter ticks */
    if (!ui.ticksBuilt) {
      var frag = document.createDocumentFragment();
      REEL.CHAPTERS.forEach(function (c) {
        if (c.start <= 0) return;
        var d = document.createElement('i');
        d.style.left = (c.start / REEL.DURATION * 100) + '%';
        frag.appendChild(d);
      });
      ui.scrub.appendChild(frag);
      ui.ticksBuilt = true;
    }
  }

  /* ---------- export ----------------------------------------- */
  function canvasBlob(cb, type, q) {
    canvas.toBlob(cb, type || 'image/png', q);
  }

  function snapshot() {
    var wasClean = state.clean;
    state.clean = true;
    render(state.t);
    canvasBlob(function (blob) {
      saveBlob(blob, 'motion-reel-' + state.aspect.replace(':', 'x') + '-' + state.t.toFixed(2) + '.png');
      state.clean = wasClean;
      toast('已保存 PNG 帧');
    });
  }

  function saveBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  var recording = null;
  function startExport() {
    if (recording) { stopExport(); return; }
    if (typeof canvas.captureStream !== 'function') { toast('此浏览器不支持录制'); return; }

    var stream = canvas.captureStream(60);
    /* mix in the score */
    var astream = Audio.mediaStream();
    if (astream && !state.muted && astream.getAudioTracks().length) {
      try {
        astream.getAudioTracks().forEach(function (tr) { stream.addTrack(tr); });
      } catch (err) {
        /* some browsers refuse mixed tracks — fall back to a silent video */
        console.warn('音轨合并失败，导出为无声视频', err);
      }
    }

    var mime = 'video/webm;codecs=vp9';
    if (!root.MediaRecorder || !MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
    var rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 });
    var chunks = [];
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = function () {
      var blob = new Blob(chunks, { type: 'video/webm' });
      saveBlob(blob, 'motion-reel-30s-' + state.aspect.replace(':', 'x') + '.webm');
      state.exporting = false;
      recording = null;
      ui.rec.classList.remove('is-rec');
      ui.recLabel.textContent = '导出 WebM';
      ui.exportBar.classList.remove('is-on');
      setPlaying(true);
      toast('导出完成 · ' + (blob.size / 1048576).toFixed(1) + ' MB');
    };

    recording = rec;
    state.exporting = true;
    seekTo(0);
    ui.rec.classList.add('is-rec');
    ui.recLabel.textContent = '停止导出';
    ui.exportBar.classList.add('is-on');
    rec.start(250);
    /* drive the clock manually so the render is deterministic while recording;
       audio keeps running and is re-locked to the same timeline */
    state.playing = false;
    ui.play.innerHTML = icon('play');
    Audio.play(0);
    var t0 = performance.now();
    (function pump() {
      if (!state.exporting) return;
      var el = (performance.now() - t0) / 1000 * state.speed;
      if (el >= REEL.DURATION) {
        state.t = REEL.DURATION;
        render(state.t);
        setTimeout(stopExport, 240);
        return;
      }
      state.t = el;
      Audio.setTime(state.t);
      render(state.t);
      syncTransport();
      requestAnimationFrame(pump);
    })();
  }
  function stopExport() { if (recording) recording.stop(); }

  /* ---------- toast ------------------------------------------ */
  var toastEl, toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
  }

  /* ---------- UI build --------------------------------------- */
  function icon(name) {
    var p = {
      play: '<path d="M8 5.5v13l11-6.5z"/>',
      pause: '<path d="M8 5.5h3.2v13H8zM12.8 5.5H16v13h-3.2z"/>',
      replay: '<path d="M12 5V2.5L8 6l4 3.5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/>',
      sound: '<path d="M4 9.5v5h3l4 3.5V6L7 9.5H4z"/><path d="M14.5 8.2a5 5 0 0 1 0 7.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
      mute: '<path d="M4 9.5v5h3l4 3.5V6L7 9.5H4z"/><path d="M14.5 9.5l4 5m0-5l-4 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
      cam: '<path d="M4 7.5h10v9H4z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M14 11l5-3v8l-5-3z"/>',
      rec: '<circle cx="12" cy="12" r="6"/>',
      expand: '<path d="M4 9V4h5M20 15v5h-5M20 9V4h-5M4 15v5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + p[name] + '</svg>';
  }

  function buildUI() {
    ui.play = document.getElementById('play');
    ui.replay = document.getElementById('replay');
    ui.mute = document.getElementById('mute');
    ui.rec = document.getElementById('rec');
    ui.recLabel = document.getElementById('recLabel');
    ui.snap = document.getElementById('snap');
    ui.scrub = document.getElementById('scrub');
    ui.time = document.getElementById('time');
    ui.quality = document.getElementById('quality');
    ui.aspect = document.getElementById('aspect');
    ui.hud = document.getElementById('hud');
    ui.fps = document.getElementById('fps');
    ui.letterbox = document.getElementById('letterbox');
    ui.exportBar = document.getElementById('exportBar');
    toastEl = document.getElementById('toast');

    ui.play.innerHTML = icon('play');
    ui.replay.innerHTML = icon('replay');
    ui.mute.innerHTML = icon('sound');
    ui.snap.innerHTML = icon('cam');
    document.getElementById('expand').innerHTML = icon('expand');

    ui.play.addEventListener('click', toggle);
    ui.replay.addEventListener('click', function () { seekTo(0); setPlaying(true); });
    ui.mute.addEventListener('click', function () {
      state.muted = !state.muted;
      Audio.setMuted(state.muted);
      ui.mute.innerHTML = icon(state.muted ? 'mute' : 'sound');
      ui.mute.classList.toggle('is-off', state.muted);
    });
    ui.snap.addEventListener('click', snapshot);
    ui.rec.addEventListener('click', startExport);
    ui.expand = document.getElementById('expand');
    ui.expand.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    });

    /* aspect options */
    Object.keys(ASPECTS).forEach(function (k) {
      var b = document.createElement('button');
      b.className = 'seg' + (k === state.aspect ? ' is-on' : '');
      b.textContent = ASPECTS[k].label;
      b.dataset.k = k;
      b.addEventListener('click', function () {
        state.aspect = k;
        [].forEach.call(ui.aspect.children, function (c) { c.classList.toggle('is-on', c.dataset.k === k); });
        resize();
        toast('画幅 ' + ASPECTS[k].label);
      });
      ui.aspect.appendChild(b);
    });

    ui.quality.addEventListener('change', function () {
      state.quality = ui.quality.value;
      resize();
      toast('画质 ' + ui.quality.value);
    });

    ui.hud.addEventListener('click', function () {
      state.hudOn = !state.hudOn;
      ui.hud.classList.toggle('is-off', !state.hudOn);
    });
    ui.fps.addEventListener('click', function () {
      state.showFps = !state.showFps;
      ui.fps.classList.toggle('is-off', !state.showFps);
    });
    ui.letterbox.addEventListener('click', function () {
      state.letterbox = !state.letterbox;
      ui.letterbox.classList.toggle('is-off', !state.letterbox);
    });

    /* scrub: click + drag */
    var dragging = false;
    ui.scrub.addEventListener('pointerdown', function (e) {
      dragging = true;
      ui.scrub.setPointerCapture(e.pointerId);
      scrubTo(e.clientX);
    });
    ui.scrub.addEventListener('pointermove', function (e) { if (dragging) scrubTo(e.clientX); });
    ui.scrub.addEventListener('pointerup', function (e) {
      dragging = false;
      try { ui.scrub.releasePointerCapture(e.pointerId); }
      catch { /* capture may already be released */ }
    });

    /* chapter markers */
    var mk = document.getElementById('chapters');
    REEL.CHAPTERS.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'chipbtn';
      b.style.left = (c.start / REEL.DURATION * 100) + '%';
      b.innerHTML = '<span class="t"></span><span class="n">' + c.name + '</span><span class="c">' + c.cn + '</span>';
      b.addEventListener('click', function () { seekTo(c.start + 0.01); setPlaying(true); });
      mk.appendChild(b);
    });

    /* keyboard */
    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      var k = e.key.toLowerCase();
      if (k === ' ' || k === 'k') { e.preventDefault(); toggle(); }
      else if (k === 'arrowright') { seekTo(state.t + (e.shiftKey ? 5 : 1)); }
      else if (k === 'arrowleft') { seekTo(state.t - (e.shiftKey ? 5 : 1)); }
      else if (k === 'r') { seekTo(0); setPlaying(true); }
      else if (k === 'm') { ui.mute.click(); }
      else if (k === 'h') { ui.hud.click(); }
      else if (k === 'f') { ui.expand.click(); }
      else if (k === 's') { snapshot(); }
      else if (k === 'e') { startExport(); }
      else if (k >= '1' && k <= '8') {
        var c = REEL.CHAPTERS[parseInt(k, 10) - 1];
        if (c) { seekTo(c.start + 0.01); setPlaying(true); }
      }
    });

    root.addEventListener('resize', debounce(resize, 120));
  }

  function debounce(fn, ms) {
    var id; return function () { clearTimeout(id); id = setTimeout(fn, ms); };
  }

  /* ---------- boot ------------------------------------------- */
  function boot() {
    stage = document.getElementById('stage');
    canvas = document.getElementById('reel');
    buildUI();
    resize();
    state.hudOn = true;
    syncTransport();

    /* fonts then first paint */
    var go = function () {
      render(0);
      last = 0;
      requestAnimationFrame(frame);
    };
    if (document.fonts && document.fonts.ready) {
      var done = false;
      var kick = function () { if (done) return; done = true; go(); };
      document.fonts.ready.then(kick);
      setTimeout(kick, 1200);
    } else go();

    /* audio needs a gesture */
    var overlay = document.getElementById('overlay');
    var start = function () {
      Audio.ensure();
      Audio.setMuted(state.muted);
      setPlaying(true);
      overlay.classList.add('is-gone');
      setTimeout(function () { overlay.remove(); }, 700);
    };
    overlay.addEventListener('click', start);
    document.getElementById('startBtn').addEventListener('click', function (e) { e.stopPropagation(); start(); });
    document.getElementById('silentBtn').addEventListener('click', function (e) {
      e.stopPropagation(); state.muted = true; Audio.setMuted(true); start();
    });

    /* autoplay if already permitted / deep-linked */
    var p = new URLSearchParams(location.search);
    if (p.get('mute') === '1') { state.muted = true; Audio.setMuted(true); }
    if (p.get('autoplay') === '1') setTimeout(start, 60);
    if (p.get('t')) { seekTo(parseFloat(p.get('t')) || 0); }
    if (p.get('hud') === '0') { state.hudOn = false; ui.hud.classList.add('is-off'); }

    root.REEL_APP = {
      state: state, render: render, seek: seekTo, toggle: toggle,
      setQuality: function (q) { state.quality = q; ui.quality.value = q; resize(); },
      setAspect: function (a) { state.aspect = a; resize(); },
      snapshot: snapshot, export: startExport,
      chapterAt: REEL.chapterAt
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
