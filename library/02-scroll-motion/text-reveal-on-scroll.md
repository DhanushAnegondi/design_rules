# Text reveal on scroll

> Words, lines, or characters animate into view as the reader scrolls to them — masking up, fading in sequence, or filling with color line by line.

**Bucket:** scroll/motion
**Maturity:** current
**Effort:** medium
**Best for:** websites, portfolios, agency/editorial sites, long-form storytelling

## What it is
As a block of text enters the viewport (or as the user scrolls through a pinned
section), its sub-parts reveal progressively rather than all at once. Three common
flavours: (1) **mask-up** — each line slides up from behind a clipping edge;
(2) **stagger fade** — words/lines fade and rise in sequence; (3) **scrub fill** —
text starts dim and fills to full color tied directly to scroll position. Flavour 3
is *scroll-linked* (reverses when you scroll back); 1 and 2 are usually
*scroll-triggered* (fire once on entry).

## When to use
- Hero headlines and section intros on editorial/agency/portfolio sites.
- Long-form "scrollytelling" where pacing the reading is the point.
- A single focal statement you want to land with weight.

## When NOT to use
- Body paragraphs the user needs to *read fast* — staggering reading text is
  hostile; reserve it for short display lines.
- Above-the-fold content that must be readable instantly for SEO/perceived speed
  (animate it in fast, or render visible and only animate on re-entry).
- Anything where the text must be selectable/copyable mid-animation (splitting into
  per-char spans can harm selection and screen-reader flow — see Accessibility).
- When `prefers-reduced-motion` is set — must fall back to plain visible text.

## How it works
You split the text into animatable units (lines or words), wrap each in an element,
and animate `transform`/`opacity` either on intersection (trigger) or against a
scroll progress value (scrub). Modern options, best-first:

1. **Native CSS scroll-driven animations** — `animation-timeline: view()` ties an
   animation to an element's progress through the viewport, no JS. Great for simple
   reveals; support is Chromium + recent Firefox/Safari is partial, so progressive-
   enhance.
2. **GSAP + ScrollTrigger + SplitText** — the production standard for line/char
   splitting and scrub control. Most robust cross-browser.
3. **Framer Motion** — `useScroll` + `useTransform` for React; clean for word/line
   stagger tied to scroll progress.

## Working code

### Native CSS (trigger, no JS) — mask-up lines
```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<style>
  body { margin:0; font-family: system-ui, sans-serif; background:#0e0e12; color:#f4f4f8; }
  .spacer { height: 90vh; }
  .reveal { max-width: 18ch; margin: 0 auto; font-size: clamp(2rem,6vw,4.5rem);
            font-weight: 700; line-height: 1.05; }
  .reveal .line { display: block; overflow: hidden; }
  .reveal .line > span {
    display: block;
    transform: translateY(110%);
    animation: rise linear forwards;
    animation-timeline: view();
    animation-range: entry 10% cover 35%;
  }
  @keyframes rise { to { transform: translateY(0); } }
  @media (prefers-reduced-motion: reduce) {
    .reveal .line > span { transform: none; animation: none; }
  }
</style></head>
<body>
  <div class="spacer"></div>
  <h1 class="reveal">
    <span class="line"><span>We build</span></span>
    <span class="line"><span>things that</span></span>
    <span class="line"><span>move you.</span></span>
  </h1>
  <div class="spacer"></div>
</body></html>
```

### GSAP (scrub fill, production) — word-by-word color fill
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script>
gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = document.querySelector('#copy');

// split into word spans (cheap manual split; GSAP SplitText is the paid robust option)
el.innerHTML = el.textContent.trim().split(/\s+/)
  .map(w => `<span class="w">${w}</span>`).join(' ');

if (!reduce) {
  gsap.set('.w', { opacity: 0.18 });
  gsap.to('.w', {
    opacity: 1,
    stagger: 0.15,
    ease: 'none',
    scrollTrigger: {
      trigger: '#copy',
      start: 'top 80%',
      end: 'bottom 55%',
      scrub: true,          // ties progress to scroll, reverses on scroll-up
    }
  });
}
</script>
```

### Framer Motion (React) — line stagger on enter
```jsx
import { motion } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const line = {
  hidden: { y: "110%" },
  show:   { y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export function RevealHeading({ lines }) {
  return (
    <motion.h1 variants={container} initial="hidden"
      whileInView="show" viewport={{ once: true, margin: "-15%" }}>
      {lines.map((t, i) => (
        <span key={i} style={{ display: "block", overflow: "hidden" }}>
          <motion.span style={{ display: "block" }} variants={line}>{t}</motion.span>
        </span>
      ))}
    </motion.h1>
  );
}
```
Framer Motion automatically reduces motion when the user's OS setting is on if you
use its `useReducedMotion()` hook to swap variants; for the above, guard with it.

## Variations
- **Unit**: line vs word vs character (finer = more dramatic, worse for a11y/perf).
- **Trigger vs scrub**: fire-once on entry vs tied to scroll progress (reversible).
- **Motion**: mask-up (clip + translate), fade-rise, blur-in, color/opacity fill,
  letter-spacing settle.
- **Easing**: a custom cubic-bezier like `[0.16,1,0.3,1]` (expo-out) reads far more
  premium than default `ease`.

## Accessibility
- **prefers-reduced-motion**: mandatory. Render text fully visible and skip the
  transform/stagger. Every snippet above does this.
- **Screen readers / selection**: splitting into per-word/char spans can fragment
  the accessible name and break text selection. Keep the original text as the
  element's content where possible, or add `aria-label` with the full string on the
  wrapper and `aria-hidden` on the split spans.
- **Don't gate meaning on motion**: text must be present in the DOM and readable
  even if JS fails — animate from a visible baseline, not from `display:none`.
- **Contrast**: dim "pre-reveal" states (e.g. opacity 0.18) can fail contrast while
  visible mid-scroll; that's acceptable for decorative scrub fill but never for the
  resting state.

## Performance
- Animate only `transform` and `opacity` (GPU-friendly, no layout/paint thrash).
- Per-character splitting on long copy creates hundreds of nodes — cap it to short
  display lines; use words or lines for anything longer.
- `will-change: transform` on the moving span helps but use sparingly.
- For scrub, `scrub: true` (or a small number to smooth) avoids janky 1:1 coupling.

## Anti-slop
Cliché (see `_slop-blocklist.md` → Motion): *every* text block fading-and-rising
with identical duration and default easing. Tasteful version: reserve the reveal for
one or two focal headlines, give it expo/spring easing, vary the unit (mask whole
lines rather than peppering word fades everywhere), and let body copy simply appear.

## Pairs well with
- `sticky-pinning` (pin a section, scrub the text fill as it holds)
- `editorial-typographic` style (big display type is what makes reveals land)
- `scroll-progress-indicator` (orient the reader during long pinned reveals)
- `staggered-entrance` (same easing language across the page)

## Current references
- [MDN — CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline) — `view()`/`scroll()` timelines, support table
- [web.dev — Scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations) — native CSS approach with examples
- [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) — scrub, pin, start/end syntax
- [Framer Motion — scroll animations](https://www.framer.com/motion/scroll-animations/) — useScroll/whileInView
- [Codrops — text & scroll demos](https://tympanus.net/codrops/) — forkable reveal effects
