# Aurora and gradient mesh

> Soft, blurred fields of overlapping color — layered radial/conic gradients fused into a smoky "northern-lights" wash that drifts slowly behind the UI.

**Bucket:** visual style
**Maturity:** current (cycling toward over-use — the Stripe/Linear/Vercel-era house look)
**Effort:** low (static) | medium (animated + grain)
**Best for:** websites, portfolios, apps (landing/marketing surfaces, auth screens, empty states, hero sections)

## What it is
You stack several large, heavily-feathered color blobs — usually `radial-gradient` or `conic-gradient` layers — over a solid base color so their edges melt into each other. The eye reads it as a single luminous gradient field with no hard stops, like aurora or a soft-focus light leak. "Mesh gradient" is the same idea pushed further: a true 2D grid of color control points (native to Figma and WebGL tools) that CSS fakes well enough with 3–6 stacked radial layers plus blur. The look lives behind content as atmosphere, never as the content itself.

## When to use
- Marketing/landing heroes and section backgrounds that need warmth without imagery to license.
- Auth, onboarding, pricing, and empty states — large empty regions where a flat color feels dead.
- Brand surfaces where you want a recognizable, single-hue "mood" (one dominant brand color biased across the field).
- App shells that want depth behind glass/translucent cards (aurora reads beautifully through `backdrop-filter`).
- Dark-mode products specifically: low-saturation aurora on a near-black base looks expensive and hides banding more forgivingly than on white.

## When NOT to use
- **Directly behind body text.** A drifting, varying field means contrast changes per pixel and per frame; you cannot guarantee 4.5:1. Aurora belongs above the fold or in margins, not under paragraphs. If text must sit on it, put text on an opaque/semi-opaque card, not on the raw gradient.
- Data-dense dashboards, tables, forms — the movement and color competes with information and raises cognitive load.
- Performance-critical or low-end-mobile surfaces where a big `blur()` or animated gradient repaints every frame.
- "Everyone overuses this for the centered SaaS hero": a purple→pink blob behind a centered headline and three feature cards. That specific combination is the #1 AI/template tell (see Anti-slop).
- When the brand is editorial/utilitarian — aurora reads as generic-tech and will fight a typographic or brutalist identity.

## How it works
Aurora is **additive light**: each gradient layer is a colored "spotlight" that fades to `transparent`, painted over a base background-color. Where spotlights overlap, colors mix. The blur and the transparent outer stop are what kill hard edges.

Key building blocks:

- **`radial-gradient(... at X% Y%, color, transparent N%)`** — one blob. The `at` position scatters them; the final `transparent` stop controls falloff. Multiple are comma-separated in one `background` declaration (first listed paints on top).
- **`conic-gradient`** — rotates hues around a point; good for one swirling focal accent, used sparingly.
- **`filter: blur()` / large soft stops** — the feathering. Either blur a pseudo-element holding the gradients, or rely on wide stop spacing so no edge is sharp.
- **Animation** — animate `background-position`, `transform: translate/rotate/scale` on the blob layer, or (with Houdini `@property`) animate the gradient color stops / angle. Keep it *slow* (20–40s loops).
- **Grain/noise** — an `feTurbulence` SVG layer on top dithers the smooth gradient, breaking 8-bit color **banding** (those visible stair-step rings in subtle gradients). This is the single highest-leverage detail separating "designed" from "default."
- **Single-hue bias** — pick one dominant hue and let the others be near-neighbors on the wheel (analogous), so it reads as a brand mood, not a rainbow.

## Working code

### Native CSS — static aurora with grain (complete, runnable)
Layered radial blobs on a dark base, an SVG `feTurbulence` grain overlay to kill banding, and a translucent card proving text stays readable by sitting on an opaque-enough surface (not on the raw gradient).

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root{
    /* single-hue bias: one teal anchor + analogous neighbours, no purple→pink */
    --base:#0b1015;
    --c1: 16 185 129;   /* emerald 500  */
    --c2: 14 165 233;   /* sky 500      */
    --c3: 45 212 191;   /* teal 300     */
  }
  *{box-sizing:border-box} html,body{height:100%}
  body{
    margin:0; font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
    color:#f4f7fa; background:var(--base);
    display:grid; place-items:center; min-height:100vh; position:relative; overflow:hidden;
  }
  /* the aurora field: 3 feathered blobs over the base, biased to one hue family */
  .aurora{
    position:fixed; inset:-20%; z-index:0; filter:blur(60px); opacity:.85;
    background:
      radial-gradient(38% 42% at 22% 28%, rgb(var(--c1)/.55), transparent 70%),
      radial-gradient(45% 50% at 78% 22%, rgb(var(--c2)/.45), transparent 72%),
      radial-gradient(50% 55% at 60% 82%, rgb(var(--c3)/.40), transparent 75%),
      var(--base);
  }
  /* grain overlay: feTurbulence dithers the smooth gradient to defeat banding */
  .grain{
    position:fixed; inset:0; z-index:1; pointer-events:none;
    opacity:.10; mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml,\
<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>\
<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>\
<feColorMatrix type='saturate' values='0'/></filter>\
<rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
    background-size:160px 160px;
  }
  /* content: text lives on an opaque-enough card, NOT on the raw aurora */
  .card{
    position:relative; z-index:2; width:min(92vw,420px);
    padding:2rem 2.25rem; border-radius:18px;
    background:rgb(11 16 21 / .72);                 /* near-opaque dark surface */
    border:1px solid rgb(255 255 255 / .10);
    backdrop-filter:blur(8px);
    box-shadow:0 20px 60px -20px rgb(0 0 0 / .6);
  }
  /* #f4f7fa on #0b1015 (card resolves ~ #0d1217) ≈ 17:1 — passes WCAG AAA */
  h1{margin:0 0 .5rem; font-size:1.6rem; letter-spacing:-.01em}
  p{margin:0; color:#c5cdd6; line-height:1.5}     /* #c5cdd6 on card ≈ 11:1, AAA */
</style></head>
<body>
  <div class="aurora" aria-hidden="true"></div>
  <div class="grain"  aria-hidden="true"></div>
  <main class="card">
    <h1>Aurora, behaving itself</h1>
    <p>The gradient field stays in the background. This copy sits on a near-opaque
       surface so its contrast never depends on what the aurora is doing.</p>
  </main>
</body></html>
```

### Native CSS — slow drift, motion-safe (add to the above)
Animate only `transform` on the blob layer (compositor-only, no per-frame gradient recompute). Gate it behind `prefers-reduced-motion` so it is fully static for users who opt out.

```css
@media (prefers-reduced-motion: no-preference){
  .aurora{
    animation: drift 32s ease-in-out infinite alternate;
    will-change: transform;
  }
  @keyframes drift{
    0%   { transform: translate3d(-3%,-2%,0) scale(1.05) rotate(0deg);   }
    100% { transform: translate3d( 3%, 2%,0) scale(1.12) rotate(8deg);   }
  }
}
/* prefers-reduced-motion: reduce -> no animation rule applies; field is static */
```

### Houdini `@property` — true color animation
Animating a gradient's *color* normally can't tween (custom props are strings). Registering them as `<color>` makes them interpolate. `@property` is now Baseline Newly available across all three major engines — it shipped in Firefox 128 (July 9, 2024), the last engine to land it, joining Chromium and Safari — so this works in every current evergreen browser. Treat only pre-128 Firefox / very old Chromium/Safari as needing the static field above as a fallback.

```css
@property --a1 { syntax:'<color>'; inherits:false; initial-value:#10b981; }
@property --a2 { syntax:'<color>'; inherits:false; initial-value:#0ea5e9; }

.aurora-houdini{
  position:fixed; inset:-20%; filter:blur(60px);
  background:
    radial-gradient(40% 45% at 25% 30%, var(--a1), transparent 70%),
    radial-gradient(45% 50% at 75% 25%, var(--a2), transparent 72%),
    #0b1015;
}
@media (prefers-reduced-motion: no-preference){
  .aurora-houdini{ animation: hue 40s ease-in-out infinite alternate; }
  @keyframes hue{
    50%  { --a1:#14b8a6; --a2:#22d3ee; }
    100% { --a1:#0ea5e9; --a2:#2dd4bf; }
  }
}
```

### React + Tailwind — aurora hero component
Same model, componentized. Grain is an inline SVG data-URL; motion respects the user setting via Tailwind's `motion-safe:` variant.

```jsx
// AuroraHero.jsx — Tailwind v3+. Requires the keyframes below in your config.
export default function AuroraHero({ children }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#0b1015] text-slate-100">
      {/* aurora field — single-hue (teal/emerald) bias, blurred, behind content */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[20%] -z-10 opacity-90 blur-[60px]
                   motion-safe:animate-[drift_32s_ease-in-out_infinite_alternate]"
        style={{
          background: `
            radial-gradient(38% 42% at 22% 28%, rgba(16,185,129,.55), transparent 70%),
            radial-gradient(45% 50% at 78% 22%, rgba(14,165,233,.45), transparent 72%),
            radial-gradient(50% 55% at 60% 82%, rgba(45,212,191,.40), transparent 75%)`,
        }}
      />
      {/* grain overlay to defeat banding */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-10 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "160px 160px",
        }}
      />
      {/* content sits on its own contrast layer, not the raw aurora */}
      <div className="relative mx-auto max-w-2xl px-6 py-28 text-center">{children}</div>
    </section>
  );
}

/* tailwind.config.js — extend.keyframes:
   drift: {
     '0%':   { transform: 'translate3d(-3%,-2%,0) scale(1.05) rotate(0deg)' },
     '100%': { transform: 'translate3d(3%,2%,0) scale(1.12) rotate(8deg)' },
   }
*/
```

## Variations
- **Static vs animated** — knob: motion. Static is fastest and safest; animate `transform` for drift, or `@property` colors for hue-shift. Keep loops 20–40s.
- **Radial-blob vs conic-swirl vs true-mesh** — knob: gradient primitive. Radial = soft clouds (default). Conic = one rotating focal swirl. True mesh = WebGL (e.g. a shader/`mesh-gradient` lib) for organic warping CSS can't do.
- **Light-base vs dark-base** — knob: base color. Dark base hides banding and reads premium; light base bands easily, so grain is mandatory and saturation must drop.
- **Single-hue vs analogous vs duotone** — knob: hue spread. Single/analogous = brand mood (recommended). Wide multi-hue = the rainbow cliché.
- **Sharp vs blurred** — knob: `blur()` radius / stop spacing. More blur = smokier and more forgiving; less blur shows blob shapes (riskier, more banding).
- **Edge-only ("corner glow")** — blobs only in corners/margins behind a clean center; the most restrained, text-friendly variant.

## Accessibility
- **prefers-reduced-motion (mandatory):** all motion is wrapped in `@media (prefers-reduced-motion: no-preference)` / `motion-safe:`, so reduced-motion users get a completely static field. Never animate by default.
- **WCAG 2.2.2 "Pause, Stop, Hide":** any motion that starts automatically, lasts more than five seconds, and runs in parallel with other content needs a mechanism to pause, stop, or hide it. A 32s drifting aurora qualifies. Reduced-motion covers the OS-level opt-out; for full compliance on a moving hero, also offer a visible pause toggle. Don't rely on reduced-motion alone for AA.
- **Contrast — the core rule:** keep aurora out from behind text. Where text overlaps it, place text on an opaque/semi-opaque surface and measure the *worst-case* pixel. In the sample, body text `#c5cdd6` on the resolved card (~`#0d1217`) is ≈ 11:1 and the heading `#f4f7fa` is ≈ 17:1 — both clear AA (4.5:1) and AAA (7:1). Raw aurora behind text would vary frame-to-frame and cannot be guaranteed.
- **No seizure risk:** keep it slow and low-contrast — no flashing >3 times/sec (WCAG 2.3.1). A 32s ease loop is nowhere near that, by design.
- **Touch/pointer:** the field is decorative; mark it `aria-hidden="true"` and `pointer-events:none` so it never intercepts taps or focus. No hover dependency, so touch behaves identically to mouse.
- **Screen readers:** decorative-only — `aria-hidden` on every aurora/grain layer so nothing is announced. Meaning must never live in the gradient.

## Performance
- **`filter: blur()` is expensive.** A large blurred layer repaints a big area; combined with animation it can drop frames on low-end mobile. Mitigate: blur a fixed-size pseudo-element, cap radius (~60px), and animate only `transform` (compositor-only) — never animate `background-position` or the gradient stops directly, which forces full repaints each frame.
- **Promote to its own layer:** `will-change: transform` (or `transform: translateZ(0)`) on the animated blob layer keeps it on the GPU. Use on the one moving element only — overusing `will-change` wastes memory.
- **`@property` color animation repaints the gradient each frame** (it's a paint, not a composite). It looks great but costs more than transform drift; reserve for hero-only surfaces, not app-wide backgrounds.
- **`backdrop-filter` over aurora compounds cost** — each translucent card re-samples the blurred field. Limit the count of glass cards layered on top.
- **Grain is cheap and worth it:** a single small (~160px) tiling `feTurbulence` data-URI adds negligible weight (no extra request) and removes banding that would otherwise look broken on gradients/projectors. Keep `numOctaves` ≤ 2–3.
- **Bundle:** native CSS approach is zero JS. Reach for WebGL mesh libraries only when you genuinely need organic warping — they add a shader runtime and a GPU context for what is otherwise decoration.

## Anti-slop
- **COLOR (the #1 AI tell):** the purple/indigo→pink blob on a white centered hero. Fix: commit to a single brand hue with analogous neighbours (the teal/emerald/sky family in the sample) or a tonal one-hue OKLCH ramp — bias the whole field to one mood instead of a generic violet→magenta rainbow.
- **SURFACE (`_slop-blocklist.md` → Surface: "aurora blob behind centered hero"):** the cliché is a saturated blob glowing directly behind centered headline + three identical icon-title-blurb cards, with the text sitting *on* the gradient. Fix: keep aurora **subtle, single-hue, and never behind body text** — push it to corners/margins or behind an opaque content layer, drop saturation, and add grain so it reads as crafted atmosphere, not a stock generator export.
- **MOTION (`_slop-blocklist.md` → Motion):** the field pulsing fast on a default linear loop. Fix: 20–40s ease-in-out drift on `transform` only, gated behind reduced-motion — slow enough to be felt, not watched.
- **META-RULE:** slop is grabbing every bucket's default at once (violet gradient + Inter + centered 800px column + identical cards). Aurora done tastefully breaks at least the color and surface defaults: one committed hue, off-center placement, grain, and text on its own contrast layer.

## Pairs well with
- **`glassmorphism`** — translucent frosted cards read beautifully over an aurora field (aurora supplies the colorful backdrop that glass needs to justify the blur); keep card text WCAG-compliant on a near-opaque tint.
- **`dark-mode`** — low-saturation aurora on a near-black base is the flagship pairing; the dark base hides banding and makes the glow look expensive.
- **`editorial-typographic`** — a single characterful display headline (Geist, General Sans, Fraunces) over a restrained aurora is the antidote to the generic-blob look; the type carries the page, the aurora is just mood.
- **`text-reveal-on-scroll`** — a focal headline masking up over a slowly drifting field; keep both motions slow and both gated behind reduced-motion so they don't compound.
- **`bento-as-aesthetic`** — aurora as the page background with opaque bento cards floating on top (cards give you the contrast surface the aurora can't).

## Current references
- [CSS-Tricks — Grainy Gradients](https://css-tricks.com/grainy-gradients/) — the canonical `feTurbulence` recipe (type/baseFrequency/numOctaves) for dithering away gradient banding.
- [Frontend Masters Blog — Grainy Gradients](https://frontendmasters.com/blog/grainy-gradients/) — updated walkthrough of layering SVG noise under/over a CSS gradient with brightness/contrast tuning.
- [Codrops — SVG Filter Effects: texture with feTurbulence](https://tympanus.net/codrops/2019/02/19/svg-filter-effects-creating-texture-with-feturbulence/) — deep dive on fractalNoise parameters and what each knob does.
- [ibelick — Creating grainy backgrounds with CSS](https://ibelick.com/blog/create-grainy-backgrounds-with-css) — concise modern data-URI grain overlay pattern using an SVG `feTurbulence` filter on a pseudo-element.
- [web.dev — @property: Next-gen CSS variables now with universal browser support](https://web.dev/blog/at-property-baseline) — confirms `@property` reached Baseline when Firefox 128 shipped it (July 2024); the basis for animatable `<color>` gradient stops.
- [MDN — `@property`](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) — registering custom props as `<color>`/`<angle>` so gradient stops can actually animate; includes the browser-support table.
- [MDN — `radial-gradient()`](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/radial-gradient) — size/position/`at` syntax used for each aurora blob.
- [W3C WAI — C39: prefers-reduced-motion to prevent motion](https://www.w3.org/WAI/WCAG21/Techniques/css/C39) — the WCAG technique behind the motion gate.
- [W3C — Understanding 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html) — the >5s auto-motion control requirement for a looping aurora.
- [web.dev — Animation and motion (accessibility)](https://web.dev/learn/accessibility/motion) — reduced-motion patterns and flashing thresholds.
- [Awwwards — Trendy Gradients in Web Design (Jul 2025)](https://www.awwwards.com/gradients-in-web-design-elements.html) — curated production examples of mesh/aurora gradients, plus CSS gradient generators, as a live reference for the restrained single-hue look.
```
