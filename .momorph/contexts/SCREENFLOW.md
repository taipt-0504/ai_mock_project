# SAA 2025 — Screen Flow

**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Last updated**: 2026-05-08
**Status**: Partial — Login + Dropdown — Language + Homepage SAA + Dropdown — Profile (user)
+ Countdown - Prelaunch page surveyed in depth. Other entries are inferred from cross-references
and MUST be re-confirmed when each owning screen is surveyed with `/momorph.screenflow`. The
authoritative screen-flow document is `.momorph/SCREENFLOW.md`; this file is the lightweight
index.

---

## Conventions

- **Routes vs overlays**: Routes have a URL and a screenId. Overlays (dropdowns, modals,
  toasts) are rendered on top of a route and do not own a URL.
- **Navigation Graph rule** (Constitution Principle III — Evidence-Based Navigation): every
  `href`, `router.push`, post-submit redirect, and error redirect in the codebase MUST be
  sourced from the **Navigation Graph** below. If a target appears in design but is missing
  from this graph, stop and update this file before writing code.
- **Edge confidence**:
  - `(confirmed)` — observed directly on the source screen during the screenflow survey.
  - `(inferred)` — derived from a sibling screen's design or from product convention; MUST be
    re-validated when the source screen is surveyed.

---

## Screen Index

| screenId | Name | Route (proposed) | Surveyed | Notes |
|----------|------|------------------|----------|-------|
| `GzbNeVGJHz` | Login | `/login` | ✅ 2026-05-06 | Project entry route. Google-OAuth-only auth. |
| `i87tDx10uM` | Homepage SAA | `/` (or `/home`) | ⚠ pending | Post-auth landing; referenced as destination by Login. |
| `hUyaaugye2` | Dropdown — Language | (overlay on Login + others) | ⚠ pending | Overlay component, no route. |
| `z4sCl3_Qtk` | Dropdown — Profile (user) | (overlay on authenticated routes) | ⚠ pending | Contains "Logout" → Login (inferred). |
| `54rekaCHG1` | Dropdown — Profile (admin) | (overlay on admin routes) | ⚠ pending | Contains "Logout" → Login (inferred). |
| `T3e_iS9PCL` | Error page — 403 | `/403` (proposed) | ⚠ pending | "Back" → Login (inferred on auth failure). |
| `8HGlvYGJWq` | [iOS] Login | (mobile variant) | ⚠ pending | Decide responsive single-route vs. separate route. |
| `8PJQswPZmU` | Countdown - Prelaunch page | `/` (pre-event variant) or `/coming-soon` — TBD | ✅ 2026-05-08 | Standalone full-bleed countdown (no header/footer/nav). Reuses shipped `Countdown` + SAA root-art BG. No outgoing edges; logical handoff to Homepage SAA when countdown elapses. See `.momorph/SCREENFLOW.md` "Screen Details — Countdown - Prelaunch page". Open: Q-CP1 routing, Q-CP2 auth gating, Q-CP3 granularity, Q-CP4 i18n. |

---

## Navigation Graph

### Login Screen (`GzbNeVGJHz`, route `/login`)

**Outgoing edges** (sourced from this screen's design + test cases):

```
Login (/login)
  ├─> "LOGIN With Google" button (B.3 / 662:14425)
  │     ├─> External: Google OAuth consent (provider redirect)
  │     └─> On success: Homepage SAA (i87tDx10uM)        (confirmed)
  │
  └─> Language selector "VN ▼" (A.2 / I662:14391;186:1601)
        └─> Opens overlay: Dropdown — Language (hUyaaugye2)   (confirmed)
              (selecting a language updates locale in place; does NOT navigate)
```

**Incoming edges** (Login is the project's entry route):

```
  App entry (unauthenticated, any protected route hit)  →  Login        (confirmed)
  Sign-out from authenticated pages                     →  Login        (confirmed by FR-014)
  Dropdown — Profile user (z4sCl3_Qtk) → "Logout"       →  Login        (inferred)
  Dropdown — Profile admin (54rekaCHG1) → "Logout"      →  Login        (inferred)
  Error page — 403 (T3e_iS9PCL) → "Back"                →  Login        (inferred)
```

**Logic-triggered navigation** (FR-002 / US2):

```
  Authenticated visitor lands on Login (/login)         →  Homepage SAA (i87tDx10uM)
        [server-side redirect; do NOT render Login markup first]
```

---

## Open Items

- ⚠ Survey **Homepage SAA** (`i87tDx10uM`) to populate its outgoing edges (admin/user role
  branches, profile dropdown, etc.).
- ⚠ Survey **Dropdown — Language** (`hUyaaugye2`) to enumerate the available languages and
  confirm the persistence mechanism (cookie vs. user attribute).
- ⚠ Survey both **Profile dropdowns** (`z4sCl3_Qtk`, `54rekaCHG1`) to confirm "Logout" → Login
  edges and any other actions (Account settings, Switch role, etc.).
- ⚠ Survey **Error 403** (`T3e_iS9PCL`) to confirm the "Back" target.
- ⚠ Decide whether the mobile variant `[iOS] Login` (`8HGlvYGJWq`) is a separate route or a
  responsive breakpoint of `/login`. Default: responsive single route — escalate only if the
  iOS variant introduces interactions absent from the web frame.
- ⚠ Resolve **Q-CP1..Q-CP4** for **Countdown - Prelaunch page** (`8PJQswPZmU`) before queuing
  it for `/momorph.specify`: routing strategy (inline `/` variant vs. dedicated `/coming-soon`
  path), anonymous-vs-authenticated gating, minute-vs-second granularity, and i18n behavior of
  the `DAYS` / `HOURS` / `MINUTES` Latin labels.
