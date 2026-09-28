import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getOwnedSlugs } from "@/lib/access";
import { getMachines } from "@/lib/machines";
import { createClient } from "@/lib/supabase/server";
import { MachineCard } from "@/components/MachineCard";

export const metadata = { title: "حسابي — تقني واعي" };

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "بانتظار التأكيد", cls: "bg-warn/15 text-warn" },
  approved: { label: "مفعّل", cls: "bg-accent/15 text-accent" },
  rejected: { label: "مرفوض", cls: "bg-danger/15 text-danger" },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const owned = new Set(await getOwnedSlugs(user));
  const machines = getMachines();
  const names = new Map(machines.map((m) => [m.slug, m.name]));
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, machine_slugs, amount_usd, status, reject_reason, created_at")
    .order("created_at", { ascending: false });

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">حسابي</h1>
          <p className="mt-1 text-muted" dir="ltr">{user.email}</p>
        </div>
        <form action="/auth/signout" method="post"><button className="btn btn-ghost">تسجيل خروج</button></form>
      </div>

      <h2 className="mb-4 mt-10 text-xl font-extrabold">مكائني</h2>
      {owned.size ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {machines.filter((m) => owned.has(m.slug)).map((m) => <MachineCard key={m.slug} machine={m} owned />)}
        </div>
      ) : (
        <div className="card p-6 text-muted">
          ما عندك مكائن مفعّلة بعد. <Link href="/machines" className="text-accent">تصفّح المكائن</Link>
        </div>
      )}

      <h2 className="mb-4 mt-10 text-xl font-extrabold">طلباتي</h2>
      {orders?.length ? (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <div key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-bold">{(o.machine_slugs as string[]).map((s) => names.get(s) ?? s).join("، ")}</p>
                <p className="text-sm text-muted">{new Date(o.created_at).toLocaleDateString("ar-JO")} · {o.amount_usd}$</p>
                {o.status === "rejected" && o.reject_reason && <p className="mt-1 text-sm text-danger">السبب: {o.reject_reason}</p>}
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${STATUS[o.status].cls}`}>{STATUS[o.status].label}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted">لا توجد طلبات.</p>
      )}
    </section>
  );
}
