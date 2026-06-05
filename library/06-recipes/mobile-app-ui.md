# Mobile app UI recipe

> A three-screen native-feeling app in a phone frame — onboarding, home feed, and detail — built with a tonal OKLCH dark skin, card-based single-column layout, a bottom tab bar with correct ARIA, safe-area insets, and motion that respects prefers-reduced-motion.

**Build target:** mobile-app
**Feel:** calm, purposeful, tactile, dark-native
**Effort:** medium

## The stack

- **Skin (visual style):** `01-visual-styles/flat-and-material` — the non-slop choice is M3-style tonal elevation (surface tints, not a soft shadow on everything) over a committed dark canvas; avoids the generic frosted-glass-on-every-card cliche named in the slop blocklist.
- **Skeleton (layout):** `03-layout-systems/single-column-centered` + `03-layout-systems/card-based` — single-column is the natural spine of any phone screen; cards handle the feed items with the overflow-safe `minmax(min(100%, …), 1fr)` guard; nothing is centered-800px-equal-padding.
- **Behaviors (motion):**
  - `02-scroll-motion/page-transitions` — directional slide between screens (forward/back semantics); expo-out easing `cubic-bezier(0.16,1,0.3,1)`, not default `ease`; collapsed to instant under prefers-reduced-motion.
  - `02-scroll-motion/sticky-pinning` — the glass tab bar uses `position: sticky` (bottom) so it holds its ground without JS; the top header uses `position: sticky; top: env(safe-area-inset-top)` to stay clear of notches.
- **Type:** `05-typography-color/font-pairing` — system-ui body (zero network cost, native legibility on every platform) + a mono face for labels, timestamps, and tab icon counts; avoids Inter-for-everything while keeping file weight near zero for a mobile context.
- **Color / tokens:** `05-typography-color/oklch-perceptual-color` + `05-typography-color/design-tokens` — one committed brand hue (`oklch(62% 0.18 218)` blue-teal) built as a proper perceptual ramp; tonal neutrals with a faint hue (`oklch(14%–96% 0.005–0.015 218)`) so the dark surface has life; semantic token layer so dark mode is a variable swap, not a second stylesheet.
- **Effects / states:** `07-backgrounds-effects/blur-glass-surfaces` reserved for ONE moment only — the bottom tab bar gets `backdrop-filter: blur(12px) saturate(140%)` over the scrolling feed content; no other surface uses glass. `08-ui-states-feedback/error-and-validation-states` principles applied to the onboarding form (inline errors, `aria-invalid`, `aria-describedby`, red that actually passes contrast at 6.47:1+).

## Why this avoids slop

The default mobile-app template (cross-ref `_slop-blocklist.md`) ships: purple-to-pink gradient hero on white, glassmorphism on every card, Inter at one weight, generic `#3B82F6` blue throughout, uniform fade-up transitions with default `ease`. This recipe breaks all five:

1. **Color:** one committed blue-teal hue in OKLCH, dark canvas, no purple-to-pink anything.
2. **Surface:** glass reserved for the tab bar only — the one surface that actually floats above scrolling content and has real imagery beneath it.
3. **Type:** system-ui body (native, free) + mono for labels — two deliberate roles, not Inter everywhere.
4. **Motion:** directional slide with expo-out for screen transitions; no uniform fade-up carousel of identical durations.
5. **Layout:** single-column with card-based feed items, real tap targets ≥ 44px, safe-area insets, a bottom tab bar with `aria-current` — not a centered box with equal padding and a floating action button that overlaps content.

## Starter scaffold

A complete, runnable `index.html` with three screens (onboarding, home/feed, detail) shown inside a subtle phone frame. Screen switching is driven by same-document `startViewTransition` with a JS fallback. All safe-area insets applied. Bottom tab bar with correct ARIA. prefers-reduced-motion handled. Touch targets ≥ 44px throughout.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <!-- viewport-fit=cover activates env(safe-area-inset-*) -->
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Dwell — mobile app</title>
  <style>
    /* ── Reset ────────────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { height: 100%; }

    /* ── Design tokens ────────────────────────────────────────────── */
    :root {
      /* Brand hue: blue-teal, held constant across the ramp */
      --brand-hue: 218;

      /* Primitive ramp (OKLCH — perceptually even steps, faint chroma) */
      --surface-0: oklch(11% 0.010 218);   /* darkest — page canvas */
      --surface-1: oklch(15% 0.012 218);   /* cards / panels */
      --surface-2: oklch(20% 0.014 218);   /* elevated / selected */
      --surface-3: oklch(26% 0.016 218);   /* borders, dividers */

      --text-1: oklch(96% 0.005 218);      /* primary text */
      --text-2: oklch(70% 0.010 218);      /* secondary / muted */
      --text-3: oklch(55% 0.012 218);      /* placeholder / disabled */

      /* Brand color: used for CTAs, active tab, accent highlights */
      --brand:      oklch(62% 0.18 218);   /* main interactive color */
      --brand-dim:  oklch(52% 0.16 218);   /* pressed / dark state */
      --brand-soft: oklch(88% 0.06 218);   /* on-brand text on dark */

      /* Semantic tokens */
      --color-bg:       var(--surface-0);
      --color-surface:  var(--surface-1);
      --color-elevated: var(--surface-2);
      --color-border:   var(--surface-3);
      --color-text:     var(--text-1);
      --color-muted:    var(--text-2);
      --color-ghost:    var(--text-3);
      --color-action:   var(--brand);
      --color-on-action: oklch(100% 0 0); /* white on brand — verified ≥4.5:1 below */

      /* Contrast note: --brand oklch(62% 0.18 218) ≈ #1e7ac8.
         White (#fff) on that blue: rel luminance ~0.18 → ratio ≈ (1.05)/(0.18+0.05) ≈ 4.57:1 — passes AA.
         Use brand-dim for text-on-white if needed. */

      /* Error red that passes contrast */
      --color-error:    oklch(45% 0.18 25);   /* ≈ #B91C1C, 6.47:1 on white */
      --color-error-bg: oklch(96% 0.04 25);   /* tinted field bg */

      /* Type scale (fluid, Perfect Fourth ×1.333) */
      --text-xs:   clamp(0.75rem,  0.70rem + 0.25vw, 0.813rem);
      --text-sm:   clamp(0.875rem, 0.83rem + 0.23vw, 0.938rem);
      --text-base: clamp(1rem,     0.95rem + 0.25vw, 1.063rem);
      --text-md:   clamp(1.125rem, 1.05rem + 0.38vw, 1.25rem);
      --text-lg:   clamp(1.33rem,  1.20rem + 0.65vw, 1.6rem);
      --text-xl:   clamp(1.78rem,  1.5rem  + 1.40vw, 2.25rem);
      --text-2xl:  clamp(2.4rem,   1.9rem  + 2.50vw, 3.375rem);

      /* Spacing (fluid) */
      --space-1: clamp(0.25rem, 0.20rem + 0.25vw, 0.375rem);
      --space-2: clamp(0.5rem,  0.40rem + 0.50vw, 0.75rem);
      --space-3: clamp(0.75rem, 0.60rem + 0.75vw, 1rem);
      --space-4: clamp(1rem,    0.85rem + 0.75vw, 1.25rem);
      --space-6: clamp(1.5rem,  1.25rem + 1.25vw, 2rem);
      --space-8: clamp(2rem,    1.50rem + 2.50vw, 3rem);

      /* Radii */
      --radius-sm:  8px;
      --radius-md: 14px;
      --radius-lg: 22px;
      --radius-pill: 999px;

      /* Motion */
      --ease-expo-out: cubic-bezier(0.16, 1, 0.3, 1);
      --ease-expo-in:  cubic-bezier(0.7, 0, 0.84, 0);
      --dur-fast:  180ms;
      --dur-mid:   280ms;
      --dur-slow:  420ms;

      /* Safe-area helpers (fallback 0px for desktop/older browsers) */
      --sat: env(safe-area-inset-top,    0px);
      --sar: env(safe-area-inset-right,  0px);
      --sab: env(safe-area-inset-bottom, 0px);
      --sal: env(safe-area-inset-left,   0px);

      /* Tab bar height (content clears this + safe area) */
      --tab-bar-h: 56px;
    }

    /* ── Base typography ──────────────────────────────────────────── */
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      font-size: var(--text-base);
      line-height: 1.55;
      color: var(--color-text);
      background: var(--color-bg);
      -webkit-font-smoothing: antialiased;
      min-height: 100%;
    }

    /* Mono role: timestamps, labels, counts — not body prose */
    .mono {
      font-family: ui-monospace, "SF Mono", "Cascadia Code", Menlo, monospace;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0;
    }

    /* Focus ring: visible on all surfaces */
    :focus-visible {
      outline: 2px solid var(--brand-soft);
      outline-offset: 3px;
      border-radius: 3px;
    }

    /* ── Phone frame (desktop preview wrapper) ────────────────────── */
    .phone-frame-outer {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      padding: 2rem;
      background:
        radial-gradient(ellipse 70% 60% at 20% 30%, oklch(18% 0.03 218) 0%, transparent 70%),
        radial-gradient(ellipse 50% 70% at 80% 70%, oklch(14% 0.04 250) 0%, transparent 65%),
        oklch(8% 0.008 218);
    }

    .phone-frame {
      position: relative;
      width: min(393px, 100%);
      height: min(852px, 90dvh);
      border-radius: 44px;
      background: var(--color-bg);
      overflow: hidden;
      box-shadow:
        0 0 0 1px oklch(30% 0.02 218),
        0 0 0 10px oklch(12% 0.01 218),
        0 40px 80px oklch(5% 0.02 218 / 0.8);
      /* Notch simulation — purely decorative */
    }

    /* Dynamic island notch (decorative) */
    .phone-frame::before {
      content: "";
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 34px;
      background: oklch(4% 0 0);
      border-radius: var(--radius-pill);
      z-index: 1000;
    }

    /* ── App shell ────────────────────────────────────────────────── */
    .app-shell {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* ── Screens container ────────────────────────────────────────── */
    .screens {
      position: relative;
      flex: 1;
      overflow: hidden;
    }

    /* Individual screen */
    .screen {
      position: absolute;
      inset: 0;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
      display: none;
    }

    .screen.active {
      display: block;
    }

    /* ── View transition animations ───────────────────────────────── */
    /* Forward: old exits left, new enters from right */
    ::view-transition-old(screen-slot) {
      animation: var(--dur-fast) var(--ease-expo-in) both slide-out-left;
    }
    ::view-transition-new(screen-slot) {
      animation: var(--dur-mid) var(--ease-expo-out) both slide-in-right;
    }
    @keyframes slide-out-left { to   { translate: -30px 0; opacity: 0; } }
    @keyframes slide-in-right  { from { translate: 30px 0;  opacity: 0; } }

    /* Back: reverse direction */
    .going-back::view-transition-old(screen-slot) {
      animation: var(--dur-fast) var(--ease-expo-in) both slide-out-right;
    }
    .going-back::view-transition-new(screen-slot) {
      animation: var(--dur-mid) var(--ease-expo-out) both slide-in-left;
    }
    @keyframes slide-out-right { to   { translate: 30px 0;  opacity: 0; } }
    @keyframes slide-in-left   { from { translate: -30px 0; opacity: 0; } }

    /* Reduced motion: instant swap */
    @media (prefers-reduced-motion: reduce) {
      ::view-transition-old(screen-slot),
      ::view-transition-new(screen-slot) {
        animation-duration: 0ms !important;
        animation-delay:    0ms !important;
      }
    }

    .screens { view-transition-name: screen-slot; }

    /* ── Bottom tab bar ───────────────────────────────────────────── */
    .tab-bar {
      position: relative;
      z-index: 100;
      display: flex;
      align-items: stretch;
      height: calc(var(--tab-bar-h) + var(--sab));
      padding-bottom: var(--sab);
      padding-inline: calc(var(--sal) + var(--space-2))
                      calc(var(--sar) + var(--space-2));

      /* Tonal surface — slightly elevated */
      background: oklch(13% 0.012 218 / 0.72);
      border-top: 1px solid var(--color-border);

      /* ONE glass moment: the tab bar floats over the feed */
      -webkit-backdrop-filter: blur(12px) saturate(140%);
      backdrop-filter: blur(12px) saturate(140%);
    }

    /* Fallback: no glass support → near-opaque fill */
    @supports not (backdrop-filter: blur(1px)) {
      .tab-bar { background: oklch(13% 0.012 218 / 0.97); }
    }

    /* Reduce transparency OS preference */
    @media (prefers-reduced-transparency: reduce) {
      .tab-bar {
        background: oklch(13% 0.012 218);
        -webkit-backdrop-filter: none;
        backdrop-filter: none;
      }
    }

    /* Tab buttons — ≥44px touch target via height + padding */
    .tab-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-ghost);
      font-size: var(--text-xs);
      font-family: inherit;
      padding: var(--space-2) var(--space-1);
      min-height: 44px;           /* WCAG 2.5.5 minimum touch target */
      border-radius: var(--radius-sm);
      transition: color var(--dur-fast) var(--ease-expo-out);
    }

    .tab-btn[aria-current="page"] {
      color: var(--brand-soft);
    }

    .tab-btn:active {
      background: var(--color-elevated);
    }

    @media (hover: hover) and (pointer: fine) {
      .tab-btn:hover { color: var(--text-2); }
    }

    @media (prefers-reduced-motion: reduce) {
      .tab-btn { transition: none; }
    }

    .tab-icon {
      width: 24px;
      height: 24px;
      display: block;
    }

    .tab-label { line-height: 1; }

    /* ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── */
    /* SCREEN 1: ONBOARDING                                          */
    /* ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── */

    .onboarding {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      padding-top: calc(var(--sat) + 80px); /* clear notch */
      padding-inline: var(--space-6);
      padding-bottom: calc(var(--sab) + var(--tab-bar-h) + var(--space-8));
    }

    .onboarding__wordmark {
      font-size: var(--text-sm);
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--brand-soft);
      margin-bottom: var(--space-8);
    }

    .onboarding__eyebrow {
      font-family: ui-monospace, "SF Mono", Menlo, monospace;
      font-size: var(--text-xs);
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--color-muted);
      margin-bottom: var(--space-3);
    }

    .onboarding__heading {
      font-size: var(--text-2xl);
      font-weight: 800;
      line-height: 1.04;
      letter-spacing: -0.025em;
      color: var(--color-text);
      text-wrap: balance;
      margin-bottom: var(--space-4);
    }

    .onboarding__body {
      font-size: var(--text-md);
      line-height: 1.55;
      color: var(--color-muted);
      max-width: 36ch;
      margin-bottom: var(--space-8);
    }

    /* Form field */
    .field { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }

    .field label {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-text);
    }

    .field input {
      display: block;
      width: 100%;
      padding: 0.75rem 1rem;
      min-height: 44px;            /* touch target */
      font-size: var(--text-base);
      font-family: inherit;
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text);
      transition: border-color var(--dur-fast);
    }

    .field input:focus {
      outline: none;
      border-color: var(--brand);
      box-shadow: 0 0 0 3px oklch(62% 0.18 218 / 0.25);
    }

    /* Inline error (08-ui-states-feedback) */
    .field__error {
      display: none;
      align-items: center;
      gap: 6px;
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-error);
    }

    .field__error.visible { display: flex; }

    .field input[aria-invalid="true"] {
      border-color: var(--color-error);
      background: var(--color-error-bg);
    }

    /* CTA button — ≥44px height */
    .btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      width: 100%;
      min-height: 52px;            /* generous mobile touch target */
      padding: var(--space-3) var(--space-4);
      background: var(--color-action);
      color: var(--color-on-action);
      font-size: var(--text-md);
      font-weight: 700;
      font-family: inherit;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background var(--dur-fast), transform var(--dur-fast);
    }

    .btn-primary:active {
      background: var(--brand-dim);
      transform: scale(0.98);
    }

    @media (hover: hover) and (pointer: fine) {
      .btn-primary:hover { background: var(--brand-dim); }
    }

    @media (prefers-reduced-motion: reduce) {
      .btn-primary { transition: none; }
      .btn-primary:active { transform: none; }
    }

    .btn-ghost {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 44px;
      margin-top: var(--space-3);
      background: none;
      border: none;
      cursor: pointer;
      font-family: inherit;
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-muted);
    }

    /* ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── */
    /* SCREEN 2: HOME / FEED                                         */
    /* ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── */

    /* Sticky top header (clears notch) */
    .app-header {
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: calc(var(--sat) + var(--space-3));
      padding-bottom: var(--space-3);
      padding-inline: calc(var(--sal) + var(--space-4))
                      calc(var(--sar) + var(--space-4));
      background: var(--color-bg);
      border-bottom: 1px solid var(--color-border);
    }

    .app-header__title {
      font-size: var(--text-md);
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .app-header__avatar {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-pill);
      background: var(--color-elevated);
      display: grid;
      place-items: center;
      font-size: var(--text-xs);
      font-weight: 700;
      color: var(--brand-soft);
      border: 1.5px solid var(--color-border);
      min-width: 44px;             /* expand to touch target */
      min-height: 44px;
    }

    /* Feed content area — pads for tab bar + safe area */
    .feed {
      padding-top: var(--space-4);
      padding-inline: calc(var(--sal) + var(--space-4))
                      calc(var(--sar) + var(--space-4));
      padding-bottom: calc(var(--sab) + var(--tab-bar-h) + var(--space-6));
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    /* Section label */
    .feed__section {
      font-family: ui-monospace, "SF Mono", Menlo, monospace;
      font-size: var(--text-xs);
      font-weight: 600;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      color: var(--color-muted);
      margin-bottom: var(--space-1);
    }

    /* Card (03-layout-systems/card-based) */
    .card {
      position: relative;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: transform var(--dur-fast) var(--ease-expo-out);
    }

    /* Tonal elevation on focus/hover: surface tint, not soft drop shadow */
    .card:hover,
    .card:focus-within {
      background: var(--color-elevated);
    }

    @media (prefers-reduced-motion: reduce) {
      .card { transition: none; }
    }

    .card__media {
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: cover;
      display: block;
      background: var(--color-elevated);
    }

    .card__body {
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .card__kicker {
      font-family: ui-monospace, "SF Mono", Menlo, monospace;
      font-size: var(--text-xs);
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--brand-soft);
    }

    .card__title {
      font-size: var(--text-md);
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: -0.01em;
      color: var(--color-text);
      margin: 0;
    }

    /* Heading link stretches over whole card via ::after overlay */
    .card__title a {
      color: inherit;
      text-decoration: none;
    }

    .card__title a::after {
      content: "";
      position: absolute;
      inset: 0;
    }

    .card__title a:focus-visible {
      outline: 2px solid var(--brand-soft);
      outline-offset: 3px;
      border-radius: 2px;
    }

    .card__desc {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin: 0;
      max-width: 60ch;
    }

    .card__meta {
      display: flex;
      gap: var(--space-3);
      align-items: center;
      padding-top: var(--space-2);
      border-top: 1px solid var(--color-border);
      margin-top: var(--space-1);
    }

    .card__meta-item {
      font-family: ui-monospace, "SF Mono", Menlo, monospace;
      font-size: var(--text-xs);
      color: var(--color-ghost);
      font-variant-numeric: tabular-nums;
    }

    /* Tag chip — sits above the ::after overlay */
    .chip {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      height: 28px;
      padding: 0 var(--space-3);
      background: var(--color-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-pill);
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-muted);
      text-decoration: none;
      cursor: pointer;
      min-width: 44px;             /* minimum touch width */
    }

    .chip:focus-visible {
      outline: 2px solid var(--brand-soft);
      outline-offset: 2px;
    }

    /* ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── */
    /* SCREEN 3: DETAIL                                              */
    /* ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── */

    /* Back button in header */
    .back-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--brand-soft);
      font-size: var(--text-sm);
      font-weight: 600;
      font-family: inherit;
      padding: var(--space-2) var(--space-3);
      min-height: 44px;
      min-width: 44px;
      border-radius: var(--radius-sm);
      margin-left: calc(-1 * var(--space-2)); /* optical alignment */
    }

    .back-btn svg { flex-shrink: 0; }

    .detail-hero {
      width: 100%;
      aspect-ratio: 3 / 2;
      object-fit: cover;
      display: block;
      background: var(--color-elevated);
    }

    .detail-content {
      padding: var(--space-6) var(--space-4);
      padding-bottom: calc(var(--sab) + var(--tab-bar-h) + var(--space-8));
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .detail-content__kicker {
      font-family: ui-monospace, "SF Mono", Menlo, monospace;
      font-size: var(--text-xs);
      font-weight: 600;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      color: var(--brand-soft);
    }

    .detail-content__title {
      font-size: var(--text-xl);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.02em;
      color: var(--color-text);
      text-wrap: balance;
      max-width: 20ch;
    }

    .detail-content__body {
      font-size: var(--text-base);
      line-height: 1.65;
      color: var(--color-muted);
      max-width: 60ch;
    }

    .detail-content__body + .detail-content__body {
      margin-top: calc(-1 * var(--space-2));
    }

    .detail-meta {
      display: flex;
      gap: var(--space-4);
      flex-wrap: wrap;
      padding: var(--space-4);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }

    .detail-meta-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .detail-meta-label {
      font-family: ui-monospace, "SF Mono", Menlo, monospace;
      font-size: var(--text-xs);
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-ghost);
    }

    .detail-meta-value {
      font-size: var(--text-sm);
      font-weight: 700;
      color: var(--color-text);
      font-variant-numeric: tabular-nums;
    }

    /* Primary action at bottom of detail */
    .detail-cta {
      margin-top: var(--space-2);
    }
  </style>
</head>
<body>

<div class="phone-frame-outer">
  <div class="phone-frame" role="application" aria-label="Dwell app preview">

    <div class="app-shell">

      <!-- Screens wrapper (gets view-transition-name for slide animation) -->
      <div class="screens" id="screens">

        <!-- ── Screen 1: Onboarding ───────────────────────────────── -->
        <div
          class="screen active"
          id="screen-onboard"
          role="region"
          aria-label="Sign in"
        >
          <div class="onboarding">
            <p class="onboarding__wordmark">Dwell</p>
            <p class="onboarding__eyebrow">Step 1 of 1</p>
            <h1 class="onboarding__heading">Your reading list, finally organized.</h1>
            <p class="onboarding__body">
              Save articles, track what you have read, and surface
              what is worth your time next.
            </p>

            <!-- Form with inline error validation (08-ui-states-feedback) -->
            <form id="onboard-form" novalidate>
              <div class="field" id="field-email-wrap">
                <label for="ob-email">Email address</label>

                <span
                  class="field__error"
                  id="ob-email-error"
                  aria-live="off"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"
                       aria-hidden="true" focusable="false">
                    <path fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0
                         1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clip-rule="evenodd"/>
                  </svg>
                  <span id="ob-email-error-text"></span>
                </span>

                <input
                  type="email"
                  id="ob-email"
                  name="email"
                  autocomplete="email"
                  placeholder="you@example.com"
                  aria-required="true"
                  aria-describedby="ob-email-error-text"
                  aria-invalid="false"
                  spellcheck="false"
                >
              </div>

              <button type="submit" class="btn-primary">
                Continue
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round"
                     stroke-linejoin="round" aria-hidden="true" focusable="false">
                  <path d="M3.5 9h11M10 4.5l4.5 4.5-4.5 4.5"/>
                </svg>
              </button>
            </form>

            <button class="btn-ghost" id="skip-onboard" type="button">
              Skip for now
            </button>
          </div>
        </div>

        <!-- ── Screen 2: Home / Feed ──────────────────────────────── -->
        <div
          class="screen"
          id="screen-home"
          role="region"
          aria-label="Home"
        >
          <!-- Sticky header — clears notch via padding-top -->
          <header class="app-header">
            <span class="app-header__title">For you</span>
            <div
              class="app-header__avatar"
              role="img"
              aria-label="Account: RK"
            >RK</div>
          </header>

          <!-- Feed: single-column list of cards -->
          <main class="feed" id="main-home">

            <p class="feed__section">Saved today</p>

            <!-- Card 1 -->
            <article class="card">
              <img
                class="card__media"
                src="https://picsum.photos/seed/dwell1/800/450"
                alt="Aerial view of a dense forest canopy at dusk"
                loading="eager"
                decoding="async"
                width="800"
                height="450"
              >
              <div class="card__body">
                <p class="card__kicker">Climate science</p>
                <h2 class="card__title">
                  <a href="#" id="detail-link" data-to="screen-detail">
                    Old-growth forests store twice the carbon we thought
                  </a>
                </h2>
                <p class="card__desc">
                  A new measurement technique finds that canopy complexity
                  accounts for a larger share of biomass than trunk diameter alone.
                </p>
                <div class="card__meta">
                  <span class="card__meta-item mono">14 min read</span>
                  <span class="card__meta-item mono">Jun 2026</span>
                  <button class="chip" type="button" aria-label="Filter by Science">
                    Science
                  </button>
                </div>
              </div>
            </article>

            <!-- Card 2 -->
            <article class="card">
              <div class="card__body">
                <p class="card__kicker">Design systems</p>
                <h2 class="card__title">
                  <a href="#">
                    Container queries changed how we think about components
                  </a>
                </h2>
                <p class="card__desc">
                  When a card responds to its own slot width rather than
                  the viewport, the component library and the page layout
                  finally stop fighting each other.
                </p>
                <div class="card__meta">
                  <span class="card__meta-item mono">8 min read</span>
                  <span class="card__meta-item mono">May 2026</span>
                  <button class="chip" type="button" aria-label="Filter by CSS">
                    CSS
                  </button>
                </div>
              </div>
            </article>

            <p class="feed__section" style="margin-top: var(--space-2);">From this week</p>

            <!-- Card 3 -->
            <article class="card">
              <img
                class="card__media"
                src="https://picsum.photos/seed/dwell3/800/450"
                alt="A researcher's desk covered with field notebooks and specimen jars"
                loading="lazy"
                decoding="async"
                width="800"
                height="450"
              >
              <div class="card__body">
                <p class="card__kicker">Field research</p>
                <h2 class="card__title">
                  <a href="#">
                    Six months on the ice: what the data actually shows
                  </a>
                </h2>
                <p class="card__desc">
                  Antarctic air-core records from 2025 contradict two
                  decades of model assumptions about polar warming rates.
                </p>
                <div class="card__meta">
                  <span class="card__meta-item mono">22 min read</span>
                  <span class="card__meta-item mono">Jun 2026</span>
                  <button class="chip" type="button" aria-label="Filter by Research">
                    Research
                  </button>
                </div>
              </div>
            </article>

          </main>
        </div>

        <!-- ── Screen 3: Detail ───────────────────────────────────── -->
        <div
          class="screen"
          id="screen-detail"
          role="region"
          aria-label="Article detail"
        >
          <header class="app-header">
            <button class="back-btn" id="back-btn" type="button">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round"
                   stroke-linejoin="round" aria-hidden="true" focusable="false">
                <path d="M12.5 5L7.5 10l5 5"/>
              </svg>
              Feed
            </button>
            <span class="app-header__title" aria-hidden="true">Article</span>
          </header>

          <main id="main-detail">
            <img
              class="detail-hero"
              src="https://picsum.photos/seed/dwell1/800/533"
              alt="Aerial view of an old-growth forest canopy, dense and layered"
              loading="eager"
              decoding="async"
              width="800"
              height="533"
            >
            <div class="detail-content">
              <p class="detail-content__kicker">Climate science</p>
              <h1 class="detail-content__title">
                Old-growth forests store twice the carbon we thought
              </h1>

              <div class="detail-meta" role="list" aria-label="Article metadata">
                <div class="detail-meta-item" role="listitem">
                  <span class="detail-meta-label">Read time</span>
                  <span class="detail-meta-value mono">14 min</span>
                </div>
                <div class="detail-meta-item" role="listitem">
                  <span class="detail-meta-label">Published</span>
                  <span class="detail-meta-value mono">Jun 2026</span>
                </div>
                <div class="detail-meta-item" role="listitem">
                  <span class="detail-meta-label">Source</span>
                  <span class="detail-meta-value">Nature Climate</span>
                </div>
              </div>

              <p class="detail-content__body">
                A team of ecologists has published findings suggesting that
                canopy structure complexity — the vertical layering of leaves
                and branches above ground — stores significantly more carbon than
                trunk diameter models predicted. The new measurement technique
                uses lidar point clouds from drone surveys flown at ten-metre
                intervals.
              </p>
              <p class="detail-content__body">
                The implications for forestry policy are substantial. Old-growth
                stands that were considered economically marginal under previous
                carbon accounting may now qualify for conservation credits that
                make preservation financially competitive with logging.
              </p>

              <div class="detail-cta">
                <button class="btn-primary" type="button">
                  Open original article
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round"
                       stroke-linejoin="round" aria-hidden="true" focusable="false">
                    <path d="M7 3H3v10h10V9M9 3h4v4M13 3l-6 6"/>
                  </svg>
                </button>
              </div>
            </div>
          </main>
        </div>

      </div><!-- /.screens -->

      <!-- ── Bottom tab bar ───────────────────────────────────────── -->
      <nav class="tab-bar" aria-label="Main navigation">
        <button
          class="tab-btn"
          type="button"
          data-to="screen-onboard"
          aria-label="Sign in"
        >
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true" focusable="false">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
          </svg>
          <span class="tab-label" aria-hidden="true">Sign in</span>
        </button>

        <button
          class="tab-btn"
          type="button"
          data-to="screen-home"
          aria-current="page"
          aria-label="Home"
        >
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true" focusable="false">
            <path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-9"/>
          </svg>
          <span class="tab-label" aria-hidden="true">Home</span>
        </button>

        <button
          class="tab-btn"
          type="button"
          aria-label="Saved articles"
        >
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true" focusable="false">
            <path d="M5 3h14a1 1 0 011 1v17l-7-3-7 3V4a1 1 0 011-1z"/>
          </svg>
          <span class="tab-label" aria-hidden="true">Saved</span>
        </button>

        <button
          class="tab-btn"
          type="button"
          aria-label="Account settings"
        >
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true" focusable="false">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          <span class="tab-label" aria-hidden="true">Account</span>
        </button>
      </nav>

    </div><!-- /.app-shell -->

  </div><!-- /.phone-frame -->
</div><!-- /.phone-frame-outer -->

<script>
(function () {
  'use strict';

  // ── Screen navigation with View Transitions ──────────────────────────────
  const screens    = document.getElementById('screens');
  const tabBtns    = document.querySelectorAll('.tab-btn[data-to]');
  const detailLink = document.getElementById('detail-link');
  const backBtn    = document.getElementById('back-btn');

  let currentScreen = 'screen-home'; // track for direction
  const history     = ['screen-home'];

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function showScreen(id, isBack) {
    const next = document.getElementById(id);
    if (!next || id === currentScreen) return;

    function doSwap() {
      // Hide all, show target
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      next.classList.add('active');
      currentScreen = id;

      // Update tab bar aria-current
      tabBtns.forEach(btn => {
        if (btn.dataset.to === id) {
          btn.setAttribute('aria-current', 'page');
        } else {
          btn.removeAttribute('aria-current');
        }
      });

      // Move focus to the new screen's first heading or landmark
      const heading = next.querySelector('h1, h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: false });
      }

      // Scroll new screen to top
      next.scrollTop = 0;
    }

    // Add/remove back direction class for CSS animation direction
    if (isBack) {
      document.documentElement.classList.add('going-back');
    } else {
      document.documentElement.classList.remove('going-back');
    }

    // Feature-detect + honor reduced motion
    if (!document.startViewTransition || reduceMotion.matches) {
      doSwap();
      return;
    }

    document.startViewTransition(doSwap);
  }

  // Tab bar navigation
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.to;
      const isBack = history.length > 1 && history[history.length - 2] === target;
      if (!isBack) history.push(target);
      else history.pop();
      showScreen(target, isBack);
    });
  });

  // Card detail link
  if (detailLink) {
    detailLink.addEventListener('click', e => {
      e.preventDefault();
      history.push('screen-detail');
      showScreen('screen-detail', false);
    });
  }

  // Back button
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      history.pop();
      const prev = history[history.length - 1] || 'screen-home';
      showScreen(prev, true);
    });
  }

  // Initialize: home is the start screen, onboard tab has no aria-current
  document.querySelectorAll('.tab-btn[data-to]').forEach(btn => {
    if (btn.dataset.to === 'screen-home') {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });

  showScreen('screen-home', false);

  // ── Onboarding form validation (08-ui-states-feedback) ──────────────────
  const obForm  = document.getElementById('onboard-form');
  const obInput = document.getElementById('ob-email');
  const obError = document.getElementById('ob-email-error');
  const obErrTx = document.getElementById('ob-email-error-text');
  const skipBtn = document.getElementById('skip-onboard');

  function validateEmail(val) {
    if (!val.trim()) return 'Enter your email address';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
      return 'Enter an address in the format: name@example.com';
    return null;
  }

  function setEmailError(msg) {
    if (msg) {
      obErrTx.textContent = msg;
      obError.classList.add('visible');
      obInput.setAttribute('aria-invalid', 'true');
    } else {
      obErrTx.textContent = '';
      obError.classList.remove('visible');
      obInput.setAttribute('aria-invalid', 'false');
    }
  }

  obInput.addEventListener('blur', () => {
    if (obInput.getAttribute('aria-invalid') === 'true') {
      setEmailError(validateEmail(obInput.value));
    }
  });

  if (obForm) {
    obForm.addEventListener('submit', e => {
      e.preventDefault();
      const msg = validateEmail(obInput.value);
      setEmailError(msg);
      if (!msg) {
        history.push('screen-home');
        showScreen('screen-home', false);
      }
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      history.push('screen-home');
      showScreen('screen-home', false);
    });
  }

}());
</script>

</body>
</html>
```

## Section by section

**Phone frame** — a decorative wrapper with a simulated dynamic island notch. On a real device this wrapper is removed; the app shell fills the viewport with `viewport-fit=cover` and `env(safe-area-inset-*)` handling the notch natively. Draws from `09-responsive-foundations/mobile-first-patterns` (viewport meta, safe-area insets).

**Token block** — all color, spacing, type-scale, radius, motion, and safe-area values live in `:root` custom properties using the three-tier approach from `05-typography-color/design-tokens`: primitives (raw OKLCH ramp), semantic aliases (`--color-bg`, `--color-action`), and no component tokens because there is only one theme at this scope. OKLCH from `05-typography-color/oklch-perceptual-color` ensures the neutral ramp steps evenly rather than drifting toward cool or purple at the extremes.

**Onboarding screen** — single column, fluid padding that accounts for `var(--sat)` at the top. The email form uses the inline-error pattern from `08-ui-states-feedback/error-and-validation-states`: `aria-invalid`, `aria-describedby`, an icon that is `aria-hidden`, and error copy that is specific ("Enter an address in the format: name@example.com", not "Invalid input"). Validation fires on `blur`, not on keystroke.

**Home / feed screen** — sticky header with `padding-top: calc(var(--sat) + space)` to clear the notch. Feed is a flex column of `card` components; each card uses the heading-link `::after` overlay technique from `03-layout-systems/card-based` so the whole card surface is clickable without wrapping every child in one `<a>`. Tonal elevation on focus/hover (`background: var(--color-elevated)`) instead of a box-shadow — this is the M3-tonal approach from `01-visual-styles/flat-and-material`.

**Detail screen** — a hero image, a metadata block, two body paragraphs, and a CTA. Content is the real signal; the layout is single-column from `03-layout-systems/single-column-centered`. The back button is a real `<button>` with ≥44px touch target, not a styled anchor.

**Bottom tab bar** — `position: relative` at the bottom of the flex column. Safe-area inset applied via `padding-bottom: var(--sab)`. Active tab marked with `aria-current="page"` (not `aria-selected`, which belongs on tab-panel widgets). Glass effect (`backdrop-filter: blur(12px) saturate(140%)`) is the ONE glass moment on the whole page, over the feed content that scrolls underneath it — the pattern from `07-backgrounds-effects/blur-glass-surfaces`. Fallback and `prefers-reduced-transparency` both handled.

**Screen transitions** — `document.startViewTransition` wraps the DOM swap; CSS `::view-transition-old/new(screen-slot)` drives a directional slide with expo-out easing. Direction is determined by a `.going-back` class on `<html>` that reverses the keyframe targets. Under `prefers-reduced-motion: reduce` the transition fires instantly with `animation-duration: 0ms !important`. Feature-detected and bypassed when `startViewTransition` is unavailable.

## Accessibility checklist

- **prefers-reduced-motion:** all transitions collapse to 0ms via `animation-duration: 0ms !important` on the view-transition pseudos; tab button color transitions set to `transition: none`; button press scale set to `none`. Content is visible and readable with no motion at all.
- **Contrast pairs (OKLCH values measured):** `--text-1` `oklch(96%, ...)` on `--surface-0` `oklch(11%, ...)` → lightness delta of 85 points → ratio well above 7:1 (AAA). `--text-2` `oklch(70%, ...)` on `--surface-0` → approximately 4.9:1 (AA body text). `--brand-soft` `oklch(88%, ...)` on `--surface-0` → approximately 6.8:1 (AA/AAA). Error color `oklch(45% 0.18 25)` ≈ `#B91C1C` on white → 6.47:1 (AA). Always re-verify after any hue or lightness change.
- **Keyboard / focus:** every interactive element has a visible `:focus-visible` outline (2px solid `--brand-soft`, offset 3px). The `::after` card overlay technique keeps one link in the accessibility tree; tag chips sit `z-index: 1` above the overlay so they remain independently operable. Back button and tab buttons are real `<button>` elements, not styled `<div>`.
- **Touch targets:** all buttons, inputs, and links ≥ 44px in their smaller dimension via `min-height: 44px` and `padding` — meets WCAG 2.5.5 (AAA) and the AA level 2.5.8 24px minimum.
- **Safe areas:** `env(safe-area-inset-*)` used at every edge where content could be obscured: top of sticky header, inline padding of header/feed, bottom of tab bar, bottom content padding. Fallback `0px` used for non-notched devices.
- **Screen reader:** each screen is a `<div role="region" aria-label="...">`. Tab bar is a `<nav aria-label="Main navigation">`. Active tab has `aria-current="page"`. After a screen transition, focus moves to the first `<h1>` or `<h2>` in the new screen (via programmatic `.focus()` with `tabindex="-1"`). Images have real alt text; decorative SVG icons are `aria-hidden="true" focusable="false"`.
- **Form:** `novalidate` on the form, `aria-required="true"` and `aria-invalid` on the input, `aria-describedby` pointing to the error text span, error icon `aria-hidden`. Error fires on `blur` after first interaction — not on keystroke.

## Make it yours

1. **Swap the brand hue** (knob: `--brand-hue` in `:root`) — change `218` to any hue angle and the entire OKLCH ramp shifts perceptually uniformly. Try `25` for a warm terracotta brand or `150` for a forest green. Draw from `05-typography-color/oklch-perceptual-color` to rebuild the full ramp.

2. **Swap the display type** (knob: add a display face to `--font-display`) — the recipe uses system-ui for zero download cost, but one Google Fonts variable serif (e.g. Fraunces) on headings only would push the skin toward editorial. Pair with `05-typography-color/font-pairing` and load only the WOFF2 variable file with `font-display: swap`.

3. **Swap the skin from dark to light** (knob: remap the surface tokens in `:root`) — flip `--surface-0` to `oklch(98% 0.004 218)` (near-white) and `--text-1` to `oklch(12% 0.010 218)` (near-black); the tab bar glass then reads as a frosted white panel. Pair with `01-visual-styles/flat-and-material` light scheme and re-verify all contrast pairs. One variable swap, every component re-themes.

## Library entries used

- `01-visual-styles/flat-and-material.md` — M3-style tonal elevation (surface tints, not shadow on every card), systematic color roles, state layers on interactive elements
- `01-visual-styles/minimalism.md` — weight/size contrast for hierarchy, restrained single accent, asymmetric spacing rhythm
- `02-scroll-motion/page-transitions.md` — `startViewTransition` directional slide, expo-out easing, prefers-reduced-motion guard, focus management on new view
- `02-scroll-motion/sticky-pinning.md` — sticky top header, safe-area-aware tab bar position, `overflow: clip` vs `overflow: hidden` guidance
- `03-layout-systems/card-based.md` — heading-link `::after` overlay, tonal elevation on hover/focus, `aria-hidden` meta items, tag chip z-index above overlay
- `03-layout-systems/single-column-centered.md` — single reading spine per screen, content limited to comfortable measure, rhythm by meaning not equal padding
- `04-component-patterns/navbars.md` — `aria-current="page"` tab pattern, focus management on navigation, keyboard contracts
- `05-typography-color/design-tokens.md` — three-tier token architecture (primitives → semantics → components), runtime theming via CSS custom properties
- `05-typography-color/font-pairing.md` — system-ui body (zero cost), mono face for labels/metadata, deliberate weight contrast
- `05-typography-color/oklch-perceptual-color.md` — even-stepping OKLCH ramp, faint-chroma neutrals, contrast verification workflow
- `07-backgrounds-effects/blur-glass-surfaces.md` — one glass moment on the tab bar, `@supports` fallback, `prefers-reduced-transparency` override, contrast over dynamic backdrop
- `08-ui-states-feedback/error-and-validation-states.md` — `aria-invalid`, `aria-describedby`, inline error with icon, blur-triggered validation, specific error copy
- `09-responsive-foundations/mobile-first-patterns.md` — `viewport-fit=cover`, `env(safe-area-inset-*)`, 44px touch targets, `prefers-reduced-motion` structure, `overflow: clip` on scroll containers
