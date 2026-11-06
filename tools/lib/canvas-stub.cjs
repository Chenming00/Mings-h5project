/* Shared Canvas2D + canvas-element doubles for the headless harnesses.
 *
 * `check-reel` and `check-boot` used to carry byte-identical copies of these
 * two functions, so a fix in one silently drifted from the other. Anything that
 * the reel pipeline touches belongs here.
 */

function createContext() {
  const noop = () => {};
  const gradient = { addColorStop() {} };
  return {
    canvas: null,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '10px sans-serif',
    filter: 'none',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetY: 0,
    shadowOffsetX: 0,
    save: noop,
    restore: noop,
    translate: noop,
    rotate: noop,
    scale: noop,
    transform: noop,
    setTransform: noop,
    resetTransform: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    arcTo: noop,
    ellipse: noop,
    rect: noop,
    quadraticCurveTo: noop,
    bezierCurveTo: noop,
    fill: noop,
    stroke: noop,
    clip: noop,
    fillRect: noop,
    strokeRect: noop,
    clearRect: noop,
    fillText: noop,
    strokeText: noop,
    measureText: (text) => ({ width: String(text).length * 8 }),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    createPattern: () => ({ setTransform: noop }),
    putImageData: noop,
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(4 * w * h) }),
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(4 * w * h) }),
    drawImage: noop,
    setLineDash: noop,
  };
}

function createCanvas(width, height) {
  const canvas = {
    width: width || 300,
    height: height || 150,
    style: {},
    getContext: () => canvas._ctx,
    toBlob: (callback) => callback(Buffer.alloc(0)),
    // main.js asks the canvas for a MediaStream while exporting.
    captureStream: () => ({ getTracks: () => [] }),
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  canvas._ctx = createContext();
  return canvas;
}

module.exports = { createContext, createCanvas };
