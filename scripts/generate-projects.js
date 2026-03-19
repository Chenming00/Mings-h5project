import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const projectsDir = path.join(rootDir, 'public', 'projects');
const outputFile = path.join(rootDir, 'public', 'projects.json');

function generateProjectsData() {
  const projects = [];
  
  if (!fs.existsSync(projectsDir)) {
    console.warn('Projects directory does not exist or is empty.');
    fs.writeFileSync(outputFile, JSON.stringify([], null, 2));
    return;
  }

  const items = fs.readdirSync(projectsDir);

  for (const item of items) {
    const itemPath = path.join(projectsDir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      let name = item;
      let tags = ["project"];
      let entryFile = '';
      
      const dirFiles = fs.readdirSync(itemPath);
      // Priority: index.html, index.htm, then any .html or .htm
      const isHtml = f => f.endsWith('.html') || f.endsWith('.htm');
      const htmlFiles = dirFiles.filter(isHtml);
      
      let targetFile = null;
      if (htmlFiles.includes('index.html')) targetFile = 'index.html';
      else if (htmlFiles.includes('index.htm')) targetFile = 'index.htm';
      else if (htmlFiles.length > 0) targetFile = htmlFiles[0];

      if (targetFile) {
        const indexPath = path.join(itemPath, targetFile);
        const html = fs.readFileSync(indexPath, 'utf-8');
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          name = titleMatch[1].trim();
        }
        
        // Always use explicit filename so both Vite dev server and Cloudflare Pages work correctly.
        // Cloudflare also handles explicit /index.html paths fine.
        entryFile = targetFile;
      }
      
      const thumbnailPath = path.join(itemPath, 'cover.png');
      const hasCover = fs.existsSync(thumbnailPath);

      // We can also infer simple tags from the name if needed, but 'project' is fine for generic tags.
      
      projects.push({
        name,
        path: `/projects/${item}/${entryFile}`,
        tags,
        ...(hasCover && { thumbnail: `/projects/${item}/cover.png` })
      });
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(projects, null, 2));
  console.log(`Successfully generated projects.json with ${projects.length} projects.`);
}

generateProjectsData();
