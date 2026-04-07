import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// ⚠️ 安全警告: 此配置仅用于开发环境！
// Vite proxy 仅在 `pnpm dev` 时有效，生产环境必须使用后端 API 网关转发 AI 请求。

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  const readZhipuJson = (): { apiKey: string; baseUrl: string; model: string } => {
    try {
      const p = path.resolve(__dirname, '.zhipu.local.json');
      if (!fs.existsSync(p)) return { apiKey: '', baseUrl: '', model: '' };

      const raw = fs.readFileSync(p, 'utf8').replace(/^\ufeff/, '');
      const json = JSON.parse(raw) as {
        api_key?: unknown;
        base_url?: unknown;
        model?: unknown;
      };

      return {
        apiKey: typeof json.api_key === 'string' ? json.api_key : '',
        baseUrl: typeof json.base_url === 'string' ? json.base_url : '',
        model: typeof json.model === 'string' ? json.model : '',
      };
    } catch {
      return { apiKey: '', baseUrl: '', model: '' };
    }
  };

  const readEnvLocal = (key: string): string => {
    try {
      const p = path.resolve(__dirname, `.env.${mode}.local`);
      if (!fs.existsSync(p)) return '';
      const raw = fs.readFileSync(p, 'utf8').replace(/^\ufeff/, '');

      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const k = trimmed.slice(0, eq).trim();
        if (k !== key) continue;
        const v = trimmed.slice(eq + 1).trim();
        return v.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      }

      return '';
    } catch {
      return '';
    }
  };

  const zhipuJson = readZhipuJson();

  const zhipuBaseUrl =
    env.ZHIPU_BASE_URL ||
    env.VITE_ZHIPU_BASE_URL ||
    (env as any)['\ufeffZHIPU_BASE_URL'] ||
    readEnvLocal('ZHIPU_BASE_URL') ||
    zhipuJson.baseUrl ||
    'https://open.bigmodel.cn/api/coding/paas/v4';
  const zhipuApiKey =
    env.ZHIPU_API_KEY ||
    env.VITE_ZHIPU_API_KEY ||
    (env as any)['\ufeffZHIPU_API_KEY'] ||
    readEnvLocal('ZHIPU_API_KEY') ||
    zhipuJson.apiKey ||
    '';

  console.log('[zhipu-proxy]', {
    mode,
    baseUrl: zhipuBaseUrl,
    hasKey: Boolean(zhipuApiKey),
    hasJson: Boolean(zhipuJson.apiKey) || Boolean(zhipuJson.baseUrl),
    jsonHasModel: Boolean(zhipuJson.model),
    loadedKeys: Object.keys(env).filter((k) => k.includes('ZHIPU') || k.includes('GLM')),
  });

  return {
    envDir: __dirname,
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/__zhipu': {
          target: zhipuBaseUrl,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/__zhipu/, ''),
          headers: zhipuApiKey
            ? {
                Authorization: `Bearer ${zhipuApiKey}`,
              }
            : {},
        },
      },
    },
    plugins: [react()],
    resolve: {
      // pnpm + peerDependencies 可能导致 React 被解析为多个实例，触发 Invalid hook call。
      // 这里强制去重，确保所有依赖引用同一份 react/react-dom。
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      minify: false, // 避免 Windows/Node 25 下 esbuild 压缩异常
    },
  };
});
