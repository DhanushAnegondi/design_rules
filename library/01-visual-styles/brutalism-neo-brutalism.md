# Brutalism and neo-brutalism

> Raw, structural UI that shows its bones: thick hard borders, solid offset shadows with zero blur, flat clashing color, and system or mono type — brutalism is the unstyled-HTML extreme; neo-brutalism is its loud, deliberately-art-directed evolution.

**Bucket:** visual style
**Maturity:** current (neo-brutalism is peaking 2023-2026; raw brutalism is cycling-back as a counter-trend)
**Effort:** low
**Best for:** websites, portfolios, marketing/landing pages, indie-product apps, dashboards (with care), carousels

## What it is
Brutalism in web design borrows the name from the concrete architecture movement: it refuses decoration and exposes structure. Pure brutalism looks like styled-down raw HTML — default blue links, visible borders, no rounding, monospace, hard edges, jarring color. **Neo-brutalism** keeps that rawness as a *style choice* rather than an absence of style: 2-3px solid borders (usually near-black), a solid drop shadow offset a few pixels with **no blur** (`box-shadow: 6px 6px 0 #000`), flat blocks of saturated primary color, big system or mono type, and almost no `border-radius`. The user perceives confident, tactile, slightly retro "stamp" blocks that look like physical pressed paper or 90s desktop chrome — the opposite of soft, glassy, gradient SaaS.

The era-defining reference is the **Gumroad redesign** (Sahil Lavingia / the Gumroad team, ~2022), which made the look mainstream: flat yellow/pink/black, fat borders, hard offset shadows, buttons that "press down" on click.

## When to use
- Indie products, dev tools, and creator platforms that want to feel anti-corporate and memorable (Gumroad, Figma community plugins, hackathon projects).
- Portfolios and agency sites that want to read as confident and design-aware without a heavy motion budget.
- Marketing pages where standing out from generic SaaS-blue templates is the whole point.
- Anything you want to ship fast: the look is cheap — borders, flat fills, and one shadow value. No images, gradients, or blur required.
- Component systems where strong, obvious affordances (this is a button, this is pressable) are a feature.

## When NOT to use
- **Contrast-poor color pairings.** Everyone overuses neo-brutalism with low-contrast pastel-on-pastel cards and white text on saturated accent fills that fail WCAG. If text doesn't clear 4.5:1 (3:1 for large), the look is broken regardless of how trendy it is.
- Dense, information-heavy enterprise dashboards where heavy borders and shadows add visual noise and slow scanning — the structure becomes clutter.
- Long-form reading or content where the goal is calm legibility; loud flat color and mono body type fatigue the eye fast.
- Trust-sensitive contexts (banking, healthcare, checkout) where "raw/unpolished" reads as "unfinished" to non-design users.
- Accessibility-critical products if you can't commit to the contrast/focus discipline below. The aesthetic *invites* clashing color, which is exactly where a11y dies.

## How it works
There is no special API — neo-brutalism is a disciplined combination of four flat CSS primitives, applied systematically:

1. **Hard border.** `border: 2px solid #111` (or 3px). Near-black, not pure `#000` unless you want maximum harshness. This is the single most identifying trait.
2. **Solid offset shadow.** `box-shadow: 6px 6px 0 0 #111;` — the trick is blur-radius and spread both `0`. The shadow is a flat duplicate of the element pushed down-right, reading as a printed offset or a physical stack.
3. **Flat saturated color.** No gradients. 2-3 committed hues plus near-black ink and an off-white page. Color encodes hierarchy (primary action vs. card vs. page), not mood.
4. **Sharp or near-sharp corners.** `border-radius: 0` for hard brutalism; `4-8px` is the common neo-brutalist softening so it doesn't feel hostile.

The signature **press interaction**: on `:active` (or `:hover`), translate the element by the shadow offset and shrink the shadow to zero, so it appears to physically push into the page. Animate `transform` and `box-shadow` only (both compositor-friendly).

## Working code

### Vanilla HTML/CSS — complete, runnable
A self-contained document. Tokens are defined once; contrast is safe by construction (dark ink `#111` on light fills only — see Accessibility for the measured ratios).

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Neo-brutalism</title>
<style>
  :root {
    --ink:    #111111;          /* near-black: borders + text */
    --paper:  #fafaf5;          /* warm off-white page        */
    --accent: #ffdc58;          /* flat yellow (primary)      */
    --accent2:#ff90e8;          /* flat pink (Gumroad-ish)    */
    --card:   #ffffff;
    --bw:     2px;              /* border width               */
    --shadow: 6px 6px 0 0 var(--ink);
    --radius: 6px;              /* 0 = hard brutalism         */
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--paper); color: var(--ink);
    font-family: ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace;
    line-height: 1.45; padding: clamp(1rem, 4vw, 3rem);
  }
  .wrap { max-width: 56rem; margin-inline: auto; }
  h1 {
    font-family: ui-sans-serif, system-ui, "Segoe UI", sans-serif;
    font-weight: 800; font-size: clamp(2.2rem, 7vw, 4rem);
    line-height: 1.02; letter-spacing: -0.02em; margin: 0 0 .25em;
  }
  .tag {
    display: inline-block; background: var(--accent2); color: var(--ink);
    border: var(--bw) solid var(--ink); padding: .25em .6em;
    box-shadow: var(--shadow); font-weight: 700; margin-bottom: 1.5rem;
  }
  /* base block: the brutalist primitive */
  .block {
    background: var(--card); border: var(--bw) solid var(--ink);
    box-shadow: var(--shadow); border-radius: var(--radius);
    padding: 1.25rem 1.4rem;
  }
  /* deliberately uneven grid — NOT three identical cards */
  .grid { display: grid; gap: 1.5rem; grid-template-columns: 1.4fr 1fr;
          align-items: start; margin-top: 2rem; }
  @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
  .block h2 { margin: 0 0 .4rem; font-size: 1.25rem; }
  .block.alt { background: var(--accent); }

  /* the signature press button */
  .btn {
    font: inherit; font-weight: 700; cursor: pointer;
    background: var(--accent); color: var(--ink);
    border: var(--bw) solid var(--ink); border-radius: var(--radius);
    padding: .7em 1.2em; box-shadow: var(--shadow);
    transition: transform .08s ease, box-shadow .08s ease;
    margin-top: 1rem;
  }
  .btn:hover  { transform: translate(2px, 2px); box-shadow: 4px 4px 0 0 var(--ink); }
  .btn:active { transform: translate(6px, 6px); box-shadow: 0 0 0 0 var(--ink); }
  /* visible, on-brand focus ring (never remove it) */
  .btn:focus-visible, a:focus-visible {
    outline: 3px solid var(--ink); outline-offset: 3px;
  }
  a { color: var(--ink); text-decoration: underline 2px; text-underline-offset: 3px; }

  @media (prefers-reduced-motion: reduce) {
    .btn { transition: none; }
  }
</style>
</head>
<body>
  <main class="wrap">
    <span class="tag">v2.0 // shipping now</span>
    <h1>Sell what you make.<br>Keep what you earn.</h1>
    <p>No theme, no fluff, just a checkout that loads in 40&nbsp;ms.</p>
    <button class="btn">Start selling →</button>

    <div class="grid">
      <section class="block">
        <h2>Flat fees</h2>
        <p>10% per sale. No monthly tax on your existence. The number is the number.</p>
      </section>
      <section class="block alt">
        <h2>Instant payouts</h2>
        <p>Money hits your account the day a customer hits buy.</p>
      </section>
    </div>
  </main>
</body>
</html>
```

### React + Tailwind — the realistic production path
Neo-brutalism is the most-shipped Tailwind aesthetic of this era; the pattern is to bake the four primitives into a token layer and reuse them. Tailwind v3.4+/v4 with an arbitrary-value shadow:

```tsx
// tailwind.config.ts (v3) — register the tokens once
import type { Config } from "tailwindcss";
export default {
  theme: {
    extend: {
      colors: { ink: "#111111", paper: "#fafaf5", accent: "#ffdc58", accent2: "#ff90e8" },
      boxShadow: { brutal: "6px 6px 0 0 #111111", brutalSm: "4px 4px 0 0 #111111" },
      borderRadius: { brutal: "6px" },
    },
  },
} satisfies Config;
```

```tsx
// Button.tsx — the press interaction, reduced-motion aware
export function Button({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="
        font-bold bg-accent text-ink border-2 border-ink rounded-brutal
        px-5 py-2.5 shadow-brutal
        transition-transform duration-100 ease-out
        hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutalSm
        active:translate-x-[6px] active:translate-y-[6px] active:shadow-none
        focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-ink focus-visible:outline-offset-[3px]
        motion-reduce:transition-none
      "
    >
      {children}
    </button>
  );
}

export function Card({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={`bg-white text-ink border-2 border-ink rounded-brutal shadow-brutal p-5 ${className}`}
    />
  );
}
```

For a full component kit rather than rolling your own, **neobrutalism.dev** (shadcn/ui-based, MIT) ships buttons, cards, inputs, dialogs, and tables with these tokens pre-wired.

## Variations
- **Raw brutalism vs. neo-brutalism** (the core knob: *polish*). Raw = `border-radius: 0`, default link blue, mono everything, no shadow, anti-grid. Neo = soft 4-8px corners, curated palette, hard offset shadow, sans display type.
- **Shadow weight** (`2-4px` subtle vs `8-12px` loud, single vs. stacked double-shadow in two colors).
- **Border color** (near-black `#111` standard; an accent-colored border reads softer/playful; white border on dark = "dark brutalism").
- **Corner radius** (`0` aggressive → `8px` friendly). One value, applied everywhere, is what makes it cohesive.
- **Type axis** (all-mono "terminal" feel vs. fat geometric sans display + neutral body — the NN/G-recommended balance).
- **Color temperature** (high-saturation primary/yellow/pink/cyan "Gumroad" vs. a single committed hue + black + paper for a quieter, more editorial brutalism).

## Accessibility
- **Contrast is the make-or-break.** Keep dark ink on light fills. Measured against `#111111` ink: on `#fafaf5` paper ≈ **18.9:1**, on `#ffffff` card ≈ **19.5:1**, on `#ffdc58` yellow ≈ **14.3:1**, on `#ff90e8` pink ≈ **9.9:1** — all clear WCAG AAA for normal text (7:1). The classic failure is **white text on a saturated accent button** (e.g. white on that yellow is ~1.4:1 — unreadable). If you want a colored button with white text, darken the fill until it clears 4.5:1 first.
- **prefers-reduced-motion:** the press/translate interaction must be guarded. Both code samples disable the transition under `prefers-reduced-motion: reduce` (the button still works; it just doesn't slide). Don't animate anything essential.
- **Focus must stay visible and obvious.** Brutalism's thick-border language is a *gift* here: a `3px solid` outline with `outline-offset: 3px` is on-brand and unmissable. Never `outline: none` without an equally strong replacement; never rely on a subtle box-shadow change alone for focus.
- **Don't encode meaning in color alone.** Clashing flat hues tempt color-only status (pink = error, green = ok). Pair with text/icon/border so colorblind users aren't excluded.
- **Touch/pointer:** the press effect is `:active`/`:hover`; on touch there's no hover, and `:active` fires on tap — fine. Keep hit targets ≥ 44×44px (heavy borders can make a button *look* bigger than its tappable area, so pad generously).
- **Screen readers:** purely visual — no special ARIA needed. Just ensure semantic elements (`<button>`, `<a href>`, headings) underneath the styling, not styled `<div>`s.
- **Mono body type fatigues low-vision readers** — follow NN/G's advice: mono/display for headlines, a clean neutral sans for running body copy.

## Performance
- **Cheapest aesthetic to render.** No `backdrop-filter`, no blur, no gradients, no images required — solid fills and a zero-blur shadow are trivial to paint. This is a real advantage over glassmorphism/aurora styles.
- A blur-free `box-shadow` is much cheaper to rasterize than a soft (blurred) one; large blur radii are what make shadows expensive, and there is none here.
- **Animate only `transform` and `box-shadow`** on press. `transform` runs on the compositor; the box-shadow swap is cheap because both are 0-blur. Avoid animating `border-width`, `width`, or `top/left` (layout/paint thrash).
- No `will-change` needed for a `.08s` tap — adding it permanently promotes layers and wastes GPU memory. Skip it.
- Zero bundle cost in vanilla. The Tailwind/shadcn kits add only the components you import; no runtime motion library is required for the core look.

## Anti-slop
- **COLOR.** The slop version grabs the same Gumroad yellow `#ffdc58` + pink `#ff90e8` + black palette *everyone* uses, so the page is indistinguishable from every other neo-brutalist template (and often slaps white text on those fills, failing contrast). Fix: commit to **one** less-defaulted brand hue + black + paper, or pick a genuinely unusual pairing, and prove every text/background pair clears 4.5:1 (the math above is how you prove it). Avoid rainbow categorical color — let 2-3 hues *encode* hierarchy (primary action / card / page), not decorate.
- **LAYOUT.** The slop version is hero + three identical bordered icon-title-blurb cards in a row — same shadow, same size, same everything. Fix (and shown in the code): an asymmetric grid (`1.4fr 1fr`), varied block treatments (one paper, one accent-filled), and full-bleed or offset moments so structure reads as *composed*, not stamped from a generator.
- **SURFACE.** The slop version puts the identical `6px 6px 0` shadow on literally every element, flattening hierarchy. Fix: a small elevation scale — `4px` for resting cards, `6px` for primary actions, `0` on press — so the shadow *means* "more raised," matching the entry in `_slop-blocklist.md` (SURFACE: soft drop shadow on everything → systematic elevation).
- **TYPE.** The slop version sets mono on *everything* including body, which fatigues reading. Fix: mono/fat-sans for display, neutral sans for body, with a real weight/size jump (800 display vs 400 body) instead of one flat weight.
- **COPY.** The slop version fills these loud blocks with "Supercharge / Unlock / Seamless" + lorem. The aesthetic demands blunt, concrete, slightly irreverent copy ("Keep what you earn", "The number is the number") — generic SaaS verbs read as a fake.
- **META-RULE:** slop = taking the default of every bucket at once (Gumroad palette + mono-everything + three identical cards + uniform shadow). Break 2-3 of those on purpose and it reads designed, not generated.

## Pairs well with
- **Bento-as-aesthetic** (skeleton): bordered, hard-shadowed blocks are a natural bento grid — just vary cell size and fill so it isn't three identical cards.
- **Editorial / typographic** (skin): big fat display type carries brutalism; the styles share a confident-type DNA.
- **Maximalism** (skin): clashing flat color and visible structure scale up into controlled maximalist density.
- **Staggered entrance / micro-interactions** (behavior): the press-down button is the canonical brutalist micro-interaction; keep entrances snappy and reduced-motion-guarded rather than soft fades.
- **Dark mode** (system): "dark brutalism" = paper → near-black page, ink borders → off-white, shadows → a saturated accent; same primitives, inverted.

## Current references
- [Neobrutalism: Definition and Best Practices — Nielsen Norman Group](https://www.nngroup.com/articles/neobrutalism/) — the authoritative usability take: limit to 2-3 bold colors, meet text-contrast standards, pair bold headlines with neutral body type.
- [Neobrutalism components (neobrutalism.dev)](https://www.neobrutalism.dev/) — MIT, shadcn/ui-based React/Tailwind kit with the tokens pre-wired; the de-facto production library for the look.
- [ekmas/neobrutalism-components — GitHub](https://github.com/ekmas/neobrutalism-components) — source for the above; read the Tailwind config to see real border/shadow token values.
- [MDN — box-shadow](https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow) — confirms the offset/blur/spread syntax behind the zero-blur hard shadow (`6px 6px 0 0 #111`).
- [MDN — :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) — the correct selector for the bold on-brand focus ring used above.
- [RetroUI — neobrutalism React components](https://retroui.dev/) — alternative React/Tailwind component kit; useful to compare token choices and press interactions against neobrutalism.dev.
- [Neubrutalism — definitive guide](https://neubrutalism.com/) — open-source vanilla HTML/CSS/JS reference covering the visual DNA, type system, history (crediting Michal Malewicz's March 2022 essay), and WCAG 2.2 usage notes.
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — verify every flat color/ink pairing here against the 4.5:1 (normal) / 3:1 (large) thresholds before shipping.
