import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───

export const trustLevelEnum = pgEnum("trust_level", [
  "guest",      // Lv0 游客
  "user",       // Lv1 注册用户
  "active",     // Lv2 活跃用户
  "author",     // Lv3 认证作者
  "senior",     // Lv4 资深作者
  "admin",      // 管理员
]);

export const articleStatusEnum = pgEnum("article_status", [
  "draft",
  "published",
  "archived",
]);

export const authStatusEnum = pgEnum("auth_status", [
  "pending",
  "approved",
  "rejected",
]);

export const feedbackTypeEnum = pgEnum("feedback_type", [
  "helpful",
  "changed",
]);

export const activityActionEnum = pgEnum("activity_action", [
  "read",
  "helpful",
  "changed",
  "favorite",
  "update",
  "reply",
]);

export const notifyTypeEnum = pgEnum("notify_type", [
  "feedback_changed",
  "low_activity",
  "auth_result",
  "claim_request",
]);

// ─── Cities / Sites（多城市预留）───

export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 50 }).notNull(),
  domain: varchar("domain", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Users ───

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    phone: varchar("phone", { length: 20 }),
    wxOpenId: varchar("wx_open_id", { length: 255 }),
    nickname: varchar("nickname", { length: 50 }).notNull(),
    avatar: text("avatar"),
    school: varchar("school", { length: 100 }),
    cityId: integer("city_id").references(() => cities.id),
    trustLevel: trustLevelEnum("trust_level").default("user").notNull(),
    postCount: integer("post_count").default(0).notNull(),
    articleCount: integer("article_count").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
    lastActiveAt: timestamp("last_active_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_phone_idx").on(table.phone),
    uniqueIndex("users_wx_open_id_idx").on(table.wxOpenId),
    index("users_trust_level_idx").on(table.trustLevel),
    index("users_city_id_idx").on(table.cityId),
  ]
);

// ─── Knowledge Bases ───

export const knowledgeBases = pgTable(
  "knowledge_bases",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    title: varchar("title", { length: 100 }).notNull(),
    description: text("description"),
    ownerId: integer("owner_id")
      .references(() => users.id)
      .notNull(),
    category: varchar("category", { length: 50 }),
    cover: text("cover"),
    isClaimed: boolean("is_claimed").default(false).notNull(),
    claimedBy: integer("claimed_by").references(() => users.id),
    articleCount: integer("article_count").default(0).notNull(),
    favoriteCount: integer("favorite_count").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("kb_owner_id_idx").on(table.ownerId),
    index("kb_category_idx").on(table.category),
  ]
);

// ─── Articles ───

export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    kbId: integer("kb_id")
      .references(() => knowledgeBases.id)
      .notNull(),
    parentId: integer("parent_id"), // 自引用，嵌套子文章
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    content: text("content").notNull(),
    toc: jsonb("toc").$type<{ level: number; text: string; id: string }[]>(),
    cover: text("cover"),
    authorId: integer("author_id")
      .references(() => users.id)
      .notNull(),
    status: articleStatusEnum("status").default("published").notNull(),
    confirmedAt: timestamp("confirmed_at", { mode: "date" }),
    helpfulCount: integer("helpful_count").default(0).notNull(),
    changedCount: integer("changed_count").default(0).notNull(),
    readCount: integer("read_count").default(0).notNull(),
    favoriteCount: integer("favorite_count").default(0).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("article_kb_id_idx").on(table.kbId),
    index("article_parent_id_idx").on(table.parentId),
    index("article_author_id_idx").on(table.authorId),
    index("article_status_idx").on(table.status),
    index("article_created_at_idx").on(table.createdAt),
  ]
);

// ─── Posts（帖子）───

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    kbId: integer("kb_id").references(() => knowledgeBases.id),
    title: varchar("title", { length: 200 }),
    content: text("content").notNull(),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    authorId: integer("author_id")
      .references(() => users.id)
      .notNull(),
    replyCount: integer("reply_count").default(0).notNull(),
    readCount: integer("read_count").default(0).notNull(),
    favoriteCount: integer("favorite_count").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("post_author_id_idx").on(table.authorId),
    index("post_kb_id_idx").on(table.kbId),
    index("post_created_at_idx").on(table.createdAt),
  ]
);

// ─── Post Replies ───

export const postReplies = pgTable(
  "post_replies",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .references(() => posts.id)
      .notNull(),
    content: text("content").notNull(),
    authorId: integer("author_id")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("reply_post_id_idx").on(table.postId),
    index("reply_author_id_idx").on(table.authorId),
  ]
);

// ─── Feedbacks（有帮助 / 有变化）───

export const feedbacks = pgTable(
  "feedbacks",
  {
    id: serial("id").primaryKey(),
    targetType: varchar("target_type", { length: 20 }).notNull(), // 'article' | 'post'
    targetId: integer("target_id").notNull(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    type: feedbackTypeEnum("type").notNull(),
    changedNote: text("changed_note"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("feedback_target_idx").on(table.targetType, table.targetId),
    index("feedback_user_id_idx").on(table.userId),
  ]
);

// ─── Activities（活动记录，用于排序）───

export const activities = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),
    targetType: varchar("target_type", { length: 20 }).notNull(), // 'article' | 'post' | 'knowledge_base'
    targetId: integer("target_id").notNull(),
    userId: integer("user_id").references(() => users.id),
    action: activityActionEnum("action").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("activity_target_idx").on(table.targetType, table.targetId),
    index("activity_created_at_idx").on(table.createdAt),
    index("activity_user_id_idx").on(table.userId),
  ]
);

// ─── Auth Requests（认证申请）───

export const authRequests = pgTable(
  "auth_requests",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    status: authStatusEnum("status").default("pending").notNull(),
    reason: text("reason"),
    portfolio: text("portfolio"), // 代表作品链接或描述
    reviewedBy: integer("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { mode: "date" }),
    rejectReason: text("reject_reason"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("auth_user_id_idx").on(table.userId),
    index("auth_status_idx").on(table.status),
  ]
);

// ─── Favorites（收藏）───

export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    targetType: varchar("target_type", { length: 20 }).notNull(), // 'article' | 'knowledge_base'
    targetId: integer("target_id").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("favorite_unique_idx").on(
      table.userId,
      table.targetType,
      table.targetId
    ),
  ]
);

// ─── Notifications（通知）───

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    type: notifyTypeEnum("type").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    content: text("content"),
    isRead: boolean("is_read").default(false).notNull(),
    relatedId: integer("related_id"),
    relatedType: varchar("related_type", { length: 20 }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("notify_user_id_idx").on(table.userId),
    index("notify_is_read_idx").on(table.isRead),
  ]
);

// ─── Relations ───

export const usersRelations = relations(users, ({ many, one }) => ({
  knowledgeBases: many(knowledgeBases),
  articles: many(articles),
  posts: many(posts),
  replies: many(postReplies),
  feedbacks: many(feedbacks),
  favorites: many(favorites),
  notifications: many(notifications),
  city: one(cities, { fields: [users.cityId], references: [cities.id] }),
  authRequest: one(authRequests, { fields: [users.id], references: [authRequests.userId] }),
}));

export const citiesRelations = relations(cities, ({ many }) => ({
  users: many(users),
}));

export const knowledgeBasesRelations = relations(
  knowledgeBases,
  ({ one, many }) => ({
    owner: one(users, { fields: [knowledgeBases.ownerId], references: [users.id] }),
    claimedByUser: one(users, { fields: [knowledgeBases.claimedBy], references: [users.id] }),
    articles: many(articles),
    posts: many(posts),
  })
);

export const articlesRelations = relations(articles, ({ one, many }) => ({
  kb: one(knowledgeBases, { fields: [articles.kbId], references: [knowledgeBases.id] }),
  author: one(users, { fields: [articles.authorId], references: [users.id] }),
  parent: one(articles, { fields: [articles.parentId], references: [articles.id] }),
  children: many(articles),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  kb: one(knowledgeBases, { fields: [posts.kbId], references: [knowledgeBases.id] }),
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  replies: many(postReplies),
}));

export const postRepliesRelations = relations(postReplies, ({ one }) => ({
  post: one(posts, { fields: [postReplies.postId], references: [posts.id] }),
  author: one(users, { fields: [postReplies.authorId], references: [users.id] }),
}));

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  user: one(users, { fields: [feedbacks.userId], references: [users.id] }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
}));

export const authRequestsRelations = relations(authRequests, ({ one }) => ({
  user: one(users, { fields: [authRequests.userId], references: [users.id] }),
  reviewer: one(users, { fields: [authRequests.reviewedBy], references: [users.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
