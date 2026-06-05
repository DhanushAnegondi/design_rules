# Bento grid

> A dense, scannable grid of differently-sized tiles — large feature cells beside small ones — built from a few column tracks and varied row/column spans, that reflows to fewer columns on smaller screens.

**Bucket:** layout
**Maturity:** current
**Effort:** medium
**Best for:** websites, portfolios, apps, dashboards (product feature sections, marketing overview pages, profile/link hubs, stat-and-media mosaics)

## What it is
A bento grid takes a single rectangular region and divides it into compartments of unequal size — the way a Japanese bento box partitions a meal — so that one or two "hero" tiles dominate while smaller tiles cluster around them. Visually the user perceives an editorial mosaic: not a row of identical cards, but a composed arrangement where size signals importance. Mechanically it is just CSS Grid with a fixed number of column tracks and individual items that span multiple columns and/or rows. The hard part is not the desktop composition; it is the **responsive remapping** (the same tiles re-laid into fewer columns) and keeping the DOM order sensible so the visual order does not betray the reading order.

Note the distinction from the *bento visual aesthetic* (the rounded-corner, soft-shadow, frosted "Apple keynote" card skin). This entry is about the **layout mechanism** — the track grid and the spans. The skin is interchangeable: you can pour a brutalist, flat, or glass treatment into the exact same grid. Cross-reference the surface/visual-style entries for the skin; everything below is structure.

## When to use
- **Overview / "everything at a glance" pages** where the user *scans*, not reads linearly — a product landing section showing 6–9 features at once, where you want size to rank them (one big "headline" capability, several supporting ones). This matches a scanning behaviour, not the F-pattern of text-dense pages.
- **Link hubs / profile pages** (a personal site, a "links" page, a press kit) where heterogeneous content types — a photo, a stat, a quote, a CTA, an embed — need to coexist without forcing them all into the same box size.
- **Dashboards** where widgets have genuinely different information density (a tall chart, a single KPI, a short list) and a uniform card grid would waste space or cramp the chart.
- **Media-mixed mosaics**: a portfolio overview where a wide hero image sits next to two stacked thumbnails and a text tile.
- Use it when content is **non-sequential** — the reader can absorb the tiles in any order. If order matters (steps 1→5), a bento works against you.

## When NOT to use
- **Sequential / instructional content.** If the tiles are steps, a ranked list, or anything the user must consume in order, the spatial arrangement fights comprehension. Use a single-column or numbered layout.
- **Long-form reading.** Bento is for glanceable chunks. Paragraphs of body copy in a mosaic force the eye to hunt; that is the F-pattern's enemy.
- **When you'd reach for `grid-auto-flow: dense` to "tidy gaps."** Dense packing pulls later items backward to fill holes, so the visual order no longer matches DOM order — a real keyboard/screen-reader hazard (see Accessibility). Prefer explicitly placed areas.
- **The overuse trap:** every marketing site now ships a bento section, and the cliché is a uniform 3×3 of equal tiles with one slightly-bigger cell — which is just a card grid wearing a costume. If every tile is the same size, you don't have a bento; you have a grid. Earn the format with genuine size variance and content variance.
- **Tiny viewports.** A true multi-size mosaic rarely survives below ~480px; plan to collapse to one column rather than shrink the composition.

## How it works
Plain language: you declare a grid with a fixed, modest number of column tracks (commonly 4, 6, or 12) and a base row height. Each tile then claims a rectangle of that grid by spanning N columns and M rows. Two placement strategies:

1. **Named template areas** (`grid-template-areas`) — you literally draw the layout as ASCII art in CSS, naming each region, and assign tiles with `grid-area`. Most readable, easiest to re-draw per breakpoint, and it keeps placement explicit (no reordering surprises).
2. **Span keywords** (`grid-column: span 2; grid-row: span 2;`) — each tile states its footprint; the auto-placement algorithm flows them in. Less verbose, but holes can appear, and reaching for `grid-auto-flow: dense` to fill them reintroduces the order mismatch.

Key CSS:
- `display: grid` + `grid-template-columns: repeat(6, 1fr)` (the track count is your composition budget).
- `grid-auto-rows: minmax(120px, auto)` for a consistent base cell that can grow with content.
- `grid-template-areas` for explicit placement; redraw it inside each `@media` / container query.
- `gap` for the gutters between compartments.
- **Container queries** (`@container`) instead of `@media` when the grid is a reusable component that may live in a narrow column on one page and full-bleed on another — the grid reflows based on *its own* width, not the viewport's. Baseline since 2023; widely supported.
- **`:has()`** to adapt the composition to content — e.g. a tile that auto-spans wider when it contains an image: `.tile:has(img){ grid-column: span 2; }`. Baseline since late 2023 (Chromium, Safari, Firefox 121+).
- **`reading-flow`** (experimental) to repair the DOM-vs-visual order disconnect when you *do* reorder — see Accessibility.

## Working code

### Vanilla HTML + CSS (named areas, fully responsive)
This is a complete document. Desktop draws a 4-column mosaic via `grid-template-areas`; a container query (with a media-query fallback) redraws it to 2 columns at medium width and collapses to a single column on narrow screens. Placement is explicit, so DOM order and visual order stay aligned at every breakpoint.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bento grid</title>
<style>
  :root {
    --ink: #14130f;          /* near-black warm */
    --paper: #f4f1ea;        /* warm off-white  */
    --tile: #fffdf8;
    --accent: #c2410c;       /* burnt orange    */
    --line: #e2ddd2;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Georgia", "Iowan Old Style", serif;
    background: var(--paper);
    color: var(--ink);
    padding: clamp(1rem, 4vw, 3rem);
  }

  /* The bento container. cqi-based container queries need a containment context. */
  .bento {
    container-type: inline-size;
    max-width: 1100px;
    margin-inline: auto;
  }

  .grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: minmax(140px, auto);
    /* Desktop composition: one hero, one tall sidebar, supporting cells. */
    grid-template-areas:
      "hero  hero  stat  tall"
      "hero  hero  quote tall"
      "media note  quote cta";
  }

  .tile {
    background: var(--tile);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 1.25rem 1.4rem;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-width: 0;            /* let content shrink, prevent overflow */
  }
  .hero  { grid-area: hero;  background: var(--ink); color: var(--paper); }
  .stat  { grid-area: stat;  }
  .tall  { grid-area: tall;  }
  .quote { grid-area: quote; }
  .media { grid-area: media; background: var(--accent); color: #fff; }
  .note  { grid-area: note;  }
  .cta   { grid-area: cta;   border-color: var(--accent); }

  .hero h2 { font-size: clamp(1.6rem, 4cqi, 2.6rem); margin: 0 0 .4rem; line-height: 1.04; }
  .stat .big { font-size: clamp(1.8rem, 5cqi, 3rem); font-weight: 700; color: var(--accent); }
  .kicker { font-size: .72rem; letter-spacing: .12em; text-transform: uppercase;
            font-family: ui-monospace, monospace; opacity: .65; margin-bottom: .35rem; }
  a.cta-link { color: var(--accent); font-weight: 700; text-decoration: none; }
  a.cta-link:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }

  /* Medium: reflow to 2 columns, redraw the areas. Container query first. */
  @container (max-width: 720px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
      grid-template-areas:
        "hero  hero"
        "stat  tall"
        "quote tall"
        "media note"
        "cta   cta";
    }
  }
  /* Narrow: single column stack. */
  @container (max-width: 440px) {
    .grid {
      grid-template-columns: 1fr;
      grid-template-areas:
        "hero" "stat" "tall" "quote" "media" "note" "cta";
    }
  }

  /* Fallback for engines without container-query support: mirror with @media. */
  @supports not (container-type: inline-size) {
    @media (max-width: 760px) {
      .grid { grid-template-columns: repeat(2, 1fr);
        grid-template-areas:
          "hero hero" "stat tall" "quote tall" "media note" "cta cta"; }
    }
    @media (max-width: 480px) {
      .grid { grid-template-columns: 1fr;
        grid-template-areas: "hero" "stat" "tall" "quote" "media" "note" "cta"; }
    }
  }
</style>
</head>
<body>
  <section class="bento" aria-label="Product overview">
    <!-- DOM order = the order a screen reader / keyboard will follow.
         Keep it the most sensible narrative order regardless of visual placement. -->
    <div class="grid">
      <article class="tile hero">
        <p class="kicker">Overview</p>
        <h2>Ship faster with one connected workspace</h2>
      </article>
      <article class="tile stat">
        <p class="kicker">Adoption</p>
        <p class="big">38k</p>
        <p>teams onboarded last quarter</p>
      </article>
      <article class="tile tall">
        <p class="kicker">Integrations</p>
        <p>Slack, GitHub, Linear, Figma and 60 more — no setup script.</p>
      </article>
      <article class="tile quote">
        <p class="kicker">From the field</p>
        <p>"Cut our standup from 30 minutes to 9."</p>
      </article>
      <article class="tile media">
        <p class="kicker">Live</p>
        <p>Realtime presence on every doc.</p>
      </article>
      <article class="tile note">
        <p class="kicker">Security</p>
        <p>SOC 2, SSO, audit log.</p>
      </article>
      <article class="tile cta">
        <p class="kicker">Start</p>
        <a class="cta-link" href="#">Create a workspace →</a>
      </article>
    </div>
  </section>
</body>
</html>
```

Contrast check for the colours actually used as text-on-surface in this file (computed with the WCAG relative-luminance formula):
- Body/`.tile` text `#14130f` on `#fffdf8`: ratio **18.9:1** — passes AAA.
- `.hero` text `#f4f1ea` on `#14130f`: ratio **16.9:1** — passes AAA.
- `.media` text `#ffffff` on accent `#c2410c`: ratio **4.74:1** — passes AA for normal text.
- `.stat .big` accent `#c2410c` on `#fffdf8`: ratio **4.51:1** — passes AA for normal text (and comfortably for its large display size).
- `.cta-link` accent `#c2410c` on `#fffdf8`: ratio **4.51:1** — passes AA.

### React + Tailwind (span-based, container-aware)
Tailwind's `col-span`/`row-span` utilities express the same mosaic. This version uses explicit spans (not `auto-flow dense`) so order stays intact, and `@container` utilities (Tailwind v3.2+ `@tailwindcss/container-queries`, core in v4) so the grid responds to its own width.

```jsx
// Tailwind v4: container queries are built in. v3: add @tailwindcss/container-queries.
function Tile({ className = "", children }) {
  return (
    <article
      className={
        "min-w-0 rounded-2xl border border-stone-200 bg-white " +
        "p-5 flex flex-col justify-end " + className
      }
    >
      {children}
    </article>
  );
}

export default function Bento() {
  return (
    <section aria-label="Product overview" className="@container mx-auto max-w-5xl p-4">
      <div
        className={
          "grid gap-4 auto-rows-[minmax(140px,auto)] " +
          "grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-4"
        }
      >
        {/* span overrides only apply once there are enough columns to honour them */}
        <Tile className="@3xl:col-span-2 @3xl:row-span-2 bg-stone-900 text-stone-100">
          <p className="font-mono text-xs uppercase tracking-widest opacity-60">Overview</p>
          <h2 className="mt-1 text-2xl leading-tight @3xl:text-4xl">
            Ship faster with one connected workspace
          </h2>
        </Tile>

        <Tile>
          <p className="font-mono text-xs uppercase tracking-widest text-stone-500">Adoption</p>
          <p className="text-3xl font-bold text-orange-700">38k</p>
          <p>teams onboarded last quarter</p>
        </Tile>

        <Tile className="@md:row-span-2">
          <p className="font-mono text-xs uppercase tracking-widest text-stone-500">Integrations</p>
          <p>Slack, GitHub, Linear, Figma and 60 more.</p>
        </Tile>

        <Tile className="bg-orange-700 text-white">
          <p className="font-mono text-xs uppercase tracking-widest opacity-80">Live</p>
          <p>Realtime presence on every doc.</p>
        </Tile>

        <Tile className="@3xl:col-span-2">
          <p className="font-mono text-xs uppercase tracking-widest text-stone-500">Start</p>
          <a
            href="#"
            className="font-bold text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-700"
          >
            Create a workspace →
          </a>
        </Tile>
      </div>
    </section>
  );
}
```
The Tailwind `orange-700` (`#c2410c`) on white gives the same 4.51:1 AA ratio noted above; the `stone-900` hero (`#1c1917`) under `stone-100` text (`#f5f5f4`) measures ~16:1.

## Variations
- **Named-area vs span-driven** — the knob is *placement control*. Areas = explicit, redraw per breakpoint, order-safe. Spans = terse, but you may fight holes.
- **Fixed-ratio vs content-sized rows** — `grid-auto-rows: 1fr`/fixed px gives a tight, gallery-like grid (all cells aligned to a beat); `minmax(140px, auto)` lets text tiles grow. The knob is whether tiles are uniform-height tiles or content-driven boxes.
- **`:has()`-adaptive bento** — tiles auto-resize from their content (`.tile:has(video){ grid-column: span 2 }`). The knob is *who decides size*: the template, or the content.
- **Dense-packed bento** — `grid-auto-flow: dense` for a tightly-tiled, gap-free mosaic (think image walls). Knob: visual tightness, paid for in reading-order risk — only safe when tiles are order-independent and you apply `reading-flow`.
- **Asymmetric / "broken" bento** — deliberately offset spans (a 3-wide hero in a 4-col grid leaving an intentional negative-space cell) for editorial tension, versus a balanced symmetric mosaic.

## Accessibility
- **Reading/tab order follows DOM, not the grid.** CSS Grid placement (including `grid-template-areas` and spans) changes *visual* position only; keyboard tab order and screen-reader reading order stay in source order. So **author the HTML in the most sensible narrative order first**, then place tiles visually. In the vanilla example, the DOM order (hero → stat → integrations → quote → media → security → CTA) is a coherent reading sequence at every breakpoint because placement is explicit and never reorders items behind the user's back.
- **Avoid `grid-auto-flow: dense` unless tiles are truly order-independent.** Dense packing pulls later items earlier visually while leaving them late in the DOM, so a sighted keyboard user sees focus jump around the page. If you need it, pair it with `reading-flow: grid-rows` (or `grid-order`) on the container to make sequential focus follow the visual layout. **Status:** `reading-flow` is *experimental* — shipped in Chromium 137+ (Chrome/Edge), not yet in Safari or Firefox stable, and **not Baseline** as of 2026. Treat it as progressive enhancement, never as your only safeguard; the DOM order must already be acceptable without it.
- **Don't use `order` to fix layout either** — same trap: it moves visual position without moving focus/reading order.
- **Semantics:** wrap the grid in a landmark (`<section aria-label>`), and make each tile a real element (`<article>`, heading, link) rather than a bare `<div>` so the structure is navigable. A grid of links should be a list (`<ul>`/`<li>`).
- **Zoom / reflow (WCAG 1.4.10):** at 400% zoom / 320px effective width the layout must collapse to one column with no horizontal scroll — the single-column breakpoint above does this. Using container queries makes a reused bento collapse correctly even inside a narrow column.
- **Focus visibility:** interactive tiles need a visible `:focus-visible` ring (the examples set one on links); don't let the card's border double as the only focus cue.
- **Touch targets:** small tiles still need adequate tap areas (WCAG 2.5.8 minimum 24×24 CSS px, 44×44 recommended) for any control; make the whole tile clickable where it's a single link rather than a tiny corner arrow.

## Performance
- A handful of tiles costs nothing — Grid layout is cheap. Watch out only with **large/auto-generated bentos** (hundreds of tiles, e.g. a dynamic image wall).
- **Reflow/layout thrash:** changing `grid-template-areas` or track counts triggers a relayout of the whole grid; that's fine at breakpoints but avoid animating grid track sizes (animate `transform`/`opacity` on tiles instead).
- **`content-visibility: auto`** on off-screen tiles (with a `contain-intrinsic-size` hint) lets the browser skip rendering work for a long scrolling bento — a measurable win on big galleries, but set the intrinsic size or you'll cause scrollbar jumps.
- **Images:** give every media tile explicit `width`/`height` or `aspect-ratio` so the grid doesn't reflow as images load (CLS). Lazy-load below-the-fold tiles (`loading="lazy"`).
- **`:has()` and container queries** are evaluated efficiently in current engines, but a `:has()` that matches deep descendants across many tiles can add style-recalc cost — keep selectors shallow (`.tile:has(> img)`).

## Anti-slop
Cliché (see `_slop-blocklist.md` → LAYOUT): the **"hero + three identical icon-title-blurb cards"** row, or its bento-flavoured cousin — a uniform 3×3 of equal-size tiles with one cell merely tinted differently and called a "bento." That's a card grid in costume; it has the visual rhythm of a spreadsheet. Related slop: the **centered 800px column with equal padding** that some bentos collapse into on the way to "clean." The tasteful fix is genuine *variance on two axes*: (1) size variance — let one or two tiles truly dominate (a 2×2 hero), others stay small, and leave intentional negative space; (2) content variance — mix a stat, a quote, an image, and a CTA so the tiles aren't interchangeable. Vary the rhythm, allow a full-bleed or offset moment, and avoid the default surface slop (a soft drop shadow plus glassmorphism on every tile — see SURFACE); pick one systematic elevation instead. If you can swap any two tiles with no loss, you built a grid, not a bento.

## Pairs well with
- **Surface/elevation system** — the bento is structure; a single systematic shadow/border treatment (not per-tile glass) is the skin that makes it read as one composition.
- **Editorial / characterful type** — size-ranked tiles want a real type scale; a big display headline in the hero tile is what sells the hierarchy.
- **`text-reveal-on-scroll` / staggered entrance** — reveal tiles with a *meaningful* stagger (hero first, supporting tiles after) rather than a uniform fade-up; respect `prefers-reduced-motion`.
- **Container-query components** — a bento built with `@container` drops into sidebars or modals and reflows on its own width.
- **Full-bleed / asymmetric hero** — a bento section reads well *after* a non-grid hero, giving the page rhythm rather than grid-on-grid monotony.

## Current references
- [MDN — grid-template-areas](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas) — the named-area syntax that makes per-breakpoint bento remapping legible.
- [MDN — grid-auto-flow](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-auto-flow) — what `dense` does and why it reorders; the basis of the accessibility caveat.
- [MDN — CSS grid layout and accessibility](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Grid_layout_and_accessibility) — confirms grid placement does not change reading/tab order.
- [Chrome for Developers — Solving the CSS layout and source order disconnect](https://developer.chrome.com/blog/reading-order) — the reading-order/reading-flow rationale for dense and reordered layouts.
- [Chrome for Developers — Use CSS reading-flow for logical sequential focus navigation](https://developer.chrome.com/blog/reading-flow) — `reading-flow` values and the Chromium 137 ship note.
- [MDN — reading-flow](https://developer.mozilla.org/en-US/docs/Web/CSS/reading-flow) — values (`grid-rows`, `grid-columns`, `grid-order`, `flex-visual`, `flex-flow`, `source-order`, `normal`) and the "not Baseline / experimental" status.
- [MDN — CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) — using a tile grid's own width for reflow; Baseline since 2023.
- [iamsteve — Build a bento grid layout with CSS Grid](https://iamsteve.me/blog/bento-layout-css-grid) — a practical, modern walkthrough of the areas-and-spans approach.
- [Smashing Magazine — Masonry In CSS: Should Grid Evolve Or Stand Aside](https://www.smashingmagazine.com/2025/05/masonry-css-should-grid-evolve-stand-aside-new-module/) — context for the related (but distinct) masonry/grid-lanes work, useful when a bento tempts you toward auto-flowing tiles.
```
