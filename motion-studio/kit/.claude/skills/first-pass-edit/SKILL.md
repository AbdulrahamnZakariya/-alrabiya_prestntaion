---
name: first-pass-edit
description: First-pass cut of raw talking footage from a word-level transcript — removes silences, fillers, retakes and self-corrections into an evidence-based EDL JSON (every cut cites word indices and timestamps), gets the editor's approval on uncertain cuts, then renders the cut and a re-timed transcript. Use for "شيل السكتات", "قص الأخطاء", "first pass", "silence removal", "retakes", "EDL", raw footage, or before captions on a talking video.
argument-hint: "[path-to-raw-video] [slug]"
allowed-tools: Read Write Edit Glob Bash(python3 ${CLAUDE_SKILL_DIR}/scripts/edl.py *) Bash(npx hyperframes transcribe *) Bash(ffprobe *)
---

# First-Pass Edit (transcript → EDL → cut)

Input: $ARGUMENTS. Everything happens in `videos/<slug>/edit/`. The rule of this skill: **no guessing**. A cut exists only if the transcript proves it; anything uncertain is proposed, not applied.

## 1. Transcript
- If `transcript.json` (word level, `[{text,start,end}]` seconds) exists, reuse it.
- Otherwise: `npx hyperframes transcribe <raw.mp4> --model large-v3 --language ar --dir videos/<slug>/edit` (the default model is English-only; Arabic needs `large-v3` + `--language ar`).
- Sanity report: word count, duration, % of time with speech, words with zero/negative length, the 5 longest gaps. If the transcript looks wrong (long stretches of repeated words, wrong language), STOP and tell the editor; don't cut from a bad transcript.

## 2. Propose cuts (deterministic script)
```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/edl.py propose videos/<slug>/edit/transcript.json --source <raw.mp4> > videos/<slug>/edit/edl.json
```
The script writes cuts of 4 types, each with `evidence`:
| type | detection | default status |
|---|---|---|
| silence | gap ≥ 0.45 s between words (keeps 0.08 s pad each side), lead-in, tail | `auto` |
| filler | hard fillers (إمم، آآ، um…) → `auto`; soft fillers (يعني، هيك) only when isolated by pauses | `review` |
| retake | a 3–5 word phrase repeated within 15 s → earlier attempt is the candidate; keeps the later take | `review` |
| mistake | explicit restart cues (لا لا، خلّيني أعيد، من الأول، عفواً) → back to the previous pause | `review` |

Tune with `--min-silence 0.35` (punchier) or `0.6` (calmer). Don't hand-edit timestamps; change parameters or statuses.

## 3. Review with the editor (checkpoint)
Show one table of every `review` cut: `id | type | time | words (Arabic, with 3 words of context each side) | evidence`. Ask the editor to reply with ids to approve/reject, e.g. «وافق c002 c007، ارفض c005». Update only the `status` fields (`approved` / `rejected`). Never approve on the editor's behalf.

## 4. Apply + re-time
```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/edl.py apply  videos/<slug>/edit/edl.json videos/<slug>/edit/cut.mp4
python3 ${CLAUDE_SKILL_DIR}/scripts/edl.py retime videos/<slug>/edit/edl.json videos/<slug>/edit/transcript.json > videos/<slug>/edit/transcript.cut.json
```
`transcript.cut.json` is what captions and motion graphics must use from now on (old timestamps no longer match the cut video).

## 5. Report
Original vs new duration, counts by type/status, the list of applied cut ids, and the cut-point times in the NEW video (so the editor can scrub straight to each join and listen). Flag any join where a word was clipped (word `end` within 0.03 s of a cut).

## Notes
- Multiple cameras / separate audio: cut from the audio master's transcript and apply the same EDL to every angle (same `keep` segments).
- Zoom/emphasis, B-roll and layout changes come later, in the motion stage (`/brand-scene-builder` or `/remotion-scene-builder`), anchored to `transcript.cut.json` times.
