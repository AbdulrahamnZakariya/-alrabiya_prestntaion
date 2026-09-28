"use client";

import { useEffect, useState } from "react";

type State = {
  status: "draft" | "queued" | "running" | "done" | "failed" | "canceled";
  progress: string | null;
  error: string | null;
  position: number | null;
  files: { name: string; size: number; url: string | null }[];
};

const LABEL: Record<State["status"], string> = {
  draft: "بانتظار رفع الملفات",
  queued: "طلبك في الطابور",
  running: "الفريق يشتغل على طلبك",
  done: "ملفاتك جاهزة",
  failed: "تعذّر التنفيذ",
  canceled: "الطلب ملغي",
};

const size = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`);

export function JobStatus({ id, initial }: { id: string; initial: State }) {
  const [s, setS] = useState<State>(initial);
  const active = s.status === "queued" || s.status === "running" || s.status === "draft";

  useEffect(() => {
    if (!active) return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
      if (res.ok) setS(await res.json());
    }, 5000);
    return () => clearInterval(t);
  }, [id, active]);

  return (
    <div className="card flex flex-col gap-5 p-6" aria-live="polite">
      <div className="flex items-center gap-3">
        {active && <span className="size-3 animate-pulse rounded-full bg-accent" />}
        <h2 className="text-2xl font-extrabold">{LABEL[s.status]}</h2>
      </div>

      {s.status === "queued" && (
        <p className="text-muted">
          {s.position && s.position > 1 ? `قبلك ${s.position - 1} طلب — ` : ""}بيبدأ الفريق عليه خلال دقائق.
        </p>
      )}
      {s.status === "running" && (
        <div className="rounded-xl bg-surface-2 p-4">
          <p className="mb-2 text-sm text-muted">آخر تحديث من الفريق:</p>
          <p className="whitespace-pre-line leading-8">{s.progress || "بدأ العمل…"}</p>
        </div>
      )}
      {active && <p className="text-sm text-muted">تقدر تسكّر الصفحة — الطلب محفوظ في «حسابي» والملفات بتظهر فيه لما تجهز.</p>}

      {s.status === "failed" && (
        <p className="text-danger">{s.error || "صار خطأ أثناء التنفيذ."} راسلنا وبنعيد تشغيله لك — الطلب ما انحسب من رصيدك ولا من تجربتك المجانية.</p>
      )}

      {s.status === "done" && (
        <ul className="flex flex-col gap-2">
          {s.files.map((f) => (
            <li key={f.name} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <span className="font-semibold" dir="auto">{f.name}</span>
              <span className="flex items-center gap-3">
                <span className="text-xs text-muted">{size(f.size)}</span>
                {f.url && <a href={f.url} className="btn btn-primary !px-4 !py-1.5 text-sm">تنزيل</a>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
