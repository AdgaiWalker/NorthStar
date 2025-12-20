# 盘根 · AI 指南针（PanGen AI Compass）前端

- 最终 PRD（单一事实来源）：`../openspec/Specs/PRD-盘根AI指南针-最终版.md`

## 本地运行

前置条件：Node.js（建议使用 `pnpm`）。

1. 安装依赖：
   - `pnpm install`
   - 或：`npm install`
2. 配置 AI（可选）
   - 方式 A：在项目根目录创建 `.zhipu.local.json`（建议保持 untracked），写入 `api_key`（可选 `base_url`、`model`）。
   - 方式 B：在 `.env.development.local` 设置 `ZHIPU_API_KEY` / `ZHIPU_BASE_URL`。
3. 启动开发：
   - `pnpm dev`
   - 或：`npm run dev`

## 说明

- AI 请求通过 Vite proxy 访问：`POST /__zhipu/chat/completions`。
- 当 AI 不可用或返回不可解析内容时，前端会进入“演示模式（demo）”回退。
