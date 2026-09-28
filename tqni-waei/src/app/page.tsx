import Link from "next/link";
import { brand, bundles } from "@/content/site";
import { getMachines } from "@/lib/machines";
import { MachineCard } from "@/components/MachineCard";
import { Testimonials } from "@/components/Testimonials";
import { BundleCards } from "@/components/BundleCards";

export default function Home() {
  const machines = getMachines();
  const steps = [
    { t: "اختر الماكينة", d: "كل ماكينة متخصصة بمهمة واحدة وتتقنها." },
    { t: "جرّبها مجاناً", d: "تجربة مجانية واحدة لكل ماكينة لتشوف الجودة بنفسك." },
    { t: "ادفع وارفع الإيصال", d: "كليك، محافظ، حوالة بنكية أو PayPal." },
    { t: "نفعّلها لك", d: "بعد تأكيد الدفع تنفتح الماكينة في حسابك." },
  ];
  return (
    <>
      <section className="glow">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:pt-28">
          <p className="mb-4 inline-block rounded-full border border-border px-4 py-1 text-sm text-muted">
            {brand.name} · مكائن ذكاء اصطناعي عربية
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl">
            داخل كل ماكينة <span className="text-gradient">فريق خبراء</span> يشتغل عنك
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            محلل، منتج، لجنة مراجعة، محرر، وضابط جودة — يشتغلوا على طلبك مرحلة بمرحلة حتى يطلع
            شغل ينصدم منه صاحبه.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/machines" className="btn btn-primary">شوف المكائن</Link>
            <Link href="/pricing" className="btn btn-ghost">العروض والباقات</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold">المكائن</h2>
          <Link href="/machines" className="text-sm text-accent">كل المكائن ←</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {machines.map((m) => <MachineCard key={m.slug} machine={m} />)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-extrabold">كيف تشتغل؟</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.t} className="card p-5">
              <span className="text-3xl font-extrabold text-accent">{i + 1}</span>
              <h3 className="mt-2 font-bold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-extrabold">العروض</h2>
        <BundleCards bundles={bundles} />
      </section>

      <Testimonials />
    </>
  );
}
