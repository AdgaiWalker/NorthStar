import { Hono } from "hono";
import type { Context } from "hono";
import { and, eq, or } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { isSiteContext, type PlatformRole, type SiteContext } from "@ns/shared";
import { db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword, signToken, verifyPassword } from "../lib/auth";
import { requireSiteContext } from "../middleware/site";

interface AuthBody {
  account?: string;
  username?: string;
  email?: string;
  password?: string;
  site?: string;
}

interface AuthUser {
  id: string;
  username: string;
  email: string;
  nickname: string;
  site: Exclude<SiteContext, "all">;
  role: PlatformRole;
}

const usersByName = new Map<string, AuthUser & { password: string }>([
  [
    "zhang",
    {
      id: "user-zhang",
      username: "zhang",
      email: "zhang@example.com",
      nickname: "张同学",
      site: "cn",
      role: "user",
      password: "password",
    },
  ],
]);

export const authRoute = new Hono();

authRoute.post("/api/auth/register", async (c) => {
  const body = await readAuthBody(c);
  const siteContext = resolveAuthSite(c, body);
  const validation = validateRegisterBody(body, siteContext);

  if (validation) return c.json({ error: validation }, 400);

  const username = body.username!.trim();
  const email = body.email!.trim().toLowerCase();
  const password = body.password!;
  const site = toConcreteSite(siteContext);

  if (db) {
    const existing = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, email)));

    if (existing[0]) {
      return c.json({ error: "用户名或邮箱已被使用" }, 409);
    }

    const [user] = await db
      .insert(users)
      .values({
        username,
        email,
        site,
        role: "user",
        nickname: username,
        passwordHash: hashPassword(password),
        emailVerified: false,
        emailVerificationToken: randomBytes(24).toString("hex"),
        school: "黑河学院",
        trustLevel: "user",
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        nickname: users.nickname,
        site: users.site,
        role: users.role,
      });

    return c.json(
      toAuthResponse({
        id: String(user.id),
        username: user.username,
        email: user.email ?? email,
        nickname: user.nickname,
        site: toUserSite(user.site),
        role: user.role,
      }),
      201,
    );
  }

  if (usersByName.has(username) || [...usersByName.values()].some((user) => user.email === email)) {
    return c.json({ error: "用户名或邮箱已被使用" }, 409);
  }

  const user = {
    id: `user-${Date.now()}`,
    username,
    email,
    nickname: username,
    site,
    role: "user" as const,
    password,
  };
  usersByName.set(username, user);
  return c.json(toAuthResponse(user), 201);
});

authRoute.post("/api/auth/login", async (c) => {
  const body = await readAuthBody(c);
  const siteContext = resolveAuthSite(c, body);
  const validation = validateLoginBody(body, siteContext);

  if (validation) return c.json({ error: validation }, 400);

  const account = (body.account ?? body.username ?? body.email)!.trim().toLowerCase();
  const password = body.password!;
  const site = toConcreteSite(siteContext);

  if (db) {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        nickname: users.nickname,
        passwordHash: users.passwordHash,
        site: users.site,
        role: users.role,
        trustLevel: users.trustLevel,
      })
      .from(users)
      .where(and(eq(users.site, site), or(eq(users.username, account), eq(users.email, account))));

    const user = rows[0];

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return c.json({ error: "用户名、邮箱或密码不正确" }, 401);
    }

    return c.json(
      toAuthResponse({
        id: String(user.id),
        username: user.username,
        email: user.email ?? "",
        nickname: user.nickname,
        site: toUserSite(user.site),
        role: user.role ?? roleFromTrustLevel(user.trustLevel),
      }),
    );
  }

  const user = [...usersByName.values()].find(
    (item) => item.site === site && (item.username.toLowerCase() === account || item.email === account),
  );

  if (!user || user.password !== password) {
    return c.json({ error: "用户名、邮箱或密码不正确" }, 401);
  }

  return c.json(toAuthResponse(user));
});

async function readAuthBody(c: Context) {
  try {
    return await c.req.json<AuthBody>();
  } catch {
    return {};
  }
}

function validateRegisterBody(body: AuthBody, site: SiteContext) {
  if (site === "all") return "注册必须选择具体站点";
  if (!body.username?.trim()) return "请填写用户名";
  if (!body.email?.trim()) return "请填写邮箱";
  if (!isEmail(body.email)) return "邮箱格式不正确";
  if (!body.password || body.password.length < 6) return "密码至少需要 6 位";
  return null;
}

function validateLoginBody(body: AuthBody, site: SiteContext) {
  if (site === "all") return "登录必须选择具体站点";
  if (!(body.account ?? body.username ?? body.email)?.trim()) return "请填写用户名或邮箱";
  if (!body.password || body.password.length < 6) return "密码至少需要 6 位";
  return null;
}

function toAuthResponse(user: AuthUser) {
  return {
    token: signToken({
      sub: user.id,
      name: user.nickname,
      username: user.username,
      email: user.email,
      site: user.site,
      role: user.role,
    }),
    user: {
      id: user.id,
      name: user.nickname,
      username: user.username,
      email: user.email,
    },
  };
}

function resolveAuthSite(c: Context, body: AuthBody): SiteContext {
  if (isSiteContext(body.site)) return body.site;
  return requireSiteContext(c);
}

function toUserSite(site: string): Exclude<SiteContext, "all"> {
  return site === "com" ? "com" : "cn";
}

function toConcreteSite(site: SiteContext): Exclude<SiteContext, "all"> {
  return site === "com" ? "com" : "cn";
}

function roleFromTrustLevel(trustLevel: string): PlatformRole {
  if (trustLevel === "admin") return "admin";
  if (trustLevel === "author" || trustLevel === "senior") return "editor";
  return "user";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
