const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
  code?: string;
}

class ApiClientError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;
  code?: string;

  constructor(message: string, statusCode: number, errors?: Record<string, string[]>, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
  }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("oradent_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

/** Attempt to refresh the access token using the stored refresh token */
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = typeof window !== "undefined"
        ? localStorage.getItem("oradent_refresh_token")
        : null;

      if (!refreshToken) return false;

      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      localStorage.setItem("oradent_token", data.token || data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("oradent_refresh_token", data.refreshToken);
      }
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function clearAuthAndRedirect(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("oradent_token");
    localStorage.removeItem("oradent_refresh_token");
    localStorage.removeItem("oradent-app-store");
    window.location.href = "/login";
  }
}

async function handleResponse<T>(response: Response, retryFn?: () => Promise<Response>): Promise<T> {
  if (response.status === 401 && retryFn) {
    // Try refreshing the token
    const errorData = await response.json().catch(() => ({}));
    if (errorData.code === "TOKEN_EXPIRED") {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        const retryResponse = await retryFn();
        return handleResponse<T>(retryResponse);
      }
    }
    clearAuthAndRedirect();
    throw new ApiClientError("Unauthorized", 401);
  }

  if (response.status === 401) {
    clearAuthAndRedirect();
    throw new ApiClientError("Unauthorized", 401);
  }

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: response.statusText || "An unknown error occurred",
        statusCode: response.status,
      };
    }
    throw new ApiClientError(
      errorData.message || "Request failed",
      response.status,
      errorData.errors,
      errorData.code
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

async function fetchWithRetry(
  url: string,
  init: RequestInit
): Promise<{ response: Response; retry: () => Promise<Response> }> {
  const response = await fetch(url, init);
  const retry = () =>
    fetch(url, {
      ...init,
      headers: { ...init.headers, ...getAuthHeaders() },
    });
  return { response, retry };
}

export async function apiGet<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const init: RequestInit = {
    method: "GET",
    headers: { ...getAuthHeaders(), ...options?.headers },
    signal: options?.signal,
  };
  const { response, retry } = await fetchWithRetry(url, init);
  return handleResponse<T>(response, retry);
}

export async function apiPost<T, B = unknown>(
  endpoint: string,
  body?: B,
  options?: RequestOptions
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const init: RequestInit = {
    method: "POST",
    headers: { ...getAuthHeaders(), ...options?.headers },
    body: body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  };
  const { response, retry } = await fetchWithRetry(url, init);
  return handleResponse<T>(response, retry);
}

export async function apiPut<T, B = unknown>(
  endpoint: string,
  body?: B,
  options?: RequestOptions
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const init: RequestInit = {
    method: "PUT",
    headers: { ...getAuthHeaders(), ...options?.headers },
    body: body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  };
  const { response, retry } = await fetchWithRetry(url, init);
  return handleResponse<T>(response, retry);
}

export async function apiPatch<T, B = unknown>(
  endpoint: string,
  body?: B,
  options?: RequestOptions
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const init: RequestInit = {
    method: "PATCH",
    headers: { ...getAuthHeaders(), ...options?.headers },
    body: body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  };
  const { response, retry } = await fetchWithRetry(url, init);
  return handleResponse<T>(response, retry);
}

export async function apiDelete<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const init: RequestInit = {
    method: "DELETE",
    headers: { ...getAuthHeaders(), ...options?.headers },
    signal: options?.signal,
  };
  const { response, retry } = await fetchWithRetry(url, init);
  return handleResponse<T>(response, retry);
}

export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  options?: RequestOptions
): Promise<T> {
  const headers: Record<string, string> = {};

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("oradent_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { ...headers, ...options?.headers },
    body: formData,
    signal: options?.signal,
  });

  return handleResponse<T>(response);
}

export { ApiClientError };
export type { ApiError, RequestOptions };
