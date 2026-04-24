import type {
  EmailVerificationRequest,
  EmailVerificationResponse,
  IdentityMeResponse,
  IdentitySession,
  IdentityUser,
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
  IdentityMeResponse,
  IdentitySession,
  IdentityUser,
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
  email: string;
  passwordHash: string;
  site: "cn" | "com";
  consentVersion?: string;
  emailVerificationToken: string;
  emailVerificationExpiresAt: Date;
}
