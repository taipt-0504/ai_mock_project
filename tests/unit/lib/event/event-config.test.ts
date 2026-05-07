import { describe, expect, it } from "vitest";

import { parseEventStart } from "@/src/lib/event/event-config";

describe("parseEventStart", () => {
  it("returns a Date for a valid ISO-8601 timestamp with timezone", () => {
    const result = parseEventStart("2025-12-31T18:30:00+07:00");
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe("2025-12-31T11:30:00.000Z");
  });

  it("returns null when the env value is undefined (env var unset)", () => {
    expect(parseEventStart(undefined)).toBeNull();
  });

  it("returns null when the env value is an empty string", () => {
    expect(parseEventStart("")).toBeNull();
  });

  it("returns null for a malformed / non-parseable string", () => {
    expect(parseEventStart("not-a-date")).toBeNull();
    expect(parseEventStart("2025-13-40T99:99:99")).toBeNull();
  });

  it("returns a Date for a future timestamp (countdown still ticking)", () => {
    const future = "2099-01-01T00:00:00Z";
    const result = parseEventStart(future);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getTime()).toBeGreaterThan(Date.now());
  });

  it("returns a Date for a past timestamp (callers handle the zero-state)", () => {
    const past = "2000-01-01T00:00:00Z";
    const result = parseEventStart(past);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getTime()).toBeLessThan(Date.now());
  });
});
