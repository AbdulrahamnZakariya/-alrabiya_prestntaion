import { getCurrentUser, isAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";

// المالك فقط: إعادة تشغيل طلب فشل، أو إلغاء طلب
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return Response.json({ error: "غير مصرح" }, { status: 403 });
  const { id } = await params;
  const { action } = (await req.json()) as { action: "retry" | "cancel" };
  const db = createAdminClient();

  if (action === "retry") {
    const { error } = await db
      .from("jobs")
      .update({ status: "queued", queued_at: new Date().toISOString(), error: null, attempts: 0 })
      .eq("id", id)
      .in("status", ["failed", "canceled"]);
    if (error) return Response.json({ error: "تعذّر" }, { status: 500 });
  } else if (action === "cancel") {
    await db.from("jobs").update({ status: "canceled" }).eq("id", id).in("status", ["draft", "queued"]);
  } else {
    return Response.json({ error: "إجراء غير معروف" }, { status: 400 });
  }
  return Response.json({ ok: true });
}
