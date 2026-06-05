# Dark mode aesthetic

> A dark visual style built on near-black surfaces, elevation by lightness steps, one restrained focal glow, and desaturated accents — not pure black with neon and heavy shadows.

**Bucket:** visual style
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, apps, dashboards

## What it is
Dark mode as an *aesthetic* (not just a token swap) is a deliberately quiet, low-glare surface system. The page sits on a near-black base around `#0d0d10` rather than pure `#000`, cards and panels separate by getting *lighter* (small lightness steps) instead of casting heavy drop shadows, accents are pulled toward desaturated/muted hues so they don't vibrate against the dark field, and at most one soft focal glow draws the eye. What the user perceives is depth and calm: surfaces that feel layered and a single point of energy, instead of a flat black void or a neon arcade.

## When to use
- Reading- or focus-heavy products: editors, dashboards, developer tools, media/portfolio sites where a dark canvas keeps chrome out of the way.
- Low-light or evening usage contexts (media playback, code, design tools) where a bright UI is fatiguing.
- Brand moods that want to feel premium, technical, cinematic, or understated.
- As one half of a real light/dark pair driven by `prefers-color-scheme` — let the user's OS choose, and let them override.

## When NOT to use
- Long-form body reading for a *general* audience as the *only* option. White-on-dark worsens "halation" (text appears to bloom/blur), which is harder for people with astigmatism (roughly half the population has some) and can slow readers with dyslexia. Dark mode helps some users and hurts others — ship it as a choice, not a default-for-everyone.
- High-ambient-light environments (outdoors, bright offices) where a dark UI can wash out and lose contrast.
- Dense data tables and forms where you actually want maximum legibility; very dark themes can drop fine borders below visibility.
- The overused trap: "dark mode = `#000` background + glowing purple-to-pink gradients + neon everywhere." That's the AI/SaaS cliché, not the aesthetic (see Anti-slop).

## How it works
Three mechanisms do the visual work, and one token layer makes it switchable.

1. **Near-black base, never pure black.** Pure `#000` against white-ish text creates the harshest possible brightness delta, which maximizes halation and eye strain. A base around `#0d0d10`–`#121212` keeps the "dark" feeling while softening the bloom. Text is off-white (`#e8e8ee`), not pure `#fff`, for the same reason.

2. **Elevation by lightness, not shadow.** In light mode, higher surfaces cast darker shadows. In dark mode that reads as muddy, because shadow-on-dark is nearly invisible. Instead, each elevation step gets *lighter*: base `#0d0d10` → surface `#16181d` → raised `#1e2027` → overlay `#262932`. The eye reads "closer to the light" as "closer to me." A faint top hairline border (`rgba(255,255,255,0.06)`) reinforces the edge. Shadows still exist but stay subtle and large, never the primary depth cue.

3. **One focal glow, desaturated accents.** A single soft radial glow (one hue, low opacity, large blur) behind a hero or a key control gives the page a center of gravity. Accents are desaturated toward grey-blue/green so they sit *in* the dark field rather than buzzing on top of it. Saturated, bright accents on near-black produce chromatic vibration and afterimages.

4. **Token side (cross-ref: `05 dark-mode-token-strategy`).** Make tokens *semantic*, not literal: name them by role (`--bg`, `--surface`, `--surface-raised`, `--text`, `--text-muted`, `--border`, `--accent`), and define both themes against those names. The modern native switch is `color-scheme: light dark` on `:root` plus the CSS `light-dark()` function, which returns the first value in light context and the second in dark with no media query — e.g. `--bg: light-dark(#ffffff, #0d0d10);`. `light-dark()` is Baseline since May 2024 (Chrome/Edge 123, Safari 17.5, Firefox 120). Pair with `<meta name="color-scheme" content="light dark">` so form controls and scrollbars theme too, and a 3-state toggle (light / dark / system) that writes to `data-theme` for an explicit override. That's the whole token story; this entry is about how the dark theme should *look*.

## Working code

### Vanilla HTML/CSS — full dark-aesthetic page (elevation + one glow)
Self-contained; open it in a browser. Every color is real and the contrast ratios in the comments were computed against the base `#0d0d10`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>Dark mode aesthetic</title>
<style>
  :root {
    color-scheme: dark;
    /* near-black base, NOT #000 */
    --bg:            #0d0d10;
    /* elevation = lightness steps, not heavier shadow */
    --surface:       #16181d;  /* +1 */
    --surface-raised:#1e2027;  /* +2 */
    --overlay:       #262932;  /* +3 */
    /* text: off-white, not pure #fff */
    --text:          #e8e8ee;  /* 15.9:1 on --bg  (AAA) */
    --text-muted:    #a8a8b3;  /* 8.24:1 on --bg  (AAA) */
    --text-faint:    #7c8190;  /* 4.99:1 on --bg  (AA)  */
    /* desaturated accent — sits in the field, doesn't buzz */
    --accent:        #8ab4f8;  /* 9.21:1 on --bg, 7.72:1 on --surface-raised */
    --accent-ink:    #0d0d10;  /* dark text for ON-accent buttons */
    /* hairline edges do the work shadows can't on dark */
    --border:        rgba(255,255,255,0.07);
    --border-strong: rgba(255,255,255,0.12);
    /* one focal glow, single hue, low opacity, large blur */
    --glow:          rgba(138,180,248,0.16);
    --radius: 16px;
  }

  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }

  /* THE single focal glow — fixed, behind content, never under body copy */
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(60rem 40rem at 70% -10%, var(--glow), transparent 60%);
    z-index: 0;
  }

  .wrap { position: relative; z-index: 1; max-width: 60rem; margin: 0 auto; padding: 8vh 1.5rem 12vh; }

  .eyebrow {
    color: var(--text-faint);
    font-size: 0.8rem; letter-spacing: 0.14em; text-transform: uppercase;
    margin: 0 0 1rem;
  }
  h1 {
    font-size: clamp(2.25rem, 6vw, 4rem); line-height: 1.05;
    letter-spacing: -0.02em; font-weight: 650; margin: 0 0 1rem; max-width: 18ch;
  }
  .lede { color: var(--text-muted); font-size: 1.125rem; max-width: 52ch; margin: 0 0 2rem; }

  .btn {
    display: inline-block; padding: 0.7rem 1.25rem; border-radius: 10px;
    background: var(--accent); color: var(--accent-ink);
    font-weight: 600; text-decoration: none; border: 0;
  }
  .btn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;           /* visible focus ring on dark — mandatory */
  }

  /* elevation ladder: each card is LIGHTER than the one behind, + hairline top */
  .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); margin-top: 3.5rem; }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-top-color: var(--border-strong);   /* light catches the top edge */
    border-radius: var(--radius);
    padding: 1.4rem;
    /* shadow stays large + faint; it is NOT the depth cue */
    box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.45);
  }
  .card.raised   { background: var(--surface-raised); }
  .card.overlay  { background: var(--overlay); }
  .card h3 { margin: 0 0 0.4rem; font-size: 1.05rem; }
  .card p  { margin: 0; color: var(--text-muted); font-size: 0.95rem; }
  .tag { color: var(--accent); font-size: 0.8rem; letter-spacing: 0.04em; }
</style>
</head>
<body>
  <main class="wrap">
    <p class="eyebrow">Release 2.4 — June 2026</p>
    <h1>A quieter dark, with one place to look.</h1>
    <p class="lede">Near-black surfaces, depth from lightness instead of shadow,
       and a single soft glow. No pure black, no neon, no purple-to-pink.</p>
    <a class="btn" href="#">Read the changelog</a>

    <section class="grid" aria-label="What changed">
      <article class="card">
        <p class="tag">Surface +1</p>
        <h3>Base layer</h3>
        <p>Sits on #0d0d10. Off-white text avoids the halation of #fff on #000.</p>
      </article>
      <article class="card raised">
        <p class="tag">Surface +2</p>
        <h3>Raised panel</h3>
        <p>Lighter, not heavier-shadowed. Lightness is the depth cue on dark.</p>
      </article>
      <article class="card overlay">
        <p class="tag">Surface +3</p>
        <h3>Overlay</h3>
        <p>Top hairline catches the light so the edge reads without a hard border.</p>
      </article>
    </section>
  </main>
</body>
</html>
```

### Native light/dark switch with `light-dark()` (the token side, condensed)
Same aesthetic, but the values flip with the OS or an explicit `data-theme` override. No media query needed for the colors themselves.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="color-scheme" content="light dark">
<style>
  :root {
    color-scheme: light dark;                 /* enables light-dark() + native UI theming */
    --bg:        light-dark(#ffffff, #0d0d10);
    --surface:   light-dark(#f4f4f6, #16181d);
    --text:      light-dark(#16181d, #e8e8ee); /* dark mode text 15.9:1 on #0d0d10 */
    --muted:     light-dark(#5b6070, #a8a8b3);
    --accent:    light-dark(#2f6fe0, #8ab4f8); /* desaturate the accent in dark */
    --border:    light-dark(rgba(0,0,0,.10), rgba(255,255,255,.07));
  }
  /* explicit override: a 3-state toggle writes one of these to <html data-theme> */
  :root[data-theme="light"] { color-scheme: light; }
  :root[data-theme="dark"]  { color-scheme: dark;  }

  body { margin:0; background:var(--bg); color:var(--text);
         font:16px/1.6 system-ui, sans-serif; }
  .panel { background:var(--surface); border:1px solid var(--border);
           border-radius:14px; padding:1.25rem; max-width:36rem; margin:8vh auto; }
  .panel p { color:var(--muted); }
  button { background:var(--accent); color:var(--bg); border:0;
           padding:.55rem .9rem; border-radius:9px; font-weight:600; cursor:pointer; }
  button:focus-visible { outline:2px solid var(--accent); outline-offset:3px; }
</style>
</head>
<body>
  <div class="panel">
    <h2>Theme follows your system</h2>
    <p>color-scheme tells the browser to theme scrollbars and form controls too.</p>
    <button id="t">Toggle explicit dark</button>
  </div>
  <script>
    // explicit override beats the OS preference; persist to taste
    const root = document.documentElement;
    document.getElementById('t').addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    });
  </script>
</body>
</html>
```

### React + Tailwind (v4) — semantic dark tokens, elevation by lightness
Tailwind v4 reads the same custom properties; the dark variant flips them. Realistic production shape.

```jsx
// app/globals.css
// @import "tailwindcss";
// @theme {
//   --color-bg:        #0d0d10;
//   --color-surface:   #16181d;
//   --color-raised:    #1e2027;
//   --color-text:      #e8e8ee;   /* 15.9:1 on bg */
//   --color-muted:     #a8a8b3;   /* 8.24:1 on bg */
//   --color-accent:    #8ab4f8;   /* desaturated, 9.21:1 on bg */
// }

export function Hero() {
  return (
    <main className="relative min-h-screen bg-bg text-text">
      {/* one focal glow, single hue, behind content, not under body copy */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 40rem at 70% -10%, rgba(138,180,248,0.16), transparent 60%)",
        }}
      />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-sm uppercase tracking-[0.14em] text-muted">June 2026</p>
        <h1 className="mt-3 max-w-[18ch] text-5xl font-semibold leading-[1.05] tracking-tight">
          A quieter dark, with one place to look.
        </h1>
        <p className="mt-4 max-w-prose text-lg text-muted">
          Near-black, depth from lightness, one soft glow.
        </p>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            ["bg-surface", "Surface +1"],
            ["bg-raised", "Surface +2"],
            ["bg-[#262932]", "Surface +3"],
          ].map(([bg, label]) => (
            <article
              key={label}
              className={`${bg} rounded-2xl border border-white/[0.07] border-t-white/[0.12] p-5
                          shadow-[0_8px_24px_rgba(0,0,0,0.45)]`}
            >
              <p className="text-sm text-accent">{label}</p>
              <p className="mt-1 text-sm text-muted">Lighter, not heavier-shadowed.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
```

## Variations
- **Charcoal vs OLED-true black.** Knob = base lightness. Charcoal (`#16181d`) is gentler and more premium; near-true-black (`#08080a`) saves power on OLED (black pixels are fully off) and suits media/photo viewers — but push it too far to `#000` and you reintroduce halation and lose your darkest elevation step. Keep at least one step of headroom below your base for shadows/scrims.
- **Warm vs cool dark.** Knob = base hue. Warm near-black (a hint of brown/red, `#12100e`) feels editorial/cozy; cool (`#0d0d10`, slight blue) feels technical. Pick one and tint every surface the same direction.
- **Glow vs flat.** Knob = presence of the focal radial. Flat dark (no glow) reads utilitarian and dashboard-appropriate; one glow reads marketing/hero. Never more than one.
- **Dim vs deep.** Knob = elevation contrast between steps. Wide steps (more lightness per layer) read playful and app-like; narrow steps read serious and dense. Keep adjacent surfaces distinguishable (a perceptible lightness delta).
- **Accent saturation.** Knob = chroma. The aesthetic favors desaturated accents; bumping saturation for a single CTA is fine, doing it for everything causes vibration.

## Accessibility
- **prefers-reduced-motion:** the glow is static here, so nothing to gate. If you animate it (drift/pulse), wrap the animation in `@media (prefers-reduced-motion: no-preference)` and ship the static gradient as the baseline.
- **prefers-color-scheme + override:** respect the OS setting via `color-scheme`/`light-dark()`, and always provide an explicit light/dark/system toggle. Dark mode helps some users and hurts others (astigmatism halation, some dyslexic readers); forcing it on everyone is the accessibility failure, not the colors.
- **Contrast (measured, not asserted):** body text `#e8e8ee` on `#0d0d10` = **15.9:1** (AAA), muted `#a8a8b3` = **8.24:1** (AAA), faintest text `#7c8190` = **4.99:1** (clears AA 4.5:1). Desaturated accent `#8ab4f8` = **9.21:1** on base and **7.72:1** on the raised surface. Don't let "muted on dark" drift below 4.5:1 for any real text. Non-text UI (icons, borders that convey state) needs 3:1.
- **Focus visibility:** focus rings are easy to lose on dark. Use `:focus-visible` with a 2px accent outline and `outline-offset: 3px` so it clears the element. Never remove focus outlines.
- **Pointer/touch:** purely visual — no hover-only affordances; hit targets stay ≥ 44px. The glow is `pointer-events: none` so it never intercepts taps.
- **Screen readers:** decorative glow is `aria-hidden` / a CSS pseudo-element, so it's invisible to AT. Elevation is conveyed visually only; never encode meaning (status, hierarchy) in surface lightness alone — pair with text/labels.

## Performance
- **The focal glow is a single radial-gradient** on a fixed pseudo-element — effectively free (one composited paint, no per-frame work). Don't fake it with a stack of blurred divs or a giant `filter: blur()`, which forces expensive offscreen blur passes.
- **Avoid `backdrop-filter` for elevation.** Translucent "glass" surfaces over a dark page are GPU-costly and can drop text contrast; the lightness-step approach is plain opaque fills and repaints cheaply.
- **Keep shadows few and large.** Many small/sharp `box-shadow`s on scrolling lists cause repaint cost; one large soft shadow per elevated surface is plenty and barely visible on dark anyway.
- **No flash of wrong theme (FOUC):** set `color-scheme`/initial `data-theme` before paint (inline `<head>` script or SSR), or the page flashes light then snaps to dark.
- **OLED note:** true-black regions cost zero backlight on OLED, but per-pixel "black smearing" on rapid scroll is a real artifact on some panels — another reason near-black (`#0d0d10`) over `#000` for large scrolling areas.

## Anti-slop
Cliché (see `_slop-blocklist.md`):
- **SURFACE — "glow/neon everywhere" + "soft drop shadow on everything."** The AI-dark tell is pure `#000` with glowing accents on every card and a soft shadow under each one. Fix: near-black `#0d0d10`, elevation by *lightness steps* with a hairline top edge, and exactly **one** focal glow.
- **COLOR — "purple/indigo-to-pink gradient" and "generic SaaS blue #3B82F6 everywhere."** The #1 AI giveaway is a violet→magenta gradient glowing behind a centered dark hero. Fix: commit to one desaturated brand hue and one sharp accent used *sparingly*; if you want a gradient, make it a subtle single-hue tonal one, not behind body text.
- **SURFACE — "aurora blob behind centered hero."** Fix: keep any glow subtle, single-hue, off to one edge (the demo puts it at `70% -10%`), and never directly under text where it kills contrast.
- **LAYOUT — pure black void.** `#000` everywhere with no elevation reads as cheap and flat, and maximizes halation. Fix: build the 3–4 step lightness ladder so surfaces actually layer.

The tasteful version breaks 2–3 bucket defaults deliberately: near-black not `#000` (SURFACE), desaturated accent not SaaS blue/neon (COLOR), depth by lightness not shadow (SURFACE), one glow not many (SURFACE).

## Pairs well with
- `05-dark-mode-token-strategy` — the semantic token + `light-dark()`/`color-scheme` machinery that makes this theme switchable (summarized above).
- `bento-as-aesthetic` — elevation-by-lightness reads beautifully across bento tiles on a dark base.
- `editorial-typographic` — off-white display type on near-black is the classic premium-dark combination.
- `minimalism` — restraint (one glow, few shadows, muted accent) is the same discipline.
- `aurora-gradient-mesh` — only if you keep it to the single subtle focal glow described here, not a full rainbow mesh behind copy.

## Current references
- [light-dark() CSS function — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) — the native two-value theming function; Baseline since May 2024.
- [color-scheme CSS property — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme) — themes form controls/scrollbars and enables `light-dark()`.
- [Come to the light-dark() Side — CSS-Tricks](https://css-tricks.com/come-to-the-light-dark-side/) — practical patterns for semantic tokens + an explicit override toggle.
- [The dark mode accessibility myth, debunked — Stéphanie Walter](https://stephaniewalter.design/blog/dark-mode-accessibility-myth-debunked/) — why dark mode is a choice, not a universal a11y win (astigmatism, dyslexia, focus).
- [Dark Mode Can Improve Text Readability — But Not for Everyone — BOIA](https://www.boia.org/blog/dark-mode-can-improve-text-readability-but-not-for-everyone) — WCAG framing; ship dark as a tested option.
- [Why You Should Never Use Pure Black for Text or Backgrounds — UX Movement](https://uxmovement.com/content/why-you-should-never-use-pure-black-for-text-or-backgrounds/) — halation evidence behind near-black + off-white instead of `#000`/`#fff`.
- [Codrops](https://tympanus.net/codrops/) — forkable dark hero/glow and surface demos with GSAP/WebGPU sources.
