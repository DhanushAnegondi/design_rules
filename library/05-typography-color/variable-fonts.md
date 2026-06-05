# Variable fonts

> One font file that holds a continuous range of weights, widths, slants, and optical sizes along named axes you control with CSS — instead of shipping a separate file per style.

**Bucket:** system
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, apps, dashboards, editorial/long-form

## What it is
A variable font is a single OpenType file that encodes a design space rather than one fixed instance. Each dimension of that space is an **axis** with a numeric range — weight (`wght`) from 100 to 900, width (`wdth`), slant (`slnt`), optical size (`opsz`), grade (`GRAD`), and any custom axis the foundry exposed. You ask for an exact point in that space (`font-weight: 437`, or the low-level `font-variation-settings: "wght" 437`), and the renderer interpolates the glyph outlines on the fly. The user perceives type that can be tuned to any in-between weight, get visually heavier without reflowing, or shift its stroke contrast as it scales — all from one download.

## When to use
- You ship more than ~2 weights/styles of a family. One variable file (often 60–120 KB woff2) usually beats four static woff2 files, and you stop paying a request per weight.
- You want **deliberate weight contrast** in a modular scale — e.g. a 720 display weight against a 380 body — without bloating the font budget.
- Optical sizing matters: large display set delicately, small UI text set sturdier, automatically via `font-optical-sizing: auto`.
- Subtle responsive typography: nudge weight/width by viewport or container so headlines stay tight on narrow screens.
- Hover/focus micro-interactions on display type (a nav link that thickens from 400 to 650), or a `GRAD` (grade) shift that darkens text without changing its width — useful for dark mode where bold can look too heavy.

## When NOT to use
- A site that genuinely needs only one weight. A variable file carries the whole design space; a single static instance is smaller. Subset/instance it down instead.
- **Animating axes on body text.** `font-variation-settings` changes glyph outlines, so weight/width transitions on running paragraphs trigger relayout and visible reflow. Restrict motion to short display lines.
- "Everyone overuses this for X": the *hover-wobble headline* where letters pulse weight on a loop, and the *scroll-driven weight smear* on every heading. It is the variable-font equivalent of fade-and-slide-up on everything — see Anti-slop.
- When you can't guarantee `font-display` behaviour and the family is your only typeface for above-the-fold content — a slow variable file with `font-display: block` blocks first paint longer than a small static subset would.
- Synthesizing extreme styles the foundry never drew (faking heavy italic from a slant axis on a font with no true italic) — outlines distort.

## How it works
The font file stores one default outline plus *deltas* — instructions for moving control points as each axis moves. The browser interpolates between masters to render the requested coordinate. CSS reaches the axes two ways:

- **High-level registered properties** (preferred, because they inherit the cascade's semantics and stay accessible): `font-weight`, `font-stretch` (width), `font-style: oblique Ndeg` (slant), and `font-optical-sizing`. These map to the registered lowercase axes `wght`, `wdth`, `slnt`, `opsz`.
- **Low-level `font-variation-settings`** for everything else, especially custom uppercase axes like `GRAD`, `XOPQ`, `YTLC`. Values are **`<number>`** (unitless), e.g. `font-variation-settings: "wght" 437, "GRAD" 88;`. Setting a registered axis here bypasses the high-level property, so list *every* axis you want set in the same declaration — a later `font-variation-settings` fully replaces an earlier one.

Registered axis tags are lowercase (`wght`, `wdth`, `slnt`, `ital`, `opsz`); custom axes are uppercase (`GRAD`, `MONO`, `CASL`). `ital` is a 0/1 toggle; `slnt` is a continuous angle (typically 0 to -10). `opsz` is meant to track `font-size` automatically when `font-optical-sizing: auto` is set, but you can override it manually.

Always declare the axis range in `@font-face` with `font-weight: 100 900` (and `font-stretch: 75% 125%`) so the browser knows the supported span and `font-display` can manage swap correctly.

## Working code

### Vanilla — one file, a real scale, optical sizing, accessible weight contrast
A complete document. It loads one variable file, defines a modular scale, and uses a genuine weight jump (body 400, lead 340, display 680) plus automatic optical sizing.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  /* Declare the variable axes' ranges so the UA knows the design space. */
  @font-face {
    font-family: "Roboto Flex";
    src: url("/fonts/RobotoFlex.woff2") format("woff2-variations");
    font-weight: 100 1000;          /* wght range */
    font-stretch: 25% 151%;         /* wdth range */
    font-style: oblique 0deg 10deg; /* slnt range, expressed as oblique angle */
    font-display: swap;             /* show fallback immediately, swap when ready */
  }

  :root {
    /* Modular scale, ratio 1.25 (major third) off a 1rem base. */
    --step--1: 0.8rem;
    --step-0:  1rem;
    --step-1:  1.25rem;
    --step-2:  1.5625rem;
    --step-4:  2.441rem;
    --step-6:  3.815rem;

    /* Deliberate weight contrast — not "everything 400". */
    --wght-body: 400;
    --wght-lead: 340;   /* lighter, larger lead paragraph */
    --wght-disp: 680;   /* heavy display, but not maxed to 900 */

    color-scheme: light;
  }

  body {
    margin: 0; padding: 4rem clamp(1rem, 6vw, 6rem);
    background: #faf7f2; color: #1b1714;
    font-family: "Roboto Flex", system-ui, sans-serif;
    font-weight: var(--wght-body);
    font-size: var(--step-0);
    line-height: 1.55;
    font-optical-sizing: auto;   /* opsz tracks font-size automatically */
    max-width: 64ch;
  }

  h1 {
    font-size: var(--step-6);
    font-weight: var(--wght-disp);
    font-stretch: 92%;           /* slightly condensed display via wdth axis */
    line-height: 1.02;
    letter-spacing: -0.02em;
    margin: 0 0 0.4em;
  }

  .lead {
    font-size: var(--step-2);
    font-weight: var(--wght-lead);
    line-height: 1.3;
    color: #4a4039;
    margin: 0 0 2rem;
  }

  /* GRADE axis darkens text WITHOUT changing its width — handy in dark mode,
     where a true bold can look too heavy and shift line wraps. */
  @media (prefers-color-scheme: dark) {
    :root { color-scheme: dark; }
    body { background: #14110f; color: #ece6df; }
    .lead { color: #b8ada3; }
    body { font-variation-settings: "GRAD" 30; } /* +grade, same metrics */
  }
</style></head>
<body>
  <h1>Set the weight, not just the size.</h1>
  <p class="lead">One file carries 100 through 1000. The lead sits at 340, the
    display at 680 — contrast you choose, not the two weights a static family
    happened to ship.</p>
  <p>Body text holds steady at 400. Optical sizing quietly thickens strokes at
    small sizes and refines them as the type grows, so this paragraph and the
    headline both read at their best from a single download.</p>
</body></html>
```

### Vanilla — fluid weight + width with no JS (unit-stripping hack)
`font-variation-settings` axis values are `<number>`, so you cannot feed a viewport `<length>` straight into them. A `clamp()` that mixes a unitless number with a length is invalid and the whole declaration is dropped. To make axes respond to viewport width without JavaScript, convert `100vw` into a *unitless* number first with the `tan(atan2(...))` trick, then clamp pure numbers.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @font-face {
    font-family: "Roboto Flex";
    src: url("/fonts/RobotoFlex.woff2") format("woff2-variations");
    font-weight: 100 1000;
    font-stretch: 25% 151%;
    font-display: swap;
  }

  .fluid {
    /* tan(atan2(100vw, 1px)) returns the viewport width as a UNITLESS number:
       atan2(length, length) -> angle, tan(angle) -> number. So --vw-num is
       roughly the px count of 100vw, with no unit attached. */
    --vw-num: tan(atan2(100vw, 1px));

    /* Now every operand is a plain number, so clamp() is valid for an axis.
       Weight ramps 380 -> 720 across the viewport; width 85% -> 100%. */
    --wght: clamp(380, calc(360 + 0.08 * var(--vw-num)), 720);
    --wdth: clamp(85,  calc(80  + 0.04 * var(--vw-num)), 100);

    font-family: "Roboto Flex", system-ui, sans-serif;
    font-variation-settings: "wght" var(--wght), "wdth" var(--wdth);
    font-size: clamp(2rem, 8vw, 5rem);
    line-height: 1.05;
    letter-spacing: -0.02em;
    margin: 0;
  }
</style></head>
<body style="margin:0;padding:3rem;background:#101113;color:#f2efe9">
  <h1 class="fluid">Wider and heavier as the screen grows.</h1>
</body></html>
```

Browser support note: `tan`/`atan2` trig functions are in all current evergreen browsers (Chrome/Edge 111+, Safari 15.4+, Firefox 108+). If you must support older engines, use the `@property` + JS approach below instead.

### Animating an axis on hover — `@property` for smooth, type-safe transitions
A bare custom property is an untyped string, so the browser can't interpolate it and the transition snaps. Registering it with `@property` and `syntax: "<number>"` makes it animatable. This is the modern, no-extra-JS way to animate axes (a registered `<number>` property tweens smoothly, unlike a plain `--var`).

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @font-face {
    font-family: "Roboto Flex";
    src: url("/fonts/RobotoFlex.woff2") format("woff2-variations");
    font-weight: 100 1000;
    font-display: swap;
  }

  /* Register the axis-driving variables so they interpolate as numbers. */
  @property --wght { syntax: "<number>"; inherits: false; initial-value: 420; }
  @property --slnt { syntax: "<number>"; inherits: false; initial-value: 0; }

  .nav-link {
    --wght: 420;
    --slnt: 0;
    font-family: "Roboto Flex", system-ui, sans-serif;
    font-size: 2rem;
    font-variation-settings: "wght" var(--wght), "slnt" var(--slnt);
    /* Animate the registered numbers, not font-variation-settings directly. */
    transition: --wght 220ms cubic-bezier(0.22, 1, 0.36, 1),
                --slnt 220ms cubic-bezier(0.22, 1, 0.36, 1);
    text-decoration: none; color: #f2efe9; cursor: pointer;
  }
  .nav-link:hover,
  .nav-link:focus-visible {
    --wght: 660;   /* thicken */
    --slnt: -6;    /* lean */
  }
  .nav-link:focus-visible { outline: 2px solid #e0b341; outline-offset: 4px; }

  @media (prefers-reduced-motion: reduce) {
    .nav-link { transition: none; }   /* still jumps to hover state, no tween */
  }
</style></head>
<body style="margin:0;padding:4rem;background:#101113">
  <a class="nav-link" href="#">Work</a>
</body></html>
```

### React — variable-axis component driven by props
A realistic production version: a typed component that maps props to axes, respects reduced motion, and keeps the registered-property animation.

```jsx
import { useRef } from "react";

// Inject the @property + @font-face once. In a real app put this in global CSS.
const globalCss = `
  @font-face {
    font-family: "Roboto Flex";
    src: url("/fonts/RobotoFlex.woff2") format("woff2-variations");
    font-weight: 100 1000; font-display: swap;
  }
  @property --wght { syntax: "<number>"; inherits: false; initial-value: 420; }
`;

export function VariableText({
  children,
  weight = 420,
  hoverWeight = 660,
  size = "2rem",
}) {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ref = useRef(null);
  const set = (w) => {
    if (ref.current) ref.current.style.setProperty("--wght", String(w));
  };

  return (
    <>
      <style>{globalCss}</style>
      <span
        ref={ref}
        onMouseEnter={() => set(hoverWeight)}
        onMouseLeave={() => set(weight)}
        onFocus={() => set(hoverWeight)}
        onBlur={() => set(weight)}
        tabIndex={0}
        style={{
          "--wght": weight,
          fontFamily: '"Roboto Flex", system-ui, sans-serif',
          fontSize: size,
          fontVariationSettings: '"wght" var(--wght)',
          transition: reduce ? "none" : "--wght 220ms cubic-bezier(0.22,1,0.36,1)",
          display: "inline-block",
          color: "#f2efe9",
          cursor: "pointer",
        }}
      >
        {children}
      </span>
    </>
  );
}

// Usage:
// <VariableText weight={400} hoverWeight={700} size="3rem">Hover me</VariableText>
```

## Variations
- **Axis driven** — the knob is *which axis* you move: `wght` (heaviness), `wdth`/`font-stretch` (condense/expand), `slnt` (lean, reversible), `ital` (true italic toggle), `opsz` (stroke contrast vs size), `GRAD` (darken without reflow).
- **Static vs fluid vs interactive** — fixed instance per breakpoint; `clamp()`-fluid axes tied to viewport/container; or event-driven (hover/focus/scroll/pointer).
- **Auto vs manual optical sizing** — `font-optical-sizing: auto` lets `opsz` track size; manual `"opsz" N` overrides for art direction.
- **Grade for theming** — pair `GRAD` with `prefers-color-scheme` so dark mode gets optical weight back without shifting line breaks.
- **Container-query axes** — set `--wght` off `cqi` instead of `vw` so a component adapts to its own column, not the page.

## Accessibility
- **prefers-reduced-motion**: any axis *animation* must be gated. In the snippets, reduced motion drops the `transition` so the state still changes (hover still thickens) but does not tween. Never loop weight/slant animations under reduced motion.
- **Contrast / weight is contrast**: very light weights at small sizes thin the strokes and can drop effective contrast below the WCAG 2.2 minimums. Keep body weight at roughly 380–450; reserve sub-340 for large display only. A `#4a4039` lead on `#faf7f2` here gives a contrast ratio of about 8.9:1 (well past the 4.5:1 AA threshold for normal text), so the lighter 340 weight stays legible — but verify any light-weight/low-contrast pairing, since thinning strokes reduce perceived contrast even when the math passes. Use `GRAD` rather than dimming color when you need text to feel heavier in dark mode.
- **Focus / keyboard**: interactive variable type (a hover-thickening link) must show a visible `:focus-visible` outline and respond to focus the same way as hover — the React and CSS examples bind both `:hover` and `:focus-visible`, and keyboard `onFocus`/`onBlur`.
- **Touch/pointer fallback**: hover-only weight changes never fire on touch. Treat them as pure enhancement; the resting weight must be the legible, complete state. Don't hide information behind a hover-only axis shift.
- **Screen readers**: axis changes are purely visual — they don't alter the accessible name or reading order, so no `aria` work is needed. Don't use a slant/grade shift as the *only* signal of state (e.g. selected); pair it with `aria-current` or text.

## Performance
- **One file, smart loading**: serve **woff2** (variable woff2 is well-compressed) and set `font-display: swap` so fallback text paints immediately. For a critical hero face, `<link rel="preload" as="font" type="font/woff2" crossorigin>` cuts the swap.
- **Subset and instance**: strip unused glyphs (subset to Latin) and, if you only ship a slice of the weight range, **partial-instance** the file (e.g. pin `opsz`, keep `wght`) to shed kilobytes. Tools: `fonttools varLib.instancer`, glyphhanger.
- **Animating axes reflows text**: `font-variation-settings` changes outlines, so weight/width tweens trigger layout + paint, not just compositing — they are *not* GPU-cheap like `transform`. Keep them on short, isolated display elements; never scrub a paragraph's weight on scroll.
- **`will-change: font-variation-settings`** can help a known hover target but costs memory; apply on hover-intent, not globally.
- **Bundle cost**: zero JS for the CSS-only approaches; the `@property` registration is free. The trig fluid hack adds no runtime cost.

## Anti-slop
Cliché (see `_slop-blocklist.md` → TYPE: "Inter/Roboto/Arial for everything" and "everything one weight/size"): loading a variable font and then setting the entire page at one weight — the most common waste of the format — or the opposite, a headline whose letters pulse weight on an infinite loop because it's possible. Tasteful version: pick a characterful variable family (Fraunces with its `SOFT`/`WONK` axes, Recursive's `CASL`/`MONO`, General Sans, Instrument Serif) and spend the design space on a *real modular scale with deliberate weight contrast* — a heavy 680 display against a light 340 lead against a steady 400 body — plus automatic optical sizing. Reserve axis *animation* for one focal interaction (a nav link that leans and thickens on hover), with custom easing, never an ambient loop. Breaking the "one default weight" habit is most of what makes type look designed rather than generated.

## Pairs well with
- `modular-type-scale` (the variable weight range is what lets a scale have real contrast at each step — base × ratio for size, paired with chosen weights per step)
- `fluid-type-clamp` (same `clamp()` thinking, applied to size; combine with the axis-fluid hack above so size *and* weight scale together)
- `semantic-color-tokens` (expose `--wght-*` as tokens alongside color tokens; `GRAD` is your dark-mode "make it heavier" knob next to color tokens)
- `system-font-stack` (your `@font-face` fallback list — `system-ui, sans-serif` — must match metrics closely so `font-display: swap` doesn't jolt the layout)
- `text-reveal-on-scroll` (reveal display lines with transform/opacity, not weight, to avoid reflow)

## Current references
- [Variable fonts guide — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide) — canonical reference for axes, `font-variation-settings`, and the registered vs custom axis distinction
- [font-optical-sizing — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/font-optical-sizing) — how `opsz` auto-tracks `font-size` and when to override
- [Optical size axis (opsz) — Google Fonts Knowledge](https://fonts.google.com/knowledge/glossary/optical_size_axis) — what optical sizing actually changes in the letterforms
- [opsz design-variation axis — Microsoft OpenType spec](https://learn.microsoft.com/en-us/typography/opentype/spec/dvaraxistag_opsz) — authoritative axis definition and value semantics
- [When you need @property instead of a CSS variable — Smashing Magazine (2024)](https://www.smashingmagazine.com/2024/05/times-need-custom-property-instead-css-variable/) — why registering a `<number>` property makes axis values animatable/transitionable
- [Roboto Flex specimen — Google Fonts](https://fonts.google.com/specimen/Roboto+Flex) — 12-axis variable font (wght/wdth/opsz/slnt/GRAD + 7 parametric) used in the examples
- [Recursive variable font specimen — ArrowType](https://www.recursive.design/) — `wght`/`slnt`/`CASL`/`MONO`/`CRSV` axes; a good characterful, non-default choice
- [Using variable fonts on the web — ABC Dinamo](https://abcdinamo.com/news/using-variable-fonts-on-the-web) — foundry-side guide to performance, subsetting, and practical axis use
