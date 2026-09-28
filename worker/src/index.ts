import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";
import { runJob, type Job } from "./run.js";

// سيرفر المعالجة: يسحب طلبات المكائن الثقيلة من الطابور وينفّذها واحداً واحداً
const db = createClient(config.supabaseUrl, config.supabaseKey, { auth: { persistSession: false } });
const shutdown = new AbortController();
let current: string | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function tick(): Promise<boolean> {
  const { data, error } = await db.rpc("claim_job", { p_worker: config.workerId });
  if (error) {
    console.error("تعذّر سحب طلب:", error.message);
    return false;
  }
  const job = (data as Job[] | null)?.[0];
  if (!job) return false;

  current = job.id;
  console.log(`[${job.id}] ▶ ${job.machine_slug}${job.is_trial ? " (تجربة)" : ""}`);
  try {
    await runJob(db, job, shutdown.signal);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${job.id}] ✗ ${message}`);
    // عند إيقاف السيرفر يرجع الطلب للطابور بدل ما يفشل
    const requeue = shutdown.signal.aborted;
    await db
      .from("jobs")
      .update(
        requeue
          ? { status: "queued", queued_at: new Date().toISOString(), progress: null }
          : { status: "failed", error: message.slice(0, 500), finished_at: new Date().toISOString() },
      )
      .eq("id", job.id);
  } finally {
    current = null;
  }
  return true;
}

async function main() {
  console.log(`سيرفر المعالجة شغّال — ${config.workerId} · ${config.model}`);
  let lastStaleCheck = 0;
  while (!shutdown.signal.aborted) {
    if (Date.now() - lastStaleCheck > 5 * 60_000) {
      lastStaleCheck = Date.now();
      const { data } = await db.rpc("requeue_stale_jobs", { p_minutes: 20 });
      if (data) console.log(`أُعيد ${data} طلب عالق للطابور`);
    }
    const worked = await tick().catch((e) => {
      console.error(e);
      return false;
    });
    if (!worked) await sleep(config.pollMs);
  }
}

for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, () => {
    console.log(`إيقاف (${sig})${current ? ` — إرجاع الطلب ${current} للطابور` : ""}`);
    shutdown.abort();
    setTimeout(() => process.exit(0), current ? 15_000 : 0).unref();
  });
}

main().then(() => process.exit(0));
