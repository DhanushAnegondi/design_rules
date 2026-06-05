# Cursor-reactive motion

> The pointer becomes part of the interface — elements follow, tilt, or illuminate in response to the mouse's exact position, creating the sensation of physical weight and magnetism.

**Bucket:** scroll/motion
**Maturity:** current
**Effort:** medium
**Best for:** portfolios, agency websites, marketing landing pages, interactive showcases

## What it is
Three related techniques all share one root mechanism — tracking the pointer's coordinates and mapping them to CSS transforms. A **custom cursor** replaces the OS cursor with a branded dot or ring that trails behind the real pointer using lerp (linear interpolation). A **magnetic element** displaces itself toward the cursor when the pointer enters its activation radius, snapping back elastically on exit. A **spotlight or tilt** maps cursor position within a card's bounding box to a radial-gradient reveal or a 3D `perspective` + `rotateX/Y` rotation. All three are `mousemove` effects; none require scroll.

## When to use
- Portfolio hero sections and agency homepages where a premium, tactile quality is the primary communication goal.
- Call-to-action buttons on pages with a single conversion point — a magnetic pull directs the eye and hand without extra copy.
- Dark-background feature cards where a spotlight gradient adds perceived depth and rewards exploration.
- Interactive showcases (product configurators, motion studios) where user delight is a stated design objective.
- When the site's target audience is using a desktop with a mouse — confirmed by analytics showing low mobile share.

## When NOT to use
- Any site with predominantly mobile or touch traffic — the entire effect is invisible on touch-only devices; building it still costs JavaScript parse time.
- Body-copy pages, documentation, dashboards, or forms — the cognitive load of a trailing cursor is hostile to reading and task flow.
- Accessibility-first or high-contrast contexts where any motion beyond focus rings is a liability.
- Sites with many interactive controls — a magnetic button surrounded by four others creates a tug-of-war that impedes rather than guides.
- **Overuse warning**: slapping a custom cursor on every marketing site regardless of brand is a 2020-era tell. Reserve it for one intentional moment.

## How it works

### Mechanism
Every variant reads `e.clientX` and `e.clientY` from a `mousemove` listener. The raw value is rarely applied directly; instead, a lerp smooths the transition each animation frame:

```
lerp(current, target, factor) → current + (target − current) × factor
```

A factor of `0.08–0.15` produces a natural lag that feels weighted; `1.0` is instant. The rAF loop runs continuously only while the cursor is active, then pauses via `cancelAnimationFrame` once the delta falls below a threshold (e.g., `< 0.001`) to avoid burning GPU cycles at idle.

### Key properties and APIs
- `transform: translate(x, y)` / `rotateX(deg) rotateY(deg)` — GPU-composited, no layout thrash.
- `perspective(800px–1200px)` on the parent — sets the vanishing point for tilt.
- CSS custom properties (`--cx`, `--cy`) updated via `element.style.setProperty()` — lets CSS drive `radial-gradient` position reactively without re-painting the whole background.
- `getBoundingClientRect()` — retrieves the element's position; call once on `mouseenter` and cache; re-cache on `resize` (passive listener).
- `@media (hover: hover) and (pointer: fine)` — the mandatory gate that keeps cursor JS from running on touch devices.
- `window.matchMedia('(prefers-reduced-motion: reduce)')` — checked before any animation begins; JS path, not just CSS, must respect it.

---

## Working code

### 1. Vanilla — spotlight card (no dependencies)

A CSS-variable-driven radial gradient that follows the cursor inside a card. Works in all modern browsers. The `@media (hover: hover) and (pointer: fine)` guard prevents any JS from running on touch; the `prefers-reduced-motion` check disables the gradient update without hiding the card.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Spotlight card</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0d0d10;
      font-family: "Inter", system-ui, sans-serif;
      padding: 2rem;
    }

    .card {
      position: relative;
      width: min(380px, 100%);
      padding: 2rem;
      border-radius: 16px;
      background: #17171c;
      border: 1px solid #2a2a35;
      color: #e8e8f0;
      overflow: hidden;
      /* CSS variables set by JS; defaults center the gradient off-screen */
      --cx: 50%;
      --cy: 50%;
      --glow-opacity: 0;
    }

    /* The spotlight layer — pointer-events:none so it never blocks clicks */
    .card::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: radial-gradient(
        500px circle at var(--cx) var(--cy),
        rgba(120, 80, 255, 0.12),
        transparent 70%
      );
      opacity: var(--glow-opacity);
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    /* Reduced-motion: disable the animated opacity transition */
    @media (prefers-reduced-motion: reduce) {
      .card::before {
        transition: none;
        /* The spotlight still works statically — no motion, just presence */
      }
    }

    .card-label {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #7060d0;
      margin-bottom: 0.75rem;
    }

    .card h2 {
      font-size: clamp(1.2rem, 3vw, 1.6rem);
      font-weight: 700;
      line-height: 1.25;
      margin-bottom: 0.75rem;
      color: #f0f0f8;
    }

    .card p {
      font-size: 0.9rem;
      line-height: 1.6;
      color: #9090a8;
    }
  </style>
</head>
<body>

  <div class="card" id="card">
    <div class="card-label">Feature</div>
    <h2>Built for production,<br>not the demo reel.</h2>
    <p>Performance-first architecture that ships under 50 KB and still handles
       600 concurrent users without a blip.</p>
  </div>

  <script>
    // Gate the entire effect on hover-capable, fine-pointer devices.
    // On touch-only devices this block never runs — no cost, no fallback needed.
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (canHover.matches) {
      const card = document.getElementById('card');

      card.addEventListener('mouseenter', () => {
        card.style.setProperty('--glow-opacity', '1');
      });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--glow-opacity', '0');
      });

      card.addEventListener('mousemove', (e) => {
        // Respect reduced-motion: keep the enter/leave opacity fade but
        // do not track the cursor position (spotlight stays centered).
        if (reducedMotion.matches) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--cx', `${x}px`);
        card.style.setProperty('--cy', `${y}px`);
      });
    }
  </script>
</body>
</html>
```

---

### 2. Vanilla — magnetic button (lerped rAF loop, no dependencies)

The button displaces toward the cursor when it is within a threshold radius; it snaps back elastically on exit. The custom cursor is intentionally omitted here — the native cursor is never hidden without a visible branded replacement, per the rule below.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Magnetic button</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0d0d10;
      font-family: "Inter", system-ui, sans-serif;
    }

    .mag-btn {
      position: relative;         /* needed for transform origin */
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 2.25rem;
      border: none;
      border-radius: 100px;
      background: #7050e8;
      color: #fff;
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      cursor: pointer;
      /* will-change only while animating — set/removed in JS */
      user-select: none;
      /* return spring — CSS handles the snap-back so JS only needs to push */
      transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                  background 0.2s ease;
    }

    .mag-btn:hover  { background: #8060f8; }
    .mag-btn:focus-visible {
      outline: 3px solid #a080ff;
      outline-offset: 4px;
    }

    /* Reduced-motion: kill the elastic snap-back transition */
    @media (prefers-reduced-motion: reduce) {
      .mag-btn { transition: none; }
    }
  </style>
</head>
<body>

  <button class="mag-btn" id="magBtn">View the work</button>

  <script>
    const canHover    = window.matchMedia('(hover: hover) and (pointer: fine)');
    const lessMotion  = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!canHover.matches) {
      // Touch devices: no JS runs. The button renders normally.
      // No cursor is hidden, no JS overhead.
    } else {
      const btn = document.getElementById('magBtn');

      // Lerp helper
      const lerp = (a, b, t) => a + (b - a) * t;

      // State
      let currentX = 0, currentY = 0;
      let targetX  = 0, targetY  = 0;
      let rafId    = null;
      let isInside = false;

      // Activation radius beyond the button edge (px)
      const THRESHOLD = 60;
      // Magnetic pull strength — fraction of distance to apply as offset
      const STRENGTH  = 0.35;
      // Lerp factor: 0.08 = silky lag; 0.15 = snappier
      const FACTOR    = 0.10;

      function tick() {
        currentX = lerp(currentX, targetX, FACTOR);
        currentY = lerp(currentY, targetY, FACTOR);

        btn.style.transform = `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`;

        const delta = Math.abs(targetX - currentX) + Math.abs(targetY - currentY);

        // Stop the loop when effectively settled
        if (!isInside && delta < 0.05) {
          btn.style.transform = '';
          btn.style.willChange = 'auto';
          cancelAnimationFrame(rafId);
          rafId = null;
          return;
        }

        rafId = requestAnimationFrame(tick);
      }

      function startLoop() {
        if (!rafId) {
          btn.style.willChange = 'transform';
          rafId = requestAnimationFrame(tick);
        }
      }

      document.addEventListener('mousemove', (e) => {
        // Reduced-motion: clear any displacement and bail
        if (lessMotion.matches) {
          targetX = 0; targetY = 0;
          return;
        }

        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width  / 2;
        const centerY = rect.top  + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Half-diagonal of button = rough activation boundary
        const halfW = rect.width  / 2 + THRESHOLD;
        const halfH = rect.height / 2 + THRESHOLD;

        if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
          isInside = true;
          targetX = dx * STRENGTH;
          targetY = dy * STRENGTH;
          startLoop();
        } else {
          if (isInside) {
            isInside = false;
            targetX = 0;
            targetY = 0;
            startLoop(); // let the snap-back lerp run
          }
        }
      });
    }
  </script>
</body>
</html>
```

---

### 3. Vanilla — 3D tilt card (lerped, self-contained)

Maps cursor position within the card bounding box to `rotateX`/`rotateY` transforms, with a subtle shine overlay.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>3D tilt card</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0d0d10;
      font-family: "Inter", system-ui, sans-serif;
      padding: 2rem;
    }

    /* Perspective wrapper — perspective must sit on the PARENT, not the card */
    .tilt-scene {
      perspective: 900px;
      perspective-origin: center center;
    }

    .tilt-card {
      width: min(340px, 100%);
      padding: 2.5rem 2rem;
      border-radius: 16px;
      background: linear-gradient(145deg, #1e1b2e, #16141f);
      border: 1px solid #2e2945;
      color: #e4e0f8;
      position: relative;
      overflow: hidden;
      transform-style: preserve-3d;
      /* CSS handles the return spring */
      transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Shine overlay — moves opposite to cursor for depth */
    .tilt-card::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(
        125deg,
        rgba(255,255,255,0.10) 0%,
        rgba(255,255,255,0)    60%
      );
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .tilt-card:hover::after { opacity: 1; }

    /* Reduced-motion: no perspective transforms, no transition */
    @media (prefers-reduced-motion: reduce) {
      .tilt-card {
        transition: none;
      }
      .tilt-card:hover { transform: none !important; }
      .tilt-card::after { display: none; }
    }

    .tilt-card h2 {
      font-size: clamp(1.1rem, 3vw, 1.5rem);
      font-weight: 700;
      margin-bottom: 0.6rem;
      line-height: 1.3;
    }

    .tilt-card p {
      font-size: 0.875rem;
      line-height: 1.65;
      color: #8880b0;
    }
  </style>
</head>
<body>
  <div class="tilt-scene">
    <div class="tilt-card" id="tiltCard">
      <h2>Interaction design<br>that earns attention.</h2>
      <p>Tactile feedback tells the user the interface is alive
         before they even click anything.</p>
    </div>
  </div>

  <script>
    const canHover   = window.matchMedia('(hover: hover) and (pointer: fine)');
    const lessMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (canHover.matches && !lessMotion.matches) {
      const card = document.getElementById('tiltCard');
      // Max tilt degrees
      const MAX_TILT = 12;

      const lerp = (a, b, t) => a + (b - a) * t;

      let rotX = 0, rotY = 0;
      let targetRotX = 0, targetRotY = 0;
      let rafId = null;
      let active = false;

      function tick() {
        rotX = lerp(rotX, targetRotX, 0.12);
        rotY = lerp(rotY, targetRotY, 0.12);

        card.style.transform =
          `rotateX(${rotX.toFixed(3)}deg) rotateY(${rotY.toFixed(3)}deg)`;

        const delta = Math.abs(targetRotX - rotX) + Math.abs(targetRotY - rotY);

        if (!active && delta < 0.02) {
          card.style.transform = '';
          card.style.willChange = 'auto';
          cancelAnimationFrame(rafId);
          rafId = null;
          return;
        }

        rafId = requestAnimationFrame(tick);
      }

      function startLoop() {
        if (!rafId) {
          card.style.willChange = 'transform';
          rafId = requestAnimationFrame(tick);
        }
      }

      card.addEventListener('mouseenter', () => { active = true; });

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        // Normalize to –1 … +1 from center
        const nx = ((e.clientX - rect.left)  / rect.width  - 0.5) * 2;
        const ny = ((e.clientY - rect.top)   / rect.height - 0.5) * 2;

        // rotateX tilts toward top/bottom (positive = top leans away)
        // rotateY tilts toward left/right (positive = right leans toward viewer)
        targetRotX = -ny * MAX_TILT;
        targetRotY =  nx * MAX_TILT;

        startLoop();
      });

      card.addEventListener('mouseleave', () => {
        active = false;
        targetRotX = 0;
        targetRotY = 0;
        startLoop(); // lerp back to flat
      });
    }
    // On touch/no-hover: card renders as a static flat card — no cursor, no JS overhead.
  </script>
</body>
</html>
```

---

### 4. GSAP — custom cursor follower + magnetic button (production)

This is the realistic production choice for a portfolio site that wants all three effects coordinated. Uses `gsap.quickTo()` (GSAP 3.11+) which compiles a setter ahead of time — faster than calling `gsap.to()` inside `mousemove`. The `gsap.matchMedia()` block handles reduced-motion.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GSAP cursor + magnetic</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0d0d10;
      font-family: "Inter", system-ui, sans-serif;
    }

    /* ---- Custom cursor ---- */
    /* Only shown on hover-capable, fine-pointer devices via JS class */
    .cursor-dot,
    .cursor-ring {
      position: fixed;
      top: 0; left: 0;
      pointer-events: none;
      border-radius: 50%;
      z-index: 9999;
      /* Hidden by default; JS reveals them only on pointer:fine devices */
      opacity: 0;
      will-change: transform;
    }

    .cursor-dot {
      width: 6px; height: 6px;
      background: #fff;
      margin: -3px 0 0 -3px;
    }

    .cursor-ring {
      width: 36px; height: 36px;
      border: 1.5px solid rgba(255,255,255,0.5);
      margin: -18px 0 0 -18px;
    }

    /* Hide the system cursor only on fine-pointer devices */
    body.has-fine-cursor { cursor: none; }
    /* Restore the cursor on interactive elements for a11y clarity */
    body.has-fine-cursor a,
    body.has-fine-cursor button,
    body.has-fine-cursor [role="button"] { cursor: none; }

    /* ---- Magnetic button ---- */
    .mag-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 2.5rem;
      border: none;
      border-radius: 100px;
      background: #7050e8;
      color: #fff;
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      cursor: none; /* handled above */
    }

    .mag-btn:focus-visible {
      outline: 3px solid #a080ff;
      outline-offset: 4px;
    }
  </style>
</head>
<body>

  <!-- Custom cursor elements (hidden on touch via JS) -->
  <div class="cursor-dot"  id="cursorDot"  aria-hidden="true"></div>
  <div class="cursor-ring" id="cursorRing" aria-hidden="true"></div>

  <button class="mag-btn" id="magBtn" type="button">Start a project</button>

  <!-- GSAP from CDN (3.12.x) -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script>
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');

    if (!canHover.matches) {
      // Touch/coarse devices: exit immediately. No cursor shown, no listeners attached.
      // The button functions as a standard button with the native cursor.
    } else {
      document.body.classList.add('has-fine-cursor');

      const dot  = document.getElementById('cursorDot');
      const ring = document.getElementById('cursorRing');
      const btn  = document.getElementById('magBtn');

      // gsap.matchMedia handles reduced-motion automatically.
      // Inside the callback, all GSAP animations created are tracked
      // and reverted when the media query no longer matches.
      const mm = gsap.matchMedia();

      mm.add({
        // Two conditions — GSAP evaluates both simultaneously
        fullMotion:   '(prefers-reduced-motion: no-preference)',
        reducedMotion:'(prefers-reduced-motion: reduce)',
      }, (ctx) => {
        const { fullMotion, reducedMotion } = ctx.conditions;

        if (reducedMotion) {
          // Show cursors statically — no animation, still visible
          gsap.set([dot, ring], { opacity: 1 });

          // Move dot instantly with no lerp
          window.addEventListener('mousemove', (e) => {
            gsap.set(dot,  { x: e.clientX, y: e.clientY });
            gsap.set(ring, { x: e.clientX, y: e.clientY });
          });
          // Magnetic: disabled under reduced-motion
          return;
        }

        // ---- Full-motion path ----

        // quickTo compiles a setter: much faster to call inside mousemove
        // Duration controls the lerp-like lag (seconds to reach target)
        const moveDot  = gsap.quickTo(dot,  'x', { duration: 0.08, ease: 'none' });
        const moveDotY = gsap.quickTo(dot,  'y', { duration: 0.08, ease: 'none' });
        const moveRing = gsap.quickTo(ring, 'x', { duration: 0.22, ease: 'power2.out' });
        const moveRingY= gsap.quickTo(ring, 'y', { duration: 0.22, ease: 'power2.out' });

        // Reveal cursors on first move
        let revealed = false;

        window.addEventListener('mousemove', (e) => {
          if (!revealed) {
            gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
            revealed = true;
          }
          moveDot(e.clientX);  moveDotY(e.clientY);
          moveRing(e.clientX); moveRingY(e.clientY);
        });

        // Hide cursors when the pointer leaves the window
        document.addEventListener('mouseleave', () => {
          gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
          revealed = false;
        });

        // ---- Magnetic button ----
        const STRENGTH = 0.38;  // fraction of distance to apply as offset
        const THRESHOLD = 70;   // px beyond the button edge

        // quickTo setters for the button — elastic.out gives the spring
        const moveBtnX = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
        const moveBtnY = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });

        let btnRect = btn.getBoundingClientRect();
        // Cache rect; re-cache on resize
        window.addEventListener('resize', () => {
          btnRect = btn.getBoundingClientRect();
        }, { passive: true });

        let isNear = false;

        window.addEventListener('mousemove', (e) => {
          const cx = btnRect.left + btnRect.width  / 2;
          const cy = btnRect.top  + btnRect.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;

          const nearX = Math.abs(dx) < btnRect.width  / 2 + THRESHOLD;
          const nearY = Math.abs(dy) < btnRect.height / 2 + THRESHOLD;

          if (nearX && nearY) {
            isNear = true;
            moveBtnX(dx * STRENGTH);
            moveBtnY(dy * STRENGTH);
          } else if (isNear) {
            isNear = false;
            moveBtnX(0);
            moveBtnY(0);
          }
        });

        // Return cleanup — gsap.matchMedia calls this when condition reverts
        return () => {
          // GSAP auto-reverts all animations created in this scope
        };
      });
    }
  </script>
</body>
</html>
```

---

## Variations

| Variant | The knob that changes |
|---|---|
| **Cursor follower** | Lag factor (0.05 = dreamy / 0.25 = snappy); ring size; blend-mode `mix-blend-mode: difference` for an inversion effect |
| **Magnetic button** | `STRENGTH` (0.1–0.5); `THRESHOLD` radius; snap-back easing (elastic vs. expo vs. spring) |
| **Spotlight gradient** | Gradient radius (200 px tight / 600 px broad); color stop (brand hue vs. neutral white); opacity ceiling (0.08 subtle / 0.25 pronounced) |
| **3D tilt** | `MAX_TILT` degrees (6 = gentle / 18 = dramatic); perspective distance (600 px exaggerated / 1200 px subtle); whether a glare overlay follows or stays fixed |
| **Image trail** | A queue of past cursor positions renders fading image clones — uses the same lerp loop but emits a new DOM node every N px of travel; expensive, use sparingly |
| **Cursor morph** | The cursor ring scales or changes border-radius on hover over different element types (`mouseenter` on links vs. images vs. buttons) |
| **Parallax layers** | Multiple elements at different z-depths each apply the normalized cursor position scaled by a depth factor — the simplest version requires no library |

---

## Accessibility

### prefers-reduced-motion (mandatory)

The JS path must check `window.matchMedia('(prefers-reduced-motion: reduce)')` **before starting any rAF loop or animation**. CSS alone is insufficient because lerp loops are JS-driven.

```js
// Pattern used in the vanilla snippets above
const lessMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

card.addEventListener('mousemove', (e) => {
  if (lessMotion.matches) return; // bail — no cursor tracking
  // ... update CSS vars
});
```

For GSAP, `gsap.matchMedia()` with a `reducedMotion` condition (shown in snippet 4) is the idiomatic approach. Under reduced-motion, either:
- Show the cursor statically (set position with `gsap.set`, not `gsap.to`).
- Disable the magnetic displacement entirely.
- Disable tilt (revert `transform` to `none`).

Never remove the cursor visually without also restoring it — if you hide the system cursor with `cursor: none`, you must guarantee a visible replacement exists at all times.

### Touch and pointer fallback (mandatory)

Gate every cursor and magnetic listener behind:

```js
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
if (!canHover.matches) return; // exit — no effect on touch, coarse, or keyboard-only
```

`pointer: fine` is Baseline Widely Available since December 2018 (Chrome 41, Firefox 64, Safari 13). Using `any-hover: hover` is a looser test — a phone with a connected Bluetooth mouse passes it — prefer the primary `hover: hover` unless you specifically target hybrid devices.

Do not use `'ontouchstart' in window` as a device check; it is unreliable on hybrid devices and does not reflect the current input modality.

### Cursor hiding

`cursor: none` on `<body>` must be paired with a rendered, visible cursor element in the DOM. If JS fails to load or errors, the system cursor must remain visible. A safe pattern:

```css
/* Default: system cursor always visible */
body { cursor: auto; }
/* Applied by JS only after the custom cursor element is ready */
body.has-fine-cursor { cursor: none; }
```

### Focus and keyboard

The `cursor: none` rule must not prevent focus-visible outlines from appearing. Keep `:focus-visible` styles on buttons and links — the custom cursor is invisible to keyboard users. Never rely on `hover` or `mouseenter` states to communicate functionality; all interactive affordances (label, disabled state, role) must be present regardless of cursor.

### Screen readers

Custom cursor elements (`<div class="cursor-dot">`) must carry `aria-hidden="true"` so they are not read as content. No `aria-live` is needed for cursor position — these effects are purely decorative.

---

## Performance

**Animate only `transform` and `opacity`** — these are GPU-composited and do not trigger layout or paint. Updating `left`/`top` or `background-position` causes continuous repaints across the whole card, defeating the purpose.

**CSS custom property updates** (for spotlight) trigger a repaint of the gradient, not a layout reflow. They are cheaper than animating `background` directly but are still a paint operation. Keep the spotlight element on its own composited layer with `will-change: transform` only if it is also moving — for a static gradient update, `will-change` is unnecessary.

**`getBoundingClientRect()` inside `mousemove`** causes a forced synchronous layout. Cache the rect on `mouseenter` or `resize`:

```js
let rect = btn.getBoundingClientRect();
btn.addEventListener('mouseenter', () => { rect = btn.getBoundingClientRect(); });
window.addEventListener('resize', () => { rect = btn.getBoundingClientRect(); }, { passive: true });
```

**Idle rAF termination** — the lerp loops in the vanilla snippets check `delta < threshold` and call `cancelAnimationFrame` once settled. Without this, the loop burns CPU at 60 fps indefinitely.

**`will-change: transform`** — set it when the animation starts, remove it when settled. Placing it unconditionally in CSS creates a composited layer for every card on the page simultaneously, wasting GPU memory.

**Magnetic effects on scroll** — `getBoundingClientRect()` must be re-called on scroll if the element can move (e.g., on a scrollable page without sticky positioning). Add a passive scroll listener to refresh the cached rect.

**GSAP `quickTo`** compiles the property setter once; calling it 60 times per second inside `mousemove` is orders of magnitude faster than calling `gsap.to()` each frame.

---

## Anti-slop

**The cliché (Motion bucket, slop-blocklist):** A trailing ring cursor with `mix-blend-mode: difference` slapped on every portfolio site regardless of brand, combined with magnetic buttons on *every* CTA and default `ease` or `ease-in-out` for the snap-back. The ring follows the mouse with identical lag on all elements, and the effect is never disabled on touch.

**The tasteful alternative:**
- Choose one cursor-reactive moment per page, not three. The spotlight card on a dark feature section; or the magnetic CTA; not both simultaneously plus a custom cursor on top.
- Use a custom cubic-bezier for the snap-back: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) or `elastic.out(1, 0.4)` in GSAP reads as physical, not library-default.
- If you use a custom cursor, give the ring a brand-aligned scale and color rather than the generic white 36 px circle.
- Let body copy and navigation retain the native cursor — change only the ring's size/shape via a class added on `mouseenter` over interactive elements.
- On scroll-heavy editorial sites, consider skipping a custom cursor entirely and using only the spotlight card — it is less expected and rewards exploration without announcing itself.

Cross-reference blocklist: `MOTION — everything fades-and-slides-up same duration same easing`; `SURFACE — glow/neon everywhere`.

---

## Pairs well with

- `staggered-entrance` — enter animations and cursor effects share an easing language; the same expo-out cubic-bezier unifies both.
- `sticky-pinning` — a pinned hero section with a magnetic CTA rewards the brief dwell time a pinned section creates.
- `scroll-triggered-animation` — use scroll-triggered reveals for content below the fold; cursor-reactive motion for the above-the-fold hero only.
- `smooth-scroll-lenis` — Lenis emits its own scroll events; `getBoundingClientRect()` caching must account for Lenis-driven scroll position to keep the magnetic threshold accurate.

---

## Current references

- [MDN — pointer media feature](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer) — authoritative values (none/coarse/fine), browser support (Baseline widely available since 2018)
- [MDN — any-pointer media feature](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/any-pointer) — hybrid device nuance vs. primary `pointer`
- [Frontend Masters — CSS Spotlight Effect](https://frontendmasters.com/blog/css-spotlight-effect/) — CSS-variable + radial-gradient spotlight, keyboard-navigation disable pattern using `body:has(:focus-visible)`
- [DockYard — CSS media queries for accessibility (January 2024)](https://dockyard.com/blog/2024/01/16/css-media-queries-accessibility-optimize-digital-product-design) — covers `hover: hover`, `pointer: fine`, and `prefers-reduced-motion` together with practical code examples; replaces older single-topic Smashing articles from 2021–2022
- [Pope Tech — Design accessible animation and movement (December 2025)](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) — `prefers-reduced-motion` matchMedia JS patterns, CSS-only fallback, vestibular disorder context, pause/stop controls for long-running animations
- [CSS-Tricks — Next level CSS styling for cursors (April 2025)](https://css-tricks.com/next-level-css-styling-for-cursors/) — advanced custom cursor techniques with `prefers-reduced-motion` and touch-screen gating built in
- [GSAP — gsap.quickTo() docs](https://gsap.com/docs/v3/GSAP/gsap.quickTo()) — compiled setter pattern for high-frequency mousemove callbacks
- [GSAP — gsap.matchMedia() docs](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()) — reduced-motion and pointer conditions, automatic revert on condition change
- [Codrops — Magnetic Buttons (August 2020)](https://tympanus.net/codrops/2020/08/05/magnetic-buttons/) — canonical magnetic button concept reference; no 2024–2026 Codrops update exists as of mid-2026, so this 2020 original remains the authoritative demo
- [Olivier Larose — Magnetic button: GSAP + Framer Motion (August 2023)](https://blog.olivierlarose.com/tutorials/magnetic-button) — two-framework comparison; `elastic.out` vs. spring physics; accessed and confirmed live 2025
- [14islands — Developing a performant custom cursor (February 2021)](https://medium.com/14islands/developing-a-performant-custom-cursor-89f1688a02eb) — rAF idle-cancel pattern, delta threshold, CSS-variable separation of concerns; accessed and confirmed live 2025
- [100 Days of Craft — Building a magnetic cursor effect (August 2025)](https://www.100daysofcraft.com/blog/motion-interactions/building-a-magnetic-cursor-effect) — physics-based magnetic cursor with Next.js, TypeScript, and GSAP; strength range, bounds caching, scroll-awareness
- [ibelick — Create a tilt effect with React](https://ibelick.com/blog/create-tilt-effect-with-react) — `rotateX/Y` from normalized center offset, throttle pattern
