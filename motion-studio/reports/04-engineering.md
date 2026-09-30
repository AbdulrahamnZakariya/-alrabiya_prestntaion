# 04 — المخطط الهندسي: خط إنتاج مونتاج بالذكاء الاصطناعي (Claude Code + HyperFrames + GSAP)

> **الدور:** Lead Engineer · **التاريخ:** 2026-09-30
> **النتيجة المختصرة:** شغّلنا HyperFrames **v0.8.95** فعلياً داخل الـsandbox ورندرنا فيديو عربي 1080×1920 مدته 3 ثوانٍ في **7.2 ثانية**، مع تحريك GSAP كلمة بكلمة، والتشكيل العربي سليم. ورندرنا نفس المشروع مرتين فخرجت الإطارات **متطابقة بتاً ببت** (framemd5). ونجحت أيضاً هذه الاختبارات:
> - **Remotion 4.0.530** (React 19): رندر عربي بنفس المقاس في ~10 ثوانٍ.
> - **سكربت Python للقص**: يزيل الصمت والحشو والتأتأة والإعادات (يحتفظ بآخر take) ويكتب EDL JSON ثم يقص بـffmpeg، فتحوّل مقطع اختبار من 20s إلى 6.64s.
> - **تسجيل B-roll بـPlaywright** مع سجل النقرات، ثم auto-zoom عمودي 9:16.
> - **MCP server بسيط للـtimeline** يعمل عبر stdio.
>
> التفاصيل في القسمين 7 و11، والمنهجيتان في 9، وخطوات اليوم الأول في 10.
>
> **اصطلاح التحقق:** ✅ = تحققتُ منه بنفسي (CLI `--help`، أو lint، أو تشغيل فعلي، أو README) · ⚠️ = لم أتحقق منه، راجعه قبل الاعتماد عليه.

---

## 0. مصادر تحققتُ منها

| المصدر | ماذا أخذنا منه |
|---|---|
| https://github.com/heygen-com/hyperframes (README) | التثبيت، صيغة التكوين، `window.__timelines`، الرخصة Apache-2.0، skills الوكلاء، `claude plugin marketplace add heygen-com/hyperframes` |
| حزمة npm `hyperframes@0.8.95`، أي `npx hyperframes --help` و`render --help` و`init --help` و`transcribe --help` و`docs gsap/rendering/compositions/troubleshooting` | كل أعلام CLI الواردة هنا مأخوذة من المخرجات الحرفية |
| ملف `CLAUDE.md` الذي يولّده `hyperframes init` (نسخة منه في `hf-test/arabic-test/CLAUDE.md`) | القواعد الرسمية (Key Rules) وأوامر الـagent |
| قواعد الـlinter داخل `node_modules/hyperframes/dist` | قواعد الحتمية الحرفية: `non_deterministic_code` و`html_dir_attribute_breaks_render` و`font_family_without_font_face`… |
| https://github.com/nateherkai/hyperframes-student-kit | 15 skill، و406 بطاقة موشن، وبنية المجلدات |
| https://github.com/notivn/AIEV | Claude Agent SDK + faster-whisper + HyperFrames → Remotion، وواجهة ويب |
| https://github.com/assafkip/claude-video-editor | plugin لـClaude Code، قصّ على حدود الكلمات، موافقة قبل التنفيذ، QA لكل قصّة |
| https://github.com/Navidbyti/motion-studio | CLI اسمه `mstudio`، ومزامنة مع الإيقاع (beats)، وبوابة `qa` |
| https://raw.githubusercontent.com/m-bain/whisperX/main/whisperx/alignment.py | نموذج المحاذاة الافتراضي للعربية: `jonatasgrosman/wav2vec2-large-xlsr-53-arabic` |
| https://raw.githubusercontent.com/remotion-dev/remotion/main/LICENSE.md | Remotion مجاني للأفراد وللشركات حتى 3 موظفين، وما فوق ذلك يحتاج Company License |
| https://github.com/motion-canvas/motion-canvas | رخصة MIT |
| https://webflow.com/updates/gsap-becomes-free و https://gsap.com/community/standard-license/ | GSAP مجاني بالكامل مع كل الإضافات (ومنها SplitText)، والاستخدام التجاري مسموح |
| https://claude.com/pricing و https://support.claude.com/en/articles/11049741-what-is-the-max-plan | Pro بـ$20 شهرياً ($17 عند الدفع السنوي)، وMax 5x بـ$100، وMax 20x بـ$200، وClaude Code مشمول في كل الخطط المدفوعة |

> ملاحظة: موقعا `hyperframes.heygen.com` و`remotion.dev` محجوبان من شبكة الـsandbox. لذلك أخذنا توثيق HyperFrames من `npx hyperframes docs <topic>` المدمج في الحزمة (يعمل بلا إنترنت) ومن الـREADME على GitHub.

---

## 1. معمارية الخط (ASCII)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Claude Code (Opus 5.5) = المخرج                        │
│   يقرأ CLAUDE.md + .claude/skills/*  ·  يكتب JSON/HTML  ·  يشغّل CLI  ·  QA     │
└───────────────┬──────────────────────────────────────────────────────────────┘
                │ يوجّه كل مرحلة (بموافقة المحرر عند نقاط التفتيش ◆)
                ▼
[1] raw/ ── footage.mp4 (كاميرا، شاشة، بودكاست)
                │  ffmpeg -i … -vn -ac 1 -ar 16000 audio.wav
                ▼
[2] Transcription ── WhisperX (large-v3, --language ar) + محاذاة wav2vec2 عربية
                │  → work/transcript.words.json  [{word,start,end,score}]
                ▼
[3] Silence / Filler cut
      • auto-editor (صمت صوتي)  أو  ffmpeg silencedetect
      • Claude: حذف الحشو العربي ("يعني"، "اممم"، "إييه"، التكرار، الأخطاء)
        على حدود الكلمات فقط + هامش 80–150ms
                │  → work/cuts.json
                ▼
[4] EDL (Edit Decision List) ── edl.json  ◆ موافقة المحرر
      { segments:[{src,in,out}], scenes:[{id,type,start,dur,text,brand}],
        captions:{style,words[]}, audio:{music,sfx[],ducking} }
                │
       ┌────────┴──────────────────────────────┐
       ▼                                       ▼
[5a] a-roll مقصوص                        [5b] Scene generation (Claude)
  ffmpeg concat/trim                       compositions/scene-XX.html
  → work/aroll.mp4                         (HTML + CSS + GSAP، paused timeline،
                                            خطوط محلية، قالب brand-motion)
       │                                       │  npx hyperframes check  ◆ QA
       │                                       ▼
       │                              [6] HyperFrames render
       │                                  npx hyperframes render -c … --format mov
       │                                  (شفافية ProRes 4444)  أو  mp4
       │                                       │
       └──────────────┬────────────────────────┘
                      ▼
[7] Assembly ── ffmpeg: overlay المشاهد فوق a-roll + music + SFX
                + ducking (sidechaincompress) + loudnorm (-14 LUFS للسوشال)
                      │
                      ▼
[8] Captions ── كابشن عربي كلمة بكلمة كـcomposition في HyperFrames (مفضّل)
                أو ASS/SRT محروق عبر libass (خيار احتياطي)
                      │
                      ▼
[9] Export variants ── 9:16 (1080×1920) · 1:1 (1080×1080) · 16:9 (1920×1080)
                        (تكوين لكل نسبة + --resolution، وليس قصّ أعمى)
                      │
                      ▼
[10] qa-gate ── snapshot + ffprobe + فحص الصوت + قائمة تحقق  ◆ تسليم
```

**مبدأ التصميم:** يعمل Claude على **البيانات** (JSON للكلمات، JSON للـEDL، HTML للمشاهد) ولا يعمل على البكسلات، وكل مرحلة تنتج ملفاً وسيطاً يمكن مراجعته وإعادة تشغيله. هذا النمط هو نفسه في `claude-video-editor` (يقرأ النصوص ولا يشاهد الفيديو إطاراً إطاراً، ويقترح القصّ على حدود الكلمات ثم ينتظر الموافقة) وفي `AIEV`.

---

## 2. بنية المشروع

```
arabic-video-studio/
├── CLAUDE.md                      # دستور المشروع (أدناه)
├── .claude/
│   ├── settings.json              # صلاحيات: Bash(ffmpeg:*), Bash(npx hyperframes:*), …
│   └── skills/
│       ├── arabic-captions/
│       ├── brand-motion/
│       ├── scene-builder/
│       ├── silence-cut/
│       ├── qa-gate/
│       └── render-export/
├── brand/
│   ├── brand.json                 # ألوان، خطوط، سرعات easing، شعار
│   ├── fonts/                     # woff2 محلية (IBM Plex Sans Arabic, Cairo, Tajawal…)
│   └── logo.svg
├── vendor/gsap.min.js             # GSAP منسوخ محلياً (لا CDN وقت الرندر)
├── templates/                     # مشاهد جاهزة: lower-third, title-card, stat, quote, cta
├── projects/
│   └── 2026-10-ep01/
│       ├── raw/                   # المادة الخام (لا تُعدَّل أبداً)
│       ├── work/                  # audio.wav, transcript.words.json, cuts.json, aroll.mp4
│       ├── edl.json
│       ├── hf/                    # مشروع HyperFrames: index.html + compositions/ + assets/
│       ├── audio/                 # music/, sfx/
│       ├── renders/               # scene-*.mov, captions.mov
│       └── exports/               # final_9x16.mp4, final_1x1.mp4, final_16x9.mp4
└── scripts/
    ├── transcribe.py              # WhisperX → words.json
    ├── build_edl.py               # words + cuts → edl.json (التحقق من الـschema)
    ├── assemble.sh                # ffmpeg overlay + mix
    └── qa.py                      # ffprobe + loudness + snapshots
```

### 2.1 نموذج `CLAUDE.md` للمشروع

```markdown
# Arabic Video Studio — دستور المشروع

## الدور
أنت مخرج مونتاج. تعمل على البيانات (JSON/HTML) وليس على البكسل. لا تلمس raw/ أبداً.

## الخط (بالترتيب، مع نقاط توقف ◆ للموافقة)
1. transcribe → work/transcript.words.json   (skill: silence-cut)
2. cut plan  → work/cuts.json ◆ اعرض قائمة القصّات على المحرر
3. edl.json  ◆
4. scenes    → hf/compositions/*.html (skill: scene-builder + brand-motion)
5. `npx hyperframes check` يجب أن يمر بلا أخطاء (skill: qa-gate)
6. render + assemble + captions (skills: render-export, arabic-captions)
7. qa-gate قبل التسليم

## قواعد عربية غير قابلة للتفاوض
- لا تقسّم النص العربي إلى حروف أبداً. التحريك بالكلمة أو بالسطر فقط.
- ممنوع `dir="rtl"` على <html> (قاعدة lint: html_dir_attribute_breaks_render).
  ضع `direction: rtl` على عناصر النص فقط.
- كل خط عبر @font-face بملف woff2 محلي من brand/fonts. ممنوع الاعتماد على خطوط النظام.
- الأرقام: التزم بما في brand.json (عربية ٠١٢ أو غربية 012) في الملف كله.

## قواعد HyperFrames (من CLAUDE.md الرسمي)
- timeline واحد paused لكل composition، مسجّل في window.__timelines["<id>"].
- كل عنصر زمني له data-start و data-duration و class="clip".
- الفيديو muted، والصوت عنصر <audio> منفصل.
- لا Date.now ولا Math.random ولا performance.now ولا fetch. استخدم seeded PRNG.
- لا repeat:-1. التكرار دائماً بعدد محدود.

## أوامر
npx hyperframes check · npx hyperframes snapshot --at 0.5,2,4 · npx hyperframes render -o …
```

### 2.2 مجموعة Skills (`.claude/skills/<name>/SKILL.md` + ملفات مرجعية)

| Skill | متى يُستدعى | ماذا يحتوي |
|---|---|---|
| **silence-cut** | بعد الاستيراد | `scripts/transcribe.py` (WhisperX ar)، وقاموس الحشو العربي (`fillers_ar.txt`: يعني، اممم، إيه، طيب يعني، ما أدري…)، وقواعد الهوامش (80–150ms)، وأمر auto-editor، وصيغة `cuts.json` |
| **arabic-captions** | مرحلة الكابشن | تقسيم الكلمات إلى أسطر (2–4 كلمات، ≤ 22 حرفاً للسطر في 9:16)، وقالب HTML للكابشن (كلمة نشطة ملوّنة بـGSAP)، وقواعد RTL/bidi للكلمات الإنجليزية المختلطة، وحجم الخط الآمن ومنطقة الـsafe-area (تجنّب أسفل 15% في Reels/TikTok)، وتصدير SRT احتياطي |
| **brand-motion** | أي مشهد | `brand.json` (ألوان/خطوط/easing مثل `power3.out`، مدد قياسية 0.4–0.6s، stagger 0.08–0.22s)، ومكتبة حركات مسموحة (fade-up، mask-reveal، scale-pop)، وممنوعات (bounce مبالغ فيه، أكثر من 3 ألوان) |
| **scene-builder** | توليد المشاهد | قوالب `templates/*.html` (lower-third، title، stat counter، quote، CTA)، وعقد التكوين (data-* و`__timelines`)، وتعليمات sub-compositions (`data-composition-src`) والمتغيّرات (`data-composition-variables` / `--variables`) |
| **qa-gate** | قبل كل رندر وقبل التسليم | تشغيل `npx hyperframes check` (lint + runtime + layout + motion + contrast)، و`snapshot --at`، وفحص ffprobe (دقة، fps، مدة)، و`loudnorm` للقياس (-14 LUFS)، وقائمة تحقق عربية (لا حروف مقطّعة، لا مربعات tofu، ترتيب RTL صحيح) |
| **render-export** | الرندر والتجميع | أوامر `render` لكل نسبة، وسكربت ffmpeg للـoverlay والمكساج والـducking، وإعدادات التصدير لكل منصة |

> مرجع: `hyperframes-student-kit` يأتي بـ15 skill مثل `edit-video` و`cut-silences` و`cut-mistakes` و`short-form-edit`، ويمكن استعارة بنيته. وHyperFrames نفسه يوفّر skills رسمية منها `/embedded-captions` و`/talking-head-recut` و`/motion-graphics` و`/hyperframes-core` و`/hyperframes-animation` و`/hyperframes-keyframes`. **ثبّت الرسمية أولاً، ثم أضف skills العربية فوقها.**

---

## 3. خطوات الإعداد

### 3.1 المتطلبات (✅ من README و`hyperframes doctor`)
- **Node.js 22+** (إلزامي)
- **FFmpeg + FFprobe** (الـdoctor يفشل بدون ffprobe، وقد اختبرنا ذلك فعلياً)
- **Chrome Headless Shell**: يُحمَّل عبر `npx hyperframes browser ensure`، أو تحدّد مساره بـ`HYPERFRAMES_BROWSER_PATH`
- اختياري: Docker (للرندر الحتمي `--docker`)، وwhisper-cpp (لـ`hyperframes transcribe`)، وPython 3.10+ (لـWhisperX وauto-editor)

### 3.2 macOS
```bash
# 1) الأدوات الأساسية
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node ffmpeg git python@3.12
# 2) Claude Code
npm install -g @anthropic-ai/claude-code        # ⚠️ أو المثبّت الرسمي حسب docs.claude.com
# 3) HyperFrames
npx hyperframes doctor
npx hyperframes browser ensure
npx hyperframes init my-video --resolution portrait --non-interactive
cd my-video && npx hyperframes preview
# 4) skills داخل Claude Code
claude plugin marketplace add heygen-com/hyperframes     # ✅ من README
#   أو:  npx skills add heygen-com/hyperframes           # ✅ من README
# 5) التفريغ العربي + قصّ الصمت
python3 -m venv .venv && source .venv/bin/activate
pip install whisperx auto-editor
```

### 3.3 Windows 11
```powershell
winget install OpenJS.NodeJS.LTS        # ⚠️ تأكد أن الإصدار ≥ 22
winget install Gyan.FFmpeg              # يثبّت ffmpeg + ffprobe
winget install Git.Git
winget install Python.Python.3.11
npm install -g @anthropic-ai/claude-code   # ⚠️ راجع طريقة التثبيت الرسمية الحالية
npx hyperframes doctor
npx hyperframes browser ensure
py -m venv .venv ; .venv\Scripts\activate ; pip install whisperx auto-editor
```
- Windows مدعوم: CLI يذكر مشكلة امتلاء القرص C: ويوفّر لها `--frames-cache-dir`. ✅
- مع WhisperX على GPU من NVIDIA تحتاج PyTorch المبني بـCUDA. ⚠️ اتبع تعليمات pytorch.org.

### 3.4 ملاحظات العتاد
| البند | الحد الأدنى | الموصى به |
|---|---|---|
| RAM | 8 GB (يُفعَّل `--low-memory-mode` تلقائياً عند ≤ 8GB ✅) | 16–32 GB |
| CPU | 4 أنوية (في اختبارنا: 90 إطاراً في 5.8s بعاملين، رندر برمجي بلا GPU) | 8+ أنوية، وكل worker يأخذ نحو 256MB ✅ |
| GPU | غير إلزامي للرندر | NVIDIA ≥ 8GB VRAM لتسريع WhisperX large-v3، وMac M-series ممتاز للمعاينة (fast-capture مفعّل تلقائياً على macOS مع GPU ✅) |
| قرص | SSD بمساحة حرة ≥ 50GB | NVMe، لأن كاش الإطارات يذهب إلى tmp |

### 3.5 التكاليف
| البند | التكلفة | الحالة |
|---|---|---|
| HyperFrames | **مجاني، مفتوح المصدر (Apache-2.0)، بلا رسوم لكل رندر** | ✅ README |
| HyperFrames cloud (`hyperframes cloud render`) / `publish` | يحتاج حساب HeyGen (`hyperframes auth`) والتسعير غير منشور في الـCLI | ⚠️ |
| GSAP 3 (مع SplitText وكل الإضافات) | مجاني، ويشمل الاستخدام التجاري | ✅ gsap.com |
| Claude Pro | $20 شهرياً ($17 بالدفع السنوي)، ويشمل Claude Code | ✅ claude.com/pricing |
| Claude Max 5x / 20x | $100 / $200 شهرياً | ✅ |
| Claude API (دفع لكل token) | يتغيّر حسب النموذج. راجع claude.com/pricing | ⚠️ لم أتحقق من سعر Opus 5.5 |
| WhisperX / whisper.cpp / auto-editor / ffmpeg | مجانية (محلية) | ✅ |
| Remotion | مجاني للأفراد وللشركات حتى 3 موظفين، وما فوق ذلك Company License | ✅ LICENSE.md |

**التوصية:** محرر فرد يبدأ بـ**Claude Pro** للتعلّم، ثم ينتقل إلى **Max 5x** عند الإنتاج اليومي، لأن توليد المشاهد يستهلك tokens كثيرة. استخدام API فقط منطقي للأتمتة الليلية أو الـbatch.

---

## 4. قواعد الحتمية في HyperFrames

> المصدر: ملف `CLAUDE.md` الرسمي الذي يولّده `init`، وقواعد الـlinter في حزمة 0.8.95، و`npx hyperframes docs gsap/rendering`.

1. **timeline واحد paused لكل composition** يُسجَّل في `window.__timelines["<composition-id>"]`، والمفتاح يطابق `data-composition-id`. ✅ (`gsap_timeline_not_registered` و`timeline_id_mismatch`)
2. **الـtimelines الفرعية داخل الجذر لا تكون paused**، لأن الـchild المتوقف لا يتقدّم عند seek الجذر. ✅ CLAUDE.md
3. **الموضع الزمني مطلق** عبر الوسيط الثالث: `tl.to(el, vars, 1.5)`، والطرق المدعومة `set/to/from/fromTo`. ✅ docs gsap
4. **ممنوعات الـlinter (`non_deterministic_code`)**: `Math.random()` و`Date.now()` و`new Date()` و`performance.now()` و`crypto.getRandomValues()` و`gsap.utils.random()` والقيم النصية `"random(...)"`. البديل seeded PRNG مثل mulberry32. السبب أن كل render worker يبدأ بشكل مستقل، فتختلف القيم بين الأجزاء. ✅
5. **لا شبكة وقت الرندر** ("no network fetches"). ✅ CLAUDE.md. عملياً: انسخ GSAP والخطوط محلياً. قالب `init` يحمّل GSAP من cdn.jsdelivr، ونحن استبدلناه بنسخة محلية.
6. **لا `repeat: -1`**. التكرار بعدد محدود ضمن `data-duration`. ✅ (`gsap_infinite_repeat`)
7. **الخطوط**: كل `font-family` يحتاج `@font-face` بملف woff2، وإلا يظهر خط بديل (`font_family_without_font_face`)، وخطوط النظام تُستبدل في الرندر الموزّع (`system_font_will_alias`). ✅
8. **إذا بنيت الـtimeline داخل `document.fonts.ready`** فسجّله في **نهاية** الـcallback وليس قبله (`gsap_timeline_registered_before_async_build`). ✅
9. **الوسائط**: لا تغيّر `src` وقت التشغيل (`media_runtime_src_mutation`). والـ`<video>` ذو `data-start` لا يوضع داخل عنصر زمني آخر (`video_nested_in_timed_element`). والفيديو يكون `muted` مع `<audio>` منفصل. ✅
10. **خاص بالعربية**: `<html dir="rtl">` ممنوع (`html_dir_attribute_breaks_render`، والـlinter يقول إنه ينتج فيديو أسود فارغ). ضع `direction: rtl` على عناصر النص فقط. ✅ (انظر اختبارنا في القسم 7، النتيجة كانت دقيقة)
11. **للإنتاج النهائي**: `render --docker` يعطي نسخة Chrome وخطوطاً ثابتة، و"Render looks different from preview" يُحلّ بـ`--docker`. ✅ docs troubleshooting
12. **ثبّت إصدار CLI**: `package.json` الذي يولّده init يثبّت `hyperframes@0.8.95` حتى يُعاد الرندر بنفس النتيجة، والترقية تتم عبر `npx hyperframes@latest upgrade --project .`. ✅
13. **قاعدة عربية (من عندنا)**: التحريك بالكلمة أو السطر فقط. إذا استخدمت GSAP SplitText فاستخدم `type: "words"` وليس `chars`، لأن تقسيم الحروف يكسر وصل الحروف العربية.

---

## 5. جدول المقارنة

| المعيار | **HyperFrames** | **Remotion** | **Motion Canvas** | **After Effects** |
|---|---|---|---|---|
| الرخصة | Apache-2.0، مجاني بالكامل ✅ | Source-available: مجاني للأفراد والشركات ≤ 3 موظفين، وCompany License لما فوق ذلك ✅ | MIT ✅ | اشتراك Adobe مدفوع |
| لغة التأليف | HTML/CSS + GSAP (أو Lottie/Three/WAAPI) بلا build step | React/TSX + bundler | TypeScript generators | GUI + Expressions (JS) |
| السرعة | 3s بدقة 1080×1920 في 7.2s على 4 أنوية بلا GPU (قياسنا)، مع workers متوازية وLambda/Cloud Run | 3s بدقة 1080×1920 في ~10.2s (قياسنا، Remotion 4.0.530)، مع Lambda | معاينة سريعة، والتصدير من المحرر ⚠️ | رندر محلي، بطيء نسبياً للقوالب |
| ملاءمة الذكاء الاصطناعي | **ممتازة**: مبني للـagents (skills رسمية، CLI غير تفاعلي، `check`/`snapshot`/`inspect`، lint يفهم الحتمية) | جيدة جداً (LLMs تعرف React، ويوجد skills مجتمعية) | متوسطة (API أقل انتشاراً) | ضعيفة (GUI، والأتمتة عبر ExtendScript/MOGRT) |
| العربية | **ممتازة**، لأنه محرك Chrome نفسه (HarfBuzz)، فالتشكيل وbidi سليمان. تحققنا بالرندر. تحفّظ واحد: `dir` على `<html>` | ممتازة (Chrome) | ⚠️ Canvas 2D: وصل الحروف يعمل عادة، لكن التحكم بـbidi والالتفاف أضعف | جيدة مع Middle East text engine، لكنها يدوية |
| الحتمية | seek لكل إطار، و`--docker`، وقد تحققنا من تطابق بتي بين رندرين | seek لكل إطار (useCurrentFrame) | حتمية بالتصميم | حتمية |
| الأنسب لـ | موشن جرافيكس يولّده Claude وكابشن ومشاهد مستقلة | تطبيقات فيديو برمجية كبيرة وقوالب React | رسوم تعليمية/شرح | اللمسات اليدوية النهائية والـVFX |

**القرار (محدَّث حسب طلب المستخدم):** محرّكان رئيسيان جنباً إلى جنب:
- **HyperFrames** للمشاهد التي يولّدها Claude بسرعة (HTML/GSAP، بلا build).
- **Remotion** للقوالب المتكررة ذات البيانات (React props، charts، تجميع timeline كامل كما في AIEV حيث HyperFrames → Remotion).

ffmpeg للتجميع النهائي في الحالتين. والتحويل بين المحركين ممكن عبر skill `/remotion-to-hyperframes` الرسمية. انتبه لشرط رخصة Remotion: إذا زاد فريقك عن 3 موظفين تحتاج Company License.

---

## 6. خارطة طريق 4 أسابيع

| الأسبوع | الهدف | مخرجات قابلة للقياس |
|---|---|---|
| **1 — الأساسات** | تثبيت كل شيء، وفهم عقد التكوين، وأول رندر عربي | `hyperframes doctor` كله ✓، وإعادة إنتاج اختبارنا (عنوان عربي كلمة بكلمة)، و3 مشاهد من templates (عنوان، lower-third، CTA)، وقراءة `npx hyperframes docs *` |
| **2 — التفريغ والقصّ** | WhisperX عربي، وقصّ الصمت والحشو، وEDL | `transcribe.py` يعطي words.json، وقاموس حشو عربي، و`cuts.json` ثم `aroll.mp4` بقصّات نظيفة (لا طقطقة، مع crossfade 10–20ms)، وschema لـ`edl.json` |
| **3 — المشاهد والكابشن** | Skills: scene-builder وbrand-motion وarabic-captions | `brand.json` مع خطين عربيين محليين، ومكتبة 8 قوالب، وكابشن كلمة نشطة متزامن مع words.json، و`check` يمر على كل مشهد |
| **4 — التجميع والتسليم** | render-export وqa-gate والنسخ الثلاث | `assemble.sh` (overlay + موسيقى + ducking + loudnorm)، وتصدير 9:16 و1:1 و16:9، وتشغيل كامل على حلقة حقيقية من 60–90 ثانية، وقياس الوقت الكلي، ثم تحسين الـskills بناءً على الأخطاء |

---

## 7. نتائج الاختبار الفعلي في الـsandbox

**البيئة:** Linux x64، 4 أنوية، 15.7GB RAM، Node v22.22.2، بلا GPU. المجلد:
`/tmp/claude-0/-home-user--alrabiya-prestntaion/86361e0e-fe06-547a-bf25-0b60d960019a/scratchpad/team/hf-test`

### 7.1 ما واجهناه وكيف حللناه
| العائق | الحل |
|---|---|
| لا يوجد `ffmpeg` في النظام، وffmpeg الخاص بـPlaywright محدود (VP8 فقط) | `pip install imageio-ffmpeg` ثم symlink إلى `/usr/local/bin/ffmpeg` (ffmpeg 7.0.2 static) |
| لا يوجد `ffprobe`، وفحص `doctor` فشل: "FFprobe is required" | `npm install @ffprobe-installer/ffprobe` ثم symlink إلى `/usr/local/bin/ffprobe` |
| Chrome Headless Shell غير محمّل | `export HYPERFRAMES_BROWSER_PATH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` (HeadlessChrome/141)، بلا تحميل |
| `init` يحاول فحص الـskills على GitHub | `HYPERFRAMES_SKIP_SKILLS=1` |
| GSAP من CDN والخط من Google Fonts (قد تُحجب الشبكة، وهذا يخالف مبدأ الحتمية) | `npm i gsap@3 @fontsource/ibm-plex-sans-arabic` ثم نسخ `gsap.min.js` (3.15.0) وملفات woff2 (500/700) إلى `assets/` |
| **lint error:** `html_dir_attribute_breaks_render` | إزالة `dir="rtl"` من `<html>` ووضع `direction: rtl` على `#headline` و`#sub` |

### 7.2 الأوامر الفعلية
```bash
cd .../hf-test
npm init -y && npm install hyperframes@0.8.95
export HYPERFRAMES_BROWSER_PATH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
export HYPERFRAMES_SKIP_SKILLS=1
npx hyperframes doctor
npx hyperframes init arabic-test --example blank --resolution portrait --non-interactive
# (تحرير arabic-test/index.html: خط محلي، GSAP محلي، span لكل كلمة)
cd arabic-test
../node_modules/.bin/hyperframes lint        # 0 errors, 1 warning (nested_structure_needs_subcomposition)
../node_modules/.bin/hyperframes check       # Check passed: Runtime 0 · Layout 0 · Motion 0 · Contrast 18/18 AA
../node_modules/.bin/hyperframes render -o ../arabic-test-3s-1080x1920.mp4 --fps 30 --quality delivery
```

**مخرجات الرندر:** `401.4 KB · 3.0s video · rendered in 7.2s · beginframe capture · software gpu · 2 workers · 90 frames`
**ffprobe:** `h264 · 1080x1920 · yuv420p · 30/1 · duration=3.000000`

### 7.3 التحريك (المقتطف الأساسي)
```html
<h1 id="headline">
  <span class="w">الذكاء</span> <span class="w">الاصطناعي</span> <span class="w">يصنع</span> <span class="w">المونتاج</span>
</h1>
<script>
  const tl = gsap.timeline({ paused: true });
  tl.fromTo("#headline .w", { opacity: 0, y: 60 },
            { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.22 }, 0.2);
  window.__timelines["main"] = tl;
</script>
```
`.w { display:inline-block; white-space:nowrap }`، أي span لكل **كلمة** ولا تقسيم للحروف.

### 7.4 التحقق البصري
- `frame-0.6s.png`: أول كلمتين "الذكاء الاصطناعي" تظهران، والثانية في منتصف الـfade. **الترتيب RTL صحيح، والحروف موصولة سليمة.**
- `frame-2.5s.png`: العنوان كاملاً على سطرين مع العنوان الفرعي "اختبار HyperFrames".
- ملاحظة: كلمة "HyperFrames" رُسمت بخط بديل، لأن ملف `arabic` subset من Fontsource لا يحتوي حروفاً لاتينية. **الحل:** أضف ملف `latin` subset للعائلة نفسها بـ`unicode-range`.

### 7.5 اختبار الحتمية
رندرنا المشروع نفسه مرتين، وأعطى `ffmpeg -f framemd5` على الملفين hash موحّداً `ca8630327fcc04fe6aad377e74662ccf`. **الإطارات متطابقة بتاً ببت.** ✅

### 7.6 اختبار قاعدة `dir="rtl"`
أعدنا الرندر مع `<html dir="rtl">` لاختبار ادعاء الـlinter. **في بيئتنا (0.8.95 + HeadlessChrome 141) لم يخرج الفيديو فارغاً**: `rtl-frame.png` سليم وYMAX=245. أي أن الخلل يعتمد على الإصدار أو البيئة ولم يظهر هنا. **مع ذلك نلتزم بالقاعدة**، لأن الـlinter يصنّفها "confirmed, silent failure"، والرندر ليس strict افتراضياً، فالخطأ قد يمرّ بصمت. في الإنتاج استخدم `render --strict`.

### 7.7 لم نختبره
- WhisperX / whisper-cpp على صوت عربي: لا يوجد ملف صوتي، وwhisper-cpp غير مثبّت.
  **ملاحظة مهمة:** `hyperframes transcribe` يختار Parakeet تلقائياً (`--engine auto`) إذا كان مثبّتاً، لكن Parakeet يغطي "English + 25 European languages" حسب الحزمة، **أي لا يدعم العربية.** للعربية استخدم `--engine whisper --model large-v3 --language ar`، أو WhisperX خارجياً ثم استورد النتيجة (`transcribe` يقبل ملفات `.json/.srt/.vtt`).
- `--docker` (الـDocker daemon لا يعمل هنا).
- auto-editor 29.3.1 مثبّت، وأعلامه التي تحققنا منها: `--edit` (افتراضياً audio)، و`-m/--margin` (افتراضياً 0.2s)، و`--when-silent`، و`-ex/--export`، و`-o`، و`--cut-out`. قيم `--export` (premiere/resolve/…) ⚠️ لم أتحقق منها.

### 7.8 ملفات الناتج
| الملف | الوصف |
|---|---|
| `hf-test/arabic-test-3s-1080x1920.mp4` | الرندر الأساسي (3s، 1080×1920، H.264) |
| `hf-test/frame-0.6s.png` | إطار أثناء ظهور الكلمات |
| `hf-test/frame-2.5s.png` (+ `frame-2.5s-small.png`) | الإطار النهائي |
| `hf-test/rerun.mp4` | الرندر الثاني لإثبات الحتمية |
| `hf-test/rtl-test.mp4` + `rtl-frame.png` | اختبار `dir="rtl"` |
| `hf-test/arabic-test/` | مشروع HyperFrames كامل (index.html، CLAUDE.md الرسمي، assets) |

---

## 8. توصيات تنفيذية فورية
1. قالب مشروع موحّد: GSAP وخطوط **محلية**، و`check` إلزامي قبل كل رندر، و`render --strict` في الإنتاج.
2. للتفريغ العربي: WhisperX large-v3 مع محاذاة `jonatasgrosman/wav2vec2-large-xlsr-53-arabic`، ثم تصحيح بشري سريع للأسماء والمصطلحات قبل بناء الكابشن.
3. الكابشن داخل HyperFrames (HTML/GSAP) وليس ASS، لأن التحكم بالـRTL والكلمة النشطة والهوية البصرية أفضل.
4. رندر المشاهد كـ`--format mov` (ProRes 4444 بقناة ألفا) ثم overlay بـffmpeg فوق الـa-roll، حتى تُعاد المشاهد المتغيرة فقط.
5. تكوين مستقل لكل نسبة عرض (9:16 و1:1 و16:9) بدل قصّ الإطار، لأن الكابشن والعناوين تحتاج إعادة تخطيط.

---

## 9. منهجيتان في معمارية واحدة

طلب المستخدم (من تفريغه للفيديوهين) أن يدعم النظام منهجيتين. التصميم الذي نقترحه: **كلاهما يقرأ ويكتب نفس `edl.json`**، فيبدأ المسار الآلي بالمسودة الأولى، ثم يكمل المسار التفاعلي عليها.

```
                       ┌──────────── Google Drive (rclone / Drive MCP) ────────────┐
                       ▼                                                           │
 ┌─────────────── (1) Agentic Pipeline — آلي ليلاً/بالدفعات ───────────────┐       │
 │ ingest → WhisperX(GPU) / mlx-whisper(M-series) → autocut.py plan          │      │
 │ (صمت + حشو + تأتأة + retakes: احتفظ بآخر take) → edl.json                 │      │
 │ → مشاهد HyperFrames/Remotion → ffmpeg assemble → captions → 3 نسب         │      │
 │ → thumbnails A/B (3 خيارات) → Blotato MCP/API → YouTube/TikTok/IG…        │      │
 └──────────────────────────────┬───────────────────────────────────────────┘      │
                                │ نفس edl.json                                      │
 ┌──────────────────────────────▼─── (2) Interactive MCP Editing — حواري ─────┐     │
 │ Claude Code ⇄ MCP server(timeline) ⇄ تطبيق المونتاج / edl.json            │     │
 │ skill "edit-video": first-pass cuts → auto-zoom على النقرات → تبديل layout │     │
 │ → highlight → إملاء صوتي "اعمل chart لهذا الرقم" → مشهد 9:16                 │     │
 │ → Claude يسجّل B-roll للشاشة بنفسه (Playwright recordVideo + click log)    │     │
 └────────────────────────────────────────────────────────────────────────────┘     │
```

### 9.1 المنهجية (1): الخط الآلي (Agentic)

**الـstack:** Python 3.12 (عبر `uv`) + Node.js 22 + FFmpeg، وClaude Code هو الـorchestrator.

**التفريغ على GPU. عبارة "Whisper M1XD" على الأرجح تعني أحد خيارين، وندعم الاثنين:**

| العتاد | المحرك | الأمر (✅ من PyPI README) |
|---|---|---|
| NVIDIA (CUDA 12.8) | **WhisperX** (faster-whisper + محاذاة wav2vec2) | `whisperx audio.wav --model large-v3 --language ar --output_format json` (`--compute_type int8 --device cpu` بدون GPU) · Python `>=3.10,<3.14` |
| Apple Silicon (M1–M4) | **mlx-whisper** 0.4.3 | `mlx_whisper.transcribe(f, path_or_hf_repo="mlx-community/whisper-large-v3-mlx", word_timestamps=True, language="ar")` ⚠️ اسم الـrepo بالضبط: تحقق منه في مجموعة mlx-community |
| بديل مدمج | `npx hyperframes transcribe` | ⚠️ Parakeet لا يدعم العربية، فاستخدم `--engine whisper --model large-v3 --language ar` |

**خوارزمية حذف الصمت والإعادات (retakes)، منفَّذة ومختبرة في `pipeline/autocut.py`:**
1. **تطبيع عربي** لكل كلمة: حذف التشكيل والتطويل، وتوحيد (أ/إ/آ/ٱ → ا)، (ى → ي)، (ة → ه)، وحذف علامات الترقيم.
2. **الحشو**: يُحذف فقط ما يطابق نمطاً صارماً (اممم، اهه، ممم، um…). كلمة "يعني" **لا تُحذف آلياً** لأنها قد تحمل معنى. هذا القرار متروك لـClaude أو للمحرر.
3. **تقسيم إلى جمل (utterances)** عند سكتة أطول من `--utt-gap` (0.7s) أو علامة `. ! ? ؟`.
4. **التأتأة داخل الجملة**: n-gram مكرر مباشرة (n=3..1) مثل "عن عن"، فتُحذف النسخة الأولى.
5. **الإعادات بين الجمل (keep last take)**: تُقارن كل جملة A مع الجمل الثلاث التالية B (`--lookahead`) بـ`difflib.SequenceMatcher` على الكلمات المطبَّعة:
   - `prefix_sim = ratio(A, B[:len(A)+1]) ≥ 0.7` تعني بداية خاطئة (false start)
   - `full_sim = ratio(A, B) ≥ 0.75` تعني إعادة كاملة

   في الحالتين تُحذف A ونحتفظ بـB (الأحدث). وكل قرار يُسجَّل في `retake_decisions` مع النسب، ليراجعه المحرر.
6. **علامات صريحة**: عبارات مثل "خليني أعيد" أو "من جديد" أو "كات" تحذف الجملة التي فيها والجملة السابقة لها.
7. **مقاطع الإبقاء**: الكلمات المتبقية المتتالية التي بينها فجوة ≤ `--keep-gap` (0.35s) تُدمج في مقطع واحد. ثم يُضاف هامش `pre=0.06s` و`post=0.12s` بدون تداخل بين المقاطع.
8. **الـEDL**: يحتوي `segments` (توقيت المصدر والإخراج) و`removed` (مع السبب) و`captions_words` (الكلمات بتوقيت الإخراج الجديد، تذهب مباشرة لـskill الكابشن).
9. **الرندر**: `trim/atrim + concat` في filter_complex، مع `afade` مدته 10ms على كل طرف لمنع الطقطقة.

**Remotion محرك رئيسي ثانٍ (✅ جرّبناه):**
```bash
npx create-video@latest --yes --blank my-remotion     # non-interactive (راجع --help: قوالب --tiktok --audiogram --prompt-to-video …)
cd my-remotion && npm i
npm run dev                                            # = remotion studio
npx remotion render <CompositionId> out/video.mp4      # ما استخدمناه فعلياً
npx remotion render <CompositionId> out/video.mp4 --browser-executable=/path/to/chrome   # للمتصفح المحلي
```
- الإصدار: `remotion@4.0.530` و`react@19.2.3`. للخطوط استخدم `@remotion/fonts` → `loadFont({family,url:staticFile(...)})`.
- **الرخصة (✅ LICENSE.md):** مجانية للفرد، ولشركة ربحية حتى **3 موظفين**، ولغير الربحية. ما فوق ذلك يحتاج **Company License** من remotion.pro/license (⚠️ السعر غير منشور في LICENSE). ومخرجات `create-video` نفسها تطبع: "Remotion is free for teams of up to 3".

**الاستيراد من Google Drive:**
```bash
# rclone: الخيار الأبسط والأقوى للملفات الكبيرة ⚠️ (أوامر rclone القياسية، لم تُختبر هنا)
rclone config                                   # أنشئ remote اسمه gdrive من نوع "drive" (OAuth في المتصفح)
rclone copy "gdrive:Footage/EP01" ./projects/ep01/raw --progress --transfers 4
rclone copy ./projects/ep01/exports "gdrive:Deliveries/EP01" --progress
```
بديل: Google Drive connector في claude.ai، أو MCP server لـDrive يُضاف بـ`claude mcp add`. ⚠️ اختر خادماً موثوقاً، وأعطه صلاحية قراءة مجلد المشروع فقط.

**النشر عبر Blotato:**
```bash
claude mcp add --transport http blotato https://mcp.blotato.com/mcp --header "blotato-api-key: $BLOTATO_API_KEY"
# أو بـOAuth: claude mcp add --transport http Blotato https://mcp.blotato.com/mcp
```
- (✅ من صفحات blotato.com في نتائج البحث) خادم MCP مستضاف، يغطي 9 منصات: YouTube وTikTok وInstagram وX وLinkedIn وFacebook وThreads وBluesky وPinterest. يعمل عبر الـAPIs الرسمية، والترويسة `blotato-api-key`.
- ⚠️ أسماء الأدوات الدقيقة (مثل `create_post`) والأسعار: راجع help.blotato.com/api/mcp/tools (محجوب من الـsandbox).
- **قاعدة أمان:** النشر يكون **draft/scheduled** دائماً، ولا يُنشر نهائياً إلا بموافقة صريحة من المحرر (نقطة توقف ◆).

**اختبار الصور المصغّرة (YouTube Test & Compare):**
- المسار: YouTube Studio ← Content ← الفيديو ← Thumbnail ← ⋮ ← **Test & Compare**، ثم ارفع حتى **3** صور.
- معيار الحكم: **نسبة وقت المشاهدة (watch-time share)**. الخيار الفائز يُعلَم "Winner" إذا كان الفرق ذا دلالة إحصائية، وإلا "Preferred". ✅ support.google.com/youtube/answer/16391400
- ⚠️ الميزة من داخل Studio، ولم أجد لها API عامة. دور Claude هنا توليد 3 صور مصغّرة مختلفة **فعلاً** (وجه/نص/لون)، عبر HyperFrames `render --format png-sequence`، أو `snapshot`، أو قالب Remotion `--still`، ثم يرفعها المحرر يدوياً.

### 9.2 المنهجية (2): التحرير التفاعلي عبر MCP

**"Broomi":** لم أجد أداة بهذا الاسم (بحثت في الويب ومستودعات MCP). ⚠️ المرشحون الأقرب، وكلها تطابق الوصف (Claude يحرّر timeline تطبيق عبر MCP، مع zoom على النقرات):

| الأداة | ما تحققنا منه |
|---|---|
| **OpenScreen + openscreen-mcp** (https://github.com/hadiindrawan/openscreen-mcp) ✅ | أدوات `analyze_recording` (نقرات، توقفات، كلام)، و`add_zoom`، و`cut_range`، و`add_text`، و`add_blur`، و`set_speed`، و`add_sounds_on_clicks`، و`transcribe`. التسجيل: `claude mcp add --scope user openscreen -- node ~/openscreen-mcp/dist/index.js`. يجب إغلاق التطبيق أثناء التحرير |
| **Palmier Pro** (macOS) ⚠️ | محرر فيديو بداخله MCP server في الـtimeline (من نتائج البحث فقط) |
| **Screen Studio** ⚠️ | يوجد طلب "Claude Code plugin to edit a recorded video" على hub.screen.studio (الصفحة محجوبة، فلم أتأكد هل صدر أم لا) |

**توصيتنا:** لا نربط الخط بتطبيق مغلق. نبني **MCP server خاصاً بنا فوق `edl.json`**. نسخة أولية تعمل: `pipeline/timeline_mcp.py`، على mcp 2.2.0 وPython SDK، باستخدام `MCPServer`.
> ⚠️ في `mcp>=2` تغيّر اسم `FastMCP` إلى `MCPServer`. اكتشفنا هذا أثناء الاختبار.

```bash
claude mcp add --transport stdio timeline -- python pipeline/timeline_mcp.py projects/ep01/edl.json
```
الأدوات: `describe_timeline` و`cut_range(rec_start, rec_end)` و`add_zoom(rec_start, rec_end, x, y, scale)` و`add_overlay(rec_start, duration, composition, variables)` و`render_preview()`. ✅ اختبرناها كلها، ومعها handshake كامل عبر stdio (`initialize` + `tools/list`).

**skill `edit-video` (للتفاعلي)، خطواتها:**
1. **First-pass cuts**: تشغيل `autocut.py plan`، ثم عرض `retake_decisions` على المحرر.
2. **Auto-zoom على النقرات**: من `clicks.json` (Playwright) أو من `analyze_recording` (OpenScreen)، تُضاف `add_zoom` لكل نقرة، مدتها 1.2–2s، وscale من 1.4 إلى 1.8، مع ease وفترة تهدئة بين الزومات.
3. **تبديل الـlayout**: قوالب HyperFrames `layout-full` و`layout-split` (وجه + شاشة) و`layout-pip`، وتبديلها يتبع علامات الكلام في الـEDL.
4. **Highlight**: `add_overlay` لقالب `highlight-box` على إحداثيات عنصر من DOM (Playwright يعطيها بدقة).
5. **إملاء إلى موشن جرافيكس**: المحرر يقول مثلاً "حوّل النسبة 37% إلى chart عمودي". Claude يستخرج الرقم من `captions_words`، ثم `npx hyperframes add data-chart` (✅ block موجود في الـcatalog)، ثم `--variables`، ثم `add_overlay`.
6. **B-roll يسجّله Claude بنفسه**: `pipeline/record_broll.mjs` (Playwright `recordVideo`)، ثم `clicks.json`، ثم `autozoom.py` يعيد تأطيره إلى 9:16 متتبعاً النقرات. ✅ اختُبر.

---

## 10. ابدأ الآن: خطوات اليوم الأول

> نفّذها بالترتيب. الأوامر المعلَّمة ✅ تحققنا منها من التوثيق الرسمي أو بالتشغيل.

### macOS (Apple Silicon)
```bash
# 0) الأساسيات
xcode-select --install
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node ffmpeg git rclone uv                            # node الحالي ≥ 22 · ffmpeg يشمل ffprobe
# 1) Claude Code ✅ (code.claude.com/docs/en/setup)
curl -fsSL https://claude.ai/install.sh | bash
claude --version && claude doctor
# 2) Python 3.12 عبر uv + التفريغ
mkdir -p ~/studio && cd ~/studio
uv python install 3.12
uv venv --python 3.12 .venv && source .venv/bin/activate
uv pip install mlx-whisper auto-editor mcp                        # Apple Silicon
# 3) مشروع HyperFrames ✅
npx hyperframes@latest doctor
npx hyperframes browser ensure
npx hyperframes init hf --resolution portrait --non-interactive
# 4) مشروع Remotion ✅
npx create-video@latest --yes --blank remotion && (cd remotion && npm i)
# 5) skills + MCP ✅
claude plugin marketplace add heygen-com/hyperframes
claude mcp add --transport http blotato https://mcp.blotato.com/mcp --header "blotato-api-key: $BLOTATO_API_KEY"
claude mcp add --transport stdio timeline -- python pipeline/timeline_mcp.py projects/ep01/edl.json
claude mcp list
```

### Windows 11 (NVIDIA)
```powershell
winget install OpenJS.NodeJS.LTS Git.Git Gyan.FFmpeg Rclone.Rclone astral-sh.uv   # ⚠️ تأكد أن node -v ≥ 22
irm https://claude.ai/install.ps1 | iex                     # ✅ Claude Code (أو: winget install Anthropic.ClaudeCode)
claude --version
mkdir $HOME\studio; cd $HOME\studio
uv python install 3.12
uv venv --python 3.12 .venv; .venv\Scripts\activate
# ثبّت CUDA Toolkit 12.8 أولاً (✅ متطلب WhisperX لـGPU)، ثم:
uv pip install whisperx auto-editor mcp
npx hyperframes@latest doctor; npx hyperframes browser ensure
npx hyperframes init hf --resolution portrait --non-interactive
npx create-video@latest --yes --blank remotion; cd remotion; npm i; cd ..
claude plugin marketplace add heygen-com/hyperframes
```

### ثم في كلا النظامين: هيكل `.claude` وأول تشغيل
```bash
mkdir -p .claude/skills/{arabic-captions,brand-motion,scene-builder,silence-cut,qa-gate,render-export,edit-video} \
         pipeline brand/fonts projects/ep01/{raw,work,renders,exports}
cp <مسار هذا التقرير>/pipeline/{autocut.py,autozoom.py,record_broll.mjs,timeline_mcp.py} pipeline/
# ضع CLAUDE.md (القسم 2.1) في الجذر، وSKILL.md لكل skill (القسم 2.2)
rclone copy "gdrive:Footage/EP01" projects/ep01/raw --progress
python pipeline/autocut.py transcribe projects/ep01/raw/take.mp4 -o projects/ep01/work/words.json --backend mlx      # أو whisperx
python pipeline/autocut.py plan projects/ep01/work/words.json projects/ep01/raw/take.mp4 -o projects/ep01/edl.json
python pipeline/autocut.py render projects/ep01/edl.json -o projects/ep01/work/aroll.mp4
claude      # ثم: "راجع edl.json، اعرض retake_decisions، وابنِ 3 مشاهد HyperFrames للأرقام الواردة"
```

مثال `SKILL.md` بسيط (`.claude/skills/silence-cut/SKILL.md`):
```markdown
---
name: silence-cut
description: Arabic first-pass cut. Use when the user asks to remove silences, fillers, stutters or retakes ("شيل السكتات", "احذف الإعادات") from a talking-head take.
---
1. If work/words.json is missing: `python pipeline/autocut.py transcribe <media> -o work/words.json --backend <mlx|whisperx>`
2. `python pipeline/autocut.py plan work/words.json <media> -o edl.json`
3. Show the user `retake_decisions` + total removed seconds. WAIT for approval. ◆
4. `python pipeline/autocut.py render edl.json -o work/aroll.mp4`, then run qa-gate.
Never auto-delete "يعني" / "طيب": propose them as optional cuts instead.
```

---

## 11. الكود العامل واختباره

**الملفات** (كلها في `scratchpad/team/pipeline/`):

| الملف | الوظيفة | الاختبار |
|---|---|---|
| `autocut.py` | transcribe (whisperx/mlx) → plan (صمت/حشو/تأتأة/retake) → EDL JSON → render (ffmpeg) | ✅ plan وrender. أما transcribe فلم يُختبر لأن huggingface.co محجوب ولا يمكن تنزيل النماذج |
| `make_test.py` | يولّد take اصطناعياً (20s، نغمات مكان الكلمات) مع `words.json` بصيغة WhisperX | ✅ |
| `timeline_mcp.py` | MCP server فوق edl.json | ✅ استدعاء الأدوات + stdio handshake |
| `record_broll.mjs` | Playwright recordVideo + click log | ✅ (Chromium 1194، playwright 1.56.1) |
| `autozoom.py` | reframe من 16:9 إلى 9:16 يتبع النقرات (ffmpeg crop expression) | ✅ |

**نتيجة اختبار `autocut.py` على الـtake الاصطناعي:**
```
input  : 20.0s  (24 كلمة: false start + take جيد + "اممم" + جملة فيها "عن عن" + "خليني أعيد" + take نهائي)
output : 2 segments, 6.64s, removed 12 words
  retake        : "مرحبا بكم في"  →  kept "مرحبا بكم في قناة الموشن."        (prefix 0.86 / full 0.75)
  retake        : "اليوم نتكلم عن عن الذكاء الاصطناعي" → kept "…في المونتاج." (prefix 0.91 / full 0.83)
  stutter1      : "عن"      filler: "اممم"      retake-marker: "خليني أعيد"
captions_words: مرحبا بكم في قناة الموشن. اليوم نتكلم عن الذكاء الاصطناعي في المونتاج.
silencedetect(-40dB, 0.4s) على الناتج: لا توجد سكتات
```

**حدود معروفة:**
- العتبات (0.7/0.75) ضُبطت على بيانات اصطناعية، ويلزم معايرتها على 3–5 حلقات حقيقية.
- الإعادة التي **تُعاد صياغتها** بكلمات مختلفة تماماً لن تُكتشف بالتشابه النصي. هنا يأتي دور Claude: يقرأ `words.json` كنص ويقترح قصّات دلالية تُضاف إلى `cuts.json`.
- عند مئات المقاطع يصبح `filter_complex` طويلاً. البديل حينها رندر كل مقطع منفصلاً ثم concat demuxer.
- في ffmpeg 7 يعمل `-filter_complex_script` لكنه قد يطبع تحذير deprecation.

**ملفات الاختبار الإضافية:**
- `remotion-test/remotion-arabic-3s.mp4` و`remotion-test/remotion-frame-2.5s.png`: Remotion، 1080×1920، التشكيل العربي سليم.
- `pipeline/take.mp4` (المصدر 20s) و`pipeline/aroll_cut.mp4` (بعد القص 6.64s) و`pipeline/edl.json`.
- `pipeline/broll/*.webm` و`clicks.json` و`pipeline/broll_9x16_autozoom.mp4`.

---

## 12. مصادر إضافية (للنطاق الموسّع)
- Claude Code install/setup: https://code.claude.com/docs/en/setup
- Claude Code MCP (`claude mcp add` و`--transport` و`--scope` و`.mcp.json`): https://code.claude.com/docs/en/mcp
- WhisperX (CLI، Python API، CUDA 12.8، Python <3.14): https://pypi.org/project/whisperx/ · https://github.com/m-bain/whisperX
- mlx-whisper: https://pypi.org/project/mlx-whisper/
- Remotion license: https://raw.githubusercontent.com/remotion-dev/remotion/main/LICENSE.md · create-video: `npx create-video@latest --help`
- Blotato MCP: https://www.blotato.com/mcp · https://www.blotato.com/ai-agent/claude-code · https://help.blotato.com/api/mcp/setup
- YouTube Test & Compare: https://support.google.com/youtube/answer/16391400
- OpenScreen MCP: https://github.com/hadiindrawan/openscreen-mcp
- MCP Python SDK v2 (FastMCP → MCPServer): https://py.sdk.modelcontextprotocol.io/v2/migration/
