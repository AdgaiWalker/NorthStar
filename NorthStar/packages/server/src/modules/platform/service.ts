import type { AuthTokenPayload } from "../../lib/auth";
import { assertSiteReadable } from "../../db/site-aware";
import { createAuditLog, getAdminSummary, listAuditLogs, listSiteConfigs } from "./repository";
import type { CreateAuditLogInput, SiteContext } from "./types";

export async function readAdminSummary(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  return getAdminSummary(site);
}

export async function readAuditLogs(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  return listAuditLogs(site);
}

export async function readSiteConfigs(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  return listSiteConfigs(site);
}

export async function writeAuditLog(input: CreateAuditLogInput) {
  return createAuditLog(input);
}
