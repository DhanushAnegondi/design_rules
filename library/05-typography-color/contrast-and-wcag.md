# Contrast and WCAG

> The minimum measured luminance difference between text (or a UI element) and its background that keeps content legible for low-vision, aging, and glare-affected eyes — codified by WCAG as 4.5:1 for normal text and 3:1 for large text and non-text.

**Bucket:** system
**Maturity:** evergreen
**Effort:** low
**Best for:** websites, portfolios, apps, dashboards, carousels

## What it is
Contrast is how far apart two colors sit in *relative luminance* (perceived light output), expressed as a ratio from 1:1 (identical) to 21:1 (pure black on pure white). WCAG 2.2 turns that ratio into pass/fail thresholds: body text must hit 4.5:1, large text and meaningful non-text (icons, input borders, focus rings) must hit 3:1. The number is objective and computable from the two hex values alone — you never have to guess whether a pair "looks fine," you measure it. The user perceives it as text that stays readable in sunlight, on a dim laptop, or with a cataract.

## When to use
- Always, for any text or interactive element — this is a floor, not a style choice.
- When picking a brand accent: test it as both a text color and a fill color before committing, because most saturated brand hues pass on one and fail on the other.
- When building a token system: bake the passing pairs into named tokens (`--text`, `--text-subtle`, `--accent`) so contrast is correct by construction and nobody hand-picks a failing color later.
- When theming dark mode: re-measure every pair — a token that passes on white almost never passes unchanged on near-black.
- Designing focus indicators, input outlines, chart strokes, and disabled-but-still-meaningful states.

## When NOT to use
There is no "don't use contrast" — but there are places the *4.5:1 rule specifically does not apply*, and over-applying it makes designs muddy:
- **Pure decoration** — a faint background texture, an inactive divider, or a logo has no contrast minimum (WCAG 1.4.3 and 1.4.11 both exempt purely decorative and brand-logo content). Forcing 4.5:1 on every hairline rule produces a harsh, over-bordered UI.
- **Disabled controls** — genuinely inactive elements are exempt, though if the disabled state still conveys required information you should not lean on that exemption.
- **Placeholder text** is *not* exempt — people overload light-gray placeholders as if they were, and that is the single most common contrast failure in forms. Use a real label, not a 2.5:1 placeholder.
- The everyone-overuses-this trap: **glassmorphism and low-contrast "aesthetic" gray-on-gray body text.** Frosted cards with 3:1 body copy and #999 captions on #fff read as premium in a mockup and fail in daylight. Contrast is not a vibe to dial down for taste.

## How it works
The mechanism is *relative luminance*, then a ratio.

**Step 1 — linearize each channel.** Screen RGB is gamma-encoded. For each of R, G, B (as 0–1):
```
c_linear = c/12.92                       if c <= 0.03928
c_linear = ((c + 0.055) / 1.055) ^ 2.4   otherwise
```

**Step 2 — weight by human luminosity sensitivity.** The eye is most sensitive to green, least to blue:
```
L = 0.2126*R_lin + 0.7152*G_lin + 0.0722*B_lin
```

**Step 3 — the ratio.** With the lighter color's luminance `L1` and the darker's `L2`:
```
contrast = (L1 + 0.05) / (L2 + 0.05)
```
The `+0.05` models ambient screen flare so the ratio never blows up to infinity against pure black. Result ranges 1:1 → 21:1.

**The thresholds (WCAG 2.2 Level AA):**
| Content | Minimum |
|---|---|
| Normal text (< 18.66px bold, < 24px regular) | **4.5:1** (SC 1.4.3) |
| Large text (≥ 24px regular, or ≥ 18.66px bold) | **3:1** (SC 1.4.3) |
| Non-text: UI component boundaries, icons, focus rings, graph strokes | **3:1** (SC 1.4.11) |
| Focus indicator, focused-vs-unfocused state | **3:1** (SC 2.4.13) |
| AAA upgrade (optional) | 7:1 normal / 4.5:1 large |

Note the WCAG-2 formula is **order-independent** — swapping text and background gives the same number. (APCA, below, is not.)

## Working code

### Vanilla — a correct contrast function plus an accessible pair
```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Contrast check</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; background:#faf9f6; color:#1a1a1a;
         max-width: 40ch; margin: 3rem auto; }
  /* #bd4a1a on #faf9f6 = 4.80:1 -> passes 4.5:1 AA for normal text */
  .accent { color:#bd4a1a; }
  /* white on #bd4a1a fill = 5.05:1 -> button label passes AA */
  .btn { background:#bd4a1a; color:#fff; border:0; padding:.6rem 1rem; border-radius:8px; }
</style></head>
<body>
  <p>Body text at <strong>16.53:1</strong> — near-black on warm paper.</p>
  <p class="accent">Accent text at 4.80:1 — clears AA for normal text.</p>
  <button class="btn">Buy ticket</button>
  <p id="out"></p>

<script>
// WCAG 2.x relative luminance + contrast ratio. Input: "#rrggbb".
function luminance(hex) {
  const c = hex.replace('#','');
  const rgb = [0,2,4].map(i => parseInt(c.slice(i, i+2), 16) / 255);
  const [r,g,b] = rgb.map(v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
  return 0.2126*r + 0.7152*g + 0.0722*b;
}
function contrast(a, b) {
  const L1 = luminance(a), L2 = luminance(b);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
function rate(ratio, large=false) {
  const aa = large ? 3 : 4.5, aaa = large ? 4.5 : 7;
  return ratio >= aaa ? 'AAA' : ratio >= aa ? 'AA' : 'FAIL';
}

const r = contrast('#bd4a1a', '#faf9f6');
document.getElementById('out').textContent =
  `accent/bg = ${r.toFixed(2)}:1 -> normal-text ${rate(r)}, large-text ${rate(r, true)}`;
// logs: accent/bg = 4.80:1 -> normal-text AA, large-text AAA
</script>
</body></html>
```

### CSS :root token block (every pair pre-measured)
A committed single warm brand hue (terracotta) plus a real warm-neutral ramp — deliberately *not* the indigo-to-pink gradient or generic #3B82F6 SaaS blue. Every comment states the **true computed ratio**.

```css
/* ---- Light theme: warm paper + terracotta accent ---- */
:root {
  --bg:            #faf9f6;  /* base surface (warm white)                       */
  --surface:       #f1eee7;  /* raised card; 1.10:1 vs --bg = decorative only   */
  --border:        #d8d2c7;  /* 1.45:1 vs --bg -> decorative hairline           */
  --border-strong: #8a8377;  /* 3.07:1 vs --bg -> non-text AA (1.4.11)          */

  --text:          #1a1a1a;  /* 16.53:1 on --bg -> AAA body text                */
  --text-subtle:   #57514a;  /*  7.44:1 on --bg -> AAA body text                */
  --accent:        #bd4a1a;  /*  4.80:1 on --bg -> AA normal text (1.4.3) PASS  */
  --on-accent:     #ffffff;  /*  5.05:1 on --accent -> AA button label          */

  --focus-ring:    #1a1a1a;  /* 16.53:1 vs --bg, 3.44:1 vs --accent -> 2.4.13   */
}

/* ---- Dark theme: near-black warm + brightened terracotta ---- */
:root[data-theme="dark"] {
  --bg:            #14110d;  /* warm near-black                                 */
  --surface:       #1f1b16;  /* raised card; decorative step                   */
  --border:        #332e27;  /* decorative hairline                            */
  --border-strong: #6b655b;  /* 3.18:1 vs --bg -> non-text AA (1.4.11)          */

  --text:          #f2f0ea;  /* 16.52:1 on --bg -> AAA body text                */
  --text-subtle:   #a39c92;  /*  6.93:1 on --bg -> AAA body text                */
  --accent:        #f0883e;  /*  7.44:1 on --bg -> AAA normal text              */
  --on-accent:     #14110d;  /*  7.44:1 on --accent -> AAA button label         */

  --focus-ring:    #f2f0ea;  /* 16.52:1 vs --bg -> 2.4.13 focus appearance      */
}

/* Apply + a compliant 2px focus indicator (SC 2.4.13 needs >= 3:1 + >= 2px) */
body { background: var(--bg); color: var(--text); }
a    { color: var(--accent); }

:where(a, button, input, [tabindex]):focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

If you prefer to keep a brighter, more saturated accent like `#c8501e` in the light theme, know that it measures **4.32:1 on `#faf9f6`** — that is **non-text / large-text only (SC 1.4.11 and the 3:1 large-text tier), NOT normal-text AA.** Use it for headings ≥ 24px, icon strokes, and borders, but never for body-size links or paragraph text. The `#bd4a1a` above is the darkened version that genuinely clears 4.5:1.

### Modern CSS — let the browser pick the accessible text color
`contrast-color()` returns black or white (whichever wins) against a given background, so a button label stays legible even when the fill is themed at runtime. Shipped in Chrome/Edge 147, Firefox 146, Safari 26 (late 2025–early 2026); Baseline-widely-available is projected for 2028, so progressive-enhance.

```css
.chip {
  background: var(--accent);
  color: #fff; /* fallback for engines without the function */
}
@supports (color: contrast-color(black)) {
  .chip { color: contrast-color(var(--accent)); }
}
```

## Variations
- **Conformance target** — AA (4.5:1) is the legal/industry default; AAA (7:1) for long-form reading, government, or low-vision-first products. The knob is the threshold constant.
- **WCAG 2 vs APCA** — the *algorithm* changes. WCAG 2 is a simple luminance ratio, order-independent, and known to mis-rate dark themes (over-lenient on some light-on-dark pairs, over-strict on some mid-tones). **APCA** (Accessible Perceptual Contrast Algorithm) models real perception: it weights font size and weight, is *polarity-aware* (dark-on-light ≠ light-on-dark), and outputs an Lc value (roughly -108…108) you compare to a lookup table, not a single ratio. APCA was explored for WCAG 3 but was **pulled from the working draft in 2023**; WCAG 3's contrast method is currently "to be determined" and the spec is years from finalizing. Use WCAG 2.2 for anything you must legally conform to today; use APCA as a *second opinion*, especially to sanity-check dark mode where WCAG 2 is least reliable.
- **Static tokens vs computed** — hand-measured token pairs (the block above) vs runtime `contrast-color()` / OKLCH lightness math that derives the on-color. Computed scales better across many themes; static is auditable and predictable.

## Accessibility
This *is* the accessibility topic, so the notes are about not fooling yourself:
- **Measure the resting state, not a hover/animated frame.** A token that animates from a dim 0.3 opacity is fine mid-transition but must land at a passing value at rest.
- **Focus indicators (SC 2.4.13, new in 2.2):** the focus ring needs ≥ 3:1 against *adjacent* colors (1.4.11) and the focused-vs-unfocused change needs ≥ 3:1, with the indicator at least as large as a **2px perimeter**. A `2px solid` outline with `outline-offset: 2px` satisfies it cleanly. Never `outline: none` without an equally visible replacement.
- **Don't rely on color alone (SC 1.4.1):** a red/green status dot must also differ in shape or label; contrast does not rescue color-blind users from a hue-only signal.
- **prefers-reduced-motion:** not a contrast control, but if you cross-fade themes, wrap the transition so reduced-motion users get an instant swap:
  ```css
  @media (prefers-reduced-motion: no-preference) {
    body { transition: background-color .2s, color .2s; }
  }
  ```
- **prefers-contrast & forced-colors:** respect `@media (prefers-contrast: more)` by swapping to higher-ratio tokens, and test `forced-colors: active` (Windows High Contrast) — it overrides your colors with system ones, so make sure borders and focus survive via `forced-color-adjust` and system color keywords.
- **Pointer/touch:** large tap targets don't change contrast math, but a `1px` hairline border that passed on desktop can be sub-pixel and invisible on a low-DPI touchscreen — verify the *rendered* element, not the spec value.
- **Screen readers:** unaffected by contrast, which is exactly why automated tools catch contrast but not the color-only-meaning failures above — check both.

## Performance
Contrast itself is free at runtime. Watch:
- **`contrast-color()` and relative-color / OKLCH computation** resolve at style time; with hundreds of computed swatches you add a small style-recalc cost. Negligible for normal UIs, measurable in a 10k-cell heatmap — precompute those.
- **Theme switching** that toggles a hundred custom properties triggers one style recalc + repaint; batch it on `:root` (as above) rather than per-element so it's a single invalidation.
- **No layout thrash** — color changes repaint but never reflow, so transitions stay on the compositor-friendly side. Don't animate `color` on thousands of nodes at once regardless.
- **Bundle cost:** the JS `contrast()` helper is ~12 lines — ship it instead of pulling a color library if measuring is all you need.

## Anti-slop
Cliché (see `_slop-blocklist.md` -> COLOR and SURFACE): the **purple/indigo-to-pink gradient on white** with **#999 captions and glassmorphic cards** whose body text limps in at 3:1. It mockups beautifully and fails in sunlight — the #1 AI tell stacked on a contrast failure. The tasteful, compliant alternative is exactly the token block above: one **committed brand hue** (here a warm terracotta `#bd4a1a`) on a real warm-neutral ramp, where `--text` is 16.5:1, `--text-subtle` still clears AAA at 7.4:1, and the accent is darkened just enough to genuinely pass 4.5:1 as text — not a saturated `#c8501e` that *looks* like it passes (it is only 4.32:1, large-text/non-text only) but does not. Subtlety comes from the neutral ramp and type weight, never from starving the contrast.

## Pairs well with
- `color-tokens-oklch` — define the ramp in OKLCH so equal lightness steps are perceptually even, then *measure* the resulting pairs for WCAG (perceptual evenness does not guarantee a passing ratio).
- `dark-mode-strategy` — re-measure every token on the dark surface; the brightened `--accent #f0883e` (7.44:1) is why dark mode needs its own values.
- `focus-states` / `focus-visible-rings` — the 2.4.13 indicator that depends on this math being right.
- `semantic-color-tokens` — naming pairs by role (`--text`, `--on-accent`) so contrast is correct by construction, not per-component guesswork.
- `modular-type-scale` — large-text sizes unlock the easier 3:1 threshold, so the scale and the contrast budget are linked.

## Current references
- [Understanding SC 1.4.3: Contrast (Minimum) — W3C WAI](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — the normative 4.5:1 / 3:1 thresholds and what "large text" means.
- [Understanding SC 1.4.11: Non-text Contrast — W3C WAI](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html) — the 3:1 rule for icons, borders, and focus rings.
- [Understanding SC 2.4.13: Focus Appearance — W3C WAI](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) — the new 2.2 focus-indicator size + contrast requirement.
- [WebAIM — Contrast and Color Accessibility](https://webaim.org/articles/contrast/) — the clearest plain-language walkthrough of the ratio and the formula.
- [contrast-color() — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/contrast-color) — the new CSS function and its current support table.
- [APCA in a Nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html) — what APCA changes and how to read Lc values.
- [WCAG 3.0 introduces a new contrast method — Designsystemet](https://designsystemet.no/en/best-practices/accessibility/contrast) — honest status of APCA-in-WCAG-3 as of 2025.
- [Building Self-Correcting Color Systems with contrast-color() — Smashing Magazine](https://www.smashingmagazine.com/2026/05/building-self-correcting-color-systems-contrast-color/) — production patterns for runtime-computed accessible color.
