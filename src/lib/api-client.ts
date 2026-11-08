import { hardNavigate } from './navigation';

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

// ---------------------------------------------------------------------------
// Staying logged in
//
// The access token lives 15 minutes. When a request comes back 401, we ask the
// API for a fresh one (POST /auth/refresh, using the httpOnly refresh cookie)
// and retry the request once. The user never notices.
// ---------------------------------------------------------------------------

/** Endpoints where a 401 means "wrong credentials", not "session expired". */
const NO_REFRESH_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
]);

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Several requests can fail at once (e.g. a dashboard loading 5 things).
 * They all share ONE refresh call instead of each starting their own.
 */
function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch(`${API_BASE_PATH}/auth/refresh`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/**
 * Called when the session can't be renewed. Logging out first clears the
 * session cookies, so the login page isn't redirected straight back here.
 * A full page load then resets all in-memory data.
 */
async function defaultSessionExpiredHandler(): Promise<void> {
  if (typeof window === 'undefined') return;
  await fetch(`${API_BASE_PATH}/auth/logout`, {
    method: 'POST',
    credentials: 'same-origin',
  }).catch(() => undefined);
  const next = window.location.pathname + window.location.search;
  hardNavigate(`/login?next=${encodeURIComponent(next)}`);
}

let onSessionExpired: () => void | Promise<void> = defaultSessionExpiredHandler;

/** Lets tests observe session expiry instead of navigating. */
export function setSessionExpiredHandler(
  handler: () => void | Promise<void>,
): () => void {
  onSessionExpired = handler;
  return () => {
    onSessionExpired = defaultSessionExpiredHandler;
  };
}

async function send(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE_PATH}${path}`, {
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
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response = await send(path, init);

  if (response.status === 401 && !NO_REFRESH_PATHS.has(path)) {
    // Retry even if this refresh failed: another browser tab may have just
    // refreshed the shared cookies, in which case the retry succeeds.
    await refreshSession();
    response = await send(path, init);
    if (response.status === 401) {
      void onSessionExpired();
    }
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
  put: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = void>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: 'DELETE',
      ...(body !== undefined && { body: JSON.stringify(body) }),
    }),
};
