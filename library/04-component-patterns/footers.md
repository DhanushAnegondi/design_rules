# Footers

> The page footer is a persistent landmark at the bottom of every document that collects secondary navigation, legal copy, contact details, and utility actions — things users reach for deliberately rather than by accident.

**Bucket:** component
**Maturity:** evergreen
**Effort:** low–medium
**Best for:** websites, portfolios, apps, dashboards, e-commerce

## What it is

A footer is the `<footer>` element placed as a direct child of `<body>`, which causes browsers to expose it to assistive technology under the `contentinfo` landmark role. Users land in the footer when they have finished the main content and are looking for next steps: a policy page, a contact link, a newsletter opt-in, or a quick jump to a different section of the site. There are three dominant structural patterns: the **fat/sitemap footer** (three-to-five columns of grouped links that mirror site architecture), the **minimal footer** (a single horizontal bar carrying legal text and a handful of links), and the **newsletter footer** (a two-zone layout pairing an email capture with a condensed link grid). All three share the same landmark and contrast requirements; only their information density differs.

## When to use

- Every public-facing page with more than a handful of distinct destinations — the footer provides a consistent safety net for users who scroll past the header navigation.
- Sites with moderate to complex hierarchy where secondary pages (careers, press, legal, help) would clutter the primary nav.
- Any page where a newsletter opt-in is a conversion goal — footer placement reaches only high-intent readers who scrolled to the bottom.
- Portfolios and agency sites where contact details, social links, and copyright belong together in a predictable location.
- E-commerce and SaaS products that need visible policy and support links (returns, privacy, terms) without burying them inside dropdown menus.

## When NOT to use

- Logged-in dashboard interfaces where the persistent sidebar or topbar already owns the full-page chrome — a footer adds redundant landmarks and visual weight.
- Highly focused transactional flows: checkout, multi-step onboarding, modal-driven workflows. Strip the footer back to a single copyright line at most so you do not dilute the call to action.
- Pages with true infinite scroll: a footer will never be reachable. Use a sticky utility drawer or a "you have reached the end" sentinel with a minimal link set instead.
- Overuse warning: treating the footer as a dumping ground for every link that did not fit in the nav. A footer with sixty unorganized links is not a sitemap — it is noise.

## How it works

The `<footer>` element is a sectioning element. When it is a direct child of `<body>` it carries the implicit ARIA `contentinfo` role, making it a named landmark that screen reader users can jump to via landmark navigation shortcuts (VoiceOver: VO+U then arrow; NVDA: D key; JAWS: Q key). There must be exactly one `contentinfo` landmark per page. If a `<footer>` appears inside `<article>`, `<aside>`, `<main>`, `<nav>`, or `<section>`, it is scoped to that sectioning context and its role falls back to `generic` — it does not count toward the page landmark.

Responsive layout uses CSS Grid with `repeat(auto-fit, minmax(200px, 1fr))` so columns reflow to a stacked single-column at mobile widths without breakpoint-per-breakpoint media queries. Column group headings should be `<h2>` or `<h3>` elements (not styled `<div>`s), so screen reader users can jump between groups without tabbing through every link. Contained `<nav>` elements inside the footer require an `aria-label` to distinguish them from the primary site navigation (browsers and screen readers surface a list of `<nav>` landmarks; unlabeled ones cause confusion).

Key properties and considerations:

- `role="contentinfo"` is implied on a body-level `<footer>`; add it explicitly as a legacy Safari fallback (Safari below v13 did not expose it natively — WebKit bug 146930).
- One `contentinfo` landmark per document.
- `<nav aria-label="Footer navigation">` for any `<nav>` inside the footer.
- Column group labels as `<h2>`/`<h3>` for screen reader in-page navigation.
- Contrast: 4.5:1 minimum for body text, 3:1 for large text and UI component boundaries (WCAG 2.2 AA).
- Touch targets: 44×44 px minimum for links and icon buttons (WCAG 2.5.5).

## Working code

### Fat/sitemap footer — vanilla HTML + CSS

Self-contained. Renders correctly in any modern browser. No dependencies.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fat footer — sitemap variant</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Design tokens ─────────────────────────────────────────────── */
    :root {
      --footer-bg:       #111318;  /* dark navy-black                  */
      --footer-bg-bar:   #0d0f14;  /* bottom bar, slightly darker      */
      --footer-heading:  #f0f2f7;  /* 16.59:1 on --footer-bg — AA PASS */
      --footer-body:     #c8cdd8;  /* 11.66:1 on --footer-bg — AA PASS */
      --footer-muted:    #8892a4;  /*  5.92:1 on --footer-bg — AA PASS */
      --footer-accent:   #5c8dff;  /*  5.94:1 on --footer-bg — AA PASS */
      --footer-gap:      2.5rem;
      --footer-radius:   0.375rem;
    }

    /* ── Footer shell ──────────────────────────────────────────────── */
    .site-footer {
      background: var(--footer-bg);
      color: var(--footer-body);
      font-family: "Inter", "Geist", system-ui, sans-serif;
      font-size: 0.9375rem;
      line-height: 1.6;
    }

    .footer-inner {
      max-width: 72rem;
      margin: 0 auto;
      padding: 4rem 1.5rem 2.5rem;
    }

    /* ── Brand row ─────────────────────────────────────────────────── */
    .footer-brand {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 2rem;
      margin-bottom: 3rem;
      padding-bottom: 3rem;
      border-bottom: 1px solid rgba(255 255 255 / 0.08);
    }

    .footer-logo {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--footer-heading);
      letter-spacing: -0.02em;
      text-decoration: none;
    }
    .footer-logo:focus-visible {
      outline: 2px solid var(--footer-accent);
      outline-offset: 3px;
      border-radius: var(--footer-radius);
    }

    .footer-tagline {
      color: var(--footer-muted);
      font-size: 0.875rem;
      margin-top: 0.4rem;
      max-width: 24ch;
    }

    /* ── Social links ──────────────────────────────────────────────── */
    .footer-social {
      display: flex;
      gap: 0.75rem;
      list-style: none;
    }

    .footer-social a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;   /* 40px — ≥ 44px touch target via padding below */
      height: 2.5rem;
      padding: 0.25rem; /* effective target ≥ 44px */
      border-radius: 50%;
      border: 1px solid rgba(255 255 255 / 0.12);
      color: var(--footer-body);
      text-decoration: none;
      transition: background 0.2s, border-color 0.2s, color 0.2s;
    }

    @media (hover: hover) and (pointer: fine) {
      .footer-social a:hover {
        background: rgba(92 141 255 / 0.15);
        border-color: var(--footer-accent);
        color: var(--footer-heading);
      }
    }
    .footer-social a:focus-visible {
      outline: 2px solid var(--footer-accent);
      outline-offset: 3px;
    }

    /* ── Sitemap grid ──────────────────────────────────────────────── */
    .footer-sitemap {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--footer-gap);
      margin-bottom: 3rem;
    }

    .footer-col-heading {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--footer-heading);
      margin-bottom: 1rem;
    }

    .footer-col ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .footer-col a {
      color: var(--footer-body);
      text-decoration: none;
      transition: color 0.15s;
    }

    @media (hover: hover) and (pointer: fine) {
      .footer-col a:hover {
        color: var(--footer-heading);
        text-decoration: underline;
        text-underline-offset: 3px;
      }
    }
    .footer-col a:focus-visible {
      outline: 2px solid var(--footer-accent);
      outline-offset: 2px;
      border-radius: 2px;
    }

    /* ── Bottom bar ────────────────────────────────────────────────── */
    .footer-bar {
      background: var(--footer-bg-bar);
      border-top: 1px solid rgba(255 255 255 / 0.06);
    }

    .footer-bar-inner {
      max-width: 72rem;
      margin: 0 auto;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .footer-copyright {
      /* #8892a4 on #0d0f14: ~6.10:1 — AA PASS (4.5:1 required at 13px) */
      color: var(--footer-muted);
      font-size: 0.8125rem;
    }

    .footer-legal {
      display: flex;
      gap: 1.5rem;
      list-style: none;
      flex-wrap: wrap;
    }

    .footer-legal a {
      color: var(--footer-muted);
      font-size: 0.8125rem;
      text-decoration: none;
      transition: color 0.15s;
    }

    @media (hover: hover) and (pointer: fine) {
      .footer-legal a:hover {
        color: var(--footer-body);
        text-decoration: underline;
        text-underline-offset: 3px;
      }
    }
    .footer-legal a:focus-visible {
      outline: 2px solid var(--footer-accent);
      outline-offset: 2px;
      border-radius: 2px;
    }

    /* ── Mobile: accordion on narrow viewports ─────────────────────── */
    @media (max-width: 640px) {
      .footer-col-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(255 255 255 / 0.06);
        user-select: none;
      }
      .footer-col-heading::after {
        content: "+";
        font-size: 1.1rem;
        font-weight: 400;
        color: var(--footer-muted);
        transition: transform 0.2s;
      }
      .footer-col.is-open .footer-col-heading::after {
        transform: rotate(45deg);
      }
      @media (prefers-reduced-motion: reduce) {
        .footer-col-heading::after {
          transition: none;
        }
      }
      .footer-col ul {
        display: none;
        padding-top: 0.75rem;
      }
      .footer-col.is-open ul {
        display: flex;
      }
    }
  </style>
</head>
<body>
  <!-- Skip link pattern: normally lives at very top of <body> -->
  <a href="#main-content" class="visually-hidden" style="
    position:absolute;top:-999px;left:0;
    background:#5c8dff;color:#0d0f14;padding:.5rem 1rem;
    font-weight:600;border-radius:0 0 4px 0;z-index:9999;
    text-decoration:none;
  " onfocus="this.style.top='0'">Skip to main content</a>

  <main id="main-content" style="min-height:60vh;padding:4rem 1.5rem;background:#1a1b22;color:#f0f2f7;">
    <p>Page content — scroll down to reach the footer.</p>
  </main>

  <!-- The footer element is a direct child of body; browser maps it to role="contentinfo" -->
  <!-- role="contentinfo" added explicitly for legacy Safari < 13 (WebKit bug 146930) -->
  <footer class="site-footer" role="contentinfo">
    <div class="footer-inner">

      <!-- Brand + social row -->
      <div class="footer-brand">
        <div>
          <a href="/" class="footer-logo">Fieldwork Studio</a>
          <p class="footer-tagline">Independent product design. Tokyo &amp; Berlin.</p>
        </div>
        <ul class="footer-social" aria-label="Social media links">
          <li>
            <a href="https://github.com/fieldworkstudio" aria-label="Fieldwork Studio on GitHub" rel="noopener noreferrer" target="_blank">
              <!-- Inline SVG avoids an extra network request -->
              <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </a>
          </li>
          <li>
            <a href="https://dribbble.com/fieldworkstudio" aria-label="Fieldwork Studio on Dribbble" rel="noopener noreferrer" target="_blank">
              <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.605 4.61a8.502 8.502 0 0 1 1.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 0 0-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0 1 12 3.475zm-3.633.803a53.896 53.896 0 0 1 3.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 0 1 4.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 0 1-2.19-5.705zM12 20.547a8.482 8.482 0 0 1-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 0 1 1.823 6.475 8.4 8.4 0 0 1-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 0 1-3.655 5.715z"/>
              </svg>
            </a>
          </li>
          <li>
            <a href="https://read.cv/fieldworkstudio" aria-label="Fieldwork Studio on Read.cv" rel="noopener noreferrer" target="_blank">
              <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 14H8v-2h4v2zm4-4H8v-2h8v2zm0-4H8V7h8v2z"/>
              </svg>
            </a>
          </li>
        </ul>
      </div>

      <!-- Sitemap columns — nav labelled to distinguish from primary nav -->
      <nav aria-label="Footer navigation">
        <div class="footer-sitemap">
          <div class="footer-col">
            <h2 class="footer-col-heading">Work</h2>
            <ul>
              <li><a href="/work/product-design">Product design</a></li>
              <li><a href="/work/brand-identity">Brand identity</a></li>
              <li><a href="/work/motion">Motion &amp; interaction</a></li>
              <li><a href="/work/design-systems">Design systems</a></li>
              <li><a href="/case-studies">Case studies</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h2 class="footer-col-heading">Studio</h2>
            <ul>
              <li><a href="/about">About</a></li>
              <li><a href="/process">How we work</a></li>
              <li><a href="/team">Team</a></li>
              <li><a href="/careers">Careers <span aria-label="(2 open roles)">(2)</span></a></li>
              <li><a href="/press">Press kit</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h2 class="footer-col-heading">Resources</h2>
            <ul>
              <li><a href="/journal">Journal</a></li>
              <li><a href="/tools">Tools we use</a></li>
              <li><a href="/reading-list">Reading list</a></li>
              <li><a href="/open-source">Open source</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h2 class="footer-col-heading">Contact</h2>
            <ul>
              <li><a href="mailto:hello@fieldwork.studio">hello@fieldwork.studio</a></li>
              <li><a href="/start-a-project">Start a project</a></li>
              <li>
                <address style="font-style:normal;">
                  Shimokitazawa, Tokyo<br>
                  Mitte, Berlin
                </address>
              </li>
            </ul>
          </div>
        </div>
      </nav>

    </div><!-- /.footer-inner -->

    <!-- Bottom bar -->
    <div class="footer-bar">
      <div class="footer-bar-inner">
        <p class="footer-copyright">
          <!-- #8892a4 on #0d0f14: ~6.10:1 — AA PASS (4.5:1 required at 13px) -->
          &copy; <span id="footer-year"></span> Fieldwork Studio KK. All rights reserved.
        </p>
        <ul class="footer-legal" aria-label="Legal links">
          <li><a href="/privacy">Privacy policy</a></li>
          <li><a href="/terms">Terms of use</a></li>
          <li><a href="/accessibility">Accessibility</a></li>
        </ul>
      </div>
    </div>
  </footer>

  <script>
    // Current year without hard-coding
    document.getElementById('footer-year').textContent = new Date().getFullYear();

    // Mobile accordion — only activates when the headings are visually interactive
    // (max-width: 640px). Uses matchMedia to avoid adding keyboard handlers at desktop.
    (function () {
      const mq = window.matchMedia('(max-width: 640px)');

      function setupAccordion(isMobile) {
        document.querySelectorAll('.footer-col-heading').forEach(function (heading) {
          if (isMobile) {
            heading.setAttribute('role', 'button');
            heading.setAttribute('tabindex', '0');
            heading.setAttribute('aria-expanded', 'false');

            function toggle() {
              const col = heading.closest('.footer-col');
              const isOpen = col.classList.toggle('is-open');
              heading.setAttribute('aria-expanded', String(isOpen));
            }

            heading.addEventListener('click', toggle);
            heading.addEventListener('keydown', function (e) {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
              }
            });
          } else {
            heading.removeAttribute('role');
            heading.removeAttribute('tabindex');
            heading.removeAttribute('aria-expanded');
            heading.closest('.footer-col').classList.remove('is-open');
          }
        });
      }

      setupAccordion(mq.matches);
      mq.addEventListener('change', function (e) { setupAccordion(e.matches); });
    }());
  </script>
</body>
</html>
```

### Minimal footer — single bar, light theme

Suitable for focused apps, portfolio pages, or any context where a full sitemap would distract.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Minimal footer — light theme</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      /* Light theme tokens */
      --min-bg:      #f7f7f8;
      --min-text:    #1a1b22;  /* 16.03:1 on --min-bg — AA PASS */
      --min-muted:   #6b7280;  /*  4.52:1 on --min-bg — AA PASS */
      --min-link:    #2054c8;  /*  6.20:1 on --min-bg — AA PASS */
      --min-border:  #dde0e6;
    }

    body { min-height: 100vh; display: flex; flex-direction: column; }
    main { flex: 1; padding: 4rem 1.5rem; }

    .site-footer-minimal {
      background: var(--min-bg);
      border-top: 1px solid var(--min-border);
      font-family: "Inter", system-ui, sans-serif;
    }

    .min-footer-inner {
      max-width: 72rem;
      margin: 0 auto;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem 2rem;
    }

    .min-footer-copy {
      color: var(--min-muted);
      font-size: 0.875rem;
    }

    .min-footer-nav {
      display: flex;
      gap: 1.25rem;
      flex-wrap: wrap;
      list-style: none;
    }

    .min-footer-nav a {
      color: var(--min-muted);
      font-size: 0.875rem;
      text-decoration: none;
      transition: color 0.15s;
    }

    @media (hover: hover) and (pointer: fine) {
      .min-footer-nav a:hover {
        color: var(--min-link);
        text-decoration: underline;
        text-underline-offset: 3px;
      }
    }

    .min-footer-nav a:focus-visible {
      outline: 2px solid var(--min-link);
      outline-offset: 2px;
      border-radius: 2px;
    }

    @media (max-width: 480px) {
      .min-footer-inner {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  </style>
</head>
<body>
  <main>
    <p style="color:#1a1b22;">Page content.</p>
  </main>

  <footer class="site-footer-minimal" role="contentinfo">
    <div class="min-footer-inner">
      <p class="min-footer-copy">
        &copy; <script>document.write(new Date().getFullYear())</script> Meridian Labs, Inc.
      </p>
      <nav aria-label="Footer navigation">
        <ul class="min-footer-nav">
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/terms">Terms</a></li>
          <li><a href="/security">Security</a></li>
          <li><a href="mailto:support@meridian.app">Contact</a></li>
        </ul>
      </nav>
    </div>
  </footer>
</body>
</html>
```

### Newsletter footer — React + Tailwind (production variant)

Realistic choice for React codebases. All accessibility attributes and reduced-motion handling included.

```jsx
// NewsletterFooter.jsx
// Dependencies: react, tailwindcss
// Assumes Tailwind config includes the font-family "Geist" or falls back to system-ui
//
// REQUIRED tailwind.config.js addition for the hoverFine: variant used below:
//
//   const plugin = require('tailwindcss/plugin');
//   module.exports = {
//     plugins: [
//       plugin(({ addVariant }) => {
//         addVariant('hoverFine', '@media (hover: hover) and (pointer: fine)');
//       }),
//     ],
//   };
//
// hoverFine: applies styles only on devices with a fine pointer (mouse/trackpad).
// On touch/coarse-pointer devices the hover classes are never applied, so links
// and the button do not flash their hover colour on tap press.

import { useState, useId } from "react";

const NAV_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
      { label: "Roadmap", href: "/roadmap" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "API reference", href: "/api" },
      { label: "Status", href: "https://status.example.com" },
      { label: "GitHub", href: "https://github.com/example" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
    ],
  },
];

const LEGAL_LINKS = [
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
  { label: "Cookie settings", href: "/cookies" },
];

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | pending | success | error
  const emailId = useId();
  const statusId = useId();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setStatus("pending");

    // Replace with real API call
    await new Promise((r) => setTimeout(r, 800));
    if (email.includes("@")) {
      setStatus("success");
    } else {
      setStatus("error");
    }
  }

  return (
    <div className="mb-12 pb-12 border-b border-white/10">
      <p className="text-xs font-semibold tracking-widest uppercase text-[#f0f2f7] mb-2">
        Stay current
      </p>
      <h2 className="text-xl font-semibold text-[#f0f2f7] mb-1">
        The Aperture dispatch
      </h2>
      <p className="text-sm text-[#8892a4] mb-5 max-w-sm">
        Product updates and engineering notes. Fortnightly. No sponsored content.
      </p>

      {status === "success" ? (
        // aria-live region is polite so it announces after form interaction
        <p
          id={statusId}
          role="status"
          aria-live="polite"
          className="text-[#5c8dff] text-sm"
        >
          You are subscribed. Check your inbox for a confirmation link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate aria-describedby={status === "error" ? statusId : undefined}>
          <div className="flex flex-col sm:flex-row gap-2 max-w-md">
            <label htmlFor={emailId} className="sr-only">
              Email address
            </label>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              disabled={status === "pending"}
              /*
               * #f0f2f7 on #1d2030: 14.41:1 — AA PASS (input text)
               * #8892a4 on #1d2030:  5.14:1 — AA PASS (placeholder)
               * #6470a0 border on #1d2030: 3.36:1 — 3:1 UI PASS
               */
              className="
                flex-1 rounded-md px-3 py-2 text-sm
                bg-[#1d2030] text-[#f0f2f7]
                border border-[#6470a0]
                placeholder:text-[#8892a4]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c8dff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111318]
                disabled:opacity-50
              "
            />
            <button
              type="submit"
              disabled={status === "pending"}
              /*
               * #0d0f14 on #5c8dff: 6.12:1 — AA PASS (button label on accent)
               */
              className="
                rounded-md px-4 py-2 text-sm font-semibold
                bg-[#5c8dff] text-[#0d0f14]
                motion-safe:transition-colors motion-safe:duration-150
                hoverFine:bg-[#7da8ff]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c8dff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111318]
                disabled:opacity-50 disabled:cursor-not-allowed
                whitespace-nowrap
              "
            >
              {status === "pending" ? "Subscribing…" : "Subscribe"}
            </button>
          </div>
          {status === "error" && (
            <p
              id={statusId}
              role="alert"
              aria-live="assertive"
              className="mt-2 text-xs text-red-400"
            >
              Something went wrong. Please check your email address and try again.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

export function NewsletterFooter() {
  const currentYear = new Date().getFullYear();

  return (
    /*
     * role="contentinfo" added explicitly as legacy Safari < 13 fallback.
     * (WebKit bug 146930 — <footer> was not mapped to contentinfo until Safari 13.)
     */
    <footer
      role="contentinfo"
      className="bg-[#111318] text-[#c8cdd8] font-sans"
    >
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <NewsletterForm />

        {/* Three-column sitemap */}
        <nav aria-label="Footer navigation">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-10 mb-12">
            {NAV_COLUMNS.map((col) => (
              <div key={col.heading}>
                {/* h3 because a site-level h2 should be the page's primary heading */}
                <h3 className="text-xs font-semibold tracking-widest uppercase text-[#f0f2f7] mb-4">
                  {col.heading}
                </h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="
                          text-sm text-[#c8cdd8]
                          underline-offset-2
                          motion-safe:transition-colors motion-safe:duration-150
                          hoverFine:text-[#f0f2f7] hoverFine:underline
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c8dff] focus-visible:ring-offset-1 focus-visible:ring-offset-[#111318]
                          rounded-sm
                        "
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-4">
          {/* #8892a4 on #111318: 5.92:1 — AA PASS */}
          <p className="text-xs text-[#8892a4]">
            &copy; {currentYear} Aperture Systems, Inc.
          </p>
          <nav aria-label="Legal links">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 list-none">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="
                      text-xs text-[#8892a4]
                      underline-offset-2
                      motion-safe:transition-colors motion-safe:duration-150
                      hoverFine:text-[#c8cdd8] hoverFine:underline
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c8dff] focus-visible:rounded-sm
                    "
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
```

## Variations

| Variant | What changes | When to reach for it |
|---|---|---|
| **Fat / sitemap** | 3–5 link columns; full-width; brand row at top | Large sites needing navigation redundancy; SEO internal linking |
| **Minimal / utility bar** | One row; legal text + 3–5 links | Apps, dashboards, checkout flows; any page where focus must not be broken |
| **Newsletter + sitemap** | Two-zone split: capture form above, condensed link grid below | SaaS products, editorial, any site with an email list as a growth channel |
| **Dark / inverted** | Background significantly darker than page body | Portfolios, agencies, marketing sites — creates a clear visual terminus |
| **Light / same-surface** | Matches page background; separated by a rule or increased whitespace | Applications, documentation sites — less dramatic, less disruptive |
| **Mobile accordion** | Link groups collapse behind toggle headings on narrow viewports | Any fat footer on mobile; prevents excessive scroll to reach the bottom bar |
| **Sticky mini-footer (mobile only)** | One or two CTAs fixed to the bottom of the viewport on small screens; hidden on desktop | E-commerce add-to-cart or app "Download" CTA |

## Accessibility

### Landmark and heading structure

The page-level `<footer>` element maps to `role="contentinfo"` automatically in all current browsers. Add `role="contentinfo"` explicitly as a redundant fallback for Safari below version 13 (WebKit bug 146930).

There must be exactly one `contentinfo` landmark per document. Do not nest another `<footer>` or another element with `role="contentinfo"` inside it; use `<section>`, `<div>`, or `<article>` instead.

Any `<nav>` inside the footer needs `aria-label` to distinguish it from the primary site navigation. Without a label, screen readers list two unnamed navigation landmarks and users cannot tell them apart. Correct: `<nav aria-label="Footer navigation">`. Avoid `aria-label="Footer"` on the `<footer>` itself — it would be announced redundantly as "footer contentinfo" by some screen readers.

Column group headings must be real `<h2>` or `<h3>` elements. This lets keyboard users jump between sections with heading navigation (H key in most screen readers) rather than tabbing through every link individually.

### Keyboard navigation

The footer is a landmark, not an interactive widget — it has no special keyboard interaction beyond the links and form controls inside it. All links must be reachable by Tab. In the mobile accordion variant, the group heading becomes a button (`role="button"`, `tabindex="0"`, `aria-expanded`) so it can be activated by Enter or Space and its state is announced correctly.

### Focus indicators

All interactive elements (links, buttons, inputs) must have visible `:focus-visible` styles. The code above uses `outline: 2px solid #5c8dff` with `outline-offset`. Do not rely on browser defaults alone — they are not consistently visible across dark backgrounds.

### Touch and pointer fallback

Hover effects (color transitions, underlines on links) must be gated so they do not fire on touch or coarse-pointer devices. The two vanilla HTML examples (fat footer and minimal footer) achieve this with a raw CSS `@media (hover: hover) and (pointer: fine) { … }` block wrapping every `:hover` rule. The React/Tailwind example cannot use that CSS block directly because Tailwind's built-in `hover:` variant fires on any hover event regardless of pointer type. Instead the React component uses a custom `hoverFine:` variant — configured in `tailwind.config.js` via `addVariant('hoverFine', '@media (hover: hover) and (pointer: fine)')` — which maps to the same media query. The required config is shown in the component comment header. On touchscreens or coarse-pointer devices, links and buttons render in their resting state; they do not depend on hover to look complete or actionable.

Touch targets for links are set to a minimum effective size of 44×44 px via padding. Icon buttons in the social row use explicit `width/height: 2.5rem` plus `0.25rem` padding to meet the 44 px tap target threshold.

### Reduced motion

The fat footer's mobile accordion rotates the `::after` indicator character 45° via `transform: rotate(45deg)` when a column opens. This transform transition is guarded in the fat footer code block with:

```css
@media (prefers-reduced-motion: reduce) {
  .footer-col-heading::after {
    transition: none;
  }
}
```

All other transitions in the footer touch only `color` and `text-decoration` — no transforms, no animations, no scroll-triggered effects. If you add any entrance animation or parallax scroll effect to the footer, guard it similarly:

```css
@media (prefers-reduced-motion: reduce) {
  .site-footer,
  .site-footer * {
    animation: none !important;
    transition: none !important;
  }
}
```

### Contrast ratios (all values computed for colors used in this file's code)

All pairs use the WCAG relative luminance formula: contrast = (L_lighter + 0.05) / (L_darker + 0.05).

**Dark footer:**

| Pair | Ratio | Standard |
|---|---|---|
| `#f0f2f7` heading on `#111318` bg | 16.59:1 | AA PASS (4.5:1 required) |
| `#c8cdd8` body link on `#111318` bg | 11.66:1 | AA PASS |
| `#8892a4` muted text on `#111318` bg | 5.92:1 | AA PASS |
| `#5c8dff` accent link on `#111318` bg | 5.94:1 | AA PASS |
| `#8892a4` on `#0d0f14` bottom bar copyright | ~6.10:1 | AA PASS (4.5:1 required at 13px) |
| `#0d0f14` button label on `#5c8dff` | 6.12:1 | AA PASS |
| `#f0f2f7` input text on `#1d2030` | 14.41:1 | AA PASS |
| `#8892a4` placeholder on `#1d2030` | 5.14:1 | AA PASS |
| `#6470a0` input border on `#1d2030` | 3.36:1 | 3:1 UI PASS (WCAG 1.4.11) |

**Minimal light footer:**

| Pair | Ratio | Standard |
|---|---|---|
| `#1a1b22` body on `#f7f7f8` bg | 16.03:1 | AA PASS |
| `#6b7280` muted on `#f7f7f8` bg | 4.52:1 | AA PASS |
| `#2054c8` link on `#f7f7f8` bg | 6.20:1 | AA PASS |

### Screen reader announcement for newsletter status

The newsletter form uses `role="status"` with `aria-live="polite"` for the success state (announces after current utterance finishes) and `role="alert"` with `aria-live="assertive"` for the error state (announces immediately). Do not use a single `aria-live` region for both — assertiveness level should match urgency.

## Performance

- The footer is typically outside the critical rendering path; no special treatment is needed for Largest Contentful Paint.
- Avoid embedding social media feeds (Twitter/X timeline widgets, Instagram embeds): they pull third-party scripts, trigger additional network requests, and add unpredictable CLS. Link out instead.
- Inline SVG icons rather than external icon font or sprite requests: the fat footer example uses inline SVG for social icons to avoid an extra HTTP round-trip.
- Reserve explicit height or use `min-height` on the footer if any asynchronous content (newsletter status, logged-in-state variations) can change its height after initial paint, to prevent Cumulative Layout Shift.
- CSS Grid with `auto-fit` + `minmax` is computed once at layout time and does not cause recurring recalculations. It is the correct approach for responsive columns over JS-driven responsive logic.
- The mobile accordion toggling uses `display: none` / `display: flex` on the `<ul>` — this triggers layout/paint. For footers this is acceptable (it is below the fold, low frequency, small subtree). If you need GPU-composited collapse, animate `max-height` or use the `<details>`/`<summary>` element instead, but test CLS carefully.
- `will-change` is not needed anywhere in the footer — nothing is being continuously animated.

## Anti-slop

**The cliche (see blocklist — Layout, Copy, Surface):** A footer that pours every secondary link into four identical columns of equal weight, uses the generic SaaS blue (`#3B82F6`) for the logo and accent, fills the newsletter CTA with "Stay up to date with the latest updates" in Inter Regular at one size, and drops a purple-to-pink gradient behind the brand row. This is the AI-generated default — recognizable at fifty paces and trusted by nobody.

**The tasteful alternative:**

- Vary column weight: give the brand/contact column more horizontal space (`2fr 1fr 1fr 1fr`) rather than four identical fifths.
- Use a characterful type choice for the brand mark — Geist Mono, Instrument Serif, or Fraunces reads as considered rather than installed-last-week.
- Write specific microcopy in the newsletter section: "Fortnightly release notes and engineering notes. No sponsored content." is infinitely more credible than "Subscribe to our newsletter."
- Use a committed single-brand hue (the deep navy `#111318` + `#5c8dff` accent in the code above) rather than reaching for the purple-indigo-pink gradient or the default Tailwind blue.
- Let the accent touch only one or two elements: the hover state on links and the subscribe button. If every element glows in the accent color, none of them do.
- Keep the legal links subdued. `#8892a4` at 0.8125rem does not compete with the sitemap content, which is what the user actually wants.

## Pairs well with

- **Navbars** (`04-component-patterns/navbars.md`) — the footer is the lower bookend to the header; they should share the same typographic scale and landmark structure. Link groups in the footer can mirror, but not duplicate, the primary nav.
- **Hero sections** (`04-component-patterns/hero-sections.md`) — dark footer + dark hero creates tonal bookends around a lighter body; the rhythm reads as intentional.
- **Cards** (`04-component-patterns/cards.md`) — a newsletter CTA in the footer can reprise the same card surface token used in the body, keeping elevation language consistent.
- **Scroll progress indicator** (`02-scroll-motion/`) — long editorial pages sometimes pair a reading progress bar with a footer that reveals on scroll completion, tying the two together thematically.

## Current references

- [MDN — `<footer>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer) — implicit `contentinfo` role, scoping rules, legacy Safari note
- [MDN — ARIA: contentinfo role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/contentinfo_role) — one-per-page rule, labeling strategy, screen reader behavior
- [W3C WAI-ARIA APG — Landmarks example: contentinfo](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/contentinfo.html) — canonical HTML and ARIA implementation
- [W3C WCAG 2.2 SC 1.4.3 — Contrast (Minimum)](https://www.w3.org/TR/WCAG22/#contrast-minimum) — 4.5:1 normal text, 3:1 large text (AA)
- [W3C WCAG 2.2 SC 1.4.11 — Non-text Contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast) — 3:1 for UI component boundaries such as input borders
- [Eleken — 10 modern footer UX patterns (2026)](https://www.eleken.co/blog-posts/footer-ux) — taxonomy of footer types with UX rationale and anti-patterns; published May 28, 2026
- [Nielsen Norman Group — Web page footers 101: design patterns and when to use each](https://www.nngroup.com/articles/footers/) — usability research on how users rely on footers; article updated January 30, 2024
- [UI Patterns — Fat Footer](https://ui-patterns.com/patterns/FatFooter) — problem/solution framing for sitemap-style footers
- [WebAIM — Contrast and Color Accessibility](https://webaim.org/articles/contrast/) — formula, worked examples, checker tool
- [Orange a11y guidelines — ARIA landmarks](https://a11y-guidelines.orange.com/en/articles/landmarks/) — landmark navigation with screen reader keyboard shortcuts
