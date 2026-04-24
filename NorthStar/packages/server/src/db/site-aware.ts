import type { SiteContext } from "@ns/shared";

export interface SiteAwareQuery {
  site: SiteContext;
}

export function assertSiteReadable(site: SiteContext, userSite: SiteContext | undefined, role: string | undefined) {
  if (site === "all" && role !== "admin") {
    throw new SiteAccessError("只有 admin 可以跨站查询");
  }

  if (site !== "all" && userSite && userSite !== site && role !== "admin") {
    throw new SiteAccessError("当前登录态不能访问该站点数据");
  }
}

export class SiteAccessError extends Error {
  status = 403 as const;

  constructor(message: string) {
    super(message);
    this.name = "SiteAccessError";
  }
}
