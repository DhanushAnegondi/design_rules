# Magazine / editorial grid

> A many-column print-style grid where columns vary in width, headlines and pull quotes span multiple columns, images bleed past the text measure, and nested elements snap to shared lines via subgrid.

**Bucket:** layout
**Maturity:** evergreen (the print structure) / current (subgrid + container-query implementation)
**Effort:** high
**Best for:** websites, editorial/news sites, long-form articles, portfolios, brand/marketing pages

## What it is
A magazine grid borrows the page architecture of print editorial: a base of many narrow columns (often 12, sometimes a 6/8/16 base) that individual elements *span* in deliberately uneven amounts. A lead paragraph might occupy columns 1–5, a portrait image bleeds from column 7 to the page edge, a pull quote straddles columns 4–9 in a heavier type, and footnotes hang in a single narrow column at the side. The reader perceives *hierarchy and rhythm* — some things are wide and loud, some are narrow and quiet — rather than the uniform card-row uniformity of most SaaS pages. The modern web version is built with CSS Grid for the macro structure, `subgrid` so nested blocks align to the page's lines, and container queries so the rhythm reflows by available width rather than by device.

## When to use
- **Long-form reading** (essays, features, case studies) where you want print's *measure discipline* — body text held to a comfortable ~60–75ch column while images, captions, and quotes break out around it. This supports relaxed left-to-right line scanning without the eye traveling too far per line.
- **Content with intrinsic hierarchy**: a hero story plus secondary stories plus marginalia. The varied spans *encode* importance, which is exactly how readers triage a magazine cover or contents page (large = read this first).
- **Editorial/brand sites** that want to feel authored and art-directed rather than templated.
- **Cross-element alignment needs**: a row of feature blurbs whose headlines, body, and "read more" links must sit on the same baselines regardless of text length — the canonical subgrid use case.
- **Portfolios** where asymmetric image bleeds and offset captions create a curated, gallery-like scan.

## When NOT to use
- **App UIs and dashboards** where users perform repeated tasks. Asymmetry that delights a reader becomes friction for someone hunting the same control twice; those want predictable, scannable alignment, not editorial surprise.
- **Pure data tables / list views** — a magazine grid adds nothing and fights the tabular reading pattern.
- **Tiny content**: if you have one heading and two paragraphs, a multi-column editorial scaffold is over-engineering; a single well-set column is better.
- **The overuse warning**: teams reach for the *opposite* slop — "hero + three identical icon-title-blurb cards" — when they should reach for editorial, and they reach for fake editorial (random spans with no reading logic) when they should reach for a plain column. A magazine grid only works if the spans map to real content priority; decorative asymmetry with placeholder copy reads as chaos, not design.
- When the team can't commit to producing *real, varied content* (different-length stories, actual photography). Editorial grids expose thin content mercilessly.

## How it works
The mechanism is "one shared coordinate system, many uneven occupants."

1. **Macro grid** — declare a column track set on the page container. A 12-column base (`repeat(12, 1fr)`) plus named bleed lines lets any element claim an arbitrary span with `grid-column: <start> / <end>`. Add a `minmax()` content column so the text measure never exceeds a readable `ch`.
2. **Full-bleed escape** — name lines at the viewport edge (`[full-start] ... [content-start] ... [content-end] ... [full-end]`) so an image can say `grid-column: full-start / full-end` and break the measure on purpose.
3. **`subgrid`** — a child that itself contains a header/body/footer can adopt the parent's tracks with `grid-template-columns: subgrid` (or rows), so its internals align to the *page* lines and to sibling cards — no magic-number duplication. Baseline status: Newly available Sept 2023 (Chrome/Edge 117+, Firefox 71+, Safari 16+); progressed to Widely available in 2026. Still guard with `@supports`.
4. **Baseline alignment** — `align-items: baseline` (and `align-content`) on a grid/flex row snaps text of different sizes to a shared text baseline, the print "baseline grid" effect for headlines next to body.
5. **Column rhythm via container queries** — instead of device media queries, size the *whole grid system* to the container with `@container`, so a magazine grid placed in a narrow sidebar collapses to one column while the same component in a wide region keeps its asymmetry. Container queries are Baseline Widely available (since 2023).
6. **Pull quotes that span** — two routes. In a *CSS multi-column* flow (`columns: 2`), `column-span: all` lets a quote break out across every column (great for a single continuous text river). In a *Grid* layout, you instead place the quote with `grid-column` across the chosen tracks. Grid gives you 2-D control; multicol gives you automatic text balancing in one river — pick per content.
7. **`:has()` for content-aware rhythm** — e.g. give a row extra height *only if* it contains a figure: `.row:has(figure) { ... }`. Baseline Widely available since Dec 2023.

## Working code

### Native CSS — full editorial article (Grid + named bleed lines + subgrid + container queries)
Self-contained; open it in a browser. It renders a 12-column editorial page with a bleeding hero image, an asymmetric lead, a column-spanning pull quote, a baseline-aligned feature row using subgrid, and a marginal note — and it reflows at a container breakpoint.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Editorial grid</title>
<style>
  :root{
    --paper:#f5f2ec; --ink:#1a1a1a; --muted:#5c5853; --rust:#9a3412; --rule:#d9d2c5;
    --measure:68ch;
    --serif: Georgia, "Times New Roman", serif;
    --sans: ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  }
  *{box-sizing:border-box;}
  body{margin:0; background:var(--paper); color:var(--ink); font-family:var(--serif);
       font-size:clamp(1rem,0.95rem + 0.3vw,1.18rem); line-height:1.6;}

  /* The page is itself a container so children react to its width, not the device. */
  .page{container-type:inline-size;}

  /* 12-column macro grid with named full-bleed and content lines. */
  .editorial{
    display:grid;
    grid-template-columns:
      [full-start] minmax(1rem,1fr)
      [content-start] repeat(12,minmax(0,5rem)) [content-end]
      minmax(1rem,1fr) [full-end];
    column-gap:clamp(0.75rem,2cqi,1.75rem);
    row-gap:clamp(1.5rem,4cqi,3rem);
    align-items:start;
  }
  /* Default: any direct child sits in the readable content band. */
  .editorial > *{grid-column:content-start / content-end;}

  /* Hero image bleeds to the viewport edges. */
  .bleed{grid-column:full-start / full-end; margin:0;}
  .bleed img{display:block; width:100%; height:min(56cqi,520px); object-fit:cover;}
  .bleed figcaption{font-family:var(--sans); font-size:0.8rem; color:var(--muted);
      padding:0.4rem 1rem; max-width:var(--measure);}

  .kicker{font-family:var(--sans); text-transform:uppercase; letter-spacing:.14em;
      font-size:.72rem; color:var(--rust); font-weight:700; margin:0;}
  h1.headline{font-size:clamp(2.4rem,3rem + 4cqi,5rem); line-height:1.02; font-weight:800;
      margin:.2rem 0 0; letter-spacing:-.01em; max-width:18ch;}

  /* Asymmetric lead: standfirst sits in the left 5 cols, body river starts offset. */
  .standfirst{grid-column:content-start / span 5; font-size:1.3rem; color:var(--muted);
      line-height:1.45;}
  .body{grid-column:7 / content-end; max-width:var(--measure);}
  .body p{margin:0 0 1rem;}

  /* Pull quote spans the middle tracks and pushes type up loud. */
  .pullquote{grid-column:4 / 11; font-family:var(--sans); font-weight:700;
      font-size:clamp(1.6rem,1.4rem + 2cqi,2.6rem); line-height:1.15;
      color:var(--rust); border-top:3px solid var(--ink); border-bottom:3px solid var(--ink);
      padding:1rem 0; margin:1rem 0;}

  /* Marginal note hangs in a narrow right column, top-aligned to the body. */
  .marginal{grid-column:11 / content-end; font-family:var(--sans); font-size:.82rem;
      color:var(--muted); border-left:2px solid var(--rust); padding-left:.7rem;}

  /* Feature row: three blurbs aligned on shared baselines via SUBGRID. */
  .features{grid-column:content-start / content-end;
      display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem;}
  .feature{display:grid; grid-template-rows:auto 1fr auto; gap:.4rem;
      border-top:1px solid var(--rule); padding-top:.75rem;}
  @supports (grid-template-rows: subgrid){
    .feature{grid-row:span 3; grid-template-rows:subgrid;}  /* internals snap to row lines */
  }
  .feature h3{margin:0; font-family:var(--sans); font-size:1.15rem;}
  .feature p{margin:0; color:var(--muted);}
  .feature a{font-family:var(--sans); font-size:.8rem; color:var(--rust); font-weight:600;
      text-decoration:none;}
  .feature a:focus-visible{outline:2px solid var(--ink); outline-offset:3px;}

  /* Container breakpoint: below 48rem the asymmetry collapses to one honest column. */
  @container (max-width: 48rem){
    .standfirst,.body,.pullquote,.marginal{grid-column:content-start / content-end;}
    .features{grid-template-columns:1fr;}
    .feature{grid-row:auto; grid-template-rows:none;}
    .marginal{border-left:none; border-top:2px solid var(--rust); padding:.6rem 0 0;}
  }
</style></head>
<body>
  <div class="page">
  <article class="editorial">
    <figure class="bleed">
      <img alt="Letterpress type cases in a print workshop"
           src="https://images.unsplash.com/photo-1503694978374-8a2fa686963a?w=1600&q=70">
      <figcaption>The composing room, 1962 — every story began as physical columns of lead.</figcaption>
    </figure>

    <p class="kicker">Typography / craft</p>
    <h1 class="headline">The grid never left the page — it just learned to reflow.</h1>

    <p class="standfirst">Print designers spent a century proving that uneven columns read
      better than equal ones. The browser finally has the tools to honor that lesson.</p>

    <div class="body">
      <p>Set a comfortable measure and the eye relaxes. Let an image bleed past it and the
        page breathes. The trick of editorial layout was never decoration — it was using
        width to signal what matters and pacing to control how fast you read.</p>
      <p>Grid gives you the coordinate system; subgrid keeps nested pieces honest; container
        queries make the rhythm respond to space instead of to a phone.</p>
    </div>

    <blockquote class="pullquote">"A column is a promise about how far your eye has to travel."</blockquote>

    <aside class="marginal">Note: the readable measure here is capped near 68ch — past
      ~75ch, return-sweep errors climb and reading slows.</aside>

    <div class="features">
      <article class="feature">
        <h3>Vary the width</h3>
        <p>Equal columns are the SaaS default. Uneven spans carry meaning the moment content
          differs in importance.</p>
        <a href="#">Read the rule</a>
      </article>
      <article class="feature">
        <h3>Bleed on purpose</h3>
        <p>One full-width image per spread.</p>
        <a href="#">See examples</a>
      </article>
      <article class="feature">
        <h3>Align the baselines</h3>
        <p>Subgrid snaps these three headings, bodies and links to the same lines no matter
          how long each runs — try resizing.</p>
        <a href="#">Try it</a>
      </article>
    </div>
  </article>
  </div>
</body></html>
```
Why it holds together: the three `.feature` cards have different body lengths, but because each is a `subgrid` spanning the same three row tracks, their headings, bodies, and links land on shared lines — that's the cross-element alignment subgrid was built for. Below the 48rem container breakpoint every span resets to the full content band, so the asymmetry never forces horizontal scroll on narrow screens.

### CSS multi-column variant — continuous text river with a spanning pull quote
Use this when the content is *one long river* (a printed-essay feel) rather than placed blocks. `column-span: all` is the print "breakout" superpower.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body{margin:0; background:#f5f2ec; color:#1a1a1a; font-family:Georgia,serif; line-height:1.55;}
  .essay{max-width:72rem; margin:3rem auto; padding:0 1.5rem;
         columns: 22rem;            /* auto column-count: as many 22rem cols as fit */
         column-gap: 2.5rem;
         column-rule: 1px solid #d9d2c5;}
  .essay h1{column-span:all; font-size:clamp(2rem,5vw,3.4rem); margin:0 0 1rem; line-height:1.05;}
  .essay .quote{column-span:all; font-family:ui-sans-serif,system-ui,sans-serif;
      font-weight:700; color:#9a3412; font-size:clamp(1.4rem,4vw,2.2rem); text-align:center;
      border-block:3px solid #1a1a1a; padding:1rem 0; margin:1.5rem 0;}
  .essay p{margin:0 0 1rem; break-inside:avoid-column;} /* avoid widow/orphan splits */
</style></head>
<body>
  <article class="essay">
    <h1>Columns of lead, columns of light</h1>
    <p>The river of text flows top-to-bottom then wraps to the next column automatically.
      You never place a paragraph; you pour text and let the browser balance it.</p>
    <p>This is why news sites reach for multicol: the content is sequential and you want the
      reader to follow one continuous thread.</p>
    <blockquote class="quote">"Pour the text. Let one quote break the river."</blockquote>
    <p>After the quote spans all columns, the river resumes underneath it across the full width
      and re-divides into columns — exactly how a printed feature behaves.</p>
    <p>Multicol auto-balances; it just can't do 2-D placement. For art-directed bleeds and
      offsets, reach for Grid instead.</p>
  </article>
</body></html>
```

### React / Tailwind — subgrid feature row
Tailwind v4 ships `grid-cols-subgrid` / `grid-rows-subgrid` and `@container` utilities. This is the realistic production version of the aligned feature row.

```jsx
// Tailwind v4. Parent defines the tracks; each card is a subgrid spanning 3 rows.
function FeatureRow({ items }) {
  return (
    <div className="@container">
      <ul className="grid grid-cols-1 gap-6 @3xl:grid-cols-3 list-none p-0 m-0">
        {items.map((it) => (
          <li
            key={it.title}
            className="grid grid-rows-[auto_1fr_auto] gap-1.5 border-t border-stone-300 pt-3
                       @3xl:row-span-3 @3xl:grid-rows-subgrid"
          >
            <h3 className="font-sans text-lg m-0">{it.title}</h3>
            <p className="text-stone-600 m-0">{it.body}</p>
            <a
              href={it.href}
              className="font-sans text-sm font-semibold text-orange-800 no-underline
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {it.cta}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```
`@3xl:grid-rows-subgrid` only engages once the *container* (not the viewport) is wide enough; below that each card is a self-contained single column, so short and long bodies never desync.

## Variations
- **Modular grid** (`repeat(12,1fr)` + explicit placement) vs **column grid** (CSS multicol `columns:`): 2-D art direction vs auto-balanced text river. The knob is "do I place blocks or pour text?"
- **Bleed depth**: content-measure → spans-content-band → full-bleed-to-viewport. Named lines (`full-start/full-end`) are the knob.
- **Column rhythm**: symmetric (all equal) → golden/asymmetric (e.g. 5+7, 8+4) → "broken" with offset start lines. The knob is the `grid-column` start/span values mapped to content priority.
- **Hanging marginalia**: footnotes/captions in a dedicated narrow side column vs inline. Knob: reserve a 2–3 track gutter column.
- **Baseline grid on/off**: `align-items: baseline` for cross-size text alignment, optional vertical `line-height`-multiple rhythm.
- **Masonry tail**: a ragged image gallery at the foot of the article (see Performance for native-masonry status).

## Accessibility
- **Reading order vs visual order**: Grid placement (`grid-column`/`grid-row`, `order`, `grid-auto-flow: dense`) changes *visual* position but **not** DOM/tab/screen-reader order. If you visually move the standfirst after the body or reorder cards, a keyboard or screen-reader user still gets DOM order — which can desync from what's seen. Rule: keep DOM order = intended *reading* order, and only use placement for layout, never to fix a wrong source order. Avoid `grid-auto-flow: dense` for content the user reads in sequence (it reorders to fill holes).
- **Focus / keyboard**: interactive elements (the `.feature a` links) carry visible `:focus-visible` outlines in both code samples (`outline:2px solid var(--ink)` / Tailwind `focus-visible:outline-2`). Tab order follows DOM, which here matches the reading flow.
- **Responsive / zoom / reflow**: container queries collapse the asymmetry to a single content-band column under 48rem, so there's no forced horizontal scroll. The body measure is capped (`max-width:68ch`/`72rem`) so at 400% zoom (WCAG 1.4.10 Reflow) text rewraps in one column instead of overflowing. `minmax(0,5rem)` tracks prevent grid blowout from long words.
- **Screen-reader implications**: use semantic elements (`article`, `figure`/`figcaption`, `blockquote`, `aside`) as shown — the layout adds no ARIA debt. A pull quote is usually *duplicated* body text; if it repeats nearby copy verbatim, consider `aria-hidden="true"` on the decorative pull quote so it isn't read twice. Multicol does not alter reading order (it's still one source river), so it's screen-reader safe.
- **Contrast (measured for this file's exact hexes):** ink `#1a1a1a` on paper `#f5f2ec` = **15.58:1**; muted body `#5c5853` on `#f5f2ec` = **6.32:1**; rust accent `#9a3412` on `#f5f2ec` = **6.54:1** (and inverted, paper `#f5f2ec` on rust `#9a3412` = **6.54:1**). All clear WCAG AA (4.5:1) for normal text and the large pull-quote/headline clear AAA large (4.5:1). The kicker uses rust at small size — at 6.54:1 it passes AA for normal text too.

## Performance
- **Layout cost of big grids**: a 12-track grid with explicit placement is cheap; the expense is *re-layout*. Avoid animating grid track sizes (`grid-template-columns` transitions trigger full reflow). Animate `transform` on children instead.
- **Subgrid**: negligible cost; it reuses the parent's resolved tracks rather than computing new ones. It's actually *cheaper* than the JS "equalize heights" hacks it replaces.
- **Container queries**: each `container-type` element becomes a containment root — generally a perf win (scoped layout/paint), but don't wrap *every* node in `container-type:inline-size`; reserve it for the components that actually query.
- **`content-visibility`**: for very long articles or large galleries, add `content-visibility:auto; contain-intrinsic-size: 0 600px;` to offscreen sections so the browser skips their layout until near-viewport — big scroll-perf win, but supply `contain-intrinsic-size` or the scrollbar will jump.
- **Native masonry caution**: as of mid-2026 native masonry shipped in **Safari 26** (as `display: grid-lanes` / `grid-template-rows: masonry`); Chrome/Edge 140+ and Firefox have it behind flags only, not interoperable yet. Don't ship it as the sole mechanism — `@supports` progressively enhance over a Grid `auto-fit` fallback, or use a JS masonry lib for production-critical ragged galleries.
- **Images that bleed**: full-bleed `object-fit:cover` images should carry intrinsic `width`/`height` (or `aspect-ratio`) to avoid CLS, and `loading="lazy"` below the fold.

## Anti-slop
Cliché (see `_slop-blocklist.md` → LAYOUT): the **"hero + three identical icon-title-blurb cards"** row and the **"centered 800px column with equal padding everywhere"** — the two defaults that make a page read as generated. A magazine grid is the *antidote*, but it has its own slop: random column spans with placeholder copy (asymmetry that encodes nothing) and the indigo→pink gradient laid over it. The tasteful fix: (1) make every span map to real content priority — wide = important, narrow = aside; (2) commit to one full-bleed moment per spread instead of bleeding everything; (3) hold body text to a real measure (~60–75ch) even while images break out; (4) drop the gradient and the generic SaaS blue — this file uses a committed ink/paper pair with a single rust accent (`#9a3412`), and a serif body against a sans kicker for deliberate type contrast (avoid Inter-for-everything). Breaking 2–3 bucket defaults on purpose — varied rhythm, real type contrast, committed hue — is what separates designed from generated.

## Pairs well with
- `subgrid` cross-element alignment (the structural backbone here — children adopting parent tracks)
- `full-bleed` layout (the image-breakout moments that give editorial its air)
- `asymmetric-layouts` (the uneven column rhythm is the shared idea)
- `editorial-typographic` / display-type styles (big headlines + measured body are what make the grid read as a magazine)
- `text-reveal-on-scroll` (animate the headline/standfirst as the article enters — reserve it for the focal line, not every block)
- `container-queries` (component-level reflow so the same editorial block survives a sidebar)

## Current references
- [Subgrid — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Subgrid) — definitive syntax for `grid-template-columns/rows: subgrid`, line-name inheritance, and current Baseline status.
- [CSS subgrid — web.dev](https://web.dev/articles/css-subgrid) — the card/editorial alignment use case and `@supports` progressive enhancement; confirms Baseline since Sept 2023.
- [Responsive grid magazine layout in just 20 lines of CSS — CSS-Tricks](https://css-tricks.com/responsive-grid-magazine-layout-in-just-20-lines-of-css/) — `auto-fit`/`minmax`/`grid-auto-flow: dense` magazine pattern and its column-spanning gotchas.
- [Masonry layout — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout) — current state of native masonry / `grid-lanes` for ragged galleries, with the honest support caveats.
- [When will CSS Grid Lanes arrive? — WebKit blog](https://webkit.org/blog/17758/when-will-css-grid-lanes-arrive-how-long-until-we-can-use-it/) — straight-from-the-vendor timeline confirming Safari-first shipping and the cross-engine interop gap.
- [Almanac: minmax() — CSS-Tricks](https://css-tricks.com/almanac/functions/m/minmax/) — track-sizing reference for the `minmax(0, …)` blowout guard and content-column caps.
