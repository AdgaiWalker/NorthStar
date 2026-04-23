import { Hono } from "hono";
import type { Context } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword, signToken, verifyPassword } from "../lib/auth";

interface AuthBody {
  username?: string;
  password?: string;
}

interface AuthUser {
  id: string;
  username: string;
  nickname: string;
}

const usersByName = new Map<string, AuthUser & { password: string }>([
  [
    "zhang",
    {
      id: "user-zhang",
      username: "zhang",
      nickname: "张同学",
      password: "password",
    },
  ],
]);

export const authRoute = new Hono();

authRoute.post("/api/auth/register", async (c) => {
  const body = await readAuthBody(c);
  const validation = validateAuthBody(body);

  if (validation) return c.json({ error: validation }, 400);

  const username = body.username!.trim();
  const password = body.password!;

  if (db) {
    const existing = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.username, username));

    if (existing[0]) {
      return c.json({ error: "username already exists" }, 409);
    }

    const [user] = await db
      .insert(users)
      .values({
        username,
        nickname: username,
        passwordHash: hashPassword(password),
        school: "黑河学院",
        trustLevel: "user",
      })
      .returning({
        id: users.id,
        username: users.username,
        nickname: users.nickname,
      });

    return c.json(toAuthResponse({ id: String(user.id), username: user.username, nickname: user.nickname }), 201);
  }

  if (usersByName.has(username)) {
    return c.json({ error: "username already exists" }, 409);
  }

  const user = {
    id: `user-${Date.now()}`,
    username,
    nickname: username,
    password,
  };
  usersByName.set(username, user);
  return c.json(toAuthResponse(user), 201);
});

authRoute.post("/api/auth/login", async (c) => {
  const body = await readAuthBody(c);
  const validation = validateAuthBody(body);

  if (validation) return c.json({ error: validation }, 400);

  const username = body.username!.trim();
  const password = body.password!;

  if (db) {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        nickname: users.nickname,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.username, username));

    const user = rows[0];

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return c.json({ error: "invalid username or password" }, 401);
    }

    return c.json(toAuthResponse({ id: String(user.id), username: user.username, nickname: user.nickname }));
  }

  const user = usersByName.get(username);

  if (!user || user.password !== password) {
    return c.json({ error: "invalid username or password" }, 401);
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

function validateAuthBody(body: AuthBody) {
  if (!body.username?.trim()) return "username is required";
  if (!body.password || body.password.length < 6) return "password must be at least 6 characters";
  return null;
}

function toAuthResponse(user: AuthUser) {
  return {
    token: signToken({
      sub: user.id,
      name: user.nickname,
    }),
    user: {
      id: user.id,
      name: user.nickname,
      username: user.username,
    },
  };
}
