import { SEED_ARTICLES, SEED_TOPICS } from "@ns/shared";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { hashPassword } from "../lib/auth";
import { articles, cities, knowledgeBases, legalDocuments, posts, siteConfigs, trustEvents, users } from "../db/schema";
import { db, pool } from "../db/client";
import { refreshSearchDocumentsInDb } from "../data/postgres";

config();

const topicIndex = new Map(SEED_TOPICS.map((topic, index) => [topic.id, index + 1]));

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
