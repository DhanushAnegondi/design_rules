# Dark-mode token strategy

> A theme-aware token layer where one set of semantic color names (surface, text, accent) resolves to different raw values per scheme, so light and dark are two outputs of the same system rather than two hand-tuned palettes.

**Bucket:** system
**Maturity:** evergreen
**Effort:** medium
**Best for:** websites, portfolios, apps, dashboards

## What it is
Dark mode is not "invert the colors." It is a second resolution of the same set of *semantic* tokens — `--surface-base`, `--text-primary`, `--accent` — where each name maps to a different raw value depending on the active scheme. Components only ever reference the semantic names, so flipping schemes is a swap of the underlying value map, never a rewrite of component CSS. The user perceives a calm, low-glare surface where hierarchy is carried by **lightness steps** (lighter = closer to the viewer) instead of the drop shadows that do the work in light mode.

The whole strategy rests on three rules that separate a designed dark theme from an auto-generated one: never use pure `#000`, never literally invert the light palette, and build elevation by raising lightness rather than stacking shadows.

## When to use
- Any product that runs at night or in low light — apps, dashboards, reading/long-form sites, dev tools.
- When you already have a semantic token layer (or are building one): adding dark mode is then a value map, not a fork.
- When you want the OS preference respected automatically *and* a manual toggle that persists — the modern baseline expectation.
- When brand needs to survive the flip: a committed hue must read as "the same brand" in both schemes, just retuned for the background.

## When NOT to use
- A tiny static site with one surface and one text color — a hard-coded dark palette is cheaper than a token system; don't over-engineer.
- When you cannot give dark mode real QA. A half-tested dark theme (invisible focus rings, 1.5:1 placeholder text, white flashes on load) is worse than light-only.
- The overused case: shipping dark mode as `filter: invert(1)` or as the *exact numeric inverse* of the light palette. Inverted brand hues land on the wrong side of the hue circle and inverted photos look radioactive. Dark mode is retuned, not mirrored.
- Marketing pages where a bright, photographic hero is the whole point — forcing dark there can flatten the imagery.

## How it works
The mechanism is a **two-tier token map**:

1. **Primitive tokens** — raw values (`--gray-900: #121317`). Scheme-agnostic, never used directly by components.
2. **Semantic tokens** — intent names (`--surface-base`, `--text-primary`). These are what components consume, and these are what change between schemes.

You flip the semantic layer with one of two modern mechanisms:

- **`light-dark()`** (Baseline Newly available, May 2024 — all three engines). `--surface-base: light-dark(#ffffff, #121317);` returns the first value in a light scheme and the second in a dark scheme. It only activates when `color-scheme` includes both keywords. This collapses your light and dark definitions into one declaration — no duplicated `:root` blocks, no media query.
- **`prefers-color-scheme` media query + a manual override selector.** The classic pattern: default the semantic map to light, override it under `@media (prefers-color-scheme: dark)`, and *also* override it under an explicit `[data-theme="dark"]` selector so a toggle can force a scheme regardless of OS. This is what you reach for when you need a three-state toggle (light / dark / system) with `localStorage` persistence.

Two properties and four ideas do the heavy lifting:

- **`color-scheme: light dark;`** on `:root` tells the browser to render *native* UI — form controls, scrollbars, the `::-webkit` autofill, `accent-color`, the initial background before CSS paints — for both schemes. Without it, you get a white scrollbar and white form fields on a dark page, and a white flash on first paint. This property is the single most-forgotten line in dark-mode work.
- **Elevation via lightness.** On a dark surface a shadow has almost nothing to darken — the page is already dark — so a raised card reads as "closer" by being *lighter*, not by casting a shadow. Define base → raised → overlay as a lightness ramp (+4–8% L each step in OKLCH), and keep shadows only as a faint secondary cue.
- **No pure black, no pure white text.** `#000` makes overlaid shadows invisible, exaggerates halation (text smearing on OLED), and gives you no room to go *darker* for recessed surfaces. Start the base around `#101114`–`#15161B`. Likewise text peaks near `#E6E6EC`, not `#FFF`, to cut glare.
- **Contrast inverts its danger zone.** In light mode you fight text that's *too light*; in dark mode the trap is text that's *too bright* (vibration/halation) and accents that were tuned for white and now fail on dark. Light hues generally need to be *lightened and slightly desaturated* to keep a comfortable ratio against a dark surface.

## Working code

### Native CSS — `light-dark()` + `color-scheme` + persistent toggle
A complete, runnable document. One semantic map, both schemes, OS-aware, with a working three-state toggle. The inline `<head>` script applies the saved theme before first paint to avoid a flash.

```html
<!DOCTYPE html>
<html lang="en" data-theme="system">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Apply stored theme before paint to prevent a flash of the wrong scheme. -->
<script>
  (() => {
    const t = localStorage.getItem('theme') || 'system';
    document.documentElement.dataset.theme = t;
  })();
</script>
<style>
  /* ---- Tier 1: primitives (raw, never used by components directly) ---- */
  :root {
    --gray-50:#f7f7f9; --gray-100:#ececf0; --gray-400:#a2a2ad;
    --gray-700:#3a3b44; --gray-850:#1b1c22; --gray-900:#15161b;
    --gray-950:#101114; --ink:#0b0b0e;
    --brand-400:#9ab6ff; --brand-500:#7aa2ff; --brand-600:#3f63d6;
  }

  /* ---- color-scheme: native UI (scrollbars, form fields, autofill) follows the theme ---- */
  :root            { color-scheme: light dark; }   /* system: follow the OS */
  [data-theme=light]{ color-scheme: light; }
  [data-theme=dark] { color-scheme: dark; }

  /* ---- Tier 2: semantic tokens. light-dark() resolves per active scheme. ----
     In "system" mode color-scheme is "light dark", so light-dark() tracks the OS.
     The data-theme overrides below force a fixed scheme for the toggle. */
  :root {
    --surface-base:    light-dark(#ffffff, var(--gray-950)); /* page bg          */
    --surface-raised:  light-dark(var(--gray-50),  var(--gray-900));  /* cards    */
    --surface-overlay: light-dark(#ffffff, var(--gray-850));  /* modals/dropdowns */
    --border:          light-dark(#e2e2e8, #2a2b33);
    --text-primary:    light-dark(#16171c, #e6e6ec);
    --text-muted:      light-dark(#5a5b66, var(--gray-400));
    --accent:          light-dark(var(--brand-600), var(--brand-500));
    --accent-text:     light-dark(#ffffff, var(--ink)); /* text that sits ON accent */
    --focus-ring:      light-dark(#1d4ed8, var(--brand-400));
    --shadow: 0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.10);
  }
  /* Forced themes: pin color-scheme so light-dark() resolves correctly even
     when it disagrees with the OS. */
  [data-theme=light]{ --surface-base:#fff;  --text-primary:#16171c; } /* light-dark() handles the rest */
  [data-theme=dark] { --surface-base:var(--gray-950); --text-primary:#e6e6ec; }

  /* ---- components only ever read semantic names ---- */
  * { box-sizing:border-box; }
  body { margin:0; font:16px/1.6 system-ui, sans-serif;
         background:var(--surface-base); color:var(--text-primary);
         transition: background-color .2s ease, color .2s ease; }
  .wrap { max-width:42rem; margin:0 auto; padding:2.5rem 1.25rem; }
  .card { background:var(--surface-raised); border:1px solid var(--border);
          border-radius:14px; padding:1.5rem; box-shadow:var(--shadow); }
  .card + .card { margin-top:1rem; }
  .muted { color:var(--text-muted); }
  .btn { background:var(--accent); color:var(--accent-text); border:0;
         border-radius:10px; padding:.6rem 1rem; font-weight:600; cursor:pointer; }
  a { color:var(--accent); }
  :focus-visible { outline:3px solid var(--focus-ring); outline-offset:2px; }
  /* Elevation by lightness: overlay is LIGHTER than raised, which is lighter than base. */
  .overlay { background:var(--surface-overlay); border:1px solid var(--border);
             border-radius:14px; padding:1.25rem; box-shadow:var(--shadow); }
  .switch { display:inline-flex; gap:.25rem; border:1px solid var(--border);
            border-radius:999px; padding:.25rem; }
  .switch button { background:none; border:0; color:var(--text-muted);
                   padding:.35rem .8rem; border-radius:999px; cursor:pointer; }
  .switch button[aria-pressed=true]{ background:var(--surface-overlay); color:var(--text-primary); }
</style>
</head>
<body>
  <div class="wrap">
    <div class="switch" role="group" aria-label="Color theme">
      <button data-set="light"  aria-pressed="false">Light</button>
      <button data-set="dark"   aria-pressed="false">Dark</button>
      <button data-set="system" aria-pressed="false">System</button>
    </div>

    <h1>Quiet dark surfaces</h1>
    <p class="muted">Hierarchy comes from lightness, not shadow.</p>

    <div class="card">
      <p>Base page sits at #101114 — not #000, so recessed and raised
         surfaces have room to differ.</p>
      <button class="btn">Primary action</button>
    </div>
    <div class="overlay">This overlay is lighter than the card behind it — that is how it reads as "above."</div>
  </div>

  <script>
    const root = document.documentElement;
    const btns = [...document.querySelectorAll('.switch button')];
    function sync() {
      const t = root.dataset.theme;
      btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.set === t)));
    }
    btns.forEach(b => b.addEventListener('click', () => {
      const v = b.dataset.set;
      root.dataset.theme = v;
      v === 'system' ? localStorage.removeItem('theme') : localStorage.setItem('theme', v);
      sync();
    }));
    sync();
  </script>
</body>
</html>
```

### OKLCH elevation ramp — perceptually even surface steps
When you want surfaces that step up in lightness by an *equal perceived* amount, generate them in OKLCH where equal `L` deltas look equal (HSL does not guarantee this). A faint hue tint (here a cool 265°) keeps the darks from looking dead-gray.

```css
:root {
  color-scheme: dark;
  /* L steps of ~+0.035 each, tiny chroma so it reads neutral-cool, not blue */
  --surface-base:    oklch(0.18 0.012 265); /* page            */
  --surface-raised:  oklch(0.215 0.013 265); /* card           */
  --surface-2:       oklch(0.25 0.014 265);  /* nested / hover  */
  --surface-overlay: oklch(0.285 0.015 265); /* modal / popover */
  --text-primary:    oklch(0.93 0.005 265);
  --text-muted:      oklch(0.72 0.01 265);
  /* accent lightened + slightly desaturated so it stays legible on dark */
  --accent:          oklch(0.74 0.14 262);
}
```

### React — three-state theme hook with no flash
Vanilla CSS above is the real production layer; this is the React wiring around it.

```jsx
import { useEffect, useState, useCallback } from "react";

// Put this string in an inline <script> in your HTML <head> (or Next.js
// beforeInteractive) so the attribute is set before React hydrates — no flash:
//   (()=>{const t=localStorage.getItem('theme')||'system';
//    document.documentElement.dataset.theme=t;})()

export function useTheme() {
  const [theme, set] = useState(
    () => (typeof document !== "undefined"
      ? document.documentElement.dataset.theme || "system"
      : "system")
  );
  const apply = useCallback((next) => {
    document.documentElement.dataset.theme = next;
    next === "system"
      ? localStorage.removeItem("theme")
      : localStorage.setItem("theme", next);
    set(next);
  }, []);
  return [theme, apply];
}

export function ThemeSwitch() {
  const [theme, setTheme] = useTheme();
  return (
    <div role="group" aria-label="Color theme">
      {["light", "dark", "system"].map((t) => (
        <button key={t}
          aria-pressed={theme === t}
          onClick={() => setTheme(t)}>
          {t[0].toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
}
```

## Contrast math (verified, against this palette)
WCAG 2.x ratio uses relative luminance `L`; ratio = `(L_lighter + 0.05) / (L_darker + 0.05)`. Computed for the dark tokens above (base `#101114` ≈ used here as `#121317` family — values below use the exact hexes shown):

| Pair | Ratio | Passes |
|---|---|---|
| `--text-primary` `#E6E6EC` on `--surface-base` `#121317` | **14.93:1** | AAA body |
| `--text-muted` `#A2A2AD` on `--surface-base` `#121317` | **7.34:1** | AAA body |
| `--text-muted` `#A2A2AD` on `--surface-raised` `#1B1C22` | **6.72:1** | AAA large / AA body |
| `--accent` `#7AA2FF` on `--surface-base` `#121317` | **7.46:1** | AAA large, AA body |
| `--accent-text` `#0B0B0E` on `--accent` button `#7AA2FF` | **7.90:1** | AAA large, AA body |
| Link `#9AB6FF` on `--surface-base` `#121317` | **9.29:1** | AAA body |
| `--surface-base` `#121317` vs pure `#000000` | **1.13:1** | (why #000 leaves no recessed room) |

Targets: AA needs **4.5:1** for normal text, **3:1** for large text (≥24px, or ≥18.7px bold) and for UI/focus indicators (WCAG 2.2 SC 1.4.11). Every token pair above clears AA, most clear AAA. The `1.13:1` base-vs-black row is the point: starting at `#000` means a "recessed" panel can only go to black and have *nowhere to step down to*.

## Variations
- **Resolution mechanism**: `light-dark()` (one declaration, no media query, no manual toggle on its own) vs. `prefers-color-scheme` + `[data-theme]` override (needed for a forced toggle) vs. Tailwind v4 `dark:` variant rebound to a `class`/`data-attribute` selector.
- **Elevation knob**: lightness-only (purest), lightness + faint border, or lightness + subtle inner highlight on top edge (mimics light catching a raised surface). Shadow is at most a tertiary cue.
- **Tint**: neutral-gray darks vs. a *tinted* dark (cool blue, warm umber, deep green) — a few points of chroma in OKLCH stop the surface looking like dead charcoal and is the cheapest way to look intentional.
- **Accent handling**: keep one hue across schemes but raise its lightness for dark (recommended) vs. shift to a different tone entirely (riskier for brand recognition).
- **Dimming images/code**: leave imagery untouched vs. apply `filter: brightness(.85)` to large photos in dark mode to stop them glowing.

## Accessibility
- **prefers-reduced-motion**: the only thing that animates here is the `.2s` background/color transition on theme flip. Wrap it: `@media (prefers-reduced-motion: reduce) { body { transition: none; } }` so the swap is instant for users who request reduced motion.
- **`color-scheme` is an a11y feature, not just cosmetic**: it makes native form controls, scrollbars, and the pre-paint background match the theme, preventing a white scrollbar / white autofill field that fails contrast and causes a flash. Always set it.
- **Contrast**: dark mode's failure mode is *over-bright* text (halation/vibration on OLED) — peak text at ~`#E6E6EC`, not `#FFF`. Re-tune accents that were authored for white; the table above shows the retuned `#7AA2FF` clears AA on dark, whereas the light-mode `#3F63D6` would be too dark. Verify both schemes independently — passing in one does not imply the other.
- **Focus rings**: a focus indicator needs **3:1** against *adjacent colors* (WCAG 2.2 SC 1.4.11) and must be visible in both schemes. Use a scheme-aware `--focus-ring` token, never a single hard-coded color that vanishes on one background.
- **Don't trap the user**: offer light / dark / **system**, persist the choice, and never silently override a manual selection on the next visit.
- **Screen readers**: theme is purely visual — toggles must still be real buttons with `aria-pressed` (as above) or a labeled radio group, and the page content/order is identical across schemes.

## Performance
- **Avoid the flash of wrong theme (FOUC)**: read `localStorage` and set the `data-theme` attribute in a tiny *synchronous* inline script in `<head>` before the first paint. A theme decided in a React effect paints the wrong scheme first.
- **Token swaps are nearly free**: changing CSS custom properties on `:root` triggers style recalc + paint, not layout — cheap. `light-dark()` resolves at computed-value time with no JS at all.
- **Scope the transition**: animate only `background-color`/`color` on the few top-level surfaces, not `* { transition: all }`, which forces every element to recalc on every flip and janks low-end devices.
- **Bundle cost**: zero JS for the pure `light-dark()` path; the toggle adds only a few lines. No color library required — OKLCH and `light-dark()` are native.
- **OLED note**: very dark (not pure-black) surfaces save power on OLED while avoiding the smearing/halation that true `#000` text-on-black produces.

## Anti-slop
Cliché (see `_slop-blocklist.md` → SURFACE and COLOR): a "dark mode" that is `filter: invert(1)` or the literal numeric inverse of the light theme — inverted brand hues land on the opposite side of the color wheel, photos go neon, and `#3B82F6` generic-SaaS-blue stays generic in the dark. The other tell is *soft drop shadows on everything* trying to fake elevation that the eye can't see on a dark surface. Tasteful version: build a real two-tier semantic token map, start the base near `#101114` (never `#000`), carry elevation with a perceptually-even OKLCH lightness ramp, add a few points of chroma so the darks read as a deliberate tinted neutral, and re-tune one committed accent hue (lighter + slightly desaturated) so it clears AA against the dark surface instead of being mechanically inverted.

## Pairs well with
- `semantic-color-tokens` — dark mode *is* the second resolution of that token layer; without semantic names you have nothing clean to flip.
- `oklch-perceptual-color` — supplies the perceptually-even lightness ramp that makes surface elevation steps look equal.
- `wcag-contrast` — every flipped pair must be re-checked against its new background; the math here is non-optional.
- `elevation-and-shadow-system` — in light mode elevation is shadow; in dark it becomes lightness, and a good system expresses both from one set of elevation tokens.
- `system-font-stack` — neutral, glare-free type pairs naturally with quiet dark surfaces.

## Current references
- [MDN — `light-dark()` CSS function](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) — the one-declaration way to define both schemes; Baseline since May 2024.
- [web.dev — color-scheme-dependent colors with `light-dark()`](https://web.dev/articles/light-dark) — Adam Argyle's walkthrough of pairing `color-scheme` with `light-dark()`.
- [MDN — `color-scheme` property](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme) — why native UI and the pre-paint background need this line.
- [MDN — `prefers-color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) — the media query for OS preference and the manual-override pattern.
- [Muzli — Dark Mode Design Systems: patterns, tokens, and hierarchy](https://muz.li/blog/dark-mode-design-systems-a-complete-guide-to-patterns-tokens-and-hierarchy/) — the four-surface elevation-via-lightness model in depth.
- [Design Tokens Community Group — spec reaches first stable version (Oct 2025)](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/) — DTCG 2025.10 with full OKLCH / Color Module 4 support.
- [Tailwind CSS — Dark mode](https://tailwindcss.com/docs/dark-mode) — rebinding the `dark:` variant to a class/data-attribute for a manual toggle.
- [Can I use — `light-dark()`](https://caniuse.com/mdn-css_types_color_light-dark) — current support table before you rely on it.
