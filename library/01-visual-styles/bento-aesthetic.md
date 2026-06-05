# Bento aesthetic

> A surface style of rounded, soft-elevated tiles—each holding one glanceable idea with its own accent—arranged at varied sizes like a partitioned lunchbox, the look Apple uses on keynote feature slides.

**Bucket:** visual style
**Maturity:** current / cycling-back
**Effort:** low
**Best for:** websites, portfolios, apps, dashboards

## What it is
The bento aesthetic is what tiles *look and feel like*, not how they're placed. Each tile is a rounded rectangle (typically 16–28px radius) sitting on a slightly darker or lighter canvas, lifted by a soft, low-contrast shadow, and carrying exactly one unit of meaning: a stat, an icon, a product render, a short claim. Tiles vary in footprint (one hero tile, a couple of mediums, several smalls) so the eye reads importance at a glance, and each tile may earn its own accent color, gradient wash, or mini-illustration. The viewer perceives a calm, premium, "everything-has-its-compartment" grid—dense but never cluttered.

It is the *skin*. The *skeleton*—how many columns, which tile spans which cells, how it reflows on mobile—is the **bento-grid layout** (see the difference below).

## Bento aesthetic vs. bento-grid layout
- **Bento aesthetic (this entry):** the visual treatment of an individual tile and the set—radius, elevation, fill, per-tile accent, internal padding rhythm, the tactile "card" feel. You can apply it to a 2-column stack or a single feature strip.
- **Bento-grid layout (separate concept):** the *structural* decision—a CSS Grid with explicit column/row spans producing asymmetric, varied-size cells (one big, several small). It governs reflow, span logic, and density, independent of how pretty each cell is.
- **Why they get conflated:** Apple shipped both together (varied grid + glossy rounded tiles), so people say "bento" for either. In practice you can have the layout without the aesthetic (a plain masonry of flat boxes) or the aesthetic without the layout (one rounded, accented hero card). This file is about making each tile *feel* like bento.

## When to use
- Feature overviews, "what's new," or spec summaries where each point is independent and scannable.
- Product/marketing pages that want an Apple-grade premium feel without bespoke art per section.
- Portfolios: one tile per project highlight, sized by prominence.
- App home screens and dashboards: KPIs, shortcuts, and widgets that read at a glance.
- Pricing/comparison or "by the numbers" sections where varied tile size encodes hierarchy.

## When NOT to use
- Linear, sequential content (a tutorial, a story, a legal doc). Tiles imply *parallel, independent* chunks; forcing a sequence into bento breaks reading order and tab order.
- Long body copy. A bento tile holds a headline + a sentence, not three paragraphs—text-heavy tiles read as cramped cards.
- When every tile gets its own loud accent color. The overused version is a rainbow of differently-colored gradient tiles (the AI-generated "feature wall"); restraint is what makes it look designed (see Anti-slop).
- Data-dense tables or anything needing aligned columns across rows—bento's varied spans fight tabular alignment.
- Tiny mobile-first surfaces where varied spans collapse to a single column anyway; you lose the "varied size" payoff and just have stacked cards.

## How it works
A bento tile is a small set of coordinated CSS properties applied consistently across the set:

1. **Radius** — a single rounding token (e.g. `--r: 20px`) on every tile so corners feel like one family. Apple-era bento leans large: 16–28px.
2. **Elevation** — a soft, low-spread shadow (often a layered two-shadow stack: a tight contact shadow + a wide ambient one) rather than one harsh drop shadow. On dark canvases, elevation is often a subtle top **border highlight** plus shadow, since shadows read weakly on dark.
3. **Fill / canvas contrast** — tile background sits a step off the page background (lighter tile on light page, or a `color-mix` lift on dark). This separation, not a heavy border, is what makes tiles "float."
4. **Per-tile accent** — an optional accent applied *to content* (icon tint, a thin top rule, a number color, or a faint one-hue gradient wash in a corner)—used on a *minority* of tiles for emphasis, not all of them.
5. **Internal rhythm** — consistent padding (`clamp()`-based) and a small internal type scale: an eyebrow/label, a large focal value, a one-line caption.
6. **Optional hover lift** — translate up a few px and deepen the shadow on pointer devices for tactility.

Key CSS APIs: CSS Grid for spans (`grid-column`/`grid-row: span N`), custom properties for the radius/shadow/accent tokens, `color-mix()` for canvas-relative fills, `clamp()` for fluid padding/type, and `@media (hover: hover)` to gate the lift to real pointers.

## Working code

### Vanilla HTML/CSS — the bento *skin* on a small grid

Self-contained; open in any modern browser. Dark canvas, soft elevation via border highlight + layered shadow, one accent tile, hover lift gated to pointer devices, reduced-motion respected. Text colors below meet WCAG AA on their tile fills (values noted in the comments).

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bento aesthetic</title>
<style>
  :root {
    --bg:        #0e1014;   /* page canvas */
    --tile:      #181b22;   /* tile fill, lifted off canvas */
    --tile-hi:   #20242d;   /* hovered tile fill */
    --ink:       #f3f4f8;   /* primary text: ~16:1 on #181b22 (AAA) */
    --ink-dim:   #aeb4c0;   /* secondary text: ~7:1 on #181b22 (AAA) */
    --hair:      rgba(255,255,255,.08); /* top-edge highlight = "elevation" on dark */
    --accent:    #5eead4;   /* single accent hue (teal); ~10.6:1 on #181b22 (AAA) */
    --r: 20px;
    --pad: clamp(1.1rem, 2.4vw, 1.6rem);
    /* layered soft elevation: tight contact + wide ambient */
    --shadow: 0 1px 2px rgba(0,0,0,.40), 0 12px 32px -12px rgba(0,0,0,.55);
  }
  * { box-sizing: border-box; }
  body {
    margin:0; background:var(--bg); color:var(--ink);
    font: 400 16px/1.5 system-ui, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
    display:grid; place-items:center; min-height:100vh; padding:5vmin;
  }
  .bento {
    width:min(960px, 100%);
    display:grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 150px;
    gap: 14px;
  }
  /* THE BENTO SKIN — one token set, applied to every tile */
  .tile {
    position:relative;
    background:var(--tile);
    border-radius:var(--r);
    border-top:1px solid var(--hair);   /* fakes a lit top edge on dark */
    box-shadow:var(--shadow);
    padding:var(--pad);
    display:flex; flex-direction:column; justify-content:space-between;
    overflow:hidden;
    transition: transform .35s cubic-bezier(.16,1,.3,1),
                background-color .35s ease;
  }
  @media (hover: hover) and (pointer: fine) {
    .tile:hover { transform: translateY(-4px); background:var(--tile-hi); }
  }
  @media (prefers-reduced-motion: reduce) {
    .tile { transition: none; }
    .tile:hover { transform: none; }
  }
  .tile:focus-visible { outline:2px solid var(--accent); outline-offset:3px; }

  /* varied footprints = the "lunchbox" read of importance */
  .hero { grid-column: span 2; grid-row: span 2; }
  .wide { grid-column: span 2; }
  .tall { grid-row: span 2; }

  .eyebrow { font-size:.72rem; letter-spacing:.09em; text-transform:uppercase;
             color:var(--ink-dim); margin:0; }
  .value   { font-size:clamp(2rem, 5.5vw, 3.4rem); font-weight:650;
             letter-spacing:-.02em; margin:.2rem 0 0; line-height:1; }
  .cap     { color:var(--ink-dim); margin:.5rem 0 0; font-size:.92rem; }
  .lead    { font-size:clamp(1.3rem,3.2vw,1.9rem); font-weight:600;
             letter-spacing:-.01em; margin:0; max-width:22ch; }

  /* PER-TILE ACCENT — used on ONE tile, not all (restraint = taste) */
  .accent  { border-top-color: color-mix(in srgb, var(--accent) 40%, transparent); }
  .accent .value { color: var(--accent); }
  .accent::after {           /* faint single-hue corner wash, low alpha */
    content:""; position:absolute; inset:auto -30% -40% auto;
    width:60%; aspect-ratio:1; border-radius:50%;
    background: radial-gradient(circle, color-mix(in srgb,var(--accent) 22%, transparent), transparent 70%);
    pointer-events:none;
  }
  .icon { width:34px; height:34px; border-radius:10px;
          background: color-mix(in srgb, var(--accent) 22%, var(--tile));
          display:grid; place-items:center; color:var(--accent);
          font-weight:700; }
</style></head>
<body>
  <section class="bento" aria-label="Product highlights">
    <article class="tile hero accent" tabindex="0">
      <div class="icon" aria-hidden="true">↑</div>
      <div>
        <p class="eyebrow">Battery</p>
        <p class="value">22 hrs</p>
        <p class="cap">All-day video playback on a single charge.</p>
      </div>
    </article>

    <article class="tile" tabindex="0">
      <p class="eyebrow">Display</p>
      <p class="value">2000</p>
      <p class="cap">nits peak brightness</p>
    </article>

    <article class="tile" tabindex="0">
      <p class="eyebrow">Weight</p>
      <p class="value">1.24 kg</p>
      <p class="cap">aluminium unibody</p>
    </article>

    <article class="tile wide" tabindex="0">
      <p class="lead">Engineered to feel like one solid piece of glass and metal.</p>
    </article>

    <article class="tile" tabindex="0">
      <p class="eyebrow">Ports</p>
      <p class="value">3×</p>
      <p class="cap">Thunderbolt&nbsp;4</p>
    </article>

    <article class="tile" tabindex="0">
      <p class="eyebrow">Storage</p>
      <p class="value">2 TB</p>
      <p class="cap">NVMe SSD</p>
    </article>
  </section>
</body></html>
```

### React + Tailwind — the same skin as a reusable `<Tile>`

The skin is encapsulated in one component; grid spans are passed per tile. No external deps. Requires Tailwind v3.4+ (arbitrary values shown inline; promote them to `theme.extend` tokens in production).

```jsx
// Tile.jsx
function Tile({ span = "", accent = false, eyebrow, value, caption, children }) {
  return (
    <article
      tabIndex={0}
      className={[
        // base bento skin
        "relative flex flex-col justify-between overflow-hidden",
        "rounded-[20px] p-[clamp(1.1rem,2.4vw,1.6rem)]",
        "bg-[#181b22] border-t border-white/10",
        "shadow-[0_1px_2px_rgba(0,0,0,.4),0_12px_32px_-12px_rgba(0,0,0,.55)]",
        "transition-[transform,background-color] duration-300 ease-[cubic-bezier(.16,1,.3,1)]",
        "hover:-translate-y-1 hover:bg-[#20242d]",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#5eead4]",
        accent && "border-t-[#5eead4]/40",
        span,
      ].filter(Boolean).join(" ")}
    >
      {accent && (
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-[40%] -right-[30%] aspect-square w-[60%] rounded-full
                     bg-[radial-gradient(circle,rgba(94,234,212,.22),transparent_70%)]"
        />
      )}
      {eyebrow && (
        <p className="m-0 text-[.72rem] uppercase tracking-[.09em] text-[#aeb4c0]">{eyebrow}</p>
      )}
      {value && (
        <p className={`mt-0.5 text-[clamp(2rem,5.5vw,3.4rem)] font-[650] leading-none tracking-[-.02em]
                       ${accent ? "text-[#5eead4]" : "text-[#f3f4f8]"}`}>{value}</p>
      )}
      {caption && <p className="mt-2 text-[.92rem] text-[#aeb4c0]">{caption}</p>}
      {children}
    </article>
  );
}

export default function Bento() {
  return (
    <section
      aria-label="Product highlights"
      className="mx-auto grid w-[min(960px,100%)] grid-cols-4 auto-rows-[150px] gap-[14px]"
    >
      <Tile span="col-span-2 row-span-2" accent eyebrow="Battery" value="22 hrs"
            caption="All-day video playback on a single charge." />
      <Tile eyebrow="Display" value="2000" caption="nits peak brightness" />
      <Tile eyebrow="Weight"  value="1.24 kg" caption="aluminium unibody" />
      <Tile span="col-span-2">
        <p className="m-0 max-w-[22ch] text-[clamp(1.3rem,3.2vw,1.9rem)] font-semibold tracking-[-.01em] text-[#f3f4f8]">
          Engineered to feel like one solid piece of glass and metal.
        </p>
      </Tile>
      <Tile eyebrow="Ports"   value="3×"   caption="Thunderbolt 4" />
      <Tile eyebrow="Storage" value="2 TB" caption="NVMe SSD" />
    </section>
  );
}
```

## Variations
- **Light vs. dark canvas** — the knob is *how elevation reads*. On light, lean on the layered shadow and a near-white tile; on dark, lead with a top border-highlight (`border-top: 1px solid rgba(255,255,255,.08)`) plus a softer shadow.
- **Flat-bento vs. glossy-bento** — flat: solid fills, hairline separation, minimal shadow (editorial, Notion-ish). Glossy: subtle gradient fills, larger radius, deeper soft shadow, hover lift (Apple-keynote feel). Knob: shadow depth + fill gradient.
- **Accent strategy** — knob is *how many tiles get color*. Monochrome (all neutral, accent only on the hero), tonal (all tiles share one hue at varying lightness), or categorical (2–3 hues that *encode* meaning, never decoration).
- **Imagery tiles** — some tiles are full-bleed product renders/photos behind a slight gradient scrim instead of text; mix sparingly so the set still reads as a system.
- **Radius scale** — small (8–12px, more app/utility) vs. pillowy (24–28px, more consumer/premium). Pick one and apply globally.

## Accessibility
- **prefers-reduced-motion** — the only motion here is the hover lift and its transition. Both snippets disable the transform and transition under `prefers-reduced-motion: reduce`, so a tile that lifts/eases for most users simply changes state instantly for users who opt out. Mandatory.
- **Pointer/touch fallback** — the lift is gated behind `@media (hover: hover) and (pointer: fine)` (vanilla) and Tailwind's `hover:` (which won't produce a sticky stuck-hover on tap if content isn't hidden behind it). Touch users get a static, fully-usable tile; never hide content or actions behind hover-only reveals.
- **Contrast** — all text/background pairs in the code meet WCAG AA or better on their actual tile fill (`#f3f4f8` ≈ 16:1, `#aeb4c0` ≈ 7:1, accent `#5eead4` ≈ 10.6:1, all on `#181b22`). The corner gradient wash is decorative and `aria-hidden`; never let a per-tile accent wash drop text below 4.5:1.
- **Focus** — interactive tiles use `:focus-visible` with a 2px accent outline and `outline-offset` so the ring clears the rounded corner. If a whole tile is a link/button, make the *tile* the focusable element (not just inner text) and give it an accessible name.
- **Keyboard / reading order** — bento implies parallel chunks, but the DOM order is still the tab and screen-reader order. Author tiles in a sensible reading sequence even when CSS spans rearrange them visually; don't rely on grid placement for meaning.
- **Screen readers** — wrap the set in a labelled landmark (`<section aria-label="…">`) and use a real heading element inside each tile where the eyebrow is a true heading. Decorative icons get `aria-hidden="true"`.

## Performance
- **Shadows repaint, not relayout.** The hover lift animates only `transform` (compositor-friendly) and `background-color`; it does not trigger layout. Avoid animating `box-shadow` directly—if you want the shadow to deepen on hover, cross-fade a pseudo-element's opacity instead of animating the blur radius.
- **No `backdrop-filter` here by default**, which is the expensive part of glassmorphism. Plain `box-shadow` + solid/gradient fills are cheap. If you add translucency/blur to tiles, budget for it—`backdrop-filter` forces extra compositing per frame and can stall on low-end mobile with many tiles.
- **Many tiles = many composited layers if you over-use `will-change`.** Don't set `will-change: transform` on every tile; let the browser promote on hover. A dozen always-promoted layers wastes GPU memory.
- **`color-mix()` and `clamp()`** are computed at style time, effectively free at runtime; safe to use liberally.
- **Bundle cost** — the vanilla version ships zero JS. The Tailwind version adds only utility classes (purged in build). No animation library needed for the core look.

## Anti-slop
The cliché (cross-ref `_slop-blocklist.md`):
- **SURFACE — soft drop shadow on everything.** The slop bento is every tile wearing the same generic `0 4px 12px rgba(0,0,0,.1)`. Fix: a *systematic* elevation scale—one layered, intentional shadow token, and reserve any deeper elevation for the genuinely-raised hero tile.
- **COLOR — purple/indigo-to-pink gradient on white (the #1 AI tell), and rainbow categorical color.** The generated feature wall gives each tile its own purple→pink wash. Fix: commit to one brand hue plus a single sharp accent (here, neutral tiles + one teal accent tile), or a tonal one-hue gradient; if tiles must differ in color, use 2–3 hues that *encode meaning*, not decoration.
- **LAYOUT — hero + three identical icon-title-blurb cards.** Bento that's secretly a 3-up card row with rounded corners isn't bento. Fix: genuinely vary tile footprints (one 2×2 hero, mediums, smalls) so size encodes importance—the whole point of the lunchbox metaphor.
- **TYPE — Inter/Roboto for everything, one weight.** Fix: a real modular scale inside the tile (uppercase eyebrow, oversized focal value with negative tracking, quiet caption) and a characterful display face for the big numbers if the brand allows.
- **COPY — Empower/Seamless/Unlock + lorem.** Bento lives or dies on concrete specifics ("22 hrs," "2000 nits"), not vague verbs. Fix: real numbers and claims.

Meta-rule: slop is grabbing every bucket's default at once. A bento that breaks 2–3 deliberately (one accent not six, varied spans not equal cards, a real type scale not one weight) is what separates designed from generated.

## Pairs well with
- **Bento-grid layout** (the structural counterpart): the grid/span skeleton this skin sits on—asymmetric CSS Grid with explicit `grid-column`/`grid-row` spans that reflow to one column on mobile.
- **Systematic elevation / shadow scale**: the shared shadow tokens that keep the whole set feeling like one tactile family.
- **Editorial/typographic style**: supplies the modular type scale (eyebrow → focal value → caption) that makes each tile read instantly.
- **Dark mode**: bento's border-highlight elevation trick is essentially a dark-mode technique; the two reinforce each other.
- **Staggered entrance** (behavior): tiles fading/scaling in with a small stagger on scroll-in—keep it subtle and reduced-motion-guarded.

## Current references
- [Bento Grids — bentogrids.com](https://bentogrids.com/) — a curated gallery of real bento designs in the wild; the fastest way to calibrate the aesthetic vs. lazy card rows.
- [Build a bento grid layout with CSS — iamsteve.me](https://iamsteve.me/blog/bento-layout-css-grid) — practical CSS Grid + container-query walkthrough for the span/reflow skeleton the skin sits on.
- [Bento Grid CSS Tutorial: Apple-Style Layout (2026) — senorit.de](https://senorit.de/en/blog/bento-grid-design-trend-2025) — traces the Apple-keynote origin and the 2025–26 "Bento 2.0" move toward larger radii and tactile micro-interactions.
- [Bento Grid Layouts 2026: Why Apple + Google Use Them — studiomeyer.io](https://studiomeyer.io/en/blog/bento-grid-layouts) — recent breakdown of tile-size ratios (hero ~40–50%, secondary ~20–25%) and why varied footprints carry hierarchy.
- [MDN — CSS Grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) — authoritative reference for the `grid-column`/`grid-row: span N` mechanics underneath the spans.
- [MDN — color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) — the canvas-relative fill/accent technique used in the code (now Baseline-supported).
