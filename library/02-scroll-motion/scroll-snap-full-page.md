# Scroll-snap & full-page sections

> CSS snaps the scroll position to the edge (or center) of each panel, so a flick or arrow-press lands cleanly on the next full-viewport section instead of stopping somewhere in between.

**Bucket:** scroll/motion
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, carousels, product/marketing one-pagers, image galleries

## What it is
You mark a scroll container as snappy (`scroll-snap-type`) and mark each child as a snap target (`scroll-snap-align`). The browser then biases the resting scroll position toward those targets: instead of a free-stopping scroll, the viewport "clicks" onto each panel. The user perceives discrete pages — flick, settle on a full-bleed section; flick again, settle on the next — while still using the native scrollbar, momentum, and gestures they already know. Crucially this is the browser's own snapping, not a JS library hijacking the wheel, so it stays interruptible and keyboard-friendly when you build it correctly.

## When to use
- Full-viewport "deck" layouts: a marketing one-pager where each section is a distinct slide.
- Horizontal galleries and carousels of cards or images where each item should rest in frame.
- Onboarding or storytelling flows with a small, fixed number of full-screen steps.
- Anywhere you want the tidiness of a slideshow but want to keep native scroll behaviour, accessibility, and zero JS for the core mechanic.

## When NOT to use
- Long-form reading or content-dense pages. Snapping fights the reader who wants to stop mid-section; it is the wrong tool for an article or docs page.
- Sections taller than the viewport. With `mandatory`, content that overflows a snapped panel becomes **unreachable** — the snap keeps yanking the viewport back to the panel edge before the user can scroll the overflow into view (MDN warns against this explicitly). Use `proximity`, or don't snap.
- The overused case: turning an entire normal website into a hijacked full-page deck so every wheel tick jumps a whole screen. This is the classic "scrolljacking" pattern — it strips scroll velocity control, breaks Find-in-page, confuses screen readers, and triggers motion sickness. If you reach for a `wheel`-event library to force one-section-per-gesture, stop: native `scroll-snap` gives 90% of the feel without seizing control.
- Dashboards and apps where users scan and compare — snapping interrupts free positioning.

## How it works
Two CSS properties do the core work, set on a scroll container and its children:

- **`scroll-snap-type: <axis> <strictness>`** on the container. Axis is `x`, `y`, or `both`; strictness is `mandatory` or `proximity`.
  - `mandatory` — the viewport *must* rest on a snap point. Consistent, slideshow-like, but dangerous with overflowing content.
  - `proximity` — it snaps only when the scroll ends *near* a point; otherwise it stays put. Safer, more forgiving, the right default for full-page sections that might grow.
- **`scroll-snap-align: start | center | end | none`** on each child — which edge of the child lines up with the container's snapport.
- **`scroll-snap-stop: normal | always`** on children. `always` forces the scroll to stop at that snap point even during a fast flick, so users cannot accidentally skip a panel (default `normal` lets fast scrolls pass over points). Baseline since July 2022.
- **`scroll-padding`** (container) and **`scroll-margin`** (child) offset the snap position — essential when a fixed header would otherwise cover the snapped content.

Optional enhancement, JS but unobtrusive: the **`scrollsnapchange`** / **`scrollsnapchanging`** events (the `SnapEvent` interface) fire when a new snap target is selected or pending, so you can sync a dot-nav or fire an in-view animation without a scroll-position polling loop. Chrome/Edge 129+ (August 2024); not yet Baseline (Firefox and Safari lagging as of mid-2026), so feature-detect and treat as progressive enhancement.

For *animated* transitions between snapped panels, pair native snap with CSS scroll-driven animations (`animation-timeline: view()`), or reach for GSAP ScrollTrigger only if you need pinned, scrubbed choreography — but keep the snap itself native so the scroll stays interruptible.

## Working code

### Native CSS — vertical full-page sections (no JS)
Honest support note: `scroll-snap-type`, `scroll-snap-align`, and `scroll-snap-stop` are Baseline / widely available across all evergreen browsers (`scroll-snap-stop` since July 2022). `100dvh` is Baseline Widely Available since June 2025 (~95 % global coverage as of 2026); a `vh` fallback is included below for the remaining tail. This snippet degrades gracefully to a normal scrolling page where snap is unsupported.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { --ink:#e8e6e3; --bg:#0d1117; --accent:#e0a458; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body { font-family: "General Sans", system-ui, sans-serif; color: var(--ink); background: var(--bg); }

  /* The scroll container = the page itself */
  .deck {
    height: 100vh;            /* vh fallback for browsers without dvh */
    height: 100dvh;           /* dynamic viewport height: collapses with iOS toolbar */
    overflow-y: scroll;
    scroll-snap-type: y proximity;   /* proximity, not mandatory: safe if a panel grows */
    scroll-behavior: smooth;          /* eased keyboard/anchor jumps */
    scroll-padding-top: 0;            /* raise this if you add a fixed header */
  }
  .panel {
    height: 100vh;            /* vh fallback */
    height: 100dvh;
    scroll-snap-align: start;
    scroll-snap-stop: always;         /* never skip a panel on a fast flick */
    display: grid; place-content: center;
    padding: clamp(1.5rem, 5vw, 4rem);
    text-align: left;
  }
  .panel h2 {
    font-size: clamp(2.5rem, 8vw, 6rem); font-weight: 650;
    line-height: 0.95; margin: 0 0 0.4em; letter-spacing: -0.02em;
  }
  .panel p {
    max-width: 38ch; font-size: clamp(1rem, 2.2vw, 1.4rem);
    opacity: 0.82; margin: 0;
    /* opacity:0.82 blends #e8e6e3 → effective ~#c1c0be on #0d1117: contrast ≈ 10.4:1 (AAA) */
  }
  .panel .num { color: var(--accent); font-family: ui-monospace, monospace; font-size: 0.9rem; letter-spacing: 0.15em; }

  /* alternate backgrounds so panels read as distinct, not identical cards */
  .panel:nth-child(odd)  { background: #0d1117; }
  .panel:nth-child(even) { background: #11161f; }

  /* Reduced motion: keep snapping (it is positional, not animated) but kill the smooth easing,
     which is the part that causes motion discomfort. Jumps become instant. */
  @media (prefers-reduced-motion: reduce) {
    .deck { scroll-behavior: auto; }
  }
</style></head>
<body>
  <main class="deck">
    <section class="panel" id="s1" tabindex="-1" aria-label="Intro">
      <span class="num">01 / 04</span>
      <h2>Coast lines</h2>
      <p>Four full-bleed frames. Flick, settle, read. Native scroll, no hijack.</p>
    </section>
    <section class="panel" id="s2" tabindex="-1" aria-label="Work">
      <span class="num">02 / 04</span>
      <h2>Tide work</h2>
      <p>Each panel snaps to its top edge. The scrollbar still moves the way you expect.</p>
    </section>
    <section class="panel" id="s3" tabindex="-1" aria-label="Process">
      <span class="num">03 / 04</span>
      <h2>Salt method</h2>
      <p>Use proximity so a panel that outgrows the viewport never traps the reader.</p>
    </section>
    <section class="panel" id="s4" tabindex="-1" aria-label="Contact">
      <span class="num">04 / 04</span>
      <h2>Make contact</h2>
      <p>End the deck on a clear action, not a dead snap point.</p>
    </section>
  </main>
</body></html>
```

Contrast check for this file's palette (all ratios measured against the hex pairs used above):
- Body text `#e8e6e3` on dark panel `#0d1117`: **15.19:1** (WCAG AAA).
- Body text `#e8e6e3` on even panel `#11161f`: **14.55:1** (WCAG AAA).
- Paragraph text at `opacity: 0.82` composites to effective `#c1c0be` on `#0d1117`: **10.41:1** (WCAG AAA). On `#11161f`: **9.97:1** (WCAG AAA).
- Accent `#e0a458` on `#0d1117`: **8.67:1** (WCAG AAA).
- Accent `#e0a458` on `#11161f`: **8.31:1** (WCAG AAA).

### Native CSS — horizontal gallery (no JS)
```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; background: #0d1117; color: #e8e6e3; font-family: system-ui, sans-serif; }
  .rail {
    display: flex; gap: 1rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;     /* a finite carousel: mandatory is safe, items fit */
    scroll-padding-inline: 1rem;        /* don't snap flush to the edge */
    padding: 2rem 1rem;
    scroll-behavior: smooth;
  }
  .card {
    flex: 0 0 min(80vw, 28rem);
    height: 60vh;
    scroll-snap-align: center;
    scroll-snap-stop: always;
    border-radius: 14px;
    background: linear-gradient(160deg, #1b2430, #11161f);
    display: grid; place-content: end; padding: 1.5rem;
    border: 1px solid #232c38;
  }
  .card h3 { margin: 0; font-size: 1.6rem; }
  .card span { color: #e0a458; font-family: ui-monospace, monospace; font-size: 0.8rem; }
  @media (prefers-reduced-motion: reduce) { .rail { scroll-behavior: auto; } }
</style></head>
<body>
  <ul class="rail" tabindex="0" aria-label="Project gallery, scroll horizontally" role="group" style="list-style:none;margin:0;">
    <li class="card"><span>01</span><h3>Harbour</h3></li>
    <li class="card"><span>02</span><h3>Estuary</h3></li>
    <li class="card"><span>03</span><h3>Breakwater</h3></li>
    <li class="card"><span>04</span><h3>Foreshore</h3></li>
  </ul>
</body></html>
```

### Progressive enhancement — dot-nav synced via snap events (vanilla JS)
This is a complete standalone file. Copy snippet 1 as the base; this version adds a dot-nav overlay and progressive-enhancement JS. The deck works without JS — the nav syncs via the native `scrollsnapchange` event (Chrome/Edge 129+, August 2024; not yet Baseline) with a feature check, falling back to IntersectionObserver where unsupported.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { --ink:#e8e6e3; --bg:#0d1117; --accent:#e0a458; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body { font-family: "General Sans", system-ui, sans-serif; color: var(--ink); background: var(--bg); }

  .deck {
    height: 100vh;
    height: 100dvh;
    overflow-y: scroll;
    scroll-snap-type: y proximity;
    scroll-behavior: smooth;
    scroll-padding-top: 0;
  }
  .panel {
    height: 100vh;
    height: 100dvh;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    display: grid; place-content: center;
    padding: clamp(1.5rem, 5vw, 4rem);
    text-align: left;
  }
  .panel h2 {
    font-size: clamp(2.5rem, 8vw, 6rem); font-weight: 650;
    line-height: 0.95; margin: 0 0 0.4em; letter-spacing: -0.02em;
  }
  .panel p {
    max-width: 38ch; font-size: clamp(1rem, 2.2vw, 1.4rem);
    opacity: 0.82; margin: 0;
  }
  .panel .num { color: var(--accent); font-family: ui-monospace, monospace; font-size: 0.9rem; letter-spacing: 0.15em; }
  .panel:nth-child(odd)  { background: #0d1117; }
  .panel:nth-child(even) { background: #11161f; }

  @media (prefers-reduced-motion: reduce) {
    .deck { scroll-behavior: auto; }
  }

  /* Dot-nav — only shown on fine-pointer devices (desktop/laptop) */
  .dots {
    display: none; /* hidden by default; revealed for fine-pointer below */
    position: fixed; right: 1.25rem; top: 50%;
    translate: 0 -50%;
    flex-direction: column; gap: 0.5rem;
    z-index: 10;
  }
  /* Show dot-nav only when a precise pointer is available */
  @media (hover: hover) and (pointer: fine) {
    .dots { display: flex; }
  }
  .dots a {
    display: block; width: 8px; height: 8px;
    border-radius: 50%; background: #e8e6e3;
    opacity: 0.3; text-decoration: none;
  }
  .dots a[aria-current="true"] { opacity: 1; background: #e0a458; }
  .dots a:focus-visible { outline: 2px solid #e0a458; outline-offset: 3px; }
</style></head>
<body>
  <nav class="dots" aria-label="Section navigation"></nav>
  <main class="deck">
    <section class="panel" id="s1" tabindex="-1" aria-label="Intro">
      <span class="num">01 / 04</span>
      <h2>Coast lines</h2>
      <p>Four full-bleed frames. Flick, settle, read. Native scroll, no hijack.</p>
    </section>
    <section class="panel" id="s2" tabindex="-1" aria-label="Work">
      <span class="num">02 / 04</span>
      <h2>Tide work</h2>
      <p>Each panel snaps to its top edge. The scrollbar still moves the way you expect.</p>
    </section>
    <section class="panel" id="s3" tabindex="-1" aria-label="Process">
      <span class="num">03 / 04</span>
      <h2>Salt method</h2>
      <p>Use proximity so a panel that outgrows the viewport never traps the reader.</p>
    </section>
    <section class="panel" id="s4" tabindex="-1" aria-label="Contact">
      <span class="num">04 / 04</span>
      <h2>Make contact</h2>
      <p>End the deck on a clear action, not a dead snap point.</p>
    </section>
  </main>
  <script>
    const deck = document.querySelector('.deck');
    const panels = [...deck.querySelectorAll('.panel')];
    const nav = document.querySelector('.dots');

    // Build keyboard-operable dot links that jump to each panel.
    panels.forEach((p, i) => {
      const a = document.createElement('a');
      a.href = '#' + p.id;
      a.setAttribute('aria-label', 'Go to ' + (p.getAttribute('aria-label') || ('section ' + (i + 1))));
      nav.appendChild(a);
    });
    const dots = [...nav.children];
    const setActive = (idx) => dots.forEach((d, i) =>
      d.setAttribute('aria-current', i === idx ? 'true' : 'false'));
    setActive(0);

    // Preferred path: native snap event tells us the new target with zero polling.
    if ('onscrollsnapchange' in deck) {
      deck.addEventListener('scrollsnapchange', (e) => {
        const idx = panels.indexOf(e.snapTargetBlock);
        if (idx >= 0) setActive(idx);
      });
    } else {
      // Fallback: IntersectionObserver, equally jank-free, no scroll handler.
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setActive(panels.indexOf(en.target));
        });
      }, { threshold: 0.6 });
      panels.forEach((p) => io.observe(p));
    }
  </script>
</body></html>
```

### Library version — Lenis smooth scroll + GSAP (only when you need scrubbed choreography)
Use this only if you want eased momentum across the whole deck plus scroll-linked animation. This is a complete standalone file. Lenis `1.3.x` (npm `lenis`, formerly `@studio-freight/lenis`) provides the smoothing; GSAP ScrollTrigger drives panel animations. The native CSS `scroll-snap-type` still does the snapping — we do **not** hijack the wheel. When `prefers-reduced-motion` is set, Lenis and GSAP are skipped entirely; native snap with `scroll-behavior: auto` remains. Only `transform` and `opacity` are animated (GPU-composited, no layout thrash).

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { --ink:#e8e6e3; --bg:#0d1117; --accent:#e0a458; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body { font-family: "General Sans", system-ui, sans-serif; color: var(--ink); background: var(--bg); }

  .deck {
    height: 100vh;
    height: 100dvh;
    overflow-y: scroll;
    scroll-snap-type: y proximity;
    scroll-padding-top: 0;
    /* scroll-behavior: smooth is intentionally omitted here;
       Lenis handles easing when reduced-motion is off */
  }
  .panel {
    height: 100vh;
    height: 100dvh;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    display: grid; place-content: center;
    padding: clamp(1.5rem, 5vw, 4rem);
    text-align: left;
  }
  .panel h2 {
    font-size: clamp(2.5rem, 8vw, 6rem); font-weight: 650;
    line-height: 0.95; margin: 0 0 0.4em; letter-spacing: -0.02em;
  }
  .panel p {
    max-width: 38ch; font-size: clamp(1rem, 2.2vw, 1.4rem);
    opacity: 0.82; margin: 0;
  }
  .panel .num { color: var(--accent); font-family: ui-monospace, monospace; font-size: 0.9rem; letter-spacing: 0.15em; }
  .panel:nth-child(odd)  { background: #0d1117; }
  .panel:nth-child(even) { background: #11161f; }

  /* Reduced motion: instant jumps, no Lenis, no GSAP tweens */
  @media (prefers-reduced-motion: reduce) {
    .deck { scroll-behavior: auto; }
  }
</style></head>
<body>
  <main class="deck">
    <section class="panel" id="s1" tabindex="-1" aria-label="Intro">
      <span class="num">01 / 04</span>
      <h2>Coast lines</h2>
      <p>Four full-bleed frames. Flick, settle, read. Native scroll, no hijack.</p>
    </section>
    <section class="panel" id="s2" tabindex="-1" aria-label="Work">
      <span class="num">02 / 04</span>
      <h2>Tide work</h2>
      <p>Each panel snaps to its top edge. The scrollbar still moves the way you expect.</p>
    </section>
    <section class="panel" id="s3" tabindex="-1" aria-label="Process">
      <span class="num">03 / 04</span>
      <h2>Salt method</h2>
      <p>Use proximity so a panel that outgrows the viewport never traps the reader.</p>
    </section>
    <section class="panel" id="s4" tabindex="-1" aria-label="Contact">
      <span class="num">04 / 04</span>
      <h2>Make contact</h2>
      <p>End the deck on a clear action, not a dead snap point.</p>
    </section>
  </main>
  <script src="https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js"></script>
  <script>
    gsap.registerPlugin(ScrollTrigger);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduce) {
      // Smooth momentum WITHOUT seizing the wheel — native scroll-snap-type still resolves rests.
      const lenis = new Lenis({
        duration: 1.1,
        easing: (t) => 1 - Math.pow(1 - t, 5),  // expo-out feel, not default ease
        smoothWheel: true,
      });
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
      lenis.on('scroll', ScrollTrigger.update);

      // Animate each panel's content as it enters — vary which element moves per panel.
      // Only transform and opacity: GPU-composited, no layout recalculation.
      gsap.utils.toArray('.panel').forEach((panel) => {
        gsap.from(panel.querySelector('h2'), {
          y: 60, opacity: 0,
          duration: 0.9,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: panel,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        });
      });
    }
    // When reduce is true: no Lenis, no GSAP tweens. Native CSS snap (with scroll-behavior:auto
    // from the reduced-motion block) still works — content is fully visible, jumps are instant.
  </script>
</body></html>
```

## Variations
- **Strictness knob** — `mandatory` (rigid slideshow, items must fit the viewport) vs `proximity` (forgiving, snaps only when you stop near a point). Default to `proximity` for full-page sections.
- **Alignment knob** — `start` (full-page decks, panel top to viewport top), `center` (galleries/carousels, item centered), `end` (footers, last-item-flush rails).
- **Skip control** — `scroll-snap-stop: always` (every panel is a hard stop, nothing skipped) vs `normal` (fast flicks glide past intermediate points).
- **Axis** — `y` (vertical full-page), `x` (horizontal gallery), `both` (2D map/grid of panels).
- **Offset** — `scroll-padding` / `scroll-margin` to clear a fixed header or breathe off the edge.
- **Event hook** — pure CSS (no state) vs `scrollsnapchange`-synced UI (dot-nav, lazy-load, in-view animation) vs IntersectionObserver fallback.

## Accessibility
- **prefers-reduced-motion (mandatory):** snapping itself is positional, not animated, so it stays on — but `scroll-behavior: smooth` is what causes vestibular discomfort. Every snippet above flips it to `auto` under `@media (prefers-reduced-motion: reduce)`, making keyboard and anchor jumps instant. The Lenis + GSAP path is skipped entirely. Content is fully visible regardless of motion preference.
- **Keyboard:** native `scroll-snap` keeps arrow keys, Page Up/Down, Space, and Home/End working — this is the single biggest reason to prefer it over a wheel-hijacking library, which typically kills Space-to-scroll. Give each panel `tabindex="-1"` and a clear `id` so dot-nav anchor links can move focus to the landed section (browsers scroll `tabindex="-1"` targets into view on focus). Never trap focus inside a panel.
- **The mandatory trap:** never use `scroll-snap-type: ... mandatory` when a panel can overflow the viewport — on small screens, at high zoom levels, or after copy grows. A mandatory snap container will always snap to a panel edge, making content between snap points unreachable. Use `proximity` instead, or remove the snap rule for small breakpoints with a `@media (max-height: ...)` query.
- **Find-in-page and deep links:** because it is real scroll, browser Find still jumps to matches and `#id` anchors resolve correctly — both broken by JS scrolljacking. Do not reintroduce that breakage with a wheel handler.
- **Screen readers:** mark panels as `<section>` with `aria-label`; reading order is the DOM order, present and meaningful with zero JS. Do not gate any content or meaning on the snap animation — the page reads as an ordinary document when CSS/JS is off.
- **Dot-nav:** the progressive-enhancement dot-nav above uses `<a href="#id">` elements with descriptive `aria-label`s and `aria-current="true"` on the active link. It receives visible `:focus-visible` styling. No role trick needed — links navigating to page sections are the correct semantic. The dot-nav is hidden on touch/coarse-pointer devices via `@media (hover: hover) and (pointer: fine)` — on those devices the scrollbar and swipe gestures serve the same orientation purpose.
- **Contrast:** all ratios computed against this file's hex pairs — body text `#e8e6e3` on `#0d1117` is 15.19:1 (AAA), accent `#e0a458` on `#0d1117` is 8.67:1 (AAA). Do not suppress `:focus-visible` outlines on dot-nav links.

## Performance
- Snapping is handled by the browser's compositor — it costs essentially nothing and never thrashes layout. This is the cheapest "designed scroll" you can ship.
- Avoid `scroll` event listeners for syncing UI; use `scrollsnapchange` or IntersectionObserver (both fire off the main scroll path) as shown, so you do not stall the scroll thread.
- For entrance animations on panels, animate only `transform` and `opacity` (GPU-friendly composited properties); avoid animating `height`, `top`, `left`, or `background-position`, which force layout recalculation.
- `scroll-snap-stop: always` changes resolution logic only — no rendering cost.
- `100dvh` elements resize when the iOS address bar retracts; on snap layouts this can produce CLS. Mitigate by ensuring nothing depends on the panel's computed height for sibling layout, and measure with Lighthouse CLS if you animate on snap.
- Library cost: Lenis is a few KB gzipped; GSAP + ScrollTrigger add meaningfully more. Do not load them just to snap. Reserve the library path for genuine scrubbed choreography. Use `will-change: transform` only on a panel actively animating, and remove it after.

## Anti-slop
Cliche (see MOTION bucket in the slop blocklist): the autoplay/forced full-page hijack where every wheel tick jumps a whole screen with the same fade-and-slide-up at the same duration and default `ease`, no controls, no escape — the scrolljacked agency homepage. It fails taste and accessibility at once: no keyboard scroll, motion sickness risk, broken Find-in-page, content permanently inaccessible to users at high zoom.

The tasteful alternative: keep the snap **native and interruptible** (`proximity`, not a wheel handler); make each panel visually distinct rather than four identical full-screen cards (alternate backgrounds, vary which element animates per panel — heading on one, image on the next); use purposeful easing like `cubic-bezier(0.16, 1, 0.3, 1)` or `expo.out` instead of the default `ease`; and always give the user an out (working scrollbar, dot-nav, keyboard). Snapping should feel like the page tidying itself, not like it grabbing the wheel from your hand.

## Pairs well with
- `sticky-pinning` — pin a panel and scrub its internal content while the deck snaps between sections.
- `text-reveal-on-scroll` — fire a line/word reveal as each snapped panel lands (drive it from `scrollsnapchange`).
- `scroll-progress-indicator` / dot-nav — orient the reader across a finite deck; sync it via snap events.
- `staggered-entrance` — shared easing language (expo/spring) so panel content animates with one consistent voice.

## Current references
- [MDN — Basic concepts of scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_snap/Basic_concepts) — mandatory vs proximity, alignment, and the explicit "never use mandatory with overflowing content" warning.
- [MDN — scroll-snap-stop](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-stop) — `normal` vs `always`, fast-scroll skipping, Baseline since July 2022.
- [MDN — scroll-snap-type](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type) — axis + strictness syntax and formal definition.
- [Chrome for Developers — Scroll Snap Events](https://developer.chrome.com/blog/scroll-snap-events) — `scrollsnapchange` / `scrollsnapchanging`, the `SnapEvent` interface, Chrome 129 (August 2024).
- [MDN — Using scroll snap events](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_snap/Using_scroll_snap_events) — `snapTargetBlock` / `snapTargetInline`, progressive-enhancement guidance.
- [Chrome for Developers — Carousels with CSS](https://developer.chrome.com/blog/carousels-with-css) — `::scroll-button()` and `::scroll-marker()` pseudo-elements (Chrome 135+, March 2025; not yet Baseline); the next layer of pure-CSS carousel accessibility.
- [W3C WCAG 2.2 — Technique C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39) — using `prefers-reduced-motion` to satisfy SC 2.3.3 Animation from Interactions.
- [web.dev — Well-controlled scrolling with CSS Scroll Snap](https://web.dev/articles/css-scroll-snap) — foundational code patterns and mandatory/proximity guidance.
- [Don't Fuck With Scroll](https://dontfuckwithscroll.com/) — the case against wheel-hijacking, with the NN/g disorientation study; toggle the effect on/off to feel the difference directly.
- [Lenis — GitHub (darkroomengineering)](https://github.com/darkroomengineering/lenis) — current smooth-scroll library (`lenis` 1.3.x), config and reduced-motion notes.
- [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) — for the scrubbed/pinned choreography path only.
