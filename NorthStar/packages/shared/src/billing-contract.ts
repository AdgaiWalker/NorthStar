import type { SiteContext } from './site';

export type BillingProvider = 'manual' | 'stripe' | 'wechat' | 'alipay';
export type PaymentOrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';

export interface QuotaRecord {
  id: string;
  userId: string;
  site: Exclude<SiteContext, 'all'>;
  aiCreditsRemaining: number;
  updatedAt: string;
}

export interface PaymentOrderRecord {
  id: string;
  userId: string;
  site: Exclude<SiteContext, 'all'>;
  provider: BillingProvider;
  status: PaymentOrderStatus;
  amountCents: number;
  currency: string;
  createdAt: string;
  paidAt?: string;
}
