# Single-column / centered

> One centered reading column held to a comfortable measure (about 45–75 characters), with a deliberate vertical rhythm and a few elements that break the column — full-bleed media, offset asides — so it never reads as a flat 800px box.

**Bucket:** layout
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, blogs/long-form, documentation, marketing landing pages

## What it is
A single column of content sits centered in the viewport, capped at a width chosen for *reading* (a "measure" of ~45–75 characters), with generous margins on either side. The reader's eye travels straight down one axis; line length stays short enough that the return sweep to the next line never gets lost. The sophistication is not in the column itself — it's in the *rhythm*: a modular vertical-spacing scale, and a handful of moments where content deliberately escapes the column (a full-bleed image, an offset pull-quote, a wider feature block) so the page has texture instead of one uniform ribbon of text.

## When to use
- **Text-dense reading** — articles, essays, docs, case studies. Short measure is the single biggest lever on reading comfort; a centered capped column is the canonical fix.
- **Linear narrative** where you *want* one reading path top-to-bottom (a single-CTA landing page, an onboarding explainer, a portfolio case study). The eye-path is a clean vertical line, the opposite of an F-pattern scan.
- **Content-first / writing-first sites** where the prose is the product and chrome should disappear.
- **Mobile-first** anything: a single column is what every layout collapses to at narrow widths anyway, so designing it first is honest.
- **Documentation** where scannability comes from headings and code blocks punctuating a steady column, not from multi-region layout.

## When NOT to use
- **Dashboards, data tables, comparison views** — anything where the user scans across regions or needs many things visible at once. A single column forces serial scrolling through what should be parallel.
- **Sparse, single-CTA hero marketing** that wants a Z-pattern (logo → nav → headline diagonal → CTA): a tall centered column buries the CTA below the fold.
- **App shells / tools** that need persistent sidebars, toolbars, or split panes.
- **The overuse warning:** the slop default is *"centered 800px column, equal padding everywhere, every block the same width."* (see Anti-slop). A single column is the right *structure* and the wrong *execution* when nothing ever breaks the column — it reads as a generated wall of evenly-spaced boxes. The fix is rhythm and breakout, not abandoning the column.

## How it works
Two jobs: **constrain the measure**, and **let chosen children escape it**.

**Measure.** Cap width in `ch` (the width of the "0" glyph in the current font) so the limit tracks the actual font, not a guessed pixel value: `max-width: 65ch`. Pair with a fluid font size via `clamp()` so the measure holds across viewports. `ch` is well supported everywhere.

**Rhythm.** Don't pad every block equally. Use a modular spacing scale (e.g. a 1.25 or 1.5 ratio: `0.5rem, 0.75rem, 1.125rem, 1.6875rem, 2.5rem, 3.75rem…`) and assign space by *meaning* — large gaps before section headings, tight gaps between a heading and its paragraph. The cleanest mechanism is a single flow rule: `.flow > * + * { margin-block-start: var(--flow-space, 1.5em); }` (the "owl" / flow utility), with `--flow-space` overridden per element. Using `em` ties vertical rhythm to the local font size so headings get proportionally more air.

**Breakout.** The modern approach is one CSS Grid that defines concentric width zones with named lines (`content` in the middle, then `popout`, `feature`, `full` expanding outward). Default children land in `content`; an element opts into a wider zone with `grid-column: full` (or `feature`/`popout`). The intermediate columns use `minmax(0, …)` so they collapse to zero on narrow screens and everything stacks into the content column automatically — no media query needed. This is Ryan Mulligan's / Viget's breakout grid, and a simpler two-line version is Josh Comeau's `1fr min(content, 100%) 1fr` full-bleed grid.

Key APIs: CSS Grid named lines + `minmax()`/`clamp()`/`min()` for the breakout track sizes; `ch` for measure; the flow utility for rhythm; optionally `text-wrap: pretty` (long copy) and `text-wrap: balance` (headings) to clean up ragged lines and orphans.

## Working code

### Vanilla: breakout grid, fluid measure, modular rhythm (complete, runnable)
Open this file in any browser. Body copy stays at a ~65ch measure; the hero image goes full-bleed; a quote pops out wider; an aside offsets right. Resize narrow and every breakout collapses into the single column.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Single column with breakouts</title>
<style>
  :root {
    /* Modular spacing scale, ratio ~1.5 */
    --space-2xs: 0.5rem;
    --space-xs:  0.75rem;
    --space-s:   1.125rem;
    --space-m:   1.6875rem;
    --space-l:   2.5rem;
    --space-xl:  3.75rem;
    --space-2xl: 5.625rem;

    /* Breakout grid zones — intermediate tracks collapse to 0 when tight */
    --gap: clamp(1rem, 5vw, 2.5rem);
    --full:    minmax(var(--gap), 1fr);
    --feature: minmax(0, 8rem);
    --popout:  minmax(0, 2rem);
    /* content measure: ~65ch, but never wider than the viewport minus gaps */
    --content: min(65ch, 100% - var(--gap) * 2);

    --ink:    #2b2a28;  /* body   — 13.52:1 on --paper */
    --muted:  #6b675f;  /* meta   —  5.31:1 on --paper */
    --label:  #7a766d;  /* eyebrow—  4.27:1 on --paper (used bold) */
    --accent: #b4451f;  /* links  —  5.19:1 on --paper */
    --paper:  #faf8f4;
    --panel:  #f0ece4;  /* offset aside bg — ink on it: 12.17:1 */
    --night:  #1a1916;  /* full-bleed dark band */
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
    font-size: clamp(1.0625rem, 0.95rem + 0.5vw, 1.25rem);
    line-height: 1.6;
    -webkit-text-size-adjust: 100%;
  }

  /* The breakout grid: concentric width zones */
  .layout {
    display: grid;
    grid-template-columns:
      [full-start] var(--full)
      [feature-start] var(--feature)
      [popout-start]  var(--popout)
      [content-start] var(--content) [content-end]
      var(--popout)  [popout-end]
      var(--feature) [feature-end]
      var(--full)    [full-end];
  }
  /* Everything defaults into the reading column */
  .layout > * { grid-column: content; }
  .popout  { grid-column: popout;  }
  .feature { grid-column: feature; }
  .full    { grid-column: full;    }

  /* Vertical rhythm: space only BETWEEN siblings, sized by meaning */
  .layout > * + *      { margin-block-start: var(--space-m); }
  .layout > * + h2     { margin-block-start: var(--space-xl); }  /* big air before sections */
  .layout > h2 + *     { margin-block-start: var(--space-xs); }  /* tight under headings   */
  .layout > * + .full,
  .layout > .full + *  { margin-block-start: var(--space-xl); }

  h1 {
    font-family: "Iowan Old Style", Georgia, serif;
    font-size: clamp(2.25rem, 1.5rem + 3.5vw, 4rem);
    line-height: 1.05;
    letter-spacing: -0.02em;
    text-wrap: balance;          /* even heading lines where supported */
    margin: 0;
  }
  h2 {
    font-size: clamp(1.5rem, 1.2rem + 1.2vw, 2rem);
    line-height: 1.15;
    letter-spacing: -0.01em;
    text-wrap: balance;
    margin: 0;
  }
  p { margin: 0; text-wrap: pretty; }   /* avoids orphans in long copy where supported */
  a { color: var(--accent); text-underline-offset: 0.15em; }

  .eyebrow {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.8rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-weight: 700;
    color: var(--label);
  }
  .lede { font-size: 1.2em; color: var(--muted); line-height: 1.5; }

  /* Full-bleed media band */
  figure.full { margin-inline: 0; }
  figure.full img {
    display: block; width: 100%; height: clamp(220px, 38vh, 420px);
    object-fit: cover;
  }
  figure.full figcaption {
    /* caption pulled back to the reading measure, not full width */
    max-width: 65ch; margin: var(--space-xs) auto 0;
    padding-inline: var(--gap);
    font-size: 0.85rem; color: var(--muted);
  }

  /* Full-bleed dark band — a rhythm break, text stays measure-width inside it */
  .band.full {
    background: var(--night);
    color: var(--paper);                 /* 16.57:1 */
    padding-block: var(--space-2xl);
  }
  .band .inner {
    max-width: 60ch; margin-inline: auto; padding-inline: var(--gap);
  }
  .band .inner em { color: #e0875f; font-style: normal; }  /* accent: 6.53:1 on night */

  /* Popout pull-quote: wider than the column, offset feel */
  blockquote.popout {
    margin: 0; padding-inline-start: var(--space-s);
    border-inline-start: 3px solid var(--accent);
    font-size: 1.3em; line-height: 1.3; font-style: italic; color: var(--ink);
  }

  /* Offset aside: on wide screens it sits in the right margin via the feature track */
  .aside.feature {
    background: var(--panel); color: var(--ink);    /* 12.17:1 */
    padding: var(--space-s);
    font-size: 0.9rem; line-height: 1.5;
    align-self: start;
  }

  header.full, footer.full { padding-block: var(--space-l); }
  header .inner, footer .inner {
    max-width: var(--content); margin-inline: auto; padding-inline: var(--gap);
    display: flex; justify-content: space-between; align-items: baseline; gap: 1rem;
  }
  footer { color: var(--muted); font-size: 0.85rem; border-top: 1px solid var(--panel); }

  @media (prefers-reduced-motion: no-preference) {
    html { scroll-behavior: smooth; }
  }
</style>
</head>
<body>
  <div class="layout">

    <header class="full">
      <div class="inner">
        <strong>Field Notes</strong>
        <nav><a href="#">Archive</a></nav>
      </div>
    </header>

    <p class="eyebrow">Essay · 9 min</p>
    <h1>The column is not the problem. The padding is.</h1>
    <p class="lede">A centered measure is the most legible structure on the web.
       What makes it read as generated is treating every block as the same width
       with the same space around it.</p>

    <figure class="full">
      <img src="https://picsum.photos/1600/600" alt="Wide landscape, decorative">
      <figcaption>A full-bleed image is the cheapest way to break the ribbon.</figcaption>
    </figure>

    <p>Set the reading column to a real measure — roughly 45 to 75 characters per
       line — using the <code>ch</code> unit so it tracks the font rather than a
       guessed pixel width. Sixty-five is a comfortable target for serif body text.</p>

    <h2>Vary the rhythm</h2>
    <p>Give section headings a large gap above and a tight gap below. That single
       contrast does more for perceived design quality than any decoration.</p>

    <blockquote class="popout">
      Equal spacing everywhere is the layout equivalent of monotone speech.
    </blockquote>

    <p>Then let a few elements escape the column entirely: a full-bleed band, a
       pull-quote that pops out, an aside that offsets into the margin on wide
       screens and tucks back inline when space runs out.</p>

    <aside class="aside feature">
      <strong>Sidenote.</strong> On screens wide enough, this sits in the right
      margin via the <code>feature</code> track. Narrow the window and it collapses
      back into the reading column — no media query.
    </aside>

    <p>Because the intermediate grid tracks use <code>minmax(0, …)</code>, they
       vanish under pressure and everything stacks into one column. The mobile
       layout is the desktop layout with the air squeezed out.</p>

    <div class="band full">
      <div class="inner">
        <p>A dark full-bleed band is a <em>rhythm break</em>: the measure inside it
           stays short, but the surrounding color shift gives the long scroll a
           landmark. Use it once or twice, not every section.</p>
      </div>
    </div>

    <p>Close on the column. The reader should feel they travelled one clean vertical
       line, punctuated — not a stack of identical cards.</p>

    <footer class="full">
      <div class="inner"><span>Field Notes</span><span>© 2026</span></div>
    </footer>

  </div>
</body>
</html>
```

### Simpler vanilla: two-line full-bleed grid (Josh Comeau pattern)
When you only need "centered column + occasional full-bleed" and don't want named zones:

```css
.wrapper {
  display: grid;
  grid-template-columns: 1fr min(65ch, 100%) 1fr;
}
.wrapper > * { grid-column: 2; }          /* default: reading column */
.full-bleed  { grid-column: 1 / 4; width: 100%; }   /* escape to viewport edges */
```

### React + Tailwind
Tailwind ships `max-w-prose` (~65ch) and `prose` (Typography plugin) for exactly this. Below, the breakout uses an arbitrary grid value so it runs without extra config.

```jsx
// Requires @tailwindcss/typography for `prose`. The grid breakout is plain utilities.
export default function Article() {
  return (
    <article
      className="grid [grid-template-columns:1fr_min(65ch,100%)_1fr]
                 gap-y-7 px-0 py-16 text-stone-800 bg-[#faf8f4]
                 [&>*]:col-start-2 [&>*]:col-end-3"
    >
      <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
        Essay · 9 min
      </p>

      <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
        The column is not the problem. The padding is.
      </h1>

      {/* Full-bleed: spans all three columns */}
      <figure className="col-start-1 col-end-4 w-full">
        <img
          src="https://picsum.photos/1600/600"
          alt=""
          className="h-[clamp(220px,38vh,420px)] w-full object-cover"
        />
      </figure>

      <div className="prose prose-stone max-w-none text-pretty [grid-column:2]">
        <p>
          Cap the measure with <code>ch</code>, vary the vertical rhythm by
          meaning, and let a few elements break the column. That is the whole
          recipe.
        </p>
        <blockquote className="border-l-2 border-orange-700 pl-4 text-xl italic">
          Equal spacing everywhere is the layout equivalent of monotone speech.
        </blockquote>
      </div>
    </article>
  );
}
```

## Variations
- **Plain capped column** — measure + rhythm, no breakouts. Cleanest for docs. *Knob: `max-width` in `ch`.*
- **Full-bleed breakout column** — the grid above; media and bands escape to viewport edges. *Knob: which `grid-column` zone each child opts into (`content`/`popout`/`feature`/`full`).*
- **Offset / asymmetric column** — the reading column is not centered but pushed left, with a fixed right margin for sidenotes (Tufte-style). *Knob: replace symmetric `1fr … 1fr` tracks with asymmetric ones.*
- **Measure + sidenotes** — content stays narrow; marginalia live in a `feature` track that collapses inline on mobile. *Knob: aside's track assignment.*
- **Rhythm band variant** — alternating paper / dark full-bleed bands as section landmarks. *Knob: how often a `.band.full` interrupts the flow.*

## Accessibility
- **Reading order = visual order.** This is the layout's biggest a11y advantage: a single source-order column means DOM order, tab order, and visual order all agree. Keep it that way — don't use `order` or grid placement to move *interactive* content out of source sequence (unlike masonry/reordered grids, breakouts here only widen blocks, they don't reorder them).
- **Measure aids dyslexia & low vision.** Short lines (the British Dyslexia Association suggests ~60–70 cpl; shorter still — ~45–50 — helps some dyslexic readers) reduce the chance of losing your place on the return sweep. Cap in `ch`, and let users override: never set `max-height` on text containers.
- **Zoom / reflow (WCAG 1.4.10).** Because the breakout tracks use `minmax(0, …)` and the content uses `min(65ch, 100% − gap)`, the layout reflows to a single column at 400% zoom / 320px CSS-px width with no horizontal scroll. Test it: the intermediate columns must collapse, not clip.
- **Contrast (measured for this file's exact colors on `#faf8f4` paper / `#1a1916` band):** body `#2b2a28` 13.52:1 (AAA); muted meta `#6b675f` 5.31:1 (AA); eyebrow label `#7a766d` 4.27:1 (AA for the bold/uppercase label); links `#b4451f` 5.19:1 (AA); body on the offset panel `#f0ece4` → 12.17:1 (AAA); light text on the dark band `#faf8f4` on `#1a1916` 16.57:1 (AAA); accent `#e0875f` on the dark band 6.53:1 (AA). All text pairs meet at least WCAG AA.
- **Screen readers.** Full-bleed figures must carry real `alt` (empty `alt=""` only for decorative). Captions pulled back to the measure should stay associated via `<figure>/<figcaption>`. A dark band is purely visual — don't encode meaning in the color shift alone.
- **Smooth scroll** is gated behind `prefers-reduced-motion: no-preference`.

## Performance
- This layout is cheap: no JS, GPU-irrelevant, one grid container. The main cost is **font loading** — use `font-display: swap` (or `optional`) so the measure doesn't reflow late.
- `text-wrap: pretty` does extra line-breaking work; it's fine on a normal article but skip it on very long single blocks where layout speed matters more. `text-wrap: balance` is capped by browsers (no effect past ~6 lines in Chrome, ~10 in Firefox), so it only costs on short headings — which is exactly where you want it.
- Full-bleed images are the real weight: serve responsive `srcset`/`sizes`, set explicit dimensions or `aspect-ratio` to prevent CLS, and `loading="lazy"` below the fold.
- For very long articles, `content-visibility: auto` with a `contain-intrinsic-size` hint on off-screen sections cuts initial layout/paint cost without changing the visual result.

## Anti-slop
**Cliché (see `_slop-blocklist.md` → LAYOUT):** *"centered 800px column, equal padding everywhere"* — every block the same width, the same `margin-bottom` between all of them, nothing ever touching the viewport edge. It reads as machine-generated because there's zero rhythm and zero hierarchy of width. The sibling cliché is *"hero + three identical icon-title-blurb cards"* stacked in that same column.

**Tasteful fix:** keep the centered measure (it's correct), but (1) space by *meaning* with a modular scale — big air before headings, tight under them — not one uniform gap; (2) give 2–3 elements a deliberate width break (one full-bleed image or dark band, one popped-out quote, one offset aside) using the breakout grid; (3) don't cap at a round pixel value — cap at a real measure in `ch` so it's font-driven. Breaking the "equal width / equal padding" default in two or three places is most of what separates a designed reading page from a generated one.

## Pairs well with
- **`editorial-typographic`** — a real display face + modular type scale is what makes the rhythm read as intentional rather than sparse.
- **`full-bleed`** — the canonical breakout moment for this layout; the grid above is built to host it.
- **`text-reveal-on-scroll`** — reserve one scroll-linked reveal for a focal headline in the column; let body copy appear plainly.
- **`scroll-progress-indicator`** — orients the reader on long single-column reads where there are no landmarks but headings.
- **`sticky-pinning`** — a sticky chapter label or progress rail in the collapsed margin space alongside the column.

## Current references
- [CSS Grid full-bleed layout — Josh W. Comeau](https://www.joshwcomeau.com/css/full-bleed/) — the two-line `1fr min(content,100%) 1fr` full-bleed grid, clearly explained.
- [Layout breakouts with CSS Grid — Ryan Mulligan](https://ryanmulligan.dev/blog/layout-breakouts/) — the named-line concentric-zone grid (content/popout/feature/full) used in the main example.
- [Fluid breakout layout with CSS Grid — Viget](https://www.viget.com/articles/fluid-breakout-layout-css-grid/) — the `minmax(0,…)` + `clamp()` variable recipe that collapses breakouts responsively without media queries.
- [Optimal line length for readability (the 50–75 character rule) — UXPin](https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/) — the measure rationale and the dyslexia/low-vision shorter-line guidance.
- [Choose a comfortable measure — Webtypography.net (Bringhurst applied to the web)](http://webtypography.net/2.1.2) — the canonical "45–75 characters, 66 ideal" source.
- [text-wrap — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap) — `balance` vs `pretty` semantics and the browser-support table.
- [CSS text-wrap: balance — Chrome for Developers](https://developer.chrome.com/docs/css-ui/css-text-wrap-balance/) — the line-count caps (~6 Chrome / ~10 Firefox) and when balancing applies.
- [text-wrap: balance support — Can I Use](https://caniuse.com/css-text-wrap-balance) — current cross-browser baseline status to progressive-enhance against.
