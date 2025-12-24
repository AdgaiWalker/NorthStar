# 用户中心规格：收藏、设置、额度与学生认证

版本：v1.0
日期：2025-12-23

## 1. 概述
本规格定义用户中心模块的完整能力，包括收藏夹、偏好设置、额度可视化与学生认证功能。

## 2. 数据模型

### 2.1 本地存储键
- `pangen.favoriteToolIds`：收藏工具 ID 列表（string[]）
- `pangen.export.defaultFormat`：默认导出格式（'md' | 'txt' | 'csv'）
- `pangen.user.studentCertification`：学生认证状态对象

### 2.2 类型定义
```typescript
type ExportFormat = 'md' | 'txt' | 'csv';
type CertificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
interface StudentCertification {
  status: CertificationStatus;
  schoolId?: string;
  schoolName?: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectReason?: string;
}
```

## 3. 收藏功能

### 3.1 入口
- 工具详情页：收藏按钮，点击切换收藏状态
- 用户中心 /me/favorites：收藏夹列表

### 3.2 行为
- 收藏状态即时持久化到 localStorage
- 收藏夹列表支持「加入方案」和「取消收藏」操作
- 空态展示明确引导

## 4. 设置功能

### 4.1 设置项
- 外观主题：light / eye-care（即时生效 + 持久化）
- 语言：zh / en（即时生效 + 持久化）
- 默认导出格式：md / txt / csv（影响快捷导出）

### 4.2 无需保存按钮
所有设置项采用「即时生效 + 自动持久化」策略。

## 5. 额度可视化

### 5.1 页面
路由：/me/credits

### 5.2 展示内容
- AI 搜索剩余次数 / 每日上限（3次）
- AI 方案生成剩余次数 / 每日上限（3次）
- 下次重置时间（基于 00:00 重置）
- 说明：仅 AI 模式成功扣次，失败/超时/demo 不扣次

## 6. 学生认证

### 6.1 页面
路由：/me/certification

### 6.2 状态流转
- none → pending（提交认证申请）
- pending → verified（审核通过）
- pending → rejected（审核驳回）
- rejected → none（重新提交）
- verified（可重置为 none，仅演示用）

### 6.3 演示用操作
- 模拟通过：mockApproveStudentCertification()
- 模拟驳回：mockRejectStudentCertification(reason)
- 重置状态：resetStudentCertification()

### 6.4 学校列表（V1 内置）
- 黑河学院（schoolId: heihe）

## 7. 国际化

### 7.1 覆盖范围
- 底部导航 Tab 文案
- 用户中心侧边栏菜单

### 7.2 支持语言
- zh（中文）
- en（English）

### 7.3 回退策略
未覆盖文案回退为中文。
