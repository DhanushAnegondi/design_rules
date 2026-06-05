# Carousels and sliders

> A windowed sequence of content panels where one item is visible at a time, navigated by prev/next controls, dot indicators, swipe, or (cautiously) autoplay.

**Bucket:** component
**Maturity:** current — but perpetually misused; the accessibility surface area is higher than almost any other widget
**Effort:** high
**Best for:** portfolios, apps, e-commerce product galleries, editorial feature sections, onboarding flows

---

## What it is

The user sees a single "slide" framed in a container; left/right controls or dot pickers advance through the set. The mental model is a physical deck of cards — one face-up card at a time, with the others hidden behind it. Two implementation strategies exist: (1) a JavaScript-driven approach that moves the active slide with `transform: translateX` and manages ARIA states explicitly, following the ARIA APG carousel pattern; (2) a CSS-native approach that uses `scroll-snap-type` on a scrollable container, letting the browser handle the snapping, and (as of 2025) optionally `::scroll-button()` and `::scroll-marker()` pseudo-elements for zero-JS navigation affordances. Both strategies require deliberate accessibility work — carousels are among the most frequently cited WCAG failures in production audits.

---

## When to use

- A product detail page needs to show 8–12 images of one item without stacking them vertically.
- An onboarding flow must walk a user through 4–5 sequential steps one at a time to avoid cognitive overload.
- A portfolio "featured work" section surfaces 3–6 case studies with equal visual weight and the user should browse, not scroll.
- A testimonials or press-quotes section where lateral browsing is natural and the content set is not exhaustive.
- A touch-first mobile context where horizontal swipe between items maps directly to a physical gesture.

---

## When NOT to use

- **Homepage hero autoplay carousel.** Nielsen Group research consistently shows hero carousels are largely ignored — only the first slide receives meaningful clicks, and subsequent slides are treated as banner ads. A single focused hero with a strong headline and one CTA outperforms a rotating carousel in both conversion and LCP.
- **Body-content discovery.** If users need to find items efficiently, a grid or filtered list is faster and more scannable. Carousels hide content and require sequential browsing.
- **When you cannot commit to the full ARIA pattern.** A partially-implemented carousel — one with autoplay but no pause control, or with hidden slides still in the tab order — is worse than a grid. Either do it right or replace it with a simpler layout.
- **Marketing "everyone agreed on four messages" situations.** The classic overuse: unable to cut hero content, a team adds a carousel so all four messages "fit." The user sees the first message only. Cut to one, or use a bento grid.
- **Excessive image carousels on slow connections.** Loading 10 full-bleed images eagerly tanks LCP. If you must, lazy-load non-active slides.

---

## How it works

### JS-driven approach (APG pattern)

The carousel container is a `<section>` (implicit `role="region"`) with `aria-roledescription="carousel"` and an `aria-label`. Each slide is a `<div role="group" aria-roledescription="slide" aria-label="N of total">`. A live region on the slides container is toggled: `aria-live="off"` during autoplay (to prevent constant screen-reader interruptions), and `aria-live="polite"` when the user manually navigates. The pause/play button comes **first** in tab order within the carousel; its label changes to "Stop slide rotation" / "Start slide rotation" to reflect current state. Autoplay stops on `pointerenter`, keyboard `focus`, and when `prefers-reduced-motion: reduce` is set. Previous/next buttons use `aria-controls` referencing the slides container ID. Hidden slides must not receive keyboard focus — their focusable children need `tabindex="-1"` or the slides themselves need `aria-hidden="true"` (keep both in sync).

Key CSS properties:
- `overflow: hidden` on the track; `display: flex` on the slide strip
- Transition: `transform: translateX(n%)` animated with `transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)`
- No `width` or `height` changes during transition — only `transform` and `opacity`

### CSS scroll-snap approach (progressive, no-JS baseline)

The container gets `overflow-x: auto; scroll-snap-type: inline mandatory; scroll-behavior: smooth`. Each slide gets `scroll-snap-align: center; flex: 0 0 100%`. Touch and mouse users get native swipe/drag for free. Keyboard users can tab into the container and use arrow keys if the slides are `<li>` elements inside a `<ul>`. Prev/next buttons use `scrollBy()` in JS or the new `::scroll-button()` pseudo-element (Chrome/Edge 135+, Safari not yet supported as of mid-2026).

The `interactivity: inert` + `scroll-state` approach (Chrome 135+) automatically removes off-screen slide content from the tab order using:
```css
.slide > * { interactivity: inert; }
@container scroll-state(snapped: inline) {
  .slide > * { interactivity: auto; }
}
```
This is the most future-aligned approach but requires a progressive-enhancement fallback for Firefox and Safari (use `tabindex="-1"` on focusable children of non-active slides via JS).

---

## Working code

### Vanilla JS — APG-compliant carousel with pause, prev/next, aria

Complete, self-contained HTML file. Uses real microcopy ("Behind the scenes of three projects") not placeholder text.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Project carousel</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: "General Sans", system-ui, sans-serif;
      background: #0f0f11;
      color: #e8e6e3;
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: 2rem;
    }

    /* ── Carousel shell ─────────────────────────────────────── */
    .carousel {
      width: 100%;
      max-width: 48rem;
    }

    .carousel__track-wrap {
      overflow: hidden;
      border-radius: 12px;
      position: relative;
    }

    .carousel__track {
      display: flex;
      /* transition disabled when prefers-reduced-motion is set */
      transition: transform 0.48s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* ── Slides ─────────────────────────────────────────────── */
    .carousel__slide {
      min-width: 100%;
      position: relative;
      user-select: none;
    }

    .carousel__slide img {
      width: 100%;
      height: 26rem;
      object-fit: cover;
      display: block;
    }

    .slide__caption {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 2.5rem 1.75rem 1.75rem;
      background: linear-gradient(to top, hsl(240 12% 6% / 0.9) 0%, transparent 100%);
    }

    .slide__label {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #a8a29e;
      margin: 0 0 0.35rem;
    }

    .slide__title {
      font-size: clamp(1.1rem, 2.5vw, 1.5rem);
      font-weight: 700;
      margin: 0;
      line-height: 1.2;
    }

    /* ── Controls bar ───────────────────────────────────────── */
    .carousel__controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .carousel__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      border: 1.5px solid #3a3840;
      background: transparent;
      color: #e8e6e3;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.18s, border-color 0.18s;
    }

    .carousel__btn:hover {
      background: #1e1c22;
      border-color: #6b6875;
    }

    .carousel__btn:focus-visible {
      outline: 2.5px solid #b4a7f5;
      outline-offset: 3px;
    }

    /* Pause button gets slightly different shape */
    .carousel__btn--pause {
      border-radius: 8px;
    }

    .carousel__btn svg {
      width: 1rem;
      height: 1rem;
      fill: currentColor;
    }

    /* Dot indicators */
    .carousel__dots {
      display: flex;
      gap: 0.5rem;
      margin-left: auto;
    }

    .carousel__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      border: none;
      background: #3a3840;
      cursor: pointer;
      padding: 0;
      transition: background 0.2s, transform 0.2s;
    }

    .carousel__dot:focus-visible {
      outline: 2.5px solid #b4a7f5;
      outline-offset: 3px;
    }

    .carousel__dot[aria-disabled="true"] {
      background: #b4a7f5;
      transform: scale(1.4);
      cursor: default;
    }

    /* ── Reduced-motion overrides ───────────────────────────── */
    @media (prefers-reduced-motion: reduce) {
      .carousel__track {
        transition: none;
      }
    }
  </style>
</head>
<body>

<!--
  APG carousel pattern:
  - section = implicit role="region"
  - aria-roledescription="carousel" overrides the region announcement
  - aria-label describes what the carousel contains
-->
<section
  class="carousel"
  aria-roledescription="carousel"
  aria-label="Selected projects"
  id="main-carousel"
>
  <div class="carousel__track-wrap">
    <!--
      aria-live toggles:
        "off"     → while autoplay is running (prevents constant interruption)
        "polite"  → when user manually navigates (announces the new slide label)
    -->
    <div
      class="carousel__track"
      id="carousel-track"
      aria-live="polite"
      aria-atomic="false"
    >
      <!-- Each slide: role="group" + aria-roledescription="slide" + aria-label="N of N" -->
      <div
        class="carousel__slide"
        role="group"
        aria-roledescription="slide"
        aria-label="1 of 3"
        id="slide-1"
      >
        <!--
          Using a solid-color placeholder so the snippet runs without external images.
          In production, replace the div with <img src="..." alt="Descriptive alt text">.
        -->
        <div style="width:100%;height:26rem;background:linear-gradient(135deg,#1a1730 0%,#2e2150 100%);display:flex;align-items:center;justify-content:center;">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <rect width="64" height="64" rx="8" fill="#3d3460"/>
            <path d="M20 44V24l24 10-24 10z" fill="#b4a7f5"/>
          </svg>
        </div>
        <div class="slide__caption">
          <p class="slide__label">Case study 01</p>
          <h2 class="slide__title">How we rebuilt checkout in six weeks</h2>
        </div>
      </div>

      <div
        class="carousel__slide"
        role="group"
        aria-roledescription="slide"
        aria-label="2 of 3"
        id="slide-2"
        aria-hidden="true"
      >
        <div style="width:100%;height:26rem;background:linear-gradient(135deg,#0f1f1a 0%,#1a3d30 100%);display:flex;align-items:center;justify-content:center;">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <rect width="64" height="64" rx="8" fill="#1d3d2e"/>
            <circle cx="32" cy="32" r="14" fill="#6ee7b7"/>
          </svg>
        </div>
        <div class="slide__caption">
          <p class="slide__label">Case study 02</p>
          <h2 class="slide__title">Designing a data platform engineers actually enjoy</h2>
        </div>
      </div>

      <div
        class="carousel__slide"
        role="group"
        aria-roledescription="slide"
        aria-label="3 of 3"
        id="slide-3"
        aria-hidden="true"
      >
        <div style="width:100%;height:26rem;background:linear-gradient(135deg,#1f1510 0%,#3d2510 100%);display:flex;align-items:center;justify-content:center;">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <rect width="64" height="64" rx="8" fill="#3d2510"/>
            <path d="M16 48L32 16l16 32H16z" fill="#fbbf24"/>
          </svg>
        </div>
        <div class="slide__caption">
          <p class="slide__label">Case study 03</p>
          <h2 class="slide__title">Motion design for a health app's onboarding</h2>
        </div>
      </div>
    </div>
  </div>

  <!--
    Controls:
    - Pause/play comes FIRST in tab order (APG requirement)
    - Prev/next use aria-controls pointing at the track
    - Dots use aria-disabled (not disabled attr) so they remain focusable for AT
  -->
  <div class="carousel__controls">
    <!-- Pause button — label reflects current playback state -->
    <button
      class="carousel__btn carousel__btn--pause"
      id="carousel-pause"
      aria-label="Stop automatic slide rotation"
      type="button"
    >
      <!-- Pause icon (two bars) -->
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <rect x="3" y="2" width="3" height="12" rx="1"/>
        <rect x="10" y="2" width="3" height="12" rx="1"/>
      </svg>
    </button>

    <!-- Previous -->
    <button
      class="carousel__btn"
      id="carousel-prev"
      aria-label="Previous slide"
      aria-controls="carousel-track"
      type="button"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
    </button>

    <!-- Next -->
    <button
      class="carousel__btn"
      id="carousel-next"
      aria-label="Next slide"
      aria-controls="carousel-track"
      type="button"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
    </button>

    <!-- Dot indicators -->
    <div class="carousel__dots" role="group" aria-label="Choose slide to display">
      <button class="carousel__dot" aria-label="Slide 1" aria-disabled="true" data-index="0" type="button"></button>
      <button class="carousel__dot" aria-label="Slide 2" aria-disabled="false" data-index="1" type="button"></button>
      <button class="carousel__dot" aria-label="Slide 3" aria-disabled="false" data-index="2" type="button"></button>
    </div>
  </div>
</section>

<script>
(function () {
  "use strict";

  const track       = document.getElementById("carousel-track");
  const pauseBtn    = document.getElementById("carousel-pause");
  const prevBtn     = document.getElementById("carousel-prev");
  const nextBtn     = document.getElementById("carousel-next");
  const slides      = Array.from(track.querySelectorAll(".carousel__slide"));
  const dots        = Array.from(document.querySelectorAll(".carousel__dot"));

  const TOTAL       = slides.length;
  const INTERVAL_MS = 5000;

  // Pause icons (inline SVG strings)
  const ICON_PAUSE = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="currentColor"><rect x="3" y="2" width="3" height="12" rx="1"/><rect x="10" y="2" width="3" height="12" rx="1"/></svg>`;
  const ICON_PLAY  = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="currentColor"><path d="M4 2l10 6-10 6V2z"/></svg>`;

  let current      = 0;
  let isPlaying    = false; // start paused — user must opt in to autoplay
  let timer        = null;

  // Detect reduced-motion preference (also listen for runtime changes)
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ── Core: go to slide index ──────────────────────────────────────────
  function goTo(index, source) {
    const prev = current;
    current = (index + TOTAL) % TOTAL;

    // Move track
    track.style.transform = `translateX(-${current * 100}%)`;

    // aria-live: "polite" for manual navigation, "off" during autoplay
    track.setAttribute("aria-live", source === "auto" ? "off" : "polite");

    // Toggle aria-hidden on slides so AT only reads active slide
    slides.forEach(function (slide, i) {
      const active = i === current;
      slide.setAttribute("aria-hidden", active ? "false" : "true");
      // Prevent keyboard focus reaching off-screen interactive content
      slide.querySelectorAll("a, button, input, [tabindex]").forEach(function (el) {
        if (active) {
          el.removeAttribute("tabindex");
        } else {
          el.setAttribute("tabindex", "-1");
        }
      });
    });

    // Update dots
    dots.forEach(function (dot, i) {
      const isCurrent = i === current;
      dot.setAttribute("aria-disabled", isCurrent ? "true" : "false");
      // aria-disabled keeps the button focusable (unlike disabled attr)
      // Prevent clicking the current dot from doing anything
    });
  }

  // ── Autoplay ─────────────────────────────────────────────────────────
  function startPlay() {
    // Never autoplay if user prefers reduced motion
    if (reducedMotion.matches) return;
    if (isPlaying) return;

    isPlaying = true;
    track.setAttribute("aria-live", "off");
    pauseBtn.setAttribute("aria-label", "Stop automatic slide rotation");
    pauseBtn.innerHTML = ICON_PAUSE;
    timer = setInterval(function () {
      goTo(current + 1, "auto");
    }, INTERVAL_MS);
  }

  function stopPlay() {
    if (!isPlaying) return;

    isPlaying = false;
    clearInterval(timer);
    timer = null;
    track.setAttribute("aria-live", "polite");
    pauseBtn.setAttribute("aria-label", "Start automatic slide rotation");
    pauseBtn.innerHTML = ICON_PLAY;
  }

  // ── Event listeners ───────────────────────────────────────────────────
  pauseBtn.addEventListener("click", function () {
    isPlaying ? stopPlay() : startPlay();
  });

  prevBtn.addEventListener("click", function () {
    stopPlay();
    goTo(current - 1, "manual");
  });

  nextBtn.addEventListener("click", function () {
    stopPlay();
    goTo(current + 1, "manual");
  });

  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      if (dot.getAttribute("aria-disabled") === "true") return;
      stopPlay();
      goTo(i, "manual");
    });
    // Keyboard: Enter/Space handled by browser for button; no extra handler needed
  });

  // Pause on hover and focus-within (APG requirement)
  const carousel = document.getElementById("main-carousel");

  carousel.addEventListener("pointerenter", stopPlay);
  carousel.addEventListener("pointerleave", function () {
    // Only resume if the carousel itself initiated play — don't auto-resume
    // in this implementation; let the user decide (better UX than silent resume)
  });

  carousel.addEventListener("focusin", function () {
    // Pause on any focus entering the carousel (APG requirement)
    if (isPlaying) stopPlay();
  });

  // Respect real-time changes to OS motion preference
  reducedMotion.addEventListener("change", function () {
    if (reducedMotion.matches) stopPlay();
  });

  // ── Init ──────────────────────────────────────────────────────────────
  goTo(0, "init");
  // Autoplay is OFF by default — uncomment to enable:
  // startPlay();
}());
</script>

</body>
</html>
```

---

### CSS scroll-snap approach — progressively enhanced, touch-native

This version uses native browser scroll behavior as the engine. Prev/next buttons exist for pointer/keyboard users; touch users swipe natively. Autoplay is omitted (scroll-snap carousels are almost always manually navigated — do not add autoplay without a pause control).

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Scroll-snap carousel</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: system-ui, sans-serif;
      background: #f5f3ef;
      color: #1a1814;
      padding: 3rem 1rem;
    }

    /* ── Scroller ───────────────────────────────────────────── */
    .snapper {
      width: 100%;
      max-width: 42rem;
      margin: 0 auto;
    }

    .snapper__list {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: inline mandatory;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-x: contain;
      gap: 1rem;
      padding-bottom: 0.5rem;
      /* Hide scrollbar visually but keep it functional */
      scrollbar-width: none;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .snapper__list::-webkit-scrollbar { display: none; }

    .snapper__item {
      scroll-snap-align: start;
      flex: 0 0 100%;
      border-radius: 10px;
      overflow: hidden;
      background: #e8e4de;
    }

    .snapper__img {
      width: 100%;
      height: 20rem;
      object-fit: cover;
      display: block;
    }

    /* Placeholder for demo */
    .snapper__img-placeholder {
      width: 100%;
      height: 20rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: 700;
      color: #9a9490;
    }

    .snapper__caption {
      padding: 1.25rem 1.5rem;
    }

    .snapper__caption h3 {
      margin: 0 0 0.25rem;
      font-size: 1.05rem;
      font-weight: 600;
    }

    .snapper__caption p {
      margin: 0;
      font-size: 0.875rem;
      color: #6b6460;
    }

    /* ── Controls ───────────────────────────────────────────── */
    .snapper__controls {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }

    .snapper__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      border: 1.5px solid #c8c4bc;
      background: #fff;
      color: #1a1814;
      cursor: pointer;
    }

    .snapper__btn:hover {
      background: #f0ede8;
    }

    .snapper__btn:focus-visible {
      outline: 2.5px solid #1a6cf0;
      outline-offset: 3px;
    }

    .snapper__btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .snapper__btn svg {
      width: 1rem;
      height: 1rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Reduced motion: disable smooth scroll */
    @media (prefers-reduced-motion: reduce) {
      .snapper__list {
        scroll-behavior: auto;
      }
    }
  </style>
</head>
<body>

<section aria-roledescription="carousel" aria-label="Customer stories" class="snapper">
  <ul class="snapper__list" id="snap-list">
    <li class="snapper__item" role="group" aria-roledescription="slide" aria-label="1 of 3">
      <div class="snapper__img-placeholder" style="background:#dde8f5;">Slide 1</div>
      <div class="snapper__caption">
        <h3>Three months to market, not twelve</h3>
        <p>How a two-person team shipped a B2B dashboard on a startup timeline.</p>
      </div>
    </li>
    <li class="snapper__item" role="group" aria-roledescription="slide" aria-label="2 of 3">
      <div class="snapper__img-placeholder" style="background:#e8f5dd;">Slide 2</div>
      <div class="snapper__caption">
        <h3>From cluttered sidebar to one clear action</h3>
        <p>A navigation audit that cut support tickets by 40%.</p>
      </div>
    </li>
    <li class="snapper__item" role="group" aria-roledescription="slide" aria-label="3 of 3">
      <div class="snapper__img-placeholder" style="background:#f5e8dd;">Slide 3</div>
      <div class="snapper__caption">
        <h3>Accessibility rewrite that opened a new market</h3>
        <p>WCAG 2.1 AA compliance turned a compliance task into a business opportunity.</p>
      </div>
    </li>
  </ul>

  <div class="snapper__controls">
    <button class="snapper__btn" id="snap-prev" aria-label="Previous slide" aria-controls="snap-list" type="button">
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M10 3L5 8l5 5"/>
      </svg>
    </button>
    <button class="snapper__btn" id="snap-next" aria-label="Next slide" aria-controls="snap-list" type="button">
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M6 3l5 5-5 5"/>
      </svg>
    </button>
  </div>
</section>

<script>
(function () {
  "use strict";

  const list    = document.getElementById("snap-list");
  const prevBtn = document.getElementById("snap-prev");
  const nextBtn = document.getElementById("snap-next");
  const items   = Array.from(list.children);
  const TOTAL   = items.length;

  function getActiveIndex() {
    // Find which slide is snapped (closest to left edge)
    const scrollLeft = list.scrollLeft;
    const itemWidth  = list.firstElementChild.offsetWidth + 16; // 16 = gap
    return Math.round(scrollLeft / itemWidth);
  }

  function scrollToIndex(index) {
    const clamped   = Math.max(0, Math.min(TOTAL - 1, index));
    const itemWidth = items[0].offsetWidth + 16;
    list.scrollTo({ left: clamped * itemWidth, behavior: "smooth" });
  }

  function updateButtons() {
    const idx     = getActiveIndex();
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === TOTAL - 1;
  }

  prevBtn.addEventListener("click", function () {
    scrollToIndex(getActiveIndex() - 1);
  });

  nextBtn.addEventListener("click", function () {
    scrollToIndex(getActiveIndex() + 1);
  });

  list.addEventListener("scroll", updateButtons, { passive: true });

  // Respect reduced-motion: scroll-behavior already set to auto in CSS;
  // no JS change needed — the browser handles it.

  updateButtons();
}());
</script>

</body>
</html>
```

---

### React + Tailwind (Embla) — production variant

Embla is ~7 KB gzipped, dependency-free, and the engine under shadcn/ui's carousel. Add the accessibility plugin (`embla-carousel-aria`) for ARIA live regions. This example shows the core wiring with manual ARIA attributes so the logic is visible.

```tsx
"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

const slides = [
  { label: "Issue 01", title: "The last redesign before we ran out of runway" },
  { label: "Issue 02", title: "What twelve user interviews taught us about onboarding" },
  { label: "Issue 03", title: "Shipping design tokens across five platforms at once" },
];

export function ProjectCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [current, setCurrent]     = useState(0);
  const [liveText, setLiveText]   = useState("");

  // Sync state on slide change
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      setCurrent(idx);
      // Only announce on user-initiated navigation (not initial load)
      setLiveText(`Slide ${idx + 1} of ${slides.length}: ${slides[idx].title}`);
    };
    emblaApi.on("select", onSelect);
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Project stories"
      className="w-full max-w-2xl mx-auto"
    >
      {/* Polite live region — announces slide changes to screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveText}
      </div>

      {/* Embla viewport — id="embla-track" is required so aria-controls on the buttons resolves */}
      <div className="overflow-hidden rounded-xl" ref={emblaRef} id="embla-track">
        <div className="flex">
          {slides.map((slide, i) => (
            <div
              key={i}
              className="min-w-0 flex-[0_0_100%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
              aria-hidden={i !== current}
            >
              {/* Placeholder; replace with <img alt="..."> in production */}
              <div className="h-64 bg-zinc-900 flex items-center justify-center text-zinc-600 text-sm rounded-xl">
                {slide.label}
              </div>
              <div className="pt-4 pb-2">
                <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-1">
                  {slide.label}
                </p>
                <h2 className="text-lg font-semibold text-zinc-100 leading-snug">
                  {slide.title}
                </h2>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={scrollPrev}
          aria-label="Previous slide"
          aria-controls="embla-track"
          disabled={current === 0}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {/* left chevron */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button
          onClick={scrollNext}
          aria-label="Next slide"
          aria-controls="embla-track"
          disabled={current === slides.length - 1}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {/* right chevron */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Dot indicators */}
        <div className="ml-auto flex gap-2" role="group" aria-label="Choose slide to display">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Slide ${i + 1}`}
              aria-disabled={i === current}
              className={`w-2 h-2 rounded-full border-0 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400 ${
                i === current
                  ? "bg-violet-400 scale-125 cursor-default"
                  : "bg-zinc-600 hover:bg-zinc-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

> Note: Embla requires `npm i embla-carousel-react`. For full ARIA live regions and accessibility plugin, also install `embla-carousel-aria`. Tailwind classes above require Tailwind CSS v3+.

---

## Variations

| Variant | Defining characteristic |
|---|---|
| **Full-bleed product gallery** | Single slide fills entire viewport width; used for e-commerce product images; no autoplay |
| **Peek/overflow carousel** | Next slide peeks in from edge (e.g. `flex: 0 0 85%`), communicating there is more content |
| **Multi-slide-visible** | Two or three slides visible simultaneously; dots indicate page not individual slides |
| **Tabbed carousel (APG alt)** | Slides use `role="tabpanel"` + a `role="tablist"` for dot pickers; no `aria-roledescription="slide"` |
| **Autoplay news ticker** | Purely decorative marquee-style; use `role="marquee"` or `aria-hidden` + CSS animation; never use carousel pattern |
| **Vertical scroll carousel** | `scroll-snap-type: block mandatory`; less common, suits card-deck / story formats |

---

## Accessibility

### prefers-reduced-motion — mandatory

For the JS-driven variant, never start autoplay if the user has requested reduced motion:

```javascript
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function startPlay() {
  if (reducedMotion.matches) return; // hard stop — do not autoplay
  // ... rest of startPlay
}

// React to runtime OS changes (user can change setting while page is open)
reducedMotion.addEventListener("change", function () {
  if (reducedMotion.matches) stopPlay();
});
```

For the CSS scroll-snap variant, disable smooth scrolling:

```css
@media (prefers-reduced-motion: reduce) {
  .snapper__list {
    scroll-behavior: auto; /* instant jump, no animation */
  }
}
```

For slide transitions (`transform: translateX`), remove the transition:

```css
@media (prefers-reduced-motion: reduce) {
  .carousel__track {
    transition: none;
  }
}
```

### ARIA roles and properties checklist

- `<section>` (or `<div role="region">`) with `aria-roledescription="carousel"` and `aria-label="[descriptive name]"` — do not include the word "carousel" in `aria-label` since `aria-roledescription` already announces it.
- Each slide: `role="group"`, `aria-roledescription="slide"`, `aria-label="N of [total]"` — the positional label is critical for screen-reader orientation.
- Slides not in view: `aria-hidden="true"` — prevents AT from reading off-screen content.
- Live region: `aria-live="polite"` for manual navigation; `aria-live="off"` while autoplay runs. Both on the slides wrapper, toggled dynamically.
- Pause button label: changes between "Stop automatic slide rotation" and "Start automatic slide rotation" — uses `aria-label` update, not `aria-pressed` (APG explicitly avoids `aria-pressed` for this button).
- Dot indicators: use `aria-disabled="true"` (not the `disabled` HTML attribute) on the active dot — this keeps the element focusable for AT but communicates it is the current item.
- Prev/next buttons: `aria-controls="[track-id]"` to link controls to the region they affect.

### Keyboard navigation (APG requirements)

| Key | Behavior |
|---|---|
| Tab | Moves to pause button first (it must be first in carousel tab order), then prev, then next, then slides |
| Space / Enter | Activates focused button (pause, prev, next, dot) |
| Arrow keys | Standard button behavior (no special handling needed for basic carousel; tablist variant uses arrow keys for tab switching) |

### Focus management

- When a user activates prev/next, focus stays on the button — this is correct. Do not move focus to the new slide; doing so would disrupt keyboard flow.
- Hidden slide content (links, buttons inside off-screen slides) must not receive focus. Implement `tabindex="-1"` on all focusable children of inactive slides, or use the `interactivity: inert` CSS property (Chrome/Edge 135+) with a JS fallback for other browsers.
- The `.carousel__btn:focus-visible` outline must be visible. Never suppress `outline` without a visible replacement. The code above uses `outline: 2.5px solid #b4a7f5` with `outline-offset: 3px`.

### Contrast (colors used in the vanilla demo above)

The vanilla demo uses `#e8e6e3` text on `hsl(240 12% 6%)` background (#0e0d11 approximately). Contrast ratio for `#e8e6e3` on `#0f0f11` is approximately 17:1, well above the 4.5:1 WCAG AA requirement for normal text and 3:1 for large/bold text. The `#b4a7f5` focus ring on the dark background also exceeds 3:1 against both the button surface and the page background.

### Touch and pointer fallback

- CSS scroll-snap carousels get touch swipe for free — no JS needed.
- JS-driven carousels should add pointer event handling for drag-to-swipe if desired; this is optional if prev/next buttons exist and are accessible.
- Do not rely on hover-only affordances: `:hover` states on buttons must have equivalent `:focus-visible` states.
- The pause-on-hover behavior uses `pointerenter`/`pointerleave` events (works for mouse and stylus). On touch devices where there is no hover, the carousel should not autoplay (or respect the user's explicit stop — this implementation defaults to paused).
- Control targets must be at minimum 44×44 CSS pixels for touch usability (the 40×40 px buttons in the code are slightly under; bump to 44×44 in production via `width: 2.75rem; height: 2.75rem`).

### Screen reader behavior

- With `aria-live="polite"` active, screen readers will announce the new slide's `aria-label` (e.g. "2 of 3") after the transition settles. They will also read the slide's content because that content is now un-hidden.
- During autoplay, `aria-live="off"` prevents a firehose of announcements every 5 seconds.
- The `role="group"` + `aria-roledescription="slide"` pattern causes VoiceOver/NVDA to announce "slide, 2 of 3" before reading slide content, giving orientation context.

---

## Performance

- **Animate only `transform` and `opacity`** — never animate `left`, `width`, `margin-left`, or any property that triggers layout. The `translateX(n%)` pattern is compositor-friendly.
- **Lazy load off-screen images** — add `loading="lazy"` to `<img>` elements in non-initial slides. For JS-driven carousels, you can also swap `data-src` to `src` on demand.
- **`will-change: transform`** — apply it to the track element only while animating; remove it afterward. Blanket `will-change` creates unnecessary GPU layers for every slide simultaneously.
- **LCP impact** — the first slide's image is almost certainly in the LCP candidate. Use `<link rel="preload" as="image">` for it. Do not lazy-load slide 1.
- **Library bundle sizes** — Embla: ~7 KB gzipped. Splide: ~27 KB. Swiper (full): ~47 KB with tree-shaking reducing it to ~20 KB. For a simple one-off carousel, the vanilla scroll-snap approach has zero JS bundle cost.
- **Scroll-snap CSS performance** — the browser handles scroll containment natively; it does not trigger JavaScript paint/layout cycles on scroll, making it significantly cheaper than JS-driven position tracking.
- **Autoplay timer cleanup** — always `clearInterval` in component unmount (React `useEffect` cleanup) or on page visibility change (`document.addEventListener("visibilitychange", ...)`) to prevent wasted work on hidden tabs.

---

## Anti-slop

**The cliche (see `_slop-blocklist.md` → Motion: "autoplaying carousel with no controls"):** a homepage hero with four marketing messages rotating every 3 seconds, no pause button, transitions that fade-and-slide every element at the same duration using the default `ease` easing. This is the single most-cited carousel failure in both accessibility audits and UX research.

**The tasteful alternative:**
1. Default autoplay to **off**. If the use case genuinely requires autoplay, give users a clearly labeled pause control as the first tabbable element, use a minimum 5-second interval, and stop on hover/focus.
2. Use a **custom easing curve** — `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) for slide transitions reads intentional; `ease` reads default.
3. Reserve the carousel for content where lateral browsing is the natural mental model (product images, case studies). Do not use it because stakeholders could not choose one hero message.
4. Consider the **scroll-snap approach** over a JS-driven one: it costs nothing in bundle size, handles touch natively, and degrades gracefully in old browsers.
5. On portfolios: a bento grid or editorial row showing 2–3 projects simultaneously is almost always more effective than a carousel hiding everything but the active slide.

---

## Pairs well with

- **Scroll-driven animations** — animate slide content (headline, image) on entry using `animation-timeline: view()` or GSAP ScrollTrigger within each slide; keep transitions short (<0.5s) and respect reduced-motion.
- **Lightbox / modal** — a product image carousel that opens a fullscreen modal on click; the modal must return focus to the triggering thumbnail on close.
- **Lazy image loading** — `loading="lazy"` on non-initial slides; `fetchpriority="high"` on the first slide's image.
- **Intersection Observer** — detect which slide is in view to update dot state without relying on scroll events, especially useful for free-scroll multi-slide variants.
- **Tab pattern (APG)** — for content where users jump directly to a slide (not browse sequentially), the tablist-based carousel variant is more efficient than prev/next.

---

## Current references

- [Carousel (Slide Show or Image Rotator) Pattern — W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) — the authoritative ARIA role/keyboard specification; read before writing any carousel
- [Auto-Rotating Image Carousel Example — W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-1-prev-next/) — reference implementation for the prev/next + pause pattern with full aria-live toggling
- [Carousels Tutorial — WAI W3C](https://www.w3.org/WAI/tutorials/carousels/) — structure, functionality, animation, and styling guidance from the W3C WAI team
- [Carousels with CSS — Chrome for Developers (2025)](https://developer.chrome.com/blog/carousels-with-css) — covers `::scroll-button()`, `::scroll-marker()`, `scroll-state` queries, and `interactivity: inert` shipped in Chrome 135
- [Make accessible carousels — Chrome for Developers](https://developer.chrome.com/blog/accessible-carousel) — practical guide to `interactivity: inert` + `scroll-state` for managing off-screen focusability
- [Splide accessibility guide](https://splidejs.com/guides/accessibility/) — documents how Splide manages aria-live toggling, roving tabindex on dots, and reduced-motion
- [Embla Carousel accessibility plugin](https://www.embla-carousel.com/docs/plugins/accessibility) — API for `announceChanges`, `carouselAriaLabel`, `slideAriaLabel` callbacks
- [WCAG 2.2.2 Pause, Stop, Hide — W3C Understanding Document](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) — exact Level A criterion that mandates pause controls for auto-moving content lasting more than 5 seconds
- [Carousel Usability — Nielsen Norman Group](https://www.nngroup.com/articles/designing-effective-carousels/) — research-backed case for when carousels fail and what to use instead
