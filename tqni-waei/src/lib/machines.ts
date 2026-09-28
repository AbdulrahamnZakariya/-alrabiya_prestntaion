import "server-only";
import fs from "node:fs";
import path from "node:path";

// كل ماكينة = مجلد (Plugin) داخل /machines/<slug>/ فيه:
//   plugin.json   → بيانات الماكينة + تركيبة فريق العمل (المراحل والوكلاء)
//   agents/*.md   → مهارة (Skill) كل وكيل = تعليماته الكاملة
// الوكلاء المشتركين بين كل المكائن (المراجعين، ضابط الجودة…) في /machines/_shared/agents/

export type MachineInput = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
  required?: boolean;
};

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export type Stage = {
  id: string;
  title: string;
  /** أسماء ملفات الوكلاء (بدون .md). أكثر من وكيل = يشتغلوا بالتوازي */
  agents: string[];
  effort?: Effort;
};

export type Machine = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  priceUsd: number;
  status: "live" | "soon";
  order: number;
  inputs: MachineInput[];
  features: string[];
  team: Stage[];
};

const MACHINES_DIR = path.join(process.cwd(), "machines");
const SHARED_AGENTS_DIR = path.join(MACHINES_DIR, "_shared", "agents");

export function getMachines(): Machine[] {
  return fs
    .readdirSync(MACHINES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => readPlugin(d.name))
    .filter((m): m is Machine => m !== null)
    .sort((a, b) => a.order - b.order);
}

export function getMachine(slug: string): Machine | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return readPlugin(slug);
}

function readPlugin(slug: string): Machine | null {
  const file = path.join(MACHINES_DIR, slug, "plugin.json");
  if (!fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return { ...data, slug } as Machine;
}

/** عدد الموظفين (الوكلاء) في فريق الماكينة */
export function teamSize(machine: Machine): number {
  return machine.team.reduce((n, s) => n + s.agents.length, 0);
}

/** يقرأ مهارة الوكيل من ملفات الماكينة، وإن لم توجد فمن الوكلاء المشتركين */
export function readAgentSkillFromDisk(slug: string, agent: string): string | null {
  if (!/^[a-z0-9-]+$/.test(agent)) return null;
  const own = path.join(MACHINES_DIR, slug, "agents", `${agent}.md`);
  if (fs.existsSync(own)) return fs.readFileSync(own, "utf8");
  const shared = path.join(SHARED_AGENTS_DIR, `${agent}.md`);
  if (fs.existsSync(shared)) return fs.readFileSync(shared, "utf8");
  return null;
}

/** أسماء كل الوكلاء المستخدمين في الماكينة (لواجهة رفع المهارات) */
export function machineAgents(machine: Machine): string[] {
  return [...new Set(machine.team.flatMap((s) => s.agents))];
}
