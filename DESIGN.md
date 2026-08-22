# Film Roulette — visual world

Replaces the previous look (red/amber gradients, pill buttons, blurred colour blobs,
gradient headline text). That look is kept here only as anti-reference.

## The idea

**The film is the design. The interface is the projection booth.**

Nothing in the chrome competes with the poster and the backdrop. The chrome is a set of
flat, cool, near-black surfaces with one green accent that means "this is live". Colour
in the page comes almost entirely from film artwork, which changes with every roll —
so the shell must stay neutral enough to host anything TMDB returns.

## Tokens

Values are measured, not invented. See `docs/design-system.md` in the sibling
`film` project for the extraction record.

### Surfaces

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#14181C` | page |
| `--color-surface` | `#283038` | raised panel, chip |
| `--color-surface-alt` | `#2C3440` | divider, hairline |
| `--color-panel` | `#445566` | filled control |
| `--color-panel-high` | `#334455` | pressed control |
| `--color-poster-bg` | `#12161A` | poster/image placeholder |
| `--color-separator` | `#445566` | 1px rule |
| `--color-rating-track` | `#3C454F` | meter track |

### Content

| Token | Value | Use |
|---|---|---|
| `--color-ink` | `#99AABB` | body |
| `--color-ink-high` | `#AABBCC` | emphasised body |
| `--color-ink-higher` | `#CCDDEE` | active control text |
| `--color-heading` | `#FFFFFF` | headings |
| `--color-meta` | `#667788` | metadata |
| `--color-muted` | `#8899AA` | low-contrast body |

### Accent

| Token | Value | Meaning |
|---|---|---|
| `--color-green` | `#00E054` | live / selected / hover ring |
| `--color-green-surface` | `#00AC1C` | primary action |
| `--color-green-hover` | `#00C030` | primary hover, rating fill |
| `--color-orange` | `#FF8000` | favourite, like |
| `--color-blue` | `#40BCF4` | links, focus |
| `--color-danger` | `#EC1200` | destructive, error |

One accent per screen carries the primary action. Green is the roll. Orange is only
ever the favourite. Blue is only ever a link or focus.

### Type

Two faces, split by role — this split is the single largest contributor to the look:

- **Sans (Inter)** — everything structural: labels, navigation, buttons, metadata.
- **Serif (Source Serif 4)** — prose and numerals: synopsis, ratings, counts, years.

Scale: `2rem/1.125`, `1.6875rem/1.25`, `1.375rem/1.25`, `1.125rem/1.25`, `1rem/1.25`,
`0.9375rem/1.5`, `0.8125rem/1.5`, `0.75rem/1.5`, `0.6875rem/1.5`.
Section labels: `0.8125rem`, `letter-spacing: 0.075em`, uppercase, with a 1px rule under.

### Motion

One easing: `cubic-bezier(.19, 1, .22, 1)`. Durations `.15s` / `.333s` / `.5s`.

The single authored moment is **the result arriving**: backdrop fades up behind, poster
rises with its shadow deepening, then the metadata staggers in behind it. Nothing else
on the page has an entrance.

Hover ring on posters is gated behind `(hover: hover) and (pointer: fine)` so touch
never gets a stuck state. `prefers-reduced-motion` collapses every duration.

### Shape and depth

Radii: `2px` poster small, `3px` chip, `4px` control, `8px` poster large, `0.5rem` panel.
Poster shadow: `0 1px 5px rgba(0,0,0,.25), 0 1px 10px rgba(0,0,0,.35)`; on hover it
deepens and the poster lifts 2px. Every shadow has an offset and a blur.

### Layout

Content grid: 12 × 5rem = **960px** max, page gutter `1.5rem` per side.
Breakpoints: `480 / 560 / 640 / 768 / 1024 / 1280`.
Poster ratio `2/3`, backdrop `16/9`.

## Home composition

The result leads. Above it, the roll is a compact bar, not a stage.

1. **Backdrop** — the current film's backdrop, 16/9, behind the content, fading into the
   page. Empty before the first roll.
2. **Roll bar** — filters and the roll action on one line at `lg`, stacked below.
3. **Result** — poster column, detail column, side column: the same three-column
   arrangement a film page uses.
4. **Player** — expands under the result, visually fenced off from third-party iframes
   by its own hairline and a status strip that names the active server.

## Refused, deliberately

- Gradient text on the headline
- The `🎬` badge above the heading (an eyebrow, and an emoji standing in for an icon)
- Decorative blurred colour blobs
- `rounded-full` on primary actions
- Cards of equal size as the page structure
