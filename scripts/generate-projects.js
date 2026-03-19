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
      
      // Try to read title from index.html
      const indexPath = path.join(itemPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        const html = fs.readFileSync(indexPath, 'utf-8');
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          name = titleMatch[1].trim();
        }
      }
      
      const thumbnailPath = path.join(itemPath, 'cover.png');
      const hasCover = fs.existsSync(thumbnailPath);

      // We can also infer simple tags from the name if needed, but 'project' is fine for generic tags.
      
      projects.push({
        name,
        path: `/projects/${item}/`,
        tags,
        ...(hasCover && { thumbnail: `/projects/${item}/cover.png` })
      });
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(projects, null, 2));
  console.log(`Successfully generated projects.json with ${projects.length} projects.`);
}

generateProjectsData();
