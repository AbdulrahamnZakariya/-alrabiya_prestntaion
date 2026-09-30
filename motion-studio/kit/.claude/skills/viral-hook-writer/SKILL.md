---
name: viral-hook-writer
description: Writes and stages Arabic (Levantine or MSA) opening hooks for short social videos — the first 1.5–3 seconds — and produces A/B hook variants as HyperFrames variables. Use when the user asks for a hook, an opening, "أول 3 ثواني", "هوك", "نسخ A/B", or wants to test several openings.
argument-hint: "[topic or script path] [count, default 5] [dialect: levantine|msa]"
allowed-tools: Read Write Glob
---

# Viral Hook Writer

Goal: stop the scroll in the first second without lying. Input: $ARGUMENTS.

## Step 1 — understand the payoff
Read the script/storyboard. Write one sentence: "The viewer who stays will get ___." Every hook must be honestly paid off by the video. No clickbait the video doesn't deliver.

## Step 2 — write hooks with different mechanisms
Write the requested number of hooks (default 5), each using a DIFFERENT mechanism so the A/B test actually tests something:

| Mechanism | Levantine example shape |
|---|---|
| Surprising number | «٩ من كل ١٠ …» / «90% ما بيعرفوا …» |
| Contradiction | «كل شي تعلّمته عن … غلط» |
| Direct question | «ليش … ؟» |
| Pain / relatable | «إذا بتعاني من … شوف هاد» |
| Open loop | «آخر نقطة هي اللي غيّرت كل شي» |
| Before/after | «من … لـ … بـ ٣ خطوات» |

Constraints per hook:
- ≤ 7 words on screen (≤ 32 characters), readable in under 1.2 s. Voice-over line may be longer.
- One word is the "punch word" (gets the accent color / scale hit). Mark it with `*…*`.
- Dialect as requested; default Levantine for social. Consistent spelling (هيك، شو، بدّك، منيح، هلّق).
- No sacred text, no invented statistics: if a number isn't in the source, write `[رقم؟]` and flag it.

## Step 3 — stage each hook (motion, not just words)
For each hook give: the visual on frame 0, the punch moment (time + frame), and the motion (e.g. "punch word scales 0.6→1 with expo.out at f6, others fade-up by word, stagger 0.12s from right").

## Step 4 — output
1. A table: `id | mechanism | on-screen text | voice-over | punch word | staging`.
2. A `hooks.rows.json` in the project for batch rendering, one row per hook. Use the composition's declared variable ids (default `hook_text`, `punch_word`, `accent`) and include an `id`/name key if the project's render template needs it for the output filename; check `npx hyperframes render --help` for the exact batch row shape before writing it.
3. Recommend which 2 to test first and why (one sentence each).

The hook scene itself is built with `/brand-scene-builder`; the variables are declared on the composition root via `data-composition-variables` and read once with `window.__hyperframes.getVariables()`.
