import { StudentCertification, Domain } from '../types';
import { DOMAIN_CONFIG } from '../constants/domains';

/** 领域级权限：所有领域公开 */
export function canAccessDomain(domain: Domain, cert: StudentCertification): boolean {
  const config = DOMAIN_CONFIG[domain];
  if (!config?.requiresAuth) return true;
  return cert.status === 'verified';
}

/**
 * 内容访问控制
 * 所有领域内容均公开可访问
 */
export function canAccessContent(
  meta: { domain: Domain; visibility?: string; schoolId?: string },
  _cert: StudentCertification
): boolean {
  // 所有 AI 前端内容公开
  return true;
}
