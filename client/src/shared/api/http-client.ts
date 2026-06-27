import { authTokens } from '#shared/api/auth-tokens';

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
  skipAuth?: boolean;
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

let refreshPromise: Promise<boolean> | undefined;

const attemptTokenRefresh = async (baseUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // sends httpOnly refresh cookie
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { access_token: string };
    authTokens.setAccessToken(data.access_token);
    return true;
  } catch {
    return false;
  }
};

export class HttpClient {
  readonly #baseUrl: string;
  readonly #tokenProvider: () => string | undefined;

  constructor(baseUrl: string, tokenProvider: () => string | undefined) {
    this.#baseUrl = baseUrl;
    this.#tokenProvider = tokenProvider;
  }

  async get<TResponse extends Record<string, unknown>>(
    path: string,
    options?: RequestOptions,
  ): Promise<TResponse> {
    return this.requestWithRetry<TResponse>('GET', path, undefined, options);
  }

  async post<
    TResponse extends Record<string, unknown>,
    TBody extends Record<string, unknown>,
  >(path: string, body: TBody, options?: RequestOptions): Promise<TResponse> {
    return this.requestWithRetry<TResponse>('POST', path, body, options);
  }

  async patch<
    TResponse extends Record<string, unknown>,
    TBody extends Record<string, unknown>,
  >(path: string, body: TBody, options?: RequestOptions): Promise<TResponse> {
    return this.requestWithRetry<TResponse>('PATCH', path, body, options);
  }

  async put<
    TResponse extends Record<string, unknown>,
    TBody extends Record<string, unknown>,
  >(path: string, body: TBody, options?: RequestOptions): Promise<TResponse> {
    return this.requestWithRetry<TResponse>('PUT', path, body, options);
  }

  async delete<TResponse extends Record<string, unknown>>(
    path: string,
    options?: RequestOptions,
  ): Promise<TResponse> {
    return this.requestWithRetry<TResponse>('DELETE', path, undefined, options);
  }

  private async requestWithRetry<TResponse extends Record<string, unknown>>(
    method: HttpMethod,
    path: string,
    body?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<TResponse> {
    try {
      return await this.request<TResponse>(method, path, body, options);
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 401 &&
        !options?.skipAuth
      ) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.request<TResponse>(method, path, body, options);
        }
        authTokens.clear();
      }
      throw error;
    }
  }

  private async refreshToken(): Promise<boolean> {
    if (!refreshPromise) {
      refreshPromise = attemptTokenRefresh(this.#baseUrl).finally(() => {
        refreshPromise = undefined;
      });
    }
    return refreshPromise;
  }

  private async request<TResponse extends Record<string, unknown>>(
    method: HttpMethod,
    path: string,
    body?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<TResponse> {
    const headers = this.buildHeaders(options);

    const response = await fetch(`${this.#baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options?.signal,
      credentials: 'include',
    });

    return this.handleResponse<TResponse>(response);
  }

  private buildHeaders(options?: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    const token = this.#tokenProvider();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<TResponse extends Record<string, unknown>>(
    response: Response,
  ): Promise<TResponse> {
    if (!response.ok) {
      const body = await response.json().catch(() => undefined);
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        body,
      );
    }

    if (response.status === 204) {
      return {} as TResponse;
    }

    return response.json() as Promise<TResponse>;
  }
}

export const apiClient = new HttpClient('/api', () =>
  authTokens.getAccessToken(),
);
