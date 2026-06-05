# Requirements

## Problem
The design knowledge base is rich but lives as ~88 raw markdown files across 9 folders. A learner
can't browse it, can't see effects rendered, and has to bounce between files. We need a website that
makes the knowledge explorable and immediately usable, especially for someone new to frontend.

## Functional requirements
1. **Browse by domain.** Home lists all 9 domains with a one-line description and concept count.
   Selecting a domain lists its concepts as cards (title, one-line definition, effort/maturity chips,
   "best for").
2. **Concept page.** For each concept render: title, one-sentence definition, metadata chips
   (bucket/maturity/effort/best-for, or build-target/feel for recipes), a table of contents, and the
   full body (all sections, in order, faithfully rendered from markdown).
3. **Live previews.** Every runnable HTML sample renders in a sandboxed iframe so the user sees the
   effect, with the source shown beside it.
4. **Copy code.** Every code block has a one-click copy button and shows its language.
5. **Color codes.** Each concept page surfaces the color values used (hex / rgb / oklch / hsl) as
   swatches with copyable values.
6. **Cross-references.** `NN-folder/slug` references (recipes' stack, "Pairs well with") resolve to
   internal links to the target concept.
7. **"Use when" map.** A page derived from the library's INDEX that maps each concept to its
   one-line "use when", filterable/searchable.
8. **Search.** Full-text client-side search across all concepts (Pagefind over built output).
9. **Theme.** Dark-mode-first with a working light mode toggle that respects `prefers-color-scheme`.
10. **404.** A helpful not-found page linking back to domains and search.

## Non-functional requirements
- **Accessibility:** WCAG AA contrast, full keyboard operability, visible focus, reduced-motion
  honored everywhere, iframes sandboxed + titled, semantic landmarks. (See GUIDELINES.md.)
- **Performance:** static output; minimal JS (islands only where needed); no layout-thrash motion;
  fonts loaded without blocking; lazy-load offscreen iframes.
- **Maintainability:** single source of truth — read library `.md` in place; no copied content.
  TypeScript strict; shared logic in `src/lib/`.
- **Anti-slop:** the site does not commit any tell in `_slop-blocklist.md`.
- **Portability:** static build deployable to any static host later without code changes.

## Out of scope (for now)
- Backend, auth, database, comments, user accounts.
- Editing/authoring library content from the UI.
- Hosting/deploy configuration (build must be deploy-ready, but we don't deploy).

## Acceptance criteria
- [ ] `npm install && npm run build` succeeds; Pagefind index generated.
- [ ] Routes generated for all 9 domains and all ~88 concepts, plus home, use-when map, 404.
- [ ] At least 3 concept pages (glassmorphism, parallax, one recipe) verified in-browser: live demo
      renders, code copies, swatches show real values, cross-ref links resolve.
- [ ] Keyboard-only pass on home + a concept page: skip link, focus rings, no traps.
- [ ] Toggling OS reduced-motion calms all site motion and demo motion.
- [ ] Light/dark toggle works and both themes pass AA on text.
- [ ] Editing a source `.md` and rebuilding changes the site (single-source-of-truth holds).
