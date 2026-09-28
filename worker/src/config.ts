import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`متغير البيئة ناقص: ${name}`);
  return v;
}

export const config = {
  supabaseUrl: required("SUPABASE_URL"),
  supabaseKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  workerId: process.env.WORKER_ID || os.hostname(),
  model: process.env.CLAUDE_MODEL || "claude-opus-5",
  /** مجلد المكائن في مشروع الموقع (plugin.json + worker.md لكل ماكينة) */
  machinesDir: process.env.MACHINES_DIR || path.resolve(here, "../../tqni-waei/machines"),
  /** البلجنز المركّبة على السيرفر (لا تُرفع للريبو) */
  pluginsDir: process.env.PLUGINS_DIR || path.resolve(here, "../plugins"),
  workRoot: process.env.WORK_ROOT || path.join(os.tmpdir(), "tqni-jobs"),
  pollMs: Number(process.env.POLL_MS || 5000),
  /** أكبر حجم لملف ناتج يُرفع (MB) */
  maxOutputMB: Number(process.env.MAX_OUTPUT_MB || 500),
  keepWorkdirs: process.env.KEEP_WORKDIRS === "1",
};

export const BUCKET = "job-files";
