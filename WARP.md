# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project layout

- `1pangen-ai-compass/`: React 19 + TypeScript + Vite single-page app for “盘根 · AI 指南针 (AI Compass)”. This is the main runnable project in the repo.
- `openspec/Specs/PRD-盘根AI指南针-最终版.md`: Canonical product requirements and UX spec (single source of truth).
- `.cunzhi-memory/`: Empty stubs for project memory (`rules.md`, `context.md`, `patterns.md`) with no effective rules yet.

Note: historical docs under `docx/` and `note.md` were merged into the PRD and intentionally removed to keep a single source of truth.

Unless otherwise noted, "the app" below refers to the code under `1pangen-ai-compass/`.

## How to run and build the frontend

From the repo root:

```bash
cd 1pangen-ai-compass
```

The project is a Vite app with scripts defined in `package.json`:

- Install dependencies (prefer the `packageManager` declared in `package.json`, currently pnpm):
  - `pnpm install`
  - or equivalently: `npm install`
- Start dev server (Vite, port configured to 3000, host `0.0.0.0`):
  - `pnpm dev`
  - or: `npm run dev`
- Build for production:
  - `pnpm build`
  - or: `npm run build`
- Preview the production build locally:
  - `pnpm preview`
  - or: `npm run preview`

At the time of writing there are **no test or lint scripts** defined in `package.json`, and no Jest/Vitest/eslint/prettier configs in the app directory. If you need automated tests or linting, first add the relevant tooling and scripts.

## AI backend and environment configuration

The app’s AI search depends on a Zhipu (智谱) API endpoint, accessed via the Vite dev server proxy:

- Proxy path: the frontend sends requests to `POST /__zhipu/chat/completions`.
- The Vite dev server proxies `/__zhipu` to a `zhipuBaseUrl` computed in `vite.config.ts`.

`vite.config.ts` resolves the Zhipu configuration in this order:

1. Environment variables loaded by Vite (`loadEnv`):
   - `ZHIPU_BASE_URL` or `VITE_ZHIPU_BASE_URL`
   - `ZHIPU_API_KEY` or `VITE_ZHIPU_API_KEY`
   - It is also defensive against BOM-prefixed keys like `\ufeffZHIPU_BASE_URL`.
2. A local env file: `.env.<mode>.local` in the app root (`1pangen-ai-compass/`), inspected manually by `readEnvLocal(key)`.
3. A JSON file: `.zhipu.local.json` in the app root, with optional fields `api_key`, `base_url`, `model`.
4. If no base URL is found, it falls back to `https://open.bigmodel.cn/api/coding/paas/v4`.

Notes for agents when enabling AI search:

- For local development, it is usually enough to create `.zhipu.local.json` with at least `api_key` and (optionally) `base_url`, or to set `ZHIPU_API_KEY`/`ZHIPU_BASE_URL` in `.env.development.local`.
- `services/AIService.ts` assumes the proxy endpoint `/__zhipu/chat/completions` is reachable and that the upstream model accepts OpenAI-compatible chat-completion requests with tool-calls.
- When Zhipu is unreachable, misconfigured, or returns unusable data, `AIService` falls back to a deterministic recommendation from `services/aiFallback.ts` (marked with `mode: 'demo'`).

Be careful not to hard-code real API keys into the repo; use local env files or `.zhipu.local.json` which should stay untracked.

## Code pointers (implementation reference)

If you need to understand or change behavior, start from:

- `1pangen-ai-compass/App.tsx`: top-level state + view routing
- `1pangen-ai-compass/types.ts`: domain types (including `ViewState`)
- `1pangen-ai-compass/constants.ts`: seeded mock content
- `1pangen-ai-compass/services/`: AI orchestration + contract + fallback
- `1pangen-ai-compass/utils/`: storage + guards
- `1pangen-ai-compass/components/`: UI components

## Relationship to the PRD

- Canonical spec: `openspec/Specs/PRD-盘根AI指南针-最终版.md`.
- Do not introduce new product behaviors that are not described in the PRD.

## Security note

Do not commit API keys. Prefer `.env.*.local` and `.zhipu.local.json` (both should stay untracked).
