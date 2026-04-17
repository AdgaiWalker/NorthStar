import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  // 从 .zhipu.local.json 或环境变量读取智谱 API 配置
  const readZhipuJson = (): { apiKey: string; baseUrl: string } => {
    try {
      const p = path.resolve(__dirname, '.zhipu.local.json');
      if (!fs.existsSync(p)) return { apiKey: '', baseUrl: '' };
      const raw = fs.readFileSync(p, 'utf8').replace(/^\ufeff/, '');
      const json = JSON.parse(raw) as { api_key?: unknown; base_url?: unknown };
      return {
        apiKey: typeof json.api_key === 'string' ? json.api_key : '',
        baseUrl: typeof json.base_url === 'string' ? json.base_url : '',
      };
    } catch {
      return { apiKey: '', baseUrl: '' };
    }
  };

  const zhipuJson = readZhipuJson();
  const zhipuBaseUrl =
    env.ZHIPU_BASE_URL ||
    zhipuJson.baseUrl ||
    'https://open.bigmodel.cn/api/coding/paas/v4';
  const zhipuApiKey =
    env.ZHIPU_API_KEY ||
    zhipuJson.apiKey ||
    '';

  return {
    plugins: [
      react(),
      {
        name: 'rewrite-root-to-campus',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (req.url === '/' || req.url === '') {
              req.url = '/index.html';
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
        input: path.resolve(__dirname, 'index.html'),
      },
    },
    server: {
      port: 3001,
      host: '0.0.0.0',
      proxy: {
        '/__zhipu': {
          target: zhipuBaseUrl,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/__zhipu/, ''),
          headers: zhipuApiKey
            ? { Authorization: `Bearer ${zhipuApiKey}` }
            : {},
        },
      },
    },
  };
});
