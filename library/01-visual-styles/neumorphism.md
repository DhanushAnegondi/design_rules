# Neumorphism (soft UI)

> Controls that look extruded from — or pressed into — a single flat surface, faked entirely with one light and one dark box-shadow on a background of the exact same color.

**Bucket:** visual style
**Maturity:** fading / cycling-back (peaked 2020, returns as an accent in 2024-2026 "soft UI 2.0")
**Effort:** low (to make it look right) / medium (to make it accessible)
**Best for:** apps, dashboards — and only for a small set of controls (toggles, sliders, single-accent panels), never a whole UI

## What it is
Neumorphism ("new + skeuomorphism") renders a button or card in the *same* color as the page behind it, then implies depth purely through lighting: a light highlight on the top-left edge and a dark shadow on the bottom-right edge make the shape read as gently raised, like a button pushed up through a sheet of soft plastic. Invert the two shadows (`inset`) and the same shape reads as pressed *into* the surface. There is no fill contrast and usually no border — the entire affordance lives in two soft shadows. The user perceives a tactile, monochrome, "frosted clay" object that seems to belong to the surface rather than sit on top of it.

## When to use
- A single, self-contained control where the tactile metaphor *is* the point: an audio-app play/pause, a thermostat dial, a toggle switch, a stepper.
- A "pressed vs raised" state pair where the inset/outset flip communicates on/off more clearly than color alone (paired with a real accent and a text label, not as the *only* signal).
- One feature panel or hero card on an otherwise high-contrast page — a deliberate textural moment, not the page's chrome.
- Dark-mode-first product surfaces, where a slightly-lighter raised tile over a dark base is easier to perceive than the same trick in light mode.

## When NOT to use
- **As a whole interface.** This is the cliché (see Anti-slop): every card, input, and button rendered in identical light-grey-on-white with soft shadows. Edges hover around 1.3:1–1.7:1 contrast and fail WCAG 1.4.11 by a wide margin — users can't tell what's clickable.
- **Form inputs and primary CTAs.** A text field with no fill contrast and no border has no perceptible boundary; a pressed-in CTA looks disabled. Affordance collapses.
- **Text on the surface.** The shadows do nothing for text legibility, and the low-saturation grey palette tempts designers toward low-contrast body copy.
- **Light backgrounds for anyone with low vision or on a glare-prone screen.** The highlight (toward white) and base differ by ~1.3:1; outdoors it disappears entirely.
- **High-density data UIs** (tables, lists): the soft shadows blur boundaries exactly where you need crisp separation, and the per-element shadow cost adds up.

## How it works
The mechanism is two `box-shadow` layers sharing one blur radius but opposite offsets, drawn on an element whose `background` matches its parent's `background`:

- **Raised (outset):** `box-shadow: <dx> <dy> <blur> <dark>, -<dx> -<dy> <blur> <light>;` — dark shadow falls toward the implied light source's far side (bottom-right by convention), light highlight toward the source (top-left).
- **Pressed (inset):** prefix both shadows with `inset` and the surface caves in.
- The light/dark pair must be derived from the *base* color: dark = base darkened ~12–18%, light = base lightened toward white. Off-color shadows (a blue base with grey shadows) break the illusion.
- A large `border-radius` sells the "soft plastic" read; sharp corners look like a flat panel with a drop shadow.
- The base must equal the page background. The moment the tile color differs from its parent, the effect reads as an ordinary elevated card, not an extrusion.

Because the only depth cue is shadow, the **edge contrast** (shadow color vs base color) is what the eye uses to find the control — and that contrast is exactly what WCAG 1.4.11 Non-text Contrast requires to be ≥ 3:1. The default palette never reaches it. The accessible fix is to *add a real signal* (a 3:1 border, a real accent, a text label) without removing the shadow look.

## Working code

### Vanilla HTML/CSS — accessible neumorphic toggle + raised/pressed buttons (light + dark)
Self-contained; open in a browser. Every text/accent/border value is annotated with its measured WCAG ratio against the base, computed with the sRGB relative-luminance formula. The soft shadows are decoration; the affordance is carried by a 3.60:1 border, an 11.66:1 label, a 5.29:1 accent, and a focus ring — so it survives the "shadows are invisible to me" case.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Accessible neumorphism</title>
<style>
  :root {
    /* Light theme — base MUST equal page background */
    --base:    #e0e5ec;
    --shadow:  #a3b1c6;   /* dark edge  — base vs shadow = 1.72:1 (decorative only) */
    --light:   #ffffff;   /* light edge — base vs light  = 1.27:1 (decorative only) */
    --ink:     #1f2933;   /* body text  — on base = 11.66:1  -> passes AAA            */
    --muted:   #52606d;   /* secondary  — on base =  5.10:1  -> passes AA             */
    --edge:    #6b7785;   /* affordance border — on base = 3.60:1 -> passes 1.4.11    */
    --accent:  #1d4ed8;   /* on/CTA hue — on base =  5.29:1  -> passes AA + 1.4.11    */
    --accent-ink: #ffffff;
    --r: 18px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --base:   #2a2d32;
      --shadow: #16181b;   /* darker edge */
      --light:  #3a3e44;   /* lighter edge */
      --ink:    #e8eaed;   /* on dark base = 11.46:1 -> AAA */
      --muted:  #a9b0b8;
      --edge:   #828891;   /* on dark base =  3.87:1 -> passes 1.4.11 */
      --accent: #7aa2ff;   /* on dark base =  5.55:1 -> passes AA + 1.4.11 */
      --accent-ink: #10131a;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    gap: 1.5rem; padding: 2rem;
    background: var(--base); color: var(--ink);
    font-family: ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  }
  .panel {
    display: grid; gap: 1.25rem; padding: 2rem; border-radius: 28px;
    background: var(--base);
    box-shadow: 9px 9px 18px var(--shadow), -9px -9px 18px var(--light);
  }
  h1 { font-size: 1.05rem; margin: 0; letter-spacing: .01em; }
  p  { margin: 0; color: var(--muted); font-size: .9rem; }

  /* Raised button — shadow look + a real 3.6:1 border so it's perceivable
     even when the shadow isn't (low vision, glare, forced-colors). */
  .btn {
    font: 600 1rem/1 inherit; color: var(--ink);
    padding: .85rem 1.4rem; border-radius: var(--r);
    background: var(--base);
    border: 1px solid var(--edge);
    box-shadow: 6px 6px 12px var(--shadow), -6px -6px 12px var(--light);
    cursor: pointer; transition: box-shadow .12s ease, transform .12s ease;
  }
  .btn:hover { transform: translateY(-1px); }
  .btn:active,
  .btn[aria-pressed="true"] {            /* pressed-in state via inset flip */
    box-shadow: inset 5px 5px 10px var(--shadow), inset -5px -5px 10px var(--light);
    transform: none;
  }
  .btn.primary {                          /* CTA carries real fill contrast */
    background: var(--accent); color: var(--accent-ink); border-color: transparent;
    box-shadow: 6px 6px 12px var(--shadow), -6px -6px 12px var(--light);
  }

  /* Visible focus ring — never rely on the shadow to show focus */
  .btn:focus-visible, .switch:focus-visible {
    outline: 3px solid var(--accent);     /* accent vs base = 5.29:1 (>=3:1) */
    outline-offset: 3px;
  }

  /* Toggle: the one place neumorphism genuinely shines.
     Track is pressed-in (inset); knob is raised (outset). */
  .switch {
    appearance: none; -webkit-appearance: none; margin: 0;
    width: 64px; height: 36px; border-radius: 999px; cursor: pointer;
    background: var(--base); border: 1px solid var(--edge);
    box-shadow: inset 4px 4px 8px var(--shadow), inset -4px -4px 8px var(--light);
    position: relative; transition: background .15s ease;
  }
  .switch::after {
    content: ""; position: absolute; top: 4px; left: 4px;
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--base);
    box-shadow: 3px 3px 6px var(--shadow), -3px -3px 6px var(--light);
    transition: transform .18s cubic-bezier(.2,.8,.2,1), background .15s ease;
  }
  .switch:checked { background: var(--accent); }
  .switch:checked::after { transform: translateX(28px); background: #fff; }
  @media (prefers-reduced-motion: reduce) {
    .btn, .switch, .switch::after { transition: none; }
    .btn:hover { transform: none; }
  }
  /* Windows High Contrast / forced-colors: shadows are dropped by the OS,
     so the border + outline carry everything. */
  @media (forced-colors: active) {
    .btn, .switch { border: 1px solid ButtonText; box-shadow: none; }
  }
  .row { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
  label.t { display: flex; align-items: center; gap: .6rem; font-weight: 600; }
</style></head>
<body>
  <section class="panel" aria-labelledby="t">
    <div>
      <h1 id="t">Playback</h1>
      <p>Soft UI used sparingly: the toggle and the inset/outset states,
         not the whole page.</p>
    </div>
    <div class="row">
      <button class="btn" type="button" aria-pressed="false"
              onclick="this.setAttribute('aria-pressed', this.getAttribute('aria-pressed')==='true'?'false':'true')">
        Shuffle
      </button>
      <button class="btn primary" type="button">Play</button>
      <label class="t">
        <input class="switch" type="checkbox" role="switch" checked>
        Crossfade
      </label>
    </div>
  </section>
</body></html>
```

Key accessibility moves baked into the construction (not just labelled): the toggle is a real `<input type="checkbox" role="switch">` so it's keyboard- and screen-reader-operable; the pressed button uses `aria-pressed` so the inset visual maps to a programmatic state; every interactive element has both a ≥ 3:1 border *and* a focus ring whose accent clears 5.29:1; `forced-colors` strips the shadows and falls back to system borders.

### React + Tailwind — neumorphic toggle as a controlled component
Tailwind has no native neumorphism utilities, so the dual shadow goes through an arbitrary `shadow-[...]` value and a CSS variable theme. Affordance still rides on a real ring/border, not the shadow.

```jsx
// tailwind.config: none required — uses arbitrary values + CSS vars below.
// Put these vars in your global stylesheet (light values shown):
//   :root { --nm-base:#e0e5ec; --nm-dark:#a3b1c6; --nm-light:#ffffff;
//           --nm-edge:#6b7785; --nm-accent:#1d4ed8; }
import { useState } from "react";

export function NeumorphicSwitch({ label, defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <label className="inline-flex items-center gap-3 font-semibold text-[#1f2933]">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn((v) => !v)}
        className={[
          "relative h-9 w-16 rounded-full border transition-colors duration-150",
          "border-[var(--nm-edge)]",                 // 3.60:1 affordance border
          "shadow-[inset_4px_4px_8px_var(--nm-dark),inset_-4px_-4px_8px_var(--nm-light)]",
          on ? "bg-[var(--nm-accent)]" : "bg-[var(--nm-base)]",
          "focus-visible:outline focus-visible:outline-[3px]",
          "focus-visible:outline-offset-[3px] focus-visible:outline-[var(--nm-accent)]",
          "motion-reduce:transition-none",
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className={[
            "absolute top-1 left-1 h-7 w-7 rounded-full",
            "shadow-[3px_3px_6px_var(--nm-dark),-3px_-3px_6px_var(--nm-light)]",
            "transition-transform duration-200 motion-reduce:transition-none",
            on ? "translate-x-7 bg-white" : "bg-[var(--nm-base)]",
          ].join(" ")}
        />
      </button>
      <span>{label}</span>
    </label>
  );
}
```

## Variations
- **Raised vs pressed** — the core knob: outset shadows (extruded) vs `inset` shadows (carved). The state pair *is* the design.
- **Flat / convex / concave** — add a subtle `linear-gradient` to the base (lighter top-left → darker bottom-right = convex bulge; reverse = concave dish). The neumorphism.io generator names these three.
- **Soft UI 2.0 (2024-2026)** — keep the inset/outset language but pair it with a real accent color, a 3:1 border, and crisper shadows; treat it as one tactile accent rather than the whole skin.
- **Dark neumorphism** — same trick on a near-black base; perceptually stronger because a lighter raised tile reads better than a near-white highlight on near-white.
- **Hybrid with glass** — a single neumorphic tray holding glass cards; the soft tray gives tactility, the glass gives the content layer real contrast.

## Accessibility
- **Contrast (the central failure).** The shadow-vs-base edge in the canonical palette is ~1.72:1 (dark side) and ~1.27:1 (light side) — both far under the WCAG 2.1 SC 1.4.11 Non-text Contrast minimum of **3:1** for the visual boundary of a control. Fix it by adding a perceivable boundary that *does* clear 3:1: in the code above the border `#6b7785` measures **3.60:1** on the `#e0e5ec` base (dark mode `#828891` = **3.87:1** on `#2a2d32`). Never let the shadow be the only thing telling the user a control exists.
- **Text contrast.** Keep body text at ≥ 4.5:1 (SC 1.4.3): the entry uses `#1f2933` (**11.66:1**) for primary and `#52606d` (**5.10:1**) for secondary on the light base. The temptingly-soft grey palette is where people accidentally ship 2:1 text — don't.
- **Focus / keyboard.** A soft shadow is not a focus indicator. Provide an explicit `:focus-visible` outline; the accent ring here is `#1d4ed8` at **5.29:1** against base (clears the 3:1 focus-appearance bar). All controls must be real focusable elements (`<button>`, `<input>`), reachable and operable by keyboard.
- **State must be programmatic, not just visual.** The inset "pressed" look needs `aria-pressed`/`aria-checked` (or a native checked input) so screen readers announce on/off — the shadow flip is invisible to them.
- **Labels.** Neumorphism's minimalism tempts designers to drop icon labels; don't. Every control needs a visible text label or an `aria-label`.
- **prefers-reduced-motion.** The press/hover transforms and the knob slide are gated behind `@media (prefers-reduced-motion: reduce)` (and `motion-reduce:` in Tailwind), which removes the transitions while keeping the static styling.
- **Touch/pointer fallback.** Hover lift is decorative only — the resting state is fully usable; touch targets in the example are ≥ 36px (toggle) / ~44px tall (buttons), meeting the 24×24 CSS-px minimum of SC 2.5.8 with margin.
- **forced-colors / High Contrast.** Box-shadows are discarded in forced-colors mode, so the `@media (forced-colors: active)` block restores `ButtonText` borders — the control stays visible when the whole aesthetic is stripped.

## Performance
- **Shadow cost scales with element count.** Each neumorphic control paints two blurred shadows; on a page of dozens of soft cards the paint and compositing cost is real. Box-shadow blur is rasterized on paint, not cheaply animated — animating `box-shadow` directly (e.g. growing the blur) causes repaints. Prefer transitioning `transform`/`opacity` and swapping pre-defined shadow values on state change rather than tweening the shadow itself.
- **No backdrop-filter.** Unlike glassmorphism, neumorphism needs no `backdrop-filter`, so it avoids that expensive per-frame blur — a genuine perf advantage.
- **Inset shadows on large surfaces** are the most expensive variant; keep them on small controls.
- **Bundle cost: zero.** It's pure CSS — no library required. The React version adds only your existing framework.
- Avoid `will-change` on every soft tile; it forces a GPU layer per element and can regress memory more than it helps.

## Anti-slop
The cliché (see `_slop-blocklist.md` → **SURFACE**: "soft drop shadow on everything"): an entire dashboard rendered in `#e0e5ec` light-grey-on-white, every button, input, and card the same color with the same dual soft shadow and no borders — the unmistakable 2020 dribbble look, where nothing announces itself as interactive and edges sit near 1.5:1. It also trips the **COLOR** rule (one flat low-saturation grey everywhere) and frequently the **TYPE** rule (low-contrast grey text on grey).

The tasteful fix: treat neumorphism as a *single accent*, not a skin. Use it for the one control whose tactile metaphor earns it — a toggle, a stepper, a play button — over an otherwise high-contrast layout with a committed brand hue and a sharp accent (here `#1d4ed8` at 5.29:1). Give every soft control a real ≥ 3:1 border and a real focus ring so affordance never depends on the shadow. Break 2–3 defaults deliberately: keep the soft shadow, but reject the no-border, no-accent, all-grey monoculture that makes it read as AI/template output.

## Pairs well with
- **`glassmorphism`** (skin) — a soft neumorphic tray holding translucent glass content cards; the tray adds tactility, the glass layer carries the readable content. Summarized: glassmorphism = a frosted, semi-transparent panel (`backdrop-filter: blur()` + low-alpha fill + hairline border) floating over imagery, with WCAG-compliant text on top.
- **`dark-mode`** (system) — neumorphism is perceptually stronger on a dark base; ship the dark palette as first-class, not an afterthought.
- **`toggle` / `switch` components** (skeleton) — the inset-track + outset-knob pattern is neumorphism's single best-fit component.
- **`systematic-elevation`** (system) — borrow its idea of a defined shadow scale so your soft shadows are tokens, not ad-hoc per element.
- **`editorial-typographic`** (skin) — a high-contrast type system counterbalances the soft surface and keeps the page from going mushy.

## Current references
- [Understanding SC 1.4.11: Non-text Contrast — W3C/WAI](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html) — the 3:1 rule for control boundaries that neumorphism must satisfy.
- [Neumorphism — the accessible and inclusive way — Axess Lab](https://axesslab.com/neumorphism/) — names the exact failures (low contrast, missing icon labels, unclear clickability) and the 4.5:1 / 3:1 fixes.
- [Neumorphism and CSS — CSS-Tricks](https://css-tricks.com/neumorphism-and-css/) — the canonical breakdown of the dual light/dark box-shadow mechanism and inset flip.
- [Neumorphism: its rise and fall in UI design — Webflow Blog](https://webflow.com/blog/neumorphism) — honest retrospective on why it didn't survive as a full UI system.
- [Soft UI / Neumorphism shadow generator — neumorphism.io](https://neumorphism.io/) — interactive generator; names the flat/convex/concave variants and outputs the exact shadow values.
- [How "soft" UI designs impact accessibility — BOIA](https://www.boia.org/blog/how-soft-user-interface-designs-impact-accessibility) — accessibility org's take on affordance loss in soft UI and how to keep the aesthetic WCAG-compliant.
- [What is Neumorphism? — Interaction Design Foundation](https://www.interaction-design.org/literature/topics/neumorphism) — definition, history, and accessibility critique (page updated 2026).
- [CSS box-shadow — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow) — multiple shadows, `inset`, blur/spread reference.
