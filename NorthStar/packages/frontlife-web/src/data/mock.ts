import type { FeedPost, KnowledgeBase, UserProfile } from '../types';

export const USERS: Record<string, UserProfile> = {
  li: { id: 'li', name: '李同学', color: '#C84B31', school: '黑河学院', level: 3 },
  wang: { id: 'wang', name: '王同学', color: '#3D5A80', school: '黑河学院', level: 3 },
  zhang: { id: 'zhang', name: '张同学', color: '#5B7553', school: '黑河学院', level: 3 },
  zhao: { id: 'zhao', name: '赵同学', color: '#8B6CC1', school: '黑河学院', level: 2 },
  liu: { id: 'liu', name: '刘同学', color: '#C8956C', school: '黑河学院', level: 1 },
};

export const LEVELS: Record<number, string> = {
  1: 'Lv1 注册',
  2: 'Lv2 活跃',
  3: 'Lv3 认证',
  4: 'Lv4 资深',
};

export const KNOWLEDGE_BASES: Record<string, KnowledgeBase> = {
  food: {
    id: 'food',
    icon: '🍜',
    name: '校园美食地图',
    desc: '吃遍每一食堂',
    authorId: 'li',
    articles: ['malatang', 'yishitang', 'sanshitang'],
    saves: 89,
    views: 4200,
    section: '热门',
  },
  arrival: {
    id: 'arrival',
    icon: '🎒',
    name: '新生报到全攻略',
    desc: '从收到通知书到入住宿舍',
    authorId: 'zhang',
    articles: ['baodao', 'sushe', 'zhengjian'],
    saves: 156,
    views: 8900,
    section: '热门',
  },
  academic: {
    id: 'academic',
    icon: '📋',
    name: '选课避雷指南',
    desc: '哪些课值得上，哪些要避开',
    authorId: 'wang',
    articles: ['xuanke', 'bixuan'],
    saves: 42,
    views: 2100,
    section: '热门',
  },
  ai: {
    id: 'ai',
    icon: '💻',
    name: 'AI 工具箱',
    desc: '提示词收藏、效率工具推荐',
    authorId: 'li',
    articles: ['aiprompt', 'aitools'],
    saves: 38,
    views: 1800,
    section: '最新',
  },
  print: {
    id: 'print',
    icon: '🖨️',
    name: '打印店指南',
    desc: '校内校外打印攻略',
    authorId: 'zhao',
    articles: ['dayin'],
    saves: 15,
    views: 680,
    section: '商业',
  },
  secondhand: {
    id: 'secondhand',
    icon: '📦',
    name: '二手好物交换',
    desc: '教材、电器、生活用品',
    authorId: 'liu',
    articles: ['ershou'],
    saves: 67,
    views: 3400,
    section: '商业',
  },
  guitar: {
    id: 'guitar',
    icon: '🎸',
    name: '吉他入门手册',
    desc: '零基础到弹唱一首歌',
    authorId: 'wang',
    articles: ['jitar'],
    saves: 12,
    views: 450,
    section: '最新',
  },
  freeboard: {
    id: 'freeboard',
    icon: '💬',
    name: '自由广场',
    desc: '快问快答、闲聊、找不到合适板块的发这里',
    authorId: 'zhang',
    articles: [],
    saves: 0,
    views: 1200,
    section: '最新',
  },
};

export interface ArticleData {
  id: string;
  title: string;
  kbId: string;
  confirmedAgo: string;
  authorId: string;
  updatedAt: string;
  saves: number;
  views: number;
  confirms: number;
  content: string;
}

export const ARTICLES: Record<string, ArticleData> = {
  malatang: {
    id: 'malatang',
    title: '二食堂麻辣烫测评',
    kbId: 'food',
    confirmedAgo: '3天前',
    authorId: 'li',
    updatedAt: '1天前',
    saves: 89,
    views: 1247,
    confirms: 34,
    content: `# 窗口搬迁后的变化

二食堂三楼麻辣烫窗口从东侧搬到了西侧靠窗位置，空间比以前大了很多，现在有 8 张桌子，高峰期也能找到座位。

## 价格与推荐

| 窗口 | 人均 | 推荐 | 等待 |
|------|------|------|------|
| 麻辣烫 | 15 元 | ⭐⭐⭐⭐ | 5-10 min |
| 麻辣拌 | 13 元 | ⭐⭐⭐ | 3-5 min |
| 酸辣粉 | 10 元 | ⭐⭐⭐⭐ | 5 min |

## 最佳搭配

经典搭配：麻辣烫 + 米饭，加豆皮和金针菇是最佳组合。

> 💡 11:30 前去不用排队。下午 2-4 点人最少。

## 实用小贴士

三楼周末不开放，只有周一到周五营业。另外推荐试试麻辣拌，今年新加的。

> ⚠️ 三楼最近空调不太好用，建议自带小风扇。
`,
  },
  yishitang: {
    id: 'yishitang',
    title: '一食堂测评',
    kbId: 'food',
    confirmedAgo: '2周前',
    authorId: 'zhang',
    updatedAt: '2周前',
    saves: 45,
    views: 890,
    confirms: 18,
    content: `# 整体环境

一食堂是学校最大的食堂，共三层，一楼基本餐、二楼风味窗口、三楼教师餐厅（学生也能去）。整体卫生状况良好。

## 窗口推荐

二楼西侧的黄焖鸡是必吃，份量足、味道正。东侧的烤肉饭也不错，加个蛋只要 1 块钱。

## 价格一览

基本餐人均 8-12 元，风味窗口 12-18 元。比二食堂便宜一点，但口味选择少一些。
`,
  },
  sanshitang: {
    id: 'sanshitang',
    title: '三食堂测评',
    kbId: 'food',
    confirmedAgo: '30天前',
    authorId: 'wang',
    updatedAt: '1月前',
    saves: 28,
    views: 320,
    confirms: 8,
    content: `# 位置与交通

三食堂在北校区，离主教学楼步行约 8 分钟。住北苑的同学吃饭首选。

## 窗口情况

三食堂窗口不多，但有全校最便宜的自选菜。一顿 6-8 块就能吃饱。推荐二楼的粥和包子当早餐。

## 近期变化

听说下学期要翻新，窗口可能会有变动。当前信息可能有变化，欢迎反馈更新。
`,
  },
  baodao: {
    id: 'baodao',
    title: '报到当天全流程',
    kbId: 'arrival',
    confirmedAgo: '5天前',
    authorId: 'zhang',
    updatedAt: '2月前',
    saves: 156,
    views: 3400,
    confirms: 67,
    content: `# 到校前准备

带齐录取通知书、身份证、高考准考证、一寸照片 8 张。行李不用带太多，学校超市基本都能买到。

## 报到流程

到校后先去体育馆 → 找到所在学院 → 领取报到单 → 缴费 → 领钥匙 → 入住宿舍。

> 💡 早去！上午 10 点前人最少，下午排队要 1 小时以上。

## 宿舍入住

宿舍一般是 6 人间，有独立卫生间。床铺尺寸 0.9m × 2m，买床上用品注意尺寸。
`,
  },
  xuanke: {
    id: 'xuanke',
    title: '选课避雷清单',
    kbId: 'academic',
    confirmedAgo: '3天前',
    authorId: 'zhang',
    updatedAt: '3天前',
    saves: 42,
    views: 890,
    confirms: 22,
    content: `# 必选课推荐

大一上学期的必修课比较固定，重点选好体育课和选修课。

## 选修课红黑榜

| 课程 | 难度 | 推荐 | 备注 |
|------|------|------|------|
| 大学生心理健康 | 简单 | ⭐⭐⭐⭐ | 平时分高 |
| 创意写作 | 中等 | ⭐⭐⭐ | 有趣但作业多 |

## 选课技巧

第一天不要急，先观察再选。教务系统高峰期容易崩，错峰操作。
`,
  },
  aiprompt: {
    id: 'aiprompt',
    title: 'AI 提示词收藏',
    kbId: 'ai',
    confirmedAgo: '5天前',
    authorId: 'li',
    updatedAt: '5天前',
    saves: 38,
    views: 1200,
    confirms: 15,
    content: `# 写作辅助

论文大纲生成、摘要提炼、中英互译，这些提示词能帮你省很多时间。

## 学习工具

用 AI 做思维导图、概念解释、错题分析，效果比单纯看笔记好很多。

## 效率提示词

邮件撰写、会议纪要、日程规划，这些是日常最常用的场景。
`,
  },
};

export const POSTS: FeedPost[] = [
  {
    id: 'p1',
    authorId: 'li',
    time: '5分钟前',
    content: '三食堂今天新开了烤冷面窗口！比外面路边摊好吃，8块钱一大份。',
    tags: ['share'],
    saves: 12,
    views: 89,
    replies: [
      { id: 'r1', authorId: 'wang', time: '3分钟前', text: '在哪在哪？一楼还是二楼？', stars: 2 },
      { id: 'r2', authorId: 'zhao', time: '1分钟前', text: '一楼左侧，新开的那个窗口', stars: 5 },
    ],
    kbId: 'food',
  },
  {
    id: 'p2',
    authorId: 'wang',
    time: '20分钟前',
    content: '有没有人知道图书馆几点关门？',
    tags: ['help'],
    saves: 5,
    views: 156,
    replies: [
      { id: 'r3', authorId: 'li', time: '18分钟前', text: '工作日 8:00-22:00，周末 9:00-21:00', stars: 12 },
      { id: 'r4', authorId: 'zhao', time: '15分钟前', text: '三楼自习室到 23:00，比主馆晚', stars: 8 },
    ],
    kbId: 'freeboard',
  },
  {
    id: 'p3',
    authorId: 'zhao',
    time: '1小时前',
    content: '出一台二手电风扇，9成新，在北苑住的同学可以直接来拿，20块。有意私信。',
    tags: ['secondhand'],
    saves: 8,
    views: 234,
    replies: [],
    kbId: 'secondhand',
  },
  {
    id: 'p4',
    authorId: 'liu',
    time: '2小时前',
    content: '明天社团纳新，吉他社在体育馆门口招人！零基础也能来，有免费教学。',
    tags: ['event'],
    saves: 15,
    views: 312,
    replies: [
      { id: 'r5', authorId: 'wang', time: '1小时前', text: '可以！需要自备吉他吗？', stars: 1 },
      { id: 'r6', authorId: 'liu', time: '45分钟前', text: '不用，社团有练习琴', stars: 3 },
    ],
    kbId: 'guitar',
  },
  {
    id: 'p5',
    authorId: 'zhang',
    time: '3小时前',
    content: '考研资料出，数学张宇全套+英语真题，50块打包带走。考研人看过来。',
    tags: ['secondhand'],
    saves: 22,
    views: 456,
    replies: [],
    kbId: 'secondhand',
  },
  {
    id: 'p6',
    authorId: 'wang',
    time: '4小时前',
    content: '大家觉得这学期体育课选什么好？有没有轻松点的推荐？',
    tags: ['discussion'],
    saves: 8,
    views: 178,
    replies: [
      { id: 'r7', authorId: 'li', time: '3小时前', text: '羽毛球！老师人超好，基本不挂人', stars: 6 },
      { id: 'r8', authorId: 'zhang', time: '2小时前', text: '选过瑜伽，考试就是做一套动作，超简单', stars: 4 },
    ],
    kbId: 'freeboard',
  },
];

export const TAG_LABELS: Record<string, string> = {
  help: '#求助',
  secondhand: '#二手',
  event: '#活动',
  discussion: '#讨论',
  share: '#分享',
};

export const FEED = [
  { type: 'post' as const, data: POSTS[0], lastActivityAt: Date.now() - 5 * 60 * 1000 },
  { type: 'article' as const, data: { articleId: 'malatang', kbId: 'food', updatedBy: 'li', time: '1天前' }, lastActivityAt: Date.now() - 24 * 60 * 60 * 1000 },
  { type: 'post' as const, data: POSTS[1], lastActivityAt: Date.now() - 20 * 60 * 1000 },
  { type: 'kb' as const, data: { kbId: 'secondhand', newArticle: '考研资料合集', updatedBy: 'liu', time: '2小时前' }, lastActivityAt: Date.now() - 2 * 60 * 60 * 1000 },
  { type: 'post' as const, data: POSTS[2], lastActivityAt: Date.now() - 60 * 60 * 1000 },
  { type: 'article' as const, data: { articleId: 'xuanke', kbId: 'academic', updatedBy: 'zhang', time: '3天前' }, lastActivityAt: Date.now() - 3 * 24 * 60 * 60 * 1000 },
  { type: 'post' as const, data: POSTS[3], lastActivityAt: Date.now() - 2 * 60 * 60 * 1000 },
  { type: 'post' as const, data: POSTS[4], lastActivityAt: Date.now() - 3 * 60 * 60 * 1000 },
  { type: 'post' as const, data: POSTS[5], lastActivityAt: Date.now() - 4 * 60 * 60 * 1000 },
];

export function getUser(id: string) {
  return USERS[id] || { id: 'anon', name: '匿名', color: '#999', school: '', level: 1 };
}

export function getArticle(id: string) {
  return ARTICLES[id];
}

export function getKB(id: string) {
  return KNOWLEDGE_BASES[id];
}

export function getKBPosts(kbId: string) {
  return POSTS.filter((p) => p.kbId === kbId);
}
