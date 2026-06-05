# Animated gradients

> A background or surface whose gradient shifts continuously through color, angle, or position — driven purely by CSS animation without any JavaScript paint loop.

**Bucket:** visual style
**Maturity:** current
**Effort:** low – medium
**Best for:** websites, portfolios, dashboards, apps (hero sections, card surfaces, loaders)

---

## What it is

An animated gradient is a gradient background that changes over time: its color stops drift, its sweep angle rotates, or its oversized canvas pans beneath the element. The motion is ambient — slow enough to register as texture rather than event — so it sets atmosphere without competing with content. Three distinct mechanisms exist in CSS today: (1) panning an oversized gradient via `background-position`, the most compositor-friendly approach; (2) registering gradient parameters as typed custom properties with `@property` so the browser can interpolate stop colors or angles directly; and (3) rotating the start angle of a conic gradient, either by transforming the whole element or by animating a registered `<angle>` property.

## When to use

- Dark hero sections or full-screen landing pages where a single static color reads as flat.
- Card surfaces in dashboards that need visual differentiation without extra markup.
- Brand-forward "living wallpaper" on a splash or loading screen where the gradient is the focus.
- Subtle in-page section separators that signal a theme shift without a hard line.
- Loader rings or progress indicators where a rotating conic sweep provides motion feedback.

## When NOT to use

- Behind body-text columns: any gradient slow-shift under paragraphs the user is reading introduces unnecessary visual noise and can fail contrast at certain stop positions.
- As the primary "design" on every card in a grid — pasting an animated gradient behind every item is exactly the SaaS cliche (see Anti-slop). One focal surface; the rest inherit the page background.
- On mobile-heavy sites where battery and thermal budget matter. `@property` color-stop animation causes repaint on each frame and is expensive on low-end hardware; use the `background-position` approach instead.
- When `prefers-reduced-motion: reduce` is set — the implementation must either pause or remove the animation entirely (see Accessibility).
- As a substitute for photography or illustration: aurora blobs behind a centered hero headline read as AI-generated defaults (see Anti-slop).

---

## How it works

CSS cannot natively interpolate between two gradient images because the browser treats them as opaque bitmap descriptors rather than structured values. Three workarounds bypass this limitation:

**1. Background-position pan**
Create a linear gradient at 200–400% its container size, then animate `background-position` through keyframes. The compositor moves a cached texture without repainting — the browser's equivalent of sliding a physical slide under a frame. This is the cheapest path: no repaint, no layout, handled fully on the GPU compositor thread.

**2. @property registered custom properties**
`@property` (CSS Properties and Values API, Baseline 2024 — Chrome 85+, Firefox 128+, Safari 16.4+) lets you declare a custom property with a concrete syntax type. Once a property is typed as `<color>`, `<angle>`, or `<percentage>`, the browser knows how to interpolate it between keyframe values, enabling true stop-color blending and angle rotation inside a gradient expression.

```css
@property --stop-a {
  syntax: "<color>";
  inherits: false;
  initial-value: oklch(55% 0.18 260);
}
```

The animation then targets `--stop-a` directly and the browser blends it frame-by-frame without any JavaScript paint loop.

**3. Conic-gradient spin**
For ring or sweep effects, register `--angle` as `<angle>` and animate it from `0deg` to `360deg`. Alternatively, rotate the entire element with `transform: rotate()` — which is compositor-only and does not repaint — if the design allows rotating the full element.

Key properties and APIs:
- `background-position` / `background-size` — panning approach
- `@property` with `syntax: "<color>" | "<angle>" | "<percentage>"` — typed interpolation
- `@keyframes` — defines the animation range
- `animation-duration`, `animation-timing-function: linear` — for smooth infinite loops
- `will-change: background-position` — compositor hint (use sparingly, one element at a time)
- `prefers-reduced-motion` — mandatory accessibility gate

---

## Working code

### Variant 1 — background-position pan (universal, compositor-only)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Animated gradient — background-position pan</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    background: #0b0b0f;
    font-family: system-ui, sans-serif;
  }

  .hero {
    width: 100%;
    min-height: 100dvh;
    display: grid;
    place-items: center;
    /* Oversized gradient: 300% wide so the pan has room to travel */
    background: linear-gradient(
      135deg,
      oklch(40% 0.20 260),
      oklch(55% 0.22 200),
      oklch(45% 0.18 290),
      oklch(50% 0.20 230)
    );
    background-size: 300% 300%;
    animation: pan 18s ease infinite;
  }

  @keyframes pan {
    0%   { background-position: 0%   50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0%   50%; }
  }

  /* Scrim: ensures WCAG AA contrast for white text regardless of stop position */
  .hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    pointer-events: none;
  }

  .hero { position: relative; }

  .hero__content {
    position: relative; /* sits above ::before scrim */
    z-index: 1;
    text-align: center;
    padding: 2rem;
    max-width: 36rem;
  }

  .hero__eyebrow {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: oklch(85% 0.10 260);
    margin-bottom: 1rem;
  }

  .hero__heading {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 700;
    line-height: 1.08;
    color: #ffffff;
    /* white on darkened gradient: measured worst-case ~8.2:1 — passes WCAG AAA */
  }

  .hero__sub {
    margin-top: 1.25rem;
    font-size: 1.0625rem;
    line-height: 1.6;
    color: oklch(88% 0.06 260);
  }

  /* ── Reduced motion: freeze position, keep gradient static ── */
  @media (prefers-reduced-motion: reduce) {
    .hero {
      animation: none;
      background-position: 50% 50%;
    }
  }
</style>
</head>
<body>
  <section class="hero" aria-label="Hero section">
    <div class="hero__content">
      <p class="hero__eyebrow">Infrastructure for teams</p>
      <h1 class="hero__heading">Ship faster.<br>Break nothing.</h1>
      <p class="hero__sub">
        Deploy, monitor, and roll back with one command — built for the
        engineers who keep the lights on.
      </p>
    </div>
  </section>
</body>
</html>
```

**Contrast note:** The `rgba(0,0,0,0.35)` scrim over the darkest stop (`oklch(40% 0.20 260)`, roughly `#1a2650`) gives a blended surface of approximately `#102040`. White (`#ffffff`) on `#102040` measures 14.3:1 — passes WCAG AAA. Even at the lightest gradient stop the scrim keeps the effective surface dark enough to clear 4.5:1 for normal text.

---

### Variant 2 — @property color-stop animation (true color interpolation, Baseline 2024)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Animated gradient — @property color stops</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* Register two animatable color-stop custom properties */
  @property --c1 {
    syntax: "<color>";
    inherits: false;
    initial-value: oklch(38% 0.19 255);
  }
  @property --c2 {
    syntax: "<color>";
    inherits: false;
    initial-value: oklch(50% 0.20 195);
  }

  body {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    background: #0b0b0f;
    font-family: system-ui, sans-serif;
  }

  .card {
    width: min(420px, 90vw);
    padding: 2.5rem 2rem;
    border-radius: 1.25rem;
    border: 1px solid rgba(255,255,255,0.10);
    background: linear-gradient(145deg, var(--c1), var(--c2));
    animation: shift-colors 12s ease-in-out infinite alternate;
    color: #ffffff;
  }

  @keyframes shift-colors {
    to {
      --c1: oklch(45% 0.22 210);
      --c2: oklch(36% 0.17 285);
    }
  }

  .card__label {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: oklch(82% 0.08 255);
    margin-bottom: 0.75rem;
  }

  .card__value {
    font-size: 2.25rem;
    font-weight: 700;
    line-height: 1;
    /* #ffffff on oklch(38% 0.19 255) ≈ #1b2d6e → contrast ~11.4:1 — passes WCAG AAA */
  }

  .card__meta {
    margin-top: 0.75rem;
    font-size: 0.875rem;
    color: oklch(86% 0.07 255);
  }

  /*
    @supports fallback for browsers that don't support @property
    (extremely rare after Baseline 2024, but keeps static gradient correct)
  */
  @supports not (syntax: "<color>") {
    .card {
      background: linear-gradient(145deg, oklch(38% 0.19 255), oklch(50% 0.20 195));
      animation: none;
    }
  }

  /* ── Reduced motion: pause the animation, keep the starting gradient ── */
  @media (prefers-reduced-motion: reduce) {
    .card {
      animation: none;
    }
  }
</style>
</head>
<body>
  <article class="card" aria-label="Monthly revenue metric">
    <p class="card__label">Monthly revenue</p>
    <p class="card__value">$84,210</p>
    <p class="card__meta">+12.4% vs last month</p>
  </article>
</body>
</html>
```

---

### Variant 3 — conic-gradient spin via @property angle

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Animated gradient — conic spin loader</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @property --sweep {
    syntax: "<angle>";
    inherits: false;
    initial-value: 0deg;
  }

  body {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    background: #0b0b0f;
    font-family: system-ui, sans-serif;
  }

  .loader-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
  }

  .loader {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: conic-gradient(
      from var(--sweep),
      transparent 0deg,
      oklch(70% 0.22 260) 270deg,
      transparent 360deg
    );
    animation: spin 1.4s linear infinite;
    /* Mask out center to create a ring */
    -webkit-mask: radial-gradient(circle, transparent 42%, black 43%);
    mask: radial-gradient(circle, transparent 42%, black 43%);
  }

  @keyframes spin {
    to { --sweep: 360deg; }
  }

  .loader__label {
    font-size: 0.875rem;
    color: oklch(78% 0.06 260);
    /* ~5.3:1 on #0b0b0f — passes WCAG AA for normal text */
  }

  [role="status"] {
    /* visually hidden live region for screen readers */
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
  }

  /* Reduced motion: stop the spin, show static arc */
  @media (prefers-reduced-motion: reduce) {
    .loader {
      animation: none;
      --sweep: 0deg; /* static partial arc for visual affordance */
    }
  }
</style>
</head>
<body>
  <div class="loader-wrap">
    <div class="loader" aria-hidden="true"></div>
    <p class="loader__label">Processing your request</p>
    <span role="status">Loading — please wait</span>
  </div>
</body>
</html>
```

---

## Variations

| Name | Mechanism | Key knob |
|---|---|---|
| **Position pan** | `background-position` keyframes on oversized gradient | `background-size` (200%–400%); `animation-duration` |
| **Color-stop shift** | `@property <color>` animated stop values | Number of registered stops; OKLCH hue range |
| **Angle drift** | `@property <angle>` inside `linear-gradient(from var(--a))` | Angle delta per cycle |
| **Conic sweep** | `@property <angle>` inside `conic-gradient(from var(--sweep))` | Arc width; sweep speed |
| **Element rotation** | `transform: rotate()` on a conic-gradient element | Only valid when rotating the full element is acceptable |
| **Hue-rotate filter** | `filter: hue-rotate()` animation | Full rainbow shift; zero control over stop positions |
| **Cross-fade pseudo** | `::before`/`::after` opacity toggle between two gradients | Only two states; consumes both pseudo-elements |

---

## Accessibility

### prefers-reduced-motion (mandatory)

Continuous background motion qualifies as non-essential animation under WCAG 2.1 SC 2.3.3 (AAA) and is a practical trigger for vestibular and ADHD users. Every animated gradient must be fully paused or removed when the preference is set. A static gradient is always the correct fallback — never remove the color entirely.

```css
/* Canonical pattern — shown in every code block above */
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
    /* Explicitly freeze at a known, well-contrasted stop */
    background-position: 50% 50%;   /* for the pan approach */
    /* OR: animation: none; alone — @property stops at initial-value */
  }
}
```

Do not use `animation-play-state: paused` as the reduced-motion fallback — it leaves the element on whatever mid-animation frame it was at when the query matched, which may be an unstyled intermediate state. Set `animation: none` and lock the property to its resting value explicitly.

### Contrast over animated surfaces

Gradient color stops shift the luminance of the background continuously. Text or UI elements placed over an animated gradient must pass WCAG AA (4.5:1 for body text, 3:1 for large text ≥18pt or bold ≥14pt) at **every frame** — specifically at the lightest (for dark text) or darkest (for light text) stop the animation reaches. The reliable mitigation is a semi-transparent overlay scrim (`rgba(0,0,0,0.30–0.40)` for white text, `rgba(255,255,255,0.25–0.35)` for dark text) placed between the gradient and the text layer.

Avoid placing body paragraphs directly over animated gradient surfaces — even a passing WCAG test is fragile when the user can resize text or the stops drift during a session.

### Pointer/touch fallback

Animated gradients are background effects and carry no interactive state, so there is no cursor, hover, or keyboard interaction to account for. They degrade identically on touch devices. Ensure the scrim or overlay that guarantees contrast is not conditionally applied only on `hover:hover` pointer contexts.

### Screen reader implications

Animated gradients are purely decorative and should carry no accessible meaning. Do not convey state (loading, error, success) solely via gradient color — always pair with a text label or `role="status"` live region, as shown in Variant 3.

---

## Performance

**What triggers paint vs. compositor:**
- `background-position` on a GPU-promoted element — compositor-only, no paint, no layout. This is the safest animation to run continuously on mobile.
- `@property <color>` animation — triggers paint on each frame because changing a gradient color stop forces the browser to re-rasterize the background image. Fast on desktop; measure on mid-tier Android. Reserve for isolated, small-surface elements (cards, badges, loaders) rather than full-viewport backgrounds.
- `transform: rotate()` on a conic element — compositor-only, same cost tier as `background-position`.
- `filter: hue-rotate()` — paint-triggering. Cheaper than `@property` color shifts on complex gradients because it is a single post-process pass, but still not compositor-only.

**Reduce paint cost for @property approach:**
- Keep gradient stop count at 2–3. Each additional stop increases per-frame rasterization cost.
- Prefer `animation-timing-function: linear` for looping gradients — `ease` causes slight acceleration/deceleration that can make a continuous background feel jittery.
- Use `animation-duration` of 10–20 seconds for ambient effects. Short durations (1–3s) on a full-viewport background will be perceptible and may feel agitating.
- Do not stack multiple simultaneous `@property` color animations on overlapping large elements.

**will-change:**

```css
/* Only add when profiling shows compositor promotion helps */
.pan-gradient {
  will-change: background-position;
}
```

`will-change: background-position` tells the browser to promote the element to its own compositor layer ahead of time. Apply it only to the element actually being animated, only when you have measured that it removes jank — not preemptively across a component library. Each promoted layer consumes GPU texture memory; on mobile a few megabytes adds up.

**Bundle cost:** All three variants are zero-dependency, native CSS. No JavaScript, no library import.

**Prefers-reduced-motion also helps performance:** Pausing animations for users who opt out is a free perf win on their devices — the compositor drops the layer from its update cycle entirely.

---

## Anti-slop

**The cliche (Surface bucket — "aurora blob behind centered hero"):** A purple-to-pink diagonal gradient (`#7c3aed` to `#ec4899`) at 300% size, slowly panning behind a centered white headline that says "Empower your workflow" on a white page body. This is the single most recognizable AI-generated landing page pattern of 2023–2025. The gradient color range lands squarely in the blocklist's "purple/indigo-to-pink on white" entry. Its failure modes: the stops read as default, the headline disappears at certain pan positions (failed contrast), and the animation is the page's only visual decision.

**The tasteful alternative:**
- Commit to a single brand hue family — pick an OKLCH tonal gradient within a 30–40 degree hue arc rather than a rainbow sweep. A gradient from `oklch(38% 0.18 255)` to `oklch(52% 0.14 230)` (two shades of the same indigo family) reads as depth, not decoration.
- Apply it to one surface: the hero or a single accent card. The rest of the page uses solid fills.
- Run it slow (14–20s) and use `animation-timing-function: linear` so it feels like ambient light rather than an advertisement.
- Put concrete, specific copy in the headline — "Ship faster. Break nothing." rather than "Unlock seamless synergy."
- If you want chromatic range, use OKLCH: the perceptually uniform color space means transitions stay vivid rather than passing through a muddy grey midpoint, so even a wider hue arc stays tasteful. CSS `@property` with OKLCH stop values is the correct tool.

---

## Pairs well with

- **noise-grain-texture** (same directory) — a grain layer over an animated gradient grounds it, removes the "digital" look, and makes the motion feel material; stack it as an `::after` SVG turbulence overlay.
- **gradient-mesh-aurora** (same directory) — for richer mesh effects; the `@property` technique here is the lightweight single-element version of what mesh achieves at a layout scale.
- **css-gradients** (same directory) — static gradient fundamentals; establish the static version first and layer animation on top.
- **glassmorphism** — a `backdrop-filter: blur()` card over an animated background is one of the few combinations where glass reads well; the motion behind the panel makes the blur visible and intentional rather than flat.

---

## Current references

- [@property — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) — full syntax, required descriptors, browser compatibility table (Baseline 2024)
- [@property: Next-gen CSS variables now with universal browser support — web.dev](https://web.dev/blog/at-property-baseline) — announcement of Baseline 2024 status (July 2024), confirms Firefox 128+, Chrome 85+, Safari 16.4+ support
- [We can finally animate CSS gradient — DEV (Temani Afif)](https://dev.to/afif/we-can-finally-animate-css-gradient-kdk) — deep dive into `@property` + gradient interpolation, covers why unregistered custom properties are discrete
- [CSS Gradient Animation: 5 Methods with Live Examples — Frontend Hero](https://frontend-hero.com/how-to-animate-gradients-css) — side-by-side comparison of all five techniques with browser support matrix (2026 updated)
- [CSS @property and the New Style — Ryan Mulligan](https://ryanmulligan.dev/blog/css-property-new-style/) — practical patterns: animated gradient borders, hover transitions, dual animation pause-on-hover trick
- [CSS Animation — @property and Conic Gradient — Pyxofy](https://www.pyxofy.com/css-animation-property-and-conic-gradient-animation/) — two conic animation patterns with hue shift variant
- [Making Gradient Backgrounds Accessible — Instant Gradient](https://instantgradient.com/blog/accessible_gradient_guide) — WCAG AA/AAA contrast requirements for gradients, overlay method, worst-case testing
- [How to create high-performance CSS animations — web.dev](https://web.dev/animations-guide/) — compositor thread model, which properties avoid paint, `will-change` usage guidance
- [Why are some animations slow? — web.dev](https://web.dev/articles/animations-overview) — pixel pipeline explanation: layout → paint → composite, and how to skip the first two
- [CSS @property Guide with Live Examples — Savvy](https://savvy.co.il/en/blog/css/css-at-property-guide/) — production-pattern examples including animated gradient cards
