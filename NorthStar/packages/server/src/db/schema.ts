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
  "auth_invite",
  "feedback",
  "changed",
  "expiry",
  "claim",
  "reply",
  "trust",
]);

export const platformRoleEnum = pgEnum("platform_role", [
  "visitor",
  "user",
  "editor",
  "reviewer",
  "operator",
  "admin",
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
    username: varchar("username", { length: 50 }).notNull(),
    email: varchar("email", { length: 255 }),
    githubId: varchar("github_id", { length: 64 }),
    site: varchar("site", { length: 10 }).default("cn").notNull(),
    role: platformRoleEnum("role").default("user").notNull(),
    phone: varchar("phone", { length: 20 }),
    wxOpenId: varchar("wx_open_id", { length: 255 }),
    nickname: varchar("nickname", { length: 50 }).notNull(),
    passwordHash: text("password_hash"),
    emailVerified: boolean("email_verified").default(false).notNull(),
    emailVerificationToken: varchar("email_verification_token", { length: 128 }),
    emailVerificationExpiresAt: timestamp("email_verification_expires_at", { mode: "date" }),
    passwordResetToken: varchar("password_reset_token", { length: 128 }),
    passwordResetExpiresAt: timestamp("password_reset_expires_at", { mode: "date" }),
    tokenInvalidBefore: timestamp("token_invalid_before", { mode: "date" }),
    disabledAt: timestamp("disabled_at", { mode: "date" }),
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
    uniqueIndex("users_username_idx").on(table.username),
    uniqueIndex("users_email_idx").on(table.email),
    uniqueIndex("users_github_id_idx").on(table.githubId),
    uniqueIndex("users_wx_open_id_idx").on(table.wxOpenId),
    index("users_site_idx").on(table.site),
    index("users_role_idx").on(table.role),
    index("users_token_invalid_before_idx").on(table.tokenInvalidBefore),
    index("users_trust_level_idx").on(table.trustLevel),
    index("users_city_id_idx").on(table.cityId),
  ]
);

// ─── Platform / Admin 基础表 ───

export const siteConfigs = pgTable(
  "site_configs",
  {
    id: serial("id").primaryKey(),
    site: varchar("site", { length: 10 }).default("cn").notNull(),
    key: varchar("key", { length: 100 }).notNull(),
    value: jsonb("value").$type<Record<string, unknown>>().default({}).notNull(),
    updatedBy: integer("updated_by").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("site_configs_site_key_idx").on(table.site, table.key),
    index("site_configs_site_idx").on(table.site),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    actorId: integer("actor_id").references(() => users.id),
    site: varchar("site", { length: 10 }).notNull(),
    targetType: varchar("target_type", { length: 50 }).notNull(),
    targetId: varchar("target_id", { length: 100 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    before: jsonb("before").$type<Record<string, unknown> | null>(),
    after: jsonb("after").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_site_idx").on(table.site),
    index("audit_logs_actor_id_idx").on(table.actorId),
    index("audit_logs_target_idx").on(table.targetType, table.targetId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export const moderationTasks = pgTable(
  "moderation_tasks",
  {
    id: serial("id").primaryKey(),
    site: varchar("site", { length: 10 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    status: varchar("status", { length: 30 }).default("pending").notNull(),
    targetType: varchar("target_type", { length: 50 }).notNull(),
    targetId: varchar("target_id", { length: 100 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    reason: text("reason"),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
    reporterId: integer("reporter_id").references(() => users.id),
    assigneeId: integer("assignee_id").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("moderation_tasks_site_idx").on(table.site),
    index("moderation_tasks_status_idx").on(table.status),
    index("moderation_tasks_type_idx").on(table.type),
    index("moderation_tasks_target_idx").on(table.targetType, table.targetId),
    index("moderation_tasks_created_at_idx").on(table.createdAt),
  ],
);

export const legalDocuments = pgTable(
  "legal_documents",
  {
    id: serial("id").primaryKey(),
    site: varchar("site", { length: 10 }).notNull(),
    type: varchar("type", { length: 30 }).notNull(),
    version: varchar("version", { length: 50 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    content: text("content").notNull(),
    publishedAt: timestamp("published_at", { mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("legal_documents_site_type_version_idx").on(table.site, table.type, table.version),
    index("legal_documents_site_type_idx").on(table.site, table.type),
  ],
);

export const userConsents = pgTable(
  "user_consents",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    site: varchar("site", { length: 10 }).notNull(),
    documentType: varchar("document_type", { length: 30 }).notNull(),
    version: varchar("version", { length: 50 }).notNull(),
    consentedAt: timestamp("consented_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_consents_user_doc_version_idx").on(table.userId, table.documentType, table.version),
    index("user_consents_site_idx").on(table.site),
    index("user_consents_user_id_idx").on(table.userId),
  ],
);

export const accountDeletionRequests = pgTable(
  "account_deletion_requests",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    site: varchar("site", { length: 10 }).notNull(),
    status: varchar("status", { length: 30 }).default("pending").notNull(),
    reason: text("reason"),
    requestedAt: timestamp("requested_at", { mode: "date" }).defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at", { mode: "date" }),
    handledBy: integer("handled_by").references(() => users.id),
  },
  (table) => [
    index("account_deletion_requests_user_id_idx").on(table.userId),
    index("account_deletion_requests_site_status_idx").on(table.site, table.status),
  ],
);

export const applicationRequests = pgTable(
  "application_requests",
  {
    id: serial("id").primaryKey(),
    site: varchar("site", { length: 10 }).default("com").notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    useCase: text("use_case").notNull(),
    status: varchar("status", { length: 30 }).default("pending").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at", { mode: "date" }),
    reviewerId: integer("reviewer_id").references(() => users.id),
  },
  (table) => [
    index("application_requests_site_idx").on(table.site),
    index("application_requests_status_idx").on(table.status),
    index("application_requests_email_idx").on(table.email),
  ],
);

export const inviteCodes = pgTable(
  "invite_codes",
  {
    id: serial("id").primaryKey(),
    site: varchar("site", { length: 10 }).default("com").notNull(),
    code: varchar("code", { length: 80 }).notNull(),
    maxUses: integer("max_uses").default(1).notNull(),
    usedCount: integer("used_count").default(0).notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("invite_codes_code_idx").on(table.code),
    index("invite_codes_site_idx").on(table.site),
    index("invite_codes_created_by_idx").on(table.createdBy),
  ],
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
    solved: boolean("solved").default(false).notNull(),
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
    starCount: integer("star_count").default(0).notNull(),
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
    site: varchar("site", { length: 10 }).notNull(),
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
    index("notify_site_idx").on(table.site),
    index("notify_is_read_idx").on(table.isRead),
  ]
);

// ─── Search Logs（搜索日志）───

export const searchLogs = pgTable(
  "search_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    query: text("query").notNull(),
    resultCount: integer("result_count").default(0).notNull(),
    usedAi: boolean("used_ai").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("search_log_query_idx").on(table.query),
    index("search_log_created_at_idx").on(table.createdAt),
    index("search_log_user_id_idx").on(table.userId),
  ]
);

export const searchDocuments = pgTable(
  "search_documents",
  {
    id: serial("id").primaryKey(),
    site: varchar("site", { length: 10 }).default("cn").notNull(),
    targetType: varchar("target_type", { length: 30 }).notNull(),
    targetId: varchar("target_id", { length: 100 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    spaceSlug: varchar("space_slug", { length: 100 }),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("search_documents_target_idx").on(table.site, table.targetType, table.targetId),
    index("search_documents_site_idx").on(table.site),
    index("search_documents_type_idx").on(table.targetType),
    index("search_documents_title_idx").on(table.title),
    index("search_documents_updated_at_idx").on(table.updatedAt),
  ],
);

export const contentRecords = pgTable(
  "content_records",
  {
    id: serial("id").primaryKey(),
    site: varchar("site", { length: 10 }).default("com").notNull(),
    contentType: varchar("content_type", { length: 30 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    summary: text("summary").notNull(),
    body: text("body").notNull(),
    domain: varchar("domain", { length: 30 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    status: varchar("status", { length: 30 }).default("draft").notNull(),
    ownerId: integer("owner_id").references(() => users.id),
    publishedAt: timestamp("published_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("content_records_site_type_slug_idx").on(table.site, table.contentType, table.slug),
    index("content_records_site_idx").on(table.site),
    index("content_records_type_idx").on(table.contentType),
    index("content_records_status_idx").on(table.status),
    index("content_records_owner_id_idx").on(table.ownerId),
  ],
);

export const contentVersions = pgTable(
  "content_versions",
  {
    id: serial("id").primaryKey(),
    contentRecordId: integer("content_record_id")
      .references(() => contentRecords.id)
      .notNull(),
    version: integer("version").notNull(),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
    editorId: integer("editor_id").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("content_versions_record_version_idx").on(table.contentRecordId, table.version),
    index("content_versions_record_idx").on(table.contentRecordId),
    index("content_versions_editor_idx").on(table.editorId),
  ],
);

export const solutions = pgTable(
  "solutions",
  {
    id: serial("id").primaryKey(),
    site: varchar("site", { length: 10 }).default("com").notNull(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    targetGoal: text("target_goal").notNull(),
    toolIds: jsonb("tool_ids").$type<string[]>().default([]).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("solutions_site_idx").on(table.site),
    index("solutions_user_id_idx").on(table.userId),
    index("solutions_created_at_idx").on(table.createdAt),
  ],
);

export const solutionFeedbacks = pgTable(
  "solution_feedbacks",
  {
    id: serial("id").primaryKey(),
    solutionId: integer("solution_id")
      .references(() => solutions.id)
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    helpful: boolean("helpful").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("solution_feedbacks_solution_idx").on(table.solutionId),
    index("solution_feedbacks_user_idx").on(table.userId),
  ],
);

export const solutionExports = pgTable(
  "solution_exports",
  {
    id: serial("id").primaryKey(),
    solutionId: integer("solution_id")
      .references(() => solutions.id)
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    format: varchar("format", { length: 10 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("solution_exports_solution_idx").on(table.solutionId),
    index("solution_exports_user_idx").on(table.userId),
  ],
);

export const compassFavorites = pgTable(
  "compass_favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    targetType: varchar("target_type", { length: 30 }).notNull(),
    targetId: varchar("target_id", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("compass_favorites_unique_idx").on(table.userId, table.targetType, table.targetId),
    index("compass_favorites_user_idx").on(table.userId),
  ],
);

export const behaviorEvents = pgTable(
  "behavior_events",
  {
    id: serial("id").primaryKey(),
    site: varchar("site", { length: 10 }).notNull(),
    userId: integer("user_id").references(() => users.id),
    event: varchar("event", { length: 80 }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("behavior_events_site_idx").on(table.site),
    index("behavior_events_user_idx").on(table.userId),
    index("behavior_events_event_idx").on(table.event),
    index("behavior_events_created_at_idx").on(table.createdAt),
  ],
);

export const aiCallLogs = pgTable(
  "ai_call_logs",
  {
    id: serial("id").primaryKey(),
    site: varchar("site", { length: 10 }).notNull(),
    userId: integer("user_id").references(() => users.id),
    route: varchar("route", { length: 120 }).notNull(),
    mode: varchar("mode", { length: 20 }).notNull(),
    fallbackReason: varchar("fallback_reason", { length: 80 }).default("").notNull(),
    latencyMs: integer("latency_ms").default(0).notNull(),
    promptTokens: integer("prompt_tokens").default(0).notNull(),
    completionTokens: integer("completion_tokens").default(0).notNull(),
    costCents: integer("cost_cents").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("ai_call_logs_site_idx").on(table.site),
    index("ai_call_logs_user_idx").on(table.userId),
    index("ai_call_logs_route_idx").on(table.route),
    index("ai_call_logs_mode_idx").on(table.mode),
    index("ai_call_logs_created_at_idx").on(table.createdAt),
  ],
);

export const quotas = pgTable(
  "quotas",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    site: varchar("site", { length: 10 }).notNull(),
    aiCreditsRemaining: integer("ai_credits_remaining").default(10).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("quotas_user_site_idx").on(table.userId, table.site),
    index("quotas_user_idx").on(table.userId),
  ],
);

export const quotaLedger = pgTable(
  "quota_ledger",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    site: varchar("site", { length: 10 }).notNull(),
    delta: integer("delta").notNull(),
    reason: varchar("reason", { length: 80 }).notNull(),
    balanceAfter: integer("balance_after").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("quota_ledger_user_idx").on(table.userId),
    index("quota_ledger_site_idx").on(table.site),
  ],
);

export const paymentOrders = pgTable(
  "payment_orders",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    site: varchar("site", { length: 10 }).notNull(),
    provider: varchar("provider", { length: 30 }).default("manual").notNull(),
    status: varchar("status", { length: 30 }).default("pending").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 10 }).default("CNY").notNull(),
    credits: integer("credits").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    paidAt: timestamp("paid_at", { mode: "date" }),
  },
  (table) => [
    index("payment_orders_user_idx").on(table.userId),
    index("payment_orders_site_idx").on(table.site),
    index("payment_orders_status_idx").on(table.status),
  ],
);

// ─── Reports（举报）───

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    reporterId: integer("reporter_id").references(() => users.id),
    targetType: varchar("target_type", { length: 20 }).notNull(), // 'article' | 'post'
    targetId: integer("target_id").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("report_target_idx").on(table.targetType, table.targetId),
    index("report_reporter_id_idx").on(table.reporterId),
    index("report_created_at_idx").on(table.createdAt),
  ]
);

// ─── Trust Events（信任事件）───

export const trustEvents = pgTable(
  "trust_events",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    points: integer("points").notNull(),
    relatedType: varchar("related_type", { length: 20 }),
    relatedId: integer("related_id"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("trust_event_user_id_idx").on(table.userId),
    index("trust_event_action_idx").on(table.action),
    index("trust_event_related_idx").on(table.relatedType, table.relatedId),
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
  searchLogs: many(searchLogs),
  reports: many(reports),
  trustEvents: many(trustEvents),
  moderationReports: many(moderationTasks, { relationName: "moderationReporter" }),
  moderationAssignments: many(moderationTasks, { relationName: "moderationAssignee" }),
  auditLogs: many(auditLogs),
  consents: many(userConsents),
  deletionRequests: many(accountDeletionRequests, { relationName: "deletionRequester" }),
  handledDeletionRequests: many(accountDeletionRequests, { relationName: "deletionHandler" }),
  solutions: many(solutions),
  solutionFeedbacks: many(solutionFeedbacks),
  solutionExports: many(solutionExports),
  compassFavorites: many(compassFavorites),
  behaviorEvents: many(behaviorEvents),
  quotas: many(quotas),
  quotaLedger: many(quotaLedger),
  paymentOrders: many(paymentOrders),
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

export const searchLogsRelations = relations(searchLogs, ({ one }) => ({
  user: one(users, { fields: [searchLogs.userId], references: [users.id] }),
}));

export const searchDocumentsRelations = relations(searchDocuments, ({ one }) => ({
  space: one(knowledgeBases, { fields: [searchDocuments.spaceSlug], references: [knowledgeBases.slug] }),
}));

export const contentRecordsRelations = relations(contentRecords, ({ one, many }) => ({
  owner: one(users, { fields: [contentRecords.ownerId], references: [users.id] }),
  versions: many(contentVersions),
}));

export const contentVersionsRelations = relations(contentVersions, ({ one }) => ({
  content: one(contentRecords, { fields: [contentVersions.contentRecordId], references: [contentRecords.id] }),
  editor: one(users, { fields: [contentVersions.editorId], references: [users.id] }),
}));

export const solutionsRelations = relations(solutions, ({ one, many }) => ({
  user: one(users, { fields: [solutions.userId], references: [users.id] }),
  feedbacks: many(solutionFeedbacks),
  exports: many(solutionExports),
}));

export const solutionFeedbacksRelations = relations(solutionFeedbacks, ({ one }) => ({
  solution: one(solutions, { fields: [solutionFeedbacks.solutionId], references: [solutions.id] }),
  user: one(users, { fields: [solutionFeedbacks.userId], references: [users.id] }),
}));

export const solutionExportsRelations = relations(solutionExports, ({ one }) => ({
  solution: one(solutions, { fields: [solutionExports.solutionId], references: [solutions.id] }),
  user: one(users, { fields: [solutionExports.userId], references: [users.id] }),
}));

export const compassFavoritesRelations = relations(compassFavorites, ({ one }) => ({
  user: one(users, { fields: [compassFavorites.userId], references: [users.id] }),
}));

export const behaviorEventsRelations = relations(behaviorEvents, ({ one }) => ({
  user: one(users, { fields: [behaviorEvents.userId], references: [users.id] }),
}));

export const aiCallLogsRelations = relations(aiCallLogs, ({ one }) => ({
  user: one(users, { fields: [aiCallLogs.userId], references: [users.id] }),
}));

export const quotasRelations = relations(quotas, ({ one }) => ({
  user: one(users, { fields: [quotas.userId], references: [users.id] }),
}));

export const quotaLedgerRelations = relations(quotaLedger, ({ one }) => ({
  user: one(users, { fields: [quotaLedger.userId], references: [users.id] }),
}));

export const paymentOrdersRelations = relations(paymentOrders, ({ one }) => ({
  user: one(users, { fields: [paymentOrders.userId], references: [users.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, { fields: [reports.reporterId], references: [users.id] }),
}));

export const trustEventsRelations = relations(trustEvents, ({ one }) => ({
  user: one(users, { fields: [trustEvents.userId], references: [users.id] }),
}));

export const siteConfigsRelations = relations(siteConfigs, ({ one }) => ({
  updater: one(users, { fields: [siteConfigs.updatedBy], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, { fields: [auditLogs.actorId], references: [users.id] }),
}));

export const moderationTasksRelations = relations(moderationTasks, ({ one }) => ({
  reporter: one(users, {
    fields: [moderationTasks.reporterId],
    references: [users.id],
    relationName: "moderationReporter",
  }),
  assignee: one(users, {
    fields: [moderationTasks.assigneeId],
    references: [users.id],
    relationName: "moderationAssignee",
  }),
}));

export const userConsentsRelations = relations(userConsents, ({ one }) => ({
  user: one(users, { fields: [userConsents.userId], references: [users.id] }),
}));

export const accountDeletionRequestsRelations = relations(accountDeletionRequests, ({ one }) => ({
  user: one(users, {
    fields: [accountDeletionRequests.userId],
    references: [users.id],
    relationName: "deletionRequester",
  }),
  handler: one(users, {
    fields: [accountDeletionRequests.handledBy],
    references: [users.id],
    relationName: "deletionHandler",
  }),
}));

export const applicationRequestsRelations = relations(applicationRequests, ({ one }) => ({
  reviewer: one(users, { fields: [applicationRequests.reviewerId], references: [users.id] }),
}));

export const inviteCodesRelations = relations(inviteCodes, ({ one }) => ({
  creator: one(users, { fields: [inviteCodes.createdBy], references: [users.id] }),
}));
