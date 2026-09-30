# تقرير البحث المعمّق: المونتاج والموشن غرافيكس بالذكاء الاصطناعي عبر Claude Code وHyperFrames وGSAP

> تاريخ البحث: 2026-09-30. أعدّه الباحث المختص في الفريق.
> **منهجية التحقق:** قرأتُ الملفات الأصلية مباشرةً من `raw.githubusercontent.com` (مثل README وCLAUDE.md وأدلة docs ومصدر linter HyperFrames)، ومن سجلّ npm/PyPI، وأخذتُ عدد النجوم وتاريخ آخر نشاط من GitHub Search API. أما المواقع المحجوبة عن شبكتنا (gsap.com وwebflow.com وmindstudio.ai وborumi.com وhyperframes.heygen.com وyoutube.com) فاعتمدتُ فيها على **مقتطفات محركات البحث**، وتجد عليها وسم **[مقتطف بحث]**. وكل ما لم أستطع التحقق منه تجد عليه وسم **[غير متحقَّق]**.
> الأرقام (النجوم والإصدارات) مأخوذة يوم 2026-09-30.

---

## 0. الخلاصة التنفيذية (للمونتير)

1. **HyperFrames** (من HeyGen) أداة مفتوحة المصدر بترخيص **Apache-2.0**: تكتب الفيديو بصيغة HTML + CSS + GSAP timeline متوقف (paused)، ثم يفتحه Chrome بلا واجهة (headless) ويقفز إلى كل فريم على حدة، ويُرمّز FFmpeg الناتج إلى MP4. **نفس المُدخل يعطي دائماً نفس الفيديو (حتمي/deterministic)**. عليه **54.3k نجمة**، والنسخة على npm هي `0.8.95`، وقد أُنشئ في 2026-03. **لم يصل بعد إلى 1.0**، أي أنه يتطور بسرعة.
2. أداة HyperFrames مصممة للعمل مع Claude: فيها plugin رسمي لـClaude Code و**21 skill**، وconnector رسمي على claude.ai (MCP مستضاف)، وتكامل مع Claude Design.
3. **GSAP 3 صار مجانياً بالكامل منذ 2025-04-29 بعد استحواذ Webflow**، ويشمل ذلك SplitText وMorphSVG وDrawSVG وغيرها، حتى للاستخدام التجاري. آخر إصدار `3.15.0`. **لكن الترخيص ليس MIT**، بل "Standard no-charge license"، وفيه قيد واحد: يُمنع استعمال GSAP داخل أداة بصرية بلا كود تنافس Webflow. هذا القيد لا يمسّ عمل المونتير.
4. **تحذيرات تخص العربية تحققتُ منها من الكود:**
   - وضع `dir="rtl"` على وسم `<html>` في HyperFrames يعطي **فيديو أسود بالكامل عند الرندر**، مع أن المعاينة تبدو سليمة. الـlinter يعامله كخطأ باسم `html_dir_attribute_breaks_render`. **الحل:** اجعل `direction: rtl` على عناصر النص فقط.
   - أمر `hyperframes transcribe` يستخدم افتراضياً النموذج `small.en`، وهو للإنجليزية فقط. Parakeet لا يدعم العربية. **للعربية لازم** `--model large-v3 --language ar`، أو استورد JSON من خدمة خارجية.
   - SplitText في وضع الحروف (chars) **يفكّ اتصال الحروف العربية**. استعمل words/lines، أو الدالة الرسمية `splitArabicText` من GSAP التي تعتمد على ZWJ.
5. **Remotion** ليس مفتوح المصدر بالمعنى الحرفي. **الشركات التي فيها أكثر من 3 موظفين تحتاج Company License.** أما HyperFrames فهو Apache-2.0 بلا أي رسوم.
6. **الفيديوهان:**
   - `AW3Uku__BBE` هو "Opus 5.5 Is The Best Video Editor I've Ever Used" لـ **Paul J Lipsky**. الأداة المقصودة بـ"Broomi" هي **Borumi**.
   - `cmxZ4FvKuig` هو "Claude Opus 5.5 despidió a mi equipo de edición de vídeo"، وهو فيديو **بالإسبانية**، ولم أتحقق من اسم القناة.

---

## 1. HyperFrames — بالتفصيل

### 1.1 ما هي
- المستودع: https://github.com/heygen-com/hyperframes ، وشعاره "Write HTML. Render video. Built for agents."
- التعريف الرسمي من README: *"open-source framework for turning HTML, CSS, media, and seekable animations into deterministic MP4 videos"*.
- الإحصاءات: ‏54,305 نجمة، أُنشئ في 2026-03-10، وآخر push كان في 2026-09-30، أي نشاط يومي. الترخيص **Apache-2.0**.
- على npm: الحزمة `hyperframes`، وآخر نسخة `0.8.95`، أول نشر لها في 2026-03-23، و`engines: node >=22`.
- **تُستخدم فعلاً في الإنتاج داخل HeyGen**، ويذكر ملف ADOPTERS.md فرقاً مثل tldraw وTanStack.

### 1.2 كيف تعمل
- التكوين (composition) ملف HTML عادي. التوقيت يُحدَّد بخصائص `data-*`: ‏`data-composition-id` و`data-start` و`data-duration` و`data-track-index` و`data-width/height`، وكل عنصر يظهر ويختفي على الخط الزمني يأخذ `class="clip"`.
- الحركة تُكتب في **GSAP timeline متوقف**، ثم يُسجَّل في `window.__timelines[<composition-id>]`. هذا المثال من README:
  ```html
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.from("#title", { opacity: 0, y: 40, duration: 0.8 }, 1);
    window.__timelines = window.__timelines || {};
    window.__timelines.launch = tl;
  </script>
  ```
- عند الرندر يقفز المحرك (engine) إلى كل فريم **بالـseek** وليس بالتشغيل الفعلي. أي يستدعي ما يعادل `tl.seek(frame/fps)`، ثم يلتقط صورة عبر Puppeteer/Chrome headless، ويرمّز FFmpeg الصور ويمزج الصوت.
- يقبل HyperFrames عدة محركات حركة عبر adapters: ‏GSAP (الأساسي)، وCSS animations، وLottie، وThree.js، وAnime.js، وWAAPI، وTypeGPU.
- **قواعد الحتمية** كما وردت في CLAUDE.md ودليل Claude Design:
  - ممنوع `Date.now()` و`Math.random()` غير المبذور (unseeded) و`setTimeout/setInterval` و`requestAnimationFrame` و`repeat: -1` و`stagger from:"random"`، وممنوع جلب أي شيء من الشبكة أثناء الرندر.
  - الفيديو يكون دائماً `muted playsinline`، والصوت يوضع في عنصر `<audio>` منفصل.
  - لا تستدعِ `video.play()`، فتشغيل الوسائط تتولاه الأداة.
  - للإخفاء والإظهار استعمل `autoAlpha` بدل `visibility/display`.

### 1.3 التثبيت والأوامر (تحققتُ منها في README وCLAUDE.md وdocs/packages/cli.mdx)
```bash
# Claude Code plugin (الطريقة الموصى بها)
claude plugin marketplace add heygen-com/hyperframes
claude plugin install hyperframes@hyperframes
# ثم داخل Claude Code:  /hyperframes:hyperframes

# أو كـ skills مستقلة
npx skills add heygen-com/hyperframes        # picker تفاعلي
npx hyperframes skills update                # يثبّت "core set" من main (الأحدث)

# يدوياً بالـCLI
npx hyperframes init my-video
cd my-video
npx hyperframes preview      # Studio على http://localhost:3002
npx hyperframes lint         # فحص ثابت
npx hyperframes check        # فحص داخل headless Chrome (أخطاء runtime، layout، تباين WCAG)
npx hyperframes snapshot --at 0,3,8
npx hyperframes render -o output.mp4            # 1920x1080@30 افتراضياً
npx hyperframes render --docker -o output.mp4   # مخرجات حتمية تماماً
npx hyperframes render --format webm -o overlay.webm   # شفافية (lower-thirds/overlays)
npx hyperframes render --fps 60 --quality high
npx hyperframes doctor       # يفحص Node/Chrome/FFmpeg
```
أوامر أخرى موجودة ومفيدة للمونتير (من cli.mdx):
- `transcribe`: يستخرج توقيت كل كلمة.
- `tts`: يولّد صوتاً من نص.
- `remove-background`: يخرج WebM/ProRes 4444 بقناة شفافية.
- `beats`: يكتشف الـBPM والإيقاعات.
- `normalize-audio`
- `capture <url>`: يلتقط موقعاً ويحوّله إلى فيديو.
- `add <block>` و`catalog`: فيها أكثر من 50 block، مثل `data-chart` و`instagram-follow` و`flash-through-white`.
- `cloud render`: رندر سحابي عبر HeyGen.
- `lambda deploy/render`: رندر على AWS Lambda.

### 1.4 المتطلبات
- **Node.js 22+** و**FFmpeg** (مع ffprobe) و**Chrome/Chromium** بدون واجهة. عند الحاجة يُثبَّت عبر `npx hyperframes browser ensure`.
- لمن يطوّر المستودع نفسه فقط: bun وGit LFS، فملفات اختبار الانحدار حجمها نحو 240MB. **المستخدم العادي لا يحتاجهما.**

### 1.5 الـSkills والـCLAUDE.md (من CLAUDE.md الرسمي)
- **21 skill** مقسّمة كالتالي:
  - **Router:** ‏`/hyperframes`، وتُقرأ أولاً.
  - **Creation workflows:** ‏`/product-launch-video` و`/faceless-explainer` و`/pr-to-video` و`/embedded-captions` و`/talking-head-recut` و`/motion-graphics` و`/music-to-video` و`/slideshow` و`/general-video` و`/remotion-to-hyperframes`.
  - **Domain skills:** ‏`/hyperframes-core` و`/hyperframes-animation` و`/hyperframes-keyframes` و`/hyperframes-creative` و`/media-use` و`/hyperframes-audio` و`/hyperframes-cli` و`/hyperframes-registry` و`/figma`.
- **الأهم للمونتير:**
  - `/talking-head-recut`: يضيف lower-thirds وعناوين حركية وcallouts وPiP فوق فيديو متكلم دون المساس بالفيديو الأصلي.
  - `/embedded-captions`: كابشن، ومنها كابشن يظهر **خلف** المتكلم عبر matting.
  - `/motion-graphics`: قطع قصيرة أقل من 10 ثوانٍ تُخرج MP4 أو overlay شفاف.
  - `/music-to-video`: مونتاج متزامن مع الإيقاع.
- CLAUDE.md يشترط أن يمر `npx hyperframes lint` و`npx hyperframes check` بنجاح بعد أي تعديل على composition.

### 1.6 Claude Connector وClaude Design
- **Connector رسمي على claude.ai:** ‏"HyperFrames by HeyGen"، وعنوانه `https://mcp.heygen.com/mcp/hyperframes/`. يُضاف من Customize → Connectors → Add custom connector، ويحتاج حساب HeyGen. التوثيق يقول إن **هذا المسار "in beta"**. المصدر: docs/guides/mcp.mdx، وصفحة claude.com/connectors/hyperframes **[مقتطف بحث]**.
- **Claude Design** له مساران:
  1. **Download-ZIP** (الدليل `docs/guides/claude-design-hyperframes.md`): يرسم Claude Design المسودة الأولى، أي الهوية البصرية والمشاهد والحركة الأولية، ثم يكمل Claude Code الصقل: الـeases والتوقيت والـQA. في الدليل هياكل جاهزة، منها **Skeleton A: Social Reel 1080×1920، مدته 10–15 ثانية، من 5 إلى 7 مشاهد**، وقواعد لمدة المشهد حسب عدد الكلمات، وقائمة "خطوط محظورة" لكسر رتابة LLM، منها Inter وRoboto وPoppins، ونصيحة بأن ~95% من الانتقالات تكون hard cuts، و14 shader transition.
  2. **Send to HyperFrames**: يُرسَل ملف HTML واحد مستقل بذاته إلى مشروع مستضاف في HeyGen. **الاستيراد والتحسين مجانيان، أما الرندر فمدفوع**: 3 رندرات شهرياً في الحساب المجاني، ثم 20 credit لكل دقيقة. المصدر: `claude-design-send-to-hyperframes.md`.

### 1.7 النضج والقيود
- لم يصل إلى 1.0 بعد (`0.8.x`)، والتغييرات يومية. الـStudio نفسه موصوف بأنه "Available, evolving".
- بعض المشاكل تظهر في الرندر فقط ولا تظهر في المعاينة، ومثالها مشكلة `dir="rtl"`، وهي خطأ صامت مؤكد.
- الخطوط المضمّنة مسبقاً في المحرك **لا تحوي إلا المجموعة اللاتينية (Latin subset)**، وأي حروف غير لاتينية تُجلب من Google Fonts وقت الرندر، كما في `deterministicFonts.ts`. ← **للعربية: ضع ملفات الخطوط woff2 داخل المشروع** حتى تحصل على حتمية كاملة ولا يعتمد الرندر على الشبكة.
- الأداء: تقول HeyGen إن HyperFrames رندر فيديو في 60 ثانية مقابل 162 ثانية لـRemotion، إضافةً إلى 4 دقائق build. **[مقتطف بحث، ادعاء من البائع نفسه ولم يُقَس بشكل مستقل]**.

---

## 2. GSAP 3

### 2.1 الترخيص (تحققتُ منه في حزمة npm ‏`gsap@3.15.0` نفسها)
- في README الحزمة: *"Thanks to Webflow, GSAP is now 100% FREE including ALL of the bonus plugins like SplitText, MorphSVG … even for commercial use!"*
- رأس كل ملف فيه: `Subject to the terms at https://gsap.com/standard-license`، و`package.json` يقول "Standard 'no charge' license". **إذن الترخيص ليس MIT وليس مفتوح المصدر بالمعنى الدقيق، لكنه مجاني.**
- تاريخ التحول إلى المجانية: 2025-04-29، وتحديداً مع الإصدار 3.13 **[مقتطف بحث: x.com/greensock وgsap.com/blog/3-13]**.
- القيد الوحيد المهم **[مقتطف بحث من نص الترخيص]**: "Prohibited Uses" تعني استعمال GSAP في أدوات تتيح بناء حركة بصرياً بدون كود، إذا كانت تنافس قدرات Webflow في هذا المجال. **المونتير الذي يستخدم GSAP لإنتاج فيديوهات غير معني بهذا القيد.**
- يوجد مستودع **greensock/gsap-skills** بـ15.8k نجمة وترخيص MIT، وفيه skills رسمية لـClaude/Cursor: ‏`npx skills add greensock/gsap-skills`.

### 2.2 الـPlugins المهمة للفيديو (كلها موجودة فعلاً في الحزمة 3.15.0)
| Plugin | الاستخدام في الموشن |
|---|---|
| `SplitText` | تقسيم النص إلى حروف أو كلمات أو أسطر لعمل stagger. أُعيدت كتابته في 3.13، وصار أصغر بـ50% ويدعم mask. في المصدر يستخدم `Intl.Segmenter`، وفيه خيارات `wordDelimiter` و`prepareText` و`deepSlice` و`smartWrap`. |
| `MorphSVGPlugin` | تحويل شكل SVG إلى شكل آخر، مثل الأيقونات والشعارات. |
| `DrawSVGPlugin` | رسم الخطوط تدريجياً (stroke draw). |
| `MotionPathPlugin` | تحريك عنصر على مسار. |
| `CustomEase` / `CustomBounce` / `CustomWiggle` | منحنيات حركة مخصصة، مثل graph editor في After Effects. |
| `ScrambleTextPlugin` / `TextPlugin` | تأثيرات تتابع الحروف و"الكتابة". |
| `Flip` | انتقالات تغيير الـlayout. |
| (`ScrollTrigger` وScrollSmoother) | للمواقع وليس للفيديو. لا تستعملها في HyperFrames. |

### 2.3 لماذا الـtimeline القابل للـseek أساسي؟
- في المتصفح تتحرك الحركة عادةً حسب **ساعة الجهاز**. عند الرندر لا يمكن ضمان أن الفريم 347 سيُلتقط في اللحظة الصحيحة، لأن كل فريم قد يأخذ 200ms حتى يُرسم.
- الـtimeline المتوقف `paused: true` يسمح للمحرك أن يطلب "أرني الحالة عند t=11.566s" بالضبط، ثم يلتقط الصورة، **مهما كانت سرعة الجهاز**. النتيجة دقة على مستوى الفريم وحتمية كاملة.
- لهذا تمنع HyperFrames استعمال `setTimeout` و`requestAnimationFrame` و`repeat:-1`، فكلها تتبع الساعة الحقيقية ولا تتبع الـtimeline.

---

## 3. البدائل والأدوات المكمّلة

| الأداة | ما هي | الترخيص | الحالة (GitHub) | ملاحظة للمونتير |
|---|---|---|---|---|
| **Remotion** | فيديو بـReact | **Remotion License، مصدر مفتوح للاطلاع لكنه غير حر**: مجاني للأفراد وللشركات حتى 3 موظفين وللمنظمات غير الربحية. **الشركات الأكبر تحتاج Company License** (نص LICENSE.md تحققتُ منه). | 61.2k نجمة، نشط، ‏`remotion@4.0.530` | الأسعار **[مقتطف بحث]**: "Creators" بـ$25 لكل مقعد شهرياً، و"Automators" بـ$0.01 لكل رندر بحد أدنى $100 شهرياً، وEnterprise بحد أدنى $500. يعلن Remotion عن تغييرات في الترخيص مع Remotion 5.0. يدعم React من 16.8 فما فوق، بما فيها React 19. |
| **Remotion Agent Skills** | skills رسمية لـClaude | لا يوجد ملف ترخيص | 4.8k نجمة، نشط | `npx skills add remotion-dev/skills`. تشمل `/remotion-create` و`/remotion-captions` و`/remotion-render`. |
| **Motion Canvas** | حركة بـTypeScript على canvas، مثالي للشروحات | MIT | 19.2k نجمة، آخر push في 2026-07 | تطبيق مستقل، وليس مصمماً للأتمتة. |
| **Revideo** | fork من Motion Canvas، مكتبة للأتمتة | MIT (`@revideo/core@0.11.0`) | انتقل إلى **midrender/revideo** بـ4.1k نجمة. الرابط القديم redotvideo/revideo لم يظهر في البحث. | فيه API للرندر من السيرفر. |
| **Theatre.js** | محرر حركة بصري للويب | Apache-2.0 | 12.7k نجمة، **آخر push في 2024-08، أي شبه متوقف** | لا أنصح به لمشاريع جديدة. |
| **Lottie (lottie-web)** | تشغيل حركة After Effects المصدّرة عبر Bodymovin | MIT | 32.1k نجمة، آخر push في 2025-09 | HyperFrames يدعمه كـadapter، أي يمكن إدخال شغل AE جاهز. |
| **After Effects + scripting** | ExtendScript/JSX، وأيضاً MCP | تجاري | — | يوجد `hetpatel-11/Adobe_Premiere_Pro_MCP` بـ629 نجمة (MIT) لـPremiere. لم أتحقق بعد من MCP مخصص لـAE **[غير متحقَّق]**. |
| **FFmpeg** | القص والدمج والترميز | LGPL/GPL | — | أساس كل الـpipelines. |
| **Whisper (OpenAI)** | تحويل الكلام إلى نص | MIT | 109.8k نجمة | توقيته على مستوى الكلمة تقريبي. |
| **WhisperX** | Whisper مع محاذاة wav2vec2 تعطي توقيتاً دقيقاً لكل كلمة، وفيه diarization | BSD-2 | 24.3k نجمة، ‏`whisperx 3.8.6` | **يحوي نموذج محاذاة عربياً جاهزاً**: ‏`"ar": "jonatasgrosman/wav2vec2-large-xlsr-53-arabic"` (من alignment.py). من قيوده الموثقة: الأرقام مثل "2014" لا تُحاذى ولا تأخذ توقيتاً. |
| **faster-whisper** | Whisper أسرع عبر CTranslate2 | MIT | 25.6k نجمة، ‏`1.2.1` | يستعمله AIEV. |
| **mlx-whisper** | Whisper على Apple Silicon عبر MLX | MIT (من ml-explore/mlx-examples) | ‏`mlx-whisper 0.4.3` على PyPI | الأسرع على أجهزة Mac من سلسلة M. |
| **whisper-timestamped** | توقيت لكل كلمة مع درجة ثقة | **AGPL-3.0** (انتبه عند الاستخدام التجاري) | 2.9k نجمة | — |
| **auto-editor** | حذف الصمت تلقائياً | Unlicense (ملكية عامة) | 5.4k نجمة، ‏`29.3.1` | الأوامر: `auto-editor video.mp4 --margin 0.2sec --edit audio:-19dB`، والتصدير إلى `--export premiere` أو `resolve` أو `final-cut-pro`. وفيه skill رسمية: `npx skills add WyattBlue/auto-editor`. |
| **browser-use/video-use** | skill مونتاج كاملة لـClaude Code | MIT | **27.7k نجمة** | تقرأ الفيديو كنص (ElevenLabs Scribe) مع filmstrip عند الطلب، وتقص على حدود الكلمات، وتولّد overlays بـHyperFrames أو Remotion أو Manim. |

---

## 4. مستودعات GitHub في هذا المجال (تحققتُ من وجودها كلها)

| المستودع | النجوم | آخر نشاط | الترخيص | الوصف والنهج |
|---|---|---|---|---|
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | 54,305 | 2026-09-30 | Apache-2.0 | المحرك الأساسي. |
| [heygen-com/hyperframes-launches](https://github.com/heygen-com/hyperframes-launches) | 562 | 2026-09-26 | Apache-2.0 | ملفات compositions حقيقية استعملتها HeyGen في فيديوهات إطلاق منتجاتها. مرجع ممتاز للتعلم. |
| [nateherkai/hyperframes-student-kit](https://github.com/nateherkai/hyperframes-student-kit) | 1,104 | 2026-09-28 | NOASSERTION (غير محدد) | من Nate Herk: ‏15 skill، و406 بطاقة موشن، وقص الصمت والأخطاء، وreels بمقاس 9:16، وshowreel متزامن مع BPM. التفريغ بـElevenLabs Scribe، ويمكن استبداله بـWhisper. المتطلبات: Node 22+ وFFmpeg وChrome. **مناسب جداً كنقطة بداية للمونتير.** |
| [notivn/AIEV](https://github.com/notivn/AIEV) | 124 | 2026-09-29 | MIT | فيتنامي: لوحة تحكم Next.js، وClaude Agent SDK بدور "المخرج"، وHyperFrames للمشاهد، وRemotion لتجميع الـtimeline، وfaster-whisper للكابشن الكاريوكي، وQC آلي. **نموذج جيد لكيفية تكييف لغة غير إنجليزية**، فعنده إصلاحات لعلامات التشكيل الفيتنامية وQC خاص بها. |
| [assafkip/claude-video-editor](https://github.com/assafkip/claude-video-editor) | 19 | 2026-06-12 | NOASSERTION | قص وكابشن وتلوين وموشن بـHTML+GSAP، ويستعمل محرك video-use. التفريغ بـElevenLabs. |
| [Navidbyti/motion-studio](https://github.com/Navidbyti/motion-studio) | 0 | 2026-09-29 | NOASSERTION | v0.3.0: استوديو موشن فيه beat map وبوابة QA ومراحل موافقة (اتجاه إبداعي، ثم beat map، ثم styleframes). جديد جداً. |
| [siyuanfeng636-cpu/agentic-motion-graphics](https://github.com/siyuanfeng636-cpu/agentic-motion-graphics) | 3 | 2026-09-25 | MIT | ‏pipeline من 6 خطوات: بحث، ثم script.json، ثم TTS، ثم توقيت الكلمات بـWhisper، ثم HTML+GSAP، ثم الرندر. يقول صاحبه إنه **مستوحى من Moritz Kremb**. |
| [haxzie/genmotion](https://github.com/haxzie/genmotion) | 4 | 2026-09-29 | لا يوجد ملف ترخيص | تطبيق سطح مكتب لـmacOS بـElectron، يكتب فيه الوكيل مشاهد React/TSX مع GSAP-via-seek. **ليس HyperFrames.** |
| [zhuyansen/awesome-claude-video-skills](https://github.com/zhuyansen/awesome-claude-video-skills) | 301 | 2026-09-28 | NOASSERTION | قائمة بـ183 مستودعاً مع تقييم أمني لكل منها. |
| [freshtechbro/claudedesignskills](https://github.com/freshtechbro/claudedesignskills) | 953 | **2025-11-20 (متوقف)** | MIT | plugin marketplace فيه 22 skill للويب ثلاثي الأبعاد والحركة (GSAP وThree.js وغيرها). ليس متخصصاً في الفيديو. |
| [Eskapeum/animation-forge](https://github.com/Eskapeum/animation-forge) | 4 | 2026-04-03 | لا يوجد ملف ترخيص | skill معرفية واحدة فيها ~6.3k سطر عن مبادئ الحركة وGSAP وRemotion. |
| [digitalsamba/claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit) | 2,150 | 2026-09-28 | MIT | **مبني على Remotion**: فيه `/setup` و`/video`، وTTS بـQwen3، وصور بـFLUX.2، وموسيقى بـACE-Step على GPU سحابي. |
| [remotion-dev/skills](https://github.com/remotion-dev/skills) | 4,775 | 2026-09-29 | — | Remotion Agent Skills الرسمية. |
| [wilwaldon/Claude-Code-Video-Toolkit](https://github.com/wilwaldon/Claude-Code-Video-Toolkit) | 88 | 2026-09-29 | — | قائمة منسقة للأدوات: Remotion وManim وتسجيل الشاشة وFFmpeg. آخر تحديث لمحتواها في فبراير 2026، لذلك **لا تذكر HyperFrames**. |
| [browser-use/video-use](https://github.com/browser-use/video-use) | 27,670 | 2026-09-24 | MIT | انظر القسم 3. |
| [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | 15,819 | 2026-07-29 | MIT | skills رسمية لـGSAP. |
| [Samin12/edit-borumi-video](https://github.com/Samin12/edit-borumi-video) | 0 | 2026-09-23 | — | skill تستعمل Borumi MCP مع HyperFrames. انظر القسم 7. |
| [iart-ai/motion-skills](https://github.com/iart-ai/motion-skills) | 595 | 2026-09-23 | MIT | 50 skill للموشن. |
| [bangtutorial/bang-motion](https://github.com/bangtutorial/bang-motion) | 547 | 2026-09-15 | MIT | موشن في المتصفح يخرج ملف `index.html` واحداً. |
| [kurbaitaev/ghost-editor](https://github.com/kurbaitaev/ghost-editor) | 63 | 2026-09-24 | MIT | مونتاج reels لفيديوهات المتكلم على HyperFrames. |
| [hassancs91/claude-youtube-editor](https://github.com/hassancs91/claude-youtube-editor) | 315 | 2026-08-18 | MIT | مونتاج يوتيوب كامل من التسجيل حتى الرفع. |
| [geekjourneyx/hyperframes-motion-director](https://github.com/geekjourneyx/hyperframes-motion-director) | 450 | 2026-07-26 | **AGPL-3.0** | موجّه للصينية. **مثال على تكييف HyperFrames للغة غير لاتينية.** |
| [cartesiancs/cartcut](https://github.com/cartesiancs/cartcut) | 759 | 2026-09-29 | MIT | محرر فيديو مصمم للـagents. |
| [heygen-com/skills](https://github.com/heygen-com/skills) | 458 | 2026-07-14 | MIT | skills لأفاتارات HeyGen. |

> ملاحظة: المستودعات بعلامة NOASSERTION أو بلا ملف ترخيص **لا يجوز افتراض أنها مفتوحة للاستخدام التجاري**. راجع ملف LICENSE في كل منها قبل الاستعمال.

---

## 5. صنّاع المحتوى والناشرون

| الشخص/الجهة | المنصة | النهج | الحالة |
|---|---|---|---|
| **Nate Herk** (@nateherk، ومجتمع AI Automation Society على Skool) | YouTube وX وSkool | فيديوهات "Claude + HyperFrames Just Solved Video Editing" و"Opus 5.5 Just Changed Video Editing Forever (free skills)". يعتمد على Claude Code منسّقاً، وHyperFrames للموشن، وvideo-use للقص. قاعدته من 5 خطوات: transcribe ← cut ← plan beats ← build skills ← let agent verify. ومستودعه student-kit. | المستودع تحققتُ منه، والباقي **[مقتطف بحث]** |
| **Paul J Lipsky** (@PaulJLipsky) | YouTube | "Opus 5.5 Is The Best Video Editor I've Ever Used" (بتاريخ 2026-09-28). يصوّر في Borumi مقسّماً إلى مشاهد، ثم يربط Claude عبر MCP ويطبق الموشن. | تحققتُ منه (عبر feed على GitHub) |
| **Moritz Kremb** | X | منشور "Opus 5.5 solved motion graphics" الذي انتشر على نطاق واسع، وألهم مستودع agentic-motion-graphics. | **[مقتطف بحث]** |
| **Charlie Hills** (Substack: MarTech AI) | مقال "Opus 5.5 Motion Graphics" | — | **[مقتطف بحث]**، والموقع محجوب |
| **@0xMovez** وBin Liu (@liu8in) | X | "How to build motion design studio with Opus 5.5" و"Opus 5.5 writes perfect HyperFrames videos". تذكر المقتطفات أن Opus 5.5 أعاد إنتاج مفاهيم HyperFrames، مثل `window.__timelines`، في 20 من 20 محاولة. | **[مقتطف بحث]** |
| **MindStudio blog** (mindstudio.ai) | مدونة | عدة مقالات بعناوين مثل "AI Video Editing Workflow with Claude Code and HyperFrames" و"…HyperFrames + ElevenLabs". ⚠️ **أحد المقتطفات يصف HyperFrames بأنها "platform exposing API endpoints"، وهذا غير دقيق.** HyperFrames مكتبة وCLI محلي، والـMCP المستضاف مسار إضافي تجريبي (beta). اقرأ هذه المقالات بحذر. | **[مقتطف بحث]**، والموقع محجوب |
| **Samin Yasar** (Samin12) | GitHub | skill اسمها edit-borumi-video، استخلصها من مونتاج حقيقي واحد. | تحققتُ منه |

---

## 6. قضايا خاصة بالعربية

### 6.1 اتجاه النص RTL داخل HyperFrames ⚠️ (تحققتُ منه في الكود المصدري)
- قاعدة الـlinter `html_dir_attribute_breaks_render` موجودة في `packages/lint/src/rules/composition.ts`، ونصها: *"`<html dir="rtl">` renders correctly in preview/snapshot but produces a fully blank/black video from render — a confirmed, silent failure."*. وهي تنطبق أيضاً على `dir="auto"`.
- **الإصلاح الرسمي:** احذف `dir` من `<html>` وأبقِ `lang="ar"`، ثم ضع `direction: rtl` في CSS على عناصر النص نفسها، أو ضع `dir="rtl"` على div النص وليس على الجذر:
  ```html
  <html lang="ar">
  ...
  <h1 class="clip ar" style="direction: rtl; unicode-bidi: plaintext">عنوان الحلقة</h1>
  ```
- إذا خلطتَ العربية بالإنجليزية أو بالأرقام، استعمل `unicode-bidi: isolate` أو `plaintext`، أو `dir="auto"` على كل سطر، وليس على الجذر.

### 6.2 الخطوط العربية (تحققتُ منها في google/fonts METADATA.pb، وكلها OFL وتدعم المجموعة العربية)
| الخط | الطابع | يناسب |
|---|---|---|
| **IBM Plex Sans Arabic** | تقني ونظيف، وله نظير لاتيني متطابق | أخبار وتقنية ولوحات بيانات |
| **Tajawal** | هندسي خفيف، وفيه أوزان كثيرة | كابشن السوشال |
| **Cairo** (variable) | عريض وودود، و"variable" يسمح بتحريك الوزن | عناوين وkinetic type |
| **Noto Kufi Arabic** (variable) | كوفي هندسي | عناوين قوية |
| **Almarai** | بسيط ومقروء جداً | كابشن طويلة |
| **Readex Pro** (variable) | حديث، مصمم للقراءة | واجهات وكابشن |
| **Alexandria** (variable) | هندسي عريض | عناوين عرض |
| **Rubik** (variable، فيه العربية) | مستدير | محتوى خفيف |
| **Lalezar** و**Aref Ruqaa** و**Amiri** | عرض ثقيل / رقعة / نسخ كلاسيكي | عناوين زخرفية ومحتوى تراثي |

- قائمة "الخطوط المحظورة" في دليل Claude Design تمنع **Noto Sans** (اللاتيني) لتجنب الرتابة. هذا الحظر إرشادي ولا يشمل Noto Kufi Arabic. **[استنتاج]**
- **حمّل ملفات woff2 إلى مجلد `fonts/` داخل المشروع** وعرّفها بـ`@font-face`، لأن المحرك يضمّن اللاتيني فقط ويجلب الباقي من الشبكة وقت الرندر.
- المقاسات الدنيا للفيديو حسب دليل HyperFrames: العناوين من 60px فما فوق، والنص من 20px فما فوق. للعربية زِد 10–15% تقريباً، لأن ارتفاع الحروف الصغيرة (x-height) أقل **[توصية خبرة، غير متحقَّق]**.
- استعمل `font-variant-numeric: tabular-nums` للعدادات. وقرر مسبقاً بين الأرقام الهندية (٠١٢) والعربية الغربية (012). دليل Blue Professional في HyperFrames ينص على "Numerals stay Latin Arabic digits".

### 6.3 SplitText والعربية ⚠️
- **المشكلة:** SplitText يلفّ كل حرف في `inline-block` مستقل. عندها يعامل محرك تشكيل الحروف (HarfBuzz) كل حرف على أنه **منفصل (isolated)**، فينكسر اتصال الحروف العربية ("ع ر ب ي" بدل "عربي"). وتؤكد مصادر أن الـbidi يتضرر أيضاً لأن الصناديق ليست نصاً **[مقتطف بحث: منتديات GSAP وdev.to]**.
- **الحلول مرتبة من الأكثر أماناً:**
  1. `SplitText.create(el, { type: "words" })` أو `"lines"`. تقسيم الكلمات آمن تماماً لأن كل كلمة تبقى متصلة.
  2. الدالة الرسمية **`splitArabicText`** من GSAP، ومكانها `gsap.com/docs/v3/HelperFunctions/helpers/splitArabicText/`. تضيف **ZWJ (U+200D)** في نهاية كل جزء وبدايته حتى "يظن" المحرك أن للحرف جاراً فيرسمه بشكله المتصل **[مقتطف بحث، والصفحة محجوبة عندنا]**.
  3. تأثيرات "الكشف" (mask/clip-path wipe) على الكلمة كاملة من اليمين إلى اليسار، بدل تحريك الحروف منفردة.
- مثال "Character stagger" في دليل Claude Design يلف كل حرف بـ`<span class="char">`. **لا تطبّقه على العربية.**
- مع RTL يجب أن يبدأ الـstagger من اليمين. بما أن ترتيب عناصر DOM منطقي (أول كلمة هي أول عنصر)، فإن `stagger: { from: "start" }` سيعمل صحيحاً في الغالب، لكن تحقق منه بصرياً **[غير متحقَّق]**.

### 6.4 التفريغ العربي على مستوى الكلمة
- **HyperFrames `transcribe`:** النموذج الافتراضي `small.en` إنجليزي فقط، وParakeet يدعم 25 لغة **ليست العربية منها**. لذلك **لازم** `--model large-v3 --language ar`، أو التفريغ خارجياً (OpenAI/Groq Whisper API أو ElevenLabs) ثم استيراد JSON. الوثائق نفسها تنصح بالـAPI للمحتوى الإنتاجي.
- **WhisperX:** يحوي نموذج محاذاة عربياً (`jonatasgrosman/wav2vec2-large-xlsr-53-arabic`). قيده: الأرقام والرموز لا تأخذ توقيتاً، فيجب ترقيعها بالاستيفاء بين الكلمات المجاورة.
- **دقة اللهجات [مقتطف بحث من أوراق Interspeech 2025 وarXiv]:**
  - Whisper large-v3 دون تدريب إضافي (zero-shot): نسبة الخطأ في الكلمات WER نحو **16% للفصحى** مقابل **58% للهجات**.
  - نموذج مُدرَّب على عدة لهجات منها الشامية خفّض WER من 0.59 إلى 0.34.
  - ← **للهجة الشامية توقّع أخطاء كثيرة، وخطط لمرحلة مراجعة بشرية للكابشن.** وفي HuggingFace نماذج مُعدّلة خصيصاً للهجات، مثل `oddadmix/whisper-large-v3-turbo-arabic-dialectal` **[غير مختبر]**.
- **ElevenLabs Scribe:** يعطي توقيتاً لكل كلمة وdiarization. تذكر ElevenLabs أن WER العربي 3.1% على FLEURS، لكن FLEURS فصحى مقروءة. Speechmatics تقول إن Scribe أضعف في العربية **[مقتطف بحث، وكلاهما ادعاء من البائع]**. لم أجد رقماً مستقلاً عن أدائه مع الشامية **[غير متحقَّق]**.
- **mlx-whisper** على Mac بمعالج M: أسرع محلياً، لكنه لا يوفر محاذاة wav2vec2، فتوقيت الكلمات فيه أقل دقة من WhisperX **[استنتاج من طبيعة الأداتين]**.

---

## 7. التحقق من محتوى الفيديوهين

### الفيديو 1: `cmxZ4FvKuig` — "Claude Opus 5.5 despidió a mi equipo de edición de vídeo" (بالإسبانية)
- العنوان تحققتُ منه عبر مقتطف بحث من youtube.com. **اسم القناة لم أتحقق منه.** أحد ملخصات البحث ذكر أن الفيديو يتناول WhisperX وBlotato، لكن ذلك ربما جاء من صياغة استعلامي أنا، فهو **[غير متحقَّق]**.

| الادعاء (من تفريغ المستخدم) | الحكم | التفصيل |
|---|---|---|
| Claude Code + Opus 5.5 | ✅ صحيح | Opus 5.5 نموذج حالي من Anthropic (docs على platform.claude.com). |
| Python 3.12 + Node.js 22 + FFmpeg | ✅ معقول | Node 22 أو أحدث شرط رسمي لـHyperFrames. أما Python 3.12 فلأدوات Whisper (WhisperX يعمل على 3.10+). **رقم 3.12 نفسه غير متحقَّق.** |
| "Whisper M1XD" على GPU لتوقيت الكلمات | 🔧 **تصحيح:** الأرجح **WhisperX** | كلمة "على GPU" مع "توقيت كلمات" تطابق WhisperX (CUDA مع محاذاة wav2vec2). أما **mlx-whisper** فيعمل على Apple Silicon عبر MLX، وليس "GPU" بالمعنى المعتاد، ولا يوفر محاذاة دقيقة. **الأداتان موجودتان وتحققتُ منهما:** ‏`whisperx 3.8.6` و`mlx-whisper 0.4.3`. **الترجيح: WhisperX.** وإن كان المقدم يستخدم Mac فقد يكون mlx-whisper. |
| حذف الصمت والإعادات تلقائياً | ✅ ممكن | عبر auto-editor للصمت، وقص الإعادات بناءً على النص المفرّغ كما يفعل video-use وstudent-kit. |
| Remotion (React 19) للعناوين والشعارات بدقة 1080p/4K | ✅ صحيح | ‏Remotion 4.0.530 يقبل `react >=16.8`، أي React 19 مدعوم. ⚠️ **ترخيص الشركات، انظر القسم 3.** |
| "Hyperframe/Highfield" | 🔧 **تصحيح:** الاسمان حقيقيان ومختلفان | **HyperFrames** (من HeyGen) للموشن بـHTML. و**Higgsfield AI** (higgsfield.ai) لتوليد الفيديو والصور بالذكاء الاصطناعي، وله **MCP connector لـClaude** يتيح نماذج Veo 3.1 وSora 2 وKling 3.0 وSeedance 2.0 وغيرها **[مقتطف بحث: higgsfield.ai/mcp]**. غالباً ذُكر الاثنان معاً: HyperFrames للموشن، وHiggsfield للقطات B-roll المولّدة. |
| Google Drive لجلب المادة الخام | ✅ معقول | عبر connector أو rclone. **كيف فعله المقدم بالضبط غير متحقَّق.** |
| Blotato API/MCP للنشر الآلي على YouTube والسوشال | ✅ صحيح [مقتطف بحث] | عنوان MCP هو `https://mcp.blotato.com/mcp`، والإضافة بأمر `claude mcp add --transport http Blotato https://mcp.blotato.com/mcp`. ينشر على 9 منصات: X وLinkedIn وFacebook وInstagram وTikTok وYouTube وThreads وBluesky وPinterest. **الـAPI/MCP متاحة في الخطط المدفوعة فقط** (من $29 شهرياً)، والتجربة المجانية لا تشملها. |
| ثمبنيلات A/B | ✅ صحيح، وهي ميزة **YouTube الأصلية "Test & Compare"** | حتى 3 ثمبنيلات أو عناوين أو تركيبات منهما، ومدة الاختبار حتى أسبوعين، والفائز يُحدَّد **حسب watch time**. توسعت لتشمل العناوين وانتشرت على نطاق واسع في 12/2025، وهي لمن يملك Advanced Features **[مقتطف بحث: support.google.com/youtube/answer/16391400]**. ⚠️ **لم أتحقق من أن Blotato يستطيع ضبط Test & Compare عبر API.** الأرجح أن هذا يُضبط يدوياً من YouTube Studio **[غير متحقَّق]**. |

### الفيديو 2: `AW3Uku__BBE` — "Opus 5.5 Is The Best Video Editor I've Ever Used" لـ**Paul J Lipsky** (نُشر في 2026-09-28)
- تحققتُ منه عبر ملف feed عام على GitHub (`leJuan5150/ME-PUBLIC`) يحوي العنوان والوصف والفصول:
  - 0:00 Intro
  - 0:23 Claude Setup
  - 1:03 Meet Borumi
  - 2:18 Record in Scenes
  - 3:12 Manual Editing
  - 5:49 Connect Claude
  - 7:29 Motion Graphics
  - …
- الوصف يقول: *"Claude Opus 5.5 now handles nearly my entire YouTube editing workflow, including silence removal, bad takes, layouts, zooms, highlights, motion graphics, and even screen recordings."*، وفيه رابط affiliate لـBorumi.

| الادعاء | الحكم | التفصيل |
|---|---|---|
| "Broomi MCP" | 🔧 **تصحيح: Borumi** (borumi.com) | برنامج تسجيل شاشة وكاميرا ومونتاج. يسجل الكاميرا والشاشة والمايك **كطبقات منفصلة**. **أضاف Borumi MCP في الإصدار 0.29** لربطه بـClaude Desktop وChatGPT Desktop. وفي 0.31.4 (بتاريخ 2026-09-28) أُصلح خلل يمنع Borumi MCP من العمل مع Claude Code **[مقتطف بحث من borumi.com/changelog]**. ومستودع edit-borumi-video يؤكد أن الـMCP يعمل عبر `Borumi.app/Contents/MacOS/borumi mcp` **(macOS)**. |
| ربط Claude بـ"timeline graph" المحرر | ✅ صحيح جوهرياً | الـMCP يعدّل المشروع مباشرة: المشاهد والمقاطع والنسخ. يدعم **project version history**، وأدوات لطلب التفريغ ونسخ المشاهد بين الفيديوهات **[مقتطف بحث]**. |
| skill باسم "edit broomi video" | 🔧 **تصحيح:** اسمها `edit-borumi-video` (Samin12) | تحققتُ منها في README. تقوم بـ: first-pass cut (قواعد OpenCut: ‏pause 500ms، ‏min cut 300ms، ‏margin 120ms)، وoverlays لتسجيلات العرض التي صوتها مكتوم، وchapter cards تُرسم **بـHyperFrames**، ومقدمة مصورة، وQA بـwhisper، ثم التصدير مع SRT وفصول يوتيوب. **ملاحظة:** هي من عمل Samin Yasar، و**لم أتحقق من أنها نفس الـskill التي عرضها Paul في الفيديو.** وتعتمد على مستودعين خاصّين لا يمكن الوصول إليهما. |
| قص الصمت والأخطاء، وقص حواف الشاشة، وlayouts تلقائية، وzoom تلقائي على نقاط التفاعل، وhighlighting | ✅ كلها **ميزات أصلية في Borumi** | auto-zoom وcursor following، وlayouts جاهزة، وتوسيط الوجه، و"Remove Mistakes from Borumi Videos with AI" **[مقتطف بحث]**. Claude يستدعيها عبر MCP. |
| إملاء صوتي ينتج موشن 9:16 ورسوماً بيانية | ✅ معقول | عبر HyperFrames (`/motion-graphics` وblock ‏`data-chart`). **استعمال الإملاء الصوتي في الفيديو غير متحقَّق.** |
| Claude يسجل الشاشة بنفسه لقطات B-roll | ✅ معقول | الوصف يذكر "even screen recordings". **الآلية لم أتحقق منها**، وربما تكون Playwright أو Borumi MCP. |
| بدائل ذكرها المستخدم: **Screen Studio** | ⚠️ **تصحيح** | صفحة hub.screen.studio/p/claude-code-plugin-to-edit-a-recorded-video **طلب ميزة (feature request) بحالة "in review"**، وليست plugin منشورة **[مقتطف بحث]**. توجد skills من طرف ثالث لـScreen Studio، مثل `oil-oil/screen-studio-editor`، ولم أتحقق منها. Descript وTella وCap **ليست المقصودة**. |

---

## 8. توصيات عملية أولية للمونتير (من واقع البحث)

1. **البداية:** ‏`claude plugin install hyperframes@hyperframes`، ثم استنسخ `nateherkai/hyperframes-student-kit` و`heygen-com/hyperframes-launches` مرجعاً.
2. **الـPipeline المقترح لفيديو متكلم عربي:**
   1. `auto-editor` لحذف الصمت كمرحلة أولى، مع إمكانية التصدير إلى Premiere/Resolve.
   2. WhisperX بـ`--language ar` مع مراجعة بشرية للهجة الشامية.
   3. Claude يكتب composition بـHyperFrames. `/talking-head-recut` للـlower-thirds والعناوين، و`/embedded-captions` للكابشن. يُقسَّم النص **بالكلمات** فقط.
   4. `npx hyperframes lint && check && render --docker`.
3. **قواعد عربية ثابتة تُضاف إلى CLAUDE.md للمشروع:**
   - لا `dir` على `<html>`.
   - `direction: rtl` على عناصر النص.
   - لا تقسيم بالحروف، أو استعمل `splitArabicText`.
   - الخطوط محلية في `fonts/`.
   - نظام أرقام موحّد.
   - `--language ar --model large-v3`.
4. **الترخيص:** إذا كان المونتير يعمل لصالح شركة فيها أكثر من 3 موظفين (قناة إخبارية مثلاً)، **فاختيار HyperFrames (Apache-2.0) مع GSAP (مجاني) أسلم من Remotion.**

---

## 9. المصادر

**تحققتُ منها مباشرة، بقراءة الملف أو عبر API:**
- https://github.com/heygen-com/hyperframes (README وCLAUDE.md وpackage.json)
- https://raw.githubusercontent.com/heygen-com/hyperframes/main/docs/guides/claude-design-hyperframes.md
- https://raw.githubusercontent.com/heygen-com/hyperframes/main/docs/guides/claude-design-send-to-hyperframes.md
- https://raw.githubusercontent.com/heygen-com/hyperframes/main/docs/guides/mcp.mdx
- https://raw.githubusercontent.com/heygen-com/hyperframes/main/docs/packages/cli.mdx
- https://raw.githubusercontent.com/heygen-com/hyperframes/main/docs/guides/troubleshooting.mdx
- https://raw.githubusercontent.com/heygen-com/hyperframes/main/docs/prompting/captions-catalog.mdx
- https://github.com/heygen-com/hyperframes/blob/main/packages/lint/src/rules/composition.ts (قاعدة RTL)
- https://github.com/heygen-com/hyperframes/blob/main/packages/producer/src/services/deterministicFonts.ts
- https://www.npmjs.com/package/hyperframes (`0.8.95`، ‏node >=22)
- https://www.npmjs.com/package/gsap (`3.15.0`، ومنها README وSplitText.js وقائمة الـplugins)
- https://github.com/greensock/gsap-skills
- https://github.com/remotion-dev/remotion/blob/main/LICENSE.md
- https://github.com/remotion-dev/skills
- https://github.com/m-bain/whisperX (README وalignment.py)
- https://pypi.org/project/whisperx/ و https://pypi.org/project/mlx-whisper/ و https://pypi.org/project/faster-whisper/ و https://pypi.org/project/auto-editor/
- https://github.com/WyattBlue/auto-editor
- https://github.com/browser-use/video-use
- https://github.com/google/fonts (ملفات METADATA.pb للخطوط العربية المذكورة)
- https://github.com/nateherkai/hyperframes-student-kit
- https://github.com/notivn/AIEV
- https://github.com/assafkip/claude-video-editor
- https://github.com/Navidbyti/motion-studio
- https://github.com/siyuanfeng636-cpu/agentic-motion-graphics
- https://github.com/haxzie/genmotion
- https://github.com/zhuyansen/awesome-claude-video-skills
- https://github.com/freshtechbro/claudedesignskills
- https://github.com/Eskapeum/animation-forge
- https://github.com/digitalsamba/claude-code-video-toolkit
- https://github.com/wilwaldon/Claude-Code-Video-Toolkit
- https://github.com/Samin12/edit-borumi-video
- https://github.com/midrender/revideo
- https://github.com/leJuan5150/ME-PUBLIC/blob/main/daily-digest-feed/feeds.json (بيانات الفيديو AW3Uku__BBE)

**[مقتطف بحث]، أي المواقع المحجوبة عن شبكتنا ولم أفتحها مباشرة:**
- https://gsap.com/blog/3-13/ و https://webflow.com/blog/gsap-becomes-free و https://gsap.com/community/standard-license/
- https://gsap.com/docs/v3/HelperFunctions/helpers/splitArabicText/
- https://dev.to/esatturan/arabic-letters-stop-joining-the-moment-you-split-the-word-404c
- https://www.remotion.dev/docs/license/pricing
- https://claude.com/connectors/hyperframes
- https://www.heygen.com/research/html-to-video
- https://www.youtube.com/watch?v=cmxZ4FvKuig و https://www.youtube.com/watch?v=AW3Uku__BBE
- https://borumi.com/changelog/
- https://www.blotato.com/claude و https://help.blotato.com/api/mcp/faqs
- https://higgsfield.ai/mcp
- https://support.google.com/youtube/answer/16391400
- https://hub.screen.studio/p/claude-code-plugin-to-edit-a-recorded-video
- https://www.mindstudio.ai/blog/ai-video-editing-claude-code-hyperframes
- https://x.com/nateherk/status/2047180643516227965 و https://www.skool.com/ai-automation-society/new-video-opus-55-just-changed-video-editing-forever-free-skills
- https://charliehills.substack.com/p/opus-55-motion-graphics
- https://elevenlabs.io/speech-to-text/arabic و https://www.speechmatics.com/how-we-compare/elevenlabs-scribe-alternative
- https://arxiv.org/html/2412.13788 (Open Universal Arabic ASR Leaderboard) و https://huggingface.co/oddadmix/whisper-large-v3-turbo-arabic-dialectal
