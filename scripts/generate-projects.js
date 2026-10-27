import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const projectsDir = path.join(rootDir, 'public', 'projects');
const outputFile = path.join(rootDir, 'public', 'projects.json');

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

function generateProjectsData() {
  const projects = [];

  if (!fs.existsSync(projectsDir)) {
    console.warn('Projects directory does not exist or is empty.');
    fs.writeFileSync(outputFile, JSON.stringify([], null, 2));
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
}

generateProjectsData();
