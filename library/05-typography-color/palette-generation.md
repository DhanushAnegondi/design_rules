# Palette generation

> Commit to one brand hue plus a single sharp accent, then derive every UI color as an OKLCH lightness ramp off those two — so the palette reads as designed, not assembled from a color wheel.

**Bucket:** system
**Maturity:** evergreen (OKLCH tooling is current, 2024-2026)
**Effort:** medium
**Best for:** websites, portfolios, apps, dashboards (any product needing a real color system rather than ad-hoc hex)

## What it is
A palette is not "a bunch of nice colors." It is a small, opinionated set of *seeds* (usually one brand hue + one accent + one neutral) and a *rule* for generating consistent tints and shades from them. The modern rule is: pick the hue, then step **lightness** in a perceptually-uniform space (OKLCH) while holding hue and chroma roughly constant. The viewer perceives a coherent family — a single "blue" that gets evenly lighter and darker, with no muddy mid-tones or surprise color shifts — plus one accent that always means "act here." Everything else (surfaces, borders, text, states) is a position on those ramps, named by role.

## When to use
- Any product that will have more than a handful of components — you need surfaces, borders, text, hover/active/disabled, and at least one focus/brand moment, all consistent.
- Building design tokens / a theme that must support light *and* dark mode from the same source of truth.
- Dashboards and data viz where you need a few categorical colors that stay distinguishable for color-blind users.
- When you want to look *deliberate* instead of defaulted — a committed, slightly-off hue beats generic SaaS blue every time.

## When NOT to use
- A throwaway prototype or a one-screen marketing splash — just hardcode three good hex values and move on; a token system is overhead you won't recoup.
- When a brand already ships an exact, legally-specified hex (e.g. a logo color) — honor it as the seed, but still *derive* the ramp around it rather than eyeballing new shades.
- Don't reach for a giant categorical rainbow because you have "a lot of categories." Everyone overuses **rainbow categorical color** for dashboards and tags; 8 evenly-spaced spectral hues look like a 1998 pie chart and collapse for the ~8% of men with color-vision deficiency. Encode meaning with 2-3 hues + lightness/shape/label instead (see Anti-slop).
- Don't generate from HSL `lighten()/darken()` if you care about even steps — HSL lightness is perceptually lopsided (a "50% light" yellow and "50% light" blue look nothing alike). Use OKLCH.

## How it works
The core trick is choosing the right color space. In **OKLCH** (Lightness, Chroma, Hue — the OKLab-based cousin of LCH, tuned by Björn Ottosson so blues and purples don't skew on lightness changes), the **L** axis tracks human-perceived brightness. So if you hold **H** (hue) and **C** (chroma/saturation) fixed and step **L** in equal increments, you get tints and shades that *look* evenly spaced and keep the same identity — no hue drift, no graying-out. That is exactly what a tint/shade ramp needs.

Key properties and APIs:

- **`oklch(L C H)`** — `L` is `0%`–`100%` (or `0`–`1`), `C` is unbounded but practically `0`–`~0.37`, `H` is `0`–`360` degrees. Native CSS, supported in all current major browsers (Chrome/Edge/Safari/Firefox).
- **Relative color syntax** — `oklch(from var(--brand) calc(l - 0.1) c h)` derives a darker shade from a seed *at runtime*, inheriting `c` and `h`. Supported in current Chrome/Edge/Safari/Firefox; progressive-enhance with a static fallback.
- **`color-mix()`** — `color-mix(in oklch, var(--brand), white 30%)` mixes toward a target in OKLCH for a quick tint; great for opacity/state variants. Chrome 111+/Edge 111+/Safari 16.2+/Firefox 113+.
- **Chroma must taper at the extremes.** Pure max chroma at very light or very dark L falls outside the sRGB (or even P3) gamut and gets clipped, which *reintroduces* hue/lightness drift. So good ramps reduce `C` slightly at the `50` (lightest) and `900` (darkest) ends — a gentle chroma curve, not a flat line.
- **Harmony approaches** for picking the *accent* relative to the brand hue:
  - **Analogous** — accent within ~30° of brand (calm, on-brand, low tension).
  - **Complementary** — accent ~180° opposite (max contrast; use sparingly for CTAs).
  - **Split-complementary** — ~150°/210° (complementary punch, softer).
  - **Triadic** — 120° apart (vivid; risky, easy to look circus-y — reserve for 2 of the 3).
  The committed move is **one** brand hue + **one** accent, not a full wheel.

A complete neutral ramp is its own decision: pure-gray neutrals (`C` near 0) feel sterile; nudging neutrals a few degrees toward the brand hue with tiny chroma (`oklch(L 0.01 H_brand)`) gives a "warm/cool gray" that quietly ties the whole UI to the brand.

## Working code

### Native CSS — committed brand + accent, full OKLCH ramps, light & dark
A complete, paste-ready token block. Brand is a committed teal-leaning blue (`H 230`), accent is a warm coral picked split-complementary (`H 35`). Neutrals are hue-tinted toward the brand. Lightness steps are even; chroma tapers at the ends.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  :root {
    /* ---- seeds (the only two "creative" decisions) ---- */
    --brand-h: 230;      /* committed brand hue (deg) */
    --brand-c: 0.13;     /* mid-ramp chroma */
    --accent-h: 35;      /* split-complementary warm accent */
    --accent-c: 0.15;

    /* ---- brand ramp: even L steps, chroma tapered at the ends ---- */
    --brand-50:  oklch(0.97 0.02 var(--brand-h));
    --brand-100: oklch(0.93 0.05 var(--brand-h));
    --brand-200: oklch(0.87 0.08 var(--brand-h));
    --brand-300: oklch(0.78 0.11 var(--brand-h));
    --brand-400: oklch(0.68 0.13 var(--brand-h));
    --brand-500: oklch(0.58 var(--brand-c) var(--brand-h));  /* base */
    --brand-600: oklch(0.50 0.13 var(--brand-h));
    --brand-700: oklch(0.42 0.11 var(--brand-h));
    --brand-800: oklch(0.34 0.08 var(--brand-h));
    --brand-900: oklch(0.26 0.05 var(--brand-h));

    /* ---- accent ramp (used sparingly: CTAs, focus, "act here") ---- */
    --accent-300: oklch(0.80 0.11 var(--accent-h));
    --accent-500: oklch(0.68 var(--accent-c) var(--accent-h));
    --accent-700: oklch(0.55 0.14 var(--accent-h));

    /* ---- neutral ramp: tiny chroma toward brand hue (cool gray) ---- */
    --gray-50:  oklch(0.985 0.004 var(--brand-h));
    --gray-100: oklch(0.96  0.006 var(--brand-h));
    --gray-200: oklch(0.92  0.008 var(--brand-h));
    --gray-300: oklch(0.86  0.010 var(--brand-h));
    --gray-500: oklch(0.62  0.012 var(--brand-h));
    --gray-700: oklch(0.42  0.012 var(--brand-h));
    --gray-900: oklch(0.22  0.010 var(--brand-h));
    --gray-950: oklch(0.16  0.008 var(--brand-h));

    /* ---- semantic tokens: name by ROLE, not by value ---- */
    --bg:            var(--gray-50);
    --surface:       #ffffff;
    --surface-sunk:  var(--gray-100);
    --border:        var(--gray-200);
    --text:          var(--gray-900);
    --text-muted:    var(--gray-500);
    --brand:         var(--brand-500);
    --on-brand:      var(--gray-50);   /* text on a brand fill */
    --accent:        var(--accent-700);
    --focus-ring:    var(--accent-500);
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg:           var(--gray-950);
      --surface:      var(--gray-900);
      --surface-sunk: var(--gray-950);
      --border:       var(--gray-700);
      --text:         var(--gray-100);
      --text-muted:   var(--gray-300);
      /* lift brand a step in dark mode so it stays legible on dark surfaces */
      --brand:        var(--brand-400);
      --on-brand:     var(--gray-950);
      --accent:       var(--accent-300);
      --focus-ring:   var(--accent-300);
    }
  }

  body { margin:0; font-family: system-ui, sans-serif;
         background: var(--bg); color: var(--text); }
  .card { max-width: 32rem; margin: 12vh auto; padding: 2rem;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; }
  .muted { color: var(--text-muted); }
  .btn { display:inline-block; padding:.6rem 1.1rem; border:0; border-radius:8px;
         background: var(--brand); color: var(--on-brand);
         font: inherit; cursor:pointer; }
  .btn--cta { background: var(--accent); color: var(--gray-950); }
  .btn:focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 2px; }
</style>
</head>
<body>
  <div class="card">
    <h1>One brand hue, one accent.</h1>
    <p class="muted">Every surface, border, and text color is a position on an
       OKLCH lightness ramp — not a hand-picked hex.</p>
    <button class="btn">Secondary</button>
    <button class="btn btn--cta">Primary action</button>
  </div>
</body>
</html>
```

### Runtime derivation with relative color syntax (DRY hover/active states)
When you want states *derived* from a single seed instead of hand-listing each step. Ship a static fallback first, then override where supported.

```css
.btn {
  --seed: oklch(0.58 0.13 230);
  background: #2f6ad9;                       /* fallback for old engines */
  background: var(--seed);
}
@supports (color: oklch(from white l c h)) {
  .btn:hover  { background: oklch(from var(--seed) calc(l - 0.06) c h); }
  .btn:active { background: oklch(from var(--seed) calc(l - 0.12) c h); }
  /* disabled: drop chroma toward gray, keep lightness readable */
  .btn:disabled { background: oklch(from var(--seed) l calc(c * 0.25) h); }
}
```

### Build-time generation (the realistic production choice)
For a tokens pipeline, generate the JSON/CSS programmatically so the ramp is one source of truth. Vanilla JS with [Culori](https://culorijs.org/) (gamut mapping included):

```js
// npm i culori
import { oklch, formatHex, clampChroma } from "culori";

function ramp({ hue, baseChroma, steps }) {
  // even lightness steps; chroma tapers toward both ends via a simple parabola
  return steps.map((L, i, arr) => {
    const t = i / (arr.length - 1);            // 0..1 across the ramp
    const taper = 1 - Math.pow(2 * t - 1, 2) * 0.55; // 1 at center, ~0.45 at ends
    const c = baseChroma * taper;
    const color = clampChroma({ mode: "oklch", l: L, c, h: hue }, "oklch"); // keep in sRGB
    return formatHex(color);
  });
}

const brand = ramp({
  hue: 230,
  baseChroma: 0.13,
  steps: [0.97, 0.93, 0.87, 0.78, 0.68, 0.58, 0.50, 0.42, 0.34, 0.26],
});
// brand[5] is the "500" base; emit as --brand-50..900 CSS vars or a tokens.json
console.log(brand);
```

## Variations
- **Seed count**: 1 brand only (most committed) → brand + accent (default) → brand + accent + semantic status hues (success/warn/danger). The knob is *how many meanings* the palette must encode.
- **Harmony knob** (accent placement): analogous (~+30°) for calm, split-complementary (~+150°/+210°) for punch without clash, complementary (~+180°) for maximum CTA contrast. Same brand ramp, different accent hue.
- **Neutral temperature**: pure gray (`C≈0`) vs hue-tinted gray (`C≈0.01` toward brand) vs dual neutrals (warm + cool). Changes how "designed" the chrome feels.
- **Ramp resolution**: 5 steps (compact) vs 10 (Tailwind-style `50–900`) vs 12 (Radix-style, with dedicated subtle-bg/border/text stops). More steps = more control, more tokens to maintain.
- **Dark-mode strategy**: invert the ramp (read `900` as bg, `50` as text) vs a separately-tuned dark ramp (slightly higher chroma, lifted brand) — the latter looks better but doubles the token work.

## Accessibility
This is a system, not a motion effect, but color *is* the a11y surface here.

- **Contrast math (WCAG 2.2).** Ratio = `(L1 + 0.05) / (L2 + 0.05)` where `L1` is the lighter relative luminance and `L2` the darker. Required: **4.5:1** normal text, **3:1** large text (≥24px, or ≥18.66px bold) and UI/graphical boundaries. Worked example for `--text` `oklch(0.22 …)` (≈ relative luminance `L≈0.034`) on `--surface` white (`L=1.0`): `(1.0 + 0.05) / (0.034 + 0.05) = 1.05 / 0.084 ≈ 12.5:1` — passes AAA comfortably. Counter-example: a `brand-400` fill `oklch(0.68 …)` (`L≈0.38`) with white text (`L=1.0`) gives `(1.0+0.05)/(0.38+0.05) = 1.05/0.43 ≈ 2.4:1` — **fails** even large-text 3:1, so white text needs a `brand-600`+ fill, or dark text on the light fill. *Always re-check the specific L1/L2 pair; OKLCH `L` is perceptual lightness, not WCAG relative luminance, so a high OKLCH `L` is a good hint but not a guarantee.*
- **Don't encode meaning in hue alone.** Status colors (success green / danger red) must be paired with an icon, label, or shape — ~8% of men can't reliably separate red from green. The same goes for categorical chart colors.
- **Focus visibility.** The `--focus-ring` (accent) must hit **3:1** against *both* the component and the adjacent background (WCAG 2.2 SC 1.4.11 / 2.4.13). The example uses `outline-offset` so the ring sits on the page bg, not just the button.
- **Verify the whole ramp**, not just one swatch. Run text/border pairs through a checker; OKLCH's even L steps make this predictable but not automatic.
- **APCA note.** WCAG 3's APCA model predicts perceived contrast more accurately for thin/light type, and tools like [oklch.com](https://oklch.com/) surface it. It is not yet the conformance standard — ship to WCAG 2.2 ratios, use APCA as a tiebreaker.
- **No pointer/SR-specific concerns** beyond the above — there's nothing animated and nothing keyboard-trapping in a palette itself.

## Performance
- OKLCH values are resolved by the engine at parse time — **zero runtime cost** vs hex. Relative-color and `color-mix()` resolve at computed-value time; also cheap, and they collapse dozens of hand-authored shade declarations into a few.
- No repaints/layout thrash to worry about (color is paint-only, and you're setting it once).
- **Bundle cost:** native CSS custom properties = 0 KB of JS. The build-time generator (Culori ~ a few KB) runs at *build* time and ships nothing to the client. Avoid runtime palette-generation libraries in the browser bundle — there's no reason to compute a static palette on every page load.
- One real watch-out: defining hundreds of opacity tokens. Prefer `oklch(from var(--x) l c h / 50%)` or `color-mix(in oklch, var(--x), transparent 50%)` over a separate token per alpha level.

## Anti-slop
The cliché (see `_slop-blocklist.md` → COLOR): the **purple/indigo→pink gradient on white** — the single biggest "AI generated this" tell — and **generic SaaS blue `#3B82F6` everywhere** with no real neutral ramp, and **rainbow categorical color** where eight spectral hues "encode" categories. The tasteful alternative is this entire entry: **one committed brand hue** (something a few degrees off the default — a teal-blue, an oxblood, a moss) **plus one sharp accent**, both expanded into perceptually-even OKLCH ramps, with a *real* hue-tinted neutral ramp instead of pure gray. For categories, use **2-3 hues that carry meaning** plus lightness/shape/label — never the rainbow. Breaking this one default (color) is often the cheapest way to move a UI from "generated" to "designed."

## Pairs well with
- **`oklch-color`** — the perceptual space this whole technique stands on (lightness ≈ perception, no hue drift on shade steps).
- **`semantic-color-tokens`** — name colors by *role* (`--surface`, `--text-muted`, `--on-brand`) so the ramp is swappable and theming is one indirection layer.
- **`dark-mode-strategy`** — the same seeds drive both modes; lift the brand a step and re-tune chroma for dark surfaces.
- **`wcag-contrast`** — the math above; gate every text/border/focus pair on it.
- **`system-font-stack` / characterful display type** — a committed palette plus a non-default typeface is the two-bucket break that reads as intentional.

## Current references
- [oklch() CSS function — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) — syntax, gamut behavior, current browser support table.
- [Using relative colors — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors) — `oklch(from … l c h)` for deriving shades/states from one seed.
- [OKLCH in CSS: why we quit RGB and HSL — Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) — the canonical case for OKLCH palettes, predictable lightness, and runtime shade generation.
- [oklch.com — picker & converter](https://oklch.com/) — build/inspect ramps, see the sRGB/P3 gamut edge and APCA contrast live.
- [Culori](https://culorijs.org/) — JS color library with OKLCH + `clampChroma` gamut mapping for build-time token generation.
- [CSS relative color syntax — Chrome for Developers](https://developer.chrome.com/blog/css-relative-color-syntax) — practical `from` recipes for hover/active/disabled states.
- [color-mix() — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) — `in oklch` interpolation for tints and alpha variants.
- [Color palettes — Carbon Design System](https://carbondesignsystem.com/data-visualization/color-palettes/) — production guidance on categorical/sequential palettes and avoiding rainbow slop.
- [Prism — OKLCH palette generator (Figma)](https://www.figma.com/community/plugin/1560632211514322267/prism-oklch-colour-palette-generator) — generates perceptually-even ramps with gamut mapping, JSON export.
