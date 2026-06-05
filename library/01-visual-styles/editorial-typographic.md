# Editorial / typographic

> Type is the interface: oversized display lettering, an asymmetric grid, generous whitespace, and a restrained 1–2 color palette pace the page like a printed magazine.

**Bucket:** visual style
**Maturity:** evergreen (cycling-back hard in 2024–2026 as a reaction to template SaaS)
**Effort:** medium
**Best for:** websites, portfolios, agency/studio sites, long-form articles, product launch pages

## What it is
An editorial/typographic style makes the *words themselves* the dominant visual element instead of decorating them with cards, gradients, and imagery. A huge display headline (a high-contrast serif like Fraunces or Instrument Serif, or an opinionated grotesk like General Sans / Geist) anchors the screen; everything else is set in a small number of sizes from a deliberate modular scale, aligned to an asymmetric column grid with one or two hairline rules. The reader perceives confidence and pacing — like turning the spread of a well-art-directed magazine — because hierarchy is carried by *scale, weight, and whitespace* rather than by boxes and color.

## When to use
- A hero or launch page where you have one strong sentence and want it to *land* (it pairs naturally with a scroll text-reveal).
- Portfolios and agency/studio sites that need to signal taste in the first 400ms.
- Long-form articles, essays, and case studies where reading rhythm matters.
- Brand or manifesto pages with little real product UI to show.
- When you have strong copy and a real typeface budget but limited custom imagery.

## When NOT to use
- Dense, data-heavy apps and dashboards — editorial whitespace fights information density and forces excessive scrolling.
- Conversion flows that must be scannable fast (checkout, settings, onboarding forms): oversized type and asymmetry slow task completion.
- Anywhere you can't license/load a characterful display face — editorial set in Inter/Arial collapses into generic and is a top AI tell (see Anti-slop).
- Tiny viewports without care: a `clamp()` floor that's too aggressive can blow a 6-word headline into 5 lines on a phone.
- The overuse warning: **everyone reaches for "giant serif headline + one line of muted subtext, dead-centered, equal padding"** as an instant-class move. Centered-everything is the lazy version; real editorial earns its drama through *asymmetry and varied rhythm*, not a single big centered word.

## How it works
The mechanism is a **type system plus a grid**, not an effect:

1. **A modular type scale.** Pick a ratio and generate sizes from a base. A Perfect Fourth (1.333) from a 1rem base gives 1 → 1.333 → 1.777 → 2.369 → 3.157 → 4.209 → 5.61 rem. Display sizes get a *much* tighter `line-height` (1.0–1.08) than body (1.5–1.65). Deliberate weight contrast (e.g. 300 body vs 600/700 display, or an italic optical-size cut) does the rest.
2. **Fluid sizing with `clamp()`** so the display step scales smoothly between a phone floor and a desktop cap without media-query jumps: `clamp(2.5rem, 1rem + 6vw, 5.61rem)`. Keep a non-`vw` term in the middle (`calc(16px + 1vw)` style) so OS zoom still works — pure `vw` typography breaks WCAG 1.4.4 resize-to-200%.
3. **An asymmetric grid.** A named-line CSS Grid (e.g. a 12-track grid) lets headlines span an off-center range, body sit in a narrow measure (60–72ch), and captions hang in the margin. Whitespace is *designed*, not residual.
4. **Hairline rules and a measure.** 1px rules (`border-top: 1px solid`) and small-caps/mono labels evoke the magazine masthead. Body text is capped at a comfortable line length with `max-width: 66ch`.
5. **Headline wrapping.** `text-wrap: balance` evens out ragged headline lines (Chromium/Firefox/Safari ship it; limited to ~6 lines in Chromium, ~10 in Firefox). `text-wrap: pretty` fixes orphans in body copy (Chromium/Safari).

Key properties/APIs: `clamp()`, CSS Grid named lines, `text-wrap: balance` / `pretty`, `font-feature-settings`/`font-variation-settings` for optical sizes and small caps, `ch` units for measure, `letter-spacing` for display tracking.

## Working code

### Vanilla HTML/CSS — complete, runnable editorial hero + article
Open this file directly in a browser. Two real fonts loaded from Google Fonts (Fraunces display serif + a system-grotesk fallback stack), a restrained ink-on-paper palette (`#15110c` ink on `#f4f0e8` paper, plus one rust accent `#9c3d1e`), an asymmetric 12-column grid, and a hairline masthead.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Editorial — type as hero</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&display=swap" rel="stylesheet">
<style>
  :root {
    /* Palette — ink on warm paper + ONE accent. No gradient, no SaaS blue. */
    --paper:  #f4f0e8;
    --ink:    #15110c;   /* on --paper => contrast ratio 15.6:1 (AAA) */
    --muted:  #5b5346;   /* on --paper => 6.0:1 (AA, AAA for large)   */
    --accent: #9c3d1e;   /* on --paper => 6.2:1 (AA)                  */
    --rule:   #d8d0c2;

    /* Modular scale — Perfect Fourth (1.333) from 1rem base */
    --t-0: 1rem;        /* 16px body            */
    --t-1: 1.333rem;    /* 21.3px lead          */
    --t-2: 1.777rem;    /* 28.4px h3            */
    --t-3: 2.369rem;    /* 37.9px h2            */
    --t-5: 4.209rem;    /* 67.3px desktop cap   */
  }

  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: ui-sans-serif, "Helvetica Neue", Arial, system-ui, sans-serif;
    font-size: var(--t-0);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* Asymmetric 12-column grid with breathing margins */
  .grid {
    display: grid;
    grid-template-columns:
      [full-start] minmax(1.5rem, 1fr)
      [content-start] repeat(12, minmax(0, 5rem))
      [content-end] minmax(1.5rem, 1fr) [full-end];
    column-gap: 1.5rem;
    max-width: 1400px;
    margin-inline: auto;
  }

  /* Masthead — hairline rule + mono label, magazine cue */
  .masthead {
    grid-column: content-start / content-end;
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 1.25rem 0;
    border-bottom: 1px solid var(--rule);
    font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
    font-size: 0.78rem; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--muted);
  }
  .masthead b { color: var(--ink); }

  /* Hero — headline spans an OFF-CENTER range, not the full width */
  .hero { padding-block: clamp(3rem, 8vh, 7rem); }
  .kicker {
    grid-column: content-start / span 12;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 0.8rem; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--accent); margin: 0 0 1rem;
  }
  .display {
    grid-column: content-start / span 10;  /* asymmetric: stops short of right edge */
    margin: 0;
    font-family: "Fraunces", Georgia, "Times New Roman", serif;
    /* Fluid: floor 2.5rem, mid keeps a rem term so zoom works, cap = scale step */
    font-size: clamp(2.5rem, 1rem + 6vw, var(--t-5));
    font-weight: 600;
    line-height: 1.02;
    letter-spacing: -0.015em;
    text-wrap: balance;     /* even the rag on the headline */
    font-optical-sizing: auto;
  }
  .display em {
    font-style: italic; font-weight: 400; color: var(--accent);
  }
  .standfirst {
    grid-column: 8 / content-end;  /* hangs to the RIGHT, under the headline's tail */
    margin: 1.75rem 0 0;
    max-width: 34ch;
    font-size: var(--t-1);
    line-height: 1.45;
    color: var(--muted);
    text-wrap: pretty;
  }

  /* Article body — narrow measure, generous lead, drop-style first line */
  .article { padding-block: clamp(2rem, 6vh, 5rem); }
  .article > * { grid-column: content-start / span 7; }   /* off-center column */
  .article h2 {
    font-family: "Fraunces", Georgia, serif;
    font-weight: 600; font-size: var(--t-3); line-height: 1.08;
    letter-spacing: -0.01em; margin: 2.5rem 0 0.75rem; text-wrap: balance;
  }
  .article p { max-width: 66ch; margin: 0 0 1.1rem; text-wrap: pretty; }
  .article p.lead::first-line { font-variant-caps: small-caps; letter-spacing: 0.02em; }
  .article p.lead::first-letter {
    font-family: "Fraunces", Georgia, serif;
    float: left; font-size: 3.6em; line-height: 0.8;
    padding: 0.06em 0.1em 0 0; color: var(--accent);
  }
  /* Marginal note hanging in the wide gutter on large screens */
  .note {
    grid-column: 9 / content-end;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 0.78rem; color: var(--muted);
    border-top: 1px solid var(--rule); padding-top: 0.5rem; margin-top: 0;
  }

  /* On phones, collapse the asymmetry to a single readable column */
  @media (max-width: 720px) {
    .display, .standfirst, .article > *, .kicker, .note {
      grid-column: content-start / content-end;
    }
    .standfirst { max-width: none; }
  }
</style>
</head>
<body>
  <header class="grid">
    <div class="masthead">
      <span><b>FIELD NOTES</b> — Issue 04</span>
      <span>Spring 2026</span>
    </div>
  </header>

  <section class="grid hero">
    <p class="kicker">Typography / Craft</p>
    <h1 class="display">The page is mostly empty.<br>That is the <em>whole point.</em></h1>
    <p class="standfirst">
      White space is not leftover room. It is the loudest element on the page —
      the silence that lets one true sentence ring.
    </p>
  </section>

  <article class="grid article">
    <h2>Set the type, then get out of the way</h2>
    <p class="lead">
      Editorial layout begins with a scale and a measure. Choose a ratio,
      generate your sizes, cap your line length near sixty-six characters,
      and resist the urge to fill the margin. The restraint is the design.
    </p>
    <p class="note">A modular scale keeps every size in proportion — no arbitrary 19px headings.</p>
    <p>
      A single accent does the work a rainbow cannot: it marks the one thing
      worth noticing on a spread. Used twice, it loses its meaning; used once
      per screen, it directs the eye like a conductor's cue.
    </p>
  </article>
</body>
</html>
```

### React + Tailwind — same system as tokens
Tailwind v4's `@theme` lets you register the modular scale and palette as real design tokens, then compose the asymmetric grid with arbitrary `grid-column` values. Load Fraunces via `next/font` (or a `<link>`) so there's no layout shift.

```tsx
// globals.css (Tailwind v4)
// @import "tailwindcss";
// @theme {
//   --color-paper: #f4f0e8;
//   --color-ink:   #15110c;   /* 15.6:1 on paper — AAA */
//   --color-muted: #5b5346;   /* 6.0:1  on paper — AA  */
//   --color-rust:  #9c3d1e;   /* 6.2:1  on paper — AA  */
//   --font-display: "Fraunces", Georgia, serif;
//   --text-display: clamp(2.5rem, 1rem + 6vw, 4.209rem);
//   --text-lead:    1.333rem;
// }

export function EditorialHero() {
  return (
    <section className="bg-paper text-ink">
      <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-x-6 px-6 py-[clamp(3rem,8vh,7rem)]">
        <p className="col-span-12 mb-4 font-mono text-xs uppercase tracking-[0.16em] text-rust">
          Typography / Craft
        </p>
        {/* Headline spans 10 of 12 cols — asymmetric, stops short of the right edge */}
        <h1
          className="col-span-12 m-0 font-display font-semibold leading-[1.02] tracking-[-0.015em] md:col-span-10"
          style={{ fontSize: "var(--text-display)", textWrap: "balance" }}
        >
          The page is mostly empty.{" "}
          <em className="font-normal not-italic text-rust italic">That is the whole point.</em>
        </h1>
        {/* Standfirst hangs to the right, narrow measure */}
        <p
          className="col-span-12 mt-7 max-w-[34ch] text-muted md:col-start-8 md:col-end-13"
          style={{ fontSize: "var(--text-lead)", lineHeight: 1.45, textWrap: "pretty" }}
        >
          White space is not leftover room. It is the loudest element on the page.
        </p>
      </div>
    </section>
  );
}
```

## Variations
- **Display voice (the knob: typeface contrast).** *Modern-serif editorial* (Fraunces, Instrument Serif — high stroke contrast, elegant) vs *grotesk editorial* (General Sans, Geist, Söhne — confident, neutral, Swiss). Same grid, very different temperature.
- **Density (knob: whitespace ratio).** *Airy manifesto* (one statement per screen, huge margins) vs *dense magazine* (multi-column body, marginalia, pull quotes — closer to a printed feature).
- **Alignment (knob: where the axis sits).** *Centered classical* (use sparingly), *left-flush brutalist-leaning*, or *true asymmetric* (offset columns, hanging captions) — the most "designed"-looking and the antidote to slop.
- **Palette (knob: accent count).** Strict monochrome (ink + paper only), one-accent (the default here), or duotone (two ink colors, e.g. near-black + oxblood) for section coding.
- **Rules & grid visibility.** Hidden grid vs visible hairline column rules / a printed-baseline look that shows the structure as ornament.

## Accessibility
- **prefers-reduced-motion:** the static style itself is fine, but editorial pages almost always ride with a text-reveal on the headline. Gate any transform/stagger behind `@media (prefers-reduced-motion: no-preference)` and render the headline fully visible by default, so a reduced-motion user (and a no-JS user) reads the same words instantly.
- **Zoom / `vw` trap:** never size text with pure `vw`. Keep a rem/px term in the `clamp()` middle (`1rem + 6vw`) so text still scales to WCAG 1.4.4's required 200% on browser zoom. Test at 200% — headlines must reflow, not clip.
- **Contrast (verified for the palette above):** ink `#15110c` on paper `#f4f0e8` ≈ 15.6:1 (AAA for all text); muted `#5b5346` ≈ 6.0:1 (AA normal, AAA large); rust accent `#9c3d1e` ≈ 6.2:1 (AA). Do not push "muted" text lighter for vibe — the #1 way editorial designs fail audits is grey-on-cream standfirsts below 4.5:1. The decorative drop-cap meets contrast here, but never rely on color alone to convey meaning.
- **Heading order:** giant type is still semantic. Keep one `<h1>`, then `<h2>`/`<h3>` in order; don't pick a tag for size — size comes from the scale, not the element.
- **Measure & reading:** capping body at ~66ch (45–75ch range) is an a11y win, not just taste — it reduces line-tracking effort for low-vision and dyslexic readers.
- **Drop caps & small caps:** `::first-letter` is announced normally by screen readers (it's the same text node). `font-variant-caps: small-caps` keeps real lowercase text in the DOM (unlike `text-transform: uppercase`, which can cause some SRs to spell out words) — prefer it for the small-caps look.
- **Touch/pointer:** masthead/nav links and any accent CTAs need ≥44×44px hit targets even though the visual label is small mono text — pad the target, don't shrink the tap area to the glyph.

## Performance
- **Fonts are the cost.** A display serif with multiple weights/italics is the heaviest part of an editorial page. Subset to the glyphs you use, prefer variable fonts (one file flexes weight + optical size via `font-variation-settings`), `preconnect` to the font host, and use `font-display: swap` (or `optional`) to avoid invisible text. Self-host or preload the one face used above the fold.
- **CLS:** size-adjust / `font-size-adjust` and a metrics-matched fallback (`size-adjust` in an `@font-face`) prevent the headline reflow jump when the web font loads. `next/font` does this automatically.
- **`text-wrap: pretty` cost:** it runs a slower line-breaking algorithm; it's fine on short headings and a few paragraphs but don't blanket it across thousands of body lines. `balance` is capped to a handful of lines by the engines, so it's cheap on headlines.
- **No GPU/backdrop cost.** Unlike glassmorphism or aurora styles, pure editorial uses no `backdrop-filter`, no large blurs, no stacked translucent layers — repaints are trivial. The whole budget is type loading and layout, which makes this one of the cheapest premium-looking styles to ship.
- **Grid layout thrash:** named-line grids are static; avoid animating `grid-template-columns` (it triggers layout). Animate `transform`/`opacity` on children instead.

## Anti-slop
- **TYPE (the big one):** the slop version sets the whole "editorial" page in **Inter/Roboto/Arial at one weight** and calls a 32px heading "display." That's the #1 generated-design tell. Fix: commit to a characterful display cut (Fraunces, Instrument Serif, General Sans, Satoshi, Geist) and create *real* contrast — e.g. 600-weight serif display against 300/400 body, plus a mono accent for labels. One weight and one size is not a hierarchy.
- **LAYOUT:** the cliché is **one giant word dead-center, equal padding all around, a single muted subtitle** — instant-class, zero composition. Fix: move the axis off-center, let the headline span 10 of 12 columns and stop short of the edge, hang the standfirst to the right, drop a marginal note in the gutter. Vary the rhythm; full-bleed one moment, narrow measure the next.
- **COLOR:** dropping the AI-default **purple/indigo→pink gradient** or **SaaS blue `#3B82F6`** behind editorial type instantly cheapens it. Fix: commit to ink-on-paper (a real warm neutral ramp, not `#fff`/`#000`) plus exactly one sharp accent used once per screen — here `#9c3d1e` rust at a verified 6.2:1.
- **SURFACE:** wrapping editorial copy in **soft-drop-shadow cards** turns a magazine spread back into a SaaS dashboard. Fix: separate sections with whitespace and 1px hairline rules, not boxes and shadows.
- **COPY:** **"Empower / Seamless / Elevate / Unlock"** headlines plus lorem ipsum kill the whole conceit, because in editorial the *words are the design*. Fix: write one specific, concrete, true sentence — editorial only works if the copy can carry a 67px headline.
- **Meta-rule:** slop is grabbing every bucket's default at once. Editorial done right deliberately breaks the type, layout, and color defaults — that's most of what separates "art-directed" from "generated." See `_slop-blocklist.md` (TYPE, LAYOUT, COLOR, SURFACE, COPY).

## Pairs well with
- `text-reveal-on-scroll` — mask-up or scrub-fill on the giant headline is exactly what makes the big type *land*; editorial scale is what makes the reveal worth doing.
- `minimalism` — the restraint discipline (one accent, real neutral ramp, systematic whitespace) is the same muscle; editorial is minimalism with a louder voice.
- `dark mode` — flip ink/paper to a warm near-black (`#15120e`) and bone text; keep the single accent. Re-check contrast after the flip.
- `bento-as-aesthetic` (used sparingly) — an editorial type system can headline a varied bento grid, as long as the cells stay rule-and-whitespace separated, not shadow-cards.
- `sticky-pinning` / `scroll-progress-indicator` — for long-form editorial, pin a section and orient the reader through a long pinned reveal.

## Current references
- [Responsive and fluid typography with Baseline CSS features — web.dev](https://web.dev/articles/baseline-in-action-fluid-type) — Miriam Suzanne on `clamp()`, the zoom/`vw` accessibility trap, `pow()` scales, and container-relative `cqi` sizing.
- [text-wrap CSS property — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap) — `balance` vs `pretty`, the line-count caps, and current support notes.
- [CSS text-wrap: balance — Chrome for Developers](https://developer.chrome.com/docs/css-ui/css-text-wrap-balance) — when balancing headlines helps and its performance envelope.
- [Generating font-size rules / fluid type scale — Modern CSS (Stephanie Eckles)](https://moderncss.dev/generating-font-size-css-rules-and-creating-a-fluid-type-scale/) — building a modular scale and fluid steps in pure CSS.
- [Utopia fluid type & space calculator](https://utopia.fyi/) — generate a `clamp()`-based modular scale between two viewport widths.
- [Best fonts for web design 2025 — Shakuro](https://shakuro.com/blog/best-fonts-for-web-design) — current display-serif and expressive-grotesk landscape for editorial work.
- [Awwwards — typography / editorial sites](https://www.awwwards.com/websites/typography/) — live examples of type-as-hero and asymmetric editorial composition.
- [Codrops](https://tympanus.net/codrops/) — forkable editorial layout and headline-treatment demos.
