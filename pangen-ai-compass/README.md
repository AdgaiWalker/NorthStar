# 盘根 · AI 指南针（PanGen AI Compass）前端

- 单一事实来源（PRD）：`../openspec/Specs/PRD-盘根AI指南针-标准版.md`

## 本地运行

前置条件：Node.js。推荐使用 `pnpm@9`（当前仓库未提交 pnpm-lock，如需完全可复现请自行生成并提交；或改用 `npm install`）。

1) 安装依赖  
   - 推荐：`pnpm install`  
   - 或：`npm install`

2) 配置 AI（可选，本地演示）  
   - `.zhipu.local.json` 写入 `api_key`（可选 `base_url`）。  
   - 或 `.env.development.local` 设置 `ZHIPU_API_KEY` / `ZHIPU_BASE_URL`。

3) 常用脚本（与 package.json 对齐）  
   - 开发：`pnpm dev` / `npm run dev`  
   - 构建：`pnpm build` / `npm run build`  
   - 预览：`pnpm preview` / `npm run preview`  
   - Lint：`pnpm lint` / `npm run lint`  
   - 自动修复：`pnpm lint:fix`  
   - 格式化：`pnpm format`

## 行为说明
- AI 请求经 Vite proxy：`POST /__zhipu/chat/completions` -> `ZHIPU_BASE_URL`。
- 本地额度：AI 搜索 3 次/天、AI 方案 3 次/天，使用 localStorage，按本机时间每日 00:00 重置。AI 搜索额度耗尽/服务异常会回退到“演示模式（demo）”且不扣次数；AI 方案额度耗尽或服务异常会提示重试（不保存方案）。
- 登录门槛：当前为前端演示版，AI 功能对游客开放（受本地额度限制）；后台 `/admin` 已加最小前端守卫，真实发布需接入后端鉴权与网关。
- 模型：当前版本固定使用 `glm-4.6`（未开放配置）。

## ⚠️ 安全说明
- 仅用于本地开发/演示。生产必须由后端网关持有并转发 API Key。
- `.zhipu.local.json`、`.env.*.local` 已在 .gitignore 中，勿提交密钥。
