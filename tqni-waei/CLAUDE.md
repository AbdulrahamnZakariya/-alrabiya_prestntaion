# تعليمات Claude لمشروع «تقني واعي»

Next.js 15 (App Router) + Supabase + Claude API. الواجهة عربية RTL.

## إضافة/تحديث مهارة وكيل
- مهارة وكيل خاص بماكينة: `machines/<slug>/agents/<agent>.md`
- مهارة مشتركة بين كل المكائن: `machines/_shared/agents/<agent>.md`. إن وُجد ملف خاص بالماكينة بنفس الاسم فهو المستخدَم.
- إن رفع المالك سكيل (SKILL.md) لماكينة: حوّله إلى مهارة الوكيل `creator.md` (المنتج الرئيسي)، وحافظ على قسم «صيغة التسليم».
- إن كان السكيل يغطي أكثر من دور، وزّعه على analyst وcreator ومراجع متخصص.
- المهارة المرفوعة من لوحة التحكم (جدول `machine_skills`) تتقدم على الملفات.

## إضافة ماكينة جديدة
1. أنشئ `machines/<slug>/plugin.json` على نمط `machines/prompt-engineer/plugin.json`. الـ slug بحروف إنجليزية صغيرة وشرطات.
2. الفريق القياسي: analyst ← creator ← [reviewer-expert, reviewer-audience, reviewer-redteam, + مراجع متخصص] ← refiner ← qa-final.
3. اكتب `agents/analyst.md` و`agents/creator.md` ومهارة المراجع المتخصص.
4. `status: "soon"` تعرض الماكينة بدون شراء أو تشغيل، و`"live"` تفعّلها.
5. مخرج مصمم بدل النص: ضع `"output": "carousel"` في plugin.json، وأضف `output.schema.json`، وأنشئ `agents/qa-final.md` خاصاً بالماكينة يسلّم JSON. المرحلة الأخيرة تُقيَّد بالمخطط تلقائياً (مثال: `machines/carousel`).

## قواعد
- وكيل المرحلة الأخيرة (qa-final) يُخرج الناتج النهائي فقط، لأنه ما يراه العميل.
- لا تفتح ماكينة لمستخدم إلا عبر جدول `entitlements` بعد تأكيد المالك.
- قبل أي push تحقّق بـ `npx tsc --noEmit && npm run lint && npm run build`.
