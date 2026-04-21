import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// ⚠️ 安全警告: 此配置仅用于开发环境！
// Vite proxy 仅在 `pnpm dev` 时有效，生产环境必须使用后端 API 网关转发 AI 请求。

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  const readAiJson = (): { apiKey: string; baseUrl: string; model: string } => {
    try {
      const p = path.resolve(__dirname, '.ai.local.json');
      if (!fs.existsSync(p)) return { apiKey: '', baseUrl: '', model: '' };

      const raw = fs.readFileSync(p, 'utf8').replace(/^﻿/, '');
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
      const raw = fs.readFileSync(p, 'utf8').replace(/^﻿/, '');

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

  const aiJson = readAiJson();

  const aiBaseUrl =
    env.AI_BASE_URL ||
    env.VITE_AI_BASE_URL ||
    (env as any)['﻿AI_BASE_URL'] ||
    readEnvLocal('AI_BASE_URL') ||
    aiJson.baseUrl ||
    '';

  const aiApiKey =
    env.AI_API_KEY ||
    env.VITE_AI_API_KEY ||
    (env as any)['﻿AI_API_KEY'] ||
    readEnvLocal('AI_API_KEY') ||
    aiJson.apiKey ||
    '';

  console.log('[ai-proxy]', {
    mode,
    baseUrl: aiBaseUrl || '(未配置)',
    hasKey: Boolean(aiApiKey),
    hasJson: Boolean(aiJson.apiKey) || Boolean(aiJson.baseUrl),
    jsonHasModel: Boolean(aiJson.model),
  });

  const proxyConfig: Record<string, any> = {};

  if (aiBaseUrl) {
    proxyConfig['/__ai'] = {
      target: aiBaseUrl,
      changeOrigin: true,
      rewrite: (p: string) => p.replace(/^\/__ai/, ''),
      headers: aiApiKey
        ? {
            Authorization: `Bearer ${aiApiKey}`,
          }
        : {},
    };
  }

  return {
    envDir: __dirname,
    server: {
      port: 3001,
      host: '0.0.0.0',
      proxy: proxyConfig,
    },
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      minify: false,
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
      },
    },
  };
});
