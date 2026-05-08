/**
 * Decision returned by the prelaunch gate (Prelaunch spec FR-006).
 *
 * `passthrough` — let the request continue to the existing proxy pipeline
 *                 (security headers + rate limit) and on to its route handler.
 * `redirect`    — short-circuit with a 307 to either the prelaunch route
 *                 (gate active) or `/` (gate lifted, prelaunch path itself).
 */
export type GateDecision =
  | { type: "passthrough" }
  | { type: "redirect"; target: "/coming-soon" | "/" };
