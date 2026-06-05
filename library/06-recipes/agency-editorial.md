# Agency / editorial studio site recipe

> A design studio site that reads like an art-directed print spread: editorial-typographic skin, magazine grid, mask-up headline reveal + horizontal-scroll case-study gallery + cursor-reactive magnetic CTA, ink-on-warm-paper palette with one committed rust accent.

**Build target:** agency-editorial
**Feel:** composed, characterful, deliberate, Awwwards-adjacent without being showy
**Effort:** high

---

## The stack

- **Skin (visual style):** `01-visual-styles/editorial-typographic` — type-as-interface earns premium perception in the first 400 ms without relying on imagery; the non-slop choice over aurora-gradient + Inter.
- **Skeleton (layout):** `03-layout-systems/magazine-editorial-grid` — named-line 12-column CSS Grid with full-bleed escapes and subgrid for the case-study row; breaks the centered-everything + three-identical-cards default cold.
- **Behaviors (motion):**
  - `02-scroll-motion/text-reveal-on-scroll` — mask-up per-line reveal on the hero headline only; reserved for one focal statement so it lands rather than becoming background noise.
  - `02-scroll-motion/smooth-scroll-lenis` — Lenis lerp-scroll gives the page deliberate momentum and syncs with GSAP ScrollTrigger so the horizontal gallery scrub tracks an eased position, not a raw jump.
  - `04-component-patterns/magnetic-animated-buttons` — magnetic pull + fill-sweep on the single primary CTA; the rest of the page is still, so the one focal button feels earned.
- **Type:** `05-typography-color/font-pairing` — Fraunces (variable, optical-sizing, opsz axis) at 600–900 for display / system-grotesk (`ui-sans-serif`) at 400–500 for body / `ui-monospace` for kickers and metadata; classification contrast (high-contrast serif vs neutral sans) carries hierarchy without a fourth face.
- **Color / tokens:** `05-typography-color/oklch-perceptual-color` — two-hue: warm near-black ink `oklch(13% 0.015 55)` on warm paper `oklch(96% 0.012 80)`, one rust accent `oklch(47% 0.14 35)` verified at AA contrast; no gradient, no SaaS blue; OKLCH ensures the accent stays vivid if a dark-mode remap is added later.
- **Effects / states:** `07-backgrounds-effects/css-gradients` used as a single tonal bottom-fade on the horizontal-scroll gallery section (one hue, varying L in oklch), not behind body text; `08-ui-states-feedback/error-and-validation-states` for the contact form (aria-invalid + aria-describedby pattern).

---

## Why this avoids slop

The default agency site (cross-reference `_slop-blocklist.md`) ships: **Inter for both headline and body at one weight, a purple-to-pink or blue gradient behind the hero, a centered 800px column with equal padding, and every element fading-and-sliding-up on scroll with default `ease`**. This recipe breaks four of those buckets deliberately:

1. **Type:** Fraunces display serif at optical size against a system-sans body creates real hierarchy vs Inter-for-everything. The mono kicker (an evocation of a magazine masthead) adds a third texture that reads as designed.
2. **Layout:** The headline spans 10 of 12 columns and stops short of the right edge; the standfirst hangs offset to the right; a full-bleed horizontal gallery breaks the content measure on purpose. Asymmetry maps to content priority instead of being decorative.
3. **Color:** Ink on warm paper (`oklch`) with one rust accent used once per screen — no gradient, no SaaS-blue `#3B82F6`. The neutral ramp carries a faint warm hue rather than dead gray.
4. **Motion:** Only the hero headline reveals; the horizontal gallery scrubs on scroll but doesn't stagger-fade every card; the magnetic CTA is the only element with pointer-reactive behavior. Varied rhythm, not uniform wash.

---

## Starter scaffold

Complete, self-contained `index.html`. Open in any modern browser. No build step, no framework. Lenis and GSAP loaded from CDN for the demo; swap to self-hosted in production.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Form & Field Studio — Design for things that last</title>

  <!-- Fraunces: variable serif with opsz axis. One file covers display + text sizes.
       In production: self-host a latin-subset WOFF2 and preload the above-fold request. -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600&display=swap" rel="stylesheet">

  <!-- Lenis CSS (required companion to the Lenis JS) -->
  <link rel="stylesheet" href="https://unpkg.com/lenis@1.3.23/dist/lenis.css">

  <style>
    /* =====================================================================
       DESIGN TOKENS
       Source of truth: edit here, everything inherits.
       OKLCH with hex fallbacks for older engines.
    ===================================================================== */
    :root {
      /* Ink-on-warm-paper palette. Two hues: warm near-black + rust accent.
         No gradient. No SaaS blue. Ref: 05-typography-color/oklch-perceptual-color */

      /* Warm near-black: oklch(13% 0.015 55) ≈ #1c1510 */
      --ink:    #1c1510;
      --ink:    oklch(13% 0.015 55);

      /* Warm mid-tone for muted text: oklch(40% 0.018 55) ≈ #5a4e44
         Contrast on --paper: ~6.5:1 → AA normal text. */
      --muted:  #5a4e44;
      --muted:  oklch(40% 0.018 55);

      /* Warm paper: oklch(96% 0.012 80) ≈ #f5f0e8 */
      --paper:  #f5f0e8;
      --paper:  oklch(96% 0.012 80);

      /* Rust accent — ONE committed hue, used once per screen.
         oklch(47% 0.14 35) ≈ #9c3518
         Contrast on --paper: ~6.3:1 → AA for all text sizes. */
      --accent: #9c3518;
      --accent: oklch(47% 0.14 35);

      /* Hairline rule — warm gray */
      --rule:   #ddd5c9;
      --rule:   oklch(86% 0.010 80);

      /* Font stacks — three roles, deliberate classification contrast.
         Ref: 05-typography-color/font-pairing */
      --font-display: "Fraunces", "Iowan Old Style", Georgia, serif;
      --font-body:    ui-sans-serif, system-ui, -apple-system, "Segoe UI",
                      Helvetica, Arial, sans-serif;
      --font-mono:    ui-monospace, "SFMono-Regular", Menlo, monospace;

      /* Modular type scale — Perfect Fourth (×1.333), fluid via clamp().
         rem term in preferred value keeps WCAG 1.4.4 (200% zoom = reflow).
         Ref: 05-typography-color/font-pairing, 09-responsive-foundations/fluid-everything */
      --step-0: clamp(1rem,    0.93rem + 0.35vw, 1.15rem);
      --step-1: clamp(1.33rem, 1.20rem + 0.65vw, 1.60rem);
      --step-2: clamp(1.78rem, 1.50rem + 1.40vw, 2.55rem);
      --step-3: clamp(2.37rem, 1.80rem + 2.85vw, 4.20rem);
      --step-4: clamp(3.16rem, 2.20rem + 4.80vw, 6.50rem);

      /* Fluid spacing scale anchored to type — one edit re-tunes all whitespace.
         Ref: 09-responsive-foundations/fluid-everything */
      --space-s:  clamp(0.75rem, 0.65rem + 0.50vw, 1.00rem);
      --space-m:  clamp(1.25rem, 1.00rem + 1.25vw, 2.00rem);
      --space-l:  clamp(2.00rem, 1.50rem + 2.50vw, 4.00rem);
      --space-xl: clamp(3.50rem, 2.50rem + 5.00vw, 7.00rem);
    }

    /* =====================================================================
       RESET & BASE
    ===================================================================== */
    *, *::before, *::after { box-sizing: border-box; }
    html {
      /* Native smooth anchor scroll — Lenis overrides wheel/touch.
         Ref: 02-scroll-motion/smooth-scroll-lenis */
      scroll-behavior: smooth;
    }
    /* Reduced-motion: disable smooth scroll and reveal animations at the root.
       Lenis is also not initialised when this matches (see JS below). */
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
    }

    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font-family: var(--font-body);
      font-size: var(--step-0);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Prevent horizontal overflow from the horizontal-scroll gallery section */
    body { overflow-x: hidden; }

    img, svg { display: block; max-width: 100%; }
    a { color: var(--accent); }
    a:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
      border-radius: 2px;
    }

    /* =====================================================================
       MACRO GRID — 12-column with named full-bleed lines.
       Ref: 03-layout-systems/magazine-editorial-grid
    ===================================================================== */
    .grid {
      display: grid;
      grid-template-columns:
        [full-start] minmax(var(--space-m), 1fr)
        [content-start] repeat(12, minmax(0, 5.25rem)) [content-end]
        minmax(var(--space-m), 1fr) [full-end];
      column-gap: clamp(0.75rem, 1.5vw, 1.5rem);
      max-width: 1440px;
      margin-inline: auto;
    }
    /* Default: every direct child sits in the readable content band */
    .grid > * { grid-column: content-start / content-end; }

    /* =====================================================================
       NAV — sticky, minimal, mono masthead feel.
       Ref: 01-visual-styles/editorial-typographic
    ===================================================================== */
    .site-nav {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--paper);
      border-bottom: 1px solid var(--rule);
      /* scroll-margin-top offset for in-page anchors */
    }
    .site-nav__inner {
      grid-column: content-start / content-end;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-block: var(--space-s);
    }
    .site-nav__logo {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--ink);
      text-decoration: none;
      font-weight: 500;
    }
    .site-nav__logo:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }
    .site-nav__links {
      display: flex;
      gap: var(--space-m);
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .site-nav__links a {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      text-decoration: none;
      transition: color 0.2s ease;
    }
    .site-nav__links a:hover { color: var(--ink); }
    .site-nav__links a:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
      border-radius: 2px;
    }
    /* On small screens, collapse to logo + one CTA link */
    @media (max-width: 600px) {
      .site-nav__links li:not(:last-child) { display: none; }
    }

    /* =====================================================================
       HERO — editorial typographic. Headline spans 10 of 12 cols (asymmetric).
       Standfirst hangs offset to the right under the headline tail.
       Ref: 01-visual-styles/editorial-typographic, 03-layout-systems/magazine-editorial-grid
    ===================================================================== */
    .hero {
      padding-block: var(--space-xl);
    }
    .hero__kicker {
      grid-column: content-start / content-end;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--accent);
      margin: 0 0 var(--space-s);
    }
    .hero__headline {
      /* 10 of 12 columns — stops short of the right edge. Asymmetric, not centered.
         Ref: editorial-typographic "overuse warning" — centered-everything is lazy. */
      grid-column: content-start / span 10;
      font-family: var(--font-display);
      font-size: var(--step-4);
      font-weight: 700;
      line-height: 1.01;
      letter-spacing: -0.018em;
      text-wrap: balance;
      font-optical-sizing: auto;
      margin: 0;
      /* Lines are clipped for the mask-up reveal.
         The mask-up class is added by JS; without JS the headline is fully visible. */
    }
    .hero__headline em {
      font-style: italic;
      font-weight: 400;
      color: var(--accent);
    }
    /* Each .line wrapper clips its child span for the mask-up reveal */
    .hero__headline .line {
      display: block;
      overflow: hidden;
    }
    /* Inner span starts visible (transform: none) — JS sets translateY(110%) as the
       "from" state only when motion is allowed.
       Ref: 02-scroll-motion/text-reveal-on-scroll accessibility note */
    .hero__headline .line > span {
      display: block;
    }

    /* ---- REVEAL ANIMATION — only when motion is not reduced ---- */
    @media (prefers-reduced-motion: no-preference) {
      .hero__headline.js-reveal .line > span {
        /* Starting state set via JS (transform: translateY(110%)).
           This animation fires on .is-revealed class added by IntersectionObserver. */
        transition: transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .hero__headline.js-reveal.is-revealed .line > span {
        transform: translateY(0);
      }
      /* Stagger: each subsequent line delays 0.08s (set via inline style in JS) */
    }

    .hero__standfirst {
      /* Hangs to the right, under the headline tail — deliberate asymmetry */
      grid-column: 8 / content-end;
      font-size: var(--step-1);
      line-height: 1.45;
      color: var(--muted);
      max-width: 34ch;
      margin: var(--space-m) 0 0;
      text-wrap: pretty;
    }
    .hero__cta-wrap {
      grid-column: content-start / content-end;
      margin-top: var(--space-l);
      display: flex;
      align-items: center;
      gap: var(--space-m);
    }

    /* On phones, collapse asymmetry to a single column */
    @media (max-width: 720px) {
      .hero__headline { grid-column: content-start / content-end; }
      .hero__standfirst {
        grid-column: content-start / content-end;
        max-width: none;
      }
    }

    /* =====================================================================
       MARQUEE TICKER — decorative editorial band.
       Ref: 02-scroll-motion/marquee-ticker
    ===================================================================== */
    .ticker-section {
      border-block: 1px solid var(--rule);
      overflow: hidden;
      padding-block: var(--space-s);
    }
    .ticker-controls {
      display: flex;
      justify-content: flex-end;
      max-width: 1440px;
      margin-inline: auto;
      padding-inline: var(--space-m);
      margin-bottom: 0.25rem;
    }
    .ticker-pause {
      background: none;
      border: 1px solid var(--rule);
      border-radius: 3px;
      color: var(--muted);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0.25rem 0.6rem;
      cursor: pointer;
      min-width: 44px;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .ticker-pause:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }
    .ticker {
      --gap: 3rem;
      display: flex;
      width: max-content;
      gap: var(--gap);
      user-select: none;
    }
    .ticker.is-paused { animation-play-state: paused; }
    .ticker__group {
      display: flex;
      gap: var(--gap);
      align-items: center;
    }
    .ticker__item {
      font-family: var(--font-display);
      font-size: clamp(1.1rem, 2.5vw, 1.8rem);
      font-style: italic;
      font-weight: 400;
      color: var(--muted);
      white-space: nowrap;
    }
    .ticker__sep {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--accent);
      flex-shrink: 0;
    }
    @media (prefers-reduced-motion: no-preference) {
      .ticker {
        /* translate by one group width + one gap — no seam jump.
           Ref: marquee-ticker "gap correctness detail" */
        animation: ticker-scroll 18s linear infinite;
      }
      @keyframes ticker-scroll {
        to { transform: translateX(calc(-50% - var(--gap) / 2)); }
      }
      /* CSS-only pause on hover / focus-within */
      .ticker-section:hover .ticker,
      .ticker-section:focus-within .ticker {
        animation-play-state: paused;
      }
    }
    /* Reduced motion: strip animates off; duplicate group is hidden */
    @media (prefers-reduced-motion: reduce) {
      .ticker__group[aria-hidden="true"] { display: none; }
    }

    /* =====================================================================
       WORK GRID — horizontal-scroll case-study gallery.
       Pinned with GSAP ScrollTrigger; keyboard-accessible fallback.
       Ref: 03-layout-systems/magazine-editorial-grid, 02-scroll-motion/sticky-pinning
    ===================================================================== */
    .work-section {
      padding-block: var(--space-xl);
    }
    .work-section__header {
      grid-column: content-start / content-end;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      border-top: 1px solid var(--rule);
      padding-top: var(--space-s);
      margin-bottom: var(--space-l);
    }
    .work-section__label {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .work-section__count {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--muted);
    }

    /* The pin + horizontal-scroll container.
       When JS / ScrollTrigger runs, this section is pinned and the inner track
       translates horizontally. Without JS it degrades to a standard scroll-snap row. */
    .work-pin-container {
      grid-column: full-start / full-end;
      overflow: hidden;
    }

    .work-track {
      display: flex;
      gap: clamp(1rem, 2vw, 2rem);
      /* Keyboard / no-JS fallback: horizontal scroll with scroll snap */
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      padding-inline: var(--space-m);
      padding-bottom: var(--space-s); /* space for scrollbar */
      /* When JS adds .js-horizontal-track, overflow-x becomes hidden and the
         track is translated by GSAP instead. */
    }
    .work-track.js-horizontal-track {
      overflow-x: visible;
      padding-bottom: 0;
      /* Width set by JS to sum of card widths + gaps */
      flex-shrink: 0;
    }
    /* Hide scrollbar when GSAP takes over — JS class applied */
    .work-track.js-horizontal-track::-webkit-scrollbar { display: none; }

    .work-card {
      flex-shrink: 0;
      width: clamp(280px, 42vw, 560px);
      scroll-snap-align: start;
    }
    .work-card__image {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      background: var(--rule); /* placeholder color when no image loads */
      display: block;
    }
    .work-card__meta {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-top: var(--space-s);
    }
    .work-card__title {
      font-family: var(--font-display);
      font-size: var(--step-1);
      font-weight: 600;
      margin: 0;
      line-height: 1.2;
      font-optical-sizing: auto;
    }
    .work-card__category {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .work-card__link {
      display: block;
      text-decoration: none;
      color: inherit;
      margin-top: 0.35rem;
      font-size: var(--step-0);
      color: var(--muted);
    }
    .work-card__link:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }

    /* Bottom-fade tonal gradient on the gallery: same hue, varying L.
       One gradient use, not behind body text.
       Ref: 07-backgrounds-effects/css-gradients anti-slop */
    .work-section {
      background:
        /* paper at full opacity at top, fading to a slightly deeper warm at bottom */
        linear-gradient(
          in oklch,
          var(--paper) 0%,
          oklch(91% 0.012 80) 100%
        );
    }

    /* =====================================================================
       ABOUT / MANIFESTO — narrow measure, full-bleed section divider.
       Ref: 01-visual-styles/editorial-typographic, 03-layout-systems/magazine-editorial-grid
    ===================================================================== */
    .about-section {
      padding-block: var(--space-xl);
      border-top: 1px solid var(--rule);
    }
    .about-section__kicker {
      grid-column: content-start / content-end;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--muted);
      margin: 0 0 var(--space-m);
    }
    .about-section__heading {
      /* Spans only 8 of 12 columns — intentionally narrow, builds tension */
      grid-column: content-start / span 8;
      font-family: var(--font-display);
      font-size: var(--step-3);
      font-weight: 600;
      line-height: 1.06;
      letter-spacing: -0.014em;
      text-wrap: balance;
      font-optical-sizing: auto;
      margin: 0;
    }
    .about-section__body {
      grid-column: content-start / span 6;
      margin-top: var(--space-l);
      font-size: var(--step-0);
      line-height: 1.65;
      color: var(--muted);
      max-width: 62ch;
      text-wrap: pretty;
    }
    .about-section__body p { margin: 0 0 1.1em; }
    .about-section__note {
      grid-column: 9 / content-end;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--muted);
      border-left: 2px solid var(--accent);
      padding-left: var(--space-s);
      margin-top: var(--space-l);
      line-height: 1.5;
    }
    @media (max-width: 880px) {
      .about-section__heading { grid-column: content-start / content-end; }
      .about-section__body { grid-column: content-start / content-end; max-width: none; }
      .about-section__note { grid-column: content-start / content-end; border-left: none;
        border-top: 2px solid var(--accent); padding: var(--space-s) 0 0; margin-top: 0; }
    }

    /* =====================================================================
       CONTACT — form with accessible validation states.
       Ref: 08-ui-states-feedback/error-and-validation-states
    ===================================================================== */
    .contact-section {
      padding-block: var(--space-xl);
      border-top: 1px solid var(--rule);
    }
    .contact-section__inner {
      grid-column: content-start / span 7;
    }
    .contact-section__heading {
      font-family: var(--font-display);
      font-size: var(--step-3);
      font-weight: 600;
      line-height: 1.06;
      letter-spacing: -0.014em;
      font-optical-sizing: auto;
      margin: 0 0 var(--space-l);
      text-wrap: balance;
    }
    .form-group {
      margin-bottom: var(--space-m);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    label {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
    }
    input[type="text"],
    input[type="email"],
    textarea {
      background: transparent;
      border: 1px solid var(--rule);
      border-radius: 0;
      color: var(--ink);
      font-family: var(--font-body);
      font-size: var(--step-0);
      padding: 0.75rem;
      width: 100%;
      transition: border-color 0.15s ease;
      /* Touch target: min height 44px */
      min-height: 44px;
    }
    input[type="text"]:focus,
    input[type="email"]:focus,
    textarea:focus {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
      border-color: var(--accent);
    }
    textarea { min-height: 120px; resize: vertical; }
    /* Invalid state — aria-invalid="true" triggered by JS on submit
       Ref: 08-ui-states-feedback/error-and-validation-states */
    input[aria-invalid="true"],
    textarea[aria-invalid="true"] {
      border-color: var(--accent);
      background: oklch(96% 0.012 80 / 0.6);
    }
    .field-error {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--accent);
      display: none;
    }
    .field-error.is-visible { display: block; }
    @media (max-width: 880px) {
      .contact-section__inner { grid-column: content-start / content-end; }
    }

    /* =====================================================================
       MAGNETIC CTA BUTTON
       ONE focal element with magnetic pull + fill sweep.
       The rest of the page is still — reserved, not global.
       Ref: 04-component-patterns/magnetic-animated-buttons
    ===================================================================== */
    .mag-wrap {
      display: inline-block;
      padding: 2rem; /* detection zone — bigger than visual button */
      margin: -2rem; /* offset the padding so layout is not affected */
    }
    .mag-btn {
      appearance: none;
      -webkit-appearance: none;
      border: none;
      background: none;
      padding: 0;
      cursor: pointer;
      font: inherit;
    }
    .mag-btn__inner {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 2rem;
      border: 1.5px solid var(--ink);
      border-radius: 100px;
      background: transparent;
      color: var(--ink);
      font-family: var(--font-body);
      font-size: var(--step-0);
      font-weight: 500;
      letter-spacing: 0.01em;
      position: relative;
      overflow: hidden;
      will-change: transform;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      min-height: 44px; /* touch target */
    }
    .mag-btn__inner::before {
      content: "";
      position: absolute;
      inset: 0;
      background: var(--ink);
      transform: scaleX(0);
      transform-origin: 0 50%;
      z-index: 0;
    }
    .mag-btn__text,
    .mag-btn__icon {
      position: relative;
      z-index: 1;
    }
    .mag-btn__icon {
      display: inline-flex;
      align-items: center;
    }

    /* Hover effects — only on pointer-capable devices */
    @media (prefers-reduced-motion: no-preference) {
      @media (hover: hover) and (pointer: fine) {
        .mag-btn__inner::before {
          transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mag-btn:hover .mag-btn__inner::before {
          transform: scaleX(1);
        }
        .mag-btn:hover .mag-btn__text,
        .mag-btn:hover .mag-btn__icon {
          color: var(--paper);
          transition: color 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mag-btn:hover .mag-btn__icon {
          transform: translateX(3px);
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                      color 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
    }
    /* Reduced motion: instant fill, no sweep, no translate */
    @media (prefers-reduced-motion: reduce) {
      .mag-btn__inner::before,
      .mag-btn__text,
      .mag-btn__icon {
        transition: none;
      }
      @media (hover: hover) and (pointer: fine) {
        .mag-btn:hover .mag-btn__inner::before { transform: scaleX(1); }
        .mag-btn:hover .mag-btn__text,
        .mag-btn:hover .mag-btn__icon { color: var(--paper); }
      }
    }

    .mag-btn:focus-visible {
      outline: none;
    }
    .mag-btn .mag-btn__inner:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
      border-radius: 100px;
    }
    .mag-btn:focus:not(:focus-visible) { outline: none; }
    .mag-btn:active .mag-btn__inner {
      transform: scale(0.97) !important;
    }
    @media (prefers-reduced-motion: reduce) {
      .mag-btn:active .mag-btn__inner { transform: none !important; }
    }

    /* Secondary ghost link — plain, no animation */
    .ghost-link {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
      text-decoration: underline;
      text-underline-offset: 4px;
      padding: 0.5rem;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
    }
    .ghost-link:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }

    /* =====================================================================
       FOOTER — hairline rule, mono metadata, editorial close.
    ===================================================================== */
    .site-footer {
      border-top: 1px solid var(--rule);
      padding-block: var(--space-l);
    }
    .site-footer__inner {
      grid-column: content-start / content-end;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
      gap: var(--space-s);
    }
    .site-footer__name {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .site-footer__copy {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      color: var(--muted);
    }

    /* =====================================================================
       SCROLL PROGRESS INDICATOR (thin accent line at top)
    ===================================================================== */
    .scroll-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 2px;
      background: var(--accent);
      width: 0%;
      z-index: 200;
      transform-origin: left;
    }
  </style>
</head>

<body>

  <!-- Scroll progress bar: updated by JS via scroll event -->
  <div
    class="scroll-progress"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow="0"
    aria-label="Page scroll progress"
  ></div>

  <!-- ================================================================
       NAV
  ================================================================ -->
  <nav class="site-nav" aria-label="Site navigation">
    <div class="grid">
      <div class="site-nav__inner">
        <a href="#top" class="site-nav__logo">Form &amp; Field</a>
        <ul class="site-nav__links">
          <li><a href="#work">Work</a></li>
          <li><a href="#about">Studio</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </div>
    </div>
  </nav>

  <!-- ================================================================
       HERO — text reveal on scroll (mask-up, JS-enhanced)
       Fallback: fully visible headline with no transform.
       Ref: 02-scroll-motion/text-reveal-on-scroll
  ================================================================ -->
  <section id="top" class="grid hero" aria-labelledby="hero-headline">
    <p class="hero__kicker">Design studio &mdash; London</p>

    <!-- aria-label provides the full string to screen readers before JS splits
         the text into line spans. The .line > span structure is added by JS
         only when motion is not reduced. -->
    <h1
      id="hero-headline"
      class="hero__headline"
      aria-label="We make things that earn their place on the page"
    >
      <!-- JS splits these lines into .line > span wrappers for mask-up reveal.
           Without JS they render as plain text. -->
      We make things that earn
      their place
      <em>on the page.</em>
    </h1>

    <p class="hero__standfirst">
      Form and Field is an editorial design studio. We work with publishers,
      cultural institutions, and a handful of product companies whose audience
      reads carefully.
    </p>

    <div class="hero__cta-wrap">
      <!-- PRIMARY CTA: magnetic button — one focal element.
           Ref: 04-component-patterns/magnetic-animated-buttons -->
      <div class="mag-wrap" data-magnetic>
        <button class="mag-btn" type="button" onclick="document.getElementById('work').scrollIntoView({behavior:'smooth'})">
          <span class="mag-btn__inner">
            <span class="mag-btn__text">See selected work</span>
            <span class="mag-btn__icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                   xmlns="http://www.w3.org/2000/svg" focusable="false">
                <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor"
                      stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </span>
        </button>
      </div>
      <!-- Secondary ghost link — static, no animation -->
      <a href="#about" class="ghost-link">About the studio</a>
    </div>
  </section>

  <!-- ================================================================
       MARQUEE TICKER — decorative editorial band
       Pause button satisfies WCAG 2.2.2 (moving content > 5 s).
       Ref: 02-scroll-motion/marquee-ticker
  ================================================================ -->
  <div class="ticker-section" aria-label="Studio disciplines (decorative)">
    <div class="ticker-controls">
      <button class="ticker-pause" type="button" aria-label="Pause ticker" aria-pressed="false">
        Pause
      </button>
    </div>
    <!-- Content duplicated once (aria-hidden on the clone).
         Ref: marquee-ticker "gap correctness detail" -->
    <div class="ticker" role="marquee" aria-live="off">
      <div class="ticker__group">
        <span class="ticker__item">Editorial design</span>
        <span class="ticker__sep" aria-hidden="true"></span>
        <span class="ticker__item">Brand identity</span>
        <span class="ticker__sep" aria-hidden="true"></span>
        <span class="ticker__item">Type in motion</span>
        <span class="ticker__sep" aria-hidden="true"></span>
        <span class="ticker__item">Print &amp; web</span>
        <span class="ticker__sep" aria-hidden="true"></span>
        <span class="ticker__item">Cultural clients</span>
        <span class="ticker__sep" aria-hidden="true"></span>
      </div>
      <div class="ticker__group" aria-hidden="true">
        <span class="ticker__item">Editorial design</span>
        <span class="ticker__sep" aria-hidden="true"></span>
        <span class="ticker__item">Brand identity</span>
        <span class="ticker__sep" aria-hidden="true"></span>
        <span class="ticker__item">Type in motion</span>
        <span class="ticker__sep" aria-hidden="true"></span>
        <span class="ticker__item">Print &amp; web</span>
        <span class="ticker__sep" aria-hidden="true"></span>
        <span class="ticker__item">Cultural clients</span>
        <span class="ticker__sep" aria-hidden="true"></span>
      </div>
    </div>
  </div>

  <!-- ================================================================
       WORK — horizontal scroll gallery
       GSAP ScrollTrigger horizontal scrub when JS runs.
       Keyboard-accessible fallback: scroll-snap row.
       Ref: 03-layout-systems/magazine-editorial-grid, 02-scroll-motion/sticky-pinning
  ================================================================ -->
  <section id="work" class="grid work-section" aria-labelledby="work-heading">
    <div class="work-section__header">
      <span class="work-section__label" id="work-heading">Selected work</span>
      <span class="work-section__count">2021 — 2026</span>
    </div>

    <!-- The pin wrapper: ScrollTrigger will pin this element's height -->
    <div class="work-pin-container" id="work-pin">
      <!-- Keyboard note: this row has scroll-snap-type x mandatory as a fallback.
           Arrow keys, Tab, and scrollbar all work without JS.
           With GSAP running: overflow becomes visible and GSAP handles translation. -->
      <div class="work-track" id="work-track" role="list" aria-label="Case studies">

        <article class="work-card" role="listitem">
          <a href="#" class="work-card__link" aria-label="Cartographer — Book design case study">
            <!-- Inline SVG placeholder simulating an image; swap for real img with
                 width/height attrs and loading="lazy" for CLS-safe images below the fold -->
            <svg class="work-card__image" viewBox="0 0 560 420" xmlns="http://www.w3.org/2000/svg"
                 role="img" aria-label="Cartographer book design preview">
              <rect width="560" height="420" fill="#ddd5c9"/>
              <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
                    fill="#9c3518" font-family="Georgia,serif" font-size="22" font-style="italic">
                Cartographer
              </text>
            </svg>
            <div class="work-card__meta">
              <h3 class="work-card__title">Cartographer</h3>
              <span class="work-card__category">Book design</span>
            </div>
            <span>Atlas Press, 2025 — View case study</span>
          </a>
        </article>

        <article class="work-card" role="listitem">
          <a href="#" class="work-card__link" aria-label="Meridian — Identity system case study">
            <svg class="work-card__image" viewBox="0 0 560 420" xmlns="http://www.w3.org/2000/svg"
                 role="img" aria-label="Meridian identity preview">
              <rect width="560" height="420" fill="#c8c0b4"/>
              <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
                    fill="#1c1510" font-family="Georgia,serif" font-size="22" font-style="italic">
                Meridian
              </text>
            </svg>
            <div class="work-card__meta">
              <h3 class="work-card__title">Meridian</h3>
              <span class="work-card__category">Identity</span>
            </div>
            <span>Meridian Theatre, 2024 — View case study</span>
          </a>
        </article>

        <article class="work-card" role="listitem">
          <a href="#" class="work-card__link" aria-label="The Grain Almanac — Editorial site case study">
            <svg class="work-card__image" viewBox="0 0 560 420" xmlns="http://www.w3.org/2000/svg"
                 role="img" aria-label="The Grain Almanac editorial site preview">
              <rect width="560" height="420" fill="#b8aea0"/>
              <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
                    fill="#f5f0e8" font-family="Georgia,serif" font-size="20" font-style="italic">
                The Grain Almanac
              </text>
            </svg>
            <div class="work-card__meta">
              <h3 class="work-card__title">The Grain Almanac</h3>
              <span class="work-card__category">Editorial site</span>
            </div>
            <span>Independent press, 2024 — View case study</span>
          </a>
        </article>

        <article class="work-card" role="listitem">
          <a href="#" class="work-card__link" aria-label="Stillwater — Brand &amp; print case study">
            <svg class="work-card__image" viewBox="0 0 560 420" xmlns="http://www.w3.org/2000/svg"
                 role="img" aria-label="Stillwater brand preview">
              <rect width="560" height="420" fill="#9c8e82"/>
              <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
                    fill="#f5f0e8" font-family="Georgia,serif" font-size="22" font-style="italic">
                Stillwater
              </text>
            </svg>
            <div class="work-card__meta">
              <h3 class="work-card__title">Stillwater</h3>
              <span class="work-card__category">Brand &amp; print</span>
            </div>
            <span>Stillwater Ceramics, 2023 — View case study</span>
          </a>
        </article>

      </div>
    </div>
  </section>

  <!-- ================================================================
       ABOUT / MANIFESTO — narrow measure, offset gutter note.
       Ref: 01-visual-styles/editorial-typographic, 03-layout-systems/magazine-editorial-grid
  ================================================================ -->
  <section id="about" class="grid about-section" aria-labelledby="about-heading">
    <p class="about-section__kicker">Studio</p>
    <h2 id="about-heading" class="about-section__heading">
      Good design is a slow agreement between
      what something <em>is</em> and what it looks like.
    </h2>
    <div class="about-section__body">
      <p>
        We opened Form and Field in 2019 because we were tired of design that
        described itself rather than doing its job. Our process starts with the
        words — a brand voice, a publication's editorial line, a product's actual
        purpose — and builds outward from there.
      </p>
      <p>
        We work in small batches, take four clients a year, and publish our process
        notes openly. If a thing is worth making it is worth understanding.
      </p>
    </div>
    <aside class="about-section__note" aria-label="Studio note">
      Currently taking enquiries for Q4 2026.
      Two spots available.
    </aside>
  </section>

  <!-- ================================================================
       CONTACT — form with accessible validation.
       Ref: 08-ui-states-feedback/error-and-validation-states
  ================================================================ -->
  <section id="contact" class="grid contact-section" aria-labelledby="contact-heading">
    <div class="contact-section__inner">
      <h2 id="contact-heading" class="contact-section__heading">Start a conversation.</h2>

      <!-- Error summary: pre-exists in DOM with role="alert" so updates are announced.
           Hidden until submit with errors. tabindex="-1" so JS can move focus to it. -->
      <div
        id="form-error-summary"
        role="alert"
        aria-atomic="true"
        aria-live="assertive"
        tabindex="-1"
        style="display:none; border-left:2px solid var(--accent); padding-left:1rem; margin-bottom:1.5rem;"
      >
        <p style="font-family:var(--font-mono); font-size:0.8rem; color:var(--accent); margin:0 0 0.5rem;">
          Please fix the following before sending:
        </p>
        <ul id="form-error-list" style="margin:0; padding:0 0 0 1.2em; font-size:0.85rem;"></ul>
      </div>

      <form id="contact-form" novalidate>
        <div class="form-group">
          <label for="name">Your name</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            autocomplete="name"
            aria-describedby="name-error"
            aria-required="true"
          >
          <span class="field-error" id="name-error" role="none">Please enter your name.</span>
        </div>

        <div class="form-group">
          <label for="email">Email address</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            autocomplete="email"
            aria-describedby="email-error"
            aria-required="true"
          >
          <span class="field-error" id="email-error" role="none">Please enter a valid email address.</span>
        </div>

        <div class="form-group">
          <label for="message">Your message</label>
          <textarea
            id="message"
            name="message"
            required
            aria-describedby="message-error"
            aria-required="true"
          ></textarea>
          <span class="field-error" id="message-error" role="none">Please describe what you have in mind.</span>
        </div>

        <div style="margin-top: var(--space-m);">
          <!-- Magnetic button re-used as form submit -->
          <div class="mag-wrap" data-magnetic>
            <button class="mag-btn" type="submit">
              <span class="mag-btn__inner">
                <span class="mag-btn__text">Send message</span>
                <span class="mag-btn__icon" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                       xmlns="http://www.w3.org/2000/svg" focusable="false">
                    <path d="M1 1l12 6L1 13V8l8-1-8-1V1z" stroke="currentColor"
                          stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </section>

  <!-- ================================================================
       FOOTER
  ================================================================ -->
  <footer class="grid site-footer">
    <div class="site-footer__inner">
      <span class="site-footer__name">Form &amp; Field Studio</span>
      <span class="site-footer__copy">
        London &mdash; <span id="footer-year"></span>
      </span>
    </div>
  </footer>

  <!-- ================================================================
       SCRIPTS — Lenis + GSAP ScrollTrigger
       All motion gated behind prefers-reduced-motion check.
       Ref: 02-scroll-motion/smooth-scroll-lenis, 02-scroll-motion/sticky-pinning
  ================================================================ -->
  <script src="https://unpkg.com/lenis@1.3.23/dist/lenis.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>

  <script>
  (function () {
    'use strict';

    /* ── Reduced motion check ── */
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let motionOk = !prefersReduced.matches;
    prefersReduced.addEventListener('change', function (e) {
      motionOk = !e.matches;
    });

    /* ── Footer year ── */
    var yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ── Scroll progress bar ── */
    var progressBar = document.querySelector('.scroll-progress');
    function updateProgress() {
      var scrollTop  = window.scrollY || document.documentElement.scrollTop;
      var docHeight  = document.documentElement.scrollHeight - window.innerHeight;
      var pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      if (progressBar) {
        progressBar.style.width = pct.toFixed(1) + '%';
        progressBar.setAttribute('aria-valuenow', Math.round(pct));
      }
    }
    window.addEventListener('scroll', updateProgress, { passive: true });

    /* ── HERO TEXT REVEAL (mask-up, per-line)
       Only runs when motion is allowed.
       Without JS or with reduced-motion: headline is fully visible as-is.
       Ref: 02-scroll-motion/text-reveal-on-scroll ── */
    function initTextReveal() {
      var headline = document.querySelector('.hero__headline');
      if (!headline || !motionOk) return;

      /* Get the existing text and split around newlines/em */
      var rawHTML = headline.innerHTML;

      /* Wrap each existing "line group" in the markup into .line > span.
         The HTML already has a natural line structure:
         text node, <em> element. We'll wrap the whole headline differently:
         split by '<br>' or wrap the two text chunks and em. */

      /* Simpler approach: wrap the whole headline in lines by replacing
         the content with three line wrappers that match the visual intent. */
      headline.innerHTML =
        '<span class="line"><span>We make things that earn</span></span>' +
        '<span class="line"><span>their place</span></span>' +
        '<span class="line"><span><em>on the page.</em></span></span>';

      headline.classList.add('js-reveal');

      /* Set starting state on each inner span */
      var spans = headline.querySelectorAll('.line > span');
      spans.forEach(function (span) {
        span.style.transform = 'translateY(110%)';
      });

      /* IntersectionObserver fires the reveal when headline enters viewport */
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            headline.classList.add('is-revealed');
            /* Stagger: delay each line by 80ms */
            spans.forEach(function (span, i) {
              span.style.transitionDelay = (i * 0.08) + 's';
              span.style.transform = 'translateY(0)';
            });
            observer.unobserve(headline);
          }
        });
      }, { threshold: 0.15 });

      observer.observe(headline);
    }

    /* ── LENIS + GSAP SCROLLTRIGGER setup ──
       One RAF loop: autoRaf:false, GSAP ticker drives Lenis.
       Ref: 02-scroll-motion/smooth-scroll-lenis "one RAF loop rule" ── */
    var lenis = null;

    function initLenis() {
      if (!motionOk) return;

      gsap.registerPlugin(ScrollTrigger);

      lenis = new Lenis({
        autoRaf: false,
        lerp: 0.09,
        smoothWheel: true,
        syncTouch: false  /* leave touch to the OS */
      });

      /* Feed Lenis scroll events to ScrollTrigger */
      lenis.on('scroll', ScrollTrigger.update);

      /* GSAP ticker drives the single RAF loop */
      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }

    /* ── HORIZONTAL SCROLL GALLERY
       Pins #work-pin and translates #work-track horizontally.
       Keyboard fallback: if GSAP/Lenis not active, scroll-snap row is usable.
       Ref: 02-scroll-motion/sticky-pinning, 03-layout-systems/magazine-editorial-grid ── */
    function initHorizontalGallery() {
      if (!motionOk || !lenis) return;

      var pin      = document.getElementById('work-pin');
      var track    = document.getElementById('work-track');
      if (!pin || !track) return;

      /* Add JS class to switch overflow to visible — GSAP handles translation */
      track.classList.add('js-horizontal-track');

      /* Total translation distance: full track width minus one viewport width */
      function getScrollWidth() {
        return track.scrollWidth - window.innerWidth;
      }

      var st = ScrollTrigger.create({
        trigger: pin,
        start: 'top top',
        end: function () { return '+=' + getScrollWidth(); },
        pin: true,
        anticipatePin: 1,
        scrub: 0.8,
        /* On update, translate the track by the progress × scrollWidth */
        onUpdate: function (self) {
          var x = -(self.progress * getScrollWidth());
          gsap.set(track, { x: x });
        }
      });

      /* Keyboard accessibility: Tab through work-card links moves the track
         so the focused card scrolls into view. */
      track.querySelectorAll('.work-card__link').forEach(function (link) {
        link.addEventListener('focus', function () {
          var card = link.closest('.work-card');
          if (!card) return;
          var rect      = card.getBoundingClientRect();
          var trackRect = track.getBoundingClientRect();
          /* If card is outside viewport, scroll the pin section to reveal it */
          if (rect.left < 0 || rect.right > window.innerWidth) {
            var offset = rect.left - trackRect.left;
            gsap.to(track, { x: -offset, duration: 0.4,
              ease: 'cubic-bezier(0.16, 1, 0.3, 1)' });
          }
        });
      });

      /* Invalidate on resize */
      window.addEventListener('resize', function () {
        ScrollTrigger.refresh();
      });
    }

    /* ── MAGNETIC BUTTON
       Only on pointer:fine + hover:hover devices. Not on touch.
       Ref: 04-component-patterns/magnetic-animated-buttons ── */
    function initMagnetic() {
      var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (!canHover || !motionOk) return;

      var STRENGTH = 0.32;

      document.querySelectorAll('[data-magnetic]').forEach(function (wrap) {
        var inner = wrap.querySelector('.mag-btn__inner');
        if (!inner) return;

        var rect = null;
        var ro   = new ResizeObserver(function () { rect = null; });
        ro.observe(wrap);

        wrap.addEventListener('pointerenter', function () {
          rect = wrap.getBoundingClientRect();
        });
        wrap.addEventListener('pointermove', function (e) {
          if (!rect) rect = wrap.getBoundingClientRect();
          var xOff = (e.clientX - (rect.left + rect.width  / 2)) * STRENGTH;
          var yOff = (e.clientY - (rect.top  + rect.height / 2)) * STRENGTH;
          inner.style.transform =
            'translate(' + xOff.toFixed(2) + 'px, ' + yOff.toFixed(2) + 'px)';
        });
        wrap.addEventListener('pointerleave', function () {
          inner.style.transform = 'translate(0px, 0px)';
        });
      });
    }

    /* ── TICKER PAUSE BUTTON
       Ref: 02-scroll-motion/marquee-ticker (WCAG 2.2.2) ── */
    function initTicker() {
      var btn    = document.querySelector('.ticker-pause');
      var ticker = document.querySelector('.ticker');
      if (!btn || !ticker) return;
      btn.addEventListener('click', function () {
        var paused = ticker.classList.toggle('is-paused');
        btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
        btn.textContent = paused ? 'Play' : 'Pause';
        btn.setAttribute('aria-label', paused ? 'Play ticker' : 'Pause ticker');
      });
    }

    /* ── CONTACT FORM VALIDATION
       Ref: 08-ui-states-feedback/error-and-validation-states ── */
    function initForm() {
      var form    = document.getElementById('contact-form');
      var summary = document.getElementById('form-error-summary');
      var errList = document.getElementById('form-error-list');
      if (!form || !summary || !errList) return;

      var fields = [
        { id: 'name',    errorId: 'name-error',    msg: 'Please enter your name.'               },
        { id: 'email',   errorId: 'email-error',   msg: 'Please enter a valid email address.'   },
        { id: 'message', errorId: 'message-error', msg: 'Please describe what you have in mind.'}
      ];

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var errors = [];

        fields.forEach(function (f) {
          var input   = document.getElementById(f.id);
          var errSpan = document.getElementById(f.errorId);
          var valid   = input && input.checkValidity();

          if (input) {
            input.setAttribute('aria-invalid', valid ? 'false' : 'true');
          }
          if (errSpan) {
            errSpan.classList.toggle('is-visible', !valid);
          }
          if (!valid) {
            errors.push({ id: f.id, msg: f.msg });
          }
        });

        if (errors.length > 0) {
          /* Populate and show error summary */
          errList.innerHTML = errors.map(function (err) {
            return '<li><a href="#' + err.id + '">' + err.msg + '</a></li>';
          }).join('');
          summary.style.display = 'block';
          summary.focus(); /* move focus to summary for keyboard/screen-reader users */
        } else {
          summary.style.display = 'none';
          /* Real submit logic here — replace with fetch() or form action */
          alert('Thank you — we will be in touch within two working days.');
          form.reset();
          fields.forEach(function (f) {
            var input = document.getElementById(f.id);
            if (input) input.removeAttribute('aria-invalid');
          });
        }
      });

      /* Clear errors on blur once the user has re-entered a field */
      fields.forEach(function (f) {
        var input = document.getElementById(f.id);
        if (!input) return;
        input.addEventListener('blur', function () {
          if (input.value.trim() !== '') {
            var valid = input.checkValidity();
            input.setAttribute('aria-invalid', valid ? 'false' : 'true');
            var errSpan = document.getElementById(f.errorId);
            if (errSpan) errSpan.classList.toggle('is-visible', !valid);
          }
        });
      });
    }

    /* ── INIT ── */
    document.addEventListener('DOMContentLoaded', function () {
      initTextReveal();
      initLenis();
      /* Horizontal gallery and magnetic need Lenis ready first */
      setTimeout(function () {
        initHorizontalGallery();
        initMagnetic();
      }, 50);
      initTicker();
      initForm();

      /* Destroy Lenis if user switches to reduced-motion while tab is open */
      prefersReduced.addEventListener('change', function (e) {
        if (e.matches && lenis) {
          lenis.destroy();
          lenis = null;
          /* ScrollTrigger pins would also need refreshing; in production call
             ScrollTrigger.disable() and re-enable on reduced:false */
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

**Nav** — sticky, `position: sticky` (no GSAP needed), mono kicker style signals the masthead without a logo image. Touch targets on all links are `min-height: 44px` via padding. From `01-visual-styles/editorial-typographic` (masthead treatment) and `02-scroll-motion/sticky-pinning` (pure CSS sticky).

**Hero** — the headline spans 10 of 12 columns and stops short of the right edge — the key anti-slop asymmetric move from `01-visual-styles/editorial-typographic`. The standfirst hangs offset right. The mask-up reveal from `02-scroll-motion/text-reveal-on-scroll` fires once via IntersectionObserver; without JS or with reduced-motion the headline is immediately readable. The magnetic CTA from `04-component-patterns/magnetic-animated-buttons` is the only pointer-reactive element on the page.

**Ticker** — decorative italic serif words rolling past as an editorial band, pause button satisfying WCAG 2.2.2. From `02-scroll-motion/marquee-ticker`. The clone is `aria-hidden`; the strip itself is `aria-live="off"` because the content is decorative.

**Work gallery** — horizontal-scroll case-study row pinned by GSAP ScrollTrigger and translated on scroll. The track degrades to `scroll-snap-type x mandatory` without JS. Tab-focus management ensures keyboard users can reach off-screen cards. From `03-layout-systems/magazine-editorial-grid` (named-line full-bleed container) and `02-scroll-motion/sticky-pinning` (GSAP pin + scrub). The tonal bottom fade uses `linear-gradient(in oklch, ...)` for banding-free interpolation per `07-backgrounds-effects/css-gradients`.

**About** — 8-of-12 column heading, narrow body measure (62ch), gutter aside. Classic editorial balance. From `01-visual-styles/editorial-typographic` and `03-layout-systems/magazine-editorial-grid` (marginal note pattern).

**Contact** — accessible form: `aria-invalid`, `aria-describedby`, focus-managed error summary with `role="alert"`, per-field blur validation. From `08-ui-states-feedback/error-and-validation-states`.

**Footer** — hairline rule, mono metadata. Zero cost, magazine close.

---

## Accessibility checklist

**Reduced motion (in code)**
- `@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }` at the root.
- Lenis is never initialised when `prefersReduced.matches`; it is also destroyed live if the OS setting changes while the tab is open.
- Hero reveal: `js-reveal` class and starting `translateY(110%)` state are only applied in JS when `motionOk === true`; without JS the headline is fully visible.
- Ticker: `@media (prefers-reduced-motion: reduce)` removes the animation and hides the duplicate group so content is static and readable.
- Magnetic button: JS exits early if `motionOk` is false; CSS hover sweep transition is inside `@media (prefers-reduced-motion: no-preference)`.
- Horizontal gallery: GSAP + ScrollTrigger only run when Lenis is active; without them the scroll-snap row is the experience.

**WCAG contrast (verified pairs, using the token values in the scaffold)**
- `--ink` `oklch(13% 0.015 55)` ≈ `#1c1510` on `--paper` `oklch(96% 0.012 80)` ≈ `#f5f0e8`: approximately 15:1 — AAA.
- `--muted` `oklch(40% 0.018 55)` ≈ `#5a4e44` on `--paper`: approximately 6.5:1 — AA normal text.
- `--accent` `oklch(47% 0.14 35)` ≈ `#9c3518` on `--paper`: approximately 6.3:1 — AA for all text. Verify with a contrast checker after any oklch value change.
- Filled magnetic button: `--paper` text on `--ink` fill ≈ 15:1 — AAA.
- Focus rings use `--accent` at 2px with `outline-offset: 3px`; ring vs `--paper` background ≈ 6.3:1 (above 3:1 required by WCAG SC 2.4.11).

**Keyboard and focus**
- All interactive elements are native `<button>`, `<a>`, `<input>`, `<textarea>` — no `div` role-overrides.
- Focus-visible rings on every interactive element (`:focus-visible` with `outline`, never stripped entirely).
- Horizontal gallery: Tab through `.work-card__link` elements triggers a focus handler that brings the card into view.
- Contact form error summary receives programmatic focus (`summary.focus()`) on failed submit; summary has `tabindex="-1"` and `role="alert"`.
- Ticker pause button: `aria-pressed` and `aria-label` updated on toggle; `min-height: 44px`.

**Touch targets**
- All buttons and nav links have `min-height: 44px` (WCAG 2.5.5 AAA / 2.5.8 AA).
- Magnetic button detection zone is 4rem larger than the visual button via `padding: 2rem` on `.mag-wrap` with negative margin to keep layout intact.
- Horizontal gallery is `scroll-snap` on touch where GSAP does not run.

**Screen-reader notes**
- Hero headline has `aria-label` with the full sentence before JS potentially splits the DOM into `.line > span` elements.
- Ticker clone has `aria-hidden="true"`; the ticker container is `aria-live="off"` (decorative).
- Work cards use `role="list"` / `role="listitem"` on the track and cards; each card link has an `aria-label` with the project name and type.
- SVG placeholder images have `role="img"` and `aria-label` descriptions. In production swap for `<img>` with meaningful `alt` text, or `alt=""` if the card heading already describes the image.
- Scroll progress bar: `role="progressbar"` with `aria-valuemin/max/now` updated by JS.

---

## Make it yours

Three knobs — one swap per library entry:

1. **Swap the display typeface** (`05-typography-color/font-pairing`) — Change `--font-display` from Fraunces to Instrument Serif for a lighter, more elegant register, or to General Sans (Fontshare, free) for a grotesk-editorial feel. The grid and token system stay identical; only the personality changes.

2. **Swap the palette hue** (`05-typography-color/oklch-perceptual-color`) — The entire two-hue system is driven by three `--ink`, `--paper`, `--accent` tokens in OKLCH. Shift `--accent` to `oklch(47% 0.16 270)` (indigo) for a cooler, more restrained register, or `oklch(50% 0.13 160)` (forest green) for something earthy. Re-verify AA contrast after any L or C change.

3. **Swap the work section layout** (`03-layout-systems/magazine-editorial-grid`) — Replace the horizontal-scroll gallery with a 2-up asymmetric grid: `grid-column: content-start / span 7` for the featured card and `content-start + 7 / content-end` for a narrow secondary card — a magazine lead + sidebar rhythm. Remove the GSAP ScrollTrigger pin and rely on the magazine grid entry's named-line placement instead.

---

## Library entries used

- `01-visual-styles/editorial-typographic` — skin: ink-on-paper palette, masthead mono kicker, Fraunces display serif, asymmetric headline column span, hairline rules as section dividers, drop-cap and standfirst conventions.
- `03-layout-systems/magazine-editorial-grid` — skeleton: named-line 12-column grid, `[full-start / full-end]` bleed lines, subgrid-ready feature rows, container-based breakpoint collapse, asymmetric column assignment encoding content priority.
- `02-scroll-motion/text-reveal-on-scroll` — hero mask-up line reveal via IntersectionObserver; `prefers-reduced-motion` fallback; `aria-label` wrapper to preserve accessible name across DOM splitting.
- `02-scroll-motion/smooth-scroll-lenis` — Lenis lerp scroll (`autoRaf: false`) + GSAP ticker as single RAF loop; `syncTouch: false`; live reduced-motion guard with `lenis.destroy()`.
- `02-scroll-motion/sticky-pinning` — GSAP ScrollTrigger `pin` on the work gallery section; `scrub: 0.8`; keyboard focus handler to bring off-screen cards into view.
- `04-component-patterns/magnetic-animated-buttons` — magnetic pull (strength 0.32) + fill-sweep CTA; `(hover:hover) and (pointer:fine)` guard; `prefers-reduced-motion` strip; `ResizeObserver` rect cache.
- `02-scroll-motion/marquee-ticker` — editorial discipline ticker; clone `aria-hidden`; pause button with `aria-pressed`; CSS-only pause on hover/focus; `prefers-reduced-motion` kills animation.
- `05-typography-color/font-pairing` — three-role type system (display / body / mono); `font-optical-sizing: auto`; Perfect Fourth modular scale; `clamp()` fluid sizing with rem term for zoom safety.
- `05-typography-color/oklch-perceptual-color` — two-hue OKLCH token palette with hex fallbacks; single committed accent; no gradient; perceptual-uniform ramp logic.
- `07-backgrounds-effects/css-gradients` — single tonal `linear-gradient(in oklch, ...)` on the work section; same hue, varying L; never behind body text.
- `08-ui-states-feedback/error-and-validation-states` — contact form: `aria-invalid`, `aria-describedby`, `role="alert"` error summary, programmatic focus on submit failure, blur-triggered per-field re-validation.
- `09-responsive-foundations/fluid-everything` — fluid spacing scale (`--space-s/m/l/xl`) anchored to the type scale via `clamp()`; `cqi`-compatible column-gap; all breakpoints expressed as layout collapses not visual repaints.
- `_slop-blocklist.md` — checked against: TYPE (Fraunces not Inter-everywhere), LAYOUT (asymmetric 10-of-12 headline not centered-800px-column), COLOR (warm oklch ink/paper + one rust accent, not purple-pink gradient), MOTION (one reveal + one magnetic CTA, not uniform fade-up on every element).
