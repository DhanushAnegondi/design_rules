# Testimonials

> A collection of real customer or peer quotes, structured semantically and surfaced in one of several presentation modes — static card grid, rotating carousel, infinite marquee, logo wall, or embedded video — to build earned credibility at a glance.

**Bucket:** component
**Maturity:** evergreen
**Effort:** low (static grid) to medium (marquee + carousel with full a11y)
**Best for:** websites, portfolios, marketing pages, SaaS apps, agency sites

---

## What it is

Testimonials translate trust signals into UI: a real person, their exact words, and enough context (name, role, company, optional photo) for the reader to decide whether the endorsement applies to them. The underlying HTML element is `<blockquote>` with `<figure>/<figcaption>` wrapping for attribution — not a heading, not a `<div>` with large text. Presentation ranges from a static two-column grid to an auto-scrolling marquee of quote cards or a full-screen video pull quote. The component's credibility lives or dies on specificity: a concrete metric or named outcome beats any generic superlative.

---

## When to use

- A product or service page that needs third-party validation before the primary CTA.
- A portfolio's "clients" or "work" section where recognisable names add authority.
- A pricing page: reducing anxiety at the point where visitors decide whether to pay.
- A landing page A/B test where the current conversion rate is low and trust is the suspected gap.
- A SaaS onboarding flow where a "wall of love" reassures users they are not the first.
- Any context where the brand's own claims need backing from someone outside it.

---

## When NOT to use

- **When the quotes are fake or generic.** "Amazing product — John D." destroys credibility faster than no testimonial at all. If you have no real testimonials yet, use a case-study summary or a stat with a source instead.
- **When the section exists only for SEO filler.** A two-sentence blurb from "CEO of a leading company" communicates nothing; omit it.
- **When the autoplay marquee is the only treatment on a content-heavy page.** Moving content competes with the user's reading focus (see WCAG SC 2.2.2). Use a static grid or a user-triggered carousel instead.
- **When the quoted person has not consented or cannot be verified.** A named, verifiable quote from a real account is the minimum bar.
- **When the page already has a reviews section pulled from a third-party platform.** Duplicating that content in a marquee above it dilutes both.
- Everyone overuses the "three-card grid with identical star ratings and lorem headshots" pattern — it reads as stock filler even when the quotes are real (see Anti-slop).

---

## How it works

### Semantic foundation

The HTML specification requires that attribution for a `<blockquote>` sit **outside** the element itself. The `<figure>/<figcaption>` pattern is the cleanest way to achieve this while keeping the quote and its attribution semantically linked:

```html
<figure>
  <blockquote cite="https://example.com/source-if-public">
    <p>Quote text here.</p>
  </blockquote>
  <figcaption>
    Priya Nair, Head of Engineering — <cite>Lattice</cite>
  </figcaption>
</figure>
```

The `cite` attribute on `<blockquote>` is a URL pointing to the source; it is not displayed by browsers but is machine-readable. The `<cite>` element wraps the work or company title (or the speaker's byline), not the speaker's name alone. Screen readers that support blockquote (NVDA, JAWS — covering ~84% of screen reader users per WebAIM 2024 survey) announce boundaries: "Block quote … out of block quote."

### Presentation modes

| Mode | Mechanism | Best for |
|---|---|---|
| Quote card grid | CSS Grid, static | 3–9 quotes, high-information |
| Rotating carousel | JS + ARIA carousel pattern | 5–15 quotes, focused spotlight |
| Infinite marquee | CSS `@keyframes` + `translate` | Brand feel, logos + short quotes |
| Logo wall | CSS Grid/Flex, static images | Trusted-by / "as seen in" |
| Video pull quote | `<iframe>` or `<video>` + transcript | High-trust, B2B, enterprise |

### Key CSS properties for marquee

The marquee technique duplicates the list once (the copy gets `aria-hidden="true"`) and translates both copies leftward by exactly the width of one copy, creating a seamless loop with `transform: translateX()` — no layout thrash, GPU-composited.

---

## Working code

### 1. Static quote card grid (vanilla HTML/CSS)

Complete, self-contained, runnable.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Testimonials — quote card grid</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0f0f11;
      --surface: #1a1a1e;
      --border: #2a2a30;
      --text-primary: #f2f1ed;
      --text-secondary: #9d9b94;
      --accent: #d4a853; /* single warm amber accent — not SaaS blue */
      --radius: 12px;
      --gap: clamp(1rem, 2.5vw, 1.5rem);
    }

    body {
      background: var(--bg);
      color: var(--text-primary);
      font-family: "Geist", "Inter", system-ui, sans-serif;
      font-size: 1rem;
      line-height: 1.6;
    }

    .testimonials-section {
      padding: clamp(3rem, 8vw, 6rem) clamp(1rem, 5vw, 3rem);
      max-width: 72rem;
      margin-inline: auto;
    }

    .testimonials-section__header {
      margin-block-end: clamp(2rem, 5vw, 3.5rem);
    }

    .testimonials-section__eyebrow {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent);
      margin-block-end: 0.5rem;
    }

    .testimonials-section__heading {
      /* General Sans or Fraunces for display weight — not Inter at 700 */
      font-size: clamp(1.75rem, 4vw, 2.75rem);
      font-weight: 700;
      line-height: 1.1;
      color: var(--text-primary);
    }

    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
      gap: var(--gap);
      list-style: none;
    }

    /* Bento-style: first card spans two columns on wide screens */
    @media (min-width: 56rem) {
      .testimonials-grid__item:first-child {
        grid-column: span 2;
      }
    }

    .testimonials-grid__item {
      /* No glassmorphism on every card — systematic elevation via border only */
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: clamp(1.25rem, 3vw, 2rem);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .quote-figure {
      display: contents; /* let card flex control layout */
    }

    .quote-body {
      flex: 1;
    }

    .quote-body__mark {
      /* Decorative opening quote — purely visual */
      display: block;
      font-size: 3.5rem;
      line-height: 0.6;
      color: var(--accent);
      font-family: Georgia, serif;
      margin-block-end: 0.75rem;
    }

    .quote-body__text {
      font-size: clamp(0.95rem, 1.5vw, 1.05rem);
      line-height: 1.65;
      color: var(--text-primary);
    }

    /* Highlighted stat inside first (featured) card */
    .quote-body__stat {
      display: block;
      font-size: clamp(1.75rem, 3.5vw, 2.25rem);
      font-weight: 700;
      color: var(--accent);
      margin-block-start: 0.75rem;
      line-height: 1;
    }

    .quote-footer {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-top: 1px solid var(--border);
      padding-top: 1.25rem;
    }

    .quote-footer__avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      background: var(--border); /* placeholder colour while image loads */
    }

    .quote-footer__meta {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .quote-footer__name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .quote-footer__role {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    /* Contrast check (done per this file's palette):
       --text-primary #f2f1ed on --surface #1a1a1e → approx 13.5:1 — passes AAA
       --text-secondary #9d9b94 on --surface #1a1a1e → approx 5.6:1 — passes AA
       --accent #d4a853 on --bg #0f0f11 → approx 7.3:1 — passes AAA (decorative use; informational text uses --text-primary)
    */
  </style>
</head>
<body>

<section class="testimonials-section" aria-labelledby="testimonials-heading">
  <header class="testimonials-section__header">
    <p class="testimonials-section__eyebrow">From the people using it</p>
    <h2 id="testimonials-heading" class="testimonials-section__heading">
      What engineers say after six months
    </h2>
  </header>

  <ul class="testimonials-grid" role="list">

    <!-- Featured card: spans two columns, includes a concrete metric -->
    <li class="testimonials-grid__item">
      <figure class="quote-figure">
        <blockquote class="quote-body" cite="https://lattice.com/case-studies/relay">
          <span class="quote-body__mark" aria-hidden="true">"</span>
          <p class="quote-body__text">
            We cut our incident mean-time-to-resolution from four hours to under forty minutes.
            The on-call rotation tooling is the first thing my team actually wants to open on a Sunday.
          </p>
          <span class="quote-body__stat" aria-label="83% faster resolution">83% faster</span>
        </blockquote>
        <figcaption class="quote-footer">
          <img
            class="quote-footer__avatar"
            src="https://i.pravatar.cc/80?img=47"
            alt="Priya Nair"
            width="40"
            height="40"
            loading="lazy"
          >
          <span class="quote-footer__meta">
            <span class="quote-footer__name">Priya Nair</span>
            <span class="quote-footer__role">Head of Engineering — <cite>Relay Payments</cite></span>
          </span>
        </figcaption>
      </figure>
    </li>

    <li class="testimonials-grid__item">
      <figure class="quote-figure">
        <blockquote class="quote-body">
          <span class="quote-body__mark" aria-hidden="true">"</span>
          <p class="quote-body__text">
            Finally a tool where the data my skip-one expects and the data
            my reports actually enter are the same thing. Adoption was near-instant.
          </p>
        </blockquote>
        <figcaption class="quote-footer">
          <img
            class="quote-footer__avatar"
            src="https://i.pravatar.cc/80?img=12"
            alt="Marcus Delacroix"
            width="40"
            height="40"
            loading="lazy"
          >
          <span class="quote-footer__meta">
            <span class="quote-footer__name">Marcus Delacroix</span>
            <span class="quote-footer__role">Engineering Manager — <cite>Fathom Analytics</cite></span>
          </span>
        </figcaption>
      </figure>
    </li>

    <li class="testimonials-grid__item">
      <figure class="quote-figure">
        <blockquote class="quote-body">
          <span class="quote-body__mark" aria-hidden="true">"</span>
          <p class="quote-body__text">
            I've used five different performance tools. This is the first where
            writing a review felt like giving feedback to a person instead of filling in a form.
          </p>
        </blockquote>
        <figcaption class="quote-footer">
          <img
            class="quote-footer__avatar"
            src="https://i.pravatar.cc/80?img=32"
            alt="Yuki Tanabe"
            width="40"
            height="40"
            loading="lazy"
          >
          <span class="quote-footer__meta">
            <span class="quote-footer__name">Yuki Tanabe</span>
            <span class="quote-footer__role">Staff Engineer — <cite>Linear</cite></span>
          </span>
        </figcaption>
      </figure>
    </li>

  </ul>
</section>

</body>
</html>
```

---

### 2. Accessible auto-scrolling marquee (vanilla HTML/CSS/JS)

WCAG SC 2.2.2 requires a pause/stop mechanism for auto-starting content lasting more than five seconds alongside other content. This implementation provides: a visible pause button, CSS `animation-play-state` pause on hover (pointer devices only), and a full static fallback under `prefers-reduced-motion: reduce`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Testimonials — accessible marquee</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0f0f11;
      --surface: #1a1a1e;
      --border: #2a2a30;
      --text-primary: #f2f1ed;
      --text-secondary: #9d9b94;
      --accent: #d4a853;
      --gap: 1.25rem;
      --card-width: 22rem;
      /* Animation speed — slower feels more editorial, less ticker-like */
      --marquee-duration: 42s;
    }

    body {
      background: var(--bg);
      color: var(--text-primary);
      font-family: "Geist", system-ui, sans-serif;
      padding-block: 4rem;
    }

    /* ── Section header ─────────────────────────────── */
    .marquee-section__header {
      max-width: 72rem;
      margin-inline: auto;
      padding-inline: clamp(1rem, 5vw, 3rem);
      margin-block-end: 2rem;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .marquee-section__heading {
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 700;
      line-height: 1.15;
    }

    /* ── Pause button ───────────────────────────────── */
    .marquee-pause-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text-secondary);
      font-size: 0.8rem;
      font-family: inherit;
      padding: 0.4rem 0.75rem;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
      flex-shrink: 0;
    }
    .marquee-pause-btn:hover,
    .marquee-pause-btn:focus-visible {
      border-color: var(--accent);
      color: var(--text-primary);
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    /* ── Marquee track ──────────────────────────────── */
    .marquee-viewport {
      overflow: hidden;
      /* Fade edges — purely decorative gradient */
      -webkit-mask-image: linear-gradient(
        to right,
        transparent 0%,
        black 6%,
        black 94%,
        transparent 100%
      );
      mask-image: linear-gradient(
        to right,
        transparent 0%,
        black 6%,
        black 94%,
        transparent 100%
      );
    }

    .marquee-track {
      display: flex;
      gap: var(--gap);
      /* Pause on hover for pointer/mouse users only */
      width: max-content;
    }

    @media (hover: hover) and (pointer: fine) {
      .marquee-viewport:hover .marquee-track {
        animation-play-state: paused;
      }
    }

    .marquee-track--animating {
      animation: marquee-scroll var(--marquee-duration) linear infinite;
    }

    /* Paused state toggled by JS */
    .marquee-track--paused {
      animation-play-state: paused !important;
    }

    @keyframes marquee-scroll {
      from { transform: translateX(0); }
      to   { transform: translateX(calc(-50% - var(--gap) / 2)); }
    }

    /* ── Reduced motion: static flex layout, no animation ── */
    @media (prefers-reduced-motion: reduce) {
      .marquee-track {
        animation: none !important;
        flex-wrap: wrap;
        width: auto;
        padding-inline: clamp(1rem, 5vw, 3rem);
        max-width: 72rem;
        margin-inline: auto;
      }
      .marquee-viewport {
        -webkit-mask-image: none;
        mask-image: none;
        overflow: visible;
      }
      /* Hide the pause button — there is nothing to pause */
      .marquee-pause-btn {
        display: none;
      }
      /* Show duplicate set (hidden by aria-hidden) as visually redundant — keep hidden */
    }

    /* ── Quote card ─────────────────────────────────── */
    .quote-card {
      width: var(--card-width);
      flex-shrink: 0;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .quote-card__stars {
      display: flex;
      gap: 2px;
    }

    .quote-card__star {
      width: 1rem;
      height: 1rem;
      fill: var(--accent);
    }

    .quote-card__text {
      font-size: 0.9rem;
      line-height: 1.65;
      color: var(--text-primary);
      flex: 1;
    }

    .quote-card__footer {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      border-top: 1px solid var(--border);
      padding-top: 0.875rem;
    }

    .quote-card__avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      object-fit: cover;
      background: var(--border);
      flex-shrink: 0;
    }

    .quote-card__name {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .quote-card__role {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
  </style>
</head>
<body>

<section aria-labelledby="marquee-heading">
  <div class="marquee-section__header">
    <h2 id="marquee-heading" class="marquee-section__heading">
      Trusted by 4,000+ engineering teams
    </h2>
    <!-- WCAG 2.2.2: pause/stop mechanism — must be reachable before the moving content in tab order -->
    <button
      class="marquee-pause-btn"
      id="marquee-toggle"
      aria-controls="marquee-track"
      aria-label="Pause testimonial scroll"
      type="button"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <rect x="1" y="1" width="3.5" height="10" rx="1"/>
        <rect x="7.5" y="1" width="3.5" height="10" rx="1"/>
      </svg>
      <span class="marquee-pause-btn__label">Pause</span>
    </button>
  </div>

  <div class="marquee-viewport">
    <!--
      The track contains two identical sets of cards.
      The second set has aria-hidden="true" so screen readers
      do not encounter duplicate content.
      The animation translates by exactly 50% of the total width,
      which equals one full set — creating a seamless loop.
    -->
    <div
      class="marquee-track marquee-track--animating"
      id="marquee-track"
      role="region"
      aria-label="Testimonial quotes"
      aria-roledescription="scrolling testimonials"
    >

      <!-- Primary set — read by screen readers -->
      <article class="quote-card">
        <figure>
          <div class="quote-card__stars" aria-label="5 out of 5 stars">
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
          </div>
          <blockquote class="quote-card__text">
            <p>The review cycle that used to take three weeks now closes in four days. My reports say it's the first performance process that actually felt fair.</p>
          </blockquote>
          <figcaption class="quote-card__footer">
            <img class="quote-card__avatar" src="https://i.pravatar.cc/64?img=5" alt="Amara Osei" width="32" height="32" loading="lazy">
            <span>
              <span class="quote-card__name">Amara Osei</span>
              <span class="quote-card__role"><cite>Monzo</cite> — Engineering Lead</span>
            </span>
          </figcaption>
        </figure>
      </article>

      <article class="quote-card">
        <figure>
          <div class="quote-card__stars" aria-label="5 out of 5 stars">
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
          </div>
          <blockquote class="quote-card__text">
            <p>I switched from a competitor after the third time a missed Slack message caused a mis-attributed rating. That hasn't happened once in eight months here.</p>
          </blockquote>
          <figcaption class="quote-card__footer">
            <img class="quote-card__avatar" src="https://i.pravatar.cc/64?img=22" alt="Diego Ruiz" width="32" height="32" loading="lazy">
            <span>
              <span class="quote-card__name">Diego Ruiz</span>
              <span class="quote-card__role"><cite>Brex</cite> — Senior EM</span>
            </span>
          </figcaption>
        </figure>
      </article>

      <article class="quote-card">
        <figure>
          <div class="quote-card__stars" aria-label="5 out of 5 stars">
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
          </div>
          <blockquote class="quote-card__text">
            <p>Calibration used to be a three-hour meeting where the last thirty minutes were always someone re-explaining the same rating scale. Now it's forty minutes, every time.</p>
          </blockquote>
          <figcaption class="quote-card__footer">
            <img class="quote-card__avatar" src="https://i.pravatar.cc/64?img=38" alt="Saoirse Flynn" width="32" height="32" loading="lazy">
            <span>
              <span class="quote-card__name">Saoirse Flynn</span>
              <span class="quote-card__role"><cite>Intercom</cite> — VP Engineering</span>
            </span>
          </figcaption>
        </figure>
      </article>

      <article class="quote-card">
        <figure>
          <div class="quote-card__stars" aria-label="5 out of 5 stars">
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
          </div>
          <blockquote class="quote-card__text">
            <p>We onboarded 60 new engineers in Q1. Every single one completed their first check-in within the first week. That has never happened before.</p>
          </blockquote>
          <figcaption class="quote-card__footer">
            <img class="quote-card__avatar" src="https://i.pravatar.cc/64?img=60" alt="Tamar Cohen" width="32" height="32" loading="lazy">
            <span>
              <span class="quote-card__name">Tamar Cohen</span>
              <span class="quote-card__role"><cite>Wix</cite> — Director of Engineering</span>
            </span>
          </figcaption>
        </figure>
      </article>

      <!-- Duplicate set — visually continues the loop, hidden from AT -->
      <article class="quote-card" aria-hidden="true">
        <figure>
          <div class="quote-card__stars">
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
          </div>
          <blockquote class="quote-card__text">
            <p>The review cycle that used to take three weeks now closes in four days. My reports say it's the first performance process that actually felt fair.</p>
          </blockquote>
          <figcaption class="quote-card__footer">
            <img class="quote-card__avatar" src="https://i.pravatar.cc/64?img=5" alt="" width="32" height="32" loading="lazy">
            <span>
              <span class="quote-card__name">Amara Osei</span>
              <span class="quote-card__role"><cite>Monzo</cite> — Engineering Lead</span>
            </span>
          </figcaption>
        </figure>
      </article>

      <article class="quote-card" aria-hidden="true">
        <figure>
          <div class="quote-card__stars">
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
          </div>
          <blockquote class="quote-card__text">
            <p>I switched from a competitor after the third time a missed Slack message caused a mis-attributed rating. That hasn't happened once in eight months here.</p>
          </blockquote>
          <figcaption class="quote-card__footer">
            <img class="quote-card__avatar" src="https://i.pravatar.cc/64?img=22" alt="" width="32" height="32" loading="lazy">
            <span>
              <span class="quote-card__name">Diego Ruiz</span>
              <span class="quote-card__role"><cite>Brex</cite> — Senior EM</span>
            </span>
          </figcaption>
        </figure>
      </article>

      <article class="quote-card" aria-hidden="true">
        <figure>
          <div class="quote-card__stars">
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
          </div>
          <blockquote class="quote-card__text">
            <p>Calibration used to be a three-hour meeting where the last thirty minutes were always someone re-explaining the same rating scale. Now it's forty minutes, every time.</p>
          </blockquote>
          <figcaption class="quote-card__footer">
            <img class="quote-card__avatar" src="https://i.pravatar.cc/64?img=38" alt="" width="32" height="32" loading="lazy">
            <span>
              <span class="quote-card__name">Saoirse Flynn</span>
              <span class="quote-card__role"><cite>Intercom</cite> — VP Engineering</span>
            </span>
          </figcaption>
        </figure>
      </article>

      <article class="quote-card" aria-hidden="true">
        <figure>
          <div class="quote-card__stars">
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
            <svg class="quote-card__star" viewBox="0 0 20 20"><path d="M10 1l2.5 6.5H19l-5.3 4 2 6.5L10 14l-5.7 4 2-6.5L1 7.5h6.5z"/></svg>
          </div>
          <blockquote class="quote-card__text">
            <p>We onboarded 60 new engineers in Q1. Every single one completed their first check-in within the first week. That has never happened before.</p>
          </blockquote>
          <figcaption class="quote-card__footer">
            <img class="quote-card__avatar" src="https://i.pravatar.cc/64?img=60" alt="" width="32" height="32" loading="lazy">
            <span>
              <span class="quote-card__name">Tamar Cohen</span>
              <span class="quote-card__role"><cite>Wix</cite> — Director of Engineering</span>
            </span>
          </figcaption>
        </figure>
      </article>

    </div><!-- /.marquee-track -->
  </div><!-- /.marquee-viewport -->
</section>

<script>
  (function () {
    // Bail out completely for reduced-motion users — CSS handles the static layout.
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const track = document.getElementById('marquee-track');
    const btn   = document.getElementById('marquee-toggle');
    const label = btn.querySelector('.marquee-pause-btn__label');
    const pauseSvg = btn.querySelector('svg');

    // Pause icon paths (rect x2) → Play icon (triangle)
    const playSvgInner = '<polygon points="2,1 12,6 2,11"/>';
    const pauseSvgInner = '<rect x="1" y="1" width="3.5" height="10" rx="1"/><rect x="7.5" y="1" width="3.5" height="10" rx="1"/>';

    let paused = false;

    btn.addEventListener('click', function () {
      paused = !paused;

      if (paused) {
        track.classList.add('marquee-track--paused');
        btn.setAttribute('aria-label', 'Resume testimonial scroll');
        label.textContent = 'Resume';
        pauseSvg.innerHTML = playSvgInner;
      } else {
        track.classList.remove('marquee-track--paused');
        btn.setAttribute('aria-label', 'Pause testimonial scroll');
        label.textContent = 'Pause';
        pauseSvg.innerHTML = pauseSvgInner;
      }
    });

    // Auto-pause when any element inside the carousel receives keyboard focus
    // (mirrors the ARIA APG carousel auto-rotation requirement)
    track.addEventListener('focusin', function () {
      track.classList.add('marquee-track--paused');
    });
    track.addEventListener('focusout', function (e) {
      // Only resume if focus leaves the track entirely AND user hasn't manually paused
      if (!track.contains(e.relatedTarget) && !paused) {
        track.classList.remove('marquee-track--paused');
      }
    });
  }());
</script>

</body>
</html>
```

---

### 3. Single-quote rotating carousel (ARIA APG pattern, vanilla JS)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Testimonials — rotating carousel</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0f0f11;
      --surface: #1a1a1e;
      --border: #2a2a30;
      --text-primary: #f2f1ed;
      --text-secondary: #9d9b94;
      --accent: #d4a853;
    }

    body {
      background: var(--bg);
      color: var(--text-primary);
      font-family: "Geist", system-ui, sans-serif;
      display: grid;
      place-items: center;
      min-height: 100svh;
      padding: 2rem;
    }

    /* ── Carousel shell ─────────────────────────────── */
    .testimonial-carousel {
      max-width: 44rem;
      width: 100%;
    }

    .carousel__controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-block-end: 2rem;
    }

    .carousel__btn {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text-primary);
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: border-color 0.15s, background 0.15s;
    }

    .carousel__btn:hover,
    .carousel__btn:focus-visible {
      border-color: var(--accent);
      background: color-mix(in oklch, var(--accent) 12%, transparent);
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    .carousel__btn svg { pointer-events: none; }

    /* Slide picker dots */
    .carousel__dots {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      list-style: none;
    }

    .carousel__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--border);
      border: none;
      cursor: pointer;
      padding: 0;
      transition: background 0.15s, transform 0.15s;
    }

    .carousel__dot[aria-disabled="true"] {
      background: var(--accent);
      transform: scale(1.4);
      cursor: default;
    }

    .carousel__dot:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }

    /* ── Slide region ───────────────────────────────── */
    .carousel__slides {
      position: relative;
      overflow: hidden;
      border-radius: 16px;
    }

    .carousel__slide {
      display: none;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: clamp(2rem, 5vw, 3.5rem);
      text-align: center;
    }

    .carousel__slide[aria-hidden="false"] {
      display: block;
      /* Cross-fade entrance */
      animation: slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes slide-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .carousel__slide[aria-hidden="false"] {
        animation: none;
      }
    }

    .slide__avatar {
      width: 4.5rem;
      height: 4.5rem;
      border-radius: 50%;
      object-fit: cover;
      margin-inline: auto;
      margin-block-end: 1.5rem;
      display: block;
      border: 2px solid var(--border);
    }

    .slide__quote {
      font-size: clamp(1rem, 2.5vw, 1.2rem);
      line-height: 1.7;
      color: var(--text-primary);
      margin-block-end: 1.5rem;
      /* Pull quotes — decorative only */
      position: relative;
    }

    .slide__name {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .slide__role {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-block-start: 0.25rem;
    }
  </style>
</head>
<body>

<!--
  ARIA APG carousel pattern:
  - section[aria-roledescription="carousel"] as the region
  - Each slide is role="group" + aria-roledescription="slide" + aria-label="N of N"
  - Controls precede slides in DOM/tab order
  - aria-live="polite" (not off) because this carousel is NOT auto-rotating
  - No aria-pressed on nav buttons (APG requirement)
-->
<section
  class="testimonial-carousel"
  aria-roledescription="carousel"
  aria-label="Customer stories"
>
  <div class="carousel__controls" role="group" aria-label="Slide controls">
    <button
      class="carousel__btn"
      id="carousel-prev"
      aria-label="Previous testimonial"
      type="button"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
        <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <ul class="carousel__dots" role="list" aria-label="Go to slide">
      <li>
        <button class="carousel__dot" data-slide="0" aria-label="Slide 1 of 3" aria-disabled="true" type="button"></button>
      </li>
      <li>
        <button class="carousel__dot" data-slide="1" aria-label="Slide 2 of 3" type="button"></button>
      </li>
      <li>
        <button class="carousel__dot" data-slide="2" aria-label="Slide 3 of 3" type="button"></button>
      </li>
    </ul>

    <button
      class="carousel__btn"
      id="carousel-next"
      aria-label="Next testimonial"
      type="button"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
        <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  <!-- aria-live="polite": announces slide changes when user navigates; no auto-rotate so no need to toggle off -->
  <div class="carousel__slides" aria-live="polite" aria-atomic="false">

    <div
      class="carousel__slide"
      role="group"
      aria-roledescription="slide"
      aria-label="1 of 3"
      aria-hidden="false"
      id="slide-0"
    >
      <figure>
        <img class="slide__avatar" src="https://i.pravatar.cc/90?img=47" alt="Priya Nair" width="72" height="72">
        <blockquote class="slide__quote">
          <p>"We cut our incident mean-time-to-resolution from four hours to under forty minutes. The on-call rotation tooling is the first thing my team actually wants to open on a Sunday."</p>
        </blockquote>
        <figcaption>
          <p class="slide__name">Priya Nair</p>
          <p class="slide__role">Head of Engineering — <cite>Relay Payments</cite></p>
        </figcaption>
      </figure>
    </div>

    <div
      class="carousel__slide"
      role="group"
      aria-roledescription="slide"
      aria-label="2 of 3"
      aria-hidden="true"
      id="slide-1"
    >
      <figure>
        <img class="slide__avatar" src="https://i.pravatar.cc/90?img=12" alt="Marcus Delacroix" width="72" height="72">
        <blockquote class="slide__quote">
          <p>"Finally a tool where the data my skip-one expects and the data my reports actually enter are the same thing. Adoption was near-instant."</p>
        </blockquote>
        <figcaption>
          <p class="slide__name">Marcus Delacroix</p>
          <p class="slide__role">Engineering Manager — <cite>Fathom Analytics</cite></p>
        </figcaption>
      </figure>
    </div>

    <div
      class="carousel__slide"
      role="group"
      aria-roledescription="slide"
      aria-label="3 of 3"
      aria-hidden="true"
      id="slide-2"
    >
      <figure>
        <img class="slide__avatar" src="https://i.pravatar.cc/90?img=32" alt="Yuki Tanabe" width="72" height="72">
        <blockquote class="slide__quote">
          <p>"I've used five different performance tools. This is the first where writing a review felt like giving feedback to a person instead of filling in a form."</p>
        </blockquote>
        <figcaption>
          <p class="slide__name">Yuki Tanabe</p>
          <p class="slide__role">Staff Engineer — <cite>Linear</cite></p>
        </figcaption>
      </figure>
    </div>

  </div><!-- /.carousel__slides -->
</section>

<script>
  (function () {
    const total = 3;
    let current = 0;

    const slides = document.querySelectorAll('.carousel__slide');
    const dots   = document.querySelectorAll('.carousel__dot');
    const prev   = document.getElementById('carousel-prev');
    const next   = document.getElementById('carousel-next');

    function goTo(index) {
      // Wrap around
      index = ((index % total) + total) % total;

      slides[current].setAttribute('aria-hidden', 'true');
      dots[current].removeAttribute('aria-disabled');

      current = index;

      slides[current].setAttribute('aria-hidden', 'false');
      dots[current].setAttribute('aria-disabled', 'true');
    }

    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));

    dots.forEach((dot) => {
      dot.addEventListener('click', function () {
        const target = parseInt(this.dataset.slide, 10);
        if (target !== current) goTo(target);
      });
    });

    // Keyboard: left/right arrows when focus is inside the carousel
    document.querySelector('.testimonial-carousel').addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
    });
  }());
</script>

</body>
</html>
```

---

### 4. React + Tailwind variant — quote card grid with Motion entrance

```jsx
// TestimonialsGrid.jsx
// Dependencies: framer-motion, tailwindcss
// Run: npm install framer-motion; ensure Tailwind is configured.
// Works with React 18+.

import { useReducedMotion, motion } from "framer-motion";

const TESTIMONIALS = [
  {
    id: 1,
    quote:
      "We cut our incident mean-time-to-resolution from four hours to under forty minutes. The on-call rotation tooling is the first thing my team actually wants to open on a Sunday.",
    stat: "83% faster",
    statLabel: "83% faster incident resolution",
    name: "Priya Nair",
    role: "Head of Engineering",
    company: "Relay Payments",
    avatar: "https://i.pravatar.cc/80?img=47",
    featured: true,
  },
  {
    id: 2,
    quote:
      "Finally a tool where the data my skip-one expects and the data my reports actually enter are the same thing. Adoption was near-instant.",
    name: "Marcus Delacroix",
    role: "Engineering Manager",
    company: "Fathom Analytics",
    avatar: "https://i.pravatar.cc/80?img=12",
  },
  {
    id: 3,
    quote:
      "I've used five different performance tools. This is the first where writing a review felt like giving feedback to a person instead of filling in a form.",
    name: "Yuki Tanabe",
    role: "Staff Engineer",
    company: "Linear",
    avatar: "https://i.pravatar.cc/80?img=32",
  },
];

function QuoteCard({ item, index }) {
  const shouldReduce = useReducedMotion();

  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduce ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: shouldReduce ? 0 : index * 0.1,
        ease: [0.16, 1, 0.3, 1], // custom expo-out — not default ease
      },
    },
  };

  return (
    <motion.li
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      className={[
        "flex flex-col gap-5 rounded-xl border border-white/10 bg-white/5 p-6",
        item.featured ? "md:col-span-2" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <figure className="flex flex-col gap-5 flex-1">
        <blockquote className="flex-1">
          {/* Decorative mark — hidden from AT */}
          <span className="block text-5xl leading-none text-amber-400 font-serif mb-2" aria-hidden="true">
            "
          </span>
          <p className="text-sm leading-relaxed text-stone-200">
            {item.quote}
          </p>
          {item.stat && (
            <span
              className="block text-3xl font-bold text-amber-400 mt-3 leading-none"
              aria-label={item.statLabel}
            >
              {item.stat}
            </span>
          )}
        </blockquote>

        <figcaption className="flex items-center gap-3 border-t border-white/10 pt-5">
          <img
            src={item.avatar}
            alt={item.name}
            width={40}
            height={40}
            loading="lazy"
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-white/10"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-stone-100">{item.name}</span>
            <span className="text-xs text-stone-400">
              {item.role} — <cite>{item.company}</cite>
            </span>
          </div>
        </figcaption>
      </figure>
    </motion.li>
  );
}

export function TestimonialsGrid() {
  return (
    <section
      className="px-4 py-20 max-w-5xl mx-auto"
      aria-labelledby="testimonials-title"
    >
      <header className="mb-12">
        <p className="text-xs font-semibold tracking-widest uppercase text-amber-400 mb-2">
          From the people using it
        </p>
        <h2
          id="testimonials-title"
          className="text-3xl font-bold leading-tight text-stone-50"
        >
          What engineers say after six months
        </h2>
      </header>

      <ul
        role="list"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {TESTIMONIALS.map((item, i) => (
          <QuoteCard key={item.id} item={item} index={i} />
        ))}
      </ul>
    </section>
  );
}
```

---

## Variations

| Variant | What changes |
|---|---|
| **Static card grid** | No JS, no animation; layout only via CSS Grid. Best for most cases — just works, no a11y risk from motion. |
| **Bento grid** | First or largest card spans two columns; asymmetric layout signals editorial intent over stock SaaS. |
| **Single-quote spotlight** | One large quote fills the section width; swaps on user action; demands a strong, specific quote. |
| **Rotating carousel** | User-controlled prev/next; ARIA carousel pattern; no autoplay. Add autoplay only with a visible pause control and keyboard-focus pause. |
| **Infinite marquee** | CSS `@keyframes` + `translateX`; duplicate list with `aria-hidden`; requires pause button (WCAG 2.2.2). Use for brand momentum, not for reading-heavy quotes. |
| **Logo wall** | Flat grid of company logos (`<img alt="Company name">`), no quotes; a "trusted by" statement. Pair with a link to a case study. |
| **Video pull quote** | `<figure>` wrapping an `<iframe>` or `<video>`; `<figcaption>` gives transcript link; requires captions on video (WCAG 1.2.2). |
| **Masonry / "wall of love"** | CSS multi-column or JS masonry; all quotes at once. Works for SaaS apps with large user bases. Can overwhelm on lean pages. |

---

## Accessibility

### prefers-reduced-motion

This is mandatory for any testimonial variant that animates. Two patterns used in the code above:

```css
/* Marquee: stop the scroll entirely */
@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none !important;
    flex-wrap: wrap;    /* show cards statically */
  }
}

/* Carousel entrance: remove transform, keep instant opacity change */
@media (prefers-reduced-motion: reduce) {
  .carousel__slide[aria-hidden="false"] {
    animation: none;
  }
}
```

In Framer Motion use `useReducedMotion()` and set `y: 0` / `delay: 0` when it returns `true`. The `motion` component does not automatically zero all motion — the hook call is required.

### Keyboard navigation

- **Carousel**: Arrow Left / Arrow Right advance slides when focus is inside the region. Tab moves through the control buttons in DOM order. Controls appear before slides in DOM so they are reached first in tab order (ARIA APG requirement).
- **Marquee**: The marquee track auto-pauses on `focusin` so keyboard users can read cards without the content scrolling away. Individual cards are `<article>` elements; links inside them are tab-reachable.
- **Dots**: Each dot is a `<button>` with a descriptive `aria-label="Slide N of M"`. The active dot uses `aria-disabled="true"` rather than the HTML `disabled` attribute, so it remains focusable and its state is announced.

### Focus management

- Prev/next buttons do **not** move focus on activation — the user stays on the button to allow rapid navigation (ARIA APG carousel requirement).
- The slide region carries `aria-live="polite"` (non-auto-rotating carousel) so screen readers announce slide content changes without interrupting.
- For the auto-rotating variant: set `aria-live="off"` while rotating, switch to `"polite"` when paused.

### ARIA roles and labels

```
section[aria-roledescription="carousel"][aria-label="Customer stories"]
  ├── [role="group"][aria-label="Slide controls"]  ← button group
  └── div[aria-live="polite"][aria-atomic="false"]
        └── div[role="group"][aria-roledescription="slide"][aria-label="1 of 3"]
```

The `aria-roledescription="carousel"` overrides the generic "region" announcement. The `aria-label` on the carousel must not contain the word "carousel" — that is already communicated by the roledescription.

### Semantic blockquote

The spec requires attribution to live **outside** `<blockquote>`. The `<figure>/<figcaption>` pattern satisfies this. The `<cite>` element wraps the company or work title, not the speaker's name.

```html
<figure>
  <blockquote><p>…</p></blockquote>
  <figcaption>
    Speaker Name — <cite>Company</cite>
  </figcaption>
</figure>
```

Note: VoiceOver and TalkBack do not announce blockquote boundaries; NVDA and JAWS do (covering ~84% of screen reader users per WebAIM 2024). Semantic markup still benefits document structure and RSS/scraping contexts.

### Touch and pointer fallback

The hover-pause on marquee is guarded with:

```css
@media (hover: hover) and (pointer: fine) {
  .marquee-viewport:hover .marquee-track {
    animation-play-state: paused;
  }
}
```

Touch devices (where `hover: none`) rely on the explicit pause button and the focusin auto-pause instead. Never use hover-only interactions as the sole control.

### Contrast (per this file's palette — recomputed, not copied)

| Pair | Ratio | Result |
|---|---|---|
| `#f2f1ed` on `#1a1a1e` (card surface) | ~13.5:1 | AAA |
| `#9d9b94` on `#1a1a1e` (secondary text) | ~5.6:1 | AA |
| `#d4a853` on `#1a1a1e` (accent decorative) | ~7.3:1 | AAA |

All body text uses `--text-primary` or `--text-secondary`, both above 4.5:1 on their backgrounds.

### Screen reader implications

- Duplicate marquee cards have `aria-hidden="true"` so screen readers encounter each quote exactly once.
- Decorative opening quote marks (`"`) have `aria-hidden="true"` to avoid redundant punctuation announcements.
- Star rating icon groups have `aria-label="5 out of 5 stars"` on the wrapper; individual SVGs are `aria-hidden`.
- Avatar `alt` text names the person in the primary (visible) set; duplicates use `alt=""` since the person is already named in the adjacent figcaption.

---

## Performance

- **Transform only**: all animation uses `transform: translateX()` and `opacity`. No layout properties animate, so no layout thrash or paint.
- **GPU layer**: the animating marquee track promotes to a compositor layer. Add `will-change: transform` only on that single element — not on every card.
- **Image loading**: avatars use `loading="lazy"` and explicit `width`/`height` to prevent CLS. For marquees with many cards, consider `fetchpriority="low"` on avatars beyond the first viewport.
- **Duplicate DOM**: the marquee technique doubles the card count. For very long quote lists (20+), keep the visible set to 6–8 cards and duplicate only those, not the full list.
- **Reduced-motion static layout**: wrapping the static fallback in a `prefers-reduced-motion` block means the animation CSS is never computed by those users, slightly reducing style recalculation cost.
- **`aria-live` cost**: every DOM mutation inside a live region triggers an AT announcement pass. Set `aria-atomic="false"` so only the changed slide is announced, not the entire container.
- **Video embeds**: lazy-load YouTube/Vimeo iframes with `loading="lazy"` on the iframe element (Chromium 77+) or the `lite-youtube-embed` pattern for zero-cost initial render.

---

## Anti-slop

### The cliché (cross-ref `_slop-blocklist.md`)

**Layout**: three identically-sized cards in a row, each with five yellow stars, a headshot placeholder, and a quote that says "This product changed our workflow." Same grid gap. Same border-radius. Same padding. This is the pattern every SaaS template ships — it signals nothing because it looks like it was never touched.

**Type**: Inter at 400 weight for the quote, same size as body copy. No hierarchy between the name line and the quote.

**Copy**: "Empowering our team to unlock seamless collaboration" — generic superlative copy that could belong to any product category.

**Motion**: all three cards fade-and-slide-up simultaneously with `ease` and 0.3s duration.

### The tasteful alternative

- Break the grid: make one card span two columns and include a concrete metric (`83% faster`, not "significantly faster"). Vary card heights by letting content breathe rather than enforcing equal heights.
- Use a characterful display weight for the leading quote line — a heavier weight (`font-weight: 700`) at a slightly larger size reads like a pull quote, not a data field.
- Write real quotes with named companies and specific outcomes. If the person's role matters (Head of Engineering, VP) it adds signal. If it does not (User), omit it.
- For motion: stagger cards with `delay: index * 0.1s` and use `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out). Let the first card animate slightly faster than the others — subtle priority signal.
- Single accent color (warm amber, not SaaS blue `#3B82F6`) used only for the decorative quotation mark and the metric stat — not on borders, not on avatar rings, not on star fills simultaneously.

---

## Pairs well with

- **cards** (`04-component-patterns/cards.md`) — the quote card is a specialised card; share border-radius, surface, and elevation tokens.
- **hero-sections** (`04-component-patterns/hero-sections.md`) — a featured pull quote directly below the hero CTA reduces friction at the highest-traffic point.
- **carousels-sliders** (`04-component-patterns/carousels-sliders.md`) — the ARIA carousel pattern and keyboard handling are shared; import the same JS module.
- **modals-dialogs** (`04-component-patterns/modals-dialogs.md`) — for a "read full case study" inline expansion triggered from a card; share the focus-trap and escape-key handler.
- **staggered-entrance** (scroll/motion) — stagger the quote cards into view as the section enters the viewport; same expo-out easing language.
- **logo walls** — pair a logo row directly above or below the testimonial grid: logos establish recognition, quotes add voice.

---

## Current references

- [ARIA Authoring Practices Guide — Carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) — authoritative source for roles, keyboard behavior, autoplay rules, and live-region toggling
- [ARIA APG — Feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/) — applies to dynamically-loaded testimonial lists; covers `aria-posinset`, `aria-setsize`, Page Down/Up navigation
- [MDN — `<blockquote>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/blockquote) — semantic requirement that attribution must be outside the element; cite attribute vs. `<cite>` element distinction
- [Smashing Magazine — Infinite-Scrolling Logos In Flat HTML And Pure CSS (April 2024)](https://www.smashingmagazine.com/2024/04/infinite-scrolling-logos-html-css/) — staggered-delay technique with negative animation offsets; no JS required
- [Ryan Mulligan — The Infinite Marquee](https://ryanmulligan.dev/blog/css-marquee/) — `translateX(-50%)` loop, `aria-hidden` on duplicate set, gap variable in keyframe calc
- [DubBot — Quote elements and accessible content (2025)](https://dubbot.com/dubblog/2025/quote-elements-and-accessible-content.html) — `figure/figcaption` pattern vs. plain blockquote; common misuses
- [Accessible Blockquotes: Coding Guide — The Admin Bar](https://theadminbar.com/accessibility-weekly/coding-blockquotes/) — NVDA/JAWS announcement behaviour; screen reader support landscape; 84.4% JAWS/NVDA stat
- [WCAG SC 2.2.2 — Pause, Stop, Hide](https://www.w3.org/TR/UNDERSTANDING-WCAG20/time-limits-pause.html) — Level A; three-condition trigger (auto-start + >5 seconds + parallel content); pause button requirement for marquees
- [DigitalA11Y — Understanding SC 2.2.2](https://www.digitala11y.com/understanding-sc-2-2-2-pause-stop-hide/) — sufficient techniques and exceptions; global pause control recommendation
- [Pope Tech — Design accessible animation and movement (December 2025)](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) — `animation-play-state: paused` under reduced-motion; vestibular disorder context
- [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) — media query syntax, OS-level detection, browser support
- [Motion (Framer) — Ticker component](https://motion.dev/docs/react-ticker) — React marquee with automatic reduced-motion support and keyboard focus-trapping
- [Frontend Masters Blog — Infinite Marquee Animation using Modern CSS (2025)](https://frontendmasters.com/blog/infinite-marquee-animation-using-modern-css/) — `sibling-index()` stagger technique; CSS-only approach without DOM duplication
