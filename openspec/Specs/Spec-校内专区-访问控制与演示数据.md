# 校内专区规格：访问控制与演示数据

版本：v1.0
日期：2025-12-23

## 1. 概述
校内专区为通过学生认证的用户提供学校专属的 AI 工具与学习资源。本规格定义访问控制策略与演示数据结构。

## 2. 内容标记

### 2.1 字段扩展
Tool 和 Article 类型扩展以下可选字段：
- `visibility?: 'public' | 'campus'`：可见性（默认 public）
- `schoolId?: string`：校内内容所属学校标识

### 2.2 判定规则
- `visibility !== 'campus'`：公开内容，所有用户可见
- `visibility === 'campus'`：校内内容，需满足：
  - 用户认证状态为 verified
  - 用户认证的 schoolId 与内容的 schoolId 完全一致

## 3. 访问控制策略

### 3.1 列表过滤
HomePage 在展示工具和文章时，自动过滤掉当前用户无权访问的校内内容。

### 3.2 详情页拦截
当用户通过直链访问校内内容详情页时：
- 若无权访问：展示 Locked 页面（解释 + 主按钮「去学生认证」）
- 若有权访问：正常展示内容

### 3.3 校内专区页面
路由：/campus
- 未认证或认证未通过：展示 Locked 态
- 认证通过：展示当前领域下的校内工具与文章

## 4. 导航入口

### 4.1 移动端
底部导航新增「校内」Tab（GraduationCap 图标）

### 4.2 激活判定
pathname.startsWith('/campus') 时激活校内 Tab

## 5. 演示数据（V1 内置）

### 5.1 学校
- 黑河学院（schoolId: heihe）

### 5.2 校内工具
```typescript
{
  id: 't-campus-1',
  name: '黑河学院 AI 实验室',
  domain: 'dev',
  visibility: 'campus',
  schoolId: 'heihe',
  // ...
}
```

### 5.3 校内文章
```typescript
{
  id: 'a-campus-1',
  title: '黑河学院 AI 课程实训指南',
  domain: 'dev',
  visibility: 'campus',
  schoolId: 'heihe',
  // ...
}
```

## 6. 演示用操作流程
1. 登录（前端模拟）
2. 进入「学生认证」页面，选择「黑河学院」并提交
3. 点击「模拟通过」完成认证
4. 进入「校内专区」页面，可见校内工具与文章
5. 可通过「演示用：重置认证状态」重新验收
