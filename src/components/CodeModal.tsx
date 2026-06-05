import { useCallback, useEffect, useId, useRef, useState } from "react";

interface Props {
  /** raw source — what the Copy button writes to the clipboard */
  code: string;
  /** shiki-highlighted HTML (already dual-themed for light/dark by global.css) */
  highlighted: string;
  /** detected language, shown in the trigger and as the window title suffix */
  lang: string;
  /**
   * One-line, human label for what this code is (e.g. "Native CSS — static
   * aurora with grain"). Used as the trigger's caption and the window title.
   * Falls back to the lang when absent.
   */
  label?: string;
  /**
   * Visual treatment of the trigger:
   * - "button": a standalone "View code" button row (used under a live demo).
   * - "row": a full-width labelled row (used for standalone code blocks that
   *   would otherwise be an inline wall — shows the label + a "View code" cue).
   */
  trigger?: "button" | "row";
}

/**
 * CodeModal — a "View code" affordance that opens the source in an accessible
 * floating mini-window (modal dialog), instead of dumping a code wall inline.
 *
 * The trigger is a real <button> (>=44px). Opening shows a native <dialog>
 * sized like a floating code window (max min(880px, 92vw) x ~70vh, scrollable)
 * holding the shiki-highlighted source, a Copy button (copies the RAW source),
 * and a Close button.
 *
 * Accessibility:
 * - Uses the native <dialog> element via showModal(): the platform provides
 *   role="dialog", aria-modal, the top layer, and a focus trap for free.
 * - aria-labelledby points at the window title.
 * - Esc closes (native), and we also wire a cancel handler to restore focus.
 * - Clicking the backdrop (the ::backdrop / area outside the panel) closes it.
 * - Focus is moved to the Close button on open and restored to the trigger on
 *   close.
 * - Body scroll is locked while open.
 * - prefers-reduced-motion removes the open animation (handled in CSS).
 *
 * No external CSS dependency beyond the page's :global .codemodal* rules and the
 * shared shiki theme in global.css; works for both runnable-demo source and
 * standalone code blocks.
 */
export default function CodeModal({
  code,
  highlighted,
  lang,
  label,
  trigger = "button",
}: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const titleId = useId();

  const title = label?.trim() ? label.trim() : `${lang} code`;

  const openDialog = useCallback(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (!dlg.open) dlg.showModal();
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    const dlg = dialogRef.current;
    if (dlg?.open) dlg.close();
    // onClose handler below clears state + restores focus.
  }, []);

  // Lock body scroll only while the dialog is open. Restores the prior value.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Move focus to Close when the dialog opens (after it is in the top layer).
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  async function copy() {
    try {
      // Always copy the ORIGINAL source.
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — fail quietly.
    }
  }

  // Backdrop click: a click whose target is the <dialog> itself (not the inner
  // panel) lands on the backdrop area.
  function onDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) closeDialog();
  }

  // Native close (Esc, .close(), backdrop): clear state and restore focus.
  function onClose() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      {trigger === "row" ? (
        <button
          type="button"
          ref={triggerRef}
          className="codemodal-trigger codemodal-trigger--row"
          onClick={openDialog}
          aria-haspopup="dialog"
        >
          <span className="codemodal-trigger__icon" aria-hidden="true" />
          <span className="codemodal-trigger__label">{title}</span>
          <span className="codemodal-trigger__cue">View code</span>
        </button>
      ) : (
        <button
          type="button"
          ref={triggerRef}
          className="codemodal-trigger codemodal-trigger--button"
          onClick={openDialog}
          aria-haspopup="dialog"
        >
          <span className="codemodal-trigger__icon" aria-hidden="true" />
          View code
        </button>
      )}

      <dialog
        ref={dialogRef}
        className="codemodal"
        aria-labelledby={titleId}
        onClick={onDialogClick}
        onClose={onClose}
        onCancel={() => {
          /* native Esc -> close; onClose handles state/focus */
        }}
      >
        <div className="codemodal__panel">
          <header className="codemodal__bar">
            <span className="codemodal__dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <h2 className="codemodal__title" id={titleId}>
              {title}
              <span className="codemodal__lang" aria-hidden="true">
                {lang}
              </span>
            </h2>
            <div className="codemodal__actions">
              <button
                type="button"
                className="codemodal__copy"
                onClick={copy}
                aria-label={
                  copied ? "Copied to clipboard" : "Copy code to clipboard"
                }
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                ref={closeRef}
                className="codemodal__close"
                onClick={closeDialog}
                aria-label="Close code window"
              >
                <span className="codemodal__close-x" aria-hidden="true" />
              </button>
            </div>
          </header>
          <div
            className="codemodal__code"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      </dialog>
    </>
  );
}
