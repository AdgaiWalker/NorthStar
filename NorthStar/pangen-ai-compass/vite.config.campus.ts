import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// pnpm 严格模式下 react-router-dom 内嵌了自己的 react/react-dom，
// 导致 Invalid hook call。用显式 alias 强制所有引用指向同一份 react。
const REACT_DIR = path.dirname(require.resolve('react/package.json'));
const REACT_DOM_DIR = path.dirname(require.resolve('react-dom/package.json'));

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rewrite-root-to-campus',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/' || req.url === '') {
            req.url = '/campus.html';
          }
          next();
        });
      },
    },
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: {
      'react': REACT_DIR,
      'react-dom': REACT_DOM_DIR,
      'react/jsx-runtime': path.join(REACT_DIR, 'jsx-runtime.js'),
      'react/jsx-dev-runtime': path.join(REACT_DIR, 'jsx-dev-runtime.js'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    minify: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'campus.html'),
    },
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
  },
});
