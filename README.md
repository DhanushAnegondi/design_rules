# Design Library — website

A modern, browsable reference site for the frontend design knowledge base in
`../design-research-system/`. Built for someone new to frontend: pick a domain, open a
concept, see it running in a live sandboxed preview, read when/when-not, and copy the
working code and color values into your own project.

Built with **Astro 5** (static-first) + a few **React islands** (live preview, code copy,
theme toggle, search). Content is read **in place** from the library markdown via Astro's
content-layer `glob()` loader — one source of truth, nothing duplicated.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321  (fast dev; search is disabled here)
```

For the full experience including search, build and preview the static site:

```bash
npm run build      # astro build + pagefind index over dist/
npm run preview    # serves the built site at http://localhost:4321
```

> Search uses **Pagefind**, which indexes the built `dist/` output, so it only works in
> `npm run preview` (or a deployed build), not in `npm run dev`.

## What's where

- `src/content.config.ts` — content-layer loader pointing at the library folder.
- `src/lib/parse-library.ts` — parses each concept's title, definition, metadata, sections,
  code blocks (flags runnable HTML), color values, and cross-references.
- `src/lib/domains.ts` — the nine domains and their beginner-facing descriptions.
- `src/styles/tokens.css` — OKLCH design tokens (dark-first, one accent). `global.css` — base.
- `src/layouts/Base.astro` — shell: theme, skip link, Browse nav, footer.
- `src/components/` — `LivePreview`, `CodeBlock`, `ColorSwatches`, `MetaChips`, `Toc`,
  `ReferenceList`, `DomainCard`, `ConceptCard`, `ThemeToggle`.
- `src/pages/` — home, `[domain]/` (landing + concept), `guide` (use-when map), `search`, 404.

## Pages

- `/` — home: editorial intro + an asymmetric bento of the nine domains.
- `/{domain}` — domain landing: filterable grid of its concepts.
- `/{domain}/{slug}` — a concept: live demos, copy-paste code, color swatches, cross-refs.
- `/guide` — "when to use what": every concept + its one-liner, live-filterable.
- `/search` — full-text search (built site only).

## Rules of the road

The build rules, design guidelines, and requirements live in `CLAUDE.md`, `docs/GUIDELINES.md`,
and `docs/REQUIREMENTS.md`. The library markdown under `../design-research-system/` is
**read-only** — edit a `.md` there and rebuild to update the site.

## Docs

- **`docs/HANDOFF.md`** — full hand-off: architecture, every file explained, how each feature works,
  accessibility, how to extend, deploy, and a "where do I change X?" map. Start here.
- **`docs/DEVELOPMENT_NOTES.md`** — chronological build log: phases, decisions, and what the
  verification loop caught and fixed.
- `docs/GUIDELINES.md` — design + code guidelines (anti-slop, a11y, voice).
- `docs/REQUIREMENTS.md` — functional/non-functional requirements + acceptance criteria.
- `CLAUDE.md` — build orchestration rules + quality gate for future work.
