"use client";

import { useState } from "react";

type AgentSkill = { agent: string; content: string; overridden: boolean };
type MachineSkills = { slug: string; name: string; agents: AgentSkill[] };

export function SkillsManager({ machines }: { machines: MachineSkills[] }) {
  const [slug, setSlug] = useState(machines[0]?.slug ?? "");
  const machine = machines.find((m) => m.slug === slug);
  const [agent, setAgent] = useState(machine?.agents[0]?.agent ?? "");
  const current = machine?.agents.find((a) => a.agent === agent);
  const [content, setContent] = useState(current?.content ?? "");
  const [status, setStatus] = useState("");

  function pick(nextSlug: string, nextAgent?: string) {
    const m = machines.find((x) => x.slug === nextSlug);
    const a = m?.agents.find((x) => x.agent === nextAgent) ?? m?.agents[0];
    setSlug(nextSlug);
    setAgent(a?.agent ?? "");
    setContent(a?.content ?? "");
    setStatus("");
  }

  async function save(body: string) {
    setStatus("جاري الحفظ…");
    const res = await fetch("/api/admin/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, agent, content: body }),
    });
    const data = await res.json().catch(() => ({}));
    setStatus(res.ok ? (data.reverted ? "تم الرجوع للنسخة الأصلية — حدّث الصفحة لرؤيتها" : "تم الحفظ ✓ — التحديث فعّال الآن") : data.error ?? "صار خطأ");
  }

  if (!machine) return null;
  return (
    <div className="card flex flex-col gap-4 p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <select className="field" value={slug} onChange={(e) => pick(e.target.value)}>
          {machines.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
        </select>
        <select className="field" value={agent} onChange={(e) => pick(slug, e.target.value)}>
          {machine.agents.map((a) => (
            <option key={a.agent} value={a.agent}>{a.agent}{a.overridden ? " (معدّلة)" : ""}</option>
          ))}
        </select>
      </div>
      <label className="btn btn-ghost w-fit cursor-pointer text-sm">
        رفع ملف .md
        <input
          type="file"
          accept=".md,.txt,text/markdown,text/plain"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setContent(await f.text());
          }}
        />
      </label>
      <textarea dir="auto" className="field min-h-80 font-mono text-sm" value={content} onChange={(e) => setContent(e.target.value)} />
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" onClick={() => save(content)}>حفظ وتفعيل</button>
        {current?.overridden && (
          <button className="btn btn-ghost" onClick={() => save("")}>الرجوع للنسخة الأصلية</button>
        )}
        <span className="text-sm text-muted">{status}</span>
      </div>
    </div>
  );
}
