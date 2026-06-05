# Design knowledge base — how to use it

A self-contained library you can build UI from without leaving the repo. Open one
file and get the whole picture: what a technique is, when to use it, **when not to**,
runnable code, accessibility, performance, the anti-slop alternative, and current
references. Start at [INDEX.md](INDEX.md).

## The mental model: skin + skeleton + behavior

A real screen is an assembly, not a single choice. Pick one from each bucket:

| Layer | Bucket | Folder | Example |
|---|---|---|---|
| **Skin** — how it looks | visual style | [01](01-visual-styles/) | editorial-typographic, dark-mode |
| **Skeleton** — how it's arranged | layout | [03](03-layout-systems/) | bento-grid, split-screen |
| **Behavior** — how it moves | scroll/motion | [02](02-scroll-motion/) | scroll-triggered, staggered-entrance |
| **Type & color** — the system underneath | systems | [05](05-typography-color/) | modular scale + OKLCH tokens |
| **Parts** — what it's built from | components | [04](04-component-patterns/) | navbar, cards, modal |
| **Texture** — surface richness | backgrounds/effects | [07](07-backgrounds-effects/) | noise, gradient mesh, glass |
| **Feedback** — what happens at runtime | states | [08](08-ui-states-feedback/) | empty, loading, error, toast |
| **Adaptation** — across screens | responsive | [09](09-responsive-foundations/) | container queries, fluid type |

**Slop is grabbing the default of every bucket at once** — flat + blue/purple gradient
+ Inter + hero-and-three-cards + uniform fade-up. Deliberately breaking two or three of
those is most of what separates "designed" from "generated." The guard is
[_slop-blocklist.md](_slop-blocklist.md), and every entry's **Anti-slop** section names
the cliché version and the tasteful alternative.

## Two ways to work

**1. Compose from scratch.** Decide the vibe, then pick one entry per bucket above.
Each file's "Pairs well with" section points to entries that combine cleanly, so you can
walk the assembly. Each file's "When NOT to use" keeps you from a wrong turn.

**2. Start from a recipe.** [06-recipes/](06-recipes/) has six pre-composed, runnable
starting points — SaaS landing, agency/editorial, dev portfolio, mobile app, Instagram
carousel, dashboard. Each prescribes a full skin + skeleton + behavior + type + color
stack, justifies every choice as the non-slop option, ships a complete `index.html` (or
React tree) scaffold, and ends with a "make it yours" section naming the three knobs to
change. Fastest path from zero to a tasteful draft.

## How to read one entry

Every file follows the same shape (see [_TEMPLATE.md](_TEMPLATE.md)):
a one-line definition and metadata (maturity / effort / best-for), then **What it is →
When to use → When NOT to use → How it works → Working code → Variations →
Accessibility → Performance → Anti-slop → Pairs well with → Current references.**
The **Working code** is complete and runnable — copy it and it renders; no `...` gaps.

## Non-negotiables baked into every entry

- **Accessibility is not optional.** Anything that moves handles
  `prefers-reduced-motion` in the actual code; hover/cursor effects have a touch
  fallback; interactive widgets follow ARIA APG keyboard/focus behavior; contrast meets
  WCAG and the cited ratios are real, measured against the colors used in that file.
- **Currency.** Techniques and references are 2024–2026: native CSS scroll-driven
  animations, container queries, `:has()`, OKLCH, View Transitions, Lenis, GSAP, Framer
  Motion — with honest browser-support notes and progressive-enhancement paths.
- **Self-contained.** No "see X" without summarizing X inline.

## Quality bar & process

Every file was written by a domain researcher, then **independently audited** by a
separate verifier against a 7-point Quality Gate (structure, completeness, code
validity, currency, accessibility, anti-slop, self-contained) and repaired until it
passed. See [../CLAUDE.md](../CLAUDE.md) for the gate and the build loop,
[_lessons.md](_lessons.md) for what the verifier kept catching, and each domain's
`_todo.md` for its per-file pass record. The reference standard for depth is
[02-scroll-motion/text-reveal-on-scroll.md](02-scroll-motion/text-reveal-on-scroll.md).

## Contents at a glance

88 entries across 9 buckets — full navigable list in [INDEX.md](INDEX.md):
01 visual styles (12) · 02 scroll/motion (14) · 03 layout (13) · 04 components (11) ·
05 type & color (11) · 06 recipes (6) · 07 backgrounds/effects (8) · 08 states (7) ·
09 responsive (6).
