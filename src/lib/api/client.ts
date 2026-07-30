import { ApiError } from './error';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  errorDetails?: { field: string; message: string }[] | null;
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  token?: string | null;
  body?: unknown;
}

const getBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL is not set');
  }
  return url;
};

export const apiFetch = async <T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<{ data: T; meta?: Record<string, unknown> }> => {
  const { token, body, headers, ...rest } = options;

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const envelope = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !envelope.success) {
    throw new ApiError(response.status, envelope.message, envelope.errorDetails ?? null);
  }

  return { data: envelope.data, meta: envelope.meta };
};
