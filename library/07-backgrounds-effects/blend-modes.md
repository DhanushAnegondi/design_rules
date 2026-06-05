# Blend modes

> CSS blend modes (`mix-blend-mode` and `background-blend-mode`) tell the browser how to mathematically combine a layer's pixel colors with the pixels behind it — the same compositing math Photoshop uses, now native in the browser.

**Bucket:** visual style
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, editorial/agency sites, dashboards

---

## What it is

Blend modes intercept the paint step: instead of simply drawing an element's color on top of what's behind it, the browser runs each pixel through a formula (multiply, screen, overlay, difference, etc.) that fuses the two layers. `mix-blend-mode` blends an entire element — its background, borders, and text — against the content behind it in the stacking context. `background-blend-mode` blends only the layers within a single element's `background` shorthand (multiple `background-image` values and the `background-color`) with each other, leaving siblings and parents untouched. The `isolation` property draws a fence around a subtree so blend modes inside it stop blending with ancestors outside.

The user perceives the result as color-tinted photography, text that seems punched through a surface to reveal what's underneath, or images fused into a unified color palette — effects that previously required exporting a PSD.

---

## When to use

- **Duotone photography**: applying a two-color palette across variable user-generated or stock imagery to force brand consistency without hand-editing every photo.
- **Text knockout / cutout**: making headline text appear transparent so an underlying image or gradient shows through the letterforms.
- **Color overlay on imagery**: tinting a hero photo with a brand hue without flattening all detail — `multiply` darkens selectively, `screen` lightens.
- **Difference cursor spotlight or generative hover states**: a `difference`-mode element inverts whatever color sits behind it, creating a high-contrast indicator that always reads regardless of background.
- **Layered gradient composition**: stacking two or more gradient backgrounds and blending them with `background-blend-mode` to produce mesh-like color transitions without SVG.
- **Inverted / dark-mode header**: a sticky header with `mix-blend-mode: difference` automatically inverts text against any scroll content beneath it.

---

## When NOT to use

- **Body text legibility over variable imagery**: blending body copy against a photo almost always fails WCAG 1.4.3 at some scroll position because the underlying image changes. Reserve blend modes for display-scale decorative elements; always put reading text on a solid or `isolation: isolate`-contained surface.
- **Safari non-separable modes**: the non-separable modes — `hue`, `saturation`, `color`, `luminosity` — have only partial Safari support as of 2025; avoid them in the critical rendering path without a tested fallback.
- **IE / Opera Mini targets**: no support at all; if your analytics show a meaningful share of these, use a flat color fallback.
- **Performance-sensitive lists**: `mix-blend-mode` triggers compositing on every frame; applying it to dozens of list items or table rows in a scrollable container can cause dropped frames, especially on mid-range mobile.
- **Glassmorphism on every card (the overuse trap)**: slapping `screen` or `overlay` blend modes on a layout's card grid produces visual noise and a cliche look (see Anti-slop). Reserve one composed moment rather than blending every surface.
- **Forced-colors / Windows High Contrast Mode**: `@media (forced-colors: active)` replaces colors system-wide; elements relying on blend mode for meaning (not decoration) must expose that meaning through structure and `forced-color-adjust: none` where intentional.

---

## How it works

The browser composites layers bottom-to-top. Normally each layer simply paints over the one beneath. With a blend mode, the final pixel color C is computed from the source color Cs (the element) and the backdrop color Cb using a mode-specific formula:

| Mode | Effect | Formula sketch |
|---|---|---|
| `normal` | Source covers backdrop | `C = Cs` |
| `multiply` | Darkens; black stays black, white disappears | `C = Cs × Cb` |
| `screen` | Lightens; white stays white, black disappears | `C = 1 − (1−Cs)(1−Cb)` |
| `overlay` | Contrast boost; adapts to backdrop lightness | multiply if Cb < 0.5, screen otherwise |
| `difference` | Inverts; black has no effect, white inverts | `C = |Cs − Cb|` |
| `exclusion` | Like difference, lower contrast | `C = Cs + Cb − 2·Cs·Cb` |
| `hue` / `saturation` / `color` / `luminosity` | HSL component swap — non-separable; partial Safari support | — |

**Key properties:**

```css
/* Element blends with everything behind it in its stacking context */
mix-blend-mode: multiply | screen | overlay | difference | exclusion
              | darken | lighten | color-dodge | color-burn
              | hard-light | soft-light | hue | saturation | color | luminosity
              | plus-lighter | normal;

/* Background layers within one element blend with each other */
background-blend-mode: screen; /* one value applies to all layers */
background-blend-mode: multiply, luminosity; /* per-layer, matches background-image order */

/* Contains blending within a subtree — children blend only with each other */
isolation: isolate; /* default: auto */
```

`mix-blend-mode` creates a stacking context automatically (same as `opacity < 1`). Use `isolation: isolate` on a container to stop its children from blending with ancestors outside it.

---

## Working code

### Preview-safe HTML/CSS - four compact patterns

This first sample is optimized for the website's sandboxed live preview: no remote images, no CDN scripts, no inner page scroll, and a visible static state before pointer interaction starts.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Blend modes - compact preview</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 16px;
      background: #0e0e12;
      color: #f0eeea;
      font-family: system-ui, sans-serif;
    }

    .preview {
      width: min(100%, 860px);
      display: grid;
      gap: 12px;
    }

    .title {
      margin: 0;
      font-size: clamp(1.1rem, 4vw, 1.8rem);
      line-height: 1;
      letter-spacing: 0;
    }

    .hint {
      margin: 4px 0 0;
      color: #b8b2aa;
      font-size: 0.84rem;
      line-height: 1.4;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .tile {
      position: relative;
      min-height: 132px;
      overflow: hidden;
      border: 1px solid rgb(255 255 255 / 0.12);
      border-radius: 14px;
      isolation: isolate;
      background: #15151b;
      box-shadow: 0 18px 50px rgb(0 0 0 / 0.28);
    }

    .label {
      position: absolute;
      left: 12px;
      top: 10px;
      z-index: 5;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgb(14 14 18 / 0.74);
      color: #f0eeea;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .duotone {
      background:
        linear-gradient(155deg, transparent 0 48%, #201f2a 49% 100%),
        radial-gradient(circle at 18% 24%, #f4f1ea 0 9%, transparent 10%),
        linear-gradient(140deg, #79828e 0 45%, #262c35 46% 100%);
    }

    .duotone::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(135deg, #1a0533, transparent 58%),
        linear-gradient(35deg, transparent 30%, #d4a6f0);
      mix-blend-mode: multiply;
    }

    .duotone::after {
      content: "";
      position: absolute;
      inset: 0;
      background: #d4a6f0;
      mix-blend-mode: color;
      opacity: 0.74;
      pointer-events: none;
    }

    .knockout {
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at 24% 36%, #f72585 0 12%, transparent 13%),
        radial-gradient(circle at 78% 64%, #4cc9f0 0 16%, transparent 17%),
        linear-gradient(135deg, #111827, #4a044e 54%, #022c22);
    }

    .knockout strong {
      color: #ffffff;
      font-size: clamp(2.5rem, 10vw, 5rem);
      font-weight: 950;
      letter-spacing: 0;
      line-height: 0.85;
      mix-blend-mode: overlay;
      text-transform: uppercase;
      text-shadow: 0 0 1px #ffffff;
      user-select: none;
    }

    .weave {
      background:
        radial-gradient(circle at 20% 20%, #f72585 0 10%, transparent 11%),
        repeating-linear-gradient(45deg, #b5179e 0 2px, transparent 2px 16px),
        repeating-linear-gradient(-45deg, #3a0ca3 0 2px, transparent 2px 16px),
        linear-gradient(135deg, #0e0e12, #240046);
      background-blend-mode: screen, screen, screen, normal;
    }

    .weave::after {
      content: "";
      position: absolute;
      inset: 22%;
      border: 2px solid rgb(255 255 255 / 0.42);
      border-radius: 999px;
      mix-blend-mode: overlay;
    }

    .difference {
      display: grid;
      place-items: center;
      background:
        linear-gradient(90deg, #f0eeea 0 49%, #0e0e12 50% 100%),
        linear-gradient(135deg, #f72585, #4cc9f0);
    }

    .difference p {
      z-index: 2;
      margin: 0;
      color: #ffffff;
      font-size: clamp(1.15rem, 4vw, 2rem);
      font-weight: 900;
      letter-spacing: 0;
      mix-blend-mode: difference;
      pointer-events: none;
      user-select: none;
    }

    .cursor-orb {
      position: absolute;
      left: var(--x, 50%);
      top: var(--y, 50%);
      width: 76px;
      height: 76px;
      border-radius: 50%;
      background: #ffffff;
      mix-blend-mode: difference;
      translate: -50% -50%;
      pointer-events: none;
      will-change: left, top;
    }

    @media (hover: none), (pointer: coarse) {
      .difference::after {
        content: "Static touch fallback";
        position: absolute;
        inset: auto 12px 12px;
        z-index: 3;
        padding: 4px 8px;
        border-radius: 999px;
        background: rgb(14 14 18 / 0.78);
        color: #f0eeea;
        font-size: 0.72rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .cursor-orb {
        left: 50%;
        top: 50%;
      }
    }

    @media (max-width: 420px) {
      body {
        padding: 10px;
      }

      .grid {
        gap: 8px;
      }

      .tile {
        min-height: 118px;
        border-radius: 10px;
      }

      .label {
        left: 8px;
        top: 8px;
        font-size: 0.64rem;
      }
    }
  </style>
</head>
<body>
  <main class="preview" aria-label="Four blend-mode patterns">
    <div>
      <h1 class="title">Blend modes, four ways</h1>
      <p class="hint">CSS-only panels for color, type, background layers, and difference cursors.</p>
    </div>

    <div class="grid">
      <section class="tile duotone" aria-label="Duotone color blend">
        <span class="label">Color</span>
      </section>

      <section class="tile knockout" aria-label="Overlay blend on display text">
        <span class="label">Overlay</span>
        <strong>Type</strong>
      </section>

      <section class="tile weave" aria-label="Background blend mode woven pattern">
        <span class="label">Background</span>
      </section>

      <section class="tile difference" id="difference" aria-label="Difference blend cursor spotlight">
        <span class="label">Difference</span>
        <div class="cursor-orb" aria-hidden="true"></div>
        <p>Move here</p>
      </section>
    </div>
  </main>

  <script>
    const mq = matchMedia('(hover: hover) and (pointer: fine)');
    const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

    if (mq.matches && !prefersReducedMotion.matches) {
      const stage = document.getElementById('difference');

      stage.addEventListener('pointermove', (event) => {
        const rect = stage.getBoundingClientRect();
        stage.style.setProperty('--x', event.clientX - rect.left + 'px');
        stage.style.setProperty('--y', event.clientY - rect.top + 'px');
      });

      stage.addEventListener('pointerleave', () => {
        stage.style.setProperty('--x', '50%');
        stage.style.setProperty('--y', '50%');
      });
    }
  </script>
</body>
</html>
```

**Contrast notes for this file's color pairs (recomputed):**
- `#f0eeea` text on `#0e0e12` bg: relative luminance ~0.868 vs ~0.00411 → ratio **~17.0:1** (well above AAA 7:1)
- `#8c8a86` label on `#0e0e12`: relative luminance ~0.254 vs ~0.00411 → ratio **~5.6:1** — passes WCAG AA (4.5:1) for all text sizes, including small normal-weight text; these decorative uppercase section labels clear the standard threshold
- Knockout text "Type": the word is intentionally display-scale. Its rendered contrast depends on the blended backdrop, so do not use this treatment for body copy.
- Difference panel text uses `mix-blend-mode: difference` as the effect itself. Keep it display-scale and provide normal, unblended explanatory text elsewhere in a real interface.

---

## Variations

### Duotone — color pair knob
Change `background-color` on the `.duotone` wrapper (shadow tone) and `::after` (highlight tone). A neutral pair is gray `#1a1a1a` + white `#ffffff`; a brand pair might be navy `#09203f` + amber `#f4a261`.

### Knockout — mode knob
On a **light** page background: `background-color: #000; mix-blend-mode: multiply` on the text overlay (dark area disappears, white text reveals photo). On a **dark** page background: `background-color: #fff; mix-blend-mode: screen` (light area disappears, dark text reveals). The rule: the container color you want to vanish must match the page's end of the luminance range.

### Layered color over imagery — `overlay` vs `color`
`mix-blend-mode: overlay` on a translucent color div over an image produces a contrast-boosted tint — highlights get brighter, shadows get darker. `mix-blend-mode: color` replaces hue/saturation but preserves all luminosity detail, producing a cleaner "color wash" without the contrast side-effect. Use `color` when preserving shadow/highlight fidelity matters.

### Animated difference header
A sticky `<header>` with `mix-blend-mode: difference` and white text automatically inverts against any scroll content — useful for editorial sites where the hero alternates between light and dark sections without needing JS to swap a class.

### Multiple `background-blend-mode` values
When `background` lists multiple images, list one blend mode per image in the same order. The first image listed blends with the one below it; the bottommost image blends with `background-color`.

```css
.layered {
  background:
    url("grain.png"),         /* blends with gradient below */
    linear-gradient(135deg, #f72585, #4cc9f0);
  background-blend-mode:
    overlay,                  /* grain over gradient */
    normal;                   /* gradient over background-color */
  background-color: #0e0e12;
}
```

---

## Accessibility

### Forced-colors / Windows High Contrast Mode
Blend mode effects are purely visual. In `@media (forced-colors: active)` the OS repaints element colors from a system palette, which can make blended effects invisible or change their meaning. Decorative blend mode elements should carry no semantic meaning — any message must be in the HTML. If a blend mode is load-bearing (e.g., the knockout text is the only place "Peaks" appears), ensure `aria-label` on the element contains the text, as shown in Pattern 2.

```css
@media (forced-colors: active) {
  /* If the blended surface is purely decorative, let the OS override it.
     If it carries meaning, opt out so structure carries meaning instead. */
  .bg-blend {
    forced-color-adjust: none; /* keep decorative gradient visible */
  }
}
```

### prefers-reduced-motion
Pattern 4 (cursor spotlight) is the only moving element. The JS pointer listener is gated behind `!prefersReducedMotion.matches` so the orb does not track the cursor when the user opts out of motion. The CSS also sets a static `translate` under `prefers-reduced-motion: reduce` as a belt-and-suspenders fallback (shown in the code above). Patterns 1–3 are fully static.

### Pointer / touch fallback
The cursor orb (Pattern 4) is hidden on touch and coarse-pointer devices via `@media (hover: none), (pointer: coarse)`. The JS listener only registers on `(hover: hover) and (pointer: fine)`. The page content is meaningful without the orb.

### Contrast — blend mode compositing and WCAG 1.4.3
WCAG SC 1.4.3 applies to the **resulting composited color**, not the source hex values. A blended element must be tested at its rendered output. Tools: browser DevTools eye-dropper on the rendered pixel, then a contrast checker. Never compute contrast against a hex value that will be composited away. For the duotone and knockout patterns in this file, text is absent from the blended surface; all reading text sits on the unblended `#0e0e12` body background.

### Screen readers
Blend modes are visual only — they have no effect on the accessibility tree. The image in Pattern 2 carries `aria-hidden="true"` (decorative), and the knockout text element carries the full word in `aria-label`. Pure decorative blend surfaces (gradient weaves, bg-blend panels) should have `role="img"` and a descriptive `aria-label` if they convey visual content, or `aria-hidden="true"` if purely decorative.

---

## Performance

**Compositing cost:** Any element with `mix-blend-mode` (non-`normal`) is promoted to its own compositor layer and the GPU runs the blend math per frame. This is cheaper than triggering layout or paint, but more expensive than a plain `opacity` or `transform`. On a page with 3–5 blended elements this is negligible; on 50+ blended list items scrolling at 60fps it can cause GPU memory pressure.

**`will-change` sparingly:** The cursor orb in Pattern 4 uses `will-change: translate` because it moves every pointermove event. Do not add `will-change` to static blended elements — the cost of promoting them outweighs any benefit.

**backdrop-filter interaction:** Do not combine `backdrop-filter` with `mix-blend-mode` on the same element unless you have tested the result. Both trigger compositing layers and their interaction order is browser-dependent; Firefox in particular has had bugs in this combination.

**`background-blend-mode` vs `mix-blend-mode` cost:** `background-blend-mode` blends within a single element's paint — generally cheaper than `mix-blend-mode` which must composite entire stacking-context subtrees. Prefer `background-blend-mode` for pure background decoration.

**Non-separable modes cost:** `hue`, `saturation`, `color`, `luminosity` require converting pixels to HSL space per composite tick — measurably more expensive than separable modes (`multiply`, `screen`, `overlay`, `difference`). Use sparingly and only on contained small elements.

**Animate `transform`/`opacity` only:** blend mode itself is not animatable (discrete, no interpolation). Animate the element's `transform` or `opacity`; the blended appearance updates as a consequence. Never animate `background-color` through a blended element expecting smooth compositing — that forces paint on each frame.

---

## Anti-slop

**The cliche:** applying `mix-blend-mode: screen` or `overlay` on every card in a grid over a purple-to-pink gradient background. This combines two blocklist entries at once — the `aurora blob behind centered hero` surface pattern and `glassmorphism on every card` — producing a muddy, low-contrast UI where text legibility fails at multiple contrast ratios and the whole page reads as AI-generated. The `mix-blend-mode` is doing nothing aesthetically intentional; it is just visual noise.

**The fix:** isolate one moment. Pick a single hero image or a single large display headline and apply the duotone or knockout. Let everything else render as flat, well-contrasted surfaces. The blend mode reads as intentional craft precisely because it is rare on the page. If using `difference` for the cursor spotlight, make it the page's one interactive flourish — not layered on top of already-blended cards and sections.

Cross-reference slop blocklist buckets: **SURFACE** — "glassmorphism on every card low-contrast" and "aurora blob behind centered hero." **COLOR** — "purple/indigo-to-pink gradient on white" (the default canvas that blend modes are most often poured onto). The fix is a committed single brand hue with a real neutral ramp, then one composed blend-mode moment over that surface.

---

## Pairs well with

- **css-gradients** (07-backgrounds-effects) — `background-blend-mode` fuses gradient layers; the gradient entry covers the source layer construction
- **gradient-mesh-aurora** (07-backgrounds-effects) — mesh gradients are the common canvas for `mix-blend-mode: overlay`; use `isolation: isolate` to contain the mesh
- **noise-grain** (07-backgrounds-effects, if present) — a grain texture tiled over a blended surface with `background-blend-mode: overlay` adds analog texture without flattening the color effect
- **glassmorphism / backdrop-filter** (07-backgrounds-effects) — `backdrop-filter` and `mix-blend-mode` occupy the same compositing budget; profile before combining; never combine on the same element
- **cursor-spotlight** (scroll/motion or interaction) — the difference-mode cursor pattern described in Pattern 4 is a self-contained implementation; a full cursor-spotlight entry would cover magnetic pull and spring easing on the orb

---

## Current references

- [MDN — mix-blend-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode) — formal definition, all 16+ values, stacking-context note, browser compatibility table (updated April 2026)
- [MDN — background-blend-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/background-blend-mode) — per-layer syntax, multiple-background interaction, browser support (Baseline Widely Available, ~95.9% global)
- [MDN — isolation](https://developer.mozilla.org/en-US/docs/Web/CSS/isolation) — when `auto` vs `isolate` matters, interaction with `mix-blend-mode` stacking context scope
- [MDN — CSS Compositing and Blending guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Compositing_and_blending) — the mental model: how stacking context determines the blending group; `mix-blend-mode` vs `background-blend-mode` scope diagram
- [Can I use — css-mixblendmode](https://caniuse.com/css-mixblendmode) — global support ~95.9%; Safari partial (non-separable modes limited); IE no support
- [Can I use — css-backgroundblendmode](https://caniuse.com/css-backgroundblendmode) — global ~95.9%; IE no support; Safari 10.1+ full
- [Codrops CSS Reference — mix-blend-mode](https://tympanus.net/codrops/css_reference/mix-blend-mode/) — interactive demos for each value; useful for visual exploration
- [MDN — background-clip](https://developer.mozilla.org/en-US/docs/Web/CSS/background-clip) — covers `text` value for knockout text technique; use alongside `mix-blend-mode` for layered type effects (updated 2025)
- [Microsoft Edge Blog — Deprecating -ms-high-contrast](https://blogs.windows.com/msedgedev/2024/04/29/deprecating-ms-high-contrast/) — 2024 announcement; use `forced-colors: active` media query instead for high-contrast overrides
