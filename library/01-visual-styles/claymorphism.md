# Claymorphism

> Puffy, pastel UI surfaces that look like soft moulded clay — big rounded corners, a soft outer drop shadow, and inset highlight/shadow that fake a rounded 3D extrusion.

**Bucket:** visual style
**Maturity:** cycling-back
**Effort:** low
**Best for:** websites, portfolios, apps (onboarding, kids/edtech, fintech illustration pages, NFT/Web3 marketing)

## What it is
Claymorphism makes a flat HTML element read as a single rounded lump of clay. You get there with three ingredients layered on one box: a large `border-radius`, a soft offset *outer* drop shadow that lifts the lump off the page, and a pair of *inset* shadows — a light one and a dark one on opposite edges — that round the top off and emboss the bottom. The fill is a bright pastel, almost always lighter than the page behind it, so the drop shadow actually reads. The result perceptually sits between neumorphism (where the element is the *same* color as the background and looks pressed *into* it) and skeuomorphism (literal material mimicry): clay objects float *above* the surface and look squeezable. It pairs almost canonically with rounded 3D illustration (Blender/Spline "blobby" props) because the UI chrome and the art share one plastic language.

## When to use
- Friendly, low-stakes products: onboarding flows, edtech, kids' apps, wellness, casual fintech, mascot-driven marketing sites.
- Hero and feature sections that already lean on rounded 3D illustration — the chrome should match the art.
- Portfolio or landing pages that want a warm, tactile, "designed" feel without the low-contrast trap of glassmorphism.
- Card grids, pill buttons, toggles, and badges where a little puffiness adds delight and the content is short.
- When you want depth without translucency cost — clay is opaque, so unlike glass it never puts body text over a busy backdrop.

## When NOT to use
- Dense, data-heavy UI: dashboards, tables, spreadsheets, admin tools. Fat radii and shadow halos waste space and make scannable rows feel like loose candy.
- Dark themes by default. The look depends on a soft drop shadow reading against a *lighter-than-card* background; on dark surfaces the outer shadow disappears and you must invert to glow, which is finicky.
- Serious / authoritative contexts (legal, medical results, enterprise security) — the toy aesthetic undercuts trust.
- Everywhere at once. The #1 overuse: *every* card, input, and div gets the same puffy treatment until the whole page looks like a bath toy. Reserve clay for focal surfaces; let secondary chrome stay flat.
- Tiny text on saturated pastel fills — pastels are light, so you must put *dark* text on them or you fail contrast (see Accessibility).

## How it works
The whole effect is `box-shadow` plus `border-radius`; no images, no `backdrop-filter`, no JS. A `box-shadow` value can stack multiple comma-separated shadows on one element, and any shadow prefixed with `inset` is painted *inside* the box. The clay stack uses three at minimum:

1. **Outer drop shadow** — large blur, positive x/y offset, low-alpha dark (or a tinted, slightly-darker-than-card hue). This is what lifts the lump off the page. Example: `40px 40px 68px rgba(44,33,71,.18)`.
2. **Inset highlight** — `inset` shadow offset toward the light source (top-left or top), a light/white tint. This rounds the top edge into a soft dome. Example: `inset 8px 8px 14px rgba(255,255,255,.55)`.
3. **Inset core shadow** — `inset` shadow offset to the opposite edge (bottom-right), a darker tint of the fill. This embosses the bottom and gives the lump volume. Example: `inset -10px -14px 24px rgba(140,109,242,.22)`.

Key properties and their roles:

- **`border-radius`** — drives the "softness." Clay lives roughly in the 24–60px range (or a large `%`/`rem`). Below ~16px it stops reading as clay; above ~half the smaller dimension it becomes a pill/blob.
- **`background`** — a bright pastel, **lighter than the page**. HSL with high lightness (90–96%) and modest saturation works well; this is also the contrast anchor.
- **Inset alpha + blur** — the volume knob. Bigger blur and offset on the inset shadows = puffier, more inflated; smaller = subtler, more grown-up.
- **`corner-shape: squircle`** (2026, Chromium-only) — optional progressive enhancement that swaps the circular-arc corner for an Apple-style superellipse, which reads as even softer clay. Progressive-enhance only; cross-browser support is years out, so `border-radius` must carry the look alone.

## Working code

### Vanilla HTML/CSS — complete, runnable

Open this file in a browser; it renders three clay cards, a clay button, and a clay toggle with a real three-shadow stack, a reduced-motion guard, and verified-contrast text.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Claymorphism</title>
<style>
  :root {
    /* Palette — committed single hue (violet) + one warm accent, not the
       purple→pink gradient AI tell. All text pairings verified WCAG AA below. */
    --page:    #ece6fb;          /* page bg, darker than cards so drop shadow reads */
    --clay:    #f4ecff;          /* card fill (lighter than page) */
    --clay-2:  #eef0ff;          /* alt card fill */
    --accent:  #ffd6a5;          /* warm peach accent fill */
    --ink:     #2c2147;          /* primary text  — 12.9:1 on --clay (AAA) */
    --ink-mut: #5b4a8a;          /* muted text    — 6.55:1 on --clay (AA)  */
    --shade:   rgba(44,33,71,.18);   /* outer drop shadow tint */
    --hi:      rgba(255,255,255,.55);/* inset highlight */
    --core:    rgba(140,109,242,.22);/* inset core shadow (tint of fill) */

    --r: 34px;                   /* clay radius */
  }

  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh;
    display: grid; place-items: center;
    padding: 48px;
    background: var(--page);
    font-family: ui-rounded, "SF Pro Rounded", "Nunito",
                 system-ui, sans-serif;
    color: var(--ink);
  }

  .grid {
    display: grid; gap: 32px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    max-width: 820px; width: 100%;
  }

  /* The clay surface: ONE outer drop shadow + TWO inset shadows. */
  .clay {
    background: var(--clay);
    border-radius: var(--r);
    padding: 28px;
    box-shadow:
      40px 40px 68px var(--shade),           /* outer: lifts off page   */
      inset  8px  8px 14px var(--hi),         /* inset highlight (top-L) */
      inset -10px -14px 24px var(--core);     /* inset core   (bottom-R) */
  }
  .clay.alt { background: var(--clay-2); }

  .clay h3 { margin: 0 0 8px; font-size: 1.15rem; }
  .clay p  { margin: 0; color: var(--ink-mut); line-height: 1.5; font-size: .95rem; }

  /* Clay button — dark ink on peach fill = 10.9:1 (AA). Press = invert offsets. */
  .clay-btn {
    appearance: none; border: 0; cursor: pointer;
    font: inherit; font-weight: 700; color: var(--ink);
    background: var(--accent);
    padding: 16px 28px; border-radius: 22px;
    box-shadow:
      18px 18px 30px rgba(44,33,71,.16),
      inset  6px  6px 10px rgba(255,255,255,.5),
      inset -8px -10px 16px rgba(214,150,90,.35);
    transition: box-shadow .18s ease, transform .18s ease;
  }
  .clay-btn:hover { transform: translateY(-2px); }
  .clay-btn:active {                     /* pressed: shrink + flip insets inward */
    transform: translateY(1px);
    box-shadow:
      6px 6px 12px rgba(44,33,71,.14),
      inset -6px -6px 10px rgba(255,255,255,.5),
      inset  8px 10px 16px rgba(214,150,90,.4);
  }
  .clay-btn:focus-visible {
    outline: 3px solid #6a4cf0;          /* 5.4:1 vs white halo — visible focus */
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .clay-btn { transition: none; }
    .clay-btn:hover, .clay-btn:active { transform: none; }
  }
</style>
</head>
<body>
  <div class="grid">
    <article class="clay">
      <h3>Soft by default</h3>
      <p>Big radius, one drop shadow, two inset shadows. That is the whole trick.</p>
    </article>
    <article class="clay alt">
      <h3>Lighter than the page</h3>
      <p>The card fill must be brighter than the background or the lift disappears.</p>
    </article>
    <article class="clay">
      <h3>Dark ink only</h3>
      <p>Pastels are light, so text stays dark to clear WCAG contrast.</p>
      <p style="margin-top:16px">
        <button class="clay-btn" type="button">Squeeze me</button>
      </p>
    </article>
  </div>
</body>
</html>
```

### React + Tailwind (v3.4+) — clay card as a component

Tailwind's arbitrary-value syntax carries the multi-shadow stack. Define the palette as CSS variables (as above) or inline; here it is inline for a drop-in component.

```jsx
// ClayCard.jsx — Tailwind v3.4+. Shadow stack lives in arbitrary [...] values.
export function ClayCard({ title, children }) {
  return (
    <article
      className="
        rounded-[34px] bg-[#f4ecff] p-7 text-[#2c2147]
        shadow-[40px_40px_68px_rgba(44,33,71,0.18),inset_8px_8px_14px_rgba(255,255,255,0.55),inset_-10px_-14px_24px_rgba(140,109,242,0.22)]
      "
    >
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      <p className="text-[#5b4a8a] leading-relaxed text-[0.95rem]">{children}</p>
    </article>
  );
}

export function ClayButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="
        rounded-[22px] bg-[#ffd6a5] px-7 py-4 font-bold text-[#2c2147]
        shadow-[18px_18px_30px_rgba(44,33,71,0.16),inset_6px_6px_10px_rgba(255,255,255,0.5),inset_-8px_-10px_16px_rgba(214,150,90,0.35)]
        transition-[transform,box-shadow] duration-150 ease-out
        hover:-translate-y-0.5
        active:translate-y-px
        active:shadow-[6px_6px_12px_rgba(44,33,71,0.14),inset_-6px_-6px_10px_rgba(255,255,255,0.5),inset_8px_10px_16px_rgba(214,150,90,0.4)]
        focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#6a4cf0]
        motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0
      "
    >
      {children}
    </button>
  );
}
```

## Variations
- **Puffiness (the main knob):** scale the inset offset/blur. Low (`inset 4px 4px 8px`) = subtle, "grown-up clay"; high (`inset 14px 14px 28px`) = inflated, balloon-like. This single axis is what separates tasteful from toy.
- **Light direction:** top-left vs top inset highlight. Top-only highlight (`inset 0 14px 28px #fff`) gives a glossy "lit from above" dome; corner highlight gives a directional, hand-modelled look.
- **Tinted vs neutral shadow:** outer shadow as neutral `rgba(0,0,0,.1)` reads cleaner; as a darker tint of the *hue* (e.g. violet shade) reads warmer and more cohesive.
- **Mono-hue clay:** background, card, and shadow are all the same hue at different lightness (the LogRocket `hsl(120deg …)` approach) — the most cohesive, least "rainbow" version.
- **Squircle clay:** add `corner-shape: squircle;` (Chromium 139+, 2026) for Apple-style superellipse corners; falls back to normal `border-radius` everywhere else.
- **Clay-on-dark (advanced):** invert — fill slightly lighter than a deep background, outer shadow becomes a soft *glow* of the fill hue, inset core stays dark. Harder to balance; use sparingly.

## Accessibility
- **Contrast is the make-or-break.** Pastel fills are light, so text must be **dark**. In the code above: `#2c2147` on `#f4ecff` = **12.92:1** (AAA), muted `#5b4a8a` on `#f4ecff` = **6.55:1** (AA), button `#2c2147` on `#ffd6a5` = **10.89:1** (AA). Never put white or light text on a pastel clay fill — `#fff` on `#7c5cff` is only 4.35:1 and *fails* AA for normal text; if you need a saturated button use `#6a4cf0` (5.38:1) or keep text dark.
- **Shadows are not borders.** The puffy edge is decorative; it conveys no state to assistive tech and can vanish in forced-colors/high-contrast mode. Convey state (selected, pressed, disabled) with real properties — text, `aria-pressed`, color shift — not shadow alone. Test in Windows High Contrast / `forced-colors: active`, where `box-shadow` is dropped entirely; ensure controls still read as controls (keep visible text and a `border` fallback if the shape is load-bearing).
- **Focus must survive the clay.** A puffy button can swallow a faint focus ring. Use a solid, high-contrast `:focus-visible` outline with offset (the snippet uses a 3px `#6a4cf0` outline at 3px offset).
- **prefers-reduced-motion:** the hover-lift and press-squish are motion. Both snippets gate `transform`/`transition` behind `prefers-reduced-motion: reduce` so the surface still changes its shadow on press but does not translate for users who opt out.
- **Pointer/touch fallback:** `:hover` lift is decorative and never the only affordance; the `:active` press state fires on touch too, and `:focus-visible` covers keyboard. Hit targets stay ≥44×44px (the button is taller than that). Don't rely on hover to reveal anything.
- **Screen-reader implications:** none inherent — clay is pure CSS skin on normal semantic elements. Keep buttons as `<button>`, cards as `<article>`/`<section>`; the look adds no nodes and no ARIA debt.

## Performance
- **Cheap, with one caveat: shadow blur.** `box-shadow` with large blur radii (you'll use 60px+) is rasterised on paint. Static cards are fine. The cost shows up when you **animate** a clay element — animating `box-shadow` itself triggers repaints every frame and janks. Animate `transform` and (if needed) cross-fade between two pre-baked shadow states via `opacity` on stacked pseudo-elements, rather than tweening the blur/offset numbers.
- **No `backdrop-filter`** — unlike glassmorphism, clay is fully opaque, so it avoids the expensive real-time blur of everything behind it. This is a genuine perf win over glass.
- **Many surfaces = many big shadows.** A grid of 30 clay cards each with three large-blur shadows adds real paint area. Cap radius/blur, and avoid `will-change` unless you measured a specific janky animation — promoting dozens of cards to GPU layers wastes memory.
- **Bundle cost: zero.** No library, no images, no font dependency (rounded system fonts like `ui-rounded` cost nothing).
- **Inset + outer on one box repaints together;** keep clay elements off scroll-linked animation paths so you're not repainting big blurs on every scroll frame.

## Anti-slop
- **SURFACE — "soft drop shadow on everything":** the slop version of clay is one identical puffy stack slapped on every card, input, and `div` until the page is a wall of marshmallows with no hierarchy. The fix is *systematic elevation*: reserve full clay for one or two focal surfaces, give secondary chrome a flatter, smaller shadow, and let tertiary content be flat. Puffiness should encode importance, not be the default of every box.
- **COLOR — the purple→pink gradient on white (the #1 AI tell):** stock clay tutorials reach straight for a violet-to-magenta wash. Don't. Commit to a **single brand hue** (the snippet uses one violet) plus **one** deliberate accent (warm peach), or go mono-hue OKLCH/HSL clay where card, page, and shadow are one hue at different lightness. Rainbow pastel clay where every card is a different candy color is the categorical-color slop — use 2–3 hues that *mean* something.
- **TYPE — Inter/Roboto on everything:** clay's rounded geometry wants a rounded or characterful face. Use a rounded system stack (`ui-rounded`, "SF Pro Rounded", Nunito) or a soft display face, and keep a real weight/size hierarchy — not one weight everywhere.
- **The "toy" tell:** inflated inset blur + neon-pastel fill + a cartoon 3D blob behind centered hero text is the instantly-generated look. Tasteful restraint: dial inset offsets *down* (4–8px, not 14px+), desaturate the pastels one notch, and make the 3D illustration share the UI's exact palette so art and chrome read as one material instead of two stickers.

## Pairs well with
- **3D illustration / Spline & Blender props** — the canonical pairing; rounded clay UI and rounded 3D art share one plastic language. Match the palette exactly so they read as one material (skin + art).
- **Bento grids** — clay cards slot naturally into a bento layout; vary which cells get full clay vs flat to build hierarchy (layout + skin).
- **Squircle / `corner-shape`** — superellipse corners push the softness further where Chromium supports it; `border-radius` is the universal fallback (skin enhancement).
- **Microinteractions / press-squish** — the `:active` shadow-flip "squeeze" is the signature clay behavior; keep it `transform`-based and reduced-motion-guarded (behavior).
- **Rounded display type** — a soft rounded typeface completes the tactile feel where a geometric sans would fight it (skin).

## Current references
- [MDN — box-shadow](https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow) — the inset keyword, multiple comma-separated shadows, and offset/blur/spread/color order that the whole effect depends on.
- [MDN — corner-shape](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/corner-shape) — 2026 property for squircle/superellipse corners; check the support table before relying on it.
- [Smashing Magazine — Beyond border-radius: What The CSS corner-shape Property Unlocks For Everyday UI (Brecht De Ruyte, 2026-03-12)](https://www.smashingmagazine.com/2026/03/beyond-border-radius-css-corner-shape-property-ui/) — how superellipse corners read softer than circular arcs, with progressive-enhancement guidance.
- [LogRocket — Implementing claymorphism with CSS](https://blog.logrocket.com/implementing-claymorphism-css/) — the mono-hue HSL shadow stack and the "card must be lighter than the background" rule.
- [hype4.academy — How to create claymorphism using CSS](https://hype4.academy/articles/coding/how-to-create-claymorphism-using-css) — breaks the stack into outer drop shadow + glowing-edge inset + embossed-bottom inset; has a generator.
- [hype4.academy — Claymorphism in user interfaces](https://hype4.academy/articles/design/claymorphism-in-user-interfaces) — the design-side argument: where the friendly/3D-illustration pairing fits and where it doesn't.
- [WebAIM — Contrast checker](https://webaim.org/resources/contrastchecker/) — verify any pastel-fill/dark-text pairing clears 4.5:1 before shipping it.
- [Frontend Masters — Understanding CSS corner-shape and the superellipse (Amit Sheen, 2025-06-23)](https://frontendmasters.com/blog/understanding-css-corner-shape-and-the-power-of-the-superellipse/) — deeper dive on the squircle math for the enhanced-corner variation.
