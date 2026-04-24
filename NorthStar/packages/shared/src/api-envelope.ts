export interface ApiSuccessEnvelope<T> {
  ok: true;
  data: T;
  traceId?: string;
}

export interface ApiErrorEnvelope {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  traceId?: string;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export interface PageCursor {
  limit: number;
  nextCursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: PageCursor;
}
