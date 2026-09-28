import { getCurrentUser, isAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";

// المالك فقط: تأكيد الدفع (يفتح المكائن) أو رفضه مع السبب
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return Response.json({ error: "غير مصرح" }, { status: 403 });

  const { id } = await params;
  const { action, reason } = (await req.json()) as { action: "approve" | "reject"; reason?: string };
  const db = createAdminClient();

  const { data: order } = await db.from("orders").select("*").eq("id", id).single();
  if (!order) return Response.json({ error: "الطلب غير موجود" }, { status: 404 });
  if (order.status !== "pending") return Response.json({ error: "تمت مراجعة الطلب مسبقاً" }, { status: 409 });

  if (action === "approve") {
    const rows = (order.machine_slugs as string[]).map((slug) => ({
      user_id: order.user_id,
      machine_slug: slug,
      order_id: order.id,
    }));
    const { error } = await db.from("entitlements").upsert(rows, { onConflict: "user_id,machine_slug" });
    if (error) return Response.json({ error: "تعذّر فتح المكائن" }, { status: 500 });
    await db.from("orders").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", id);
  } else if (action === "reject") {
    await db
      .from("orders")
      .update({ status: "rejected", reject_reason: reason?.slice(0, 500) || null, reviewed_at: new Date().toISOString() })
      .eq("id", id);
  } else {
    return Response.json({ error: "إجراء غير معروف" }, { status: 400 });
  }
  return Response.json({ ok: true });
}
