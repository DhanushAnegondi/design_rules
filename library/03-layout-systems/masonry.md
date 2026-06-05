# Masonry layout

> A grid of items packed into fixed-width columns where each item keeps its natural height, so items shift up to fill the gaps left by shorter neighbours — the Pinterest "brick wall" with a ragged bottom edge.

**Bucket:** layout
**Maturity:** cycling-back (native CSS is landing 2025–2026; production still leans on fallbacks)
**Effort:** medium
**Best for:** portfolios, image galleries, websites, dashboards (card feeds), product/media grids

## What it is
Items flow into a set of equal-width columns (or lanes), but unlike a regular grid the rows are *not* aligned — each item sits directly under the previous item in its column, so a short card lets the column climb higher and a tall card pushes it down. The result is a tightly packed wall with no uniform row baseline and a deliberately uneven bottom. The user perceives a dense, browsable mosaic that maximises content per screen and rewards scanning over reading.

## When to use
- **Image/media galleries with varied aspect ratios** — masonry is the right call exactly when cropping every thumbnail to a uniform tile would lose information (photography portfolios, moodboards, product shots). The eye scans the mosaic non-linearly, hunting for the interesting tile.
- **Heterogeneous card feeds** where card height is genuinely content-driven (notes, pins, quotes of different lengths) and forcing equal heights would create ugly whitespace.
- **Discovery / browse surfaces** (Pinterest, Unsplash, Dribbble) where there's no single "next" item the user must read in order — scanning behaviour, not linear reading.
- **Dense dashboards** where widgets have different natural heights and you want vertical space used efficiently rather than ragged equal-height rows.

## When NOT to use
- **Ordered, sequential content** — a blog index, a step list, search results ranked by relevance. Masonry's column-first packing (especially the CSS-columns fallback) breaks the visual left-to-right, top-to-bottom reading order, so item 2 can sit physically below item 5. If order carries meaning, don't.
- **Uniform content** — if every card is the same height, masonry buys you nothing over a plain `grid`. Forcing it is pure decoration.
- **Anything keyboard/screen-reader users must traverse predictably** unless you control focus order (see Accessibility). The visual position and the DOM/tab order routinely disagree.
- **The "just make it Pinterest" reflex.** Masonry is overused for ordinary card grids that have no height variance — the ragged bottom edge then reads as a mistake, not a choice. If the cards are equal height, use a clean `grid` and keep the baseline.

## How it works
Conceptually: define N columns of equal width; walk the items in source order and drop each into the column that is currently shortest (the classic algorithm), or simply down whichever column comes next. Items butt up against the bottom of the item above them in the same column instead of snapping to a shared row line.

There are four real mechanisms, best-first by future-proofing but **not** by current support:

1. **Native CSS masonry / "grid lanes"** — after a multi-year syntax debate the CSS Working Group resolved (Jan 2025) to reuse Grid's templating and placement properties rather than invent a separate module. The shipping syntax is `display: grid-lanes` (and `inline-grid-lanes`): you declare lanes on one axis with `grid-template-columns` and items flow freely on the other axis. The earlier experimental spelling was `grid-template-rows: masonry` on a `display: grid` container — this is what Firefox shipped behind a flag in 2020 and what early Chrome/Safari previews used, and it is being migrated to `grid-lanes`. A future `item-flow` shorthand (with an `item-pack` longhand: `normal | dense || balance`) is proposed to control packing density, but it is not yet implemented. **Honest status (mid-2026):** experimental / not Baseline. Safari shipped the finalized `grid-lanes` syntax first (Technology Preview, late 2025) with stable Safari following; Chrome/Edge had an earlier `display: masonry` variant behind a flag (140, July 2025) now being updated to `grid-lanes`; Firefox has the old `grid-template-rows: masonry` behind `layout.css.grid-template-masonry-value.enabled` in `about:config`. No interoperable, unflagged, all-browser support exists yet — so native masonry is a **progressive enhancement**, never the only implementation.

2. **CSS multi-column (`columns` / `column-count`)** — the oldest pure-CSS fallback. Items flow *down* each column then to the next, kept whole with `break-inside: avoid`. Zero JS, broadly supported (Baseline for years). The catch is reading order: content reads **top-to-bottom-then-across** (col 1 fully, then col 2), so DOM order ≠ left-to-right visual order. Fine for order-agnostic galleries; wrong for ordered feeds.

3. **CSS Grid + JavaScript span/offset** — keep `display: grid` with fixed columns and dense auto-flow, then measure each item and assign a row-span (or a translate offset) so it packs. This preserves left-to-right source order (better a11y than columns) at the cost of a measurement pass and re-layout on resize/content change.

4. **A masonry library** (Masonry.js, Isotope, Muuri, or React-specific like `react-masonry-css` / `masonic`) — absolute-positions every item with JS. Realistic production choice today when you need pixel-tight packing plus animation, but it's the heaviest, ships layout to the main thread, and can flash unstyled content before JS runs.

To control accessible/keyboard order independently of the visual layout, the new **`reading-flow`** property (Chrome 137+, behind the larger CSS reading-order effort) lets a grid/flex container expose a logical focus order — `grid-rows` makes tab order follow visual rows even when packing reordered things. It pairs directly with native masonry and is the spec's answer to the order caveat.

## Working code

### Fallback-first: CSS multi-column (runs everywhere today)
Pure CSS, no JS, broadly supported. Reads down-columns-then-across, so use only for order-agnostic content. Includes responsive column count.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Masonry — CSS columns fallback</title>
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0; padding: 1.25rem;
    background: #0f1216; color: #e8eef2;
    font-family: system-ui, sans-serif;
  }
  .wall {
    /* Responsive column count via width hint, kept whole with break-inside */
    column-width: 16rem;     /* browser fits as many ~16rem cols as it can */
    column-gap: 1rem;
    max-width: 80rem; margin-inline: auto;
  }
  .card {
    break-inside: avoid;          /* never split a card across columns */
    margin: 0 0 1rem;             /* column-gap handles horizontal gap */
    border-radius: 12px;
    background: #1a2029;
    border: 1px solid #2a323d;
    overflow: clip;
    display: inline-block; width: 100%;  /* inline-block avoids top-margin clipping bugs */
  }
  .card figure { margin: 0; }
  .card img { display: block; width: 100%; height: auto; }
  .card figcaption {
    padding: 0.7rem 0.85rem;
    font-size: 0.9rem; line-height: 1.35;
    /* #e8eef2 on #1a2029 ≈ 13.9:1 contrast — passes WCAG AAA */
    color: #e8eef2;
  }
  /* Coarse breakpoint guard for very narrow screens: force a single column */
  @media (max-width: 28rem) { .wall { column-width: auto; column-count: 1; } }
</style></head>
<body>
  <h1 style="max-width:80rem;margin:0 auto 1rem;font-size:1.4rem">Field notes</h1>
  <div class="wall">
    <!-- Varied heights via differing aspect ratios + caption length -->
    <article class="card"><figure>
      <img alt="" width="640" height="900" src="https://picsum.photos/seed/a/640/900">
      <figcaption>Tall portrait — the column climbs less here.</figcaption>
    </figure></article>
    <article class="card"><figure>
      <img alt="" width="640" height="420" src="https://picsum.photos/seed/b/640/420">
      <figcaption>Wide landscape with a longer caption that wraps onto a second line and adds height.</figcaption>
    </figure></article>
    <article class="card"><figure>
      <img alt="" width="640" height="640" src="https://picsum.photos/seed/c/640/640">
      <figcaption>Square.</figcaption>
    </figure></article>
    <article class="card"><figure>
      <img alt="" width="640" height="780" src="https://picsum.photos/seed/d/640/780">
      <figcaption>Another portrait so columns desynchronise.</figcaption>
    </figure></article>
    <article class="card"><figure>
      <img alt="" width="640" height="380" src="https://picsum.photos/seed/e/640/380">
      <figcaption>Short landscape.</figcaption>
    </figure></article>
    <article class="card"><figure>
      <img alt="" width="640" height="540" src="https://picsum.photos/seed/f/640/540">
      <figcaption>Medium — fills a gap left by the row above.</figcaption>
    </figure></article>
  </div>
</body></html>
```

### Progressive enhancement: native `grid-lanes` over a Grid fallback
This degrades to a plain aligned CSS Grid everywhere; in browsers that support native masonry it becomes a true packed wall, and `reading-flow: grid-rows` keeps tab order sane. `@supports` gates the enhancement so unsupported browsers never see broken layout.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Masonry — native grid-lanes with Grid fallback</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; padding:1.25rem; background:#0f1216; color:#e8eef2;
         font-family: system-ui, sans-serif; }

  /* Baseline EVERY browser gets: a responsive, aligned CSS Grid.
     Rows align (not true masonry) but it is never broken. */
  .wall {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 1rem;
    max-width: 80rem; margin-inline: auto;
    align-items: start;        /* don't stretch cards to row height */
  }

  /* Enhancement: real masonry where the engine supports grid-lanes.
     Older preview engines used grid-template-rows:masonry on display:grid —
     add that line too if you must support those builds. */
  @supports (display: grid-lanes) {
    .wall {
      display: grid-lanes;
      grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
      reading-flow: grid-rows; /* tab/AT order follows visual rows, not packing */
    }
  }

  .card {
    border-radius: 12px; background:#1a2029; border:1px solid #2a323d;
    overflow: clip;
  }
  .card img { display:block; width:100%; height:auto; }
  .card figcaption {
    padding:.7rem .85rem; font-size:.9rem; line-height:1.35;
    /* #e8eef2 on #1a2029 ≈ 13.9:1 — WCAG AAA */
    color:#e8eef2;
  }
  .card figure { margin:0; }
  @media (max-width: 28rem) {
    .wall { grid-template-columns: 1fr; }
  }
</style></head>
<body>
  <h1 style="max-width:80rem;margin:0 auto 1rem;font-size:1.4rem">Gallery</h1>
  <div class="wall">
    <article class="card"><figure>
      <img alt="" width="640" height="880" src="https://picsum.photos/seed/g/640/880">
      <figcaption>Portrait.</figcaption></figure></article>
    <article class="card"><figure>
      <img alt="" width="640" height="420" src="https://picsum.photos/seed/h/640/420">
      <figcaption>Landscape with a caption long enough to wrap and add some height.</figcaption></figure></article>
    <article class="card"><figure>
      <img alt="" width="640" height="640" src="https://picsum.photos/seed/i/640/640">
      <figcaption>Square.</figcaption></figure></article>
    <article class="card"><figure>
      <img alt="" width="640" height="760" src="https://picsum.photos/seed/j/640/760">
      <figcaption>Portrait.</figcaption></figure></article>
    <article class="card"><figure>
      <img alt="" width="640" height="380" src="https://picsum.photos/seed/k/640/380">
      <figcaption>Short.</figcaption></figure></article>
    <article class="card"><figure>
      <img alt="" width="640" height="560" src="https://picsum.photos/seed/l/640/560">
      <figcaption>Medium.</figcaption></figure></article>
  </div>
</body></html>
```

### React (production realistic): `react-masonry-css`
When you need order-preserving packing that works in every shipping browser *today* plus easy responsive column counts, a JS library is the pragmatic call. `react-masonry-css` builds real DOM columns and distributes items round-robin in source order, so left-to-right reading order is preserved (unlike CSS `columns`).

```jsx
// npm i react-masonry-css
import Masonry from "react-masonry-css";
import "./masonry.css"; // see CSS below

const breakpoints = { default: 4, 1100: 3, 700: 2, 440: 1 };

export function Gallery({ items }) {
  return (
    <Masonry
      breakpointCols={breakpoints}
      className="masonry"
      columnClassName="masonry__col"
    >
      {items.map((it) => (
        <figure className="card" key={it.id}>
          <img src={it.src} alt={it.alt} width={it.w} height={it.h} loading="lazy" />
          <figcaption>{it.caption}</figcaption>
        </figure>
      ))}
    </Masonry>
  );
}
```

```css
/* masonry.css */
.masonry { display: flex; gap: 1rem; max-width: 80rem; margin-inline: auto; }
.masonry__col { display: flex; flex-direction: column; gap: 1rem; }
.card {
  border-radius: 12px; background:#1a2029; border:1px solid #2a323d; overflow:clip;
}
.card img { display:block; width:100%; height:auto; }
.card figcaption {
  padding:.7rem .85rem; font-size:.9rem; line-height:1.35;
  /* #e8eef2 on #1a2029 ≈ 13.9:1 — WCAG AAA */
  color:#e8eef2;
}
.card figure { margin:0; }
```
Note: `react-masonry-css` distributes by simple round-robin (item *i* → column *i % n*), which keeps source order but does **not** balance by measured height, so columns can end up uneven. For true shortest-column balancing with animation, reach for `masonic`, `muuri`, or Isotope — heavier, JS-positioned.

## Variations
- **Vertical vs horizontal masonry** — columns with ragged bottom (the default) vs lanes-as-rows with a ragged right edge (`grid-template-rows` defining lanes, items flowing across).
- **Packing order knob** — *source order* (CSS columns, round-robin libs; predictable, can leave a column taller) vs *shortest-column balancing* (classic Masonry.js / `masonic`; visually even, reorders items). The proposed `item-pack: normal | dense | balance` will expose this natively.
- **Gutter** — uniform `gap` vs the "gapless" edge-to-edge mosaic (Pinterest uses a small consistent gap; gapless reads more like a contact sheet).
- **Fixed columns vs auto-fill** — pin N columns at breakpoints vs `repeat(auto-fill, minmax())` that adds columns as width allows.
- **Featured spans** — let select items span 2 columns for editorial emphasis (native grid placement handles this; libraries need explicit width hints).

## Accessibility
- **Reading order / tab order vs visual order — the core masonry hazard.** The CSS `columns` fallback reads top-to-bottom *down each column* then across, so the DOM order (and therefore screen-reader and Tab order) does not match the left-to-right visual scan. With native `grid-lanes`, auto-placement can also reorder items so visual rows don't match source order. **Fix:** keep DOM order = intended logical order, and use `reading-flow: grid-rows` (Chrome 137+, progressively enhancing) on the container so keyboard focus and assistive-tech traversal follow visual rows. Where `reading-flow` isn't supported, prefer the order-preserving approaches (CSS Grid+JS span, or a round-robin library) over CSS `columns` for any content where order matters.
- **Focus / keyboard:** never use positive `tabindex` to "fix" order — it's brittle and `reading-flow` ignores it anyway. Ensure interactive cards have a visible focus ring (`:focus-visible`) since the eye may be elsewhere in the mosaic when focus moves.
- **Responsive / zoom / reflow:** all snippets reflow to fewer columns at narrow widths and collapse to a single column on small screens, satisfying WCAG 1.4.10 Reflow (no horizontal scroll at 320px). Because `column-width`/`auto-fill` are width-driven, 200–400% browser zoom simply reduces column count gracefully rather than clipping.
- **Screen-reader implications:** masonry is purely visual packing — wrap the set in a landmark or `role="list"` with `role="listitem"` children if the items are a true list, and give every image a real `alt`. Don't let a JS library that absolute-positions items strip semantics; verify the DOM still announces in a sensible order.
- **Motion:** if you animate items into place (Muuri/Isotope reflow transitions), gate it behind `@media (prefers-reduced-motion: reduce)` and snap to final positions instead — packing animation is decorative and can cause vestibular discomfort.

## Performance
- **Layout thrash / forced reflow:** JS masonry that measures then positions every item triggers synchronous layout; batch reads then writes, and avoid re-measuring on every scroll. Library `relayout()` on resize should be debounced.
- **CLS / image jank:** always set `width`/`height` (or `aspect-ratio`) on images so the browser reserves space before load — otherwise the wall re-packs as each image arrives, causing cumulative layout shift. Use `loading="lazy"` for off-screen tiles.
- **Large grids:** hundreds of cards in a JS-positioned wall is expensive on the main thread; virtualize (render only near-viewport items, e.g. `masonic`'s windowing) for long feeds. Native `grid-lanes` and CSS `columns` stay on the compositor and scale far better than JS positioning.
- **`content-visibility: auto`** on off-screen cards lets the browser skip rendering work for items below the fold — big win for long masonry feeds; pair with `contain-intrinsic-size` to keep scrollbar stability.

## Anti-slop
Cliché (see `_slop-blocklist.md` → LAYOUT): the reflexive "make it Pinterest" wall applied to **equal-height, equal-weight cards** — which is really the *hero + three identical icon-title-blurb cards* slop wearing a ragged hem, plus the *centered 800px column equal padding* monotony broken only by jitter. If every card is the same height, masonry's uneven bottom edge looks like a bug, not a decision. Tasteful alternative: use masonry only when item heights are *genuinely* content-driven (varied photography, mixed-length notes); for uniform content use a clean aligned `grid` with a deliberate full-bleed or 2-column-span feature item to create rhythm (an *editorial/bento* move) instead of faking variance. And commit to one consistent gap — random gutters read as broken, not organic.

## Pairs well with
- **Bento grid** — for uniform/curated content, a bento grid (named areas, deliberate spans) is the designed counterpart to masonry's emergent packing; reach for it when you want control rather than flow.
- **Card-based layout** — masonry is a *packing strategy* for cards; the card skin (radius, elevation, hover) lives in that entry.
- **Container queries** — size each card's internal layout to its own column width rather than the viewport, so a card looks right whether it's in a 2- or 4-column wall.
- **Lazy-load / scroll-triggered reveal** — masonry feeds are usually infinite; fade tiles in on intersection (gated by `prefers-reduced-motion`) and append pages as the user scrolls.
- **`:has()` and `reading-flow`** — fix focus order and conditionally restyle the container based on its children.

## Current references
- [Masonry layout — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Masonry_layout) — canonical syntax (`display: grid-lanes`) and the "limited availability / not Baseline" support warning.
- [When will CSS Grid Lanes arrive? — WebKit (Dec 2025)](https://webkit.org/blog/17758/when-will-css-grid-lanes-arrive-how-long-until-we-can-use-it/) — the syntax-war resolution, Safari shipping order, and the focus/reading-order caveat vs multicolumn.
- [Masonry Layout is Now grid-lanes — CSS-Tricks (Dec 2025)](https://css-tricks.com/masonry-layout-is-now-grid-lanes/) — why the WG reused Grid properties, and the proposed `item-flow` / `item-pack` packing controls.
- [Masonry in CSS: Should Grid Evolve or Stand Aside? — Smashing Magazine (May 2025)](https://www.smashingmagazine.com/2025/05/masonry-css-should-grid-evolve-stand-aside-new-module/) — the full debate between the grid-integrated and separate-module camps.
- [Use CSS reading-flow for logical sequential focus navigation — Chrome for Developers](https://developer.chrome.com/blog/reading-flow) — `reading-flow: grid-rows`, the spec's fix for masonry's tab-order problem (Chrome 137+).
- [reading-flow — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/reading-flow) — values (`grid-rows`, `grid-columns`, `source-order`) and how it scopes focus order.
- [Native CSS Masonry Layout in CSS Grid — Smashing Magazine](https://www.smashingmagazine.com/native-css-masonry-layout-css-grid/) — worked examples and the columns-vs-grid fallback trade-offs.
