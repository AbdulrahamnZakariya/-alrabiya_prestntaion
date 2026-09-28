import { bundles } from "@/content/site";
import { BundleCards } from "@/components/BundleCards";

export const metadata = { title: "العروض — تقني واعي" };

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">العروض والباقات</h1>
      <p className="mt-2 text-muted">ادفع مرة واحدة وتنفتح الماكينة في حسابك بعد تأكيد الدفع.</p>
      <div className="mt-8"><BundleCards bundles={bundles} /></div>
      <div className="card mt-10 p-6 text-sm leading-8 text-muted">
        <h2 className="mb-2 text-lg font-bold text-text">طرق الدفع</h2>
        كليك CliQ والمحافظ الإلكترونية داخل الأردن (زين كاش، أورانج موني، يو والت…)، حوالة بنكية، أو PayPal.
        بعد التحويل ترفع صورة الإيصال، ونفعّل لك المكائن بعد التأكد من وصول المبلغ.
      </div>
    </section>
  );
}
