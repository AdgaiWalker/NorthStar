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
import { articlesRoute } from "./routes/articles";
import { authRoute } from "./routes/auth";
import { feedRoute } from "./routes/feed";
import { favoritesRoute } from "./routes/favorites";
import { feedbacksRoute } from "./routes/feedbacks";
import { meRoute } from "./routes/me";
import { notificationsRoute } from "./routes/notifications";
import { postsRoute } from "./routes/posts";
import { reportsRoute } from "./routes/reports";
import { searchRoute } from "./routes/search";
import { spacesRoute } from "./routes/spaces";

config();

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

app.route("/", spacesRoute);
app.route("/", articlesRoute);
app.route("/", postsRoute);
app.route("/", feedbacksRoute);
app.route("/", authRoute);
app.route("/", aiRoute);
app.route("/", reportsRoute);
app.route("/", feedRoute);
app.route("/", searchRoute);
app.route("/", meRoute);
app.route("/", notificationsRoute);
app.route("/", favoritesRoute);
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
}
