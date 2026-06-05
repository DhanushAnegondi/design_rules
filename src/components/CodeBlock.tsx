import CodeModal from "./CodeModal";

interface Props {
  code: string;
  /** shiki-highlighted HTML (already themed for light/dark by global.css) */
  highlighted: string;
  lang: string;
  /**
   * One-line description of what this snippet is, lifted from the preceding
   * prose/section context when available; otherwise the page passes the lang.
   * Shown on the compact trigger row and as the mini-window title.
   */
  label?: string;
}

/**
 * CodeBlock — a standalone (non-runnable) code sample. Instead of dumping an
 * inline code wall, it renders a compact, labelled "View code" row that opens
 * the source in the shared CodeModal mini-window (with Copy + Close + focus
 * trap + Esc, all handled by CodeModal).
 *
 * The highlighted markup is produced at build time by shiki; the modal injects
 * it verbatim and the Copy button writes the raw `code`.
 */
export default function CodeBlock({ code, highlighted, lang, label }: Props) {
  return (
    <CodeModal
      code={code}
      highlighted={highlighted}
      lang={lang}
      label={label}
      trigger="row"
    />
  );
}
