# Design tokens

> Named, reusable variables for every design decision — color, type, space, radius — organized in tiers so one source of truth drives every theme, brand, and platform.

**Bucket:** system
**Maturity:** evergreen
**Effort:** medium
**Best for:** apps, dashboards, websites, portfolios, design systems / multi-brand products

## What it is
A design token is a named entity that stores one design decision — `color-bg-default`, `space-4`, `font-size-lg` — instead of a raw value scattered across the codebase. You author them once and reference them everywhere, so changing a brand color or flipping to dark mode is a swap at the token layer, not a find-and-replace through hundreds of components. The power comes from *tiers*: a small set of raw primitives feed a set of semantic, intent-named tokens, which optionally feed component-specific tokens. On the web the runtime is almost always CSS custom properties, which makes theming live and inheritable with no rebuild.

## When to use
- Any product that ships **more than one theme** (light/dark, high-contrast) or **more than one brand** off a shared component set.
- Design systems where designers (Figma) and engineers (CSS/JS) must stay in sync — tokens are the shared contract synced via JSON.
- Apps and dashboards where consistency of spacing, elevation, and color across dozens of screens matters more than per-page artistry.
- When you want runtime theming (user picks accent color, density) without recompiling CSS.
- Anytime you catch yourself writing the same hex or `16px` in more than three places.

## When NOT to use
- A one-page marketing site or throwaway prototype with a single theme — a flat `:root` of a dozen variables is enough; a three-tier token pipeline with Style Dictionary is over-engineering you'll abandon.
- When you have no second consumer (no dark mode, no second brand, no Figma sync). Tiers earn their keep by *insulating* consumers from change; with one consumer there is nothing to insulate.
- **The overuse warning:** teams reach for the full primitive→semantic→component cascade on day one and drown in indirection — `button-bg` → `color-action` → `brand-600` → `#4f46e5` for a button that's only ever one color. Add a tier the moment a real second value appears, not before. Premature component tokens are the #1 way token systems become unmaintainable.
- Performance-critical animation values (per-frame transforms) — read those into JS once; don't thrash `getComputedStyle` on custom properties every frame.

## How it works
Tokens are organized as a directed reference graph across three tiers. Values only ever flow downward; consumers only ever read from the top.

1. **Primitives (a.k.a. global / reference / "option" tokens).** The raw palette and scales. Context-free: `--blue-600: oklch(0.55 0.18 264)`, `--space-4: 1rem`, `--text-2xl: 1.5rem`. These name *what a value is*, never *where it's used*. Components must never reference primitives directly.
2. **Semantic (a.k.a. alias / system tokens).** Intent-named tokens that *point at* primitives: `--color-bg-default: var(--gray-50)`, `--color-text-default: var(--gray-900)`, `--color-action: var(--blue-600)`. This is the layer components actually consume. Dark mode and multi-brand happen here: you repoint the same semantic names at different primitives.
3. **Component (optional, scoped).** Tokens local to one component that point at semantics: `--button-bg: var(--color-action)`. Only add these when a component needs an override the semantic layer can't express.

The naming convention that scales is **`category-property-variant-state`**, hyphen-cased: `color-text-default`, `color-text-muted`, `color-bg-action-hover`. Be consistent about order; ambiguity in token names is what rots a system.

Key web APIs / mechanisms:
- **CSS custom properties** (`--name` / `var(--name, fallback)`) are the runtime. They cascade and inherit, so a theme is just a different value of the same property set higher in the tree.
- **`color-scheme`** tells the browser (and form controls / scrollbars) which scheme is active.
- **`prefers-color-scheme`** media query for system-driven default dark mode.
- **Style Dictionary** (or Tokens Studio / Penpot export) transforms a platform-agnostic JSON source into CSS, JS, iOS, Android outputs — the JSON is the single source of truth, CSS is a build artifact.
- **W3C DTCG format** is the emerging standard JSON shape (`$value`, `$type`) that tools are converging on.

## Working code

### Vanilla CSS — three tiers, dark mode by token swap
A complete, runnable document. Primitives are raw; semantics point at primitives; dark mode and a second brand only ever repoint semantics.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Design tokens demo</title>
<style>
  /* ---- Tier 1: PRIMITIVES (raw, context-free) -------------------- */
  :root {
    /* Neutral ramp (warm gray, OKLCH for perceptual evenness) */
    --gray-0:   oklch(0.99 0.004 95);
    --gray-50:  oklch(0.97 0.006 95);
    --gray-100: oklch(0.93 0.008 95);
    --gray-300: oklch(0.80 0.010 95);
    --gray-500: oklch(0.62 0.012 95);
    --gray-700: oklch(0.44 0.012 95);
    --gray-900: oklch(0.24 0.010 95);
    --gray-950: oklch(0.17 0.010 95);

    /* Brand: a committed teal, not default SaaS blue */
    --teal-400: oklch(0.78 0.12 190);
    --teal-500: oklch(0.68 0.13 190);
    --teal-600: oklch(0.58 0.13 190);
    --teal-700: oklch(0.49 0.12 190);

    /* One sharp accent for emphasis only */
    --amber-500: oklch(0.80 0.16 75);

    /* Scales */
    --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
    --space-4: 1rem;    --space-6: 1.5rem; --space-8: 2rem;
    --radius-sm: 6px;   --radius-md: 10px; --radius-lg: 16px;
    --text-sm: 0.875rem; --text-base: 1rem; --text-lg: 1.25rem;
    --text-2xl: clamp(1.5rem, 1rem + 2vw, 2.25rem);
  }

  /* ---- Tier 2: SEMANTIC (intent-named; the layer components read) - */
  :root {
    --color-bg-page:     var(--gray-50);
    --color-bg-surface:  var(--gray-0);
    --color-border:      var(--gray-300);
    --color-text:        var(--gray-900);
    --color-text-muted:  var(--gray-700);
    --color-action:      var(--teal-600);
    --color-action-hover:var(--teal-700);
    --color-on-action:   var(--gray-0);
    --color-accent:      var(--amber-500);

    color-scheme: light;
  }

  /* ---- Dark mode = SAME semantic names, repointed primitives ------ */
  /* Manual override wins; system default is the fallback below it. */
  :root[data-theme="dark"] {
    --color-bg-page:     var(--gray-950);
    --color-bg-surface:  var(--gray-900);
    --color-border:      var(--gray-700);
    --color-text:        var(--gray-50);
    --color-text-muted:  var(--gray-300);
    --color-action:      var(--teal-400);
    --color-action-hover:var(--teal-500);
    --color-on-action:   var(--gray-950);
    --color-accent:      var(--amber-500);

    color-scheme: dark;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --color-bg-page:     var(--gray-950);
      --color-bg-surface:  var(--gray-900);
      --color-border:      var(--gray-700);
      --color-text:        var(--gray-50);
      --color-text-muted:  var(--gray-300);
      --color-action:      var(--teal-400);
      --color-action-hover:var(--teal-500);
      --color-on-action:   var(--gray-950);
      color-scheme: dark;
    }
  }

  /* ---- Second BRAND = repoint semantics only (no component edits) - */
  :root[data-brand="violet"] {
    --color-action:      oklch(0.55 0.20 295);
    --color-action-hover:oklch(0.47 0.20 295);
  }

  /* ---- Tier 3: COMPONENT (only where an override is real) --------- */
  .btn {
    --button-bg:    var(--color-action);
    --button-bg-h:  var(--color-action-hover);
    --button-fg:    var(--color-on-action);

    background: var(--button-bg);
    color: var(--button-fg);
    border: none;
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-6);
    font: 600 var(--text-base)/1 system-ui, sans-serif;
    cursor: pointer;
  }
  .btn:hover { background: var(--button-bg-h); }
  .btn:focus-visible {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
  }

  /* ---- Consumers read ONLY semantic / component tokens ----------- */
  body {
    margin: 0; padding: var(--space-8);
    background: var(--color-bg-page);
    color: var(--color-text);
    font: var(--text-base)/1.5 system-ui, sans-serif;
  }
  .card {
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    max-width: 32rem;
  }
  h1 { font-size: var(--text-2xl); margin: 0 0 var(--space-3); }
  .muted { color: var(--color-text-muted); }
</style>
</head>
<body>
  <div class="card">
    <h1>Tokens in three tiers</h1>
    <p class="muted">Theme and brand swap at the semantic layer only.</p>
    <button class="btn" onclick="
      document.documentElement.dataset.theme =
        document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'">
      Toggle theme
    </button>
    <button class="btn" onclick="
      document.documentElement.dataset.brand =
        document.documentElement.dataset.brand ? '' : 'violet'">
      Toggle brand
    </button>
  </div>
</body>
</html>
```

Two things to notice: dark mode and the violet brand touch **zero** consumer rules — only semantic tokens move. And the `:not([data-theme="light"])` guard lets a manual `data-theme` choice override the system preference cleanly.

### JSON source + Style Dictionary (the production pipeline)
When designers own tokens in Figma/Tokens Studio, the source of truth is JSON (W3C DTCG shape: each token is an object with `$value` and `$type`). Style Dictionary builds the CSS above as an artifact.

`tokens/color.json`:
```json
{
  "gray": {
    "50":  { "$value": "oklch(0.97 0.006 95)", "$type": "color" },
    "900": { "$value": "oklch(0.24 0.010 95)", "$type": "color" },
    "950": { "$value": "oklch(0.17 0.010 95)", "$type": "color" }
  },
  "teal": {
    "400": { "$value": "oklch(0.78 0.12 190)", "$type": "color" },
    "600": { "$value": "oklch(0.58 0.13 190)", "$type": "color" }
  },
  "color": {
    "bg-page":  { "$value": "{gray.50}",  "$type": "color" },
    "text":     { "$value": "{gray.900}", "$type": "color" },
    "action":   { "$value": "{teal.600}", "$type": "color" }
  }
}
```

`config.json`:
```json
{
  "source": ["tokens/**/*.json"],
  "platforms": {
    "css": {
      "transformGroup": "css",
      "buildPath": "build/css/",
      "files": [{
        "destination": "tokens.css",
        "format": "css/variables",
        "options": { "outputReferences": true }
      }]
    }
  }
}
```

Build with `npx style-dictionary build`. The `outputReferences: true` option is the important one: it preserves the `{gray.50}` alias as `var(--gray-50)` in the output instead of flattening it to a hex — so the *semantic* relationship survives into the CSS and stays themeable.

## Variations
- **Two-tier vs three-tier.** The knob is *indirection*. Most teams need only primitive + semantic; add component tokens only when a component has an override no semantic name captures. More tiers = more flexibility, more cognitive cost.
- **Token swap vs `light-dark()`.** Modern CSS `light-dark(lightVal, darkVal)` puts both values inline and switches on `color-scheme`, removing the duplicate dark block — at the cost of harder per-brand overrides. Good for simple two-scheme sites; tier-swap scales better for multi-brand.
- **Naming order.** `category-property-variant-state` vs Tailwind-style utility naming vs Material's role-based names. The knob is *who reads them* — design-led teams favor semantic roles, utility-led teams favor scale names.
- **Runtime.** CSS custom properties (web), Style Dictionary multi-platform export (web + native), or JS-object themes (`styled-components`/`vanilla-extract`). Knob: how many platforms consume the same source.

## Accessibility
- **Contrast is a token-layer responsibility, and the math must hold in both themes.** Verify every text-on-background semantic pair against WCAG 2.2: body text needs **4.5:1** (1.4.3 AA), large text (≥24px, or ≥18.66px bold) and UI/graphic boundaries need **3:1** (1.4.11). In the demo, light `--color-text` `oklch(0.24…)` ≈ `#27211b` (relative luminance L ≈ 0.018) on `--color-bg-page` `oklch(0.97…)` ≈ `#f4f1ec` (L ≈ 0.880) gives `(0.880 + 0.05) / (0.018 + 0.05) ≈ 13.7:1` — comfortably AAA. Re-run the same check for the dark theme; a ramp that passes in light can fail when inverted, especially for `--color-text-muted`.
- **`color-scheme`** must be set per theme so native controls, scrollbars, and form fields invert too — otherwise you get a white date-picker on a dark page.
- **Don't encode meaning in hue alone (1.4.1).** A `--color-danger` token still needs an icon or text label; ~8% of men can't rely on red/green.
- **Respect `prefers-color-scheme`** as the *default*, but let users override it (the `data-theme` attribute). Persist the choice so it survives reloads.
- **Focus tokens are real tokens.** Give focus rings their own semantic token (`--color-accent` here) and ensure the ring itself meets 3:1 against the adjacent surface in every theme.
- **Reduced-motion / pointer:** tokens don't move, but if you animate a theme transition, gate it behind `@media (prefers-reduced-motion: reduce)` and never animate `color` on large text areas (it can read as flicker). Theme toggles must be reachable and operable by keyboard and touch — a real `<button>`, not a hover-only control.

## Performance
- **Custom properties resolve at style-recalc, not paint.** Swapping a theme on `:root` triggers one style recalculation and repaint of affected elements — cheap and one-time. This is far lighter than swapping stylesheets.
- **Inheritance depth is nearly free**, but **deep `var()` chains** (component → semantic → primitive) each add a resolution hop; keep chains to 2–3 levels.
- **Avoid reading custom properties in hot JS loops.** `getComputedStyle(el).getPropertyValue('--x')` forces style flush; cache the value once.
- **Bundle:** a token CSS file is just text and gzips extremely well (repeated `var(--…)` strings). Style Dictionary output adds zero runtime JS. Ship one `tokens.css` rather than inlining values per-component to maximize dedupe.
- **Theme-transition flash:** to avoid a flash of wrong theme, set the `data-theme` attribute from a tiny inline `<head>` script before first paint, reading the persisted preference.

## Anti-slop
The slop tell (cross-ref `_slop-blocklist.md` → COLOR) is tokenizing straight to the defaults: `--color-primary: #3B82F6` (generic SaaS blue) plus a purple→pink gradient accent, on a pure-gray ramp. A token system makes this *worse* because the default is now enshrined system-wide. The tasteful move is to commit, at the primitive layer, to **one characterful brand hue + one sharp accent** (the demo's teal + amber), and to build a **real neutral ramp with a hint of temperature** (the warm-gray OKLCH ramp here, not `#000`→`#fff`) so surfaces feel designed rather than defaulted. For categorical/data color, resist a rainbow token set — define 2–3 hues that *encode meaning* (`--color-positive`, `--color-warning`) instead of `chart-1`…`chart-8` of arbitrary rainbow. Tokens are leverage: a good palette propagates everywhere, and so does a generated one.

## Pairs well with
- **OKLCH / perceptual color** — author primitive ramps in OKLCH so each step is perceptually even and dark-mode inversions stay legible; lightness is an explicit, tweakable channel.
- **Modular type scale** — your `--text-*` primitives should come from one ratio (e.g. 1.25) rather than ad-hoc sizes, and `clamp()` makes them fluid.
- **System font stack / variable fonts** — tokenize `--font-sans` / `--font-weight-*` so a font swap is one edit.
- **Semantic elevation** — replace "soft drop shadow on everything" with a tokenized `--shadow-1…3` scale tied to surface tiers.
- **Dark-mode strategy** — the token swap shown here is the mechanism; pair with a deliberately *desaturated, raised-lightness* dark palette rather than mechanically inverting.

## Current references
- [MDN — Using CSS custom properties (variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties) — the runtime: cascade, inheritance, `var()` fallbacks, scoping.
- [MDN — light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) — inline two-scheme values switched by `color-scheme`, the lighter alternative to a full dark block.
- [Style Dictionary docs](https://styledictionary.com/) — transforming JSON token source into CSS/JS/native; `outputReferences` and DTCG support.
- [W3C Design Tokens Community Group format spec](https://tr.designtokens.org/format/) — the standard `$value`/`$type` JSON shape tools are converging on.
- [Tokens Studio — Token Format: W3C DTCG vs Legacy](https://docs.tokens.studio/manage-settings/token-format) — practical differences between DTCG and legacy JSON, and how to convert.
- [Penpot — The developer's guide to design tokens and CSS variables](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/) — tiers, naming, and W3C-standard tokens mapped to CSS custom properties.
- [Always Twisted — Implementing light and dark mode with Style Dictionary](https://www.alwaystwisted.com/articles/a-design-tokens-workflow-part-7) — three concrete approaches to theme output from a single token source.
- [web.dev — prefers-color-scheme: the ultimate guide](https://web.dev/articles/prefers-color-scheme) — system dark mode, avoiding the FOUC flash, and letting users override.
