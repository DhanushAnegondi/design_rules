# Minimalism

> A disciplined reduction where whitespace becomes structure, one committed accent carries all the emphasis, and type-weight/size contrast does the work that decoration would do in a busier style.

**Bucket:** visual style
**Maturity:** evergreen
**Effort:** medium
**Best for:** websites, portfolios, apps, dashboards (and the chrome around carousels — rarely the carousel itself)

## What it is
Minimalism done right descends from the Swiss / International Typographic Style of the 1950s (Müller-Brockmann, Hofmann, Ruder): a mathematical grid, generous negative space, a restrained sans, and ruthless removal of anything that does not serve the message. The user perceives calm, hierarchy, and confidence — the eye is *led*, not crowded. The discipline is the whole game. Restraint reads as intentional only when the elements that remain are unmistakably deliberate: a real type scale, a real grid, asymmetric tension, one accent used sparingly. Remove that discipline and the same "empty" page reads as unfinished — a draft someone forgot to populate. The line between *minimal* and *lazy* is not how much you removed; it is how considered what stays is.

## When to use
- Content-led sites where the message is the product: editorial, documentation, a writer's or studio's portfolio.
- Premium / trust-driven brands (finance, legal, high-end retail) where calm signals competence — Apple and Stripe are the canonical references.
- Reading-heavy experiences where cognitive load and processing fluency matter (long-form articles, knowledge bases).
- Dashboards and apps where every pixel of decoration competes with data — strip the chrome so the numbers lead.
- When you have *strong* content (real copy, real photography, a real wordmark). Minimalism amplifies whatever it frames, including weakness.

## When NOT to use
- When the content is thin or unfinished. Minimalism has nowhere to hide; weak copy and placeholder imagery look worse in a sparse layout, not better.
- High-density information products that genuinely need many controls visible at once (trading terminals, pro audio/video tools) — forced minimalism buries function behind hidden menus and hover states.
- When discoverability matters more than calm: hiding navigation behind a hamburger on desktop or stripping affordances (removing button borders, underlines on links) trades elegance for users who can't find the action.
- Conversion pages that need urgency, social proof, and multiple competing CTAs — a maximal landing page often outsells a serene one.
- The overuse warning: **everyone reaches for minimalism to look "clean," then ships lazy emptiness** — a centered 800px column, one weight of Inter, a single hero with three identical icon-title-blurb cards, and acres of meaningless margin. That is not Swiss restraint; it is an unstyled draft. If removing your grid, your accent, and your weight contrast wouldn't change the page, you built emptiness, not minimalism.

## How it works
The mechanism is *subtraction plus structure*. You remove ornament (gradients, shadows, borders, extra colors), then re-introduce hierarchy through four levers that cost nothing visually but carry all the meaning:

1. **Whitespace as structure, not leftover.** Space is allocated on a grid and a vertical rhythm, deliberately uneven. Large negative space around a single element is a spotlight; uniform equal margins everywhere is the lazy default. Use a spacing scale (e.g. multiples of `0.5rem`) and an asymmetric grid so space *groups* and *separates* content (Gestalt proximity), it doesn't just pad it.
2. **Type-weight and type-size contrast.** With color and decoration gone, hierarchy lives in the type. A real modular scale (a ratio like 1.25 "major third" or 1.333 "perfect fourth" applied step over step) plus a deliberate weight jump — e.g. `font-weight: 300` body against `font-weight: 700` display — does the work a busier style would do with boxes and color.
3. **One committed accent.** A single non-default hue, used only on the things that must be acted on or noticed (the primary CTA, a key link, one rule). Restraint is what makes the accent *mean* something; using it twice on a screen is usually one time too many.
4. **A real grid + alignment.** Everything snaps to a column grid and a baseline rhythm. Modern CSS makes this native: `display: grid`, `clamp()` for fluid type, `ch` units to cap measure (line length) at the ideal 60–75 characters, and OKLCH for perceptually-even tonal neutrals.

Key APIs: CSS Grid, `clamp()` for fluid type/space, `ch`/`rem` units for measure and scale, variable fonts for free weight contrast, `color: oklch()` for an even neutral ramp, `prefers-color-scheme` for an honest dark mode.

## Working code

### Vanilla HTML/CSS — Swiss-rooted minimal landing section
Self-contained; open it and the look renders. Real values; the palette is contrast-verified (see Accessibility).

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Minimalism — done right</title>
<style>
  :root {
    /* Committed neutral ramp (warm off-white paper, near-black ink) */
    --paper:  #fafaf8;
    --ink:    #16161a;   /* 17.27:1 on paper — far past AA */
    --mute:   #57575f;   /* 6.85:1 on paper — AA body text */
    --hair:   #e3e3dd;   /* hairline rules only, never text */
    --accent: #b4451f;   /* one committed accent: 5.27:1 on paper — AA text */

    /* Modular type scale, ratio 1.25 (major third), base 1.125rem */
    --step--1: clamp(0.92rem, 0.89rem + 0.15vw, 1.0rem);
    --step-0:  clamp(1.0rem,  0.95rem + 0.25vw, 1.125rem);
    --step-2:  clamp(1.4rem,  1.2rem  + 1.0vw,  1.953rem);
    --step-4:  clamp(2.2rem,  1.6rem  + 3.0vw,  3.815rem);

    /* Spacing scale — deliberate, not arbitrary margins */
    --space-s: 0.75rem;
    --space-m: 1.5rem;
    --space-l: 4rem;
    --space-xl: clamp(5rem, 4rem + 6vw, 9rem);
  }

  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    /* Characterful neutral default; swap for Geist/Satoshi/Suisse in production */
    font-family: "Helvetica Neue", Inter, system-ui, sans-serif;
    font-weight: 300;               /* light body — sets up the weight jump */
    font-size: var(--step-0);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* Asymmetric grid: content does NOT sit in a centered equal-padding column */
  .wrap {
    display: grid;
    grid-template-columns: minmax(var(--space-m), 1fr) minmax(0, 70ch) minmax(var(--space-m), 1.6fr);
    column-gap: var(--space-l);
  }
  .wrap > * { grid-column: 2; }      /* main rail */

  header.site {
    grid-column: 1 / -1;
    display: flex; justify-content: space-between; align-items: baseline;
    padding: var(--space-m) var(--space-m) 0;
    font-size: var(--step--1);
    letter-spacing: 0.02em;
  }
  header.site nav a { color: var(--ink); text-decoration: none; margin-left: var(--space-m); }
  header.site nav a:hover { color: var(--accent); }
  header.site .mark { font-weight: 700; letter-spacing: -0.01em; }

  .hero { padding-top: var(--space-xl); padding-bottom: var(--space-l); }

  /* Mono label — type doing the work a colored pill would do in a busy style */
  .eyebrow {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: var(--step--1);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0 0 var(--space-m);
  }
  h1 {
    font-size: var(--step-4);
    font-weight: 700;               /* the weight jump: 700 vs body 300 */
    line-height: 1.04;
    letter-spacing: -0.02em;
    margin: 0 0 var(--space-m);
    max-width: 16ch;                /* short display measure */
  }
  .lede { color: var(--mute); max-width: 56ch; margin: 0 0 var(--space-l); }

  /* The single accent moment: one committed CTA */
  .cta {
    display: inline-block;
    background: var(--accent);
    color: var(--paper);            /* 5.27:1 — AA */
    text-decoration: none;
    font-weight: 500;
    padding: 0.85rem 1.6rem;
    border-radius: 2px;             /* near-square; Swiss is not pill-shaped */
  }
  .cta:hover { background: #983914; } /* darker accent on hover, stays AA */
  .cta:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }

  /* Editorial detail rows instead of three identical icon cards */
  .rows { margin-top: var(--space-xl); border-top: 1px solid var(--hair); }
  .row {
    display: grid;
    grid-template-columns: 4ch 1fr;
    gap: var(--space-m);
    padding: var(--space-m) 0;
    border-bottom: 1px solid var(--hair);
    align-items: baseline;
  }
  .row .n { font-family: ui-monospace, monospace; color: var(--mute); font-size: var(--step--1); }
  .row h2 { font-size: var(--step-2); font-weight: 600; letter-spacing: -0.01em; margin: 0 0 0.25em; }
  .row p  { color: var(--mute); margin: 0; max-width: 60ch; }

  @media (max-width: 720px) {
    .wrap { grid-template-columns: 1fr; padding-inline: var(--space-m); }
    .wrap > * , header.site { grid-column: 1; }
    header.site { padding-inline: 0; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <header class="site">
      <span class="mark">Ruder &amp; Co.</span>
      <nav><a href="#work">Work</a><a href="#studio">Studio</a><a href="#contact">Contact</a></nav>
    </header>

    <section class="hero">
      <p class="eyebrow">Independent design studio · Zürich</p>
      <h1>We set type, build sites, and remove everything else.</h1>
      <p class="lede">Three of us, one grid, and a stubborn belief that the work is
        finished when there is nothing left to take away — not when there is
        nothing left to add.</p>
      <a class="cta" href="#contact">Start a project</a>
    </section>

    <div class="rows">
      <article class="row">
        <span class="n">01</span>
        <div>
          <h2>Brand &amp; type systems</h2>
          <p>A grid, a scale, and one accent you can hand to anyone and still
             recognise the result a year later.</p>
        </div>
      </article>
      <article class="row">
        <span class="n">02</span>
        <div>
          <h2>Editorial websites</h2>
          <p>Long-form layouts where the reading comes first and the chrome
             knows when to disappear.</p>
        </div>
      </article>
      <article class="row">
        <span class="n">03</span>
        <div>
          <h2>Design audits</h2>
          <p>We tell you what to delete. Usually it is the carousel.</p>
        </div>
      </article>
    </div>
  </div>
</body>
</html>
```

### React + Tailwind — the same discipline as tokens
Realistic production form. The restraint lives in the config (one accent, a real scale), not in scattered utility classes.

```jsx
// tailwind.config.js (excerpt) — encode the discipline once
// theme.extend.colors = {
//   paper: '#fafaf8', ink: '#16161a', mute: '#57575f',
//   hair: '#e3e3dd', accent: { DEFAULT: '#b4451f', hover: '#983914' },
// }
// theme.extend.fontFamily = { sans: ['Satoshi', 'system-ui', 'sans-serif'],
//                             mono: ['"JetBrains Mono"', 'monospace'] }

export default function MinimalHero() {
  return (
    <main className="min-h-screen bg-paper text-ink font-sans font-light antialiased">
      <header className="mx-auto flex max-w-5xl items-baseline justify-between px-6 pt-6 text-sm tracking-wide">
        <span className="font-bold tracking-tight">Ruder &amp; Co.</span>
        <nav className="space-x-6">
          {['Work', 'Studio', 'Contact'].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`}
               className="hover:text-accent focus-visible:outline-2 focus-visible:outline-ink">{l}</a>
          ))}
        </nav>
      </header>

      {/* Asymmetric: content rail offset left, space carries the right */}
      <section className="mx-auto grid max-w-5xl gap-x-16 px-6 pt-28 pb-16
                          md:grid-cols-[minmax(0,42rem)_1fr]">
        <div>
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.14em] text-accent">
            Independent design studio · Zürich
          </p>
          {/* the weight jump: bold display over light body */}
          <h1 className="mb-6 max-w-[16ch] text-4xl font-bold leading-[1.04]
                         tracking-tight md:text-6xl">
            We set type, build sites, and remove everything else.
          </h1>
          <p className="mb-10 max-w-[56ch] text-mute">
            Three of us, one grid, and a stubborn belief that the work is finished
            when there is nothing left to take away.
          </p>
          {/* the single accent moment */}
          <a href="#contact"
             className="inline-block rounded-sm bg-accent px-6 py-3 font-medium
                        text-paper hover:bg-accent-hover
                        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            Start a project
          </a>
        </div>
      </section>
    </main>
  );
}
```

## Variations
- **Strict Swiss / typographic** — visible grid tension, mono labels, near-square corners, accent used once. Knob: `letter-spacing` + grid asymmetry dialed up.
- **Soft / humanist minimal** (Apple-adjacent) — same restraint, but generous radii, a softer neutral, occasional product photography. Knob: `border-radius` and warmth of the neutral ramp.
- **Mono / brutalist-leaning minimal** — monospace throughout, hairline borders, almost no color. Knob: swap the sans for a mono and remove the accent entirely.
- **Editorial minimal** — serif display (Fraunces, Instrument Serif) against a sans body for character; type contrast comes from *style*, not just weight. Knob: display typeface.
- **Dark minimal** — same discipline inverted; the accent often needs to brighten to stay legible (see dark mode below). Knob: `prefers-color-scheme`.

## Accessibility
- **prefers-reduced-motion**: minimalism is mostly static, but if you add the genre-typical slow fade-up on entry, gate it. `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }` — render content visible by default, animate only as enhancement so a JS/CSS failure leaves readable text.
- **Contrast (verified)**: ink `#16161a` on paper `#fafaf8` = **17.27:1**; mute body `#57575f` on paper = **6.85:1** (clears AA 4.5:1); accent `#b4451f` on paper = **5.27:1** (clears AA text *and* the 3:1 non-text/UI-component minimum); paper on the accent button = **5.27:1**. Hairline `#e3e3dd` is **1.23:1** and is used for rules only — never for text. **Watch the minimalist trap**: light-grey "subtle" text (`#aaa` on white ≈ 2.3:1) fails AA; restraint must not become low contrast.
- **Focus & keyboard**: minimal styles love to delete affordances. Keep a real `:focus-visible` ring (the code uses a 2px solid ink outline with offset) — never `outline: none`. If you remove link underlines, ensure links are still distinguishable by more than color (weight, hover underline, or position) per WCAG 1.4.1.
- **Touch/pointer fallback**: hover-revealed navigation and controls have no equivalent on touch; keep primary actions visible and tappable (≥ 44×44 CSS px hit target) rather than hiding them behind hover.
- **Screen readers**: decorative hairlines and mono numbering (`01`, `02`) are presentational — keep them out of the accessible name; here they're plain text in their own span and harmless, but if used as list markers prefer real `<ol>` semantics so the order is announced.
- **Measure & zoom**: capping line length with `ch` aids readability, but size with `rem`/`clamp()` floors in `rem` so text still scales to 200% (WCAG 1.4.4) — never lock font-size in `px` or pure `vw`.

## Performance
- **Cheapest style there is.** No `backdrop-filter`, no large gradient meshes, no stacked shadows — so no blur cost, no extra GPU compositing layers, minimal overdraw. This is a genuine advantage; lean into it.
- **Fonts are the main budget.** A characterful display + body + mono can balloon payload. Subset to the glyphs you use, `font-display: swap`, prefer one **variable font** to get the weight contrast (300/700) from a single file instead of multiple static weights.
- **No layout thrash** in the static state; if you add scroll fades, animate only `transform`/`opacity` (compositor-only) and avoid animating `width`/`top`/`margin`.
- **Watch the empty-page tax**: huge whitespace can tempt huge hero imagery to "fill" it — that reintroduces the weight minimalism just saved. Let the space stay empty; ship a smaller page.

## Anti-slop
Cross-reference `_slop-blocklist.md`:

- **TYPE** — *Inter/Roboto/Arial at one weight and one size* is the #1 tell that "minimal" is actually unstyled. Fix: a real modular scale (ratio 1.25 here) **plus** a deliberate weight jump — light `300` body against bold `700` display — and a characterful face (Satoshi, General Sans, Suisse, or a serif like Fraunces for editorial). The contrast *is* the design.
- **LAYOUT** — *the centered 800px column with equal padding on all sides* and *the hero + three identical icon-title-blurb cards*. Fix: an asymmetric grid (the code offsets the content rail and lets negative space carry the other column) and **editorial numbered detail rows** instead of triplet cards. Vary the rhythm; make whitespace group and separate, not just pad.
- **COLOR** — minimalism's failure mode isn't the purple-to-pink gradient; it's *no committed hue at all* (everything grey) **or** generic SaaS blue `#3B82F6` on the one button. Fix: one committed, less-defaulted accent (here a burnt sienna `#b4451f` at 5.27:1) used **once**, over a real warm-neutral ramp — not pure `#000`/`#fff`/`#ccc`.
- **SURFACE** — *a soft drop shadow on every card*. Minimal done right uses **hairline rules and whitespace** to separate, reserving elevation for genuinely floating UI. The detail rows here separate with 1px `--hair` lines and space, zero shadows.
- **The meta-rule**: slop is grabbing every bucket's default at once. The difference between *designed minimal* and *generated empty* is that two or three buckets are broken on purpose — here the type scale + weight jump, the asymmetric grid, and the single non-default accent.

## Pairs well with
- **editorial / typographic style** — the natural skin; big display type and a real scale are what make sparse layouts land instead of read as empty.
- **bento layout** (used with restraint) — a minimal grid of unequal cells gives structure without ornament; keep cells border-light and shadow-free.
- **dark mode** — the same discipline inverted; brighten the accent (e.g. `#ff7a4d`, **7.31:1** on a `#111114` ink) so it stays legible against the dark field.
- **text reveal on scroll** (sparingly) — one focal headline mask-up on entry, expo easing, everything else simply visible — adds life without breaking calm; always behind `prefers-reduced-motion`.
- **systematic elevation** — when you *do* need depth (modals, menus), a single deliberate shadow token beats a soft shadow on everything.

## Current references
- [MDN — `clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) — the fluid-type/space primitive used throughout; min/preferred/max in one value.
- [Modern Fluid Typography Using CSS Clamp — Smashing Magazine](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/) — how to build a fluid modular scale and the 200%-zoom accessibility caveat.
- [Fluid Type Scale Calculator](https://www.fluid-type-scale.com/) — generate the `clamp()` step variables for a chosen ratio; drop straight into tokens.
- [Understanding SC 1.4.3: Contrast (Minimum) — W3C WAI](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) — the 4.5:1 / 3:1 thresholds the palette is checked against.
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — verify any accent/neutral pair before shipping.
- [MDN — `oklch()` color](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) — perceptually-even neutral ramps and accents for a tonal one-hue system.
- [Swiss Style Web Design — a comprehensive guide (Pixeldarts)](https://www.pixeldarts.com/post/swiss-style-web-design-a-comprehensive-guide) — grid, whitespace-as-structure, and type roots of done-right minimalism.
- [Best Minimal Websites — Awwwards](https://www.awwwards.com/websites/minimal/) — current award-level executions; study where restraint stays deliberate vs. drifts to empty.
- [Josef Müller-Brockmann — Wikipedia](https://en.wikipedia.org/wiki/Josef_M%C3%BCller-Brockmann) — the source text on grids and objective design the whole style descends from; his 1981 *Grid Systems in Graphic Design* is documented in the bibliography.
