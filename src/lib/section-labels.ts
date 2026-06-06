/**
 * section-labels.ts
 *
 * The library markdown uses long, prose-y section titles ("When NOT to use it",
 * "Working code", "Current references", "Pairs well with"…). On the concept page
 * we want SHORT, minimal display labels for both the on-page <h2> headings and
 * the table of contents — while the section CONTENT is untouched and the anchor
 * id (slug of the ORIGINAL title) stays the same so deep-links and TOC links
 * keep working.
 *
 * This module is the single source of truth for that mapping. It returns:
 *  - `short`: the tasteful minimal label to display.
 *  - `full`:  the original title, used for an accessible name (aria-label / title
 *             attribute) whenever the short label is a shortened/ambiguous form,
 *             so screen-reader users and hover still get the complete wording.
 *
 * Unknown titles fall back to the original (short === full, ambiguous === false).
 * The markdown is NEVER edited; only the visible text shortens.
 */

export interface SectionLabel {
  /** Minimal label to render in the h2 and the TOC. */
  short: string;
  /** Original, complete section title (for aria-label / title when shortened). */
  full: string;
  /**
   * True when `short` is a shortened form of `full` (the visible text drops
   * words). When true, callers should expose `full` as an accessible name so the
   * meaning is never lost. False when short === full (no rewrite happened).
   */
  ambiguous: boolean;
}

/**
 * Normalise a raw title for matching: lower-case, trim, collapse whitespace, and
 * drop trailing punctuation. Keeps the comparison resilient to "When NOT to use
 * it." vs "When not to use it" vs "When to use".
 */
function normalize(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.:]+$/, "");
}

/**
 * Exact-match map from a normalised title to its short label. Covers the known
 * library section vocabulary across all domains (concepts + recipes). Keep the
 * short labels understandable on their own; lean on the original title for the
 * accessible name when a label is a shortened form.
 */
const EXACT: Record<string, string> = {
  // Overview / definition
  "what it is": "What",
  "what its": "What",
  "what it's": "What",
  "the idea": "What",
  "overview": "Overview",

  // Decision: when / when not
  "when to use": "When to use",
  "when to use it": "When to use",
  "when to reach for it": "When to use",
  "when not to use": "When not",
  "when not to use it": "When not",
  "when to avoid it": "When not",
  "when not to": "When not",

  // Mechanics
  "how it works": "How",
  "how to build it": "How",
  "how to do it": "How",
  "the technique": "How",

  // Code
  "working code": "Code",
  "working example": "Code",
  "working examples": "Code",
  "the code": "Code",
  "code": "Code",
  "implementation": "Code",

  // Variations / extras
  "variations": "Variations",
  "variants": "Variations",
  "more examples": "More",
  "further examples": "More",
  "extras": "More",

  // Quality axes
  "accessibility": "Access",
  "a11y": "Access",
  "performance": "Performance",
  "performance notes": "Performance",

  // Anti-slop
  "anti-slop": "Anti-slop",
  "slop warnings": "Anti-slop",
  "slop warning": "Anti-slop",
  "avoid the slop": "Anti-slop",

  // Relationships
  "pairs well with": "Pairs",
  "pairs with": "Pairs",
  "combine with": "Pairs",
  "related": "Related",
  "see also": "Related",

  // References
  "current references": "References",
  "references": "References",
  "sources": "References",
  "further reading": "References",

  // Recipe-flavoured sections (06-recipes vocabulary)
  "the skin": "Skin",
  "the skeleton": "Skeleton",
  "the behavior": "Behaviour",
  "the behaviour": "Behaviour",
  "put it together": "Together",
  "putting it together": "Together",
  "the stack": "Stack",
  "starter scaffold": "Scaffold",
  "section by section": "Walkthrough",
  "make it yours": "Customise",
  "library entries used": "Sources",
  "accessibility checklist": "Access",
  "why this avoids slop": "Anti-slop",
  "export path": "Export",
};

/**
 * Map a raw section title to its short display label + accessible full name.
 *
 * @param title the original section title from the markdown (any casing/punctuation)
 * @returns a SectionLabel; unknown titles fall back to the original verbatim.
 */
export function sectionLabel(title: string): SectionLabel {
  const full = title.trim();
  const key = normalize(full);
  const short = EXACT[key];

  if (!short) {
    // Unknown: keep the original wording; no accessible-name override needed.
    return { short: full, full, ambiguous: false };
  }

  // A label is "ambiguous" (needs the full name exposed) when the visible text
  // is genuinely shorter/different from the original wording. If the short label
  // already equals the original (case-insensitively), there is nothing lost.
  const ambiguous = short.toLowerCase() !== full.toLowerCase();
  return { short, full, ambiguous };
}

/** Convenience: just the short string (for call sites that don't need the rest). */
export function shortLabel(title: string): string {
  return sectionLabel(title).short;
}
