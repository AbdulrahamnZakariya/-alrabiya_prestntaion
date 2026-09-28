"use client";

import Link from "next/link";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MachineInput } from "@/lib/machines";

type Props = {
  machine: { slug: string; name: string; inputs: MachineInput[] };
  loggedIn: boolean;
  owned: boolean;
  trialsLeft: number;
};

type Progress = { index: number; total: number; title: string; agents: number };

export function MachineRunner({ machine, loggedIn, owned, trialsLeft }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(machine.inputs.map((i) => [i.name, i.type === "select" ? i.options?.[0] ?? "" : ""])),
  );
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [trials, setTrials] = useState(trialsLeft);
  const [copied, setCopied] = useState(false);

  if (!loggedIn) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-2xl font-extrabold">جرّب {machine.name} مجاناً</h2>
        <p className="mt-2 text-muted">سجّل دخولك بإيميلك وخذ تجربة مجانية كاملة.</p>
        <Link href={`/login?next=/machines/${machine.slug}%23run`} className="btn btn-primary mt-5">سجّل دخول وجرّب</Link>
      </div>
    );
  }
  if (!owned && trials <= 0 && !output) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-2xl font-extrabold">خلصت تجربتك المجانية</h2>
        <p className="mt-2 text-muted">اشترِ الماكينة لتستخدمها بدون توقف.</p>
        <Link href={`/checkout?machines=${machine.slug}`} className="btn btn-primary mt-5">اشترِ الماكينة</Link>
      </div>
    );
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setRunning(true);
    setError("");
    setOutput("");
    setProgress(null);
    try {
      const res = await fetch(`/api/run/${machine.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: values }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "صار خطأ");
      }
      if (!owned) setTrials((t) => t - 1);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.type === "stage") setProgress(ev);
          else if (ev.type === "final") setOutput(ev.output);
          else if (ev.type === "error") {
            setError(ev.message);
            if (!owned) setTrials((t) => t + 1);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "صار خطأ");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={run} className="card flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">شغّل الماكينة</h2>
          {!owned && <span className="rounded-full bg-warn/15 px-3 py-1 text-xs font-bold text-warn">تجربة مجانية</span>}
        </div>
        {machine.inputs.map((f) => (
          <label key={f.name} className="flex flex-col gap-2">
            <span className="font-semibold">{f.label}{f.required && <span className="text-danger"> *</span>}</span>
            {f.type === "textarea" ? (
              <textarea
                className="field min-h-32"
                placeholder={f.placeholder}
                required={f.required}
                value={values[f.name]}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              />
            ) : f.type === "select" ? (
              <select
                className="field"
                value={values[f.name]}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              >
                {f.options?.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input
                className="field"
                placeholder={f.placeholder}
                required={f.required}
                value={values[f.name]}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              />
            )}
          </label>
        ))}
        <button className="btn btn-primary" disabled={running}>
          {running ? "الفريق يشتغل…" : "ابدأ"}
        </button>
      </form>

      {running && progress && (
        <div className="card p-6" aria-live="polite">
          <div className="mb-3 flex justify-between text-sm">
            <span className="font-bold">{progress.title}</span>
            <span className="text-muted">المرحلة {progress.index + 1} من {progress.total}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-l from-accent to-accent-2 transition-all duration-700"
              style={{ width: `${((progress.index + 0.5) / progress.total) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-muted">
            {progress.agents > 1 ? `${progress.agents} خبراء يشتغلوا بالتوازي…` : "خبير يشتغل على طلبك…"} الجودة تحتاج وقت — عادة بين دقيقة و4 دقائق.
          </p>
        </div>
      )}

      {error && <div className="card border-danger p-4 text-danger">{error}</div>}

      {output && (
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-extrabold">النتيجة</h2>
            <button
              className="btn btn-ghost !py-1.5 text-sm"
              onClick={() => {
                navigator.clipboard.writeText(output);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "تم النسخ ✓" : "نسخ"}
            </button>
          </div>
          <div className="prose-out">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
          </div>
          {!owned && (
            <div className="mt-6 rounded-xl bg-surface-2 p-4 text-center">
              <p className="font-bold">عجبتك النتيجة؟</p>
              <Link href={`/checkout?machines=${machine.slug}`} className="btn btn-primary mt-3">اشترِ الماكينة</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
