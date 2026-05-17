import { ApiError, apiRequest, getAccessToken } from "./client";
import { getApiBaseUrl } from "./config";
import type { WorkflowStatus } from "./workflows";

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessageDto = {
  role: ChatRole;
  content: string;
};

export type SessionChatResponse = {
  session_id: string;
  reply: string;
  workflow?: WorkflowStatus | null;
};

export type SessionHistoryResponse = {
  session_id: string;
  messages: ChatMessageDto[];
  workflow?: WorkflowStatus | null;
};

export type NewSessionResponse = {
  session_id: string;
};

export type StreamSessionHandlers = {
  onSession?: (sessionId: string) => void;
  onToken?: (content: string) => void;
  onDone?: (sessionId: string, reply: string) => void;
  onError?: (detail: string) => void;
};

type StreamEvent =
  | { event: "session"; session_id: string }
  | { event: "token"; content: string }
  | { event: "done"; session_id: string; reply: string }
  | { event: "error"; detail: string };

const STREAM_TIMEOUT_MS = 120_000;

function resolveUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (base.startsWith("/")) return `${base}${normalized}`;
  return `${base}${normalized}`;
}

function dispatchStreamEvent(payload: StreamEvent, handlers: StreamSessionHandlers) {
  switch (payload.event) {
    case "session":
      handlers.onSession?.(payload.session_id);
      break;
    case "token":
      handlers.onToken?.(payload.content);
      break;
    case "done":
      handlers.onDone?.(payload.session_id, payload.reply);
      break;
    case "error":
      handlers.onError?.(payload.detail);
      break;
  }
}

function parseStreamBuffer(
  buffer: string,
  handlers: StreamSessionHandlers,
): string {
  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      dispatchStreamEvent(JSON.parse(trimmed) as StreamEvent, handlers);
    } catch {
      // ignore malformed lines
    }
  }
  return rest;
}

export async function streamSessionMessage(
  message: string,
  sessionId: string | undefined,
  handlers: StreamSessionHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const token = await getAccessToken();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

  const linkedAbort = () => controller.abort();
  signal?.addEventListener("abort", linkedAbort);

  try {
    const response = await fetch(resolveUrl("/chat/session/stream"), {
      method: "POST",
      signal: signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        session_id: sessionId ?? null,
        message,
      }),
    });

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

    const reader = response.body?.getReader();
    if (!reader) {
      throw new ApiError("No response body from stream endpoint", 502);
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer = parseStreamBuffer(buffer + decoder.decode(value, { stream: true }), handlers);
    }

    if (buffer.trim()) {
      parseStreamBuffer(`${buffer}\n`, handlers);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        `Request timed out after ${Math.round(STREAM_TIMEOUT_MS / 1000)}s. Check that the API on port 8000 is running.`,
        408,
      );
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", linkedAbort);
  }
}

/** Non-streaming fallback (workflow sync is a separate POST). */
export function sendSessionMessage(message: string, sessionId?: string) {
  return apiRequest<SessionChatResponse>("/chat/session", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId ?? null,
      message,
    }),
  });
}

export function createChatSession() {
  return apiRequest<NewSessionResponse>("/chat/sessions", { method: "POST" });
}

export function getSessionHistory(sessionId: string) {
  return apiRequest<SessionHistoryResponse>(`/chat/sessions/${encodeURIComponent(sessionId)}`);
}
