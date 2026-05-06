import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger, requestContext } from "@/src/lib/logger";

describe("logger", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  function lastJson(spy: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
    const args = spy.mock.calls.at(-1);
    if (!args) throw new Error("logger emitted no output");
    return JSON.parse(args[0] as string);
  }

  it("emits a JSON line with level, event, ts, and request_id", () => {
    logger.info("test.event", { hello: "world" });
    const out = lastJson(infoSpy);
    expect(out.level).toBe("info");
    expect(out.event).toBe("test.event");
    expect(out.request_id).toBe("(unset)");
    expect(out.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(out.payload).toEqual({ hello: "world" });
  });

  it("propagates request_id through AsyncLocalStorage", () => {
    requestContext.run({ requestId: "req-abc-123" }, () => {
      logger.info("test.with-context");
    });
    expect(lastJson(infoSpy).request_id).toBe("req-abc-123");
  });

  describe("redaction (Principle IV — A09)", () => {
    it("redacts blocklisted property keys", () => {
      logger.info("test.tokens", {
        userId: "u1",
        access_token: "ya29.real-secret-token",
        refresh_token: "1//refresh",
        id_token: "header.payload.signature",
        code: "auth-code",
        state: "csrf-state",
        password: "shouldnt-be-here",
        client_secret: "GOCSPX-xyz",
      });
      const payload = lastJson(infoSpy).payload as Record<string, unknown>;
      expect(payload.userId).toBe("u1");
      expect(payload.access_token).toBe("[REDACTED]");
      expect(payload.refresh_token).toBe("[REDACTED]");
      expect(payload.id_token).toBe("[REDACTED]");
      expect(payload.code).toBe("[REDACTED]");
      expect(payload.state).toBe("[REDACTED]");
      expect(payload.password).toBe("[REDACTED]");
      expect(payload.client_secret).toBe("[REDACTED]");
    });

    it("redacts Google access tokens by shape (ya29.*)", () => {
      logger.info("test.shape", { token: "ya29.something-leaked" });
      const payload = lastJson(infoSpy).payload as Record<string, unknown>;
      expect(payload.token).toBe("[REDACTED]");
    });

    it("redacts JWT-shaped strings", () => {
      logger.info("test.jwt", { token: "eyJhbGciOi.eyJzdWIi.zzz" });
      const payload = lastJson(infoSpy).payload as Record<string, unknown>;
      expect(payload.token).toBe("[REDACTED]");
    });

    it("recurses into arrays + nested objects", () => {
      logger.info("test.nested", {
        events: [
          { id_token: "header.payload.sig" },
          { ok: true },
        ],
      });
      const payload = lastJson(infoSpy).payload as {
        events: Array<Record<string, unknown>>;
      };
      expect(payload.events[0].id_token).toBe("[REDACTED]");
      expect(payload.events[1].ok).toBe(true);
    });

    it("leaves benign strings untouched", () => {
      logger.info("test.benign", { msg: "hello world", n: 42 });
      const payload = lastJson(infoSpy).payload as Record<string, unknown>;
      expect(payload.msg).toBe("hello world");
      expect(payload.n).toBe(42);
    });
  });
});
