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
  email?: string;
  password: string;
  site: Exclude<SiteContext, 'all'>;
  consentVersion?: string;
  inviteCode?: string;
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

export interface IdentityMeResponse {
  user: IdentityUser;
}

export interface EmailVerificationRequest {
  token: string;
}

export interface EmailVerificationResponse {
  user: IdentityUser;
}

export interface PasswordResetRequest {
  email: string;
  site: Exclude<SiteContext, 'all'>;
}

export interface PasswordResetRequestResponse {
  resetToken?: string;
  message: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
}

export interface PasswordResetConfirmResponse {
  message: string;
}

export type ApplicationRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ApplicationRequestInput {
  name: string;
  email: string;
  useCase: string;
  site: Exclude<SiteContext, 'all'>;
}

export interface ApplicationRequestRecord {
  id: string;
  site: Exclude<SiteContext, 'all'>;
  name: string;
  email: string;
  useCase: string;
  status: ApplicationRequestStatus;
  createdAt: string;
  reviewedAt?: string;
}

export interface CreateInviteCodeRequest {
  code?: string;
  site: Exclude<SiteContext, 'all'>;
  maxUses?: number;
  expiresAt?: string;
}

export interface InviteCodeRecord {
  id: string;
  site: Exclude<SiteContext, 'all'>;
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  createdBy?: string;
  createdAt: string;
}

export interface GitHubOAuthStatusResponse {
  configured: boolean;
  site: Exclude<SiteContext, 'all'>;
  callbackUrl?: string;
}

export interface GitHubOAuthStartRequest {
  site: Exclude<SiteContext, 'all'>;
}

export interface GitHubOAuthStartResponse {
  authorizeUrl: string;
}
