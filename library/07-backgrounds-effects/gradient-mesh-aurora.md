# Gradient mesh & aurora

> Layered, slow-drifting radial gradients blurred into an ambient color field — a background surface technique that creates atmospheric depth without competing with foreground content.

**Bucket:** visual style
**Maturity:** current
**Effort:** medium
**Best for:** websites, portfolios, dashboards, apps

## What it is

The effect simulates a painted color mesh by stacking multiple radial or conic gradients — each a differently-positioned color spotlight — and collapsing their hard edges with a large `filter: blur()`. The result is a smooth, luminous field where hues blend organically rather than banding in a linear sweep. Motion is added via slow `@keyframes` that shift `transform: translate()` or `background-position` on individual gradient blobs, evoking the drift of aurora borealis. A thin SVG `feTurbulence` noise layer is composited over the top to break up the remaining color banding that blur alone cannot eliminate.

The user perceives an ambient, living backdrop — warmly lit rather than sharply graphic — that recedes behind content rather than pulling focus.

## When to use

- Hero sections and above-the-fold surfaces where the page needs atmospheric richness but carries no body text directly on the effect.
- Dark-mode SaaS landing pages or portfolio covers where a single-hue bias establishes brand identity without a photographic image.
- Dashboard chrome and sidebar backgrounds where subtle warmth signals "active workspace" without distracting from data.
- Loading or empty states that need visual interest while content resolves.
- As a contained decorative zone (e.g., a card header band, an `<aside>` background) rather than a full-page wash.

## When NOT to use

- Behind body paragraphs or long-form copy — shifting color fields make reading work harder and WCAG contrast becomes unmeasurable across the gradient span.
- On content-dense UIs where every GPU layer competes with repaints from data updates (tables, live charts).
- As the *only* visual differentiator on a portfolio or landing page — this is the "aurora blob behind centered hero" cliche from the slop blocklist (Surface / effect). Use it as a supporting surface, not the concept.
- On pages targeting users with vestibular disorders — slow motion still triggers symptoms; the `prefers-reduced-motion` fallback must replace animation entirely, not just slow it down.
- When the design palette is already high-chroma and varied; adding a mesh gradient compounds visual noise rather than providing depth.

## How it works

Three mechanisms compose the effect:

**1. Gradient blobs (the mesh layer).** Absolutely-positioned `<div>` elements carry individual `radial-gradient()` values — each one a single hue bleeding to `transparent`. Stacking them in a clipping container with `overflow: hidden` creates the mesh. An alternative approach condenses all stops into a single `background` shorthand on one element, but separate elements allow independent motion.

**2. Blur collapse.** `filter: blur(80px)` or larger (adjust to the blob size — aim for the blur radius to be ~40–60% of the blob's diameter) merges the hard gradient edges into a seamless field. This blur is applied per-blob or to a group wrapper. Critically, blur does not run on the composited page — only on the isolated layer — so `isolation: isolate` on the container keeps it from blurring into sibling content.

**3. Noise overlay (banding killer).** A thin `<div>` or `::after` pseudo-element positioned over the mesh carries an SVG `<feTurbulence>` + `<feColorMatrix>` noise pattern with `mix-blend-mode: overlay` and low opacity (0.04–0.08). This scatters Perlin noise across the surface, disrupting the subtle color banding that survives blur. Use `type="fractalNoise"` for smoother grain; `baseFrequency` around `0.65`; `numOctaves="3"`. Set `stitchTiles="stitch"` so it tiles seamlessly. There are two delivery methods — choose one and use it consistently: (a) **Data URI** — inline the SVG as a `background-image` data URI on the overlay element; the browser rasterises it once and GPU-tiles the result (used in the code below, lowest per-frame cost); (b) **Inline SVG filter** — place a zero-dimension `<svg>` in the DOM, declare `<filter id="grain">` in its `<defs>`, then apply `filter: url(#grain)` to the overlay element; cleaner markup but re-runs the SVG filter pipeline on every repaint.

**4. Animation.** Each blob moves on its own `@keyframes` via `transform: translate(x, y)` — never `top`/`left` (layout thrash). Durations of 12–20 s with `ease-in-out` and `alternate` direction read as breathing rather than looping. Offset start times with `animation-delay` so blobs never move in unison.

**Key properties / APIs:**
- `filter: blur()` — per-element Gaussian blur; GPU-accelerated but triggers a stacking context
- `mix-blend-mode: screen | overlay | soft-light` — compositing blobs together for luminosity
- `isolation: isolate` — contains blend-mode scope to the aurora container
- SVG `<feTurbulence>` + `<feColorMatrix>` — Perlin noise generation, Baseline Widely Available (since 2015)
- CSS `@property` — registers a typed `<color>` custom property so the browser can interpolate between OKLCH values in a gradient (Baseline 2024, all modern browsers)
- `@keyframes` on `transform` + `opacity` — GPU-composited, no layout thrash
- `prefers-reduced-motion` — mandatory; static mesh with no animation

## Working code

### Native CSS + SVG (self-contained, no JS)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Gradient mesh aurora — demo</title>
  <style>
    /* ─── Reset & base ─── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100dvh;
      background: #0b0d14;
      color: #e8eaf2;
      font-family: system-ui, sans-serif;
      display: grid;
      place-items: center;
    }

    /* ─── Aurora container ─── */
    .aurora-wrap {
      position: relative;
      width: 100%;
      max-width: 900px;
      aspect-ratio: 16 / 7;
      overflow: hidden;
      border-radius: 1.5rem;
      isolation: isolate;          /* keeps blend modes from leaking out */
      background: #0b0d14;
    }

    /* ─── Blob base styles ─── */
    .blob {
      position: absolute;
      border-radius: 50%;
      mix-blend-mode: screen;      /* screen preserves luminosity, avoids blown-out white */
      will-change: transform;      /* hint for compositor; applied sparingly — only 3 blobs */
    }

    /* Blob 1: cool teal, top-left zone */
    .blob-1 {
      width: 55%;
      aspect-ratio: 1;
      top: -15%;
      left: -10%;
      background: radial-gradient(
        ellipse at center,
        oklch(55% 0.14 195) 0%,    /* teal core */
        transparent 70%
      );
      filter: blur(90px);
      opacity: 0.75;
      animation: drift-1 18s ease-in-out infinite alternate;
    }

    /* Blob 2: indigo-violet, right zone */
    .blob-2 {
      width: 50%;
      aspect-ratio: 1;
      top: 10%;
      right: -12%;
      background: radial-gradient(
        ellipse at center,
        oklch(50% 0.16 280) 0%,    /* indigo */
        transparent 70%
      );
      filter: blur(110px);
      opacity: 0.65;
      animation: drift-2 22s ease-in-out infinite alternate;
      animation-delay: -6s;        /* offset so blobs don't move together */
    }

    /* Blob 3: emerald accent, bottom-center */
    .blob-3 {
      width: 45%;
      aspect-ratio: 1;
      bottom: -20%;
      left: 25%;
      background: radial-gradient(
        ellipse at center,
        oklch(58% 0.13 160) 0%,    /* emerald */
        transparent 68%
      );
      filter: blur(100px);
      opacity: 0.55;
      animation: drift-3 16s ease-in-out infinite alternate;
      animation-delay: -11s;
    }

    /* ─── Noise overlay (banding killer) ─── */
    .aurora-noise {
      position: absolute;
      inset: 0;
      /* SVG feTurbulence noise via data URI */
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
      background-size: 200px 200px;   /* tile the noise */
      mix-blend-mode: overlay;
      opacity: 0.055;                 /* subtle: just enough to scatter banding */
      pointer-events: none;
      z-index: 2;
    }

    /* ─── Foreground content (contrast test) ─── */
    .aurora-content {
      position: relative;
      z-index: 3;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 2rem;
      text-align: center;
      /* Semi-opaque scrim: ensures text legibility over any gradient state.
         #0b0d14 at 60% over the brightest blob region (#0b0d14 = rgb(11,13,20)):
         Blended surface ≈ #1a1f2e; white text (#e8eaf2) on that is ~10:1 — WCAG AAA. */
      background: radial-gradient(
        ellipse 80% 60% at center,
        oklch(10% 0.01 240 / 0.55) 0%,
        transparent 80%
      );
    }

    .aurora-label {
      font-size: clamp(0.7rem, 1.5vw, 0.85rem);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: oklch(75% 0.08 195);    /* teal-tinted muted label */
      margin-bottom: 0.75rem;
    }

    .aurora-heading {
      font-size: clamp(1.5rem, 4vw, 2.75rem);
      font-weight: 700;
      line-height: 1.1;
      color: #e8eaf2;               /* near-white; contrast ≥10:1 on scrim surface */
      max-width: 16ch;
    }

    /* ─── Keyframe drifts — translate only, no layout thrash ─── */
    @keyframes drift-1 {
      from { transform: translate(0, 0) scale(1); }
      to   { transform: translate(6%, 8%) scale(1.08); }
    }
    @keyframes drift-2 {
      from { transform: translate(0, 0) scale(1); }
      to   { transform: translate(-5%, 6%) scale(0.94); }
    }
    @keyframes drift-3 {
      from { transform: translate(0, 0) scale(1); }
      to   { transform: translate(4%, -10%) scale(1.06); }
    }

    /* ─── prefers-reduced-motion: freeze all blobs, keep static mesh ─── */
    @media (prefers-reduced-motion: reduce) {
      .blob {
        animation: none;
        will-change: auto;
      }
    }
  </style>
</head>
<body>

  <div class="aurora-wrap" role="img" aria-label="Decorative aurora gradient background">

    <!-- Gradient blobs -->
    <div class="blob blob-1" aria-hidden="true"></div>
    <div class="blob blob-2" aria-hidden="true"></div>
    <div class="blob blob-3" aria-hidden="true"></div>

    <!-- Noise overlay -->
    <div class="aurora-noise" aria-hidden="true"></div>

    <!-- Foreground content — place UI here, never raw body text -->
    <div class="aurora-content">
      <p class="aurora-label">Infrastructure platform</p>
      <h1 class="aurora-heading">Deploy anywhere in under 90 seconds</h1>
    </div>

  </div>

</body>
</html>
```

### @property variant — animating OKLCH color stops (Baseline 2024)

This variant registers each blob's core color as a typed `<color>` property so the browser interpolates between OKLCH values through the correct color space, producing smooth hue arcs rather than a gray-muddy midpoint. Use it when you want the mesh to cycle through a palette rather than drift spatially.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Gradient mesh aurora — @property variant</title>
  <style>
    /* Register typed color custom properties so @keyframes can interpolate them */
    @property --aurora-a {
      syntax: "<color>";
      inherits: false;
      initial-value: oklch(55% 0.14 195);   /* teal */
    }
    @property --aurora-b {
      syntax: "<color>";
      inherits: false;
      initial-value: oklch(50% 0.16 280);   /* indigo */
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100dvh;
      background: #0b0d14;
      display: grid;
      place-items: center;
    }

    .aurora-property {
      position: relative;              /* required: scopes ::after to this element */
      width: min(800px, 92vw);
      aspect-ratio: 16 / 6;
      border-radius: 1.25rem;
      overflow: hidden;
      isolation: isolate;
      /* Single-element mesh: background layers, bottom-to-top */
      background:
        radial-gradient(ellipse 60% 80% at 20% 30%, var(--aurora-a), transparent 70%),
        radial-gradient(ellipse 55% 70% at 80% 60%, var(--aurora-b), transparent 70%),
        radial-gradient(ellipse 50% 60% at 55% 90%, oklch(58% 0.13 160), transparent 65%),
        #0b0d14;
      filter: blur(70px);
      animation: hue-shift 14s ease-in-out infinite alternate;
    }

    /* Animates --aurora-a and --aurora-b; browser interpolates in OKLCH */
    @keyframes hue-shift {
      from {
        --aurora-a: oklch(55% 0.14 195);   /* teal */
        --aurora-b: oklch(50% 0.16 280);   /* indigo */
      }
      to {
        --aurora-a: oklch(52% 0.15 230);   /* blue-teal */
        --aurora-b: oklch(53% 0.14 310);   /* blue-violet */
      }
    }

    /* Noise overlay via pseudo-element */
    .aurora-property::after {
      content: "";
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 200px 200px;
      mix-blend-mode: overlay;
      opacity: 0.06;
    }

    @media (prefers-reduced-motion: reduce) {
      .aurora-property {
        animation: none;
      }
    }
  </style>
</head>
<body>
  <div class="aurora-property"
       role="img"
       aria-label="Decorative aurora mesh gradient"></div>
</body>
</html>
```

Note: the `@property` variant requires both a `syntax` and `inherits` descriptor — omitting either invalidates the rule and the property falls back to an unregistered custom property (no interpolation). Browser support: Chrome 85+, Firefox 128+, Safari 16.4+ — all Baseline 2024.

## Variations

| Variant | The knob that changes |
|---|---|
| **Spatial drift** (default above) | Individual blobs translate on `transform`; colors are static; motion reads as depth |
| **Hue cycle** (`@property` variant) | Colors interpolate via typed custom properties; blobs are static; motion reads as time-of-day |
| **Conic mesh** | Replace radial with `conic-gradient()` on each blob; produces harder angular sweeps; more graphic, less organic |
| **Single-hue tonal** | All blobs share one OKLCH hue, varying only lightness (`oklch(45% 0.12 220)` to `oklch(65% 0.10 220)`); disciplined brand color without the rainbow tell |
| **Contained band** | Constrain `aurora-wrap` to a card header or page header strip (height 180–280 px) rather than full-bleed; effect reads as intentional accent rather than ambient wash |
| **Noise-heavy** | Raise grain opacity to 0.15–0.20 and use `mix-blend-mode: soft-light`; shifts from digital aurora to textured matte — pairs with analog/risograph aesthetics |
| **Static (no animation)** | Remove all `animation` declarations; reduces GPU cost to near zero; valid when motion budget is spent elsewhere on the page |

## Accessibility

**prefers-reduced-motion (mandatory for anything that moves):**
All `animation` declarations are wrapped in a negation query, meaning users with `prefers-reduced-motion: reduce` see a static mesh — same colors, no drift:

```css
/* Freeze all blob animations — static mesh is still decorative and tasteful */
@media (prefers-reduced-motion: reduce) {
  .blob {
    animation: none;
    will-change: auto; /* release compositor hint when not animating */
  }
  .aurora-property {
    animation: none;
  }
}
```

Do not simply slow the animation as an alternative — slow motion can still trigger vestibular symptoms. The fallback must be a fully static state.

**Contrast over gradient surfaces:**
WCAG 2.2 SC 1.4.3 requires 4.5:1 for normal text, 3:1 for large text (18 px+ or 14 px+ bold). Gradients create a variable surface — measure contrast at the lightest point of the gradient where text sits. The code above places a radial scrim (`oklch(10% 0.01 240 / 0.55)`) behind all foreground text. On the blended surface (~`#1a1f2e`), `#e8eaf2` (near-white) achieves approximately 10:1 contrast ratio — WCAG AAA. Verify your specific palette at [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) using color picker readings from the rendered element.

**Screen reader implications:**
The aurora container carries `role="img"` and `aria-label="Decorative aurora gradient background"`. All blob divs and the noise overlay carry `aria-hidden="true"`. If the surface is purely decorative (no text inside), use `role="presentation"` instead or omit `role` entirely and apply `aria-hidden="true"` to the whole container.

**Touch / pointer fallback:**
The aurora effect has no interactive states — no hover, no focus. It requires no pointer-based fallback. If a cursor-spotlight glow is layered on top (a common combination), wrap that enhancement in `@media (hover: hover) and (pointer: fine)` so it is skipped on touchscreens and stylus-only devices.

**Focus management:**
There are no focusable elements inside the aurora container. If the container itself is interactive (e.g. a linked card), ensure the focus ring is visible and contrasts against both the darkest and lightest possible gradient regions — a 2 px white outline with a 1 px dark offset works reliably.

## Performance

**Blur cost.** `filter: blur()` is GPU-accelerated but forces a new stacking context and triggers a paint. Three blobs each with a large blur radius are three separate GPU-composited layers. On integrated-GPU devices (most mobile) this is the dominant cost. Mitigate:
- Keep blur radius proportional to blob size; `blur(90px)` on a 400 px blob is gentler than `blur(90px)` on a 200 px blob.
- Use `overflow: hidden` on the container so blobs are clipped before compositing.

**will-change.** Applied only to the three animating blob elements, not the container. Remove it for static variants with `will-change: auto`. Excessive `will-change` increases GPU memory pressure — budget it.

**Animating `transform` only.** All drift animations use `transform: translate()` and `scale()`. This avoids layout recalculation and restricts work to the compositor thread. Never animate `top`/`left`/`width`/`height` on gradient layers.

**Background-position vs. transform.** Animating `background-position` on a multi-stop gradient background (the single-element approach) is more efficient than animating gradient color stops directly — but less efficient than `transform` on separate elements. Use separate blob elements when motion is a core feature; a single `background-position` animation when you need one fewer DOM node and the motion is minimal.

**`@property` color interpolation cost.** Animating a `<color>` typed custom property triggers style recalculation on each interpolated frame — this is heavier than `transform` but lighter than animating `background-image` directly. Test on target devices; consider the static variant for performance-sensitive contexts.

**Repaint scope.** `isolation: isolate` on the container limits blend-mode compositing to the aurora subtree. Without it, `mix-blend-mode: screen` on blobs composes against the entire page, expanding the repaint region.

**SVG noise filter.** A 200×200 px tiled SVG data URI costs essentially nothing — it is a raster tile painted once and GPU-tiled, not a per-frame filter calculation. Prefer this over applying `filter: url(#grain)` to a large element, which re-runs the SVG filter pipeline on every repaint.

## Anti-slop

The cliche version (from `_slop-blocklist.md`, Surface / effect): purple-indigo-to-pink aurora blob blasted across the full viewport behind a centered hero with body text sitting directly on it. This combines three blocklist entries simultaneously — the rainbow gradient tell, the aurora-behind-hero overuse, and the low-contrast glassmorphism pattern.

The tasteful alternative:
1. **Commit to one hue family.** Pick teal, or pick indigo, not both at full chroma. Use OKLCH to keep perceptual brightness uniform across stops (`oklch(55% 0.14 195)` to `oklch(52% 0.15 230)` is a disciplined teal-to-blue arc, not a rainbow sweep).
2. **Keep it below the fold or contained.** A card-header strip, a full-bleed hero behind a solid-color content panel, or a sidebar chrome treatment. Not behind paragraphs.
3. **One surface technique per page.** If you use aurora mesh, skip the glassmorphism cards and the cursor glow. Reserve translucency for one moment.
4. **Static or barely moving.** A 20-second drift at low amplitude is ambient. A 6-second saturated swirl is a screensaver.

## Pairs well with

- **`glassmorphism-card`** — one frosted-glass card floating over the aurora is the controlled use case the slop entry actually endorses; the mesh gives the translucency something to render against.
- **`noise-grain-texture`** — the grain overlay technique here overlaps; a dedicated noise entry covers static texture as a full surface treatment (not just banding suppression).
- **`cursor-spotlight-glow`** — a pointer-driven radial reveal composited over the static mesh; wrap in `@media (hover: hover) and (pointer: fine)`.
- **`backdrop-filter-glass`** — `backdrop-filter: blur()` on a content panel placed above the aurora creates depth separation and confirms the mesh is a background (not a midground object).
- **`single-hue-oklch-palette`** — constrain the blob hues to a single OKLCH hue ramp for a disciplined brand surface rather than the multi-hue default.

## Current references

- [MDN — `<feTurbulence>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feTurbulence) — attribute reference for `baseFrequency`, `numOctaves`, `type`, `stitchTiles`; Baseline Widely Available
- [MDN — CSS `@property`](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) — typed custom property syntax; Baseline 2024 (Chrome 85+, Firefox 128+, Safari 16.4+)
- [Grainy Gradients — CSS-Tricks](https://css-tricks.com/grainy-gradients/) — the canonical reference for SVG noise overlay to kill gradient banding; covers feTurbulence + CSS filter contrast technique
- [Grainy Gradients — Frontend Masters Blog](https://frontendmasters.com/blog/grainy-gradients/) — feDisplacementMap approach for banding suppression; explains why displacement preserves palette better than layered noise
- [Aurora UI: how to create with CSS — Albert Walicki](https://albertwalicki.com/blog/aurora-ui-how-to-create) — three implementation strategies (blurred shapes, radial gradients, blurred images); notes on Stripe-style aurora
- [Holograms, light-leaks and CSS-only shaders — Robb Owen](https://robbowen.digital/wrote-about/css-blend-mode-shaders/) — `mix-blend-mode: screen` vs `color-dodge` for aurora compositing; explains why `screen` preserves definition
- [CSS Gradient Performance — Hoverify](https://tryhoverify.com/blog/i-wish-i-had-known-this-sooner-about-css-gradient-performance/) — `transform` vs `background-position` vs color stop animation; `will-change` budget guidance
- [We can finally animate CSS gradient — DEV Community (Afif)](https://dev.to/afif/we-can-finally-animate-css-gradient-kdk) — `@property` gradient animation technique; explains the typed custom property requirement for interpolation
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — measure text contrast against specific gradient-sampled surface colors
