# Container queries

> Style a component based on the size or custom-property state of its own container, not the viewport — so the same component can look right in a narrow sidebar and a wide main column without any media-query hacks.

**Bucket:** layout
**Maturity:** current
**Effort:** low
**Best for:** websites, portfolios, apps, dashboards

## What it is

A container query (`@container`) lets any element inspect its own containment context — typically its parent's inline width, full size, or the value of a CSS custom property — and apply styles to itself or its descendants accordingly. The component declares its own breakpoints, so a card component switches from stacked to side-by-side layout depending on how much space it is actually given, not what the screen width happens to be. This decouples components from the page layout they are placed in, making them genuinely portable across sidebars, grids, full-bleed sections, and modals without separate override stylesheets.

## When to use

- Card, tile, or teaser components that appear in multiple column-count contexts (1-col sidebar, 2-col grid, 4-col feature row) and need to change their internal layout at each width.
- Dashboard widgets that need to compress or expand their content depending on how much of the grid they occupy.
- Design-system components that must be layout-agnostic: the component author writes the breakpoints, not every page that consumes the component.
- Typography and spacing inside a component that should scale relative to the component's own width, not the viewport (`cqi`/`cqw` units replace hacked `vw` values inside cards).
- Theming and variant toggling via style queries: propagate a `--variant: featured` custom property down the tree and let child elements opt into the featured treatment without extra class logic.
- Any reusable component library where the consumer's layout is unknown at authoring time.

## When NOT to use

- Page-level layout decisions (global column count, navigation collapse, print styles) — these genuinely belong to viewport/media queries, which read the whole available canvas.
- Triggering on device orientation, `prefers-color-scheme`, `prefers-reduced-motion`, `pointer`, or any other media feature — `@container` does not support media features, only size and style conditions.
- Elements whose width is determined by their own content (e.g., an `inline` element or a shrink-wrapped flex child with no explicit size) — the container query's measurement point will be unreliable. Use `inline-size` on a block wrapper instead.
- When every component on the page already has a fixed, predictable placement that never changes context — you add indirection for no benefit.
- The overuse pattern: applying `container-type: inline-size` to every single element by default the way some reset stylesheets blanket `box-sizing`. Containment has a small but real rendering cost; scope it to components that actually need it.

## How it works

CSS Containment (`contain` property) is the underlying engine. When you set `container-type: inline-size` on an element, you tell the browser to apply inline-size containment to it: the element's inline size no longer depends on its children's sizes, which breaks the would-be circular dependency that previously made container queries unsolvable. The browser can then expose that stable width to `@container` rules as a measurable value.

Child elements — not the container itself — are what the `@container` rules style. You cannot query a container and apply the matched styles to that same element; the styles always cascade down to its descendants.

**Size queries** check computed dimensions of the nearest named or anonymous containment ancestor.

**Style queries** check the computed value of a CSS custom property on the container — currently only custom properties are queryable in all supporting browsers; querying regular CSS properties like `font-weight` is not yet broadly shipped (see Browser support in the code section).

**Container query units** express lengths relative to the containment context rather than the viewport:

| Unit | Resolves to |
|------|------------|
| `cqi` | 1% of the container's inline size (usually width in horizontal writing modes) |
| `cqw` | 1% of the container's width (physical) |
| `cqb` | 1% of the container's block size |
| `cqh` | 1% of the container's height (physical) |
| `cqmin` | The smaller of `cqi` and `cqb` |
| `cqmax` | The larger of `cqi` and `cqb` |

If no eligible container ancestor exists, `cq*` units fall back to the small viewport units (`sv*`) for the matching axis.

**Key properties:**

```
container-type: inline-size | size | normal
container-name: <ident>
container: <name> / <type>   /* shorthand */
```

`inline-size` — the common case, queries width only and avoids height-collapse bugs.
`size` — queries both axes; the element collapses to zero height if its children do not provide explicit height, so it needs an explicit height or a flex/grid context.
`normal` — opts out of size queries but keeps the element as a style-query container for custom properties.

## Working code

### Vanilla CSS — responsive card component

A single card component that switches layout at two container breakpoints, uses `cqi` for fluid font sizing, and falls back gracefully in browsers that do not support container queries.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Container queries — card component</title>
  <style>
    /* ─── reset & tokens ─── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; }

    :root {
      --surface-0: #0f1117;
      --surface-1: #1a1d27;
      --surface-2: #252836;
      --text-primary: #e8eaf0;
      --text-secondary: #9499ab;
      --accent: #5b8af0;     /* measured against surface-1: ~5.2:1 — passes AA normal (4.5:1) and AA large (3:1) */
      --accent-subtle: #1f2d4a;
      --radius: 0.75rem;
      --gap: 1.5rem;
    }

    body {
      background: var(--surface-0);
      color: var(--text-primary);
      font-family: system-ui, sans-serif;
      padding: var(--gap);
      min-height: 100dvh;
    }

    /* ─── demo grid: three columns at wide viewport ─── */
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
      gap: var(--gap);
    }

    /* ─── containment context ─── */
    /*
       The .card-wrapper is the container. The card itself is its child,
       so @container rules can style .card and everything inside it.
       This wrapper pattern is required — you cannot query an element
       against itself.
    */
    .card-wrapper {
      container-type: inline-size;
      container-name: card;
    }

    /* ─── card — mobile-first / narrow base ─── */
    .card {
      background: var(--surface-1);
      border: 1px solid var(--surface-2);
      border-radius: var(--radius);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .card__image {
      aspect-ratio: 16 / 9;
      width: 100%;
      object-fit: cover;
      display: block;
      background: var(--surface-2); /* placeholder when no img src */
    }

    .card__body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .card__label {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
    }

    .card__title {
      /*
        cqi: fluid sizing relative to the container's inline size.
        At 20rem container → ~1.1rem; at 40rem container → ~1.35rem.
        clamp() guards the extremes.
      */
      font-size: clamp(1rem, 0.75rem + 1.25cqi, 1.5rem);
      font-weight: 700;
      line-height: 1.2;
      color: var(--text-primary);
    }

    .card__description {
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--text-secondary);
    }

    .card__meta {
      margin-top: auto;
      padding-top: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .card__avatar {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      background: var(--accent-subtle);
      border: 2px solid var(--accent);
      flex-shrink: 0;
    }

    /* ─── medium container: side-by-side image ─── */
    @container card (width >= 28rem) {
      .card {
        flex-direction: row;
      }

      .card__image {
        width: clamp(8rem, 35cqi, 14rem);
        aspect-ratio: auto;
        flex-shrink: 0;
      }
    }

    /* ─── wide container: richer layout ─── */
    @container card (width >= 42rem) {
      .card__body {
        padding: 2rem;
      }

      .card__description {
        /* show two lines of description only available at wider sizes */
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    /* ─── fallback for browsers without container queries ─── */
    /*
       @supports (container-type: inline-size) guards are optional because
       browsers without support simply ignore @container blocks entirely.
       The base (mobile-first stacked) styles above are the natural fallback.
       Only add @supports if you need to hide something that would look wrong
       in non-supporting browsers without the container-query enhancement.
    */

    /* ─── style query demo ─── */
    /*
       Style queries let you branch on a CSS custom property set on an ancestor.
       No container-type required — every element is a style-query container by default.
       Browser support: Chrome 111+, Edge 111+, Safari 18+, Firefox 151+.
       (≈88% global coverage as of mid-2026; safe to ship with graceful degradation.)
    */
    .card-wrapper[data-featured="true"] {
      --featured: 1;
    }

    @container style(--featured: 1) {
      .card {
        border-color: var(--accent);
        background: linear-gradient(
          160deg,
          var(--accent-subtle) 0%,
          var(--surface-1) 60%
        );
      }

      .card__label {
        /* Visually call out the featured state */
        background: var(--accent);
        color: #fff;
        padding: 0.2em 0.5em;
        border-radius: 0.25em;
        display: inline-block;
      }
    }
  </style>
</head>
<body>
  <!--
    Resize the browser (or wrap .demo-grid in a narrower column)
    to see each card adapt independently.
  -->
  <div class="demo-grid">

    <!-- standard card -->
    <div class="card-wrapper">
      <article class="card">
        <div class="card__image" role="img" aria-label="Abstract geometric pattern in blue tones"></div>
        <div class="card__body">
          <span class="card__label">Infrastructure</span>
          <h2 class="card__title">Distributed tracing at scale</h2>
          <p class="card__description">
            How the platform team cut tail latency by 40% by
            replacing sampled traces with a head-based sampling strategy
            tuned per service criticality.
          </p>
          <div class="card__meta">
            <div class="card__avatar" aria-hidden="true"></div>
            <span>Priya Nair &middot; 8 min read</span>
          </div>
        </div>
      </article>
    </div>

    <!-- featured card — style query triggers the accent border/gradient -->
    <div class="card-wrapper" data-featured="true" style="--featured: 1;">
      <article class="card">
        <div class="card__image" role="img" aria-label="Abstract geometric pattern in warm tones"></div>
        <div class="card__body">
          <span class="card__label">Featured</span>
          <h2 class="card__title">CSS containment and the layout cost model</h2>
          <p class="card__description">
            A deep look at how size and layout containment work together,
            and when the browser's containment optimisation actually pays off
            versus adding overhead.
          </p>
          <div class="card__meta">
            <div class="card__avatar" aria-hidden="true"></div>
            <span>Kofi Asante &middot; 12 min read</span>
          </div>
        </div>
      </article>
    </div>

    <!-- narrow card (forces stacked layout) -->
    <div class="card-wrapper" style="max-width: 20rem;">
      <article class="card">
        <div class="card__image" role="img" aria-label="Abstract geometric pattern in green tones"></div>
        <div class="card__body">
          <span class="card__label">Frontend</span>
          <h2 class="card__title">Fluid typography without guesswork</h2>
          <p class="card__description">
            Using cqi units inside a component to scale headings
            proportionally to available space — no viewport assumptions needed.
          </p>
          <div class="card__meta">
            <div class="card__avatar" aria-hidden="true"></div>
            <span>Lena Vogt &middot; 5 min read</span>
          </div>
        </div>
      </article>
    </div>

  </div>
</body>
</html>
```

### Named container — sidebar vs main slot

Named containers let you query a specific ancestor when multiple containers are nested.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Named container — sidebar vs main</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; }

    :root {
      --bg: #0f1117;
      --surface: #1a1d27;
      --border: #252836;
      --text: #e8eaf0;
      --muted: #9499ab;
      --accent: #5b8af0;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: system-ui, sans-serif;
      display: grid;
      grid-template-columns: 16rem 1fr;
      grid-template-rows: auto 1fr;
      min-height: 100dvh;
    }

    header {
      grid-column: 1 / -1;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--muted);
    }

    /* named container: sidebar */
    aside {
      container: sidebar / inline-size;
      border-right: 1px solid var(--border);
      padding: 1rem;
    }

    /* named container: main */
    main {
      container: main / inline-size;
      padding: 1.5rem;
    }

    /* .widget adapts to whichever named container it lives inside */
    .widget {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 1rem;
      margin-block-end: 0.75rem;
    }

    .widget__title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin-block-end: 0.5rem;
    }

    .widget__value {
      /* scales with the sidebar container's inline size */
      font-size: clamp(1.25rem, 8cqi, 2.5rem);
      font-weight: 700;
      color: var(--text);
    }

    /* When this widget is inside .sidebar and sidebar is narrow: compact row */
    @container sidebar (width < 14rem) {
      .widget {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
      }

      .widget__title {
        margin: 0;
        flex: 1;
      }
    }

    /* When inside .main, show a richer layout */
    @container main (width >= 30rem) {
      .widget {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: start;
        gap: 0.25rem 1rem;
      }

      .widget__title {
        grid-column: 1;
      }

      .widget__value {
        grid-column: 2;
        grid-row: 1 / 3;
        align-self: center;
      }

      .widget__description {
        grid-column: 1;
        font-size: 0.8125rem;
        color: var(--muted);
        line-height: 1.5;
      }
    }
  </style>
</head>
<body>
  <header>Named container demo — sidebar vs main</header>

  <aside>
    <div class="widget">
      <p class="widget__title">Requests / min</p>
      <p class="widget__value">4,821</p>
    </div>
    <div class="widget">
      <p class="widget__title">Error rate</p>
      <p class="widget__value">0.3%</p>
    </div>
  </aside>

  <main>
    <div class="widget">
      <p class="widget__title">Requests / min</p>
      <p class="widget__value">4,821</p>
      <p class="widget__description">Up 12% from the same window yesterday. Peak was 6,200 at 14:32 UTC.</p>
    </div>
    <div class="widget">
      <p class="widget__title">Error rate</p>
      <p class="widget__value">0.3%</p>
      <p class="widget__description">Within normal bounds. Last spike was 1.8% on Tuesday during the deploy.</p>
    </div>
  </main>
</body>
</html>
```

### React component with container query (CSS Modules / vanilla CSS-in-JS)

In React the containment context is just a class on the wrapper; the `@container` rules live in your stylesheet. Nothing framework-specific is required.

```jsx
// ArticleCard.jsx
// Requires: ArticleCard.module.css (below)
import styles from './ArticleCard.module.css';

export function ArticleCard({ label, title, description, author, readTime, featured = false }) {
  return (
    // The wrapper IS the container — children query it.
    <div
      className={styles.wrapper}
      style={featured ? { '--featured': '1' } : undefined}
    >
      <article className={styles.card}>
        <div className={styles.image} role="img" aria-label={`Cover image for ${title}`} />
        <div className={styles.body}>
          <span className={styles.label}>{label}</span>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
          <footer className={styles.meta}>
            <span className={styles.avatar} aria-hidden="true" />
            <span>{author} &middot; {readTime} min read</span>
          </footer>
        </div>
      </article>
    </div>
  );
}
```

```css
/* ArticleCard.module.css */

/* Containment context on the wrapper, not the card itself */
.wrapper {
  container-type: inline-size;
  container-name: article-card;
}

.card {
  background: var(--surface-1, #1a1d27);
  border: 1px solid var(--border, #252836);
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.image {
  aspect-ratio: 16 / 9;
  width: 100%;
  object-fit: cover;
  background: var(--surface-2, #252836);
}

.body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent, #5b8af0);
}

.title {
  /* cqi scales relative to the card's container, not the viewport */
  font-size: clamp(1rem, 0.75rem + 1.25cqi, 1.5rem);
  font-weight: 700;
  line-height: 1.2;
}

.description {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text-secondary, #9499ab);
}

.meta {
  margin-top: auto;
  padding-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary, #9499ab);
}

.avatar {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: #1f2d4a;
  border: 2px solid var(--accent, #5b8af0);
  flex-shrink: 0;
}

/* medium layout: horizontal */
@container article-card (width >= 28rem) {
  .card {
    flex-direction: row;
  }

  .image {
    width: clamp(8rem, 35cqi, 14rem);
    aspect-ratio: auto;
    flex-shrink: 0;
  }
}

/* style query: featured variant propagated via CSS custom property */
@container style(--featured: 1) {
  .card {
    border-color: var(--accent, #5b8af0);
    background: linear-gradient(
      160deg,
      #1f2d4a 0%,
      var(--surface-1, #1a1d27) 60%
    );
  }
}
```

## Variations

**Size query — inline-size only (common case)**
`container-type: inline-size`. Queries only width. The safe default; avoids height-collapse that `size` causes on content-driven elements.

**Size query — both axes**
`container-type: size`. Useful for elements that have an explicit height (a fixed-height widget, a map tile). Requires explicit or context-derived height or the container collapses to zero.

**Named vs anonymous container**
Named: `container: card / inline-size` then `@container card (...)`. Use named when the component may be nested and you need to target a specific ancestor rather than the nearest one.

**Style query — custom property state**
`@container style(--variant: compact)`. Lets a parent inject a variant flag via a custom property; the component responds without needing an extra class or JS data attribute. Currently limited to custom properties in all browsers (Chrome 111+, Safari 18+, Firefox 151+).

**Container query units as fluid sizing**
Use `cqi` inside `clamp()` to make typography or spacing proportional to the component's own width: `font-size: clamp(1rem, 0.8rem + 1.5cqi, 1.75rem)`. This replaces the common (incorrect) pattern of using `vw` inside a card that is only part of the page width.

**Range syntax**
`@container (20rem <= width < 40rem)` — the modern level-4 range syntax is more readable than stacked `min-width`/`max-width` pairs and supported wherever size queries are.

**Nested containers**
A child element can be its own container. Each `@container` rule walks up to the nearest matching named or untyped ancestor. Be deliberate: deeply nested containment contexts can make debugging harder and add slight rendering cost at each boundary.

## Accessibility

Container queries are a pure layout/styling mechanism; they do not move DOM nodes, alter focus order, or change semantics. No ARIA additions are needed for the query mechanism itself, but any layout-dependent changes must still respect accessibility requirements:

- **Reflow at 400% zoom (WCAG 1.4.10):** Because container queries respond to the element's actual available width (which shrinks as zoom increases), they naturally reflow to narrower layouts at high zoom levels — this is a benefit, not a concern. Verify with your actual component at 400% to confirm the narrow layout remains readable.
- **Focus visibility:** If a container query hides, collapses, or repositions interactive elements (e.g., a label that disappears in a compact variant), those elements must remain keyboard-focusable and visible when focused. Never use a container query to set `display: none` on a focusable element without also managing focus.
- **Touch targets:** Any interactive elements inside a container-queried component must maintain a minimum 44×44 px touch target at all breakpoints. Check both the narrow (stacked) and wide (side-by-side) layouts. If a compact variant shrinks a button below target size, add `min-height: 44px; min-width: 44px` unconditionally, not inside the query.
- **prefers-reduced-motion:** Container queries themselves do not animate anything. If you combine a container-query layout switch with a CSS transition on the changed property (e.g., transitioning `flex-direction` changes via pseudo-transitions on child dimensions), guard those transitions:

  ```css
  @media (prefers-reduced-motion: no-preference) {
    .card__image {
      transition: width 0.25s ease, aspect-ratio 0.25s ease;
    }
  }
  ```

  Do not apply layout transitions unconditionally; `aspect-ratio` and dimensional changes can cause layout-thrash animations that are disorienting for vestibular users.

- **Screen readers:** The DOM order is unchanged by container queries; the visual reorder caused by `flex-direction: row` vs `column` does not affect reading order. This is correct behavior — ensure the source order is logical for the screen-reader experience regardless of visual layout.
- **Color contrast:** The style-query featured variant introduces a gradient background. If you change background under text, re-verify contrast. In the code above, `var(--text-primary)` (#e8eaf0) on the gradient's dark end (#1a1d27) measures approximately 14.4:1 — well above WCAG AA (4.5:1) and AAA (7:1).

## Performance

**Containment is a net positive, not free.** Each `container-type` declaration creates a new containment boundary. The browser isolates layout calculations within that boundary, which is generally faster for large DOMs because changes inside a container do not trigger parent relayout. However, the containment context itself adds a small overhead per element.

- Scope containment to elements that actually need it. Do not blanket `container-type: inline-size` on every element in a global reset.
- `container-type: size` triggers both inline-size and block-size containment and is more expensive than `inline-size` alone. Only use `size` when you need to query height.
- `@container` rule matching is re-evaluated on resize events (or when the container's dimensions change from any cause — flex parent resizing, adjacent element addition, etc.). Keep the number of container breakpoints per component small (2–3) and avoid container queries inside `:hover` or focus states that trigger style recalculation at high frequency.
- Container query units (`cqi`, `cqw`) are resolved per layout pass relative to the containment ancestor; they do not cause extra repaints but are recalculated on every layout where the container dimensions change. This is equivalent in cost to using `%` units.
- Do not animate properties that are checked by a container query (e.g., `width` of the container itself) with CSS transitions unless you understand that every step of the transition fires a layout pass that re-evaluates `@container` conditions. Animate `transform: scaleX()` on a child instead if you need a width-expansion visual.
- No GPU layer promotion is caused by container queries. Do not add `will-change: transform` to containers hoping to speed up query re-evaluation — it has no effect on the containment mechanism and can waste compositor memory.

## Anti-slop

**The cliche:** Applying `container-type: inline-size` to every element, then recreating standard media-query breakpoints (320px / 768px / 1024px) inside `@container` rules. This substitutes one blunt instrument for another and misses the point — the component's actual constraints are now identical to the viewport constraints, making the added complexity pointless.

**The tasteful fix (cross-ref `_slop-blocklist.md` → Layout):** Use container queries to break away from the viewport-matching grid of "hero + three identical icon-title-blurb cards." A card that has its own narrow/wide intelligence can be placed into a tight 3-column sidebar or a full-bleed 1-column slot and still look right — enabling the asymmetric bento grids and editorial detail rows the blocklist recommends. Reserve media queries for the macro level (the grid itself), and let container queries handle component intelligence.

**The cqi misuse:** Using `cqi` inside elements that have no containment ancestor, expecting it to behave like `vw`. Without a containment context, `cqi` falls back to small viewport units — which is often what the author accidentally wanted, but the intent is wrong and the fallback behavior is fragile.

**The extra-wrapper fatigue:** Wrapping every element in a redundant `<div class="container-wrapper">` even when the parent is already a block-level element that could declare containment. If the grid cell or flex parent can carry `container-type` without breaking its own sizing, use it directly and save the DOM node.

## Pairs well with

- `fluid-type` / `clamp()`-based typography — `cqi` units inside `clamp()` replace `vw` for intra-component fluid type, eliminating the need for `vw` arithmetic that assumes the component fills the full page width.
- `subgrid` — subgrid lets a card's internal columns align to the outer grid's tracks; container queries let that same card switch to a stacked layout when its grid cell is narrow. The two compose cleanly.
- `css-grid-layout` / `auto-fill minmax()` — the page grid decides column count (media-query territory); the card decides its internal layout (container-query territory). This is the canonical separation of concerns.
- `cascade-layers` — when building a design system, define default component styles in one layer and container-query overrides in a higher-priority layer, making override specificity explicit and predictable.
- `custom-properties` / `@property` — style queries on registered custom properties (using `@property` with a `syntax` descriptor) enable precise value matching (e.g., equivalent color expressions all match), making style-query-based theming more robust.

## Current references

- [CSS container queries — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries) — canonical reference for container-type, container-name, @container syntax, and CQ units
- [Using container size and style queries — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries) — style query syntax, custom property matching, range syntax, boolean context
- [Container queries — Can I use](https://caniuse.com/css-container-queries) — live browser support table; size queries at ~93% global coverage as of mid-2026
- [Container style queries for custom properties — Can I use](https://caniuse.com/mdn-css_at-rules_container_style_queries_for_custom_properties) — style query coverage at ~88% global as of mid-2026 (Firefox 151+)
- [An Interactive Guide to CSS Container Queries — Ahmad Shadeed](https://ishadeed.com/article/css-container-query-guide/) — in-depth patterns, named containers, pitfalls, 15+ real component examples (April 2024)
- [Container queries in 2026: Powerful, but not a silver bullet — LogRocket](https://blog.logrocket.com/container-queries-2026/) — limitations, when to keep media queries, honest adoption data from State of CSS 2025 (December 2025)
- [How to use container queries now — web.dev](https://web.dev/blog/how-to-use-container-queries-now) — progressive-enhancement strategy, @supports detection, ResizeObserver fallback pattern
- [A Friendly Introduction to Container Queries — Josh W. Comeau](https://www.joshwcomeau.com/css/container-queries-introduction/) — the wrapper-pattern mental model, why height-containment collapses, inline vs size explained clearly (November 2024)
- [CSS Container Queries in 2025 — caisy.io](https://caisy.io/blog/css-container-queries) — component case studies, cqi usage, anti-patterns (December 2024)
