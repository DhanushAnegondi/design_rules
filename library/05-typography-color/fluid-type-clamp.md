# Fluid type with clamp()

> One CSS line — `clamp(min, base + vw, max)` — that grows a font size smoothly between two viewport widths, with no breakpoints and no media queries.

**Bucket:** system
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, apps, dashboards

## What it is
Fluid type interpolates a font size linearly against the viewport width instead of jumping at fixed breakpoints. `clamp(MIN, PREFERRED, MAX)` returns the `PREFERRED` value as long as it stays inside the `[MIN, MAX]` band; the `PREFERRED` term carries a `vw` unit so it tracks viewport width. The reader perceives type that feels "tuned" at every screen size — a headline that is comfortably large on a phone and grand on a desktop without the stair-step of `@media` queries. Extend the idea to every step of a modular scale and the whole document breathes together.

## When to use
- Headings and display type that should feel proportionate from 320px phones to 1600px+ desktops without authoring 4 breakpoints per element.
- A whole type scale you want to define once as custom properties and reuse (the Utopia approach), so spacing and type stay in lockstep.
- Hero/landing typography where the difference between "fits the phone" and "commands the desktop" is large and you don't want an awkward mid-range.
- Spacing, gaps, and `border-radius` too — `clamp()` is unit-agnostic, so the same fluid math drives a coherent rhythm system.

## When NOT to use
- Body copy where you want a flat, predictable reading measure — fluid body text that drifts with window width can subtly fight the line-length sweet spot. Many designers keep body at a fixed `rem` and make only headings fluid.
- Tiny min sizes. If `MIN` drops below ~1rem (16px) on small screens you risk illegible text; clamp won't save you from a bad floor.
- When the max is far larger than the min. A `MAX` more than ~2.5× the `MIN` can prevent users from reaching 200% effective size when they zoom, failing WCAG 1.4.4 Resize Text (see Accessibility).
- Everyone overuses this for *every size at once* — a "fluid everything" page where body, captions, buttons, and headings all slide independently reads as mushy and unstable. Make headings fluid; keep functional text steady.

## How it works
`clamp(MIN, PREFERRED, MAX)` is shorthand for `max(MIN, min(PREFERRED, MAX))`. The trick is the middle term: a straight line in the form `y = mx + b`, where `x` is the viewport width.

- `m` is the **slope** — how fast the size grows per unit of viewport. Expressed in CSS as a `vw` coefficient (1vw = 1% of viewport width).
- `b` is the **y-intercept** — a fixed `rem` offset so the line passes through `MIN` at the small viewport.

Given a min size `S1` at viewport `W1` and a max size `S2` at viewport `W2` (all in the same unit), the math is:

```text
slope        = (S2 - S1) / (W2 - W1)
yIntercept   = S1 - slope * W1
preferred    = yIntercept[rem] + (slope * 100)[vw]
result       = clamp(S1, preferred, S2)
```

Worked example — grow 18px → 24px between a 360px and a 1240px viewport. Convert to rem (1rem = 16px): sizes `1.125rem → 1.5rem`, viewports `22.5rem → 77.5rem`.

```text
slope      = (1.5 - 1.125) / (77.5 - 22.5) = 0.375 / 55 = 0.006818 (rem per rem)
yIntercept = 1.125 - 0.006818 * 22.5      = 0.9716rem
vw term    = 0.006818 * 100               = 0.6818vw
result     = clamp(1.125rem, 0.9716rem + 0.6818vw, 1.5rem)
```

Below 360px the `MIN` (1.125rem) holds; above 1240px the `MAX` (1.5rem) holds; in between the size rides the line. Using `rem` (not `px`) for `MIN`/`MAX` is what keeps the result zoom-responsive.

Key properties/APIs:
- `clamp()`, `min()`, `max()` — CSS math functions, baseline-supported across all modern engines.
- `vw` (and `svw`/`lvw`/`dvw` for small/large/dynamic viewport on mobile) — the fluid driver.
- Custom properties (`--step-0`) — the carrier for a reusable scale.
- `calc()` — only needed if you assemble the preferred value from variables at runtime; the precomputed one-liner above needs none.

## Working code

### Native CSS — a full fluid scale as custom properties (Utopia approach)
A self-contained document. The scale ramps from 320px to 1240px. Each step keeps `MAX / MIN ≤ 2.5` so zoom stays compliant. Drop this in and it runs.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fluid type scale</title>
<style>
  :root {
    /* Fluid type scale: min @320px (20rem) -> max @1240px (77.5rem).
       Each --step is clamp(MIN, yIntercept + vw, MAX).
       Ratios stay <= 2.5x so users can still zoom to 200%. */
    --step--1: clamp(0.8333rem, 0.7754rem + 0.2899vw, 0.9rem);   /* small / captions */
    --step-0:  clamp(1rem,      0.9275rem + 0.3623vw, 1.125rem);  /* body            */
    --step-1:  clamp(1.2rem,    1.0942rem + 0.5290vw, 1.4063rem); /* lead            */
    --step-2:  clamp(1.44rem,   1.2848rem + 0.7758vw, 1.7578rem); /* h3              */
    --step-3:  clamp(1.728rem,  1.4987rem + 1.1467vw, 2.1973rem); /* h2              */
    --step-4:  clamp(2.0736rem, 1.7330rem + 1.7031vw, 2.7466rem); /* h1              */
    --step-5:  clamp(2.4883rem, 1.9740rem + 2.5717vw, 3.4332rem); /* display         */

    --measure: 66ch;
    color-scheme: light dark;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    /* characterful display + readable mono accent instead of Inter-everywhere */
    font-family: "Fraunces", Georgia, "Times New Roman", serif;
    font-size: var(--step-0);
    line-height: 1.6;
    background: #faf7f2;
    color: #1c1a17;
    padding: clamp(1.5rem, 1rem + 3vw, 4rem);
  }
  @media (prefers-color-scheme: dark) {
    body { background: #14130f; color: #ece7df; }
  }

  .prose { max-width: var(--measure); margin-inline: auto; }

  h1 { font-size: var(--step-4); line-height: 1.08; margin: 0 0 .4em; letter-spacing: -0.01em; }
  h2 { font-size: var(--step-3); line-height: 1.12; margin: 1.4em 0 .4em; }
  h3 { font-size: var(--step-2); line-height: 1.2;  margin: 1.2em 0 .35em; }
  .display { font-size: var(--step-5); line-height: 1.02; letter-spacing: -0.02em; }
  small, .caption {
    font-size: var(--step--1);
    /* mono accent for metadata — a deliberate type contrast, not a default */
    font-family: ui-monospace, "SF Mono", "Cascadia Code", monospace;
    letter-spacing: 0.02em;
    color: #6b6358;
  }
  p { max-width: var(--measure); }
</style>
</head>
<body>
  <main class="prose">
    <p class="caption">FIELD NOTES / 04</p>
    <h1 class="display">A scale that breathes</h1>
    <p>Resize the window. Every step rides the same linear slope between 320px and
       1240px, so the relationship between heading and body never breaks. No
       breakpoints fire — the math does the work.</p>
    <h2>Why one line beats four queries</h2>
    <p>Each custom property is computed once and reused. Change the floor, ceiling,
       or viewport endpoints in one place and the whole document re-tunes.</p>
    <h3>Still zoom-safe</h3>
    <p>Because the floors and ceilings are in <code>rem</code> and no step grows
       past 2.5× its minimum, pressing Ctrl/Cmd&nbsp;+ still scales the page.</p>
    <p><small>Last revised 2026-06-04 · set in Fraunces</small></p>
  </main>
</body>
</html>
```

### SCSS / generator — produce the same scale from one mixin
If you don't want to hand-compute each step, a function spits out the clamp string. This is what Utopia, the Fluid calculators, and most build setups do under the hood.

```scss
// _fluid.scss — clamp() generator (assumes 1rem = 16px)
@use "sass:math";

@function rem($px) { @return math.div($px, 16) * 1rem; }

// $minPx/$maxPx = font sizes; $minVw/$maxVw = viewport endpoints in px
@function fluid($minPx, $maxPx, $minVw: 320, $maxVw: 1240) {
  $slope: math.div($maxPx - $minPx, $maxVw - $minVw);   // px per px
  $intercept: $minPx - $slope * $minVw;                 // px
  $preferred: #{rem($intercept)} + #{$slope * 100}vw;   // rem + vw
  @return clamp(#{rem($minPx)}, #{$preferred}, #{rem($maxPx)});
}

:root {
  --step-0: #{fluid(16, 18)};   // body
  --step-1: #{fluid(19, 22)};
  --step-2: #{fluid(23, 28)};
  --step-3: #{fluid(28, 35)};
  --step-4: #{fluid(33, 44)};   // h1
}
```

### React — guard against locking out zoom users at runtime
Most of the time clamp is pure CSS. The one case for JS is *honoring a user's larger base font*: if you compute fluid sizes in JS, drive them from `rem`, never `window.innerWidth` in pixels, so OS/browser font scaling still applies.

```jsx
import { useMemo } from "react";

// Returns a clamp() string from px inputs; output uses rem so it respects zoom.
function fluidClamp(minPx, maxPx, minVw = 320, maxVw = 1240, root = 16) {
  const slope = (maxPx - minPx) / (maxVw - minVw);
  const intercept = minPx - slope * minVw;
  const minRem = (minPx / root).toFixed(4);
  const maxRem = (maxPx / root).toFixed(4);
  const bRem = (intercept / root).toFixed(4);
  const vw = (slope * 100).toFixed(4);
  return `clamp(${minRem}rem, ${bRem}rem + ${vw}vw, ${maxRem}rem)`;
}

export function FluidHeading({ children }) {
  // computed once; the browser does the actual interpolation, not React
  const fontSize = useMemo(() => fluidClamp(33, 44), []);
  return (
    <h1 style={{ fontSize, lineHeight: 1.08, letterSpacing: "-0.01em", margin: 0 }}>
      {children}
    </h1>
  );
}
```

## Variations
- **Headings-only fluid** — keep body at a fixed `--step-0: 1rem` (or a gentle clamp with a tiny slope) and let only `--step-1`+ scale. The knob: how many steps you make fluid.
- **Container-relative fluid** — swap `vw` for `cqi` (container query inline-size) so the type responds to its *container* width, not the window. Ideal inside sidebars, cards, and bento cells. Knob: `vw` → `cqi`.
- **Mobile-safe viewport units** — use `dvw`/`svw` instead of `vw` where mobile browser chrome resizing causes jumpy values. Knob: which viewport unit.
- **Steeper vs gentler slope** — widen or narrow the `[minVw, maxVw]` band. A narrow band (e.g. 360→900px) reaches the max faster; a wide band (320→1600px) ramps gently. Knob: the viewport endpoints.
- **Two ratios** — Utopia lets the *scale ratio* itself differ at min vs max (e.g. 1.2 minor third on mobile, 1.25 major third on desktop), so contrast grows on big screens. Knob: min-ratio vs max-ratio.

## Accessibility
- **Zoom / WCAG 1.4.4 Resize Text (AA)** — this is the headline caveat. A `MAX` that is too close to the `PREFERRED` at large widths, or expressed in `px`, can stop text from reaching 200% of its base size when the user zooms, which fails the criterion. Two rules keep you safe: (1) always express `MIN` and `MAX` in `rem` (or `em`), never `px`, so they scale with the root font size; (2) keep `MAX ≤ ~2.5 × MIN` — modern browsers then still allow a 200% effective increase via zoom. The scale above obeys both.
- **Respect the user's base font size** — because `rem` is anchored to the root, a user who sets a larger default font in their browser gets larger fluid type for free. Never hard-code the root in `px` with `!important` or compute sizes from raw pixel viewport widths.
- **Contrast / focus / keyboard** — fluid sizing changes dimensions, not color; verify text still meets WCAG 1.4.3 contrast (4.5:1 for body, 3:1 for large text ≥24px or ≥18.7px bold) at *every* size, since a heading that is "large text" on desktop may shrink below the large-text threshold on mobile and then needs the stricter 4.5:1. Fluid type doesn't touch focus rings or keyboard order.
- **Touch/pointer** — type scale doesn't affect hit targets, but if you reuse the same fluid math for buttons, ensure the minimum still yields a ≥24px (WCAG 2.2 Target Size) / ideally ≥44px touch target at the smallest viewport.
- **Screen readers** — purely visual; clamp() changes rendered size only and has no effect on the accessibility tree or reading order.

## Performance
- **Cheap.** `clamp()` resolves at style/layout time, not per frame. There is no JS, no scroll listener, no `requestAnimationFrame`.
- **Resize cost** — values recompute on viewport resize (a layout/reflow you already pay for); fluid type adds negligible overhead versus fixed sizes.
- **No repaint thrash** — unlike scroll-driven effects there's nothing animating; static reflow only.
- **No bundle cost** for the native approach. SCSS generators run at build time and ship zero runtime. The React helper computes a string once via `useMemo` — keep it out of render-hot paths.
- **Avoid** wrapping every value in runtime `calc()` chains of nested custom properties; deep variable graphs can slow style resolution on large DOMs. Precompute the clamp string where you can.

## Anti-slop
Cliché (see `_slop-blocklist.md` → TYPE): everything one weight and a near-flat size ramp, set in Inter/Roboto, where "responsive" means two media-query font sizes that snap awkwardly mid-range. The fluid-specific slop is the opposite extreme — *every* element (body, captions, buttons, labels) sliding on its own slope so the page feels gelatinous, plus a `MAX` so huge headlines blow past the viewport and can't be zoomed. Tasteful version: a real modular scale (here ~1.2–1.25 ratio) with deliberate weight contrast, set in a characterful face (Fraunces, General Sans, Satoshi, Instrument Serif) with a mono accent for metadata; make headings fluid, keep body and functional text steady, and cap every step at ≤2.5× its floor so zoom still works. Designed, not generated.

## Pairs well with
- **Modular type scale** — fluid clamp is the *delivery mechanism* for a modular scale; pick a ratio (1.2/1.25/1.333), then make each step a clamp between its small- and large-screen values.
- **Fluid space scale** — apply the identical `clamp()` math to margins, gaps, and padding (Utopia generates both) so vertical rhythm scales with type and the layout never feels cramped on mobile or sparse on desktop.
- **System font stack / variable fonts** — a single variable font lets you pair fluid *size* with fluid *weight/optical-size* (`font-variation-settings`) for type that adapts on two axes.
- **Container queries** — swap `vw` for `cqi` so components carry their own fluid type wherever they're placed, independent of the page width.

## Current references
- [clamp() CSS function - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) - canonical syntax, `min(max(...))` equivalence, and browser support baseline.
- [Fluid type scale calculator - Utopia](https://utopia.fyi/type/calculator/) - generate a full custom-property scale from min/max viewport, size, and ratio; copy-paste output.
- [Clamp - Utopia](https://utopia.fyi/blog/clamp/) - the slope/intercept derivation behind the one-line clamp, explained step by step.
- [Modern Fluid Typography Using CSS Clamp - Smashing Magazine](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/) - the `y = mx + b` math worked through with real numbers.
- [Addressing Accessibility Concerns With Using Fluid Type - Smashing Magazine](https://www.smashingmagazine.com/2023/11/addressing-accessibility-concerns-fluid-type/) - the WCAG 1.4.4 zoom failure mode and the rem + ratio fix.
- [Reimagining Fluid Typography - OddBird](https://www.oddbird.net/2025/02/12/fluid-type/) - 2025 rethink of fluid type defaults and the role of container units.
- [Visualizing Responsive Typography - OddBird](https://www.oddbird.net/2025/08/26/type-visual/) - 2025 piece on reasoning about the slope visually.
- [Creating a Fluid Type Scale with CSS Clamp - Aleksandr Hovhannisyan](https://www.aleksandrhovhannisyan.com/blog/fluid-type-scale-with-css-clamp/) - a from-scratch generator and the unit-choice rationale.
