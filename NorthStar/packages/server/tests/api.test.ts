import { beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { app } from "../src/index";
import { db } from "../src/db/client";
import {
  accountDeletionRequests,
  applicationRequests,
  activities,
  articles,
  auditLogs,
  behaviorEvents,
  compassFavorites,
  contentRecords,
  favorites,
  feedbacks,
  knowledgeBases,
  legalDocuments,
  inviteCodes,
  moderationTasks,
  notifications,
  paymentOrders,
  postReplies,
  posts,
  quotas,
  reports,
  searchDocuments,
  searchLogs,
  siteConfigs,
  solutionExports,
  solutionFeedbacks,
  solutions,
  trustEvents,
  userConsents,
  users,
} from "../src/db/schema";
import { signToken } from "../src/lib/auth";
import {
  createArticleChangedNotificationInDb,
  createAuthInviteNotificationInDb,
  createContentExpiryNotificationInDb,
  createSpaceClaimNotificationInDb,
} from "../src/data/postgres";

async function login(username = "zhang") {
  const response = await app.request("/api/identity/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account: username,
      password: "password",
      site: "cn",
    }),
  });
  const body = await response.json();
  return `Bearer ${body.data.token}`;
}

async function register(username: string) {
  const response = await app.request("/api/identity/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      email: `${username}@example.com`,
      password: "password",
      site: "cn",
      consentVersion: "2026-04-24",
    }),
  });
  const body = await response.json();
  return `Bearer ${body.data.token}`;
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

  it("allows identity registration without email", async () => {
    if (!db) return;

    const username = `username-only-${Date.now()}`;
    const registerResponse = await app.request("/api/identity/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password: "password",
        site: "cn",
        consentVersion: "2026-04-24",
      }),
    });
    const registerBody = await registerResponse.json();

    expect(registerResponse.status).toBe(201);
    expect(registerBody.data.user.username).toBe(username);
    expect(registerBody.data.user.email).toBe("");

    const userRows = await db.select().from(users).where(eq(users.username, username)).limit(1);
    expect(userRows[0].email).toBeNull();
    expect(userRows[0].emailVerificationToken).toBeNull();

    const loginResponse = await app.request("/api/identity/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: username, password: "password", site: "cn" }),
    });
    expect(loginResponse.status).toBe(200);
  });

  it("records global applications and consumes invite codes during registration", async () => {
    const applicationBefore = await countRows(applicationRequests);
    const inviteBefore = await countRows(inviteCodes);

    const applicationResponse = await app.request("/api/identity/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-pangen-site": "com" },
      body: JSON.stringify({
        site: "com",
        name: "测试申请人",
        email: `apply-${Date.now()}@example.com`,
        useCase: "希望用盘根整理 AI 工具实践方案",
      }),
    });
    expect(applicationResponse.status).toBe(201);
    expect(await countRows(applicationRequests)).toBe(applicationBefore + 1);

    const inviteResponse = await app.request("/api/identity/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: adminAuthorization("com"), "x-pangen-site": "com" },
      body: JSON.stringify({ site: "com", code: `INV-${Date.now()}`, maxUses: 1 }),
    });
    const inviteBody = await inviteResponse.json();
    expect(inviteResponse.status).toBe(201);
    expect(await countRows(inviteCodes)).toBe(inviteBefore + 1);

    const username = `invite-user-${Date.now()}`;
    const registerResponse = await app.request("/api/identity/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-pangen-site": "com" },
      body: JSON.stringify({
        site: "com",
        username,
        password: "password",
        inviteCode: inviteBody.data.code,
      }),
    });
    expect(registerResponse.status).toBe(201);

    const secondRegisterResponse = await app.request("/api/identity/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-pangen-site": "com" },
      body: JSON.stringify({
        site: "com",
        username: `${username}-second`,
        password: "password",
        inviteCode: inviteBody.data.code,
      }),
    });
    expect(secondRegisterResponse.status).toBe(403);
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

  it("returns platform capabilities for campus and compass", async () => {
    const guestCampusResponse = await app.request("/api/platform/capabilities?site=campus");
    const guestCampusBody = await guestCampusResponse.json();
    expect(guestCampusResponse.status).toBe(200);
    expect(guestCampusBody.data).toMatchObject({
      site: "campus",
      canPost: false,
      canUseAiSearch: true,
    });

    const compassResponse = await app.request("/api/platform/capabilities?site=compass", {
      headers: { Authorization: userAuthorization("com"), "x-pangen-site": "com" },
    });
    const compassBody = await compassResponse.json();
    expect(compassResponse.status).toBe(200);
    expect(compassBody.data).toMatchObject({
      site: "compass",
      canGenerateSolution: true,
      canSaveSolution: true,
      canExportSolution: true,
    });
  });

  it("serves analytics metrics and admin billing overview", async () => {
    const eventBefore = await countRows(behaviorEvents);
    const orderBefore = await countRows(paymentOrders);

    const eventResponse = await app.request("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: userAuthorization("com"), "x-pangen-site": "com" },
      body: JSON.stringify({
        site: "com",
        event: "compass_solution_save",
        metadata: { source: "test" },
      }),
    });
    expect(eventResponse.status).toBe(201);
    expect(await countRows(behaviorEvents)).toBe(eventBefore + 1);

    const metricsResponse = await app.request("/api/analytics/metrics", {
      headers: { Authorization: adminAuthorization("com"), "x-pangen-site": "com" },
    });
    const metricsBody = await metricsResponse.json();
    expect(metricsResponse.status).toBe(200);
    expect(metricsBody.data.items.some((item: { key: string }) => item.key === "compass_solution_save")).toBe(true);

    const quotaResponse = await app.request("/api/billing/quota", {
      headers: { Authorization: userAuthorization("com"), "x-pangen-site": "com" },
    });
    const quotaBody = await quotaResponse.json();
    expect(quotaResponse.status).toBe(200);
    expect(await countRows(quotas)).toBeGreaterThan(0);

    const orderResponse = await app.request("/api/billing/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: userAuthorization("com"), "x-pangen-site": "com" },
      body: JSON.stringify({ credits: 20, amountCents: 9900, currency: "CNY" }),
    });
    const orderBody = await orderResponse.json();
    expect(orderResponse.status).toBe(201);
    expect(await countRows(paymentOrders)).toBe(orderBefore + 1);

    const confirmResponse = await app.request(`/api/billing/admin/orders/${orderBody.data.id}/confirm`, {
      method: "POST",
      headers: { Authorization: adminAuthorization("com"), "x-pangen-site": "com" },
    });
    const confirmBody = await confirmResponse.json();
    expect(confirmResponse.status).toBe(200);
    expect(confirmBody.data.order.status).toBe("paid");
    expect(confirmBody.data.quota.aiCreditsRemaining).toBeGreaterThanOrEqual(
      quotaBody.data.quota.aiCreditsRemaining + 20,
    );

    const overviewResponse = await app.request("/api/billing/admin/overview", {
      headers: { Authorization: adminAuthorization("com"), "x-pangen-site": "com" },
    });
    const overviewBody = await overviewResponse.json();
    expect(overviewResponse.status).toBe(200);
    expect(overviewBody.data.quotas.length).toBeGreaterThan(0);
    expect(overviewBody.data.orders.length).toBeGreaterThan(0);
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
    const listResponse = await app.request("/api/campus/spaces");
    const listBody = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listBody.spaces.length).toBeGreaterThan(0);

    const detailResponse = await app.request("/api/campus/spaces/food");
    const detailBody = await detailResponse.json();

    expect(detailResponse.status).toBe(200);
    expect(detailBody.space.id).toBe("food");
    expect(Array.isArray(detailBody.articles)).toBe(true);
  });

  it("returns an article detail", async () => {
    const response = await app.request("/api/campus/articles/campus-a1");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.article.id).toBe("campus-a1");
    expect(body.article.content).toContain("麻辣烫");
  });

  it("lists and creates posts", async () => {
    const authorization = await login();
    const beforeCount = await countRows(posts);
    const trustBefore = await countRows(trustEvents);

    const listResponse = await app.request("/api/campus/spaces/food/posts");
    const listBody = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listBody.posts)).toBe(true);

    const createResponse = await app.request("/api/campus/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({
        spaceId: "food",
        content: "测试帖子",
        tags: ["share"],
      }),
    });
    const createBody = await createResponse.json();
    const secondCreateResponse = await app.request("/api/campus/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({
        spaceId: "food",
        content: "第二条测试帖子",
        tags: ["share"],
      }),
    });

    expect(createResponse.status).toBe(201);
    expect(secondCreateResponse.status).toBe(201);
    expect(createBody.post.content).toBe("测试帖子");
    expect(await countRows(posts)).toBe(beforeCount + 2);
    expect(await countRows(trustEvents)).toBe(trustBefore + 2);

    const notificationResponse = await app.request("/api/notification/inbox", {
      headers: { Authorization: authorization },
    });
    const notificationBody = await notificationResponse.json();
    const notificationTypes = notificationBody.data.notifications.map((item: { type: string }) => item.type);
    expect(
      notificationBody.data.notifications.some((item: { title: string }) => item.title === "权限已升级"),
    ).toBe(true);
    expect(notificationTypes).toContain("auth_invite");
  });

  it("records helpful and changed feedback", async () => {
    const authorization = await login();
    const editorAuthorization = await login("editor");
    const feedbackBefore = await countRows(feedbacks);
    const moderationBefore = await countRows(moderationTasks);
    const activityBefore = await countRows(activities);
    const trustBefore = await countRows(trustEvents);
    const changedNotificationBefore = db
      ? (
          await db
            .select({ count: sql<number>`count(*)::int` })
            .from(notifications)
            .where(eq(notifications.title, "有人反馈内容有变化"))
        )[0].count
      : 0;

    const helpfulResponse = await app.request("/api/campus/articles/campus-a1/helpful", {
      method: "POST",
      headers: { Authorization: authorization },
    });
    const helpfulBody = await helpfulResponse.json();

    expect(helpfulResponse.status).toBe(200);
    expect(helpfulBody.helpfulCount).toBeGreaterThan(0);
    expect(await countRows(feedbacks)).toBe(feedbackBefore + 1);
    expect(await countRows(activities)).toBe(activityBefore + 1);
    expect(await countRows(trustEvents)).toBe(trustBefore + 1);

    const editorNotifications = await app.request("/api/notification/inbox", {
      headers: { Authorization: editorAuthorization },
    });
    const editorNotificationBody = await editorNotifications.json();
    expect(
      editorNotificationBody.data.notifications.some((item: { title: string }) => item.title === "内容被确认有帮助"),
    ).toBe(true);

    const changedResponse = await app.request("/api/campus/articles/campus-a1/changed", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ note: "营业时间有变化" }),
    });
    const changedBody = await changedResponse.json();

    expect(changedResponse.status).toBe(200);
    expect(changedBody.changedCount).toBeGreaterThan(0);
    expect(await countRows(feedbacks)).toBe(feedbackBefore + 2);
    expect(await countRows(moderationTasks)).toBe(moderationBefore + 1);
    if (db) {
      const changedNotifications = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(eq(notifications.title, "有人反馈内容有变化"));
      expect(changedNotifications[0].count).toBe(changedNotificationBefore);

      const [changedTask] = await db
        .select({ id: moderationTasks.id })
        .from(moderationTasks)
        .where(eq(moderationTasks.type, "changed_feedback"))
        .orderBy(sql`${moderationTasks.id} desc`)
        .limit(1);
      expect(changedTask).toBeTruthy();

      const reviewResponse = await app.request(`/api/moderation/tasks/${changedTask.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: adminAuthorization("cn"),
          "x-pangen-site": "cn",
        },
        body: JSON.stringify({ status: "in_review" }),
      });
      expect(reviewResponse.status).toBe(200);

      const resolvedResponse = await app.request(`/api/moderation/tasks/${changedTask.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: adminAuthorization("cn"),
          "x-pangen-site": "cn",
        },
        body: JSON.stringify({ status: "resolved" }),
      });
      expect(resolvedResponse.status).toBe(200);
    }

    const editorChangedNotifications = await app.request("/api/notification/inbox", {
      headers: { Authorization: editorAuthorization },
    });
    const editorChangedNotificationBody = await editorChangedNotifications.json();
    expect(
      editorChangedNotificationBody.data.notifications.some((item: { title: string }) => item.title === "有人反馈内容有变化"),
    ).toBe(true);
  });

  it("returns notifications and marks one read", async () => {
    const authorization = await login();
    const beforeCount = await countRows(notifications);

    await createAuthInviteNotificationInDb(1);
    expect(await countRows(notifications)).toBeGreaterThan(beforeCount);

    const listResponse = await app.request("/api/notification/inbox", {
      headers: { Authorization: authorization },
    });
    const listBody = await listResponse.json();
    const unreadInvite = listBody.data.notifications.find(
      (item: { type: string; isRead: boolean }) => item.type === "auth_invite" && !item.isRead,
    );

    expect(listResponse.status).toBe(200);
    expect(listBody.data.notifications.length).toBeGreaterThan(0);
    expect(unreadInvite).toBeTruthy();

    const readResponse = await app.request(`/api/notification/${unreadInvite.id}/read`, {
      method: "POST",
      headers: { Authorization: authorization },
    });
    const readBody = await readResponse.json();

    expect(readResponse.status).toBe(200);
    expect(readBody.data.notification.isRead).toBe(true);
    if (db) {
      const rows = await db
        .select({ isRead: notifications.isRead })
        .from(notifications)
        .where(eq(notifications.id, Number(unreadInvite.id)));
      expect(rows[0].isRead).toBe(true);
    }
  });

  it("stores favorites and returns profile", async () => {
    const authorization = await login();
    const editorAuthorization = await login("editor");
    const beforeCount = await countRows(favorites);

    const favoriteResponse = await app.request("/api/campus/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ targetType: "article", targetId: "campus-a1" }),
    });

    expect(favoriteResponse.status).toBe(201);
    expect(await countRows(favorites)).toBeGreaterThanOrEqual(beforeCount);

    const profileResponse = await app.request("/api/campus/me/profile", {
      headers: { Authorization: authorization },
    });
    const profileBody = await profileResponse.json();

    expect(profileResponse.status).toBe(200);
    expect(profileBody.stats.favoriteCount).toBeGreaterThan(0);

    const editorNotificationResponse = await app.request("/api/notification/inbox", {
      headers: { Authorization: editorAuthorization },
    });
    const editorNotificationBody = await editorNotificationResponse.json();
    expect(
      editorNotificationBody.data.notifications.some((item: { title: string }) => item.title === "内容被收藏"),
    ).toBe(true);
  });

  it("returns permissions aligned with user capability boundaries", async () => {
    const zhangAuthorization = await login();
    const editorAuthorization = await login("editor");

    const zhangPermissionsResponse = await app.request("/api/platform/capabilities?site=campus", {
      headers: { Authorization: zhangAuthorization },
    });
    const editorPermissionsResponse = await app.request("/api/platform/capabilities?site=campus", {
      headers: { Authorization: editorAuthorization },
    });

    const visitorPermissionsResponse = await app.request("/api/platform/capabilities?site=campus");

    expect(zhangPermissionsResponse.status).toBe(200);
    expect((await zhangPermissionsResponse.json()).data).toMatchObject({
      canPost: true,
      canWriteArticle: false,
      canCreateSpace: false,
    });

    expect(editorPermissionsResponse.status).toBe(200);
    expect((await editorPermissionsResponse.json()).data).toMatchObject({
      canPost: true,
      canWriteArticle: true,
      canCreateSpace: true,
    });

    expect(visitorPermissionsResponse.status).toBe(200);
    expect((await visitorPermissionsResponse.json()).data).toMatchObject({
      canPost: false,
      canWriteArticle: false,
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

  it("scans stale spaces into claim tasks and applies approved claims", async () => {
    if (!db) return;

    const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.username, "editor")).limit(1);
    const [candidate] = await db.select({ id: users.id }).from(users).where(eq(users.username, "zhang")).limit(1);
    expect(owner).toBeTruthy();
    expect(candidate).toBeTruthy();

    const slug = `claim-space-${Date.now()}`;
    const staleAt = new Date("2025-01-01T00:00:00.000Z");
    await db.insert(knowledgeBases).values({
      slug,
      title: "长期未维护空间",
      description: "用于测试空间认领扫描。",
      ownerId: owner.id,
      category: "activity",
      updatedAt: staleAt,
      createdAt: staleAt,
    });

    const forbiddenScanResponse = await app.request("/api/campus/space-claims/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: userAuthorization("cn"),
        "x-pangen-site": "cn",
      },
      body: JSON.stringify({
        candidateUserId: String(candidate.id),
        olderThanDays: 90,
        limit: 20,
      }),
    });
    expect(forbiddenScanResponse.status).toBe(403);

    const auditBefore = await countRows(auditLogs);
    const scanResponse = await app.request("/api/campus/space-claims/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminAuthorization("cn"),
        "x-pangen-site": "cn",
      },
      body: JSON.stringify({
        candidateUserId: String(candidate.id),
        olderThanDays: 90,
        limit: 20,
      }),
    });
    const scanBody = await scanResponse.json();
    const claimItem = scanBody.data.items.find((item: { spaceSlug: string }) => item.spaceSlug === slug);

    expect(scanResponse.status).toBe(201);
    expect(claimItem).toBeTruthy();
    expect(await countRows(moderationTasks)).toBeGreaterThan(0);
    expect(await countRows(notifications)).toBeGreaterThan(0);

    const duplicateScanResponse = await app.request("/api/campus/space-claims/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminAuthorization("cn"),
        "x-pangen-site": "cn",
      },
      body: JSON.stringify({
        candidateUserId: String(candidate.id),
        olderThanDays: 90,
        limit: 20,
      }),
    });
    const duplicateScanBody = await duplicateScanResponse.json();
    expect(
      duplicateScanBody.data.items.some((item: { spaceSlug: string }) => item.spaceSlug === slug),
    ).toBe(false);

    const reviewResponse = await app.request(`/api/moderation/tasks/${claimItem.taskId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminAuthorization("cn"),
        "x-pangen-site": "cn",
      },
      body: JSON.stringify({ status: "in_review" }),
    });
    expect(reviewResponse.status).toBe(200);

    const resolvedResponse = await app.request(`/api/moderation/tasks/${claimItem.taskId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminAuthorization("cn"),
        "x-pangen-site": "cn",
      },
      body: JSON.stringify({ status: "resolved" }),
    });
    expect(resolvedResponse.status).toBe(200);

    const [updatedSpace] = await db
      .select({
        ownerId: knowledgeBases.ownerId,
        claimedBy: knowledgeBases.claimedBy,
        isClaimed: knowledgeBases.isClaimed,
      })
      .from(knowledgeBases)
      .where(eq(knowledgeBases.slug, slug))
      .limit(1);

    expect(updatedSpace.ownerId).toBe(candidate.id);
    expect(updatedSpace.claimedBy).toBe(candidate.id);
    expect(updatedSpace.isClaimed).toBe(true);
    expect(await countRows(auditLogs)).toBeGreaterThan(auditBefore);
  });

  it("keeps owner unchanged when a space claim is dismissed", async () => {
    if (!db) return;

    const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.username, "editor")).limit(1);
    const [candidate] = await db.select({ id: users.id }).from(users).where(eq(users.username, "zhang")).limit(1);
    expect(owner).toBeTruthy();
    expect(candidate).toBeTruthy();

    const slug = `claim-dismiss-${Date.now()}`;
    const staleAt = new Date("2025-01-01T00:00:00.000Z");
    await db.insert(knowledgeBases).values({
      slug,
      title: "驳回认领空间",
      description: "用于测试驳回后保持原维护者。",
      ownerId: owner.id,
      category: "activity",
      updatedAt: staleAt,
      createdAt: staleAt,
    });

    const scanResponse = await app.request("/api/campus/space-claims/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminAuthorization("cn"),
        "x-pangen-site": "cn",
      },
      body: JSON.stringify({
        candidateUserId: String(candidate.id),
        olderThanDays: 90,
        limit: 20,
      }),
    });
    const scanBody = await scanResponse.json();
    const claimItem = scanBody.data.items.find((item: { spaceSlug: string }) => item.spaceSlug === slug);

    expect(scanResponse.status).toBe(201);
    expect(claimItem).toBeTruthy();

    const reviewResponse = await app.request(`/api/moderation/tasks/${claimItem.taskId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminAuthorization("cn"),
        "x-pangen-site": "cn",
      },
      body: JSON.stringify({ status: "in_review" }),
    });
    expect(reviewResponse.status).toBe(200);

    const dismissedResponse = await app.request(`/api/moderation/tasks/${claimItem.taskId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminAuthorization("cn"),
        "x-pangen-site": "cn",
      },
      body: JSON.stringify({ status: "dismissed" }),
    });
    expect(dismissedResponse.status).toBe(200);

    const [spaceAfterDismiss] = await db
      .select({
        ownerId: knowledgeBases.ownerId,
        claimedBy: knowledgeBases.claimedBy,
        isClaimed: knowledgeBases.isClaimed,
      })
      .from(knowledgeBases)
      .where(eq(knowledgeBases.slug, slug))
      .limit(1);

    expect(spaceAfterDismiss.ownerId).toBe(owner.id);
    expect(spaceAfterDismiss.claimedBy).not.toBe(candidate.id);
  });

  it("scans expired campus content and creates expiry notifications", async () => {
    if (!db) return;

    const beforeCount = await countRows(notifications);
    await db
      .update(articles)
      .set({
        confirmedAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      })
      .where(eq(articles.slug, "campus-a1"));

    const scanResponse = await app.request("/api/campus/content-expiry/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminAuthorization("cn"),
        "x-pangen-site": "cn",
      },
      body: JSON.stringify({ olderThanDays: 180 }),
    });
    const scanBody = await scanResponse.json();

    expect(scanResponse.status).toBe(200);
    expect(scanBody.data.scannedCount).toBeGreaterThan(0);
    expect(scanBody.data.notifiedCount).toBeGreaterThan(0);
    expect(await countRows(notifications)).toBeGreaterThan(beforeCount);

    const editorAuthorization = await login("editor");
    const inboxResponse = await app.request("/api/notification/inbox", {
      headers: { Authorization: editorAuthorization },
    });
    const inboxBody = await inboxResponse.json();

    expect(
      inboxBody.data.notifications.some(
        (item: { type: string; title: string }) => item.type === "expiry" && item.title === "文章需要重新确认",
      ),
    ).toBe(true);
  });

  it("stores replies, reports and search logs in database", async () => {
    const authorization = await login();
    const editorAuthorization = await login("editor");
    const postResponse = await app.request("/api/campus/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ spaceId: "food", content: "回复举报搜索测试" }),
    });
    const postBody = await postResponse.json();
    const replyBefore = await countRows(postReplies);
    const reportBefore = await countRows(reports);
    const moderationBefore = await countRows(moderationTasks);
    const searchBefore = await countRows(searchLogs);

    const postsResponse = await app.request("/api/campus/spaces/food/posts");
    const postsBody = await postsResponse.json();
    expect(postsResponse.status).toBe(200);
    expect(postsBody.posts.some((item: { id: string }) => item.id === postBody.post.id)).toBe(true);

    const replyResponse = await app.request(`/api/campus/posts/${postBody.post.id}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: editorAuthorization },
      body: JSON.stringify({ content: "测试回复" }),
    });

    expect(replyResponse.status).toBe(201);
    expect(await countRows(postReplies)).toBe(replyBefore + 1);

    const replyNotificationResponse = await app.request("/api/notification/inbox", {
      headers: { Authorization: authorization },
    });
    const replyNotificationBody = await replyNotificationResponse.json();
    expect(
      replyNotificationBody.data.notifications.some((item: { title: string }) => item.title === "有人回复了帖子"),
    ).toBe(true);

    const reportResponse = await app.request("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ targetType: "post", targetId: postBody.post.id, reason: "测试举报" }),
    });

    expect(reportResponse.status).toBe(201);
    expect(await countRows(reports)).toBe(reportBefore + 1);
    expect(await countRows(moderationTasks)).toBe(moderationBefore + 1);

    const searchResponse = await app.request("/api/campus/search/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ query: `食堂-${Date.now()}`, resultCount: 1, usedAi: false }),
    });

    expect(searchResponse.status).toBe(201);
    expect(await countRows(searchLogs)).toBe(searchBefore + 1);
  });

  it("searches through search_documents and reports content gaps", async () => {
    const searchResponse = await app.request("/api/campus/search?q=麻辣烫");
    const searchBody = await searchResponse.json();

    expect(searchResponse.status).toBe(200);
    expect(searchBody.articles.length).toBeGreaterThan(0);
    expect(await countRows(searchDocuments)).toBeGreaterThan(0);

    const emptyQuery = `no-local-result-${Date.now()}`;
    const emptyResponse = await app.request(`/api/campus/search?q=${encodeURIComponent(emptyQuery)}`);
    const emptyBody = await emptyResponse.json();
    expect(emptyResponse.status).toBe(200);
    expect(emptyBody).toMatchObject({
      articles: [],
      posts: [],
      spaces: [],
    });

    const gapQuery = `缺口-${Date.now()}`;
    const logResponse = await app.request("/api/campus/search/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gapQuery, resultCount: 0, usedAi: true }),
    });
    expect(logResponse.status).toBe(201);

    const forbiddenResponse = await app.request("/api/campus/search/gaps", {
      headers: { Authorization: userAuthorization("cn") },
    });
    expect(forbiddenResponse.status).toBe(403);

    const gapsResponse = await app.request("/api/campus/search/gaps", {
      headers: { Authorization: adminAuthorization("cn") },
    });
    const gapsBody = await gapsResponse.json();
    expect(gapsResponse.status).toBe(200);
    expect(gapsBody.data.items.some((item: { query: string }) => item.query === gapQuery)).toBe(true);
  });

  it("serves published compass tools, topics, articles and news from content records", async () => {
    if (!db) return;

    const ownerRows = await db.select({ id: users.id }).from(users).where(eq(users.username, "admin")).limit(1);
    const ownerId = ownerRows[0].id;
    const slug = `compass-tool-${Date.now()}`;

    await db.insert(contentRecords).values([
      {
        site: "com",
        contentType: "tool",
        slug,
        title: "测试 AI 工具",
        summary: "用于验证全球站工具 API。",
        body: "这是一个测试工具详情。",
        domain: "dev",
        status: "published",
        ownerId,
        publishedAt: new Date(),
        metadata: {
          tags: ["测试", "AI"],
          rating: 4.6,
          usageCount: "1k",
          imageUrl: "https://picsum.photos/400/300?random=61",
          url: "https://example.com",
        },
      },
      {
        site: "com",
        contentType: "topic",
        slug: `${slug}-topic`,
        title: "测试专题",
        summary: "用于验证全球站专题 API。",
        body: "专题详情。",
        domain: "dev",
        status: "published",
        ownerId,
        publishedAt: new Date(),
        metadata: { articleCount: 1, rating: 4.5 },
      },
      {
        site: "com",
        contentType: "article",
        slug: `${slug}-article`,
        title: "测试文章",
        summary: "用于验证全球站文章 API。",
        body: "# 测试文章\n\n正文。",
        domain: "dev",
        status: "published",
        ownerId,
        publishedAt: new Date(),
        metadata: { author: "盘根编辑", readTime: "3 分钟" },
      },
      {
        site: "com",
        contentType: "news",
        slug: `${slug}-news`,
        title: "测试资讯",
        summary: "用于验证全球站资讯 API。",
        body: "资讯正文。",
        domain: "dev",
        status: "published",
        ownerId,
        publishedAt: new Date(),
        metadata: { source: "盘根观察" },
      },
    ]);

    const toolsResponse = await app.request("/api/compass/tools");
    const toolsBody = await toolsResponse.json();
    expect(toolsResponse.status).toBe(200);
    expect(toolsBody.data.items.some((item: { id: string }) => item.id === slug)).toBe(true);

    const toolResponse = await app.request(`/api/compass/tools/${slug}`);
    const toolBody = await toolResponse.json();
    expect(toolResponse.status).toBe(200);
    expect(toolBody.data.name).toBe("测试 AI 工具");

    const topicsResponse = await app.request("/api/compass/topics");
    const articlesResponse = await app.request("/api/compass/articles");
    const newsResponse = await app.request("/api/compass/news");
    expect(topicsResponse.status).toBe(200);
    expect(articlesResponse.status).toBe(200);
    expect(newsResponse.status).toBe(200);
  });

  it("persists compass solutions with export, feedback and owner isolation", async () => {
    const authorization = userAuthorization("com");
    const beforeSolutions = await countRows(solutions);
    const beforeExports = await countRows(solutionExports);
    const beforeFeedbacks = await countRows(solutionFeedbacks);

    const createResponse = await app.request("/api/compass/solutions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization, "x-pangen-site": "com" },
      body: JSON.stringify({
        title: "论文写作工作流",
        targetGoal: "把论文资料整理成可引用提纲",
        toolIds: ["perplexity", "notion-ai"],
        content: "先检索资料，再整理提纲，最后交叉校验引用。",
      }),
    });
    const createBody = await createResponse.json();
    const solutionId = createBody.data.id;

    expect(createResponse.status).toBe(201);
    expect(createBody.data.targetGoal).toContain("论文资料");
    expect(await countRows(solutions)).toBe(beforeSolutions + 1);

    const listResponse = await app.request("/api/compass/solutions", {
      headers: { Authorization: authorization, "x-pangen-site": "com" },
    });
    const listBody = await listResponse.json();
    expect(listBody.data.items.some((item: { id: string }) => item.id === solutionId)).toBe(true);

    const exportResponse = await app.request(`/api/compass/solutions/${solutionId}/export?format=md`, {
      headers: { Authorization: authorization, "x-pangen-site": "com" },
    });
    const exportText = await exportResponse.text();
    expect(exportResponse.status).toBe(200);
    expect(exportText).toContain("# 论文写作工作流");
    expect(await countRows(solutionExports)).toBe(beforeExports + 1);

    const feedbackResponse = await app.request(`/api/compass/solutions/${solutionId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization, "x-pangen-site": "com" },
      body: JSON.stringify({ helpful: true, note: "可执行" }),
    });
    expect(feedbackResponse.status).toBe(201);
    expect(await countRows(solutionFeedbacks)).toBe(beforeFeedbacks + 1);

    const cnAccessResponse = await app.request(`/api/compass/solutions/${solutionId}`, {
      headers: { Authorization: userAuthorization("cn"), "x-pangen-site": "cn" },
    });
    expect(cnAccessResponse.status).toBe(401);

    const deleteResponse = await app.request(`/api/compass/solutions/${solutionId}`, {
      method: "DELETE",
      headers: { Authorization: authorization, "x-pangen-site": "com" },
    });
    expect(deleteResponse.status).toBe(200);
  });

  it("persists compass favorites behind com auth", async () => {
    const beforeFavorites = await countRows(compassFavorites);
    const authorization = userAuthorization("com");

    const createResponse = await app.request("/api/compass/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization, "x-pangen-site": "com" },
      body: JSON.stringify({ targetType: "tool", targetId: "notion-ai" }),
    });
    const createBody = await createResponse.json();
    expect(createResponse.status).toBe(201);
    expect(createBody.data).toMatchObject({ targetType: "tool", targetId: "notion-ai" });
    expect(await countRows(compassFavorites)).toBe(beforeFavorites + 1);

    const listResponse = await app.request("/api/compass/favorites", {
      headers: { Authorization: authorization, "x-pangen-site": "com" },
    });
    const listBody = await listResponse.json();
    expect(listResponse.status).toBe(200);
    expect(listBody.data.items.some((item: { targetId: string }) => item.targetId === "notion-ai")).toBe(true);

    const cnCreateResponse = await app.request("/api/compass/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: userAuthorization("cn"), "x-pangen-site": "cn" },
      body: JSON.stringify({ targetType: "tool", targetId: "notion-ai" }),
    });
    expect(cnCreateResponse.status).toBe(401);

    const deleteResponse = await app.request("/api/compass/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: authorization, "x-pangen-site": "com" },
      body: JSON.stringify({ targetType: "tool", targetId: "notion-ai" }),
    });
    expect(deleteResponse.status).toBe(200);
  });

  it("publishes an article into database", async () => {
    const authorization = await login("editor");
    const beforeCount = await countRows(articles);
    const title = `测试文章 ${Date.now()}`;

    const response = await app.request("/api/campus/articles", {
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
    const oldKey = process.env.AI_API_KEY;
    delete process.env.AI_API_KEY;
    try {
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

      const writeResponse = await app.request("/api/ai/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "打印店攻略", spaceTitle: "校园省钱指南" }),
      });
      const writeBody = await writeResponse.json();
      expect(writeResponse.status).toBe(200);
      expect(writeBody.draft.title).toBeTruthy();

      const toolsResponse = await app.request("/api/ai-gateway/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: '用户目标: "写论文"' }],
          tools: [{ type: "function", function: { name: "emit_solution_v1" } }],
          tool_choice: { type: "function", function: { name: "emit_solution_v1" } },
        }),
      });
      const toolsBody = await toolsResponse.json();
      expect(toolsResponse.status).toBe(200);
      expect(toolsBody.mode).toBe("demo");
      expect(toolsBody.fallbackReason).toBe("missing_key");
    } finally {
      if (oldKey) process.env.AI_API_KEY = oldKey;
    }
  });

  it("rejects protected writes without permission", async () => {
    const userAuthorization = await register(`plain-${Date.now()}`);

    const noTokenResponse = await app.request("/api/campus/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId: "food", content: "未登录发帖" }),
    });
    expect(noTokenResponse.status).toBe(401);

    const invalidTokenResponse = await app.request("/api/campus/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer bad-token" },
      body: JSON.stringify({ spaceId: "food", content: "错误 token 发帖" }),
    });
    expect(invalidTokenResponse.status).toBe(401);

    const forbiddenArticleResponse = await app.request("/api/campus/articles", {
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
    const editorAuthorization = await login("editor");
    const beforeCount = await countRows(notifications);

    await createAuthInviteNotificationInDb(1);
    const expiryTarget = await createContentExpiryNotificationInDb(1, "campus-a1");
    const changedTarget = await createArticleChangedNotificationInDb("campus-a1", "测试变化提醒");
    const claimTarget = await createSpaceClaimNotificationInDb(1, "food");

    expect(expiryTarget).toBeTruthy();
    expect(changedTarget).toBeTruthy();
    expect(claimTarget).toBeTruthy();
    expect(await countRows(notifications)).toBe(beforeCount + 4);

    const response = await app.request("/api/notification/inbox", {
      headers: { Authorization: authorization },
    });
    const body = await response.json();
    const types = body.data.notifications.map((item: { type: string }) => item.type);

    const editorResponse = await app.request("/api/notification/inbox", {
      headers: { Authorization: editorAuthorization },
    });
    const editorBody = await editorResponse.json();
    const editorTypes = editorBody.data.notifications.map((item: { type: string }) => item.type);

    expect(types).toContain("auth_invite");
    expect(types).toContain("expiry");
    expect(types).toContain("claim");
    expect(editorTypes).toContain("changed");
  });
});

describe("site isolation", () => {
  it("cn reviewer cannot access com moderation queue", async () => {
    const cnToken = `Bearer ${signToken({ sub: "1", name: "审核员", site: "cn", role: "reviewer" })}`;
    const response = await app.request("/api/moderation/tasks", {
      headers: {
        Authorization: cnToken,
        "x-pangen-site": "com",
      },
    });
    expect([401, 403]).toContain(response.status);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  it("com reviewer cannot access cn moderation queue", async () => {
    const comToken = `Bearer ${signToken({ sub: "1", name: "审核员", site: "com", role: "reviewer" })}`;
    const response = await app.request("/api/moderation/tasks", {
      headers: {
        Authorization: comToken,
        "x-pangen-site": "cn",
      },
    });
    expect([401, 403]).toContain(response.status);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  it("admin can use site=all to query users across sites", async () => {
    const adminToken = adminAuthorization("cn");
    const response = await app.request("/api/admin/users?site=all", {
      headers: { Authorization: adminToken },
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.items).toBeDefined();
  });

  it("non-admin cannot use site=all", async () => {
    const reviewerToken = `Bearer ${signToken({ sub: "1", name: "审核员", site: "cn", role: "reviewer" })}`;
    const response = await app.request("/api/admin/users?site=all", {
      headers: { Authorization: reviewerToken },
    });
    expect(response.status).toBe(403);
  });
});

