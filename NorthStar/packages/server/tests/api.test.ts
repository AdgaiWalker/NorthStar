import { beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { app } from "../src/index";
import { db } from "../src/db/client";
import {
  accountDeletionRequests,
  activities,
  articles,
  auditLogs,
  favorites,
  feedbacks,
  knowledgeBases,
  legalDocuments,
  moderationTasks,
  notifications,
  postReplies,
  posts,
  reports,
  searchDocuments,
  searchLogs,
  siteConfigs,
  trustEvents,
  userConsents,
  users,
} from "../src/db/schema";
import { signToken } from "../src/lib/auth";
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
      email: `${username}@example.com`,
      password: "password",
    }),
  });
  const body = await response.json();
  return `Bearer ${body.token}`;
}

function adminAuthorization(site = "cn") {
  return `Bearer ${signToken({ sub: "1", name: "管理员", site, role: "admin" })}`;
}

function userAuthorization(site = "cn") {
  return `Bearer ${signToken({ sub: "1", name: "普通用户", site, role: "user" })}`;
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

  it("registers with username and email, then logs in by email", async () => {
    const username = `mail-user-${Date.now()}`;
    const email = `${username}@example.com`;

    const registerResponse = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password: "password" }),
    });
    const registerBody = await registerResponse.json();

    expect(registerResponse.status).toBe(201);
    expect(registerBody.user.username).toBe(username);
    expect(registerBody.user.email).toBe(email);

    const loginResponse = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: email, password: "password" }),
    });
    const loginBody = await loginResponse.json();

    expect(loginResponse.status).toBe(200);
    expect(loginBody.user.username).toBe(username);
  });

  it("handles identity register, email verification, password reset and invalidates old tokens", async () => {
    if (!db) return;

    const username = `identity-user-${Date.now()}`;
    const email = `${username}@example.com`;

    const registerResponse = await app.request("/api/identity/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password: "password",
        site: "cn",
        consentVersion: "2026-04-24",
      }),
    });
    const registerBody = await registerResponse.json();
    const oldAuthorization = `Bearer ${registerBody.data.token}`;

    expect(registerResponse.status).toBe(201);
    expect(registerBody.ok).toBe(true);
    expect(registerBody.data.user.username).toBe(username);
    expect(registerBody.data.user.emailVerified).toBe(false);

    const consentRows = await db
      .select()
      .from(userConsents)
      .where(eq(userConsents.userId, Number(registerBody.data.user.id)));
    expect(consentRows).toHaveLength(2);

    const userRows = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const verificationToken = userRows[0].emailVerificationToken;
    expect(verificationToken).toBeTruthy();

    const verifyResponse = await app.request("/api/identity/email/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: verificationToken }),
    });
    const verifyBody = await verifyResponse.json();

    expect(verifyResponse.status).toBe(200);
    expect(verifyBody.data.user.emailVerified).toBe(true);

    const loginResponse = await app.request("/api/identity/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: email, password: "password", site: "cn" }),
    });
    expect(loginResponse.status).toBe(200);

    const meResponse = await app.request("/api/identity/me", {
      headers: { Authorization: oldAuthorization },
    });
    expect(meResponse.status).toBe(200);

    const resetRequestResponse = await app.request("/api/identity/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, site: "cn" }),
    });
    const resetRequestBody = await resetRequestResponse.json();
    expect(resetRequestResponse.status).toBe(200);
    expect(resetRequestBody.data.resetToken).toBeTruthy();

    const resetConfirmResponse = await app.request("/api/identity/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetRequestBody.data.resetToken, password: "new-password" }),
    });
    expect(resetConfirmResponse.status).toBe(200);

    const invalidatedMeResponse = await app.request("/api/identity/me", {
      headers: { Authorization: oldAuthorization },
    });
    expect(invalidatedMeResponse.status).toBe(401);

    const newLoginResponse = await app.request("/api/identity/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: username, password: "new-password", site: "cn" }),
    });
    expect(newLoginResponse.status).toBe(200);
  });

  it("serves compliance documents, exports user data and processes deletion requests", async () => {
    if (!db) return;

    const username = `compliance-user-${Date.now()}`;
    const email = `${username}@example.com`;
    const registerResponse = await app.request("/api/identity/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password: "password",
        site: "cn",
        consentVersion: "2026-04-24",
      }),
    });
    const registerBody = await registerResponse.json();
    const authorization = `Bearer ${registerBody.data.token}`;

    const docsResponse = await app.request("/api/compliance/legal-documents?type=terms", {
      headers: { "x-pangen-site": "cn" },
    });
    const docsBody = await docsResponse.json();
    expect(docsResponse.status).toBe(200);
    expect(docsBody.data.items.length).toBeGreaterThan(0);
    expect(await countRows(legalDocuments)).toBeGreaterThanOrEqual(4);

    const exportResponse = await app.request("/api/compliance/data-export", {
      headers: { Authorization: authorization },
    });
    const exportBody = await exportResponse.json();
    expect(exportResponse.status).toBe(200);
    expect(exportBody.data.payload.user.username).toBe(username);

    const deletionResponse = await app.request("/api/compliance/account-deletions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ reason: "测试注销" }),
    });
    const deletionBody = await deletionResponse.json();
    expect(deletionResponse.status).toBe(201);
    expect(deletionBody.data.status).toBe("pending");
    expect(await countRows(accountDeletionRequests)).toBeGreaterThan(0);

    const forbiddenListResponse = await app.request("/api/compliance/account-deletions", {
      headers: { Authorization: authorization },
    });
    expect(forbiddenListResponse.status).toBe(403);

    const adminListResponse = await app.request("/api/compliance/account-deletions", {
      headers: {
        Authorization: adminAuthorization("cn"),
        "x-pangen-site": "cn",
      },
    });
    expect(adminListResponse.status).toBe(200);

    const auditBefore = await countRows(auditLogs);
    const completeResponse = await app.request(`/api/compliance/account-deletions/${deletionBody.data.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminAuthorization("cn"),
        "x-pangen-site": "cn",
      },
      body: JSON.stringify({ status: "completed" }),
    });
    expect(completeResponse.status).toBe(200);
    expect(await countRows(auditLogs)).toBe(auditBefore + 1);

    const invalidatedExportResponse = await app.request("/api/compliance/data-export", {
      headers: { Authorization: authorization },
    });
    expect(invalidatedExportResponse.status).toBe(401);
  });

  it("enforces site-aware admin access boundaries", async () => {
    const userCnResponse = await app.request("/api/admin/summary", {
      headers: {
        Authorization: userAuthorization("cn"),
        "x-pangen-site": "cn",
      },
    });

    expect(userCnResponse.status).toBe(403);

    const forbiddenResponse = await app.request("/api/admin/summary", {
      headers: {
        Authorization: userAuthorization("cn"),
        "x-pangen-site": "all",
      },
    });

    expect(forbiddenResponse.status).toBe(403);

    const adminResponse = await app.request("/api/admin/summary", {
      headers: {
        Authorization: adminAuthorization("cn"),
        "x-pangen-site": "all",
      },
    });
    const adminBody = await adminResponse.json();

    expect(adminResponse.status).toBe(200);
    expect(adminBody.ok).toBe(true);
    expect(adminBody.data.site).toBe("all");
  });

  it("supports admin users, content and site config operations with audit logs", async () => {
    if (!db) return;

    const username = `admin-target-${Date.now()}`;
    const registerResponse = await app.request("/api/identity/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email: `${username}@example.com`,
        password: "password",
        site: "cn",
      }),
    });
    const registerBody = await registerResponse.json();

    const usersResponse = await app.request("/api/admin/users", {
      headers: {
        Authorization: adminAuthorization("cn"),
        "x-pangen-site": "cn",
      },
    });
    const usersBody = await usersResponse.json();
    expect(usersResponse.status).toBe(200);
    expect(usersBody.data.items.some((item: { username: string }) => item.username === username)).toBe(true);

    const auditBefore = await countRows(auditLogs);
    const roleResponse = await app.request(`/api/admin/users/${registerBody.data.user.id}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminAuthorization("cn"),
        "x-pangen-site": "cn",
      },
      body: JSON.stringify({ role: "reviewer" }),
    });
    const roleBody = await roleResponse.json();
    expect(roleResponse.status).toBe(200);
    expect(roleBody.data.role).toBe("reviewer");

    const contentResponse = await app.request("/api/admin/content", {
      headers: {
        Authorization: adminAuthorization("cn"),
        "x-pangen-site": "cn",
      },
    });
    const contentBody = await contentResponse.json();
    expect(contentResponse.status).toBe(200);
    expect(contentBody.data.items.length).toBeGreaterThan(0);

    const configRows = await db.select().from(siteConfigs).where(eq(siteConfigs.site, "cn")).limit(1);
    const configResponse = await app.request(`/api/admin/site-configs/${configRows[0].id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminAuthorization("cn"),
        "x-pangen-site": "cn",
      },
      body: JSON.stringify({ value: { name: "盘根校园", domain: "xyzidea.cn", test: "updated" } }),
    });
    const configBody = await configResponse.json();
    expect(configResponse.status).toBe(200);
    expect(configBody.data.value.test).toBe("updated");
    expect(await countRows(auditLogs)).toBe(auditBefore + 2);
  });

  it("creates moderation tasks and writes audit logs on state changes", async () => {
    if (!db) return;

    const taskBefore = await countRows(moderationTasks);
    const auditBefore = await countRows(auditLogs);

    const createResponse = await app.request("/api/moderation/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: userAuthorization("cn"),
      },
      body: JSON.stringify({
        site: "cn",
        type: "report",
        targetType: "post",
        targetId: "1",
        title: "测试审核任务",
        reason: "测试举报原因",
      }),
    });
    const createBody = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createBody.data.status).toBe("pending");
    expect(await countRows(moderationTasks)).toBe(taskBefore + 1);

    const updateResponse = await app.request(`/api/moderation/tasks/${createBody.data.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminAuthorization("cn"),
      },
      body: JSON.stringify({ status: "in_review" }),
    });
    const updateBody = await updateResponse.json();

    expect(updateResponse.status).toBe(200);
    expect(updateBody.data.status).toBe("in_review");
    expect(await countRows(auditLogs)).toBe(auditBefore + 1);
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
    const moderationBefore = await countRows(moderationTasks);
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
    expect(await countRows(moderationTasks)).toBe(moderationBefore + 1);

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
      canCreateSpace: true,
    });

    expect(visitorPermissionsResponse.status).toBe(200);
    expect(await visitorPermissionsResponse.json()).toEqual({
      canPost: false,
      canWrite: false,
      canCreateSpace: false,
    });
  });

  it("allows qualified users to create campus spaces and rejects ordinary users", async () => {
    const plainAuthorization = await register(`space-user-${Date.now()}`);
    const beforeCount = await countRows(knowledgeBases);

    const forbiddenResponse = await app.request("/api/campus/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: plainAuthorization, "x-pangen-site": "cn" },
      body: JSON.stringify({
        slug: `plain-space-${Date.now()}`,
        title: "普通用户空间",
        description: "普通用户不应直接创建空间",
        category: "activity",
      }),
    });

    expect(forbiddenResponse.status).toBe(403);

    const editorAuthorization = await login("editor");
    const slug = `club-space-${Date.now()}`;
    const createResponse = await app.request("/api/campus/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: editorAuthorization, "x-pangen-site": "cn" },
      body: JSON.stringify({
        slug,
        title: "社团活动空间",
        description: "收集社团招新、活动报名和比赛提醒。",
        category: "activity",
      }),
    });
    const createBody = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createBody.data.id).toBe(slug);
    expect(await countRows(knowledgeBases)).toBe(beforeCount + 1);

    const duplicateResponse = await app.request("/api/campus/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: editorAuthorization, "x-pangen-site": "cn" },
      body: JSON.stringify({
        slug,
        title: "重复空间",
        description: "重复标识应被拒绝。",
        category: "activity",
      }),
    });

    expect(duplicateResponse.status).toBe(409);
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
    const moderationBefore = await countRows(moderationTasks);
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
    expect(await countRows(moderationTasks)).toBe(moderationBefore + 1);

    const searchResponse = await app.request("/api/search/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ query: `食堂-${Date.now()}`, resultCount: 1, usedAi: false }),
    });

    expect(searchResponse.status).toBe(201);
    expect(await countRows(searchLogs)).toBe(searchBefore + 1);
  });

  it("searches through search_documents and reports content gaps", async () => {
    const searchResponse = await app.request("/api/search?q=麻辣烫");
    const searchBody = await searchResponse.json();

    expect(searchResponse.status).toBe(200);
    expect(searchBody.articles.length).toBeGreaterThan(0);
    expect(await countRows(searchDocuments)).toBeGreaterThan(0);

    const gapQuery = `缺口-${Date.now()}`;
    const logResponse = await app.request("/api/search/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gapQuery, resultCount: 0, usedAi: true }),
    });
    expect(logResponse.status).toBe(201);

    const forbiddenResponse = await app.request("/api/search/gaps", {
      headers: { Authorization: userAuthorization("cn") },
    });
    expect(forbiddenResponse.status).toBe(403);

    const gapsResponse = await app.request("/api/search/gaps", {
      headers: { Authorization: adminAuthorization("cn") },
    });
    const gapsBody = await gapsResponse.json();
    expect(gapsResponse.status).toBe(200);
    expect(gapsBody.data.items.some((item: { query: string }) => item.query === gapQuery)).toBe(true);
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
