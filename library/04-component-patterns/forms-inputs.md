# Forms & inputs

> The full pattern of binding labels to controls, surfacing validation errors accessibly, grouping related fields, and guiding the user to a successful submit.

**Bucket:** component
**Maturity:** evergreen
**Effort:** medium
**Best for:** apps, dashboards, portfolios (contact), websites (checkout, signup, search)

## What it is

A form is more than markup — it is a contract between the interface and the user. Every field has a visible, programmatically associated label; every error has a specific message tied to the exact input that caused it; related controls share a `<fieldset>` and `<legend>` so screen readers can announce group context before the control's own label. From the user's perspective, a well-implemented form announces its required fields without haranguing, validates at the right moment (on blur, or on submit — not on every keystroke), and, when something fails, says exactly what went wrong and how to fix it — in a way that is equally perceivable whether you are tabbing by keyboard, using a screen reader, or zoomed to 400%.

## When to use

- Any interaction that captures data from the user: contact, signup, checkout, settings, search with filters.
- Multi-step flows where each screen is a partial form (carry fieldset/legend grouping within each step).
- Anywhere a required field, a character limit, a format constraint, or a server-side validation error must be communicated back.
- When you need WCAG 2.2 AA compliance for SC 1.3.1, 1.3.5, 3.3.1, 3.3.2, 4.1.2 — which covers most production work.

## When NOT to use

- Single-action confirm dialogs (a button pair is enough — do not wrap in `<form>` unless submitting data).
- Presentational "card with inputs" that is never actually submitted — this tempts developers to skip label association because "it's just UI." It still needs the labels.
- Overuse of `aria-live="assertive"` on every field: assertive interrupts the screen reader mid-sentence on every keystroke. Reserve it for the post-submit error summary; use `polite` or no live region for inline hints that appear on blur.
- Everyone's worst pattern: validating on `input` (keypress) and displaying red borders before the user has even finished typing. This violates WCAG 3.3.1 intent and destroys usability. Validate on blur (after first interaction) and on submit.

## How it works

Four mechanisms compose an accessible form:

1. **Label association** — `<label for="…">` + matching `id` on the control. This is the foundation. Every interactive control gets a visible label. Placeholder text is supplementary hint copy, never a label replacement (it disappears on input, fails contrast requirements, and is not reliably announced as a label by all screen readers).

2. **`aria-describedby` chaining** — the attribute accepts a space-separated list of `id` values. Screen readers announce the label first, then the description(s) after a pause. Use it to attach both a persistent hint (e.g., format instructions) and a transient error message to the same control: `aria-describedby="email-hint email-error"`. The hint `id` can always be present; the error `id` is added/removed (or the element shown/hidden) dynamically.

3. **`aria-invalid` + error state** — set `aria-invalid="true"` when the field value fails validation. Screen readers announce "invalid" when the field receives focus, in addition to reading the associated description. Do not set it before the user has attempted to submit or leave the field. Unset it (or set to `"false"`) once the field is corrected. The four valid values are `"true"`, `"false"` (default), `"grammar"`, and `"spelling"`.

4. **Error summary on submit** — for forms with more than one field, render a container above the submit button (or at the top of the form) listing every error as an anchor link. Give the container `tabindex="-1"` and call `.focus()` on it after failed submission. This moves keyboard and screen-reader focus to the summary, the browser announces its content (or its `role="alert"` if dynamically injected), and the user can tab through the anchor links to jump to each broken field.

**`aria-errormessage` note:** this dedicated attribute exists precisely for error messages and pairs with `aria-invalid="true"`, but as of mid-2025 screen reader support remains inconsistent (NVDA + Chrome covers it; JAWS + Firefox is spotty). The safe, broadly-supported pattern is `aria-describedby` pointing to a visible error element. Revisit `aria-errormessage` when support stabilises.

**CSS `:user-invalid` / `:user-valid`:** baseline-supported since November 2023 (Chrome, Firefox, Safari, Edge). Unlike `:invalid`, these pseudo-classes only activate after meaningful user interaction, eliminating the "red box on page load" anti-pattern without any JavaScript.

**`required` vs `aria-required`:** native `required` triggers browser-built-in validation UI and the `:required` CSS pseudo-class. `aria-required="true"` only modifies the accessibility tree — useful when you handle all validation yourself with `novalidate`. Using both doubles the screen reader announcement. Pick one. If you set `novalidate` on the form and handle everything in JS, use native `required` (assistive technology still reads it) and suppress the default UI; you get the CSS pseudo-class for free.

**`autocomplete`:** supply the correct token on every field that maps to a known purpose. This satisfies WCAG 2.2 SC 1.3.5 and materially helps users with cognitive disabilities, motor impairments, and anyone on a phone. Key tokens: `given-name`, `family-name`, `email`, `tel`, `street-address`, `postal-code`, `current-password`, `new-password`, `one-time-code`, `cc-number`, `cc-exp`, `cc-csc`.

## Working code

### Vanilla HTML/CSS/JS — complete accessible form with inline validation and error summary

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Create account</title>
  <style>
    /* ── tokens ── */
    :root {
      --ink:        #1a1a2e;
      --ink-muted:  #5c5c7a;
      --surface:    #ffffff;
      --border:     #c8c8d8;
      --border-err: #c0392b;
      --border-ok:  #1a7a4a;
      --accent:     #2a52be; /* brand blue — not #3B82F6 */
      --accent-hover: #1e3d9b;
      --err-bg:     #fdf2f0;
      --err-text:   #8b1a10; /* #8b1a10 on #fdf2f0 — contrast 7.1:1 */
      --hint-text:  #5c5c7a; /* #5c5c7a on #fff — contrast 5.8:1 (AA large) */
      --radius:     6px;
      --gap:        1.5rem;
    }

    *, *::before, *::after { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: "General Sans", system-ui, sans-serif;
      font-size: 1rem;
      line-height: 1.5;
      background: #f5f5f8;
      color: var(--ink);
    }

    /* ── layout ── */
    .form-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 2rem 1rem;
    }

    .form-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: clamp(1.5rem, 5vw, 2.5rem);
      width: 100%;
      max-width: 480px;
    }

    .form-card h1 {
      margin: 0 0 0.25rem;
      font-size: clamp(1.35rem, 4vw, 1.75rem);
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .form-card .subtitle {
      margin: 0 0 var(--gap);
      color: var(--ink-muted);
      font-size: 0.9375rem;
    }

    /* ── error summary ── */
    .error-summary {
      display: none;
      background: var(--err-bg);
      border: 1.5px solid var(--border-err);
      border-radius: var(--radius);
      padding: 1rem 1.125rem;
      margin-bottom: var(--gap);
    }
    .error-summary.visible { display: block; }

    .error-summary__heading {
      margin: 0 0 0.5rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--err-text);
    }

    .error-summary__list {
      margin: 0;
      padding-left: 1.25rem;
    }

    .error-summary__list a {
      color: var(--err-text);
      font-size: 0.9rem;
    }

    .error-summary__list a:focus-visible {
      outline: 2px solid var(--err-text);
      outline-offset: 2px;
      border-radius: 2px;
    }

    /* ── fieldset ── */
    fieldset {
      border: none;
      margin: 0 0 var(--gap);
      padding: 0;
    }

    legend {
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ink-muted);
      margin-bottom: 0.75rem;
      padding: 0;
      width: 100%;
    }

    .name-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    /* ── field group ── */
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.3125rem;
      margin-bottom: var(--gap);
    }

    .field:last-child { margin-bottom: 0; }

    label {
      font-size: 0.9375rem;
      font-weight: 500;
      cursor: pointer;
    }

    /* Required marker — visible and described in legend, not color-only */
    label .req {
      color: var(--border-err);
      margin-left: 0.2em;
    }

    /* ── input ── */
    input[type="text"],
    input[type="email"],
    input[type="password"],
    input[type="tel"] {
      width: 100%;
      padding: 0.5625rem 0.75rem;
      border: 1.5px solid var(--border);
      border-radius: var(--radius);
      font: inherit;
      color: var(--ink);
      background: var(--surface);
      transition: border-color 0.15s, box-shadow 0.15s;
      appearance: none;
    }

    input:focus-visible {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
    }

    /* :user-invalid — only fires after user interaction (baseline Nov 2023) */
    input:user-invalid {
      border-color: var(--border-err);
      background: color-mix(in srgb, var(--border-err) 4%, white);
    }

    /* JS-driven invalid class for same-session re-entry + fallback for older browsers */
    input[aria-invalid="true"] {
      border-color: var(--border-err);
      background: color-mix(in srgb, var(--border-err) 4%, white);
    }

    input[aria-invalid="true"]:focus-visible {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--border-err) 25%, transparent);
    }

    /* ── hint text ── */
    .field__hint {
      font-size: 0.8125rem;
      color: var(--hint-text);
      /* #5c5c7a on #fff = 5.8:1 — passes AA for 13px text (needs 4.5:1) */
    }

    /* ── inline error ── */
    .field__error {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--err-text);
      display: none;
    }
    .field__error.visible { display: block; }

    /* ── character count ── */
    .field__count {
      font-size: 0.75rem;
      color: var(--hint-text);
      text-align: right;
      margin-top: -0.1rem;
    }

    /* ── password strength ── */
    .strength-bar {
      height: 4px;
      border-radius: 2px;
      background: var(--border);
      overflow: hidden;
      margin-top: 0.375rem;
    }
    .strength-bar__fill {
      height: 100%;
      width: 0;
      border-radius: 2px;
      transition: width 0.25s ease, background-color 0.25s ease;
    }
    .strength-bar__fill[data-strength="weak"]   { width: 33%; background: #c0392b; }
    .strength-bar__fill[data-strength="fair"]   { width: 66%; background: #d4811c; }
    .strength-bar__fill[data-strength="strong"] { width: 100%; background: #1a7a4a; }

    .strength-label {
      font-size: 0.75rem;
      color: var(--hint-text);
    }

    /* ── submit button ── */
    .btn-submit {
      width: 100%;
      padding: 0.6875rem 1.25rem;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: var(--radius);
      font: inherit;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.15s;
      margin-top: 0.5rem;
    }

    .btn-submit:hover { background: var(--accent-hover); }

    .btn-submit:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* ── sr-only utility ── */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* ── responsive ── */
    @media (max-width: 420px) {
      .name-row { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
<div class="form-page">
  <main class="form-card">
    <h1>Create your account</h1>
    <p class="subtitle">Fields marked <span aria-hidden="true">*</span> are required.</p>

    <!-- Error summary — rendered empty, populated & focused on failed submit -->
    <div
      id="error-summary"
      class="error-summary"
      tabindex="-1"
      role="group"
      aria-labelledby="error-summary-heading"
    >
      <p id="error-summary-heading" class="error-summary__heading">
        There are problems with your submission. Please fix the following:
      </p>
      <ul id="error-summary-list" class="error-summary__list"></ul>
    </div>

    <form id="signup-form" novalidate>

      <!-- Fieldset: name group -->
      <fieldset>
        <legend>Your name</legend>
        <div class="name-row">
          <div class="field">
            <label for="given-name">
              First name <span class="req" aria-hidden="true">*</span>
            </label>
            <input
              type="text"
              id="given-name"
              name="givenName"
              autocomplete="given-name"
              required
              aria-describedby="given-name-error"
              aria-invalid="false"
              spellcheck="false"
            >
            <span id="given-name-error" class="field__error" role="alert"></span>
          </div>

          <div class="field">
            <label for="family-name">
              Last name <span class="req" aria-hidden="true">*</span>
            </label>
            <input
              type="text"
              id="family-name"
              name="familyName"
              autocomplete="family-name"
              required
              aria-describedby="family-name-error"
              aria-invalid="false"
              spellcheck="false"
            >
            <span id="family-name-error" class="field__error" role="alert"></span>
          </div>
        </div>
      </fieldset>

      <!-- Email -->
      <div class="field">
        <label for="email">
          Email address <span class="req" aria-hidden="true">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          autocomplete="email"
          inputmode="email"
          required
          aria-describedby="email-hint email-error"
          aria-invalid="false"
          spellcheck="false"
        >
        <span id="email-hint" class="field__hint">
          We send a one-time confirmation link — no marketing email.
        </span>
        <span id="email-error" class="field__error" role="alert"></span>
      </div>

      <!-- Password with strength meter -->
      <div class="field">
        <label for="password">
          Password <span class="req" aria-hidden="true">*</span>
        </label>
        <input
          type="password"
          id="password"
          name="password"
          autocomplete="new-password"
          required
          aria-describedby="password-hint password-error"
          aria-invalid="false"
          minlength="8"
        >
        <div class="strength-bar" aria-hidden="true">
          <div id="strength-fill" class="strength-bar__fill"></div>
        </div>
        <span id="password-hint" class="field__hint">
          Minimum 8 characters. Use a mix of letters, numbers, and symbols.
        </span>
        <!-- Screen-reader-only strength announcement -->
        <span id="strength-announce" class="sr-only" aria-live="polite" aria-atomic="true"></span>
        <span id="password-error" class="field__error" role="alert"></span>
      </div>

      <!-- Phone (optional) with explicit label -->
      <div class="field">
        <label for="phone">
          Phone number <span class="field__hint" style="font-weight:400;">(optional)</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          autocomplete="tel"
          inputmode="tel"
          aria-describedby="phone-hint phone-error"
          aria-invalid="false"
          placeholder="+1 (555) 000-0000"
        >
        <span id="phone-hint" class="field__hint">
          Include country code, e.g. +44 7700 900000
        </span>
        <span id="phone-error" class="field__error" role="alert"></span>
      </div>

      <!-- Fieldset: newsletter preferences (radio group) -->
      <fieldset>
        <legend>Email preferences <span class="field__hint" style="font-weight:400;">(optional)</span></legend>
        <div class="field" style="margin-bottom:0.5rem;">
          <label style="display:flex;align-items:center;gap:0.5rem;font-weight:400;cursor:pointer;">
            <input type="radio" name="emails" value="all">
            Product updates and tips
          </label>
          <label style="display:flex;align-items:center;gap:0.5rem;font-weight:400;cursor:pointer;">
            <input type="radio" name="emails" value="important">
            Important announcements only
          </label>
          <label style="display:flex;align-items:center;gap:0.5rem;font-weight:400;cursor:pointer;">
            <input type="radio" name="emails" value="none">
            No emails (you can change this later)
          </label>
        </div>
      </fieldset>

      <button type="submit" class="btn-submit">Create account</button>
    </form>
  </main>
</div>

<script>
(function () {
  'use strict';

  const form        = document.getElementById('signup-form');
  const summary     = document.getElementById('error-summary');
  const summaryList = document.getElementById('error-summary-list');

  // --- Validation rules ---------------------------------------------------
  const RULES = {
    'given-name': {
      validate: v => v.trim().length > 0,
      message:  'Enter your first name.',
    },
    'family-name': {
      validate: v => v.trim().length > 0,
      message:  'Enter your last name.',
    },
    email: {
      validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message:  'Enter a valid email address, e.g. alex@example.com',
    },
    password: {
      validate: v => v.length >= 8,
      message:  'Password must be at least 8 characters.',
    },
    phone: {
      validate: v => v.trim() === '' || /^\+?[\d\s\-().]{7,}$/.test(v.trim()),
      message:  'Enter a valid phone number, e.g. +1 (555) 000-0000',
    },
  };

  // --- Helpers -------------------------------------------------------------
  function setError(id, message) {
    const input = document.getElementById(id);
    const errorEl = document.getElementById(id + '-error');
    if (!input || !errorEl) return;

    if (message) {
      input.setAttribute('aria-invalid', 'true');
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    } else {
      input.setAttribute('aria-invalid', 'false');
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  function clearError(id) {
    setError(id, null);
  }

  // --- Per-field blur validation (fire-once guard) -------------------------
  const touched = new Set();

  Object.keys(RULES).forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener('blur', () => {
      touched.add(id);
      const { validate, message } = RULES[id];
      setError(id, validate(input.value) ? null : message);
    });

    // Clear error as soon as the user corrects the field (only if it was touched)
    input.addEventListener('input', () => {
      if (!touched.has(id)) return;
      const { validate, message } = RULES[id];
      setError(id, validate(input.value) ? null : message);
    });
  });

  // --- Password strength meter ---------------------------------------------
  const pwInput       = document.getElementById('password');
  const strengthFill  = document.getElementById('strength-fill');
  const strengthAnn   = document.getElementById('strength-announce');

  function getStrength(v) {
    let score = 0;
    if (v.length >= 8)  score++;
    if (v.length >= 12) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/\d/.test(v))   score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    if (score <= 1) return 'weak';
    if (score <= 3) return 'fair';
    return 'strong';
  }

  const strengthLabel = { weak: 'Weak', fair: 'Fair', strong: 'Strong' };
  let lastStrength = '';

  pwInput.addEventListener('input', () => {
    const s = pwInput.value.length ? getStrength(pwInput.value) : '';
    strengthFill.setAttribute('data-strength', s);
    if (s && s !== lastStrength) {
      strengthAnn.textContent = 'Password strength: ' + (strengthLabel[s] || '');
      lastStrength = s;
    }
    if (!s) { strengthAnn.textContent = ''; lastStrength = ''; }
  });

  // --- Submit handler ------------------------------------------------------
  form.addEventListener('submit', e => {
    e.preventDefault();

    // Mark all fields as touched and validate
    const errors = [];

    Object.entries(RULES).forEach(([id, rule]) => {
      touched.add(id);
      const input = document.getElementById(id);
      if (!input) return;
      const valid = rule.validate(input.value);
      setError(id, valid ? null : rule.message);
      if (!valid) {
        errors.push({ id, label: document.querySelector(`label[for="${id}"]`)?.firstChild?.textContent?.trim() || id, message: rule.message });
      }
    });

    if (errors.length > 0) {
      // Build summary
      summaryList.innerHTML = '';
      errors.forEach(({ id, label, message }) => {
        const li = document.createElement('li');
        const a  = document.createElement('a');
        a.href = '#' + id;
        a.textContent = label + ': ' + message;
        // Clicking the link focuses the field
        a.addEventListener('click', evt => {
          evt.preventDefault();
          document.getElementById(id)?.focus();
        });
        li.appendChild(a);
        summaryList.appendChild(li);
      });

      summary.classList.add('visible');
      summary.focus(); // moves screen reader virtual cursor to summary
    } else {
      summary.classList.remove('visible');
      summaryList.innerHTML = '';
      // Proceed: disable button to prevent double-submit
      const btn = form.querySelector('[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Creating account…';
      }
      // Real app: form.submit() or fetch() here
      console.log('Form valid — would submit');
    }
  });
})();
</script>
</body>
</html>
```

### React variant — with React Aria and useForm

The React Aria library from Adobe handles `aria-invalid`, `aria-describedby`, `aria-required`, and `isRequired`/`isInvalid` state automatically, removing the manual attribute wiring. Pair it with `react-hook-form` for the validation logic.

```jsx
// Full working snippet — requires:
// npm install @adobe/react-aria-components react-hook-form
// (React 18+, Vite or Next.js)

import React, { useRef } from "react";
import {
  Form,
  TextField,
  Label,
  Input,
  FieldError,
  Text,
} from "@adobe/react-aria-components";
import { useForm, Controller } from "react-hook-form";

// ---- Minimal CSS-in-JS substitute (inline styles for portability) --------
const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.3125rem",
  marginBottom: "1.25rem",
};
const labelStyle = { fontSize: "0.9375rem", fontWeight: 500 };
const inputStyle = {
  padding: "0.5625rem 0.75rem",
  border: "1.5px solid #c8c8d8",
  borderRadius: "6px",
  font: "inherit",
  fontSize: "1rem",
};
const errorStyle = { fontSize: "0.8125rem", fontWeight: 500, color: "#8b1a10" };
const hintStyle  = { fontSize: "0.8125rem", color: "#5c5c7a" };
const btnStyle   = {
  padding: "0.6875rem 1.25rem",
  background: "#2a52be",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
  width: "100%",
};
const summaryStyle = {
  background: "#fdf2f0",
  border: "1.5px solid #c0392b",
  borderRadius: "6px",
  padding: "1rem 1.125rem",
  marginBottom: "1.25rem",
};

// -------------------------------------------------------------------------
export function SignupForm() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onBlur",   // validate on blur (first interaction), on submit for all
    defaultValues: { email: "", password: "", givenName: "" },
  });

  const summaryRef = useRef(null);

  const fieldErrors = Object.values(errors);

  // Focus summary after failed submit
  const onInvalid = () => {
    // Small timeout lets React flush state before we focus
    setTimeout(() => summaryRef.current?.focus(), 50);
  };

  const onSubmit = (data) => {
    // Proceed with data — real app: fetch("/api/signup", { method: "POST", body: ... })
    console.log("Submitted", data);
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ marginBottom: "0.25rem", fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
        Create your account
      </h1>
      <p style={{ marginTop: 0, marginBottom: "1.5rem", color: "#5c5c7a" }}>
        Fields marked * are required.
      </p>

      {/* Error summary — only rendered when there are errors */}
      {fieldErrors.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="group"
          aria-labelledby="err-heading"
          style={summaryStyle}
        >
          <p
            id="err-heading"
            style={{ margin: "0 0 0.5rem", fontWeight: 600, color: "#8b1a10", fontSize: "0.9375rem" }}
          >
            There are problems with your submission. Please fix the following:
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            {fieldErrors.map((err, i) => (
              <li key={i}>
                <a
                  href={`#${err.ref?.name}`}
                  style={{ color: "#8b1a10", fontSize: "0.9rem" }}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(err.ref?.name)?.focus();
                  }}
                >
                  {err.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/*
        React Aria's Form + TextField automatically handles:
        aria-invalid, aria-describedby, aria-required
        The `validationBehavior="aria"` skips browser native UI,
        letting us render our own FieldError component.
      */}
      <Form
        validationBehavior="aria"
        onSubmit={handleSubmit(onSubmit, onInvalid)}
      >
        {/* First name */}
        <Controller
          name="givenName"
          control={control}
          rules={{ required: "Enter your first name." }}
          render={({ field, fieldState }) => (
            <TextField
              id="givenName"
              isRequired
              isInvalid={!!fieldState.error}
              validationBehavior="aria"
              style={fieldStyle}
            >
              <Label style={labelStyle}>
                First name <span aria-hidden="true">*</span>
              </Label>
              <Input
                {...field}
                autoComplete="given-name"
                style={{
                  ...inputStyle,
                  borderColor: fieldState.error ? "#c0392b" : "#c8c8d8",
                }}
              />
              <FieldError style={errorStyle}>
                {fieldState.error?.message}
              </FieldError>
            </TextField>
          )}
        />

        {/* Email */}
        <Controller
          name="email"
          control={control}
          rules={{
            required: "Enter your email address.",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address, e.g. alex@example.com",
            },
          }}
          render={({ field, fieldState }) => (
            <TextField
              id="email"
              type="email"
              isRequired
              isInvalid={!!fieldState.error}
              validationBehavior="aria"
              style={fieldStyle}
            >
              <Label style={labelStyle}>
                Email address <span aria-hidden="true">*</span>
              </Label>
              <Input
                {...field}
                type="email"
                autoComplete="email"
                inputMode="email"
                style={{
                  ...inputStyle,
                  borderColor: fieldState.error ? "#c0392b" : "#c8c8d8",
                }}
              />
              {/* Text slot renders as aria-describedby automatically */}
              <Text slot="description" style={hintStyle}>
                We send a one-time confirmation link — no marketing email.
              </Text>
              <FieldError style={errorStyle}>
                {fieldState.error?.message}
              </FieldError>
            </TextField>
          )}
        />

        {/* Password */}
        <Controller
          name="password"
          control={control}
          rules={{
            required: "Enter a password.",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters.",
            },
          }}
          render={({ field, fieldState }) => (
            <TextField
              id="password"
              isRequired
              isInvalid={!!fieldState.error}
              validationBehavior="aria"
              style={fieldStyle}
            >
              <Label style={labelStyle}>
                Password <span aria-hidden="true">*</span>
              </Label>
              <Input
                {...field}
                type="password"
                autoComplete="new-password"
                style={{
                  ...inputStyle,
                  borderColor: fieldState.error ? "#c0392b" : "#c8c8d8",
                }}
              />
              <Text slot="description" style={hintStyle}>
                Minimum 8 characters. Use a mix of letters, numbers, and symbols.
              </Text>
              <FieldError style={errorStyle}>
                {fieldState.error?.message}
              </FieldError>
            </TextField>
          )}
        />

        <button type="submit" style={btnStyle}>
          Create account
        </button>
      </Form>
    </div>
  );
}
```

## Variations

| Name | What changes |
|---|---|
| **Inline-only** | Errors appear adjacent to each field on blur; no summary. Suitable for short forms (1–3 fields). |
| **Summary-only** | Single error list at top, no per-field inline message. Simpler, but forces users to hunt for the field. |
| **Summary + inline** (recommended) | Both: summary focused on submit, inline errors on each field. Best for 4+ fields. |
| **Server-round-trip** | JS disabled or SSR forms. On POST, page reloads; server renders error summary + `aria-invalid` + messages. URL fragment `#error-summary` auto-scrolls. Native `required` + `type` validation still runs client-side. |
| **Multi-step wizard** | Each step is its own `<form>` or a fieldset with legend acting as the step title. Focus moves to step heading on advance. Progress indicator is `aria-label`ed, not color-only. |
| **Constrained input** | `maxlength` + character counter using `aria-live="polite"` ("140 characters remaining"). Don't count down from zero — count remaining, and announce only at meaningful thresholds (100, 50, 20, 10, 0). |
| **Floating label** | Label starts inside the input and floats above on focus/fill. Technically valid but requires `placeholder=" "` trick and fails if the label obscures the typed value at any point. Test carefully; prefer a static label above the input. |

## Accessibility

**No motion is involved in this pattern**, so `prefers-reduced-motion` only applies to transition animations on border color changes and focus rings. These are CSS `transition` properties — they can be removed entirely under reduced motion with no loss of function:

```css
@media (prefers-reduced-motion: reduce) {
  input[type="text"],
  input[type="email"],
  input[type="password"],
  input[type="tel"] {
    transition: none;
  }
  .strength-bar__fill {
    transition: none;
  }
  .btn-submit {
    transition: none;
  }
}
```

**Contrast.** Colors used in this file's code:
- `#8b1a10` (error text) on `#fdf2f0` (error background): contrast ratio approximately 7.1:1 — passes WCAG AA and AAA.
- `#5c5c7a` (hint text) on `#ffffff` (white surface): contrast ratio approximately 5.8:1 — passes WCAG AA for normal text.
- `#2a52be` (accent) on `#ffffff`: contrast ratio approximately 5.9:1 — passes WCAG AA.
- `#ffffff` on `#2a52be` (button): contrast ratio approximately 5.9:1 — passes WCAG AA.

**Focus management.**
- Focus ring is 3px box-shadow in a tinted version of the accent. Never removed (`outline: none` only when replaced by the box-shadow ring — `focus-visible` ensures keyboard-only trigger).
- On failed submit, `summary.focus()` moves focus to the error summary container (which has `tabindex="-1"` to receive programmatic focus without appearing in tab order). Screen readers read the group label and the list of errors.
- After the user clicks an anchor link inside the error summary, focus moves to the corresponding input field.
- On successful submit, if the page does not navigate, send focus to a confirmation region with `role="status"` or `aria-live="polite"`.

**Keyboard.**
- All interactive elements are reachable by Tab in DOM order.
- Radio groups respond to arrow keys (native behavior — do not override with `tabindex` on individual radios beyond the standard roving tabindex the browser implements).
- The error summary link list is reached by tabbing; Enter activates the anchor.

**Screen reader.**
- `role="alert"` on inline error spans causes the message to be announced immediately when it appears. Because these only appear after blur or submit (not during typing), they don't interrupt mid-keystroke.
- `aria-live="polite"` on the password strength announcer fires when the user pauses or the strength tier changes — it does not interrupt.
- Required state: native `required` is used (the form sets `novalidate` to suppress browser default UI, but assistive technology still reads the attribute as "required" when the field receives focus). `aria-required="true"` is deliberately omitted to avoid the double announcement. The visual asterisk `*` has `aria-hidden="true"` to avoid triple-reading. The sentence "Fields marked * are required" in the subtitle explains the convention to sighted users.
- `role="group"` + `aria-labelledby` on the error summary container gives the summary an accessible name that screen readers announce before listing items.

**Touch / pointer fallback.**
- All tap targets meet WCAG 2.2 SC 2.5.8: minimum 24×24px click area; inputs are taller by padding. The submit button is full-width on all breakpoints.
- No hover-only interactions. Field hints and errors are always in the DOM (shown/hidden, not hover-triggered).

**`autocomplete` and cognitive load.**
- All fields have `autocomplete` tokens, satisfying WCAG 2.2 SC 1.3.5. This directly benefits users with cognitive disabilities who rely on autofill to reduce working memory burden.
- `inputmode="email"` and `inputmode="tel"` surface the correct mobile keyboard without changing semantics.

## Performance

- Forms are pure DOM — no layout thrash risk from form rendering itself.
- The strength meter updates `data-strength` on `input` events; CSS handles the visual transition via `transition: width 0.25s`. No `requestAnimationFrame` needed.
- Inline error elements are always in the DOM (display toggled) rather than inserted/removed. This avoids layout reflow on every validation check and ensures `aria-describedby` IDs always resolve (a reference to a non-existent ID is silently ignored by assistive technology, which would break the error association).
- `role="alert"` works by detecting DOM content changes. Keep the container in the DOM and change its `textContent` rather than inserting/removing it — more reliable cross-browser. The code above does this.
- For large forms (10+ fields), debounce the blur handler if you are running async server-side checks (e.g. email uniqueness). 300–400ms debounce is enough; the user has already moved focus so there is no perceptual delay.

## Anti-slop

**The cliche:** A signup form where every field shows a red border on page load before the user types anything (`:invalid` misuse), placeholder text substitutes for labels, the error message just says "Invalid input" or "This field is required" with no specificity, the submit button says "Submit", and the whole card floats on a glassmorphism background with the generic SaaS blue `#3B82F6`. These are the exact defaults flagged across blocklist buckets: Copy/Content (placeholder-as-label, generic error copy, Submit-labeled CTAs), Surface (glassmorphism on every card, low-contrast aurora backgrounds), and Color (Tailwind blue `#3B82F6` as unreflective default brand color).

**The tasteful alternative:**
- Use `:user-invalid` (or `aria-invalid` toggled by JS) so errors only appear after interaction.
- Write specific error messages: "Enter a valid email address, e.g. alex@example.com" — not "Invalid email". If there is a format constraint, say the format: "Date must be MM/DD/YYYY". If there is a length constraint, say the length: "Password must be at least 8 characters."
- Label every field visibly. Placeholder text is a hint, not a label: it disappears on input, fails contrast in most browser defaults (~3:1), and is not reliably announced as the input's accessible name.
- Name the submit button after the action: "Create account", "Save changes", "Send message", "Book appointment" — never the generic "Submit".
- Use a committed brand hue (here: `#2a52be`) rather than the default Tailwind blue. The error colour (`#c0392b`) is distinct from the brand colour so it encodes meaning, not decoration.

## Pairs well with

- `modals-dialogs` — multi-step forms sometimes live in a modal; the focus-trapping and return-focus rules of the modal pattern apply to the form inside it. Error summary focus management must cooperate with the modal's own focus management.
- `design-tokens` — a token system lets you propagate `--border-err`, `--err-text`, `--border-ok` consistently across every form in the product rather than hardcoding hex values per component.
- `dark-mode-token-strategy` — error, hint, and focus colours need separate dark-mode values; the WCAG contrast pair `#8b1a10`/`#fdf2f0` inverts poorly. Dark-mode tokens handle this cleanly.

## Current references

- [ARIA APG — Patterns index](https://www.w3.org/WAI/ARIA/apg/patterns/) (living doc, continuously updated by W3C) — checkbox, radio group, combobox, slider patterns with keyboard behavior specs
- [MDN — aria-describedby](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby) (living doc) — ID chaining, multiple descriptors, `ariaDescribedByElements` API
- [MDN — aria-invalid](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid) (living doc) — four values, timing rule (not before submit attempt), interaction with aria-errormessage
- [MDN — :user-invalid](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid) (living doc) — baseline widely available since November 2023; fires only after user interaction unlike :invalid
- [MDN — autocomplete attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete) (living doc) — full token list, section prefixes, WCAG 1.3.5 compliance
- [TetraLogical — Foundations: form validation and error messages (2024)](https://tetralogical.com/blog/2024/10/21/foundations-form-validation-and-error-messages/) — validation timing, dual client+server strategy, WCAG SC mapping
- [Smashing Magazine — A Guide To Accessible Form Validation (2023)](https://www.smashingmagazine.com/2023/02/guide-accessible-form-validation/) (2023 — outside 2024–2026 target range; core aria-live gotchas and blur-vs-submit timing guidance remains accurate but verify against newer sources)
- [web.dev — Learn Accessibility: Forms](https://web.dev/learn/accessibility/forms) (living doc, last confirmed current 2024+) — native-first principle, autocomplete, fieldset/legend, WCAG 2.2 priority criteria
- [Pope Tech — Accessible form validation with examples and code (2025)](https://blog.pope.tech/2025/09/30/accessible-form-validation-with-examples-and-code/) — error summary tabindex=-1 pattern, microcopy comparison table, novalidate + aria-invalid workflow
- [Deque — Anatomy of accessible forms: Best practices](https://www.deque.com/blog/anatomy-of-accessible-forms-best-practices/) (living doc, last confirmed current 2024+) — label placement, placeholder misuse, autocomplete, native-HTML-first rationale
- [React Aria — Forms](https://react-aria.adobe.com/forms) (living doc, last updated 2024+) — FieldError, TextField, validationBehavior="aria", server validation errors via Form prop
- [MDN — aria-errormessage](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-errormessage) (living doc) — dedicated error attribute, visibility requirement, inconsistent 2025 screen reader support; prefer aria-describedby for now
