import type { AiGatewayModuleStatus } from "./types";

export function readAiGatewayModuleStatus(): AiGatewayModuleStatus {
  return { module: "ai-gateway", ready: true };
}
