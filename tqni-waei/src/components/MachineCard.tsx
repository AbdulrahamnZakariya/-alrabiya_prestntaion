import Link from "next/link";
import { teamSize, type Machine } from "@/lib/machines";

export function MachineCard({ machine, owned }: { machine: Machine; owned?: boolean }) {
  const soon = machine.status === "soon";
  const size = teamSize(machine);
  return (
    <Link
      href={`/machines/${machine.slug}`}
      className="card group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-accent"
    >
      <div className="flex items-start justify-between">
        <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-2xl text-accent">
          {machine.icon}
        </span>
        {owned ? (
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">مفعّلة لك</span>
        ) : soon ? (
          <span className="rounded-full bg-warn/15 px-3 py-1 text-xs font-bold text-warn">قريباً</span>
        ) : (
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-bold">{machine.priceUsd}$</span>
        )}
      </div>
      <h3 className="text-lg font-extrabold">{machine.name}</h3>
      <p className="text-sm text-muted">{machine.tagline}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 text-xs">
        {size > 0 && <span className="text-accent-2">👥 فريق من {size} خبراء</span>}
        {machine.runner === "worker" && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">يسلّمك ملفات{machine.eta ? ` · ${machine.eta}` : ""}</span>}
      </div>
    </Link>
  );
}
