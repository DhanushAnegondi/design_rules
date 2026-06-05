# Design & code guidelines

These are the rules every builder agent and every page must follow. They exist so the site reads as
*designed*, not *generated*, and so it stays usable for someone brand new to frontend.

## Audience & voice
- The primary reader is **new to frontend design**. Chrome copy (nav, labels, empty states, helper
  text) must be plain and concrete. No jargon without a one-line plain-English gloss.
- Never dumb down the library content itself — render it faithfully. The *site's own* copy is what
  stays beginner-friendly.
- Concrete over hype. Banned headline words (they are AI tells): empower, seamless, elevate, unlock,
  supercharge. Write specific sentences.

## Design language

### Color (OKLCH tokens, defined in `src/styles/tokens.css`)
- **One committed base hue + exactly one accent.** Neutral ramp carries a faint warm tint, not pure
  gray. Define everything as semantic tokens (`--bg`, `--surface`, `--text`, `--muted`, `--border`,
  `--accent`, `--accent-contrast`), never raw hex in components.
- **Forbidden (from `_slop-blocklist.md`):** purple/indigo→pink gradient on white; generic SaaS blue
  (`#3B82F6`) everywhere; rainbow categorical color (each domain a different hue is fine *only* as a
  small accent dot, not as full-tile backgrounds).
- Dark-mode first; light mode is a real, tested second theme. Verify text pairings at **WCAG AA**
  (4.5:1 body, 3:1 large/UI). Never ship a pairing you didn't check.

### Type
- Display face with a point of view (a serif like Fraunces/Instrument Serif, or a characterful sans
  like General Sans/Geist) + **system-ui** body + **ui-monospace** for code, labels, and color values.
- Real **modular scale** with fluid `clamp()` sizing. Deliberate weight contrast (e.g. 400 body vs
  600/700 display). Not everything one size, one weight.
- Reading measure for prose capped (~66–72ch) so concept pages are comfortable.

### Layout
- Home uses an **asymmetric / bento** domain grid with genuine size variance — NOT hero + three
  identical feature cards. Vary rhythm; allow full-bleed moments.
- Concept page is an editorial reading column with full-bleed live-demo blocks breaking out of the
  measure. Sticky table of contents on wide screens.

### Motion
- Animate **`transform` and `opacity` only**. Custom easing (a real cubic-bezier or spring), not the
  default `ease`. Stagger meaningfully; let some things just appear.
- **Every** animation, transition, parallax, or autoplay sits behind
  `@media (prefers-reduced-motion: reduce)` with a calm fallback (instant state, no movement).
- No autoplaying carousels without controls. No motion that blocks reading.

## Accessibility checklist (every page)
- A visible **skip-to-content** link is the first focusable element.
- `:focus-visible` rings on every interactive element — solid, high-contrast, with `outline-offset`.
- Semantic HTML: real `<button>`/`<a>`, one `<h1>` per page, headings in order, landmarks
  (`header`/`nav`/`main`/`footer`).
- Every `<iframe>` live preview has a descriptive `title` and a `sandbox` attribute.
- All images/illustrations have meaningful `alt` (or `alt=""` if decorative).
- Touch targets ≥ 44×44px. Honor `prefers-reduced-motion` and `prefers-color-scheme`.
- Color is never the only signal (pair with text/icon/shape).

## Live preview rules
- A code block is "runnable" only when its HTML starts with `<!DOCTYPE html>`. Render those in a
  sandboxed `<iframe srcdoc>` (`sandbox="allow-scripts"` only — no same-origin, no top navigation).
- Show the source code beside/under the preview with a **copy** button and the detected language.
- Provide a "reload demo" affordance and surface a note when a demo contains motion.
- Never execute untrusted remote code; previews are self-contained library samples only.

## Code conventions
- Astro for all static structure; a React island (`.tsx` with a `client:*` directive) ONLY when the
  feature needs the browser (copy, reload, theme toggle, search). Default to `client:visible`/`idle`.
- TypeScript **strict**; no `any` in shipped code. Shared parsing/types live in `src/lib/`.
- Components are small and single-purpose. No raw hex in components — use tokens.
- Sentence-case UI headings. No emoji in UI chrome.

## Definition of done for any page/component
Builds clean (`astro check` + `npm run build`), passes the accessibility checklist, passes the
anti-slop cross-check, uses tokens (no raw color), and — if it shows code — the code is complete and,
where runnable, the live preview renders the real effect.
