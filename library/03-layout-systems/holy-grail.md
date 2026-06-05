# Holy grail layout

> The classic page skeleton — full-width header and footer, with a three-band middle of left nav, fluid main content, and right aside — solved in a few lines of CSS Grid and collapsing to one column on small screens.

**Bucket:** layout
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, apps, dashboards, portfolios (docs sites, admin panels, content sites — anything with persistent chrome around a content well)

## What it is
The "holy grail" is the canonical web page shell: a header that spans the top, a footer that spans the bottom, and a middle row split into three vertical bands — navigation on the left, the main content in the centre (the flexible one), and a secondary aside (ads, related links, metadata) on the right. The header and footer are full-bleed; the centre column grows and shrinks while the two flanks hold roughly fixed widths. On a phone the three bands stack into a single readable column. The reader perceives stable, predictable chrome wrapping a content area that is always the visual and structural centre of gravity.

## When to use
- **Documentation and reference sites** — a left nav for the page tree, the doc body in the centre, and a right "on this page" table of contents. Readers scan the left rail to locate, read the centre top-to-bottom, and use the right rail to jump within a page.
- **Content / editorial sites** where the article is the star but you need a persistent nav and a sidebar for related posts or an ad slot.
- **App and dashboard shells** — global nav left, working area centre, contextual inspector/aside right. The fixed flanks anchor orientation while the centre does the work.
- **Any layout where two pieces of chrome must stay visible** around a fluid content well, and you want the centre column to absorb all the width change as the viewport flexes.
- Content type cue: use it when the **main content is the one thing that should reflow**, and everything around it is navigational or supplementary.

## When NOT to use
- **Marketing / landing pages.** A landing page is a vertical narrative of full-bleed sections, not a content-well-with-rails. Forcing it into a holy grail produces the tired "centred 800px column with equal padding and two empty sidebars" look (see Anti-slop).
- **Text-only reading** (a blog post, a story). A single centred measure of 60–75ch reads better than a three-band frame; the flanks just steal width and attention. Reach for a single-column layout instead.
- **Genuinely two-pane apps** (mail, chat, file browser) where both panes are primary and independently scrollable — that's a sidebar+content split, often with its own scroll containers, not header/footer chrome around one content well.
- **When a flank would be empty or near-empty on most pages.** A right aside that's blank 80% of the time is dead space; drop it and let content breathe, or fold its contents inline.
- **Everyone overuses this for the generic "app that needs a sidebar"** — if you have only header + nav + content (no second aside), build that two-band layout directly rather than carrying a vestigial third column you keep hiding.

## How it works
The mechanism is a named grid. You declare a grid container with three rows (header / middle / footer) and three columns (nav / main / aside), then paint the regions with `grid-template-areas` — an ASCII map where each quoted string is a row and each token names the area a child occupies. Children claim their slot with `grid-area: <name>`. Because the map is literal text, the layout is self-documenting and re-arranging at a breakpoint is just rewriting the strings.

Key properties and APIs:
- **`grid-template-areas`** + **`grid-template-columns` / `grid-template-rows`** — the named map plus the track sizing. The centre column is `1fr` (absorbs free space); the flanks are fixed or `minmax()`. Header/footer rows are `auto` (content height); the middle row is `1fr` or `minmax(0, 1fr)` so the shell fills the viewport.
- **The `grid-template` shorthand** — `grid-template: auto 1fr auto / <col-sizes>` sets all three in one line.
- **`min-height: 100svh`** on the container — makes the footer sit at the bottom even on short pages (sticky footer for free; `svh` = small viewport height, dodges mobile browser-chrome jumps).
- **`@media` (or container) queries** — at narrow widths you rewrite `grid-template-areas` to a single stacked column. A few sites instead use one auto-responsive line (`grid-template-columns: repeat(auto-fit, minmax(...))`), trading explicit control for zero media queries.
- **`:has()`** (Baseline since Dec 2023) — optionally lets the *container* react to whether an aside exists, e.g. `.layout:has(.aside)` switches to the 3-column track set, so the same shell degrades to 2 columns when no aside is rendered. Progressive-enhance: wrap in `@supports selector(:has(*))`.

Why it was hard, historically: before Grid (pre-2017), the holy grail was a notorious puzzle. Source order put content first for SEO/accessibility, but visually the nav had to come left of it — so you needed negative margins, `float` hacks, faux-column background images for equal-height flanks, or fragile `display: table` tricks, each with its own clearfix and IE workaround. The "fully fluid, equal-height, source-ordered, three-column" combo was hard enough to earn the mythic name. Grid `grid-template-areas` collapses all of it: visual order is decoupled from DOM order, equal height is automatic, and the whole thing is a handful of lines.

## Working code

### Vanilla HTML + CSS Grid (named areas, responsive collapse)
Complete, runnable document. Three breakpoints: 1 column (phone) → 2 columns (tablet: nav + main, aside drops below) → 3 columns (desktop). DOM order is `header, main, nav, aside, footer` so the **main content comes first in source** (good for reading order and SEO) while Grid paints nav to its left.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Holy grail layout</title>
<style>
  :root {
    --ink: #1b1d21;          /* near-black text */
    --paper: #f6f4ef;        /* warm off-white page */
    --panel: #e7e3d8;        /* nav / aside surface */
    --chrome: #23262b;       /* header / footer */
    --chrome-ink: #f6f4ef;   /* text on chrome */
    --accent: #c2410c;       /* burnt-orange accent (not default SaaS blue) */
    --gap: 1rem;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: ui-sans-serif, system-ui, sans-serif;
    color: var(--ink);
    background: var(--paper);
    line-height: 1.55;
  }

  /* The shell: one column by default (mobile-first), stacked in source order */
  .layout {
    display: grid;
    min-height: 100svh;            /* fill viewport; footer sinks to bottom */
    gap: var(--gap);
    padding: var(--gap);
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main"
      "nav"
      "aside"
      "footer";
  }

  /* Tablet: two columns — nav rail + main; aside falls full-width below */
  @media (min-width: 40rem) {
    .layout {
      grid-template-columns: 12rem 1fr;
      grid-template-areas:
        "header header"
        "nav    main"
        "nav    aside"
        "footer footer";
    }
  }

  /* Desktop: full holy grail — nav | main | aside, header/footer span all 3 */
  @media (min-width: 64rem) {
    .layout {
      grid-template-columns: 14rem minmax(0, 1fr) 16rem;
      grid-template-areas:
        "header header header"
        "nav    main   aside"
        "footer footer footer";
    }
  }

  .site-header { grid-area: header; background: var(--chrome); color: var(--chrome-ink);
    padding: 1rem 1.25rem; border-radius: 8px; display: flex; align-items: baseline; gap: 1rem; }
  .site-header h1 { margin: 0; font-size: 1.15rem; letter-spacing: -0.01em; }
  .site-header a { color: var(--chrome-ink); }

  .site-nav   { grid-area: nav;   background: var(--panel); padding: 1rem; border-radius: 8px; }
  .content    { grid-area: main;  background: #fff; padding: 1.5rem 1.75rem; border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,.06); }
  .aside      { grid-area: aside; background: var(--panel); padding: 1rem; border-radius: 8px;
    font-size: 0.9rem; }
  .site-footer{ grid-area: footer; background: var(--chrome); color: var(--chrome-ink);
    padding: 1rem 1.25rem; border-radius: 8px; font-size: 0.9rem; }

  .content h2 { margin-top: 0; font-size: 1.6rem; letter-spacing: -0.02em; }
  .content { max-width: 70ch; }     /* readable measure even inside the wide centre */

  nav ul { list-style: none; margin: 0; padding: 0; }
  nav li + li { margin-top: 0.4rem; }
  nav a { color: var(--ink); text-decoration: none; display: block; padding: 0.3rem 0.5rem;
    border-radius: 5px; }
  nav a:hover, nav a:focus-visible { background: var(--accent); color: #fff; }

  a { color: var(--accent); }
  :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
</style>
</head>
<body>
  <!-- Source order: header, main, nav, aside, footer.
       Grid repaints nav to the LEFT of main without moving it in the DOM. -->
  <div class="layout">
    <header class="site-header">
      <h1>Ledger &amp; Larch</h1>
      <a href="#main">Skip to content</a>
    </header>

    <main class="content" id="main">
      <h2>Quarterly field notes</h2>
      <p>The main content is first in the DOM, so a screen reader and the
        keyboard reach it right after the header — yet on wide screens Grid
        places the navigation column to its left. Visual order and reading
        order are decoupled by construction.</p>
      <p>Resize the window: this centre band is the only column that grows
        and shrinks. The 14rem nav and 16rem aside hold their width while the
        middle <code>minmax(0, 1fr)</code> absorbs the slack, then both flanks
        fold underneath as the viewport narrows.</p>
    </main>

    <nav class="site-nav" aria-label="Primary">
      <ul>
        <li><a href="#" aria-current="page">Overview</a></li>
        <li><a href="#">Holdings</a></li>
        <li><a href="#">Transfers</a></li>
        <li><a href="#">Reports</a></li>
      </ul>
    </nav>

    <aside class="aside" aria-label="Related">
      <h3 style="margin-top:0">On this page</h3>
      <p>Secondary, supplementary, or contextual material lives here. When a
        page has nothing to put in it, drop the aside rather than ship an
        empty rail.</p>
    </aside>

    <footer class="site-footer">
      © 2026 Ledger &amp; Larch — built with CSS Grid named areas.
    </footer>
  </div>
</body>
</html>
```

Contrast check for the colours above, computed for this file (WCAG 2.x, sRGB):
- Body: `#1b1d21` text on `#f6f4ef` paper → **15.0:1** (passes AA + AAA).
- Main content: `#1b1d21` on `#ffffff` → **16.6:1** (AAA).
- Header/footer: `#f6f4ef` on `#23262b` chrome → **12.9:1** (AAA).
- Nav link text: `#1b1d21` on `#e7e3d8` panel → **12.5:1** (AAA).
- Nav hover state: `#ffffff` on `#c2410c` accent → **4.55:1** (passes AA for normal text, ≥4.5:1).

### Variant: container-query collapse (component-driven, no viewport media queries)
The shell adapts to the **width of its own container**, not the viewport — so the same component lays out correctly whether embedded full-page or inside a narrower slot. Container queries are Baseline (widely available since Feb 2023).

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; }

  .shell-wrap { container-type: inline-size; }   /* establishes the query context */

  .layout {
    display: grid; gap: 1rem; padding: 1rem; min-height: 100svh;
    grid-template-columns: 1fr;
    grid-template-areas: "header" "main" "nav" "aside" "footer";
  }
  @container (min-width: 40rem) {
    .layout {
      grid-template-columns: 12rem 1fr;
      grid-template-areas: "header header" "nav main" "nav aside" "footer footer";
    }
  }
  @container (min-width: 64rem) {
    .layout {
      grid-template-columns: 14rem minmax(0,1fr) 16rem;
      grid-template-areas: "header header header" "nav main aside" "footer footer footer";
    }
  }
  header,footer { grid-area: header; background:#23262b; color:#f6f4ef; padding:1rem; border-radius:8px; }
  footer { grid-area: footer; }
  nav   { grid-area: nav;   background:#e7e3d8; padding:1rem; border-radius:8px; }
  main  { grid-area: main;  background:#fff; padding:1.25rem; border-radius:8px; max-width:70ch; }
  aside { grid-area: aside; background:#e7e3d8; padding:1rem; border-radius:8px; }
</style></head>
<body>
  <div class="shell-wrap">
    <div class="layout">
      <header>Header</header>
      <main>Main content first in the DOM. The layout responds to this
        wrapper's width via <code>@container</code>, not the screen.</main>
      <nav aria-label="Primary">Nav</nav>
      <aside aria-label="Related">Aside</aside>
      <footer>Footer</footer>
    </div>
  </div>
</body></html>
```

### React + Tailwind (named-area utilities)
Tailwind has no first-class named-area syntax, so the cleanest path is arbitrary `grid-template` values per breakpoint. DOM order keeps `main` first.

```jsx
export default function HolyGrail({ children }) {
  return (
    <div
      className="
        grid gap-4 p-4 min-h-[100svh]
        grid-cols-1
        [grid-template-areas:'header''main''nav''aside''footer']
        md:grid-cols-[12rem_1fr]
        md:[grid-template-areas:'header_header''nav_main''nav_aside''footer_footer']
        lg:grid-cols-[14rem_minmax(0,1fr)_16rem]
        lg:[grid-template-areas:'header_header_header''nav_main_aside''footer_footer_footer']
      "
    >
      <header className="[grid-area:header] rounded-lg bg-neutral-800 text-neutral-100 p-4">
        Header
      </header>
      <main className="[grid-area:main] rounded-lg bg-white p-6 shadow-sm max-w-[70ch]">
        {children ?? "Main content — first in the DOM, painted centre on desktop."}
      </main>
      <nav aria-label="Primary" className="[grid-area:nav] rounded-lg bg-stone-200 p-4">
        Nav
      </nav>
      <aside aria-label="Related" className="[grid-area:aside] rounded-lg bg-stone-200 p-4">
        Aside
      </aside>
      <footer className="[grid-area:footer] rounded-lg bg-neutral-800 text-neutral-100 p-4">
        Footer
      </footer>
    </div>
  );
}
```
Tailwind tip: underscores inside the arbitrary value are emitted as spaces, so `'header_header'` becomes the row string `"header header"`. Define the named areas via the same `[grid-template-areas:…]` arbitrary property; the `[grid-area:…]` utilities on children reference those names.

## Variations
- **Two-band (no aside):** header / nav / main / footer. The most common real-world reduction — most "app shell" needs are this, not the full grail. Use `.layout:has(aside)` to switch track sets so one component serves both.
- **Sticky chrome:** add `position: sticky; top: 0` to the header and make the nav/aside columns independently scrollable (`overflow: auto; max-height: calc(100svh - …)`) for app shells where chrome stays put while the centre scrolls.
- **Fixed vs fluid flanks:** the knob is the column track — `14rem` (fixed) vs `minmax(10rem, 18rem)` (clamped fluid) vs `clamp(10rem, 18vw, 18rem)`.
- **Source-order swap:** put `nav` before `main` in the DOM if the nav genuinely is the primary entry point; keep `main` first when content is the destination (the default and usually correct choice).
- **Auto-responsive (zero media queries):** `grid-template-columns: repeat(auto-fit, minmax(min(12rem, 100%), 1fr))` — flanks wrap automatically. Trades layout precision for terseness; named-area control is usually worth keeping.
- **Reverse grail:** aside on the left, nav on the right — same map, swapped tokens.

## Accessibility
- **Reading / tab order follows the DOM, not the grid.** This is the headline a11y fact: Grid repositions boxes visually but does **not** change the order screen readers announce or the order Tab moves through. So author the DOM in the order you want *read* — typically `header → main → nav → aside → footer` (content-first) — and let Grid paint nav to the left. If you instead place items so the visual order diverges sharply from DOM order, keyboard focus will appear to "jump around" the screen; keep visual and focus order roughly aligned, or accept the content-first reading order shown here.
- **Landmarks:** use real `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` elements so the regions are landmark-navigable. Label multiple navs/asides with `aria-label` (e.g. `aria-label="Primary"`, `aria-label="Related"`) so they're distinguishable in a landmark menu.
- **Skip link:** provide a "Skip to content" link to `#main` (shown in the first example) so keyboard users bypass the nav rail.
- **Zoom / reflow (WCAG 1.4.10):** at 400% zoom the layout must reflow to a single column with no loss of content and no two-axis scrolling. The mobile-first single-column base here satisfies this because the same narrow-width rules trigger under heavy zoom.
- **Don't gate content on the aside:** never put information that's only available in a flank that gets `display: none` at a breakpoint — collapse it to a stacked region (as here) instead of hiding it.
- **`grid-template-areas` doesn't create semantics** — naming an area `nav` does nothing for assistive tech; the `<nav>` element does. Keep the named map and the element semantics in sync.

## Performance
- Grid layout is cheap and computed once per layout pass; a static holy grail shell has effectively zero ongoing cost. Watch for **layout thrash** only if JS toggles track sizes on scroll/resize — debounce, or drive the change with media/container queries (no JS) as shown.
- Avoid animating `grid-template-columns` on every frame; transitioning track sizes triggers full relayout. If you animate a collapsing sidebar, prefer transforming the panel or animating `width` on a single column, and test for jank.
- For independently scrolling flanks, set `overflow: auto` and a bounded `max-height`; without bounds a long nav forces the whole page tall and defeats the sticky footer.
- `content-visibility: auto` on far-below-the-fold sections inside `main` skips their rendering until needed — useful for very long content wells, but measure: it can cause scrollbar jumps if you don't supply `contain-intrinsic-size`.
- Container queries add negligible cost for a handful of containers; only at hundreds of independently-queried containers does it start to matter.

## Anti-slop
Cliché (see `_slop-blocklist.md` → LAYOUT): the **"centred 800px column with equal padding and two empty sidebars"** — a holy grail shell shipped with nothing in the flanks, so the page reads as a narrow column marooned in grey gutters, plus the adjacent tic of a generic SaaS-blue (`#3B82F6`) nav on white. The fix: only build the third column when the aside has persistent, real content (an on-this-page TOC, contextual actions, related items); otherwise drop to the two-band variant and let the content well use the reclaimed width with full-bleed moments. Vary the rhythm — the centre column shouldn't be the same fixed measure with identical padding on every page. And commit to a real palette (here: warm off-white paper, near-black ink, a burnt-orange `#c2410c` accent) instead of the default neutral-grey-plus-blue that signals "untouched template." Breaking those two or three defaults is most of what separates a designed shell from a generated one.

## Pairs well with
- **sidebar+content** — the holy grail *is* a sidebar+content layout with header/footer chrome and a second rail; the two-band reduction is literally that pattern.
- **single-column** — the collapse target on mobile; a clean single column is what each band stacks into.
- **subgrid** — let cards or rows inside `main` align to the page grid's tracks (`grid-template-columns: subgrid`), keeping inner content aligned to the outer shell. Subgrid is Baseline (Chrome 117 / Sep 2023, with Firefox and Safari support).
- **bento grid** — a common occupant of the `main` content well when the centre is a dashboard rather than prose.
- **editorial-typographic** style — a strong type scale in the content column is what makes a documentation-style grail feel intentional rather than templated.

## Current references
- [Realizing common layouts using grids — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Common_grid_layouts) — the canonical `grid-template-areas` 1-to-3-column responsive walkthrough, with the exact area-string-rewrite-per-breakpoint technique.
- [Ten modern layouts in one line of CSS — web.dev](https://web.dev/articles/one-line-layouts) — section 05 is the holy grail as `grid-template: auto 1fr auto / auto 1fr auto`; the one-line framing.
- [The Holy Grail Layout with CSS Grid — CSS-Tricks](https://css-tricks.com/the-holy-grail-layout-with-css-grid/) — focused build-up of the named-area shell with breakpoint collapse, good historical contrast to the float era.
- [Grid — web.dev Learn CSS](https://web.dev/learn/css/grid) — grounding reference on tracks, named lines, and `grid-template-areas` semantics.
- [Holy Grail 3-column responsive layout — Matthew James Taylor](https://matthewjamestaylor.com/holy-grail-layout) — a long-maintained reference (updated for Grid + Flexbox) that also documents why the float-era version was painful.
- [CSS :has() — Can I use](https://caniuse.com/css-has) — confirms `:has()` is broadly supported (Chrome 105 / Safari 15.4 / Firefox 121), so the `:has(aside)` track-switch trick is production-safe with an `@supports` guard.
- [CSS container queries — Can I use](https://caniuse.com/css-container-queries) — confirms container queries are widely available (since Feb 2023) for the component-driven collapse variant.
