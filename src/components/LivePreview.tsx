import { useMemo, useState } from "react";
import CodeModal from "./CodeModal";

interface Props {
  code: string;
  /** shiki-highlighted HTML (already themed for light/dark by global.css) */
  highlighted: string;
  lang: string;
  /** Optional one-line label for the View-code window title. */
  label?: string;
}

/** What kind of demo is this? Drives frame height, affordance, and the hint copy. */
type DemoKind = "scroll" | "pointer" | "loop" | "static";

/**
 * Classify a runnable sample purely from its source `code`. Order matters:
 * scroll wins over pointer/loop, pointer over loop, loop over static.
 *
 * - 'scroll' : the effect is driven by scrolling (scroll-driven animations,
 *   sticky pinning, scroll-snap, or simply tall vertical content that needs to
 *   be scrolled to be seen). For these the iframe IS the scroll root for
 *   `animation-timeline: scroll(root block)`, so the frame must be tall and
 *   scrollable to create real travel.
 * - 'pointer': reacts to the pointer (cursor glow, spotlight, magnetic button).
 * - 'loop'   : animates on its own forever (marquee, ticker, animated gradient,
 *   loader) — visible immediately, no interaction needed.
 * - 'static' : a still composition.
 */
export function classifyDemo(code: string): DemoKind {
  const c = code;
  const lower = c.toLowerCase();

  // --- scroll ---------------------------------------------------------------
  const hasScrollTimeline =
    /animation-timeline\s*:\s*scroll\(/i.test(c) ||
    /animation-timeline\s*:\s*view\(/i.test(c) ||
    /\bscroll-timeline\b/i.test(c) ||
    /\bview-timeline\b/i.test(c);
  const hasSticky = /position\s*:\s*sticky/i.test(c);
  const hasScrollSnap = /\bscroll-snap(-type|-align)?\b/i.test(c);
  // Multiple full-viewport blocks => meant to be scrolled through.
  const viewportUnitCount = (lower.match(/100v(h|dvh)|100dvh/g) ?? []).length;
  const tallContent = viewportUnitCount >= 2;
  // An inner element that scrolls its own overflow.
  const innerScroller =
    /overflow(-y)?\s*:\s*(auto|scroll)/i.test(c) && viewportUnitCount >= 1;

  if (
    hasScrollTimeline ||
    hasSticky ||
    hasScrollSnap ||
    tallContent ||
    innerScroller
  ) {
    return "scroll";
  }

  // --- pointer --------------------------------------------------------------
  // Must require REAL pointer-tracking signals, NOT the CSS `cursor:` property
  // or `:hover` alone (which appear in almost every sample and cause false positives).
  // Genuine pointer demos listen to pointermove/mousemove events, drive custom
  // CSS properties from the pointer position (--mx/--my/--mouse/--pointer-x/y),
  // or implement explicit spotlight/magnet/magnetic mechanics.
  const hasPointer =
    /\bpointermove\b|\bonpointermove\b/i.test(c) ||
    /\bmousemove\b|\bonmousemove\b/i.test(c) ||
    /--mx\b|--my\b|--mouse-x\b|--mouse-y\b|--pointer-x\b|--pointer-y\b/i.test(c) ||
    /\bspotlight\b|\bmagnet\b|\bmagnetic\b/i.test(c);
  if (hasPointer) return "pointer";

  // --- loop -----------------------------------------------------------------
  // Catch @keyframes + infinite animations, marquee/ticker elements, and
  // skeleton/shimmer loaders.
  const hasKeyframes = /@keyframes/i.test(c);
  const hasInfiniteAnim =
    /animation[^;{]*\binfinite\b/i.test(c) ||
    /animation-iteration-count\s*:\s*infinite/i.test(c);
  const hasMarqueeOrTicker = /\bmarquee\b|\bticker\b/i.test(c);
  const hasShimmer =
    /\bskeleton\b|\bshimmer\b|\bpulse\b.*@keyframes|@keyframes.*\bpulse\b/i.test(c);
  if (
    (hasKeyframes && hasInfiniteAnim) ||
    hasMarqueeOrTicker ||
    (hasKeyframes && hasShimmer)
  ) {
    return "loop";
  }

  return "static";
}

/** Human-readable hint shown in the host chrome for each demo kind. */
const HINTS: Record<DemoKind, string | null> = {
  scroll: "Scroll inside the frame to see the effect.",
  pointer: "Move your pointer over the preview to see it react.",
  loop: "This demo animates on its own.",
  static: null,
};

/**
 * Build the srcDoc actually fed to the iframe. For scroll demos we append a
 * tiny, clearly-commented auto-demo script that gently scrolls the iframe's own
 * document once when it loads — purely to advertise that there is travel. It is
 * guarded by prefers-reduced-motion and stops the moment the user touches it.
 *
 * IMPORTANT: this only mutates the iframe srcDoc, never the `code` shown/copied
 * to the user. The Copy button always copies the original `code`.
 *
 * The script runs INSIDE the sandboxed iframe (sandbox="allow-scripts"), so it
 * does not need same-origin access from the parent.
 */
function buildSrcDoc(code: string, kind: DemoKind): string {
  if (kind !== "scroll") return code;

  const autoScroll = `
<!-- Injected by LivePreview: initial scroll jump + one-time auto-demo of the
     scroll effect. Not part of the copyable sample.
     The INITIAL JUMP is an instant, non-animated position set so the frame opens
     on meaningful content rather than a blank lead-in pad. This instant jump is
     acceptable under reduced-motion because it is not animated motion.
     The subsequent ANIMATED DEMO is skipped when prefers-reduced-motion: reduce.
     Both yield to the user immediately on any interaction. -->
<script>
(function () {
  try {
    var mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    var reducedMotion = mq && mq.matches;
    var doc = document.scrollingElement || document.documentElement;

    var run = function () {
      var max = doc.scrollHeight - doc.clientHeight;
      if (max <= 8) return; // nothing to travel — tiny or same-height doc

      // --- Instant initial jump (always, including reduced-motion) ----------
      // Jump to ~25% of the scrollable range so the frame opens on real
      // content rather than a blank top-pad. Guard: only jump if the document
      // is actually taller than the viewport (max > 0, checked above), and
      // only when 25% of max is a meaningful distance (>= 20px); otherwise the
      // document is nearly full-height already and no jump is needed.
      var jumpTarget = Math.round(max * 0.25);
      if (jumpTarget >= 20) {
        window.scrollTo(0, jumpTarget);
      }

      // --- Animated gentle-scroll demo (skipped for reduced-motion) ---------
      if (reducedMotion) return;

      var start = null;
      var duration = 2500; // ms, one gentle pass from jump position to end
      var cancelled = false;
      var stop = function () {
        cancelled = true;
        window.removeEventListener("wheel", stop, { passive: true });
        window.removeEventListener("touchstart", stop, { passive: true });
        window.removeEventListener("keydown", stop, true);
        window.removeEventListener("pointerdown", stop, true);
      };
      window.addEventListener("wheel", stop, { passive: true });
      window.addEventListener("touchstart", stop, { passive: true });
      window.addEventListener("keydown", stop, true);
      window.addEventListener("pointerdown", stop, true);

      // Animate from the jump position to max, so the demo shows the full
      // scroll range without restarting from the very top.
      var animFrom = doc.scrollTop;
      var animRange = max - animFrom;
      if (animRange <= 0) return; // already at max (very short doc)

      var ease = function (t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2; };
      var step = function (ts) {
        if (cancelled) return;
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / duration);
        window.scrollTo(0, animFrom + ease(p) * animRange);
        if (p < 1) requestAnimationFrame(step);
        else stop();
      };
      // Small delay so the first frame paints before motion begins.
      setTimeout(function () {
        if (!cancelled) requestAnimationFrame(step);
      }, 450);
    };

    if (document.readyState === "complete") run();
    else window.addEventListener("load", run);
  } catch (e) { /* never break the sample */ }
})();
</script>`.trim();

  // Append before </body> if present, else just concatenate.
  if (/<\/body>/i.test(code)) {
    return code.replace(/<\/body>/i, autoScroll + "\n</body>");
  }
  return code + "\n" + autoScroll;
}

/**
 * LivePreview — a sandboxed iframe rendering a self-contained library HTML sample,
 * plus the source code beside it with a copy button.
 *
 * Security: the iframe is `sandbox="allow-scripts"` only (NO allow-same-origin),
 * so the sample cannot reach this site's origin, storage, or cookies. Content is
 * passed via `srcDoc`. The samples are trusted library content, but the sandbox is
 * defence-in-depth.
 *
 * The "Reload preview" button remounts the iframe by bumping a key. "Expand"/
 * "Collapse" toggles a taller height for demos that need room.
 *
 * The host chrome here has no motion of its own. Scroll demos get a taller,
 * scrollable frame plus a one-time auto-demo injected into the iframe's srcDoc
 * (guarded by reduced-motion). Page-level reduced-motion is honored by global.css
 * for everything outside the iframe.
 */
export default function LivePreview({ code, highlighted, lang, label }: Props) {
  const [reloadKey, setReloadKey] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const kind = useMemo(() => classifyDemo(code), [code]);
  const hint = HINTS[kind];
  // Only inject the auto-demo for scroll kinds; recompute when code changes.
  const srcDoc = useMemo(() => buildSrcDoc(code, kind), [code, kind]);

  return (
    <section className="livepreview" aria-label="Live preview" data-kind={kind}>
      <div className="livepreview__bar">
        <span className="livepreview__label">Live preview</span>
        <div className="livepreview__controls">
          <button
            type="button"
            className="livepreview__btn"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            Reload preview
          </button>
          <button
            type="button"
            className="livepreview__btn"
            onClick={() => setExpanded((v) => !v)}
            aria-pressed={expanded}
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {hint && (
        <p className="livepreview__hint" data-kind={kind}>
          {kind === "scroll" ? (
            <>
              <span className="livepreview__hint-arrow" aria-hidden="true" />
              <span>{hint}</span>
            </>
          ) : (
            <span>{hint}</span>
          )}
        </p>
      )}

      <div
        className="livepreview__frame-wrap"
        data-expanded={expanded ? "true" : "false"}
        data-kind={kind}
      >
        <iframe
          key={reloadKey}
          className="livepreview__frame"
          title="Live preview of the code sample"
          sandbox="allow-scripts"
          loading="lazy"
          srcDoc={srcDoc}
        />
      </div>

      <footer className="livepreview__foot">
        <CodeModal
          code={code}
          highlighted={highlighted}
          lang={lang}
          label={label}
          trigger="button"
        />
      </footer>
    </section>
  );
}
