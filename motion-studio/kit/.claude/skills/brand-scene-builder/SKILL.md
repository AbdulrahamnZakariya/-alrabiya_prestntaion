---
name: brand-scene-builder
description: Builds HyperFrames + GSAP scenes from an approved storyboard.md using the studio brand tokens (brand/tokens.css, brand/motion.js), Arabic RTL rules and safe zones. Starts with one style frame, then the rest. Use when the user says "ابنِ المشهد", "build the scene", "نفّذ الستوريبورد", asks for a hook scene, logo reveal, data/stat scene, quote, lower-third, or any on-brand motion scene.
argument-hint: "[slug] [scene numbers or 'all' or 'style-frame']"
allowed-tools: Read Write Edit Glob Grep Bash(npx hyperframes *)
---

# Brand Scene Builder

Input: $ARGUMENTS. Precondition: `videos/<slug>/storyboard.md` exists and the editor approved it. If not, stop and run `/storyboard-director` first.

## Before writing code
1. Read the storyboard, `brand/tokens.css`, `brand/motion.js`. If the official `/hyperframes-core` and `/hyperframes-animation` skills are available, load them for the composition contract and motion rules.
2. Check the catalog before hand-authoring: `npx hyperframes catalog --query "<scene idea>"`. Reuse a block if it fits and restyle it with our tokens.
3. Make sure `videos/<slug>/brand/` exists (copy of `brand/`) so fonts load locally.

## Build order
1. **Style frame:** build ONLY the storyboard's hero scene (usually the hook). Snapshot at its signature time and show it. Wait for "ok" before building other scenes.
2. **Remaining scenes:** one `<section class="clip">` per scene (or one sub-composition per scene in `compositions/` when the video is > 5 scenes), timings copied exactly from the storyboard.
3. **Transitions** last, at the scene seams (0.3–0.4 s).

## Skeleton (standalone composition)

```html
<!doctype html>
<html lang="ar">  <!-- no dir on <html>: HyperFrames lint html_dir_attribute_breaks_render; dir="rtl" goes on #stage -->
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="brand/tokens.css">
  <style>
    #stage { width: 100%; height: 100%; background: var(--c-bg); color: var(--c-ink); overflow: hidden; }
    .scene { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center;
             padding: var(--safe-9x16-top) var(--safe-9x16-side) var(--safe-9x16-bottom); }
    .h1 { font-family: var(--font-display); font-weight: 900; font-size: var(--fs-h1); line-height: var(--lh-h1); text-align: center; }
  </style>
</head>
<body>
  <div id="stage" data-composition-id="main" data-width="1080" data-height="1920" data-duration="18" dir="rtl">
    <section id="s1" class="clip scene" data-start="0" data-duration="2.4" data-track-index="0">
      <div class="mask"><h1 id="s1-h1" class="h1 line">«النص العربي من الستوريبورد»</h1></div>
    </section>
    <!-- more scenes… -->
  </div>
  <!-- keep the GSAP <script> exactly as the `npx hyperframes init` template includes it -->
  <script src="brand/motion.js"></script>
  <script>
    document.fonts.ready.then(() => {
      const M = window.BRAND_MOTION;
      const tl = gsap.timeline({ paused: true });
      const words = wordsToSpans(document.querySelector("#s1-h1"));        // words, never letters
      tl.fromTo(words, { x: M.enterX, opacity: 0 },                          // RTL: enter from the right
                       { x: 0, opacity: 1, duration: M.dur.base, ease: M.ease.in, stagger: M.stagger.kineticWord }, 0);
      tl.to("#s1-h1", { clipPath: "inset(0 100% 0 0)", duration: M.dur.exit, ease: M.ease.out }, 2.4 - M.dur.exit);
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;                                       // key == data-composition-id
    });
  </script>
</body>
</html>
```

## Scene recipes (pick, then adapt)
- **Hook:** background + visual present at f0; punch word `scale 0.6→1, expo.out, 0.5s` at f3–f6; supporting words stagger by word from right.
- **Stat / count-up:** number in `--font-display` `.num`, tween a proxy object `{v:0}` and write `fmtNum(v)` in `onUpdate`; label fades up 0.2 s after; hold ≥ 1.2 s on the final number.
- **Bar chart:** bars `scaleY 0→1` with `transformOrigin: "bottom"`, `stagger: 0.12`, `power3.out`; values count up in sync; in RTL the first category is on the right.
- **Quote (neutral, attributed):** `--font-quote`, line by line mask reveal from right, attribution in `--font-body` `--c-ink-dim` 0.4 s later. No sacred text.
- **Logo reveal:** use `brand/logo.svg`; mask/scale-in with `power4.out`, a single accent sweep, hold ≥ 1.5 s. Don't distort the logo's aspect ratio or recolor it outside the brand palette.
- **Lower-third:** bar wipes from the right (`scaleX 0→1`, `transformOrigin: "right"`), name then title stagger 0.15 s, inside safe zone.

## Hard rules (from CLAUDE.md, repeated because they break most often)
- Tokens only (no raw hex / px font sizes). Arabic by word/line only. `fromTo` with explicit start states. Transforms + opacity + clipPath only. No clocks / unseeded random / network / `repeat: -1`. No `<br>`.
- Every scene's text must fit its safe zone at the storyboard's font size; if it doesn't, shorten the text in the storyboard (ask), don't shrink below `--fs-body`.

## After building
Run `npx hyperframes lint`, fix errors, then run `/qa-gate`. Show snapshot paths for the storyboard's key times.
