import { supabase } from "@/lib/supabase";
import { getApiBaseUrl } from "./config";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function resolveUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (base.startsWith("/")) return `${base}${normalized}`;
  return `${base}${normalized}`;
}

const DEFAULT_TIMEOUT_MS = 120_000;

export async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  options?: { requireAuth?: boolean },
): Promise<T> {
  const token = await getAccessToken();
  if (options?.requireAuth && !token) {
    throw new ApiError(
      "Sign in required. Log in with Supabase auth before saving or publishing workflows.",
      401,
    );
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(resolveUrl(path), {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        `Request timed out after ${Math.round(timeoutMs / 1000)}s. Check that the API on port 8000 is running and responding.`,
        408,
      );
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    const detail =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : response.statusText;
    throw new ApiError(detail || `Request failed (${response.status})`, response.status, body);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
