import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-projects-api',
      configureServer(server) {
        server.middlewares.use('/api/projects', (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify([
            {
              name: "Interactive Particles",
              path: "/projects/project-a/",
              tags: ["animation", "demo"],
              thumbnail: "/projects/project-a/cover.png"
            },
            {
              name: "Canvas Game",
              path: "/projects/project-b/",
              tags: ["game", "tool"],
            }
          ]));
        });
      }
    }
  ],
})
