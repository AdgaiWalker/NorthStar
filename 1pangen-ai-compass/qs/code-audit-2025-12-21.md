# 1pangen-ai-compass 代码问题排查记录（审查版）
审查范围：`E:\桌面\开发5、claude\1pangen-ai-compass`
审查日期：2025-12-21

## 0. 已做验证
- TypeScript 类型检查：✅ 通过（`tsc --noEmit`）
- 本地开发服务：✅ 可启动并正常退出（`npm run dev`）
- 生产构建：❌ 异常（`npm run build` 进程崩溃）

## 1. 问题清单（按影响排序）

### P0（阻塞发布）：vite build 进程级崩溃
- 复现命令：`npm --prefix "E:\桌面\开发5、claude\1pangen-ai-compass" run build`
- 现象：输出 `✓ 1878 modules transformed.` 后，直接退出
- Exit code：`-1073740791`
- 说明：这是原生崩溃/兼容性问题特征（不是 TS 报错），因为：
  - `tsc` 通过
  - `vite dev` 正常
- 当前环境下 Node 版本：`v25.2.1`
- 推测原因：与 rollup/esbuild/原生二进制依赖在非 LTS Node 下兼容性相关

建议修复路径（需确认其一）：
1) 建议方案：切换 Node 到 LTS（20 或 22），再跑 build 验证
2) 如果必须用 Node 25：尝试升级/降级相关依赖（vite/rollup/esbuild 等）做二分定位

预计修复/验证耗时：
- 方案 1：30–60 分钟（前提：可切 Node 版本）
- 方案 2：1–3 小时（依赖回归/升级验证）

### P1：index.html 引用的 /index.css 不存在（部署必 404）
- 位置：`index.html:59`
- 代码：`<link rel="stylesheet" href="/index.css">`
- 现象：构建输出警告：`/index.css doesn't exist at build time...`
- 影响：生产部署后浏览器会请求 `/index.css`，返回 404（样式链路不干净）

修复选项（需确认其一）：
- A）删除该行 link（如果完全依赖 Tailwind CDN + 内联样式）
- B）补一个 `index.css`（可以先空文件），并确保打包/发布包含

预计修复耗时：5–10 分钟

### P2：CSV 导出字段未完全做引号转义（边界 bug）
- 位置：`App.tsx` → `exportSolution(..., 'csv')`
- 问题：`title/targetGoal/aiAdvice` 做了 `"` 转义，但 `toolNames` 没做；工具名一旦包含 `"` 会破坏 CSV 格式

建议：对 `toolNames` 同样做 `replace(/"/g, '""')`

预计修复耗时：5–10 分钟

### P3（规范/一致性风险）：index.html 同时用 importmap + Vite node_modules 依赖
- 位置：`index.html:47-58`（importmap 指向 esm.sh）
- 风险：同一依赖（react/react-dom/lucide-react/react-markdown）同时存在“CDN importmap”和“打包依赖”两套来源，可能导致开发/生产不一致，也会增加 build 崩溃定位难度。

修复选项（需确认其一）：
- A）保留 CDN importmap（同时明确禁用/移除打包依赖的使用方式）
- B）收敛为标准 Vite bundling（删除 importmap，依赖走 node_modules）

预计整理耗时：20–40 分钟

### P4（工作区卫生）：出现了项目外的 ../package-lock.json
- 现象：`git status` 显示 `?? ../package-lock.json`（在 `1pangen-ai-compass` 上一级目录）
- 影响：容易污染仓库根目录、误提交

处理选项（需确认其一）：
- A）删除该文件
- B）将其加入上级目录的 `.gitignore`（或调整工作流避免生成）

预计处理耗时：1–2 分钟

## 2. 结论
不是“没毛病”。至少存在：
- P0（build 崩溃）
- P1（缺失的 index.css 引用）

## 3. 待确认项（修复前必须确认）
- P0：选择方案 1（切 Node LTS）或方案 2（依赖二分），以及允许投入的时间预算
- P1：删除 link 还是补 `index.css`
- P2：是否按 PRD 规范补齐 `toolNames` 的 CSV 转义
- P3：保留 importmap 还是收敛 bundling
- P4：是否允许删除项目外 `../package-lock.json`
