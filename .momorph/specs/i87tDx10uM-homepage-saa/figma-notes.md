# Figma scratch notes — Homepage SAA (i87tDx10uM)

Lightweight reference captured during Phase 1 to bootstrap implementation. Each
implementation phase will still re-query its own section via `query_section`
for full CSS — this file only captures the structural map and the small set of
values reused across phases.

## Top-level structure (from `get_overview`)

Root frame `2167:9026` Homepage SAA — 1512 wide.

```
2167:9026 Homepage SAA (FRAME)
├── 2167:9027 mms_3.5_Keyvisual (GROUP)            — hero key visual layer (1512×1392 BG)
├── 2167:9029 Cover (RECTANGLE)                     — overlay tint above keyvisual
├── 2167:9091 mms_A1_Header (INSTANCE)              — full Header instance
├── 2167:9030 Bìa (FRAME)                           — main content stack
│   ├── 2167:9031 Frame 487                         — Hero block: ROOT FURTHER + Coming soon + countdown + event-info
│   │   ├── 2167:9032 Frame 482 (root-further-logo) — 1224×200, ROOT FURTHER artwork (451×200)
│   │   ├── 2167:9034 Frame 523                     — countdown + event-info
│   │   └── 2167:9062 mms_B3_Call-To-Action         — CTAButtons (B3.1 About / B3.2 Kudos)
│   ├── 3204:10152 Frame 486                        — Root Further essay area (Group 434 + B4 content)
│   ├── 5022:15169 mms_6_Widget Button (INSTANCE)   — FAB
│   ├── 2167:9068 Hệ thống giải thưởng              — Awards: C1 header + C2 list
│   └── 3390:10349 mms_D1_Sunkudos (INSTANCE)       — Kudos block (1120×500)
└── 5001:14800 mms_7_Footer (INSTANCE)              — Footer with Logo + 4 links + copyright
```

## Header (`2167:9091`) — captured in T001

- Outer: `width 1512`, `height 80`, `padding 12px 144px`, bg `rgba(16,20,23,0.8)`
  (close to existing `--color-saa-header-overlay: rgba(11, 15, 18, 0.8)` —
  reuse).
- Left cluster `Frame 488`: gap `64px`, items: Logo (52×48), Frame 476 (nav).
- Nav `Frame 476`: gap `24px`, three links, each padding `16px`, font
  Montserrat 14/700, line-height 20, letter-spacing 0.1px.
  - Active state: color `#FFEA9E` (existing `--color-saa-button-primary`),
    `border-bottom: 1px solid #FFEA9E`, text-shadow
    `0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287`.
  - Hover/normal: color white, no border, no shadow.
- Active link in Figma is "About SAA 2025" → maps to `currentPath="/"`.
- Right cluster `Frame 482`: gap `16px`, items in this order: Notification
  (40×40), Language (108×56), Profile (40×40).
- Notification: 40×40 button + dot badge 8×8 at top-right, dot color `#D4271D`.
- Language chip: 108×56 (existing component, no change).
- Profile button: 40×40, border `1px solid #998C5F` (existing
  `--color-saa-dropdown-border`), padding 10.

## New tokens to add (T004)

Additions live in `app/globals.css` under `:root` AND `@theme inline`:

| Token                            | Value                            | Used by                                |
| -------------------------------- | -------------------------------- | -------------------------------------- |
| `--color-saa-active-link`        | `#FFEA9E` (alias for primary)    | NavLinks active text + underline       |
| `--color-saa-card-surface`       | `#001320`                        | AwardCard background                   |
| `--color-saa-card-border`        | `#2E3940` (alias for divider)    | AwardCard border                       |
| `--color-saa-essay-fg`           | `#FFFFFF`                        | Root Further essay body                |
| `--color-saa-essay-quote-fg`     | `#FFEA9E`                        | Root Further pull-quote                |
| `--color-saa-fab-bg`             | `#FFEA9E`                        | FAB pill background                    |
| `--color-saa-fab-fg`             | `#00101A`                        | FAB pill foreground                    |
| `--color-saa-footer-bg`          | `#00070C` (alias for dropdown)   | Footer surface                         |
| `--color-saa-footer-fg`          | `#FFFFFF`                        | Footer foreground                      |
| `--color-saa-notification-dot`   | `#D4271D`                        | Notification badge dot                 |

Most are aliases of existing values; a few are new (card surface, fab bg/fg,
notification dot). Implementation phases will re-query their target section
to confirm any extra values not listed here.

## Asset map (T002 + T003)

Downloaded into `public/assets/home/`:

```
images/
  key-visual.png            1512×1392  — hero background
  root-further-logo.png      451×200   — composite ROOT FURTHER artwork (B1)
  root-text.png              189×67    — separate ROOT word (essay opener)
  further-text.png           290×67    — separate FURTHER word (essay opener)
  award-bg.png               336×336   — shared award card background
  award-top-talent.png       222×36    — text-label overlay
  award-top-project.png      232×35    — text-label overlay
  award-top-project-leader.png 232×64  — text-label overlay
  award-best-manager.png     232×30    — text-label overlay
  award-signature-2025-creator.png 232×54 — text-label overlay
  award-mvp.png              116×52    — text-label overlay
  kudos-background.png       1120×500  — Kudos block background
  kudos-logo.svg             vector    — Kudos brand mark
logos/
  footer-logo.png            69×64     — footer logo (wider variant)
icons/
  bell.svg                   24×24     — authored fallback (notification)
  user.svg                   24×24     — authored fallback (profile)
  arrow-up-right.svg         24×24     — authored fallback (CTA / award detail / kudos detail)
  pen.svg                    24×24     — authored fallback (FAB write Kudos)
  kudos-logo-small.svg       20×18     — FAB second icon (downloaded SVG)
```

CRITICAL: Award labels are **text-label overlays** (≤232 wide × ≤64 tall),
NOT full-card images. They render stacked above `award-bg.png` (336×336).
Per Step 2.3 of `momorph.implement-ui`: implement as separate stacked
elements, never as a single Image with the label as src.
