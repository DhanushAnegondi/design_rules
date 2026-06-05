/**
 * filters.ts
 *
 * Normalizes raw `effort` and `maturity` metadata values from library
 * markdown files into clean, consistent bucket strings suitable for use
 * in filter dropdowns and data-attributes.
 *
 * The raw values can be verbose, e.g.:
 *   "low (basic effect) to medium (accessible, performant, fallback-complete)"
 *   "evergreen (cycling-back — peaked ~2021, refined through 2024–2026)"
 *   "current / cycling-back"
 *
 * Normalization extracts the FIRST keyword match in each string.
 */

// ---------------------------------------------------------------------------
// Effort
// ---------------------------------------------------------------------------

/** Canonical effort bucket keys — also used as option values and data-attr values. */
export const EFFORT_KEYS = ["low", "medium", "high"] as const;
export type EffortKey = (typeof EFFORT_KEYS)[number];

/** Display label for an effort bucket key. */
export const EFFORT_LABEL: Record<EffortKey, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

/**
 * Normalize a raw effort string to one of the canonical bucket keys,
 * or undefined if the value is empty / yields no keyword match.
 */
export function normalizeEffort(raw: string | undefined): EffortKey | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  const match = lower.match(/\b(low|medium|high)\b/);
  if (match) return match[1] as EffortKey;
  // Fallback: take the first token before any delimiter and title-case it — rare.
  const first = lower.split(/[\s(–\-/|]/)[0].trim();
  if (!first) return undefined;
  // Only return if it happens to be a known key; otherwise drop it.
  if ((EFFORT_KEYS as readonly string[]).includes(first)) return first as EffortKey;
  return undefined;
}

// ---------------------------------------------------------------------------
// Maturity
// ---------------------------------------------------------------------------

/** Canonical maturity bucket keys — also used as option values and data-attr values. */
export const MATURITY_KEYS = [
  "evergreen",
  "current",
  "cycling-back",
  "fading",
  "experimental",
] as const;
export type MaturityKey = (typeof MATURITY_KEYS)[number];

/** Display label for a maturity bucket key. */
export const MATURITY_LABEL: Record<MaturityKey, string> = {
  evergreen: "Evergreen",
  current: "Current",
  "cycling-back": "Cycling-back",
  fading: "Fading",
  experimental: "Experimental",
};

/**
 * Normalize a raw maturity string to one of the canonical bucket keys,
 * or undefined if the value is empty / yields no keyword match.
 *
 * "cycling back" and "cycling-back" both normalize to "cycling-back".
 */
export function normalizeMaturity(raw: string | undefined): MaturityKey | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  // Normalize the two-word variant to hyphenated before matching.
  const normalized = lower.replace(/cycling\s+back/g, "cycling-back");
  const match = normalized.match(
    /\b(evergreen|current|cycling-back|fading|experimental)\b/
  );
  if (match) return match[1] as MaturityKey;
  return undefined;
}

// ---------------------------------------------------------------------------
// Sorted distinct options (in fixed canonical order)
// ---------------------------------------------------------------------------

/**
 * Given a list of raw effort strings, return the distinct normalized bucket
 * keys that are actually present, in canonical order (Low < Medium < High).
 */
export function effortOptions(rawValues: (string | undefined)[]): EffortKey[] {
  const present = new Set<EffortKey>();
  for (const v of rawValues) {
    const k = normalizeEffort(v);
    if (k) present.add(k);
  }
  return EFFORT_KEYS.filter((k) => present.has(k));
}

/**
 * Given a list of raw maturity strings, return the distinct normalized bucket
 * keys that are actually present, in canonical order.
 */
export function maturityOptions(rawValues: (string | undefined)[]): MaturityKey[] {
  const present = new Set<MaturityKey>();
  for (const v of rawValues) {
    const k = normalizeMaturity(v);
    if (k) present.add(k);
  }
  return MATURITY_KEYS.filter((k) => present.has(k));
}
