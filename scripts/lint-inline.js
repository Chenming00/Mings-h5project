// Lints the inline <script> blocks of the standalone projects.
//
// Every project under public/projects/ is a single self-contained HTML file, so
// `eslint .` never sees a byte of their JavaScript — which is exactly where the
// timer, keyboard and DOM-wiring bugs hide. This script extracts each inline
// block and feeds it to the same flat config through ESLint's Node API.
//
// The virtual filename ends in `.js` and lives next to the page, so the shared
// `**/*.{js,jsx}` block in eslint.config.js (browser globals, js recommended,
// react-hooks) applies without any special-casing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectsDir = path.join(root, 'public', 'projects');

const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const JS_TYPES = /^(?:module|text\/javascript|application\/javascript)$/i;

function extractBlocks() {
  const blocks = [];

  for (const entry of fs.readdirSync(projectsDir).sort()) {
    const page = path.join(projectsDir, entry, 'index.html');
    if (!fs.existsSync(page)) continue;

    const html = fs.readFileSync(page, 'utf-8');
    let match;
    let index = 0;
    SCRIPT_TAG.lastIndex = 0;

    while ((match = SCRIPT_TAG.exec(html))) {
      const [, attrs, code] = match;
      // External scripts are linted as files already (motion-reel/js/*.js).
      if (/\bsrc\s*=/i.test(attrs)) continue;
      const type = /\btype\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1];
      if (type && !JS_TYPES.test(type)) continue;
      if (!code.trim()) continue;

      index += 1;
      // Pad with the lines that precede the block so ESLint's line numbers are
      // the real line numbers in the HTML file — no mental arithmetic needed
      // when the report points at a problem.
      const bodyStart = match.index + match[0].indexOf('>') + 1;
      const lineOffset = (html.slice(0, bodyStart).match(/\n/g) || []).length;
      blocks.push({
        code: '\n'.repeat(lineOffset) + code,
        filePath: path.join(projectsDir, entry, `index.inline-${index}.js`),
      });
    }
  }

  return blocks;
}

const blocks = extractBlocks();
if (!blocks.length) {
  console.log('No inline scripts found.');
  process.exit(0);
}

const eslint = new ESLint({ cwd: root });
const formatter = await eslint.loadFormatter('stylish');

let errorCount = 0;
let warningCount = 0;
const results = [];

for (const block of blocks) {
  const [result] = await eslint.lintText(block.code, {
    filePath: block.filePath,
    warnIgnored: false,
  });
  errorCount += result.errorCount;
  warningCount += result.warningCount;
  results.push(result);
}

// Dropping the virtual filename keeps the report readable: every block is
// reported under the page it belongs to, with HTML line numbers (see the
// padding above).
const printable = results.map((result) => ({
  ...result,
  filePath: result.filePath.replace(/index\.inline-\d+\.js$/, 'index.html'),
}));

const output = await formatter.format(printable);
if (output) process.stdout.write(output);

console.log(
  `\nInline script lint: ${blocks.length} block(s), ${errorCount} error(s), ${warningCount} warning(s).`
);

process.exit(errorCount > 0 ? 1 : 0);
