# V2 NOTES — «كولاج تحريري جريء» (Motion Designer B), revision 3

Deliverables: `index.html`, `plan.md`, `sfx.json`, `renders/final.mp4`, `renders/sheet.jpg` (32 frames, every 1.25s), and `renders/draft.mp4` (a light re-encode of the same final cut for the critic).

`index.html` is generated from `scratchpad/v2work/index.tpl.html` by `build.py`, which inlines the Lucide/brand SVG paths and the caps.json word list. Edit the template and rerun `build.py`; a direct edit to `index.html` is lost on the next build.

## Look
- Cut-paper collage on a designer's desk:
  - torn-edge paper cards (seeded clip-path polygons) and masking tape;
  - round die-cut stickers (180–230px) with thick off-white rims, and monochrome brand stickers (Pr, Ae, DaVinci, Claude, OpenAI, YouTube);
  - marker strokes drawn on with DrawSVG;
  - paper grain from a seeded `feTurbulence` data-URI, which is deterministic and not animated.
- Palette: paper `#F2EEE6`, desk `#E4DED2`, ink `#161412`, ONE accent signal-yellow `#FFCF1F`. Stamp red `#D6262B` is used only for «أكيد لا», the ≠ slash, and the «تحل محلك» strike/✗.
- Type:
  - Lalezar for display: hero words, cards, board rows, stamp, logo.
  - Readex Pro 700 for captions.
  - No letter-spacing, no italics, word-level animation only.
- Captions:
  - Paper-scrap words at 74px in full ink, in the band y≈1184–1460.
  - The active word gets a yellow marker swipe (grows from the right, 140ms) and a 1.0→1.06→1.0 pop. The previous word's marker fades.
  - Captions are hidden where a card shows the same words, and during the polaroid board (21.36–28.2), where the board rows mirror the speech.

## Beats (something enters or transforms every ~0.5–1.5s)
| time | what |
|---|---|
| 0–0.46 | «طفـــرة» on a torn paper band IN FRONT of his chest: a clean full read on frame 0. |
| 0.46–0.88 | The band rises and swaps behind him (tl.set), ending behind his head. Six word cards and Pr/Ae stickers orbit his head with depth: behind = scale 0.74 + 2.6px blur, front = 1.1, with behind/front copies swapped at the crossings. |
| 0.34–1.8 | Strip «في عالم التصميم» with a marker on التصميم. |
| 2.0 | Cards swirl out. |
| 2.08 / 2.8 / 3.72 | «المصممين» card with pen icon (left) / frown sticker + angry ticks (right) / YouTube sticker on «هذا الفيديو». |
| 4.54–6.97 | Whip-punch, then «طبعاً» card. ✓ written on it and a ✓ sticker (right) at «للتأكيد»; yellow memo «! للمعلومية» (left). |
| 7.36–9.95 | AI bot sticker (right), Claude + OpenAI stickers (left). Film strip, then scissors cut it on «مونتاج». The AI stickers peel off and Premiere / DaVinci / After Effects stickers slap in their place. |
| 11.02–12.38 | Yellow «إنت» label with a hand-drawn arrow at him; «حس بصري» card with marker; eye sticker. |
| 12.92–15.9 | Thought cloud holding palette/pen/sparkles stickers (left), lightbulb sticker with rays (right). Video-frame card; the three idea stickers fly from the cloud INTO the frame. |
| 16.2–17.46 | Award sticker, «النتيجة أفضل» card lands solid in 140ms (pop) with the marker drawn by 16.7, a circle drawn around «أفضل», trending-up sticker. |
| 17.55–21.26 | Bot + Claude stickers; chat bubbles pile up (right) while a bar chart grows (left). |
| 21.36–28.06 | Paper-rip into the desk; video becomes a 562px-wide polaroid (clip-path crops to head/chest) with bot + film stickers. Below it, no pre-drawn empty rows: ink header tags «محترف» (big) ضد «عادي» (small) with a hand-drawn yellow-circled «ضد»; «محترف» gets three taped paper strips at 70px Lalezar with yellow icon stickers as he says them (sparkles باحترافية + marker, sliders الإضافات الصح, cpu داخل الماكينة) filling y≈1030–1545; «عادي» gets only one small grey plain strip «استخدام عادي» + a grey «؟» sticker — thin vs rich is the message. |
| 28.06 | The polaroid zooms back to full frame. «=؟» sticker on him. |
| 30.06 | «أكيد لا» rubber stamp, 840px wide, centred at (540,1000), −8°, fully inside x≈110–970: 2-frame white flash, slam from 1.8×, camera punch 1.17→1.12, whole-frame shake (absolute offsets returning to 0). The «=» gets a red slash (≠). |
| 30.96–32.9 | Paper-rip, then «بشـــرى» on a yellow band IN FRONT (clean read). At 31.4 it rises behind his head. Yellow strip «للمصممين», pen sticker, confetti. |
| 33.0–38.1 | Whip-punch. Pen sticker + «إنت» (left) and bot sticker (right). The bot docks on a big «مساعد ✓» card (marker + ✓). «وليس تحل محلك» card: red strike + ✗, then it TEARS in two and the halves fall. |
| 38.26–40.97 | Ink-black torn sheet rises over the frozen frame (the camera eases up). Logo sticker slaps; yellow CTA strip «تابع تقني واعي +». Static from ~39.4. |

- Logo «تقني واعي»: an ink eye-disc whose pupil is a yellow play button, plus the Lalezar wordmark. It is a die-cut sticker made with an feMorphology filter. The persistent badge is now ~1.5× larger (x≈95–410, y≈195–270) and stays until the end card.
- Jump cuts: 4.54 (1.10, whip), 7.07 (1.0), 10.05 (1.12, whip), 12.38 (1.0), 17.46 (1.08, whip), 21.36 (rip wipe), 30.03 (1.12, into the stamp), 30.96 (rip wipe), 33.0 (1.08, whip). The maximum camera scale is 1.17, for 0.3s on the stamp.
- SFX: `sfx.json` has 26 cues, each with a note naming its visual. The bed is `bed_tech.wav` at -26 dB.

## Known issues / deviations
- Both text-behind words («طفرة», «بشرى») are split by his head while they sit behind him. His head is ~550px wide and reaches the top of the frame. The fix is a clean read IN FRONT first (0–0.46s, 30.96–31.4s), then the rise behind him.
- The design-skills brief bans feTurbulence. The style brief asked for grain, so it is used only for static paper grain and the stamp's ink texture, both seeded.
- The «أكيد لا» stamp covers his mouth/chin for ~0.9s by design (the loudest frame of the reel).
- The renders are 41.0s (1230 frames); the renderer rounds 40.9667s up by one frame.
