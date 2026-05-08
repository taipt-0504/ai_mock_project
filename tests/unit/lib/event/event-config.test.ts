import { describe, expect, it } from "vitest";

import { parseEventStart, parseLaunchAt } from "@/src/lib/event/event-config";

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

describe("parseLaunchAt (Prelaunch FR-009 — always fail closed when null)", () => {
  it("returns a Date for a valid ISO-8601 timestamp with timezone", () => {
    const result = parseLaunchAt("2026-06-01T09:00:00+07:00");
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe("2026-06-01T02:00:00.000Z");
  });

  it("returns null when the env value is undefined (proxy treats null as gate-active)", () => {
    expect(parseLaunchAt(undefined)).toBeNull();
  });

  it("returns null when the env value is an empty string", () => {
    expect(parseLaunchAt("")).toBeNull();
  });

  it("returns null for malformed strings (the gate stays closed)", () => {
    expect(parseLaunchAt("not-a-date")).toBeNull();
    expect(parseLaunchAt("2025-13-99")).toBeNull();
    expect(parseLaunchAt("2025-13-40T99:99:99")).toBeNull();
  });

  it("returns a Date for a future timestamp (gate active until that moment)", () => {
    const future = "2099-01-01T00:00:00Z";
    const result = parseLaunchAt(future);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getTime()).toBeGreaterThan(Date.now());
  });

  it("returns a Date for a past timestamp (gate is lifted)", () => {
    const past = "2000-01-01T00:00:00Z";
    const result = parseLaunchAt(past);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getTime()).toBeLessThan(Date.now());
  });

  it("accepts the year-only short form (which `new Date('2025')` resolves to 2025-01-01T00:00:00Z) — operators are warned in .env.example", () => {
    const result = parseLaunchAt("2025");
    expect(result).toBeInstanceOf(Date);
    expect(result!.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });
});
