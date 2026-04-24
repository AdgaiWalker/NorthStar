# 全量 PRD 下一阶段实施计划

> 日期：2026-04-24  
> 基线：已完成 P0 平台地基第一批切片，尚未提交  
> 范围：从当前实际代码状态继续推进两份 PRD 全量研发  
> 明确不做：不先写 API 文档，不做手机号/SMS 注册，不给旧接口写长期兼容层

## 一、当前判断

当前已经完成的是统一平台的“骨架层”，不是全量 PRD。

已落地：

- `admin-console` 已建包，可启动，可请求真实 API。
- server 已有 `modules/*` 目录。
- shared 已有 site、envelope、admin、identity、compliance、moderation、analytics、billing、compass、search、news 契约类型。
- 已有 `SiteContext = cn | com | all`。
- 已有 `site_configs`、`audit_logs`、`moderation_tasks`。
- 用户注册登录已切到用户名 + 邮箱 + 密码基础口径。
- `db:push`、`db:seed`、server 测试、三前端构建和类型检查已跑通过。

仍未完成的关键事实：

- 邮箱验证、密码重置、注销、数据导出、协议同意未完成。
- moderation 还没有真正接管举报、“有变化”、AI 抽检、全球申请审核。
- admin-console 仍是基础管理壳，不是完整运营后台。
- 校园站空间创建/认领、全文搜索、通知 6 类型完整闭环未完成。
- 全球站仍大量依赖本地 mock 和前端 store，真实工具/专题/文章/方案/额度/支付未完成。
- analytics、notification 邮件、billing 仍基本未实现。
- 旧路径和 placeholder 未删除。

## 二、执行原则

- 中文文案优先。
- UI 图标只用 Lucide。
- 没有显性要求，不写兼容代码。
- 新功能直接走目标命名空间 API。
- 前端不私造接口结构，优先引用 `@ns/shared` 契约。
- 每个模块按七件套验收：数据模型、API、前端入口、权限与状态、测试或 smoke、seed、文档 checklist。
- 先补核心闭环，再做体验打磨。

## 三、总优先级

```text
P0：把平台地基变成可用闭环
P1：校园站补齐 PRD 剩余核心功能
P1：全球站从 mock 原型切到真实产品
P2：横向能力
P3：全量验收、文档、发布
```

## 四、P0：平台可用闭环

目标：让统一平台不只是目录和类型，而是能支撑两站账号、合规、审核和后台操作。

### P0-0 架构闸门

- [ ] 所有新表必须显式有 `site`，除非是真正全局枚举表。
- [ ] 所有新 repository 必须接收 `SiteContext`。
- [ ] routes 不直接绕过 repository 查库。
- [ ] `site=all` 只允许 admin。
- [ ] 新命名空间接口统一返回 envelope：`ok/data` 或 `ok/error`。
- [ ] 新前端页面只引用 `@ns/shared` 契约，不在页面内私造响应结构。
- [ ] 旧接口不新增桥接层；页面切到新接口后再删旧路径。

验收：

- review 任意新增 API 时，能看到 site、repository、envelope、shared 契约四个边界。
- 违反边界的实现不进入下一批任务。

### P0-1 提交前基线固化

- [ ] 检查当前未提交改动范围。
- [ ] 确认 `admin-console`、server modules、shared 契约、schema、seed、测试改动都属于本轮 P0。
- [ ] 写入或更新 `specs/release-checklist-v0.3.1.md`。
- [ ] Lore commit 当前 P0 地基改动和本计划文档。
- [ ] 暂不 push/tag，等 P0 平台闭环完成后再统一发布小版本。

验收：

- 工作区没有无法解释的改动。
- commit message 遵守 Lore 协议。
- 后续研发基于一个干净提交继续。
- 当前 commit 只声明“平台地基”，不误称全量 PRD 完成。

### P0-2 identity 完整化

- [ ] users 表补齐邮箱验证 token 过期时间。
- [ ] 新增邮箱验证 API。
- [ ] 新增密码重置申请 API。
- [ ] 新增密码重置确认 API。
- [ ] JWT 增加可验证的站点上下文。
- [ ] 增加 token 失效机制：`sessionVersion` 或 `tokenInvalidBefore`。
- [ ] 删除账号、重置密码、禁用账号后旧 token 立即失效。
- [ ] 普通用户、editor、reviewer、operator、admin 权限统一由 role 判定。
- [ ] 现有 `trustLevel` 只作为校园贡献等级，不再承担平台权限。

前端接入：

- [ ] 校园站登录/注册错误文案统一中文。
- [ ] 全球站登录页去模拟登录，接真实 identity。
- [ ] admin-console 增加登录页，使用用户名/邮箱 + 密码登录。
- [ ] admin-console 不再把手填 token 作为主要入口；本地调试 token 入口若保留，只能放在开发开关下。
- [ ] admin-console 登录后校验角色必须是 reviewer/operator/admin。

验收：

- 用户名注册成功。
- 邮箱注册成功。
- 用户名或邮箱登录成功。
- 邮箱验证成功。
- 密码重置成功。
- cn/com 登录态不互通。
- 手机号不参与任何注册登录流程。
- 普通用户不能登录 admin-console。

### P0-3 compliance 最小闭环

- [ ] 新增 `legal_documents`。
- [ ] 新增 `user_consents`。
- [ ] 新增 `account_deletion_requests`。
- [ ] 新增协议/隐私政策查询 API。
- [ ] 注册时记录协议版本。
- [ ] 新增数据导出 API。
- [ ] 新增账号注销申请 API。
- [ ] 注销申请进入后台审核或合规处理队列。
- [ ] 注销完成后更新 token 失效字段，让现有 token 失效。
- [ ] seed 插入 cn/com 当前协议和隐私政策版本。

前端接入：

- [ ] 校园站登录页增加协议/隐私政策入口。
- [ ] 校园站我的页增加数据导出、注销入口。
- [ ] 全球站用户中心增加数据导出、注销入口。
- [ ] admin-console 能查看注销申请。

验收：

- 未登录可访问协议和隐私政策。
- 登录用户能导出自己的数据。
- 用户能申请注销。
- 后台能看到注销申请。
- 删除完成后不能继续使用旧 token。

### P0-4 moderation 接管真实入口

- [ ] 举报提交直接创建 `moderation_tasks`。
- [ ] “有变化”反馈创建 `moderation_tasks`。
- [ ] AI 输出抽检创建 `moderation_tasks`。
- [ ] 全球站申请审核创建 `moderation_tasks`。
- [ ] 状态机只允许：
  - `pending -> in_review -> resolved`
  - `pending -> in_review -> dismissed`
  - `pending -> escalated -> resolved`
- [ ] 所有状态变化写 `audit_logs`。
- [ ] 非 reviewer/operator/admin 不能查看或处理审核任务。
- [ ] 审核任务创建接口允许普通用户提交，但处理接口只允许 reviewer/operator/admin。

前端接入：

- [ ] 校园站举报成功后显示中文反馈。
- [ ] 校园站“有变化”成功后显示中文反馈。
- [ ] admin-console ReviewQueue 支持筛选 site/status/type。
- [ ] admin-console ReviewDetail 支持处理任务。

验收：

- 举报不是黑洞。
- “有变化”不是只写反馈表。
- 后台能处理真实任务。
- 每次处理有审计日志。

### P0-5 admin-console 从壳到最小可用后台

- [ ] 增加 admin 登录态。
- [ ] 用户管理：列表、详情、角色调整。
- [ ] 内容管理：校园文章/帖子基础列表。
- [ ] 审计日志：列表、按 actor/site/action 过滤。
- [ ] 系统配置：site_configs 查看和编辑。
- [ ] ReviewDetail 支持 `开始处理`、`通过/解决`、`驳回`、`升级`。
- [ ] 所有页面保留中文加载态、空态、错误态。
- [ ] 所有写操作有成功/失败中文提示。

验收：

- admin-console 可用来处理审核、查审计、调角色。
- `site=all` 只有 admin 可用。
- 页面没有 placeholder 按钮。
- 所有写操作都能在 `audit_logs` 查到。

## 五、P1：校园站全量补齐

目标：让校园 PRD v9 进入完整可试用状态。

### P1-1 空间创建与认领

- [ ] 新增创建空间 API：只允许 editor、高信任用户或 admin。
- [ ] 校园站按权限显示创建入口。
- [ ] 普通用户不显示创建入口。
- [ ] 90 天无人维护空间生成认领任务。
- [ ] 认领任务进入 moderation。
- [ ] 认领邀请触发通知。
- [ ] admin-console 可处理认领申请。

验收：

- 权限前后端一致。
- 创建空间成功后能在校园站看到。
- 认领任务可审核、可审计、可通知。

### P1-2 校园创作与成长

- [ ] 我的页显示下一步能力，不显示等级数字。
- [ ] editor 能写文章。
- [ ] 高信任用户能创建空间。
- [ ] AI 写作内容标注 AI 辅助。
- [ ] AI 写作失败时有中文错误和返回路径。
- [ ] 写文章入口按权限显示。

验收：

- 普通用户不能写文章。
- editor 能写文章。
- AI 不可用时不白屏。

### P1-3 通知 6 类型真实触发

- [ ] 认证邀请。
- [ ] 内容反馈。
- [ ] 变动提醒。
- [ ] 过期提醒。
- [ ] 空间认领邀请。
- [ ] 帖子回复。
- [ ] 顶栏未读数和我的页同步。
- [ ] 点击通知后未读数同步减少。

验收：

- 每种通知都有真实触发点。
- 移动端不会被通知列表撑爆。

### P1-4 搜索升级

- [ ] 新增 `search_documents`。
- [ ] 新增搜索索引刷新脚本。
- [ ] seed 写入搜索索引数据。
- [ ] PostgreSQL 全文搜索。
- [ ] 精确匹配。
- [ ] 部分匹配。
- [ ] 无结果 AI 兜底。
- [ ] 无结果转求助。
- [ ] 搜索日志形成内容缺口报表。

验收：

- 常见校园问题能命中。
- 无结果不是死路。
- AI 结果有标注。
- 搜索日志可统计。

### P1-5 校园内容质量

- [ ] 扩充新生 7 天内容包。
- [ ] 补报到、食堂、宿舍、选课、快递、网络、二手内容。
- [ ] 清理测试标题、乱码、占位文案。
- [ ] 首页推荐卡片改成高频真实需求。

验收：

- 首页不像测试环境。
- seed 后内容稳定可复现。

## 六、P1：全球站全量真实化

目标：把全球站从原型演示切成真实产品。

### P1-6 全球账号与准入

- [ ] 全球站登录页接真实 identity。
- [ ] 新增 `application_requests`。
- [ ] 新增 `invite_codes`。
- [ ] 支持申请制。
- [ ] 支持邀请码。
- [ ] 支持 GitHub OAuth。
- [ ] OAuth provider 未配置时返回中文不可用提示，不阻塞申请制和邀请码注册。
- [ ] 申请结果邮件通知。
- [ ] 申请审核进入 moderation。

验收：

- 全球站不再依赖模拟登录。
- 申请和邀请能进入后台审核。

### P1-7 全球内容模型

- [ ] 新增 `tool_records`。
- [ ] 新增 `topics`。
- [ ] 固定内容模型：优先采用统一 `content_records`，用 `contentType = tool/topic/article/news` 区分；如果实现中证明不合适，再记录原因后拆表。
- [ ] 新增 `news_items`。
- [ ] 新增 `content_versions`。
- [ ] seed 增加工具、专题、文章、资讯。

验收：

- `db:push` 通过。
- `db:seed` 通过。
- 全球站页面可查询真实数据。

### P1-8 工具/专题/文章/资讯 API 与页面

- [ ] 工具列表/详情 API。
- [ ] 专题列表/详情 API。
- [ ] 文章列表/详情 API。
- [ ] 资讯列表/详情 API。
- [ ] 内容工作室真实 CRUD。
- [ ] 内容发布进入 moderation。
- [ ] 工具管理去 placeholder。
- [ ] 内容管理去 placeholder。

验收：

- 全球站首页、工具页、文章页不再依赖本地 MOCK。
- 后台能管理内容。
- 发布有审核。

### P1-9 方案闭环

- [ ] 新增 `solutions`。
- [ ] 新增 `solution_exports`。
- [ ] 方案生成接 `/api/compass/solutions`。
- [ ] 保存方案。
- [ ] 方案列表。
- [ ] 方案详情。
- [ ] 导出 md/txt/csv。
- [ ] 有效反馈。
- [ ] 保存率统计。

验收：

- 方案从生成到保存到导出完整。
- 用户中心能看到真实方案。

### P1-10 全球用户后台

- [ ] 我的方案。
- [ ] 收藏夹。
- [ ] 我的额度。
- [ ] 个人资料。
- [ ] 设置。
- [ ] 数据导出。
- [ ] 数据删除。

验收：

- 用户后台无 placeholder。
- 空数据态完整。
- 数据来自后端。

## 七、P2：横向能力

### P2-1 AI 网关标准化

- [ ] 新增 AI call log。
- [ ] 输入敏感词检查统一在后端。
- [ ] 输出敏感词检查。
- [ ] 限流。
- [ ] fallback reason 标准化。
- [ ] 校园 AI search/write 走统一网关。
- [ ] 全球 AI tools/search 走统一网关。
- [ ] 内容质量分析进入 AI 网关。

验收：

- 无 AI key 时两站不白屏。
- 敏感输入不发模型。
- fallback reason 可查。

### P2-2 analytics

- [ ] 新增 `behavior_events`。
- [ ] 事件白名单。
- [ ] 校园搜索成功率。
- [ ] AI 兜底占比。
- [ ] 有帮助/有变化统计。
- [ ] 全球方案生成完成率。
- [ ] 方案保存率。
- [ ] 校园到全球转化统计。
- [ ] admin 数据中心展示基础指标。
- [ ] 行为数据 90 天清理脚本。

验收：

- 指标脚本能跑。
- admin 能看基础指标。
- 行为数据可清理。

### P2-3 notification + email

- [ ] 站内通知统一 API。
- [ ] 邮件 provider 抽象。
- [ ] 邮件模板。
- [ ] 投递记录。
- [ ] 失败重试。
- [ ] 后台可查邮件失败。

验收：

- 邮箱验证邮件可发送。
- 申请审核邮件可发送。
- 邮件失败可追踪。

### P2-4 billing

- [ ] 新增 `quotas`。
- [ ] AI 调用扣减额度。
- [ ] 新增支付订单。
- [ ] 管理后台订单页。
- [ ] 支付 provider 抽象。
- [ ] provider 未定时先支持手动确认支付。

验收：

- 额度不能被前端篡改。
- AI 调用能扣额度。
- 手动确认支付可走通。

## 八、P3：删除旧路径与发布

### P3-1 删除旧路径

- [ ] 只删除已经被新接口替换且有 smoke 覆盖的旧校园 API 调用。
- [ ] 只删除已经被真实 identity 替换的全球站模拟登录。
- [ ] 删除后台 placeholder 页面。
- [ ] 删除长期 mock 依赖；保留开发演示 mock 必须标注 owner 和删除条件。
- [ ] 删除未使用组件。
- [ ] 删除未使用 store 字段。
- [ ] 删除无 owner 兼容层。

验收：

- 没有页面依赖未记录 mock。
- 没有长期兼容路径。
- 删除动作不早于替换动作。

### P3-2 全量验证

- [ ] `pnpm -r test`。
- [ ] 三个前端 typecheck。
- [ ] 三个前端 build。
- [ ] server typecheck/test。
- [ ] `db:push`。
- [ ] `db:seed`。
- [ ] 校园真实 API smoke。
- [ ] 全球真实 API smoke。
- [ ] admin smoke。
- [ ] 数据隔离专项。
- [ ] 无 AI key fallback。
- [ ] 失效 token。
- [ ] 空数据态。
- [ ] 断 server。
- [ ] 邮箱注册/验证/密码重置专项。
- [ ] 行为数据 90 天清理专项。

验收：

- 两份 PRD 全量对照通过。
- 所有新模块满足七件套。
- 工作区干净。

### P3-3 文档与发布

- [ ] README 更新统一平台启动方式。
- [ ] README 增加三前端说明。
- [ ] 写 PRD 对照表。
- [ ] 写 release checklist。
- [ ] 记录包体大小。
- [ ] 记录测试结果。
- [ ] 记录 smoke 结果。
- [ ] Lore commit。
- [ ] push。
- [ ] tag。

验收：

- 新开发者按 README 能跑起来。
- PRD 对照表无空白项。
- 远端 main 和 tag 指向同一提交。

## 九、推荐执行顺序

第一阶段，先固化当前 P0：

1. 提交当前平台地基。
2. 补 `release-checklist-v0.3.1.md`。
3. 补最小 admin 登录态。

第二阶段，补平台闭环：

1. identity 完整化。
2. compliance 最小闭环。
3. moderation 接管真实入口。
4. admin-console 最小可用后台。

第三阶段，校园站完成：

1. 举报/有变化接 moderation。
2. 空间创建与认领。
3. 通知 6 类型。
4. 搜索升级。
5. seed 内容质量。

第四阶段，全球站真实化：

1. 全球真实登录。
2. 申请/邀请/OAuth。
3. 工具/专题/文章/资讯真实 API。
4. 方案生成保存导出。
5. 用户后台真实化。

第五阶段，横向能力：

1. AI 网关。
2. notification/email。
3. analytics。
4. billing。

第六阶段，清理发布：

1. 删除旧路径。
2. 全量 smoke。
3. README、PRD 对照表、release checklist。
4. Lore commit、push、tag。

## 十、下一步最小执行包

如果现在继续编码，建议只取这个最小包：

- 提交当前 P0 地基。
- 实现 identity 完整化：
  - 邮箱验证
  - 密码重置
  - role 权限统一
  - token 站点隔离测试
- 实现 compliance 最小闭环：
  - 协议/隐私政策
  - 同意版本记录
  - 数据导出
  - 注销申请
- admin-console 增加登录页和用户管理列表。

这个包完成后，平台才真正具备后续校园/全球并行开发的基础。
