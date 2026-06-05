# Split screen

> The viewport is divided into two adjacent panels — typically content on one side, media on the other — that read as a single composition with two simultaneous entry points.

**Bucket:** layout
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, apps (auth/onboarding screens), landing pages

## What it is
The page is split into two vertical panels that sit side by side, each holding a coherent half of the message: usually copy/UI on one side and an image, video, or color field on the other. The eye is offered two simultaneous focal points rather than one centered column, which reads as "here are two things at once" — a product and its visual, a question and an answer, option A and option B. A common refinement keeps one panel **sticky** (pinned in place) while the other scrolls past it, so a fixed image anchors a sequence of scrolling content (or vice versa). On narrow screens the two panels **stack** into a single column, and the stacking order is a deliberate design decision, not an accident of source order.

## When to use
- **Duality / comparison content** — before/after, free vs paid, two personas, two product lines. Two panels make the "two-ness" structural instead of just stated.
- **Two-entry-point landing pages** — "I'm a designer" / "I'm a developer", "Shop men" / "Shop women". The split gives each audience an equal, immediate doorway with no scanning required.
- **Content + supporting media** where the media should stay visible while you read — a sticky product render on the left while specs scroll on the right (sticky media is the natural home for an F-pattern read: the reader scans the text column top-down while the image stays parked).
- **Auth / onboarding app screens** — form on one side, brand image or value prop on the other. A near-universal pattern for sign-up/login because it fills dead space beside a narrow form.
- **Portfolio index** — a sticky title/intro panel beside a scrolling list of projects.

## When NOT to use
- **Text-dense reading** that needs full measure — splitting the viewport caps each column's line length and, with a tall media panel beside it, invites the "boredom trap": a rigid 50/50 that looks identical on every section and stops rewarding the scroll. Vary it or drop it.
- **Long forms or dashboards** where you need horizontal room — two panels halve your working width on every breakpoint above mobile.
- **When there is no genuine duality.** A split with arbitrary content on each side (just because the space was there) reads as filler; centered or asymmetric layouts carry single-focus messages better.
- **Everyone overuses this for** the SaaS "hero: headline + CTA on the left, generic product screenshot on the right" — when it's a rigid 50/50 with a stock UI mockup and the same split repeats down the page, it's wallpaper. Break the symmetry (weight the split 60/40, let the media bleed off-edge, or make only the hero a split and switch layout below).

## How it works
The mechanism is just a two-track layout container. Modern best-first:

1. **CSS Grid** — `grid-template-columns: 1fr 1fr` (50/50) or any weighted ratio (`1.2fr 1fr`, `minmax(0, 40rem) 1fr`). Grid is the right tool because it lets either panel be the sticky one regardless of source order, and `min-height: 100vh`/`100dvh` makes each panel fill the screen.
- **Sticky panel gotcha:** inside a grid, items default to `align-items: stretch`, so a `position: sticky` child is already stretched to the full column height and *never appears to move*. You must set `align-self: start` (or `align-items: start` on the grid) on the sticky panel so it takes its natural height and can stick. This is the single most common reason "my sticky side doesn't stick."
2. **Responsive collapse** — switch `grid-template-columns` to `1fr` at a breakpoint, or better, use a **container query** (`@container (min-width: …)`) so the component restacks based on its own width, not the viewport. The **stacking order** is controlled separately from source order via `order` or `grid-row` — critical so the screen reader / keyboard order stays logical (see Accessibility).
3. **`scroll-state(stuck:)` container query** (2025+, progressive enhancement) — lets you restyle the sticky panel *when it actually becomes stuck* to an edge, with zero JS. Support is still limited (Chromium 2025+, not yet Firefox/Safari at time of writing), so treat it as an enhancement on top of plain `position: sticky`.

## Working code

### Vanilla HTML + CSS — weighted split, sticky media, responsive stacking
Complete, runnable document. Content scrolls; the media panel is pinned. Below 48rem it collapses to one column with media first.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Split screen — sticky media</title>
<style>
  :root {
    --ink: #14110f;          /* near-black warm */
    --paper: #f6f3ee;        /* warm off-white */
    --rust: #b4471f;         /* committed brand hue */
    --rust-ink: #fff7f2;     /* text on rust */
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Iowan Old Style", Georgia, serif;
         color: var(--ink); background: var(--paper); }

  .split {
    display: grid;
    grid-template-columns: 1fr;          /* mobile default: one column */
  }
  /* Stacking order on mobile: media FIRST, then content */
  .split > .media { order: 1; }
  .split > .content { order: 2; }

  @media (min-width: 48rem) {
    .split {
      grid-template-columns: 0.85fr 1fr;  /* weighted: media a touch narrower */
      align-items: start;                 /* REQUIRED so sticky child isn't stretched */
    }
    .split > .media   { order: 0; }       /* reset; let source order rule */
    .split > .content { order: 0; }
    .media {
      position: sticky;
      top: 0;
      height: 100dvh;
    }
  }

  .media {
    display: grid; place-items: center;
    min-height: 60vh;
    background:
      radial-gradient(120% 90% at 30% 20%, #d4612f 0%, var(--rust) 55%, #7e2e12 100%);
    color: var(--rust-ink);
    padding: 2rem;
  }
  .media h2 {
    font-family: "Iowan Old Style", Georgia, serif;
    font-weight: 700; font-size: clamp(1.6rem, 3vw, 2.6rem);
    line-height: 1.05; max-width: 16ch; margin: 0; letter-spacing: -0.01em;
  }

  .content { padding: clamp(1.5rem, 5vw, 5rem); }
  .content section { min-height: 88vh; max-width: 38ch; }
  .content h3 { font-size: clamp(1.3rem, 2.4vw, 1.9rem); margin: 0 0 .5rem;
                letter-spacing: -0.01em; }
  .content p { font-size: 1.075rem; line-height: 1.65; color: #2c2622; }
  .kicker { font: 600 0.8rem/1 ui-monospace, "SF Mono", Menlo, monospace;
            letter-spacing: 0.14em; text-transform: uppercase; color: var(--rust); }
</style></head>
<body>
  <main class="split">
    <aside class="media">
      <h2>One image, held still while the argument unfolds beside it.</h2>
    </aside>
    <div class="content">
      <section>
        <p class="kicker">01 — Origin</p>
        <h3>The sticky side anchors the read.</h3>
        <p>Because the media stays parked, the eye keeps returning to it as
           the text column scrolls — an F-pattern scan against a fixed reference.</p>
      </section>
      <section>
        <p class="kicker">02 — Method</p>
        <h3>Weighted, not rigidly halved.</h3>
        <p>An 0.85fr / 1fr split breaks the metronome of a perfect 50/50 and
           gives the reading column a comfortable measure.</p>
      </section>
      <section>
        <p class="kicker">03 — Result</p>
        <h3>It collapses gracefully.</h3>
        <p>Below 48rem the panels stack with the media on top, so small screens
           still lead with the image before the copy.</p>
      </section>
    </div>
  </main>
</body></html>
```

Contrast note for this file's actual pairs (sRGB WCAG 2.x, computed for these hex values):
- Body copy `#2c2622` on `#f6f3ee` ≈ **12.0:1** — passes AAA.
- `.kicker` rust `#b4471f` on `#f6f3ee` ≈ **4.78:1** — passes AA for normal text.
- Media heading `#fff7f2` on the rust mid-stop `#b4471f` ≈ **4.85:1** — passes AA (the gradient's darkest stop `#7e2e12` raises it further; the lightest stop `#d4612f` against `#fff7f2` is ≈ 3.2:1, which still clears AA for the large ≥24px heading).

### `scroll-state(stuck:)` enhancement (progressive, no JS)
Restyle the media heading the moment the panel becomes stuck to the top. Drop this in on top of the code above; browsers without support simply ignore it.

```css
@media (min-width: 48rem) {
  .media {
    container-type: scroll-state;
    container-name: mediapanel;
  }
}
@container mediapanel scroll-state(stuck: top) {
  .media h2 { opacity: 0.0; transition: opacity .4s ease; } /* fade title once pinned */
}
```
Support is limited as of 2026 (Chromium-only; not Firefox/Safari yet), so never gate meaning on it — it is decoration over a sticky panel that already works.

### React + Tailwind — two-entry-point split (no sticky)
Equal doorways; stacks to one column below the `md` breakpoint.

```jsx
// Tailwind v3+. Two equal entry panels.
export function SplitEntry() {
  const panels = [
    { id: "design", label: "For designers", bg: "bg-stone-900 text-stone-50",
      blurb: "Components, tokens, and a real type scale." },
    { id: "dev", label: "For developers", bg: "bg-orange-700 text-orange-50",
      blurb: "Typed APIs, zero-runtime CSS, copy-paste snippets." },
  ];
  return (
    <main className="grid min-h-[100dvh] grid-cols-1 md:grid-cols-2">
      {panels.map((p) => (
        <a
          key={p.id}
          href={`#${p.id}`}
          className={`group flex min-h-[50dvh] flex-col justify-end gap-3 p-8
                      md:min-h-[100dvh] md:p-12 ${p.bg}
                      outline-offset-[-3px] focus-visible:outline focus-visible:outline-2
                      focus-visible:outline-white transition-[flex-grow]`}
        >
          <span className="font-mono text-xs uppercase tracking-[0.16em] opacity-80">
            Enter
          </span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {p.label}
          </h2>
          <p className="max-w-[32ch] text-base/relaxed opacity-90
                        translate-y-1 opacity-0 transition group-hover:translate-y-0
                        group-hover:opacity-90 motion-reduce:translate-y-0 motion-reduce:opacity-90">
            {p.blurb}
          </p>
        </a>
      ))}
    </main>
  );
}
```

## Variations
- **Ratio knob:** 50/50 (max symmetry/comparison) → weighted 60/40, 65/35 (clear primary/secondary) → 70/30 (reads as "content with a media rail").
- **Sticky knob:** neither sticky (both scroll together) → media sticky, content scrolls (most common) → content sticky, media scrolls (gallery/lookbook) → **alternating** sticky (left sticky for section A, right sticky for section B as you scroll — the "swap" effect).
- **Bleed knob:** contained panels vs full-bleed media that runs edge-to-edge with no padding (more cinematic, the boredom-breaker).
- **Count knob:** the rare **3- or 4-way split** for storytelling / category index (higher cognitive load, use sparingly).
- **Divider knob:** hard seam, thin rule, gap/gutter, or an interactive draggable divider (before/after image comparison).

## Accessibility
- **Reading & tab order vs visual order:** keyboard/tab order and screen-reader order follow **DOM source order**, not visual columns or `order`/`grid-row`. If you use `order` to put the media first visually on mobile but keep content first in the DOM (as in the vanilla example, where `.media` precedes `.content` in source so it's also first for AT), confirm the announced sequence is the one you intend. Never reorder with `order` in a way that makes the keyboard focus jump erratically across panels.
- **Two-entry-point panels** should be real links/buttons with discernible accessible names ("For designers", not just "Enter"), reachable and operable by keyboard, with a visible focus ring (the Tailwind example uses `focus-visible:outline`).
- **Sticky panel + zoom/reflow:** WCAG 1.4.10 Reflow requires content to work at 320px-equivalent width without horizontal scroll. A `position: sticky` panel set to `100dvh` can cover content at 400% zoom — the layout must collapse to one column (and drop the sticky) before that point. The media query at `48rem` handles this by removing the sticky and stacking.
- **Screen-reader implications:** a split is purely visual; don't rely on left/right to convey meaning ("the option on the left"). Give each panel a heading or `aria-label` so its purpose survives linearization.
- **prefers-reduced-motion:** the React example's hover reveal is guarded with `motion-reduce:` utilities; any sticky-swap or scroll-driven transition must also degrade to a static layout under reduced-motion.

## Performance
- `position: sticky` is cheap (compositor-handled) and far better than a JS scroll listener that repositions on every frame. Prefer it.
- Watch the sticky panel's **paint area**: a full-height gradient or large image that repaints on scroll can cost. Keep the media panel a static background/image so it's not re-rastered — `position: sticky` moves the layer, it shouldn't repaint.
- Big media: serve responsive `srcset`/`<picture>`, lazy-load below-the-fold panels, and consider `content-visibility: auto` on off-screen scrolling sections to skip their layout/paint until needed.
- Avoid layout thrash from animating `width`/`height` on the panels (e.g. a "expand on hover" entry split) — animate `transform`/`flex-grow` or use `grid-template-columns` transitions sparingly; never animate properties that trigger reflow of the other panel mid-scroll.
- `100dvh` (dynamic viewport height) avoids the mobile-URL-bar jump that `100vh` causes; use it for full-height panels.

## Anti-slop
Cliché (see `_slop-blocklist.md` → LAYOUT): the rigid 50/50 SaaS hero — **headline + CTA on the left, a generic floating product screenshot on the right** — repeated as the same metronomic split down the whole page. It's the layout cousin of "hero + three identical icon-title-blurb cards": symmetrical, default, and instantly readable as templated. Tasteful fixes: (1) weight the split (0.85fr/1fr, 60/40) so it isn't a mirror; (2) let the media **bleed off-edge** or run full-height-sticky instead of floating in a padded box; (3) use the split for **one** section that earns it (real duality or a sticky reference image) and switch to an asymmetric/editorial layout below, rather than repeating the split; (4) replace the stock UI mockup with real, specific imagery or a typographic media panel. Pair this with committing to a single brand hue plus one accent (here: warm rust on warm paper) instead of the indigo-to-pink gradient default.

## Pairs well with
- `sticky-pinning` — the mechanism behind the pinned panel; same `position: sticky` discipline (reset `align-self: start` in grid).
- `asymmetric-layouts` — weighting the split (60/40) is itself a move toward asymmetry; use it to dodge the 50/50 boredom trap.
- `full-bleed` — let the media panel run edge-to-edge for a cinematic half.
- `editorial-typographic` skin — a typographic media panel (big display type as the "image") is a fresh alternative to a stock screenshot.
- `text-reveal-on-scroll` — apply to the scrolling content column while the media stays pinned (the classic scrollytelling split).

## Current references
- [Using Position Sticky With CSS Grid — Ahmad Shadeed](https://ishadeed.com/article/position-sticky-css-grid/) — the definitive explainer on the `align-self: start` grid-stretch gotcha that breaks sticky panels.
- [MDN — Using container scroll-state queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Conditional_rules/Container_scroll-state_queries) — `scroll-state(stuck:)` syntax, the `@supports` fallback, and honest support caveats.
- [MDN — Basic concepts of grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Basic_concepts) — `grid-template-columns`, `fr`, `minmax()` for weighted splits.
- [Defensive CSS — Position sticky with CSS Grid](https://defensivecss.dev/tip/position-sticky-grid/) — short, copy-pasteable reminder of the stretch fix.
- [CSS-Tricks — How to Get Sticky and Full-Bleed Elements to Play Well Together](https://css-tricks.com/how-to-get-sticky-and-full-bleed-elements-to-play-well-together/) — for the full-bleed media-panel variation.
- [SuperHi — How to Make a Split Screen Site with Sticky Sides](https://www.superhi.com/library/posts/how-to-make-a-split-screen-site-with-sticky-sides) — walkthrough of the sticky-one-side split pattern.
- [Awwwards — Split Screen Sticky Scrolling Layout](https://www.awwwards.com/inspiration/split-screen-sticky-scrolling-layout-squarekicker-2) — production examples of the pinned-panel split in the wild.
