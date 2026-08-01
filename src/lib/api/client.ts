import { ApiError } from './error';
import { useAuthStore } from '../auth/store';

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

export interface ListMeta {
  total: number;
  page: number;
  limit: number;
}

const getBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL is not set');
  }
  return url;
};

// Uploaded files are served from the API's origin at /uploads/..., not under
// /api like everything else, so this can't just reuse getBaseUrl().
export const getUploadUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  return `${apiUrl.replace(/\/api\/?$/, '')}${path}`;
};

export const toQuery = (params: object): string => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params) as [string, string | number | undefined][]) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
};

export const apiFetch = async <T, M = Record<string, unknown>>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<{ data: T; meta?: M }> => {
  const { token = useAuthStore.getState().token, body, headers, ...rest } = options;

  // FormData bodies (file uploads) must NOT be JSON.stringify'd, and must NOT
  // get an explicit Content-Type: the browser sets multipart/form-data with
  // the correct boundary itself only when Content-Type is left unset.
  const isFormData = body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      ...rest,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Unable to reach the server. Check your connection and try again.');
  }

  let envelope: ApiEnvelope<T>;
  try {
    envelope = await response.json();
  } catch {
    throw new ApiError(response.status, 'Unexpected response from the server');
  }

  if (!response.ok || !envelope.success) {
    const details = Array.isArray(envelope.errorDetails) && envelope.errorDetails.length ? envelope.errorDetails : null;
    throw new ApiError(response.status, envelope.message, details);
  }

  return { data: envelope.data, meta: envelope.meta as M | undefined };
};
