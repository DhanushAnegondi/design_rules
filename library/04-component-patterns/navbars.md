# Navbars

> A persistent wayfinding strip — typically a sticky header — that exposes top-level site sections, collapses into a drawer on small viewports, and optionally reveals rich sub-navigation through a mega-menu panel.

**Bucket:** component
**Maturity:** evergreen
**Effort:** medium
**Best for:** websites, portfolios, apps, dashboards

## What it is

The navbar is the primary orientating landmark on most sites: a horizontal band at the top of the viewport that tells users where they are (`aria-current="page"`), where they can go (top-level links), and how to get deeper (mega-menu dropdowns). On viewport widths too narrow for the full link set, the links are hidden and a hamburger button opens an off-canvas drawer. A skip link sits above the navbar in DOM order so keyboard users can bypass the repeated navigation on every page. Scroll-aware behaviour — the bar slides up out of view when the user scrolls down and reappears on scroll-up — reclaims vertical space without losing access to navigation.

## When to use

- Any multi-page or multi-section site where users need persistent wayfinding.
- When there are 4–8 top-level destinations that don't all fit comfortably in a sidebar.
- When some top-level sections contain enough sub-pages to warrant a mega-menu panel (product suites, documentation, e-commerce departments).
- When mobile traffic is significant and the desktop link set is too wide to display at small viewports.
- When SEO and performance matter — a server-rendered `<nav>` is crawlable and works with JS disabled.

## When NOT to use

- Single-page sites with one or two sections: a simple in-page anchor list or a sticky sidebar scroller is lighter and less visually dominant.
- Dashboards where the primary navigation is a persistent sidebar — a top navbar then competes spatially and adds cognitive load.
- Microsites or landing pages where the only action is a single CTA — a full navbar distracts from conversion.
- Everyone overuses the sticky navbar with a backdrop-filter blur on every site regardless of content depth. If the site has fewer than five links and no sub-navigation, a static header is cleaner.

## How it works

The navbar is a `<header>` element containing a `<nav>` landmark. Inside the nav, an unordered list holds top-level links and disclosure buttons. When a disclosure button is activated, an adjacent panel (a `<ul>` or a `<div>` containing groups of links) becomes visible; `aria-expanded` on the button reflects the state.

**ARIA pattern choice — disclosure, not menu:**
The ARIA APG recommends the **disclosure pattern** (not `role="menu"`) for site navigation. Screen readers expose menu widgets with a rich interaction model (arrow-key roving, `menuitem` roles) that users expect for application menus like a File menu — not for a list of links leading to different pages. Using the disclosure pattern keeps the markup as semantic lists of links, which screen readers announce correctly as "navigation" with item counts.

**Keyboard contract (APG disclosure navigation):**
- `Tab` / `Shift+Tab`: move through all interactive elements in DOM order.
- `Enter` / `Space` on a disclosure button: toggle the sub-panel; focus stays on the button.
- `Escape`: close the open panel and return focus to the controlling button.
- Auto-close: when focus leaves the navigation landmark, any open panel closes.
- Optional arrow-key enhancement: `Down`/`Right` move into the first link of the open panel; `Up`/`Left` return to the button; `Home`/`End` jump to first/last item.

**Mobile hamburger drawer:**
The button uses `aria-expanded` and `aria-controls` pointing to the drawer's `id`. When the drawer opens, focus moves to the first interactive element inside it (conventionally a close button at the top). Background content receives the `inert` attribute, which removes it from tab order and from the accessibility tree simultaneously — no JavaScript focus-trap loop required. Browser support for `inert`: Chrome 102+, Edge 102+, Firefox 112+, Safari 15.5+. When the drawer closes, focus returns to the hamburger button.

**Scroll-aware hide/show:**
The modern pure-CSS approach uses scroll-driven animations with style queries (Bram.us, September 2024). The header listens to a scroll-direction custom property and transitions `translate` between `0` (shown) and `-100%` (hidden). A `transition-delay: calc(infinity * 1s)` trick "stalls" the property at its last value when scroll stops, so the header stays visible after the user pauses. As of late 2025, `@container scroll-state()` queries offer a cleaner path on Chromium; the JS fallback using `IntersectionObserver` on a sentinel element remains the broadest-support option.

**Key CSS properties:**
- `position: sticky; top: 0` for the static sticky mode.
- `translate: 0` / `translate: 0 -100%` with `transition: translate 300ms cubic-bezier(0.16,1,0.3,1)` for smooth hide/show.
- `visibility: hidden` (not just `display: none` or `width: 0`) to remove the drawer from tab order when closed — combined with `inert` for belt-and-suspenders safety.
- `overflow: hidden` on drawer containers to clip content during the slide-in transition.

## Working code

### 1. Vanilla HTML/CSS/JS — full navbar (sticky, mega-menu, mobile drawer, skip link, scroll-aware)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Navbar demo</title>
  <style>
    /* ── Reset & tokens ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --c-bg:        #0f0f11;
      --c-surface:   #18181b;
      --c-border:    #2a2a30;
      --c-text:      #e8e8ed;
      --c-muted:     #8a8a9a;
      --c-accent:    #d4a843;       /* amber — not generic blue #3B82F6 */
      --c-accent-dk: #a87c28;
      --nav-h:       3.5rem;        /* 56px */
      --drawer-w:    min(22rem, 90vw);
      --radius:      6px;
      --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
      --dur-med:     280ms;
    }

    body {
      background: var(--c-bg);
      color: var(--c-text);
      font-family: "Inter", "General Sans", system-ui, sans-serif;
      font-size: 1rem;
      line-height: 1.6;
    }

    /* ── Skip link ── */
    .skip-link {
      position: absolute;
      top: -999px;
      left: 1rem;
      z-index: 9999;
      padding: 0.625rem 1.25rem;
      background: var(--c-accent);
      color: #0f0f11;
      font-weight: 700;
      font-size: 0.875rem;
      border-radius: var(--radius);
      text-decoration: none;
      /* hidden until focused */
    }
    .skip-link:focus-visible {
      top: 0.75rem;
      outline: 3px solid var(--c-text);
      outline-offset: 2px;
    }

    /* ── Scroll-aware header wrapper ── */
    .site-header-wrap {
      position: sticky;
      top: 0;
      z-index: 100;
      /* scroll-direction is updated by JS */
      translate: 0 0;
      transition: translate var(--dur-med) var(--ease-out-expo);
    }
    .site-header-wrap[data-hidden="true"] {
      translate: 0 -100%;
    }
    /* Respect reduced-motion: no translate, just stay visible */
    @media (prefers-reduced-motion: reduce) {
      .site-header-wrap {
        transition: none;
        translate: 0 0 !important;
      }
      .site-header-wrap[data-hidden="true"] {
        translate: 0 0;
      }
    }

    /* ── Header surface ── */
    .site-header {
      background: color-mix(in oklch, var(--c-surface) 92%, transparent);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--c-border);
      height: var(--nav-h);
      display: flex;
      align-items: center;
    }

    /* ── Inner layout ── */
    .nav-inner {
      width: 100%;
      max-width: 72rem;
      margin-inline: auto;
      padding-inline: 1.5rem;
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    /* ── Wordmark ── */
    .wordmark {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--c-text);
      text-decoration: none;
      letter-spacing: -0.02em;
      flex-shrink: 0;
    }
    .wordmark span { color: var(--c-accent); }

    /* ── Desktop nav links ── */
    .nav-list {
      list-style: none;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-left: auto;
    }
    .nav-list > li { position: relative; }

    .nav-link,
    .nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.375rem 0.75rem;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--c-muted);
      background: none;
      border: none;
      border-radius: var(--radius);
      cursor: pointer;
      text-decoration: none;
      transition: color var(--dur-med) ease, background var(--dur-med) ease;
      white-space: nowrap;
    }
    .nav-link:hover,
    .nav-btn:hover,
    .nav-link:focus-visible,
    .nav-btn:focus-visible {
      color: var(--c-text);
      background: color-mix(in oklch, var(--c-text) 8%, transparent);
    }
    .nav-link:focus-visible,
    .nav-btn:focus-visible {
      outline: 2px solid var(--c-accent);
      outline-offset: 2px;
    }
    .nav-link[aria-current="page"] {
      color: var(--c-accent);
      font-weight: 600;
    }

    /* chevron icon */
    .nav-btn svg {
      width: 0.8em;
      height: 0.8em;
      transition: rotate var(--dur-med) var(--ease-out-expo);
    }
    .nav-btn[aria-expanded="true"] svg {
      rotate: 180deg;
    }
    @media (prefers-reduced-motion: reduce) {
      .nav-btn svg { transition: none; }
    }

    /* ── Mega menu panel ── */
    .mega-panel {
      position: absolute;
      top: calc(100% + 0.5rem);
      left: 50%;
      translate: -50% 0;
      min-width: 28rem;
      background: var(--c-surface);
      border: 1px solid var(--c-border);
      border-radius: calc(var(--radius) * 1.5);
      padding: 1.25rem;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.25rem;
      box-shadow: 0 8px 32px rgba(0,0,0,0.45);

      /* hidden state */
      visibility: hidden;
      opacity: 0;
      translate: -50% -0.5rem;
      transition:
        opacity var(--dur-med) var(--ease-out-expo),
        translate var(--dur-med) var(--ease-out-expo),
        visibility 0s var(--dur-med);
    }
    .mega-panel[data-open="true"] {
      visibility: visible;
      opacity: 1;
      translate: -50% 0;
      transition:
        opacity var(--dur-med) var(--ease-out-expo),
        translate var(--dur-med) var(--ease-out-expo),
        visibility 0s 0s;
    }
    @media (prefers-reduced-motion: reduce) {
      .mega-panel {
        transition: visibility 0s var(--dur-med), opacity 0s var(--dur-med);
        translate: -50% 0 !important;
      }
      .mega-panel[data-open="true"] {
        transition: visibility 0s 0s, opacity 0s 0s;
      }
    }

    .mega-panel-link {
      display: flex;
      flex-direction: column;
      padding: 0.75rem 1rem;
      border-radius: var(--radius);
      text-decoration: none;
      color: var(--c-text);
      transition: background var(--dur-med) ease;
    }
    .mega-panel-link:hover,
    .mega-panel-link:focus-visible {
      background: color-mix(in oklch, var(--c-text) 8%, transparent);
    }
    .mega-panel-link:focus-visible {
      outline: 2px solid var(--c-accent);
      outline-offset: 2px;
    }
    .mega-panel-link strong {
      font-size: 0.9375rem;
      font-weight: 600;
      display: block;
      margin-bottom: 0.2em;
    }
    .mega-panel-link span {
      font-size: 0.8125rem;
      color: var(--c-muted);
    }

    /* ── CTA button ── */
    .nav-cta {
      display: inline-flex;
      align-items: center;
      padding: 0.45rem 1.1rem;
      background: var(--c-accent);
      color: #0f0f11;
      font-size: 0.9375rem;
      font-weight: 700;
      border-radius: var(--radius);
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: background var(--dur-med) ease;
      flex-shrink: 0;
    }
    .nav-cta:hover { background: var(--c-accent-dk); }
    .nav-cta:focus-visible {
      outline: 2px solid var(--c-text);
      outline-offset: 2px;
    }

    /* ── Hamburger button (mobile only) ── */
    .hamburger {
      display: none;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 2.5rem;
      height: 2.5rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: var(--radius);
      margin-left: auto;
      flex-shrink: 0;
    }
    .hamburger:focus-visible {
      outline: 2px solid var(--c-accent);
      outline-offset: 2px;
    }
    .hamburger-bar {
      display: block;
      width: 100%;
      height: 2px;
      background: var(--c-text);
      border-radius: 2px;
      transition: transform var(--dur-med) var(--ease-out-expo),
                  opacity var(--dur-med) ease;
      transform-origin: center;
    }
    .hamburger[aria-expanded="true"] .hamburger-bar:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }
    .hamburger[aria-expanded="true"] .hamburger-bar:nth-child(2) {
      opacity: 0;
    }
    .hamburger[aria-expanded="true"] .hamburger-bar:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }
    @media (prefers-reduced-motion: reduce) {
      .hamburger-bar { transition: none; }
    }

    /* ── Mobile drawer ── */
    .drawer-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 200;
      opacity: 0;
      transition: opacity var(--dur-med) ease;
    }
    .drawer-overlay[data-open="true"] {
      opacity: 1;
    }
    @media (prefers-reduced-motion: reduce) {
      .drawer-overlay { transition: none; }
    }

    .drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: var(--drawer-w);
      background: var(--c-surface);
      border-left: 1px solid var(--c-border);
      z-index: 201;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      translate: 100% 0;
      transition: translate var(--dur-med) var(--ease-out-expo);
    }
    .drawer[data-open="true"] {
      translate: 0 0;
    }
    @media (prefers-reduced-motion: reduce) {
      .drawer { transition: none; }
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--c-border);
      flex-shrink: 0;
    }

    .drawer-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      background: none;
      border: none;
      cursor: pointer;
      border-radius: var(--radius);
      color: var(--c-muted);
    }
    .drawer-close:hover { color: var(--c-text); background: color-mix(in oklch, var(--c-text) 8%, transparent); }
    .drawer-close:focus-visible {
      outline: 2px solid var(--c-accent);
      outline-offset: 2px;
    }

    .drawer-nav-list {
      list-style: none;
      padding: 1rem 0.75rem;
      flex: 1;
    }
    .drawer-nav-list a,
    .drawer-nav-list button {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0.75rem 0.75rem;
      font-size: 1rem;
      font-weight: 500;
      color: var(--c-text);
      background: none;
      border: none;
      border-radius: var(--radius);
      text-decoration: none;
      cursor: pointer;
      text-align: left;
    }
    .drawer-nav-list a:hover,
    .drawer-nav-list button:hover {
      background: color-mix(in oklch, var(--c-text) 8%, transparent);
    }
    .drawer-nav-list a:focus-visible,
    .drawer-nav-list button:focus-visible {
      outline: 2px solid var(--c-accent);
      outline-offset: 2px;
    }
    .drawer-nav-list a[aria-current="page"] {
      color: var(--c-accent);
      font-weight: 600;
    }

    .drawer-cta {
      margin: 0 0.75rem 1.25rem;
      padding: 0.75rem;
      background: var(--c-accent);
      color: #0f0f11;
      font-weight: 700;
      font-size: 1rem;
      border-radius: var(--radius);
      text-decoration: none;
      text-align: center;
      display: block;
    }
    .drawer-cta:focus-visible {
      outline: 2px solid var(--c-text);
      outline-offset: 2px;
    }

    /* ── Responsive breakpoint ── */
    @media (max-width: 52rem) {
      .nav-list, .nav-cta { display: none; }
      .hamburger { display: flex; }
      .drawer-overlay { display: block; }
      /* When drawer is closed, inert handles focus — hide visually too */
      .drawer[data-open="false"] { visibility: hidden; }
      .drawer[data-open="true"]  { visibility: visible; }
    }

    /* ── Page demo content ── */
    main { max-width: 72rem; margin-inline: auto; padding: 4rem 1.5rem; }
    .page-section { min-height: 80vh; border-bottom: 1px solid var(--c-border); padding-bottom: 4rem; }
    .page-section h2 { font-size: clamp(1.75rem, 4vw, 3rem); font-weight: 700; margin-bottom: 1rem; }
    .page-section p  { color: var(--c-muted); max-width: 52ch; }
  </style>
</head>
<body>

  <!-- Skip link: must be first focusable element in DOM -->
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <!-- Scroll-aware wrapper -->
  <div class="site-header-wrap" id="site-header-wrap" aria-hidden="false">
    <header class="site-header" role="banner">
      <div class="nav-inner">
        <a href="/" class="wordmark" aria-label="Fieldwork home">Field<span>work</span></a>

        <!-- Desktop nav -->
        <nav aria-label="Main navigation">
          <ul class="nav-list" role="list">
            <li>
              <a href="/work" class="nav-link" aria-current="page">Work</a>
            </li>
            <li>
              <!-- Disclosure button — APG disclosure nav pattern -->
              <button
                class="nav-btn"
                aria-expanded="false"
                aria-controls="services-panel"
                id="services-btn"
                type="button"
              >
                Services
                <svg aria-hidden="true" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M1 1l4 4 4-4"/>
                </svg>
              </button>
              <!-- Mega panel -->
              <div
                id="services-panel"
                class="mega-panel"
                role="region"
                aria-labelledby="services-btn"
                data-open="false"
              >
                <a href="/services/brand" class="mega-panel-link">
                  <strong>Brand identity</strong>
                  <span>Strategy, naming, visual systems</span>
                </a>
                <a href="/services/digital" class="mega-panel-link">
                  <strong>Digital products</strong>
                  <span>Web apps, design systems, handoff</span>
                </a>
                <a href="/services/motion" class="mega-panel-link">
                  <strong>Motion &amp; film</strong>
                  <span>Brand films, UI animation, direction</span>
                </a>
                <a href="/services/strategy" class="mega-panel-link">
                  <strong>Growth strategy</strong>
                  <span>Audits, positioning, roadmaps</span>
                </a>
              </div>
            </li>
            <li>
              <a href="/about" class="nav-link">About</a>
            </li>
            <li>
              <a href="/journal" class="nav-link">Journal</a>
            </li>
          </ul>
        </nav>

        <a href="/contact" class="nav-cta">Start a project</a>

        <!-- Hamburger (visible mobile only via CSS) -->
        <button
          class="hamburger"
          id="hamburger-btn"
          type="button"
          aria-expanded="false"
          aria-controls="mobile-drawer"
          aria-label="Open navigation menu"
        >
          <span class="hamburger-bar" aria-hidden="true"></span>
          <span class="hamburger-bar" aria-hidden="true"></span>
          <span class="hamburger-bar" aria-hidden="true"></span>
        </button>
      </div>
    </header>
  </div>

  <!-- Mobile drawer overlay -->
  <div
    class="drawer-overlay"
    id="drawer-overlay"
    data-open="false"
    aria-hidden="true"
  ></div>

  <!-- Mobile drawer -->
  <div
    id="mobile-drawer"
    class="drawer"
    role="dialog"
    aria-modal="true"
    aria-label="Navigation menu"
    data-open="false"
    inert
  >
    <div class="drawer-header">
      <a href="/" class="wordmark" tabindex="-1" aria-hidden="true">Field<span>work</span></a>
      <button
        class="drawer-close"
        id="drawer-close-btn"
        type="button"
        aria-label="Close navigation menu"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75">
          <path d="M4 4l12 12M16 4L4 16"/>
        </svg>
      </button>
    </div>
    <nav aria-label="Mobile navigation">
      <ul class="drawer-nav-list" role="list">
        <li><a href="/work" aria-current="page">Work</a></li>
        <li><a href="/services">Services</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/journal">Journal</a></li>
      </ul>
    </nav>
    <a href="/contact" class="drawer-cta">Start a project</a>
  </div>

  <!-- Main content -->
  <main id="main-content" tabindex="-1">
    <div class="page-section">
      <h2>Selected work</h2>
      <p>Recent projects across brand, product, and motion — scroll to trigger the navbar hide/show behaviour.</p>
    </div>
    <div class="page-section">
      <h2>How we work</h2>
      <p>Three-phase engagements: discovery, design, delivery. Fixed scope, honest timelines.</p>
    </div>
    <div class="page-section">
      <h2>The studio</h2>
      <p>A small independent practice based in Auckland, working with teams worldwide.</p>
    </div>
  </main>

  <script>
  (function () {
    'use strict';

    /* ── Reduced-motion check ── */
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* ── Scroll-aware header ── */
    const headerWrap = document.getElementById('site-header-wrap');
    let lastY = window.scrollY;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const scrolled = y > 80;           // don't hide at the very top
        const goingDown = y > lastY;

        if (!reduceMotion.matches) {
          headerWrap.dataset.hidden = (scrolled && goingDown) ? 'true' : 'false';
        }
        lastY = y;
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    /* ── Mega menu disclosure ── */
    const servicesBtn   = document.getElementById('services-btn');
    const servicesPanel = document.getElementById('services-panel');

    function openPanel() {
      servicesBtn.setAttribute('aria-expanded', 'true');
      servicesPanel.dataset.open = 'true';
    }
    function closePanel() {
      servicesBtn.setAttribute('aria-expanded', 'false');
      servicesPanel.dataset.open = 'false';
    }

    servicesBtn.addEventListener('click', () => {
      servicesBtn.getAttribute('aria-expanded') === 'true' ? closePanel() : openPanel();
    });

    // Escape key closes panel, returns focus to button
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && servicesBtn.getAttribute('aria-expanded') === 'true') {
        closePanel();
        servicesBtn.focus();
      }
    });

    // Close when focus leaves the nav item entirely
    const servicesItem = servicesBtn.closest('li');
    servicesItem.addEventListener('focusout', (e) => {
      if (!servicesItem.contains(e.relatedTarget)) {
        closePanel();
      }
    });

    /* ── Mobile drawer ── */
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const drawerEl     = document.getElementById('mobile-drawer');
    const overlayEl    = document.getElementById('drawer-overlay');
    const closeBtn     = document.getElementById('drawer-close-btn');
    // All content that should be inert when drawer is open
    const mainContent  = document.getElementById('main-content');
    const headerEl     = document.querySelector('.site-header-wrap');

    function openDrawer() {
      drawerEl.dataset.open    = 'true';
      overlayEl.dataset.open   = 'true';
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      hamburgerBtn.setAttribute('aria-label', 'Close navigation menu');

      // Remove inert from drawer, add to background
      drawerEl.removeAttribute('inert');
      mainContent.setAttribute('inert', '');
      // Focus the close button immediately
      closeBtn.focus();
    }

    function closeDrawer() {
      drawerEl.dataset.open    = 'false';
      overlayEl.dataset.open   = 'false';
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      hamburgerBtn.setAttribute('aria-label', 'Open navigation menu');

      // Re-inert the drawer, restore main content
      drawerEl.setAttribute('inert', '');
      mainContent.removeAttribute('inert');
      // Return focus to trigger
      hamburgerBtn.focus();
    }

    hamburgerBtn.addEventListener('click', () => {
      hamburgerBtn.getAttribute('aria-expanded') === 'true' ? closeDrawer() : openDrawer();
    });

    closeBtn.addEventListener('click', closeDrawer);
    overlayEl.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && hamburgerBtn.getAttribute('aria-expanded') === 'true') {
        closeDrawer();
      }
    });
  })();
  </script>
</body>
</html>
```

### 2. React + Tailwind — compact accessible navbar component

This version uses Headless UI `Disclosure` (which implements APG disclosure semantics) and Framer Motion for the drawer slide and mega-menu fade. Tailwind classes correspond to the same design tokens above.

```jsx
// NavbarReact.jsx
// Dependencies: react, framer-motion, @headlessui/react
// Run: npm install react react-dom framer-motion @headlessui/react

import React, { useEffect, useRef, useState } from "react";
import { Disclosure } from "@headlessui/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const NAV_LINKS = [
  { label: "Work", href: "/work", current: true },
  { label: "About", href: "/about" },
  { label: "Journal", href: "/journal" },
];

const SERVICES = [
  { label: "Brand identity", desc: "Strategy, naming, visual systems", href: "/services/brand" },
  { label: "Digital products", desc: "Web apps, design systems, handoff", href: "/services/digital" },
  { label: "Motion & film", desc: "Brand films, UI animation, direction", href: "/services/motion" },
  { label: "Growth strategy", desc: "Audits, positioning, roadmaps", href: "/services/strategy" },
];

function useScrollHide() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    function handleScroll() {
      const y = window.scrollY;
      setHidden(y > 80 && y > lastY.current);
      lastY.current = y;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shouldReduceMotion]);

  return hidden;
}

export function Navbar() {
  const hidden = useScrollHide();
  const shouldReduceMotion = useReducedMotion();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hamburgerRef = useRef(null);
  const drawerCloseRef = useRef(null);

  // Focus management: open → close button; close → hamburger
  useEffect(() => {
    if (drawerOpen) {
      drawerCloseRef.current?.focus();
    } else {
      // only focus hamburger if drawer was previously open
      if (drawerOpen === false && hamburgerRef.current?.dataset.wasOpen) {
        hamburgerRef.current.focus();
        delete hamburgerRef.current.dataset.wasOpen;
      }
    }
  }, [drawerOpen]);

  function openDrawer()  {
    if (hamburgerRef.current) hamburgerRef.current.dataset.wasOpen = "1";
    setDrawerOpen(true);
  }
  function closeDrawer() { setDrawerOpen(false); }

  // Escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && drawerOpen) closeDrawer();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const slideVariants = {
    hidden: { x: "100%" },
    visible: { x: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
    exit:   { x: "100%", transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  };
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.22 } },
    exit:   { opacity: 0, transition: { duration: 0.18 } },
  };
  const megaVariants = {
    hidden:  { opacity: 0, y: -6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16,1,0.3,1] } },
    exit:    { opacity: 0, y: -4, transition: { duration: 0.16 } },
  };

  return (
    <>
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-4 focus-visible:z-[9999] focus-visible:px-4 focus-visible:py-2 focus-visible:bg-amber-400 focus-visible:text-neutral-950 focus-visible:font-bold focus-visible:rounded"
      >
        Skip to main content
      </a>

      {/* Scroll-aware header */}
      <motion.div
        style={{ position: "sticky", top: 0, zIndex: 100 }}
        animate={{ y: hidden && !shouldReduceMotion ? "-100%" : 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <header className="h-14 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-6 h-full flex items-center gap-8">
            <a href="/" className="text-lg font-bold tracking-tight text-white shrink-0">
              Field<span className="text-amber-400">work</span>
            </a>

            {/* Desktop nav */}
            <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1 ml-auto">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  aria-current={link.current ? "page" : undefined}
                  className="px-3 py-1.5 text-sm font-medium rounded text-zinc-400 hover:text-white hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 aria-[current=page]:text-amber-400"
                >
                  {link.label}
                </a>
              ))}

              {/* Services mega-menu disclosure */}
              <Disclosure>
                {({ open, close }) => (
                  <div className="relative">
                    <Disclosure.Button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded text-zinc-400 hover:text-white hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
                      Services
                      <svg
                        aria-hidden="true"
                        className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5"
                      >
                        <path d="M1 1l4 4 4-4"/>
                      </svg>
                    </Disclosure.Button>
                    <AnimatePresence>
                      {open && (
                        <Disclosure.Panel
                          static
                          as={motion.div}
                          key="services-panel"
                          variants={shouldReduceMotion ? {} : megaVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 min-w-[28rem] bg-zinc-900 border border-zinc-800 rounded-xl p-5 grid grid-cols-2 gap-1 shadow-2xl"
                        >
                          {SERVICES.map((s) => (
                            <a
                              key={s.href}
                              href={s.href}
                              className="flex flex-col p-3 rounded-lg hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                            >
                              <strong className="text-sm font-semibold text-white mb-0.5">{s.label}</strong>
                              <span className="text-xs text-zinc-400">{s.desc}</span>
                            </a>
                          ))}
                        </Disclosure.Panel>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </Disclosure>
            </nav>

            <a href="/contact" className="hidden md:inline-flex items-center px-4 py-1.5 bg-amber-400 text-neutral-950 text-sm font-bold rounded hover:bg-amber-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white shrink-0">
              Start a project
            </a>

            {/* Hamburger */}
            <button
              ref={hamburgerRef}
              type="button"
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
              aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={drawerOpen ? closeDrawer : openDrawer}
              className="md:hidden ml-auto w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {[1,2,3].map((n) => (
                <span
                  key={n}
                  aria-hidden="true"
                  className="block w-5 h-0.5 bg-white rounded transition-transform duration-200"
                />
              ))}
            </button>
          </div>
        </header>
      </motion.div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="overlay"
              variants={shouldReduceMotion ? {} : overlayVariants}
              initial="hidden" animate="visible" exit="exit"
              className="fixed inset-0 bg-black/60 z-[200] md:hidden"
              aria-hidden="true"
              onClick={closeDrawer}
            />
            <motion.div
              key="drawer"
              id="mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              variants={shouldReduceMotion ? {} : slideVariants}
              initial="hidden" animate="visible" exit="exit"
              className="fixed top-0 right-0 bottom-0 w-[min(22rem,90vw)] bg-zinc-900 border-l border-zinc-800 z-[201] flex flex-col md:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
                <span className="text-lg font-bold text-white tracking-tight">Menu</span>
                <button
                  ref={drawerCloseRef}
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={closeDrawer}
                  className="w-9 h-9 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M3 3l12 12M15 3L3 15"/>
                  </svg>
                </button>
              </div>
              <nav aria-label="Mobile navigation" className="flex-1 px-3 py-4">
                <ul role="list" className="space-y-0.5">
                  {[...NAV_LINKS, { label: "Services", href: "/services" }].map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        aria-current={link.current ? "page" : undefined}
                        className="flex items-center px-3 py-3 text-base font-medium rounded-lg text-white hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 aria-[current=page]:text-amber-400"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="px-3 pb-5 shrink-0">
                <a href="/contact" className="block text-center px-4 py-3 bg-amber-400 text-neutral-950 font-bold rounded-lg hover:bg-amber-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  Start a project
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
```

## Variations

| Variant | The knob that changes |
|---|---|
| **Static sticky** | `position: sticky; top: 0` only — no scroll-aware hide. Simplest, works with reduced-motion by default. |
| **Scroll-aware (hide/show)** | JS scroll direction detection + `translate` toggle. Use `data-hidden` attribute to drive CSS. |
| **Transparent-to-solid** | Header starts `background: transparent` at `scrollY === 0`, transitions to opaque on scroll. Use `data-scrolled` attribute. |
| **Mega-menu (disclosure)** | Disclosure pattern: `aria-expanded` button + sibling panel. No `role="menu"`. |
| **Simple dropdown** | Single-column variant of the mega panel — same markup, narrower grid, fewer items. |
| **Left-anchored drawer** | Change `right: 0` to `left: 0` and `translate: -100% 0` → `translate: 0` for a side-panel feel. |
| **Centered logo** | Wordmark centered, nav links split left/right. Requires `grid` or `flex` with spacer elements. |
| **Condensed on scroll** | Reduce `--nav-h` (e.g. 3.5rem → 2.75rem) via a `data-scrolled` class using a CSS transition. |

## Accessibility

### prefers-reduced-motion (mandatory for all animated variants)

The vanilla demo shows the pattern directly in CSS:

```css
@media (prefers-reduced-motion: reduce) {
  /* Header: no translate animation */
  .site-header-wrap {
    transition: none;
    translate: 0 0 !important;
  }
  .site-header-wrap[data-hidden="true"] {
    translate: 0 0;          /* always visible */
  }

  /* Mega panel: instant show/hide, no fade or slide */
  .mega-panel {
    transition: visibility 0s var(--dur-med), opacity 0s var(--dur-med);
    translate: -50% 0 !important;
  }
  .mega-panel[data-open="true"] {
    transition: visibility 0s 0s, opacity 0s 0s;
  }

  /* Hamburger bars: no morph animation */
  .hamburger-bar { transition: none; }

  /* Drawer: instant open/close */
  .drawer { transition: none; }
  .drawer-overlay { transition: none; }
}
```

In the React variant, Framer Motion's `useReducedMotion()` hook returns `true` when the OS setting is active; the code passes an empty `variants` object (`{}`) and removes `AnimatePresence` transitions so components mount and unmount instantly.

**JS-detected motion preference for scroll behavior:**

```js
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// In the scroll handler:
if (!reduceMotion.matches) {
  headerWrap.dataset.hidden = (scrolled && goingDown) ? 'true' : 'false';
}
```

### Contrast

The following pairs are used in this file's code:

- `var(--c-text)` `#e8e8ed` on `var(--c-surface)` `#18181b`: relative luminance ~0.84 vs ~0.01 — contrast ratio approximately **18:1**. Passes WCAG AA and AAA for all sizes.
- `var(--c-accent)` `#d4a843` (amber) on `var(--c-bg)` `#0f0f11`: relative luminance ~0.39 vs ~0.003 — contrast ratio approximately **9.5:1**. Passes AA large and AAA for normal text.
- `var(--c-accent)` `#d4a843` as button text background with foreground `#0f0f11`: the CTA inverts this — dark text on amber. Contrast approximately **9.5:1**. Passes all levels.
- `var(--c-muted)` `#8a8a9a` on `#18181b`: relative luminance ~0.27 vs ~0.01 — contrast ratio approximately **5.5:1**. Passes AA for normal text (4.5:1 threshold).

### Keyboard navigation

Follows the APG disclosure navigation pattern exactly:

- `Tab` / `Shift+Tab`: move through all interactive elements in tab order.
- `Enter` / `Space` on disclosure button: toggle mega panel; focus stays on button.
- `Escape`: close open panel, return focus to the controlling button.
- Auto-close on `focusout`: when focus leaves the `<li>` containing the button and panel, the panel closes.
- The mobile drawer is a `role="dialog"` with `aria-modal="true"`. Focus enters on the close button; focus return lands on the hamburger button on close.

### Focus indicators

All interactive elements use `:focus-visible` (not `:focus`) so sighted mouse users are not shown outlines, but keyboard users always see a `2px solid var(--c-accent)` ring with `2px` offset. This meets WCAG 2.2 SC 2.4.11 (Focus Appearance, minimum 2px perimeter).

### `inert` for mobile drawer focus management

Instead of a JavaScript focus-trap loop, background content (`.site-header-wrap`, `#main-content`) receives the `inert` attribute when the drawer opens. `inert` removes all elements from tab order and from the accessibility tree — more reliable than `tabindex="-1"` on every child. Browser support: Chrome 102+, Edge 102+, Firefox 112+, Safari 15.5+. The drawer itself starts with `inert` in HTML and has it removed when opened.

### Touch and pointer fallback

Hover-only interactions (mega-menu hover-open patterns) are a common trap. This implementation uses **click/focus** to open the mega panel — not CSS `:hover`. Touch users tap the disclosure button; the panel opens. The hamburger works identically with `click` on both mouse and touch. No `@media (hover: hover)` gate is needed because nothing is hover-only; hover is purely a visual state class.

### Screen reader announcements

- The `<nav>` landmark with `aria-label="Main navigation"` is distinct from `aria-label="Mobile navigation"` in the drawer, so screen readers distinguish them.
- `aria-current="page"` on the active link is announced as "current page" by most screen readers.
- `aria-expanded` on disclosure buttons gives "expanded" / "collapsed" state.
- `role="dialog"` with `aria-modal="true"` on the drawer signals to screen readers that the surrounding content is inert.
- The skip link is the first focusable element in DOM order, announced as a link when focused.

## Performance

- **Animate only `transform` (via `translate`) and `opacity`**: both run on the compositor thread, causing no layout or paint. The header hide/show uses `translate: 0 -100%`, not `top` or `margin-top` which would force layout recalculation on every frame.
- **`backdrop-filter: blur`** triggers GPU compositing. Limit it to one surface (the header). On complex pages with many composited layers, it can be expensive — measure with DevTools Layers panel. Provide a fallback for browsers that don't support it: `background: var(--c-surface)` at opacity 1.
- **`will-change`**: do not set it on the header permanently. The scroll handler is debounced via `requestAnimationFrame`, so property changes happen once per frame — `will-change: transform` would promote the element to its own layer even when static, wasting GPU memory.
- **`visibility: hidden`** (not `display: none`) for off-screen drawer and closed panels: avoids triggering layout recalculation while still removing the element from accessibility and tab order. Pair with `inert` for the accessibility guarantee.
- **Passive scroll listener**: `{ passive: true }` prevents the browser from waiting to check whether `preventDefault()` is called, unblocking scroll thread.
- **IntersectionObserver alternative**: for the scroll-aware header without JS scroll events, observe a sentinel `<div>` at the top of the page. When the sentinel leaves the viewport, apply the scrolled state. This avoids continuous `scroll` event firing entirely, though it gives coarser control over direction detection.
- **Bundle cost** (React variant): `@headlessui/react` is ~12 kB gzipped; `framer-motion` is ~42 kB gzipped. For a navbar alone, consider using vanilla JS or a lighter disclosure utility if bundle size is constrained.

## Anti-slop

**Surface cliche (blocklist: Glassmorphism on every card; Generic SaaS blue everywhere):**
The lazy implementation applies `backdrop-filter: blur(20px)` with a semi-transparent white card surface on a pastel gradient background — every SaaS product did this in 2021–2023. The nav uses the default `#3B82F6` blue for hover states and the CTA, which reads as an undesigned template.

**Tasteful alternative:**
Use a single-hue tonal palette — here, a near-black `#18181b` surface with `#d4a843` amber as the only accent (one sharp accent, not gradient-to-pink). `backdrop-filter` is applied only to the header surface, not repeated on every card. The CTA uses amber with dark text for legibility, not a glowing gradient button. The hover state is a low-opacity tint of the text color (`color-mix(in oklch, var(--c-text) 8%, transparent)`) rather than a brand-color fill, keeping interaction feedback subtle.

**Motion cliche (blocklist: Everything fades-and-slides-up same duration same easing):**
Auto-playing a carousel in the hero nav area, or having every dropdown link stagger-fade with `ease` at 300 ms identical timing, reads as a generated template. The mega panel here uses a single fade+translate with a custom expo-out `cubic-bezier(0.16,1,0.3,1)`, not a stagger — staggering five links in a utility nav panel serves no storytelling purpose and slows the user down.

**Copy cliche (blocklist: Empower/Seamless/Unlock headlines):**
CTA text "Get Started" or "Explore Solutions" is invisible. The implementation uses "Start a project" — concrete, action-oriented, states what happens next.

**Layout cliche (blocklist: Centered 800px column equal padding):**
A navbar that just centers links in a fixed 800 px column collapses oddly at mid-widths. The implementation uses `max-width: 72rem` with `padding-inline: 1.5rem`, fluid to viewport edge, collapsing cleanly to the hamburger at `52rem`.

## Pairs well with

- `skip-link` (already embedded above — the skip link pattern is part of this component's required anatomy, not an optional add-on).
- `scroll-progress-indicator` — a thin progress bar attached to the bottom edge of the sticky header reads scroll completion without competing with the nav content.
- `staggered-entrance` — the mega-menu panel can share the expo-out easing language used for entrance animations elsewhere on the page.
- `editorial-typographic` — a wordmark in a display face (Fraunces, Instrument Serif) inside the navbar sets the type tone for the whole site.
- `modal-dialog` — the same `inert`-based focus management and `role="dialog"` anatomy used for the mobile drawer applies directly to modals; consistency in pattern reduces implementation surface.

## Current references

- [ARIA APG — Disclosure navigation menu example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/) — canonical keyboard and ARIA requirements; explains why `role="menu"` is wrong for site navigation
- [ARIA APG — Disclosure navigation hybrid example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/) — adds optional arrow-key enhancement to the disclosure pattern
- [Bram.us — Solved by CSS scroll-driven animations: hide a header (Sep 2024)](https://www.bram.us/2024/09/29/solved-by-css-scroll-driven-animations-hide-a-header-when-scrolling-up-show-it-again-when-scrolling-down/) — pure-CSS scroll-direction detection with style queries and transition-delay trick
- [web.dev — The inert attribute](https://web.dev/articles/inert) — how `inert` replaces JavaScript focus-trap loops; browser support table (Chrome 102+, Firefox 112+, Safari 15.5+)
- [web.dev — prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion) — CSS and JS patterns for motion preference, including `matchMedia` change listener
- [Impressive Webs — Accessible hamburger menu + slide-out navigation](https://www.impressivewebs.com/accessible-keyboard-friendly-hamburger-menu-slide-out-navigation/) — focus return pattern, `aria-expanded`, `visibility: hidden` technique
- [WebAIM — Skip navigation links](https://webaim.org/techniques/skipnav/) — skip link placement, CSS hiding, `tabindex="-1"` on the target
- [The A11Y Collective — Skip to main content](https://www.a11y-collective.com/blog/skip-to-main-content/) — skip link implementation with modern CSS, `tabindex="-1"` on `<main>`
- [Level Access — Accessible navigation menus: pitfalls and best practices](https://www.levelaccess.com/blog/accessible-navigation-menus-pitfalls-and-best-practices/) — real-world failure modes, 44 px touch targets, WCAG citation
- [TestParty — Accessible navigation: dropdown and mega menu implementation](https://testparty.ai/blog/navigation-menu-accessibility) — keyboard interaction table, `aria-labelledby` for mega-menu sections
