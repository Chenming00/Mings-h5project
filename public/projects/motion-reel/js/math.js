/* =============================================================
   motion-reel / math.js
   Deterministic math toolkit: easing, seeded RNG, color, geometry.
   Everything here is pure + time-parameterised so the reel can be
   scrubbed to any frame and render identically (no Math.random).
   ============================================================= */
(function (root) {
  'use strict';
  var REEL = (root.REEL = root.REEL || {});

  var TAU = Math.PI * 2;
  var PI = Math.PI;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function invLerp(a, b, v) { return (v - a) / (b - a || 1e-6); }
  function mapRange(v, a, b, c, d) { return lerp(c, d, clamp01(invLerp(a, b, v))); }
  function smoothstep(t) { t = clamp01(t); return t * t * (3 - 2 * t); }
  function smootherstep(t) { t = clamp01(t); return t * t * t * (t * (t * 6 - 15) + 10); }
  function sign(v) { return v < 0 ? -1 : 1; }

  /* ---- easing ------------------------------------------------ */
  var ease = {
    linear: function (t) { return t; },

    inQuad: function (t) { return t * t; },
    outQuad: function (t) { return 1 - (1 - t) * (1 - t); },
    inOutQuad: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },

    inCubic: function (t) { return t * t * t; },
    outCubic: function (t) { return 1 - Math.pow(1 - t, 3); },
    inOutCubic: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },

    inQuart: function (t) { return t * t * t * t; },
    outQuart: function (t) { return 1 - Math.pow(1 - t, 4); },
    inOutQuart: function (t) { return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; },

    inQuint: function (t) { return t * t * t * t * t; },
    outQuint: function (t) { return 1 - Math.pow(1 - t, 5); },
    inOutQuint: function (t) { return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2; },

    inExpo: function (t) { return t <= 0 ? 0 : Math.pow(2, 10 * t - 10); },
    outExpo: function (t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); },
    inOutExpo: function (t) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
    },

    inCirc: function (t) { return 1 - Math.sqrt(1 - t * t); },
    outCirc: function (t) { return Math.sqrt(1 - Math.pow(t - 1, 2)); },
    inOutCirc: function (t) {
      return t < 0.5
        ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
        : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
    },

    inBack: function (t) { var c = 1.70158; return t * t * ((c + 1) * t - c); },
    outBack: function (t) { var c = 1.70158; return 1 + (--t) * t * ((c + 1) * t + c); },
    inOutBack: function (t) {
      var c = 1.70158 * 1.525;
      return t < 0.5
        ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2
        : (Math.pow(2 * t - 2, 2) * ((c + 1) * (t * 2 - 2) + c) + 2) / 2;
    },

    outElastic: function (t) {
      var c = (2 * PI) / 3;
      return t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c) + 1;
    },

    outBounce: function (t) {
      var n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) { t -= 1.5 / d; return n * t * t + 0.75; }
      if (t < 2.5 / d) { t -= 2.25 / d; return n * t * t + 0.9375; }
      t -= 2.625 / d; return n * t * t + 0.984375;
    },

    /* soft settle — my house curve: fast out, tiny overshoot, dead stop */
    outSettle: function (t) {
      var c = 1.12;
      var e = 1 - Math.pow(1 - t, 4);
      return e + Math.sin(t * PI) * c * Math.pow(1 - t, 3) * 0.35;
    },

    /* anticipation dip then launch */
    anticipate: function (t) {
      if (t < 0.35) { var a = t / 0.35; return -0.18 * Math.sin(a * PI * 0.5); }
      var b = (t - 0.35) / 0.65;
      return lerp(-0.18, 1, ease.outExpo(b));
    }
  };

  /* cubic-bezier solver: returns f(x) -> y, used by the EASING chapter */
  function cubicBezier(x1, y1, x2, y2) {
    function A(a1, a2) { return 1 - 3 * a2 + 3 * a1; }
    function B(a1, a2) { return 3 * a2 - 6 * a1; }
    function C(a1) { return 3 * a1; }
    function calc(t, a, b) { return ((A(a, b) * t + B(a, b)) * t + C(a)) * t; }
    function slope(t, a, b) { return 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a); }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 6; i++) {
        var s = slope(t, x1, x2);
        if (s === 0) break;
        t -= (calc(t, x1, x2) - x) / s;
      }
      return calc(t, y1, y2);
    };
  }

  var CURVES = {
    'linear': cubicBezier(0, 0, 1, 1),
    'ease': cubicBezier(0.25, 0.1, 0.25, 1),
    'in-out': cubicBezier(0.65, 0, 0.35, 1),
    'out-expo': cubicBezier(0.16, 1, 0.3, 1),
    'in-expo': cubicBezier(0.7, 0, 0.84, 0),
    'out-back': cubicBezier(0.34, 1.56, 0.64, 1),
    'anticipate': cubicBezier(0.36, -0.28, 0.64, 1),
    'out-soft': cubicBezier(0.22, 1, 0.36, 1)
  };

  /* ---- deterministic RNG ------------------------------------- */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* stateless hash → [0,1), for per-particle constants */
  function hash1(n) {
    var s = Math.sin(n * 127.1) * 43758.5453123;
    return s - Math.floor(s);
  }
  function hash2(a, b) {
    var s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
    return s - Math.floor(s);
  }
  /* cheap value noise, 1D, smooth */
  function noise1(x) {
    var i = Math.floor(x), f = x - i;
    var u = f * f * (3 - 2 * f);
    return lerp(hash1(i), hash1(i + 1), u) * 2 - 1;
  }
  function fbm1(x) {
    return noise1(x) * 0.5 + noise1(x * 2.03 + 11.3) * 0.25 + noise1(x * 4.11 + 41.7) * 0.125;
  }

  /* ---- color ------------------------------------------------- */
  var colorCache = Object.create(null);
  function hexToRgb(hex) {
    if (colorCache[hex]) return colorCache[hex];
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    var c = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    colorCache[hex] = c;
    return c;
  }
  function rgba(hex, a) {
    var c = hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  }
  function mix(a, b, t) {
    var A = hexToRgb(a), B = hexToRgb(b);
    t = clamp01(t);
    return 'rgb(' + Math.round(lerp(A.r, B.r, t)) + ',' + Math.round(lerp(A.g, B.g, t)) + ',' +
      Math.round(lerp(A.b, B.b, t)) + ')';
  }
  function mixHex(a, b, t) {
    var A = hexToRgb(a), B = hexToRgb(b);
    t = clamp01(t);
    var h = function (v) { var s = Math.round(v).toString(16); return s.length < 2 ? '0' + s : s; };
    return '#' + h(lerp(A.r, B.r, t)) + h(lerp(A.g, B.g, t)) + h(lerp(A.b, B.b, t));
  }
  function hsl(h, s, l, a) {
    return 'hsla(' + (((h % 360) + 360) % 360) + ',' + s + '%,' + l + '%,' + (a === undefined ? 1 : a) + ')';
  }
  function hueShift(hex, deg, sMul, lMul) {
    var c = hexToRgb(hex);
    var r = c.r / 255, g = c.g / 255, b = c.b / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    var d = max - min;
    if (d !== 0) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return hsl(h + deg, clamp(s * (sMul || 1) * 100, 0, 100), clamp(l * (lMul || 1) * 100, 0, 100));
  }

  /* ---- geometry / misc --------------------------------------- */
  function polar(angle, radius) {
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  }
  function dist(x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function wrap(v, m) { return ((v % m) + m) % m; }
  function snap(v, step) { return Math.round(v / step) * step; }

  /* pulse window: 1 at `at`, falling off over `len` */
  function pulse(t, at, len) {
    var d = Math.abs(t - at);
    return 1 - clamp01(d / len);
  }
  /* 0 before [a,b], ramp in, hold, ramp out to c */
  function seg(t, a, b, c, d, easing) {
    var e = easing || ease.inOutCubic;
    if (t <= a || t >= d) return 0;
    if (t < b) return e(clamp01(invLerp(a, b, t)));
    if (t <= c) return 1;
    return 1 - e(clamp01(invLerp(c, d, t)));
  }

  REEL.M = {
    TAU: TAU, PI: PI,
    clamp: clamp, clamp01: clamp01, lerp: lerp, invLerp: invLerp, mapRange: mapRange,
    smoothstep: smoothstep, smootherstep: smootherstep, sign: sign,
    ease: ease, cubicBezier: cubicBezier, CURVES: CURVES,
    mulberry32: mulberry32, hash1: hash1, hash2: hash2, noise1: noise1, fbm1: fbm1,
    hexToRgb: hexToRgb, rgba: rgba, mix: mix, mixHex: mixHex, hsl: hsl, hueShift: hueShift,
    polar: polar, dist: dist, wrap: wrap, snap: snap, pulse: pulse, seg: seg
  };
})(window);
