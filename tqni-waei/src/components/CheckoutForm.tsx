"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PaymentMethod } from "@/content/site";
import { quote } from "@/lib/pricing";

type M = { slug: string; name: string; icon: string; priceUsd: number; owned: boolean };

export function CheckoutForm({ machines, preselected, methods }: { machines: M[]; preselected: string[]; methods: PaymentMethod[] }) {
  const [selected, setSelected] = useState<string[]>(
    preselected.filter((s) => machines.some((m) => m.slug === s && !m.owned)),
  );
  const [method, setMethod] = useState<PaymentMethod["id"]>(methods[0].id);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const price = useMemo(
    () => quote(machines.filter((m) => selected.includes(m.slug)), machines.length),
    [selected, machines],
  );
  const current = methods.find((m) => m.id === method)!;

  function toggle(slug: string) {
    setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    form.set("machines", selected.join(","));
    form.set("method", method);
    const res = await fetch("/api/orders", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) setError(data.error ?? "صار خطأ");
    else setDone(true);
  }

  if (done) {
    return (
      <div className="card mt-8 p-8 text-center">
        <p className="text-4xl">✓</p>
        <h2 className="mt-2 text-2xl font-extrabold">وصلنا طلبك</h2>
        <p className="mt-2 text-muted">نراجع التحويل ونفعّل المكائن على حسابك بأسرع وقت. تقدر تتابع حالة الطلب من حسابك.</p>
        <Link href="/account" className="btn btn-primary mt-5">حسابي</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-6">
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-extrabold">1. اختر المكائن</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {machines.map((m) => (
            <label
              key={m.slug}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                selected.includes(m.slug) ? "border-accent bg-accent/10" : "border-border"
              } ${m.owned ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <input type="checkbox" disabled={m.owned} checked={selected.includes(m.slug)} onChange={() => toggle(m.slug)} className="accent-[var(--accent)]" />
              <span className="text-accent">{m.icon}</span>
              <span className="flex-1 font-semibold">{m.name}</span>
              <span className="text-sm text-muted">{m.owned ? "مفعّلة" : `${m.priceUsd}$`}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between rounded-xl bg-surface-2 p-4">
          <div className="text-sm text-muted">{price.breakdown.join(" + ") || "لم تختر شيئاً بعد"}</div>
          <div className="text-left">
            <div className="text-3xl font-extrabold">{price.totalUsd}$</div>
            <div className="text-sm text-muted">≈ {price.totalJod} دينار</div>
          </div>
        </div>
        {selected.length > 0 && selected.length % 3 !== 0 && selected.length < machines.length && (
          <p className="mt-2 text-sm text-accent">💡 أضف {3 - (selected.length % 3)} ماكينة واستفد من عرض الثلاث مكائن بـ 50$</p>
        )}
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-extrabold">2. اختر طريقة الدفع وحوّل المبلغ</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {methods.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`rounded-xl border p-3 text-start ${method === m.id ? "border-accent bg-accent/10" : "border-border"}`}
            >
              <span className="block font-bold">{m.title}</span>
              <span className="block text-xs text-muted">{m.subtitle}</span>
            </button>
          ))}
        </div>
        <dl className="mt-4 grid gap-2 rounded-xl bg-surface-2 p-4">
          {current.details.map((d) => (
            <div key={d.label} className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted">{d.label}</dt>
              <dd className="font-mono font-bold" dir="ltr">{d.value}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-2 border-t border-border pt-2">
            <dt className="text-muted">المبلغ</dt>
            <dd className="font-bold">{price.totalUsd}$ {method === "cliq" && `(${price.totalJod} دينار)`}</dd>
          </div>
        </dl>
        {current.note && <p className="mt-2 text-sm text-muted">{current.note}</p>}
      </div>

      <div className="card flex flex-col gap-4 p-6">
        <h2 className="text-lg font-extrabold">3. ارفع إيصال التحويل</h2>
        <label className="flex flex-col gap-2">
          <span className="font-semibold">اسم المحوّل</span>
          <input name="payerName" className="field" required />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-semibold">رقم الحركة / المرجع (اختياري)</span>
          <input name="reference" className="field" dir="ltr" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-semibold">صورة الإيصال (صورة أو PDF، حتى 5MB)</span>
          <input name="receipt" type="file" accept="image/*,application/pdf" required className="field file:me-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1 file:font-bold file:text-bg" />
        </label>
        {error && <p className="text-danger">{error}</p>}
        <button className="btn btn-primary" disabled={sending || selected.length === 0}>
          {sending ? "جاري الإرسال…" : "أرسل الطلب للتفعيل"}
        </button>
      </div>
    </form>
  );
}
