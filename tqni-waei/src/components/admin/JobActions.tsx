"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function JobActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const act = async (action: "retry" | "cancel") => {
    setBusy(true);
    await fetch(`/api/admin/jobs/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    router.refresh();
  };
  if (status === "failed" || status === "canceled") {
    return <button className="btn btn-ghost !px-3 !py-1 text-xs" disabled={busy} onClick={() => act("retry")}>إعادة تشغيل</button>;
  }
  if (status === "queued") {
    return <button className="btn btn-ghost !px-3 !py-1 text-xs text-danger" disabled={busy} onClick={() => act("cancel")}>إلغاء</button>;
  }
  return null;
}
