import { describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '@/test/render';
import { api, ApiError, NetworkError } from './api-client';

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
