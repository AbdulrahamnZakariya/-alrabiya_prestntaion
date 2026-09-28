import { getMachine } from "@/lib/machines";
import { canRun, getAccess, getCurrentUser } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { JOB_BUCKET, type Job } from "@/lib/jobs";

// بعد رفع الملفات: يتحقق أنها وصلت، ثم يدخل الطلب طابور سيرفر المعالجة
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "سجّل دخولك أولاً" }, { status: 401 });
  const { id } = await params;

  const db = createAdminClient();
  const { data } = await db.from("jobs").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  const job = data as Job | null;
  if (!job) return Response.json({ error: "الطلب غير موجود" }, { status: 404 });
  if (job.status !== "draft") return Response.json({ ok: true, status: job.status });

  for (const f of job.input_files) {
    const folder = f.path.slice(0, f.path.lastIndexOf("/"));
    const fileName = f.path.slice(f.path.lastIndexOf("/") + 1);
    const { data: listed } = await db.storage.from(JOB_BUCKET).list(folder, { search: fileName });
    if (!listed?.some((o) => o.name === fileName)) {
      return Response.json({ error: `لم يكتمل رفع «${f.name}» — حاول مرة ثانية` }, { status: 400 });
    }
  }

  // إعادة فحص الصلاحية هنا تمنع استغلال التجربة بطلبات متزامنة
  const machine = getMachine(job.machine_slug);
  if (!machine) return Response.json({ error: "الماكينة غير متاحة" }, { status: 404 });
  const allowed = canRun(await getAccess(user, machine));
  if (!allowed.ok) return Response.json({ error: allowed.reason }, { status: 402 });

  const { error } = await db
    .from("jobs")
    .update({ status: "queued", queued_at: new Date().toISOString(), is_trial: allowed.isTrial })
    .eq("id", id)
    .eq("status", "draft");
  if (error) return Response.json({ error: "تعذّر إرسال الطلب" }, { status: 500 });
  return Response.json({ ok: true, status: "queued" });
}
