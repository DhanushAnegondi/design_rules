# Flat design and Material

> Interfaces built from solid color fields and clean type with little-to-no ornament — and its disciplined descendant, Google Material 3, which re-introduces just enough depth through systematic elevation tiers, tonal/dynamic color, and translucent state layers.

**Bucket:** visual style
**Maturity:** evergreen (pure flat) / current (Material 3) / cycling-back (Flat 2.0 subtle-depth revival)
**Effort:** low (pure flat) / medium (full M3 token system)
**Best for:** apps, dashboards, websites, portfolios, carousels

## What it is
Flat design strips away skeuomorphic cues — bevels, gloss, drop shadows, textures — leaving solid fills, crisp edges, generous space, and type/iconography doing the work. The user perceives a clean, fast, "honest" surface with no fake 3D. **Flat 2.0** walks that back slightly: subtle shadows, a hint of gradient, and a long-shadow accent return *just enough* depth to signal what is clickable. **Material 3 (M3)** is the most rigorous version of Flat 2.0: every surface sits on a numbered **elevation tier**, color comes from a **tonal palette** generated from one or more seed hues (optionally the user's wallpaper via *dynamic color* / "Material You"), and interaction feedback is a semi-transparent **state layer** rather than a color swap.

## When to use
- Product UI and dashboards where speed, scannability, and clear affordances matter more than mood.
- Design systems that must scale across web, Android, and iOS with one token set — M3 is built for exactly this.
- Teams that want theming (light/dark, brand recolor, per-user dynamic color) without hand-tuning every component.
- Data-dense screens where heavy shadows and texture would add visual noise.
- When you need WCAG-grade contrast guarantees: M3's tonal system derives on-color roles that are contrast-checked against their containers by construction.

## When NOT to use
- Brand/editorial sites that need atmosphere, depth, or a distinctive hand — pure flat can read generic and corporate.
- When affordances get ambiguous: the classic flat failure is a "flat button" that nobody recognizes as a button because nothing distinguishes it from a label or a card. That ambiguity is *the* reason Flat 2.0 exists.
- Marketing pages that lean on photographic depth, glass, or aurora moods — flat fights that language.
- Everyone overuses flat for the **generic SaaS app**: #3B82F6 buttons on #F9FAFB cards with one soft shadow on everything and Inter at one weight. It is the safe default that screams "template." If you reach for flat, commit to a real elevation system and a non-default hue, or it reads cheap.

## How it works
Three layered mechanisms, from oldest to current:

1. **Pure flat** — solid `background-color`, `border` (often hairline) instead of shadow, no gradients. Hierarchy comes from color, scale, weight, and whitespace alone.

2. **Flat 2.0 (subtle depth)** — re-add *one* systematic shadow scale and optional subtle gradients/long-shadows so interactive elements lift off the page. The discipline is that depth is *quantized*: a small fixed set of shadow tokens, not arbitrary per-element shadows.

3. **Material 3** formalizes that quantization:
   - **Elevation tiers.** Six levels, each a dp value: **Level 0 = 0dp, Level 1 = 1dp, Level 2 = 3dp, Level 3 = 6dp, Level 4 = 8dp, Level 5 = 12dp.** Higher = more separated from the background. Levels 0–3 are resting states; 4–5 are reserved for interacted states (hover/drag).
   - **Two ways to express elevation.** *Tonal elevation* tints the surface toward the primary hue as it rises (no shadow needed — preferred for separating stacked surfaces). *Shadow elevation* uses the dp value to size/soften a real shadow (used when an element needs extra focus or must not blend into a neighbor). M3 prefers tonal; shadow is the exception.
   - **Tonal / dynamic color.** A seed color is expanded into tonal palettes (tones 0–100). Color *roles* — `primary`, `on-primary`, `surface`, `surface-container`, `on-surface`, etc. — are picked from specific tones so that each `on-*` role clears WCAG contrast against its pair. Dynamic color swaps the seed (e.g. from wallpaper) and the whole role set re-derives.
   - **State layers.** Interaction feedback is a semi-transparent overlay of the content color at fixed opacities: **hover 8%, focus 10%, pressed 10%, dragged 16%.** It composites over any background, so one rule themes every component's states.
   - **Motion.** M3 uses emphasized easing (a slow-in/fast-out cubic) and standard durations so transitions feel of-a-piece.

## Working code

### Vanilla HTML/CSS — flat baseline vs Flat 2.0, plus an M3-style elevation + state-layer card
This is a complete, self-contained document. All color/shadow/opacity values are real M3-derived tokens. Contrast is checked: `--on-surface` `#1C1B1F` on `--surface` `#FEF7FF` measures **15.8:1**; `--on-primary` `#FFFFFF` on `--primary` `#6750A4` measures **5.36:1** (both clear WCAG AA 4.5:1, and the first clears AAA).

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Flat & Material 3</title>
<style>
  :root {
    /* M3 baseline tonal roles (seed #6750A4, light scheme) */
    --primary:            #6750A4;
    --on-primary:         #FFFFFF;
    --primary-container:  #EADDFF;
    --on-primary-container:#21005D;
    --surface:            #FEF7FF;
    --surface-container:  #F3EDF7;  /* tonal elevation: a tint toward primary */
    --surface-container-high:#ECE6F0;
    --on-surface:         #1C1B1F;  /* 15.8:1 on --surface */
    --on-surface-variant: #49454F;  /* 8.9:1 on --surface, for secondary text */
    --outline:            #79747E;

    /* M3 shadow-elevation scale (used only when an element needs to lift) */
    --elev-1: 0 1px 2px rgba(0,0,0,.30), 0 1px 3px 1px rgba(0,0,0,.15);
    --elev-3: 0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px rgba(0,0,0,.30);

    /* state-layer opacities, straight from M3 */
    --state-hover:   .08;
    --state-focus:   .10;
    --state-pressed: .10;

    --radius: 16px;
    --motion-emphasized: 300ms cubic-bezier(.2,0,0,1);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 48px 24px;
    font-family: "Roboto", system-ui, sans-serif;
    background: var(--surface); color: var(--on-surface);
    display: grid; gap: 32px; max-width: 760px; margin-inline: auto;
  }
  h1 { font-size: 1.5rem; font-weight: 500; letter-spacing: -.01em; margin: 0; }
  .label { color: var(--on-surface-variant); font-size: .8125rem; margin: 0 0 8px; }

  /* 1. PURE FLAT: solid fill, hairline outline, no shadow */
  .flat-card {
    background: var(--surface); border: 1px solid var(--outline);
    border-radius: var(--radius); padding: 20px;
  }

  /* 2. FLAT 2.0 / M3 SHADOW elevation: one quantized shadow token lifts it */
  .elevated-card {
    background: var(--surface-container); border-radius: var(--radius);
    padding: 20px; box-shadow: var(--elev-1);
  }

  /* 3. M3 TONAL elevation: NO shadow — separation comes from a tint */
  .tonal-card {
    background: var(--surface-container-high); border-radius: var(--radius);
    padding: 20px;
  }

  /* M3 filled button with a real state layer (overlay pseudo-element) */
  .m3-button {
    position: relative; isolation: isolate; overflow: hidden;
    border: 0; border-radius: 999px; cursor: pointer;
    padding: 10px 24px; font: 500 .875rem/1 "Roboto", system-ui, sans-serif;
    background: var(--primary); color: var(--on-primary);
    transition: box-shadow var(--motion-emphasized);
  }
  .m3-button::after {                 /* the state layer */
    content: ""; position: absolute; inset: 0; z-index: -1;
    background: var(--on-primary);     /* content color, faded */
    opacity: 0; transition: opacity 120ms linear;
  }
  .m3-button:hover::after   { opacity: var(--state-hover); }
  .m3-button:focus-visible::after { opacity: var(--state-focus); }
  .m3-button:active::after  { opacity: var(--state-pressed); }
  .m3-button:hover  { box-shadow: var(--elev-1); }   /* lift on hover */
  .m3-button:focus-visible {
    outline: 3px solid var(--primary-container); outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .m3-button, .m3-button::after { transition-duration: 1ms; }
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --surface:#141218; --surface-container:#211F26; --surface-container-high:#2B2930;
      --on-surface:#E6E0E9;        /* 13.9:1 on dark --surface */
      --on-surface-variant:#CAC4D0;
      --primary:#D0BCFF; --on-primary:#381E72; /* 8.6:1 — dark scheme flips tones */
      --primary-container:#4F378B; --outline:#938F99;
    }
  }
</style></head>
<body>
  <h1>Flat baseline vs Flat 2.0 vs Material 3</h1>

  <div><p class="label">Pure flat — outline, no shadow</p>
    <div class="flat-card">Affordance comes from the hairline outline and color alone.</div>
  </div>

  <div><p class="label">M3 shadow elevation (Level 1, 1dp)</p>
    <div class="elevated-card">One quantized shadow token. Never a bespoke per-card shadow.</div>
  </div>

  <div><p class="label">M3 tonal elevation — no shadow, just a tint</p>
    <div class="tonal-card">Separation is a surface tinted toward the primary hue.</div>
  </div>

  <div><p class="label">Filled button with state layer</p>
    <button class="m3-button">Hover / focus / press me</button>
  </div>
</body></html>
```

### React + Tailwind — M3 tokens as CSS variables, state layer as a utility
The realistic production choice is to expose M3 roles as CSS custom properties (so dynamic color can swap them at runtime) and let Tailwind reference them via arbitrary values. The state layer stays a real overlay element so its opacity is exactly the M3 spec.

```tsx
// tailwind.config.js maps roles to CSS vars:
//   colors: { primary:'var(--primary)', 'on-primary':'var(--on-primary)',
//             surface:'var(--surface)', 'on-surface':'var(--on-surface)' }
// :root defines the vars (same hex as the vanilla example above).

export function FilledButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="group relative isolate overflow-hidden rounded-full
                 bg-primary px-6 py-2.5 text-sm font-medium text-on-primary
                 transition-shadow duration-300 ease-[cubic-bezier(.2,0,0,1)]
                 hover:shadow-md focus-visible:outline-none
                 focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
    >
      {/* M3 state layer: content color at spec opacities */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-on-primary opacity-0
                   transition-opacity duration-100
                   group-hover:opacity-[0.08]
                   group-focus-visible:opacity-[0.10]
                   group-active:opacity-[0.10]"
      />
      {children}
    </button>
  );
}
```

To wire **dynamic color**, generate a scheme from a seed with the official `@material/material-color-utilities` package (`themeFromSourceColor`) and write the resulting tones into the `--primary` / `--surface` / `--on-*` CSS variables on `:root`; every component re-themes with no prop changes.

## Variations
- **Pure flat vs Flat 2.0** — the knob is *depth*: zero shadow/gradient (flat) vs one quantized shadow scale and optional subtle gradient (2.0).
- **Long-shadow flat** — a single hard-edged 45° shadow in a darker tint of the element color; a 2014-era accent that reads retro now, use sparingly.
- **Material 2 vs Material 3** — M2 leans on shadow elevation and a fixed primary/secondary/accent triad; M3 prefers *tonal* elevation, adds `surface-container` roles, dynamic color, and state layers.
- **Static brand color vs dynamic color** — fixed seed for a controlled brand vs wallpaper-derived seed (Material You) for personalization.
- **Expressive vs baseline M3** — Material 3 Expressive (2025) dials up larger shape radii, bolder color pairings, and springier motion while keeping the same token spine.

## Accessibility
- **prefers-reduced-motion**: M3 motion (emphasized easing, elevation lifts, ripples) must collapse to near-instant. Every snippet above sets `transition-duration: 1ms` / `motion-reduce:transition-none` under the query. Ripple animations specifically should be disabled, not just shortened.
- **Contrast / focus**: the whole point of M3 tonal roles is that each `on-*` color clears WCAG AA against its container by construction — verify it though (the light pairs here measure 15.8:1, 8.9:1, and 5.36:1). State layers are *additive overlays* and must never be the *only* signal of focus: always pair them with a visible `:focus-visible` outline/ring (the examples add a 3px ring), because an 8–10% tint alone can fall below the 3:1 non-text contrast UI requirement.
- **Touch/pointer fallback**: state layers are driven by `:hover`/`:active`/`:focus-visible`, so touch devices that don't hover still get the press (`:active`) and focus layers. Keep tap targets ≥ 48×48 CSS px per M3 guidance.
- **Screen-reader implications**: flat/M3 surfaces carry no inherent semantics — a flat "card" or "button" must use real `<button>`/`<a>` elements and ARIA roles, since there is no visual depth cue a screen reader can rely on. The state-layer overlay is decorative; mark it `aria-hidden`.

## Performance
- Animating elevation by transitioning `box-shadow` triggers paint each frame; for hot paths prefer cross-fading two stacked shadow layers via `opacity` (compositor-only) or accept the paint cost only on discrete hover, not on scroll.
- Tonal elevation (a flat `background-color`) is cheaper than shadow elevation — another reason M3 prefers it; reserve real shadows for the few elements that need focus.
- State layers as a positioned pseudo-element/overlay animate `opacity` only (GPU-friendly, no layout/paint thrash) — far cheaper than recoloring the element's `background`.
- Dynamic color recomputation (`material-color-utilities`) is a one-time cost on seed change; write the result to CSS variables once rather than recomputing per component.
- Flat has the lowest baseline cost of any visual style here: no `backdrop-filter`, no blur, no large gradients — its repaint budget is trivial, which is part of why it scales on low-end devices.

## Anti-slop
- **SURFACE — "soft drop shadow on everything."** The slop-blocklist names the generic flat-SaaS look: every card wearing the same blurry `0 4px 12px rgba(0,0,0,.1)`. Fix: adopt M3's *systematic elevation* — a fixed set of tokens (Level 1/2/3) where the shadow encodes a real meaning (resting vs raised vs interacted), or skip shadows entirely and use tonal elevation (a surface tinted toward your hue).
- **COLOR — generic SaaS blue #3B82F6 everywhere.** Flat's default tell. Fix: pick a less-defaulted seed hue and let M3 derive a full tonal ramp (`surface-container`, `on-surface-variant`, etc.) instead of hand-picking grays; or commit to one brand hue + one sharp accent that encodes meaning rather than rainbow categorical fills.
- **TYPE — Roboto/Inter at one weight.** Flat UIs default to a single neutral grotesque at 400 everywhere. Fix: keep the neutral for body if you must, but build a real modular scale with deliberate weight contrast (e.g. 500 for titles, 400 body, a mono accent for data), or swap the display face for something with character (Geist, General Sans).
- **The meta-tell**: flat reads "cheap" precisely when you grab the default of *every* bucket at once — blue button, gray cards, one soft shadow, Inter 400, three identical icon-title-blurb cards. Breaking two or three deliberately (a non-default seed, a real elevation system, tonal-not-shadow separation) is most of what turns "generated" into "designed."

## Pairs well with
- **Bento layout** (skeleton) — M3 `surface-container` tiers give bento cells clean, quantized separation without heavy borders.
- **Dark mode** (skin) — M3 ships a paired dark scheme where tones flip; the token system makes light/dark a single variable swap.
- **Staggered entrance / text reveal** (behavior) — M3 emphasized easing `cubic-bezier(.2,0,0,1)` gives those motions a consistent, premium feel across the app.
- **Editorial/typographic** (skin) — borrow its display type to rescue flat from one-weight monotony.

## Current references
- [Material Design 3 — Elevation](https://m3.material.io/styles/elevation/overview) — canonical elevation levels (0–5), dp values, and the tonal-vs-shadow guidance.
- [Material Design 3 — State layers](https://m3.material.io/foundations/interaction/states/state-layers) — exact state-layer opacities (hover 8%, focus 10%, pressed 10%, dragged 16%) and how they composite.
- [Material Design 3 — Design tokens](https://m3.material.io/foundations/design-tokens/overview) — how color/type/shape/elevation roles are tokenized so design and code share one source of truth.
- [Material Design — Tone-based surface color in M3](https://m3.material.io/blog/tone-based-surface-color-m3) — why M3 replaced +1…+5 surface overlays with tone-based `surface-container` roles.
- [material-color-utilities (GitHub)](https://github.com/material-foundation/material-color-utilities) — the official library that turns a seed into a contrast-safe tonal scheme; the engine behind dynamic color.
- [UXPin — The 7-minute guide to Flat Design 2.0](https://www.uxpin.com/studio/blog/the-7-minute-guide-to-flat-design-2-0/) — concise history of why pure flat hurt affordance and how 2.0 added subtle depth back.
- [MDN — color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) — the shipped CSS way to composite a state-layer tint over any surface without a separate overlay element.
