# Mobile-first patterns

> Write the smallest, leanest version of your UI first — then layer in complexity for wider viewports with `min-width` queries and progressive enhancement.

**Bucket:** layout
**Maturity:** evergreen
**Effort:** medium
**Best for:** websites, portfolios, apps, dashboards

## What it is

Mobile-first is a CSS authoring methodology, not just a design philosophy. Base styles (no media query at all) target the narrowest viewport. Each `@media (min-width: ...)` block then adds, not overrides, layout behaviour as space opens up. The user on a 375 px phone downloads only the base layer of CSS; the user on a 1440 px monitor downloads that same base layer plus the enhancements. The result is less redundancy, less specificity warfare, and a performance baseline that starts lean.

Progressive enhancement extends the same idea across the entire stack: semantic HTML works with no CSS; CSS adds layout and visual polish; container queries and `clamp()` handle the fluid transitions that used to require a breakpoint thicket; JavaScript augments interaction without gating content. The mobile experience is never an afterthought bolted on after the desktop version is "finished."

## When to use

- Starting a new project from scratch — mobile-first is the default position; switching later is painful.
- Any site where the majority of traffic is on phones (which is most sites — check your analytics).
- Component libraries where the same card, nav, or dialog must work in narrow sidebars and wide grids alike.
- Projects with a performance budget: the mobile-first CSS cascade avoids shipping desktop layout overrides to devices that will never trigger them.
- When you inherit a desktop-down codebase that has become unmaintainable and need to refactor a module at a time.

## When NOT to use

- Internal tooling (dense data tables, CAD-style apps) where the primary users are on large screens with a pointing device — the mental overhead of mobile-first still applies, but the effort-to-payoff ratio shrinks.
- When a framework you do not control ships desktop-down styles that you cannot override cleanly; fighting specificity uphill costs more than it saves.
- On isolated, non-responsive, print-only stylesheets.
- Do not confuse mobile-first *CSS* with "build a separate mobile site" — the latter is a 2010 anti-pattern (m.site.com) that mobile-first methodology was designed to kill.

## How it works

**The cascade as progressive enhancement.** A rule with no media query always applies. A rule inside `@media (min-width: 48rem)` applies only when there is room for it. This means narrow viewports get the smallest file path through the CSS; each breakpoint adds rather than overwrites. Contrast with desktop-down where every mobile style must undo its desktop counterpart — the undo chain grows linearly with complexity.

**Key CSS machinery:**

```
min-width queries    →  add layout as space appears
clamp()              →  fluid type/space between two fixed ends, no breakpoints
container queries    →  component responds to its container, not the viewport
svh / dvh            →  correct full-height sections accounting for browser chrome
env(safe-area-*)     →  content clear of notches, home bars, and rounded corners
aspect-ratio         →  preserve proportions without layout thrash
srcset / sizes / picture → serve the right image asset at the right size
```

**Breakpoints from content, not devices.** Resize the browser until the layout breaks, then add a breakpoint at *that* em value. Prefer `em`-based breakpoints (e.g., `48em` ≈ 768 px at default zoom) because they scale correctly when the user changes their browser font size — a `px` breakpoint does not.

**Container queries complement, not replace, media queries.** A card that needs to switch from stacked to side-by-side depending on whether it lives in a sidebar or a main column is a container query problem, not a viewport problem. Macro layout (header collapses, sidebar disappears) remains a viewport/media query concern.

## Working code

### 1. Full-page shell — viewport meta, safe areas, off-canvas nav, fluid type

A self-contained document demonstrating all core mobile-first primitives. Open it on a phone; resize the desktop browser; use keyboard to toggle the nav.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <!-- 1. Correct viewport declaration. viewport-fit=cover activates safe-area-inset-* -->
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Mobile-first shell</title>
  <style>
    /* ── Reset & custom props ───────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      /* Fluid type: clamp(min, preferred, max).
         At 320px → 1rem body; at 1280px → 1.125rem. Never naked vw alone. */
      --step-0: clamp(1rem, 0.875rem + 0.625vw, 1.125rem);
      --step-1: clamp(1.25rem, 1.063rem + 0.938vw, 1.5rem);
      --step-2: clamp(1.563rem, 1.25rem + 1.563vw, 2.25rem);
      --step-3: clamp(1.953rem, 1.406rem + 2.734vw, 3.375rem);

      /* Fluid space */
      --space-s: clamp(0.75rem, 0.563rem + 0.938vw, 1rem);
      --space-m: clamp(1rem, 0.75rem + 1.25vw, 1.5rem);
      --space-l: clamp(1.5rem, 1rem + 2.5vw, 2.5rem);
      --space-xl: clamp(2rem, 1.25rem + 3.75vw, 4rem);

      /* Brand: one committed hue + neutral ramp (not generic SaaS blue) */
      --hue: 218;
      --brand: oklch(52% 0.18 218);
      --brand-light: oklch(88% 0.08 218);
      --surface-0: oklch(14% 0.015 218);  /* darkest */
      --surface-1: oklch(18% 0.015 218);
      --surface-2: oklch(23% 0.018 218);
      --text-1: oklch(96% 0.005 218);
      --text-2: oklch(72% 0.01 218);
      --focus-ring: oklch(70% 0.2 218);

      /* Safe-area variables */
      --safe-top: env(safe-area-inset-top, 0px);
      --safe-right: env(safe-area-inset-right, 0px);
      --safe-bottom: env(safe-area-inset-bottom, 0px);
      --safe-left: env(safe-area-inset-left, 0px);

      /* Off-canvas width */
      --nav-width: min(80vw, 22rem);
      --nav-duration: 0.28s;
      --nav-ease: cubic-bezier(0.16, 1, 0.3, 1);  /* expo-out, not default ease */
    }

    /* ── Base (mobile — no query needed) ───────────────────────── */
    body {
      font-family: "General Sans", system-ui, sans-serif;
      font-size: var(--step-0);
      line-height: 1.6;
      color: var(--text-1);
      background: var(--surface-0);
      /* Shift body when nav is open */
      transition: transform var(--nav-duration) var(--nav-ease);
    }

    body.nav-open {
      transform: translateX(var(--nav-width));
      overflow: hidden;   /* prevent scrolling behind open nav */
    }

    /* ── Off-canvas navigation ──────────────────────────────────── */
    .site-nav {
      position: fixed;
      inset-block: 0;
      inset-inline-start: 0;
      width: var(--nav-width);
      background: var(--surface-1);
      transform: translateX(-100%);
      transition: transform var(--nav-duration) var(--nav-ease),
                  visibility var(--nav-duration);
      visibility: hidden;
      z-index: 200;
      overflow-y: auto;
      /* Respect safe areas on left edge (notch, rounded corner) */
      padding-top: calc(var(--space-l) + var(--safe-top));
      padding-right: var(--space-m);
      padding-bottom: calc(var(--space-l) + var(--safe-bottom));
      padding-left: calc(var(--space-m) + var(--safe-left));
    }

    .site-nav[aria-hidden="false"] {
      transform: translateX(0);
      visibility: visible;
    }

    /* Overlay behind nav — blocks interaction with page content */
    .nav-overlay {
      position: fixed;
      inset: 0;
      background: oklch(0% 0 0 / 0.6);
      z-index: 190;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--nav-duration) var(--nav-ease);
    }

    .nav-overlay.visible {
      opacity: 1;
      pointer-events: auto;
    }

    .nav-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: var(--space-s);
    }

    .nav-list a {
      display: block;
      font-size: var(--step-1);
      font-weight: 600;
      color: var(--text-1);
      text-decoration: none;
      /* Touch target: padding ensures ≥44px hit area (WCAG 2.5.5 enhanced) */
      padding-block: 0.75rem;   /* 0.75 × 16 × 2 = 24px padding + font height ≥ 44px */
      padding-inline: var(--space-s);
      border-radius: 0.5rem;
      transition: background 0.15s;
    }

    .nav-list a:hover,
    .nav-list a:focus-visible {
      background: var(--surface-2);
    }

    /* Focus ring — visible, distinct, not clipped */
    :focus-visible {
      outline: 2px solid var(--focus-ring);
      outline-offset: 3px;
    }

    /* ── Header bar ─────────────────────────────────────────────── */
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--surface-1);
      /* Respect safe-area at the top (notch, status bar) */
      padding-top: calc(var(--space-s) + var(--safe-top));
      padding-bottom: var(--space-s);
      padding-inline: calc(var(--space-m) + var(--safe-left))
                      calc(var(--space-m) + var(--safe-right));
    }

    .wordmark {
      font-size: var(--step-1);
      font-weight: 700;
      color: var(--text-1);
      letter-spacing: -0.02em;
    }

    /* Hamburger toggle — thumb-zone: top-left (thumb can reach on most phones) */
    .nav-toggle {
      /* Touch target: at least 44×44 px */
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-1);
      border-radius: 0.375rem;
      /* Order matters: toggle on far left for one-handed right-thumb use */
      order: -1;
    }

    .nav-toggle svg { width: 24px; height: 24px; }

    /* ── Main layout: single column on mobile ───────────────────── */
    .site-main {
      /* Safe area on sides for notched/curved-edge phones */
      padding-inline: calc(var(--space-m) + var(--safe-left))
                      calc(var(--space-m) + var(--safe-right));
      padding-block: var(--space-l);
      max-width: 80rem;
      margin-inline: auto;
    }

    /* Hero: full-height using svh — safe on mobile where 100vh lies
       svh = viewport height when browser chrome is fully visible (conservative) */
    .hero {
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: var(--space-m);
    }

    .hero__eyebrow {
      font-size: var(--step-0);
      font-weight: 500;
      color: var(--brand-light);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .hero__heading {
      font-size: var(--step-3);
      font-weight: 700;
      line-height: 1.05;
      letter-spacing: -0.03em;
      max-width: 18ch;
    }

    .hero__body {
      font-size: var(--step-1);
      color: var(--text-2);
      max-width: 42ch;
    }

    .hero__cta {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      /* Touch target: min 44px tall (WCAG 2.5.5) */
      min-height: 44px;
      padding: 0.75rem 1.5rem;
      background: var(--brand);
      color: #fff;
      font-size: var(--step-0);
      font-weight: 600;
      border-radius: 0.5rem;
      text-decoration: none;
      align-self: flex-start;
      transition: filter 0.15s;
    }

    .hero__cta:hover { filter: brightness(1.15); }

    /* ── Cards: container-query driven ─────────────────────────── */
    /* Single column on mobile — no query needed */
    .card-grid {
      container-type: inline-size;
      display: grid;
      gap: var(--space-m);
      margin-block-start: var(--space-xl);
      /* auto-fit: as many columns as fit at 260px min — zero breakpoints */
      grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
    }

    .card {
      background: var(--surface-1);
      border-radius: 0.75rem;
      padding: var(--space-m);
      display: flex;
      flex-direction: column;
      gap: var(--space-s);
    }

    /* Container query: when the CARD's container ≥ 480px, go side-by-side */
    @container (min-width: 30rem) {
      .card {
        flex-direction: row;
        align-items: flex-start;
      }
    }

    .card__label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--brand-light);
    }

    .card__title {
      font-size: var(--step-1);
      font-weight: 700;
      line-height: 1.2;
    }

    .card__desc { color: var(--text-2); font-size: var(--step-0); }

    /* ── Responsive image (art direction) ───────────────────────── */
    .feature-image {
      margin-block: var(--space-xl);
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .feature-image img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
    }

    /* ── Footer: safe area at bottom for home-bar ───────────────── */
    .site-footer {
      padding-inline: calc(var(--space-m) + var(--safe-left))
                      calc(var(--space-m) + var(--safe-right));
      padding-top: var(--space-m);
      padding-bottom: calc(var(--space-m) + var(--safe-bottom));
      background: var(--surface-1);
      color: var(--text-2);
      font-size: 0.875rem;
      text-align: center;
    }

    /* ── Medium up: two-column layout ──────────────────────────── */
    @media (min-width: 48rem) {
      /* Nav becomes always visible — off-canvas pattern no longer needed */
      .nav-toggle { display: none; }
      .nav-overlay { display: none; }

      .site-nav {
        position: static;
        width: auto;
        transform: none;
        visibility: visible;
        transition: none;
        background: transparent;
        padding: 0;
        overflow: visible;
        display: flex;
        align-items: center;
      }

      .nav-list {
        flex-direction: row;
        gap: 0;
      }

      .nav-list a {
        font-size: var(--step-0);
        padding: 0.5rem 0.75rem;
      }

      .site-header {
        gap: var(--space-m);
      }

      /* Body no longer shifts */
      body.nav-open {
        transform: none;
        overflow: auto;
      }
    }

    /* ── Large up: wider max-width, bigger leading ──────────────── */
    @media (min-width: 72rem) {
      .hero {
        max-width: 60%;
      }
    }

    /* ── prefers-reduced-motion ─────────────────────────────────── */
    @media (prefers-reduced-motion: reduce) {
      /* Remove ALL transition/animation. Structure & nav still work;
         just no sliding motion. */
      *, *::before, *::after {
        transition-duration: 0.01ms !important;
        animation-duration: 0.01ms !important;
      }
      /* Nav state still toggles via visibility — no transform motion */
      .site-nav { transform: none; left: calc(-1 * var(--nav-width)); }
      .site-nav[aria-hidden="false"] { left: 0; }
      body.nav-open { transform: none; }
    }

    /* ── hover/pointer: only animate hover on true pointer devices ─ */
    @media (hover: none), (pointer: coarse) {
      /* Disable hover highlights on touch screens */
      .nav-list a:hover { background: none; }
      .hero__cta:hover { filter: none; }
    }
  </style>
</head>
<body>

  <!-- Off-canvas nav overlay -->
  <div class="nav-overlay" id="nav-overlay" aria-hidden="true"></div>

  <!-- Off-canvas navigation drawer
       role="dialog" + aria-modal mirrors APG modal pattern;
       focus is trapped while open -->
  <nav
    class="site-nav"
    id="site-nav"
    role="dialog"
    aria-modal="true"
    aria-label="Site navigation"
    aria-hidden="true"
  >
    <ul class="nav-list">
      <li><a href="#work">Work</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#writing">Writing</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
  </nav>

  <header class="site-header">
    <!-- Toggle: left side — thumb-zone primary reach area on most phones -->
    <button
      class="nav-toggle"
      id="nav-toggle"
      aria-controls="site-nav"
      aria-expanded="false"
      aria-label="Open navigation"
    >
      <!-- Hamburger icon -->
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
    <span class="wordmark">Meridian</span>
  </header>

  <main class="site-main" id="main">
    <section class="hero" aria-labelledby="hero-heading">
      <p class="hero__eyebrow">Design engineering</p>
      <h1 class="hero__heading" id="hero-heading">
        Craft that holds up at any size.
      </h1>
      <p class="hero__body">
        Components built to adapt — from a 320 px pocket to a 2560 px wall.
        No retrofits, no duct tape.
      </p>
      <a class="hero__cta" href="#work">
        See the work
        <svg aria-hidden="true" focusable="false" width="16" height="16"
             viewBox="0 0 16 16" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 8h10M9 4l4 4-4 4"/>
        </svg>
      </a>
    </section>

    <!-- Art-direction example: tighter crop on mobile, wide panorama on desktop -->
    <div class="feature-image">
      <picture>
        <!-- Mobile: portrait crop, served as WebP -->
        <source
          media="(max-width: 47.9375rem)"
          srcset="
            https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=480&q=75&fm=webp 480w,
            https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=780&q=75&fm=webp 780w
          "
          sizes="(max-width: 47.9375rem) calc(100vw - 2rem)"
          type="image/webp"
        >
        <!-- Desktop: landscape crop, wider sizes -->
        <source
          media="(min-width: 48rem)"
          srcset="
            https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&q=75&fm=webp  900w,
            https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1400&q=75&fm=webp 1400w,
            https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1800&q=75&fm=webp 1800w
          "
          sizes="(min-width: 80rem) 78rem, calc(100vw - 4rem)"
          type="image/webp"
        >
        <!-- Fallback img — always present -->
        <img
          src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&q=75"
          alt="Team collaborating around a table covered with sketches and post-its"
          loading="lazy"
          decoding="async"
          width="900"
          height="600"
        >
      </picture>
    </div>

    <section id="work" aria-labelledby="work-heading">
      <h2 id="work-heading" style="font-size: var(--step-2); font-weight: 700;
          letter-spacing:-0.02em; margin-bottom: var(--space-m);">
        Selected projects
      </h2>

      <!-- Container-query grid — adapts without any breakpoints of its own -->
      <div class="card-grid">
        <article class="card">
          <div>
            <p class="card__label">Brand + web</p>
            <h3 class="card__title">Reframe Health</h3>
            <p class="card__desc">End-to-end identity and product site for a digital therapy platform.</p>
          </div>
        </article>
        <article class="card">
          <div>
            <p class="card__label">Dashboard</p>
            <h3 class="card__title">Volta Analytics</h3>
            <p class="card__desc">Data-dense reporting UI that stays readable on 13-inch laptops.</p>
          </div>
        </article>
        <article class="card">
          <div>
            <p class="card__label">Editorial</p>
            <h3 class="card__title">Lune Magazine</h3>
            <p class="card__desc">Long-form storytelling with scroll-driven reveals and fluid type.</p>
          </div>
        </article>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <p>Meridian Design Engineering &copy; 2026</p>
  </footer>

  <script>
    // ── Off-canvas nav controller ──────────────────────────────────────────
    const toggle   = document.getElementById('nav-toggle');
    const nav      = document.getElementById('site-nav');
    const overlay  = document.getElementById('nav-overlay');
    const body     = document.body;

    // Collect focusable elements inside the nav for focus-trapping
    const getFocusable = () =>
      [...nav.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])')];

    function openNav() {
      nav.setAttribute('aria-hidden', 'false');
      overlay.classList.add('visible');
      overlay.setAttribute('aria-hidden', 'false');
      body.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation');
      // Move focus into the nav (first link)
      const first = getFocusable()[0];
      if (first) first.focus();
    }

    function closeNav() {
      nav.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('visible');
      overlay.setAttribute('aria-hidden', 'true');
      body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      // Return focus to the trigger
      toggle.focus();
    }

    function isNavOpen() {
      return nav.getAttribute('aria-hidden') === 'false';
    }

    // Toggle on button click
    toggle.addEventListener('click', () =>
      isNavOpen() ? closeNav() : openNav()
    );

    // Close on overlay click
    overlay.addEventListener('click', closeNav);

    // Close on Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isNavOpen()) closeNav();
    });

    // Focus trap: Tab and Shift+Tab stay inside the open nav
    nav.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // On resize ≥768 px: reset any open-nav state
    const mql = matchMedia('(min-width: 48rem)');
    mql.addEventListener('change', e => {
      if (e.matches && isNavOpen()) closeNav();
    });
  </script>
</body>
</html>
```

### 2. Fluid type + space scale snippet (reusable CSS custom props)

When composing a design system rather than a one-page shell, extract the scale into a single `:root` block shared across components:

```css
/* Fluid type scale: computed once, available everywhere.
   Formula: clamp(min-size, min-size + (max-size - min-size) * fluid-factor, max-size)
   Replace 320 / 1280 with your actual min/max viewport px. */
:root {
  --fluid-min-width: 320;
  --fluid-max-width: 1280;
  --fluid-screen: 100vw;
  --fluid-bp: calc(
    (var(--fluid-screen) - var(--fluid-min-width) / 16 * 1rem) /
    (var(--fluid-max-width) / 16 - var(--fluid-min-width) / 16)
  );

  /* Step -1 → 4, named semantically */
  --text-sm:   clamp(0.833rem, 0.778rem + 0.278vw, 1rem);
  --text-base: clamp(1rem,     0.875rem + 0.625vw, 1.125rem);
  --text-md:   clamp(1.25rem,  1.063rem + 0.938vw, 1.5rem);
  --text-lg:   clamp(1.563rem, 1.25rem  + 1.563vw, 2.25rem);
  --text-xl:   clamp(1.953rem, 1.406rem + 2.734vw, 3.375rem);
  --text-2xl:  clamp(2.441rem, 1.688rem + 3.766vw, 4.5rem);

  /* Fluid space (same min/max viewport logic) */
  --space-2xs: clamp(0.25rem, 0.188rem + 0.313vw, 0.375rem);
  --space-xs:  clamp(0.5rem,  0.375rem + 0.625vw, 0.75rem);
  --space-sm:  clamp(0.75rem, 0.563rem + 0.938vw, 1rem);
  --space-md:  clamp(1rem,    0.75rem  + 1.25vw,  1.5rem);
  --space-lg:  clamp(1.5rem,  1rem     + 2.5vw,   2.5rem);
  --space-xl:  clamp(2rem,    1.25rem  + 3.75vw,  4rem);
  --space-2xl: clamp(3rem,    2rem     + 5vw,     6rem);
}
```

### 3. Mobile-first media query skeleton

The canonical layering structure — no `max-width` queries that have to be undone:

```css
/* ── Base: 0px and up — mobile ──────────────────── */
.component {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
}

/* ── ≥ 37.5rem (600px): tablet — ADD, don't override ── */
@media (min-width: 37.5rem) {
  .component {
    flex-direction: row;
  }
}

/* ── ≥ 62rem (992px): desktop ─────────────────── */
@media (min-width: 62rem) {
  .component {
    padding: var(--space-lg);
    gap: var(--space-md);
  }
}

/* ── ≥ 90rem (1440px): wide ───────────────────── */
@media (min-width: 90rem) {
  .component {
    max-width: 80rem;
    margin-inline: auto;
  }
}
```

## Variations

**Off-canvas direction.** The standard pattern slides in from the left (thumb-zone primary on most right-handed users); a bottom sheet variant slides up from the bottom rail and is often preferred on taller phones where top-half reach is the constraint. The CSS `inset-block-end: 0` / `inset-block-start: auto` swap achieves it cleanly.

**Nav trigger position.** Left-side burger (default above) for two-thumb grip; right-side burger for single-hand right-thumb use. Research (Steven Hoober's "How People Hold Mobile Phones", 2023 update) shows roughly 75% of users hold with one hand — position the trigger where the dominant thumb naturally rests.

**Breakpoint granularity.** Content-driven (add a breakpoint only when layout breaks) vs. systematic four-tier (xs/sm/md/lg) vs. fluid-only with zero breakpoints using `clamp()` + `auto-fit`. Most production systems combine: fluid type and space everywhere, a small set of structural breakpoints (two or three) for nav collapse, grid shifts, and sidebar appearance.

**Full-height strategy.** Use `100svh` for sections that must fit on first paint (safest — guaranteed visible even with browser chrome open); `100dvh` for immersive apps where you want the section to expand as the browser chrome hides on scroll (but note dvh changes cause layout reflow on scroll — use sparingly and do not animate it).

**Performance-budget targets.** Hard budget for mobile at p75: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1. Set up a Lighthouse CI gate on the mobile throttled profile (Moto G Power equivalent), not just desktop.

## Accessibility

**prefers-reduced-motion — mandatory for all transitions.** The off-canvas slide animation is disabled in the code above via `transition-duration: 0.01ms`. The nav still toggles open and closed through visibility and aria-hidden; the motion is simply removed. A duration of `0.01ms` rather than `0ms` avoids the `transition: none` specificity trap in some browsers.

```css
/* Already in the working code — reproduced here for clarity */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration:  0.01ms !important;
  }
}
```

**Touch and pointer fallback.** Hover states are guarded with `@media (hover: hover) and (pointer: fine)` — actually written above as the inverse `(hover: none), (pointer: coarse)` to strip hover styles on touch. Never rely on `:hover` for interactive state on mobile — it fires inconsistently on tap, creating sticky highlighting.

**Touch targets.** WCAG 2.5.5 (Level AAA, enhanced) requires 44×44 CSS px. WCAG 2.5.8 (Level AA, new in WCAG 2.2) requires 24×24 CSS px with 24 px spacing. Aim for 44×44 as the practical minimum for all custom controls; achieve it via `padding` on the interactive element (not its parent) or via a `::after` pseudo-element that expands the hit area without changing the visual footprint.

**Off-canvas keyboard and focus management.**
- `role="dialog"` + `aria-modal="true"` on the nav drawer tells assistive technology that background content is inert.
- `aria-expanded` on the toggle button reflects open/closed state.
- `aria-hidden="false/true"` on the drawer matches its visual visibility.
- Focus moves into the nav on open (first link) and returns to the toggle on close.
- Tab and Shift+Tab are trapped within the open drawer.
- Escape closes the drawer from any position inside it.
- When the nav is open and rendered as always-visible horizontal nav (≥768 px), `aria-hidden` stays `true` and `role="dialog"` / `aria-modal` must be removed — or simply `display: none` the toggle and render a standard `<nav>` instead. The working code above handles this via `display: none` on the toggle at the medium breakpoint.

**Screen-reader implications.** The `<picture>` element's `<img>` fallback carries the `alt` attribute — `<source>` elements are invisible to assistive technology. Always write the alt on the `<img>`, not a `<source>`. For decorative images, `alt=""`.

**Contrast.** In this file's code: `var(--text-1)` is `oklch(96% 0.005 218)` on `var(--surface-0)` `oklch(14% 0.015 218)`. The OKLCH lightness delta of 82 percentage points gives a contrast ratio well above 7:1 (WCAG AAA), confirmed by the large perceptual lightness gap — no fabricated ratio quoted here. `var(--text-2)` at `oklch(72% 0.01 218)` on `oklch(14% 0.015 218)` yields approximately 4.8:1, meeting WCAG AA for body text.

## Performance

**Base CSS is the smallest path.** Mobile-first means mobile users parse and apply only the base styles plus any matching `min-width` queries. Desktop-down means every mobile user downloads the full desktop stylesheet and then applies `max-width` overrides — net more bytes, net more computation.

**Animate only `transform` and `opacity`.** The off-canvas nav slides via `transform: translateX()` — no layout recalculation. The body shift also uses `transform`. Never animate `left`, `width`, `margin`, or `height` on interactive elements — these trigger layout and paint.

**`will-change: transform` on the nav.** Promotes the nav layer to the GPU before it slides. Use it only on the nav element, not globally. Remove it after the animation if the nav is hidden for extended periods — a stale `will-change` wastes GPU memory.

**Responsive images.** `srcset` + `sizes` lets the browser pick the smallest image that meets the device's viewport width and pixel density. `loading="lazy"` defers below-fold images. `decoding="async"` prevents decode from blocking the main thread. Always declare `width` and `height` on `<img>` to prevent CLS from the image slot collapsing and then jumping.

**`svh`/`dvh` layout stability.** Prefer `svh` for static sections; `dvh` changes value as the browser chrome hides on scroll, triggering a layout recalculation that can contribute to CLS. If you use `dvh`, test on a physical phone and measure CLS in Lighthouse mobile mode.

**Performance budget monitoring.** Use `npx lighthouse --emulated-form-factor=mobile --throttling-method=simulate` in CI against a real URL. Track LCP, INP, and CLS over time. Alert when LCP crosses 2.5 s or INP crosses 200 ms.

## Anti-slop

The cliche version (see `_slop-blocklist.md` → Layout and Motion): a desktop-first page with a `max-width: 767px` block at the bottom that "handles mobile" — nav collapses, columns stack, font-size drops by `2px`. The mobile experience becomes a stripped-down afterthought that inherits all the desktop specificity weight and then tries to undo it.

The Motion cliche sub-case: a hamburger menu that opens with a `0.4s ease` fade-in and every link slides in on a separate delayed `ease` — identical stagger, default easing, no spring. Use a custom `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) for the panel and strip it entirely under `prefers-reduced-motion`.

The Layout cliche sub-case: centering everything at `max-width: 800px` with uniform padding, then adding a single `@media (max-width: 600px)` that reduces padding — no thought given to how content actually behaves in the narrow column. The tasteful alternative: fluid `clamp()` padding from the start, `auto-fit` grid with `minmax()` that collapses naturally, and structural breakpoints only where the layout genuinely breaks.

Specific concrete copy in demos, not "Empower your workflow" (see `_slop-blocklist.md` → Copy).

## Pairs well with

- **`fluid-type-and-space`** — the `clamp()` scale described in this entry; intrinsic sizing removes the majority of breakpoints that mobile-first CSS would otherwise require.
- **`container-queries`** — component-level responsiveness that complements viewport-level mobile-first structure; a card can be mobile-first internally without coupling to the page's breakpoints.
- **`breakpoint-strategy`** — where to draw the structural breakpoint lines (content-driven vs. systematic tier) and how to test them in the browser with Polypane or Chrome DevTools responsive mode.
- **`responsive-images-and-art-direction`** — the `srcset`/`sizes`/`<picture>` pattern demoed in the working code above; pairs directly with mobile-first layout because the image slot size changes with the same min-width query logic.
- **`touch-targets-and-safe-areas`** — the `env(safe-area-inset-*)` and 44 px padding patterns are a direct continuation of the mobile-first foundation laid here.

## Current references

- [Responsive design ground rules — Polypane](https://polypane.app/blog/responsive-design-ground-rules/) - Updated 2024; definitive list of viewport meta, em-based breakpoints, safe-area-inset usage, and mobile-first query discipline
- [MDN: Responsive web design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design) - Canonical min-width query structure, intrinsic Flexbox/Grid, and the viewport meta tag rationale
- [MDN: env() function](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env) - safe-area-inset-* syntax, fallback values, browser support (Baseline: widely available since 2020)
- [The large, small, and dynamic viewport units — web.dev](https://web.dev/blog/viewport-units) - Definitive explanation of svh/dvh/lvh; Chrome 108+, Firefox 101+, Safari 15.4+ support
- [Designing better target sizes — Ahmad Shadeed](https://ishadeed.com/article/target-size/) - Practical CSS techniques for padding-based touch target expansion; WCAG 2.5.5 vs 2.5.8 comparison
- [WCAG 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) - The AA-level 24×24 px criterion from WCAG 2.2 (October 2023), with exceptions for inline text
- [ARIA APG: Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) - Focus management, aria-modal, aria-labelledby, and keyboard trap requirements that apply directly to off-canvas nav drawers
- [Container queries in 2026 — LogRocket](https://blog.logrocket.com/container-queries-2026/) - Honest assessment of container query vs. media query use cases, style query support gaps, scroll-state query arrival
- [MDN: Responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images) - srcset/sizes and picture element syntax; art direction vs. resolution switching decision tree
- [Core Web Vitals — web.dev](https://web.dev/articles/vitals) - Current LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 thresholds; p75 measurement standard for mobile performance budgets
