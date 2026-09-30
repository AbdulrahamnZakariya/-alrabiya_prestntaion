# V2 — «كولاج تحريري جريء» (bold editorial cut-paper collage)

## Style frame
- **Idea:** the speaker is pinned to a designer's desk. Everything he says becomes a paper scrap that gets cut, taped, stamped and marked-up by hand. Tactile, warm, human; the opposite of V1's dark HUD.
- **Palette tokens**
  - `--paper #F2EEE6` (card stock, off-white, slightly cool-grey; not cream)
  - `--desk #E6E0D4` (board background when the video shrinks)
  - `--ink #161412` (all text, icon strokes)
  - `--acc #FFCF1F` signal-yellow highlighter: the ONLY accent, used for marker swipes behind key words + a few stickers
  - `--red #D6262B` rubber-stamp red: used only for «أكيد لا» stamp and the «تحل محلك» strike-through / ✗
  - tape: translucent `rgba(236,229,205,.8)`
- **Fonts:** Lalezar 400 (display: hero words, cards, stamp, logo) + Readex Pro 700/400 (captions, small labels). No letter-spacing, no italics, word-level animation only. Kashida (ـ) is used to stretch hero words so the head occludes only the stretched joint.
- **Materials:** torn-edge clip-paths (seeded PRNG), one shadow recipe `drop-shadow(0 10px 14px rgba(40,30,15,.32))`, paper grain = seeded SVG `feTurbulence` baked into a data-URI background (deterministic), masking-tape strips, die-cut icon stickers (Lucide paths stroked twice: thick white outline under ink), brand stickers in monochrome ink.
- **Radius lock:** 0 everywhere (paper is cut, not rounded) except circle stickers.
- **Logo «تقني واعي»:** round ink sticker mark = an eye whose pupil is a yellow disc with an ink play-triangle (aware + video), next to the Lalezar wordmark on a die-cut white sticker. Small taped tag top-left all video; full sticker-slap on the end card with a yellow torn CTA strip «تابع تقني واعي».
- **Captions:** "ransom-note" cut-paper scraps, one scrap per word, 2–4 words/page, band y≈1250–1450, upcoming words ink 35% → spoken ink 100% (soft 120ms). Hidden when a card shows the same words.

## Beats (time → graphic metaphor → SFX)
| t | speech | graphic | SFX |
|---|---|---|---|
| 0–2.0 | طفرة في عالم التصميم | «طفـــرة» huge Lalezar BEHIND his head (text-behind #1); 6 paper word cards + Premiere/AE stickers orbit him on a tilted ellipse, swapping behind/front copies with tl.set; torn strip «في عالم التصميم» + marker on التصميم | impact_hit_b 0.0, whoosh_long 0.05 |
| 2.0 | — | cards swirl out, hero tears away | whoosh_short_b |
| 2.04–4.44 | المصممين رح يزعلوا… | die-cut frown sticker slaps + 3 angry marker ticks; marker under «يزعلوا» in caption | pop_b |
| 4.54–6.97 | طبعاً / للتأكيد وللمعلومية | whip punch; taped «طبعاً» card slaps; hand-drawn ✓ written on it | pop_a, click |
| 7.07–9.95 | الذكاء الاصطناعي… مونتاج | AI bot sticker top-right; film-strip card, scissors sticker slides and CUTS the strip in two | camera_shutter (snip) |
| 10.05–12.28 | حس بصري | whip punch; «حس بصري» card, yellow marker drawn behind, eye sticker | pop_b |
| 12.38–15.83 | في بالك… تدخلها داخل الفيديو | lightbulb sticker by his head; paper video-frame card; idea stickers (palette/pen/sparkles) fly from bulb INTO the frame | shimmer |
| 15.96–17.36 | النتيجة أفضل | card, marker behind, hand-drawn circle annotation around «أفضل» + trending-up sticker | ding |
| 17.46–21.26 | كلّمته أكتر → نتائج أفضل | bot sticker; chat-bubble scraps pile up (talking more) while a hand-drawn bar chart grows (better results) | pop_a |
| 21.36 | — | paper-rip wipe → video becomes a taped polaroid on the desk | whoosh_long |
| 21.42–29.93 | محترف vs عادي | two-column board: «محترف» items fill as he speaks (باحترافية + marker, الإضافات الصح, داخل الماكينة); «عادي» column has empty dashed slots → «استخدام عادي»; drawn «=؟» between | pop_b, click |
| 30.09 | أكيد لا | red rubber stamp SLAM across the board, «=» gets a red slash (≠), board shakes | impact_hit_a + sub_drop |
| 30.96–32.9 | فبشرى للمصممين | paper-rip back to full frame; «بشـــرى» behind him (text-behind #2) on a yellow marker swash; yellow strip «للمصممين»; paper confetti | whoosh_short_b, shimmer |
| 33.0–38.18 | الأداة مساعد… وليس تحل محلك | whip punch; bot sticker → «مساعد ✓» card (marker) vs «تحل محلك ✗» card struck through in red | pop_b, impact_hit_a |
| 38.3–40.97 | end card | torn sheet rises over frozen frame; logo sticker slap; CTA strip «تابع تقني واعي»; static ≥1.5s | whoosh_long, impact_hit_b |

Jump cuts: punches alternate 1.00 ↔ 1.08–1.12; whip (x-offset + 6px blur, 0.2s) on 4.54, 10.05, 17.46, 33.0; 21.36 and 30.96 hidden under rip wipes; 30.03 happens inside the polaroid (invisible at that size).
Bed: bed_tech.wav (energetic, 120 BPM) at -26 dB.
- Revision 2 (after CD review): density pass, bigger caption scraps with marker karaoke, front-then-behind hero reads, bigger polaroid board, full-frame HUGE stamp, tear ending. See NOTES.md.
