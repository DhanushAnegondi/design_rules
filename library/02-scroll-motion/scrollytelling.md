# Scrollytelling

> A narrative told by scrolling: a graphic stays pinned while stepped text scrolls past it, and each step crossing a trigger updates the graphic's state.

**Bucket:** scroll/motion
**Maturity:** evergreen
**Effort:** high
**Best for:** websites, data-viz storytelling, editorial/journalism, product explainers, portfolios

## What it is
A pinned (sticky) "graphic" column holds in view while a column of text "steps"
scrolls past it. As each step crosses a trigger line, the active step changes and
the graphic mutates to match — a chart redraws, a map pans, a 3D model rotates, a
counter ticks. The reader perceives a single sticky stage that responds to where
they are in the story; the scrollbar becomes the narrative clock. This is the
pattern behind New York Times, Bloomberg, The Pudding, and Reuters interactives. The
key tension is discrete vs scrubbed: steps either snap the graphic to a new state
(IntersectionObserver) or smoothly interpolate it with scroll progress (GSAP scrub).

## When to use
- Sequenced explanation where order is the argument: "first this happened, then this,
  then this."
- Data-viz storytelling — annotate one chart through several states instead of showing
  five separate charts for the reader to compare.
- Walking a reader through a process, a map route, a historical timeline, or a 3D model.
- Product explainers where each scroll step reveals one capability against a fixed
  hero visual, reducing cognitive load from presenting everything at once.
- When pacing control matters: the story advances only as fast as the reader scrolls.

## When NOT to use
- Reference content people scan or ctrl-F search — scrollytelling hides everything
  except the current step, which is hostile to skimming and find-in-page.
- Short messages that fit one screen; the sticky machinery is significant overhead.
- Dense data tables or anything the reader needs to compare side by side.
- Primary navigation or task flows — never gate a required action behind a scroll step.
- **The everyone-overuses-this case:** a marketing landing page where each unrelated
  feature section is wrapped in a pinned "step" purely to feel premium. If the steps
  aren't a genuine ordered sequence, you have built a slow, inaccessible carousel.
  Use a normal section stack instead.

## How it works
The mechanism has two halves: **pin the graphic** and **detect the active step**.

1. **Pin** — the graphic column is `position: sticky; top: 0` inside a tall wrapper.
   It sticks while its taller text sibling scrolls, then releases when the wrapper
   ends. CSS handles this with zero JS; GSAP's `pin: true` is an alternative when
   you also need scrub interpolation.
2. **Detect** — an `IntersectionObserver` watches each step element against a thin
   trigger band (via `rootMargin`, e.g. `-45% 0px -45% 0px` collapses the
   observation zone to a 10 vh band at the viewport's vertical centre). When a step
   enters that band it becomes active; you read its `data-step` attribute and mutate
   the graphic. This gives *triggered* (discrete state-change) behaviour.

For *scrubbed* behaviour (graphic interpolates continuously with scroll), replace the
observer with a GSAP `scrollTrigger: { scrub: 0.6 }` that drives a tween on a
progress object; the graphic reads that value in `onUpdate`.

Key APIs and tools, best-first:

- **IntersectionObserver (vanilla)** — discrete step detection, no library, the
  lightest correct foundation. `rootMargin` defines the trigger band; `threshold: 0`
  fires as soon as a single pixel crosses.
- **Scrollama.js** — a ~2 KB wrapper over IntersectionObserver purpose-built for the
  step-graphic pattern (`onStepEnter`, `onStepExit`, named offset line). The
  journalism default; used by The Pudding and many data-news teams.
- **GSAP ScrollTrigger** — when you also need scrubbed tweens (smoothly interpolate
  the graphic between steps tied to scroll progress) plus `pin`, `snap`, and timeline
  labelling.
- **Native CSS `animation-timeline: scroll()/view()`** — drives continuous graphic
  motion (a progress fill, a scrubbed reveal) but cannot by itself switch *discrete*
  text-driven state, so the active-step logic stays in JS. Browser support: Chrome
  115+, Edge 115+, Safari 26+ — Firefox does not support it at default settings (as
  of mid-2026). Use `@supports (animation-timeline: scroll())` to gate it.
- **CSS `container-type: scroll-state` / `@container scroll-state(stuck: top)`** —
  new (Chrome/Edge 133+, Feb 2025) allows styling the sticky graphic from CSS alone
  when it is stuck, eliminating one class-toggle pattern from JS.

## Working code

### Iframe-safe compact scrollytelling preview
This version keeps the scroll story inside a focused panel so the preview works in a sandboxed iframe. The pinned visual, active step, live label, and progress dots all update from `IntersectionObserver` with the panel as its root; the production full-page patterns remain below as source-only examples.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Compact scrollytelling preview</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 18px;
      font-family: ui-sans-serif, system-ui, sans-serif;
      background: linear-gradient(135deg, #f4efe3, #dfeaf0 58%, #f9e0cc);
      color: #15120d;
    }

    .story {
      width: min(760px, 100%);
      display: grid;
      grid-template-columns: minmax(230px, 0.9fr) minmax(260px, 1.1fr);
      height: 314px;
      border: 1px solid #15120d24;
      background: #fffdf7;
      box-shadow: 0 24px 70px #40506124;
      overflow: hidden;
    }

    .stage-wrap {
      position: relative;
      display: grid;
      place-items: center;
      padding: 18px;
      background:
        radial-gradient(circle at 50% 18%, var(--glow, #f4c47d) 0 16%, transparent 37%),
        linear-gradient(160deg, #1a1713, #273b36);
      color: white;
    }

    .stage {
      width: min(190px, 70%);
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      border-radius: 24px;
      background: var(--card, #f5d49d);
      color: #15120d;
      box-shadow: 0 22px 42px #00000045, inset 0 0 0 1px #ffffff66;
      transform: rotate(var(--tilt, -4deg)) scale(var(--scale, 1));
      transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1),
        background 420ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .icon {
      font-size: 4.5rem;
      line-height: 1;
      transform: translateY(var(--rise, 0));
      transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .caption {
      position: absolute;
      left: 18px;
      right: 18px;
      bottom: 16px;
      display: flex;
      justify-content: space-between;
      gap: 10px;
      font-size: 0.78rem;
      color: #f5efe2;
    }

    .dots { display: flex; gap: 6px; }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ffffff55;
    }
    .dot.is-active { background: #f5d49d; }

    .steps {
      height: 100%;
      overflow: auto;
      overscroll-behavior: contain;
      scroll-snap-type: y proximity;
      padding: 0 22px;
    }

    .step {
      min-height: 82%;
      display: grid;
      align-content: center;
      gap: 8px;
      scroll-snap-align: center;
      color: #766c60;
      opacity: 0.48;
      transition: color 250ms ease, opacity 250ms ease;
    }

    .step.is-active {
      color: #15120d;
      opacity: 1;
    }

    .step b {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0;
      color: #a9512d;
    }

    .step h2 {
      margin: 0;
      font: 760 1.55rem/1.05 ui-sans-serif, system-ui, sans-serif;
      letter-spacing: 0;
    }

    .step p {
      max-width: 31ch;
      margin: 0;
      line-height: 1.48;
      font-size: 0.93rem;
    }

    .steps:focus-visible {
      outline: 3px solid #a9512d;
      outline-offset: -5px;
    }

    @media (max-width: 640px) {
      body { place-items: stretch; }
      .story { grid-template-columns: 1fr; height: auto; }
      .stage-wrap { min-height: 168px; }
      .stage { width: 116px; border-radius: 18px; }
      .icon { font-size: 3rem; }
      .steps { height: 206px; }
      .step { min-height: 88%; }
    }

    @media (prefers-reduced-motion: reduce) {
      .stage,
      .icon,
      .step {
        transition: none;
      }
      .step {
        opacity: 1;
        color: #15120d;
      }
    }
  </style>
</head>
<body>
  <main class="story">
    <section class="stage-wrap" aria-live="polite" aria-label="Step 1: Seed">
      <div class="stage" id="stage" aria-hidden="true">
        <div class="icon" id="icon">1</div>
      </div>
      <div class="caption">
        <span id="label">Seed</span>
        <span class="dots" aria-hidden="true">
          <i class="dot is-active"></i><i class="dot"></i><i class="dot"></i>
        </span>
      </div>
    </section>

    <section class="steps" tabindex="0" aria-label="Scroll story steps">
      <article class="step is-active" data-step="1" data-title="Seed">
        <b>Step 01</b>
        <h2>Plant the claim.</h2>
        <p>The story begins with one small fact. The graphic stays pinned while the reader gets oriented.</p>
      </article>
      <article class="step" data-step="2" data-title="Root">
        <b>Step 02</b>
        <h2>Change the state.</h2>
        <p>When this step crosses the trigger band, the stage updates instead of sending the reader to a new section.</p>
      </article>
      <article class="step" data-step="3" data-title="Canopy">
        <b>Step 03</b>
        <h2>Land the result.</h2>
        <p>The final step resolves the visual, making the sequence feel like one controlled argument.</p>
      </article>
    </section>
  </main>

  <script>
    const steps = [...document.querySelectorAll('.step')];
    const scroller = document.querySelector('.steps');
    const stageWrap = document.querySelector('.stage-wrap');
    const stage = document.querySelector('#stage');
    const icon = document.querySelector('#icon');
    const label = document.querySelector('#label');
    const dots = [...document.querySelectorAll('.dot')];

    const states = {
      '1': { label: 'Seed', icon: '1', card: '#f5d49d', glow: '#f4c47d', tilt: '-4deg', scale: '1', rise: '0' },
      '2': { label: 'Root', icon: '2', card: '#a8d4b0', glow: '#9fdeb4', tilt: '4deg', scale: '1.04', rise: '-3px' },
      '3': { label: 'Canopy', icon: '3', card: '#9ec5e9', glow: '#9ed8f4', tilt: '0deg', scale: '1.1', rise: '-8px' }
    };

    function activate(el) {
      const n = el.dataset.step;
      const state = states[n];
      steps.forEach((step) => step.classList.toggle('is-active', step === el));
      dots.forEach((dot, index) => dot.classList.toggle('is-active', index === Number(n) - 1));
      stage.style.setProperty('--card', state.card);
      stage.style.setProperty('--tilt', state.tilt);
      stage.style.setProperty('--scale', state.scale);
      icon.style.setProperty('--rise', state.rise);
      stageWrap.style.setProperty('--glow', state.glow);
      icon.textContent = state.icon;
      label.textContent = state.label;
      stageWrap.setAttribute('aria-label', `Step ${n}: ${state.label}`);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) activate(entry.target);
      });
    }, {
      root: scroller,
      rootMargin: '-38% 0px -38% 0px',
      threshold: 0
    });

    steps.forEach((step) => observer.observe(step));
  </script>
</body>
</html>
```

### Native CSS sticky pin + IntersectionObserver step state (vanilla, no library)
CSS does the pin; a handful of JS lines swap the active step. Self-contained;
paste into an `.html` file and open.

```html
<!-- Source-only full-page vanilla pattern; compact live preview is above. -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Scrollytelling — seed to forest</title>
  <style>
    :root {
      --bg:     #14110d;  /* near-black warm ground                        */
      --ink:    #f3efe7;  /* active text    — contrast on --bg: 16.41:1 AAA */
      --muted:  #8c8377;  /* dimmed steps   — contrast on --bg:  5.04:1 AA  */
      --accent: #e8551f;  /* burnt orange   — contrast on --bg:  5.15:1 AA  */
      /* --bg on --accent (step-3 label): 5.15:1 AA */
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: "Georgia", ui-serif, serif;
      line-height: 1.6;
    }

    /* ── Intro / outro frames ────────────────────────── */
    .frame {
      min-height: 70vh;
      display: grid;
      place-items: center;
      padding: 2rem;
      text-align: center;
    }
    .frame p {
      max-width: 38ch;
      font-size: clamp(1rem, 2.5vw, 1.25rem);
    }

    /* ── Two-column scrolly wrapper ─────────────────── */
    .scrolly {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4vw;
      max-width: 1100px;
      margin-inline: auto;
      padding-inline: 4vw;
    }

    /* ── LEFT: pinned graphic ────────────────────────── */
    .graphic {
      position: sticky;
      top: 0;
      height: 100vh;
      display: grid;
      place-items: center;
      /* scroll-state query hook (Chrome/Edge 133+) */
      container-type: scroll-state;
      container-name: graphic;
    }
    .stage {
      width: min(38vw, 340px);
      aspect-ratio: 1;
      border-radius: 14px;
      display: grid;
      place-items: center;
      font: 700 clamp(2rem, 6vw, 4rem) / 1 ui-sans-serif, system-ui, sans-serif;
      background: #1f1b15;
      color: var(--accent);
      /* Property transitions — transform+opacity only, compositor-safe */
      transition:
        background 0.5s cubic-bezier(0.16, 1, 0.3, 1),
        color       0.5s cubic-bezier(0.16, 1, 0.3, 1),
        transform   0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Step-driven graphic states */
    .stage[data-active="1"] {
      transform: scale(1.00) rotate(0deg);
      background: #221a12;
    }
    .stage[data-active="2"] {
      transform: scale(1.08) rotate(-3deg);
      background: #26201a;
    }
    .stage[data-active="3"] {
      transform: scale(1.16) rotate(3deg);
      background: var(--accent);
      color: var(--bg);           /* #14110d on #e8551f — 5.15:1 AA */
    }

    /* CSS scroll-state: show a "stuck" indicator when graphic is pinned
       (Chrome/Edge 133+, progressive enhancement) */
    @container graphic scroll-state(stuck: top) {
      .stage::after {
        content: "pinned";
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        font: 500 0.65rem / 1 ui-monospace, monospace;
        color: var(--muted);
        letter-spacing: 0.05em;
      }
    }

    /* ── RIGHT: scrolling text steps ────────────────── */
    .steps {
      display: flex;
      flex-direction: column;
    }
    .step {
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      color: var(--muted);
      opacity: 0.5;
      transition: opacity 0.4s ease, color 0.4s ease;
    }
    .step.is-active {
      opacity: 1;
      color: var(--ink);
    }
    .step h2 {
      font-size: clamp(1.4rem, 3vw, 2.2rem);
      margin: 0 0 0.5rem;
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-weight: 700;
    }
    .step p { max-width: 38ch; margin: 0; }

    /* ── Reduced motion ─────────────────────────────── */
    /* All transforms and opacity fades are cut. Every step shows at full
       legibility immediately. The story remains readable without any motion. */
    @media (prefers-reduced-motion: reduce) {
      .stage {
        transition: none;
        transform: none !important;
      }
      .step {
        opacity: 1 !important;
        color: var(--ink) !important;
        transition: none;
      }
    }

    /* ── Narrow / touch layout ──────────────────────── */
    /* Unpin the graphic and stack inline. Touch users get a normal
       document; no stranded sticky element on a small screen. */
    @media (max-width: 720px) {
      .scrolly {
        grid-template-columns: 1fr;
      }
      .graphic {
        position: static;
        height: auto;
        margin-block: 2rem;
      }
      .stage {
        width: min(80vw, 320px);
      }
      .step {
        min-height: auto;
        margin-block: 2.5rem;
        opacity: 1;
        color: var(--ink);
      }
    }
  </style>
</head>
<body>

  <!-- Accessible fallback summary — readable with or without JS/scroll -->
  <details style="margin:1rem auto;max-width:700px;padding:1rem;
                  background:#1f1b15;border-radius:8px;color:var(--muted);
                  font-family:ui-sans-serif,sans-serif;font-size:0.9rem;">
    <summary style="cursor:pointer;color:var(--ink);">Read as plain text (accessible version)</summary>
    <p><strong>Germination:</strong> A single seed splits and pushes a root downward into cool soil.</p>
    <p><strong>Sapling:</strong> Years pass. The stem hardens to bark and reaches for light.</p>
    <p><strong>Canopy:</strong> Decades on, it shades the ground that once held one seed.</p>
  </details>

  <section class="frame">
    <p>How a seed becomes a forest. Scroll to walk the three stages.</p>
  </section>

  <div class="scrolly">
    <!-- Pinned graphic — labelled for screen readers -->
    <div class="graphic" role="img" aria-live="polite" aria-label="Stage 1: Germination">
      <div class="stage" id="stage" data-active="1">01</div>
    </div>

    <!-- Text steps — ordinary headings + paragraphs, readable without JS -->
    <div class="steps">
      <section class="step is-active" data-step="1">
        <h2>Germination</h2>
        <p>A single seed splits and pushes a root downward into cool soil. Nothing visible yet — only chemistry.</p>
      </section>
      <section class="step" data-step="2">
        <h2>Sapling</h2>
        <p>Years pass. The stem hardens to bark, the root system fans out, and the first branches reach for light.</p>
      </section>
      <section class="step" data-step="3">
        <h2>Canopy</h2>
        <p>Decades on, the tree shades the same ground that once held one seed. The cycle begins again.</p>
      </section>
    </div>
  </div>

  <section class="frame">
    <p>One sequence, one sticky stage — that is scrollytelling.</p>
  </section>

<script>
  const stage   = document.getElementById('stage');
  const graphic = stage.closest('[aria-live]');
  const steps   = document.querySelectorAll('.step');
  const reduce  = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Labels for the aria-live region — updated on each step change so
  // screen readers announce what state the graphic is in.
  const labels = {
    '1': 'Stage 1: Germination',
    '2': 'Stage 2: Sapling',
    '3': 'Stage 3: Canopy',
  };
  const display = { '1': '01', '2': '02', '3': '03' };

  function activateStep(el) {
    steps.forEach(s => s.classList.remove('is-active'));
    el.classList.add('is-active');
    const n = el.dataset.step;
    stage.dataset.active = n;
    stage.textContent    = display[n];
    // Update aria-live only if the graphic carries meaning the prose doesn't
    graphic.setAttribute('aria-label', labels[n]);
  }

  // Trigger band: a thin slice through the vertical centre of the viewport.
  // rootMargin of -45% top and -45% bottom collapses the observation zone
  // to a ~10 vh band — the step that "owns" the centre is active.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) activateStep(e.target);
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  // Wire up detection regardless of reduced-motion preference.
  // CSS already neutralises the transforms and fades when reduce is true;
  // the step label/number still updates so the graphic stays contextual.
  steps.forEach(s => io.observe(s));
</script>
</body>
</html>
```

### Scrollama.js (the journalism standard)
Scrollama wraps IntersectionObserver and adds a named offset line, step-progress
events, and automatic ResizeObserver updates. Full standalone file — paste into an
`.html` file and open directly.

```html
<!-- Source-only Scrollama production pattern; external scripts stay out of the live iframe. -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Scrollytelling — Scrollama variant</title>
  <style>
    :root {
      --bg:     #14110d;
      --ink:    #f3efe7;  /* on --bg: 16.41:1 AAA */
      --muted:  #8c8377;  /* on --bg:  5.04:1 AA  */
      --accent: #e8551f;  /* on --bg:  5.15:1 AA  */
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: "Georgia", ui-serif, serif;
      line-height: 1.6;
    }
    .frame {
      min-height: 70vh;
      display: grid;
      place-items: center;
      padding: 2rem;
      text-align: center;
    }
    .frame p {
      max-width: 38ch;
      font-size: clamp(1rem, 2.5vw, 1.25rem);
    }
    .scrolly {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4vw;
      max-width: 1100px;
      margin-inline: auto;
      padding-inline: 4vw;
    }
    .graphic {
      position: sticky;
      top: 0;
      height: 100vh;
      display: grid;
      place-items: center;
    }
    .stage {
      width: min(38vw, 340px);
      aspect-ratio: 1;
      border-radius: 14px;
      display: grid;
      place-items: center;
      font: 700 clamp(2rem, 6vw, 4rem) / 1 ui-sans-serif, system-ui, sans-serif;
      background: #1f1b15;
      color: var(--accent);
      transition:
        background 0.5s cubic-bezier(0.16, 1, 0.3, 1),
        color       0.5s cubic-bezier(0.16, 1, 0.3, 1),
        transform   0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .stage[data-active="1"] { transform: scale(1.00) rotate(0deg);  background: #221a12; }
    .stage[data-active="2"] { transform: scale(1.08) rotate(-3deg); background: #26201a; }
    .stage[data-active="3"] {
      transform: scale(1.16) rotate(3deg);
      background: var(--accent);
      color: var(--bg);   /* #14110d on #e8551f — 5.15:1 AA */
    }
    .steps { display: flex; flex-direction: column; }
    .step {
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      color: var(--muted);
      opacity: 0.5;
      transition: opacity 0.4s ease, color 0.4s ease;
    }
    .step.is-active { opacity: 1; color: var(--ink); }
    .step h2 {
      font-size: clamp(1.4rem, 3vw, 2.2rem);
      margin: 0 0 0.5rem;
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-weight: 700;
    }
    .step p { max-width: 38ch; margin: 0; }

    /* Reduced motion — cut all transitions and show every step at full legibility */
    @media (prefers-reduced-motion: reduce) {
      .stage { transition: none; transform: none !important; }
      .step  { opacity: 1 !important; color: var(--ink) !important; transition: none; }
    }

    /* Touch / narrow layout — unpin graphic, stack inline */
    @media (max-width: 720px) {
      .scrolly { grid-template-columns: 1fr; }
      .graphic { position: static; height: auto; margin-block: 2rem; }
      .stage   { width: min(80vw, 320px); }
      .step    { min-height: auto; margin-block: 2.5rem; opacity: 1; color: var(--ink); }
    }
  </style>
</head>
<body>

  <details style="margin:1rem auto;max-width:700px;padding:1rem;
                  background:#1f1b15;border-radius:8px;color:var(--muted);
                  font-family:ui-sans-serif,sans-serif;font-size:0.9rem;">
    <summary style="cursor:pointer;color:var(--ink);">Read as plain text (accessible version)</summary>
    <p><strong>Germination:</strong> A single seed splits and pushes a root downward into cool soil.</p>
    <p><strong>Sapling:</strong> Years pass. The stem hardens to bark and reaches for light.</p>
    <p><strong>Canopy:</strong> Decades on, it shades the ground that once held one seed.</p>
  </details>

  <section class="frame">
    <p>How a seed becomes a forest. Scroll to walk the three stages.</p>
  </section>

  <div class="scrolly">
    <div class="graphic" role="img" aria-live="polite" aria-label="Stage 1: Germination">
      <div class="stage" id="stage" data-active="1">01</div>
    </div>
    <div class="steps">
      <section class="step is-active" data-step="1">
        <h2>Germination</h2>
        <p>A single seed splits and pushes a root downward into cool soil. Nothing visible yet — only chemistry.</p>
      </section>
      <section class="step" data-step="2">
        <h2>Sapling</h2>
        <p>Years pass. The stem hardens to bark, the root system fans out, and the first branches reach for light.</p>
      </section>
      <section class="step" data-step="3">
        <h2>Canopy</h2>
        <p>Decades on, the tree shades the same ground that once held one seed. The cycle begins again.</p>
      </section>
    </div>
  </div>

  <section class="frame">
    <p>One sequence, one sticky stage — that is scrollytelling.</p>
  </section>

  <!-- polyfill for older browsers (optional, ~3 KB) -->
  <script src="https://unpkg.com/intersection-observer@0.12.2/intersection-observer.js"></script>
  <script src="https://unpkg.com/scrollama@3.2.0/build/scrollama.min.js"></script>
  <script>
    const stage   = document.getElementById('stage');
    const graphic = stage.closest('[aria-live]');
    const steps   = document.querySelectorAll('.step');

    const labels  = { '1': 'Stage 1: Germination', '2': 'Stage 2: Sapling', '3': 'Stage 3: Canopy' };
    const display = { '1': '01', '2': '02', '3': '03' };

    const scroller = scrollama();
    scroller
      .setup({
        step:     '.step',
        offset:   0.5,      // trigger when a step crosses the viewport midline
        progress: false,    // discrete steps, not scrubbed progress events
      })
      .onStepEnter(({ element }) => {
        steps.forEach(s => s.classList.remove('is-active'));
        element.classList.add('is-active');
        const n = element.dataset.step;
        stage.dataset.active = n;
        stage.textContent    = display[n];
        graphic.setAttribute('aria-label', labels[n]);
      });

    // Scrollama 3.x auto-calls resize via ResizeObserver; manual call kept as fallback
    window.addEventListener('resize', scroller.resize);

    // CSS @media (prefers-reduced-motion: reduce) neutralises all transforms and fades;
    // step detection still fires so the graphic number stays contextual.
  </script>
</body>
</html>
```

### GSAP ScrollTrigger (scrubbed graphic between steps)
Use when the graphic should interpolate smoothly with scroll — a counter ticking
from 0 to 100, a path drawing, a value bar filling — rather than snapping between
discrete states. GSAP pins the column and a scrubbed tween drives a value the
graphic reads on every frame. Full standalone file — paste into an `.html` file and
open directly.

```html
<!-- Source-only GSAP production pattern; external scripts stay out of the live iframe. -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Scrollytelling — GSAP scrubbed variant</title>
  <style>
    :root {
      --bg:     #14110d;
      --ink:    #f3efe7;  /* on --bg: 16.41:1 AAA */
      --muted:  #8c8377;  /* on --bg:  5.04:1 AA  */
      --accent: #e8551f;  /* on --bg:  5.15:1 AA  */
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: "Georgia", ui-serif, serif;
      line-height: 1.6;
    }
    .frame {
      min-height: 70vh;
      display: grid;
      place-items: center;
      padding: 2rem;
      text-align: center;
    }
    .frame p {
      max-width: 38ch;
      font-size: clamp(1rem, 2.5vw, 1.25rem);
    }
    /* scrolly: no CSS sticky here — GSAP pin manages the graphic column */
    .scrolly {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4vw;
      max-width: 1100px;
      margin-inline: auto;
      padding-inline: 4vw;
    }
    .graphic {
      height: 100vh;
      display: grid;
      place-items: center;
    }
    .stage {
      width: min(38vw, 340px);
      aspect-ratio: 1;
      border-radius: 14px;
      display: grid;
      place-items: center;
      font: 700 clamp(2rem, 6vw, 4rem) / 1 ui-sans-serif, system-ui, sans-serif;
      background: #221a12;
      color: var(--accent);
    }
    .stage[data-active="1"] { background: #221a12; color: var(--accent); }
    .stage[data-active="2"] { background: #26201a; color: var(--accent); }
    .stage[data-active="3"] { background: var(--accent); color: var(--bg); }
    .steps { display: flex; flex-direction: column; }
    .step {
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      color: var(--muted);
    }
    .step h2 {
      font-size: clamp(1.4rem, 3vw, 2.2rem);
      margin: 0 0 0.5rem;
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-weight: 700;
    }
    .step p { max-width: 38ch; margin: 0; }

    /* Reduced motion — no transforms or fades; all steps readable at full legibility */
    @media (prefers-reduced-motion: reduce) {
      .stage { transition: none !important; }
      .step  { opacity: 1; color: var(--ink); }
    }

    /* Touch / narrow layout — stack inline, GSAP pin is skipped in JS below */
    @media (max-width: 720px) {
      .scrolly { grid-template-columns: 1fr; }
      .graphic { height: auto; margin-block: 2rem; }
      .stage   { width: min(80vw, 320px); }
      .step    { min-height: auto; margin-block: 2.5rem; color: var(--ink); }
    }
  </style>
</head>
<body>

  <details style="margin:1rem auto;max-width:700px;padding:1rem;
                  background:#1f1b15;border-radius:8px;color:var(--muted);
                  font-family:ui-sans-serif,sans-serif;font-size:0.9rem;">
    <summary style="cursor:pointer;color:var(--ink);">Read as plain text (accessible version)</summary>
    <p><strong>Germination (1%):</strong> A single seed splits and pushes a root downward into cool soil.</p>
    <p><strong>Sapling (50%):</strong> Years pass. The stem hardens to bark and reaches for light.</p>
    <p><strong>Canopy (100%):</strong> Decades on, it shades the ground that once held one seed.</p>
  </details>

  <section class="frame">
    <p>Watch the counter climb as you scroll — one number for every year of growth.</p>
  </section>

  <div class="scrolly">
    <div class="graphic" role="img" aria-live="polite" aria-label="Stage 1: Germination — year 1">
      <div class="stage" id="stage" data-active="1">1</div>
    </div>
    <div class="steps">
      <section class="step" data-step="1">
        <h2>Germination</h2>
        <p>A single seed splits and pushes a root downward into cool soil. Nothing visible yet — only chemistry.</p>
      </section>
      <section class="step" data-step="2">
        <h2>Sapling</h2>
        <p>Years pass. The stem hardens to bark, the root system fans out, and the first branches reach for light.</p>
      </section>
      <section class="step" data-step="3">
        <h2>Canopy</h2>
        <p>Decades on, the tree shades the same ground that once held one seed. The cycle begins again.</p>
      </section>
    </div>
  </div>

  <section class="frame">
    <p>One hundred years. One sticky stage. That is scrollytelling.</p>
  </section>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  <script>
    gsap.registerPlugin(ScrollTrigger);

    const reduce  = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.innerWidth <= 720;
    const stage   = document.getElementById('stage');
    const graphic = stage.closest('[aria-live]');

    const stepLabels = {
      '1': 'Stage 1: Germination — year 1',
      '2': 'Stage 2: Sapling — year 50',
      '3': 'Stage 3: Canopy — year 100',
    };

    if (reduce || isTouch) {
      // Skip pin and scrub entirely for reduced-motion preference or touch/narrow screens.
      // Jump to the final state so the story is complete and readable without any motion.
      stage.dataset.active = '3';
      stage.textContent    = '100';
      graphic.setAttribute('aria-label', stepLabels['3']);
    } else {
      const counter = { v: 1 };

      gsap.to(counter, {
        v: 100,
        ease: 'none',                   // linear — tracks scroll 1:1 before smoothing
        scrollTrigger: {
          trigger: '.scrolly',
          start:   'top top',
          end:     'bottom bottom',
          pin:     '.graphic',          // GSAP-managed pin (alternative to CSS sticky)
          scrub:   0.6,                 // 0.6 s catch-up smoothing; avoids trackpad jitter
          snap: {
            snapTo:   [0, 0.5, 1],      // three chapter points
            duration: 0.35,
            ease:     'cubic-bezier(0.16, 1, 0.3, 1)',
          },
          onUpdate(self) {
            // Classify into discrete steps based on progress for aria-label and bg color
            const step = self.progress < 0.33 ? '1' : self.progress < 0.67 ? '2' : '3';
            if (stage.dataset.active !== step) {
              stage.dataset.active = step;
              graphic.setAttribute('aria-label', stepLabels[step]);
            }
          },
        },
        onUpdate() {
          // Only animate transform and opacity on the counter text (compositor-safe)
          stage.textContent = Math.round(counter.v);
        },
      });
    }
  </script>
</body>
</html>
```

## Variations
- **Discrete vs scrubbed** — the primary knob. Discrete (IntersectionObserver/Scrollama)
  snaps the graphic to named states; scrubbed (GSAP scrub) interpolates a value
  continuously. Most editorial scrollytelling uses discrete; data animations often scrub.
- **Layout** — side-by-side (graphic left, steps right, the journalism default),
  full-bleed graphic with steps as floating cards overlaid on it (cinematic),
  or stacked (graphic above prose, no pin) for mobile-first contexts.
- **Graphic medium** — SVG/D3 chart that redraws, `<canvas>` or WebGL scene,
  `<video>` scrubbed by `currentTime`, a Mapbox map with `flyTo()`, or a CSS-only
  shape that transforms between states.
- **Trigger line position** — `offset: 0.33` or `rootMargin: '-33% 0px -67% 0px'`
  activates early (top third of viewport); `0.5` is centred reading; `0.75` delays
  commitment until the step is almost past — choose to match reading rhythm.
- **Step density** — one big idea per step (calmer, easier to make accessible) vs
  rapid micro-steps that feel like animation frames (harder to narrate accessibly;
  each step must carry meaningful prose even at speed).

## Accessibility
- **prefers-reduced-motion (mandatory, shown in every snippet)** — the CSS block
  removes all `transform` and opacity fades and sets every step to full opacity. The
  GSAP path skips the pin and scrub entirely and jumps to the final state. The story
  must be readable at whatever state it lands in without any transition completing.
- **Pointer/touch fallback (mandatory)** — none of the step detection depends on
  hover or a fine pointer; IntersectionObserver fires from scroll position, so touch,
  trackpad, keyboard-scroll, and switch-access all trigger it. The
  `@media (max-width: 720px)` block unpins the graphic and stacks each step inline so
  mobile/touch users get a normal readable document instead of a stranded sticky panel.
  The GSAP variant additionally checks `window.innerWidth <= 720` in JS and skips the
  pin and scrub entirely on narrow screens.
- **Readable without scroll and without JS** — story-critical meaning lives in the
  DOM as ordinary headings and paragraphs in correct reading order. If JS fails, every
  step is plain visible text. The `<details>` block above the scrolly container
  provides an always-visible plain-text summary — useful for screen readers stepping
  through sequentially, for print, and for reduced-motion contexts.
- **aria-live for graphic state changes** — `aria-live="polite"` on the graphic
  wrapper announces step transitions to screen readers. Use it only if the graphic
  state carries meaning the adjacent prose does not; do not fire it on every scroll
  frame. Per MDN, ensure the live region is in the DOM before content changes (it is,
  as a wrapper around the stage).
- **Contrast** — measured against `--bg #14110d` for pairs used in this file:
  `--ink #f3efe7` = 16.41:1 (AAA), `--muted #8c8377` = 5.04:1 (AA), burnt orange
  `--accent #e8551f` on bg = 5.15:1 (AA for large text/UI). Step 3 inverts:
  `--bg #14110d` on `--accent #e8551f` = 5.15:1 (AA). Inactive steps at `opacity: 0.5`
  applied to muted text would fail — guard this by ensuring the `--muted` base already
  passes at 1.0 opacity (it does at 5.04:1) or by using `opacity` only decoratively
  on elements that are not the sole source of the story's meaning.
- **Keyboard / focus** — steps activate on scroll position, not focus; keep any
  links, buttons, or form controls inside steps reachable by Tab and visibly focused
  (do not suppress `:focus-visible`). If a step contains an interactive graphic
  (a chart with clickable regions), those regions need role, label, and keyboard handlers.

## Performance
- Animate only `transform` and `opacity` on the graphic — compositor-friendly,
  no layout or paint thrash. Never animate `width`, `height`, `top`, or `box-shadow`
  on scroll-linked elements.
- **IntersectionObserver fires off the main thread scroll path** and only on threshold
  crossings — far cheaper than a `scroll` event listener that runs on every frame.
  If you must use a `scroll` listener (e.g. for custom easing), wrap the handler in
  `requestAnimationFrame` and read dimensions in the same frame to batch layout queries.
- `position: sticky` is compositor-managed; prefer it over GSAP `pin` when you do not
  also need scrub interpolation. GSAP `pin` wraps the element in a new container and
  injects padding — measure that the extra DOM changes do not affect surrounding layout.
- `will-change: transform` on the moving stage element helps the browser promote it
  to its own GPU layer before animation begins. Remove or scope it so it does not
  persist on every element across the page (one wasted GPU layer per permanent
  `will-change` element).
- GSAP `scrub: 0.4–1` (a number, not `true`) adds smoothing that prevents 1:1 jitter
  on high-precision trackpads; it also means the animation "catches up" on momentum
  flicks rather than lagging indefinitely.
- Bundle cost: vanilla IntersectionObserver = 0 KB added; Scrollama ≈ 2 KB gzipped;
  GSAP core + ScrollTrigger ≈ 40–50 KB gzipped. Pull GSAP only when you genuinely
  need scrub/snap/timeline labelling.
- WebGL or canvas graphics: cap `devicePixelRatio` at 2, throttle redraws to active
  steps rather than painting every frame, and dispose GPU buffers when the story
  section leaves the viewport to avoid cooking mobile CPUs on long pieces.

## Anti-slop
Cliché (see `_slop-blocklist.md` → MOTION and LAYOUT): every step is the same card
that **fades-and-slides-up with identical duration and default `ease`**, while the
"graphic" is a static gradient blob that never actually changes — a slow, locked-up
carousel wearing scrollytelling clothes. The other LAYOUT cliché: jamming four
unrelated product features into steps purely for the "premium" feel, when there is no
narrative sequence at all.

Tasteful alternative: make the graphic **genuinely change state** per step (different
data encoding, different camera position, a measured value that advances), vary which
property changes between steps (scale in step 1, rotate in step 2, color inversion in
step 3) so the stage feels authored rather than templated, use expo/spring easing
`cubic-bezier(0.16, 1, 0.3, 1)` not `ease`, give steps asymmetric pacing (a longer
dwell on the climactic step), and commit to one brand hue plus one sharp accent rather
than the slop default of indigo-to-pink gradient on white. If the steps are not a true
ordered sequence, do not use scrollytelling at all.

## Pairs well with
- `sticky-pinning` — the pin is the literal foundation of this pattern; summarised:
  `position: sticky; top: 0` inside a tall wrapper holds the graphic while siblings
  scroll past it.
- `scroll-progress-indicator` — a thin top bar (drivable with native
  `animation-timeline: scroll()` in supporting browsers) orients the reader inside a
  long pinned story and signals how much remains.
- `text-reveal-on-scroll` — reveal each step's heading as it activates for added
  weight, using the same expo easing language; keep the reveal fast (<400 ms) so it
  does not delay reading.
- `data-viz` chart components — the graphic is often an annotated chart that redraws
  per step; always maintain a static fallback table (`<details>` or
  `aria-describedby`) for accessibility and no-JS cases.

## Current references
- [Scrollama.js — GitHub (russellsamora)](https://github.com/russellsamora/scrollama) — the canonical ~2 KB IntersectionObserver wrapper for step-based scrollytelling; the README covers setup, sticky pattern, and offset configuration
- [An Introduction to Scrollama.js — The Pudding](https://pudding.cool/process/introducing-scrollama/) — explains the sticky-graphic + stepped-text architecture and why IntersectionObserver beats scroll listeners for this use case (originally published November 2017; the Scrollama API — onStepEnter, onStepExit, sticky-graphic pattern — remains unchanged and accurate as of Scrollama 3.x, 2025)
- [An Introduction to CSS Scroll-Driven Animations — Smashing Magazine (Mariana Beldi, Dec 2024)](https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations/) — scroll() and view() progress timelines, animation-range, named view-timelines for cross-element sync
- [CSS property: animation-timeline scroll() — Can I Use](https://caniuse.com/mdn-css_properties_animation-timeline_scroll) — live support table; Chrome/Edge 115+, Safari 26+, Firefox not supported by default (checked April 2026, ~83 % global coverage)
- [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) — pin, scrub, snap, start/end syntax, and onUpdate callbacks for scrubbed graphic patterns
- [On-Scroll Animation Ideas for Sticky Sections — Codrops (Jan 2024)](https://tympanus.net/codrops/2024/01/31/on-scroll-animation-ideas-for-sticky-sections/) — eight demos of card-stacking and leave-viewport effects using CSS sticky + GSAP
- [CSS scroll-state() Container Queries — Chrome for Developers](https://developer.chrome.com/blog/css-scroll-state-queries) — how `@container scroll-state(stuck: top)` styles sticky elements when they are actually stuck (Chrome/Edge 133+, Feb 2025), removing the JS class-toggle for visual state
- [Scrollytelling examples — Shorthand](https://shorthand.com/the-craft/scrollytelling-examples/index.html) — annotated gallery of real editorial scroll stories covering data journalism, brand narrative, and accessible alternatives; page references "The Best Shorthand Stories of 2025," confirming content updated through 2025
