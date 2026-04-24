export type SiteContext = 'cn' | 'com' | 'all';

export const SITE_CONTEXTS: readonly SiteContext[] = ['cn', 'com', 'all'];

export function isSiteContext(value: unknown): value is SiteContext {
  return value === 'cn' || value === 'com' || value === 'all';
}
