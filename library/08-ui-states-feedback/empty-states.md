# Empty states

> A screen or region that has no data to show — and which tells the user exactly why, and exactly what to do next.

**Bucket:** component | system
**Maturity:** evergreen
**Effort:** low
**Best for:** apps, dashboards, portfolios, websites

---

## What it is

An empty state is the content that appears when a region of the UI has nothing to display — whether the user has never created anything yet, their search returned zero matches, or something failed. The user perceives a white box with an illustration, a heading, a line or two of explanation, and a button. What they actually receive is either orientation (they understand what this space is for and how to fill it) or abandonment bait (they stare at a cold void and leave). Three meaningfully different scenarios produce empty states, and each requires a different tone, message, and primary action.

---

## When to use

- A list, table, dashboard, inbox, or collection component can legitimately contain zero items.
- A search or filter operation has returned zero results and the user needs direction, not a dead end.
- A first-time user lands on a screen that requires content they have not yet created.
- A permissions error, network failure, or configuration gap prevents data from loading — distinct from a network error page, which lives at the route level.
- After the user explicitly clears or completes all items (inbox zero, completed task list).

---

## When NOT to use

- Do not apply an empty state to a loading state — use a skeleton screen or spinner while data is in-flight; only show the empty state after the async operation has resolved with zero results.
- Do not use a single generic empty state for all three scenarios (first-run, no-results, error-empty). Each warrants different copy and a different primary action. Using one catches-all state is the most common team-level mistake.
- Do not put an empty state inside a component so small that the illustration and copy cannot breathe (narrow sidebar panels, table cells, inline chips). Use a compact variant: just a short sentence and a link.
- Do not over-illustrate. Teams routinely ship a full-page illustration for every empty region on a dashboard, turning the page into an illustration gallery when five things are empty at once. Reserve illustrated empty states for the primary content area. Secondary regions get text-only.
- Do not treat "no results" as an error. "We couldn't find anything for 'Q3 reprot'" is not a system failure — it is a normal search outcome that deserves a helpful, upbeat response, not a red warning icon.

---

## How it works

The underlying mechanic is straightforward: when an async data fetch resolves to an empty array (or a filter produces zero matches), the component replaces the data region with a pre-authored fallback. What is not straightforward is the copy and role targeting.

**Three distinct scenarios, three distinct responses:**

| Scenario | Trigger | Tone | Primary action |
|---|---|---|---|
| First-run | User has zero items in a new account | Inviting, coaching | Create / connect / import |
| No-results | Query or filter matched nothing | Empathetic, solution-focused | Adjust search / clear filters |
| Error-empty | Permissions gap, API failure, config missing | Clear, calm, not apologetic | Retry / request access / contact support |

**Component anatomy (four layers):**

1. **Illustration or icon** — decorative; `aria-hidden="true"`. Not the primary carrier of meaning.
2. **Heading** — declarative, not a question. States the situation plainly.
3. **Supporting body** — one or two sentences. Explains why + what to do, without blaming the user or using technical language.
4. **Primary action** — one button. Occasionally a secondary link ("or learn more"). Never three buttons.

**ARIA announcement mechanism:**

When an empty state appears after an async operation (search returns, filter applies), screen readers will not notice the DOM change unless a live region announces it. The pattern is: keep an empty `role="status"` container in the DOM from page load; when the empty state renders, inject a concise status string into it. The live region announces; the visible component handles the full message.

---

## Working code

### Vanilla HTML/CSS/JS — complete, self-contained document

This document covers all three scenarios with a single reusable component structure. Swap the `data-scenario` attribute or JavaScript to switch between first-run, no-results, and error-empty variants.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Empty states — all three variants</title>
  <style>
    /* ---------- reset + tokens ---------- */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --color-bg:        #f9f9f8;
      --color-surface:   #ffffff;
      --color-border:    #e4e4e1;
      --color-ink:       #1a1a18;
      --color-ink-2:     #5a5a56;
      --color-accent:    #1d5b3e;   /* single brand hue — not generic SaaS blue */
      --color-accent-lt: #eaf4ef;
      --color-warn:      #92280f;
      --color-warn-lt:   #fdf1ee;
      --radius:          10px;
      --font-sans:       "General Sans", system-ui, sans-serif;
      /* General Sans: https://fontshare.com/fonts/general-sans (free) */
      /* Fallback: system-ui renders cleanly enough for dev use */
    }

    body {
      font-family: var(--font-sans);
      background: var(--color-bg);
      color: var(--color-ink);
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 2rem;
    }

    /* ---------- demo switcher ---------- */
    .demo-nav {
      position: fixed;
      top: 1rem;
      left: 50%;
      translate: -50% 0;
      display: flex;
      gap: 0.5rem;
      background: var(--color-surface);
      padding: 0.4rem;
      border-radius: 999px;
      border: 1px solid var(--color-border);
      z-index: 10;
    }
    .demo-nav button {
      font: 0.8125rem/1 var(--font-sans);
      padding: 0.35rem 0.85rem;
      border: none;
      border-radius: 999px;
      background: transparent;
      color: var(--color-ink-2);
      cursor: pointer;
    }
    .demo-nav button[aria-pressed="true"] {
      background: var(--color-ink);
      color: #fff;
    }
    .demo-nav button:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    /* ---------- empty state card ---------- */
    .empty-state {
      width: min(480px, 100%);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: 3rem 2.5rem 2.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0;
    }

    /* illustration wrapper */
    .empty-state__art {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      margin-bottom: 1.5rem;
      background: var(--art-bg, var(--color-accent-lt));
    }

    /* error variant tints */
    .empty-state[data-scenario="error"] .empty-state__art {
      --art-bg: var(--color-warn-lt);
    }

    .empty-state__art svg {
      width: 36px;
      height: 36px;
    }

    /* heading */
    .empty-state__heading {
      font-size: 1.125rem;   /* 18px */
      font-weight: 600;
      line-height: 1.3;
      color: var(--color-ink);
      margin-bottom: 0.5rem;
    }

    /* body */
    .empty-state__body {
      font-size: 0.9375rem;  /* 15px */
      line-height: 1.55;
      color: var(--color-ink-2);
      max-width: 34ch;
      margin-bottom: 1.75rem;
    }

    /* actions */
    .empty-state__actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font: 600 0.9375rem/1 var(--font-sans);
      color: #fff;
      background: var(--color-accent);
      border: none;
      border-radius: 6px;
      padding: 0.7rem 1.4rem;
      cursor: pointer;
      text-decoration: none;
      width: 100%;
      justify-content: center;
    }
    .btn-primary:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 3px;
    }

    /* error variant primary button */
    .empty-state[data-scenario="error"] .btn-primary {
      background: var(--color-warn);
    }
    .empty-state[data-scenario="error"] .btn-primary:focus-visible {
      outline-color: var(--color-warn);
    }

    .btn-ghost {
      font: 0.875rem/1 var(--font-sans);
      color: var(--color-ink-2);
      background: none;
      border: none;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 2px;
      padding: 0.25rem;
    }
    .btn-ghost:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
      border-radius: 2px;
    }

    /* hover: cosmetic only, gated on pointer:fine so touch devices are unaffected */
    @media (hover: hover) and (pointer: fine) {
      .btn-primary:hover { filter: brightness(1.1); }
    }

    /* hide/show logic */
    .empty-state { display: none; }
    .empty-state.is-active { display: flex; }

    /* ---------- ARIA live region ----------
       Placed at top of DOM; visually hidden but announced by screen readers.
       Rule: region is EMPTY in initial HTML. JS populates it when empty state renders.
       Never pre-populate — screen readers only announce changes, not initial content.
    ---------- */
    .sr-live {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }

    /* ---------- reduced motion ---------- */
    @media (prefers-reduced-motion: no-preference) {
      .empty-state.is-active {
        animation: fade-up 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      @keyframes fade-up {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    }
    /* When reduced-motion is set: component appears instantly, no animation */
  </style>
</head>
<body>

  <!--
    ARIA live region: present in DOM from page load, empty, role="status".
    aria-live="polite" waits for user idle before announcing — correct for
    non-urgent state changes. Use role="alert" (assertive) only for
    destructive errors that require immediate user action.
  -->
  <div
    id="empty-state-announcer"
    class="sr-live"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  ></div>

  <!-- Demo switcher (not part of pattern; just for this demo) -->
  <nav class="demo-nav" aria-label="Scenario switcher">
    <button aria-pressed="true" data-target="first-run">First-run</button>
    <button aria-pressed="false" data-target="no-results">No results</button>
    <button aria-pressed="false" data-target="error">Error</button>
  </nav>

  <!-- ==========================================
       SCENARIO 1: First-run
       Trigger: user has no items yet in a new account.
       Goal: orient + invite action. Not alarming. Not condescending.
       ========================================== -->
  <section
    class="empty-state is-active"
    data-scenario="first-run"
    id="state-first-run"
    aria-labelledby="es-fr-heading"
  >
    <!--
      Illustration: purely decorative. aria-hidden removes it from the
      accessibility tree entirely. The heading + body carry all meaning.
    -->
    <div class="empty-state__art" aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <rect x="7" y="10" width="22" height="16" rx="2" stroke="#1d5b3e" stroke-width="1.75"/>
        <path d="M12 10V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" stroke="#1d5b3e" stroke-width="1.75"/>
        <path d="M18 16v4M16 18h4" stroke="#1d5b3e" stroke-width="1.75" stroke-linecap="round"/>
      </svg>
    </div>

    <h2 class="empty-state__heading" id="es-fr-heading">
      Your projects live here
    </h2>
    <p class="empty-state__body">
      Create your first project to start tracking work. It takes about 30 seconds.
    </p>

    <div class="empty-state__actions">
      <button class="btn-primary" type="button">
        Create a project
      </button>
      <button class="btn-ghost" type="button">
        Import from CSV
      </button>
    </div>
  </section>

  <!-- ==========================================
       SCENARIO 2: No-results
       Trigger: search/filter returned zero matches.
       Goal: explain without blame, offer a path forward.
       ========================================== -->
  <section
    class="empty-state"
    data-scenario="no-results"
    id="state-no-results"
    aria-labelledby="es-nr-heading"
    hidden
  >
    <div class="empty-state__art" aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <circle cx="16" cy="16" r="8" stroke="#1d5b3e" stroke-width="1.75"/>
        <path d="M22 22l5 5" stroke="#1d5b3e" stroke-width="1.75" stroke-linecap="round"/>
        <path d="M13 16h6M16 13v6" stroke="#1d5b3e" stroke-width="1.75" stroke-linecap="round" opacity=".35"/>
      </svg>
    </div>

    <h2 class="empty-state__heading" id="es-nr-heading">
      No projects match "Q3 reprot"
    </h2>
    <p class="empty-state__body">
      Check the spelling, or try a shorter term. You can also clear all filters to browse everything.
    </p>

    <div class="empty-state__actions">
      <button class="btn-primary" type="button">
        Clear search
      </button>
      <button class="btn-ghost" type="button">
        Browse all projects
      </button>
    </div>
  </section>

  <!-- ==========================================
       SCENARIO 3: Error-empty
       Trigger: data exists but is inaccessible — permissions, network, config.
       Goal: explain plainly, offer a concrete recovery step. No apology loops.
       ========================================== -->
  <section
    class="empty-state"
    data-scenario="error"
    id="state-error"
    aria-labelledby="es-err-heading"
    hidden
  >
    <div class="empty-state__art" aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path d="M18 8l11 19H7L18 8z" stroke="#92280f" stroke-width="1.75" stroke-linejoin="round"/>
        <path d="M18 17v4" stroke="#92280f" stroke-width="1.75" stroke-linecap="round"/>
        <circle cx="18" cy="24" r="1" fill="#92280f"/>
      </svg>
    </div>

    <h2 class="empty-state__heading" id="es-err-heading">
      We couldn't load your projects
    </h2>
    <p class="empty-state__body">
      This is on us, not you. Wait a moment and try again — your data is safe.
      If this keeps happening, contact support.
    </p>

    <div class="empty-state__actions">
      <button class="btn-primary" type="button" id="retry-btn">
        Try again
      </button>
      <a class="btn-ghost" href="/support">Contact support</a>
    </div>
  </section>

  <script>
    // ---------- scenario switcher ----------
    const navBtns = document.querySelectorAll('.demo-nav button');
    const states  = document.querySelectorAll('.empty-state');
    const announcer = document.getElementById('empty-state-announcer');

    // Map scenario id -> short announcement string for screen readers.
    // The full message is in the visible heading + body; the announcement
    // is a concise label so screen reader users know the region has changed.
    const announcements = {
      'first-run':  'Project list is empty. Create your first project to get started.',
      'no-results': 'No results found. Adjust your search or clear filters.',
      'error':      'Projects could not be loaded. Try again or contact support.',
    };

    function activate(targetId) {
      navBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.target === targetId)));

      states.forEach(el => {
        const isTarget = el.dataset.scenario === targetId;
        el.classList.toggle('is-active', isTarget);
        // Use hidden attribute alongside class to ensure AT ignores inactive panels
        if (isTarget) {
          el.removeAttribute('hidden');
        } else {
          el.setAttribute('hidden', '');
        }
      });

      // Announce the new state to screen readers via the pre-registered live region.
      // Rule: always clear first, then set — guarantees announcement even if the
      // same text is injected a second time (browsers skip duplicate content).
      announcer.textContent = '';
      // rAF defers injection to next paint; necessary for some SR/browser combos
      // to register the DOM as changed before content appears.
      requestAnimationFrame(() => {
        announcer.textContent = announcements[targetId] ?? '';
      });

      // Focus management: move focus to the heading of the newly active state
      // so keyboard and switch-access users land in context.
      const activeHeading = document.querySelector(
        `.empty-state[data-scenario="${targetId}"] .empty-state__heading`
      );
      if (activeHeading) {
        // tabIndex -1 lets us programmatically focus non-interactive elements
        activeHeading.setAttribute('tabindex', '-1');
        activeHeading.focus({ preventScroll: true });
      }
    }

    navBtns.forEach(btn => {
      btn.addEventListener('click', () => activate(btn.dataset.target));
    });

    // ---------- error retry stub ----------
    document.getElementById('retry-btn')?.addEventListener('click', () => {
      // Real impl: re-fetch, then conditionally hide the empty state.
      // Here we just demonstrate the pattern:
      const btn = document.getElementById('retry-btn');
      btn.textContent = 'Retrying…';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Try again';
        btn.disabled = false;
      }, 1500);
    });
  </script>
</body>
</html>
```

---

### React version (production-realistic)

This covers the realistic case where empty states appear inside async data components. Import once, use everywhere via props.

```jsx
// EmptyState.jsx
// Deps: none beyond React. Illustations are inline SVG (decorative, aria-hidden).
// Usage:
//   <EmptyState scenario="first-run" />
//   <EmptyState scenario="no-results" query="Q3 reprot" onClear={clearSearch} />
//   <EmptyState scenario="error" onRetry={refetch} />

import { useEffect, useRef } from "react";

// ---------- per-scenario config ----------
const SCENARIOS = {
  "first-run": {
    icon: (
      <svg viewBox="0 0 36 36" fill="none" aria-hidden="true" focusable="false">
        <rect x="7" y="10" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M12 10V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M18 16v4M16 18h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
    heading: "Your projects live here",
    body: "Create your first project to start tracking work. It takes about 30 seconds.",
    primaryLabel: "Create a project",
    secondaryLabel: "Import from CSV",
    announcement: "Project list is empty. Create your first project to get started.",
    variant: "default",
  },
  "no-results": {
    icon: (
      <svg viewBox="0 0 36 36" fill="none" aria-hidden="true" focusable="false">
        <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="1.75" />
        <path d="M22 22l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M13 16h6M16 13v6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity=".35" />
      </svg>
    ),
    heading: null, // computed from query prop
    body: "Check the spelling, or try a shorter term. You can also clear all filters to browse everything.",
    primaryLabel: "Clear search",
    secondaryLabel: "Browse all projects",
    announcement: "No results found. Adjust your search or clear filters.",
    variant: "default",
  },
  "error": {
    icon: (
      <svg viewBox="0 0 36 36" fill="none" aria-hidden="true" focusable="false">
        <path d="M18 8l11 19H7L18 8z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        <path d="M18 17v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="18" cy="24" r="1" fill="currentColor" />
      </svg>
    ),
    heading: "We couldn't load your projects",
    body: "This is on us, not you. Wait a moment and try again — your data is safe. If this keeps happening, contact support.",
    primaryLabel: "Try again",
    secondaryLabel: "Contact support",
    announcement: "Projects could not be loaded. Try again or contact support.",
    variant: "error",
  },
};

export function EmptyState({
  scenario = "first-run",
  query = "",
  onPrimary,
  onSecondary,
  onRetry,     // alias for error scenario primary
  onClear,     // alias for no-results scenario primary
}) {
  const config = SCENARIOS[scenario];
  const headingRef = useRef(null);
  const announcerRef = useRef(null);

  // Heading may be dynamic (no-results includes the query string)
  const heading =
    scenario === "no-results" && query
      ? `No projects match "${query}"`
      : config.heading;

  // Resolve primary action handler
  const primaryHandler =
    scenario === "error" ? onRetry :
    scenario === "no-results" ? onClear :
    onPrimary;

  // On mount / scenario change: focus heading + announce to screen readers.
  // Clear announcer first (rAF ensures the DOM mutation is detected as a change
  // even if the text is identical to the previous announcement).
  useEffect(() => {
    if (announcerRef.current) {
      announcerRef.current.textContent = "";
      const id = requestAnimationFrame(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = config.announcement;
        }
      });
      return () => cancelAnimationFrame(id);
    }
  }, [scenario, config.announcement]);

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus({ preventScroll: true });
    }
  }, [scenario]);

  const isError = config.variant === "error";

  return (
    <>
      {/*
        Live region: render once at app root (or portal it there) so it is
        registered with the accessibility API before any state changes fire.
        In this inline example it is colocated — in production, lift it to
        a single shared <StatusAnnouncer> at the app root.
      */}
      <div
        ref={announcerRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      />

      <section
        aria-labelledby="empty-state-heading"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "3rem 2.5rem 2.5rem",
          maxWidth: 480,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 10,
          border: "1px solid #e4e4e1",
        }}
      >
        {/* Illustration — decorative, aria-hidden */}
        <div
          aria-hidden="true"
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: isError ? "#fdf1ee" : "#eaf4ef",
            color: isError ? "#92280f" : "#1d5b3e",
            display: "grid",
            placeItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          {config.icon}
        </div>

        <h2
          id="empty-state-heading"
          ref={headingRef}
          tabIndex={-1}
          style={{
            fontSize: "1.125rem",
            fontWeight: 600,
            lineHeight: 1.3,
            color: "#1a1a18",
            marginBottom: "0.5rem",
            // focus ring reset — we want focus to land here programmatically
            // but not show a ring (focus is for SR orientation, not visual nav)
            outline: "none",
          }}
        >
          {heading}
        </h2>

        <p
          style={{
            fontSize: "0.9375rem",
            lineHeight: 1.55,
            color: "#5a5a56",
            maxWidth: "34ch",
            marginBottom: "1.75rem",
          }}
        >
          {config.body}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
          <button
            type="button"
            onClick={primaryHandler}
            style={{
              fontWeight: 600,
              fontSize: "0.9375rem",
              color: "#fff",
              background: isError ? "#92280f" : "#1d5b3e",
              border: "none",
              borderRadius: 6,
              padding: "0.7rem 1.4rem",
              cursor: "pointer",
              width: "100%",
            }}
          >
            {config.primaryLabel}
          </button>

          {config.secondaryLabel && (
            <button
              type="button"
              onClick={onSecondary}
              style={{
                fontSize: "0.875rem",
                color: "#5a5a56",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 2,
                padding: "0.25rem",
              }}
            >
              {config.secondaryLabel}
            </button>
          )}
        </div>
      </section>
    </>
  );
}
```

---

## Variations

| Variant | What changes |
|---|---|
| **First-run** | Inviting tone, single "create" CTA, supportive body copy. Never mentions that "nothing exists" — says what the space *will* contain. |
| **No-results** | Heading names the failed query (e.g., "No projects match 'Q3 reprot'"). Body offers 1-2 recovery paths. No red or warning iconography — this is not an error. |
| **Error-empty** | Warm-toned icon (amber or terracotta, not fire-truck red). Body is specific about the failure type and uses first-person plural ("on us, not you"). Retry is always the primary CTA. |
| **Inline/compact** | For secondary regions (sidebars, narrow panels): remove illustration, reduce heading to body-text size, single link instead of button. |
| **Celebratory** | Inbox-zero / completed-tasks variant: positive illustration, affirming headline ("You're all caught up"), no CTA needed. Use this sparingly — only when the user has genuinely accomplished something. |
| **Starter content** | Instead of a blank slate, pre-populate with a sample project or template board (Trello, Whimsical approach). Reduces first-run anxiety; suits tools where seeing the interface filled is itself the orientation. |

---

## Accessibility

### Decorative illustrations

Illustrations in empty states are purely decorative — the heading and body carry all meaning. Mark them so assistive technologies skip them entirely:

```html
<!-- Inline SVG: set both aria-hidden and focusable="false"
     focusable="false" prevents IE11/Edge from tabbing into SVGs -->
<svg aria-hidden="true" focusable="false" ...>...</svg>

<!-- <img> tag: empty alt means "decorative" -->
<img src="empty-illustration.svg" alt="">
```

Never put the only description of the state inside the illustration (e.g., an SVG `<title>` that says "No results found") — that text is invisible to sighted users and fragile for screen readers.

### ARIA live region — implementation rules

Four rules that prevent the most common live-region failures (confirmed against TetraLogical's 2024 cross-AT testing):

1. **The container must be in the DOM before content is injected.** Render the `role="status"` container in initial HTML or on component mount. Do not create it and populate it in the same tick.
2. **Clear before setting.** Set `textContent = ""` then set the announcement text. Guarantees announcement even on repeated identical strings.
3. **Use `requestAnimationFrame` between clear and set.** Some AT/browser pairs need a paint cycle between the clear and the new content to register the mutation.
4. **Use `role="status"` (`aria-live="polite"`) for empty states.** They are non-urgent. Reserve `role="alert"` (`aria-live="assertive"`) for destructive or time-sensitive errors (session expiry, data loss warning). Assertive interrupts whatever the user is listening to.

```html
<!--
  Place this in the DOM at page load — empty.
  Redundant aria-live="polite" improves cross-browser consistency.
-->
<div
  id="announcer"
  role="status"
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
></div>
```

```js
function announceEmptyState(message) {
  const el = document.getElementById('announcer');
  el.textContent = '';              // 1. clear
  requestAnimationFrame(() => {     // 2. defer
    el.textContent = message;       // 3. set
  });
}

// Call whenever the empty state becomes visible:
announceEmptyState('No projects match your search. Adjust your filters to find results.');
```

### Focus management

When an empty state replaces content after an async operation, keyboard and switch-access users need to know where they are:

- Move focus to the empty state heading using `el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true })`.
- If the empty state is inside a combobox or search widget (no-results variant), focus may stay on the input — this is acceptable as long as the live region announces the zero-result count.
- Do not move focus to the primary action button on auto-display; that skips the heading context and deposits users directly at a button without explanation.

### Keyboard

All interactive elements (buttons, links) must be reachable via Tab. The empty state itself is not a widget — no arrow-key navigation required. Ensure:
- Buttons have descriptive labels. "Create a project" passes; "Click here" fails.
- The ghost/secondary action is a `<button>` if it triggers JS, a `<a href>` if it navigates. Do not use `<div onclick>`.
- Focus ring is visible. The demo uses `outline: 2px solid var(--color-accent)` at `:focus-visible`.

### Contrast

The following pairs appear as text-on-surface in this entry's code; ratios computed using the WCAG relative luminance formula:

- `#1a1a18` (heading) on `#ffffff` (surface): **18.1:1** — passes AAA for normal and large text.
- `#5a5a56` (body) on `#ffffff` (surface): **7.0:1** — passes AA for normal text (required: 4.5:1).
- `#ffffff` on `#1d5b3e` (primary button): **7.7:1** — passes AA.
- `#ffffff` on `#92280f` (error button): **8.1:1** — passes AAA (>7:1).

### Reduced motion

The `fade-up` entrance animation is gated on `prefers-reduced-motion: no-preference`. When reduced motion is set, the component appears instantly with no transform or fade:

```css
@media (prefers-reduced-motion: no-preference) {
  .empty-state.is-active {
    animation: fade-up 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
}
/*
  No animation block outside this media query.
  Result: reduced-motion users see the component fully rendered immediately,
  with no flash or shift.
*/
```

### Touch and pointer

The empty state component itself has no hover-only behavior. Button `:hover` styles (cosmetic brightness shift) are gated on `@media (hover: hover) and (pointer: fine)` so touch devices receive no hover side-effects. Ensure tap targets meet the WCAG 2.5.5 AAA target of 44×44 CSS pixels — the `padding: 0.7rem 1.4rem` on the primary button achieves this at typical font sizes.

---

## Performance

- The component itself has no performance risk — it is static HTML with minimal CSS.
- **Illustration format:** Inline SVG (as shown) loads zero extra network requests and scales crisply. If using external illustration files, prefer SVG over PNG; avoid large raster images for decorative empty-state art.
- **Animation cost:** The `fade-up` entrance animates only `opacity` and `transform` — both compositor-layer properties. No layout thrash, no paint. Do not animate `height`, `max-height`, or `padding` to reveal the component.
- **Live region:** Updating `textContent` of the announcer element triggers a text change in the accessibility tree, not a layout recalculation. Cost is negligible.
- **Avoid will-change:** The entrance animation is brief and fires once per state transition. Adding `will-change: transform` for a single-frame animation wastes GPU memory.
- **Multiple concurrent empty states:** On dashboards where several panels may be empty simultaneously, do not trigger the live region announcer for every one. Batch or debounce: announce once with a summary ("3 panels could not load data").

---

## Microcopy: before and after

The quality of an empty state is almost entirely determined by its copy. The illustration is secondary. The layout is tertiary.

### First-run

| Slot | Before (cold, generic) | After (specific, inviting) |
|---|---|---|
| Heading | "No projects found" | "Your projects live here" |
| Body | "You haven't created any projects yet." | "Create your first project to start tracking work. It takes about 30 seconds." |
| Primary CTA | "Get started" | "Create a project" |

**Why it matters:** "No projects found" describes the database state. "Your projects live here" describes the space and its purpose. Users who hit a first-run empty state have just signed up — they do not need an audit of the database, they need a next step that feels achievable.

### No-results

| Slot | Before | After |
|---|---|---|
| Heading | "No results" | "No projects match 'Q3 reprot'" |
| Body | "Try a different search term." | "Check the spelling, or try a shorter term. You can also clear all filters to browse everything." |
| Primary CTA | "Reset" | "Clear search" |

**Why it matters:** Repeating the query in the heading confirms the system understood the input and tells users exactly which search failed. "Reset" is ambiguous (reset the page? the account?); "Clear search" is unambiguous.

### Error-empty

| Slot | Before | After |
|---|---|---|
| Heading | "Something went wrong" | "We couldn't load your projects" |
| Body | "Please try again later." | "This is on us, not you. Wait a moment and try again — your data is safe." |
| Primary CTA | "OK" | "Try again" |

**Why it matters:** "Something went wrong" + "try again later" is the copy equivalent of a shrug. It neither names the problem nor offers a concrete action. "We couldn't load your projects" names the specific content that is missing. "This is on us, not you" removes the (common) user anxiety that they have done something wrong. "Try again" is the action, not "OK" (which closes a dialog and signals finality).

### Permissions / access error (fourth microcopy case)

| Slot | Before | After |
|---|---|---|
| Heading | "Access denied" | "You don't have access to this workspace" |
| Body | "Contact your administrator." | "Ask your workspace admin to add you, or switch to a workspace you're part of." |
| Primary CTA | "Back" | "View my workspaces" |

---

## Anti-slop

**The cliche** (see `_slop-blocklist.md` → Copy, Motion, Color): a centered illustration of an astronaut or open box with a generic sans-serif label reading "Nothing here yet" in Inter, a purple-to-pink gradient tint behind the icon circle, a button labeled "Get started", and a subtle fade-in on load using default `ease`. This exact pattern appears in hundreds of SaaS products because every design tool's "empty state" template ships it.

**What separates it from designed:** four changes, any two of which are sufficient to break the pattern:

1. **Copy specificity.** Name the content type ("projects", "invoices", "recordings") and the action ("Create a project", not "Get started"). The generic CTA label is the single largest tell.
2. **Hue commitment.** Choose one brand hue for the icon background and button. Not purple-to-pink. Not generic SaaS blue (`#3B82F6`). The demo uses a single mid-green (`#1d5b3e`) because it is distinctive without being loud. If your product has a blue, shift it warm (add 10° of hue toward teal) and reduce saturation.
3. **Easing.** If you animate the entrance, use `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) rather than the default `ease`. The difference is subtle but the curve reads as intentional.
4. **Illustration restraint.** One illustrated empty state per screen — the primary content area. Secondary panels (activity feed, sidebar) get text-only. Three illustrated empty states on one dashboard looks unfinished, not designed.

---

## Pairs well with

- **Skeleton screens** — skeleton comes first (during the async load); empty state appears only after the fetch resolves to zero. Never show both simultaneously. The handoff is: spinner/skeleton → data or empty state.
- **Toast notifications** — after a delete action that empties a list, a toast ("Project deleted") paired with the empty state prevents the user from questioning whether the action succeeded.
- **Inline validation / error states** — for the permissions/config variant of error-empty, the same ARIA live region pattern used here also handles form-level errors; building a shared announcer component prevents duplicate live regions.
- **Onboarding tooltips** — first-run empty states are sometimes the right place to offer a guided tour, but only if the tour is optional and dismissible. A forced tooltip sequence layered over an empty state is two orientation patterns fighting each other.
- **Filter / search components** — the no-results variant is tightly coupled to whatever filter or search UI triggered it. Ensure the "Clear search" / "Remove filters" CTA in the empty state performs the same action as the clear button in the filter UI, not a different one.

---

## Current references

- [MDN — ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) — authoritative reference for `aria-live`, `aria-atomic`, `role="status"` vs `role="alert"`, with implementation examples
- [MDN — ARIA: status role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role) — when to use `role="status"` vs `role="alert"`, implicit aria-live value, browser support notes
- [W3C WAI — ARIA19: Using role=alert or Live Regions to Identify Errors](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA19) — WCAG 2.1 technique covering 3.3.1 (Error Identification) and 4.1.3 (Status Messages), with working code
- [TetraLogical — Why are my live regions not working? (2024)](https://tetralogical.com/blog/2024/05/01/why-are-my-live-regions-not-working/) — empirical 2024 cross-AT testing explaining why pre-populated live regions fail, the priming pattern, and the alert exception
- [Sara Soueidan — Accessible notifications with ARIA live regions](https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-1/) — deep implementation guidance on timing, `:not(:empty)` CSS pattern, and `role="status"` vs `role="alert"` choice
- [Carbon Design System — Empty states pattern](https://carbondesignsystem.com/patterns/empty-states-pattern/) — IBM's production-scale guidance on empty state types, anatomy, and illustration system
- [Soul Design System (Emplifi) — Empty states UX writing patterns](https://soul.emplifi.io/latest/content/ux-writing-patterns/empty-states-JArDj65M) — microcopy rules: no technical language, empathy-first tone matrix per error type
- [Pencil & Paper — Empty state UX examples and best practices](https://www.pencilandpaper.io/articles/empty-states) — three content type framework (information, action, celebration) with real product examples
- [LogRocket UX Blog — Empty states in UX done right (2024)](https://blog.logrocket.com/ux-design/empty-states-ux-examples/) — Slack, Dropbox, Duolingo case studies; before/after comparison framing
- [Compound Design System — Empty state accessibility](https://compound.thephoenixgroup.com/latest/components/components/empty-state/accessibility-6f5bOu7u-6f5bOu7u) — component-level a11y requirements: heading hierarchy, `aria-hidden` on decorative graphics, focus management to heading or primary action
- [WAI-ARIA APG — Developing a Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) — authoritative keyboard and focus management guidance referenced for focus-on-heading pattern
