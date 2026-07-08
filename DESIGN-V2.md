# GlaciaNav CRM — V2 design language: "Alpine Modernist"

Swiss International Style crossed with the swisstopo Landeskarte. The interface chrome
is the poster (paper, ink, one red); the data is the map (cartographic hues). Everything
square, everything ruled, type does the talking.

## Principles

1. **Chrome is the poster.** White paper, near-black ink, one signal red. Chrome never
   uses data color; data never uses chrome red (except "route" = primary series).
2. **Data is the map.** Status pills, charts, and tags draw from the Landeskarte palette:
   glacier blue, contour brown, forest green, rock grey, route red.
3. **One typeface.** Archivo (variable: weight + width) everywhere — condensed heavy for
   poster headlines, regular for body/data. IBM Plex Mono for coordinates, dates, counts,
   and LEGEND-CAPS labels. No third face, ever.
4. **Zero radius, zero shadow.** Separation by hairline rules and surface greys only.
   `--radius: 0` cascades through the whole shadcn scale. `rounded-full` is reserved for
   avatars (circles are Swiss; pills are not).
5. **The red blaze.** The Alpine trail marker is the one system-wide signature: a red bar
   marks the active nav item, the selected row, the "now" line, the current stage. Red is
   never decoration — it always means *you are here / look here*.
6. **Poster headers.** Every page opens with an oversized flush-left Archivo headline
   sitting on a hairline baseline, over a mono grid-reference meta line
   (e.g. `BOARD / 11 CONTACTS / UPDATED 08 JUL`).
7. **Motion is crisp.** 120–160ms color/opacity only. The single orchestrated moment is
   the poster-header reveal on page load. `prefers-reduced-motion` kills it all.

## Tokens (light)

| Token        | Value     | Role                                    |
|--------------|-----------|-----------------------------------------|
| paper        | `#FFFFFF` | canvas, cards                           |
| ink          | `#131313` | text, primary buttons, strong rules     |
| signal       | `#DA291C` | the red: blaze, focus, now, route       |
| surface      | `#F4F4F4` | secondary/muted fills, zebra rows       |
| hairline     | `#E3E3E3` | minor rules, borders                    |
| ink-muted    | `#666666` | secondary text (5.7:1 on paper)         |

Map/data hues (charts + status defaults): route `#DA291C`, glacier `#33688C`,
ink `#131313`, contour `#9C6B3F`, forest `#47704A`.

Dark theme is a disciplined inversion (paper `#101010`, ink `#F4F4F4`, signal
brightened to `#FF4B3A`), defined at token level from day one, polished in Gate 6.

## Type scale

- Poster: Archivo 800, `clamp(34px, 5vw, 56px)`, leading 0.95, tracking −0.025em
- Section: Archivo 700, 22–26px, tracking −0.015em
- Body: Archivo 400/500, 14px / 20px leading
- Data: Archivo 500 13px, or Plex Mono 12.5px `tabular-nums`
- LEGEND-CAPS: Plex Mono 500, 10.5px, +0.14em, uppercase — table headers, eyebrows, meta

## Gates

1. Foundation + login (this spec, fonts, tokens, brand mark, login rebuilt) ✳ current
2. Shell (rail + top strip) + dashboard (cross-section "Ascent" hero)
3. Board: hairline table, flag chips, kanban, drawer, dialogs
4. Contacts + tasks
5. Insights + calendar
6. Settings, admin, intake, notifications, dark polish, responsive + reduced-motion QA

Each gate ends with screenshots and Nima's approval before the next.
