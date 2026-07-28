import axios, { AxiosError } from 'axios'

/**
 * Shared HTTP client for the backend API (web client profile).
 *
 * - Auth tokens travel as **httpOnly cookies** — never stored in JS. All we do
 *   is send credentials and echo the readable `csrf_token` cookie back in the
 *   `X-CSRF-Token` header on mutating requests (double-submit CSRF).
 * - In dev the Vite proxy forwards `/api` to the backend (same origin), so no
 *   base URL is needed; `VITE_API_URL` overrides it when deployed differently.
 * - Backend errors arrive in a JSON envelope
 *   `{ success:false, statusCode, error, message, issues? }` — normalized here
 *   into `ApiError` so pages can just render `err.message`.
 */

export const http = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string | undefined) ?? '',
  withCredentials: true,
})

function readCookie(name: string): string | undefined {
  const match = document.cookie
    .split('; ')
    .find((part) => part.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

http.interceptors.request.use((config) => {
  if ((config.method ?? 'get').toLowerCase() !== 'get') {
    const csrf = readCookie('csrf_token')
    if (csrf) config.headers.set('X-CSRF-Token', csrf)
  }
  return config
})

/** Field-level detail from a 422 validation error. */
export interface ApiIssue {
  path: string
  message: string
}

export class ApiError extends Error {
  statusCode: number
  issues?: ApiIssue[]

  constructor(message: string, statusCode: number, issues?: ApiIssue[]) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.issues = issues
  }
}

interface ErrorEnvelope {
  message?: string
  statusCode?: number
  issues?: ApiIssue[]
}

/** Normalizes any thrown value into an `ApiError` with a friendly message. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ErrorEnvelope>
    const body = axiosErr.response?.data
    if (body?.message) {
      // Prefer the first field-level issue — it's the most actionable text.
      const message = body.issues?.[0]?.message ?? body.message
      return new ApiError(message, body.statusCode ?? axiosErr.response?.status ?? 0, body.issues)
    }
    if (axiosErr.response) {
      return new ApiError(`Request failed (${axiosErr.response.status})`, axiosErr.response.status)
    }
    return new ApiError('Cannot reach the server. Is the backend running?', 0)
  }
  return new ApiError(err instanceof Error ? err.message : 'Something went wrong', 0)
}

/** Runs a request and rethrows failures as `ApiError`. */
export async function call<T>(request: Promise<{ data: { data: T } }>): Promise<T> {
  try {
    const response = await request
    return response.data.data
  } catch (err) {
    throw toApiError(err)
  }
}

/** Pagination envelope returned alongside `list()` responses. */
export interface ListMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Like `call`, but keeps the `meta` envelope — needed for server-paginated
 * endpoints where the caller must know the total and page count.
 */
export async function callList<T>(
  request: Promise<{ data: { data: T[]; meta: ListMeta } }>,
): Promise<{ items: T[]; meta: ListMeta }> {
  try {
    const response = await request
    return { items: response.data.data, meta: response.data.meta }
  } catch (err) {
    throw toApiError(err)
  }
}
