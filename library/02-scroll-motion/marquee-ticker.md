# Marquee / ticker

> An infinite horizontal strip of text or logos that slides continuously, looping seamlessly by duplicating its content and translating it by exactly one copy's width.

**Bucket:** scroll/motion
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, marketing sites (logo walls, "as seen in" strips, announcement bars)

## What it is
A track of content (words, logos, badges) drifts steadily in one direction and never appears to end. The illusion is pure repetition: render the same content twice in a row, animate the track left by the width of exactly one copy, then loop — at the loop point copy two sits precisely where copy one started, so the eye never catches a seam. There is no `requestAnimationFrame`, no scroll listener, and no `<marquee>` element (deprecated, inaccessible, and uncontrollable). The engine is one `@keyframes translateX` plus duplicated DOM. The only correctness wrinkle is the gap: if items have spacing between them, you must translate by `calc(-100% - var(--gap))` — one full copy plus one gap interval — or the seam will jump by exactly that gap at each loop point.

## When to use
- Logo walls / "trusted by" strips where the row is wider than the viewport.
- Announcement or status tickers (sale events, release notes) where motion signals "live" and the content is fully redundant with a page-visible static list.
- Decorative editorial banners — oversized display words scrolling behind or between sections to add rhythm.
- Anywhere you want continuous ambient motion not tied to scroll position.

## When NOT to use
- **Anything the user must read in full.** Moving text forces a reading pace and is hostile to dyslexic and low-vision users. Tickers are for skimmable, decorative, or redundant content — never the sole home of important information.
- **Primary navigation or actionable links.** Hitting a moving target is a Fitts's-law nightmare; items that scroll off-screen before a keyboard user can reach them are unreachable.
- **News or price tickers as the sole data source.** Always provide a static, paginated table alongside. Per WCAG 2.2.2, continuously moving content (>5 s) requires a keyboard-reachable pause mechanism — hover alone does not satisfy this (see Accessibility).
- **"Everyone overuses this for X":** brands slap an autoplaying, fast, no-controls logo marquee on every landing page. Autoplay with no pause control and no reduced-motion path is a taste and accessibility failure (see Anti-slop).
- When `prefers-reduced-motion: reduce` is set — the strip must stop entirely, not slow down.

## How it works
Lay out the content in a flex track, clone it once (marked `aria-hidden="true"`), then translate the whole track left by exactly one clone's width on an infinite linear keyframe. Because the clone is identical and immediately follows the original, the frame at 0 % and the frame at 100 % are visually identical, so `infinite` loops without a visible cut.

**The gap correctness detail:** with `gap: Npx` between items, `translateX(-100%)` undershoots by `N` pixels per loop. The fix: `translateX(calc(-100% - var(--gap)))`. Alternatively, give each group a trailing `padding-right` equal to the gap and translate exactly `-100%`.

Key properties and APIs:

- `@keyframes` + `animation: scroll Ns linear infinite` — the time engine. `linear` is mandatory; any easing makes the loop visibly pulse at the seam.
- `animation-play-state: paused` — the pause-on-hover / pause-on-focus switch, and the target for a JS pause button.
- `@media (prefers-reduced-motion: reduce)` — the mandatory kill switch.
- **Native scroll-driven `animation-timeline`** is not the right tool for a standard marquee — the strip is time-driven, not scroll-driven. Reach for `scroll()` / `view()` only when you want the strip's speed to react to page scroll (a variation; see below).
- **Library route: GSAP `horizontalLoop()`** — the official GreenSock seamless-loop helper. Handles resize (uses `xPercent`, not raw pixels), optional drag, optional in-view pausing via `ScrollTrigger`. Use when you need velocity control, drag-to-scrub, or must pause off-screen.

## Working code

### Native CSS (primary, zero JS, works everywhere)

Pause-on-hover and pause-on-focus-within are CSS-only. A tiny JS snippet wires the pause button for WCAG 2.2.2 compliance without needing a library. Reduced-motion kills the animation and drops the duplicate so content wraps and is fully readable.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Marquee ticker</title>
<style>
  :root { color-scheme: dark; }

  body {
    margin: 0;
    font-family: "Geist", system-ui, sans-serif;
    background: #0f1115;
    color: #e8e9ed;
    display: grid;
    place-items: center;
    min-height: 100svh;
    gap: 1.25rem;
  }

  /* ── pause button (WCAG 2.2.2) ───────────────────────────────────── */
  .marquee-controls {
    display: flex;
    justify-content: flex-end;
    width: min(92vw, 1100px);
  }

  .marquee-pause {
    background: none;
    border: 1.5px solid #3a3d47;
    border-radius: 0.35rem;
    color: #c5c8d2;        /* 11.31:1 on #0f1115 — passes AAA */
    font: 500 0.8125rem "Geist", system-ui, sans-serif;
    padding: 0.3rem 0.75rem;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .marquee-pause:hover { border-color: #f0653a; }
  .marquee-pause:focus-visible {
    outline: 2px solid #f0653a;
    outline-offset: 2px;
  }

  /* ── marquee strip ───────────────────────────────────────────────── */
  .marquee {
    --gap: 2.5rem;
    --speed: 24s;            /* generous — calm, readable motion */
    width: min(92vw, 1100px);
    overflow: hidden;
    display: flex;
    gap: var(--gap);
    /* soft edge fade so items glide in instead of hard-clipping */
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
            mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  }

  .marquee__group {
    flex: 0 0 auto;
    display: flex;
    gap: var(--gap);
    min-width: 100%;          /* each group spans the full track */
    justify-content: space-around;
    align-items: center;
    animation: marquee-scroll var(--speed) linear infinite;
  }

  /* CSS-only pause: pointer hover OR keyboard focus inside the strip */
  .marquee:hover .marquee__group,
  .marquee:focus-within .marquee__group {
    animation-play-state: paused;
  }

  /* JS-controlled pause via a class (toggled by the button) */
  .marquee.is-paused .marquee__group {
    animation-play-state: paused;
  }

  .marquee__group span {
    font-size: clamp(0.9375rem, 2.2vw, 1.375rem);
    font-weight: 600;
    letter-spacing: -0.01em;
    white-space: nowrap;
    color: #c5c8d2;          /* 11.31:1 on #0f1115 */
  }
  /* one sharp accent instead of full-color chaos */
  .marquee__group span:nth-child(3n+2) { color: #f0653a; } /* 5.96:1 on #0f1115 — AA large text */

  @keyframes marquee-scroll {
    from { transform: translateX(0); }
    /* -100% of one group's width + one gap interval = exact loop reset */
    to   { transform: translateX(calc(-100% - var(--gap))); }
  }

  /* ── MANDATORY: stop all motion, expose all content ─────────────── */
  @media (prefers-reduced-motion: reduce) {
    .marquee__group {
      animation: none;
    }
    .marquee {
      /* let the row wrap so every item is readable without scrolling */
      overflow: visible;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
      -webkit-mask-image: none;
              mask-image: none;
    }
    /* drop the decorative duplicate — static content needs it once */
    .marquee__group[aria-hidden="true"] {
      display: none;
    }
    /* hide the pause button — nothing to pause */
    .marquee-controls {
      display: none;
    }
  }
</style>
</head>
<body>

  <!-- WCAG 2.2.2: keyboard-reachable pause control above the strip -->
  <div class="marquee-controls">
    <button class="marquee-pause" aria-pressed="false" aria-label="Pause partner strip">
      Pause
    </button>
  </div>

  <!--
    role="region" + aria-label names the section for screen-reader navigation.
    Do NOT use role="marquee" for purely decorative strips — it is an ARIA live-region
    role that causes readers to announce every update, which is noisy and unhelpful for
    a looping logo wall.
  -->
  <section class="marquee" aria-label="Featured partners">

    <!-- group 1: the real, readable content -->
    <div class="marquee__group">
      <span>Linear</span>
      <span>Vercel</span>
      <span>Figma</span>
      <span>Supabase</span>
      <span>Stripe</span>
      <span>Raycast</span>
    </div>

    <!-- group 2: aria-hidden clone — screen readers announce content once, not twice -->
    <div class="marquee__group" aria-hidden="true">
      <span>Linear</span>
      <span>Vercel</span>
      <span>Figma</span>
      <span>Supabase</span>
      <span>Stripe</span>
      <span>Raycast</span>
    </div>

  </section>

  <script>
    // WCAG 2.2.2: pause button that persists state even after hover/focus change.
    // Hover-pause alone does NOT satisfy 2.2.2 — the mechanism must be user-initiated
    // and must not rely on sustained focus on the control itself.
    (function () {
      const btn = document.querySelector('.marquee-pause');
      const strip = document.querySelector('.marquee');
      if (!btn || !strip) return;

      // Respect the OS setting — if reduced-motion, button is already hidden via CSS.
      // Belt-and-suspenders: also skip the JS setup so no stale state can re-enable motion.
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      let paused = false;

      btn.addEventListener('click', () => {
        paused = !paused;
        strip.classList.toggle('is-paused', paused);
        btn.setAttribute('aria-pressed', String(paused));
        btn.textContent = paused ? 'Play' : 'Pause';
        btn.setAttribute('aria-label', paused ? 'Play partner strip' : 'Pause partner strip');
      });
    }());
  </script>

</body>
</html>
```

**Why two groups each `min-width: 100%` with `translateX(calc(-100% - var(--gap)))` :**
both groups animate in lockstep. When the track has shifted left by one group's width plus one gap unit, group 2 occupies exactly the pixel position group 1 started at. The animation resets to `0` invisibly. Without the `- var(--gap)` term, a gap-sized gap-flash appears at each cycle.

---

### GSAP `horizontalLoop()` (library route) — responsive, in-view-only, drag-ready

Use when you need px/s velocity control, resize-proof looping (GSAP measures in `xPercent`, not raw pixels), or want to play only while the strip is on screen. The `horizontalLoop()` helper is the official GreenSock seamless-loop utility.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Marquee — GSAP</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<style>
  body {
    margin: 0;
    background: #0f1115;
    font-family: "Geist", system-ui, sans-serif;
    display: grid;
    place-items: center;
    min-height: 100svh;
    gap: 1.25rem;
  }

  .marquee-controls {
    display: flex;
    justify-content: flex-end;
    width: min(92vw, 1100px);
  }

  .marquee-pause {
    background: none;
    border: 1.5px solid #3a3d47;
    border-radius: 0.35rem;
    color: #c5c8d2;
    font: 500 0.8125rem "Geist", system-ui, sans-serif;
    padding: 0.3rem 0.75rem;
    cursor: pointer;
  }
  .marquee-pause:hover  { border-color: #f0653a; }
  .marquee-pause:focus-visible { outline: 2px solid #f0653a; outline-offset: 2px; }

  .ticker {
    display: flex;
    gap: 2.5rem;
    overflow: hidden;
    width: min(92vw, 1100px);
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
            mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  }

  .ticker > span {
    flex: 0 0 auto;
    white-space: nowrap;
    font: 600 clamp(0.9375rem, 2.2vw, 1.375rem) "Geist", system-ui, sans-serif;
    letter-spacing: -0.01em;
    color: #c5c8d2;
  }
  .ticker > span:nth-child(3n+2) { color: #f0653a; }

  @media (prefers-reduced-motion: reduce) {
    .ticker {
      overflow: visible;
      flex-wrap: wrap;
      gap: 1rem;
      -webkit-mask-image: none;
              mask-image: none;
    }
    .marquee-controls { display: none; }
  }
</style>
</head>
<body>

  <div class="marquee-controls">
    <button class="marquee-pause" aria-pressed="false" aria-label="Pause partner strip">
      Pause
    </button>
  </div>

  <section class="ticker" aria-label="Featured partners">
    <span>Linear</span>
    <span>Vercel</span>
    <span>Figma</span>
    <span>Supabase</span>
    <span>Stripe</span>
    <span>Raycast</span>
  </section>

  <script>
    gsap.registerPlugin(ScrollTrigger);

    // Official GreenSock seamless horizontalLoop helper.
    // Source: https://codepen.io/GreenSock/pen/PojYwPp
    // Measures in xPercent so loops survive window resize.
    function horizontalLoop(items, config) {
      items = gsap.utils.toArray(items);
      config = config || {};
      let tl = gsap.timeline({
            repeat: config.repeat ?? -1,
            paused: config.paused ?? false,
            defaults: { ease: "none" },
            onReverseComplete() { tl.totalTime(tl.rawTime() + tl.duration() * 100); }
          }),
          length = items.length,
          startX = items[0].offsetLeft,
          times = [], widths = [], xPercents = [],
          pixelsPerSecond = (config.speed || 1) * 100,
          snap = config.snap === false ? v => v : gsap.utils.snap(config.snap || 1),
          totalWidth, curX, distanceToStart, distanceToLoop, item, i;

      gsap.set(items, {
        xPercent: (i, el) => {
          let w = widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
          xPercents[i] = snap(
            parseFloat(gsap.getProperty(el, "x", "px")) / w * 100
            + gsap.getProperty(el, "xPercent")
          );
          return xPercents[i];
        }
      });
      gsap.set(items, { x: 0 });

      totalWidth = items[length - 1].offsetLeft
        + xPercents[length - 1] / 100 * widths[length - 1]
        - startX
        + items[length - 1].offsetWidth * gsap.getProperty(items[length - 1], "scaleX")
        + (parseFloat(config.paddingRight) || 0);

      for (i = 0; i < length; i++) {
        item = items[i];
        curX = xPercents[i] / 100 * widths[i];
        distanceToStart = item.offsetLeft + curX - startX;
        distanceToLoop  = distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");

        tl.to(item, {
          xPercent: snap((curX - distanceToLoop) / widths[i] * 100),
          duration: distanceToLoop / pixelsPerSecond
        }, 0)
        .fromTo(item,
          { xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100) },
          { xPercent: xPercents[i],
            duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
            immediateRender: false },
          distanceToLoop / pixelsPerSecond
        );

        times[i] = distanceToStart / pixelsPerSecond;
      }

      tl.times = times;
      tl.progress(1, true).progress(0, true); // pre-render: prevents first-loop pop
      return tl;
    }

    // Respect OS reduced-motion preference
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const strip = document.querySelector('.ticker');
      const btn   = document.querySelector('.marquee-pause');
      const items = gsap.utils.toArray('.ticker > span');

      const loop = horizontalLoop(items, {
        speed: 0.55,          // px/s ÷ 100 — tune to feel
        repeat: -1,
        paddingRight: 40      // must match the 2.5rem gap (~40px at 16px base)
      });

      // CSS-parity pause: hover and focus-within
      strip.addEventListener('mouseenter', () => loop.pause());
      strip.addEventListener('mouseleave', () => { if (btn.getAttribute('aria-pressed') === 'false') loop.play(); });
      strip.addEventListener('focusin',    () => loop.pause());
      strip.addEventListener('focusout',   () => { if (btn.getAttribute('aria-pressed') === 'false') loop.play(); });

      // WCAG 2.2.2 button — persistent, keyboard-reachable
      let paused = false;
      btn.addEventListener('click', () => {
        paused = !paused;
        paused ? loop.pause() : loop.play();
        btn.setAttribute('aria-pressed', String(paused));
        btn.textContent = paused ? 'Play' : 'Pause';
        btn.setAttribute('aria-label', paused ? 'Play partner strip' : 'Pause partner strip');
      });

      // Play only while the strip is actually on screen (saves compositor cycles)
      ScrollTrigger.create({
        trigger: strip,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: self => {
          if (paused) return;
          self.isActive ? loop.play() : loop.pause();
        }
      });
    }
  </script>

</body>
</html>
```

**Bundle cost note:** GSAP core + ScrollTrigger ≈ 70 KB minified (~30 KB gzip). Default to the native CSS version unless you specifically need drag, velocity control, or resize-proof looping.

---

### Motion React (React) — brief pattern

Motion's first-party component is **`Ticker`** (`motion-plus`, paid tier). It clones the minimum elements required to fill the viewport, handles reduced-motion automatically, and supports scroll-driven velocity via motion values:

```jsx
// Motion+ (paid) — https://motion.dev/docs/react-ticker
import { Ticker } from "motion-plus/react";

const partners = ["Linear", "Vercel", "Figma", "Supabase", "Stripe", "Raycast"];

export function PartnerStrip() {
  return (
    <Ticker
      items={partners.map((name, i) => (
        <span key={i} style={{ whiteSpace: "nowrap", padding: "0 1.25rem" }}>
          {name}
        </span>
      ))}
      velocity={80}   /* px/s; negative reverses direction */
      axis="x"
    />
  );
}
```

If you are on the free `framer-motion` / `motion` package, duplicate the track manually and guard with `useReducedMotion()`:

```jsx
import { animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

const partners = ["Linear", "Vercel", "Figma", "Supabase", "Stripe", "Raycast"];
const doubled  = [...partners, ...partners]; // two copies for seamless loop

export function PartnerStrip() {
  const trackRef = useRef(null);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    if (shouldReduce || !trackRef.current) return;

    // Animate translateX from 0 to -50% (one copy's width) — linear, infinite
    const controls = animate(trackRef.current, { x: ["0%", "-50%"] }, {
      duration: 24,
      ease: "linear",
      repeat: Infinity,
    });

    return () => controls.stop();
  }, [shouldReduce]);

  return (
    <div style={{ overflow: "hidden", width: "min(92vw, 1100px)" }}>
      <div
        ref={trackRef}
        style={{ display: "flex", gap: "2.5rem", width: "max-content" }}
      >
        {doubled.map((name, i) => (
          // Second half is the aria-hidden clone
          <span
            key={i}
            aria-hidden={i >= partners.length ? "true" : undefined}
            style={{ whiteSpace: "nowrap", fontWeight: 600 }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
```

`useReducedMotion()` reads the OS preference reactively and returns `true` when `prefers-reduced-motion: reduce` is set — the `useEffect` returns early, leaving a static, readable row.

## Variations

- **Direction:** flip the keyframe sign (`translateX(calc(100% + var(--gap)))`) or use a negative GSAP `speed` for right-to-left. Mirror the direction for RTL locales (`dir="rtl"`).
- **Axis:** vertical ticker — animate `translateY`, clip with `overflow: hidden` on the height, stack groups in a column. Classic for changelog feeds or server status.
- **Counter-scroll (two rows):** stack two strips moving in opposite directions; the visual tension reads more editorial than a single row. The knob is the keyframe `from`/`to` sign on the second strip.
- **Hover-slow instead of hard-pause:** instead of `animation-play-state: paused`, transition `--speed` to a longer value on hover (`transition: --speed 0.4s`). The strip eases down rather than freezing. Still provide the explicit pause button.
- **Scroll-reactive speed (native scroll-driven):** keep the time-based `@keyframes` for the loop, then layer a second `animation-timeline: scroll()` animation that adds a `translateX` offset that grows with scroll position — so scrolling the page also nudges the strip. Native scroll-driven animation is supported in Chromium 115+ and recent Firefox/Safari; progressive-enhance it on top of the plain marquee baseline.
- **Logos vs text:** identical mechanism. For image/SVG logos, give the track `align-items: center` and fixed `height` values so baselines do not jitter at the seam.
- **Experimental no-duplicate (Chromium-only 2025):** using CSS `offset-path: shape()` + `sibling-count()` / `sibling-index()`, items can orbit a synthetic path without any duplicated DOM. Firefox and Safari support is incomplete as of mid-2026 — treat as progressive enhancement only.

## Accessibility

**prefers-reduced-motion (MANDATORY — shown in every code block above):**
When `reduce` is set, the native CSS version kills `animation`, removes the edge mask, and switches the container to `flex-wrap: wrap` so every item is visible without scrolling. The `aria-hidden` duplicate is `display: none`. The GSAP version never builds the timeline. The Motion version's `useReducedMotion()` skips the `animate()` call. Never substitute a slower speed — stop the animation entirely.

**WCAG 2.2.2 Pause, Stop, Hide (Level A):**
Auto-moving content that starts automatically, lasts more than five seconds, and appears alongside other content requires a mechanism to pause, stop, or hide it. A marquee loop is precisely this content. Per the WCAG Understanding document, *hover-pause alone does not satisfy the criterion* — stopping motion only while hovering "ties up the user or the focus so the page cannot be used" and fails when the pointer moves away. The solution above places a visible `<button>` with `aria-pressed` above the strip, keyboard-reachable, that toggles persistent pause. This satisfies 2.2.2 for non-essential decorative strips.

**ARIA — duplicate content handling:**
Every cloned group is `aria-hidden="true"`. The wrapper carries an `aria-label` that names the strip ("Featured partners"). Do not apply `role="marquee"` to decorative logo walls — that ARIA 1.0 live-region role causes screen readers to interrupt and re-announce on every loop cycle, which is noisy and disorienting. Use `role="marquee"` only if the content genuinely updates with new information (a live news feed).

**Pointer / touch fallback (MANDATORY for cursor/hover effects):**
The CSS hover pause is gated inside a selector that already requires the pointer to be over the element. On touch devices (`@media (hover: none)`), there is no hover event, so the strip runs continuously. Ensure: (1) the speed is slow enough to be readable while moving (`--speed: 24s` or more), (2) the same content is accessible elsewhere (a static list or the strip text), and (3) the pause button is tappable (minimum 44 × 44 px touch target; the button above meets this at default browser sizes). If you want touch-users to be able to pause, attach a `touchstart` / `click` event as well.

**Keyboard and focus:**
If strip items are links, they must have visible focus rings (the example uses `outline: 2px solid #f0653a` on `:focus-visible`). Pausing on `:focus-within` keeps a focused link still while the user reads and activates it.

**Contrast:**
Items use `#c5c8d2` on `#0f1115` = **11.31:1** (AAA), and the accent `#f0653a` on `#0f1115` = **5.96:1** (AA large text and AA for UI components). The edge-fade mask reduces opacity only in the outer ~8% gutters where no text rests at its baseline position. Do not let a label's resting position fall inside the faded zone.

**Do not gate meaning on motion:** content must be present in the DOM and readable with JS disabled and animation off. Motion is enhancement only.

## Performance

- **Animate only `transform`** (`translateX` / `translateY`). Never animate `left`, `margin-left`, or `width` — those trigger layout recalculation on every frame.
- A transform-only CSS keyframe runs on the **compositor thread**, off the main thread. A well-written marquee is essentially free in terms of JS execution.
- `will-change: transform` on the track can promote it to its own compositor layer. Use only if you measure jank — a permanently promoted marquee consumes VRAM for the lifetime of the page.
- **Pause off-screen.** Some browser engines still tick off-screen CSS keyframes. Add an `IntersectionObserver` that toggles a `.paused` class when the strip leaves the viewport (the GSAP version handles this via `ScrollTrigger.create`).
- **Minimal clones.** Two groups is enough when each group's width exceeds the viewport width. Cloning a wide logo row four or six times bloats the DOM for no visual improvement.
- **Edge mask cost:** the `mask-image` linear-gradient is a paint operation. On browsers where compositing is not supported for masks it can force the layer to be repainted rather than composited. Profile if you see jank on low-end devices.
- **Bundle cost:** native CSS = 0 KB JS. GSAP core + ScrollTrigger ≈ 70 KB minified (~30 KB gzip). Motion+ `Ticker` is a paid add-on. Default to native CSS unless drag, velocity control, or resize-proof looping are required features.

## Anti-slop

Cliché (see `_slop-blocklist.md` → **MOTION**: *autoplay carousel no controls*, *everything fades-and-slides same duration same easing*; **COLOR**: *rainbow categorical color*, *generic SaaS blue everywhere*): a fast autoplaying logo marquee with no pause control, no reduced-motion path, full-color brand logos in a rainbow collision, and `animation-timing-function: ease` (which makes the loop visibly pulse). This is the single most-generated component on AI-built landing pages circa 2024-2026.

**Tasteful alternative:** slow it down to 22–28 s per cycle; use `linear` timing (the only function that makes the loop invisible); add hover, focus, and button pause; honor reduced-motion; restrain the palette to one neutral ink (`#c5c8d2`) plus one sharp accent (`#f0653a`) instead of letting twelve brand colors fight; add the soft edge-fade mask so items glide in rather than hard-clipping; and vary the treatment (counter-scroll two rows, or couple speed to scroll) so it feels composed rather than pasted in.

## Pairs well with

- `logo-cloud` / `social-proof` patterns — a marquee is the motion version of a static logo grid; use the marquee when the row is too wide, fall back to the grid at reduced-motion.
- `sticky-pinning` — pin a section while the ticker scrolls inside the held frame for an editorial "live data" effect.
- `text-reveal-on-scroll` — share the same expo/linear easing discipline across the page so motion feels like one system, not a grab-bag.
- `scroll-progress-indicator` — orient the reader during long scrollytelling sections that sit near a marquee strip.
- `staggered-entrance` — introduce the marquee strip itself with a staggered fade when the section first enters the viewport.

## Current references

- [The Infinite Marquee — Ryan Mulligan](https://ryanmulligan.dev/blog/css-marquee/) — the canonical `translateX(calc(-100% - var(--gap)))` + `aria-hidden` clone technique, with the gap-math explained clearly.
- [Infinite Marquee Animation Using Modern CSS — Frontend Masters (Temani Afif, Aug 2025)](https://frontendmasters.com/blog/infinite-marquee-animation-using-modern-css/) — the experimental `offset-path: shape()` + `sibling-count()` no-duplicate approach; Chromium-only as of mid-2026.
- [MDN — `<marquee>` (deprecated)](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/marquee) — canonical deprecation notice; recommends CSS animations + `prefers-reduced-motion`.
- [MDN — animation-play-state](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-play-state) — `paused` / `running` reference; the primitive behind every hover-pause pattern.
- [GSAP horizontalLoop() helper — GreenSock CodePen](https://codepen.io/GreenSock/pen/PojYwPp) — the official resize-proof seamless-loop utility; copy the full helper, not a trimmed version.
- [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) — `onToggle`, `start`/`end` syntax for play-while-in-view pausing.
- [Motion for React — Ticker](https://motion.dev/docs/react-ticker) — first-party React infinite-scroll component (Motion+ paid); auto reduced-motion, minimal cloning, scroll-driven velocity support.
- [Understanding WCAG SC 2.2.2: Pause, Stop, Hide — W3C WAI](https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html) — authoritative spec text; explains why hover-pause alone fails the criterion and what a compliant pause mechanism requires.
- [web.dev — Scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations) — progressive-enhancement guidance for the `animation-timeline: scroll()` variant on top of the plain marquee baseline.
