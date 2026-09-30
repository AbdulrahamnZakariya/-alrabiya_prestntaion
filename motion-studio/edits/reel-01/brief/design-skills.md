# Design-skills brief: web-UI principles translated for a 36s Arabic talking-head reel (1080x1920, HyperFrames + GSAP 3)

Sources: `emilkowalski/skills` [EMIL], `pbakaus/impeccable` [IMP], `leonxlnx/taste-skill` [TASTE].
"Translation" = my conversion of a web rule to video. It is not a rule written in the repo.
Frame counts assume 30fps. Multiply by 2 for 60fps.

**Scale factor (read this first):** web px values in these skills assume a phone viewport about 390 CSS px wide.
Our canvas is 1080 px wide, so **multiply web distances and blurs by about 2.75**. Examples: Emil's `translateY(8px)` becomes about 22px, and impeccable's "10-20px" becomes 28-55px.
Unitless values (scale, opacity, easing curves, durations) carry over unchanged.

**House dials [TASTE §1]:** the reel is an editorial talking head, where the speaker is the content.
Use `DESIGN_VARIANCE 5 / MOTION_INTENSITY 5 / VISUAL_DENSITY 2-3`: crisp, restrained, one authored moment per beat.

---

## 1. Motion rules (with numbers)

### 1.1 Ease library (register these once and use nothing else)
| Token | Source curve | GSAP 3 | Use for |
|---|---|---|---|
| `out` (default) | EMIL `cubic-bezier(0.23,1,0.32,1)` | `CustomEase.create("out","0.23,1,0.32,1")`, fallback `power4.out` | every entrance: captions, cards, lower-thirds |
| `outExpo` (focal) | IMP `cubic-bezier(0.16,1,0.3,1)` | `expo.out` | the one focal/hero entrance per beat; large moves |
| `inOut` | EMIL `cubic-bezier(0.77,0,0.175,1)` | `CustomEase "0.77,0,0.175,1"`, fallback `power4.inOut` | elements already on screen moving A to B, punch-in zooms, reframes, wipes |
| `drawer` | EMIL `cubic-bezier(0.32,0.72,0,1)` | `CustomEase "0.32,0.72,0,1"` | panels/cards sliding in from an edge |
| `quiet` | IMP "ease-out-quart" | `power3.out` (GSAP power3 = quart) | subtle, understated secondary motion |
| `linear` | EMIL "constant motion" | `"none"` | progress bar and continuous drift only |
| `settle` (rare) | EMIL spring `bounce 0.1-0.3` | `back.out(1.2)`, max `back.out(1.4)` | only a physical object "landing" (sticker, stat chip). Max 1-2 per reel |

- Never use `ease-in` / `power*.in` on entrances [EMIL]. It delays the exact moment the eye is watching.
- Never use `bounce.*` or `elastic.*` [IMP: "do not use bounce or elastic curves by reflex", "Never bounce or elastic"].
- Don't rely on default `power1`/`"ease"` for featured motion. Built-in curves "lack the punch" [EMIL].
- Springs map to GSAP as follows [EMIL apple-design]. The default spring is critically damped (damping 1.0, response 0.3-0.4s), so use `out` or `outExpo` at 0.4-0.6s. Use overshoot only when the object "carries momentum" (the `settle` token).

### 1.2 Durations
| Role | ms | frames@30 | Source |
|---|---|---|---|
| Caption word highlight or color swap, micro-feedback | 100-160 | 3-5 | EMIL press 100-160ms, IMP 100-150 |
| Caption chunk enter (routine, repeats ~20-40x) | 150-250 | 5-8 | IMP "routine state change 150-300", EMIL frequency rule |
| Secondary graphic enter (lower-third, icon, chip) | 300-450 | 9-14 | IMP 300-500 |
| Focal entrance (hook title, key number, CTA end card) | 500-800 | 15-24 | IMP "deliberately authored focal entrance 500-800" |
| On-screen move, reframe, punch-in | 400-700 | 12-21 | EMIL modals/drawers 200-500, marketing "can be longer" |
| Exit | 60-70% of its enter, 150-300 | 5-9 | EMIL + IMP "Exit faster than entrance" |
| Hold before an element leaves | at least 1.2s of full visibility per 5 Arabic words | 36+ | translation (readability) |

- **Frequency rule, translated [EMIL].** "The more often a user sees an animation, the shorter and subtler it should be." Captions change every 1-2s, so they get the least motion (fade plus a ~20px rise, or no motion with only the keyword highlight animating). Graphics that appear 1-3 times per reel can carry authorship.
- **One authored moment per beat [IMP craft-floor].** "One authored moment, not scattered effects and not one identical entrance on every section." For 36s, plan about 3 focal moments in total: hook (0-2s), core point/number (mid), and payoff/CTA (last 3s). Everything else stays quiet.
- **Asymmetric timing [EMIL].** Arrive slow and deliberate, leave fast. Example: enter 600ms `outExpo`, exit 200ms `out` (opacity plus a small move).

### 1.3 Entrance recipe (defaults on the 1080 canvas)
- Start state: `opacity:0, y:24-40, scale:0.96` (optionally `filter:blur(6-8px)`). End state: `opacity:1, y:0, scale:1, blur:0`.
  - Never start from `scale:0` [EMIL]. Use 0.9-0.97 plus opacity.
  - Text entrance distance cap is 60px. Beyond that it reads cheap/slidey (IMP quieter: "Shorter distances (10-20px instead of 40px)" web values, x2.75).
- Blur-in: keep ≤12px on text, and apply it only to the element that is entering, never full-frame. EMIL: "Keep blur under 20px" (web); use blur "to mask imperfect transitions".
- **Reach past transform/opacity [IMP].** Use "blur, backdrop-filter, clip-path, mask, and shadow belong to the palette". A clip-path/mask line reveal is the premium alternative to character animation.
  - For RTL text, reveal from the right edge: `clip-path: inset(0 0 0 100%)` to `inset(0 0 0 0)`, 400-600ms `inOut`.
- **Origin-aware scaling [EMIL].** Things grow from their anchor. A caption highlight pill grows from the word's right edge (RTL start). A lower-third grows from its screen edge. A centered end card may scale from center (the "modal exemption").

### 1.4 Stagger
- 30-80ms between items [EMIL]; about 80ms [TASTE minimalist]. **Cap total stagger at ≤400ms** [IMP: "Cap the total delay"].
- Arabic words: 40-70ms per word, and stagger the first word first. In DOM/logical order the first word is the rightmost, so it reads right-to-left naturally.
- Lines: 80-120ms per line.
- Stagger only things that are a list [IMP]. Don't stagger every caption; that turns into a tic.

### 1.5 Camera/speaker moves
- Punch-in zoom on the speaker: scale 1.00 to 1.06-1.12 over 400-700ms `inOut`. Max 1 punch-in per 6-8s.
  - Hard cuts between two zoom levels are fine and often cleaner (translation).
- Use no continuous Ken-Burns drift on the speaker plate. The only ambient motion allowed is a single slow background element: ≥20s cycle, opacity 0.02-0.04 [TASTE minimalist].

### 1.6 HyperFrames/determinism translations (these override web-only advice)
- EMIL prefers CSS transitions and springs for *interruptibility*, but video is never interrupted. **Put all motion on the paused GSAP timeline.**
  - No CSS `transition`, `@keyframes`, `@starting-style`, `requestAnimationFrame`, `Date`, or unseeded `Math.random`.
  - Loops must use finite `repeat` counts computed from the scene length.
- EMIL/TASTE "animate only transform & opacity" is a perf rule for live browsers. In a frame-by-frame render, blur/clip-path cost render time, not jank.
  - Still keep filters bounded to small elements (IMP: "Bound blur, filter, shadow... to isolated regions").
- `prefers-reduced-motion` does not apply to a rendered video. Keep its spirit: "fewer and gentler animations, not zero" [EMIL/IMP].

---

## 2. Typography & layout for 1080x1920

### 2.1 Safe zone (platform convention, not from the repos)
- Keep all text inside **x 80-940, y 240-1500**.
- The Reels/TikTok UI covers the bottom ~400px and a right-side icon rail (~x 940-1080, y 900-1650).
- RTL lines *start* on the right, so right-align Arabic to x≈940, **not** 1000.

### 2.2 Scale (few roles, obvious steps [IMP typeset: "fewest roles and families"])
| Role | Size | Weight | Line-height (Arabic) |
|---|---|---|---|
| Hook/display (≤6 words, ≤2 lines) | 120-160px | 800-900 | 1.2-1.3 |
| Key number/stat | 180-260px, tabular numerals | 800-900 | 1.0-1.1 (digits only) |
| Caption (2 lines max, 3-6 words per line) | 64-80px | 700 | 1.35-1.5 |
| Label/lower-third name | 44-52px | 600-700 | 1.3 |
| Small meta (use sparingly) | ≥36px | 500 | 1.3 |

- Adjacent roles must differ by ≥1.4x size or ≥200 weight [IMP: "adjacent sizes or weights too close to carry different jobs"].
- Hierarchy comes from weight plus color/tone, not raw size alone [TASTE 9.B: "NO oversized H1s that just scream"].
- Hero stack: max 4 text elements on screen at once, and usually 1-2 [TASTE 4.7 "HERO STACK DISCIPLINE"].
- Spacing scale on an 8px base: 16/24/32/48/64/96/128.
  - Tight inside a group, generous between groups, more space above a heading than below [IMP craft-floor].
  - Minimum side margin is 80px.
- Centered composition is allowed here. TASTE's anti-center bias explicitly exempts formats "where the message itself is the design". Keep captions right-aligned or centered consistently for the whole reel; don't switch between them.

### 2.3 Arabic/RTL rules (override any repo rule that conflicts)
1. **Never split Arabic into characters.** Splitting breaks cursive joining and shaping. This bans per-char text morph, typewriter, and scramble (EMIL vocab and TASTE vocab list them as effects), as well as GSAP SplitText `chars`.
   - Animate by **word** (each word wrapped in an `inline-block` span, keeping the space text nodes between spans) or by **line**/mask.
2. **No letter-spacing on Arabic. Keep it at 0.** This conflicts with EMIL/IMP/TASTE's negative display tracking (-0.02 to -0.04em) and with TASTE's `tracking-tighter`. Those rules apply to Latin only.
   - Apply tracking to any Latin inside Arabic lines only if it sits in its own span.
3. **No italics for emphasis.** Arabic has no true italic, and synthetic oblique looks broken. TASTE's "italic or bold of the SAME font" becomes **weight or accent color of the same family**. Never mix a second family for one word [TASTE: "Mixed-family emphasis is amateur"].
4. **Line-height ≥1.3 and mask padding.** Arabic ascenders, descenders, and tashkeel clip under `leading-none` or `overflow:hidden` masks. This is the analogue of TASTE's "ITALIC DESCENDER CLEARANCE": add ~0.15em padding top/bottom inside any clip/mask wrapper.
5. **Direction.** Put `direction:rtl` on each text container, **not** `dir=rtl` on `<html>`, because that flips HyperFrames layout.
   - Wrap Latin words and numbers in `unicode-bidi:isolate` spans.
   - Use the Arabic comma `،`. No em-dashes: TASTE 9.G bans `—`/`–` outright, and they look foreign in Arabic anyway.
6. **Mirror directional motion.** "Forward" in RTL is right to left: slide-ins enter from the right, and progress bars fill right to left. This is EMIL's "direction-aware transition" flipped.
7. **Numerals.** Pick Western (0-9) or Arabic-Indic (٠-٩) once for the whole reel. Use `font-variant-numeric: tabular-nums` for any ticking counter [EMIL "Tabular numbers... Essential for tickers"].
8. **Font.** Use one Arabic family with 3 weights max, self-hosted or from Google Fonts, and wait for `document.fonts.ready` before the first frame renders.
   - Never use Arial/Tahoma/system as the display voice [IMP: "A system display face... is a failure, not a fallback"]. Candidates: IBM Plex Sans Arabic, Readex Pro, Alexandria, Noto Kufi Arabic, Almarai. Match the brand if one exists (the brief wins [IMP]).
9. Caption measure is ≤6 words per line and ≤2 lines. Arabic words are long; IMP's 45-75ch web measure is far too wide for video.

---

## 3. Color rules
- **One accent, locked for the whole reel** [TASTE 4.2 "Max 1 accent color", "COLOR CONSISTENCY LOCK"]. Accent saturation <80% [TASTE]. Desaturate toward 70-85% if it vibrates on the video plate [IMP quieter].
- **Accent owns a role, not scattered dots** [IMP colorize: "Let the strongest color own a deliberate region or role instead of scattering tiny accents"]. Example: the accent marks the spoken keyword in captions plus the one focal graphic. Everything else is neutral ("10% rule" [IMP quieter]).
- **No pure black or pure white.** Use off-black (e.g. `#0E0F11`) and off-white (e.g. `#F4F3EF`) [TASTE 9.A "NO pure black", IMP README "always tint"]. Tint neutrals toward the accent or skin tones only if it helps cohesion.
- **Contrast.** Caption text needs ≥4.5:1 against its local background, and large text ≥3:1 [IMP craft-floor, TASTE].
  - Over a moving plate, get this from a soft bottom gradient scrim (e.g. `linear-gradient(to top, rgba(10,10,12,.55), transparent 40%)`) or a solid pill. Hoping the video stays dark is not enough.
- **Shadows need offset plus blur, never a halo.** Example: `0 4px 16px rgba(0,0,0,.35)` [IMP: "A zero-offset colored halo is decoration"].
  - No neon outer glow [TASTE 9.A]. Tint shadows toward the background hue [TASTE 4.4].
- **Never put gray text on a colored surface.** Derive secondary text from that surface's hue or from the foreground [IMP].
- **Palette bans.** No AI purple/blue gradients [TASTE "LILA RULE"; IMP detector: "purple gradients"]. No gradient text [IMP ban, TASTE 9.A]. No default beige/brass "premium" palette [TASTE 4.2].
- **Shape lock.** Use one corner-radius system for the whole reel [TASTE 4.4 "SHAPE CONSISTENCY LOCK"]: either all 0, all 12-16 (×2.75 → 32-44px on canvas), or pills only for small chips.

---

## 4. Anti-patterns (cheap / "AI slop" signals to avoid)
1. Per-letter Arabic animation of any kind (typewriter, scramble, char stagger, text morph).
2. Tracking on Arabic; synthetic italic Arabic; a second font injected for one emphasized word.
3. `bounce`/`elastic` eases, `ease-in` entrances, `linear` on anything that isn't constant motion, weak default eases.
4. Scale-from-zero pops; huge 150px+ slide distances; whip-pan or whoosh transitions on every cut.
5. The same entrance on every element, or everything moving at once. IMP: "not scattered effects and not one identical entrance on every section". EMIL: "Elements all appear at once → stagger".
6. Constant micro-motion: pulsing dots, floating badges, shimmer, and infinite loops [TASTE 0.D "infinite-loop micro-animations everywhere"].
7. Neon glow, zero-offset colored halos, glassmorphism as decoration, gradient text, AI purple, pure #000 [IMP craft-floor, TASTE 9.A].
8. Eyebrow/kicker labels above titles, section numbers `01/02/03`, "Step 1 / Step 2" labels, decorative status dots, middle-dot strings, em-dashes [IMP: eyebrow is "a ban, not a default"; TASTE 9.F/9.G].
9. The hero-metric template reflex: big number, tiny label, supporting stats, accent [IMP]. Use a big number only when the speaker says a number that matters, and animate it as a count-up with tabular numerals.
10. Emoji or Unicode glyphs as icons, mixed icon stroke weights [IMP], and hand-drawn "sketchy" SVG doodles or `feTurbulence` grain [IMP codex].
11. **Geometric masks approximating the speaker** (circle or blob cutouts of the person) [IMP: "Geometric masks standing in for organic contours... reads worse than omitting it"]. Use a real alpha matte or no cutout.
12. Pills/tags overlaid on the speaker's face or photos [TASTE 9.F]. Graphics must not cover eyes or mouth.
13. Fake UI mockups built from divs, fake-perfect numbers (`99.9%`), and filler hype words (the Arabic equivalents of "elevate/unleash/seamless") [TASTE 9.D/9.E].
14. Text inside the platform UI zones; captions that jump position between beats.
15. "Swipe up / scroll ↓" cue arrows [TASTE: "Scroll cues are banned"]. The end card names one action once [TASTE "NO DUPLICATE CTA INTENT"].

---

## 5. Polish checklist (run on the rendered MP4, frame-stepping at 0.25x [EMIL "Slow motion testing", "Frame-by-frame"])
1. Every animated element can name its purpose: feedback, state, spatial continuity, explanation, emphasis of a spoken word, or one of the ~3 authored moments [EMIL gate]. If it can't, delete the motion.
2. Every ease comes from the §1.1 token table, with no bounce/elastic and no ease-in entrances. Grep the source for `bounce`, `elastic`, `.in"`, and `power1`.
3. Durations fall inside the §1.2 bands, and every exit is shorter than its entrance.
4. No `scale:0` start values. Text travel is ≤60px and blur is ≤12px.
5. Stagger totals ≤400ms, and no Arabic word is ever split below word level. Check the DOM for char spans.
6. Arabic joins render correctly in every frame. This means letter-spacing 0, no clipped tashkeel or descenders in masks, and no reversed word order in mixed Latin/number lines.
7. All text sits inside the safe zone (x 80-940, y 240-1500) in every frame, including mid-animation positions.
8. Contrast holds: ≥4.5:1 for captions on their worst-case background frame, ≥3:1 for big display.
9. One accent color, one font family (≤3 weights), and one radius system across the whole reel.
10. Hierarchy passes the squint test [IMP]: blur a still and the primary element is still obvious, with ≤2 competing elements per frame.
11. Motion is synced to speech. Keyword highlights land within ±2 frames of the spoken word onset. Focal moments sit on a sentence boundary or a hard cut, not mid-word.
12. Signature details are consistent [IMP "Browser surfaces" → video equivalent]:
    - the same shadow recipe everywhere
    - the same caption position
    - the same numeral system
    - the same Arabic punctuation (`،`, `؟`)
13. Rendering is deterministic: rendering the same frame twice gives identical output. Fonts are loaded before frame 0, and no CSS transitions or unseeded randomness remain.
14. First 1.5s hook: one focal entrance, readable while still. Last 2-3s: one clear CTA, held ≥1.5s fully static before the end.
15. Review with fresh eyes on a real phone at 100% brightness, not only on the desktop preview [EMIL "Review your work the next day", "Test on real devices"].

---

## 6. Attributions / direct quotes
**emilkowalski/skills** (`skills/emil-design-eng/SKILL.md`, `skills/review-animations/STANDARDS.md`, `skills/animation-vocabulary/SKILL.md`, `skills/apple-design/SKILL.md`)
- "Strong ease-out for UI interactions: `cubic-bezier(0.23, 1, 0.32, 1)`"; "Strong ease-in-out for on-screen movement: `cubic-bezier(0.77, 0, 0.175, 1)`"; "iOS-like drawer curve: `cubic-bezier(0.32, 0.72, 0, 1)`".
- "Never use ease-in for UI animations. It starts slow, which makes the interface feel sluggish."
- "Never animate from scale(0)... Start from `scale(0.9)` or higher, combined with opacity."
- "Keep stagger delays short (30-80ms between items)."
- "Keep bounce subtle (0.1-0.3) when used. Avoid bounce in most UI contexts."
- "Add bounce (damping ~0.8) only when the gesture itself carried momentum" (apple-design); default spring is "damping 1.0, response 0.3-0.4".
- "Make exit faster than enter"; "slow where the user is deciding, fast where the system is responding."
- "Use blur to mask imperfect transitions... Keep blur under 20px."
- "The more often a user sees an animation, the shorter and subtler it should be." (vocabulary: Frequency of use)
- "Tracking (letter-spacing) is size-specific... tighten large text (-0.02em)" (apple-design). This is Latin only; see §2.3.
- "Play animations in slow motion or frame by frame to spot timing issues."

**pbakaus/impeccable** (`skill/reference/craft-floor.md`, `animate.md`, `quieter.md`, `colorize.md`, `typeset.md`, `layout.md`, `README.md`)
- "Motion: one authored moment, not scattered effects and not one identical entrance on every section. Exponential ease-out from an already-visible default."
- "Reach past transform and opacity: blur, backdrop-filter, clip-path, mask, and shadow belong to the palette."
- Timing table: "100-150 ms immediate feedback / 150-300 ms routine state change / 300-500 ms layout, overlay, or view transition / 500-800 ms a deliberately authored focal entrance."
- "Exit faster than entrance. Use natural deceleration such as `cubic-bezier(0.16, 1, 0.3, 1)`... do not use bounce or elastic curves by reflex."
- "Sibling stagger is appropriate when a list appears as a list. Cap the total delay."
- "Reduce animation intensity: Shorter distances (10-20px instead of 40px)... Use ease-out-quart... Never bounce or elastic." (quieter)
- "Neutral dominance: Let neutrals do more work, use color as accent (10% rule)"; "Never gray on color."
- "A zero-offset colored halo is decoration"; "Gradient text. Emphasis comes from weight or size."
- "A kicker or eyebrow above a heading. This one is a ban, not a default."
- "Geometric masks standing in for organic contours... reads worse than omitting it."
- "Don't use bounce/elastic easing (feels dated)"; "Don't use pure black/gray (always tint)". (README)
- "Quiet design is harder than bold design. Subtlety needs precision." / "Commit, then clarify."

**leonxlnx/taste-skill** (`skills/taste-skill/SKILL.md`, `skills/minimalist-skill/SKILL.md`)
- "Do not default to: AI-purple gradients... generic glassmorphism on everything, infinite-loop micro-animations everywhere, Inter + slate-900."
- "Max 1 accent color. Saturation < 80% by default." / "COLOR CONSISTENCY LOCK... pick one accent, lock it."
- "MOTION_INTENSITY 4-7 (Fluid CSS): `cubic-bezier(0.16, 1, 0.3, 1)`... Focus on transform and opacity."
- "Scroll Entry: `translateY(12px)` + `opacity: 0` resolving over `600ms` with `cubic-bezier(0.16, 1, 0.3, 1)`"; "cascade delay (`calc(var(--index) * 80ms)`)"; ambient blob "`20s+`, `opacity: 0.02-0.04`" (minimalist).
- "EMPHASIS RULE: use italic or bold of the SAME font... Mixed-family emphasis is amateur." For Arabic, use bold/color only.
- "ITALIC DESCENDER CLEARANCE: `leading-none` will clip the descender". This is the analogue of the Arabic tashkeel/mask padding rule.
- "NO neon / outer glows"; "NO pure black"; "NO oversized H1s that just scream. Control hierarchy with weight + color"; "EM-DASH BAN"; "NO decorative colored status dots"; "Scroll cues are banned"; "SHAPE CONSISTENCY LOCK".
- Vocabulary effects that are **unsafe for Arabic**: "Text Scramble Effect", "Kinetic Typography Grid - Letters dodging the cursor". "Text Mask Reveal - Massive type as transparent window to video" is safe if it is done per word or line.
