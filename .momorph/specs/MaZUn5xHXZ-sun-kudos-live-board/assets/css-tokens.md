# CSS Tokens — Sun* Kudos Live Board

**Source**: Figma frame `MaZUn5xHXZ` (revision `904fca587cc5bbddf4075c207e680277`)
**Extracted**: 2026-05-11 via `mcp__momorph__query_section`
**Used by**: Phase 2+ implementation phases

---

## Figma Design Variables (verbatim from styles)

These are the variable names Figma uses internally. Map → project Tailwind tokens (see Project Token Mapping below).

| Figma Variable | Hex / RGBA | Usage |
|---|---|---|
| `--Details-Background` | `#00101A` | Page bg, gradient overlay |
| `--Details-Container-2` | `#00070C` | Sidebar block bg (D.1, D.3) |
| `--Details-Border` | `#998C5F` | Filter btn border, sidebar block border, A.1 border |
| `--Details-Divider` | `#2E3940` | Section dividers, footer top border |
| `--Details-Text-Primary-1` | `#FFEA9E` | Highlight gold (card border, big numbers, section header text) |
| `--Details-Text-Secondary-1` | `#FFFFFF` | Avatar border |
| `--Details-PrimaryButton-Hover` | `#FFF8E1` | Highlight card bg |
| `--Details-ButtonSecondary-Hover` | `rgba(255, 234, 158, 0.40)` | Card content area inner bg |
| `--Details-SecondaryButton-Normal` | `rgba(255, 234, 158, 0.10)` | Filter btn / A.1 input bg |

## Inline literal colors (no variable assigned)

| Hex / RGBA | Usage | Node example |
|---|---|---|
| `rgba(0, 16, 26, 1)` (`#00101A`) | Default dark text fg | hashtag text on hover bg, heart count "1.000" |
| `rgba(255, 248, 225, 1)` (`#FFF8E1`) | Feed card C.3 bg | C.3_KUDO Post outer bg |
| `rgba(255, 234, 158, 1)` (`#FFEA9E`) | Solid gold | section H1 "HIGHLIGHT KUDOS", stat numbers, Mở quà btn bg |
| `rgba(46, 57, 64, 1)` (`#2E3940`) | Sidebar/section divider | D.1.5 divider, B.1/B.6/C.1 horizontal rule |
| `rgba(153, 153, 153, 1)` (`#999999`) | Muted text | timestamps "10:00 - 10/30/2025" |
| `rgba(212, 39, 29, 1)` (`#D4271D`) | Hashtag chip text red | "#Dedicated #Inspring..." |
| `rgba(255, 255, 255, 1)` (`#FFFFFF`) | White text/bg | section sub-heading H2, A.1 placeholder |

---

## Per-Node Findings

### A.1 — Button ghi nhận (input trigger) — node `2940:13449`
- Container: `width: 738px`, `height: 72px`, `padding: 24px 16px`, `gap: 8px`
- Border: `1px solid #998C5F`, `border-radius: 68px`
- Background: `rgba(255, 234, 158, 0.10)` (`--Details-SecondaryButton-Normal`)
- Inner pen icon: `24×24px` (`MM_MEDIA_Pen`)
- Placeholder text: `font: Montserrat 16/24, 700, letter-spacing: 0.15px, fg: #FFFFFF`

### B.1 — Section header + filter row — node `2940:13452`
- Container: width `1440px`, padding `0 144px`, `gap: 40px` column
- H1 "Sun* Annual Awards 2025": Montserrat 24/32 700, white
- Divider: 1px line `#2E3940`
- H2 "HIGHLIGHT KUDOS": Montserrat 57/64 700, color `#FFEA9E`, letter-spacing `-0.25px`
- **B.1.1 Hashtag filter button** (`2940:13459`): padding `16px`, gap `8px`, border `1px solid #998C5F`, border-radius `4px`, bg `rgba(255, 234, 158, 0.10)`
- **B.1.2 Department filter button** (`2940:13460`): identical to B.1.1

### B.2 / B.3 — Highlight card — node `2940:13465`
- Card outer: `width: 528px`, `border: 4px solid #FFEA9E`, `border-radius: 16px`, `padding: 24px 24px 16px 24px`, gap `16px` column
- Card background: `#FFF8E1`
- Sender/receiver row: `gap: 24px` horizontal; avatar `64×64px` ellipse, border `1.869px solid #FFF`
- Send-icon (between sender/receiver): `32×32px`, padding-vertical `16px`
- Divider rows: 1px `#FFEA9E` (top + bottom of content block)
- Time text: Montserrat 16/24 700, fg `#999999`, letter-spacing `0.5px`
- Hashtag chip "IDOL GIỚI TRẺ": Montserrat 16/24 700, color `#00101A`, letter-spacing `0.5px`
- Content frame (B.4.2): border `1px solid #FFEA9E`, padding `16px 24px`, bg `rgba(255, 234, 158, 0.40)`, border-radius `12px`
- Hashtag list: Montserrat 16/24 700, fg `#D4271D`
- Action bar (B.4.4): height `56px`, gap `24px` between Hearts + Buttons cluster
  - Hearts row: gap `4px`, text "1.000" Montserrat 24/32 700 fg `#00101A`, icon `32×32px`
  - Buttons cluster: gap `8px`, each button width `145-163×56px`, padding `16px`, border-radius `4px`

### B.2.3 carousel gradient overlays — node `2940:13469` / `2940:13467`
- Left fade: `400×525px`, padding `186px 161px 186px 80px`, bg `linear-gradient(90deg, #00101A 50%, transparent 100%)`
- Right fade: identical but `linear-gradient(270deg, ...)`

### B.6 — Spotlight section header — node `2940:13476`
- Same H1/divider/H2 pattern as B.1, H2 text "SPOTLIGHT BOARD"

### B.7 — Spotlight container — node `2940:14174`
- Outer: `width: 1157px`, `height: 548px`, `border: 1px solid #998C5F`, `border-radius: 47.14px`
- B.7.2 Pan/Zoom button: `30×30px`
- B.7.3 Search bar: `width: 219px`, `height: 39px`, padding `16.378px 10.919px`, border `0.682px solid #998C5F`, bg `rgba(255, 234, 158, 0.10)`, border-radius `46.404px`, search icon `16×16px`, placeholder Montserrat 10.92/16.38 500 white

### C.3 — Feed card (KUDO Post) — node `3127:21871`
- Outer: `width: 680px`, `padding: 40px 40px 16px 40px`, `gap: 16px` column, `border-radius: 24px`, bg `#FFF8E1`
- Info user row: `width: 600px`, gap `24px`, height `123px`
- Avatars: `64×64px` ellipse, `border: 1.869px solid #FFF`
- Send icon: `32×32px`, padding-vertical `16px`
- Divider: 1px `#FFEA9E`
- Time text: Montserrat 16/24 700, `#999999`
- Hashtag chip "IDOL GIỚI TRẺ" (D.4_hashtag): Montserrat 16/24 700, `#00101A`
- Content frame: `border: 1px solid #FFEA9E`, padding `16px 24px`, bg `rgba(255, 234, 158, 0.40)`, border-radius `12px`
- Image gallery (C.3.6): 5 thumbnails, each `88×88px`, `border: 1px solid #998C5F`, `border-radius: 18px`, bg `#FFF`, gap `16px`
- Hashtags (C.3.7): Montserrat 16/24 700, color `#D4271D`
- C.4 action row: gap `24px`, height `56px`
  - C.4.1 Hearts: gap `4px`, text Montserrat 24/32 700 `#00101A`, icon `32×32px`
  - C.4.2 Copy link button: width `145px`, height `56px`, padding `16px`, gap `4px`, border-radius `4px`, icon `24×24px`

### D — Sidebar — node `2940:13488`
- Outer: width `422px`, gap `24px` column
- **D.1 Stats block**: padding `24px`, border `1px solid #998C5F`, bg `#00070C` (`--Details-Container-2`), border-radius `17px`
  - Stat rows (D.1.2/3/4/6/7): height `40px`, gap `8px` space-between
  - Stat value: Montserrat 32/40 700, color `#FFEA9E`, right-aligned
  - D.1.4 Số tim: text `32/40 700 #FFEA9E`, with heart icon group
  - D.1.5 divider: 1px `#2E3940`
  - **D.1.8 Mở quà button**: width `374px`, height `60px`, padding `16px`, gap `8px`, border-radius `8px`, bg `#FFEA9E`, gift icon `24×24px`
- **D.3 Leaderboard block**: padding `24px 16px 24px 24px`, border `1px solid #998C5F`, bg `#00070C`, border-radius `17px`
  - D.3.1 title: Montserrat 22/28 700, color `#FFEA9E`, center, 2-line ("10 SUNNER NHẬN QUÀ\nMỚI NHẤT")

### Footer "Header cuối" — node `2940:13522`
- Outer: `width: 1440px`, padding `40px 90px`, `border-top: 1px solid #2E3940`
- Logo: `69×64px` instance
- Nav buttons (4): heights `56px`, padding `16px`, gap `4px`; one has bg `rgba(255, 234, 158, 0.10)` (active state)
- Copyright text: Montserrat Alternates 16/24 700, white

---

## Project Token Mapping (extend `app/globals.css`)

Map the 8 plan-prescribed tokens to extracted values. Tokens use existing `--saa-*` naming convention from Awards / Homepage.

| Plan token | Maps to | Hex |
|---|---|---|
| `--saa-kudos-heart-active` | Heart icon active (red — needs media node check; tentative) | `#D4271D` (matches hashtag red — verified at Phase 6 with heart icon variants) |
| `--saa-kudos-heart-inactive` | Heart icon outline; same family as Highlight gold | `#FFEA9E` (provisional; finalize when icon downloads come back) |
| `--saa-kudos-card-bg` | Highlight + feed card bg | `#FFF8E1` |
| `--saa-kudos-card-border` | Card border + dividers inside card | `#FFEA9E` |
| `--saa-kudos-section-header-fg` | "HIGHLIGHT KUDOS" / "SPOTLIGHT BOARD" / "ALL KUDOS" | `#FFEA9E` |
| `--saa-kudos-section-subtitle-fg` | "Sun* Annual Awards 2025" subtitle | `#FFFFFF` |
| `--saa-kudos-filter-active-bg` | Active filter chip (need hover state — provisional, finalize at Phase 7) | `rgba(255, 234, 158, 0.40)` |
| `--saa-kudos-filter-inactive-bg` | Inactive filter / A.1 input bg | `rgba(255, 234, 158, 0.10)` |
| `--saa-spotlight-node-fg` | Spotlight word cloud node text | `#FFFFFF` (matches name labels on dark canvas) |
| `--saa-spotlight-node-bg` | Spotlight transparent canvas — no fill per design | `transparent` |
| `--saa-kudos-stat-value-fg` | D.1 stat numbers | `#FFEA9E` |
| `--saa-kudos-leaderboard-divider` | D.1.5 divider | `#2E3940` |

## Shared tokens reused from existing globals.css

- `--color-saa-page-fg: #FFFFFF` — already exists
- `--color-saa-page-bg` / `--color-saa-header` — already exists (#00101A family)
- `--color-saa-button-primary` (Awards used #FFEA9E in `feedback_visual_compare_assets`) — verify at Phase 0 if matches `#FFEA9E`

## Font family

All text on the screen uses **Montserrat** (700 weight predominantly). Footer copyright uses **Montserrat Alternates**. Both fonts already loaded by the project (from Homepage/Awards). No new font import required.

## Notes for implementer

1. **Highlight card 4px gold border + 16px radius** is the signature visual — do NOT thin it down.
2. **Avatars are 64×64 with white 1.869px border** — use `border-2` (≈2px) or a custom Tailwind border-width if 1.869 is required.
3. **Hashtag chip color `#D4271D` (red)** is the same as hashtag text inside card body — single token.
4. **Gradient overlays at carousel edges** (`Frame 528`/`527`) are 400×525px with linear gradient from `#00101A 50% → transparent 100%`. Implement as absolute positioned overlay.
5. **Filter dropdown linked frames** (`1002:13013`, `721:5684`) and **Profile preview popup** (`721:5827`) live in linked Figma frames — query them separately at Phase 7 (filters) and Phase 5 (preview).
6. **Spotlight node text** uses small font with letter-by-letter render — exact sizes vary by name length (word-cloud weighting). Custom canvas implementation (Q-PLAN3) will compute sizes at runtime.
