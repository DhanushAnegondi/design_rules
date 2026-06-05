# Scroll progress indicator

> A fixed bar or ring that fills in lockstep with the reader's scroll position — ideally drawn by native CSS with zero JavaScript.

**Bucket:** scroll/motion
**Maturity:** current
**Effort:** low
**Best for:** websites, portfolios, long-form articles/blogs, docs, dashboards (per-panel)

## What it is
A thin progress affordance — usually a 2–6 px bar pinned to the top of the viewport, sometimes a circular ring in a corner — that grows from 0% to 100% as the reader scrolls. The user perceives "how far through the page am I?" the way a video scrubber shows playback position. The headline modern technique is pure CSS: `animation-timeline: scroll(root)` ties a `scaleX` transform directly to the root scroller's progress, running on the compositor thread with no scroll listener and no JavaScript. A JS fallback handles Firefox (where the feature is behind a flag) and any engine that does not yet support the spec.

## When to use
- Long-form reading: articles, essays, documentation, changelogs — anywhere the page is much taller than the viewport and "am I nearly done?" is a genuine question.
- Marketing or portfolio pages with several full-height sections, where a **per-section indicator** (a stack of small vertical bars on the side) doubles as a wayfinding map.
- Scrollable panels inside apps or dashboards (audit logs, settings, long tables) — use `scroll(nearest)` instead of `scroll(root)` to scope the bar to that container.
- When you need the orientation cue but cannot spend a scroll-event budget — native CSS keeps the whole thing off the main thread.

## When NOT to use
- Short pages that fit in one or two viewport heights — the bar never meaningfully moves and adds contrast noise for zero payoff.
- Infinite-scroll or virtualized feeds where total length is unknown — a progress bar that never reaches 100% is misleading; use a back-to-top affordance instead.
- As the *only* signal of section state in a stepper or tabbed flow — progress bars communicate position, not navigability; pair with real navigation links.
- Sitewide chrome on every page including the homepage and the contact form. The overused version: a rainbow-gradient reading bar applied indiscriminately to pages that barely scroll. The bar earns its place on genuinely long, linear reading content only.

## How it works
The mechanism is "map scroll position to the 0%–100% range of an animation and let that drive a visual fill."

**Native CSS — `animation-timeline: scroll()`** (preferred). A *scroll progress timeline* maps a scroll container's scrollable range onto a 0%–100% animation. Write a `@keyframes` that goes from `scaleX(0)` to `scaleX(1)`, set `animation-timeline: scroll(root block)`, and the browser drives it. Set `animation-duration` to `auto` — duration is semantically meaningless on a scroll timeline; the timeline range replaces it. Always declare `animation-timeline` after the `animation` shorthand, which otherwise resets it to `auto`.

**Native CSS — `view()` for per-section bars** (best for section maps). A *view progress timeline* maps an element's pass through the viewport onto 0%–100%. Combined with a registered `@property` animatable custom number, each `<section>` drives its own indicator bar. Name timelines with `view-timeline-name: --s1` on the section and `animation-timeline: --s1` on the matching bar to bind them explicitly.

**JS fallback — scroll calc.** `p = scrollTop / (scrollHeight − clientHeight)`, clamped 0–1, written to a CSS custom property on `requestAnimationFrame` inside a passive scroll listener. This is the universal floor that ships correctly on Firefox today.

**GSAP ScrollTrigger.** Gives a `self.progress` value (0–1) in `onUpdate`, with `scrub` smoothing so the bar lags scroll slightly for a softer feel. The robust cross-browser production path if GSAP is already in the page.

**Framer Motion `useScroll`.** Returns `scrollYProgress` (MotionValue, 0–1) bound directly to `scaleX`. `useSpring` wraps it for smoothing. Uses `useReducedMotion` to disable the spring binding under reduced motion.

**Browser support, honestly (caniuse, mid-2026, ~83% global):** `animation-timeline: scroll()` and `view()` ship in **Chrome/Edge 115+** and **Safari 26+**. **Firefox** has the implementation but it is **disabled by default behind `layout.css.scroll-driven-animations.enabled`**. Always progressively enhance: a JS-written `--p` variable is the universal floor, and a `@supports (animation-timeline: scroll())` block overrides it on supported engines.

## Working code

### Native CSS — top reading bar (no JS)
Pure compositor animation that tracks the document scroller. A warm near-black track sits beneath the fill so the bar reads even at scroll 0%. The reduced-motion branch renders a static, honest full-width bar — the bar stays present and never misleads.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Native scroll progress bar</title>
<style>
  :root {
    --bar:   #f5a623;   /* committed amber accent */
    --track: #211d17;   /* warm near-black track */
    --ink:   #f4efe7;
    --bg:    #14110c;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    /* #f4efe7 on #14110c = 16.45:1 — well past AA/AAA for body text */
    font: 1.125rem/1.75 "Iowan Old Style", Georgia, serif;
  }
  main { max-width: 68ch; margin: 0 auto; padding: 5rem 1.5rem; }
  h1 { font-size: clamp(2rem, 5vw, 3.25rem); line-height: 1.05; }

  /* track sits behind fill; gives the bar context at 0% scroll */
  .progress-track {
    position: fixed; inset: 0 0 auto 0;
    height: 4px;
    background: var(--track);
    z-index: 50;
  }
  /* #f5a623 on #211d17 = 8.27:1 — passes WCAG 1.4.11 non-text 3:1 */
  .progress-bar {
    height: 100%;
    background: var(--bar);
    transform: scaleX(0);
    transform-origin: 0 50%;
    /* duration is ignored on a scroll timeline; linear = 1:1 with scroll */
    animation: grow-progress auto linear;
    /* MUST come after the `animation` shorthand or the shorthand resets it */
    animation-timeline: scroll(root block);
  }
  @keyframes grow-progress {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }

  /* Reduced motion: stop the scrubbing animation. The bar stays visible
     and full-width so it is still a present, honest affordance — the
     native scrollbar already conveys position to assistive tech. */
  @media (prefers-reduced-motion: reduce) {
    .progress-bar {
      animation: none;
      transform: scaleX(1);
      opacity: 0.5;
    }
  }
</style></head>
<body>
  <!-- aria-hidden: decorative orientation aid, not content.
       The browser scrollbar already communicates position to AT. -->
  <div class="progress-track" aria-hidden="true">
    <div class="progress-bar"></div>
  </div>

  <main>
    <h1>The long read</h1>
    <p>
      The amber bar at the top fills in lockstep with your scroll position —
      driven entirely by CSS on the compositor thread, no JavaScript required.
    </p>
    <!-- enough height to make the page scroll meaningfully -->
    <p style="height: 230vh">
      Article body. Add real prose here. The bar will track from 0 to 100%
      as the reader scrolls through.
    </p>
    <p>End of article.</p>
  </main>
</body></html>
```

### Universal version — JS floor + native CSS override
The realistic production pattern: a tiny passive scroll handler writes `--p` (0–1) for Firefox and older engines; `@supports` hands control to the native timeline where it exists so the JS becomes inert. One indicator, correct in every browser.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Progressive-enhanced progress bar</title>
<style>
  :root { --p: 0; --bar: #f5a623; --track: #211d17; }
  body {
    margin: 0; background: #14110c; color: #f4efe7;
    font: 1.1rem/1.7 Georgia, serif;
  }

  .progress-track {
    position: fixed; inset: 0 0 auto 0;
    height: 4px; background: var(--track); z-index: 50;
  }
  /* FLOOR: JS writes --p; scaleX mirrors it */
  .progress-bar {
    height: 100%; background: var(--bar);
    transform-origin: 0 50%;
    transform: scaleX(var(--p));
  }

  /* ENHANCE: on supporting browsers, the native timeline takes over.
     The JS path still runs but its output is ignored. */
  @supports (animation-timeline: scroll()) {
    .progress-bar {
      transform: scaleX(0);
      animation: grow auto linear;
      animation-timeline: scroll(root block);
    }
    @keyframes grow {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }
  }

  /* Reduced motion: static full bar, dimmed; present but not scrubbing */
  @media (prefers-reduced-motion: reduce) {
    .progress-bar {
      animation: none !important;
      transform: scaleX(1) !important;
      opacity: 0.5;
    }
  }
</style></head>
<body>
  <div class="progress-track" aria-hidden="true">
    <div class="progress-bar" id="bar"></div>
  </div>
  <main style="max-width: 68ch; margin: 0 auto; padding: 5rem 1.5rem;">
    <h1>Reading progress</h1>
    <p style="height: 240vh">
      Long article content goes here. Scroll to see the indicator track.
    </p>
    <p>End of article.</p>
  </main>

  <script>
    // JS floor: only matters on browsers without animation-timeline.
    // Skip all work on engines that support the native timeline.
    if (!CSS.supports('animation-timeline: scroll()')) {
      const root  = document.documentElement;
      let ticking = false;

      function update() {
        const max = root.scrollHeight - root.clientHeight;
        const p   = max > 0 ? Math.min(root.scrollTop / max, 1) : 0;
        root.style.setProperty('--p', p.toFixed(4));
        ticking = false;
      }

      window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
      }, { passive: true });

      window.addEventListener('resize', update, { passive: true });
      update(); // set initial value
    }
  </script>
</body></html>
```

### Native CSS — per-section bars with `view()` and named timelines
Each section drives its own vertical bar in a fixed side column as it passes through the viewport. Uses `view-timeline-name` on each section and `animation-timeline` on the matching bar so the binding is explicit and stable. A registered `@property` custom number makes the value animatable and inherited.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Per-section progress indicators</title>
<style>
  /* Registered number so it can transition and inherit to child elements */
  @property --fill {
    syntax: "<number>";
    inherits: true;
    initial-value: 0;
  }

  :root { --bar: #f5a623; --track: #2a241b; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #14110c; color: #f4efe7;
         font: 1rem/1.6 system-ui, sans-serif; }

  /* Fixed column of three vertical bars, right edge of viewport */
  .section-map {
    position: fixed; top: 50%; right: 1.25rem;
    translate: 0 -50%;
    display: grid; gap: 8px;
    z-index: 40;
  }
  .section-map a {
    display: block; width: 4px; height: 48px;
    background: var(--track); border-radius: 2px;
    overflow: hidden; text-decoration: none;
    /* keyboard focusable with a visible outline */
    outline-offset: 3px;
  }
  .section-map a::before {
    content: ""; display: block;
    width: 100%; height: 100%;
    background: var(--bar);
    transform-origin: top;
    /* reads --fill from the section ancestor via @property inherits:true */
    transform: scaleY(var(--fill));
  }

  /* Each section names its own timeline on the block axis */
  #s1 { view-timeline-name: --tl-intro; view-timeline-axis: block; }
  #s2 { view-timeline-name: --tl-work;  view-timeline-axis: block; }
  #s3 { view-timeline-name: --tl-contact; view-timeline-axis: block; }

  section {
    min-height: 100vh;
    display: grid; place-items: center;
    font-size: clamp(1.5rem, 6vw, 3rem); font-weight: 700;
    animation-name: fill-section;
    animation-fill-mode: both;
    animation-timing-function: linear;
  }
  @keyframes fill-section { from { --fill: 0; } to { --fill: 1; } }

  /* Point each section's animation at its own named timeline */
  #s1 { animation-timeline: --tl-intro;   }
  #s2 { animation-timeline: --tl-work;    }
  #s3 { animation-timeline: --tl-contact; }

  /* Point each bar link at the same named timeline so its ::before fills */
  #map-s1 { animation: fill-section both linear; animation-timeline: --tl-intro;   }
  #map-s2 { animation: fill-section both linear; animation-timeline: --tl-work;    }
  #map-s3 { animation: fill-section both linear; animation-timeline: --tl-contact; }

  @media (prefers-reduced-motion: reduce) {
    section, .section-map a {
      animation: none;
    }
    /* Static: all bars fully filled and dimmed */
    .section-map a::before { transform: scaleY(1); opacity: 0.45; }
  }
</style></head>
<body>
  <!-- Section map doubles as anchor navigation; aria-label on each link -->
  <nav class="section-map" aria-label="Section progress">
    <a id="map-s1" href="#s1" aria-label="Introduction"></a>
    <a id="map-s2" href="#s2" aria-label="Work"></a>
    <a id="map-s3" href="#s3" aria-label="Contact"></a>
  </nav>

  <main>
    <section id="s1">Introduction</section>
    <section id="s2">Work</section>
    <section id="s3">Contact</section>
  </main>
</body></html>
```

Note: `view-timeline-name` / `animation-timeline` with named cross-element bindings requires Chrome/Edge 115+ or Safari 26+. The `@property` registration is supported in the same engines. Progressive-enhance: on Firefox, the bars stay static (at `--fill: 0`, same as the scrollbar being at the top) and the anchor links still work — navigation is not gated on the effect.

### GSAP ScrollTrigger — smoothed bar with accessible readout (production fallback)
Robust everywhere, gives `self.progress` (0–1) in `onUpdate`, and `scrub` adds a soft lag that feels premium. Includes a real reduced-motion branch and a throttled spoken percentage for users who want a readout.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>GSAP scroll progress bar</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #14110c; color: #f4efe7;
         font: 1.1rem/1.7 Georgia, serif; }

  .progress-track {
    position: fixed; inset: 0 0 auto 0;
    height: 4px; background: #211d17; z-index: 50;
  }
  .progress-bar {
    height: 100%; background: #f5a623;
    transform: scaleX(0); transform-origin: 0 50%;
  }
  /* Visually hidden live region for screen-reader readout */
  .sr-only {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0 0 0 0); white-space: nowrap; border: 0;
  }
</style></head>
<body>
  <div class="progress-track" aria-hidden="true">
    <div id="bar" class="progress-bar"></div>
  </div>

  <!-- Spoken percentage — polite so it queues behind current AT speech.
       Throttled to every 10% so it does not flood the queue. -->
  <output id="pct" class="sr-only" aria-live="polite">0% read</output>

  <main style="max-width: 68ch; margin: 0 auto; padding: 5rem 1.5rem;">
    <h1>Reading progress</h1>
    <p style="height: 240vh">
      Long article body. Scroll to see the amber bar advance.
    </p>
    <p>End of article.</p>
  </main>

  <script>
    gsap.registerPlugin(ScrollTrigger);

    const reduce  = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bar     = document.querySelector('#bar');
    const pct     = document.querySelector('#pct');

    if (reduce) {
      // Static honest state: full-width, dimmed, no spring or scrub.
      gsap.set(bar, { scaleX: 1, opacity: 0.5 });
    } else {
      let lastSpoken = -1;

      gsap.to(bar, {
        scaleX: 1,
        ease: 'none',       // 1:1 with scroll; scrub provides the smoothing
        scrollTrigger: {
          trigger: document.documentElement,
          start:   'top top',
          end:     'bottom bottom',
          scrub:   0.3,     // 300 ms lag — soft, not laggy
          onUpdate: (self) => {
            const p = Math.round(self.progress * 100);
            // Announce at every 10% boundary, not every scroll pixel
            if (p !== lastSpoken && p % 10 === 0) {
              pct.textContent = p + '% read';
              lastSpoken = p;
            }
          },
        },
      });
    }
  </script>
</body></html>
```

### Framer Motion (React) — `useScroll` bound to scaleX
```jsx
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();   // 0 -> 1 over full document
  const reduce = useReducedMotion();

  // Spring easing: expo-ish settle. Stiffness 120 / damping 30 gives a
  // 200-300 ms feel without overshooting. Disabled entirely under reduced motion.
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    // aria-hidden: decorative orientation aid; scrollbar conveys position to AT
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: "0 0 auto 0",
        height: 4,
        background: "#211d17",
        zIndex: 50,
      }}
    >
      <motion.div
        style={{
          height: "100%",
          background: "#f5a623",
          transformOrigin: "0 50%",
          // Under reduced motion: static full bar, dimmed — no spring binding
          scaleX: reduce ? 1 : scaleX,
          opacity: reduce ? 0.5 : 1,
        }}
      />
    </div>
  );
}
```

### Variant: SVG progress ring (corner position)
A circular ring in the corner using `stroke-dashoffset` driven by a passive scroll listener. The JS approach is intentional here — the `stroke-dashoffset` CSS property is not directly animatable by `animation-timeline` without a registered `@property` angle hack; the scroll-listener path is simpler and equally performant for a single element.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>SVG progress ring</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #14110c; color: #f4efe7;
         font: 1.1rem/1.7 Georgia, serif; }

  /* Ring anchored to bottom-right; rotated so the fill starts at the top */
  .ring-wrap {
    position: fixed; bottom: 1.5rem; right: 1.5rem;
    width: 48px; height: 48px;
    /* rotate -90deg so dashoffset fill starts at 12 o'clock */
    transform: rotate(-90deg);
    z-index: 50;
  }
  .ring-wrap circle {
    fill: none;
    stroke-width: 4;
    stroke-linecap: round;
  }
  .ring-track { stroke: #211d17; }
  /* r = 20 → circumference = 2π × 20 ≈ 125.66 */
  .ring-fill  {
    stroke: #f5a623;
    stroke-dasharray: 125.66;
    stroke-dashoffset: 125.66; /* starts empty */
    transition: stroke-dashoffset 0.08s linear;
  }

  @media (prefers-reduced-motion: reduce) {
    /* Static ring at ~80% to indicate "you are in a long article";
       transition removed so no movement occurs. */
    .ring-fill {
      stroke-dashoffset: 25.13; /* 20% of circumference left = 80% filled */
      opacity: 0.5;
      transition: none;
    }
  }
</style></head>
<body>
  <!-- aria-hidden: decorative; scrollbar already communicates position to AT -->
  <svg class="ring-wrap" aria-hidden="true"
       viewBox="0 0 48 48" width="48" height="48">
    <circle class="ring-track" cx="24" cy="24" r="20"/>
    <circle class="ring-fill"  cx="24" cy="24" r="20" id="ring-fill"/>
  </svg>

  <main style="max-width: 68ch; margin: 0 auto; padding: 5rem 1.5rem;">
    <h1>Progress ring</h1>
    <p style="height: 240vh">
      Long article. The ring in the bottom-right corner fills as you scroll.
    </p>
    <p>End of article.</p>
  </main>

  <script>
    const ring   = document.getElementById('ring-fill');
    // r = 20 → C = 2 × Math.PI × 20 = 125.664
    const C      = 2 * Math.PI * 20;
    const root   = document.documentElement;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let   ticking = false;

    if (!reduce) {
      function update() {
        const max    = root.scrollHeight - root.clientHeight;
        const p      = max > 0 ? Math.min(root.scrollTop / max, 1) : 0;
        // dashoffset = C × (1 − p): full offset = empty ring, 0 offset = full ring
        ring.style.strokeDashoffset = (C * (1 - p)).toFixed(3);
        ticking = false;
      }

      window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
      }, { passive: true });

      window.addEventListener('resize', update, { passive: true });
      update();
    }
  </script>
</body></html>
```

## Variations
- **Shape:** top bar (`scaleX`) vs corner ring (`stroke-dashoffset` on an SVG circle) vs right-edge stack of section bars (`scaleY`). The knob is which geometric property gets mapped to scroll progress.
- **Scope:** whole-document `scroll(root)` vs container-local `scroll(nearest)` for a scrollable panel vs per-section `view()` + named timelines.
- **Coupling:** hard 1:1 (`linear` / `scrub: true`) vs softened lag (`scrub: 0.3`, or `useSpring` with stiffness 120/damping 30) — the knob is how much the bar trails the scroll thumb.
- **Readout:** silent decorative bar vs exposed numeric label; if exposed, use `<output aria-live="polite">` and throttle to every 10%.
- **Fill channel:** length-based (grows from 0 to full width) vs color-shift (single hue light to saturated, via `color-mix` or `currentColor`) — moving the channel is a lower-motion alternative to moving the geometry.

## Accessibility
- **prefers-reduced-motion (mandatory, shown in every snippet above).** The reduced-motion branch renders the bar **static and honest** — full-width at `scaleX(1)`, dimmed to `opacity: 0.5`. A scroll progress bar is the rare case where "don't animate" cannot mean "hide or freeze mid-fill"; the safe choice is to stop scrubbing and let the native scrollbar carry position awareness. The bar remains present and never misleads about content completeness.
- **Not motion-gated.** Reading position is already conveyed to assistive technology by the browser's own scrollbar, so the decorative bar carries `aria-hidden="true"`. Article text is fully present and readable with JS disabled, with the native timeline unsupported, or with the bar's CSS removed entirely — the bar is enhancement, never a gate on content.
- **Screen-reader readout (optional).** If a spoken percentage is desirable, use a visually-hidden `<output aria-live="polite">` and **throttle announcements to every 10% boundary** (as in the GSAP example above). Announcing on every scroll pixel floods the AT queue and is hostile. Never put `aria-live` on a node that updates continuously.
- **Pointer and touch.** This effect is scroll-driven, not cursor- or hover-driven, so there is no `(hover: hover)` or `(pointer: fine)` dependency. On touch devices the native scroll timeline is, if anything, smoother. Do not attach `mousemove` to a reading progress bar; bind to the scroll event exclusively so touch users are never disadvantaged.
- **Contrast.** The non-text bar must clear WCAG 1.4.11 non-text contrast of 3:1 against adjacent colors. The amber `#f5a623` on near-black track `#211d17` measures **8.27:1** (computed from WCAG relative luminance), comfortably above the floor. Body text `#f4efe7` on `#14110c` measures **16.45:1**. Keep the bar out of the tab order and never let it overlap interactive controls or visible focus rings.
- **No role needed in the common case.** A reading-progress bar is decorative orientation metadata, not task progress. Marking it `aria-hidden="true"` is correct and recommended. Only add `role="progressbar"` with `aria-valuenow` / `aria-label` if the bar is the primary interface for a task with a defined completion (uploading, processing, etc.), in which case throttled `aria-live` updates also apply.

## Performance
- **Animate only `transform` (`scaleX`, `scaleY`, `stroke-dashoffset`) and `opacity`.** Never animate `width`, `height`, or `left` for the fill — those trigger layout on every frame. `scaleX` composites to the GPU for free.
- **Native `scroll()`/`view()` runs off the main thread** on supported browsers — no listener, no paint per frame, no forced synchronous layout. This is the cheapest possible implementation and the primary reason to prefer it over the JS fallback.
- **JS fallback must be passive + rAF-batched.** `{ passive: true }` on the scroll listener, one `requestAnimationFrame`, one CSS-variable write, guarded by a `ticking` flag. Never read layout (`scrollHeight`) and write style in the same synchronous handler — that is a forced reflow.
- **`will-change: transform`** on the bar element is almost always unnecessary (it is a single tiny element). Add it only if you observe compositor-promotion flicker; never sprinkle it preemptively.
- **Bundle cost.** Native CSS = 0 KB. GSAP core + ScrollTrigger ≈ 70 KB gzipped — only justified if GSAP is already in the page for other work. Framer Motion `useScroll` is fine if Motion is already a dependency. Do not pull in either library solely for a 4 px progress bar.
- **`scrub` smoothing** (0.2–0.5) softens the feel for free; values above 1 make the bar feel disconnected from the scroll thumb and erode trust.

## Anti-slop
Cliché (see `_slop-blocklist.md` → MOTION and COLOR): the **purple-to-pink gradient reading bar** bolted onto every page — same default `linear-gradient(90deg, #8b5cf6, #ec4899)` AI tell, same hard 1:1 scrub with default `linear` easing, present on pages that barely scroll (homepage, contact form). The companion failure is no track beneath the bar, so at 0% scroll the indicator is invisible and the user cannot tell it is present.

Tasteful alternative: a **single committed brand hue** (here: warm amber `#f5a623`, no gradient), a visible track so the bar reads at rest, a `scrub: 0.3` or spring lag with a mild expo settle (`cubic-bezier(0.16, 1, 0.3, 1)`) so the fill settles rather than snapping, and — most critically — the bar appears **only on genuinely long linear reading content**. If varying the aesthetic, change the *channel* that maps to progress (fill a single-hue saturation shift, or animate `stroke-dashoffset` on an SVG ring) instead of defaulting to a multicolor sweep.

## Pairs well with
- `text-reveal-on-scroll` — the bar orients the reader through long pinned reveal sections so scrubbed display copy never feels disorienting; both components benefit from expo-out easing (`cubic-bezier(0.16, 1, 0.3, 1)`) — a fast initial response that decelerates gently to a stop, avoiding the abrupt snap of `linear` or the overshoot of a spring — applied to the scrub lag (`scrub: 0.3` in ScrollTrigger) or to spring stiffness/damping values in `useSpring`.
- `sticky-pinning` — when a section is pinned and scrubbed, a local `scroll(nearest)` bar shows progress *within* the pin so the user knows when the panel will release.
- `editorial-typographic` — long-form serif reading layouts are exactly where a reading progress bar earns its place and feels editorial rather than app-like.
- `scroll-linked-scrubbing` — per-section bars complement any scrub-driven story where "where am I in this sequence?" is a live reader question.

## Current references
- [Scroll progress animations in CSS — MDN Blog](https://developer.mozilla.org/en-US/blog/scroll-progress-animations-in-css/) — canonical `scaleX` + `animation-timeline: scroll(root)` bar pattern, including the "declare timeline after shorthand" gotcha.
- [animation-timeline: scroll() — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline) — full spec for scroll progress timelines, scroller/axis parameters, named timelines.
- [animation-timeline: scroll() — caniuse](https://caniuse.com/mdn-css_properties_animation-timeline_scroll) — live support table; confirms Chrome/Edge 115+, Safari 26+, Firefox behind a flag (~83% global as of mid-2026).
- [Using CSS scroll-driven animations for section-based progress indicators — Frontend Masters (2024)](https://frontendmasters.com/blog/using-css-scroll-driven-animations-for-section-based-scroll-progress-indicators/) — `view()` + registered `@property` per-section bar technique used in the third code block above.
- [Animate elements on scroll with scroll-driven animations — Chrome for Developers](https://developer.chrome.com/docs/css-ui/scroll-driven-animations) — off-main-thread rationale, `grow-progress` keyframes, and why native beats scroll listeners.
- [An introduction to CSS scroll-driven animations — Smashing Magazine (Dec 2024)](https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations/) — deep current walkthrough of scroll and view progress timelines, including the `@supports` progressive-enhancement pattern.
- [scroll-driven-animations.style — progress bar demos](https://scroll-driven-animations.style/demos/progress-bar/css/) — Bramus Van Damme's reference gallery; forkable named-timeline and anonymous-timeline progress bar implementations.
- [ScrollTrigger progress — GSAP docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/progress/) — `self.progress`, `scrub`, `onUpdate` callback syntax for the library fallback.
- [useScroll — Motion for React docs](https://motion.dev/docs/react-use-scroll) — `scrollYProgress`, `target`-scoped tracking, `useSpring` smoothing, and native `ScrollTimeline` delegation.
- [ARIA: progressbar role — MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/progressbar_role) — when `role="progressbar"` with `aria-valuenow` is warranted (task completion) versus when `aria-hidden` is the right call (decorative orientation).
