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
 * campus 可见性内容需要验证学校 ID
 */
export function canAccessContent(
  meta: { domain: Domain; visibility?: string; schoolId?: string },
  cert: StudentCertification
): boolean {
  if (meta.visibility !== 'campus') return true;
  if (cert.status !== 'verified') return false;
  if (cert.schoolId !== meta.schoolId) return false;
  return true;
}
