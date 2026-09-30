# SFX library (synthesized) — AI video-editing reels

All files: **48 kHz, stereo, 24-bit WAV**, true-peak normalized to **-3 dBFS**, trimmed, raised-cosine fade-in/out (no edge clicks).
Every one-shot is normalized to the same peak, so set its level with the cue `db` (suggested ranges below; they assume the voice sits at about -14 LUFS).
Transient sounds (impacts, clicks, pops, shutter, blips, glitches) start at their transient: sync the **file start** to the frame.
Whooshes peak at ~55-60 % of the core length (e.g. ~0.24 s into whoosh_short_a): put that peak on the cut. Risers **end** at their peak: place them so the file end lands on the hit.

Regenerate everything (deterministic): `python3 build_sfx.py` (needs numpy, scipy, soundfile; ffmpeg for CC0 imports).

## One-shots

| File | Duration (s) | Character | Suggested use | Cue db |
|---|---|---|---|---|
| `whoosh_short_a.wav` | 0.65 | Pink-noise band-pass sweep 350->2.8k->700 Hz, L->R pan crossing at peak, airy whistle. | Text/element slide-ins, quick transitions. Place peak (~0.24 s in) on the cut. | -8 to -12 |
| `whoosh_short_b.wav` | 0.58 | Brighter, faster whoosh with blade-like flutter, R->L pan. | Snappy transitions, card flips, zoom punches. | -8 to -12 |
| `whoosh_long.wav` | 1.30 | Long doppler-style pass-by with low body, wide pan. | Scene changes, big camera moves, title reveals. | -8 to -12 |
| `swoosh_down.wav` | 0.68 | High->low falling sweep with pitched tail. | Exits, elements dropping/leaving frame. | -8 to -12 |
| `riser_2s.wav` | 1.94 | Noise + 2-octave rising saw stack with accelerating pulse; hard stop at peak. | Short build into a reveal; end of file = hit point. | -8 to -12 |
| `riser_4s.wav` | 3.82 | Longer tension build, same design, wider. | Intro build / pre-drop before a big statement. | -8 to -12 |
| `impact_hit_a.wav` | 2.71 | Tight sub thump + transient click + snap, 2 s hall tail. | Word/number slams, logo hits. | -6 to -10 |
| `impact_hit_b.wav` | 4.59 | Cinematic BOOM: longer sub, dark metallic layer, 3 s tail. | Big reveals, hook moment, final CTA. | -4 to -8 |
| `sub_drop.wav` | 1.35 | 808-style sub glide 130->34 Hz, 1.3 s, saturated for phone speakers. | Under an impact or after a riser; tension release. | -10 to -14 |
| `click_ui_a.wav` | 0.16 | Tiny crisp high tick. | Cursor clicks, toggles, small caption pops. | -12 to -18 |
| `click_ui_b.wav` | 0.21 | Softer woody "tock" click. | Button presses, selections, list items. | -12 to -18 |
| `pop_a.wav` | 0.35 | Round bubble pop (rising pitch). | Icons/emoji appearing. | -10 to -16 |
| `pop_b.wav` | 0.32 | Brighter "bloop" pop with small low thump. | Stickers, badges, bullet points appearing. | -10 to -16 |
| `typing_burst.wav` | 0.64 | ~8 keystrokes, mechanical-keyboard style. | Text typing on screen, prompt-typing into AI. | -12 to -16 |
| `glitch_a.wav` | 0.45 | Random digital stutter/bitcrush/sample-hold bursts. | Glitch transitions, "AI processing" moments, errors. | -10 to -14 |
| `glitch_b.wav` | 0.36 | Tightening buffer-repeat stutter roll + crushed tail. | Glitch-cut into a new scene, data corruption FX. | -10 to -14 |
| `ding_success.wav` | 3.76 | Two-note bright bell chime (C6->G6), plate reverb. | Success, checkmark, "done" moments. | -10 to -14 |
| `shimmer_sparkle.wav` | 3.20 | Pentatonic sparkle grains + air swell + glass pad, big reverb. | "AI magic" moments, reveals of generated results. | -10 to -14 |
| `camera_shutter.wav` | 0.34 | Two-stage DSLR shutter "ka-chk". | Freeze-frames, screenshot/photo moments. | -8 to -12 |
| `tape_stop.wav` | 1.07 | Music (from bed_tech) decelerating to a stop, ~1.1 s. | Dramatic "stop"/record-scratch moment; cut bed at file start. | -8 to -12 |
| `data_blips.wav` | 1.04 | Sequence of soft square-ish beeps with ping-pong echo. | Data/HUD animations, loading, analysis graphics. | -14 to -18 |

Durations include the short reverb tail; the audible core of whoosh_short_a/b is ~0.4 s and of whoosh_long ~0.9 s.

## Background beds (40 s, seamlessly loopable)

| File | Duration (s) | Character | Suggested use |
|---|---|---|---|
| `bed_tech.wav` | 40.00 | 120 BPM, A-minor (Am9-Fmaj7-Cmaj7-G6, 2 bars each). Soft kick on 1&3, filtered pluck arp w/ dotted-8th ping-pong, airy pad, sub, shaker. 2.6 kHz -3.5 dB voice pocket. Seamless loop. Integrated -18.0 LUFS. | Default bed for the energetic/tech edit. Loops every 40 s (20 bars). |
| `bed_cinematic.wav` | 40.00 | D-minor dark drone + evolving pad (slow filter/LFO), noise texture, soft 72 BPM heartbeat, sparse reverb grains. Seamless loop. Integrated -18.0 LUFS. | Serious/dramatic edit, "what does this mean for editors" sections. |

- Rendered circularly (all oscillators complete whole cycles in 40 s; reverb/delay tails are wrapped to the start), so the end flows into the start. The only edge treatment is a 5 ms fade at each end (click-free when dropped raw on a timeline; the 10 ms dip at the loop point is inaudible under speech).
- Both are delivered at **-18 LUFS integrated**. For the brief's "about -26 LUFS under speech" in a -14 LUFS final mix, use `"bed_lu_below_voice": 12` in mix.py (or `bed_db` about -8 relative to the file, if your voice is already near -14 LUFS).
- Both have a gentle -3 dB dip around 2.6 kHz (the speech-intelligibility region) and a 25-28 Hz high-pass.

## CC0 extras (`cc0_uisfx/`)

Ten UI sounds converted from the npm package [`uisfx`](https://www.npmjs.com/package/uisfx) 0.4.0 (code MIT; audio **CC0-1.0**, see `cc0_uisfx/LICENSE-AUDIO`). Same format and normalization as above.

| File | Duration (s) | Source |
|---|---|---|
| `cc0_uisfx/cc0_success_cinematic.wav` | 0.99 | cinematic/success |
| `cc0_uisfx/cc0_level_up_cinematic.wav` | 1.21 | cinematic/level-up |
| `cc0_uisfx/cc0_swipe_cinematic.wav` | 0.55 | cinematic/swipe |
| `cc0_uisfx/cc0_scanning_scifi.wav` | 0.90 | scifi/scanning |
| `cc0_uisfx/cc0_processing_scifi.wav` | 1.35 | scifi/processing |
| `cc0_uisfx/cc0_notification_glass.wav` | 0.73 | glass/notification |
| `cc0_uisfx/cc0_achievement_dreamy.wav` | 1.46 | dreamy/achievement |
| `cc0_uisfx/cc0_toggle_on_minimal.wav` | 0.20 | minimal/toggle-on |
| `cc0_uisfx/cc0_typing_key_mechanical.wav` | 0.05 | mechanical/typing |
| `cc0_uisfx/cc0_select_soft.wav` | 0.35 | soft/select |

## mix.py: voice + ducked bed + cues, then loudness normalization

```bash
python3 mix.py voice.wav cues.json out.wav [--sfx-dir DIR] [--target -14] [--tp -1.5]
```

```json
{
 "bed": "bed_tech.wav", "bed_lu_below_voice": 12,
 "duck_db": 9, "attack_ms": 150, "release_ms": 400, "hold_ms": 200, "lookahead_ms": 60,
 "cues": [ {"t": 1.23, "file": "impact_hit_a.wav", "db": -6}, {"t": 3.1, "file": "whoosh_short_a.wav", "db": -10, "pan": -0.3} ]
}
```

- `bed_db`: plain gain on the bed file. `bed_lu_below_voice`, when set, overrides it and places the bed N LU under the measured voice loudness. `bed_offset` sets the start point in seconds (the bed loops seamlessly). `bed_fade_in` and `bed_fade_out` default to 0.4 s and 1.5 s.
- Ducking: a 20 ms RMS speech gate relative to the voice's own level, with a 200 ms forward hold to bridge word gaps and a 60 ms lookahead so the bed dips just before speech. The gain is smoothed with a 150 ms attack and a 400 ms release and ducks 9 dB by default.
- Cues: `t` is the exact time (s) of the file's first sample, placed at sample accuracy. `db` sets the gain and `pan` (-1..1) is optional.
- Mastering: the mix is gain-staged to the target and passed through a transparent 4x-oversampled look-ahead limiter at TP-0.6. It then goes through **ffmpeg loudnorm two-pass in linear mode** (-14 LUFS, TP -1.5), gets a final ±0.3 dB trim, and is verified with `ebur128`. The output is 48 kHz stereo 24-bit.
- It prints a JSON report covering voice loudness, bed gain, duck depth, limiter gain reduction, loudnorm mode, and the output's I/TP/LRA.

Test (formant-synthesized 36 s voice + bed_tech + 12 cues): **-14.0 LUFS integrated, -1.7 dBTP, LRA 4.5, loudnorm linear**. The bed ducks by a median of -9.0 dB under speech.
