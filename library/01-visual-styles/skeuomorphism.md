# Skeuomorphism

> Interface elements borrow the look of real-world materials — stitched leather, brushed metal, beveled glass, pressable physical buttons — so a digital control reads as a tangible object you can act on.

**Bucket:** visual style
**Maturity:** cycling-back
**Best for:** apps, dashboards, portfolios, websites (use selectively on the controls that benefit from affordance)
**Effort:** medium

## What it is
Skeuomorphism makes a screen element resemble the physical thing it represents or is built from: a toggle looks like a real switch, a card looks like a raised slab of glass, a knob looks turnable. The user perceives **depth and material** — light falling on a surface, an edge catching a highlight, a button you could press in — and reads affordance from that physicality rather than from a label alone. The 2007–2012 version was heavy and literal (felt, wood, torn paper). The 2024–2026 return is restrained: subtle inner light, soft real-world shadow, gentle gradients, and translucent "spatial" materials (Apple's visionOS glass, then **Liquid Glass** in 2025) that imply substance without faking a leather hide.

## When to use
- **Controls that need obvious affordance**: primary buttons, toggles, sliders, dials, and drag handles read as actionable when they look raised/pressable.
- **Touch-first apps** where a finger expects a physical target — calculators, instruments, music/audio tools, camera controls.
- **A focal hero surface** (one card, one device frame, one product mock) where tactile realism sells quality.
- **Spatial / depth UIs** (visionOS, AR overlays, layered modals) where translucent material communicates which layer sits above which.
- **Nostalgia-aware brands** (retro hardware, audio gear, gaming) where the metaphor *is* the message.

## When NOT to use
- **Across an entire interface.** Everyone overuses this for *every card and button at once* — the whole UI becomes a field of soft beige extrusions (the neumorphism trap). Depth stops meaning anything when everything is raised.
- **Low-contrast monochrome neumorphism for text or essential UI.** The pressed/raised illusion is built from low-contrast shadows on a same-color base; those steps routinely fail WCAG 2.1 (4.5:1 for text, 3:1 for UI component boundaries) and vanish under screen glare, on low-DPI displays, or for users with reduced contrast sensitivity.
- **Dense data / dashboards with many controls** — heavy bevels add visual noise and slow scanning.
- **When the metaphor is dead.** A floppy-disk save icon or a felt-textured panel signals "old," not "familiar," to users who never touched the physical original.
- **Performance-constrained or low-power contexts** if you lean on real-time `backdrop-filter` blur and large soft shadows on many elements.

## How it works
The look is assembled from four light cues that the eye reads as a real surface:

1. **Directional shadow** — a soft drop shadow offset *down* (light from above) lifts an element off the page. Distance + blur encode height.
2. **Inner light / inner shadow** — `box-shadow: inset` adds a top highlight and a bottom shade so the surface looks domed (extruded) or dished (pressed).
3. **Gradient fill** — a subtle top-light to bottom-dark gradient simulates a curved or angled surface catching ambient light.
4. **Edge highlight** — a 1px lighter top border (or `inset 0 1px white`) mimics a beveled lip catching the key light.

Key CSS: `box-shadow` (multiple layers, both outer and `inset`), `linear-gradient`/`radial-gradient`, `border-radius`, `border` for bevel lips, and — for the modern glass variant — `backdrop-filter: blur() saturate()` with a translucent `background`. The active/`:active` state inverts the shadows (raised becomes pressed) to simulate physical depression. The discipline of the modern return: pick *small, real* values (2–24px blur, 1–2px offsets, 4–12% opacity light) instead of the old hyperreal textures and 0.6-opacity black shadows.

## Working code

### Vanilla HTML/CSS — restrained skeuomorphic controls (raised button, pressed input, glass card)
A complete, runnable document. Body text on the glass card sits on an opaque inner plate so contrast stays WCAG-safe; the depth cues are decorative.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Restrained skeuomorphism</title>
<style>
  :root{
    /* committed single brand hue (teal) + one warm accent, real neutral ramp */
    --bg:#e9edf1;            /* page surface the extrusions sit on */
    --ink:#1b2733;           /* body text — 13.0:1 on --bg, passes AAA */
    --muted:#516074;         /* 5.0:1 on --bg, passes AA */
    --teal:#0f766e;          /* accent — 5.3:1 on white, passes AA */
    --teal-lo:#14938a;
  }
  *{box-sizing:border-box}
  body{
    margin:0; min-height:100vh; display:grid; place-items:center; gap:28px;
    font-family: ui-sans-serif, system-ui, "Segoe UI", sans-serif;
    color:var(--ink);
    background:
      radial-gradient(120% 90% at 50% -10%, #f4f7fa, var(--bg) 60%);
    padding:48px;
  }

  /* Raised, pressable button: outer lift + inner top-light + bottom-shade */
  .btn{
    appearance:none; border:0; cursor:pointer;
    font:600 16px/1 inherit; color:#fff; letter-spacing:.2px;
    padding:14px 26px; border-radius:14px;
    background:linear-gradient(180deg, var(--teal-lo), var(--teal));
    box-shadow:
      0 1px 0 rgba(255,255,255,.45) inset,   /* beveled top lip */
      0 -2px 4px rgba(0,0,0,.18) inset,      /* underside shade */
      0 8px 16px -6px rgba(15,118,110,.55),  /* coloured cast shadow */
      0 2px 4px rgba(0,0,0,.12);             /* contact shadow */
    transition: transform .08s ease, box-shadow .08s ease;
  }
  .btn:active{
    transform: translateY(1px);
    box-shadow:
      0 2px 6px rgba(0,0,0,.25) inset,       /* depressed: shadow flips inward */
      0 1px 2px rgba(0,0,0,.18);
  }
  .btn:focus-visible{ outline:3px solid #0b3d39; outline-offset:3px; }

  /* Pressed/inset field — dished into the surface */
  .field{
    width:280px; padding:13px 16px; border:0; border-radius:12px;
    font:400 15px/1.2 inherit; color:var(--ink);
    background:#e4e9ee;
    box-shadow:
      0 2px 4px rgba(0,0,0,.12) inset,
      0 -1px 0 rgba(255,255,255,.7) inset;
  }
  .field::placeholder{ color:var(--muted); }
  .field:focus-visible{ outline:3px solid var(--teal); outline-offset:2px; }

  /* Modern "spatial glass" card — translucent material over imagery,
     but text rides an OPAQUE inner plate so contrast never depends on the blur */
  .glass{
    position:relative; width:320px; border-radius:20px; overflow:hidden;
    background:
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%230f766e'/><stop offset='1' stop-color='%231e3a8a'/></linearGradient></defs><rect width='320' height='180' fill='url(%23g)'/></svg>")
      center/cover;
    box-shadow: 0 16px 40px -16px rgba(20,30,45,.5);
  }
  .glass__panel{
    margin:90px 14px 14px; padding:16px 18px; border-radius:14px;
    background:rgba(255,255,255,.92);   /* opaque enough for AA body text */
    backdrop-filter: blur(14px) saturate(140%);
    -webkit-backdrop-filter: blur(14px) saturate(140%);
    box-shadow: 0 1px 0 rgba(255,255,255,.6) inset;
  }
  .glass__panel h3{ margin:0 0 4px; font-size:17px; }
  .glass__panel p{ margin:0; color:var(--muted); font-size:14px; line-height:1.45; }

  @media (prefers-reduced-motion: reduce){
    .btn{ transition:none; }
  }
</style></head>
<body>
  <button class="btn">Add to bag</button>

  <input class="field" type="text" placeholder="Search your library">

  <div class="glass">
    <div class="glass__panel">
      <h3>Liquid Glass card</h3>
      <p>Translucency implies a layer above the wallpaper; the text plate keeps body copy at AA contrast regardless of what scrolls behind it.</p>
    </div>
  </div>
</body></html>
```

### React + Tailwind — a reusable raised/pressed button
Tailwind has no built-in inset-bevel utility, so the multi-layer shadow goes through an arbitrary value. This keeps the `:active` depression and a visible focus ring.

```jsx
// TactileButton.jsx
export function TactileButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={[
        "select-none rounded-[14px] px-6 py-3.5",
        "font-semibold text-white tracking-[.2px]",
        "bg-gradient-to-b from-teal-500 to-teal-700",
        // bevel top-lip + underside shade + coloured cast + contact shadow
        "shadow-[inset_0_1px_0_rgba(255,255,255,.45),inset_0_-2px_4px_rgba(0,0,0,.18),0_8px_16px_-6px_rgba(15,118,110,.55),0_2px_4px_rgba(0,0,0,.12)]",
        "transition-transform transition-shadow duration-100 ease-out",
        // pressed: flip the shadow inward, drop 1px
        "active:translate-y-px active:shadow-[inset_0_2px_6px_rgba(0,0,0,.25),0_1px_2px_rgba(0,0,0,.18)]",
        "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-teal-900",
        "motion-reduce:transition-none",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
```

## Variations
- **Restrained / soft-UI (current default):** small offsets, low-opacity light, one or two depth steps. The knob is *amount of shadow* — keep blur ≤ 24px and light ≤ ~12% opacity.
- **Neumorphism:** element and background share one color; dual shadows (light top-left, dark bottom-right) extrude or inset it. Knob: shadow *symmetry* + the monochrome base. Accessibility-fragile — never put essential text or sole affordance in the shadow alone.
- **Spatial / glass material (visionOS, Liquid Glass):** translucent, blurred, light-bending surfaces that imply a floating physical pane. Knob: `backdrop-filter` blur + translucency + edge specular highlight.
- **Hyperreal / nostalgic (the old 2010 look):** literal textures (leather, wood, brushed metal), strong bevels, drop shadows. Knob: texture realism. Use only when the metaphor is the brand.
- **Hybrid flat-skeu:** flat layout with skeuomorphic *only* on the actionable controls — the modern sweet spot.

## Accessibility
- **prefers-reduced-motion:** the press/`:active` transition and any hover lift must be wrapped so motion is removed; the snippets above add `@media (prefers-reduced-motion: reduce)` / `motion-reduce:transition-none`. The pressed *state* can still change instantly — it's the animated tween you suppress.
- **Contrast (the make-or-break):** never encode the only affordance in low-contrast shadow. Boundaries of interactive components need **3:1** against adjacent colors; text needs **4.5:1** (3:1 for large). The glass card above keeps body text on a `rgba(255,255,255,.92)` plate so it clears AA no matter what's behind it — don't put readable text directly on a translucent blur whose contrast you can't guarantee.
- **Focus / keyboard:** depth is invisible to keyboard users on its own — every control keeps a real `:focus-visible` ring (3px, offset), not just a shadow change. Don't rely on the bevel as the focus indicator.
- **Touch/pointer fallback:** `:active` depression covers touch; ensure targets are ≥44×44px. Don't gate any state purely on `:hover` (no hover on touch).
- **Screen readers:** material/depth is purely visual and carries no semantics — use real `<button>`/`<input>` elements and ARIA roles. A "pressed" toggle must expose `aria-pressed`; its visual depression is decoration, not the announced state.
- **Forced-colors / high-contrast mode:** shadows are dropped in Windows high-contrast mode, so the affordance must survive without them — that's why semantic elements + borders/focus rings matter.

## Performance
- **Soft shadows repaint.** Large-blur `box-shadow` on many elements (and on hover/active changes) forces repaints; animate `transform` (and only toggle pre-baked shadow sets) rather than animating shadow blur each frame.
- **`backdrop-filter` is the expensive one.** Each blurred glass surface is a GPU compositing pass; a screen full of them tanks scroll/animation FPS on mobile and older GPUs. Limit to one or a few focal surfaces, and always pair with `-webkit-backdrop-filter`.
- **Avoid stacking many translucent layers** — overdraw multiplies fill cost.
- **GPU layers:** promote only the elements that actually animate (`will-change: transform`, sparingly); over-promoting blurred cards wastes memory.
- **Bundle cost ≈ zero** — this is pure CSS; no library needed. Inline-SVG/gradient fills beat large texture PNGs from the old era.

## Anti-slop
- **SURFACE cliché — soft drop shadow on everything / neumorphism on every card** (see `_slop-blocklist.md` → SURFACE: "soft drop shadow on everything"). The tell is a whole page of identical low-contrast beige extrusions where depth means nothing and the toggles fail contrast. **Fix:** a *systematic elevation scale* (one resting level, one raised, one pressed) applied only to controls that need affordance, with real WCAG-passing boundaries — depth as a signal, not a wallpaper.
- **SURFACE cliché — glassmorphism on every card, low-contrast text on blur** (see `_slop-blocklist.md` → SURFACE: "glassmorphism on every card"). **Fix:** one layered translucent moment over real imagery, with body text on an opaque plate (as in the card above) so it stays AA — not the entire UI behind frosted glass.
- **COLOR cliché — the purple→pink gradient on white** as the "modern" fill (see `_slop-blocklist.md` → COLOR, the #1 AI tell). **Fix:** a committed single brand hue with one tonal light-to-dark gradient on the raised surface (the teal here), which is also what actually reads as a curved physical material.
- **TYPE:** don't pair tactile controls with default Inter/Roboto at one weight — a deliberate weight contrast (600 labels vs 400 body) is part of what sells the hardware feel.

## Pairs well with
- **`glassmorphism`** — the translucent-material sibling; skeuomorphic depth + a single glass surface is the modern spatial look (keep text on an opaque plate).
- **`neumorphism`** — same shadow toolkit; borrow its soft extrusion only for the controls, never the whole canvas.
- **`bento-as-aesthetic`** — raised tactile cards in a bento grid give a product-shelf feel; vary elevation so it's not a flat field.
- **`dark-mode`** — invert the light model (subtle top highlight, darker recessed shadow) for convincing depth on dark surfaces.
- **`microinteractions` / press feedback** — the `:active` depression *is* a microinteraction; keep it physical and fast (~80ms).

## Current references
- [Meet Liquid Glass — WWDC25 session 219 (Apple)](https://developer.apple.com/videos/play/wwdc2025/219/) — Apple's 2025 spatial material: lensing, adaptivity, Regular vs Clear variants; the canonical modern-skeuomorphism reference.
- [Human Interface Guidelines: Materials (Apple)](https://developer.apple.com/design/human-interface-guidelines/materials) — how Apple frames translucency/vibrancy as functional layering, not decoration.
- [Adopting Liquid Glass — Apple Developer Documentation](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass) — implementation guidance for the new material across platforms (linked from the WWDC25 session).
- [How Apple Quietly Brought Skeuomorphism Back to Life — Webdesigner Depot (2025)](https://webdesignerdepot.com/how-apple-quietly-brought-skeuomorphism-back-to-life/) — Noah Davis, June 2025; the critical case that "pretty glass turns to mush" over busy content — read it for the affordance-vs-readability tension.
- [Skeuomorphism: an unexpected comeback in 2025 — Kryzalid](https://kryzalid.net/en/web-marketing-blog/skeuomorphism-an-unexpected-comeback-in-2025/) — designer-side take on when texture/realism genuinely aids affordance vs nostalgia.
- [MDN — backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) — the property behind glass material, with the support table and the `-webkit-` note.
- [MDN — box-shadow (incl. inset)](https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow) — multi-layer and inner-shadow syntax that builds every bevel/extrusion here.
