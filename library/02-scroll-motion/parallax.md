# Parallax scrolling

> Background and foreground layers travel at different rates as the page scrolls, faking depth — the far layer lags, the near layer leads, and the gap between them reads as Z-distance.

**Bucket:** scroll/motion
**Maturity:** cycling-back
**Effort:** medium
**Best for:** websites, portfolios, agency/editorial sites, product/landing hero sections

## What it is
Parallax borrows from how the real world looks out a car window: distant hills crawl, the near fence whips past. On a page you map scroll position to a vertical (or horizontal) offset and give different layers different multipliers — the background moves slower than the foreground (or moves in the same direction at a fraction of scroll speed). The brain reads that rate difference as depth. The user perceives a scene with foreground, midground, and background that breathes as they scroll, rather than a flat sheet sliding up. Done with restraint it adds spatial richness; done at full strength it induces motion sickness, which is exactly why the modern version is deliberately subtle.

## When to use
- A hero or full-bleed section where you want depth: a product shot floating over a slower backdrop, layered illustration, or photographic scene.
- Editorial / storytelling pages where a slow-drifting background image sets mood between text blocks.
- Portfolios and agency sites where one or two parallax moments signal craft without carpeting the whole page.
- Decorative imagery only — where the layers carry no information the user must read precisely.

## When NOT to use
- Long content-heavy pages where every section parallaxes — this is the cliche (see Anti-slop). It makes scrolling feel laggy, fights the user's sense of how far they've travelled, and is the classic nausea trigger.
- Anything behind body text. Moving a background under reading copy hurts legibility and contrast and is a recurring WCAG failure.
- Mobile by default. Touch scroll is inertial and event-driven; naive scroll-handler parallax janks badly on phones and drains battery. Either drop to a static layer or use a transform-only, GPU-composited approach — and still test on a mid-range Android.
- When the layer carries meaning (a chart, a label, a CTA) — never gate comprehension on a moving element.
- When `prefers-reduced-motion: reduce` is set — parallax is exactly the large-area, vestibular-triggering motion this setting targets (see WCAG 2.3.3). Fall back to static layers unconditionally.

## How it works
The mechanism is always the same: read scroll progress (0 to 1, or in pixels), multiply by a per-layer factor, and write the result to `transform: translateY()` on that layer. A factor of `0` is pinned, `1` scrolls with the page, and values between lag. The art is in animating **only `transform`** (or `opacity`) so the work stays on the compositor thread and away from layout/paint.

Four ways to drive it, best-supported first:

1. **Native CSS scroll-driven animations** — `animation-timeline: scroll()` links a keyframe animation to a scroll container's progress (great for backgrounds that shift across the whole page); `animation-timeline: view()` links it to an element's own pass through the viewport (great for a foreground element that should only drift while on screen). No JS, runs off the main thread. The `animation-range` property scopes *when* in the scroll the animation plays. **Browser support as of mid-2026:** Chrome/Edge 115+, Safari 26+ (shipped June 2025), Samsung Internet 23+, Opera 101+; Firefox does not yet have stable support (behind a flag, `layout.css.scroll-driven-animations.enabled`). Global coverage: roughly 83% according to caniuse. Wrap in `@supports (animation-timeline: scroll())` and let it be a progressive enhancement — the layout must be fully usable without it.
2. **GSAP ScrollTrigger** — `scrub` ties a tween's progress to scroll position; you tween `y` on each layer with a different end value. The production standard for cross-browser robustness and fine control (`start`/`end`, `ScrollTrigger.refresh()` after layout shift, `scrub` smoothing).
3. **Framer Motion (React)** — `useScroll()` gives a `scrollYProgress` MotionValue; `useTransform()` maps it to per-layer `y`. Clean in React; `useReducedMotion()` hook surfaces the system preference directly.
4. **Lenis smooth scroll** — Lenis does not *do* parallax; it normalises wheel/touch into a smoothed scroll position so parallax driven by GSAP/Framer feels fluid. Pair it with ScrollTrigger via its scroll event and the GSAP ticker: `lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000))`.

`background-attachment: fixed` is the oldest "parallax" shortcut but is not true rate parallax (the background is pinned, not rate-shifted), it is disabled/janky on iOS Safari and most mobile browsers for performance reasons, and it forces expensive repaints on desktop. Use it only as a deliberate fixed-backdrop effect, never for layered depth.

## Working code

### Native CSS, no JS — slow background + leading foreground
True rate difference with zero main-thread work. The backdrop drifts across the whole scroll (`scroll(root block)`); the foreground card lifts only while it's in view (`view()`). **Progressive enhancement:** without `animation-timeline` support the keyframes simply do not apply, so both layers render at their CSS resting position — a fully legible static layout. The `@supports` guard makes this explicit.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Geist", system-ui, sans-serif;
    background: #0b0c10;
    color: #f3f3ef;
  }

  .stage {
    position: relative;
    height: 100vh;
    overflow: hidden;
    display: grid;
    place-items: center;
  }

  /* BACKGROUND — moves slowly across the whole page scroll */
  .bg {
    position: absolute;
    inset: -10% 0;            /* over-size so edges never show at full travel */
    background: radial-gradient(120% 80% at 50% 0%, #1b2a4a 0%, #0b0c10 60%);
  }

  /* FOREGROUND CARD */
  .card {
    position: relative;
    width: min(34rem, 86vw);
    padding: 2.5rem;
    border-radius: 18px;
    background: #14161d;
    border: 1px solid #2a2f3a;
    box-shadow: 0 30px 60px -25px rgb(0 0 0 / 0.7);
  }

  .card h1 { margin: 0 0 .5rem; font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 700; }
  .card p  { margin: 0; color: #b6bcc6; line-height: 1.6; }
  /* #f3f3ef on #14161d: 16.24:1 (WCAG AAA) — body heading */
  /* #b6bcc6 on #14161d:  9.46:1 (WCAG AAA) — supporting copy */

  .pad { height: 60vh; }

  /* MANDATORY: kill all parallax motion when the user requests reduced motion.
     Layers render at their resting CSS position — no transform, no animation. */
  @media (prefers-reduced-motion: reduce) {
    .bg, .card { animation: none !important; transform: none !important; will-change: auto !important; }
  }

  /* Progressive enhancement: parallax only where the API is supported */
  @supports (animation-timeline: scroll()) {
    @media not (prefers-reduced-motion: reduce) {
      .bg {
        will-change: transform;
        animation: drift linear both;
        animation-timeline: scroll(root block); /* progress = full page scroll */
      }
      @keyframes drift {
        from { transform: translateY(-8%); }
        to   { transform: translateY(8%); }   /* small range = gentle, not nauseating */
      }

      .card {
        will-change: transform;
        animation: lift linear both;
        animation-timeline: view();                  /* element's pass through viewport */
        animation-range: entry 0% cover 60%;         /* only while entering/covering */
      }
      @keyframes lift {
        from { transform: translateY(40px); }
        to   { transform: translateY(-40px); }  /* foreground leads the bg */
      }
    }
  }
</style></head>
<body>
  <div class="pad"></div>
  <section class="stage">
    <div class="bg" aria-hidden="true"></div>
    <article class="card">
      <h1>Built in the open</h1>
      <p>The backdrop drifts slowly while this card leads — the rate gap is the depth. No JavaScript involved.</p>
    </article>
  </section>
  <div class="pad"></div>
</body></html>
```

Notes: `scroll(root block)` reads the document's vertical scroll from root to bottom. Keep `translateY` ranges small (±8% bg, ±40px fg) — large ranges are what cause nausea. `will-change: transform` promotes each layer to its own GPU compositing layer; apply it only to the handful of moving elements, never site-wide. The `@supports` + `@media not` double guard ensures the enhancement applies only when both the API and motion preference align.

### GSAP ScrollTrigger + Lenis — production, smoothed, multi-layer
The realistic production choice when you need Safari/Firefox parity today and silky scroll. Each layer gets a different `yPercent` end value (the rate factor). Lenis smooths the wheel input; ScrollTrigger scrubs the tweens. `prefers-reduced-motion` short-circuits everything to a static scene; `pointer: coarse` skips Lenis so touch devices keep their native inertial scroll.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; background: #0b0c10; color: #f3f3ef;
         font-family: "Geist", system-ui, sans-serif; }
  .scene {
    position: relative;
    height: 100vh;
    overflow: hidden;
    display: grid;
    place-items: center;
  }
  .layer {
    position: absolute;
    inset: -15% 0;   /* over-size to hide edge at max travel */
    will-change: transform;
  }
  .far { background: radial-gradient(120% 90% at 50% 10%, #16223d, #0b0c10 65%); }
  .mid { background: radial-gradient(60% 50% at 50% 80%, #243a63 0%, transparent 70%);
         opacity: .7; }
  .fg  {
    position: relative;
    width: min(34rem, 86vw);
    padding: 2.5rem;
    border-radius: 18px;
    background: #14161d;
    border: 1px solid #2a2f3a;
    will-change: transform;
    box-shadow: 0 30px 60px -25px rgb(0 0 0 / 0.7);
  }
  .fg h1 { margin: 0 0 .5rem; font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 700; }
  .fg p  { margin: 0; color: #b6bcc6; line-height: 1.6; }
  /* #f3f3ef on #14161d: 16.24:1 (WCAG AAA) */
  /* #b6bcc6 on #14161d:  9.46:1 (WCAG AAA) */
  .pad { height: 60vh; }
</style>
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.23/dist/lenis.css">
</head>
<body>
  <div class="pad"></div>
  <section class="scene">
    <div class="layer far" aria-hidden="true"></div>
    <div class="layer mid" aria-hidden="true"></div>
    <article class="fg">
      <h1>Layered depth</h1>
      <p>Far layer lags hardest, mid drifts, this card leads. Three planes, one scene.</p>
    </article>
  </section>
  <div class="pad"></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js"></script>
  <script src="https://unpkg.com/lenis@1.3.23/dist/lenis.min.js"></script>
  <script>
    gsap.registerPlugin(ScrollTrigger);

    // Respect system motion preference — WCAG 2.3.3 (AAA) and strong UX baseline.
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Coarse pointer = touch device; skip Lenis smooth-scroll and keep native inertia.
    const coarse = matchMedia('(pointer: coarse)').matches;

    if (!reduce) {
      // Lenis on fine-pointer (mouse/trackpad) only — touch keeps native inertial scroll.
      if (!coarse) {
        const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((t) => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
      }

      // Shared ScrollTrigger config — scope trigger to the scene section.
      const st = { trigger: '.scene', start: 'top bottom', end: 'bottom top', scrub: 0.6 };
      // scrub: 0.6 → 0.6 s catch-up smoothing, far less rigid than scrub: true.
      // ease: 'none' is correct for scrubbed parallax; scroll position IS the easing.

      gsap.to('.far', { yPercent: 12,  ease: 'none', scrollTrigger: st }); // slowest — far bg
      gsap.to('.mid', { yPercent: 22,  ease: 'none', scrollTrigger: st }); // medium — midground
      gsap.fromTo('.fg', { y: 50 }, { y: -50, ease: 'none', scrollTrigger: st }); // leads

      // Recalculate trigger positions after fonts/images shift layout.
      window.addEventListener('load', () => ScrollTrigger.refresh());
    }
    // reduce === true → no tweens run; every element sits at its CSS resting position.
  </script>
</body></html>
```

The `yPercent` values (12 / 22 / -50-to-50) are small enough to register as depth without tipping into nausea territory. Larger values past ~40% create the swimmy one-pager feeling (see Anti-slop).

### Framer Motion (React) — scroll-progress mapped per layer
```jsx
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

export function ParallaxScene() {
  const ref = useRef(null);
  const reduce = useReducedMotion(); // reads prefers-reduced-motion from the OS

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"], // 0 when bottom of ref touches top of view, 1 when it leaves
  });

  // Different output ranges = different rates = depth illusion.
  // When reduce is true both ranges are [0, 0] — no movement at all.
  const yFar = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-40, 40]);
  const yFg  = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [60, -60]);

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        height: "100vh",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
      }}
    >
      {/* Decorative — hidden from AT */}
      <motion.div
        aria-hidden
        style={{
          y: yFar,
          position: "absolute",
          inset: "-15% 0",
          background: "radial-gradient(120% 90% at 50% 10%, #16223d, #0b0c10 65%)",
          willChange: "transform",
        }}
      />

      {/* Foreground card — readable content on an opaque surface */}
      <motion.article
        style={{
          y: yFg,
          position: "relative",
          width: "min(34rem, 86vw)",
          padding: "2.5rem",
          borderRadius: 18,
          background: "#14161d",
          border: "1px solid #2a2f3a",
          willChange: "transform",
        }}
      >
        {/* #f3f3ef on #14161d: 16.24:1 WCAG AAA */}
        <h1 style={{ margin: "0 0 .5rem", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 700 }}>
          Layered depth
        </h1>
        {/* #b6bcc6 on #14161d: 9.46:1 WCAG AAA */}
        <p style={{ margin: 0, color: "#b6bcc6", lineHeight: 1.6 }}>
          Far layer lags; this card leads. Rate gap reads as distance.
        </p>
      </motion.article>
    </section>
  );
}
```

## Variations
- **Driver**: native `scroll()` (whole-page background) vs `view()` (per-element on-screen drift) vs scrubbed GSAP/Framer tween. Mix them: native for the backdrop, GSAP for the foreground card.
- **Axis**: vertical (default), horizontal (in a horizontal-scroll section), or both for a subtle pointer-coupled tilt. Mouse parallax is a related but distinct effect — it must be gated behind `@media (hover: hover) and (pointer: fine)` because touch users have no cursor.
- **Depth count**: two-plane (bg + fg) up to a multi-plane scene (far / mid / near), each with its own factor. More planes equals stronger depth and more compositing cost.
- **Strength knob**: the per-layer `yPercent` end or `translateY` range. Tasteful sits roughly 8–25%; past ~40% it tips into nausea for many users.
- **Scrub vs trigger**: scrub ties the animation to scroll position (reversible, continuous); trigger fires it once when the element enters view. Parallax is almost always scrub.

## Accessibility
- **prefers-reduced-motion is mandatory.** Parallax is large-area vestibular motion — exactly what WCAG 2.3.3 (Animation from Interactions, Level AAA) and this OS preference target. Vestibular disorders affect roughly 35% of people over 40, and macOS/iOS data shows a substantial share of users engage this setting. Every snippet above renders layers at a static resting position and runs no transform when the preference is set: the native CSS version uses `animation: none !important; transform: none !important` inside the media query; the GSAP version guards the entire animation block behind `if (!reduce)`; the Framer version collapses all output ranges to `[0, 0]` via `useReducedMotion()`.
- **Pointer / touch fallback (mandatory for cursor-driven parallax).** Gate any mouse-cursor parallax behind `@media (hover: hover) and (pointer: fine)` — touch users have no cursor and must get the static or scroll-only layout. The GSAP example also skips Lenis smooth-scroll on `pointer: coarse` so phones keep native inertial scroll rather than fighting it.
- **Contrast / legibility.** Never place a moving layer behind text the user must read. In the examples above, all copy sits on the opaque `#14161d` card surface, not on the drifting backdrop. The measured ratios for colors used in this file's code: `#f3f3ef` on `#14161d` = **16.24:1** (exceeds WCAG AAA 7:1 for body); `#b6bcc6` on `#14161d` = **9.46:1** (exceeds WCAG AAA). A drifting backdrop would allow momentary low-contrast pairings as the gradient shifts; keeping text off it eliminates that risk.
- **Focus / keyboard.** Parallax is decorative; mark moving layers `aria-hidden="true"` and keep them out of the tab order. Do not let a parallax transform move a focusable element away from where its visible focus ring appears.
- **Screen readers / no-JS.** Content must be fully present and readable without the animation. The native CSS degrades to a static layout automatically. The JS versions render the resting layout first and only enhance — meaning is never gated on motion running.

## Performance
- **Transform/opacity only.** Animating `top`, `background-position`, or `margin` triggers layout and paint on every frame. CSS-Tricks' classic parallax demo animates `background-position`; prefer `translateY` / `translate3d` as shown here so work stays on the compositor thread.
- **Layer promotion, sparingly.** `will-change: transform` (or a `translate3d(0,0,0)` nudge) gives each moving element its own GPU compositing layer. Apply it only to the 2–4 moving elements — never site-wide — because over-promotion bloats GPU memory and can actively hurt performance.
- **Mobile is the trap.** Scroll-handler parallax fires constantly on touch and stutters on mid-range Androids; battery and jank both suffer. Native `scroll()`/`view()` run off the main thread (best on supported browsers), but still cap layer count and offset range on small screens. The GSAP example skips Lenis entirely on `pointer: coarse`.
- **Scrub smoothing.** Use `scrub: 0.5–1` (catch-up) rather than `scrub: true` (rigid 1:1 coupling) — smoother feel and less jarring on the vestibular system.
- **Layout shift.** Call `ScrollTrigger.refresh()` after fonts/images load or any reflow occurs, or trigger positions drift from where they were calculated.
- **Bundle cost.** Native CSS = 0 KB JS. Lenis v1.3 ≈ 10 KB gzipped; GSAP core + ScrollTrigger ≈ 40–50 KB gzipped; Framer Motion full bundle is heavier — do not pull it in solely for parallax if you are not already using it in the project.
- **background-attachment: fixed.** Disabled on iOS Safari and most mobile browsers for performance reasons; forces full-page repaints on desktop. It is not a viable parallax strategy and should not appear in new builds.

## Anti-slop
Cliche (see `_slop-blocklist.md` → MOTION): the whole page parallaxing — every section's background sliding at a different speed with large offsets and rigid 1:1 scrub, so scrolling feels swimmy and you cannot tell how far you have gone. It is the 2014 one-pager look and the textbook nausea generator.

The fix: pick **one or two** parallax moments across the entire page, not a carpet of them. Keep offsets small (8–25%) so depth reads without the floor moving under you. Vary *which* layers move and by how much (far slow, near leading) rather than pushing everything at once. Add catch-up smoothing (`scrub: 0.6`) rather than rigid coupling. Reserve expressive easing like `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out spring) for the scroll-triggered reveals that accompany the parallax moment — scrubbed parallax should use `ease: 'none'` because scroll position is already the easing. Restraint is the entire difference between "spatial depth" and "seasick."

## Pairs well with
- `sticky-pinning` — pin a section and parallax its layers while it holds; the cinematic version of this effect.
- `text-reveal-on-scroll` — a slow parallax backdrop behind text that masks up as you arrive at the section.
- `scroll-progress-indicator` — restores the "how far have I scrolled" cue that heavy parallax muddles.
- `staggered-entrance` — use the same easing language (expo-out, spring) for triggered reveals that fire inside a parallax scene.

## Current references
- [Bringing Back Parallax With Scroll-Driven CSS Animations — CSS-Tricks](https://css-tricks.com/bringing-back-parallax-with-scroll-driven-css-animations/) — the canonical native `scroll()`/`view()` parallax walkthrough; note it animates `background-position` and `top` rather than `transform` — prefer transforms as shown here.
- [CSS scroll-driven animations — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations) — `scroll()`/`view()`, `animation-range`, `@supports` feature detection, and the full browser-compatibility table.
- [A guide to Scroll-driven Animations with just CSS — WebKit Blog](https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/) — Safari 26 implementation perspective and `animation-range` syntax from the WebKit team (June 2025).
- [Scroll-Driven Animations — Josh W. Comeau](https://www.joshwcomeau.com/animation/scroll-driven-animations/) — clear mental model for `scroll()` vs `view()`, animation-range, and the difference between scroll-linked and scroll-triggered (April 2026).
- [Scroll-driven animations — Can I use](https://caniuse.com/wf-scroll-driven-animations) — live support table; ~83% global coverage as of mid-2026 (Chrome/Edge 115+, Safari 26+, Firefox not yet stable).
- [Introduction to CSS Scroll-Driven Animations — Smashing Magazine](https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations/) — scroll vs view progress timelines with progressive-enhancement patterns (December 2024).
- [Lenis — darkroomengineering (GitHub)](https://github.com/darkroomengineering/lenis) — current smooth-scroll lib (v1.3.x), GSAP ticker integration, `autoRaf` and `prevent` options; note `smoothTouch` was removed in v1.0.
- [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) — `scrub`, `start`/`end`, `ScrollTrigger.refresh()`, `isTouch` device detection.
- [Framer Motion — scroll-linked animations](https://www.framer.com/motion/scroll-animations/) — `useScroll`, `useTransform`, `useReducedMotion`.
- [WCAG 2.3.3: Animation from Interactions — W3C](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) — the success criterion that mandates motion can be disabled; parallax is the named example.
- [Vestibular issues in parallax design — WebAxe](https://www.webaxe.org/vestibular-issues-parallax-design/) — accessible design rationale for why parallax is the highest-risk scroll effect.
