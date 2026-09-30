# Director's brief — Arabic talking-head reel, two versions

You are a senior motion designer / editor (20 years: After Effects, Premiere, DaVinci, CapCut). The client wants the result to be "نار" — premium, dense with meaningful motion graphics, zero amateur look, zero "AI slop". The client will NOT answer questions: make every decision yourself.

## Source (already prepared — do not redo)
- Speaker: young man, light-blue shirt, outdoor garden background, selfie framing, lots of hand gestures, head in upper-middle of frame.
- Original was 464x848 — upscaled to 1080x1920. It is slightly soft: never zoom the camera more than 1.18x.
- Silences already removed. Cut timeline duration 38.28s of speech, then 2.7s of frozen last frame for the end card. **Composition duration = 40.9667s (1229 frames @30fps).**
- Jump cuts (hard cuts inside the footage) happen at: 4.54, 7.07, 10.05, 12.38, 17.46, 21.36, 30.03, 30.96, 33.0 s. Hide each with a camera "punch" (alternate scale 1.00 ↔ 1.08–1.14, cut instantly on the exact frame, maybe with a 2-frame flash or whip on the big ones), exactly like a pro editor would.
- Files in your project (`assets/media/`):
  - `base.mp4` — graded footage for your version, 1080x1920, 40.97s.
  - `person.webm` — VP9 alpha cutout of the speaker (same timing as base). RIGHT NOW it is a fully transparent placeholder; the real cutout is dropped in at the same path later (don't wait for it; build as if it works). Use it for text-behind-person.
- `caps.json` in your project: `sentences[]` (text, s, e) and `words[]` (w, s, e, sent) on the cut timeline. Word timings are estimated within each sentence (sentence boundaries are accurate ±0.05s, word boundaries ±0.15s) — so sync big graphic hits to **sentence starts** or to words you estimate; keep karaoke highlight transitions soft (not a hard flash) so small offsets don't show.
- `person_track.json` (appears later at `/tmp/claude-0/-home-user--alrabiya-prestntaion/86361e0e-fe06-547a-bf25-0b60d960019a/scratchpad/edit/person_track.json`): per frame {f, top (head top y), head_x0, head_x1, cx, body_x0, body_x1} in 1080x1920 coords. Head is roughly x 300–780, top ≈ 120–260, face center y ≈ 480–560. You can use a static approximation if the file isn't there yet.

## Transcript (Levantine Arabic) with cut-timeline times
| # | s–e | text | meaning / beat |
|---|---|---|---|
| 0 | 0.06–1.81 | طفرة في عالم التصميم | HOOK: "A breakthrough in the design world" |
| 1 | 2.04–4.44 | المصممين رح يزعلوا علينا بعد هذا الفيديو | "Designers will be upset with us after this video" |
| 2 | 4.60–5.11 | طبعاً | "Of course" |
| 3 | 5.28–6.97 | للتأكيد وللمعلومية | "To confirm, for your information" |
| 4 | 7.13–9.95 | إنو الذكاء الاصطناعي فعلياً بيعملك مونتاج الفيديوهات | "AI actually edits your videos for you" |
| 5 | 10.11–12.28 | بس كل ما كان إنت عندك حس بصري | "But the more visual sense you have" |
| 6 | 12.44–15.83 | وعندك أشياء في بالك بتقدر تدخلها داخل الفيديو | "and ideas in your head you can put into the video" |
| 7 | 15.96–17.36 | كل ما كانت النتيجة أفضل | "the better the result" |
| 8 | 17.52–18.57 | فالذكاء الاصطناعي | "So AI…" |
| 9 | 18.83–19.91 | كل ما كلّمته أكتر | "the more you talk to it" |
| 10 | 20.04–21.26 | كل ما أعطاك نتائج أفضل | "the better results it gives you" |
| 11 | 21.42–25.93 | فهل فعلاً اللي بيستخدم الذكاء الاصطناعي باحترافية وبيضيف الإضافات الصح | "So is someone who uses AI professionally and adds the right touches…" |
| 12 | 26.03–28.04 | داخل الفيديو داخل الماكينة | "inside the video, inside the machine" |
| 13 | 28.27–29.93 | نفس اللي بيستخدم استخدام عادي؟ | "…the same as someone who uses it normally?" |
| 14 | 30.09–30.86 | أكيد لا | "Definitely not" — PUNCH moment |
| 15 | 31.02–31.69 | فبشرى | "So, good news…" |
| 16 | 31.88–32.90 | للمصممين | "…for designers" |
| 17 | 33.06–36.74 | إنه إنت رح هاي الأداة تكون مساعد إلك | "this tool will be your assistant" |
| 18 | 36.90–38.18 | وليس تحل محلك | "and not replace you" |
| — | 38.3–40.97 | (end card on frozen frame) | logo + CTA |

## Must-haves (client's explicit asks)
1. **Opening: words moving AROUND the person** — at the start, a set of words orbit/fly around him, passing BEHIND his head/body and IN FRONT of him (depth). Technique: base video (z1) → "behind" text layer (z2) → `person.webm` cutout wrapper (z3) → "front" layer (z4). For a word that orbits, keep two copies (one in behind layer, one in front layer) and swap visibility with `tl.set()` at the orbit crossing times (tl.set is seek-safe; never use tl.call / onUpdate for visibility). Words to use: from sentence 0 and the theme (طفرة · التصميم · مونتاج · الذكاء الاصطناعي · موشن · مونتير …). The hook must be readable on frame 0 (no fade from black, no empty first frame).
2. Motion graphics, icons, clippings (قصاصات), logos, highlights, transitions, sound effects, color — at the highest level. Every graphic is a **visual metaphor for what he is saying at that moment** — not decoration.
3. Brand/logo **«تقني واعي»** ("Aware Techie"): design a wordmark + small mark in your version's style (SVG/HTML, not an image). Show it: a small persistent badge (top area, inside safe zone) and a proper logo reveal on the end card.
4. Text-behind-person at most 2 times in the whole video (hook + one peak, e.g. «بشرى» or «أكيد لا»). More kills the effect.
5. Arabic karaoke captions (word-by-word highlight), 2–5 words per page, in the lower-middle band (y ≈ 1180–1460). Hide the caption when a big graphic already shows the same words.

## Available assets (already in your `assets/`)
- `assets/icons/ui/*.svg` — Lucide line icons (stroke=currentColor): sparkles, brain, bot, cpu, wand-sparkles, film, clapperboard, scissors, video, play, layers, pen-tool, palette, eye, lightbulb, message-circle, messages-square, trending-up, zap, check, x, crown, shield-check, user, users, handshake, rocket, award, target, sliders-horizontal, mouse-pointer-click, chart-gantt, git-merge, triangle-alert, frown, smile, heart. Inline them into HTML (so you can recolor/animate strokes with DrawSVG).
- `assets/icons/brands/*.svg` + `brands.json` — Premiere Pro, After Effects, Photoshop, DaVinci Resolve, Claude, Anthropic, OpenAI, Google Gemini, Figma, YouTube, Instagram, TikTok (no CapCut). Brand marks: use at small size, in original brand colors or monochrome, only where the speech is about editing tools/AI.
- `assets/fonts/<family>/` + `assets/fonts/fonts.css` — Alexandria, IBM Plex Sans Arabic, Cairo, Tajawal, Readex Pro, Reem Kufi, Lalezar, Rubik (Arabic+Latin subsets), Space Grotesk & IBM Plex Mono (Latin). Declare every face you use with local @font-face.
- `assets/vendor/` — gsap.min.js 3.15, CustomEase, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, SplitText (words/lines only for Arabic!).
- SFX library at `/tmp/claude-0/-home-user--alrabiya-prestntaion/86361e0e-fe06-547a-bf25-0b60d960019a/scratchpad/edit/assets/sfx/` (see its README.md): whoosh_short_a/b, whoosh_long, swoosh_down, riser_2s/4s, impact_hit_a/b, sub_drop, click_ui_a/b, pop_a/b, typing_burst, glitch_a/b, ding_success, shimmer_sparkle, camera_shutter, tape_stop, data_blips, bed_tech.wav, bed_cinematic.wav. **Do not put audio in the composition.** Instead write `sfx.json` in your project root:
  `{"bed":"bed_tech.wav","bed_db":-25,"cues":[{"t":0.0,"file":"impact_hit_a.wav","db":-8}, ...]}` — cue times in seconds on the composition timeline; tie every cue to a visual event; ≤ 15 cues per minute is a guide, not a law (this is a hype reel: up to ~20 total is OK if each is meaningful); keep SFX under the voice (typically -10 to -16 dB relative).
- Design principles brief: `/tmp/claude-0/-home-user--alrabiya-prestntaion/86361e0e-fe06-547a-bf25-0b60d960019a/scratchpad/edit/brief/design-skills.md` — READ IT FIRST and follow it (eases, durations, anti-slop list, polish checklist).

## HyperFrames rules (verified in this sandbox)
- Env for every CLI call: `export HYPERFRAMES_BROWSER_PATH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell HYPERFRAMES_SKIP_SKILLS=1`; CLI = `../node_modules/.bin/hyperframes` from inside your project dir.
- Docs: `../node_modules/hyperframes/dist/skills/hyperframes/` (SKILL.md + references) — skim the composition contract & captions/motion-graphics references.
- Root: `<div id="root" data-composition-id="main" data-width="1080" data-height="1920" data-duration="40.9667" data-fps="30">`. One `gsap.timeline({paused:true})` registered as `window.__timelines["main"]`, built after `document.fonts.ready`? (If you build async, make sure the timeline is registered synchronously and populated before the runtime reads it — follow the docs; the simplest safe path is building synchronously and letting fonts be `font-display:block`.)
- **Every `<video>` needs a unique `id`** (otherwise it renders frozen), plus `class="clip" data-start="0" data-duration="40.9667" data-media-start="0" data-track-index="N" muted playsinline`. Both videos start at 0 so they stay frame-locked. Put both videos inside the same camera wrapper so camera punches/zooms move them together; animate wrappers, never the video elements' opacity.
- `<html lang="ar">` with NO dir attribute. `direction: rtl` on text elements.
- Never split Arabic into letters. Animate by word/line, or reveal with clip-path/masks from the right. No letter-spacing on Arabic. No italic.
- Determinism: no Math.random (use a seeded PRNG), no Date.now, no repeat:-1, no setTimeout, no CSS animations/transitions — everything on the one paused timeline.
- Safe zones (Instagram/TikTok UI): keep text inside x 90–930 (keep right edge clear of x > 900 between y 1100–1750 — like/comment buttons), y 180–1500. Nothing important below y 1500.
- Draft render: `../node_modules/.bin/hyperframes render -o renders/draft.mp4 --quality draft` (~5 min for full length on this machine; 4 CPU cores are SHARED with another designer — render only when needed). Snapshots: `../node_modules/.bin/hyperframes snapshot --at 0.3,1.2,3.0,...` then build ONE contact sheet with ffmpeg (tile) and look at it — don't read 20 separate PNGs.
- Final render (when you are satisfied): `../node_modules/.bin/hyperframes render -o renders/final.mp4 --quality delivery` (mute; audio is mixed separately).

## Process
1. Read design-skills.md. Write a 1-page style frame plan in `plan.md` (palette tokens, fonts, logo concept, per-sentence scene idea + SFX).
2. Build the hook (0–4.5s) first, snapshot at 0.0, 0.4, 1.0, 1.6, 3.0 → contact sheet → critique like a picky creative director → fix.
3. Build the rest scene by scene. Keep the speaker's FACE clear of graphics most of the time (graphics live around him, in the top band y 180–420 above the head only if head top allows, sides, and the lower band). When a scene needs big space (comparison in sentence 11–13), shrink the video into a card (animate the camera wrapper scale/position/border-radius — the person layer moves with it) and use the freed space; bring it back after.
4. Snapshot contact sheets for ≥ 16 moments over the full timeline; fix every issue: overlap with face, clipped Arabic dots, text in unsafe zones, unreadable contrast, stale frames, anything that looks template-y.
5. Draft render → view a contact sheet from the MP4 at 1 fps → fix → final render (`renders/final.mp4`) + `sfx.json`.
6. Write `NOTES.md`: what you built per beat, fonts/colors, and known issues.
Time budget: ~55 minutes. Quality over quantity, but the video must feel continuously alive (something meaningful moves at least every 1.5–2 seconds).
