# Progress and steppers

> Visual indicators that show how far through a measured or sequential task the user is — from a single filling bar to a multi-step wizard that gates forward movement on valid input.

**Bucket:** component
**Maturity:** evergreen
**Effort:** medium
**Best for:** apps, dashboards, onboarding flows, checkout, account setup, multi-step forms

## What it is

A progress bar communicates completion of a continuous task (uploading a file, running a build) using a filled track whose width maps to the percentage done. A stepper renders that same idea as a discrete sequence of named stages — each step is either complete, active, or pending — and pairs the indicator with back/next navigation that validates the current step before advancing. Users perceive progress bars as a time estimate ("I can leave and come back") and steppers as a map ("I know where I am and where I'm going"). Both patterns reduce abandonment by answering the two anxiety questions: *how long will this take* and *what comes next*.

## When to use

- File uploads, exports, or build processes where elapsed vs. total is measurable — use a determinate bar.
- Any action that exceeds roughly 3 seconds with no visible change on screen — even an indeterminate bar is better than a frozen interface.
- Multi-field forms where grouping inputs by stage reduces cognitive load (account creation, shipping + payment + review checkout, onboarding profile setup).
- Flows where later steps depend on earlier input (you cannot select a delivery date before entering an address).
- Processes where users need an escape hatch: back navigation without losing already-entered data.

## When NOT to use

- Single screens with only 2-3 inputs — a stepper adds chrome that costs more in reading time than the form itself.
- Tasks that complete in under 2 seconds — a flash of a progress bar followed by instant completion disorients more than it reassures. Skip it or use a brief spinner.
- When you cannot measure progress — do not fake a determinate bar with a fixed animation; use indeterminate instead. Faking it erodes trust when the bar freezes at 95%.
- As primary site navigation — everyone overuses steppers for "product tour tabs" that are really just horizontal navigation. If the user can visit any section freely, it is navigation, not a stepper.
- For decorative achievement/skill bars on portfolios (see Anti-slop below).

## How it works

**Progress bar:** a track element (or `<progress>`) has a filled region whose inline-size is set to `(valuenow / valuemax) * 100%`. CSS `transition: width` or `transform: scaleX()` animates the fill — `scaleX()` is compositor-safe and avoids layout thrash. For indeterminate state, omit the value; an infinite CSS animation sweeps a partial fill back and forth. The native `<progress>` element handles both states automatically when `value` is present or absent.

**Stepper:** an ordered list (`<ol>`) where each `<li>` represents a stage. The active step gets `aria-current="step"` on its list item (or its anchor/button child). A connector line between circles is drawn with a pseudo-element — `flex: 1` distributes them evenly without magic numbers. Step content panels swap via `hidden` attribute (or a display toggle); focus is explicitly moved to the new panel's heading on transition. An `aria-live="polite"` region announces the new step name to screen readers without interrupting ongoing speech.

Key properties and attributes:

| Element | Attribute | Purpose |
|---|---|---|
| `<progress>` | `value` / `max` | determinate fill; omit `value` for indeterminate |
| `[role="progressbar"]` | `aria-valuenow` | current value (omit when indeterminate) |
| `[role="progressbar"]` | `aria-valuemin` / `aria-valuemax` | range boundaries (default 0/100) |
| `[role="progressbar"]` | `aria-valuetext` | human string e.g. "Step 2 of 4" or "14 MB of 50 MB" |
| `[role="progressbar"]` | `aria-label` / `aria-labelledby` | required accessible name |
| step `<li>` | `aria-current="step"` | marks the active step for screen readers |
| step panel | `aria-live="polite"` | announces step change without interrupting |

## Working code

### 1. Native determinate + indeterminate progress bar (vanilla HTML/CSS)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Progress bar — determinate and indeterminate</title>
  <style>
    /* ── Reset & tokens ─────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --track-bg:   #e5e7eb;  /* gray-200  */
      --fill-color: #4f46e5;  /* indigo-600 — #ffffff on it: 6.29:1 ✓ */
      --fill-done:  #166534;  /* green-800 — on #fafaf9: 6.83:1 ✓ */
      --fill-error: #b91c1c;  /* red-700   — on #fafaf9: 6.19:1 ✓ */
      --text:       #1c1917;  /* stone-900 — on #fafaf9: 16.74:1 ✓ */
      --subtext:    #44403c;  /* stone-700 — on #fafaf9: 9.84:1 ✓ */
      --page-bg:    #fafaf9;  /* stone-50  */
      --radius:     9999px;
      --track-h:    8px;
    }

    body {
      font-family: system-ui, sans-serif;
      background: var(--page-bg);
      color: var(--text);
      padding: 3rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
      max-width: 480px;
    }

    /* ── Progress track wrapper ─────────────────────────────────── */
    .prog-wrap { display: flex; flex-direction: column; gap: 0.5rem; }

    .prog-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--subtext);
      display: flex;
      justify-content: space-between;
    }

    /* ── Custom progress track ──────────────────────────────────── */
    .track {
      height: var(--track-h);
      background: var(--track-bg);
      border-radius: var(--radius);
      overflow: hidden;
      position: relative;
    }

    .fill {
      height: 100%;
      border-radius: var(--radius);
      background: var(--fill-color);
      transform-origin: left center;
      /* Use scaleX — compositor-only, no layout thrash */
      transform: scaleX(var(--pct, 0));
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* ── Indeterminate animation ────────────────────────────────── */
    .fill[data-indeterminate] {
      width: 40%;
      transform: none;
      animation: sweep 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes sweep {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }

    /* ── Reduced-motion overrides ───────────────────────────────── */
    @keyframes pulse-opacity {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }

    @media (prefers-reduced-motion: reduce) {
      .fill {
        transition: none;
      }
      .fill[data-indeterminate] {
        /* Static 50% fill with a pulsing opacity instead of motion */
        /* The sweep is cancelled because pulse-opacity replaces it as the animation-name */
        animation: pulse-opacity 2s ease-in-out infinite;
        width: 50%;
        transform: none;
      }
    }

    /* ── Native <progress> (styled cross-browser) ───────────────── */
    progress {
      appearance: none;
      -webkit-appearance: none;
      width: 100%;
      height: var(--track-h);
      border: none;
      border-radius: var(--radius);
      background: var(--track-bg);
      overflow: hidden;
    }
    progress::-webkit-progress-bar { background: var(--track-bg); }
    progress::-webkit-progress-value {
      background: var(--fill-done);
      border-radius: var(--radius);
      transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    progress::-moz-progress-bar {
      background: var(--fill-done);
      border-radius: var(--radius);
    }

    @media (prefers-reduced-motion: reduce) {
      progress::-webkit-progress-value { transition: none; }
    }

    /* ── Demo controls ──────────────────────────────────────────── */
    .controls { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    button {
      padding: 0.375rem 0.875rem;
      border: 1.5px solid #d1d5db;
      border-radius: 6px;
      background: #fff;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      color: var(--text);
    }
    button:hover { background: #f3f4f6; }
    button:focus-visible {
      outline: 2px solid var(--fill-color);
      outline-offset: 2px;
    }
  </style>
</head>
<body>

  <!-- 1. Custom determinate bar -->
  <div class="prog-wrap">
    <div class="prog-label">
      <span id="upload-label">Uploading report.pdf</span>
      <span id="upload-pct" aria-live="polite">0%</span>
    </div>
    <div class="track">
      <div
        class="fill"
        id="upload-fill"
        role="progressbar"
        aria-labelledby="upload-label"
        aria-valuenow="0"
        aria-valuemin="0"
        aria-valuemax="100"
        style="--pct: 0"
      ></div>
    </div>
  </div>

  <!-- 2. Indeterminate — value unknown -->
  <div class="prog-wrap">
    <div class="prog-label">
      <span id="gen-label">Generating your report</span>
      <span>Hang tight…</span>
    </div>
    <div class="track" aria-describedby="gen-label">
      <div
        class="fill"
        data-indeterminate
        role="progressbar"
        aria-labelledby="gen-label"
        aria-label="Generating your report"
      ></div>
    </div>
  </div>

  <!-- 3. Native <progress> element (semantic, recommended when styling allows) -->
  <div class="prog-wrap">
    <label for="import-prog">
      <span>Importing contacts</span>
    </label>
    <progress id="import-prog" value="62" max="100">62%</progress>
  </div>

  <!-- Demo controls -->
  <div class="controls">
    <button onclick="setProgress(25)">25%</button>
    <button onclick="setProgress(50)">50%</button>
    <button onclick="setProgress(75)">75%</button>
    <button onclick="setProgress(100)">Done</button>
    <button onclick="setProgress(0)">Reset</button>
  </div>

  <script>
    function setProgress(pct) {
      const fill = document.getElementById('upload-fill');
      const label = document.getElementById('upload-pct');
      fill.style.setProperty('--pct', pct / 100);
      fill.setAttribute('aria-valuenow', pct);
      // Announce the completion state, not just the percent
      label.textContent = pct === 100 ? 'Upload complete' : pct + '%';
      if (pct === 100) {
        fill.style.setProperty('--fill-color', 'var(--fill-done)');
        fill.style.background = 'var(--fill-done)';
      } else {
        fill.style.background = '';
      }
    }
  </script>
</body>
</html>
```

### 2. Multi-step wizard with per-step validation, focus management, and aria-live (vanilla JS)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Multi-step wizard</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --brand:      #4f46e5;  /* indigo-600 — #fff on it: 6.29:1 ✓ */
      --brand-ring: #c7d2fe;  /* indigo-200 */
      --done:       #166534;  /* green-800 — on #fafaf9: 6.83:1 ✓ */
      --done-bg:    #dcfce7;  /* green-100 */
      --pending:    #44403c;  /* stone-700 — on #fafaf9: 9.84:1 ✓ */
      --pending-bg: #e5e7eb;  /* gray-200 */
      --error:      #b91c1c;  /* red-700 — on #fafaf9: 6.19:1 ✓ */
      --text:       #1c1917;  /* stone-900 */
      --subtext:    #44403c;  /* stone-700 */
      --page-bg:    #fafaf9;  /* stone-50 */
      --border:     #d1d5db;
      --step-size:  2.25rem;
      --gap:        1rem;
    }

    body {
      font-family: system-ui, sans-serif;
      background: var(--page-bg);
      color: var(--text);
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 2rem 1rem;
    }

    .wizard {
      width: 100%;
      max-width: 520px;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.08), 0 4px 16px rgb(0 0 0 / 0.04);
    }

    /* ── Step indicator ──────────────────────────────────────────── */
    .step-nav {
      list-style: none;
      display: flex;
      align-items: flex-start;
      gap: 0;
      margin-bottom: 2rem;
    }

    .step-nav li {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      position: relative;
      gap: 0.375rem;
    }

    /* Connector line between circles */
    .step-nav li + li::before {
      content: '';
      position: absolute;
      top: calc(var(--step-size) / 2);
      right: 50%;
      left: calc(-50% + var(--step-size) / 2);
      height: 2px;
      background: var(--pending-bg);
      transition: background 0.3s ease;
      z-index: 0;
    }

    .step-nav li.complete + li::before {
      background: var(--brand);
    }

    @media (prefers-reduced-motion: reduce) {
      .step-nav li + li::before { transition: none; }
    }

    /* Step circle */
    .step-circle {
      width: var(--step-size);
      height: var(--step-size);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8125rem;
      font-weight: 700;
      position: relative;
      z-index: 1;
      background: var(--pending-bg);
      color: var(--pending);
      border: 2px solid transparent;
      transition: background 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                  color       0.25s cubic-bezier(0.16, 1, 0.3, 1),
                  border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @media (prefers-reduced-motion: reduce) {
      .step-circle { transition: none; }
    }

    li[aria-current="step"] .step-circle {
      background: var(--brand);
      color: #ffffff;
      border-color: var(--brand-ring);
      box-shadow: 0 0 0 3px var(--brand-ring);
    }

    li.complete .step-circle {
      background: var(--done-bg);
      color: var(--done);
      border-color: var(--done);
    }

    /* Checkmark for complete */
    li.complete .step-circle::after {
      content: '';
      display: block;
      width: 10px;
      height: 6px;
      border-left: 2.5px solid currentColor;
      border-bottom: 2.5px solid currentColor;
      transform: rotate(-45deg) translateY(-1px);
    }

    li.complete .step-circle span { display: none; }

    .step-name {
      font-size: 0.6875rem;
      font-weight: 600;
      text-align: center;
      color: var(--subtext);
      max-width: 5rem;
      line-height: 1.2;
    }

    li[aria-current="step"] .step-name { color: var(--brand); }
    li.complete .step-name { color: var(--done); }

    /* ── Screen-reader live region ───────────────────────────────── */
    .sr-live {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }

    /* ── Step panels ─────────────────────────────────────────────── */
    .step-panel { display: none; flex-direction: column; gap: 1.25rem; }
    .step-panel[data-active] { display: flex; }

    .step-panel h2 {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text);
    }

    /* ── Form elements ───────────────────────────────────────────── */
    .field { display: flex; flex-direction: column; gap: 0.375rem; }

    label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--subtext);
    }

    input, select {
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      font-size: 0.9375rem;
      color: var(--text);
      background: #fff;
      transition: border-color 0.15s;
    }

    input:focus, select:focus {
      outline: none;
      border-color: var(--brand);
      box-shadow: 0 0 0 3px var(--brand-ring);
    }

    input[aria-invalid="true"] {
      border-color: var(--error);
    }

    input[aria-invalid="true"]:focus {
      box-shadow: 0 0 0 3px #fecaca;
    }

    .field-error {
      font-size: 0.8125rem;
      color: var(--error);
      font-weight: 500;
      display: none;
    }

    .field-error[data-visible] { display: block; }

    /* ── Navigation buttons ──────────────────────────────────────── */
    .wizard-nav {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      margin-top: 1.75rem;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      border: 1.5px solid transparent;
      transition: opacity 0.15s, background 0.15s;
    }

    .btn:focus-visible {
      outline: 2px solid var(--brand);
      outline-offset: 2px;
    }

    .btn-secondary {
      background: #fff;
      border-color: var(--border);
      color: var(--subtext);
    }

    .btn-secondary:hover { background: #f3f4f6; }

    .btn-primary {
      background: var(--brand);
      color: #fff;
      margin-left: auto;
    }

    .btn-primary:hover { opacity: 0.88; }

    .btn[hidden] { display: none; }

    /* ── Summary panel ───────────────────────────────────────────── */
    .summary {
      background: #f3f4f6;
      border-radius: 8px;
      padding: 1rem;
      font-size: 0.875rem;
      line-height: 1.75;
      color: var(--subtext);
    }

    .summary strong { color: var(--text); }

    /* ── Success state ───────────────────────────────────────────── */
    .success-msg {
      text-align: center;
      padding: 1rem 0;
      color: var(--done);
      font-weight: 700;
      font-size: 1.125rem;
      display: none;
    }

    /* ── Responsive: stack label below on narrow screens ─────────── */
    @media (max-width: 360px) {
      .step-name { display: none; }
    }
  </style>
</head>
<body>

  <!-- Visually-hidden live region — announces step changes to screen readers -->
  <div class="sr-live" aria-live="polite" aria-atomic="true" id="step-announcer"></div>

  <div class="wizard" role="main">

    <!-- Step indicator (nav landmark with label) -->
    <nav aria-label="Account setup steps">
      <ol class="step-nav" id="step-nav">
        <li aria-current="step" id="nav-step-1">
          <div class="step-circle" aria-hidden="true"><span>1</span></div>
          <span class="step-name">Your info</span>
        </li>
        <li id="nav-step-2">
          <div class="step-circle" aria-hidden="true"><span>2</span></div>
          <span class="step-name">Password</span>
        </li>
        <li id="nav-step-3">
          <div class="step-circle" aria-hidden="true"><span>3</span></div>
          <span class="step-name">Review</span>
        </li>
      </ol>
    </nav>

    <!-- Step 1: Basic info -->
    <section
      class="step-panel"
      data-active
      id="panel-1"
      aria-labelledby="panel-1-heading"
      tabindex="-1"
    >
      <h2 id="panel-1-heading">What should we call you?</h2>

      <div class="field">
        <label for="first-name">First name</label>
        <input
          type="text"
          id="first-name"
          name="first-name"
          autocomplete="given-name"
          required
          aria-required="true"
          aria-describedby="first-name-err"
        >
        <span class="field-error" id="first-name-err" role="alert">
          Enter your first name.
        </span>
      </div>

      <div class="field">
        <label for="email">Work email</label>
        <input
          type="email"
          id="email"
          name="email"
          autocomplete="email"
          required
          aria-required="true"
          aria-describedby="email-err"
        >
        <span class="field-error" id="email-err" role="alert">
          Enter a valid email address — for example, you@company.com.
        </span>
      </div>
    </section>

    <!-- Step 2: Password -->
    <section
      class="step-panel"
      id="panel-2"
      aria-labelledby="panel-2-heading"
      tabindex="-1"
    >
      <h2 id="panel-2-heading">Create a password</h2>

      <div class="field">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          autocomplete="new-password"
          required
          aria-required="true"
          aria-describedby="password-hint password-err"
          minlength="10"
        >
        <span id="password-hint" style="font-size:0.8125rem;color:var(--subtext)">
          At least 10 characters.
        </span>
        <span class="field-error" id="password-err" role="alert">
          Choose a password with at least 10 characters.
        </span>
      </div>

      <div class="field">
        <label for="password-confirm">Confirm password</label>
        <input
          type="password"
          id="password-confirm"
          name="password-confirm"
          autocomplete="new-password"
          required
          aria-required="true"
          aria-describedby="password-confirm-err"
        >
        <span class="field-error" id="password-confirm-err" role="alert">
          Passwords don't match.
        </span>
      </div>
    </section>

    <!-- Step 3: Review -->
    <section
      class="step-panel"
      id="panel-3"
      aria-labelledby="panel-3-heading"
      tabindex="-1"
    >
      <h2 id="panel-3-heading">Looks good — confirm your details</h2>
      <div class="summary" id="review-summary"></div>
    </section>

    <!-- Success message (replaces nav on completion) -->
    <p class="success-msg" id="success-msg" role="status" aria-live="polite">
      Account created. Check your inbox to verify your email.
    </p>

    <!-- Navigation -->
    <div class="wizard-nav">
      <button class="btn btn-secondary" id="btn-back" hidden>Back</button>
      <button class="btn btn-primary" id="btn-next">Continue</button>
    </div>

  </div>

  <script>
    (function () {
      'use strict';

      const TOTAL_STEPS = 3;
      let current = 1;

      // DOM refs
      const announcer = document.getElementById('step-announcer');
      const btnBack   = document.getElementById('btn-back');
      const btnNext   = document.getElementById('btn-next');
      const successMsg = document.getElementById('success-msg');

      const stepLabels = ['Your info', 'Password', 'Review'];

      // ── Validation rules per step ───────────────────────────────
      function validateStep(step) {
        let valid = true;

        if (step === 1) {
          const firstName = document.getElementById('first-name');
          const email     = document.getElementById('email');
          const firstErr  = document.getElementById('first-name-err');
          const emailErr  = document.getElementById('email-err');

          const firstOk = firstName.value.trim().length > 0;
          const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());

          setFieldState(firstName, firstErr, firstOk);
          setFieldState(email, emailErr, emailOk);
          valid = firstOk && emailOk;

          if (!valid) {
            // Focus the first invalid field
            (!firstOk ? firstName : email).focus();
          }
        }

        if (step === 2) {
          const pw      = document.getElementById('password');
          const pwConf  = document.getElementById('password-confirm');
          const pwErr   = document.getElementById('password-err');
          const confErr = document.getElementById('password-confirm-err');

          const pwOk   = pw.value.length >= 10;
          const confOk = pw.value === pwConf.value && pwConf.value.length > 0;

          setFieldState(pw, pwErr, pwOk);
          setFieldState(pwConf, confErr, confOk);
          valid = pwOk && confOk;

          if (!valid) {
            (!pwOk ? pw : pwConf).focus();
          }
        }

        return valid;
      }

      function setFieldState(input, errEl, isValid) {
        input.setAttribute('aria-invalid', isValid ? 'false' : 'true');
        if (isValid) {
          errEl.removeAttribute('data-visible');
        } else {
          errEl.setAttribute('data-visible', '');
        }
      }

      // ── Populate review panel ───────────────────────────────────
      function populateReview() {
        const first = document.getElementById('first-name').value.trim();
        const email = document.getElementById('email').value.trim();
        document.getElementById('review-summary').innerHTML =
          `<strong>Name:</strong> ${escHtml(first)}<br>
           <strong>Email:</strong> ${escHtml(email)}<br>
           <strong>Password:</strong> ••••••••••`;
      }

      function escHtml(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }

      // ── Navigate between steps ──────────────────────────────────
      function goTo(next) {
        const prev = current;

        // Update nav indicators
        const prevLi = document.getElementById('nav-step-' + prev);
        const nextLi = document.getElementById('nav-step-' + next);

        prevLi.removeAttribute('aria-current');
        if (next > prev) prevLi.classList.add('complete');
        else             prevLi.classList.remove('complete');

        if (nextLi) {
          nextLi.setAttribute('aria-current', 'step');
        }

        // Swap panels
        const prevPanel = document.getElementById('panel-' + prev);
        const nextPanel = document.getElementById('panel-' + next);
        prevPanel.removeAttribute('data-active');
        nextPanel.setAttribute('data-active', '');

        // Move focus to the new panel heading (focus management)
        nextPanel.focus();

        // Announce step change to screen readers
        const label = stepLabels[next - 1];
        announcer.textContent = `Step ${next} of ${TOTAL_STEPS}: ${label}`;

        // Clear announcement after a tick so repeat navigation re-fires
        setTimeout(() => { announcer.textContent = ''; }, 1500);

        current = next;

        // Populate review when reaching it
        if (next === 3) populateReview();

        // Update buttons
        btnBack.hidden = (current === 1);
        btnNext.textContent = current === TOTAL_STEPS ? 'Create account' : 'Continue';
      }

      // ── Button handlers ─────────────────────────────────────────
      btnNext.addEventListener('click', () => {
        if (current < TOTAL_STEPS) {
          if (!validateStep(current)) return;
          goTo(current + 1);
        } else {
          // Final submit
          submit();
        }
      });

      btnBack.addEventListener('click', () => {
        if (current > 1) goTo(current - 1);
      });

      function submit() {
        // Hide wizard chrome, show success
        document.getElementById('step-nav').hidden = true;
        document.querySelector('.step-panel[data-active]').hidden = true;
        document.querySelector('.wizard-nav').hidden = true;
        successMsg.style.display = 'block';
        successMsg.focus();
      }

      // Keyboard: Enter on inputs advances if on last field of step
      document.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            btnNext.click();
          }
        });
      });
    })();
  </script>
</body>
</html>
```

### 3. React stepper (realistic production choice)

```jsx
import { useState, useRef, useEffect, useId } from 'react';

// ── Tokens ────────────────────────────────────────────────────────
const TOKEN = {
  brand:   '#4f46e5', // indigo-600 — #fff on it: 6.29:1 ✓
  done:    '#166534', // green-800  — on #fafaf9: 6.83:1 ✓
  doneBg:  '#dcfce7',
  pending: '#44403c', // stone-700  — on #fafaf9: 9.84:1 ✓
  pendBg:  '#e5e7eb',
  error:   '#b91c1c', // red-700    — on #fafaf9: 6.19:1 ✓
  text:    '#1c1917',
  bg:      '#fafaf9',
};

// ── Individual step circle ─────────────────────────────────────────
function StepCircle({ index, label, status, reduceMotion = false }) {
  // status: 'complete' | 'active' | 'pending'
  const isComplete = status === 'complete';
  const isActive   = status === 'active';

  const bg    = isComplete ? TOKEN.doneBg : isActive ? TOKEN.brand : TOKEN.pendBg;
  const color = isComplete ? TOKEN.done   : isActive ? '#fff'      : TOKEN.pending;

  return (
    <li
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', gap: '0.375rem' }}
      aria-current={isActive ? 'step' : undefined}
    >
      {/* SR-only state — sighted users see color; SR users hear "completed" / "current" */}
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {isComplete ? `${label}, completed` : isActive ? `${label}, current step` : `${label}, not yet started`}
      </span>
      <div
        aria-hidden="true"
        style={{
          width: '2.25rem', height: '2.25rem', borderRadius: '50%',
          background: bg, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8125rem', fontWeight: 700,
          border: isActive ? `2px solid #c7d2fe` : '2px solid transparent',
          boxShadow: isActive ? '0 0 0 3px #c7d2fe' : 'none',
          position: 'relative', zIndex: 1,
          // Suppress transition when user prefers reduced motion
          transition: reduceMotion ? 'none' : 'background 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {isComplete ? (
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
            <path d="M1 4L4.5 7.5L11 1" stroke={TOKEN.done} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : index + 1}
      </div>
      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: isActive ? TOKEN.brand : TOKEN.pending, textAlign: 'center' }} aria-hidden="true">
        {label}
      </span>
    </li>
  );
}

// ── Progress bar sub-component ─────────────────────────────────────
function ProgressBar({ value, max = 100, label, indeterminate = false, reduceMotion = false }) {
  const labelId = useId();
  const pct = indeterminate ? null : Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600, color: TOKEN.pending }}>
        <span id={labelId}>{label}</span>
        {!indeterminate && <span aria-live="polite">{pct === 100 ? 'Complete' : `${Math.round(pct)}%`}</span>}
      </div>
      <div
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuenow={indeterminate ? undefined : Math.round(pct)}
        aria-valuemin={indeterminate ? undefined : 0}
        aria-valuemax={indeterminate ? undefined : 100}
        aria-label={indeterminate ? label : undefined}
        style={{
          height: 8, borderRadius: 9999,
          background: '#e5e7eb', overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{
          height: '100%',
          borderRadius: 9999,
          background: pct === 100 ? TOKEN.done : TOKEN.brand,
          transformOrigin: 'left center',
          // scaleX is compositor-safe
          transform: indeterminate ? undefined : `scaleX(${(pct ?? 0) / 100})`,
          // Indeterminate sweep via CSS keyframes defined in <style> below
          // reduceMotion: swap sweep for opacity pulse (non-vestibular)
          animation: indeterminate
            ? (reduceMotion
                ? 'pb-fade 2s ease-in-out infinite'
                : 'pb-sweep 1.4s cubic-bezier(0.4,0,0.6,1) infinite')
            : 'none',
          width: indeterminate ? (reduceMotion ? '50%' : '40%') : '100%',
          // Suppress transition when user prefers reduced motion or bar is indeterminate
          transition: indeterminate || reduceMotion ? 'none' : 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
    </div>
  );
}

// ── Main wizard ────────────────────────────────────────────────────
const STEPS = ['Your info', 'Password', 'Review'];

export default function AccountWizard() {
  const [step, setStep]         = useState(0);
  const [complete, setComplete] = useState(false);
  const [fields, setFields]     = useState({ name: '', email: '', pw: '', pwc: '' });
  const [errors, setErrors]     = useState({});
  const [announced, setAnnounced] = useState('');

  const panelRef = useRef(null);
  const announceId = useId();

  // Prefer reduced motion
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Move focus to panel heading on step change
  useEffect(() => {
    if (panelRef.current) panelRef.current.focus();
  }, [step]);

  // Announce step change
  useEffect(() => {
    setAnnounced(`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`);
    const t = setTimeout(() => setAnnounced(''), 1500);
    return () => clearTimeout(t);
  }, [step]);

  function validate(s) {
    const e = {};
    if (s === 0) {
      if (!fields.name.trim()) e.name = 'Enter your name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email = 'Enter a valid email — for example, you@company.com.';
    }
    if (s === 1) {
      if (fields.pw.length < 10) e.pw = 'Choose a password with at least 10 characters.';
      if (fields.pw !== fields.pwc) e.pwc = "Passwords don't match.";
    }
    return e;
  }

  function next() {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else setComplete(true);
  }

  function back() {
    setErrors({});
    setStep(s => s - 1);
  }

  if (complete) {
    return (
      <div role="status" aria-live="polite" style={{ padding: '2rem', textAlign: 'center', color: TOKEN.done, fontWeight: 700, fontSize: '1.125rem' }}>
        Account created. Check your inbox to verify your email.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', background: '#fff', borderRadius: 12, padding: '2rem', border: '1px solid #d1d5db' }}>
      {/* SR live region */}
      <div id={announceId} aria-live="polite" aria-atomic="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {announced}
      </div>

      {/* Step indicator */}
      <nav aria-label="Account setup progress" style={{ marginBottom: '2rem' }}>
        <ol style={{ display: 'flex', listStyle: 'none', gap: 0 }}>
          {STEPS.map((label, i) => (
            <StepCircle
              key={label}
              index={i}
              label={label}
              status={i < step ? 'complete' : i === step ? 'active' : 'pending'}
              reduceMotion={reduceMotion}
            />
          ))}
        </ol>
      </nav>

      {/* Panel */}
      <section aria-labelledby="panel-heading" tabIndex={-1} ref={panelRef} style={{ outline: 'none' }}>
        <h2 id="panel-heading" style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem', color: TOKEN.text }}>
          {step === 0 && 'What should we call you?'}
          {step === 1 && 'Create a password'}
          {step === 2 && 'Looks good — confirm your details'}
        </h2>

        {step === 0 && (
          <>
            <Field label="First name" id="name" type="text" autoComplete="given-name"
              value={fields.name} error={errors.name}
              onChange={v => setFields(f => ({ ...f, name: v }))} />
            <Field label="Work email" id="email" type="email" autoComplete="email"
              value={fields.email} error={errors.email}
              onChange={v => setFields(f => ({ ...f, email: v }))} />
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Password" id="pw" type="password" autoComplete="new-password"
              value={fields.pw} error={errors.pw} hint="At least 10 characters."
              onChange={v => setFields(f => ({ ...f, pw: v }))} />
            <Field label="Confirm password" id="pwc" type="password" autoComplete="new-password"
              value={fields.pwc} error={errors.pwc}
              onChange={v => setFields(f => ({ ...f, pwc: v }))} />
          </>
        )}

        {step === 2 && (
          <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '1rem', fontSize: '0.875rem', lineHeight: 1.75, color: TOKEN.pending }}>
            <strong style={{ color: TOKEN.text }}>Name:</strong> {fields.name}<br />
            <strong style={{ color: TOKEN.text }}>Email:</strong> {fields.email}<br />
            <strong style={{ color: TOKEN.text }}>Password:</strong> ••••••••••
          </div>
        )}
      </section>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.75rem' }}>
        {step > 0 ? (
          <button onClick={back} style={{ padding: '0.625rem 1.25rem', borderRadius: 8, border: '1.5px solid #d1d5db', background: '#fff', fontWeight: 600, cursor: 'pointer', color: TOKEN.pending }}>
            Back
          </button>
        ) : <div />}
        <button onClick={next} style={{ padding: '0.625rem 1.25rem', borderRadius: 8, border: 'none', background: TOKEN.brand, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
          {step === STEPS.length - 1 ? 'Create account' : 'Continue'}
        </button>
      </div>

      {/* Inline progress bar showing overall wizard progress */}
      <div style={{ marginTop: '1.25rem' }}>
        <ProgressBar value={step + 1} max={STEPS.length} label={`Step ${step + 1} of ${STEPS.length}`} reduceMotion={reduceMotion} />
      </div>

      {/* Keyframe definitions for indeterminate sweep and reduced-motion opacity pulse */}
      {/* All motion suppression is handled via the reduceMotion boolean on inline styles above */}
      <style>{`
        @keyframes pb-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @keyframes pb-fade { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

// ── Reusable field ─────────────────────────────────────────────────
function Field({ label, id, type, autoComplete, value, error, hint, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1rem' }}>
      <label htmlFor={id} style={{ fontSize: '0.875rem', fontWeight: 600, color: TOKEN.pending }}>{label}</label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: '0.625rem 0.75rem',
          border: `1.5px solid ${error ? TOKEN.error : '#d1d5db'}`,
          borderRadius: 8, fontSize: '0.9375rem',
          color: TOKEN.text, background: '#fff',
          width: '100%',
        }}
      />
      {hint && !error && <span id={`${id}-hint`} style={{ fontSize: '0.8125rem', color: TOKEN.pending }}>{hint}</span>}
      {error && (
        <span id={`${id}-err`} role="alert" style={{ fontSize: '0.8125rem', color: TOKEN.error, fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
}
```

## Variations

| Variant | What changes |
|---|---|
| **Determinate bar** | `aria-valuenow` tracks real progress (0–100); fill animates via `transform: scaleX()` |
| **Indeterminate bar** | `aria-valuenow` omitted; a sweeping animation signals "working but unknown duration" |
| **Segmented / stepped bar** | Bar divided into N equal segments that fill one at a time (hybrid of bar + stepper) |
| **Linear stepper** | Steps are sequential, only current step's form is shown, clicking past steps is disabled |
| **Clickable stepper** | Completed steps are clickable anchors, pending steps are disabled — useful for multi-page checkout with edit access |
| **Vertical stepper** | `flex-direction: column` on `<ol>`, connector is a left-border, good for mobile-first and longer step labels |
| **Inline status bar** | A thin bar at top of a modal or card that shows wizard position without explicit step circles — minimal visual weight |
| **Responsive collapse** | Horizontal on desktop (`@media (min-width: 600px)`), labels hidden on narrow screens (circles only), connector line stays |

## Accessibility

### prefers-reduced-motion (mandatory for anything animated)

The indeterminate sweep animation is the primary motion risk. The code in both vanilla and React versions includes a `@media (prefers-reduced-motion: reduce)` block that:
- Cancels `animation` on the sweeping fill
- Falls back to a 2-second `opacity` pulse (perceptible but non-vestibular)
- Removes `transition` from the determinate fill (it jumps directly to the new value instead of animating)
- Removes `transition` from step circle background and connector line color changes

```css
@keyframes pulse-opacity { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

@media (prefers-reduced-motion: reduce) {
  .fill {
    transition: none;
  }
  .fill[data-indeterminate] {
    /* Replace sweep with a single animation declaration — pulse-opacity as the animation-name
       implicitly cancels the sweep because no rule references "sweep" in reduced-motion context */
    animation: pulse-opacity 2s ease-in-out infinite;
    width: 50%;
    transform: none;
  }
  .step-circle { transition: none; }
  .step-nav li + li::before { transition: none; }
}
```

### Contrast (all values recomputed for colors used in this file's code)

| Color pair | Ratio | Use | Passes |
|---|---|---|---|
| `#1c1917` on `#fafaf9` | 16.74:1 | Body text, headings | AA + AAA |
| `#44403c` on `#fafaf9` | 9.84:1 | Labels, subtext | AA + AAA |
| `#4f46e5` on `#fafaf9` | 6.02:1 | Brand links, active connector | AA |
| `#ffffff` on `#4f46e5` | 6.29:1 | Step number in active circle | AA |
| `#166534` on `#fafaf9` | 6.83:1 | Completed step text/icon | AA |
| `#b91c1c` on `#fafaf9` | 6.19:1 | Error messages | AA |

The green fill bar (`#22c55e`) used purely as a graphical/decorative track fill against a white background yields 2.28:1 — below text requirements — but the track itself carries no text, making it a non-text UI component. WCAG 1.4.11 (Non-text Contrast) requires 3:1 for UI component boundaries against adjacent colors. The track boundary is the gray-200 (`#e5e7eb`) container against `#fafaf9` — 1.17:1 which is borderline for the edge alone, so the progress fill should reach at least 3:1 against the page background when the bar is the primary state indicator. Use `#4f46e5` (6.02:1) or `#166534` (6.83:1) as fill colors in production, not `#22c55e`.

### Keyboard and focus

- Back/Next buttons are native `<button>` elements — Tab navigable, space/enter activatable, no extra ARIA needed.
- On step advance, focus moves programmatically to the new `<section>` (`tabindex="-1"`), then to its `<h2>`. This signals the context change to keyboard and screen reader users without leaving them stranded on a now-hidden button.
- Clicking "Back" reverses focus the same way.
- Do not trap focus inside a step panel — it is not a modal.
- Validate on the Next button click, not on blur for every field. Blur-time validation on password fields interrupts users before they finish typing.

### Touch and pointer fallback

No hover-only affordances. Step circles use size `2.25rem` (36 px) — meets WCAG 2.5.8 (Target Size Minimum, 24×24 px) and Material's 48 px tap-target recommendation when the surrounding padding is included. The entire connector line is decorative and carries no interactive target.

```css
/* Hover effect only when the device supports it */
@media (hover: hover) and (pointer: fine) {
  .btn-secondary:hover { background: #f3f4f6; }
  .btn-primary:hover   { opacity: 0.88; }
}
```

### Screen reader

- `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` is announced as a percentage by NVDA/JAWS/VoiceOver. Include `aria-label` or `aria-labelledby` — a nameless progressbar is an accessibility failure.
- `aria-valuenow` must be omitted (not set to empty or zero) for indeterminate bars. Setting it to `0` incorrectly tells screen readers "0% complete."
- Step indicator uses `aria-current="step"` on the active `<li>`. VoiceOver announces this as "current" when the user navigates the list. Supplement with visually-hidden state text ("completed", "not yet started") for each non-current step.
- The `aria-live="polite"` region fires after the DOM swap, giving the new step name without interrupting in-progress speech. Clear it after ~1.5 s so the same step re-announcement works on consecutive navigation.
- For the review step, `role="status"` on the success message with `aria-live="polite"` is sufficient — the content is confirmatory, not urgent.

## Performance

- **Animate only `transform` and `opacity`.** `transform: scaleX()` on the fill element drives the animation entirely on the GPU compositor thread — no layout recalculations, no paint. Never animate `width` directly.
- **`will-change: transform`** on the fill bar helps the browser promote it to its own layer. Use sparingly — one element per progress bar is fine; do not apply globally.
- **Connector transitions** (`background` color change on the `::before` pseudo-element) trigger a repaint but not a layout. Acceptable for one or two steppers per page; avoid on lists of many progress bars.
- **Indeterminate shimmer** uses a single element with `translateX` animation. Avoid pseudo-element shimmer with `background-size` plus `background-position` animation — that forces paint on every frame in some browsers.
- **React caution**: avoid putting step validation logic inside a `useEffect` that watches every keystroke — validate only on Next press to prevent excessive re-renders. Use `useRef` instead of `useState` for the panel element to avoid re-renders on focus.
- No external dependencies required for the vanilla version. The React version adds only the component itself — no library overhead.

## Anti-slop

**The cliché (Motion bucket):** Animated skill-percentage bars on a portfolio's "About" page — bars that sweep to e.g. "JavaScript: 85%" as you scroll. This pattern is meaningless (what does 85% JavaScript skill mean?), visually generic, and actively hostile to screen readers when implemented with `role="progressbar"` and a fake `aria-valuenow` that represents nothing real.

**The cliché (Copy bucket):** Progress labels that say "Processing…" or "Loading…" with no further detail. Users cannot tell if it will take 2 seconds or 2 minutes.

**The tasteful alternative:**
- Replace skill bars with a project grid or specific technology callouts — concrete evidence beats abstract percentages.
- Write progress labels that contain the actual task and scale: "Uploading report.pdf — 3.2 MB of 12 MB", "Verifying payment details", "Step 2 of 4: Shipping address". When the task completes, say so explicitly: "Upload complete" — not just a bar that reaches the end and stays.
- Use an indeterminate bar honestly when duration is unknown rather than a fake sweep that crawls to 90% and stalls.
- Reserve the stepper chrome for flows with 3–7 genuinely distinct stages. Two fields split across two "steps" wastes the user's navigation budget.

Cross-reference _slop-blocklist.md: **Motion** (everything fades-and-slides same duration/easing), **Copy** (Empower/Seamless/Unlock/Processing filler).

## Pairs well with

- `empty-states` — show an empty state after a failed step or a zero-result search mid-wizard.
- `toasts-and-notifications` — pair a progress bar with a success toast on completion ("Report exported") rather than an inline message that competes with the next screen.
- `error-and-validation-states` — per-field inline errors inside wizard steps; the step circle itself can turn red on validation failure to give the indicator semantic color.
- `loading-and-skeletons` — indeterminate bars and skeleton screens serve complementary use cases: bar when you can announce a named task, skeleton when you are loading content whose shape is known.
- `onboarding-tooltips` — progress indicator inside an onboarding overlay shows the user how many tooltip steps remain.

## Current references

- [MDN — ARIA progressbar role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/progressbar_role) — canonical attribute reference: aria-valuenow, indeterminate state, native `<progress>` preference
- [MDN — aria-valuenow](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-valuenow) — when to omit for indeterminate, aria-valuetext for human-readable strings
- [W3C APG — Range-related properties](https://www.w3.org/WAI/ARIA/apg/practices/range-related-properties/) — aria-valuemin/max defaults and validation rules for progressbar, slider, spinbutton
- [aditus.io — aria-current](https://www.aditus.io/aria/aria-current/) — clear examples of aria-current="step" vs "page" vs "location" with screen reader behavior
- [U.S. Web Design System — Step indicator](https://designsystem.digital.gov/components/step-indicator/) — semantic ol/li structure, sr-only state text, WCAG 2.1 AA test results
- [PatternFly — Progress stepper accessibility](https://www.patternfly.org/components/progress-stepper/accessibility/) — aria-live="polite" pattern for step announcements, aria-label requirements per step
- [Smashing Magazine — Creating an effective multistep form (Dec 2024)](https://www.smashingmagazine.com/2024/12/creating-effective-multistep-form-better-user-experience/) — per-step validation with checkValidity(), localStorage persistence, navigation button conventions
- [ishadeed.com — Building a stepper component](https://ishadeed.com/article/stepper-component-html-css/) — CSS connector technique with flex + pseudo-elements, CSS custom property sizing, no magic numbers
- [CSS-Tricks — prefers-reduced-motion](https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/) — media query syntax, reduced vs no-preference, OS-level detection
