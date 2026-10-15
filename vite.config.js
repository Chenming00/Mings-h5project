import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // Projects are served at pretty directory URLs (`/projects/<slug>/`), which static hosts
    // resolve via their own index lookup. Vite's dev server does not, and would silently fall
    // through to the SPA shell instead of the project, so map it to the entry file here.
    {
      name: 'projects-directory-index',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = (req.url || '').split('?')[0];
          if (!/^\/projects\/[^/]+\/?$/.test(url)) return next();

          const projectDir = path.join(server.config.publicDir, url.replace(/^\//, ''));
          for (const entry of ['index.html', 'index.htm']) {
            if (fs.existsSync(path.join(projectDir, entry))) {
              req.url = `${url.replace(/\/?$/, '/')}${entry}`;
              return next();
            }
          }

          return next();
        });
      },
    },
  ],
});