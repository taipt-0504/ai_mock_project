import { AsyncLocalStorage } from "node:async_hooks";

type RequestContext = { requestId: string };

/**
 * Per-request context carrier. Populated by `middleware.ts` (Phase 6 task
 * T072) so logger lines carry a `request_id`. Until middleware lands every
 * line emits `request_id="(unset)"`.
 */
export const requestContext = new AsyncLocalStorage<RequestContext>();

/** Token / PII shapes that MUST never reach log output (Principle IV — A09). */
const REDACT_KEYS = new Set([
  "access_token",
  "refresh_token",
  "id_token",
  "code",
  "state",
  "code_verifier",
  "password",
  "client_secret",
]);
const GOOGLE_ACCESS_TOKEN_RE = /^ya29\.[\w.-]+$/;
const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

function redact(value: unknown): unknown {
  if (typeof value === "string") {
    if (GOOGLE_ACCESS_TOKEN_RE.test(value) || JWT_RE.test(value)) {
      return "[REDACTED]";
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACT_KEYS.has(k) ? "[REDACTED]" : redact(v);
    }
    return out;
  }
  return value;
}

function emit(
  level: "debug" | "info" | "warn" | "error",
  event: string,
  payload?: unknown,
): void {
  const requestId = requestContext.getStore()?.requestId ?? "(unset)";
  const safe = payload === undefined ? undefined : redact(payload);
  const line = JSON.stringify({
    level,
    event,
    request_id: requestId,
    ts: new Date().toISOString(),
    ...(safe ? { payload: safe } : {}),
  });

  (level === "error"
    ? console.error
    : level === "warn"
      ? console.warn
      : level === "debug"
        ? console.debug
        : console.info)(line);
}

export const logger = {
  debug: (event: string, payload?: unknown) => emit("debug", event, payload),
  info: (event: string, payload?: unknown) => emit("info", event, payload),
  warn: (event: string, payload?: unknown) => emit("warn", event, payload),
  error: (event: string, payload?: unknown) => emit("error", event, payload),
};
