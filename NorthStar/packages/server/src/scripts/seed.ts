import { SEED_ARTICLES, SEED_TOPICS } from "@ns/shared";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { hashPassword } from "../lib/auth";
import { articles, cities, knowledgeBases, posts, trustEvents, users } from "../db/schema";
import { db, pool } from "../db/client";

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

  await db
    .insert(cities)
    .values({ id: 1, code: "heihe", name: "黑河学院", isActive: true })
    .onConflictDoNothing();

  await db
    .insert(users)
    .values([
      {
        id: 1,
        username: "zhang",
        nickname: "张同学",
        passwordHash: hashPassword("password"),
        school: "黑河学院",
        cityId: 1,
        trustLevel: "user",
      },
      {
        id: 2,
        username: "editor",
        nickname: "盘根编辑",
        passwordHash: hashPassword("password"),
        school: "黑河学院",
        cityId: 1,
        trustLevel: "author",
      },
    ])
    .onConflictDoUpdate({
      target: users.username,
      set: {
        nickname: sql`excluded.nickname`,
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
  const childArticle = await db.execute(sql`select id from articles where slug = ${childArticleSlug} limit 1`);
  if (childArticle.rows.length === 0) {
    await db.insert(articles).values({
      kbId: topicIndex.get("topic-food") ?? 1,
      parentId: 1,
      title: "二食堂麻辣烫价格补充",
      slug: childArticleSlug,
      content: "# 二食堂麻辣烫价格补充\n\n这是父子文章结构的 seed 示例，用于验证空间页最多一层嵌套展示。",
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
  await db.execute(sql`select setval('knowledge_bases_id_seq', coalesce((select max(id) from knowledge_bases), 1), true)`);
  await db.execute(sql`select setval('articles_id_seq', coalesce((select max(id) from articles), 1), true)`);
  await db.execute(sql`select setval('posts_id_seq', coalesce((select max(id) from posts), 1), true)`);

  console.log(
    JSON.stringify({
      skipped: false,
      spaces: SEED_TOPICS.length,
      articles: SEED_ARTICLES.length,
      posts: 2,
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
