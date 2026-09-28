import { getCurrentUser, isAdmin } from "@/lib/access";
import { getMachine, machineAgents } from "@/lib/machines";
import { createAdminClient } from "@/lib/supabase/admin";

// المالك فقط: رفع/تحديث مهارة وكيل داخل ماكينة — تطبّق فوراً بدون إعادة نشر
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return Response.json({ error: "غير مصرح" }, { status: 403 });

  const { slug, agent, content } = (await req.json()) as { slug: string; agent: string; content: string };
  const machine = getMachine(slug);
  if (!machine || !machineAgents(machine).includes(agent)) {
    return Response.json({ error: "ماكينة أو وكيل غير معروف" }, { status: 400 });
  }
  const db = createAdminClient();
  if (!content?.trim()) {
    // محتوى فارغ = الرجوع لنسخة الملفات الأصلية
    await db.from("machine_skills").delete().eq("machine_slug", slug).eq("agent", agent);
    return Response.json({ ok: true, reverted: true });
  }
  const { error } = await db
    .from("machine_skills")
    .upsert({ machine_slug: slug, agent, content, updated_at: new Date().toISOString() });
  if (error) return Response.json({ error: "تعذّر الحفظ" }, { status: 500 });
  return Response.json({ ok: true });
}
