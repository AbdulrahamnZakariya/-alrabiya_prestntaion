import { courses } from "@/content/site";

export const metadata = { title: "الدورات — تقني واعي" };

export default function CoursesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">الدورات</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {courses.map((c) => (
          <div key={c.title} className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-extrabold">{c.title}</h2>
              {c.status === "soon" && <span className="shrink-0 rounded-full bg-warn/15 px-3 py-1 text-xs font-bold text-warn">قريباً</span>}
            </div>
            <p className="mt-2 text-muted">{c.description}</p>
            {c.priceUsd && <p className="mt-4 text-2xl font-extrabold">{c.priceUsd}$</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
