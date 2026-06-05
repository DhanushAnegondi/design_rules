# Color system construction

> A two-tier set of color variables — raw primitive ramps (one hue, steps 50→950) feeding semantic role aliases (bg, surface, fg, muted, border, accent) — so every screen pulls from roles, never from raw hex.

**Bucket:** system
**Maturity:** evergreen
**Effort:** medium
**Best for:** websites, portfolios, apps, dashboards

## What it is
A color system is two layers of CSS variables. The bottom layer is **primitives**: literal scales like `--neutral-50 … --neutral-950` and `--accent-50 … --accent-950`, each a perceptually even ramp of one hue. The top layer is **semantic aliases**: named roles like `--bg`, `--surface`, `--fg`, `--muted`, `--border`, `--accent` that *point at* specific primitive steps. Components only ever consume the semantic roles. The user perceives a consistent, intentional palette; the builder gets one place to retheme (light/dark, rebrand) by re-pointing aliases instead of find-replacing hex across the codebase.

## When to use
- Any project past a single page — the moment you'd otherwise copy a hex value twice, you need roles.
- Products that ship light **and** dark mode: roles swap, primitives mostly stay.
- Dashboards/apps with many surfaces stacked at different elevations (page → card → popover → input) that each need a distinct background.
- Design-system or multi-brand work where the palette must be re-pointed per tenant.
- When you want WCAG contrast to be *guaranteed by construction* — pin which step pairs with which and the math holds everywhere.

## When NOT to use
- A truly one-off static landing page with five colors total — a flat `:root` of named hexes is fine; a two-tier token graph is overkill.
- Don't build the full primitive ramp **and** semantic layer **and** component layer on day one for a tiny site; that third (component) tier is the over-engineered trap. Stop at primitives + semantics until a component genuinely needs its own knob.
- Everyone overuses the "generic SaaS blue everywhere" move: a single `#3B82F6` sprinkled as text, border, button, link, and focus ring with no real neutral ramp. That's not a system, it's a default. A system commits to a less-defaulted hue and a *real* neutral ramp with deliberate temperature.

## How it works
Three rules make a color system work:

1. **Perceptual ramps, not arbitrary hex.** Build each scale in **OKLCH** (`oklch(L C H)`: lightness 0–1, chroma 0–~0.37, hue 0–360°). Because OKLCH lightness tracks *perceived* brightness, walking L from ~0.98 down to ~0.18 in even steps gives a ramp where each step looks evenly darker — something HSL cannot do (HSL `lightness: 50%` is wildly different brightness across hues). Keep hue roughly constant down a ramp; taper chroma at the extremes (near-white step 50 and near-black step 950 carry almost no chroma, mid-steps carry the most) so the lightest/darkest tones don't look tinted-muddy.

2. **Numeric scale = lightness, not opacity.** The `50 100 200 … 900 950` convention (Tailwind-style) maps low numbers to light, high numbers to dark. 50 is your page tint, 500 is the "true" color, 900/950 are near-black. Pick odd granularity only where you need it (some teams add `25`/`950` at the ends).

3. **Roles point at steps.** Semantic aliases are `var()` references into the primitive ramp. This is the indirection that makes theming cheap:

```css
--bg:      var(--neutral-50);   /* page */
--surface: #ffffff;             /* raised card */
--fg:      var(--neutral-900);  /* body text */
--muted:   var(--neutral-600);  /* secondary text — must still pass AA */
--border:  var(--neutral-200);  /* hairlines, non-text */
--accent:  var(--accent-600);   /* primary action */
```

For light/dark you have two good mechanisms. The **native** one is `light-dark()` (Baseline 2024): set `color-scheme: light dark` on `:root`, then `--fg: light-dark(var(--neutral-900), var(--neutral-100))`. The **class/attribute** one is `:root[data-theme="dark"] { … }` overriding the aliases — needed when you want a manual toggle independent of the OS, since `light-dark()` only follows `color-scheme`. Note the primitives barely move between themes; you mostly re-point **roles** (and in dark mode, invert the *direction*: `--bg` goes to a high-numbered dark step, `--fg` to a low one).

Key properties/APIs: `oklch()`, custom properties (`--x` / `var()`), `color-scheme`, `light-dark()`, `color-mix()` for deriving hover/translucent states without inventing new primitives, and `@media (prefers-color-scheme: dark)` as the fallback when not using a manual toggle.

## Working code
A complete, self-contained system: one warm-neutral ramp, one committed accent (rust, hue ≈ 40° — deliberately *not* indigo/SaaS-blue), semantic roles for both themes, plus a manual `data-theme` override. Contrast is verified (math in the Accessibility section).

### Vanilla CSS (native `light-dark()` + manual override)
```html
<!DOCTYPE html>
<html lang="en" data-theme="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Color system</title>
<style>
:root {
  color-scheme: light dark;

  /* ---- TIER 1: PRIMITIVES (perceptual OKLCH ramps) ---- */
  /* warm neutral, hue ~70°, chroma tapered at the ends */
  --neutral-50:  oklch(0.985 0.003 70);
  --neutral-100: oklch(0.965 0.004 70);
  --neutral-200: oklch(0.915 0.006 70);
  --neutral-300: oklch(0.845 0.008 70);
  --neutral-400: oklch(0.715 0.010 70);
  --neutral-500: oklch(0.585 0.012 70);
  --neutral-600: oklch(0.470 0.012 70);
  --neutral-700: oklch(0.375 0.010 70);
  --neutral-800: oklch(0.270 0.008 70);
  --neutral-900: oklch(0.205 0.006 265); /* slight cool shift for ink depth */
  --neutral-950: oklch(0.165 0.006 265);

  /* committed accent: rust, hue ~40° */
  --accent-50:  oklch(0.965 0.012 40);
  --accent-100: oklch(0.925 0.030 40);
  --accent-200: oklch(0.860 0.060 40);
  --accent-300: oklch(0.785 0.095 40);
  --accent-400: oklch(0.705 0.130 40);
  --accent-500: oklch(0.620 0.150 40);
  --accent-600: oklch(0.555 0.150 40); /* primary action */
  --accent-700: oklch(0.475 0.130 40);
  --accent-800: oklch(0.400 0.105 40);
  --accent-900: oklch(0.330 0.080 40);

  /* ---- TIER 2: SEMANTIC ROLES ---- */
  /* light value first, dark value second */
  --bg:       light-dark(var(--neutral-50),  var(--neutral-950));
  --surface:  light-dark(#ffffff,            var(--neutral-900));
  --surface-2:light-dark(var(--neutral-100), var(--neutral-800)); /* deeper elevation */
  --fg:       light-dark(var(--neutral-900), var(--neutral-100));
  --muted:    light-dark(var(--neutral-600), var(--neutral-400)); /* secondary text */
  --border:   light-dark(var(--neutral-200), var(--neutral-700));
  --accent:   light-dark(var(--accent-600),  var(--accent-400));
  --accent-fg:light-dark(#ffffff,            var(--neutral-950)); /* text ON accent */
  --focus:    var(--accent);

  /* derived states without new primitives */
  --accent-hover: color-mix(in oklch, var(--accent) 85%, black);
}

/* Manual override: only kicks in when JS sets data-theme explicitly */
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark;  }

* { box-sizing: border-box; }
body {
  margin: 0; font: 16px/1.6 system-ui, sans-serif;
  background: var(--bg); color: var(--fg);
}
.wrap { max-width: 46rem; margin: 0 auto; padding: 3rem 1.5rem; }
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px; padding: 1.5rem; margin: 1rem 0;
}
.muted { color: var(--muted); }
.btn {
  display: inline-flex; align-items: center; gap: .5rem;
  background: var(--accent); color: var(--accent-fg);
  border: 0; border-radius: 10px; padding: .7rem 1.1rem;
  font-weight: 600; cursor: pointer;
}
.btn:hover { background: var(--accent-hover); }
:where(a, button):focus-visible {
  outline: 2px solid var(--focus); outline-offset: 2px;
}
.swatch { display: flex; gap: 4px; margin-top: 1rem; }
.swatch i { flex: 1; height: 34px; border-radius: 4px; }
</style>
</head>
<body>
  <div class="wrap">
    <button class="btn" onclick="toggle()">Toggle theme</button>
    <div class="card">
      <h2>Surface on background</h2>
      <p>Body text uses <code>--fg</code>; this line is <span class="muted">secondary, on <code>--muted</code></span>.</p>
      <button class="btn">Primary action</button>
      <div class="swatch" aria-hidden="true">
        <i style="background:var(--accent-200)"></i>
        <i style="background:var(--accent-400)"></i>
        <i style="background:var(--accent-600)"></i>
        <i style="background:var(--accent-800)"></i>
      </div>
    </div>
  </div>
  <script>
    function toggle() {
      const r = document.documentElement;
      const now = getComputedStyle(r).colorScheme.includes('dark') ? 'light' : 'dark';
      r.setAttribute('data-theme', now);
    }
  </script>
</body>
</html>
```

### Hex fallback for the same ramp (older targets / no OKLCH)
If you must support engines predating OKLCH (pre-2023), ship resolved sRGB hex and keep the *same role layer*. These are the rust/neutral values, contrast-verified:

```css
:root {
  --neutral-50:#fbfbf9; --neutral-100:#f3f2ee; --neutral-200:#e3e2dc;
  --neutral-300:#cfcdc4; --neutral-400:#a8a59a; --neutral-500:#827e72;
  --neutral-600:#525a67; --neutral-700:#3a3f48; --neutral-800:#262a31;
  --neutral-900:#15171c;
  --accent-400:#e0876b; --accent-600:#b1432b;

  --bg:var(--neutral-50); --surface:#fff; --fg:var(--neutral-900);
  --muted:var(--neutral-600); --border:var(--neutral-200);
  --accent:var(--accent-600); --accent-fg:#fff;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg:var(--neutral-900); --surface:#1e2128; --fg:#ecedf2;
    --muted:#9aa1ad; --border:var(--neutral-700);
    --accent:var(--accent-400); --accent-fg:var(--neutral-900);
  }
}
```

### Generating the ramp programmatically (build-step)
When you need ramps for several brand hues, generate rather than hand-tune. Use `culori` to walk lightness while tapering chroma:

```js
// npm i culori
import { formatHex, oklch, converter } from "culori";
const toOklch = converter("oklch");

// even lightness ladder for steps 50..950
const L = [0.985,0.965,0.915,0.845,0.715,0.585,0.470,0.375,0.270,0.205,0.165];
const STEPS = [50,100,200,300,400,500,600,700,800,900,950];

function ramp(hue, peakChroma = 0.15) {
  return STEPS.map((step, i) => {
    // chroma is highest mid-ramp, ~0 at the ends (bell over index)
    const t = i / (L.length - 1);            // 0..1 down the ramp
    const bell = Math.sin(Math.PI * t);      // 0 at ends, 1 in middle
    const c = peakChroma * bell;
    return [`--accent-${step}`, formatHex({ mode: "oklch", l: L[i], c, h: hue })];
  });
}

console.log(ramp(40).map(([k, v]) => `  ${k}: ${v};`).join("\n"));
```

## Variations
- **Token tiers**: two-tier (primitive → semantic) is the sweet spot; three-tier adds component tokens (`--button-bg: var(--accent)`) — only when a component needs independent control.
- **Theme mechanism**: native `light-dark()` (follows OS, least code) vs. `[data-theme]` class override (manual toggle, persists user choice) vs. both layered.
- **Neutral temperature**: cool-gray (hue ~265°), true-gray (chroma 0), or warm-gray (hue ~70°, as above). Warm neutrals read more editorial; cool reads more techy. Pick one and commit — mixing reads as a mistake.
- **Accent count**: single accent (cleanest), or accent + one functional "danger/success/warn" set. Avoid a rainbow of categorical hues; if you must encode categories, use 2–3 hues that *mean* something, not a 12-color wheel.
- **Step granularity**: 50–900 (9), 50–950 (10), or fine `…25, 950, 975` at the ends for subtle surfaces.

## Accessibility
This is a color topic, so contrast math is load-bearing. WCAG 2.2 ratio is `(L_light + 0.05) / (L_dark + 0.05)` using relative luminance `0.2126R + 0.7152G + 0.0722B` over linearized sRGB channels. Thresholds: **4.5:1** normal text, **3:1** large text (≥24px, or ≥18.7px bold) and UI/graphic boundaries.

Verified pairs for the hex palette above:

| Pair | Ratio | Verdict |
|---|---|---|
| `--fg` `#15171c` on `--bg` `#fbfbf9` (light) | **17.31:1** | AAA |
| `--muted` `#525a67` on `--bg` `#fbfbf9` | **6.72:1** | AA (and AAA for large) |
| `--accent` `#b1432b` text on `--bg` `#fbfbf9` | **5.47:1** | AA |
| `--accent-fg` `#fff` on `--accent` `#b1432b` (button) | **5.66:1** | AA |
| `--fg` `#ecedf2` on `--bg` `#15171c` (dark) | **15.34:1** | AAA |
| `--muted` dark `#9aa1ad` on `--surface` `#1e2128` | **6.20:1** | AA |
| `--accent` dark `#e0876b` on `--bg` `#15171c` | **6.70:1** | AA |
| `--border` `#e3e2dc` on `--bg` `#fbfbf9` | **1.25:1** | non-text only — never put text on it |

- **`--muted` is the trap**: secondary text still has to clear 4.5:1. A `neutral-400`/`-500` that looks "subtle enough" often fails. Test it, don't eyeball it.
- **Focus is a color role**: `--focus` must hit 3:1 against *both* the element and its adjacent background; a `2px` `outline-offset: 2px` ring (as above) keeps it visible on busy surfaces. Never remove `:focus-visible` outlines to "clean up" the palette.
- **Don't encode meaning in hue alone**: ~8% of men have a color-vision deficiency. Pair the accent/danger color with an icon, label, or weight change.
- **Honor `color-scheme`**: setting it lets the browser theme form controls, scrollbars, and the canvas, preventing white flashes in dark mode.
- **Forced-colors / high-contrast**: in `@media (forced-colors: active)` the OS overrides your palette — don't fight it; use system color keywords (`Canvas`, `CanvasText`, `ButtonText`, `Highlight`) for critical UI so it remains legible.

## Performance
- Custom properties cost essentially nothing at runtime; the system itself is free.
- **Watch token churn**: changing a variable on `:root` invalidates style for every element that reads it — fine for a theme toggle (one-off), bad if you animate a token every frame. Animate a transform/opacity instead, not `--bg`.
- `color-mix()` and `oklch()` resolve at parse/compute time, not per frame — no repaint penalty for static use.
- Theme-flash (FOUC): set the initial `data-theme` from an inline `<head>` script *before* first paint, reading `localStorage`/`matchMedia`, so dark users never flash light.
- Bundle: a primitive ramp + semantic layer is ~2–4 KB of CSS, gzips to near-nothing. Generating ramps with `culori` is a build-time dependency only — it never ships.

## Anti-slop
Cliché (see `_slop-blocklist.md` → COLOR): the purple/indigo-to-pink gradient on white (the #1 AI tell), or generic SaaS blue `#3B82F6` used as text/border/button/link all at once with a flat gray scale that has no temperature. That's grabbing the default of the color bucket. The tasteful alternative is what this entry builds: **commit to one less-defaulted hue** (here, rust at 40°) as the single sharp accent, sit it on a **real neutral ramp with deliberate temperature** (warm 70°, not dead `#808080`), and let the *system* — not a gradient — carry the identity. If you want gradient energy, use a tonal one-hue OKLCH gradient (e.g. `--accent-400 → --accent-700`), not the indigo-pink wedge. Breaking the color default this way is one of the cheapest, highest-leverage moves separating designed from generated.

## Pairs well with
- **Type scale / modular type** — a committed accent plus a real neutral ramp is only half a system; deliberate weight/size contrast in type is the other half.
- **Systematic elevation** — `--surface`, `--surface-2`, and a shadow scale should move together; map each elevation step to a background role + shadow, instead of soft-drop-shadowing everything.
- **Dark-mode strategy** — the role layer is exactly what makes a clean light/dark swap possible; design both from the start, inverting ramp *direction* not the hues.
- **Focus-ring / interaction states** — `--focus`, `--accent-hover` (via `color-mix`), and `:focus-visible` belong to the same token graph.
- **Glassmorphism / translucent surface moments** — derive the translucent fill from `color-mix(in oklch, var(--surface) 70%, transparent)` so even the one glass moment stays inside the system and WCAG-legible.

## Current references
- [MDN — `oklch()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) — syntax and L/C/H ranges; Baseline widely available since May 2023.
- [MDN — `light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) — native two-value theming, requires `color-scheme: light dark`.
- [web.dev — Color themes with Baseline CSS features](https://web.dev/articles/baseline-in-action-color-theme) — building a token palette and switching modes with `light-dark()`.
- [LogRocket — OKLCH in CSS: consistent, accessible palettes](https://blog.logrocket.com/oklch-css-consistent-accessible-color-palettes) — why OKLCH lightness makes even ramps; chroma tapering.
- [Design Tokens Community Group — Color Module draft](https://www.designtokens.org/tr/drafts/color/) — the emerging standard for the primitive→semantic token graph (currently the "Color Module 2025.10" working draft).
- [The Design System Guide — Design tokens](https://thedesignsystem.guide/design-tokens) — primitive / semantic / component tiers explained with examples.
- [culori docs](https://culorijs.org/) — color conversion/interpolation library used above for build-step ramp generation (supports all CSS Color Level 4 formats).
- [Tailwind Color Scale Generator (OKLCH, WCAG, 50–950)](https://66colorful.com/tools/tailwind-scale-generator) — interactive ramp + token export (Tailwind config / CSS vars / JSON) with built-in AA contrast checks to sanity-check steps.
