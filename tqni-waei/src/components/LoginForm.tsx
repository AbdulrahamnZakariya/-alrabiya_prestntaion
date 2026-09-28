"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const redirect = new URL("/auth/callback", window.location.origin);
    if (next) redirect.searchParams.set("next", next);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirect.toString() },
    });
    setState(error ? "error" : "sent");
  }

  if (state === "sent") {
    return <p className="mt-6 rounded-xl bg-accent/10 p-4 text-accent">أرسلنا رابط الدخول إلى {email} — افتح بريدك واضغط عليه.</p>;
  }
  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
      <input
        type="email"
        required
        dir="ltr"
        className="field"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="btn btn-primary" disabled={state === "sending"}>
        {state === "sending" ? "جاري الإرسال…" : "أرسل رابط الدخول"}
      </button>
      {state === "error" && <p className="text-sm text-danger">تعذّر الإرسال، تأكد من الإيميل وحاول مرة ثانية.</p>}
    </form>
  );
}
