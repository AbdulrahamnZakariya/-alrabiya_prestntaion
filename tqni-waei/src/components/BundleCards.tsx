import Link from "next/link";
import { USD_TO_JOD, type Bundle } from "@/content/site";

export function BundleCards({ bundles }: { bundles: Bundle[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {bundles.map((b) => (
        <div
          key={b.id}
          className={`card flex flex-col gap-3 p-6 ${b.highlight ? "border-accent ring-1 ring-accent" : ""}`}
        >
          {b.highlight && <span className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-bold text-bg">الأكثر طلباً</span>}
          <h3 className="text-xl font-extrabold">{b.title}</h3>
          <p className="text-sm text-muted">{b.description}</p>
          <p className="mt-2">
            <span className="text-4xl font-extrabold">{b.priceUsd}$</span>
            <span className="ms-2 text-sm text-muted">≈ {Math.round(b.priceUsd * USD_TO_JOD)} دينار</span>
          </p>
          <Link href="/checkout" className="btn btn-primary mt-auto">اشترِ الآن</Link>
        </div>
      ))}
    </div>
  );
}
