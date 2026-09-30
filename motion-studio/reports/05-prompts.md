# 05 — كيت البرومبتات والأوامر: استوديو موشن غرافيكس عربي
### Claude Code (Opus 5.5) + HyperFrames + GSAP 3 (+ Remotion للفوتج)

> **لمين هالملف؟** لمحرّر موشن غرافيكس (شامي) بدو يخلّي Claude Code يطلّع فيديوهات سوشال ميديا عربية بجودة ثابتة.
> **شو فيه؟** مبادئ كتابة البرومبت للموشن، ملف `CLAUDE.md` جاهز، 10 skills، 3 subagents، hooks بتمنع الأغلاط الشائعة، مكتبة 12 برومبت (+3 إضافيين) بالعربي، أوامر اليوم الأول، وحلقة شغل «برومبت ← مراجعة ← تصليح» بنقاط تفتيش.
> كل ملفات الكيت محفوظة كمان كملفات جاهزة للنسخ بمسارها الحقيقي تحت `team/kit/`.

---

## 0. الخلاصة بدقيقة

1. **الستوريبورد قبل الكود دايماً.** Claude بيصلّح جدول أسرع وأرخص بكتير من ما يصلّح HTML.
2. **احكي معو بلغة المصمّم:** مشاهد، ثواني + فريمات، هرمية (H1/H2)، easing، tokens. مش «خليها حلوة».
3. **العربي بيتحرّك كلمة كلمة، مش حرف حرف.** الحروف العربية متصلة؛ لما تقسّمها لـ spans بتنفكّ. هاد أكتر غلط رح تشوفو، وعشان هيك في hook بيمسكو أوتوماتيك.
4. **الحتمية (determinism):** ممنوع `Math.random` و`Date.now` و`repeat:-1` والخطوط من النت. الرندر لازم يطلع نفس الشي كل مرة.
5. **صوّر وقارن:** كل تعديل بينتهي بـ snapshots عند أوقات محددة، وانت بتحكم عالصور مش على كلام Claude.
6. **النشر ما بيصير إلا بكلمة «انشر» منك.** في hook بيطلب موافقتك قبل أي أداة Blotato.

### شجرة الكيت (انسخها لجذر مشروعك)

```
arabic-motion-studio/
├── CLAUDE.md                          ← قواعد الاستوديو (بتنقرا كل جلسة)
├── brand/
│   ├── tokens.css                     ← ألوان، خطوط، أحجام، safe zones
│   ├── motion.js                      ← eases، مدد، stagger، rng(seed)، wordsToSpans()، fmtNum()
│   └── fonts/                         ← ملفات woff2 محلية (نزّلها انت)
├── .claude/
│   ├── settings.json                  ← صلاحيات + hooks
│   ├── hooks/hf-guard.sh              ← بيفحص كل تعديل (تقطيع حروف، عشوائية، <br>، lint…)
│   ├── hooks/publish-gate.sh          ← بيطلب موافقتك قبل أي نشر
│   ├── skills/
│   │   ├── raw-to-published/SKILL.md  ← الأوركسترا: من فوتج خام لنشر
│   │   ├── first-pass-edit/SKILL.md (+ scripts/edl.py)
│   │   ├── storyboard-director/SKILL.md
│   │   ├── viral-hook-writer/SKILL.md
│   │   ├── brand-scene-builder/SKILL.md
│   │   ├── remotion-scene-builder/SKILL.md
│   │   ├── arabic-kinetic-captions/SKILL.md
│   │   ├── qa-gate/SKILL.md
│   │   ├── aspect-variants/SKILL.md
│   │   └── publish-pack/SKILL.md
│   └── agents/
│       ├── motion-critic.md
│       ├── script-writer.md
│       └── arabic-type-reviewer.md
└── videos/<slug>/                     ← مشروع HyperFrames (أو Remotion) لكل فيديو
```

---

## 1. أوامر اليوم الأول (بالترتيب، حرفياً)

### أ) بالتيرمنال (مرة وحدة)

```bash
# 1. مجلد الاستوديو + git (عشان نرجع لأي نقطة تفتيش)
mkdir arabic-motion-studio && cd arabic-motion-studio && git init

# 2. انسخ الكيت (عدّل المسار حسب مكان team/kit عندك)
cp -r /path/to/team/kit/. .
chmod +x .claude/hooks/*.sh .claude/skills/first-pass-edit/scripts/edl.py

# 3. المتطلبات: Node 22+ و FFmpeg (HyperFrames بيحتاجهم)
node -v && ffmpeg -version | head -1

# 4. خلّي الـ hook يقدر يشغّل lint (اختياري بس منصوح فيه)
npm init -y && npm i -D hyperframes

# 5. skills الرسمية لـ HyperFrames (بتعطي Claude عقد التكوين والحركة الرسمي)
claude plugin marketplace add heygen-com/hyperframes
claude plugin install hyperframes@hyperframes

# 6. (إذا رح تستعمل Remotion) skills الرسمية لـ Remotion
npx skills add remotion-dev/skills

# 7. (للنشر) Blotato MCP — خلّي الاسم blotato بحروف صغيرة لأنو الـ hook بيطابق mcp__blotato__
claude mcp add --transport http blotato https://mcp.blotato.com/mcp

# 8. نزّل ملفات الخطوط المذكورة بـ brand/tokens.css لـ brand/fonts/ (كلها OFL من Google Fonts)

# 9. شغّل Claude Code
claude
```

### ب) جوّا Claude Code (أول 7 رسائل)

**1) تأكد إنو كل شي انقرا:**
```
/context
```
(لازم تشوف `CLAUDE.md` تحت Memory files). وبعدين:
```
/hooks
```
(لازم تشوف PostToolUse على Write|Edit و PreToolUse على mcp__blotato__.*). وبالـ `/mcp` سجّل دخول Blotato.

**2) فحص البيئة:**
```
اقرأ CLAUDE.md و brand/tokens.css و brand/motion.js.
1. تأكد إنو كل ملف خط مذكور بـ @font-face موجود فعلاً بـ brand/fonts/ — إذا في شي ناقص اعطيني لستة بالأسماء بالظبط.
2. شغّل npx hyperframes doctor وقلي إذا في مشكلة.
3. لخّصلي قواعد الاستوديو بـ 8 نقاط بالعربي عشان اتأكد إنك فهمتها.
ما تعدّل ولا ملف.
```

**3) اختبار دخان (smoke test) — 3 ثواني:**
```
اعمل مشروع تجريبي: npx hyperframes init videos/smoke-test، وانسخ brand/ جوّاه.
ابني مشهد واحد 3 ثواني 9:16: الجملة «أهلاً وسهلاً بالاستوديو» تدخل كلمة كلمة من اليمين (stagger 0.2s، power3.out)، والكلمة «الاستوديو» بـ --c-accent.
بعدين شغّل /qa-gate smoke-test وورجيني مسارات الـ snapshots.
```
افتح الصور بنفسك: الحروف متصلة؟ الترتيب من اليمين؟ إذا آه، الأساس شغّال.

**4) تركيب الهوية:** استعمل البرومبت رقم 10 من المكتبة (Brand tokens) مع دليل الهوية تبعك.

**5) أول فيديو حقيقي:** إما من سكربت:
```
/storyboard-director videos/ep01/script.md 9:16 25
```
أو من فوتج خام (مسار محلي أو فولدر Drive):
```
/raw-to-published ~/Movies/raw/ep01 ep01 hyperframes
```

**6) كل ما يوقف عند 🛑 نقطة تفتيش:** راجع، ردّ بملاحظات مرقّمة (شوف القسم 7)، أو «تمام كمّل».

**7) آخر النهار:**
```
شو أكتر شي أخد تعديلات اليوم؟ اقترح 3 أسطر بالكتير نضيفها لـ CLAUDE.md، وما تعدّلو لحتى وافق.
```

---

## 2. مبادئ كتابة البرومبت للموشن غرافيكس

### 2.1 ليش هالمبادئ؟ (من توثيق Anthropic نفسه)
- **كون واضح ومباشر:** Claude متل «موظف جديد ذكي كتير بس ما بيعرف عاداتك». كل ما حددت أكتر، كل ما صلّحت أقل.
- **اشرح السبب:** بدل «ممنوع تقسم الحروف» اكتب «ممنوع تقسم الحروف لأنو العربي متصل والحروف بتنفكّ». Claude بيعمّم من السبب لحالات ما ذكرتها.
- **قول شو بدك، مش بس شو ما بدك.** بدل «لا تعمل حركة مملة» → «الدخول 0.4s بـ expo.out والكلمة القوية تعمل scale 0.6→1».
- **سمّي الأنماط اللي بدك تتجنبها بالاسم:** توثيق Opus 5.5 بيقول إنو «تجنّب الشكل العام» بيبدّل default بـ default تاني؛ الأحسن تقول «ممنوع gradient بنفسجي، ممنوع fade-in لكل عنصر، ممنوع bounce».
- **أعطيه طريقة يتحقق فيها:** snapshots عند أوقات محددة + `lint` + `check`. بدونها «شكلو خالص» هو الإشارة الوحيدة عندو.
- **استكشف ← خطط ← نفّذ:** الستوريبورد هو الـ «plan» تبعنا.
- **نظّف الـ context:** `/clear` بين فيديو وفيديو. إذا صحّحت نفس الغلط مرتين وما زبط، `/clear` وابدأ ببرومبت أحسن فيه اللي تعلمتو.

### 2.2 تشريح برومبت موشن ممتاز (9 عناصر)

| # | العنصر | مثال |
|---|---|---|
| 1 | الهدف والجمهور | «ريل لأصحاب المطاعم الصغيرة، الهدف يحجزوا ديمو» |
| 2 | الفورمات | «9:16، 1080×1920، 30fps، 18 ثانية» |
| 3 | المحتوى الحرفي | النص العربي بالظبط بين «» |
| 4 | المشاهد والتوقيت | «مشهد 2: 2.4→5.0s (f72→f150)» |
| 5 | الهرمية | «H1 = الرقم، H2 = الشرح، ولا شي تالت» |
| 6 | الحركة | «enter: كلمة كلمة من اليمين، stagger 0.12، power3.out 0.6s · exit: wipe 0.35s power2.in» |
| 7 | البراند | «من tokens بس، accent واحد بالمشهد» |
| 8 | المرجع والقيود | screenshot / رابط / «متل X بس أهدى» + الممنوعات مع السبب |
| 9 | التسليم والتحقق | «ورجيني snapshots عند 0.3, 2.0, 4.8 وما تكمل لحتى قلك تمام» |

**قالب جاهز (انسخو وعبّيه):**
```
الهدف: [...] · الجمهور: [...] · CTA: [...]
الفورمات: [9:16 | 1:1 | 16:9]، 30fps، [..] ثانية
النص عالشاشة (حرفياً):
  مشهد 1: «...»
  مشهد 2: «...»
الحركة: [enter / hold / exit + ease + مدة + اتجاه RTL]
الهرمية: H1 = [...]، H2 = [...]
المرجع: [صورة/رابط/وصف] — بدي [الشي اللي عاجبني فيه] بس [الفرق]
ممنوع: [...] لأنو [...]
التسليم: ستوريبورد أول ← style frame ← snapshots عند [أوقات] ← استنى موافقتي
```

### 2.3 التوقيت بلغة الفريمات
- اشتغل على **30fps** واكتب الوقت دايماً «ثواني / فريم»: `1.20s / f36`. الـ helper `f(36)` بـ `motion.js` بيحوّل.
- **وقت القراءة:** `hold ≥ 0.5s + عدد الكلمات ÷ 3`. جملة 6 كلمات بدها 2.5 ثانية عالأقل.
- **الهوك:** شي ظاهر من f0 (ممنوع fade من الأسود)، والوعد مقروء قبل 0.5s.
- **الإيقاع:** مشهد 1.5–4s، transition 0.3–0.4s، بعد ~8s حركة كثيفة اعطي نفَس 0.5–1s، والـ end card hold ≥ 1.5s.

### 2.4 الـ Easing (house style مأخوذ من skill الحركة الرسمي لـ HyperFrames)
- دخول: `.out` (الافتراضي `power3.out`) · خروج: `.in` (≈ 0.6× مدة الدخول) · حركة متماثلة: `.inOut`.
- للتنويع غيّر **الطاقة** مش النوع: `sine/power1` هادي ← `power3` عادي ← `power4/expo` ضربة.
- `back / elastic / bounce` بس إذا البريف قال «مرح». مش افتراضي أبداً.
- مدد: UI 0.35s · عادي 0.6s · hero 0.9s. Stagger: كابشن 0.08–0.15s، kinetic type 0.15–0.3s. استعمل `stagger` و`fromTo()` مش تأخيرات يدوية و`from()`.

### 2.5 العربي و RTL (الأهم)
- `dir="rtl"` و`lang="ar"`. الحركة «للأمام» يعني من اليمين لليسار: الدخول من `x:+40`، الـ wipe بيفتح من الحافة اليمين: `clipPath: inset(0 0 0 100%) → inset(0 0 0 0%)`.
- **كلمة كلمة أو سطر سطر.** بدك إحساس «حرف حرف»؟ استعمل wipe/mask/blur على الكلمة كلها.
- ممنوع `letter-spacing` وممنوع italic على العربي.
- الكلمات اللاتينية والأرقام والـ @handles جوّا جملة عربية بـ `<bdi>`.
- نظام أرقام واحد بالفيديو (123 أو ١٢٣) — `fmtNum()` بـ `motion.js` بيلتزم بـ `--numerals`.
- line-height ≥ 1.5 للنص، والـ masks بدها padding عمودي عشان النقاط والتشكيل وذيول (ي ع ج) ما تنقص.
- المحتوى: ممنوع آيات/أحاديث كـ kinetic typography، والاقتباسات بالنسبة يلي انت بتعطيها بس.

### 2.6 الحلقة مع الصور (screenshots)
- `npx hyperframes snapshot videos/<slug> --at 0.3,2.0,4.8` بيطلّع PNG لكل وقت؛ `--zoom '#s2-h1'` بيقرّب على عنصر؛ `--against ref.mp4` بيحط فريم المرجع جنب فريمك.
- Opus 5.5 بيقرا الـ screenshots بدقة عالية (حسب توثيق Anthropic)، فلما تلصق screenshot اكتب ملاحظاتك **مرقّمة ومع تايم كود**.
- بعد كل تصليح اطلب **نفس الأوقات** عشان تقارن before/after.

### 2.7 أعطال شائعة وتصليحها

| العَرَض | السبب الغالب | التصليح (قولو هيك) |
|---|---|---|
| الحروف مفكّكة / «م ر ح ب ا» | تقسيم chars (SplitText أو split("")) | «حرّك كلمة كلمة بـ wordsToSpans()، ولا حرف لحال» (الـ hook بيمسكها) |
| الأرقام أو الكلمة الإنجليزية نطّت لمحل غلط | bidi | «حط اللاتيني والأرقام بـ `<bdi>`» |
| النقطة تحت الياء مقصوصة | mask `overflow:hidden` بلا padding | «زيد padding-block 0.25em و line-height 1.5» |
| الرندر غير عن البريفيو / وميض | `Math.random`/`Date.now`/CSS transition | «كل شي من التايملاين بس؛ عشوائية بـ rng(seed)» |
| الخط طلع Arial بالرندر | خط من النت أو ما استنى تحميلو | «@font-face محلي + ابني التايملاين بعد document.fonts.ready» |
| فريم أسود بالأول أو بالآخر | fade من الأسود / التايملاين أقصر من data-duration | «f0 فيه الهوك، والتايملاين يغطي المدة كلها» |
| كل العناصر بتتحرك نفس الحركة (شكل AI) | ما في هرمية | «hero واحد بكل مشهد، وحركة مميزة لإلو بس؛ الباقي هادي» |
| حركة مطاطية رخيصة | back/elastic | «house eases: power3.out دخول، power2.in خروج» |
| نص كتير عالشاشة | نسخ الـ VO للشاشة | «على الشاشة ≤ 7 كلمات = عنوان المشهد» |
| النص تحت أزرار تيك توك | ما في safe zones | «التزم بـ --safe-9x16-* وافحص بـ check» |
| الكابشن متأخر عن الصوت بعد القص | استعمل الترانسكريبت القديم | «استعمل edit/transcript.cut.json» |
| Claude عدّل مشاهد ما طلبتها | برومبت مفتوح | «عدّل X بس، ولا تلمس غيرو» + git commit + `/rewind` |
| «خلصت!» بلا دليل | ما في شرط تحقق | «ما بقبل خلصت بلا مسارات snapshots وتقرير qa-gate» |
| بعد جلسة طويلة نسي القواعد | الـ context امتلا | `/clear` + «كمّل من RUN.md» |

---

## 3. ملف CLAUDE.md الجاهز
**المسار:** `CLAUDE.md` بجذر المشروع. تحت الـ 200 سطر حسب توصية Anthropic. التعليقات `<!-- -->` العربية فيه **بتنشال قبل ما توصل للموديل** (موثّق)، فبتقدر تكتب ملاحظاتك لحالك ببلاش tokens.

~~~~markdown
# Arabic Motion Studio — HyperFrames + GSAP 3

<!--
ملاحظة للمحرّر (هاد التعليق بينشال تلقائياً قبل ما يوصل لـ Claude، فما بياكل tokens):
- هاد الملف بيتقرا ببداية كل جلسة. خلّيه قصير (< 200 سطر). أي إجراء طويل حطّه بـ skill.
- كل ما Claude يغلط نفس الغلطة مرتين، زيد سطر هون.
- عدّل قسم Brand حسب هويتك، والقيم التفصيلية بتضل بـ brand/tokens.css و brand/motion.js.
-->

We produce short Arabic (Levantine/MSA) motion-graphics videos for social media.
Every video is a HyperFrames project: HTML + CSS + one paused GSAP 3 timeline, rendered to MP4.
The editor is a motion designer, not a developer: explain choices in plain Arabic, keep code tidy.

## Layout
- `brand/` — source of truth: `tokens.css` (colors, type, spacing, safe zones), `motion.js` (eases, durations, staggers), `fonts/` (local .woff2 only), `logo.svg`.
- `videos/<slug>/` — one HyperFrames project per video (`npx hyperframes init videos/<slug>`), then copy `brand/` into it so fonts load locally.
- Inside a project: `brief.md` → `storyboard.md` → `index.html` (+ `compositions/*.html`) → `snapshots/` → `renders/`.
- `.claude/skills/` holds our workflows: `/raw-to-published` (full run), `/first-pass-edit`, `/storyboard-director`, `/viral-hook-writer`, `/brand-scene-builder`, `/remotion-scene-builder`, `/arabic-kinetic-captions`, `/qa-gate`, `/aspect-variants`, `/publish-pack`. Subagents: `motion-critic`, `script-writer`, `arabic-type-reviewer`.
- Talking-head projects also have `videos/<slug>/raw/` (originals, never modified), `edit/` (transcript.json, edl.json, cut.mp4, transcript.cut.json) and `publish/`.
- If the official HyperFrames skills are installed (`/hyperframes`, `/hyperframes-core`, `/hyperframes-animation`, `/hyperframes-cli`), consult them for framework details; this file only adds studio rules on top.

## Commands
- Preview: `npx hyperframes preview` (live reload) · Timeline: `npx hyperframes timeline --json`
- Lint: `npx hyperframes lint` · Browser gate: `npx hyperframes check --snapshots --at-transitions`
- Stills: `npx hyperframes snapshot --at 0.3,1.5,3.0` (PNGs in `snapshots/`; crop with `--zoom '#selector'`)
- Draft render: `npx hyperframes render --quality draft --output renders/draft.mp4`
- Final render (only after the editor approves): `npx hyperframes render --quality delivery --output renders/<slug>-<ratio>.mp4`
- Variants: `--variables '{"hook":"..."}'` or `--batch rows.json`. Transcribe Arabic: `npx hyperframes transcribe audio.wav --model large-v3 --language ar`

## Engine choice
- HyperFrames (HTML + GSAP): pure motion graphics — hooks, kinetic type, stats/charts, logo stings, quote cards. Default.
- Remotion (React 19): footage-driven edits — cut talking-head + zooms, layout switches, overlays, data-driven charts. Frame-driven only (`useCurrentFrame` + `interpolate`/`spring`); CSS transitions/animations are forbidden there.
- One engine per video. Need both? Render one as a clip and import it into the other.
- After any cut, all timing comes from `edit/transcript.cut.json`, never from the raw transcript.

## Workflow (never skip a gate)
1. Storyboard first. No HTML before the editor approves `storyboard.md` (scenes, exact on-screen Arabic text, seconds + frames, motion, easing).
2. Build one hero "style frame" scene, snapshot it, get approval, then build the rest.
3. Run `/qa-gate` before showing any draft. Show evidence (snapshot paths, check output), not claims.
4. Render final only on explicit approval. After delivery, propose 1–3 lines to add here if we learned something.

## Composition contract (HyperFrames)
- Root: `data-composition-id`, `data-width`, `data-height`, `data-duration`; timed elements are `class="clip"` with `data-start`, `data-duration`, `data-track-index`.
- Exactly one `gsap.timeline({ paused: true })` per composition, registered as `window.__timelines["<composition-id>"]` (key must equal the root id).
- Build the timeline after `document.fonts.ready` resolves, so Arabic metrics are final before any measuring.
- Use `fromTo()` (explicit start state) rather than `from()`. Use `stagger` rather than hand-offset tweens.
- Animate transforms and opacity only (`x`, `y`, `scale`, `rotation`, `opacity`, `clipPath`, filters). Never tween `display`, `visibility`, `autoAlpha`, `width`, `height`, `top`, `left` on `.clip` elements; animate a child wrapper instead.
- Never pair a CSS `transform` with a GSAP tween on the same property; center with flexbox/inset, not `translate(-50%,-50%)`.
- No `<br>` in text. Each line is its own block element.

## Determinism (renders must be frame-identical every time)
- IMPORTANT: no `Date.now()`, `performance.now()`, `new Date()`, unseeded `Math.random()`, network requests, or `repeat: -1`. The renderer seeks the timeline frame by frame; anything clock-based or random will flicker or differ between renders.
- Need randomness (particles, jitter)? Use the seeded `rng(seed)` helper from `brand/motion.js`.
- Fonts, images, audio: local files only, declared with `@font-face` pointing to `brand/fonts/*.woff2`. No Google Fonts `<link>`, no fetch/XHR. Load GSAP exactly the way the `npx hyperframes init` template does; add no other remote scripts.
- Loops: use a finite `repeat` computed from the scene duration.

## Arabic & RTL rules (the most common failure — read twice)
- `<html lang="ar">` WITHOUT `dir` — HyperFrames lint flags `html_dir_attribute_breaks_render` (can render a blank video). Put `direction: rtl` (or `dir="rtl"`) on the text elements / scene wrappers instead.
- IMPORTANT: never split Arabic into letters. Arabic letters join; per-character spans break the joining forms, ligatures (لا) and diacritics, and the word renders as disconnected letters. Animate by word (or line). With SplitText use `type: "words"` or `"lines"` only — never `"chars"`. Never `text.split("")`, `Array.from(text)`, or per-letter loops on Arabic.
- Want a "letter-by-letter" feel? Use a right-to-left `clipPath` wipe, mask, blur-in, or gradient sweep on the whole word.
- Reading order is right→left: stagger in DOM (logical) order, entrances travel from the right (`x: +40 → 0`) or from below, wipes open from the right edge: `clipPath: "inset(0 0 0 100%)" → "inset(0 0 0 0%)"`.
- Never add `letter-spacing` to Arabic, never `font-style: italic`, no `text-justify: kashida`.
- Wrap Latin words, @handles, URLs and numbers inside Arabic sentences in `<bdi>` (or `<span dir="ltr">`) so punctuation doesn't jump. Use Arabic punctuation: ، ؛ ؟
- Numerals: follow `--numerals` in `tokens.css` (`latn` = 123 or `arab` = ١٢٣) consistently in one video. Count-ups: `Intl.NumberFormat("ar-u-nu-<latn|arab>")`, `font-variant-numeric: tabular-nums`, fixed-width box.
- Line-height ≥ 1.5 for body/captions (dots and tashkeel need room), ≥ 1.2 for display. Masks with `overflow: hidden` need vertical padding (≥ 0.25em) so ي ع ج descenders and dots aren't clipped.
- Max 2 lines per text block; captions 2–5 words per line; balance lines (`text-wrap: balance`).
- Content: no Quranic verses, hadith or other sacred text as kinetic typography. Quotes must be neutral and attributed exactly as the editor supplied; never invent a quote or attribute one to a real person.

## Brand (details in `brand/tokens.css`, `brand/motion.js`)
- Use CSS variables only (`var(--c-accent)`), never raw hex in compositions. One dominant background, one accent per scene.
- Fonts: `--font-display` for hooks/numbers, `--font-body` for captions, `--font-quote` only for quotes.
- House easing: entrances `power3.out`, exits `power2.in` (≈ 0.6× entrance duration), moves `power2.inOut`, punch `expo.out`. `back`/`elastic`/`bounce` only when the brief says "playful".
- Durations: UI 0.35s · standard 0.6s · hero 0.9s · transitions 0.3–0.4s. Word stagger 0.08–0.15s (captions), 0.15–0.3s (kinetic type).

## Timing & hierarchy
- 30 fps. Always state times in seconds AND frames (e.g. `1.20s / f36`).
- First frame (f0) must already show the hook — no fade from black, no empty frame. Hook fully readable by 0.5s.
- Hold text long enough to read: `hold ≥ max(1.5s, 0.6s + words / 2)` (Arabic reads ~138 wpm, slower than English). Never ask for more than 2 words/second on screen.
- One idea per scene; one hero element per frame (H1), max one supporting line (H2).
- After ~8s of dense motion, give a 0.5–1s calm beat. Hold the logo/CTA end card ≥ 1.5s.
- The timeline must cover `data-duration` exactly; no black or frozen frames at the end.

## Safe zones (Arabic app UIs can mirror, so protect both sides)
- 9:16 1080×1920: keep text/logos inside x 120–960, y 250–1500. Captions band y 1180–1460. Nothing important in the bottom 420px.
- 1:1 1080×1080: 80px margin. 16:9 1920×1080: 96px margin; captions band y 820–980.
- Values live in `tokens.css` as `--safe-*`; position with them, never eyeball.

## QA definition of done
- `lint` and `check` pass with zero errors; snapshots at the storyboard key times are reviewed (open the PNGs and look).
- Checklist: Arabic joined correctly · no clipped dots/descenders · RTL order · inside safe zones · contrast passes · text on screen long enough · easing matches house style · ends cleanly.
- Report as: what changed, evidence paths, open issues. Don't say "done" without snapshots.

## Publishing (hard rule)
- Never publish, schedule or upload to any social account (Blotato MCP or otherwise) unless the editor typed «انشر» / "publish" for the exact package in `publish/plan.json` in this conversation. A hook also asks before every Blotato call; never work around it.
- Never delete or overwrite files in `raw/` or on Google Drive.

## Iteration etiquette
- When the editor sends a screenshot with notes, restate each note as a numbered fix with the element id and timecode, fix only those, re-snapshot the same timecodes, and show before/after paths.
- Change the minimum; don't restyle scenes that weren't mentioned.
- Commit with git at each approved checkpoint (`storyboard ok`, `style frame ok`, `draft ok`, `final`).
~~~~

### ملفات البراند (بيعتمد عليها CLAUDE.md)
**`brand/tokens.css`** — بدّل القيم لهويتك:

~~~~css
/* ============================================================
   Brand tokens — source of truth for every composition.
   بدّل القيم حسب هويتك. ما تحط hex مباشرة بالمشاهد، استعمل var(--...).
   ============================================================ */

/* Fonts: download the .woff2 files into brand/fonts/ (all below are OFL, on Google Fonts).
   الخطوط لازم تكون محلية، ممنوع <link> لـ Google Fonts وقت الرندر. */
@font-face { font-family: "Brand Display"; src: url("./fonts/Alexandria-Black.woff2") format("woff2"); font-weight: 900; font-display: block; }
@font-face { font-family: "Brand Display"; src: url("./fonts/Alexandria-Bold.woff2") format("woff2"); font-weight: 700; font-display: block; }
@font-face { font-family: "Brand Body";    src: url("./fonts/IBMPlexSansArabic-Medium.woff2") format("woff2"); font-weight: 500; font-display: block; }
@font-face { font-family: "Brand Body";    src: url("./fonts/IBMPlexSansArabic-Bold.woff2") format("woff2"); font-weight: 700; font-display: block; }
@font-face { font-family: "Brand Quote";   src: url("./fonts/ArefRuqaa-Bold.woff2") format("woff2"); font-weight: 700; font-display: block; }

:root {
  /* ---------- Color (one dominant bg + one accent per scene) ---------- */
  --c-bg:        #0B0D12;   /* dominant background */
  --c-bg-2:      #151924;   /* cards / panels */
  --c-ink:       #F5F3EE;   /* primary text */
  --c-ink-dim:   #A9ADB8;   /* secondary text */
  --c-accent:    #F2B43C;   /* brand accent (highlights, active caption word) */
  --c-accent-2:  #2EC4B6;   /* secondary accent — data / positive */
  --c-alert:     #E4572E;   /* breaking / negative */
  --c-caption-bg: rgba(11, 13, 18, 0.72);

  /* ---------- Type ---------- */
  --font-display: "Brand Display", sans-serif;
  --font-body:    "Brand Body", sans-serif;
  --font-quote:   "Brand Quote", serif;
  --numerals: latn;          /* latn = 123 | arab = ١٢٣ — pick one per video */

  /* Scale for a 1080px-wide canvas (9:16 and 1:1). Multiply by ~1.1 for 16:9. */
  --fs-hero:    150px;  --lh-hero:    1.2;
  --fs-h1:      112px;  --lh-h1:      1.2;
  --fs-h2:       76px;  --lh-h2:      1.3;
  --fs-body:     52px;  --lh-body:    1.55;
  --fs-caption:  60px;  --lh-caption: 1.5;
  --fs-label:    36px;  --lh-label:   1.4;

  /* ---------- Spacing / radius ---------- */
  --space-1: 12px; --space-2: 24px; --space-3: 40px; --space-4: 64px; --space-5: 96px;
  --radius-card: 28px; --radius-pill: 999px;

  /* ---------- Safe zones (px), 9:16 1080x1920 ---------- */
  --safe-9x16-top: 250px;  --safe-9x16-bottom: 420px;  --safe-9x16-side: 120px;
  --caption-9x16-top: 1180px; --caption-9x16-bottom: 1460px;
  /* 1:1 1080x1080 */
  --safe-1x1: 80px;
  /* 16:9 1920x1080 */
  --safe-16x9: 96px; --caption-16x9-top: 820px; --caption-16x9-bottom: 980px;
}

/* Arabic text defaults */
[dir="rtl"] { font-family: var(--font-body); letter-spacing: 0; font-style: normal; }
.w { display: inline-block; }                   /* one animated word — never one letter */
.num { font-variant-numeric: tabular-nums; }
.line { display: block; text-wrap: balance; }   /* one element per line — no <br> */
.mask { overflow: hidden; padding-block: 0.25em; } /* padding keeps dots/descenders visible */
~~~~

**`brand/motion.js`** — (مختبَر: `rng(42)` بيرجع نفس الرقم كل مرة، `fmtNum(12500)` بيطلع `١٢٬٥٠٠` أو `12,500` حسب `--numerals`، `f(36)=1.2`):

~~~~javascript
// Brand motion tokens + deterministic helpers. Load with <script src="brand/motion.js"></script>
// قيم الحركة الموحّدة للاستوديو. غيّرها هون مرة وحدة بدل ما تغيّرها بكل مشهد.
window.BRAND_MOTION = {
  fps: 30,
  ease: {
    in: "power3.out",      // entrances
    out: "power2.in",      // exits
    move: "power2.inOut",  // position/scale moves, camera drifts
    punch: "expo.out",     // hook hits, numbers landing
    calm: "sine.inOut",    // ambient loops / background drift
  },
  dur: { ui: 0.35, base: 0.6, hero: 0.9, exit: 0.4, transition: 0.35 },
  stagger: { captionWord: 0.09, kineticWord: 0.2, line: 0.18, card: 0.12 },
  // RTL: "forward" travel is right -> left, so entrances start at +x.
  enterX: 48,
  enterY: 36,
};

// Frame helpers: always think in frames at 30fps.
window.f = (frames) => frames / window.BRAND_MOTION.fps;   // f(36) === 1.2s

// Seeded PRNG (mulberry32). Same seed => same "random" every render.
window.rng = function (seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Split an Arabic string into word spans (never letters). Keeps punctuation attached to its word.
window.wordsToSpans = function (el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = "";
  words.forEach((w, i) => {
    const s = document.createElement("span");
    s.className = "w";
    s.textContent = w;
    el.appendChild(s);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
  return el.querySelectorAll(".w");
};

// Localized numbers for count-ups, following --numerals in tokens.css.
window.fmtNum = function (n, opts = {}) {
  const nu = getComputedStyle(document.documentElement).getPropertyValue("--numerals").trim() || "latn";
  return new Intl.NumberFormat(`ar-u-nu-${nu}`, { maximumFractionDigits: 0, ...opts }).format(n);
};
~~~~

---

## 4. الـ Skills (10 ملفات)
الصيغة متحققة من توثيق Claude Code: ملف `SKILL.md` بمجلد باسم الـ skill، frontmatter YAML (كل الحقول اختيارية، `description` منصوح فيه وبيتقصّ مع `when_to_use` عند 1,536 حرف)، `$ARGUMENTS` للمدخلات، `disable-model-invocation: true` للشغلات اللي فيها أثر (متل النشر) عشان ما يشغّلها Claude لحالو، `allowed-tools` بيعطي صلاحية مسبقة للأدوات خلال هالدور بس. خلّي كل `SKILL.md` تحت 500 سطر.

| Skill | بتشغّلها أنا؟ | Claude لحالو؟ | شو بتعمل |
|---|---|---|---|
| `/raw-to-published` | ✅ | ❌ | الأوركسترا الكاملة بنقاط تفتيش |
| `/first-pass-edit` | ✅ | ✅ | قص السكتات/الإعادات من الترانسكريبت → EDL |
| `/storyboard-director` | ✅ | ✅ | سكربت → ستوريبورد موقّت |
| `/viral-hook-writer` | ✅ | ✅ | 5 هوكات بآليات مختلفة + rows.json |
| `/brand-scene-builder` | ✅ | ✅ | بناء المشاهد بـ HyperFrames + GSAP |
| `/remotion-scene-builder` | ✅ | ✅ | بناء بـ Remotion (فوتج، zooms، layouts) |
| `/arabic-kinetic-captions` | ✅ | ✅ | كابشن كاريوكي كلمة كلمة RTL |
| `/qa-gate` | ✅ | ✅ | lint + check + snapshots + checklist |
| `/aspect-variants` | ✅ | ✅ (بعد موافقتك) | 9:16 / 1:1 / 16:9 + batch |
| `/publish-pack` | ✅ | ❌ | عناوين، هاشتاغات، thumbnails A/B، نشر بعد «انشر» |

### 4.1 storyboard-director
**المسار:** `.claude/skills/storyboard-director/SKILL.md`

~~~~markdown
---
name: storyboard-director
description: Turns an Arabic script, brief, or idea into a timed shot list (storyboard.md) for a HyperFrames motion-graphics video BEFORE any HTML is written. Use when the user shares a script/idea/brief, says "storyboard", "shot list", "ستوريبورد", "قسّم السكربت لمشاهد", or asks for a new video.
when_to_use: First step of every new video, and whenever the structure or timing of an existing video changes.
argument-hint: "[path-to-script-or-brief] [ratio 9:16|1:1|16:9] [target seconds]"
allowed-tools: Read Write Glob
---

# Storyboard Director

You are a motion-graphics director for Arabic social video. Your output is a storyboard the editor can approve in two minutes. You write NO HTML in this skill.

Input: $ARGUMENTS (a script path or pasted text, optional ratio, optional target length). Defaults: 9:16, 30 fps, 15–30 s.

## Steps

1. Read `brand/tokens.css`, `brand/motion.js`, and `videos/<slug>/brief.md` if they exist. If the goal, audience, or CTA is missing, ask at most ONE short question, otherwise assume and state your assumptions at the top.
2. Split the script into beats: one idea per scene. Scene length 1.5–4 s (hook 1.5–3 s, end card ≥ 1.5 s). Rewrite on-screen text to be shorter than the voice-over: on-screen text is the headline, not the transcript.
3. Budget reading time: `hold ≥ 0.5s + words/3`. If a scene can't fit its text, split the scene or cut words — never shrink the font below `--fs-body`.
4. Assign hierarchy per scene: exactly one H1 (hero), optional H2, optional label. Pick one accent color for the scene.
5. Choose motion per element from the house vocabulary (entrance / hold / exit + ease + duration). Arabic text animates by word or line only; letter-like feel = RTL clip-path wipe.
6. Choose transitions (0.3–0.4 s): cut on motion, RTL push, mask wipe from the right, scale-through, flash. Avoid fade-to-black between every scene.
7. Mark 3–6 key times for QA snapshots: opening frame (0.3 s), each scene's signature moment, final hold.
8. Write `videos/<slug>/storyboard.md` using the template below, then print a compact summary and ask: "موافق على الستوريبورد؟ ولا بدك تعدّل شي؟"

## Template (write exactly this structure)

```markdown
# <Title> — storyboard v1
Ratio: 9:16 (1080×1920) · FPS: 30 · Duration: 18.0s (f540) · Numerals: latn
Goal: … · Audience: … · CTA: … · Assumptions: …

| # | In → Out (s / frames) | On-screen text (exact Arabic) | Hierarchy | Visual & layout | Motion (enter · hold · exit) | Ease / dur | Transition out | Audio cue |
|---|---|---|---|---|---|---|---|---|
| 1 | 0.00→2.40 / f0→f72 | «…» | H1 | big type, center, accent underline | words stagger 0.2s from right · hold · wipe out | power3.out 0.6 / power2.in 0.4 | RTL push 0.35s | whoosh at 2.3s |

## Key snapshot times
0.3, 1.2, 4.8, 9.0, 17.5

## Risks / notes
- long word «…» may wrap at 9:16 → test at style frame
```

## Rules
- Times in seconds AND frames at 30 fps; scene times must be contiguous and sum to the total.
- Scene 1 shows the hook on frame 0 (no fade from black).
- Quote the exact Arabic on-screen text in «» so it can be pasted into HTML unchanged. Spell dialect consistently.
- No sacred text (Quran/hadith) as kinetic type; quotes only with the attribution the user gave.
- Keep everything inside the safe zones from `tokens.css`; note any element that is at risk.
~~~~

### 4.2 viral-hook-writer
**المسار:** `.claude/skills/viral-hook-writer/SKILL.md`

~~~~markdown
---
name: viral-hook-writer
description: Writes and stages Arabic (Levantine or MSA) opening hooks for short social videos — the first 1.5–3 seconds — and produces A/B hook variants as HyperFrames variables. Use when the user asks for a hook, an opening, "أول 3 ثواني", "هوك", "نسخ A/B", or wants to test several openings.
argument-hint: "[topic or script path] [count, default 5] [dialect: levantine|msa]"
allowed-tools: Read Write Glob
---

# Viral Hook Writer

Goal: stop the scroll in the first second without lying. Input: $ARGUMENTS.

## Step 1 — understand the payoff
Read the script/storyboard. Write one sentence: "The viewer who stays will get ___." Every hook must be honestly paid off by the video. No clickbait the video doesn't deliver.

## Step 2 — write hooks with different mechanisms
Write the requested number of hooks (default 5), each using a DIFFERENT mechanism so the A/B test actually tests something:

| Mechanism | Levantine example shape |
|---|---|
| Surprising number | «٩ من كل ١٠ …» / «90% ما بيعرفوا …» |
| Contradiction | «كل شي تعلّمته عن … غلط» |
| Direct question | «ليش … ؟» |
| Pain / relatable | «إذا بتعاني من … شوف هاد» |
| Open loop | «آخر نقطة هي اللي غيّرت كل شي» |
| Before/after | «من … لـ … بـ ٣ خطوات» |

Constraints per hook:
- ≤ 7 words on screen (≤ 32 characters), readable in under 1.2 s. Voice-over line may be longer.
- One word is the "punch word" (gets the accent color / scale hit). Mark it with `*…*`.
- Dialect as requested; default Levantine for social. Consistent spelling (هيك، شو، بدّك، منيح، هلّق).
- No sacred text, no invented statistics: if a number isn't in the source, write `[رقم؟]` and flag it.

## Step 3 — stage each hook (motion, not just words)
For each hook give: the visual on frame 0, the punch moment (time + frame), and the motion (e.g. "punch word scales 0.6→1 with expo.out at f6, others fade-up by word, stagger 0.12s from right").

## Step 4 — output
1. A table: `id | mechanism | on-screen text | voice-over | punch word | staging`.
2. A `hooks.rows.json` in the project for batch rendering, one row per hook. Use the composition's declared variable ids (default `hook_text`, `punch_word`, `accent`) and include an `id`/name key if the project's render template needs it for the output filename; check `npx hyperframes render --help` for the exact batch row shape before writing it.
3. Recommend which 2 to test first and why (one sentence each).

The hook scene itself is built with `/brand-scene-builder`; the variables are declared on the composition root via `data-composition-variables` and read once with `window.__hyperframes.getVariables()`.
~~~~

### 4.3 brand-scene-builder
**المسار:** `.claude/skills/brand-scene-builder/SKILL.md`

~~~~markdown
---
name: brand-scene-builder
description: Builds HyperFrames + GSAP scenes from an approved storyboard.md using the studio brand tokens (brand/tokens.css, brand/motion.js), Arabic RTL rules and safe zones. Starts with one style frame, then the rest. Use when the user says "ابنِ المشهد", "build the scene", "نفّذ الستوريبورد", asks for a hook scene, logo reveal, data/stat scene, quote, lower-third, or any on-brand motion scene.
argument-hint: "[slug] [scene numbers or 'all' or 'style-frame']"
allowed-tools: Read Write Edit Glob Grep Bash(npx hyperframes *)
---

# Brand Scene Builder

Input: $ARGUMENTS. Precondition: `videos/<slug>/storyboard.md` exists and the editor approved it. If not, stop and run `/storyboard-director` first.

## Before writing code
1. Read the storyboard, `brand/tokens.css`, `brand/motion.js`. If the official `/hyperframes-core` and `/hyperframes-animation` skills are available, load them for the composition contract and motion rules.
2. Check the catalog before hand-authoring: `npx hyperframes catalog --query "<scene idea>"`. Reuse a block if it fits and restyle it with our tokens.
3. Make sure `videos/<slug>/brand/` exists (copy of `brand/`) so fonts load locally.

## Build order
1. **Style frame:** build ONLY the storyboard's hero scene (usually the hook). Snapshot at its signature time and show it. Wait for "ok" before building other scenes.
2. **Remaining scenes:** one `<section class="clip">` per scene (or one sub-composition per scene in `compositions/` when the video is > 5 scenes), timings copied exactly from the storyboard.
3. **Transitions** last, at the scene seams (0.3–0.4 s).

## Skeleton (standalone composition)

```html
<!doctype html>
<html lang="ar">  <!-- no dir on <html>: HyperFrames lint html_dir_attribute_breaks_render; dir="rtl" goes on #stage -->
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="brand/tokens.css">
  <style>
    #stage { width: 100%; height: 100%; background: var(--c-bg); color: var(--c-ink); overflow: hidden; }
    .scene { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center;
             padding: var(--safe-9x16-top) var(--safe-9x16-side) var(--safe-9x16-bottom); }
    .h1 { font-family: var(--font-display); font-weight: 900; font-size: var(--fs-h1); line-height: var(--lh-h1); text-align: center; }
  </style>
</head>
<body>
  <div id="stage" data-composition-id="main" data-width="1080" data-height="1920" data-duration="18" dir="rtl">
    <section id="s1" class="clip scene" data-start="0" data-duration="2.4" data-track-index="0">
      <div class="mask"><h1 id="s1-h1" class="h1 line">«النص العربي من الستوريبورد»</h1></div>
    </section>
    <!-- more scenes… -->
  </div>
  <!-- keep the GSAP <script> exactly as the `npx hyperframes init` template includes it -->
  <script src="brand/motion.js"></script>
  <script>
    document.fonts.ready.then(() => {
      const M = window.BRAND_MOTION;
      const tl = gsap.timeline({ paused: true });
      const words = wordsToSpans(document.querySelector("#s1-h1"));        // words, never letters
      tl.fromTo(words, { x: M.enterX, opacity: 0 },                          // RTL: enter from the right
                       { x: 0, opacity: 1, duration: M.dur.base, ease: M.ease.in, stagger: M.stagger.kineticWord }, 0);
      tl.to("#s1-h1", { clipPath: "inset(0 100% 0 0)", duration: M.dur.exit, ease: M.ease.out }, 2.4 - M.dur.exit);
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;                                       // key == data-composition-id
    });
  </script>
</body>
</html>
```

## Scene recipes (pick, then adapt)
- **Hook:** background + visual present at f0; punch word `scale 0.6→1, expo.out, 0.5s` at f3–f6; supporting words stagger by word from right.
- **Stat / count-up:** number in `--font-display` `.num`, tween a proxy object `{v:0}` and write `fmtNum(v)` in `onUpdate`; label fades up 0.2 s after; hold ≥ 1.2 s on the final number.
- **Bar chart:** bars `scaleY 0→1` with `transformOrigin: "bottom"`, `stagger: 0.12`, `power3.out`; values count up in sync; in RTL the first category is on the right.
- **Quote (neutral, attributed):** `--font-quote`, line by line mask reveal from right, attribution in `--font-body` `--c-ink-dim` 0.4 s later. No sacred text.
- **Logo reveal:** use `brand/logo.svg`; mask/scale-in with `power4.out`, a single accent sweep, hold ≥ 1.5 s. Don't distort the logo's aspect ratio or recolor it outside the brand palette.
- **Lower-third:** bar wipes from the right (`scaleX 0→1`, `transformOrigin: "right"`), name then title stagger 0.15 s, inside safe zone.

## Hard rules (from CLAUDE.md, repeated because they break most often)
- Tokens only (no raw hex / px font sizes). Arabic by word/line only. `fromTo` with explicit start states. Transforms + opacity + clipPath only. No clocks / unseeded random / network / `repeat: -1`. No `<br>`.
- Every scene's text must fit its safe zone at the storyboard's font size; if it doesn't, shorten the text in the storyboard (ask), don't shrink below `--fs-body`.

## After building
Run `npx hyperframes lint`, fix errors, then run `/qa-gate`. Show snapshot paths for the storyboard's key times.
~~~~

### 4.4 arabic-kinetic-captions
**المسار:** `.claude/skills/arabic-kinetic-captions/SKILL.md`

~~~~markdown
---
name: arabic-kinetic-captions
description: Builds word-synced Arabic karaoke / kinetic captions from a word-level transcript JSON ([{text,start,end}] in seconds) as a HyperFrames caption layer (or Remotion component). Animates by WORD, never by letter, right-to-left. Use for "كابشن", "ترجمة", "karaoke captions", "subtitles", transcript.json, or any caption/subtitle request on Arabic audio.
argument-hint: "[transcript.json] [style: clean|karaoke|punch] [ratio]"
allowed-tools: Read Write Edit Glob Bash(npx hyperframes *)
---

# Arabic Kinetic Captions

Input: $ARGUMENTS. Transcript format: `[{ "text": "كلمة", "start": 1.02, "end": 1.31 }, …]` (seconds). This is what `npx hyperframes transcribe` writes to `transcript.json`. If only audio exists, run `npx hyperframes transcribe <audio> --model large-v3 --language ar` (the default model is English-only).

## 1. Sanity-check the transcript (report before building)
- Count words, total span, words with `end <= start`, gaps > 1.5 s, words longer than 1.2 s.
- Whisper writes Arabic in its own spelling (often MSA-ish, no tashkeel, digits). If the editor gave a script, correct spelling to match the script but keep the timestamps. When you merge or split words, split the time proportionally to character count and list every such change under "Adjusted words". Never silently invent timing.
- Drop pure fillers (إمم، آآ) from display only if the style is "clean"; keep «يعني» and similar unless the editor asked to drop them.

## 2. Group into caption pages
- 2–5 words per page, max 2 lines, ≤ ~24 Arabic characters per line.
- Break a page at: punctuation (، . ؟ !), a gap > 0.35 s, or the word limit. Never end a page on a preposition/particle (في، على، من، و، ب، لـ) — move it to the next page.
- Page shows from `firstWord.start − 0.10 s` to `lastWord.end + 0.15 s`, minimum 0.8 s on screen; pages never overlap in time.
- Write the grouping to `captions.pages.json` so it can be reviewed and reused.

## 3. Render rules (Arabic)
- Each page is a block with `dir="rtl"`; each word is `<span class="w">` (inline-block). Letters are never wrapped individually.
- Karaoke fill (right→left) without breaking letter joins: stack two copies of the same word (base in `--c-ink`, top in `--c-accent`) and reveal the top copy with `clipPath: "inset(0 0 0 100%)" → "inset(0 0 0 0%)"` over the word's `start→end`, `ease: "none"`.
- Style `punch`: active word scales 1 → 1.08 (`power3.out`, 0.08 s) at `start`, settles at `end`. Style `clean`: only color change.
- Latin words / numbers inside a page go in `<bdi>`. Numerals follow `--numerals`.
- Font `--font-body`, size `--fs-caption`, line-height ≥ 1.5, optional pill background `--c-caption-bg` with padding ≥ 0.3em top/bottom so dots aren't clipped.
- Position inside the caption band from `tokens.css` (9:16: y 1180–1460). Caption layer is its own clip on the highest `data-track-index`.

## 4. Timeline (GSAP)
- One entry per page: `fromTo(page, {y: 24, opacity: 0}, {y: 0, opacity: 1, duration: 0.18, ease: "power3.out"}, pageIn)` and an exit `to(page, {opacity: 0, duration: 0.12, ease: "power2.in"}, pageOut)`.
- Word events are placed at absolute transcript times on the same timeline (position parameter = seconds). Sync tolerance: ±1 frame (33 ms at 30 fps).
- Build everything after `document.fonts.ready`; generate DOM from `captions.pages.json` once at init (deterministic). No `Math.random`, no clocks.

## 5. Verify
Run `/qa-gate`, plus: snapshot 3 random pages mid-word (`npx hyperframes snapshot --at t1,t2,t3 --zoom '#captions'`) and check that the highlighted word is the word being spoken at that time in the transcript. Report the three (time, expected word, highlighted word) triples.

## Remotion variant
If the project is Remotion, convert to `@remotion/captions` `Caption` objects (`startMs = start*1000`, `endMs = end*1000`, `timestampMs = null`, `confidence = null`, and a leading space in `text` for every word after the first), then follow the same page/word rules with `useCurrentFrame()` + `interpolate()`; see `/remotion-scene-builder`.
~~~~

### 4.5 qa-gate
**المسار:** `.claude/skills/qa-gate/SKILL.md`

~~~~markdown
---
name: qa-gate
description: Quality gate for a HyperFrames (or Remotion) motion video before any draft is shown or any render is made — lint, browser check, snapshots at storyboard key times, visual review of every snapshot against an Arabic/RTL/brand/safe-zone checklist, and an evidence report. Use after building or editing scenes, before "render", or when the user asks "راجع", "QA", "check", "جاهز؟".
argument-hint: "[slug]"
allowed-tools: Read Glob Grep Bash(npx hyperframes *) Bash(npx remotion *)
---

# QA Gate

Project: `videos/$ARGUMENTS/`. The gate passes only when every step below is green. Report evidence, not opinions.

## 1. Static checks
```bash
npx hyperframes lint videos/<slug> --json
```
Fix every error. Then grep the composition files for studio bans and fix any hit:
`Math.random(` (unless via `rng(`), `Date.now`, `performance.now`, `new Date(`, `repeat: -1`, `"chars"`, `split("")`, `Array.from(` on text, `<br`, `letter-spacing` on Arabic, raw `#hex` colors outside `brand/`.

## 2. Browser gate
```bash
npx hyperframes check videos/<slug> --snapshots --at-transitions
```
Zero errors required (runtime, layout overflow/clipping, contrast). For 9:16 also flag text inside the bottom UI band (confirm the flag syntax with `npx hyperframes check --help`):
`--caption-zone "x0=0;y0=0.78;x1=1;y1=1"`

## 3. Key-frame snapshots
Take the key times listed in `storyboard.md` (always include 0.0 and the last frame):
```bash
npx hyperframes snapshot videos/<slug> --at 0,0.3,<key times…>
```
Zoom on any text block you're unsure about: `--zoom '#s3-h1'`.

## 4. Look at every PNG (use the Read tool on each file) and score this checklist
| # | Check | Pass rule |
|---|---|---|
| 1 | Arabic shaping | every word visibly joined; no isolated letter forms; لا ligature intact |
| 2 | Dots / tashkeel / descenders | nothing clipped by masks or boxes |
| 3 | RTL | reading order right→left; Latin/numbers isolated correctly; punctuation on the correct side |
| 4 | Safe zones | all text/logos inside `--safe-*` for this ratio |
| 5 | Hierarchy | one hero element per frame; H2 clearly smaller |
| 6 | Brand | only token colors/fonts; one accent per scene |
| 7 | Readability | each text block on screen ≥ `0.5 s + words/3` (check timeline JSON) |
| 8 | Frame 0 | not empty/black; hook visible by 0.5 s |
| 9 | Ending | last frame is a clean hold (logo/CTA), no black or half-exited element |
| 10 | Motion taste | eases match house style; no overshoot unless brief says playful |

Timeline data for #7: `npx hyperframes timeline --json`.

## 5. Second opinion
For anything longer than 10 s or any client delivery, ask the `motion-critic` subagent to review the snapshots + storyboard. Treat its "must-fix" items as blocking and its "nice-to-have" items as optional.

## 6. Report (exact format)
```
QA — <slug> — PASS | FAIL
lint: 0 errors · check: 0 errors (N warnings)
Snapshots: snapshots/frame-00-at-0.0s.png, …
Checklist: 1✅ 2✅ 3❌(scene 3: «…» Latin word flipped) …
Fixed in this pass: …
Still open (needs editor decision): …
```

## Remotion projects
Use `npx tsc --noEmit` (if TypeScript) and render stills at the key frames: `npx remotion still <CompositionId> snapshots/f<N>.png --frame=<N>`, then run steps 4–6 the same way.

Never render the final video from this skill. The gate only reports.
~~~~

### 4.6 aspect-variants
**المسار:** `.claude/skills/aspect-variants/SKILL.md`

~~~~markdown
---
name: aspect-variants
description: Re-lays out an approved video for 9:16, 1:1 and 16:9 (and batch hook variants) and renders each one. Use when the user asks for "نسخ بمقاسات", "9:16 / 1:1 / 16:9", "reformat", "resize for YouTube/Instagram/X", or to render A/B variants from rows.json.
argument-hint: "[slug] [ratios, default 9x16,1x1,16x9]"
allowed-tools: Read Write Edit Glob Bash(npx hyperframes *)
---

# Aspect Variants

Input: $ARGUMENTS. Precondition: the source ratio passed `/qa-gate` AND the editor explicitly approved the draft in this conversation. If not, stop and ask — rendering finals is the expensive step.

## Why separate compositions
A HyperFrames composition has a fixed `data-width`/`data-height`; the renderer does not reshape it. So each ratio is its own root file that shares the scene logic:

```
videos/<slug>/
  scenes.js            # shared: builds the GSAP timeline from a layout object
  index.html           # 9:16  1080×1920  (data-composition-id="main")
  index-1x1.html       # 1:1   1080×1080  (data-composition-id="main-1x1")
  index-16x9.html      # 16:9  1920×1080  (data-composition-id="main-16x9")
```
Each root registers its own timeline key equal to its own `data-composition-id`. Timings are identical across ratios; only layout changes.

## Re-layout rules (don't just scale)
- **9:16 → 1:1:** type ×0.85; stack becomes tighter; captions band moves to y 820–980; margins `--safe-1x1`.
- **9:16 → 16:9:** two-column layouts where a scene has text + visual (text column on the RIGHT for RTL, visual on the left); hero type ×1.1 of the 1080 scale; captions band y 820–980; margins `--safe-16x9`.
- Keep the same words, the same timing, the same hero per scene. If a line wraps badly in a ratio, adjust line breaks (separate `.line` blocks), not the text.
- Re-check that no text leaves its safe zone.

## Render
Run `/qa-gate` logic (lint + check + snapshots at the same key times) for each root, then:
```bash
npx hyperframes render videos/<slug> --composition index.html      --quality delivery --output renders/<slug>-9x16.mp4
npx hyperframes render videos/<slug> --composition index-1x1.html  --quality delivery --output renders/<slug>-1x1.mp4
npx hyperframes render videos/<slug> --composition index-16x9.html --quality delivery --output renders/<slug>-16x9.mp4
```
(Check `npx hyperframes render --help` for whether the project dir is positional in your version.)

## Batch A/B hooks
If `hooks.rows.json` exists (from `/viral-hook-writer`), render one file per row:
```bash
npx hyperframes render videos/<slug> --batch hooks.rows.json --quality delivery
```
Use `--strict-variables` so a typo in a variable id fails instead of silently rendering the default.

## Deliver
List every output path with its ratio, duration and file size, plus one snapshot per ratio of the hero frame, side by side in the report.
~~~~

### 4.7 first-pass-edit (+ سكربت edl.py)
**المسار:** `.claude/skills/first-pass-edit/SKILL.md` و`.claude/skills/first-pass-edit/scripts/edl.py`.
السكربت **مختبَر** على فيديو تجريبي 12 ثانية: اكتشف السكتات (auto)، «إمم» (auto)، «يعني» معزولة (review)، وإعادة «اليوم رح نحكي عن» (review، بيحتفظ بالمحاولة التانية)؛ طبّق القص بـ ffmpeg (30fps ثابت)، وأعاد توقيت الترانسكريبت على الفيديو المقصوص. ما في ولا قصّة بلا `evidence` (أرقام الكلمات والتوقيت).

~~~~markdown
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
~~~~

~~~~python
#!/usr/bin/env python3
"""
First-pass edit helper. Deterministic, evidence-based, no guessing.

  edl.py propose transcript.json --source raw/take.mp4 [--duration 123.4] > edl.json
  edl.py apply   edl.json out.mp4 [--dry-run]      # renders keep-segments with ffmpeg
  edl.py retime  edl.json transcript.json > transcript.cut.json   # shift word times to the cut video

transcript.json = [{"text": str, "start": sec, "end": sec}, ...]  (npx hyperframes transcribe / WhisperX word level)
Cuts with status "auto" or "approved" are applied; "review" and "rejected" are not.
"""
import argparse, json, re, subprocess, sys

TASHKEEL = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]")
PUNCT = re.compile(r"[^\w\s]", re.UNICODE)
HARD_FILLERS = {"امم", "اممم", "ام", "مم", "ممم", "اا", "ااا", "اه", "اهه", "um", "uh", "uhm", "erm"}
SOFT_FILLERS = {"يعني", "هيك", "اسمو", "اسمه"}
MIN_KEEP = 0.15  # never keep a fragment shorter than this between two cuts
RESTART_CUES = [("لا", "لا"), ("خليني", "اعيد"), ("من", "الاول"), ("عفوا",), ("بعيد",), ("sorry",)]


def norm(w):
    w = TASHKEEL.sub("", w)
    w = PUNCT.sub("", w)
    w = re.sub("[أإآ]", "ا", w).replace("ة", "ه").replace("ى", "ي")
    return w.strip().lower()


def probe_duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", path], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def propose(args):
    words = json.load(open(args.transcript, encoding="utf-8"))
    words = [w for w in words if w.get("end", 0) > w.get("start", 0)]
    dur = args.duration if args.duration else probe_duration(args.source)
    P, cuts = args.pad, []

    def add(start, end, typ, idx, evidence, status):
        start, end = max(0.0, round(start, 3)), min(dur, round(end, 3))
        if end - start >= 0.05:
            cuts.append({"start": start, "end": end, "type": typ, "words": idx,
                         "evidence": evidence, "status": status})

    # 1) silences: head, gaps between words, tail
    if words and words[0]["start"] > P + 0.05:
        add(0, words[0]["start"] - P, "silence", [], f"lead-in silence {words[0]['start']:.2f}s", "auto")
    for i in range(len(words) - 1):
        gap = words[i + 1]["start"] - words[i]["end"]
        if gap >= args.min_silence:
            add(words[i]["end"] + P, words[i + 1]["start"] - P, "silence", [i, i + 1],
                f"gap {gap:.2f}s between «{words[i]['text']}»(#{i}) and «{words[i+1]['text']}»(#{i+1})", "auto")
    if words and dur - words[-1]["end"] > P + 0.05:
        add(words[-1]["end"] + P, dur, "silence", [], f"tail silence {dur - words[-1]['end']:.2f}s", "auto")

    # 2) fillers
    toks = [norm(w["text"]) for w in words]
    for i, t in enumerate(toks):
        if t in HARD_FILLERS:
            add(words[i]["start"] - 0.02, words[i]["end"] + 0.02, "filler", [i, i],
                f"hard filler «{words[i]['text']}»", "auto")
        elif t in SOFT_FILLERS:
            before = words[i]["start"] - words[i - 1]["end"] if i > 0 else 1
            after = words[i + 1]["start"] - words[i]["end"] if i + 1 < len(words) else 1
            if before >= 0.25 and after >= 0.25:
                add(words[i]["start"] - 0.02, words[i]["end"] + 0.02, "filler", [i, i],
                    f"soft filler «{words[i]['text']}» isolated by pauses {before:.2f}s/{after:.2f}s", "review")

    # 3) retakes: a phrase of >= n words repeated within the window -> earlier attempt is a candidate
    i = 0
    while i < len(toks):
        found = None
        for n in (5, 4, 3):
            if i + n > len(toks):
                continue
            phrase = toks[i:i + n]
            if any(not t for t in phrase):
                continue
            j = i + n
            while j + n <= len(toks) and words[j]["start"] - words[i]["start"] <= args.retake_window:
                if toks[j:j + n] == phrase:
                    found = (n, j)
                    break
                j += 1
            if found:
                break
        if found:
            n, j = found
            add(words[i]["start"] - P, words[j]["start"] - P, "retake", [i, j - 1],
                f"phrase «{' '.join(w['text'] for w in words[i:i+n])}» restarts at {words[j]['start']:.2f}s (#{j}); keeping the later take",
                "review")
            i = j
        else:
            i += 1

    # 4) explicit restart cues (self-corrections) -> cut back to the previous pause
    for i in range(len(toks)):
        for cue in RESTART_CUES:
            if tuple(toks[i:i + len(cue)]) == cue:
                k = i
                while k > 0 and words[k]["start"] - words[k - 1]["end"] < 0.4:
                    k -= 1
                add(words[k]["start"] - P, words[i + len(cue) - 1]["end"] + P, "mistake", [k, i + len(cue) - 1],
                    f"restart cue «{' '.join(w['text'] for w in words[i:i+len(cue)])}» at {words[i]['start']:.2f}s", "review")

    cuts.sort(key=lambda c: (c["start"], c["end"]))
    for n, c in enumerate(cuts, 1):
        c["id"] = f"c{n:03d}"
    edl = {"source": args.source, "transcript": args.transcript, "duration": round(dur, 3), "fps": args.fps,
           "params": {"min_silence": args.min_silence, "pad": P, "retake_window": args.retake_window},
           "cuts": cuts}
    edl["keep"] = keep_segments(edl)
    edl["summary"] = summarize(edl)
    json.dump(edl, sys.stdout, ensure_ascii=False, indent=2)
    print()


def applied(edl):
    spans = sorted((c["start"], c["end"]) for c in edl["cuts"] if c["status"] in ("auto", "approved"))
    merged = []
    for s, e in spans:
        if merged and s - merged[-1][1] < MIN_KEEP:   # also swallow slivers shorter than MIN_KEEP
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    return merged


def keep_segments(edl):
    keep, t = [], 0.0
    for s, e in applied(edl):
        if s - t >= 0.05:
            keep.append({"start": round(t, 3), "end": round(s, 3)})
        t = max(t, e)
    if edl["duration"] - t >= 0.05:
        keep.append({"start": round(t, 3), "end": edl["duration"]})
    return keep


def summarize(edl):
    kept = sum(k["end"] - k["start"] for k in edl["keep"])
    by = {}
    for c in edl["cuts"]:
        by.setdefault(f'{c["type"]}:{c["status"]}', 0)
        by[f'{c["type"]}:{c["status"]}'] += 1
    return {"original_s": edl["duration"], "after_applied_cuts_s": round(kept, 3), "counts": by}


def apply(args):
    edl = json.load(open(args.edl, encoding="utf-8"))
    keep = keep_segments(edl)
    parts, labels = [], ""
    for k, seg in enumerate(keep):
        parts.append(f"[0:v]trim=start={seg['start']}:end={seg['end']},setpts=PTS-STARTPTS[v{k}]")
        parts.append(f"[0:a]atrim=start={seg['start']}:end={seg['end']},asetpts=PTS-STARTPTS[a{k}]")
        labels += f"[v{k}][a{k}]"
    fc = ";".join(parts) + f";{labels}concat=n={len(keep)}:v=1:a=1[v][a]"
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-stats", "-i", edl["source"], "-filter_complex", fc,
           "-map", "[v]", "-map", "[a]", "-r", str(edl.get("fps", 30)), "-fps_mode", "cfr",
           "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "192k", args.out]
    print(" ".join(c if c != fc else "'" + fc + "'" for c in cmd), file=sys.stderr)
    if not args.dry_run:
        subprocess.run(cmd, check=True)


def retime(args):
    edl = json.load(open(args.edl, encoding="utf-8"))
    words = json.load(open(args.transcript, encoding="utf-8"))
    keep, out, offset_map = keep_segments(edl), [], []
    acc = 0.0
    for seg in keep:
        offset_map.append((seg["start"], seg["end"], acc - seg["start"]))
        acc += seg["end"] - seg["start"]
    for w in words:
        mid = (w["start"] + w["end"]) / 2
        for s, e, off in offset_map:
            if s <= mid < e:
                out.append({**w, "start": round(max(s, w["start"]) + off, 3), "end": round(min(e, w["end"]) + off, 3)})
                break
    json.dump(out, sys.stdout, ensure_ascii=False, indent=1)
    print()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("propose"); p.add_argument("transcript"); p.add_argument("--source", required=True)
    p.add_argument("--duration", type=float); p.add_argument("--fps", type=int, default=30)
    p.add_argument("--min-silence", type=float, default=0.45); p.add_argument("--pad", type=float, default=0.08)
    p.add_argument("--retake-window", type=float, default=15.0); p.set_defaults(fn=propose)
    a = sub.add_parser("apply"); a.add_argument("edl"); a.add_argument("out"); a.add_argument("--dry-run", action="store_true")
    a.set_defaults(fn=apply)
    r = sub.add_parser("retime"); r.add_argument("edl"); r.add_argument("transcript"); r.set_defaults(fn=retime)
    args = ap.parse_args(); args.fn(args)
~~~~

### 4.8 remotion-scene-builder
**المسار:** `.claude/skills/remotion-scene-builder/SKILL.md`
(متحقق من توثيق Remotion و skills الرسمية: الأنيميشن من `useCurrentFrame()` + `interpolate()`/`spring()`؛ CSS `transition`/`animation` وTailwind `animate-*` «ما بترندر صح»؛ `random(seed)` بدل `Math.random()`؛ `staticFile()` لـ `public/`؛ خطوط محلية بـ `loadFont` من `@remotion/fonts`.)

~~~~markdown
---
name: remotion-scene-builder
description: Builds Arabic RTL motion-graphics scenes and footage edits in Remotion (React 19) with frame-driven animation (useCurrentFrame, interpolate, spring, Sequence/Series/TransitionSeries, staticFile, local fonts). Use when the project is a Remotion project (remotion.config.ts / src/Root.tsx), when the user says "Remotion", or for footage-heavy edits (cut talking-head + zooms + overlays + charts) that need React components.
argument-hint: "[slug] [scene numbers | 'all' | 'style-frame']"
allowed-tools: Read Write Edit Glob Grep Bash(npx remotion *) Bash(npx tsc *)
---

# Remotion Scene Builder

Input: $ARGUMENTS. Preconditions: an approved `storyboard.md` (from `/storyboard-director`) and, for footage, `edit/cut.mp4` + `edit/transcript.cut.json` (from `/first-pass-edit`). If the official Remotion skills are installed (`/remotion-best-practices`, `/remotion-markup`, `/remotion-captions`), load them for API details; this skill adds studio + Arabic rules.

## Which engine?
- HyperFrames: pure motion graphics (kinetic type, stats, logo stings, hooks), fastest agent loop with `check`/`snapshot`.
- Remotion: talking-head edits with cuts/zooms/layout switches, React component reuse, data-driven charts, interactive Studio editing. Don't mix both inside one video; render one as a clip and import it into the other if needed.

## Determinism rules (Remotion renders frames in parallel tabs, out of order)
- Every animated value is a pure function of `useCurrentFrame()` (+ `useVideoConfig()`): `interpolate(frame, [a, b], [x, y], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing })` or `spring({ frame, fps, config: { damping: 200 } })` (high damping = no bounce, our house style).
- CSS `transition`/`animation`, Tailwind `animate-*`, GSAP/anime running on their own clock, `setTimeout`, `Date.now()` → forbidden; they don't render correctly.
- Randomness only via `random("seed-string")` from `remotion`, never `Math.random()`.
- Media via `<Img>`, `<OffthreadVideo>`/`<Video>`, `<Audio>` with `staticFile("…")` for files in `public/`, so the renderer waits for them. Data fetches use `delayRender()`/`continueRender()`.
- Fonts: local `.woff2` in `public/fonts/`, loaded with `loadFont({ family, url: staticFile(...), weight })` from `@remotion/fonts` before render; measure text only after fonts load.

## Studio conventions
- Time in frames at 30 fps: `const s = (sec: number) => Math.round(sec * fps)`. Storyboard seconds → frames with this helper only.
- Scenes: `<Series>` / `<Series.Sequence durationInFrames={s(2.4)}>` or `<Sequence from={…} durationInFrames={…}>`; scene transitions with `<TransitionSeries>` from `@remotion/transitions` (e.g. `slide({ direction: "from-right" })` for RTL, verify the option name in the installed version).
- Footage trims: `<Sequence>`/media props `trimBefore` / `trimAfter` (frames) — or feed `edit/cut.mp4` from `/first-pass-edit`.
- Zoom on emphasis: scale 1 → 1.12 with `spring` over ~10 frames at the punch word's `start` from `transcript.cut.json`, return over ~15 frames; never more than one zoom per 3 s.
- Layout switch (full → split → graphic): each layout is a component; switch with a 6–10 frame `interpolate` crossfade/slide at a sentence boundary from the transcript.
- Brand: port `brand/tokens.css` values into `src/brand.ts` (`export const C = {...}, FS = {...}, SAFE = {...}`) and import everywhere; no raw hex in scenes.
- Multiple ratios: register one `<Composition>` per ratio (`Main-9x16`, `Main-1x1`, `Main-16x9`) with the same component and branch layout on `useVideoConfig().width/height`.

## Arabic in React
- Root `<AbsoluteFill style={{ direction: "rtl" }}>`, `lang="ar"` on text containers.
- Split to words: `text.split(/\s+/).map((w, i) => <span key={i} style={{ display: "inline-block" }}>{w}</span>)` with `{" "}` between spans. Never map over characters.
- Word stagger: word `i` starts at `s(start) + i * s(0.12)`; entrance `translate` from `+40px` (from the right) to `0`.
- RTL wipe: `clipPath: \`inset(0 0 0 ${interpolate(frame, [a, b], [100, 0], clamp)}%)\``.
- Captions: `@remotion/captions` `Caption[]` (`startMs`, `endMs`), whitespace-sensitive: each word after the first gets a leading space in `text`. Follow `/arabic-kinetic-captions` rules for grouping and highlight.

## Build → check loop
1. Style frame first (the hook or the hero scene), then the rest.
2. Stills at storyboard key frames: `npx remotion still <CompositionId> snapshots/f<N>.png --frame=<N>`; open and review them with the `/qa-gate` checklist.
3. Preview for the editor: `npx remotion studio`. Render only when asked: `npx remotion render <CompositionId> renders/<slug>-9x16.mp4`.
~~~~

### 4.9 publish-pack
**المسار:** `.claude/skills/publish-pack/SKILL.md`

~~~~markdown
---
name: publish-pack
description: Prepares the publishing package for a finished video — Arabic titles, captions/descriptions, hashtags per platform, and 2 thumbnail concepts (A/B) rendered as stills — then publishes or schedules through the Blotato MCP ONLY after the editor explicitly approves the exact package. Use when the user types /publish-pack. Never triggered automatically.
argument-hint: "[slug] [platforms: tiktok,instagram,youtube,x,…] [when: now|next-slot|ISO time]"
disable-model-invocation: true
allowed-tools: Read Write Glob Bash(npx hyperframes snapshot *) Bash(npx hyperframes render *)
---

# Publish Pack

Input: $ARGUMENTS. Precondition: `renders/<slug>-*.mp4` exist and passed `/qa-gate`.

## 1. Understand the video
Read `brief.md`, `storyboard.md`, the hook used, and `transcript.cut.json` if present. Write the promise of the video in one Arabic sentence. Everything below must be honest to that promise.

## 2. Copy per platform (write to `videos/<slug>/publish/pack.md`)
For each requested platform:
- **Title / first line:** 3 options, ≤ 60 characters, hook first; Levantine by default unless brief says MSA. For YouTube the title field has a hard 100-character limit.
- **Caption / description:** 1–3 short lines + a clear CTA (سؤال للتعليقات، احفظ، تابع). No fake urgency, no invented numbers.
- **Hashtags:** 3–8, mixing Arabic and English, specific over generic; no banned/misleading tags.
- **On-screen cover text** (≤ 4 words) that matches the hook.

## 3. Two thumbnail concepts (A/B)
- A: face/subject or key visual + 2–4 word Arabic headline. B: bold typographic/number-led design. Same promise, different mechanism.
- Build each as a small still composition in `videos/<slug>/publish/thumb-a.html` / `thumb-b.html` (1080×1920 cover; add 1280×720 for YouTube) using brand tokens and Arabic rules, then export stills with `npx hyperframes snapshot` at t=0 (or `npx remotion still` in Remotion projects).
- Check: headline readable at 20% size, inside safe zones, contrast passes.

## 4. Approval checkpoint (mandatory)
Write `videos/<slug>/publish/plan.json`:
```json
{ "slug": "…", "video": "renders/…-9x16.mp4",
  "posts": [ { "platform": "tiktok", "account": "?", "text": "…", "hashtags": ["…"],
               "thumbnail": "publish/thumb-a.png", "when": "next-slot" } ],
  "ab_test": { "variants": ["publish/thumb-a.png", "publish/thumb-b.png"], "how": "as the platform/Blotato supports it" } }
```
Show the editor the exact text, thumbnails (paths) and schedule, then ask: «موافق أنشر هيك بالظبط؟ اكتب: انشر». Only the editor's explicit «انشر» / "publish" in their own message counts as approval. Silence, "looks good", or approval of an earlier version does not.

## 5. Publish (only after approval)
- Use the Blotato MCP tools (list them via `/mcp`; typical flow: list accounts → upload media → create/schedule post). Publish exactly what was approved; if anything must change (length limits, account missing), stop and ask again.
- Log the result (post ids/links, time) to `videos/<slug>/publish/log.md`.
- A project hook asks for confirmation before every Blotato tool call; never try to work around it.
~~~~

### 4.10 raw-to-published (الأمر الكامل من الفوتج الخام للنشر)
**المسار:** `.claude/skills/raw-to-published/SKILL.md` — بيتشغّل بس لما تكتب `/raw-to-published`.

~~~~markdown
---
name: raw-to-published
description: Orchestrates the full run from raw footage (local or Google Drive) to a published post — ingest, transcript, first-pass cut, storyboard, motion graphics/captions, QA, render + ratios, publish pack — stopping at every human checkpoint. Only runs when the user types /raw-to-published.
argument-hint: "[drive-folder-or-local-path] [slug] [engine: hyperframes|remotion]"
disable-model-invocation: true
---

# Raw → Published (with human checkpoints)

Input: $ARGUMENTS. Keep a checklist in `videos/<slug>/RUN.md` (one line per stage: ⏳/✅/⛔ + evidence path) and update it after every stage, so the run can resume after `/clear` or a new session ("كمّل من RUN.md").

At every **🛑 CHECKPOINT**: show the evidence, ask one clear question in Arabic, and END YOUR TURN. Do not continue until the editor answers in their own message.

## Stage 0 — Ingest
- Local path → copy into `videos/<slug>/raw/`. Google Drive → use the Google Drive connector if it's connected, otherwise `rclone copy "<remote>:<folder>" videos/<slug>/raw --progress` (only if the editor set up rclone). Never delete or move the originals.
- `ffprobe` each file: duration, resolution, fps, audio channels. Write them to `RUN.md`.

## Stage 1 — Transcript + first-pass cut → `/first-pass-edit`
🛑 CHECKPOINT 1: the review table of uncertain cuts. Wait for approve/reject ids. Then apply, and report new duration + join times.

## Stage 2 — Story → `/storyboard-director` (+ `/viral-hook-writer` for the opening)
Base the storyboard on `transcript.cut.json`: which moments get a zoom, a layout switch, a highlight, a data chart, a lower-third, B-roll/graphic, and the hook + end card.
🛑 CHECKPOINT 2: storyboard approval (text, timing, which graphics where).

## Stage 3 — Style frame
Engine = HyperFrames → `/brand-scene-builder <slug> style-frame`; Remotion → `/remotion-scene-builder <slug> style-frame`. If an interactive editing MCP/skill the editor already uses (e.g. their "edit broomi video" skill) is installed, it may be used for zooms and layout switching, following this studio's rules.
🛑 CHECKPOINT 3: one or two stills of the hero moment. Wait for "ok" or notes.

## Stage 4 — Full build + captions
Remaining scenes, zooms, layout switches, charts, then `/arabic-kinetic-captions` from `transcript.cut.json`.
Run `/qa-gate <slug>`; for anything longer than 10 s also get the `motion-critic` subagent's review. Fix must-fix items. Render a draft: `--quality draft`.
🛑 CHECKPOINT 4: draft MP4 path + QA report + critic summary. Wait for notes; loop fixes (max 2 rounds per note, then ask whether to simplify).

## Stage 5 — Final + ratios → `/aspect-variants <slug>`
Render delivery quality for the requested ratios (and A/B hook rows if any).
🛑 CHECKPOINT 5: final file list with durations/sizes + one hero still per ratio.

## Stage 6 — Publish → `/publish-pack <slug> …`
The editor must type `/publish-pack` themselves (it can't be auto-invoked). Publishing happens only after their explicit «انشر».

## Stage 7 — Wrap-up
Summarize what took the most iterations and propose ≤ 3 one-line rules for `CLAUDE.md` (don't edit it without approval). Commit the project with git.
~~~~

---

## 5. الـ Subagents (3 ملفات)
الصيغة متحققة: `.claude/agents/<name>.md`، الحقول المطلوبة `name` و`description`؛ الاختيارية منها `tools`، `disallowedTools`، `model` (`inherit` = نفس موديل الجلسة)، `effort`، `color`. بتستدعيهم بالكلام («استعمل motion-critic…») أو مضمون بـ `@agent-motion-critic`. ميزتهم: بيشتغلوا بـ context نضيف، فالناقد ما بيكون «منحاز» للكود اللي كتبو.

### 5.1 motion-critic
**المسار:** `.claude/agents/motion-critic.md`

~~~~markdown
---
name: motion-critic
description: Independent, read-only reviewer of a motion-graphics draft. Judges snapshots/frames and the composition against storyboard.md, brand tokens, Arabic RTL rules and social-video craft, and returns a prioritized must-fix / nice-to-have list with timecodes. Use after /qa-gate on any video longer than 10 s, before showing a client, or when the user asks "انقد", "critique", "شو رأيك بالحركة".
tools: Read, Glob, Grep, Bash
disallowedTools: Write, Edit
model: inherit
effort: high
color: purple
---

You are a senior motion designer and creative director who has shipped hundreds of Arabic social videos. You did not make this draft; review it with fresh eyes. You never edit files.

## Inputs to gather yourself
- `videos/<slug>/storyboard.md` (the contract), `brand/tokens.css`, `brand/motion.js`, `CLAUDE.md` rules.
- Snapshots in `videos/<slug>/snapshots/` — open every PNG with Read. If key storyboard times are missing, capture them: `npx hyperframes snapshot videos/<slug> --at <times>` (Remotion: `npx remotion still <Id> snapshots/f<N>.png --frame=<N>`). You may run read-only commands only (`snapshot`, `still`, `timeline --json`, `lint`, `check`).
- `npx hyperframes timeline --json` for real timings.

## Review lenses (in this order)
1. **Hook (0–3 s):** is there something on frame 0? Is the promise readable by 0.5 s? Would it stop a thumb?
2. **Arabic craft:** joined letters, no clipped dots/descenders, RTL order and motion direction, Latin/number isolation, no letter-spacing, line breaks that don't strand a particle (و، في، على).
3. **Hierarchy & layout:** one hero per frame, safe zones, balance, breathing room, text never fighting a busy background.
4. **Timing & rhythm:** reading time (`0.5 s + words/3`), scene length variety, a calm beat after dense stretches, transitions on motion, clean end hold.
5. **Easing & motion taste:** house eases (power3.out in / power2.in out), no mushy linear moves, no gratuitous overshoot, stagger direction RTL, consistent motion language across scenes.
6. **Brand:** tokens only, one accent per scene, logo integrity.
7. **Storyboard fidelity:** any drift in text, order or timing vs the approved storyboard.

## Output (exact format, Arabic headings OK, max ~25 lines)
```
VERDICT: SHIP | FIX FIRST | REWORK
MUST-FIX (blocking)
1. [t=3.40s / f102] #s2-h1 — problem — concrete fix (property, value, ease, duration)
NICE-TO-HAVE
1. …
KEEP (what works — protect it in the next pass)
- …
```
Only list a must-fix if it breaks a CLAUDE.md rule, the storyboard, readability, or Arabic correctness. Taste notes go to nice-to-have. Don't invent problems to fill the list; an empty must-fix list is a valid result.
~~~~

### 5.2 script-writer
**المسار:** `.claude/agents/script-writer.md`

~~~~markdown
---
name: script-writer
description: Writes and tightens Arabic scripts for short social videos (Levantine by default, MSA on request) — voice-over lines, on-screen text, hook and CTA — sized to a target duration. Use when the user needs a script from an idea, article, notes or transcript, or asks "اكتب سكربت", "قصّر النص", "حوّله لهجة شامية".
tools: Read, Write, Glob, WebFetch
model: inherit
color: green
---

You are an Arabic short-form scriptwriter for social video (TikTok / Reels / Shorts). You write the way people in Damascus, Beirut and Amman actually talk, and you can switch to clean MSA for formal clients.

## Rules
- Duration budget: Levantine VO ≈ 2.3–2.7 words per second. A 30 s video ≈ 70–80 words of VO. State the word count and estimated duration.
- Structure: Hook (≤ 3 s) → context (1 line) → 2–4 value beats (one idea each) → payoff → CTA. The hook's promise must be paid off in the video.
- Two layers per beat: **VO** (what is said) and **ON-SCREEN** (≤ 7 words, the headline of that beat, not a copy of the VO).
- Dialect: consistent spelling (هيك، شو، ليش، بدّك، منيح، هلّق، كتير). Avoid Egyptian/Gulf markers unless asked. English tech terms are fine when that's how people say them (AI، app، feed).
- Facts: only use numbers and claims from the source the user gave. Unknown → write `[تحقق: …]`. Never invent quotes or attribute words to real people.
- No Quranic verses, hadith or sacred text as content for kinetic typography; neutral proverbs/quotes only with the attribution the user supplies.
- Tone: confident, warm, zero filler (بالتأكيد، في الحقيقة، دعونا).

## Output
Write `videos/<slug>/script.md`:
```
# <title> — script v1 (Levantine) — ~28s / 72 words
| # | Beat | VO | ON-SCREEN | Visual idea | ~sec |
|---|---|---|---|---|---|
| 1 | Hook | … | «…» | … | 2.5 |
```
Then 2 alternative hooks (different mechanisms) and a one-line note on what to cut first if the video must be shorter. Return a 5-line summary to the caller.
~~~~

### 5.3 arabic-type-reviewer
**المسار:** `.claude/agents/arabic-type-reviewer.md`

~~~~markdown
---
name: arabic-type-reviewer
description: Read-only specialist that audits Arabic typography and RTL correctness in HyperFrames/Remotion code and frames — letter splitting, shaping, bidi isolation, numerals, diacritic clipping, line breaks, spelling consistency. Use proactively after any change to text, captions or fonts, or when Arabic "looks broken / مقطّع / مفكّك".
tools: Read, Glob, Grep, Bash
disallowedTools: Write, Edit
model: inherit
color: orange
---

You audit Arabic text rendering. You never edit files; you return findings with exact locations and fixes.

## Code audit (Grep the composition files)
- Letter splitting: SplitText `type` containing `chars`; `split("")`, `Array.from(` or `[...str]` applied to text; loops creating one span per character; Remotion `.split("").map`. Each hit is a MUST-FIX: Arabic letters join, per-letter elements break the joining forms.
- `letter-spacing` ≠ 0 or `font-style: italic` on Arabic; `text-justify: kashida`.
- Missing `dir="rtl"`/`lang="ar"` on the root or text containers; LTR-only transforms (entrances from the left) where the storyboard says forward motion.
- Latin words, @handles, URLs, numbers inside Arabic sentences without `<bdi>` / `dir="ltr"` isolation.
- Numerals: mixed ١٢٣ and 123 in one video; count-ups without `tabular-nums`.
- `<br>` inside text; masks with `overflow: hidden` and no vertical padding; line-height < 1.5 on body/captions.
- Fonts: `@font-face` points to a local file that exists (Glob it); the chosen weight exists; no remote font URLs.

## Frame audit (Read the PNGs in snapshots/)
- Disconnected letters, tofu boxes (missing glyphs), clipped dots (ب ت ث ي ن), cut descenders (ع ج ح ي), wrong punctuation side, stranded particles at line end (و، في، على، من), inconsistent dialect spelling across scenes.

## Output
```
ARABIC AUDIT: PASS | FAIL
MUST-FIX
- path:line — issue — fix
FRAMES
- snapshots/frame-02-at-4.8s.png — issue — likely cause
SPELLING CONSISTENCY
- «…» vs «…» → pick «…»
```
~~~~

---

## 6. الـ Hooks والإعدادات
**ليش hooks؟** توثيق Claude Code بيقول إنو CLAUDE.md «نصيحة» والـ hooks «مضمونة». فالقواعد اللي كسرها بيخرب الفيديو (تقطيع الحروف، العشوائية، النشر بلا موافقة) حطيناها hooks.
- `PostToolUse` على `Write|Edit` ← `hf-guard.sh`: إذا لقى مشكلة بيطلع بـ exit 2 وبيبعت الرسالة لـ Claude ليصلّح (مختبَر على ملفات فيها أغلاط: مسك chars، `split("")`، `Math.random`، `repeat:-1`، `<br>`، `letter-spacing`، CSS transition بـ tsx؛ والملف السليم عدّى بـ exit 0). الـ lint بيشتغل بس إذا `hyperframes` منزّل محلياً، وما بينزّل شي من النت.
- `PreToolUse` على `mcp__blotato__.*` ← `publish-gate.sh`: بيرجّع `permissionDecision: "ask"` فبيطلب موافقتك قبل أي أداة نشر، حتى لو الجلسة بوضع auto. ومعو قاعدة `ask` بالـ permissions كطبقة تانية.

**`.claude/settings.json`**

~~~~json
{
  "permissions": {
    "allow": [
      "Bash(npx hyperframes lint *)",
      "Bash(npx hyperframes check *)",
      "Bash(npx hyperframes snapshot *)",
      "Bash(npx hyperframes timeline *)",
      "Bash(npx hyperframes catalog *)",
      "Bash(npx remotion still *)",
      "Bash(ffprobe *)"
    ],
    "ask": [
      "mcp__blotato"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/hf-guard.sh",
            "timeout": 120,
            "statusMessage": "Arabic/HyperFrames guard"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "mcp__blotato__.*",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/publish-gate.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
~~~~

**`.claude/hooks/hf-guard.sh`**

~~~~bash
#!/usr/bin/env bash
# PostToolUse guard for Write|Edit — catches the mistakes that break Arabic motion renders.
# Exit 2 + stderr => Claude sees the message and fixes it. Exit 0 => silent.
# حارس تلقائي: بعد كل تعديل على ملف مشهد، بيفحص تقطيع الحروف العربية، العشوائية، الساعة، والـ lint.
set -u
input="$(cat)"
if command -v jq >/dev/null 2>&1; then
  file="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"
else
  file="$(printf '%s' "$input" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))')"
fi
[ -z "$file" ] || [ ! -f "$file" ] && exit 0
case "$file" in
  *.html|*.js|*.mjs|*.ts|*.tsx|*.jsx|*.css) ;;
  *) exit 0 ;;
esac
case "$file" in
  */node_modules/*|*/.claude/*|*/brand/motion.js) exit 0 ;;
esac

problems=""
add() { problems="${problems}- $1"$'\n'; }
hit() { grep -nE "$1" "$file" 2>/dev/null | head -3 | sed 's/^/    line /'; }

# 1) Arabic letter splitting
p='type:[[:space:]]*["'"'"'][^"'"'"']*chars|\.split\([[:space:]]*(""|'"''"')[[:space:]]*\)|\[\.\.\.(text|str|word|label|title)[A-Za-z]*\]|Array\.from\([[:space:]]*(text|str|word|label|title)'
if grep -qE "$p" "$file"; then add "Letter-level splitting found. Arabic must animate by WORD or LINE (SplitText type \"words\"/\"lines\", or wordsToSpans()). Per-letter spans break Arabic joining."$'\n'"$(hit "$p")"; fi

# 2) Determinism
p='Math\.random\(|Date\.now\(|performance\.now\(|new Date\('
if grep -qE "$p" "$file"; then add "Non-deterministic call (clock or unseeded random). Use rng(seed) from brand/motion.js (Remotion: random(\"seed\")) and timeline time only."$'\n'"$(hit "$p")"; fi
p='repeat:[[:space:]]*-1'
if grep -qE "$p" "$file"; then add "repeat: -1 is not allowed. Compute a finite repeat from the scene duration."$'\n'"$(hit "$p")"; fi

# 3) Markup / type rules
p='<br[[:space:]]*/?>'
if grep -qiE "$p" "$file"; then add "<br> in text. Put each line in its own block element (.line)."$'\n'"$(hit "$p")"; fi
p='letter-spacing:[[:space:]]*-?(0*\.0*[1-9]|[1-9])'
if grep -qE "$p" "$file"; then add "Non-zero letter-spacing. Never track Arabic text (breaks joins). Remove it or scope it to Latin-only elements."$'\n'"$(hit "$p")"; fi
p='fonts\.googleapis\.com|fonts\.gstatic\.com'
if grep -qE "$p" "$file"; then add "Remote font URL. Fonts must be local .woff2 via @font-face (HyperFrames) or loadFont + staticFile (Remotion)."$'\n'"$(hit "$p")"; fi

# 4) Remotion: CSS animations/transitions don't render frame-accurately
case "$file" in
  *.tsx|*.jsx)
    p='(^|[^A-Za-z])(transition|animation):|className=["'"'"'][^"'"'"']*animate-'
    if grep -qE "$p" "$file"; then add "CSS transition/animation or Tailwind animate-* in a React/Remotion file. Drive everything from useCurrentFrame() + interpolate()/spring()."$'\n'"$(hit "$p")"; fi ;;
esac

# 5) HyperFrames lint for compositions (only if the CLI is already installed locally; never downloads)
if [ "${file##*.}" = "html" ]; then
  d="$(dirname "$file")"
  while [ "$d" != "/" ] && [ ! -f "$d/hyperframes.json" ]; do d="$(dirname "$d")"; done
  if [ -f "$d/hyperframes.json" ]; then
    # find an installed CLI (project node_modules up the tree, or global); skip silently if none
    bin=""; b="$d"
    while [ "$b" != "/" ]; do [ -x "$b/node_modules/.bin/hyperframes" ] && { bin="$b/node_modules/.bin/hyperframes"; break; }; b="$(dirname "$b")"; done
    [ -z "$bin" ] && command -v hyperframes >/dev/null 2>&1 && bin="$(command -v hyperframes)"
    if [ -n "$bin" ]; then
      TO=""; command -v timeout >/dev/null 2>&1 && TO="timeout 90"   # macOS has no `timeout` by default
      out="$(cd "$d" && $TO "$bin" lint 2>&1)"; rc=$?
      if [ $rc -ne 0 ]; then
        add "hyperframes lint failed in $d:"$'\n'"$(printf '%s' "$out" | tail -15)"
      fi
    fi
  fi
fi

if [ -n "$problems" ]; then
  printf 'Studio guard found problems in %s — fix before continuing:\n%s' "$file" "$problems" >&2
  exit 2
fi
exit 0
~~~~

**`.claude/hooks/publish-gate.sh`**

~~~~bash
#!/usr/bin/env bash
# PreToolUse gate for every Blotato MCP tool: always escalate to the human.
# بوابة النشر: أي أداة Blotato بتطلب موافقتك انت، حتى لو الجلسة بوضع auto.
cat >/dev/null
cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"Publishing gate: only approve if you (the editor) typed «انشر» for exactly this publish/plan.json."}}
JSON
~~~~

---

## 7. مكتبة البرومبتات (12 + 3 إضافيين) — انسخ، عبّي الأقواس، ابعت

> قاعدة: النص العربي اللي بدك ياه عالشاشة دايماً بين «» حرفياً. والمصطلحات التقنية بالإنجليزي متل ما هي.

### 1) سكربت ← ستوريبورد
```
/storyboard-director videos/[slug]/script.md 9:16 25
هاد سكربت لريل عن [الموضوع]. الجمهور: [مين]. الهدف: [شو بدنا يصير بعد ما يشوفو]. الـ CTA: «[...]».
بدي storyboard بس، بلا أي HTML هلّق.
- كل مشهد فكرة وحدة، 1.5–4 ثواني.
- النص عالشاشة أقصر من الـ voice-over (عنوان مش ترانسكريبت)، واكتبو حرفياً بين «».
- الوقت بالثواني والفريمات (30fps).
- لكل عنصر: enter / hold / exit + ease + duration، والاتجاه RTL.
- حدّد 4–6 key times للـ snapshots.
إذا في شي ناقص اسألني سؤال واحد بس، غير هيك افترض واكتب افتراضاتك فوق.
```

### 2) مشهد هوك (أول 3 ثواني) — style frame
```
/brand-scene-builder [slug] style-frame
ابنِ مشهد الهوك بس (مشهد 1 بالستوريبورد)، 0→2.4s، 9:16.
المرجع: [screenshot/رابط/وصف، مثلاً: تايبوغرافي ضخم أبيض على أسود وكلمة وحدة بالـ accent].
- f0 لازم يكون فيه الهوك أو فيجوال واضح، ممنوع fade من الأسود.
- الكلمة القوية «[...]» تعمل scale 0.6→1 بـ expo.out عند f6.
- باقي الكلمات كلمة كلمة من اليمين، stagger 0.12، power3.out.
- ممنوع تقسيم الحروف، ممنوع bounce، ممنوع gradient بنفسجي.
بعد ما تخلص: lint + snapshot عند 0, 0.3, 1.0, 2.2 وورجيني الصور. ما تكمّل باقي المشاهد لحتى قلك «تمام».
```

### 3) Data explainer متحرك
```
بدي مشهد data explainer، 8 ثواني، 9:16، من هالأرقام (المصدر: [...]):
[الصق الجدول أو CSV]
- 0→2s: الرقم الرئيسي «[..]%» يعد من 0 (count-up) بـ power3.out، أرقام [latn|arab]، tabular-nums، وبيوقف hold 1.2s.
- 2→6s: bar chart لـ [4] فئات، أول فئة عاليمين (RTL)، البارات تطلع scaleY من تحت stagger 0.12، والقيم تعد معها.
- 6→8s: جملة خلاصة «[...]» + hold.
- الفئة المهمة بـ --c-accent والباقي --c-ink-dim. tokens بس.
- ما تخترع ولا رقم؛ الناقص حطو [؟] ونبّهني.
اعمل ستوريبورد صغير للمشهد (جدول) أول، وبعد موافقتي ابنيه وورجيني snapshots عند 1.0, 3.5, 7.5.
```

### 4) Kinetic typography لاقتباس محايد
```
/brand-scene-builder [slug] all
كاينتك تايبوغرافي لاقتباس محايد (مش آية ولا حديث ولا نص ديني):
«[الاقتباس]» — [القائل بالظبط متل ما كتبتو / أو: مثل شعبي]
- 7 ثواني، 1:1 (1080×1080).
- كل سطر يظهر بـ mask wipe من اليمين لليسار، والكلمة المفتاحية «[..]» بـ --c-accent مع scale خفيف 1→1.06.
- --font-quote للاقتباس، --font-body للقائل، والقائل يظهر بعد 0.4s من آخر سطر.
- line-height ≥ 1.5 و padding عمودي بالـ mask عشان النقاط والتشكيل ما ينقصوا.
- ممنوع letter-spacing وممنوع تقسيم الحروف.
- آخر 1.5s hold هادي.
ورجيني snapshots عند 1.0, 3.5, 6.5.
```

### 5) Logo reveal
```
بدي logo reveal، 3 ثواني، بنسختين 16:9 و 9:16، من brand/logo.svg.
- 0→0.9s: اللوغو يطلع بـ mask + scale 0.85→1 بـ power4.out، مع sweep ضوئي واحد بالـ accent من اليمين لليسار.
- 0.9→1.5s: الـ tagline «[...]» كلمة كلمة.
- 1.5→3.0s: hold ثابت، بلا أي loop.
- لا تغيّر ألوان اللوغو ولا نسبه.
ورجيني snapshots عند 0.3, 0.9, 2.8 بالمقاسين.
```

### 6) كابشن كاريوكي عربي من transcript JSON
```
/arabic-kinetic-captions videos/[slug]/edit/transcript.cut.json karaoke 9:16
- الترانسكريبت word-level بصيغة [{text,start,end}] بالثواني.
- قبل ما تبني: اعطيني تقرير sanity (عدد الكلمات، الفجوات الطويلة، كلمات مدتها صفر). صحّح الإملاء حسب السكربت هون: [مسار السكربت]، بس خلّي التوقيت، واعطيني لستة بكل كلمة غيّرتها.
- 2–5 كلمات بالصفحة، سطرين max، ولا تخلّي «و / في / على / من» بآخر السطر.
- الهايلايت يمشي على الكلمة من اليمين لليسار (clip-path على نسخة تانية من الكلمة) بدون ما ينكسر وصل الحروف.
- المكان: caption band من tokens (y 1180–1460).
- بالآخر: 3 snapshots بنص كلمات، وقلي (الوقت، الكلمة المتوقعة، الكلمة المضوّية).
```

### 7) تعديل حسب screenshot
```
[الصق الـ screenshot]
هاي لقطة من الدرافت عند [4.8]s. ملاحظاتي:
1. [العنوان لازق بحافة الشاشة اليمين — رجّعو جوّا الـ safe zone.]
2. [كلمة «الاصطناعي» عم تنقص نقطتها التحتانية.]
3. [الدخول بطيء — بدي يوصل خلال 0.4s بـ expo.out.]
المطلوب:
- أول شي أعد صياغة كل ملاحظة كـ fix مرقّم مع الـ element id والتايم كود.
- عدّل هدول بس، ولا تلمس ولا مشهد تاني.
- بعدين snapshot عند نفس الوقت (+ --zoom على العنصر) وحط مسارات before/after جنب بعض.
```

### 8) 5 نسخ هوك لاختبار A/B (batch)
```
/viral-hook-writer videos/[slug]/script.md 5 levantine
بدي 5 هوكات لنفس الفيديو، كل واحد بآلية مختلفة: رقم صادم، تناقض، سؤال، ألم، open loop.
- ≤ 7 كلمات عالشاشة، وكلمة punch وحدة معلّمة.
- ما تخترع أرقام.
بعدها:
1. خلّي مشهد الهوك يقرا hook_text / punch_word / accent من data-composition-variables (بـ window.__hyperframes.getVariables()).
2. اكتب hooks.rows.json.
3. ريندر draft لكل نسخة بـ --batch و --strict-variables.
4. جدول: id | الآلية | النص | مسار الملف، ورشّحلي أحسن 2 نبلّش فيهم.
```

### 9) تصدير 9:16 / 1:1 / 16:9
```
/aspect-variants [slug] 9x16,1x1,16x9
الدرافت 9:16 موافق عليه. بدي 1:1 و 16:9 من نفس الفيديو.
- مش scale — re-layout: بالـ 16:9 عمود النص عاليمين والفيجوال عاليسار؛ بالـ 1:1 الخط ×0.85.
- نفس الكلمات ونفس التوقيت بالظبط.
- كل نسخة تعدّي lint + check + snapshots عند نفس الـ key times.
- بالآخر: جدول (ratio | مسار | مدة | حجم) + snapshot للـ hero frame لكل مقاس.
```

### 10) تركيب الـ Brand tokens من دليل الهوية
```
[ارفق brand guide PDF أو صور]
هاد دليل الهوية لـ [البراند]. حدّث brand/tokens.css و brand/motion.js منّو:
- الألوان: hex بالظبط، وسمّيهم حسب الوظيفة (bg, ink, accent…) مش حسب اللون.
- الخطوط: إذا الخط مش مجاني أو ما عندي ملفو، اقترح بديل عربي OFL قريب وقلي شو لازم نزّل على brand/fonts.
- شخصية الحركة: [هادية | حادة | مرحة] → عدّل الـ eases والمدد بـ motion.js.
- افحص contrast لكل تركيبة نص/خلفية وقلي مين بيفشل WCAG AA.
ما تعدّل ولا فيديو قديم. ورجيني diff للملفين + مشهد 3 ثواني بيعرض الألوان والخطوط مع snapshot.
```

### 11) Lower-third / بطاقة «عاجل» شفافة للمونتاج
```
بدي lower-third لضيف + بطاقة «عاجل» بنفس الستايل، 16:9، كـ overlay شفاف أحطو فوق الفيديو.
- الاسم: «[...]»، الصفة: «[...]».
- البار يمسح من اليمين (scaleX 0→1، transformOrigin right)، بعدين الاسم ثم الصفة stagger 0.15s.
- يبقى 4 ثواني ويطلع بعكس الدخول.
- جوّا الـ safe zone للـ 16:9 (96px).
- ريندر شفاف: --format webm (أو mov) وابعتلي المسار.
```

### 12) QA نهائي + مراجعة مستقلة قبل الرندر
```
/qa-gate [slug]
بعد ما يعدّي:
- خلّي @agent-motion-critic و @agent-arabic-type-reviewer يراجعوا الـ snapshots والستوريبورد.
- صلّح الـ must-fix بس، واعطيني تقرير واحد: شو تصلّح + مسارات before/after + شو بقي مفتوح.
- ما تعمل render نهائي لحتى قلك «رندر».
```

### إضافي 13) من فوتج خام للنشر (الأمر الكامل)
```
/raw-to-published [مسار محلي أو فولدر Drive] [slug] [hyperframes|remotion]
الفيديو: [موضوعو بجملة]. المنصات: [tiktok, instagram, youtube]. المقاسات: [9:16 + 1:1].
وقّف عند كل 🛑 checkpoint وما تكمّل بلا ردّي. سجّل التقدم بـ RUN.md.
```

### إضافي 14) First pass cut لحالو
```
/first-pass-edit videos/[slug]/raw/[file].mp4 [slug]
min-silence: [0.45]. شيل السكتات والـ fillers الأكيدة أوتوماتيك، وكل شي تاني (يعني، إعادات، «لا لا خليني أعيد») اعرضو عليّ بجدول مع 3 كلمات قبل و3 بعد، وأنا بقلك مين توافق عليه.
```

### إضافي 15) «Reset» بعد تصحيحين فاشلين
```
/clear
```
وبعدين:
```
كمّل مشروع videos/[slug] من RUN.md و storyboard.md.
اللي تعلمناه: [المشكلة] صارت لأنو [السبب]. الحل المطلوب: [...].
اشتغل على [المشهد/العنصر] بس، وورجيني snapshot عند [الوقت].
```

---

## 8. حلقة «برومبت ← مراجعة ← تصليح» بنقاط تفتيش

```
 CP0 Brief ─► CP1 Storyboard ─► CP2 Style frame ─► CP3 Draft + QA ─► CP4 Critic ─► CP5 Final + ratios ─► CP6 Publish ─► CP7 Retro
     ▲              │                 │                  │                │                                   │
     └──── ملاحظات مرقّمة ◄──────────┴──────────────────┴────────────────┘                          «انشر» منك بس
```

| نقطة التفتيش | شو بيسلّمك Claude | شو بتفحص انت | الأمر | معيار النجاح | git |
|---|---|---|---|---|---|
| **CP0 Brief** | `brief.md` (هدف، جمهور، CTA، فورمات) | الوعد واضح؟ | برومبت 1 أو script-writer | جملة وحدة بتوصف الوعد | — |
| **CP1 Storyboard** | `storyboard.md` جدول | النص الحرفي، التوقيت، الهرمية، key times | `/storyboard-director` | كل مشهد فكرة وحدة، القراءة كافية | `storyboard ok` |
| **CP2 Style frame** | مشهد الهوك + 3–4 snapshots | الخط، اللون، العربي متصل، الإحساس | `/brand-scene-builder … style-frame` | «هيك بدي ياه» | `style frame ok` |
| **CP3 Draft** | كل المشاهد + تقرير `/qa-gate` + draft MP4 | الإيقاع، الانتقالات، الكابشن | `/qa-gate` + `render --quality draft` | lint/check 0 errors، checklist كلو ✅ | `draft ok` |
| **CP4 Critic** | تقرير `motion-critic` (+ `arabic-type-reviewer`) | must-fix بس | `@agent-motion-critic` | must-fix = 0 | — |
| **CP5 Final** | ملفات delivery لكل ratio + hero still | كل مقاس لحالو | `/aspect-variants` | كل مقاس عدّى الـ gate | `final` |
| **CP6 Publish** | `publish/plan.json` + thumbnails A/B | النص، الهاشتاغات، الموعد | `/publish-pack` ثم «انشر» | موافقتك الصريحة | `published` |
| **CP7 Retro** | 3 أسطر مقترحة لـ CLAUDE.md | بتستاهل تنضاف؟ | برومبت آخر النهار | القاعدة ما بتتكرر | `rules` |

### كيف تكتب ملاحظة بتنفهم من أول مرة
```
[التايم كود] [العنصر] — [شو شايف] → [شو بدك بالظبط]
مثال: 3.2s العنوان — بيوصل متأخر وبيتمطّط → يوصل خلال 0.4s بـ expo.out، بلا overshoot
```

### قواعد الحلقة
1. **ملاحظة = fix مرقّم بـ id وتايم كود.** Claude بيعيد صياغتها قبل ما يعدّل (بيكشف سوء الفهم بكير).
2. **نفس أوقات الـ snapshot قبل وبعد** — مقارنة حقيقية مش ذاكرة.
3. **قاعدة المحاولتين:** إذا نفس الملاحظة فشلت مرتين → `/clear` + برومبت 15. جلسة نضيفة ببرومبت أحسن بتغلب جلسة طويلة مليانة تصحيحات (توثيق Anthropic).
4. **`Esc`** بيوقف Claude بنص الشغل، و**`Esc Esc` أو `/rewind`** بيرجّع الكود والمحادثة لنقطة سابقة. بس الـ checkpoints ما بتلقط تغييرات الـ Bash، فخلّي **git commit** عند كل نقطة تفتيش.
5. **مراجع مستقل للشغل الطويل:** الناقد (subagent) ما بيشوف تفكير الكاتب، فبيحكم عالنتيجة. بس خلّيه يفصل must-fix عن الذوق الشخصي عشان ما تغرق بتعديلات مالها لزوم.
6. **الرندر النهائي والنشر = قرارك انت بس.**

---

## 9. المصادر (متحقق منها اليوم 2026-09-30)

**Claude Code (رسمي)**
- Skills (صيغة SKILL.md، الـ frontmatter، `$ARGUMENTS`، `disable-model-invocation`، `allowed-tools`، `${CLAUDE_SKILL_DIR}`، حد 1,536 حرف، < 500 سطر، الأوامر اندمجت بالـ skills): https://code.claude.com/docs/en/skills
- Subagents (`.claude/agents/*.md`، الحقول، `@agent-name`): https://code.claude.com/docs/en/sub-agents
- CLAUDE.md / memory (< 200 سطر، `@imports`، تعليقات HTML بتنشال، `.claude/rules/` مع `paths`): https://code.claude.com/docs/en/memory
- Hooks (الأحداث، matcher، stdin JSON، exit 2، `permissionDecision`): https://code.claude.com/docs/en/hooks
- Best practices (تحقق بالـ screenshots، explore→plan→code، `/clear`، writer/reviewer، subagent review): https://code.claude.com/docs/en/best-practices
- MCP (`claude mcp add --transport http`، تسمية `mcp__server__tool`): https://code.claude.com/docs/en/mcp

**هندسة البرومبت (Anthropic)**
- Prompting best practices: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Prompting Claude Opus 5.5 (effort الافتراضي medium، قراءة الصور، frontend defaults، unattended runs): https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5

**HyperFrames (HeyGen)**
- الريبو: https://github.com/heygen-com/hyperframes — و`CLAUDE.md` تبعو: https://raw.githubusercontent.com/heygen-com/hyperframes/main/CLAUDE.md
- `hyperframes-core` (عقد التكوين والحتمية): https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/hyperframes-core/SKILL.md
- `motion-graphics` (الـ workflow بـ 7 مراحل): https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/motion-graphics/SKILL.md
- `hyperframes-animation` + easing/stagger: https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/hyperframes-animation/adapters/gsap-easing-and-stagger.md
- `embedded-captions`: https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/embedded-captions/SKILL.md
- `hyperframes-cli`: https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/hyperframes-cli/SKILL.md
- مرجع الـ CLI الكامل (render flags، `--variables`، `--batch`، `check --caption-zone`، `snapshot --zoom/--against`، `transcribe --model large-v3 --language`): https://raw.githubusercontent.com/heygen-com/hyperframes/main/docs/packages/cli.mdx
- المتغيرات: https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/hyperframes-core/references/variables-and-media.md

**Remotion**
- Skills الرسمية: https://github.com/remotion-dev/skills (best-practices، remotion-markup، local-fonts، transitions، captions)
- Flickering (ليش لازم كل شي من `useCurrentFrame`): https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/flickering.mdx
- `spring()`: https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/spring.mdx — `random()`: https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/random.mdx — `render` CLI: https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/cli/render.mdx

**مجتمع**
- hyperframes-student-kit (skills للمونتاج، MOTION_PHILOSOPHY): https://github.com/nateherkai/hyperframes-student-kit — https://raw.githubusercontent.com/nateherkai/hyperframes-student-kit/main/MOTION_PHILOSOPHY.md
- awesome-claude-video-skills (كتالوج 183 skill): https://github.com/zhuyansen/awesome-claude-video-skills

**أخرى**
- Blotato MCP (`https://mcp.blotato.com/mcp`): https://www.blotato.com/mcp — https://www.blotato.com/blog/post-to-social-media-with-claude
- GSAP صار مجاني بالكامل مع SplitText (3.13): https://gsap.com/blog/3-13/ — https://webflow.com/blog/gsap-becomes-free
- Safe zones للريلز (الأرقام بتختلف بين المصادر، اخترنا قيم محافظة): https://www.outfy.com/blog/instagram-safe-zone/ — https://www.hopperhq.com/blog/instagram-reel-size/

### ملاحظات صراحة (شو ما قدرت أتأكد منو 100%)
- **صيغة سطر `--batch`** بالظبط (الـ docs بتقول «JSON array أو `{rows:[...]}`» بس ما بتفصّل مفاتيح اسم الملف) — الـ skills بتطلب من Claude يفحص `npx hyperframes render --help` قبل ما يكتب `rows.json`.
- **صيغة `--caption-zone`** مأخوذة من جدول الـ docs؛ الـ skill بتطلب تأكيدها بـ `--help`. وكمان إذا مسار المشروع positional بأمر `render`.
- **اسم خيار `slide({direction})`** بـ `@remotion/transitions` — معلّم «تحقق بالنسخة المنزّلة».
- **أسماء أدوات Blotato** ما بتنعرف إلا بعد الاتصال (`/mcp`)؛ الـ hook بيغطيها كلها بـ `mcp__blotato__.*` بشرط تسمي السيرفر `blotato`.
- **مرايا واجهة التطبيقات بالعربي** (أزرار الريلز ممكن تنقلب لليسار): ما لقيت مصدر رسمي، فحمينا الجهتين بـ 120px.
- **دقة Whisper `large-v3` مع اللهجة الشامية** بتختلف؛ عشان هيك الكابشن بيصحّح الإملاء من السكربت ويحافظ عالتوقيت، وبيسجّل كل تعديل.
- الـ skill تبع «edit broomi video» اللي بالفيديو ما شفت ملفو؛ `raw-to-published` بتسمح باستعمالو إذا كان منزّل، تحت نفس قواعد الاستوديو.
- `hf-guard.sh` و`edl.py` و`motion.js` **مختبرين هون** (Linux، ffmpeg 7، Node 22)؛ ما جربت HyperFrames render فعلي بهالبيئة (الـ CLI مش منزّل).
