# Loading & skeletons

> Placeholder shapes that hold the layout while real content arrives — communicating that the system is working without leaving users staring at a blank screen.

**Bucket:** component
**Maturity:** current
**Effort:** medium
**Best for:** apps, dashboards, websites, portfolios

## What it is

A skeleton screen renders lightweight grey rectangles and lines that mirror the dimensions of the content being fetched. The page feels occupied before a single byte of real data lands. Unlike a spinner (which says "something is happening") or a progress bar (which quantifies how much is left), a skeleton says "here is roughly what you are about to see" — it converts dead waiting time into orientation time. The technique was popularized by Facebook in 2013 and is now the default loading pattern for content-heavy, container-based UIs like feeds, dashboards, and data tables.

There are two animation variants inside skeletons: shimmer (a moving highlight sweeping left to right) and pulse (an opacity fade). Shimmer implies directionality and active loading; pulse is stationary and preferred for users who need reduced motion.

## When to use

- Page sections that load structured content: card grids, article lists, data tables, user profiles, dashboards with multiple panels.
- When the layout is known before the data: the skeleton must resemble the real component or it worsens CLS and disorientation.
- Waits between roughly 300 ms and 10 seconds. Under 300 ms, show nothing; above 10 seconds, switch to a determinate progress bar so the user can estimate remaining time.
- Route transitions in single-page apps where the incoming page's shape is predictable.
- When you want to allow the user to continue scrolling/navigating past the loading zone while it fills in (e.g., infinite-scroll feeds).

## When NOT to use

- **Form submission and processing states** — the skeleton implies "content is coming here." After the user clicks Submit, a button spinner or inline progress is correct; a skeleton implies a content block will appear where there is none.
- **Waits under 300 ms** — adding a skeleton and immediately replacing it causes a flash that is more disorienting than just showing the content. Debounce the skeleton appearance by 200–300 ms.
- **Content whose shape you do not know in advance** — a skeleton that collapses or grows dramatically when real content arrives causes a layout shift worse than no skeleton. If you cannot predict dimensions, use a spinner instead.
- **Every single component on the page at once** — the "entire page shimmer" pattern is overused (see Anti-slop). Skeleton only the primary content zone; nav, sidebar chrome, and interactive controls should render immediately.
- **Optimistic actions** — liking, bookmarking, toggling a setting. Just update the UI immediately and roll back on failure; do not show a skeleton for sub-300 ms operations.
- **Error and empty states** — never leave a skeleton in place if the data request has already failed. Replace it with the appropriate error or empty state.

## How it works

A skeleton is a styled element — usually a `<div>` or `<span>` — whose dimensions (width, height, border-radius) approximate the real content. Background color is typically a neutral mid-grey (`#e2e5e7` on white, `#2a2d30` on dark). The animation sweeps a lighter gradient band across the element on a loop.

The shimmer is implemented as a `linear-gradient` background with `background-size: 200% 100%` and an `@keyframes` animation that moves `background-position` from `200% 0` to `-200% 0`. This is entirely `background-position` motion — no layout properties change — so it does not trigger reflow.

Key APIs and properties:

- `background: linear-gradient(90deg, #e2e5e7 25%, #f4f6f7 50%, #e2e5e7 75%)` — the shimmer gradient
- `background-size: 200% 100%` — oversizes the gradient so the band sweeps across
- `animation: shimmer 1.4s ease-in-out infinite` — drives the sweep
- `@media (prefers-reduced-motion: reduce)` — replaces shimmer with a static or opacity-pulsing fallback
- `aria-busy="true"` on the container — tells screen readers the region is updating; set to `false` when content lands
- `role="status"` with `aria-live="polite"` on a visually hidden element — announces the transition to and from the loading state
- `will-change: background-position` — promotes the element to its own compositor layer (use sparingly; only on the skeleton element itself)

To prevent cumulative layout shift (CLS), the skeleton element must have the same rendered dimensions as the final content. Use explicit `height`, `min-height`, or `aspect-ratio` that matches the real component. When real content arrives, it replaces the skeleton node in-place rather than appending after it.

## Working code

### Vanilla CSS + HTML — card skeleton with shimmer and reduced-motion fallback

This is a self-contained document. Paste into a `.html` file and open in a browser.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Skeleton loader demo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: system-ui, sans-serif;
      background: #f0f2f4;
      color: #1a1c1e;
      padding: 2rem;
      min-height: 100vh;
    }

    /* ── Layout ── */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
      max-width: 960px;
      margin: 0 auto;
    }

    .card {
      background: #fff;
      border-radius: 10px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 1px 1px rgba(0,0,0,.04);
    }

    /* ── Real content (hidden during loading) ── */
    .card-content { display: none; }
    .card-content .avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: #d1d5db; margin-bottom: .75rem;
      overflow: hidden;
    }
    .card-content h2 { font-size: 1rem; font-weight: 600; margin-bottom: .25rem; }
    .card-content p  { font-size: .875rem; color: #555; line-height: 1.5; }

    /* ── Skeleton base ── */
    .skeleton-item {
      background: #e2e5e7;
      border-radius: 4px;
      display: block;
      position: relative;
      overflow: hidden;   /* clips the shimmer pseudo-element */
    }

    /* Shimmer sweep — transform-only, no layout thrash */
    @keyframes shimmer {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .skeleton-item::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255,255,255,0.55) 50%,
        transparent 100%
      );
      animation: shimmer 1.4s ease-in-out infinite;
    }

    /* Reduced-motion: remove the sweep, keep a gentle static or opacity pulse */
    @media (prefers-reduced-motion: reduce) {
      .skeleton-item::after {
        animation: none;
        /* Stationary highlight — no movement */
        background: rgba(255,255,255,0.25);
      }
    }

    /* ── Skeleton shapes ── */
    .sk-avatar  { width: 48px; height: 48px; border-radius: 50%; margin-bottom: .75rem; }
    .sk-line    { height: 14px; margin-bottom: .5rem; border-radius: 4px; }
    .sk-line-w100 { width: 100%; }
    .sk-line-w75  { width: 75%; }
    .sk-line-w55  { width: 55%; }
    .sk-text-block { height: 11px; margin-bottom: .375rem; }

    /* ── Visually hidden utility (accessible, not display:none) ── */
    .sr-only {
      position: absolute; width: 1px; height: 1px;
      padding: 0; margin: -1px; overflow: hidden;
      clip: rect(0,0,0,0); white-space: nowrap; border: 0;
    }

    /* ── Demo controls ── */
    .demo-bar {
      max-width: 960px; margin: 0 auto 1.5rem;
      display: flex; align-items: center; gap: 1rem;
    }
    .demo-bar button {
      padding: .5rem 1.25rem;
      border: none; border-radius: 6px;
      background: #1a1c1e; color: #fff;
      font-size: .875rem; font-weight: 500;
      cursor: pointer;
    }
    .demo-bar button:focus-visible {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }
    #load-status { font-size: .875rem; color: #555; }
  </style>
</head>
<body>

  <!-- Screen-reader live region: exists in the DOM before JS touches it -->
  <div id="sr-status" role="status" aria-live="polite" aria-atomic="true" class="sr-only"></div>

  <div class="demo-bar">
    <button id="reload-btn" type="button">Simulate reload</button>
    <span id="load-status"></span>
  </div>

  <!--
    aria-busy="true" on the container: screen readers wait for all skeletons
    to resolve before announcing content, rather than each card individually.
  -->
  <div class="card-grid" id="card-grid" aria-busy="true" aria-label="Article feed">
    <!-- Three skeleton cards -->
    <!-- Card 1 -->
    <div class="card" role="article">
      <div class="skeleton-wrap">
        <span class="skeleton-item sk-avatar" aria-hidden="true"></span>
        <span class="skeleton-item sk-line sk-line-w75" aria-hidden="true"></span>
        <span class="skeleton-item sk-line sk-line-w55" aria-hidden="true"></span>
        <span class="skeleton-item sk-text-block sk-line-w100" aria-hidden="true"></span>
        <span class="skeleton-item sk-text-block sk-line-w100" aria-hidden="true"></span>
        <span class="skeleton-item sk-text-block sk-line-w75"  aria-hidden="true"></span>
      </div>
      <div class="card-content" aria-hidden="true"></div>
    </div>

    <!-- Card 2 (identical structure, content differs after load) -->
    <div class="card" role="article">
      <div class="skeleton-wrap">
        <span class="skeleton-item sk-avatar" aria-hidden="true"></span>
        <span class="skeleton-item sk-line sk-line-w75" aria-hidden="true"></span>
        <span class="skeleton-item sk-line sk-line-w55" aria-hidden="true"></span>
        <span class="skeleton-item sk-text-block sk-line-w100" aria-hidden="true"></span>
        <span class="skeleton-item sk-text-block sk-line-w75"  aria-hidden="true"></span>
        <span class="skeleton-item sk-text-block sk-line-w55"  aria-hidden="true"></span>
      </div>
      <div class="card-content" aria-hidden="true"></div>
    </div>

    <!-- Card 3 -->
    <div class="card" role="article">
      <div class="skeleton-wrap">
        <span class="skeleton-item sk-avatar" aria-hidden="true"></span>
        <span class="skeleton-item sk-line sk-line-w100" aria-hidden="true"></span>
        <span class="skeleton-item sk-line sk-line-w75"  aria-hidden="true"></span>
        <span class="skeleton-item sk-text-block sk-line-w100" aria-hidden="true"></span>
        <span class="skeleton-item sk-text-block sk-line-w100" aria-hidden="true"></span>
        <span class="skeleton-item sk-text-block sk-line-w55"  aria-hidden="true"></span>
      </div>
      <div class="card-content" aria-hidden="true"></div>
    </div>
  </div>

  <script>
    const ARTICLES = [
      {
        name: 'Mara Okonkwo',
        title: 'How we cut our API response time by 40%',
        excerpt: 'After six months of profiling, we found one N+1 query was responsible for most of our latency. Here is the fix.'
      },
      {
        name: 'Joel Thériault',
        title: 'Why our design system ditched Storybook',
        excerpt: 'Storybook solved documentation, but it became a parallel universe. Our new workflow keeps components and usage in sync.'
      },
      {
        name: 'Soo-Yeon Park',
        title: 'The case for boring infrastructure',
        excerpt: 'We migrated from a clever custom scheduler to plain cron jobs. Deploys are faster, on-call is quieter.'
      },
    ];

    const grid     = document.getElementById('card-grid');
    const srStatus = document.getElementById('sr-status');
    const loadLbl  = document.getElementById('load-status');
    const reloadBtn = document.getElementById('reload-btn');

    function showSkeletons() {
      grid.querySelectorAll('.skeleton-wrap').forEach(el => {
        el.style.display = '';
      });
      grid.querySelectorAll('.card-content').forEach(el => {
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
      });
      grid.setAttribute('aria-busy', 'true');
      srStatus.textContent = 'Loading articles…';
      loadLbl.textContent = 'Loading…';
      reloadBtn.disabled = true;
    }

    function revealContent() {
      const cards = grid.querySelectorAll('.card');

      cards.forEach((card, i) => {
        const data = ARTICLES[i];
        const skeletonWrap  = card.querySelector('.skeleton-wrap');
        const contentBlock  = card.querySelector('.card-content');

        contentBlock.innerHTML = `
          <div class="avatar" aria-hidden="true"></div>
          <h2>${data.name}</h2>
          <p>${data.title}</p>
          <p style="margin-top:.5rem">${data.excerpt}</p>
        `;

        skeletonWrap.style.display = 'none';
        contentBlock.style.display = '';
        contentBlock.removeAttribute('aria-hidden');
      });

      // Signal completion to screen readers via the live region
      grid.setAttribute('aria-busy', 'false');
      srStatus.textContent = '3 articles loaded.';
      loadLbl.textContent = '';
      reloadBtn.disabled = false;
    }

    function simulateLoad() {
      showSkeletons();

      // Debounce: show skeleton only if load takes >200 ms (prevents flash)
      // Here we simulate a 1.6 s network call
      setTimeout(revealContent, 1600);
    }

    reloadBtn.addEventListener('click', simulateLoad);

    // Initial load
    simulateLoad();
  </script>
</body>
</html>
```

### React — skeleton component with Tailwind and `useReducedMotion`

This is the realistic production choice in a React/Tailwind codebase. Copy the two files as-is into a Vite + React project with Tailwind configured.

```jsx
// SkeletonCard.jsx
import { useEffect, useState } from 'react';

/**
 * Reads the OS reduced-motion preference and re-checks if it changes.
 */
function useReducedMotion() {
  const mq = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  const [reduced, setReduced] = useState(mq ? mq.matches : false);

  useEffect(() => {
    if (!mq) return;
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mq]);

  return reduced;
}

/**
 * A single skeleton shape.
 * reduced: when true, replaces shimmer with a static tinted surface.
 */
function SkeletonBlock({ className = '', reduced }) {
  const base = 'rounded bg-neutral-200 dark:bg-neutral-700 relative overflow-hidden block';

  const shimmer = reduced
    ? ''
    : [
        'after:absolute after:inset-0',
        'after:bg-gradient-to-r after:from-transparent after:via-white/50 after:to-transparent',
        'after:animate-[shimmer_1.4s_ease-in-out_infinite]',
      ].join(' ');

  return <span aria-hidden="true" className={`${base} ${shimmer} ${className}`} />;
}

/**
 * Skeleton version of an article card.
 */
export function SkeletonCard() {
  const reduced = useReducedMotion();

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 shadow-sm">
      {/* Avatar placeholder */}
      <SkeletonBlock reduced={reduced} className="w-12 h-12 rounded-full mb-3" />
      {/* Title lines */}
      <SkeletonBlock reduced={reduced} className="h-4 w-3/4 mb-2" />
      <SkeletonBlock reduced={reduced} className="h-4 w-1/2 mb-4" />
      {/* Body text */}
      <SkeletonBlock reduced={reduced} className="h-3 w-full mb-2" />
      <SkeletonBlock reduced={reduced} className="h-3 w-full mb-2" />
      <SkeletonBlock reduced={reduced} className="h-3 w-4/5" />
    </div>
  );
}
```

```jsx
// ArticleFeed.jsx
import { useState, useEffect, useRef } from 'react';
import { SkeletonCard } from './SkeletonCard';

const ARTICLES = [
  { id: 1, author: 'Mara Okonkwo',    title: 'How we cut API response time by 40%',   body: 'After six months of profiling, we found one N+1 query responsible for most of our latency.' },
  { id: 2, author: 'Joel Thériault',  title: 'Why our design system ditched Storybook', body: 'Storybook solved documentation but became a parallel universe our engineers stopped trusting.' },
  { id: 3, author: 'Soo-Yeon Park',   title: 'The case for boring infrastructure',      body: 'We migrated from a clever custom scheduler to plain cron jobs. On-call is quieter.' },
];

export function ArticleFeed() {
  const [loading, setLoading]   = useState(true);
  const [articles, setArticles] = useState([]);
  const srRef = useRef(null);

  useEffect(() => {
    // Simulate a 1.6 s fetch with 200 ms debounce for the skeleton appearance
    let skeletonTimer;
    let dataTimer;

    skeletonTimer = setTimeout(() => {
      // Only show skeleton if load hasn't resolved yet
      setLoading(true);
    }, 200);

    dataTimer = setTimeout(() => {
      clearTimeout(skeletonTimer);
      setArticles(ARTICLES);
      setLoading(false);
    }, 1600);

    return () => {
      clearTimeout(skeletonTimer);
      clearTimeout(dataTimer);
    };
  }, []);

  // Announce completion to screen readers via the live region ref
  useEffect(() => {
    if (!loading && srRef.current) {
      srRef.current.textContent = `${articles.length} articles loaded.`;
    }
    if (loading && srRef.current) {
      srRef.current.textContent = 'Loading articles…';
    }
  }, [loading, articles.length]);

  return (
    <>
      {/* Live region: present in initial render, content updated dynamically */}
      <div
        ref={srRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <div
        aria-busy={loading}
        aria-label="Article feed"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {loading
          ? Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)
          : articles.map(a => (
              <article key={a.id} className="bg-white dark:bg-neutral-900 rounded-xl p-5 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 mb-3" aria-hidden="true" />
                <p className="text-xs font-medium text-neutral-500 mb-1">{a.author}</p>
                <h2 className="text-base font-semibold mb-2">{a.title}</h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{a.body}</p>
              </article>
            ))
        }
      </div>
    </>
  );
}
```

Add the custom animation to your `tailwind.config.js`:

```js
// tailwind.config.js (relevant excerpt)
module.exports = {
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
};
```

## Variations

**Shimmer (moving highlight)** — the default. A light band sweeps left-to-right using `transform: translateX` on a pseudo-element. Implies active loading. Works on both light and dark surfaces by adjusting the gradient's via-color opacity. This is the variant that must be suppressed under `prefers-reduced-motion: reduce`.

**Pulse (opacity fade)** — `opacity` animates between `1` and `0.4` on a 1.2–1.8 s loop. No lateral movement, so it is the appropriate fallback for reduced-motion users. Slightly less communicative than shimmer but universally safe.

**Static (no animation)** — a plain grey block with no animation at all. Use when you cannot guarantee paint budget (very long lists, low-end hardware profiling) or when you want the most conservative reduced-motion behavior.

**Dark-surface skeleton** — swap `#e2e5e7` base for `#2a2d30` and the shimmer via-color for `rgba(255,255,255,0.08)`. The same component logic applies; parameterize surface color rather than duplicating the component.

**Line-specific sizing** — match skeleton block heights exactly to your type scale: `14px` for body, `20px` for subheadings, `28px` for H2, `48px` for H1. This prevents height jump when real text renders at a different size than the rectangle.

**Content-aware skeleton** — render the skeleton directly from API metadata (known field count, image aspect ratio, list length) rather than a hardcoded placeholder count. Eliminates the "3 cards become 7" collapse on data arrival.

**Spinner** — use a CSS border-spin (`border-top` contrast on a `border-radius: 50%` circle) rather than a shimmer for single bounded operations: button submit, inline search, modal open. No layout placeholder needed. Announce with `role="status"` on the button or nearby region. Add `aria-label="Loading…"` on the spinner element and `aria-disabled="true"` on the triggering button.

## Accessibility

**prefers-reduced-motion — mandatory for shimmer**

Shimmer involves rapid left-to-right motion that can trigger vestibular discomfort. The rule: shimmer is decoration, not information. Stripping it changes nothing about what the user understands.

```css
/* Default: shimmer via pseudo-element transform */
.skeleton-item::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.55) 50%,
    transparent 100%
  );
  animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Reduced-motion: replace sweep with static tint — no movement at all */
@media (prefers-reduced-motion: reduce) {
  .skeleton-item::after {
    animation: none;
    background: rgba(255, 255, 255, 0.2); /* static highlight, no motion */
  }
}
```

For the pulse variant as a reduced-motion substitute, note that even pulse (opacity change) involves motion. The safest choice for `reduce` is a completely static skeleton. If you use pulse as the fallback, slow it to 2–2.5 s and confirm with real users with vestibular sensitivities that it is tolerable.

**Screen reader announcements**

- The live region (`role="status"` + `aria-live="polite"`) must be present in the DOM before JavaScript populates it. Injecting both the element and its text content simultaneously often causes screen readers to miss the announcement.
- `aria-busy="true"` on the container tells AT to hold announcements until all sibling skeletons resolve. Set to `false` immediately after the last skeleton is replaced.
- `aria-hidden="true"` on individual skeleton shapes prevents screen readers from reading out "blank blank blank" for each rectangle.
- Do not use heading elements (`<h1>`–`<h6>`) inside a skeleton. AT users navigate by headings; a skeleton heading appears in the document outline and confuses navigation.
- After content loads, do not auto-move focus to the new content unless the user explicitly triggered a navigational action (e.g., loading the next page via a "Load more" button). Automatic focus relocation mid-browse is disruptive.

**Contrast**

Skeleton base color `#e2e5e7` on white `#ffffff` gives a contrast ratio of approximately 1.5:1. This is intentional — skeleton blocks are decorative non-text elements, not readable content, so WCAG SC 1.4.3 (text contrast) does not apply. However, skeleton blocks must still be distinguishable from the page background so sighted users can read the layout. A 1.4–1.6:1 ratio is conventional; do not go so low (`#f5f5f5` on `#fff`) that the skeleton is invisible against the page.

**Touch and pointer**

Skeleton elements are passive and must never be interactive. Set `pointer-events: none` on skeleton items explicitly — or confirm they are not inside an interactive ancestor that could misroute taps — so touch events pass through to underlying scroll containers rather than being consumed by the skeleton. Skeleton blocks must carry no `cursor: pointer` style and no click or tap handlers; any tap on a loading region should be a no-op. There is no touch-specific fallback beyond confirming that the responsive grid (present in the working code above) holds its layout correctly at mobile viewport widths, which is handled by `auto-fill minmax(280px, 1fr)` and requires no additional pointer-media query.

**Keyboard and focus**

- Skeleton elements must not receive focus (no `tabindex`). They are `aria-hidden`.
- If a loading zone interrupts keyboard navigation flow (e.g., a skeleton replaces a list the user was tabbing through), restore focus to the last known position or to the first item of the newly loaded content after the user's explicit trigger.

**Spinner accessibility pattern**

```html
<button id="submit-btn" type="submit" aria-disabled="true">
  <svg class="spinner" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-dasharray="60" stroke-dashoffset="20"/>
  </svg>
  <span class="sr-only" role="status" aria-live="polite">Saving changes…</span>
  <span aria-hidden="true">Save</span>
</button>
```

## Performance

**Animate only `transform` and `opacity`.** The shimmer in the working code above uses `transform: translateX` on a pseudo-element — not `background-position`, `left`, or `width`. This runs on the GPU compositor thread and skips layout and paint. Avoid `background-position` animation; while it only triggers paint (not layout), it is still more expensive than transform.

**`will-change: transform` — use once, scoped tightly.** Adding `will-change: transform` to skeleton elements promotes each one to its own compositor layer. For a page with 30 skeleton cards each with 5 skeleton items, that is 150 layers. This can exhaust GPU memory on low-end mobile. Apply `will-change` to the shimmer pseudo-element only, and remove it (or use `will-change: auto`) after the skeleton unmounts.

**Layout shift (CLS).** A skeleton that does not match the final content's height causes a layout shift when real content arrives. Measure the real component's rendered height and hardcode it as `min-height` on the skeleton wrapper, or use `aspect-ratio` for image placeholders. Aim for CLS score under 0.1. Skeletons that match dimensions do not eliminate CLS — they only eliminate the blank-to-content jump; ensure the transition is a same-dimension swap, not an append.

**Debounce the skeleton's appearance.** For operations that resolve in under 200 ms, showing and immediately hiding a skeleton produces a flash that is worse than showing nothing. Set a `setTimeout` of 200 ms before adding the skeleton class, and cancel it if data arrives first. The working code above demonstrates this pattern.

**Skeleton count.** Match the skeleton card count to the expected content count where possible (e.g., if pagination always returns 12 items, show 12 skeleton cards). Mismatches cause a reflow when the real list renders a different count. If count is unknown, default to 3–6 and use fade-in on the real content to soften the transition.

**`overflow: hidden` on the skeleton.** Required to clip the shimmer pseudo-element. Without it, the gradient sweeps beyond the skeleton block and creates visible streaks through adjacent content.

## Anti-slop

**The cliche:** shimmer on every UI element — navbar, buttons, input fields, footers, and decorative dividers all shimmering simultaneously in the "full-page skeleton" pattern. This is the loading equivalent of glassmorphism on every card (see slop-blocklist: Surface / effect). It signals "applied the pattern mechanically" rather than thought about where loading states actually help.

**The tell in copy:** status text reading "Loading…" with three dots that animate forever, or no status text at all. Screen-reader users get silence. When the content arrives, nothing is announced.

**The tasteful alternative:** Scope the skeleton to only the primary content zone. The chrome (nav, sidebar, header) renders immediately with real content or is static. The skeleton has exactly the count and proportions of the content arriving. The status text reads something specific: "Fetching your last 30 transactions" rather than "Loading…". On completion, the live region announces "30 transactions loaded" rather than staying silent.

**Motion slop cross-reference (slop-blocklist: Motion):** skeleton shimmer running at default `ease` easing reads as generated. Use `ease-in-out` and a duration of 1.2–1.6 s. More importantly, vary animation start phase between skeleton items using `animation-delay` so the shimmer on card 1 and card 3 are not perfectly synchronized — synchronized shimmer on a grid looks mechanical; staggered shimmer looks like independent network activity.

```css
.card:nth-child(1) .skeleton-item::after { animation-delay: 0s; }
.card:nth-child(2) .skeleton-item::after { animation-delay: 0.15s; }
.card:nth-child(3) .skeleton-item::after { animation-delay: 0.30s; }
```

## Pairs well with

- **Error states** — the terminal state of a loading sequence. When `aria-busy` flips to `false`, if the data request failed, replace skeletons with the error state component (inline message, retry button) rather than leaving the skeleton in place.
- **Empty states** — the other terminal state: request succeeded, data was empty. The empty state must also replace the skeleton on the same beat; no flash between skeleton and empty.
- **Optimistic UI** — for low-stakes reversible actions (like, bookmark, toggle), skip the skeleton entirely and update immediately. Pair with a subtle toast for rollback notification on failure. Optimistic and skeleton are alternatives, not companions.
- **Toast / notification system** — use a live-region toast to confirm the load completed, especially for background refreshes the user did not explicitly trigger (e.g., auto-refresh on a dashboard panel).
- **Progress indicators (determinate)** — upgrade from skeleton to a progress bar when operation duration is estimable (file upload, export generation, batch import). The decision threshold is roughly 10 seconds: under it, skeleton; over it, progress with a percentage.
- **Staggered entrance** (from scroll/motion library) — once real content replaces the skeleton, a very brief `opacity: 0 → 1` on the incoming card (150–200 ms, `ease-out`) makes the swap feel deliberate rather than a jarring instant replace. Keep it subtle and `transform`-only.

## Current references

- [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) — syntax, values, browser support table (baseline widely available since 2020)
- [MDN — ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) — `aria-live`, `aria-busy`, `aria-atomic`, `role="status"` patterns with code examples
- [Sara Soueidan — Accessible notifications with ARIA live regions (Part 1)](https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-1/) — deep technical treatment of polite vs assertive, browser/AT inconsistencies with `aria-busy`
- [web.dev — prefers-reduced-motion: Sometimes less movement is more](https://web.dev/articles/prefers-reduced-motion) — motion sickness context, CSS and JS patterns, `<picture>` pattern for animated vs static image variants
- [LogRocket — Skeleton loading screen design](https://blog.logrocket.com/ux-design/skeleton-loading-screen-design/) — perceived performance comparison vs spinners, layout consistency guidance
- [Tamara Milakovic — Loading states are not one component](https://www.tamaramilakovic.com/thinking/loading-states-are-not-one-component) — decision matrix: spinner / skeleton / progress bar / optimistic UI with time-threshold guidance
- [Semrush Intergalactic Design System — Skeleton a11y](https://developer.semrush.com/intergalactic/components/skeleton/skeleton-a11y) — production implementation of `aria-busy` + `aria-label` on skeleton containers, keyboard/focus rules
- [AllyWay — Skeleton screens and accessibility: a UX review](https://allyway.io/skeleton-screens-and-accessibility-a-ux-review) — screen-reader behavior in practice, `aria-hidden` on skeleton shapes, focus management after load
- [Frontend Hero — CSS skeleton loaders: shimmer, pulse and wave effects](https://frontend-hero.com/how-to-create-skeleton-loader) — implementation of shimmer vs pulse CSS, reduced-motion substitution code
- [Calibre — Cumulative Layout Shift: measure and avoid visual instability](https://calibreapp.com/blog/cumulative-layout-shift) — CLS scoring, how skeletons interact with shift measurement, dimension-reservation techniques
