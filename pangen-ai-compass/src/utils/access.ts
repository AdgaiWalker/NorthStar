import { StudentCertification, Domain } from '../types';
import { DOMAIN_CONFIG } from '../constants/domains';

/** 领域级权限：life 领域需认证，其余公开 */
export function canAccessDomain(domain: Domain, cert: StudentCertification): boolean {
  const config = DOMAIN_CONFIG[domain];
  if (!config?.requiresAuth) return true;
  return cert.status === 'verified';
}

/**
 * 内容访问控制
 * 层级：
 * 1) 领域权限：life 领域需要认证
 * 2) 学校隔离：life 领域必须 schoolId 匹配
 * 3) 内容权限：其他领域的 visibility=campus 需要认证 + schoolId 匹配
 */
export function canAccessContent(
  meta: { domain: Domain; visibility?: string; schoolId?: string },
  cert: StudentCertification
): boolean {
  // Level 1: 领域
  if (!canAccessDomain(meta.domain, cert)) return false;

  // Level 2: 生活专区学校隔离
  if (meta.domain === 'life') {
    return !!cert.schoolId && cert.schoolId === meta.schoolId;
  }

  // Level 3: 其他领域的 campus 内容
  if (meta.visibility === 'campus') {
    return cert.status === 'verified' && !!cert.schoolId && cert.schoolId === meta.schoolId;
  }

  return true;
}
