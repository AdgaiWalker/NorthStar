import { beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { app } from "../src/index";
import { db } from "../src/db/client";
import { activities, articles, favorites, feedbacks, notifications, postReplies, posts, reports, searchLogs, trustEvents, users } from "../src/db/schema";
import {
  createAuthInviteNotificationInDb,
  createContentExpiryNotificationInDb,
  createSpaceClaimNotificationInDb,
} from "../src/data/postgres";

async function login(username = "zhang") {
  const response = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password: "password",
    }),
  });
  const body = await response.json();
  return `Bearer ${body.token}`;
}

async function register(username: string) {
  const response = await app.request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password: "password",
    }),
  });
  const body = await response.json();
  return `Bearer ${body.token}`;
}

async function countRows(table: Parameters<NonNullable<typeof db>["select"]>[0] extends never ? never : any) {
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)::int` }).from(table);
  return result[0].count;
}

describe("frontlife API", () => {
  beforeEach(async () => {
    if (!db) return;

    await db
      .delete(trustEvents)
      .where(sql`${trustEvents.userId} in (select id from users where username in ('zhang', 'editor'))`);

    await db
      .update(users)
      .set({
        trustLevel: "user",
        postCount: 0,
        articleCount: 0,
      })
      .where(eq(users.username, "zhang"));

    await db
      .update(users)
      .set({
        trustLevel: "author",
        postCount: 0,
        articleCount: 0,
      })
      .where(eq(users.username, "editor"));
  });

  it("returns health status", async () => {
    const response = await app.request("/api/health");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
  });

  it("returns spaces and a space detail", async () => {
    const listResponse = await app.request("/api/spaces");
    const listBody = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listBody.spaces.length).toBeGreaterThan(0);

    const detailResponse = await app.request("/api/spaces/food");
    const detailBody = await detailResponse.json();

    expect(detailResponse.status).toBe(200);
    expect(detailBody.space.id).toBe("food");
    expect(Array.isArray(detailBody.articles)).toBe(true);
  });

  it("returns an article detail", async () => {
    const response = await app.request("/api/articles/campus-a1");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.article.id).toBe("campus-a1");
    expect(body.article.content).toContain("麻辣烫");
  });

  it("lists and creates posts", async () => {
    const authorization = await login();
    const beforeCount = await countRows(posts);
    const trustBefore = await countRows(trustEvents);

    const listResponse = await app.request("/api/spaces/food/posts");
    const listBody = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listBody.posts)).toBe(true);

    const createResponse = await app.request("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({
        spaceId: "food",
        content: "测试帖子",
        tags: ["share"],
      }),
    });
    const createBody = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createBody.post.content).toBe("测试帖子");
    expect(await countRows(posts)).toBe(beforeCount + 1);
    expect(await countRows(trustEvents)).toBe(trustBefore + 1);

    const notificationResponse = await app.request("/api/notifications", {
      headers: { Authorization: authorization },
    });
    const notificationBody = await notificationResponse.json();
    expect(
      notificationBody.notifications.some((item: { title: string }) => item.title === "权限已升级"),
    ).toBe(true);
  });

  it("records helpful and changed feedback", async () => {
    const authorization = await login();
    const editorAuthorization = await login("editor");
    const feedbackBefore = await countRows(feedbacks);
    const activityBefore = await countRows(activities);
    const trustBefore = await countRows(trustEvents);

    const helpfulResponse = await app.request("/api/articles/campus-a1/helpful", {
      method: "POST",
      headers: { Authorization: authorization },
    });
    const helpfulBody = await helpfulResponse.json();

    expect(helpfulResponse.status).toBe(200);
    expect(helpfulBody.helpfulCount).toBeGreaterThan(0);
    expect(await countRows(feedbacks)).toBe(feedbackBefore + 1);
    expect(await countRows(activities)).toBe(activityBefore + 1);
    expect(await countRows(trustEvents)).toBe(trustBefore + 1);

    const editorNotifications = await app.request("/api/notifications", {
      headers: { Authorization: editorAuthorization },
    });
    const editorNotificationBody = await editorNotifications.json();
    expect(
      editorNotificationBody.notifications.some((item: { title: string }) => item.title === "内容被确认有帮助"),
    ).toBe(true);

    const changedResponse = await app.request("/api/articles/campus-a1/changed", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ note: "营业时间有变化" }),
    });
    const changedBody = await changedResponse.json();

    expect(changedResponse.status).toBe(200);
    expect(changedBody.changedCount).toBeGreaterThan(0);
    expect(await countRows(feedbacks)).toBe(feedbackBefore + 2);

    const editorChangedNotifications = await app.request("/api/notifications", {
      headers: { Authorization: editorAuthorization },
    });
    const editorChangedNotificationBody = await editorChangedNotifications.json();
    expect(
      editorChangedNotificationBody.notifications.some((item: { title: string }) => item.title === "有人反馈内容有变化"),
    ).toBe(true);
  });

  it("returns notifications and marks one read", async () => {
    const authorization = await login();
    const beforeCount = await countRows(notifications);

    const postResponse = await app.request("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ spaceId: "food", content: "通知测试" }),
    });
    expect(postResponse.status).toBe(201);
    expect(await countRows(notifications)).toBeGreaterThan(beforeCount);

    const listResponse = await app.request("/api/notifications", {
      headers: { Authorization: authorization },
    });
    const listBody = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listBody.notifications.length).toBeGreaterThan(0);

    const readResponse = await app.request(`/api/notifications/${listBody.notifications[0].id}/read`, {
      method: "POST",
      headers: { Authorization: authorization },
    });
    const readBody = await readResponse.json();

    expect(readResponse.status).toBe(200);
    expect(readBody.notification.isRead).toBe(true);
    if (db) {
      const rows = await db
        .select({ isRead: notifications.isRead })
        .from(notifications)
        .where(eq(notifications.id, Number(listBody.notifications[0].id)));
      expect(rows[0].isRead).toBe(true);
    }
  });

  it("stores favorites and returns profile", async () => {
    const authorization = await login();
    const beforeCount = await countRows(favorites);

    const favoriteResponse = await app.request("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ targetType: "article", targetId: "campus-a1" }),
    });

    expect(favoriteResponse.status).toBe(201);
    expect(await countRows(favorites)).toBeGreaterThanOrEqual(beforeCount);

    const profileResponse = await app.request("/api/me/profile", {
      headers: { Authorization: authorization },
    });
    const profileBody = await profileResponse.json();

    expect(profileResponse.status).toBe(200);
    expect(profileBody.stats.favoriteCount).toBeGreaterThan(0);
  });

  it("returns permissions aligned with user capability boundaries", async () => {
    const zhangAuthorization = await login();
    const editorAuthorization = await login("editor");

    const zhangPermissionsResponse = await app.request("/api/me/permissions", {
      headers: { Authorization: zhangAuthorization },
    });
    const editorPermissionsResponse = await app.request("/api/me/permissions", {
      headers: { Authorization: editorAuthorization },
    });

    const visitorPermissionsResponse = await app.request("/api/me/permissions");

    expect(zhangPermissionsResponse.status).toBe(200);
    expect(await zhangPermissionsResponse.json()).toEqual({
      canPost: true,
      canWrite: false,
      canCreateSpace: false,
    });

    expect(editorPermissionsResponse.status).toBe(200);
    expect(await editorPermissionsResponse.json()).toEqual({
      canPost: true,
      canWrite: true,
      canCreateSpace: false,
    });

    expect(visitorPermissionsResponse.status).toBe(200);
    expect(await visitorPermissionsResponse.json()).toEqual({
      canPost: false,
      canWrite: false,
      canCreateSpace: false,
    });
  });

  it("stores replies, reports and search logs in database", async () => {
    const authorization = await login();
    const editorAuthorization = await login("editor");
    const postResponse = await app.request("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ spaceId: "food", content: "回复举报搜索测试" }),
    });
    const postBody = await postResponse.json();
    const replyBefore = await countRows(postReplies);
    const reportBefore = await countRows(reports);
    const searchBefore = await countRows(searchLogs);

    const replyResponse = await app.request(`/api/posts/${postBody.post.id}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: editorAuthorization },
      body: JSON.stringify({ content: "测试回复" }),
    });

    expect(replyResponse.status).toBe(201);
    expect(await countRows(postReplies)).toBe(replyBefore + 1);

    const replyNotificationResponse = await app.request("/api/notifications", {
      headers: { Authorization: authorization },
    });
    const replyNotificationBody = await replyNotificationResponse.json();
    expect(
      replyNotificationBody.notifications.some((item: { title: string }) => item.title === "有人回复了帖子"),
    ).toBe(true);

    const reportResponse = await app.request("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ targetType: "post", targetId: postBody.post.id, reason: "测试举报" }),
    });

    expect(reportResponse.status).toBe(201);
    expect(await countRows(reports)).toBe(reportBefore + 1);

    const searchResponse = await app.request("/api/search/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ query: `食堂-${Date.now()}`, resultCount: 1, usedAi: false }),
    });

    expect(searchResponse.status).toBe(201);
    expect(await countRows(searchLogs)).toBe(searchBefore + 1);
  });

  it("publishes an article into database", async () => {
    const authorization = await login("editor");
    const beforeCount = await countRows(articles);
    const title = `测试文章 ${Date.now()}`;

    const response = await app.request("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({
        spaceId: "food",
        title,
        content: `# ${title}\n\n这是一篇数据库发布测试文章。`,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.article.title).toBe(title);
    expect(await countRows(articles)).toBe(beforeCount + 1);
  });

  it("handles AI fallback and invalid AI input", async () => {
    const emptySearch = await app.request("/api/ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "" }),
    });
    expect(emptySearch.status).toBe(400);

    const sensitiveSearch = await app.request("/api/ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "自杀方法" }),
    });
    expect(sensitiveSearch.status).toBe(400);

    const streamResponse = await app.request("/api/ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "打印店在哪" }),
    });
    const streamText = await streamResponse.text();
    expect(streamResponse.status).toBe(200);
    expect(streamText).toContain("data:");
    expect(streamText).toContain("[DONE]");

    const oldKey = process.env.AI_API_KEY;
    delete process.env.AI_API_KEY;
    try {
      const writeResponse = await app.request("/api/ai/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "打印店攻略", spaceTitle: "校园省钱指南" }),
      });
      const writeBody = await writeResponse.json();
      expect(writeResponse.status).toBe(200);
      expect(writeBody.draft.title).toBeTruthy();

      const toolsResponse = await app.request("/api/ai/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: '用户目标: "写论文"' }],
          tools: [{ type: "function", function: { name: "emit_solution_v1" } }],
          tool_choice: { type: "function", function: { name: "emit_solution_v1" } },
        }),
      });
      const toolsBody = await toolsResponse.json();
      expect(toolsResponse.status).toBe(503);
      expect(toolsBody.fallbackReason).toBe("missing_key");
    } finally {
      if (oldKey) process.env.AI_API_KEY = oldKey;
    }
  });

  it("rejects protected writes without permission", async () => {
    const userAuthorization = await register(`plain-${Date.now()}`);

    const noTokenResponse = await app.request("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId: "food", content: "未登录发帖" }),
    });
    expect(noTokenResponse.status).toBe(401);

    const invalidTokenResponse = await app.request("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer bad-token" },
      body: JSON.stringify({ spaceId: "food", content: "错误 token 发帖" }),
    });
    expect(invalidTokenResponse.status).toBe(401);

    const forbiddenArticleResponse = await app.request("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: userAuthorization },
      body: JSON.stringify({
        spaceId: "food",
        title: "普通用户不能写文章",
        content: "# 普通用户不能写文章",
      }),
    });
    expect(forbiddenArticleResponse.status).toBe(403);
  });

  it("creates deferred notification types through service functions", async () => {
    const authorization = await login();
    const beforeCount = await countRows(notifications);

    await createAuthInviteNotificationInDb(1);
    const expiryTarget = await createContentExpiryNotificationInDb(1, "campus-a1");
    const claimTarget = await createSpaceClaimNotificationInDb(1, "food");

    expect(expiryTarget).toBeTruthy();
    expect(claimTarget).toBeTruthy();
    expect(await countRows(notifications)).toBe(beforeCount + 3);

    const response = await app.request("/api/notifications", {
      headers: { Authorization: authorization },
    });
    const body = await response.json();
    const types = body.notifications.map((item: { type: string }) => item.type);

    expect(types).toContain("auth_invite");
    expect(types).toContain("expiry");
    expect(types).toContain("claim");
  });
});
