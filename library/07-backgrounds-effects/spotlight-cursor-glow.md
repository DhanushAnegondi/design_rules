# Spotlight & cursor glow

> A radial highlight that chases the pointer across a card or hero surface, making the UI feel physically responsive to touch without moving any layout element.

**Bucket:** visual style
**Maturity:** current
**Effort:** medium
**Best for:** websites, portfolios, apps, dashboards

## What it is

The pointer's coordinates are captured as JavaScript reads `pointermove` events and writes them into two CSS custom properties (`--x`, `--y`) directly on the target element. Inside CSS, a `radial-gradient` or `mask-image` references those properties so it repositions on every frame without the browser recalculating layout. The user perceives a cone of light — or a sharp border glow — that seems to emanate from wherever they hover, giving flat card surfaces a tactile, three-dimensional quality. Two distinct sub-patterns exist: a **reveal mask** (a dark overlay with a transparent circle cut out at the cursor, revealing a styled layer beneath) and a **surface glow** (a semi-transparent radial gradient painted directly on the card as a `::before` pseudo-element, brightening the border or surface color underneath the cursor).

## When to use

- Feature card grids on a dark-background landing page, where a resting state is fully readable but hover adds premium tactile detail.
- Hero sections with a large contained surface that benefits from a "follow the light" metaphor to reward exploration.
- Bento-grid dashboards or pricing tables where you want interaction feedback that does not require sound or animation but still signals responsiveness.
- Portfolio project cards that carry their own dark background — the glow doubles as a border-reveal, replacing a plain hover border color change.
- Any context where the cursor/hover experience is the primary interaction layer and a CSS-only hover state feels insufficient.

## When NOT to use

- Mobile-first products where touch is the dominant input — the effect is invisible on touch screens and must not degrade the resting experience (see Accessibility).
- Light-background cards with dense body text: a radial glow from `--x/--y` will create unpredictable contrast shifts across the text as the pointer moves, breaking WCAG compliance mid-hover.
- Forms, data tables, or interactive widgets where pointer movement creates noise around the primary task.
- Every card on a page simultaneously — this is the "glow/neon everywhere" anti-pattern (see Anti-slop). Reserve it for one focal zone per viewport.
- Pages targeting users with vestibular sensitivity as the only enhancement; always pair with a static hover state fallback so the non-animated experience still communicates feedback.

## How it works

**Coordinate capture.** A `pointermove` listener reads `event.clientX/clientY`, subtracts the element's `getBoundingClientRect()` offset to get element-relative coordinates, and writes them to inline CSS custom properties: `el.style.setProperty('--x', x + 'px')`. This keeps all visual work inside the CSS compositor — JavaScript only moves two numbers.

**Radial gradient positioning.** CSS reads `var(--x)` and `var(--y)` inside a `radial-gradient()` positioned with `at var(--x) var(--y)`, which places the gradient's center at the cursor position within the element's coordinate system.

**Two rendering strategies:**

1. **Pseudo-element glow** — a `::before` pseudo-element carries the radial gradient, is positioned absolute, `pointer-events: none`, and composited with `mix-blend-mode: overlay` or `lighten` over the card surface. Cheap to paint; works on any card.
2. **Mask reveal** — a duplicate overlay element (or a `::before` on a wrapper) uses `mask-image: radial-gradient(circle at var(--x) var(--y), black 0%, transparent 40%)` to cut a transparent window in a styled overlay, revealing a brighter version of the card beneath. More visually dramatic; requires either a duplicated DOM layer or `backdrop-filter` under the mask.

**Key CSS properties:**
- `radial-gradient()` with `at <x> <y>` — positions gradient center
- `mask` / `mask-image` — clips a layer using luminance/alpha channel
- `mix-blend-mode` — composites the glow against underlying content without a paint layer
- `@property` (Baseline July 2024, all major engines) — registers `--x`/`--y` as `<length>` types, enabling CSS `transition` on the gradient position for a lag/spring feel without JavaScript interpolation
- `pointer-events: none` on the glow layer — prevents it intercepting clicks on interactive content beneath

## Working code

### Vanilla — pseudo-element surface glow on a card grid

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Spotlight card glow</title>
<style>
  /* === Reset & base === */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    background: #0b0d14;
    font-family: system-ui, sans-serif;
    padding: 3rem 1.5rem;
  }

  /* === Card grid === */
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
    max-width: 900px;
    width: 100%;
  }

  /* === Card base === */
  .card {
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    padding: 2rem 1.75rem;
    background: #141622;
    border: 1px solid #232638;
    color: #c8cce0;
    /* Ensure --x/--y have safe defaults so no glow shows before pointer enters */
    --x: -9999px;
    --y: -9999px;
  }

  .card h2 {
    font-size: 1.05rem;
    font-weight: 600;
    color: #e8eaf6;
    margin-bottom: 0.5rem;
    letter-spacing: -0.01em;
  }

  .card p {
    font-size: 0.875rem;
    line-height: 1.6;
    color: #8a8fad;
  }

  /* === Spotlight glow layer === */
  /*
    This ::before creates the radial glow centered at the pointer.
    It is pointer-events:none so it never blocks clicks on text or links inside the card.
    opacity:0 by default — only reveals on hover within a device that supports hover.
  */
  .card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      600px circle at var(--x) var(--y),
      rgba(99, 120, 255, 0.18) 0%,
      rgba(99, 120, 255, 0.06) 40%,
      transparent 70%
    );
    opacity: 0;
    pointer-events: none;
    /* Transition opacity only — gradient repositions instantaneously via custom props */
    transition: opacity 350ms ease;
    z-index: 0;
  }

  /* === Border highlight layer === */
  /*
    A second ::after layer brightens the 1px border under the cursor.
    Rather than attempting a mask-restricted paint (which requires a
    padding-box/border-box clip trick that has poor cross-browser support),
    this uses a box-shadow: inset approach driven by a JS-updated
    --border-alpha custom property. The inset shadow sits inside the
    border-box boundary, so only the ring area is visually brightened —
    the card interior is not affected because the shadow does not extend
    inward beyond the border ring.
  */
  .card::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: transparent;
    opacity: 0;
    pointer-events: none;
    transition: opacity 350ms ease;
    z-index: 0;
    box-shadow: inset 0 0 0 1px rgba(99, 120, 255, var(--border-alpha, 0));
  }

  /* Keep card content above the glow pseudo-elements */
  .card > * {
    position: relative;
    z-index: 1;
  }

  /*
    === Pointer/hover gate ===
    Only activate on devices with a fine pointer AND hover capability.
    Touch screens, coarse-pointer devices (game controllers, some styluses)
    and devices without hover (most phones) never see this rule.
  */
  @media (hover: hover) and (pointer: fine) {
    .card:hover::before,
    .card:hover::after {
      opacity: 1;
    }
  }

  /*
    === Reduced-motion: remove all visual change on movement ===
    The glow itself is not animated (it snaps to position, not tweened),
    but the opacity transition still constitutes motion. We remove it.
    The resting card remains fully styled and readable.
  */
  @media (prefers-reduced-motion: reduce) {
    .card::before,
    .card::after {
      transition: none;
    }
  }
</style>
</head>
<body>

<div class="cards" id="cards">
  <article class="card">
    <h2>Observability</h2>
    <p>Distributed traces, structured logs, and real-time metrics in one unified query surface.</p>
  </article>
  <article class="card">
    <h2>Edge functions</h2>
    <p>Deploy request handlers 40ms from every user with zero cold starts and global replication.</p>
  </article>
  <article class="card">
    <h2>Storage</h2>
    <p>Key-value, SQL, and blob storage on the same platform — one billing line, consistent latency SLAs.</p>
  </article>
</div>

<script>
  /*
    Strategy: one pointermove listener on the shared parent (event delegation).
    Each card receives its own --x/--y and --border-alpha relative to that
    card's top-left corner via getBoundingClientRect(). This avoids N listeners
    for N cards and keeps all visual work inside the CSS compositor.

    Only attach the listener on devices with a fine pointer AND hover capability.
    No JS overhead on touch-only sessions.
    prefers-reduced-motion is handled in CSS (transition: none). Users who need
    to disable even the instant reposition can use the JS-level guard pattern
    shown in the Accessibility section.
  */
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (hasFinePointer) {
    const container = document.getElementById('cards');

    container.addEventListener('pointermove', (e) => {
      // Walk all cards; update --x/--y and --border-alpha for each
      const cards = container.querySelectorAll('.card');
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--x', x + 'px');
        card.style.setProperty('--y', y + 'px');
        // Border alpha: max brightness when pointer is within 120px of any edge
        const distToEdge = Math.min(x, y, rect.width - x, rect.height - y);
        const alpha = distToEdge < 120 ? (1 - distToEdge / 120) * 0.7 : 0;
        card.style.setProperty('--border-alpha', alpha.toFixed(3));
      });
    });

    // Reset to off-card position when pointer leaves the container
    container.addEventListener('pointerleave', () => {
      container.querySelectorAll('.card').forEach((card) => {
        card.style.setProperty('--x', '-9999px');
        card.style.setProperty('--y', '-9999px');
        card.style.setProperty('--border-alpha', '0');
      });
    });
  }
</script>
</body>
</html>
```

### Vanilla — mask-reveal overlay on a hero

This variant cuts a transparent window in a dark overlay, revealing the styled card beneath. Text contrast is always guaranteed because the base layer is always fully visible — the mask only opens up a brighter version.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Spotlight mask reveal</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    background: #080a10;
    font-family: system-ui, sans-serif;
  }

  /*
    The hero wrapper is a stacking context with two layers:
    .hero-base   — always-visible dark content (guaranteed contrast)
    .hero-reveal — brighter styled version, exposed by the mask
  */
  .hero {
    position: relative;
    width: min(700px, 90vw);
    border-radius: 16px;
    overflow: hidden;
    /* Custom props default to center so the reveal is visible before any hover */
    --x: 50%;
    --y: 50%;
    --mask-opacity: 0;
  }

  /* Base layer — always fully readable, never obscured */
  .hero-base {
    padding: 4rem 3rem;
    background: #10121e;
    border: 1px solid #1e2236;
    border-radius: inherit;
  }

  .hero-base h1 {
    font-size: clamp(1.75rem, 4vw, 2.75rem);
    font-weight: 700;
    color: #c8cce0;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin-bottom: 1rem;
  }

  .hero-base p {
    font-size: 1rem;
    color: #6b7094;
    line-height: 1.65;
    max-width: 52ch;
  }

  /* Reveal layer — brighter, sits on top, masked to the cursor circle */
  .hero-reveal {
    position: absolute;
    inset: 0;
    padding: 4rem 3rem;
    background: #181c30;
    border: 1px solid #3d4580;
    border-radius: inherit;
    pointer-events: none;
    /*
      The mask cuts a transparent circle at the cursor.
      Outside the circle the overlay is fully opaque — hiding the reveal.
      Inside it's transparent — showing the brighter reveal layer through.
    */
    -webkit-mask-image: radial-gradient(
      280px circle at var(--x) var(--y),
      black 0%,
      black 30%,
      transparent 70%
    );
    mask-image: radial-gradient(
      280px circle at var(--x) var(--y),
      black 0%,
      black 30%,
      transparent 70%
    );
    opacity: var(--mask-opacity, 0);
    transition: opacity 400ms ease;
  }

  /* Reveal layer content — matches base layout exactly */
  .hero-reveal h1 {
    font-size: clamp(1.75rem, 4vw, 2.75rem);
    font-weight: 700;
    /* Brighter text in the revealed zone */
    color: #eef0fc;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin-bottom: 1rem;
  }

  .hero-reveal p {
    font-size: 1rem;
    color: #9ea3c8;
    line-height: 1.65;
    max-width: 52ch;
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-reveal {
      transition: none;
    }
  }
</style>
</head>
<body>

<div class="hero" id="hero">
  <!-- Base: always visible, always WCAG-compliant -->
  <div class="hero-base" aria-hidden="false">
    <h1>Build for the next billion users</h1>
    <p>Infrastructure that scales from a weekend project to a global product — without rewriting your deployment config at each step.</p>
  </div>

  <!-- Reveal: decorative duplicate, hidden from screen readers -->
  <div class="hero-reveal" aria-hidden="true">
    <h1>Build for the next billion users</h1>
    <p>Infrastructure that scales from a weekend project to a global product — without rewriting your deployment config at each step.</p>
  </div>
</div>

<script>
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hero = document.getElementById('hero');

  if (hasFinePointer) {
    hero.addEventListener('pointerenter', () => {
      hero.style.setProperty('--mask-opacity', '1');
    });

    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      hero.style.setProperty('--x', x + 'px');
      hero.style.setProperty('--y', y + 'px');
    });

    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--mask-opacity', '0');
    });
  }
</script>
</body>
</html>
```

### React + @property — spring-lagged glow with CSS transition

`@property` (Baseline July 2024) lets the browser interpolate `<length>` custom properties natively, so you get a spring-lag feel with `transition` alone — no JS interpolation loop needed.

```jsx
// SpotlightCard.jsx
// Requires React 18+. No external dependencies — uses @property for native interpolation.

import { useRef, useCallback } from "react";

const styles = `
  @property --spot-x {
    syntax: "<length>";
    inherits: false;
    initial-value: -9999px;
  }

  @property --spot-y {
    syntax: "<length>";
    inherits: false;
    initial-value: -9999px;
  }

  .spotlight-card {
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    padding: 2rem 1.75rem;
    background: #141622;
    border: 1px solid #232638;
    color: #8a8fad;
    /* Lag: the gradient center trails the pointer by ~150ms */
    transition:
      --spot-x 150ms cubic-bezier(0.16, 1, 0.3, 1),
      --spot-y 150ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .spotlight-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      500px circle at var(--spot-x) var(--spot-y),
      rgba(99, 120, 255, 0.2) 0%,
      transparent 65%
    );
    pointer-events: none;
    opacity: 0;
    transition: opacity 300ms ease;
  }

  @media (hover: hover) and (pointer: fine) {
    .spotlight-card:hover::before {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spotlight-card {
      transition: none;
    }
    .spotlight-card::before {
      transition: none;
    }
  }

  .spotlight-card h2 {
    font-size: 1.05rem;
    font-weight: 600;
    color: #e8eaf6;
    margin-bottom: 0.5rem;
  }

  .spotlight-card p {
    font-size: 0.875rem;
    line-height: 1.6;
  }
`;

export function SpotlightCard({ title, description }) {
  const cardRef = useRef(null);

  const handlePointerMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }, []);

  const handlePointerLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--spot-x", "-9999px");
    card.style.setProperty("--spot-y", "-9999px");
  }, []);

  return (
    <>
      <style>{styles}</style>
      <article
        ref={cardRef}
        className="spotlight-card"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <h2>{title}</h2>
        <p>{description}</p>
      </article>
    </>
  );
}

// Usage:
// <SpotlightCard
//   title="Observability"
//   description="Distributed traces, structured logs, and real-time metrics in one surface."
// />
```

**Browser note on `@property` transition:** Works in Chrome 85+, Firefox 128+, Safari 16.4+. For Firefox below 128 or Safari below 16.4, the gradient snaps to position (no lag) — a clean progressive enhancement because the glow still tracks correctly, just without the spring feel.

## Variations

**Surface glow (brighten center)** — `radial-gradient` as `::before` background, `mix-blend-mode: overlay`. Radius 400–600px. Creates a subtle heat bloom. Works on any card background color.

**Border reveal (edge lighting)** — A narrower gradient (100–200px radius, high alpha) applied near `inset: -1px` highlights the border ring under the cursor. Often combined with surface glow: a wide dim inner glow + a tight bright border ring.

**Mask cutout reveal** — Dark overlay + `mask-image: radial-gradient(circle, black 0%, transparent 40%)` cutting a window. Dramatic. Best on heroes; requires a duplicated content layer for WCAG compliance.

**Spring lag** — Register `--x`/`--y` with `@property` as `<length>` and apply `transition: --x 150ms cubic-bezier(0.16,1,0.3,1)`. The gradient center trails the pointer, implying physical mass. More characterful than instant tracking.

**Animated idle glow** — When no pointer is present, animate the gradient position on a slow `@keyframes` loop (e.g., drifting from `30% 40%` to `70% 60%`). On pointer enter, take over with JS-driven coordinates. Requires careful `prefers-reduced-motion` handling — pause the animation entirely, do not just slow it.

**Color-reactive glow** — Tie glow hue to a data value using a registered `@property --glow-color: <color>` and update both the hue and position from JS. Common in dashboards where a metric state (warning/ok/critical) changes the card's ambient color.

## Accessibility

### prefers-reduced-motion

The glow repositions on every `pointermove` event — every frame at 60–120 fps. Even though only `opacity` and a gradient position change (no layout), continuous visual change constitutes motion under the spec. The mandatory pattern:

```css
@media (prefers-reduced-motion: reduce) {
  /* Remove the transition on opacity (the only CSS animation in this pattern) */
  .card::before {
    transition: none;
  }
  /*
    If you use @property spring-lag:
    Snap the gradient position instantly — no interpolation.
  */
  .spotlight-card {
    transition: none;
  }
}
```

The continuous pointer-driven repositioning itself is not a CSS animation, so it does not respond to `prefers-reduced-motion` automatically. If you want to disable even the instant reposition for highly sensitive users:

```js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// Skip attaching the pointermove listener if user prefers reduced motion
if (!prefersReducedMotion.matches && hasFinePointer) {
  el.addEventListener('pointermove', updateGlow);
}
// Re-evaluate if the user changes the setting mid-session
prefersReducedMotion.addEventListener('change', () => {
  if (prefersReducedMotion.matches) {
    el.removeEventListener('pointermove', updateGlow);
    el.style.removeProperty('--x');
    el.style.removeProperty('--y');
  }
});
```

### Touch and coarse-pointer fallback

Gate the entire hover layer with:

```css
@media (hover: hover) and (pointer: fine) {
  .card:hover::before { opacity: 1; }
}
```

This ensures the glow layer is invisible on touch screens, coarse-pointer devices (game controllers, some accessibility switches), and hybrid devices in touch mode. The `hover: hover` condition filters out touchscreens (which fire synthetic hover states on tap, causing a stuck glow). The `pointer: fine` condition adds a second filter for accurate pointing.

On touch devices, the card must look complete and readable in its resting state — the glow is additive, never a carrier of meaning.

### Screen readers and duplicate content

In the mask-reveal variant, the `.hero-reveal` element duplicates all visible text. Mark it `aria-hidden="true"` so screen readers do not announce the text twice. The base element remains the accessible layer. For card grids using only pseudo-elements (the surface glow variant), no duplicate content exists and no `aria-*` attributes are needed.

### Contrast

The glow layer must not reduce contrast on card text. Key rules:
- Position the `::before` glow **behind** text via `z-index: 0` on `::before` and `position: relative; z-index: 1` on text children.
- Keep glow alpha low enough that the brightest point of the gradient (center) does not push text contrast below 4.5:1. In the working code, body text `#8a8fad` on base `#141622` gives a contrast ratio of approximately 6.0:1; the glow adds at most ~12% brightness, which does not breach the threshold.
- Test with the glow fully visible at center — that is the worst case.

### Keyboard and focus

The glow is purely decorative and responds only to pointer coordinates — keyboard focus does not produce coordinates and should not trigger the glow. No special keyboard handling is required because the CSS gate (`hover:hover and pointer:fine`) and the `pointermove` listener together mean keyboard-only users never activate the effect. Ensure focus styles on cards are distinct and not suppressed to make the glow "look cleaner" — `outline: 2px solid #6378ff; outline-offset: 2px` on `:focus-visible` is the minimum.

## Performance

**Custom property writes are cheap but not free.** Setting two CSS custom properties per `pointermove` triggers a style recalculation scoped to the element — not a full-page reflow. However, on dense grids (12+ cards), updating all cards every frame on a single listener loop can accumulate. Optimization: update only the card that is actually under the pointer, not all cards simultaneously. The container-level `pointermove` listener in the working code above updates all cards for simplicity; for grids larger than six cards, `document.elementFromPoint(e.clientX, e.clientY)` scoped to `.card` is more efficient.

**No `requestAnimationFrame` batching is needed** for this pattern. CSS custom property writes via `style.setProperty` do not force synchronous layout — the browser batches style recalculations before the next frame naturally. Wrapping in `rAF` adds a frame of lag with no repaint benefit for this specific case.

**`will-change: transform` is not applicable here.** The glow is a gradient background change, not a `transform`. Adding `will-change: mask` or `will-change: background-image` to the `::before` creates a GPU layer for a pseudo-element that repaints every frame — worse than not using it. Avoid `will-change` for this pattern.

**`backdrop-filter` cost.** The mask-reveal variant using `backdrop-filter: brightness(1.2)` instead of a duplicate content layer is visually elegant but expensive: every `pointermove` forces a re-composite of the backdrop. On hardware with limited GPU bandwidth (entry-level laptops, older Macs with integrated graphics), this causes visible frame drops. Prefer the duplicate-content layer approach for production.

**`mix-blend-mode` cost.** Using `mix-blend-mode: overlay` on the `::before` glow layer creates a stacking context and requires the browser to composite the card's content against the glow layer. On a small card grid this is fine; on a page with 30+ blended layers (each card creating its own blend stacking context), frame rate degrades. Test on mid-tier hardware.

**`mask-image` and `-webkit-mask-image`.** `mask-image` is Baseline 2023 (all major engines, December 2023). On Safari 15.3 and below (now a small population), only `-webkit-mask-image` worked. Including both prefixed and unprefixed forms in the working code above covers the realistic device distribution as of mid-2025.

## Anti-slop

The slop blocklist (Surface): "glow/neon everywhere — one focal glow."

The cliche version: every card on the page has a vivid neon glow in the trendy indigo-to-pink gradient (`#6366f1` → `#ec4899`) at full opacity, running on every page including ones with light backgrounds and dark text, at a radius so large the glow bleeds between cards and creates a uniform purple smear. The `::before` is not `pointer-events: none`, so it blocks clicks. The effect fires on mobile, producing a stuck glow on every tapped card.

The tasteful alternative: one card zone per page carries the glow — typically the primary CTA card or the hero. The glow color is a single restrained hue derived from the brand's actual color, not a rainbow gradient. The radius stays within the card boundary. The glow is additive (brightens what is there), never a replacement for border or shadow. On touch devices, the resting card has its own static border treatment that does not depend on the glow to look finished. The `pointer: fine` gate is non-negotiable.

Cross-reference: this pairs with the "glassmorphism on every card" cliche — do not combine a backdrop-filter glass card with a cursor glow; both are compositor-heavy and the combination reads as visual noise. Pick one surface treatment per card type.

## Pairs well with

- **`gradient-mesh-aurora`** (this folder) — the aurora provides the ambient background field; the spotlight glow on top of cards creates a layered depth where the card surface and the background seem to be lit by different sources.
- **`css-gradients`** (this folder) — the card's resting border gradient and the spotlight glow share the same color language; registering both as `@property` values lets you transition between resting and active state with one unified animation.
- **`staggered-entrance`** — cards that fly in on load and then respond to the cursor feel like objects that arrived and settled; the entrance and the glow share the same easing function (`cubic-bezier(0.16,1,0.3,1)`) for visual coherence.
- **`text-reveal-on-scroll`** (library/02-scroll-motion) — the spotlight pattern pairs well on hero sections: the text reveals as the user scrolls in, then the surface glow activates when they hover to read more. Two modes of reward for two modes of engagement.
- **`bento-grid-layout`** — spotlight glows are most impactful on a bento grid where each card has a distinct background; the glow differentiates cards spatially as the pointer moves across the grid.

## Current references

- [How to build a glowing hover effect that follows the pointer — Frontend Masters](https://frontendmasters.com/blog/glowing-hover-effect/) — the definitive vanilla implementation using `mask-image` + `--x/--y`, with the dual-layer DOM structure; 2024
- [CSS spotlight effect — Frontend Masters](https://frontendmasters.com/blog/css-spotlight-effect/) — `fixed`-position overlay, `mix-blend-mode`, touch/keyboard handling patterns, color-scheme-aware glow; 2024
- [Dynamic CSS masks with custom properties and GSAP — Codrops](https://tympanus.net/codrops/2021/05/04/dynamic-css-masks-with-custom-properties-and-gsap/) — mask-image + GSAP interpolation vs @property for cross-browser spring lag [foundational, pre-range — no 2024+ equivalent covers the GSAP-vs-@property comparison in this depth; @property was not Baseline at time of writing so the contrast remains instructive]
- [@property: next-gen CSS variables now with universal browser support — web.dev](https://web.dev/blog/at-property-baseline) — confirms Baseline July 2024 status; shows animating custom properties inside gradients
- [A guide to hover and pointer media queries — Smashing Magazine](https://www.smashingmagazine.com/2022/03/guide-hover-pointer-media-queries/) — `hover:hover`, `pointer:fine`, `any-hover`, `any-pointer` explained with device taxonomy; essential for touch fallback logic [foundational, pre-range — MDN's Interaction Media Features page is the current authoritative reference; the Smashing article remains the most comprehensive device taxonomy explanation available]
- [Interaction Media Features — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover) — current authoritative reference for `hover`, `any-hover`, `pointer`, and `any-pointer` media features with up-to-date browser support tables
- [Spotlight card hover effect with Tailwind — Cruip](https://cruip.com/how-to-create-a-spotlight-card-hover-effect-with-tailwind-css/) — `getBoundingClientRect()` pattern for per-card coordinate mapping across a shared container; 2024
- [mask-image — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image) — syntax, `-webkit-` prefix status, Baseline 2023 support table
- [@property — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) — syntax, `<length>` registration, `initial-value` rules, browser support
- [requestAnimationFrame — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) — frame-timing reference; explains why rAF batching is unnecessary for style.setProperty writes
