# Hero sections

> The first full-viewport section of a page that establishes brand identity, communicates the primary value proposition, and funnels the visitor toward one clear action.

**Bucket:** layout | component
**Maturity:** evergreen
**Effort:** medium
**Best for:** websites, portfolios, marketing landing pages

## What it is

A hero section occupies the above-the-fold space — typically the full viewport height or a significant portion of it — and delivers the highest-priority message on the page. It combines a headline, a brief supporting line, one primary CTA, and a visual anchor (image, video, illustration, or pure typography). The user's brain parses it in roughly 50 ms: contrast, hierarchy, and focal point determine whether they stay or scroll away. Four durable layout patterns cover most real-world needs: centered (type-led, symmetrical), split (text left / visual right or vice versa), full-bleed media (photograph or video behind type with a scrim), and asymmetric (broken-grid, editorial, off-axis crop).

## When to use

- A marketing landing page where the first impression must convert — product SaaS, agency, portfolio, event.
- Any page whose primary job is to orient a new visitor and direct them to one action.
- When the brand has strong visual assets (photography, illustration, video) worth leading with.
- Editorial or portfolio sites where typographic scale itself is the identity signal.

## When NOT to use

- Authenticated app dashboards and tools where the user already knows what they're doing — a hero wastes prime real estate that belongs to the actual task interface.
- Paginated inner pages (blog post, docs article, product detail) where the content *is* the hero; a hero section becomes a door in front of the room.
- When the site has five or more hero-sized sections stacked vertically — the hero loses meaning if everything is a hero. Reserve it for one focal moment per page.
- Do not add a hero + three identical icon-title-blurb feature cards below it (see Anti-slop). Everyone overuses this skeleton; it is the canonical AI-generated page layout.

## How it works

The hero's visual weight comes from scale and contrast. The browser's rendering pipeline is relevant here: the hero image or large text block is almost always the **Largest Contentful Paint (LCP)** element, so how it loads directly affects Core Web Vitals and perceived speed.

**Layout mechanism:** CSS Grid or Flexbox establishes the split or centered arrangement. `min-height: 100svh` (using the small viewport unit, which excludes mobile browser chrome) keeps the section within the visible fold without overflow. `clamp()` on font-size provides fluid type scaling without breakpoint clutter. For full-bleed media, the image is positioned absolutely behind a containing grid, and a scrim gradient sits between image and text in the stacking order.

**Scrim mechanism:** Text over imagery requires a semi-transparent gradient overlay to guarantee WCAG contrast regardless of image content. A simple `linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0) 60%)` anchored at the bottom covers text that sits in the lower half. An eased gradient (multiple stops following a cubic easing curve) avoids the visible hard-gray band that a linear two-stop produces. The effective background at the text position — the blended result of the image and the overlay — must pass 4.5:1 for body text and 3:1 for large display text (WCAG 1.4.3). Measure against a mid-gray image (worst case, approximately #808080) to be conservative.

**LCP-critical properties:**
- `fetchpriority="high"` on the `<img>` element tells the browser to promote it above the default low priority for images discovered late.
- `<link rel="preload" as="image" fetchpriority="high">` for CSS background images or images loaded by JavaScript, where the browser cannot discover the resource from the initial HTML parse.
- Never use `loading="lazy"` on a hero image — lazy loading always delays LCP.
- `decoding="async"` on non-hero images lower on the page, not the hero itself.
- Serve WebP or AVIF with a JPEG fallback using `<picture>` + `<source>`.

**Semantic structure:** The hero lives inside `<header>` (which implicitly carries `role="banner"` when it is a direct child of `<body>`). The page's single `<h1>` sits inside the hero. If the site header (logo + nav) is separate from the hero block, the hero section uses `<section aria-label="Introduction">` or `<main>` if it is the primary content landmark.

## Working code

### Variant 1 — split hero (light, type-led)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Split hero — Fieldwork Studio</title>
  <style>
    /* ─── reset & tokens ───────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:      #f7f7f8;
      --ink:     #111112;   /* contrast vs --bg: 17.63:1 */
      --sub:     #5c5c6e;   /* contrast vs --bg:  6.11:1 */
      --accent:  #0f4c8a;   /* contrast vs --bg:  8.10:1 */
      --accent-fg: #ffffff; /* contrast vs --accent: 8.67:1 */
    }

    body {
      font-family: 'General Sans', system-ui, sans-serif;
      background: var(--bg);
      color: var(--ink);
    }

    /* ─── hero shell ────────────────────────────────────────────── */
    .hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100svh;
      align-items: center;
    }

    /* ─── text column ───────────────────────────────────────────── */
    .hero__text {
      padding: clamp(3rem, 8vw, 6rem) clamp(2rem, 5vw, 5rem);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .hero__eyebrow {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent);
    }

    .hero__heading {
      font-size: clamp(2.4rem, 5vw, 4.5rem);
      font-weight: 700;
      line-height: 1.05;
      letter-spacing: -0.02em;
      max-width: 14ch;
    }

    .hero__body {
      font-size: clamp(1rem, 1.5vw, 1.2rem);
      line-height: 1.65;
      color: var(--sub);
      max-width: 44ch;
    }

    .hero__actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.85rem 2rem;
      background: var(--accent);
      color: var(--accent-fg);
      font-size: 0.95rem;
      font-weight: 600;
      border: none;
      border-radius: 0.375rem;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.18s ease;
    }

    .btn-primary:focus-visible {
      outline: 3px solid var(--accent);
      outline-offset: 3px;
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      padding: 0.85rem 2rem;
      background: transparent;
      color: var(--ink);
      font-size: 0.95rem;
      font-weight: 500;
      border: 1.5px solid currentColor;
      border-radius: 0.375rem;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.18s ease, border-color 0.18s ease;
    }

    @media (hover: hover) and (pointer: fine) {
      .btn-primary:hover  { background: #0a3a6b; }
      .btn-secondary:hover { color: var(--accent); border-color: var(--accent); }
    }
    .btn-secondary:focus-visible {
      outline: 3px solid var(--accent);
      outline-offset: 3px;
    }

    /* ─── image column ──────────────────────────────────────────── */
    .hero__visual {
      position: relative;
      height: 100%;
      min-height: 30rem;
      overflow: hidden;
    }

    .hero__visual img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
    }

    /* ─── responsive collapse ───────────────────────────────────── */
    @media (max-width: 720px) {
      .hero {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
      }

      .hero__visual {
        order: -1;
        min-height: 50vw;
        max-height: 55vw;
      }
    }

    /* ─── reduced motion ────────────────────────────────────────── */
    @media (prefers-reduced-motion: no-preference) {
      .hero__eyebrow,
      .hero__heading,
      .hero__body,
      .hero__actions {
        opacity: 0;
        transform: translateY(1.2rem);
        animation: fade-rise 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      .hero__eyebrow  { animation-delay: 0.05s; }
      .hero__heading  { animation-delay: 0.15s; }
      .hero__body     { animation-delay: 0.25s; }
      .hero__actions  { animation-delay: 0.35s; }

      @keyframes fade-rise {
        to { opacity: 1; transform: translateY(0); }
      }
    }
    /* When reduced motion is preferred: all elements render fully visible
       with no transform or animation — no fallback needed beyond the above guard. */
  </style>
</head>
<body>
  <header>
    <section class="hero" aria-label="Introduction">
      <div class="hero__text">
        <p class="hero__eyebrow">Environmental research tools</p>
        <h1 class="hero__heading">
          Measure what your field station actually needs
        </h1>
        <p class="hero__body">
          Fieldwork Studio builds precision sensor arrays and data pipelines
          for ecologists who spend more time outdoors than at a desk.
        </p>
        <div class="hero__actions">
          <a href="/configure" class="btn-primary">
            Configure your kit
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                 aria-hidden="true" focusable="false">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor"
                    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
          <a href="/case-studies" class="btn-secondary">See field studies</a>
        </div>
      </div>

      <div class="hero__visual">
        <!--
          fetchpriority="high" — hero image is the LCP element.
          Never add loading="lazy" to a hero image.
        -->
        <img
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1400&q=80"
          alt="Dense forest canopy photographed from below, morning light filtering through leaves"
          width="1400"
          height="960"
          fetchpriority="high"
          decoding="sync"
        >
      </div>
    </section>
  </header>
</body>
</html>
```

### Variant 2 — full-bleed media hero with scrim

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Full-bleed hero — Carbonhawk</title>

  <!--
    Preload the hero image so it is discoverable before stylesheet parsing.
    fetchpriority="high" ensures browser elevates it above default image priority.
    imagesrcset allows the browser to select the best size for the viewport.
  -->
  <link
    rel="preload"
    as="image"
    imagesrcset="
      https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=75  800w,
      https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=75 1400w,
      https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2200&q=75 2200w
    "
    imagesizes="100vw"
    fetchpriority="high"
  >

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --text-primary:  #f2f2f4;   /* contrast vs effective scrim bg (#242424): 14.26:1 */
      --text-secondary: #a8a8b0;  /* contrast vs #0d0d0f (dark bg fallback): 8.22:1 */
    }

    body { font-family: 'Instrument Serif', Georgia, serif; background: #0d0d0f; }

    /* ─── hero container ────────────────────────────────────────── */
    .hero {
      position: relative;
      min-height: 100svh;
      display: grid;
      place-items: end start;
      overflow: hidden;
    }

    /* ─── background image ──────────────────────────────────────── */
    .hero__bg {
      position: absolute;
      inset: 0;
      z-index: 0;
    }

    .hero__bg img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 30%;
      display: block;
    }

    /* ─── scrim: eased gradient anchored to bottom ──────────────── */
    /*
      A two-stop linear-gradient produces a visible grey band at the midpoint.
      The multi-stop approach below applies an ease-in curve across the alpha
      values, eliminating the banding artifact.
      At the text position the blended effective background is approximately
      #242424 (0.28 × mid-gray image + 0.72 × black), giving white text
      a contrast ratio of 14.26:1 against a worst-case mid-gray image.
    */
    .hero__bg::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to top,
        rgba(0, 0, 0, 0.82)  0%,
        rgba(0, 0, 0, 0.72)  10%,
        rgba(0, 0, 0, 0.55)  20%,
        rgba(0, 0, 0, 0.37)  35%,
        rgba(0, 0, 0, 0.20)  52%,
        rgba(0, 0, 0, 0.07)  70%,
        rgba(0, 0, 0, 0.00) 100%
      );
      z-index: 1;
    }

    /* ─── text content ──────────────────────────────────────────── */
    .hero__content {
      position: relative;
      z-index: 2;
      padding: clamp(3rem, 7vw, 5.5rem) clamp(2rem, 7vw, 6rem);
      max-width: 760px;
    }

    .hero__heading {
      font-size: clamp(3rem, 7vw, 6rem);
      font-weight: 400;   /* Instrument Serif reads well at regular weight at display size */
      line-height: 1.02;
      letter-spacing: -0.01em;
      color: var(--text-primary);
      margin-bottom: 1.25rem;
    }

    .hero__heading em {
      font-style: italic;
    }

    .hero__sub {
      font-family: system-ui, sans-serif;
      font-size: clamp(1rem, 1.6vw, 1.2rem);
      font-weight: 400;
      line-height: 1.6;
      color: var(--text-secondary);
      max-width: 42ch;
      margin-bottom: 2.25rem;
    }

    .btn-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.9rem 2.25rem;
      background: #f2f2f4;
      color: #111112;           /* contrast: 17.37:1 against #f2f2f4 */
      font-family: system-ui, sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      border: none;
      border-radius: 0.25rem;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.18s ease, color 0.18s ease;
    }

    @media (hover: hover) and (pointer: fine) {
      .btn-cta:hover { background: #fff; }
    }
    .btn-cta:focus-visible {
      outline: 3px solid #f2f2f4;
      outline-offset: 3px;
    }

    /* ─── pause button (for video variant) ─────────────────────── */
    /* Position in top-right corner; shown only when video is playing.
       Satisfies WCAG 2.2.2 Pause, Stop, Hide. */
    .hero__pause {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 3;
      background: rgba(0, 0, 0, 0.55);
      color: #f2f2f4;
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 0.25rem;
      padding: 0.5rem 0.85rem;
      font-family: system-ui, sans-serif;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
    }
    .hero__pause:focus-visible { outline: 2px solid #f2f2f4; outline-offset: 3px; }

    /* ─── responsive ────────────────────────────────────────────── */
    @media (max-width: 600px) {
      .hero__content { padding-bottom: 4rem; }
    }

    /* ─── reduced motion ────────────────────────────────────────── */
    @media (prefers-reduced-motion: no-preference) {
      .hero__heading,
      .hero__sub,
      .btn-cta {
        opacity: 0;
        transform: translateY(1.5rem);
        animation: rise 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      .hero__heading { animation-delay: 0.1s; }
      .hero__sub     { animation-delay: 0.22s; }
      .btn-cta       { animation-delay: 0.34s; }

      @keyframes rise {
        to { opacity: 1; transform: translateY(0); }
      }
    }
    /* Reduced-motion path: elements stay fully visible, no transform, no animation.
       The guard above ensures nothing animates unless the user has not opted out. */
  </style>
</head>
<body>
  <header>
    <section class="hero" aria-label="Introduction">

      <div class="hero__bg">
        <img
          srcset="
            https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=75  800w,
            https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=75 1400w,
            https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2200&q=75 2200w
          "
          sizes="100vw"
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=75"
          alt=""
          aria-hidden="true"
          width="1400"
          height="933"
          fetchpriority="high"
          decoding="sync"
        >
        <!--
          alt="" and aria-hidden="true": the image is decorative context;
          the text communicates the full message. Screen readers skip the image.
        -->
      </div>

      <div class="hero__content">
        <h1 class="hero__heading">
          Carbon removed,<br><em>verifiably.</em>
        </h1>
        <p class="hero__sub">
          Carbonhawk monitors direct air capture installations in real time,
          giving buyers independently audited certificates within 48 hours
          of sequestration.
        </p>
        <a href="/how-it-works" class="btn-cta">
          See how it works
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
               aria-hidden="true" focusable="false">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor"
                  stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>

    </section>
  </header>
</body>
</html>
```

### Variant 3 — React / Tailwind asymmetric hero

This variant is the realistic choice when the project already uses Tailwind and React. The asymmetric treatment uses an off-center image crop and a typographic column that deliberately exceeds the text column width into the image zone, creating tension.

```tsx
// AsymmetricHero.tsx
// Requires: React 18+, Tailwind CSS v3+, Framer Motion 11+
import { motion, useReducedMotion } from "framer-motion";

interface AsymmetricHeroProps {
  eyebrow: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
}

// Custom expo-out easing — reads premium versus default ease
const EXPO_OUT = [0.16, 1, 0.3, 1] as const;

export function AsymmetricHero({
  eyebrow,
  heading,
  body,
  ctaLabel,
  ctaHref,
  imageSrc,
  imageAlt,
}: AsymmetricHeroProps) {
  const prefersReducedMotion = useReducedMotion();

  // When reduced motion is preferred, Framer Motion's useReducedMotion()
  // returns true. We swap all animated variants to instant/static versions.
  const fadeUp = prefersReducedMotion
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0, y: 20 },
        show: (delay: number) => ({
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: EXPO_OUT, delay },
        }),
      };

  return (
    <header>
      <section
        aria-label="Introduction"
        className="relative grid min-h-svh overflow-hidden bg-[#f7f7f8]"
        style={{ gridTemplateColumns: "55% 1fr" }}
      >
        {/* ── text column ────────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col justify-center px-[clamp(2rem,7vw,6rem)] py-24">
          <motion.p
            className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#0f4c8a]"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0.05}
          >
            {eyebrow}
          </motion.p>

          <motion.h1
            className="mb-5 text-[clamp(2.5rem,4.5vw,5rem)] font-bold
                       leading-[1.04] tracking-[-0.025em] text-[#111112]
                       max-w-[13ch]"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0.15}
          >
            {heading}
          </motion.h1>

          <motion.p
            className="mb-8 max-w-[44ch] text-[clamp(1rem,1.4vw,1.15rem)]
                       leading-relaxed text-[#5c5c6e]"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0.25}
          >
            {body}
          </motion.p>

          <motion.a
            href={ctaHref}
            className="inline-flex w-fit items-center gap-2 rounded
                       bg-[#0f4c8a] px-8 py-4 text-sm font-semibold
                       uppercase tracking-wide text-white
                       transition-colors duration-200
                       [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#0a3a6b]
                       focus-visible:outline focus-visible:outline-[3px]
                       focus-visible:outline-[#0f4c8a] focus-visible:outline-offset-3"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0.35}
          >
            {ctaLabel}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.a>
        </div>

        {/* ── visual column — image bleeds off right edge ─────────── */}
        <div className="relative overflow-hidden">
          <img
            src={imageSrc}
            alt={imageAlt}
            width={900}
            height={1200}
            fetchPriority="high"
            decoding="sync"
            className="absolute inset-0 h-full w-full object-cover object-[40%_center]"
          />
          {/* Vertical gradient bleeds the image into the text column */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, #f7f7f8 0%, transparent 35%)",
            }}
            aria-hidden="true"
          />
        </div>

        {/* ── responsive: stack on narrow viewports ──────────────── */}
        <style>{`
          @media (max-width: 720px) {
            section[aria-label="Introduction"] {
              grid-template-columns: 1fr !important;
              grid-template-rows: 48vw auto;
            }
            section[aria-label="Introduction"] > div:last-child {
              grid-row: 1;
            }
          }
        `}</style>
      </section>
    </header>
  );
}

// Usage:
// <AsymmetricHero
//   eyebrow="Infrastructure monitoring"
//   heading="Know before the on-call alert fires"
//   body="Parsec watches 400+ signals per host and surfaces anomalies
//         three minutes before they page your team."
//   ctaLabel="Start a free trial"
//   ctaHref="/signup"
//   imageSrc="/images/server-room.jpg"
//   imageAlt="Data center aisle with blue indicator lights on rack servers"
// />
```

## Variations

| Variant | Layout knob | Best signal to choose it |
|---|---|---|
| **Centered type-led** | Single column, headline centered, CTA below | Brand has no strong imagery; typography is the identity |
| **Split (50/50 or 60/40)** | Two columns, text left / visual right | Product screenshot, portrait, or interactive demo is a key persuasion asset |
| **Full-bleed media** | Image/video fills 100% of hero; text overlaid with scrim | Photography or cinematography is the brand's primary asset (travel, real estate, editorial) |
| **Asymmetric / broken-grid** | Unequal columns, image bleeds through boundaries, deliberate overlap | Editorial voice, creative agency, portfolio — the layout asymmetry itself is a signal of taste |
| **Pure typographic** | No imagery; oversized display type fills the hero | When no photography is available or restraint is the message |

The knob that changes between them is primarily `grid-template-columns` — from `1fr` (centered), to `1fr 1fr` (split), to `position: absolute` fill (full-bleed), to `55% 1fr` with `clip-path` or gradient bleeds (asymmetric).

## Accessibility

**prefers-reduced-motion (mandatory for anything that moves)**

All three code examples above guard animations inside `@media (prefers-reduced-motion: no-preference)` or with Framer Motion's `useReducedMotion()`. The reduced-motion path is the default — animation is opt-in, not opt-out. Under reduction, every element renders at full opacity and natural position immediately; no `opacity: 0` or `transform` is applied.

```css
/* The correct guard pattern — never invert this logic */
@media (prefers-reduced-motion: no-preference) {
  .hero__heading {
    opacity: 0;
    transform: translateY(1.2rem);
    animation: rise 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes rise {
    to { opacity: 1; transform: translateY(0); }
  }
}
/* When reduced motion is preferred: element is visible at rest,
   zero transforms applied, no animation runs. */
```

**Autoplay video in full-bleed heroes**

WCAG 2.2.2 (Pause, Stop, Hide) requires a visible control for any content that auto-plays and lasts longer than 3 seconds. Provide a pause button in the DOM, not hidden behind hover. Additionally respect `prefers-reduced-motion` by pausing video in JavaScript:

```js
const video = document.querySelector('.hero__video');
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReduced) {
  // Pause and show a static poster frame instead
  video.pause();
  video.removeAttribute('autoplay');
} else {
  video.play().catch(() => {});  // play() returns a Promise; catch rejection gracefully
}

document.querySelector('.hero__pause').addEventListener('click', () => {
  video.paused ? video.play() : video.pause();
});
```

**Touch and pointer fallback**

Hover-triggered effects (button color shifts, image pan on cursor move) must be scoped to `@media (hover: hover) and (pointer: fine)`. On touch devices, the `:hover` state can get sticky after a tap; wrapping hover styles prevents that:

```css
@media (hover: hover) and (pointer: fine) {
  .btn-primary:hover { background: #0a3a6b; }
}
```

**Contrast over imagery — measured values for this file's colors**

- `#f2f2f4` text on effective scrim background `#242424` (worst-case mid-gray image at 72% opacity overlay): **14.26:1** — passes WCAG AAA
- `#111112` on `#f7f7f8` (split/light hero): **17.63:1** — passes WCAG AAA
- `#5c5c6e` subtext on `#f7f7f8`: **6.11:1** — passes WCAG AA
- `#ffffff` on `#0f4c8a` (primary CTA button): **8.67:1** — passes WCAG AAA
- `#0f4c8a` on `#f7f7f8` (link/accent text): **8.10:1** — passes WCAG AAA

All ratios computed using the WCAG relative luminance formula for the specific hex pairs used in the code above.

**Semantic landmark and heading order**

- The `<header>` element (direct child of `<body>`) implicitly carries `role="banner"`. No `role="banner"` attribute is needed unless you are not using `<header>`.
- One `<h1>` per page — it belongs in the hero.
- If the site navigation lives in a separate `<nav>` inside `<header>`, the hero text block should be inside `<section aria-label="Introduction">` within `<main>`, or placed after the nav, to keep landmark regions clean.
- Decorative hero images: `alt=""` and `aria-hidden="true"` so screen readers skip them. The text in the hero communicates the full message.

**Focus management**

The hero typically contains the first interactive element on the page (the CTA). Ensure tab order flows: skip link → logo → primary nav → hero CTA. The CTA `focus-visible` outline uses `outline-offset: 3px` to clear the button boundary without a box-shadow hack that can disappear on Windows High Contrast mode.

## Performance

**LCP — the hero's defining performance concern**

The hero image or large heading is almost always the LCP element. Treating it correctly can move LCP from 3.5 s to under 2.5 s.

- **Use `fetchpriority="high"` on the `<img>` element.** This promotes the image above the browser's default low-inference priority for images, which only escalates after layout completes — often too late. Use it on exactly one image per page; multiple high-priority images cancel each other out.
- **Add `<link rel="preload" as="image" fetchpriority="high">` for CSS background images** or any image loaded by JavaScript, where the browser cannot discover it from the initial HTML parse. Include `imagesrcset` and `imagesizes` to match the srcset logic.
- **Never use `loading="lazy"` on the hero image.** Lazy loading always adds a resource load delay penalty to LCP.
- **Serve WebP or AVIF.** AVIF typically achieves 30–50% smaller file sizes than JPEG at equivalent quality. Use `<picture>` with `<source type="image/avif">` + `<source type="image/webp">` + `<img>` JPEG fallback.
- **Responsive `srcset`.** A 2400 px image downloaded on a 390 px mobile screen wastes 300–500 KB. Include at minimum: 400 w, 800 w, 1400 w, 2000 w breakpoints.
- **Set explicit `width` and `height` attributes** on `<img>` elements to give the browser the aspect ratio before the image loads, preventing layout shift (CLS).

**Animation — GPU compositing budget**

- Animate only `transform` and `opacity`. These run on the compositor thread and do not trigger layout or paint.
- Do not animate `width`, `height`, `top`, `left`, `box-shadow`, `border-radius` on large elements — these cause layout recalculation or paint on every frame.
- `will-change: transform` hints to the browser to promote the element to its own compositor layer. Use sparingly — every layer consumes GPU memory. Apply only to elements that will animate, and remove after animation completes via a `animationend` listener if the element does not stay animated.
- `backdrop-filter` on the scrim overlay is expensive: it forces the browser to create an offscreen render surface for the content below. Prefer a solid or semi-transparent gradient (`rgba`) over `backdrop-filter: blur()` for the hero scrim.

**Critical CSS**

Inline the hero's CSS in a `<style>` block in `<head>` to eliminate the render-blocking stylesheet download for above-the-fold content. Defer remaining styles with `<link rel="stylesheet" media="print" onload="this.media='all'">`.

## Anti-slop

**The cliche (see _slop-blocklist.md — Layout and Surface):** Hero section + exactly three identical icon-title-blurb feature cards immediately below. This is the single most recognizable AI-generated page skeleton. The hero is generic SaaS blue (`#3B82F6`) with a purple-to-pink gradient aurora blob centered behind the heading, Inter at one weight, and the headline reads "Empower your team to seamlessly unlock their potential."

**The tasteful alternative:**

1. **Break the symmetric layout.** Use a 55/45 split with the image bleeding into the heading column, or a full-bleed image with the headline anchored to the lower-left at display scale, rather than centered.
2. **Kill the aurora blob.** A subtle single-hue tonal wash (one hue shifted via OKLCH lightness) is acceptable as a surface texture; a multicolored radial gradient blob is the loudest possible AI signal.
3. **One non-default typeface at display.** Instrument Serif, Fraunces, or Satoshi at a real modular scale (e.g., 5 rem heading, 1.15 rem body) reads as a design decision. Inter at 2 rem at 400 weight reads as the browser default.
4. **Write specific, concrete copy.** "Carbon removed, verifiably." over "Empower sustainable transformation." The former tells the reader something; the latter tells them nothing.
5. **What follows the hero matters as much as the hero itself.** Instead of three identical cards, use an editorial row with varied column widths, a single strong testimonial set in large type, or a horizontal scroll of actual work. The hero should *open a story*, not arrive with its three children fully assembled.

## Pairs well with

- **Text reveal on scroll** (`02-scroll-motion/text-reveal-on-scroll.md`) — the first scroll-triggered moment directly below the hero; the two should share easing language so the page feels continuous.
- **Sticky pinning / scroll-linked transitions** — a hero whose background parallaxes or whose content stays pinned while the next section scrolls over it creates a composed entry.
- **Editorial typographic systems** (`05-typography-color/`) — the display scale established in the hero should continue as a consistent modular scale through section headings.
- **Bento grid layouts** (`03-layout-systems/`) — the single asymmetric hero opening into a varied bento below is a strong alternative to the hero-plus-three-cards cliche.
- **Staggered entrance motion** — the fade-rise stagger shown in the code examples above should use the same cubic-bezier `[0.16, 1, 0.3, 1]` as any other entrance animation on the page.

## Current references

- [Optimize Largest Contentful Paint — web.dev](https://web.dev/articles/optimize-lcp) — authoritative guide to fetchpriority, preload, lazy-load pitfalls, and resource discovery for hero images
- [Preload responsive images — web.dev](https://web.dev/articles/preload-responsive-images) — imagesrcset + imagesizes on preload links; how to preload art-directed picture elements
- [fetchpriority tip for LCP hero images — Addy Osmani](https://addyosmani.com/blog/fetch-priority/) — concise case for priority hints; real-world LCP improvement data
- [WCAG 2.2 Success Criterion 1.4.3 Contrast (Minimum) — W3C](https://www.w3.org/TR/WCAG22/#contrast-minimum) — the canonical, permanently current specification for 4.5:1 body-text and 3:1 large-text contrast requirements, including text overlaid on images
- [Handling text over images in CSS — Ahmad Shadeed](https://ishadeed.com/article/handling-text-over-image-css/) — eased gradient technique, directional variants, practical code patterns
- [ARIA: banner role — MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/banner_role) — when header implicitly carries banner, when to use explicit role
- [prefers-reduced-motion: sometimes less movement is more — web.dev](https://web.dev/articles/prefers-reduced-motion) — correct guard pattern, vestibular disorder context, JS matchMedia usage
- [Can auto-playing videos be accessible? — Thoughtbot](https://thoughtbot.com/blog/can-auto-playing-videos-be-accessible) — WCAG 2.2.2 pause controls, reduced-motion video handling
- [Awwwards inspiration gallery](https://www.awwwards.com/inspiration/) — browse current award-winning sites with strong hero treatments across typographic, full-bleed, and asymmetric layouts; filter manually by category once on the page
- [CSS hero sections with asymmetrical designs — Envato Tuts+](https://webdesign.tutsplus.com/css-hero-sections-with-asymmetrical-designs--cms-106695t) — clip-path, skew, and CSS-only asymmetry techniques
