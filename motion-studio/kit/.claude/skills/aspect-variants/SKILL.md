---
name: aspect-variants
description: Re-lays out an approved video for 9:16, 1:1 and 16:9 (and batch hook variants) and renders each one. Use when the user asks for "نسخ بمقاسات", "9:16 / 1:1 / 16:9", "reformat", "resize for YouTube/Instagram/X", or to render A/B variants from rows.json.
argument-hint: "[slug] [ratios, default 9x16,1x1,16x9]"
allowed-tools: Read Write Edit Glob Bash(npx hyperframes *)
---

# Aspect Variants

Input: $ARGUMENTS. Precondition: the source ratio passed `/qa-gate` AND the editor explicitly approved the draft in this conversation. If not, stop and ask — rendering finals is the expensive step.

## Why separate compositions
A HyperFrames composition has a fixed `data-width`/`data-height`; the renderer does not reshape it. So each ratio is its own root file that shares the scene logic:

```
videos/<slug>/
  scenes.js            # shared: builds the GSAP timeline from a layout object
  index.html           # 9:16  1080×1920  (data-composition-id="main")
  index-1x1.html       # 1:1   1080×1080  (data-composition-id="main-1x1")
  index-16x9.html      # 16:9  1920×1080  (data-composition-id="main-16x9")
```
Each root registers its own timeline key equal to its own `data-composition-id`. Timings are identical across ratios; only layout changes.

## Re-layout rules (don't just scale)
- **9:16 → 1:1:** type ×0.85; stack becomes tighter; captions band moves to y 820–980; margins `--safe-1x1`.
- **9:16 → 16:9:** two-column layouts where a scene has text + visual (text column on the RIGHT for RTL, visual on the left); hero type ×1.1 of the 1080 scale; captions band y 820–980; margins `--safe-16x9`.
- Keep the same words, the same timing, the same hero per scene. If a line wraps badly in a ratio, adjust line breaks (separate `.line` blocks), not the text.
- Re-check that no text leaves its safe zone.

## Render
Run `/qa-gate` logic (lint + check + snapshots at the same key times) for each root, then:
```bash
npx hyperframes render videos/<slug> --composition index.html      --quality delivery --output renders/<slug>-9x16.mp4
npx hyperframes render videos/<slug> --composition index-1x1.html  --quality delivery --output renders/<slug>-1x1.mp4
npx hyperframes render videos/<slug> --composition index-16x9.html --quality delivery --output renders/<slug>-16x9.mp4
```
(Check `npx hyperframes render --help` for whether the project dir is positional in your version.)

## Batch A/B hooks
If `hooks.rows.json` exists (from `/viral-hook-writer`), render one file per row:
```bash
npx hyperframes render videos/<slug> --batch hooks.rows.json --quality delivery
```
Use `--strict-variables` so a typo in a variable id fails instead of silently rendering the default.

## Deliver
List every output path with its ratio, duration and file size, plus one snapshot per ratio of the hero frame, side by side in the report.
