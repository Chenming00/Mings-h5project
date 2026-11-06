import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Runs as the `postbuild` lifecycle on dist/, AFTER Vite has copied public/.
// Sub-project pages are hand-maintained single files and stay untouched in the
// repo; this step enriches only the deployed copies with the SEO plumbing a
// standalone `<head>` normally has: canonical, Open Graph, Twitter card and
// JSON-LD. Idempotent, so re-running on an already-enriched dist is safe.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distProjectsDir = path.join(rootDir, 'dist', 'projects');
const publicProjectsDir = path.join(rootDir, 'public', 'projects');

const siteUrl = 'https://h5.ming.fi';
const siteName = '奇点空间 Singularity Space';

const ENTRY_FILES = ['index.html', 'index.htm'];
// Social scrapers are unreliable with WebP in og:image; only raster formats
// become a per-project image, everything else falls back to the site cover.
const SHARED_COVER_FILES = ['cover.jpg', 'cover.jpeg', 'cover.png'];
const SITE_OG_IMAGE = `${siteUrl}/og-cover.jpg`;

function escapeHtmlAttr(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Content attributes from the source file are already HTML-escaped; undo the
// common entities before re-using the value inside JSON-LD (which receives it
// back escaped as a whole via JSON.stringify).
function unescapeEntities(text) {
  return String(text)
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');
}

// Adds JSON-LD then escapes any `<` through the whole payload so a stray
// `</script>` in a title cannot terminate the block early.
function stringifyJsonLd(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function readMeta(html, name) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const match = tag.match(new RegExp(`\\bname=["']${name}["']\\s+content=["']([^"']*)["']`, 'i'));
    if (match) return match[1].trim();
  }
  return '';
}

function extractTitle(html) {
  return (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]?.trim() ?? '';
}

// The public URL slug can legally differ from the dist directory name through
// a project.json override plus a _redirects rewrite, so read the same source
// the app's scanner does. Everything needed lives in public/, which always
// exists — this script must not depend on repo files remaining in dist/.
function readPublicSlug(dir) {
  const metaFile = path.join(publicProjectsDir, dir, 'project.json');
  try {
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
    if (meta.slug) return String(meta.slug).trim().toLowerCase();
  } catch {
    /* no project.json → the directory name is the slug */
  }
  const htmlPath = path.join(publicProjectsDir, dir, 'index.html');
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const match = html.match(/<meta\s+name=["']project-slug["']\s+content=["']([^"']*)["']/i);
    if (match?.[1]) return match[1].trim().toLowerCase();
  }
  return dir;
}

function findSharedCover(dir) {
  const files = fs.readdirSync(path.join(distProjectsDir, dir));
  const cover = SHARED_COVER_FILES.find(file => files.includes(file));
  return cover ? `${siteUrl}/projects/${dir}/${cover}` : SITE_OG_IMAGE;
}

function buildHeadTags({ slug, title, description, ogImage }) {
  const canonical = `${siteUrl}/projects/${slug}/`;
  const jsonLd = stringifyJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: unescapeEntities(title),
    url: canonical,
    description: unescapeEntities(description),
    inLanguage: 'zh-CN',
    isPartOf: { '@type': 'WebSite', name: siteName, url: `${siteUrl}/` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '奇点空间', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: unescapeEntities(title), item: canonical },
      ],
    },
  });

  return [
    `<link rel="canonical" href="${canonical}" />`,
    `<meta name="applicable-device" content="pc,mobile" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtmlAttr(siteName)}" />`,
    `<meta property="og:locale" content="zh_CN" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join('\n  ');
}

function enhanceProjectPage(dir, entryFile) {
  const filePath = path.join(distProjectsDir, dir, entryFile);
  const html = fs.readFileSync(filePath, 'utf-8');

  if (/<link\s+rel=["']canonical["']/i.test(html)) {
    return 'skipped (already has canonical)';
  }

  const title = extractTitle(html);
  if (!title) {
    console.warn(`  ⚠ ${dir}: no <title> found, tagging skipped.`);
    return 'skipped (no title)';
  }
  const description =
    readMeta(html, 'description') || `奇点空间作品：${unescapeEntities(title)}。`;

  const headTags = buildHeadTags({
    slug: readPublicSlug(dir),
    title,
    description,
    ogImage: findSharedCover(dir),
  });

  const headOpenTag = html.match(/<head\b[^>]*>/i)?.[0];
  if (!headOpenTag) {
    console.warn(`  ⚠ ${dir}: no <head> element, tagging skipped.`);
    return 'skipped (no head)';
  }

  fs.writeFileSync(filePath, html.replace(headOpenTag, `${headOpenTag}\n  ${headTags}`));
  return 'enhanced';
}

function main() {
  if (!fs.existsSync(distProjectsDir)) {
    console.warn('No dist/projects directory — run `npm run build` first.');
    process.exitCode = 1;
    return;
  }

  const counts = { enhanced: 0, skipped: 0 };
  for (const dir of fs.readdirSync(distProjectsDir).sort()) {
    const itemPath = path.join(distProjectsDir, dir);
    if (!fs.statSync(itemPath).isDirectory()) continue;

    const files = fs.readdirSync(itemPath);
    const entryFile = ENTRY_FILES.find(file => files.includes(file));
    if (!entryFile) continue;

    const result = enhanceProjectPage(dir, entryFile);
    if (result.startsWith('skipped')) counts.skipped += 1;
    else counts.enhanced += 1;
    console.log(`  · ${dir}: ${result}`);
  }

  console.log(`\nSEO pass done — ${counts.enhanced} enhanced, ${counts.skipped} skipped.`);
}

main();
