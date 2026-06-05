# Design Library Website — Build Orchestration

## Mission
A modern, browsable **reference website** for someone new to frontend design. A visitor should
be able to: pick a domain → drill into a concept → **see the effect rendered live** → read
when/when-not → copy working code and color codes → and replicate it in their own project —
without ever leaving the page or reading raw markdown.

The site must itself be a tasteful, anti-slop example of modern web design. It practices what
the library preaches. If the library says "don't put glass on every card," this site doesn't.

**It must also feel calm, not overwhelming.** The content is deep (88 concepts, dense code) but
the *experience* leads with essentials and reveals depth on demand. See "Design principles".

## Source of truth
- The design library lives **inside this repo** at `./library` (vendored so the repo is
  self-contained and deploys anywhere). It is loaded in place via the Astro content-layer
  `glob()` loader pointed at `./library` (see `src/content.config.ts`).
- The library `.md` files are **content data, treated as read-only**: never restructure, reword,
  or hand-edit a concept's markdown to "fix" the site. Fix presentation in the site code instead.
  The one source of truth is the markdown; editing a `.md` + rebuilding updates the site.

## What "done" looks like
- `npm install && npm run build` completes clean (currently 101 static pages).
- A route exists for every domain (9) and every concept (~88), plus home, the "use when" map,
  search, and a 404.
- Each concept page leads with the essentials and reveals depth progressively (see principles),
  with **live sandboxed previews that actually demonstrate the effect**, copy-paste code, color
  swatches, resolved cross-reference links, and references.
- Every Quality Gate item below passes — including the **lead's own visual verification**.

## The loop (how every change runs) — iterate until correct AND expected
This is the required workflow for ALL substantive work. Spawn agents per feature; verify every
step; never hand back work that only "builds" without being *seen* to be right.

1. **PLAN** — restate the goal in one line and the acceptance check that proves it. Partition the
   work so parallel agents touch **disjoint files** (or give each its own git worktree —
   `isolation: "worktree"` — since this is now a git repo).
2. **DISPATCH** a builder sub-agent (model per the policy below) with a precise spec, the relevant
   guidelines (`docs/GUIDELINES.md`, `docs/REQUIREMENTS.md`, `library/_slop-blocklist.md`), and the
   exact files it owns. One feature per agent.
3. **VERIFY (independent)** — a separate verifier sub-agent that does NOT trust the builder checks
   the artifact against the Quality Gate and returns `VERDICT: PASS` or `FAIL` + an actionable list.
   Use a cheaper model here than the builder.
4. **VERIFY (visual — the lead does this, every time)** — the lead runs the real toolchain
   (`npm run build` / `astro check`) AND **looks at the result in the live preview**: screenshot the
   affected pages, exercise the interaction (scroll the demo, open the collapsible, toggle the
   theme, resize to mobile), and confirm it matches the intent. A green build is necessary, not
   sufficient. If it doesn't *look and behave* right, it is not done.
5. **GATE / REPAIR** — on any FAIL (verifier OR visual), re-dispatch the builder with the specific
   notes appended. **Repeat steps 2–5 until the output is correct and expected** (cap ~3 cycles per
   artifact; if still failing, log it in `_needs-human.md` and continue — never block the whole run
   on one file).

The loop never interrupts a running sub-agent. Verification happens on the returned artifact.

## Model policy (use the cheapest model that can do the job correctly)
The authoritative decision matrix is **`docs/MODEL_ROUTING.md`** — consult it before
dispatching any agent and state the chosen model + the rule it matched. Summary below.
State the model when dispatching. Do not default everything to Opus, and do not compromise
on Opus where taste decides the outcome.

| Work | Model |
|------|-------|
| Taste-critical: design system, home, concept-page visual design, motion/preview UX | **Opus** |
| Logic/mechanical: parsing, loaders, filters, search wiring, domain landing, refactors | **Sonnet** |
| Independent verification of a substantive artifact | **Sonnet** |
| Cheap mechanical re-checks, link/route sweeps, grep-style audits, lint passes | **Haiku** |

The lead's own visual verification is done in the main session with the preview tools (not a
sub-agent) — screenshots and interaction are the lead's job.

## Design principles (calm, not a manual)
The site is a reference, but the first screen of any page must not feel like a wall.
- **Progressive disclosure.** Concept pages lead with: title, one-line definition, when-to-use /
  when-not, and ONE live preview. Deep material (full code listings, secondary sections, the long
  tail of color swatches, every cross-ref) is revealed on demand via accessible disclosures/tabs —
  collapsed by default, keyboard-operable, and fully present without JS (use `<details>` or an
  island that degrades to open).
- **Breathing room.** Generous vertical rhythm and a capped reading measure beat density. One idea
  per band. Let whitespace do the separating, not borders on everything.
- **One point of view.** Keep the warm-neutral + single-accent OKLCH system and the Fraunces
  editorial voice. Per-domain hue stays a small dot, never a rainbow.
- **Quiet chrome, loud content.** Navigation, meta, and TOC recede; the live demo and the prose are
  the stars.

## Live preview quality bar (picture-perfect)
A preview that doesn't show its effect is a bug.
- **Scroll-driven demos** (parallax, sticky/pinning, scrollytelling, scroll-linked/scrubbing,
  scroll-triggered, horizontal-scroll) must be presented in a frame that is actually scrollable and
  tall enough to reveal the effect, with a clear scroll affordance — or auto-demonstrate on view.
  The iframe is the scroll root for `animation-timeline: scroll()`; size it so there is real travel.
- **Pointer/hover demos** (cursor glow, magnetic buttons, spotlight) need a hint that they react to
  the pointer, and must not look broken when static.
- **Looping/auto demos** (marquee, animated gradients, loaders) should be visible immediately.
- Every demo honors `prefers-reduced-motion` inside the sample; the host chrome adds no motion.
- The lead must open each fixed category in the preview and confirm the effect is visible before
  marking it done.

## Quality Gate (the verifier's checklist)
A file PASSES only if ALL are true. Return per-item PASS/FAIL.
1. **Builds** — `npm run build` / `astro check` pass with no errors or type errors for this artifact.
2. **Scope** — does exactly what its spec said; no missing pieces, no unrelated churn.
3. **Looks/behaves right** — matches the stated intent when viewed and exercised (the lead confirms
   visually; the verifier notes anything obviously off in the rendered HTML/markup).
4. **Calm** — leads with essentials; depth is progressively disclosed; not a wall of content.
5. **Accessibility** — skip link reachable, visible `:focus-visible` rings, all motion behind
   `prefers-reduced-motion`, color contrast ≥ WCAG AA, every `<iframe>` has `title` + `sandbox`,
   disclosures keyboard-operable and present without JS, images have `alt`, controls are real
   buttons/links with names.
6. **Anti-slop** — cross-checked against `library/_slop-blocklist.md`. No purple→pink-on-white, no
   generic-blue-everywhere, no hero+3-identical-cards, no uniform fade-up-on-everything, no
   glass-on-every-card. Type has a point of view.
7. **Self-contained code** — code shown to users is complete and runnable; live previews actually
   render and demonstrate the intended effect.
8. **Conventions** — islands only where interactivity is needed; TS strict clean; sentence-case
   headings in UI chrome; no emoji in UI chrome.

Verifier output format (return to lead; also append to `<artifact>.review.md` when practical):
```
VERDICT: PASS | FAIL
- [PASS/FAIL] Builds — note
- [PASS/FAIL] Scope — note
- [PASS/FAIL] Looks/behaves right — note
- [PASS/FAIL] Calm — note
- [PASS/FAIL] Accessibility — note
- [PASS/FAIL] Anti-slop — note
- [PASS/FAIL] Self-contained code — note
- [PASS/FAIL] Conventions — note
REPAIR NOTES (if FAIL): <specific, actionable list>
```

## Repo / deploy
- Self-contained Astro static site. `npm run build` → `dist/` (HTML + `pagefind/` search index).
- Published to GitHub as `DhanushAnegondi/design_rules` (website only; agents/skills excluded via
  `.gitignore`). Deploy `dist/` to any static host; set `site` in `astro.config.mjs` first.

## Hard rules
- Do not hand-edit `./library` concept markdown to work around a presentation problem — fix the
  site code. Treat the markdown as read-only content data.
- Accessibility is non-negotiable; a motion feature with no reduced-motion path is an automatic FAIL.
- A change is not done until the lead has SEEN it render correctly — build-passing alone is not done.
- Prefer static HTML; reach for a React island only when the feature needs client JS.
- Sentence-case headings in UI chrome, no emoji in UI chrome, no marketing fluff.
- Token budget is not the concern; correctness, taste, calm, and accessibility are.
- Never fabricate a reference URL or claim a build passed without running it.
