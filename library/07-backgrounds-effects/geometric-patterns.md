# Geometric patterns

> CSS-only repeating tiled backgrounds — grids, dots, stripes, checks, and conic pie slices — built entirely from `repeating-linear-gradient`, `repeating-radial-gradient`, and `repeating-conic-gradient` without a single image request.

**Bucket:** visual style
**Maturity:** evergreen
**Effort:** low
**Best for:** portfolios, websites, dashboards, apps

## What it is

The browser paints a tiny mathematical tile and repeats it seamlessly across the entire element via `background-size` + `background-repeat`. Because gradients are resolution-independent vectors calculated at render time, they scale perfectly on high-DPI screens and produce no HTTP requests. The perceivable result is a structured surface — a blueprint grid behind a dashboard, a subtle dot matrix on a landing page, diagonal stripes on an error state, or a conic checkerboard on a design-focused portfolio — that gives depth without photography or illustration.

## When to use

- You need a structural surface texture (grid, dot, stripe) that is purely decorative and must scale to any viewport density.
- Dashboard and data-product UIs where a faint grid communicates precision and system-thinking without distracting from the data.
- Portfolio and agency hero sections where a dot or line pattern references a technical or architectural aesthetic.
- Dividers, empty states, cards, or section backgrounds that need visual interest with zero asset overhead.
- Dark-mode contexts where subtle patterns prevent flat black from reading as a broken layout.

## When NOT to use

- Behind body text or dense UI copy — even a 5 % opacity grid raises the effective background luminance unevenly, disrupting WCAG contrast for the overlaid text and making long reads fatiguing.
- When the pattern competes with a primary image or illustration — two visual systems in the same zone cancel each other.
- As the primary brand differentiator on a site targeting non-technical audiences; dot grids and blueprint lines read as developer-tool aesthetic and can alienate consumer audiences.
- Overuse warning: dot-grid-on-dark-hero is the 2024–2025 SaaS default. Reached saturation; every AI-generated landing page uses it. If the project already has five competitors with identical patterns, the pattern is now noise rather than signal.

## How it works

CSS gradient functions return an `<image>` value that behaves exactly like a raster file assigned to `background-image`. Two properties control tiling:

- `background-size` — sets the width × height of one tile (e.g. `24px 24px`).
- `background-repeat` — defaults to `repeat`, which tiles the tile edge-to-edge in both axes. Use `round` to stretch tiles so they always fit exactly; use `space` to pad them evenly.

Because the gradient is calculated fresh inside each tile, you never get seams or edge artifacts as long as the gradient fills its tile cleanly.

**The five key functions:**

| Function | Output |
|---|---|
| `repeating-linear-gradient(angle, …stops)` | Infinite striped bands at any angle |
| `repeating-radial-gradient(…stops)` | Concentric circular rings |
| `repeating-conic-gradient(from angle, …stops)` | Pie-slice segments rotated around a center |
| `linear-gradient` + `background-size` | One-tile grid lines (two separate declarations, layered) |
| `radial-gradient` + `background-size` | One-tile dot (single dot per tile, repeat handles the grid) |

**Layering:** `background-image` accepts a comma-separated list. Earlier values sit on top. This is how a horizontal-line gradient and a vertical-line gradient combine into a crossed grid — each covers its own axis, both share the same `background-size`.

**Hard stops:** `color A 50%, color B 50%` (adjacent, identical position) produces a crisp edge rather than a blend. This is the fundamental trick for stripes, checks, and tile edges.

**Anti-aliasing note:** a 1 px line at certain `background-size` values can look blurry on non-integer device pixel ratios. Use `1.5px` for hairlines or opt for `0.5px` with a `@media (-webkit-min-device-pixel-ratio: 2)` override.

## Working code

### Complete demo — five patterns in one page

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Geometric patterns — CSS reference</title>
  <style>
    /* ── Reset & tokens ─────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; }

    :root {
      --ink:      #0f172a;   /* slate-900  */
      --ink-mid:  #334155;   /* slate-700  */
      --surface:  #f8fafc;   /* slate-50   */
      --line:     rgba(15, 23, 42, 0.10);   /* ink @ 10% */
      --dot:      rgba(15, 23, 42, 0.15);   /* ink @ 15% */
      --stripe-a: #f1f5f9;   /* slate-100  */
      --stripe-b: #e2e8f0;   /* slate-200  */
      --blue:     #1e3a5f;   /* blueprint  */
      --blue-dim: rgba(30, 58, 95, 0.12);
    }

    body {
      font-family: ui-monospace, "JetBrains Mono", Menlo, monospace;
      background: var(--surface);
      color: var(--ink);
      padding: 2rem;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
      gap: 1.5rem;
    }

    /* ── Card shell ─────────────────────────────────────────── */
    .card {
      border-radius: 0.5rem;
      border: 1px solid var(--stripe-b);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .pattern-area {
      height: 11rem;
      position: relative;
    }

    .card-label {
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--ink-mid);
      border-top: 1px solid var(--stripe-b);
      background: #fff;
    }

    /* ── 1. Blueprint grid ───────────────────────────────────── */
    .pattern-blueprint {
      background-color: #eaf1fb;
      background-image:
        linear-gradient(var(--blue-dim) 1px, transparent 1px),
        linear-gradient(90deg, var(--blue-dim) 1px, transparent 1px),
        linear-gradient(rgba(30, 58, 95, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(30, 58, 95, 0.05) 1px, transparent 1px);
      background-size:
        100px 100px,
        100px 100px,
        20px  20px,
        20px  20px;
    }

    /* ── 2. Dot grid ─────────────────────────────────────────── */
    .pattern-dots {
      background-color: var(--surface);
      background-image: radial-gradient(
        circle,
        var(--dot) 1.5px,
        transparent 1.5px
      );
      background-size: 20px 20px;
    }

    /* ── 3. Diagonal stripes ────────────────────────────────── */
    .pattern-stripes {
      background-color: var(--stripe-a);
      background-image: repeating-linear-gradient(
        -45deg,
        var(--stripe-b) 0px,
        var(--stripe-b) 2px,
        transparent 2px,
        transparent 14px
      );
    }

    /* ── 4. Checkerboard (conic) ─────────────────────────────── */
    .pattern-check {
      background:
        conic-gradient(
          #d1d5db 0.25turn,
          #f9fafb 0.25turn 0.5turn,
          #d1d5db 0.5turn 0.75turn,
          #f9fafb 0.75turn
        )
        top left / 28px 28px repeat;
    }

    /* ── 5. Graph-paper (fine + major lines) ─────────────────── */
    .pattern-graph {
      background-color: #fff;
      background-image:
        linear-gradient(rgba(99, 102, 241, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99, 102, 241, 0.08) 1px, transparent 1px),
        linear-gradient(rgba(99, 102, 241, 0.18) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99, 102, 241, 0.18) 1px, transparent 1px);
      background-size:
        8px  8px,
        8px  8px,
        40px 40px,
        40px 40px;
    }

    /* ── Overlay label inside pattern area ───────────────────── */
    /* Text must clear WCAG 4.5:1 against its specific background.
       Computed below in Accessibility section. */
    .pattern-area::after {
      content: attr(data-label);
      position: absolute;
      bottom: 0.75rem;
      right: 0.75rem;
      font-size: 0.65rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 0.2em 0.45em;
      border-radius: 0.2em;
      background: rgba(255,255,255,0.85);
      color: var(--ink);         /* #0f172a on rgba(255,255,255,0.85) */
      backdrop-filter: blur(4px);
    }

    /* ── prefers-reduced-motion ─────────────────────────────── */
    /* These patterns are static; no animation is present.
       The rule below is included as a guard for any future
       background-position animation added to the patterns. */
    @media (prefers-reduced-motion: reduce) {
      .pattern-area {
        animation: none !important;
        transition: none !important;
      }
    }
  </style>
</head>
<body>

  <div class="card">
    <div class="pattern-area pattern-blueprint" data-label="Blueprint grid" role="img" aria-label="Blueprint grid pattern — decorative"></div>
    <p class="card-label">Blueprint grid — major 100 px, minor 20 px</p>
  </div>

  <div class="card">
    <div class="pattern-area pattern-dots" data-label="Dot grid" role="img" aria-label="Dot grid pattern — decorative"></div>
    <p class="card-label">Dot grid — radial-gradient, 20 px pitch</p>
  </div>

  <div class="card">
    <div class="pattern-area pattern-stripes" data-label="Diagonal stripes" role="img" aria-label="Diagonal stripe pattern — decorative"></div>
    <p class="card-label">Diagonal stripes — repeating-linear-gradient, −45 deg</p>
  </div>

  <div class="card">
    <div class="pattern-area pattern-check" data-label="Checkerboard" role="img" aria-label="Checkerboard pattern — decorative"></div>
    <p class="card-label">Checkerboard — conic-gradient, 28 px tile</p>
  </div>

  <div class="card">
    <div class="pattern-area pattern-graph" data-label="Graph paper" role="img" aria-label="Graph paper pattern — decorative"></div>
    <p class="card-label">Graph paper — 8 px fine + 40 px major indigo lines</p>
  </div>

</body>
</html>
```

### Animated background-position (marching stripes — reduced-motion safe)

The only safe animation for tiled backgrounds is `background-position` shift, which composites on the GPU and triggers no layout or paint recalculation.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Animated stripe — reduced-motion safe</title>
  <style>
    :root { --stripe-size: 40px; }

    .marching {
      width: 100%;
      height: 6rem;
      background-color: #0f172a;
      background-image: repeating-linear-gradient(
        -45deg,
        rgba(255,255,255,0.04) 0px,
        rgba(255,255,255,0.04) 1px,
        transparent 1px,
        transparent 20px
      );
      background-size: var(--stripe-size) var(--stripe-size);
      animation: march 3s linear infinite;
    }

    @keyframes march {
      to { background-position: var(--stripe-size) 0; }
    }

    /* Freeze the pattern for users who prefer reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .marching { animation: none; }
    }
  </style>
</head>
<body style="margin:0; background:#0f172a;">
  <!-- role="img" + aria-label: screen readers skip decorative background imagery;
       providing the role makes the intent explicit. -->
  <div class="marching" role="img" aria-label="Decorative animated stripe — decorative only"></div>
</body>
</html>
```

### Dark-mode aware dot grid (CSS custom properties)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    :root {
      --dot-color: rgba(15, 23, 42, 0.15);
      --bg: #f8fafc;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --dot-color: rgba(248, 250, 252, 0.12);
        --bg: #0f172a;
      }
    }
    .dot-surface {
      min-height: 100vh;
      background-color: var(--bg);
      background-image: radial-gradient(
        circle,
        var(--dot-color) 1.5px,
        transparent 1.5px
      );
      background-size: 20px 20px;
    }
  </style>
</head>
<body>
  <div class="dot-surface" role="presentation"></div>
</body>
</html>
```

## Variations

**Blueprint grid** — two perpendicular `linear-gradient` declarations sharing a `background-size`, colored in a desaturated blue. Add a second pair at a larger `background-size` (e.g. `100px` over `20px`) to produce minor + major gridlines. The defining knob is the ratio of major-to-minor line pitch.

**Dot grid** — `radial-gradient(circle, color 1.5px, transparent 1.5px)` with `background-size: 20px 20px`. Increase dot radius toward `4px` for bolder retro-computing feel; shrink pitch to `12px` for high-density textures. Toggle to `ellipse` instead of `circle` for oval dots.

**Diagonal / straight stripes** — `repeating-linear-gradient` at `0deg` (horizontal), `90deg` (vertical), `45deg` or `-45deg` (diagonal), or arbitrary angles. The stripe width is the distance between paired hard stops; the pitch is the total distance from first to last stop.

**Checkerboard (linear variant)** — four `linear-gradient` layers at `45deg`, `-45deg`, `45deg`, `-45deg` with staggered positions. More verbose than the conic approach but supported everywhere since 2015. The conic single-declaration version requires baseline 2020 support — both ship in all evergreen browsers as of 2024.

**Graph paper** — two pairs of perpendicular gradients at different opacities sharing an 8:1 size ratio (`8px` fine lines inside `40px` major lines). Use a brand hue at very low opacity (6–18 %) to color the lines without overwhelming content.

**Conic pie / starburst** — `repeating-conic-gradient(colorA 0deg 30deg, colorB 30deg 60deg)` for equal pie slices. Vary the angle units per slice to create unequal segments. `from <angle>` rotates the whole pattern.

**Plaid / tartan** — layer `repeating-linear-gradient` at `0deg` with a semi-transparent color over the same at `90deg` with a second color. Where they intersect, `background-blend-mode: multiply` produces the crossing color.

## Accessibility

**Decorative vs. informative:** Pure background patterns convey no semantic information. Apply them via `background-image` (not `<img>`) and mark the container with `role="img" aria-label="decorative"` only when the element has no other semantic role. If the element already has a meaningful role (e.g. a `<main>` landmark), no extra aria is needed — the pattern is invisible to screen readers as a CSS background.

**Contrast of overlaid text:** Text placed over a patterned background must meet WCAG 2.2 AA (4.5:1 for body text, 3:1 for large text ≥ 18 px / 14 px bold). The pattern's alternating luminance makes this hard to guarantee at a single ratio — test against the *lightest* tile color, not the average. In the Working code above:
- Blueprint pattern: background #eaf1fb, overlay label text #0f172a. Relative luminance: #eaf1fb ≈ 0.884, #0f172a ≈ 0.015. Contrast ratio ≈ **14.4:1** — passes AAA.
- Checkerboard: light tile #f9fafb ≈ 0.955, label #0f172a ≈ 0.009 → ≈ **17.1:1** passes AAA. Dark tile #d1d5db ≈ 0.663, label #0f172a → ≈ **12.1:1** passes AAA. Both tiles clear AA.

**Practical rule:** if the pattern has light and dark regions (stripes, checkerboard), test text contrast against the lightest region. If the lightest region is near-white, dark text on a semi-opaque white pill (as used in the code above — `background: rgba(255,255,255,0.85)`) is the reliable approach.

**prefers-reduced-motion:** Static geometric patterns are inherently motion-free. Any animated variant (e.g. `background-position` marching stripes) must freeze inside `@media (prefers-reduced-motion: reduce)`. The animated snippet above shows this explicitly.

**Touch / pointer fallback:** Patterns are passive surfaces with no interaction; no hover or pointer-specific behavior is applied here. If you add a cursor-spotlight glow over the pattern (a common combination), guard it with `@media (hover: hover) and (pointer: fine)` so mobile users never see a stuck glow state.

**Focus / keyboard:** No focus management needed for decorative backgrounds. If the patterned element is a card that itself is interactive, ensure the card's focus ring is visible against the pattern by using `outline-offset: 2px` and a high-contrast outline color.

## Performance

**Paint cost, not layout or composite:** CSS gradients are re-rasterized during the paint phase when the element repaints. A static tiled background on a non-animated, non-scrolling element paints once and is composited cheaply. The performance concern surfaces in two scenarios:

1. **Large area × many gradient layers:** Each additional gradient layer in `background-image` adds a paint pass over the same pixels. Blueprint grid uses four layers; this is fine. Avoid stacking eight or more gradient layers over full-viewport surfaces.

2. **Animating background colors:** Changing a gradient's colors forces a full repaint on every frame. Never animate color values inside a gradient directly (even with `@property` the rasterization still occurs). Animate `background-position` instead — it is a transform-equivalent for tiled patterns and composites on the GPU. The `@property` technique is most useful for animating the *angle* of a gradient without layout cost, not for tiled pattern animations.

**Scaling up `background-size`:** Larger tiles (e.g. `200px 200px`) reduce the number of tile-paint operations and can improve performance on very large surfaces. Prefer larger pitches at low opacity over smaller pitches at higher opacity.

**`will-change`:** Do not apply `will-change: background-position` to static patterns. Reserve it for the animated variant, and remove it after the animation ends if the element can transition to a static state.

**Mobile constraint:** Promoting many elements with `will-change` to GPU layers exhausts VRAM on low-memory devices. On a page with six patterned cards, none of which animate, use zero `will-change` declarations on the pattern surfaces.

**`background-repeat: round` vs `repeat`:** `round` recalculates the tile size so the pattern fits an integer number of tiles with no partial tile at the edge. This adds a fractional resize calculation per repaint but eliminates visible edge seams — useful when the container resizes dynamically (e.g. a resizable panel). For fixed-size surfaces, `repeat` is cheaper.

## Anti-slop

**The cliche (Surface bucket, see slop blocklist):** Dot grid (#e5e7eb dots, 16 px pitch) on `#0a0a0a` with a purple-to-pink aurora blob centered behind the H1. This combination is the 2024 SaaS default — it appears verbatim in thousands of AI-generated landing pages. The dot grid alone is not slop; the entire surface stack (dark bg + identical dot color + same pitch + aurora) is.

**The tasteful alternative:**
- Use the grid on a *light* surface (slate-50, warm white, or a tinted near-white) rather than dark — it is less saturated by overuse.
- Replace the generic gray dot (`#e5e7eb`) with a single-hue OKLCH-derived color matching your brand — e.g. `oklch(65% 0.12 240)` at 12 % opacity for a blue-tinted dot on a warm white card.
- Vary the pitch to match your spacing scale (24 px if your system uses 8 px increments × 3) so the pattern feels designed-in rather than pasted-on.
- Limit the pattern to one zone (a hero background, a sidebar, a blank-state card) rather than applying it to every surface on the page.
- Blueprint line grid on a light blue-tinted background (#eaf1fb) reads as a deliberate technical reference; the overused dot-on-black reads as generated defaults.

## Pairs well with

- **Noise / grain texture** (another 07-backgrounds-effects entry) — a CSS gradient grid at 8 % opacity underneath a 3 % SVG `feTurbulence` grain layer adds tactile depth without photography. The grain breaks the mathematical regularity of the grid, preventing the "too digital" read.
- **Glassmorphism / backdrop-filter cards** — a frosted card over a dot grid is a single "layered translucent moment" (as the slop blocklist allows) rather than glassmorphism on every surface.
- **Cursor spotlight glow** (07-backgrounds-effects) — a radial glow following the cursor over a blueprint grid creates the Vercel/Linear "interactive surface" effect. Guard with `@media (hover: hover) and (pointer: fine)`.
- **Editorial typographic** style — large, weighted display type (Geist, Instrument Serif) reads well against a restrained grid background because the pattern's regularity provides structure while the type provides hierarchy.
- **Color theme tokens** — binding `--line` and `--dot` colors to CSS custom properties makes the pattern automatically adapt to light/dark mode without JavaScript.

## Current references

- [MDN — repeating-linear-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/repeating-linear-gradient) — canonical syntax, color-stop mechanics, browser support (Baseline: widely available since July 2015)
- [MDN — conic-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/conic-gradient) — checkerboard example, pie/starburst patterns, support (Baseline: widely available since November 2020)
- [MDN — repeating-conic-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/repeating-conic-gradient) — starburst and repeating wedge patterns
- [MDN — Using CSS gradients](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_images/Using_CSS_gradients) — plaid layering, hard-stop stripes, stacked gradient pattern cookbook
- [Crafting grid and dot backgrounds with CSS — ibelick.com](https://ibelick.com/blog/create-grid-and-dot-backgrounds-with-css-tailwind-css) — production-ready `radial-gradient` dot and `linear-gradient` grid recipes with optional mask fade
- [CSS gradient patterns — cssgradient.io](https://cssgradient.io/blog/gradient-patterns/) — copy-paste code for stripes, chevrons, waves, and crosshatch patterns
- [CSS { In Real Life } — CSS halftone patterns](https://css-irl.info/css-halftone-patterns/) — advanced `radial-gradient` + `mask` + `filter: contrast()` halftone technique, 2024
- [CSS background animation avoiding high CPU usage — Medium / Iporaitech](https://medium.com/iporaitech/css-background-animation-avoiding-high-cpu-usage-58947ff50900) — performance case study: animating `background-position` on large surfaces caused 173 % CPU and 1,006 paint operations in 25 s; refactoring to `transform: translate()` on a separate layer dropped paints to 7 and CPU to 33 % (Hisa Ishibashi, 2019)
- [A CSS-based background grid generator — Stefan Judis](https://www.stefanjudis.com/blog/a-css-based-background-grid-generator/) — interactive generator for linear-gradient grid backgrounds, explains the `calc(100% - 1.5px)` border-edge trick
- [Vercel aesthetic: a complete guide to blueprint grid design — Setproduct](https://www.setproduct.com/blog/complete-guide-to-blueprint-grid-design) — design-system treatment of grid backgrounds covering opacity ranges, spacing scales, typography pairing, and CSS implementation; contextualises the trend within Swiss Design / Bauhaus systematic design history
- [Codrops CSS reference — repeating-linear-gradient](https://tympanus.net/codrops/css_reference/repeating-linear-gradient/) — visual pattern gallery with forked demos
