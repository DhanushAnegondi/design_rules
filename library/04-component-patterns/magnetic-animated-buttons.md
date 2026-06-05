# Magnetic & animated buttons

> Buttons that respond to cursor proximity with a pull toward the pointer, fill/sweep effects on hover, and subtle icon motion — layered micro-interactions that make click targets feel physically present.

**Bucket:** component
**Maturity:** current
**Effort:** medium
**Best for:** portfolios, websites, marketing pages, landing pages

---

## What it is

Three stacked layers of button micro-interaction that are typically combined: (1) **magnetic pull** — the button body (or a highlight element inside it) physically drifts toward the cursor when the pointer enters a surrounding zone, using `mousemove` math and either CSS transitions or a spring animation library; (2) **fill/sweep hover** — a background swatch or color block slides, scales, or wipes across the button surface on `:hover`, signaling interactivity before a click occurs; (3) **icon motion** — an embedded SVG or icon nudges, rotates, or translates on hover to suggest direction or action. Together they give flat buttons the tactile weight of a physical object without adding DOM complexity or layout cost.

---

## When to use

- Call-to-action buttons that are the primary conversion point on a page — magnetic pull physically draws the eye and hand toward the target.
- Portfolio or agency hero sections where demonstrating craft through the UI itself is part of the pitch.
- Navigation links or pill buttons where a fill sweep is more communicative than a simple color tint change.
- Submit or "Send message" buttons where icon motion (an arrow nudging right, a paper-plane launching) reinforces what will happen.
- When a site has already established playful physicality elsewhere (custom cursor, scroll-linked parallax) and buttons need to match that register.

---

## When NOT to use

- **Every button on every page.** Magnetic pull applied globally makes the page feel restless; it belongs on one or two focal CTAs, not on every chip, tab, or form submit. This is the most common overuse pattern — a "look ma, no hands" flex that wears out quickly.
- Form inputs, error states, or confirmation dialogs where the user needs calm and precision — kinetic chrome is distracting here.
- Dense data tables or dashboards where buttons appear in every row; the motion fires dozens of times per scroll and creates a strobing effect.
- Any context where the button must be legible at a glance for users under time pressure (checkout flows, emergency actions).
- When `prefers-reduced-motion` adoption would strip the entire effect — ensure the button is still clearly interactive without it.

---

## How it works

### Magnetic pull

The page listens for `pointermove` (or `mousemove`) on or near the button element. On each event, the code computes the offset between the cursor position and the button's center using `getBoundingClientRect()`:

```
x_offset = pointerX − (rect.left + rect.width / 2)
y_offset = pointerY − (rect.top  + rect.height / 2)
```

That offset is then scaled by a strength factor (typically 0.2–0.4) and applied as a `translate(x, y)` on the button — or on a separate inner span to produce a parallax-split effect. On `pointerleave`, the offset resets to zero with an elastic or spring easing (e.g., `cubic-bezier(0.16, 1, 0.3, 1)` — expo-out) so the snap-back feels physical rather than abrupt.

**Key constraint:** The effect must be wrapped in `@media (hover: hover) and (pointer: fine)` — on touch screens there is no persistent cursor, so the listener would fire on tap-and-drag, producing a broken, stuttering animation.

### Fill/sweep hover

A `::before` pseudo-element is positioned absolutely across the full button surface with `z-index` behind the text. In its default state it is scaled to zero on the X axis with `transform: scaleX(0)` and a `transform-origin` set to the side the fill enters from (left for left-to-right, center for an iris expand). On `:hover`, the scale transitions to 1. Because only `transform` is animated, no layout is triggered.

An alternative uses `background-position` shift: the background is sized to 200% width with a gradient, and on hover the position shifts from `0%` to `100%` across a `transition`. This produces a color-wash sweep without a pseudo-element.

### Icon motion

An `<svg>` or icon font element inside the button receives a `transform` transition on hover — common treatments include:
- `translateX(4px)` on a right-arrow to suggest forward navigation.
- `rotate(45deg)` on a plus sign to suggest an open/expand state.
- `translateY(-2px) rotate(-45deg)` on an up-arrow for submission.

Critically the icon must never carry meaning that the button label does not also carry — screen readers see the label, not the motion.

---

## Working code

### Variant 1: Fill sweep button (vanilla CSS, no JS)

Complete, self-contained HTML document.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fill sweep button</title>
  <style>
    /* ─── Reset & canvas ─────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      gap: 2rem;
      background: #0d0d10;
      font-family: "Geist", "General Sans", system-ui, sans-serif;
    }

    /* ─── Base button ────────────────────────────── */
    .btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 2rem;
      border: 1.5px solid #e2e2e8;
      border-radius: 100px;       /* pill */
      background: transparent;
      color: #e2e2e8;
      font-size: 0.9375rem;
      font-weight: 500;
      letter-spacing: 0.01em;
      cursor: pointer;
      overflow: hidden;
      /* GPU hint — set only on the interactive elements, not globally */
      will-change: transform;
      transition: color 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                  border-color 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* ─── Fill layer (::before) ──────────────────── */
    .btn::before {
      content: "";
      position: absolute;
      inset: 0;
      background: #e2e2e8;
      /* Start collapsed from the left edge */
      transform: scaleX(0);
      transform-origin: 0 50%;
      transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 0;
    }

    /* ─── Hover — only on pointer-capable devices ── */
    @media (hover: hover) and (pointer: fine) {
      .btn:hover::before {
        transform: scaleX(1);
      }
      .btn:hover {
        color: #0d0d10;
        border-color: #e2e2e8;
      }
      /* icon nudges right on hover */
      .btn:hover .btn__icon {
        transform: translateX(3px);
      }
    }

    /* ─── Focus visible ring ─────────────────────── */
    /* #e2e2e8 on #0d0d10 background → contrast ~14:1 (well above 3:1 WCAG SC 2.4.11) */
    .btn:focus-visible {
      outline: 2.5px solid #e2e2e8;
      outline-offset: 3px;
    }
    .btn:focus:not(:focus-visible) {
      outline: none;
    }

    /* ─── Content above fill layer ───────────────── */
    .btn__text,
    .btn__icon {
      position: relative;
      z-index: 1;
    }
    .btn__icon {
      display: inline-flex;
      align-items: center;
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* ─── Reduced motion: keep color shift, kill sweep ── */
    @media (prefers-reduced-motion: reduce) {
      .btn,
      .btn::before,
      .btn__icon {
        transition: none;
      }
      /* Static fill on focus/hover instead of sweeping */
      @media (hover: hover) and (pointer: fine) {
        .btn:hover::before {
          transform: scaleX(1);   /* fill appears instantly, no sweep */
        }
      }
    }

    /* ─── Active / pressed state ────────────────── */
    .btn:active {
      transform: scale(0.97);
    }
    @media (prefers-reduced-motion: reduce) {
      .btn:active { transform: none; }
    }
  </style>
</head>
<body>

  <button class="btn" type="button">
    <span class="btn__text">View case study</span>
    <span class="btn__icon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
           xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor"
              stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
  </button>

  <button class="btn" type="submit">
    <span class="btn__text">Send message</span>
    <span class="btn__icon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
           xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path d="M1 1l12 6L1 13V8l8-1-8-1V1z"
              stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
  </button>

</body>
</html>
```

### Variant 2: Magnetic pull (vanilla JS + CSS)

Self-contained document. The magnetic effect is JS-gated behind `matchMedia` for hover/pointer and reduced-motion detection, so touch devices and motion-sensitive users get a clean static button.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Magnetic button</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0d0d10;
      font-family: "Geist", "General Sans", system-ui, sans-serif;
    }

    /*
      Outer wrapper is the "detection zone" — larger than the button itself.
      The JS listens on this zone; the inner .btn-inner translates on move.
    */
    .mag-wrap {
      display: inline-block;
      /* Generous padding = detection zone for the magnet */
      padding: 2.5rem;
    }

    .mag-btn {
      /* Reset button defaults */
      appearance: none;
      -webkit-appearance: none;
      border: none;
      background: none;
      padding: 0;
      cursor: pointer;
      font: inherit;
    }

    .mag-btn__inner {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 2.25rem;
      border-radius: 100px;
      background: #e2e2e8;
      color: #0d0d10;
      font-size: 0.9375rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      /* The translate will be applied via JS — transition handles snap-back only */
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      will-change: transform;
    }

    .mag-btn__icon {
      display: inline-flex;
      align-items: center;
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Hover-only icon nudge (no-JS enhancement) */
    @media (hover: hover) and (pointer: fine) {
      .mag-btn:hover .mag-btn__icon {
        transform: translateX(3px);
      }
    }

    /* Focus ring */
    /* #0d0d10 text on #e2e2e8 surface → contrast ~14:1 (passes 4.5:1 AA text contrast) */
    /* Focus outline: #e2e2e8 on #0d0d10 page → ~14:1, passes WCAG SC 2.4.11 (3:1 needed) */
    .mag-btn:focus-visible {
      outline: 2.5px solid #e2e2e8;
      outline-offset: 4px;
      border-radius: 100px;
    }
    .mag-btn:focus:not(:focus-visible) { outline: none; }

    /* Active/pressed */
    .mag-btn:active .mag-btn__inner {
      transform: scale(0.96) !important; /* override JS translate on press */
    }

    /* Reduced motion: disable transition on .mag-btn__inner so JS changes are instant */
    @media (prefers-reduced-motion: reduce) {
      .mag-btn__inner,
      .mag-btn__icon {
        transition: none;
      }
    }
  </style>
</head>
<body>

  <div class="mag-wrap" data-magnetic>
    <button class="mag-btn" type="button">
      <span class="mag-btn__inner">
        <span>Start building</span>
        <span class="mag-btn__icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
               xmlns="http://www.w3.org/2000/svg" focusable="false">
            <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor"
                  stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </span>
    </button>
  </div>

  <script>
    (function () {
      /* Guard: skip on touch/no-hover devices AND when motion is reduced */
      const canHover  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const reduced   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!canHover || reduced) return; /* bail — no magnetic effect needed */

      const STRENGTH = 0.35; /* 0 = no pull, 1 = cursor-tracking (too much) */

      document.querySelectorAll('[data-magnetic]').forEach(function (wrap) {
        const inner = wrap.querySelector('.mag-btn__inner');
        if (!inner) return;

        /* Track whether pointer is inside the detection zone */
        let active = false;

        wrap.addEventListener('pointermove', function (e) {
          const rect    = wrap.getBoundingClientRect();
          /* Offset from wrapper centre */
          const xOffset = e.clientX - (rect.left + rect.width  / 2);
          const yOffset = e.clientY - (rect.top  + rect.height / 2);

          /* Apply scaled translate to the inner element only */
          inner.style.transform =
            'translate(' +
            (xOffset * STRENGTH).toFixed(2) + 'px, ' +
            (yOffset * STRENGTH).toFixed(2) + 'px)';

          active = true;
        });

        wrap.addEventListener('pointerleave', function () {
          if (!active) return;
          /* Reset — the CSS transition handles the spring snap-back */
          inner.style.transform = 'translate(0px, 0px)';
          active = false;
        });
      });
    })();
  </script>

</body>
</html>
```

### Variant 3: React + Framer Motion (production — magnetic + fill sweep combined)

This snippet imports from Framer Motion and is intended for a React project. `useReducedMotion` from Framer Motion reflects the OS-level preference automatically.

```jsx
// MagneticButton.jsx
// Requires: framer-motion ≥ 11, React ≥ 18
import React, { useRef, useState } from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";

/**
 * MagneticButton
 *
 * Props:
 *   children      — button label (string or node)
 *   icon          — optional SVG element; aria-hidden applied automatically
 *   onClick       — click handler
 *   type          — button type (default "button")
 *   strength      — magnetic pull factor 0–1 (default 0.3)
 *   className     — additional classes passed to the outer wrapper
 */
export function MagneticButton({
  children,
  icon,
  onClick,
  type = "button",
  strength = 0.3,
  className = "",
}) {
  const wrapRef   = useRef(null);
  const shouldReduce = useReducedMotion(); /* Framer reads OS prefers-reduced-motion */

  /* Spring values for magnetic translate */
  const springConfig = { stiffness: 180, damping: 18, mass: 0.1 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  /* Framer Motion spring-based translate — resolves to transform string */
  const xPx = useTransform(x, (v) => `${v}px`);
  const yPx = useTransform(y, (v) => `${v}px`);

  /* Fill sweep state */
  const [hovered, setHovered] = useState(false);

  function handlePointerMove(e) {
    if (shouldReduce) return; /* no magnetic pull when user prefers reduced motion */
    /* Check the device can hover — JS guard supplements the CSS one */
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const rect    = wrapRef.current.getBoundingClientRect();
    const xOffset = e.clientX - (rect.left + rect.width  / 2);
    const yOffset = e.clientY - (rect.top  + rect.height / 2);

    x.set(xOffset * strength);
    y.set(yOffset * strength);
  }

  function handlePointerLeave() {
    x.set(0);
    y.set(0);
    setHovered(false);
  }

  function handlePointerEnter() {
    setHovered(true);
  }

  /* Fill sweep animation variants */
  const fillVariants = {
    rest:    { scaleX: 0, originX: "0%" },
    hovered: {
      scaleX: 1,
      originX: "0%",
      transition: { duration: shouldReduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] },
    },
  };

  /* Icon nudge variants */
  const iconVariants = {
    rest:    { x: 0 },
    hovered: {
      x: shouldReduce ? 0 : 3,
      transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    /* Detection zone wrapper — larger than the visual button */
    <div
      ref={wrapRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={{ display: "inline-block", padding: "2.5rem" }}
      className={className}
    >
      <motion.button
        type={type}
        onClick={onClick}
        animate={hovered ? "hovered" : "rest"}
        style={{
          /* Magnetic translate applied here */
          x: xPx,
          y: yPx,
          /* Base styles — typically handled by a global CSS class in production */
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.875rem 2rem",
          border: "1.5px solid #e2e2e8",
          borderRadius: "100px",
          background: "transparent",
          color: hovered ? "#0d0d10" : "#e2e2e8",
          fontSize: "0.9375rem",
          fontWeight: 500,
          letterSpacing: "0.01em",
          cursor: "pointer",
          overflow: "hidden",
          transition: "color 0.28s cubic-bezier(0.16,1,0.3,1)",
          /* Remove default button outline — we supply :focus-visible below */
          outline: "none",
          /* Focus ring applied via data attribute + CSS below */
        }}
        /* Make focus ring keyboard-only */
        data-focus-ring
      >
        {/* Fill sweep layer */}
        <motion.span
          variants={fillVariants}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "#e2e2e8",
            zIndex: 0,
            transformOrigin: "0 50%",
          }}
        />

        {/* Label */}
        <span style={{ position: "relative", zIndex: 1 }}>{children}</span>

        {/* Icon with nudge */}
        {icon && (
          <motion.span
            variants={iconVariants}
            aria-hidden="true"
            style={{ position: "relative", zIndex: 1, display: "inline-flex" }}
          >
            {icon}
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}

/*
  Usage:
  <MagneticButton
    icon={<ArrowRightIcon />}
    onClick={() => router.push("/work")}
  >
    View all projects
  </MagneticButton>

  Required global CSS for focus-visible ring:
  [data-focus-ring]:focus-visible {
    outline: 2.5px solid #e2e2e8;
    outline-offset: 3px;
    border-radius: 100px;
  }
  [data-focus-ring]:focus:not(:focus-visible) { outline: none; }
*/
```

---

## Variations

| Variant | What changes |
|---|---|
| **Left-to-right fill sweep** | `scaleX(0)` → `scaleX(1)`, `transform-origin: 0 50%`. Default: direct, purposeful. |
| **Center iris expand** | `scale(0)` → `scale(1)`, `transform-origin: 50% 50%`, `border-radius: 50%` → `0`. Feels like a ripple without requiring a JS ripple library. |
| **Top-down curtain** | `scaleY(0)` → `scaleY(1)`, `transform-origin: 50% 0`. Works on tall CTA tiles. |
| **Magnetic text-only** | Apply the `translate` only to the text span inside a fixed border button — the pill stays put while its label floats. Subtler than moving the whole element. |
| **Parallax split** | The button border stays fixed; the inner content translates at `strength 0.3`; a background blob translates at `strength 0.5`. Three layers at different speeds. |
| **Spring icon launch** | On click (not hover), the icon fires out in the direction of the associated action then snaps back; the button itself does not move. Works well on "Send" or "Upload" actions. |

---

## Accessibility

### prefers-reduced-motion (mandatory)

All motion — magnetic translate, sweep transition, icon nudge, active scale — must be suppressed or replaced when the user has requested reduced motion.

```css
/* Method A: progressive enhancement (preferred for fill sweep) */
/* Define the static state as the default; add motion only for no-preference users */
.btn::before {
  transform: scaleX(0);
  /* No transition by default */
}
@media (prefers-reduced-motion: no-preference) {
  .btn::before {
    transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .btn__icon {
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

/* Method B: strip motion after (simpler for existing codebases) */
@media (prefers-reduced-motion: reduce) {
  .btn,
  .btn::before,
  .btn__icon {
    transition: none !important;
    animation: none !important;
    transform: none !important;
  }
  /* The fill still appears on hover — just instantly, as a color change */
  @media (hover: hover) and (pointer: fine) {
    .btn:hover::before { transform: scaleX(1); }
  }
}
```

The JS magnetic effect must also be gated:
```js
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) return; /* exit before attaching pointermove listener */
```

For React with Framer Motion, `useReducedMotion()` returns `true` when the OS setting is on; pass `duration: 0` to transitions and skip the spring coordinates.

### Touch and pointer fallback

Wrap all hover-triggered CSS in `@media (hover: hover) and (pointer: fine)`. This single guard covers:
- iOS and Android touchscreens (hover: none)
- Stylus-only tablets (pointer: fine but hover: none or hover: hover unreliable)
- Smart TVs / remote controls (pointer: coarse)

On devices that fail the guard, the button renders in its default visual state and relies on the active (`:active`) press state and `:focus-visible` ring for feedback. That is sufficient and intentional — no hover state should be required for a button to be usable.

### Keyboard and ARIA

The element must be a real `<button>` (or `<a href>` if it navigates). Per the [ARIA Authoring Practices Guide Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/):
- Native `<button>` carries `role="button"` implicitly — do not apply it redundantly on a `<div>`.
- Space and Enter both activate a `<button>` natively; a `<div role="button">` requires explicit `keydown` handling for both keys.
- Any icon inside the button must have `aria-hidden="true"` and `focusable="false"` on the SVG.
- If the icon carries unique information not present in the label, add it to the label via `aria-label` on the button itself, not on the icon.

### Contrast — states used in this file's code

| Pair | Hex values | Approximate contrast | Requirement |
|---|---|---|---|
| Label text on default button (`#e2e2e8` on `#0d0d10`) | text / bg | ~14.1:1 | AA text: 4.5:1 — passes |
| Label text on filled button (`#0d0d10` on `#e2e2e8`) | text / bg | ~14.1:1 | AA text: 4.5:1 — passes |
| Focus ring (`#e2e2e8`) against page (`#0d0d10`) | ring / bg | ~14.1:1 | Non-text SC 2.4.11: 3:1 — passes |

Note: `#e2e2e8` is a near-white (L ~89 in OKLCH); `#0d0d10` is near-black (L ~5). These are the exact colors used in all code blocks above.

### Focus ring

Use `:focus-visible` so the ring appears for keyboard/sequential focus but is suppressed for mouse clicks (where press feedback is visual). Never suppress the outline entirely. Minimum: a 2px solid outline with at least 3:1 contrast against its adjacent background (WCAG SC 2.4.11, AA in WCAG 2.2).

```css
.btn:focus-visible {
  outline: 2.5px solid #e2e2e8;
  outline-offset: 3px;
  border-radius: 100px; /* match button shape */
}
.btn:focus:not(:focus-visible) { outline: none; }
```

### Screen-reader implications

Magnetic and sweep animations are purely visual; no `aria-live` regions or role changes are needed. The button's accessible name (its text content) must describe the action, not the animation: "View case study" not "Click the animated button". Never change the button label dynamically on hover — it confuses assistive technology.

---

## Performance

- **Animate only `transform` and `opacity`.** The fill sweep uses `scaleX` on a pseudo-element — no width, height, background-size, or left/right changes that would trigger layout or paint. The magnetic translate updates `transform` only.
- **`will-change: transform` is useful but not free.** Apply it only to the elements that actually animate (the inner button or the `::before` pseudo-element), not globally. Each `will-change` creates a new compositing layer; too many layers increase VRAM usage and compositor overhead. Remove it on `pointerleave` if you set it dynamically in JS.
- **`pointermove` fires at the display refresh rate** — on a 120Hz screen that is 120 events/second. If you run heavy computation inside the handler, throttle it with `requestAnimationFrame`. For pure `transform` updates the cost is negligible; for GSAP `quickTo`, the library already batches to rAF.
- **Spring physics libraries add bundle weight.** Framer Motion's `useSpring` is included in the `motion` bundle (~50 kB gzipped for the full import; ~13 kB if you use the tree-shakeable `motion/react` subpath in Framer Motion v11+). GSAP's core + quickTo is ~28 kB gzipped. Vanilla CSS transitions with a well-chosen `cubic-bezier` are zero overhead and cover 80% of the visual effect.
- **No `getBoundingClientRect` calls on every pixel of movement** — cache the rect on `pointerenter` and only re-query on resize (`ResizeObserver`) rather than recomputing inside every `pointermove` callback.

```js
/* Optimised: cache rect on entry, invalidate on resize */
let rect;
const ro = new ResizeObserver(() => { rect = null; });
ro.observe(wrap);

wrap.addEventListener('pointerenter', () => {
  rect = wrap.getBoundingClientRect();
});
wrap.addEventListener('pointermove', (e) => {
  if (!rect) rect = wrap.getBoundingClientRect();
  /* ... use cached rect ... */
});
```

---

## Anti-slop

**The cliché (MOTION bucket in `_slop-blocklist.md`):** applying the magnetic pull to every button, nav link, and icon on the page with identical strength, identical duration, and the default `ease` easing. The result is a page that never rests — every element flops toward the cursor simultaneously, which reads as "I copied a CodePen" rather than "I made a considered decision."

**The tasteful version:**
- Reserve magnetic pull for one or two focal CTAs — the primary hero button and perhaps a floating "back to top" element. Let everything else be still.
- Use a custom spring easing (`cubic-bezier(0.16, 1, 0.3, 1)` — expo-out, or a real spring via Framer Motion) rather than default `ease` or `ease-in-out`. The snap-back should feel like a physical tether releasing, not a CSS transition stopping.
- Keep the strength factor low (0.25–0.35). A button that moves 8px feels playful; one that moves 30px feels broken.
- Pair the magnetic pull with real microcopy: "View the process" with an arrow, not "Click here." The motion should reinforce the copy's direction, not substitute for it.
- On the fill sweep: use a brand hue as the fill, not a generic white-on-dark. A single committed hue sweeping across is far more designed than a purple-to-pink gradient on a generic SaaS blue button (see Color bucket, `_slop-blocklist.md`).

---

## Pairs well with

- **`custom-cursor`** — magnetic buttons and a custom cursor are complementary; the cursor can shrink or blend into the button surface as the pointer enters the detection zone, creating an absorption effect.
- **`staggered-entrance`** — if the button enters the viewport with a staggered reveal alongside its sibling elements, use the same expo-out easing so the motion language is consistent.
- **`text-reveal-on-scroll`** — a hero section that reveals its headline line by line naturally culminates in a magnetic CTA; the kinetic energy carries from text to button.
- **`editorial-typographic`** — display-weight type makes the magnetic button feel earned and contextually weighty rather than decorative.
- **`hover-image-reveal`** — pairing a magnetic CTA with an image that reveals on hover of a nearby link creates a spatially cohesive hover zone where multiple elements respond to the same pointer position.

---

## Current references

- [Button Pattern — ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/patterns/button/) — authoritative source on role, keyboard (Space/Enter), aria-pressed, and focus management requirements
- [hover CSS media feature — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover) — syntax, values, and browser support for `@media (hover: hover)` pointer detection (baseline since December 2018)
- [pointer CSS media feature — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer) — `pointer: fine` vs `pointer: coarse` for distinguishing mouse from stylus/touch
- [prefers-reduced-motion — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — syntax, values, OS settings paths, and progressive enhancement approach (baseline since January 2020)
- [A Guide to Hover and Pointer Media Queries — Smashing Magazine](https://www.smashingmagazine.com/2022/03/guide-hover-pointer-media-queries/) — practical recommendations including combined `(hover:hover) and (pointer:fine)` and the 48px minimum touch target note
- [Magnetic Buttons — Codrops](https://tympanus.net/codrops/2020/08/05/magnetic-buttons/) — canonical visual reference; four demos covering border animation, fill, shadow parallax, and text-split approaches; [GitHub source](https://github.com/codrops/MagneticButtons)
- [2 Ways to Make Magnetic Buttons using React, GSAP, Framer Motion — Olivier Larose](https://blog.olivierlarose.com/tutorials/magnetic-button) — side-by-side imperative (GSAP `quickTo`, `elastic.out(1, 0.3)`) vs declarative (Framer Motion spring stiffness: 150 damping: 15) breakdown with `getBoundingClientRect` offset math
- [No Motion Isn't Always prefers-reduced-motion — CSS-Tricks](https://css-tricks.com/nuking-motion-with-prefers-reduced-motion/) — argument for opacity/color alternatives instead of blanket `animation: none`; relevant for choosing the static fill fallback
- [A guide to designing accessible, WCAG-conformant focus indicators — Sara Soueidan](https://www.sarasoueidan.com/blog/focus-indicators/) — depth treatment of WCAG SC 2.4.11 (Focus Appearance), 3:1 contrast requirement, and `outline-offset` recommendations
- [Understanding SC 2.4.11: Focus Appearance — W3C WAI](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance) — normative WCAG 2.2 text on focus indicator area, contrast, and the exceptions for user-agent defaults
- [When is it "Right" to Reach for contain and will-change in CSS? — CSS-Tricks](https://css-tricks.com/when-is-it-right-to-reach-for-contain-and-will-change-in-css/) — guidance on when `will-change` helps (pre-promoting for interaction) and when it wastes compositing memory
