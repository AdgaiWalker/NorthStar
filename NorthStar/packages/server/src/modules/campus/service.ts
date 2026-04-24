import type { AuthTokenPayload } from "../../lib/auth";
import { writeAuditLog } from "../platform/service";
import { canCreateCampusSpace, createCampusSpace, readCampusModuleStatus } from "./repository";
import type { CreateCampusSpaceRequest, SiteContext } from "./types";

export function getCampusModuleStatus() {
  return readCampusModuleStatus();
}

export async function submitCampusSpace(site: SiteContext, actor: AuthTokenPayload, input: CreateCampusSpaceRequest) {
  if (site !== "cn" || actor.site !== "cn") return resultError("SITE_FORBIDDEN", "校园空间只能在 cn 站点创建", 403);

  const actorId = Number(actor.sub);
  if (!Number.isInteger(actorId)) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const validation = validateSpaceInput(input);
  if (validation) return resultError("VALIDATION_ERROR", validation, 400);

  if (!(await canCreateCampusSpace(actorId))) {
    return resultError("CREATE_SPACE_FORBIDDEN", "当前账号还不能创建空间", 403);
  }

  const normalizedInput = {
    ...input,
    slug: normalizeSlug(input.slug),
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
  };
  const space = await createCampusSpace(site, actorId, normalizedInput);
  if (space === "duplicate") return resultError("SPACE_DUPLICATE", "空间标识已存在，请换一个", 409);
  if (!space) return resultError("DATABASE_UNAVAILABLE", "数据库不可用，空间创建失败", 503);

  await writeAuditLog({
    actorId,
    site,
    targetType: "space",
    targetId: space.id,
    action: "campus.space_created",
    before: null,
    after: { ...space },
  });

  return resultOk(space);
}

function validateSpaceInput(input: CreateCampusSpaceRequest) {
  if (!input.title?.trim()) return "请填写空间名称";
  if (!input.slug?.trim()) return "请填写空间标识";
  if (!/^[a-z0-9-]{2,40}$/.test(normalizeSlug(input.slug))) return "空间标识只能包含小写字母、数字和短横线，长度 2-40";
  if (!input.description?.trim()) return "请填写空间说明";
  if (!input.category?.trim()) return "请选择空间分类";
  return null;
}

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

interface Result<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: 400 | 401 | 403 | 409 | 503;
  };
}

function resultOk<T>(data: T): Result<T> {
  return { ok: true, data };
}

function resultError(
  code: string,
  message: string,
  status: 400 | 401 | 403 | 409 | 503,
): Result<never> {
  return { ok: false, error: { code, message, status } };
}
