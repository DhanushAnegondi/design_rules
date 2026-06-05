# Responsive images & art direction

> Tell the browser exactly which image file to fetch for each device, viewport size, and pixel density — and never let a layout shift or oversized download slip through.

**Bucket:** layout
**Maturity:** evergreen
**Effort:** medium
**Best for:** websites, portfolios, apps, dashboards, carousels

## What it is

Every `<img>` on a modern page carries two distinct problems: resolution switching (the same composition served at the right file size for each device) and art direction (a different crop or composition entirely depending on layout). HTML solves both in the markup layer — before any CSS or JavaScript runs — by letting the parser read `srcset`, `sizes`, and `<picture>` source hints during its speculative preload pass. The browser then picks the best candidate based on viewport width, device pixel ratio, connection speed, and MIME-type support, without JavaScript involvement. The user sees an image that is sharp on high-DPI screens, correctly cropped at narrow viewports, encoded in the most efficient format the browser supports (AVIF > WebP > JPEG/PNG fallback), and never causes a layout jump because intrinsic dimensions are declared up front.

## When to use

- Hero and editorial images where the composition needs to change between portrait mobile and landscape desktop (art direction with `<picture>`).
- Any photograph or illustration that spans a fluid column — use `srcset` width descriptors plus `sizes` so the browser fetches only what it needs.
- LCP candidates (largest image on first paint) — add `fetchpriority="high"` and omit `loading="lazy"` to get the resource into the network queue as early as possible.
- Icon and logo assets shown at a fixed CSS size across multiple pixel densities — use density descriptors (`1x`, `2x`) instead of width descriptors.
- Long article or product listing pages where most images are below the fold — `loading="lazy"` removes them from the initial payload entirely.
- Any image whose natural dimensions are unknown at render time — set `width` and `height` HTML attributes plus `height: auto` in CSS to let the browser pre-reserve the correct aspect-ratio box.

## When NOT to use

- Do not lazy-load the LCP image. The browser defers lazy images by design; combining `loading="lazy"` with `fetchpriority="high"` is contradictory and degrades LCP.
- Do not scatter `fetchpriority="high"` across more than one or two images per page. Boosting more than that makes the hint meaningless — every resource is "high" so nothing actually wins.
- Do not use `<picture>` just for format switching when a simple `srcset`/`sizes` on `<img>` will do. `<picture>` is the right tool only when the crop or composition changes; format negotiation alone does not require it.
- Do not omit `width` and `height` attributes on lazy-loaded images. Without dimensions the browser cannot pre-allocate space, the intrinsic size is 0×0, and a significant layout shift fires when the image loads — this is the single most common cause of poor CLS scores on image-heavy pages.
- Do not write `sizes="100vw"` on every image as a default. That tells the browser the image fills the entire viewport, which causes it to fetch the largest available source even on a constrained mobile connection. Describe the actual rendered width (e.g., `sizes="(min-width: 1200px) 600px, (min-width: 640px) 50vw, 100vw"`).
- Do not choose srcset breakpoints by device model (375, 768, 1024…). Choose them by file-size jumps so no user downloads more than ~20–30 KB beyond what their layout actually renders.

## How it works

The HTML parser makes a single speculative pass before layout is known. It reads `srcset` and `sizes` on `<img>` elements (or the `<source>` children of `<picture>`) to build a candidate list, evaluates the media conditions in `sizes`, multiplies the slot width by the device pixel ratio, then fetches the best match. Because this all happens in the preload scanner — before CSS paint, before JavaScript runs — HTML-native responsive image markup is always faster than any JavaScript-based image switcher.

**Key mechanisms:**

| Attribute / element | Purpose |
|---|---|
| `srcset="img-400.jpg 400w, img-800.jpg 800w"` | Candidate list with intrinsic width descriptors |
| `srcset="img.jpg 1x, img-2x.jpg 2x"` | Candidate list with pixel-density descriptors (fixed-CSS-size images) |
| `sizes="(min-width: 900px) 50vw, 100vw"` | Tells the browser the rendered slot width at each breakpoint |
| `<picture>` | Wraps `<source>` elements; browser picks the first matching one |
| `<source type="image/avif">` | Format negotiation — browser skips if unsupported |
| `<source media="(min-width: 800px)">` | Art direction — browser picks based on viewport condition |
| `loading="lazy"` | Defers fetch until image is ~1250–2500 px from viewport (connection-dependent) |
| `fetchpriority="high"` | Moves resource to high network priority; shaves 100–300 ms off LCP on average |
| `width` / `height` HTML attributes | Enable browser to compute aspect ratio before image loads, preventing CLS |
| `aspect-ratio` CSS | Explicit ratio for cases where HTML dimensions are unavailable |
| `decoding="async"` | Hints the browser to decode off the main thread for non-critical images |

**Format support as of mid-2026:**
- AVIF: ~94% global coverage (Chrome 85+, Firefox 93+, Safari 16+, Edge 90+). Safe to ship with a WebP fallback.
- WebP: ~97% global coverage (Chrome 32+, Firefox 65+, Safari 14+, Edge 18+). Safe to use as the primary fallback.

## Working code

### 1. Resolution switching — fluid image with srcset + sizes

Complete, standalone HTML document. Copy and run in any browser.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Resolution switching demo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: system-ui, sans-serif;
      background: #0f0f11;
      color: #e8e8ec;
      padding: 2rem 1rem;
    }

    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
      gap: 1.5rem;
      max-width: 1200px;
      margin-inline: auto;
    }

    /*
      height: auto ensures the browser-calculated aspect ratio
      (derived from the width/height HTML attributes) controls
      the rendered height. Without this, the image may not scale.
    */
    .gallery img {
      width: 100%;
      height: auto;
      display: block;
      border-radius: 6px;
      background: #1e1e24; /* placeholder colour while loading */
    }
  </style>
</head>
<body>
  <div class="gallery">

    <!--
      The LCP candidate: no lazy loading, high fetch priority.
      width/height declare the intrinsic aspect ratio (16:9 here)
      so the browser reserves 16:9 space before the file arrives.
      srcset lists every available file with its intrinsic width.
      sizes tells the browser the rendered slot at each breakpoint,
      matching the CSS grid column behaviour above.
    -->
    <img
      src="waterfall-800.jpg"
      srcset="
        waterfall-400.jpg   400w,
        waterfall-800.jpg   800w,
        waterfall-1200.jpg 1200w,
        waterfall-1600.jpg 1600w
      "
      sizes="
        (min-width: 1260px) 580px,
        (min-width: 660px)  calc(50vw - 2.5rem),
        calc(100vw - 2rem)
      "
      width="1600"
      height="900"
      fetchpriority="high"
      decoding="sync"
      alt="Water cascades over mossy granite into a still pool below"
    >

    <!-- Below-fold images: lazy load, async decode, low priority -->
    <img
      src="forest-800.jpg"
      srcset="
        forest-400.jpg   400w,
        forest-800.jpg   800w,
        forest-1200.jpg 1200w
      "
      sizes="
        (min-width: 1260px) 580px,
        (min-width: 660px)  calc(50vw - 2.5rem),
        calc(100vw - 2rem)
      "
      width="1200"
      height="800"
      loading="lazy"
      decoding="async"
      alt="Morning mist rising through a stand of old-growth Douglas fir"
    >

    <img
      src="coast-800.jpg"
      srcset="
        coast-400.jpg   400w,
        coast-800.jpg   800w,
        coast-1200.jpg 1200w
      "
      sizes="
        (min-width: 1260px) 580px,
        (min-width: 660px)  calc(50vw - 2.5rem),
        calc(100vw - 2rem)
      "
      width="1200"
      height="800"
      loading="lazy"
      decoding="async"
      alt="Rocky headland at low tide, tide pools visible in the foreground"
    >

  </div>
</body>
</html>
```

---

### 2. Art direction + format negotiation with `<picture>`

The `<source>` elements are evaluated top-to-bottom; the browser picks the first one whose `media` and `type` match. AVIF is offered first (best compression), then WebP (broadest modern coverage), then the `<img>` JPEG fallback. The `media` attribute switches the composition at 800 px — a tightly cropped portrait for narrow viewports, a wide landscape for desktop.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Art direction + format demo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: system-ui, sans-serif;
      background: #0f0f11;
      color: #e8e8ec;
    }

    .hero {
      width: 100%;
      /* Explicit aspect-ratio as a safety net for browsers that
         ignore width/height on <picture>/<img> inside flex/grid
         contexts. Remove if your layout always sets a container size. */
      aspect-ratio: 16 / 9;
      overflow: hidden;
    }

    /* Apply object-fit and object-position to the <img>, not <picture> */
    .hero img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
      display: block;
    }

    @media (max-width: 799px) {
      .hero {
        aspect-ratio: 4 / 5; /* portrait crop proportions on mobile */
      }
    }
  </style>
</head>
<body>

  <!--
    Order of <source> evaluation:
    1. Browser checks media condition (viewport width).
    2. Within matching sources, checks type (MIME type support).
    3. Falls through to <img> src if nothing matched.

    Art direction rule:
    - >= 800px wide viewport → landscape crop (hero-wide.*)
    - < 800px viewport → portrait crop (hero-portrait.*)

    Format rule per breakpoint: AVIF → WebP → JPEG
  -->
  <picture>
    <!-- Wide viewport, AVIF -->
    <source
      media="(min-width: 800px)"
      type="image/avif"
      srcset="
        hero-wide-800.avif   800w,
        hero-wide-1200.avif 1200w,
        hero-wide-1600.avif 1600w,
        hero-wide-2400.avif 2400w
      "
      sizes="100vw"
    >
    <!-- Wide viewport, WebP fallback -->
    <source
      media="(min-width: 800px)"
      type="image/webp"
      srcset="
        hero-wide-800.webp   800w,
        hero-wide-1200.webp 1200w,
        hero-wide-1600.webp 1600w,
        hero-wide-2400.webp 2400w
      "
      sizes="100vw"
    >
    <!-- Narrow viewport, AVIF -->
    <source
      type="image/avif"
      srcset="
        hero-portrait-400.avif  400w,
        hero-portrait-800.avif  800w,
        hero-portrait-1200.avif 1200w
      "
      sizes="100vw"
    >
    <!-- Narrow viewport, WebP fallback -->
    <source
      type="image/webp"
      srcset="
        hero-portrait-400.webp  400w,
        hero-portrait-800.webp  800w,
        hero-portrait-1200.webp 1200w
      "
      sizes="100vw"
    >
    <!--
      Fallback <img>: always present, carries all a11y attributes,
      width/height lock the CLS-preventing aspect ratio (16:9).
      fetchpriority="high" because this is the LCP element.
    -->
    <img
      src="hero-wide-1200.jpg"
      width="1600"
      height="900"
      alt="Aerial view of Lisbon's terracotta rooftops at golden hour"
      fetchpriority="high"
      decoding="sync"
    >
  </picture>

</body>
</html>
```

---

### 3. Fixed-size icon at multiple pixel densities (density descriptors)

When the CSS size is fixed and only sharpness varies across screens, use `x` descriptors rather than `w` + `sizes`. Complete standalone document — copy and open in any browser to verify rendering.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Density descriptor demo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: system-ui, sans-serif;
      background: #1e1e24;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100svh;
      padding: 2rem;
    }

    .logo-lockup {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    /*
      Fixed CSS width: the image is always 120 × 40 px in layout.
      The browser chooses 1x, 2x, or 3x based on device pixel ratio.
      height: auto is set so the declared height attribute still
      controls the intrinsic ratio when CSS overrides width.
    */
    .logo-lockup img {
      width: 120px;
      height: auto;
      display: block;
    }

    .logo-lockup figcaption {
      font-size: 0.75rem;
      color: #9999aa;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <figure class="logo-lockup">
    <!--
      srcset with x-descriptors: browser picks 1x on standard screens,
      2x on Retina/HiDPI, 3x on high-density mobile (e.g. Pixel 9).
      width/height declare the intrinsic dimensions of the 1x asset
      so the browser pre-allocates layout space.
      No sizes attribute needed — the CSS width is fixed.
    -->
    <img
      src="logo.png"
      srcset="logo.png 1x, logo-2x.png 2x, logo-3x.png 3x"
      width="120"
      height="40"
      alt="Fieldstone Studio"
    >
    <figcaption>Logo served at the correct density for your screen</figcaption>
  </figure>
</body>
</html>
```

---

### 4. Preventing CLS when intrinsic dimensions are unknown at build time

Use the CSS `aspect-ratio` property when the image dimensions are dynamic (e.g., user-uploaded content from a CMS where width/height are not reliably available). Pair with a low-quality placeholder background. Complete standalone document.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CLS guard — dynamic aspect ratio</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: system-ui, sans-serif;
      background: #0f0f11;
      color: #e8e8ec;
      padding: 2rem 1rem;
    }

    /*
      aspect-ratio on the wrapper pre-reserves the layout slot
      in the correct proportions before the image bytes arrive.
      This eliminates the CLS that would otherwise occur when
      a CMS image with unknown dimensions loads and pushes
      surrounding content downward.
    */
    .dynamic-image-wrapper {
      aspect-ratio: 4 / 3;     /* known or approximate ratio for this slot */
      width: 100%;
      max-width: 600px;
      margin-inline: auto;
      overflow: hidden;
      border-radius: 6px;
      background: #1e1e24;     /* placeholder while image loads */
    }

    .dynamic-image-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  </style>
</head>
<body>
  <div class="dynamic-image-wrapper">
    <!--
      No width/height attributes here because CMS does not expose them.
      The wrapper's aspect-ratio: 4/3 handles the layout reservation.
      srcset and sizes ensure the right file size is fetched.
    -->
    <img
      src="user-photo-800.jpg"
      srcset="user-photo-400.jpg 400w, user-photo-800.jpg 800w, user-photo-1200.jpg 1200w"
      sizes="(min-width: 900px) 600px, 100vw"
      loading="lazy"
      decoding="async"
      alt="Portrait of Maya Chen, product designer"
    >
  </div>
</body>
</html>
```

---

### 5. Preloading a CSS background-image LCP candidate

When the LCP element is a CSS `background-image` the parser cannot discover it early. Use a `<link rel="preload">` with `fetchpriority="high"` in `<head>`. Complete standalone document.

**Note on format fallback:** CSS `background-image` cannot negotiate formats the way `<picture>` can — the browser always fetches the declared URL regardless of AVIF support. For full AVIF → WebP → JPEG fallback control, replace the CSS background with a `<picture>` element. The preload pattern below is a targeted LCP fix for existing CSS-driven hero sections; it only preloads one format (AVIF here). Serve AVIF by default and rely on server-side content negotiation (e.g., Accept header routing on a CDN) if WebP fallback is required.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CSS background-image LCP preload</title>

  <!--
    Preload the AVIF version for supporting browsers (Chrome 85+,
    Firefox 93+, Safari 16+, Edge 90+ — ~94% coverage mid-2026).
    fetchpriority="high" moves this resource to the top of the
    network queue before the parser reaches the CSS that declares it.

    LIMITATION: CSS cannot express AVIF → WebP → JPEG format fallback.
    If you need format negotiation, replace this pattern with a
    <picture> element. Use this preload approach only when a CSS
    background is already in production and cannot be refactored.
  -->
  <link
    rel="preload"
    as="image"
    href="/images/hero-bg.avif"
    type="image/avif"
    fetchpriority="high"
  >

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: system-ui, sans-serif;
      color: #e8e8ec;
    }

    .hero-bg {
      /*
        background-image always fetches the declared URL — no browser
        format negotiation here. Serve AVIF via CDN content negotiation
        or switch to <picture> for full AVIF → WebP → JPEG fallback.
      */
      background-image: url('/images/hero-bg.avif');
      background-size: cover;
      background-position: center;
      min-height: 60svh;
      display: flex;
      align-items: flex-end;
      padding: 3rem 2rem;
    }

    .hero-bg__caption {
      font-size: clamp(1.25rem, 4vw, 2rem);
      font-weight: 700;
      max-width: 42ch;
      /* #e8e8ec on a dark photographic background.
         Overlay ensures contrast — verify in context with real image. */
      text-shadow: 0 1px 4px rgba(0,0,0,0.7);
    }
  </style>
</head>
<body>
  <section class="hero-bg" aria-label="Hero section">
    <p class="hero-bg__caption">Hand-thrown ceramics fired in a wood kiln</p>
  </section>
</body>
</html>
```

## Variations

| Variant | Key knob |
|---|---|
| Resolution switching only | `srcset` + `sizes` on `<img>`, no `<picture>` needed |
| Format negotiation only | `<picture>` with `<source type="image/avif">` and `<source type="image/webp">`, single composition |
| Art direction only | `<picture>` with `<source media="...">`, no `type` attribute |
| Art direction + format | `<picture>` with both `media` and `type` on separate `<source>` elements (most complete) |
| Density switching | `srcset` with `1x`/`2x`/`3x` descriptors; no `sizes` needed; fixed CSS width |
| Lazy gallery | `loading="lazy"` on all below-fold images; `width`/`height` mandatory |
| LCP boost | `fetchpriority="high"` + `decoding="sync"` on first visible image, eager (default) loading |
| Dynamic ratio CLS guard | CSS `aspect-ratio` on wrapper + `object-fit: cover` on `img` |
| `sizes="auto"` (emerging) | Only valid with `loading="lazy"`; Chromium 126+ only as of mid-2026; Firefox and Safari not yet supported — use cautiously with explicit fallback sizes |

## Accessibility

Responsive image techniques are largely transparent to assistive technology, but a few rules are non-negotiable:

- **`alt` text lives on `<img>`, not `<source>`.** The `<picture>` element and its `<source>` children carry no text alternative. Write a single `alt` value on `<img>` that describes the image regardless of which crop or format is actually served. For purely decorative images use `alt=""` (empty string, not omitted).
- **Do not change meaning across crops.** Art direction can change composition (wide landscape vs. tight portrait) but the described subject must remain the same. If the crops show fundamentally different subjects, they should be separate `<img>` elements with separate `alt` values.
- **No motion here, but cover `prefers-reduced-motion` for animated formats.** Animated WebP and AVIF can auto-play. If you serve an animated format, respect the OS preference:
  ```css
  @media (prefers-reduced-motion: reduce) {
    img {
      /* Stops CSS-driven animation; for HTML-native animated formats
         the only reliable control is serving a static image in
         reduced-motion contexts via JS or server-side logic. */
      animation: none !important;
    }
  }
  ```
  For animated images that matter, use a `<video>` with `prefers-reduced-motion` detection instead — it gives full playback control.
- **Touch target note:** responsive images are passive content, not interactive, so touch target sizing does not apply unless you wrap them in a link or button (follow the >=44×44 px rule there).
- **Focus management:** if an image is inside an `<a>`, ensure the link has a visible focus ring and a meaningful `aria-label` or surrounding text that describes the destination, not just the image subject.
- **`loading="lazy"` and JavaScript off:** native lazy loading is disabled when JavaScript is disabled (anti-tracking measure per spec). Images are then eager-loaded. This is the correct fallback behaviour — no action needed.

## Performance

**What to measure and watch:**

- **CLS (Cumulative Layout Shift):** the primary risk. Every image without `width`/`height` HTML attributes (or a CSS `aspect-ratio` on its container) contributes to CLS. A single unsized hero image routinely scores 0.2–0.5 on its own — well above Google's "good" ceiling of ≤0.1. Verify with Lighthouse or Chrome DevTools Performance panel before shipping.
- **LCP (Largest Contentful Paint):** the hero or editorial image is usually the LCP element. `fetchpriority="high"` on it moves it to high network priority immediately. Real-world data from Google Flights showed a 2.6 s → 1.9 s improvement. Do not add `loading="lazy"` to the LCP image — they contradict each other.
- **Over-fetching on high-DPI devices:** a 3× screen downloading the 3× image at full resolution can be a 3–9× file-size penalty. Cap your srcset at a maximum useful size (2400–2560 px wide is sufficient for virtually all screens) and let the browser scale down. Do not generate srcset candidates at 3×, 4×, 5× device pixel ratios for large images.
- **`sizes` accuracy:** an incorrect or absent `sizes` attribute defaults to `100vw`. If the image renders at 50 % of the viewport, `sizes="100vw"` will cause the browser to fetch the largest source. Audit with Chrome DevTools Network → filter `Img`, inspect the "initiator" column to see which srcset candidate was chosen.
- **Format savings:** AVIF typically saves 40–60 % over JPEG at equivalent quality; WebP saves 25–35 %. Serving AVIF to the ~94 % of users whose browsers support it is a significant bandwidth reduction.
- **Lazy-load threshold:** Chrome starts fetching lazy images 1250 px before they enter the viewport on 4G connections (2500 px on 3G). This means even "below the fold" images may already be in flight. Do not lazy-load images within one screen height of the initial viewport — use eager (default) loading for those.
- **`decoding="async":`** instructs the browser to decode the image off the main thread, preventing jank on image-heavy pages. Use on non-critical images; use `decoding="sync"` on the LCP image to ensure it is decoded before first render.
- **No repaints or layout thrash from these techniques**: `srcset`/`sizes`/`<picture>` are pure HTML — no JavaScript, no style recalculation after load, no GPU layers. CLS is the only layout-related risk and it is fully preventable with declared dimensions.
- **`will-change` is not applicable**: responsive image attributes do not trigger compositing. Do not add `will-change: transform` to image wrappers as a reflex.

## Anti-slop

**The cliche:** a hero image that is a single `<img src="hero.jpg">` at 3 MB, served at the same resolution to a 375 px phone and a 2560 px monitor, with no `width`/`height`, causing a 0.4 CLS score and a 4-second LCP. Often paired with a glassmorphism overlay card on top (see `_slop-blocklist.md` → Surface: glassmorphism on every card) and a centered 800 px column that ignores the image's natural proportions entirely (see Layout: centered 800px column equal padding).

**The tasteful alternative:**
- Audit your actual rendered widths across breakpoints and write accurate `sizes` values.
- Export AVIF and WebP variants from Squoosh, Cloudinary, or a build-time pipeline; keep JPEG/PNG as the last fallback.
- On the hero, declare exact `width`/`height` matching the source proportions, set `fetchpriority="high"`, and confirm in Lighthouse that LCP is the image (not a text node or a background).
- Use `<picture>` with `media` only when you have a genuinely different crop — not just a different file size.
- Lazy-load everything a full screen below the fold. Leave everything above the fold on default eager loading.
- Resist serving the same `srcset` to every image slot regardless of its CSS size. A 200 px thumbnail in a grid does not need a 1600 px source in its candidate list.

## Pairs well with

- `fluid-everything` (clamp-based fluid layout widths feed directly into accurate `sizes` values — calculate `sizes` from the same clamp expressions)
- `container-queries` (container queries change the rendered image slot size; update `sizes` to match container-relative units or use `<picture>` with `media` targeting the container)
- `mobile-first-patterns` (mobile-first CSS establishes the base slot width that the `sizes` default value should reflect)
- `breakpoint-strategy` (breakpoints in `sizes` should mirror or derive from your layout breakpoints, not be invented independently)

## Current references

- [MDN — Responsive images guide](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images) — canonical explanation of srcset/sizes/picture with worked examples
- [MDN — `<picture>` element reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture) — full attribute reference, type/media interaction, browser support table
- [MDN — `<img>` element reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img) — loading, fetchpriority, decoding, srcset, sizes attribute reference with support notes
- [web.dev — The picture element](https://web.dev/learn/design/picture-element/) — art direction patterns, combined type+media examples
- [web.dev — Optimize resource loading with the Fetch Priority API](https://web.dev/articles/fetch-priority) — fetchpriority values, LCP impact data (Google Flights 2.6 s → 1.9 s), interaction with preload
- [web.dev — Optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp) — preload pattern for CSS background LCP images, fetchpriority="high" placement
- [web.dev — Lazy loading images](https://web.dev/articles/lazy-loading-images) — loading="lazy" thresholds by connection type, interaction with fetchpriority, width/height requirement
- [web.dev — Optimize CLS](https://web.dev/articles/optimize-cls) — width/height → aspect ratio mechanism, CSS aspect-ratio alternative
- [caniuse — AVIF](https://caniuse.com/avif) — ~94% global coverage as of early 2026
- [caniuse — WebP](https://caniuse.com/webp) — ~97% global coverage as of 2025
- [caniuse — `<img sizes="auto" loading="lazy">`](https://caniuse.com/wf-sizes-auto) — Chromium 126+ only as of mid-2026; Firefox and Safari pending
- [Addy Osmani — Use fetchpriority=high to load your LCP hero image sooner](https://addyosmani.com/blog/fetch-priority/) — practical implementation notes and measurement methodology
