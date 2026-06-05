# Hand-off — Design Library website

Everything you need to understand, run, maintain, and extend this project, written for someone
picking it up cold. Pair this with `DEVELOPMENT_NOTES.md` (the chronological build log).

---

## 1. What this is

A static reference website that makes an existing markdown knowledge base browsable for people
learning frontend design. The knowledge base ("the library") is a finished collection of **88
design-technique articles across 9 domains** living at:

```
F:\Personal\Projects\frontend_designs\design-research-system\design-research-system\library\
```

This website (`F:\Personal\Projects\frontend_designs\website\`) reads those `.md` files and turns
each into a page where a visitor can: pick a domain → open a concept → **see the technique running
in a live sandboxed preview** → read when/when-not to use it → copy the working code and color
values into their own project. The site is also a deliberate, tasteful example of modern web design
(it follows the library's own anti-slop rules).

Two important facts:
- **The library markdown is READ-ONLY source.** The site reads it in place. Editing a `.md` there
  and rebuilding updates the site. Nothing is copied or duplicated. The site never writes to it.
- **It is a static site.** No backend, database, or auth. The output is plain HTML/CSS/JS.

---

## 2. Tech stack (and why)

| Choice | Why |
|--------|-----|
| **Astro 5** | Static-first; renders 100+ markdown-driven pages fast with minimal JS. Native content layer. |
| **React 19 islands** | Used ONLY for the few interactive bits (live preview, code copy, theme toggle). Everything else is static HTML — small JS payload. |
| **shiki 3** | Build-time syntax highlighting, dual light/dark theme baked in. |
| **marked 15** | Renders prose markdown to HTML inside our custom section pipeline. |
| **Pagefind 1.5** (via `astro-pagefind`) | Zero-config static full-text search; indexes the built output. |
| **@fontsource-variable/fraunces** | Self-hosted variable display font — no runtime network call. |
| **rehype-slug / rehype-autolink-headings** | Heading anchors for the table of contents. |

Versions: Node 24, Astro 5.18, React 19, shiki 3.23, marked 15, pagefind 1.5.

---

## 3. How to run it

```bash
cd F:\Personal\Projects\frontend_designs\website
npm install

# Fast development (live reload). NOTE: search is disabled here.
npm run dev            # http://localhost:4321

# Full static build + search index, then serve it:
npm run build          # = astro build && pagefind --site dist
npm run preview        # http://localhost:4321  (serves dist/, search works)

# Type-check only:
npm run check          # astro check
```

> **Why search needs a build:** Pagefind indexes the built `dist/` HTML. In `npm run dev` there is
> no built output, so the search page shows the widget but returns no results. Use `build` +
> `preview` (or a deployed build) to use search. This is noted on the search page itself.

There is also a `.claude/launch.json` at the **workspace root** (`frontend_designs/`) with `preview`
and `dev` configs for the Claude Code preview tooling (they run npm with `--prefix website`).

---

## 4. Architecture & data flow

```
library/*.md  (read-only source, outside this project)
      │
      ▼
src/content.config.ts        ← Astro content-layer glob() loader points at the library folder
      │  (gives each file an id like "01-visual-styles/glassmorphism" + raw .md body)
      ▼
src/lib/parse-library.ts     ← parses each file into a typed `Concept` object
      │   • title (# heading), definition (> blockquote)
      │   • meta (**Bucket/Maturity/Effort/Best for** or **Build target/Feel/Effort**)
      │   • sections split on `## `, each tokenized into prose | code tokens
      │   • code highlighted with shiki; runnable flag if it starts with <!DOCTYPE html>
      │   • colors extracted (hex/rgb/oklch/hsl), cross-refs extracted (NN-folder/slug)
      ▼
src/pages/*.astro            ← getStaticPaths() builds one page per concept/domain
      │   renders header + sections; prose via set:html, code via islands
      ▼
dist/  (static HTML)  →  pagefind --site dist  →  dist/pagefind/ (search index)
```

The whole pipeline runs **at build time**. Pages call `getAllConcepts()` (cached per build) in their
frontmatter and render synchronously to HTML.

---

## 5. File-by-file reference

### Config / root
- `package.json` — scripts (`dev`, `build`, `preview`, `check`) and deps.
- `astro.config.mjs` — registers React + Pagefind integrations; sets shiki themes
  (`github-light`/`github-dark`); adds `rehype-slug` + `rehype-autolink-headings`.
- `tsconfig.json` — strict TypeScript; `@/*` path alias → `src/*`.
- `.gitignore`, `README.md`.
- `CLAUDE.md` — the build orchestration rules + quality gate (see §9).
- `docs/GUIDELINES.md`, `docs/REQUIREMENTS.md`, `docs/HANDOFF.md` (this), `docs/DEVELOPMENT_NOTES.md`.
- `.claude/settings.json` — permission allowlist (npm/astro/node, read library path, write under
  website), denies edits to the library. `.claude/agents/*.md` — builder + verifier agent defs.

### Data layer (`src/lib/`)
- **`domains.ts`** — the 9 domains. Exports `DOMAINS` (each: `id, folder, order, title, blurb,
  accentHue`), and helpers `domainById`, `domainByFolder`, `folderToId` (`"01-visual-styles"` →
  `"visual-styles"`). `accentHue` is an OKLCH hue used ONLY for a small per-domain dot.
- **`parse-library.ts`** — the parsing core. Key exports:
  - Types: `Concept, Section, Token (ProseToken | CodeToken), ColorValue, CrossRef, ConceptMeta`.
  - `getAllConcepts(): Promise<Concept[]>` — loads + parses all, sorted by domain order then title
    (cached in `_allConcepts`).
  - `getConcept(domainId, slug): Promise<Concept | undefined>`.
  - `conceptsByDomain(all): Map<domainId, Concept[]>`.
  - `slugify(s)` — heading→anchor (matches rehype-slug).
  - `extractColors(rawBody)`, `extractCrossRefs(rawBody)` (also used internally).
  - How parsing works: see code comments; header parse stops at the first `## `; sections split on
    level-2 headings only; each section is tokenized by scanning fenced ```code blocks``` (prose
    between them → `marked.parse`); a code block is `runnable` when it starts with `<!DOCTYPE html>`;
    inline code matching `NN-folder/slug` is rewritten to an internal link; external links get
    `target=_blank rel=noopener`.

### Content config
- **`src/content.config.ts`** — defines the `concepts` collection with the glob loader:
  `pattern: ["*/*.md", "!**/*.review.md", "!**/_*.md"]`, `base:
  "../design-research-system/design-research-system/library"`. The `*/*.md` pattern matches concept
  files one folder deep, so the library's root `INDEX.md`/`README.md` are excluded; the negations
  drop `_todo.md`/`_TEMPLATE.md` and `*.review.md` sidecars. Result: exactly 88 entries.

### Layout & styles
- **`src/layouts/Base.astro`** — the HTML shell every page uses. Props: `title`, `description?`,
  `class?`. Contains: an inline `<head>` theme-init script (sets `data-theme` before paint to avoid
  a flash; defaults dark, honors `localStorage.theme` then `prefers-color-scheme`); the skip link
  (first focusable); the header `<nav>` with a wordmark, a pure-CSS **Browse** disclosure listing all
  9 domains (works at every width — see §6 nav), "Use-when map" (`/guide`), "Search" (`/search`),
  and the `<ThemeToggle/>`; `<main id="main">`; and a footer.
- **`src/styles/tokens.css`** — OKLCH design tokens: type families, a fluid modular scale
  (`--step-*`), spacing (`--space-*`), radii, motion easings/durations, `--preview-bg`, and the
  semantic color tokens (`--bg`, `--surface`, `--text`, `--muted`, `--border`, `--accent`,
  `--accent-contrast`, `--focus`, shadows) defined for `[data-theme="dark"]` (default) and
  `[data-theme="light"]`.
- **`src/styles/global.css`** — `@import`s tokens + Fraunces; reset; base element styles; skip-link;
  `:focus-visible` rings; `.container`, `.prose` (capped measure, styled headings/lists/links/
  blockquote/tables/inline-code/hr); the **shiki dual-theme CSS** (`.shiki` uses `--shiki-light`,
  `[data-theme="dark"] .shiki` overrides to `--shiki-dark`); and the global
  `@media (prefers-reduced-motion: reduce)` neutralizer.

### Components (`src/components/`)
| File | Type | Props | Purpose |
|------|------|-------|---------|
| `MetaChips.astro` | static | `{ meta: ConceptMeta, isRecipe: boolean }` | Metadata pills. Concept: Bucket/Maturity/Effort/Best-for. Recipe: Build (humanized)/Feel/Effort. Effort shows a 1–3 dot meter (no rainbow). |
| `Toc.astro` | static + inline JS | `{ sections: Section[] }` | "On this page" nav; sticky on wide screens; IntersectionObserver active-link highlight skipped under reduced-motion; works with no JS. |
| `ColorSwatches.astro` | static + inline JS | `{ colors: ColorValue[] }` | "Colors used" — each swatch is a `<button>` that copies the raw value; `aria-live` "Copied"; inner border so near-bg colors stay visible. |
| `ReferenceList.astro` | static | `{ refs: CrossRef[] }` | "Related in this library" — internal links to cross-referenced concepts with a per-domain dot. |
| `CodeBlock.tsx` | React island | `{ code, highlighted, lang }` | Renders pre-highlighted shiki HTML + a Copy button (copies raw `code`). |
| `LivePreview.tsx` | React island | `{ code, highlighted, lang }` | Sandboxed `<iframe srcdoc>` (`sandbox="allow-scripts"`, titled, lazy) + Reload + Expand/Collapse + embedded code & copy + a motion note for animated samples. |
| `DomainCard.astro` | static | `{ domain, count, featured? }` | Bento tile linking to `/{domain.id}`; accent dot; `featured` spans larger. |
| `ConceptCard.astro` | static | `{ concept }` | Compact card linking to a concept; title, definition, 2-fact meta row. Reused by domain landing. |
| `ThemeToggle.tsx` | React island | — | Dark/light toggle; persists to `localStorage`; reads existing `data-theme` on mount. |

### Pages (`src/pages/`)
- **`index.astro`** — home. Editorial Fraunces intro + "How to use" (asymmetric numbered rows) +
  the **domain bento** (all 9 `DomainCard`s with size variance; 3 featured tiles) + an optional
  "Start here" rail of beginner concepts.
- **`[domain]/index.astro`** — domain landing. `getStaticPaths` over `DOMAINS`. Header + a grid of
  `ConceptCard`s, each wrapped in an `<li data-effort data-maturity>`; an accessible filter bar
  (effort/maturity toggle buttons, `aria-pressed`, `aria-live` count, "All" reset) that hides items
  via the `hidden` attribute and degrades gracefully (all visible without JS).
- **`[domain]/[slug].astro`** — the concept page. `getStaticPaths` over all concepts. Renders the
  header (breadcrumb, `h1`, definition lead, `MetaChips`), a two-column layout (sticky `Toc` +
  `ColorSwatches` aside / main `article`), the body (prose → `set:html`; runnable code →
  `LivePreview`; other code → `CodeBlock`), `ReferenceList`, and a same-domain prev/next pager.
- **`guide.astro`** — "When to use what": every concept grouped by domain (a `<dl>`), each with its
  one-line definition; a live filter input (`aria-live` count, graceful no-JS).
- **`search.astro`** — Pagefind UI (`astro-pagefind/components/Search`), styled to the tokens.
- **`404.astro`** — friendly not-found with links to home, guide, search, and all domains.

---

## 6. How the key features work

- **Live preview** — `parse-library` flags a code block `runnable` when it begins with
  `<!DOCTYPE html>`. The concept page passes its raw `code` to `LivePreview`, which renders an
  `<iframe srcDoc={code} sandbox="allow-scripts" title="Live preview of the code sample"
  loading="lazy">`. `allow-scripts` WITHOUT `allow-same-origin` means the demo can run its own JS but
  cannot touch the parent page or cookies — safe. Reload bumps a React `key`; Expand toggles height
  (the parent cannot auto-measure a cross-origin iframe, so height is fixed/expandable by design).
- **Code copy** — shiki HTML is rendered for display; the raw source string is what the Copy button
  writes to the clipboard. Lives in `CodeBlock`/`LivePreview`.
- **Color codes** — `extractColors` regex-collects hex/rgb/oklch/hsl from the article's code, dedupes
  (cap 24). `ColorSwatches` shows a swatch + the value in mono; click copies the value.
- **Cross-references** — recipes and "pairs well with" mention other concepts as `NN-folder/slug`
  inline code. `parse-library` rewrites those to internal links during prose rendering, and also
  collects them into `crossRefs` for the "Related in this library" list. All targets are real routes.
- **Table of contents** — heading anchors come from `rehype-slug`; `Toc` lists section slugs and
  highlights the current one via IntersectionObserver (disabled under reduced-motion; links still
  work with no JS).
- **Navigation (no dead zone)** — a single pure-CSS `<details class="nav-browse">` "Browse"
  disclosure holds all 9 domain links and is present/functional at EVERY viewport width (an earlier
  version hid links between 960–1375px; that was fixed). Keyboard-operable; not JS-dependent.
- **Theme** — `data-theme` on `<html>` switches the OKLCH token set. The head script sets it before
  paint (no flash); `ThemeToggle` flips and persists it.
- **Search** — `pagefind --site dist` (in the build script) crawls the built HTML into
  `dist/pagefind/`; the `/search` page's widget loads that index at runtime.
- **Filters / guide search** — plain inline scripts toggling the `hidden` attribute by data
  attributes / text match, with an `aria-live` count; everything visible without JS.

---

## 7. Design system & anti-slop

The site intentionally avoids the AI-default "slop" tells the library documents
(`library/_slop-blocklist.md`):
- **Color:** one warm-neutral ramp + a single amber accent, all via OKLCH semantic tokens. No
  purple→pink-on-white, no generic SaaS blue, no rainbow categories. Per-domain hue appears ONLY as a
  ~9px dot.
- **Type:** Fraunces (variable serif, real weight/scale contrast) for display, system-ui body,
  ui-monospace for code/labels. Fluid modular scale.
- **Layout:** asymmetric bento on home (not hero + three identical cards); editorial reading column
  on concept pages with full-bleed demo blocks.
- **Motion:** `transform`/`opacity` only, custom easing, everything behind `prefers-reduced-motion`.
- **Dark-mode first**, light mode tested; WCAG AA on text pairings.

Rules live in `docs/GUIDELINES.md`. Components must use tokens, never raw hex.

---

## 8. Accessibility (verified)

Skip link is the first focusable element; visible `:focus-visible` rings everywhere; semantic
landmarks + one `<h1>` per page; all iframes `sandbox`+`title`+`lazy`; reduced-motion neutralizer
present and honored; theme + filters keyboard-operable with `aria-pressed`/`aria-live`; ≥44px touch
targets; WCAG AA contrast (dark ~14–17:1 body, light ~11–18:1; accent paired with `--accent-contrast`).
Verified live: no horizontal overflow at 375px, nav reachable at 1100px (former dead-zone), no
console errors.

---

## 9. How it was built (orchestration)

Built by a lead agent running a per-phase **builder → independent-verifier → loop-on-fail** process
(rules in `CLAUDE.md`). Each phase: a builder sub-agent wrote a scoped slice; a separate verifier
sub-agent re-ran `npm run build` / `astro check`, checked the Quality Gate, and returned PASS or an
actionable FAIL list; on FAIL the lead re-dispatched with the notes (max 3 cycles). Model policy:
**Opus** for taste-critical work (design system, home, concept page), **Sonnet** for parsing/logic and
all verification. See `DEVELOPMENT_NOTES.md` for the phase-by-phase log and what verification caught.

---

## 10. Known limitations / gotchas

- **Search only in the built site** (Pagefind), not `npm run dev`.
- **Library path is hard-coded** in `src/content.config.ts` (`base:` relative path). If the
  `design-research-system` folder moves, update that one line.
- **Live-preview height is fixed/expandable**, not auto-fit — a cross-origin sandboxed iframe can't
  be measured from the parent (intentional security trade-off).
- **No git repo** at the workspace root, so parallel file-mutating agents (worktree isolation)
  weren't used; multi-file phases ran sequentially.
- **Color extraction is regex-based** — it surfaces colors found in the article's code (including any
  example colors the source itself uses, e.g. a `#3B82F6` shown as a teaching example); these are the
  library's data, not the site's palette.

---

## 11. How to extend

- **Add a new concept** → drop a `.md` (matching the library template) into the right
  `NN-domain/` folder in the library; rebuild. It appears automatically (route, card, guide row,
  search). No site code change.
- **Add a new domain** → create the `NN-name/` folder in the library AND add an entry to
  `src/lib/domains.ts` (`id`, `folder`, `order`, `title`, `blurb`, `accentHue`). Rebuild.
- **Change the palette/type** → edit `src/styles/tokens.css` (colors, type scale) — components
  inherit it. Display font is swapped in `tokens.css` (`--font-display`) + the Fontsource import in
  `global.css`.
- **Deploy** → it's a static site. `npm run build` produces `dist/` (HTML + `pagefind/`); upload
  `dist/` to any static host (Vercel/Netlify/GitHub Pages/S3). Set `site` in `astro.config.mjs` to
  the production URL before building.

---

## 12. Quick map for "where do I change X?"

| I want to change… | Edit |
|---|---|
| Colors, spacing, type scale, motion timings | `src/styles/tokens.css` |
| Base/prose/code styling, focus rings | `src/styles/global.css` |
| Nav, footer, theme init, page shell | `src/layouts/Base.astro` |
| How markdown is parsed (metadata, sections, colors, refs) | `src/lib/parse-library.ts` |
| Which files count as concepts | `src/content.config.ts` (glob pattern/base) |
| Domain titles/descriptions/accent | `src/lib/domains.ts` |
| Concept page layout | `src/pages/[domain]/[slug].astro` |
| Home page | `src/pages/index.astro` |
| Live-preview / copy behavior | `src/components/LivePreview.tsx`, `CodeBlock.tsx` |
| Build/dev/verify rules for future agents | `CLAUDE.md`, `docs/GUIDELINES.md` |
