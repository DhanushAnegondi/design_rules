# Fluid everything

> Apply `clamp(min, slope + vw, max)` to type, space, and layout simultaneously so the entire design interpolates continuously between screen sizes, eliminating most breakpoints without sacrificing control.

**Bucket:** layout | system
**Maturity:** current
**Effort:** medium
**Best for:** websites, portfolios, apps, dashboards

## What it is

"Fluid everything" is the practice of unifying your type scale, spacing scale, and grid layout under the same `clamp()`-based interpolation math, so that every visual dimension — from a headline's font size to a card's padding to the number of columns in a grid — responds to available space continuously rather than jumping at named breakpoints. The user perceives a design that feels proportionate and unhurried on any screen: headlines that are large but not overwhelming on a 375px phone; sections that breathe on a 1440px monitor without feeling padded. The key distinction from "breakpoint-heavy responsive" is that the browser does the interpolation; you define the floor, ceiling, and slope once, and the layout computes its own intermediate states.

Cross-ref: `fluid-type-clamp` covers the slope/intercept math for font sizes in detail. This entry extends that math to spacing and grid, and addresses the system-level design of tying the three scales together.

## When to use

- You are building a document or marketing site that spans 360px phones to 1600px+ ultrawide monitors and want one coherent visual rhythm throughout.
- Your design tokens (type, space, max-widths) are authored once and consumed by many components — fluid custom properties propagate that coherence for free.
- You are using an auto-fit/`minmax` grid where column count should emerge from available space rather than from hand-authored column counts at three breakpoints.
- You want to reduce the maintenance surface: fewer `@media` blocks, fewer per-component overrides, one set of viewport endpoints to tune.
- Spacing between stacked sections should tighten on small screens and expand on large ones without a separate rule for each.

## When NOT to use

- Body copy running text. Fluid body text that drifts from, say, 16px to 20px as the window widens can subtly misalign with the user's line-length sweet spot (45–75 ch). Keep body at a fixed or gently-clamped `--step-0`; let headings carry the visual scaling.
- Fixed-ratio UI chrome: nav heights, icon sizes, toggle switches, input borders. These have a correct size independent of the viewport and benefit from a firm `rem` rather than a slope.
- When `MAX / MIN > 2.5` on any text property. That ratio boundary keeps zoom-safe (see Accessibility). Beyond it you must either widen the floor or lower the ceiling.
- Any context where a component truly needs a structural layout shift (sidebar collapses to a drawer, table pivots to a card stack). That is a behavioral change, not a smooth interpolation — use a container query or media query with a clear semantic threshold.
- Everyone overuses fluid sizing for *every* element at once. A page where body text, captions, labels, buttons, borders, and avatars all ride independent slopes reads as gelatinous and unstable. Pick the axes that matter (headings, section spacing, grid columns) and keep functional text steady.

## How it works

The underlying mechanism is the same in all three domains: `clamp(MIN, yIntercept + slope * viewport, MAX)`. The preferred term is a straight line — you pick two (size, viewport) anchor points, solve for slope and y-intercept, and the browser smoothly tracks between them.

**Type scale:** Compute one `clamp()` per step of your modular scale. Express `MIN`/`MAX` in `rem` so zoom works. Store as custom properties (`--step-0` through `--step-5`).

**Space scale:** Drive margin, padding, and gap from the same arithmetic. Utopia's approach anchors the space scale to the type scale: the `--step-0` value becomes the `S` (small) space, and you multiply up/down from it (`S`, `M = S * 1.5`, `L = S * 2`, `XL = S * 3`). Because `--step-0` is already a fluid clamp, every space inherits fluidity automatically.

**Fluid grid:** Use `grid-template-columns: repeat(auto-fit, minmax(MIN, 1fr))`. The browser fills as many columns as fit at `MIN` width, wrapping naturally. No column-count media queries. Add fluid `gap` with a clamp so inter-cell spacing also scales. For a stricter upper bound on columns, wrap in a `max()` trick: `minmax(max(MIN, (100% - gap * N) / N), 1fr)` — though in practice naming the min column width and letting auto-fit decide is cleaner and more maintainable.

Key APIs:
- `clamp(min, preferred, max)` — the workhorse; `min()` and `max()` compose for more complex ranges.
- `vw`, `svw`, `dvw` — the fluid driver. Use `dvw` (dynamic viewport) on content that appears after mobile browser chrome settles; `svw` for top-of-fold. Plain `vw` is fine for type scales where chrome-resize jitter is imperceptible.
- `cqi` — container query inline unit (1cqi = 1% of the nearest container's inline size). Swap `vw` for `cqi` on components inside sidebars or bento cells so they respond to their actual container, not the page.
- CSS custom properties — the carrier for a shared scale; one edit re-tunes everything.
- `repeat(auto-fit, minmax())` — the fluid grid primitive; achieves breakpointless column wrapping.

## Working code

### Native CSS — a unified fluid system (type + space + grid)

Self-contained, runs without dependencies. Resize the browser window to see all three axes interpolate simultaneously.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fluid everything</title>
<style>
  /* ============================================================
     FLUID SCALE — endpoints: 360px (22.5rem) → 1280px (80rem)
     All clamp values hand-computed: slope = (max-min)/(W2-W1),
     intercept = min - slope*W1, preferred = intercept_rem + slope*100 vw.
     MAX / MIN <= 2.5 on all type steps to preserve 200% zoom (WCAG 1.4.4).
     Spacing inherits fluidity from --step-0 via multiplication.
  ============================================================ */
  :root {
    /* — Type scale (ratio ~1.25 minor third) — */
    --step--1: clamp(0.8rem,   0.7396rem + 0.2674vw, 0.9rem);
    --step-0:  clamp(1rem,     0.9245rem + 0.3342vw, 1.125rem);
    --step-1:  clamp(1.25rem,  1.1386rem + 0.4938vw, 1.4063rem);
    --step-2:  clamp(1.5625rem,1.3932rem + 0.7523vw, 1.7578rem);
    --step-3:  clamp(1.9531rem,1.6993rem + 1.1274vw, 2.1973rem);
    --step-4:  clamp(2.4414rem,2.0671rem + 1.6608vw, 2.7466rem);
    --step-5:  clamp(3.0518rem,2.5184rem + 2.3711vw, 3.4332rem);

    /* — Space scale — anchored to --step-0 so it auto-inherits fluidity.
         Each value is a fixed multiplier; the browser resolves the clamp. — */
    --space-xs:  calc(var(--step-0) * 0.5);
    --space-s:   var(--step-0);
    --space-m:   calc(var(--step-0) * 1.5);
    --space-l:   calc(var(--step-0) * 2.5);
    --space-xl:  calc(var(--step-0) * 4);
    --space-2xl: calc(var(--step-0) * 6);

    /* — Layout — */
    --grid-min-col: 18rem;          /* minimum column width before wrapping */
    --grid-gap: clamp(1rem, 0.8rem + 0.8889vw, 1.5rem);
    --content-max: 72rem;
    --section-gap: clamp(3rem, 1.5rem + 6.6667vw, 6rem);

    color-scheme: light dark;
  }

  /* Reset & base */
  *, *::before, *::after { box-sizing: border-box; margin: 0; }

  body {
    font-family: "General Sans", "Inter", system-ui, sans-serif;
    font-size: var(--step-0);
    line-height: 1.65;
    background: #f5f3ef;
    color: #1a1917;
    /* fluid site padding: tight on phone, generous on desktop */
    padding-inline: clamp(1rem, 0.4rem + 2.6667vw, 2.5rem);
  }
  @media (prefers-color-scheme: dark) {
    body { background: #111110; color: #e8e4de; }
    .card { background: #1d1c1a; border-color: #2e2c28; }
    figcaption { color: #a09e99; }
  }

  /* Wrapper */
  .site-content {
    max-width: var(--content-max);
    margin-inline: auto;
    display: grid;
    row-gap: var(--section-gap);
    padding-block: var(--space-xl);
  }

  /* — Typography — */
  .display {
    font-size: var(--step-5);
    line-height: 1.05;
    letter-spacing: -0.025em;
    font-weight: 700;
    max-width: 18ch;
  }
  h2 {
    font-size: var(--step-3);
    line-height: 1.15;
    letter-spacing: -0.015em;
    font-weight: 700;
    margin-block-end: var(--space-s);
  }
  h3 {
    font-size: var(--step-1);
    line-height: 1.25;
    font-weight: 600;
    margin-block-end: var(--space-xs);
  }
  p { max-width: 66ch; }
  .lead {
    font-size: var(--step-1);
    line-height: 1.5;
    max-width: 54ch;
    color: #4a4743;
  }
  @media (prefers-color-scheme: dark) {
    .lead { color: #8f8c87; }
  }
  figcaption {
    font-size: var(--step--1);
    font-family: ui-monospace, "SF Mono", "Cascadia Code", monospace;
    letter-spacing: 0.04em;
    color: #6b6460;
    margin-block-start: var(--space-xs);
  }

  /* — FLUID GRID — auto-fit, no breakpoints — */
  .fluid-grid {
    display: grid;
    /* As many columns as fit above --grid-min-col; each stretches to fill. */
    grid-template-columns: repeat(auto-fit, minmax(var(--grid-min-col), 1fr));
    gap: var(--grid-gap);
  }

  .card {
    background: #fff;
    border: 1px solid #e2ddd8;
    border-radius: clamp(0.5rem, 0.25rem + 1.1111vw, 1rem);
    padding: var(--space-m);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  /* — Section spacing — */
  .section-header {
    display: grid;
    gap: var(--space-s);
    margin-block-end: var(--space-l);
  }

  /* — Hero layout — */
  .hero {
    display: grid;
    gap: var(--space-m);
    align-items: start;
  }

  .tag {
    display: inline-block;
    font-size: var(--step--1);
    font-family: ui-monospace, "SF Mono", monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #7a6f5e;
    border: 1px solid currentColor;
    border-radius: 999px;
    padding: 0.25em 0.75em;
  }
  @media (prefers-color-scheme: dark) {
    .tag { color: #9a8f7e; }
  }
</style>
</head>
<body>
  <main class="site-content">

    <!-- Hero: fluid display type + fluid lead + fluid padding -->
    <section class="hero">
      <span class="tag">Field notes / 09</span>
      <h1 class="display">Scale that fits the space it's given.</h1>
      <p class="lead">
        A single set of custom properties — one line each for type, space, and grid —
        drives this whole page. Shrink the window to 360px; expand to 1600px.
        No breakpoint fires. The math does the work.
      </p>
    </section>

    <!-- Grid section: fluid grid, fluid gap, fluid card padding -->
    <section>
      <div class="section-header">
        <h2>Three tools, one system</h2>
        <p>Each card is exactly 18rem wide or wider, with as many columns as the
           container allows. The gap and the card padding scale on the same slope.</p>
      </div>

      <div class="fluid-grid">
        <article class="card">
          <h3>Fluid type</h3>
          <p>Seven steps from caption to display, each a <code>clamp()</code> between
             its phone and desktop size. All stored as custom properties.</p>
          <figcaption>--step-0 through --step-5</figcaption>
        </article>

        <article class="card">
          <h3>Fluid space</h3>
          <p>XS through 2XL inherit fluidity from <code>--step-0</code>.
             Edit one floor value; every margin and gap re-tunes automatically.</p>
          <figcaption>--space-xs through --space-2xl</figcaption>
        </article>

        <article class="card">
          <h3>Fluid grid</h3>
          <p><code>auto-fit</code> with <code>minmax(18rem, 1fr)</code> fills columns
             continuously. No column-count queries, no wrapping bugs.</p>
          <figcaption>repeat(auto-fit, minmax(...))</figcaption>
        </article>

        <article class="card">
          <h3>One set of endpoints</h3>
          <p>Everything interpolates between 360px and 1280px. Change those two
             numbers once and the whole visual rhythm shifts proportionally.</p>
          <figcaption>minVp: 360px · maxVp: 1280px</figcaption>
        </article>
      </div>
    </section>

    <!-- Typography sample -->
    <section>
      <div class="section-header">
        <h2>The scale in context</h2>
      </div>
      <p>Body copy stays at a fixed <code>--step-0</code> so line length stays
         predictable. Only headings and display type ride a steeper slope — the visual
         hierarchy grows more dramatic on large screens without body text feeling
         oversized on small ones.</p>
    </section>

  </main>
</body>
</html>
```

### Container-relative variant — fluid type inside a bento cell

When a component lives inside a sidebar or bento grid, `vw` tracks the wrong thing. Swap it for `cqi` so the type responds to the component's actual container width. Requires an ancestor with `container-type: inline-size`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Container-relative fluid type</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; }
  body {
    font-family: system-ui, sans-serif;
    background: #f0ece6;
    color: #1a1917;
    padding: 2rem;
    display: grid;
    /* Two columns of different widths: demonstrates fluid type adapting per cell */
    grid-template-columns: 1fr 2fr;
    gap: 1.5rem;
  }

  /* Establish a container so cqi works */
  .cell {
    container-type: inline-size;
    background: #fff;
    border: 1px solid #ddd9d3;
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  /*
    cqi-based fluid type: 1cqi = 1% of the nearest container's inline size.
    Slope/intercept math:
      min 1rem at container 200px, max 2rem at container 600px
      slope = (2-1)/(600-200) = 0.0025 per px  →  0.25cqi (per 100px = 1%)
      intercept = 1 - 0.0025*200 = 0.5rem
    Guard with @supports to avoid cqi being silently ignored in older browsers.
  */
  .cell-title {
    font-size: 1.25rem; /* fallback for browsers without cqi support */
    line-height: 1.15;
    font-weight: 700;
    margin-block-end: 0.75rem;
  }

  @supports (font-size: 1cqi) {
    .cell-title {
      /* clamp: minimum 1rem, ride the slope, cap at 2rem */
      font-size: clamp(1rem, 0.5rem + 2.5cqi, 2rem);
    }
  }

  .cell p { font-size: 0.9375rem; line-height: 1.6; }
</style>
</head>
<body>
  <div class="cell">
    <h2 class="cell-title">Narrow column — smaller headline</h2>
    <p>The same <code>.cell-title</code> class. The container is narrower so
       the font resolves smaller via <code>cqi</code>.</p>
  </div>
  <div class="cell">
    <h2 class="cell-title">Wide column — larger headline</h2>
    <p>The class is identical. The wider container resolves a larger font size.
       No media queries. No component duplication.</p>
  </div>
</body>
</html>
```

**Browser support note for `cqi`:** Container query units have shipped in Chrome 105+, Safari 16+, Firefox 110+ (all 2022–2023). The `@supports (font-size: 1cqi)` guard provides a clean fixed-size fallback for older browsers. As of mid-2026, global support sits above 95% per MDN Baseline.

## Variations

- **Viewport-driven (vw)** vs **container-driven (cqi)**: The knob is which fluid driver the preferred term uses. `vw` is correct for page-level headings and section spacing. `cqi` is correct for components inside sidebars, bento grids, or card stacks where the component's container is narrower than the page. Mix both within one design system — they compose cleanly.
- **Anchored space scale vs independent space scale**: The Utopia approach (space inherits from `--step-0`) keeps type and space in lockstep. An independent space scale (each `--space-*` has its own hand-computed clamp) gives finer control at the cost of more tokens to maintain. Use the anchored approach for most projects; hand-compute space steps only where type and space intentionally diverge (e.g., a tight-spacing data-dense table that lives alongside display headings).
- **Fixed body / fluid headings only**: The gentlest application. Keep `--step-0` (body) at a flat `1rem`. Let `--step-2` through `--step-5` (headings, display) carry all the scaling. This is the right default for apps and long-form reading where body-text stability matters.
- **Fluid max-width**: Apply a `clamp()` to the `max-width` of a content wrapper (e.g., `max-width: clamp(40rem, 90vw, 72rem)`) so the text measure tightens on ultrawide monitors without a hard cutoff that feels abrupt. The knob is the max end of the clamp.
- **Fluid section gap**: `gap` and `margin-block` between sections benefit from a steeper slope than type (type changes ~20–40%; section gaps may need to grow 50–100% between mobile and desktop). Author a separate set of "section-spacing" tokens with a wider ratio, or use Utopia's "space pairs" (e.g., `S → L` space pair, which interpolates from the S value on mobile to the L value on desktop).
- **Tailwind integration**: The `fluid.tw` plugin generates fluid utility classes from `clamp()`. Syntax: `~text-lg/2xl` scales between those Tailwind size steps. Built-in WCAG 1.4.4 compliance checks for type by default. The constraint: all values must share the same unit (`rem`), mixed units (`rem`+`px`) break the generator.

## Accessibility

### Zoom / WCAG 1.4.4 Resize Text (AA) — the headline caveat

`clamp()` with viewport units does not scale during browser zoom because `vw` is always relative to the physical viewport width, not the zoomed viewport. The fix is two-part:

1. Express `MIN` and `MAX` in `rem` (anchored to the user's root font size), never in `px`. A user who has set 20px as their browser default font gets 25% larger floors and ceilings automatically.
2. Keep `MAX / MIN <= 2.5` for any text property. At that ratio, a user zooming to 200% via browser zoom will find that the effective rendered size still reaches 200% of the unzoomed value in practice on modern engines (verified by Smashing Magazine's 2023 analysis). Exceeding 2.5× risks locking users out of their needed zoom level.

The working code above obeys both rules. The largest step, `--step-5`, is `clamp(3.0518rem, ..., 3.4332rem)` — a ratio of `3.4332 / 3.0518 ≈ 1.12`, well within the safe zone.

Container query units (`cqi`) handle zoom more gracefully than `vw` because the container's computed size responds to zoom. Prefer `cqi` for components where zoom compliance is a concern.

### prefers-reduced-motion

Fluid type and spacing are static CSS; nothing animates and this media query is not triggered by pure `clamp()` sizing. However, if you pair fluid values with scroll-driven animations or transitions (e.g., a sticky nav that changes `font-size` on scroll), you must respect this preference:

```css
/* Only if you transition fluid values — e.g., a collapsing header */
@media (prefers-reduced-motion: reduce) {
  .collapsing-header {
    transition: none;
  }
}
```

### Contrast

Fluid sizing changes dimensions, not color. Verify contrast at the *smallest* rendered size because a heading large enough for large-text rules (>=24px / >=18.7px bold) on desktop may shrink below that threshold on a 360px phone and then requires the stricter 4.5:1 body-text ratio. The code above uses `#1a1917` on `#f5f3ef`. That pair computes to approximately 14.9:1 contrast (dark text on near-white), passing both thresholds at every size in the scale.

### Touch targets

If you apply fluid sizing to buttons or interactive controls, ensure the `MIN` still resolves to >= 44px height (WCAG 2.5.5 AAA, broadly recommended) or at minimum the 24px WCAG 2.2 Target Size (AA) at the narrowest viewport. A fluid `padding` that shrinks to near-zero on a 360px phone defeats its own purpose.

### Pointer / touch fallback

Fluid values are purely CSS; no hover or pointer logic is involved. No `@media (hover: hover)` guard is needed for the layout itself.

### Screen readers

`clamp()` affects only rendered dimensions. It has no effect on the accessibility tree, reading order, or ARIA semantics.

## Performance

- **Zero runtime cost.** `clamp()` resolves at style-recalculation time, the same pass where `font-size: 1rem` is resolved. There is no JS, no scroll listener, no `requestAnimationFrame`.
- **Resize reflow** — values recompute on viewport resize, which is a layout recalc you already pay for. Fluid values add negligible overhead compared to a page with fixed sizes, because the number of style operations is identical.
- **Custom property chains** — deep chains of `calc(var(--step-0) * 2.5)` are resolved by the browser's style engine. On very large DOMs (10k+ nodes) with many custom property lookups per node, this can add measurable style-recalc time. Prefer precomputed `clamp()` strings for high-frequency properties. The space scale above uses one level of `calc()` from a single `--step-0`; that is cheap.
- **`auto-fit`/`minmax` grids** — layout-trigger, resolved once per reflow. No special performance concern beyond normal grid layout.
- **No GPU layers** are created by fluid type or spacing. No `will-change` is needed or appropriate here.
- **Bundle cost** — zero for the native approach. SCSS generators (Utopia SCSS, fluid-tailwindcss) run at build time and ship zero runtime code.

## Anti-slop

**The TYPE cliche (see `_slop-blocklist.md` → Type):** Setting Inter or Roboto for everything at a flat size ramp that barely changes between phone and desktop — two media-query font sizes that snap awkwardly at 768px. Alternatively, the opposite extreme: fluid sizing on *every* element simultaneously so the page feels gelatinous, with body copy, captions, and labels all riding independent slopes.

**The LAYOUT cliche (see `_slop-blocklist.md` → Layout):** A centered 800px column with equal padding that feels identical on every screen and never uses the available space at 1400px+ or breathes at 375px.

**The tasteful alternative:** Apply fluid scaling selectively and intentionally. Make display and heading type fluid with a real modular ratio (1.25 or 1.333) so hierarchy *grows* on large screens. Keep body copy flat. Drive section spacing from a fluid space scale so content breathes at the macro level. Let the grid decide its own column count via `auto-fit`. The result is a design that feels *designed* at every viewport rather than *stretched* — because the proportional relationships are maintained by the math, not coincidence. Use a characterful typeface (General Sans, Fraunces, Instrument Serif, Satoshi) rather than defaulting to Inter; fluid sizing is wasted on a face with no personality at large sizes.

## Pairs well with

- **`fluid-type-clamp`** — the slope/intercept math, the SCSS generator pattern, and the Utopia calculator are documented there; start there for the arithmetic fundamentals.
- **`container-queries`** — switch from `vw` to `cqi` for components inside sidebars, bento cells, or cards, so they respond to their actual space. The two approaches compose: page-level spacing uses `vw`, component-level uses `cqi`.
- **`modular-type-scales`** — fluid `clamp()` is the delivery mechanism for a modular scale; pick a ratio (1.2, 1.25, 1.333) and make each step a clamp between its phone and desktop target.
- **`bento-grid`** — a fluid `auto-fit` grid is the structural backbone of a bento layout; fluid type inside each cell is the natural complement.
- **`variable-fonts`** — pair fluid size with fluid `font-weight` via `font-variation-settings` so a display heading grows heavier as it grows larger, reinforcing hierarchy on two axes simultaneously.
- **`design-tokens`** — fluid custom properties are tokens; storing them in `:root` and consuming them throughout a component system is the design-token pattern applied to responsive foundations.

## Current references

- [clamp() - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) - canonical syntax reference, `min(max())` equivalence, and browser baseline table.
- [Fluid space calculator - Utopia](https://utopia.fyi/space/calculator/) - generate a full fluid space palette (XS–2XL) from your type scale's step-0 and chosen viewport endpoints.
- [Painting with a fluid space palette - Utopia](https://utopia.fyi/blog/painting-with-a-fluid-space-palette/) - the design rationale for anchoring space to type and using t-shirt naming for team communication.
- [Fluid Everything Else - CSS-Tricks](https://css-tricks.com/fluid-everything-else/) - extends fluid math beyond type to positioning, sizing, and border-radius using container query units and simultaneous equations.
- [Contextual Spacing For Intrinsic Web Design - Modern CSS Solutions](https://moderncss.dev/contextual-spacing-for-intrinsic-web-design/) - practical patterns for `clamp()` padding using percentages, `vmax` for gap, and `min()` for block margins.
- [Container Query Units and Fluid Typography - Modern CSS Solutions](https://moderncss.dev/container-query-units-and-fluid-typography/) - the `vw` → `cqi` swap, the `@supports` guard pattern, and the custom-property quirk that can silently destroy type hierarchy.
- [Addressing Accessibility Concerns With Using Fluid Type - Smashing Magazine](https://www.smashingmagazine.com/2023/11/addressing-accessibility-concerns-fluid-type/) - the WCAG 1.4.4 failure mode, the 2.5× ratio rule, and practical testing approaches.
- [Auto-Sizing Columns in CSS Grid: auto-fill vs auto-fit - CSS-Tricks](https://css-tricks.com/auto-sizing-columns-css-grid-auto-fill-vs-auto-fit/) - the definitive comparison of the two grid keywords; explains when each collapses empty tracks.
- [Building a UI Without Breakpoints - Frontend Masters Blog](https://frontendmasters.com/blog/building-a-ui-without-breakpoints/) - synthesizes fluid grid, clamp, and container queries into a coherent "intent-driven" responsive strategy and explains when breakpoints still belong.
- [Fluid for Tailwind CSS (fluid.tw)](https://fluid.tw/) - Tailwind plugin that generates clamp-based utilities with WCAG 1.4.4 checks built in; `~text-lg/2xl` syntax.
- [Reimagining Fluid Typography - OddBird](https://www.oddbird.net/2025/02/12/fluid-type/) - 2025 rethink of fluid type defaults and the growing case for container units over viewport units.
