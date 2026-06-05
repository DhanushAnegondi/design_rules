/**
 * parse-library.ts
 *
 * Parses the design library markdown files loaded via the Astro `concepts`
 * content collection. Exports strongly-typed interfaces and helper functions
 * used by all downstream pages.
 */

import { getCollection } from "astro:content";
import { marked } from "marked";
import { codeToHtml } from "shiki";
import { DOMAINS, folderToId } from "./domains";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CodeToken {
  type: "code";
  lang: string;
  code: string;
  /** true when the code starts with <!DOCTYPE html> — eligible for iframe preview */
  runnable: boolean;
  /** shiki-highlighted HTML with dual light/dark themes */
  highlighted: string;
}

export interface ProseToken {
  type: "prose";
  html: string;
}

export type Token = ProseToken | CodeToken;

export interface Section {
  title: string;
  slug: string;
  tokens: Token[];
}

/** raw = display text (as matched); css = value usable directly in a CSS property */
export interface ColorValue {
  raw: string;
  css: string;
}

export interface CrossRef {
  folder: string;
  slug: string;
  domainId: string;
  href: string;
  label: string;
}

export interface ConceptMeta {
  bucket?: string;
  maturity?: string;
  effort?: string;
  bestFor?: string[];
  buildTarget?: string;
  feel?: string;
  extra: Record<string, string>;
}

export interface Concept {
  id: string;
  slug: string;
  domainId: string;
  folder: string;
  title: string;
  definition: string;
  meta: ConceptMeta;
  isRecipe: boolean;
  sections: Section[];
  colors: ColorValue[];
  crossRefs: CrossRef[];
  rawBody: string;
}

// ---------------------------------------------------------------------------
// Shiki language guard
// ---------------------------------------------------------------------------

/**
 * Known language aliases supported by shiki. We map unknown/unsupported langs
 * to "text" to avoid shiki throwing on e.g. bare ```sh or ```js (check anyway).
 */
const SUPPORTED_LANGS = new Set([
  "html", "css", "js", "javascript", "ts", "typescript",
  "tsx", "jsx", "json", "bash", "sh", "shell", "zsh",
  "yaml", "yml", "md", "markdown", "python", "py",
  "rust", "go", "java", "c", "cpp", "text",
]);

function normalizeLang(raw: string): string {
  const l = raw.trim().toLowerCase();
  if (!l) return "text";
  if (SUPPORTED_LANGS.has(l)) return l;
  // a few common aliases not in our shortlist
  if (l === "js" || l === "javascript") return "javascript";
  if (l === "ts" || l === "typescript") return "typescript";
  if (l === "sh" || l === "shell" || l === "zsh") return "bash";
  return "text";
}

// ---------------------------------------------------------------------------
// Slugify
// ---------------------------------------------------------------------------

/**
 * Converts a heading string to a URL-safe anchor slug, matching the GitHub /
 * rehype-slug style used in the site.
 * e.g. "What it is" -> "what-it-is"
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // strip non-word chars (preserve hyphens and spaces)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ---------------------------------------------------------------------------
// marked setup (one-time, module-level)
// ---------------------------------------------------------------------------

/** Pattern for a library cross-ref path: "01-visual-styles/glassmorphism" */
const CROSS_REF_RE = /^\d{2}-[a-z-]+\/[a-z0-9-]+$/;

marked.use({
  gfm: true,
  renderer: {
    link({ href, title, text }: { href: string; title?: string | null; text: string }) {
      const titleAttr = title ? ` title="${title}"` : "";
      if (href && /^https?:\/\//.test(href)) {
        return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
      return `<a href="${href}"${titleAttr}>${text}</a>`;
    },
    codespan({ text }: { text: string }) {
      if (CROSS_REF_RE.test(text)) {
        const slashIdx = text.indexOf("/");
        const folder = text.slice(0, slashIdx);
        const slug = text.slice(slashIdx + 1);
        const domainId = folderToId(folder);
        const href = `/${domainId}/${slug}`;
        return `<a href="${href}" class="cross-ref"><code>${text}</code></a>`;
      }
      return `<code>${text}</code>`;
    },
  },
});

// ---------------------------------------------------------------------------
// Header parsing
// ---------------------------------------------------------------------------

interface ParsedHeader {
  title: string;
  definition: string;
  meta: ConceptMeta;
  /** Index (0-based) of first line starting with "## " */
  bodyStartLine: number;
}

function parseHeader(lines: string[]): ParsedHeader {
  let title = "";
  let definitionParts: string[] = [];
  const meta: ConceptMeta = { extra: {} };
  let bodyStartLine = lines.length;

  // Collect the header section (lines before the first ## heading)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      bodyStartLine = i;
      break;
    }

    if (!title && line.startsWith("# ")) {
      title = line.slice(2).trim();
      continue;
    }

    // Blockquote lines: the definition
    if (line.startsWith(">")) {
      const text = line.replace(/^>\s?/, "");
      if (text.trim()) {
        definitionParts.push(text.trim());
      }
      continue;
    }

    // **Key:** value lines — format is **Key:** value (colon inside the bold markers)
    // Also tolerate **Key**: value (colon outside) as a fallback
    const metaMatch =
      line.match(/^\*\*([^*:]+):\*\*\s*(.+)$/) ??
      line.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
    if (metaMatch) {
      const key = metaMatch[1].trim();
      const value = metaMatch[2].trim();
      const keyLower = key.toLowerCase();

      if (keyLower === "bucket") {
        meta.bucket = value;
      } else if (keyLower === "maturity") {
        meta.maturity = value;
      } else if (keyLower === "effort") {
        meta.effort = value;
      } else if (keyLower === "best for") {
        meta.bestFor = value.split(",").map((s) => s.trim()).filter(Boolean);
      } else if (keyLower === "build target") {
        meta.buildTarget = value;
      } else if (keyLower === "feel") {
        meta.feel = value;
      } else {
        meta.extra[key] = value;
      }
    }
  }

  return {
    title,
    definition: definitionParts.join(" "),
    meta,
    bodyStartLine,
  };
}

// ---------------------------------------------------------------------------
// Color extraction
// ---------------------------------------------------------------------------

const COLOR_PATTERNS: RegExp[] = [
  /#([0-9a-fA-F]{3,8})\b/g,
  /rgba?\(\s*[\d.%,\s]+\)/gi,
  /oklch\([^)]+\)/gi,
  /hsla?\(\s*[\d.%,\s]+\)/gi,
];

/** Valid hex lengths (excluding the leading #) */
const VALID_HEX_LENGTHS = new Set([3, 4, 6, 8]);

export function extractColors(rawBody: string): ColorValue[] {
  const seen = new Set<string>();
  const result: ColorValue[] = [];

  for (const pattern of COLOR_PATTERNS) {
    let match: RegExpExecArray | null;
    // Reset lastIndex each time since we reuse the patterns
    pattern.lastIndex = 0;
    while ((match = pattern.exec(rawBody)) !== null) {
      const raw = match[0];

      // Validate hex lengths (group 1 captures digits after #)
      if (raw.startsWith("#")) {
        const digits = match[1] ?? raw.slice(1);
        if (!VALID_HEX_LENGTHS.has(digits.length)) continue;
      }

      const key = raw.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ raw, css: raw });
        if (result.length >= 24) break;
      }
    }
    if (result.length >= 24) break;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Cross-ref extraction
// ---------------------------------------------------------------------------

const CROSS_REF_BODY_RE = /\b(\d{2}-[a-z-]+)\/([a-z0-9-]+)\b/g;

export function extractCrossRefs(rawBody: string): CrossRef[] {
  const seen = new Set<string>();
  const result: CrossRef[] = [];

  let match: RegExpExecArray | null;
  CROSS_REF_BODY_RE.lastIndex = 0;
  while ((match = CROSS_REF_BODY_RE.exec(rawBody)) !== null) {
    const folder = match[1];
    const slug = match[2];
    const domainId = folderToId(folder);
    const href = `/${domainId}/${slug}`;

    if (!seen.has(href)) {
      seen.add(href);
      // Humanize: "bento-grid" -> "Bento grid"
      const label =
        slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
      result.push({ folder, slug, domainId, href, label });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Section tokenizer (fenced code blocks vs prose)
// ---------------------------------------------------------------------------

async function tokenizeSection(sectionMarkdown: string): Promise<Token[]> {
  const tokens: Token[] = [];

  // Split on fenced code blocks. The regex captures: opening fence, lang, code, closing fence.
  // We use a non-greedy match so we get the shortest code block possible.
  const fenceRe = /^```([^\n]*)\n([\s\S]*?)^```\s*$/gm;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRe.exec(sectionMarkdown)) !== null) {
    // Prose before this code block
    const proseBefore = sectionMarkdown.slice(lastIndex, match.index);
    if (proseBefore.trim()) {
      const html = await marked.parse(proseBefore);
      tokens.push({ type: "prose", html });
    }

    const rawLang = match[1].trim();
    const code = match[2];
    const lang = normalizeLang(rawLang);

    let highlighted = "";
    try {
      highlighted = await codeToHtml(code, {
        lang,
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
      });
    } catch {
      // Fallback: escape and wrap in a pre/code block
      const escaped = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      highlighted = `<pre><code class="language-${lang}">${escaped}</code></pre>`;
    }

    tokens.push({
      type: "code",
      lang: rawLang || "text",
      code,
      runnable: /^\s*<!doctype html/i.test(code),
      highlighted,
    });

    lastIndex = match.index + match[0].length;
  }

  // Any trailing prose after the last code block
  const proseAfter = sectionMarkdown.slice(lastIndex);
  if (proseAfter.trim()) {
    const html = await marked.parse(proseAfter);
    tokens.push({ type: "prose", html });
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Full concept parser
// ---------------------------------------------------------------------------

async function parseConcept(
  id: string,
  rawBody: string
): Promise<Concept> {
  const lines = rawBody.split("\n");
  const { title, definition, meta, bodyStartLine } = parseHeader(lines);

  // Everything from the first ## heading onward
  const bodyAfterHeader = lines.slice(bodyStartLine).join("\n");

  // Split body into sections on level-2 headings only (## , not ###)
  const sectionSplitRe = /^## (.+)$/gm;
  const sections: Section[] = [];

  const sectionMatches: Array<{ title: string; start: number }> = [];
  let sm: RegExpExecArray | null;
  while ((sm = sectionSplitRe.exec(bodyAfterHeader)) !== null) {
    sectionMatches.push({ title: sm[1].trim(), start: sm.index + sm[0].length });
  }

  for (let i = 0; i < sectionMatches.length; i++) {
    const { title: sTitle, start } = sectionMatches[i];
    const end =
      i + 1 < sectionMatches.length
        ? // find the position of the next ## heading
          bodyAfterHeader.lastIndexOf(
            "\n## " + sectionMatches[i + 1].title,
            sectionMatches[i + 1].start
          )
        : bodyAfterHeader.length;

    const sectionBody = bodyAfterHeader.slice(start, end).trim();
    const slug = slugify(sTitle);
    const tokens = await tokenizeSection(sectionBody);
    sections.push({ title: sTitle, slug, tokens });
  }

  // Derive folder and domainId from entry id
  const slashIdx = id.indexOf("/");
  const folder = slashIdx >= 0 ? id.slice(0, slashIdx) : "";
  const slug = slashIdx >= 0 ? id.slice(slashIdx + 1) : id;
  const domainId = folderToId(folder);

  const isRecipe = folder === "06-recipes" || !!meta.buildTarget;
  const colors = extractColors(rawBody);
  const crossRefs = extractCrossRefs(rawBody);

  return {
    id,
    slug,
    domainId,
    folder,
    title,
    definition,
    meta,
    isRecipe,
    sections,
    colors,
    crossRefs,
    rawBody,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// Domain order map for sorting
const DOMAIN_ORDER = new Map(DOMAINS.map((d, i) => [d.id, i]));

/** Cache to avoid re-parsing on every call in the same build */
let _allConcepts: Concept[] | null = null;

export async function getAllConcepts(): Promise<Concept[]> {
  // Only treat a NON-EMPTY result as cached. In `astro dev`, the first request
  // can land before the content store has synced, so getCollection() returns []
  // momentarily. An empty array is truthy, so caching it here would pin the site
  // to "0 concepts" for the life of the dev server (no routes, "0 techniques").
  // Guarding on length lets the next request re-read once the store is ready.
  if (_allConcepts && _allConcepts.length > 0) return _allConcepts;

  const entries = await getCollection("concepts");

  const parsed = await Promise.all(
    entries.map((entry) => parseConcept(entry.id, entry.body ?? ""))
  );

  // Sort by domain order, then by title alphabetically
  parsed.sort((a, b) => {
    const oa = DOMAIN_ORDER.get(a.domainId) ?? 999;
    const ob = DOMAIN_ORDER.get(b.domainId) ?? 999;
    if (oa !== ob) return oa - ob;
    return a.title.localeCompare(b.title);
  });

  // Don't cache an empty result (see note above); only memoize real data.
  if (parsed.length > 0) _allConcepts = parsed;
  return parsed;
}

export async function getConcept(
  domainId: string,
  slug: string
): Promise<Concept | undefined> {
  const all = await getAllConcepts();
  return all.find((c) => c.domainId === domainId && c.slug === slug);
}

export function conceptsByDomain(all: Concept[]): Map<string, Concept[]> {
  const map = new Map<string, Concept[]>();
  for (const concept of all) {
    const list = map.get(concept.domainId) ?? [];
    list.push(concept);
    map.set(concept.domainId, list);
  }
  return map;
}
