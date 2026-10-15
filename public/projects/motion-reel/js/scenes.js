/* =============================================================
   motion-reel / scenes.js
   Eight chapters, hand-keyed, 30.000s total.
   Each chapter: draw(ctx, L, t, lt, dur, env)
     t  = global time
     lt = local time within chapter
     dur= chapter duration
     env= { quality, audio, accent, prevAccent, nextAccent, cutIn }
   All motion is a pure function of time => seek/scrub is frame-accurate.
   ============================================================= */
(function (root) {
  'use strict';
  var REEL = root.REEL, M = REEL.M, K = REEL.K, F = K.F, PAL = K.PAL;
  var clamp01 = M.clamp01, lerp = M.lerp, ease = M.ease, TAU = M.TAU, PI = M.PI;
  var rgba = M.rgba, mixHex = M.mixHex;

  /* deterministic particle pool for convergence effects */
  function Particles(n, seed, spread) {
    var rnd = M.mulberry32(seed);
    this.p = [];
    for (var i = 0; i < n; i++) {
      var a = rnd() * TAU;
      var r = spread * (0.25 + rnd() * 0.75);
      this.p.push({
        a: a, r: r, z: 0.35 + rnd() * 1.6,
        s: 0.6 + rnd() * 2.4, ph: rnd() * TAU,
        sp: 0.6 + rnd() * 1.1, hue: rnd()
      });
    }
  }

  /* ---------------- 01 · IGNITION ---------------- */
  function ignition(ctx, L, t, lt, dur, env) {
    var q = env.quality;
    var n = q === 'low' ? 160 : q === 'medium' ? 340 : 560;
    /* rebuild the pool if the aspect changed (spread depends on frame size) */
    var spread = Math.max(L.W, L.H) * 0.95;
    if (!ignition.pool || ignition.poolKey !== spread) {
      ignition.pool = new Particles(560, 9091, spread);
      ignition.poolKey = spread;
    }
    var P = ignition.pool;
    var cx = L.cx, cy = L.H * 0.5;

    /* lens: slow push-in */
    var zoom = 1 + ease.outCubic(clamp01(lt / dur)) * 0.12;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);

    /* particles stream inward */
    var conv = ease.inOutQuint(clamp01(lt / 1.9));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < Math.min(n, P.p.length); i++) {
      var p = P.p[i];
      var rr = p.r * (1 - conv) + 6 * conv;
      var ang = p.a + lt * 0.28 * p.sp + conv * 2.2;
      var x = cx + Math.cos(ang) * rr;
      var y = cy + Math.sin(ang) * rr * 0.82;
      var a = (0.25 + p.hue * 0.6) * (1 - conv * 0.25) * (0.4 + p.z * 0.3);
      if (lt < 0.3) a *= lt / 0.3;
      if (lt > 2.4) a *= 1 - clamp01((lt - 2.4) / (dur - 2.4));
      ctx.fillStyle = i % 7 === 0 ? rgba(PAL.cyan, a) : rgba('#ffffff', a * 0.75);
      ctx.beginPath();
      ctx.arc(x, y, p.s * (1 - conv * 0.4) * p.z, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    /* collapse flash + shockwave rings */
    var flashT = clamp01(lt / 1.9);
    if (flashT > 0.86) {
      var f = (flashT - 0.86) / 0.14;
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(L.W, L.H) * (0.1 + f * 0.7));
      g.addColorStop(0, rgba('#ffffff', 0.85 * (1 - f)));
      g.addColorStop(0.35, rgba(PAL.cyan, 0.4 * (1 - f)));
      g.addColorStop(1, rgba(PAL.violet, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, L.W, L.H);
    }
    for (var r = 0; r < 3; r++) {
      var rt = (lt - 1.75 - r * 0.12) / 1.1;
      if (rt <= 0 || rt > 1) continue;
      K.ring(ctx, cx, cy, rt * Math.max(L.W, L.H) * 0.62, {
        w: lerp(5, 0.4, rt), color: r === 0 ? PAL.paper : PAL.cyan,
        alpha: (1 - rt) * 0.5, a0: 0, a1: TAU
      });
    }

    /* core */
    var coreP = ease.outBack(clamp01((lt - 1.85) / 0.7));
    if (coreP > 0) {
      K.glowDot(ctx, cx, cy, 6 + coreP * 5, '#ffffff', 0.9, 40);
      K.ring(ctx, cx, cy, 34 + coreP * 10, { w: 1.5, color: PAL.cyan, alpha: 0.5 });
      K.ring(ctx, cx, cy, 46 + coreP * 14, { w: 1, color: rgba('#ffffff', 0.3), alpha: 0.4, dash: [4, 8] });
    }
    ctx.restore();

    /* title lockup */
    var tIn = ease.outExpo(clamp01((lt - 2.15) / 0.9));
    var tOut = ease.inCubic(clamp01((lt - dur + 0.45) / 0.4));
    var alpha = tIn * (1 - tOut);
    if (alpha > 0.001) {
      var titleY = cy;
      K.drawText(ctx, 'MOTION', L.cx, titleY, {
        font: F.display(L.W * 0.108), color: PAL.paper, align: 'center', baseline: 'middle',
        track: lerp(L.W * 0.03, L.W * 0.012, tIn), alpha: alpha,
        glow: { c: rgba(PAL.cyan, 0.85), b: L.W * 0.03 }
      });
      K.drawText(ctx, 'DESIGNED BY CODE', L.cx, titleY + L.H * 0.115, {
        font: F.mono(L.W * 0.017, 600), color: rgba(PAL.cyan, 0.9), align: 'center', baseline: 'middle',
        track: lerp(L.W * 0.02, L.W * 0.008, tIn), alpha: alpha * 0.95
      });
      var bw = L.W * 0.24;
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      K.line(ctx, L.cx - bw / 2, titleY + L.H * 0.16, L.cx + bw / 2, titleY + L.H * 0.16,
        { color: rgba('#ffffff', 0.35), w: 1 });
      ctx.restore();
    }

    /* hint */
    if (lt < dur - 0.5) {
      K.drawText(ctx, '30 SECONDS / 100% PROCEDURAL / ZERO ASSETS', L.cx, L.H * 0.82, {
        font: F.mono(L.W * 0.0135, 500), color: rgba('#ffffff', 0.4), align: 'center',
        baseline: 'middle', track: L.W * 0.004
      });
    }
  }
  ignition.accents = [PAL.cyan, PAL.violet];
  ignition.flash = 1.92;

  /* ---------------- 02 · IDENTITY ---------------- */
  var NAME = 'BIG PICKLE';
  function identity(ctx, L, t, lt, dur) {
    var land = L.W >= L.H;
    var n = NAME.length;
    var size = land ? L.W * 0.115 : L.W * 0.155;
    var y0 = land ? L.H * 0.44 : L.H * 0.40;

    /* animated gradient sweep across the letters */
    var sweep = clamp01((lt - 0.4) / 2.2);

    /* backdrop motifs */
    K.floorGrid(ctx, L, t, {
      horizon: L.H * (land ? 0.62 : 0.66), color: PAL.violet, alpha: 0.32,
      cols: 18, rows: 12, speed: 0.3, panX: Math.sin(t * 0.4) * L.W * 0.04
    });
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    K.ribbon(ctx, L, t, { y: L.H * 0.72, amp: L.H * 0.035, bands: 4, colors: [PAL.magenta, PAL.violet, PAL.cyan], alpha: 0.4 });
    ctx.restore();

    /* letters */
    var stagger = 0.075;
    var sweepW = L.W * 0.55;
    for (var i = 0; i < n; i++) {
      var p = clamp01((lt - 0.15 - i * stagger) / 0.62);
      if (p <= 0) continue;
      var e = ease.outBack(p, 1.5);
      var rise = (1 - e) * L.H * 0.26;
      var blur = (1 - ease.outCubic(p)) * size * 0.10;
      var a = clamp01(p * 2) * (1 - ease.inCubic(clamp01((lt - dur + 0.4) / 0.35)));
      /* chromatic ghost offsets that settle */
      var ghost = (1 - ease.outExpo(p)) * size * 0.05;
      /* highlight bar sweeping across the wordmark */
      var head = lerp(-sweepW * 0.6, sweepW * 0.6, sweep);
      var hl = 1 - clamp01(Math.abs((i / n) * sweepW - head) / (sweepW * 0.11));
      var ink = mixHex(PAL.paper, PAL.cyan, hl * 0.85);
      var charIn = function () { return { dx: ghost }; };
      var charOut = function () { return { dx: -ghost }; };

      K.drawText(ctx, NAME[i], L.cx, y0 + rise, {
        font: F.display(size, 800), align: 'center', baseline: 'middle',
        track: 0, alpha: a * 0.55, color: rgba(PAL.cyan, 1),
        charFn: charOut
      });
      K.drawText(ctx, NAME[i], L.cx, y0 + rise, {
        font: F.display(size, 800), align: 'center', baseline: 'middle',
        track: 0, alpha: a * 0.55, color: rgba(PAL.magenta, 1),
        charFn: charIn
      });
      K.drawText(ctx, NAME[i], L.cx, y0 + rise, {
        font: F.display(size, 800), align: 'center', baseline: 'middle',
        alpha: a, color: ink, blur: blur,
        glow: { c: rgba('#ffffff', 0.5), b: size * 0.18 }
      });
    }

    /* role lockup */
    var rp = ease.outExpo(clamp01((lt - 1.5) / 0.7));
    var rAlpha = rp * (1 - ease.inCubic(clamp01((lt - dur + 0.4) / 0.35)));
    if (rAlpha > 0.001) {
      K.drawText(ctx, 'AI MOTION DESIGNER', L.cx, y0 + L.H * 0.135, {
        font: F.ui(L.W * (land ? 0.024 : 0.036), 600), color: PAL.paper, align: 'center',
        baseline: 'middle', track: lerp(L.W * 0.02, L.W * 0.008, rp), alpha: rAlpha
      });
      K.drawText(ctx, 'AI 动态设计师 · 一个人 = 一整个后期团队', L.cx, y0 + L.H * 0.195, {
        font: F.cn(L.W * (land ? 0.02 : 0.03), 500), color: rgba('#ffffff', 0.55), align: 'center',
        baseline: 'middle', track: L.W * 0.002, alpha: rAlpha
      });
    }

    /* skill marquee */
    var mp = ease.outCubic(clamp01((lt - 2.0) / 0.6));
    var mAlpha = mp * (1 - ease.inCubic(clamp01((lt - dur + 0.4) / 0.35)));
    if (mAlpha > 0.001 && land) {
      var words = ['MOTION DESIGN', '缓动曲线', 'TITLE SEQUENCES', '动态排版', 'COMPOSITING', '合成',
        'PARTICLE SYSTEMS', '粒子系统', 'BRAND FILMS', '品牌片'];
      var fs = L.W * 0.018;
      ctx.save();
      ctx.globalAlpha = mAlpha;
      ctx.font = F.mono(fs, 600);
      var totalW = 0, spans = [];
      for (var w = 0; w < words.length; w++) {
        var ww = K.measure(ctx, words[w], fs * 0.28) + fs * 2.4;
        spans.push({ t: words[w], w: ww, x: totalW });
        totalW += ww;
      }
      var off = -((t * L.W * 0.09) % totalW);
      ctx.beginPath(); ctx.rect(0, L.H * 0.845, L.W, fs * 2.2); ctx.clip();
      for (var rep = -1; rep <= Math.ceil(L.W / totalW) + 1; rep++) {
        for (var s = 0; s < spans.length; s++) {
          var x = L.cx - L.W / 2 + off + rep * totalW + spans[s].x;
          K.drawText(ctx, spans[s].t, x, L.H * 0.845, {
            font: F.mono(fs, 600), color: rgba('#ffffff', 0.5), baseline: 'middle', track: fs * 0.28
          });
          ctx.fillStyle = rgba(PAL.cyan, 0.7);
          ctx.beginPath(); ctx.arc(x + spans[s].w - fs * 0.9, L.H * 0.845, fs * 0.11, 0, TAU); ctx.fill();
        }
      }
      ctx.restore();
    }
  }
  identity.accents = [PAL.magenta, PAL.cyan];

  /* ---------------- 03 · EASING ---------------- */
  var CURVE_SET = [
    { n: 'ease', f: M.CURVES['ease'], c: PAL.cyan },
    { n: 'in-out', f: M.CURVES['in-out'], c: PAL.lime },
    { n: 'out-expo', f: M.CURVES['out-expo'], c: PAL.magenta },
    { n: 'out-back', f: M.CURVES['out-back'], c: PAL.amber }
  ];
  function easing(ctx, L, t, lt, dur) {
    var land = L.W >= L.H;
    var panelW = land ? L.W * 0.52 : L.W * 0.86;
    var panelH = land ? L.H * 0.46 : L.H * 0.24;
    var px = (L.W - panelW) / 2, py = land ? L.H * 0.3 : L.H * 0.36;

    /* header */
    var hp = ease.outExpo(clamp01(lt / 0.5));
    K.drawText(ctx, 'EASING', px, py - L.H * 0.075, {
      font: F.display(L.W * 0.062), color: PAL.paper, baseline: 'middle',
      track: lerp(L.W * 0.02, L.W * 0.006, hp), alpha: hp
    });
    K.drawText(ctx, '曲线决定运动的性格 / THE CURVE IS THE CHARACTER', px, py - L.H * 0.028, {
      font: F.cn(L.W * 0.0165, 500), color: rgba(PAL.cyan, 0.75), baseline: 'middle', track: L.W * 0.002, alpha: hp
    });

    /* panel */
    K.panel(ctx, px, py, panelW, panelH, {
      r: L.W * 0.012, alpha: hp * 0.95, fillA: rgba('#0a0c1c', 0.82), fillB: rgba('#141034', 0.6),
      strokeColor: rgba('#ffffff', 0.12), glow: rgba(PAL.cyan, 0.35), glowB: 26
    });

    var gx = px + panelW * 0.09, gy = py + panelH * 0.1;
    var gw = panelW * 0.82, gh = panelH * 0.72;

    /* grid */
    ctx.save();
    ctx.strokeStyle = rgba('#ffffff', 0.07);
    ctx.lineWidth = 1;
    for (var i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(gx + gw * i / 4, gy); ctx.lineTo(gx + gw * i / 4, gy + gh); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx, gy + gh * i / 4); ctx.lineTo(gx + gw, gy + gh * i / 4); ctx.stroke();
    }
    ctx.restore();

    /* four curves, looping runners */
    var loop = 1.55;
    for (var c = 0; c < CURVE_SET.length; c++) {
      var cs = CURVE_SET[c];
      var lt2 = lt - c * 0.16;
      var reveal = ease.outCubic(clamp01((lt2 - 0.25) / 0.85));
      if (reveal <= 0) continue;
      ctx.save();
      ctx.beginPath();
      var N = 60;
      for (var s = 0; s <= N * reveal; s++) {
        var xx = s / N;
        var yy = cs.f(xx);
        var X = gx + xx * gw, Y = gy + gh - yy * gh;
        if (s === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.strokeStyle = cs.c;
      ctx.lineWidth = c === 2 ? 3.4 : 2.2;
      ctx.globalAlpha = 0.92 * hp;
      ctx.shadowColor = cs.c; ctx.shadowBlur = c === 2 ? 16 : 8;
      ctx.stroke();
      ctx.restore();

      /* runner */
      var rp = M.wrap(lt2 - 0.25, loop) / loop;
      if (lt2 > 0.25) {
        var rxp = rp, ryp = cs.f(rp);
        var RX = gx + rxp * gw, RY = gy + gh - ryp * gh;
        /* trail */
        ctx.save();
        for (var k = 5; k >= 1; k--) {
          var tp = rp - k * 0.028;
          if (tp < 0) continue;
          ctx.globalAlpha = 0.5 * (1 - k / 6) * hp;
          ctx.fillStyle = cs.c;
          ctx.beginPath();
          ctx.arc(gx + tp * gw, gy + gh - cs.f(tp) * gh, 3.2 * (1 - k / 8), 0, TAU);
          ctx.fill();
        }
        ctx.restore();
        K.glowDot(ctx, RX, RY, 4.5, cs.c, hp, 18);
        K.ring(ctx, RX, RY, 10, { w: 1, color: cs.c, alpha: 0.4 * hp });
      }

      /* label */
      if (reveal > 0.5) {
        K.drawText(ctx, cs.n, gx + gw + panelW * 0.035, gy + gh * (0.12 + c * 0.26), {
          font: F.mono(L.W * 0.0145, 600), color: rgba(cs.c, 0.95),
          baseline: 'middle', track: 1.6, alpha: (reveal - 0.5) * 2 * hp
        });
      }
    }

    /* the race: 3 dots, different easings, same distance */
    var raceY = gy + gh + panelH * 0.11;
    var rw = gw;
    for (var rr = 0; rr < CURVE_SET.length; rr++) {
      var c2 = CURVE_SET[rr];
      var pr = M.wrap(lt - 0.4, 1.5) / 1.5;
      var y = raceY + rr * panelH * 0.09;
      ctx.save();
      ctx.globalAlpha = 0.16 * hp;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + rw, y); ctx.stroke();
      ctx.restore();
      K.glowDot(ctx, gx + c2.f(pr) * rw, y, 5, c2.c, hp, 14);
      if (rr === 0) { /* labels once */ }
      if (rr < 2) {
        K.drawText(ctx, '0ms', gx + rw + L.W * 0.012, y, {
          font: F.mono(L.W * 0.011, 500), color: rgba('#ffffff', 0.35), baseline: 'middle', track: 1
        });
      }
    }

    /* outro note */
    var op = ease.outExpo(clamp01((lt - dur + 0.5) / 0.4));
    K.drawText(ctx, 'STAGGER 60ms · DURATION 1.55s · EASE OUT-EXPO', px, py + panelH + L.H * 0.07, {
      font: F.mono(L.W * 0.0135, 500), color: rgba('#ffffff', 0.45), baseline: 'middle', track: 2.4, alpha: op
    });
  }
  easing.accents = [PAL.cyan, PAL.lime];

  /* ---------------- 04 · SELECTED WORK ---------------- */
  var WORKS = [
    { t: 'COCA-COLA ATLAS', cn: '全球瓶身数据地图', tag: 'DATA VIZ', c1: '#e4002b', c2: '#ff8a00' },
    { t: 'SBTI', cn: '荒诞测试生成器', tag: 'GENERATIVE', c1: '#5b21b6', c2: '#ec4899' },
    { t: 'SINGULARITY SPACE', cn: 'H5 项目聚合平台', tag: 'PRODUCT', c1: '#0ea5e9', c2: '#6366f1' },
    { t: 'MOTION REEL', cn: '本片 · 纯代码渲染', tag: 'THIS ONE', c1: '#065f46', c2: '#22d3ee' },
    { t: 'TITLE SYSTEM', cn: '字重与排版系统', tag: 'TYPOGRAPHY', c1: '#7c2d12', c2: '#f59e0b' },
    { t: 'DATA DIALOGUE', cn: '数据叙事界面', tag: 'INTERACTION', c1: '#1e1b4b', c2: '#a855f7' }
  ];
  function work(ctx, L, t, lt, dur) {
    var land = L.W >= L.H;
    var n = WORKS.length;
    var index = lt / dur * n;
    var i0 = Math.floor(index) % n;
    var f = index - Math.floor(index);

    /* title */
    var hp = ease.outExpo(clamp01(lt / 0.45));
    K.drawText(ctx, 'SELECTED WORK', L.cx, L.H * (land ? 0.135 : 0.09), {
      font: F.display(L.W * (land ? 0.052 : 0.068)), color: PAL.paper, align: 'center', baseline: 'middle',
      track: lerp(L.W * 0.016, L.W * 0.005, hp), alpha: hp
    });
    K.drawText(ctx, '精选项目 / 2024 — 2026', L.cx, L.H * (land ? 0.2 : 0.145), {
      font: F.cn(L.W * 0.0155, 500), color: rgba('#ffffff', 0.45), align: 'center', baseline: 'middle',
      track: L.W * 0.003, alpha: hp
    });

    /* hero card */
    var cardW = land ? L.W * 0.44 : L.W * 0.78;
    var cardH = cardW * 0.6;
    var cardY = land ? L.H * 0.52 : L.H * 0.42;
    var scale = lerp(0.94, 1, ease.outCubic(clamp01(lt / 0.5)));

    /* stack neighbours peeking */
    for (var d = -2; d <= 2; d++) {
      if (d === 0) continue;
      var idx = (i0 + d + n) % n;
      var depth = Math.abs(d);
      var ox = land ? d * cardW * 0.44 : d * cardW * 0.16;
      var oy = land ? 0 : d * cardH * 0.55;
      var sc = 1 - depth * 0.1;
      ctx.save();
      ctx.globalAlpha = (0.5 - depth * 0.16) * hp;
      ctx.translate(L.cx + ox, cardY + oy);
      ctx.scale(sc, sc);
      ctx.translate(-cardW / 2, -cardH / 2);
      K.panel(ctx, 0, 0, cardW, cardH, { r: L.W * 0.012, fillA: rgba(WORKS[idx].c1, 0.35), fillB: rgba(WORKS[idx].c2, 0.2), strokeColor: rgba('#ffffff', 0.1) });
      K.THUMBS[idx % K.THUMBS.length](ctx, cardW, cardH, t, WORKS[idx].c1, WORKS[idx].c2);
      ctx.restore();
    }

    /* front card with wipe transition */
    ctx.save();
    ctx.translate(L.cx, cardY);
    ctx.scale(scale, scale);
    ctx.translate(-cardW / 2, -cardH / 2);
    ctx.save();
    roundRectPath(ctx, cardW, cardH, L.W * 0.012);
    ctx.clip();
    var wf = WORKS[i0];
    K.THUMBS[i0 % K.THUMBS.length](ctx, cardW, cardH, t, wf.c1, wf.c2);
    /* content reveal */
    var rp = ease.outCubic(clamp01((lt - 0.25) / 0.5));
    ctx.globalAlpha = rp;
    var tg = ctx.createLinearGradient(cardW * 0.5, 0, cardW, cardH);
    tg.addColorStop(0, rgba('#05060b', 0.15)); tg.addColorStop(1, rgba('#05060b', 0.9));
    ctx.fillStyle = tg; ctx.fillRect(0, 0, cardW, cardH);
    ctx.globalAlpha = 1;
    ctx.restore();
    roundRectPath(ctx, cardW, cardH, L.W * 0.012);
    ctx.strokeStyle = rgba('#ffffff', 0.35); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    /* card labels */
    var lab = ease.outExpo(clamp01((lt - 0.35) / 0.5));
    K.drawText(ctx, wf.t, L.cx, cardY + cardH + L.H * 0.055, {
      font: F.display(L.W * (land ? 0.042 : 0.062)), color: PAL.paper, align: 'center', baseline: 'middle',
      track: L.W * 0.003, alpha: lab, glow: { c: rgba(wf.c2, 0.6), b: 22 }
    });
    K.drawText(ctx, wf.cn, L.cx, cardY + cardH + L.H * 0.105, {
      font: F.cn(L.W * (land ? 0.018 : 0.026), 500), color: rgba('#ffffff', 0.6), align: 'center', baseline: 'middle',
      track: L.W * 0.002, alpha: lab
    });
    K.chip(ctx, wf.tag, L.cx, cardY + cardH + L.H * 0.155, {
      font: F.mono(L.W * 0.0125, 600), track: 2.4, color: PAL.paper, align: 'center',
      fill: rgba(wf.c1, 0.5), strokeColor: rgba(wf.c2, 0.6), alpha: lab * 0.95, size: L.W * 0.0125
    });

    /* index + scrub ticks */
    K.drawText(ctx, pad2(i0 + 1) + ' / ' + pad2(n), L.cx - cardW / 2, cardY - cardH / 2 - L.H * 0.04, {
      font: F.mono(L.W * 0.018, 700), color: PAL.paper, baseline: 'middle', track: 3, alpha: lab
    });
    for (var s = 0; s < n; s++) {
      var on = s === i0;
      var tw = on ? cardW * 0.09 : cardW * 0.035;
      ctx.save();
      ctx.globalAlpha = (on ? 0.95 : 0.3) * lab;
      ctx.fillStyle = on ? wf.c2 : '#ffffff';
      ctx.fillRect(L.cx - cardW / 2 + s * (cardW / n), cardY + cardH / 2 + L.H * 0.075, tw, 3);
      ctx.restore();
    }

    /* auto-advance hint */
    if (f > 0.94 && land) {
      K.drawText(ctx, 'AUTO-ADVANCE', L.cx, L.H * 0.87, {
        font: F.mono(L.W * 0.011, 500), color: rgba('#ffffff', 0.4), align: 'center', baseline: 'middle', track: 3
      });
    }
  }
  function pad2(v) { return v < 10 ? '0' + v : '' + v; }
  function roundRectPath(ctx, w, h, r) {
    K.roundRect(ctx, 0, 0, w, h, r);
  }
  work.accents = [PAL.violet, PAL.magenta];

  /* ---------------- 05 · ENGINE ---------------- */
  var knot = null;
  function buildKnot(n) {
    var pts = [], rnd = M.mulberry32(4242);
    for (var i = 0; i < n; i++) {
      var u = i / n * TAU * 3;   /* trefoil */
      var r = 2 + Math.cos(2 * u);
      pts.push({
        x: r * Math.cos(u) * 2.1,
        y: r * Math.sin(u) * 2.1 * 0.5,
        z: Math.sin(3 * u) * 1.5,
        j: 0.25 + rnd() * 0.75
      });
    }
    return pts;
  }
  function engine(ctx, L, t, lt, dur, env) {
    var land = L.W >= L.H;
    var q = env.quality;
    var N = q === 'low' ? 90 : q === 'medium' ? 150 : 210;
    if (!knot || knot.length !== N) knot = buildKnot(N);

    var cx = L.cx, cy = land ? L.H * 0.5 : L.H * 0.42;
    var R = Math.min(L.W, L.H) * (land ? 0.3 : 0.32);
    var audio = env.audio || 0;
    var p = ease.outCubic(clamp01(lt / 0.7));
    var spin = lt * 0.55;

    ctx.save();
    ctx.translate(cx, cy);
    var sc = lerp(0.6, 1, ease.outBack(clamp01(lt / 0.9))) * (1 + audio * 0.06);
    ctx.scale(sc, sc);
    ctx.rotate(spin * 0.18);
    /* fake 3D: squash y to read as a tilted plane */
    ctx.scale(1, 0.55 + Math.sin(lt * 0.5) * 0.14);

    var proj = function (pt) {
      var ca = Math.cos(spin), sa = Math.sin(spin);
      var x = pt.x * ca - pt.z * sa;
      var z = pt.x * sa + pt.z * ca;
      var persp = 3.4 / (3.4 - z * 0.36);
      return { x: cx * 0 + x * R * 0.42 * persp, y: pt.y * R * 0.42 * persp, z: z, d: persp };
    };

    /* edges */
    ctx.lineWidth = 1;
    for (var i = 0; i < N; i++) {
      var a = proj(knot[i]);
      for (var j = 1; j <= 2; j++) {
        var b = proj(knot[(i + j * Math.max(1, Math.floor(N / 40))) % N]);
        var dep = (a.d + b.d) / 2;
        ctx.strokeStyle = rgba(i % 5 === 0 ? PAL.cyan : '#ffffff', 0.055 * dep * (0.5 + p));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    /* nodes */
    ctx.globalCompositeOperation = 'lighter';
    for (var k = 0; k < N; k++) {
      var pt = proj(knot[k]);
      var depth = clamp01((pt.d - 0.7) / 0.7);
      var sz = pt.j * 2.6 * depth * (0.8 + audio * 0.5);
      ctx.fillStyle = rgba(knot[k].j > 0.75 ? PAL.cyan : k % 9 === 0 ? PAL.magenta : '#ffffff', 0.22 + depth * 0.5);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, sz, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    /* stats */
    var sp = ease.outExpo(clamp01((lt - 0.6) / 0.8));
    var stats = [
      { k: 'FPS', v: '60', d: '锁定 60 帧' },
      { k: 'ASSETS', v: '0', d: '零素材 / 全程序化' },
      { k: 'CODE', v: '100%', d: 'JS + Canvas 2D' },
      { k: 'FPS', v: '60', d: '音频可视化驱动' }
    ];
    var colW = land ? L.W * 0.19 : L.W * 0.42;
    for (var s2 = 0; s2 < stats.length; s2++) {
      var st = stats[s2];
      var gx2, gy2;
      if (land) {
        gx2 = s2 < 2 ? L.W * 0.13 : L.W * 0.87;
        gy2 = s2 % 2 === 0 ? L.H * 0.3 : L.H * 0.68;
      } else {
        gx2 = s2 % 2 === 0 ? L.W * 0.26 : L.W * 0.74;
        gy2 = s2 < 2 ? L.H * 0.16 : L.H * 0.86;
      }
      var al = ease.outCubic(clamp01((sp - s2 * 0.12) / 0.6)) * (1 - ease.inCubic(clamp01((lt - dur + 0.35) / 0.3)));
      if (al <= 0.001) continue;
      ctx.save();
      ctx.translate(gx2, gy2);
      var bw2 = colW, bh2 = land ? L.H * 0.17 : L.H * 0.1;
      K.panel(ctx, -bw2 / 2, -bh2 / 2, bw2, bh2, {
        r: L.W * 0.009, alpha: al * 0.75, fillA: rgba('#0a0c1c', 0.7), fillB: rgba('#101a3a', 0.5),
        strokeColor: rgba('#ffffff', 0.12)
      });
      /* meter */
      var mv = clamp01((lt - 0.9 - s2 * 0.12) / 1.2);
      ctx.globalAlpha = al;
      ctx.fillStyle = s2 === 1 ? PAL.magenta : s2 === 2 ? PAL.lime : PAL.cyan;
      ctx.fillRect(-bw2 / 2 + L.W * 0.012, bh2 / 2 - L.W * 0.014, (bw2 - L.W * 0.024) * mv * 1, L.W * 0.0035);
      K.drawText(ctx, st.k, -bw2 / 2 + L.W * 0.016, -bh2 / 2 + bh2 * 0.3, {
        font: F.mono(L.W * 0.0125, 600), color: rgba('#ffffff', 0.45), baseline: 'middle', track: 2.6
      });
      K.counter(ctx, st.v, -bw2 / 2 + L.W * 0.016, bh2 * 0.06, {
        font: F.display(L.W * (land ? 0.05 : 0.06)), color: PAL.paper, baseline: 'middle', track: 1, glow: { c: rgba(PAL.cyan, 0.5), b: 18 }
      }, mv);
      K.drawText(ctx, st.d, bw2 / 2 - L.W * 0.016, -bh2 / 2 + bh2 * 0.3, {
        font: F.cn(L.W * 0.0125, 500), color: rgba('#ffffff', 0.35), baseline: 'middle', track: 0.5, align: 'right'
      });
      ctx.restore();
    }

    /* header */
    var hp = ease.outExpo(clamp01(lt / 0.4));
    K.drawText(ctx, 'ENGINE', land ? L.W * 0.06 : L.cx, land ? L.H * 0.11 : L.H * 0.07, {
      font: F.display(L.W * (land ? 0.05 : 0.062)), color: PAL.paper,
      align: land ? 'left' : 'center', baseline: 'middle', track: lerp(L.W * 0.014, L.W * 0.004, hp), alpha: hp
    });
  }
  engine.accents = [PAL.cyan, PAL.lime];

  /* ---------------- 06 · TYPE & COLOR ---------------- */
  var WORDS = ['TYPE', 'COLOR', 'LIGHT', 'MOTION', 'SOUND'];
  function typecolor(ctx, L, t, lt) {
    var land = L.W >= L.H;
    var idx = Math.floor(lt / 1.6) % WORDS.length;
    var wl = lt - Math.floor(lt / 1.6) * 1.6;
    var word = WORDS[idx];
    var cn = ['字', '色', '光', '动', '声'][idx];

    /* color field */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var b = 0; b < 4; b++) {
      var ang = t * (0.2 + b * 0.09) + b * 1.6;
      var bx = L.cx + Math.cos(ang) * L.W * 0.28;
      var by = L.H * (0.4 + b * 0.08) + Math.sin(ang * 1.3) * L.H * 0.1;
      var g = ctx.createRadialGradient(bx, by, 0, bx, by, Math.min(L.W, L.H) * (0.22 + b * 0.06));
      var c1 = [PAL.magenta, PAL.violet, PAL.cyan, PAL.lime][b];
      var c2 = [PAL.violet, PAL.cyan, PAL.magenta, PAL.cyan][b];
      g.addColorStop(0, rgba(c1, 0.5));
      g.addColorStop(1, rgba(c2, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, L.W, L.H);
    }
    ctx.restore();

    /* giant letter */
    var p = clamp01(wl / 1.6);
    var inP = ease.outExpo(clamp01(p / 0.28));
    var outP = ease.inCubic(clamp01((p - 0.78) / 0.22));
    var scale = lerp(1.25, 1, ease.outExpo(clamp01(p / 0.4)));
    var blur = (1 - ease.outCubic(clamp01(p / 0.25))) * L.W * 0.02;
    var alpha = inP * (1 - outP);
    if (alpha > 0.001) {
      var size = L.W * (land ? 0.2 : 0.24);
      var y = L.H * (land ? 0.44 : 0.45);
      ctx.save();
      /* the word punches in from 125% and settles */
      ctx.translate(L.cx, y);
      ctx.scale(scale, scale);
      ctx.translate(-L.cx, -y);
      /* ghost echoes */
      for (var e = 1; e <= 3; e++) {
        ctx.save();
        ctx.globalAlpha = alpha * 0.14 / e;
        ctx.globalCompositeOperation = 'lighter';
        K.drawText(ctx, word, L.cx + e * L.W * 0.012 * (1 - inP * 0.5), y, {
          font: F.display(size, 800), color: i_(e), align: 'center', baseline: 'middle', blur: e * L.W * 0.006
        });
        ctx.restore();
      }
      K.drawText(ctx, word, L.cx, y, {
        font: F.display(size, 800), color: PAL.paper, align: 'center', baseline: 'middle',
        alpha: alpha, blur: blur, stroke: rgba('#ffffff', 0.25), strokeW: 1.5,
        glow: { c: rgba('#ffffff', 0.45), b: L.W * 0.03 }
      });
      /* cn char */
      K.drawText(ctx, cn, L.cx, y - size * 0.72, {
        font: F.cn(size * 0.16, 700), color: rgba(PAL.cyan, 0.9), align: 'center', baseline: 'middle',
        alpha: alpha * 0.85, track: size * 0.05
      });
      /* underline sweep */
      var uw = size * 0.8 * ease.inOutCubic(clamp01((p - 0.2) / 0.35));
      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = rgba(PAL.cyan, 0.8);
      ctx.fillRect(L.cx - uw / 2, y + size * 0.44, uw, L.W * 0.004);
      ctx.restore();
      ctx.restore();
    }

    /* index */
    var ip = ease.outCubic(clamp01((lt - 0.3) / 0.5));
    K.drawText(ctx, pad2(idx + 1) + ' / 0' + WORDS.length, L.W * 0.06, L.H * 0.1, {
      font: F.mono(L.W * 0.016, 600), color: rgba('#ffffff', 0.4), baseline: 'middle', track: 3, alpha: ip
    });
    K.drawText(ctx, 'TYPOGRAPHY / COLOR STUDY', L.W * 0.06, L.H * 0.145, {
      font: F.mono(L.W * 0.013, 500), color: rgba('#ffffff', 0.3), baseline: 'middle', track: 2.6, alpha: ip
    });

    /* spectrum strip */
    var sp = ease.outCubic(clamp01((lt - 0.6) / 0.6));
    var sw = land ? L.W * 0.4 : L.W * 0.8;
    var sx = land ? L.cx - sw / 2 : L.cx - sw / 2;
    var sy = L.H * 0.84;
    var cols = 64;
    for (var i = 0; i < cols; i++) {
      var ph = i / cols;
      var hue = (ph * 260 + t * 40) % 360;
      var hh = L.W * (0.02 + Math.abs(Math.sin(t * 2 + i * 0.5)) * 0.03);
      ctx.save();
      ctx.globalAlpha = sp * 0.9;
      ctx.fillStyle = M.hsl(hue, 90, 60);
      ctx.fillRect(sx + i * sw / cols, sy, sw / cols - 2, hh);
      ctx.restore();
    }
    /* playhead */
    var px = sx + M.wrap(t * 0.16, 1) * sw;
    ctx.save();
    ctx.globalAlpha = sp;
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(px - 1, sy - L.W * 0.012, 2, L.W * 0.012);
    ctx.fillRect(px - 1, sy + L.W * 0.055, 2, L.W * 0.012);
    ctx.restore();

    /* word list */
    ctx.save();
    ctx.font = F.mono(L.W * 0.012, 500);
    var listY = L.H * 0.16;
    for (var wi = 0; wi < WORDS.length; wi++) {
      var on = wi === idx;
      K.drawText(ctx, WORDS[wi], L.W * 0.94, listY + wi * L.W * 0.028, {
        font: F.mono(L.W * (on ? 0.015 : 0.012), on ? 700 : 500),
        color: on ? PAL.paper : rgba('#ffffff', 0.25), align: 'right', baseline: 'middle',
        track: on ? 3 : 2, alpha: ip
      });
    }
    ctx.restore();
  }
  function i_(e) { return [PAL.magenta, PAL.violet, PAL.cyan][(e - 1) % 3]; }
  typecolor.accents = [PAL.magenta, PAL.amber];

  /* ---------------- 07 · SERVICES ---------------- */
  var SERVICES = [
    { n: '品牌动态 / BRAND MOTION', d: 'Logo 演绎、片头片尾、TVC 动效', i: 0 },
    { n: '交互 H5 / INTERACTIVE', d: '手势 physics、粒子、实时渲染', i: 1 },
    { n: '数据可视化 / DATA VIZ', d: '把数字讲成故事，而不是图表', i: 2 },
    { n: '排版系统 / TYPE SYSTEM', d: '字重、字距、节奏的规则化', i: 3 }
  ];
  function services(ctx, L, t, lt, dur) {
    var land = L.W >= L.H;
    var headerP = ease.outExpo(clamp01(lt / 0.5));
    K.drawText(ctx, 'WHAT I DO', L.cx, L.H * (land ? 0.13 : 0.085), {
      font: F.display(L.W * (land ? 0.056 : 0.072)), color: PAL.paper, align: 'center', baseline: 'middle',
      track: lerp(L.W * 0.018, L.W * 0.005, headerP), alpha: headerP
    });
    K.drawText(ctx, '我能做什么', L.cx, L.H * (land ? 0.195 : 0.135), {
      font: F.cn(L.W * 0.017, 500), color: rgba('#ffffff', 0.45), align: 'center', baseline: 'middle',
      track: L.W * 0.004, alpha: headerP
    });

    var cols = land ? 2 : 1;
    var rows = land ? 2 : 4;
    var gapX = land ? L.W * 0.028 : L.W * 0.06;
    var gapY = land ? L.H * 0.045 : L.H * 0.018;
    var gridW = land ? L.W * 0.78 : L.W * 0.84;
    var cellW = (gridW - gapX * (cols - 1)) / cols;
    var cellH = (land ? L.H * 0.5 : L.H * 0.62) - gapY * (rows - 1) / (cols === 1 ? 1 : 1);
    if (cols === 1) cellH = (L.H * 0.66 - gapY * (rows - 1)) / rows;
    var gridX = (L.W - gridW) / 2;
    var gridY = land ? L.H * 0.26 : L.H * 0.175;

    for (var i = 0; i < SERVICES.length; i++) {
      var sv = SERVICES[i];
      var c = i % cols, r = (i / cols) | 0;
      var x = gridX + c * (cellW + gapX);
      var y = gridY + r * (cellH + gapY);
      var p = ease.outBack(clamp01((lt - 0.3 - i * 0.13) / 0.6), 1.4);
      if (p <= 0) continue;
      var al = clamp01((lt - 0.3 - i * 0.13) / 0.35) * (1 - ease.inCubic(clamp01((lt - dur + 0.4) / 0.35)));
      var dir = i % 2 === 0 ? -1 : 1;
      var ox = (1 - ease.outCubic(clamp01((lt - 0.3 - i * 0.13) / 0.6))) * L.W * 0.08 * dir;
      var oy = (1 - p) * L.H * 0.05;

      ctx.save();
      ctx.globalAlpha = al;
      ctx.translate(x + ox, y + oy);
      /* entrance flip-ish skew */
      ctx.transform(1, 0, dir * (1 - p) * 0.12, 1, 0, 0);
      K.panel(ctx, 0, 0, cellW, cellH, {
        r: L.W * 0.01, fillA: rgba('#0a0c1c', 0.8), fillB: rgba('#151038', 0.6),
        strokeColor: rgba('#ffffff', 0.14), glow: rgba([PAL.cyan, PAL.magenta, PAL.lime, PAL.violet][i], 0.3), glowB: 20
      });
      /* hover-ish inner light */
      var g = ctx.createLinearGradient(0, 0, cellW, cellH);
      g.addColorStop(0, rgba([PAL.cyan, PAL.magenta, PAL.lime, PAL.violet][i], 0.14));
      g.addColorStop(1, rgba([PAL.cyan, PAL.magenta, PAL.lime, PAL.violet][i], 0));
      ctx.fillStyle = g;
      K.roundRect(ctx, 0, 0, cellW, cellH, L.W * 0.01);
      ctx.fill();

      /* icon */
      var isz = Math.min(cellW, cellH) * 0.22;
      drawIcon(ctx, sv.i, L.W * 0.03, cellH * 0.5, isz, t);

      /* text */
      var tx = L.W * 0.03 + isz * 1.5;
      var nMain = sv.n.split(' / ');
      K.drawText(ctx, nMain[0], tx, cellH * 0.38, {
        font: F.cn(L.W * (land ? 0.022 : 0.03), 700), color: PAL.paper, baseline: 'middle', track: L.W * 0.001
      });
      K.drawText(ctx, nMain[1], tx, cellH * 0.38 + L.H * 0.038, {
        font: F.mono(L.W * 0.0125, 600), color: rgba('#ffffff', 0.4), baseline: 'middle', track: 2.4
      });
      K.drawText(ctx, sv.d, tx, cellH * 0.74, {
        font: F.cn(L.W * (land ? 0.0135 : 0.02), 400), color: rgba('#ffffff', 0.45), baseline: 'middle', track: 0.4
      });
      /* number */
      K.drawText(ctx, '0' + (i + 1), cellW - L.W * 0.018, cellH * 0.16, {
        font: F.mono(L.W * 0.014, 700), color: rgba('#ffffff', 0.25), align: 'right', baseline: 'middle', track: 2
      });
      ctx.restore();
    }
  }
  function drawIcon(ctx, kind, x, y, s, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha *= 1;
    var c = PAL.cyan;
    ctx.strokeStyle = c; ctx.fillStyle = c;
    ctx.lineWidth = Math.max(1.5, s * 0.06);
    ctx.shadowColor = rgba(c, 0.8); ctx.shadowBlur = s * 0.35;
    var spin = t * 0.8;
    if (kind === 0) { /* brand: rotating brackets + dot */
      K.ring(ctx, 0, 0, s * 0.75, { w: 2, color: c, a0: spin, a1: spin + PI * 1.3, alpha: 0.9 });
      K.ring(ctx, 0, 0, s * 0.5, { w: 2, color: PAL.magenta, a0: -spin, a1: -spin + PI * 1.1, alpha: 0.9 });
      ctx.beginPath(); ctx.arc(0, 0, s * 0.14, 0, TAU); ctx.fill();
    } else if (kind === 1) { /* interactive: cursor + ripples */
      K.arrowTick(ctx, -s * 0.2, -s * 0.2, s * 0.5, -0.5, { color: c, w: 2.5 });
      for (var i = 0; i < 3; i++) {
        K.ring(ctx, -s * 0.2, -s * 0.2, s * (0.3 + i * 0.22) + Math.sin(spin + i) * s * 0.03,
          { w: 1.5, color: PAL.magenta, alpha: 0.5 - i * 0.12 });
      }
    } else if (kind === 2) { /* data: bars + trend */
      for (var b = 0; b < 4; b++) {
        var hh = s * (0.3 + 0.6 * Math.abs(Math.sin(spin * 1.2 + b * 1.1)));
        ctx.globalAlpha = 0.4 + b * 0.15;
        ctx.fillRect(-s * 0.7 + b * s * 0.38, s * 0.6 - hh, s * 0.22, hh);
      }
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = PAL.lime;
      ctx.beginPath();
      for (var x2 = 0; x2 <= 10; x2++) {
        var yy = -s * 0.5 + Math.sin(x2 * 0.6 + spin * 2) * s * 0.25;
        if (x2 === 0) ctx.moveTo(-s * 0.7 + x2 * s * 0.145, yy); else ctx.lineTo(-s * 0.7 + x2 * s * 0.145, yy);
      }
      ctx.stroke();
    } else { /* type: Aa with baseline */
      ctx.font = F.display(s * 0.9, 800);
      ctx.fillText('Aa', -s * 0.55, s * 0.35);
      ctx.strokeStyle = PAL.violet;
      ctx.beginPath(); ctx.moveTo(-s * 0.7, s * 0.55); ctx.lineTo(s * 0.7, s * 0.55); ctx.stroke();
    }
    ctx.restore();
  }
  services.accents = [PAL.violet, PAL.lime];

  /* ---------------- 08 · FINALE ---------------- */
  function finale(ctx, L, t, lt, dur) {
    var land = L.W >= L.H;
    var cx = L.cx, cy = L.H * (land ? 0.4 : 0.36);

    /* mark */
    var mp = ease.outBack(clamp01(lt / 0.9), 1.2);
    var mAlpha = 1 - ease.inCubic(clamp01((lt - dur + 0.6) / 0.5));
    if (mAlpha > 0.001) {
      ctx.save();
      ctx.globalAlpha = mAlpha;
      ctx.translate(cx, cy);
      var ms = lerp(0.5, 1, mp) * Math.min(L.W, L.H) * 0.13;
      /* rotating play-ring */
      ctx.save();
      ctx.rotate(lt * 0.5);
      K.ring(ctx, 0, 0, ms, { w: 3, color: rgba(PAL.cyan, 0.9), a0: 0, a1: PI * 1.5, alpha: 0.9, glow: rgba(PAL.cyan, 0.8), glowB: 24 });
      K.ring(ctx, 0, 0, ms, { w: 3, color: rgba(PAL.magenta, 0.9), a0: PI, a1: PI * 2.5, alpha: 0.9, glow: rgba(PAL.magenta, 0.8), glowB: 24 });
      ctx.restore();
      /* play triangle */
      ctx.save();
      ctx.translate(0, 0);
      ctx.beginPath();
      var tr = ms * 0.42;
      ctx.moveTo(-tr * 0.5, -tr * 0.86);
      ctx.lineTo(tr * 0.9, 0);
      ctx.lineTo(-tr * 0.5, tr * 0.86);
      ctx.closePath();
      var pg = ctx.createLinearGradient(-tr, -tr, tr, tr);
      pg.addColorStop(0, PAL.cyan); pg.addColorStop(1, PAL.magenta);
      ctx.fillStyle = pg;
      ctx.shadowColor = rgba(PAL.cyan, 0.8); ctx.shadowBlur = ms * 0.6;
      ctx.globalAlpha = mAlpha * ease.outCubic(clamp01((lt - 0.3) / 0.5));
      ctx.fill();
      ctx.restore();
      /* orbital dots */
      for (var o = 0; o < 3; o++) {
        var oa = lt * (0.6 + o * 0.25) + o * TAU / 3;
        var orr = ms * (1.35 + o * 0.18);
        K.glowDot(ctx, Math.cos(oa) * orr, Math.sin(oa) * orr * 0.4, ms * 0.045, o % 2 ? PAL.lime : PAL.cyan, 0.8, 12);
      }
      ctx.restore();
    }

    /* name */
    var np = ease.outExpo(clamp01((lt - 0.6) / 0.7));
    K.tracked(ctx, 'BIG PICKLE', cx, cy + Math.min(L.W, L.H) * (land ? 0.22 : 0.2), {
      font: F.display(L.W * (land ? 0.075 : 0.1)), color: PAL.paper, align: 'center', baseline: 'middle',
      trackFrom: L.W * 0.03, trackTo: L.W * 0.008, p: np,
      glow: { c: rgba('#ffffff', 0.4), b: L.W * 0.02 }, alpha: np * mAlpha
    });
    K.drawText(ctx, 'AI MOTION DESIGNER · 动态设计师', cx, cy + Math.min(L.W, L.H) * (land ? 0.29 : 0.26), {
      font: F.cn(L.W * (land ? 0.016 : 0.024), 500), color: rgba('#ffffff', 0.55), align: 'center', baseline: 'middle',
      track: L.W * 0.003, alpha: np * mAlpha * 0.9
    });

    /* credits */
    var rows = [
      ['ROLE', 'DESIGN · ANIMATION · SOUND'],
      ['TOOLS', 'CANVAS 2D · WEB AUDIO · EASING FUNCTIONS'],
      ['OUTPUT', '30s SHOWREEL · REAL-TIME RENDERED']
    ];
    var cp = ease.outCubic(clamp01((lt - 1.1) / 0.9));
    for (var r = 0; r < rows.length; r++) {
      var al = clamp01((cp - r * 0.15) / 0.5) * mAlpha;
      if (al <= 0.001) continue;
      var ry = L.H * (land ? 0.68 : 0.56) + r * L.H * 0.045;
      K.drawText(ctx, rows[r][0], L.cx - L.W * 0.16, ry, {
        font: F.mono(L.W * 0.012, 600), color: rgba(PAL.cyan, 0.6), align: 'right', baseline: 'middle', track: 2.6
      });
      K.drawText(ctx, rows[r][1], L.cx - L.W * 0.14, ry, {
        font: F.mono(L.W * 0.012, 500), color: rgba('#ffffff', 0.6), baseline: 'middle', track: 1.6
      });
    }

    /* end card */
    var ep = ease.outExpo(clamp01((lt - dur + 0.7) / 0.6));
    if (ep > 0.001) {
      ctx.save();
      ctx.globalAlpha = ep;
      var eg = ctx.createLinearGradient(0, 0, L.W, L.H);
      eg.addColorStop(0, rgba('#05060b', 0.85)); eg.addColorStop(1, rgba('#05060b', 0.6));
      ctx.fillStyle = eg;
      ctx.fillRect(0, 0, L.W, L.H);
      K.drawText(ctx, 'PLAY IT IN MOTION', L.cx, L.H * 0.5, {
        font: F.display(L.W * (land ? 0.07 : 0.09)), color: PAL.paper, align: 'center', baseline: 'middle',
        track: lerp(L.W * 0.02, L.W * 0.006, ep), glow: { c: rgba(PAL.cyan, 0.7), b: L.W * 0.025 }, alpha: ep
      });
      K.drawText(ctx, '让设计动起来 · 动态是唯一的主题', L.cx, L.H * 0.58, {
        font: F.cn(L.W * (land ? 0.016 : 0.024), 500), color: rgba('#ffffff', 0.55), align: 'center', baseline: 'middle',
        track: L.W * 0.002, alpha: ep * 0.9
      });
      ctx.restore();
    }
  }
  finale.accents = [PAL.cyan, PAL.magenta];

  /* ---------------- chapter table ---------------- */
  var CHAPTERS = [
    { id: 'ignition', name: 'IGNITION', cn: '启动', dur: 3.4, draw: ignition },
    { id: 'identity', name: 'IDENTITY', cn: '身份', dur: 3.9, draw: identity },
    { id: 'easing', name: 'EASING', cn: '缓动', dur: 3.8, draw: easing },
    { id: 'work', name: 'SELECTED WORK', cn: '作品', dur: 4.4, draw: work },
    { id: 'engine', name: 'ENGINE', cn: '引擎', dur: 4.2, draw: engine },
    { id: 'type', name: 'TYPE & COLOR', cn: '字体与色彩', dur: 4.2, draw: typecolor },
    { id: 'services', name: 'SERVICES', cn: '服务', dur: 3.2, draw: services },
    { id: 'finale', name: 'FINALE', cn: '片尾', dur: 2.9, draw: finale }
  ];

  /* normalise to exactly 30.000s */
  var sum = CHAPTERS.reduce(function (a, c) { return a + c.dur; }, 0);
  var K30 = 30;
  var scaleF = K30 / sum;
  CHAPTERS.forEach(function (c) { c.dur = Math.round(c.dur * scaleF * 1000) / 1000; });
  var drift = K30 - CHAPTERS.reduce(function (a, c) { return a + c.dur; }, 0);
  CHAPTERS[CHAPTERS.length - 1].dur = Math.round((CHAPTERS[CHAPTERS.length - 1].dur + drift) * 1000) / 1000;

  var acc = 0;
  CHAPTERS.forEach(function (c) {
    c.accents = c.draw.accents || ['#4de3ff', '#8b5cf6'];
    /* ms-quantised clock so start/end/dur are exactly consistent */
    c.start = Math.round(acc * 1000) / 1000;
    acc += c.dur;
    c.end = Math.round(acc * 1000) / 1000;
    c.dur = Math.round((c.end - c.start) * 1000) / 1000;
  });
  CHAPTERS[CHAPTERS.length - 1].end = 30;
  CHAPTERS[CHAPTERS.length - 1].dur = Math.round((30 - CHAPTERS[CHAPTERS.length - 1].start) * 1000) / 1000;

  function chapterAt(t) {
    for (var i = CHAPTERS.length - 1; i >= 0; i--) {
      if (t >= CHAPTERS[i].start) return CHAPTERS[i];
    }
    return CHAPTERS[0];
  }

  REEL.DURATION = K30;
  REEL.CHAPTERS = CHAPTERS;
  REEL.chapterAt = chapterAt;
})(window);
