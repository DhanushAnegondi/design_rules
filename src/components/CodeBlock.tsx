import { useState } from "react";

interface Props {
  code: string;
  /** shiki-highlighted HTML (already themed for light/dark by global.css) */
  highlighted: string;
  lang: string;
}

/**
 * CodeBlock — a non-runnable code sample with a copy button.
 *
 * The highlighted markup is produced at build time by shiki (parse-library.ts)
 * and is injected verbatim; we never re-highlight on the client. The Copy button
 * writes the raw `code` to the clipboard and shows a transient "Copied" label.
 * Reduced-motion safe: state change is a plain text swap, no large movement.
 */
export default function CodeBlock({ code, highlighted, lang }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context / denied) — fail quietly.
    }
  }

  return (
    <figure className="codeblock">
      <figcaption className="codeblock__bar">
        <span className="codeblock__lang">{lang}</span>
        <button
          type="button"
          className="codeblock__copy"
          onClick={copy}
          aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
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
  );
}
