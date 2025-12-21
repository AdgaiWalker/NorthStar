import { Tool, Article, Topic } from './types';

export const APP_NAME = "盘根 · AI 指南针";
export const ICP_LICENSE = "蜀ICP备2025165644号-1";

export const MOCK_TOPICS: Topic[] = [
  {
    id: 'topic1',
    title: 'Git 版本管理实战',
    description: '从入门到精通，掌握现代协作开发的基石。',
    coverUrl: 'https://picsum.photos/400/300?random=10',
    domain: 'dev',
    articleCount: 3,
    rating: 4.9
  },
  {
    id: 'topic2',
    title: '短视频创作全流程',
    description: '从脚本构思、AI生成素材到剪辑发布。',
    coverUrl: 'https://picsum.photos/400/300?random=11',
    domain: 'creative',
    articleCount: 2,
    rating: 4.8
  }
];

export const MOCK_TOOLS: Tool[] = [
  {
    id: 't1',
    name: 'Cursor',
    description: 'AI 优先的代码编辑器。',
    fullDescription: 'Cursor 是一款专为 AI 编程打造的 IDE。它允许你通过强大的 AI 助手来编写、编辑和讨论代码。',
    domain: 'dev',
    tags: ['IDE', '编程', 'GPT-4'],
    rating: 4.9,
    usageCount: '12.5k',
    imageUrl: 'https://picsum.photos/400/300?random=1',
    url: 'https://cursor.sh',
    isFavorite: false,
  },
  {
    id: 't2',
    name: 'Midjourney',
    description: '高质量图像生成 AI。',
    fullDescription: 'Midjourney 是目前最顶尖的文生图工具之一，能通过简短的文字提示生成令人惊叹的艺术作品。',
    domain: 'creative',
    tags: ['图像生成', '艺术', '设计'],
    rating: 4.8,
    usageCount: '8.2m',
    imageUrl: 'https://picsum.photos/400/300?random=2',
    url: 'https://midjourney.com',
    isFavorite: true,
  },
  {
    id: 't3',
    name: 'Gamma',
    description: '生成演示文稿的新媒介。',
    fullDescription: 'Gamma 允许你在无需纠结格式的情况下，快速创建精美的演示文稿。',
    domain: 'work',
    tags: ['PPT', '生产力', '办公'],
    rating: 4.7,
    usageCount: '2.1m',
    imageUrl: 'https://picsum.photos/400/300?random=3',
    url: 'https://gamma.app',
    isFavorite: false,
  },
  {
    id: 't4',
    name: 'V0.dev',
    description: '文本提示生成 UI。',
    fullDescription: 'V0 是 Vercel 推出的生成式 UI 系统，快速构建 Web 界面。',
    domain: 'dev',
    tags: ['UI', 'React', '前端'],
    rating: 4.6,
    usageCount: '500k',
    imageUrl: 'https://picsum.photos/400/300?random=4',
    url: 'https://v0.dev',
    isFavorite: false,
  },
   {
    id: 't5',
    name: 'Runway Gen-3',
    description: '先进的视频生成工具。',
    fullDescription: 'Runway 支持高质量的文生视频、图生视频以及视频风格转换。',
    domain: 'creative',
    tags: ['视频', 'VFX', 'AI视频'],
    rating: 4.8,
    usageCount: '1.2m',
    imageUrl: 'https://picsum.photos/400/300?random=5',
    url: 'https://runwayml.com',
    isFavorite: false,
  },
  {
    id: 't6',
    name: 'Notion AI',
    description: '工作流中的 AI 助手。',
    fullDescription: '在 Notion 内部直接访问 AI 的无限力量，帮你写得更快、想得更远。',
    domain: 'work',
    tags: ['文档', '笔记', '知识库'],
    rating: 4.5,
    usageCount: '15m',
    imageUrl: 'https://picsum.photos/400/300?random=6',
    url: 'https://notion.so',
    isFavorite: true,
  }
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: 'a1',
    topicId: 'topic1',
    title: '实战：如何用 Cursor 自动重构遗留代码',
    summary: '面对复杂的旧项目头疼？本视频演示如何利用 AI 理解上下文，一键优化代码结构。',
    content: `
# 视频重点摘要

1. **导入项目**：让 Cursor 索引整个文件夹。
2. **选中烂代码**：使用 \`Cmd+K\` 呼出指令框。
3. **输入指令**：输入“重构此函数，使其符合单一职责原则”。
4. **审查差异**：查看 AI 修改前后的对比，并接受更改。

## 详细步骤

在实际开发中，我们经常遇到命名不规范、函数过长的问题。
    `,
    domain: 'dev',
    author: '架构师_李',
    authorLevel: 'certified',
    date: '2023-10-24',
    readTime: '12 分钟',
    relatedToolId: 't1',
    imageUrl: 'https://picsum.photos/800/400?random=7',
    isVideo: true,
    isFeatured: true,
    stats: { views: 1200, likes: 340, comments: 25 }
  },
  {
    id: 'a2',
    topicId: 'topic2',
    title: '从零开始：用 Midjourney 生成一致的角色IP',
    summary: '做短视频 IP 形象不统一？教你使用 --cref 参数固定角色脸型和风格。',
    content: `
# 角色一致性指南

在制作系列短片时，保持角色长相一致是最大的难点。

## 关键参数：--cref
使用一张基础的角色图作为参考，设置 URL 到 \`--cref\` 参数中。

## 关键参数：--cw
使用 \`--cw 100\` 锁定脸部和服装，使用 \`--cw 0\` 仅锁定脸部（方便换装）。
    `,
    domain: 'creative',
    author: 'AI 绘画实验室',
    authorLevel: 'certified',
    date: '2023-11-02',
    readTime: '8 分钟',
    relatedToolId: 't2',
    imageUrl: 'https://picsum.photos/800/400?random=8',
    isVideo: false,
    isFeatured: true,
    stats: { views: 5600, likes: 890, comments: 120 }
  },
  {
    id: 'a3',
    topicId: undefined, // Independent article
    title: 'Gamma 实操：5分钟生成一份年终总结 PPT',
    summary: '不想写 PPT？把 Word 大纲丢给 Gamma，自动生成配图、排版精美的演示文稿。',
    content: `
# 快速上手

1. 准备你的 Markdown 或 Word 大纲。
2. 选择 "Paste in text" 模式。
3. 挑选一个商务风格的主题。
4. 点击生成，并使用 AI 对单页进行微调。
    `,
    domain: 'work',
    author: '职场效率君',
    authorLevel: 'user',
    date: '2023-11-15',
    readTime: '8 分钟',
    relatedToolId: 't3',
    imageUrl: 'https://picsum.photos/800/400?random=9',
    isVideo: true,
    isFeatured: false, // Plaza content
    stats: { views: 800, likes: 45, comments: 8 }
  },
  {
    id: 'a4',
    topicId: 'topic1',
    title: 'Git 分支管理最佳实践',
    summary: 'Git Flow 还是 GitHub Flow？找到适合你团队的工作流。',
    content: `# 工作流选择\n\n不同的团队规模适合不同的分支策略...`,
    domain: 'dev',
    author: 'DevOps_Master',
    authorLevel: 'certified',
    date: '2023-12-01',
    readTime: '15 分钟',
    imageUrl: 'https://picsum.photos/800/400?random=12',
    isVideo: false,
    isFeatured: true,
    stats: { views: 300, likes: 50, comments: 12 }
  }
];
