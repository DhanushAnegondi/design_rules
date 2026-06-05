# Sticky / pinning

> Hold an element fixed in the viewport while the rest of the page scrolls past it — cheaply with `position: sticky`, or with GSAP ScrollTrigger `pin` when a scrubbed, sequenced animation needs to play while the section is held.

**Bucket:** scroll/motion
**Maturity:** evergreen
**Effort:** low (sticky) / medium (ScrollTrigger pin)
**Best for:** websites, portfolios, agency/editorial sites, product feature walkthroughs

## What it is

A pinned element stops moving with the scroll and holds at a fixed viewport position while surrounding content keeps scrolling. Two distinct mechanisms produce the same perceived effect:

1. **`position: sticky`** — pure CSS. The element behaves as `relative` until its containing block reaches a scroll threshold (e.g. `top: 0`), then acts like `fixed` until the containing block scrolls out. Zero JS, compositor-friendly, and requires no library — but it provides no scroll-progress value to drive an animation, and it is silently broken by any ancestor with `overflow: hidden | auto | scroll`.
2. **GSAP ScrollTrigger `pin`** — JS switches the element to `position: fixed` between two scroll positions and props the resulting gap with a generated `.pin-spacer` wrapper. This exposes a `progress` value (0→1) that a **scrubbed** timeline can read, so a choreographed sequence plays *while the element is held still*. This is the "pin a section and animate inside it" pattern used on most modern product and agency pages.

The perceived effect: the user scrolls, something stays put while the world moves, then releases.

## When to use

- **Sticky:** section headings or labels that hold while their subordinate items scroll past; sticky table headers; side rails and tables of contents; a two-column editorial layout where an image sticks while caption text scrolls beside it.
- **Sticky stacking cards:** a set of full-height panels each declared `position: sticky; top: 0` so successive panels slide over the previous ones — pure CSS, no JS, very popular 2024–2026 on portfolio and case-study pages.
- **ScrollTrigger pin:** a feature section that pins and reveals numbered steps as the user scrolls (scrubbed timeline); a horizontal scroll gallery (pin vertically, translate-x with scrub); a pinned headline whose text fills in line by line (pairs with scrub reveals); any sequence where pacing must be tied 1:1 to scroll distance.

## When NOT to use

- **Do not pin every section.** Scroll-jacked feature reels where the page lurches from pin to pin fight the user's scroll momentum and feel broken on trackpads and touch. One or two intentional pinned moments, not an entire page.
- Don't pin when a plain on-enter reveal would do — pinning adds scroll distance the user must traverse with nothing new on screen if the inner animation is thin.
- Avoid sticky inside any ancestor with `overflow: hidden | auto | scroll` — it silently breaks. This is the most common sticky bug. Swap `hidden` for `clip` where you only need to prevent overflow without creating a scroll container.
- Long pinned sequences hurt users who cannot scrub precisely (motor impairments) and anyone with `prefers-reduced-motion` — the reduced-motion path must skip the pin entirely and let the page scroll normally.
- Mobile: pinned horizontal galleries with dense scrub timelines can feel heavy on low-end hardware. Test on a real device before shipping.

## How it works

### `position: sticky`

An element marked `position: sticky` is part of normal flow. When its **nearest scrollable ancestor** scrolls far enough that the element would leave the defined threshold offset (e.g. `top: 0`), the browser composites it as though `fixed`, until its **containing block** (the parent) scrolls fully out. Two common failure modes:

- **Overflow / scroll-container trap:** Any ancestor with `overflow: hidden | auto | scroll` creates a new scroll container. The sticky element then references *that ancestor* rather than the viewport — often silently, because the container isn't itself taller than the viewport, so the element appears never to stick. Fix: remove the unnecessary `overflow`, or replace `overflow: hidden` with **`overflow: clip`**. `overflow: clip` clips visually without creating a new scroll container (no new formatting context), so sticky keeps referencing the viewport correctly. Browser support for `overflow-x: clip` is ~94.5% globally (Chrome/Edge 90+, Firefox 81+, Safari 16+, iOS Safari 16+ — baseline widely available as of 2024).
- **Containing-block trap:** Sticky only sticks for the height of its parent. If the parent collapses to the same height as the sticky child, there is no room to stick. The parent must be taller. Also: flexbox and grid containers default to `align-items: stretch`, stretching the sticky child to fill the container and immediately un-sticking it; apply `align-self: start` or `align-items: start`.
- **Threshold not set:** `top`, `bottom`, `left`, or `right` must be set to a non-`auto` value. Without it, sticky degrades to `relative`.
- **Stacking contexts:** `position: sticky` always creates a new stacking context, so z-index values are scoped inside it. Multiple sticky headers in sequence need escalating `z-index` values to stack correctly; a dropdown inside a sticky header may be trapped below a sibling stacking context regardless of z-index magnitude.

**2025 enhancement — `container-type: scroll-state`:** Chrome 133+ ships `container-type: scroll-state`, which lets you detect when a sticky element is stuck and style its descendants accordingly — no JS needed. Firefox and Safari have expressed intent but have not shipped as of mid-2026; treat it as progressive enhancement only.

```css
/* Chrome 133+ progressive enhancement — do not rely on for core layout */
.site-header {
  position: sticky;
  top: 0;
  container-type: scroll-state; /* mark as query container */
}
@container scroll-state(stuck: top) {
  .site-header__inner { box-shadow: 0 2px 12px rgba(0,0,0,.18); }
}
```

### GSAP ScrollTrigger `pin`

ScrollTrigger wraps the pinned element in a `.pin-spacer` div (same dimensions as the original), switches the element to `position: fixed` between `start` and `end`, and by default adds `padding-bottom` to the spacer so following content "catches up" correctly when the element unpins. Key options:

- `pin: true` (or a selector) — what to hold fixed.
- `start` / `end` — scroll positions, e.g. `"top top"` / `"+=1600"` (pin for 1600 px of scroll).
- `scrub: true` (instant) or `scrub: 1` (1-second catch-up smoothing) — ties an attached tween/timeline's progress to the scrollbar.
- `pinSpacing: true | false | "margin"` — `true` (default) reserves scroll space; `false` lets the next section overlap (needed for stacking-card pins and full-bleed crossfades, but you own the layout).
- `anticipatePin: 1` — reduces a one-frame jump when the user scrolls quickly into the pin.
- `invalidateOnRefresh: true` + `ScrollTrigger.refresh()` on `load` — recomputes pin math after fonts and images shift layout.
- `pinReparent: true` — if an ancestor has `transform` or `will-change` (which breaks `position: fixed`), this reparents the pinned element to `<body>` during the pin. Use sparingly: it breaks CSS rules that rely on DOM nesting (e.g. `.section .panel p`).

Native CSS (`animation-timeline: scroll()` / `view()`) can scrub an animation against scroll progress but **cannot hold an element fixed while doing so**. So: sticky covers the cheap pin; ScrollTrigger covers the scrubbed pinned sequence. Default to sticky; reach for ScrollTrigger only when you need the progress value. As of mid-2026, native scroll-driven animations ship in Chrome/Edge 115+, Safari 26+, and Opera 101+ (~83% globally); Firefox has the feature behind a flag.

## Working code

### Native CSS — sticky stacking panels (no JS, no motion)

Each panel is `position: sticky; top: 0` and full-viewport-height, so every subsequent panel slides up over the previous one. No ancestor uses `overflow: hidden` — if yours does, swap it for `overflow: clip`. Because nothing animates, there is no `prefers-reduced-motion` branch needed — motion-sensitive users see the same readable stacked layout.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --ink:   #0c0d10;
    --paper: #f3efe7;
    --muted: #9c9790;
  }
  * { box-sizing: border-box; margin: 0; }
  body {
    font-family: ui-sans-serif, system-ui, sans-serif;
    background: var(--ink);
    color: var(--paper);
    /* CRITICAL: no overflow:hidden here — that would kill sticky on children */
  }

  /* each panel must be inside a container tall enough to scroll through */
  .panel {
    position: sticky;
    top: 0;
    height: 100vh;
    display: grid;
    place-content: center;
    padding: 8vw;
    border-top: 1px solid rgba(243,239,231,.12);
  }

  /* one-hue tonal tints per panel, not a rainbow */
  .p1 { background: #0f1318; }
  .p2 { background: #121810; }
  .p3 { background: #181210; }
  .p4 { background: #100f18; }

  .panel h2 {
    font-size: clamp(2rem, 7vw, 5rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 0.95;
    color: var(--paper);
  }
  .panel p {
    max-width: 34ch;
    margin-top: 1rem;
    font-size: 1.05rem;
    line-height: 1.6;
    color: var(--muted);
  }
  /* panel counter — visible accent, single hue */
  .count {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #e8542f;           /* #e8542f on #0f1318 ≈ 5.6:1, passes AA */
    margin-bottom: 0.75rem;
  }
</style>
</head>
<body>

<section>
  <article class="panel p1">
    <div>
      <span class="count">01 — Intake</span>
      <h2>Define the problem worth solving.</h2>
      <p>This panel sticks at the top while the next one slides up over it. No JavaScript, no scroll listeners.</p>
    </div>
  </article>

  <article class="panel p2">
    <div>
      <span class="count">02 — Shape</span>
      <h2>Narrow scope before writing a line.</h2>
      <p>Each panel is full-height so the parent section is tall enough to scroll through. The containing block is the key.</p>
    </div>
  </article>

  <article class="panel p3">
    <div>
      <span class="count">03 — Build</span>
      <h2>Ship the smallest useful version.</h2>
      <p>If an ancestor had overflow:hidden, swap it for overflow:clip — it clips without creating a scroll container.</p>
    </div>
  </article>

  <article class="panel p4">
    <div>
      <span class="count">04 — Ship</span>
      <h2>Measure what changed, not what launched.</h2>
      <p>When the final panel is visible, this section ends and normal scrolling resumes. No JS required.</p>
    </div>
  </article>
</section>

</body>
</html>
```

### Native CSS — sticky + scroll-scrubbed inner reveal (progressive enhancement)

The section is `position: sticky` while the parent provides the scroll range. A child element animates against a named `scroll-timeline` scoped to that parent. **Support:** Chrome/Edge 115+, Safari 26+, Opera 101+ (~83% globally as of mid-2026); Firefox has the feature behind a flag. Browsers that don't support `animation-timeline` ignore it and render the final state — a plain sticky panel.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    font-family: ui-sans-serif, system-ui, sans-serif;
    background: #0c0d10;
    color: #f3efe7;
  }
  .spacer { height: 60vh; display: grid; place-content: center; color: #7d7a73; }

  /*
    The scroll-timeline is scoped to .pin-section.
    The section must be taller than the viewport so there is scroll range to
    drive the animation — here 3× viewport height gives a long scrub window.
  */
  .pin-section {
    position: relative;
    height: 300vh;
    scroll-timeline-name: --pin-tl;
    scroll-timeline-axis: block;
  }

  /* The sticky wrapper: overflow:clip NOT hidden, so sticky isn't broken */
  .sticky-inner {
    position: sticky;
    top: 0;
    height: 100vh;
    display: grid;
    place-content: center;
    overflow: clip;
  }

  .headline {
    font-size: clamp(2.5rem, 9vw, 7rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 0.92;
  }

  /* Progress bar scrubbed by scroll — decorative, aria-hidden */
  .progress-bar {
    height: 5px;
    width: 60vw;
    max-width: 36rem;
    margin-top: 2rem;
    border-radius: 999px;
    background: #e8542f;          /* single accent, not a gradient */
    transform-origin: left center;
    transform: scaleX(0);
    animation: bar-fill linear forwards;
    animation-timeline: --pin-tl;
    animation-range: entry 0% exit 100%;
  }
  @keyframes bar-fill { to { transform: scaleX(1); } }

  /*
    MANDATORY: prefers-reduced-motion.
    Show the final (filled) state; skip the scrub entirely.
    The sticky section still scrolls normally — no held scroll distance.
  */
  @media (prefers-reduced-motion: reduce) {
    .progress-bar {
      animation: none;
      transform: scaleX(1);
    }
  }
</style>
</head>
<body>

<div class="spacer">scroll down</div>

<section class="pin-section">
  <div class="sticky-inner">
    <div>
      <h1 class="headline">Held,<br>then released.</h1>
      <div class="progress-bar" aria-hidden="true"></div>
    </div>
  </div>
</section>

<div class="spacer">back to normal scroll</div>

</body>
</html>
```

### GSAP ScrollTrigger — pin a section and scrub a multi-step sequence

The production choice when you need a reliably scrubbed timeline across all browsers today. **GSAP is fully free including all plugins as of 29 April 2025** (Webflow acquisition). Real expo easing, real start/end, real reduced-motion branch that skips `registerPlugin`/pin entirely.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    font-family: ui-sans-serif, system-ui, sans-serif;
    background: #0c0d10;
    color: #f3efe7;
  }

  .intro {
    height: 70vh;
    display: grid;
    place-content: center;
    color: #7d7a73;
    font-size: 1rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /*
    CSS baseline: steps are fully visible (opacity:1, transform:none).
    JS only hides them when it will animate — so content is readable
    without JS, and on the reduced-motion path, nothing is hidden.
  */
  .pin-section {
    height: 100vh;
    display: grid;
    place-content: center;
    text-align: center;
    padding: 6vw;
    overflow: clip;       /* clip not hidden — never break sticky/fixed context */
  }
  .pin-section h2 {
    font-size: clamp(1.75rem, 5vw, 3.5rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-bottom: 2rem;
  }

  .steps {
    display: flex;
    gap: 1.25rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .step {
    width: 14rem;
    padding: 1.5rem 1.25rem;
    border-radius: 12px;
    background: #14161c;
    border: 1px solid #252830;
    text-align: left;
    /* Baseline visible state — never gate meaning on JS/motion */
    opacity: 1;
    transform: none;
  }
  .step-num {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #e8542f;     /* #e8542f on #14161c ≈ 5.4:1, passes WCAG AA */
    margin-bottom: 0.6rem;
  }
  .step p {
    font-size: 0.9rem;
    line-height: 1.55;
    color: #a09b93;     /* #a09b93 on #14161c ≈ 5.8:1, passes WCAG AA */
  }

  .outro {
    height: 80vh;
    display: grid;
    place-content: center;
    color: #7d7a73;
  }
</style>
</head>
<body>

<div class="intro">scroll down</div>

<section class="pin-section">
  <div>
    <h2>How the work gets done</h2>
    <div class="steps">
      <div class="step">
        <span class="step-num">01 — Intake</span>
        <p>You scroll into the section. It pins in place.</p>
      </div>
      <div class="step">
        <span class="step-num">02 — Reveal</span>
        <p>Steps appear in sequence, tied to your scroll progress.</p>
      </div>
      <div class="step">
        <span class="step-num">03 — Release</span>
        <p>When the timeline ends, the section unpins and scrolling resumes.</p>
      </div>
    </div>
  </div>
</section>

<div class="outro">normal scroll resumes here</div>

<!--
  GSAP 3.13+ is fully free including all plugins (ScrollTrigger, SplitText, etc.)
  as of 29 April 2025. No licence key required for any project type.
-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script>
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduce) {
    gsap.registerPlugin(ScrollTrigger);

    /*
      Hide steps NOW — only when we know we'll animate them.
      This keeps the baseline (no-JS / reduced-motion) states fully visible.
    */
    gsap.set('.step', { opacity: 0, y: 36 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.pin-section',
        start: 'top top',       // pin when section top hits viewport top
        end: '+=1600',          // hold for 1600 px of scroll distance
        pin: true,              // GSAP inserts .pin-spacer to preserve layout
        pinSpacing: true,       // default: pads below so content catches up correctly
        scrub: 1,               // 1-second smooth catch-up; avoids 1:1 jank
        anticipatePin: 1,       // prevents one-frame jump on fast scroll-in
        invalidateOnRefresh: true,
      }
    });

    /*
      Animate transform + opacity only — GPU-composited, no layout thrash.
      Custom expo easing ≈ cubic-bezier(0.16,1,0.3,1), not the default ease.
      Meaningful stagger (0.25) so steps read as a sequence, not a blur.
    */
    tl.to('.step', {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'expo.out',
      stagger: 0.25,
    });

    /*
      Recompute pin math after fonts and images finish loading.
      Without this, late-loading assets shift layout and pin positions drift.
    */
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }
  /*
    Reduced-motion path: nothing is registered, nothing is pinned, nothing is
    hidden. The section scrolls through normally; steps are fully readable at
    their CSS baseline (opacity:1, transform:none).
  */
</script>

</body>
</html>
```

## Variations

- **Sticky vs pin** — the core knob: CSS-only hold (no progress value, no library) vs JS pin (exposes progress for scrub). Default to sticky; escalate to pin only when you need the animation tied to scroll distance.
- **`pinSpacing: true` vs `false`** — `true` reserves the scroll space so following content arrives at the right position when the pin releases (most cases); `false` lets the next section overlap the pinned one, which is correct for stacking-card pins and full-bleed crossfades — but you own the resulting layout.
- **Stacking panels** — sticky panels at `top: 0` that pile up (pure CSS), vs a scaled-down card-deck where each panel shrinks via a scroll-timeline `scale()` before the next one covers it.
- **Horizontal scroll gallery** — pin a section vertically, then tween `x: -(totalWidth)` with scrub so vertical scrolling reads as horizontal movement.
- **Pin offset** — `top: var(--header-h)` (sticky) or `start: "top 64px"` (GSAP) to clear a fixed header. Update the value as a CSS custom property so both uses stay in sync.
- **Scrub smoothing** — `scrub: true` (instant 1:1, can feel twitchy on trackpad) vs `scrub: 1` or `1.5` (eased catch-up, reads more premium). A value of `1` is a practical default.
- **scroll-state(stuck)** — progressive enhancement in Chrome 133+: `container-type: scroll-state` on the sticky element lets CSS react to the stuck state without any JS (drop-shadow appearing, header shrinking).

## Accessibility

- **prefers-reduced-motion (mandatory for everything that moves):** shown in every animated snippet above. The GSAP version checks `matchMedia` before calling `registerPlugin` or setting any hidden initial state — the section scrolls normally, steps are fully visible, no pin. The native scroll-scrub version sets the bar to its final `scaleX(1)` state in the media query so it renders complete immediately. The pure sticky stack requires no branch because nothing animates.
- **Pointer and touch fallback:** sticky and ScrollTrigger pin are scroll-driven, not pointer/hover-driven, so there is no cursor dependency at the mechanism level. However, long pinned sequences can *feel* like the page is stuck on touch — keep pin scroll distances short (no more than about 1.5–2 viewport heights) and always test on a real touch device, not just trackpad. If you add cursor-follow or hover effects *inside* a pinned section, gate those effects with `@media (hover: hover) and (pointer: fine)` so they do not fire on touch.
- **Content present without JS / motion:** never gate meaning on the animation. In the GSAP snippet, CSS renders all steps at `opacity: 1; transform: none`. JS only sets `opacity: 0; y: 36` when it is about to animate — so a failed script load, a script-blocked browser, or the reduced-motion path all present fully readable content.
- **Focus and keyboard:** when ScrollTrigger pins an element it switches it to `position: fixed`. Ensure that focusable controls inside the pinned section remain reachable via keyboard, that the generated `.pin-spacer` does not receive focus, and that tab order is not disrupted. Never trap scrolling — the user must always be able to keep scrolling past the pinned section.
- **Contrast values (referenced to colors used in this file's code):** the accent `#e8542f` on background `#14161c` yields approximately 5.4:1, which passes WCAG AA (≥ 4.5:1) for normal-weight text. The muted body text `#a09b93` on `#14161c` yields approximately 5.8:1 — also passes AA. The counter color `#e8542f` on the darkest panel background `#0f1318` yields approximately 5.6:1, passes AA. Recompute any color you swap in; do not carry these ratios over to a different surface.
- **Screen readers:** sticky and pin do not alter DOM order, so reading order is preserved. Decorative elements (the progress bar) carry `aria-hidden="true"`. Never use `aria-live` on content that changes only as a visual scroll effect.

## Performance

- **Sticky is essentially free** — the browser composites it without a scroll listener or JS. Prefer it whenever you do not need a progress value.
- **Animate only `transform` and `opacity`** — both are GPU-composited and do not trigger layout or paint. Never scrub `top`, `left`, `height`, `margin`, or `background-size` in a pinned timeline.
- **ScrollTrigger pin overhead:** the `.pin-spacer` insertion and the `position: fixed` switch are cheap. The cost comes from running the scrub timeline every scroll frame — keep that timeline to transform/opacity animations only, and avoid heavy `backdrop-filter`, multi-layer `box-shadow`, or `filter: blur()` on elements that update every frame.
- **`scrub: 1`** (smoothed) avoids janky 1:1 coupling. It also reduces the frequency at which the tween needs to update because slight scroll micro-movements below the smoothing window are damped.
- **`will-change: transform`** on the scrubbed children can promote them to their own compositor layer and speed up repaints, but apply it sparingly — over-applying it creates excess GPU layers, consumes memory, and on mobile can *slow* things down. Add it only to elements that are actively animating, and remove it when the animation ends if you control lifecycle.
- **`invalidateOnRefresh: true` + `ScrollTrigger.refresh()`** on `load`: fonts and images shift layout after initial paint; without refresh the pin math computes against stale positions and the section unpins at the wrong scroll offset.
- **Bundle cost:** GSAP core + ScrollTrigger is roughly 35–40 KB gzipped from the CDN. A sticky-only implementation costs zero JS. If your only requirement is a cheap hold, do not pull in GSAP.
- **Overflow clip audit:** debugging "sticky won't stick" wastes hours. Before reaching for JS, inspect every ancestor with browser DevTools for any `overflow` value other than `visible`. Replace with `overflow: clip` where you only need to clip content, not create a scroll container.

## Anti-slop

Cliché (see `_slop-blocklist.md` → MOTION): the scroll-jacked feature reel where *every* section pins and the same cards fade-and-slide-up with identical `0.5s` duration and default `ease` — the page scrolls in lurching chunks, fights scroll momentum, and reads as a template, not a design decision. This is the pinned cousin of the blocklist's "everything fades-and-slides-up the same way."

Tasteful alternative: pin **one** deliberate moment per page, not the whole page. Vary *which* elements move — let the headline hold still while only the step cards stagger in, or scrub a single progress bar rather than animating every element simultaneously. Use a real expo/spring easing (`expo.out` / `cubic-bezier(0.16,1,0.3,1)`) with a meaningful stagger (`0.25s`) so steps read as a sequence with rhythm, not a blur of simultaneous motion. Keep pin scroll distance short — if there is more than about 1200–1600 px of "dead scroll" where nothing changes, the experience feels broken. And never autoplay a pinned carousel without controls.

## Pairs well with

- `text-reveal-on-scroll` — pin a section and scrub a headline word-fill or mask-up reveal as it holds; the scrub-fill flavour is designed for exactly this pinned-range context.
- `scroll-progress-indicator` — orient the reader during a long pinned sequence so the held scroll doesn't feel like the page froze; a thin progress bar at the viewport edge communicates "you're inside a sequence."
- `staggered-entrance` — reuse the same `expo.out` easing and `0.25s` stagger language for the steps revealed inside the pin so the motion vocabulary is consistent across the page.
- `horizontal-scroll-gallery` — pin vertically and translate-x with scrub is the canonical horizontal gallery build; the pin provides the scroll budget the horizontal translation consumes.
- `scroll-linked-scrubbing` — the generalised scrub pattern; sticky-pinning is one specific application of it.

## Current references

- [MDN — position](https://developer.mozilla.org/en-US/docs/Web/CSS/position) — definition of sticky, containing block, overflow trap, and the stacking context it always creates.
- [Polypane — all the ways position:sticky can fail](https://polypane.app/blog/getting-stuck-all-the-ways-position-sticky-can-fail/) — definitive checklist: overflow trap, containing-block trap, missing threshold, flex/grid stretch issues.
- [Ben Frain — yes, you can use position:sticky and overflow together](https://benfrain.com/yes-you-can-use-position-sticky-and-overflow-together/) — introduces `overflow: clip` as the fix; explains why `hidden` creates a formatting context and `clip` does not.
- [Terluin — sticky not working? Use overflow:clip not overflow:hidden](https://www.terluinwebdesign.nl/en/css/position-sticky-not-working-try-overflow-clip-not-overflow-hidden/) — practical walkthrough of the `clip` fix with examples; current browser support (~94.5% as of 2024).
- [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) — canonical reference for `pin`, `pinSpacing`, `scrub`, `anticipatePin`, `pinReparent`, `start`/`end` (v3.12+).
- [Codrops — 5 creative demos using free GSAP plugins (2025)](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/) — confirms GSAP went fully free including all plugins on 29 April 2025; forkable demos.
- [MDN — container scroll-state queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Conditional_rules/Container_scroll-state_queries) — `container-type: scroll-state` and `stuck: top` syntax; Chrome 133+ only as of mid-2026.
- [Chrome for Developers — CSS scroll-state queries](https://developer.chrome.com/blog/css-scroll-state-queries) — engineering overview of the `stuck` / `snapped` query syntax and use cases.
- [caniuse — animation-timeline: scroll()](https://caniuse.com/mdn-css_properties_animation-timeline_scroll) — live browser-support data for native scroll-driven animations; ~83% global as of mid-2026.
- [Smashing Magazine — sticky headers and full-height elements (2024)](https://www.smashingmagazine.com/2024/09/sticky-headers-full-height-elements-tricky-combination/) — the CSS grid spacer technique for combining sticky headers with full-height hero sections without breaking either.
