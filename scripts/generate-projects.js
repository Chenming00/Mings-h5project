import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Descriptions/titles live beside the app so the UI keeps one source of truth;
// the build script reuses them for sitemap.xml and the #root SEO fallback.
import { presentations } from '../src/data/projectPresentation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const projectsDir = path.join(rootDir, 'public', 'projects');
const outputFile = path.join(rootDir, 'public', 'projects.json');
const sitemapFile = path.join(rootDir, 'public', 'sitemap.xml');
const indexFile = path.join(rootDir, 'index.html');
const siteUrl = 'https://h5.ming.fi';

// Fallback region markers in index.html: everything between them is owned by
// this script and rewritten on every predev/prebuild run. Both markers carry
// a trailing human note inside the comment, hence the loose middle.
const FALLBACK_START = /<!--\s*seo-fallback:start[\s\S]*?-->/;
const FALLBACK_END = /<!--\s*seo-fallback:end[\s\S]*?-->/;

const ENTRY_FILES = ['index.html', 'index.htm'];
// Order matters when several covers exist: WebP is served by preference.
const COVER_FILES = ['cover.webp', 'cover.avif', 'cover.png', 'cover.jpg', 'cover.jpeg'];
const DEFAULT_TAGS = ['project'];

function readAttribute(tag, attribute) {
  const match = tag.match(new RegExp(`\\b${attribute}=["']([^"']*)["']`, 'i'));
  return match ? match[1].trim() : '';
}

function readMeta(html, name) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (readAttribute(tag, 'name').toLowerCase() === name.toLowerCase()) {
      return readAttribute(tag, 'content');
    }
  }
  return '';
}

// README documents `<html data-tags="animation,game">`; a <meta> form is accepted too.
function readTags(html) {
  const rootTag = (html.match(/<html\b[^>]*>/i) || [''])[0];
  const raw = readAttribute(rootTag, 'data-tags') || readMeta(html, 'project-tags');
  return raw.split(',').map(tag => tag.trim()).filter(Boolean);
}

function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function findEntry(files) {
  for (const candidate of ENTRY_FILES) {
    if (files.includes(candidate)) return candidate;
  }
  return files.find(file => /\.html?$/i.test(file)) || null;
}

function findCover(files, override) {
  const candidates = override ? [override, ...COVER_FILES] : COVER_FILES;
  return candidates.find(candidate => files.includes(candidate)) || null;
}

function readProjectMeta(itemPath) {
  const metaFile = path.join(itemPath, 'project.json');
  if (!fs.existsSync(metaFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
  } catch (error) {
    console.warn(`Ignoring invalid project.json in ${path.relative(rootDir, metaFile)}: ${error.message}`);
    return {};
  }
}

function warnMissingRedirectTargets() {
  const redirectsFile = path.join(rootDir, 'public', '_redirects');
  if (!fs.existsSync(redirectsFile)) return;

  const lines = fs.readFileSync(redirectsFile, 'utf-8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const rule = line.trim();
    if (!rule || rule.startsWith('#')) return;

    const target = rule.split(/\s+/)[1] || '';
    const slug = target.match(/^\/projects\/([^/?#]+)/)?.[1];
    // Only the literal project directory matters: /projects/foo/:splat is
    // checkable, while /projects/:slug/ (or /projects/:splat) is dynamic.
    if (!slug || /[:*]/.test(slug)) return;

    if (!fs.statSync(path.join(projectsDir, slug), { throwIfNoEntry: false })?.isDirectory()) {
      console.warn(
        `public/_redirects:${index + 1}: target "${target}" points to missing project directory "${slug}".`
      );
    }
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// `presentations` falls back the same way enrichProject() does in the app:
// unregistered slugs get the default display title / tagline instead of
// disappearing.
function presentationFor(slug, name) {
  const presentation = presentations[slug] || {};
  return {
    displayTitle: presentation.displayTitle || name,
    description: presentation.description || '一个关于代码与灵感的小小实验。',
  };
}

function generateSitemap(sitemapEntries) {
  const urls = [
    { loc: `${siteUrl}/` },
    ...sitemapEntries,
  ];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(entry => [
      '  <url>',
      `    <loc>${escapeHtml(entry.loc)}</loc>`,
      '  </url>',
    ].join('\n')),
    '</urlset>',
  ].join('\n');
  fs.writeFileSync(sitemapFile, `${xml}\n`);
  console.log(`Successfully generated sitemap.xml with ${urls.length} URLs.`);
}

// Baidu ("百度") crawlers barely render JavaScript while Googlebot does, so
// index.html ships the real project list as DOM inside #root. React wipes it
// the moment the app mounts; crawlers that read the raw HTML (Baidu, Sogou,
// 360) still index every work without executing a single script. Kept as a
// script-owned block so adding a project never requires editing index.html.
function updateSeoFallback(projects) {
  const html = fs.readFileSync(indexFile, 'utf-8');
  if (!FALLBACK_START.test(html) || !FALLBACK_END.test(html)) {
    console.warn(`index.html is missing the seo-fallback markers; skipping SEO fallback update.`);
    return;
  }

  const items = projects
    .map(project => {
      const { displayTitle, description } = presentationFor(project.slug, project.name);
      return `        <li><a href="${siteUrl}${project.path}">${escapeHtml(displayTitle)}</a> — ${escapeHtml(description)}</li>`;
    })
    .join('\n');

  const block = [
    `<section class="seo-fallback">`,
    `  <style>:where(.seo-fallback){max-width:40rem;margin:0 auto;padding:48px 24px;line-height:1.8}:where(.seo-fallback ul){margin:0 0 24px;padding:0;list-style:none}:where(.seo-fallback li){margin:0 0 12px}</style>`,
    `  <h1>奇点空间 · Singularity Space — H5 创意项目展厅</h1>`,
    `  <p>把好奇心写成代码，把灵感变成作品。收录 Ming 的数据可视化、创意交互、动态设计与实用工具，共 ${projects.length} 个作品。</p>`,
    `  <ul>`,
    items,
    `  </ul>`,
    `  <p>在 <a href="${siteUrl}/">奇点空间</a> 主页可搜索、分类筛选并直接预览全部作品。</p>`,
    `</section>`,
  ].join('\n');

  const updated = html
    .replace(
      new RegExp(`(${FALLBACK_START.source})[\\s\\S]*(${FALLBACK_END.source})`),
      `$1\n    ${block.replace(/\n/g, '\n    ')}\n    $2`
    );
  fs.writeFileSync(indexFile, updated);
  console.log(`Successfully refreshed the SEO fallback in index.html (${projects.length} links).`);
}

function generateProjectsData() {
  warnMissingRedirectTargets();
  const projects = [];
  // Kept separate so projects.json (the app's contract) stays untouched; the
  // Sitemap entries use the same public paths as the project manifest.
  const sitemapEntries = [];

  if (!fs.existsSync(projectsDir)) {
    console.warn('Projects directory does not exist or is empty.');
    fs.writeFileSync(outputFile, JSON.stringify([], null, 2));
    generateSitemap(sitemapEntries);
    updateSeoFallback(projects);
    return;
  }

  const untagged = [];

  for (const dir of fs.readdirSync(projectsDir).sort()) {
    const itemPath = path.join(projectsDir, dir);
    if (!fs.statSync(itemPath).isDirectory()) continue;

    const dirFiles = fs.readdirSync(itemPath);
    const entryFile = findEntry(dirFiles);
    if (!entryFile) continue;

    const html = fs.readFileSync(path.join(itemPath, entryFile), 'utf-8');
    const meta = readProjectMeta(itemPath);

    // Directory name is the canonical slug; project.json may override it.
    // An override needs a matching rule in public/_redirects, because the
    // directory keeps its original name on disk.
    const slug = toSlug(meta.slug) || toSlug(readMeta(html, 'project-slug')) || toSlug(dir);
    if (!slug) {
      console.warn(`Skipping ${dir}: cannot derive a URL-safe slug.`);
      continue;
    }
    if (slug !== dir) {
      console.warn(
        `Slug "${slug}" differs from directory "${dir}" — add a rewrite to public/_redirects so /projects/${slug}/ resolves.`
      );
    }

    const title = (html.match(/<title>(.*?)<\/title>/i) || [])[1];
    const name = String(meta.title || (title || '').trim() || dir).trim();

    const declaredTags = Array.isArray(meta.tags) && meta.tags.length ? meta.tags : readTags(html);
    const tags = [...new Set(declaredTags.map(tag => String(tag).trim()).filter(Boolean))];
    if (!tags.length) untagged.push(dir);

    // A directory URL lets the host resolve its index file; anything else needs the filename.
    const entryPath = ENTRY_FILES.includes(entryFile) ? `/projects/${slug}/` : `/projects/${slug}/${entryFile}`;

    const cover = findCover(dirFiles, meta.cover);

    sitemapEntries.push({ loc: `${siteUrl}${entryPath}` });

    projects.push({
      name,
      slug,
      path: entryPath,
      tags: tags.length ? tags : DEFAULT_TAGS,
      ...(cover && { thumbnail: `/projects/${dir}/${cover}` }),
      ...(Number.isFinite(meta.order) && { order: meta.order }),
    });
  }

  projects.sort((a, b) => {
    const aOrder = Number.isFinite(a.order) ? a.order : Number.POSITIVE_INFINITY;
    const bOrder = Number.isFinite(b.order) ? b.order : Number.POSITIVE_INFINITY;
    return aOrder - bOrder || a.slug.localeCompare(b.slug);
  });

  fs.writeFileSync(outputFile, `${JSON.stringify(projects, null, 2)}\n`);
  console.log(`Successfully generated projects.json with ${projects.length} projects.`);

  // Tags drive both the sidebar categories and the card labels. A project
  // without them is reachable only through "全部作品", which is almost never
  // what the author intended — say so at build time instead of silently
  // shipping an uncategorised card.
  if (untagged.length) {
    console.warn(
      `\n⚠ ${untagged.length} project(s) declare no tags and will not appear under any category:\n` +
        untagged.map(dir => `   · ${dir}`).join('\n') +
        '\n  Add `<html data-tags="data,map">` to each entry file, or a "tags" array in project.json.\n'
    );
  }

  generateSitemap(sitemapEntries);
  updateSeoFallback(projects);
}

generateProjectsData();
