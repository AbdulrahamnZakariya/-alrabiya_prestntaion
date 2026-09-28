import Link from "next/link";
import { getMachines } from "@/lib/machines";
import { getCurrentUser, getOwnedSlugs } from "@/lib/access";
import { paymentMethods } from "@/content/site";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata = { title: "الشراء — تقني واعي" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ machines?: string }> }) {
  const { machines: pre } = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="card p-8">
          <h1 className="text-2xl font-extrabold">سجّل دخولك أولاً</h1>
          <p className="mt-2 text-muted">حتى نفعّل المكائن على حسابك بعد الدفع.</p>
          <Link href={`/login?next=${encodeURIComponent(`/checkout${pre ? `?machines=${pre}` : ""}`)}`} className="btn btn-primary mt-5">تسجيل الدخول</Link>
        </div>
      </section>
    );
  }
  const owned = new Set(await getOwnedSlugs(user));
  const live = getMachines()
    .filter((m) => m.status === "live")
    .map((m) => ({ slug: m.slug, name: m.name, icon: m.icon, priceUsd: m.priceUsd, owned: owned.has(m.slug) }));

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">شراء المكائن</h1>
      <p className="mt-2 text-muted">اختر المكائن، حوّل المبلغ، وارفع الإيصال. نفعّلها لك بعد تأكيد الدفع.</p>
      <CheckoutForm machines={live} preselected={(pre ?? "").split(",").filter(Boolean)} methods={paymentMethods} />
    </section>
  );
}
