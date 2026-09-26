# DEC-040 — HTTP Client — class with constructor DI + constrained generics

## Source status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-25

**Decision:** `HttpClient` is a class with dependency injection (baseUrl, tokenProvider in the constructor). Generics are constrained to `Record<string, unknown>` — they will not allow primitives or `any`. Generic names are descriptive: `TResponse`, `TBody`.

**Pattern:**
```typescript
class HttpClient {
  constructor(baseUrl: string, tokenProvider: () => string | undefined)
  get<TResponse extends Record<string, unknown>>(path, options?): Promise<TResponse>
  post<TResponse extends Record<string, unknown>, TBody extends Record<string, unknown>>(path, body, options?): Promise<TResponse>
}
export const apiClient = new HttpClient('/api', () => localStorage.getItem('access_token') ?? undefined);
```

**Justification:**
- Testing: `new HttpClient('/mock', () => 'token')` — no mocking of localStorage
- Type safety: `apiClient.get<string>('/x')` → compile error
- Multi-instancy: separate client for AI service with a different baseUrl in the future
- Consistency with backend: class with DI

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-040`
- Original order: 40 of 59
- Original source lines: 742–762
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
