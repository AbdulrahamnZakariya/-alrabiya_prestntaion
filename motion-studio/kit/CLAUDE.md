# Arabic Motion Studio — HyperFrames + GSAP 3

<!--
ملاحظة للمحرّر (هاد التعليق بينشال تلقائياً قبل ما يوصل لـ Claude، فما بياكل tokens):
- هاد الملف بيتقرا ببداية كل جلسة. خلّيه قصير (< 200 سطر). أي إجراء طويل حطّه بـ skill.
- كل ما Claude يغلط نفس الغلطة مرتين، زيد سطر هون.
- عدّل قسم Brand حسب هويتك، والقيم التفصيلية بتضل بـ brand/tokens.css و brand/motion.js.
-->

We produce short Arabic (Levantine/MSA) motion-graphics videos for social media.
Every video is a HyperFrames project: HTML + CSS + one paused GSAP 3 timeline, rendered to MP4.
The editor is a motion designer, not a developer: explain choices in plain Arabic, keep code tidy.

## Layout
- `brand/` — source of truth: `tokens.css` (colors, type, spacing, safe zones), `motion.js` (eases, durations, staggers), `fonts/` (local .woff2 only), `logo.svg`.
- `videos/<slug>/` — one HyperFrames project per video (`npx hyperframes init videos/<slug>`), then copy `brand/` into it so fonts load locally.
- Inside a project: `brief.md` → `storyboard.md` → `index.html` (+ `compositions/*.html`) → `snapshots/` → `renders/`.
- `.claude/skills/` holds our workflows: `/raw-to-published` (full run), `/first-pass-edit`, `/storyboard-director`, `/viral-hook-writer`, `/brand-scene-builder`, `/remotion-scene-builder`, `/arabic-kinetic-captions`, `/qa-gate`, `/aspect-variants`, `/publish-pack`. Subagents: `motion-critic`, `script-writer`, `arabic-type-reviewer`.
- Talking-head projects also have `videos/<slug>/raw/` (originals, never modified), `edit/` (transcript.json, edl.json, cut.mp4, transcript.cut.json) and `publish/`.
- If the official HyperFrames skills are installed (`/hyperframes`, `/hyperframes-core`, `/hyperframes-animation`, `/hyperframes-cli`), consult them for framework details; this file only adds studio rules on top.

## Commands
- Preview: `npx hyperframes preview` (live reload) · Timeline: `npx hyperframes timeline --json`
- Lint: `npx hyperframes lint` · Browser gate: `npx hyperframes check --snapshots --at-transitions`
- Stills: `npx hyperframes snapshot --at 0.3,1.5,3.0` (PNGs in `snapshots/`; crop with `--zoom '#selector'`)
- Draft render: `npx hyperframes render --quality draft --output renders/draft.mp4`
- Final render (only after the editor approves): `npx hyperframes render --quality delivery --output renders/<slug>-<ratio>.mp4`
- Variants: `--variables '{"hook":"..."}'` or `--batch rows.json`. Transcribe Arabic: `npx hyperframes transcribe audio.wav --model large-v3 --language ar`

## Engine choice
- HyperFrames (HTML + GSAP): pure motion graphics — hooks, kinetic type, stats/charts, logo stings, quote cards. Default.
- Remotion (React 19): footage-driven edits — cut talking-head + zooms, layout switches, overlays, data-driven charts. Frame-driven only (`useCurrentFrame` + `interpolate`/`spring`); CSS transitions/animations are forbidden there.
- One engine per video. Need both? Render one as a clip and import it into the other.
- After any cut, all timing comes from `edit/transcript.cut.json`, never from the raw transcript.

## Workflow (never skip a gate)
1. Storyboard first. No HTML before the editor approves `storyboard.md` (scenes, exact on-screen Arabic text, seconds + frames, motion, easing).
2. Build one hero "style frame" scene, snapshot it, get approval, then build the rest.
3. Run `/qa-gate` before showing any draft. Show evidence (snapshot paths, check output), not claims.
4. Render final only on explicit approval. After delivery, propose 1–3 lines to add here if we learned something.

## Composition contract (HyperFrames)
- Root: `data-composition-id`, `data-width`, `data-height`, `data-duration`; timed elements are `class="clip"` with `data-start`, `data-duration`, `data-track-index`.
- Exactly one `gsap.timeline({ paused: true })` per composition, registered as `window.__timelines["<composition-id>"]` (key must equal the root id).
- Build the timeline after `document.fonts.ready` resolves, so Arabic metrics are final before any measuring.
- Use `fromTo()` (explicit start state) rather than `from()`. Use `stagger` rather than hand-offset tweens.
- Animate transforms and opacity only (`x`, `y`, `scale`, `rotation`, `opacity`, `clipPath`, filters). Never tween `display`, `visibility`, `autoAlpha`, `width`, `height`, `top`, `left` on `.clip` elements; animate a child wrapper instead.
- Never pair a CSS `transform` with a GSAP tween on the same property; center with flexbox/inset, not `translate(-50%,-50%)`.
- No `<br>` in text. Each line is its own block element.

## Determinism (renders must be frame-identical every time)
- IMPORTANT: no `Date.now()`, `performance.now()`, `new Date()`, unseeded `Math.random()`, network requests, or `repeat: -1`. The renderer seeks the timeline frame by frame; anything clock-based or random will flicker or differ between renders.
- Need randomness (particles, jitter)? Use the seeded `rng(seed)` helper from `brand/motion.js`.
- Fonts, images, audio: local files only, declared with `@font-face` pointing to `brand/fonts/*.woff2`. No Google Fonts `<link>`, no fetch/XHR. Load GSAP exactly the way the `npx hyperframes init` template does; add no other remote scripts.
- Loops: use a finite `repeat` computed from the scene duration.

## Arabic & RTL rules (the most common failure — read twice)
- `<html lang="ar">` WITHOUT `dir` — HyperFrames lint flags `html_dir_attribute_breaks_render` (can render a blank video). Put `direction: rtl` (or `dir="rtl"`) on the text elements / scene wrappers instead.
- IMPORTANT: never split Arabic into letters. Arabic letters join; per-character spans break the joining forms, ligatures (لا) and diacritics, and the word renders as disconnected letters. Animate by word (or line). With SplitText use `type: "words"` or `"lines"` only — never `"chars"`. Never `text.split("")`, `Array.from(text)`, or per-letter loops on Arabic.
- Want a "letter-by-letter" feel? Use a right-to-left `clipPath` wipe, mask, blur-in, or gradient sweep on the whole word.
- Reading order is right→left: stagger in DOM (logical) order, entrances travel from the right (`x: +40 → 0`) or from below, wipes open from the right edge: `clipPath: "inset(0 0 0 100%)" → "inset(0 0 0 0%)"`.
- Never add `letter-spacing` to Arabic, never `font-style: italic`, no `text-justify: kashida`.
- Wrap Latin words, @handles, URLs and numbers inside Arabic sentences in `<bdi>` (or `<span dir="ltr">`) so punctuation doesn't jump. Use Arabic punctuation: ، ؛ ؟
- Numerals: follow `--numerals` in `tokens.css` (`latn` = 123 or `arab` = ١٢٣) consistently in one video. Count-ups: `Intl.NumberFormat("ar-u-nu-<latn|arab>")`, `font-variant-numeric: tabular-nums`, fixed-width box.
- Line-height ≥ 1.5 for body/captions (dots and tashkeel need room), ≥ 1.2 for display. Masks with `overflow: hidden` need vertical padding (≥ 0.25em) so ي ع ج descenders and dots aren't clipped.
- Max 2 lines per text block; captions 2–5 words per line; balance lines (`text-wrap: balance`).
- Content: no Quranic verses, hadith or other sacred text as kinetic typography. Quotes must be neutral and attributed exactly as the editor supplied; never invent a quote or attribute one to a real person.

## Brand (details in `brand/tokens.css`, `brand/motion.js`)
- Use CSS variables only (`var(--c-accent)`), never raw hex in compositions. One dominant background, one accent per scene.
- Fonts: `--font-display` for hooks/numbers, `--font-body` for captions, `--font-quote` only for quotes.
- House easing: entrances `power3.out`, exits `power2.in` (≈ 0.6× entrance duration), moves `power2.inOut`, punch `expo.out`. `back`/`elastic`/`bounce` only when the brief says "playful".
- Durations: UI 0.35s · standard 0.6s · hero 0.9s · transitions 0.3–0.4s. Word stagger 0.08–0.15s (captions), 0.15–0.3s (kinetic type).

## Timing & hierarchy
- 30 fps. Always state times in seconds AND frames (e.g. `1.20s / f36`).
- First frame (f0) must already show the hook — no fade from black, no empty frame. Hook fully readable by 0.5s.
- Hold text long enough to read: `hold ≥ max(1.5s, 0.6s + words / 2)` (Arabic reads ~138 wpm, slower than English). Never ask for more than 2 words/second on screen.
- One idea per scene; one hero element per frame (H1), max one supporting line (H2).
- After ~8s of dense motion, give a 0.5–1s calm beat. Hold the logo/CTA end card ≥ 1.5s.
- The timeline must cover `data-duration` exactly; no black or frozen frames at the end.

## Safe zones (Arabic app UIs can mirror, so protect both sides)
- 9:16 1080×1920: keep text/logos inside x 120–960, y 250–1500. Captions band y 1180–1460. Nothing important in the bottom 420px.
- 1:1 1080×1080: 80px margin. 16:9 1920×1080: 96px margin; captions band y 820–980.
- Values live in `tokens.css` as `--safe-*`; position with them, never eyeball.

## QA definition of done
- `lint` and `check` pass with zero errors; snapshots at the storyboard key times are reviewed (open the PNGs and look).
- Checklist: Arabic joined correctly · no clipped dots/descenders · RTL order · inside safe zones · contrast passes · text on screen long enough · easing matches house style · ends cleanly.
- Report as: what changed, evidence paths, open issues. Don't say "done" without snapshots.

## Publishing (hard rule)
- Never publish, schedule or upload to any social account (Blotato MCP or otherwise) unless the editor typed «انشر» / "publish" for the exact package in `publish/plan.json` in this conversation. A hook also asks before every Blotato call; never work around it.
- Never delete or overwrite files in `raw/` or on Google Drive.

## Iteration etiquette
- When the editor sends a screenshot with notes, restate each note as a numbered fix with the element id and timecode, fix only those, re-snapshot the same timecodes, and show before/after paths.
- Change the minimum; don't restyle scenes that weren't mentioned.
- Commit with git at each approved checkpoint (`storyboard ok`, `style frame ok`, `draft ok`, `final`).
