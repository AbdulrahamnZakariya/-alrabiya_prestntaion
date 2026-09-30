---
name: qa-gate
description: Quality gate for a HyperFrames (or Remotion) motion video before any draft is shown or any render is made — lint, browser check, snapshots at storyboard key times, visual review of every snapshot against an Arabic/RTL/brand/safe-zone checklist, and an evidence report. Use after building or editing scenes, before "render", or when the user asks "راجع", "QA", "check", "جاهز؟".
argument-hint: "[slug]"
allowed-tools: Read Glob Grep Bash(npx hyperframes *) Bash(npx remotion *)
---

# QA Gate

Project: `videos/$ARGUMENTS/`. The gate passes only when every step below is green. Report evidence, not opinions.

## 1. Static checks
```bash
npx hyperframes lint videos/<slug> --json
```
Fix every error. Then grep the composition files for studio bans and fix any hit:
`Math.random(` (unless via `rng(`), `Date.now`, `performance.now`, `new Date(`, `repeat: -1`, `"chars"`, `split("")`, `Array.from(` on text, `<br`, `letter-spacing` on Arabic, raw `#hex` colors outside `brand/`.

## 2. Browser gate
```bash
npx hyperframes check videos/<slug> --snapshots --at-transitions
```
Zero errors required (runtime, layout overflow/clipping, contrast). For 9:16 also flag text inside the bottom UI band (confirm the flag syntax with `npx hyperframes check --help`):
`--caption-zone "x0=0;y0=0.78;x1=1;y1=1"`

## 3. Key-frame snapshots
Take the key times listed in `storyboard.md` (always include 0.0 and the last frame):
```bash
npx hyperframes snapshot videos/<slug> --at 0,0.3,<key times…>
```
Zoom on any text block you're unsure about: `--zoom '#s3-h1'`.

## 4. Look at every PNG (use the Read tool on each file) and score this checklist
| # | Check | Pass rule |
|---|---|---|
| 1 | Arabic shaping | every word visibly joined; no isolated letter forms; لا ligature intact |
| 2 | Dots / tashkeel / descenders | nothing clipped by masks or boxes |
| 3 | RTL | reading order right→left; Latin/numbers isolated correctly; punctuation on the correct side |
| 4 | Safe zones | all text/logos inside `--safe-*` for this ratio |
| 5 | Hierarchy | one hero element per frame; H2 clearly smaller |
| 6 | Brand | only token colors/fonts; one accent per scene |
| 7 | Readability | each text block on screen ≥ `0.5 s + words/3` (check timeline JSON) |
| 8 | Frame 0 | not empty/black; hook visible by 0.5 s |
| 9 | Ending | last frame is a clean hold (logo/CTA), no black or half-exited element |
| 10 | Motion taste | eases match house style; no overshoot unless brief says playful |

Timeline data for #7: `npx hyperframes timeline --json`.

## 5. Second opinion
For anything longer than 10 s or any client delivery, ask the `motion-critic` subagent to review the snapshots + storyboard. Treat its "must-fix" items as blocking and its "nice-to-have" items as optional.

## 6. Report (exact format)
```
QA — <slug> — PASS | FAIL
lint: 0 errors · check: 0 errors (N warnings)
Snapshots: snapshots/frame-00-at-0.0s.png, …
Checklist: 1✅ 2✅ 3❌(scene 3: «…» Latin word flipped) …
Fixed in this pass: …
Still open (needs editor decision): …
```

## Remotion projects
Use `npx tsc --noEmit` (if TypeScript) and render stills at the key frames: `npx remotion still <CompositionId> snapshots/f<N>.png --frame=<N>`, then run steps 4–6 the same way.

Never render the final video from this skill. The gate only reports.
