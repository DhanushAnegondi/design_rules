# Z-pattern

> A sparse layout that walks the eye along a Z — top-left logo to top-right nav, then a diagonal sweep down to a single bottom-right call-to-action.

**Bucket:** layout
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, landing pages, single-CTA marketing pages

## What it is
The Z-pattern is a layout for content-light pages that traces the path a Western
(left-to-right) reader's eye takes across a page with no dense text to anchor it:
across the top edge (logo left -> nav/secondary action right), then a diagonal
sweep back down to the lower-left, and finally across the bottom to a terminal
point at the lower-right. You place four things on that path — brand, orientation,
the hero promise, and one decisive action — so the scan order *is* the
persuasion order. It is the layout you reach for when there is almost nothing on
the page, because emptiness is what lets the eye follow a shape at all.

## When to use
- **Sparse, single-CTA landing pages.** One headline, one supporting line, one
  button. With little text to grab onto, the eye sweeps corner-to-corner instead
  of settling into an F — so design *to* that sweep.
- **Above-the-fold hero sections** where you want logo (top-left) and a primary
  nav or "Sign in" (top-right), then a big promise mid-page, then a CTA bottom-right.
- **Coming-soon / waitlist / app-download pages** — minimal content, one goal.
- **Splash and section dividers** in an otherwise scroll-heavy site, where each
  full-viewport panel restages a fresh Z.
- **When the content genuinely is light.** The F-pattern (two horizontal bars plus
  a left stem) is the *default* scan for text-dense pages — NN/g's eyetracking shows
  the F emerges precisely "when there are no strong cues to attract the eyes toward
  meaningful information." The Z only governs the eye when the page is sparse enough
  that a few large elements *are* the strong cues.

## When NOT to use
- **Text-dense pages.** A blog post, docs page, or pricing table is read in an
  F-pattern (top bar, shorter second bar, left-edge stem). Forcing a Z onto dense
  content fights the reader's natural gravity and buries the second half.
- **More than one real action.** The Z's power is that the bottom-right terminus is
  the *only* destination. Two co-equal CTAs collapse the pattern into noise.
- **Right-to-left languages.** In Arabic/Hebrew the scan mirrors — your "Z" is a
  reversed Z (an S-like path); hard-coding a left-to-right Z misorders the content.
- **Long-scroll storytelling** where the narrative, not a corner, is the destination.
- **The overuse trap:** people slap a Z (or its cousin, the centered hero with a
  button) onto *every* marketing page regardless of content. If the page has real
  substance to read, it wants an F or an editorial grid, not a Z.

## How it works
The Z is not a CSS feature — it is a *placement discipline* built on a normal grid.
The mechanism is the Gutenberg diagram: on a page with even visual weight, a
left-to-right reader's eye starts at the **primary optical area** (top-left), drifts
toward the **terminal area** (bottom-right) along a "reading gravity" diagonal, and
gives little attention to the two **fallow** corners (top-right and bottom-left)
unless something pulls it there. The Z-pattern *weaponizes* those fallow corners:
you put a deliberate hook in the top-right (nav, a secondary CTA) and the lower-left
(a supporting line or visual) so the eye is yanked across and back down, then lands
on the bottom-right terminal — the strongest natural endpoint — where the CTA lives.

In code you build it with **CSS Grid**: a header row (`justify-content: space-between`
via a 2-column track puts logo left, nav right), a centered or offset hero band, and a
footer-ish action row that pushes the CTA to the end. The corner placement is what
makes the Z; the grid just enforces it responsively. Modern niceties:

- **`:has()`** (Baseline since December 2023, all evergreen browsers) lets the layout
  react to its own content — e.g. tighten the hero when a sibling media block exists.
- **Container queries** (`@container`, Baseline since February 2023; reached Baseline
  *widely available* in 2025) let a hero component restage its Z based on the width of
  *its container*, not the viewport — useful when the same hero is dropped into a wide
  page or a narrow column.
- On narrow screens the Z **must linearize** to a single column (logo, nav, headline,
  CTA, top-to-bottom) — a diagonal sweep is meaningless at phone width, so the
  breakpoint collapses the grid.

## Working code

### Vanilla HTML + CSS Grid (responsive, no JS)
Complete, self-contained document. Desktop renders the four Z anchors on a grid;
below 720px it linearizes to a single readable column.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Z-pattern landing</title>
<style>
  :root {
    /* committed single hue (deep teal) + one sharp accent (amber) — not SaaS blue */
    --ink:        #0c1b1a;   /* near-black teal, used as page text on light surface */
    --paper:      #f4f1ea;   /* warm bone, page background */
    --surface:    #0e2422;   /* dark teal hero surface */
    --on-surface: #eef3f1;   /* text on the dark hero surface */
    --muted:      #9fb3ae;   /* muted teal-grey, supporting text on dark */
    --accent:     #f2a900;   /* amber CTA */
    --accent-ink: #1a1205;   /* text on amber */
    font-synthesis: none;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100dvh;
    background: var(--paper);
    color: var(--ink);
    font-family: "Geist", system-ui, -apple-system, sans-serif;
    display: grid;
    /* one full-viewport panel that stages the Z */
    grid-template-rows: auto 1fr auto;
    padding: clamp(1rem, 4vw, 2.5rem);
    gap: clamp(1.5rem, 5vh, 4rem);
  }

  /* --- TOP BAR: logo (top-left anchor) <-> nav (top-right fallow hook) --- */
  header {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
  }
  .logo { font-weight: 700; font-size: 1.15rem; letter-spacing: -0.01em; }
  nav { grid-column: 3; display: flex; gap: 1.5rem; align-items: center; }
  nav a { color: var(--ink); text-decoration: none; font-size: 0.95rem; }
  nav a:hover, nav a:focus-visible { text-decoration: underline; }
  .ghost {
    border: 1.5px solid var(--ink);
    border-radius: 999px;
    padding: 0.4rem 1rem;
  }

  /* --- HERO BAND: headline (the diagonal's pull) on the dark surface --- */
  .hero {
    background: var(--surface);
    color: var(--on-surface);
    border-radius: 1.25rem;
    padding: clamp(1.75rem, 6vw, 4.5rem);
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    align-items: center;
    gap: clamp(1.5rem, 4vw, 3rem);
  }
  .hero h1 {
    margin: 0;
    font-size: clamp(2.25rem, 6vw, 4rem);
    line-height: 1.02;
    letter-spacing: -0.02em;
    max-width: 16ch;
  }
  .hero p {
    margin: 1rem 0 0;
    color: var(--muted);
    font-size: clamp(1rem, 1.4vw, 1.15rem);
    max-width: 38ch;
  }
  /* the lower-left support text — second anchor on the diagonal's landing */
  .hero figure {
    margin: 0;
    align-self: end;
    color: var(--muted);
    font-size: 0.9rem;
    border-left: 2px solid var(--accent);
    padding-left: 0.9rem;
  }

  /* --- BOTTOM BAR: terminal area, CTA pushed to bottom-right --- */
  footer {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 1rem;
  }
  footer .tagline { color: #4a5b58; font-size: 0.95rem; }
  .cta {
    justify-self: end;                 /* the terminal point of the Z */
    background: var(--accent);
    color: var(--accent-ink);
    font-weight: 650;
    font-size: 1.05rem;
    padding: 0.85rem 1.6rem;
    border: none;
    border-radius: 999px;
    text-decoration: none;
    cursor: pointer;
  }
  .cta:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }

  /* --- BREAKPOINT: below 720px the Z linearizes to one column --- */
  @media (max-width: 720px) {
    body { gap: 1.5rem; }
    header { grid-template-columns: 1fr auto; }
    nav { gap: 0.75rem; }
    nav a:not(.ghost) { display: none; }   /* trim nav on mobile */
    .hero { grid-template-columns: 1fr; }
    .hero figure { border-left: none; padding-left: 0; border-top: 2px solid var(--accent); padding-top: 0.75rem; }
    footer { grid-template-columns: 1fr; }
    .cta { justify-self: stretch; text-align: center; }  /* full-width tap target */
  }
</style>
</head>
<body>
  <!-- Top bar: top-left brand, top-right hook -->
  <header>
    <span class="logo">Halyard</span>
    <nav aria-label="Primary">
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <a class="ghost" href="#login">Sign in</a>
    </nav>
  </header>

  <!-- Hero: the diagonal — headline pulls down-left, support text lands lower-left -->
  <section class="hero">
    <div>
      <h1>Ship your rigging in one afternoon.</h1>
      <p>Halyard turns a spreadsheet of sail measurements into a cut-ready
         pattern. No CAD, no loft floor.</p>
    </div>
    <figure>
      <blockquote style="margin:0">"Cut 40 sails last season without re-measuring once."</blockquote>
      <figcaption style="margin-top:.5rem">— Mara, North Loft</figcaption>
    </figure>
  </section>

  <!-- Bottom bar: terminal CTA at lower-right -->
  <footer>
    <span class="tagline">Free for your first three patterns.</span>
    <a class="cta" href="#start">Start cutting</a>
  </footer>
</body>
</html>
```

### React + Tailwind version
Same Z anchors, same linearization. Drop-in component; Tailwind classes carry the
breakpoint (`md:` restores the multi-track grid above 768px).

```jsx
export default function ZHero() {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto] gap-8 bg-[#f4f1ea] p-6 md:p-10 font-sans text-[#0c1b1a]">
      {/* Top bar */}
      <header className="grid grid-cols-[auto_1fr_auto] items-center">
        <span className="text-lg font-bold tracking-tight">Halyard</span>
        <nav aria-label="Primary" className="col-start-3 flex items-center gap-4 md:gap-6">
          <a href="#features" className="hidden text-sm hover:underline md:inline">Features</a>
          <a href="#pricing" className="hidden text-sm hover:underline md:inline">Pricing</a>
          <a href="#login" className="rounded-full border-[1.5px] border-[#0c1b1a] px-4 py-1.5 text-sm">
            Sign in
          </a>
        </nav>
      </header>

      {/* Hero diagonal */}
      <section className="grid items-center gap-6 rounded-3xl bg-[#0e2422] p-7 text-[#eef3f1] md:grid-cols-[1.1fr_0.9fr] md:gap-12 md:p-16">
        <div>
          <h1 className="max-w-[16ch] text-4xl font-bold leading-[1.02] tracking-tight md:text-6xl">
            Ship your rigging in one afternoon.
          </h1>
          <p className="mt-4 max-w-[38ch] text-[#9fb3ae]">
            Halyard turns a spreadsheet of sail measurements into a cut-ready pattern. No CAD, no loft floor.
          </p>
        </div>
        <figure className="m-0 self-end border-l-2 border-[#f2a900] pl-4 text-sm text-[#9fb3ae] max-md:border-l-0 max-md:border-t-2 max-md:pl-0 max-md:pt-3">
          <blockquote className="m-0">"Cut 40 sails last season without re-measuring once."</blockquote>
          <figcaption className="mt-2">— Mara, North Loft</figcaption>
        </figure>
      </section>

      {/* Terminal CTA, bottom-right */}
      <footer className="grid items-center gap-4 md:grid-cols-[1fr_auto]">
        <span className="text-sm text-[#4a5b58]">Free for your first three patterns.</span>
        <a
          href="#start"
          className="justify-self-stretch rounded-full bg-[#f2a900] px-6 py-3 text-center font-semibold text-[#1a1205] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#0c1b1a] md:justify-self-end"
        >
          Start cutting
        </a>
      </footer>
    </div>
  );
}
```

## Variations
- **Pure Z (one panel):** the textbook four-corner path on a single viewport. Knob: how
  literal the diagonal is (centered hero = loose Z; offset hero media = tight, obvious Z).
- **Zig-zag / repeated Z:** stack several Z panels down the page, each restaging the
  pattern; alternate which corner holds the CTA. Knob: number of panels.
- **Reversed Z (S-pattern):** mirror for RTL languages, or for a deliberate "back-and-forth"
  feel. Knob: text direction / `direction: rtl`.
- **Z-with-media-anchor:** the lower-left fallow corner holds a product shot or short proof
  quote (as in the code above) instead of text, sharpening the diagonal's landing.
- **Gutenberg layout (the quieter cousin):** for *dense, uniform* content, skip the
  engineered corners and simply trust reading gravity — strong content top-left, terminal
  CTA bottom-right, nothing fighting for the fallow corners. Knob: content density.

## Accessibility
- **Reading order vs visual order:** keep the DOM order = the scan order
  (logo -> nav -> headline -> support -> CTA). The code above does this, so tab order,
  screen-reader order, and the visual Z all agree. Never use Grid's `order` /
  `grid-area` placement to put the CTA last visually but first in the DOM — that
  divorces keyboard/AT order from sighted order, the classic Grid a11y trap.
- **Focus / keyboard:** the CTA is a real `<a>`/`<button>` with a visible
  `:focus-visible` outline (`3px solid` against the bone background — high contrast).
  Tab reaches nav, then the single CTA last, mirroring the Z's terminus.
- **Responsive / zoom / reflow:** at 720px (and at 400% zoom / 320px effective width,
  WCAG 1.4.10 Reflow) the grid collapses to one column and the CTA becomes a
  full-width tap target — no horizontal scroll, no diagonal that only makes sense wide.
- **Screen readers:** the diagonal is purely visual; SR users get a clean linear list,
  so the content must still make sense read straight through. The `nav` is labelled
  (`aria-label="Primary"`) and the testimonial uses `<figure>/<blockquote>/<figcaption>`
  so it is announced as a quote, not stray text.
- **Contrast (measured for this file's exact pairs):**
  - `--on-surface` `#eef3f1` on `--surface` `#0e2422` (headline/hero text) =
    **14.47:1** -> passes AA & AAA.
  - `--muted` `#9fb3ae` on `--surface` `#0e2422` (supporting/quote text) =
    **7.37:1** -> passes AA & AAA for normal text.
  - `--accent-ink` `#1a1205` on `--accent` `#f2a900` (CTA label) =
    **9.23:1** -> passes AA & AAA.
  - `--ink` `#0c1b1a` on `--paper` `#f4f1ea` (logo, nav links) =
    **15.68:1** -> passes AA & AAA.
  - `.tagline` `#4a5b58` on `--paper` `#f4f1ea` (footer tagline) =
    **6.36:1** -> passes AA for normal text.

## Performance
- The Z is a static layout — effectively zero runtime cost. It's a handful of grid
  cells, no JS, no reflow loop, so there is nothing to thrash.
- Keep the hero media (the lower-left anchor) cheap: a single optimized image or pure
  type. A heavy autoplay video there negates the "sparse, fast first paint" that makes
  a Z land. Mark it `loading="eager"` only if it's the LCP element; everything else lazy.
- Above-the-fold being light is the whole point — a Z page should hit a fast LCP because
  there's so little to paint. Don't reintroduce weight (web fonts blocking render,
  giant background gradients) that defeats the sparseness.
- If you stack repeated Z panels, gate any per-panel scroll animation behind
  `content-visibility: auto` so off-screen panels skip layout/paint until near the
  viewport.

## Anti-slop
Cliché (see `_slop-blocklist.md` -> LAYOUT): the **centered 800px column with equal
padding and a button under a headline** — the degenerate "Z" everyone ships, plus the
adjacent **hero + three identical icon-title-blurb cards** bolted underneath. It reads
as generated because every axis is the default at once: centered, symmetric, evenly
padded, one weight. Tasteful version: keep the *intent* (single scan path to one CTA)
but break 2-3 defaults deliberately — offset the hero so the diagonal is real
(asymmetric `1.1fr / 0.9fr` split, not dead-center), anchor the lower-left fallow corner
with a concrete proof element (a real customer line, not lorem), vary weight and size
into a true scale, and commit to one brand hue plus a single sharp accent on the CTA
instead of the purple-to-pink-gradient-on-white tell (see `_slop-blocklist.md` -> COLOR).
Concrete copy ("Ship your rigging in one afternoon" / "Start cutting"), never
"Empower / Seamless / Elevate" + a generic "Get started" (see -> COPY).

## Pairs well with
- `single-column` — what the Z *becomes* on mobile; design both states together.
- `split-screen` — a 50/50 hero is a natural way to make the Z's diagonal explicit.
- `full-bleed` — a dark full-bleed hero band (as above) sharpens the corner anchors.
- `staggered-entrance` (scroll/motion) — animate the four Z anchors in scan order
  (logo, nav, headline, CTA) so motion reinforces the path, with a
  `prefers-reduced-motion` fallback.
- `editorial-typographic` (type) — characterful display type at the headline is what
  gives a sparse Z something to hold the eye, instead of Inter-at-one-weight.

## Current references
- [NN/g — F-Shaped Pattern of Reading on the Web (Misunderstood, But Still Relevant)](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/) — eyetracking evidence that the F is the *default* for unformatted/dense text; the Z only takes over when the page is sparse and cued, which is the whole case for using it.
- [NN/g — Text Scanning Patterns: Eyetracking Evidence](https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/) — the four validated scan patterns (F, spotted, layer-cake, commitment); grounds *when* a non-F pattern actually applies.
- [Vanseo Design — 3 Design Layouts: Gutenberg Diagram, Z-Pattern, F-Pattern](https://vanseodesign.com/web-design/3-design-layouts/) — clear breakdown of the Gutenberg four quadrants (primary optical / terminal / two fallow areas) and reading gravity that the Z is built on.
- [UX Planet — Z-Shaped Pattern for Reading Web Content](https://uxplanet.org/z-shaped-pattern-for-reading-web-content-ce1135f92f1c) — practical placement of logo/nav/hero/CTA along the Z, and why it suits sparse, single-CTA pages.
- [MDN — :has() selector](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) — support and syntax for content-aware layout tweaks (Baseline since Dec 2023).
- [MDN — CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) — `@container` for restaging a hero by its own width (Baseline since Feb 2023).
- [web.dev — Baseline](https://web.dev/baseline/) — current cross-browser support status for `:has()` and container queries cited above.
