"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MachineInput } from "@/lib/machines";
import { createClient } from "@/lib/supabase/browser";

type Props = {
  machine: { slug: string; name: string; inputs: MachineInput[]; eta?: string };
  loggedIn: boolean;
  owned: boolean;
  blockedReason: string | null;
};

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(n > 10 * 1024 * 1024 ? 0 : 1)}MB`;

// نموذج طلب لماكينة سيرفر: حقول + ملفات تُرفع مباشرة للمخزن، ثم يدخل الطلب الطابور
export function JobForm({ machine, loggedIn, owned, blockedReason }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      machine.inputs
        .filter((i) => i.type !== "file")
        .map((i) => [i.name, i.default ?? (i.type === "select" ? i.options?.[0] ?? "" : "")]),
    ),
  );
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [stage, setStage] = useState<"idle" | "creating" | "uploading" | "submitting">("idle");
  const [uploaded, setUploaded] = useState(0);
  const [error, setError] = useState("");

  if (!loggedIn) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-2xl font-extrabold">جرّب {machine.name} مجاناً</h2>
        <p className="mt-2 text-muted">سجّل دخولك بإيميلك وخذ تجربة مجانية كاملة.</p>
        <Link href={`/login?next=/machines/${machine.slug}%23run`} className="btn btn-primary mt-5">سجّل دخول وجرّب</Link>
      </div>
    );
  }
  if (blockedReason) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-2xl font-extrabold">{owned ? "وصلت الحد الشهري" : "خلصت تجربتك المجانية"}</h2>
        <p className="mt-2 text-muted">{blockedReason}</p>
        {!owned && <Link href={`/checkout?machines=${machine.slug}`} className="btn btn-primary mt-5">اشترِ الماكينة</Link>}
      </div>
    );
  }

  const allFiles = Object.entries(files).flatMap(([field, list]) => list.map((file) => ({ field, file })));
  const busy = stage !== "idle";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    for (const f of machine.inputs.filter((i) => i.type === "file")) {
      const list = files[f.name] ?? [];
      if (f.required && !list.length) return setError(`ارفع: ${f.label}`);
      const big = list.find((x) => f.maxMB && x.size > f.maxMB * 1024 * 1024);
      if (big) return setError(`حجم «${big.name}» أكبر من ${f.maxMB}MB`);
    }

    try {
      setStage("creating");
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine: machine.slug,
          inputs: values,
          files: allFiles.map(({ field, file }) => ({ field, name: file.name, type: file.type, size: file.size })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "صار خطأ");

      setStage("uploading");
      const storage = createClient().storage.from("job-files");
      for (const [i, up] of (data.uploads as { path: string; token: string }[]).entries()) {
        const { file } = allFiles[i];
        const { error: upErr } = await storage.uploadToSignedUrl(up.path, up.token, file, {
          contentType: file.type || "application/octet-stream",
        });
        if (upErr) throw new Error(`تعذّر رفع «${file.name}»`);
        setUploaded(i + 1);
      }

      setStage("submitting");
      const sub = await fetch(`/api/jobs/${data.jobId}/submit`, { method: "POST" });
      const subData = await sub.json();
      if (!sub.ok) throw new Error(subData.error ?? "صار خطأ");
      router.push(`/jobs/${data.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "صار خطأ");
      setStage("idle");
    }
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-extrabold">اطلب من الماكينة</h2>
        {!owned && <span className="rounded-full bg-warn/15 px-3 py-1 text-xs font-bold text-warn">تجربة مجانية</span>}
      </div>
      {machine.eta && <p className="-mt-2 text-sm text-muted">⏱ مدة التنفيذ المتوقعة: {machine.eta}. تقدر تسكّر الصفحة، والملفات بتوصلك على حسابك.</p>}

      {machine.inputs.map((f) => (
        <label key={f.name} className="flex flex-col gap-2">
          <span className="font-semibold">
            {f.label}
            {f.required && <span className="text-danger"> *</span>}
          </span>
          {f.type === "textarea" ? (
            <textarea className="field min-h-32" placeholder={f.placeholder} required={f.required} value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
          ) : f.type === "select" ? (
            <select className="field" value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}>
              {f.options?.map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : f.type === "color" ? (
            <div className="flex items-center gap-3">
              <input type="color" className="h-11 w-16 cursor-pointer rounded-lg border border-border bg-surface-2" value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
              <span className="font-mono text-sm text-muted" dir="ltr">{values[f.name]}</span>
            </div>
          ) : f.type === "file" ? (
            <input
              type="file"
              accept={f.accept}
              multiple={f.multiple}
              className="field file:me-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1 file:font-bold file:text-bg"
              onChange={(e) => setFiles({ ...files, [f.name]: Array.from(e.target.files ?? []) })}
            />
          ) : (
            <input className="field" placeholder={f.placeholder} required={f.required} value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
          )}
          {(f.hint || f.maxMB) && (
            <span className="text-xs text-muted">
              {f.hint}
              {f.hint && f.maxMB ? " · " : ""}
              {f.maxMB ? `الحد ${f.maxMB}MB` : ""}
            </span>
          )}
        </label>
      ))}

      {error && <p className="text-danger">{error}</p>}
      <button className="btn btn-primary" disabled={busy}>
        {stage === "creating" && "جاري تجهيز الطلب…"}
        {stage === "uploading" && `جاري رفع الملفات ${uploaded}/${allFiles.length}…`}
        {stage === "submitting" && "جاري الإرسال للفريق…"}
        {stage === "idle" && "أرسل الطلب للفريق"}
      </button>
      {stage === "uploading" && allFiles.length > 0 && (
        <p className="text-xs text-muted">المجموع {mb(allFiles.reduce((n, x) => n + x.file.size, 0))} — لا تسكّر الصفحة حتى يخلص الرفع.</p>
      )}
    </form>
  );
}
