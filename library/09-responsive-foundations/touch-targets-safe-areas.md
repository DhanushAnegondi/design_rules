# Touch targets & safe areas

> Interactive elements must be large enough to tap without error and positioned so hardware features — notches, Dynamic Islands, home indicators — never obscure them.

**Bucket:** layout
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, apps, dashboards

## What it is

Touch targets are the tappable regions of interactive controls. Physical screen resolution means a fingertip covers roughly 9–10 mm; translating that to CSS pixels yields the industry minimum of 44 px (Apple HIG) or 48 dp (Material Design 3). Safe areas are the insets reported by the device's OS that represent occupied screen real estate — notch, Dynamic Island, rounded corners, home indicator — that content must not enter without a deliberate, padded strategy. Combining both means a fixed bottom nav button is both large enough to tap and clear of the swipe-up strip on iPhone 15 in landscape.

## When to use

- Any fixed or sticky element near a screen edge (bottom navs, floating action buttons, chat bubbles, cookie banners).
- Icononly buttons, icon links, or any visual target smaller than its surrounding tap zone.
- PWAs installed to home screen on iOS or Android, where browser chrome disappears and safe-area values shift.
- Touch-primary interfaces: ticketing apps, e-commerce checkouts, mobile dashboards.
- Whenever `pointer: coarse` devices represent a significant share of your audience (virtually all phone and tablet traffic).

## When NOT to use

- Inline hyperlinks within body prose are explicitly exempt from WCAG 2.5.8 — forcing 44 px minimum on mid-sentence links would shatter line rhythm; rely on spacing exceptions instead.
- Dense data tables or financial dashboards where rows are sized by data density, not tap ergonomics — document the tradeoff, use the spacing exception.
- Don't apply `touch-action: none` globally to solve a UI problem; it blocks browser zoom, a critical accessibility feature for low-vision users.
- Don't reach for `viewport-fit=cover` as a cosmetic choice for a "full-bleed" look and then ignore `env()` — you will clip content behind hardware on notched devices, which is the exact failure mode the API exists to prevent.

## How it works

### Touch target sizing

The human fingertip's contact patch on glass is approximately 44–57 px at 1× (96 dpi) screen density, so controls smaller than 44 × 44 CSS px generate tap errors under Fitts's Law. WCAG 2.2 introduced two criteria:

- **2.5.8 Target Size (Minimum) — Level AA**: 24 × 24 CSS px, or offset-spaced so a 24 px diameter circle centred on each target does not intersect adjacent targets. This is the legal minimum under the European Accessibility Act (EAA) which entered force in June 2025.
- **2.5.5 Target Size (Enhanced) — Level AAA**: 44 × 44 CSS px, no spacing exception required.

Apple HIG requires 44 pt (≈ 44 CSS px at 1×); Material Design 3 requires 48 dp with 8 dp of spacing between targets. Aiming for 44 px as a floor satisfies Apple, WCAG AAA, and comes close to Material — choose 48 px when Android-primary.

Because inflating every button visually would break many designs, the canonical trick is an invisible hit-area expansion using `::after` with negative `inset`, applied only when the primary input is coarse:

```css
/* Only enlarges the tap zone on touch devices; leaves visual size unchanged */
@media (pointer: coarse) {
  .btn::after {
    content: "";
    position: absolute;
    inset: -8px;         /* expands hit area 8 px in all directions */
  }
  .btn {
    position: relative;  /* establishes stacking context for ::after */
  }
}
```

### Safe area insets

`viewport-fit=cover` in the `<meta viewport>` tag tells the browser to render content edge-to-edge — including behind the notch and home indicator — rather than letterboxing. Without `viewport-fit=cover`, browsers leave automatic blank bands; with it, you own all pixels and must protect content yourself.

The OS exposes four read-only environment variables:

| Variable | Typical non-zero scenario |
|---|---|
| `safe-area-inset-top` | Notch / Dynamic Island region |
| `safe-area-inset-bottom` | Home indicator strip (~34 px on modern iPhones) |
| `safe-area-inset-left` | Landscape notch side |
| `safe-area-inset-right` | Landscape notch side (opposite) |

On rectangular-viewport devices (most Android, desktop) all four resolve to `0px`, so the patterns are always safe to apply.

The canonical `env()` patterns:

```css
/* Add breathing room ON TOP of the inset */
padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));

/* Use max() to keep baseline padding on rectanglar screens */
padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));
```

`max()` is the cleaner idiom when you want "at least X, or the inset if larger."

### Pointer and hover media queries

Don't assume touch from screen size. The `pointer` and `hover` media features interrogate the primary input mechanism:

| `hover` | `pointer` | Primary device |
|---|---|---|
| `none` | `coarse` | Smartphone, tablet touchscreen |
| `none` | `fine` | Stylus-only screen |
| `hover` | `coarse` | Smart TV remote, game console |
| `hover` | `fine` | Desktop mouse / laptop trackpad |

Use `any-pointer` and `any-hover` for multi-input devices (tablet + Bluetooth mouse): `any-pointer: coarse` is true even if a fine mouse is also attached, so it gives the safest floor for sizing.

`touch-action: manipulation` on interactive elements removes the 300 ms double-tap delay in mobile browsers without disabling pinch-zoom — always apply it to buttons and links.

## Working code

### Complete demo — bottom nav with safe area + expanded touch targets

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Touch targets & safe areas demo</title>
  <style>
    /* ─── Reset & base ───────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --ink: #1a1a1a;
      --surface: #f5f4f0;
      --nav-bg: #ffffff;
      --accent: #2563eb;          /* blue-600 — used only for active indicator */
      --nav-h: 64px;
      --safe-bottom: env(safe-area-inset-bottom, 0px);
      --safe-left:   env(safe-area-inset-left,   0px);
      --safe-right:  env(safe-area-inset-right,  0px);
    }

    html, body { height: 100%; }

    body {
      font-family: system-ui, sans-serif;
      background: var(--surface);
      color: var(--ink);
      /* Push content above the nav */
      padding-bottom: calc(var(--nav-h) + var(--safe-bottom) + 1rem);
    }

    /* ─── Scrollable content ─────────────────────────────────────── */
    .content {
      max-width: 42rem;
      margin-inline: auto;
      padding: 2rem 1.25rem 1rem;
    }

    h1 { font-size: clamp(1.5rem, 4vw, 2.25rem); font-weight: 700; margin-bottom: 0.5rem; }
    p  { line-height: 1.65; color: #444; margin-bottom: 1rem; }

    /* ─── Fixed bottom navigation ────────────────────────────────── */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;

      /* Safe-area padding: at least 1rem of usable height, plus home indicator */
      padding-bottom: max(0.5rem, var(--safe-bottom));
      padding-left:  var(--safe-left);
      padding-right: var(--safe-right);

      background: var(--nav-bg);
      border-top: 1px solid rgba(0,0,0,.08);
      /* Chromium/Firefox/Safari: widely available */
      backdrop-filter: blur(12px) saturate(180%);
      -webkit-backdrop-filter: blur(12px) saturate(180%);
    }

    .bottom-nav ul {
      display: flex;
      justify-content: space-around;
      list-style: none;
      height: var(--nav-h);
    }

    .bottom-nav li {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ─── Nav buttons ────────────────────────────────────────────── */
    .nav-btn {
      /* Visual size: icon + label fits ~40 px tall comfortably */
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
      font-size: 0.65rem;
      font-weight: 500;
      letter-spacing: .02em;
      text-transform: uppercase;
      padding: 6px 12px;
      border-radius: 8px;

      /* Remove 300 ms tap delay; keeps pinch-zoom available */
      touch-action: manipulation;

      /* Establish stacking context for ::after hit-area expansion */
      position: relative;
    }

    .nav-btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    .nav-btn[aria-current="page"] {
      color: var(--accent);
    }

    .nav-btn svg {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    /*
     * Expand hit area to >=44 px on touch devices without
     * changing visual layout. The ::after pseudo-element
     * is positioned absolutely and extends 10 px in each
     * direction from the button's painted edge.
     *
     * We scope to (pointer: coarse) so desktop layouts
     * are unaffected and neighbouring targets don't overlap.
     */
    @media (pointer: coarse) {
      .nav-btn::after {
        content: "";
        position: absolute;
        inset: -10px;
        border-radius: 12px;
      }
    }

    /* ─── Transitions: only when motion is acceptable ───────────── */
    @media (prefers-reduced-motion: no-preference) {
      .nav-btn { transition: color 0.15s ease, background 0.15s ease; }
    }

    /* ─── Hover: only meaningful with a pointing device ──────────── */
    @media (hover: hover) and (pointer: fine) {
      .nav-btn:hover {
        color: var(--accent);
        background: rgba(37, 99, 235, 0.06);
      }
    }

    /* ─── Standalone icon-only button example ────────────────────── */
    .fab {
      position: fixed;
      right: calc(1.25rem + var(--safe-right));
      /*
       * Sits above the bottom nav.
       * nav-h (64px) + home-indicator + breathing room.
       */
      bottom: calc(var(--nav-h) + var(--safe-bottom) + 1rem);
      width: 56px;
      height: 56px;          /* 56px: comfortably > 44px floor */
      border-radius: 50%;
      background: var(--accent);
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,.18);
      touch-action: manipulation;
    }

    /* GPU-composite only properties (transform/opacity) — avoids layout/paint */
    @media (prefers-reduced-motion: no-preference) {
      .fab {
        transition: transform 0.15s cubic-bezier(0.16,1,0.3,1),
                    opacity  0.15s ease;
      }
    }

    @media (hover: hover) and (pointer: fine) {
      .fab:hover { transform: scale(1.06); opacity: 0.9; }
    }

    .fab:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }

    /* ─── Inline spacing demo ────────────────────────────────────── */
    .target-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;               /* 8 px gap satisfies WCAG 2.5.8 spacing exception */
      margin: 1.5rem 0;
    }

    .chip {
      /* Visual: 32 px tall; meets spacing exception at 8 px gap */
      min-height: 32px;
      padding: 4px 14px;
      border-radius: 999px;
      border: 1.5px solid #ccc;
      background: transparent;
      cursor: pointer;
      font-size: 0.85rem;
      touch-action: manipulation;
      position: relative;
    }

    @media (prefers-reduced-motion: no-preference) {
      .chip { transition: border-color 0.12s ease; }
    }

    /* Expand tap zone for chips on touch — brings effective hit to ~44 px */
    @media (pointer: coarse) {
      .chip::after {
        content: "";
        position: absolute;
        inset: -6px;
      }
    }

    @media (hover: hover) and (pointer: fine) {
      .chip:hover { border-color: var(--accent); color: var(--accent); }
    }

    .chip:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  </style>
</head>
<body>

  <main class="content">
    <h1>Touch targets & safe areas</h1>
    <p>
      Resize this window to a narrow viewport or open in a browser's mobile
      emulator to see safe-area padding take effect. The floating button and
      bottom nav will clear the home-indicator strip on any notched device.
    </p>

    <h2 style="margin-bottom:.5rem;font-size:1rem;font-weight:600;">Filter by category</h2>
    <div class="target-row" role="group" aria-label="Category filters">
      <button class="chip">All products</button>
      <button class="chip">Footwear</button>
      <button class="chip">Outerwear</button>
      <button class="chip">Accessories</button>
      <button class="chip">New arrivals</button>
    </div>

    <p>
      Each chip is 32 px tall visually. At 8 px gap between chips the WCAG 2.5.8
      spacing exception applies. On coarse-pointer devices, a hidden
      <code>::after</code> expands each hit area by 6 px in all directions.
    </p>
  </main>

  <!-- Floating action button -->
  <button class="fab" aria-label="Add item">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round"
         aria-hidden="true" focusable="false">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  </button>

  <!-- Bottom navigation -->
  <nav class="bottom-nav" aria-label="Main navigation">
    <ul role="list">
      <li>
        <button class="nav-btn" aria-current="page">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          Home
        </button>
      </li>
      <li>
        <button class="nav-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Search
        </button>
      </li>
      <li>
        <button class="nav-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          Saved
        </button>
      </li>
      <li>
        <button class="nav-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Account
        </button>
      </li>
    </ul>
  </nav>

</body>
</html>
```

### React pattern — safe-area-aware nav item hook

```jsx
// useSafeArea.js — reads CSS env() values via getComputedStyle
import { useState, useEffect } from "react";

export function useSafeArea() {
  const [insets, setInsets] = useState({ top: 0, right: 0, bottom: 0, left: 0 });

  useEffect(() => {
    // We read the computed value that CSS env() resolves to.
    // This works only after the document is painted.
    const el = document.documentElement;
    const style = getComputedStyle(el);
    const get = (v) =>
      parseFloat(style.getPropertyValue(`--sai-${v}`).trim()) || 0;

    // Inject CSS vars from env() so JS can read them
    el.style.setProperty("--sai-top",    "env(safe-area-inset-top,    0px)");
    el.style.setProperty("--sai-right",  "env(safe-area-inset-right,  0px)");
    el.style.setProperty("--sai-bottom", "env(safe-area-inset-bottom, 0px)");
    el.style.setProperty("--sai-left",   "env(safe-area-inset-left,   0px)");

    setInsets({
      top:    get("top"),
      right:  get("right"),
      bottom: get("bottom"),
      left:   get("left"),
    });
  }, []);

  return insets;
}

// BottomNav.jsx
import { useSafeArea } from "./useSafeArea";

const NAV_ITEMS = [
  { label: "Home",    icon: "🏠", href: "/" },
  { label: "Search",  icon: "🔍", href: "/search" },
  { label: "Account", icon: "👤", href: "/account" },
];

export function BottomNav({ currentPath }) {
  const { bottom } = useSafeArea();

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        /* Baseline 8 px + device inset */
        paddingBottom: `max(8px, ${bottom}px)`,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        display: "flex",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = currentPath === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 56,        /* 56 px: comfortable above 44 px floor */
              gap: 3,
              color: active ? "#2563eb" : "#666",
              textDecoration: "none",
              fontSize: "0.65rem",
              fontWeight: 500,
              touchAction: "manipulation",
              /* focus-visible handled by a global :focus-visible rule */
            }}
          >
            <span aria-hidden="true" style={{ fontSize: "1.25rem" }}>
              {item.icon}
            </span>
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
```

## Variations

**Minimum visual + hidden hit area expansion** — Button looks small (32–36 px tall) but `::after` with `inset: -8px` and `pointer: coarse` guard makes it tap-safe. Best for dense filter chips, icon buttons in toolbars.

**Padded container sizing** — Enlarge the element itself via padding so it reaches 44 px without visual tricks. The simplest approach; works anywhere `min-height: 44px` fits the design.

**Spacing exception path** — Targets smaller than 24 px but surrounded by 24 px of clear space (no adjacent target within 24 px radius). WCAG 2.5.8 Level AA compliant; use as a last resort for dense UIs, never as a default.

**`max()` baseline pattern** — `padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px))` ensures usable padding on both rectangular screens (gets `1rem`) and notched devices (gets the inset when it exceeds `1rem`). Cleaner than `calc()` for this case.

**Landscape safe-area padding** — In landscape on a notched iPhone, `safe-area-inset-left` or `safe-area-inset-right` can be ≈44–59 px. Always apply both `padding-left` and `padding-right` via `env()` on fixed/full-width elements to handle orientation changes.

**PWA standalone mode** — Add `viewport-fit=cover` in both the HTML `<meta>` tag and the Web App Manifest's `display` configuration. In standalone mode, browser chrome disappears and safe-area insets shift; test on a real device or Xcode Simulator, not just DevTools.

## Accessibility

**Keyboard and focus management:** Every interactive control in the demo uses `<button>` or `<a>` — natively keyboard-focusable and announced correctly by screen readers. Focus rings use `focus-visible` to avoid polluting mouse flows:

```css
.nav-btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

**Contrast:** The active nav label (#2563eb on #ffffff) is approximately 5.2:1 — passes WCAG AA (4.5:1 required for normal text at this weight). Inactive labels (#666 on #fff) are approximately 5.7:1, also AA-passing. These ratios are computed for colors actually used in the code above; do not import contrast claims from other files.

**Pointer and touch fallback:** All hover styles are guarded by `@media (hover: hover) and (pointer: fine)` — no hover state bleeds onto touch devices where `:hover` sticks after tap. The `::after` hit-area expansion is guarded by `@media (pointer: coarse)` so it only fires on touch input. No interactive information is hidden behind hover exclusively.

**`touch-action: manipulation`:** Applied to all buttons and links. Removes the 300 ms tap delay without blocking pinch-zoom. Never use `touch-action: none` on `<body>` — it prevents browser zoom, blocking WCAG 1.4.4 (Resize Text) for low-vision users.

**Screen reader notes:** The nav uses `<nav aria-label="Main navigation">` and `aria-current="page"` on the active item. Icons carry `aria-hidden="true"` so screen readers read only the text label. The floating action button has an explicit `aria-label="Add item"` since it has no visible text.

**`prefers-reduced-motion`:** The demo includes color, opacity, and transform transitions on `.nav-btn`, `.fab`, and `.chip`. All three are wrapped in `@media (prefers-reduced-motion: no-preference)` so they are fully suppressed for users who have requested reduced motion — no fallback animation is needed because the state change (colour shift, scale) is still conveyed visually without motion. Even short aesthetic transitions (color, border-color) must be guarded; only truly instantaneous state changes (e.g., `transition: none`) may be left outside the media query.

```css
@media (prefers-reduced-motion: no-preference) {
  .nav-btn { transition: color 0.15s ease, background 0.15s ease; }
  .fab     { transition: transform 0.15s cubic-bezier(0.16,1,0.3,1),
                         opacity  0.15s ease; }
  .chip    { transition: border-color 0.12s ease; }
}
```

## Performance

- `backdrop-filter` on the bottom nav triggers a composited layer. Use it only on fixed/sticky elements where the savings in repaint outweigh the GPU cost; do not apply to scrolling content.
- `::after` pseudo-elements for hit-area expansion have zero layout cost — they are composited on top but do not affect document flow.
- `touch-action: manipulation` removes the 300 ms click-event delay imposed by browsers to detect double-tap; this improves perceived interaction latency at no JS cost.
- `position: fixed` elements containing `env()` values are recomputed on orientation change. On iOS in standalone PWA mode, the safe-area inset can change mid-scroll due to browser-chrome retraction; avoid computing height-critical values with `env()` in JavaScript at runtime and rely on CSS instead (CSS recalculates automatically).
- Avoid animating `bottom`, `padding`, or `height` on the nav bar — these cause layout. If you animate entry/exit, use `transform: translateY()` only.
- `will-change: transform` on the FAB is acceptable (single persistent element, not in a list), but omit it from every chip in a long list.

## Anti-slop

The cliche (see `_slop-blocklist.md` — Surface): a floating chat button or cookie banner positioned at `bottom: 20px; right: 20px` with no safe-area offset, clipped by the iOS home indicator, and styled with `box-shadow` repeated verbatim on every card. In landscape on an iPhone 15 Pro Max the button sits directly under the home-indicator strip and is effectively untappable.

The tasteful fix: apply `bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px))` and `right: calc(1.25rem + env(safe-area-inset-right, 0px))`. Use `max()` when you have a usable baseline: `bottom: max(1.25rem, env(safe-area-inset-bottom, 0px))`. The button clears hardware on every device, and on rectangular screens it looks identical to the naive version.

The second cliche: setting `min-height: 44px` in your CSS and calling it done, while the actual interactive area is a 16 px icon `<span>` nested inside a `<div>` that has no `role` or keyboard handling. Correct approach: make the `<button>` itself 44 px minimum via padding or `min-height`, not a wrapper element; the hit area must be on the focusable element.

## Pairs well with

- **breakpoint-strategy** (same folder) — pointer/hover media queries complement viewport breakpoints for layout decisions; they are orthogonal axes, not substitutes.
- **fluid-type-space** — clamp()-based spacing scales often leave touch targets undersized at narrow widths; lock `min-height` before applying fluid sizing.
- **fixed-sticky-positioning** — the primary context where safe-area insets matter; any fixed element should incorporate `env(safe-area-inset-*)` in its offset properties.
- **responsive-images** — above-the-fold hero images that bleed under the notch benefit from the same `viewport-fit=cover` + `env()` offset approach applied to their overlaid text/CTAs.

## Current references

- [MDN — env() CSS function](https://developer.mozilla.org/en-US/docs/Web/CSS/env) — authoritative reference for all four safe-area-inset variables, syntax, and browser support table
- [WebKit blog — Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) — the original rationale for viewport-fit and safe-area-inset; still the clearest explanation of why cover + env() are paired
- [W3C WCAG 2.2 — Understanding 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — exact specification for 24 px minimum, spacing exception, and all five exemptions
- [W3C WCAG — Understanding 2.5.5 Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) — 44 × 44 px AAA standard and rationale
- [W3C Technique C42 — min-height and min-width for target spacing](https://www.w3.org/WAI/WCAG21/Techniques/css/C42) — concrete CSS code for the spacing exception via container sizing
- [web.dev — Interaction (Learn Design)](https://web.dev/learn/design/interaction) — pointer / hover media query patterns and touch-input virtual keyboard handling
- [Smashing Magazine — A Guide To Hover And Pointer Media Queries](https://www.smashingmagazine.com/2022/03/guide-hover-pointer-media-queries/) — device matrix, any-pointer vs pointer, common gotchas with multi-input devices
- [Polypane — Using safe-area-inset to build mobile-safe layouts](https://polypane.app/blog/using-safe-area-inset-to-build-mobile-safe-layouts/) — practical patterns for fixed navs, floating buttons, and landscape orientation with code
- [ishadeed.com — Enhancing The Clickable Area Size](https://ishadeed.com/article/clickable-area/) — visual breakdown of padding, pseudo-element, and display-type techniques for hit-area expansion
- [LogRocket — All accessible touch target sizes](https://blog.logrocket.com/ux-design/all-accessible-touch-target-sizes/) — comparison table across Apple HIG, Material 3, WCAG, Microsoft Fluent, and VisionOS
- [MDN — touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action) — values, browser support (Safari: auto + manipulation only), and performance notes on tap delay
- [AllAccessible — WCAG 2.5.8 Implementation Guide](https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide) — practical implementation guide including EAA June 2025 enforcement context
