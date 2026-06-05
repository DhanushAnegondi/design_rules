# Full-bleed sections

> A page where most content sits in a centered reading column, but chosen sections (images, color bands, video) break out to touch the left and right viewport edges.

**Bucket:** layout
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, editorial/long-form, marketing/landing pages

## What it is
The reader perceives a calm, readable measure of text down the middle of the page, punctuated by moments that span the entire window edge-to-edge — a full-width hero image, a tinted "callout" band, an embedded map, a quote on color. Mechanically you define ONE page-level grid whose center track holds the reading column and whose outer tracks are gutters; any element can opt to span all the way to the edge by addressing the outer grid lines. This replaces the old, fragile trick of wrapping everything in a fixed-width container and then yanking individual children out with negative `100vw` margins. The grid version keeps a single source of truth for "where the content column lives," so contained and full-bleed blocks stay aligned automatically.

## When to use
- **Long-form reading with visual punctuation** — articles, case studies, docs. The eye scans a steady single column (single-column reading behavior), and a full-bleed image or color band signals "new chapter / breathe here" without breaking the measure of the prose.
- **Marketing / landing pages with rhythm** — alternate a contained intro, a full-bleed feature band, a contained detail row, a full-bleed testimonial on color. The alternation is what makes a page feel *composed* rather than a stack of identical sections.
- **Portfolios** — full-bleed project imagery (work wants to be big) interleaved with contained captions/credits (text wants to be narrow).
- **Hero + media** — a full-bleed hero image or video at the top, then the body settles into the reading column.
- **"Popout" emphasis** — a code block, table, or figure that is slightly wider than the prose but not full-width (an intermediate breakout, not edge-to-edge).

## When NOT to use
- **App shells and dashboards** — dense tool UIs want explicit panels and a consistent gutter, not editorial edge-to-edge moments. Full-bleed reads as "marketing page," not "product."
- **Bleeding *text* to the edges** — never run paragraphs full-width; line length blows past the comfortable 45–75ch measure and reading speed tanks. Full-bleed is for *media and color bands*, the text inside them stays constrained.
- **Every section full-bleed** — if everything bleeds, nothing does; the page loses its reading spine and becomes a slideshow of bands. The contrast between contained and full-bleed is the entire point.
- **When you cannot control horizontal overflow** — the legacy `100vw` margin trick adds a horizontal scrollbar on any OS with classic (non-overlay) scrollbars, because `100vw` counts the vertical scrollbar's width. If you can't adopt the grid technique or container-query units, don't ship the `vw` trick.
- **Right-to-left / bidirectional concerns ignored** — if you hardcode `margin-left`/`margin-right` instead of logical properties, breakouts misalign in RTL.

## How it works
The mechanism: define a CSS Grid on the page wrapper whose **column tracks encode the layout zones** — a flexible gutter on each side, then a fixed-max reading column in the middle. Name the grid lines so children read semantically. Every direct child defaults into the center (`content`) track; a child opts into a wider zone by setting `grid-column` to a named span that reaches further out (`popout`, `feature`, or `full`). Because all blocks share one grid, a contained paragraph and a full-bleed image are aligned by construction — no magic numbers.

Key CSS:
- **`grid-template-columns` with named lines** — `[full-start] ... [content-start] ... [content-end] ... [full-end]`. This is the durable core. Subgrid and container queries are optional enhancements on top.
- **`minmax()` / `min()` / `clamp()`** — the center track is `min(targetWidth, 100% - gutters)` so it never overflows on small screens; outer tracks are `minmax(gutter, 1fr)` so gutters collapse gracefully.
- **Logical properties** — use `grid-column` line *names* (direction-agnostic) rather than left/right margins, so RTL works for free.
- **Avoiding the scrollbar:** prefer the grid technique (no `vw` anywhere). If you must compute a viewport width, use **container query units (`cqw`)** on an `inline-size` container — they exclude the scrollbar — or `scrollbar-gutter: stable` on the root to reserve the gutter and stop layout shift. Plain `100vw` is the thing that *causes* the bug.
- **`:has()` / subgrid** — optional: subgrid lets a nested section inherit the parent's named columns so deeply-nested figures can still reach the page edge without re-declaring tracks (Baseline 2023; Chrome/Edge 117+, Firefox 71+, Safari 16+).

## Working code

### Vanilla — named-line breakout grid (the durable production pattern)
Complete, runnable document. Four breakout levels (`content`, `popout`, `feature`, `full`) plus alternating contained/full-bleed rhythm, with a responsive gutter. No `vw`, so no scrollbar bug. Pattern after Ryan Mulligan's "Layout Breakouts."

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Full-bleed sections</title>
<style>
  :root {
    --ink:        #101014;  /* near-black */
    --paper:      #f2f2f5;  /* near-white */
    --panel:      #17171d;  /* raised dark panel */
    --muted-dark: #a8a8b3;  /* muted text on dark */
    --muted-light:#54545f;  /* muted text on light */
    --accent:     #f7c948;  /* amber accent */

    /* --- the breakout grid tracks --- */
    --gap: clamp(1rem, 6vw, 4rem);          /* responsive page gutter */
    --content-width: min(68ch, 100% - var(--gap) * 2);
    --popout:  minmax(0, 2rem);             /* +2rem each side */
    --feature: minmax(0, 5rem);             /* +5rem each side */
    --full:    minmax(var(--gap), 1fr);     /* flexible outer gutter */
  }

  * { box-sizing: border-box; }
  html { scrollbar-gutter: stable; }        /* reserve scrollbar space: no shift */
  body {
    margin: 0;
    font-family: ui-serif, Georgia, "Times New Roman", serif;
    line-height: 1.65;
    color: var(--ink);
    background: var(--paper);
    overflow-x: clip;            /* belt-and-braces; nothing should overflow anyway */
  }

  /* The single page grid. Lines bloom outward from the center. */
  .page {
    display: grid;
    grid-template-columns:
      [full-start]    var(--full)
      [feature-start] var(--feature)
      [popout-start]  var(--popout)
      [content-start] var(--content-width) [content-end]
      var(--popout)   [popout-end]
      var(--feature)  [feature-end]
      var(--full)     [full-end];
  }

  /* Everything defaults into the reading column. */
  .page > * { grid-column: content; }

  /* Opt-in breakout utilities. */
  .popout  { grid-column: popout; }
  .feature { grid-column: feature; }
  .full    { grid-column: full; }

  /* A full-bleed band re-creates a centered inner grid so its OWN
     text stays in the reading column while the color/image bleeds. */
  .full.band {
    display: grid;
    grid-template-columns: inherit;   /* reuse the page's tracks */
    padding-block: clamp(2.5rem, 8vw, 6rem);
  }
  .full.band > * { grid-column: content; }

  /* --- skin (decorative, not the layout) --- */
  h1 { font-family: ui-sans-serif, system-ui, sans-serif;
       font-size: clamp(2.25rem, 7vw, 4rem); line-height: 1.05;
       letter-spacing: -0.02em; margin: 1.5rem 0 0.5rem; }
  h2 { font-family: ui-sans-serif, system-ui, sans-serif;
       font-size: clamp(1.4rem, 3.5vw, 2rem); margin-top: 2.5rem; }
  p  { margin: 1rem 0; }
  .lede { color: var(--muted-light); font-size: 1.15rem; }

  .hero {                               /* full-bleed media at the top */
    block-size: clamp(16rem, 45vh, 30rem);
    background: linear-gradient(135deg, #1d1d27, #2c2c3a 60%, var(--accent) 220%);
    display: grid; place-content: center;
    color: var(--paper); text-align: center;
  }

  .band.dark { background: var(--panel); color: var(--paper); }
  .band.dark .lede { color: var(--muted-dark); }
  .band.accent { background: var(--accent); color: var(--ink); }

  figure { margin: 0; }
  figure img, .figbox {
    display: block; inline-size: 100%; border-radius: 4px;
    aspect-ratio: 16 / 6; object-fit: cover;
    background: repeating-linear-gradient(45deg, #2c2c3a 0 12px, #34343f 12px 24px);
  }
  figcaption { color: var(--muted-light); font-size: 0.9rem; margin-top: 0.5rem; }

  pre.popout {
    background: var(--panel); color: var(--paper);
    padding: 1.25rem 1.5rem; border-radius: 6px; overflow-x: auto;
    font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 0.9rem;
  }
</style>
</head>
<body>
  <main class="page">

    <!-- FULL-BLEED hero -->
    <header class="full hero">
      <div>
        <h1>The full-bleed page</h1>
        <p>Reading column down the middle, media to the edges.</p>
      </div>
    </header>

    <!-- CONTAINED prose -->
    <p class="lede">Most of the page is a calm, single column tuned to a 68-character
      measure. Color bands and imagery break out to the viewport edge to mark rhythm.</p>
    <p>This paragraph sits in the <code>content</code> track. Its line length stays
      comfortable no matter how wide the window gets, because the center grid track is
      capped at <code>min(68ch, 100% − gutters)</code>.</p>

    <!-- POPOUT: slightly wider than prose -->
    <pre class="popout">grid-column: content;   /* default reading column */
grid-column: full;      /* edge-to-edge bleed   */</pre>

    <h2>Feature-width figure</h2>
    <p>The next image uses the <code>feature</code> zone — wider than the prose, but not
      yet touching the edges. Three breakout levels give you a gradient of emphasis.</p>

    <!-- FEATURE-width figure -->
    <figure class="feature">
      <div class="figbox" role="img" aria-label="Example wide project image"></div>
      <figcaption>A feature-width figure. Wider than the text, short of full bleed.</figcaption>
    </figure>

    <!-- FULL-BLEED color band; its TEXT stays in the reading column -->
    <section class="full band dark" aria-labelledby="why">
      <h2 id="why" style="margin-top:0">Why a band here</h2>
      <p class="lede">A full-bleed color band gives the eye a place to rest and says
        "new section" without a hard rule. The band touches both edges; its words do not.</p>
    </section>

    <!-- CONTAINED again: the rhythm returns to the column -->
    <p>After the band, the body resumes its single-column reading rhythm. The contrast
      between contained and full-bleed is what makes the page feel composed.</p>

    <!-- FULL-BLEED accent band -->
    <section class="full band accent" aria-labelledby="cta">
      <h2 id="cta" style="margin-top:0">A call to action on color</h2>
      <p>Edge-to-edge amber, ink-dark text on top — high contrast, clearly a moment.</p>
    </section>

    <p>And back to the column to close out the page.</p>
  </main>
</body>
</html>
```

Why this avoids the scrollbar bug: there is no `100vw` anywhere. The outer `--full` tracks are `1fr`-based, so they fill exactly the available content-box width (scrollbar already excluded). `scrollbar-gutter: stable` additionally reserves the scrollbar's space up-front so the layout doesn't jump when a short page becomes long.

### The legacy `100vw` margin trick (know it, then avoid it)
If you are stuck inside a fixed-width container you don't control and can't introduce a grid, this is the classic escape — shown with the scrollbar fix baked in:

```css
/* Body must opt into a container so cqw excludes the scrollbar. */
body { container-type: inline-size; }

.full-bleed {
  /* 100cqw = viewport width MINUS the scrollbar (unlike 100vw). */
  inline-size: 100cqw;
  margin-inline: calc(50% - 50cqw);  /* logical props => RTL-safe */
}
/* Fallback for engines without cqw: reserve the gutter and clip. */
@supports not (width: 100cqw) {
  html { scrollbar-gutter: stable; }
  .full-bleed { inline-size: 100vw; margin-inline: calc(50% - 50vw); }
}
```
Container query units (`cqw`) are Baseline 2023 (Chrome/Edge 105+, Firefox 110+, Safari 16+); they measure the query container, which excludes the scrollbar — the cleanest single-value fix. Still prefer the grid approach for new work: it keeps contained and bleeding blocks on one shared alignment.

### React + Tailwind
Tailwind v4 lets you express the named-line grid with arbitrary properties; the breakout levels become utility classes.

```jsx
// Page.jsx — Tailwind v4 (arbitrary grid-template + utility breakouts)
function Page() {
  return (
    <main
      className="grid"
      style={{
        // responsive gutter + capped reading column, no 100vw anywhere
        gridTemplateColumns:
          "[full-start] minmax(1rem,1fr) [feature-start] minmax(0,5rem) " +
          "[popout-start] minmax(0,2rem) [content-start] min(68ch,100%-2rem) " +
          "[content-end] minmax(0,2rem) [popout-end] minmax(0,5rem) " +
          "[feature-end] minmax(1rem,1fr) [full-end]",
      }}
    >
      {/* default children sit in the reading column */}
      <ContentColumn>
        <h1 className="text-4xl font-semibold tracking-tight">Full-bleed in React</h1>
        <p className="mt-4 text-zinc-700">A calm single column…</p>
      </ContentColumn>

      {/* full-bleed band; inner text returns to the column via inherited tracks */}
      <section
        className="grid bg-zinc-900 py-16 text-zinc-100"
        style={{ gridColumn: "full", gridTemplateColumns: "inherit" }}
      >
        <div style={{ gridColumn: "content" }}>
          <h2 className="text-2xl font-semibold">A band on color</h2>
          <p className="mt-3 text-zinc-300">Edge-to-edge, words stay constrained.</p>
        </div>
      </section>
    </main>
  );
}

// helper so children land in the named content track
const ContentColumn = ({ children }) => (
  <div style={{ gridColumn: "content" }}>{children}</div>
);

export default Page;
```

## Variations
- **Breakout depth** — the knob is *which named line you span to*: `content` (prose) → `popout` (+~2rem, for code/tables) → `feature` (+~5rem, for figures) → `full` (edge). Drop levels you don't need.
- **Contained-vs-bleed rhythm** — the composition knob: alternate contained section / full-bleed band down the page. Vary band treatment (image / solid color / dark / accent) so they don't read as identical stripes.
- **Bleed one side only** — a half-bleed image that touches the right edge but keeps the left gutter: span `content-start / full-end`. Strong asymmetric editorial move.
- **Subgrid bleed** — a deeply nested figure reaches the page edge by setting the intermediate wrappers to `grid-template-columns: subgrid` so the page's named lines stay addressable (Baseline 2023).
- **Container-unit bleed** — the legacy escape using `100cqw` + logical margins when you genuinely can't own the grid.
- **Full-bleed with inset content** — bleed the *background* (image/video/color) but keep an inner contained overlay (hero pattern).

## Accessibility
- **Reading order / tab order vs visual order:** this technique only changes column *spans*, not source order — DOM order is preserved, so reading order and tab order match the visual top-to-bottom flow. Do **not** use `grid-row`/`order` to visually reshuffle full-bleed sections out of source order; that desyncs the tab order from what's seen (the classic grid-reordering a11y trap).
- **Text never bleeds:** keep paragraph text in the `content` track at a 45–75ch measure (this file caps at 68ch). Full-width *text* lines hurt low-vision and dyslexic readers most.
- **Zoom / reflow (WCAG 1.4.10):** because tracks use `min()`/`minmax()` with a relative gutter, the layout reflows to a single column at 320px / 400% zoom with no horizontal scrolling — there is no fixed pixel width to overflow, and no `100vw` to bleed past the scrollbar.
- **Contrast on bands:** every text-on-surface pair in the code above is recomputed for its exact hex and clears WCAG AA (4.5:1) — text `#f2f2f5` on dark bg `#101014` = **16.99:1**; `#f2f2f5` on the raised panel `#17171d` = **15.97:1**; ink `#101014` on the amber band `#f7c948` = **12.12:1**; muted `#a8a8b3` on `#101014` = **8.06:1**; muted `#54545f` on paper `#f2f2f5` = **6.69:1**. When a band carries text over a *photo*, add a scrim and test against the lightest pixel under the text.
- **Landmark the bands:** give full-bleed `<section>`s an accessible name (`aria-labelledby` pointing at the band's heading, as above) so they're navigable as regions; a bare bleeding `<div>` is invisible to assistive tech.
- **Screen-reader implications:** none from the layout itself — the visual edge-to-edge effect is purely presentational and carries no semantics, so SR users get the linear DOM order unchanged.

## Performance
- **Cheap layout:** one grid container with static track definitions; no JS, no `ResizeObserver`, no per-frame work. The `min()`/`minmax()` math is resolved once per resize.
- **No layout thrash from the scrollbar:** `scrollbar-gutter: stable` means appearing/disappearing scrollbars don't trigger a full reflow of the page width — important on long pages that grow after data loads.
- **Avoid `100vw`:** beyond the visual scrollbar bug, mismatched `100vw` blocks can force horizontal overflow that invalidates layout repeatedly.
- **Full-bleed media:** the band heights here use `aspect-ratio`, which reserves space and prevents CLS as images load. Set `loading="lazy"` and `decoding="async"` on below-the-fold bleed images; full-width media is the heaviest thing on the page.
- **Large pages:** add `content-visibility: auto` with a `contain-intrinsic-size` to off-screen full-bleed sections to skip their layout/paint until scrolled near — meaningful on long editorial pages with many heavy bands.

## Anti-slop
Cliché (see `_slop-blocklist.md` → LAYOUT): the **"centered 800px column, equal padding top and bottom on every section"** page — a monotone stack with no edges, plus its cousin, the **"hero + three identical icon-title-blurb cards"** band repeated until scroll-death. Both read as generated because every section has the same width and the same rhythm. The tasteful fix is exactly this technique: vary the rhythm — alternate a contained reading column with deliberate full-bleed moments (a feature-width figure, a dark band, an accent CTA), and vary each band's treatment so they aren't identical stripes. Break the "everything centered at one width" default; that contrast is most of what separates *designed* from *defaulted*. Equally slop: bleeding *everything* to the edge so there's no reading spine — restraint is the point.

## Pairs well with
- **`asymmetric-layouts`** — half-bleed (one edge) figures are the gateway to asymmetric editorial composition; both rely on the same named-line grid.
- **`single-column`** — the contained reading spine that full-bleed punctuates; full-bleed is single-column *with deliberate interruptions*.
- **`magazine-grids` / `editorial-typographic`** — big display type in contained text, photography full-bleed: the canonical magazine rhythm.
- **`sticky-pinning` / `text-reveal-on-scroll`** — a full-bleed band is a natural pin target or reveal zone; the edge-to-edge frame makes the motion land.
- **`bento-grid`** — drop a bento section into a `feature` or `full` track as one of the punctuating moments.

## Current references
- [CSS Grid full-bleed layout tutorial — Josh W. Comeau](https://www.joshwcomeau.com/css/full-bleed/) — the canonical `grid-template-columns: 1fr min(...) 1fr` + `grid-column: 1 / 4` numeric version, clearly explained.
- [Layout Breakouts with CSS Grid — Ryan Mulligan](https://ryanmulligan.dev/blog/layout-breakouts/) — the named-line `content / popout / feature / full` system this entry's main code is based on.
- [Full Bleed — CSS-Tricks](https://css-tricks.com/full-bleed/) — Comeau's technique distilled, plus the negative-margin comparison.
- [The CSS 100vw scrollbar bug: 3 ways to stop the horizontal overflow — phpFashion](https://phpfashion.com/en/how-to-fix-100vw-scrollbar) — why `100vw` overflows and the container-query-unit / calc fixes.
- [scrollbar-gutter — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter) — `stable` to reserve scrollbar space and kill the width-jump; support/baseline notes.
- [CSS subgrid — web.dev](https://web.dev/articles/css-subgrid) — inheriting parent named lines so nested figures can still reach the page edge (Baseline 2023).
- [Container query length units — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries#container_query_length_units) — `cqw` excludes the scrollbar, the clean single-value bleed when you can't own the grid.
