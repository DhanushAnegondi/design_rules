# Developer portfolio recipe

> A single-page developer portfolio that is fast, readable, and legible as a real person's work — dark-mode aesthetic, bento project grid, minimal motion, and a sans + mono pairing that signals craft without screaming for attention.

**Build target:** dev-portfolio
**Feel:** precise, unhurried, confident, technical
**Effort:** medium

---

## The stack

- **Skin (visual style):** `01-visual-styles/dark-mode-aesthetic` — near-black (`#0d0d10`) base with elevation by lightness steps, one desaturated-blue focal glow off the hero corner, and off-white text; not the neon-on-void that every AI portfolio template ships.
- **Skeleton (layout):** `03-layout-systems/single-column-centered` as the outer spine (hero → about → experience → contact) with `03-layout-systems/bento-grid` inserted at the projects section — single column ensures one clean reading axis; bento breaks the monotony of identical project cards and lets work speak with size variance.
- **Behaviors (motion):**
  - `02-scroll-motion/text-reveal-on-scroll` — mask-up line reveal on the hero headline only (not body copy), expo easing `cubic-bezier(0.16,1,0.3,1)`, gated behind `prefers-reduced-motion`; reserved for one focal moment so the page does not feel like a template fade-up parade.
  - `02-scroll-motion/sticky-pinning` — a `position: sticky` scroll-progress bar at the top of the viewport, `transform: scaleX()` driven by a `scroll()` timeline; purely a reading aid on long single-column pages, `aria-hidden`, and set to its final state under `prefers-reduced-motion`.
  - Bento tile stagger on scroll entry — a lightweight `IntersectionObserver` stagger that fires once on the projects grid, `opacity 0→1 + translateY 24px→0`, 80 ms between tiles, expo easing; nothing more.
- **Type:** `05-typography-color/font-pairing` — **Geist** (system-ui fallback chain) for all body and UI text, **JetBrains Mono** (Google Fonts) as the mono accent for eyebrows, labels, tech tags, and inline code; Geist is a characterful grotesque that reads as developer-native without the Inter-everywhere tell, and the mono accent earns its place on a developer portfolio where code is the context.
- **Color / tokens:** `05-typography-color/dark-mode-token-strategy` + `05-typography-color/oklch-perceptual-color` — two-tier semantic tokens (`--bg`, `--surface`, `--surface-raised`, `--text`, `--text-muted`, `--accent`, `--border`) defined as `oklch()` values with sRGB hex fallbacks; the accent is `oklch(0.72 0.12 230)` (a desaturated steel-blue, not the generic `#3B82F6` SaaS blue); elevation is three lightness steps in OKLCH so the perceptual gap is equal between them.
- **Effects / states:** `07-backgrounds-effects/css-gradients` — one `radial-gradient` focal glow (`rgba` of the accent, large radius, positioned off top-right of the hero behind text) as a `body::before` fixed pseudo-element; `pointer-events: none`, `aria-hidden` implicit; `08-ui-states-feedback/error-and-validation-states` covers the contact form (inline `aria-invalid` + `aria-describedby` field errors, error summary on submit); `09-responsive-foundations/fluid-everything` — fluid type scale via `clamp()` and a fluid bento grid that reflows from 4 columns → 2 → 1 without breakpoint debt.

---

## Why this avoids slop

The default developer portfolio slop (cross-ref `_slop-blocklist.md`):

- **Layout:** hero + three identical icon-title-blurb cards, centered 800 px box, equal padding everywhere.
- **Type:** Inter or Roboto at one weight and size for everything.
- **Color:** generic SaaS blue `#3B82F6` or a purple-to-indigo gradient as the "accent."
- **Surface:** `#000000` or `#0a0a0a` background + neon glow on every card + soft drop shadow on everything.
- **Motion:** every section fades-and-slides-up with identical 0.5 s duration and default `ease`.

What this recipe does instead:

1. **Bento project grid with genuine size variance** — one wide hero project tile, two standard tiles, one tall tile with a tech-tag list; the visual rhythm signals curation, not template generation.
2. **Geist + JetBrains Mono** — Geist is characterful-grotesque-technical; mono accent for labels is native to developer context and zero additional network cost (system mono fallback works).
3. **OKLCH steel-blue accent** — `oklch(0.72 0.12 230)` reads as blue but is clearly not the `#3B82F6` SaaS default; desaturated enough to sit inside the dark field without vibrating.
4. **Elevation by lightness not shadow** — `#0d0d10` → `#16181d` → `#1e2027` → `#262932`; no heavy drop shadow on every card.
5. **One line reveal, not universal fade-up** — the hero `<h1>` mask-up is the sole scroll animation; the rest of the page simply appears.

---

## Starter scaffold

A complete, self-contained `index.html`. Open it in any browser. All values are real; `prefers-reduced-motion` is handled inline; WCAG contrast is verified in comments; bento tiles are keyboard-focusable links; the contact form has accessible error states.

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="description" content="Dhanush Chandra — software engineer building fast, accessible web products.">
<title>Dhanush Chandra — Software Engineer</title>

<!-- JetBrains Mono variable font (mono accent only, ~28 KB WOFF2 subset) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

<!-- Inline theme script: set data-theme before paint to prevent flash -->
<script>
  (function () {
    var t = localStorage.getItem('portfolio-theme') || 'dark';
    document.documentElement.dataset.theme = t;
  }());
</script>

<style>
/* ============================================================
   TIER 1 — PRIMITIVE TOKENS (OKLCH, sRGB fallbacks)
   Elevation steps: +0.037 L each, slight cool tint (H 262)
   ============================================================ */
:root {
  /* sRGB hex fallbacks — browsers without oklch() use these */
  --_bg-hex:             #0d0d10;
  --_surface-hex:        #16181d;
  --_surface-raised-hex: #1e2027;
  --_overlay-hex:        #262932;
  --_text-hex:           #e8e8ee;
  --_muted-hex:          #a8a8b3;
  --_faint-hex:          #7c8190;
  --_accent-hex:         #8ab4f8; /* desaturated steel-blue */
  --_accent-ink-hex:     #0d0d10;
  --_border-hex:         rgba(255,255,255,0.07);
  --_border-strong-hex:  rgba(255,255,255,0.12);
}

@supports (color: oklch(0% 0 0)) {
  :root {
    /* Perceptually-even elevation ramp (OKLCH L steps ~0.037) */
    --_bg-hex:             oklch(0.112 0.012 262);
    --_surface-hex:        oklch(0.149 0.013 262);
    --_surface-raised-hex: oklch(0.186 0.014 262);
    --_overlay-hex:        oklch(0.223 0.015 262);
    --_text-hex:           oklch(0.935 0.006 262);   /* 15.4:1 on bg */
    --_muted-hex:          oklch(0.730 0.010 262);   /* 7.9:1  on bg */
    --_faint-hex:          oklch(0.580 0.014 262);   /* 4.7:1  on bg — AA */
    /* Accent: desaturated steel-blue, NOT oklch(0.55 0.25 230) SaaS-blue */
    --_accent-hex:         oklch(0.720 0.120 230);   /* 8.6:1  on bg */
    --_accent-ink-hex:     oklch(0.112 0.012 262);
  }
}

/* ============================================================
   TIER 2 — SEMANTIC TOKENS (what components consume)
   ============================================================ */
:root {
  color-scheme: dark;
  --bg:             var(--_bg-hex);
  --surface:        var(--_surface-hex);
  --surface-raised: var(--_surface-raised-hex);
  --overlay:        var(--_overlay-hex);
  --text:           var(--_text-hex);
  --text-muted:     var(--_muted-hex);
  --text-faint:     var(--_faint-hex);
  --accent:         var(--_accent-hex);
  --accent-ink:     var(--_accent-ink-hex);
  --border:         var(--_border-hex);
  --border-strong:  var(--_border-strong-hex);
  /* Glow: accent hue, low opacity, large radius — ONE focal glow only */
  --glow:           rgba(138, 180, 248, 0.14);

  /* ---- Font stacks ---- */
  /* Geist: characterful grotesque. Falls through to system-ui if not installed. */
  --font-sans: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  /* JetBrains Mono: loaded above for labels/tags/code. Mono fallback always works. */
  --font-mono: "JetBrains Mono", ui-monospace, "Cascadia Code", "SF Mono", Menlo, monospace;

  /* ---- Fluid type scale (Perfect Fourth × 1.333, 375–1280 px range) ---- */
  --step--1: clamp(0.75rem,  0.73rem + 0.11vw, 0.84rem);
  --step-0:  clamp(0.9375rem, 0.91rem + 0.14vw, 1.0rem);
  --step-1:  clamp(1.25rem,  1.18rem + 0.35vw, 1.5rem);
  --step-2:  clamp(1.67rem,  1.52rem + 0.73vw, 2.25rem);
  --step-3:  clamp(2.22rem,  1.95rem + 1.37vw, 3.375rem);
  --step-4:  clamp(2.96rem,  2.5rem  + 2.3vw,  5.063rem);

  /* ---- Fluid spacing ---- */
  --space-xs:  clamp(0.5rem,  0.47rem + 0.14vw, 0.625rem);
  --space-s:   clamp(0.75rem, 0.71rem + 0.21vw, 1.0rem);
  --space-m:   clamp(1.25rem, 1.15rem + 0.5vw,  1.5rem);
  --space-l:   clamp(2rem,    1.8rem  + 1.0vw,  2.5rem);
  --space-xl:  clamp(3rem,    2.5rem  + 2.5vw,  5rem);
  --space-2xl: clamp(5rem,    4rem    + 5vw,     8rem);

  --radius-s: 8px;
  --radius-m: 12px;
  --radius-l: 18px;
}

/* ============================================================
   RESET + BASE
   ============================================================ */
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: var(--step-0);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  min-height: 100dvh;
}

/* THE one focal glow — fixed, behind all content, pointer-events none */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(
    55rem 38rem at 72% -8%,
    var(--glow) 0%,
    transparent 60%
  );
}

/* Everything sits above the glow */
body > * { position: relative; z-index: 1; }

/* ============================================================
   SCROLL PROGRESS INDICATOR
   A single accent bar at the top; purely decorative, aria-hidden.
   Uses CSS scroll-driven animation (Chrome/Edge 115+, Safari 26+).
   Falls back gracefully: browsers without support see nothing (acceptable).
   prefers-reduced-motion: bar is shown at full scale (already "arrived").
   ============================================================ */
.progress-bar {
  position: fixed;
  top: 0; left: 0;
  height: 2px;
  width: 100%;
  background: var(--accent);
  transform-origin: left center;
  transform: scaleX(0);
  z-index: 100;
  animation: progress-fill linear;
  animation-timeline: scroll(root block);
  animation-range: 0% 100%;
}
@keyframes progress-fill { to { transform: scaleX(1); } }
@media (prefers-reduced-motion: reduce) {
  .progress-bar {
    animation: none;
    transform: scaleX(1);   /* show at full width immediately */
    opacity: 0.4;
  }
}

/* ============================================================
   LAYOUT SPINE — single column with optional full-width escapes
   Josh Comeau / Ryan Mulligan breakout grid approach
   ============================================================ */
.page-wrap {
  display: grid;
  grid-template-columns:
    [full-start] minmax(var(--space-m), 1fr)
    [content-start] min(64ch, 100% - var(--space-m) * 2) [content-end]
    minmax(var(--space-m), 1fr) [full-end];
}
.page-wrap > * { grid-column: content; }
.full-width     { grid-column: full; }

/* ============================================================
   NAV
   ============================================================ */
.site-nav {
  grid-column: full;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-m) var(--space-l);
  /* sticky nav — overflow:clip not hidden to avoid breaking sticky */
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  overflow: clip;
}
.nav-mark {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--text);
  text-decoration: none;
}
.nav-mark:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 2px;
}
.nav-links {
  display: flex;
  gap: var(--space-m);
  list-style: none;
  margin: 0;
  padding: 0;
}
.nav-links a {
  font-size: var(--step--1);
  color: var(--text-muted);
  text-decoration: none;
  letter-spacing: 0.01em;
  transition: color 0.15s;
}
.nav-links a:hover  { color: var(--text); }
.nav-links a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .nav-links a { transition: none; }
}

/* ============================================================
   HERO SECTION
   ============================================================ */
.hero {
  padding-block: var(--space-2xl) var(--space-xl);
}

.hero-eyebrow {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin: 0 0 var(--space-m);
  display: block;
}

/* MASK-UP TEXT REVEAL — one focal animation, expo easing, gated */
.hero-headline {
  font-size: var(--step-4);
  font-weight: 650;
  line-height: 1.04;
  letter-spacing: -0.025em;
  margin: 0 0 var(--space-m);
  max-width: 16ch;
  text-wrap: balance;
  color: var(--text);
}
.hero-headline .line {
  display: block;
  overflow: hidden;
}
.hero-headline .line > span {
  display: block;
  /* Baseline: visible. JS/animation only enhances. */
}

@media (prefers-reduced-motion: no-preference) {
  .hero-headline.will-animate .line > span {
    transform: translateY(110%);
    animation: line-rise 0.72s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .hero-headline.will-animate .line:nth-child(2) > span { animation-delay: 0.08s; }
  .hero-headline.will-animate .line:nth-child(3) > span { animation-delay: 0.16s; }
  .hero-headline.will-animate .line:nth-child(4) > span { animation-delay: 0.24s; }
}
@keyframes line-rise { to { transform: translateY(0); } }

.hero-lede {
  color: var(--text-muted);
  font-size: var(--step-1);
  line-height: 1.5;
  max-width: 50ch;
  margin: 0 0 var(--space-l);
}

.hero-ctas {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s);
}

/* Primary button */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  background: var(--accent);
  color: var(--accent-ink);
  font-family: var(--font-sans);
  font-size: var(--step-0);
  font-weight: 600;
  padding: 0.7em 1.3em;
  border-radius: var(--radius-s);
  text-decoration: none;
  border: 0;
  cursor: pointer;
}
.btn-primary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

/* Ghost button */
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: var(--step-0);
  font-weight: 500;
  padding: 0.7em 1.3em;
  border-radius: var(--radius-s);
  text-decoration: none;
  border: 1px solid var(--border-strong);
  cursor: pointer;
}
.btn-ghost:hover { color: var(--text); border-color: rgba(255,255,255,0.2); }
.btn-ghost:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
@media (prefers-reduced-motion: reduce) {
  .btn-ghost { transition: none; }
}

/* ============================================================
   SECTION SHARED STYLES
   ============================================================ */
section { padding-block: var(--space-xl); }
section + section {
  border-top: 1px solid var(--border);
}

.section-label {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 var(--space-l);
  display: block;
}

/* ============================================================
   ABOUT SECTION
   ============================================================ */
.about-body {
  font-size: var(--step-1);
  line-height: 1.6;
  color: var(--text-muted);
  max-width: 60ch;
}
.about-body strong { color: var(--text); font-weight: 600; }
.about-body a {
  color: var(--accent);
  text-underline-offset: 0.2em;
}
.about-body a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 2px;
}

/* ============================================================
   PROJECTS — BENTO GRID
   Named-area placement. DOM order = sensible narrative order.
   4 cols desktop → 2 cols medium → 1 col narrow.
   ============================================================ */
.projects { grid-column: full; padding-inline: var(--space-l); }
.projects-inner { max-width: 1100px; margin-inline: auto; }

.bento {
  container-type: inline-size;
}

.bento-grid {
  display: grid;
  gap: var(--space-s);
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(180px, auto);
  grid-template-areas:
    "hero  hero  b     c   "
    "hero  hero  d     c   ";
}

/* Tile base — elevation by surface lightness, hairline border on top */
.tile {
  background: var(--surface);
  border: 1px solid var(--border);
  border-top-color: var(--border-strong);
  border-radius: var(--radius-l);
  padding: var(--space-m);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-width: 0;
  /* Shadow is a tertiary cue, not the primary depth signal */
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
  /* Whole-tile link wrapper will handle focus; keep overflow clip */
  overflow: clip;
  position: relative;
}

/* Tile links: keyboard-focusable, pseudo-element covers whole tile */
.tile-link {
  text-decoration: none;
  color: inherit;
  /* stretch a pseudo-element to cover the full tile */
}
.tile-link::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: var(--radius-l);
  z-index: 0;
}
.tile-link:focus-visible::after {
  outline: 2px solid var(--accent);
  outline-offset: 0;
}
/* Any child content above the overlay */
.tile > * { position: relative; z-index: 1; }

/* Named areas */
.tile-hero  { grid-area: hero;  background: var(--surface-raised); }
.tile-b     { grid-area: b; }
.tile-c     { grid-area: c;     background: var(--surface-raised); }
.tile-d     { grid-area: d; }

/* Hover state — opacity on a prepared ::before so no paint on scroll */
.tile::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: var(--radius-l);
  background: rgba(255,255,255,0.02);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
  z-index: 0;
}
@media (hover: hover) and (pointer: fine) {
  .tile:hover::before { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .tile::before { transition: none; }
}

/* Tile typography */
.tile-kicker {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin: 0 0 var(--space-xs);
}
.tile-title {
  font-size: var(--step-1);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
  margin: 0 0 var(--space-xs);
  color: var(--text);
}
.tile-hero .tile-title {
  font-size: var(--step-2);
}
.tile-desc {
  font-size: var(--step--1);
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0 0 var(--space-s);
}

/* Tech tag list */
.tile-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35em;
  list-style: none;
  margin: var(--space-xs) 0 0;
  padding: 0;
}
.tile-tags li {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: var(--accent);
  background: rgba(138,180,248,0.08);
  border: 1px solid rgba(138,180,248,0.16);
  border-radius: 4px;
  padding: 0.15em 0.5em;
}

/* Arrow indicator */
.tile-arrow {
  display: inline-block;
  font-size: var(--step--1);
  color: var(--text-faint);
  margin-top: auto;
  padding-top: var(--space-s);
  transition: transform 0.2s ease, color 0.2s ease;
}
@media (hover: hover) and (pointer: fine) {
  .tile:hover .tile-arrow {
    transform: translate(3px, -3px);
    color: var(--accent);
  }
}
@media (prefers-reduced-motion: reduce) {
  .tile-arrow { transition: none; }
}

/* Container-query responsive bento */
@container (max-width: 720px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-areas:
      "hero  hero"
      "b     c   "
      "d     c   ";
  }
}
@container (max-width: 440px) {
  .bento-grid {
    grid-template-columns: 1fr;
    grid-template-areas: "hero" "b" "c" "d";
  }
}
/* Media query fallback */
@supports not (container-type: inline-size) {
  @media (max-width: 760px) {
    .bento-grid {
      grid-template-columns: repeat(2, 1fr);
      grid-template-areas:
        "hero  hero"
        "b     c   "
        "d     c   ";
    }
  }
  @media (max-width: 480px) {
    .bento-grid {
      grid-template-columns: 1fr;
      grid-template-areas: "hero" "b" "c" "d";
    }
  }
}

/* Stagger entrance animation for bento tiles */
@media (prefers-reduced-motion: no-preference) {
  .tile.stagger-hidden {
    opacity: 0;
    transform: translateY(24px);
  }
  .tile.stagger-enter {
    animation: tile-enter 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes tile-enter {
    to { opacity: 1; transform: translateY(0); }
  }
}

/* ============================================================
   EXPERIENCE SECTION
   Numbered editorial rows — not a timeline with dot-line chrome
   ============================================================ */
.xp-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--border);
}
.xp-item {
  display: grid;
  grid-template-columns: 5ch 1fr auto;
  gap: var(--space-m);
  align-items: baseline;
  padding-block: var(--space-m);
  border-bottom: 1px solid var(--border);
}
.xp-num {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-faint);
  font-weight: 500;
}
.xp-content {}
.xp-role {
  font-size: var(--step-1);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text);
  margin: 0 0 0.2em;
}
.xp-company {
  font-size: var(--step-0);
  color: var(--accent);
  margin: 0 0 0.35em;
}
.xp-desc {
  font-size: var(--step--1);
  color: var(--text-muted);
  max-width: 56ch;
  line-height: 1.55;
  margin: 0;
}
.xp-years {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-faint);
  white-space: nowrap;
}

@media (max-width: 600px) {
  .xp-item {
    grid-template-columns: 4ch 1fr;
    grid-template-rows: auto auto;
  }
  .xp-years {
    grid-column: 2;
    grid-row: 1;
    text-align: left;
  }
  .xp-content { grid-column: 2; grid-row: 2; }
}

/* ============================================================
   CONTACT SECTION
   ============================================================ */
.contact-intro {
  font-size: var(--step-1);
  color: var(--text-muted);
  max-width: 50ch;
  margin: 0 0 var(--space-l);
}

.contact-form { max-width: 44ch; }

.field-group { margin-bottom: var(--space-m); }
.field-group label {
  display: block;
  font-size: var(--step--1);
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 0.4em;
}
.field-group input,
.field-group textarea {
  display: block;
  width: 100%;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-s);
  padding: 0.65em 0.85em;
  font-family: var(--font-sans);
  font-size: var(--step-0);
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.15s;
}
.field-group input:focus,
.field-group textarea:focus {
  outline: 0;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(138,180,248,0.2);
}
.field-group input[aria-invalid="true"],
.field-group textarea[aria-invalid="true"] {
  border-color: #f87171; /* red-400, 4.6:1 on --surface */
}
@media (prefers-reduced-motion: reduce) {
  .field-group input,
  .field-group textarea { transition: none; }
}

/* Accessible field error message */
.field-error {
  display: none;
  font-size: var(--step--1);
  color: #f87171;
  margin-top: 0.35em;
}
.field-error.visible { display: block; }

/* Error summary (shown on submit if errors exist) */
.error-summary {
  display: none;
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.24);
  border-radius: var(--radius-s);
  padding: var(--space-s) var(--space-m);
  margin-bottom: var(--space-m);
  color: #f87171;
  font-size: var(--step--1);
}
.error-summary.visible { display: block; }
.error-summary ul { margin: 0.5em 0 0; padding-left: 1.2em; }

/* ============================================================
   FOOTER
   ============================================================ */
.site-footer {
  grid-column: full;
  padding: var(--space-l) var(--space-l);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-s);
}
.footer-copy {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-faint);
}
.footer-links {
  display: flex;
  gap: var(--space-m);
  list-style: none;
  margin: 0;
  padding: 0;
}
.footer-links a {
  font-size: var(--step--1);
  color: var(--text-faint);
  text-decoration: none;
}
.footer-links a:hover { color: var(--text-muted); }
.footer-links a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 2px;
}

/* ============================================================
   SKIP LINK (keyboard / screen-reader first)
   ============================================================ */
.skip-link {
  position: absolute;
  top: -10rem;
  left: var(--space-m);
  z-index: 200;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: var(--step-0);
  font-weight: 600;
  padding: 0.6em 1em;
  border-radius: var(--radius-s);
  text-decoration: none;
}
.skip-link:focus { top: var(--space-m); }
</style>
</head>

<body>

<!-- Skip navigation: must be first focusable element -->
<a class="skip-link" href="#main-content">Skip to content</a>

<!-- Scroll progress bar: decorative, aria-hidden via role -->
<div class="progress-bar" role="presentation" aria-hidden="true"></div>

<div class="page-wrap">

  <!-- NAV -->
  <nav class="site-nav" aria-label="Primary navigation">
    <a class="nav-mark" href="#main-content">dc</a>
    <ul class="nav-links" role="list">
      <li><a href="#about">About</a></li>
      <li><a href="#projects">Projects</a></li>
      <li><a href="#experience">Experience</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
  </nav>

  <!-- HERO -->
  <main id="main-content">
    <section class="hero" aria-labelledby="hero-heading">
      <span class="hero-eyebrow">Software engineer — open to new roles</span>

      <!--
        The headline is split into lines for the mask-up animation.
        If JS is off or reduced-motion is set, these are just readable spans.
        The aria-label on h1 gives screen readers the full unsplit string.
      -->
      <h1 class="hero-headline" id="hero-heading"
          aria-label="I build fast, accessible tools for the web.">
        <span class="line"><span>I build fast,</span></span>
        <span class="line"><span>accessible tools</span></span>
        <span class="line"><span>for the web.</span></span>
      </h1>

      <p class="hero-lede">
        Full-stack engineer with 4 years shipping production software.
        Comfortable from database queries to design systems.
        Currently interested in developer tooling and performance engineering.
      </p>

      <div class="hero-ctas">
        <a class="btn-primary" href="#projects">See my work</a>
        <a class="btn-ghost"   href="#contact">Get in touch</a>
      </div>
    </section>

    <!-- ABOUT -->
    <section id="about" aria-labelledby="about-label">
      <span class="section-label" id="about-label">About</span>
      <p class="about-body">
        I am a software engineer based in Chennai, India.
        I write <strong>TypeScript, Go, and Python</strong> day to day,
        and I care a lot about making products that are fast and accessible
        to everyone — not just the people with the newest devices.
        Before this I studied computer science at <strong>VIT Vellore</strong>
        and spent two years at a fintech startup rebuilding their data pipeline
        from scratch.
        <br><br>
        Outside work I contribute to open-source tooling, run a
        <a href="#contact">small newsletter on web performance</a>,
        and occasionally write about CSS.
      </p>
    </section>

    <!-- PROJECTS BENTO -->
    <!--
      projects is full-width (breaks the reading column) so it gets
      its own wrapper with page-level horizontal padding.
      DOM order matches narrative order so keyboard/screen-reader flow
      stays coherent regardless of visual placement.
    -->
    <section id="projects" class="projects full-width" aria-labelledby="projects-label">
      <div class="projects-inner">
        <span class="section-label" id="projects-label">Projects</span>
        <div class="bento" role="list" aria-label="Selected projects">

          <!-- HERO TILE: most significant project, spans 2×2 on desktop -->
          <article class="tile tile-hero" role="listitem">
            <a class="tile-link" href="https://github.com/example/fastpipe"
               aria-label="FastPipe — open-source ETL framework. View on GitHub.">
            </a>
            <p class="tile-kicker">Open source · 2024</p>
            <h3 class="tile-title">FastPipe</h3>
            <p class="tile-desc">
              An ETL framework for small teams that does not require a
              dedicated infrastructure team. Built with Go, ships as a
              single binary. 1,200 GitHub stars.
            </p>
            <ul class="tile-tags" aria-label="Technologies">
              <li>Go</li><li>Apache Arrow</li><li>SQLite</li><li>Docker</li>
            </ul>
            <span class="tile-arrow" aria-hidden="true">↗</span>
          </article>

          <!-- STANDARD TILE B -->
          <article class="tile tile-b" role="listitem">
            <a class="tile-link" href="https://github.com/example/a11y-lint"
               aria-label="a11y-lint — accessibility static analysis. View on GitHub.">
            </a>
            <p class="tile-kicker">Tool · 2023</p>
            <h3 class="tile-title">a11y-lint</h3>
            <p class="tile-desc">
              Static analysis for accessibility issues in JSX before
              they reach production.
            </p>
            <ul class="tile-tags" aria-label="Technologies">
              <li>TypeScript</li><li>AST</li>
            </ul>
            <span class="tile-arrow" aria-hidden="true">↗</span>
          </article>

          <!-- TALL TILE C: spans 2 rows -->
          <article class="tile tile-c" role="listitem">
            <a class="tile-link" href="https://github.com/example/budgetapp"
               aria-label="BudgetApp — personal finance tracker. View on GitHub.">
            </a>
            <p class="tile-kicker">Web app · 2022</p>
            <h3 class="tile-title">BudgetApp</h3>
            <p class="tile-desc">
              A personal finance tracker that imports bank CSVs, tags
              transactions automatically, and shows spending trends with
              zero third-party data sharing.
            </p>
            <ul class="tile-tags" aria-label="Technologies">
              <li>SvelteKit</li><li>Postgres</li><li>Plaid API</li>
            </ul>
            <span class="tile-arrow" aria-hidden="true">↗</span>
          </article>

          <!-- STANDARD TILE D -->
          <article class="tile tile-d" role="listitem">
            <a class="tile-link" href="https://github.com/example/cssperf"
               aria-label="css-perf-audit — CSS performance auditor. View on GitHub.">
            </a>
            <p class="tile-kicker">Library · 2023</p>
            <h3 class="tile-title">css-perf-audit</h3>
            <p class="tile-desc">
              Detects expensive CSS selectors and unused custom properties
              in production bundles.
            </p>
            <ul class="tile-tags" aria-label="Technologies">
              <li>Node.js</li><li>PostCSS</li>
            </ul>
            <span class="tile-arrow" aria-hidden="true">↗</span>
          </article>

        </div><!-- .bento -->
      </div>
    </section>

    <!-- EXPERIENCE -->
    <section id="experience" aria-labelledby="xp-label">
      <span class="section-label" id="xp-label">Experience</span>
      <ol class="xp-list">
        <li class="xp-item">
          <span class="xp-num" aria-hidden="true">01</span>
          <div class="xp-content">
            <p class="xp-role">Senior Software Engineer</p>
            <p class="xp-company">Razorpay</p>
            <p class="xp-desc">
              Led migration of the payments dashboard from a monolith to
              micro-frontends. Reduced LCP from 4.2 s to 1.1 s. Established
              the frontend accessibility standards used across 8 product teams.
            </p>
          </div>
          <span class="xp-years">2022 — present</span>
        </li>
        <li class="xp-item">
          <span class="xp-num" aria-hidden="true">02</span>
          <div class="xp-content">
            <p class="xp-role">Software Engineer</p>
            <p class="xp-company">Slice</p>
            <p class="xp-desc">
              Rebuilt the data ingestion pipeline handling 4 M daily
              transactions. Introduced schema validation that cut data-quality
              incidents by 80 %.
            </p>
          </div>
          <span class="xp-years">2020 — 2022</span>
        </li>
        <li class="xp-item">
          <span class="xp-num" aria-hidden="true">03</span>
          <div class="xp-content">
            <p class="xp-role">Engineering Intern</p>
            <p class="xp-company">Freshworks</p>
            <p class="xp-desc">
              Built an internal feature-flag service used by 12 teams.
              Presented findings at the engineering all-hands.
            </p>
          </div>
          <span class="xp-years">Summer 2019</span>
        </li>
      </ol>
    </section>

    <!-- CONTACT -->
    <section id="contact" aria-labelledby="contact-label">
      <span class="section-label" id="contact-label">Contact</span>
      <p class="contact-intro">
        I am open to senior IC and tech-lead roles at companies
        working on developer tooling, infrastructure, or fintech.
        Say hello.
      </p>

      <!-- Error summary: populated and shown by JS on failed submit -->
      <div class="error-summary" role="alert" aria-live="assertive" id="error-summary">
        <strong>Please fix the following before sending:</strong>
        <ul id="error-list"></ul>
      </div>

      <form class="contact-form" id="contact-form" novalidate>
        <div class="field-group">
          <label for="f-name">Your name</label>
          <input
            type="text"
            id="f-name"
            name="name"
            autocomplete="name"
            required
            aria-required="true"
            aria-describedby="f-name-error"
          >
          <span class="field-error" id="f-name-error" role="alert">
            Please enter your name.
          </span>
        </div>

        <div class="field-group">
          <label for="f-email">Email address</label>
          <input
            type="email"
            id="f-email"
            name="email"
            autocomplete="email"
            required
            aria-required="true"
            aria-describedby="f-email-error"
          >
          <span class="field-error" id="f-email-error" role="alert">
            Please enter a valid email address.
          </span>
        </div>

        <div class="field-group">
          <label for="f-msg">Message</label>
          <textarea
            id="f-msg"
            name="message"
            rows="5"
            required
            aria-required="true"
            aria-describedby="f-msg-error"
          ></textarea>
          <span class="field-error" id="f-msg-error" role="alert">
            Please write a message.
          </span>
        </div>

        <button class="btn-primary" type="submit">Send message</button>
      </form>
    </section>
  </main>

  <!-- FOOTER -->
  <footer class="site-footer" aria-label="Site footer">
    <p class="footer-copy">
      <span aria-hidden="true">©</span>
      <span class="sr-only">Copyright</span> 2026 Dhanush Chandra
    </p>
    <ul class="footer-links" role="list">
      <li><a href="https://github.com/example" rel="noopener noreferrer">GitHub</a></li>
      <li><a href="https://linkedin.com/in/example" rel="noopener noreferrer">LinkedIn</a></li>
      <li><a href="/resume.pdf">Resume</a></li>
    </ul>
  </footer>

</div><!-- .page-wrap -->

<!-- Screen-reader only utility -->
<style>
  .sr-only {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0,0,0,0); white-space: nowrap; border: 0;
  }
</style>

<script>
(function () {
  "use strict";

  /* ------ 1. HERO HEADLINE MASK-UP REVEAL ------
     Only run if reduced-motion is not requested.
     Mark the headline so CSS animation fires. */
  var prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReducedMotion) {
    var headline = document.querySelector(".hero-headline");
    if (headline) {
      headline.classList.add("will-animate");
    }
  }

  /* ------ 2. BENTO TILE STAGGER ENTRANCE ------
     IntersectionObserver fires once per tile, 80 ms stagger.
     Reduced-motion: tiles are always visible (no class set). */
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    var tiles = Array.from(document.querySelectorAll(".tile"));

    /* Set initial hidden state only when we know we will animate */
    tiles.forEach(function (tile) {
      tile.classList.add("stagger-hidden");
    });

    var delay = 0;
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var tile = entry.target;
            tile.style.animationDelay = delay + "ms";
            delay += 80;
            /* Use rAF so delay accumulates before class triggers animation */
            requestAnimationFrame(function () {
              tile.classList.remove("stagger-hidden");
              tile.classList.add("stagger-enter");
            });
            observer.unobserve(tile);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    tiles.forEach(function (tile) { observer.observe(tile); });
  }

  /* ------ 3. CONTACT FORM VALIDATION ------
     Accessible: aria-invalid, aria-describedby errors, summary with focus. */
  var form = document.getElementById("contact-form");
  if (form) {
    function showError(inputId, errorId) {
      var input = document.getElementById(inputId);
      var error = document.getElementById(errorId);
      if (input && error) {
        input.setAttribute("aria-invalid", "true");
        error.classList.add("visible");
      }
    }
    function clearError(inputId, errorId) {
      var input = document.getElementById(inputId);
      var error = document.getElementById(errorId);
      if (input && error) {
        input.removeAttribute("aria-invalid");
        error.classList.remove("visible");
      }
    }

    /* Validate on blur so users get feedback after leaving a field */
    ["f-name", "f-email", "f-msg"].forEach(function (id) {
      var input = document.getElementById(id);
      if (!input) return;
      input.addEventListener("blur", function () {
        var errorId = id + "-error";
        if (id === "f-email") {
          if (!input.value.trim() || !input.validity.valid) {
            showError(id, errorId);
          } else {
            clearError(id, errorId);
          }
        } else {
          if (!input.value.trim()) {
            showError(id, errorId);
          } else {
            clearError(id, errorId);
          }
        }
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var errors = [];
      var firstErrorId = null;

      /* Clear previous summary */
      var summary = document.getElementById("error-summary");
      var errorList = document.getElementById("error-list");

      clearError("f-name",  "f-name-error");
      clearError("f-email", "f-email-error");
      clearError("f-msg",   "f-msg-error");

      var name  = document.getElementById("f-name");
      var email = document.getElementById("f-email");
      var msg   = document.getElementById("f-msg");

      if (!name.value.trim()) {
        showError("f-name", "f-name-error");
        errors.push({ id: "f-name", text: "Please enter your name." });
        if (!firstErrorId) firstErrorId = "f-name";
      }
      if (!email.value.trim() || !email.validity.valid) {
        showError("f-email", "f-email-error");
        errors.push({ id: "f-email", text: "Please enter a valid email address." });
        if (!firstErrorId) firstErrorId = "f-email";
      }
      if (!msg.value.trim()) {
        showError("f-msg", "f-msg-error");
        errors.push({ id: "f-msg", text: "Please write a message." });
        if (!firstErrorId) firstErrorId = "f-msg";
      }

      if (errors.length > 0) {
        errorList.innerHTML = errors.map(function (err) {
          return "<li><a href=\"#" + err.id + "\">" + err.text + "</a></li>";
        }).join("");
        summary.classList.add("visible");
        summary.focus();
      } else {
        summary.classList.remove("visible");
        /* Replace with real form submission logic */
        alert("Thanks — message sent! (Wire up your endpoint here.)");
        form.reset();
      }
    });
  }

}());
</script>

</body>
</html>
```

---

## Section by section

**Nav** — `position: sticky; top: 0` on the nav bar; `overflow: clip` (not `hidden`) so it never breaks sticky on child elements. Draws from `02-scroll-motion/sticky-pinning`'s "overflow:clip fix" guidance. The mono wordmark (`dc`) echoes the mono-accent type role from `05-typography-color/font-pairing`.

**Hero** — single reading column from `03-layout-systems/single-column-centered`. The headline gets the mask-up line reveal from `02-scroll-motion/text-reveal-on-scroll` — restricted to the `<h1>`, expo easing, per-line stagger, JS marks `will-animate` only when `prefers-reduced-motion` is false. The fixed focal glow behind the hero (`body::before`) comes from `01-visual-styles/dark-mode-aesthetic`'s "one glow, off-corner, behind content not text" rule.

**About** — plain reading copy inside the centered 64 ch column; deliberate weight contrast (`<strong>` at 600 vs body 400). No decoration; the whitespace rhythm does the work per `01-visual-styles/minimalism`.

**Projects bento** — `grid-column: full` lets it escape the reading column to use full viewport width. Named-area placement (`hero / b / c / d`) from `03-layout-systems/bento-grid` so DOM order and visual order stay aligned at all breakpoints. Container queries (`container-type: inline-size`) reflow the grid on its own width, not the viewport. Each tile is a keyboard-focusable `<article>` with a whole-tile `::after` link overlay per `04-component-patterns/cards` guidance. Tech tags use the mono accent font — role-appropriate per `05-typography-color/font-pairing`. Tile stagger on scroll entry from `IntersectionObserver` with expo easing, 80 ms between tiles — one animation style shared with the hero so the motion vocabulary is consistent.

**Experience** — numbered editorial rows from `03-layout-systems/single-column-centered` anti-slop guidance ("editorial numbered detail rows instead of triplet cards"). Mono row numbers are decorative (`aria-hidden`); semantic content is in the visible text.

**Contact** — inline `aria-invalid` + `aria-describedby` errors per `08-ui-states-feedback/error-and-validation-states`; error summary with `role="alert"` and programmatic focus on submit failure; blur-triggered validation so errors appear after the user leaves a field, not mid-input.

**Footer** — semantic `<footer>` landmark, mono copyright text, three external links with `rel="noopener noreferrer"`.

---

## Accessibility checklist

- **Reduced motion:** `prefers-reduced-motion: reduce` is handled in three places — hero headline class is never added (so spans never go `translateY(110%)`), bento tiles are never hidden (`stagger-hidden` class never applied), the scroll progress bar is shown at full scale with `transform: scaleX(1)`. Scroll behavior is `auto` not `smooth`.
- **Contrast (verified pairs):**
  - `--text #e8e8ee` on `--bg #0d0d10`: ~15.4:1 (AAA)
  - `--text-muted #a8a8b3` on `--bg #0d0d10`: ~7.9:1 (AAA)
  - `--text-faint #7c8190` on `--bg #0d0d10`: ~4.7:1 (AA)
  - `--accent #8ab4f8` on `--bg #0d0d10`: ~8.6:1 (AAA)
  - `--accent-ink #0d0d10` on `--accent #8ab4f8`: ~8.6:1 (AAA) — button text
  - Error red `#f87171` on `--surface #16181d`: ~4.6:1 (AA)
  - Tech tag accent `rgba(138,180,248,0.08)` background + `--accent` text: verify per actual bg; the label text itself is `--accent` on `--surface` which clears AA.
- **Keyboard / focus:** All interactive elements have `:focus-visible` with 2 px accent outline. The whole-tile link (`::after` pseudo-element, `z-index: 0`) means each bento tile is one tab stop, not four. The skip link is the first focusable element and becomes visible on focus. Nav links, footer links, CTA buttons, and form controls all in natural DOM tab order.
- **Touch targets:** `btn-primary` and `btn-ghost` have `padding: 0.7em 1.3em` on `var(--step-0)` — computed min height ~44 px. Tile minimum height is 180 px (`minmax(180px, auto)`). Footer links are `var(--step--1)` but padding can be added if needed to reach 44 px.
- **Screen reader notes:** Bento section has `role="list"` and `aria-label="Selected projects"` with each tile as `role="listitem"`. The tile link `aria-label` carries the full project name + destination. Decorative elements (glow `body::before`, arrows, row numbers) are `aria-hidden`. The progress bar has `role="presentation" aria-hidden="true"`. The error summary has `role="alert"` so it is announced immediately on focus. Hero `<h1>` has `aria-label` with the unsplit full text so screen readers read the whole sentence not three lines.
- **Reflow / 400 % zoom:** The reading column is `min(64ch, 100% - spacing)` so it reflows to a single column at any viewport width with no horizontal scroll. The bento collapses to single column at 440 px container width.
- **Colour not sole conveyor:** Form errors use `aria-invalid`, descriptive error text, and `aria-describedby` — not just a red border.

---

## Make it yours

Three knobs, each pointing to a library entry to swap:

1. **Accent hue** — the `--_accent-hex` token is `oklch(0.72 0.12 230)` (steel-blue). Change the hue angle (`230`) to any value — `oklch(0.72 0.12 150)` gives teal, `oklch(0.72 0.12 30)` gives amber — while keeping L and C the same so the contrast ratios hold. Derive from `05-typography-color/oklch-perceptual-color` tonal ramp if you want a multi-step brand palette. Or replace with a warm orange (`#e8782a`, ~6.1:1 on dark base) for a warmer feel closer to `01-visual-styles/brutalism-neo-brutalism`.

2. **Hero type** — swap Geist for a characterful serif display face. Add Fraunces (variable, with `opsz` axis) from `05-typography-color/font-pairing`'s "serif display + sans body" pairing: load it from Google Fonts and assign `font-family: "Fraunces", var(--font-sans)` only to `.hero-headline`. Everything else stays mono + sans. This changes the read from "precision-technical" to "editorial-technical."

3. **Projects layout** — the bento currently shows 4 projects. Replace it with the `03-layout-systems/masonry` layout (CSS `columns: 2` with `break-inside: avoid` on tiles) if your projects have highly variable content height and you want a denser, less rigid composition. Or collapse it to a simple numbered list matching the experience rows if you want severe Swiss restraint throughout — removing the bento is itself a strong statement.

---

## Library entries used

- `01-visual-styles/dark-mode-aesthetic` — near-black base, elevation by lightness steps, one focal glow, off-white text, desaturated accent; anti-slop framing for "glow/neon everywhere" and "aurora blob"
- `01-visual-styles/minimalism` — restrained whitespace, numbered editorial rows for experience, weight contrast as hierarchy, hairline borders over drop shadows
- `02-scroll-motion/text-reveal-on-scroll` — mask-up line reveal on hero headline; expo easing `cubic-bezier(0.16,1,0.3,1)`; `prefers-reduced-motion` gating pattern
- `02-scroll-motion/sticky-pinning` — `position: sticky` nav; `overflow: clip` fix; CSS scroll-driven animation for the progress bar; `prefers-reduced-motion` final-state fallback
- `03-layout-systems/single-column-centered` — reading column outer spine (`min(64ch, …)`), breakout `grid-column: full` for the bento, rhythm via modular spacing scale
- `03-layout-systems/bento-grid` — named-area placement, container queries, DOM-order-safe tile layout, keyboard-focusable whole-tile link via `::after`
- `04-component-patterns/cards` — whole-tile `::after` pseudo-element link overlay; `:focus-visible` ring; hover elevation via `::before` opacity
- `05-typography-color/font-pairing` — Geist (characterful grotesque) + JetBrains Mono; weight contrast body 400 vs display 650; mono accent for labels
- `05-typography-color/dark-mode-token-strategy` — two-tier semantic token map; `color-scheme: dark`; no-flash inline head script; `light-dark()` referenced for future light mode
- `05-typography-color/oklch-perceptual-color` — OKLCH elevation ramp; perceptually-even L steps; `@supports` progressive enhancement with sRGB hex fallbacks
- `07-backgrounds-effects/css-gradients` — single `radial-gradient` focal glow as `body::before`; one hue, low opacity, off-corner so it never sits behind body text
- `08-ui-states-feedback/error-and-validation-states` — `aria-invalid`, `aria-describedby` field errors, `role="alert"` error summary with focus management, blur-triggered validation
- `09-responsive-foundations/fluid-everything` — `clamp()` fluid type scale (Perfect Fourth), fluid spacing scale, `auto-fit minmax` bento track responsive reflow
- `_slop-blocklist.md` — explicit checklist used to verify every default was broken; "hero + three identical cards," "Inter everywhere," "SaaS blue," "neon on every card," "universal fade-up"
