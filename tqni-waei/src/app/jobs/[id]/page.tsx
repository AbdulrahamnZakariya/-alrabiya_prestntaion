import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/access";
import { getMachine } from "@/lib/machines";
import { createAdminClient } from "@/lib/supabase/admin";
import { signedOutputs, type Job } from "@/lib/jobs";
import { JobStatus } from "@/components/JobStatus";

export const metadata = { title: "طلبي — تقني واعي" };

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/jobs/${id}`);

  const { data } = await createAdminClient().from("jobs").select("*").eq("id", id).maybeSingle();
  const job = data as Job | null;
  if (!job || (job.user_id !== user.id && !isAdmin(user))) notFound();
  const machine = getMachine(job.machine_slug);

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/account" className="text-sm text-accent">← حسابي</Link>
      <h1 className="mt-2 text-3xl font-extrabold">{machine?.name ?? job.machine_slug}</h1>
      <p className="mt-1 text-sm text-muted">طلب بتاريخ {new Date(job.created_at).toLocaleString("ar-JO")}</p>
      <div className="mt-6">
        <JobStatus
          id={job.id}
          initial={{
            status: job.status,
            progress: job.progress,
            error: isAdmin(user) ? job.error : null,
            position: null,
            files: job.status === "done" ? await signedOutputs(job) : [],
          }}
        />
      </div>
      {machine?.crew && (
        <div className="card mt-6 p-6">
          <h2 className="mb-3 font-extrabold">الفريق اللي شغّال على طلبك</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {machine.crew.map((c) => (
              <li key={c.title} className="text-sm"><b>{c.title}</b> <span className="text-muted">— {c.role}</span></li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
