# Smooth scroll (Lenis)

> A ~3 kB library that intercepts wheel and touch input, eases the page to its target scroll position with tunable momentum, and serves as the single RAF clock that GSAP ScrollTrigger reads from — so eased scroll and scroll-linked animations stay frame-perfectly in sync.

**Bucket:** scroll/motion
**Maturity:** current
**Effort:** low (standalone drop-in) to medium (GSAP-synced, fully accessible)
**Best for:** websites, portfolios, agency/editorial sites, product marketing pages

## What it is
Lenis (by darkroom.engineering, formerly Studio Freight) intercepts native wheel and touch events, computes a target scroll position, and lerps the real `window.scrollY` toward it on every animation frame — so the page glides with felt weight rather than snapping to the exact pixel the OS would. It is the current standard that replaced Locomotive Scroll and the older technique of translating an entire wrapper `<div>` to simulate scroll. Crucially, Lenis moves the *real* document scroll position rather than a transformed container, so `position: sticky`, `Find in Page`, native scrollbar dragging, `:target` anchors, and Intersection Observers all keep working without workarounds. Its second job — the reason most production teams reach for it — is acting as the single `requestAnimationFrame` source shared with GSAP ScrollTrigger, so scrubbed scroll-linked animations track an eased position rather than a raw jump.

## When to use
- Editorial, agency, and portfolio sites where deliberate momentum is a brand signal and the page is primarily scroll-narrative rather than dense interface.
- When you are already building GSAP ScrollTrigger pins or scrubs and want the scrubbed animation to track an eased position — without two competing RAF loops desync-ing the result.
- Marketing or launch pages with full-bleed scroll sections, reveal choreography, or parallax where a consistent easing language matters.
- Anywhere you would previously have reached for Locomotive Scroll — Lenis is the maintained, native-scroll-position successor.

## When NOT to use
- **Apps, dashboards, and docs.** Momentum in a tool is perceived as input lag. Users scanning a changelog, navigating a data grid, or Cmd+F-ing through a doc want their scroll to land instantly.
- **Content-heavy long-form reading sites.** Eased scroll makes "scroll back to that passage" feel imprecise and makes keyboard paging (Space, PageDown) feel sluggish.
- **When `prefers-reduced-motion: reduce` is set.** Smooth scroll is the motion, not a decoration on top of it — the correct fallback is to not initialise Lenis at all, not to soften the lerp. Every snippet below does this.
- **Everyone-overuses-this case:** Adding Lenis to every site by reflex because it "looks expensive." On a page with no scroll-linked choreography, you pay a JS-parse and wheel-listener cost for perceivable input lag and nothing else.
- Pages with native CSS scroll-snap, embedded maps, code editors, or virtualised lists — Lenis fights these unless those zones are explicitly excluded with `data-lenis-prevent`.

## How it works
Native scroll moves the document instantly to wherever the input lands. Lenis registers a `wheel` listener (and optionally a `touch` listener), derives a scroll *target*, and on every `requestAnimationFrame` advances the *actual* scroll position a fraction of the remaining gap. You choose one of two feel models:

- **`lerp`** (0–1, default `0.1`): the fraction of remaining distance closed per frame, frame-rate-normalised internally. Lower = heavier and slower to settle; higher = snappier. `0.1` reads smooth; `0.04` reads sluggish and fights the user.
- **`duration` + `easing`**: a discrete time-based tween to each target using a custom easing function — the default is an expo-style ease-out. Use one model or the other, not both.

Key API — Lenis **1.3.23** (current as of June 2026):

| Member | What it does |
|---|---|
| `new Lenis(options)` | Constructor. Options: `lerp`, `duration`, `easing`, `smoothWheel` (default `true`), `syncTouch` (default `false`), `wheelMultiplier`, `touchMultiplier`, `anchors` (default `false`), `autoRaf` (default `false`), `prevent` (node predicate) |
| `lenis.raf(ms)` | Advance one frame. Call from your own RAF loop or from `gsap.ticker`. |
| `lenis.on('scroll', cb)` | Subscribe to scroll events — this feeds `ScrollTrigger.update`. |
| `lenis.scrollTo(target, opts)` | Eased programmatic scroll to a number, selector, or HTMLElement. |
| `lenis.stop()` / `lenis.start()` | Freeze/resume (use when a modal or drawer captures focus). |
| `lenis.destroy()` | Remove all listeners; call in cleanup/unmount. |
| `data-lenis-prevent` | HTML attribute on a nested scroll container: Lenis ignores it. Add `overscroll-behavior: contain` on that element too. |

**One RAF loop rule:** when using GSAP, set `autoRaf: false`, add `lenis.raf(time * 1000)` to `gsap.ticker`, call `lenis.on('scroll', ScrollTrigger.update)`, and set `gsap.ticker.lagSmoothing(0)`. Two competing loops cause 1–2 frame desync between the eased scroll and the scrubbed animation.

**Native CSS baseline:** `scroll-behavior: smooth` eases only programmatic jumps (anchor clicks, `element.scrollIntoView()`) — it has zero effect on ordinary wheel or touch scrolling. It is the no-cost, no-JS floor. Lenis is the enhancement you add on top, stripped entirely for reduced-motion users.

**Browser-support note:** `scroll-behavior: smooth` is supported in all current evergreen browsers. Lenis itself is pure JS and works wherever ES modules do. Known limitations: capped at 60 fps on Safari (30 fps in low-power mode); `position: fixed` elements can lag on pre-M1 macOS Safari; does not work across iframes; `scroll-margin` / `scroll-padding` are not respected by `lenis.scrollTo` (GitHub issue #196, open as of 2026-06).

## Working code

### Iframe-safe smooth-scroll lab - native versus eased feel

This preview is intentionally local-only: no Lenis CDN, no GSAP CDN, no remote assets. It demonstrates the *felt difference* Lenis is usually added for - a raw target scroll versus a lerped visual position - inside a contained scroll lab that works in a sandboxed iframe. Use the production Lenis snippets below when building the real page.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Smooth scroll feel lab</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 18px;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      background:
        radial-gradient(circle at 18% 12%, #d6f7ff 0 12%, transparent 30%),
        radial-gradient(circle at 78% 0%, #ffdbc4 0 13%, transparent 31%),
        linear-gradient(135deg, #f7f4eb, #e7f0f6 52%, #f9efe3);
      color: #101418;
    }

    .lab {
      width: min(760px, 100%);
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(210px, 0.95fr);
      min-height: 314px;
      border: 1px solid #1e2a3326;
      background: #ffffffd9;
      box-shadow: 0 24px 70px #36424d22;
      overflow: hidden;
    }

    .scroller {
      position: relative;
      height: 314px;
      overflow: auto;
      overscroll-behavior: contain;
      background: #101418;
      color: white;
    }

    .track {
      height: 1180px;
      padding: 24px;
      background:
        linear-gradient(#ffffff12 1px, transparent 1px) 0 0 / 100% 110px,
        linear-gradient(160deg, #101418, #20394a 36%, #683f54 70%, #e6a44b);
    }

    .scene {
      position: sticky;
      top: 22px;
      min-height: 270px;
      display: grid;
      align-content: center;
      gap: 18px;
    }

    h1 {
      max-width: 11ch;
      margin: 0;
      font-size: clamp(2.1rem, 8vw, 4.7rem);
      line-height: 0.92;
      letter-spacing: 0;
    }

    .ghost {
      position: absolute;
      inset: auto 22px 28px auto;
      width: 88px;
      aspect-ratio: 1;
      border-radius: 22px;
      background: #f8f3de;
      box-shadow: 0 0 0 1px #ffffff66 inset, 0 22px 44px #00000040;
      transform: translateY(var(--eased-y, 0px)) rotate(var(--tilt, 0deg));
    }

    .ghost::before {
      content: "";
      position: absolute;
      inset: 13px;
      border-radius: 14px;
      background:
        radial-gradient(circle at 32% 36%, #101418 0 5px, transparent 6px),
        radial-gradient(circle at 68% 36%, #101418 0 5px, transparent 6px),
        linear-gradient(#f4b2a2, #f4b2a2) 50% 68% / 36px 7px no-repeat;
    }

    .panel {
      padding: 16px;
      display: grid;
      align-content: center;
      gap: 12px;
      background: #fffdf8;
    }

    .stat { display: grid; gap: 7px; }
    .stat span {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 0.78rem;
      color: #44515c;
    }

    .meter {
      height: 13px;
      border: 1px solid #10141826;
      background: #ebe7dc;
      overflow: hidden;
    }

    .meter > i {
      display: block;
      width: calc(var(--value, 0) * 1%);
      height: 100%;
      background: linear-gradient(90deg, #1e8577, #e09b45);
    }

    .hint {
      margin: 0;
      color: #44515c;
      line-height: 1.55;
      font-size: 0.86rem;
    }

    button {
      justify-self: start;
      border: 0;
      background: #101418;
      color: white;
      padding: 0.68rem 0.9rem;
      font: inherit;
      cursor: pointer;
    }

    button:focus-visible {
      outline: 3px solid #1e8577;
      outline-offset: 3px;
    }

    @media (max-width: 640px) {
      body { place-items: stretch; }
      .lab { grid-template-columns: 1fr; }
      .scroller { height: 270px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .ghost { transition: none; }
    }
  </style>
</head>
<body>
  <main class="lab">
    <section class="scroller" aria-label="Scrollable demo panel" tabindex="0">
      <div class="track">
        <div class="scene">
          <h1>Scroll with weight.</h1>
          <div class="ghost" aria-hidden="true"></div>
        </div>
      </div>
    </section>

    <aside class="panel">
      <div class="stat">
        <span><b>Native target</b><output id="raw">0%</output></span>
        <div class="meter"><i id="rawBar"></i></div>
      </div>
      <div class="stat">
        <span><b>Eased visual</b><output id="eased">0%</output></span>
        <div class="meter"><i id="easedBar"></i></div>
      </div>
      <p class="hint">
        Wheel or drag the dark panel. Lenis uses the real document scroll as the
        target, then eases the rendered position toward it each frame. The page
        still needs reduced-motion and keyboard fallbacks.
      </p>
      <button type="button" id="jump">Jump to next beat</button>
    </aside>
  </main>

  <script>
    const scroller = document.querySelector('.scroller');
    const root = document.documentElement;
    const rawOut = document.querySelector('#raw');
    const easedOut = document.querySelector('#eased');
    const rawBar = document.querySelector('#rawBar');
    const easedBar = document.querySelector('#easedBar');
    const jump = document.querySelector('#jump');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let eased = 0;

    function progress() {
      const max = scroller.scrollHeight - scroller.clientHeight;
      return max > 0 ? scroller.scrollTop / max : 0;
    }

    function render() {
      const raw = progress();
      eased += (raw - eased) * (reduce ? 1 : 0.095);
      const rawPct = Math.round(raw * 100);
      const easedPct = Math.round(eased * 100);
      rawOut.value = rawPct + '%';
      easedOut.value = easedPct + '%';
      rawBar.style.setProperty('--value', rawPct);
      easedBar.style.setProperty('--value', easedPct);
      root.style.setProperty('--eased-y', `${eased * 116}px`);
      root.style.setProperty('--tilt', `${(raw - eased) * -30}deg`);
      requestAnimationFrame(render);
    }

    jump.addEventListener('click', () => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      const next = scroller.scrollTop + scroller.clientHeight * 0.75;
      scroller.scrollTo({
        top: next >= max ? 0 : next,
        behavior: reduce ? 'auto' : 'smooth'
      });
      scroller.focus({ preventScroll: true });
    });

    requestAnimationFrame(render);
  </script>
</body>
</html>
```

### Native baseline — smooth anchors only, no JS, reduced-motion-safe

This is the floor every page should have before reaching for Lenis. `scroll-behavior: smooth` eases in-page anchor navigation; the OS already suppresses it for reduced-motion users, but the explicit `auto` override catches older engines. Zero JS, zero cost.

```html
<!-- Source-only baseline; the iframe-safe live preview is above. -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Native smooth anchors</title>
  <style>
    /* Eases #anchor clicks and scrollIntoView() — NOT wheel or touch. */
    html { scroll-behavior: smooth; }

    /* Explicit override: most browsers already disable smooth scroll under
       reduced-motion, but older engines need the hint. */
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
    }

    body { margin: 0; font-family: system-ui, sans-serif; }
    nav {
      position: sticky; top: 0; padding: 1rem 2rem;
      background: #fff; border-bottom: 1px solid #e5e5e5;
      display: flex; gap: 1.5rem;
    }
    a { color: #111; text-decoration: none; }
    a:focus-visible { outline: 2px solid #0057ff; outline-offset: 3px; }
    section { min-height: 100vh; padding: 5rem 2rem; }

    /* Offset anchored targets so sticky nav doesn't cover them. */
    :target { scroll-margin-top: 5rem; }
  </style>
</head>
<body>
  <nav>
    <a href="#work">Work</a>
    <a href="#process">Process</a>
    <a href="#contact">Contact</a>
  </nav>
  <section id="top"><h1>Field Notes, 2026</h1></section>
  <section id="work"><h2>Selected work</h2></section>
  <section id="process"><h2>Process</h2></section>
  <section id="contact"><h2>Contact</h2></section>
</body>
</html>
```

### Lenis — vanilla, standalone, reduced-motion guard, nested-scroll exclusion

Full self-contained example. Lenis only initialises when the user has not requested reduced motion. A nested `.scroll-panel` is excluded via `data-lenis-prevent`. Touch scrolling is left native (`syncTouch: false`) — the OS provides its own momentum and overriding it on mobile tends to feel broken.

```html
<!-- Source-only production Lenis sample; keep external scripts out of the live iframe. -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lenis standalone</title>
  <!-- Lenis CSS sets html/body styles needed for the scroll container -->
  <link rel="stylesheet" href="https://unpkg.com/lenis@1.3.23/dist/lenis.css">
  <style>
    /* Native anchor fallback; Lenis will override wheel/touch only */
    html { scroll-behavior: smooth; }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
    }

    body {
      margin: 0;
      font-family: system-ui, sans-serif;
      background: #0e0e12;
      color: #f4f4f8;
    }
    nav {
      position: sticky; top: 0; z-index: 10;
      padding: 1rem 2rem;
      /* #16161d at ~80% opacity — background is #0e0e12 */
      background: #16161dcc;
      backdrop-filter: blur(10px);
      display: flex; gap: 1.5rem;
    }
    a { color: #f4f4f8; text-decoration: none; }
    a:focus-visible { outline: 2px solid #7eb3ff; outline-offset: 3px; }
    :target { scroll-margin-top: 5rem; }

    section { min-height: 100vh; padding: clamp(2rem, 6vw, 5rem); }
    h1 { font-size: clamp(2rem, 6vw, 4rem); font-weight: 700; }

    /* Nested scrollable region Lenis must not intercept */
    .scroll-panel {
      max-height: 45vh;
      overflow: auto;
      /* Required companion: lets the panel scroll independently */
      overscroll-behavior: contain;
      background: #1c1c24;
      padding: 1.25rem;
      border-radius: 10px;
    }
    .tall-content { height: 200vh; }
  </style>
</head>
<body>
  <nav>
    <a href="#work">Work</a>
    <a href="#log">Log</a>
    <a href="#contact">Contact</a>
  </nav>

  <section id="top"><h1>Field Notes, 2026</h1></section>
  <section id="work"><h2>Selected work</h2></section>

  <section id="log">
    <h2>Changelog</h2>
    <!-- data-lenis-prevent: Lenis ignores wheel events inside this element -->
    <div class="scroll-panel" data-lenis-prevent>
      <p>This panel scrolls natively — data-lenis-prevent preserves that.</p>
      <div class="tall-content"></div>
    </div>
  </section>

  <section id="contact"><h2>Contact</h2></section>

  <script src="https://unpkg.com/lenis@1.3.23/dist/lenis.min.js"></script>
  <script>
    const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)');
    let lenis = null;

    function enableLenis() {
      if (lenis) return;
      lenis = new Lenis({
        lerp: 0.09,           // slightly heavier than the 0.1 default for a deliberate feel
        wheelMultiplier: 1,
        smoothWheel: true,
        syncTouch: false,     // leave touch to the OS — native momentum is already good there
        anchors: { offset: -80 }, // ease anchor clicks; offset accounts for sticky nav
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    function disableLenis() {
      if (!lenis) return;
      lenis.destroy();
      lenis = null;
    }

    // Respect the current setting…
    if (!prefersReduced.matches) enableLenis();

    // …and respect any live toggle (e.g. user changes OS setting while the tab is open).
    prefersReduced.addEventListener('change', (e) => {
      e.matches ? disableLenis() : enableLenis();
    });
  </script>
</body>
</html>
```

### Lenis + GSAP ScrollTrigger — single RAF loop (production setup)

The defining use case: one clock drives both the eased scroll and scrubbed animations so they never drift apart. `autoRaf: false` hands control to `gsap.ticker`. The card starts at its final visible CSS state so reduced-motion users see it immediately without any JS running.

```html
<!-- Source-only production GSAP setup; keep external scripts out of the live iframe. -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lenis + GSAP ScrollTrigger</title>
  <link rel="stylesheet" href="https://unpkg.com/lenis@1.3.23/dist/lenis.css">
  <style>
    html { scroll-behavior: smooth; }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
    }

    body {
      margin: 0;
      font-family: system-ui, sans-serif;
      background: #0e0e12;
      color: #f4f4f8;
    }
    section {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 2rem;
    }

    /* IMPORTANT: card rests at its final visible state in CSS.
       GSAP will override with 'from' values only when motion is allowed.
       Reduced-motion users never see a hidden or shifted card. */
    .card {
      width: min(38ch, 80vw);
      padding: 2rem 2.5rem;
      background: #1c1c24;
      border-radius: 14px;
      opacity: 1;
      transform: none;
    }
    .card h2 { margin: 0 0 0.5rem; font-size: 1.5rem; font-weight: 600; }
    .card p  { margin: 0; color: #b0b0c0; line-height: 1.6; }
  </style>
</head>
<body>
  <section>
    <h1 style="font-size: clamp(2rem,5vw,3.5rem); font-weight:700;">
      Scroll down
    </h1>
  </section>

  <section>
    <div class="card" id="card">
      <h2>Scrubbed in, eased.</h2>
      <p>
        This card animates against Lenis's eased scroll position,
        not the raw jump — so it settles naturally with the page.
      </p>
    </div>
  </section>

  <section>
    <p style="color:#b0b0c0;">Done.</p>
  </section>

  <script src="https://unpkg.com/lenis@1.3.23/dist/lenis.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  <script>
    gsap.registerPlugin(ScrollTrigger);

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduce) {
      // Step 1: Create Lenis with autoRaf OFF — GSAP ticker will be the only RAF loop.
      const lenis = new Lenis({
        autoRaf: false,
        lerp: 0.1,
      });

      // Step 2: On each Lenis scroll event, tell ScrollTrigger to recalculate
      // trigger positions against the new (eased) scroll value.
      lenis.on('scroll', ScrollTrigger.update);

      // Step 3: Drive Lenis from GSAP's ticker.
      // gsap.ticker passes time in seconds; lenis.raf expects milliseconds.
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });

      // Step 4: Prevent GSAP from "catching up" after a stall (e.g. tab switch).
      // Without this, GSAP's lag-compensation fires a burst of frames that
      // decouples the eased scroll position from the scrub progress.
      gsap.ticker.lagSmoothing(0);

      // Step 5: A scrubbed animation that now tracks the EASED scroll position.
      // The card starts from opacity 0 / y 70 (not shown to reduced-motion users),
      // and the CSS resting state (opacity:1, transform:none) is the safe fallback.
      gsap.from('#card', {
        opacity: 0,
        y: 70,
        ease: 'expo.out',   // expo-out, not GSAP's default 'power1.out'
        scrollTrigger: {
          trigger: '#card',
          start: 'top 85%',
          end: 'top 42%',
          scrub: 0.6,       // eased catch-up; '0.6' is the catch-up duration in seconds
        },
      });
    }

    // reduce === true: Lenis never runs, GSAP never runs.
    // The card is already at opacity:1/transform:none from CSS — nothing is missing.
  </script>
</body>
</html>
```

### React / Next.js — `ReactLenis` + `useLenis`, GSAP-synced, reduced-motion aware

The React wrapper lives in the same `lenis` package under `lenis/react`. The old `@studio-freight/react-lenis` and `@studio-freight/lenis` packages are deprecated — install only `lenis`.

```jsx
// SmoothScroll.jsx — drop this around your layout root in Next.js App Router.
// Install: npm install lenis gsap
// Usage: wrap <SmoothScroll> around children in layout.tsx

'use client';
import { ReactLenis, useLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';
import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register at module scope — prevents double-registration in React Strict Mode.
gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll({ children }) {
  const lenisRef = useRef(null);

  // Track the OS reduced-motion setting reactively so a live toggle is respected.
  const [reduce, setReduce] = useState(() => {
    if (typeof window === 'undefined') return false;
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduce(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Connect Lenis to GSAP's ticker when Lenis is active.
  useEffect(() => {
    if (reduce) return;

    function update(time) {
      // time from gsap.ticker is in seconds; lenis.raf expects ms.
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    // Recalculate all ScrollTrigger start/end positions after mount.
    ScrollTrigger.refresh();

    return () => gsap.ticker.remove(update);
  }, [reduce]);

  // Reduced-motion: unmount Lenis entirely — lenis.destroy() fires via ReactLenis cleanup.
  if (reduce) return <>{children}</>;

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,    // GSAP ticker drives raf(); don't run a second loop
        lerp: 0.1,
        syncTouch: false,  // leave touch to the OS
      }}
    >
      {children}
    </ReactLenis>
  );
}

// -----------------------------------------------------------------------
// Use useLenis anywhere inside <SmoothScroll> to scroll programmatically.
// -----------------------------------------------------------------------

export function BackToTop() {
  const lenis = useLenis();
  return (
    <button
      onClick={() => lenis?.scrollTo(0, { duration: 1.2 })}
      style={{ position: 'fixed', bottom: '2rem', right: '2rem' }}
    >
      Back to top
    </button>
  );
}

// -----------------------------------------------------------------------
// useLenis scroll callback — e.g. for a reading-progress indicator.
// -----------------------------------------------------------------------

export function useReadingProgress(setter) {
  useLenis(({ scroll, limit }) => {
    setter(Math.round((scroll / limit) * 100));
  }, [setter]);
}
```

## Variations

- **Feel model — `lerp` vs `duration`/`easing`.** `lerp` gives a continuous, never-fully-arriving glide; `duration` + `easing` gives a discrete tween with a defined finish. Set one, not both. For most editorial use, `lerp: 0.08–0.12` reads premium without fighting the user.
- **Touch — `syncTouch` on/off.** Off (default, recommended): touch scrolling stays native and accessible. On: Lenis controls touch momentum too — use only for a specific touch-synced effect and test on real hardware before shipping.
- **Horizontal — `orientation: 'horizontal'`.** Same engine for horizontal galleries or case-study strips; pair with a vertical-to-horizontal scroll transform in ScrollTrigger.
- **Scoped instance — `wrapper` + `content` element.** Instead of the whole window, Lenis can smooth a single panel while the rest of the page stays native. Pass the container as `wrapper` and its scrollable child as `content`.
- **Scrub smoothing in GSAP — `scrub: true` vs `scrub: 0.6`.** The number is a catch-up duration in seconds. `true` (or `1`) is 1:1 tight coupling; `0.6` adds a secondary ease on top of Lenis's own lerp for a layered, less mechanical feel.

## Accessibility

**prefers-reduced-motion (mandatory — shown in all code above).** Smooth scroll is the motion itself, not a decorative layer. The correct response is to not run Lenis at all — not to lower the `lerp`. All snippets above check `matchMedia('(prefers-reduced-motion: reduce)')` before initialising, call `lenis.destroy()` if the setting changes live, and leave every element in its final visible CSS state so nothing is hidden or invisible when GSAP does not run.

**Touch and pointer fallback (mandatory).** Keep `syncTouch: false` (the default). Lenis's easing only applies to pointer wheel events; touch stays native. Overriding touch momentum on iOS / Android tends to feel broken or clip the overscroll bounce, and strands assistive-technology users who rely on touch.

**Anchors, keyboard, and focus.** Because Lenis moves the real `window.scrollY` (not a transformed wrapper), the scrollbar, browser Find in Page, `:target`, `position: sticky`, and Intersection Observers all work without workarounds. When using `anchors: true` or `lenis.scrollTo()`, also add `scroll-margin-top` on targets so a sticky header does not obscure them. After a programmatic `scrollTo`, move focus to the destination element (`el.focus()` with `tabindex="-1"`) so keyboard and screen-reader users land where sighted users do.

**Keyboard navigation.** Verify that Tab, Space / Shift+Space, PageUp / PageDown, Home / End, and arrow keys still page the document normally. Known issue (GitHub #107): during an active Lenis scroll animation, keyboard-initiated scrolls (spacebar, arrow keys) may be swallowed for that frame — test before shipping and file the version against your tested Lenis release. If this manifests, use `lenis.stop()` on `keydown` and `lenis.start()` on `keyup` as a workaround.

**Screen readers and no-JS.** Lenis is a pure enhancement; content must be fully present and scrollable without it. If JS is blocked or fails, the user gets standard native scroll — never gate any content's reachability on the smooth layer.

**Modal and drawer management.** Call `lenis.stop()` when a modal opens and captures focus, and `lenis.start()` when it closes. This prevents the background page from drifting while focus is trapped inside the overlay.

## Performance

- Lenis is ~3 kB gzip and does not translate the whole page, so it avoids the giant composite layer and paint storms of the old wrapper-transform approach.
- **Animate only `transform` and `opacity`.** Everything downstream of Lenis (GSAP scrubs, parallax layers) must stay in those two properties. Scrubbing `top`, `left`, `width`, or `height` triggers layout on every frame of an eased scroll — that is *more* frames than a native jump because the lerp keeps running after input stops.
- **One RAF loop.** With GSAP: `autoRaf: false`, Lenis inside `gsap.ticker`, `gsap.ticker.lagSmoothing(0)`. Two competing loops waste frames and desync by 1–2 frames — exactly the artifact you added Lenis to avoid.
- **`will-change: transform` sparingly.** Flag it only on actively animating elements; leaving it everywhere forces permanent GPU layers and hurts memory, especially on mobile.
- **`scrub: 0.6` over `scrub: true`.** A small catch-up buffer smooths the scrub and hides minor jank from the lerp's tail-off, at negligible extra cost.
- Call `ScrollTrigger.refresh()` after layout-changing events: font load, images loaded, route change in a SPA, or a drawer opening and pushing content.
- Test on a mid-range Android phone and on a 120 Hz display. Heavy `lerp` work combined with many ScrollTrigger instances can drop frames exactly where eased motion makes jank most visible.
- Safari on older hardware caps Lenis at 60 fps and drops to 30 fps in low-power mode — factor this into any demo or client review.

## Anti-slop

Cliche (see `_slop-blocklist.md` → MOTION bucket): Lenis applied globally, every section fades-and-rises at the same distance with identical timing and GSAP's default `power1.out` easing, the whole page drifting at a sluggish `lerp: 0.04` that fights the user — the "expensive template" tell that every AI-generated site currently ships. The fix: (1) only add Lenis when the page has scroll-linked choreography worth syncing to an eased position; (2) keep the lerp in `0.08–0.12`, not so heavy it creates perceived input lag; (3) vary *which* elements animate, *how far*, and with what stagger — not a uniform global fade-up; (4) use a real expo or spring easing like `cubic-bezier(0.16, 1, 0.3, 1)` on animations, never the default `ease`; (5) never combine Lenis with an autoplay carousel that has no controls — that is a compounded a11y and taste failure. The signal of restraint: two or three elements moving deliberately reads designed; fifteen things drifting uniformly reads generated.

## Pairs well with

- `sticky-pinning` — Lenis is the eased clock; ScrollTrigger pins sections and scrubs against that eased position.
- `text-reveal-on-scroll` — mask-up and scrub-fill reveals feel more deliberate tracking a lerped scroll than a raw jump.
- `parallax` — depth layers that track an eased position rather than an instant snap read as genuinely physical.
- `scroll-progress-indicator` — orient the reader during long eased or pinned sequences driven by the same RAF source.
- `staggered-entrance` — share one easing language (`expo.out`, `cubic-bezier(0.16,1,0.3,1)`) across entrance animations and scroll choreography.

## Current references

- [Lenis GitHub — darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) — source, full README, current version (1.3.23), all constructor options, GSAP integration snippet, and known limitations.
- [Lenis React README](https://github.com/darkroomengineering/lenis/blob/main/packages/react/README.md) — `ReactLenis`, `useLenis`, `lenis/react` import path, `autoRaf: false` + GSAP ticker pattern.
- [Lenis npm](https://www.npmjs.com/package/lenis) — install, confirms `@studio-freight/*` package deprecation.
- [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) — `scrub`, `start`/`end`, `ScrollTrigger.update`, `ScrollTrigger.refresh`, `lagSmoothing`.
- [MDN — scroll-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior) — the native baseline; eases programmatic and anchor scroll only, not wheel or touch.
- [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — the media query, how to read it in JS with `matchMedia`, and listening for live changes.
- [Smooth Scrolling in Next.js with Lenis & GSAP — DevDreaming (2026)](https://devdreaming.com/blogs/nextjs-smooth-scrolling-with-lenis-gsap) — current Next.js App Router + GSAP ticker walkthrough with React 19 patterns.
- [GSAP ScrollSmoother vs Lenis — Zun Creative](https://zuncreative.com/en/blog/smooth_scroll_meditation/) — honest side-by-side of structural constraints, flexibility, and when to choose each.
- [GitHub issue #107 — native keyboard scroll blocked during animation](https://github.com/darkroomengineering/lenis/issues/107) — documents the keyboard-scroll swallowing behavior; worth reading before shipping.
