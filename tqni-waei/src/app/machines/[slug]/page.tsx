import Link from "next/link";
import { notFound } from "next/navigation";
import { getMachine, teamSize } from "@/lib/machines";
import { getAccess, getCurrentUser } from "@/lib/access";
import { MachineRunner } from "@/components/MachineRunner";
import { Testimonials } from "@/components/Testimonials";

export default async function MachinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const machine = getMachine(slug);
  if (!machine) notFound();

  const user = await getCurrentUser();
  const access = await getAccess(user, slug);
  const live = machine.status === "live";

  return (
    <>
      <section className="glow">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-3xl text-accent">{machine.icon}</span>
            <h1 className="mt-4 text-4xl font-extrabold">{machine.name}</h1>
            <p className="mt-2 text-xl text-accent">{machine.tagline}</p>
            <p className="mt-4 leading-8 text-muted">{machine.description}</p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {machine.features.map((f) => (
                <li key={f} className="flex gap-2"><span className="text-accent">✓</span>{f}</li>
              ))}
            </ul>
          </div>

          <aside className="card h-fit p-6">
            {live ? (
              <>
                <p className="text-sm text-muted">سعر الماكينة</p>
                <p className="text-4xl font-extrabold">{machine.priceUsd}$</p>
                <p className="mt-1 text-sm text-muted">أو ضمن باقة الثلاث مكائن بـ 50$</p>
                <div className="mt-5 flex flex-col gap-2">
                  {access.owned ? (
                    <a href="#run" className="btn btn-primary">شغّل الماكينة</a>
                  ) : (
                    <>
                      <Link href={`/checkout?machines=${machine.slug}`} className="btn btn-primary">اشترِ الماكينة</Link>
                      {access.trialsLeft > 0 && <a href="#run" className="btn btn-ghost">جرّبها مجاناً</a>}
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-2xl font-extrabold text-warn">قريباً</p>
                <p className="mt-2 text-sm text-muted">الماكينة في مرحلة التجهيز النهائي.</p>
              </>
            )}
          </aside>
        </div>
      </section>

      {machine.team.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-2xl font-extrabold">فريق العمل داخل الماكينة</h2>
          <p className="mt-1 text-muted">{teamSize(machine)} خبراء يشتغلوا على طلبك على {machine.team.length} مراحل</p>
          <ol className="mt-6 grid gap-3 md:grid-cols-5">
            {machine.team.map((s, i) => (
              <li key={s.id} className="card p-4">
                <span className="text-xs text-muted">المرحلة {i + 1}</span>
                <h3 className="mt-1 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-accent-2">{s.agents.length > 1 ? `${s.agents.length} خبراء بالتوازي` : "خبير واحد"}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {live && (
        <section id="run" className="mx-auto max-w-4xl scroll-mt-20 px-4 py-10">
          <MachineRunner
            machine={{ slug: machine.slug, name: machine.name, inputs: machine.inputs, output: machine.output }}
            loggedIn={Boolean(user)}
            owned={access.owned}
            trialsLeft={access.trialsLeft}
          />
        </section>
      )}

      <Testimonials machineSlug={machine.slug} />
    </>
  );
}
