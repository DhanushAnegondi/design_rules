# Modular type scales

> A type scale where every step is the previous step multiplied (or divided) by one fixed ratio, so all your font sizes are mathematically related instead of hand-picked.

**Bucket:** system
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, apps, dashboards, editorial/long-form

## What it is
Pick a base size (usually 1rem / 16px) and a single ratio (e.g. 1.25). Multiply the base by the ratio to get the next size up, multiply again for the one after that, divide for the steps below. The result is a harmonic ladder — `−2, −1, base, +1, +2, +3…` — where the *relationships* between sizes are consistent rather than arbitrary. The reader doesn't consciously see the ratio; they perceive a page that feels tuned, where headings sit at deliberate intervals above body text rather than at three random pixel values someone eyeballed. The ratios borrow names from musical intervals (minor third, perfect fourth) because the idea is the same: fixed proportional steps read as harmony.

## When to use
- Any project with more than two text sizes — the moment you have body, a couple of heading levels, and a caption, a scale stops the sizes from drifting.
- Design systems and token files, where you want `--step-1`, `--step-2` … reused everywhere instead of magic numbers scattered across components.
- Editorial and portfolio sites that lean on a big display-to-body size jump for drama — a high ratio (1.5–1.618) does this cleanly.
- Pairing with fluid type: bake the ratio into `clamp()` so the whole ladder breathes between a small-screen and large-screen size without a pile of media queries.
- When you want the scale to be auditable — a reviewer can verify "every step is ×1.25" instead of arguing about individual pixels.

## When NOT to use
- Dense UI (dashboards, data tables, settings panels) with a *high* ratio. A 1.5 or golden-ratio scale skips so fast that adjacent sizes become 24px then 36px — you run out of usable mid-range sizes and headings dwarf the data. Use 1.125–1.2 there.
- When the math fights real constraints. A platform that mandates 14px body and 20px H3 won't always land on a clean ratio step; force-fitting a scale onto fixed external specs creates worse sizes than just picking them. The scale serves the design, not the reverse.
- Tiny sites (a single landing page with one headline and body) — a scale is overhead you won't feel.
- Everyone overuses this for **"set ratio to golden 1.618 because it sounds prestigious"** on text-heavy pages. Golden ratio produces a *huge* jump (16 → 26 → 42px) that's gorgeous for a poster-like hero and unusable for a page that needs H2, H3, H4 *and* body to coexist. Match the ratio to content density, not to which number sounds most impressive.

## How it works
The mechanism is one multiplication repeated. Given a base size `B` and ratio `r`, step `n` is `B · rⁿ`. Step 0 is the base, positive `n` goes up, negative `n` goes down. CSS gives you two clean ways to express this:

- **`calc()` chaining with custom properties** — define `--ratio` and `--step-0`, then build each step off the one before (`--step-1: calc(var(--step-0) * var(--ratio))`). Editable in one place; the cascade does the arithmetic.
- **`pow()`** — modern CSS exposes `pow(base, exponent)`, so `calc(1rem * pow(var(--ratio), 2))` is the literal formula. Supported in Chrome/Edge/Safari and Firefox (2023+); fall back to the chained `calc()` form for older engines.
- **Fluid steps with `clamp(min, preferred, max)`** — instead of one fixed size per step, give each step a *small-viewport* size and a *large-viewport* size (computed from possibly different ratios) and let `clamp()` interpolate with a `vw`-based preferred value. This is the [Utopia](https://utopia.fyi/) approach: tighter scale on phones, more dramatic on desktop, no media queries.

Then you map steps to **semantic roles** rather than referencing raw steps in components. A typical mapping for a 1.25 (major third) scale off 16px:

| Role     | Step | Size (≈) | Notes |
|----------|------|----------|-------|
| caption  | −1   | 12.8px   | metadata, labels — guard the floor so it never drops below ~12px |
| body     | 0    | 16px     | the anchor; everything is relative to this |
| h3       | +1   | 20px     | |
| h2       | +2   | 25px     | |
| h1       | +3   | 31.25px  | |
| display  | +5   | 48.8px   | hero; often jumps a step for extra contrast |

The component layer references `--text-h1`, never `--step-3`, so you can re-tune the scale (or swap roles to different steps) without touching markup.

## Working code

### Vanilla CSS — chained `calc()`, fixed ratio, semantic roles
Self-contained document. Change `--ratio` once and the whole ladder re-derives.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Modular scale — major third (1.25)</title>
<style>
  :root {
    /* one knob: change this and every size re-derives */
    --ratio: 1.25;          /* major third */
    --step-0: 1rem;         /* base / body = 16px */

    /* ladder built off the base via the ratio */
    --step--1: calc(var(--step-0) / var(--ratio));               /* ~12.8px */
    --step-1:  calc(var(--step-0) * var(--ratio));               /* 20px    */
    --step-2:  calc(var(--step-1) * var(--ratio));               /* 25px    */
    --step-3:  calc(var(--step-2) * var(--ratio));               /* 31.25px */
    --step-4:  calc(var(--step-3) * var(--ratio));               /* 39px    */
    --step-5:  calc(var(--step-4) * var(--ratio));               /* 48.8px  */

    /* semantic roles — components reference THESE, not raw steps */
    --text-caption: var(--step--1);
    --text-body:    var(--step-0);
    --text-h3:      var(--step-1);
    --text-h2:      var(--step-2);
    --text-h1:      var(--step-3);
    --text-display: var(--step-5);

    /* line-height tightens as size grows (display reads better dense) */
    --leading-body: 1.6;
    --leading-tight: 1.05;
  }

  body {
    margin: 0; padding: 2rem clamp(1rem, 5vw, 4rem);
    font-family: "Fraunces", Georgia, serif;   /* characterful display face */
    background: #faf7f2; color: #1c1a17;
    font-size: var(--text-body);
    line-height: var(--leading-body);
    max-width: 60ch;
  }
  .display { font-size: var(--text-display); line-height: var(--leading-tight);
             font-weight: 600; letter-spacing: -0.02em; margin: 0 0 1rem; }
  h1 { font-size: var(--text-h1); line-height: var(--leading-tight); font-weight: 600; margin: 2rem 0 .5rem; }
  h2 { font-size: var(--text-h2); line-height: 1.15; font-weight: 600; margin: 1.75rem 0 .5rem; }
  h3 { font-size: var(--text-h3); line-height: 1.2;  font-weight: 600; margin: 1.5rem 0 .5rem; }
  p  { margin: 0 0 1rem; }
  .caption { font-size: var(--text-caption); color: #6b655c; letter-spacing: .01em; }
</style>
</head>
<body>
  <p class="display">A scale you can hear.</p>
  <p class="caption">Type · 4 min read</p>
  <h1>Every size is the last one times 1.25</h1>
  <p>Body text sits at the base. Headings step up the ratio; the caption steps down once.
     Re-tune the whole page by editing a single custom property.</p>
  <h2>Section heading</h2>
  <p>Because the relationships are fixed, the rhythm feels intentional rather than eyeballed.</p>
  <h3>Sub-heading</h3>
  <p>Mapping steps to semantic roles keeps components stable when you re-tune the scale.</p>
</body>
</html>
```

### Vanilla CSS — fluid steps with `clamp()` (Utopia-style, no media queries)
Each step interpolates between a phone size and a desktop size as the viewport grows. The `clamp()` math: for a step that goes from `minRem` at `minVw` px to `maxRem` at `maxVw` px,
`slope = (maxRem − minRem) / (maxVw − minVw)`, `intercept = minRem − slope · minVw`, then
`font-size: clamp(minRem, intercept + slope·100vw, maxRem)`. Worked below for body and h1 (min viewport 360px, max 1240px; values converted at 16px/rem).

```css
:root {
  /* body: 16px @360 -> 19px @1240.  slope=(1.1875-1)/(1240-360)=0.000213rem/px
     intercept = 1 - 0.000213*360 = 0.9233rem  -> slope*100 = 0.213vw */
  --text-body: clamp(1rem, 0.9233rem + 0.213vw, 1.1875rem);

  /* h1: 28px(1.75rem) @360 -> 48px(3rem) @1240.  slope=(3-1.75)/880=0.001420rem/px
     intercept = 1.75 - 0.001420*360 = 1.2386rem -> slope*100 = 1.420vw */
  --text-h1: clamp(1.75rem, 1.2386rem + 1.420vw, 3rem);

  /* caption: 12.8px(0.8rem) @360 -> 13.6px(0.85rem) @1240 (kept near-flat on purpose) */
  --text-caption: clamp(0.8rem, 0.7795rem + 0.0568vw, 0.85rem);
}
/* note the scale is steeper at the top (h1 ratio grows) and flat at the bottom
   (caption barely moves) — that is the whole point of a fluid scale: more drama
   on big screens, restraint on small ones, without a single @media query. */
```

### JS generator — emit a whole scale (fixed or fluid) as CSS custom properties
Drop the output into your `:root`. Both functions are callable with no args (sensible defaults) thanks to the `= {}` on the destructured parameter.

```js
// type-scale.js
const round = (n, p = 4) => Number(n.toFixed(p));

/**
 * Fixed scale: base * ratio^n for each step in [min..max].
 * Returns a map of --step-N -> "x.xxxxrem".
 */
function fixedScale({
  ratio = 1.25,
  baseRem = 1,
  min = -2,
  max = 5,
} = {}) {
  const out = {};
  for (let n = min; n <= max; n++) {
    out[`--step-${n}`] = `${round(baseRem * Math.pow(ratio, n))}rem`;
  }
  return out;
}

/**
 * Fluid scale: each step interpolates from (minBase * minRatio^n) at minVw
 * to (maxBase * maxRatio^n) at maxVw, emitted as a clamp().
 * The `= {}` default makes fluidScale() callable with no arguments.
 */
function fluidScale({
  minVw = 360,
  maxVw = 1240,
  minBaseRem = 1,      // 16px body on small screens
  maxBaseRem = 1.1875, // 19px body on large screens
  minRatio = 1.2,      // gentler ladder on phones
  maxRatio = 1.333,    // more dramatic on desktop
  min = -1,
  max = 5,
  rootPx = 16,
} = {}) {
  const out = {};
  for (let n = min; n <= max; n++) {
    const minRem = minBaseRem * Math.pow(minRatio, n);
    const maxRem = maxBaseRem * Math.pow(maxRatio, n);
    // rem-per-px slope between the two viewport anchors
    const slope = (maxRem - minRem) / (maxVw - minVw);  // rem per px
    const intercept = minRem - slope * minVw;           // rem
    const lo = round(Math.min(minRem, maxRem));
    const hi = round(Math.max(minRem, maxRem));
    out[`--step-${n}`] =
      `clamp(${lo}rem, ${round(intercept)}rem + ${round(slope * 100)}vw, ${hi}rem)`;
  }
  return out;
}

function toRootCss(map) {
  const body = Object.entries(map)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  return `:root {\n${body}\n}`;
}

// runnable as-is, no arguments required:
console.log(toRootCss(fixedScale()));
console.log(toRootCss(fluidScale()));
```

## Variations
- **Ratio by content density** — the one knob that matters most. 1.125 (major second) and 1.2 (minor third) for dense apps/dashboards; 1.25 (major third) and 1.333 (perfect fourth) for general marketing/editorial; 1.5 (perfect fifth) and 1.618 (golden) for poster-like, display-led portfolios. Lower ratio = more usable mid sizes; higher ratio = more drama, fewer steps before things get absurd.
- **Single vs. dual ratio (fluid)** — one ratio everywhere, or a gentler ratio at the small viewport and a steeper one at the large viewport (the Utopia move) so phones stay calm and desktops get the big jump.
- **Step skipping for hierarchy** — map display to `+5` while h1 sits at `+3`, leaving a deliberate gap so the hero clearly dominates without inventing an off-scale size.
- **Asymmetric floor** — clamp the bottom step (caption) so it never falls below ~12px regardless of ratio; small ratios can push `−2` into unreadable territory.
- **Spacing on the same ratio** — reuse the type ratio for margins/spacing tokens so vertical rhythm and type share one harmonic system.

## Accessibility
- **Respect user font-size / zoom**: define the base in `rem` (not `px`) so the whole scale grows when a user raises their default font size or zooms. A `px` base silently overrides that preference — a real WCAG 1.4.4 (resize text to 200%) failure.
- **Don't let the floor go illegible**: with high ratios the `−1`/`−2` steps shrink fast. Keep your smallest *meaningful* text at roughly 12–14px equivalent; clamp the bottom step rather than trusting the math.
- **Fluid clamp must still resize**: a `clamp()` whose preferred term is purely `vw`-based can fail 200% zoom because viewport units don't respond to zoom the way `rem` does. Always include a `rem` term in the preferred value (as the snippets do: `intercept-rem + slope-vw`) so zoom still scales the text.
- **Contrast is independent of size but interacts with it**: WCAG 2.2 allows 3:1 for "large text" (≥24px, or ≥18.66px bold) versus 4.5:1 for normal text. If a scale step lands a heading *just under* the large-text threshold, it must meet the stricter 4.5:1 — don't assume "it's a heading, 3:1 is fine." (In the example above `#6b655c` caption text on `#faf7f2` is ~4.9:1 — it clears normal-text 4.5:1, so it's safe even at the small caption size.)
- **Line-height scales too**: as size climbs, drop line-height toward ~1.05–1.15; oversized display text at body line-height (1.6) creates cavernous gaps that hurt readability and scanning.
- **No motion here** — a type scale is static, so `prefers-reduced-motion` doesn't apply; pointer/touch isn't relevant either. The a11y surface is sizing, zoom, and contrast.

## Performance
- Effectively free. Custom properties + `calc()`/`pow()` resolve at style time; there's no runtime cost, no JS on the page (the generator runs at build time or in your head).
- Changing `--ratio` or a step variable triggers a style recalc and reflow for everything that references it — fine on load, but don't animate the scale variables themselves frame-by-frame (animating `font-size` thrashes layout). Animate `transform: scale()` instead if you need motion.
- `clamp()`/`vw` fluid type recalculates on resize; this is cheap and native. No layout thrash beyond what any responsive layout already does.
- Zero bundle cost in the vanilla form. Tools like Utopia or a calculator just emit static CSS — nothing ships to the client.

## Anti-slop
Cliché (see `_slop-blocklist.md` → TYPE): **everything one weight and one size**, or three headings at arbitrary unrelated pixel values — the page reads flat and "generated." The opposite failure is reaching for **golden ratio because it sounds prestigious** on a content-dense page, blowing the hierarchy apart. Tasteful version: pick the ratio from *content density* (a calm 1.2 for an app, a confident 1.333 for editorial), pair it with real **weight contrast** (e.g. 600 display against 400 body) rather than relying on size alone, and serve it with a **characterful display face** — Fraunces, General Sans, Instrument Serif, Satoshi — instead of Inter/Roboto/Arial on every role. One committed ratio plus deliberate weight contrast is most of what separates a designed scale from a defaulted one.

## Pairs well with
- **Fluid type with `clamp()`** — bake the ratio into clamp so the ladder breathes between viewports without media queries (covered inline above).
- **Semantic color tokens** — same token discipline: components reference `--text-h1` / `--color-fg`, never raw steps or hex values, so re-tuning is one-file.
- **Vertical rhythm / spacing scale** — drive margins and spacing off the *same* ratio so type and whitespace share one harmonic system.
- **Font pairing** — a display serif on the top steps + a clean sans on body reads premium; the scale gives the size contrast, the pairing gives the texture contrast.
- **System font stack** — the scale is face-agnostic; you can ship it on a system stack first and swap in a webfont later without touching sizes.

## Current references
- [Creating a modular typography scale with CSS — Carmen Ansio (DEV)](https://dev.to/carmenansio/creating-a-modular-typography-scale-with-css-2d29) — builds the exact `--scale-ratio` + `clamp()` custom-property pattern used here.
- [CSS-only fluid modular type scales — Utopia](https://utopia.fyi/blog/css-modular-scales/) — the dual-ratio fluid approach and the reasoning behind gentler-on-phones / steeper-on-desktop.
- [Fluid type scale calculator — Utopia](https://utopia.fyi/type/calculator/) — paste min/max viewport + ratio, get the full `clamp()` ladder as custom properties.
- [Modular scale — Every Layout](https://every-layout.dev/rudiments/modular-scale/) — clear mental model for `base · rⁿ` and why ratios read as harmony.
- [What different types of typographic scales exist? — Cieden](https://cieden.com/book/sub-atomic/typography/different-type-scale-types) — ratio-by-ratio breakdown (minor third → golden) with contrast-level guidance for choosing one.
- [Generating font-size rules & a fluid type scale — Modern CSS](https://moderncss.dev/generating-font-size-css-rules-and-creating-a-fluid-type-scale/) — Stephanie Eckles on emitting the scale programmatically with custom properties.
- [Meet Utopia: fluid type & space scales — Smashing Magazine](https://www.smashingmagazine.com/2021/04/designing-developing-fluid-type-space-scales/) — long-form rationale for systematizing type + space on shared ratios.
