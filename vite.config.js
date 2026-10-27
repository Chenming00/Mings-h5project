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
        const publicDir = path.resolve(server.config.publicDir);

        server.middlewares.use((req, _res, next) => {
          // Split the query off but keep it: dropping it silently broke
          // `?p=slug` style params during local previews.
          const [pathname, search] = (req.url || '').split('?');
          if (!/^\/projects\/[^/]+\/?$/.test(pathname)) return next();

          const projectDir = path.resolve(publicDir, pathname.replace(/^\//, ''));
          // `[^/]+` happily matches `..`, which would walk out of publicDir.
          if (!projectDir.startsWith(publicDir + path.sep)) return next();

          for (const entry of ['index.html', 'index.htm']) {
            if (fs.existsSync(path.join(projectDir, entry))) {
              const dirUrl = `${pathname.replace(/\/?$/, '/')}${entry}`;
              req.url = search ? `${dirUrl}?${search}` : dirUrl;
              return next();
            }
          }

          return next();
        });
      },
    },
  ],
});