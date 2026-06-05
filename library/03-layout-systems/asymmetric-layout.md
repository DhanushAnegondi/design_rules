# Asymmetric layout

> A grid deliberately broken out of mirror-symmetry — unequal columns, an off-center focal point, and items that overlap or bleed past tracks, balanced by visual weight and negative space rather than by centering everything.

**Bucket:** layout
**Maturity:** evergreen
**Effort:** medium
**Best for:** websites, portfolios, agency/editorial sites, landing pages, product marketing

## What it is
A symmetric layout reflects across a vertical axis: centered hero, equal columns, mirrored padding. An asymmetric layout refuses that mirror on purpose. The focal element sits off-center (often near a third-line, not the middle), columns are intentionally unequal (e.g. a wide `2fr` content column beside a narrow `1fr` rail), and secondary elements — an image, a number, a caption — are placed by explicit grid lines so they overlap or push into the margin. The eye reads it as composed and editorial rather than templated, because the balance comes from *weight* (a big dark image offset by a small piece of bold type across a field of empty space) instead of from sameness. CSS Grid is the right engine because you can place every item by line number on one shared grid, including making items overlap by assigning them the same tracks.

## When to use
- **A single dominant message + supporting detail**, where you want the eye to land off-center first. Asymmetry creates a clear primary/secondary hierarchy faster than a centered, perfectly balanced block, which reads as "everything is equally important."
- **Editorial / portfolio scanning**, where the reader browses rather than task-completes. An offset image with type tucked into the negative space invites a left-to-right, top-down sweep and rewards a slower read.
- **Hero sections** that need to feel art-directed: oversized headline on the left third, image bleeding off the right edge, a small caption pinned into the gap.
- **Feature or case-study detail rows** that alternate weight (image-left / image-right, but with *unequal* split each time) to keep a long page from feeling like a repeating template.
- **When negative space is part of the message** — luxury, fashion, architecture, high-end SaaS — emptiness signals confidence; an off-center anchor makes that emptiness intentional rather than accidental.

## When NOT to use
- **Dense dashboards, tables, and data tools.** Scannable comparison wants alignment and symmetry; deliberately unequal columns fight the user's need to compare cells row-to-row.
- **Forms and linear task flows.** A predictable single column with consistent rhythm reduces cognitive load; asymmetry here just adds friction.
- **Anything where visual order and DOM order will diverge.** If you place items out of source order to achieve the look, keyboard and screen-reader users get a scrambled sequence (see Accessibility). If you can't keep reading order sane, don't do it.
- **The overused version:** every agency template now ships the same "huge headline pinned hard-left, single stock photo bleeding off the right, one word in the corner." Done once with real content it's striking; copied wholesale it's the new centered hero. Asymmetry is a compositional decision, not a preset — if the off-center placement doesn't track an actual hierarchy in your content, you've just made alignment harder for no payoff.

## How it works
The mechanism is one grid that *all* relevant items share, plus explicit line-based placement so you control exactly which tracks each item occupies — including overlapping tracks for layered/broken effects.

Key CSS:

- **Unequal tracks** — `grid-template-columns: 2fr 1fr` or an asymmetric named-column grid. Mixing `fr` with a fixed/`minmax()` rail is how you get a wide content column beside a narrow sidebar that never collapses awkwardly.
- **Line-based placement** — `grid-column: 1 / 8` and `grid-row: 2 / 4`. Lines are numbered from 1; **negative numbers count from the end**, so `grid-column: 1 / -1` spans full width regardless of column count (great for full-bleed moments). [[MDN: line-based placement]]
- **Overlap / broken grid** — assign two items the *same* tracks and they stack in the same cell; control depth with `z-index`. A common trick is naming a single area and assigning children to it: `grid-template-areas: "stack"; ` then `> * { grid-area: stack; }` makes everything overlap, after which `place-self` nudges each layer. [[CSS-Tricks overlay]]
- **Negative space as a track** — leave columns/rows empty by simply not placing anything in them. A `minmax()` or fixed empty column on one side becomes an intentional margin you can tune at breakpoints — no spacer hacks.
- **`span`** — `grid-row: 1 / span 3` to occupy a number of tracks without counting end lines.
- **Container queries** (`@container`) re-layout a component based on *its own* width, not the viewport — ideal when an asymmetric card appears in both a wide and narrow slot. Baseline widely available across Chrome/Firefox/Safari/Edge since early 2023.
- **`subgrid`** lets a child grid adopt the parent's tracks so nested content lines up to the same asymmetric columns. Baseline widely available (Chrome/Edge 117+, Firefox 71+, Safari 16+); ~92%+ global support, safe in production with a graceful fallback. [[Comeau subgrid]]
- **`:has()`** enables layout that responds to content (e.g. give a section a different asymmetric split when it `:has(img)`). Supported in all major browsers.

## Working code

### Vanilla HTML + CSS — asymmetric hero with overlap, full-bleed, and responsive collapse

Self-contained and runnable. A 12-column grid drives an off-center hero: oversized headline on the left columns, image bleeding to the right edge, a caption overlapping the image corner, and an empty column doing the work of negative space. Below 760px it collapses to a single readable column, and DOM order already matches the intended reading order (headline → caption → image is acceptable here; the image is decorative-supporting).

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Asymmetric hero</title>
<style>
  :root {
    --ink: #14110f;       /* near-black warm */
    --paper: #f3efe7;     /* warm off-white */
    --accent: #c2410c;    /* burnt orange */
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: "Georgia", "Times New Roman", serif;
    -webkit-font-smoothing: antialiased;
  }

  .hero {
    display: grid;
    /* 12 equal tracks; the asymmetry comes from WHERE items land, not equal columns */
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: 12vh auto auto 12vh;
    gap: 0 clamp(12px, 2vw, 32px);
    min-height: 100svh;
    padding: 0 clamp(16px, 4vw, 64px);
    align-items: start;
  }

  /* Headline: left of center, columns 1–7, deliberately not centered */
  .hero__title {
    grid-column: 1 / 8;
    grid-row: 2 / 3;
    margin: 0;
    font-weight: 700;
    line-height: 0.95;
    font-size: clamp(2.6rem, 8vw, 6.5rem);
    letter-spacing: -0.02em;
    max-width: 14ch;
  }
  .hero__title em {
    font-style: italic;
    color: var(--accent);
  }

  /* Image: bleeds to the right edge, overlaps the headline's row band */
  .hero__media {
    grid-column: 6 / -1;        /* starts under the headline, runs to the last line */
    grid-row: 1 / 4;
    background:
      linear-gradient(125deg, #6b2d12 0%, #c2410c 55%, #e8a06b 100%);
    border-radius: 2px;
    min-height: 38vh;
    box-shadow: 0 20px 60px -28px rgba(20,17,15,0.6);
  }

  /* Caption: pinned into the gutter, overlapping the image's lower-left corner */
  .hero__caption {
    grid-column: 4 / 8;
    grid-row: 3 / 4;
    align-self: end;
    z-index: 2;               /* sit above the image */
    margin: 0;
    padding: 0.6rem 0.9rem;
    background: var(--paper);
    font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--accent);
  }

  /* Eyebrow line, full-bleed top, anchored left */
  .hero__eyebrow {
    grid-column: 1 / -1;       /* full width via negative line number */
    grid-row: 1 / 2;
    align-self: center;
    font-family: ui-monospace, monospace;
    font-size: 0.8rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.7;
  }

  /* Below 760px: one column, natural reading flow, no overlap */
  @media (max-width: 760px) {
    .hero {
      grid-template-columns: 1fr;
      grid-template-rows: auto;
      gap: 1.25rem;
      padding: 1.5rem;
      min-height: auto;
    }
    .hero__eyebrow,
    .hero__title,
    .hero__media,
    .hero__caption {
      grid-column: 1 / -1;
      grid-row: auto;
    }
    .hero__title { font-size: clamp(2.2rem, 11vw, 3.4rem); }
    .hero__media { min-height: 46vw; }
    .hero__caption { align-self: start; z-index: auto; }
  }
</style>
</head>
<body>
  <header class="hero">
    <p class="hero__eyebrow">Field Notes — Vol. 04</p>
    <h1 class="hero__title">Built for the way you <em>actually</em> read.</h1>
    <p class="hero__caption">Kerguelen, 49°S — 2026</p>
    <div class="hero__media" role="img"
         aria-label="Abstract gradient evoking a southern-ocean horizon"></div>
  </header>
</body>
</html>
```

What makes it asymmetric, by construction: the headline occupies columns 1–8 (left of the 6/7 center), the image runs 6 → `-1` and overlaps the same rows (broken/overlapping grid), the caption sits in tracks 4–8 *over* the image with `z-index`, and columns 8–12 above the image are simply left empty as negative space. None of that uses spacer divs or negative margins.

### Container-query variant — a card that re-splits based on its own width

Drop the same card into a wide slot and a narrow slot; it chooses an asymmetric two-column split only when it has room. No viewport media query — it reacts to the container.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Container-query asymmetric card</title>
<style>
  body { margin: 2rem; font-family: system-ui, sans-serif; background:#101014; color:#ececf1;
         display:grid; gap:2rem; grid-template-columns: 1fr 320px; }
  @media (max-width:700px){ body{ grid-template-columns:1fr; } }

  .slot { container-type: inline-size; }   /* establish a query container */

  .card {
    display: grid;
    grid-template-columns: 1fr;            /* narrow default: stacked */
    gap: 1rem;
    background:#1a1a22;
    border:1px solid #2a2a35;
    border-radius: 10px;
    padding: 1.25rem;
  }
  .card__art {
    background: linear-gradient(135deg,#3b1d5e,#7c3aed);
    border-radius: 6px; min-height: 120px;
  }
  .card h2 { margin:.2rem 0; font-size:1.15rem; }
  .card p  { margin:0; color:#b9b9c6; line-height:1.5; }

  /* When the card's own container is wide enough, go asymmetric: narrow art, wide text */
  @container (min-width: 420px) {
    .card {
      grid-template-columns: 1fr 2fr;       /* unequal: 1 part art, 2 parts text */
      align-items: center;
    }
    .card__art { min-height: 100%; }
  }
</style>
</head>
<body>
  <div class="slot">
    <article class="card">
      <div class="card__art" role="img" aria-label="Decorative violet gradient"></div>
      <div><h2>Wide slot</h2><p>Re-splits into a 1fr / 2fr asymmetric layout because its container is wide.</p></div>
    </article>
  </div>
  <div class="slot">
    <article class="card">
      <div class="card__art" role="img" aria-label="Decorative violet gradient"></div>
      <div><h2>Narrow slot</h2><p>Same markup, but stays stacked because the container is narrow.</p></div>
    </article>
  </div>
</body>
</html>
```

### React / Tailwind — asymmetric editorial row

Tailwind's arbitrary grid-line values map directly onto the same line-placement idea. `col-start-1 col-end-8` mirrors `grid-column: 1 / 8`.

```jsx
// Tailwind v3.4+/v4. Requires the grid utilities (default).
export function FeatureRow({ kicker, title, body, imageAlt }) {
  return (
    <section className="grid grid-cols-12 gap-x-6 items-center px-6 py-24 md:py-32">
      {/* Image: left, columns 1–6, slightly overlapping the text band on lg */}
      <div
        role="img"
        aria-label={imageAlt}
        className="col-start-1 col-end-13 md:col-start-1 md:col-end-6
                   aspect-[4/5] rounded-sm
                   bg-[linear-gradient(135deg,#0f766e,#2dd4bf)]
                   shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)]"
      />
      {/* Text: right, columns 6–12, intentionally NOT centered, pulled left to overlap */}
      <div className="col-start-1 col-end-13 mt-8
                      md:col-start-6 md:col-end-13 md:mt-0 md:-ml-12 md:relative md:z-10">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-teal-700">
          {kicker}
        </p>
        <h2 className="mt-3 max-w-[16ch] text-4xl md:text-5xl font-semibold leading-[0.95] tracking-tight">
          {title}
        </h2>
        <p className="mt-5 max-w-[42ch] text-neutral-600 leading-relaxed">{body}</p>
      </div>
    </section>
  );
}
```

## Variations
- **Off-center focal hero** — the knob is *which third* the anchor sits on; push the headline to columns 1–7 or 6–12, never dead-center.
- **Unequal columns** — `2fr 1fr`, `3fr 2fr`, golden-ish `1.618fr 1fr`. The knob is the ratio; the bigger the disparity, the louder the hierarchy.
- **Broken / overlapping grid** — items share tracks and stack via `z-index`. Knob: overlap amount (how many shared lines) and which layer wins.
- **Full-bleed punctuation** — most content sits in a centered measure, but one image or quote spans `1 / -1` to break the rhythm. Knob: frequency (once or twice per page, not every block).
- **Negative-space-dominant** — an empty column/row is the largest region; the content is a small weighted cluster. Knob: ratio of empty to filled tracks.
- **Diagonal / staircase flow** — successive items step down-and-across the grid so the eye travels a diagonal. Knob: row offset between siblings.

## Accessibility
- **Reading order vs visual order — the critical risk.** CSS Grid lets you place an item *anywhere* regardless of where it sits in the HTML. Keyboard tab order and screen-reader narration follow **DOM order**, not visual position. If your off-center / overlapping placement makes the visual sequence diverge from source order, sighted keyboard users will see focus jump around unpredictably and SR users hear a scrambled story. **Rule: order the DOM in the intended reading sequence, then place visually around that.** Treat `order` and out-of-flow placement as cosmetic only when the resulting visual order still matches a sensible reading order (WCAG 1.3.2 Meaningful Sequence, 2.4.3 Focus Order).
- **Overlap and contrast.** When text overlaps an image/gradient (the caption-over-media trick), the text must still meet WCAG contrast against *whatever is actually behind it*. In the hero above the caption is set on a solid `--paper` (#f3efe7) chip, not floated directly over the gradient — `--accent` #c2410c text on #f3efe7 computes to about **4.7:1**, clearing AA (4.5:1) for normal text. If you float text straight onto imagery, add a scrim or use large-text sizing (3:1 threshold) and re-check.
- **Reflow / zoom.** WCAG 1.4.10 requires content to reflow to a single column at 320px CSS width / 400% zoom without horizontal scroll. Asymmetric multi-column grids must collapse — both code samples drop to one column (`grid-column: 1 / -1`) at small widths. Test at 400% browser zoom, not just a narrow viewport.
- **Decorative media.** Pure-decoration gradient blocks use `role="img"` with a short `aria-label`, or `aria-hidden="true"` if they carry no meaning, so they don't add noise.
- **Don't encode meaning only in position.** "The important one is the big off-center block" is a visual cue; ensure headings/landmarks still convey hierarchy to non-visual users (real `<h1>/<h2>`, not just size).

## Performance
- **Placement is cheap; overlap is cheap.** Grid line placement and stacking add no runtime cost — there's no JS measuring loop here.
- **Watch fixed-px tracks at breakpoints.** Tracks defined in `px` that don't collapse can cause horizontal overflow on small screens; prefer `fr`, `minmax()`, and `clamp()` so the grid is fluid.
- **`content-visibility: auto`** on long lists of off-screen asymmetric rows lets the browser skip layout/paint for them until near the viewport — a real win on long editorial pages. Pair with `contain-intrinsic-size` so the scrollbar doesn't jump.
- **Large grids.** Hundreds of explicitly placed items can make style/layout recalc noticeable; if you have a big gallery, prefer auto-placement (`grid-auto-flow: dense`) over hand-placing every item, and avoid forcing reflow by reading layout properties (`offsetWidth`) in a loop.
- **Container queries** are efficient but each `container-type: inline-size` creates a containment context; don't sprinkle it on thousands of nodes needlessly.
- **`subgrid`** has no meaningful runtime penalty over regular grid; the only cost is the fallback path for older engines (rare now).

## Anti-slop
Cliché (see `_slop-blocklist.md` → LAYOUT): the **"hero + three identical icon-title-blurb cards"** and the **"centered 800px column, equal padding everywhere"** — symmetric, evenly-weighted, and instantly readable as generated. The lazy *asymmetric* cliché is just as bad: the canned "giant headline jammed hard-left + one stock photo bleeding off the right + one word in the corner," applied with no relationship to the content.

Tasteful fix: let the asymmetry **encode a real hierarchy**. Put the dominant element where the dominant message is, use an actual unequal ratio (`2fr 1fr`, not `1fr 1fr` faking it with margins), vary the split direction down a long page so feature rows don't become a new template, and treat negative space as a *placed* region (an empty grid track) rather than leftover margin. Combine with a deliberate non-default palette and a characterful display face — per the blocklist, breaking 2–3 buckets at once (committed single hue + sharp accent, real type scale, off-grid composition) is most of what separates designed from generated. Avoid the `#3B82F6`-on-white + Inter + centered-column trifecta.

## Pairs well with
- **`editorial-typographic`** — oversized display type is the visual weight that anchors an off-center composition; the two techniques are made for each other.
- **`bento-grid`** — bento's varied tile sizes are asymmetry on a tile field; the same line-placement skills apply.
- **`full-bleed`** — punctuate an asymmetric column with a `1 / -1` full-width image or quote.
- **`text-reveal-on-scroll`** — reveal the off-center headline on entry with expo easing to make the focal point land.
- **`split-screen`** — a 50/50 split is the *symmetric* sibling; nudging it to 60/40 with an overlapping seam is the asymmetric upgrade.

## Current references
- [Grid layout using line-based placement — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Grid_layout_using_line-based_placement) — canonical reference for `grid-column`/`grid-row`, negative line numbers (`-1`), and `span`.
- [Positioning Overlay Content with CSS Grid — CSS-Tricks](https://css-tricks.com/positioning-overlay-content-with-css-grid/) — the single-named-area / `grid-area: 1 / 1` overlap trick for broken/layered grids.
- [Brand New Layouts with CSS Subgrid — Josh W. Comeau](https://www.joshwcomeau.com/css/subgrid/) — using subgrid so nested content aligns to the same asymmetric parent tracks.
- [Negative Grid Lines — CSS { In Real Life }](https://css-irl.info/negative-grid-lines/) — practical patterns for placing items from the end of the grid with negative line numbers.
- [Container queries in 2026: Powerful, but not a silver bullet — LogRocket](https://blog.logrocket.com/container-queries-2026/) — current support and when component-level re-layout beats viewport media queries.
- [Mastering Asymmetrical Layouts with CSS Grid — MoldStud](https://moldstud.com/articles/p-mastering-asymmetrical-layouts-with-css-grid-a-comprehensive-guide) — overview of unequal-column and offset strategies (general guide; corroborate techniques against MDN).
