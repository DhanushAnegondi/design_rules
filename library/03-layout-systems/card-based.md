# Card-based layout

> A responsive grid of self-contained "card" units — each bundling an image, heading, and metadata into one tappable block — that reflows its column count automatically as the container resizes.

**Bucket:** layout
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, apps, dashboards, carousels

## What it is
A card is a small, self-contained surface that groups a related cluster of content — typically media + title + supporting text + an action — and reads as one object. A card-based *layout* tiles many of those objects into a fluid grid that adds and removes columns on its own as space allows. The mental model is a deck of index cards laid on a table: the reader scans them as discrete, parallel, interchangeable items rather than reading a continuous flow. The modern engine is CSS Grid with `repeat(auto-fit, minmax(...))`, which decides the column count from the available width instead of from hand-written breakpoints.

## When to use
- **Browsing/scanning a set of peers** where each item is independent and order is loose — products, articles, projects, team members, search results. The eye moves in a lawn-mower / spotted scan, jumping between visually identical entry points rather than reading top-to-bottom.
- **Image-led collections** where a thumbnail does most of the identifying work (portfolio pieces, recipes, real-estate listings).
- **Dashboards** where each card is a self-contained widget (a metric, a chart, a feed).
- **Mixed-density catalogs** that must work from a 320px phone to an ultrawide monitor without a designer hand-authoring every breakpoint — `auto-fit`/`minmax()` does it for free.
- **Touch targets matter:** a whole card makes a large, forgiving tap target, which suits mobile and TV/remote navigation.

## When NOT to use
- **Linear, ordered reading** — a tutorial, a legal document, a single article body. Cards fragment prose into disconnected boxes and destroy reading flow. (See "fragments content" below.)
- **The slop default:** *hero + three identical icon-title-blurb cards* as a feature section (see Anti-slop). When you only have 3–6 items and they aren't really a browsable set, a card grid is decorative packaging, not structure.
- **A handful of items that deserve emphasis** — forcing 3 unequal things into 3 equal cards flattens hierarchy. Use an editorial/asymmetric layout instead.
- **Comparing items field-by-field** — a table beats cards because it aligns values into scannable columns; cards scatter the same field to a different spot in each box.
- **Very long lists (hundreds+)** — card grids get heavy (each card is many DOM nodes + an image). Prefer a virtualized list/table, or paginate.
- **When cards become "boxes around everything"** — over-carding adds borders, shadows, and padding that eat space and raise visual noise without adding meaning.

## How it works
The core trick: let the grid compute its own column count from the container width.

- `grid-template-columns: repeat(auto-fit, minmax(MIN, 1fr))` asks for "as many columns of at least `MIN` as fit; share leftover space equally." As the container narrows past a multiple of `MIN`, a column drops; as it widens, one is added. No media queries required.
- **`auto-fit` vs `auto-fill`:** both create as many tracks as fit. `auto-fill` *keeps* the empty leftover tracks (so a lone card stays its min width, with blank columns beside it). `auto-fit` *collapses* the empty tracks to 0 and lets the filled ones stretch to fill the row. Use `auto-fit` when you want items to grow to fill the row; `auto-fill` when you want a stable column rhythm and don't want a single item ballooning.
- **Overflow guard:** a raw `minmax(280px, 1fr)` overflows when the container is narrower than `MIN` (e.g. 280px on a 320px phone minus padding). Fix with `minmax(min(100%, 280px), 1fr)` — `min(100%, 280px)` resolves to `100%` (full container) when space is tight and to `280px` otherwise, killing the horizontal scrollbar.
- **Equal-height rows** are free: grid rows size to the tallest cell, and stretching each card to `height: 100%` (or relying on the default `align-items: stretch`) makes all cards in a row match.
- **Aligning the *insides*** (so every "Read more" / footer sits on the same baseline across cards) needs more than equal outer height. Two options: make each card a flex column and push the footer down with `margin-top: auto`; or, for cross-card alignment of multiple internal rows, use **subgrid** (`grid-template-rows: subgrid`) so each card inherits the grid's row tracks and its heading/body/footer line up across the whole row.
- **Container queries** (`container-type: inline-size` + `@container`) let an individual card restyle based on *its own* width — e.g. switch from stacked to side-by-side image when the card itself is wide — which a media query (tied to viewport, not card) can't do. This makes one card component reusable in a wide hero slot and a narrow sidebar.
- **Whole-card click** is done in CSS, not by wrapping everything in one `<a>`: keep a real link on the heading, then stretch its `::after` pseudo-element over the card (`position:absolute; inset:0`) so the entire surface is clickable while screen readers announce only the concise heading text.

Key APIs: CSS Grid, `minmax()`, `min()`, `auto-fit`/`auto-fill`, subgrid (Grid Level 2), container queries, `:focus-within`, the `::after` overlay pattern.

## Working code

### Vanilla HTML/CSS — fluid card grid, equal heights, whole-card clickable, no media queries

This document renders a responsive grid: columns are computed by `auto-fit`/`minmax()`, the overflow guard keeps it safe down to ~280px, each card is equal-height, the heading link's `::after` makes the whole card clickable, a secondary tag link stays independently clickable, and `:focus-within` lifts the card on keyboard focus.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Card grid</title>
<style>
  :root {
    --ink: #1a1a1f;        /* 17.33:1 on #fff, 15.50:1 on page bg — AAA */
    --muted: #55555f;      /* 7.37:1 on #fff, 6.59:1 on page bg — AAA */
    --accent: #b4451f;     /* rust; 5.51:1 on #fff — AA (links) */
    --page: #f4f2ee;       /* warm off-white, not default SaaS white */
    --card: #ffffff;
    --line: #e4e0d8;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--page);
    color: var(--ink);
    font-family: "Geist", system-ui, sans-serif;
    line-height: 1.5;
    padding: clamp(1rem, 4vw, 3rem);
  }

  /* The whole engine: column count derives from container width. */
  .grid {
    display: grid;
    gap: 1.25rem;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 17.5rem), 1fr));
    /* min(100%, 17.5rem) => 100% when container < 280px (no overflow),
       else 280px. auto-fit collapses empty tracks so filled cards stretch. */
    max-width: 76rem;
    margin-inline: auto;
  }

  .card {
    position: relative;          /* anchor for the ::after overlay */
    display: flex;
    flex-direction: column;      /* lets footer be pushed down */
    height: 100%;                /* equal-height within the row */
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 12px;
    overflow: hidden;
    transition: transform .18s cubic-bezier(.2,.7,.3,1), box-shadow .18s;
  }
  /* Hover AND keyboard focus get the same affordance. */
  .card:hover,
  .card:focus-within {
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(26,26,31,.12);
  }

  .card__media {
    aspect-ratio: 3 / 2;
    width: 100%;
    object-fit: cover;
    display: block;
    background: #ddd6cc;         /* placeholder tone while img loads */
  }
  .card__body {
    display: flex;
    flex-direction: column;
    gap: .5rem;
    padding: 1rem 1.1rem 1.2rem;
    flex: 1;                     /* fill the card so footer sinks to bottom */
  }
  .card__kicker {
    font-size: .75rem;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0;
  }
  .card__title { font-size: 1.15rem; margin: 0; line-height: 1.25; }
  .card__title a {
    color: var(--ink);
    text-decoration: none;
  }
  .card__title a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  /* The overlay: stretches the heading link across the whole card. */
  .card__title a::after {
    content: "";
    position: absolute;
    inset: 0;                    /* top/right/bottom/left: 0 */
  }
  .card__desc { color: var(--muted); margin: 0; font-size: .95rem; }

  .card__footer {
    margin-top: auto;            /* equal-height inner alignment without subgrid */
    padding-top: .9rem;
    display: flex;
    gap: .5rem;
    flex-wrap: wrap;
  }
  /* Secondary link must sit ABOVE the overlay to stay clickable. */
  .tag {
    position: relative;
    z-index: 1;
    font-size: .8rem;
    color: var(--accent);
    text-decoration: none;
    border: 1px solid currentColor;
    border-radius: 999px;
    padding: .2rem .6rem;
  }
  .tag:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    .card { transition: none; }
    .card:hover, .card:focus-within { transform: none; }
  }
</style>
</head>
<body>
  <h1>Field notes</h1>
  <!-- A list is the correct semantics: a set of peer items. -->
  <ul class="grid" style="list-style:none; margin:0; padding:0;">
    <li class="card">
      <img class="card__media" src="https://picsum.photos/seed/a/600/400" alt="">
      <div class="card__body">
        <p class="card__kicker">Field guide</p>
        <h2 class="card__title">
          <a href="/notes/coastal-grasses">Mapping coastal grasses after the storm surge</a>
        </h2>
        <p class="card__desc">Six weeks of transect walks along the spit, and what came back first.</p>
        <div class="card__footer">
          <a class="tag" href="/topics/ecology">Ecology</a>
          <a class="tag" href="/topics/fieldwork">Fieldwork</a>
        </div>
      </div>
    </li>
    <li class="card">
      <img class="card__media" src="https://picsum.photos/seed/b/600/400" alt="">
      <div class="card__body">
        <p class="card__kicker">Interview</p>
        <h2 class="card__title">
          <a href="/notes/lighthouse-keeper">The last keeper of the Brae Head light</a>
        </h2>
        <p class="card__desc">A short, much longer body line to prove the cards still match height across the row.</p>
        <div class="card__footer">
          <a class="tag" href="/topics/people">People</a>
        </div>
      </div>
    </li>
    <li class="card">
      <img class="card__media" src="https://picsum.photos/seed/c/600/400" alt="">
      <div class="card__body">
        <p class="card__kicker">Method</p>
        <h2 class="card__title">
          <a href="/notes/tide-tables">Reading tide tables without the app</a>
        </h2>
        <p class="card__desc">Lunar arithmetic you can do on the back of a ferry ticket.</p>
        <div class="card__footer">
          <a class="tag" href="/topics/skills">Skills</a>
        </div>
      </div>
    </li>
  </ul>
</body>
</html>
```

### Subgrid variant — align headings, body, and footers across the whole row

When card content varies and you want *every* internal row (title baseline, footer line) to align across the row — not just equal outer height — make each card a subgrid that inherits the parent's row tracks. Replace the `.card`/`.grid` rules above with this. Subgrid is supported in all major browsers (Chrome/Edge 117+, Firefox 71+, Safari 16+); a `@supports` fallback covers the rest.

```css
.grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17.5rem), 1fr));
}
/* Each card spans 4 parent rows and inherits their sizing. */
@supports (grid-template-rows: subgrid) {
  .card {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 4;        /* media / title / desc / footer */
  }
  .card__body { display: contents; } /* let body children land on the subgrid */
}
/* Fallback: flex column + margin-top:auto (the vanilla version above). */
@supports not (grid-template-rows: subgrid) {
  .card { display: flex; flex-direction: column; }
  .card__footer { margin-top: auto; }
}
```

### React + Tailwind — same grid, same overlay pattern

```jsx
// Tailwind: the arbitrary value reproduces minmax(min(100%,17.5rem),1fr).
const cards = [
  { href: "/notes/coastal-grasses", kicker: "Field guide",
    title: "Mapping coastal grasses after the storm surge",
    desc: "Six weeks of transect walks along the spit.",
    img: "https://picsum.photos/seed/a/600/400",
    tags: [["Ecology", "/topics/ecology"], ["Fieldwork", "/topics/fieldwork"]] },
  { href: "/notes/lighthouse-keeper", kicker: "Interview",
    title: "The last keeper of the Brae Head light",
    desc: "A longer line to prove equal heights hold.",
    img: "https://picsum.photos/seed/b/600/400",
    tags: [["People", "/topics/people"]] },
];

export function CardGrid() {
  return (
    <ul className="grid gap-5 list-none p-0 m-0
                   [grid-template-columns:repeat(auto-fit,minmax(min(100%,17.5rem),1fr))]">
      {cards.map((c) => (
        <li
          key={c.href}
          className="group relative flex h-full flex-col overflow-hidden rounded-xl
                     border border-[#e4e0d8] bg-white transition
                     hover:-translate-y-0.5 hover:shadow-lg focus-within:-translate-y-0.5
                     focus-within:shadow-lg motion-reduce:transform-none motion-reduce:transition-none"
        >
          <img src={c.img} alt="" className="block aspect-[3/2] w-full object-cover" />
          <div className="flex flex-1 flex-col gap-2 p-4">
            <p className="m-0 text-xs uppercase tracking-wider text-[#55555f]">{c.kicker}</p>
            <h2 className="m-0 text-lg leading-tight">
              {/* ::after stretches the link over the whole card */}
              <a href={c.href}
                 className="text-[#1a1a1f] no-underline after:absolute after:inset-0
                            focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b4451f]">
                {c.title}
              </a>
            </h2>
            <p className="m-0 text-sm text-[#55555f]">{c.desc}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-3">
              {c.tags.map(([label, href]) => (
                // relative + z-10 keeps secondary links above the overlay
                <a key={href} href={href}
                   className="relative z-10 rounded-full border border-[#b4451f] px-2.5 py-0.5
                              text-xs text-[#b4451f] no-underline">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

## Variations
- **`auto-fit` vs `auto-fill`** — the knob is "stretch to fill the row" vs "keep a stable column width and leave gaps." A single trailing card balloons under `auto-fit`; stays put under `auto-fill`.
- **Fixed column count with graceful collapse** — `repeat(auto-fit, minmax(...))` is fluid; for a capped count use explicit tracks at breakpoints, or `grid-template-columns: repeat(3, 1fr)` with a container query that drops to 2 then 1.
- **Featured / spanning card** — let one card span two columns/rows (`grid-column: span 2`) to break the monotony; this is the bridge toward a **bento grid**.
- **Horizontal card** (media beside text) vs **vertical card** (media on top) — flip via a container query on the card's own width, so the same component adapts to wide vs narrow slots.
- **Bordered vs borderless vs elevated** — the surface knob: hairline border, no chrome (whitespace separates), or a systematic shadow scale. Pick one elevation language, not all three.
- **Masonry-style** (uneven heights) — different layout; native CSS masonry is still experimental/behind flags as of 2026 and not the same as this equal-row grid. See the masonry entry.

## Accessibility
- **Semantics:** a set of peer cards is a list — wrap them in `<ul>`/`<li>` so screen readers announce "list, 12 items" and let users jump item-to-item. Each card's real link lives on its heading (`<h2><a>`), giving a meaningful heading-list and a concise accessible name. **Avoid wrapping the entire card in one `<a>`** — a screen reader then reads every word of image alt + body + tags as the link's name (Adrian Roselli documents 20+ seconds of verbatim link text), which is hostile.
- **Whole-card click via `::after`, not nested links:** stretching the heading link's `::after` over the card keeps one link in the accessibility tree while the whole surface is mouse/touch-clickable. Secondary links (tags, author) must be `position: relative; z-index: 1` to sit above the overlay and stay independently operable.
- **Text selection trade-off:** the `::after` overlay blocks selecting/copying the card's text (the pseudo-element intercepts the drag). Accept it for marketing/browse grids; if copyable text matters, drop the overlay and rely on the heading link alone (smaller hit area) or use the JS `mousedown`/`mouseup`-threshold approach (Heydon Pickering: ignore clicks where the gap exceeds ~200ms, so a text-selection drag doesn't navigate).
- **Reading order = DOM order = visual order.** `auto-fit` reflow never reorders the DOM, so tab order stays correct — good. But do **not** use `order` or `grid-row/column` placement to visually reshuffle cards away from source order; that desyncs tab/reading order from what's seen. Keep source order = visual order.
- **Focus:** every interactive element needs a visible `:focus-visible` ring (the code uses a 2px rust outline at 5.51:1 contrast on white). Mirror hover with `:focus-within` on the card so keyboard users get the same lift/shadow affordance as mouse users.
- **Zoom / reflow:** because tracks are `min(100%, 17.5rem)` based, the grid collapses to a single readable column at 320px and at 400% zoom without horizontal scrolling, satisfying WCAG 1.4.10 Reflow.
- **Images:** decorative card thumbnails take `alt=""`; informative ones need real alt text. Don't duplicate the title in the alt.
- **Contrast (this file's actual pairs):** ink `#1a1a1f` on card white `#ffffff` = 17.33:1; muted `#55555f` on white = 7.37:1; rust link `#b4451f` on white = 5.51:1; ink on page bg `#f4f2ee` = 15.50:1; muted on page bg = 6.59:1 — all meet WCAG AA, most AAA.

## Performance
- **Image weight dominates.** A grid of cards is mostly `<img>` cost. Set explicit `aspect-ratio` (reserves space, prevents layout shift / CLS), `loading="lazy"` on below-the-fold thumbnails, `decoding="async"`, and responsive `srcset`/`sizes`.
- **`content-visibility: auto`** on each card (with a `contain-intrinsic-size` placeholder) lets the browser skip rendering off-screen cards, cutting initial layout/paint cost on long grids — measure before/after, it's a big win on 100+ cards.
- **Avoid layout thrash:** animate only `transform`/`opacity` on hover (the code does), never `width`/`height`/`top` which trigger reflow on every card.
- **Very large grids:** beyond a few hundred cards, the DOM node count (each card = ~8–10 nodes) hurts; paginate, infinite-scroll in batches, or virtualize. `auto-fit` recomputes tracks on resize cheaply, but the node count is the real cost.
- **Subgrid** has no meaningful runtime penalty; it's solved at layout time like normal grid.

## Anti-slop
Cliché (see `_slop-blocklist.md` → LAYOUT): the **hero + three identical icon-title-blurb cards** feature row — three equal boxes, each a generic line icon, a two-word title, and a lorem-ish blurb, usually with a soft drop shadow on every card and a purple-to-pink gradient somewhere above. It signals "generated" because it grabs the default of every bucket at once: equal weighting where there's no real hierarchy, decorative icons that carry no information, and uniform chrome.

The fix:
- If you have only 3–6 marketing points, **don't card them** — use editorial detail rows or a varied **bento grid** where one tile is larger/featured, so visual weight encodes importance.
- If it genuinely is a browsable set, **earn the card** with real content: a meaningful image (not a stock line icon), a specific title, and one concrete supporting fact — not "Empower / Seamless / Elevate" filler.
- Replace the per-card soft shadow with **one systematic elevation** (a single hairline border, or a single shadow token used consistently), and skip the gradient. The companion slop here is the **centered 800px column with equal padding**; a card grid that's just one column of stacked boxes is that cliché wearing card chrome — vary the rhythm with a spanning featured card or a full-bleed media moment.

## Pairs well with
- **Bento grid** — promote one card to span 2×2 and you're halfway to a bento; same `grid` engine, more deliberate sizing.
- **Container queries** — make the card component adapt to its own slot width (wide hero vs narrow sidebar) instead of viewport width.
- **Subgrid** — to line up internal rows (titles, footers) across every card in a row.
- **Skeleton / loading states** — card grids load well as shimmer placeholders sized by the same `aspect-ratio`.
- **Staggered entrance** (scroll/motion) — fade cards in with a small stagger on first view; keep it subtle and respect `prefers-reduced-motion`.
- **Editorial/asymmetric layouts** — to *break* a monotonous grid with a featured row.

## Current references
- [MDN — Auto-placement in grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Auto-placement) — how `auto-fit`/`auto-fill` + `minmax()` derive column count.
- [MDN — Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Subgrid) — Grid Level 2 subgrid, now baseline across major browsers.
- [CSS-Tricks — auto-fill vs auto-fit](https://css-tricks.com/auto-sizing-columns-css-grid-auto-fill-vs-auto-fit/) — Sara Soueidan's canonical visual explainer of the collapse-vs-keep difference.
- [Ahmad Shadeed — A deep dive into CSS Grid minmax()](https://ishadeed.com/article/css-grid-minmax/) — the `minmax(min(100%, Npx), 1fr)` overflow guard for narrow viewports.
- [Adrian Roselli — Block Links, Cards, Clickable Regions, Etc.](https://adrianroselli.com/2020/02/block-links-cards-clickable-regions-etc.html) — why nested whole-card links wreck screen-reader UX, and the heading-link + overlay alternative.
- [Heydon Pickering — Cards (Inclusive Components)](https://inclusive-components.design/cards/) — the `::after` overlay, `:focus-within`, secondary-link layering, and the 200ms text-selection guard.
- [web.dev — CSS subgrid](https://web.dev/articles/css-subgrid) — card-row alignment use cases and worked examples.
