# Sidebar + content

> An app-shell layout where a fixed-width navigation rail sits beside a scrollable content pane, built with CSS Grid so the sidebar stays put while only the content scrolls.

**Bucket:** layout
**Maturity:** evergreen
**Effort:** medium
**Best for:** apps, dashboards, documentation sites, admin panels, settings screens

## What it is
The classic two-column application shell: a persistent navigation rail on one side (logo, nav links, account) and the working content on the other. The defining behaviour is *independent scroll containment* — the sidebar holds its position (sticky or its own scroll container) while the main pane scrolls on its own, so navigation is always one glance away. On narrow viewports the rail collapses: either to an icon-only mini rail, or off-canvas into a slide-in drawer triggered by a hamburger button. The user perceives a stable frame around changing content — like a desktop application rather than a scrolling document.

## When to use
- **Wayfinding-heavy products** — dashboards, admin tools, IDEs, email/chat apps, docs — where the user repeatedly jumps between sections and the nav must stay visible (persistent recognition beats repeated recall).
- **Task-oriented screens** rather than reading-oriented ones: the content pane is a workspace (tables, forms, editors), not an article you read top-to-bottom.
- **Deep, flat-ish navigation** — 5 to ~20 destinations that benefit from being permanently exposed in a vertical scan column (the eye runs a quick top-to-bottom F-stroke down the rail).
- **Stateful apps** where you want the nav, header, and content to scroll independently so the user never loses their place in either.
- When you want a **collapsible rail** so power users can reclaim horizontal space for wide content (spreadsheets, canvases).

## When NOT to use
- **Marketing/landing pages and editorial content.** A persistent rail steals horizontal space and competes with the reading column; use a top nav + single column instead. The cliché here is bolting a dashboard sidebar onto a content site because a component library shipped one — everyone overuses the app-shell sidebar for sites that are really just pages to read.
- **Very shallow navigation (2–4 links).** A top bar is lighter and gives content full width.
- **Content that must reach full bleed** (immersive maps, video editors, presentations) — a fixed rail fights the content; prefer an overlay/auto-hiding panel.
- **Primarily mobile audiences.** The sidebar is a desktop idiom; if most sessions are phones, design the drawer/bottom-nav first and treat the rail as the enhancement.
- **Two competing sidebars plus content on a small laptop** — three columns on a 1280px screen crush the workspace; collapse aggressively.

## How it works
The mechanism is a grid container that is exactly viewport-tall, with two tracks: a fixed sidebar track and a flexible content track. The trick that makes "only the content scrolls" work is putting `min-height: 0` (or `overflow` directly) on the *grid item*, not the page — a grid/flex item defaults to `min-height: auto`, which refuses to shrink below its content and breaks inner scrolling. Once each pane is its own scroll container (`overflow: auto`), the panes scroll independently and the body never scrolls at all.

Key properties / APIs:

- **CSS Grid** — `grid-template-columns: var(--rail) 1fr` and `height: 100dvh` (dynamic viewport unit so mobile browser chrome doesn't clip it). `grid-template-areas` makes the header/sidebar/content relationship readable.
- **`min-height: 0` / `min-width: 0` on grid items** — the single most common bug fix for nested scroll. Without it the content track refuses to shrink and the whole page scrolls instead.
- **`position: sticky; top: 0`** — alternative to a dedicated scroll container when the sidebar is shorter than the viewport but the *page* scrolls; note sticky fails if an ancestor has `overflow` set, which is exactly why the grid-item-as-scroll-container approach is more robust for app shells.
- **`:has()`** — state-driven layout with no JS class toggling: the grid re-templates when a checkbox or `[aria-expanded]` button inside it changes. `:root:has(#nav-toggle:checked)` lets CSS alone collapse the rail. Baseline since December 2023 (Chrome/Edge 105+, Safari 15.4+, Firefox 121+).
- **Container queries** — size the *content* pane's internal layout to the space it actually got (which depends on whether the rail is open), not the viewport. Baseline 2023.
- **`overscroll-behavior: contain`** — stops scroll-chaining so flicking the bottom of the sidebar doesn't scroll the page behind it (important for the drawer).
- **`<dialog>` + `inert`** — the off-canvas drawer is really a modal: `showModal()` traps focus and makes the rest of the page inert automatically.

## Working code

### Native HTML/CSS — grid app shell, :has() collapse, responsive drawer (no framework)
Complete and runnable. Desktop: a full rail that collapses to an icon rail via a pure-CSS `:has()` toggle. Below 768px: the rail goes off-canvas and the same toggle slides it in as a drawer with a scrim. Header, sidebar, and content each scroll independently.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>App shell — sidebar + content</title>
<style>
  :root {
    /* committed single hue (teal) + one sharp accent (amber); real neutral ramp */
    --bg:        #0f1418;
    --surface:   #161d23;
    --surface-2: #1d262e;
    --line:      #2a353e;
    --ink:       #e7edf1;   /* primary text */
    --ink-dim:   #9fb0bc;   /* secondary text */
    --brand:     #1f9d8f;   /* teal */
    --accent:    #e0a83b;   /* amber */
    --rail:      264px;
    --rail-mini: 72px;
    --header-h:  56px;
    font-family: "Geist", ui-sans-serif, system-ui, -apple-system, sans-serif;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body {
    background: var(--bg); color: var(--ink);
    font-size: 15px; line-height: 1.5;
  }

  /* ---- Shell: full-viewport grid, header spans top, rail + content below ---- */
  .shell {
    display: grid;
    grid-template-columns: var(--rail) 1fr;
    grid-template-rows: var(--header-h) 1fr;
    grid-template-areas:
      "rail header"
      "rail content";
    height: 100dvh;            /* dynamic vh: survives mobile URL-bar resize */
    transition: grid-template-columns .22s cubic-bezier(.4,0,.2,1);
  }

  /* State-driven layout: when the toggle is checked, collapse the rail to mini.
     No JS class juggling — :has() re-templates the grid from the checkbox state. */
  .shell:has(#nav-toggle:checked) {
    grid-template-columns: var(--rail-mini) 1fr;
  }

  /* ---- Header ---- */
  .header {
    grid-area: header;
    display: flex; align-items: center; gap: 12px;
    padding: 0 20px;
    background: var(--surface);
    border-bottom: 1px solid var(--line);
  }
  .header h1 { font-size: 1rem; font-weight: 600; margin: 0; }

  /* The toggle is a real, focusable, labelled control (looks like a button) */
  #nav-toggle { position: absolute; opacity: 0; pointer-events: none; }
  .toggle-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 8px; cursor: pointer;
    color: var(--ink-dim); border: 1px solid var(--line); background: var(--surface-2);
  }
  .toggle-btn:hover { color: var(--ink); }
  #nav-toggle:focus-visible + .header .toggle-btn,
  .toggle-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  /* ---- Sidebar rail: its OWN scroll container ---- */
  .rail {
    grid-area: rail;
    background: var(--surface);
    border-right: 1px solid var(--line);
    overflow-y: auto;
    overscroll-behavior: contain;   /* don't chain scroll to the page */
    min-height: 0;                  /* allow the grid item to shrink & scroll */
    display: flex; flex-direction: column;
  }
  .brand {
    display: flex; align-items: center; gap: 10px;
    height: var(--header-h); padding: 0 18px; flex: none;
    border-bottom: 1px solid var(--line);
    font-weight: 700; letter-spacing: -.01em;
  }
  .brand .dot { width: 12px; height: 12px; border-radius: 3px; background: var(--brand); flex: none; }
  nav { padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; }
  nav a {
    display: flex; align-items: center; gap: 12px;
    padding: 9px 12px; border-radius: 8px;
    color: var(--ink-dim); text-decoration: none; white-space: nowrap;
  }
  nav a .ico { width: 20px; text-align: center; flex: none; }
  nav a:hover { background: var(--surface-2); color: var(--ink); }
  nav a[aria-current="page"] { background: var(--surface-2); color: var(--ink); box-shadow: inset 3px 0 0 var(--brand); }
  nav a:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

  /* Mini state: hide the labels, center the icons */
  .shell:has(#nav-toggle:checked) nav a .label,
  .shell:has(#nav-toggle:checked) .brand .name { display: none; }
  .shell:has(#nav-toggle:checked) nav a { justify-content: center; }

  /* ---- Content: the other independent scroll container ---- */
  .content {
    grid-area: content;
    overflow-y: auto;
    min-height: 0;                  /* same shrink fix as the rail */
    padding: 28px clamp(20px, 4vw, 48px);
  }
  .content h2 { font-size: clamp(1.5rem, 3vw, 2.1rem); margin: 0 0 4px; letter-spacing: -.02em; }
  .content p.lead { color: var(--ink-dim); margin: 0 0 24px; max-width: 60ch; }

  /* Inner cards use a container query so they reflow to the space they ACTUALLY
     got — which changes when the rail collapses, independent of viewport width. */
  .panel { container-type: inline-size; }
  .cards { display: grid; gap: 16px; grid-template-columns: 1fr; }
  @container (min-width: 560px) { .cards { grid-template-columns: repeat(2, 1fr); } }
  @container (min-width: 880px) { .cards { grid-template-columns: repeat(3, 1fr); } }
  .card {
    background: var(--surface); border: 1px solid var(--line);
    border-radius: 12px; padding: 18px;
  }
  .card h3 { margin: 0 0 6px; font-size: .95rem; }
  .card .num { font-size: 1.8rem; font-weight: 700; letter-spacing: -.02em; }
  .card .num.up { color: var(--brand); }
  .card .num.flag { color: var(--accent); }
  .filler { height: 1400px; } /* proves the content scrolls on its own */

  /* The scrim only exists in drawer mode; hidden on desktop */
  .scrim { display: none; }

  /* ---------- Responsive: below 768px the rail goes off-canvas ---------- */
  @media (max-width: 767px) {
    .shell {
      grid-template-columns: 1fr;   /* content is full width */
      grid-template-rows: var(--header-h) 1fr;
      grid-template-areas:
        "header"
        "content";
    }
    /* On mobile the checked state does NOT change the grid — the rail floats over */
    .shell:has(#nav-toggle:checked) { grid-template-columns: 1fr; }

    .rail {
      position: fixed; inset: 0 auto 0 0; z-index: 30;
      width: min(82vw, var(--rail));
      transform: translateX(-100%);
      transition: transform .25s cubic-bezier(.4,0,.2,1);
      box-shadow: 0 0 0 100vmax transparent;
    }
    /* slide in when toggled; labels are visible in the drawer */
    .shell:has(#nav-toggle:checked) .rail { transform: translateX(0); }
    .shell:has(#nav-toggle:checked) nav a .label,
    .shell:has(#nav-toggle:checked) .brand .name { display: inline; }
    .shell:has(#nav-toggle:checked) nav a { justify-content: flex-start; }

    .scrim {
      display: block; position: fixed; inset: 0; z-index: 20;
      background: rgba(8, 12, 15, .55);
      opacity: 0; pointer-events: none; transition: opacity .25s ease;
    }
    .shell:has(#nav-toggle:checked) .scrim { opacity: 1; pointer-events: auto; }
  }

  /* Honour reduced motion: no sliding/templating transitions */
  @media (prefers-reduced-motion: reduce) {
    .shell, .rail, .scrim { transition: none; }
  }
</style>
</head>
<body>
  <div class="shell">
    <!-- The toggle checkbox lives at shell scope so :has() can read it everywhere.
         A <label> elsewhere flips it; we expose state to AT via aria on the label. -->
    <input type="checkbox" id="nav-toggle" aria-hidden="true" tabindex="-1">

    <aside class="rail" aria-label="Primary">
      <div class="brand"><span class="dot"></span><span class="name">Halyard</span></div>
      <nav>
        <a href="#" aria-current="page"><span class="ico">◦</span><span class="label">Overview</span></a>
        <a href="#"><span class="ico">▤</span><span class="label">Pipelines</span></a>
        <a href="#"><span class="ico">◷</span><span class="label">Schedules</span></a>
        <a href="#"><span class="ico">◈</span><span class="label">Datasets</span></a>
        <a href="#"><span class="ico">⚑</span><span class="label">Alerts</span></a>
        <a href="#"><span class="ico">⚙</span><span class="label">Settings</span></a>
      </nav>
    </aside>

    <header class="header">
      <!-- The visible control: a label tied to the checkbox. JS upgrades it to a
           proper button with aria-expanded; without JS it still toggles via the label. -->
      <label class="toggle-btn" id="navBtn" for="nav-toggle"
             role="button" tabindex="0" aria-controls="nav-toggle"
             aria-expanded="true" aria-label="Toggle navigation">≡</label>
      <h1>Overview</h1>
    </header>

    <main class="content" id="main">
      <section class="panel">
        <h2>Pipeline health</h2>
        <p class="lead">Only this pane scrolls. The rail and header stay fixed; the
          cards below reflow to the width this pane actually has, not the viewport.</p>
        <div class="cards">
          <div class="card"><h3>Runs today</h3><div class="num up">1,284</div></div>
          <div class="card"><h3>Failed</h3><div class="num flag">7</div></div>
          <div class="card"><h3>Avg duration</h3><div class="num">4m 02s</div></div>
          <div class="card"><h3>Queued</h3><div class="num">31</div></div>
          <div class="card"><h3>Throughput</h3><div class="num up">98.4%</div></div>
          <div class="card"><h3>Cost / run</h3><div class="num">$0.11</div></div>
        </div>
        <div class="filler"></div>
      </section>
    </main>

    <!-- Tapping the scrim closes the drawer (label sharing the same checkbox) -->
    <label class="scrim" for="nav-toggle" aria-hidden="true"></label>
  </div>

  <script>
    // Progressive enhancement: keep aria-expanded honest, support Enter/Space on
    // the label-button, and close the drawer on Escape. Layout itself needs no JS.
    const cb  = document.getElementById('nav-toggle');
    const btn = document.getElementById('navBtn');
    // expanded === rail is OPEN. Checked means "collapsed/closed", so invert:
    const update = () => btn.setAttribute('aria-expanded', String(!cb.checked));
    cb.addEventListener('change', update); update();
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cb.checked = !cb.checked; update(); }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && matchMedia('(max-width:767px)').matches && cb.checked) {
        cb.checked = false; update(); btn.focus();
      }
    });
  </script>
</body>
</html>
```

Note on the toggle semantics above: the checkbox is `checked` when the rail is *collapsed* (desktop) or *open as a drawer* (mobile) — the same boolean drives both because each breakpoint maps it to the appropriate visual via `:has()`. In production you would normally split these into two clearly-named states; it is fused here to keep the example to a single self-contained document.

### React + Tailwind — same shell with a real drawer using `<dialog>`
The realistic production choice: keep desktop layout in Grid, but make the mobile drawer a native modal `<dialog>` so focus-trapping and `inert` backdrop come for free.

```jsx
import { useEffect, useRef, useState } from "react";

const NAV = [
  { label: "Overview",  href: "#", current: true },
  { label: "Pipelines", href: "#" },
  { label: "Schedules", href: "#" },
  { label: "Datasets",  href: "#" },
  { label: "Settings",  href: "#" },
];

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false); // desktop mini-rail
  const dlg = useRef(null);                           // mobile drawer

  // Native <dialog>.showModal() traps focus and makes the page inert automatically.
  const openDrawer  = () => dlg.current?.showModal();
  const closeDrawer = () => dlg.current?.close();

  return (
    <div
      className="grid h-[100dvh] transition-[grid-template-columns] duration-200 ease-out
                 [grid-template-areas:'rail_header''rail_content']"
      style={{ gridTemplateColumns: `${collapsed ? "72px" : "264px"} 1fr`,
               gridTemplateRows: "56px 1fr" }}
    >
      {/* Rail — its own scroll container via min-h-0 + overflow-y-auto */}
      <aside className="[grid-area:rail] hidden md:flex flex-col min-h-0 overflow-y-auto
                        overscroll-contain bg-neutral-900 border-r border-neutral-800"
             aria-label="Primary">
        <Nav collapsed={collapsed} />
      </aside>

      <header className="[grid-area:header] flex items-center gap-3 px-5
                         bg-neutral-900 border-b border-neutral-800">
        {/* desktop: collapse rail; mobile: open drawer */}
        <button
          onClick={() => (window.matchMedia("(max-width:767px)").matches ? openDrawer() : setCollapsed(c => !c))}
          aria-expanded={!collapsed}
          aria-label="Toggle navigation"
          className="grid place-items-center w-9 h-9 rounded-lg border border-neutral-800
                     text-neutral-400 hover:text-neutral-100
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
        >≡</button>
        <h1 className="text-base font-semibold text-neutral-100">Overview</h1>
      </header>

      <main className="[grid-area:content] min-h-0 overflow-y-auto p-7 text-neutral-100">
        <h2 className="text-2xl font-semibold tracking-tight">Pipeline health</h2>
        <p className="text-neutral-400 max-w-[60ch] mt-1">Only this pane scrolls.</p>
        {/* …content… */}
      </main>

      {/* Mobile drawer: native modal dialog = free focus trap + inert backdrop */}
      <dialog ref={dlg}
        className="md:hidden m-0 mr-auto h-[100dvh] w-[82vw] max-w-[300px] p-0
                   bg-neutral-900 text-neutral-100 backdrop:bg-black/55
                   open:translate-x-0 -translate-x-full open:transition-transform"
        onClick={(e) => { if (e.target === dlg.current) closeDrawer(); }}  // click backdrop closes
      >
        <Nav collapsed={false} onNavigate={closeDrawer} />
      </dialog>
    </div>
  );
}

function Nav({ collapsed, onNavigate }) {
  return (
    <nav className="p-2.5 flex flex-col gap-0.5">
      {NAV.map((n) => (
        <a key={n.label} href={n.href} onClick={onNavigate}
           aria-current={n.current ? "page" : undefined}
           className={`flex items-center gap-3 rounded-lg px-3 py-2 whitespace-nowrap
             ${n.current ? "bg-neutral-800 text-neutral-100 shadow-[inset_3px_0_0_#1f9d8f]"
                         : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"}`}>
          <span className="w-5 text-center shrink-0">◦</span>
          {!collapsed && <span>{n.label}</span>}
        </a>
      ))}
    </nav>
  );
}
```
Respect reduced motion in Tailwind by gating transitions behind `motion-safe:` (e.g. `motion-safe:open:transition-transform`) so the drawer just appears for users who opted out.

## Variations
- **Persistent rail vs collapsible-to-mini vs off-canvas drawer** — the knob is *how the rail behaves when space runs out*: stay full, shrink to icons, or hide behind a button. Most shells use all three across breakpoints.
- **Sticky-sidebar vs scroll-container** — knob is *who owns the scroll*. Sticky (`position: sticky; top:0; height:100dvh`) lets the whole page scroll and pins the rail; the dedicated-scroll-container model (grid item with `overflow:auto; min-height:0`) keeps `body` from scrolling at all. The latter is more robust for true app shells; sticky is simpler for content sites with a sidebar.
- **Left vs right rail** — left for primary nav (Western F-pattern scan starts top-left); right for contextual/secondary panels (filters, inspector, details).
- **Dual sidebar (three-pane)** — nav rail + content + contextual inspector (mail clients, IDEs, Discord). Knob: the middle track is `1fr`, outer tracks fixed; collapse the inspector first on shrink.
- **Resizable rail** — drag handle writing to a `--rail` custom property (persisted to `localStorage`); modern option is the CSS-only field-sizing/`resize` on the aside.
- **Floating/auto-hiding rail** — rail overlays content and reveals on hover/focus (reclaims max width for canvases and editors).

## Accessibility
- **Reading & tab order vs visual order:** put the rail's `<aside>`/`<nav>` *before* `<main>` in the DOM so keyboard and screen-reader order matches the visual left-to-right flow. Grid `grid-template-areas` lets you rearrange visually without reordering the DOM — never use `order`/grid placement to move the nav after content in source, as that desyncs tab order from sight.
- **The toggle must be a real control:** a `<button>` (or a labelled checkbox upgraded to button semantics) with `aria-expanded` reflecting whether the rail is open, `aria-controls` pointing at the rail, and an `aria-label` like "Toggle navigation". The pure-CSS `:has()` version still needs the visible control to be focusable and operable by Enter/Space — the example wires that up.
- **Off-canvas drawer is a modal:** trap focus inside it, return focus to the trigger on close, close on `Escape`, and make the rest of the page inert. The native `<dialog>.showModal()` does all of this for you (focus trap + `inert` backdrop); the checkbox-only version must add Escape handling and ideally `inert` on `<main>` while open.
- **Skip link:** provide a "Skip to content" link as the first focusable element so keyboard users can bypass the entire nav rail on every page.
- **Reflow / zoom (WCAG 1.4.10):** at 320px-equivalent width / 400% zoom the rail must collapse to the drawer so content reflows to a single column with no horizontal scroll. The `100dvh` unit (dynamic viewport) prevents the shell being clipped by mobile browser chrome.
- **Mini-rail labels:** icon-only collapsed items still need an accessible name — keep the text in the DOM with a visually-hidden class or use `aria-label`/tooltip; do not rely on the icon glyph alone.
- **`overscroll-behavior: contain`** on the rail and drawer stops scroll-chaining so screen-magnifier and touch users don't accidentally scroll the page behind an open panel.

### Contrast (measured for this file's exact tokens)
All pairs below are computed from the hex values used as text-on-surface in the working code:
- Primary text `--ink #e7edf1` on shell bg `--bg #0f1418` ≈ **15.69:1** — passes AA and AAA.
- Primary text `--ink #e7edf1` on `--surface #161d23` (rail, header, cards) ≈ **14.41:1** — passes AA and AAA.
- Secondary text `--ink-dim #9fb0bc` on `--surface #161d23` ≈ **7.63:1** — passes AA and AAA for normal text.
- Teal stat `--brand #1f9d8f` on `--surface #161d23` ≈ **5.09:1** — passes AA for the large/bold numbers it styles (and for normal text).
- Amber accent `--accent #e0a83b` on `--surface #161d23` ≈ **7.97:1** — passes AA and AAA; also the focus-ring colour, well above the 3:1 non-text minimum.

## Performance
- **Avoid layout thrash on collapse:** animate `grid-template-columns` (or transform the drawer) — modern engines interpolate track sizes, but transforming an off-canvas panel is cheaper than re-templating the whole grid on low-end devices. The example transitions `grid-template-columns` for the mini-rail (small, infrequent) and `transform` for the drawer (frequent, must be smooth).
- **Containment:** add `contain: layout` (or `content`) to the content pane and to long list items so a change inside one card doesn't reflow the whole shell. `content-visibility: auto` with a `contain-intrinsic-size` on far-down content sections lets the browser skip rendering off-screen rows — big win for long dashboards.
- **Independent scroll = isolated paint:** because each pane is its own scroll container, scrolling content doesn't repaint the rail/header.
- **Sticky cost:** a long sticky sidebar that recalculates on every scroll frame can cost more than a dedicated scroll container; for tall rails prefer the `overflow:auto` container model.
- **`100dvh` repaint:** dynamic viewport units re-resolve when mobile chrome shows/hides; that is intended, but don't pair `100dvh` with heavy per-frame JS layout work.
- **Don't over-`will-change`:** only hint the drawer's `transform` while it's animating, not permanently.

## Anti-slop
- **Cliché (see `_slop-blocklist.md` → LAYOUT):** the generic SaaS admin shell — a flat indigo-to-pink gradient logo at the top of a #3B82F6-everywhere rail, six identical icon-title nav rows, and a content area that is just "hero + three identical icon-title-blurb cards." It reads as a component-library default, not a designed product.
- **The fix:** commit to one real brand hue with a true neutral ramp (this file uses a teal `--brand` + a single amber `--accent` over genuine neutrals, not blue-on-blue). Vary the content rhythm — the dashboard cards reflow 1/2/3-up via a *container query* tied to the rail state, not a fixed three-column band. Give nav items real hierarchy (active item gets an inset brand bar, not just a tint). And earn the sidebar: if the product is really pages to read, drop it for a top nav + single column rather than reaching for the app-shell default reflexively.
- **Related slop to avoid:** the "centered 800px column, equal padding everywhere" content pane — break it with full-bleed tables/charts and an offset inner grid so the workspace doesn't feel like a blog post inside an app frame.

## Pairs well with
- `single-column` — the right model for the *content pane's* reading-oriented screens (settings, detail views) inside the shell.
- `holy-grail` — when the shell also needs header + footer + dual sidebars; same Grid mechanics, more tracks.
- `card-based` / `bento-grid` — for the dashboard content; let a container query (keyed to the rail's open/collapsed state) drive the card columns rather than viewport width.
- `sticky-pinning` — for a pinned sub-header or toolbar inside the scrolling content pane.
- `command-palette` (behaviour) — pairs with a collapsible rail so power users navigate by keyboard while the rail stays minimal.

## Current references
- [MDN — `:has()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) — relational pseudo-class for state-driven layout; page states Baseline "Newly available" since December 2023.
- [MDN — CSS grid `grid-template-areas`](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas) — the readable way to name the rail/header/content regions used here.
- [MDN — `overscroll-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior) — stop scroll-chaining between the drawer/rail and the page.
- [MDN — `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) — `showModal()` gives the off-canvas drawer a free focus trap and inert backdrop.
- [web.dev — CSS container queries](https://web.dev/articles/cq-stable) — size the content pane's internal grid to its actual width, not the viewport.
- [ARIA APG — Disclosure (Show/Hide) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) — correct `aria-expanded`/`aria-controls` semantics for the nav toggle.
- [ARIA APG — Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — focus management for the mobile off-canvas drawer.
- [Akash Hamirwasia — How to and not to build sidebar layouts](https://akashhamirwasia.com/blog/how-to-and-not-to-build-sidebar-layouts/) — argues for Grid + sticky and dissects the absolute/fixed/flex pitfalls.
- [CSS-Tricks — How to use CSS Grid for sticky headers and footers](https://css-tricks.com/how-to-use-css-grid-for-sticky-headers-and-footers/) — the grid-item-as-scroll-container model with `min-height:0`.
- [shadcn/ui — Sidebar](https://ui.shadcn.com/docs/components/sidebar) — production React sidebar with collapsible + mobile-drawer states and CSS-variable widths.
