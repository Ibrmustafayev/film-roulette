# Film Roulette — product truth

## What it is

A film discovery tool. The visitor sets a few filters — genre, year range, original
language, rating band — then rolls. One film comes back. They can read it, watch the
trailer, stream it through a chain of embed providers, favourite it, and find it again
in history.

## Who it is for

Someone who wants to watch a film tonight and does not want to choose. The scene is
evening, at home, lights low, often on a phone or a laptop on the sofa. That scene is
why this product is dark: it is used in a dark room, against a screen that is about to
play a film.

## What the visitor does here

Primary task: **roll, judge the result, act on it.** Everything else is secondary.

The judging is the real work. A visitor looks at a poster, a rating, a year, a runtime,
and a synopsis, and decides in a few seconds. So the result must arrive as a complete,
readable object — not a teaser that needs a second click.

Secondary tasks: re-find something from history, keep favourites, search a specific
title, watch the trailer, stream.

## Mode

**Operate.** The visitor completes a task. Scanability and state clarity outrank
expression. The expression lives in the film's own imagery — poster and backdrop — not
in the chrome around it.

## Product truth that must not change

- Three locales: `en`, `az`, `ru`, via `getTranslations(locale)` and `t("a.b", vars)`.
  All visible copy comes from `src/locales/*.json`. No hard-coded strings.
- Zustand store `film-roulette-v2` persists locale, history, favourites, watchProgress.
- Views: `random`, `history`, `favourites`, `mobileapp`, `help`.
- Streaming uses a 6-source failover chain with a 5.5s probe per source, plus a manual
  "next server" control and a resume-from-progress path over `postMessage`.
- TMDB is the data source; posters and backdrops come from `getImageUrl`.
- History caps at 30 entries.

## Constraints

- Next 16 / React 19 / Tailwind v4 (`@theme`, not a v3 config file) / framer-motion.
- Streaming embeds are third-party iframes that inject ads. The player chrome must stay
  visually separate from them so the visitor can tell our UI from theirs.
- Poster and backdrop dimensions come from TMDB and are fixed ratios: 2/3 and 16/9.

## Decisions taken with the user

- **Dark only.** The light theme was removed. It was never measured, and inventing one
  would have meant guessing half the system. The use scene is a dark room.
- **Cinematic restructure.** The home surface was rebuilt around the result, not around
  the form that produces it.
- **Measured motion.** One authored moment, not a slot-machine sequence.
