# Blur & glass surfaces

> `backdrop-filter: blur()` frosts the content behind a translucent panel, creating the illusion of frosted glass without touching the background itself.

**Bucket:** visual style
**Maturity:** current (cycling-back — peaked ~2021, refined through 2024–2026)
**Effort:** low (basic effect) to medium (accessible, performant, fallback-complete)
**Best for:** websites, portfolios, dashboards, apps

## What it is

A glass surface is a partially transparent element whose background is blurred and
optionally color-shifted using `backdrop-filter`. The user perceives a frosted-glass
pane floating above imagery or colorful content: edges are soft, forms behind are
legible in shape but not sharp. The effect requires real content beneath — a plain
solid background renders it invisible. This is the CSS implementation of the
glassmorphism aesthetic: layered translucency, soft light, and implied depth.

Glassmorphism (the design trend) combines backdrop-filter with a semi-transparent
fill, a thin border on one or two edges (simulating a glass edge), and often a
diffuse drop shadow. The filter and the fill are independent knobs and must both
be tuned to keep text on the surface WCAG-compliant.

## When to use

- A floating navigation bar, modal, or tooltip that should feel lightweight while
  the background communicates context (imagery, data visualization, live video).
- A card system over a rich hero image or gradient where you want depth without
  opaque blocking.
- Product/portfolio presentations where the background itself is part of the brand
  story — glass shows it through rather than hiding it.
- Dark-mode UIs where layered translucency communicates elevation more elegantly
  than flat fill.
- One deliberate focal surface per layout — the effect reads as an intentional
  design choice rather than a default when used sparingly.

## When NOT to use

- Body text containers. Text that users need to read at length must not sit over a
  visually active backdrop; even a well-blurred surface adds cognitive load across
  paragraphs.
- Every card in a grid. Applying glass to all cards simultaneously is the most
  common overuse pattern — the effect loses meaning, contrast becomes hard to
  guarantee across all states, and GPU cost stacks linearly (see Performance).
- Interfaces where the background behind the glass changes dynamically (video,
  live data, animated gradients behind body copy): readable contrast cannot be
  guaranteed at every frame.
- Low-powered mobile contexts or battery-sensitive scenarios. `backdrop-filter`
  forces a compositing layer and GPU draw passes that can triple GPU utilization
  on low-end hardware.
- Situations where a fallback-free experience is unacceptable. `backdrop-filter`
  was Baseline 2024 (newly available September 2024), but IE and pre-Chrome 76
  browsers will silently ignore it — design the fallback first.

## How it works

`backdrop-filter` instructs the browser to apply SVG-style filter functions to the
pixels that are rendered *behind* the element before compositing the element itself.
The element (or its `background`) must be partially transparent for the effect to
be visible; otherwise the backdrop is covered entirely.

**The rendering pipeline:**
1. The browser composites everything behind the element into an offscreen bitmap
   (the "backdrop").
2. The filter chain (`blur()`, `saturate()`, `brightness()`, etc.) is applied to
   that bitmap.
3. The element's own paint (semi-transparent fill, border, text) is composited on
   top.

Because of step 1, every element with `backdrop-filter` becomes a stacking-context
boundary: a parent with `opacity < 1` becomes a new backdrop root, which means the
blur only sees content between that parent and the glass child — not content further
back. This is the "backdrop root trap" and is responsible for most cases where the
effect unexpectedly disappears.

**Blur radius cost:** blur computation is O(radius²) per pixel. A `blur(4px)` is
roughly four times cheaper than `blur(8px)`. Keep blur values in the 8–16 px range
for decorative panels; go lower (4–8 px) when many elements use it simultaneously.

**The filter chain:** chaining `blur()` with `saturate(180%)` is the standard glass
recipe. Blur desaturates colors by mixing adjacent pixels — `saturate()` compensates,
keeping the background colors vivid through the frost.

**Key properties and APIs:**

```css
backdrop-filter: blur(12px) saturate(180%);
-webkit-backdrop-filter: blur(12px) saturate(180%); /* required for Safari < 18 */
background: rgb(255 255 255 / 0.12);
border: 1px solid rgb(255 255 255 / 0.25);
```

`@supports (backdrop-filter: blur(1px))` detects support. When unsupported, fall
back to a higher-opacity solid fill so the panel remains readable.

`@media (prefers-reduced-transparency: reduce)` (Chrome 118+, Baseline limited as
of 2025 — Firefox and Safari partial) detects the OS-level "reduce transparency"
setting. Use it to increase opacity toward opaque. Layer both media query and
`@supports` for full coverage.

## Working code

### Vanilla CSS — glass card over imagery (self-contained)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Glass card demo</title>
<style>
  /* ─── Reset & base ─── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    font-family: system-ui, sans-serif;
    /* Vivid gradient behind gives the glass something to frost */
    background:
      radial-gradient(ellipse 80% 60% at 20% 30%, #1a3a6e 0%, transparent 70%),
      radial-gradient(ellipse 60% 80% at 80% 70%, #2e1a5a 0%, transparent 65%),
      #0a0a14;
  }

  /* Decorative shapes that blur through the glass */
  body::before,
  body::after {
    content: "";
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
  }
  body::before {
    width: 380px; height: 380px;
    background: #3b6fd4;
    top: -80px; left: -80px;
    opacity: 0.45;
    filter: blur(60px);
  }
  body::after {
    width: 300px; height: 300px;
    background: #7c3aed;
    bottom: -60px; right: -60px;
    opacity: 0.45;
    filter: blur(50px);
  }

  /* ─── Glass card ─── */
  .glass-card {
    position: relative;
    width: min(420px, 90vw);
    padding: 2.5rem 2rem;
    border-radius: 20px;

    /*
      Fallback first — opaque enough to guarantee contrast
      even when backdrop-filter is unsupported.
      #1e2040 at 95% opacity gives effective surface ~#1e2040.
      Text #f0f0f8 on #1e2040: relative luminance ratio ≈ 14.3:1. Passes AAA.
    */
    background: rgb(30 32 64 / 0.95);
    border: 1px solid rgb(255 255 255 / 0.08);
    box-shadow: 0 8px 32px rgb(0 0 0 / 0.45);
  }

  /* Progressive enhancement — apply glass only when supported */
  @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
    .glass-card {
      /*
        With the filter active, text color is #f0f0f8 on the blurred backdrop
        plus this semi-transparent fill. The fill is rgb(30 32 64 / 0.55).
        Over the dark body background (~#0a0a14) the effective blended
        surface sits around #161730 — ratio against #f0f0f8 ≈ 13.8:1. Passes AAA.
        Over the lighter colored blobs the blur desaturates them to mid-tones;
        combined with the 55%-opaque dark fill, worst-case effective surface is
        no lighter than #3a3a5a — ratio against #f0f0f8 ≈ 6.5:1. Passes AA.
      */
      background: rgb(30 32 64 / 0.55);
      -webkit-backdrop-filter: blur(14px) saturate(160%) brightness(0.9);
      backdrop-filter: blur(14px) saturate(160%) brightness(0.9);
      border: 1px solid rgb(255 255 255 / 0.18);
    }
  }

  /* Respect OS "Reduce transparency" setting */
  @media (prefers-reduced-transparency: reduce) {
    .glass-card {
      background: rgb(30 32 64 / 0.92);
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
  }

  /* ─── Content inside the card ─── */
  .glass-card__label {
    font-size: 0.6875rem;   /* 11px */
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #8b9fd4;         /* #8b9fd4 on ~#161730 ≈ 4.7:1 — passes AA */
    margin-bottom: 0.75rem;
  }

  .glass-card__title {
    font-size: clamp(1.375rem, 4vw, 1.75rem);
    font-weight: 700;
    line-height: 1.15;
    color: #f0f0f8;         /* #f0f0f8 on blended surface — see ratios above */
    margin-bottom: 1rem;
    letter-spacing: -0.02em;
  }

  .glass-card__body {
    font-size: 0.9375rem;
    line-height: 1.65;
    color: #c8cce8;         /* #c8cce8 on ~#161730 ≈ 8.1:1 — passes AA */
    margin-bottom: 1.75rem;
  }

  .glass-card__action {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    padding: 0.6em 1.25em;
    border-radius: 8px;
    background: #3b6fd4;
    color: #ffffff;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    border: none;
    cursor: pointer;
    /* Only animate opacity/transform — never layout properties */
    transition: opacity 0.15s ease, transform 0.15s ease;
  }

  .glass-card__action:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }

  .glass-card__action:focus-visible {
    outline: 3px solid #7baaf7;
    outline-offset: 3px;
  }

  /* Reduce motion: disable the hover translate */
  @media (prefers-reduced-motion: reduce) {
    .glass-card__action {
      transition: none;
    }
    .glass-card__action:hover {
      transform: none;
    }
  }

  /* Touch / coarse pointer: remove hover-only translate (no tap feedback jank) */
  @media (hover: none) or (pointer: coarse) {
    .glass-card__action:hover {
      transform: none;
      opacity: 1;
    }
  }
</style>
</head>
<body>

<article class="glass-card" aria-label="Project preview card">
  <p class="glass-card__label">Signal processing</p>
  <h2 class="glass-card__title">Real-time audio<br>fingerprinting</h2>
  <p class="glass-card__body">
    Extracts spectral landmarks from a live microphone stream and matches them
    against a local database in under 80 ms on consumer hardware.
  </p>
  <a class="glass-card__action" href="#">
    View project
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>
  </a>
</article>

</body>
</html>
```

### Glass navigation bar (sticky header variant)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Glass nav demo</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: system-ui, sans-serif;
    background: linear-gradient(160deg, #0f1923 0%, #1a2d40 50%, #0f1923 100%);
    color: #e8edf5;
    min-height: 200vh; /* scroll test */
  }

  /* ─── Glass nav ─── */
  .site-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 clamp(1rem, 5vw, 3rem);
    height: 64px;

    /* Fallback: near-opaque dark fill */
    background: rgb(15 25 35 / 0.95);
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
  }

  @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
    .site-nav {
      background: rgb(15 25 35 / 0.6);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
      backdrop-filter: blur(20px) saturate(140%);
    }
  }

  @media (prefers-reduced-transparency: reduce) {
    .site-nav {
      background: rgb(15 25 35 / 0.97);
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
  }

  .site-nav__logo {
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #f0f4ff;
    text-decoration: none;
  }

  .site-nav__links {
    display: flex;
    gap: 2rem;
    list-style: none;
  }

  .site-nav__links a {
    font-size: 0.875rem;
    font-weight: 500;
    color: #b0bcd8;
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .site-nav__links a:hover  { color: #f0f4ff; }
  .site-nav__links a:focus-visible {
    outline: 2px solid #7baaf7;
    outline-offset: 4px;
    border-radius: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .site-nav__links a { transition: none; }
  }

  /* No hover on touch devices */
  @media (hover: none) or (pointer: coarse) {
    .site-nav__links a:hover { color: #b0bcd8; }
  }

  .page-content {
    padding: 3rem clamp(1rem, 5vw, 3rem);
    max-width: 720px;
  }
  h1 { font-size: clamp(2rem, 6vw, 3.5rem); font-weight: 700; line-height: 1.1;
       letter-spacing: -0.03em; margin-bottom: 1.5rem; }
  p  { font-size: 1.0625rem; line-height: 1.7; color: #b0bcd8;
       margin-bottom: 1.25rem; }
</style>
</head>
<body>

<nav class="site-nav" aria-label="Site navigation">
  <a class="site-nav__logo" href="/">Substrate</a>
  <ul class="site-nav__links">
    <li><a href="/work">Work</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/writing">Writing</a></li>
  </ul>
</nav>

<main class="page-content">
  <h1>The glass sits on top, not instead.</h1>
  <p>Scroll to see the nav bar hold while the background shifts beneath it.</p>
  <p>The blur effect samples whatever is directly behind the sticky element
     at each scroll position — no JavaScript required, no Canvas trickery.</p>
</main>

</body>
</html>
```

## Variations

| Variant | What changes | Typical values |
|---|---|---|
| **Standard frost** | `blur()` only | `blur(12–16px)` |
| **Warm frost** | `blur()` + `brightness(1.1)` + `sepia(0.08)` | Adds warmth, useful over photography |
| **Vivid frost** | `blur()` + `saturate(180%)` | Keeps background colors punchy through the glass |
| **Dark glass** | Semi-dark fill + `blur()` | `rgb(0 0 0 / 0.45)` fill — better for light backgrounds |
| **Light glass** | Semi-white fill + `blur()` | `rgb(255 255 255 / 0.25)` fill — better for dark backgrounds |
| **Chromatic glass** | `blur()` + `hue-rotate()` animated via `@property` | Subtle shifting tint; must respect `prefers-reduced-motion` |
| **Edge glass** | Separate `backdrop-filter` element with narrow masked strip | Creates a 3D glass-edge depth effect (Josh Comeau technique) |

The knob that separates them is the `backdrop-filter` chain and the fill's color/alpha.
The border treatment (color, opacity, one-side vs all-sides) is the secondary differentiator.

## Accessibility

### prefers-reduced-motion (mandatory for any animated variant)

If you animate the glass panel (chromatic tint rotation, fade-in on scroll, etc.):

```css
/* Moving/animating glass panel */
.glass-panel {
  animation: glass-drift 8s ease-in-out infinite alternate;
}

@keyframes glass-drift {
  from { transform: translateY(0); }
  to   { transform: translateY(-8px); }
}

/* Kill all motion; keep the surface readable */
@media (prefers-reduced-motion: reduce) {
  .glass-panel {
    animation: none;
    transform: none;
  }
}
```

Static glass surfaces (no animation) are not affected by `prefers-reduced-motion`,
but animated ones — including the chromatic variant — must be fully disabled.

### prefers-reduced-transparency

```css
.glass-panel {
  background: rgb(20 25 50 / 0.55);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  backdrop-filter: blur(14px) saturate(160%);
}

@media (prefers-reduced-transparency: reduce) {
  .glass-panel {
    background: rgb(20 25 50 / 0.92); /* near-opaque */
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
```

Note: `prefers-reduced-transparency` is Chrome 118+ / Edge 118+ only as of mid-2025;
Firefox is behind a flag, Safari has no support. It is worth implementing now as
progressive enhancement, but it cannot be the sole a11y layer — the fallback must
also work for users who simply have unsupported browsers.

### Contrast / readability

The critical rule: **text contrast must pass WCAG AA (4.5:1 for body text, 3:1 for
large text) against the *worst-case effective surface color*, not the nominal fill**.

The effective surface is the result of the semi-transparent fill composited over the
actual backdrop at every scroll position. Because the backdrop is dynamic, you must:

1. Audit contrast over the lightest *and* darkest plausible backgrounds.
2. Add a semi-opaque inner "film" (e.g. `background: rgb(15 20 45 / 0.55)` on a dark
   panel) so the fill itself provides most of the contrast budget.
3. Never rely on the blur alone to create contrast. Blur reduces sharpness; it does
   not reliably darken or lighten.
4. Avoid placing low-weight small text on glass — it fails contrast first.

The color pairing in the working code above (`#f0f0f8` text on a panel whose
effective surface is no lighter than `#3a3a5a` after compositing) yields a
worst-case ratio of approximately 6.5:1, clearing WCAG AA.

### Focus and keyboard

Interactive glass elements (buttons, links, modal close targets) need visible focus
indicators that work over the blurred backdrop. A solid `outline` in a color that
contrasts against both the glass fill *and* whatever may show through it is safest:

```css
.glass-interactive:focus-visible {
  outline: 3px solid #7baaf7;
  outline-offset: 3px;
}
```

Avoid `outline: none` on glass elements even temporarily; the see-through surface
makes focus position ambiguous for keyboard and switch-access users.

### Touch and pointer fallback

Hover-only interactions (e.g. glass expanding or tinting on hover) must not be the
only interaction affordance. Apply hover styles only under:

```css
@media (hover: hover) and (pointer: fine) {
  .glass-panel:hover { /* hover-exclusive style */ }
}
```

### Screen-reader implications

Glass is purely visual; it has no semantic effect. Aria roles and labels belong on
the semantic elements inside the panel, not on the glass container. A modal glass
overlay still needs `role="dialog"`, `aria-modal="true"`, and focus trapping — glass
styling does not change that obligation.

## Performance

**GPU compositing cost.** Every `backdrop-filter` element forces the browser to
create an isolated compositing layer and execute GPU draw passes for the blurred
backdrop. In Chrome's rendering pipeline, this requires at least two render passes:
one to capture the backdrop, one to composite the filtered result. Nesting
`backdrop-filter` elements can multiply this cost.

**Observed GPU impact.** Testing has shown GPU utilization spiking from ~42% to
130%+ when applying `backdrop-filter: blur()` to elements over video or animated
content. On low-end mobile, the effect can cause noticeable frame drops.

**Containment rules:**
- Do not stack more than two or three `backdrop-filter` elements in the same
  stacking context, especially if any parent animates.
- On large surfaces (full-bleed modals, sidebars), prefer a lower blur radius
  (6–10 px) over a high one (20+ px).
- Blur radius scales quadratically: `blur(20px)` is roughly four times as expensive
  as `blur(10px)` per pixel.

**`will-change` caution.** `will-change: backdrop-filter` promotes the element to
its own layer ahead of time, which can *help* if the filter value animates, but
wastes GPU memory when the element is static. Use sparingly and remove it when
the animation ends.

**Animate only transform and opacity** on glass elements. Animating `blur()` radius
directly (outside `@property` where it can be GPU-handled) triggers paint on each
frame; animating `transform: scale()` or `opacity` stays on the compositor thread.

**`@supports` gating.** The fallback path (plain `background`) has zero compositing
overhead. Ensuring unsupported browsers get the fallback is also a performance win
for older hardware.

**Backdrop-root trap and rendering bugs.** If a parent element has `opacity < 1`,
`filter`, `mask`, or `clip-path`, it becomes a new backdrop root and the glass child
may appear to stop blurring content below. Avoid setting `overflow: hidden` on
a direct parent (use `mask-image` instead if clipping is needed — the masking
algorithm runs after the filter whereas overflow clips before it in Chrome).

Firefox has a known issue where `backdrop-filter` fails on `position: sticky`
elements when an ancestor has both `overflow` and `border-radius`. The workaround
is `overscroll-behavior: none` on the scroll container.

## Anti-slop

**The cliche (see `_slop-blocklist.md` → Surface):** Glass on every card, low-opacity
fill, text directly on a semi-transparent white layer over a busy gradient, all at
8% opacity, producing unreadable mid-grey text over a washed-out blur. The
glassmorphism generator output: `background: rgba(255,255,255,0.1)` with
`backdrop-filter: blur(5px)` and `border: 1px solid rgba(255,255,255,0.3)`.
Every card in the grid gets the same treatment. Contrast fails. The effect loses
meaning because it is applied uniformly.

**The tasteful alternative:**
- Use glass on exactly one layer per screen region — a navigation bar *or* a card,
  not both simultaneously.
- Set the fill dark (or light) enough that contrast is guaranteed: aim for at least
  50% opacity on the fill, then tune the blur separately.
- Pair with real photography or a deliberate gradient (single-hue OKLCH ramp, not
  a purple-to-pink AI default) so there is actually something meaningful to see
  through the glass.
- Use `blur(12–16px)` with `saturate(160%)` rather than `blur(5px)` with no
  saturation adjustment; the higher blur and saturation boost reads as intentional
  rather than accidental.
- Apply a thin border on the top and left edges only (or top only) to simulate
  real glass catching light — not all four sides at equal opacity.
- Never place marketing copy directly on glass. If text must be there, add a
  semi-opaque rectangular film behind the text run specifically.

## Pairs well with

- **css-gradients** — the background gradient (radial orbs, OKLCH tonal ramps) is
  what the glass frosts; the two effects are inseparable.
- **gradient-mesh-aurora** — aurora blobs give the glass lively, shifting color to
  sample; keep aurora animations slow and subtle or gate them behind
  `prefers-reduced-motion`.
- **noise-grain-texture** — a fine grain layer over the glass panel adds tactile
  depth and breaks up the "airbrushed" quality of pure blur; apply via SVG
  `feTurbulence` or a tiled PNG at `opacity: 0.04–0.08`.
- **cursor-spotlight-glow** — a radial highlight that tracks the cursor can simulate
  glass refracting a moving light source; applies only under
  `@media (hover: hover) and (pointer: fine)`.
- **systematic-elevation** — glass is one tier in a broader shadow/elevation system;
  pair with `box-shadow` tokens so modal > card > nav communicate hierarchy without
  relying on blur alone.

## Current references

- [MDN — backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) — syntax, filter functions, backdrop-root explanation, Baseline 2024 status
- [Can I use — CSS backdrop-filter](https://caniuse.com/css-backdrop-filter) — browser version support table; Chrome 76+, Firefox 103+, Safari 9+, Edge 17+
- [Josh W. Comeau — Next-level frosted glass](https://www.joshwcomeau.com/css/backdrop-filter/) — deep-dive on the blur-samples-only-behind limitation, masking technique to capture nearby content, edge glass, pointer-events and flickering fixes
- [Chrome for Developers — prefers-reduced-transparency](https://developer.chrome.com/blog/css-prefers-reduced-transparency) — Chrome 118+ additive pattern: solid baseline, layer glass only on `no-preference`
- [MDN — prefers-reduced-transparency](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency) — syntax, OS mappings (Windows, macOS, iOS), browser support caveats
- [Nielsen Norman Group — Glassmorphism](https://www.nngroup.com/articles/glassmorphism/) — research-backed UX findings: when blur helps vs hurts, contrast testing methodology, recommendation to maximize blur for intricate backgrounds
- [Axess Lab — Glassmorphism meets accessibility](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/) — disability-first critique: contrast failures, vestibular/blur sensitivity, screen magnifier hierarchy issues, concrete fixes
- [CSS-Tricks — backdrop-filter effect](https://css-tricks.com/backdrop-filter-effect-with-css/) — practical implementation notes, `@supports` pattern, Safari prefix details
- [Filter Effects Module Level 2 spec](https://drafts.fxtf.org/filter-effects-2/#BackdropFilterProperty) — formal definition of BackdropFilterProperty and backdrop root algorithm
- [shadcn/ui issue #327 — backdrop-filter performance](https://github.com/shadcn-ui/ui/issues/327) — real-world Chromium rendering/painting problem report; documents the double-draw-pass cost in production
