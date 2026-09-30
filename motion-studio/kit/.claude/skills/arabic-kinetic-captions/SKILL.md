---
name: arabic-kinetic-captions
description: Builds word-synced Arabic karaoke / kinetic captions from a word-level transcript JSON ([{text,start,end}] in seconds) as a HyperFrames caption layer (or Remotion component). Animates by WORD, never by letter, right-to-left. Use for "كابشن", "ترجمة", "karaoke captions", "subtitles", transcript.json, or any caption/subtitle request on Arabic audio.
argument-hint: "[transcript.json] [style: clean|karaoke|punch] [ratio]"
allowed-tools: Read Write Edit Glob Bash(npx hyperframes *)
---

# Arabic Kinetic Captions

Input: $ARGUMENTS. Transcript format: `[{ "text": "كلمة", "start": 1.02, "end": 1.31 }, …]` (seconds). This is what `npx hyperframes transcribe` writes to `transcript.json`. If only audio exists, run `npx hyperframes transcribe <audio> --model large-v3 --language ar` (the default model is English-only).

## 1. Sanity-check the transcript (report before building)
- Count words, total span, words with `end <= start`, gaps > 1.5 s, words longer than 1.2 s.
- Whisper writes Arabic in its own spelling (often MSA-ish, no tashkeel, digits). If the editor gave a script, correct spelling to match the script but keep the timestamps. When you merge or split words, split the time proportionally to character count and list every such change under "Adjusted words". Never silently invent timing.
- Drop pure fillers (إمم، آآ) from display only if the style is "clean"; keep «يعني» and similar unless the editor asked to drop them.

## 2. Group into caption pages
- 2–5 words per page, max 2 lines, ≤ ~24 Arabic characters per line.
- Break a page at: punctuation (، . ؟ !), a gap > 0.35 s, or the word limit. Never end a page on a preposition/particle (في، على، من، و، ب، لـ) — move it to the next page.
- Page shows from `firstWord.start − 0.10 s` to `lastWord.end + 0.15 s`, minimum 0.8 s on screen; pages never overlap in time.
- Write the grouping to `captions.pages.json` so it can be reviewed and reused.

## 3. Render rules (Arabic)
- Each page is a block with `dir="rtl"`; each word is `<span class="w">` (inline-block). Letters are never wrapped individually.
- Karaoke fill (right→left) without breaking letter joins: stack two copies of the same word (base in `--c-ink`, top in `--c-accent`) and reveal the top copy with `clipPath: "inset(0 0 0 100%)" → "inset(0 0 0 0%)"` over the word's `start→end`, `ease: "none"`.
- Style `punch`: active word scales 1 → 1.08 (`power3.out`, 0.08 s) at `start`, settles at `end`. Style `clean`: only color change.
- Latin words / numbers inside a page go in `<bdi>`. Numerals follow `--numerals`.
- Font `--font-body`, size `--fs-caption`, line-height ≥ 1.5, optional pill background `--c-caption-bg` with padding ≥ 0.3em top/bottom so dots aren't clipped.
- Position inside the caption band from `tokens.css` (9:16: y 1180–1460). Caption layer is its own clip on the highest `data-track-index`.

## 4. Timeline (GSAP)
- One entry per page: `fromTo(page, {y: 24, opacity: 0}, {y: 0, opacity: 1, duration: 0.18, ease: "power3.out"}, pageIn)` and an exit `to(page, {opacity: 0, duration: 0.12, ease: "power2.in"}, pageOut)`.
- Word events are placed at absolute transcript times on the same timeline (position parameter = seconds). Sync tolerance: ±1 frame (33 ms at 30 fps).
- Build everything after `document.fonts.ready`; generate DOM from `captions.pages.json` once at init (deterministic). No `Math.random`, no clocks.

## 5. Verify
Run `/qa-gate`, plus: snapshot 3 random pages mid-word (`npx hyperframes snapshot --at t1,t2,t3 --zoom '#captions'`) and check that the highlighted word is the word being spoken at that time in the transcript. Report the three (time, expected word, highlighted word) triples.

## Remotion variant
If the project is Remotion, convert to `@remotion/captions` `Caption` objects (`startMs = start*1000`, `endMs = end*1000`, `timestampMs = null`, `confidence = null`, and a leading space in `text` for every word after the first), then follow the same page/word rules with `useCurrentFrame()` + `interpolate()`; see `/remotion-scene-builder`.
