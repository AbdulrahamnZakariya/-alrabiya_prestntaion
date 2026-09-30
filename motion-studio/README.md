# استوديو الموشن العربي: التقرير النهائي للفريق

> Claude Code (Opus 5.5) + HyperFrames + GSAP 3 + Remotion + Whisper + Blotato
> تاريخ التقرير: 30 أيلول 2026 · أعدّه فريق من 5 أدوار (بحث، أفكار فايرال، تصميم وحركة، هندسة أنظمة، هندسة برومبت)

---

## الخلاصة بسطور

1. **HyperFrames** (من HeyGen، مفتوح المصدر Apache-2.0، النسخة 0.8.95) بتكتب فيه الفيديو كصفحة HTML + CSS + GSAP timeline متوقف، وبيحوّلها لـ MP4 فريم بفريم. **جرّبناه فعلياً** على فيديو عربي 1080×1920: الرندر أخد 7 ثواني، والحروف متصلة صح، وكل رندر بيطلع مطابق للي قبله بالبت.
2. **GSAP 3.15 صار مجاني بالكامل** مع كل الإضافات (SplitText, MorphSVG, DrawSVG…) حتى للشغل التجاري.
3. **Remotion** شغّال كمان (جرّبناه بالعربي). مجاني للأفراد والشركات لحد 3 موظفين، وأكبر من هيك بدها رخصة مدفوعة.
4. **الفرصة الحقيقية:** المحتوى العربي تقريباً فاضي من «موشن إكسبلينر + داتا متحركة + برومبت ← فيديو». وAfter Effects بيتعب مع العربي، بينما المتصفح بيرسم العربي صح. هاد هو **الخندق (moat)** تبعك.
5. **جاهز عندك:** كيت كامل (CLAUDE.md + 10 skills + 3 وكلاء مراجعة + hooks حماية)، سكربت قص السكتات والإعادات، زووم تلقائي لتسجيلات الشاشة، وخطة نشر 30 يوم.

---

## 1. شو كان بالفيديوهين فعلاً (تصحيح الأسماء)

| اللي انكتب بالتفريغ | الحقيقة بعد التحقق |
|---|---|
| الفيديو `AW3Uku__BBE` | "Opus 5.5 Is The Best Video Editor I've Ever Used" لـ **Paul J Lipsky** (نُشر 28 أيلول 2026) |
| الفيديو `cmxZ4FvKuig` | فيديو **بالإسبانية**: "Claude Opus 5.5 despidió a mi equipo de edición de vídeo" (القناة ما تأكدنا منها) |
| Broomi MCP | **Borumi**: مسجّل شاشة وكاميرا لـ macOS، ضاف MCP server من نسخة 0.29. في skill عامة اسمها `edit-borumi-video` (Samin12) وما تأكدنا إنها نفسها اللي بالفيديو |
| Whisper M1XD | غالباً **WhisperX** (على كرت NVIDIA)، أو **mlx-whisper** إذا الشغل على ماك |
| Hyperframe/Highfield | أداتين مختلفتين: **HyperFrames** (موشن بالكود) و **Higgsfield AI** (توليد فيديو بالذكاء الاصطناعي، إلو MCP لـ Claude) |
| Blotato | صحيح: نشر تلقائي لـ 9 منصات عبر MCP/API (بالخطط المدفوعة) |
| A/B thumbnails | ميزة يوتيوب نفسها **Test & Compare**: لحد 3 صور، **للفيديوهات الطويلة بس مش للـ Shorts**، وما لقينا API إلها |

---

## 2. ابدأ الآن: خطوات اليوم الأول

### أ) التثبيت (ماك Apple Silicon)
```bash
xcode-select --install
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node ffmpeg git rclone uv          # تأكد إنو node -v ≥ 22
curl -fsSL https://claude.ai/install.sh | bash  # Claude Code
claude --version

mkdir -p ~/studio && cd ~/studio && git init
uv python install 3.12
uv venv --python 3.12 .venv && source .venv/bin/activate
uv pip install mlx-whisper auto-editor mcp
npx hyperframes@latest doctor
npx hyperframes browser ensure
```

### أ) التثبيت (ويندوز 11 مع كرت NVIDIA)
```powershell
winget install OpenJS.NodeJS.LTS Git.Git Gyan.FFmpeg Rclone.Rclone astral-sh.uv
irm https://claude.ai/install.ps1 | iex
mkdir $HOME\studio; cd $HOME\studio; git init
uv python install 3.12
uv venv --python 3.12 .venv; .venv\Scripts\activate
# ثبّت CUDA Toolkit 12.8 أولاً، بعدين:
uv pip install whisperx auto-editor mcp
npx hyperframes@latest doctor; npx hyperframes browser ensure
```

### ب) ركّب الكيت والإضافات الرسمية
```bash
# فك arabic-motion-kit.zip جوّا ~/studio (أو انسخ محتوى motion-studio/kit)
unzip arabic-motion-kit.zip -d .
chmod +x .claude/hooks/*.sh .claude/skills/first-pass-edit/scripts/edl.py
npm init -y && npm i -D hyperframes

claude plugin marketplace add heygen-com/hyperframes
claude plugin install hyperframes@hyperframes
npx skills add remotion-dev/skills                       # إذا رح تستعمل Remotion
claude mcp add --transport http blotato https://mcp.blotato.com/mcp   # الاسم لازم blotato بحروف صغيرة
```
بعدها نزّل ملفات الخطوط (Alexandria و IBM Plex Sans Arabic من Google Fonts) وحطها بـ `brand/fonts/`.

### ج) أول رسائل جوّا Claude Code
1. `/context` ← لازم تشوف CLAUDE.md. و `/hooks` ← لازم تشوف الحارس وبوابة النشر.
2. فحص البيئة:
   ```
   اقرأ CLAUDE.md و brand/tokens.css و brand/motion.js.
   تأكد إنو كل ملف خط موجود بـ brand/fonts/، وشغّل npx hyperframes doctor،
   ولخّصلي قواعد الاستوديو بـ 8 نقاط. ما تعدّل ولا ملف.
   ```
3. اختبار 3 ثواني:
   ```
   اعمل مشروع videos/smoke-test بـ npx hyperframes init وانسخ brand/ جوّاه.
   مشهد 9:16 مدته 3 ثواني: «أهلاً وسهلاً بالاستوديو» تدخل كلمة كلمة من اليمين
   (stagger 0.2s، power3.out) والكلمة «الاستوديو» بلون --c-accent.
   بعدين شغّل /qa-gate smoke-test وورجيني مسارات الصور.
   ```
   افتح الصور بنفسك: الحروف متصلة؟ الترتيب من اليمين؟ إذا آه، الأساس شغّال.
4. أول فيديو حقيقي: من سكربت `/storyboard-director videos/ep01/script.md 9:16 25`
   أو من فوتج خام `/raw-to-published ~/Movies/raw/ep01 ep01 hyperframes`
5. آخر النهار: «شو أكتر شي أخد تعديلات اليوم؟ اقترح 3 أسطر نضيفها لـ CLAUDE.md وما تعدّل لحتى وافق.»

---

## 3. المعمارية: منهجيتين بخط واحد

```
فوتج خام (Drive عبر rclone أو ملف محلي)
   │
   ▼
تفريغ بتوقيت كل كلمة ── WhisperX / mlx-whisper  (--language ar, large-v3)
   │
   ▼
قص أولي: سكتات + تأتأة + إعادات (بيحتفظ بآخر أخذة) ── autocut.py / edl.py
   │                                                  ◆ موافقتك على edl.json
   ▼
ستوريبورد + هوك ── /storyboard-director + /viral-hook-writer   ◆ موافقتك
   │
   ▼
مشاهد موشن: HyperFrames (HTML+GSAP) للموشن الصافي
            Remotion (React 19) للفوتج + زووم + تبديل layouts
   │                                                  ◆ موافقتك على style frame
   ▼
كابشن عربي بالكلمة + QA gate (30 بند) + رندر
   │
   ▼
نسخ 9:16 / 1:1 / 16:9 ── /aspect-variants
   │
   ▼
حزمة النشر (عناوين، هاشتاغ، ثمبنيلين) ── /publish-pack   ◆ لازم تكتب «انشر»
   │
   ▼
Blotato MCP ← يوتيوب، تيك توك، إنستغرام…
```
**المنهجية التفاعلية (زي Borumi):** سكربت Playwright بيسجّل الشاشة وبيسجّل مكان كل كبسة، و `autozoom.py` بيعمل زووم تلقائي على الكبسات بـ 9:16، و `timeline_mcp.py` سيرفر MCP صغير بيخلّي Claude يعدّل الـ timeline (edl.json) بأدوات. الثلاثة اشتغلوا بالتجربة.

---

## 4. الأفكار: شو تنشر

**الفجوة:** العربي عن الذكاء الاصطناعي أغلبه «قوائم أدوات» وحكي للكاميرا، والموشن العربي أغلبه تمبليتس إعلانية. أنت مونتير حقيقي بيبني موشن عربي بالكود وبيورجي الطريقة.

| الترتيب | السلسلة | ليش |
|---|---|---|
| 1 | **«اكتبلي وبحرّكها»** | الناس بتكتب كلمة/اسم بالكومنت وبتصير خط عربي متحرك. أعلى تفاعل، ومحرّك نمو ذاتي |
| 2 | **«مونتير ضد برومبت»** | سباق بتوقيت حقيقي: أنت بـ After Effects ضد Claude بالكود. سلطة + زبائن B2B |
| 3 | **«كلمة وأصلها»** | أصول الكلمات الشامية بطباعة حركية. علم ينتفع به وبيتشارك عائلياً ومش مربوط بترند |
| 4 (من الأسبوع 3) | **«درس بدقيقة»** | تسجيل شاشة + زووم تلقائي. أوضح فايدة، وأسرع باب لربح الشركات |

**خطة 30 يوم (1-30 تشرين الأول):** 5 ريلز بالأسبوع على Reels + TikTok، ونسخة Shorts، و LinkedIn لفيديوهات السباق. جدول ثابت (سبت/ثلاثاء: كلمة وأصلها · أحد/أربعاء: اكتبلي · اثنين: مونتير ضد برومبت). جرّب الهوكات بـ Trial Reels. **ما تحكم على سلسلة قبل 6 حلقات.**

**أهداف القياس:** مشاهدة أول 3 ثواني ≥ 65% · متوسط مشاهدة ≥ 60% · (مشاركة + حفظ) ÷ وصول ≥ 2% · ≥ 30 كومنت لكل «اكتبلي».

**الربح:** خدمات موشن للوكالات والبراندات، توطين الإعلانات لعدة لهجات، تيوتوريالات للشركات، تمبليتس و skills **عربية تحديداً** (الإنجليزية متوفرة مجاناً)، كورسات بالعربي.

الأفكار الـ 21 كاملة مع الهوك لكل وحدة: `reports/02-viral-ideas.md`

---

## 5. نظام التصميم («جميل مرعب» بدون AI slop)

- **الفخامة قرار:** لون تمييز واحد، خطّين بس، فرق أوزان حاد (300 مقابل 900)، 95% من الانتقالات قطع حاد على الإيقاع.
- **الخطوط (كلها OFL مجانية):** الافتراضي **Alexandria** للعناوين + **IBM Plex Sans Arabic** للنص. Cairo و Tajawal صاروا «Inter العربي» من كثرة الاستعمال، استعملهم عن قصد بس.
- **الألوان (3 لوحات، التباين محسوب):** «ليل الزعفران» `#0F0E13 / #F4EFE6 / #E8A33D` · «رمل وحبر» `#F3ECE0 / #1B1A17 / #0F5C4D` · «برتقالي الإشارة» `#101826 / #F7F3EA / #FF5A36`.
- **المنطقة الآمنة 9:16:** x من 120 لـ 960، y من 220 لـ 1500. أزرار تيك توك وريلز على اليمين بتصطدم بالنص العربي.
- **سرعة القراءة:** العربي 138 كلمة/دقيقة مقابل 228 للإنجليزي. ثبّت النص `max(1.5s, 0.6 + كلمات/2)`. أقصى شي كلمتين بالثانية.
- **الزووم بتسجيلات الشاشة:** ‎1.6–2.2x، يبدأ 0.45 ثانية قبل الكبسة، 0.6 ثانية دخول، ثبات ≥ 1.2 ثانية، زووم واحد كل 3-4 ثواني بالكتير.
- **الصوت نص الفخامة:** الـ hit عند حوالي 30% من حركة `expo.out`، وصمت قصير قبل الضربة الكبيرة.

### قواعد العربي الذهبية (مجرّبة بالاختبار)
1. **ممنوع تقسيم العربي لحروف** (SplitText `chars` بيفك الوصل). حرّك بالكلمة أو السطر، أو اكشف بقناع `clip-path` من اليمين.
2. **ممنوع `dir="rtl"` على `<html>`** بـ HyperFrames (خطأ lint وممكن يطلع فيديو أسود). حط `direction: rtl` على المشهد وحاويات النص.
3. **`letter-spacing` ما بيشتغل على العربي** بالمتصفح. البديل الكشيدة أو محور الوزن بالخطوط المتغيرة.
4. **الأرقام:** حدّد النظام صراحة (`ar-u-nu-arab` = ١٢٣ أو `ar-u-nu-latn` = 123).
5. **الخطوط محلية دايماً** (`@font-face` لملف بـ `brand/fonts/`). HyperFrames ما فيه خطوط عربية مدمجة.
6. **التفريغ العربي:** `transcribe` الافتراضي إنجليزي بس. استعمل `--model large-v3 --language ar`. وبالشامي نسبة الغلط عالية (تقريباً 28-58% حسب النموذج)، فكل كابشن بدها مراجعة بشرية.

العشر حركات المميزة مع الكود (HyperFrames + Remotion): `reports/03-design.md` و `design-assets/`

---

## 6. الكيت الجاهز (`kit/` أو `arabic-motion-kit.zip`)

| الملف | الوظيفة |
|---|---|
| `CLAUDE.md` | دستور الاستوديو (100 سطر): العربي، الحتمية، المناطق الآمنة، الجودة، قاعدة النشر |
| `brand/tokens.css` + `motion.js` | هويتك: ألوان، خطوط، easing، مدد، مولّد عشوائي ببذرة. **عدّلهم لهويتك** |
| `skills/raw-to-published` | الخط الكامل من الفوتج للنشر، مع 🛑 نقاط موافقة |
| `skills/first-pass-edit` | قص السكتات والتأتأة والإعادات من التفريغ (مع `edl.py` مجرّب) |
| `skills/storyboard-director` · `viral-hook-writer` | ستوريبورد بالثواني والفريمات · هوكات بآليات مختلفة |
| `skills/brand-scene-builder` · `remotion-scene-builder` | بناء المشاهد بـ HyperFrames أو Remotion |
| `skills/arabic-kinetic-captions` | كابشن كاريوكي عربي بالكلمة |
| `skills/qa-gate` · `aspect-variants` · `publish-pack` | فحص الجودة · النسخ 9:16/1:1/16:9 · حزمة النشر |
| `agents/motion-critic` · `arabic-type-reviewer` · `script-writer` | ناقد حركة وناقد خط عربي (قراءة بس) + كاتب سكربت شامي |
| `hooks/hf-guard.sh` | بعد كل تعديل: بيمنع تقسيم الحروف، العشوائية، الساعة، `repeat:-1` |
| `hooks/publish-gate.sh` | **بيسألك قبل أي نشر** على Blotato حتى لو Claude بوضع تلقائي |

مكتبة 15 برومبت شامي جاهز للنسخ: `reports/05-prompts.md` القسم 7.

---

## 7. شو المطلوب منك أنت (مش من Claude)

Claude بيولّد البنية والحركة والبيانات والتنويعات. **أنت** بتقرر الذوق والقصة، بتختار وبتمكس الصوت، بتصوّر الفوتج، بتراجع العربي والأرقام والحقوق، وبتختار الثمبنيلز. وكل ما Claude يغلط نفس الغلطة مرتين، زيد سطر بـ CLAUDE.md.

**خارطة 4 أسابيع:** (1) تثبيت + smoke test + هويتك بالـ tokens · (2) 3 تمبليتس للسلاسل الأولى + 6 حلقات جاهزة · (3) الخط الآلي كامل على «درس بدقيقة» + Blotato بالموافقة · (4) قياس: كم دقيقة من التسجيل للنشر (الهدف < 30 دقيقة) وكم نسبة الكابشن اللي بدها تصحيح.

---

## 8. مخاطر ولازم تنتبه إلها

- **تعب الناس من AI slop:** الجودة والذوق هم الفرق. ما تنشر إشي ما مرق من QA gate.
- **يوتيوب وسياسة المحتوى المكرّر/الجماعي:** بتهدد السلاسل المؤتمتة بالكامل. خلّي فيها لمسة بشرية واضحة.
- **النشر الآلي:** دايماً بموافقتك (الـ hook بيفرضها).
- **الحقوق:** تراخيص الخطوط، الشعر الحديث، شعارات البراندات، وبيانات الناس بالفيديوهات الشخصية.
- **المحتوى السياسي:** في تاريخ تقييد على ميتا لمحتوى متعلق بفلسطين.
- **HyperFrames لسا قبل 1.0:** بيتغير بسرعة. خلّي Claude يتأكد من `--help` قبل أي أمر مش مؤكد.

### شو ما قدرنا نتأكد منو 100%
- أرقام المناطق الآمنة للمنصات (مصادر طرف ثالث بتختلف)، وأسعار Remotion و Blotato وأسماء أدوات Blotato.
- صيغة `--batch` و `--caption-zone` بـ HyperFrames.
- التفريغ العربي نفسه ما جرّبناه هون (موقع huggingface محجوب بالبيئة). قص السكتات اتجرّب على مقطع اصطناعي.
- الكيت ككل ما اتجرّب بجلسة Claude حقيقية بتحمّل الـ skills والـ hooks وبترندر منها.

---

## 9. محتوى هاد المجلد

| المسار | الوصف |
|---|---|
| `reports/01-research.md` | البحث: HyperFrames، GSAP، Remotion، الريبوز، صنّاع المحتوى، التحقق من الفيديوهين |
| `reports/02-viral-ideas.md` | 21 فكرة، التوب 3، خطة 30 يوم، الهوكات، الربح، المخاطر |
| `reports/03-design.md` | دستور التصميم والحركة: خطوط، ألوان، 10 حركات بالكود، QA gate |
| `reports/04-engineering.md` | المعمارية، التثبيت، المقارنة، خارطة الطريق، نتائج الاختبار |
| `reports/05-prompts.md` | كيت البرومبتات كامل ومكتبة البرومبتات |
| `kit/` · `arabic-motion-kit.zip` | الكيت الجاهز للنسخ لمشروعك |
| `pipeline/` | `autocut.py` (قص)، `autozoom.py` (زووم)، `record_broll.mjs` (تسجيل شاشة)، `timeline_mcp.py` (سيرفر MCP) |
| `design-assets/` | الحركات العشر (HyperFrames + Remotion) وصور الاختبار |
| `samples/` | فيديوهات الاختبار ومشاريعها |
