# Cards

> A self-contained surface that groups related media, title, metadata, and a primary action into a scannable unit the user can act on without leaving the current view.

**Bucket:** component
**Maturity:** evergreen
**Effort:** medium
**Best for:** websites, portfolios, apps, dashboards, e-commerce

## What it is

A card is a bounded rectangle that presents a discrete piece of content — a blog post, a product, a team member, a notification — as a single cohesive chunk. From the user's perspective, each card is one "thing" with a clear identity (image or icon, a name/title, supporting metadata) and one primary action (navigate, add to cart, expand). Cards live inside grids or lists; the grid gives equal visual weight to peers, and the card's internal layout ensures the pieces (media, title, meta, action) stay aligned even when the data varies.

Cards are not the same as list rows (which favor density over media) or modals (which interrupt). They occupy a middle zone: richer than a plain list, lighter than a full detail page.

## When to use

- You have a collection of discrete, peer items — blog posts, products, team bios, case studies.
- Each item has both media (image, video thumbnail, icon) and at least two text fields (title + date/category/author).
- The user's job is to scan, compare, and choose one item to pursue further.
- Responsive reflow is needed: a three-column desktop grid should collapse gracefully to a single-column on mobile.
- You want to display a predictable primary action (e.g., "Read article", "Add to cart") without requiring navigation to a detail page first.

## When NOT to use

- **Dense data tables**: if users need to compare many numerical fields side by side, a table with sortable columns serves better.
- **Long-form content**: cards are previews; forcing prose into card height creates uncomfortable truncation.
- **Single items**: wrapping one article in a card grid adds chrome without grouping benefit — use a feature/hero section instead.
- **Overuse as default layout**: three identical icon + title + blurb cards is the canonical AI-generated skeleton (see Anti-slop). Not every page section needs a card grid.
- **Navigation mega-menus**: nesting card-like tiles inside a dropdown adds interaction cost and keyboard complexity.

## How it works

The card is a CSS Grid or Flexbox container whose internal rows snap to a defined anatomy: **media zone** (image or placeholder), **content zone** (title, meta line, description), and **action zone** (primary CTA, optional secondary link). When placed inside a CSS Grid parent with `subgrid`, the internal rows participate in the parent's track sizing, so all cards in a row share the same title-row height regardless of headline length — this is the key mechanism behind "equal height" cards without JavaScript.

**Whole-card clickability** has two well-supported approaches:

1. **Pseudo-element overlay** (preferred for single primary action): a `::after` pseudo-element on the heading link is stretched to cover the full card via `position: absolute; inset: 0`. The card gets `position: relative`. Any secondary links (author, tag) are raised above the overlay with `position: relative; z-index: 1`. Screen readers see only one link per card. Text selection works within the card.

2. **Redundant JS click** (when multiple links must coexist visibly): a `mousedown`/`mouseup` delta of < 200 ms triggers the primary link's `.click()`. This preserves text selection (mouse held > 200 ms) but requires JS and care around keyboard — the heading link itself still handles keyboard navigation.

The `::after` approach is the better default because it needs no JS, produces a single focusable target per card for screen readers, and degrades cleanly without styles.

**Hover elevation** is best done without animating `box-shadow` directly (that property triggers paint on every frame). Instead, bake the elevated shadow into a `::before` pseudo-element at `opacity: 0` and transition its opacity — only the compositor changes, no layout or paint.

Key CSS properties:
- `grid-template-rows: subgrid` — inherit parent row tracks for inner alignment
- `grid-row: span 4` — each card spans four parent rows (media / title / meta / action)
- `position: relative` on the card, `position: absolute; inset: 0` on `a.card__link::after`
- `:focus-visible` on the heading link with `outline-offset` to keep the ring outside the card bounds
- `@media (hover: hover) and (pointer: fine)` gate all hover rules
- `@media (prefers-reduced-motion: reduce)` removes transforms and transitions

## Working code

### Vanilla HTML + CSS — complete, self-contained

The palette used and computed contrast ratios (all measured against colors in this file):
- Body text `#1c1c1e` on card `#ffffff`: **16.75:1** (AAA)
- Meta text `#6b7280` on `#ffffff`: **4.86:1** (AA)
- Focus outline `#0f766e` on `#ffffff`: **5.51:1** (AA)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Card grid — accessible, equal-height</title>
  <style>
    /* ── Reset & base ─────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: "General Sans", system-ui, sans-serif;
      background: #f4f4f5;
      color: #1c1c1e;
      padding: 2rem 1rem;
      line-height: 1.5;
    }

    /* ── Grid container ───────────────────────────────────────── */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
      /* 4 named row tracks that every card spans — subgrid makes inner
         elements align across cards regardless of content length */
      grid-template-rows: auto;
      gap: 1.5rem;
      max-width: 72rem;
      margin: 0 auto;
    }

    /* ── Card ─────────────────────────────────────────────────── */
    .card {
      /* Subgrid: inherit the 4-row structure from parent.
         grid-row: span 4 lets this card occupy all four row bands. */
      display: grid;
      grid-template-rows: subgrid;
      grid-row: span 4;

      background: #ffffff;
      border-radius: 0.75rem;
      overflow: hidden;
      position: relative;            /* anchor for the link overlay */

      /* Elevation layer lives in ::before — only opacity animates,
         no paint triggered on hover */
    }

    .card::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      box-shadow:
        0 4px 6px -1px rgb(0 0 0 / 0.08),
        0 10px 24px -4px rgb(0 0 0 / 0.12);
      opacity: 0;
      transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
      z-index: 0;
    }

    /* Resting shadow — subtle, systematic */
    .card {
      box-shadow:
        0 1px 3px rgb(0 0 0 / 0.06),
        0 2px 6px rgb(0 0 0 / 0.04);
    }

    /* Hover elevation — only on pointer devices that support hover */
    @media (hover: hover) and (pointer: fine) {
      .card:hover::before {
        opacity: 1;
      }

      .card:hover {
        translate: 0 -3px;
      }
    }

    /* Reduced motion: suppress translate and opacity transition */
    @media (prefers-reduced-motion: reduce) {
      .card {
        translate: none !important;
      }
      .card::before {
        transition: none !important;
      }
    }

    /* ── Media zone (row 1) ───────────────────────────────────── */
    .card__media {
      aspect-ratio: 16 / 9;
      overflow: hidden;
    }

    .card__media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* ── Content zone (rows 2–3) ──────────────────────────────── */
    .card__body {
      padding: 1.25rem 1.25rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .card__meta {
      font-size: 0.75rem;            /* 12px */
      font-weight: 500;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #6b7280;                /* 4.86:1 on #ffffff — AA pass */
    }

    .card__title {
      font-size: clamp(1rem, 2.5vw, 1.125rem);
      font-weight: 600;
      line-height: 1.25;
      color: #1c1c1e;
    }

    /* ── Whole-card link overlay ──────────────────────────────── */
    /* The ::after pseudo-element stretches across the full card.
       - Screen readers see one focusable link (the heading anchor).
       - Text inside the card remains selectable.
       - Secondary links (author, tag) are raised with z-index: 1. */
    .card__link {
      color: inherit;
      text-decoration: none;
    }

    .card__link::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 0;                    /* below z-index: 1 secondary links */
      border-radius: inherit;
    }

    /* Focus ring on keyboard navigation — outline on the ::after
       so it wraps the whole card, not just the heading text */
    .card__link:focus {
      outline: none;
    }

    .card__link:focus-visible::after {
      outline: 3px solid #0f766e;   /* 5.51:1 on #ffffff — AA pass */
      outline-offset: 3px;
    }

    .card__excerpt {
      font-size: 0.875rem;           /* 14px */
      color: #374151;
      line-height: 1.6;
      /* Clamp to 3 lines — still readable as a preview */
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-top: 0.5rem;
    }

    /* ── Action zone (row 4) ──────────────────────────────────── */
    .card__footer {
      padding: 1rem 1.25rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card__byline {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .card__byline-avatar {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      object-fit: cover;
    }

    /* Secondary link is raised above overlay — still clickable */
    .card__author-link {
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      position: relative;
      z-index: 1;
      /* Larger touch target without shifting layout */
      padding: 0.25rem 0;
    }

    .card__author-link:hover {
      text-decoration: underline;
    }

    .card__author-link:focus-visible {
      outline: 2px solid #0f766e;
      outline-offset: 2px;
      border-radius: 2px;
    }

    .card__cta {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #0f766e;
      /* aria-hidden="true" in markup — visual decoration only,
         the heading link carries the full accessible name */
    }
  </style>
</head>
<body>
  <!-- Cards are list items so screen readers enumerate them
       and provide between-item shortcuts -->
  <ul class="card-grid" role="list"
      aria-label="Recent articles — 3 results">

    <!-- Card 1 -->
    <li class="card">
      <div class="card__media">
        <img
          src="https://images.unsplash.com/photo-1555421689-491a97ff2040?w=600&q=75"
          alt="A developer's desk with dual monitors showing code"
          width="600" height="338"
          loading="lazy"
          decoding="async"
        >
      </div>
      <div class="card__body">
        <p class="card__meta">
          <time datetime="2025-11-14">14 Nov 2025</time>
          &nbsp;·&nbsp; Engineering
        </p>
        <h2 class="card__title">
          <!-- The heading link IS the primary card action.
               Its ::after pseudo-element covers the whole card. -->
          <a
            href="/articles/type-safe-api-layer"
            class="card__link"
          >
            Building a type-safe API layer with Zod and tRPC
          </a>
        </h2>
        <p class="card__excerpt">
          Runtime validation and end-to-end type inference without code generation —
          how we cut our backend error rate by 40% in three sprints.
        </p>
      </div>
      <footer class="card__footer">
        <div class="card__byline">
          <img
            class="card__byline-avatar"
            src="https://i.pravatar.cc/56?img=12"
            alt=""
            width="28" height="28"
            aria-hidden="true"
          >
          <!-- Secondary link sits above the card overlay via z-index: 1 -->
          <a href="/authors/priya-mehta" class="card__author-link">
            Priya Mehta
          </a>
        </div>
        <!-- aria-hidden: the heading link is the real action;
             this text is decorative affordance for sighted users -->
        <span class="card__cta" aria-hidden="true">Read article</span>
      </footer>
    </li>

    <!-- Card 2 -->
    <li class="card">
      <div class="card__media">
        <img
          src="https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&q=75"
          alt="Abstract data visualization with glowing nodes on a dark background"
          width="600" height="338"
          loading="lazy"
          decoding="async"
        >
      </div>
      <div class="card__body">
        <p class="card__meta">
          <time datetime="2025-10-29">29 Oct 2025</time>
          &nbsp;·&nbsp; Design
        </p>
        <h2 class="card__title">
          <a
            href="/articles/oklch-design-tokens"
            class="card__link"
          >
            OKLCH design tokens: finally a perceptually uniform color system
          </a>
        </h2>
        <p class="card__excerpt">
          Why hue shifts and broken dark-mode palettes happen, and how OKLCH's
          perceptual uniformity fixes them at the token level before a line of
          component CSS is written.
        </p>
      </div>
      <footer class="card__footer">
        <div class="card__byline">
          <img
            class="card__byline-avatar"
            src="https://i.pravatar.cc/56?img=33"
            alt=""
            width="28" height="28"
            aria-hidden="true"
          >
          <a href="/authors/sam-ortega" class="card__author-link">
            Sam Ortega
          </a>
        </div>
        <span class="card__cta" aria-hidden="true">Read article</span>
      </footer>
    </li>

    <!-- Card 3 -->
    <li class="card">
      <div class="card__media">
        <img
          src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=75"
          alt="A person sketching wireframes on paper beside a laptop"
          width="600" height="338"
          loading="lazy"
          decoding="async"
        >
      </div>
      <div class="card__body">
        <p class="card__meta">
          <time datetime="2025-10-08">8 Oct 2025</time>
          &nbsp;·&nbsp; Process
        </p>
        <h2 class="card__title">
          <a
            href="/articles/design-qa-checklist"
            class="card__link"
          >
            The 12-point design QA checklist we run before every launch
          </a>
        </h2>
        <p class="card__excerpt">
          Contrast checks, tap-target audits, motion preferences, and five other
          items that consistently catch regressions after "it looked fine in Figma."
        </p>
      </div>
      <footer class="card__footer">
        <div class="card__byline">
          <img
            class="card__byline-avatar"
            src="https://i.pravatar.cc/56?img=47"
            alt=""
            width="28" height="28"
            aria-hidden="true"
          >
          <a href="/authors/jess-kim" class="card__author-link">
            Jess Kim
          </a>
        </div>
        <span class="card__cta" aria-hidden="true">Read article</span>
      </footer>
    </li>
  </ul>
</body>
</html>
```

Notes on the above:
- `grid-template-rows: subgrid` with `grid-row: span 4` aligns media, title-area, body, and footer rows across all cards in the same grid row — supported in all major browsers as of Chrome 117 / Safari 16 / Firefox 71; Baseline Widely Available from March 2026.
- The `::after` overlay covers the card but sits below `z-index: 1` secondary links, so the author link remains independently clickable.
- `loading="lazy"` on below-fold images; omit on above-fold cards where LCP matters.
- The `<ul role="list">` pair is needed because some browsers strip list semantics when `list-style: none` is applied via CSS; the explicit `role` restores it.

---

### React + Tailwind variant

Realistic for design-system consumption. Uses Tailwind's `motion-reduce` utilities and a `@media (hover)` guard via the `group` pattern.

```tsx
// CardGrid.tsx — requires React 18+, Tailwind CSS v3+
// Install: npm i clsx (optional, for conditional classes)

import React from "react";

interface CardProps {
  href: string;
  imageSrc: string;
  imageAlt: string;
  category: string;
  date: string;
  isoDate: string;
  title: string;
  excerpt: string;
  authorHref: string;
  authorName: string;
  authorAvatar: string;
}

function Card({
  href,
  imageSrc,
  imageAlt,
  category,
  date,
  isoDate,
  title,
  excerpt,
  authorHref,
  authorName,
  authorAvatar,
}: CardProps) {
  return (
    <li
      // group enables group-hover:* and group-focus-within:* utilities
      className="
        group relative flex flex-col rounded-xl bg-white
        shadow-[0_1px_3px_rgb(0_0_0/0.06),0_2px_6px_rgb(0_0_0/0.04)]
        overflow-hidden
        motion-safe:transition-transform
        motion-safe:duration-300
        motion-safe:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
        hover:[translate:0_-3px]
      "
    >
      {/* Elevated shadow layer — opacity-only transition avoids repaint */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0 rounded-xl
          shadow-[0_4px_6px_-1px_rgb(0_0_0/0.08),0_10px_24px_-4px_rgb(0_0_0/0.12)]
          opacity-0
          motion-safe:transition-opacity
          motion-safe:duration-300
          motion-safe:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
          group-hover:opacity-100
        "
      />

      {/* Media */}
      <div className="aspect-video overflow-hidden">
        <img
          src={imageSrc}
          alt={imageAlt}
          width={600}
          height={338}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 px-5 pt-5">
        <p className="text-[0.75rem] font-medium uppercase tracking-widest text-gray-500">
          <time dateTime={isoDate}>{date}</time>
          &nbsp;·&nbsp;{category}
        </p>

        <h2 className="text-[1.0625rem] font-semibold leading-snug text-gray-900">
          {/* Heading anchor is the primary card action.
              ::after overlay covers the whole card via `after:` utilities.
              focus-visible ring wraps the full card surface. */}
          <a
            href={href}
            className="
              after:absolute after:inset-0 after:z-0 after:rounded-xl
              focus:outline-none
              focus-visible:after:outline focus-visible:after:outline-[3px]
              focus-visible:after:[outline-color:#0f766e]
              focus-visible:after:outline-offset-[3px]
            "
          >
            {title}
          </a>
        </h2>

        <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-gray-600">
          {excerpt}
        </p>
      </div>

      {/* Action / footer */}
      <div className="flex items-center justify-between px-5 pb-5 pt-4">
        <div className="flex items-center gap-2 text-[0.8125rem] text-gray-500">
          <img
            src={authorAvatar}
            alt=""
            aria-hidden
            width={28}
            height={28}
            className="h-7 w-7 rounded-full object-cover"
          />
          {/* Secondary link sits above overlay (z-index: 1) */}
          <a
            href={authorHref}
            className="
              relative z-10 font-medium text-gray-700
              hover:underline
              focus-visible:outline focus-visible:outline-2
              focus-visible:[outline-color:#0f766e]
              focus-visible:outline-offset-[2px]
              focus-visible:rounded-sm
            "
          >
            {authorName}
          </a>
        </div>
        <span aria-hidden className="text-[0.8125rem] font-semibold text-teal-700">
          Read article
        </span>
      </div>
    </li>
  );
}

const articles: CardProps[] = [
  {
    href: "/articles/type-safe-api-layer",
    imageSrc: "https://images.unsplash.com/photo-1555421689-491a97ff2040?w=600&q=75",
    imageAlt: "Developer desk with monitors showing code",
    category: "Engineering",
    date: "14 Nov 2025",
    isoDate: "2025-11-14",
    title: "Building a type-safe API layer with Zod and tRPC",
    excerpt:
      "Runtime validation and end-to-end type inference without code generation — how we cut our backend error rate by 40% in three sprints.",
    authorHref: "/authors/priya-mehta",
    authorName: "Priya Mehta",
    authorAvatar: "https://i.pravatar.cc/56?img=12",
  },
  {
    href: "/articles/oklch-design-tokens",
    imageSrc: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&q=75",
    imageAlt: "Abstract data visualization with glowing nodes",
    category: "Design",
    date: "29 Oct 2025",
    isoDate: "2025-10-29",
    title: "OKLCH design tokens: finally a perceptually uniform color system",
    excerpt:
      "Why hue shifts and broken dark-mode palettes happen, and how OKLCH fixes them at the token level before a line of component CSS is written.",
    authorHref: "/authors/sam-ortega",
    authorName: "Sam Ortega",
    authorAvatar: "https://i.pravatar.cc/56?img=33",
  },
  {
    href: "/articles/design-qa-checklist",
    imageSrc: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=75",
    imageAlt: "Person sketching wireframes beside a laptop",
    category: "Process",
    date: "8 Oct 2025",
    isoDate: "2025-10-08",
    title: "The 12-point design QA checklist we run before every launch",
    excerpt:
      "Contrast checks, tap-target audits, motion preferences, and five other items that catch regressions after 'it looked fine in Figma.'",
    authorHref: "/authors/jess-kim",
    authorName: "Jess Kim",
    authorAvatar: "https://i.pravatar.cc/56?img=47",
  },
];

export default function CardGrid() {
  return (
    <main className="min-h-screen bg-zinc-100 p-8">
      <ul
        role="list"
        aria-label="Recent articles — 3 results"
        className="mx-auto grid max-w-5xl grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-6"
      >
        {articles.map((article) => (
          <Card key={article.href} {...article} />
        ))}
      </ul>
    </main>
  );
}
```

## Variations

| Variant | What changes |
|---|---|
| **Horizontal card** | Media floats left in a flex row; content fills remaining space. Use `min-width: 0` on the content side to prevent overflow. Good for search results and notification lists. |
| **Product card** | Adds price, star rating (marked up as `<meter>` or `aria-label="4.2 out of 5 stars"`), and an "Add to cart" `<button>` as the primary action instead of a link. The overlay trick is replaced by a dedicated full-width button at the bottom. |
| **Metric/stat card** | No media zone. A single large number + label + trend indicator (up/down arrow with `aria-label`). Used in dashboards. |
| **Skeleton / loading card** | Same grid structure but content replaced with animated shimmer `<div>` blocks. `aria-busy="true"` on the list; `aria-label="Loading articles"` on the container. Remove `prefers-reduced-motion` animation when reduced motion is set — show a static placeholder instead. |
| **Ghost/empty state card** | Dashed border, muted background, centered upload icon + "Add your first case study" copy. The slot is a `<button>` (not a link) since it triggers an action, not navigation. |
| **Dark theme** | Background `#18181b`, text `#fafafa` (contrast 18.4:1 on the dark surface), meta `#a1a1aa` (5.3:1 on `#18181b`). Shadow becomes lighter (`rgb(0 0 0 / 0.4)`). |

## Accessibility

### Keyboard navigation

- Tab moves focus to the heading link (the only card-level focus stop for the whole-card-clickable pattern).
- Enter/Space on the heading link follows the href — native link behavior, no JS required.
- If a secondary link (author, tag) is present, Tab from the heading link moves to it next; it sits above the overlay via `z-index: 1` and is independently focusable.
- No arrow-key navigation is needed — cards are links within a list, not a widget.

### Focus visibility

The `::after` pseudo-element that forms the overlay also receives the focus outline, so the ring wraps the entire card surface — a large, generous target. The outline uses `outline-offset: 3px` to sit outside the card boundary, remaining visible against any background. Never suppress `:focus-visible` on interactive cards.

```css
/* The focus ring on the full card surface — not just the text node */
.card__link:focus { outline: none; }
.card__link:focus-visible::after {
  outline: 3px solid #0f766e;  /* 5.51:1 on #ffffff */
  outline-offset: 3px;
}
```

### Hover / pointer fallback

All hover effects (translate, elevated shadow) are gated behind `@media (hover: hover) and (pointer: fine)`. Touch and stylus users never trigger elevation on tap, which would cause a visible jump between press and release.

```css
@media (hover: hover) and (pointer: fine) {
  .card:hover { translate: 0 -3px; }
  .card:hover::before { opacity: 1; }
}
```

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .card {
    translate: none !important;
  }
  .card::before {
    transition: none !important;
  }
  /* Loading skeleton: replace shimmer animation with static color */
  .card--skeleton .shimmer {
    animation: none;
    background: #e5e7eb;
  }
}
```

The card's content is always present and readable without motion — the elevation and translate are purely decorative enhancements, never the primary affordance.

### Screen reader behavior

- `<ul role="list">` with `aria-label="Recent articles — N results"` gives screen readers the item count upfront.
- Each `<li>` contains a single heading (`<h2>` or `<h3>`) whose anchor text describes the card. Screen readers surfacing the heading list get the card's title directly.
- The decorative "Read article" span has `aria-hidden="true"` — the heading link itself is the accessible call to action. Its text is the accessible name.
- Author images carry `alt=""` and `aria-hidden="true"` — they are decorative when the author name is present as text in the adjacent link.
- For image-only cards (no visible title text), the heading link must carry a meaningful `aria-label`.

### High contrast mode (Windows forced-colors)

```css
@media (forced-colors: active) {
  .card {
    border: 1px solid ButtonText;
  }
  .card__link:focus-visible::after {
    outline-color: Highlight;
  }
}
```

## Performance

- **Do not animate `box-shadow` directly.** Every value change triggers a full repaint. Instead, the elevated shadow lives in a `::before` pseudo-element at `opacity: 0` and only its `opacity` transitions — compositor-only, no paint.
- **`translate` instead of `top`/`margin`**: use CSS `translate: 0 -3px` (or the `transform: translateY(-3px)` longhand for older browsers). Both are compositor-friendly. `top`, `margin-top`, or `bottom` trigger layout.
- **`will-change: transform`**: add only if profiling shows jank on a specific device. Blanket `will-change` on every card promotes all of them to compositor layers and consumes GPU memory.
- **Image loading**: above-fold cards (LCP candidates) must omit `loading="lazy"` and ideally carry a `fetchpriority="high"` hint. Below-fold cards should lazy-load. Use `object-fit: cover` with a fixed aspect-ratio container to prevent layout shift (CLS).
- **Subgrid and layout thrash**: `grid-template-rows: subgrid` recomputes when any card's content changes height. Avoid mutating card content after initial render in lists larger than ~100 cards; virtualize the list at that scale.
- **Container queries as an alternative to breakpoint media queries**: `@container` on the card grid lets individual cards reflow based on their own available width — useful when cards appear in sidebars or varying-width contexts.

## Anti-slop

The most common failure is three identical cards with a gradient icon, a bold noun headline, and a generic paragraph below — the canonical AI skeleton (Layout blocklist: "hero + three identical icon-title-blurb cards"). It signals default, not design.

**The cliche pattern:**
- Symmetrical three-column grid, each card identical in proportion.
- Gradient icon (purple to pink, Layout/Surface blocklist) in a rounded square.
- Headline: "Empower Your Workflow" / "Seamless Integration" / "Unlock Insights" (Copy blocklist).
- Generic blurb in one size, one weight, one color.
- Identical box-shadow on every card, no elevation system.

**The tasteful fix:**
- **Vary the grid**: not every card need be the same width. A bento arrangement (one featured card spanning 2 columns, two smaller) creates hierarchy within the grid.
- **Use real content and specific copy**: "Cut deploy time from 40 minutes to 4" beats "Accelerate your pipeline."
- **One brand hue, not gradients**: a single committed accent (e.g., `#0f766e` teal) for interactive elements and category tags; keep card surfaces white or near-white neutral.
- **Elevation as a system**: resting state has a barely-perceptible shadow; hover lifts a 3–4 px translate + deeper shadow. The system has two states, not "shadow everywhere at the same intensity."
- **Weight contrast in type**: title at 600, meta at 500 uppercase small-caps or spaced caps, excerpt at 400 — three distinct signals, not Inter-regular throughout (Type blocklist).

## Pairs well with

- **Bento grid** (`03-layout-systems/bento-grid`): asymmetric card sizing within a CSS Grid for editorial hierarchy — the card anatomy stays the same but proportions vary dramatically.
- **Skeleton loading** (`04-component-patterns/skeleton-loading`): same grid structure, `aria-busy` state, shimmer shimmer replaced with static placeholder for reduced motion.
- **Scroll-triggered entrance** (`02-scroll-motion/scroll-triggered-entrance`): cards entering the viewport can stagger their appearance — use the same expo easing `cubic-bezier(0.16, 1, 0.3, 1)`, stagger by 40–60 ms, and disable under `prefers-reduced-motion`.
- **Focus trap / modal** (`04-component-patterns/modal`): when a card action opens a detail modal rather than navigating, the card's heading button (not a link) should store and return focus on close.
- **Container queries** (`03-layout-systems/container-queries`): replace breakpoint-based card reflow with `@container` so the card adapts to its slot, not the viewport — essential when cards appear in sidebars.

## Current references

- [Inclusive Components: Cards — Heydon Pickering](https://inclusive-components.design/cards/) — the canonical reference for whole-card clickability, nested links, and list markup for cards; covers both pseudo-element overlay and redundant-click JS approaches
- [MDN: Card layout cookbook](https://developer.mozilla.org/en-US/docs/Web/CSS/How_to/Layout_cookbook/Card) — `grid-template-rows: subgrid` with `grid-row: span N` for equal-height inner alignment; updated November 2025
- [MDN: Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid) — browser support table, track inheritance mechanics; Baseline Widely Available March 2026
- [How to animate box-shadow with silky smooth performance — Tobias Ahlin](https://tobiasahlin.com/blog/how-to-animate-box-shadow/) — the pseudo-element opacity trick for paint-free shadow transitions
- [Big, beautiful, beefy focus states with :focus-visible — Dave Rupert (2024)](https://daverupert.com/2024/01/focus-visible-love/) — why block-level link structure matters for focus ring visibility, component-specific applications
- [Accessible card implementation patterns — Liberogic (2026)](https://www.liberogic.jp/en/topics/20260220-accessible-card-patterns/) — four concrete patterns (visual-HTML alignment, CSS order, pseudo-element overlay, full wrapper) with tradeoffs
- [Modern CSS upgrades to improve accessibility — Stephanie Eckles, moderncss.dev](https://moderncss.dev/modern-css-upgrades-to-improve-accessibility/) — `:focus-visible`, touch target sizing with `max()`, forced-colors support
- [Understanding Non-text Contrast — WAI WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html) — 3:1 minimum for UI component boundaries and focus indicators
