# Scroll-triggered animation

> An element animates itself into view once when it crosses into the viewport, then stays put — a fire-once reveal, not a scrubbed effect that reverses as you scroll back.

**Bucket:** scroll/motion
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, apps, dashboards, marketing/landing pages

## What it is
As the user scrolls and an element first enters (or nears) the viewport, it transitions from a hidden/offset state to its resting state — typically a fade plus a short rise, a mask reveal, or a scale-settle. The animation plays **once** on entry and does not reverse when the element scrolls back out. The mental model: "trigger on a threshold," like a tripwire, as opposed to scroll-*linked* / scrubbing animation where progress is tied frame-by-frame to scroll position and reverses (see `text-reveal-on-scroll` scrub variant — that one fills word-by-word and un-fills as you scroll up; this one does not).

What the user perceives: content feels like it "arrives" with intent as they read down the page, giving rhythm and a sense of freshness to each section without demanding attention or hijacking the scroll.

## When to use
- Section intros, cards, images, and stat blocks that should feel like they land as the reader reaches them.
- Marketing and portfolio pages where you want a sense of pace and polish down a long scroll.
- App and dashboard surfaces where a one-time entrance softens content popping in (lists, panels, empty-state illustrations).
- Anywhere you want motion but cannot afford the cost/complexity of a scrubbed, pinned, frame-tied effect.

## When NOT to use
- **Everywhere at once.** The #1 overuse: *every* element on the page fades-and-slides-up with the same duration and the same default easing. That reads as a template, not a design — it is the canonical motion slop tell. Pick the elements that matter.
- Above-the-fold hero content that must be instantly readable for perceived speed and SEO — animate it in fast on load, or render it visible and only animate below-fold siblings.
- Content the user needs *now* (errors, confirmations, critical data). Never gate meaning behind an entrance.
- Re-triggering on every entry for long pages — repeated re-animation as the user scrolls up and down is nauseating and distracting. Fire once.
- When `prefers-reduced-motion: reduce` is set — show the final state immediately, no transform/stagger.

## How it works
Plain language: you detect "this element has reached the viewport" and then run a CSS transition or keyframe animation that you do not undo. There are three production-grade ways to detect entry, best-first by dependency cost:

1. **Native CSS — `animation-timeline: view()`** ties a keyframe animation to an element's progress through its scroll container. With `animation-range` you choose *which slice* of that progress drives the keyframes (e.g. `entry 0% cover 30%`), and `animation-fill-mode: forwards` (via `forwards` in shorthand) holds the end state so it reads as fire-once. No JS. Caveat: a view-timeline animation technically *is* progress-coupled, so it will visually reverse if the user scrolls back through the trigger range. To get true fire-once "play and lock," IntersectionObserver is the cleaner native primitive (option 2).
2. **Native JS — `IntersectionObserver`** calls back when a target crosses a threshold; on `isIntersecting` you add a class that triggers a CSS transition, then `unobserve()` the element so it never re-animates. This is the most robust, lowest-dependency true fire-once. Works in every modern browser.
3. **GSAP ScrollTrigger** with `once: true` — kills the trigger after it fires once and sets `toggleActions` to `play none none none`. Best when you already use GSAP or need precise `start`/`end` offsets and orchestration.
4. **Motion (formerly Framer Motion), React** — `whileInView` with `viewport={{ once: true }}` animates on first entry and never reverses. Renamed from `framer-motion` to `motion` in 2025; import from `motion/react`.

Key properties/APIs: `animation-timeline: view()`, `animation-range` (named ranges `entry`/`exit`/`cover`/`contain` + percentages), `animation-fill-mode: forwards`; `IntersectionObserver` (`threshold`, `rootMargin`, `unobserve`); ScrollTrigger `start`/`end`/`once`/`toggleActions`; Motion `whileInView`/`viewport={{ once, margin, amount }}`.

## Working code

### 1. Native CSS — `view()` timeline, no JS
Honest support (mid-2026): `animation-timeline: view()` and `animation-range` ship in Chromium (Chrome/Edge 115+) and Safari 26+, giving roughly 83% global coverage per caniuse. Firefox (versions up to 154) still has the feature disabled by default behind the `layout.css.scroll-driven-animations.enabled` flag. Treat it as **progressive enhancement** — the `@supports` guard shown below renders the final visible state for unsupporting browsers, which is the correct graceful fallback. Note: always provide a non-zero `animation-duration` value (even `1ms`) as some engines reject zero-duration scroll-driven animations.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Scroll-triggered reveal — native view()</title>
<style>
  :root { --ink:#f3efe7; --bg:#16140f; --accent:#d8643c; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
         font-family: "Geist", system-ui, sans-serif; }
  .spacer { height: 85vh; }
  .stack { max-width: 56ch; margin-inline:auto; padding-inline:1.25rem;
           display:grid; gap:4.5rem; }

  .card {
    border-left: 2px solid var(--accent);
    padding: 1.5rem 1.75rem;
    background: #1e1b14;
  }
  .card h2 { margin:.2rem 0 .6rem; font-size: clamp(1.4rem, 3vw, 2rem); }
  .card p  { margin:0; color:#cfc8ba; line-height:1.55; }

  /* Final, fully-visible baseline: this is what non-supporting browsers
     AND reduced-motion users see. Content never depends on the animation. */
  .reveal { opacity: 1; transform: none; }

  /* Only opt into the hidden start-state where view timelines are supported. */
  @supports (animation-timeline: view()) {
    @media (prefers-reduced-motion: no-preference) {
      .reveal {
        opacity: 0;
        transform: translateY(28px);
        animation: rise-in 1ms linear forwards; /* 1ms = Firefox needs non-zero */
        animation-timeline: view();
        /* start as the element enters, finish 30% into coverage */
        animation-range: entry 0% cover 30%;
      }
      /* Vary the second card so the page does not feel uniform. */
      .reveal--late { animation-range: entry 15% cover 45%; }
    }
  }

  @keyframes rise-in {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style></head>
<body>
  <div class="spacer"></div>
  <main class="stack">
    <article class="card reveal">
      <h2>Fire once, hold</h2>
      <p>This block lifts in as it reaches the viewport and stays put. The keyframe
         end-state is held by <code>forwards</code>.</p>
    </article>
    <article class="card reveal reveal--late">
      <h2>Different cadence</h2>
      <p>A later range so adjacent sections do not reveal in identical lockstep.</p>
    </article>
    <article class="card reveal">
      <h2>Graceful without support</h2>
      <p>Browsers without <code>view()</code> simply show this fully — the content
         is never hidden behind the effect.</p>
    </article>
  </main>
  <div class="spacer"></div>
</body></html>
```

### 2. Native JS — IntersectionObserver, true fire-once
This is the workhorse for production where you want guaranteed play-once-and-lock across every browser, no library. The class adds the transition; `unobserve` guarantees it never re-fires.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Scroll-triggered reveal — IntersectionObserver</title>
<style>
  body { margin:0; background:#101216; color:#eef1f5;
         font-family: "General Sans", system-ui, sans-serif; }
  .spacer { height: 80vh; }
  .grid { max-width: 64rem; margin-inline:auto; padding:0 1.25rem;
          display:grid; gap:2rem; grid-template-columns: repeat(auto-fit,minmax(15rem,1fr)); }

  /* Baseline = final visible state. No JS / reduced-motion = readable. */
  .reveal { opacity:1; transform:none; }

  @media (prefers-reduced-motion: no-preference) {
    .reveal {
      opacity: 0;
      transform: translateY(24px);
      /* expo-out easing reads more premium than default ease */
      transition: opacity .7s cubic-bezier(0.16,1,0.3,1),
                  transform .7s cubic-bezier(0.16,1,0.3,1);
      will-change: transform, opacity; /* dropped after reveal, see JS */
    }
    .reveal.is-in { opacity:1; transform:none; }
    /* meaningful stagger via per-item delay, not a uniform blanket */
    .reveal:nth-child(2) { transition-delay: .08s; }
    .reveal:nth-child(3) { transition-delay: .16s; }
  }

  .tile { background:#191c22; border:1px solid #262b33; border-radius:.75rem;
          padding:1.5rem; }
  .tile h3 { margin:.2rem 0 .5rem; }
  .tile p  { margin:0; color:#b7bdc7; line-height:1.5; }
</style></head>
<body>
  <div class="spacer"></div>
  <section class="grid">
    <div class="reveal tile"><h3>Indexed</h3><p>Search across everything in milliseconds.</p></div>
    <div class="reveal tile"><h3>Versioned</h3><p>Every change is an undoable checkpoint.</p></div>
    <div class="reveal tile"><h3>Shared</h3><p>Hand a link, not a folder of zip files.</p></div>
  </section>
  <div class="spacer"></div>

  <script>
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = document.querySelectorAll('.reveal');

    if (!reduce && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          // fire once: stop watching this element forever
          observer.unobserve(entry.target);
          // clean up the GPU-layer hint after the transition completes
          entry.target.addEventListener('transitionend', () => {
            entry.target.style.willChange = 'auto';
          }, { once: true });
        }
      }, {
        threshold: 0.2,            // 20% of the element visible
        rootMargin: '0px 0px -10% 0px' // trigger slightly before the bottom edge
      });
      targets.forEach(el => io.observe(el));
    }
    // If reduced-motion or no IO support: CSS baseline already shows them fully.
  </script>
</body></html>
```

### 3. GSAP ScrollTrigger — `once: true`
For projects already on GSAP, or when you need precise `start`/`end` strings and batched orchestration. Drop this file into a browser — the CDN scripts load GSAP and ScrollTrigger, the `.spacer` ensures the page is scrollable, and the three `.reveal` cards animate in as each enters the viewport.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Scroll-triggered reveal — GSAP ScrollTrigger</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; background:#0d0f14; color:#e8eaf0;
         font-family: "Geist", system-ui, sans-serif; }
  .spacer { height: 80vh; display:flex; align-items:center;
            justify-content:center; color:#4a5060; font-size:.875rem; }
  .stack { max-width: 52ch; margin-inline:auto; padding-inline:1.25rem;
           display:grid; gap:3rem; padding-block-end:6rem; }

  .card { background:#161920; border:1px solid #252b36;
          border-radius:.75rem; padding:1.75rem; }
  .card h2 { margin:.2rem 0 .6rem; font-size:clamp(1.3rem,3vw,1.8rem); }
  .card p  { margin:0; color:#9aa1b0; line-height:1.55; }

  /* Baseline = fully visible. GSAP sets from-state via JS only when
     reduced-motion is NOT set, so this is the no-JS / reduced fallback. */
  .reveal { opacity:1; }
</style></head>
<body>
  <div class="spacer">Scroll down</div>

  <main class="stack">
    <div class="card reveal">
      <h2>Precision start offset</h2>
      <p>ScrollTrigger's <code>start</code> string places the trigger exactly where
         you need it — "top 85%" means the card top hits 85% down the viewport.</p>
    </div>
    <div class="card reveal">
      <h2>Once and done</h2>
      <p><code>once: true</code> calls <code>kill()</code> after the first play.
         The trigger is removed; the card never re-animates on scroll-up.</p>
    </div>
    <div class="card reveal">
      <h2>Orchestrated stagger</h2>
      <p>A bounded per-index delay keeps adjacent reveals distinct without making
         the last card feel sluggish. Total stagger capped at ~0.16 s here.</p>
    </div>
  </main>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js"></script>
  <script>
    gsap.registerPlugin(ScrollTrigger);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      // Reduced-motion fallback: ensure final visible state, no transform/stagger.
      gsap.set('.reveal', { opacity: 1, y: 0, clearProps: 'transform' });
    } else {
      gsap.utils.toArray('.reveal').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 28,
          duration: 0.7,
          ease: 'expo.out',          // not the default ease — expo reads more premium
          delay: (i % 3) * 0.08,    // meaningful, bounded stagger
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',        // element top hits 85% down the viewport
            once: true               // play once, then kill() — never reverses
          }
        });
      });
    }
  </script>
</body></html>
```

### 4. Motion / Framer Motion (React) — `whileInView` + `once`
Renamed `framer-motion` -> `motion` in 2025; import from `motion/react`. `useReducedMotion()` swaps to a zero-motion variant so reduced-motion users get the final state instantly.

```jsx
import { motion, useReducedMotion } from "motion/react";

export function RevealGrid({ items }) {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08 } },
  };

  const tile = reduce
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 28 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }, // expo-out
        },
      };

  return (
    <motion.ul
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -10% 0px" }}
      style={{ display: "grid", gap: "2rem", listStyle: "none", padding: 0,
               gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))" }}
    >
      {items.map((item) => (
        <motion.li key={item.id} variants={tile}
          style={{ background: "#191c22", border: "1px solid #262b33",
                   borderRadius: ".75rem", padding: "1.5rem" }}>
          <h3>{item.title}</h3>
          <p style={{ color: "#b7bdc7" }}>{item.body}</p>
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

## Variations
- **Motion type** (the knob = which property): fade + rise (`opacity` + `translateY`), mask-up (clip-path / overflow + translate), scale-settle (`scale` 0.96 -> 1), blur-in (`filter: blur()` — heavier, see Performance), directional slide-in (translateX for side galleries).
- **Trigger threshold** (knob = `threshold` / `rootMargin` / `start`): fire the instant a sliver shows vs. wait until 20-50% visible; `rootMargin`/`start` offsets let you trigger before or after the literal edge.
- **Stagger** (knob = per-child delay): single element vs. a sequenced group; keep it bounded (cap total stagger ~0.3-0.5s) so late items do not lag.
- **Scope** (knob = which elements): one focal reveal per section vs. a full grid; restraint is the design choice.
- **Once vs. repeat**: this concept is fire-once. Allowing re-trigger on re-entry is the scroll-linked cousin's territory and usually a mistake here.

## Accessibility
- **prefers-reduced-motion (mandatory):** every snippet renders the final, fully-visible state when `reduce` is set — the CSS baseline class is the resting state, the JS/observer is skipped, the GSAP path calls `gsap.set` to the end values, and the Motion path swaps to a no-op variant. Reduced-motion users see content immediately with zero transform/stagger.
- **Pointer/touch:** this effect is scroll-driven, not cursor/hover-driven, so no `(hover: hover)` gate is required — it works identically on touch. (If you ever add a hover-only flourish on top, gate it with `@media (hover: hover) and (pointer: fine)` so touch users are not stranded.)
- **Content present without JS / motion:** the markup contains the real text at full opacity by default; the hidden start-state is only *added* under `@supports` + `no-preference` (native) or by the observer (JS). If scripting fails or the feature is unsupported, everything is readable. Never animate from `display:none` or `visibility:hidden` for meaningful content.
- **Screen readers:** entrance animations on whole blocks do not fragment the accessible name (unlike per-character text splitting), so SR users are unaffected. Do not set `aria-hidden` on revealing content.
- **Contrast / focus:** the resting state must meet WCAG. In the examples, body text `#cfc8ba` on `#1e1b14` = 10.33:1 and `#b7bdc7` on `#191c22` = 9.03:1 — both clear AA (4.5:1) and AAA (7:1) for normal text. Transient mid-reveal opacity is decorative and fine, but never leave the *resting* state low-contrast. Keyboard focus and tab order are untouched by these reveals.

## Performance
- **Animate only `transform` and `opacity`** — both are GPU-composited and skip layout/paint. The examples never animate `top`/`height`/`margin`, which would cause layout thrash.
- **`blur-in` is the exception:** `filter: blur()` is paint-bound and can stutter on low-end GPUs; use small radii and short durations, or skip it on large surfaces.
- **`will-change` sparingly:** the IO example sets `will-change: transform, opacity` only on revealable items and drops it to `auto` on `transitionend`, so you do not leave hundreds of permanent GPU layers around.
- **Fire-once is cheap:** `unobserve()` / `once: true` / `viewport.once` stop the work after the single reveal — no ongoing scroll listeners, no re-layout on scroll-up.
- **IntersectionObserver beats scroll listeners:** it is off-main-thread-friendly and batched; never hand-roll `scroll` + `getBoundingClientRect` for this.
- **Bundle cost:** native CSS / IO = 0 KB. GSAP core + ScrollTrigger ≈ 70 KB min (≈ 30 KB gzipped). Motion ≈ 30-50 KB gzipped depending on imports. Prefer native for simple reveals; reach for a library only when you need orchestration you already depend on.

## Anti-slop
Cliché (see `_slop-blocklist.md` -> MOTION): *everything* fades-and-slides-up with the same duration and the same default `ease`, every section, top to bottom — the single most recognizable AI/template motion tell. It makes a page feel auto-generated even when the layout is good.

Tasteful alternative: (1) **vary which elements move** — reveal one focal block per section, let supporting copy simply appear; (2) **meaningful stagger** — sequence a related group with a bounded delay (<=0.5s total), not a blanket delay on unrelated items; (3) **custom easing** — `cubic-bezier(0.16,1,0.3,1)` (expo-out) or a spring, never default `ease`; (4) **vary the motion itself** — a mask-up here, a scale-settle there, different `animation-range`/`start` cadences so adjacent sections do not pop in lockstep. Avoid autoplay carousels with no controls — an a11y and taste failure in the same MOTION bucket.

## Pairs well with
- `staggered-entrance` — the same easing/stagger language reused so the whole page speaks one motion dialect.
- `text-reveal-on-scroll` — pair a fire-once block reveal (this) with a one-time line mask on the heading inside it.
- `sticky-pinning` — trigger reveals inside or after a pinned section as the reader is released.
- `editorial-typographic` / `bento` layout styles — strong type and varied tiles are what make selective reveals read as intentional rather than uniform.
- `scroll-progress-indicator` — orients the reader on long pages where reveals pace the descent.

## Current references
- [MDN — animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline) — `view()`/`scroll()` timelines and the live browser-support table.
- [MDN — animation-range](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-range) — named ranges (`entry`/`exit`/`cover`/`contain`) and percentage syntax used above.
- [MDN — Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) — thresholds, `rootMargin`, and `unobserve` for true fire-once.
- [web.dev / Chrome — Scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations) — native CSS approach, Firefox `1ms` note, progressive-enhancement guidance.
- [GSAP — ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) — `once`, `toggleActions`, `start`/`end` syntax (current v3).
- [Motion (React) — useInView / whileInView](https://motion.dev/docs/react-scroll-animations) — `whileInView` + `viewport={{ once: true }}`; note the 2025 `framer-motion` -> `motion/react` rename.
- [CSS-Tricks — Unleash the power of scroll-driven animations (2024)](https://css-tricks.com/unleash-the-power-of-scroll-driven-animations/) — covers `view()` vs IntersectionObserver territory, animation-range, and practical patterns; published October 2024.
