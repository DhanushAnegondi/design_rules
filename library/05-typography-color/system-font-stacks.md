# System font stacks

> A `font-family` list that asks the OS for the font it already uses for its own UI, so text renders instantly with zero network requests and a native feel.

**Bucket:** system
**Maturity:** evergreen
**Effort:** low
**Best for:** apps, dashboards, websites, portfolios (anywhere text-to-paint speed beats a bespoke typeface)

## What it is
A system font stack is a `font-family` declaration whose first entries name the fonts that each operating system ships and uses for its own chrome — San Francisco on Apple platforms, Segoe UI / Segoe UI Variable on Windows, Roboto on Android, the user's chosen desktop-environment font on Linux. The browser picks the first one already installed, so nothing downloads. The reader perceives type that looks "native" — the same letterforms as the surrounding OS — and it paints on the very first frame because there is no font file to fetch, parse, or swap in. The modern, terse form leans on the `system-ui` generic keyword and the `ui-*` family of generics (`ui-sans-serif`, `ui-serif`, `ui-monospace`, `ui-rounded`) instead of hard-coding every vendor name.

## When to use
- **Product UI, dashboards, and web apps** where chrome should feel native and text must paint instantly — settings panels, tables, toolbars, dense data.
- **Body and UI copy on content sites** when brand identity lives in layout/color, not the typeface, and you want a zero-latency first paint.
- **Performance-critical / low-bandwidth contexts** — landing pages graded on LCP, PWAs, embedded webviews, anything on flaky mobile networks.
- **As the fallback tier of a webfont stack** so real text shows immediately while a custom font streams in (paired with `font-display: swap`).
- **Code and tabular numerals** via `ui-monospace` / a modern mono stack — terminals, code blocks, log views, financial figures.

## When NOT to use
- **When the typeface IS the brand.** A portfolio or editorial site whose personality comes from Fraunces, General Sans, Satoshi, or Instrument Serif cannot outsource its display type to whatever the OS happens to ship.
- **When you need cross-platform pixel consistency.** System stacks render *differently* on every OS by design — metrics, x-height, and weight availability all shift. If a designer signed off on one exact look, you need a webfont.
- **Large body text / long-form reading.** MDN explicitly warns that `system-ui` is meant for native-feeling UI chrome, not for typesetting big paragraphs, and can pick an undesirable face for some CJK users; prefer `sans-serif` or a real text font for long copy.
- **Heavy weight/width range.** System UI fonts expose a limited set of weights; if your scale needs 200/300/500/600/800 plus italics and a condensed cut, a variable webfont is more reliable.
- **The overuse trap:** every AI-generated SaaS page reaching for `font-family: Inter, system-ui` and calling it design. System fonts are a deliberate, characterful choice for *app UI* — not a reflex to dodge picking a real display face for a marketing hero (see Anti-slop).

## How it works
`font-family` is an ordered preference list. The browser walks it left to right and uses the first family that resolves to an installed face; the trailing generic (`sans-serif`, `serif`, `monospace`) is the guaranteed backstop. A system stack front-loads that list with names that exist only on specific platforms, so on any given machine exactly one matches and the rest are skipped. Because the matched font is already on disk, there is no `@font-face` download — text reaches first paint with no flash of invisible text (FOIT), no layout shift from a swap, and no request on the critical path.

Two layers of mechanism:

1. **Vendor names** — `-apple-system` and `BlinkMacSystemFont` are special tokens that alias San Francisco on Safari and Chromium-on-macOS respectively; `"Segoe UI"`, `Roboto`, `Oxygen`, `Ubuntu`, `Cantarell` cover Windows / Android / Linux desktops; `"Helvetica Neue"` and `Arial` are old-OS fallbacks.
2. **Generic keywords** — the `system-ui` keyword resolves to the platform's UI font directly, collapsing most of that list to one token. The CSS Fonts Level 4 `ui-*` generics extend this: `ui-sans-serif`, `ui-serif`, `ui-monospace`, and `ui-rounded` each map to the OS's default UI face of that category (e.g. `ui-rounded` -> SF Rounded on Apple). Support is good in Safari/Chromium and improving in Firefox, so keep concrete fallback names after them.

Key properties: `font-family` (the stack itself), the `system-ui` / `ui-*` generics, and — when you layer a webfont on top — `font-display` to control the swap behavior of the *custom* font while the system font holds the slot.

## Working code

### Native CSS — the modern stacks as tokens
A complete, paste-ready `:root` block. The sans stack leads with `system-ui` and keeps legacy vendor names for old browsers; the mono stack leads with `ui-monospace` and lists the real shipped monospaces in OS order.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>System font stacks</title>
<style>
  :root {
    /* Sans UI stack: native, zero-latency */
    --font-sans:
      system-ui,
      -apple-system,            /* San Francisco on Safari (iOS/macOS) */
      BlinkMacSystemFont,       /* San Francisco on Chromium/macOS     */
      "Segoe UI",               /* Windows 10 / older                  */
      "Segoe UI Variable",      /* Windows 11 Fluent                   */
      Roboto,                   /* Android, ChromeOS                   */
      "Helvetica Neue", Arial,  /* legacy fallbacks                    */
      sans-serif,
      "Apple Color Emoji", "Segoe UI Emoji"; /* keep color emoji */

    /* Modern monospace stack for code / tabular numerals */
    --font-mono:
      ui-monospace,
      "SF Mono", "SFMono-Regular",     /* Apple                       */
      "Cascadia Code", "Cascadia Mono",/* Windows Terminal default     */
      "JetBrains Mono",                /* if self-hosted/installed     */
      "Roboto Mono",                   /* Android                      */
      Menlo, Consolas, "Liberation Mono",
      monospace;

    /* Optional serif/rounded UI generics (progressive enhancement) */
    --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", serif;
    --font-rounded: ui-rounded, "SF Pro Rounded", system-ui, sans-serif;
  }

  html { font-family: var(--font-sans); line-height: 1.5; }
  body { margin: 0; color: #14141a; background: #fbfbfd; }
  .wrap { max-width: 60ch; margin: 4rem auto; padding: 0 1.5rem; }

  /* Real weight contrast — system fonts DO expose these */
  h1 { font-weight: 700; letter-spacing: -0.02em; font-size: clamp(2rem, 5vw, 3rem); }
  p  { font-weight: 400; }
  .lead { font-weight: 500; color: #3a3a44; }

  code, kbd, pre, .num {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums; /* aligned digits in tables */
  }
  pre { background: #14141a; color: #eef0f6; padding: 1rem 1.25rem;
        border-radius: 8px; overflow:auto; font-size: 0.9rem; }
</style></head>
<body>
  <main class="wrap">
    <h1>Native type, zero downloads</h1>
    <p class="lead">This page paints on the first frame — no font file is fetched.</p>
    <p>Body copy uses the OS UI font. Numbers like <span class="num">1,204,887.50</span>
       align because of <code>tabular-nums</code>.</p>
    <pre><code>const total = items.reduce((a, b) =&gt; a + b.price, 0);</code></pre>
  </main>
</body></html>
```

### Tailwind / production — system stack as the default, webfont as opt-in
Tailwind already ships these exact stacks under `font-sans` and `font-mono`. The realistic production pattern is: keep system fonts as the default everywhere, and only swap in a webfont for the one element that needs brand character — while system text holds the slot during the swap.

```css
/* globals.css — webfont layered ON TOP of a system fallback */
@font-face {
  font-family: "General Sans";
  src: url("/fonts/GeneralSans-Variable.woff2") format("woff2-variations");
  font-weight: 200 700;
  font-display: swap;           /* show system font instantly, swap when ready */
}

:root {
  --font-ui: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-display: "General Sans", var(--font-ui); /* falls back to system */
}

body            { font-family: var(--font-ui); }   /* all UI = zero latency */
h1, .display    { font-family: var(--font-display); font-weight: 600; }
```

```js
// tailwind.config.js — extend, don't replace, the built-in system stacks
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        // `font-sans` / `font-mono` already resolve to system stacks;
        // add a brand display utility on top
        display: ['"General Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
};
```

## Variations
- **Maximal vendor stack** vs **`system-ui` one-liner** — the knob is browser-support breadth. The long `-apple-system, BlinkMacSystemFont, "Segoe UI"…` list still resolves correctly on ancient browsers; `system-ui` alone is cleaner and enough for evergreen targets, with vendor names kept only as belt-and-suspenders fallback.
- **Sans vs mono vs rounded** — swap the leading generic: `ui-sans-serif` for UI text, `ui-monospace` for code/numerals, `ui-rounded` for a softer friendly feel (SF Rounded on Apple, graceful fallback elsewhere).
- **Pure system** vs **hybrid (system fallback + one webfont)** — the knob is how much brand identity you need. Hybrid keeps zero-latency UI text and spends bytes only on the display face.
- **Emoji-aware vs not** — append `"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"` so emoji and symbols render in color rather than falling to a tofu box.

## Accessibility
- **No motion involved**, so `prefers-reduced-motion` is not applicable to the stack itself — but if you layer a webfont with `font-display: swap`, the swap causes a visible text-restyle; keeping metrics-compatible fallbacks (`size-adjust`, `ascent-override` on `@font-face`) minimizes the jump for users sensitive to sudden reflow.
- **Contrast is unaffected by font choice** — but system fonts render at different weights/x-heights per OS, so verify your lightest weight on the lightest background still clears WCAG 2.2: body text needs >= 4.5:1, large text (>= 24px regular or >= 18.66px bold) needs >= 3:1. Example: `#3a3a44` text on `#fbfbfd` background — relative luminances L_text = 0.0455 and L_bg = 0.9668, giving (0.9668 + 0.05) / (0.0455 + 0.05) = **10.8:1** — comfortably AAA. Don't push UI labels to a thin 300 weight in a low-contrast gray and assume it passes on every platform.
- **Respect user font scaling.** Size in `rem`/`em`, never lock UI text in `px` that ignores the browser/OS base size; system stacks honor the reader's chosen default and zoom.
- **`lang` and CJK:** `system-ui` may not respect the `lang` attribute for font selection and can pick an undesirable CJK face. For mixed-script or CJK-heavy content, set explicit language-appropriate stacks rather than relying on `system-ui` alone.
- **Screen readers** read the DOM text regardless of font, so a system stack carries no SR penalty — and because there is no FOIT, low-vision users never stare at invisible text waiting for a download.
- **Pointer/touch:** purely a typeface concern, no interaction surface; touch targets are governed by your layout, not the font.

## Performance
This is the whole point. The HTTP Archive 2024 Web Almanac found web fonts on ~87% of sites, with a median font file weighing ~39 KB and a typical homepage loading ~4 font files (roughly 150 KB of font payload), often on the critical render path. A system stack drops that to **zero bytes and zero requests**: no DNS/TLS to a font host, no `@font-face` fetch, no decode, no FOIT, no swap-driven layout shift (CLS). Text is available at first paint, which directly helps LCP when your largest element is text.

What to still watch:
- **Per-OS metric differences** can shift line-wrapping and box heights; test layout on macOS, Windows 11, and Android, not just your dev machine.
- **`ui-*` generics aren't universal** — always keep a concrete fallback name and a final base generic so unsupported browsers don't drop to Times.
- **If you do add a webfont**, subset it, serve WOFF2, `preload` the critical face (the Almanac calls `preload` "the single most effective thing you can do to speed up your font loading," yet only ~11% of pages use it), and pair `font-display: swap` with a metrics-matched system fallback to avoid CLS.
- **No bundle cost** — the stack is a string in your CSS; it adds nothing to JS.

## Anti-slop
Cliché (see `_slop-blocklist.md` -> TYPE): `font-family: Inter, system-ui, sans-serif` on *everything*, every block one weight and one size — the default-of-every-bucket look that reads as machine-generated. System fonts aren't a license to skip typographic decisions. The tasteful move: (1) use a true system stack for genuine **app UI** where native feel and instant paint matter, and (2) where you *do* want personality, commit to a characterful display face (General Sans, Satoshi, Fraunces, Instrument Serif) for headlines while system fonts carry UI/body at zero latency. Either way, build a real modular scale and deliberate weight contrast — system fonts expose 400/500/600/700, so use them: a 700 headline against a 400 body and a 500 lead reads designed; everything at 400 reads generated. Avoid the inverse slop too — don't slap a webfont on dense dashboard chrome where `system-ui` would feel more native and load instantly.

## Pairs well with
- **Fluid type with `clamp()`** — system stacks + `clamp(1rem, 0.9rem + 0.5vw, 1.25rem)` give a responsive scale with no font payload at all.
- **Modular type scale** — pick a ratio (e.g. 1.25 major third) and let weight contrast (400/500/700) do the rest on the system face.
- **Webfont display pairing** — system stack as the body/UI tier, one streamed display face for headlines via `font-display: swap`.
- **Semantic color tokens / OKLCH ramps** — when identity lives in a committed brand hue + neutral ramp rather than the typeface, system fonts are the right, fast default for everything else.
- **`tabular-nums` / `ui-monospace`** for dashboards and tables — aligned digits and code without a mono webfont download.

## Current references
- [MDN — `font-family` (system-ui and ui-* generics)](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family) — authoritative spec for `system-ui`, `ui-sans-serif`, `ui-serif`, `ui-monospace`, `ui-rounded`, plus the warning against using `system-ui` for long body/CJK text.
- [HTTP Archive — 2024 Web Almanac, Fonts chapter](https://almanac.httparchive.org/en/2024/fonts) — real 2024 data: web fonts on ~87% of sites, median ~39 KB per font file, ~4 font files per page, and that `preload` (used by only ~11% of pages) is the highest-impact font speedup — the empirical case for the zero-byte system-font alternative.
- [HTTP Archive — 2024 Web Almanac, Page Weight chapter](https://almanac.httparchive.org/en/2024/page-weight) — median desktop page is 2,652 KB; quantifies how much weight fonts contribute and what you save by skipping them.
- [CSS-Tricks — System Font Stack](https://css-tricks.com/snippets/css/system-font-stack/) — the canonical copy-paste vendor stack and an explanation of each token (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, etc.).
- [Stefan Judis — Load the default OS font with CSS](https://www.stefanjudis.com/blog/load-the-default-os-font-with-css/) — clear modern walkthrough of `system-ui` vs the legacy vendor list and when each is needed.
- [systemfontstack.com](https://systemfontstack.com/) — maintained reference of current sans and mono system stacks you can copy directly.
