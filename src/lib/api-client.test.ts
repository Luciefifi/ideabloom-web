import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';
import { jsonResponse } from '@/test/render';
import {
  api,
  ApiError,
  NetworkError,
  setSessionExpiredHandler,
} from './api-client';

describe('api client', () => {
  it('calls the API through the /api/v1 prefix and returns JSON', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ status: 'ok' }));

    const result = await api.get<{ status: string }>('/health');

    expect(result).toEqual({ status: 'ok' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/health',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
  });

  it('sends a JSON body with the right content type', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ id: '1' }, 201));

    await api.post('/ideas', { title: 'New idea' });

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify({ title: 'New idea' }));
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('turns an API error response into an ApiError with its message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        { statusCode: 404, error: 'Not Found', message: 'Idea not found' },
        404,
      ),
    );

    const error = await api.get('/ideas/x').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(404);
    expect((error as ApiError).message).toBe('Idea not found');
  });

  it('keeps every validation message when the API returns a list', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        {
          statusCode: 400,
          error: 'Bad Request',
          message: ['title should not be empty', 'priority must be valid'],
        },
        400,
      ),
    );

    const error = (await api
      .post('/ideas', {})
      .catch((e: unknown) => e)) as ApiError;

    expect(error.message).toBe('title should not be empty');
    expect(error.messages).toEqual([
      'title should not be empty',
      'priority must be valid',
    ]);
  });

  it('gives a friendly message when the error body is not JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html>Bad gateway</html>', { status: 502 }),
    );

    const error = (await api
      .get('/health')
      .catch((e: unknown) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.body).toBeNull();
    expect(error.message).toMatch(/something went wrong/i);
  });

  it('throws a NetworkError when the server cannot be reached', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new TypeError('Failed to fetch'),
    );

    await expect(api.get('/health')).rejects.toBeInstanceOf(NetworkError);
  });
});

describe('automatic session refresh', () => {
  const user = { id: '1', displayName: 'Lucie' };
  const unauthorized = () =>
    jsonResponse(
      {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Your session has expired. Please log in again.',
      },
      401,
    );

  let onExpired: Mock<() => void>;
  let restoreHandler: () => void;

  beforeEach(() => {
    onExpired = vi.fn<() => void>();
    restoreHandler = setSessionExpiredHandler(onExpired);
  });

  afterEach(() => {
    restoreHandler();
  });

  /** Fakes the API: each URL answers with the next response from its list. */
  function fakeApi(responses: Record<string, Array<() => Response>>) {
    const calls: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = String(input);
      calls.push(url);
      const next = responses[url]?.shift();
      if (!next) throw new Error(`Unexpected request: ${url}`);
      return Promise.resolve(next());
    });
    return calls;
  }

  it('refreshes the session and retries when the access token has expired', async () => {
    const calls = fakeApi({
      '/api/v1/users/me': [unauthorized, () => jsonResponse(user)],
      '/api/v1/auth/refresh': [() => jsonResponse({ user })],
    });

    await expect(api.get('/users/me')).resolves.toEqual(user);
    expect(calls).toEqual([
      '/api/v1/users/me',
      '/api/v1/auth/refresh',
      '/api/v1/users/me',
    ]);
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('reports an expired session when refreshing fails too', async () => {
    fakeApi({
      '/api/v1/users/me': [unauthorized, unauthorized],
      '/api/v1/auth/refresh': [unauthorized],
    });

    await expect(api.get('/users/me')).rejects.toMatchObject({ status: 401 });
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('still succeeds if another tab refreshed the shared cookies first', async () => {
    fakeApi({
      '/api/v1/users/me': [unauthorized, () => jsonResponse(user)],
      '/api/v1/auth/refresh': [unauthorized], // lost the race to the other tab
    });

    await expect(api.get('/users/me')).resolves.toEqual(user);
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('never refreshes for a failed login (wrong password is not an expired session)', async () => {
    const calls = fakeApi({
      '/api/v1/auth/login': [unauthorized],
    });

    await expect(
      api.post('/auth/login', { email: 'a@b.c', password: 'x' }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(calls).toEqual(['/api/v1/auth/login']);
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('shares one refresh between requests that fail at the same time', async () => {
    const calls = fakeApi({
      '/api/v1/users/me': [unauthorized, () => jsonResponse(user)],
      '/api/v1/ideas': [unauthorized, () => jsonResponse([])],
      '/api/v1/auth/refresh': [() => jsonResponse({ user })],
    });

    await Promise.all([api.get('/users/me'), api.get('/ideas')]);

    expect(calls.filter((url) => url.endsWith('/auth/refresh'))).toHaveLength(
      1,
    );
  });
});
