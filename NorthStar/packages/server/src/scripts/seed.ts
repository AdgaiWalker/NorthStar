import { SEED_ARTICLES, SEED_TOPICS } from "@ns/shared";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { hashPassword } from "../lib/auth";
import {
  articles,
  cities,
  contentRecords,
  knowledgeBases,
  legalDocuments,
  posts,
  siteConfigs,
  trustEvents,
  users,
} from "../db/schema";
import { db, pool } from "../db/client";
import { refreshSearchDocumentsInDb } from "../data/postgres";

config();

const topicIndex = new Map(SEED_TOPICS.map((topic, index) => [topic.id, index + 1]));

const COMPASS_CONTENT_SEED = [
  {
    contentType: "tool",
    slug: "cursor",
    title: "Cursor",
    summary: "AI 优先的代码编辑器。",
    body: "Cursor 适合把代码理解、重构、测试补齐和日常开发串成一个连续工作流。建议先用它读懂项目结构，再让 AI 针对小范围文件提出修改。",
    domain: "dev",
    metadata: {
      tags: ["IDE", "编程", "代码理解"],
      rating: 4.9,
      usageCount: "12.5k",
      imageUrl: "https://picsum.photos/400/300?random=41",
      url: "https://cursor.sh",
    },
  },
  {
    contentType: "tool",
    slug: "midjourney",
    title: "Midjourney",
    summary: "高质量图像生成 AI。",
    body: "Midjourney 适合视觉概念、角色设定和风格探索。正式工作流里建议配合参考图和人工筛选，避免把 AI 结果直接当成终稿。",
    domain: "creative",
    metadata: {
      tags: ["图像生成", "视觉设计", "创意"],
      rating: 4.8,
      usageCount: "8.2m",
      imageUrl: "https://picsum.photos/400/300?random=42",
      url: "https://midjourney.com",
    },
  },
  {
    contentType: "tool",
    slug: "gamma",
    title: "Gamma",
    summary: "快速生成演示文稿和叙事页面。",
    body: "Gamma 适合把大纲快速变成可讲述的演示材料。更适合草稿和结构搭建，关键数据和表述仍需要人工校对。",
    domain: "work",
    metadata: {
      tags: ["PPT", "办公", "表达"],
      rating: 4.7,
      usageCount: "2.1m",
      imageUrl: "https://picsum.photos/400/300?random=43",
      url: "https://gamma.app",
    },
  },
  {
    contentType: "topic",
    slug: "ai-coding-workflow",
    title: "AI 编程工作流",
    summary: "从需求拆解、代码生成、测试补齐到重构复盘。",
    body: "这个专题关注如何把 AI 编程工具放进真实工程流程，而不是只做一次性代码生成。",
    domain: "dev",
    metadata: {
      coverUrl: "https://picsum.photos/400/300?random=44",
      articleCount: 2,
      rating: 4.8,
    },
  },
  {
    contentType: "topic",
    slug: "short-video-ai",
    title: "短视频 AI 生产线",
    summary: "选题、脚本、分镜、素材和剪辑的协作流程。",
    body: "这个专题帮助创作者建立可复用的短视频生产线，重点是流程稳定性和质量校验。",
    domain: "creative",
    metadata: {
      coverUrl: "https://picsum.photos/400/300?random=45",
      articleCount: 2,
      rating: 4.7,
    },
  },
  {
    contentType: "article",
    slug: "cursor-refactor-guide",
    title: "如何用 Cursor 重构遗留代码",
    summary: "把 AI 当作结对工程师，而不是自动改代码机器。",
    body: "# 如何用 Cursor 重构遗留代码\n\n先让 Cursor 总结模块职责，再选择小范围函数做重构。每次修改后运行测试，并要求 AI 解释行为是否改变。\n\n## 建议步骤\n\n1. 让 AI 阅读目录和关键文件。\n2. 锁定一个函数或组件。\n3. 先补测试，再做重构。\n4. 运行类型检查和测试。",
    domain: "dev",
    metadata: {
      topicId: "ai-coding-workflow",
      author: "盘根编辑",
      authorLevel: "certified",
      readTime: "10 分钟",
      relatedToolId: "cursor",
      imageUrl: "https://picsum.photos/800/400?random=46",
      isFeatured: true,
      views: 1200,
      likes: 340,
      comments: 25,
    },
  },
  {
    contentType: "article",
    slug: "gamma-year-end-report",
    title: "用 Gamma 做年终总结演示",
    summary: "先写清楚受众和结论，再让 AI 帮你搭结构。",
    body: "# 用 Gamma 做年终总结演示\n\n不要直接把零散素材丢给 AI。先列出目标受众、三条结论和关键数据，再让 Gamma 生成初稿。\n\n## 校验清单\n\n- 数据来源是否清楚\n- 每页是否只有一个重点\n- 结尾是否有下一步行动",
    domain: "work",
    metadata: {
      author: "职场效率君",
      authorLevel: "certified",
      readTime: "8 分钟",
      relatedToolId: "gamma",
      imageUrl: "https://picsum.photos/800/400?random=47",
      isFeatured: false,
      views: 800,
      likes: 45,
      comments: 8,
    },
  },
  {
    contentType: "news",
    slug: "ai-agent-workflow-2026",
    title: "AI Agent 工作流进入工程落地阶段",
    summary: "越来越多团队开始把 Agent 放进测试、文档和代码审查流程。",
    body: "AI Agent 的价值正在从演示转向真实工作流，关键在于权限边界、可观测性和人工确认。",
    domain: "dev",
    metadata: {
      source: "盘根观察",
      url: "https://xyzidea.com/news/ai-agent-workflow-2026",
    },
  },
] as const;

async function seed() {
  if (!db) {
    console.log(
      JSON.stringify({
        skipped: true,
        reason: "DATABASE_URL is not set",
        spaces: SEED_TOPICS.length,
        articles: SEED_ARTICLES.length,
      }),
    );
    return;
  }

  await db.execute(sql`
    truncate table
      reports,
      moderation_tasks,
      audit_logs,
      account_deletion_requests,
      user_consents,
      legal_documents,
      site_configs,
      search_documents,
      content_versions,
      content_records,
      search_logs,
      notifications,
      favorites,
      auth_requests,
      activities,
      feedbacks,
      post_replies,
      posts,
      articles,
      knowledge_bases,
      trust_events,
      users,
      cities
    restart identity cascade
  `);

  await db
    .insert(cities)
    .values({ id: 1, code: "heihe", name: "黑河学院", isActive: true })
    .onConflictDoNothing();

  await db
    .insert(siteConfigs)
    .values([
      { site: "cn", key: "display", value: { name: "盘根校园", domain: "xyzidea.cn" } },
      { site: "com", key: "display", value: { name: "盘根 AI 指南针", domain: "xyzidea.com" } },
    ])
    .onConflictDoUpdate({
      target: [siteConfigs.site, siteConfigs.key],
      set: {
        value: sql`excluded.value`,
        updatedAt: sql`now()`,
      },
    });

  await db
    .insert(legalDocuments)
    .values([
      {
        site: "cn",
        type: "terms",
        version: "2026-04-24",
        title: "盘根校园用户协议",
        content: "使用盘根校园即表示你同意遵守校园内容共建规则，真实提交反馈，不发布违法、侵权或骚扰内容。",
      },
      {
        site: "cn",
        type: "privacy",
        version: "2026-04-24",
        title: "盘根校园隐私政策",
        content: "盘根校园仅收集账号、内容互动和必要安全数据，用于提供校园信息服务、审核和安全保护。",
      },
      {
        site: "com",
        type: "terms",
        version: "2026-04-24",
        title: "盘根 AI 指南针用户协议",
        content: "使用盘根 AI 指南针即表示你同意按工具评测、方案生成和内容共建规则使用服务。",
      },
      {
        site: "com",
        type: "privacy",
        version: "2026-04-24",
        title: "盘根 AI 指南针隐私政策",
        content: "盘根 AI 指南针仅收集账号、方案、收藏、额度和必要安全数据，用于提供服务和合规处理。",
      },
    ])
    .onConflictDoUpdate({
      target: [legalDocuments.site, legalDocuments.type, legalDocuments.version],
      set: {
        title: sql`excluded.title`,
        content: sql`excluded.content`,
        publishedAt: sql`now()`,
      },
    });

  await db
    .insert(users)
    .values([
      {
        id: 1,
        username: "zhang",
        email: "zhang@example.com",
        site: "cn",
        role: "user",
        emailVerified: true,
        nickname: "张同学",
        passwordHash: hashPassword("password"),
        school: "黑河学院",
        cityId: 1,
        trustLevel: "user",
      },
      {
        id: 2,
        username: "editor",
        email: "editor@example.com",
        site: "cn",
        role: "editor",
        emailVerified: true,
        nickname: "盘根编辑",
        passwordHash: hashPassword("password"),
        school: "黑河学院",
        cityId: 1,
        trustLevel: "author",
      },
      {
        id: 3,
        username: "admin",
        email: "admin@example.com",
        site: "cn",
        role: "admin",
        emailVerified: true,
        nickname: "盘根管理员",
        passwordHash: hashPassword("password"),
        school: "黑河学院",
        cityId: 1,
        trustLevel: "admin",
      },
      {
        id: 4,
        username: "compass",
        email: "compass@example.com",
        site: "com",
        role: "admin",
        emailVerified: true,
        nickname: "盘根指南针管理员",
        passwordHash: hashPassword("password"),
        trustLevel: "admin",
      },
    ])
    .onConflictDoUpdate({
      target: users.username,
      set: {
        nickname: sql`excluded.nickname`,
        email: sql`excluded.email`,
        site: sql`excluded.site`,
        role: sql`excluded.role`,
        emailVerified: sql`excluded.email_verified`,
        passwordHash: sql`excluded.password_hash`,
        school: sql`excluded.school`,
        cityId: sql`excluded.city_id`,
        trustLevel: sql`excluded.trust_level`,
        postCount: 0,
        articleCount: 0,
      },
    });

  await db.execute(sql`delete from trust_events where user_id in (1, 2)`);
  await db.execute(sql`update users set trust_level = 'user', post_count = 0, article_count = 0 where username = 'zhang'`);
  await db.execute(sql`update users set trust_level = 'author', post_count = 0, article_count = 0 where username = 'editor'`);

  await db
    .insert(contentRecords)
    .values(
      COMPASS_CONTENT_SEED.map((item) => ({
        site: "com",
        contentType: item.contentType,
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        body: item.body,
        domain: item.domain,
        metadata: item.metadata,
        status: "published",
        ownerId: 4,
        publishedAt: new Date("2026-04-25T00:00:00.000Z"),
      })),
    )
    .onConflictDoUpdate({
      target: [contentRecords.site, contentRecords.contentType, contentRecords.slug],
      set: {
        title: sql`excluded.title`,
        summary: sql`excluded.summary`,
        body: sql`excluded.body`,
        domain: sql`excluded.domain`,
        metadata: sql`excluded.metadata`,
        status: sql`excluded.status`,
        ownerId: sql`excluded.owner_id`,
        publishedAt: sql`excluded.published_at`,
        updatedAt: sql`now()`,
      },
    });

  await db
    .insert(knowledgeBases)
    .values(
      SEED_TOPICS.map((topic, index) => ({
        id: index + 1,
        slug: topic.id.replace(/^topic-/, ""),
        title: topic.title,
        description: topic.description,
        ownerId: 2,
        category: topic.category,
        cover: topic.coverImage,
        isClaimed: true,
        claimedBy: 2,
        articleCount: topic.articleIds.length,
        favoriteCount: 0,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(articles)
    .values(
      SEED_ARTICLES.map((article, index) => ({
        id: index + 1,
        kbId: topicIndex.get(article.topicId ?? "") ?? 1,
        title: article.title,
        slug: article.id,
        content: article.content,
        cover: article.coverImage,
        authorId: 2,
        status: "published" as const,
        confirmedAt: new Date(article.updatedAt ?? article.publishedAt ?? Date.now()),
        helpfulCount: article.likes,
        changedCount: 0,
        readCount: article.views,
        favoriteCount: article.likes,
        sortOrder: index,
      })),
    )
    .onConflictDoNothing();

  const childArticleSlug = "campus-a1-price-child";
  await db.execute(sql`select setval('articles_id_seq', coalesce((select max(id) from articles), 1), true)`);
  const childArticle = await db.execute(sql`select id from articles where slug = ${childArticleSlug} limit 1`);
  if (childArticle.rows.length === 0) {
    await db.insert(articles).values({
      kbId: topicIndex.get("topic-food") ?? 1,
      parentId: 1,
      title: "二食堂麻辣烫价格补充",
      slug: childArticleSlug,
      content: "# 二食堂麻辣烫价格补充\n\n## 当前价格区间\n\n- 素菜为主：一般在 12-15 元\n- 加牛肉丸、培根等荤菜：通常会到 16-20 元\n- 晚高峰排队时间更长，建议提前 10-15 分钟去\n\n## 点单建议\n\n第一次吃可以先选基础套餐，再按口味补荤菜，避免一上来夹太多导致超预算。",
      authorId: 2,
      status: "published" as const,
      helpfulCount: 0,
      changedCount: 0,
      readCount: 0,
      favoriteCount: 0,
      sortOrder: SEED_ARTICLES.length + 1,
    });
  }

  await db
    .insert(posts)
    .values([
      {
        id: 1,
        kbId: topicIndex.get("topic-food") ?? 1,
        content: "三食堂今天新开了烤冷面窗口，比外面路边摊好吃，8块钱一大份。",
        tags: ["share"],
        authorId: 2,
        replyCount: 0,
        solved: false,
        readCount: 0,
        favoriteCount: 0,
      },
      {
        id: 2,
        kbId: topicIndex.get("topic-secondhand") ?? 1,
        content: "出一台二手电风扇，北苑同学可以直接来拿。",
        tags: ["secondhand"],
        authorId: 2,
        replyCount: 0,
        solved: false,
        readCount: 0,
        favoriteCount: 0,
      },
    ])
    .onConflictDoNothing();

  await db.execute(sql`select setval('cities_id_seq', coalesce((select max(id) from cities), 1), true)`);
  await db.execute(sql`select setval('users_id_seq', coalesce((select max(id) from users), 1), true)`);
  await db.execute(sql`select setval('legal_documents_id_seq', coalesce((select max(id) from legal_documents), 1), true)`);
  await db.execute(sql`select setval('content_records_id_seq', coalesce((select max(id) from content_records), 1), true)`);
  await db.execute(sql`select setval('knowledge_bases_id_seq', coalesce((select max(id) from knowledge_bases), 1), true)`);
  await db.execute(sql`select setval('articles_id_seq', coalesce((select max(id) from articles), 1), true)`);
  await db.execute(sql`select setval('posts_id_seq', coalesce((select max(id) from posts), 1), true)`);
  await db.execute(sql`select setval('search_documents_id_seq', coalesce((select max(id) from search_documents), 1), true)`);

  const searchDocuments = await refreshSearchDocumentsInDb();

  console.log(
    JSON.stringify({
      skipped: false,
      reset: true,
      spaces: SEED_TOPICS.length,
      articles: SEED_ARTICLES.length,
      posts: 2,
      searchDocuments,
    }),
  );
}

seed()
  .finally(async () => {
    await pool?.end();
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
