# Microcopy & UX writing

> The small, specific words on buttons, labels, errors, and empty states that tell a user exactly what to do next — and what will happen when they do it.

**Bucket:** component | system
**Maturity:** evergreen
**Effort:** low
**Best for:** apps, dashboards, websites, portfolios

## What it is

Microcopy is every word a user reads while operating a UI: button labels, form hints, error messages, empty-state headlines, confirmation dialog copy, tooltip text, and loading descriptions. Unlike marketing copy, whose job is persuasion, microcopy's job is orientation — it answers "what do I do?" and "what just happened?" without the user having to ask. Good microcopy collapses the distance between intent and action; bad microcopy adds a guessing step. The user perceives a product with good microcopy as fast, trustworthy, and obvious; they experience bad microcopy as friction without knowing why.

## When to use

- Every interactive control: if a label could be misread or mapped to the wrong outcome, rewrite it.
- Validation and error states: whenever the system rejects input, it must explain what was wrong and how to fix it.
- Empty states: a blank list or zero-results page needs a reason (nothing exists yet) and, when appropriate, a recovery action (add the first item).
- Confirmation dialogs for destructive or irreversible actions: deleting, revoking access, canceling a paid subscription.
- Onboarding tooltips and coach marks: when a feature is non-obvious and training wheels genuinely save time.
- Anywhere a loading or progress indicator holds a user's attention: the wait copy keeps trust alive.

## When NOT to use

- Do not add microcopy to compensate for a confusing information architecture — the words cannot fix a navigation problem.
- Do not write confirmation dialogs for reversible actions; use an undo affordance instead. Dialog fatigue causes users to click through warnings without reading them.
- Avoid tooltips on features that are actually self-explanatory; extra words increase cognitive load rather than reducing it.
- Do not use the same tone for every moment — celebratory copy on an error screen reads as mocking.
- Everyone overuses vague aspirational labels ("Get started", "Unlock potential", "Explore") on primary CTAs; these are the #1 microcopy anti-pattern and signal a product that has not done user research.

## How it works

Microcopy operates by removing inference. A user reading "Delete" has to infer what is deleted, whether it is reversible, and whether this is the action they wanted. A user reading "Delete project — cannot be undone" has no inference to perform. The fewer cognitive steps between reading a label and acting on it, the higher the completion rate and the lower the support burden.

The practical principles:

- **Verb + object, not noun alone.** "Save draft" beats "Save"; "Send invoice" beats "Submit"; "Remove from team" beats "Delete".
- **Match the outcome, not the interaction.** A button that initiates a checkout flow should say "Continue to payment", not "Next" (interaction) or "Buy now" (premature outcome).
- **Error messages are instructions, not apologies.** State what went wrong (cause), then what to do (fix). Never lead with "Oops" or "Something went wrong" as the complete message.
- **Empty states have two jobs.** Explain why the space is empty, then give the user a path forward when one exists.
- **Tone scales to severity.** Neutral for routine actions, calm and direct for errors, warm but not giddy for success.
- **One term, used consistently.** If a concept is called "workspace" in the nav, it must be "workspace" in every label and error — not "project", "team", or "account" used interchangeably.

Key ARIA mechanism: when microcopy updates dynamically (form errors injected by JS, toast notifications, progress updates), the live-region trio of `role="alert"` / `role="status"` / `aria-live` determines whether a screen reader announces the update immediately or waits for a pause in speech. Assertive (`role="alert"`) is reserved for errors and urgent warnings; polite (`role="status"`, `aria-live="polite"`) covers success messages, progress updates, and count changes. Crucially, the container must be in the DOM on page load — added empty — so the browser has already "primed" the live region before content is injected into it.

## Working code

### Vanilla HTML/CSS/JS — form with inline validation and accessible error copy

This is a self-contained, runnable document. It demonstrates: specific error copy (not generic), `aria-describedby` binding field to error, `role="alert"` pre-seeded in DOM, `aria-invalid`, and focus management on submit.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Microcopy demo — inline validation</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f0f13;
      color: #e8e8f0;
      font-family: "Inter", system-ui, sans-serif;
      font-size: 1rem;
    }

    .form-card {
      width: min(420px, 100% - 2rem);
      background: #1a1a24;
      border: 1px solid #2a2a38;
      border-radius: 12px;
      padding: 2rem;
    }

    h1 {
      margin: 0 0 1.5rem;
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      margin-bottom: 1.25rem;
    }

    label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #b4b4c8;
    }

    input {
      background: #0f0f13;
      border: 1px solid #2a2a38;
      border-radius: 6px;
      color: #e8e8f0;
      font-size: 1rem;
      padding: 0.625rem 0.75rem;
      width: 100%;
    }

    input:focus {
      outline: 2px solid #6366f1;
      outline-offset: 2px;
      border-color: transparent;
    }

    /* Red border when aria-invalid */
    input[aria-invalid="true"] {
      border-color: #f87171;
    }

    /* Error message */
    .error-msg {
      font-size: 0.8125rem;
      color: #f87171;
      min-height: 1.25em; /* reserve space so layout doesn't shift */
      display: block;
    }

    /* Hint copy below a field (non-error) */
    .hint {
      font-size: 0.8125rem;
      color: #7878a0;
    }

    /* Primary button */
    .btn-primary {
      appearance: none;
      background: #6366f1;
      border: none;
      border-radius: 6px;
      color: #fff;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      padding: 0.75rem 1.25rem;
      width: 100%;
      /* Minimum 44x44 touch target */
      min-height: 44px;
    }

    @media (prefers-reduced-motion: no-preference) {
      input { transition: border-color 0.15s; }
      .btn-primary { transition: background 0.15s, transform 0.1s; }
      .btn-primary:active { transform: scale(0.98); }
    }

    .btn-primary:hover { background: #4f52e0; }
    .btn-primary:focus-visible {
      outline: 2px solid #a5b4fc;
      outline-offset: 3px;
    }
    .btn-primary:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    /* Success banner */
    .success-banner {
      display: none;
      background: #14532d;
      border: 1px solid #166534;
      border-radius: 6px;
      color: #86efac;
      font-size: 0.9rem;
      margin-top: 1rem;
      padding: 0.75rem 1rem;
    }

    /* sr-only utility */
    .sr-only {
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px;
    }
  </style>
</head>
<body>
<div class="form-card">
  <h1>Create your account</h1>

  <form id="signup-form" novalidate>
    <!-- Email field -->
    <div class="field">
      <label for="email">Work email</label>
      <input
        type="email"
        id="email"
        name="email"
        autocomplete="email"
        aria-describedby="email-error"
        aria-required="true"
      >
      <!--
        Pre-seeded in DOM at page load so the live region is already
        registered before JS injects error text.
      -->
      <span id="email-error" class="error-msg" role="alert" aria-atomic="true"></span>
    </div>

    <!-- Password field -->
    <div class="field">
      <label for="password">Password</label>
      <input
        type="password"
        id="password"
        name="password"
        autocomplete="new-password"
        aria-describedby="password-hint password-error"
        aria-required="true"
      >
      <span id="password-hint" class="hint">At least 10 characters. One number or symbol required.</span>
      <span id="password-error" class="error-msg" role="alert" aria-atomic="true"></span>
    </div>

    <!--
      Button copy: specific about the outcome.
      NOT "Submit" / NOT "Get started" / NOT "Continue"
    -->
    <button type="submit" class="btn-primary" id="submit-btn">
      Create account
    </button>

    <!--
      Success — role="status" (polite, not assertive)
      because it is not an emergency announcement.
    -->
    <div
      id="success-msg"
      class="success-banner"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      Account created. Check your email to verify your address.
    </div>
  </form>
</div>

<script>
(function () {
  const form   = document.getElementById('signup-form');
  const emailEl  = document.getElementById('email');
  const passEl   = document.getElementById('password');
  const emailErr = document.getElementById('email-error');
  const passErr  = document.getElementById('password-error');
  const success  = document.getElementById('success-msg');
  const submitBtn = document.getElementById('submit-btn');

  /* ---------- validation rules with specific copy ---------- */
  function validateEmail(value) {
    if (!value) return 'Enter your work email address.';
    if (!value.includes('@') || !value.includes('.'))
      return 'Enter a valid email — for example, name@company.com.';
    return '';
  }

  function validatePassword(value) {
    if (!value) return 'Enter a password.';
    if (value.length < 10) return 'Password must be at least 10 characters.';
    if (!/[\d!@#$%^&*]/.test(value))
      return 'Add at least one number or symbol (!, @, #, etc.).';
    return '';
  }

  /* ---------- field-level feedback helpers ---------- */
  function setError(input, errorEl, message) {
    // Clear first — guarantees re-announcement even for the same message
    errorEl.textContent = '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (message) {
      // Micro-delay lets the DOM clear before re-inserting
      requestAnimationFrame(() => { errorEl.textContent = message; });
    }
  }

  function clearError(input, errorEl) {
    setError(input, errorEl, '');
  }

  /* ---------- validate-on-blur (not on keydown — avoids premature errors) */
  emailEl.addEventListener('blur', () => {
    setError(emailEl, emailErr, validateEmail(emailEl.value.trim()));
  });

  passEl.addEventListener('blur', () => {
    setError(passEl, passErr, validatePassword(passEl.value));
  });

  /* ---------- submit ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const eErr = validateEmail(emailEl.value.trim());
    const pErr = validatePassword(passEl.value);

    setError(emailEl, emailErr, eErr);
    setError(passEl, passErr, pErr);

    if (eErr || pErr) {
      // Move focus to the first invalid field so keyboard/SR users land on it
      (eErr ? emailEl : passEl).focus();
      return;
    }

    /* Simulate async submit */
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account…';

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create account';
      success.style.display = 'block';
      form.reset();
      clearError(emailEl, emailErr);
      clearError(passEl, passErr);
    }, 1200);
  });
})();
</script>
</body>
</html>
```

### Confirmation dialog — microcopy for a destructive action

Note the specificity of the headline, body, and button labels. The cancel button uses the action the user is considering abandoning so they can re-orient without re-reading the page.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Confirmation dialog demo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: #0f0f13; color: #e8e8f0;
      font-family: "Inter", system-ui, sans-serif;
    }
    .trigger-btn {
      appearance: none; background: #dc2626; border: none;
      border-radius: 6px; color: #fff; cursor: pointer;
      font-size: 1rem; font-weight: 600;
      padding: 0.75rem 1.5rem; min-height: 44px;
    }
    .trigger-btn:hover { background: #b91c1c; }
    .trigger-btn:focus-visible {
      outline: 2px solid #fca5a5; outline-offset: 3px;
    }

    /* Backdrop */
    .dialog-backdrop {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(2px);
      align-items: center; justify-content: center;
      z-index: 100;
    }
    .dialog-backdrop.open { display: flex; }

    /* Dialog box */
    dialog {
      background: #1a1a24;
      border: 1px solid #2a2a38;
      border-radius: 12px;
      color: #e8e8f0;
      margin: 0;
      max-width: 400px;
      padding: 1.75rem;
      width: min(400px, 100vw - 2rem);
    }
    dialog h2 {
      font-size: 1.125rem; font-weight: 600;
      margin: 0 0 0.625rem;
    }
    dialog p {
      color: #9898b8; font-size: 0.9rem;
      line-height: 1.5; margin: 0 0 1.5rem;
    }
    .dialog-actions {
      display: flex; flex-direction: column; gap: 0.625rem;
    }
    .btn-destructive {
      appearance: none; background: #dc2626; border: none;
      border-radius: 6px; color: #fff; cursor: pointer;
      font-size: 0.9375rem; font-weight: 600;
      padding: 0.7rem 1rem; min-height: 44px;
    }
    .btn-destructive:hover { background: #b91c1c; }
    .btn-destructive:focus-visible {
      outline: 2px solid #fca5a5; outline-offset: 3px;
    }
    .btn-cancel {
      appearance: none; background: transparent;
      border: 1px solid #2a2a38; border-radius: 6px;
      color: #b4b4c8; cursor: pointer;
      font-size: 0.9375rem; font-weight: 500;
      padding: 0.7rem 1rem; min-height: 44px;
    }
    .btn-cancel:hover { border-color: #4a4a60; color: #e8e8f0; }
    .btn-cancel:focus-visible {
      outline: 2px solid #6366f1; outline-offset: 3px;
    }
    @media (prefers-reduced-motion: no-preference) {
      .trigger-btn { transition: background 0.15s; }
      .btn-destructive { transition: background 0.15s; }
      .btn-cancel { transition: border-color 0.15s, color 0.15s; }
    }
  </style>
</head>
<body>

<button class="trigger-btn" id="open-dialog">
  Remove project
</button>

<!--
  Backdrop wraps the native <dialog> element.
  Native <dialog> provides: focus trap, Escape key, role="dialog" implicitly.
-->
<div class="dialog-backdrop" id="backdrop" role="presentation">
  <dialog
    id="confirm-dialog"
    aria-labelledby="dlg-title"
    aria-describedby="dlg-body"
  >
    <!--
      Headline: states exactly what is about to happen.
      NOT "Are you sure?" / NOT "Warning" / NOT "Confirm action"
    -->
    <h2 id="dlg-title">Remove "Brand Refresh 2025"?</h2>
    <p id="dlg-body">
      All files, comments, and activity in this project will be permanently
      deleted. You cannot undo this.
    </p>

    <div class="dialog-actions">
      <!--
        Destructive CTA: mirrors the trigger label so there's no ambiguity.
        NOT "Yes" / NOT "OK" / NOT "Confirm"
      -->
      <button class="btn-destructive" id="confirm-btn">
        Yes, remove project
      </button>
      <!--
        Cancel label: names what the user is choosing to keep doing.
        NOT "No" / NOT "Cancel" alone
      -->
      <button class="btn-cancel" id="cancel-btn">
        Keep project
      </button>
    </div>
  </dialog>
</div>

<script>
(function () {
  const openBtn  = document.getElementById('open-dialog');
  const backdrop = document.getElementById('backdrop');
  const dlg      = document.getElementById('confirm-dialog');
  const cancelBtn = document.getElementById('cancel-btn');
  const confirmBtn = document.getElementById('confirm-btn');

  let previousFocus = null;

  function openDialog() {
    previousFocus = document.activeElement;
    backdrop.classList.add('open');
    dlg.showModal();           // native <dialog> traps focus and blocks scroll
    cancelBtn.focus();         // land on the safe action first
  }

  function closeDialog() {
    dlg.close();
    backdrop.classList.remove('open');
    if (previousFocus) previousFocus.focus(); // return focus to trigger
  }

  openBtn.addEventListener('click', openDialog);
  cancelBtn.addEventListener('click', closeDialog);
  confirmBtn.addEventListener('click', () => {
    /* handle deletion, then close */
    closeDialog();
    alert('Project removed.');  // replace with real handler
  });

  /* Escape key is handled by native <dialog>, but close the backdrop too */
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeDialog();
  });

  /* Click outside dialog to close */
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeDialog();
  });
})();
</script>
</body>
</html>
```

### React component — toast notification with role="status"

```jsx
import { useState, useEffect, useRef } from "react";

/*
  Toast variants:
    "success" → role="status" aria-live="polite"
    "error"   → role="alert"  aria-live="assertive"

  Accessible name: uses specific action-outcome copy, not "Success!" alone.
*/

const ICONS = {
  success: "✓",
  error: "✕",
};

const DURATIONS = {
  success: 4000,
  error: 6000,   // errors linger longer — user may need to act
};

function Toast({ message, type = "success", onDismiss }) {
  const ref = useRef(null);

  useEffect(() => {
    const timer = setTimeout(onDismiss, DURATIONS[type]);
    return () => clearTimeout(timer);
  }, [type, onDismiss]);

  return (
    <div
      ref={ref}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.625rem",
        background: type === "error" ? "#450a0a" : "#052e16",
        border: `1px solid ${type === "error" ? "#7f1d1d" : "#14532d"}`,
        borderRadius: 8,
        color: type === "error" ? "#fca5a5" : "#86efac",
        fontSize: "0.9rem",
        maxWidth: 360,
        padding: "0.75rem 1rem",
        position: "fixed",
        bottom: "1.25rem",
        right: "1.25rem",
      }}
    >
      <span aria-hidden="true" style={{ fontWeight: 700, flexShrink: 0 }}>
        {ICONS[type]}
      </span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          appearance: "none",
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          fontSize: "1rem",
          lineHeight: 1,
          opacity: 0.7,
          padding: "0 0.25rem",
          flexShrink: 0,
          minWidth: 44,
          minHeight: 44,
        }}
      >
        ×
      </button>
    </div>
  );
}

/* Usage demo */
export default function App() {
  const [toast, setToast] = useState(null);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <button
        onClick={() =>
          setToast({
            type: "success",
            // Specific: names what was saved, not just "Saved!"
            message: "Invoice #1042 saved as a draft. You can send it from the Invoices tab.",
          })
        }
        style={{ marginRight: "1rem" }}
      >
        Save draft
      </button>
      <button
        onClick={() =>
          setToast({
            type: "error",
            // Specific: tells user what failed and what to do next
            message: "Draft not saved — you're offline. Reconnect and try again.",
          })
        }
      >
        Simulate error
      </button>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
```

## Variations

**Button label specificity levels**

The knob is how much outcome information the label carries:

| Level | Example | Use when |
|---|---|---|
| Generic (avoid) | "Submit" | Never the right choice for a primary action |
| Action-only | "Save" | Fine for clearly bounded contexts (a settings save button next to an obvious settings form) |
| Action + object | "Save draft" | Default for most primary CTAs |
| Action + object + context | "Send invoice to Acme Corp" | When multiple same-type entities are present; confirmation dialogs |
| Action + consequence | "Delete — cannot be undone" | Destructive actions without a dialog |

**Error message structure**

- **Cause-only** (minimum): "Password must be at least 10 characters." — states what the rule is.
- **Cause + fix** (standard): "Password must be at least 10 characters. Add more characters and try again." — rarely needed; the rule implies the fix.
- **Cause + example** (helpful for format fields): "Enter a valid date — for example, 14 Mar 2025." — for date, phone, card number fields where format errors are common.
- **Never** lead with apology: "Oops, something went wrong." is the complete message — offers no recovery path.

**Empty-state variants**

- **Blank canvas** (user-initiated): "No projects yet. Create your first project to get started." + primary action button labelled "Create project" (not "Get started", not "Let's go").
- **Zero results** (search/filter): "No invoices match 'March draft'. Try a different date range or clear the filter." — names the search term so the user knows the system understood them.
- **Permission wall**: "You need Edit access to see this board. Ask an owner to invite you." + "Request access" button — not "Access denied."
- **Loading empty** (data not yet arrived): use a skeleton, not an empty state; do not show "Nothing here" while data is in flight.

**Confirmation dialog severity tiers**

- **Soft** (reversible): Skip the dialog entirely; offer an undo toast for 5–8 seconds after the action.
- **Medium** (data loss, recoverable from backup): One-step dialog with specific copy; cancel is the default-focused control.
- **Hard** (permanent deletion, subscription cancellation): Require the user to type the resource name to enable the destructive button — deliberate friction, not just a confirm click.

## Accessibility

### WCAG 2.5.3 label in name

WCAG 2.5.3 (Level A) requires that the accessible name of any interactive control whose label is visible text must *contain* that visible text — and ideally start with it. This is a voice-control requirement: Dragon NaturallySpeaking and iOS Voice Control activate controls by matching the spoken phrase to the accessible name.

Failure pattern — visible label and accessible name diverge:

```html
<!-- Fails 2.5.3: visible text is "Remove member", aria-label overrides it entirely -->
<button aria-label="Delete team member John Doe">Remove member</button>
```

Correct pattern — accessible name starts with the visible text:

```html
<!-- Passes: accessible name starts with visible text, extends it for context -->
<button aria-label="Remove member — John Doe, Editor">Remove member</button>
```

When the visible label is already fully descriptive, no `aria-label` is needed. Add one only to extend, not replace.

### aria-live and role choices for dynamic microcopy

```html
<!-- Pre-seed both containers at page load. DO NOT inject the element itself later. -->

<!-- Errors: assertive — announce immediately, interrupt current speech -->
<span id="email-error" role="alert" aria-atomic="true"></span>

<!-- Progress / success: polite — wait for a pause -->
<div id="save-status" role="status" aria-live="polite" aria-atomic="true"></div>
```

Re-announcement of the same message (user submits again without fixing): clear the text node to empty, then set it again — the DOM change triggers re-reading even if the string is identical.

```js
function announce(el, message) {
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = message; });
}
```

### Focus management

After dismissing a dialog, return focus to the element that opened it:

```js
const previousFocus = document.activeElement;
dialog.showModal();
// on close:
dialog.close();
previousFocus.focus();
```

After a form submit error, move focus to the first invalid field — not to the error container (which `role="alert"` already announces automatically):

```js
const firstInvalid = form.querySelector('[aria-invalid="true"]');
if (firstInvalid) firstInvalid.focus();
```

### Contrast

Inline error text at `#f87171` on `#1a1a24` card background: the contrast ratio is approximately 7.94:1, well above WCAG AA (4.5:1) for small text. Hint text at `#7878a0` on `#1a1a24` is approximately 3.82:1 — use this only for supplementary text that is not the sole carrier of meaning (WCAG AA requires 4.5:1 for body text; decorative or redundant hint text has no ratio requirement, but check your specific surfaces before shipping). The primary action button uses `#ffffff` on `#6366f1`: that ratio is approximately 5.74:1, which passes WCAG AA for normal text at all sizes. If AAA compliance (7:1) is required, `#4f46e5` can optionally be used as the button background.

### Motion and reduced-motion

Microcopy components that animate in (toast slide-up, error shake) must respect `prefers-reduced-motion`. Show/hide the content without animation; do not substitute "faster" motion — any motion can still trigger vestibular issues.

```css
@media (prefers-reduced-motion: no-preference) {
  .toast {
    animation: slide-up 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
}
/* No animation block at all — static display:block is the reduced fallback */

@keyframes slide-up {
  from { transform: translateY(0.75rem); opacity: 0; }
  to   { transform: translateY(0);       opacity: 1; }
}
```

### Touch / pointer fallback

Error dismiss buttons and dialog close controls must meet the 44×44 px minimum touch target (WCAG 2.5.5). The inline styles and CSS in the examples above set `min-height: 44px` explicitly. For icon-only buttons (×), the visible icon can be smaller as long as the clickable area meets the minimum.

## Performance

Microcopy itself has no meaningful rendering cost, but the patterns around it can:

- **Dynamic text injection** causes a layout recalculation on the affected element and its in-flow siblings. Reserve space for error messages with `min-height` on the error container (as shown above) to prevent cumulative layout shift (CLS).
- **`backdrop-filter: blur()` on dialog backdrops** is GPU-composite but expensive on low-power devices. Test on mid-range Android hardware before shipping. The dialog example uses a modest `blur(2px)` — acceptable; heavy blur (12px+) on a full-screen overlay is a CLS/GPU budget risk.
- **Toast animations** should only animate `transform` and `opacity` (no `height`, `width`, or `top`/`bottom` — those trigger layout).
- **Multiple simultaneous `role="alert"` announcements** will race — screen readers interrupt each other. Queue toasts with a brief sequential delay (300–500 ms between injections) rather than showing several at once.
- **Bundle cost is zero** — these patterns are HTML/CSS/vanilla JS. React wrappers add only the cost of the framework you are already using.

## Anti-slop

The cliche (see `_slop-blocklist.md` → COPY): vague headline-label words — "Unlock", "Empower", "Seamless", "Supercharge", "Get started", "Elevate" — used in CTAs, empty states, and confirmation dialogs. These are the AI-generated SaaS defaults that signal no user research was done.

Before/after rewrites:

| Context | Cliche | Specific rewrite |
|---|---|---|
| Empty state headline | "Empower your workflow" | "No automations yet" |
| Empty state CTA | "Get started" | "Create your first automation" |
| Onboarding CTA | "Unlock your potential" | "Connect your calendar" |
| Primary CTA | "Supercharge your team" | "Invite team members" |
| Error headline | "Oops, something went wrong" | "Payment declined by your bank" |
| Error body | "Please try again later" | "Check your card details or use a different card." |
| Confirmation headline | "Are you sure?" | "Delete 'Q3 Report'?" |
| Confirmation body | "This action cannot be undone." | "This file and all 14 comments will be permanently removed." |
| Confirmation cancel | "No" | "Keep file" |
| Confirmation confirm | "Yes" | "Delete file" |
| Success toast | "Success!" | "Report published. Your team can see it now." |
| Loading copy | "Loading…" | "Fetching your invoices…" |
| Button (generic) | "Submit" | "Request a demo" |
| Button (process) | "Continue" | "Continue to payment" |

The meta-rule: every piece of microcopy should answer "which specific thing?" and "what specifically happens next?". If either answer is "it depends", the copy is not finished.

## Pairs well with

- `empty-states` — the blank-canvas variant is pure microcopy; the action button label is the most important word on a zero-state screen.
- `error-validation-states` — inline validation is the execution layer; microcopy is the content layer. The two are inseparable.
- `toast-notifications` — toast copy lives and dies on specificity; "Saved" vs "Invoice #1042 saved" is the difference between trust and anxiety.
- `loading-skeleton` — loading copy ("Fetching your reports…") sits alongside skeletons; the two together set user expectations during wait states.
- `onboarding-coach-marks` — coach mark body copy follows the same rules: verb + object, no "Seamless" filler, one idea per tooltip.
- `confirmation-dialogs` — the entire pattern is a microcopy problem disguised as a component pattern.

## Current references

- [Smashing Magazine — How to improve your microcopy: UX writing tips for non-UX writers (2024)](https://www.smashingmagazine.com/2024/06/how-improve-microcopy-ux-writing-tips-non-ux-writers/) — concrete principles with role-playable copy, button specificity, and anti-patterns
- [MDN — ARIA: alert role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role) — authoritative reference on assertive live regions and error announcement
- [MDN — ARIA: status role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role) — polite live regions for non-urgent updates
- [MDN — ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) — full guidance on aria-live, aria-atomic, aria-relevant
- [W3C WAI — Understanding WCAG 2.5.3 Label in Name](https://www.w3.org/WAI/WCAG21/Understanding/label-in-name.html) — voice-control requirement tying visible label to accessible name
- [W3C WAI — Labeling Controls tutorial](https://www.w3.org/WAI/tutorials/forms/labels/) — label vs aria-label vs aria-labelledby hierarchy
- [Phrase — Internationalization beyond code: real-world language challenges](https://phrase.com/blog/posts/internationalization-beyond-code-a-developers-guide-to-real-world-language-challenges/) — string expansion rates by language, button sizing constraints
- [Nielsen Norman Group — Confirmation dialogs can prevent user errors (if not overused)](https://www.nngroup.com/articles/confirmation-dialog/) — 8 design guidelines covering when to use confirmations, action-specific button labels ("Delete file" / "Keep file" over generic Yes/No), and the cost of overuse that trains users to dismiss without reading
- [WebAIM Million 2024 Report](https://webaim.org/projects/million/) — ARIA errors correlate with more accessibility issues when misused; empty buttons a top barrier on 29%+ of tested pages
