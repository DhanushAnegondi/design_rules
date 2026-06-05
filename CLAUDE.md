# Design Library Website — Build Orchestration

## Mission
Turn the finished markdown knowledge base at
`../design-research-system/design-research-system/library/` into a modern, browsable
**reference website** for someone new to frontend design. A visitor should be able to:
pick a domain → drill into a concept → **see the effect rendered live** → read when/when-not
→ copy working code and color codes → and replicate it in their own project — without ever
leaving the page or reading raw markdown.

The site must itself be a tasteful, anti-slop example of modern web design. It practices what
the library preaches. If the library says "don't put glass on every card," this site doesn't.

## Source of truth
- The library `.md` files are **read-only**. This project reads them in place via the Astro
  content-layer `glob()` loader. Never edit, move, or duplicate library content.
- One source of truth: editing a `.md` in the library and rebuilding updates the site.

## What "done" looks like
- `npm install && npm run build` completes clean.
- A route exists for every domain (9) and every concept file (~88), plus home, the "use when"
  map, search, and a 404.
- Each concept page shows: definition, metadata chips, table of contents, full rendered body,
  **live sandboxed previews** beside copy-paste code, color swatches, resolved cross-reference
  links, and references.
- Every Quality Gate item below passes.

## The loop (how this build runs)
The lead agent scaffolds the base, then for each phase:
1. **DISPATCH** a builder sub-agent (model chosen per the policy below) with a precise spec and
   the relevant guidelines (`docs/GUIDELINES.md`, `docs/REQUIREMENTS.md`, `_slop-blocklist.md`).
2. **VERIFY** with a separate `verifier` sub-agent that does NOT trust the builder. It checks the
   artifact against the Quality Gate and returns `VERDICT: PASS` or `FAIL` + an actionable list.
3. **GATE** on the real toolchain: `npm run build` / `astro check` must pass. On FAIL, re-dispatch
   the builder with the verifier's notes appended. Max 3 repair cycles per artifact; if still
   failing, log it in `_needs-human.md` and continue — never block the whole build on one file.

The loop never interrupts a running sub-agent. Verification happens on the returned artifact.

## Model policy (not everything needs Opus)
| Work | Model |
|------|-------|
| Taste-critical (design system, home, concept page visual design) | Opus |
| Mechanical/logic (parsing, loaders, filters, search wiring, domain landing) | Sonnet |
| Verification passes, spot checks | Sonnet (Haiku for cheap mechanical re-checks) |
Choose the cheapest model that can do the job correctly. State the model when dispatching.

## Quality Gate (the verifier's checklist)
A file PASSES only if ALL are true. Return per-item PASS/FAIL.
1. **Builds** — `npm run build` / `astro check` pass with no errors or type errors for this artifact.
2. **Scope** — does exactly what its spec said; no missing pieces, no unrelated churn.
3. **Accessibility** — skip link reachable, visible `:focus-visible` rings, all motion behind
   `prefers-reduced-motion`, color contrast ≥ WCAG AA, every `<iframe>` has `title` + `sandbox`,
   images have `alt`, interactive controls are real buttons/links with names.
4. **Anti-slop** — cross-checked against `../design-research-system/.../library/_slop-blocklist.md`.
   No purple→pink-on-white, no generic-blue-everywhere, no hero+3-identical-cards, no uniform
   fade-up-on-everything, no glass-on-every-card. Type has a point of view.
5. **Self-contained code** — code shown to users is complete and runnable; live previews actually
   render the intended effect.
6. **Single source of truth** — no library content copied into this project; loader reads in place.
7. **Conventions** — islands used only where interactivity is needed; TS strict clean; sentence-case
   headings in UI chrome; no emoji in UI chrome.

Verifier output format (return to lead; also append to `<artifact>.review.md` when practical):
```
VERDICT: PASS | FAIL
- [PASS/FAIL] Builds — note
- [PASS/FAIL] Scope — note
- [PASS/FAIL] Accessibility — note
- [PASS/FAIL] Anti-slop — note
- [PASS/FAIL] Self-contained code — note
- [PASS/FAIL] Single source of truth — note
- [PASS/FAIL] Conventions — note
REPAIR NOTES (if FAIL): <specific, actionable list>
```

## Hard rules
- Never edit anything under `../design-research-system/` — it is read-only source.
- Accessibility is non-negotiable; a motion feature with no reduced-motion path is an automatic FAIL.
- Prefer static HTML; reach for a React island only when the feature needs client JS.
- Sentence-case headings in UI chrome, no emoji in UI chrome, no marketing fluff.
- Token budget is not the concern; correctness, taste, and accessibility are.
- Never fabricate a reference URL or claim a build passed without running it.
