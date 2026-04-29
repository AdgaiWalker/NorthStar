import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { fileURLToPath } from "node:url";
import { aiGatewayRoute } from "./modules/ai-gateway/routes";
import { analyticsRoute } from "./modules/analytics/routes";
import { billingRoute } from "./modules/billing/routes";
import { campusRoute } from "./modules/campus/routes";
import { compassRoute } from "./modules/compass/routes";
import { complianceRoute } from "./modules/compliance/routes";
import { identityRoute } from "./modules/identity/routes";
import { moderationRoute } from "./modules/moderation/routes";
import { notificationRoute } from "./modules/notification/routes";
import { platformRoute } from "./modules/platform/routes";
import { siteMiddleware } from "./middleware/site";
import { aiRoute } from "./routes/ai";
import { reportsRoute } from "./routes/reports";
import { cleanupAnalyticsData } from "./modules/analytics/service";

config();

// 初始化邮件 provider（检查 SMTP 配置）
import { initEmailProvider } from "./modules/notification/email-provider";
initEmailProvider();

interface HealthResponse {
  status: "ok";
  service: "frontlife-api";
  timestamp: string;
}

export const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use("/api/*", siteMiddleware);

app.get("/api/health", (c) => {
  const body: HealthResponse = {
    status: "ok",
    service: "frontlife-api",
    timestamp: new Date().toISOString(),
  };

  return c.json(body);
});

app.route("/", aiRoute);
app.route("/", reportsRoute);
app.route("/", platformRoute);
app.route("/", moderationRoute);
app.route("/", identityRoute);
app.route("/", campusRoute);
app.route("/", compassRoute);
app.route("/", aiGatewayRoute);
app.route("/", notificationRoute);
app.route("/", analyticsRoute);
app.route("/", billingRoute);
app.route("/", complianceRoute);

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const port = Number(process.env.PORT ?? 4000);

  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`frontlife-api listening on http://localhost:${info.port}`);
    },
  );

  // 注册行为数据自动清理任务（每 24 小时执行一次）
  const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 小时

  setInterval(async () => {
    try {
      console.log("[Cleanup] Starting analytics data cleanup (90+ days old)...");
      const result = await cleanupAnalyticsData(90);
      console.log(`[Cleanup] Completed: deleted ${result.deleted} events older than ${result.maxAgeDays} days`);
    } catch (error) {
      console.error("[Cleanup] Failed:", error);
    }
  }, CLEANUP_INTERVAL_MS);

  // 启动后立即执行一次清理（可选）
  setTimeout(async () => {
    try {
      console.log("[Cleanup] Initial analytics data cleanup (90+ days old)...");
      const result = await cleanupAnalyticsData(90);
      console.log(`[Cleanup] Initial cleanup completed: deleted ${result.deleted} events`);
    } catch (error) {
      console.error("[Cleanup] Initial cleanup failed:", error);
    }
  }, 5000); // 延迟 5 秒执行，确保服务已完全启动
}
