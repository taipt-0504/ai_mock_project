# Auth-Gate Pattern for Sun* Kudos Route Handlers

**Scope**: every mutate route handler shipped under Phase 4 (`POST /api/kudos`),
Phase 6 (`POST/DELETE /api/kudos/{id}/likes`), Phase 8 (`POST /api/secret-boxes/open`),
and any future mutate endpoint touching Kudos domain data.

**Owner**: Phase 3 (US7 — authentication). Locked 2026-05-13.

**Linked**:

- [spec.md](../spec.md) — User Story 7 (Acceptance Scenarios 1–3) + Edge Cases
  ("Network failure khi mutate", "Like spam click").
- [plan.md](../plan.md) — Q-PLAN1 (rate-limit), Q-PLAN2 (admin endpoint deferred).
- Constitution Principle IV — A01 (Broken Access Control), A09 (Security Logging).

---

## Why this pattern exists

Live Board is an internal screen. Every action that reads or mutates Kudos data
MUST authenticate AND authorize on the server (Constitution IV — A01). Client-side
checks are advisory only; the server is the single source of truth.

The page-level gate in [app/sun-kudos/page.tsx](../../../../app/sun-kudos/page.tsx)
handles the *first* request — anon user lands on `/login` before any board markup
is sent. Once the user is on the board, every subsequent action goes through a
route handler in `app/api/kudos*/route.ts`. **Each of those handlers MUST enforce
the same gate independently** — a logged-out tab still owns the page DOM, and the
session can expire between the initial render and the next click (US7 #3).

Skipping the gate at the route layer would mean:

- A stale tab could mutate data after session expiry.
- A crafted `fetch()` from a different origin (no CSRF) could write rows the user
  is not authorized to write (A01).
- Audit logs (A09) would miss the "unauthorized attempt" signal.

---

## Canonical template

Every mutate route handler MUST start with the following gate, in this exact order:

```ts
// app/api/kudos/route.ts (example for Phase 4 T034)
import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";

export async function POST(request: Request): Promise<Response> {
  let session: Awaited<ReturnType<typeof auth>> = null;
  try {
    session = await auth();
  } catch (err) {
    // Treat Auth.js exceptions as "no session" — never leak the cause to the
    // client. Log server-side so an operator can see auth outages.
    logger.warn("auth.lookup-failed", {
      route: new URL(request.url).pathname,
      message: err instanceof Error ? err.message : "unknown",
    });
    session = null;
  }

  if (!session?.user) {
    logger.info("auth.denied", { route: new URL(request.url).pathname });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── from here on, `session.user` is non-null and trusted ───────────────────
  // 1. Parse + Zod-validate body / params.
  // 2. Delegate to service (e.g. kudosService.create(input, session)).
  // 3. Service uses `session.user.id` for ownership checks — never trust an
  //    `authorId` field from the request body.
  // 4. Return 201 / 200 with a generic shape; do NOT echo stack traces.

  return NextResponse.json({ ok: true }, { status: 201 });
}
```

---

## Rules — what the gate MUST do

1. **Call `auth()` first.** Before reading the body, before any DB call, before
   any rate-limit decision. If `auth()` throws, swallow it inside a `try/catch`
   and treat the request as anonymous.
2. **Return `401 Unauthorized` with a generic body** (`{ error: "Unauthorized" }`)
   when there is no `session.user`. Do not include the reason (expired vs missing
   vs invalid) — that is internal state (Constitution IV — error handling).
3. **Log the denial.** Use `logger.info("auth.denied", { route })` for unauthenticated
   denials and `logger.warn("auth.lookup-failed", …)` when `auth()` itself throws.
   No PII, no tokens, no cookies in the log payload (A09).
4. **Authorize using `session.user.id`, never the client-supplied id.** Ownership
   checks (e.g. "is this Kudo owned by the current user?") MUST resolve via the
   server-side session, even if the client sends an `authorId` in the body. Repo
   methods that mutate user-owned rows accept the session-derived id as a
   parameter (see `kudos-service.create(input, session)` contract in plan.md).
5. **Reject 403 (not 401) for the wrong role.** A logged-in non-admin hitting
   `POST /api/admin/special-days` MUST receive 403 with the same generic body.
   401 means "you have no session"; 403 means "you have a session but cannot do
   this." (US7 #2.) The admin endpoint is out of scope per Q-PLAN2 — this rule
   stays here so any future admin route is consistent.
6. **Apply rate-limit AFTER the auth gate.** Anonymous requests get short-circuited
   to 401 before they can consume the token bucket on `/api/kudos*` (Q-PLAN1).
   This keeps an unauthenticated flood from exhausting a real user's quota.

---

## What the client MUST do when it sees 401

The client mutate flows (Phase 4 `KudosCreateDialog`, Phase 6 `HeartButton`, Phase 8
`SecretBoxOpenButton`) MUST:

1. **Detect** `response.status === 401` from any `fetch` to `/api/kudos*` or
   `/api/secret-boxes*`.
2. **Rollback any optimistic UI state** (heart count, secret-box pending count,
   feed prepend) — the action did not happen.
3. **Show a generic toast** ("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
   without leaking the API path or HTTP body.
4. **Redirect** via `router.push("/login?next=" + encodeURIComponent(currentPath))`
   so the user returns to the same view after re-auth. The page-level gate at
   `/sun-kudos` will pick the session up again on the next server render.

The client MUST NOT retry a 401 silently. Silent retry after expiry is the failure
mode US7 #3 is designed to surface.

---

## Test coverage already in place

- `tests/e2e/kudos-board-auth.spec.ts` (T026) — page-level gate: anon → `/login`,
  authed → renders board, stale session cookie → `/login`.
- `tests/unit/app/sun-kudos/page.test.tsx` (Phase 2 T022) — unit-level proof that
  null session and a thrown `auth()` both redirect.

Phase 4/6/8 owners — when you add the first mutate endpoint, add a sibling spec
(e.g. `tests/e2e/kudos-board-create.spec.ts` — T030) with an explicit
"anon POST → 401" assertion AND an "authed expired cookie POST → 401" assertion.
That keeps the route-handler gate exercised by CI on every change.

---

## Anti-patterns — do NOT ship a handler that

- Reads the request body **before** calling `auth()` (lets a 401-bound payload
  burn parse cycles + Zod error budget; also makes log-after-deny noisy).
- Returns the auth error message verbatim ("`JWTExpired`", "`InvalidSignature`")
  — clients only ever need to know "401" and "redirect to /login".
- Uses `getServerSession`-style direct cookie reads. Always go through the
  `auth()` helper exported from `src/lib/auth.ts`.
- Trusts an `authorId` / `senderUserId` from the request body for ownership
  checks. Always use `session.user.id`.
- Skips logging on denial. Without that signal, A09 monitoring is blind to
  brute-force or credential-stuffing patterns.
