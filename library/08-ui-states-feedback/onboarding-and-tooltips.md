# Onboarding and tooltips

> Contextual, non-blocking helpers — tooltips, coachmarks, and product tours — that surface the right instruction at the moment a user needs it without stealing focus or blocking work.

**Bucket:** component
**Maturity:** evergreen (tooltip) / current (coachmark/tour, popover API modernisation)
**Effort:** medium
**Best for:** apps, dashboards, portfolios (contextual icon labels), websites (feature announcements)

## What it is

Onboarding helpers exist on a spectrum of intrusiveness. At the lightweight end, a **tooltip** is a text-only, non-interactive overlay that appears on hover or keyboard focus to supplement a label — it never receives focus itself and disappears when attention moves on. In the middle, a **contextual hint** (sometimes called a toggletip) is explicitly user-triggered, stays open until dismissed, and can appear on touch. At the intrusive end, a **coachmark** or **product tour** is a sequenced, multi-step walkthrough that highlights UI regions in order; it traps focus inside the step container and requires deliberate dismissal. The unifying principle is progressive disclosure: reveal the right amount of help exactly when the user signals they need it, then get out of the way.

## When to use

- An icon button has no visible text label and a tooltip names it (e.g., "Delete", "Share", "Filter").
- A form field has a constraint that is too long to display inline all the time — a hint icon with a contextual tooltip surfaces it on demand.
- A feature was recently released and 20 % of active users have not discovered it after two weeks — a coachmark draws attention once, then never again for that user.
- A user creates their first project and the workflow has five non-obvious steps — a product tour walks through them in order, skippable at any point.
- An interface element is disabled and needs a brief explanation of why (e.g., "You need editor permission to publish").

## When NOT to use

- The information in the tooltip is actually required to complete the task — if users cannot proceed without reading it, put the text inline, always visible.
- You want to teach users an entire product during signup — onboarding tours fired immediately on first login before the user has any context consistently underperform against contextual, deferred triggers.
- The tooltip contains interactive content (links, buttons, form inputs) — use a popover, disclosure, or non-modal dialog instead; `role="tooltip"` and the APG tooltip pattern explicitly prohibit interactive children.
- Mobile-only flows — hover-triggered tooltips are inaccessible on touch devices without a separate tap trigger; use contextual inline help text instead.
- Every icon on the page has a tooltip — this is the most common overuse. If the UI needs that many labels to be comprehensible, the icons are not self-explanatory and should be redesigned or given persistent visible labels.

## How it works

### Tooltip

The APG tooltip pattern (W3C, ongoing — tracking task force consensus in [GitHub issue #128](https://github.com/w3c/aria-practices/issues/128)) defines a tooltip as:

- A popup with `role="tooltip"` on the container element.
- The trigger element references it via `aria-describedby="[tooltip-id]"`.
- The tooltip opens on `mouseenter` / `focus` and closes on `mouseleave` / `blur`.
- Pressing Escape closes a visible tooltip without moving focus away from the trigger.
- The tooltip itself never enters the tab sequence; it contains no focusable children.
- The mouse can move from the trigger onto the tooltip without the tooltip closing (WCAG 1.4.13 "hoverable" criterion).

The modern native path (Chrome 133+, Interop 2026 target) is `popover="hint"`: a browser-managed stacking context designed for tooltips. A hint popover auto-dismisses on Esc and light-click, does not close unrelated `popover="auto"` menus when it opens, and gets free implicit anchor relationship with its invoker button in Chrome 133+ — letting you position it with one line of CSS anchor positioning. You still need to wire `role="tooltip"` and `aria-describedby` manually; the popover attribute handles display/dismiss mechanics, not semantics.

WCAG Success Criterion 1.4.13 (Content on Hover or Focus) requires tooltip content to be **dismissible** (Escape), **hoverable** (mouse can traverse from trigger to tooltip without it vanishing), and **persistent** (content does not disappear on a timer).

### Coachmark / product tour

A coachmark highlights one UI region at a time, usually with a spotlight overlay dimming everything else. A product tour is a sequence of coachmarks. The key behaviour differences from a tooltip:

- Focus is **trapped** inside the step container (Next, Back, Skip, and a close button are all inside); this prevents keyboard users from accidentally interacting with obscured background content.
- When the tour opens, focus moves to the first interactive element inside the step (usually the "Next" button or the step heading).
- When the tour closes (any exit path), focus returns to the element that triggered it.
- Step transitions announce the new content to screen readers via `aria-live="polite"` on a live region that receives the step text.
- The backdrop overlay is `aria-hidden="true"` — screen readers should not navigate into dimmed content.
- Auto-advancing tours (timer-based) must be stoppable (WCAG 2.2.2).

## Working code

### Vanilla tooltip — APG pattern with Esc dismiss and hover-bridge

This is a complete, self-contained document. It implements the APG tooltip pattern: hover + focus triggers, Esc dismissal, `role="tooltip"`, `aria-describedby`, a 100 ms hover bridge so the mouse can travel between trigger and tooltip without a gap dismissing it, and a full `prefers-reduced-motion` branch.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Accessible tooltip — APG pattern</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0f1117;
      color: #e8e9ed;
      font-family: "Geist", "Inter", system-ui, sans-serif;
      font-size: 1rem;
    }

    .demo-row {
      display: flex;
      gap: 2rem;
      align-items: center;
      flex-wrap: wrap;
      justify-content: center;
    }

    /* --- Trigger --- */
    .tip-trigger {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      border: 1.5px solid #2e3040;
      border-radius: 0.5rem;
      background: #181b28;
      color: #e8e9ed;
      font: inherit;
      font-size: 0.9rem;
      cursor: default;
      /* Triggers need a focus-visible ring */
      outline: none;
    }
    .tip-trigger:focus-visible {
      outline: 2.5px solid #6c8fff;
      outline-offset: 2px;
    }

    /* --- Tooltip container --- */
    [role="tooltip"] {
      position: absolute;
      /* Default placement: above centre */
      bottom: calc(100% + 0.5rem);
      left: 50%;
      transform: translateX(-50%);
      width: max-content;
      max-width: 18rem;
      padding: 0.45rem 0.75rem;
      border-radius: 0.375rem;
      background: #1f2335;
      /* #1f2335 on #0f1117 body — tooltip floats above, own bg used */
      /* Text: #e8e9ed on #1f2335 — contrast ratio ≈ 13.5:1 (WCAG AAA) */
      color: #e8e9ed;
      font-size: 0.8125rem;
      line-height: 1.5;
      border: 1px solid #2e3040;
      box-shadow: 0 4px 16px rgb(0 0 0 / 0.45);
      /* Pointer events on so mouse can travel onto tooltip (WCAG 1.4.13) */
      pointer-events: auto;
      /* Hidden by default */
      visibility: hidden;
      opacity: 0;
      /* Arrow */
      --arrow-size: 6px;
    }

    /* Caret / arrow pointing down toward the trigger */
    [role="tooltip"]::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: var(--arrow-size) solid transparent;
      border-top-color: #2e3040;
    }
    [role="tooltip"]::before {
      content: "";
      position: absolute;
      top: calc(100% - 1px);
      left: 50%;
      transform: translateX(-50%);
      border: var(--arrow-size) solid transparent;
      border-top-color: #1f2335;
      z-index: 1;
    }

    /* Visible state */
    [role="tooltip"].is-open {
      visibility: visible;
      opacity: 1;
    }

    /* Transition — only when motion is allowed */
    @media (prefers-reduced-motion: no-preference) {
      [role="tooltip"] {
        transition:
          opacity 140ms cubic-bezier(0.16, 1, 0.3, 1),
          transform 140ms cubic-bezier(0.16, 1, 0.3, 1);
        transform: translateX(-50%) translateY(4px);
      }
      [role="tooltip"].is-open {
        transform: translateX(-50%) translateY(0);
      }
    }

    /* Reduced-motion: no transition, instant appear/disappear */
    @media (prefers-reduced-motion: reduce) {
      [role="tooltip"] {
        transition: none;
      }
    }
  </style>
</head>
<body>
  <div class="demo-row">

    <!-- Example 1: icon button -->
    <button
      class="tip-trigger"
      type="button"
      aria-describedby="tip-filter"
    >
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M5 8h6M7 12h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Filter
      <span role="tooltip" id="tip-filter">
        Narrow results by status, date, or assignee
      </span>
    </button>

    <!-- Example 2: info hint -->
    <button
      class="tip-trigger"
      type="button"
      aria-describedby="tip-api"
    >
      API key
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.25"/>
        <path d="M7 6.5v4M7 4.5v.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
      </svg>
      <span role="tooltip" id="tip-api">
        Keep this secret — it grants full write access to your account
      </span>
    </button>

    <!-- Example 3: disabled field -->
    <span
      class="tip-trigger"
      tabindex="0"
      role="button"
      aria-disabled="true"
      aria-describedby="tip-publish"
    >
      Publish
      <span role="tooltip" id="tip-publish">
        You need editor access to publish. Ask your admin for a role upgrade.
      </span>
    </span>

  </div>

  <script>
    // Delay before hiding after pointer leaves, so mouse can bridge
    // from trigger to tooltip (WCAG 1.4.13 "hoverable" requirement).
    const HIDE_DELAY_MS = 120;

    document.querySelectorAll('.tip-trigger').forEach(trigger => {
      const tooltip = trigger.querySelector('[role="tooltip"]');
      if (!tooltip) return;

      let hideTimer = null;

      function show() {
        clearTimeout(hideTimer);
        tooltip.classList.add('is-open');
      }

      function scheduleHide() {
        hideTimer = setTimeout(() => {
          tooltip.classList.remove('is-open');
        }, HIDE_DELAY_MS);
      }

      // Hover on trigger
      trigger.addEventListener('mouseenter', show);
      trigger.addEventListener('mouseleave', scheduleHide);

      // Allow mouse to travel onto tooltip without it closing
      tooltip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
      tooltip.addEventListener('mouseleave', scheduleHide);

      // Keyboard focus
      trigger.addEventListener('focusin', show);
      trigger.addEventListener('focusout', scheduleHide);

      // Escape dismisses the tooltip (focus stays on trigger)
      trigger.addEventListener('keydown', e => {
        if (e.key === 'Escape' && tooltip.classList.contains('is-open')) {
          e.stopPropagation();
          tooltip.classList.remove('is-open');
        }
      });
    });
  </script>
</body>
</html>
```

**Contrast notes for this file's colours:**
- Tooltip text `#e8e9ed` on tooltip background `#1f2335`: relative luminance ~0.826 vs ~0.015 — ratio ≈ 13.5:1. Passes WCAG AA and AAA for normal text.
- Trigger text `#e8e9ed` on trigger background `#181b28`: relative luminance 0.825 vs 0.012 — ratio ≈ 13.4:1. Passes AAA.
- Focus ring `#6c8fff` used as an outline-only colour, not text-on-background — no body-text contrast claim applies.

---

### Product tour / coachmark — vanilla JS with focus trap

A complete, runnable single-file coachmark component. Focus traps inside each step, Esc exits and returns focus to the launcher, step transitions use `aria-live="polite"`, the backdrop is `aria-hidden="true"`, and shimmer/enter animations respect `prefers-reduced-motion`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Coachmark tour — accessible</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      background: #0f1117;
      color: #e8e9ed;
      font-family: "Geist", "Inter", system-ui, sans-serif;
      font-size: 1rem;
      padding: 3rem 2rem;
    }

    /* ---- Fake app UI ---- */
    .app-bar {
      display: flex; gap: 1rem; align-items: center;
      margin-bottom: 2rem;
    }
    .app-bar button {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      background: #181b28;
      color: #e8e9ed;
      border: 1.5px solid #2e3040;
      font: inherit; cursor: pointer;
    }
    .app-bar button:focus-visible {
      outline: 2.5px solid #6c8fff; outline-offset: 2px;
    }
    #start-tour {
      background: #2d4fd6;
      border-color: #2d4fd6;
      font-weight: 600;
    }

    /* ---- Backdrop ---- */
    .tour-backdrop {
      position: fixed; inset: 0;
      background: rgb(0 0 0 / 0.65);
      z-index: 900;
      display: none;
    }
    .tour-backdrop.is-active { display: block; }

    /* ---- Spotlight cutout ---- */
    .tour-spotlight {
      position: fixed;
      border-radius: 6px;
      box-shadow: 0 0 0 9999px rgb(0 0 0 / 0.65);
      z-index: 910;
      pointer-events: none;
      display: none;
    }
    .tour-spotlight.is-active { display: block; }

    /* ---- Step card ---- */
    .tour-card {
      position: fixed;
      z-index: 920;
      width: 18rem;
      background: #1a1d2e;
      border: 1px solid #2e3040;
      border-radius: 0.625rem;
      box-shadow: 0 8px 32px rgb(0 0 0 / 0.5);
      padding: 1.25rem;
      display: none;
    }
    .tour-card.is-active { display: block; }

    @media (prefers-reduced-motion: no-preference) {
      .tour-card {
        opacity: 0;
        transform: translateY(8px);
        transition:
          opacity 200ms cubic-bezier(0.16, 1, 0.3, 1),
          transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
      }
      .tour-card.is-active {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .tour-card { transition: none; }
    }

    .tour-card__meta {
      font-size: 0.75rem;
      color: #6b7280;
      margin-bottom: 0.375rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .tour-card__title {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #f1f2f6;
    }
    .tour-card__body {
      font-size: 0.875rem;
      color: #b0b3c1;
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    /* Progress dots */
    .tour-dots {
      display: flex; gap: 0.375rem;
      align-items: center;
      margin-bottom: 1rem;
    }
    .tour-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #2e3040;
      transition: background 200ms;
    }
    .tour-dot.is-current { background: #6c8fff; width: 18px; border-radius: 3px; }

    /* Buttons */
    .tour-actions {
      display: flex; gap: 0.75rem; justify-content: flex-end;
      align-items: center;
    }
    .tour-btn {
      padding: 0.4375rem 0.875rem;
      border-radius: 0.375rem;
      font: inherit; font-size: 0.875rem; font-weight: 500;
      cursor: pointer; border: none;
    }
    .tour-btn--skip {
      background: transparent;
      color: #6b7280;
      text-decoration: underline;
      text-underline-offset: 2px;
      margin-right: auto;
    }
    .tour-btn--skip:hover { color: #b0b3c1; }
    .tour-btn--back {
      background: #181b28;
      color: #e8e9ed;
      border: 1.5px solid #2e3040;
    }
    .tour-btn--next {
      background: #2d4fd6;
      color: #fff;
    }
    .tour-btn:focus-visible {
      outline: 2.5px solid #6c8fff; outline-offset: 2px;
    }

    /* Aria live region — visually hidden, read by screen readers */
    .sr-only {
      position: absolute; width: 1px; height: 1px;
      padding: 0; margin: -1px; overflow: hidden;
      clip: rect(0,0,0,0); white-space: nowrap; border: 0;
    }
  </style>
</head>
<body>

  <!-- Fake app chrome -->
  <div class="app-bar">
    <strong>Dataflow</strong>
    <button id="btn-sources" type="button">Sources</button>
    <button id="btn-transforms" type="button">Transforms</button>
    <button id="btn-destinations" type="button">Destinations</button>
    <button id="start-tour" type="button">Take the tour</button>
  </div>

  <!-- Screen-reader live region for step announcements -->
  <!-- role="status" is polite — does not interrupt current speech -->
  <div id="tour-live" role="status" aria-live="polite" aria-atomic="true" class="sr-only"></div>

  <!-- Backdrop (aria-hidden — screen readers skip dimmed content) -->
  <div class="tour-backdrop" id="tour-backdrop" aria-hidden="true"></div>

  <!-- Spotlight highlight box -->
  <div class="tour-spotlight" id="tour-spotlight" aria-hidden="true"></div>

  <!-- Step card -->
  <div
    class="tour-card"
    id="tour-card"
    role="region"
    aria-label="Product tour"
    aria-modal="false"
  >
    <p class="tour-card__meta" id="tour-step-meta">Step 1 of 3</p>
    <h2 class="tour-card__title" id="tour-step-title">Connect a data source</h2>
    <p class="tour-card__body" id="tour-step-body">
      Click Sources to add a database, webhook, or file upload.
      Your data never leaves your infrastructure.
    </p>
    <div class="tour-dots" id="tour-dots" aria-hidden="true"></div>
    <div class="tour-actions">
      <button class="tour-btn tour-btn--skip" id="tour-skip" type="button">Skip tour</button>
      <button class="tour-btn tour-btn--back" id="tour-back" type="button">Back</button>
      <button class="tour-btn tour-btn--next" id="tour-next" type="button">Next</button>
    </div>
  </div>

  <script>
    const STEPS = [
      {
        targetId: 'btn-sources',
        title: 'Connect a data source',
        body: 'Click Sources to add a database, webhook, or file upload. Your data never leaves your infrastructure.',
        nextLabel: 'Next',
      },
      {
        targetId: 'btn-transforms',
        title: 'Transform your data',
        body: 'Write SQL or use the visual builder to filter, join, and reshape records before they reach a destination.',
        nextLabel: 'Next',
      },
      {
        targetId: 'btn-destinations',
        title: 'Send data anywhere',
        body: 'Route transformed data to your data warehouse, analytics tool, or any webhook endpoint.',
        nextLabel: 'Done',
      },
    ];

    const backdrop   = document.getElementById('tour-backdrop');
    const spotlight  = document.getElementById('tour-spotlight');
    const card       = document.getElementById('tour-card');
    const liveRegion = document.getElementById('tour-live');
    const metaEl     = document.getElementById('tour-step-meta');
    const titleEl    = document.getElementById('tour-step-title');
    const bodyEl     = document.getElementById('tour-step-body');
    const dotsEl     = document.getElementById('tour-dots');
    const btnBack    = document.getElementById('tour-back');
    const btnNext    = document.getElementById('tour-next');
    const btnSkip    = document.getElementById('tour-skip');
    const btnStart   = document.getElementById('start-tour');

    let currentStep = 0;
    let triggerEl   = null; // element that launched the tour — focus returns here

    // ---- Focus trap ----
    function getFocusable(container) {
      return Array.from(container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
    }

    function trapFocus(e) {
      const focusable = getFocusable(card);
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeTour();
      }
    }

    // ---- Spotlight positioning ----
    function positionSpotlight(targetEl) {
      const PADDING = 8;
      const rect = targetEl.getBoundingClientRect();
      spotlight.style.top    = (rect.top    - PADDING) + 'px';
      spotlight.style.left   = (rect.left   - PADDING) + 'px';
      spotlight.style.width  = (rect.width  + PADDING * 2) + 'px';
      spotlight.style.height = (rect.height + PADDING * 2) + 'px';
    }

    // ---- Card positioning — prefer below target, flip if too close to bottom ----
    function positionCard(targetEl) {
      const MARGIN = 16;
      const rect = targetEl.getBoundingClientRect();
      const cardH = card.offsetHeight || 220;
      const viewH = window.innerHeight;

      let top = rect.bottom + MARGIN;
      if (top + cardH > viewH - MARGIN) {
        // flip above
        top = rect.top - cardH - MARGIN;
      }
      card.style.top  = Math.max(MARGIN, top) + 'px';
      card.style.left = Math.min(
        rect.left,
        window.innerWidth - card.offsetWidth - MARGIN
      ) + 'px';
    }

    // ---- Render step ----
    function renderStep(index) {
      const step = STEPS[index];
      const total = STEPS.length;
      const isFirst = index === 0;
      const isLast  = index === total - 1;

      metaEl.textContent = `Step ${index + 1} of ${total}`;
      titleEl.textContent = step.title;
      bodyEl.textContent  = step.body;
      btnNext.textContent = step.nextLabel;
      btnBack.disabled    = isFirst;
      btnBack.style.visibility = isFirst ? 'hidden' : 'visible';

      // Progress dots
      dotsEl.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('span');
        dot.className = 'tour-dot' + (i === index ? ' is-current' : '');
        dotsEl.appendChild(dot);
      }

      // Spotlight
      const target = document.getElementById(step.targetId);
      if (target) {
        positionSpotlight(target);
        spotlight.classList.add('is-active');
        // Reposition card after paint so offsetHeight is accurate
        requestAnimationFrame(() => positionCard(target));
      }

      // Announce to screen readers via live region
      // Brief delay ensures the region update fires as a new announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 50);
      setTimeout(() => {
        liveRegion.textContent = `Step ${index + 1} of ${total}: ${step.title}. ${step.body}`;
      }, 100);

      // Move focus to Next button on step change
      // (first interactive element in the flow)
      btnNext.focus();
    }

    // ---- Open tour ----
    function openTour(launcher) {
      triggerEl   = launcher;
      currentStep = 0;

      backdrop.classList.add('is-active');
      card.classList.add('is-active');

      // Lock body scroll
      document.body.style.overflow = 'hidden';

      // Activate focus trap
      document.addEventListener('keydown', trapFocus);

      renderStep(0);
    }

    // ---- Close tour ----
    function closeTour() {
      backdrop.classList.remove('is-active');
      card.classList.remove('is-active');
      spotlight.classList.remove('is-active');

      // Remove focus trap
      document.removeEventListener('keydown', trapFocus);

      // Restore scroll
      document.body.style.overflow = '';

      // Clear live region
      liveRegion.textContent = '';

      // Return focus to launch trigger
      if (triggerEl) triggerEl.focus();
    }

    // ---- Wire controls ----
    btnStart.addEventListener('click', () => openTour(btnStart));

    btnNext.addEventListener('click', () => {
      if (currentStep < STEPS.length - 1) {
        currentStep++;
        renderStep(currentStep);
      } else {
        closeTour();
      }
    });

    btnBack.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--;
        renderStep(currentStep);
      }
    });

    btnSkip.addEventListener('click', closeTour);

    // Reposition on resize / scroll
    window.addEventListener('resize', () => {
      if (!card.classList.contains('is-active')) return;
      const target = document.getElementById(STEPS[currentStep].targetId);
      if (target) { positionSpotlight(target); positionCard(target); }
    });
  </script>
</body>
</html>
```

---

### React tooltip — Floating UI (production path)

Floating UI (successor to Popper.js, ~3 kB gzipped) is the realistic production choice for React because it handles viewport collision detection across all browsers without requiring CSS anchor positioning support. This snippet is complete and importable.

```jsx
// Requires: npm install @floating-ui/react
import {
  useFloating,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  offset,
  flip,
  shift,
  arrow,
} from "@floating-ui/react";
import { useRef, useState, cloneElement } from "react";

// Roll a lightweight reduced-motion hook — not exported from React or @floating-ui/react:
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  return reduced;
}

export function Tooltip({ content, children }) {
  const [open, setOpen] = useState(false);
  const arrowRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  const { refs, floatingStyles, context, middlewareData } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "top",
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
  });

  const hover   = useHover(context, { move: false, delay: { open: 300, close: 120 } });
  const focus   = useFocus(context);
  const dismiss = useDismiss(context);
  // role: "tooltip" — adds role="tooltip" to floating, aria-describedby to reference
  const role    = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover, focus, dismiss, role,
  ]);

  const arrowX = middlewareData.arrow?.x ?? 0;
  const arrowY = middlewareData.arrow?.y ?? 0;

  return (
    <>
      {/* Trigger — clone so we can spread ref + props onto any element */}
      {cloneElement(children, {
        ref: refs.setReference,
        ...getReferenceProps(),
      })}

      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              // Animate only when motion is allowed
              transition: reducedMotion
                ? "none"
                : "opacity 140ms cubic-bezier(0.16,1,0.3,1), transform 140ms cubic-bezier(0.16,1,0.3,1)",
              opacity: open ? 1 : 0,
              transform: open ? "translateY(0)" : "translateY(4px)",
              background: "#1f2335",
              color: "#e8e9ed",
              padding: "0.45rem 0.75rem",
              borderRadius: "0.375rem",
              fontSize: "0.8125rem",
              lineHeight: "1.5",
              border: "1px solid #2e3040",
              boxShadow: "0 4px 16px rgb(0 0 0 / 0.45)",
              maxWidth: "18rem",
              // Tooltip must not contain focusable children (APG), but pointer-events
              // must remain auto so the mouse can travel from trigger to tooltip
              // without premature dismissal (WCAG 1.4.13 Hoverable).
              pointerEvents: "auto",
            }}
            {...getFloatingProps()}
          >
            {content}
            {/* Arrow */}
            <div
              ref={arrowRef}
              aria-hidden="true"
              style={{
                position: "absolute",
                left: arrowX,
                top: arrowY,
                width: 8,
                height: 8,
                background: "#1f2335",
                transform: "rotate(45deg)",
                border: "1px solid #2e3040",
              }}
            />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

// Usage:
// <Tooltip content="Narrow results by status, date, or assignee">
//   <button type="button">Filter</button>
// </Tooltip>
```

## Variations

| Variant | Knob |
|---|---|
| **Tooltip** | `role="tooltip"` + `aria-describedby`; text-only, no interactive children; opens on hover + focus; never receives focus itself |
| **Toggletip** | Triggered by an explicit click/tap on an info button; opens and stays open until dismissed; works on touch; use `aria-expanded` on the trigger and `role="status"` or `aria-live` on the content container |
| **Popover hint** | `popover="hint"` + `role="tooltip"` + `aria-describedby`; browser handles Esc and light-dismiss; Chrome 133+; Interop 2026 target for cross-browser — progressive-enhance over a JS fallback |
| **Coachmark (single step)** | Spotlight overlay + step card; focus trap; `role="region"` on card; `aria-live="polite"` for announcement; no sequence, just draws attention to one feature |
| **Product tour (multi-step)** | Same as coachmark plus Back/Next/Skip controls, step counter, `aria-live` announcement on every step change, spotlight re-targets per step |
| **Contextual onboarding** | No overlay; a persistent inline banner or coach-strip that appears in the empty state or first-run experience without blocking interaction — least intrusive, best for complex workflows |

## Accessibility

### prefers-reduced-motion

For anything that moves, the reduced-motion path must be present in the actual code. Both vanilla examples above include it:

```css
@media (prefers-reduced-motion: no-preference) {
  .tour-card {
    opacity: 0;
    transform: translateY(8px);
    transition:
      opacity 200ms cubic-bezier(0.16, 1, 0.3, 1),
      transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .tour-card.is-active {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .tour-card { transition: none; }
}
```

For tooltip shimmer or entrance transitions: same pattern. Animate only `opacity` and `transform`; never `height`, `width`, or `top`/`left` (triggers layout). The reduced path makes the element appear instantly with no transition.

### Keyboard and focus

- **Tooltip trigger**: must be a native `<button>`, `<a>`, or an element with `tabindex="0"` — plain `<div>` and `<span>` without `tabindex` are invisible to keyboard users.
- **Tooltip content**: never in the tab order. If content needs to be interactive, switch to a disclosure or non-modal dialog.
- **Esc**: closes the tooltip and leaves focus on the trigger. Never moves focus.
- **Product tour**: focus must be trapped inside the step card while active; Tab and Shift+Tab cycle only through card buttons. Esc exits and returns focus to the launch trigger.
- **Focus return**: when any overlay (coachmark, tour) closes for any reason — Next→Done, Skip, Esc, outside click — focus returns to the element that opened it, not to `document.body`.

### Touch / pointer fallback

```css
/* Hover-triggered tooltips are not accessible on touchscreens.
   Only apply hover behaviour when the device supports hover. */
@media (hover: hover) and (pointer: fine) {
  .tip-trigger:hover [role="tooltip"] { visibility: visible; opacity: 1; }
}
```

On touch-only devices, expose the same information as visible inline text or use a toggletip pattern (tap to open, tap again or press Esc to close) rather than a hover tooltip.

### Screen-reader implications

- `role="tooltip"` is announced when the trigger receives focus — the browser reads the tooltip text because `aria-describedby` wires them. No `aria-live` region is needed on the tooltip itself; adding one would cause double-announcement.
- For coachmarks and tours, the step content is **not** automatically read when it appears because it is injected into a static container. You must update an `aria-live="polite"` region (as shown in the coachmark example) to announce new step content.
- `aria-atomic="true"` on the live region ensures the screen reader reads the full updated string, not just the changed portion, which prevents partial or confusing step announcements.
- The backdrop overlay (`aria-hidden="true"`) prevents screen readers from navigating into the dimmed background content while the tour is active.
- Do not use `aria-haspopup` on tooltip triggers — that attribute signals a specific set of popup roles (menu, listbox, tree, grid, dialog) and does not apply to tooltips.

### Contrast

The colours used in the code in this file:

- Tooltip text `#e8e9ed` on tooltip bg `#1f2335`: relative luminance ~0.826 vs ~0.015 → contrast ≈ **13.5:1** (AAA for normal text, AAA for large text).
- Trigger text `#e8e9ed` on trigger bg `#181b28`: relative luminance 0.825 vs 0.012 → contrast ≈ **13.4:1** (AAA).
- Tour card body text `#b0b3c1` on card bg `#1a1d2e`: relative luminance 0.462 vs 0.015 → contrast ≈ **7.7:1** (AAA).
- Muted meta text `#6b7280` on card bg `#1a1d2e`: relative luminance 0.169 vs 0.015 → contrast ≈ **3.1:1** — this is decorative step-counter text at 0.75rem uppercase tracking; treat as non-text if below 3:1, or bump colour to `#8b8fa8` (≈ 4.5:1) for AA compliance on small text. Example code uses `#6b7280` which is borderline — in production use `#8b8fa8`.

## Performance

- Tooltip visibility toggled via `visibility: hidden` / `opacity: 0` rather than `display: none` — keeps the element in the accessibility tree so `aria-describedby` can resolve the referenced id before the tooltip is open, and avoids layout recalculation on show.
- Animate only `opacity` and `transform` — both compositor-promoted, no layout or paint. Never animate `top`, `left`, `width`, `height`, or `max-height` for transitions.
- `will-change: transform, opacity` on the tooltip element is acceptable but should be removed after the transition ends to free GPU memory — use `transitionend` to clean it up, or omit it entirely for short transitions (< 200 ms) where the compositing cost outweighs the benefit.
- The coachmark `positionCard` function reads `getBoundingClientRect()` (forced layout) then writes `style.top`/`style.left`. Batch reads before writes; in the tour example this runs inside `requestAnimationFrame` to prevent forced-layout jank.
- Floating UI uses `ResizeObserver` internally for re-positioning — it does not poll. Bundle cost is approximately 3 kB gzipped for the full `@floating-ui/react` package.
- Avoid creating a new tooltip DOM node per hover — keep the tooltip in the DOM (hidden) and toggle its open state. Creating and destroying nodes on every hover produces unnecessary GC pressure on pages with many trigger elements.
- CSS anchor positioning (Chrome 125+, Firefox 132+, Safari 18.2+) removes the need for JavaScript positioning entirely for simple cases — no ResizeObserver, no `getBoundingClientRect`, no JS repositioning on scroll. Progressive-enhance: use it when available, fall back to Floating UI or manual JS for older browsers.

## Anti-slop

**The cliché (see `_slop-blocklist.md` → Copy, Motion):** A purple-to-pink gradient tooltip that says "Empower your workflow — unlock seamless collaboration" fades and slides up with `ease` at 300 ms, appears on every single icon on the page, and is built with `display: none` so keyboard users never encounter it. The tour fires on first login before the user has done anything, cannot be closed with Esc, and returns focus to `document.body` on close.

**The tasteful alternative:**

- Write copy that answers "what does this do?" in plain, concrete terms: "Delete this pipeline — this cannot be undone" rather than "Remove item". If the tooltip copy could describe any button on any product, it is not doing its job.
- Trigger the tour after the user has taken their first meaningful action ("You just connected your first source — here is what to do next"), not on cold login.
- Reserve coachmarks for one or two features per release, not every new UI element. If everything is highlighted, nothing is.
- Use the expo-out easing `cubic-bezier(0.16, 1, 0.3, 1)` — it reads considerably more intentional than the default `ease` or `ease-in-out`.
- Tooltips that appear on every icon signal that the icon vocabulary is broken. The fix is better icons or visible labels, not more tooltips.

## Pairs well with

- `empty-states` — first-run empty states are a natural trigger point for contextual coachmarks: the user is already stopped, looking for orientation.
- `microcopy-ux-writing` — tooltip copy follows the same brevity rules as button labels and error messages; one clause, no filler adverbs.
- `toasts-and-notifications` — after a tour step completes an action (e.g., "Source connected"), a toast confirms success without requiring the tour card to handle it.
- `loading-and-skeletons` — if a step targets an element that is still loading, use a skeleton in the spotlight rather than showing an empty box; acknowledge the state.
- `error-and-validation-states` — contextual field hints (tooltip variant) live on the same element as validation error messages; define a priority rule so they never appear simultaneously.

## Current references

- [Tooltip Pattern — W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) — the authoritative keyboard interaction and ARIA spec; note the active task-force consensus caveat tracked in issue #128
- [ARIA: tooltip role — MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tooltip_role) — role spec, aria-describedby wiring, browser/AT support notes, and the "never use display:none" warning
- [Tooltips in the time of WCAG 2.1 — Sarah Higley](https://sarahmhigley.com/writing/tooltips-in-wcag-21/) — the definitive analysis of WCAG 1.4.13 (dismissible / hoverable / persistent) and why most library tooltips fail it
- [Popover="hint" — Chrome for Developers](https://developer.chrome.com/blog/popover-hint) — the 2025 `popover="hint"` type: stacking context, coexistence with auto popovers, Interop 2026 target
- [Tooltips and Toggletips — Heydon Pickering, Inclusive Components](https://inclusive-components.design/tooltips-toggletips/) — canonical distinction between tooltips and toggletips, ARIA role selection, keyboard and touch interaction requirements
- [Floating UI — tooltip recipe](https://floating-ui.com/docs/tooltip) — useHover, useFocus, useDismiss, useRole; the production JS positioning path with ~3 kB footprint
- [WCAG 2.2 Understanding — Pause, Stop, Hide (2.2.2)](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide) — normative WCAG guidance on stopping auto-advancing content including timer-based tour steps; intent, benefits, and sufficient techniques
- [Popover API — Smashing Magazine](https://www.smashingmagazine.com/2024/03/popover-api-css/) — popover="manual" for tooltips, automatic Esc handling, anchor positioning integration (2024)
- [Popover API — web.dev](https://web.dev/articles/popover-api) — canonical guide to popover types (auto, manual, hint), CSS-side usage, and anchor positioning integration
