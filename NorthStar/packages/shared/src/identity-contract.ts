import type { SiteContext } from './site';

export type PlatformRole = 'visitor' | 'user' | 'editor' | 'reviewer' | 'operator' | 'admin';

export interface IdentityUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: PlatformRole;
  site: Exclude<SiteContext, 'all'>;
  emailVerified: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  site: Exclude<SiteContext, 'all'>;
  consentVersion?: string;
}

export interface LoginRequest {
  account: string;
  password: string;
  site: Exclude<SiteContext, 'all'>;
}

export interface IdentitySession {
  token: string;
  user: IdentityUser;
}

export interface EmailVerificationRequest {
  token: string;
}

export interface PasswordResetRequest {
  email: string;
  site: Exclude<SiteContext, 'all'>;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
}
