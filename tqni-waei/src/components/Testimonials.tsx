import { testimonials } from "@/content/site";
import { getMachines } from "@/lib/machines";

export function Testimonials({ machineSlug }: { machineSlug?: string }) {
  const names = new Map(getMachines().map((m) => [m.slug, m.name]));
  const list = machineSlug
    ? testimonials.filter((t) => t.machines.includes(machineSlug))
    : testimonials;
  if (!list.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="mb-6 text-2xl font-extrabold">جرّبوا المكائن</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <figure key={t.name} className="card flex flex-col gap-3 p-5">
            {t.quote && <blockquote className="leading-8">«{t.quote}»</blockquote>}
            <figcaption className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 font-extrabold text-bg">
                {t.name.replace(/^د\.\s*/, "").charAt(0)}
              </span>
              <span>
                <span className="block font-bold">{t.name}</span>
                <span className="block text-sm text-muted">{t.role}</span>
              </span>
            </figcaption>
            {t.machines.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {t.machines.map((s) => (
                  <span key={s} className="rounded-full bg-surface-2 px-3 py-1 text-xs text-muted">
                    استخدم: {names.get(s) ?? s}
                  </span>
                ))}
              </div>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
