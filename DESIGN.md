# Film Roulette — visual world

Replaces two earlier looks. Both are anti-reference:

1. The original: red/amber gradients, pill buttons, blurred colour blobs, gradient
   headline text.
2. The first replacement: correct tokens, but one uniform radius on every surface,
   the same card rhythm everywhere, and a single centred column. Right colours,
   no structure.

## The idea

**A projection booth, not a web page.**

The left of the screen is an instrument: narrow, dense, engineered, with hard corners,
hairline rules and monospaced readouts. The right is the stage: wide, quiet, generous,
where the film's own artwork is the only colour that matters. The tension between those
two densities *is* the design. Nothing is centred by default, and nothing shares a
corner radius just because it is a box.

## 1. Structure

### The rail and the stage

```
┌────────────┬──────────────────────────────────────────┐
│  RAIL      │  STAGE                                   │
│  272px     │  fluid, max 1120px, 64px inner gutter    │
│  dense     │  loose                                   │
│  hairline  │  no boxes — alignment and rules only     │
│  rules     │                                          │
│            │                                          │
│  filters   │  backdrop → poster → title → synopsis    │
│  roll      │  ───────────────────────────────────     │
│  nav       │  dense metadata table                    │
└────────────┴──────────────────────────────────────────┘
```

- Rail is `position: fixed` at `xl` and above, a drawer below it.
- Stage content is **left-aligned to a 12-column grid**, never centred.
- Asymmetry is structural: the poster occupies columns 1–4, the detail 5–12, and the
  metadata table spans 1–9. Text never runs the full width of the stage.

### Density tiers

Three, applied by role and never mixed inside one region:

| Tier | Row height | Inline padding | Where |
|---|---|---|---|
| `tight` | 28px | 8px | rail controls, metadata table, server strip |
| `normal` | 36px | 12px | buttons, inputs, nav items |
| `loose` | — | 24–64px | stage sections, synopsis, empty states |

### Radius policy — deliberately not uniform

| Value | Applies to | Why |
|---|---|---|
| `0` | rail, stage, panels, tables, chips, drawers, player | Structure is cut, not rounded |
| `2px` | posters, thumbnails | Matches the physical object |
| `3px` | buttons, inputs, selects | Just enough to read as pressable |
| `50%` | avatars, the pip in the mark | Genuinely circular things only |

A box with no radius and a 1px rule is the default container. Rounded corners are a
signal that something is interactive, not decoration.

### Elevation — differentiated, never one shadow everywhere

| Level | Treatment | Where |
|---|---|---|
| flat | 1px hairline rule, no shadow | rail, tables, section dividers |
| raised | `0 1px 4px rgba(0,0,0,.4)` | posters |
| lifted | `0 8px 24px rgba(0,0,0,.5)` + 1px rule | drawer, dropdown, dialog |

## 2. Type

Three faces, three jobs. No face does two jobs.

| Face | Job | Notes |
|---|---|---|
| **Archivo** | UI, headings, labels, navigation | Grotesque with a width axis; the display sizes use tight tracking |
| **IBM Plex Mono** | Numerals and measurement only | Ratings, years, runtime, counts, server names, IDs — real data, not costume |
| **Source Serif 4** | Prose only | Synopsis and long-form help copy, at a 65–72ch measure |

Scale (a real ratio, not arbitrary steps — 1.25 minor third above the body):

| Token | Size / line-height | Tracking |
|---|---|---|
| `display` | 3.25rem / 1.02 | −0.03em |
| `title` | 2rem / 1.1 | −0.02em |
| `h3` | 1.375rem / 1.2 | −0.01em |
| `h4` | 1.0625rem / 1.3 | 0 |
| `body` | 0.9375rem / 1.6 | 0 |
| `small` | 0.8125rem / 1.5 | 0 |
| `label` | 0.6875rem / 1.2 | 0.12em, uppercase |

`label` is the rail's voice. `display` appears once per screen, never twice.

## 3. Colour

A ramp plus four semantic roles. The ramp is a real scale with a cool cast — not a
single hue swapped in.

### Neutral ramp

| Token | Value | Use |
|---|---|---|
| `ink-0` | `#0B0E11` | page floor, deepest |
| `ink-1` | `#101418` | stage |
| `ink-2` | `#161B21` | rail |
| `ink-3` | `#1E242C` | raised fill, input |
| `ink-4` | `#2A323C` | hairline rule |
| `ink-5` | `#3D4854` | strong rule, disabled text |
| `ink-6` | `#5C6977` | tertiary text |
| `ink-7` | `#8593A1` | secondary text |
| `ink-8` | `#B9C4CE` | body text |
| `ink-9` | `#EDF1F5` | headings |

Body text `ink-8` on stage `ink-1` measures **11.6:1**. Secondary `ink-7` measures
**6.7:1**. Tertiary `ink-6` is used only at `label` size on `ink-1` (**3.6:1**) and
never for body copy.

### Semantic roles

Each role carries five slots so it is a system, not a colour:
`subtle` (tinted background), `border`, `base`, `hover`, `on` (text on the base).

| Role | Base | Meaning — and only this |
|---|---|---|
| `live` | `#00E054` | the roll, the active source, the current selection |
| `flag` | `#FF8A2B` | favourite. Nothing else is ever this colour |
| `link` | `#4FB8F5` | links and focus rings |
| `alert` | `#FF4438` | errors and destructive intent |

One role may be primary per region. The stage is neutral except where the film's own
artwork supplies colour.

## 4. Motion

One easing, `cubic-bezier(.2, .8, .2, 1)`, at `120ms` (state), `240ms` (element),
`420ms` (the arrival).

**One authored moment:** the result arriving. The backdrop resolves from black, the
poster rises 12px with its shadow deepening, then the title, metadata and synopsis
stagger in at 40ms intervals. Nothing else on the page has an entrance — the rail is
already there, and re-rolling replays only the stage.

Everything else is a state change: 120ms colour and border only. No transforms on hover
except the poster's 2px lift. `prefers-reduced-motion` removes the stagger and the lift
and leaves opacity.

## 5. The mark

An aperture whose six blades leave a hexagonal opening; three pips sit in the negative
space, so the same figure reads as a camera iris and as a die face. Drawn once as SVG
and used at every size: header (20px), favicon (32px), OG card (96px), loading screen.

Single-colour capable — the pips are knocked out, not painted — so it survives a
monochrome favicon and a dark OG background.

## 6. Refused

- One radius on every element
- Centred single-column layout
- Equal-size cards as page structure
- Gradient text, decorative blur, eyebrow badges above headings
- Emoji in place of icons
- Any shadow without an offset
- Mono as decoration on non-numeric text
