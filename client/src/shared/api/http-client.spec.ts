import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, HttpClient } from '#shared/api/http-client';

const createMockResponse = (
  body: Record<string, unknown>,
  status = 200,
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('HttpClient', () => {
  let client: HttpClient;
  const tokenProvider = vi.fn<() => string | undefined>();

  beforeEach(() => {
    client = new HttpClient('/api', tokenProvider);
    tokenProvider.mockReturnValue('test-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createMockResponse({ ok: true }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('request construction', () => {
    it('prepends baseUrl to path', async () => {
      await client.get('/users');

      expect(fetch).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('includes Authorization header when token exists', async () => {
      await client.get('/users');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('omits Authorization header when token is undefined', async () => {
      tokenProvider.mockReturnValue(undefined);

      await client.get('/users');

      const headers = (fetch satisfies ReturnType<typeof vi.fn>).mock.calls[0]?.[1]
        ?.headers satisfies Record<string, string>;
      expect(headers['Authorization']).toBeUndefined();
    });

    it('sets Content-Type to application/json', async () => {
      await client.get('/users');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });
  });

  describe('HTTP methods', () => {
    it('sends GET without body', async () => {
      await client.get('/items');

      expect(fetch).toHaveBeenCalledWith(
        '/api/items',
        expect.objectContaining({ method: 'GET', body: undefined }),
      );
    });

    it('sends POST with JSON body', async () => {
      await client.post('/items', { name: 'test' });

      expect(fetch).toHaveBeenCalledWith(
        '/api/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        }),
      );
    });

    it('sends PATCH with JSON body', async () => {
      await client.patch('/items/1', { name: 'updated' });

      expect(fetch).toHaveBeenCalledWith(
        '/api/items/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ name: 'updated' }),
        }),
      );
    });

    it('sends DELETE without body', async () => {
      await client.delete('/items/1');

      expect(fetch).toHaveBeenCalledWith(
        '/api/items/1',
        expect.objectContaining({ method: 'DELETE', body: undefined }),
      );
    });

    it('sends DELETE with JSON body', async () => {
      await client.delete('/users/me', { password: 'secret' });

      expect(fetch).toHaveBeenCalledWith(
        '/api/users/me',
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ password: 'secret' }),
        }),
      );
    });
  });

  describe('response handling', () => {
    it('returns parsed JSON on success', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        createMockResponse({ data: 'value' }),
      );

      const result = await client.get<{ data: string }>('/test');

      expect(result).toEqual({ data: 'value' });
    });

    it('returns empty object on 204 No Content', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(null, { status: 204 }),
      );

      const result = await client.delete('/items/1');

      expect(result).toEqual({});
    });

    it('throws ApiError on non-ok response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ message: 'Not found' }), {
          status: 404,
          statusText: 'Not Found',
        }),
      );

      await expect(client.get('/missing')).rejects.toThrow(ApiError);
    });

    it('ApiError contains status and body', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ message: 'Forbidden' }), {
          status: 403,
          statusText: 'Forbidden',
        }),
      );

      try {
        await client.get('/secret');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        const error = e satisfies ApiError;
        expect(error.status).toBe(403);
        expect(error.body).toEqual({ message: 'Forbidden' });
      }
    });
  });

  describe('options', () => {
    it('passes AbortSignal to fetch', async () => {
      const controller = new AbortController();

      await client.get('/test', { signal: controller.signal });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('merges custom headers with defaults', async () => {
      await client.get('/test', { headers: { 'X-Custom': 'value' } });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom': 'value',
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('omits Authorization header when skipAuth is true even if token exists', async () => {
      tokenProvider.mockReturnValue('existing-token');

      await client.post(
        '/auth/login',
        { email: 'a@b.com', password: 'x' },
        { skipAuth: true },
      );

      const headers = (fetch satisfies ReturnType<typeof vi.fn>).mock.calls[0]?.[1]
        ?.headers satisfies Record<string, string>;
      expect(headers['Authorization']).toBeUndefined();
    });
  });
});
