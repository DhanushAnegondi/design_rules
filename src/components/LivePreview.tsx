import { useState } from "react";

interface Props {
  code: string;
  /** shiki-highlighted HTML (already themed for light/dark by global.css) */
  highlighted: string;
  lang: string;
}

const MOTION_RE = /@keyframes|animation:|transition:|requestAnimationFrame/i;

/**
 * LivePreview — a sandboxed iframe rendering a self-contained library HTML sample,
 * plus the source code beside it with a copy button.
 *
 * Security: the iframe is `sandbox="allow-scripts"` only (NO allow-same-origin),
 * so the sample cannot reach this site's origin, storage, or cookies. Content is
 * passed via `srcDoc`. The samples are trusted library content, but the sandbox is
 * defence-in-depth.
 *
 * The "Reload preview" button remounts the iframe by bumping a key. An optional
 * "Expand"/"Collapse" toggles a taller height for demos that need room.
 *
 * The host chrome here has no motion of its own; the demo itself follows whatever
 * the sample's own CSS/JS does (it may animate). Page-level reduced-motion is
 * honored by global.css for everything outside the iframe.
 */
export default function LivePreview({ code, highlighted, lang }: Props) {
  const [reloadKey, setReloadKey] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasMotion = MOTION_RE.test(code);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — fail quietly.
    }
  }

  return (
    <section className="livepreview" aria-label="Live preview">
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

      {hasMotion && (
        <p className="livepreview__note">
          This demo may animate. It runs the sample&rsquo;s own motion settings,
          independent of the page.
        </p>
      )}

      <div
        className="livepreview__frame-wrap"
        data-expanded={expanded ? "true" : "false"}
      >
        <iframe
          key={reloadKey}
          className="livepreview__frame"
          title="Live preview of the code sample"
          sandbox="allow-scripts"
          loading="lazy"
          srcDoc={code}
        />
      </div>

      <figure className="codeblock codeblock--inpreview">
        <figcaption className="codeblock__bar">
          <span className="codeblock__lang">{lang}</span>
          <button
            type="button"
            className="codeblock__copy"
            onClick={copy}
            aria-label={
              copied ? "Copied to clipboard" : "Copy code to clipboard"
            }
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </figcaption>
        <div
          className="codeblock__code"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </figure>
    </section>
  );
}
