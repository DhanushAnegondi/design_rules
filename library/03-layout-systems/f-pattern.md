# F-pattern

> The F-shaped path the eye traces over an under-formatted, text-dense page — two horizontal sweeps near the top, then a vertical skim down the left edge — and the layout discipline of designing *against* it by front-loading meaning into headings, opening words, and the left rail.

**Bucket:** layout
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, blogs/editorial, documentation, marketing landing pages, dashboards (text-dense regions)

## What it is
When users meet a wall of text with little visual structure, their gaze does not read — it *scans* along the path of minimum effort. Eye-tracking heatmaps show that path resolving into an F (or E, or inverted-L): a full-width fixation stripe across the top, a shorter second stripe lower down, and a vertical dribble of fixations down the left margin where line-starts live. Crucially, the F-pattern is a *symptom of poor formatting*, not a target to design toward. The job is to know it exists, accept that the left edge and the first two words of every line carry disproportionate weight, and lay the page out so the scan still hits the important things — or restructure so users fall into a better pattern (layer-cake: scanning headings) instead.

## When to use
This is a reading-behavior model, so "use it" means *design with it in mind* for these content types:

- **Long-form text the user skims, not savors**: blog posts, news, knowledge-base/help articles, product docs — anywhere the reader is efficiency-seeking and low-commitment.
- **Marketing pages where the value prop must survive a 3-second skim**: front-load the headline and first line; assume the body is skipped.
- **Left-to-right languages with left-aligned body text** — the F only forms because line-starts cluster on the left. (In RTL languages it mirrors to a backwards F on the right.)
- **Search results, list views, feeds**: the first 1–2 words of each row title get read; the rest is often skipped. Write titles front-loaded.
- **Dashboard text regions** (log panels, descriptions, table first columns): the leftmost column and row-leading words get the fixations.

## When NOT to use
The failure mode is *treating the F as a layout to build* rather than a behavior to mitigate:

- **Don't deliberately arrange content in an F.** The pattern is what happens when formatting *fails*. Good headings, bullets, bold lead-ins, and short paragraphs break the F and shift users into the more effective **layer-cake** pattern (deliberate heading-by-heading scanning). That's the goal.
- **Sparse, single-CTA hero sections** — that's **Z-pattern** territory (eye bounces top-left → top-right → diagonal → bottom CTA across a near-empty canvas). Don't apply F-pattern thinking to a page with three words and a button.
- **Highly committed reading** (a novel, a contract, a tutorial the user chose to follow step-by-step) triggers the **commitment** pattern — thorough, word-by-word — so F-pattern mitigations matter less; rhythm and typographic comfort matter more.
- **Centered or justified body text** defeats the premise: the F needs predictable left line-starts. Centering long copy is its own usability problem (ragged left edge forces the eye to re-hunt each line-start).
- **Everyone overuses this for**: justifying a rigid "important stuff goes top-left, fill the rest" template and then dumping unformatted paragraphs everywhere. The F is a warning, not a license to skip structure.

## How it works
The mechanism is human, not CSS: low-commitment readers minimize effort, so fixations collapse onto line-starts (left edge) and the top of the content block, decaying as they move down and right. You design *against* it with content + layout choices, not a single property:

- **Front-load keywords** — put the information-carrying words in the first ~2 words of every heading, link, and list item, because that's all a skimmer reads of each line.
- **Left-align body text** so line-starts are a clean vertical anchor the eye can ride.
- **Insert scannable anchors** — frequent subheads, bold lead-ins, bulleted lists — to convert the F-scan into a layer-cake scan (heading → decide → read body).
- **Constrain measure** to ~60–75 characters so the second horizontal sweep doesn't fall off a too-wide line.

The layout primitives that deliver this in 2024–2026 CSS:

- **CSS Grid** with a named left content rail + right "aside" gutter, so the meaningful column sits where the vertical scan lands.
- **Container queries** (`@container`, baseline across Chromium/Firefox/Safari since 2023 — widely usable now) to collapse the aside *based on the article column's own width*, not the viewport — the right call for a component that may live in a narrow or wide region.
- **`:has()`** (Baseline 2023, supported in all current evergreen browsers) to style a heading differently when it leads a list/figure, reinforcing anchors without extra classes.
- **`text-wrap: balance`** (headings) and **`text-wrap: pretty`** (body, Chromium 117+/Safari 17.5+; ignored gracefully elsewhere) to keep front-loaded headings from orphaning their key words.

## Working code

### Vanilla HTML + CSS — F-aware article layout (responsive via container query)
Complete, runnable document. Left content rail carries the scan; a right meta-rail collapses when the *article column itself* gets narrow (container query, not viewport). All text/background pairs are WCAG-checked (values in comments are measured for the exact hex used here).

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>F-aware article layout</title>
<style>
  :root {
    --ink:    #1b1b1b;   /* body/heading text  */
    --muted:  #5c5752;   /* meta text          */
    --accent: #9a3b2e;   /* links / lead-ins   */
    --paper:  #faf8f4;   /* page background    */
    --rail:   #efe9e0;   /* aside surface      */
    /* Measured contrast on this file's hex:
         #1b1b1b on #faf8f4 = 16.24:1  (AAA)
         #5c5752 on #faf8f4 =  6.73:1  (AA, AAA for large)
         #9a3b2e on #faf8f4 =  6.51:1  (AA)
         #1b1b1b on #efe9e0 = 14.27:1  (AAA)
         #9a3b2e on #efe9e0 =  5.73:1  (AA)  */
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font: 400 1.125rem/1.6 Georgia, "Iowan Old Style", serif;
    -webkit-font-smoothing: antialiased;
  }

  /* The article is a container; the layout reacts to ITS width, not the viewport. */
  .article {
    container-type: inline-size;
    container-name: article;
    max-width: 78rem;
    margin: 0 auto;
    padding: clamp(1.25rem, 4vw, 3rem);
  }

  /* Wide: meaningful content on the LEFT (where the vertical scan lands),
     meta/aside on the right gutter. */
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 68ch) 16rem;
    gap: clamp(1.5rem, 4cqi, 3.5rem);
    align-items: start;
  }

  /* Narrow article column: drop the gutter, single column, aside moves below. */
  @container article (max-width: 52rem) {
    .layout { grid-template-columns: minmax(0, 1fr); }
    .aside  { order: 2; border-top: 1px solid var(--rail); border-left: 0;
              padding: 1.25rem 0 0; }
  }

  /* --- Left content rail: built for the F --- */
  h1 {
    font: 700 clamp(2rem, 5cqi, 3.25rem)/1.05 "Iowan Old Style", Georgia, serif;
    margin: 0 0 .5rem;
    text-wrap: balance;        /* keep front-loaded words together */
    letter-spacing: -.01em;
  }
  .dek { color: var(--muted); font-size: 1.25rem; margin: 0 0 2rem; max-width: 60ch; }

  h2 {
    font-size: 1.5rem; line-height: 1.15; margin: 2.5rem 0 .5rem;
    text-wrap: balance;
    /* The left edge is the scan rail — mark it so subheads read as anchors. */
    border-left: 3px solid var(--accent);
    padding-left: .6rem;
    scroll-margin-top: 1rem;
  }
  p  { max-width: 68ch; margin: 0 0 1.1rem; text-wrap: pretty; } /* tame ragged ends */
  p:first-of-type::first-line { font-weight: 600; } /* front-load: weight the lead line */

  /* Bold lead-ins turn paragraphs into layer-cake anchors. */
  .lead-in { font-weight: 700; color: var(--ink); }

  ul { padding-left: 1.1rem; margin: 0 0 1.2rem; max-width: 64ch; }
  li { margin: .3rem 0; }
  li::marker { color: var(--accent); }

  a { color: var(--accent); text-underline-offset: 2px; }

  /* A heading that introduces a list gets tighter spacing — :has() with no extra class. */
  h2:has(+ ul) { margin-bottom: .35rem; }

  /* --- Right meta-rail (low scan priority, lives in the gutter) --- */
  .aside {
    border-left: 1px solid var(--rail);
    padding-left: 1.25rem;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: .9rem;
    color: var(--muted);
    position: sticky;
    top: 1rem;
  }
  .aside h3 { font-size: .75rem; letter-spacing: .08em; text-transform: uppercase;
              color: var(--ink); margin: 0 0 .5rem; }
  .aside nav a { display: block; padding: .35rem 0; color: var(--muted);
                 text-decoration: none; border-bottom: 1px solid var(--rail); }
  .aside nav a:hover,
  .aside nav a:focus-visible { color: var(--accent); }

  :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
</head>
<body>
  <article class="article">
    <div class="layout">
      <main class="content">
        <h1>Lock orders ship in 48 hours, not 6 weeks</h1>
        <p class="dek">Keyed-alike master systems, cut and stamped to your spec,
           pulled from stock the same day you order.</p>

        <h2>Stock keying, same-day pull</h2>
        <p><span class="lead-in">Same-day dispatch</span> on any keyway we hold —
           which is most of the common commercial profiles. Orders in before
           2pm ship that afternoon.</p>

        <h2>Master systems without the wait</h2>
        <p>Master-key charts that normally take a locksmith a fortnight are
           generated, verified, and pinned in-house. You approve the chart; we cut.</p>
        <ul>
          <li><span class="lead-in">Bitting reports</span> delivered as PDF + CSV.</li>
          <li><span class="lead-in">Restricted keyways</span> for tenders that need them.</li>
          <li><span class="lead-in">Rekey kits</span> shipped with every master order.</li>
        </ul>

        <h2>Pricing that survives a skim</h2>
        <p>Flat per-cylinder rate, no setup fee under 50 units. The number is the
           number — <a href="#pricing">see the full sheet</a>.</p>
      </main>

      <aside class="aside" aria-label="On this page">
        <h3>On this page</h3>
        <nav>
          <a href="#stock">Stock keying</a>
          <a href="#master">Master systems</a>
          <a href="#pricing">Pricing</a>
        </nav>
      </aside>
    </div>
  </article>
</body>
</html>
```

### React + Tailwind — same structure, container-query rail
Uses Tailwind's container-query support (`@container` / `@max-*` via the built-in `@tailwindcss/container-queries` utilities in v3.2+, native in v4). The aside collapses on the *component's* width.

```jsx
// Tailwind v4: container queries are built in. v3: add @tailwindcss/container-queries.
export function FAwareArticle({ headline, dek, sections, toc }) {
  return (
    <article className="@container mx-auto max-w-6xl px-5 py-8 md:px-12
                        bg-[#faf8f4] text-[#1b1b1b]
                        font-serif text-lg leading-relaxed">
      {/* default 1 col; at >=52rem container width, 2 cols with right gutter */}
      <div className="grid gap-6 @[52rem]:grid-cols-[minmax(0,68ch)_16rem] @[52rem]:gap-10">
        <main>
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight">
            {headline}
          </h1>
          <p className="mb-8 mt-2 max-w-[60ch] text-xl text-[#5c5752]">{dek}</p>

          {sections.map((s) => (
            <section key={s.id} id={s.id}>
              <h2 className="mt-10 mb-2 border-l-[3px] border-[#9a3b2e] pl-2.5
                             text-2xl leading-snug text-balance">
                {s.heading}
              </h2>
              {/* lead-in bolds the first words = layer-cake anchor */}
              <p className="mb-4 max-w-[68ch] text-pretty">
                <strong className="text-[#1b1b1b]">{s.leadIn}</strong> {s.body}
              </p>
            </section>
          ))}
        </main>

        <aside
          aria-label="On this page"
          className="order-2 border-t border-[#efe9e0] pt-5 text-sm text-[#5c5752]
                     @[52rem]:order-none @[52rem]:sticky @[52rem]:top-4
                     @[52rem]:border-l @[52rem]:border-t-0 @[52rem]:pl-5 @[52rem]:pt-0
                     font-sans"
        >
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#1b1b1b]">
            On this page
          </h3>
          <nav>
            {toc.map((t) => (
              <a key={t.href} href={t.href}
                 className="block border-b border-[#efe9e0] py-1.5 text-[#5c5752]
                            hover:text-[#9a3b2e] focus-visible:text-[#9a3b2e]
                            focus-visible:outline focus-visible:outline-2
                            focus-visible:outline-[#9a3b2e]">
                {t.label}
              </a>
            ))}
          </nav>
        </aside>
      </div>
    </article>
  );
}
```

## Variations
- **F vs E vs inverted-L**: same behavior, different number of horizontal sweeps before the vertical skim. The knob is *how much formatting/interest sustains horizontal reading* before the eye gives up and drops to the left rail.
- **Designed-against → layer-cake**: the intended upgrade. Frequent, keyword-led subheads convert the F into deliberate heading-by-heading scanning (the most effective scan). Knob: heading frequency + first-2-words quality.
- **Spotted pattern**: dense link/figure/date pages where the eye hops between high-salience targets and skips prose. Knob: density of distinct visual targets.
- **Commitment pattern**: motivated readers reading every word. Knob: user intent + content the user chose. Here typographic rhythm beats F-mitigation.
- **Mobile F**: still present, but narrower viewport changes *which* words land in the fixation stripe — front-loading matters *more*, not less, because lines are shorter.
- **RTL mirror**: in Arabic/Hebrew the F flips — vertical rail on the *right*. Driven by `direction: rtl` / logical properties.

## Accessibility
- **Reading order = source order = visual order.** In the Grid version the meaningful `<main>` precedes the `<aside>` in the DOM, and on wide screens it also sits left/first visually — so screen-reader and tab order match the visual scan. Avoid `order`/`grid-template-areas` tricks that put the aside *before* main in source; that desyncs the spoken/tab order from the page. (The one `order: 2` here only moves the low-priority aside *after* main in narrow layout — never ahead of it.)
- **Headings are real `<h1>/<h2>/<h3>`**, so the same subheads that anchor the visual scan also drive screen-reader heading navigation (the SR equivalent of the layer-cake scan). Don't fake headings with bold `<p>`.
- **Left-alignment aids reflow and low vision**: `text-align: left` (the default `start`) keeps a stable left line-start, which helps users tracking with screen magnification and is required-friendly under WCAG 1.4.8. Never justify long body copy (rivers + ragged left).
- **Zoom / reflow (WCAG 1.4.10)**: container queries collapse the two-column layout to one without horizontal scrolling at 320px-equivalent / 400% zoom, because the breakpoint keys off the article container shrinking. Verify no content is lost when the aside stacks.
- **Focus**: `:focus-visible` with a 2px accent outline (`#9a3b2e` on `#faf8f4` = 6.51:1, well past the 3:1 non-text minimum) keeps keyboard position obvious as users tab the TOC links.
- **Color is not the only anchor**: subheads use a left border *and* weight/size, links use color *and* underline — so the scan cues survive for color-blind users.

## Performance
- **Cheap layout.** Grid + container queries are static; there's no JS, no scroll listener, no reflow loop. The only thing to watch is **container queries triggering layout on resize** — fine for a handful of containers, but don't wrap hundreds of independently-querying containers in a long feed.
- **`text-wrap: balance` is O(n) per line and capped** by browsers (~6 lines) — safe on headings, avoid on long body paragraphs; use `text-wrap: pretty` there instead, which is cheaper and degrades to normal wrapping where unsupported.
- **`content-visibility: auto`** on far-below-the-fold `<section>`s skips their layout/paint until needed — a real win on very long F-pattern articles. Pair with `contain-intrinsic-size` to avoid scrollbar jump.
- **Sticky aside**: `position: sticky` is compositor-friendly; no scroll handler needed.
- No web fonts are required by the layout itself; if you add a display face, `font-display: swap` keeps the front-loaded headline readable during load.

## Anti-slop
Cliché (see `_slop-blocklist.md` → LAYOUT): the **centered 800px column with equal padding top-to-bottom and unbroken paragraphs** — which is *exactly* the unformatted slab that produces a degenerate F-scan, plus the reflexive **hero + three identical icon-title-blurb cards** bolted under it. Tasteful alternative: a left-anchored content rail with a quiet right meta-gutter (above), keyword-front-loaded subheads as real headings, bold lead-ins converting prose into layer-cake anchors, varied vertical rhythm (deks, lists, pull-quotes) instead of a uniform paragraph wall, and a full-bleed or offset moment to break monotony. Also avoid the COLOR/TYPE defaults that travel with the slab: this entry deliberately swaps Inter-on-white-with-indigo-gradient for a serif body, a single committed brick accent (`#9a3b2e`), and a warm paper neutral (`#faf8f4`) — breaking the default of two buckets at once is what separates designed from generated.

## Pairs well with
- `sidebar-content` / `holy-grail` — the left rail + right gutter here is a lightweight relative; promote to a full sidebar when navigation grows.
- `magazine-grid` / `editorial-typographic` — deks, pull-quotes, and varied rhythm are the formatting that breaks the F into layer-cake scanning.
- `single-column` — the fallback when the container is narrow; keep left-aligned, keyword-led.
- `scroll-progress-indicator` — orients readers in long F-pattern articles without changing the scan.
- `text-reveal-on-scroll` — reserve for the *headline only*; never stagger skimmable body copy (animating reading text fights the efficiency-seeking skim the F describes).

## Current references
- [F-Shaped Pattern of Reading on the Web: Misunderstood, But Still Relevant (Even on Mobile) — NN/G](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/) — the definitive "it's a symptom of bad formatting, not a goal" framing, with mobile + RTL notes.
- [F-Shape Pattern And How Users Read — Smashing Magazine (Apr 2024)](https://www.smashingmagazine.com/2024/04/f-shape-pattern-how-users-read/) — Vitaly Friedman's current take: "length is not the problem — lack of rhythm is," plus the four patterns and table-header tips.
- [Text Scanning Patterns: Eyetracking Evidence — NN/G](https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/) — the four patterns (F, spotted, layer-cake, commitment) and what triggers each.
- [The Layer-Cake Pattern of Scanning Content on the Web — NN/G](https://www.nngroup.com/articles/layer-cake-pattern-scanning/) — the *better* pattern you design toward by leading with keyword-rich subheads.
- [F-Shaped Pattern For Reading Web Content (original eyetracking research) — NN/G](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content-discovered/) — Jakob Nielsen's 2006 original; the source of the front-loading and first-two-words guidance.
- [MDN — CSS container queries (`@container`)](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) — syntax + current Baseline support for the responsive rail used above.
- [MDN — `text-wrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap) — `balance` vs `pretty`, support status, and graceful degradation.
