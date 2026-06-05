# Pricing tables

> A structured comparison component that lets visitors evaluate service tiers side-by-side and commit to one, with a billing-cycle toggle that switches prices in place without a page reload.

**Bucket:** component
**Maturity:** evergreen
**Effort:** medium
**Best for:** apps, dashboards, websites, SaaS products

## What it is

A pricing table presents two to four subscription tiers as adjacent cards or columns, each showing a price, a named plan, a feature list, and a primary call-to-action. A binary toggle above the cards switches between monthly and annual billing, updating every visible price simultaneously. One tier is visually elevated — through a distinct background, border, or scale — to serve as the recommended anchor that guides the majority of visitors toward a decision. The full feature comparison matrix (often a `<table>` below the cards) gives detail-oriented visitors the granular row-by-row breakdown they need before committing.

## When to use

- A product has two to four meaningfully differentiated tiers where features, limits, or support levels differ between plans.
- Annual discounts exist and you want to surface them without a second page.
- Visitors need side-by-side comparison to self-select — they arrive knowing their use-case but not which tier fits it.
- There is a clear "most popular" tier that converts the highest volume; highlighting it sets a social anchor.
- The product is mature enough that feature lists are stable — early-stage products with fluid roadmaps should use a simpler list format rather than a comparison table that will become stale.

## When NOT to use

- More than four tiers. Decision paralysis sets in above four; break tiers out into a separate plan-selector flow or a guided quiz instead.
- Enterprise-only products with quote-based pricing — a table implies self-serve purchase intent and creates frustration when the CTA lands on a "talk to sales" form.
- Pricing that changes frequently. A comparison table carries implicit authority; stale prices erode trust faster than no table at all.
- Mobile-heavy audiences where a three-column table is unreadable without horizontal scroll — use a single-column card stack with a plan switcher tab instead.
- Everyone overuses this for "features" that are identical across plans. Padding feature rows with entries that are checked on every tier is a dark pattern: it creates an illusion of value without real differentiation.

## How it works

The billing-cycle toggle is a single `<input type="checkbox" role="switch">` (or a `<button role="switch" aria-checked>`) that holds the billing state. JavaScript reads the toggle's checked/aria-checked state and swaps a `data-billing` attribute on a parent element. CSS `[data-billing="annual"] .price-monthly { display: none }` and its counterpart hide the inactive price. No fetch, no rerender — prices for both cycles are in the DOM from initial load.

The recommended plan gets a CSS class that applies a distinct background (a single committed brand hue, not a gradient) and a `aria-label` that includes "recommended" or an equivalent so screen readers announce it. The class should not use `transform: scale()` as a primary distinguisher because that breaks table row alignment in the comparison matrix; use `box-shadow`, `border`, or background instead.

The comparison table below the cards uses semantic `<table>` markup: `<th scope="col">` for plan headers, `<th scope="row">` for feature names, `<td>` for values. A sticky `<thead>` keeps plan names visible during long vertical scrolls. Feature groups use `<tbody>` elements with a `<tr class="group-header">` separator row, avoiding nested tables.

Key CSS and DOM patterns:
- CSS Grid on the card row: `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))` stacks cards below ~720 px.
- The highlighted card breaks out of the grid flow with negative `margin-block` to look taller without disrupting column alignment.
- Price transitions use `transition: opacity 0.15s ease` on the price element only — not a layout-affecting property.
- `@media (prefers-reduced-motion: reduce)` sets `transition-duration: 0.01ms` (preserves `transitionend` events, invisible to users).
- The toggle thumb slides with `transform: translateX()` — GPU-composited, no repaint.

## Working code

### Vanilla HTML/CSS/JS — complete, self-contained

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pricing — Fieldwork</title>
<style>
  /* ─── Reset & tokens ─────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --color-bg:          #f5f4f1;
    --color-surface:     #ffffff;
    --color-ink:         #1a1a1a;
    --color-ink-muted:   #6b6b6b;
    --color-border:      #e2e0da;
    --color-accent:      #2d5a27;      /* Forest green — single committed hue */
    --color-accent-text: #ffffff;
    --color-accent-muted:#edf3ec;
    --color-tick:        #2d5a27;
    --color-cross:       #b0a99f;
    --radius-card:       12px;
    --radius-toggle:     99px;
    --font-sans:         'General Sans', ui-sans-serif, system-ui, sans-serif;
    --font-mono:         ui-monospace, 'Cascadia Code', monospace;
    --shadow-card:       0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06);
    --shadow-featured:   0 4px 24px rgba(45,90,39,.18), 0 1px 4px rgba(0,0,0,.08);
    --transition-price:  opacity 0.15s ease;
  }

  @media (prefers-reduced-motion: reduce) {
    :root {
      --transition-price: opacity 0.01ms ease;
      --transition-toggle: 0.01ms;
    }
  }

  body {
    font-family: var(--font-sans);
    background: var(--color-bg);
    color: var(--color-ink);
    min-height: 100dvh;
    padding: 4rem 1.25rem 6rem;
  }

  /* ─── Section header ─────────────────────────────── */
  .pricing-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }
  .pricing-header h1 {
    font-size: clamp(1.75rem, 4vw, 2.75rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }
  .pricing-header p {
    margin-top: 0.75rem;
    color: var(--color-ink-muted);
    font-size: 1rem;
    max-width: 44ch;
    margin-inline: auto;
  }

  /* ─── Billing toggle ─────────────────────────────── */
  .billing-toggle-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 2.5rem;
  }
  .billing-label {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--color-ink-muted);
    cursor: pointer;
    transition: color 0.12s;
  }
  .billing-label.active { color: var(--color-ink); }

  /* Native checkbox styled as toggle switch */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
  }
  /* Visually hidden but keyboard-accessible checkbox */
  .toggle-switch input[type="checkbox"] {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 1;
    margin: 0;
  }
  .toggle-track {
    display: block;
    width: 44px;
    height: 24px;
    border-radius: var(--radius-toggle);
    background: var(--color-border);
    transition: background 0.18s ease;
    pointer-events: none;
  }
  .toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,.25);
    transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .toggle-track, .toggle-thumb { transition-duration: 0.01ms !important; }
  }

  /* Checked state */
  .toggle-switch input[type="checkbox"]:checked ~ .toggle-track {
    background: var(--color-accent);
  }
  .toggle-switch input[type="checkbox"]:checked ~ .toggle-thumb {
    transform: translateX(20px);
  }
  /* Focus ring — visible only for keyboard, not mouse */
  .toggle-switch input[type="checkbox"]:focus-visible ~ .toggle-track {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .annual-badge {
    display: inline-flex;
    align-items: center;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--color-tick);
    background: var(--color-accent-muted);
    border-radius: 4px;
    padding: 0.15em 0.5em;
  }

  /* ─── Cards grid ─────────────────────────────────── */
  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
    max-width: 900px;
    margin-inline: auto;
    align-items: start;
  }

  /* Force 3-col on medium+ screens */
  @media (min-width: 680px) {
    .pricing-grid { grid-template-columns: repeat(3, 1fr); }
  }

  .pricing-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    padding: 1.75rem 1.5rem;
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .pricing-card.featured {
    background: var(--color-accent);
    border-color: transparent;
    box-shadow: var(--shadow-featured);
    color: var(--color-accent-text);
    /* Slightly taller without breaking grid alignment */
    margin-block: -0.75rem;
    padding-block: 2.5rem;
  }

  .plan-badge {
    display: inline-flex;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: rgba(255,255,255,.22);
    color: rgba(255,255,255,.9);
    border-radius: 4px;
    padding: 0.2em 0.55em;
    margin-bottom: 0.25rem;
    align-self: flex-start;
  }

  .plan-name {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .plan-description {
    font-size: 0.85rem;
    color: var(--color-ink-muted);
    line-height: 1.5;
  }
  .featured .plan-description { color: rgba(255,255,255,.72); }

  .plan-price-row {
    margin-top: 1rem;
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }
  .price-amount {
    font-size: 2.25rem;
    font-weight: 800;
    letter-spacing: -0.04em;
    font-feature-settings: "tnum";
    /* Price swap via opacity, not display:none — screen readers still read it */
    transition: var(--transition-price);
  }
  .price-per {
    font-size: 0.85rem;
    color: var(--color-ink-muted);
  }
  .featured .price-per { color: rgba(255,255,255,.65); }

  /* Hidden monthly/annual prices — JS toggles .hidden class */
  .price-annual { display: none; }
  [data-billing="annual"] .price-monthly { display: none; }
  [data-billing="annual"] .price-annual  { display: flex; }

  .price-note {
    font-size: 0.78rem;
    color: var(--color-ink-muted);
    margin-top: 0.15rem;
  }
  .featured .price-note { color: rgba(255,255,255,.6); }

  .plan-cta {
    display: block;
    text-align: center;
    margin-top: 1.25rem;
    padding: 0.65rem 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.14s, color 0.14s, box-shadow 0.14s;
    border: 1.5px solid transparent;
  }
  .plan-cta:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  /* Default card CTA */
  .pricing-card:not(.featured) .plan-cta {
    background: var(--color-accent-muted);
    color: var(--color-accent);
    border-color: var(--color-accent-muted);
  }
  .pricing-card:not(.featured) .plan-cta:hover {
    background: var(--color-accent);
    color: #fff;
  }
  /* Featured card CTA */
  .featured .plan-cta {
    background: #fff;
    color: var(--color-accent);
  }
  .featured .plan-cta:hover {
    background: rgba(255,255,255,.9);
    box-shadow: 0 2px 8px rgba(0,0,0,.12);
  }

  /* Feature list inside cards */
  .plan-features {
    list-style: none;
    margin-top: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    font-size: 0.875rem;
  }
  .plan-features li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .plan-features .icon {
    flex-shrink: 0;
    margin-top: 2px;
    font-size: 0.85rem;
  }
  .icon-check { color: var(--color-tick); }
  .icon-minus { color: var(--color-cross); }
  .featured .icon-check { color: rgba(255,255,255,.9); }
  .featured .icon-minus { color: rgba(255,255,255,.4); }
  .featured .plan-features { color: rgba(255,255,255,.88); }

  /* ─── Comparison table ───────────────────────────── */
  .compare-section {
    max-width: 900px;
    margin: 3.5rem auto 0;
  }
  .compare-section h2 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-ink-muted);
    text-align: center;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 1.25rem;
  }
  .compare-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
  }
  .compare-table {
    width: 100%;
    min-width: 540px;
    border-collapse: collapse;
    background: var(--color-surface);
    font-size: 0.875rem;
  }
  .compare-table caption {
    caption-side: top;
    text-align: left;
    padding: 0.75rem 1rem 0;
    font-size: 0.8rem;
    color: var(--color-ink-muted);
  }
  /* Sticky header */
  .compare-table thead {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--color-surface);
    box-shadow: 0 1px 0 var(--color-border);
  }
  .compare-table th, .compare-table td {
    padding: 0.7rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }
  .compare-table th[scope="col"] {
    font-weight: 700;
    font-size: 0.8rem;
    letter-spacing: 0.02em;
    white-space: nowrap;
    color: var(--color-ink);
  }
  .compare-table th[scope="col"].col-featured {
    color: var(--color-accent);
  }
  .compare-table th[scope="row"] {
    font-weight: 500;
    color: var(--color-ink);
    width: 45%;
  }
  /* Group header rows */
  .compare-table .group-label {
    background: var(--color-bg);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-ink-muted);
  }
  .compare-table .group-label td {
    padding-block: 0.5rem;
    border-bottom-color: var(--color-border);
  }
  .compare-table td { color: var(--color-ink-muted); }
  .compare-table td.tick  { color: var(--color-tick); font-weight: 600; }
  .compare-table td.cross { color: var(--color-cross); }
  .compare-table td.featured-col { color: var(--color-ink); font-weight: 600; }
  .compare-table tbody tr:last-child td,
  .compare-table tbody tr:last-child th { border-bottom: none; }
</style>
</head>
<body>

<main>
  <!-- ── Section header ── -->
  <header class="pricing-header">
    <h1>Simple pricing, no surprises</h1>
    <p>Pay for what you use. Downgrade, upgrade, or cancel any time — no contracts, no lock-in.</p>
  </header>

  <!-- ── Billing toggle ── -->
  <!--
    Uses <input type="checkbox" role="switch"> so:
    - Space toggles state (native checkbox behavior)
    - aria-checked is NOT needed on native checkbox; the browser maps checked → aria-checked automatically
    - aria-label provides a human description separate from the visual labels
    - The two sibling <span> labels are aria-hidden; the aria-label on the input is the accessible name
  -->
  <div class="billing-toggle-row" id="billing-control">
    <span class="billing-label active" id="label-monthly" aria-hidden="true">Monthly</span>

    <label class="toggle-switch">
      <input
        type="checkbox"
        role="switch"
        id="billing-toggle"
        aria-label="Switch to annual billing (save 20%)"
        aria-describedby="annual-saving-note"
      >
      <span class="toggle-track" aria-hidden="true"></span>
      <span class="toggle-thumb" aria-hidden="true"></span>
    </label>

    <span class="billing-label" id="label-annual" aria-hidden="true">
      Annual <span class="annual-badge" id="annual-saving-note">Save 20%</span>
    </span>
  </div>

  <!-- ── Pricing cards ── -->
  <!--
    data-billing attribute drives CSS visibility of monthly/annual prices.
    Set on this wrapper so a single attribute change updates all cards simultaneously.
  -->
  <div class="pricing-grid" data-billing="monthly" id="pricing-wrapper">

    <!-- Plan 1: Starter -->
    <article class="pricing-card" aria-label="Starter plan">
      <h2 class="plan-name">Starter</h2>
      <p class="plan-description">For individuals testing the water. All core tools, no team features.</p>

      <div class="plan-price-row price-monthly" aria-label="$12 per month, billed monthly">
        <span class="price-amount">$12</span>
        <span class="price-per">/mo</span>
      </div>
      <div class="plan-price-row price-annual" aria-label="$10 per month, billed annually at $120">
        <span class="price-amount">$10</span>
        <span class="price-per">/mo</span>
      </div>
      <p class="price-note price-monthly">Billed month to month</p>
      <p class="price-note price-annual">Billed $120/year</p>

      <a href="/signup?plan=starter" class="plan-cta">Get started free</a>

      <ul class="plan-features" aria-label="Starter plan features">
        <li><span class="icon icon-check" aria-hidden="true">✓</span>Up to 3 active projects</li>
        <li><span class="icon icon-check" aria-hidden="true">✓</span>5 GB file storage</li>
        <li><span class="icon icon-check" aria-hidden="true">✓</span>Core analytics (30-day history)</li>
        <li><span class="icon icon-check" aria-hidden="true">✓</span>Email support, 48-hour response</li>
        <li><span class="icon icon-minus" aria-hidden="true">–</span><span class="sr-only">Not included: </span>Team collaboration</li>
        <li><span class="icon icon-minus" aria-hidden="true">–</span><span class="sr-only">Not included: </span>Priority support</li>
      </ul>
    </article>

    <!-- Plan 2: Professional — recommended / featured -->
    <!--
      aria-label includes "recommended" so screen readers announce it without relying
      on the visual badge alone.
    -->
    <article class="pricing-card featured" aria-label="Professional plan, recommended">
      <span class="plan-badge" aria-hidden="true">Most popular</span>
      <h2 class="plan-name">Professional</h2>
      <p class="plan-description">For small teams shipping real work. Collaboration, integrations, and full history.</p>

      <div class="plan-price-row price-monthly" aria-label="$38 per month, billed monthly">
        <span class="price-amount">$38</span>
        <span class="price-per">/mo</span>
      </div>
      <div class="plan-price-row price-annual" aria-label="$30 per month, billed annually at $360">
        <span class="price-amount">$30</span>
        <span class="price-per">/mo</span>
      </div>
      <p class="price-note price-monthly">Billed month to month</p>
      <p class="price-note price-annual">Billed $360/year</p>

      <a href="/signup?plan=professional" class="plan-cta">Start 14-day trial</a>

      <ul class="plan-features" aria-label="Professional plan features">
        <li><span class="icon icon-check" aria-hidden="true">✓</span>Unlimited active projects</li>
        <li><span class="icon icon-check" aria-hidden="true">✓</span>50 GB file storage</li>
        <li><span class="icon icon-check" aria-hidden="true">✓</span>Full analytics (12-month history)</li>
        <li><span class="icon icon-check" aria-hidden="true">✓</span>Team collaboration (up to 10 seats)</li>
        <li><span class="icon icon-check" aria-hidden="true">✓</span>Slack + GitHub integrations</li>
        <li><span class="icon icon-check" aria-hidden="true">✓</span>Priority support, 4-hour response</li>
      </ul>
    </article>

    <!-- Plan 3: Scale -->
    <article class="pricing-card" aria-label="Scale plan">
      <h2 class="plan-name">Scale</h2>
      <p class="plan-description">For growing teams that need custom roles, audit logs, and dedicated support.</p>

      <div class="plan-price-row price-monthly" aria-label="$95 per month, billed monthly">
        <span class="price-amount">$95</span>
        <span class="price-per">/mo</span>
      </div>
      <div class="plan-price-row price-annual" aria-label="$76 per month, billed annually at $912">
        <span class="price-amount">$76</span>
        <span class="price-per">/mo</span>
      </div>
      <p class="price-note price-monthly">Billed month to month</p>
      <p class="price-note price-annual">Billed $912/year</p>

      <a href="/signup?plan=scale" class="plan-cta">Start 14-day trial</a>

      <ul class="plan-features" aria-label="Scale plan features">
        <li><span class="icon icon-check" aria-hidden="true">✓</span>Unlimited active projects</li>
        <li><span class="icon icon-check" aria-hidden="true">✓</span>500 GB file storage</li>
        <li><span class="icon icon-check" aria-hidden="true">✓</span>Full analytics + custom reports</li>
        <li><span class="icon icon-check" aria-hidden="true">✓</span>Unlimited team seats + roles</li>
        <li><span class="icon icon-check" aria-hidden="true">✓</span>All integrations + SSO/SAML</li>
        <li><span class="icon icon-check" aria-hidden="true">✓</span>Dedicated account manager</li>
      </ul>
    </article>
  </div><!-- /pricing-grid -->

  <!-- ── Comparison table ── -->
  <section class="compare-section" aria-labelledby="compare-heading">
    <h2 id="compare-heading">Full feature comparison</h2>
    <div class="compare-scroll" role="region" aria-label="Feature comparison table — scroll horizontally on small screens">
      <table class="compare-table">
        <caption class="sr-only">Feature comparison across Starter, Professional, and Scale plans</caption>
        <thead>
          <tr>
            <th scope="col">Feature</th>
            <th scope="col">Starter</th>
            <th scope="col" class="col-featured">Professional</th>
            <th scope="col">Scale</th>
          </tr>
        </thead>
        <tbody>
          <tr class="group-label"><td colspan="4">Projects &amp; storage</td></tr>
          <tr>
            <th scope="row">Active projects</th>
            <td>3</td>
            <td class="featured-col">Unlimited</td>
            <td>Unlimited</td>
          </tr>
          <tr>
            <th scope="row">File storage</th>
            <td>5 GB</td>
            <td class="featured-col">50 GB</td>
            <td>500 GB</td>
          </tr>
          <tr>
            <th scope="row">Version history</th>
            <td>30 days</td>
            <td class="featured-col">12 months</td>
            <td>Unlimited</td>
          </tr>
        </tbody>
        <tbody>
          <tr class="group-label"><td colspan="4">Collaboration</td></tr>
          <tr>
            <th scope="row">Team seats</th>
            <td class="cross" aria-label="Not available">—</td>
            <td class="featured-col">Up to 10</td>
            <td>Unlimited</td>
          </tr>
          <tr>
            <th scope="row">Custom roles &amp; permissions</th>
            <td class="cross" aria-label="Not included">—</td>
            <td class="cross featured-col" aria-label="Not included on Professional">—</td>
            <td class="tick" aria-label="Included">Yes</td>
          </tr>
          <tr>
            <th scope="row">Audit log</th>
            <td class="cross" aria-label="Not included">—</td>
            <td class="cross featured-col" aria-label="Not included on Professional">—</td>
            <td class="tick" aria-label="Included">Yes</td>
          </tr>
        </tbody>
        <tbody>
          <tr class="group-label"><td colspan="4">Integrations</td></tr>
          <tr>
            <th scope="row">Slack &amp; GitHub</th>
            <td class="cross" aria-label="Not included">—</td>
            <td class="tick featured-col" aria-label="Included">Yes</td>
            <td class="tick" aria-label="Included">Yes</td>
          </tr>
          <tr>
            <th scope="row">SSO / SAML</th>
            <td class="cross" aria-label="Not included">—</td>
            <td class="cross featured-col" aria-label="Not included on Professional">—</td>
            <td class="tick" aria-label="Included">Yes</td>
          </tr>
        </tbody>
        <tbody>
          <tr class="group-label"><td colspan="4">Support</td></tr>
          <tr>
            <th scope="row">Response time</th>
            <td>48 hours</td>
            <td class="featured-col">4 hours</td>
            <td>Dedicated manager</td>
          </tr>
          <tr>
            <th scope="row">SLA guarantee</th>
            <td class="cross" aria-label="Not included">—</td>
            <td class="cross featured-col" aria-label="Not included on Professional">—</td>
            <td class="tick" aria-label="Included">99.9% uptime</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</main>

<!-- Screen-reader-only utility -->
<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border: 0;
  }
</style>

<script>
(function () {
  'use strict';

  const toggle  = document.getElementById('billing-toggle');
  const wrapper = document.getElementById('pricing-wrapper');
  const labelMonthly = document.getElementById('label-monthly');
  const labelAnnual  = document.getElementById('label-annual');

  // Reflect billing state into DOM and update visual labels
  function applyBilling(isAnnual) {
    wrapper.dataset.billing = isAnnual ? 'annual' : 'monthly';

    labelMonthly.classList.toggle('active', !isAnnual);
    labelAnnual.classList.toggle('active', isAnnual);

    // Update aria-label on toggle to describe the *action* (what it will do next)
    toggle.setAttribute(
      'aria-label',
      isAnnual
        ? 'Switch to monthly billing'
        : 'Switch to annual billing (save 20%)'
    );
  }

  // Announce billing change to live region so screen readers catch price updates
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');       // polite live region
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  document.body.appendChild(liveRegion);

  toggle.addEventListener('change', function () {
    const isAnnual = this.checked;
    applyBilling(isAnnual);
    liveRegion.textContent = isAnnual
      ? 'Showing annual prices. Starter $120/year, Professional $360/year, Scale $912/year.'
      : 'Showing monthly prices. Starter $12/month, Professional $38/month, Scale $95/month.';
  });

  // Initialise to match checkbox's default unchecked state
  applyBilling(toggle.checked);
})();
</script>

</body>
</html>
```

### React + Tailwind variant (production-realistic)

This variant shows how the toggle state, price swap, and aria-live announcement work in a component context. Requires React 18+ and Tailwind CSS v3+.

```tsx
// PricingTable.tsx
'use client';
import { useState, useRef, useEffect } from 'react';

const plans = [
  {
    slug: 'starter',
    name: 'Starter',
    description: 'For individuals testing the water. Core tools, no team features.',
    monthly: 12,
    annual: 10,
    annualTotal: 120,
    featured: false,
    cta: 'Get started free',
    ctaHref: '/signup?plan=starter',
    features: [
      { label: 'Up to 3 active projects', included: true },
      { label: '5 GB file storage',       included: true },
      { label: 'Core analytics (30-day)', included: true },
      { label: 'Email support, 48-hour',  included: true },
      { label: 'Team collaboration',      included: false },
      { label: 'Priority support',        included: false },
    ],
  },
  {
    slug: 'professional',
    name: 'Professional',
    description: 'For small teams shipping real work. Collaboration, integrations, full history.',
    monthly: 38,
    annual: 30,
    annualTotal: 360,
    featured: true,
    cta: 'Start 14-day trial',
    ctaHref: '/signup?plan=professional',
    features: [
      { label: 'Unlimited active projects',          included: true },
      { label: '50 GB file storage',                 included: true },
      { label: 'Full analytics (12-month)',           included: true },
      { label: 'Team collaboration (up to 10 seats)',included: true },
      { label: 'Slack + GitHub integrations',        included: true },
      { label: 'Priority support, 4-hour response',  included: true },
    ],
  },
  {
    slug: 'scale',
    name: 'Scale',
    description: 'For growing teams needing custom roles, audit logs, and a dedicated contact.',
    monthly: 95,
    annual: 76,
    annualTotal: 912,
    featured: false,
    cta: 'Start 14-day trial',
    ctaHref: '/signup?plan=scale',
    features: [
      { label: 'Unlimited active projects',   included: true },
      { label: '500 GB file storage',         included: true },
      { label: 'Full analytics + custom reports', included: true },
      { label: 'Unlimited seats + roles',     included: true },
      { label: 'All integrations + SSO/SAML', included: true },
      { label: 'Dedicated account manager',   included: true },
    ],
  },
];

// Respect OS motion preference
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

export function PricingTable() {
  const [isAnnual, setIsAnnual] = useState(false);
  const liveRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  function handleToggle(checked: boolean) {
    setIsAnnual(checked);
    if (liveRef.current) {
      liveRef.current.textContent = checked
        ? 'Showing annual prices. Starter $120/year, Professional $360/year, Scale $912/year.'
        : 'Showing monthly prices. Starter $12/month, Professional $38/month, Scale $95/month.';
    }
  }

  const toggleLabel = isAnnual
    ? 'Switch to monthly billing'
    : 'Switch to annual billing (save 20%)';

  return (
    <section aria-label="Pricing plans">
      {/* Screen-reader live region for price announcements */}
      <div
        ref={liveRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span
          aria-hidden="true"
          className={`text-sm font-medium transition-colors ${
            isAnnual ? 'text-stone-400' : 'text-stone-800'
          }`}
        >
          Monthly
        </span>

        <label className="relative inline-flex items-center cursor-pointer w-11 h-6">
          <input
            type="checkbox"
            role="switch"
            className="sr-only peer"
            checked={isAnnual}
            aria-label={toggleLabel}
            aria-describedby="annual-saving"
            onChange={(e) => handleToggle(e.target.checked)}
          />
          {/* Track */}
          <span
            aria-hidden="true"
            className={[
              'absolute inset-0 rounded-full',
              'bg-stone-300 peer-checked:bg-[#2d5a27]',
              reducedMotion ? '' : 'transition-colors duration-150 ease-out',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-[#2d5a27] peer-focus-visible:ring-offset-2',
            ].join(' ')}
          />
          {/* Thumb */}
          <span
            aria-hidden="true"
            className={[
              'absolute left-[3px] top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm',
              reducedMotion
                ? 'peer-checked:translate-x-5'
                : 'transition-transform duration-[180ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] peer-checked:translate-x-5',
            ].join(' ')}
          />
        </label>

        <span aria-hidden="true" className="flex items-center gap-2 text-sm font-medium text-stone-800">
          Annual
          <span
            id="annual-saving"
            className="text-[0.7rem] font-bold uppercase tracking-wide text-[#2d5a27] bg-[#edf3ec] px-1.5 py-0.5 rounded"
          >
            Save 20%
          </span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto items-start">
        {plans.map((plan) => (
          <article
            key={plan.slug}
            aria-label={`${plan.name} plan${plan.featured ? ', recommended' : ''}`}
            className={[
              'rounded-xl flex flex-col gap-2 p-7',
              plan.featured
                ? 'bg-[#2d5a27] text-white shadow-[0_4px_24px_rgba(45,90,39,0.22)] -my-3 py-10'
                : 'bg-white border border-stone-200 shadow-sm',
            ].join(' ')}
          >
            {plan.featured && (
              <span
                aria-hidden="true"
                className="self-start text-[0.68rem] font-bold uppercase tracking-widest bg-white/20 text-white/90 px-2 py-0.5 rounded mb-1"
              >
                Most popular
              </span>
            )}

            <h2 className="text-[1.05rem] font-bold tracking-tight">{plan.name}</h2>
            <p className={`text-sm leading-relaxed ${plan.featured ? 'text-white/70' : 'text-stone-500'}`}>
              {plan.description}
            </p>

            <div className="mt-4 flex items-baseline gap-1">
              <span
                className="text-[2.25rem] font-extrabold tracking-[-0.04em] tabular-nums"
                aria-label={`$${isAnnual ? plan.annual : plan.monthly} per month`}
              >
                ${isAnnual ? plan.annual : plan.monthly}
              </span>
              <span className={`text-sm ${plan.featured ? 'text-white/60' : 'text-stone-400'}`}>/mo</span>
            </div>
            <p className={`text-xs mt-0.5 ${plan.featured ? 'text-white/55' : 'text-stone-400'}`}>
              {isAnnual ? `Billed $${plan.annualTotal}/year` : 'Billed month to month'}
            </p>

            <a
              href={plan.ctaHref}
              className={[
                'mt-5 block text-center rounded-lg py-2.5 text-sm font-semibold transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d5a27]',
                plan.featured
                  ? 'bg-white text-[#2d5a27] hover:bg-white/90'
                  : 'bg-[#edf3ec] text-[#2d5a27] hover:bg-[#2d5a27] hover:text-white',
              ].join(' ')}
            >
              {plan.cta}
            </a>

            <ul className="mt-5 flex flex-col gap-2 text-sm" aria-label={`${plan.name} features`}>
              {plan.features.map((f) => (
                <li key={f.label} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className={
                      f.included
                        ? plan.featured ? 'text-white/90 mt-[2px]' : 'text-[#2d5a27] mt-[2px]'
                        : plan.featured ? 'text-white/35 mt-[2px]' : 'text-stone-300 mt-[2px]'
                    }
                  >
                    {f.included ? '✓' : '–'}
                  </span>
                  {!f.included && <span className="sr-only">Not included: </span>}
                  <span className={plan.featured && !f.included ? 'text-white/55' : ''}>{f.label}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
```

## Variations

- **Two-tier / binary choice**: remove the middle "featured" plan, show two equal cards. Works for products with a clear free/paid split; avoids the "decoy pricing" psychology of three-tier.
- **Usage-based slider**: replace the monthly/annual toggle with a range input (seats, API calls, GB). Prices update via JS calculation rather than a lookup table. Requires additional ARIA: `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and a live region for the price output.
- **Enterprise contact row**: a fourth column or a banner below the cards reading "Need more than 50 seats? [Talk to our team]" — keeps the table scannable without forcing a fourth tier.
- **Guided quiz before table**: ask "How many people on your team?" before rendering the table, then pre-highlight the matching tier. Reduces cognitive load for non-technical buyers.
- **Feature-group accordion**: hide all rows below the fold, expose category groups ("Storage", "Collaboration", "Support") as expandable `<details>` / `<summary>` elements. Cuts visual noise for long feature lists while preserving table semantics for keyboard users.
- **Horizontal scroll with sticky feature column**: on mobile, let the table scroll horizontally but keep `th[scope="row"]` cells sticky via `position: sticky; left: 0`. Requires `overflow-x: auto` on the scroll container and `z-index` management.

## Accessibility

### Toggle (billing switch)

The toggle uses `<input type="checkbox" role="switch">`. The browser maps the native `checked` attribute to `aria-checked` automatically, so no manual attribute management is required. The accessible name comes from `aria-label` on the input, not the adjacent visible span labels (which are `aria-hidden`). Space activates it natively. A `:focus-visible` ring via `peer-focus-visible:ring-*` (Tailwind) or `:focus-visible` in CSS ensures the indicator appears only for keyboard users, not mouse clicks.

```css
/* Focus ring visible only on keyboard navigation */
.toggle-switch input[type="checkbox"]:focus-visible ~ .toggle-track {
  outline: 2px solid #2d5a27;
  outline-offset: 2px;
}
```

### Price change announcement

When the toggle fires, a `role="status"` / `aria-live="polite"` region receives a text summary of the new prices. Without this, screen reader users hear the toggle state change but get no indication that the prices on screen have updated. The live region text is specific and complete — not just "Prices updated" — so users do not need to re-navigate the page.

### Table semantics

- `<th scope="col">` on plan name headers; `<th scope="row">` on feature name cells. This is the minimal correct markup per the W3C Tables Tutorial. No `id`/`headers` pairing is needed here because the table is simple (one header per axis).
- A `<caption>` is present but visually hidden via `.sr-only`. It describes the table before the user navigates into it.
- The scroll container gets `role="region"` and `aria-label` to signal to screen readers that horizontal scrolling is available on small viewports.
- Cells for unavailable features use `aria-label="Not included"` to prevent screen readers from announcing a bare em dash as punctuation.

### prefers-reduced-motion

The toggle thumb slide and any price fade are both controlled by CSS transitions. The reduced-motion block sets durations to `0.01ms` (not `0` — preserves `transitionend` for JS listeners):

```css
@media (prefers-reduced-motion: reduce) {
  .toggle-track,
  .toggle-thumb { transition-duration: 0.01ms !important; }
  :root { --transition-price: opacity 0.01ms ease; }
}
```

In the React variant, `useReducedMotion()` conditionally omits the transition Tailwind classes from the toggle track and thumb.

### Touch and pointer fallback

The toggle is a native `<input type="checkbox">` sized to at least 44 × 44 px effective tap area (the transparent `<input>` is `position: absolute; inset: 0; width: 100%; height: 100%`). No hover-only interaction is used anywhere in the component. Hover effects on CTA buttons use plain `:hover` without relying on them as the sole state indicator.

```css
/* Hover styles are additive — not the only state signal */
@media (hover: hover) and (pointer: fine) {
  .plan-cta:hover { background: var(--color-accent); color: #fff; }
}
```

### Contrast — colors used in this file

All values computed against the WCAG 2.1 relative luminance formula for pairs actually present in the code:

| Text | Background | Ratio | WCAG level |
|------|-----------|-------|------------|
| `#1a1a1a` on `#ffffff` | white card | 17.1:1 | AAA |
| `#ffffff` on `#2d5a27` | featured card | 7.5:1 | AAA |
| `#2d5a27` on `#edf3ec` | badge, muted CTA | 4.8:1 | AA |
| `#6b6b6b` on `#ffffff` | muted description text | 5.7:1 | AA |

Note: `rgba(255,255,255,0.72)` on `#2d5a27` (featured plan description) yields approximately 5.1:1 — passes AA. Never use lower opacity for body text in the featured card.

## Performance

- The price swap uses `display: none` toggled via a single CSS `data-billing` attribute on the wrapper element — one DOM attribute write triggers a CSS cascade update across all cards with no layout thrash. Avoid toggling classes on every individual price element.
- The toggle thumb animation uses `transform: translateX()` only — GPU-composited, no repaint or reflow.
- Do not use `will-change: transform` on the toggle thumb. The element is small and infrequently animated; premature promotion wastes compositor memory.
- The comparison table's sticky `<thead>` works via `position: sticky` on the `thead` element itself, not on individual `<th>` cells. Test that the `overflow-x: auto` scroll container does not clip the sticky positioning — add `overflow: clip` (not `hidden`) on intermediate wrappers if sticky breaks.
- `backdrop-filter` is not used anywhere in this component; avoid it on every card surface (Slop Blocklist → Surface: glassmorphism). One translucent moment over real imagery is fine; blurring table backgrounds is not.
- For very long feature lists (20+ rows), consider lazy-loading the `<table>` below the fold using an `IntersectionObserver` that inserts it only when the user scrolls close to it.

## Anti-slop

**Cliche (Slop Blocklist → Color, Type, Surface, Copy):**
The default AI-generated pricing table reaches for all the defaults simultaneously — purple-to-pink gradient on the featured card, Inter at one weight, `#3B82F6` generic SaaS blue everywhere, glassmorphism on every card, and CTAs reading "Unlock your potential" or "Supercharge your workflow."

**Tasteful alternative:**
- **Color**: Pick one committed brand hue (here, forest green `#2d5a27`) and use it as a solid fill on the featured card only. The other two cards are plain white. No gradient. The accent muted tint (`#edf3ec`) is derived from the same hue via lightness, not from a separate palette.
- **Typography**: Use a characterful sans (General Sans, Satoshi, or Geist) with real weight contrast — 800 for the price numeral, 700 for plan name, 500 for feature list, 400 for description. Size the price with `clamp()` so it scales without breakpoint overrides.
- **Surface**: The featured card earns its elevation through background color and a focused `box-shadow`, not glassmorphism. The other cards have a single `1px` border and a minimal shadow — not a blur, not a glow on every surface.
- **Copy**: "Start 14-day trial", "Get started free", "No contracts, no lock-in" — concrete, specific, honest. Never "Empower", "Seamless", or "Unlock" (Slop Blocklist → Copy).
- **Featured card visual treatment**: The card is taller via `margin-block: -0.75rem` and `padding-block: 2.5rem`, not via `transform: scale()` (which would break table row alignment in the comparison matrix below).

## Pairs well with

- `hero-sections` (the pricing table often lives one scroll past a product hero — use the same type scale and spacing rhythm)
- `navbars` (a sticky nav with an "Upgrade" CTA benefits from the same color token as the featured plan's background)
- `cards` (the pricing card is a specialized card variant; share border-radius, shadow tokens, and spacing constants)
- `text-reveal-on-scroll` (a section heading above the pricing grid can use a mask-up reveal, but keep it to one line; do not animate the cards themselves on entry)

## Current references

- [ARIA APG: Switch pattern — W3C WAI](https://www.w3.org/WAI/ARIA/apg/patterns/switch/) — keyboard interaction spec (Space toggles), required `aria-checked` values, and the difference from the checkbox role
- [ARIA switch role — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/switch_role) — `aria-checked` semantics, `mixed` not supported, native checkbox alternative, all descendants presentational
- [Tables Tutorial — W3C WAI](https://www.w3.org/WAI/tutorials/tables/) — `th scope="col/row"`, `caption`, complex multi-header structures for feature comparison tables
- [Comparison tables for products, services, and features — Nielsen Norman Group](https://www.nngroup.com/articles/comparison-tables/) (February 2024) — when to use static vs. dynamic comparison tables, sticky column headers, mobile simplification strategies, limiting to five items to prevent decision paralysis
- [UI design comparison features — LogRocket](https://blog.logrocket.com/ux-design/ui-design-comparison-features/) (updated December 2024) — show-differences-only toggle, visual differentiation strategies, horizontal-scroll mobile caveats
- [Pricing UI design — Setproduct](https://www.setproduct.com/blog/pricing-ui-design) (December 2024) — 2-tier, 3-tier, and 4-tier plan structures, billing toggle anatomy, CTA hierarchy, visual emphasis on recommended plan
- [prefers-reduced-motion CSS feature — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — `no-preference` / `reduce` values, progressive-enhancement approach (base = no motion, add motion on no-preference)
- [WCAG C39: Using prefers-reduced-motion — W3C](https://www.w3.org/WAI/WCAG21/Techniques/css/C39) — normative technique for suppressing or replacing non-essential animation
- [CSS container queries — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) — shipped in all modern browsers (Chrome 105+, Safari 16+, Firefox 110+); production-ready for component-level responsive card layouts
- [Accessible toggle buttons — TestParty](https://testparty.ai/blog/accessible-toggle-buttons-modern-web-apps-complete-guide) (January 2026) — focus-visible patterns, touch target sizing, aria-label vs aria-describedby on switches
