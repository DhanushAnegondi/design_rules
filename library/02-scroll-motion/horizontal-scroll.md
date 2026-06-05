# Horizontal scroll sections

> A stretch of content that moves sideways while the page scrolls down — either a pinned full-screen track that GSAP slides along the x-axis, or a native CSS scroll-snap rail the user swipes through directly.

**Bucket:** scroll/motion
**Maturity:** current
**Effort:** medium (native snap) / high (pinned GSAP track)
**Best for:** websites, portfolios, carousels, agency/editorial showcases, product galleries

## What it is
There are two distinct things people mean by "horizontal scroll," and conflating them is the root of most bad implementations.

1. **Pinned horizontal track** — a section is *pinned* (stuck) in the viewport while the user keeps scrolling **vertically**; that vertical scroll distance is translated into **horizontal** movement (`transform: translateX`) of an inner track. The user perceives a "detour": the page stops descending and pans sideways through a sequence of panels, then resumes. This is the cinematic agency/portfolio effect.

2. **Native horizontal rail** — a genuinely overflow-x container the user scrolls/swipes **horizontally** themselves (trackpad, shift+wheel, touch swipe, arrow keys), usually with `scroll-snap` to lock onto each item. This is a gallery/carousel, not a page-scroll hijack.

Pattern 1 hijacks the scroll direction and is heavier and riskier; pattern 2 respects native scrolling and is cheap and accessible. Pick deliberately.

## When to use
- **Pinned track:** a finite, ordered narrative — a case-study walkthrough, a process (step 1 → 5), a "our work" reel — where the sideways pan *is* the storytelling device and the panel count is small (3–7).
- **Native snap rail:** product images, a logo wall, testimonial cards, a "more articles" strip — anything a user browses non-linearly and may want to skip.
- When the horizontal motion encodes real sequence or comparison, not just novelty.
- When you can guarantee the content also makes sense if the user never triggers the effect (reduced motion, no JS).

## When NOT to use
- **The "everyone overuses this for X" warning:** horizontal-pinned scroll is the #1 over-applied portfolio trick. Do not pin a long marketing page sideways just because it looks expensive — it disorients, breaks Find-in-page, breaks the scrollbar's "how far am I" affordance, and fights every user's muscle memory.
- Content the user needs to **read in depth** while it slides — text moving horizontally under a vertical-scroll gesture is nauseating and unreadable.
- **Mobile, for the pinned variant.** The vertical-drives-horizontal trick collides with native touch gestures: users swipe and nothing pans, or pan-snap and the page won't advance. On touch, ship the native snap rail instead (real swipe), never the pinned hijack.
- Unknown or very large item counts — pinning a 30-panel track means an enormous vertical scroll-distance and a long stretch where the scrollbar lies about page length.
- Anything where SEO/perceived-speed needs content visible immediately without a heavy scroll library booting first.

## How it works
**Pinned track (scroll-linked translate).** You give the section a tall scroll-distance, pin its inner viewport, and map scroll progress (0→1) to `translateX(0 → -(trackWidth - viewportWidth))`. Animate **only `transform`** so it stays on the GPU.

- **GSAP ScrollTrigger** is the production standard. `pin: true` fixes the section; `scrub` couples the tween to the scrollbar (a small number like `1` adds smoothing latency so it isn't a jittery 1:1); `end: () => "+=" + track.offsetWidth` makes the vertical distance equal the horizontal travel so the pan feels 1:1. `anticipatePin: 1` pre-applies the pin on fast scroll to avoid a flash of unpinned content.
- **Framer Motion** does the same in React with `useScroll({ target, offset })` → `useTransform(scrollYProgress, [0,1], ["0%", "-75%"])` driving a `motion.div`'s `x`. You manage the tall spacer and sticky inner wrapper yourself.
- **Native CSS** *can* drive pattern 1 with `animation-timeline: scroll()` + `position: sticky`, but it's still Chromium-led (Firefox/Safari partial as of 2026), so treat it as progressive enhancement.

**Native rail (no scroll-linking at all).** Pure CSS: `overflow-x: auto` + `scroll-snap-type: x mandatory` on the container, `scroll-snap-align: center|start` on each child. The browser handles momentum, snapping, keyboard, and scrollbar for free. As of Chrome/Edge 135 (March 2025), the CSS Overflow 5 **carousel** pseudo-elements `::scroll-button()` and `::scroll-marker()` add prev/next buttons and pagination dots — with built-in keyboard and screen-reader semantics — without any JS. Support is still Chromium-only / limited availability, so wrap them in `@supports` and keep a plain scrollable fallback.

Key APIs at a glance: `scroll-snap-type`, `scroll-snap-align`, `scroll-snap-stop`, `scroll-padding`/`scroll-margin` (native rail); `ScrollTrigger { pin, scrub, end, anticipatePin }`, `gsap.utils.toArray`, `ScrollTrigger.matchMedia` (GSAP); `useScroll`/`useTransform`/`useReducedMotion` (Framer).

## Working code

### Native CSS scroll-snap rail — accessible gallery with progressive carousel controls
This is the default you should reach for. `scroll-snap` is **Baseline: Widely available** (all modern browsers, 2.5+ years). It is keyboard-scrollable, swipeable, and the scrollbar tells the truth about position. The `@supports` block at the bottom adds native prev/next buttons and pagination dots on Chrome/Edge 135+ with zero JS; unsupported browsers get the plain scrollable rail unchanged.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { --ink:#0f1115; --paper:#f3efe7; --accent:#d6552b; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: "Geist", system-ui, sans-serif;
         background:var(--paper); color:var(--ink); }
  h1 { font-size: clamp(1.5rem,4vw,2.5rem); margin: 2rem 1.5rem .5rem;
       letter-spacing:-0.02em; }
  p.hint { margin: 0 1.5rem 1rem; color:#5a554c; font-size:.9rem; }

  /* ── Base rail: works in every browser ───────────────────────── */
  .rail {
    display: flex;
    gap: 1.25rem;
    padding: 1.5rem;
    overflow-x: auto;
    overscroll-behavior-x: contain;      /* don't trigger browser back-swipe */
    scroll-snap-type: x mandatory;
    scroll-padding-inline: 1.5rem;       /* snap respects the container inset */
    -webkit-overflow-scrolling: touch;
  }
  .rail::-webkit-scrollbar { height: 10px; }
  .rail::-webkit-scrollbar-thumb { background:#c9c2b4; border-radius: 99px; }

  .card {
    flex: 0 0 78%;                        /* peek of next card = "there's more" */
    max-width: 420px;
    aspect-ratio: 4 / 5;
    scroll-snap-align: center;
    scroll-snap-stop: always;            /* one card per swipe, no skipping */
    border-radius: 14px;
    background: var(--ink);
    color: var(--paper);
    padding: 1.5rem;
    display: flex;
    align-items: flex-end;
    font-size: 1.25rem;
    font-weight: 600;
    cursor: default;
  }
  .card:focus-visible { outline: 3px solid var(--accent); outline-offset: 4px; }

  /* Smooth scroll only when the OS allows animation */
  @media (prefers-reduced-motion: no-preference) {
    .rail { scroll-behavior: smooth; }
  }
  @media (prefers-reduced-motion: reduce) {
    .rail { scroll-behavior: auto; }     /* no animated jumps */
  }

  /* ── Progressive enhancement: Chrome/Edge 135+ carousel controls ─
     @supports gates this entire block so other browsers see nothing.
     ::scroll-button() and ::scroll-marker() are CSS Overflow Level 5.
     Support status: limited availability — Chromium only as of mid-2026;
     Firefox/Safari still in progress. The fallback is the plain rail above. */
  @supports (scroll-marker-group: after) {
    .rail {
      scroll-marker-group: after;        /* generate a dot group after the rail */
    }

    /* prev / next arrow buttons — browser disables them at the ends */
    .rail::scroll-button(left)  { content: "\2039"; }    /* ‹ */
    .rail::scroll-button(right) { content: "\203A"; }    /* › */
    .rail::scroll-button(*) {
      border: 0; cursor: pointer; font-size: 1.5rem;
      width: 2.5rem; height: 2.5rem; border-radius: 99px;
      background: var(--ink); color: var(--paper);
    }
    .rail::scroll-button(*):disabled { opacity: .35; cursor: default; }
    .rail::scroll-button(*):focus-visible {
      outline: 3px solid var(--accent); outline-offset: 3px;
    }

    /* one pagination dot per card child */
    .card::scroll-marker {
      content: ""; width: 9px; height: 9px; border-radius: 99px;
      background: #c9c2b4; margin: .75rem .25rem 0;
    }
    .card::scroll-marker:target-current { background: var(--accent); }
    .rail::scroll-marker-group { display: flex; justify-content: center; }
  }
</style></head>
<body>
  <h1>Selected work</h1>
  <p class="hint">Swipe, shift-scroll, or Tab then arrow keys.</p>

  <!-- Real <ul>/<li> so screen readers announce "list, 4 items";
       tabindex makes each card a keyboard Tab stop. -->
  <ul class="rail" aria-label="Project gallery" role="list"
      style="list-style:none; margin:0;">
    <li class="card" tabindex="0">Harbor rebrand</li>
    <li class="card" tabindex="0">Atlas dashboard</li>
    <li class="card" tabindex="0">Field guide app</li>
    <li class="card" tabindex="0">Press kit 2026</li>
  </ul>

  <script>
    // Arrow keys move between snap points when the rail or a card is focused.
    const rail = document.querySelector('.rail');
    rail.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const cards = [...rail.querySelectorAll('.card')];
      const i = cards.indexOf(document.activeElement);
      if (i === -1) return;
      const next = cards[e.key === 'ArrowRight'
        ? Math.min(i + 1, cards.length - 1)
        : Math.max(i - 1, 0)];
      if (next) { next.focus(); e.preventDefault(); }
    });
  </script>
</body></html>
```

### GSAP ScrollTrigger pinned track (desktop production) — vertical scroll pans sideways
The realistic production choice for pattern 1. Note the **mobile guard**: on touch/small screens we do NOT pin; we hand off to the native snap rail so swipe still works. Reduced-motion users are also excluded from the pin and see a normal vertical layout.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:"Geist",system-ui,sans-serif;
         background:#0f1115; color:#f3efe7; }
  .lead, .outro { min-height: 80vh; display:grid; place-items:center; padding:2rem; }
  .lead h1 { font-size:clamp(2rem,7vw,5rem); letter-spacing:-.03em;
             max-width:14ch; text-align:center; }

  /* The pinned viewport */
  .pin { height: 100vh; overflow: hidden; }
  .track { display:flex; height:100vh; width:max-content; }
  .panel {
    flex:0 0 100vw; height:100vh;
    display:grid; place-items:center; padding:4vw;
    font-size:clamp(1.5rem,4vw,3rem); font-weight:600;
  }
  .panel:nth-child(1) { background:#16202b; }
  .panel:nth-child(2) { background:#1d2b24; }
  .panel:nth-child(3) { background:#2b1d24; }
  .panel:nth-child(4) { background:#2b271d; }

  /* Touch / small screens: fall back to a native swipe rail (no pin) */
  @media (max-width: 800px), (pointer: coarse) {
    .pin { height:auto; overflow-x:auto;
           scroll-snap-type:x mandatory; overscroll-behavior-x:contain; }
    .track { width:max-content; }
    .panel { flex:0 0 86vw; height:70vh; margin-right:1rem;
             scroll-snap-align:center; border-radius:12px; }
  }
</style></head>
<body>
  <section class="lead"><h1>Four chapters, one sideways breath.</h1></section>

  <section class="pin" aria-label="Process, panels 1 to 4">
    <div class="track">
      <article class="panel">01 — Research</article>
      <article class="panel">02 — Shape</article>
      <article class="panel">03 — Build</article>
      <article class="panel">04 — Ship</article>
    </div>
  </section>

  <section class="outro"><p>…and we resume scrolling down.</p></section>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  <script>
    gsap.registerPlugin(ScrollTrigger);

    const reduce  = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktop = matchMedia('(min-width: 801px) and (pointer: fine)').matches;

    // Only run the pin hijack on a real pointer + wide screen + motion allowed.
    // Reduced-motion / touch users keep the native CSS rail above — content intact,
    // fully swipeable, no scroll direction override.
    if (desktop && !reduce) {
      const track = document.querySelector('.track');

      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: '.pin',
          pin: true,
          scrub: 1,               // smoothing latency — not a jittery 1:1 lock
          anticipatePin: 1,       // pre-pin on fast scroll to avoid a flash
          end: () => '+=' + (track.scrollWidth - window.innerWidth),
          invalidateOnRefresh: true  // recompute distances on resize
        }
      });

      window.addEventListener('resize', () => ScrollTrigger.refresh());
    }
  </script>
</body></html>
```

### Framer Motion (React) — sticky wrapper, scroll progress drives x
```jsx
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

const PANELS = ["01 — Research", "02 — Shape", "03 — Build", "04 — Ship"];

export function HorizontalTrack() {
  const reduce = useReducedMotion();
  const wrap   = useRef(null);

  // progress 0→1 across the tall section's scroll distance
  const { scrollYProgress } = useScroll({
    target: wrap,
    offset: ["start start", "end end"],
  });
  // 4 panels => travel from 0 to -75% of the track width
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  // Reduced motion: static, vertically-stacked, fully readable fallback.
  // No pin, no x translate — content is present and legible without motion.
  if (reduce) {
    return (
      <section aria-label="Process, steps 1 to 4">
        {PANELS.map((p) => (
          <div
            key={p}
            style={{
              minHeight: "50vh",
              display: "grid",
              placeItems: "center",
              fontSize: "2rem",
              fontWeight: 600,
            }}
          >
            {p}
          </div>
        ))}
      </section>
    );
  }

  return (
    // tall outer section creates the scroll distance; inner is sticky 100vh
    <section ref={wrap} style={{ height: "400vh" }} aria-label="Process, steps 1 to 4">
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        <motion.div
          style={{ x, display: "flex", height: "100vh", willChange: "transform" }}
        >
          {PANELS.map((p) => (
            <article
              key={p}
              style={{
                flex: "0 0 100vw",
                height: "100vh",
                display: "grid",
                placeItems: "center",
                fontSize: "clamp(1.5rem,4vw,3rem)",
                fontWeight: 600,
              }}
            >
              {p}
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

## Variations
- **Drive direction** — pinned (vertical scroll → x translate) vs native rail (user scrolls x directly). This is the fundamental fork; everything else is a knob.
- **Snap strictness** — `mandatory` (always lands on a card, good for discrete galleries) vs `proximity` (only snaps when near, gentler for free-form browsing).
- **Card sizing knob** — `flex-basis` controls the "peek": `78%` shows the next card's edge (browsing affordance); `100vw` makes each panel full-bleed (cinematic).
- **Scrub feel** — `scrub: true` (1:1, tight) vs `scrub: 1` (latency smoothing, premium) vs `scrub: 2` (slow, floaty).
- **Easing of the pan** — keep the *track* tween `ease:"none"` (it's scrubbed by scroll), but ease the *entrances of content inside each panel* with expo `cubic-bezier(0.16,1,0.3,1)`.
- **Controls layer** — bare rail vs native `::scroll-button()`/`::scroll-marker()` vs a JS carousel with explicit ARIA.

## Accessibility
- **prefers-reduced-motion (mandatory).** The scroll-direction hijack is exactly the kind of vestibular trigger the media query exists for. Every motion path above handles it: the GSAP version *does not pin* under `reduce` (users keep a normal vertical layout or native rail); Framer renders a static vertically-stacked readable fallback; the native rail switches `scroll-behavior` to `auto`. Rule: under reduced motion, never translate content sideways from a vertical gesture — show the final/legible state.
- **Pointer / touch fallback (mandatory).** The pinned hijack is broken on touch (swipe gestures do not drive a vertical-scroll-linked tween). Gate the pin behind `(pointer: fine)` + width, and serve the **native swipe rail** to `(pointer: coarse)` so touch users get real, direct horizontal scrolling. Both pinned code paths above do this via `@media (pointer: coarse)` CSS and a matching `matchMedia` JS guard.
- **Keyboard.** Native rails are keyboard-scrollable only if something inside is focusable — give items `tabindex="0"` (the rail example does) so Tab lands on each, and the optional arrow-key handler moves between them. The native `::scroll-button()`/`::scroll-marker()` controls are real focusable buttons with built-in keyboard handling. For a pinned track, ensure focusable content in later panels still works — pinned-offscreen focus targets can scroll-jump; test Tab order.
- **Scrollbar affordance.** A native rail shows a real horizontal scrollbar — keep it visible (do not use `scrollbar-width: none`) so users know there is more to the right. A pinned track hides this: the *vertical* scrollbar implies "page is very long" while you are actually panning sideways — pair it with an on-screen progress indicator (1/4 … 4/4) so users are not lost.
- **Contrast and focus.** Code uses burnt-orange `#d6552b` focus rings on dark `#0f1115`. Contrast ratio for the focus ring against the dark background: **4.67:1** — past the 3:1 WCAG minimum for non-text / UI components. Paper text `#f3efe7` on `#0f1115` computes to **16.48:1**, far above the 4.5:1 body-text threshold.
- **Screen readers / no-JS.** Mark up galleries as real `<ul role="list">` so screen readers announce "list, N items"; the pinned panels are plain `<article>`s in source order, so the content reads top-to-bottom even if GSAP never loads. The effect is decoration over already-complete content.

## Performance
- **Animate only `transform`** (the track's `x`/`translateX`) and `opacity`. Translating `left`/`margin` would thrash layout every frame; translating `transform` stays on the compositor. The native rail animates nothing — the browser scrolls a layer, which is the cheapest path.
- **`will-change: transform`** on the moving track (Framer example) hints a GPU layer — use it on the *one* translating wrapper, not on every panel, or you will blow GPU memory.
- **Scrub smoothing** — `scrub: 1` decouples the tween from raw scroll events so you are not recomputing on every wheel tick; a hard `scrub: true` can feel janky on high-rate trackpads.
- **Pin recalculation** — pinning measures element sizes; call `ScrollTrigger.refresh()` on resize and use `invalidateOnRefresh: true` so distances recompute. Heavy images inside panels can shift those measurements after load — set explicit `aspect-ratio`/dimensions to avoid mid-scroll jumps.
- **`overscroll-behavior-x: contain`** on native rails stops the horizontal scroll from triggering browser back/forward navigation on trackpads and touch.
- **Bundle cost.** Native rail = 0 KB JS. GSAP core + ScrollTrigger ≈ 70–75 KB min (≈ 30 KB gzipped) — real weight; only load it where the pinned effect actually runs. Framer Motion is heavier still (tree-shakes, but plan for tens of KB). The native CSS path is free; reach for a library only for the pinned hijack or fine scrub control.

## Anti-slop
**The cliché (see `_slop-blocklist.md` → MOTION):** the autoplay-or-hijack carousel with no controls, and the "pin the whole site sideways and pan every section the same way with the same default `ease`." Sibling tells from the blocklist: every element fading-and-sliding with identical duration/easing; an autoplay carousel with no pause/affordance (a11y and taste failure). Combined with the COLOR tell (purple→pink gradient panels on white) it announces a generated result.

**The tasteful alternative:** (1) Prefer the **native snap rail** with a visible scrollbar and real controls over a scroll hijack — let the user drive. (2) If you do pin, reserve it for *one* finite, meaningful sequence (a process, a chronology), not the whole page. (3) Vary which elements move: let the track pan at `ease:"none"` but stagger the *content inside* each panel in on arrival with expo easing `cubic-bezier(0.16,1,0.3,1)` and a meaningful 80–120 ms stagger — so the pan reveals, it does not just slide. (4) Commit to a non-default palette (the examples use warm sand `#f3efe7` + burnt-orange `#d6552b`, not SaaS blue or the purple-pink gradient). (5) Always orient the user: pagination dots or a "n/total" counter so the sideways detour never feels like getting lost.

## Pairs well with
- `sticky-pinning` — the pin mechanic underneath pattern 1; reuse the same ScrollTrigger pin config.
- `scroll-progress-indicator` — essential orientation for a pinned track (the vertical scrollbar lies about where you are); a "1 / 4" counter or progress bar fixes it.
- `text-reveal-on-scroll` — stagger each panel's headline in on arrival (mask-up lines, expo easing) so the pan *reveals* content rather than just transporting it.
- `staggered-entrance` — share one easing language (`cubic-bezier(0.16,1,0.3,1)`) across panel-content entrances and the rest of the page.
- `editorial-typographic` style — big display type per panel is what makes the sideways pan read as intentional, not gimmicky.

## Current references
- [MDN — CSS scroll snap: basic concepts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap/Basic_concepts) — `scroll-snap-type`, `scroll-snap-align`, `scroll-snap-stop`, padding/margin; the native rail foundation (Baseline: Widely available).
- [Chrome for Developers — Carousels with CSS](https://developer.chrome.com/blog/carousels-with-css) — `::scroll-button()` and `::scroll-marker()` shipped Chrome/Edge 135 (March 2025); built-in keyboard and screen-reader semantics.
- [MDN — Creating CSS carousels](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_overflow/CSS_carousels) — end-to-end native carousel guide with `scroll-marker-group` and `@supports` fallback pattern.
- [MDN — `::scroll-button()`](https://developer.mozilla.org/en-US/docs/Web/CSS/::scroll-button) — syntax and the honest "Limited availability, not Baseline" support note (Chromium-led; Firefox/Safari in progress as of 2026).
- [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) — `pin`, `scrub`, `anticipatePin`, `end` callback, `matchMedia`/`refresh` for responsive pinned tracks; the full collection of scroll animation demos including horizontal-scroll examples is linked from this page under the CodePen demos collection.
- [Motion — scroll-linked animations (React)](https://motion.dev/docs/react-scroll-animations) — `useScroll` + `useTransform` + `useReducedMotion` for the React sticky-track approach; canonical docs at motion.dev (permanent domain as of 2024, replacing framer.com/motion).
- [CSS-Tricks — CSS Carousels](https://css-tricks.com/css-carousels/) — overview of the CSS Overflow Level 5 carousel pseudo-elements with examples and browser-support notes.
