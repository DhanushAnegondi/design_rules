# Page transitions

> Animate the swap between two views — a route change or a same-page DOM update — so the new screen arrives with continuity (a shared element morphs, content slides directionally, or layers cross-fade) instead of a hard cut.

**Bucket:** scroll/motion
**Maturity:** current
**Effort:** medium
**Best for:** websites, portfolios, apps (SPAs and MPAs), galleries/carousels, dashboards

## What it is
When a user navigates, the browser (or a framework) captures the outgoing screen, swaps in the incoming one, and animates between the two snapshots rather than cutting instantly. Three perceptual flavours dominate: (1) **shared-element morph** — a thumbnail grows into a hero, the same object persisting across the cut to signal "same thing, going deeper"; (2) **directional slide** — old content exits left and new content enters from the right on "forward", reversed on "back", encoding navigation history; (3) **cross-fade / reveal** — layers dissolve when the place stays the same but the content changes. The native View Transitions API gives you all three with no animation library, and frameworks (Astro, Next.js, Framer Motion) wrap it or simulate it.

## When to use
- Multi-page sites where instant route swaps feel jarring (portfolios, galleries, editorial, docs).
- A detail view that shares a hero image / card with the list it came from (morph).
- SPA state swaps — tabs, filters, master-detail panes — where a cross-fade reads as "same container, new content".
- Loading handoffs: a skeleton that slides out as the real content slides in (Suspense reveal).
- Anywhere you currently reach for a heavy JS page-transition library and the navigation is same-origin.

## When NOT to use
- Navigations where speed of arrival is the whole point — a 400ms morph on a frequently-clicked nav item just adds latency. Keep durations short (150-250ms) or skip.
- Cross-origin navigations: the API only fires for same-origin pushes/traverses, so a transition to an external domain will not animate (and should not).
- When `prefers-reduced-motion` is set — positional slides are the single most common motion-sensitivity trigger; fall back to an instant swap or a tiny opacity fade.
- **The overuse trap:** wrapping *every* element on *every* route in a transition so the entire page slides on each click. That reads as a template, fights the user's spatial anchor, and slows perceived navigation. Transition one or two meaningful elements; let the rest swap.
- Content that must exist without JS for SEO/perceived speed — the destination page must render fully on its own; the transition is pure enhancement.

## How it works
The native **View Transitions API** works in two modes that share the same machinery:

- **Same-document** (SPA): you call `document.startViewTransition(updateCallback)`. The browser snapshots the current DOM, runs your callback to mutate the DOM, snapshots the new state, and cross-fades between them. Same-document view transitions became **Baseline Newly available on 2025-10-14** (Chrome/Edge 111+, Safari 18+, Firefox 144+).
- **Cross-document** (MPA): you add the CSS at-rule `@view-transition { navigation: auto; }` to *both* pages. On a same-origin push/replace/traverse navigation, the browser handles the snapshot/swap automatically — no JS. Cross-document support is **Chrome/Edge 126+ and Safari 18.2+; Firefox does not yet ship it** (it safely ignores the at-rule), so treat it as progressive enhancement.

Under the hood the browser builds a tree of **pseudo-elements** over the page during the transition:
`::view-transition` (root overlay) → `::view-transition-group(name)` → `::view-transition-image-pair(name)` → `::view-transition-old(name)` (snapshot of outgoing) and `::view-transition-new(name)` (live incoming). You style these with normal CSS `@keyframes`. Any element you give `view-transition-name: <ident>` becomes its own independently-animated group; matching names on both screens produce the morph. The default transition (the `root` group) is a quick cross-fade you can override. In Chrome 137+/Safari 18.4+, `view-transition-name: match-element` auto-generates a unique internal name per element — useful for animating list items without manually stamping per-item IDs.

Frameworks layer on top:
- **Astro** `<ClientRouter />` (import `{ ClientRouter }` from `astro:transitions`) intercepts MPA navigations, uses native VT where available, and *simulates* entry/exit animations where not. `transition:name` pairs elements; `transition:animate` picks `fade` | `slide` | `none` | `initial`.
- **Next.js** (App Router, 15.2+) exposes React's `<ViewTransition>` component behind `experimental.viewTransition: true`. Route navigations are React Transitions, so wrapped elements animate automatically; `name` morphs, `transitionTypes` on `<Link>` drives directional slides.
- **Framer Motion** `AnimatePresence mode="wait"` is the pre-VT approach: it keeps an exiting component mounted until its exit animation finishes, then mounts the new one. It does *not* use the View Transitions API; it animates React mount/unmount with `transform`/`opacity`. Still the right tool for fine-grained, spring-driven control and broad browser reach.

## Working code

### Native same-document (SPA) - iframe-safe shared element preview
This is the live-preview version: one HTML file, no remote images, no route dependency, and a fallback when View Transitions or motion are unavailable.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Same-document view transition</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
    }

    :root {
      color-scheme: dark;
      --bg: #0d0f14;
      --panel: #171b24;
      --text: #eef1f6;
      --muted: #a8b0bf;
      --accent: #7fd1c4;
      --accent-2: #f5b65f;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 18px;
      background:
        radial-gradient(circle at 15% 20%, rgb(127 209 196 / 0.24), transparent 28%),
        radial-gradient(circle at 85% 10%, rgb(245 182 95 / 0.18), transparent 26%),
        var(--bg);
      color: var(--text);
      font: 16px/1.45 system-ui, sans-serif;
    }

    .shell {
      width: min(100%, 760px);
      display: grid;
      gap: 14px;
    }

    .top {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      justify-content: space-between;
      gap: 12px;
    }

    h1 {
      margin: 0;
      font-size: clamp(1.35rem, 5vw, 2.25rem);
      line-height: 1;
      letter-spacing: 0;
    }

    .caption {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 0.9rem;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    button {
      min-height: 42px;
      border: 0;
      border-radius: 999px;
      padding: 0 14px;
      background: var(--accent);
      color: #07110f;
      font: 700 0.9rem/1 system-ui, sans-serif;
      cursor: pointer;
    }

    button.secondary {
      background: rgb(255 255 255 / 0.1);
      color: var(--text);
      outline: 1px solid rgb(255 255 255 / 0.16);
    }

    button:focus-visible {
      outline: 3px solid var(--accent-2);
      outline-offset: 3px;
    }

    .stage {
      position: relative;
      min-height: 210px;
      overflow: hidden;
      border: 1px solid rgb(255 255 255 / 0.14);
      border-radius: 20px;
      background: var(--panel);
      box-shadow: 0 24px 70px rgb(0 0 0 / 0.34);
    }

    .view {
      display: grid;
      grid-template-columns: minmax(135px, 0.8fr) minmax(0, 1.2fr);
      gap: 18px;
      align-items: center;
      padding: 18px;
      min-height: 210px;
    }

    .art {
      min-height: 156px;
      border-radius: 18px;
      view-transition-name: hero-art;
      background:
        radial-gradient(circle at 26% 28%, #f7efe2 0 9%, transparent 10%),
        linear-gradient(145deg, #16343a 0 44%, #7fd1c4 45% 52%, #f5b65f 53% 100%);
      box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.18);
    }

    .detail .art {
      min-height: 176px;
      background:
        radial-gradient(circle at 72% 20%, #f7efe2 0 8%, transparent 9%),
        linear-gradient(145deg, #2d1b4e 0 42%, #f5b65f 43% 50%, #7fd1c4 51% 100%);
    }

    .copy {
      display: grid;
      gap: 8px;
    }

    .eyebrow {
      color: var(--accent);
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    h2 {
      margin: 0;
      font-size: clamp(1.25rem, 4vw, 2rem);
      line-height: 1.05;
      letter-spacing: 0;
      view-transition-name: view-title;
    }

    p {
      margin: 0;
      color: var(--muted);
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }

    .meta span {
      border: 1px solid rgb(255 255 255 / 0.14);
      border-radius: 999px;
      padding: 5px 8px;
      color: var(--text);
      font-size: 0.78rem;
    }

    ::view-transition-group(root) {
      animation-duration: 260ms;
    }

    ::view-transition-old(root) {
      animation: 150ms cubic-bezier(0.4, 0, 1, 1) both fade-out;
    }

    ::view-transition-new(root) {
      animation: 260ms cubic-bezier(0.16, 1, 0.3, 1) 40ms both slide-in;
    }

    ::view-transition-group(hero-art),
    ::view-transition-group(view-title) {
      animation-duration: 420ms;
      animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slide-in {
      from {
        opacity: 0;
        translate: 28px 0;
      }
      to {
        opacity: 1;
        translate: 0 0;
      }
    }

    @keyframes fade-out {
      to {
        opacity: 0;
        translate: -18px 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      ::view-transition-group(*),
      ::view-transition-old(*),
      ::view-transition-new(*) {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
      }
    }

    @media (max-width: 520px) {
      .view {
        grid-template-columns: 1fr;
      }

      .art,
      .detail .art {
        min-height: 118px;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="top">
      <div>
        <h1>Same-page transition</h1>
        <p class="caption">A card becomes a detail view without leaving the iframe.</p>
      </div>
      <div class="actions">
        <button type="button" id="toggle">Open detail</button>
        <button type="button" class="secondary" id="reset">Reset</button>
      </div>
    </div>

    <section class="stage" id="stage" aria-live="polite"></section>
  </main>

  <script>
    const stage = document.getElementById('stage');
    const toggle = document.getElementById('toggle');
    const reset = document.getElementById('reset');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let detail = false;

    const states = {
      card: `
        <article class="view card">
          <div class="art" role="img" aria-label="Abstract gallery thumbnail"></div>
          <div class="copy">
            <span class="eyebrow">Gallery</span>
            <h2>Frames from the coast</h2>
            <p>The thumbnail and title are named transition elements. The rest swaps quickly.</p>
            <div class="meta"><span>shared element</span><span>same document</span></div>
          </div>
        </article>
      `,
      detail: `
        <article class="view detail">
          <div class="art" role="img" aria-label="Expanded abstract gallery artwork"></div>
          <div class="copy">
            <span class="eyebrow">Detail</span>
            <h2>Coast study 04</h2>
            <p>The artwork morphs while the surrounding interface enters directionally.</p>
            <div class="meta"><span>hero morph</span><span>root slide</span></div>
          </div>
        </article>
      `,
    };

    function render() {
      stage.innerHTML = detail ? states.detail : states.card;
      toggle.textContent = detail ? 'Back to card' : 'Open detail';
    }

    function swap(nextDetail) {
      const update = () => {
        detail = nextDetail;
        render();
      };

      if (!document.startViewTransition || reduce.matches) {
        update();
        return;
      }

      document.startViewTransition(update);
    }

    toggle.addEventListener('click', () => swap(!detail));
    reset.addEventListener('click', () => swap(false));
    render();
  </script>
</body>
</html>
```

### Native cross-document (MPA) — zero JS, progressive enhancement
Add the same at-rule to every page that should participate. Browsers without support just navigate normally.

```html
<!-- index.html: source-only pair for a real same-origin MPA. Save as index.html. -->
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Gallery</title>
<style>
  /* Opt both documents into cross-document transitions.
     Chrome/Edge 126+, Safari 18.2+. Firefox ignores this rule and navigates normally. */
  @view-transition { navigation: auto; }

  :root { color-scheme: dark; }
  body { margin:0; font:16px/1.5 system-ui, sans-serif; background:#0d0f14; color:#eef1f6; }
  a { color:#7fd1c4; }
  .card { display:inline-block; margin:1rem; }
  /* The shared element: same name on list + detail page => morph */
  .hero { view-transition-name: hero-photo; border-radius:14px; }

  /* Override the default root cross-fade with a custom, non-default easing.
     400ms expo-out-ish reads more deliberate than the browser default. */
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 320ms;
    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  }
  /* Give the morphing photo its own slower, blurred timing to hide interpolation. */
  ::view-transition-group(hero-photo) { animation-duration: 420ms; }
  ::view-transition-image-pair(hero-photo) {
    animation-name: morph-blur;
    animation-duration: 420ms;
  }
  @keyframes morph-blur { 35% { filter: blur(3px); } }

  /* MANDATORY reduced-motion fallback: kill all transition animation,
     swap instantly (the browser's no-support default). */
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(*),
    ::view-transition-old(*),
    ::view-transition-new(*) {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
    }
  }
</style></head>
<body>
  <!-- index.html -->
  <h1>Frames</h1>
  <a class="card" href="detail.html">
    <img class="hero" width="220" height="160"
         src="https://picsum.photos/id/1015/220/160" alt="Mountain lake at dawn">
  </a>
</body></html>
```

```html
<!-- detail.html: source-only pair for the MPA example above. Save as detail.html. -->
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Mountain lake at dawn</title>
<style>
  @view-transition { navigation: auto; }
  :root { color-scheme: dark; }
  body { margin:0; font:16px/1.5 system-ui, sans-serif; background:#0d0f14; color:#eef1f6; }
  a { color:#7fd1c4; }
  .hero { view-transition-name: hero-photo; border-radius:14px; max-width:100%; }
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 320ms;
    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  }
  ::view-transition-group(hero-photo) { animation-duration: 420ms; }
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(*),
    ::view-transition-old(*),
    ::view-transition-new(*) {
      animation-duration: 0s !important; animation-delay: 0s !important;
    }
  }
</style></head>
<body>
  <!-- detail.html -->
  <p><a href="index.html">&larr; Back</a></p>
  <img class="hero" width="720" height="520"
       src="https://picsum.photos/id/1015/720/520" alt="Mountain lake at dawn">
  <h1>Mountain lake at dawn</h1>
</body></html>
```

### Native same-document (SPA) — directional slide with JS guard
Use `startViewTransition` around the DOM mutation. Feature-detect and respect reduced motion explicitly.

```html
<!-- spa-transition.html: minimal source-only variant; the live preview above is the richer version. -->
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>SPA transition</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; font:16px/1.5 system-ui, sans-serif; background:#0d0f14; color:#eef1f6; }
  #app { padding:2rem; }
  button { font:inherit; padding:.6rem 1rem; border-radius:10px; border:0;
           background:#7fd1c4; color:#0d0f14; cursor:pointer; }

  /* Directional slide: old slides out left, new slides in from right.
     translate animates on a GPU-friendly transform property. */
  ::view-transition-old(root) {
    animation: 180ms cubic-bezier(0.4, 0, 1, 1) both slide-out-left,
               180ms ease both fade-out;
  }
  ::view-transition-new(root) {
    animation: 260ms cubic-bezier(0.16, 1, 0.3, 1) 60ms both slide-in-right,
               260ms ease 60ms both fade-in;
  }
  @keyframes slide-out-left { to { translate: -40px 0; } }
  @keyframes slide-in-right { from { translate: 40px 0; } to { translate: 0 0; } }
  @keyframes fade-out { to { opacity: 0; } }
  @keyframes fade-in  { from { opacity: 0; } to { opacity: 1; } }

  @media (prefers-reduced-motion: reduce) {
    ::view-transition-old(root),
    ::view-transition-new(root) { animation: none; }
  }
</style></head>
<body>
  <div id="app"><h1>Page A</h1><p>Some content for the first view.</p></div>
  <button id="next">Go to next page</button>
<script>
  const views = [
    { title: 'Page A', body: 'Some content for the first view.' },
    { title: 'Page B', body: 'A different screen, swapped in place.' },
  ];
  let i = 0;
  const app = document.getElementById('app');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  function render() {
    i = (i + 1) % views.length;
    app.innerHTML = `<h1>${views[i].title}</h1><p>${views[i].body}</p>`;
  }

  document.getElementById('next').addEventListener('click', () => {
    // Feature-detect AND honour reduced motion: fall back to an instant swap.
    if (!document.startViewTransition || reduce.matches) {
      render();
      return;
    }
    document.startViewTransition(() => render());
  });
</script>
</body></html>
```

### Astro `<ClientRouter />` (MPA) — native where supported, simulated fallback
```astro
---
// src/layouts/Base.astro
import { ClientRouter } from "astro:transitions";
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{Astro.props.title}</title>
    <!-- Enables view transitions on every page using this layout.
         Native VT in Chrome/Edge/Safari; Astro simulates entry/exit in Firefox. -->
    <ClientRouter />
  </head>
  <body>
    <slot />
  </body>
</html>
```

```astro
---
// src/pages/index.astro
import Base from "../layouts/Base.astro";
---
<Base title="Gallery">
  <a href="/detail">
    <!-- transition:name pairs this element with the matching one on /detail -->
    <img transition:name="hero-photo" src="/lake-thumb.jpg" alt="Mountain lake" />
  </a>
  <!-- transition:animate overrides the default crossfade: fade | slide | none | initial -->
  <section transition:animate="slide">
    <p>This section slides between pages.</p>
  </section>
</Base>
```
Astro's `<ClientRouter />` injects a media query that disables all view-transition animation under `prefers-reduced-motion: reduce` automatically — you do not write that fallback yourself, but verify it in your build.

### Next.js (App Router) React `<ViewTransition>` — shared-element morph
```ts
// next.config.ts  — experimental flag required (Next 15.2+)
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  experimental: { viewTransition: true },
};
export default nextConfig;
```

```tsx
// components/photo-grid.tsx
import { ViewTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function PhotoGrid({ photos }: { photos: { id: string; src: string; title: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {photos.map((photo) => (
        <Link key={photo.id} href={`/photo/${photo.id}`} transitionTypes={['nav-forward']}>
          {/* Same name on grid + detail => browser morphs size/position */}
          <ViewTransition name={`photo-${photo.id}`}>
            <Image src={photo.src} alt={photo.title} width={220} height={160} />
          </ViewTransition>
        </Link>
      ))}
    </div>
  );
}
```

```css
/* app/globals.css — directional slide keyed off Link transitionTypes,
   plus the MANDATORY reduced-motion guard. */
::view-transition-old(.nav-forward) {
  --slide: -60px;
  animation: 150ms ease-in both fade reverse, 400ms ease-in-out both slide reverse;
}
::view-transition-new(.nav-forward) {
  --slide: 60px;
  animation: 210ms ease-out 150ms both fade, 400ms ease-in-out both slide;
}
@keyframes slide { from { translate: var(--slide); } to { translate: 0; } }
@keyframes fade  { from { opacity: 0; filter: blur(3px); } to { opacity: 1; filter: blur(0); } }

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

### Framer Motion `AnimatePresence` (broad-support fallback, no VT API)
Use this when you need spring control or must support browsers/configs without the View Transitions API. In the Next.js App Router, put it in a `template.tsx` (re-mounts per navigation) and key by route segment.

```tsx
// app/template.tsx
'use client';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useSelectedLayoutSegment } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const segment = useSelectedLayoutSegment();   // stable key per route
  const reduce = useReducedMotion();            // OS setting -> boolean

  // Reduced motion: render visible, no transform/stagger, instant.
  const variants = reduce
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit:    { opacity: 0, y: -16 },
      };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={segment ?? 'root'}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: reduce ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ minHeight: '100dvh' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

## Variations
- **Mode**: same-document (`startViewTransition`) vs cross-document (`@view-transition { navigation: auto }`) — same pseudo-elements, different trigger.
- **Pattern** (the knob is *what communicates*): shared-element morph ("same thing"), directional slide ("forward/back"), cross-fade ("same place, new content"), Suspense reveal ("data loaded").
- **Scope of the morph**: one named element vs several (`view-transition-name` per item) — more names = more moving parts, more cost.
- **Easing**: default browser ease vs a deliberate `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) or asymmetric exit-fast / enter-slow timing.
- **Engine**: native VT (cheapest, best-supported for same-doc) → Astro/Next wrappers → Framer Motion (broadest reach, finest spring control, no VT API).

## Accessibility
- **prefers-reduced-motion (MANDATORY, in code above):** directional slides are the top motion-sensitivity trigger. Every snippet either zeroes animation duration on the `::view-transition-*` pseudos, returns `animation: none`, swaps instantly in JS, or swaps Framer variants to opacity-only/instant. Native default with no support is already an instant swap, so the reduced path is "do nothing fancy".
- **Pointer/touch:** these transitions are navigation-driven (click/tap/keyboard), not cursor-hover-driven, so no `(hover: hover)` gate is required. If you add hover-preview transitions, gate them behind `@media (hover: hover) and (pointer: fine)` so touch users are not stranded mid-state.
- **Focus & keyboard:** the destination page/view must render and receive focus normally; the transition is an overlay that does not trap focus. For SPA swaps, move focus to the new view's heading (e.g. `el.focus()` on an `h1` with `tabindex="-1"`) so keyboard and screen-reader users land in the right place.
- **Screen readers / no-JS:** never gate meaning on the animation. The destination must be fully present and readable without the transition (and, for MPAs, without JS at all — `@view-transition` is pure CSS enhancement). The `::view-transition-*` snapshots are inert images and are not announced.
- **Contrast:** the resting state must meet WCAG. In the dark examples, body text `#eef1f6` on background `#0d0f14` is 16.93:1 (passes AA/AAA for normal text, threshold 4.5:1); the teal link/accent `#7fd1c4` on `#0d0f14` is 10.79:1 (passes). Mid-transition blur/opacity dips are decorative and transient, which is acceptable, but never let the final state fall below 4.5:1.

## Performance
- **Animate only `transform`/`opacity`/`filter`** on the pseudo-elements (`translate`, `scale`, `opacity`, short `blur`). Avoid animating `width`/`height`/`top`/`left`, which thrash layout — the morph already interpolates geometry for you via the group, so you rarely need to.
- **Cap the number of named elements.** Each `view-transition-name` spawns its own group/snapshot; naming dozens of list items multiplies snapshot cost and can stutter on low-end devices. Name the few that carry meaning.
- **Snapshot cost is real:** the browser rasterizes old + new states. Very large or full-page snapshots on weak GPUs can hitch — keep transitions short (under ~450ms) so any cost is brief.
- **`will-change` is unnecessary** here; the browser already promotes the transition layers. Don't sprinkle it.
- **Bundle cost:** native VT and Astro `<ClientRouter />` add ~0KB of animation JS. Framer Motion adds ~30-50KB gzipped — only pay it when you need its spring/exit control or pre-VT browser reach.
- **Don't block navigation:** in `startViewTransition`, keep the update callback synchronous/fast; long async work inside it delays the swap and the user perceives lag.
- **4-second cross-document timeout:** if the incoming page does not render within 4 seconds of navigation start, the cross-document transition silently aborts with no on-screen indication. On slow connections, use `<link rel="expect" href="#lead-content" blocking="render">` in the incoming page `<head>` to unblock as soon as the critical element is parsed rather than waiting for full DOMContentLoaded.

## Anti-slop
Cliché (see `_slop-blocklist.md` → MOTION): *every* route fading-and-sliding-up with the same duration and the default `ease`, the entire page sliding on every click, plus the classic autoplay-carousel-with-no-controls. That is "grab the default of every bucket at once". Tasteful version: pick *one* meaningful relationship to animate (the shared hero morph), give forward/back real directional meaning, use a deliberate `cubic-bezier(0.16, 1, 0.3, 1)` or asymmetric exit-fast/enter-slow timing instead of `ease`, keep the header/nav anchored (`::view-transition-group(site-header){ animation:none }`) so only the content moves, and let everything else swap instantly. Vary which elements move; don't transition the whole viewport on every navigation.

## Pairs well with
- **`staggered-entrance`** — once the new view is in, stagger its sub-elements in with the same easing language; keep it short so it doesn't fight perceived speed.
- **`skeleton/loading states`** — the Suspense-reveal pattern (skeleton slides out as content slides in) is a page transition applied to the data handoff.
- **`text-reveal-on-scroll`** — share the expo-out `cubic-bezier(0.16,1,0.3,1)` across page transition and on-scroll reveals so the whole site speaks one motion dialect.
- **`sticky-pinning` / scroll motion** — anchor a persistent header via `view-transition-name` so it stays put while pinned/scrolled content transitions beneath it.

## Current references
- [MDN — View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) — canonical reference for `startViewTransition`, the `::view-transition-*` pseudo-element tree, and `view-transition-name`.
- [MDN — @view-transition at-rule](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition) — the `navigation: auto` opt-in for cross-document MPA transitions.
- [web.dev — Same-document view transitions are now Baseline](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available) — confirms Baseline Newly available 2025-10-14 with Firefox 144; notes Firefox lacks transition *types* initially.
- [CSS-Tricks — Cross-Document View Transitions: The Gotchas Nobody Mentions](https://css-tricks.com/cross-document-view-transitions-part-1/) — real-world name collisions, fallback, and a11y edge cases for MPAs.
- [Astro Docs — View transitions](https://docs.astro.build/en/guides/view-transitions/) — `<ClientRouter />`, `transition:name`, `transition:animate`, and its automatic reduced-motion media query.
- [Next.js Docs — View transitions guide](https://nextjs.org/docs/app/guides/view-transitions) — React `<ViewTransition>` patterns: morph, Suspense reveal, directional `transitionTypes`, crossfade, and a reduced-motion block.
- [Framer Motion — AnimatePresence](https://motion.dev/motion/animate-presence/) — `mode="wait"` exit/enter sequencing and `useReducedMotion` for the no-VT fallback path.
- [Can I use — View Transitions API (single-document)](https://caniuse.com/view-transitions) — live same-document support matrix; ~90% global coverage as of mid-2026.
- [Can I use — Cross-Document View Transitions](https://caniuse.com/cross-document-view-transitions) — MPA transition support matrix; ~86% global coverage, Firefox partial.
