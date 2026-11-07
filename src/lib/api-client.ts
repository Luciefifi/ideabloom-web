/**
 * The single place where the web app talks to the IdeaBloom API.
 *
 * The browser calls `/api/v1/...` on the web app's own address. Next.js forwards
 * (rewrites) those requests to the NestJS API (see next.config.ts). Because the
 * browser only ever sees one origin, login cookies work without CORS setup.
 */
export const API_BASE_PATH = '/api/v1';

/** The error shape every API error follows (see ideabloom-api AllExceptionsFilter). */
export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path?: string;
  timestamp?: string;
  [extra: string]: unknown;
}

/** Thrown for any non-2xx response, so callers can check `error.status`. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody | null,
  ) {
    super(ApiError.firstMessage(status, body));
    this.name = 'ApiError';
  }

  /** All messages (validation errors come back as a list). */
  get messages(): string[] {
    const message = this.body?.message;
    if (Array.isArray(message)) return message;
    return [message ?? this.message];
  }

  private static firstMessage(status: number, body: ApiErrorBody | null) {
    const message = body?.message;
    if (Array.isArray(message)) return message[0] ?? 'Request failed';
    if (message) return message;
    return status >= 500
      ? 'Something went wrong on our side. Please try again.'
      : 'Request failed';
  }
}

/** Thrown when the request never got a response (offline, DNS, server down). */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Could not reach the server. Check your connection and try again.', {
      cause,
    });
    this.name = 'NetworkError';
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'statusCode' in value &&
    'message' in value
  );
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null; // e.g. an HTML error page from a proxy
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_PATH}${path}`, {
      ...init,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch (cause) {
    throw new NetworkError(cause);
  }

  const data = await readJson(response);

  if (!response.ok) {
    throw new ApiError(response.status, isApiErrorBody(data) ? data : null);
  }

  return data as T;
}

/** Small helpers so feature code reads naturally: api.get('/ideas'), api.post('/ideas', body). */
export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = void>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
