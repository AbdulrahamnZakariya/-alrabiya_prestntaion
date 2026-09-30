# V1 «تقني واعي» (Aware Techie) build notes

**Source:** `index.html` is generated from `scratchpad/v1work/src.html` by `build.py`. The build inlines `caps.json` words and the Lucide icon paths, so the page has no runtime fetches.
If you edit `index.html` directly, that is fine; it is self-contained.

## Look
- **Palette:** ink `#0A1220` (panels and background), paper `#EEF1EA` (text), one accent `#C4EA66` (signal lime, about 76% saturation), and warn `#EE4B3E`, used only for «أكيد لا» and ✗.
- **Surfaces:** glass panels are `rgba(9,16,30,.74)` with a 14px backdrop blur and a 1px hairline `rgba(238,241,234,.18)` border. Corners use a 22px radius, chips are pills, and every panel uses one shadow recipe.
- **Fonts:** Alexandria 700/800/900 for all Arabic, IBM Plex Mono 400/700 for Latin HUD labels only. There is no letter-spacing on Arabic and no char splitting. Karaoke highlights whole words.
- **Eases:** `out` (0.23,1,0.32,1), `expo.out`, `inOut` (0.77,0,0.175,1) and `drawer` (0.32,0.72,0,1), plus `back.out(1.2)` only for landing chips and clips. No bounce/elastic, no ease-in entrances, no infinite loops, no Math.random (seeded PRNG).
- **Logo:** an eye/almond with a lime pupil and a cursor arrow, inside HUD corner brackets, with the wordmark «تقني واعي» in Alexandria 900 and `AWARE TECH` in mono. It appears as a small glass badge at top-left (x 84–300, y 170–238) from 2.3s. At 38.2s it gets a full stroke-draw reveal with the CTA pill «تابع تقني واعي» and a bell. The end card is static from about 39.6s to 40.97s.

## Beats
| t | beat | build |
|---|---|---|
| 0–2.0 | طفرة في عالم التصميم | Camera card at 0.86 over an ink grid. The hero «طفرة» sits BEHIND him (behind use 1 of 2). 5 glass word-pills orbit his head on a tilted ring, swapping between the behind and front layers with `tl.set` visibility at the crossings. The title «في عالم التصميم» carries karaoke plus a lime underline. The hook is fully readable on frame 0. |
| 2.02 | expand | The card expands to full bleed (0.6s inOut) while the orbit keeps going. |
| 2.1–4.4 | designers upset | A group-chat toast «جروب المصممين: مين سمحلك تنشر هالفيديو؟» with an unread counter going 3 → 7 → 24 → 99+ |
| 4.54 | punch 1.12 | A fact-check HUD: the shield-check draws, then `FACT_CHECK / TRUE` |
| 7.07–10.05 | AI edits your videos | The video shrinks into a PROGRAM monitor with a live timecode. The AI_AGENT task list ticks (قص الصمت، تلوين، كابشن، موشن) next to the NLE dock (Pr/Ae/Resolve). In the timeline, clips snap in, the waveform grows, the playhead scrubs and a razor cuts at «مونتاج» with a ripple. |
| 10.05 | hard cut + flash | A face-tracking reticle locks onto his head. At «حس بصري» a VISUAL meter with an eye icon fills. |
| 12.38 | punch 1.10 | Idea tiles (lightbulb, palette, pen, layers) float out beside his head, then fly into an `IMPORT → VIDEO` drop zone at «تدخلها». |
| 15.96 | النتيجة أفضل | A scan line sweeps the frame. The drop zone becomes a 12-segment quality meter filling RTL, and `LEVEL: HIGH` lands at «أفضل». |
| 17.52 | فالذكاء الاصطناعي | A MODELS ONLINE chip shows monochrome Claude, OpenAI and Gemini marks. |
| 18.83 | كل ما كلّمته أكتر | Prompt and answer bubbles stack up like a chat. |
| 20.04 | نتائج أفضل | A line chart plots OUTPUT QUALITY vs PROMPTS, drawing upward. |
| 21.36–30.03 | محترف vs عادي | Split screen. The real card on the right becomes «محترف» (it appears at «باحترافية»). On the left is a desaturated, blurred duplicate video, «عادي», which appears at «عادي؟». Add-on chips land on the pro card at «وبيضيف الإضافات الصح». A butterfly meter compares the two (pro fills at 24.6, plain at 28.35). A CPU "machine" badge spins at «الماكينة» and turns into `=?` at «نفس». |
| 30.03–30.9 | أكيد لا | This beat is revised and is the loudest moment; see the Revision round below. First a red ✗ slams onto the «عادي» card with a flash, shake and glitch. Then at 30.36 a hard cut to full frame at 1.14 brings the 200px red stamp, the red vignette and the shake. |
| 30.96–33.0 | فبشرى للمصممين | Card at 0.8. «بشرى» in lime reads in front first, then moves BEHIND him at 31.6 (behind use 2 of 2). The title «للمصممين» then appears with a pen-tool draw-on. |
| 33.0–38.18 | assistant, not replacement | A node graph links الأداة (bot) and إنت (pen). At «مساعد» a handshake appears with «مساعد ✓». At «وليس» the bot slides over to take his place, a red ✗ blocks it and it snaps back, and «تحل محلك ✗» is struck through. |
| 38.2–40.97 | end card | The frozen frame sits under a radial ink overlay (the live blur was removed because it stalled the renderer), and the logo reveal and CTA play. |

- **Camera:** punches land on the jump cuts: 1.00 → 1.12 (4.54) → NLE card (7.07) → 1.00 (10.05, flash) → 1.10 (12.38) → 1.00 (17.46) → split card (21.36). The 30.03 cut is hidden inside the split card by the ✗ slam, flash and shake. Then 1.14 (30.36) → 0.8 card (30.96) → 1.08 (33.0, flash).
- **Captions:** Alexandria 800 at 82px (auto-fit, min 62), centered, one line, bottom-anchored at y 1470. Pages are hand-split per sentence. The active word shows lime with a 0.12s soft color tween. Captions are hidden during the hook, «أكيد لا» / «بشرى للمصممين», «وليس تحل محلك» (the panel shows it) and the end card.
- **Audio:** `sfx.json` holds 27 cues on `bed_tech.wav` at -25 dB. Each cue is tied to a visual event (see `note`). There is no audio in the composition.

## Known issues / notes
- Caption word timings are estimates (±0.15s). Highlights are soft, so small drift reads fine.
- The behind-person text depends on `person.webm`. With the real cutout his hair overlaps the lower edge of «طفرة» and «بشرى» (intended). If he leans up (around 32.5s), more of «بشرى» is hidden, but it stays readable.
- The «عادي» card is a third decode of `base.mp4`, active only from 21.36 to 30.06. Render time increases slightly in that window.
- The unread counter (99+) and the meters are illustrative, not data.

## Revision round (creative director notes, applied before final)
1. **End card wordmark:** it now reveals as one whole word (blur-in, rise and opacity). The clip wipe is gone, so no isolated letters appear.
2. **Captions:** 82px weight 800 (scaled 1.25x), with a stronger text shadow and bottom scrim. Pages land fully opaque in 120ms. Each page exits in 60ms and finishes before the next page arrives, so there is no ghosting. Pages are hand-split per sentence so phrases stay together (e.g. «إنو الذكاء الاصطناعي», «حس بصري»). Each page stays on one line (nowrap), and long pages auto-fit down to 62px or more. The hook words are fully opaque, with a lime karaoke highlight.
3. **Glass panels:** raised to 86% opacity. The toast exits in 160ms at 4.30.
4. **«طفرة» / «بشرى»:** each shows a clean FRONT read first, then pushes behind him. «طفرة» is in front from 0 to 0.6s. «بشرى» blur-slams in front at 31.0, scales to 0.95 and swaps behind at 31.6.
5. **10–17s density:**
   - A big VISUAL SENSE eye chip (128px icon) plus a lime scan bar sweeping across his face at «حس بصري».
   - 150px idea tiles fly out of his temples, then into IMPORT → VIDEO.
   - The quality meter fills fully in lime, with a white glow sweep and a ding at «أفضل».
6. **«أكيد لا» is now the loudest moment, in two hits:**
   - 30.03: 2-frame white flash, glitch bars and a relative shake of the split screen. A 300px red ✗ slams onto the «عادي» card, which turns red, and `=?` turns red.
   - 30.36: hard cut to full frame at 1.14 with a red flash and red edge vignette. The 200px «أكيد لا» stamp slams 1.9 → 1 with an RGB ghost, camera shake and glitch.
   - Matching SFX: riser into impact_hit_b + glitch, then impact_hit_a + sub_drop + glitch_b.
- `renders/draft.mp4` is the pre-revision draft the critic reviewed. `renders/final.mp4` includes all the notes above.
