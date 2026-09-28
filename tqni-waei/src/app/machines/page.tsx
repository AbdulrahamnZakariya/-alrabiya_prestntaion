import { getMachines } from "@/lib/machines";
import { getCurrentUser, getOwnedSlugs } from "@/lib/access";
import { MachineCard } from "@/components/MachineCard";

export const metadata = { title: "المكائن — تقني واعي" };

export default async function MachinesPage() {
  const machines = getMachines();
  const user = await getCurrentUser();
  const owned = new Set(user ? await getOwnedSlugs(user) : []);
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">المكائن</h1>
      <p className="mt-2 text-muted">كل ماكينة لها فريقها الخاص من الخبراء. جرّب أي ماكينة مرة مجاناً.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {machines.map((m) => <MachineCard key={m.slug} machine={m} owned={owned.has(m.slug)} />)}
      </div>
    </section>
  );
}
