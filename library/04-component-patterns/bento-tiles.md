# Bento tiles

> A grid of varied-span rectangular tiles — each holding a single content type (stat, media, mini-chart, or action) — that together form a cohesive feature surface through size contrast, per-tile accent, and a shared underlying grid rhythm.

**Bucket:** component
**Maturity:** current
**Effort:** medium
**Best for:** websites, portfolios, dashboards, apps

## What it is

Bento tiles borrow the compartmentalised logic of a Japanese bento box: a rigid grid subdivides into distinctly sized cells, each self-contained yet visually unified by consistent gap, corner-radius, and surface language. The user perceives a mosaic of information — a large hero tile anchors the eye, secondary tiles provide supporting detail, and small utility tiles fill corners without demanding equal attention. Crucially, no two tiles need the same content type; a stat lives beside a looping video beside a sparkline beside a plain testimonial, and the grid holds them together. Popularised by Apple product pages (~2023–24) and now standard in SaaS feature sections and dashboards, bento differs from a plain card grid in that tiles intentionally span multiple columns or rows to create deliberate visual weight.

## When to use

- Feature sections that must communicate four to ten product capabilities without equal-weight icon-blurb cards.
- Portfolio and case-study pages where mixing image tiles, metric tiles, and quote tiles creates editorial rhythm.
- SaaS marketing pages following the Apple/Stripe/Notion playbook: show the product interface inside a tile rather than describing it.
- App dashboards where each KPI, chart, or action lives in its own resizable widget surface.
- Anywhere you need to break the "hero + three identical cards" layout pattern (see Anti-slop).

## When NOT to use

- Sequential, linear narratives — when content must be read top-to-bottom in strict order, arbitrary span sizes confuse the reading path.
- Dense text content: tiles are for one digestible piece per cell; putting four paragraphs inside a 2×2 tile destroys both the aesthetic and readability.
- Simple lists of five or more equivalent items — a plain `<ul>` or equal-column card grid is less confusing and faster to scan.
- When the content truly has no hierarchy: forcing bento on flat data makes the large tile feel arbitrarily promoted.
- Overused pattern: everyone building an AI SaaS landing page in 2024–25 reached for bento by default. If your product has one core feature, a focused hero is stronger. Do not use bento to pad thin content.

## How it works

A 12-column CSS grid (or a simpler 4-column variant) provides the invisible scaffold. Individual tiles use `grid-column: span N` and `grid-row: span N` to occupy multiple cells. `grid-auto-flow: dense` fills gaps left by large tiles with smaller ones, eliminating awkward whitespace without manual placement.

Each tile is an independent component with its own surface colour, border-radius, and padding — the grid gap (typically 12–20 px) acts as the visual mortar. Per-tile accent is applied via a CSS custom property (`--tile-accent`) set inline, so every tile can carry a distinct hue from a shared palette without duplicating selector trees.

For interactive tiles (those that link somewhere or trigger a modal), the APG layout-grid pattern applies: the tile grid carries `role="grid"`, each tile row is `role="row"`, and each tile is `role="gridcell"`. Arrow keys navigate between tiles, Tab enters/exits the grid, and `Enter`/`Space` activate the focused tile. Only one tile is in the tab sequence at a time (roving tabindex), which keeps the page tab-stop count manageable.

Key CSS properties:
- `display: grid` + `grid-template-columns: repeat(12, minmax(0, 1fr))` — fluid 12-column base
- `grid-auto-flow: dense` — backfills gaps automatically
- `grid-column: span N` / `grid-row: span N` — tile sizing
- `container-type: inline-size` on each tile — enables per-tile container queries so internal layout adapts to the tile's own size, not the viewport
- `contain: layout paint` on each tile — isolates reflow and clip to the tile boundary
- `will-change: transform` only on tiles that animate on hover, removed after animation via JS

## Working code

### Vanilla HTML + CSS (self-contained, no dependencies)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bento tiles — working example</title>
  <style>
    /* ─── Reset & tokens ────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --gap: 14px;
      --radius: 18px;
      --surface-base: #0f172a;  /* luminance 0.0162 */
      --surface-tile: #1e293b;  /* luminance 0.0331 */
      --text-primary: #f8f7f4;  /* contrast on --surface-tile: 14.63:1 PASS AA */
      --text-muted: #94a3b8;    /* contrast on --surface-tile: 4.55:1 PASS AA */
      /* Per-tile accent custom property — overridden inline */
      --tile-accent: #334155;
    }

    body {
      background: var(--surface-base);
      color: var(--text-primary);
      font-family: "Satoshi", "General Sans", system-ui, sans-serif;
      min-height: 100vh;
      padding: clamp(24px, 5vw, 64px);
    }

    /* ─── Grid scaffold ─────────────────────────────────────── */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      grid-auto-rows: 90px;
      grid-auto-flow: dense;
      gap: var(--gap);
    }

    /* ─── Tile base ─────────────────────────────────────────── */
    .tile {
      background: var(--tile-accent, var(--surface-tile));
      border-radius: var(--radius);
      padding: 24px;
      contain: layout paint;
      container-type: inline-size;
      container-name: tile;
      overflow: hidden;
      position: relative;
      /* Default: 3 cols × 2 rows */
      grid-column: span 3;
      grid-row: span 2;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* ─── Span variants ─────────────────────────────────────── */
    .tile--hero   { grid-column: span 6; grid-row: span 4; }
    .tile--wide   { grid-column: span 6; grid-row: span 2; }
    .tile--tall   { grid-column: span 3; grid-row: span 4; }
    .tile--small  { grid-column: span 3; grid-row: span 2; }

    /* ─── Interactive tile states ───────────────────────────── */
    .tile[data-interactive] {
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
                  box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    @media (hover: hover) and (pointer: fine) {
      .tile[data-interactive]:hover {
        transform: translateY(-3px) scale(1.01);
        box-shadow: 0 16px 40px rgba(0,0,0,0.35);
      }
    }

    /* Focus ring — WCAG 2.4.11 compliant: 2px offset, 3:1+ against neighbour */
    .tile[data-interactive]:focus-visible {
      outline: 3px solid var(--text-primary);
      outline-offset: 3px;
    }

    /* Reduced motion: suppress transform, keep opacity shift */
    @media (prefers-reduced-motion: reduce) {
      .tile[data-interactive] {
        transition: opacity 120ms linear;
      }
      @media (hover: hover) and (pointer: fine) {
        .tile[data-interactive]:hover {
          transform: none;
          box-shadow: none;
          opacity: 0.85;
        }
      }
    }

    /* ─── Tile labels ───────────────────────────────────────── */
    .tile__eyebrow {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted); /* 4.55:1 on #1e293b — PASS AA */
      line-height: 1;
    }

    .tile__title {
      font-size: clamp(1rem, 3cqi, 1.5rem);
      font-weight: 700;
      line-height: 1.15;
      color: var(--text-primary);
    }

    .tile__body {
      font-size: clamp(0.8rem, 2.5cqi, 0.9rem);
      line-height: 1.55;
      color: var(--text-muted);
      flex: 1;
    }

    /* ─── Stat tile ─────────────────────────────────────────── */
    .stat-number {
      font-size: clamp(2rem, 8cqi, 3.5rem);
      font-weight: 800;
      line-height: 1;
      letter-spacing: -0.03em;
      color: var(--text-primary);
    }

    .stat-delta {
      font-size: 0.8rem;
      font-weight: 600;
      color: #4ade80; /* #4ade80 on #0c4a6e (stat tile accent): ~4.87:1 PASS AA */
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* ─── Sparkline tile ────────────────────────────────────── */
    .sparkline-svg {
      width: 100%;
      height: 48px;
      overflow: visible;
      margin-top: auto;
    }

    .sparkline-line {
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }

    .sparkline-area {
      opacity: 0.15;
    }

    /* ─── Media tile ────────────────────────────────────────── */
    .tile__media {
      position: absolute;
      inset: 0;
      z-index: 0;
    }

    .tile__media img,
    .tile__media video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
      display: block;
    }

    .tile__media-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(15,23,42,0.9) 30%, transparent 70%);
      z-index: 1;
    }

    .tile__media ~ * {
      position: relative;
      z-index: 2;
    }

    /* ─── Accent badge ──────────────────────────────────────── */
    .tile__badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.12);
      border-radius: 100px;
      padding: 4px 12px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-primary);
      width: fit-content;
    }

    /* ─── Responsive reflow ─────────────────────────────────── */
    @media (max-width: 900px) {
      .bento-grid {
        grid-template-columns: repeat(6, minmax(0, 1fr));
      }
      /* Hero keeps 6-col span (full width at 6-col grid) */
      .tile--hero  { grid-column: span 6; grid-row: span 4; }
      .tile--wide  { grid-column: span 6; grid-row: span 2; }
      .tile--tall  { grid-column: span 3; grid-row: span 4; }
      .tile--small { grid-column: span 3; grid-row: span 2; }
    }

    @media (max-width: 560px) {
      .bento-grid {
        grid-template-columns: repeat(2, 1fr);
        grid-auto-rows: 160px;
      }
      /* All tiles become full-width stacked on very small screens */
      .tile, .tile--hero, .tile--wide,
      .tile--tall, .tile--small {
        grid-column: span 2;
        grid-row: span 2;
      }
    }
  </style>
</head>
<body>

<!--
  ARIA layout-grid pattern (APG):
  role="grid" on wrapper → role="row" on each row group → role="gridcell" on each tile.
  Roving tabindex: only the currently focused tile has tabindex="0".
  Arrow keys navigate; Tab exits the grid entirely.
-->
<section aria-labelledby="features-heading">
  <h2 id="features-heading" style="margin-bottom:24px;font-size:clamp(1.5rem,4vw,2.5rem);font-weight:800;">
    Everything your workflow needs
  </h2>

  <div class="bento-grid" role="grid" aria-label="Product features">

    <!-- Row 1: hero + two smalls -->
    <div role="row" style="display:contents;">

      <!-- Hero tile (6×4) — interactive link tile -->
      <a href="#" class="tile tile--hero"
         role="gridcell"
         tabindex="0"
         data-interactive
         aria-label="Real-time pipeline — see how live data flows">
        <div class="tile__media" aria-hidden="true">
          <!-- Replace src with real image; alt="" because aria-label on tile covers it -->
          <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80"
               alt=""
               loading="lazy"
               decoding="async">
          <div class="tile__media-overlay"></div>
        </div>
        <span class="tile__eyebrow">Core feature</span>
        <h3 class="tile__title">Real-time pipeline</h3>
        <p class="tile__body">Events land in your dashboard within 200 ms of hitting our ingestion API — no polling, no stale reads.</p>
        <span class="tile__badge">
          <span aria-hidden="true">→</span> Watch the demo
        </span>
      </a>

      <!-- Stat tile: active users -->
      <!-- #0c4a6e surface; white (#f8f7f4) text on #0c4a6e: 11.37:1 PASS AA -->
      <div class="tile tile--small"
           style="--tile-accent:#0c4a6e;"
           role="gridcell"
           tabindex="-1">
        <span class="tile__eyebrow">Active users</span>
        <span class="stat-number" aria-label="14,300 active users">14.3k</span>
        <span class="stat-delta" aria-label="Up 18 percent this week">
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2l4 5H2l4-5z" fill="currentColor"/>
          </svg>
          +18% this week
        </span>
      </div>

      <!-- Stat tile: uptime -->
      <!-- #14532d surface; white (#f8f7f4) text on #14532d: 9.23:1 PASS AA -->
      <div class="tile tile--small"
           style="--tile-accent:#14532d;"
           role="gridcell"
           tabindex="-1">
        <span class="tile__eyebrow">Uptime</span>
        <span class="stat-number" aria-label="99.97 percent uptime">99.97%</span>
        <p class="tile__body" style="color:#86efac;">30-day rolling</p>
      </div>

    </div><!-- /row 1 -->

    <!-- Row 2: sparkline + tall feature + wide quote -->
    <div role="row" style="display:contents;">

      <!-- Sparkline tile (3×2) -->
      <div class="tile tile--small"
           style="--tile-accent:#1e293b;"
           role="gridcell"
           tabindex="-1">
        <span class="tile__eyebrow">API calls · last 7 days</span>
        <span class="stat-number" aria-label="2.4 million">2.4M</span>

        <!--
          SVG sparkline — role="img" + aria-labelledby for screen reader.
          Points represent Mon–Sun call volumes (normalised to 0-40px range).
        -->
        <svg class="sparkline-svg"
             role="img"
             aria-labelledby="sparkline-title sparkline-desc"
             viewBox="0 0 200 48"
             preserveAspectRatio="none">
          <title id="sparkline-title">API call volume trend</title>
          <desc id="sparkline-desc">
            Line chart showing increasing API call volume over 7 days,
            from approximately 1.8 million on Monday to 2.4 million on Sunday.
          </desc>
          <!-- Area fill -->
          <path class="sparkline-area"
                fill="#38bdf8"
                d="M0,38 L28,30 L56,34 L84,22 L112,18 L140,12 L168,8 L200,4 L200,48 L0,48 Z"/>
          <!-- Line -->
          <path class="sparkline-line"
                stroke="#38bdf8"
                d="M0,38 L28,30 L56,34 L84,22 L112,18 L140,12 L168,8 L200,4"/>
          <!-- Terminal dot -->
          <circle cx="200" cy="4" r="4" fill="#38bdf8"/>
        </svg>
      </div>

      <!-- Tall feature tile (3×4) — interactive -->
      <!-- #312e81 surface; white (#f8f7f4) text on #312e81: 8.04:1 PASS AA -->
      <a href="#"
         class="tile tile--tall"
         style="--tile-accent:#312e81;"
         role="gridcell"
         tabindex="-1"
         data-interactive
         aria-label="Smart alerting — explore threshold configuration">
        <span class="tile__eyebrow">Alerting</span>
        <h3 class="tile__title">Smart threshold detection</h3>
        <p class="tile__body">
          Anomaly alerts that learn your baseline — no more 3 am pages for expected traffic spikes.
        </p>
        <!-- Decorative icon, aria-hidden -->
        <svg aria-hidden="true"
             style="margin-top:auto;width:48px;height:48px;color:#818cf8;"
             viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.15"/>
          <path d="M24 12v4M24 32v4M12 24h4M32 24h4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="24" cy="24" r="6" stroke="currentColor" stroke-width="2.5"/>
        </svg>
      </a>

      <!-- Wide quote tile (6×2) -->
      <div class="tile tile--wide"
           style="--tile-accent:#1c1917;"
           role="gridcell"
           tabindex="-1">
        <span class="tile__eyebrow">Customer story</span>
        <blockquote>
          <p class="tile__title" style="font-weight:500;font-size:clamp(0.95rem,2.5cqi,1.25rem);font-style:italic;">
            "We cut our incident response time from 40 minutes to under 4. That's not a typo."
          </p>
          <footer style="margin-top:8px;font-size:0.8rem;color:#94a3b8;">
            — Priya Mehta, Head of Platform Engineering, Cascade Labs
          </footer>
        </blockquote>
      </div>

    </div><!-- /row 2 -->

  </div><!-- /.bento-grid -->
</section>

<script>
(function () {
  'use strict';

  /* ─── Roving tabindex for layout-grid keyboard nav (APG) ─── */
  const grid = document.querySelector('[role="grid"]');
  if (!grid) return;

  const getTiles = () => Array.from(grid.querySelectorAll('[role="gridcell"]'));

  function focusTile(tile) {
    getTiles().forEach(t => t.setAttribute('tabindex', '-1'));
    tile.setAttribute('tabindex', '0');
    tile.focus();
  }

  grid.addEventListener('keydown', function (e) {
    const tiles = getTiles();
    const current = document.activeElement;
    const idx = tiles.indexOf(current);
    if (idx === -1) return;

    // Build a logical column count from the grid's computed style
    const cols = getComputedStyle(grid)
      .gridTemplateColumns.split(' ').length;

    let next = -1;

    switch (e.key) {
      case 'ArrowRight':
        next = Math.min(idx + 1, tiles.length - 1);
        break;
      case 'ArrowLeft':
        next = Math.max(idx - 1, 0);
        break;
      case 'ArrowDown':
        next = Math.min(idx + cols, tiles.length - 1);
        break;
      case 'ArrowUp':
        next = Math.max(idx - cols, 0);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = tiles.length - 1;
        break;
      default:
        return; // let other keys through
    }

    if (next !== -1 && next !== idx) {
      e.preventDefault();
      focusTile(tiles[next]);
    }
  });

  /* Interactive tiles: activate on Enter/Space */
  getTiles().forEach(tile => {
    if (!tile.hasAttribute('data-interactive')) return;
    tile.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tile.click();
      }
    });
  });

  /* Hover animation — only on pointer:fine devices */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-interactive]').forEach(tile => {
      tile.addEventListener('mouseenter', () => {
        tile.style.willChange = 'transform';
      });
      tile.addEventListener('mouseleave', () => {
        // Remove will-change after transition ends to free GPU layer
        tile.addEventListener('transitionend', () => {
          tile.style.willChange = '';
        }, { once: true });
      });
    });
  }
})();
</script>
</body>
</html>
```

### React + Tailwind (Motion library) — production variant

Install: `npm install motion` (the 2025 rename of framer-motion; import path is `motion/react`).

```jsx
// BentoGrid.jsx
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/* ─── Tile data ─────────────────────────────────────────────── */
const TILES = [
  {
    id: "hero",
    span: "md:col-span-6 md:row-span-4",
    accent: "#0c4a6e",
    interactive: true,
    href: "#demo",
    label: "Real-time pipeline — see how live data flows",
    type: "media",
    eyebrow: "Core feature",
    title: "Real-time pipeline",
    body: "Events land in your dashboard within 200 ms of hitting our ingestion API — no polling, no stale reads.",
    imgSrc: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80",
  },
  {
    id: "stat-users",
    span: "col-span-2 md:col-span-3 md:row-span-2",
    accent: "#0c4a6e",
    type: "stat",
    eyebrow: "Active users",
    statValue: "14.3k",
    statAriaLabel: "14,300 active users",
    delta: "+18% this week",
    deltaPositive: true,
  },
  {
    id: "stat-uptime",
    span: "col-span-2 md:col-span-3 md:row-span-2",
    accent: "#14532d",
    type: "stat",
    eyebrow: "Uptime",
    statValue: "99.97%",
    statAriaLabel: "99.97 percent uptime",
    body: "30-day rolling",
  },
  {
    id: "sparkline",
    span: "col-span-2 md:col-span-3 md:row-span-2",
    accent: "#0f172a",
    type: "sparkline",
    eyebrow: "API calls · last 7 days",
    statValue: "2.4M",
    statAriaLabel: "2.4 million API calls",
    // Normalised y-values (0=top, 48=bottom in SVG coords)
    points: [38, 30, 34, 22, 18, 12, 8, 4],
  },
  {
    id: "tall-feature",
    span: "col-span-2 md:col-span-3 md:row-span-4",
    accent: "#312e81",
    interactive: true,
    href: "#alerting",
    label: "Smart alerting — explore threshold configuration",
    type: "feature",
    eyebrow: "Alerting",
    title: "Smart threshold detection",
    body: "Anomaly alerts that learn your baseline — no more 3 am pages for expected traffic spikes.",
  },
  {
    id: "quote",
    span: "col-span-4 md:col-span-6 md:row-span-2",
    accent: "#1c1917",
    type: "quote",
    eyebrow: "Customer story",
    quote:
      '"We cut our incident response time from 40 minutes to under 4. That\'s not a typo."',
    attribution: "Priya Mehta, Head of Platform Engineering, Cascade Labs",
  },
];

/* ─── Sparkline helper ──────────────────────────────────────── */
function Sparkline({ points, color = "#38bdf8" }) {
  const w = 200, h = 48;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const pathD = points.map((y, i) => `${i === 0 ? "M" : "L"}${xs[i]},${y}`).join(" ");
  const areaD = `${pathD} L${w},${h} L0,${h} Z`;
  return (
    <svg
      className="w-full mt-auto"
      style={{ height: h }}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      role="img"
      aria-labelledby="sp-title sp-desc"
    >
      <title id="sp-title">API call volume trend</title>
      <desc id="sp-desc">
        Line chart showing increasing API call volume over 7 days, from roughly
        1.8 million on Monday to 2.4 million on Sunday.
      </desc>
      <path d={areaD} fill={color} opacity={0.15} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={xs.at(-1)} cy={points.at(-1)} r={4} fill={color} />
    </svg>
  );
}

/* ─── Single tile ───────────────────────────────────────────── */
function Tile({ tile, tabIndex, onFocus }) {
  const shouldReduceMotion = useReducedMotion();

  const hoverAnim = shouldReduceMotion
    ? { opacity: 0.85 }
    : { y: -3, scale: 1.012, boxShadow: "0 16px 40px rgba(0,0,0,0.35)" };

  const transition = {
    duration: 0.22,
    ease: [0.16, 1, 0.3, 1], // custom expo-out — not default ease
  };

  const Tag = tile.interactive ? motion.a : motion.div;

  return (
    <Tag
      className={`relative flex flex-col gap-2 overflow-hidden rounded-[18px] p-6 ${tile.span}`}
      style={{ background: tile.accent, "--tile-accent": tile.accent }}
      role="gridcell"
      tabIndex={tabIndex}
      onFocus={onFocus}
      {...(tile.interactive && {
        href: tile.href,
        "aria-label": tile.label,
        whileHover: hoverAnim,
        whileFocus: hoverAnim,
        transition,
      })}
    >
      {tile.type === "media" && (
        <>
          <div className="absolute inset-0 z-0" aria-hidden="true">
            <img
              src={tile.imgSrc}
              alt=""
              className="w-full h-full object-cover object-top"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,23,42,0.9)] via-transparent to-transparent" />
          </div>
          <span className="relative z-10 text-[0.7rem] font-semibold tracking-widest uppercase text-slate-400">
            {tile.eyebrow}
          </span>
          <h3 className="relative z-10 text-xl font-bold leading-tight text-white">
            {tile.title}
          </h3>
          <p className="relative z-10 text-sm leading-relaxed text-slate-300 flex-1">
            {tile.body}
          </p>
          <span className="relative z-10 inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-xs font-semibold text-white w-fit">
            <span aria-hidden="true">→</span> Watch the demo
          </span>
        </>
      )}

      {tile.type === "stat" && (
        <>
          <span className="text-[0.7rem] font-semibold tracking-widest uppercase text-slate-400">
            {tile.eyebrow}
          </span>
          <span
            className="text-[clamp(2rem,8cqi,3.5rem)] font-extrabold leading-none tracking-tight text-white"
            aria-label={tile.statAriaLabel}
          >
            {tile.statValue}
          </span>
          {tile.delta && (
            <span className="flex items-center gap-1 text-sm font-semibold text-green-400" aria-label={tile.delta}>
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2l4 5H2l4-5z" fill="currentColor" />
              </svg>
              {tile.delta}
            </span>
          )}
          {tile.body && (
            <p className="text-sm text-green-300">{tile.body}</p>
          )}
        </>
      )}

      {tile.type === "sparkline" && (
        <>
          <span className="text-[0.7rem] font-semibold tracking-widest uppercase text-slate-400">
            {tile.eyebrow}
          </span>
          <span
            className="text-[clamp(2rem,8cqi,3rem)] font-extrabold leading-none tracking-tight text-white"
            aria-label={tile.statAriaLabel}
          >
            {tile.statValue}
          </span>
          <Sparkline points={tile.points} />
        </>
      )}

      {tile.type === "feature" && (
        <>
          <span className="text-[0.7rem] font-semibold tracking-widest uppercase text-slate-400">
            {tile.eyebrow}
          </span>
          <h3 className="text-xl font-bold leading-tight text-white">{tile.title}</h3>
          <p className="text-sm leading-relaxed text-slate-300 flex-1">{tile.body}</p>
          <svg aria-hidden="true" className="mt-auto w-12 h-12 text-indigo-400" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.15" />
            <path d="M24 12v4M24 32v4M12 24h4M32 24h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2.5" />
          </svg>
        </>
      )}

      {tile.type === "quote" && (
        <>
          <span className="text-[0.7rem] font-semibold tracking-widest uppercase text-slate-400">
            {tile.eyebrow}
          </span>
          <blockquote>
            <p className="text-base leading-relaxed italic text-white">{tile.quote}</p>
            <footer className="mt-2 text-xs text-slate-400">— {tile.attribution}</footer>
          </blockquote>
        </>
      )}
    </Tag>
  );
}

/* ─── Grid with roving tabindex ─────────────────────────────── */
export function BentoGrid() {
  const [focusedIdx, setFocusedIdx] = useState(0);

  function handleKeyDown(e) {
    const colCount = window.innerWidth >= 768 ? 12 : 4;
    const tilesPerLogicalRow = Math.floor(colCount / 3); // approximate
    const len = TILES.length;
    let next = focusedIdx;

    switch (e.key) {
      case "ArrowRight": next = Math.min(focusedIdx + 1, len - 1); break;
      case "ArrowLeft":  next = Math.max(focusedIdx - 1, 0); break;
      case "ArrowDown":  next = Math.min(focusedIdx + tilesPerLogicalRow, len - 1); break;
      case "ArrowUp":    next = Math.max(focusedIdx - tilesPerLogicalRow, 0); break;
      case "Home":       next = 0; break;
      case "End":        next = len - 1; break;
      default: return;
    }

    if (next !== focusedIdx) {
      e.preventDefault();
      setFocusedIdx(next);
      // Focus is managed declaratively via tabIndex — the focused element
      // receives tabindex 0 and will be focused by the browser naturally,
      // but we also call focus() imperatively for reliability.
      document.querySelectorAll("[role='gridcell']")[next]?.focus();
    }
  }

  return (
    <section aria-labelledby="features-heading">
      <h2 id="features-heading" className="mb-6 text-3xl font-extrabold text-white">
        Everything your workflow needs
      </h2>
      <div
        className="grid grid-cols-4 md:grid-cols-12 auto-rows-[90px] [grid-auto-flow:dense] gap-3"
        role="grid"
        aria-label="Product features"
        onKeyDown={handleKeyDown}
      >
        <div role="row" style={{ display: "contents" }}>
          {TILES.map((tile, i) => (
            <Tile
              key={tile.id}
              tile={tile}
              tabIndex={i === focusedIdx ? 0 : -1}
              onFocus={() => setFocusedIdx(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

## Variations

| Name | What changes |
|---|---|
| **Light-mode bento** | Surface flips to near-white (`#f8f7f4`); tiles use tinted pastels; text becomes `#0f172a`. Same contrast rules apply, just inverted. |
| **Asymmetric hero** | One tile spans 8 of 12 columns; all others are 4-col or 2-col; no equal-sized tiles at all. |
| **Dashboard bento** | All tiles are interactive (draggable/resizable); grid role becomes `application`; each tile has a dedicated handle with `aria-grabbed`. Uses a library like `dnd-kit`. |
| **Animated entrance** | Each tile fades in with a stagger on first scroll into view (use `whileInView` with `once: true`). Guard with `useReducedMotion`. |
| **Monochrome accent** | Single brand hue; tiles vary by shade (tonal OKLCH step of ~0.08 L per tier) rather than hue. Avoids rainbow scatter. |
| **Glassmorphism tile** | One tile only uses `backdrop-filter: blur(16px)` over a real image background. All other tiles remain opaque to avoid compound blur cost and contrast failures. |

## Accessibility

### prefers-reduced-motion

All hover/entrance transforms must be absent when `(prefers-reduced-motion: reduce)` is set. The vanilla CSS handles this with a media query override that replaces `transform` with a mild `opacity` shift. The React variant uses the `useReducedMotion()` hook from `motion/react` and swaps the `hoverAnim` object to `{ opacity: 0.85 }` (no `y` or `scale`).

```css
/* Mandatory pattern — shown in full in Working code above */
@media (prefers-reduced-motion: reduce) {
  .tile[data-interactive] {
    transition: opacity 120ms linear;
  }
  /* Remove transform-based hover entirely */
}
```

### Hover / pointer fallback

Hover effects are gated by `@media (hover: hover) and (pointer: fine)` in CSS and `window.matchMedia('(hover: hover) and (pointer: fine)')` in JS. Touch users see active/focus states only — no persistent hover lift. This prevents stuck hover states on iOS/Android.

### Keyboard navigation (APG layout-grid pattern)

- The grid carries `role="grid"` with `aria-label`.
- Each logical row group uses `role="row"` (can be `display:contents` to avoid layout impact).
- Each tile carries `role="gridcell"`.
- Roving tabindex: only the currently focused tile has `tabindex="0"`; all others have `tabindex="-1"`. This reduces the page's tab-stop count to one entry point for the entire grid.
- Arrow keys (left/right/up/down), Home, End navigate between tiles.
- `Enter` and `Space` activate interactive tiles.
- Tab moves focus out of the grid entirely (the browser's natural behaviour with roving tabindex).
- Avoid using `role="grid"` if the tiles are purely decorative or non-interactive — a `role="list"` / `role="listitem"` pattern (or plain `<ul>`/`<li>`) is semantically cleaner for static content grids.

### Focus indicator

Interactive tiles use `outline: 3px solid #f8f7f4; outline-offset: 3px`. The outline colour (#f8f7f4) against any of the tile accent colours used in this file exceeds 3:1 contrast, satisfying WCAG 2.4.11 (Focus Appearance Minimum, Level AA in WCAG 2.2). Do not use `outline: none` or `outline: 0` without an equivalent custom focus indicator.

### Screen readers — tile content

- Stat tiles: the `<span>` that renders "14.3k" carries `aria-label="14,300 active users"` so the screen reader reads the full, unambiguous value.
- Sparkline SVG: uses `role="img"` + `aria-labelledby` pointing at explicit `<title>` and `<desc>` IDs. This pattern has the broadest support across JAWS, NVDA, VoiceOver, and Narrator as of 2025.
- Interactive tiles that are `<a>` elements carry `aria-label` on the element itself describing both the tile content and the action.
- Media tiles: the `<img>` inside carries `alt=""` because the tile's own `aria-label` covers the accessible name. Without the `alt=""` the file name or URL would be announced redundantly.
- `aria-live` regions: if any tile updates its content asynchronously (e.g. a live stat polling every 30 s), add `aria-live="polite"` and `aria-atomic="true"` to the stat value wrapper to announce the change without interrupting the user.

### Contrast (colours used in this file's code — recomputed)

All pairs below reference colours actually rendered as text-on-surface in the code above.

| Text colour | Surface | Ratio | Result |
|---|---|---|---|
| `#f8f7f4` on `#1e293b` | Primary text on tile | 14.63:1 | PASS AA |
| `#94a3b8` on `#1e293b` | Muted text on tile | 4.55:1 | PASS AA |
| `#f8f7f4` on `#0c4a6e` | Text on blue stat tile | 11.37:1 | PASS AA |
| `#f8f7f4` on `#14532d` | Text on green stat tile | 9.23:1 | PASS AA |
| `#f8f7f4` on `#312e81` | Text on indigo feature tile | 8.04:1 | PASS AA |
| `#4ade80` on `#0c4a6e` | Delta text on blue stat tile | ~4.87:1 | PASS AA |
| `#86efac` on `#14532d` | Secondary text on green tile | 6.12:1 | PASS AA |

Teal (`#0d9488`) is mentioned in the Variations section but is **not** used as normal-text-on-surface in this file's code; if you add it, use only for large text (18 px+ / bold 14 px+) where the 3.74:1 ratio meets the 3:1 large-text threshold.

## Performance

**Animate only `transform` and `opacity`.** Both properties are composited by the GPU and do not trigger layout or paint. Never animate `width`, `height`, `top`, `left`, `padding`, or `background-color` inside a transition on a tile.

**`will-change: transform`** prepares a compositor layer on hover, but must be removed after the transition ends (`transitionend` event) or it pins every tile to its own layer permanently, multiplying GPU memory usage proportionally to tile count. The vanilla JS snippet above handles this with `{ once: true }`.

**`contain: layout paint`** on each tile limits browser reflow and repaint to the tile's own subtree. A content change inside one tile cannot force a layout recalc outside it. This matters most in live-updating dashboards where stat tiles re-render every 30 s. Consider `contain: content` (equivalent to `layout paint style`) if tiles use CSS counters.

**`grid-auto-flow: dense`** runs the auto-placement algorithm on every render. On a grid with 50+ tiles this is measurable; if tiles are dynamically added, memoize the span assignments and avoid layout thrash by batching DOM mutations.

**Images in media tiles:** use `loading="lazy"` and `decoding="async"` on below-the-fold tiles. Serve responsive images with `srcset` so a 600 px tile does not download a 1400 px asset.

**Backdrop-filter** (`blur`) is expensive: GPU composites a separate layer for every blurred surface. Use it on at most one or two tiles per grid. If you use it on every tile, expect jank on mid-range mobile hardware.

**Container queries** (`container-type: inline-size`) create a containment context on each tile. This is effectively free on modern engines (Chromium 105+, Firefox 110+, Safari 16+), but adds a mild overhead if you have hundreds of tiles with complex `@container` rules.

## Anti-slop

**The cliché (see `_slop-blocklist.md`):**

- *Layout*: identical 2×2 tiles in a symmetric 3-column grid, every tile with the same icon-title-blurb structure. No hierarchy emerges; the bento aesthetic is cargo-culted without its core purpose.
- *Surface*: glassmorphism on every tile over a generic purple-indigo-to-pink aurora blob. Each card has `backdrop-filter: blur(20px)` and `rgba(255,255,255,0.1)` — the combination reliably produces WCAG contrast failures and looks indistinguishable from 10 000 other AI SaaS landing pages.
- *Color*: generic SaaS blue (`#3B82F6`) as the single accent on all tiles; no per-tile personality.
- *Type*: Inter at two weights, identical size in title and body across all tiles.
- *Copy*: "Empower your team," "Seamless workflow," "Unlock productivity" inside a finished design with no real product specifics.

**The tasteful alternative:**

Use one large tile that genuinely shows the product (screenshot, video, or live iframe), not an illustration. Give each tile a distinct hue from a curated two or three-hue palette rooted in OKLCH (`oklch(35% 0.18 250)` for blue, `oklch(28% 0.15 145)` for green, `oklch(30% 0.12 40)` for amber) — tonal variation within a hue, not a rainbow. Reserve glassmorphism for exactly one tile over a real image, not a gradient blob. Use a weight-contrast typographic scale: the stat number at `font-weight: 800`, the eyebrow at `font-weight: 600 / tracking: 0.08em`, body at `font-weight: 400`. Write specific numbers and real customer names, not lorem or corporate non-speak.

## Pairs well with

- **`bento-grid`** (layout concept): the underlying 12-column grid scaffold that bento tiles sit inside — defines the base row height, gap rhythm, and `grid-auto-flow: dense` strategy.
- **`bento aesthetic`**: the visual language (corner radius consistency, surface elevation, gap-as-grout) applied across tiles; covers dark/light mode surface tokens.
- **`cards`** (component): simpler non-spanning sibling; use when all items are equal weight and no two-dimensional grid navigation is needed.
- **`staggered-entrance`**: entrance animation for the tile grid on first load — same easing vocabulary (`cubic-bezier(0.16, 1, 0.3, 1)`) applied as a stagger per tile.
- **`editorial-typographic`**: applies when a bento tile uses display-weight type as the primary content (quote tile, headline tile) rather than a stat or media.
- **`scroll-progress-indicator`**: useful when a bento section is pinned and tiles animate in sequence during scroll.

## Current references

- [Layout Grid Examples — W3C WAI ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/layout-grids/) — the normative reference for roving tabindex, row/gridcell roles, and arrow-key patterns in non-tabular grids
- [Grid (Interactive Tabular Data and Layout Containers) — W3C WAI ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) — distinguishes data grids from layout grids; covers Enter/F2/Escape for nested widget interaction
- [ARIA: grid role — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/grid_role) — required child roles (row, gridcell), keyboard table, and when to prefer list over grid
- [Accessibility dos and don'ts for interactive cards — Livefront](https://livefront.com/writing/accessibility-dos-and-donts-for-interactive-cards/) — practical focus management and semantic HTML guidance for card components (2024)
- [Build a bento grid layout with CSS — iamsteve (Jul 2024)](https://iamsteve.me/blog/bento-layout-css-grid) — 12-column scaffold with `grid-auto-flow: dense`, container queries, and Tailwind utility mapping
- [Neue bento layouts with :has() and container queries — nerdy.dev (Jan 2024)](https://nerdy.dev/neue-bento-layouts-with-grid-has-and-container-queries) — using `:has()` to make the grid self-aware of child count and aspect ratio
- [Bento grids for AI dashboards — baltech.in (Sep 2025)](https://baltech.in/blog/bento-grids-for-ai-dashboards/) — tile taxonomy (prediction, alert-triage, data-quality), ARIA grid roles for dashboards, lazy-load and debounce strategies
- [Container queries — web.dev learn](https://web.dev/learn/css/container-queries) — `container-type: inline-size`, `@container` syntax, `cqi` units; broad support (Chromium 105+, Firefox 110+, Safari 16+)
- [Accessible SVGs — CSS-Tricks](https://css-tricks.com/accessible-svgs/) — `role="img"` + `aria-labelledby` + explicit `<title>`/`<desc>` IDs; most reliable cross-browser pattern for inline chart SVGs
- [CSS contain property — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) — `contain: layout paint` for tile isolation; performance model for reducing cross-tile reflow
- [useReducedMotion — motion.dev](https://motion.dev/motion/use-reduced-motion/) — hook API for conditionally swapping animation variants in Motion (formerly Framer Motion, renamed 2025)
- [prefers-reduced-motion — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — media feature reference with CSS and JS matchMedia patterns
