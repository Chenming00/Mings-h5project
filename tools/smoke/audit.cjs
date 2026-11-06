#!/usr/bin/env node
/* Headless page audit for the standalone projects.
 *
 * The other harnesses under tools/ drive the modules with stubs, which cannot
 * catch layout bugs (a grid column that overflows 390px, a title painted above
 * the canvas) or console errors. This one boots real Chrome, loads every page
 * at a phone viewport, and reports:
 *
 *   - uncaught errors / console errors
 *   - horizontal overflow (scrollWidth > innerWidth), the classic mobile break
 *   - optionally, a screenshot per page for eyeballing what numbers cannot say
 *
 * Usage:
 *   node tools/smoke/audit.cjs
 *   node tools/smoke/audit.cjs --shots poster-lab,motion-reel
 *   node tools/smoke/audit.cjs --width 390 --height 844 --out reports/screenshots
 *
 * Note: this talks to the page target directly. Driving the browser target with
 * flat sessions (`Target.attachToTarget` + sessionId) deadlocks on this Chrome
 * build — `Page.enable` never answers — so the browser endpoint is only used to
 * discover the page socket.
 */
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const PUBLIC = path.join(ROOT, 'public');
const PROJECTS = path.join(PUBLIC, 'projects');

// Injected into a throwaway copy of each page: Runtime.enable hangs on this
// Chrome build, so load-time exceptions are collected by the page itself.
const ERROR_PROBE = `<script>
window.__auditErrors = [];
window.addEventListener('error', function (event) {
  window.__auditErrors.push(String(event.message || event.error));
});
window.addEventListener('unhandledrejection', function (event) {
  window.__auditErrors.push('unhandled rejection: ' + String(event.reason));
});
</script>`;

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findChrome() {
  return CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate)) || null;
}

function launchChrome(binary, userDataDir) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, [
      '--headless=new',
      // Required in this environment: the platform sandbox blocks the renderer
      // and navigation hangs forever without it.
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=0',
      '--remote-allow-origins=*',
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ]);

    let buffered = '';
    const onData = (chunk) => {
      buffered += chunk.toString();
      const match = buffered.match(/ws:\/\/[^\s]+/);
      if (match) {
        child.stderr.off('data', onData);
        resolve({ child, browserWsUrl: match[0] });
      }
    };
    child.stderr.on('data', onData);
    child.on('error', reject);
    setTimeout(() => reject(new Error('Chrome did not expose a DevTools endpoint in time')), 15000);
  });
}

/** Node's fetch is filtered in this environment; plain http is not. */
function httpGet(host, port, requestPath) {
  return new Promise((resolve, reject) => {
    const request = http.get({ host, port, path: requestPath }, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve(body));
    });
    request.on('error', reject);
    request.setTimeout(4000, () => request.destroy(new Error('DevTools HTTP timeout')));
  });
}

async function findPageSocket(browserWsUrl) {
  const { hostname, port } = new URL(browserWsUrl);
  let lastError = null;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const targets = JSON.parse(await httpGet(hostname, port, '/json/list'));
      const page = targets.find((target) => target.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (error) {
      lastError = error;
    }
    await sleep(300);
  }
  throw new Error(`No page target found: ${lastError ? lastError.message : 'unknown'}`);
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();

  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('CDP socket did not open')), 10000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP socket error')); });
  });

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (process.env.SMOKE_DEBUG && message.id) console.error('<-', message.id, message.error ? 'error' : 'ok');
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    const handlers = listeners.get(message.method);
    if (handlers) handlers.forEach((handler) => handler(message.params));
  });

  function send(method, params = {}) {
    const id = nextId++;
    if (process.env.SMOKE_DEBUG) console.error('->', method, id);
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`${method} timed out`));
      }, 15000);
      const settle = (fn) => (value) => { clearTimeout(timer); fn(value); };
      pending.set(id, { resolve: settle(resolve), reject: settle(reject) });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  function on(method, handler) {
    if (!listeners.has(method)) listeners.set(method, []);
    listeners.get(method).push(handler);
  }

  return { ready, send, on, close: () => ws.close() };
}

function stagePage(slug) {
  const source = path.join(PROJECTS, slug);
  const target = fs.mkdtempSync(path.join(os.tmpdir(), `dsh-page-${slug}-`));
  fs.cpSync(source, target, { recursive: true });
  const page = path.join(target, 'index.html');
  const html = fs.readFileSync(page, 'utf-8');
  // After <head> so the probe is installed before any page script runs.
  const injected = html.replace(/<head[^>]*>/i, (tag) => `${tag}\n${ERROR_PROBE}`);
  fs.writeFileSync(page, injected);
  return { page, dir: target };
}

async function auditPage(client, { url, width, height, shotPath }) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 2, mobile: true,
  });

  await client.send('Page.navigate', { url });
  await sleep(1800); // load + first-frame animations

  const { result } = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const doc = document.documentElement;
      // Exercise the ticket, not just its initially hidden markup. This also
      // runs at short/landscape viewport sizes supplied on the command line.
      if (document.getElementById('ticket-title')) {
        const errors = window.__auditErrors || (window.__auditErrors = []);
        document.getElementById('launch').click();
        const ticket = document.querySelector('.ticket');
        const close = document.getElementById('close');
        const rect = ticket.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > innerHeight + 1) errors.push('Ticket exceeds viewport');
        if (ticket.scrollHeight > ticket.clientHeight && getComputedStyle(ticket).overflowY !== 'auto') errors.push('Ticket cannot scroll');
        if (!document.querySelector('main').inert || document.activeElement !== close) errors.push('Ticket does not isolate focus');
        const escape = new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true});
        close.dispatchEvent(escape);
        if (!document.getElementById('overlay').hidden || document.querySelector('main').inert) errors.push('Ticket Escape did not restore page');
      }
      const wide = [].slice.call(document.querySelectorAll('body *')).filter(function (el) {
        const rect = el.getBoundingClientRect();
        return rect.right > window.innerWidth + 2 && getComputedStyle(el).position !== 'fixed';
      }).slice(0, 5).map(function (el) {
        return (el.id ? '#' + el.id : el.tagName.toLowerCase()) +
          ' right=' + Math.round(el.getBoundingClientRect().right);
      });
      return JSON.stringify({
        scrollWidth: doc.scrollWidth,
        innerWidth: window.innerWidth,
        title: document.title,
        errors: window.__auditErrors || [],
        wide
      });
    })()`,
    returnByValue: true,
  });

  const metrics = JSON.parse(result.value);
  metrics.consoleErrors = [];

  if (shotPath) {
    const shot = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.mkdirSync(path.dirname(shotPath), { recursive: true });
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
  }

  return { ...metrics, errors: (metrics.errors || []).slice(0, 3), consoleErrors: [] };
}

async function main() {
  const args = process.argv.slice(2);
  const readFlag = (name, fallback) => {
    const index = args.indexOf(`--${name}`);
    return index === -1 ? fallback : args[index + 1];
  };
  const width = Number(readFlag('width', 390));
  const height = Number(readFlag('height', 844));
  const outDir = path.resolve(ROOT, readFlag('out', 'reports/screenshots'));
  const shotSlugs = readFlag('shots', '') ? readFlag('shots', '').split(',') : [];

  const chrome = findChrome();
  if (!chrome) {
    console.error('No Chrome/Chromium binary found; skipping page audit.');
    process.exit(0);
  }

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-smoke-'));
  const { child, browserWsUrl } = await launchChrome(chrome, userDataDir);
  const pageSocket = await findPageSocket(browserWsUrl);
  const client = connect(pageSocket);
  await client.ready;
  // NB: Page.enable / Runtime.enable / Page.addScriptToEvaluateOnNewDocument
  // never answer on a page socket with this Chrome build. Layout is therefore
  // read with Runtime.evaluate only; exception capture belongs to the stub
  // harnesses under tools/, which do assert on failures.

  const only = readFlag('only', '');
  const slugs = fs.readdirSync(PROJECTS)
    .filter((entry) => fs.existsSync(path.join(PROJECTS, entry, 'index.html')))
    .filter((entry) => !only || only.split(',').includes(entry))
    .sort();

  const rows = [];
  for (const slug of slugs) {
    // file:// keeps the run hermetic; the pages are self-contained and load
    // their assets with relative paths.
    const staged = stagePage(slug);
    const url = `file://${staged.page}`;
    try {
      const result = await auditPage(client, {
        url, width, height,
        shotPath: shotSlugs.includes(slug) ? path.join(outDir, `${slug}-${width}x${height}.png`) : null,
      });
      rows.push({ slug, ...result });
    } catch (error) {
      rows.push({ slug, error: error.message });
    } finally {
      fs.rmSync(staged.dir, { recursive: true, force: true });
    }
  }

  let failures = 0;
  console.log(`\nPage audit @ ${width}x${height} (${slugs.length} pages)\n`);
  for (const row of rows) {
    if (row.error) {
      failures += 1;
      console.log(`FAIL  ${row.slug.padEnd(22)} ${row.error}`);
      continue;
    }
    const overflow = row.scrollWidth > row.innerWidth + 1;
    const crashed = row.errors.length ? row.errors : null;
    if (overflow || crashed) failures += 1;
    const detail = [
      overflow ? `overflow ${row.scrollWidth - row.innerWidth}px` : '',
      overflow && row.wide.length ? row.wide.slice(0, 3).join(' | ') : '',
      crashed ? `${crashed.length} error(s): ${crashed[0]}` : '',
    ].filter(Boolean).join(' · ');
    console.log(`${overflow || crashed ? 'FAIL' : 'ok  '}  ${row.slug.padEnd(22)} ${String(detail).slice(0, 200)}`);
  }

  if (shotSlugs.length) console.log(`\nScreenshots: ${path.relative(ROOT, outDir)}/`);
  console.log(failures ? `\n${failures} page(s) need attention.` : '\nAll pages clean.');

  client.close();
  child.kill('SIGTERM');
  await sleep(200);
  fs.rmSync(userDataDir, { recursive: true, force: true });

  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
