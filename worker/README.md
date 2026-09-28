# سيرفر المعالجة — مكائن «تقني واعي» الثقيلة

يسحب طلبات مكائن الملفات والفيديو من طابور Supabase (`jobs`)، ويشغّل عليها فريق الوكلاء بـ **Claude Agent SDK** مع البلجنز المركّبة، ثم يرفع الملفات الناتجة لحساب العميل.

```
claim_job (ذرّي)  ←  تنزيل ملفات العميل  ←  Claude Agent SDK + البلجن (بدون تفاعل)
        ←  تحديث التقدّم كل 8 ثوانٍ + نبض كل دقيقة  ←  رفع ملفات مجلد التسليم  ←  done
```

- **طلب علق** (السيرفر وقع): يرجع للطابور تلقائياً بعد 20 دقيقة بلا نبض، ويفشل بعد 3 محاولات.
- **إيقاف السيرفر** (`docker compose down`/تحديث): الطلب الجاري يرجع للطابور.
- **سقف التكلفة** لكل طلب من `worker.maxBudgetUsd` (والتجربة المجانية `trialBudgetUsd`)، و**مهلة** من `timeoutMin`.
- تكلفة Claude الفعلية لكل طلب تُحفظ في `jobs.cost_usd` وتظهر في `/admin`.

## التشغيل
يُشغَّل مع الموقع من `deploy/docker-compose.yml` — انظر [`docs/DEPLOY.md`](../docs/DEPLOY.md).

## البلجنز
تُركّب على السيرفر فقط (لا تُرفع للريبو):
```bash
bash worker/scripts/add-plugin.sh ~/taqni-bani.plugin     # بلجن
bash worker/scripts/add-plugin.sh ~/video-ad-editor.zip   # سكل مفرد → يُغلَّف ببلجن
```

## التطوير
```bash
npm install
npx tsc --noEmit
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… ANTHROPIC_API_KEY=… npm run dev
```
Claude Code يرفض تخطّي الأذونات كمستخدم root — شغّله كمستخدم عادي (الحاوية تفعل ذلك تلقائياً).
