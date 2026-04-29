import type {
  EmailVerificationRequest,
  EmailVerificationResponse,
  ApplicationRequestInput,
  ApplicationRequestRecord,
  CreateInviteCodeRequest,
  GitHubOAuthStartRequest,
  GitHubOAuthStartResponse,
  GitHubOAuthStatusResponse,
  IdentityMeResponse,
  IdentitySession,
  IdentityUser,
  InviteCodeRecord,
  LoginRequest,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  RegisterRequest,
} from "@ns/shared";

export type {
  EmailVerificationRequest,
  EmailVerificationResponse,
  ApplicationRequestInput,
  ApplicationRequestRecord,
  CreateInviteCodeRequest,
  GitHubOAuthStartRequest,
  GitHubOAuthStartResponse,
  GitHubOAuthStatusResponse,
  IdentityMeResponse,
  IdentitySession,
  IdentityUser,
  InviteCodeRecord,
  LoginRequest,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  RegisterRequest,
};

export interface IdentityModuleStatus {
  module: "identity";
  ready: boolean;
}

export interface IdentityCreateInput {
  username: string;
  email?: string;
  passwordHash?: string;
  site: "cn" | "com";
  githubId?: string;
  nickname?: string;
  avatar?: string;
  emailVerified?: boolean;
  consentVersion?: string;
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: Date;
}
