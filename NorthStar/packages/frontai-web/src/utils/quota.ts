import { STORAGE_KEYS } from './storage';
import { GuestQuotaState } from '@ns/shared';

export type { GuestQuotaState };

// 游客额度：本地存储分桶（AI 搜索 / AI 方案），每日 00:00（本机时间）重置。
const DAILY_LIMITS = {
  aiSearch: 3,
  aiSolution: 3,
} as const;

export type GuestQuotaBucket = keyof typeof DAILY_LIMITS;

const computeNextResetAt = (now: Date): number =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime();

const safeNonNegativeInt = (value: unknown, fallback: number): number => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
};

const readNumber = (key: string): number | null => {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;

  // 兼容：我们始终用 JSON.stringify 写入，但读取时仍做防御。
  try {
    const parsed = JSON.parse(raw);
    const n = safeNonNegativeInt(parsed, NaN);
    return Number.isFinite(n) ? n : null;
  } catch {
    const n = safeNonNegativeInt(raw, NaN);
    return Number.isFinite(n) ? n : null;
  }
};

const writeNumber = (key: string, value: number): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

const clampRemaining = (raw: unknown, limit: number): number => {
  const n = safeNonNegativeInt(raw, limit);
  return Math.min(limit, n);
};

const ensureGuestQuotaFresh = (): GuestQuotaState => {
  const now = new Date();
  const nowMs = now.getTime();

  let resetAt = readNumber(STORAGE_KEYS.guestQuotaResetAt);
  const shouldReset = resetAt == null || nowMs >= resetAt;

  if (shouldReset) {
    resetAt = computeNextResetAt(now);
    writeNumber(STORAGE_KEYS.guestQuotaResetAt, resetAt);
    writeNumber(STORAGE_KEYS.guestQuotaAiSearch, DAILY_LIMITS.aiSearch);
    writeNumber(STORAGE_KEYS.guestQuotaAiSolution, DAILY_LIMITS.aiSolution);
  }

  const aiSearchRemaining = clampRemaining(
    readNumber(STORAGE_KEYS.guestQuotaAiSearch),
    DAILY_LIMITS.aiSearch
  );
  const aiSolutionRemaining = clampRemaining(
    readNumber(STORAGE_KEYS.guestQuotaAiSolution),
    DAILY_LIMITS.aiSolution
  );

  // 确保存储里不会出现超出上限的值。
  writeNumber(STORAGE_KEYS.guestQuotaAiSearch, aiSearchRemaining);
  writeNumber(STORAGE_KEYS.guestQuotaAiSolution, aiSolutionRemaining);

  return { aiSearchRemaining, aiSolutionRemaining, resetAt: resetAt ?? computeNextResetAt(now) };
};

export const getGuestQuotaState = (): GuestQuotaState => ensureGuestQuotaFresh();

export const consumeGuestQuota = (
  bucket: GuestQuotaBucket,
  cost: number = 1
): { allowed: boolean; state: GuestQuotaState } => {
  const state = ensureGuestQuotaFresh();
  if (cost <= 0) return { allowed: true, state };

  const remainingKey = bucket === 'aiSearch' ? 'aiSearchRemaining' : 'aiSolutionRemaining';
  const remaining = state[remainingKey];
  if (remaining < cost) {
    return { allowed: false, state };
  }

  const next = remaining - cost;
  if (bucket === 'aiSearch') {
    writeNumber(STORAGE_KEYS.guestQuotaAiSearch, next);
  } else {
    writeNumber(STORAGE_KEYS.guestQuotaAiSolution, next);
  }

  return { allowed: true, state: { ...state, [remainingKey]: next } as GuestQuotaState };
};

export const DAILY_GUEST_QUOTA_LIMITS = DAILY_LIMITS;
