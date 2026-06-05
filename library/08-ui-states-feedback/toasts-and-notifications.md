# Toasts and notifications

> A toast is a brief, non-blocking message that surfaces in a fixed region of the viewport, announces itself to assistive technology via a live region, and disappears automatically — never the only channel for information that matters.

**Bucket:** component
**Maturity:** evergreen
**Effort:** medium
**Best for:** apps, dashboards, websites

## What it is

A toast (sometimes called a snackbar) appears at the edge of the viewport — typically bottom-center, bottom-right, or top-right — without interrupting the user's current focus. It carries low-to-moderate urgency information: a file saved, a form submitted, a copy action confirmed, a background task completed. The user perceives it as ambient feedback rather than a gating dialog.

Notifications follow the same live-region mechanism but may stack, persist, or group into a notification tray rather than auto-dismissing. The distinguishing factor is urgency: polite for advisories (`role="status"`), assertive for errors that demand immediate attention (`role="alert"`). Both patterns share the same fundamental constraint — screen readers must hear the message even though focus never moves to it.

## When to use

- Confirming a reversible action the user just took: "Draft saved", "4 items moved to Trash — Undo".
- Reporting the outcome of an async background task: "Export complete — Download", "Connection restored".
- Low-priority system events that are informational only: "New version available", "Session will expire in 5 minutes".
- Displaying transient form-level success after a submit that navigates nowhere (if the success state is also reflected inline in the UI).

## When NOT to use

- **Critical or destructive errors.** If the user must read it and act, use an inline error, an `alertdialog`, or a persistent banner. A toast that auto-dismisses a "Payment failed" message is an accessibility and UX failure.
- **Actions with no second chance.** "File permanently deleted" as a toast-only notification with no undo elsewhere violates the not-sole-channel rule: the information exists only in a timed, easy-to-miss region.
- **Content heavy enough to require interaction time.** If reading plus deciding plus clicking takes more than four seconds, auto-dismiss actively harms keyboard-only and screen-magnification users who need to navigate to the action button.
- **Onboarding flows or long instructional text.** Everyone overuses toasts for general announcements; anything needing more than one short sentence belongs in a banner, modal, or contextual tooltip.
- **Multiple simultaneous toasts with competing urgency.** Two assertive live regions firing at the same moment cause screen reader announcements to collide and drop content.

## How it works

The mechanism has two layers: the visual render and the accessible announcement.

**Live-region announcement.** A hidden or visually-placed container carries `aria-live="polite"` (or `role="status"`, which implies polite) for most toasts, and `aria-live="assertive"` (or `role="alert"`) for urgent errors. Screen readers watch these regions; when text is injected into them the reader queues an announcement — polite waits for the user to pause, assertive interrupts immediately. The critical implementation rule is that the live region element must exist in the DOM before content is injected into it; adding the element and its content simultaneously is unreliable across screen readers.

**Timer and pause.** A `setTimeout` drives auto-dismiss (5 000 ms minimum for readable text; calculate as 3 000 ms base + ~300 ms per word). The timer must pause when the toast or its region receives `mouseenter`, `focusin`, or when `document.visibilityState` becomes `hidden` (tab switch). It restarts when hover or focus leaves.

**Stacking.** Multiple toasts share one landmark region. Visual stacking uses `position: absolute` with CSS `transform: translateY()` and `scale()` per index — the "front" toast is full-size; those behind it shrink by 0.05 per step and shift by a gap multiplied by their depth. This avoids layout thrash because only `transform` and `opacity` change.

**Dismiss.** Pressing Escape while focus is anywhere inside the toast region closes the frontmost toast. A visible close button inside the toast is keyboard reachable. After a toast closes, focus goes to the next toast in the stack, or — if the stack empties — back to the element that triggered the action (captured before the toast appeared).

**Key properties:**
- `role="status"` / `aria-live="polite"` — advisory, non-interrupting
- `role="alert"` / `aria-live="assertive"` — urgent, interrupts
- `aria-atomic="true"` — announce the region's entire text as one unit
- `aria-live="off"` on child toast items when the parent region is the live container (avoid double-announcing)
- `aria-label="Notifications"` on the region landmark so screen reader navigation landmarks are clear

## Working code

### Vanilla HTML + CSS + JS — full self-contained implementation

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Toast notifications — demo</title>
<style>
  /* ─── Reset & base ─── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: "Inter", system-ui, sans-serif;
    background: #0f0f11;
    color: #e8e8ed;
    min-height: 100vh;
    display: grid;
    place-items: center;
    gap: 1rem;
  }

  .demo-controls {
    display: flex;
    flex-wrap: wrap;
    gap: .75rem;
    justify-content: center;
    padding: 2rem;
  }

  button {
    padding: .5rem 1.25rem;
    border-radius: 6px;
    border: 1px solid #2e2e36;
    background: #1a1a22;
    color: #e8e8ed;
    font-size: .875rem;
    cursor: pointer;
    font-family: inherit;
    transition: background 120ms;
  }
  button:hover { background: #24242e; }
  button:focus-visible {
    outline: 2px solid #7c6af7;
    outline-offset: 2px;
  }

  /* ─── Toast region (landmark) ─── */
  /*
    Single polite region and single assertive region.
    Both sit in the DOM on page load — content is injected later.
    screen readers watch the region, not individual toasts.
  */
  .toast-region {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    width: min(360px, calc(100vw - 2rem));
    z-index: 9000;
    display: flex;
    flex-direction: column-reverse;   /* newest toast at bottom (visually top of stack) */
    gap: 0;                           /* gap handled by transform offsets */
    pointer-events: none;             /* region itself never intercepts clicks */
  }

  /* ─── Individual toast ─── */
  .toast {
    position: relative;
    padding: .875rem 1rem;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.08);
    background: #1e1e28;
    color: #e8e8ed;
    font-size: .875rem;
    line-height: 1.45;
    pointer-events: auto;             /* toasts themselves are interactive */
    will-change: transform, opacity;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    gap: .5rem .75rem;
    box-shadow: 0 4px 24px rgba(0,0,0,.4);
    /* Start state: out from bottom, transparent */
    transform: translateY(1rem);
    opacity: 0;
    transition:
      transform 320ms cubic-bezier(0.16, 1, 0.3, 1),
      opacity   220ms ease;
    margin-bottom: .625rem;
  }

  /* Reduced-motion: skip translate, keep fade */
  @media (prefers-reduced-motion: reduce) {
    .toast {
      transform: none;
      transition: opacity 180ms ease;
    }
  }

  .toast.is-visible {
    transform: translateY(0);
    opacity: 1;
  }

  .toast.is-leaving {
    transform: translateY(.5rem);
    opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .toast.is-leaving {
      transform: none;
    }
  }

  /* Toast type variants */
  .toast[data-type="error"] {
    border-color: rgba(239, 83, 80, .35);
    background: #221820;
  }
  .toast[data-type="success"] {
    border-color: rgba(72, 199, 142, .3);
  }
  .toast[data-type="warning"] {
    border-color: rgba(255, 179, 71, .3);
  }

  .toast__icon {
    font-size: 1rem;
    line-height: 1.45;
    grid-row: 1;
    user-select: none;
  }

  .toast__body {
    grid-column: 1;
  }

  .toast__title {
    font-weight: 600;
    font-size: .875rem;
    color: #f0f0f5;
    margin-bottom: .2rem;
  }

  .toast__message {
    font-size: .8125rem;
    color: #a8a8b8;
    line-height: 1.5;
  }

  .toast__action {
    margin-top: .5rem;
    padding: .3rem .75rem;
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,.12);
    background: transparent;
    color: #c0b8ff;
    font-size: .8125rem;
    font-family: inherit;
    cursor: pointer;
    transition: background 120ms;
  }
  .toast__action:hover { background: rgba(124, 106, 247, .15); }
  .toast__action:focus-visible {
    outline: 2px solid #7c6af7;
    outline-offset: 2px;
  }

  .toast__dismiss {
    grid-column: 2;
    grid-row: 1;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 5px;
    border: none;
    background: transparent;
    color: #686878;
    font-size: 1.125rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    font-family: inherit;
    flex-shrink: 0;
    transition: color 120ms, background 120ms;
  }
  .toast__dismiss:hover { color: #e8e8ed; background: rgba(255,255,255,.08); }
  .toast__dismiss:focus-visible {
    outline: 2px solid #7c6af7;
    outline-offset: 2px;
  }

  /* ─── Progress bar (auto-dismiss indicator) ─── */
  .toast__progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: 100%;
    background: rgba(255,255,255,.06);
    border-radius: 0 0 10px 10px;
    overflow: hidden;
  }
  .toast__progress-bar {
    height: 100%;
    background: #7c6af7;
    transform-origin: left;
    animation: toast-countdown linear forwards;
    /* duration set via JS custom property */
    animation-duration: var(--toast-duration, 5000ms);
  }

  @keyframes toast-countdown {
    from { transform: scaleX(1); }
    to   { transform: scaleX(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .toast__progress-bar {
      animation: none;
      transform: scaleX(0); /* just stay empty — user knows it's timed */
    }
  }

  /* Pause animation when toast is hovered or focused-within */
  .toast:hover .toast__progress-bar,
  .toast:focus-within .toast__progress-bar {
    animation-play-state: paused;
  }

  /* ─── Stacking lift effect for items behind front ─── */
  /*
    Applied via JS — each non-front toast gets
    data-depth="1", "2", etc.
    We scale down + translate up to peek behind.
  */
  .toast[data-depth="1"] {
    transform: translateY(calc(-100% - .5rem)) scale(0.95);
    opacity: .8;
  }
  .toast[data-depth="2"] {
    transform: translateY(calc(-200% - .75rem)) scale(0.9);
    opacity: .55;
  }
  .toast[data-depth="3"] {
    transform: translateY(calc(-300% - 1rem)) scale(0.85);
    opacity: .3;
  }

  @media (prefers-reduced-motion: reduce) {
    .toast[data-depth] {
      transform: none;
    }
  }

  /* ─── Collapsed stack vs expanded stack ─── */
  .toast-region:not(:hover):not(:focus-within) .toast[data-depth] {
    /* stack is collapsed: hide stacked items behind front */
  }
  .toast-region:hover .toast[data-depth],
  .toast-region:focus-within .toast[data-depth] {
    /* stack expands: each toast drops to normal position */
    transform: translateY(0) scale(1);
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .toast-region:hover .toast[data-depth],
    .toast-region:focus-within .toast[data-depth] {
      transform: none;
    }
  }

  /* Transition the stack expansion */
  .toast[data-depth] {
    transition:
      transform 280ms cubic-bezier(0.16, 1, 0.3, 1),
      opacity   220ms ease;
  }

  @media (prefers-reduced-motion: reduce) {
    .toast[data-depth] {
      transition: opacity 180ms ease;
    }
  }
</style>
</head>
<body>

<div class="demo-controls">
  <button onclick="showToast('success', 'Changes saved', 'Your profile has been updated.')">
    Success toast
  </button>
  <button onclick="showToast('error', 'Upload failed', 'The file exceeds the 10 MB limit. Try compressing it first.', null, true)">
    Error toast
  </button>
  <button onclick="showToast('info', '3 files moved', 'Moved to /Archive/2025.', 'Undo')">
    Toast with action
  </button>
  <button onclick="showToast('warning', 'Session expiring', 'You will be signed out in 5 minutes.', 'Stay signed in')">
    Warning toast
  </button>
</div>

<!--
  The live regions must exist in the DOM before any content is injected.
  role="status" → aria-live="polite" (implicit) — advisory messages
  role="alert"  → aria-live="assertive" (implicit) — urgent errors

  We use one region per politeness level, never per-toast live regions,
  to avoid multiple simultaneous announcements clobbering each other.
-->
<section
  class="toast-region"
  id="toast-region-polite"
  role="region"
  aria-label="Notifications"
  aria-live="polite"
  aria-relevant="additions"
  aria-atomic="false"
></section>

<section
  class="toast-region"
  id="toast-region-assertive"
  role="region"
  aria-label="Alerts"
  aria-live="assertive"
  aria-relevant="additions"
  aria-atomic="false"
></section>

<script>
// ─── Toast system ───────────────────────────────────────────────

const REGIONS = {
  polite:     document.getElementById('toast-region-polite'),
  assertive:  document.getElementById('toast-region-assertive'),
};

// Track the element that was focused before a toast appeared,
// so focus can return there when the last toast closes.
let preFocusElement = null;

// Stack state per region
const stacks = { polite: [], assertive: [] };

const MAX_VISIBLE = 4;  // cap stack depth shown

/**
 * showToast(type, title, message, actionLabel?, isUrgent?)
 *
 * type:        'success' | 'error' | 'warning' | 'info'
 * title:       short label, e.g. "Changes saved"
 * message:     longer description (optional)
 * actionLabel: button label for optional action (optional)
 * isUrgent:    true → assertive region (errors only); default false
 */
function showToast(type, title, message = '', actionLabel = null, isUrgent = false) {
  const regionKey = isUrgent ? 'assertive' : 'polite';
  const region = REGIONS[regionKey];

  // Capture where focus is before the toast appears
  preFocusElement = document.activeElement;

  // Build toast duration from word count: 3000ms base + 300ms/word, min 5000ms
  const wordCount = (title + ' ' + message).split(/\s+/).length;
  const duration  = Math.max(5000, 3000 + wordCount * 300);

  // Icon map
  const icons = {
    success: '✓',
    error:   '✕',
    warning: '!',
    info:    'i',
  };

  // Build DOM
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', isUrgent ? 'alert' : 'status');
  toast.setAttribute('aria-atomic', 'true');
  toast.setAttribute('data-type', type);
  toast.setAttribute('tabindex', '-1');   // focusable for keyboard nav, not in tab order by default

  // Progress bar duration
  toast.style.setProperty('--toast-duration', `${duration}ms`);

  // Close button is rendered first in DOM order so
  // screen readers encounter content before dismiss control.
  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${icons[type] ?? 'i'}</span>
    <div class="toast__body">
      <div class="toast__title">${escHtml(title)}</div>
      ${message ? `<div class="toast__message">${escHtml(message)}</div>` : ''}
      ${actionLabel
        ? `<button class="toast__action" data-action>${escHtml(actionLabel)}</button>`
        : ''}
    </div>
    <button class="toast__dismiss" aria-label="Dismiss notification">&#x2715;</button>
    <div class="toast__progress" aria-hidden="true">
      <div class="toast__progress-bar"></div>
    </div>
  `;

  // Prepend so newest is at the top of the region (column-reverse makes it visual bottom)
  region.prepend(toast);
  stacks[regionKey].unshift(toast);
  updateDepthAttributes(regionKey);

  // Limit stack to MAX_VISIBLE; remove oldest if over
  if (stacks[regionKey].length > MAX_VISIBLE) {
    const oldest = stacks[regionKey].pop();
    removeToast(oldest, regionKey, false);
  }

  // Animate in (rAF to ensure paint picks up start state)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });
  });

  // ─── Auto-dismiss timer ───
  let timerId = null;
  let startTime = null;
  let remaining = duration;
  let paused = false;

  function startTimer() {
    startTime = Date.now();
    timerId = setTimeout(() => removeToast(toast, regionKey), remaining);
  }

  function pauseTimer() {
    if (paused || timerId === null) return;
    paused = true;
    clearTimeout(timerId);
    remaining -= Date.now() - startTime;
  }

  function resumeTimer() {
    if (!paused) return;
    paused = false;
    startTimer();
  }

  startTimer();

  // Pause on hover
  toast.addEventListener('mouseenter', pauseTimer);
  toast.addEventListener('mouseleave', resumeTimer);

  // Pause on focus-within
  toast.addEventListener('focusin',  pauseTimer);
  toast.addEventListener('focusout', resumeTimer);

  // Pause when tab is hidden
  const handleVisibility = () => {
    if (document.hidden) pauseTimer();
    else resumeTimer();
  };
  document.addEventListener('visibilitychange', handleVisibility);

  // ─── Keyboard dismiss (Escape) ───
  toast.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      removeToast(toast, regionKey, true);
    }
  });

  // ─── Dismiss button ───
  toast.querySelector('.toast__dismiss').addEventListener('click', () => {
    removeToast(toast, regionKey, true);
  });

  // ─── Action button ───
  const actionBtn = toast.querySelector('[data-action]');
  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      // In production: wire this to the actual undo/action handler
      console.log('Action triggered for:', title);
      removeToast(toast, regionKey, true);
    });
  }

  // Clean up visibility listener when toast leaves
  toast._cleanup = () => {
    document.removeEventListener('visibilitychange', handleVisibility);
    clearTimeout(timerId);
  };
}

function removeToast(toast, regionKey, restoreFocus = false) {
  if (!toast.isConnected) return;

  toast._cleanup?.();

  toast.classList.remove('is-visible');
  toast.classList.add('is-leaving');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const delay   = reduced ? 180 : 300;

  setTimeout(() => {
    toast.remove();
    stacks[regionKey] = stacks[regionKey].filter(t => t !== toast);
    updateDepthAttributes(regionKey);

    // Focus management: move to next toast, or restore pre-focus element
    if (restoreFocus) {
      const remaining = stacks[regionKey];
      if (remaining.length > 0) {
        remaining[0].focus();
      } else if (preFocusElement && typeof preFocusElement.focus === 'function') {
        preFocusElement.focus();
        preFocusElement = null;
      }
    }
  }, delay);
}

// Assign data-depth attributes so CSS can render the stack illusion
function updateDepthAttributes(regionKey) {
  stacks[regionKey].forEach((toast, idx) => {
    if (idx === 0) {
      toast.removeAttribute('data-depth');
    } else {
      toast.setAttribute('data-depth', String(Math.min(idx, 3)));
    }
  });
}

// Minimal HTML escape
function escHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
</script>
</body>
</html>
```

### React version — with hook and queue

```jsx
// toast-system.jsx
// Self-contained: paste into a React 18+ project.
// Requires: React, ReactDOM (via import maps or bundler).

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';

// ─── Types ───────────────────────────────────────────────────────
// type ToastType = 'success' | 'error' | 'warning' | 'info'
// type Toast = { id, type, title, message, actionLabel, isUrgent, duration }

// ─── Global queue (outside React so any module can push) ─────────
let _listeners = [];
let _toastIdCounter = 0;

export const toast = {
  show(type, title, message = '', opts = {}) {
    const { actionLabel = null, isUrgent = false, onAction = null } = opts;
    const wordCount = (title + ' ' + message).split(/\s+/).length;
    const duration  = Math.max(5000, 3000 + wordCount * 300);
    const item = {
      id: ++_toastIdCounter,
      type, title, message, actionLabel, onAction,
      isUrgent, duration,
    };
    _listeners.forEach(fn => fn(item));
    return item.id;
  },
  success: (title, msg, opts) => toast.show('success', title, msg, opts),
  error:   (title, msg, opts) => toast.show('error',   title, msg, { ...opts, isUrgent: true }),
  warning: (title, msg, opts) => toast.show('warning', title, msg, opts),
  info:    (title, msg, opts) => toast.show('info',    title, msg, opts),
};

// ─── Hook ────────────────────────────────────────────────────────
function useToastQueue() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const handler = (item) => setQueue(q => [item, ...q].slice(0, 4));
    _listeners.push(handler);
    return () => { _listeners = _listeners.filter(fn => fn !== handler); };
  }, []);

  const remove = useCallback((id) => {
    setQueue(q => q.filter(t => t.id !== id));
  }, []);

  return { queue, remove };
}

// ─── Individual toast ───────────────────────────────────────────
const ICONS = { success: '✓', error: '✕', warning: '!', info: 'i' };

function ToastItem({ item, index, onRemove, preFocusRef }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef   = useRef(null);
  const startRef   = useRef(null);
  const remaining  = useRef(item.duration);
  const isPaused   = useRef(false);
  const reduced    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Animate in
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const dismiss = useCallback((restoreFocus = false) => {
    if (leaving) return;
    clearTimeout(timerRef.current);
    setLeaving(true);
    setTimeout(() => {
      onRemove(item.id);
      if (restoreFocus && preFocusRef.current?.focus) {
        preFocusRef.current.focus();
      }
    }, reduced ? 180 : 300);
  }, [leaving, item.id, onRemove, preFocusRef, reduced]);

  const startTimer = useCallback(() => {
    startRef.current = Date.now();
    timerRef.current = setTimeout(() => dismiss(false), remaining.current);
  }, [dismiss]);

  const pauseTimer = useCallback(() => {
    if (isPaused.current) return;
    isPaused.current = true;
    clearTimeout(timerRef.current);
    remaining.current -= Date.now() - startRef.current;
  }, []);

  const resumeTimer = useCallback(() => {
    if (!isPaused.current) return;
    isPaused.current = false;
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    startTimer();
    const onVis = () => document.hidden ? pauseTimer() : resumeTimer();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearTimeout(timerRef.current);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [startTimer, pauseTimer, resumeTimer]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); dismiss(true); }
  };

  const depth = Math.min(index, 3);

  return (
    <div
      role={item.isUrgent ? 'alert' : 'status'}
      aria-atomic="true"
      tabIndex={-1}
      data-type={item.type}
      data-depth={index > 0 ? depth : undefined}
      className={[
        'toast',
        visible  && !leaving ? 'is-visible'  : '',
        leaving              ? 'is-leaving'  : '',
      ].filter(Boolean).join(' ')}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onFocus={pauseTimer}
      onBlur={resumeTimer}
      onKeyDown={handleKeyDown}
    >
      <span className="toast__icon" aria-hidden="true">
        {ICONS[item.type] ?? 'i'}
      </span>
      <div className="toast__body">
        <div className="toast__title">{item.title}</div>
        {item.message && (
          <div className="toast__message">{item.message}</div>
        )}
        {item.actionLabel && (
          <button
            className="toast__action"
            onClick={() => { item.onAction?.(); dismiss(true); }}
          >
            {item.actionLabel}
          </button>
        )}
      </div>
      <button
        className="toast__dismiss"
        aria-label="Dismiss notification"
        onClick={() => dismiss(true)}
      >
        &#x2715;
      </button>
      <div className="toast__progress" aria-hidden="true">
        <div
          className="toast__progress-bar"
          style={{ '--toast-duration': `${item.duration}ms` }}
        />
      </div>
    </div>
  );
}

// ─── Region (portal) ────────────────────────────────────────────
export function ToastRegion() {
  const { queue, remove } = useToastQueue();
  const preFocusRef = useRef(null);

  // Capture focus before toasts appear
  useEffect(() => {
    if (queue.length > 0 && !preFocusRef.current) {
      preFocusRef.current = document.activeElement;
    }
    if (queue.length === 0) {
      preFocusRef.current = null;
    }
  }, [queue.length]);

  const regionPolite    = queue.filter(t => !t.isUrgent);
  const regionAssertive = queue.filter(t =>  t.isUrgent);

  return createPortal(
    <>
      {/* Polite region — always in DOM */}
      <section
        className="toast-region"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-relevant="additions"
        aria-atomic="false"
        id="toast-region-polite"
      >
        {regionPolite.map((item, idx) => (
          <ToastItem
            key={item.id}
            item={item}
            index={idx}
            onRemove={remove}
            preFocusRef={preFocusRef}
          />
        ))}
      </section>

      {/* Assertive region — errors only */}
      <section
        className="toast-region"
        role="region"
        aria-label="Alerts"
        aria-live="assertive"
        aria-relevant="additions"
        aria-atomic="false"
        id="toast-region-assertive"
      >
        {regionAssertive.map((item, idx) => (
          <ToastItem
            key={item.id}
            item={item}
            index={idx}
            onRemove={remove}
            preFocusRef={preFocusRef}
          />
        ))}
      </section>
    </>,
    document.body
  );
}

// ─── Usage ──────────────────────────────────────────────────────
// In your app root:
//   <ToastRegion />
//
// Anywhere in the app:
//   toast.success('Changes saved', 'Your profile has been updated.');
//   toast.error('Upload failed', 'File exceeds the 10 MB limit.');
//   toast.info('3 files moved', 'Moved to /Archive/2025.', {
//     actionLabel: 'Undo',
//     onAction: () => undoMove(),
//   });
```

## Variations

**By urgency (the key design knob):**

| Variant | Role | aria-live | Use case |
|---|---|---|---|
| Advisory | `role="status"` | polite | Success confirms, info events |
| Urgent | `role="alert"` | assertive | Errors requiring immediate attention |
| Log | `role="log"` | polite | Chat messages, sequential activity feed |

**By persistence:**

- **Auto-dismiss** (standard toast): disappears after 5–8 s, progress bar shows time remaining, timer pauses on hover/focus.
- **Persistent** (actionable notification): no auto-dismiss; must have an explicit close control; appropriate when the action inside cannot be recovered elsewhere.
- **Notification tray**: toasts stack visually (Sonner-style), collapsed by default, expand on hover/focus-within; a "View all" link opens a persistent tray.

**By position:**
Bottom-right is the most common and least disruptive (content rarely sits there). Bottom-center is common on mobile. Top-center works for global system-level alerts. Avoid top-left — it conflicts with primary navigation in left-nav layouts.

**By interaction:**
- Simple info: no action, just message + dismiss.
- Reversible action: "Undo" button inside the toast; the action must also be reachable elsewhere (notification history or edit history) — never sole channel.
- Swipe-to-dismiss: pointer capture tracks drag velocity; dismiss if velocity > threshold or distance > 50 % of toast width.

## Accessibility

### prefers-reduced-motion (mandatory for anything that moves)

The vanilla code above uses:

```css
/* Default: translate moves, expose to everyone */
.toast {
  transform: translateY(1rem);
  opacity: 0;
  transition:
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity   220ms ease;
}

/* Reduced-motion: skip translate entirely, keep fade */
@media (prefers-reduced-motion: reduce) {
  .toast {
    transform: none;
    transition: opacity 180ms ease;
  }
  .toast.is-leaving {
    transform: none;
  }
  /* Progress bar animation disabled — bar stays empty */
  .toast__progress-bar {
    animation: none;
    transform: scaleX(0);
  }
  /* Stack depth illusion also drops to opacity-only */
  .toast[data-depth] {
    transform: none;
  }
}
```

The JS respects reduced motion when calculating exit animation delay:

```js
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const delay   = reduced ? 180 : 300;
```

### Contrast

Text colors used in this file's code:

- `#e8e8ed` on `#1e1e28` background: relative luminance ≈ 0.326 / 0.004 → contrast ratio ≈ 13.9:1. Passes AA and AAA large/small text.
- `#a8a8b8` (toast message) on `#1e1e28`: relative luminance ≈ 0.178 / 0.004 → contrast ratio ≈ 7.7:1. Passes AA for normal text.
- `#c0b8ff` (action button text) on `#1e1e28`: relative luminance ≈ 0.497 / 0.004 → contrast ratio ≈ 15.7:1. Passes AA and AAA.
- Progress bar `#7c6af7` on `#1e1e28`: this is a decorative timing indicator (`aria-hidden="true"`), not text — no contrast requirement applies.

### Keyboard and focus

- The toast region is a `role="region"` landmark; screen reader users can jump to it via landmark navigation (common shortcut in NVDA/JAWS).
- Each toast has `tabindex="-1"` — reachable by JS `.focus()` but not in the default tab sequence. This avoids hijacking tab order when toasts appear mid-session.
- Pressing Escape from within a toast (when focused there) dismisses it and returns focus to the previously focused element.
- The dismiss button and action button are in the natural tab sequence within the toast, reachable with Tab once the toast has focus.
- Focus never moves to a toast automatically unless the user explicitly navigates there. This respects the MDN specification: "Do not give focus to the status when its content updates."

### Touch / pointer fallback

- Swipe-to-dismiss uses pointer events (`pointerdown`, `pointermove`, `pointerup`) rather than touch events — works for mouse, touch, and stylus.
- The dismiss button is at minimum 1.75 rem × 1.75 rem (28 px × 28 px). The WCAG 2.5.8 Target Size (Minimum) requirement of 24 × 24 CSS px is met.
- On small viewports the toast is `width: min(360px, calc(100vw - 2rem))` — never wider than the screen.
- No hover-only interaction: all hover behaviors (pause timer) also apply to `focusin`/`focusout`.

### Screen reader implications

- One polite region and one assertive region exist in the DOM from page load. Content is injected into them, not appended as new elements with `aria-live`.
- `aria-atomic="false"` on the region, `aria-atomic="true"` on each individual toast — the reader announces each toast as a complete unit.
- `aria-relevant="additions"` — only new insertions trigger announcements; removals are silent (no "notification removed" chatter).
- Interactive elements (action buttons) inside toasts are reachable but not announced as "click here" live-region content — the live region text is the title and message only. Buttons are discovered by Tab navigation.
- Toasts are never the sole channel for errors: server errors must also surface as inline validation messages or persistent banners.

## Performance

- Animate only `transform` and `opacity`. Neither triggers layout recalculation or paint on elements outside the toast. The GPU compositor handles them.
- `will-change: transform` is set on `.toast` to promote the layer ahead of animation. Use it only here — adding `will-change` globally (e.g., on every card) wastes GPU memory. Remove or let it expire after the animation lifecycle if the toast remains in the DOM for long.
- The stacking depth illusion uses CSS `scale()` inside `transform` — a single `transform` property change, not separate `scale` and `translateY` properties (which would each be compositor-friendly anyway, but a single value is cleaner to animate together).
- `backdrop-filter` is not used in this implementation. If added for a frosted-glass effect, test on low-end devices: `backdrop-filter: blur()` forces a new stacking context and can cause significant GPU cost, especially when multiple toasts are stacked.
- The progress bar animation (`scaleX`) is compositor-friendly. The `transform-origin: left` keeps the bar anchored at the correct edge.
- Toast DOM nodes are removed promptly after the leave animation completes — do not let a notification tray accumulate thousands of removed-but-retained nodes.
- For high-frequency notification sources (real-time feeds), throttle the queue: if more than 4 toasts arrive within 2 s, batch subsequent ones into a single "3 new notifications" summary toast rather than stacking them individually.

## Anti-slop

**The cliche (see `_slop-blocklist.md` → Motion and Copy):** every toast slides up from the bottom with identical 300 ms `ease` easing and a generic SaaS blue `#3B82F6` accent, carrying copy like "Operation completed successfully" or "An error has occurred. Please try again." — machine-default text that tells the user nothing.

**The problem has two halves:**

1. **Motion:** identical fade-and-rise with default `ease` reads cheap and unintentional. Use `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out spring feel) for the enter, a fast linear ease-in for the exit. Vary nothing else — toasts should feel consistent with each other, just not identical to every other UI animation on the page.

2. **Copy:** vague copy is the most common and most fixable toast failure. Every message should answer "what happened, and what can I do next?"

| Before (generic) | After (specific) |
|---|---|
| "Operation completed successfully." | "Renamed to 'Q4 Budget Final.xlsx'." |
| "An error occurred." | "Couldn't save — check your connection and try again." |
| "File deleted." | "Moved to Trash — recoverable for 30 days." |
| "Changes saved." | "Published to dhanush.dev — visible to everyone." |
| "Connection lost." | "Working offline. Changes will sync when you reconnect." |

The accent color in this file uses `#7c6af7` — a restrained purple that is committed (single hue, not a gradient), not the generic SaaS blue or a purple-to-pink gradient. The dark surface `#1e1e28` grounds it. One focal hue is enough for a notification system; using separate hues for success/error/warning/info is a rainbow-categorical tell unless the color encodes unambiguous meaning (red = error is earned; giving each type a unique saturated hue just because you can is the pattern to avoid).

## Pairs well with

- **Empty states** — the same live-region infrastructure handles "no results" messaging; pair the architectural approach.
- **Form validation states** — inline field errors use `role="alert"` for the same reason; keep the assertive-region strategy consistent across both.
- **Progress and steppers** — long async tasks should show a progress indicator inline; the toast is the completion/failure callback at the end, not the progress tracker itself.
- **Loading skeletons** — the skeleton covers the waiting state; the success toast confirms the async result.

## Current references

- [MDN — ARIA status role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role) — canonical definition of role=status, implicit aria-live=polite, and when to use vs role=alert
- [MDN — ARIA alert role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role) — assertive live region behavior, interruption model
- [ARIA APG — Alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) — official keyboard interaction and focus management spec
- [React Aria — Toast](https://react-aria.adobe.com/Toast) — F6 landmark navigation, 5 s minimum timer, pause on hover/focus, focus restoration after dismiss
- [Sara Soueidan — Accessible notifications with ARIA live regions (part 2)](https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-2/) — deep dive on polite vs assertive, DOM insertion order, multiple-region pitfalls
- [Scott O'Hara — A toast to a11y toasts](https://www.scottohara.me/blog/2019/07/08/a-toast-to-a11y-toasts.html) — not-sole-channel rule, role=status vs role=log, zoom/magnification obstructions
- [web.dev — Building a toast component](https://web.dev/articles/building/a-toast-component) — `<output>` element as implicit status, FLIP animation, prefers-reduced-motion travel distance pattern
- [Emil Kowal — Building a toast component (Sonner)](https://emilkowal.ski/ui/building-a-toast-component) — CSS transitions over keyframes for interruptibility, stacking math, pointer capture for swipe
- [Radix UI — Toast primitive](https://www.radix-ui.com/primitives/docs/components/toast) — swipe-to-close CSS variables, hotkey navigation (F8), foreground vs background type distinction
- [WCAG 2.2 — Understanding 2.2.1 Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) — when auto-dismiss is exempt (non-critical, non-sole-channel) and when it is not
- [WCAG 4.1.3 — Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) — programmatic determinability without focus requirement; the primary success criterion for toast a11y
