/* Generates cover.png (1280x720 key art) for the aggregator card.
   Self-contained PNG encoder — no image deps, just node:zlib.
   Run: node scripts/make-cover.cjs                                            */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const W = 960, H = 540;

/* ---------- minimal PNG writer ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;                    /* filter type 0 */
    rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------- artwork ---------- */
const buf = Buffer.alloc(W * H * 3);
const put = (x, y, r, g, b) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = Math.max(0, Math.min(255, r));
  buf[i + 1] = Math.max(0, Math.min(255, g));
  buf[i + 2] = Math.max(0, Math.min(255, b));
};

/* palette */
const CY = [77, 227, 255], MG = [255, 77, 141];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const cx = W / 2, cy = H / 2;
const cxm = W * 0.62, cym = H * 0.42;   /* mark centre */

let seed = 20260929;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

/* 1. background: deep base + two accent glows + vignette */
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const dx = (x - cx) / W, dy = (y - cy) / H;
    let r = 5, g = 6, b = 11;

    /* cyan bloom */
    let d1 = Math.hypot(x - cxm * 0.72, y - cym * 0.8) / (W * 0.52);
    let k = Math.max(0, 1 - d1); k = k * k * k;
    r += CY[0] * k * 0.22; g += CY[1] * k * 0.22; b += CY[2] * k * 0.22;

    /* magenta bloom */
    let d2 = Math.hypot(x - W * 0.86, y - H * 0.86) / (W * 0.6);
    let k2 = Math.max(0, 1 - d2); k2 = k2 * k2 * k2;
    r += MG[0] * k2 * 0.17; g += MG[1] * k2 * 0.17; b += MG[2] * k2 * 0.17;

    /* vignette */
    const v = 1 - Math.min(1, Math.pow(Math.hypot(dx, dy) * 1.25, 2)) * 0.85;
    put(x, y, r * v, g * v, b * v);
  }
}

/* 2. perspective grid on the lower third */
for (let i = 0; i <= 26; i++) {
  const p = i / 26;
  const xTop = cx + (p - 0.5) * W * 0.24;
  const xBot = cx + (p - 0.5) * W * 2.7;
  for (let y = Math.floor(H * 0.56); y < H; y++) {
    const q = (y - H * 0.56) / (H * 0.44);
    const x = xTop + (xBot - xTop) * Math.pow(q, 0.55);
    const a = Math.pow(q, 1.6) * 0.5;
    const xi = Math.round(x);
    if (xi >= 0 && xi < W) {
      const o = (y * W + xi) * 3;
      buf[o] += CY[0] * a; buf[o + 1] += CY[1] * a; buf[o + 2] += CY[2] * a;
    }
  }
}
for (let r = 0; r < 12; r++) {
  const q = r / 12;
  const y = Math.round(H * 0.56 + Math.pow(q, 2.1) * H * 0.46);
  const a = Math.pow(q, 2) * 0.42;
  for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 3;
    buf[o] += CY[0] * a; buf[o + 1] += CY[1] * a; buf[o + 2] += CY[2] * a;
  }
}

/* 3. converging particle streaks (the ignition beat) */
for (let i = 0; i < 620; i++) {
  const a = rnd() * Math.PI * 2;
  const t = 0.18 + rnd() * 0.82;
  const rOut = Math.max(W, H) * 0.62;
  const x = cxm + Math.cos(a) * rOut * t;
  const y = cym + Math.sin(a) * rOut * t * 0.82;
  const len = 6 + rnd() * 26;
  const inten = (1 - t) * 0.85;
  const c = rnd() > 0.82 ? MG : CY;
  for (let s = 0; s < len; s++) {
    const px = x - Math.cos(a) * s, py = y - Math.sin(a) * s * 0.82;
    const f = inten * (1 - s / len);
    const xi = Math.round(px), yi = Math.round(py);
    if (xi < 0 || yi < 0 || xi >= W || yi >= H) continue;
    const o = (yi * W + xi) * 3;
    buf[o] += c[0] * f; buf[o + 1] += c[1] * f; buf[o + 2] += c[2] * f;
  }
}

/* 4. the mark: two arcs + play triangle */
const R = 96;
for (let a = 0; a < Math.PI * 1.55; a += 0.0015) {
  for (let rr = R - 3; rr <= R + 3; rr++) {
    const x = Math.round(cxm + Math.cos(a) * rr), y = Math.round(cym + Math.sin(a) * rr);
    const f = 1 - Math.abs(rr - R) / 5;
    const o = (y * W + x) * 3;
    buf[o] += CY[0] * f * 0.95; buf[o + 1] += CY[1] * f * 0.95; buf[o + 2] += CY[2] * f * 0.95;
  }
}
for (let a = Math.PI; a < Math.PI * 2.55; a += 0.0015) {
  for (let rr = R - 3; rr <= R + 3; rr++) {
    const x = Math.round(cxm + Math.cos(a) * rr), y = Math.round(cym + Math.sin(a) * rr);
    const f = 1 - Math.abs(rr - R) / 5;
    const o = (y * W + x) * 3;
    buf[o] += MG[0] * f * 0.95; buf[o + 1] += MG[1] * f * 0.95; buf[o + 2] += MG[2] * f * 0.95;
  }
}
/* triangle, filled with a cyan->magenta gradient + soft edge */
function tri(ax, ay, bx, by, cx2, cy2) {
  const minX = Math.floor(Math.min(ax, bx, cx2)), maxX = Math.ceil(Math.max(ax, bx, cx2));
  const minY = Math.floor(Math.min(ay, by, cy2)), maxY = Math.ceil(Math.max(ay, by, cy2));
  const sign = (px, py, x1, y1, x2, y2) => (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const d1 = sign(x, y, ax, ay, bx, by);
      const d2 = sign(x, y, bx, by, cx2, cy2);
      const d3 = sign(x, y, cx2, cy2, ax, ay);
      const neg = d1 < 0 || d2 < 0 || d3 < 0;
      const pos = d1 > 0 || d2 > 0 || d3 > 0;
      if (neg && pos) continue;
      const t = (x - minX) / (maxX - minX);
      const c = mixc(CY, MG, t);
      const o = (y * W + x) * 3;
      buf[o] = buf[o] * 0.25 + c[0] * 0.9;
      buf[o + 1] = buf[o + 1] * 0.25 + c[1] * 0.9;
      buf[o + 2] = buf[o + 2] * 0.25 + c[2] * 0.9;
    }
  }
}
const tr = R * 0.46;
tri(cxm - tr * 0.5, cym - tr * 0.86, cxm + tr * 0.92, cym, cxm - tr * 0.5, cym + tr * 0.86);

/* 5. chromatic ghosting on the arcs (offset copies) */
for (let a = 0; a < Math.PI * 1.55; a += 0.002) {
  const x = Math.round(cxm + Math.cos(a) * R - 5), y = Math.round(cym + Math.sin(a) * R);
  if (x < 0 || y < 0 || x >= W || y >= H) continue;
  const o = (y * W + x) * 3;
  buf[o] += MG[0] * 0.28; buf[o + 1] += 40; buf[o + 2] += 60;
}

/* 6. frame corners + grain */
const inset = 34, cl = 40;
const corner = (px, py, sx, sy) => {
  for (let i = 0; i < cl; i++) {
    for (let w = 0; w < 2; w++) {
      const x = Math.round(px + sx * i), y = Math.round(py + (w ? -sy * i : 0));
      if (x >= 0 && y >= 0 && x < W && y < H) put(x, y, 150, 160, 200);
      const x2 = Math.round(px + (w ? sx * i : 0)), y2 = Math.round(py + sy * i);
      if (x2 >= 0 && y2 >= 0 && x2 < W && y2 < H) put(x2, y2, 150, 160, 200);
    }
  }
};
corner(inset, inset, 1, 1); corner(W - inset, inset, -1, 1);
corner(inset, H - inset, 1, -1); corner(W - inset, H - inset, -1, -1);

for (let i = 0; i < buf.length; i += 3) {
  const n = (rnd() - 0.5) * 7;
  buf[i] += n; buf[i + 1] += n; buf[i + 2] += n;
}

/* final vignette pass */
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const dx = (x - cx) / (W / 2), dy = (y - cy) / (H / 2);
    const v = 1 - Math.min(0.55, (dx * dx + dy * dy) * 0.34);
    const o = (y * W + x) * 3;
    buf[o] *= v; buf[o + 1] *= v; buf[o + 2] *= v;
  }
}

// Emits the source PNG. The site serves cover.webp, so after regenerating run
// `python3 tools/optimize-images.py --replace` to re-encode it.
const out = path.join(__dirname, '../../public/projects/motion-reel/cover.png');
fs.writeFileSync(out, encodePNG(W, H, buf));
console.log('wrote ' + out + ' (' + W + 'x' + H + ', ' + (fs.statSync(out).size / 1024).toFixed(1) + ' KB)');
