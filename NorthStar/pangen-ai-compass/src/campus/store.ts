import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 校园专题类型
export interface CampusTopic {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  category: string; // 所属分类 slug
  articleIds: string[]; // 包含的文章 ID（有序）
}

// 校园文章类型
export interface CampusArticle {
  id: string;
  title: string;
  summary: string;
  content: string; // Markdown 正文
  coverImage: string;
  category: string; // 分类 slug
  visibility?: 'public' | 'campus'; // 可见性：公开或仅本校
  schoolId?: string; // 所属学校 ID（campus 可见性时必填）
  views: number;
  likes: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  topicId?: string; // 所属专题（可选，无则表示独立文章）
}

// 种子专题
const SEED_TOPICS: CampusTopic[] = [
  {
    id: 'topic-arrival',
    title: '新生报到全攻略',
    description: '刚入学必看：报到清单、出行路线、补办学生卡一站搞定',
    coverImage: 'https://picsum.photos/seed/topic-arrival/800/400',
    category: 'arrival',
    articleIds: ['campus-a2', 'campus-a3', 'campus-a6'],
  },
  {
    id: 'topic-save',
    title: '校园省钱指南',
    description: '学生党必看省钱秘籍：教材省钱、食堂测评全收录',
    coverImage: 'https://picsum.photos/seed/topic-save/800/400',
    category: 'shopping',
    articleIds: ['campus-a5', 'campus-a1'],
  },
];

// 种子数据
const SEED_ARTICLES: CampusArticle[] = [
  {
    id: 'campus-a1',
    title: '二食堂三楼麻辣烫实测',
    summary: '人均 15 元，推荐指数 4 星。分量足、价格实惠',
    content: `# 二食堂三楼麻辣烫实测\n\n## 环境\n二食堂三楼，靠窗位置佳，选面朝操场。干净明亮。\n\n## 价格\n\n| 项目 | 价格 | 推荐指数 |\n|-------|------|------|\n| 小碗 | 15-20 元 | 丰俭由人 |\n| 大碗 | 20-30 元 | 偏贵 |\n\n## 招牌必点\n\n1. **番茄牛腩** - 汤底够味，带点微辣，很鲜\n2. **土豆粉** - 细腻弹牙，推荐\n3. **宽粉** - 必点，根根有嚼劲\n4. **豆皮** - 吸满汤汁，经典\n5. **金针菇** - 最后加的，提鲜\n\n## 总结\n\n二食堂麻辣烫是校园食堂性价比之王。分量足、口味好、价格实惠。`,
    coverImage: 'https://picsum.photos/seed/campus/400/300',
    category: 'food',
    visibility: 'public',
    schoolId: undefined,
    views: 128,
    likes: 34,
    publishedAt: '2026-04-01T10:00:00Z',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
    topicId: 'topic-save',
  },
  {
    id: 'campus-a2',
    title: '新生报到清单：这 10 样东西一定要带上',
    summary: '证件、衣物、电子产品、生活用品——报到前必看',
    content: `# 新生报到清单\n\n## 证件类\n\n- 身份证\n- 录取通知书\n- 交通卡/银行卡\n- 证件照（1寸、2寸白底）\n\n## 衣物类\n\n- 当季衣物（注意当地气候）\n- 睡衣、拖鞋\n- 运动鞋\n\n## 电子产品\n\n- 手机 + 充电器\n- 耳机（可选）\n- 电脑（看专业需求）\n\n## 生活用品\n\n- 洗漱用品\n- 床上用品（学校会发，也可自带）\n- 台灯（宿舍熄灯后可能需要）\n- 插线板\n\n## 温馨提示\n\n报到当天人多，建议提前一天到。带好所有材料，省得到时候来回跑。`,
    coverImage: 'https://picsum.photos/seed/campus/401/301',
    category: 'arrival',
    visibility: 'public',
    schoolId: undefined,
    views: 256,
    likes: 67,
    publishedAt: '2026-04-01T09:00:00Z',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
    topicId: 'topic-arrival',
  },
  {
    id: 'campus-a3',
    title: '校园出行全攻略：公交/共享单车/步行路线',
    summary: '从宿舍到教学楼的 3 条最短路线实测，附校园周边交通指南',
    content: `# 校园出行全攻略\n\n## 宿舍 → 教学楼\n\n| 路线 | 时间 | 说明 |\n|-------|------|--------|\n| 1号楼 → 图书馆 | 5分钟 | 穿操场，晨跑顺便 |\n| 3号楼 → 食堂 | 8分钟 | 鲜有早餐供应 |\n| 2号楼 → 食堂 | 3分钟 | 人最多 |\n\n## 共享单车\n\n校园内有共享单车停放点，扫码即骑，1元/30分钟。\n\n## 公交路线\n\n- 校门口 → 火车站：3路/5路直达\n- 校门口 → 北站：12路（工作日高峰期每5分钟一班）\n\n## 提示\n\n校门口的网约车不太推荐——等待时间通常比公交长。`,
    coverImage: 'https://picsum.photos/seed/campus/402/301',
    category: 'transport',
    visibility: 'public',
    schoolId: undefined,
    views: 89,
    likes: 23,
    publishedAt: '2026-04-01T09:00:00Z',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
    topicId: 'topic-arrival',
  },
  {
    id: 'campus-a4',
    title: '千万别办校园门口的理发卡',
    summary: '39元剪一次，会员价58元，纯纯被坑',
    content: `# 千万别办校园门口的理发卡\n\n## 事情经过\n\n开学第一天在校门口被拉住推销"校园理发店会员卡"，39元/年，听起来很划算对吧？\n\n结果：\n1. 每次理发还要额外加钱（洗头费、护理费）\n2. 手艺极差，推子都不会用\n3. 一年下来发现根本没有去过几次\n\n## 正确做法\n\n- 校外理发店，路边 20 元洗剪吹，效果不错\n- 或者自己买个推子，同学之间互相帮着剪\n- 学校澡堂旁边有理发店，15 元/次，性价比高\n\n## 涉及金额\n\n会员卡：39 元（纯纯浪费）\n实际单次：20-30 元（加各种附加费）\n\n> 损失金额：约 39 元\n\n> 这个教训告诉我们：**别预付任何校园门口推销的会员卡。**`,
    coverImage: 'https://picsum.photos/seed/campus/403/300',
    category: 'pitfalls',
    visibility: 'public',
    schoolId: undefined,
    views: 312,
    likes: 89,
    publishedAt: '2026-04-01T09:00:00Z',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 'campus-a5',
    title: '买教材省钱攻略：校内二手书店 + 其他渠道',
    summary: '教材不用买新的！校内二手书店半价入手，学长学姐毕业清仓更便宜',
    content: `# 买教材省钱攻略\n\n## 校内二手书店\n\n位置：学生活动中心 B101\n营业时间：工作日 9:00-17:00，周末 10:00-16:00\n\n## 价格参考\n\n| 教材类型 | 新书价格 | 二手价 | 折扣 |\n|-------|--------|--------|--------|\n| 公共课教材 | 40-60 元 | 5-10 元 | 1-2 折 |\n| 专业课教材 | 30-80 元 | 8-15 元 | 2-3 折 |\n\n## 其他渠道\n\n1. 学长学姐毕业清仓（每年 6 月）——最便宜，能到 1-3 折\n2. 校园二手群——价格比书店稍高但方便\n3. 淘宝二手书——品种最全但需要邮费\n\n## 购买建议\n\n先去二手书店看有没有，没有再考虑其他渠道。二手教材上可能会有学长学姐的笔记，有用的可以留着看。`,
    coverImage: 'https://picsum.photos/seed/campus/403/300',
    category: 'shopping',
    visibility: 'public',
    schoolId: undefined,
    views: 156,
    likes: 45,
    publishedAt: '2026-04-01T09:00:00Z',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
    topicId: 'topic-save',
  },
  {
    id: 'campus-a6',
    title: '补办学生卡流程（2026版）',
    summary: '学生卡丢了/坏了怎么办？详细流程和注意事项',
    content: `# 补办学生卡流程\n\n## 准备材料\n\n- 身份证\n- 证件照（1寸白底2张）\n- 挂失声明（在教务处领表填写）\n\n## 办理地点\n\n教务处一楼 3 号窗口（工作日 8:30-11:30，12:00-14:00）\n\n## 办理时间\n\n一般 3-5 个工作日可以拿到新卡。\n\n## 费用\n\n补卡：免费（挂失情况）\n换卡：免费（损坏情况）\n\n## 注意事项\n\n1. 挂失声明一定要盖章才有效\n2. 照片要求近期免冠照\n3. 办理期间可以先开临时证明`,
    coverImage: 'https://picsum.photos/seed/campus/404/300',
    category: 'admin',
    visibility: 'public',
    schoolId: undefined,
    views: 67,
    likes: 12,
    publishedAt: '2026-04-01T09:00:00Z',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
    topicId: 'topic-arrival',
  },
  {
    id: 'campus-a7',
    title: '2026 秋季社团招新合集',
    summary: '摄影社、编程社、街舞社、文学社……本学期新增社团一览',
    content: `# 2026 秋季社团招新合集\n\n## 推荐社团\n\n### 摄影社\n\n- 人数：30 人\n- 会费：50 元/学期\n- 活动：每周三晚上组织外拍\n- 亮点：有暗房，有器材借用，适合新手\n\n### 编程社\n\n- 人数：20 人\n- 会费：免费\n- 活动：每周六下午 workshop\n- 亮点：有学长带，零基础可报\n\n### 街舞社\n\n- 人数：25 人\n- 会费：30 元/学期\n- 活动：每周五晚上训练\n- 亮点：氛围好，零基础友好\n\n## 招新时间\n\n9 月第二周开始，持续两周\n\n## 招新方式\n\n关注"校园生活"公众号，回复"社团招新"获取报名链接。`,
    coverImage: 'https://picsum.photos/seed/campus/404/300',
    category: 'activity',
    visibility: 'public',
    schoolId: undefined,
    views: 234,
    likes: 56,
    publishedAt: '2026-04-01T09:00:00Z',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 'campus-a8',
    title: '二手闲置转让指南：如何优雅地出闲置',
    summary: '教材看完了、衣服穿不下了、小电器不用了？这样处理最划算',
    content: `# 二手闲置转让指南\n\n## 出售渠道\n\n| 渠道 | 适合 | 抽成比例 | 到账速度 |\n|------|------|--------|----------|\n| 校园二手群 | 量大 | 低 | 最快（当天） |\n| 闲鱼 | 任何 | 中 | 2-3 天 |\n| 送给学弟学妹 | 少量 | 0 | 即时 |\n\n## 定价技巧\n\n- 教材：原价 3-5 折（看新旧程度）\n- 衣服：原价 2-3 折\n- 电子产品：原价 5-7 折（保留包装和配件可提高价格）\n\n## 拍照建议\n\n- 自然光下拍摄，避免闪光灯\n- 多角度展示物品状态\n- 描述中标注尺寸和瑕疵\n\n> 写好描述能更快出手！`,
    coverImage: 'https://picsum.photos/seed/campus/404/300',
    category: 'secondhand',
    visibility: 'public',
    schoolId: undefined,
    views: 178,
    likes: 34,
    publishedAt: '2026-04-01T09:00:00Z',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
];

interface CampusState {
  articles: CampusArticle[];
  topics: CampusTopic[];
  initialized: boolean;
  initialize: () => void;
  getPublishedArticles: () => CampusArticle[];
  getArticlesByCategory: (category: string) => CampusArticle[];
  getArticleById: (id: string) => CampusArticle | undefined;
  searchArticles: (query: string) => CampusArticle[];
  getFeaturedArticles: (limit?: number) => CampusArticle[];
  getTopics: () => CampusTopic[];
  getTopicsByCategory: (categorySlug: string) => CampusTopic[];
  getArticlesByTopic: (topicId: string) => CampusArticle[];
  getTopicById: (id: string) => CampusTopic | undefined;
}

export const useCampusStore = create<CampusState>()(
  persist(
    (set, get) => ({
      articles: [],
      topics: [],
      initialized: false,

      initialize: () => {
        set((state) => {
          if (!state.initialized) {
            return {
              articles: SEED_ARTICLES,
              topics: SEED_TOPICS,
              initialized: true,
            };
          }
          return state;
        });
      },

      getPublishedArticles: () => {
        return get().articles.filter((a) => a.publishedAt);
      },

      getArticlesByCategory: (category: string) => {
        return get().articles.filter(
          (a) => a.category === category && a.publishedAt,
        );
      },

      getArticleById: (id: string) => {
        return get().articles.find((a) => a.id === id);
      },

      searchArticles: (query: string) => {
        const q = query.toLowerCase();
        return get().articles.filter(
          (a) =>
            a.publishedAt &&
            (a.title.toLowerCase().includes(q) ||
              a.summary.toLowerCase().includes(q)),
        );
      },

      getFeaturedArticles: (limit = 6) => {
        return get()
          .articles.filter((a) => a.publishedAt)
          .sort((a, b) => b.views - a.views)
          .slice(0, limit);
      },

      getTopics: () => {
        return get().topics;
      },

      getTopicsByCategory: (categorySlug: string) => {
        return get().topics.filter((t) => t.category === categorySlug);
      },

      getArticlesByTopic: (topicId: string) => {
        const topic = get().topics.find((t) => t.id === topicId);
        if (!topic) return [];
        return topic.articleIds
          .map((aid) => get().articles.find((a) => a.id === aid))
          .filter((a): a is CampusArticle => !!a && !!a.publishedAt);
      },

      getTopicById: (id: string) => {
        return get().topics.find((t) => t.id === id);
      },
    }),
    {
      name: 'campus-store',
    },
  ),
);
