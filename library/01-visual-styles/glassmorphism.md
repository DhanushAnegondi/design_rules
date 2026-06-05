# Glassmorphism

> A translucent, frosted-glass surface that blurs and lightly tints whatever sits behind it, separated from its background only by a hairline highlight border.

**Bucket:** visual style
**Maturity:** cycling-back
**Effort:** low
**Best for:** websites, portfolios, apps, dashboards (over real imagery/color), carousels (single floating control surface)

## What it is
Glassmorphism is a surface treatment, not a layout. An element is given a semi-transparent
background plus `backdrop-filter: blur() saturate()`, so the content behind it is frosted and
its colors bleed faintly through. A 1px light-tinted border (and often a soft inner highlight)
catches an imaginary edge of glass. The user perceives a pane of frosted glass floating above a
colorful or photographic background — depth without an opaque card. It only reads as "glass"
when there is something worth blurring underneath: a gradient, a photo, an aurora, other UI.

## When to use
- A floating control surface over rich content: a navbar/dock over a hero image, a media-player
  bar, a filter panel over a map, a toast over a colorful dashboard.
- Modals, sheets, and command palettes where you want the underlying context to stay faintly
  visible instead of a flat dim scrim.
- OS-flavored product UI (macOS/iOS/Windows 11 Fluent) where frosted chrome is the expected idiom.
- One focal "hero" moment — a single glass card over a gradient mesh — used sparingly for polish.

## When NOT to use
- Over a plain flat background. With nothing behind it to blur, glass collapses into a muddy
  low-contrast box; use a solid surface with a real elevation shadow instead.
- As the skin for *every* card on a page. This is the #1 abuse: a grid of identical low-contrast
  glass cards where body text rides directly on a busy photo and fails contrast. Pick one glass
  moment; render the rest as opaque surfaces.
- Behind small body text or long-form reading. Translucency over varying backdrops makes contrast
  unpredictable and unstable as the user scrolls.
- Dense dashboards/tables that paint and repaint constantly — `backdrop-filter` re-rasterizes on
  every change underneath it (see Performance).
- When users have requested reduced transparency at the OS level (see Accessibility).

## How it works
`backdrop-filter` applies a graphics filter (blur, saturate, brightness, contrast) to the pixels
*behind* the element's painting area, not to the element's own content. For the effect to be
visible the element's own background must be transparent or partially transparent — a fully
opaque background hides the blurred backdrop entirely. The recipe is four cooperating parts:

1. **Translucent background** — `rgb(... / 0.1–0.6)`. Lower alpha = more see-through, riskier
   contrast; higher alpha = closer to a normal frosted panel.
2. **`backdrop-filter: blur(Npx) saturate(180%)`** — the blur frosts the backdrop; the saturate
   boost compensates for the desaturation blur causes, keeping the glass lively. Apple's frosted
   chrome leans on exactly this saturate trick.
3. **Hairline light border** — `1px solid rgb(255 255 255 / 0.18–0.4)`, the catch-light edge that
   makes it read as a physical pane.
4. **Soft shadow + optional inset highlight** — an outer drop shadow for elevation and an
   `inset` box-shadow top-edge to fake a glossy lip.

Key properties: `backdrop-filter` (and the mandatory `-webkit-backdrop-filter` for Safari/iOS),
`background` with an alpha channel, `border`, `box-shadow`, `border-radius`. Global support for
`backdrop-filter` is ~95% (caniuse, "backdrop-filter") once the `-webkit-` prefix is included;
Safari/iOS still require that prefix. Always gate the look behind an `@supports` query so
non-supporting browsers fall back to an opaque surface rather than a transparent unreadable one.

## Working code

### Vanilla HTML/CSS — one glass card over a real gradient (WCAG-safe text)
This is a complete, self-contained document. Text contrast is guaranteed by construction: the
heading and body are white (`#ffffff`) on a glass tint built over a *dark* base, and a darkening
inner scrim (`--glass-scrim`) keeps the composited text background no lighter than `#1f1d36`.
White on `#1f1d36` measures roughly a **15:1** contrast ratio (relative luminance of `#1f1d36`
≈ 0.0153, giving `(1.0 + 0.05) / (0.0153 + 0.05) ≈ 16.3:1` for the pure tint and staying near
~15:1 once the translucent gradient bleeds through) — comfortably past WCAG AA (4.5:1) and
AAA (7:1) for normal text.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Glassmorphism — single focal card</title>
<style>
  :root {
    --glass-bg: rgb(31 29 54 / 0.55);     /* translucent tint over a dark base */
    --glass-scrim: rgb(15 14 30 / 0.35);  /* extra darkening so text stays ~15:1 */
    --glass-border: rgb(255 255 255 / 0.22);
    --glass-radius: 20px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100svh;
    display: grid; place-items: center;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    /* a real backdrop worth blurring: layered radial glows over a dark gradient */
    background:
      radial-gradient(120% 120% at 15% 10%, #ff7a59 0%, transparent 45%),
      radial-gradient(120% 120% at 90% 90%, #2dd4bf 0%, transparent 50%),
      linear-gradient(135deg, #1b1438 0%, #0c1024 100%);
    color: #ffffff;
  }
  .glass {
    width: min(92vw, 360px);
    padding: 28px 26px;
    border-radius: var(--glass-radius);
    /* stack the scrim under the tint so the composited text bg stays dark */
    background-image:
      linear-gradient(var(--glass-scrim), var(--glass-scrim)),
      linear-gradient(var(--glass-bg), var(--glass-bg));
    border: 1px solid var(--glass-border);
    box-shadow:
      0 12px 40px rgb(0 0 0 / 0.45),          /* elevation */
      inset 0 1px 0 rgb(255 255 255 / 0.25);  /* glossy top lip */
  }
  /* Progressive enhancement: only frost where supported */
  @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    .glass {
      -webkit-backdrop-filter: blur(14px) saturate(180%);
              backdrop-filter: blur(14px) saturate(180%);
      /* lower the tint alpha now that real blur does the frosting */
      --glass-bg: rgb(31 29 54 / 0.42);
    }
  }
  /* OS "reduce transparency" -> drop to an opaque, higher-contrast surface */
  @media (prefers-reduced-transparency: reduce) {
    .glass {
      -webkit-backdrop-filter: none; backdrop-filter: none;
      background: #1f1d36; border-color: rgb(255 255 255 / 0.14);
    }
  }
  .glass h2 { margin: 0 0 8px; font-size: 1.35rem; font-weight: 650; letter-spacing: -0.01em; }
  .glass p  { margin: 0; font-size: 0.95rem; line-height: 1.5; color: #ffffff; }
  .glass a  {
    display: inline-block; margin-top: 18px; padding: 9px 16px; border-radius: 10px;
    background: #ffffff; color: #1b1438; text-decoration: none; font-weight: 600; font-size: 0.9rem;
  }
  .glass a:focus-visible { outline: 3px solid #ffd166; outline-offset: 3px; }
</style></head>
<body>
  <section class="glass">
    <h2>Cabin 14 is ready</h2>
    <p>Check-in opens at 3pm. Your door code arrives by text an hour before arrival, and the
       heated floor is already on.</p>
    <a href="#">View directions</a>
  </section>
</body></html>
```

### React + Tailwind — reusable GlassPanel (the realistic production choice)
Tailwind ships `backdrop-blur-*` and the `supports-[...]` variant, but it does **not** emit the
`-webkit-backdrop-filter` prefix and has no built-in `prefers-reduced-transparency` variant as of
Tailwind v4 — handle both in a tiny plugin or arbitrary CSS, as below. The component encodes the
same contrast guarantee: white text over a dark translucent tint plus a darkening scrim.

```tsx
// GlassPanel.tsx — Tailwind v4. Wrap in a colorful/photo backdrop for the effect to show.
import { type ReactNode } from "react";

export function GlassPanel({ children }: { children: ReactNode }) {
  return (
    <section
      className={[
        "relative isolate rounded-2xl p-7 text-white",
        // translucent tint over a dark base + a darkening scrim layer:
        "bg-[linear-gradient(rgb(15_14_30/0.35),rgb(15_14_30/0.35)),linear-gradient(rgb(31_29_54/0.55),rgb(31_29_54/0.55))]",
        "border border-white/20",
        "shadow-[0_12px_40px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.25)]",
        // only frost where supported; the -webkit- prefix is added via the style prop below
        "supports-[backdrop-filter:blur(1px)]:backdrop-blur-[14px]",
        "supports-[backdrop-filter:blur(1px)]:backdrop-saturate-150",
        // reduce-transparency: opaque, higher-contrast fallback
        "[@media(prefers-reduced-transparency:reduce)]:bg-[#1f1d36]",
        "[@media(prefers-reduced-transparency:reduce)]:backdrop-filter-none",
      ].join(" ")}
      // Safari/iOS need the -webkit- prefix, which Tailwind will not emit:
      style={{ WebkitBackdropFilter: "blur(14px) saturate(150%)" }}
    >
      {children}
    </section>
  );
}

// Usage:
// <div className="min-h-svh grid place-items-center
//   bg-[radial-gradient(120%_120%_at_15%_10%,#ff7a59_0%,transparent_45%),linear-gradient(135deg,#1b1438,#0c1024)]">
//   <GlassPanel>
//     <h2 className="mb-2 text-xl font-semibold tracking-tight">Cabin 14 is ready</h2>
//     <p className="text-[0.95rem] leading-relaxed">Check-in opens at 3pm…</p>
//   </GlassPanel>
// </div>
```

## Variations
- **Frost intensity** — the knob is `blur()` radius (4px = barely frosted/legible-through, 14px =
  classic, 30px+ = nearly opaque and expensive).
- **Tint & vibrancy** — alpha of the background and `saturate()`/`brightness()` amount. High
  saturate = Apple "vibrancy"; neutral = colder industrial glass.
- **Light vs dark glass** — white-tinted translucency over imagery vs. dark `rgb(0 0 0 / 0.4)`
  smoked glass; dark glass is far more reliable for white-text contrast.
- **Edge treatment** — flat hairline border vs. a gradient/`mask` "lit edge" (Josh Comeau's
  technique) that brightens one side to fake a real bevel.
- **Layered depth** — stacking two glass panes at different blur amounts to fake 3D thickness.
- **Liquid glass (2025)** — Apple's evolution adds specular highlights and refraction at the
  edges; approximated on web with an SVG `feDisplacementMap` distortion layer, much heavier.

## Accessibility
- **prefers-reduced-motion**: pure glass is static, so there is nothing to gate. But if you
  animate the pane (a sliding/scaling sheet, a moving dock), wrap that motion in
  `@media (prefers-reduced-motion: reduce)` and drop to an instant state change — and never
  *transition* `backdrop-filter` itself, which is both a motion and a performance problem.
- **prefers-reduced-transparency**: honor it. macOS/iOS/Windows expose a "Reduce transparency"
  setting; `@media (prefers-reduced-transparency: reduce)` lets you swap glass for an opaque,
  higher-contrast surface. Support is partial — Chrome/Edge 119+ honor it; **Firefox does not
  enable it by default** (it sits behind the `layout.css.prefers-reduced-transparency.enabled`
  flag) and **Safari does not support it** — so never *rely* on it for legibility; the resting
  glass must already pass contrast on its own.
- **Contrast — the core trap**: translucent text backgrounds are unpredictable, especially over
  photos/gradients that shift as the user scrolls. Guarantee WCAG AA (4.5:1 normal, 3:1 large) by
  construction: use dark/smoked glass with light text, raise the tint alpha, or sit text on a
  slightly more opaque inner panel — as the code above does (white on ~15:1). Test against the
  *lightest* point the backdrop can reach behind the text, not the average.
- **Focus & keyboard**: interactive glass needs a `:focus-visible` ring that survives the busy
  backdrop — a solid high-contrast outline with `outline-offset`, not a faint translucent glow.
- **Touch/pointer**: glass controls (docks, toolbars) must keep ≥ 44×44px hit targets; frost can
  visually shrink perceived affordance, so don't let the translucency tempt you into tiny buttons.
- **Screen readers**: purely visual; no semantic impact. When glass is a modal scrim, still manage
  the focus trap and `aria-hidden`/`inert` on the background behind it, as with any overlay.

## Performance
- **`backdrop-filter` is expensive.** It forces the element onto its own compositing layer and
  re-rasterizes the blurred region whenever pixels behind it change — scrolling, animation, or any
  repaint under the glass re-runs the blur. A page full of glass cards multiplies this cost and
  tanks frame rate on low-end GPUs.
- **Blur radius cost is non-linear.** Large radii (30px+) and large glass areas are dramatically
  more expensive than small ones; keep blur in the ~8–16px range and the glass area modest.
- **Animating the backdrop or its blur is the worst case** — avoid transitioning `backdrop-filter`
  or sliding a large glass surface over changing content every frame. Animate `transform`/`opacity`
  of the pane instead, which the GPU handles cheaply.
- **Layer management**: glass already promotes a compositing layer, so don't also pile on
  `will-change` everywhere — it inflates GPU memory. One or two glass surfaces, not twenty.
- **Bundle cost**: zero for the vanilla recipe (pure CSS). The SVG-displacement "liquid glass"
  approach adds real paint/filter cost and should be reserved for one hero element.

## Anti-slop
Cliché (see `_slop-blocklist.md` → SURFACE): **"glassmorphism on every card, low-contrast"** —
a grid of identical frosted cards with body text floating directly on a busy photo, each one
failing contrast, usually stacked with the SURFACE-bucket **purple-to-pink gradient on white** and
a soft drop shadow on everything. That combination is a textbook AI tell. The tasteful alternative
the blocklist prescribes: **one layered translucent moment over real imagery, with WCAG-compliant
text.** Pick a single glass surface (the nav, one hero card, the modal), commit to a real backdrop
worth blurring, build the contrast guarantee in (dark/smoked glass or an opaque inner panel,
proven ≥ 4.5:1), and render every other surface as an honest opaque card with systematic
elevation. One glass moment reads as craft; glass-everywhere reads as generated.

## Pairs well with
- **Aurora / gradient-mesh background** — supplies the colorful, soft backdrop that makes the
  frost legible; keep the blobs subtle and *not* directly behind body text (its own slop rule).
- **Dark mode** — smoked/dark glass over a dark gradient is the most contrast-reliable pairing for
  white text.
- **Bento layout** — use glass for the single hero cell, opaque surfaces for the rest, so the
  glass is a focal accent rather than the wallpaper.
- **Editorial/typographic styling** — a characterful display face on a glass hero card lifts it
  above the default Inter-on-glass look.
- **Elevation/shadow system** — glass needs a real drop shadow to float; treat it as the top tier
  of a documented elevation scale rather than an ad-hoc shadow.

## Current references
- [MDN — backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) — canonical spec, syntax, and the explicit "background must be transparent to see the effect" note.
- [Can I use — backdrop-filter](https://caniuse.com/css-backdrop-filter) — live global support (~95.22% at time of writing) and the Safari/iOS `-webkit-` prefix requirement.
- [Josh W. Comeau — Next-level frosted glass with backdrop-filter](https://www.joshwcomeau.com/css/backdrop-filter/) — the `mask`/gradient lit-edge trick and layering panes for real glass depth.
- [Chrome for Developers — Updates in hardware-accelerated animation capabilities](https://developer.chrome.com/blog/hardware-accelerated-animations) — what gets GPU-composited and why animating filters/large surfaces is costly, which frames backdrop-filter's compositing cost.
- [MDN — prefers-reduced-transparency](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency) — the media query for honoring OS reduce-transparency, with the (limited) browser-support table.
- [Can I use — prefers-reduced-transparency](https://caniuse.com/wf-prefers-reduced-transparency) — confirms Chrome/Edge 119+ support and the lack of default Firefox/Safari support (~71% global).
