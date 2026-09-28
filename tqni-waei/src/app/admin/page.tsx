import { notFound } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/access";
import { getMachines, machineAgents, readAgentSkillFromDisk } from "@/lib/machines";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrderActions } from "@/components/admin/OrderActions";
import { SkillsManager } from "@/components/admin/SkillsManager";

export const metadata = { title: "لوحة التحكم — تقني واعي" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!isAdmin(user)) notFound();

  const db = createAdminClient();
  const machines = getMachines();
  const names = new Map(machines.map((m) => [m.slug, m.name]));

  const [{ data: orders }, { data: overrides }, { count: runsCount }] = await Promise.all([
    db.from("orders").select("*").order("status", { ascending: false }).order("created_at", { ascending: false }).limit(100),
    db.from("machine_skills").select("machine_slug, agent, content, updated_at"),
    db.from("runs").select("id", { count: "exact", head: true }),
  ]);

  const pending = (orders ?? []).filter((o) => o.status === "pending");
  const reviewed = (orders ?? []).filter((o) => o.status !== "pending");
  const revenue = (orders ?? []).filter((o) => o.status === "approved").reduce((s, o) => s + Number(o.amount_usd), 0);

  const receiptUrls = new Map<string, string>();
  await Promise.all(
    pending.filter((o) => o.receipt_path).map(async (o) => {
      const { data } = await db.storage.from("receipts").createSignedUrl(o.receipt_path, 60 * 30);
      if (data) receiptUrls.set(o.id, data.signedUrl);
    }),
  );

  const skills = machines
    .filter((m) => m.team.length)
    .map((m) => ({
      slug: m.slug,
      name: m.name,
      agents: machineAgents(m).map((agent) => {
        const o = overrides?.find((x) => x.machine_slug === m.slug && x.agent === agent);
        return {
          agent,
          content: o?.content ?? readAgentSkillFromDisk(m.slug, agent) ?? "",
          overridden: Boolean(o),
        };
      }),
    }));

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">لوحة التحكم</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="طلبات بانتظارك" value={pending.length} highlight={pending.length > 0} />
        <Stat label="إيرادات مؤكدة" value={`${revenue}$`} />
        <Stat label="مرات تشغيل المكائن" value={runsCount ?? 0} />
      </div>

      <h2 className="mb-4 mt-10 text-xl font-extrabold">طلبات بانتظار التأكيد</h2>
      {pending.length === 0 && <p className="text-muted">لا توجد طلبات جديدة.</p>}
      <div className="flex flex-col gap-3">
        {pending.map((o) => (
          <div key={o.id} className="card flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold" dir="ltr">{o.user_email}</p>
                <p className="text-sm text-muted">
                  {(o.machine_slugs as string[]).map((s) => names.get(s) ?? s).join("، ")}
                </p>
                <p className="mt-1 text-sm">
                  <b>{o.amount_usd}$</b> · {o.payment_method} · المحوّل: {o.payer_name || "—"} · المرجع: <span dir="ltr">{o.reference || "—"}</span>
                </p>
                <p className="text-xs text-muted">{new Date(o.created_at).toLocaleString("ar-JO")}</p>
              </div>
              {receiptUrls.get(o.id) && (
                <a href={receiptUrls.get(o.id)} target="_blank" rel="noreferrer" className="btn btn-ghost !py-1.5 text-sm">عرض الإيصال</a>
              )}
            </div>
            <OrderActions id={o.id} />
          </div>
        ))}
      </div>

      <h2 className="mb-4 mt-10 text-xl font-extrabold">آخر الطلبات المراجعة</h2>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-muted">
            <tr><th className="p-3 text-start">العميل</th><th className="p-3 text-start">المكائن</th><th className="p-3 text-start">المبلغ</th><th className="p-3 text-start">الحالة</th></tr>
          </thead>
          <tbody>
            {reviewed.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="p-3" dir="ltr">{o.user_email}</td>
                <td className="p-3">{(o.machine_slugs as string[]).map((s) => names.get(s) ?? s).join("، ")}</td>
                <td className="p-3">{o.amount_usd}$</td>
                <td className={`p-3 font-bold ${o.status === "approved" ? "text-accent" : "text-danger"}`}>{o.status === "approved" ? "مفعّل" : "مرفوض"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 mt-12 text-xl font-extrabold">مهارات فرق المكائن</h2>
      <p className="mb-4 text-sm text-muted">ارفع ملف SKILL (.md) أو عدّله هنا — التحديث يطبّق فوراً على الماكينة بدون إعادة نشر الموقع.</p>
      <SkillsManager machines={skills} />
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`card p-5 ${highlight ? "border-warn" : ""}`}>
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold ${highlight ? "text-warn" : ""}`}>{value}</p>
    </div>
  );
}
