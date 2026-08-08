export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * app.enwis.uz owns every product endpoint below /api/v1/app.  Identity
 * endpoints deliberately remain shared under /api/v1/auth.
 */
function appPath(path: string): string {
  if (path.startsWith("/auth/")) return path;
  return path.startsWith("/app/") ? path : `/app${path}`;
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setAuthTokens(tokens: { access_token: string; refresh_token?: string }) {
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token ?? null;
}

export function clearAuthTokens() {
  accessToken = null;
  refreshToken = null;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        // Content-Type: application/json with a genuinely empty body makes
        // FastAPI try to parse zero bytes as JSON and fail with 422
        // Unprocessable Content before the request even reaches the route —
        // the refresh_token field being optional (cookie fallback) never
        // gets a chance to kick in. Sending "{}" is a valid, empty JSON
        // object so the body parses fine and the backend falls through to
        // the refresh-token cookie, same as authService.refresh() already
        // does implicitly (its `refresh_token` param is undefined here too,
        // which JSON.stringify drops, also producing "{}").
        body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const urlPath = appPath(path);

  let res = await fetch(`${API_BASE}${urlPath}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !path.includes("/auth/")) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      res = await fetch(`${API_BASE}${urlPath}`, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    // Backend errors are plain FastAPI shape: { "detail": "..." | [...] }
    const rawDetail = data?.detail ?? data?.error?.detail;
    const detail = Array.isArray(rawDetail)
      ? rawDetail.map((e: { msg?: string }) => e?.msg).filter(Boolean).join(", ")
      : rawDetail || data?.message || res.statusText;
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

async function requestBlob(path: string): Promise<Blob> {
  const urlPath = appPath(path);
  let res = await fetch(`${API_BASE}${urlPath}`, {
    method: "GET",
    credentials: "include",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (res.status === 401 && !path.includes("/auth/")) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
        res = await fetch(`${API_BASE}${urlPath}`, {
          method: "GET",
          credentials: "include",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const detail = (Array.isArray(data?.detail) ? data.detail.map((e: { msg?: string }) => e?.msg).filter(Boolean).join(", ") : data?.detail) || data?.message || res.statusText;
    throw new ApiError(res.status, detail);
  }

  return res.blob();
}

async function requestFormData<T>(path: string, formData: FormData, method = "PATCH"): Promise<T> {
  const urlPath = appPath(path);
  let res = await fetch(`${API_BASE}${urlPath}`, {
    method,
    credentials: "include",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: formData,
  });

  if (res.status === 401 && !path.includes("/auth/")) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      res = await fetch(`${API_BASE}${urlPath}`, {
          method,
          credentials: "include",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          body: formData,
        });
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const detail = (Array.isArray(data?.detail) ? data.detail.map((e: { msg?: string }) => e?.msg).filter(Boolean).join(", ") : data?.detail) || data?.message || res.statusText;
    throw new ApiError(res.status, detail);
  }

  return res.json();
}

async function requestPostFormData<T>(path: string, formData: FormData): Promise<T> {
  return requestFormData<T>(path, formData, "POST");
}

async function requestPatchFormData<T>(path: string, formData: FormData): Promise<T> {
  return requestFormData<T>(path, formData, "PATCH");
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string, body?: unknown) => request<T>(path, { method: "DELETE", body }),
  upload: <T>(path: string, formData: FormData) => requestPatchFormData<T>(path, formData),
  postUpload: <T>(path: string, formData: FormData) => requestPostFormData<T>(path, formData),
  getBlob: (path: string) => requestBlob(path),
};
