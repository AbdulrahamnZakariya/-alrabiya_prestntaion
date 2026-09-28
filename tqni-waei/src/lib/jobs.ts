import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const JOB_BUCKET = "job-files";

export type JobFile = { field?: string; name: string; path: string; size: number; type?: string };

export type Job = {
  id: string;
  user_id: string;
  user_email: string | null;
  machine_slug: string;
  is_trial: boolean;
  status: "draft" | "queued" | "running" | "done" | "failed" | "canceled";
  inputs: Record<string, string>;
  input_files: JobFile[];
  output_files: JobFile[];
  progress: string | null;
  error: string | null;
  attempts: number;
  cost_usd: number | null;
  created_at: string;
  queued_at: string | null;
  started_at: string | null;
  finished_at: string | null;
};

export const JOB_STATUS: Record<Job["status"], { label: string; cls: string }> = {
  draft: { label: "بانتظار رفع الملفات", cls: "bg-surface-2 text-muted" },
  queued: { label: "في الطابور", cls: "bg-warn/15 text-warn" },
  running: { label: "الفريق يشتغل", cls: "bg-accent-2/15 text-accent-2" },
  done: { label: "جاهز", cls: "bg-accent/15 text-accent" },
  failed: { label: "تعذّر التنفيذ", cls: "bg-danger/15 text-danger" },
  canceled: { label: "ملغي", cls: "bg-surface-2 text-muted" },
};

/** مفتاح تخزين ASCII — المخزن يرفض الأحرف غير اللاتينية (الاسم الأصلي يُحفظ في name) */
export function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "file"}${ext}`;
}

/** روابط تنزيل مؤقتة لملفات الطلب الناتجة (تُنزَّل باسمها العربي الأصلي) */
export async function signedOutputs(job: Job, expiresSec = 3600) {
  if (!job.output_files?.length) return [];
  const storage = createAdminClient().storage.from(JOB_BUCKET);
  return Promise.all(
    job.output_files.map(async (f) => {
      const { data } = await storage.createSignedUrl(f.path, expiresSec, { download: f.name });
      return { name: f.name, size: f.size, url: data?.signedUrl ?? null };
    }),
  );
}
