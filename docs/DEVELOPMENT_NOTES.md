# Development notes — Design Library website

Chronological log of how this site was built. For the reference architecture, see `HANDOFF.md`.

Date: 2026-06-05. Built in one session via a lead-orchestrated agent loop.

---

## Goal

Take the finished read-only markdown library (`../design-research-system/.../library/`, 88 concepts
across 9 domains) and build a modern, browsable website for someone new to frontend: browse by
domain, open a concept, see it running live, read when/when-not, copy code and color codes. The site
itself had to be a tasteful, anti-slop example.

## Decisions taken up front (with the user)

- **Astro + React islands** — static-first, markdown-native, minimal JS.
- **Live sandboxed previews + code** — iframes that render the real effect beside copy-paste code.
- **Read the library in place** — single source of truth via Astro's content-layer `glob()` loader;
  no duplication.
- **Local-first** — great `npm run dev`/`build`; deploy-ready but not deployed.

These were confirmed before any code, then captured in the plan file
`C:\Users\Dhanush\.claude\plans\steady-watching-salamander.md`.

## Process / orchestration

A lead agent scaffolded the base, then for each phase dispatched a **builder** sub-agent and a
separate **verifier** sub-agent that did not trust the builder, re-ran the toolchain
(`npm run build` / `astro check`), checked the Quality Gate in `CLAUDE.md`, and returned PASS or an
actionable FAIL list. On FAIL the lead re-dispatched with the notes (max 3 cycles). Model policy:
Opus for taste-critical phases, Sonnet for logic + every verification.

## Phase log

### Phase 0 — Scaffold + governance (lead)
Created the Astro project (`package.json`, `astro.config.mjs`, `tsconfig.json`), the governance docs
(`CLAUDE.md`, `docs/GUIDELINES.md`, `docs/REQUIREMENTS.md`), permissions (`.claude/settings.json`),
local agent defs, `src/lib/domains.ts`, and a first-pass `src/styles/tokens.css`. Confirmed the
library's metadata format is consistent (4 meta lines per concept; recipes use a different header).
`npm install` (Astro 5.18, React 19, shiki 3, marked 15, pagefind 1.5).

### Phase 1 — Content pipeline (Sonnet) — PASS
Built `src/content.config.ts` (glob loader → library) and `src/lib/parse-library.ts` (parse title,
definition, metadata, sections, code blocks with shiki highlight + runnable flag, colors, cross-refs).
Verified: build clean, **88 concepts** parsed, glassmorphism metadata/colors correct.
Verifier PASS.

### Phase 2 — Design system / shell (Opus) — FAIL → repaired → PASS
Built `tokens.css` (extended), `global.css`, `Base.astro`, `ThemeToggle.tsx`, self-hosted Fraunces,
theme-flash-prevention head script.
**Verifier caught a CRITICAL bug:** the responsive nav had a dead zone at **960–1375px** where the 9
domain links were unreachable (inline links hidden, disclosure toggle also hidden). Plus minor: raw
hex in the debug page, skip-link used `:focus` not `:focus-visible`, ambiguous `aria-pressed`, kebab
SVG prop. **Repair (Opus):** replaced the two-mode nav with a single pure-CSS Browse disclosure that
works at all widths; fixed the minors. Re-verified PASS.

### Phase 3 — Pages + components (sequential to avoid concurrent-build corruption; no git → no worktrees)
- **3a Concept page (Opus) — FAIL → fixed → PASS.** Built `[domain]/[slug].astro` + `LivePreview`,
  `CodeBlock`, `ColorSwatches`, `MetaChips`, `Toc`, `ReferenceList`. 88 concept routes generated.
  Verifier caught a raw `#fff` (→ added `--preview-bg` token) and an un-humanized recipe "Build
  target" slug (→ humanized in `MetaChips`). Fixed by lead, rebuilt clean.
- **3b Home + cards (Opus) — PASS (with a fix found in the combined verify).** Built `index.astro`,
  `DomainCard`, `ConceptCard`. Asymmetric bento, correct counts (12/14/13/11/11/6/8/7/6).
- **3c Domain landing / guide / search / 404 (Sonnet) — PASS.** Built `[domain]/index.astro`,
  `guide.astro`, `search.astro`, `404.astro`. 102 pages total at this point.
- **Combined verify (Sonnet) of 3b+3c — FAIL → fixed → PASS:** flagged the home "How to use" as a
  three-equal-column layout (the banned hero+3-cards slop pattern) and two leftover kebab SVG props in
  `ThemeToggle`. Lead fixed: rewrote "How to use" as asymmetric editorial numbered rows; corrected the
  props. Rebuilt clean.

### Phase 4 — Integration + live verification (lead)
Removed the temporary debug page; final build → **101 static pages**, Pagefind index regenerated.
Ran `npm run preview` and verified in a real browser via the preview tooling:
- Home bento asymmetric with real size variance; correct counts.
- Concept page (glassmorphism): one `<h1>`, iframe `sandbox="allow-scripts"` + title + lazy + real
  srcdoc, 11 TOC links, 33 color/copy controls.
- Recipe (saas-landing): humanized "Build" chip, 45 inline cross-refs all resolving (HTTP 200).
- Nav reachable at 1100px (former dead zone); single column + no overflow at 375px.
- Theme toggle dark↔light; guide filter ("glass"→3, aria-live announces); Pagefind search
  ("parallax"→10, first result `/scroll-motion/parallax/`).
- Skip link first focusable; reduced-motion rule served; no console errors; key routes return 200.

## What verification caught (value of the loop)

1. Critical nav dead zone (960–1375px) — would have made the site unusable on tablets/laptops.
2. Home "How to use" was the exact slop skeleton the project exists to avoid.
3. Several raw-hex / a11y-attribute / convention slips.

Each was fixed and re-verified before moving on.

## Outcome

101 static pages, builds clean (`astro check` 0 errors), all acceptance criteria met. Single source
of truth holds (edit a library `.md` + rebuild → site updates). Search works in the built/preview
site. Not deployed (by request) but deploy-ready.

## Follow-ups (optional)

- Dev-time search (Pagefind needs a build) if wanted.
- Per-demo light/dark preview backgrounds.
- Richer "Start here" curation on the home page.
- If a git repo is added at the workspace root, future multi-file phases can run as parallel,
  worktree-isolated agents.
