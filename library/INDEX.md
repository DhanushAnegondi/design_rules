# Design knowledge base — index

Every concept in the library, grouped by bucket, with a one-line "what it is / use when".
Open the linked file for the full entry: when to use, when NOT to, runnable code,
accessibility, performance, anti-slop, and current references.

**Mental model for building a screen:** one **skin** (visual style, 01) + one
**skeleton** (layout, 03) + a few **behaviors** (motion, 02), dressed with **type &
color** (05), assembled from **components** (04), textured with **backgrounds/effects**
(07), and finished with **states/feedback** (08) on a **responsive foundation** (09).
Folder **06** gives you pre-composed recipes. Slop comes from grabbing the default of
every bucket at once — see [_slop-blocklist.md](_slop-blocklist.md).

**88 entries across 9 buckets.** All passed an independent 7-point Quality Gate.

---

## 01 · Visual styles (skins) — `01-visual-styles/`
| Concept | What it is / use when |
|---|---|
| [Glassmorphism](01-visual-styles/glassmorphism.md) | Translucent frosted-glass surface that blurs and tints what sits behind it, set off by a hairline highlight border. |
| [Neumorphism (soft UI)](01-visual-styles/neumorphism.md) | Controls extruded from or pressed into one flat surface, faked with one light + one dark shadow on a same-color background. |
| [Brutalism & neo-brutalism](01-visual-styles/brutalism-neo-brutalism.md) | Raw structural UI: thick hard borders, solid zero-blur offset shadows, flat clashing color, system/mono type. |
| [Skeuomorphism](01-visual-styles/skeuomorphism.md) | Elements borrow real-world materials (leather, metal, glass) so a control reads as a tangible object. |
| [Flat design & Material](01-visual-styles/flat-and-material.md) | Solid color fields and clean type with little ornament — and Material 3's systematic elevation, tonal color, state layers. |
| [Claymorphism](01-visual-styles/claymorphism.md) | Puffy pastel surfaces like moulded clay: big radii, soft outer shadow, inset highlight/shadow for fake 3D. |
| [Aurora & gradient mesh](01-visual-styles/aurora-gradient-mesh.md) | Soft blurred fields of overlapping color drifting slowly behind the UI like northern lights. |
| [Bento aesthetic](01-visual-styles/bento-aesthetic.md) | Rounded soft-elevated tiles, each one glanceable idea with its own accent, at varied sizes (the Apple keynote look). |
| [Editorial / typographic](01-visual-styles/editorial-typographic.md) | Type is the interface: oversized display lettering, asymmetric grid, generous whitespace, 1–2 colors. |
| [Maximalism](01-visual-styles/maximalism.md) | Dense, layered, clashing anti-minimal design held together by a strict grid and clear hierarchy. |
| [Minimalism](01-visual-styles/minimalism.md) | Disciplined reduction where whitespace is structure, one accent carries emphasis, type contrast does the work. |
| [Dark mode aesthetic](01-visual-styles/dark-mode-aesthetic.md) | Near-black surfaces, elevation by lightness steps, one restrained focal glow, desaturated accents. |

## 02 · Scroll & motion (behaviors) — `02-scroll-motion/`
| Concept | What it is / use when |
|---|---|
| [Text reveal on scroll](02-scroll-motion/text-reveal-on-scroll.md) | Words/lines/characters animate into view as you scroll to them — mask-up, stagger-fade, or scrub-fill. |
| [Scroll-triggered animation](02-scroll-motion/scroll-triggered-animation.md) | Element animates in once when it enters the viewport, then stays — a fire-once reveal. |
| [Scroll-linked scrubbing](02-scroll-motion/scroll-linked-scrubbing.md) | Animation progress bound to scroll position; the scrollbar is a playhead that rewinds. |
| [Parallax scrolling](02-scroll-motion/parallax.md) | Background and foreground layers travel at different rates to fake Z-depth. |
| [Sticky / pinning](02-scroll-motion/sticky-pinning.md) | Hold an element in the viewport while the page scrolls past — `position: sticky` or GSAP pin. |
| [Horizontal scroll](02-scroll-motion/horizontal-scroll.md) | Content moves sideways as the page scrolls down — pinned GSAP track or native scroll-snap rail. |
| [Scroll-snap & full-page](02-scroll-motion/scroll-snap-full-page.md) | Scroll snaps cleanly to each full-viewport panel instead of stopping mid-section. |
| [Scroll progress indicator](02-scroll-motion/scroll-progress-indicator.md) | Fixed bar/ring that fills with scroll position — ideally native CSS, zero JS. |
| [Scrollytelling](02-scroll-motion/scrollytelling.md) | A pinned graphic updates state as stepped narrative text scrolls past it. |
| [Smooth scroll (Lenis)](02-scroll-motion/smooth-scroll-lenis.md) | ~3 kB eased scrolling that doubles as the RAF clock GSAP ScrollTrigger reads from. |
| [Staggered entrance](02-scroll-motion/staggered-entrance.md) | A group animates in one after another with a small per-item delay. |
| [Marquee / ticker](02-scroll-motion/marquee-ticker.md) | Infinite horizontal strip of text/logos looping seamlessly by duplicated content. |
| [Cursor-reactive motion](02-scroll-motion/cursor-reactive-motion.md) | Elements follow, tilt, or illuminate to the pointer for a sense of weight and magnetism. |
| [Page transitions](02-scroll-motion/page-transitions.md) | Animate the swap between views (View Transitions API / framework) for continuity over a hard cut. |

## 03 · Layout systems (skeletons) — `03-layout-systems/`
| Concept | What it is / use when |
|---|---|
| [F-pattern](03-layout-systems/f-pattern.md) | The F-shaped scan of text-dense pages — design against it by front-loading meaning left and into headings. |
| [Z-pattern](03-layout-systems/z-pattern.md) | Sparse layout walking the eye logo → nav → diagonal → single bottom-right CTA. |
| [Hero + feature grid](03-layout-systems/hero-feature-grid.md) | Loud opener then a feature grid — done well with unequal cell size/weight, not three clones. |
| [Asymmetric layout](03-layout-systems/asymmetric-layout.md) | Grid broken out of mirror-symmetry, balanced by visual weight and negative space. |
| [Masonry](03-layout-systems/masonry.md) | Fixed-width columns, natural item heights, items shift up to fill gaps (Pinterest wall). |
| [Bento grid](03-layout-systems/bento-grid.md) | Dense scannable grid of differently-sized tiles built from varied row/column spans. |
| [Sidebar + content](03-layout-systems/sidebar-content.md) | App-shell: fixed nav rail beside a scrollable content pane via CSS Grid. |
| [Split screen](03-layout-systems/split-screen.md) | Viewport divided into two adjacent panels read as one composition with two entry points. |
| [Single-column / centered](03-layout-systems/single-column-centered.md) | One centered column at a 45–75ch measure with deliberate rhythm and column-breaking moments. |
| [Holy grail](03-layout-systems/holy-grail.md) | Header/footer + three-band middle (nav, main, aside) in a few lines of Grid, collapsing on mobile. |
| [Card-based](03-layout-systems/card-based.md) | Responsive grid of self-contained card units that reflows column count automatically. |
| [Magazine / editorial grid](03-layout-systems/magazine-editorial-grid.md) | Many-column print grid: varied widths, spanning headlines/pull quotes, image bleeds, subgrid. |
| [Full-bleed](03-layout-systems/full-bleed.md) | Centered reading column with chosen sections breaking out to the viewport edges. |

## 04 · Component patterns — `04-component-patterns/`
| Concept | What it is / use when |
|---|---|
| [Navbars](04-component-patterns/navbars.md) | Sticky wayfinding header: top-level sections, mobile drawer, optional mega-menu. |
| [Hero sections](04-component-patterns/hero-sections.md) | First full-viewport section: brand identity, value prop, one clear action. |
| [Cards](04-component-patterns/cards.md) | Self-contained surface grouping media/title/meta/action into an actionable unit. |
| [Carousels & sliders](04-component-patterns/carousels-sliders.md) | Windowed panel sequence with prev/next, dots, swipe, cautious autoplay — an a11y minefield, handled. |
| [Modals & dialogs](04-component-patterns/modals-dialogs.md) | Focus-trapping layer demanding a focused decision; native `<dialog>`, return focus. |
| [Footers](04-component-patterns/footers.md) | Bottom landmark for secondary nav, legal, contact, utilities. |
| [Pricing tables](04-component-patterns/pricing-tables.md) | Side-by-side tier comparison with an in-place monthly/annual toggle. |
| [Forms & inputs](04-component-patterns/forms-inputs.md) | Label binding, accessible inline validation, field grouping, guided submit. |
| [Bento tiles](04-component-patterns/bento-tiles.md) | Varied-span tiles each holding one content type, unified by size contrast and grid rhythm. |
| [Testimonials](04-component-patterns/testimonials.md) | Real quotes in card grid / carousel / marquee / logo wall / video to build credibility. |
| [Magnetic & animated buttons](04-component-patterns/magnetic-animated-buttons.md) | Cursor-pull, fill/sweep, icon motion micro-interactions on real `<button>`s. |

## 05 · Typography & color (systems) — `05-typography-color/`
| Concept | What it is / use when |
|---|---|
| [Modular type scales](05-typography-color/modular-type-scales.md) | Every step = previous × one fixed ratio, so sizes are mathematically related. |
| [Font pairing strategy](05-typography-color/font-pairing.md) | Two or three typefaces contrasting on purpose, each assigned a fixed role. |
| [Variable fonts](05-typography-color/variable-fonts.md) | One file with continuous weight/width/slant/optical axes you drive with CSS. |
| [Fluid type with clamp()](05-typography-color/fluid-type-clamp.md) | `clamp(min, base + vw, max)` grows size smoothly between viewports, no media queries. |
| [System font stacks](05-typography-color/system-font-stacks.md) | Ask the OS for its own UI font — instant render, zero network, native feel. |
| [Color system construction](05-typography-color/color-system-construction.md) | Primitive ramps feeding semantic role aliases (bg/surface/fg/muted/border/accent). |
| [OKLCH & perceptual color](05-typography-color/oklch-perceptual-color.md) | Perceptually-uniform space where equal numeric steps look like equal visual steps. |
| [Contrast & WCAG](05-typography-color/contrast-and-wcag.md) | The legibility math: 4.5:1 normal text, 3:1 large/non-text, how it's computed, APCA. |
| [Palette generation](05-typography-color/palette-generation.md) | One brand hue + one accent, every UI color an OKLCH lightness ramp off them. |
| [Dark-mode token strategy](05-typography-color/dark-mode-token-strategy.md) | One semantic token set resolving to different raw values per scheme. |
| [Design tokens](05-typography-color/design-tokens.md) | Named tiered variables for color/type/space/radius — one source of truth across themes. |

## 06 · Recipes (full builds) — `06-recipes/`
| Recipe | What it composes |
|---|---|
| [SaaS landing page](06-recipes/saas-landing.md) | Restrained dark editorial skin, asymmetric bento features, three purposeful scroll behaviors — rejects the SaaS-slop stack. |
| [Agency / editorial site](06-recipes/agency-editorial.md) | Editorial skin, magazine grid, headline reveal + horizontal case-study gallery + magnetic CTA, ink-on-paper + rust accent. |
| [Developer portfolio](06-recipes/dev-portfolio.md) | Dark aesthetic, bento project grid, minimal motion, sans + mono pairing — fast and legible. |
| [Mobile app UI](06-recipes/mobile-app-ui.md) | Three phone-framed screens, tonal OKLCH dark skin, card layout, ARIA tab bar, safe-area insets. |
| [Instagram carousel](06-recipes/instagram-carousel.md) | Editorial slides at 1080×1080 + 1080×1350, safe areas, 3-hue palette, PNG export path. |
| [Dashboard / admin](06-recipes/dashboard.md) | Dark minimalist skin, sidebar+content, meaning-encoding 2-hue color, accessible skeleton loading. |

## 07 · Backgrounds & effects — `07-backgrounds-effects/`
| Concept | What it is / use when |
|---|---|
| [CSS gradients](07-backgrounds-effects/css-gradients.md) | Resolution-independent color transitions in the browser; also a pattern primitive. |
| [Gradient mesh & aurora](07-backgrounds-effects/gradient-mesh-aurora.md) | Layered slow-drifting radial gradients blurred into an ambient color field. |
| [Noise & grain texture](07-backgrounds-effects/noise-grain-texture.md) | A thin noise layer that kills banding and adds tactile, film-like depth. |
| [Geometric patterns](07-backgrounds-effects/geometric-patterns.md) | CSS-only tiled grids, dots, stripes, checks, conic slices — no image requests. |
| [Blur & glass surfaces](07-backgrounds-effects/blur-glass-surfaces.md) | `backdrop-filter: blur()` frosting the content behind a translucent panel. |
| [Blend modes](07-backgrounds-effects/blend-modes.md) | `mix-blend-mode` / `background-blend-mode` for duotones, knockouts, layered color. |
| [Animated gradients](07-backgrounds-effects/animated-gradients.md) | Gradient shifting through color/angle/position purely in CSS, no JS loop. |
| [Spotlight & cursor glow](07-backgrounds-effects/spotlight-cursor-glow.md) | A radial highlight chasing the pointer across a card/hero surface. |

## 08 · UI states & feedback — `08-ui-states-feedback/`
| Concept | What it is / use when |
|---|---|
| [Empty states](08-ui-states-feedback/empty-states.md) | A screen with no data that says why and exactly what to do next. |
| [Loading & skeletons](08-ui-states-feedback/loading-and-skeletons.md) | Placeholder shapes holding layout while content arrives. |
| [Error & validation states](08-ui-states-feedback/error-and-validation-states.md) | Accessible inline + summary errors saying what broke and how to fix it. |
| [Toasts & notifications](08-ui-states-feedback/toasts-and-notifications.md) | Brief non-blocking live-region messages — never the only channel for what matters. |
| [Progress & steppers](08-ui-states-feedback/progress-and-steppers.md) | Bars and multi-step wizards that gate forward movement on valid input. |
| [Microcopy & UX writing](08-ui-states-feedback/microcopy-ux-writing.md) | The specific words on buttons/labels/errors that tell users what happens next. |
| [Onboarding & tooltips](08-ui-states-feedback/onboarding-and-tooltips.md) | Contextual non-blocking tooltips, coachmarks, tours that don't steal focus. |

## 09 · Responsive foundations — `09-responsive-foundations/`
| Concept | What it is / use when |
|---|---|
| [Breakpoint strategy](09-responsive-foundations/breakpoint-strategy.md) | Change layout by content needs and container space, not device pixel counts. |
| [Container queries](09-responsive-foundations/container-queries.md) | Style a component by its own container's size/state, not the viewport. |
| [Fluid everything](09-responsive-foundations/fluid-everything.md) | `clamp()` on type, space, and layout so the whole design interpolates between sizes. |
| [Mobile-first patterns](09-responsive-foundations/mobile-first-patterns.md) | Build the lean small-screen UI first, layer complexity up with `min-width`. |
| [Touch targets & safe areas](09-responsive-foundations/touch-targets-safe-areas.md) | Tappable-sized targets positioned clear of notches, islands, home indicators. |
| [Responsive images & art direction](09-responsive-foundations/responsive-images-art-direction.md) | `srcset`/`sizes`/`<picture>` to fetch the right file per device, with no CLS. |
