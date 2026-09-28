# دليل رفع منصة «تقني واعي» على دومين خاص

كل المنصة تشتغل على **سيرفر واحد**:

```
                         ┌──────────────── السيرفر (Docker) ────────────────┐
  العميل ──https──▶ Caddy ──▶ الموقع (Next.js) ─┐                           │
                         │                      │  المكائن النصية (Claude API) │
                         │                      ▼                           │
                         │            Supabase (حسابات، طلبات، ملفات)        │
                         │                      ▲                           │
                         │   سيرفر المعالجة ────┘  مكائن الملفات والفيديو     │
                         │   (Claude Agent SDK + بلجن تقني باني + المونتاج)  │
                         └──────────────────────────────────────────────────┘
```

- **المكائن النصية** (البرومتات، الكاروسيل، الهوكات، سكربت الريلز) تشتغل داخل الموقع مباشرة.
- **مكائن الملفات والفيديو** (البرزنتيشن، الاستنساخ، دراسات الجدوى، الوورد والإكسل، المونتاج) تدخل طابوراً، ويسحبها سيرفر المعالجة، ويشغّل عليها فريق الوكلاء، ويرفع الملفات لحساب العميل.

---

## 0) قبل أي شيء: اجعل الريبو خاصاً

الريبو حالياً **عام**. هذا يعني أن مهارات الوكلاء (البرومتات التي تعبت عليها) مكشوفة لأي أحد.
GitHub ← الريبو ← **Settings** ← أسفل الصفحة **Danger Zone** ← **Change visibility** ← **Private**.

> البلجنز (تقني باني، المونتاج) **لم تُرفع للريبو أصلاً** — تُركّب على السيرفر فقط (الخطوة 4).

---

## 1) Supabase (قاعدة البيانات والحسابات والملفات)

1. أنشئ مشروعاً على [supabase.com](https://supabase.com). المنطقة الأقرب للأردن: **Frankfurt (eu-central-1)**.
2. **SQL Editor** ← New query ← الصق محتوى `tqni-waei/supabase/schema.sql` ← **Run**.
3. **Project Settings ← API**: انسخ `Project URL` و`anon public` و`service_role` (الأخير سرّي — للسيرفر فقط).
4. **Authentication ← Emails ← SMTP Settings**: فعّل SMTP خاصاً (مثلاً [Resend](https://resend.com) مجاني لحد 3000 إيميل شهرياً).
   بدونه Supabase يرسل عدداً قليلاً جداً من إيميلات الدخول في الساعة، والعملاء ما بيقدروا يسجلوا.
5. (اختياري) عرّب قالب إيميل الدخول من **Authentication ← Email Templates ← Magic Link**.

### حدود الخطة المجانية (مهم لماكينة المونتاج)
| | المجانية | Pro (‏25$ شهرياً) |
|---|---|---|
| حجم الملف الواحد | **50MB** | حتى 500GB (تضبطه من Storage ← Settings) |
| مساحة التخزين | 1GB | 100GB |
| توقف المشروع | يتوقف بعد أسبوع بلا نشاط | لا يتوقف |

فيديوهات المونتاج غالباً أكبر من 50MB، لذلك ماكينة المونتاج تحتاج خطة **Pro** وتعديل حد الملف من **Storage ← Settings ← Upload file size limit** إلى 500MB.
باقي المكائن تكفيها المجانية للبداية.

---

## 2) Claude API

1. من [console.anthropic.com](https://console.anthropic.com) ← **API Keys** ← أنشئ مفتاحاً.
2. **Billing**: اشحن رصيداً، وضع **حد إنفاق شهري** (Spend limit) — حماية من أي مفاجأة.
3. تكلفة كل طلب سيرفر تظهر لك في لوحة التحكم (`/admin`) — راقبها أول أسبوع وعدّل الأسعار أو الرصيد المشمول لو لزم.

---

## 3) السيرفر والدومين

### السيرفر
- **Ubuntu 24.04**، و**4 أنوية + 8GB رام** كحد أدنى (‏16GB إن كانت ماكينة المونتاج مفعّلة — Whisper وكروميوم يحتاجان ذاكرة)، وقرص **80GB**.
- أمثلة: Hetzner (CPX31 / CPX41)، DigitalOcean، Contabo. التكلفة التقريبية 15–40$ شهرياً حسب الحجم.

### الدومين
1. اشترِ الدومين (Namecheap، GoDaddy، أو دومين ‎.jo من مزوّد أردني).
2. من إعدادات DNS أضف:
   | النوع | الاسم | القيمة |
   |---|---|---|
   | A | `@` | عنوان IP للسيرفر |
   | A | `www` | عنوان IP للسيرفر |
3. شهادة HTTPS تنعمل **تلقائياً** بمجرد ما يشتغل السيرفر (Caddy + Let's Encrypt).

---

## 4) التشغيل على السيرفر

ادخل على السيرفر (`ssh root@IP`) ثم:

```bash
# 1. نزّل المشروع وثبّت Docker (أول تشغيل ينشئ ملف الإعدادات ويتوقف)
curl -fsSL https://raw.githubusercontent.com/AbdulrahamnZakariya/-alrabiya_prestntaion/<branch>/deploy/setup-server.sh \
  | bash -s -- https://github.com/AbdulrahamnZakariya/-alrabiya_prestntaion.git <branch>
```
> لو صار الريبو خاصاً: استخدم رابط الريبو مع [Deploy key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys) أو Personal access token.

```bash
# 2. عبّئ الإعدادات
nano /opt/tqni/deploy/.env        # الدومين، مفاتيح Supabase، مفتاح Claude، إيميلك في ADMIN_EMAILS

# 3. ارفع ملفات البلجنز من جهازك للسيرفر (من جهازك أنت، مش من السيرفر):
#    scp taqni-bani.plugin video-ad-editor.zip root@IP:~/
#    ثم على السيرفر:
bash /opt/tqni/worker/scripts/add-plugin.sh ~/taqni-bani.plugin
bash /opt/tqni/worker/scripts/add-plugin.sh ~/video-ad-editor.zip

# 4. شغّل كل شيء (أول مرة 10–20 دقيقة)
bash /opt/tqni/deploy/setup-server.sh https://github.com/AbdulrahamnZakariya/-alrabiya_prestntaion.git <branch>
```

بدون ماكينة المونتاج (سيرفر أصغر وأسرع بناء): ضع `WITH_VIDEO=0` في `.env`، وحوّل الماكينة إلى `"status": "soon"` في `tqni-waei/machines/reels-editor/plugin.json`.

---

## 5) ربط الدومين بـ Supabase
**Authentication ← URL Configuration**:
- **Site URL**: `https://دومينك`
- **Redirect URLs**: أضف `https://دومينك/auth/callback`

---

## 6) اللمسات الأخيرة
1. افتح `https://دومينك/login` وسجّل دخول بإيميلك (نفس الموجود في `ADMIN_EMAILS`) — سيظهر لك رابط **لوحة التحكم**.
2. عبّئ بيانات الدفع الحقيقية (Alias كليك، IBAN، PayPal) وآراء العملاء في `tqni-waei/src/content/site.ts` ثم حدّث السيرفر (الخطوة 8).
3. اكتب نبذتك في `tqni-waei/src/app/about/page.tsx`.

---

## 7) قائمة اختبار قبل الإعلان
- [ ] الدخول بالإيميل يوصل ويشتغل.
- [ ] تجربة مجانية لماكينة البرومتات تطلع نتيجة.
- [ ] تجربة ماكينة الكاروسيل: السلايدات تنزل PNG.
- [ ] من حساب ثاني: شراء ← رفع إيصال ← يظهر في `/admin` ← تأكيد ← الماكينة تنفتح.
- [ ] طلب برزنتيشن: يدخل الطابور ← «الفريق يشتغل» ← الملفات تنزل من «حسابي».
- [ ] سجلات السيرفر نظيفة: `cd /opt/tqni/deploy && docker compose logs -f worker`.

---

## 8) التحديثات لاحقاً

| التعديل | الطريقة |
|---|---|
| مهارة وكيل في ماكينة نصية | من `/admin` ← «مهارات فرق المكائن» ← ارفع `.md` ← يطبّق **فوراً** |
| أي تعديل بالكود أو المكائن (عن طريق Claude) | Claude يعدّل ويرفع للريبو، ثم على السيرفر: `cd /opt/tqni && git pull && cd deploy && docker compose up -d --build` |
| تحديث بلجن تقني باني أو المونتاج | `bash /opt/tqni/worker/scripts/add-plugin.sh ~/الملف-الجديد.plugin` ثم `docker compose up -d --build worker` |
| زيادة سرعة الطابور | `docker compose up -d --scale worker=2` (يحتاج رام أكثر) |

---

## 9) التكاليف الشهرية التقريبية
| البند | البداية | مع المونتاج |
|---|---|---|
| السيرفر | 15–20$ | 30–40$ |
| Supabase | مجاني | 25$ (Pro) |
| الدومين | ~1$ (سنوياً 10–15$) | ~1$ |
| Claude API | حسب الاستخدام — يظهر لكل طلب في `/admin` | |

---

## 10) حل المشاكل
| المشكلة | الحل |
|---|---|
| الطلب عالق «في الطابور» | سيرفر المعالجة واقف: `docker compose ps` ثم `docker compose logs worker` |
| «البلجن غير مركّب على السيرفر» | نفّذ `add-plugin.sh` للبلجن الناقص ثم `docker compose up -d --build worker` |
| الطلب «تعذّر التنفيذ» | التفاصيل التقنية تظهر لك في `/admin` (العميل يرى رسالة عامة). زر «إعادة تشغيل» يعيده للطابور |
| إيميلات الدخول لا تصل | فعّل SMTP خاص (الخطوة 1.4) |
| رفع الفيديو يفشل | حد حجم الملف في Supabase (الخطوة 1 — الجدول) |
| HTTPS لا يعمل | تأكد أن DNS يشير للسيرفر، وأن المنفذين 80 و443 مفتوحان في جدار الحماية |
