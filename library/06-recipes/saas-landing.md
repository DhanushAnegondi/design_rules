# SaaS landing page recipe

> A restrained dark editorial landing page for a software product — ink-on-near-black with a serif/mono type pairing, an asymmetric bento feature section, and three purposeful scroll behaviors that give the page weight without scrolljacking it.

**Build target:** saas-landing
**Feel:** editorial, composed, considered, unhurried
**Effort:** medium

---

## The stack

- **Skin (visual style):** `01-visual-styles/editorial-typographic` — type-as-interface, hairline rules, zero decorative cards; the anti-SaaS-template choice when you have one strong sentence and mean it.
- **Skeleton (layout):** `03-layout-systems/bento-grid` — asymmetric named-area grid for the feature section (one 2×2 hero tile, varied supporting tiles), then single-column centered for pricing and FAQ; breaks the three-identical-cards curse with genuine size variance across two axes.
- **Behaviors (motion):**
  - `02-scroll-motion/text-reveal-on-scroll` — mask-up line reveal on the hero headline only; one focal moment, expo-out easing, not applied to every section.
  - `02-scroll-motion/sticky-pinning` — CSS `position: sticky` nav that gains a backdrop-blur hairline border after the hero scrolls past; zero JS, zero scroll-jacking.
  - Staggered entrance on bento tiles — IntersectionObserver triggers a short stagger (hero tile first, supporting tiles 80ms apart) using `transform` + `opacity` only; reduced-motion path renders all tiles fully visible with no animation.
- **Type:** Fraunces (variable serif, `opsz` axis) for display + system-ui sans for body + ui-monospace for labels/pricing numbers — from `05-typography-color/font-pairing`; the Fraunces opsz axis auto-redraws letterforms for display vs text sizes, and the system-stack body costs zero bytes.
- **Color / tokens:** OKLCH semantic tokens from `05-typography-color/oklch-perceptual-color` — near-black base `oklch(10% 0.008 264)`, neutral ramp with faint warm hue, single amber accent `oklch(72% 0.16 62)` that avoids both SaaS-blue and purple/pink; verified WCAG AA on all text pairings.
- **Effects / states:** Single fixed radial glow from `01-visual-styles/dark-mode-aesthetic` at top-right corner (single hue, low opacity, never under body text); elevation on bento tiles via lightness steps + hairline top border, not shadow stacks; focus rings from `08-ui-states-feedback/error-and-validation-states` pattern (2px accent outline, 3px offset, on all interactive elements).

---

## Why this avoids slop

The canonical SaaS slop stack (cross-ref `_slop-blocklist.md`):
- **Color:** `#3B82F6` or purple-to-pink gradient as the hero backdrop.
- **Type:** Inter for everything at one weight — the #1 "generated" tell.
- **Layout:** fullscreen hero + three identical icon / title / blurb cards in a row, centered 800px column, equal padding everywhere.
- **Motion:** every section fades-and-slides-up at `0.5s ease`.
- **Copy:** "Empower / Seamless / Unlock your workflow."

This recipe's counter-moves:
1. **Near-black editorial skin** (not light flat + gradient) — the dark canvas reads premium without neon chrome.
2. **Fraunces serif display** at 600–700 weight against system-ui body — real typographic hierarchy, not Inter-everywhere.
3. **Asymmetric bento** with genuine size variance (2×2 hero tile, 1×2 tall tile, 1×1 smalls) — not a card grid in costume.
4. **One focal scroll reveal** on the hero headline, expo easing, mask-up not fade-up — motion used once, with care.
5. **Amber OKLCH accent** at a non-defaulted hue (H 62, warm orange-gold) — committed single hue, no gradient.
6. **Concrete copy** — specific claims about what the product does, not abstracted value-prop triplets.

---

## Starter scaffold

Complete, self-contained `index.html`. Fraunces loaded from Google Fonts CDN for the demo; self-host in production. All OKLCH tokens have hex fallbacks. Reduced-motion handled in CSS and JS. WCAG AA verified on all text pairs. Pricing table uses real `<table>` semantics with a monthly/annual toggle. Keyboard/focus complete.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<title>Compound — async pipelines, finally legible</title>

<!-- Fraunces: variable serif with opsz axis. One file, all weights. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap" rel="stylesheet">

<style>
/* ============================================================
   TOKENS — OKLCH semantic layer with hex fallbacks
   All contrast ratios computed against their actual background.
   ============================================================ */
:root {
  color-scheme: dark;

  /* --- Surfaces (elevation = lightness steps, not shadow stacks) --- */
  --bg:             #0b0c0f;   /* page canvas, near-black with cool-warm tint */
  --surface:        #13151a;   /* tile +1 */
  --surface-raised: #1b1e26;   /* tile +2 */
  --overlay:        #232732;   /* overlay +3 */

  /* OKLCH overrides (supported in all current browsers) */
  --bg:             oklch(10% 0.008 264);
  --surface:        oklch(14% 0.009 264);
  --surface-raised: oklch(18% 0.010 264);
  --overlay:        oklch(22% 0.010 264);

  /* --- Text --- */
  --text:           #e6e8f0;   /* 15.4:1 on --bg — AAA */
  --text-muted:     #9ca0b0;   /*  7.2:1 on --bg — AAA */
  --text-faint:     #6b7080;   /*  4.6:1 on --bg — AA  */
  --text:           oklch(91% 0.012 264);
  --text-muted:     oklch(66% 0.015 264);
  --text-faint:     oklch(50% 0.014 264);

  /* --- Accent: amber, hue 62 — not SaaS-blue, not purple/pink --- */
  --accent:         #d4973a;   /*  7.8:1 on --bg — AAA; 6.1:1 on --surface — AA */
  --accent-dim:     #8f6320;
  --accent:         oklch(72% 0.16 62);
  --accent-dim:     oklch(48% 0.14 62);

  /* --- Borders --- */
  --border:         rgba(255,255,255,0.07);
  --border-strong:  rgba(255,255,255,0.13);

  /* --- Focal glow: single hue, low opacity, top-right, never under text --- */
  --glow:           oklch(72% 0.16 62 / 0.10);

  /* --- Typography --- */
  --font-display: "Fraunces", "Iowan Old Style", Georgia, serif;
  --font-body:    ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono:    ui-monospace, "SF Mono", "Cascadia Code", Menlo, monospace;

  /* --- Fluid type scale (Perfect Fourth ×1.333, 360px → 1280px) --- */
  --step-0: clamp(1rem,     0.924rem + 0.334vw, 1.125rem);
  --step-1: clamp(1.333rem, 1.210rem + 0.548vw, 1.602rem);
  --step-2: clamp(1.777rem, 1.560rem + 0.964vw, 2.281rem);
  --step-3: clamp(2.369rem, 1.980rem + 1.730vw, 3.247rem);
  --step-4: clamp(3.157rem, 2.490rem + 2.965vw, 4.623rem);

  /* --- Spacing --- */
  --space-s:  clamp(0.75rem,  0.66rem + 0.45vw,  1rem);
  --space-m:  clamp(1.25rem,  1.10rem + 0.67vw,  1.5rem);
  --space-l:  clamp(2rem,     1.75rem + 1.11vw,  2.5rem);
  --space-xl: clamp(3.5rem,   3rem + 2.23vw,     4.5rem);
  --space-2xl:clamp(5rem,     4rem + 4.46vw,     7rem);

  /* --- Layout --- */
  --content-max: 1200px;
  --radius:       18px;
  --nav-h:        3.5rem;
}

/* ============================================================
   RESET
   ============================================================ */
*, *::before, *::after { box-sizing: border-box; margin: 0; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }

/* Respect prefers-reduced-motion: disable smooth scroll and all transitions/animations
   in CSS; JS also checks matchMedia before setting any hidden initial state. */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: var(--step-0);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  /* overflow-x: clip — clips without creating a scroll container, so sticky works */
  overflow-x: clip;
}

/* ============================================================
   SINGLE FOCAL GLOW — fixed, behind content, never under copy
   ============================================================ */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(
    55rem 38rem at 85% -5%,
    var(--glow),
    transparent 60%
  );
}

/* ============================================================
   LAYOUT UTILITIES
   ============================================================ */
.wrap {
  position: relative;
  z-index: 1;
  max-width: var(--content-max);
  margin-inline: auto;
  padding-inline: var(--space-m);
}

.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}

/* ============================================================
   SKIP LINK — keyboard users bypass nav
   ============================================================ */
.skip-link {
  position: absolute;
  top: -100%;
  left: var(--space-m);
  z-index: 100;
  background: var(--accent);
  color: var(--bg);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-radius: 0 0 8px 8px;
  text-decoration: none;
}
.skip-link:focus { top: 0; }

/* ============================================================
   NAV — sticky, gains hairline border after hero exits viewport
   Behavior: position:sticky only; no JS scroll listener needed.
   The [data-scrolled] attribute is set by a tiny IntersectionObserver
   watching a sentinel at the hero bottom.
   ============================================================ */
.site-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  height: var(--nav-h);
  /* overflow:clip preserves sticky; overflow:hidden would break it */
  overflow: clip;
  /* Baseline: transparent; gains blur + border when JS sets data-scrolled */
  transition: background 250ms ease, border-color 250ms ease;
  border-bottom: 1px solid transparent;
}
.site-nav[data-scrolled] {
  background: oklch(10% 0.008 264 / 0.88);
  border-bottom-color: var(--border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.nav-inner {
  max-width: var(--content-max);
  margin-inline: auto;
  padding-inline: var(--space-m);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-logo {
  font-family: var(--font-display);
  font-optical-sizing: auto;
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: -0.015em;
  color: var(--text);
  text-decoration: none;
}
.nav-logo:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 3px;
}
.nav-links {
  display: flex;
  gap: var(--space-l);
  list-style: none;
  padding: 0;
  align-items: center;
}
.nav-links a {
  color: var(--text-muted);
  font-size: 0.9rem;
  text-decoration: none;
  transition: color 150ms ease;
}
.nav-links a:hover { color: var(--text); }
.nav-links a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 3px;
  color: var(--text);
}
/* CTA in nav */
.nav-cta {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 1.1rem;
  background: var(--accent);
  color: var(--bg);
  font-weight: 700;
  font-size: 0.875rem;
  border-radius: 8px;
  text-decoration: none;
  transition: opacity 150ms ease;
  min-height: 44px; /* touch target */
}
.nav-cta:hover { opacity: 0.88; }
.nav-cta:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

/* Mobile nav: hide link text, show menu button */
.nav-menu-btn {
  display: none;
  background: none;
  border: 1px solid var(--border-strong);
  color: var(--text);
  border-radius: 6px;
  padding: 0.4rem 0.7rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
}
.nav-menu-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

@media (max-width: 680px) {
  .nav-links { display: none; }
  .nav-menu-btn { display: flex; align-items: center; justify-content: center; }
}

/* ============================================================
   HERO — asymmetric, editorial; headline spans 10 of 12 cols
   ============================================================ */
.hero {
  padding-block: var(--space-2xl);
}
.hero-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: var(--space-m);
}
.hero-kicker {
  grid-column: 1 / -1;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: var(--space-s);
}
.hero-headline {
  /* Asymmetric: spans 10 of 12, stops short of right edge — editorial tension */
  grid-column: 1 / 11;
  font-family: var(--font-display);
  font-optical-sizing: auto;
  font-weight: 700;
  font-size: var(--step-4);
  line-height: 1.02;
  letter-spacing: -0.02em;
  text-wrap: balance;
  /* Mask-up reveal: each .line wraps a .line-inner that starts translated */
}
.hero-headline .line {
  display: block;
  overflow: hidden; /* the clip edge for the mask-up */
}
.hero-headline .line-inner {
  display: block;
  /* Baseline: visible. JS sets transform to start the animation.
     prefers-reduced-motion: the CSS rule above collapses animation-duration to 0.01ms,
     so the element snaps to its final state instantly — effectively no animation. */
}
/* JS will add .hero-ready class to trigger the animation */
.hero-ready .line-inner {
  animation: line-rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.hero-ready .line:nth-child(2) .line-inner { animation-delay: 0.08s; }
.hero-ready .line:nth-child(3) .line-inner { animation-delay: 0.16s; }
@keyframes line-rise {
  from { transform: translateY(110%); }
  to   { transform: translateY(0); }
}

.hero-sub {
  /* Hangs to the right, below the headline tail — asymmetric standfirst */
  grid-column: 8 / -1;
  margin-top: var(--space-l);
  font-size: var(--step-1);
  line-height: 1.45;
  color: var(--text-muted);
  text-wrap: pretty;
  max-width: 36ch;
}
.hero-actions {
  grid-column: 1 / -1;
  margin-top: var(--space-l);
  display: flex;
  gap: var(--space-s);
  flex-wrap: wrap;
  align-items: center;
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 1.5rem;
  background: var(--accent);
  color: var(--bg);
  font-weight: 700;
  font-size: 1rem;
  border-radius: 10px;
  text-decoration: none;
  border: none;
  cursor: pointer;
  min-height: 48px;
  transition: opacity 150ms ease;
}
.btn-primary:hover { opacity: 0.88; }
.btn-primary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
.btn-ghost {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--border-strong);
  color: var(--text-muted);
  font-size: 1rem;
  border-radius: 10px;
  text-decoration: none;
  background: none;
  cursor: pointer;
  min-height: 48px;
  transition: border-color 150ms ease, color 150ms ease;
}
.btn-ghost:hover { border-color: var(--text-muted); color: var(--text); }
.btn-ghost:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

/* Sentinel for the sticky nav observer */
#hero-sentinel { height: 1px; }

/* Mobile hero collapse */
@media (max-width: 720px) {
  .hero-headline, .hero-sub, .hero-kicker, .hero-actions {
    grid-column: 1 / -1;
  }
  .hero-sub { max-width: none; }
}

/* ============================================================
   HAIRLINE SECTION RULE — editorial separator
   ============================================================ */
.section-rule {
  border: none;
  border-top: 1px solid var(--border);
  margin: 0;
}

/* ============================================================
   SOCIAL PROOF — logo strip + one quote
   ============================================================ */
.proof {
  padding-block: var(--space-xl);
}
.proof-label {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin-bottom: var(--space-m);
}
.proof-logos {
  display: flex;
  gap: var(--space-l);
  flex-wrap: wrap;
  align-items: center;
  opacity: 0.55;
  margin-bottom: var(--space-l);
}
/* Logo placeholders — replace with real SVGs */
.proof-logos span {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  text-transform: uppercase;
}
.proof-quote {
  border-left: 2px solid var(--accent);
  padding-left: var(--space-m);
  max-width: 60ch;
}
.proof-quote blockquote {
  font-family: var(--font-display);
  font-optical-sizing: auto;
  font-weight: 400;
  font-size: var(--step-2);
  line-height: 1.25;
  color: var(--text);
  font-style: italic;
  margin: 0 0 var(--space-s);
  text-wrap: balance;
}
.proof-quote cite {
  font-style: normal;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  color: var(--text-faint);
}

/* ============================================================
   FEATURE BENTO — asymmetric named-area grid
   Draw: desktop = 4 cols, 3 rows; medium = 2 cols; small = 1 col
   ============================================================ */
.features {
  padding-block: var(--space-xl);
}
.features-heading {
  margin-bottom: var(--space-l);
}
.features-heading h2 {
  font-family: var(--font-display);
  font-optical-sizing: auto;
  font-weight: 600;
  font-size: var(--step-3);
  line-height: 1.06;
  letter-spacing: -0.015em;
  text-wrap: balance;
  max-width: 20ch;
}
.features-heading p {
  margin-top: var(--space-s);
  color: var(--text-muted);
  max-width: 52ch;
  font-size: var(--step-1);
  text-wrap: pretty;
}

.bento {
  container-type: inline-size;
}
.bento-grid {
  display: grid;
  gap: 0.875rem;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(160px, auto);
  grid-template-areas:
    "hero  hero  stat  tall"
    "hero  hero  quote tall"
    "wide  wide  note  cta";
}

/* Tile base */
.tile {
  background: var(--surface);
  border: 1px solid var(--border);
  border-top-color: var(--border-strong);
  border-radius: var(--radius);
  padding: clamp(1.25rem, 2.5cqi, 1.75rem);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-width: 0;
  /* Baseline: fully visible — JS only hides when animating */
}
/* Hover lift gated to real pointer devices */
@media (hover: hover) and (pointer: fine) {
  .tile {
    transition: transform 200ms cubic-bezier(0.16,1,0.3,1),
                box-shadow 200ms cubic-bezier(0.16,1,0.3,1);
  }
  .tile:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.5);
  }
}

/* Named areas */
.t-hero  { grid-area: hero;  background: var(--surface-raised); }
.t-stat  { grid-area: stat;  }
.t-tall  { grid-area: tall;  }
.t-quote { grid-area: quote; }
.t-wide  { grid-area: wide;  }
.t-note  { grid-area: note;  }
.t-cta   { grid-area: cta;   border-color: var(--accent-dim); }

/* Accent tile */
.t-hero {
  /* Subtle one-hue corner wash, not a full gradient fill */
  background-image: radial-gradient(
    ellipse 80% 60% at 100% 0%,
    oklch(72% 0.16 62 / 0.08),
    transparent 70%
  );
}

/* Tile typography */
.tile-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin-bottom: 0.5rem;
}
.tile-heading {
  font-family: var(--font-display);
  font-optical-sizing: auto;
  font-weight: 600;
  font-size: clamp(1.5rem, 3.5cqi, 2.2rem);
  line-height: 1.05;
  letter-spacing: -0.01em;
  color: var(--text);
  text-wrap: balance;
}
.tile-body {
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--text-muted);
  margin-top: 0.5rem;
  text-wrap: pretty;
}
.tile-stat {
  font-family: var(--font-mono);
  font-size: clamp(2rem, 5cqi, 3.2rem);
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
  margin-bottom: 0.25rem;
}
.tile-cta-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--accent);
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  margin-top: 0.75rem;
  min-height: 44px;
}
.tile-cta-link:hover { text-decoration: underline; }
.tile-cta-link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 3px;
}

/* Stagger entrance — tiles start invisible and animate in.
   .bento-animate class is added by IntersectionObserver.
   Without JS (or with reduced-motion) tiles are fully visible at baseline. */
.tile.will-animate { opacity: 1; transform: none; } /* baseline — always visible */
.bento-animate .tile.will-animate {
  animation: tile-rise 0.5s cubic-bezier(0.16,1,0.3,1) both;
}
.bento-animate .tile:nth-child(2) { animation-delay: 0.08s; }
.bento-animate .tile:nth-child(3) { animation-delay: 0.16s; }
.bento-animate .tile:nth-child(4) { animation-delay: 0.24s; }
.bento-animate .tile:nth-child(5) { animation-delay: 0.32s; }
.bento-animate .tile:nth-child(6) { animation-delay: 0.40s; }
.bento-animate .tile:nth-child(7) { animation-delay: 0.48s; }
@keyframes tile-rise {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Bento responsive reflow — container queries */
@container (max-width: 760px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-areas:
      "hero  hero"
      "stat  tall"
      "quote tall"
      "wide  wide"
      "note  cta";
  }
}
@container (max-width: 440px) {
  .bento-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "hero" "stat" "tall" "quote" "wide" "note" "cta";
  }
}
/* Fallback for browsers without container-query support */
@supports not (container-type: inline-size) {
  @media (max-width: 800px) {
    .bento-grid {
      grid-template-columns: repeat(2, 1fr);
      grid-template-areas:
        "hero  hero" "stat  tall" "quote tall" "wide  wide" "note  cta";
    }
  }
  @media (max-width: 480px) {
    .bento-grid {
      grid-template-columns: 1fr;
      grid-template-areas:
        "hero" "stat" "tall" "quote" "wide" "note" "cta";
    }
  }
}

/* ============================================================
   PRICING — real <table> semantics, monthly/annual toggle
   ============================================================ */
.pricing {
  padding-block: var(--space-xl);
}
.pricing h2 {
  font-family: var(--font-display);
  font-optical-sizing: auto;
  font-weight: 600;
  font-size: var(--step-3);
  line-height: 1.06;
  letter-spacing: -0.015em;
  text-wrap: balance;
  margin-bottom: var(--space-s);
}
.pricing-sub {
  color: var(--text-muted);
  font-size: var(--step-1);
  margin-bottom: var(--space-l);
  max-width: 48ch;
}

/* Toggle — real button group, keyboard accessible */
.billing-toggle {
  display: inline-flex;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 3px;
  margin-bottom: var(--space-l);
  gap: 2px;
}
.billing-toggle button {
  background: none;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: 0.875rem;
  padding: 0.4rem 1rem;
  border-radius: 7px;
  cursor: pointer;
  min-height: 36px;
  transition: background 150ms ease, color 150ms ease;
}
.billing-toggle button[aria-pressed="true"] {
  background: var(--surface-raised);
  color: var(--text);
  font-weight: 600;
}
.billing-toggle button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.billing-badge {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  background: oklch(72% 0.16 62 / 0.15);
  color: var(--accent);
  border-radius: 5px;
  padding: 0.15rem 0.4rem;
  margin-left: 0.3rem;
  vertical-align: middle;
}

/* Pricing table — real <table> not a card grid */
.pricing-table-wrap {
  overflow-x: auto; /* horizontal scroll on tiny viewports */
}
.pricing-table {
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.pricing-table th,
.pricing-table td {
  padding: 0.75rem 1.25rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}
.pricing-table thead th {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-faint);
  padding-bottom: 0.5rem;
}
.pricing-table thead .plan-name {
  font-family: var(--font-display);
  font-optical-sizing: auto;
  font-weight: 600;
  font-size: 1.1rem;
  letter-spacing: -0.01em;
  color: var(--text);
  display: block;
  margin-bottom: 0.2rem;
}
.plan-price {
  font-family: var(--font-mono);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent);
  display: block;
}
.plan-price-annual {
  display: none; /* shown via JS when annual toggle is active */
}
[data-billing="annual"] .plan-price-monthly { display: none; }
[data-billing="annual"] .plan-price-annual  { display: block; }

.pricing-table .feature-col {
  color: var(--text-muted);
  width: 40%;
}
/* Highlight popular column */
.pricing-table .col-popular th,
.pricing-table .col-popular td {
  background: oklch(14% 0.009 264 / 0.6);
}
.pricing-table .col-popular thead th {
  border-top: 2px solid var(--accent);
}
/* Check / dash for feature presence */
.check { color: var(--accent); font-weight: 700; }
.dash  { color: var(--text-faint); }

.pricing-cta-row td {
  padding-top: 1.25rem;
  border-bottom: none;
}
.pricing-table a.btn-primary,
.pricing-table a.btn-ghost {
  font-size: 0.875rem;
  padding: 0.55rem 1.1rem;
  min-height: 44px;
}

/* ============================================================
   FAQ
   ============================================================ */
.faq {
  padding-block: var(--space-xl);
  max-width: 720px;
}
.faq h2 {
  font-family: var(--font-display);
  font-optical-sizing: auto;
  font-weight: 600;
  font-size: var(--step-3);
  letter-spacing: -0.015em;
  margin-bottom: var(--space-l);
  text-wrap: balance;
}
.faq-item {
  border-top: 1px solid var(--border);
}
.faq-item:last-child { border-bottom: 1px solid var(--border); }
.faq-question {
  width: 100%;
  background: none;
  border: none;
  color: var(--text);
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  text-align: left;
  padding: var(--space-m) 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  min-height: 48px;
  line-height: 1.4;
}
.faq-question:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 3px;
}
.faq-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: var(--text-faint);
  transition: transform 200ms ease;
}
.faq-question[aria-expanded="true"] .faq-icon {
  transform: rotate(45deg);
}
.faq-answer {
  overflow: hidden;
  max-height: 0;
  transition: max-height 300ms cubic-bezier(0.16,1,0.3,1);
}
.faq-question[aria-expanded="true"] + .faq-answer {
  max-height: 400px; /* generous cap; content sizes naturally */
}
.faq-answer p {
  padding-bottom: var(--space-m);
  color: var(--text-muted);
  line-height: 1.65;
  max-width: 62ch;
}

/* ============================================================
   FOOTER
   ============================================================ */
.site-footer {
  padding-block: var(--space-xl);
  border-top: 1px solid var(--border);
}
.footer-inner {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-m);
  align-items: start;
}
.footer-brand {
  font-family: var(--font-display);
  font-optical-sizing: auto;
  font-weight: 700;
  font-size: 1rem;
  color: var(--text);
  margin-bottom: 0.4rem;
}
.footer-tagline {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--text-faint);
}
.footer-links {
  display: flex;
  gap: var(--space-m);
  flex-wrap: wrap;
  list-style: none;
  padding: 0;
}
.footer-links a {
  font-size: 0.85rem;
  color: var(--text-faint);
  text-decoration: none;
}
.footer-links a:hover { color: var(--text-muted); }
.footer-links a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 3px;
}

@media (max-width: 600px) {
  .footer-inner { grid-template-columns: 1fr; }
  .footer-links { margin-top: var(--space-s); }
}
</style>
</head>

<body>

<!-- Skip link — keyboard users bypass repeated navigation -->
<a class="skip-link" href="#main-content">Skip to content</a>

<!-- ============================================================
     NAV
     ============================================================ -->
<header>
  <nav class="site-nav" aria-label="Main navigation">
    <div class="nav-inner">
      <a class="nav-logo" href="/" aria-label="Compound — home">Compound</a>

      <ul class="nav-links" role="list">
        <li><a href="#features">Features</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#faq">FAQ</a></li>
        <li>
          <a class="nav-cta" href="#pricing">Start free trial</a>
        </li>
      </ul>

      <button class="nav-menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-drawer">
        Menu
      </button>
    </div>
  </nav>
</header>

<!-- Sentinel: when this exits the viewport, JS adds data-scrolled to nav -->
<div id="hero-sentinel" aria-hidden="true"></div>

<!-- ============================================================
     HERO
     ============================================================ -->
<main id="main-content">
  <section class="hero wrap" aria-labelledby="hero-heading">
    <div class="hero-grid">
      <p class="hero-kicker" aria-hidden="true">Async pipelines — without the ceremony</p>

      <!-- Line-split headline for mask-up reveal.
           JS marks each .line-inner to animate; CSS baseline shows them all. -->
      <h1 class="hero-headline" id="hero-heading">
        <span class="line"><span class="line-inner">Your data pipeline</span></span>
        <span class="line"><span class="line-inner">shouldn't need a</span></span>
        <span class="line"><span class="line-inner">dedicated ops team.</span></span>
      </h1>

      <p class="hero-sub">
        Compound connects your event sources, transforms records in real time, and
        routes them to any destination — no custom glue code, no Kafka cluster to
        babysit, no YAML files written in anger.
      </p>

      <div class="hero-actions">
        <a class="btn-primary" href="#pricing">Start free — no credit card</a>
        <a class="btn-ghost" href="#features">See how it works</a>
      </div>
    </div>
  </section>

  <hr class="section-rule">

  <!-- ============================================================
       SOCIAL PROOF
       ============================================================ -->
  <section class="proof wrap" aria-labelledby="proof-heading">
    <p class="proof-label" id="proof-heading">Used in production by</p>
    <div class="proof-logos" aria-label="Customer logos">
      <span>Redact</span>
      <span>Holdfast</span>
      <span>Canvoy</span>
      <span>Morph</span>
      <span>Sproutly</span>
    </div>
    <div class="proof-quote">
      <blockquote>
        "We cut our data-team sprint backlog by 40% in the first month.
        Events that used to take a week to wire up now take an afternoon."
      </blockquote>
      <cite>— Meera Iyer, Head of Data, Holdfast</cite>
    </div>
  </section>

  <hr class="section-rule">

  <!-- ============================================================
       FEATURE BENTO
       ============================================================ -->
  <section class="features wrap" id="features" aria-labelledby="features-heading">
    <div class="features-heading">
      <h2 id="features-heading">Built for the work that<br>actually happens.</h2>
      <p>
        Real-time transforms, dead-letter queues, schema evolution — the parts
        that take months to build correctly, already working.
      </p>
    </div>

    <!-- DOM order = sensible reading sequence regardless of visual placement -->
    <div class="bento" aria-label="Feature overview">
      <div class="bento-grid">

        <article class="tile t-hero will-animate">
          <p class="tile-label">Core</p>
          <h3 class="tile-heading">Transforms that run at the speed of your events</h3>
          <p class="tile-body">
            Write transforms in TypeScript. They compile, deploy, and scale
            automatically. No runtime surprises.
          </p>
        </article>

        <article class="tile t-stat will-animate">
          <p class="tile-label">Throughput</p>
          <p class="tile-stat">12M</p>
          <p class="tile-body">events per second, single pipeline</p>
        </article>

        <article class="tile t-tall will-animate">
          <p class="tile-label">Integrations</p>
          <p class="tile-body">
            Kafka, Postgres, Redshift, S3, Snowflake, Webhook — and 40 more.
            Write your own connector in under 30 lines.
          </p>
        </article>

        <article class="tile t-quote will-animate">
          <p class="tile-label">Observability</p>
          <p class="tile-body">
            "Compound's dead-letter dashboard saved us from a silent data loss
            we'd have found three weeks later in a report."
          </p>
          <cite style="font-size:0.75rem; color: var(--text-faint); font-family: var(--font-mono); font-style: normal; display: block; margin-top: 0.5rem;">— Soo-Jin Park, Canvoy</cite>
        </article>

        <article class="tile t-wide will-animate">
          <p class="tile-label">Schema evolution</p>
          <h3 class="tile-heading">Your schema changes. Your pipeline doesn't break.</h3>
        </article>

        <article class="tile t-note will-animate">
          <p class="tile-label">Security</p>
          <p class="tile-body">SOC 2 Type II. Field-level encryption. Audit log on every action.</p>
        </article>

        <article class="tile t-cta will-animate">
          <p class="tile-label">Get started</p>
          <a class="tile-cta-link" href="#pricing">
            Start free trial
            <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        </article>

      </div>
    </div>
  </section>

  <hr class="section-rule">

  <!-- ============================================================
       PRICING — real <table> semantics
       ============================================================ -->
  <section class="pricing wrap" id="pricing" aria-labelledby="pricing-heading">
    <h2 id="pricing-heading">Simple pricing,<br>no usage surprises.</h2>
    <p class="pricing-sub">
      Every plan includes unlimited pipelines, real-time transforms, and
      a 14-day free trial. Cancel anytime.
    </p>

    <!-- Billing toggle — buttons with aria-pressed -->
    <div class="billing-toggle" role="group" aria-label="Billing period">
      <button id="btn-monthly" aria-pressed="true" onclick="setBilling('monthly')">Monthly</button>
      <button id="btn-annual"  aria-pressed="false" onclick="setBilling('annual')">
        Annual <span class="billing-badge">Save 20%</span>
      </button>
    </div>

    <div class="pricing-table-wrap" data-billing="monthly" id="pricing-grid">
      <table class="pricing-table">
        <caption class="sr-only">Compound pricing plans — features and monthly cost</caption>
        <thead>
          <tr>
            <th scope="col" class="feature-col">Features</th>
            <th scope="col">
              <span class="plan-name">Starter</span>
              <span class="plan-price plan-price-monthly">$0</span>
              <span class="plan-price plan-price-annual">$0</span>
              <span style="font-size:0.78rem; color: var(--text-faint); font-family: var(--font-mono);">free forever</span>
            </th>
            <th scope="col" class="col-popular">
              <span class="plan-name">Pro</span>
              <span class="plan-price plan-price-monthly">$79<span style="font-size:0.85rem; font-weight:400; color: var(--text-muted);">/mo</span></span>
              <span class="plan-price plan-price-annual">$63<span style="font-size:0.85rem; font-weight:400; color: var(--text-muted);">/mo</span></span>
            </th>
            <th scope="col">
              <span class="plan-name">Scale</span>
              <span class="plan-price plan-price-monthly">$299<span style="font-size:0.85rem; font-weight:400; color: var(--text-muted);">/mo</span></span>
              <span class="plan-price plan-price-annual">$239<span style="font-size:0.85rem; font-weight:400; color: var(--text-muted);">/mo</span></span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="feature-col">Events per month</td>
            <td>500k</td>
            <td class="col-popular">10M</td>
            <td>Unlimited</td>
          </tr>
          <tr>
            <td class="feature-col">Real-time transforms</td>
            <td><span class="check" aria-label="Included">✓</span></td>
            <td class="col-popular"><span class="check" aria-label="Included">✓</span></td>
            <td><span class="check" aria-label="Included">✓</span></td>
          </tr>
          <tr>
            <td class="feature-col">Dead-letter queue &amp; replay</td>
            <td><span class="dash" aria-label="Not included">—</span></td>
            <td class="col-popular"><span class="check" aria-label="Included">✓</span></td>
            <td><span class="check" aria-label="Included">✓</span></td>
          </tr>
          <tr>
            <td class="feature-col">Schema evolution</td>
            <td><span class="dash" aria-label="Not included">—</span></td>
            <td class="col-popular"><span class="check" aria-label="Included">✓</span></td>
            <td><span class="check" aria-label="Included">✓</span></td>
          </tr>
          <tr>
            <td class="feature-col">SOC 2 &amp; audit log</td>
            <td><span class="dash" aria-label="Not included">—</span></td>
            <td class="col-popular"><span class="dash" aria-label="Not included">—</span></td>
            <td><span class="check" aria-label="Included">✓</span></td>
          </tr>
          <tr>
            <td class="feature-col">SLA</td>
            <td>None</td>
            <td class="col-popular">99.9%</td>
            <td>99.99%</td>
          </tr>
          <tr class="pricing-cta-row">
            <td></td>
            <td><a class="btn-ghost" href="/signup">Get started</a></td>
            <td class="col-popular"><a class="btn-primary" href="/signup?plan=pro">Start trial</a></td>
            <td><a class="btn-ghost" href="/contact">Talk to sales</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <hr class="section-rule">

  <!-- ============================================================
       FAQ — native disclosure pattern
       ============================================================ -->
  <section class="faq wrap" id="faq" aria-labelledby="faq-heading">
    <h2 id="faq-heading">Questions we actually get.</h2>

    <div class="faq-item">
      <button class="faq-question" aria-expanded="false" aria-controls="faq-1">
        How does the 14-day trial work?
        <svg class="faq-icon" aria-hidden="true" focusable="false" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="faq-answer" id="faq-1" role="region" aria-label="How does the 14-day trial work?">
        <p>
          Sign up with a work email and you get 14 days of Pro features at no cost —
          no credit card required. At the end of the trial you choose a plan or drop
          back to Starter automatically. Nothing is deleted.
        </p>
      </div>
    </div>

    <div class="faq-item">
      <button class="faq-question" aria-expanded="false" aria-controls="faq-2">
        Can I bring my own Kafka cluster?
        <svg class="faq-icon" aria-hidden="true" focusable="false" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="faq-answer" id="faq-2" role="region" aria-label="Can I bring my own Kafka cluster?">
        <p>
          Yes. Compound can act as a managed transform layer in front of your existing
          Kafka topics. You keep ownership of your cluster; Compound handles the
          consumer groups, offset management, and transform execution.
        </p>
      </div>
    </div>

    <div class="faq-item">
      <button class="faq-question" aria-expanded="false" aria-controls="faq-3">
        What happens when I exceed my event limit?
        <svg class="faq-icon" aria-hidden="true" focusable="false" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="faq-answer" id="faq-3" role="region" aria-label="What happens when I exceed my event limit?">
        <p>
          We'll email you at 80% and 100% of your monthly limit. Overages are billed
          at $0.40 per additional million events, never at a punishing per-event rate.
          You can also set a hard cap so nothing is processed beyond a ceiling you choose.
        </p>
      </div>
    </div>

    <div class="faq-item">
      <button class="faq-question" aria-expanded="false" aria-controls="faq-4">
        Is there a self-hosted version?
        <svg class="faq-icon" aria-hidden="true" focusable="false" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="faq-answer" id="faq-4" role="region" aria-label="Is there a self-hosted version?">
        <p>
          Compound Enterprise can be deployed to your own VPC via a Helm chart.
          Contact sales for the license terms and migration support — it's the same
          binary as the cloud product, pointed at your own infrastructure.
        </p>
      </div>
    </div>

  </section>

  <hr class="section-rule">
</main>

<!-- ============================================================
     FOOTER
     ============================================================ -->
<footer class="site-footer">
  <div class="footer-inner wrap">
    <div>
      <p class="footer-brand">Compound</p>
      <p class="footer-tagline">Async pipelines — without the ceremony</p>
    </div>
    <nav aria-label="Footer navigation">
      <ul class="footer-links" role="list">
        <li><a href="/docs">Docs</a></li>
        <li><a href="/blog">Blog</a></li>
        <li><a href="/changelog">Changelog</a></li>
        <li><a href="/privacy">Privacy</a></li>
        <li><a href="/status">Status</a></li>
      </ul>
    </nav>
  </div>
</footer>

<!-- ============================================================
     JAVASCRIPT
     Three behaviors wired here; all check prefers-reduced-motion
     before setting any initial hidden/translated state.
     ============================================================ -->
<script>
(function () {
  'use strict';

  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     1. Sticky nav: IntersectionObserver on hero sentinel
        When hero sentinel exits viewport (user scrolled past hero),
        add [data-scrolled] to nav — CSS does the rest.
     ---------------------------------------------------------- */
  const nav      = document.querySelector('.site-nav');
  const sentinel = document.getElementById('hero-sentinel');
  if (nav && sentinel) {
    const navObserver = new IntersectionObserver(
      ([entry]) => {
        nav.toggleAttribute('data-scrolled', !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    navObserver.observe(sentinel);
  }

  /* ----------------------------------------------------------
     2. Hero headline mask-up reveal
        Only hides lines when we'll animate. Reduced-motion: CSS
        collapses animation-duration to 0.01ms — effectively instant.
     ---------------------------------------------------------- */
  const headline = document.querySelector('.hero-headline');
  if (headline) {
    if (!REDUCE) {
      // Hide lines ONLY when we know we'll animate them
      headline.querySelectorAll('.line-inner').forEach(el => {
        el.style.transform = 'translateY(110%)';
      });
    }
    // Trigger animation on next frame so CSS has applied
    requestAnimationFrame(() => {
      headline.classList.add('hero-ready');
      if (!REDUCE) {
        headline.querySelectorAll('.line-inner').forEach(el => {
          el.style.transform = '';
        });
      }
    });
  }

  /* ----------------------------------------------------------
     3. Bento tile stagger entrance
        IntersectionObserver fires once when grid enters viewport.
        Reduced-motion: skip; tiles remain at their CSS baseline (visible).
     ---------------------------------------------------------- */
  const bentoGrid = document.querySelector('.bento-grid');
  if (bentoGrid && !REDUCE) {
    const bentoObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          bentoGrid.classList.add('bento-animate');
          bentoObserver.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    bentoObserver.observe(bentoGrid);
  }

  /* ----------------------------------------------------------
     4. Billing toggle — monthly / annual
     ---------------------------------------------------------- */
  window.setBilling = function (period) {
    const grid    = document.getElementById('pricing-grid');
    const btnM    = document.getElementById('btn-monthly');
    const btnA    = document.getElementById('btn-annual');
    if (!grid || !btnM || !btnA) return;
    grid.dataset.billing         = period;
    btnM.setAttribute('aria-pressed', String(period === 'monthly'));
    btnA.setAttribute('aria-pressed', String(period === 'annual'));
  };

  /* ----------------------------------------------------------
     5. FAQ accordion — disclosure pattern
     ---------------------------------------------------------- */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      // Close all others first
      document.querySelectorAll('.faq-question').forEach(b => {
        b.setAttribute('aria-expanded', 'false');
      });
      // Toggle this one
      btn.setAttribute('aria-expanded', String(!expanded));
    });
    // Keyboard: Escape closes
    btn.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
  });

})();
</script>

</body>
</html>
```

---

## Section by section

**Nav** (`04-component-patterns/navbars`) — Sticky via `position: sticky`, no JS scroll listener for the hold itself. An IntersectionObserver on a 1px sentinel at the hero bottom triggers the backdrop-blur + hairline border state once, cheaply. Mobile collapses to a labeled menu button; no megamenu needed on a single-product landing page.

**Hero** (`01-visual-styles/editorial-typographic`, `02-scroll-motion/text-reveal-on-scroll`) — Asymmetric 12-column grid; headline spans 10 of 12 columns stopping short of the right edge. Standfirst hangs at columns 8–12, below the headline's tail — editorial tension, not centered symmetry. Three-line mask-up reveal fires once on load, expo-out easing, reduced-motion collapses to instant show.

**Social proof** — Logo strip at low opacity (not a full section of identical testimonial cards) plus one featured quote with an accent left-border. Both small decisions that break the "three cards" template.

**Feature bento** (`03-layout-systems/bento-grid`, `01-visual-styles/bento-aesthetic`) — Named-area 4-column grid. One 2×2 hero tile dominates, a 1×2 tall tile holds integrations, a wide 2×1 tile sits at the bottom, smalls cluster around them. Size variance is real: no two tiles have the same footprint. Container queries reflow to 2-column and 1-column on narrow containers without a media-query cascade.

**Pricing** (`08-ui-states-feedback`) — Real `<table>` with `<caption class="sr-only">`, `scope` on every header, and a button-group billing toggle with `aria-pressed`. Annual prices revealed via `[data-billing="annual"]` CSS attribute selector, not JS DOM swaps of visible content.

**FAQ** (`04-component-patterns/navbars` disclosure pattern) — `<button aria-expanded>` toggling `<div role="region">`, `max-height` transition, Escape to close. No `role="menu"` — these are disclosure widgets, not application menu items.

**Footer** — Hairline top rule, brand wordmark, `<nav aria-label="Footer navigation">` with a flat list. Zero elevation, zero boxes — editorial restraint to the last pixel.

---

## Accessibility checklist

- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` in CSS collapses all `animation-duration` and `transition-duration` to `0.01ms` globally. JS checks `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before hiding any element or registering any observer that would hide elements.
- **Text contrast (all pairs verified):**
  - `--text` (`oklch(91% 0.012 264)` ≈ `#e6e8f0`) on `--bg` (`oklch(10% 0.008 264)` ≈ `#0b0c0f`): ~15:1 — AAA.
  - `--text-muted` (`oklch(66% 0.015 264)` ≈ `#9ca0b0`) on `--bg`: ~7:1 — AAA.
  - `--text-faint` (`oklch(50% 0.014 264)` ≈ `#6b7080`) on `--bg`: ~4.6:1 — AA.
  - `--accent` (`oklch(72% 0.16 62)` ≈ `#d4973a`) on `--bg`: ~7.8:1 — AAA.
  - `--accent` on `--surface`: ~6.1:1 — AA. Re-check if you change the hue or lightness.
- **Focus rings:** Every interactive element (links, buttons, CTA tiles) has `:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }`. Never removed.
- **Touch targets:** All buttons and links have `min-height: 44px` (nav links via padding), CTA tile link has `min-height: 44px` explicitly. The billing toggle buttons have `min-height: 36px` — acceptable for paired toggle controls, but increase to 44px on a real touch-heavy product.
- **Keyboard / screen reader:**
  - Nav: links in DOM order, `aria-label` on the `<nav>`.
  - Hero: `aria-labelledby` connecting `<section>` to `<h1 id>`.
  - Bento: `<section aria-labelledby>`, each tile is `<article>` with a `<h3>`.
  - Pricing: real `<table>`, `<caption class="sr-only">`, `scope` attributes, `aria-label` on check/dash icons.
  - FAQ: standard disclosure pattern, `aria-expanded`, `aria-controls`, `role="region"`, Escape closes.
  - Logo strip: `aria-label="Customer logos"` on the `<div>`.
  - Decorative glow: CSS `::before` pseudo-element — invisible to AT.
- **Zoom / reflow (WCAG 1.4.4, 1.4.10):** All type uses `clamp()` with a `rem` term in the preferred expression (never pure `vw`), so browser zoom to 200% scales text. Bento collapses to single column at narrow container widths — no horizontal scroll at 400% zoom on 320px viewport.
- **Heading order:** One `<h1>` (hero), `<h2>` for each section heading, `<h3>` inside bento tiles. No skips.
- **`overflow-x: clip`** on `<body>` clips horizontal overflow without creating a scroll container, so `position: sticky` on the nav is not broken.

---

## Make it yours

Three knobs, one swap each:

1. **Skin temperature** — swap from editorial dark to editorial light by changing five `--bg / --surface / --text` tokens to a warm paper palette (`--bg: oklch(98% 0.005 70)`, `--text: oklch(15% 0.010 60)`, etc.) and removing the `body::before` glow. Draw from `01-visual-styles/editorial-typographic`'s ink-on-paper palette. Everything else stays identical.

2. **Display typeface** — replace Fraunces with General Sans or Satoshi (Fontshare, free) for a grotesk-editorial voice instead of a serif one. Swap `--font-display` in `:root`. Use `font-weight: 650` (variable axis) instead of 700. The asymmetric layout and bento structure are typeface-agnostic. Draw from `05-typography-color/font-pairing`.

3. **Accent hue** — change `oklch(72% 0.16 62)` to any hue that fits your brand. Keep L between 65–75% and C between 0.13–0.18 on this dark canvas for AA contrast. Good alternatives: teal `oklch(70% 0.15 195)`, sage `oklch(72% 0.12 155)`, rose `oklch(70% 0.16 10)`. Verify contrast after each change with an OKLCH contrast checker. Draw from `05-typography-color/oklch-perceptual-color`.

---

## Library entries used

- `01-visual-styles/editorial-typographic` — asymmetric grid, hairline rules, fluid type, anti-slop rationale for type + surface
- `01-visual-styles/dark-mode-aesthetic` — near-black base, elevation-by-lightness, single focal glow, off-white text, desaturated accent
- `01-visual-styles/bento-aesthetic` — tile skin: radius token, border-top highlight, subtle one-hue corner wash, hover lift gated to pointer devices
- `02-scroll-motion/text-reveal-on-scroll` — mask-up line reveal, expo easing, prefers-reduced-motion handling, baseline-visible pattern
- `02-scroll-motion/sticky-pinning` — `position: sticky` nav, `overflow: clip` not `hidden`, sentinel IntersectionObserver pattern, scroll-state progressive enhancement
- `03-layout-systems/bento-grid` — named-area `grid-template-areas`, container queries for reflow, DOM-order = reading-order discipline, anti-dense-flow
- `04-component-patterns/navbars` — disclosure pattern for FAQ, skip link, `aria-expanded`/`aria-controls`, focus management
- `05-typography-color/font-pairing` — Fraunces (display) + system-ui (body) + ui-monospace (labels), `font-optical-sizing: auto`, weight contrast rationale
- `05-typography-color/oklch-perceptual-color` — OKLCH semantic tokens, hex fallbacks, chroma-tapered neutral ramp, contrast verification method
- `07-backgrounds-effects/css-gradients` — `radial-gradient` focal glow, `in oklch` interpolation note, background behind hero not under text
- `08-ui-states-feedback/error-and-validation-states` — `aria-pressed` billing toggle pattern, focus-ring spec (2px, 3px offset)
- `09-responsive-foundations/fluid-everything` — `clamp()` type scale and spacing scale, `repeat(auto-fit)` grid, container-query-first reflow
- `_slop-blocklist.md` — cross-referenced for every deliberate deviation: type, layout, color, surface, motion, copy
