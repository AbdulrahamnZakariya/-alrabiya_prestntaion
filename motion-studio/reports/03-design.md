# 03 — دستور التصميم والحركة (Design Bible & Motion Playbook)
### للمونتير العربي الذي يعمل بـ Claude Code (Opus 5.5) + HyperFrames + GSAP 3، ومعه Remotion (React 19)

> **الهدف:** فيديو «جميل مرعب»، أي أن يبدو مصمَّماً بقرار واعٍ لا منسوخاً من قالب.
> **التاريخ:** 2026-09-30. **الإصدارات التي اختبرتُها فعلياً:** `hyperframes@0.8.95`، `gsap@3.15.0`، `remotion@4.0.530` (مع `@remotion/gsap` و`@remotion/paths` و`@remotion/captions` بنفس الإصدار)، وChromium 141 headless.
> **مرفقات تم التحقق منها** في `team/03-design-assets/`:
> - `signature-moves.hyperframes.html`: الحركات العشر في تركيبة 1080×1920 مدتها 30 ثانية. نجحت في `lint` بلا أي خطأ، ونجح `snapshot` و`render`، واختبار الحتمية عند التقديم بترتيب عشوائي أعطى صوراً متطابقة بالبكسل 20 من 20.
> - `signature-moves.remotion.tsx`: المقابلات في Remotion، وتمر من `tsc --strict` بلا أخطاء.
> - `arabic-split-test.png`: دليل بصري على أن تقسيم الحروف يكسر الوصل العربي.
> - `lab-contact-sheet-*.jpg`: لقطات من الرندر.

الرموز المستخدمة: ✅ تحققتُ منه بنفسي (اختبار أو مصدر رسمي أو كود المصدر). 📐 قاعدة بيت (house rule) من خبرة التصميم، ليست معياراً منشوراً. ⚠️ المصادر متضاربة أو لم أتحقق منه كاملاً.

---

## 0. الخلاصة في 12 سطراً

1. **الفخامة قرار وليست زخرفة.** لون تمييز واحد، وخطّان فقط، وفرق أوزان حاد (300 مقابل 900)، ومنحنيات تسارع (eases) مختلفة داخل المشهد، وحركة تُطيع التسلسل الهرمي للمعلومة.
2. **العربية لا تُقسَّم إلى حروف أبداً.** `SplitText type:"chars"` يكسر الوصل (✅ اختبرته، انظر الصورة). حرّك بالكلمة أو السطر، أو اكشف النص بقناع `clip-path` من اليمين.
3. **`letter-spacing` لا يعمل على العربية في Chromium** (✅ اختبار). المواصفة CSS Text 3 تمنع تطبيقه إذا كان سيكسر الوصل. البديل هو الكشيدة (U+0640) أو محور الوزن في الخطوط المتغيرة (variable font axes).
4. **لا تضع `<html dir="rtl">` في HyperFrames** (✅ خطأ lint: `html_dir_attribute_breaks_render`). ضع `direction: rtl` على المشاهد وحاويات النص.
5. **منطقة المحتوى الآمنة الموحّدة في 9:16:** `x 120→960`، `y 220→1500`، أي صندوق 840×1280. للإعلانات على Meta: أعلى 269، أسفل 672، جانبان 65.
6. **التوقيت:** entrance يعني `.out` وexit يعني `.in` وmove يعني `.inOut`. الخروج أسرع من الدخول. مجموع الـstagger لا يتجاوز 500ms.
7. **القراءة العربية أبطأ:** 138±20 كلمة/دقيقة مقابل 228 للإنجليزية (IReST). أقصى ما يُطلب من المشاهد كلمتان في الثانية على الشاشة.
8. **الحتمية:** timeline واحد مُوقَف (`paused`)، و`fromTo` بدل `from`، وPRNG له بذرة (seed)، ولا `setTimeout` ولا `repeat:-1`، ولا CSS animations في Remotion.
9. **95% من الانتقالات قطع حاد**، ويبقى 2 أو 3 انتقالات «مؤثرة» للحظات المفصلية. القطع يكون على الإيقاع (`npx hyperframes beats`).
10. **الصوت نصف الفخامة:** الـwhoosh يبلغ ذروته عند أقصى سرعة للحركة، والـhit عند وصول العنصر (حوالي 30% من مدة `expo.out`)، وقبل الضربة الكبيرة صمت قصير.
11. **بوابة الجودة (QA gate)** في القسم 9: 30 بنداً رقمياً. أي بند يفشل يعني أن المشهد يُرفض.
12. **Claude يولّد** البنية والحركة والبيانات والتنويعات. **الإنسان يقرر** الذوق والقصة والصوت واللقطات والمراجعة اللغوية.

---

## 1. ما الذي يفصل الموشن الفاخر عن موشن القوالب؟

| «Slop» / قالب | فاخر |
|---|---|
| كل العناصر تدخل بـ`y:30, opacity:0, power2.out, 0.5s` | لكل عنصر فعل (verb) وظرف (ease). الأهم يتحرك أولاً وبأطول مدة |
| كل شيء في المنتصف بنفس الوزن | ارتكاز على الحواف، وشبكة ثابتة، ونقطتا تركيز على الأقل في كل مشهد |
| تدرّج بنفسجي-أزرق، وتوهّج نيون، ونص بتدرّج لوني | لون تمييز واحد، ورماديات مائلة نحو لون العلامة، ولا `#000` ولا `#fff` صافيين |
| Inter أو Poppins أو Cairo بوزن 700 في كل مكان | صوتان: خط عرض (display) معبّر وخط نص يتراجع، والفرق في الوزن حاد |
| crossfade بين كل المشاهد | قطع حاد على الإيقاع، والانتقال المؤثر يُحفظ للحظة التحوّل |
| حركة بلا توقف أو ثبات تام | بناء، ثم تنفّس فيه حركة محيطة واحدة، ثم حسم |
| مؤثرات صوتية عشوائية | الصوت مربوط بفيزياء الحركة (القسم 6.4) |
| نص يُقرأ في 1 ثانية ويبقى 0.8 ثانية | زمن البقاء محسوب من عدد الكلمات العربية (القسم 3.6) |

✅ القائمة مبنية على «Lazy Defaults» و«Guardrails» في دليل HyperFrames الرسمي (`skills/hyperframes-creative/references/house-style.md` و`motion-principles.md`)، ومكيّفة للعربية.

---

## 2. دستور العلامة (Design Bible)

### 2.1 الشبكة (Grid) 📐

**وحدة الأساس 8px.** سلّم المسافات: `8, 16, 24, 32, 48, 64, 96, 128, 192`.

#### عمودي 1080×1920 (9:16)
```
┌──────────────── 1080 ────────────────┐
│  TOP UI (status/profile)  0 → 220    │  ← لا نص مهم هنا
│ ┌─120─┬──────── 840 ────────┬─120─┐  │
│ │     │ 6 cols × 120 + 5×24 │     │  │  ← منطقة المحتوى: y 220 → 1500
│ │     │  عنوان / بيانات     │     │  │
│ │     │  CAPTION BAND       │     │  │  ← الكابشن: y 1180 → 1480
│ └─────┴─────────────────────┴─────┘  │
│  BOTTOM UI (caption/CTA)  1500→1920  │  ← خلفية فقط، أو وجه (لا نص)
└──────────────────────────────────────┘
```
- 6 أعمدة × 120px، وفاصل (gutter) 24px، وهامش جانبي 120px. هذا يعطي عرض محتوى 840px.
- خط العين (eye-line) للعنوان الرئيسي عند y≈640 إلى 760، أي الثلث العلوي من منطقة المحتوى.
- **لماذا 120px على الجانبين وليس 60 يساراً و120 يميناً؟** عمود أزرار التفاعل (الإعجاب والتعليق والمشاركة) يكون على اليمين في الواجهة الإنجليزية. ⚠️ لم أتحقق هل تعكسه تطبيقات TikTok وInstagram عند ضبط اللغة على العربية. لذلك نجعل الهامشين متساويين تحوّطاً.

#### أفقي 1920×1080 (16:9)
- title-safe بنسبة 80% (هامش 10%): `x 192→1728`، `y 108→972`. وaction-safe بنسبة 90% (هامش 5%). ✅ هذه قيم Studio في HyperFrames (Premiere defaults) من `skills/hyperframes-studio/SKILL.md`.
- 12 عموداً × 106px، وفاصل 24px، داخل عرض 1536px.
- في YouTube يُحجز آخر 5 إلى 20 ثانية لعناصر End screen. اترك نصف الإطار الأيمن نظيفاً أو صمّم له مكاناً.

### 2.2 المناطق الآمنة لواجهات المنصات (1080×1920)

| المنصة | أعلى | أسفل | يسار | يمين | المصدر والحالة |
|---|---|---|---|---|---|
| TikTok (عضوي) | 108 | 320 | 60 | 120 | ⚠️ أرقام متداولة في أدلة الطرف الثالث. TikTok Ads يقول إن المنطقة الآمنة **تتغير بطول الكابشن وبالإضافات التفاعلية** |
| Instagram Reels (إعلانات Meta) | 269 (14%) | 672 (35%) | 65 (6%) | 65 (6%) | ✅ نص Meta Ads Guide كما نقلته عدة مصادر: «leave roughly 14% top, 35% bottom, 6% sides». وحّدته Meta للـStories والـReels في 2026 |
| Instagram Reels (عضوي) | ≈220 | ≈420 | 60 | 120 | ⚠️ ممارسة شائعة، والواجهة العضوية أخف من الإعلانية |
| YouTube Shorts | 180 إلى 380 | 350 إلى 390 | 60 | 120 | ⚠️ المصادر متضاربة في الأعلى |
| **صندوقنا الموحّد (عضوي)** | **220** | **420** | **120** | **120** | 📐 يجمع الحالات الأشد لكل جهة في المحتوى العضوي |
| **صندوق الإعلانات الصارم** | **269** | **672** | **120** | **120** | 📐 صندوق 840×979 للنص والشعار والسعر في الإعلانات المدفوعة |

**قاعدة عملية:** افتح محرر المنصة الحقيقي على الهاتف بلغة عربية وإنجليزية، والتقط صورة شاشة لـReel منشور، واستخدمها طبقة تحقق (overlay) في مرحلة المراجعة. في HyperFrames تبقى الأدلة (guides) في Studio ولا تدخل ملف التركيبة. ✅ القاعدة من hyperframes-studio: «Any ruler or safe-box overlay lives in the preview pane, never inside the composition».

### 2.3 سلّم الخطوط (Type Scale) لحجم الفيديو

القاعدة الرسمية في HyperFrames للمشاهدة داخل الـfeed: body ≥32px، headlines ≥90px، labels ≥24px. ✅ (`typography.md`)

العربية تحتاج حوالي 10 إلى 15% حجماً إضافياً عن اللاتينية بنفس الـpx، لأن الجسم البصري (x-height المكافئ) أصغر، ولأن النقاط والتشكيل تحتاج ارتفاع سطر أكبر. 📐

| الدور | 9:16 (px) | 16:9 (px) | الوزن | line-height عربي | ملاحظة |
|---|---|---|---|---|---|
| Display XL (رقم أو كلمة بطلة) | 200 إلى 300 | 180 إلى 240 | 800 إلى 1000 | 1.1 إلى 1.25 | 1 إلى 3 كلمات فقط |
| Display (عنوان المشهد) | 110 إلى 150 | 120 إلى 160 | 700 إلى 900 | 1.35 إلى 1.45 | لا يتجاوز سطرين |
| H2 | 72 إلى 90 | 72 إلى 96 | 600 إلى 800 | 1.4 | |
| Caption / Body | 56 إلى 72 | 44 إلى 56 | 500 إلى 700 | 1.5 إلى 1.6 | الكابشن بين 600 و800 مع لوح خلفي أو ظل |
| Label / Kicker | 32 إلى 40 | 28 إلى 34 | 400 إلى 500 | 1.4 | لون `--muted` |
| Micro (مصدر أو تاريخ) | 28 | 24 | 400 | 1.4 | أصغر حجم مسموح |

- **النسبة:** 1.333 (Perfect Fourth) بدءاً من 36px: `36 · 48 · 64 · 85 · 113 · 151 · 201 · 268`. 📐
- **الـtracking:** اللاتيني في أحجام العرض يأخذ `-0.02em` إلى `-0.04em` ✅ (HyperFrames: «Tracking tighter than web»). **العربي: صفر دائماً** ✅ (القسم 3.3).
- **على الخلفيات الداكنة:** يبدو النص أثقل. خفّض وزن النص 50 (مثلاً 350 بدل 400)، وزد line-height بمقدار 0.05 إلى 0.1. ✅ (`typography.md` → Dark Backgrounds)

### 2.4 أزواج الخطوط العربية واللاتينية (مجانية، والترخيص متحقق منه)

✅ **الترخيص:** كل الخطوط التالية مرخّصة **SIL Open Font License (OFL)** حسب ملفات `METADATA.pb` في مستودع `google/fonts` الرسمي (اطّلعتُ على كل ملف). OFL يسمح بالاستخدام التجاري والتضمين في الفيديو والمواقع وبالتعديل. الممنوع هو بيع الخط نفسه منفرداً، واستخدام «الاسم المحجوز» (Reserved Font Name) لأي نسخة معدّلة.

✅ **الأوزان والمحاور** من `METADATA.pb`:

| # | العرض (Display) | النص (Text) | اللاتيني المرافق | الأوزان والمحاور | الشخصية والاستخدام |
|---|---|---|---|---|---|
| 1 | **Alexandria** | IBM Plex Sans Arabic | مدمج في Alexandria، أو IBM Plex Mono للأرقام | Alexandria: VF `wght 100–900` · Plex Arabic: 100 إلى 700 ثابتة | حديث وهندسي وفخم. **الزوج الافتراضي للعلامة** |
| 2 | **IBM Plex Sans Arabic** 700 | IBM Plex Sans Arabic 300/400 | IBM Plex Sans (VF `wght 100–700`, `wdth 75–100`) | 7 أوزان | مؤسسي، أخبار واقتصاد. عائلة واحدة بصوتين |
| 3 | **Cairo** 900 إلى 1000 | Readex Pro 400 | مدمج | Cairo: VF `wght 200–1000` + `slnt −11…11` · Readex: VF `wght 160–700` + `HEXP 0–100` | صدمة وجرأة: hooks ورياضة وتقنية. Readex مصمم للمقروئية |
| 4 | **Noto Kufi Arabic** 800 | Amiri 400 (نسخ، serif) | Amiri مدمج | Kufi: VF `wght 100–900` · Amiri: 400 و700 | كوفي مقابل نسخ: وثائقي وتاريخي وثقافي. هذا زوج serif مع sans حقيقي |
| 5 | **Tajawal** 800/900 | Tajawal 300 | مدمج | 200 إلى 900 ثابتة | خفيف واجتماعي، ممتاز للكابشن. بديله Almarai (300 إلى 800) |
| 6 | **Rubik** 800 | Rubik 400 | Space Mono للبيانات | VF `wght 300–900` (يدعم العربية) | ودود ومستدير: تعليم ومنتجات استهلاكية |
| + | El Messiri (VF `wght 400–700`) · Aref Ruqaa (400/700) · Lalezar (400) | | | | لمسات عرض فقط: اقتباس أو شعار حدث. لا تُستخدم للنص |

**تحذيرات:**
- ✅ **HyperFrames يضمّن مسبقاً 18 عائلة فقط، وكلها لاتينية أو يابانية.** أي خط عربي يجب أن يُضمَّن بـ`@font-face` يشير إلى ملف محلي، وإلا يظهر تحذير lint `font_family_without_font_face`، ويفشل الرندر السحابي إن تعذّر الوصول إلى Google Fonts. ضع ملفات `.ttf` أو `.woff2` في `fonts/` مع `font-display: block`.
- ✅ **قائمة الخطوط المحظورة** في HyperFrames لأنها «monoculture»: Inter, Roboto, Open Sans, Noto Sans, Lato, Poppins, Outfit, Sora, Playfair Display, Syne… لا تستخدمها للاتيني المرافق. استخدم IBM Plex Sans أو Space Grotesk (OFL ✅) أو المرافق المدمج في الخط العربي.
- 📐 **Cairo وTajawal هما «Inter العربي»** من كثرة الاستخدام. استخدمهما عن قصد، لا كخيار افتراضي.
- 📐 **لا تقرن خطين متشابهين،** مثل كوفيين هندسيين. اجعل التباين على محورين: كوفي مقابل نسخ، أو عريض مقابل مكثّف، أو sans مقابل mono.

### 2.5 أنظمة الألوان: 3 لوحات (نسب التباين محسوبة بصيغة WCAG ✅)

قواعد عامة: لون تمييز واحد، وخلفية ثابتة في كل المشاهد، والرماديات مائلة نحو لون العلامة، ولا `#000` ولا `#fff` صافيين. ✅ (house-style)

#### A) «ليل الزعفران» (Saffron Night): داكن فاخر للأخبار والاقتصاد والتقنية
| Token | Hex | الدور | التباين |
|---|---|---|---|
| `--bg` | `#0F0E13` | خلفية | |
| `--surface` | `#1A1820` | ألواح وبطاقات | |
| `--ink` | `#F4EFE6` | نص أساسي | 16.78:1 على bg |
| `--muted` | `#9A93A6` | تسميات | 6.50:1 |
| `--accent` | `#E8A33D` | تمييز واحد | 8.91:1 |
| `--accent-2` | `#D9674A` | سلبي أو هبوط (بيانات فقط) | 5.48:1 |
| `--line` | `#2A2733` | خطوط الشبكة | زخرفي |
> نص داكن `--bg` على `--accent`: 8.91:1 ✅. **ممنوع** `--ink` على `--accent` (1.88:1 ❌).

#### B) «رمل وحبر» (Sand & Ink): فاتح تحريري للثقافة والتعليم والوثائقي
| Token | Hex | التباين |
|---|---|---|
| `--bg` | `#F3ECE0` | |
| `--surface` | `#E7DDCC` | |
| `--ink` | `#1B1A17` | 14.82:1 |
| `--muted` | `#5E574B` | 6.08:1 على bg و5.31:1 على surface. عدّلتُه بعد أن فشل `#6B6457` بنسبة 4.35:1 على surface |
| `--accent` | `#0F5C4D` (أخضر عميق) | 6.73:1 |
| `--accent-2` | `#A63D26` | 5.39:1 |

#### C) «برتقالي الإشارة» (Signal Vermilion): جريء للسوشال والإطلاقات
| Token | Hex | التباين |
|---|---|---|
| `--bg` | `#101826` (كحلي) | |
| `--surface` | `#18243A` | |
| `--ink` | `#F7F3EA` | 16.06:1 |
| `--muted` | `#8B97AB` | 6.02:1 |
| `--accent` | `#FF5A36` | 5.73:1 |
| `--accent-2` | `#FFC857` | 11.56:1 |
> ⚠️ أبيض على `#FF5A36` = **3.10:1**، وهو يفشل للنص العادي. على الأزرار البرتقالية ضع نصاً بلون `--bg`: 5.73:1 ✅.

**ألوان البيانات:** الارتفاع بلون `--accent` والانخفاض بلون `--accent-2`. لا تعتمد على الأحمر مقابل الأخضر وحده: أضف سهماً أو إشارة ▲▼ لمن لديهم عمى ألوان. 📐

### 2.6 رموز الحركة (Motion Tokens)

#### المُدد (ms ↔ frames)
عند 30fps الإطار = 33.3ms، وعند 60fps الإطار = 16.7ms.

| Token | ms | @30fps | @60fps | الاستخدام |
|---|---|---|---|---|
| `--t-micro` | 100 | 3f | 6f | وميض أو tick أو تغيير لون |
| `--t-fast` | 200 | 6f | 12f | خروج، أو دخول عنصر ثانوي |
| `--t-base` | 400 | 12f | 24f | معظم الدخول |
| `--t-slow` | 700 | 21f | 42f | عنوان رئيسي، أو كشف بقناع |
| `--t-hero` | 1000 | 30f | 60f | لحظة البطل، أو قلب بطاقة |
| `--t-count` | 1600 | 48f | 96f | عدّاد، أو رسم خط بياني |
| `--t-cine` | 2000 إلى 5000 | 60 إلى 150f | 120 إلى 300f | دفع كاميرا بطيء، أو Ken Burns |
| `--stagger` | 60 إلى 140 | 2 إلى 4f | 4 إلى 8f | بين الكلمات أو العناصر، والمجموع لا يتجاوز 500ms ✅ |

✅ المرجع: Material 3 motion tokens من مستودع `material-web` (`tokens/versions/latest/sass/_md-sys-motion.scss`): short1–4 = 50/100/150/200ms، medium1–4 = 250 إلى 400ms، long1–4 = 450 إلى 600ms، extra-long1–4 = 700 إلى 1000ms. في الفيديو نميل إلى النصف الأعلى، لأن المشاهد لا يتفاعل بل يشاهد.

📐 **قاعدة الـ12 إطاراً:** أي معلومة رئيسية تحتاج دخولاً لا يقل عن 12 إطاراً عند 24/30fps (0.4 إلى 0.5 ثانية)، ثم ثباتاً لا يقل عن 12 إطاراً بعد الاستقرار قبل أي قطع. اللمسات الثانوية يمكن أن تكون 4 إلى 6 إطارات. ⚠️ هذه قاعدة بيت وليست معياراً منشوراً.

#### منحنيات التسارع (Easing): الأرقام مطابقة لمصادرها
✅ قيم `cubic-bezier` من مستودع easings.net (`src/easings.yml`)، و✅ قيم Material من `material-web`.

| Token | الإحساس | cubic-bezier | GSAP | Remotion |
|---|---|---|---|---|
| `ease-enter` | واثق وحاسم | `(0.16, 1, 0.3, 1)` easeOutExpo | `"expo.out"` | `Easing.bezier(0.16,1,0.3,1)` |
| `ease-enter-soft` | مهني | `(0.25, 1, 0.5, 1)` easeOutQuart | `"power3.out"` | `Easing.bezier(0.25,1,0.5,1)` |
| `ease-enter-std` | افتراضي | `(0.33, 1, 0.68, 1)` easeOutCubic | `"power2.out"` | `Easing.out(Easing.cubic)` |
| `ease-move` | انتقال بين موضعين | `(0.65, 0, 0.35, 1)` easeInOutCubic | `"power2.inOut"` | `Easing.bezier(0.65,0,0.35,1)` |
| `ease-move-strong` | مسح ودفع | `(0.76, 0, 0.24, 1)` easeInOutQuart | `"power3.inOut"` | `Easing.bezier(0.76,0,0.24,1)` |
| `ease-exit` | يرمي العنصر خارج الإطار | `(0.7, 0, 0.84, 0)` easeInExpo | `"expo.in"` | `Easing.bezier(0.7,0,0.84,0)` |
| `ease-exit-soft` | خروج هادئ | `(0.32, 0, 0.67, 0)` easeInCubic | `"power2.in"` | `Easing.in(Easing.cubic)` |
| `ease-pop` | ارتداد تجاوزي (overshoot) | `(0.34, 1.56, 0.64, 1)` easeOutBack | `"back.out(1.7)"` | `Easing.bezier(0.34,1.56,0.64,1)` |
| `ease-dream` | حالم ومحيطي | `(0.37, 0, 0.63, 1)` easeInOutSine | `"sine.inOut"` | `Easing.inOut(Easing.sin)` |
| `ease-m3-emph-decel` | Material للدخول | `(0.05, 0.7, 0.1, 1)` | `CustomEase` | `Easing.bezier(0.05,0.7,0.1,1)` |
| `ease-m3-emph-accel` | Material للخروج | `(0.3, 0, 0.8, 0.15)` | `CustomEase` | `Easing.bezier(0.3,0,0.8,0.15)` |
| `ease-mech` | ميكانيكي أو رقمي | متدرّج | `"steps(5)"` | `Math.floor` على التقدّم |

> ⚠️ مطابقة `power2` = Cubic و`power3` = Quart و`power4` = Quint هي تسمية GSAP (power1 = Quad). منحنيات GSAP الأصلية دوال رياضية، و`cubic-bezier` تقريب قريب منها وليس تطابقاً بالبكسل.

**تسجيل منحنيات العلامة في GSAP** (✅ اختبرته: `CustomEase.create` يقبل 4 أرقام bezier):
```js
gsap.registerPlugin(CustomEase);
CustomEase.create("brandOut",  "0.16,1,0.3,1");   // دخول
CustomEase.create("brandMove", "0.65,0,0.35,1");  // انتقال
CustomEase.create("brandExit", "0.7,0,0.84,0");   // خروج
```

**مسافات الحركة** 📐: `s = 24px`، `m = 64px`، `l = 160px`، `xl = full-bleed`. العنصر الصغير يتحرك مسافة صغيرة. النص الكبير لا يتحرك أكثر من 60% من ارتفاع سطره عند الكشف بقناع.

#### كتلة Tokens جاهزة للصق (`:root`)
```css
:root{
  /* palette A */
  --bg:#0F0E13; --surface:#1A1820; --ink:#F4EFE6; --muted:#9A93A6;
  --accent:#E8A33D; --accent-2:#D9674A; --line:#2A2733;
  /* type */
  --font-display:"Alexandria", sans-serif;
  --font-text:"IBM Plex Sans Arabic", sans-serif;
  --font-data:"IBM Plex Mono", monospace;
  /* grid & safe (9:16 organic) */
  --safe-top:220px; --safe-bottom:420px; --safe-side:120px; --gutter:24px; --u:8px;
}
```

---

## 3. قواعد الحركة الخاصة بالعربية

### 3.1 الاتجاه (RTL) للدخول والخروج 📐
| الموقف | في RTL |
|---|---|
| دخول نص أو عنصر | يأتي **من اليمين متجهاً يساراً**: `x: +N → 0` مع `.out` |
| خروج (استمرار في اتجاه القراءة) | يذهب **يساراً**: `x: 0 → −N` مع `.in` |
| «التالي» (slide/push) | المحتوى الجديد يدفع القديم نحو اليسار. أما «السابق» أو الرجوع فعكسه |
| كشف بالمسح (wipe) | من الحافة اليمنى: `clip-path: inset(0 0 0 100%) → inset(0 0 0 0)`، أي قصّ اليسار يتقلص |
| شريط تقدّم أو شريط بيانات | `transform-origin: 100% 50%` ثم `scaleX 0 → v` |
| رسم خط بياني | من نهاية المسار: `drawSVG: "100% 100%" → "0% 100%"` |
| لمعة ضوء (light sweep) | يمين إلى يسار |
| ترتيب الـstagger | ابدأ بالعنصر الأيمن أو الأول قراءةً، وليس بترتيب الـDOM إن اختلف |
| محور الزمن في الرسوم | **قرار تحريري:** لجمهور عربي خالص يمكن أن يجري الزمن من اليمين إلى اليسار، وللبيانات المالية الدولية أبقِه من اليسار إلى اليمين. المهم الاتساق في كل الفيديو |
| الدوران أو قلب البطاقة | اختر الإشارة بحيث تتحرك الحافة الأمامية في اتجاه القراءة (مثل تقليب صفحة كتاب عربي) |

✅ **HyperFrames:** لا تضع `dir` على `<html>`. الـlinter يصنّفه `error` بوصف «confirmed, silent failure» ينتج فيديو أسود. ⚠️ ملف الهندسة (04) لم يستطع إعادة إنتاج الفيديو الأسود في بيئته، لكننا نلتزم بالقاعدة. الصحيح:
```css
.scene, .caption, .world { direction: rtl; }   /* على الحاويات */
```
```html
<html lang="ar">  <!-- lang فقط -->
```
(✅ هكذا بُنيت تركيبة المختبر، ورُندرت إلى MP4 سليم مدته 30 ثانية.)

### 3.2 لا تقسيم إلى حروف أبداً ✅

![اختبار التقسيم](03-design-assets/arabic-split-test.png)

الاختبار في Chromium 141 بخط IBM Plex Sans Arabic أعطى:
- **(B) `SplitText type:"chars"`** ينتج «ال‌س‌ل‌ا‌م ع‌ل‌ي‌ك‌م»، أي أن كل حرف يتحول إلى شكله المنفصل. السبب أن SplitText يلف كل حرف في عنصر `inline-block`، والتشكيل (shaping) لا يعبر حدود هذا النوع من العناصر. المواصفة CSS Text 3 → «Shaping Across Element Boundaries» تنص على كسر التشكيل عند وجود padding أو margin أو border غير صفري، أو `vertical-align` غير افتراضي، أو حدّ عزل ثنائي الاتجاه (bidi isolation).
- **(C) `type:"words"`** سليم تماماً.

**البدائل الصحيحة:**
1. **بالكلمة:** `new SplitText(el, { type: "words" })`، أو ولّد `<span>` لكل كلمة بنفسك (الأفضل للكابشن).
2. **بالسطر:** اكتب الأسطر يدوياً بعناصر `<span class="line">`. لا تعتمد على `type:"lines"` لأنه يقيس التخطيط، وقياس الخط قبل تحميله يعطي فواصل أسطر خاطئة في الرندر المتوازي (✅ تحذير HyperFrames في `camera-cursor-tracking.md`).
3. **بالقناع:** كشف `clip-path` أو `overflow:hidden` مع `yPercent`، على الكلمة أو السطر كاملاً.
4. **تلوين جزء من كلمة:** عنصر `<span>` لوني فقط (بلا padding ولا transform) يحافظ عادة على الوصل. ⚠️ تحقق دائماً بـ`snapshot`.
5. **تأثير «فك التشفير» (decode/scramble) الحرفي ممنوع على العربية.** استبدله بتبديل كلمات كاملة أو بـglitch على الكتلة كلها.

### 3.3 التباعد والكشيدة ✅
- **`letter-spacing` لا أثر له على العربية في Chromium.** في الاختبار (D) لم يتغير شيء. CSS Text 3 §cursive-tracking: إن لم يستطع المتصفح التمديد دون كسر الوصل «must not apply spacing»، وتضيف المواصفة: «Authors should avoid applying letter-spacing to cursive scripts». **النتيجة: تحريك الـtracking على العربية لا يُنتج أي حركة.**
- **البديل للتمطيط:** الكشيدة بالتطويل (U+0640 `ـ`). حسب W3C Arabic Layout Requirements (alreq) تُستخدم الكشيدة بحذر: **واحدة في الكلمة**، وعند الوصلات المناسبة، والإفراط يعطي «لوناً» غير متساوٍ للنص. والتطويل عرضه ثابت ويعتمد على الخط (اختبار E).
- **بديل أفخم:** حرّك **محور الوزن** في خط متغير (`font-variation-settings`) لتأثير «تنفّس» الكلمة. Cairo يصل إلى 1000، وAlexandria من 100 إلى 900، وReadex Pro له محور `HEXP`. 📐 تذكير: `font-weight` يغيّر عرض النص فيعيد التخطيط، فاستخدمه على كلمة واحدة معزولة لا داخل فقرة.

### 3.4 الأقنعة والارتفاعات 📐
- للحروف العربية صواعد ونوازل عميقة ونقاط فوق وتحت. أي `overflow:hidden` أو `clip-path` على سطر يجب أن يأخذ **`padding-block: 0.08em–0.15em`** وأن يكون `line-height ≥ 1.4`، وإلا تُقصّ نقاط الياء والجيم (✅ هذه القيم في المختبر).
- التشكيل الكامل يحتاج `line-height ≥ 1.7`. تجنبه في الموشن إلا للنص القرآني أو الشعري.

### 3.5 الأرقام ✅
- **الأرقام تُكتب من اليسار إلى اليمين حتى داخل نص RTL** (W3C alreq: «numbers are written with the lowest significant digits to the right»). المتصفح يعالجها تلقائياً، لكن **العدّاد يجب أن يكبر من الخانة اليمنى**. ثبّت العرض بـ`font-variant-numeric: tabular-nums` أو بحاوية عرضها ثابت.
- **حدّد نظام الأرقام صراحة. لا تعتمد على الـlocale:**
  ```js
  new Intl.NumberFormat("ar-u-nu-arab").format(1234.5) // "١٬٢٣٤٫٥"  (Arabic-Indic + ٬ ٫)
  new Intl.NumberFormat("ar-u-nu-latn").format(1234.5) // "1,234.5"
  ```
  ✅ اختبار في Node: `ar-SA` و`ar-EG` يعطيان أرقاماً هندية (٨٧)، و`ar-AE` يعطي لاتينية (87). السلوك يختلف حسب الدولة، ولهذا نحدده دائماً.
- الفواصل العربية: `٫` (U+066B) عشرية، و`٬` (U+066C) آلاف. ولا تخلط نظامين في فيديو واحد.
- `٪` في سياق RTL يظهر على يسار الرقم (✅ ظهر هكذا في الرندر: «٨٧٪»).
- الأسماء اللاتينية داخل جملة عربية: لفّها بـ`<bdi>` أو `unicode-bidi: isolate` حتى لا تقفز علامات الترقيم. ⚠️ عزل bidi يكسر التشكيل عبر الحد، فلا تضعه داخل كلمة عربية.

### 3.6 زمن القراءة للعربية ✅ والمعادلة 📐
- **IReST (Trauzettel-Klosinski & Dietz, IOVS 2012):** سرعة القراءة الصامتة للعربية **138 ± 20 كلمة/دقيقة** (≈2.3 كلمة/ث)، وهي الأبطأ بين 17 لغة، مقابل 228 للإنجليزية.
- **Netflix Arabic Timed Text Style Guide:** حتى **20 حرفاً/ث** للبالغين و17 للأطفال.
- **المعادلة (قاعدة بيت):** نص ثابت بلا تعليق صوتي: `hold_s = max(1.5, 0.6 + words / 2.0)`. النص المتزامن مع الصوت: يكفي بقاؤه ما دام منطوقاً + 0.3 ثانية.
- جدول HyperFrames (✅ claude-design guide) للحد الأدنى لمدة المشهد: 1 إلى 3 كلمات → 2 إلى 3 ثوانٍ، و4 إلى 10 كلمات → 3 إلى 4 ثوانٍ، و11 إلى 20 كلمة → 4 إلى 6 ثوانٍ. **للعربية أضف حوالي 20%.** 📐

### 3.7 أنماط الكابشن العربي 📐 (مع ✅ حيث ذُكر)
| النمط | المواصفات |
|---|---|
| **Karaoke (الافتراضي)** | 3 إلى 6 كلمات في الصفحة، وسطر أو سطران، وحجم 64 إلى 76px، ووزن 700. الكلمة القادمة بشفافية 35%، والحالية `--accent` بتكبير 1.06 إلى 1.08، والماضية `--ink` |
| **Punch (hook)** | كلمة أو كلمتان بحجم 150px فأكثر، وتدخل بـ`back.out(1.7)` في 200 إلى 250ms |
| **Plate** | لوح `--surface` بشفافية 85% ونصف قطر 16 إلى 24px وحشوة 16/28px، يستخدم عند وجود لقطات مزدحمة |
| **Documentary** | IBM Plex Sans Arabic 500 بحجم 48px، بلا تمييز، مع ظل خفيف |

قواعد تقسيم الأسطر (لا تفصل بين):
- حرف الجر وما بعده: «في / البيت» خطأ.
- الرقم ووحدته: «٥٠ / مليون» خطأ.
- المضاف والمضاف إليه إن أمكن.
- النفي وفعله: «لم / يكن» خطأ.

طول السطر:
- في 16:9 لا يتجاوز 42 حرفاً للسطر (✅ حد Netflix للسطر في معظم اللغات).
- في 9:16 بحجم كبير: 18 إلى 26 حرفاً. 📐
- قسّم الصفحات على الأنفاس (توقف ≥250ms) وليس على المدة. ✅ HyperFrames embedded-captions: «Segment on breath, not on duration».

---

## 4. مبادئ الحركة: مبادئ ديزني الاثنا عشر مكيّفة للموشن

✅ المصدر الأصلي: Thomas & Johnston, *The Illusion of Life* (1981).

| المبدأ | في الموشن و‏UI | في GSAP |
|---|---|---|
| Squash & Stretch | الزر أو الرقم عند الارتطام | `scaleY:0.9, scaleX:1.06` لمدة 80ms ثم `back.out` |
| Anticipation | تراجع صغير قبل الانطلاق | `x:+12` بـ`power1.in` ثم `x:-400` |
| Staging | عنصر واحد في البؤرة | DOF blur على الباقي (`filter: blur(6–10px)`) |
| Straight-ahead vs Pose-to-pose | keyframes مقابل fromTo | `keyframes:{scale:[1,.88,1]}` |
| Follow-through & Overlap | الأجزاء لا تتوقف معاً | `stagger` مع زمن متداخل (`"<0.1"`) |
| Slow in / Slow out | كل الـeases | القسم 2.6 |
| Arcs | الحركة الطبيعية تسير على قوس | `MotionPathPlugin` أو x/y بمنحنيين مختلفين |
| Secondary action | حركة محيطة | توهج يتنفس أو نص شبحي ينجرف (بتكرار محدود) |
| Timing | الوزن = السرعة | سريع (0.15 إلى 0.3 ثانية) للطاقة، وبطيء (0.8 إلى 2 ثانية) للفخامة ✅ |
| Exaggeration | في الـhook فقط | overshoot بقيمة `back.out(2.2)` |
| Solid drawing | اتساق المنظور | `perspective` واحد لكل مشهد |
| Appeal | الذوق | لا يُبرمج. مسؤولية الإنسان (القسم 10) |

**بنية المشهد** ✅ (HyperFrames motion-principles):
- **Build (0 إلى 30%):** دخول متتابع.
- **Breathe (30 إلى 70%):** حركة محيطة واحدة.
- **Resolve (70 إلى 100%):** خروج أو حسم، والخروج أسرع من الدخول (مثلاً 0.4 ثانية للدخول و0.25 للخروج).
- لا تبدأ عند t=0: أخّر أول حركة 0.1 إلى 0.3 ثانية.
- لا تستخدم نفس الـease لأكثر من عنصرين مستقلين في المشهد.
- أبطأ مشهد يكون حوالي 3 أضعاف أسرع مشهد.

---

## 5. الحركات العشر المميّزة (Signature Moves)

**كل الأكواد التالية اختُبرت كما هي** في `03-design-assets/signature-moves.hyperframes.html`:
- `hyperframes lint`: صفر أخطاء.
- `snapshot` عند 20 نقطة زمنية.
- `render` إلى MP4 مدته 30 ثانية.
- اختبار الحتمية: التقديم بترتيب أمامي ثم عكسي ثم عشوائي أعطى صوراً متطابقة بالبايت، 20 من 20.

### 5.0 المقدمة المشتركة (مرة واحدة في كل تركيبة)
```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/DrawSVGPlugin.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/MorphSVGPlugin.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/CustomEase.min.js"></script>
```
```js
gsap.registerPlugin(SplitText, DrawSVGPlugin, MorphSVGPlugin, CustomEase);
CustomEase.create("brandOut", "0.16,1,0.3,1");
CustomEase.create("brandMove", "0.65,0,0.35,1");

// seeded PRNG: نفس البذرة = نفس «العشوائية» في كل إطار وكل worker
function mulberry32(seed){ return function(){ seed|=0; seed=(seed+0x6D2B79F5)|0;
  var t=Math.imul(seed^(seed>>>15),1|seed); t=(t+Math.imul(t^(t>>>7),61|t))^t;
  return ((t^(t>>>14))>>>0)/4294967296; }; }

var tl = gsap.timeline({ paused: true });
// ... الحركات ...
window.__timelines["main"] = tl;   // المفتاح = data-composition-id
```
✅ GSAP مجاني بالكامل بكل إضافاته (SplitText وMorphSVG وDrawSVG وCustomEase) منذ استحواذ Webflow، حتى للاستخدام التجاري، بترخيص «Standard no-charge» (نص README في حزمة `gsap@3.15.0`).

**عقد الحتمية** ✅ (hyperframes-core و`rules-index.md`):
- timeline واحد مُوقَف.
- `fromTo` بقيم مطلقة، ومع `immediateRender:false` عندما يعود تحريك نفس العنصر.
- لا `Math.random` ولا `Date.now` ولا `setTimeout` ولا `repeat:-1`.
- لا تحرّك `.clip` نفسه، بل عنصراً ابناً داخله.
- لا تحرّك `width` و`height` و`top` و`left`.
- لا CSS `transition` على عنصر متحرك.
- لا `transform` في CSS على خاصية سيحركها GSAP (lint: `gsap_css_transform_conflict`).

---

### ① Mask-Reveal Headline: كشف العنوان بمسح RTL وصعود السطر
**متى:** افتتاح المشاهد والعناوين. **المدة:** 0.8 إلى 1.0 ثانية، وstagger 0.14.
```html
<h1 class="headline">
  <span class="line"><span class="line-in">التصميم ليس</span></span>
  <span class="line"><span class="line-in">ما <span class="accent">تراه</span> فقط</span></span>
</h1>
<style>.line{display:block;overflow:hidden;padding-block:.08em}.line-in{display:block}</style>
```
```js
tl.addLabel("s1", 0);
tl.fromTo("#s1 .line", { clipPath: "inset(0% 0% 0% 100%)" },
  { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power3.inOut", stagger: 0.14 }, "s1+=0.2");
tl.fromTo("#s1 .line-in", { yPercent: 60, x: 40 },
  { yPercent: 0, x: 0, duration: 1.0, ease: "brandOut", stagger: 0.14 }, "s1+=0.2");
```
للغة اللاتينية فقط: `SplitText.create(el,{type:"lines,words", mask:"lines"})` (خيار `mask` موجود منذ 3.13 ✅ في كود المصدر). **لا تستخدمه على العربية بـ`chars`.**

### ② Counter Roll-up: عدّاد بأرقام عربية هندية
**متى:** الإحصاءات. **المدة:** 1.2 إلى 2.0 ثانية، مع `power3.out` لأن النهاية البطيئة تمنح «ثقل» الرقم.
```js
var s2 = { v: 0 }, s2El = document.getElementById("s2-num");
var fmtAr = new Intl.NumberFormat("ar-u-nu-arab");
tl.fromTo(s2, { v: 0 }, { v: 87, duration: 1.6, ease: "power3.out",
  onUpdate: function () { s2El.textContent = fmtAr.format(Math.round(s2.v)); } }, "s2+=0.25");
tl.fromTo("#s2 .stat", { scale: 0.92 }, { scale: 1, duration: 1.6, ease: "power2.out" }, "s2+=0.25");
```
CSS: `.stat{font-variant-numeric:tabular-nums}`. ضع القيمة الابتدائية «٠» في HTML حتى يكون الإطار صفر صحيحاً. ✅ التقديم للخلف أعاد «٠» في الاختبار.

### ③ Data Bar Race: سباق أعمدة RTL مع إعادة ترتيب
**متى:** المقارنات وتغيّر الترتيب. النمو 0.9 ثانية، ثم تبدّل الترتيب على نفس الإيقاع 0.9 ثانية.
```js
var data = [{name:"الرياض",a:62,b:71},{name:"دبي",a:80,b:66},{name:"القاهرة",a:45,b:90},{name:"عمّان",a:30,b:38}];
var ROW = 160, MAX = 100, box = document.getElementById("s3-bars");
var rankA = data.map(function(d,i){return i;}).sort(function(i,j){return data[j].a-data[i].a;});
var rankB = data.map(function(d,i){return i;}).sort(function(i,j){return data[j].b-data[i].b;});
data.forEach(function (d, i) {
  var row = document.createElement("div"); row.className = "row";
  row.innerHTML = '<span class="name">'+d.name+'</span><div class="track"><div class="fill"></div></div><span class="val">٠</span>';
  box.appendChild(row);
  var fill = row.querySelector(".fill"), val = row.querySelector(".val"), p = { v: 0 };
  var yA = rankA.indexOf(i) * ROW, yB = rankB.indexOf(i) * ROW, d0 = 0.2 + rankA.indexOf(i) * 0.08;
  tl.fromTo(row,  { y: yA, opacity: 0 }, { y: yA, opacity: 1, duration: 0.3, ease: "none" }, "s3+=" + (d0 - 0.05));
  tl.fromTo(fill, { scaleX: 0 }, { scaleX: d.a / MAX, duration: 0.9, ease: "power3.out" }, "s3+=" + d0);
  tl.fromTo(p, { v: 0 }, { v: d.a, duration: 0.9, ease: "power3.out",
    onUpdate: function(){ val.textContent = fmtAr.format(Math.round(p.v)); } }, "s3+=" + d0);
  tl.to(fill, { scaleX: d.b / MAX, duration: 0.9, ease: "brandMove" }, "s3+=1.6");   // race
  tl.to(p,    { v: d.b, duration: 0.9, ease: "brandMove",
    onUpdate: function(){ val.textContent = fmtAr.format(Math.round(p.v)); } }, "s3+=1.6");
  tl.to(row,  { y: yB, duration: 0.9, ease: "brandMove" }, "s3+=1.6");                // re-rank
});
```
CSS: `.fill{transform-origin:100% 50%}`، و`.row{position:absolute}`. لا يوجد أي قياس للـDOM، فكل المواضع ثوابت محسوبة مسبقاً ✅.

### ④ SVG Line Draw: رسم يبدأ من اليمين
```js
tl.fromTo("#s4-grid", { drawSVG: "100% 100%" }, { drawSVG: "0% 100%", duration: 0.6, ease: "power2.inOut" }, "s4+=0.1");
tl.fromTo("#s4-line", { drawSVG: "100% 100%" }, { drawSVG: "0% 100%", duration: 1.4, ease: "power2.inOut" }, "s4+=0.3");
tl.fromTo("#s4-dot",  { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.5, ease: "back.out(2.2)" }, "s4+=0.25");
```
بدون الإضافة: `stroke-dasharray` مع `getTotalLength()` عند الإعداد (✅ قاعدة `svg-path-draw`).

### ⑤ Glitch Cut: عشوائي ببذرة ومقيّد بالإطار
**متى:** «عاجل» والتحوّلات الحادة، **مرة واحدة فقط في الفيديو**. 9 إطارات عند 30fps (0.3 ثانية).
```js
(function () {
  var rnd = mulberry32(20260930), FPS = 30, N = 9, T0 = 12.2;
  for (var k = 0; k < N; k++) {
    var t = T0 + k / FPS, top = Math.floor(rnd()*70), h = 8 + Math.floor(rnd()*22), dx = Math.round((rnd()-0.5)*60);
    tl.set("#s5 .r", { x: dx,  clipPath: "inset(" + top + "% 0% " + Math.max(0,100-top-h) + "% 0%)" }, t);
    tl.set("#s5 .c", { x: -dx, clipPath: "inset(" + Math.max(0,top-10) + "% 0% " + Math.max(0,90-top-h) + "% 0%)" }, t);
    tl.set("#s5 .base", { x: Math.round(dx * 0.25) }, t);
  }
  tl.set("#s5 .r, #s5 .c", { x: 0, clipPath: "inset(0% 0% 100% 0%)" }, T0 + N / FPS);  // حسم نظيف
  tl.set("#s5 .base", { x: 0 }, T0 + N / FPS);
})();
```
البنية: ثلاث نسخ من الكلمة. طبقة أحمر `#FF3B3B` وطبقة سماوي `#2FE6FF`، كلتاهما `mix-blend-mode:screen`، ثم نسخة الأساس.
⚠️ **سلامة:** لا تعكس الإضاءة (invert أو ومضات بيضاء) أكثر من **3 مرات في أي ثانية** ✅ (WCAG 2.3.1 Three Flashes). الإزاحة اللونية لا تُعد ومضة، لكن الوميض الأبيض يُعد.

### ⑥ 3D Card Flip: قبل وبعد
```css
.flip-stage{perspective:1800px}.card{transform-style:preserve-3d}
.face{position:absolute;inset:0;backface-visibility:hidden}.face.back{transform:rotateY(180deg)}
```
```js
tl.fromTo("#s6-card", { rotationY: 0 }, { rotationY: 180, duration: 1.1, ease: "power3.inOut" }, "s6+=0.6");
tl.fromTo("#s6-wrap", { scale: 1 }, { keyframes: { scale: [1, 0.88, 1], ease: "sine.inOut" }, duration: 1.1 }, "s6+=0.6");
```
الدوران على `.card` والتصغير على الأب `.card-wrap`. **لا تضع تحويلين متعارضين على نفس العنصر** ✅ (motion-principles: «Never overlap conflicting transform tweens»).

### ⑦ Camera Push: دفع الكاميرا بتكبير «العالم»
```js
tl.fromTo("#s7-world", { scale: 1, x: 0, y: 0, transformOrigin: "50% 45%" },
  { scale: 1.18, x: 30, y: 40, duration: 3, ease: "power1.inOut" }, "s7");
tl.fromTo("#s7 .bgtype", { filter: "blur(0px)" }, { filter: "blur(10px)", duration: 3, ease: "power1.in" }, "s7");
```
📐 أقصى تكبير للنص 1.2 (أكثر من ذلك يبدو بكسلياً ويقترب من حواف المنطقة الآمنة). الصور تأخذ 1.03 إلى 1.08 (Ken Burns ✅). والتكبير على عنصر محدد يكون بمعادلة القسم 7.2.

### ⑧ Karaoke Caption: بالكلمة، مع توقيتات ASR
```js
var words = [ {w:"كل",s:0.20,e:0.45},{w:"كلمة",s:0.45,e:0.85},{w:"تضيء",s:0.85,e:1.30},
              {w:"لحظة",s:1.30,e:1.70},{w:"نطقها",s:1.70,e:2.30} ];   // من Whisper word timestamps
var box = document.getElementById("s8-kara");
words.forEach(function (d, i) {
  var sp = document.createElement("span"); sp.className = "kw"; sp.textContent = d.w;
  box.appendChild(sp); if (i < words.length - 1) box.appendChild(document.createTextNode(" "));
  tl.fromTo(sp, { opacity: 0.35, color: "#F4EFE6", scale: 1 },
    { opacity: 1, color: "#E8A33D", scale: 1.08, duration: 0.12, ease: "power2.out", immediateRender: false }, "s8+=" + d.s);
  tl.to(sp, { color: "#F4EFE6", scale: 1, duration: 0.2, ease: "power1.out" }, "s8+=" + d.e);
});
```
`.kw{display:inline-block}` مسموح لأنه يلف **كلمة كاملة**، والحدود بين الكلمات مسافات لا وصلات. بناء الـDOM يجري **متزامناً عند تحميل السكربت** (✅ HyperFrames يسمح بذلك).

### ⑨ Logo Morph: تحوّل الشعار
```js
tl.to("#s9-shape", { morphSVG: { shape: "#s9-target", shapeIndex: "auto" }, duration: 1.0, ease: "expo.inOut" }, "s9+=0.6");
tl.fromTo("#s9 .logo", { rotation: 0 }, { rotation: -90, duration: 1.0, ease: "expo.inOut" }, "s9+=0.6");
```
الأشكال الأولية (`circle` و`rect`) تُحوَّل إلى مسار بـ`MorphSVGPlugin.convertToPath()`. 📐 إذا كان الشعار معقداً فقسّمه إلى أجزاء بسيطة وحرّك كل جزء إلى نظيره.

### ⑩ Light Sweep: لمعة بلا جسيمات (RTL)
```html
<div class="plate" style="position:relative;overflow:hidden"><h2>اشترك الآن</h2><div class="sheen"></div></div>
<style>.sheen{position:absolute;top:-20%;bottom:-20%;right:0;width:35%;
  background:linear-gradient(100deg,transparent,rgba(255,240,220,.28),transparent);mix-blend-mode:screen}</style>
```
```js
tl.fromTo("#s10-plate", { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "brandOut" }, "s10+=0.15");
tl.fromTo("#s10-sheen", { xPercent: 120, skewX: -18 }, { xPercent: -420, skewX: -18, duration: 1.1, ease: "power2.inOut" }, "s10+=0.8");
```
لمعة داخل الحروف نفسها: استخدم `gradient-text-sweep` عبر `background-clip:text` مع تحريك `backgroundPosition` من `0%` إلى `100%`، فيتحرك الضوء من اليمين إلى اليسار. يجب أن **يستقر في النهاية على لون صلب** (✅ قاعدة HyperFrames).

---

### 5.11 المقابلات في Remotion (React 19)

✅ **القاعدة الحاكمة** (remotion.dev/docs/flickering وtroubleshooting/css-animations): Remotion يرندر الإطارات في تبويبات متوازية وبأي ترتيب. **كل حالة بصرية يجب أن تكون دالة نقية في `useCurrentFrame()`.** ممنوع CSS `animation` و`transition` و`@keyframes` و`setTimeout`. `random(seed)` مسموح لأنه ثابت.

✅ **الترخيص:** Remotion مجاني للأفراد وللشركات الربحية حتى **3 موظفين** وللمنظمات غير الربحية. الأكبر من ذلك يحتاج Company License (نص `LICENSE.md`).

كل الأكواد في `03-design-assets/signature-moves.remotion.tsx`، وتمر من `tsc --strict` بلا أخطاء مع `remotion@4.0.530`. ملخص المقابلات:

| الحركة | Remotion |
|---|---|
| ① Mask reveal | `interpolate(frame,[s,s+0.8*fps],[100,0],{easing:Easing.bezier(.65,0,.35,1), extrapolate*:'clamp'})`، ثم `clipPath: inset(0% 0% 0% ${wipe}%)` |
| ② Counter | `interpolate(...)` مع `Intl.NumberFormat("ar-u-nu-arab")` و`Math.round` |
| ③ Bar race | `interpolate` لـ`scaleX` و`translateY` على مصفوفة ترتيب محسوبة مسبقاً |
| ④ Line draw | `evolvePath(-p, d)` من `@remotion/paths`. **التقدّم السالب يرسم من نهاية المسار** ✅ (اختبرته: `evolvePath(-0.25)` أعطى dashoffset=125، أي آخر 25% من المسار) |
| ⑤ Glitch | `random(\`gx-${frame}\`)` ثابت لكل إطار |
| ⑥ Flip | `spring({frame, fps, delay, config:{damping:200}, durationInFrames})`، والقيمة `damping:200` تعني بلا ارتداد |
| ⑦ Camera | `interpolate(frame,[0,dur],[0,1],{easing:Easing.inOut(Easing.quad)})` |
| ⑧ Karaoke | `createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds:1200})` من `@remotion/captions`. **يشترط أن يبدأ نص كل token بمسافة** ✅ |
| ⑨ Morph | `interpolatePath(p, from, to)` من `@remotion/paths` |
| ⑩ Sweep | `interpolate` لـ`translateX` من `120%` إلى `-420%` |

**إعادة استخدام كود GSAP داخل Remotion:** ✅ `@remotion/gsap` (متاح منذ 4.0.517) عبر `useGsapTimeline(({timeline, selector}) => …)`. **قيوده أشد من HyperFrames:**
- **لا `onUpdate` ولا أي callback.**
- **لا تحريك لكائنات JS عادية** (مثل عدّاد `{v:0}`)، فهي تتجمد في الرندر. العدّاد يُكتب بـ`interpolate`.
- لا `play()` ولا `seek()`.
- لا `stagger:{from:"random"}`.
- لا `gsap.to` مستقل خارج الـtimeline.

لذلك: الحركات ① و④ و⑥ و⑦ و⑨ و⑩ تنتقل كما هي. أما ② و③ و⑧ فتُعاد كتابتها بـ`interpolate`.

```tsx
const EASE = { out: Easing.bezier(0.16,1,0.3,1), move: Easing.bezier(0.65,0,0.35,1) };
const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
// مثال: العدّاد
const v = interpolate(frame, [0.25*fps, 1.85*fps], [0, 87], { ...CLAMP, easing: Easing.out(Easing.cubic) });
<span style={{ fontVariantNumeric: 'tabular-nums' }}>{new Intl.NumberFormat('ar-u-nu-arab').format(Math.round(v))}</span>
```

---

## 6. قوالب بنية المشاهد

### 6.1 Reel بمدة 15 إلى 30 ثانية (9:16) 📐
| المرحلة | الزمن | المحتوى | الحركة | الصوت |
|---|---|---|---|---|
| **Hook** | 0 إلى 2 ثانية | 1 إلى 4 كلمات صادمة، أو رقم، أو صورة مستحيلة. **الإطار صفر ليس فارغاً** | ضربة حاسمة: Display XL بـ`back.out(1.7)` في 250ms، أو glitch، أو قطع مباشر على وجه | ضربة (hit) على الإطار 3 إلى 6، ثم صمت 150ms |
| **Promise** | 2 إلى 4 ثوانٍ | ما سيكسبه المشاهد | كشف بقناع ① | riser خفيف |
| **Body** | من 4 ثوانٍ حتى N−4 | 3 إلى 5 مشاهد (beats)، كل مشهد 2 إلى 5 ثوانٍ | لكل مشهد حركة مختلفة: ② ③ ④ ⑥ ⑦ ⑧ | قطع على الإيقاع، وwhoosh للدفع فقط |
| **Payoff** | N−4 إلى N−2 | الذروة: الرقم أو النتيجة | ② أو ⑥ مع دفع كاميرا ⑦ | sub-drop أو impact |
| **CTA / End card** | آخر ثانيتين | فعل واحد: تابع، أو احفظ، أو علّق بكلمة | ⑩ لمعة، والشعار ⑨ | tag صوتي للعلامة لا يتجاوز 1 ثانية |

✅ **مرجع HyperFrames:** Social reel بين 10 و15 ثانية = 5 إلى 7 مشاهد. Launch teaser بين 15 و25 ثانية = 7 إلى 10. Explainer بين 30 و60 ثانية = 10 إلى 18. **السقف 5 ثوانٍ للمشهد** إلا بمبرر.

### 6.2 فيديو أفقي 60 إلى 180 ثانية (16:9)
برد افتتاحي (cold open) مدته 3 إلى 5 ثوانٍ، ثم عنوان 1.5 ثانية، ثم فصول لكل منها بطاقة فصل (0.8 ثانية)، ثم ملخص، ثم End screen من 5 إلى 20 ثانية بعناصر YouTube.

### 6.3 الانتقالات على الإيقاع
- ✅ **95% قطع حاد**، ويبقى 2 إلى 3 انتقالات shader عند لحظات التحوّل. «استخدام الـshader في كل قطع مثل تغميق كل كلمة» (claude-design guide).
- ✅ مدة الانتقال لا تقل عن 0.3 ثانية، والأفضل 0.5 ثانية، ويتمركز على الحد بين المشهدين: `t = boundary − dur/2`. **لا تضع exit tween قبل الـshader**، فالـshader نفسه هو الخروج.
- ✅ `npx hyperframes beats` يكشف الإيقاعات ويكتب `beats/<audio>.json`. اقطع على **الضربة الأولى (downbeat)**، وابدأ حركات الدفع أو الـwhip قبلها بـ1/8 نبضة.
- 📐 المعنى: crossfade يعني «يستمر»، والقطع الحاد يعني «استيقظ»، والذوبان البطيء يعني «انجرف معي» ✅.

### 6.4 تصميم الصوت: أين يوضع كل صوت 📐
| الصوت | الموضع الدقيق |
|---|---|
| **Whoosh** | يبدأ قبل ذروة سرعة الحركة بـ4 إلى 8 إطارات، وقمته عند منتصف `inOut`، أي أسرع لحظة |
| **Hit / Impact** | على إطار **الوصول**. في `expo.out` يقطع العنصر 90% من مسافته عند حوالي **33% من المدة** (لأن 1−2^(−10·0.33) ≈ 0.90). لذا ضع الضربة عند `start + 0.3×duration`، وليس عند نهاية الـtween |
| **Riser** | من 1 إلى 2 مازورة (bar) قبل القطع الكبير، **وينتهي تماماً** على إطار القطع |
| **Air / صمت** | 100 إلى 300ms صمت أو خفض للموسيقى قبل الـhit الكبير. التباين يصنع الضخامة |
| **Ticks للعدّاد** | لا تزيد على 12 في الثانية، وتتباطأ مع الـease |
| **UI clicks** | متزامنة مع إطار الضغط (زوم الشاشة، القسم 7) |
| **Sub-drop** | عند كشف الشعار أو الرقم الأكبر فقط |
| **Ducking** | الموسيقى −10 إلى −15 dB تحت الصوت البشري |
| **Loudness** | ⚠️ الهدف الشائع للمنصات −14 LUFS integrated، والـtrue peak ≤ −1 dBTP. HyperFrames فيه `normalize-audio` لمطابقة الأصوات |

---

## 7. تصميم مونتاج تسجيلات الشاشة والشروحات (Tutorials)

### 7.1 الزوم التلقائي على نقاط التفاعل
✅ مرجع الصناعة: Screen Studio يولّد الزوم من مواضع النقرات. مدى التكبير 1.5x إلى 4x، والمنحنيات linear أو ease-in-out أو spring، وفيه «follow speed» و«padding».

📐 **مواصفاتنا:**

| المعامل | القيمة |
|---|---|
| مستوى التكبير | 1.6x إلى 2.2x (نص UI صغير: 2.0 إلى 2.5x، وسياق عام: 1.4x) |
| بداية الزوم | **قبل النقرة بـ0.45 ثانية**، حتى يصل المشاهد قبل الفعل |
| الدخول | 0.6 ثانية `power3.inOut` (`Easing.bezier(0.76,0,0.24,1)`) |
| الثبات | لا يقل عن 1.2 ثانية بعد النقرة، أو حتى ظهور نتيجة النقرة + زمن القراءة (القسم 3.6) |
| الخروج | 0.5 ثانية `power2.inOut`، وإن جاءت نقرة قريبة خلال 2.5 ثانية **فانتقل مباشرة بين نقطتي الزوم** دون الخروج |
| التكرار | لا أكثر من زوم واحد كل 3 إلى 4 ثوانٍ، وإلا يصاب المشاهد بدوار الحركة |
| الإطار | ضع الهدف عند y≈42% من الارتفاع لا 50%، حتى يبقى شريط الكابشن أسفله نظيفاً |
| القيد | لا تُظهر حواف التسجيل أبداً: `x ∈ [W−W·S, 0]` |

**GSAP / HyperFrames** (قائم على قاعدة `coordinate-target-zoom` ✅، مع `transform-origin: 0 0` في CSS):
```js
var W = 1080, H = 1920, cam = { x: 0, y: 0, scale: 1 };
var clicks = [ { t: 2.4, x: 812, y: 540 }, { t: 6.1, x: 300, y: 1210 } ];  // من سجل المسجِّل أو يدوياً
function camTo(next, at, dur, ease) {
  tl.fromTo("#screen", { x: cam.x, y: cam.y, scale: cam.scale },
    { x: next.x, y: next.y, scale: next.scale, duration: dur, ease: ease, immediateRender: false }, at);
  cam = next;
}
function focus(px, py, S) {
  return { scale: S,
    x: Math.min(0, Math.max(W - W * S, W / 2 - px * S)),
    y: Math.min(0, Math.max(H - H * S, H * 0.42 - py * S)) };
}
clicks.forEach(function (c, i) {
  camTo(focus(c.x, c.y, 1.9), c.t - 0.45, 0.6, "power3.inOut");
  var next = clicks[i + 1];
  if (!next || next.t - c.t > 2.5) camTo({ x: 0, y: 0, scale: 1 }, c.t + 1.4, 0.5, "power2.inOut");
});
```
**Remotion:** ابنِ مصفوفات `[frames]` و`[scales]` و`[xs]` من نفس المنطق، ثم `interpolate(frame, frames, scales, {easing})`. الـeasing يُطبَّق على كل مقطع. ✅ ولحركة تتبع أنعم: `spring({damping: 200})`.

### 7.2 إبراز المؤشر (Cursor) 📐
- **التنعيم:** متوسط متحرك محسوب مسبقاً على عينات المؤشر (مثلاً نافذة 5 عينات عند 60Hz) لتكون النتيجة حتمية. في HyperFrames: tween محرّك واحد بـ`ease:"none"` ودالة `onUpdate` تقرأ `tl.time()` وتأخذ العينة المناسبة، وهذه **دالة نقية في الزمن** ✅.
- **الحجم:** 1.25x إلى 1.5x من حجم النظام. في Remotion: `@remotion/mac-cursors` → `<MacOSCursor>` فيه 39 مؤشراً ✅ (منذ 4.0.513).
- **الهالة:** دائرة Ø 64 إلى 80px بلون `--accent` وشفافية 25 إلى 30%، تظهر فقط أثناء الحركة أو قبل النقر.
- **النقرة:** ضغط المؤشر `scale 1 → 0.85 → 1` خلال 160ms، ثم تموّج (ripple) من 0 إلى 90px مع تلاشي الشفافية خلال 350ms `power2.out` ✅ (قاعدة `cursor-click-ripple`)، ثم صوت click على نفس الإطار.
- **الخمول:** أخفِ المؤشر بعد 1.5 ثانية من السكون (بتلاشي 200ms)، وأظهره عند أول حركة.
- **لا تتبع المؤشر بالكاميرا حرفياً.** استخدم منطقة ميتة (dead-zone) بنسبة 20% من الإطار قبل أن تتحرك الكاميرا.

### 7.3 تبديل التخطيط في 9:16 (ملء الشاشة ↔ تقسيم ↔ صورة داخل صورة) 📐
| التخطيط | الهندسة (1080×1920) | متى |
|---|---|---|
| **FULL (focus crop)** | تسجيل 16:9 مكبّر بين 1.78x و2.2x ويتبع منطقة الفعل | خطوات دقيقة في الواجهة |
| **SPLIT** | الشاشة أعلى `y 0→1080` (1080×1080)، والوجه أسفل `y 1080→1920` (1080×840) | الشرح الحواري. الكابشن على خط الفصل y≈1080، والوجه فقط في منطقة الـUI السفلى (لا نص فيها) |
| **PiP** | الشاشة كاملة، والوجه دائرة Ø 320px عند `x 120→440`، `y 1180→1500` (يسار أسفل، فوق شريط الـUI) | عرض المنتج مع حضور المقدّم |
| **FACE** | الوجه ملء الشاشة | Hook وCTA والرأي |

- **الانتقال بين التخطيطات:** مدته 0.5 إلى 0.7 ثانية بـ`power3.inOut`، **على حدود الجُمل** لا في منتصف الكلمة، ولا يقل البقاء في أي تخطيط عن 3 ثوانٍ.
- **التنفيذ:** بـ`transform` (scale وtranslate) على الغلاف، و`clip-path` أو `border-radius` للقص (الدائرة: `clip-path: circle(50%)`). ✅ **ممنوع تحريك `width` و`height`** (HyperFrames)، والبديل قاعدة `card-morph-anchor` أو `anchored-layout-expand`.
- **الفيديو:** حرّك **غلافاً** حول `<video>` لا الفيديو نفسه ✅ (gsap-animation guide). ولا تشغّل الفيديو من الـtimeline.
- **للعربية:** ضع العناوين في الجهة اليمنى (أول ما تقع عليه العين)، والوجه أو الـPiP في الجهة اليسرى.
- **في 16:9:** الشاشة كاملة، والوجه في PiP مربع 384×384 أسفل اليسار داخل title-safe (`x 192`، `y 588→972`).

### 7.4 رسوم بيانات متزامنة مع التعليق الصوتي
المبدأ: **الرسم يسبق الكلمة المفتاحية بـ3 إطارات تقريباً (0.1 ثانية)**. العين تتقدم على الأذن، فيبدو الرسم «مستجيباً».
```js
// transcript من Whisper (word timestamps) — طبّع العربية قبل المطابقة
function norm(s){ return s.replace(/[ً-ْـ]/g,"").replace(/[إأآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه"); }
function at(word, offset) {
  var w = norm(word), hit = transcript.find(function(t){ return norm(t.w).indexOf(w) > -1; });
  return hit ? hit.s + (offset || 0) : null;   // null ⇒ أبلغ المحرر، لا تخمّن
}
tl.fromTo("#bar-2024", { scaleY: 0 }, { scaleY: 0.62, duration: 0.7, ease: "power3.out" }, at("٢٠٢٤", -0.1));
tl.fromTo("#bar-2025", { scaleY: 0 }, { scaleY: 0.91, duration: 0.7, ease: "power3.out" }, at("٢٠٢٥", -0.1));
```
- **العدّاد ينتهي على المقطع المنبور** من الرقم المنطوق: `end = word.e − 0.05`.
- عند قول «ارتفع» أو «انخفض»: وميض لوني على العنصر (accent أو accent-2) مدته 200ms.
- أبرز ما يُقال فقط: العناصر غير المذكورة تبقى بشفافية 40%.
- Whisper قد يكتب الأرقام حروفاً («ألفين وأربعة وعشرين»)، فجهّز جدول مرادفات. ⚠️

---

## 8. دليل تصميم الصور المصغّرة (Thumbnails) واختبار A/B

### 8.1 المواصفات
- ✅ YouTube: 1280×720 (16:9)، وعرض لا يقل عن 640px، وJPG أو PNG أو GIF (أول إطار).
- ⚠️ حد الحجم 2MB هو الرقم التقليدي، وبعض المصادر تذكر حداً أعلى على سطح المكتب. التزم بـ2MB.
- ✅ **Test & Compare في YouTube Studio:** حتى **3 بدائل** (صورة أو عنوان أو الاثنان) من Studio على سطح المكتب، يُعرض كل بديل على جزء من الجمهور في الوقت نفسه. **المعيار «watch time share»** وليس CTR. المدة **حتى أسبوعين**، ثم يُعتمد الفائز.
- Shorts: الغلاف يُختار من إطار داخل الفيديو، **فصمّم إطار غلاف داخل المونتاج** (Display XL + وجه).
- ⚠️ Reels: غلاف 1080×1920، وأبقِ العنصر المهم داخل الوسط 1080×1440، لأن شبكة الملف الشخصي تقص إلى 3:4 منذ 2025. تحقق من المنصة الحالية.

### 8.2 قواعد التصميم 📐
| البند | القاعدة |
|---|---|
| **النص العربي** | **2 إلى 4 كلمات** كحد أقصى، **ولا تكرر العنوان**، بل كمّله أو عاكسه |
| الخط | Cairo بين 900 و1000، أو Alexandria 800 إلى 900، أو Noto Kufi 900. ارتفاع الحرف لا يقل عن 110px عند 720p (حوالي 1/6 من الارتفاع) |
| الموضع (RTL) | النص في **الثلث الأيمن**، فالعين العربية تبدأ هناك. والوجه في اليسار **ينظر نحو النص** |
| الركن السفلي الأيمن | **فارغ**، لأن شارة مدة الفيديو تغطيه |
| التباين | حد 6 إلى 10px بلون `--bg`، أو لوح خلفي. **اختبار الرمادي:** حوّل الصورة إلى grayscale، فإن ضاع النص أو الوجه فارفضها |
| الوجه | وجه واحد، يشغل 30 إلى 45% من الإطار، والعينان واضحتان، والعاطفة تطابق الوعد (دهشة أو شك أو ثقة) لا مبالغة كاذبة |
| الخلفية | أقل تفاصيل من الموضوع بدرجتين. ضبابية أو تعتيم −30% |
| الألوان | لون تمييز واحد متكامل مع البشرة (الأزرق أو الكحلي خلف الوجوه الدافئة) |
| **اختبار الصِغر** | صغّر الصورة إلى **168×94** (حجم قائمة المقترحات تقريباً) واقرأها. إن لم تُقرأ الكلمات فاحذف كلمة |
| الأرقام | إن كانت هي الـhook فاكتبها بأرقام لاتينية أو هندية **حسب الجمهور**، بحجم ضعف الكلمات |

### 8.3 بروتوكول A/B 📐
1. **متغير واحد لكل بديل:** (أ) مع وجه أو بدونه، (ب) نص أو بدون نص، (ج) لون الخلفية. لا تغيّر كل شيء معاً وإلا لن تعرف سبب الفوز.
2. البديل الأول هو «الأساس» (control)، أي أفضل تخمين لديك.
3. لا تحكم قبل انتهاء الاختبار. وإذا جاءت النتيجة «أداء متقارب» فاختر الأنظف بصرياً.
4. سجّل النتائج في جدول: الفيديو، والمتغير، والفائز، والفارق. بعد 10 اختبارات تتكون «قواعد علامتك» الخاصة.
5. **Claude يولّد 6 إلى 9 بدائل** بـHyperFrames (`snapshot` أو `render --format png-sequence`)، و**الإنسان يختار 3** للاختبار.

---

## 9. بوابة الجودة (QA Gate): أي بند يفشل يعني الرفض

### A. آلي (Claude ينفّذه قبل أي عرض)
| # | البند | معيار النجاح |
|---|---|---|
| A1 | `npx hyperframes lint` | 0 errors. ✅ خطأ واحد يعطّل تدقيق التخطيط والتباين في `check` |
| A2 | `npx hyperframes check` | 0 findings |
| A3 | الحتمية | `snapshot` عند نفس الأزمنة مرتين وبترتيبين، والنتيجة **متطابقة بالبايت** |
| A4 | لا `Math.random` ولا `Date.now` ولا `setTimeout` ولا `repeat:-1` ولا `stagger random` | `grep` صفر |
| A5 | لا `dir` على `<html>` | lint |
| A6 | لا `type:"chars"` على نص عربي ولا `letter-spacing` عربي | `grep` |
| A7 | كل خط عربي له `@font-face` محلي | lint `font_family_without_font_face` |
| A8 | التباين: النص العادي 4.5:1 أو أكثر، والكبير (≥24px أو ≥18.66px bold) 3:1 أو أكثر ✅ WCAG 1.4.3. **سياستنا: الكابشن والنص الأساسي 4.5:1 دائماً**، لأن الفيديو يُشاهد في الشمس | `check` + `contrast-report.mjs` |
| A9 | الومضات لا تزيد على 3 في أي ثانية ✅ WCAG 2.3.1 | مراجعة مشاهد الـglitch |
| A10 | كل نص ومنطق داخل الصندوق الآمن (القسم 2.2) | `snapshot` + overlay |
| A11 | زمن البقاء ≥ `max(1.5, 0.6 + words/2)` ثانية للنص غير المنطوق | سكربت يقرأ `data-duration` وعدد الكلمات |
| A12 | stagger المجموعة ≤ 500ms | `animation-map.mjs` ✅ |
| A13 | لا أكثر من عنصرين مستقلين بنفس الـease في مشهد واحد | `animation-map` |
| A14 | لا تحويلات متعارضة على نفس العنصر في نفس الوقت | `animation-map` / مراجعة |
| A15 | أول حركة بين 0.1 و0.3 ثانية بعد بداية المشهد | مراجعة |
| A16 | لا مشهد ساكن تماماً أكثر من 1.5 ثانية، إلا ثبات مقصود مذكور في الـbrief | `animation-map` (dead zones) |
| A17 | الإطار 0 ليس فارغاً (hook) | `snapshot --at 0` |
| A18 | نظام أرقام واحد في الفيديو كله، و`tabular-nums` للعدادات | `grep` |
| A19 | Loudness حوالي −14 LUFS، وtrue peak ≤ −1 dBTP | `ffmpeg -af loudnorm=print_format=json` |

### B. بصري (Claude يقترح، والإنسان يعتمد)
| # | البند |
|---|---|
| B1 | الهرمية: ما الذي يُرى أولاً؟ هل هو الأهم؟ |
| B2 | الـKerning اللاتيني في أحجام العرض (−0.02 إلى −0.04em)، ولا ثقوب بصرية بين الحروف الكبيرة (AV وTo) |
| B3 | النقاط والتشكيل العربي غير مقصوصة في أي قناع (افحص الإطار عند منتصف الكشف) |
| B4 | لا تداخل حركتين متنافستين: عنصران بطلان لا يدخلان معاً من اتجاهين مختلفين |
| B5 | الخروج أسرع من الدخول، والاتجاهات تحترم RTL (القسم 3.1) |
| B6 | الاتساق: نفس الـtokens (ألوان وخطوط ومنحنيات) في كل المشاهد، ولا لون مخترع لعنصر واحد |
| B7 | ثلاث طبقات على الأقل في كل مشهد (خلفية، محتوى، لمسات) ✅ (motion-principles) |
| B8 | الانتقالات: قطع حاد افتراضياً، وانتقالات shader لا تتجاوز 3 |
| B9 | الصوت: كل hit على إطار وصول، وكل whoosh على ذروة السرعة |
| B10 | الصورة المصغّرة تنجح في اختبار 168×94 واختبار الرمادي |

### C. بشري حصراً
| # | البند |
|---|---|
| C1 | **التدقيق اللغوي العربي:** الهمزات، والتاء المربوطة والهاء، والألف المقصورة والياء، والتنوين، والأخطاء النحوية في الكابشن |
| C2 | صحة الأرقام والمصادر (Claude لا يخترع بيانات، لكن التحقق مسؤولية بشرية) |
| C3 | الحقوق: الموسيقى، واللقطات، والشعارات التجارية، وتراخيص الخطوط (OFL ✅) |
| C4 | الحساسية الثقافية والدينية والسياسية للصور والعبارات |
| C5 | «هل هذا جميل مرعب؟» شاهده على الهاتف، بالصوت وبدونه، مرتين |

---

## 10. تقسيم العمل: ما يبقى للإنسان وما يولّده Claude

| المجال | Claude Code + HyperFrames/Remotion | المونتير (الإنسان) |
|---|---|---|
| **الاستراتيجية** | اقتراح 3 hooks و3 زوايا لكل فكرة | **اختيار القصة والزاوية والوعد** |
| **الذوق** | تطبيق الـtokens، واقتراح بدائل، ومقارنة `compare` | **الحكم النهائي**: الإيقاع العاطفي، و«هل يلمس؟» |
| **التصميم** | تخطيط المشاهد على الشبكة، والألوان من اللوحة، والخطوط | اعتماد اللوحة والخطوط مرة واحدة (DESIGN.md / frame.md) |
| **الحركة** | كتابة الـtimeline، وstagger، وeases، وlint، وcheck، وsnapshot، وrender | ضبط التوقيت بالمشاهدة. **التحسين الأخير للإيقاع يأتي بعد مشاهدة بشرية** ✅ (claude-design guide: «Claude Code polishes timing after watching playback») |
| **البيانات** | رسوم وعدادات متزامنة مع transcript، وسباق أعمدة | **صحة الأرقام والمصادر** |
| **الكابشن** | تفريغ Whisper، وتقسيم الصفحات، وkaraoke | **تدقيق لغوي** وحذف الحشو (70 إلى 85% من المنطوق يكفي ✅ embedded-captions) |
| **الصوت** | مواضع مقترحة للمؤثرات من الـtimeline، وnormalize، وducking | **اختيار الموسيقى والمؤثرات**، والمكس النهائي، والإحساس |
| **اللقطات** | Ken Burns، وقص ذكي، وزوم على النقرات، وتبديل التخطيطات | **التصوير والإضاءة والأداء أمام الكاميرا** واختيار أفضل Take |
| **الصور المصغّرة** | 6 إلى 9 بدائل بقواعد القسم 8 | **اختيار 3 للاختبار** وقراءة النتائج |
| **النشر** | مقاسات متعددة (`--resolution`) ودفعات (`--batch`) | الجدولة، والكابشن النصي للمنشور، والرد على الجمهور |

**قاعدة ذهبية:** Claude سريع في التوليد وضعيف في الإحساس. أعطه **brief** دقيقاً، ثم شاهد، ثم أعطه ملاحظات **بلغة الحركة**. مثال لملاحظة جيدة: «العنوان يدخل بطيئاً، اجعله expo.out بمدة 0.6، وأخّر الرقم 4 إطارات بعد الكلمة». مثال لملاحظة سيئة: «اجعلها أجمل».

### قالب Brief مختصر للصقه في Claude Code
```
الهدف: Reel 20s، 9:16، جمهور خليجي، أرقام هندية (ar-u-nu-arab).
الدستور: team/03-design.md (لوحة A، Alexandria + IBM Plex Sans Arabic، safe 220/420/120).
المشاهد: Hook (0–2s: "٨٧٪ يفشلون") → 3 beats → Payoff → CTA "احفظه".
الحركات المسموحة: ①②③⑦⑧⑩ — glitch ممنوع هنا.
الصوت: music.mp3 — اقطع على beats من `npx hyperframes beats`.
التسليم: lint + check = 0، snapshot عند منتصف كل مشهد، لا render قبل موافقتي.
```

---

## 11. سجل التحقق (ما فعلته فعلياً)
| الاختبار | النتيجة |
|---|---|
| استنساخ `heygen-com/hyperframes` وقراءة skills: core وanimation وcreative وstudio وembedded-captions، ودليل claude-design | ✅ القواعد المقتبسة أعلاه منسوبة لملفاتها |
| `npx hyperframes@0.8.95 lint` على تركيبة الحركات العشر | في البداية ظهر خطأ `html_dir_attribute_breaks_render`، وبعد الإصلاح 0 أخطاء. بقيت تحذيرات تنظيمية فقط (يُفضّل تقسيم المشاهد إلى sub-compositions) |
| `snapshot` عند 20 نقطة، ثم `render` إلى MP4 مدته 30 ثانية (draft) | ✅ الإطارات سليمة (المرفقات) |
| الحتمية: 10 أزمنة، تقديم أمامي ثم عكسي ثم عشوائي | ✅ 20 من 20 صورة متطابقة بالبايت |
| SplitText `chars` و`words`، و`letter-spacing`، والتطويل على IBM Plex Sans Arabic | ✅ chars يكسر الوصل، وwords سليم، وletter-spacing لا أثر له، والتطويل يعمل |
| تراخيص الخطوط وأوزانها ومحاورها | ✅ `google/fonts/ofl/*/METADATA.pb` |
| قيم cubic-bezier | ✅ `ai/easings.net/src/easings.yml` و`material-web/tokens/.../_md-sys-motion.scss` |
| WCAG 1.4.3 و2.3.1 وتعريف large-scale | ✅ `w3c/wcag/guidelines/...` |
| CSS Text 3 (tracking للخطوط المتصلة، وحدود التشكيل) | ✅ `w3c/csswg-drafts/css-text-3/Overview.bs` |
| W3C alreq (الكشيدة والتطويل والأرقام) | ✅ `w3c/alreq/index.html` |
| Remotion: الوثائق (flickering، css-animations، gsap، captions، paths، spring، mac-cursors، license) | ✅ من مستودع `remotion-dev/remotion` |
| كود Remotion | ✅ `tsc --strict` بلا أخطاء. `evolvePath` السالب وIntl اختُبرا في Node |
| نسب التباين للوحات | ✅ حُسبت بصيغة WCAG. عُدّل `--muted` في اللوحة B بعد فشله |

---

## 12. المصادر

**HyperFrames**
- https://github.com/heygen-com/hyperframes (README)
- https://github.com/heygen-com/hyperframes/blob/main/docs/guides/claude-design-hyperframes.md
- https://github.com/heygen-com/hyperframes/blob/main/docs/guides/gsap-animation.mdx
- https://github.com/heygen-com/hyperframes/tree/main/skills/hyperframes-core (determinism-rules.md, minimal-composition.md)
- https://github.com/heygen-com/hyperframes/tree/main/skills/hyperframes-animation (rules-index.md, rules/*)
- https://github.com/heygen-com/hyperframes/tree/main/skills/hyperframes-creative/references (house-style.md, motion-principles.md, typography.md)
- https://github.com/heygen-com/hyperframes/blob/main/skills/hyperframes-studio/SKILL.md (Safe zones)
- https://github.com/heygen-com/hyperframes/blob/main/packages/lint/src/rules/composition.ts (html_dir_attribute_breaks_render)
- https://hyperframes.heygen.com/guides/gsap-animation (النسخة المنشورة. محجوبة في بيئتي، والمحتوى نفسه في المستودع)

**GSAP**
- https://www.npmjs.com/package/gsap (3.15.0، README: «GSAP is now 100% FREE… even for commercial use»)
- https://gsap.com/docs/v3/Plugins/SplitText/
- https://gsap.com/blog/3-13/
- https://gsap.com/docs/v3/Plugins/DrawSVGPlugin/
- https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/
- https://gsap.com/standard-license
- https://webflow.com/blog/gsap-becomes-free

**Remotion**
- https://www.remotion.dev/docs/flickering
- https://www.remotion.dev/docs/troubleshooting/css-animations
- https://www.remotion.dev/docs/gsap
- https://www.remotion.dev/docs/gsap/use-gsap-timeline
- https://www.remotion.dev/docs/spring
- https://www.remotion.dev/docs/easing
- https://www.remotion.dev/docs/paths/evolve-path
- https://www.remotion.dev/docs/paths/interpolate-path
- https://www.remotion.dev/docs/captions/create-tiktok-style-captions
- https://www.remotion.dev/docs/mac-cursors
- https://github.com/remotion-dev/remotion/blob/main/LICENSE.md

**الخطوط والتراخيص**
- https://github.com/google/fonts/tree/main/ofl (ibmplexsansarabic, alexandria, cairo, readexpro, notokufiarabic, tajawal, almarai, rubik, amiri, elmessiri, arefruqaa, lalezar, ibmplexsans, spacegrotesk)
- https://openfontlicense.org

**الطباعة العربية والمعايير**
- https://github.com/w3c/alreq (W3C Arabic & Persian Layout Requirements)
- https://github.com/w3c/csswg-drafts/blob/main/css-text-3/Overview.bs (§cursive-tracking, §boundary-shaping)
- https://github.com/w3c/wcag/blob/main/guidelines/sc/20/contrast-minimum.html
- https://github.com/w3c/wcag/blob/main/guidelines/sc/20/three-flashes-or-below-threshold.html
- https://www.w3.org/TR/WCAG22/

**منحنيات الحركة**
- https://github.com/ai/easings.net/blob/master/src/easings.yml
- https://github.com/material-components/material-web/blob/main/tokens/versions/latest/sass/_md-sys-motion.scss
- https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation

**القراءة والكابشن**
- https://pubmed.ncbi.nlm.nih.gov/22661485/ (IReST: Arabic 138±20 wpm)
- https://iovs.arvojournals.org/article.aspx?articleid=2166061
- https://partnerhelp.netflixstudios.com/hc/en-us/articles/215517947-Arabic-Timed-Text-Style-Guide

**المناطق الآمنة** (⚠️ معظمها أدلة طرف ثالث، وأرقامها متضاربة)
- https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads
- https://billo.app/blog/meta-ads-safe-zones/ (ينقل نص Meta: 14% / 35% / 6%)
- https://www.firstpier.com/resources/instagram-ad-safe-zones
- https://zeely.ai/blog/tiktok-safe-zones/
- https://postplanify.com/blog/social-media-safe-zones-2026-complete-guide
- https://www.hopperhq.com/blog/youtube-shorts-dimensions/

**تسجيلات الشاشة والصور المصغّرة**
- https://screen.studio/guide/auto-zoom
- https://screen.studio/guide/adding-editing-zooms
- https://support.google.com/youtube/answer/16391400 (A/B test titles and thumbnails)
- https://support.google.com/youtube/answer/72431 (custom thumbnails)
- https://vidiq.com/blog/post/youtube-launches-new-thumbnail-testing-tool/
