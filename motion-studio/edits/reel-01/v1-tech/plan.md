# V1 «تقني واعي» (Aware Techie) style frame plan

**Idea:** a quiet, precise editing OS laid over real footage. The HUD is made of hairlines, corner brackets and mono data labels. Every panel is a tool the speaker is describing at that moment.

## Tokens
| token | value | role |
|---|---|---|
| `--ink` | `#0A1220` | panels, end card (near navy, never pure black) |
| `--glass` | `rgba(9,16,30,.74)` + `backdrop-filter: blur(14px)` | glass panels |
| `--hair` | `rgba(238,241,234,.18)` 1px | every panel border |
| `--paper` | `#EEF1EA` | text (never pure white) |
| `--acc` | `#C4EA66` (signal lime, about 76% saturation) | the ONE accent: the active karaoke word, focal graphic, «محترف», logo pupil |
| `--warn` | `#EE4B3E` | used only for «أكيد لا» and ✗ |
- Radius system: panels use 22px, chips use pills. There is one shadow recipe: `0 10px 30px rgba(4,8,18,.38)`.
- Fonts: **Alexandria** 700/800/900 for all Arabic (display, captions, labels). **IBM Plex Mono** 400/700 for Latin data labels only.
- Eases: `out` (0.23,1,0.32,1), `outExpo`, `inOut` (0.77,0,0.175,1), `drawer` (0.32,0.72,0,1), and `settle` (back.out 1.2) used only for landing chips.

## Logo
The mark is an eye/almond (awareness) with a lime pupil, fused with a cursor arrow (tech). It sits inside 4 HUD corner brackets. The wordmark is «تقني واعي» in Alexandria 900 with a mono `AWARE TECH` line under it. It appears as a persistent glass badge (top left, y 176) and as a full stroke-draw reveal with the CTA «تابع تقني واعي» and a bell icon on the end card.

## Beats
| t | speech | scene (visual metaphor) | SFX |
|---|---|---|---|
| 0–2.0 | طفرة في عالم التصميم | Hero «طفرة» sits BEHIND him (behind use #1). 5 glass word-pills (التصميم، مونتاج، الذكاء الاصطناعي، موشن، مونتير) orbit his head on a tilted ring and swap between the behind and front layers. The front hook title is readable on frame 0. | impact_hit_b |
| 2.04–4.44 | المصممين رح يزعلوا… | A notification toast from «جروب المصممين» reads «مين سمحلك تنشر هالفيديو؟», with an unread counter climbing | notification |
| 4.54–7.07 | طبعاً، للتأكيد وللمعلومية | Punch 1.12. A HUD fact-check: a shield-check draws, then `FACT_CHECK: TRUE` | whoosh |
| 7.07–10.05 | AI بيعملك مونتاج | The video shrinks into the PROGRAM monitor of an NLE. An AI-agent task list ticks off, the tool dock sits beside it, and in the timeline clips snap in, the playhead scrubs, the waveform shows and a razor cuts at «مونتاج» | whoosh, click, shutter |
| 10.05–12.38 | حس بصري | Hard cut back with a flash. A face-tracking reticle locks onto his head and an eye «VISUAL SENSE» meter fills | scan |
| 12.38–15.83 | أشياء في بالك… تدخلها داخل الفيديو | Idea tiles (lightbulb, palette, pen, layers) float out of his head, then fly into an IMPORT drop zone | pop, whoosh |
| 15.96–17.36 | النتيجة أفضل | A scan line sweeps the frame and the drop zone becomes a segmented quality meter filling RTL to HIGH | blips, ding |
| 17.52–18.57 | فالذكاء الاصطناعي | A models-online chip shows the Claude, OpenAI and Gemini marks in monochrome | |
| 18.83–19.91 | كل ما كلّمته أكتر | Prompt/answer chat bubbles stack up | typing |
| 20.04–21.26 | نتائج أفضل | A line chart shows quality vs prompts, drawing upward | |
| 21.36–30.03 | محترف vs عادي | Split screen: the real video card becomes «محترف» and a desaturated duplicate becomes «عادي». Add-on chips pop onto «محترف», a butterfly meter compares them, a CPU "machine" badge sits in the centre, and it turns into «=؟» | whoosh, pops, processing, riser |
| 30.03–30.96 | أكيد لا | Punch 1.14 with a red stamp, camera shake and an RGB glitch | glitch, impact, sub |
| 30.96–33.0 | فبشرى للمصممين | «بشرى» sits BEHIND him (behind use #2), then the title «للمصممين» appears with a pen icon | shimmer |
| 33.0–38.18 | مساعد إلك، وليس تحل محلك | Node graph between «الأداة» (bot) and «إنت», and a handshake at «مساعد ✓». The bot tries to take his place, a red ✗ blocks it and «تحل محلك» is struck through | ding, glitch |
| 38.3–40.97 | end card | The frozen frame is dimmed under a radial ink overlay. The logo strokes draw, the wordmark wipes in from the right, and the CTA pill with the bell holds static for 1.4s | whoosh, impact |

- Captions: Alexandria 700 66px karaoke, pages of ≤4 words, bottom anchored at y 1470 and centered. They are hidden during the hook title, «أكيد لا», «بشرى للمصممين», «وليس تحل محلك» and the end card.
- Camera punches land on every jump cut (1.00 / 1.12 / card / 1.00 / 1.10 / 1.00 / card / 1.14 / 1.00 / 1.08).
