"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrderActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  async function act(action: "approve" | "reject") {
    if (action === "approve" && !confirm("متأكد إن المبلغ وصلك؟ سيتم فتح المكائن للعميل.")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    setBusy(false);
    if (!res.ok) alert((await res.json().catch(() => ({}))).error ?? "صار خطأ");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className="btn btn-primary !py-2" disabled={busy} onClick={() => act("approve")}>✓ تأكيد الدفع وفتح المكائن</button>
      {rejecting ? (
        <>
          <input className="field max-w-xs !py-2" placeholder="سبب الرفض (يظهر للعميل)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className="btn btn-ghost !py-2 text-danger" disabled={busy} onClick={() => act("reject")}>رفض</button>
        </>
      ) : (
        <button className="btn btn-ghost !py-2" onClick={() => setRejecting(true)}>رفض</button>
      )}
    </div>
  );
}
