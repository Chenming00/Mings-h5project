/* =============================================================
   motion-reel / kit.js
   Drawing primitives: tracked/kinetic type, panels, glow shapes,
   generative thumbnails, persistent backdrop + film HUD.
   All coordinates are in DESIGN SPACE (set by main.js transform).
   ============================================================= */
(function (root) {
  'use strict';
  var REEL = root.REEL, M = REEL.M;
  var clamp01 = M.clamp01, lerp = M.lerp, ease = M.ease, TAU = M.TAU;
  var rgba = M.rgba, mix = M.mix;

  /* ---------- palette ---------------------------------------- */
  var PAL = {
    ink: '#05060b',
    ink2: '#0b0d18',
    paper: '#f4f2ff',
    dim: '#8b90b8',
    cyan: '#4de3ff',
    violet: '#8b5cf6',
    magenta: '#ff4d8d',
    lime: '#c9ff4d',
    amber: '#ffb020',
    red: '#ff3b3b'
  };

  var F = {
    display: function (px, w) { return (w || 800) + ' ' + px + 'px Anton, "Archivo Black", Impact, "Arial Narrow", "PingFang SC", sans-serif'; },
    ui: function (px, w) { return (w || 600) + ' ' + px + 'px Inter, -apple-system, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif'; },
    cn: function (px, w) { return (w || 700) + ' ' + px + 'px "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'; },
    mono: function (px, w) { return (w || 500) + ' ' + px + 'px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'; }
  };

  /* ---------- typography ------------------------------------- */

  /* measure a string with manual tracking (independent of ctx.letterSpacing) */
  function measure(ctx, str, track) {
    track = track || 0;
    var w = 0;
    for (var i = 0; i < str.length; i++) w += ctx.measureText(str[i]).width + track;
    return w - (str.length ? track : 0);
  }

  /**
   * draw(ctx, str, x, y, o)
   * o: {font, size?, weight?, family?, color, alpha, align:'left|center|right',
   *      baseline, track, stroke, strokeW, glow:{c,b}, shadow:{c,b,y},
   *      charFn(i, ch, cx, cy) -> {dx,dy,scale,alpha,color,blur,rot}}
   */
  function drawText(ctx, str, x, y, o) {
    o = o || {};
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    if (o.font) ctx.font = o.font;
    var track = o.track || 0;
    var w = measure(ctx, str, track);
    var sx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    var base = o.baseline || 'alphabetic';
    /* the canvas default is 'alphabetic'; honour the caller's intent so that
       baseline:'middle' actually centres on y */
    ctx.textBaseline = base;

    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch === ' ') { sx += ctx.measureText(ch).width + track; continue; }
      var cw = ctx.measureText(ch).width;
      var mod = o.charFn ? o.charFn(i, ch, sx, y) : null;
      var scale = mod && mod.scale !== undefined ? mod.scale : 1;
      var alpha = mod && mod.alpha !== undefined ? mod.alpha : 1;
      var col = (mod && mod.color) || o.color || '#fff';
      var dx = (mod && mod.dx) || 0, dy = (mod && mod.dy) || 0;
      var rot = (mod && mod.rot) || 0;

      ctx.save();
      if (mod && mod.blur) { ctx.filter = 'blur(' + mod.blur.toFixed(2) + 'px)'; }
      ctx.translate(sx + cw / 2 + dx, y + dy);
      if (rot || scale !== 1) { ctx.rotate(rot); ctx.scale(scale, scale); }
      ctx.translate(-cw / 2, 0);
      ctx.globalAlpha *= alpha;

      if (o.glow) {
        ctx.shadowColor = o.glow.c;
        ctx.shadowBlur = o.glow.b * (scale === 1 ? 1 : scale);
      } else if (o.shadow) {
        ctx.shadowColor = o.shadow.c;
        ctx.shadowBlur = o.shadow.b;
        ctx.shadowOffsetY = o.shadow.y || 0;
      }

      if (o.stroke) {
        ctx.lineWidth = (o.strokeW || 2);
        ctx.strokeStyle = o.stroke;
        ctx.lineJoin = 'round';
        ctx.strokeText(ch, 0, 0);
      }
      ctx.fillStyle = col;
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      sx += cw + track;
    }
    ctx.restore();
    return w;
  }

  /* clip-rect text reveal (mask slides across) */
  function drawTextClip(ctx, str, x, y, o, clip) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(clip.x, clip.y, clip.w, clip.h);
    ctx.clip();
    drawText(ctx, str, x, y, o);
    ctx.restore();
  }

  /* animated tracking (letter-spacing as a design device) */
  function tracked(ctx, str, x, y, o) {
    var from = o.trackFrom !== undefined ? o.trackFrom : o.track;
    var to = o.trackTo !== undefined ? o.trackTo : o.track;
    var p = clamp01(o.p !== undefined ? o.p : 1);
    return drawText(ctx, str, x, y, Object.assign({}, o, { track: lerp(from, to, ease.outExpo(p)) }));
  }

  /* typing effect: n visible chars, last one fades in */
  function typed(ctx, str, x, y, o, n) {
    var s = str.slice(0, Math.max(0, Math.floor(n)));
    var partial = n - Math.floor(n);
    var w = drawText(ctx, s, x, y, o);
    if (partial > 0.01 && s.length < str.length) {
      var last = str[Math.floor(n)];
      ctx.save();
      ctx.globalAlpha *= partial * 0.9;
      drawText(ctx, last, x + w + (o.track || 0), y, Object.assign({}, o, { glow: { c: (o.color || '#fff'), b: 18 } }));
      ctx.restore();
    }
    return w;
  }

  /* odometer-style number with tabular feel */
  function counter(ctx, str, x, y, o, p) {
    var n = Math.min(str.length, Math.max(0, Math.floor(lerp(0, str.length, clamp01(p)) + 0.0001)));
    var s = str.slice(0, n).replace(/\d/g, '0');
    // lerp last digit value for smooth counting
    var total = parseFloat(str) || 0;
    var frac = total * clamp01(p);
    var shown = String(frac.toFixed(str.indexOf('.') > -1 ? 1 : 0));
    if (o.pad) shown = shown.padStart(str.length, '0');
    s = shown.slice(0, str.length);
    return drawText(ctx, s, x, y, o);
  }

  /* ---------- shapes ----------------------------------------- */

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function ring(ctx, x, y, r, o) {
    o = o || {};
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0, r), o.a0 || 0, o.a0 !== undefined || o.a1 !== undefined ? (o.a1 === undefined ? TAU : o.a1) : TAU);
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.lineWidth = o.w || 2;
    ctx.strokeStyle = o.color || '#fff';
    ctx.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.glowB || 16; }
    ctx.stroke();
    ctx.restore();
  }

  function glowDot(ctx, x, y, r, color, alpha, glowB) {
    ctx.save();
    ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.shadowColor = color;
    ctx.shadowBlur = glowB === undefined ? r * 6 : glowB;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function line(ctx, x1, y1, x2, y2, o) {
    o = o || {};
    ctx.save();
    ctx.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
    ctx.strokeStyle = o.color || '#fff';
    ctx.lineWidth = o.w || 1;
    if (o.dash) ctx.setLineDash(o.dash);
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.glowB || 10; }
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function arrowTick(ctx, x, y, size, angle, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.beginPath();
    ctx.moveTo(-size, -size * 0.5);
    ctx.lineTo(0, 0);
    ctx.lineTo(-size, size * 0.5);
    ctx.strokeStyle = o.color || '#fff';
    ctx.lineWidth = o.w || 1.5;
    ctx.lineCap = 'round';
    ctx.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
    ctx.stroke();
    ctx.restore();
  }

  /* panel with soft glass fill + hairline border + optional glow */
  function panel(ctx, x, y, w, h, o) {
    o = o || {};
    ctx.save();
    ctx.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
    roundRect(ctx, x, y, w, h, o.r === undefined ? 18 : o.r);
    if (o.fill !== 'none') {
      var g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, o.fillA || rgba('#0d1030', 0.72));
      g.addColorStop(1, o.fillB || rgba('#1a1140', 0.5));
      ctx.fillStyle = o.fill === true ? g : o.fill;
      ctx.fill();
    }
    if (o.stroke !== 'none') {
      ctx.strokeStyle = o.strokeColor || rgba('#ffffff', 0.14);
      ctx.lineWidth = o.strokeW || 1;
      if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.glowB || 18; }
      ctx.stroke();
    }
    ctx.restore();
  }

  /* pill label */
  function chip(ctx, str, x, y, o) {
    o = o || {};
    ctx.save();
    ctx.font = o.font || F.mono(o.size || 20, 600);
    var track = o.track === undefined ? 2 : o.track;
    var w = measure(ctx, str, track) + (o.padX || 26);
    var h = o.h || 40;
    var bx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    ctx.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
    roundRect(ctx, bx, y - h / 2, w, h, h / 2);
    ctx.fillStyle = o.fill || rgba('#ffffff', 0.06);
    ctx.fill();
    ctx.strokeStyle = o.strokeColor || rgba('#ffffff', 0.18);
    ctx.lineWidth = 1;
    ctx.stroke();
    drawText(ctx, str, bx + w / 2, y + 1, {
      font: o.font || F.mono(o.size || 20, 600), color: o.color || PAL.paper, track: track,
      align: 'center', baseline: 'middle', alpha: o.textAlpha === undefined ? 1 : o.textAlpha
    });
    ctx.restore();
    return w;
  }

  /* corner brackets (framing device) */
  function brackets(ctx, L, inset, len, o) {
    o = o || {};
    var c = o.color || rgba('#ffffff', 0.22), w = o.w || 2;
    var x0 = inset, y0 = inset, x1 = L.W - inset, y1 = L.H - inset;
    var corners = [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]];
    ctx.save();
    ctx.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'square';
    for (var i = 0; i < corners.length; i++) {
      var p = corners[i];
      ctx.beginPath();
      ctx.moveTo(p[0] + p[2] * len, p[1]);
      ctx.lineTo(p[0], p[1]);
      ctx.lineTo(p[0], p[1] + p[3] * len);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* perspective floor grid */
  function floorGrid(ctx, L, t, o) {
    o = o || {};
    var hz = o.horizon === undefined ? L.H * 0.52 : o.horizon;
    var cols = o.cols || 22, rows = o.rows || 16;
    var speed = o.speed || 0.32, color = o.color || PAL.cyan, alpha = o.alpha === undefined ? 0.5 : o.alpha;
    var sx = L.cx + (o.panX || 0), bottom = o.bottom === undefined ? L.H * 1.15 : o.bottom;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = o.w || 1.4;
    ctx.strokeStyle = color;
    for (var i = 0; i <= cols; i++) {
      var p = i / cols;
      var x = sx + (p - 0.5) * L.W * 2.6;
      var g = ctx.createLinearGradient(0, hz, 0, bottom);
      g.addColorStop(0, rgba(color, 0));
      g.addColorStop(0.25, rgba(color, 0.55));
      g.addColorStop(1, rgba(color, 0.85));
      ctx.strokeStyle = g;
      ctx.beginPath();
      ctx.moveTo(lerp(x, sx + (p - 0.5) * L.W * 0.12, 1), hz);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }
    var off = M.wrap(t * speed, 1);
    for (var r = 0; r <= rows; r++) {
      var q = (r + off) / rows;
      var y = hz + Math.pow(q, 2.4) * (bottom - hz);
      var a = q * q * 0.9;
      ctx.strokeStyle = rgba(color, a);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(L.W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* dot matrix field, subtle */
  function dotField(ctx, L, t, o) {
    o = o || {};
    var cols = o.cols || 26, rows = o.rows || Math.round(cols * (L.H / L.W));
    var color = o.color || PAL.violet, gap = L.W / cols;
    var r = o.r || gap * 0.09;
    var drift = o.drift === undefined ? 0.25 : o.drift;
    ctx.save();
    ctx.globalAlpha = o.alpha === undefined ? 0.5 : o.alpha;
    ctx.fillStyle = color;
    for (var i = 0; i <= cols; i++) {
      for (var j = 0; j <= rows; j++) {
        var k = M.hash2(i, j);
        var w = 0.5 + 0.5 * Math.sin(t * drift + k * TAU * 2);
        ctx.globalAlpha = (o.alpha === undefined ? 0.5 : o.alpha) * (0.15 + w * 0.85) * (0.4 + k * 0.6);
        ctx.beginPath();
        ctx.arc(i * gap, j * gap + Math.sin(t * drift * 0.6 + i * 0.4) * gap * 0.18, r * (0.7 + w * 0.6), 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /* generic wave / ribbon ribbon */
  function ribbon(ctx, L, t, o) {
    o = o || {};
    var bands = o.bands || 5, amp = o.amp || L.H * 0.06, y0 = o.y === undefined ? L.cy : o.y;
    ctx.save();
    ctx.globalCompositeOperation = o.mode || 'lighter';
    for (var b = 0; b < bands; b++) {
      var f = b / (bands - 1 || 1);
      var col = o.colors ? o.colors[b % o.colors.length] : o.color;
      ctx.beginPath();
      for (var x = 0; x <= L.W; x += 12) {
        var n = x / L.W;
        var y = y0 + Math.sin(n * 6.0 + t * 1.4 + b * 0.55) * amp * (0.5 + f) +
          Math.sin(n * 13.0 - t * 0.9 + b) * amp * 0.28;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(col, (o.alpha === undefined ? 0.5 : o.alpha) * (1 - f * 0.7));
      ctx.lineWidth = o.w || 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- generative thumbnails (works carousel) -------- */
  var THUMBS = [
    function (ctx, w, h, t, c1, c2) {
      var g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.55, ((t * 0.35 + i / 7) % 1) * w * 0.6, 0, TAU);
        ctx.strokeStyle = rgba('#ffffff', 0.35 * (1 - (t * 0.35 + i / 7) % 1));
        ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.restore();
    },
    function (ctx, w, h, t, c1, c2) {
      ctx.fillStyle = c1; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 16; i++) {
        var v = (Math.sin(i * 0.7 + t * 1.6) * 0.5 + 0.5);
        ctx.fillStyle = mix(c2, '#ffffff', v * 0.7);
        ctx.fillRect(w * 0.08 + i * w * 0.055, h * (0.85 - v * 0.7), w * 0.035, h * 0.7 * v);
      }
    },
    function (ctx, w, h, t, c1, c2) {
      var g = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.7);
      g.addColorStop(0, c2); g.addColorStop(1, c1);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = rgba('#ffffff', 0.5); ctx.lineWidth = 1.5;
      for (var i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.5);
        var a = i / 20 * TAU + t * 0.2;
        ctx.lineTo(w * 0.5 + Math.cos(a) * w, h * 0.5 + Math.sin(a) * w);
        ctx.globalAlpha = 0.25; ctx.stroke();
      }
    },
    function (ctx, w, h, t, c1, c2) {
      ctx.fillStyle = c2; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (var i = 0; i < 5; i++) {
        ctx.beginPath();
        for (var x = 0; x <= w; x += 8) {
          var y = h * (0.5 + 0.28 * Math.sin(x / w * 7 + t * 2 + i)) - i * 6;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = rgba(c1, 0.75); ctx.lineWidth = 2.5; ctx.stroke();
      }
      ctx.restore();
    },
    function (ctx, w, h, t, c1, c2) {
      ctx.fillStyle = c1; ctx.fillRect(0, 0, w, h);
      ctx.save();
      var n = 12, cell = w / n;
      for (var i = 0; i < n; i++) for (var j = 0; j < n * h / w; j++) {
        var k = M.hash2(i, j);
        var s = (0.5 + 0.5 * Math.sin(t * 1.3 + k * TAU)) * cell * 0.9;
        ctx.fillStyle = rgba(k > 0.5 ? c2 : '#ffffff', 0.25 + k * 0.5);
        ctx.fillRect(i * cell + cell * 0.1, j * cell + cell * 0.1, s * 0.8, s * 0.8);
      }
      ctx.restore();
    },
    function (ctx, w, h, t, c1, c2) {
      ctx.fillStyle = c2; ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      for (var i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate(t * (0.3 + i * 0.14) * (i % 2 ? -1 : 1));
        ctx.strokeStyle = rgba(i === 1 ? '#ffffff' : c1, 0.8);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, w * (0.16 + i * 0.13), 0, TAU * (0.3 + 0.7 * M.clamp01(t * 0.25 + i * 0.3)));
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
  ];

  /* ---------- backdrop (persistent across chapters) --------- */
  function backdrop(ctx, L, t, accent) {
    ctx.save();
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(0, 0, L.W, L.H);
    /* soft accent bloom */
    var g = ctx.createRadialGradient(L.cx, L.H * 0.42, 0, L.cx, L.H * 0.42, L.W * 0.75);
    g.addColorStop(0, rgba(accent, 0.22));
    g.addColorStop(0.45, rgba(accent, 0.06));
    g.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L.W, L.H);
    /* dust */
    var n = L.W > L.H ? 130 : 90;
    ctx.fillStyle = rgba('#ffffff', 0.5);
    for (var i = 0; i < n; i++) {
      var s = M.hash1(i * 1.7);
      var x = M.hash1(i * 3.1) * L.W;
      var speed = 8 + M.hash1(i * 5.3) * 26;
      var y = M.wrap(L.H - (t * speed + M.hash1(i * 7.7) * L.H), L.H + 40) - 20;
      var r = (0.6 + s * 1.9);
      ctx.globalAlpha = 0.06 + s * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- film HUD (drawn in-canvas so it lands in export) - */
  function hud(ctx, L, t, state, chapters, active) {
    if (state.hudOn === false) return;
    var pad = L.W * 0.045;
    var topY = pad * 0.9;
    var fs = L.W > L.H ? 19 : 15;
    var a = state.hudAlpha === undefined ? 0.72 : state.hudAlpha;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textBaseline = 'middle';

    /* top-left identity */
    drawText(ctx, 'REEL 2026', pad, topY, { font: F.mono(fs, 700), color: PAL.paper, track: 3.5, baseline: 'middle' });
    drawText(ctx, 'BIG PICKLE / AI MOTION', pad, topY + fs * 1.8, {
      font: F.mono(fs * 0.82, 500), color: rgba('#ffffff', 0.5), track: 2.4, baseline: 'middle'
    });

    /* top-right timecode + chapter */
    var tc = timecode(t);
    drawText(ctx, tc, L.W - pad, topY, { font: F.mono(fs, 700), color: PAL.paper, track: 2.6, align: 'right', baseline: 'middle' });
    if (active) {
      drawText(ctx, active.cn + ' · ' + active.name, L.W - pad, topY + fs * 1.8, {
        font: F.mono(fs * 0.82, 500), color: rgba(PAL.cyan, 0.85), track: 2.4, align: 'right', baseline: 'middle'
      });
    }

    /* rec dot */
    var blink = (Math.sin(t * 6) * 0.5 + 0.5);
    ctx.globalAlpha = a * (0.35 + blink * 0.65);
    ctx.fillStyle = PAL.red;
    ctx.beginPath();
    ctx.arc(pad + measure(ctx, 'REEL 2026', 3.5) + fs * 1.4, topY, fs * 0.3, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a * 0.7;

    /* progress bar with chapter ticks */
    var barY = L.H - pad * 0.85;
    var barW = L.W - pad * 2;
    ctx.strokeStyle = rgba('#ffffff', 0.22);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad, barY); ctx.lineTo(L.W - pad, barY); ctx.stroke();
    var p = clamp01(t / REEL.DURATION);
    ctx.strokeStyle = rgba(PAL.cyan, 0.95);
    ctx.beginPath(); ctx.moveTo(pad, barY); ctx.lineTo(pad + barW * p, barY); ctx.stroke();
    ctx.fillStyle = PAL.paper;
    ctx.beginPath(); ctx.arc(pad + barW * p, barY, 4.5, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.45);
    for (var i = 1; i < chapters.length; i++) {
      var x = pad + barW * (chapters[i].start / REEL.DURATION);
      ctx.fillRect(x - 1, barY - 5, 2, 10);
    }
    ctx.restore();
  }

  function timecode(t) {
    var total = Math.floor(t * 24);
    var f = total % 24, s = Math.floor(total / 24) % 60, m = Math.floor(total / (24 * 60));
    var p = function (v) { return v < 10 ? '0' + v : '' + v; };
    return p(m) + ':' + p(s) + ':' + p(f);
  }

  REEL.K = {
    PAL: PAL, F: F, THUMBS: THUMBS,
    measure: measure, drawText: drawText, drawTextClip: drawTextClip, tracked: tracked, typed: typed, counter: counter,
    roundRect: roundRect, ring: ring, glowDot: glowDot, line: line, arrowTick: arrowTick, panel: panel, chip: chip,
    brackets: brackets, floorGrid: floorGrid, dotField: dotField, ribbon: ribbon,
    backdrop: backdrop, hud: hud, timecode: timecode
  };
})(window);
