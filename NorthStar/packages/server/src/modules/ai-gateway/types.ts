export interface AiGatewayModuleStatus {
  module: "ai-gateway";
  ready: boolean;
}

export type AiGatewayMode = "ai" | "demo";

export type AiGatewayFallbackReason =
  | ""
  | "missing_key"
  | "network_error"
  | "empty_result"
  | "quota_exhausted"
  | "sensitive_blocked"
  | "sensitive_output";

export interface AiGatewayLogRecord {
  id: string;
  site: "cn" | "com";
  userId: string | null;
  route: string;
  mode: AiGatewayMode;
  fallbackReason: AiGatewayFallbackReason;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  costCents: number;
  createdAt: string;
}
