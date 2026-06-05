# Staggered entrance

> A group of elements — cards, list items, nav links — animates in one after another with a small per-item delay, so the eye is led across the set instead of hit with everything at once.

**Bucket:** scroll/motion
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, apps, dashboards, carousels

## What it is
When a collection enters view, each member starts its entrance a beat after the
previous one — item 1 at 0 ms, item 2 at ~60 ms, item 3 at ~120 ms, and so on.
The motion per item is usually tiny (a short fade plus a few pixels of rise), but
the *sequencing* is what reads as intentional: the group resolves as a wave rather
than a flash. The user perceives order and hierarchy ("read these left-to-right,
top-to-bottom") without any explicit instruction.

The knob that separates "designed" from "generated" is the stagger step itself.
Too small (under ~30 ms) and it collapses into a uniform fade; too large (over
~150 ms on more than a handful of items) and the last item arrives so late it feels
broken. The sweet spot for a grid of cards is roughly **50–90 ms** per item with a
**total** entrance under ~700 ms.

## When to use
- A grid or row of cards, a feature list, a nav menu, or a set of stats that all
  enter the viewport together and benefit from being read in sequence.
- The first paint of a dashboard or app view, to soften a dense layout snapping in.
- Carousel/gallery items revealing as a track scrolls into place.
- Anywhere you want to imply reading order or priority without changing layout.

## When NOT to use
- **Long lists** (20+ rows). A linear per-item delay means the last row waits
  `n × step` ms — at 60 ms × 30 that is 1.8 s of nothing. Cap the count, or animate
  only items in the first viewport and let the rest appear instantly (GSAP
  `ScrollTrigger.batch` does this for you).
- Content the user is waiting to act on — a search-results list or a checkout
  summary should be present and clickable now, not choreographed.
- Above-the-fold critical content where perceived speed and LCP matter; if you must
  animate it, keep the whole sequence under ~400 ms.
- **The overuse warning:** everyone reaches for "fade-and-slide-up, same 0.6 s,
  same `ease`, on *every* group on the page." That uniform slop is the #1 AI motion
  tell. Reserve staggered entrance for a few meaningful groups and vary the easing
  and which axis moves (see Anti-slop).
- When `prefers-reduced-motion: reduce` is set — fall back to the final visible
  state with no transform and no per-item delay.

## How it works
Mechanically, every item runs the *same* short entrance animation
(`opacity` + `transform`), but each one's **start time** is offset by its index in
the group. There are four production routes, best-supported first for the trigger
and best-DX last:

1. **Native CSS — `view()` timeline + per-item delay.** `animation-timeline: view()`
   ties an item's animation progress to its own pass through the viewport, no JS.
   You offset each item by shifting its `animation-range` so later items begin their
   pass later — or, with the newer `calc(sibling-index() * step)`, the browser
   computes each item's range offset automatically.
   - `view()` / `scroll()` timelines: Chromium since 115 (2023) and **Safari 26**
     (Sept 2025); Firefox supports them but only behind the
     `layout.css.scroll-driven-animations.enabled` flag as of mid-2026, so
     progressive-enhance.
   - `sibling-index()` in `calc()`: Chrome/Edge **137+** and Safari Technology
     Preview only as of mid-2026 — newer than the timelines. Always wrap it in
     `@supports` with a hand-numbered or JS fallback.
2. **GSAP + ScrollTrigger** with a `stagger` value, and `ScrollTrigger.batch()`
   when items enter in clusters. The production standard: cross-browser, handles
   "only animate what's on screen," and reverse/replay control. GSAP **3.13** is
   the current free release (all plugins, including SplitText, went 100% free in
   April 2025 via Webflow).
3. **Motion (formerly Framer Motion)** for React: a parent variant with
   `staggerChildren` orchestrates child variants. Clean DX, built-in reduced-motion.
4. **Lenis** is *not* an entrance tool — it smooths the scroll itself. Pair it under
   any of the above if you want the page's scroll velocity to feel weighted; it does
   not produce the stagger.

## Working code

### Native CSS — `view()` timeline, hand-indexed delay (widest support)
Each card animates as it scrolls into view. Delays are applied with explicit
`--i` custom properties so it runs everywhere `view()` is supported today
(Chromium + Safari 26), degrading to instant-visible elsewhere.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { --ease-expo: cubic-bezier(0.16, 1, 0.3, 1); }
  body { margin:0; font-family: system-ui, sans-serif;
         background:#0e0e12; color:#f4f4f8; }
  .spacer { height: 80vh; }
  .grid { display:grid; gap:1rem; max-width:60rem; margin:0 auto; padding:0 1.5rem;
          grid-template-columns: repeat(3, 1fr); }
  .card { background:#191920; border:1px solid #2a2a33; border-radius:14px;
          padding:1.5rem; min-height:9rem; }

  /* Base = the FINAL visible state. JS-free, SEO-safe: content is here even if
     the animation never runs. The animation plays FROM a hidden offset TO this. */
  .card {
    animation: enter both var(--ease-expo);
    animation-timeline: view();
    /* start when the card's top reaches 15% into the viewport, finish by 45% */
    animation-range: entry 5% cover 30%;
    /* Firefox needs a non-zero duration even with a timeline; harmless elsewhere */
    animation-duration: 1ms;
  }
  /* per-item offset: shift each card's range later by its index */
  .card:nth-child(1) { animation-range: entry 5%  cover 30%; }
  .card:nth-child(2) { animation-range: entry 12% cover 37%; }
  .card:nth-child(3) { animation-range: entry 19% cover 44%; }
  .card:nth-child(4) { animation-range: entry 5%  cover 30%; }
  .card:nth-child(5) { animation-range: entry 12% cover 37%; }
  .card:nth-child(6) { animation-range: entry 19% cover 44%; }

  @keyframes enter {
    from { opacity:0; transform: translateY(24px); }
    to   { opacity:1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .card { animation: none; opacity:1; transform:none; }
  }
</style></head>
<body>
  <div class="spacer"></div>
  <section class="grid" aria-label="Featured work">
    <article class="card">Bridgewater rebrand</article>
    <article class="card">Kestrel mobile app</article>
    <article class="card">Foundry type system</article>
    <article class="card">Helio dashboard</article>
    <article class="card">Marlow campaign site</article>
    <article class="card">Quanta data viz</article>
  </section>
  <div class="spacer"></div>
</body></html>
```
With a *view* timeline you don't stagger with `animation-delay` (delay is for
time-based animations); you stagger by **offsetting each item's `animation-range`**
so later items begin their pass later. The result is the same wave with zero JS.

### Native CSS — `calc(sibling-index())`, no hand-numbering (bleeding edge)
Same idea, but the per-item range offset is computed from the element's position in
its parent, so you can add or remove cards without touching CSS. The stagger is
achieved by adding `sibling-index() * 7%` to each boundary of the `animation-range`,
making later siblings start and finish their entrance later in the scroll timeline.
Guarded by `@supports` because `sibling-index()` in `calc()` is Chrome/Edge 137+
and Safari Tech Preview only as of mid-2026 — everyone else gets the instant-visible
fallback.

```css
/* fallback for browsers without sibling-index(): cards are simply visible */
.grid .card { opacity: 1; transform: none; }

@supports (animation-range: entry calc(sibling-index() * 7%) cover calc(30% + sibling-index() * 7%)) {
  .grid .card {
    opacity: 0;
    transform: translateY(24px);
    animation: enter 1ms cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-timeline: view();
    /* index-driven range offset: item 0 starts at entry 0%, item 1 at entry 7%,
       item 2 at entry 14%, and so on — each sibling begins its entrance later
       in the scroll timeline, producing the stagger wave with no JS */
    animation-range:
      entry calc(sibling-index() * 7%)
      cover calc(30% + sibling-index() * 7%);
  }
  @keyframes enter {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .grid .card { opacity:1; transform:none; animation:none; }
  }
}
```

### GSAP — `ScrollTrigger.batch()`, only animates what enters (production)
The realistic choice when you need cross-browser parity *and* "don't animate the
30th card before the user scrolls to it." `batch()` groups elements that cross the
trigger in the same interval and staggers them together; offscreen items wait.

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js"></script>
<script>
gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduce) {
  // Reduced motion: render the final state, no transform, no stagger.
  gsap.set('.card', { opacity: 1, y: 0, clearProps: 'transform' });
} else {
  // Start hidden, then reveal in batches as they scroll in.
  gsap.set('.card', { opacity: 0, y: 24 });

  ScrollTrigger.batch('.card', {
    start: 'top 88%',
    once: true,                 // entrance fires a single time, then settles
    onEnter: (batch) => gsap.to(batch, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      ease: 'expo.out',         // not the default ease — premium settle
      stagger: 0.07,            // 70ms between items in the same batch
      overwrite: true,
    }),
  });
}
</script>
```

### Motion / Framer Motion — `staggerChildren` (React)
A parent variant orchestrates children; `staggerChildren` sets the per-item step and
`delayChildren` an initial pause. `useReducedMotion()` swaps to an instant,
transform-free reveal.

```jsx
import { motion, useReducedMotion } from "motion/react";

export function CardGrid({ items }) {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: reduce
        ? {}                                  // no orchestration when reduced
        : { delayChildren: 0.05, staggerChildren: 0.07 },
    },
  };

  const card = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }   // appear, no movement
    : {
        hidden: { opacity: 0, y: 24 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }, // expo-out
        },
      };

  return (
    <motion.section
      className="grid"
      aria-label="Featured work"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-12% 0px" }}
    >
      {items.map((label, i) => (
        <motion.article key={i} className="card" variants={card}>
          {label}
        </motion.article>
      ))}
    </motion.section>
  );
}
```
Alternatively wrap your app in `<MotionConfig reducedMotion="user">` and Motion will
strip transform/layout animations globally when the OS setting is on — but the
explicit per-component swap above gives you control over the *fallback's* look.

## Variations
- **Direction / origin** — stagger from first, last, center (`stagger: { from: "center" }`
  in GSAP; `staggerDirection: -1` in Motion), or from the cursor/grid coordinates.
  Center-out reads more deliberate than rote top-to-bottom.
- **Per-item motion** — fade-rise (default), fade-scale (0.96 → 1), blur-in
  (`filter: blur(8px) → 0`, costlier), or clip-reveal. Vary the *axis*: a row can
  slide in from the inline-start while a column rises.
- **Step size** — the core knob: ~50–90 ms feels designed; ~30 ms collapses to a
  uniform fade; >150 ms over many items feels laggy.
- **Trigger vs scrub** — fire-once on entry (most entrances) vs tying each item's
  progress to scroll position with a `view()` range or GSAP `scrub` (the item
  "draws in" as you scroll, reverses on scroll-up).
- **Easing** — expo-out `cubic-bezier(0.16, 1, 0.3, 1)` or a spring read far more
  premium than default `ease`; a slight overshoot spring suits playful UIs.

## Accessibility
- **prefers-reduced-motion (mandatory):** every snippet above renders the final
  visible state with no transform and no per-item delay when reduce is set — the
  CSS via `@media (prefers-reduced-motion: reduce)`, GSAP via a `matchMedia` guard
  that `gsap.set`s the resting state, Motion via `useReducedMotion()`. A staggered
  group must never leave content hidden for a reduced-motion user.
- **No motion gate on meaning:** the base/resting CSS state is the *visible* state —
  cards are in the DOM and readable even if the animation never runs or JS fails.
  Don't animate from `display:none` or `visibility:hidden`; animate `opacity`/
  `transform` from a state the layout already reserves space for, so nothing
  reflows and nothing is lost without script.
- **Screen readers:** entrance animation is purely visual; reading order in the DOM
  is unchanged, so SR users get the group immediately. Keep DOM order = intended
  reading order so the stagger (which follows DOM order) matches the spoken order.
- **Keyboard & focus:** never delay *interactivity* with the animation — links and
  buttons inside staggering cards must be focusable and clickable from frame one.
  Watch focus: if a user tabs to item 6 while it is still at `opacity:0`, ensure
  focus styles remain visible (don't animate the focused element's opacity from 0,
  or scope the entrance so a focused/`:focus-within` card snaps to visible).
- **Contrast (resting state):** the resting card uses text `#f4f4f8` on surface
  `#191920`. Relative luminance ≈ 0.910 vs ≈ 0.010, giving a contrast ratio of
  **≈ 16.0:1** — well past WCAG AA (4.5:1) and AAA (7:1) for body text. The *mid-
  animation* low-opacity frames may momentarily dip below AA; that is acceptable for
  a sub-600 ms decorative entrance but the **final state must pass**, which it does.
- **Touch / no-pointer:** this effect is scroll-/viewport-triggered, not
  cursor-driven, so it works identically on touch — there is no hover dependency to
  strand touch users. (If you add a *hover* lift on the cards, gate that with
  `@media (hover: hover) and (pointer: fine)`.)

## Performance
- **Animate only `transform` and `opacity`.** Both are compositor-friendly and skip
  layout/paint. Avoid staggering `top`/`left`/`height`/`margin` — on a grid that is
  layout thrash multiplied by item count.
- **Cap the animated set.** A linear delay over a long list both feels slow and
  keeps many elements in a pre-paint state. Use `ScrollTrigger.batch()` (or
  IntersectionObserver) so only on-screen items animate; never schedule 200 delayed
  animations at once.
- **`will-change: transform` sparingly** — add it to the animating items only, and
  ideally remove it after the entrance (GSAP `clearProps`, or don't set it at all
  for short one-shots) so you don't pin dozens of permanent GPU layers.
- **`blur()` filters are expensive** — a blur-in stagger over many cards can drop
  frames on mid-range devices; prefer opacity/transform, or limit blur to a few hero
  items.
- **Bundle cost:** native CSS = 0 KB. GSAP core + ScrollTrigger ≈ 70 KB min (≈ 28 KB
  gzipped); Motion ≈ 30–40 KB gzipped tree-shaken. If a CSS-only stagger covers the
  case, ship nothing.

## Anti-slop
Cliché (see `_slop-blocklist.md` → MOTION: "everything fades-and-slides-up same
duration same easing"): every group on the page doing the identical
`opacity 0→1 + translateY(20px)` over `0.6s ease`, no variation, applied
indiscriminately. It is the single most common AI-generated motion tell.

The tasteful fix:
- **Make the stagger meaningful** — a real 50–90 ms step that leads the eye, not a
  ~20 ms step that just blurs into a uniform fade. If items don't benefit from
  sequencing, don't stagger them; fade the group as one.
- **Vary which elements move and how** — the heading rises, the cards fade-scale,
  the CTA springs in. Don't apply one transform to everything.
- **Use real easing** — expo-out `cubic-bezier(0.16, 1, 0.3, 1)` or a spring, not
  default `ease`. The settle is what reads as crafted.
- **Reserve it** — a couple of focal groups per page, not every section. Restraint is
  the difference between "designed" and "generated."

## Pairs well with
- **`text-reveal-on-scroll`** — share the same easing (`cubic-bezier(0.16,1,0.3,1)`)
  and timing language so the headline reveal and the card stagger feel like one
  system rather than two effects.
- **`sticky-pinning`** — pin a section and stagger its contents in as it holds.
- **`scroll-progress-indicator`** — orient the reader in long, sequenced sections.
- **Bento / asymmetric grid layouts** — staggered entrance gives a varied bento its
  reading order; stagger *from center* to emphasize a hero tile.
- **Lenis smooth scroll** — layer underneath for weighted scroll velocity; it does
  not create the stagger, only the feel of the scroll that triggers it.

## Current references
- [MDN — CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations) — `view()`/`scroll()` timelines, ranges, and the live support table
- [MDN — `sibling-index()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index) — the native index function for `calc()`-driven per-item offsets
- [Frontend Masters — Staggered animation with CSS sibling-* functions](https://frontendmasters.com/blog/staggered-animation-with-css-sibling-functions/) — practical native stagger patterns and current support caveats
- [GSAP — ScrollTrigger.batch()](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.batch()/) — the canonical way to stagger only the items that enter the viewport
- [Webflow blog — GSAP becomes free](https://webflow.com/blog/gsap-becomes-free) — April 2025 announcement; all plugins (incl. SplitText) now free for commercial use
- [Motion — stagger](https://www.framer.com/motion/stagger/) — `staggerChildren`/`delayChildren` and the `stagger()` helper for React
- [web.dev / Chrome — Scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations) — native approach, the Firefox `animation-duration:1ms` guard, and demos
- [Josh W. Comeau — Scroll-driven animations](https://www.joshwcomeau.com/animation/scroll-driven-animations/) — clear mental model for `view()` ranges and progressive enhancement
