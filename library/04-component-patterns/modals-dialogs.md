# Modals & dialogs

> A layer that interrupts the current context to demand a focused decision or display critical information, trapping keyboard focus inside until the user explicitly dismisses it.

**Bucket:** component
**Maturity:** evergreen
**Effort:** medium
**Best for:** websites, apps, dashboards, portfolios

## What it is

A modal dialog is a secondary window that appears on top of the primary content, making everything behind it visually obscured and programmatically inert — meaning keyboard focus, pointer events, and screen-reader navigation are confined to the dialog until it is dismissed. The user perceives a temporary interruption: the page dims, a card or panel slides or fades into the viewport center, and all previous interaction is suspended. Non-modal dialogs (sidesheets, toasts, inline notifications) do not trap focus and are a different component.

The browser's native `<dialog>` element paired with `showModal()` now handles the hardest parts automatically — top-layer stacking, backdrop rendering, Esc key binding, and automatic inertness of background content — removing the need for the 400-line custom implementations that were standard pre-2022. What remains manual: scroll lock, backdrop-click dismiss, initial focus placement strategy, and exit animations.

## When to use

- Destructive or irreversible actions requiring explicit confirmation: "Delete project — this cannot be undone."
- Short, self-contained tasks where leaving the page feels disruptive: editing a single field, selecting a date range, confirming a payment.
- Critical alerts that need an immediate user response before the workflow can continue (use `role="alertdialog"` for these).
- Authentication prompts, permission requests, or cookie consent that must be resolved before content is accessible.
- Image or video lightboxes where the surrounding page context should recede.

## When NOT to use

- Navigation: a modal containing a full site menu is a focus and keyboard trap misapplied to a wayfinding problem.
- Long forms or multi-step wizards with many fields — scrolling inside a modal on mobile is painful; use a dedicated page or a stepped in-page flow instead.
- Informational content that can stay inline: a tooltip, an accordion, or an inline expansion is far less disruptive than interrupting the user's flow.
- Error messages that appear on form field blur — these should be inline validation, never a modal.
- Everyone overuses this for "we just want to be sure" confirmations on low-stakes actions (deleting a single comment, resetting a filter). If the action is easily reversible, an undo toast is kinder to the user than a full interrupt.

## How it works

`<dialog>` elements sit in normal DOM flow but are hidden by the user-agent stylesheet (`display: none`). `showModal()` moves the element to the browser's **top layer** — a separate stacking context that sits above everything including `z-index` values and `position: fixed` elements. This top-layer promotion is what makes the backdrop and focus confinement work without manual z-index management.

**Key mechanisms:**

- `showModal()` — opens as a modal; the browser marks all elements outside the dialog as inert (non-focusable, non-clickable, hidden from assistive technology). The background is still technically scrollable, which is why a scroll lock CSS rule is necessary.
- `dialog.close(returnValue)` — closes the dialog and fires the `close` event; `dialog.returnValue` carries whatever string you passed (useful for multi-button dialogs: `"confirm"`, `"cancel"`).
- `::backdrop` pseudo-element — automatically rendered behind the dialog and above the page when `showModal()` is used. Can be styled with CSS but requires `@starting-style` + `allow-discrete` to animate.
- `aria-modal="true"` — tells assistive technologies that background content is inert. The `<dialog>` element's implicit `role="dialog"` covers the role; you must add `aria-modal="true"` explicitly since the browser does not set it automatically.
- `aria-labelledby` — points to the dialog's visible heading ID; screen readers announce the label when focus enters.
- `aria-describedby` — optional; points to a paragraph summarising the dialog's purpose. Omit for complex multi-section dialogs.
- `inert` attribute on background — `showModal()` handles this automatically. For custom implementations not using `<dialog>`, apply `inert` to the page root rather than managing `aria-hidden` + `tabindex="-1"` on every focusable background element.
- **Scroll lock** — `showModal()` does not prevent the page from scrolling. The modern approach is `html:has(dialog[open]:modal) { overflow: hidden; scrollbar-gutter: stable; }` — `:modal` matches only when shown as a modal, and `scrollbar-gutter: stable` reserves the scrollbar width so the layout does not jump when the scrollbar disappears.
- **Focus trap** — `showModal()` confines tab focus to the dialog's focusable descendants. Unlike older custom implementations, users can Tab out to browser chrome (address bar) per the W3C APA working group's decision — this is by design, not a bug.
- **Focus return** — `close()` automatically returns focus to the element that called `showModal()`, no manual tracking needed.

## Working code

### Vanilla — native `<dialog>` with scroll lock, backdrop dismiss, and animation

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Modal dialog — native demo</title>
  <style>
    /* ─── Reset & base ─── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: "Inter", "General Sans", system-ui, sans-serif;
      background: #f5f5f3;
      color: #1a1a18;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 2rem;
    }

    /* ─── Scroll lock: fires when a modal dialog is open ─── */
    html:has(dialog[open]:modal) {
      overflow: hidden;
      /* Reserve scrollbar width to prevent layout shift */
      scrollbar-gutter: stable;
    }

    /* ─── Trigger button ─── */
    .trigger {
      padding: 0.75rem 1.5rem;
      background: #1a1a18;
      color: #f5f5f3;
      border: none;
      border-radius: 6px;
      font-size: 0.9375rem;
      font-weight: 500;
      cursor: pointer;
      letter-spacing: 0.01em;
    }
    .trigger:focus-visible {
      outline: 2px solid #1a1a18;
      outline-offset: 3px;
    }

    /* ─── Dialog element ─── */
    /*
      The dialog element is display:none by default.
      When open, we do NOT set display on dialog itself (causes exit
      animation conflicts with UA stylesheet). Instead we use :open
      and @starting-style for entry, and a CSS class for exit.
    */
    dialog {
      position: fixed;  /* ensure top-layer override for older contexts */
      margin: auto;
      padding: 0;
      border: none;
      border-radius: 12px;
      background: #ffffff;
      box-shadow:
        0 4px 6px -1px rgb(0 0 0 / 0.08),
        0 16px 48px -8px rgb(0 0 0 / 0.18);
      width: min(520px, calc(100vw - 2rem));
      max-height: calc(100dvh - 4rem);
      overflow-y: auto;
      overscroll-behavior-y: contain;

      /* Entry + exit transitions */
      opacity: 1;
      transform: translateY(0) scale(1);
      transition:
        opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
        display 0.22s cubic-bezier(0.16, 1, 0.3, 1) allow-discrete,
        overlay 0.22s cubic-bezier(0.16, 1, 0.3, 1) allow-discrete;
    }

    /* Pre-open state (entry keyframe) */
    @starting-style {
      dialog[open] {
        opacity: 0;
        transform: translateY(8px) scale(0.98);
      }
    }

    /* Exit state — class toggled by JS before close() */
    dialog.is-closing {
      opacity: 0;
      transform: translateY(4px) scale(0.98);
    }

    /* Backdrop */
    dialog::backdrop {
      background-color: transparent;
      backdrop-filter: blur(0px);
      transition:
        background-color 0.22s ease,
        backdrop-filter 0.22s ease,
        display 0.22s ease allow-discrete,
        overlay 0.22s ease allow-discrete;
    }
    dialog[open]::backdrop {
      background-color: rgb(0 0 0 / 0.45);
      backdrop-filter: blur(2px);
    }
    @starting-style {
      dialog[open]::backdrop {
        background-color: transparent;
        backdrop-filter: blur(0px);
      }
    }

    /* ─── Reduced motion: no transforms, instant transition ─── */
    @media (prefers-reduced-motion: reduce) {
      dialog,
      dialog::backdrop {
        transition:
          opacity 0.1s linear,
          display 0.1s linear allow-discrete,
          overlay 0.1s linear allow-discrete;
        transform: none !important;
        backdrop-filter: none !important;
      }
      @starting-style {
        dialog[open] {
          opacity: 0;
          transform: none;
        }
      }
    }

    /* ─── Dialog inner layout ─── */
    .dialog-inner {
      padding: 2rem;
    }
    .dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }
    .dialog-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1a1a18;
      line-height: 1.3;
    }
    .dialog-close-x {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      background: none;
      border: none;
      border-radius: 6px;
      color: #6b6b69;
      cursor: pointer;
      transition: background 0.15s;
    }
    .dialog-close-x:hover { background: #f0f0ee; }
    .dialog-close-x:focus-visible {
      outline: 2px solid #1a1a18;
      outline-offset: 2px;
    }
    .dialog-description {
      font-size: 0.9375rem;
      color: #4a4a48;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .btn {
      padding: 0.625rem 1.25rem;
      border-radius: 6px;
      font-size: 0.9375rem;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
    }
    .btn:focus-visible {
      outline: 2px solid #1a1a18;
      outline-offset: 3px;
    }
    .btn-ghost {
      background: transparent;
      border-color: #d4d4d2;
      color: #4a4a48;
    }
    .btn-ghost:hover { background: #f5f5f3; }
    .btn-danger {
      background: #c0392b;
      color: #fff;
    }
    .btn-danger:hover { background: #a93226; }
  </style>
</head>
<body>
  <button class="trigger" id="open-btn" type="button">
    Remove project
  </button>

  <dialog
    id="confirm-dialog"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-desc"
    aria-modal="true"
  >
    <div class="dialog-inner">
      <div class="dialog-header">
        <h2 class="dialog-title" id="dialog-title">Remove "Q3 Redesign"?</h2>
        <button
          class="dialog-close-x"
          id="close-x-btn"
          type="button"
          aria-label="Close dialog"
        >
          <!-- Simple SVG X icon -->
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <p class="dialog-description" id="dialog-desc">
        This will permanently delete the project and all its assets. Collaborators
        will lose access immediately. This action cannot be undone.
      </p>
      <div class="dialog-actions">
        <!-- Cancel gets autofocus — APG recommends the least-destructive action -->
        <button class="btn btn-ghost" id="cancel-btn" type="button" autofocus>
          Keep project
        </button>
        <button class="btn btn-danger" id="confirm-btn" type="button">
          Yes, remove it
        </button>
      </div>
    </div>
  </dialog>

  <script>
    const dialog   = document.getElementById('confirm-dialog');
    const openBtn  = document.getElementById('open-btn');
    const cancelBtn  = document.getElementById('cancel-btn');
    const closeXBtn  = document.getElementById('close-x-btn');
    const confirmBtn = document.getElementById('confirm-btn');

    // ── Open ──────────────────────────────────────────────
    openBtn.addEventListener('click', () => {
      dialog.showModal();
      // showModal() handles: top-layer, inert background, Esc key, focus trap,
      // backdrop rendering, and focus return on close.
    });

    // ── Animated close helper ─────────────────────────────
    // We add .is-closing to play the exit transition, then call close() once
    // the transition finishes. Without this, the dialog disappears instantly.
    function closeDialog(returnValue) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        dialog.close(returnValue ?? '');
        return;
      }
      dialog.classList.add('is-closing');
      dialog.addEventListener('transitionend', function handler() {
        dialog.classList.remove('is-closing');
        dialog.close(returnValue ?? '');
        dialog.removeEventListener('transitionend', handler);
      }, { once: true });
    }

    // ── Cancel / close-X ─────────────────────────────────
    cancelBtn.addEventListener('click',  () => closeDialog('cancel'));
    closeXBtn.addEventListener('click',  () => closeDialog('cancel'));

    // ── Confirm ───────────────────────────────────────────
    confirmBtn.addEventListener('click', () => {
      closeDialog('confirm');
    });

    // ── Backdrop click dismiss ────────────────────────────
    // The click event fires on the <dialog> element itself when the user
    // clicks the backdrop (not on any child). We distinguish by comparing
    // the click target to the dialog element directly.
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closeDialog('backdrop');
    });

    // ── Esc key — handled automatically by showModal(). ──
    // We hook the close event to react to both programmatic and Esc closes.
    dialog.addEventListener('close', () => {
      const val = dialog.returnValue;
      if (val === 'confirm') {
        // In a real app: delete the resource.
        console.log('Project removed.');
      }
      // Focus automatically returns to openBtn — no manual tracking needed.
    });
  </script>
</body>
</html>
```

### React — Radix UI Dialog (production choice for component systems)

Radix UI `@radix-ui/react-dialog` wraps the same accessibility primitives — focus trap, focus return, Esc, `aria-modal`, `aria-labelledby` — in a composable React API with animation support via `data-state` attributes.

```jsx
// Requires: npm install @radix-ui/react-dialog
// Full self-contained component — drop into any React + Tailwind project.
import * as Dialog from "@radix-ui/react-dialog";

// XIcon — inline so the snippet is self-contained
function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

// useReducedMotion hook
function useReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ConfirmDeleteDialog({ onConfirm }) {
  const reduce = useReducedMotion();

  const motionStyles = reduce
    ? { transition: "opacity 0.1s linear" }
    : {
        transition:
          "opacity 0.22s cubic-bezier(0.16,1,0.3,1), transform 0.22s cubic-bezier(0.16,1,0.3,1)",
      };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium
                     rounded-md focus-visible:outline focus-visible:outline-2
                     focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          Remove project
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgb(0 0 0 / 0.45)",
            zIndex: 50,
            /* Radix sets data-state="open"/"closed" — use for CSS animations */
          }}
          className="
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=open]:fade-in-0  data-[state=closed]:fade-out-0
          "
        />

        {/* Content */}
        <Dialog.Content
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 51,
            width: "min(520px, calc(100vw - 2rem))",
            maxHeight: "calc(100dvh - 4rem)",
            overflowY: "auto",
            overscrollBehaviorY: "contain",
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow:
              "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 16px 48px -8px rgb(0 0 0 / 0.18)",
            padding: "2rem",
          }}
          className="
            data-[state=open]:animate-in  data-[state=closed]:animate-out
            data-[state=open]:fade-in-0   data-[state=closed]:fade-out-0
            data-[state=open]:zoom-in-95  data-[state=closed]:zoom-out-95
            data-[state=open]:slide-in-from-top-1
          "
          // Radix handles: aria-modal, aria-labelledby, focus trap, Esc, focus return.
          // onEscapeKeyDown and onInteractOutside can be overridden here.
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem" }}>
            <Dialog.Title
              style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1a1a18", lineHeight: 1.3 }}
            >
              Remove "Q3 Redesign"?
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Close dialog"
                style={{
                  flexShrink: 0,
                  width: 32,
                  height: 32,
                  display: "grid",
                  placeItems: "center",
                  background: "none",
                  border: "none",
                  borderRadius: 6,
                  color: "#6b6b69",
                  cursor: "pointer",
                }}
              >
                <XIcon />
              </button>
            </Dialog.Close>
          </div>

          {/* Description */}
          <Dialog.Description
            style={{ fontSize: "0.9375rem", color: "#4a4a48", lineHeight: 1.6, marginBottom: "1.5rem" }}
          >
            This will permanently delete the project and all its assets.
            Collaborators will lose access immediately. This action cannot be undone.
          </Dialog.Description>

          {/* Actions — cancel first (least destructive, receives initial focus via DOM order) */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
            <Dialog.Close asChild>
              <button
                autoFocus
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: 6,
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  border: "1px solid #d4d4d2",
                  background: "transparent",
                  color: "#4a4a48",
                }}
              >
                Keep project
              </button>
            </Dialog.Close>
            <button
              onClick={onConfirm}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: 6,
                fontSize: "0.9375rem",
                fontWeight: 500,
                cursor: "pointer",
                border: "none",
                background: "#c0392b",
                color: "#fff",
              }}
            >
              Yes, remove it
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

Radix manages `aria-modal="true"`, `aria-labelledby` (pointing at `Dialog.Title`), `aria-describedby` (pointing at `Dialog.Description`), focus trap, focus return, Esc key closure, and backdrop dismiss — all out of the box.

## Variations

- **Confirmation dialog** — two buttons (cancel + destructive action), `autofocus` on cancel per APG guidance, `aria-modal`. The vanilla example above is this variant.
- **Alert dialog** — `role="alertdialog"` instead of `role="dialog"`; used for time-sensitive or critical system messages. Focus should land on the most-used action (usually "OK"). Esc should NOT dismiss an alert dialog if there is only one option.
- **Form dialog** — contains a `<form>` with `method="dialog"`. Submitting the form calls `dialog.close(submitter.value)`, setting `returnValue` automatically without extra JS.
- **Drawer / bottom sheet** — same ARIA pattern, different visual position. Slides up from the viewport bottom on mobile. `transform: translateY(100%)` entry; same focus trap and `aria-modal` requirements apply.
- **Lightbox** — image or media fills the dialog; `aria-label` describes the content since there may be no visible title. `role="dialog"` still required.
- **Nested dialogs** — technically possible with `<dialog>` top-layer stacking, but usually a signal the IA needs rethinking. Each must be independently focusable and closeable.

The key knob between variants is `role="dialog"` vs `role="alertdialog"` and initial focus placement (cancel vs primary action vs static content).

## Accessibility

### Keyboard navigation (APG dialog pattern)

| Key | Behavior |
|---|---|
| Tab | Move to next focusable element inside dialog; wraps to first from last |
| Shift + Tab | Move to previous focusable element; wraps to last from first |
| Esc | Close dialog; focus returns to trigger |
| Enter / Space | Activate focused button (browser default) |

### Focus placement on open

Per the APG: place focus on the **least-destructive tabbable element** for destructive-action dialogs (the "cancel" button, not the "delete" button), on a `tabindex="-1"` heading or paragraph when the dialog starts with complex content the user needs to read before deciding, and on the primary action for simple confirmatory dialogs. The `autofocus` attribute is the mechanism; note that as of 2025 cross-browser `autofocus` reliability inside `<dialog>` has improved but test in your target environment.

### Focus return on close

`dialog.close()` automatically returns focus to the element that called `showModal()`. No manual tracking is needed with the native element. If the trigger has been removed from the DOM (e.g. a row deleted while the dialog was open), focus falls to `<body>` — handle this by moving focus to a logical fallback manually before or after `close()`.

### prefers-reduced-motion (mandatory)

All motion in the working code above is guarded:

```css
@media (prefers-reduced-motion: reduce) {
  dialog,
  dialog::backdrop {
    transition:
      opacity 0.1s linear,
      display 0.1s linear allow-discrete,
      overlay 0.1s linear allow-discrete;
    transform: none !important;
    backdrop-filter: none !important;
  }
  @starting-style {
    dialog[open] {
      opacity: 0;
      transform: none;
    }
  }
}
```

The JS side also checks `matchMedia('(prefers-reduced-motion: reduce)').matches` and skips the animated close class, calling `dialog.close()` directly.

### touch / pointer fallback

- Backdrop-click dismiss is implemented via a `click` listener on the `<dialog>` element checking `e.target === dialog`. This works identically for pointer, touch, and mouse.
- The X close button is `44×44 px` minimum touch target at the implementation level (set `width: 44px; height: 44px` in production); the inline demo uses 32px for visual compactness — expand for touch-first surfaces.
- On iOS Safari, `overflow: hidden` on `<body>` does not always prevent background scrolling via touch. Supplement with `touch-action: none` on the backdrop, or use a `touchmove` event listener: `document.body.addEventListener('touchmove', preventScroll, { passive: false })` while the dialog is open, removed on close.

### Screen-reader implications

- `role="dialog"` is implicit on `<dialog>` — no need to add it explicitly, but it is not harmful.
- `aria-modal="true"` must be added explicitly; the browser does not set it automatically even with `showModal()`. Without it, some screen readers (particularly NVDA + Firefox combinations) will let virtual-cursor navigation escape the dialog and read background content.
- `aria-labelledby` must point to a visible title element inside the dialog — the screen reader announces this label as the dialog name when focus enters.
- `aria-describedby` is useful for short introductory descriptions but should be **omitted** if the dialog body contains complex content (lists, tables, multiple paragraphs) — in that case the description would be too long to announce usefully.
- For `role="alertdialog"`, the browser and screen readers should announce the dialog immediately on open, regardless of where focus lands. Always pair with an `aria-describedby` pointing to the primary message.

### Contrast

In the code above, dialog text colors are:
- `.dialog-title` `#1a1a18` on `#ffffff` — contrast ratio 18.1:1 (WCAG AAA)
- `.dialog-description` `#4a4a48` on `#ffffff` — contrast ratio 8.5:1 (WCAG AAA)
- `.btn-ghost` label `#4a4a48` on `#ffffff` — contrast ratio 8.5:1
- `.btn-danger` `#ffffff` on `#c0392b` — contrast ratio 5.1:1 (WCAG AA for normal text, AA for large text)

## Performance

- **No layout thrash** — the dialog is in the top layer; it does not affect normal document layout when open or closed.
- **Animate only `transform` and `opacity`** — the entry/exit animations in this entry use `translateY`, `scale`, and `opacity`, all GPU-composited. `backdrop-filter: blur()` triggers a separate compositing layer and is the most expensive visual effect in use here. On low-end devices, remove it or reduce the blur radius.
- **`backdrop-filter` cost** — a `blur(2px)` on the backdrop repaints on every frame during the transition. If performance profiling shows paint bottlenecks on the backdrop, remove `backdrop-filter` and rely on `background-color` alone — the visual effect is nearly as effective.
- **`will-change`** — do not add `will-change: transform` to the dialog permanently. The browser already promotes it to its own layer as a top-layer element. Adding `will-change` would create a redundant layer. Apply it transiently if needed, only during the transition.
- **Bundle cost** — vanilla: zero JS library overhead; the `<dialog>` API is built-in. Radix UI Dialog adds ~8 kB gzipped to a React bundle; Headless UI adds a similar amount. Both are tree-shakeable.
- **`overscroll-behavior-y: contain`** on the dialog's scroll container prevents the scroll from propagating to the locked page — prevents double-scroll jank on touch devices.
- **MutationObserver for dynamic dialogs** — if you programmatically remove dialogs from the DOM (e.g. in a component system), call `dialog.close()` before removal to cleanly exit the top layer and restore focus; don't just `remove()` the element while it is open.

## Anti-slop

The cliche (see `_slop-blocklist.md` → Surface, Motion): a modal with soft drop shadow on everything, glassmorphism overlay, and a blob gradient behind the modal card, with every element fading-and-sliding-up at the same 300 ms ease duration. The result reads as default-generated rather than designed.

Tasteful alternatives:
- One layered translucent backdrop (`rgb(0 0 0 / 0.45)`) instead of a gradient aurora; no glassmorphism on the card itself — the shadow and white background give sufficient elevation.
- A single motion gesture on the card (a subtle `translateY(8px) → 0` + `scale(0.98) → 1` with a tight expo easing like `cubic-bezier(0.16, 1, 0.3, 1)`) rather than stacking fade + slide + blur on every interior element.
- Microcopy that names the specific thing: "Remove 'Q3 Redesign'?" not "Are you sure?" — specificity makes the confirmation feel trustworthy rather than generic.
- Don't use modals for everything. The tasteful call is knowing when NOT to interrupt — use an undo toast for reversible actions, inline expansion for supplementary content.

## Pairs well with

- `navbars` (04-component-patterns/navbars.md) — the nav hamburger drawer uses the same focus-trap and backdrop-dismiss pattern, but as a non-modal (no `showModal()`; background stays interactive)
- `staggered-entrance` — staggering interior dialog elements (title, description, actions) on open adds depth; keep stagger total under 120 ms and guard with `prefers-reduced-motion`
- `scroll-progress-indicator` — for content-heavy dialogs (terms, long-form content), a scroll progress bar inside the dialog orients the user
- Form validation patterns — inline field errors inside a form dialog should not themselves open additional dialogs; surface them as `aria-live="polite"` inline messages

## Current references

- [ARIA APG — Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — canonical keyboard behavior table, ARIA attribute requirements, focus placement guidance
- [MDN — `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) — `showModal()`, `closedby`, `returnValue`, Invoker Commands API, browser support table
- [MDN — `aria-modal` attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-modal) — definition, `aria-modal` vs `inert` distinction, screen reader caveats
- [web.dev — Building a dialog component](https://web.dev/articles/building/a-dialog-component) — `overscroll-behavior`, scroll lock with `:has()`, backdrop-click detection pattern, animation timing
- [Frontend Masters — The dialog element with entry and exit animations](https://frontendmasters.com/blog/the-dialog-element-with-entry-and-exit-animations/) — `@starting-style` + `:not([open])` exit technique, allow-discrete, browser support notes (2024)
- [Frontend Masters — Scroll-locked dialogs](https://frontendmasters.com/blog/scroll-locked-dialogs/) — `html:has(dialog[open]:modal) { overflow: hidden }` + `scrollbar-gutter: stable` approach
- [Jared Cunha — HTML dialog: getting accessibility and UX right](https://jaredcunha.com/blog/html-dialog-getting-accessibility-and-ux-right) — scroll position preservation on open, autofocus cross-browser caveats, practical gap analysis (2024)
- [Mayank — Is `<dialog>` enough?](https://blog.mayank.co/is-dialog-enough) — gap analysis: scroll lock, backdrop click, exit animations, display conflicts, focus edge cases
- [CSS-Tricks — There is no need to trap focus on a dialog element](https://css-tricks.com/there-is-no-need-to-trap-focus-on-a-dialog-element/) — W3C APA working group position on browser-chrome tab-out behavior
- [Radix UI — Dialog primitives](https://www.radix-ui.com/primitives/docs/components/dialog) — React composable API, `data-state` animation hooks, automatic ARIA management
- [MDN — `@starting-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style) — browser support (Chrome 117+, Safari 17.5+, Firefox 129+), syntax reference
