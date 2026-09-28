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
  type: "text" | "textarea" | "select" | "color" | "file";
  default?: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  /** للملفات: الامتدادات المقبولة مثل ".pptx,.pdf,image/*" */
  accept?: string;
  /** للملفات: الحد الأقصى للحجم بالميغابايت */
  maxMB?: number;
  /** للملفات: السماح بأكثر من ملف */
  multiple?: boolean;
  hint?: string;
};

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export type Stage = {
  id: string;
  title: string;
  /** أسماء ملفات الوكلاء (بدون .md). أكثر من وكيل = يشتغلوا بالتوازي */
  agents: string[];
  effort?: Effort;
  /** يسمح لوكلاء المرحلة بالبحث في الإنترنت للتحقق من الأرقام والأخبار */
  webSearch?: boolean;
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
  /** شكل المخرج: markdown (افتراضي) أو carousel (سلايدات مصممة تُصدَّر PNG) */
  output?: "markdown" | "carousel";
  /**
   * أين تشتغل الماكينة:
   * text   → داخل الموقع (فريق وكلاء نصي — team)
   * worker → على سيرفر المعالجة (Claude Agent SDK + بلجنز) وتسلّم ملفات
   */
  runner?: "text" | "worker";
  /** فريق الماكينة للعرض في الصفحة (لمكائن السيرفر) */
  crew?: { title: string; role: string }[];
  worker?: {
    /** مجلدات البلجنز داخل worker/plugins التي تُحمَّل للطلب */
    plugins: string[];
    /** سقف تكلفة Claude للطلب المدفوع وللتجربة المجانية (دولار) */
    maxBudgetUsd: number;
    trialBudgetUsd: number;
    /** الحد الأقصى لمدة الطلب بالدقائق */
    timeoutMin: number;
  };
  /** الوقت المتوقع للتسليم (يُعرض للعميل) */
  eta?: string;
  /** عدد الاستخدامات المشمولة بكل شراء (الافتراضي في access.ts) */
  usesPerPurchase?: number;
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
  return { team: [], inputs: [], features: [], ...data, slug } as Machine;
}

/** عدد الموظفين (الوكلاء) في فريق الماكينة */
export function teamSize(machine: Machine): number {
  if (machine.runner === "worker") return machine.crew?.length ?? 0;
  return machine.team.reduce((n, s) => n + s.agents.length, 0);
}

export const isWorkerMachine = (m: Machine) => m.runner === "worker";

/** يقرأ مهارة الوكيل من ملفات الماكينة، وإن لم توجد فمن الوكلاء المشتركين */
export function readAgentSkillFromDisk(slug: string, agent: string): string | null {
  if (!/^[a-z0-9-]+$/.test(agent)) return null;
  const own = path.join(MACHINES_DIR, slug, "agents", `${agent}.md`);
  if (fs.existsSync(own)) return fs.readFileSync(own, "utf8");
  const shared = path.join(SHARED_AGENTS_DIR, `${agent}.md`);
  if (fs.existsSync(shared)) return fs.readFileSync(shared, "utf8");
  return null;
}

/** مخطط JSON لمخرج المرحلة الأخيرة (للمكائن التي مخرجها ليس نصاً) */
export function readOutputSchema(slug: string): Record<string, unknown> | null {
  const file = path.join(MACHINES_DIR, slug, "output.schema.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

/** أسماء كل الوكلاء المستخدمين في الماكينة (لواجهة رفع المهارات) */
export function machineAgents(machine: Machine): string[] {
  return [...new Set(machine.team.flatMap((s) => s.agents))];
}
