# Error & validation states

> Inline field errors and system-level error summaries that tell users precisely what went wrong and exactly how to fix it, delivered accessibly and without blame.

**Bucket:** component | system
**Maturity:** evergreen
**Effort:** medium
**Best for:** apps, dashboards, websites, portfolios (any surface with a form)

## What it is

When a user submits a form or leaves a field with bad input, the interface must report the failure in two complementary channels: visually (styled error state adjacent to the field) and programmatically (ARIA attributes that surface the same information to assistive technologies without duplicating announcements). On multi-field form submission, a focused error summary at the top of the form acts as a jump-list, letting keyboard and screen-reader users navigate directly to each broken field. The entire pattern rests on four mechanisms: `aria-invalid="true"` to flag the field's state, `aria-describedby` to point the field at its error message element, `role="alert"` or `aria-live` on the summary container for immediate announcement, and programmatic focus management that moves the user's context to the first failure point.

## When to use

- Any form where a user can submit incorrect or missing data (login, checkout, account setup, data-entry tools).
- Client-side validation triggered on blur (after a field loses focus) so the user gets feedback before submitting.
- Server-side validation responses after round-trip (AJAX or full-page) — especially when errors cannot be caught in the browser.
- Multi-step flows where a step must be valid before proceeding — show inline errors on the current step, not a global summary.
- System-level failures with a recoverable action: "We couldn't save your draft. Check your connection and try again."

## When NOT to use

- Do not validate while the user is still typing — announcing errors mid-entry interrupts composition and is confusing for screen-reader users. Wait for `blur` or `submit`.
- Do not use `role="alert"` for every tiny status update (character counts, hint text changes). Reserve `alert` for actual failures; use `role="status"` or `aria-live="polite"` for non-critical feedback.
- Do not show an error summary on short single-field forms (a lone search bar, a single email capture) — move focus directly to the field instead.
- Do not rely on color alone. Red borders and red text are invisible to users with deuteranopia. Always pair color with an icon (rendered with `aria-hidden="true"`) and explicit error text. This is the pattern everyone overuses: "red border = done" is not accessible form validation.
- Do not reuse vague system copy as inline field errors. "Something went wrong" belongs in a toast for an unrecoverable network failure, not next to a phone number field.

## How it works

**Inline field error (single field)**

When the field fails validation, three things change simultaneously:
1. `aria-invalid="true"` is set on the `<input>` — screen readers announce the field as invalid when focused.
2. The error message `<span>` is injected (or un-hidden) next to the field and given a unique `id`.
3. `aria-describedby` on the input references that `id` so the screen reader reads the error text after the label when the field is focused.

The message must be in the DOM before the attribute relationship activates. If the field also has a hint (e.g., "Use the format DD/MM/YYYY"), list the hint `id` before the error `id` in `aria-describedby` — screen readers read the list left to right, so put the error first: `aria-describedby="dob-error dob-hint"`.

**Error summary (multi-field)**

On form submit with multiple failures:
1. A summary container (pre-existing in the DOM with `role="alert"` and `aria-atomic="true"`) has its content updated — this triggers an assertive announcement.
2. The summary is populated with a count headline and a list of anchor links, each `href="#field-id"`, so clicking jumps to the field.
3. JavaScript moves keyboard focus to the summary container (`summaryEl.focus()`) so the user lands at the top of the error list without having to scroll. The container needs `tabindex="-1"` to be focusable but not in the natural tab order.

**aria-errormessage note**: The spec defines `aria-errormessage` as the semantically precise attribute for this relationship, but as of mid-2025, NVDA support only arrived in v2024.3, TalkBack has no support, and VoiceOver has display-method caveats. The established safe choice for production remains `aria-describedby` paired with `aria-invalid`. Audit `aria-errormessage` support before adopting it.

**Contrast note**: Error text color must pass WCAG AA (4.5:1 for normal text). In this entry's code, `#B91C1C` on `#FFFFFF` yields **6.47:1** and `#B91C1C` on `#FEF2F2` (the tinted field background) yields **5.91:1** — both pass AA. The red border on the input is a decorative UI affordance, not text, so it does not require a contrast ratio.

## Working code

### Vanilla HTML/CSS/JS — complete self-contained form

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in — Example App</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 1rem;
    line-height: 1.5;
    background: #f8f8f8;
    color: #1a1a1a;
    padding: 2rem 1rem;
  }

  .form-card {
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    max-width: 440px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1.75rem;
    letter-spacing: -0.02em;
  }

  /* ── Error summary ── */
  .error-summary {
    display: none;
    background: #FEF2F2;
    border: 2px solid #B91C1C;
    border-radius: 6px;
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
    outline: none; /* focus ring comes from :focus-visible */
  }

  .error-summary:focus-visible {
    outline: 3px solid #B91C1C;
    outline-offset: 2px;
  }

  .error-summary.visible {
    display: block;
  }

  .error-summary__title {
    font-size: 1rem;
    font-weight: 700;
    color: #B91C1C; /* 6.47:1 on #fff, 5.91:1 on #FEF2F2 — both pass AA */
    margin-bottom: 0.5rem;
  }

  .error-summary__list {
    list-style: none;
    padding: 0;
  }

  .error-summary__list li + li {
    margin-top: 0.25rem;
  }

  .error-summary__list a {
    color: #B91C1C;
    font-weight: 600;
    text-underline-offset: 3px;
  }

  .error-summary__list a:hover {
    text-decoration-thickness: 2px;
  }

  /* ── Field group ── */
  .field {
    margin-bottom: 1.25rem;
  }

  .field label {
    display: block;
    font-weight: 600;
    font-size: 0.9375rem;
    margin-bottom: 0.3rem;
  }

  .field__hint {
    display: block;
    font-size: 0.875rem;
    color: #555;
    margin-bottom: 0.35rem;
  }

  /* Inline error message */
  .field__error {
    display: none;
    font-size: 0.875rem;
    font-weight: 600;
    color: #B91C1C;
    margin-bottom: 0.35rem;
    align-items: center;
    gap: 0.3rem;
  }

  .field__error.visible {
    display: flex;
  }

  /* Error icon — decorative, aria-hidden */
  .field__error-icon {
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
  }

  /* Text input */
  .field input {
    display: block;
    width: 100%;
    padding: 0.6rem 0.75rem;
    font-size: 1rem;
    border: 2px solid #d0d0d0;
    border-radius: 4px;
    background: #fff;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .field input:focus {
    outline: none;
    border-color: #2563EB;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  /* Invalid state: red border + tinted background */
  .field input[aria-invalid="true"] {
    border-color: #B91C1C;
    background: #FEF2F2;
  }

  .field input[aria-invalid="true"]:focus {
    border-color: #B91C1C;
    box-shadow: 0 0 0 3px rgba(185, 28, 28, 0.2);
  }

  /* Submit */
  .btn-primary {
    display: inline-block;
    width: 100%;
    padding: 0.7rem 1.25rem;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    background: #1a1a1a;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 0.5rem;
    transition: background 0.15s ease;
  }

  .btn-primary:hover { background: #333; }

  .btn-primary:focus-visible {
    outline: 3px solid #2563EB;
    outline-offset: 2px;
  }

  /* System error (recoverable — e.g. network failure) */
  .system-error {
    display: none;
    background: #FEF2F2;
    border-left: 4px solid #B91C1C;
    border-radius: 0 4px 4px 0;
    padding: 0.875rem 1rem;
    margin-bottom: 1.25rem;
    font-size: 0.9375rem;
  }

  .system-error.visible { display: block; }

  .system-error__heading {
    font-weight: 700;
    color: #B91C1C;
    margin-bottom: 0.2rem;
  }

  .system-error__body { color: #1a1a1a; }

  .system-error__action {
    font-weight: 600;
    color: #B91C1C;
    text-underline-offset: 2px;
  }
</style>
</head>
<body>

<main>
  <div class="form-card">
    <h1>Sign in to your account</h1>

    <!--
      Error summary:
      - Pre-exists in DOM at page load (empty, hidden).
      - role="alert" + aria-atomic="true" ensures screen readers announce
        the full updated content the moment JS populates it.
      - tabindex="-1" makes it programmatically focusable (JS calls .focus())
        without inserting it into the natural tab order.
    -->
    <div
      id="error-summary"
      class="error-summary"
      role="alert"
      aria-atomic="true"
      aria-labelledby="error-summary-title"
      tabindex="-1"
    >
      <p id="error-summary-title" class="error-summary__title"></p>
      <ul id="error-summary-list" class="error-summary__list"></ul>
    </div>

    <!--
      System error (e.g. server unreachable after submit):
      Also uses role="alert" for immediate announcement.
    -->
    <div id="system-error" class="system-error" role="alert" aria-atomic="true">
      <p class="system-error__heading">We couldn't sign you in</p>
      <p class="system-error__body">
        Our servers aren't responding right now.
        <a class="system-error__action" href="#" id="retry-link">Try again</a>
        or <a class="system-error__action" href="/status">check service status</a>.
      </p>
    </div>

    <form id="signin-form" novalidate>

      <!-- Email field -->
      <div class="field" id="field-email">
        <label for="email">Email address</label>

        <!--
          aria-describedby lists the error ID first (so AT reads it before hint).
          The relationship is only active when the IDs exist in the DOM.
          For this field there's no persistent hint, so only the error ID is listed.
        -->
        <span
          id="email-error"
          class="field__error"
          aria-live="off"
        >
          <svg class="field__error-icon" aria-hidden="true" focusable="false"
               viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012
                 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"/>
          </svg>
          <span id="email-error-text"></span>
        </span>

        <input
          type="email"
          id="email"
          name="email"
          autocomplete="email"
          aria-required="true"
          aria-describedby="email-error-text"
          aria-invalid="false"
          spellcheck="false"
        >
      </div>

      <!-- Password field -->
      <div class="field" id="field-password">
        <label for="password">Password</label>

        <span class="field__hint" id="password-hint">
          Must be at least 8 characters.
        </span>

        <!--
          aria-describedby on the input references error first, then hint.
          Screen reader reads: label → "invalid" → error text → hint text.
        -->
        <span
          id="password-error"
          class="field__error"
          aria-live="off"
        >
          <svg class="field__error-icon" aria-hidden="true" focusable="false"
               viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1
                 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"/>
          </svg>
          <span id="password-error-text"></span>
        </span>

        <input
          type="password"
          id="password"
          name="password"
          autocomplete="current-password"
          aria-required="true"
          aria-describedby="password-error-text password-hint"
          aria-invalid="false"
        >
      </div>

      <button type="submit" class="btn-primary">Sign in</button>
    </form>
  </div>
</main>

<script>
(function () {
  'use strict';

  const form = document.getElementById('signin-form');
  const summary = document.getElementById('error-summary');
  const summaryTitle = document.getElementById('error-summary-title');
  const summaryList = document.getElementById('error-summary-list');

  // ── Field-level validation rules ──────────────────────────────────────────
  const fields = [
    {
      id: 'email',
      errorTextId: 'email-error-text',
      errorSpanId: 'email-error',
      summaryAnchor: 'email',
      validate(val) {
        if (!val.trim())
          return 'Enter your email address';
        // Simple RFC-pragmatic check — backend does the authoritative check
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
          return 'Enter an email address in the format: name@example.com';
        return null;
      },
    },
    {
      id: 'password',
      errorTextId: 'password-error-text',
      errorSpanId: 'password-error',
      summaryAnchor: 'password',
      validate(val) {
        if (!val)
          return 'Enter your password';
        if (val.length < 8)
          return 'Your password must be at least 8 characters';
        return null;
      },
    },
  ];

  // ── Show / clear an inline field error ───────────────────────────────────
  function setFieldError(field, message) {
    const input = document.getElementById(field.id);
    const errorSpan = document.getElementById(field.errorSpanId);
    const errorText = document.getElementById(field.errorTextId);

    if (message) {
      errorText.textContent = message;
      errorSpan.classList.add('visible');
      input.setAttribute('aria-invalid', 'true');
    } else {
      errorText.textContent = '';
      errorSpan.classList.remove('visible');
      input.setAttribute('aria-invalid', 'false');
    }
  }

  // ── Blur validation (punish-late: validate after leaving a field) ─────────
  fields.forEach(function (field) {
    const input = document.getElementById(field.id);
    input.addEventListener('blur', function () {
      // Only validate on blur if the field was previously marked invalid,
      // OR if there was already a summary showing (user has submitted once).
      if (
        input.getAttribute('aria-invalid') === 'true' ||
        summary.classList.contains('visible')
      ) {
        const msg = field.validate(input.value);
        setFieldError(field, msg);
      }
    });
  });

  // ── Submit: validate all, build summary, move focus ───────────────────────
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const errors = [];

    fields.forEach(function (field) {
      const input = document.getElementById(field.id);
      const msg = field.validate(input.value);
      setFieldError(field, msg);
      if (msg) {
        errors.push({ anchor: field.summaryAnchor, message: msg });
      }
    });

    if (errors.length > 0) {
      // Build summary content
      summaryTitle.textContent =
        errors.length === 1
          ? 'There is 1 problem with your sign-in details'
          : 'There are ' + errors.length + ' problems with your sign-in details';

      summaryList.innerHTML = '';
      errors.forEach(function (err) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#' + err.anchor;
        a.textContent = err.message;
        li.appendChild(a);
        summaryList.appendChild(li);
      });

      // Show summary
      summary.classList.add('visible');

      /*
       * Move focus to the summary.
       * The role="alert" + aria-atomic fires the announcement;
       * the .focus() call positions keyboard users at the top of
       * the error list so they can navigate the links.
       * A short delay gives the DOM paint time to complete in
       * older AT/browser combinations.
       */
      setTimeout(function () {
        summary.focus();
      }, 100);

    } else {
      // All valid — clear summary and submit
      summary.classList.remove('visible');
      summaryTitle.textContent = '';
      summaryList.innerHTML = '';

      // Simulate a network failure for demo:
      // document.getElementById('system-error').classList.add('visible');
      // In production, do the actual fetch here.
      console.log('Form is valid, submitting…');
    }
  });

  // ── Summary anchor links: move focus to the field ─────────────────────────
  summaryList.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      e.preventDefault();
      const target = document.getElementById(e.target.getAttribute('href').slice(1));
      if (target) target.focus();
    }
  });

}());
</script>
</body>
</html>
```

### React version — composable field + error summary

```jsx
// ErrorValidationForm.jsx
// Requires React 18+. No external UI library needed.
// Run with: Vite + React template, or paste into a sandbox.

import React, { useRef, useState } from 'react';

// ── Styles (inline for portability; move to CSS module in production) ──────
const css = {
  card: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    maxWidth: 440,
    margin: '2rem auto',
    padding: '2rem',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '1rem',
    lineHeight: 1.5,
    color: '#1a1a1a',
  },
  h1: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.75rem', letterSpacing: '-0.02em' },
  summary: (visible) => ({
    display: visible ? 'block' : 'none',
    background: '#FEF2F2',
    border: '2px solid #B91C1C',
    borderRadius: 6,
    padding: '1rem 1.25rem',
    marginBottom: '1.5rem',
    outline: 'none',
  }),
  summaryTitle: {
    fontWeight: 700,
    color: '#B91C1C', // 5.91:1 on #FEF2F2 — passes WCAG AA
    marginBottom: '0.5rem',
  },
  summaryList: { listStyle: 'none', padding: 0 },
  summaryLink: { color: '#B91C1C', fontWeight: 600, textUnderlineOffset: 3 },
  fieldWrap: { marginBottom: '1.25rem' },
  label: { display: 'block', fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.3rem' },
  hint: { display: 'block', fontSize: '0.875rem', color: '#555', marginBottom: '0.35rem' },
  errorMsg: (visible) => ({
    display: visible ? 'flex' : 'none',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#B91C1C',
    marginBottom: '0.35rem',
  }),
  input: (invalid) => ({
    display: 'block',
    width: '100%',
    padding: '0.6rem 0.75rem',
    fontSize: '1rem',
    border: `2px solid ${invalid ? '#B91C1C' : '#d0d0d0'}`,
    borderRadius: 4,
    background: invalid ? '#FEF2F2' : '#fff',
    fontFamily: 'inherit',
  }),
  submit: {
    display: 'block',
    width: '100%',
    padding: '0.7rem 1.25rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
    background: '#1a1a1a',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
};

// Validation rules — returns null if valid, string if not
const validators = {
  email(val) {
    if (!val.trim()) return 'Enter your email address';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
      return 'Enter an email address in the format: name@example.com';
    return null;
  },
  password(val) {
    if (!val) return 'Enter your password';
    if (val.length < 8) return 'Your password must be at least 8 characters';
    return null;
  },
};

function FieldError({ id, message }) {
  return (
    <span style={css.errorMsg(!!message)} id={id} aria-live="off">
      {message && (
        <>
          <svg
            aria-hidden="true"
            focusable="false"
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="#B91C1C"
            style={{ flexShrink: 0 }}
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {message}
        </>
      )}
    </span>
  );
}

export default function SignInForm() {
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: null, password: null });
  const [submitted, setSubmitted] = useState(false);
  const summaryRef = useRef(null);

  const FIELDS = [
    { key: 'email',    label: 'Email address',  type: 'email',    autocomplete: 'email',            hint: null },
    { key: 'password', label: 'Password',        type: 'password', autocomplete: 'current-password', hint: 'Must be at least 8 characters.' },
  ];

  function validate(key, value) {
    return validators[key] ? validators[key](value) : null;
  }

  function handleBlur(key) {
    // Re-validate on blur only if form was already submitted or field is dirty-invalid
    if (submitted || errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: validate(key, values[key]) }));
    }
  }

  function handleChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear error as user types after submit, once they start correcting
    if (submitted && errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);

    const newErrors = {};
    FIELDS.forEach(({ key }) => {
      newErrors[key] = validate(key, values[key]);
    });
    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors) {
      // Focus the summary after React re-renders
      setTimeout(() => {
        if (summaryRef.current) summaryRef.current.focus();
      }, 50);
    } else {
      console.log('Valid — submit to server');
    }
  }

  const summaryErrors = FIELDS.map(({ key, label }) =>
    errors[key] ? { key, message: errors[key] } : null
  ).filter(Boolean);

  const hasErrors = summaryErrors.length > 0;

  function focusField(id) {
    const el = document.getElementById(id);
    if (el) el.focus();
  }

  return (
    <div style={css.card}>
      <h1 style={css.h1}>Sign in to your account</h1>

      {/* Error summary */}
      <div
        ref={summaryRef}
        style={css.summary(hasErrors && submitted)}
        role="alert"
        aria-atomic="true"
        aria-labelledby="summary-title"
        tabIndex={-1}
      >
        <p id="summary-title" style={css.summaryTitle}>
          {summaryErrors.length === 1
            ? 'There is 1 problem with your sign-in details'
            : `There are ${summaryErrors.length} problems with your sign-in details`}
        </p>
        <ul style={css.summaryList}>
          {summaryErrors.map(({ key, message }) => (
            <li key={key}>
              <a
                href={`#${key}`}
                style={css.summaryLink}
                onClick={(e) => { e.preventDefault(); focusField(key); }}
              >
                {message}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {FIELDS.map(({ key, label, type, autocomplete, hint }) => {
          const errorId = `${key}-error`;
          const hintId = hint ? `${key}-hint` : null;
          // Compose aria-describedby: error first, then hint
          const describedBy = [errors[key] ? errorId : null, hintId]
            .filter(Boolean)
            .join(' ') || undefined;

          return (
            <div key={key} style={css.fieldWrap}>
              <label htmlFor={key} style={css.label}>
                {label}
              </label>
              {hint && (
                <span id={hintId} style={css.hint}>
                  {hint}
                </span>
              )}
              <FieldError id={errorId} message={errors[key]} />
              <input
                id={key}
                name={key}
                type={type}
                autoComplete={autocomplete}
                value={values[key]}
                required
                aria-required="true"
                aria-invalid={errors[key] ? 'true' : 'false'}
                aria-describedby={describedBy}
                style={css.input(!!errors[key])}
                onChange={(e) => handleChange(key, e.target.value)}
                onBlur={() => handleBlur(key)}
              />
            </div>
          );
        })}

        <button type="submit" style={css.submit}>
          Sign in
        </button>
      </form>
    </div>
  );
}
```

## Variations

**Inline-only (no summary)**: For short forms (1–3 fields), skip the summary; on submit, move focus directly to the first invalid field. The error message beside the field + `aria-invalid` is sufficient. The error stays visible until the user corrects the field.

**Blur-punish-late**: Validate on `blur`, not on `input`. Do not show an error while the user is actively typing. Once they tab out, validate and — if invalid — show the error immediately. If they return and correct the field, clear the error on `blur` again (not on each keystroke). This is the Smashing Magazine "reward-early, punish-late" pattern.

**Server-side summary**: After a full-page reload due to server validation, the page `<title>` should be prefixed: `"Error: Sign in — Example App"`. The error summary renders as static HTML (no JS needed). Focus is not automatically moved on full-page load — the page-title change alerts screen-reader users on load.

**System / network error (recoverable)**: A separate `role="alert"` panel above the form (not replacing it). Specific: "We couldn't save your progress. Your connection dropped — check your network and try saving again." Never: "Something went wrong." Two distinct elements: the heading names the failure, the body names the action.

**Validation with a character count**: A live counter (`role="status"`, `aria-live="polite"`) for character limits is a separate concern from the error state. Do not use `role="alert"` for it — it is not urgent. Only flip to error styling + `aria-invalid` if the user submits while over the limit.

## Accessibility

**prefers-reduced-motion**: Nothing in this pattern relies on motion. The error border color change and error message appearance are instant CSS property changes with no transition. If you add a transition (e.g., `opacity` fade on error appearance), wrap it in a motion query:

```css
@media (prefers-reduced-motion: no-preference) {
  .field__error {
    transition: opacity 0.15s ease;
  }
}
/* reduced-motion: error appears instantly at full opacity */
.field__error.visible {
  opacity: 1;
}
```

**Contrast**: Error text color `#B91C1C` on white `#FFFFFF` = **6.47:1** (passes AA and AAA for normal text). On the tinted field background `#FEF2F2` = **5.91:1** (passes AA). The red border on the input is a decorative affordance — not text — so it is not subject to the 4.5:1 text contrast requirement, but it should not be the sole indicator of an error state.

**Color-not-alone rule**: Never use only red color to indicate an error. The pattern always pairs: (1) the red border on the input, (2) a text error message adjacent to the field, and (3) an icon (rendered `aria-hidden="true"` so it does not double-announce in AT). Keyboard-only and color-blind users rely on the text.

**Focus management**: On form submission with errors, `summaryEl.focus()` (or `summaryRef.current.focus()`) moves keyboard position to the top of the error list. The `tabindex="-1"` on the summary container is required — without it, programmatic `.focus()` is ignored in some browsers. The summary links then let users navigate to each broken field.

**aria-invalid**: Set to `"false"` (not absent) on valid fields after correction. Screen readers distinguish `aria-invalid="false"` from `aria-invalid="true"` and from the attribute being absent — being explicit prevents stale announcements. Do not set `aria-invalid="true"` before the user has ever interacted with the field (on initial render all fields should be `"false"` or the attribute omitted).

**aria-describedby ordering**: If a field has both an error message and a hint, list the error `id` first: `aria-describedby="email-error password-hint"`. Screen readers read the `describedby` list in attribute order. Error context is more urgent than hint context.

**Screen reader announcements — two mechanisms, one job**:
- `aria-invalid` + `aria-describedby` triggers when the user focuses the field — they hear label + "invalid" + error text.
- `role="alert"` on the summary triggers the moment the content is updated — it announces without requiring focus to move there. Together they ensure the error is communicated both at-field and system-wide.

**Keyboard**: All interactive elements (inputs, summary links, submit button) are in natural tab order. The summary links use `<a href="#">` + click handler; the focus moves programmatically to the target input, giving keyboard users a one-key fix path after reading the summary.

**Touch / pointer**: The form is touch-native. The blur event fires on iOS when the user taps out of a field (after `touchend`). There are no hover-only error reveals — error text is always persistent once shown. Tap target sizes should be at minimum 44×44 CSS pixels for buttons (the submit button at `padding: 0.7rem` on a `1rem` body meets this).

## Performance

- No animation or GPU layers are involved; error states are pure DOM + CSS class toggles.
- `role="alert"` content injection via `textContent` / `innerHTML` is synchronous and cheap. The 50–100 ms delay before `.focus()` is not a setTimeout-for-perf anti-pattern; it gives React (or browser paint) a tick to flush the DOM update before focus is moved.
- Avoid injecting the entire error summary via `innerHTML` in a tight loop — build the list via `createElement` / JSX to avoid XSS if any error string comes from user input echoed back by the server.
- Keep the error container in the DOM at all times (hidden via `display:none` or CSS class). Creating and appending a new `role="alert"` element with content already set does not trigger an announcement in most AT — the container must pre-exist.

## Anti-slop

The cliche version (cross-ref `_slop-blocklist.md` → Color, Copy):

- **Color**: Generic `#EF4444` (Tailwind red-500) on white is overused and yields only 3.95:1 — it fails WCAG AA for text. Grabbing the default red is both a taste failure and an accessibility failure. This entry uses `#B91C1C` (red-700) which yields 6.47:1 on white and 5.91:1 on the tinted field background.
- **Copy**: "Something went wrong" / "Invalid input" / "This field is required" are the lorem ipsum of error messages. They tell the user nothing actionable. Compare: "Enter your email address" (empty field) vs "Enter an email address in the format: name@example.com" (wrong format). The second takes 2 extra seconds to write and eliminates a support ticket. For system errors: "We couldn't sign you in — our servers aren't responding. Try again or check service status" vs "An error occurred."
- **Structure**: Showing errors only in a toast that auto-dismisses after 3 seconds is an accessibility catastrophe — users on slow connections, screen magnifiers, and screen readers cannot react before it disappears. Toast errors must either persist or live alongside permanent inline messaging.
- The tasteful version: specific, blame-free error text; red that actually passes contrast; errors that stay visible until fixed; a summary that links directly to each broken field; no "Oops!" or "Uh-oh!" unless your product is a children's app.

## Pairs well with

- **Empty states** (same bucket): when a form saves to an empty list, the success transition leads directly into the empty-state pattern.
- **Toasts & notifications** (same bucket): system errors (network loss, server timeout) are announced via `role="alert"` — the same mechanism used here, but in a visually separate toast component for non-blocking messages.
- **Loading & skeletons** (same bucket): while a form is submitting, disable the submit button and show a spinner/loading state to prevent double-submit; on server error, transition from loading state back to the error state.
- **Progress & steppers** (same bucket): multi-step forms that combine per-step validation with a stepper UI — the error state here applies at each step boundary.
- **Microcopy** (same bucket): the exact wording of error messages is the highest-leverage microcopy in a product. The field-level copy pairs with hint text written to prevent the error before it occurs ("Enter the email you used to sign up").

## Current references

- [MDN — aria-invalid attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid) — authoritative reference on values, associated roles, and AT behavior
- [MDN — ARIA alert role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role) — when `role="alert"` fires, how it differs from `aria-live="assertive"`, and the critical pre-existence rule
- [W3C — ARIA19: Using role=alert or live regions to identify errors](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA19) — the canonical W3C technique with annotated code example
- [TetraLogical — Foundations: form validation and error messages (October 2024)](https://tetralogical.com/blog/2024/10/21/foundations-form-validation-and-error-messages/) — grounded practical guide covering timing, aria-describedby, and microcopy
- [TetraLogical — Why are my live regions not working? (May 2024)](https://tetralogical.com/blog/2024/05/01/why-are-my-live-regions-not-working/) — common AT bugs with aria-live: pre-existence, timing, clear-before-update
- [GOV.UK Design System — Error summary](https://design-system.service.gov.uk/components/error-summary/) — the gold-standard public implementation: focus management, HTML structure, microcopy rules
- [GOV.UK Design System — Error message](https://design-system.service.gov.uk/components/error-message/) — per-field error pattern, "Error:" visually-hidden prefix, microcopy table
- [Smashing Magazine — A guide to accessible form validation (February 2023)](https://www.smashingmagazine.com/2023/02/guide-accessible-form-validation/) — aria-required, aria-invalid, aria-describedby, and live-region timing in one article
- [Smashing Magazine — A complete guide to live validation UX (September 2022)](https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/) — reward-early/punish-late timing pattern; the cost of over-eager inline validation
- [Bogdan Cerovac — aria-errormessage support is getting better, but not there yet (June 2024)](https://cerovac.com/a11y/2024/06/support-for-aria-errormessage-is-getting-better-but-still-not-there-yet/) — AT support breakdown for `aria-errormessage` vs `aria-describedby` as of 2024; why `aria-describedby` remains the safe choice
- [WebAIM — Accessible form validation](https://webaim.org/techniques/formvalidation/) — overview of error timing, focus management strategies, and AT behavior expectations
