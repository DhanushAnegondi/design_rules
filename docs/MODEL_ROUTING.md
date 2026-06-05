# Model routing — which model for which task

The lead MUST consult this file before dispatching any agent, and state the chosen
model + the rule it matched. The goal: never overpay for mechanical work, never
under-power taste-critical work. **Do not compromise on Opus where taste decides the
outcome.** When in doubt between two tiers for visual/taste work, pick the higher one.

## The tiers

| Tier | Model | Use it for |
|------|-------|------------|
| **Taste** | **opus** | Anything where the *look, feel, motion, composition, or hierarchy* is the deliverable and a wrong call is obvious to the eye: concept-page visual layout, per-card backgrounds/animations, the live-demo experience, the home/hero, color & type decisions, motion choreography, "make it beautiful / visually rich" work. Also: ambiguous design problems that need judgment, and synthesis of design critique. |
| **Logic** | **sonnet** | Deterministic build/refactor work with a clear spec and a verifiable result: component plumbing, props/state wiring, parsing, loaders, filters/dropdowns behavior, modal mechanics, accessibility wiring, content-architecture refactors, TypeScript. Independent verification of a substantive artifact. |
| **Mechanical** | **haiku** | Cheap, well-bounded passes: route/link sweeps, grep-style audits, classification tallies, one-rule CSS fixes, renames, dead-code removal, lint/format, "find all X" reports, re-checks of a single property. |

## Decision procedure (apply in order)
1. **Is the outcome judged by eye?** (beauty, layout, motion, composition, "rich not verbose") → **opus**. No compromise.
2. **Else, is it deterministic with a clear spec and a checkable result?** (wiring, refactor, filter logic, modal behavior, parsing) → **sonnet**.
3. **Else, is it a bounded mechanical sweep or a one-line fix?** → **haiku**.
4. **Verification:** independent artifact verification → **sonnet**; a single cheap re-check (one selector, one count, one route) → **haiku**. The lead's own *visual* verification is done in the main session with the preview tools — never delegated.
5. **Tie-break:** if a task is part-taste, part-logic and they can't be cleanly split, run the taste part on **opus** and hand the mechanical remainder to **sonnet/haiku** — don't average down to save tokens on the part that decides quality.

## Skills to apply (this repo's `../../skills/`)
Builder agents should READ and apply the relevant SKILL.md before designing:
- Taste / visual richness / motion: `01-taste-and-craft/high-end-visual-design`, `01-taste-and-craft/impeccable`, `01-taste-and-craft/gpt-taste`, `01-taste-and-craft/design-taste-frontend`.
- Aesthetic system (calm editorial): `02-design-systems/minimalist-ui`.
- Audit / upgrade existing: `05-audit-and-redesign/redesign-existing-projects`, `05-audit-and-redesign/web-design-guidelines`.
- React motion / perf: `04-react-frontend/vercel-react-view-transitions`, `vercel-react-best-practices`.

## Examples
- "Give each domain card its own animated background" → **opus** (rule 1).
- "Put code behind a View-code modal with a copy button" → modal *mechanics* **sonnet** (rule 2); the *visual design* of the modal/trigger and how the demo becomes the star → **opus** (rule 1). Split accordingly.
- "Turn effort/maturity into dropdown filters" → **sonnet** (rule 2).
- "Audit every concept page for sections that are still text/code dumps" → **haiku** (rule 3).
- "Verify the redesigned concept page builds and is a11y-clean" → **sonnet** (rule 4).
