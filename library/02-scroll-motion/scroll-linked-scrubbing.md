# Scroll-linked scrubbing

> Animation progress is bound directly to scroll position so the scrollbar acts as a playhead — scroll forward to advance, scroll back to rewind.

**Bucket:** scroll/motion
**Maturity:** current
**Effort:** medium
**Best for:** websites, portfolios, editorial/storytelling sites, product feature walkthroughs, dashboards

## What it is

The user's scroll position *is* the animation's timeline. Instead of firing an animation once when an element enters the viewport (a *trigger*), you map a scroll range to a progress value from 0 to 1 and drive CSS properties directly from it. Because the mapping is positional rather than time-based, the animation runs forward as the user scrolls down and reverses exactly as they scroll back up — there is no "play once and done." Think of dragging a video scrubber: the frame shown is a pure function of the handle position.

Smoothing (a deliberate lag between the real scroll position and the animation playhead) is an optional overlay. It creates a cinematic, inertial feel — but it removes the exact synchrony that makes a reading-progress bar feel accurate, so apply it only when the trailing motion is an intentional design choice.

## When to use

- A pinned section where the user should feel they are *driving* the change — a product rotating, a chart drawing itself, a horizontal gallery panning.
- Parallax depth: background, midground, and foreground layers moving at different fractions of scroll speed to simulate perspective.
- Progress affordances: a reading bar at the top of an article, a section indicator dot that fills, an SVG path that draws as the user descends.
- Scrollytelling sections where the reveal must be reversible and tightly paced to the reader's position, not to a fixed animation duration.
- Any moment where reversibility is part of the meaning — scroll up should undo the state, not replay from the beginning.

## When NOT to use

- **Simple one-shot entrances.** A card fading in when it appears is a *trigger*, not a scrub. Making it scroll-coupled just makes the entrance sticky and contingent on scroll speed. Use IntersectionObserver / `view()` / `whileInView` and let it play at its own duration.
- **Body text the user needs to consume quickly.** Coupling text opacity or position to scroll forces slow, deliberate scrolling — hostile for reading.
- **Complex animations on low-end devices.** Every scroll tick recomputes the frame. Expensive work (heavy filters, layout-affecting properties, large canvas redraws) jank badly at mobile scroll rates.
- **Every section on the page.** This is the most common overuse. Applying scrubbing everywhere trains users to scroll slowly through the whole site, making navigation feel exhausting. Reserve it for one or two intentional focal mechanics.
- **When `prefers-reduced-motion` is set.** Render the final composed state and skip the scroll coupling entirely — vestibular disorders make positional motion genuinely harmful.

## How it works

A scrubbed animation needs two things: a **scroll progress value** (a number from 0 to 1 representing how far the user has scrolled within a defined range) and a **mapping** from that value to one or more CSS properties.

**Native CSS** uses `animation-timeline: scroll()` to tie a keyframe animation to a scroll container's position. `animation-timeline: view()` instead ties it to an element's progress through the viewport. `animation-duration` must be `auto` — there is no clock, so a seconds value makes no sense. The browser resolves this on the compositor thread, completely off the main thread, so it stays smooth even under heavy JavaScript load. Support caveat: Chromium (Chrome/Edge 115+, Samsung Internet 23+, Safari 26+) ships it; Firefox keeps it behind a flag as of mid-2026. Progressive-enhance with `@supports`.

**GSAP ScrollTrigger** with `scrub: true` welds the tween's playhead to the scroll position with no delay — strictly 1:1. `scrub: <number>` (e.g. `scrub: 0.6`) adds a catch-up lag in seconds: the playhead takes that many seconds to reach where the scroll actually is, producing a soft, trailing feel. Use `gsap.matchMedia()` to conditionally register ScrollTriggers so they are automatically torn down when a media query stops matching.

**Motion React** (`motion/react`, formerly `framer-motion` — package renamed in 2025) returns a `scrollYProgress` MotionValue (0→1) from `useScroll`. Pass it through `useTransform` to map onto any CSS value. Motion leverages the browser's native `ScrollTimeline` Web API in Chromium for hardware-accelerated scroll-linked animation; on other browsers it falls back to `requestAnimationFrame` polling. Wrap with `useSpring` to add smoothing equivalent to GSAP's scrub number.

**Lenis** is not a scrubbing API — it normalises scroll velocity across browsers and input devices so that the underlying scrub feels buttery rather than steppy. Drive it from GSAP's ticker so there is one RAF loop.

**Scrub vs trigger, the rule:** if scrolling *up* should *reverse* the animation, scrub. If the animation should play through once at its own pace on entry, trigger.

### Key API properties

| Layer | API | Scrub control |
|---|---|---|
| CSS native | `animation-timeline: scroll(root block)` | 1:1, no lag option |
| GSAP | `ScrollTrigger` `scrub: true` / `scrub: 0.6` | `true` = exact, number = lag seconds |
| Motion React | `useScroll` + `useTransform` (+ `useSpring`) | 1:1 direct; `useSpring` for lag |

`scroll()` parameters: `scroll(<scroller> <axis>)` where scroller is `nearest` (default), `root`, or `self`, and axis is `block` (default, vertical), `inline` (horizontal), `x`, or `y`. Parameters can be given in any order.

## Working code

### Native CSS — reading-progress bar and view-linked card scrub

Full support: Chromium (Chrome/Edge 115+, Safari 26+). Firefox: animates when the flag is enabled, silently skips when it is not — the resting state remains visible, which is acceptable progressive enhancement. Wrap in `@supports` and `@media (prefers-reduced-motion)`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Native scroll scrubbing</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { color-scheme: dark; }

    body {
      font-family: "Geist", system-ui, sans-serif;
      background: #0c0d10;
      color: #f2f3f5;
      line-height: 1.7;
    }

    /* (A) scroll() — progress bar driven by the root scroller, 0%→100% of page */
    .progress-bar {
      position: fixed;
      inset: 0 0 auto 0;
      height: 3px;
      background: #1e1e24;
      z-index: 100;
    }
    .progress-bar__fill {
      height: 100%;
      background: #e8542b;        /* single amber accent, not default SaaS blue */
      transform-origin: left center;
      transform: scaleX(0);       /* safe fallback for non-supporting browsers */
    }

    /* Enhanced: scrub only when supported */
    @supports (animation-timeline: scroll()) {
      .progress-bar__fill {
        animation: grow-bar linear both;
        animation-duration: auto;           /* must be auto, not seconds */
        animation-timeline: scroll(root block);
      }
      @keyframes grow-bar {
        from { transform: scaleX(0); }
        to   { transform: scaleX(1); }
      }
    }

    /* (B) view() — card scrubs as it crosses the viewport */
    .card {
      width: min(560px, 88vw);
      margin: 20vh auto;
      padding: 2rem;
      border-radius: 12px;
      background: #15171c;
      border: 1px solid #23262e;
      /* Safe resting state: fully visible */
      opacity: 1;
      transform: none;
    }

    @supports (animation-timeline: view()) {
      .card {
        opacity: 0.15;
        transform: translateY(32px) scale(0.97);
        animation: card-settle linear both;
        animation-duration: auto;
        animation-timeline: view();
        animation-range: entry 10% cover 40%;
      }
      @keyframes card-settle {
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
    }

    /* MANDATORY: reduced-motion disables all scroll coupling; resting state stays */
    @media (prefers-reduced-motion: reduce) {
      .progress-bar__fill {
        animation: none;
        transform: scaleX(0); /* bar stays at 0; not distracting */
      }
      .card {
        animation: none;
        opacity: 1;
        transform: none;
      }
    }

    /* Layout */
    .spacer {
      height: 80vh;
      display: grid;
      place-items: center;
      color: #5a5c65;
    }
    .card h2 {
      font-size: clamp(1.25rem, 3vw, 1.75rem);
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin-bottom: 0.75rem;
    }
    .card p { color: #9b9791; font-size: 0.9375rem; }
  </style>
</head>
<body>
  <!-- aria-hidden: decorative indicator, not an interactive control -->
  <div class="progress-bar" aria-hidden="true">
    <div class="progress-bar__fill"></div>
  </div>

  <div class="spacer">scroll down</div>

  <article class="card">
    <h2>Driven by scroll position</h2>
    <p>This card's opacity and offset are a pure function of where it sits in the viewport. Scroll up and it un-settles. No JavaScript involved — the compositor runs it off the main thread.</p>
  </article>

  <article class="card">
    <h2>Reversible by construction</h2>
    <p>The mapping is positional: progress 0 = first keyframe, progress 1 = last. Reverse the scroll, reverse the animation. A trigger plays once and holds; a scrub tracks your position continuously.</p>
  </article>

  <article class="card">
    <h2>Progressive enhancement</h2>
    <p>Browsers without scroll-driven animation support see the resting state — fully visible text. The <code>@supports</code> guard ensures nothing is hidden from them.</p>
  </article>

  <div class="spacer">end</div>
</body>
</html>
```

Contrast note (colors used above): body text `#f2f3f5` on card background `#15171c` — approximate relative luminances 0.907 and 0.012, ratio ≈ **15.9:1** (exceeds WCAG AAA 7:1 for normal text). The transitional `opacity: 0.15` state during scrub is a mid-animation frame, not a resting state, so the temporary contrast failure is acceptable for a decorative effect.

### GSAP ScrollTrigger — horizontal gallery with smoothed scrub

Cross-browser (Chrome, Firefox, Safari). Uses `scrub: 0.6` for a slight cinematic lag. `gsap.matchMedia()` handles reduced-motion and cleans up automatically when the query changes. Requires GSAP 3.13+ core + ScrollTrigger from CDN.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GSAP horizontal gallery scrub</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #0c0d10;
      color: #f2f3f5;
      font-family: system-ui, sans-serif;
      overflow-x: hidden;
    }

    .intro {
      height: 50vh;
      display: flex;
      align-items: flex-end;
      padding: 0 2rem 3rem;
      font-size: clamp(1.5rem, 4vw, 2.5rem);
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }

    /* pin-section height is set by JS proportionally to gallery width */
    .gallery-viewport {
      height: 100vh;
      display: flex;
      align-items: center;
      overflow: hidden;
    }

    .gallery-track {
      display: flex;
      gap: 1.25rem;
      padding-inline: 2rem;
      will-change: transform; /* single element; compositor can promote it */
    }

    .card {
      flex-shrink: 0;
      width: clamp(260px, 36vw, 440px);
      aspect-ratio: 3 / 4;
      border-radius: 8px;
      background: #15171c;
      border: 1px solid #23262e;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 1.5rem;
    }

    .card:nth-child(1) { background: #12131a; }
    .card:nth-child(2) { background: #141620; }
    .card:nth-child(3) { background: #111827; }
    .card:nth-child(4) { background: #0f1520; }

    .card__label {
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #e8542b;
      margin-bottom: 0.4rem;
    }

    .card__title {
      font-size: clamp(1rem, 2.5vw, 1.4rem);
      font-weight: 600;
      line-height: 1.25;
      color: #f2f3f5;
    }

    .outro {
      height: 50vh;
      display: flex;
      align-items: center;
      padding: 2rem;
      color: #5a5c65;
    }

    /* Reduced-motion: stack cards vertically, no horizontal scrub */
    @media (prefers-reduced-motion: reduce) {
      .gallery-track {
        flex-wrap: wrap;
        padding: 2rem;
        will-change: auto;
      }
      .card {
        width: min(400px, 90vw);
        aspect-ratio: auto;
        min-height: 240px;
      }
    }
  </style>
</head>
<body>

  <div class="intro">Scroll to move through the work.</div>

  <div id="pinSection">
    <div class="gallery-viewport" id="galleryViewport">
      <div class="gallery-track" id="galleryTrack">
        <article class="card">
          <p class="card__label">Brand identity</p>
          <h2 class="card__title">Meridian Financial rebrand</h2>
        </article>
        <article class="card">
          <p class="card__label">Product design</p>
          <h2 class="card__title">Cargo iOS navigation system</h2>
        </article>
        <article class="card">
          <p class="card__label">Editorial</p>
          <h2 class="card__title">Coastal Cities annual report</h2>
        </article>
        <article class="card">
          <p class="card__label">Motion</p>
          <h2 class="card__title">Vault launch campaign</h2>
        </article>
      </div>
    </div>
  </div>

  <div class="outro">End of gallery — continue scrolling normally.</div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js"></script>
  <script>
    gsap.registerPlugin(ScrollTrigger);

    // gsap.matchMedia: automatically sets up/tears down per-query; no manual cleanup needed.
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const track    = document.getElementById("galleryTrack");
      const section  = document.getElementById("pinSection");

      // Distance the track needs to travel: total scrollable width minus one viewport
      const getDistance = () =>
        track.scrollWidth - document.documentElement.clientWidth;

      // Make the pin section tall enough so the full travel maps to scroll
      const applyHeight = () => {
        section.style.height = getDistance() + window.innerHeight + "px";
      };

      applyHeight();

      gsap.to(track, {
        x: () => -getDistance(),
        ease: "none",              // linear 1:1 mapping of scroll → x position
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + getDistance(),
          pin: "#galleryViewport",  // sticky while user scrubs
          scrub: 0.6,              // 0.6s catch-up lag: cinematic, not rigid 1:1
          invalidateOnRefresh: true,
        },
      });

      // gsap.matchMedia cleanup: called when the query no longer matches
      return () => {
        ScrollTrigger.getAll().forEach(t => t.kill());
        section.style.height = "";
      };
    });
    // Note: inside a scrubbed timeline, per-tween `ease` shapes how the property
    // distributes across the scroll range. `ease:"none"` = strict linear coupling.
    // The scrub *number* (0.6) is separate — it is the smoothing lag, not the easing.
  </script>
</body>
</html>
```

### Motion React — `useScroll` + `useTransform` + `useSpring` with reduced-motion guard

Requires `motion` (install: `npm install motion`). Import from `motion/react` — the package was renamed from `framer-motion` in 2025.

```jsx
// ScrollParallaxSection.jsx
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from "motion/react";

/**
 * Two-layer parallax: background blob moves at 0.4× scroll speed,
 * foreground card at 1×. The user controls the animation by scrolling.
 * Reduced-motion: both layers are static; no scroll coupling.
 */
export function ScrollParallaxSection() {
  const sectionRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  // Track this section's progress from entering to leaving the viewport
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Spring adds smoothed catch-up lag (equivalent to GSAP scrub: 0.6)
  // stiffness/damping ratio controls the trailing feel
  const springCfg = { stiffness: 90, damping: 22, restDelta: 0.001 };

  // Background: slow layer, moves 40px up over full section range
  const blobRawY = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [0, -40]
  );
  const blobY = useSpring(blobRawY, springCfg);

  // Foreground card: faster layer, moves 100px up
  const cardRawY = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [0, -100]
  );
  const cardY = useSpring(cardRawY, springCfg);

  // Opacity: card fades in over the first 30% of the section's range
  const cardOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#0c0d10",
      }}
    >
      {/* Background blob — slow parallax layer */}
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          y: blobY,
          background:
            "radial-gradient(ellipse 55% 45% at 50% 60%, oklch(38% 0.1 250 / 0.3) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Foreground card — faster parallax layer */}
      <motion.article
        style={{
          position: "relative",
          y: cardY,
          opacity: shouldReduceMotion ? 1 : cardOpacity,
          background: "#15171c",
          border: "1px solid #23262e",
          borderRadius: 10,
          padding: "2.5rem",
          maxWidth: "28rem",
          width: "90%",
          color: "#f2f3f5",
        }}
      >
        <p
          style={{
            fontSize: "0.6875rem",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#e8542b",
            marginBottom: "0.75rem",
          }}
        >
          Case study
        </p>
        <h2
          style={{
            fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            marginBottom: "1rem",
          }}
        >
          Rebuilding the Ardent checkout flow
        </h2>
        <p style={{ color: "#9b9791", lineHeight: 1.65, fontSize: "0.9375rem" }}>
          A fourteen-week project that reduced cart abandonment by 31% by
          removing three steps and adding inline address validation.
        </p>
      </motion.article>
    </section>
  );
}
```

### Lenis — smooth scroll feed paired with GSAP (optional)

Add only when raw scrubbing feels steppy. Drive Lenis from GSAP's ticker so there is one RAF loop.

```html
<!-- Lenis 1.3.x CDN -->
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.23/dist/lenis.css">
<script src="https://unpkg.com/lenis@1.3.23/dist/lenis.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js"></script>
<script>
gsap.registerPlugin(ScrollTrigger);

// Never hijack scroll for reduced-motion users
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduce) {
  const lenis = new Lenis({ autoRaf: false, lerp: 0.1 });

  // Sync Lenis scroll to ScrollTrigger's internal scroll state
  lenis.on("scroll", ScrollTrigger.update);

  // One RAF loop: GSAP ticker drives Lenis (seconds → ms)
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0); // prevent GSAP's built-in lag from fighting Lenis
}
</script>
```

## Variations

- **1:1 scrub** — playhead follows scroll exactly with no lag. Best for reading-progress bars and data-driven indicators where accuracy matters. CSS native or GSAP `scrub: true`.
- **Smoothed scrub** — playhead lags behind by 0.3–1 s. Creates inertial, cinematic feel without exact synchrony. Best for parallax layers and horizontal galleries. GSAP `scrub: 0.6` or Motion `useSpring`.
- **Partial-range scrub** — animation runs over a sub-range of total scroll (e.g. only 20%–60% of a pinned section). CSS: `animation-range: entry 20% cover 60%`. GSAP: `start`/`end` on the ScrollTrigger.
- **Pinned vs flowing** — hold the section with `pin: true` so the whole scroll range maps to one stage; or let content flow past while a fixed element scrubs. Knob: pinning.
- **Horizontal gallery** — vertical scroll drives horizontal `x` translation. The canonical GSAP pattern: pin + `x: -totalWidth` tween with `scrub`. Shown in the working code above.
- **SVG path draw** — animate `stroke-dashoffset` from the full path length to 0 via scrub. Renders as a path drawing itself. Works natively in CSS via `@keyframes` + `animation-timeline`.
- **Video scrub** — set `video.currentTime` from scroll progress in an `onUpdate` callback. Cannot be done in native CSS; requires JavaScript reading `scrollYProgress * video.duration`.
- **Multi-element sequence** — multiple tweens in a GSAP timeline at different positions; one scrub ScrollTrigger advances the whole timeline. Per-tween `ease` values distribute how each property accelerates across the scroll range, independent of the scrub lag.
- **Eased distribution** — even on a scrubbed timeline, per-keyframe easing shapes how the property ramps. `ease: "none"` = strict linear coupling to scroll; `ease: "power2.inOut"` clusters the change at the middle of the scroll range for a more interesting mapping than monotone progression.

## Accessibility

### prefers-reduced-motion (mandatory)

Scroll-linked motion can cause vestibular discomfort — nausea, disorientation, and headache — for users with vestibular disorders. Every scrubbed element must either disable or significantly reduce its motion when the OS preference is set. A file without this handling auto-fails.

**CSS native** — wrap inside `@media (prefers-reduced-motion: no-preference)` or, as shown in the working code, guard the `@supports` block and override inside a reduce query:

```css
/* Default: visible resting state (safe for all) */
.card { opacity: 1; transform: none; }

/* Enhanced: scrub only for users who are OK with motion */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .card {
      opacity: 0.15;
      transform: translateY(32px) scale(0.97);
      animation: card-settle linear both;
      animation-duration: auto;
      animation-timeline: view();
      animation-range: entry 10% cover 40%;
    }
    @keyframes card-settle {
      to { opacity: 1; transform: none; }
    }
  }
}
```

**GSAP** — use `gsap.matchMedia()` to register ScrollTriggers only under `prefers-reduced-motion: no-preference`. The return function is called automatically when the query unmatch:

```js
// Extension of the GSAP working code above — uses the same #galleryTrack / #pinSection IDs.
gsap.registerPlugin(ScrollTrigger);
const mm = gsap.matchMedia();

mm.add("(prefers-reduced-motion: no-preference)", () => {
  const track   = document.getElementById("galleryTrack");
  const section = document.getElementById("pinSection");

  // Distance the track must travel: full width minus one viewport
  const totalDistance = track.scrollWidth - document.documentElement.clientWidth;

  gsap.to(track, {
    x: -totalDistance,
    ease: "none",
    scrollTrigger: {
      trigger: section,
      scrub: 0.6,
      pin: "#galleryViewport",
      end: "+=" + totalDistance,
      invalidateOnRefresh: true,
    },
  });

  // Return value: cleanup function called automatically on query unmatch
  return () => ScrollTrigger.getAll().forEach(t => t.kill());
});

mm.add("(prefers-reduced-motion: reduce)", () => {
  // Elements remain in natural document flow; no pinning, no translation
});
```

**Motion React** — `useReducedMotion()` returns `true` when the OS setting is on and is reactive (re-evaluates if the setting changes while the page is open). Zero out transform values and set opacity to 1, as shown in the working code above.

### Contrast and focus

- Transitional dim states (e.g. `opacity: 0.15` mid-scrub) can pass through contrast-failing frames. This is acceptable for a decorative mid-scroll state because the element is in motion, not at rest. The resting state must always pass WCAG 2.1 AA (4.5:1 for body text, 3:1 for large text). In this file's palette: `#f2f3f5` text on `#15171c` card ≈ **15.9:1** at rest — passes AAA.
- Interactive elements (links, buttons) inside a scrubbing element must have visible focus indicators throughout the full animation range. If a transform makes a focused element leave the viewport, that is a keyboard trap.
- Pinned sections can strand keyboard focus: a user tabbing into the pinned section may be unable to exit until they scroll past it with a pointing device. Add a visible skip link above the pinned section: `<a class="skip-link" href="#after-gallery">Skip the gallery</a>`.

### Touch and pointer fallback

Scroll-linked scrubbing responds to scroll position, not pointer coordinates, so it works identically on touch without any `@media (hover: hover)` guard. Ensure pinned section heights use `100dvh` rather than `100vh` to avoid the mobile address-bar shrink problem. Never hijack touch-scroll momentum for scroll-linked effects — let the browser's native momentum play through and let the scrub catch up.

### Screen readers

Scrubbed content is typically decorative or supplementary. If semantic meaning is conveyed only through the animated state (e.g. a chart that reveals data as the user scrolls), provide a static equivalent: a visually hidden table or `aria-live` region containing the full data set so assistive-technology users are not gated by scroll position.

## Performance

- **Animate only `transform` and `opacity`.** These are compositor-promoted properties. Animating `top`, `left`, `width`, `height`, `margin`, or `box-shadow` triggers layout recalculation on every scroll tick — guaranteed jank regardless of how the scrub is wired.
- **Native CSS wins on-thread.** `animation-timeline: scroll()` runs on the compositor, completely independent of main-thread JavaScript. A [Chrome Developers case study](https://developer.chrome.com/blog/scroll-animation-performance-case-study) demonstrated that under heavy JS load, a native CSS progress bar was completely unaffected while a JS-based equivalent became janky — the compositor does not share the main thread's frame budget.
- **GSAP runs on the main thread** but batches all scroll handling through a debounced listener synced to `requestAnimationFrame`. Avoid expensive side effects (DOM queries, network calls) in `onUpdate` callbacks; they steal frame budget from the animation.
- **`will-change: transform`** on the actively scrubbing element tells the compositor to promote it to its own GPU layer before animation starts, preventing the promotion hitch on first scroll. Apply only to elements actually animating — over-promoting wastes VRAM and can cause visual artifacts on low-memory devices. Remove it after the interaction if possible.
- **Horizontal gallery scroll distance** — if the gallery track is very wide, `will-change` on the whole track pins a large texture to GPU memory. Prefer `translateX` (transform, compositor) over `marginLeft` (layout). Add `contain: paint` on the viewport wrapper to limit repaint scope.
- **Scrub smoothing cost** — `scrub: 0.6` (GSAP) and `useSpring` (Motion) each run per-frame arithmetic interpolation between two numbers. This is cheap on its own but runs on the main thread. Do not combine it with heavy `onUpdate` computations.
- **Bundle cost.** Native CSS = 0 KB. GSAP core + ScrollTrigger ≈ 50–70 KB gzipped combined (CDN, cached). `motion` is tree-shakeable; `useScroll`/`useTransform` pull a small fraction of the full package. Lenis ≈ 5 KB. Do not ship GSAP just to fade one card — use native CSS or IntersectionObserver for simple cases.
- **Clean up on unmount.** In React and SPA contexts, orphan scroll listeners accumulate. GSAP's `gsap.matchMedia()` cleanup return handles this automatically; the `useGSAP` hook does too. Plain `ScrollTrigger.create()` calls need explicit `.kill()` inside a `useEffect` cleanup function.

## Anti-slop

Cliché (see `_slop-blocklist.md` → MOTION): the full-page parallax hero where **every element drifts simultaneously at the same rate**, plus every section below fading-and-sliding-up with the same default `ease` and the same duration. The result reads as generated — an undifferentiated slow-motion conveyor belt — and induces motion discomfort. It is also the most common reason users disable animations in their OS.

Tasteful version:
- Reserve scrubbing for **one focal narrative mechanic per page** — a pinned gallery, a reading bar, a rotating product diagram. Let everything else trigger-in once on entry.
- Give smoothed scrub a **non-zero value** (`scrub: 0.6`, not `scrub: true`) only for depth layers where lag reads as weight, not for progress bars where accuracy is the point.
- **Vary the axis**: a horizontal gallery driven by vertical scroll is more purposeful and surprising than another vertical fade. The direction mismatch makes the control relationship legible.
- Use **custom per-property easing** within the keyframes or tween: `ease: "power2.inOut"` clusters the change at the centre of the scroll range; `cubic-bezier(0.16, 1, 0.3, 1)` in CSS gives an expo-out feel that reads premium. Default `ease` (`ease-in-out`) applied uniformly is an immediate giveaway.
- Reversibility should **mean something** — if scrolling back up to undo the animation adds no value, you needed a trigger, not a scrub.

## Pairs well with

- `sticky-pinning` — pin a section to the viewport and scrub a sequence while it holds; the scroll height of the pinned section determines the scrub range and pacing
- `scroll-progress-indicator` — the `scroll(root block)` reading bar above is itself a scrub; orient users during long pinned scroll sections
- `text-reveal-on-scroll` — its "scrub fill" variant (words dimmed → full-color tied to scroll position) is this concept applied to typography
- `horizontal-scroll-section` — vertical scroll progress mapped to horizontal `x` translation is pure scrubbing with a cross-axis twist
- `smooth-scroll-lenis` — Lenis normalises scroll velocity across browsers and input devices so scrubbed animations feel consistent; integrate via the GSAP ticker pattern shown above

## Current references

- [MDN — CSS scroll-driven animations guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations) — authoritative overview of `scroll()`/`view()` timelines, `animation-range`, progressive enhancement patterns
- [MDN — `scroll()` CSS function](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline/scroll) — full `scroll(<scroller> <axis>)` syntax, parameter defaults, formal grammar
- [Chrome Developers — Scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations) — `animation-duration: auto` requirement, compositor-thread detail, support table
- [Chrome Developers — Scroll animation performance case study](https://developer.chrome.com/blog/scroll-animation-performance-case-study) — measured proof that native CSS scrub survives main-thread congestion where JS-based implementations stutter
- [Smashing Magazine — Introduction to CSS scroll-driven animations (Dec 2024)](https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations/) — scroll() vs view() mental model, animation-range keywords, accessibility wrapping pattern
- [GSAP — ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) — `scrub` (true vs number), `pin`, `start`/`end`, `invalidateOnRefresh`, performance notes
- [GSAP — gsap.matchMedia() docs](https://gsap.com/docs/v3/GSAP/gsap.matchMedia/) — canonical pattern for prefers-reduced-motion conditional animation and automatic cleanup
- [Motion — useScroll](https://motion.dev/docs/react-use-scroll) — `target`/`offset` API, `scrollYProgress`, native `ScrollTimeline` integration note
- [Motion — React scroll animations](https://motion.dev/docs/react-scroll-animations) — scroll-linked vs scroll-triggered distinction, `useTransform` chaining
- [Motion — useReducedMotion](https://motion.dev/docs/react-use-reduced-motion) — hook API, reactive re-evaluation when OS setting changes
- [Can I use — animation-timeline: scroll()](https://caniuse.com/mdn-css_properties_animation-timeline_scroll) — global support ≈ 83% as of mid-2026; Chrome/Edge 115+, Safari 26+, Firefox behind flag
- [Josh W. Comeau — Scroll-Driven Animations](https://www.joshwcomeau.com/animation/scroll-driven-animations/) — clear mental model for scroll() vs view() timelines and the `animation-fill-mode: backwards` gotcha
