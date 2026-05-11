import { describe, expect, it } from "vitest";

import ModalDefault from "@/app/sun-kudos/@modal/default";

/**
 * Phase 2 T021. The `@modal` parallel slot needs a `default.tsx` that returns
 * `null` so direct visits to `/sun-kudos` (no intercepting route active) leave
 * the slot empty. Without this, Next.js falls back to its 404 in the slot
 * region. Source: Next.js docs on Parallel Routes — "Default" behavior.
 */
describe("app/sun-kudos/@modal/default — parallel slot empty state", () => {
  it("returns null so direct visits leave the modal slot inert", () => {
    expect(ModalDefault()).toBeNull();
  });
});
