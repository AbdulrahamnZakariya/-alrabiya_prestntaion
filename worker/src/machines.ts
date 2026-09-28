import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";

export type MachineInput = { name: string; label: string; type: string; options?: string[] };

export type WorkerMachine = {
  slug: string;
  name: string;
  inputs: MachineInput[];
  worker: { plugins: string[]; maxBudgetUsd: number; trialBudgetUsd: number; timeoutMin: number };
  /** قالب مهمة الفريق من machines/<slug>/worker.md */
  prompt: string;
};

// يقرأ تعريف الماكينة من نفس ملفات الموقع — مصدر واحد للحقيقة
export function loadMachine(slug: string): WorkerMachine {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`اسم ماكينة غير صالح: ${slug}`);
  const dir = path.join(config.machinesDir, slug);
  const plugin = JSON.parse(fs.readFileSync(path.join(dir, "plugin.json"), "utf8"));
  if (plugin.runner !== "worker" || !plugin.worker) throw new Error(`الماكينة ${slug} ليست ماكينة سيرفر`);
  return {
    slug,
    name: plugin.name,
    inputs: plugin.inputs ?? [],
    worker: plugin.worker,
    prompt: fs.readFileSync(path.join(dir, "worker.md"), "utf8"),
  };
}

export function pluginPaths(machine: WorkerMachine): string[] {
  return machine.worker.plugins.map((name) => {
    const p = path.join(config.pluginsDir, name);
    if (!fs.existsSync(path.join(p, ".claude-plugin", "plugin.json"))) {
      throw new Error(`البلجن «${name}» غير مركّب على السيرفر (${p}) — راجع worker/README.md`);
    }
    return p;
  });
}
