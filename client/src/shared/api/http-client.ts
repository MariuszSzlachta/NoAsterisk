export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface HttpClient {
  get: <T>(path: string, options?: RequestOptions) => Promise<T>;
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
  delete: <T>(path: string, options?: RequestOptions) => Promise<T>;
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

const BASE_URL = '/api';

const getAuthToken = (): string | undefined => {
  return localStorage.getItem('access_token') ?? undefined;
};

const buildHeaders = (options?: RequestOptions): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      body,
    );
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
};

const request = async <T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: buildHeaders(options),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  });

  return handleResponse<T>(response);
};

export const httpClient: HttpClient = {
  get: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>('GET', path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>('POST', path, body, options),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>('PATCH', path, body, options),

  put: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>('PUT', path, body, options),

  delete: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>('DELETE', path, undefined, options),
};
