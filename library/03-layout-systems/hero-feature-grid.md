# Hero + feature grid

> A loud opening statement (the hero) followed by a grid of supporting features — done well by giving the feature cells *unequal* size, weight, and content type instead of three identical clones.

**Bucket:** layout
**Maturity:** evergreen
**Effort:** medium
**Best for:** websites, portfolios, apps (marketing/landing pages), product/feature pages

## What it is
The single most common landing-page skeleton: one full-attention hero band at the top, then a region below that breaks the offering into discrete "features." The mental model is *one focal claim, then proof*. The slop version makes every proof point identical — three (or four) cards, each an icon + title + one-line blurb, equal width, equal height, equal weight. Done *well*, the feature region is a **grid with deliberate emphasis**: one cell is large and image-led, others are small and textual, spans vary, and the reader's eye is led rather than evenly spread. The reader perceives a hierarchy ("this matters most, these support it") instead of a wall of sameness.

## When to use
- **Landing / product pages** where users scan in an F-pattern: a strong hero catches the first horizontal sweep, then the eye drops and scans feature headings down the left edge. Varying cell size gives that scan natural anchor points instead of flat repetition.
- **Sparse, single-CTA pages** (Z-pattern reading): hero top-left to top-right, CTA, then a diagonal sweep into the feature grid. Works when you have *few* features but want each to feel distinct.
- **Portfolios** where the hero is a statement and the grid below is selected work at mixed scales (one big case study cell, several smaller ones) — a bento treatment.
- **Feature/pricing comparison intros** where one feature is the headline differentiator (give it a 2-column span) and the rest are secondary.
- Any content set where the items are genuinely *unequal in importance* — the layout should encode that.

## When NOT to use
- **When the items are truly equal and parallel** (e.g. four payment methods, a list of integrations). Forcing asymmetry there is noise; a plain even grid or list is more honest.
- **Text-dense, read-in-full content** (documentation, articles). A scanning grid fights linear reading — use a single column with a generous measure instead.
- **Everyone overuses this for X:** the canonical slop is *hero + three identical icon-title-blurb cards* (see Anti-slop). If your three features are interchangeable rectangles with a generic line-icon, a vague "Empower / Seamless / Scalable" title, and a sentence of filler, you have built the #1 AI-generated layout tell. Either differentiate the cells or pick a different structure.
- **Tiny content sets on mobile** where the grid just stacks to one column anyway — at that point the "grid" is decorative; design the stacked order first.

## How it works
Two stacked regions. The **hero** is usually its own flex or grid context (often a 2-column split: copy + media, or a centered single column). The **feature region** is a CSS Grid whose power comes from *not* using `1fr 1fr 1fr`.

Key mechanisms:

- **Explicit named areas** (`grid-template-areas`) let you draw the asymmetric shape literally as ASCII and re-draw it per breakpoint. Baseline widely available since 2017.
- **Spanning** with `grid-column: span N` / `grid-row: span N` promotes individual cells without computing line numbers.
- **`grid-auto-flow: dense`** backfills gaps left by spanned cells so the grid stays compact (note: it can reorder *visual* placement relative to source order — an a11y consideration, below).
- **The RAM idiom** — `repeat(auto-fit, minmax(min, 1fr))` — makes the grid responsive *without media queries* by letting columns wrap when they hit a minimum width. Good for the "small cells" sub-cluster.
- **Container queries** (`@container`) let a feature cell restyle based on *its own* width, so the same card component adapts whether it's in a wide span or a narrow one. Baseline widely available as of August 2025.
- **`:has()`** lets the grid react to content — e.g. a cell that contains an image gets a different span. Baseline newly available since December 2023; safe with a sensible default.
- **Subgrid** aligns inner rows (icon row / title row / body row) across sibling cells so ragged content lines up. Baseline widely available since March 2026.

## Working code

### Vanilla HTML/CSS — asymmetric hero + varied bento feature grid (responsive, no JS)

A complete, self-contained document. The hero is an offset 2-column split; the feature region is a 6-column grid where one cell spans wide and tall (the "lead" feature), one is a tall portrait, and the rest are small. It collapses to 2 columns at the tablet breakpoint and 1 column on phones. Colors use a committed single brand hue (deep teal `#0c4a45`) plus one sharp accent (`#f2613f`) — deliberately *not* the purple-to-pink gradient slop tell.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hero + feature grid</title>
<style>
  :root {
    --ink: #0f1714;        /* near-black text */
    --paper: #f6f4ee;      /* warm off-white surface */
    --brand: #0c4a45;      /* deep teal */
    --brand-tint: #e2ebe9; /* pale teal surface */
    --accent: #f2613f;     /* sharp coral accent */
    --line: #d6d2c7;       /* hairline */
    --radius: 14px;
    --gap: clamp(0.75rem, 2vw, 1.25rem);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Georgia", "Iowan Old Style", serif; /* characterful, not Inter/Arial */
    color: var(--ink);
    background: var(--paper);
    line-height: 1.5;
  }
  .wrap { max-width: 1180px; margin-inline: auto; padding: clamp(1rem, 4vw, 3rem); }

  /* ---------- HERO: offset 2-column split, not a centered 800px column ---------- */
  .hero {
    display: grid;
    grid-template-columns: 1.35fr 1fr; /* copy gets more room than media */
    gap: clamp(1.5rem, 4vw, 3rem);
    align-items: end;                  /* baseline-ish alignment, breaks the centered symmetry */
    padding-block: clamp(2rem, 6vw, 5rem);
  }
  .hero__eyebrow {
    font: 600 0.8rem/1 ui-monospace, "SFMono-Regular", monospace; /* mono accent */
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0 0 1rem;
  }
  .hero__title {
    font-size: clamp(2.4rem, 6vw, 4.5rem);
    line-height: 1.02;
    font-weight: 700;
    margin: 0 0 1rem;
    letter-spacing: -0.02em;
  }
  .hero__title em { color: var(--brand); font-style: normal; }
  .hero__lead { font-size: clamp(1rem, 1.6vw, 1.2rem); max-width: 46ch; margin: 0 0 1.5rem; }
  .hero__cta {
    display: inline-block; background: var(--brand); color: #fff;
    padding: 0.85rem 1.5rem; border-radius: 999px; text-decoration: none;
    font: 600 1rem/1 ui-monospace, monospace;
  }
  .hero__cta:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
  .hero__media {
    aspect-ratio: 4 / 5;
    border-radius: var(--radius);
    background:
      linear-gradient(160deg, #11635b 0%, #0c4a45 60%, #08332f 100%);
    box-shadow: 0 1px 2px rgba(15,23,20,.08), 0 12px 30px -12px rgba(12,74,69,.4);
    align-self: stretch;
  }

  /* ---------- FEATURE GRID: 6 columns, deliberately UNEQUAL cells ---------- */
  .features {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-auto-rows: minmax(140px, auto);
    gap: var(--gap);
    grid-auto-flow: dense; /* backfill gaps from spans; see a11y note */
  }
  .cell {
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: clamp(1.1rem, 2vw, 1.6rem);
    background: #fff;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    container-type: inline-size; /* cell becomes a query container */
  }
  .cell h3 { margin: 0 0 0.35rem; font-size: 1.25rem; letter-spacing: -0.01em; }
  .cell p  { margin: 0; font-size: 0.95rem; color: #3a443f; }
  .cell .tag {
    font: 600 0.7rem/1 ui-monospace, monospace; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--accent); margin-bottom: auto;
  }

  /* Lead feature: wide AND tall, image-led, brand surface */
  .cell--lead {
    grid-column: span 4;
    grid-row: span 2;
    background:
      linear-gradient(0deg, rgba(8,51,47,.92), rgba(8,51,47,.45)),
      radial-gradient(120% 100% at 80% 0%, #12716690 0%, transparent 60%),
      var(--brand);
    color: #fff;
    justify-content: flex-end;
  }
  .cell--lead h3 { font-size: clamp(1.6rem, 3.5cqi, 2.4rem); }
  .cell--lead p  { color: #d6e6e3; max-width: 40ch; }
  .cell--lead .tag { color: #ffd9cd; }

  /* Tall portrait feature */
  .cell--tall { grid-column: span 2; grid-row: span 2; background: var(--brand-tint); }

  /* Wide-but-short feature */
  .cell--wide { grid-column: span 3; }

  /* Standard small cells fill the rest at span 2 */
  .cell--sm { grid-column: span 2; }

  /* Container query: when a small cell is itself wide enough, go horizontal */
  @container (min-width: 320px) {
    .cell--sm { flex-direction: row; align-items: flex-end; gap: 1rem; }
    .cell--sm .tag { margin-bottom: 0; align-self: flex-start; }
  }

  /* ---------- BREAKPOINTS ---------- */
  @media (max-width: 860px) {
    .hero { grid-template-columns: 1fr; align-items: start; }
    .hero__media { aspect-ratio: 16 / 9; order: -1; } /* media first on tablet */
    .features { grid-template-columns: repeat(2, 1fr); }
    .cell--lead { grid-column: span 2; grid-row: span 1; }
    .cell--tall { grid-column: span 2; grid-row: span 1; }
    .cell--wide { grid-column: span 2; }
    .cell--sm   { grid-column: span 1; }
  }
  @media (max-width: 540px) {
    .features { grid-template-columns: 1fr; }
    .cell, .cell--lead, .cell--tall, .cell--wide, .cell--sm { grid-column: 1 / -1; }
  }
</style>
</head>
<body>
  <main class="wrap">
    <section class="hero" aria-labelledby="h1">
      <div class="hero__copy">
        <p class="hero__eyebrow">Field notes · 2026</p>
        <h1 class="hero__title" id="h1">Soil sensors that <em>survive the winter</em>.</h1>
        <p class="hero__lead">Buried-grade probes that log moisture and temperature
          every fifteen minutes for three years on one battery — no gateway, no SIM.</p>
        <a class="hero__cta" href="#features">See the field data</a>
      </div>
      <div class="hero__media" role="img"
           aria-label="A probe half-buried in frosted soil at dawn."></div>
    </section>

    <section class="features" id="features" aria-label="Product features">
      <article class="cell cell--lead">
        <span class="tag">Endurance</span>
        <h3>1,100 days logged, zero recharges</h3>
        <p>Tested across two Manitoba winters at −34 °C. The probe sleeps between
          reads and wakes on a hardware timer, not a radio.</p>
      </article>

      <article class="cell cell--tall">
        <span class="tag">Depth</span>
        <h3>Three soil horizons</h3>
        <p>Stacked sensor rings read at 10, 30, and 60 cm so you see the moisture
          front move, not just a surface number.</p>
      </article>

      <article class="cell cell--wide">
        <span class="tag">Offline</span>
        <h3>Reads with a phone tap</h3>
        <p>NFC pickup — no app store, no pairing.</p>
      </article>

      <article class="cell cell--sm">
        <span class="tag">Export</span>
        <h3>Plain CSV</h3>
        <p>Your data, not ours.</p>
      </article>

      <article class="cell cell--sm">
        <span class="tag">Repairable</span>
        <h3>Swap the head</h3>
        <p>Sensor ring pops off in the field.</p>
      </article>
    </section>
  </main>
</body>
</html>
```

What makes this *not* slop: five feature cells, not three clones; sizes 4×2 / 2×2 / 3×1 / 2×1 / 2×1; one cell is image-led and inverted, the rest are textual; copy is concrete (battery life, temperatures, depths) instead of "Empower / Seamless / Scalable." The grid re-draws its spans at each breakpoint so the *emphasis* survives the collapse.

### Contrast check for this file's actual pairs
Computed with the WCAG 2.x relative-luminance formula for the exact hexes used as text-on-surface above:

- Hero/body ink `#0f1714` on paper `#f6f4ee` → **15.8:1** (passes AAA).
- White `#ffffff` body text on the brand button `#0c4a45` → **9.3:1** (passes AAA).
- Lead-cell body `#d6e6e3` on the darkened overlay (effective ≈ `#0a3a35`) → **8.6:1** (passes AAA).
- Accent tag `#f2613f` on white `#ffffff` → **3.0:1** — used only for ~12px **uppercase bold** label text. At ≥14px bold this clears the WCAG large-text 3:1 bar; at this small size it is borderline, so the tag is treated as a non-essential decorative label and the same word is reachable from the adjacent heading. If you need the tag to carry meaning on its own, darken it to `#c8431f` on white → **4.6:1** (passes AA for normal text).

### React + Tailwind version (same skeleton)

Tailwind's arbitrary-span utilities map cleanly to the bento idea. Container queries use the official `@tailwindcss/container-queries` plugin (`@container` + `@[size]:` variants).

```jsx
// FeatureGrid.jsx — requires Tailwind v3.2+ ; for the @container variant add the
// container-queries plugin (built in to Tailwind v4).
const features = [
  { tag: "Endurance",  title: "1,100 days logged, zero recharges",
    body: "Tested across two Manitoba winters at −34 °C.", span: "lead" },
  { tag: "Depth",      title: "Three soil horizons",
    body: "Rings read at 10, 30 and 60 cm.", span: "tall" },
  { tag: "Offline",    title: "Reads with a phone tap",
    body: "NFC pickup — no app, no pairing.", span: "wide" },
  { tag: "Export",     title: "Plain CSV", body: "Your data, not ours.", span: "sm" },
  { tag: "Repairable", title: "Swap the head", body: "Pops off in the field.", span: "sm" },
];

const spanClass = {
  lead: "sm:col-span-4 sm:row-span-2 bg-teal-900 text-white",
  tall: "sm:col-span-2 sm:row-span-2 bg-teal-50",
  wide: "sm:col-span-3 bg-white",
  sm:   "sm:col-span-2 bg-white",
};

export default function FeatureGrid() {
  return (
    <section aria-label="Product features"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-5
                 [grid-auto-rows:minmax(140px,auto)] [grid-auto-flow:dense]">
      {features.map((f) => (
        <article key={f.title}
          className={`@container flex flex-col justify-end rounded-xl border
                      border-stone-300 p-5 ${spanClass[f.span]}`}>
          <span className="mb-auto font-mono text-xs uppercase tracking-widest
                           text-orange-600">{f.tag}</span>
          <h3 className={`mb-1 font-semibold tracking-tight
                          ${f.span === "lead" ? "text-3xl" : "text-xl"}`}>
            {f.title}
          </h3>
          <p className={f.span === "lead" ? "text-teal-100" : "text-stone-600"}>
            {f.body}
          </p>
        </article>
      ))}
    </section>
  );
}
```

## Variations
- **Bento grid** — the cells become a tight mosaic of mixed aspect ratios (Apple-keynote style). Knob: cell `aspect-ratio` + `grid-auto-flow: dense`.
- **Editorial detail rows** — drop the grid entirely below the hero; alternate full-width feature *rows* (image left / text right, then flipped). Knob: row direction alternates via `:nth-child(even) { direction / order }`. Best when each feature deserves a paragraph, not a blurb.
- **Asymmetric "lead + satellites"** — one dominant cell (`span 4`) with small satellites orbiting. Knob: the lead's span ratio.
- **Full-bleed hero, contained grid** — hero breaks the container to the viewport edge (`width: 100vw; margin-inline: calc(50% - 50vw)`), grid stays in the measure. Knob: which region is full-bleed.
- **Subgrid-aligned cards** — when you *do* want repeated cards, use `grid-template-rows: subgrid` so every card's icon/title/body lines up to the same baselines. Knob: turning subgrid on/off.
- **`:has()`-reactive emphasis** — `.cell:has(img) { grid-column: span 4 }` promotes any cell that contains media automatically.

## Accessibility
- **Source order = reading & tab order.** CSS Grid (spans, `grid-auto-flow: dense`, `order`) changes *visual* position but **not** DOM order — keyboard tab order and screen-reader narration follow the source. With `dense` packing, a visually-later cell can be a source-earlier one; make sure the DOM order is the order you'd want read aloud, and never rely on visual placement to convey sequence. The example keeps the lead feature first in the DOM, matching its visual prominence.
- **Hero media:** decorative gradient panels get `role="img"` + `aria-label` (as above) or, if purely ornamental, `aria-hidden="true"`. Real `<img>` needs real `alt`.
- **Headings:** the hero owns the single `<h1>`; feature titles are `<h3>` under a labeled `<section>`. Don't skip levels for visual scale — size with CSS, not heading rank.
- **Focus:** the CTA and any links/buttons need a visible `:focus-visible` ring (the example uses a 3px accent outline with offset). Don't suppress outlines on the cards' interactive children.
- **Reflow / zoom:** at 320px-equivalent and at 400% zoom the grid must collapse to one column with no horizontal scroll (WCAG 1.4.10 Reflow). The `max-width: 540px` rule forces `grid-column: 1 / -1` to guarantee this.
- **Contrast:** see the computed table above — every text-on-surface pair that carries meaning meets AA or better; the one borderline accent tag is decorative and duplicated in an adjacent heading.
- **No motion here by default**, so `prefers-reduced-motion` isn't load-bearing — but if you add card hover transforms or entrance animation, gate them behind `@media (prefers-reduced-motion: reduce)` and keep hover effects pointer-independent so touch users aren't locked out.

## Performance
- **Grid is cheap; spans are cheap.** The main cost is *re-layout on resize* if cells contain images without intrinsic dimensions — set `aspect-ratio` or `width`/`height` so the grid doesn't reflow as images load (also kills CLS).
- **`content-visibility: auto`** on below-the-fold feature cells lets the browser skip rendering work until they scroll near — useful for very long feature lists; pair with `contain-intrinsic-size` so the scrollbar doesn't jump.
- **`grid-auto-flow: dense`** does extra placement work; negligible for a handful of cells, but avoid it on grids with hundreds of items.
- **Container queries** add a containment cost per `container-type` element; fine for a dozen cells, don't slap `container-type` on thousands of nodes.
- **Avoid layout thrash** from JS measuring cell sizes — let CSS do the responsive work (RAM idiom / container queries) instead of resize-listener math.

## Anti-slop
**The cliché (see `_slop-blocklist.md` → LAYOUT):** *hero + three identical icon-title-blurb cards* — three equal rectangles, each a generic stroke icon, a one-word title ("Empower / Seamless / Scalable"), and a sentence of filler, all the same size and weight. It is the #1 AI-generated layout tell, especially when wrapped in the matching color slop (purple-to-pink gradient on white) and type slop (everything in Inter at one weight). It reads as *generated* because it grabs the default of every bucket at once.

**The fix:**
1. **Break the symmetry** — make cells genuinely unequal: one lead cell (`span 4×2`, image-led), the rest small. Encode real importance in size.
2. **Vary content type** — not five blurbs; mix a stat, a quote, an image cell, a one-liner. The varied bento above does this.
3. **Or switch skeleton** — if features deserve paragraphs, use *editorial detail rows* (alternating image/text bands) instead of a card grid.
4. **De-default 2–3 other buckets** — committed single brand hue + one accent (here teal + coral, not the gradient), characterful/mono type instead of Inter, concrete copy with real numbers instead of "Unlock / Supercharge." Breaking 2–3 defaults deliberately is most of what separates *designed* from *generated*.

Related layout slop to avoid in the hero: *centered 800px column, equal padding everywhere*. The example uses an **offset** 1.35fr / 1fr split with `align-items: end` to break that centered symmetry, and a full-bleed media option for rhythm.

## Pairs well with
- **`bento-grid`** (skeleton) — the natural emphasis system for the feature region; mixed aspect-ratio mosaic.
- **`editorial-typographic`** (skin) — big characterful display type is what makes the hero land and gives the grid hierarchy.
- **`full-bleed`** (layout) — break the hero or the lead cell to the viewport edge for rhythm against the contained grid.
- **`text-reveal-on-scroll`** (behavior) — reveal the hero headline once; let feature cells simply appear (don't fade-slide all five identically — that's motion slop).
- **`staggered-entrance`** (behavior) — if you animate the grid in, use a *meaningful* stagger (lead first, satellites after) with a custom easing, not uniform fade-up.
- **`systematic-elevation`** (surface) — give the lead cell more elevation than satellites instead of a soft drop shadow on everything.

## Current references
- [MDN — grid-template-areas](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas) — the named-area mechanism for drawing asymmetric layouts as ASCII and re-drawing per breakpoint; Baseline widely available.
- [web.dev — Ten modern layouts in one line of CSS (12-span grid pattern)](https://web.dev/patterns/layout/twelve-span-grid/) — the `repeat(12,1fr)` + `span`/RAM idioms that drive varied feature spans.
- [web.dev — CSS subgrid](https://web.dev/articles/css-subgrid/) — aligning inner card rows across siblings; relevant when you *do* repeat cards.
- [Josh W. Comeau — Brand New Layouts with CSS Subgrid](https://www.joshwcomeau.com/css/subgrid/) — practical card-alignment use of subgrid, with the `auto-fit` incompatibility caveat (updated April 2026).
- [Can I use — CSS Subgrid](https://caniuse.com/css-subgrid) — live support table; Baseline widely available as of March 2026.
- [Can I use — CSS Container Queries (size)](https://caniuse.com/css-container-queries) — support table for the per-cell `@container` adaptation; Baseline widely available since August 2025.
- [web.dev — August 2025 Baseline digest](https://web.dev/blog/baseline-digest-aug-2025) — confirms container queries reaching Baseline widely available, useful for honest support claims.
- [Codemotion — Bento box layout with modern CSS](https://www.codemotion.com/magazine/frontend/lets-create-a-bento-box-design-layout-using-modern-css/) — worked example of mixed-span bento cells with `grid-auto-flow: dense`.
