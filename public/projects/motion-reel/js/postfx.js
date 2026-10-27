/* =============================================================
   motion-reel / postfx.js
   Compositing pipeline. Everything is offscreen-canvas based:
     scene -> bright-pass -> blur -> bloom -> aberration/glitch
           -> grain + scanlines + vignette -> screen
   Buffers are allocated once and reused; nothing allocates per frame.
   ============================================================= */
(function (root) {
  'use strict';
  var REEL = root.REEL, M = REEL.M;
  var rgba = M.rgba, clamp01 = M.clamp01;

  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  }

  var FX = {
    scene: null, bright: null, bloomA: null, bloomB: null, work: null,
    grain: [], w: 0, h: 0,
    quality: 'high',
    abort: 0,               // 0..1 chromatic split amount
    glitch: 0,              // 0..1 slice displacement amount
    scan: 0,                // scanline strength
    vignette: 0.62,
    grainAmt: 0.055,
    bloomAmt: 0.85
  };

  function init(w, h, quality) {
    FX.w = w; FX.h = h; FX.quality = quality || 'high';
    FX.scene = makeCanvas(w, h);
    FX.bright = makeCanvas(w >> 1, h >> 1);
    FX.bloomA = makeCanvas(w >> 2, h >> 2);
    FX.bloomB = makeCanvas(w >> 3, h >> 3);
    FX.work = makeCanvas(w, h);
    buildGrain();
  }

  function buildGrain() {
    /* four pre-baked noise tiles, cycled per frame so grain crawls */
    var sizes = [256, 256, 320, 288];
    FX.grain = [];
    for (var g = 0; g < sizes.length; g++) {
      var n = sizes[g];
      var c = makeCanvas(n, n);
      var cx = c.getContext('2d');
      var img = cx.createImageData(n, n);
      var d = img.data;
      var rnd = M.mulberry32(1337 + g * 7919);
      for (var i = 0; i < d.length; i += 4) {
        var v = 128 + (rnd() - 0.5) * 255;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      cx.putImageData(img, 0, 0);
      FX.grain.push(c);
    }
  }

  /* soft threshold bright-pass: max(r,g,b) keeps highlights, kills mids */
  function brightPass() {
    var b = FX.bright.getContext('2d');
    var w = FX.bright.width, h = FX.bright.height;
    b.globalCompositeOperation = 'source-over';
    b.clearRect(0, 0, w, h);
    b.drawImage(FX.scene, 0, 0, w, h);
    b.globalCompositeOperation = 'multiply';
    b.drawImage(FX.scene, 0, 0, w, h);   /* squares the values => threshold */
    b.globalCompositeOperation = 'source-over';
  }

  /* separable-ish blur by ping-pong downsample/upsample (cheap + smooth) */
  function blur(src, dst, radius) {
    var c = dst.getContext('2d');
    var w = dst.width, h = dst.height;
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, w, h);
    c.filter = 'blur(' + radius.toFixed(2) + 'px)';
    c.drawImage(src, 0, 0, w, h);
    c.filter = 'none';
  }

  function composite(src, dst, amount, mode) {
    var c = dst.getContext('2d');
    c.save();
    c.globalCompositeOperation = mode || 'lighter';
    c.globalAlpha = amount;
    c.drawImage(src, 0, 0, dst.width, dst.height);
    c.restore();
  }

  /* main pipeline. scr (screen ctx) receives final image. */
  function render(scr, t, state) {
    var W = FX.w, H = FX.h;
    var q = FX.quality;

    /* ---- bloom ---- */
    var bloomOn = state.fx.bloom !== false;
    if (bloomOn) {
      brightPass();
      blur(FX.bright, FX.bloomA, q === 'low' ? 2 : 4);
      if (q === 'high') {
        blur(FX.bloomA, FX.bloomB, 5);
        composite(FX.bloomB, FX.bloomA, 0.85);
      }
      var bc = FX.scene.getContext('2d');
      bc.save();
      bc.globalCompositeOperation = 'lighter';
      bc.globalAlpha = state.fx.bloomAmt === undefined ? FX.bloomAmt : state.fx.bloomAmt;
      bc.filter = q === 'low' ? 'none' : 'blur(1.2px)';
      bc.drawImage(FX.bloomA, 0, 0, W, H);
      bc.filter = 'none';
      bc.restore();
    }

    /* ---- aberration + glitch slices ---- */
    var ab = state.fx.aberration || 0;
    var gl = state.fx.glitch || 0;
    var doSplit = ab > 0.002 || gl > 0.002;

    if (doSplit) {
      var work = FX.work.getContext('2d');
      work.globalCompositeOperation = 'source-over';
      work.globalAlpha = 1;
      work.filter = 'none';
      work.clearRect(0, 0, W, H);
      work.drawImage(FX.scene, 0, 0);

      /* horizontal slice displacement, deterministic per frame */
      if (gl > 0.002) {
        var bands = 9;
        var bandH = H / bands;
        var fr = Math.floor(t * 24);
        for (var i = 0; i < bands; i++) {
          var k = M.hash2(fr, i * 3.7);
          if (k < 0.45) continue;
          var k2 = M.hash2(fr + 91, i * 5.3);
          var dy = i * bandH;
          var hgt = bandH * (0.55 + k2 * 0.6);
          var dx = (k2 - 0.5) * W * 0.14 * gl;
          work.drawImage(FX.scene, 0, dy, W, hgt, dx, dy, W, hgt);
        }
      }

      /* chromatic separation: pull the frame apart horizontally */
      if (ab > 0.002) {
        var off = ab * W * 0.010;
        work.globalCompositeOperation = 'lighter';
        work.globalAlpha = 0.45;
        work.drawImage(FX.work, -off, 0);
        work.drawImage(FX.work, off, 0);
        work.globalAlpha = 1;
        work.globalCompositeOperation = 'source-over';
      }

      scr.drawImage(FX.work, 0, 0, W, H);
    } else {
      scr.drawImage(FX.scene, 0, 0, W, H);
    }

    /* ---- grain ---- */
    if (state.fx.grain !== false) {
      var g = FX.grain[Math.floor(t * 24) % FX.grain.length];
      var gc = FX.grain[(Math.floor(t * 24) + 2) % FX.grain.length];
      scr.save();
      scr.globalCompositeOperation = 'overlay';
      scr.globalAlpha = state.fx.grainAmt === undefined ? FX.grainAmt : state.fx.grainAmt;
      var ox = (M.hash1(Math.floor(t * 24)) * 256) | 0;
      var oy = (M.hash1(Math.floor(t * 24) + 17) * 256) | 0;
      var pat = scr.createPattern(g, 'repeat');
      scr.translate(-ox, -oy);
      scr.fillStyle = pat;
      scr.fillRect(0, 0, W + 300, H + 300);
      scr.translate(ox, oy);
      if (FX.quality === 'high') {
        scr.globalAlpha *= 0.5;
        scr.fillStyle = scr.createPattern(gc, 'repeat');
        scr.fillRect(ox, oy, W + 300, H + 300);
      }
      scr.restore();
    }

    /* ---- scanlines ---- */
    if (state.fx.scan !== false) {
      var sa = state.fx.scan;
      if (sa == null) sa = 0.05;
      if (sa > 0.001) {
        scr.save();
        scr.globalCompositeOperation = 'multiply';
        scr.globalAlpha = sa;
        scr.fillStyle = '#000';
        var step = Math.max(2, Math.round(H / 620));
        for (var y = 0; y < H; y += step * 2) scr.fillRect(0, y, W, step);
        scr.restore();
      }
    }

    /* ---- vignette ---- */
    var vg = state.fx.vignette === undefined ? FX.vignette : state.fx.vignette;
    if (vg > 0.001) {
      var g2 = scr.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.22, W / 2, H / 2, Math.max(W, H) * 0.72);
      g2.addColorStop(0, 'rgba(0,0,0,0)');
      g2.addColorStop(0.62, 'rgba(0,0,0,' + (vg * 0.35).toFixed(3) + ')');
      g2.addColorStop(1, 'rgba(0,0,0,' + vg.toFixed(3) + ')');
      scr.fillStyle = g2;
      scr.fillRect(0, 0, W, H);
    }
  }

  /* full-frame flash (impact frames) */
  function flash(scr, color, amount) {
    if (amount <= 0.001) return;
    scr.save();
    scr.globalCompositeOperation = 'lighter';
    scr.fillStyle = rgba(color, clamp01(amount));
    scr.fillRect(0, 0, FX.w, FX.h);
    scr.restore();
  }

  /* letterbox to a cinematic ratio inside the frame */
  function bars(scr, ratio, color) {
    var W = FX.w, H = FX.h;
    var cur = W / H;
    if (ratio >= cur) {
      var nh = W / ratio, ny = (H - nh) / 2;
      scr.fillStyle = color || '#000';
      scr.fillRect(0, 0, W, ny); scr.fillRect(0, H - ny, W, ny);
      return { top: ny, h: nh };
    }
    var nw = H * ratio, nx = (W - nw) / 2;
    scr.fillStyle = color || '#000';
    scr.fillRect(0, 0, nx, H); scr.fillRect(W - nx, 0, nx, H);
    return { left: nx, w: nw };
  }

  REEL.FX = { init: init, render: render, flash: flash, bars: bars, get scene() { return FX.scene; }, get w() { return FX.w; }, get h() { return FX.h; } };
})(window);
