import type {
  AccountDeletionRequestInput,
  AccountDeletionRequestRecord,
  AccountDeletionStatus,
  ConsentRequest,
  DataExportResponse,
  LegalDocumentRecord,
  SiteContext,
  UserConsentRecord,
} from "@ns/shared";

export type {
  AccountDeletionRequestInput,
  AccountDeletionRequestRecord,
  AccountDeletionStatus,
  ConsentRequest,
  DataExportResponse,
  LegalDocumentRecord,
  SiteContext,
  UserConsentRecord,
};

export interface ComplianceModuleStatus {
  module: "compliance";
  ready: boolean;
}
