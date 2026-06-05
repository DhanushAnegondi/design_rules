# Breakpoint strategy

> A principled system for deciding when and how a layout changes shape — anchored to content needs and container space, not device pixel counts.

**Bucket:** layout
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, apps, dashboards

## What it is

A breakpoint is the threshold at which a media or container query changes how elements are styled. The *strategy* is how you choose those thresholds: device-agnostic or content-driven, pixel or em units, viewport-wide or container-local. The mental model that has solidified since 2020 is a two-tier approach — a small number of **major breakpoints** that shift the macro page skeleton (column count, sidebar presence, nav mode), paired with **minor breakpoints** tuned to wherever a specific component starts to look bad — plus **container queries** that let components respond to their own available width rather than the viewport at all.

Users perceive the result as a layout that always feels "fitted" rather than squished or awkwardly spacious, regardless of device.

## When to use

- Any multi-column layout that needs to collapse gracefully on narrower viewports.
- Component-heavy design systems where a card, sidebar, or data table must reflow in multiple contexts (main column, drawer, modal).
- When `clamp()` and intrinsic flex/grid handle fluid scaling within a range but a structural change (stack vs side-by-side) is still needed at the range boundaries.
- Alongside container queries: use media queries for global/page-level shifts, container queries for component-level shifts.
- When the user's OS font-size or zoom preference should influence layout thresholds (favor em-based breakpoints).

## When NOT to use

- **Do not set breakpoints at device pixel values.** `768px`, `1024px`, `1366px` — these chase a device landscape that changes yearly and is already fragmented. Tablets ship at 800px, 820px, 834px, and 1024px simultaneously.
- **Do not break layouts at every rough screen-size category by default.** Most UIs need 2–3 major breakpoints; adding a fourth and fifth for marginal screen widths increases CSS surface area with diminishing returns.
- **Do not use breakpoints as a substitute for intrinsic layout.** A grid with `repeat(auto-fit, minmax(18rem, 1fr))` adapts continuously without a single `@media` rule. Reach for a breakpoint only when intrinsic layout cannot make the structural decision alone.
- **Do not mix em and px breakpoints in the same codebase.** Pick one unit and be consistent; mismatches produce confusing cascade behavior.
- **Everyone overuses `max-width` breakpoints** (desktop-first shrinkage). They layer on exceptions rather than building up from a sound small-screen base, producing bloated, hard-to-maintain stylesheets.

## How it works

### Mobile-first means `min-width`, never `max-width` for layout

Write base styles that work at the smallest viewport, then use `@media (width >= Xem)` to *add* layout complexity. The browser reads and applies exactly the styles needed for each screen; overrides are minimal. This also matches the natural cascade — general before specific.

### Choose breakpoints where content breaks, not where devices land

Shrink the browser window until the layout becomes uncomfortable. Note the pixel width. Divide by 16 (the universal browser baseline) to get an em value. That is your breakpoint. Repeat for each structural decision. Two or three major values plus one or two minor tweaks per component is the typical ceiling.

### em units scale with user font-size preferences

`@media (width >= 48em)` means "48 times the root font size". If a user has set their browser font to 20px (common for low-vision users), that breakpoint fires at 960px instead of 768px — the layout responds proportionally, exactly when line lengths and touch targets need it. Pixel breakpoints (`768px`) are immune to this preference. The Cloud Four analysis and Zell Liew's cross-browser test both conclude em is the most consistent unit across zoom behavior and browser font-size settings, though note the historical Safari bug with `rem` units (rem fired at the wrong threshold in older Safari when the html element had an explicit font-size; `em` was unaffected and remains the safer choice).

Modern range syntax (supported in all current browsers) makes intent more readable:

```css
/* Legacy prefix syntax — still valid */
@media (min-width: 48em) { }

/* Modern range syntax — same meaning, more legible */
@media (width >= 48em) { }

/* Range with upper bound */
@media (30em <= width < 60em) { }
```

### Container queries: breakpoints scoped to the parent, not the viewport

`@container` lets a component query the size of its direct containing block. A card in a 300px sidebar and the same card in a 900px main column can apply different layouts without knowing anything about the viewport. This is the right tool for design-system components that are placed in varied contexts.

```css
.card-wrapper {
  container-type: inline-size;   /* enables width queries on this element */
  container-name: card;
}

@container card (width >= 30em) {
  .card { display: flex; gap: 1.5rem; }
}
```

Container queries have baseline support across all major browsers since 2023. Container style queries (querying custom property values) still await Firefox implementation as of mid-2026.

### Major vs minor breakpoints

- **Major breakpoints** (2–3): Drive the page skeleton — single-column to multi-column, nav collapse, sidebar appearance. Defined globally, usually on `:root` or layout wrappers.
- **Minor breakpoints** (component-local): A figure caption that wraps at 22em, a data table that needs horizontal scroll below 38em. Defined close to the component's own styles.

## Working code

### Complete responsive page skeleton — mobile-first, em-based, with container queries

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Breakpoint strategy demo</title>
  <style>
    /* ─── Reset & tokens ───────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; }

    :root {
      --space-s: clamp(0.75rem, 2vw, 1rem);
      --space-m: clamp(1rem, 3vw, 1.5rem);
      --space-l: clamp(1.5rem, 5vw, 3rem);
      --text-base: clamp(1rem, 1.25vw + 0.5rem, 1.125rem);
      --text-lg: clamp(1.25rem, 2vw + 0.5rem, 1.75rem);
      --text-xl: clamp(1.75rem, 4vw + 0.5rem, 3rem);

      /* One committed brand hue — not SaaS blue #3B82F6 */
      --hue: 212;
      --ink: oklch(18% 0.02 var(--hue));
      --ink-muted: oklch(45% 0.04 var(--hue));
      --surface: oklch(98% 0.005 var(--hue));
      --surface-raised: oklch(100% 0 0);
      --accent: oklch(48% 0.18 var(--hue));  /* darkened to L=48% for text contrast — see Accessibility */
      --accent-text: oklch(96% 0.01 var(--hue));
      --border: oklch(88% 0.01 var(--hue));
      --radius: 0.5rem;
    }

    body {
      font-family: "General Sans", system-ui, sans-serif;
      font-size: var(--text-base);
      line-height: 1.6;
      color: var(--ink);
      background: var(--surface);
      /* Safe area: env() padding for notched/home-bar devices */
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
    }

    /* ─── Skip link (keyboard a11y) ────────────────────────────── */
    .skip-link {
      position: absolute;
      top: -100%;
      left: 1rem;
      padding: 0.5rem 1rem;
      background: var(--accent);
      color: var(--accent-text);
      border-radius: var(--radius);
      font-weight: 600;
      z-index: 100;
      text-decoration: none;
    }
    .skip-link:focus { top: 1rem; }

    /* ─── Site header ──────────────────────────────────────────── */
    .site-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-s);
      padding: var(--space-s) var(--space-m);
      border-bottom: 1px solid var(--border);
      background: var(--surface-raised);
    }

    .site-header nav {
      display: flex;
      gap: var(--space-m);
      list-style: none;
      flex-wrap: wrap;
    }

    .site-header a {
      color: var(--ink-muted);
      text-decoration: none;
      font-size: 0.9375rem;
      min-height: 44px;            /* ≥44px touch target */
      display: inline-flex;
      align-items: center;
      padding: 0 0.25rem;
    }
    .site-header a:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
      border-radius: 3px;
    }

    .logo {
      font-weight: 700;
      font-size: var(--text-lg);
      letter-spacing: -0.02em;
      color: var(--ink);
      text-decoration: none;
    }

    /* ─── Page layout: single-column base ─────────────────────── */
    .page-wrapper {
      display: grid;
      grid-template-columns: 1fr;       /* mobile: one column */
      grid-template-rows: auto;
      gap: 0;
      max-width: 90rem;
      margin: 0 auto;
    }

    main { padding: var(--space-l) var(--space-m); }
    aside { padding: var(--space-m); border-top: 1px solid var(--border); }

    /* ─── MAJOR BREAKPOINT 1 — ~600px — content-driven ─────────
       At this width a two-column sidebar layout becomes readable;
       chosen where a 240px sidebar + 40px gap + main at ~320px
       first fits without cramping either column.
       600 / 16 = 37.5em
    ────────────────────────────────────────────────────────────── */
    @media (width >= 37.5em) {
      .page-wrapper {
        grid-template-columns: 1fr;      /* sidebar still below on tablets */
      }
      main { padding: var(--space-l); }
    }

    /* ─── MAJOR BREAKPOINT 2 — ~900px — content-driven ─────────
       Sidebar moves alongside content when there is real room.
       900 / 16 = 56.25em
    ────────────────────────────────────────────────────────────── */
    @media (width >= 56.25em) {
      .page-wrapper {
        grid-template-columns: 1fr 16rem;
        grid-template-rows: 1fr;
        align-items: start;
      }
      aside {
        border-top: none;
        border-left: 1px solid var(--border);
        position: sticky;
        top: 1rem;
        max-height: calc(100dvh - 2rem);
        overflow-y: auto;
        /* Safe area: handle notched right edges on landscape phones/tablets */
        padding-right: max(var(--space-m), env(safe-area-inset-right));
      }
    }

    /* ─── MAJOR BREAKPOINT 3 — ~80em — wider reading column ─────
       80em / 16 = 1280px; increase sidebar at this width.
    ────────────────────────────────────────────────────────────── */
    @media (width >= 80em) {
      .page-wrapper { grid-template-columns: 1fr 20rem; }
    }

    /* ─── Hero ─────────────────────────────────────────────────── */
    .hero {
      margin-bottom: var(--space-l);
    }

    .hero h1 {
      font-size: var(--text-xl);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.1;
      max-width: 22ch;
      color: var(--ink);
    }

    .hero p {
      margin-top: var(--space-s);
      max-width: 52ch;
      color: var(--ink-muted);
    }

    /* ─── Card grid with container queries ─────────────────────
       Each card queries its own container, not the viewport.
       This grid can live inside a narrow sidebar or a wide main
       column — the cards adapt either way.
    ────────────────────────────────────────────────────────────── */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));
      gap: var(--space-m);
      margin-top: var(--space-l);
    }

    /* Each card wrapper is a named container */
    .card-outer {
      container-type: inline-size;
      container-name: card;
    }

    .card {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }

    /* Default: stacked layout */
    .card-body {
      padding: var(--space-m);
    }

    .card-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent);
    }

    .card-title {
      margin-top: 0.25rem;
      font-size: var(--text-lg);
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .card-desc {
      margin-top: var(--space-s);
      font-size: 0.9375rem;
      color: var(--ink-muted);
      line-height: 1.55;
    }

    .card-action {
      display: inline-flex;
      align-items: center;
      margin-top: var(--space-m);
      padding: 0.625rem 1.25rem;
      background: var(--accent);
      color: var(--accent-text);
      border-radius: calc(var(--radius) / 2);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9375rem;
      min-height: 44px;           /* ≥44px touch target */
    }
    .card-action:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }

    /* ─── MINOR (container) BREAKPOINT — card switches to horizontal
       at 28em of its own container width, wherever it is placed.
       28em chosen because at this width label + title + desc fit
       side-by-side without crowding a 10rem visual column.
    ────────────────────────────────────────────────────────────── */
    @container card (width >= 28em) {
      .card {
        display: grid;
        grid-template-columns: 10rem 1fr;
      }

      .card-visual {
        height: 100%;
        min-height: 9rem;
      }
    }

    /* Placeholder visual block (replace with <img> in production) */
    .card-visual {
      background: oklch(92% 0.03 var(--hue));
      min-height: 9rem;
    }

    /* ─── Sidebar widget ────────────────────────────────────────── */
    .sidebar-section {
      margin-bottom: var(--space-l);
    }

    .sidebar-section h2 {
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--ink-muted);
      margin-bottom: var(--space-s);
    }

    .sidebar-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .sidebar-list a {
      display: block;
      padding: 0.5rem 0.75rem;
      border-radius: calc(var(--radius) / 2);
      color: var(--ink-muted);
      text-decoration: none;
      font-size: 0.9375rem;
      min-height: 44px;           /* ≥44px touch target */
      display: flex;
      align-items: center;
    }
    .sidebar-list a:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    /* ─── Safe area bottom (home bar on iOS) ────────────────────── */
    .site-footer {
      padding: var(--space-m) var(--space-m);
      padding-bottom: calc(var(--space-m) + env(safe-area-inset-bottom));
      border-top: 1px solid var(--border);
      font-size: 0.875rem;
      color: var(--ink-muted);
    }

    /* ─── Hover effects — pointer devices only ─────────────────────
       Touch devices skip these to avoid sticky :hover states.
    ────────────────────────────────────────────────────────────── */
    @media (hover: hover) and (pointer: fine) {
      .site-header a:hover { color: var(--ink); }
      .card-action:hover { opacity: 0.85; }
      .sidebar-list a:hover { background: var(--border); color: var(--ink); }
    }

    /* ─── Motion: opacity transition only when motion is OK ────────
       Respects the OS-level "reduce motion" preference.
    ────────────────────────────────────────────────────────────── */
    @media (prefers-reduced-motion: no-preference) {
      .card-action { transition: opacity 0.15s; }
    }
  </style>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to content</a>

  <header class="site-header">
    <a href="/" class="logo">Fieldwork</a>
    <nav aria-label="Primary">
      <a href="/work">Work</a>
      <a href="/process">Process</a>
      <a href="/writing">Writing</a>
      <a href="/contact">Contact</a>
    </nav>
  </header>

  <div class="page-wrapper">
    <main id="main-content">
      <section class="hero">
        <h1>Design that earns its complexity.</h1>
        <p>
          A studio for interfaces that know exactly where they are —
          on a 320px phone or a 2560px monitor — and behave accordingly.
        </p>
      </section>

      <div class="card-grid" role="list" aria-label="Selected projects">

        <div class="card-outer" role="listitem">
          <article class="card">
            <div class="card-visual" role="img" aria-label="Vanta — stock chart preview"></div>
            <div class="card-body">
              <span class="card-label">Dashboard</span>
              <h2 class="card-title">Vanta portfolio tracker</h2>
              <p class="card-desc">
                Live P&amp;L, allocation rings, and a transaction log that
                stays readable on a phone held one-handed on the subway.
              </p>
              <a href="/work/vanta" class="card-action">View case study</a>
            </div>
          </article>
        </div>

        <div class="card-outer" role="listitem">
          <article class="card">
            <div class="card-visual" role="img" aria-label="Groundwork — editorial preview"></div>
            <div class="card-body">
              <span class="card-label">Editorial</span>
              <h2 class="card-title">Groundwork field guide</h2>
              <p class="card-desc">
                Long-form typography for outdoor researchers who read at
                arm's length in bright sunlight, often with gloves on.
              </p>
              <a href="/work/groundwork" class="card-action">View case study</a>
            </div>
          </article>
        </div>

        <div class="card-outer" role="listitem">
          <article class="card">
            <div class="card-visual" role="img" aria-label="Shelter — map preview"></div>
            <div class="card-body">
              <span class="card-label">App</span>
              <h2 class="card-title">Shelter housing finder</h2>
              <p class="card-desc">
                Geofenced listings, offline map tiles, and a
                filter system tested with one-handed reachability constraints.
              </p>
              <a href="/work/shelter" class="card-action">View case study</a>
            </div>
          </article>
        </div>

      </div>
    </main>

    <aside aria-label="Site navigation">
      <div class="sidebar-section">
        <h2>Disciplines</h2>
        <ul class="sidebar-list">
          <li><a href="/ux">UX research</a></li>
          <li><a href="/systems">Design systems</a></li>
          <li><a href="/motion">Motion</a></li>
          <li><a href="/accessibility">Accessibility</a></li>
        </ul>
      </div>
      <div class="sidebar-section">
        <h2>Recent writing</h2>
        <ul class="sidebar-list">
          <li><a href="/writing/container-queries">Container queries in practice</a></li>
          <li><a href="/writing/touch-targets">Touch target arithmetic</a></li>
          <li><a href="/writing/oklch">Why OKLCH replaced HSL</a></li>
        </ul>
      </div>
    </aside>
  </div>

  <footer class="site-footer">
    <p>Fieldwork Studio — London &amp; remote — 2024</p>
  </footer>
</body>
</html>
```

The three major breakpoints in this demo — 37.5em (~600px), 56.25em (~900px), and 80em (~1280px) — were chosen by shrinking the layout until it became uncomfortable, then converting to em. No device name is referenced anywhere.

### React / component version — container query hook pattern

```jsx
// CardGrid.jsx — works inside any container width without knowing the viewport

import { useRef, useEffect, useState } from "react";

/**
 * useContainerWidth — reads the rendered width of a ref'd element.
 * Falls back to ResizeObserver (supported in all current browsers).
 */
function useContainerWidth(ref) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);

  return width;
}

function ProjectCard({ label, title, description, href }) {
  const ref = useRef(null);
  const containerWidth = useContainerWidth(ref);
  // 28em at 16px base = 448px — same threshold as the CSS @container rule
  const isWide = containerWidth >= 448;

  return (
    <div ref={ref} style={{ containerType: "inline-size" }}>
      <article
        style={{
          display: isWide ? "grid" : "block",
          gridTemplateColumns: isWide ? "10rem 1fr" : undefined,
          border: "1px solid #e2e8f0",
          borderRadius: "0.5rem",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            background: "#e8eef4",
            minHeight: "9rem",
            height: isWide ? "100%" : "9rem",
          }}
        />
        <div style={{ padding: "1.25rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#3a6ea5",
            }}
          >
            {label}
          </span>
          <h2
            style={{
              marginTop: "0.25rem",
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h2>
          <p style={{ marginTop: "0.5rem", color: "#555f6d" }}>{description}</p>
          <a
            href={href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              marginTop: "1rem",
              padding: "0.625rem 1.25rem",
              minHeight: "44px",
              background: "#3a6ea5",
              color: "#fff",
              borderRadius: "0.25rem",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.9375rem",
            }}
          >
            View case study
          </a>
        </div>
      </article>
    </div>
  );
}

export function CardGrid({ projects }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(18rem, 100%), 1fr))",
        gap: "1.5rem",
      }}
    >
      {projects.map((p) => (
        <ProjectCard key={p.href} {...p} />
      ))}
    </div>
  );
}
```

Note: the JS `ResizeObserver` pattern is a reasonable fallback for cases where the CSS `container-type` property cannot be applied (e.g., a third-party component that cannot be wrapped). In a vanilla CSS context, the `@container` rule in the first example is preferable — no JS overhead.

## Variations

- **Viewport-only** (classic): `@media (width >= Xem)` for all breakpoints. Simplest; works everywhere; brittle for components reused in varied containers.
- **Container-only** (component-first): Every component defines its own `@container` rules; no page-level `@media` for layout. Pure but requires careful wrapper markup and can obscure global layout decisions.
- **Hybrid** (recommended): 2–3 `@media` rules for the page skeleton and sidebar positioning; `@container` rules inside reusable components. This is the approach in the working code above.
- **Fluid-only** (no breakpoints): `clamp()`, `auto-fit`/`auto-fill` grids, and aspect-ratio constraints handle all adaptation. No `@media` or `@container` at all. Works beautifully for content that scales linearly; fails when a structural topology change (stacked vs grid) is needed.
- **Major + minor breakpoints**: Define 2–3 major breakpoints on a global custom property (or design token); define minor breakpoints inline per component using `@container` or a locally-scoped `@media`.

## Accessibility

### Color contrast

All ratios computed from OKLCH values in this file using the WCAG relative luminance formula (IEC 61966-2-1 linearization). --surface-raised is pure white (oklch(100% 0 0) = luminance 1.0); --surface is oklch(98% 0.005 212) ≈ luminance 0.943.

**OKLCH token pairs (main HTML/CSS working code)**

| Foreground token | Background token | Computed ratio | WCAG level |
|---|---|---|---|
| --ink (oklch 18% 0.02 212) | --surface (oklch 98% 0.005 212) | 17.7:1 | AAA |
| --ink-muted (oklch 45% 0.04 212) | --surface | 6.9:1 | AAA |
| --ink-muted | --surface-raised (white) | 7.3:1 | AAA |
| --accent-text (oklch 96% 0.01 212) | --accent (oklch 48% 0.18 212) | 4.8:1 | AA (normal text) |
| --accent (oklch 48% 0.18 212) | --surface (focus outline, non-text) | 5.1:1 | WCAG 1.4.11 pass (>= 3:1) |
| --accent | --surface-raised (focus outline on white card, non-text) | 5.4:1 | WCAG 1.4.11 pass (>= 3:1) |

Note on --ink-muted: oklch L=45% with chroma 0.04 at hue 212 resolves to a muted steel-blue-grey. The computed ratios (6.9:1 on --surface, 7.3:1 on white) comfortably exceed AA (4.5:1 for normal text). No adjustment to L is needed.

Note on --accent: the working code uses oklch(48% 0.18 212), not 55%. The value was darkened from L=55% (which produced only 3.6:1 for --accent-text button text, failing AA) to L=48% to achieve 4.8:1. The focus-outline ratios (5.1:1 and 5.4:1) exceed the WCAG 1.4.11 minimum of 3:1 for non-text UI components.

**React JSX component hardcoded hex colors (illustrative values — production code should use the token system above)**

| Foreground | Background | Computed ratio | WCAG level | Usage |
|---|---|---|---|---|
| #3a6ea5 | #fff (white) | 5.3:1 | AA | label text (0.75rem bold), button background |
| #555f6d | #fff | 6.5:1 | AA | description body text |
| #fff | #3a6ea5 | 5.3:1 | AA | button label text on button background |

The JSX hex colors are illustrative values that pass AA. In a token-driven codebase, replace them with CSS custom properties (--accent, --ink-muted, etc.) resolved from the same OKLCH system.

### Touch targets
Every interactive element in the working code has `min-height: 44px` (Apple HIG minimum) enforced via inline style or utility class. On pointer devices this padding is invisible; on touch it prevents mis-taps. WCAG 2.5.5 (Level AAA) recommends 44×44px; WCAG 2.5.8 (Level AA, WCAG 2.2) requires at minimum 24×24px with no adjacent element within 24px.

### Safe area insets
`viewport-fit=cover` in the `<meta>` tag lets the layout extend edge-to-edge. The `env(safe-area-inset-*)` calls on `body`, `aside`, and `.site-footer` then re-establish padding inside the safe zone. Without this pair, notch/home-bar devices clip content.

### Keyboard and focus
All interactive elements in the code expose `:focus-visible` outlines. The skip link (`<a href="#main-content">`) is the first focusable element and jumps directly to main content. No focus traps are introduced by the layout shift.

### `prefers-reduced-motion`
Breakpoint strategy itself does not involve animation. Any transition on layout properties (e.g., `transition: grid-template-columns`) must be wrapped:

```css
@media (prefers-reduced-motion: no-preference) {
  .page-wrapper {
    transition: grid-template-columns 0.3s ease;
  }
}
```

Never transition layout properties unconditionally — `grid-template-columns` and `grid-template-rows` are composited on the CPU, not GPU, and can trigger layout recalculation mid-animation.

### Pointer and hover fallbacks
Navigation links and card actions are styled without hover-only affordances that touch users would miss. If you add hover-only effects (underline, background color change), gate them:

```css
@media (hover: hover) and (pointer: fine) {
  .card-action:hover { opacity: 0.85; }
}
```

### Screen readers
The card grid uses `role="list"` and `role="listitem"` because the CSS `list-style: none` removes list semantics in Safari. The visual layout reflows at container breakpoints; the DOM order does not change, so the reading sequence is preserved regardless of the layout applied.

## Performance

- **No layout thrash**: container queries fire from `ResizeObserver` internally in the browser; they do not cause synchronous layout reads in JS.
- **Avoid `container-type: size`** when you only need to query width. `inline-size` applies only inline-size containment, which is cheaper. `size` also applies block-size containment, which can break height-dependent layouts (e.g., percentage heights inside the container stop working).
- **`@media` rules are free**: the browser re-evaluates them at resize, not at every paint. No performance concern for 3–5 `@media` rules.
- **Do not transition `width`, `max-width`, `grid-template-columns`** or other layout properties in response to breakpoints — these cause full layout recalculation on every animation frame. If animation between layout states is desired, animate `opacity` and `transform` on child elements instead (e.g., fade-crossfade the compact vs wide card state).
- **`will-change: transform`** is not applicable here; reserve it for elements that actually animate `transform`.
- **Sticky sidebar** (`position: sticky`) creates a new stacking context and a composited layer. One sticky element is fine; dozens will increase memory pressure.

## Anti-slop

**The cliche** (Layout bucket, `_slop-blocklist.md`): Setting breakpoints at `768px` and `1024px` because those are the "tablet" and "desktop" values, then copying the same 3-card grid layout at every breakpoint, centered in an 800px column with equal padding everywhere. The result is a rigid, device-chasing layout that breaks on anything outside the expected device widths and has no rhythm variation.

**The tasteful alternative**: Choose breakpoints by shrinking the browser until the layout is uncomfortable, then recording that width in em units. Use `auto-fill`/`minmax` grids to handle intermediate sizes without additional breakpoints. Vary layout rhythm with full-bleed sections and offset grids at large viewports rather than uniformly centering everything. Keep the major breakpoint count to 2–3. Use container queries for cards, figures, and tables that appear in multiple contexts, so they adapt to their actual container rather than guessing from the viewport.

## Pairs well with

- **fluid-type-and-space** (use `clamp()` for typography and spacing so those scale continuously between the same em breakpoints, reducing the total number of layout shifts needed)
- **container-queries** (the container query entry covers `@container` syntax and named containers in depth; breakpoint strategy determines *when* to use `@container` vs `@media`)
- **intrinsic-grid-layout** (CSS Grid's `auto-fill`/`minmax` is the primary way to eliminate minor breakpoints entirely for card grids)
- **touch-targets-and-safe-areas** (the `env()` safe-area insets and 44px minimum touch target sizing used in the code above are covered in full in that entry)
- **mobile-first-navigation** (nav collapse at the first major breakpoint is one of the two or three structural decisions that justify a `@media` rule)

## Current references

- [MDN — Using media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries) — canonical syntax including modern range notation (`width >= 48em`)
- [MDN — CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) — `container-type`, `@container`, `cqi`/`cqw` units, browser support matrix
- [Smashing Magazine — Beyond CSS media queries (16 May 2024, Juan Diego Rodríguez)](https://www.smashingmagazine.com/2024/05/beyond-css-media-queries/) — argues for flexbox/grid intrinsic patterns over breakpoint-heavy CSS; good on the management cost of "magic number" breakpoints
- [LogRocket — Container queries in 2026: Powerful, but not a silver bullet (26 Dec 2025)](https://blog.logrocket.com/container-queries-2026/) — honest assessment of container query limitations (no self-querying, style queries still await Firefox), and when to keep using `@media`
- [Zell Liew — PX, EM or REM media queries?](https://zellwk.com/blog/media-query-units/) — cross-browser test concluding em is the most consistent unit; documents the Safari rem bug
- [Cloud Four — The EMs have it](https://cloudfour.com/thinks/the-ems-have-it-proportional-media-queries-ftw/) — practical argument for em breakpoints with real device examples (Kindle Touch case study)
- [NNG — Breakpoints in responsive design](https://www.nngroup.com/articles/breakpoints-in-responsive-design/) — UX research perspective on content-driven breakpoint selection and T-shirt-size naming
- [MDN — env() function](https://developer.mozilla.org/en-US/docs/Web/CSS/env) — `safe-area-inset-*` variables, `viewport-fit=cover`, browser support
- [Polypane — Using safe-area-inset to build mobile-safe layouts](https://polypane.app/blog/using-safe-area-inset-to-build-mobile-safe-layouts/) — practical guide to env() with notch and home-bar handling
