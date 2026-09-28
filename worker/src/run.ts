import fs from "node:fs";
import path from "node:path";
import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BUCKET, config } from "./config.js";
import { loadMachine, pluginPaths } from "./machines.js";
import { buildPrompt, WORKER_RULES } from "./prompt.js";

export type Job = {
  id: string;
  machine_slug: string;
  is_trial: boolean;
  inputs: Record<string, string>;
  input_files: { field?: string; name: string; path: string; size: number }[];
};

type Output = { name: string; path: string; size: number };

const MIME: Record<string, string> = {
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pdf": "application/pdf",
  ".html": "text/html; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".srt": "application/x-subrip",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".zip": "application/zip",
};

/** اسم ملف آمن على القرص (يحافظ على العربية، يمنع المسارات) */
const diskName = (name: string) => name.replace(/[/\\\0]/g, "_").replace(/^\.+/, "_").slice(0, 150) || "file";
/** مفتاح تخزين ASCII (المخزن يرفض الأحرف غير اللاتينية) */
const storageKey = (name: string, i: number) => {
  const ext = path.extname(name).toLowerCase().replace(/[^a-z0-9.]/g, "");
  const base = path.basename(name, path.extname(name)).normalize("NFKD").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${String(i + 1).padStart(2, "0")}-${base || "file"}${ext}`;
};

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith(".")) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.isFile() ? [p] : [];
  });
}

export async function runJob(db: SupabaseClient, job: Job, signal: AbortSignal): Promise<void> {
  const machine = loadMachine(job.machine_slug);
  const work = path.join(config.workRoot, job.id);
  const dirs = { work, input: path.join(work, "input"), export: path.join(work, "export") };
  fs.rmSync(work, { recursive: true, force: true });
  fs.mkdirSync(dirs.input, { recursive: true });
  fs.mkdirSync(dirs.export, { recursive: true });

  let lastProgressAt = 0;
  let lastBeatAt = Date.now();
  const update = async (fields: Record<string, unknown>) => {
    const { error } = await db.from("jobs").update({ ...fields, heartbeat_at: new Date().toISOString() }).eq("id", job.id);
    if (error) console.error(`[${job.id}] تعذّر تحديث الطلب:`, error.message);
  };
  const progress = async (text: string, force = false) => {
    const now = Date.now();
    if (!force && now - lastProgressAt < 8000) return;
    lastProgressAt = lastBeatAt = now;
    await update({ progress: text.slice(0, 600) });
  };

  try {
    // 1) تنزيل ملفات العميل
    await progress("استلمنا طلبك — نجهّز ملفاتك للفريق…", true);
    const files = [];
    for (const f of job.input_files) {
      const { data, error } = await db.storage.from(BUCKET).download(f.path);
      if (error || !data) throw new Error(`تعذّر تنزيل ملف العميل: ${f.name}`);
      let local = path.join(dirs.input, diskName(f.name));
      if (fs.existsSync(local)) local = path.join(dirs.input, `${files.length + 1}-${diskName(f.name)}`);
      fs.writeFileSync(local, Buffer.from(await data.arrayBuffer()));
      files.push({ field: f.field, name: f.name, local });
    }

    // 2) تشغيل فريق الوكلاء
    const abort = new AbortController();
    signal.addEventListener("abort", () => abort.abort(), { once: true });
    const timer = setTimeout(() => abort.abort(), machine.worker.timeoutMin * 60_000);
    const budget = job.is_trial ? machine.worker.trialBudgetUsd : machine.worker.maxBudgetUsd;

    let cost: number | null = null;
    let resultError: string | null = null;
    try {
      const stream = query({
        prompt: buildPrompt(machine, job.inputs, files, dirs),
        options: {
          cwd: work,
          model: config.model,
          plugins: pluginPaths(machine).map((p) => ({ type: "local" as const, path: p })),
          skills: "all",
          settingSources: [],
          permissionMode: "bypassPermissions",
          allowDangerouslySkipPermissions: true,
          systemPrompt: { type: "preset", preset: "claude_code", append: WORKER_RULES },
          maxBudgetUsd: budget,
          abortController: abort,
          stderr: (d) => process.stderr.write(`[${job.id}] ${d}`),
        },
      });

      for await (const msg of stream as AsyncIterable<SDKMessage>) {
        if (msg.type === "assistant" && msg.parent_tool_use_id === null) {
          for (const block of msg.message.content) {
            if (block.type === "text" && block.text.trim()) await progress(block.text.trim());
            if (block.type === "tool_use" && (block.name === "Agent" || block.name === "Task")) {
              const d = (block.input as { description?: string })?.description;
              if (d) await progress(`تكليف موظف: ${d}`);
            }
          }
        } else if (msg.type === "result") {
          cost = msg.total_cost_usd;
          // أخطاء الـ API (مفتاح، رصيد…) ترجع أحياناً كـ success مع is_error
          if (msg.subtype !== "success") resultError = msg.subtype;
          else if (msg.is_error) resultError = msg.result?.slice(0, 300) || "error";
        }
        if (Date.now() - lastBeatAt > 60_000) {
          lastBeatAt = Date.now();
          await update({});
        }
      }
    } finally {
      clearTimeout(timer);
    }

    if (abort.signal.aborted && !signal.aborted) throw new Error(`تجاوز الطلب المدة القصوى (${machine.worker.timeoutMin} دقيقة)`);
    if (signal.aborted) throw new Error("أُوقف السيرفر أثناء التنفيذ");

    // 3) رفع الملفات الناتجة
    const produced = walk(dirs.export).filter((p) => fs.statSync(p).size <= config.maxOutputMB * 1024 * 1024);
    if (!produced.length) {
      throw new Error(
        resultError === "error_max_budget_usd"
          ? "تجاوز الطلب سقف التكلفة قبل إنهاء الملفات"
          : resultError
            ? `Claude: ${resultError}`
            : "لم يُنتج الفريق ملفات",
      );
    }
    await progress("خلصنا! نرفع ملفاتك…", true);
    const outputs: Output[] = [];
    for (const [i, file] of produced.entries()) {
      const name = path.relative(dirs.export, file).split(path.sep).join(" - ");
      const key = `outputs/${job.id}/${storageKey(name, i)}`;
      const body = fs.readFileSync(file);
      const { error } = await db.storage.from(BUCKET).upload(key, body, {
        contentType: MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        upsert: true,
      });
      if (error) throw new Error(`تعذّر رفع ${name}: ${error.message}`);
      outputs.push({ name, path: key, size: body.length });
    }

    await update({
      status: "done",
      output_files: outputs,
      progress: "جاهز ✓",
      cost_usd: cost,
      finished_at: new Date().toISOString(),
    });
    console.log(`[${job.id}] ✓ ${machine.slug} — ${outputs.length} ملفات — ${cost?.toFixed(2) ?? "?"}$`);
  } finally {
    if (!config.keepWorkdirs) fs.rmSync(work, { recursive: true, force: true });
  }
}
