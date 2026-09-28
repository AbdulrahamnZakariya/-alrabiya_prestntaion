import { getCurrentUser, isAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { signedOutputs, type Job } from "@/lib/jobs";

// حالة الطلب + روابط تنزيل الملفات (لصاحب الطلب أو المالك)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "سجّل دخولك أولاً" }, { status: 401 });
  const { id } = await params;

  const db = createAdminClient();
  const { data } = await db.from("jobs").select("*").eq("id", id).maybeSingle();
  const job = data as Job | null;
  if (!job || (job.user_id !== user.id && !isAdmin(user))) {
    return Response.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  let position: number | null = null;
  if (job.status === "queued" && job.queued_at) {
    const { count } = await db
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "queued")
      .lt("queued_at", job.queued_at);
    position = (count ?? 0) + 1;
  }

  return Response.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    // تفاصيل الخطأ التقنية للمالك فقط
    error: isAdmin(user) ? job.error : null,
    position,
    started_at: job.started_at,
    finished_at: job.finished_at,
    files: job.status === "done" ? await signedOutputs(job) : [],
  });
}
