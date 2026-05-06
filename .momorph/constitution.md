<!--
SYNC IMPACT REPORT
==================
Version change: 1.1.0 → 1.1.1
Type: PATCH — TODO(TESTING_INSTALL) retired after the testing toolchain was scaffolded; one
      runtime-environment note added (Node 20+ requirement). No normative rule changes.

Modified principles: N/A (rules unchanged)
Modified sections:
  - Technology Stack & Constraints — Testing line updated from "installation pending" to
    concrete config files and scripts; a Node version requirement note added.

Added principles: N/A
Added sections: N/A
Removed sections: N/A

Templates audited (no changes needed):
  - .momorph/templates/plan-template.md     ✅
  - .momorph/templates/spec-template.md     ✅
  - .momorph/templates/tasks-template.md    ✅

Resolved TODOs:
  - TODO(ORM_CHOICE):       RESOLVED 2026-05-06 — Prisma + PostgreSQL; Auth.js + Prisma adapter.
  - TODO(TESTING_INSTALL):  RESOLVED 2026-05-06 — Vitest 4 + React Testing Library + jsdom +
    @vitejs/plugin-react installed; Playwright 1.59 + chromium installed. Configs at
    `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`. Scripts: `test`,
    `test:watch`, `test:e2e`, `test:e2e:ui`. Smoke tests (`tests/unit/smoke.test.ts`,
    `tests/e2e/smoke.spec.ts`) pass under Vitest. Playwright requires system libs
    (`libnspr4`, `libnss3`, etc.) — run `sudo npx playwright install-deps chromium` once per
    workstation, or use a CI image with the libs preinstalled.

Follow-up TODOs (still deferred):
  - TODO(NATIVE_PLATFORMS): Material Design (Android) and HIG (iOS) sections of Principle III
    activate only if/when a native surface is added.

Environment note:
  - The chosen stack (Next.js 16 + Vitest 4) requires **Node ≥ 20.9** at runtime. The
    repository assumes contributors have Node 20+ on PATH (e.g., via nvm). System Node 18
    will fail both `next` and `vitest`.
-->

# AI Mock Project Constitution

## Core Principles

### I. Clean Code & Readable Structure (NON-NEGOTIABLE)

Code MUST be written so a developer who is new to this stack can read a file and understand both
*what* it does and *why* it exists, without external explanation.

Rules:

- One responsibility per module. Files MUST stay focused; split when a single file mixes
  controller, service, and data-access concerns (see Principle II's layering rules).
- Naming: kebab-case for non-component module filenames (`user-service.ts`); PascalCase for React
  components and classes (`UserCard.tsx`, `AuthService.ts`); camelCase for variables/functions;
  UPPER_SNAKE_CASE for compile-time constants. Names MUST describe purpose, not type
  (`activeUsers`, not `arr1`).
- Functions SHOULD stay small (target ≤ 40 lines, ≤ 4 parameters). Extract a helper before adding
  a fifth parameter or a third level of nesting.
- Default to no comments; rely on names. A comment is justified only when it explains *why*
  (a non-obvious constraint, a workaround, a subtle invariant). Code that needs a "what" comment
  MUST be refactored instead.
- No dead code, no commented-out blocks, no unreachable branches. Delete; rely on git history.
- Formatting MUST be enforced automatically: ESLint passes (`npm run lint`) and Prettier-style
  formatting is consistent. PRs that fail lint MAY NOT merge.
- Imports use the `@/*` path alias (configured in `tsconfig.json`) for cross-feature references;
  relative imports stay within a feature folder.
- Folder layout follows the documented structure (Section "Technology Stack & Constraints" and
  the plan template). New top-level folders require a constitution amendment.

Rationale: This codebase is touched by humans and AI agents alike. Predictable structure and
self-explanatory names compound: the next person — human or model — gets oriented without
guessing, and the cost of every future change drops.

### II. Stack Best Practices (Next.js / React / TypeScript / Tailwind)

Code MUST follow the canonical patterns of the chosen stack. Do not invent project-specific
abstractions when an idiomatic option exists.

Rules — Next.js 16 (App Router):

- Default to **Server Components**. Add `"use client"` only when the file uses state, effects,
  refs, browser APIs, or event handlers.
- API route handlers in `app/**/route.ts` MUST stay thin: parse input, run middleware, delegate
  to a service. Route handlers MUST NOT contain business logic (see `.momorph/guidelines/backend.md`).
- Layered flow: **route → service → repository / utility**. One direction only; no circular
  imports; no barrel files that import many modules.
- Data fetching: prefer Server Components and `fetch` with appropriate Next.js cache hints.
  Client-side fetching is justified only for interactive flows that cannot be statically rendered.
- Use `next/image`, `next/link`, and `next/font` rather than raw `<img>`, `<a>`, or
  `@import`-based fonts.

Rules — React 19:

- Hooks at the top level only; no conditional or looped hook calls.
- Lift state to the lowest common ancestor; avoid prop-drilling beyond two levels — extract a
  context or compose components instead.
- Side effects belong in `useEffect` or server actions, never in render.
- Keys for lists MUST be stable IDs, never array indices for non-static lists.

Rules — TypeScript 5:

- `strict` mode stays on. `any` is forbidden in committed code; use `unknown` + a type guard, or
  define a precise type. Each `any` requires an inline justification comment AND a tracking issue.
- Public functions and exported APIs MUST have explicit parameter and return types.
- Prefer `type`/`interface` definitions in dedicated `*.types.ts` files when reused across
  features; co-locate one-off types with their consumer.
- Validate all external boundary data (HTTP requests, env vars, third-party responses) with a
  schema validator before use.

Rules — Prisma + PostgreSQL (persistence):

- The single source of truth for the database schema is `prisma/schema.prisma`. Schema changes
  MUST flow through `prisma migrate dev` (development) and `prisma migrate deploy` (CI/prod) —
  hand-edited migrations are forbidden except as a documented escape hatch.
- A single `PrismaClient` instance MUST be exported from `src/lib/prisma.ts` (using the
  hot-reload-safe `globalThis` pattern Next.js requires). No file MAY instantiate
  `new PrismaClient()` outside that module.
- Services MUST go through repository modules in `src/repositories/`. Route handlers, React
  Server Components, and Server Actions MUST NOT import `PrismaClient` directly — preserving
  the layered flow (Principle II — Next.js block) and keeping the ORM swappable per Principle
  III's separation of concerns.
- Multi-statement workflows that mutate two or more rows MUST run inside `prisma.$transaction`
  (or an interactive transaction) so partial failures do not leave the DB inconsistent.
- Raw SQL (`$queryRaw` / `$executeRaw`) MUST use parameterized template literals — never string
  concatenation. Use of raw SQL requires a one-line justification comment naming the typed
  query it replaces (Principle IV — A03).
- Auth.js (NextAuth) tables — `User`, `Account`, `Session`, `VerificationToken` — are owned by
  the `@auth/prisma-adapter`. Project-specific user attributes MUST be added either as columns
  on `User` (when always present) or as a related table (when optional / per-feature). The
  schema for these tables MUST follow the Auth.js Prisma adapter contract.
- Seed scripts live in `prisma/seed.ts` and MUST be idempotent.
- `DATABASE_URL` MUST be read through the typed config module (Technology Stack § Configuration);
  no direct `process.env.DATABASE_URL` reads outside that module.

Rules — Tailwind CSS v4:

- Tokens live in CSS variables in `app/globals.css`. Components MUST consume them via Tailwind
  utilities (`bg-primary`, `text-brand-500`, `p-layout-4`) — never raw colors, spacing, radii, or
  typography literals.
- New tokens MUST be added to the global stylesheet AND documented in the relevant
  `.momorph/contexts/group_specs/*_group.md` `sharedResources.cssVariables` entry, with
  rationale. See `.momorph/guidelines/frontend.md`.
- Class composition via clear utility chains; extract a component (not a custom CSS class) when
  the chain is reused three or more times.

Rationale: Following the framework's idioms keeps the surface area small and the project legible
to anyone familiar with the stack. Reinventing patterns increases onboarding cost and bug
surface area without delivering user value.

### III. Platform-Appropriate UI Patterns

UI MUST follow the established conventions of its target platform. The project is web-first
today; native surfaces are out of scope until added by a constitution amendment
(`TODO(NATIVE_PLATFORMS)`).

Rules — Web (current, mandatory):

- Designs MUST be **responsive**. The mobile-first breakpoint progression (`sm`, `md`, `lg`,
  `xl`) is the default; every page MUST be usable at 360 px width.
- Touch targets MUST be ≥ 44 × 44 CSS px on mobile breakpoints; hover-only affordances MUST have
  an equivalent tap/click affordance.
- Accessibility floor: WCAG 2.1 AA. Specifically:
  - Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI components.
  - All interactive elements MUST be keyboard-reachable in logical tab order, with visible focus.
  - Forms MUST associate every input with a label; errors MUST be announced via `aria-live` or
    equivalent.
  - Semantic landmarks (`header`, `nav`, `main`, `footer`) MUST be used; heading order MUST be
    sequential.
- Navigation MUST be evidence-based: every `href`, `router.push`, post-submit redirect, and
  error redirect MUST be sourced from `.momorph/contexts/SCREENFLOW.md` or
  `.momorph/contexts/group_specs/*_group.md`. If a target is referenced but undocumented, stop
  and request documentation rather than guessing. See `.momorph/guidelines/frontend.md` §
  "URL and Navigation Implementation".
- Motion: respect `prefers-reduced-motion` for any non-essential animation.

Rules — Native (forward-looking; activate via amendment):

- **Android** surfaces MUST follow Material Design (current major version): elevation, motion,
  components, and color roles per the official guidelines.
- **iOS** surfaces MUST follow Apple's Human Interface Guidelines: navigation bars, list styles,
  typography ramps, and gesture vocabulary per HIG.
- Do not cross-port a Material pattern into iOS or vice versa; each platform's idioms exist for
  user expectation, not branding parity.

Rationale: Users judge an app against the conventions of the platform they're on. Following
those conventions reduces cognitive friction; ignoring them produces "uncanny valley" UX that
feels off even when individual pixels are correct.

### IV. OWASP Secure Coding (NON-NEGOTIABLE)

Every change MUST consider the OWASP Top 10 and secure-coding practices. Security is part of
"done", not a follow-up phase.

Rules:

- **A01 — Broken Access Control**: Every API route handler that returns or mutates user data
  MUST authenticate AND authorize on the server. Authorization MUST NOT depend on client-supplied
  IDs alone; verify ownership server-side.
- **A02 — Cryptographic Failures**: Secrets MUST never appear in client bundles. Variables
  prefixed `NEXT_PUBLIC_` MUST contain only non-sensitive data; everything else stays
  server-only. Passwords MUST be hashed with a memory-hard algorithm (Argon2id or bcrypt with
  cost ≥ 12). HTTPS-only cookies (`Secure`, `HttpOnly`, `SameSite=Lax` or stricter).
- **A03 — Injection**: User input MUST be parameterized at every boundary. SQL queries go through
  Prisma (parameterized via Prisma Client; raw SQL only with parameterized template literals);
  shell calls go through a library that takes argv arrays
  (no string concatenation); HTML rendering relies on React's default escaping —
  `dangerouslySetInnerHTML` is forbidden without sanitization (DOMPurify or equivalent) and a
  reviewed justification.
- **A04 — Insecure Design**: Threat-model each new feature in `plan.md` (a brief subsection naming
  trust boundaries, sensitive data, and abuse cases). High-risk flows (auth, payments, file
  upload, admin actions) MUST have explicit abuse-case tests.
- **A05 — Security Misconfiguration**: Production responses MUST set the standard security
  headers — `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options:
  nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` (or CSP
  `frame-ancestors`). Default deny for CORS; allowlist explicitly.
- **A06 — Vulnerable & Outdated Components**: `npm audit` (or equivalent) MUST run in CI;
  high-severity advisories MUST be resolved or accepted-with-justification within one sprint.
  Dependencies MUST be pinned by `package-lock.json`.
- **A07 — Identification & Authentication Failures**: Login flows MUST rate-limit, lock out
  after a configurable number of failures, and enforce a password policy aligned with NIST 800-63
  (length over complexity; check against breach lists for high-value accounts). Session tokens
  MUST be opaque, server-validated, and rotated on privilege change.
- **A08 — Software & Data Integrity Failures**: CI MUST verify install integrity
  (`npm ci` with lockfile). Untrusted deserialization is forbidden; if required, isolate behind a
  schema validator.
- **A09 — Security Logging & Monitoring Failures**: Auth events, authorization denials, admin
  actions, and 5xx responses MUST be logged with a request ID and user ID. Logs MUST NOT contain
  passwords, tokens, full PAN, or other secrets.
- **A10 — Server-Side Request Forgery (SSRF)**: Server-side `fetch` to user-supplied URLs MUST
  validate against an allowlist; raw user URLs MUST NOT be passed to internal services.
- **Input validation**: All external input (request bodies, query params, headers, cookies, env
  vars, third-party responses) MUST be validated with a typed schema before use.
- **Error handling**: Errors returned to clients MUST be generic; stack traces and internal
  identifiers stay server-side.
- **Secrets management**: `.env*` files MUST NOT be committed. Production secrets MUST come from
  the platform's secret manager.

Rationale: Security regressions in Next.js apps are usually leaked secrets, missing
authorization checks, or unsafe HTML rendering. Codifying the OWASP categories as a default
checklist forces the team to consider them at design time, when fixes are cheap.

### V. Test-Driven Development (NON-NEGOTIABLE)

Tests MUST be written, reviewed, and failing before the production code that satisfies them.
Red → Green → Refactor is the only sanctioned implementation rhythm.

Rules:

- For every functional requirement (`FR-*`) declared in `spec.md`, an integration or unit test
  MUST exist and FAIL before the corresponding implementation is committed.
- Unit and integration tests run via **Vitest**; end-to-end tests run via **Playwright**, per
  `.momorph/guidelines/e2e/`. (Installation pending — see `TODO(TESTING_INSTALL)`.)
- Tests for high-risk flows (auth, payments, authorization, file upload) MUST include explicit
  abuse-case scenarios (Principle IV linkage).
- Pull requests MUST NOT merge with `.only`, `.skip`, `xit`, or `xdescribe` annotations on new
  tests, nor with disabled CI test jobs.
- Coverage targets defined in each `plan.md` for its user stories MUST be met; gaps require an
  explicit waiver in the plan's "Violations" table.

Rationale: TDD keeps specifications honest, catches regressions before they ship, and is the
only discipline strong enough to keep the spec → plan → tasks → implement pipeline coherent
when work is parallelized between humans and agents.

## Technology Stack & Constraints

The project is built on a fixed core stack. Changes require a constitution amendment.

- **Framework**: Next.js 16.2.4 with the App Router (`app/` directory).
- **Language**: TypeScript 5 in `strict` mode; build verified via `tsc --noEmit`. The path alias
  `@/*` (configured in `tsconfig.json`) is the canonical import root.
- **UI**: React 19 + Tailwind CSS v4 (PostCSS plugin pipeline). Tokens defined as CSS variables
  in `app/globals.css` and consumed via Tailwind utilities.
- **Linting**: ESLint 9 with `eslint-config-next` (core-web-vitals + typescript). PRs MUST pass
  `npm run lint` and `tsc --noEmit`.
- **Testing**: **Vitest 4** (unit/integration) with `jsdom`, React Testing Library, and
  `@testing-library/jest-dom`; configs at `vitest.config.ts` + `vitest.setup.ts`. **Playwright
  1.59** (E2E) configured at `playwright.config.ts` with the Next.js dev server wired in via
  `webServer`. Test scripts: `npm run test` / `test:watch` / `test:e2e` / `test:e2e:ui`. The
  E2E browser is chromium-only by default; expand to firefox/webkit via `playwright.config.ts`
  when needed. See `.momorph/guidelines/e2e/` for the full E2E methodology. **Linux note**:
  Playwright requires system libraries (`libnspr4`, `libnss3`, …); run
  `sudo npx playwright install-deps chromium` once per workstation, or use a CI image with
  them preinstalled.
- **Runtime — Node**: contributors MUST run Node ≥ 20.9 (Next.js 16's floor; Vitest 4 requires
  ≥ 20.19). Use `nvm use` or equivalent — system Node 18 will fail both `next dev` and
  `vitest run`.
- **Persistence**: **PostgreSQL 15+ via Prisma ORM**. Schema lives at `prisma/schema.prisma`;
  the singleton client lives at `src/lib/prisma.ts`. Repository modules in `src/repositories/`
  are the only allowed callers of `PrismaClient`. The canonical guideline is
  `.momorph/guidelines/db_guidelines/PrismaORM_guideline.md`.
- **Authentication & sessions**: **Auth.js (NextAuth) with `@auth/prisma-adapter`**. The
  adapter owns the `User`, `Account`, `Session`, and `VerificationToken` tables. Application
  code MUST consume sessions through the Auth.js helpers (`auth()`, `getServerSession`-style
  APIs), never by reading the session cookie directly. Project-specific user fields are added
  on `User` (always present) or as related tables (optional / per-feature).
- **Folder layout** (canonical):
  - `app/` — routes, layouts, route handlers, server components.
  - `app/api/<resource>/route.ts` — thin route handlers (Principle II).
  - `src/services/` — business logic services.
  - `src/repositories/` — data-access boundary.
  - `src/components/` — shared React components (PascalCase folders/files).
  - `src/hooks/` — reusable hooks (`useXyz.ts`).
  - `src/lib/` — framework-agnostic utilities.
  - `src/types/` — shared types.
  - `tests/unit/`, `tests/integration/`, `tests/e2e/` — by test scope.
  - `public/assets/{group_name}/{icons|images|logos}/` — static assets, kebab-case filenames.
- **Configuration**: All runtime configuration MUST flow through a single typed config module
  that fails fast on missing required vars. No direct `process.env` reads outside that module.

## Development Workflow & Quality Gates

The MoMorph workflow defines the path from design to merge:

1. **Specify** — `momorph.specs` / `momorph.specify` produces `spec.md` from Figma frames.
2. **Plan** — `momorph.plan` produces `plan.md`. The **Constitution Compliance Check** MUST pass;
   any violation requires a justified entry in the Violations table.
3. **Tasks** — `momorph.tasks` decomposes the plan into ordered tasks. Tests precede
   implementation within each user story (Principle V).
4. **Implement** — `momorph.implement` follows the task list. Tasks are committed individually
   or in small logical groups.
5. **Test** — `momorph.createtestcases` / `momorph.writee2e` produce automated coverage. Failing
   tests MUST be fixed; muting tests is a waiver event requiring a plan amendment.
6. **Review** — `momorph.reviewe2e` plus standard PR review MUST verify constitution compliance
   before merge.
7. **Commit** — `momorph.commit` produces conventional-commit-formatted messages.

Quality gates that block merge:

- `npm run lint` clean (Principle I).
- `tsc --noEmit` clean (Principle II — no `any` regressions).
- All new and affected tests green; no `.only` / `.skip` (Principle V).
- Constitution Compliance Check checked off in `plan.md` for every active principle.
- No raw color/spacing/typography literals introduced (Principle II — Tailwind tokens).
- No navigation targets without documented sources (Principle III).
- No business logic in route handlers; layered flow preserved (Principles I–II).
- Security checklist (Principle IV) reviewed in PR description for any auth, data-access, or
  third-party integration change.

## Governance

This constitution supersedes ad-hoc practices and prior conventions when they conflict. All
MoMorph agents and human contributors MUST consult it before drafting plans, generating tasks,
or implementing features.

**Amendment procedure**:

1. Open a pull request modifying `.momorph/constitution.md`.
2. Update the Sync Impact Report (HTML comment at the top of this file) describing the diff,
   version bump rationale, and template propagation status.
3. Update any dependent template/guideline file in the same PR (`.momorph/templates/*`,
   `.momorph/guidelines/*`).
4. Require approval from at least one project maintainer before merge.

**Versioning policy** (semantic):

- **MAJOR** — Backward-incompatible removals or redefinitions of principles or governance rules.
- **MINOR** — New principle or section added, or a materially expanded rule.
- **PATCH** — Clarifications, wording, or non-semantic refinements.

**Compliance review**:

- Every PR description MUST state which principles are touched and confirm compliance.
- Quarterly (or at each major release), maintainers MUST audit the templates and guidelines for
  drift against this constitution and open follow-up issues for any divergence.

**Runtime guidance**: For day-to-day implementation rules, agents MUST consult
`.momorph/guidelines/frontend.md`, `.momorph/guidelines/backend.md`, the
`.momorph/guidelines/e2e/` series, and the Prisma persistence guideline at
`.momorph/guidelines/db_guidelines/PrismaORM_guideline.md`. The constitution defines the
*what* and *why*; the
guidelines define the *how*.

**Version**: 1.1.1 | **Ratified**: 2026-05-06 | **Last Amended**: 2026-05-06
