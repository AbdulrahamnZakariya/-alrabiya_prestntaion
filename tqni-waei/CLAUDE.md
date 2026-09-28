# تعليمات Claude لمشروع «تقني واعي»

Next.js 15 (App Router) + Supabase + Claude API. الواجهة عربية RTL. سيرفر المعالجة في `../worker` (Claude Agent SDK).
دليل النشر: `../docs/DEPLOY.md`.

## نوعا المكائن
- `runner: "text"` (الافتراضي): فريق وكلاء داخل الموقع (`src/lib/pipeline.ts`)، مراحل `team` في plugin.json.
- `runner: "worker"`: طلب في جدول `jobs` يسحبه `../worker` ويشغّل Claude Agent SDK مع البلجنز المذكورة في `worker.plugins`، ومهمته من `machines/<slug>/worker.md`. الملفات النهائية تُكتب في مجلد التسليم `{{EXPORT_DIR}}`.

## إضافة/تحديث مهارة وكيل (مكائن نصية)
- مهارة وكيل خاص بماكينة: `machines/<slug>/agents/<agent>.md`
- مهارة مشتركة بين كل المكائن: `machines/_shared/agents/<agent>.md`. إن وُجد ملف خاص بالماكينة بنفس الاسم فهو المستخدَم.
- إن رفع المالك سكيل (SKILL.md) لماكينة نصية: حوّله إلى مهارة الوكيل `creator.md` (المنتج الرئيسي)، وحافظ على قسم «صيغة التسليم».
- إن كان السكيل يغطي أكثر من دور، وزّعه على analyst وcreator ومراجع متخصص.
- المهارة المرفوعة من لوحة التحكم (جدول `machine_skills`) تتقدم على الملفات.

## إضافة ماكينة نصية
1. أنشئ `machines/<slug>/plugin.json` على نمط `machines/prompt-engineer/plugin.json`. الـ slug بحروف إنجليزية صغيرة وشرطات.
2. الفريق القياسي: analyst ← creator ← [reviewer-expert, reviewer-audience, reviewer-redteam, + مراجع متخصص] ← refiner ← qa-final.
3. اكتب `agents/analyst.md` و`agents/creator.md` ومهارة المراجع المتخصص.
4. `status: "soon"` تعرض الماكينة بدون شراء أو تشغيل، و`"live"` تفعّلها.
5. مخرج مصمم بدل النص: ضع `"output": "carousel"` في plugin.json، وأضف `output.schema.json`، وأنشئ `agents/qa-final.md` خاصاً بالماكينة يسلّم JSON. المرحلة الأخيرة تُقيَّد بالمخطط تلقائياً (مثال: `machines/carousel`).
6. للتحقق من الحقائق عبر الإنترنت: `"webSearch": true` على المرحلة.

## إضافة ماكينة سيرفر (من بلجن أو سكل)
1. المالك يعطيك البلجن/السكل. **لا ترفعه للريبو** (الريبو قد يكون عاماً) — يُركّب على السيرفر بـ `worker/scripts/add-plugin.sh`.
2. أنشئ `machines/<slug>/plugin.json` على نمط `machines/presentation/plugin.json`: `runner: "worker"`، الحقول (ومنها `type: "file"` مع `accept` و`maxMB`)، `crew` للعرض، `worker: { plugins, maxBudgetUsd, trialBudgetUsd, timeoutMin }`، `eta`.
3. اكتب `machines/<slug>/worker.md`: يبدأ بـ `{{INPUTS}}` و`{{FILES}}`، ويشرح أي سكل يُحمَّل، وكيف تُستبدل خطوات «اسأل العميل» بافتراضات موثّقة، وقائمة الملفات التي تُنسخ إلى `{{EXPORT_DIR}}`.
4. المتغيرات المتاحة: `{{INPUTS}}`، `{{FILES}}`، `{{WORKDIR}}`، `{{INPUT_DIR}}`، `{{EXPORT_DIR}}`.

## قواعد
- وكيل المرحلة الأخيرة (qa-final) يُخرج الناتج النهائي فقط، لأنه ما يراه العميل.
- لا تفتح ماكينة لمستخدم إلا عبر جدول `entitlements` بعد تأكيد المالك. رصيد الشراء يُحسب من `granted_at`.
- مفاتيح التخزين ASCII فقط (`safeFileName`) — الاسم العربي الأصلي يُحفظ في حقل `name`.
- قبل أي push تحقّق بـ `npx tsc --noEmit && npm run lint && npm run build` هنا، و`npx tsc --noEmit` في `../worker`.
