---
name: raw-to-published
description: Orchestrates the full run from raw footage (local or Google Drive) to a published post — ingest, transcript, first-pass cut, storyboard, motion graphics/captions, QA, render + ratios, publish pack — stopping at every human checkpoint. Only runs when the user types /raw-to-published.
argument-hint: "[drive-folder-or-local-path] [slug] [engine: hyperframes|remotion]"
disable-model-invocation: true
---

# Raw → Published (with human checkpoints)

Input: $ARGUMENTS. Keep a checklist in `videos/<slug>/RUN.md` (one line per stage: ⏳/✅/⛔ + evidence path) and update it after every stage, so the run can resume after `/clear` or a new session ("كمّل من RUN.md").

At every **🛑 CHECKPOINT**: show the evidence, ask one clear question in Arabic, and END YOUR TURN. Do not continue until the editor answers in their own message.

## Stage 0 — Ingest
- Local path → copy into `videos/<slug>/raw/`. Google Drive → use the Google Drive connector if it's connected, otherwise `rclone copy "<remote>:<folder>" videos/<slug>/raw --progress` (only if the editor set up rclone). Never delete or move the originals.
- `ffprobe` each file: duration, resolution, fps, audio channels. Write them to `RUN.md`.

## Stage 1 — Transcript + first-pass cut → `/first-pass-edit`
🛑 CHECKPOINT 1: the review table of uncertain cuts. Wait for approve/reject ids. Then apply, and report new duration + join times.

## Stage 2 — Story → `/storyboard-director` (+ `/viral-hook-writer` for the opening)
Base the storyboard on `transcript.cut.json`: which moments get a zoom, a layout switch, a highlight, a data chart, a lower-third, B-roll/graphic, and the hook + end card.
🛑 CHECKPOINT 2: storyboard approval (text, timing, which graphics where).

## Stage 3 — Style frame
Engine = HyperFrames → `/brand-scene-builder <slug> style-frame`; Remotion → `/remotion-scene-builder <slug> style-frame`. If an interactive editing MCP/skill the editor already uses (e.g. their "edit broomi video" skill) is installed, it may be used for zooms and layout switching, following this studio's rules.
🛑 CHECKPOINT 3: one or two stills of the hero moment. Wait for "ok" or notes.

## Stage 4 — Full build + captions
Remaining scenes, zooms, layout switches, charts, then `/arabic-kinetic-captions` from `transcript.cut.json`.
Run `/qa-gate <slug>`; for anything longer than 10 s also get the `motion-critic` subagent's review. Fix must-fix items. Render a draft: `--quality draft`.
🛑 CHECKPOINT 4: draft MP4 path + QA report + critic summary. Wait for notes; loop fixes (max 2 rounds per note, then ask whether to simplify).

## Stage 5 — Final + ratios → `/aspect-variants <slug>`
Render delivery quality for the requested ratios (and A/B hook rows if any).
🛑 CHECKPOINT 5: final file list with durations/sizes + one hero still per ratio.

## Stage 6 — Publish → `/publish-pack <slug> …`
The editor must type `/publish-pack` themselves (it can't be auto-invoked). Publishing happens only after their explicit «انشر».

## Stage 7 — Wrap-up
Summarize what took the most iterations and propose ≤ 3 one-line rules for `CLAUDE.md` (don't edit it without approval). Commit the project with git.
