# OKLCH and perceptual color

> A perceptually-uniform color space where lightness, chroma, and hue are independent knobs, so equal numeric steps look like equal visual steps.

**Bucket:** system
**Maturity:** current
**Effort:** medium
**Best for:** websites, portfolios, apps, dashboards, design systems

## What it is
OKLCH describes a color by three values: **L**ightness (0–100% or 0–1), **C**hroma (colorfulness, 0 to ~0.37 in practice), and **H**ue (0–360°). It is built on the Oklab perceptual model, which means a color at `L 50%` *looks* roughly half as bright as one at `L 100%`, and two colors with the same L *look* equally light regardless of hue. The user never perceives "OKLCH" directly — they perceive that your blue ramp, your gray ramp, and your red ramp all step in visual lockstep, and that your brand hue stays the same brand hue as it gets lighter or darker instead of drifting purple or washing out.

## When to use
- Building **tonal ramps** (50→950 steps) for a brand hue or neutral gray where each step must feel evenly spaced.
- Generating **multi-hue palettes** that share a lightness rhythm — a blue-500, a red-500, and a green-500 that all read as the same "weight."
- **Dark-mode token systems**: flip or remap lightness while keeping chroma/hue intent, instead of hand-tuning every hex.
- **Programmatic theming** — `oklch(from var(--brand) calc(l + 0.1) c h)` to derive hover/active states from one source color.
- Reaching **wide-gamut (P3)** colors on modern displays that sRGB hex simply cannot express.

## When NOT to use
- You ship to a browser matrix that still includes pre-2023 Safari/Chrome/Firefox **with no fallback** — `oklch()` will be ignored and the property drops. Always pair with a hex fallback (see Working code).
- Tiny throwaway projects where one or two hand-picked hex colors are fine — the ramp machinery is overkill.
- You are choosing colors purely by **WCAG contrast targets**. OKLCH lightness is *perceptual*, not the same as WCAG relative luminance — a passing `L` does not guarantee a passing contrast ratio (see Accessibility for the worked math).
- Designers on your team only have hex/HSL tooling and no OKLCH picker — adopt [oklch.com](https://oklch.com/) first or the handoff breaks.
- Everyone overuses OKLCH for the **single-hue purple-to-pink hero gradient** — the space is great for *systematic ramps*, not for excusing the #1 AI-tell gradient (see Anti-slop).

## How it works
HSL's lightness is a geometric fiction: `hsl(60 100% 50%)` (yellow) and `hsl(240 100% 50%)` (blue) both claim "50% lightness," yet yellow is visually blinding and blue is murky. HSL also bends hue under the hood — interpolate blue toward white in HSL and it veers through purple. OKLCH fixes this by placing colors in a space tuned to human vision, so the three axes are genuinely independent.

Key properties and APIs:
- **`oklch(L C H)`** and **`oklch(L C H / alpha)`** — the CSS function. `L` accepts `0–1` or `0%–100%`; `C` is unbounded but practically `0–0.37`; `H` is an angle.
- **`oklab(L a b)`** — Cartesian sibling; better for *mixing/interpolating*, while OKLCH is better for *authoring* (hue as one number).
- **Relative color syntax** — `oklch(from var(--c) l c calc(h + 30))` derives a new color from an existing one, keyword-by-keyword.
- **`color-mix(in oklch, ...)`** — blend two colors through the perceptual space.
- **Gamut**: OKLCH can address sRGB and Display-P3. Values outside the target display's gamut get **gamut-mapped** by the browser (clamped toward in-gamut), which can flatten chroma at extreme L. Keep chroma modest at the very light and very dark ends.

A clean ramp is built by walking **L in even perceptual steps** while holding H constant and tapering C at the extremes (chroma cannot stay high near white or black). That single rule is what makes OKLCH ramps look even and HSL ramps look lumpy.

## Working code

### Vanilla CSS — a perceptually even brand + neutral ramp with fallbacks
```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<style>
:root {
  /* sRGB hex fallbacks first; oklch() below overrides in supporting browsers.
     Each pair is the SAME intended color, just two notations. */
  --brand-50:  #eef4ff;  --brand-100: #dbe6ff; --brand-200: #b9ccff;
  --brand-300: #8fabff;  --brand-400: #5f86f7; --brand-500: #2f6df0;
  --brand-600: #2563c9;  --brand-700: #1d4ed8; --brand-800: #1e40af;
  --brand-900: #1e3a8a;  --brand-950: #172554;

  --gray-50:#f7f7f8; --gray-100:#ececef; --gray-200:#d9d9e0; --gray-300:#b9b9c6;
  --gray-400:#8e8ea0; --gray-500:#6b6b7d; --gray-600:#52525f; --gray-700:#3f3f47;
  --gray-800:#2a2a30; --gray-900:#1a1a1e; --gray-950:#0e0e11;
}

/* Progressive enhancement: only browsers that understand oklch() apply these. */
@supports (color: oklch(0% 0 0)) {
  :root {
    /* Brand: hue 262 held constant; L steps evenly; C tapers at the ends. */
    --brand-50:  oklch(97% 0.018 262);
    --brand-100: oklch(93% 0.040 262);
    --brand-200: oklch(86% 0.080 262);
    --brand-300: oklch(78% 0.120 262);
    --brand-400: oklch(70% 0.155 262);
    --brand-500: oklch(62% 0.185 262);
    --brand-600: oklch(55% 0.185 262);
    --brand-700: oklch(48% 0.175 262);
    --brand-800: oklch(41% 0.150 262);
    --brand-900: oklch(34% 0.120 262);
    --brand-950: oklch(25% 0.080 262);

    /* Neutral: same L rhythm, near-zero chroma, faint warm hue for life. */
    --gray-50:  oklch(98% 0.003 264);
    --gray-100: oklch(95% 0.004 264);
    --gray-200: oklch(90% 0.006 264);
    --gray-300: oklch(82% 0.008 264);
    --gray-400: oklch(70% 0.010 264);
    --gray-500: oklch(60% 0.012 264);
    --gray-600: oklch(52% 0.012 264);
    --gray-700: oklch(44% 0.010 264);
    --gray-800: oklch(35% 0.008 264);
    --gray-900: oklch(26% 0.006 264);
    --gray-950: oklch(17% 0.005 264);
  }
}

body { margin:0; font-family: system-ui, sans-serif; background: var(--gray-50); }
.ramp { display:flex; }
.ramp > div { flex:1; height:64px; display:flex; align-items:flex-end;
  justify-content:center; font:600 11px/1 ui-monospace,monospace; padding-bottom:6px; }
</style></head>
<body>
  <div class="ramp">
    <div style="background:var(--brand-50)">50</div>
    <div style="background:var(--brand-100)">100</div>
    <div style="background:var(--brand-200)">200</div>
    <div style="background:var(--brand-300)">300</div>
    <div style="background:var(--brand-400)">400</div>
    <div style="background:var(--brand-500);color:#fff">500</div>
    <div style="background:var(--brand-600);color:#fff">600</div>
    <div style="background:var(--brand-700);color:#fff">700</div>
    <div style="background:var(--brand-800);color:#fff">800</div>
    <div style="background:var(--brand-900);color:#fff">900</div>
    <div style="background:var(--brand-950);color:#fff">950</div>
  </div>
</body></html>
```

### Vanilla CSS — derive states from one source color (relative color syntax)
```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<style>
:root { --accent: oklch(62% 0.185 262); }

.btn {
  /* one source color → hover/active/ring all derived, no extra tokens */
  background: var(--accent);
  color: oklch(from var(--accent) 98% 0.02 h);   /* near-white tinted by hue */
  border: 0; padding: .7rem 1.2rem; border-radius: .5rem;
  font: 600 1rem system-ui; cursor: pointer;
  transition: background .15s ease;
}
@supports (color: oklch(from red l c h)) {
  .btn:hover  { background: oklch(from var(--accent) calc(l - 0.06) c h); }
  .btn:active { background: oklch(from var(--accent) calc(l - 0.12) c h); }
  .btn:focus-visible {
    outline: 3px solid oklch(from var(--accent) calc(l + 0.15) c h);
    outline-offset: 2px;
  }
}
body { display:grid; place-items:center; height:100vh; margin:0; background:#0e0e11; }
</style></head>
<body><button class="btn">Save changes</button></body></html>
```

### JS — generate a ramp at build time (Culori)
```js
// npm i culori   — convert OKLCH steps to clamped, in-gamut sRGB hex for fallbacks.
import { oklch, formatHex, clampChroma } from "culori";

const HUE = 262;
// [L (0–1), C] pairs walking lightness evenly, chroma tapered at the ends.
const steps = [
  [0.97, 0.018], [0.93, 0.040], [0.86, 0.080], [0.78, 0.120], [0.70, 0.155],
  [0.62, 0.185], [0.55, 0.185], [0.48, 0.175], [0.41, 0.150], [0.34, 0.120], [0.25, 0.080],
];
const names = [50,100,200,300,400,500,600,700,800,900,950];

const ramp = Object.fromEntries(steps.map(([l, c], i) => {
  const color = clampChroma({ mode: "oklch", l, c, h: HUE }, "oklch"); // keep in sRGB gamut
  return [`brand-${names[i]}`, formatHex(color)];
}));

console.log(ramp);
// → { "brand-50":"#eef4ff", ..., "brand-500":"#2f6df0", ..., "brand-950":"#172554" }
```

## Variations
- **Single-hue tonal ramp** — knob: `L` steps with constant `H`. The default, for one brand color.
- **Constant-lightness multi-hue set** — knob: `H` varies while `L` and `C` hold. Categorical colors that all read at the same weight (encode meaning with 2–3 hues, not a rainbow).
- **Chroma-tapered ramp** — knob: `C` reduced at top and bottom L. Prevents the muddy/neon extremes that flat-chroma ramps produce.
- **Hue-shifted ramp (warm-to-cool)** — knob: small `H` drift across L (e.g. +8° toward shadows) for a hand-mixed, painterly feel.
- **Dark-mode remap** — knob: invert the L scale (`950`↔`50`) and slightly lift chroma, since dark backgrounds tolerate more saturation.

## Accessibility
- **OKLCH lightness is not WCAG luminance.** This is the trap. Two colors at the *same* OKLCH `L` can have very different contrast against white. Blue `#3b82f6` and amber `#f59e0b` sit at nearly the same OKLCH lightness (~`L 62%`), yet their WCAG relative luminances are **0.236** and **0.439** — white-on-blue is **3.68:1** (fails AA body text) while white-on-amber is **2.15:1** (worse still). Same perceptual L, wildly different contrast. So: pick steps in OKLCH for *visual evenness*, then **verify every text pairing with a real contrast check**.
- **Worked example, corrected.** White text `#ffffff` on brand-500 `#2f6df0`: the relative luminance of the blue is **L = 0.178**, giving a ratio of `(1.0 + 0.05) / (0.178 + 0.05) = 4.60:1`. That **passes** WCAG 2.2 AA for normal body text (≥ 4.5:1) — but only just. Brand-500 is your near-threshold case: a touch more chroma or one step lighter and it tips under. For comfortable headroom put white body text on **brand-600 `#2563c9` (5.67:1)** or **brand-700 `#1d4ed8` (6.70:1)**. The lesson is not "brand-500 fails" — it passes — but that *perceptual lightness alone never tells you which step clears the bar*; you must compute the ratio.
- **Targets:** AA needs ≥ 4.5:1 for normal text, ≥ 3:1 for large text (≥ 24px, or ≥ 19px bold) and for UI/graphics boundaries; AAA needs ≥ 7:1 normal.
- **Focus:** the relative-color focus ring above derives a *lighter* shade of the accent; confirm it clears 3:1 against the adjacent background, and keep `outline-offset` so it is never hidden by the button fill.
- **Color is not the only channel:** never encode state (error/success) in hue alone — pair with an icon or label for color-vision deficiency.
- **No motion here** to gate on `prefers-reduced-motion`, but if you animate color transitions, keep them under ~200ms and respect reduced-motion for any accompanying movement.

## Performance
- **Zero runtime cost** when authored as static custom properties — `oklch()` is parsed once like any color.
- **Relative color syntax** (`oklch(from ...)`) and `color-mix()` resolve at computed-value time; cheap, but recomputed on custom-property changes, so do not thrash `--accent` every frame in JS.
- **Gamut mapping** is done by the browser at paint; negligible, but out-of-gamut chroma silently clamps, so a value may not render as typed — validate with a picker.
- **Bundle:** native CSS adds nothing. A JS ramp generator (Culori is small and tree-shakeable) should run at **build time**, not in the shipped bundle.
- **Fallback duplication** doubles your token count in source; generate both notations from one source of truth (the Culori snippet) rather than hand-maintaining two.

## Anti-slop
The cliché (see `_slop-blocklist.md` → COLOR): the **purple/indigo-to-pink gradient on white** — the #1 AI tell — and **generic SaaS blue `#3B82F6` everywhere** with a flat, lifeless gray ramp. OKLCH is often misused to *dress up* exactly these defaults. The tasteful alternative: commit to **one less-defaulted brand hue** built as a proper OKLCH ramp (even L steps, tapered chroma), pair it with a **real neutral ramp that carries a faint hue** (gray at `C 0.004–0.012` reads richer than dead `#808080`), and if you want a gradient, make it a **tonal one-hue OKLCH gradient** (same H, stepping L) rather than the rainbow. For categorical data use **2–3 meaning-bearing hues at equal lightness**, never the full spectrum.

## Pairs well with
- **`semantic-color-tokens`** — OKLCH generates the raw ramp; semantic tokens (`--surface`, `--text-muted`) alias into it so components never reference raw steps.
- **`dark-mode-strategy`** — remap the L scale per theme instead of authoring a second palette by hand.
- **`fluid-type-with-clamp`** — the type-scale equivalent of even perceptual steps; both give a system its rhythm.
- **`system-font-stack`** — a restrained palette plus a characterful type choice is most of what separates "designed" from "generated."

## Current references
- [oklch() — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) — syntax, L/C/H ranges, and the current browser support table.
- [Relative colors — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors) — the `from` keyword for deriving colors, with `calc()` on channels.
- [OKLCH color picker & converter — oklch.com](https://oklch.com/) — interactive L/C/H picker that shows gamut limits and pastes hex/RGB/HSL in.
- [A guide to modern CSS colors — web.dev](https://web.dev/articles/high-definition-css-color-guide) — wide-gamut, OKLCH/OKLab, and gamut mapping in context.
- [OKLCH in CSS: why we moved from RGB and HSL — Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) — the canonical explainer on why HSL ramps look uneven.
