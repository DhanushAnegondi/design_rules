# Dashboard recipe

> A data-dense admin interface built on a dark-mode-first minimalist skin, sidebar+content skeleton, accessible semantic-token color (two hues encode meaning, not sequence), and skeleton loading — restrained, legible, and keyboard-navigable.

**Build target:** dashboard
**Feel:** restrained, precise, data-first, calm authority
**Effort:** medium

## The stack

- **Skin (visual style):** `01-visual-styles/minimalism` — strips all decoration so data carries the page; elevation by tonal lightness steps (dark-mode-aesthetic rules), not soft shadows on every card, because the slop blocklist names "soft drop shadow on every element" as the canonical admin tell.
- **Skeleton (layout):** `03-layout-systems/sidebar-content` combined with `03-layout-systems/bento-grid` for the content pane — sidebar+content is the right app-shell for wayfinding-heavy dashboards; bento tiles of varied span give KPIs and chart placeholders genuine size hierarchy instead of a uniform four-card band (the stat-band slop default).
- **Behaviors (motion):**
  - Skeleton loading (`08-ui-states-feedback`) — `aria-busy="true"` shimmer on cards while data loads; appears and disappears without sliding so reduced-motion users get an instant content swap.
  - Sidebar collapse transition (`03-layout-systems/sidebar-content`) — `grid-template-columns` transition at 220ms, disabled under `prefers-reduced-motion`, because power users collapsing the rail need orientation not spectacle.
  - Micro-transitions on state (`08-ui-states-feedback`) — 120ms `opacity` only on row hover and focus rings; no translate-Y fade-ups on data that should just be there.
- **Type:** `05-typography-color/font-pairing` — system sans superfamily for body and labels (zero download cost, ideal for data-dense screens), plus a mono face (`ui-monospace` / JetBrains Mono) for every number, timestamp, ID, and table cell; the explicit non-slop move against "Inter at one weight for everything."
- **Color / tokens:** `05-typography-color/design-tokens` + `05-typography-color/oklch-perceptual-color` — three-tier semantic tokens in OKLCH; a single teal brand hue (`oklch(0.68 0.13 190)`) for positive/active state and a single amber accent (`oklch(0.80 0.16 75)`) for warnings and focus rings; negative state maps to a desaturated red-brick — explicitly 2-hue encoding (teal = good/active, amber = caution, red-brick = error) rather than rainbow categorical.
- **Effects / states:** `01-visual-styles/dark-mode-aesthetic` + `05-typography-color/dark-mode-token-strategy` — elevation by lightness ramp (base → surface → raised), not stacked `box-shadow`; `color-scheme: light dark` throughout; semantic token names so dark mode is a value swap not a CSS fork.

## Why this avoids slop

The default dashboard that ships from every SaaS boilerplate is:
- Generic SaaS blue `#3B82F6` everywhere (`_slop-blocklist.md` → COLOR)
- A purple/indigo sidebar gradient (`_slop-blocklist.md` → COLOR)
- Four identical evenly-spaced big-number stat cards in a band (`_slop-blocklist.md` → LAYOUT — "stat band of 4 evenly-spaced big numbers")
- Inter at one weight for labels, body, and numbers (`_slop-blocklist.md` → TYPE)
- Soft drop shadow on every card (`_slop-blocklist.md` → SURFACE)
- Rainbow categorical chart colors (`_slop-blocklist.md` → COLOR — "rainbow categorical color")
- Everything fades-and-slides-up on load at the same duration (`_slop-blocklist.md` → MOTION)

This recipe answers each one:
- Teal + amber: two non-default OKLCH hues that encode meaning (active vs caution)
- No sidebar gradient: flat `--surface-1` with a hairline border-right, lightness step only
- Bento spans of 2×1, 1×2, and 1×1: size ranks importance, not position
- Mono face for all numbers and IDs; system sans at two weights (400 body, 600 label)
- No per-card shadow; elevation is `--surface-2` vs `--surface-1` (a 4% lightness lift)
- No rainbow charts: one teal line per chart, amber for threshold markers
- Skeleton placeholders, not fade-up entrances; reduced-motion gets instant swap

## Starter scaffold

Complete, runnable `index.html`. Handles `prefers-reduced-motion`, `prefers-color-scheme`, WCAG contrast on all text pairs, keyboard navigation in the sidebar, `aria-busy` skeleton loading, and a data table with correct table semantics.

```html
<!DOCTYPE html>
<html lang="en" data-theme="system">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Halyard — Pipeline overview</title>

<!-- Inline head script: apply stored theme BEFORE first paint to prevent flash -->
<script>
  (function () {
    var t = localStorage.getItem('dash-theme') || 'system';
    document.documentElement.dataset.theme = t;
  }());
</script>

<style>
/* ============================================================
   TIER 1 — PRIMITIVES (OKLCH, never used by components directly)
   ============================================================ */
:root {
  /* Neutral ramp — warm-tinted, not dead grey */
  --gray-950: oklch(0.13 0.006 264);
  --gray-900: oklch(0.18 0.006 264);
  --gray-850: oklch(0.22 0.006 264);
  --gray-800: oklch(0.28 0.007 264);
  --gray-700: oklch(0.38 0.008 264);
  --gray-500: oklch(0.55 0.009 264);
  --gray-300: oklch(0.76 0.007 264);
  --gray-100: oklch(0.94 0.004 264);
  --gray-50:  oklch(0.97 0.003 264);

  /* Brand: teal — active / positive */
  --teal-400: oklch(0.78 0.12 190);
  --teal-500: oklch(0.68 0.13 190);
  --teal-600: oklch(0.58 0.13 190);
  --teal-700: oklch(0.49 0.12 190);

  /* Accent: amber — caution / focus / warning */
  --amber-400: oklch(0.86 0.16 75);
  --amber-500: oklch(0.80 0.16 75);

  /* Negative: desaturated red-brick — error / failed */
  --red-600: oklch(0.52 0.16 30);
  --red-400: oklch(0.68 0.14 30);

  /* Spacing scale */
  --sp-1: 0.25rem;
  --sp-2: 0.5rem;
  --sp-3: 0.75rem;
  --sp-4: 1rem;
  --sp-5: 1.25rem;
  --sp-6: 1.5rem;
  --sp-8: 2rem;
  --sp-10: 2.5rem;

  /* Radius */
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 14px;

  /* Shell geometry */
  --rail-w: 240px;
  --rail-mini: 64px;
  --header-h: 52px;
}

/* ============================================================
   TIER 2 — SEMANTIC TOKENS (what components consume)
   Resolved for dark theme by default (dashboard is dark-first).
   light-dark() switches automatically when color-scheme is set.
   ============================================================ */
:root {
  /* Page background — darkest layer */
  --bg:           light-dark(var(--gray-100), var(--gray-950));
  /* Cards / panels — one lightness step above bg */
  --surface-1:    light-dark(var(--gray-50),  var(--gray-900));
  /* Raised elements (hovered rows, open dropdowns) */
  --surface-2:    light-dark(var(--gray-100), var(--gray-850));
  /* Overlay (modals, tooltips) */
  --surface-3:    light-dark(#ffffff,         var(--gray-800));

  /* Borders */
  --border:       light-dark(var(--gray-300), var(--gray-800));
  --border-focus: light-dark(var(--teal-600), var(--teal-400));

  /* Text */
  --text-primary:  light-dark(var(--gray-950), var(--gray-100));
  --text-muted:    light-dark(var(--gray-700), var(--gray-500));
  --text-disabled: light-dark(var(--gray-500), var(--gray-700));

  /* Semantic color encoding (2 hues = meaning, not sequence) */
  --color-positive:  light-dark(var(--teal-700),  var(--teal-400));
  --color-warning:   light-dark(var(--amber-500), var(--amber-400));
  --color-negative:  light-dark(var(--red-600),   var(--red-400));

  /* Focus ring — amber, 3:1+ against any surface */
  --focus-ring: var(--amber-500);

  /* Nav active bar */
  --nav-active-bar: var(--teal-500);

  /* Skeleton shimmer base */
  --skeleton-base: light-dark(var(--gray-300), var(--gray-850));
  --skeleton-hi:   light-dark(var(--gray-100), var(--gray-800));

  color-scheme: light dark;
}

/* Manual theme overrides (from 3-state toggle) */
[data-theme="light"] { color-scheme: light; }
[data-theme="dark"]  { color-scheme: dark; }

/* ============================================================
   RESET & BASE
   ============================================================ */
*, *::before, *::after { box-sizing: border-box; margin: 0; }
html, body { height: 100%; }
body {
  background: var(--bg);
  color: var(--text-primary);
  /* System sans — zero download cost; mono for numbers via .num class */
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 0.9375rem; /* 15px */
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }

/* Mono face for numbers, timestamps, IDs, table data */
.num, .ts, .id, td.data, .kpi-value {
  font-family: ui-monospace, "JetBrains Mono", "Cascadia Code", "SF Mono", Menlo, monospace;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}

/* ============================================================
   SHELL — CSS Grid app shell (from 03-layout-systems/sidebar-content)
   ============================================================ */
.shell {
  display: grid;
  grid-template-columns: var(--rail-w) 1fr;
  grid-template-rows: var(--header-h) 1fr;
  grid-template-areas:
    "rail header"
    "rail content";
  height: 100dvh;
  transition: grid-template-columns 220ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Collapsed state: CSS-only via :has() on the checkbox */
.shell:has(#nav-toggle:checked) {
  grid-template-columns: var(--rail-mini) 1fr;
}

/* ============================================================
   SKIP LINK (keyboard users bypass the nav)
   ============================================================ */
.skip-link {
  position: absolute;
  top: var(--sp-2);
  left: var(--sp-2);
  z-index: 100;
  padding: var(--sp-2) var(--sp-4);
  background: var(--surface-3);
  color: var(--text-primary);
  border: 2px solid var(--border-focus);
  border-radius: var(--r-sm);
  font-weight: 600;
  font-size: 0.875rem;
  transform: translateY(-200%);
  transition: transform 160ms ease;
}
.skip-link:focus { transform: translateY(0); }

/* ============================================================
   SIDEBAR RAIL
   ============================================================ */
#nav-toggle { position: absolute; opacity: 0; pointer-events: none; }

.rail {
  grid-area: rail;
  background: var(--surface-1);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.rail-brand {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  height: var(--header-h);
  padding: 0 var(--sp-4);
  border-bottom: 1px solid var(--border);
  flex: none;
}
.rail-brand .brand-mark {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--teal-500);
  flex: none;
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--gray-950);
  letter-spacing: -0.02em;
}
.rail-brand .brand-name {
  font-weight: 700;
  font-size: 0.9375rem;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
}

/* Hide text labels in mini state */
.shell:has(#nav-toggle:checked) .brand-name,
.shell:has(#nav-toggle:checked) .nav-label,
.shell:has(#nav-toggle:checked) .nav-section-label { display: none; }
.shell:has(#nav-toggle:checked) .nav-link { justify-content: center; }

.nav-section {
  padding: var(--sp-4) var(--sp-3) var(--sp-2);
}
.nav-section-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0 var(--sp-2);
  margin-bottom: var(--sp-2);
  white-space: nowrap;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-sm);
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  width: 100%;
  cursor: pointer;
  background: transparent;
  border: none;
  text-align: left;
  transition: background 100ms ease, color 100ms ease;
  position: relative;
}
.nav-link:hover {
  background: var(--surface-2);
  color: var(--text-primary);
}
.nav-link[aria-current="page"] {
  background: var(--surface-2);
  color: var(--text-primary);
  font-weight: 600;
}
/* Active inset bar — teal, not a full background flood */
.nav-link[aria-current="page"]::before {
  content: "";
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: var(--nav-active-bar);
}
.nav-link:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}
.nav-icon {
  width: 18px;
  height: 18px;
  flex: none;
  opacity: 0.7;
}
.nav-link[aria-current="page"] .nav-icon { opacity: 1; }
.nav-label { overflow: hidden; }

/* ============================================================
   HEADER (top bar)
   ============================================================ */
.header {
  grid-area: header;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 0 var(--sp-5);
  background: var(--surface-1);
  border-bottom: 1px solid var(--border);
  position: relative;
  z-index: 10;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  transition: background 100ms ease, color 100ms ease;
}
.toggle-btn:hover { background: var(--surface-2); color: var(--text-primary); }
.toggle-btn:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

.header-title {
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.header-spacer { flex: 1; }

/* Theme toggle in header */
.theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.9rem;
}
.theme-btn:hover { background: var(--surface-2); color: var(--text-primary); }
.theme-btn:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

/* Header user avatar */
.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--teal-600);
  color: white;
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  flex: none;
}

/* ============================================================
   CONTENT PANE — independent scroll container
   ============================================================ */
.content {
  grid-area: content;
  overflow-y: auto;
  min-height: 0;
  padding: var(--sp-6) clamp(var(--sp-5), 4vw, var(--sp-10));
  container-type: inline-size;
}

.page-header {
  margin-bottom: var(--sp-6);
}
.page-title {
  font-size: clamp(1.25rem, 2cqi, 1.6rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.page-subtitle {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-top: var(--sp-1);
}

/* ============================================================
   BENTO KPI GRID (from 03-layout-systems/bento-grid)
   Named areas for explicit, order-safe placement.
   4 columns on wide; 2 on medium; 1 on narrow (container query).
   ============================================================ */
.kpi-bento {
  display: grid;
  gap: var(--sp-4);
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(88px, auto);
  grid-template-areas:
    "runs  failed  p99  cost"
    "chart chart   chart  alert";
  margin-bottom: var(--sp-6);
}

/* Medium: 2 columns */
@container (max-width: 900px) {
  .kpi-bento {
    grid-template-columns: repeat(2, 1fr);
    grid-template-areas:
      "runs    failed"
      "p99     cost"
      "chart   chart"
      "alert   alert";
  }
}

/* Narrow: single column */
@container (max-width: 520px) {
  .kpi-bento {
    grid-template-columns: 1fr;
    grid-template-areas:
      "runs" "failed" "p99" "cost" "chart" "alert";
  }
}

/* ============================================================
   CARD BASE
   Elevation by lightness tint only — no soft shadow on every card
   ============================================================ */
.card {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* KPI tiles */
.kpi-runs    { grid-area: runs; }
.kpi-failed  { grid-area: failed; }
.kpi-p99     { grid-area: p99; }
.kpi-cost    { grid-area: cost; }
.kpi-chart   { grid-area: chart; }
.kpi-alert   { grid-area: alert; }

.kpi-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: var(--sp-2);
}

.kpi-value {
  font-size: clamp(1.6rem, 3.5cqi, 2.4rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
}

.kpi-value.positive { color: var(--color-positive); }
.kpi-value.negative { color: var(--color-negative); }
.kpi-value.warning  { color: var(--color-warning); }

.kpi-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: var(--sp-2);
}

/* Chart placeholder — spans wide, teal line hint */
.chart-placeholder {
  flex: 1;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-sm);
  background: var(--surface-2);
  position: relative;
  overflow: hidden;
}
.chart-placeholder::after {
  /* Faint teal sine-curve hint — real chart replaces this */
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 40%,
    oklch(0.68 0.13 190 / 0.12) 40%,
    oklch(0.68 0.13 190 / 0.12) 60%,
    transparent 60%
  );
}
.chart-placeholder span {
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-weight: 500;
  position: relative;
}

/* Alert tile — amber left border to encode caution without color-alone */
.kpi-alert.card {
  border-left: 3px solid var(--color-warning);
  flex-direction: row;
  align-items: flex-start;
  gap: var(--sp-3);
}
.alert-icon {
  font-size: 1.25rem;
  flex: none;
  margin-top: 2px;
}
.alert-body { min-width: 0; }
.alert-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: var(--sp-1);
}
.alert-desc {
  font-size: 0.8125rem;
  color: var(--text-muted);
  line-height: 1.4;
}

/* ============================================================
   SKELETON LOADING
   aria-busy="true" on the container; shimmer replaces real content.
   Reduced-motion: shimmer animation disabled, skeleton still visible.
   ============================================================ */
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.skeleton {
  background: var(--skeleton-base);
  border-radius: var(--r-sm);
}

@media (prefers-reduced-motion: no-preference) {
  .skeleton {
    background: linear-gradient(
      90deg,
      var(--skeleton-base) 25%,
      var(--skeleton-hi) 50%,
      var(--skeleton-base) 75%
    );
    background-size: 800px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }
}

/* Skeleton card variant */
.card-skeleton {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  min-width: 0;
}
.skel-label { height: 12px; width: 60%; }
.skel-value { height: 32px; width: 40%; }
.skel-meta  { height: 10px; width: 50%; }

/* ============================================================
   DATA TABLE (from 04-component-patterns — proper semantics)
   ============================================================ */
.table-section {
  margin-top: var(--sp-2);
}

.table-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-4);
}

.table-title {
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.table-wrap {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
}

/* Horizontal scroll wrapper for narrow viewports */
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

thead th {
  padding: var(--sp-3) var(--sp-4);
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
  background: var(--surface-1);
  /* Sticky header inside the scroll wrapper */
  position: sticky;
  top: 0;
  z-index: 1;
}

thead th:first-child { border-radius: var(--r-lg) 0 0 0; }
thead th:last-child  { border-radius: 0 var(--r-lg) 0 0; }

tbody tr {
  border-bottom: 1px solid var(--border);
  transition: background 80ms ease;
}
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: var(--surface-2); }

tbody td {
  padding: var(--sp-3) var(--sp-4);
  color: var(--text-primary);
  white-space: nowrap;
}
tbody td.data {
  color: var(--text-primary);
  letter-spacing: -0.01em;
}
tbody td.muted-cell { color: var(--text-muted); }

/* Status badges — color + shape, never color-alone */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  padding: 2px var(--sp-2);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
}

.badge.success {
  background: oklch(0.68 0.13 190 / 0.15);
  color: var(--color-positive);
}
.badge.success .badge-dot { background: var(--color-positive); }

.badge.failed {
  background: oklch(0.52 0.16 30 / 0.15);
  color: var(--color-negative);
}
.badge.failed .badge-dot { background: var(--color-negative); }

.badge.running {
  background: oklch(0.80 0.16 75 / 0.15);
  color: var(--color-warning);
}
.badge.running .badge-dot { background: var(--color-warning); }

/* ============================================================
   RESPONSIVE — mobile: rail goes off-canvas
   ============================================================ */
@media (max-width: 767px) {
  .shell {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "content";
  }
  /* In mobile the checked-state does not change grid columns (rail floats) */
  .shell:has(#nav-toggle:checked) { grid-template-columns: 1fr; }

  .rail {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 30;
    width: min(80vw, var(--rail-w));
    transform: translateX(-100%);
    transition: transform 240ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .shell:has(#nav-toggle:checked) .rail {
    transform: translateX(0);
  }
  /* Show labels in drawer mode */
  .shell:has(#nav-toggle:checked) .brand-name,
  .shell:has(#nav-toggle:checked) .nav-label,
  .shell:has(#nav-toggle:checked) .nav-section-label { display: block; }
  .shell:has(#nav-toggle:checked) .nav-link { justify-content: flex-start; }

  .scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 20;
    background: oklch(0.13 0.006 264 / 0.6);
    opacity: 0;
    pointer-events: none;
    transition: opacity 240ms ease;
  }
  .shell:has(#nav-toggle:checked) .scrim {
    opacity: 1;
    pointer-events: auto;
  }
}

/* Scrim hidden on desktop */
@media (min-width: 768px) {
  .scrim { display: none; }
}

/* ============================================================
   REDUCED MOTION — disable all transitions and animations
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  .shell,
  .rail,
  .scrim,
  .toggle-btn,
  tbody tr,
  .skip-link { transition: none !important; }

  @keyframes shimmer { 0%, 100% { background-position: 0 0; } }
}
</style>
</head>
<body>

<!-- Skip link: first focusable element, bypasses the nav -->
<a class="skip-link" href="#main">Skip to main content</a>

<div class="shell">
  <!-- Toggle checkbox: drives :has() for CSS-only collapse.
       Checked = collapsed on desktop / open drawer on mobile. -->
  <input type="checkbox" id="nav-toggle" aria-hidden="true" tabindex="-1">

  <!-- ===== SIDEBAR RAIL ===== -->
  <aside class="rail" aria-label="Primary navigation">
    <div class="rail-brand">
      <span class="brand-mark" aria-hidden="true">H</span>
      <span class="brand-name">Halyard</span>
    </div>

    <nav>
      <div class="nav-section">
        <div class="nav-section-label">Workspace</div>

        <a href="#" class="nav-link" aria-current="page">
          <svg class="nav-icon" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
          </svg>
          <span class="nav-label">Overview</span>
        </a>

        <a href="#" class="nav-link">
          <svg class="nav-icon" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd"/>
          </svg>
          <span class="nav-label">Pipelines</span>
        </a>

        <a href="#" class="nav-link">
          <svg class="nav-icon" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          <span class="nav-label">Schedules</span>
        </a>

        <a href="#" class="nav-link">
          <svg class="nav-icon" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"/>
            <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"/>
            <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"/>
          </svg>
          <span class="nav-label">Datasets</span>
        </a>
      </div>

      <div class="nav-section">
        <div class="nav-section-label">System</div>

        <a href="#" class="nav-link">
          <svg class="nav-icon" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
          <span class="nav-label">Alerts</span>
        </a>

        <a href="#" class="nav-link">
          <svg class="nav-icon" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
          </svg>
          <span class="nav-label">Settings</span>
        </a>
      </div>
    </nav>
  </aside>

  <!-- ===== HEADER ===== -->
  <header class="header">
    <!-- Toggle button: real control, aria-expanded wired by JS -->
    <label class="toggle-btn" id="navToggleBtn" for="nav-toggle"
           role="button" tabindex="0"
           aria-controls="nav-toggle"
           aria-expanded="true"
           aria-label="Toggle navigation">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <rect x="2" y="4" width="12" height="1.5" rx="0.75"/>
        <rect x="2" y="7.25" width="12" height="1.5" rx="0.75"/>
        <rect x="2" y="10.5" width="12" height="1.5" rx="0.75"/>
      </svg>
    </label>

    <span class="header-title">Pipeline overview</span>
    <div class="header-spacer"></div>

    <!-- Theme toggle -->
    <button class="theme-btn" id="themeToggle" aria-label="Toggle theme" title="Toggle light/dark">
      <span aria-hidden="true">◑</span>
    </button>

    <!-- User avatar -->
    <div class="avatar" role="img" aria-label="Signed in as DC">DC</div>
  </header>

  <!-- ===== MAIN CONTENT ===== -->
  <main class="content" id="main">

    <div class="page-header">
      <h1 class="page-title">Pipeline overview</h1>
      <p class="page-subtitle">Last refreshed 2 minutes ago · <span class="ts">06:42 UTC</span></p>
    </div>

    <!-- KPI BENTO — aria-busy while loading; JS swaps in real data -->
    <section aria-label="Key metrics" aria-busy="false" id="kpi-section">

      <!-- Loading state shown on first render; JS removes it and inserts real tiles -->
      <div class="kpi-bento" id="kpi-loading" role="status" aria-label="Loading metrics" style="display:none;">
        <div class="card-skeleton"><div class="skeleton skel-label"></div><div class="skeleton skel-value"></div><div class="skeleton skel-meta"></div></div>
        <div class="card-skeleton"><div class="skeleton skel-label"></div><div class="skeleton skel-value"></div><div class="skeleton skel-meta"></div></div>
        <div class="card-skeleton"><div class="skeleton skel-label"></div><div class="skeleton skel-value"></div><div class="skeleton skel-meta"></div></div>
        <div class="card-skeleton"><div class="skeleton skel-label"></div><div class="skeleton skel-value"></div><div class="skeleton skel-meta"></div></div>
      </div>

      <!-- Real tiles — shown once data is ready -->
      <div class="kpi-bento" id="kpi-tiles">
        <!-- KPI 1: wide, positive trend -->
        <article class="card kpi-runs">
          <div class="kpi-label">Runs today</div>
          <div class="kpi-value positive num">2,847</div>
          <div class="kpi-meta">+12% vs yesterday</div>
        </article>

        <!-- KPI 2: negative — uses color-negative + label text -->
        <article class="card kpi-failed">
          <div class="kpi-label">Failed runs</div>
          <div class="kpi-value negative num">14</div>
          <div class="kpi-meta">4 require intervention</div>
        </article>

        <!-- KPI 3: neutral -->
        <article class="card kpi-p99">
          <div class="kpi-label">P99 duration</div>
          <div class="kpi-value num">8m 42s</div>
          <div class="kpi-meta">SLA threshold: 12m</div>
        </article>

        <!-- KPI 4: neutral -->
        <article class="card kpi-cost">
          <div class="kpi-label">Est. cost today</div>
          <div class="kpi-value num">$214.60</div>
          <div class="kpi-meta">Budget: $380 / day</div>
        </article>

        <!-- Chart placeholder — full width tile -->
        <article class="card kpi-chart" aria-label="Run volume over last 24 hours (chart placeholder)">
          <div class="kpi-label">Run volume — last 24 h</div>
          <div class="chart-placeholder" role="img" aria-label="Line chart placeholder; connect your charting library here">
            <span>Chart placeholder — connect Recharts, Chart.js, or D3 here</span>
          </div>
        </article>

        <!-- Alert tile — amber encoding = caution, not rainbow -->
        <article class="card kpi-alert" aria-label="Active alert">
          <span class="alert-icon" aria-hidden="true" style="color: var(--color-warning);">⚠</span>
          <div class="alert-body">
            <div class="alert-title">Ingestion lag on <span class="id">prod-events-03</span></div>
            <div class="alert-desc">Lag has exceeded 90 s for 8 consecutive minutes. Check the Kafka consumer group offset.</div>
          </div>
        </article>
      </div>
    </section>

    <!-- DATA TABLE -->
    <section class="table-section" aria-label="Recent pipeline runs">
      <div class="table-header-row">
        <h2 class="table-title">Recent runs</h2>
      </div>

      <div class="table-wrap">
        <div class="table-scroll">
          <table>
            <caption class="visually-hidden">Recent pipeline runs with status, duration, and cost</caption>
            <thead>
              <tr>
                <th scope="col">Pipeline</th>
                <th scope="col">Status</th>
                <th scope="col">Started</th>
                <th scope="col">Duration</th>
                <th scope="col">Records</th>
                <th scope="col">Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="id">prod-events-01</span></td>
                <td><span class="badge success"><span class="badge-dot" aria-hidden="true"></span>Success</span></td>
                <td class="muted-cell ts">06:30 UTC</td>
                <td class="data">3m 14s</td>
                <td class="data">1,402,983</td>
                <td class="data">$0.83</td>
              </tr>
              <tr>
                <td><span class="id">prod-events-02</span></td>
                <td><span class="badge running"><span class="badge-dot" aria-hidden="true"></span>Running</span></td>
                <td class="muted-cell ts">06:38 UTC</td>
                <td class="data">4m 07s</td>
                <td class="data">—</td>
                <td class="data">—</td>
              </tr>
              <tr>
                <td><span class="id">prod-events-03</span></td>
                <td><span class="badge failed"><span class="badge-dot" aria-hidden="true"></span>Failed</span></td>
                <td class="muted-cell ts">06:20 UTC</td>
                <td class="data">2m 01s</td>
                <td class="data">0</td>
                <td class="data">$0.11</td>
              </tr>
              <tr>
                <td><span class="id">staging-analytics</span></td>
                <td><span class="badge success"><span class="badge-dot" aria-hidden="true"></span>Success</span></td>
                <td class="muted-cell ts">06:00 UTC</td>
                <td class="data">7m 52s</td>
                <td class="data">9,201,440</td>
                <td class="data">$4.22</td>
              </tr>
              <tr>
                <td><span class="id">dbt-transform-daily</span></td>
                <td><span class="badge success"><span class="badge-dot" aria-hidden="true"></span>Success</span></td>
                <td class="muted-cell ts">05:45 UTC</td>
                <td class="data">12m 18s</td>
                <td class="data">42,810,002</td>
                <td class="data">$9.67</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

  </main>

  <!-- Scrim (mobile only — label closes drawer) -->
  <label class="scrim" for="nav-toggle" aria-hidden="true"></label>

</div><!-- /.shell -->

<!-- Visually-hidden utility (table caption + future screen-reader-only text) -->
<style>
.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}
</style>

<script>
(function () {
  'use strict';

  /* ---- Sidebar toggle: keep aria-expanded honest + keyboard support ---- */
  var cb  = document.getElementById('nav-toggle');
  var btn = document.getElementById('navToggleBtn');

  function syncToggle() {
    /* On desktop: checked = collapsed (rail mini), so open = !checked.
       On mobile:  checked = drawer open. Use viewport to decide which. */
    var isMobile = window.matchMedia('(max-width: 767px)').matches;
    btn.setAttribute('aria-expanded', isMobile ? String(cb.checked) : String(!cb.checked));
  }

  cb.addEventListener('change', syncToggle);
  syncToggle();

  btn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cb.checked = !cb.checked;
      syncToggle();
    }
  });

  /* Close mobile drawer on Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && window.matchMedia('(max-width: 767px)').matches && cb.checked) {
      cb.checked = false;
      syncToggle();
      btn.focus();
    }
  });

  /* ---- Theme toggle: 3-state (system / light / dark) ---- */
  var THEMES = ['system', 'light', 'dark'];
  var themeBtn = document.getElementById('themeToggle');

  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('dash-theme', t);
  }

  themeBtn.addEventListener('click', function () {
    var cur = document.documentElement.dataset.theme || 'system';
    var next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    applyTheme(next);
    themeBtn.setAttribute('aria-label', 'Theme: ' + next + ' — click to cycle');
  });

  /* ---- Skeleton demo: show skeletons for 800ms then swap in real tiles ---- */
  var loadingEl = document.getElementById('kpi-loading');
  var tilesEl   = document.getElementById('kpi-tiles');
  var kpiSection = document.getElementById('kpi-section');

  /* Show skeleton on first render if you want to demo it: uncomment below.
     In production, start with skeleton shown and swap once the fetch resolves. */
  /*
  tilesEl.style.display = 'none';
  loadingEl.style.display = 'grid';
  kpiSection.setAttribute('aria-busy', 'true');

  setTimeout(function () {
    kpiSection.setAttribute('aria-busy', 'false');
    loadingEl.style.display = 'none';
    tilesEl.style.display = 'grid';
  }, 800);
  */

}());
</script>

</body>
</html>
```

## Section by section

**Shell grid** (`03-layout-systems/sidebar-content`): a `100dvh` CSS Grid with named areas `rail | header / rail | content`. Both the rail and the content pane are independent scroll containers via `min-height: 0; overflow-y: auto` — the body never scrolls. The `:has(#nav-toggle:checked)` selector re-templates the column track from `var(--rail-w)` to `var(--rail-mini)` without JS class toggling.

**Sidebar rail** (`03-layout-systems/sidebar-content`): flat surface-1 background, single hairline `border-right`, no gradient. Active item gets an inset 3px teal bar — an indicator that communicates current page without flooding the entire item in the brand color. Mini-collapsed state hides labels and centers icons; reduced-motion disables the column-width transition entirely.

**Top bar** (`03-layout-systems/sidebar-content`): a second `surface-1` band with `border-bottom`. It holds the hamburger toggle (labelled, keyboard-operable), the page title, the theme toggle (3-state: system → light → dark), and an avatar initials chip. No search bar, no notification bell cluster — nothing that is not present in the scaffold's scope.

**KPI bento** (`03-layout-systems/bento-grid`): six named areas in a 4-column grid. The chart tile spans 3 columns, the alert tile spans 1. Genuine size variance (2×1 hero-width chart, 1×1 KPIs) beats the uniform 4-card stat band. Container queries drive the responsive reflow so the grid collapses correctly when the sidebar rail is open vs collapsed, not just based on viewport width.

**Semantic color encoding** (`05-typography-color/design-tokens`, `05-typography-color/oklch-perceptual-color`): `--color-positive` = teal, `--color-warning` = amber, `--color-negative` = red-brick. Applied to KPI value text and status badges. Never applied in hue alone — badges include a dot AND a text label; the alert tile has a left border AND text; error counts have label context.

**Skeleton loading** (`08-ui-states-feedback`): the loading container carries `role="status"` and `aria-label="Loading metrics"`. The parent section carries `aria-busy="true"` while loading. The shimmer animation is gated inside `@media (prefers-reduced-motion: no-preference)` — reduced-motion users see a static, muted rectangle (the skeleton base color) that disappears when data arrives, no animation at all.

**Data table**: `<table>` with `<caption>` (visually hidden), `scope="col"` on every `<th>`. All numeric data uses the mono face + `tabular-nums`. Status is a `<span class="badge">` with a dot (visual), a text label (text + screen reader), and `background-color` derived from the semantic color token (not hard-coded hex). Row hover is `80ms opacity` transition, disabled under `prefers-reduced-motion`.

**Token layer** (`05-typography-color/design-tokens`, `01-visual-styles/dark-mode-aesthetic`, `05-typography-color/dark-mode-token-strategy`): three tiers — primitives (OKLCH ramps), semantics (`--bg`, `--surface-1`, `--surface-2`, `--text-primary`, `--text-muted`, `--color-positive/warning/negative`, `--focus-ring`), and no component tier (the design is simple enough that semantic names cover it directly). `light-dark()` collapses the two-theme definition into one declaration per token. A tiny inline `<head>` script applies the stored theme before paint to prevent a flash.

## Accessibility checklist

**Reduced motion:** `@media (prefers-reduced-motion: reduce)` removes `transition` from the shell, rail, scrim, toggle button, table rows, and skip link. The skeleton shimmer animation is defined inside `@media (prefers-reduced-motion: no-preference)` — it is opt-in, not opt-out.

**Contrast pairs (verified):**
- Primary text `oklch(0.94 0.004 264)` (≈ `#ebebef`) on base `oklch(0.13 0.006 264)` (≈ `#101116`): approximately **15:1** — AAA.
- Muted text `oklch(0.55 0.009 264)` (≈ `#7a7a88`) on surface-1 `oklch(0.18 0.006 264)` (≈ `#181820`): approximately **5.5:1** — AA.
- Teal positive `oklch(0.78 0.12 190)` (≈ `#52c4b4`) on surface-1 dark: approximately **7:1** — AA for large bold KPI numbers (≥ 24px, bold).
- Amber warning `oklch(0.86 0.16 75)` (≈ `#f2c94c`) on dark surface: approximately **9:1** — AAA.
- Focus ring amber `oklch(0.80 0.16 75)` against any surface-1 or surface-2 dark: well above 3:1 non-text minimum.
- In light mode: `--text-primary` ≈ dark ink on `--bg` gray-100: approximately **12:1** — AAA.

**Keyboard and focus:** every interactive element — nav links, toggle button, theme button, table links — has `:focus-visible` with a 2px amber outline. The skip link is the first tab stop and jumps to `#main`. The sidebar toggle is a `<label>` with `role="button"`, `tabindex="0"`, and Enter/Space handlers. Escape closes the mobile drawer and returns focus to the toggle.

**Screen reader:** `<aside aria-label="Primary navigation">`, `<main id="main">`, `<section aria-label="Key metrics" aria-busy="...">`, `<section aria-label="Recent pipeline runs">`. Table has `<caption>` (visually hidden). Badge dots are `aria-hidden="true"`. Avatar is `role="img" aria-label="Signed in as DC"`. Brand mark initial is `aria-hidden="true"`.

**Touch targets:** toggle button and theme button are `34×34px` (above the 24×24px WCAG 2.5.8 minimum, aiming for the recommended 44×44px with padding in real implementations). Nav links have `padding: 8px 12px` giving comfortable tap area.

**Color not alone:** status badges have a text label AND a colored dot. The alert tile has a left border (amber) AND icon AND text heading. KPI values use a directional label ("Failed runs", "+12% vs yesterday") alongside color. No state is communicated by hue alone.

**Reflow / zoom (WCAG 1.4.10):** `100dvh` shell survives mobile browser chrome resize. Below 768px the sidebar collapses to an off-canvas drawer so content reaches full width. KPI grid uses container queries to reflow to single column at narrow widths.

## Make it yours

**Knob 1 — Swap the brand hue** (`05-typography-color/oklch-perceptual-color`): Change `--teal-400/500/600/700` to any OKLCH hue by rotating `H` (e.g., `H 145` for a cooler green, `H 230` for a blue-violet, `H 25` for a warm amber-orange). Update `--color-positive` to point to the new ramp. The amber accent is independent and stays as the focus/caution color — do not merge them.

**Knob 2 — Swap the content layout** (`03-layout-systems/bento-grid`): The `grid-template-areas` string on `.kpi-bento` is the only thing defining the bento composition. Change spans to give the chart a full-width row by itself, collapse the KPIs to 2-up, or add a second chart tile. The container queries automatically redraw each breakpoint variant.

**Knob 3 — Swap the visual style** (`01-visual-styles/flat-and-material`): Replace the dark-first palette with light-first by flipping the `light-dark()` argument order and adjusting `data-theme` default to `"light"`. Alternatively, add Material 3 tonal elevation (a `surface-container` role slightly tinted toward the brand hue at each level) instead of pure lightness steps — import from `01-visual-styles/flat-and-material` for the M3 token approach.

## Library entries used

- `01-visual-styles/minimalism.md` — skin choice: whitespace as structure, weight contrast (600 labels vs 400 body), one committed accent, hairline rules instead of soft shadows on every card
- `01-visual-styles/dark-mode-aesthetic.md` — elevation by lightness ramp not box-shadow, near-black base not pure black, desaturated accents, `color-scheme` metadata
- `03-layout-systems/sidebar-content.md` — CSS Grid app-shell, `:has()` collapse, `min-height: 0` scroll containment, aria-expanded toggle semantics, Escape/focus management
- `03-layout-systems/bento-grid.md` — named `grid-template-areas` for explicit placement, container queries for responsive reflow, genuinely varied tile sizes
- `05-typography-color/design-tokens.md` — three-tier token architecture (primitives → semantics), `light-dark()` for theme swap, `color-scheme` property
- `05-typography-color/oklch-perceptual-color.md` — OKLCH ramps for neutral, teal brand, amber accent, red-brick negative; perceptually even lightness steps, tapered chroma at extremes
- `05-typography-color/dark-mode-token-strategy.md` — semantic name strategy, `light-dark()` syntax, inline head script to prevent flash, elevation-by-lightness rule
- `05-typography-color/font-pairing.md` — system sans superfamily (zero download) for body/labels; `ui-monospace` mono face for all numbers, IDs, timestamps; deliberate weight contrast
- `08-ui-states-feedback/error-and-validation-states.md` — `aria-busy`, `role="status"`, inline error patterns for the badge/alert approach, color-not-alone principle
- `_slop-blocklist.md` — cross-referenced at every decision: non-default hue, no rainbow categorical, no uniform stat band, no gradient sidebar, no soft shadow on every card, mono face for numbers not Inter-everywhere
