import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Machine } from "@/lib/machines";

/** عدد التجارب المجانية لكل مستخدم في كل ماكينة */
export const FREE_TRIALS_PER_MACHINE = 1;

/**
 * عدد الاستخدامات المشمولة بكل عملية شراء (الشراء مرة ثانية يجدّد الرصيد).
 * كل تشغيل يكلّف Claude API فعلياً، لذلك الرصيد محدود بدل «مدى الحياة».
 * text: 8 استدعاءات Claude لكل تشغيل · worker: جلسة وكلاء كاملة تنتج ملفات
 */
export const DEFAULT_USES_PER_PURCHASE = { text: 40, worker: 3 };

export async function getCurrentUser(): Promise<User | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/** المالك = أي إيميل موجود في ADMIN_EMAILS (مفصولة بفواصل) */
export function isAdmin(user: User | null): boolean {
  if (!user?.email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(user.email.toLowerCase());
}

export type Access = {
  owned: boolean;
  trialsLeft: number;
  /** المتبقي من رصيد آخر عملية شراء */
  usesLeft: number;
  usesPerPurchase: number;
};

/** الطلبات التي تُحتسب: كل ما تجاوز المسودة ولم يفشل */
const COUNTED_JOB_STATUSES = ["queued", "running", "done"];

export function usesPerPurchase(machine: Machine): number {
  return machine.usesPerPurchase ?? (machine.runner === "worker" ? DEFAULT_USES_PER_PURCHASE.worker : DEFAULT_USES_PER_PURCHASE.text);
}

export async function getAccess(user: User | null, machine: Machine): Promise<Access> {
  const worker = machine.runner === "worker";
  const quota = usesPerPurchase(machine);
  if (!user) return { owned: false, trialsLeft: FREE_TRIALS_PER_MACHINE, usesLeft: 0, usesPerPurchase: quota };
  if (isAdmin(user)) return { owned: true, trialsLeft: 0, usesLeft: Number.MAX_SAFE_INTEGER, usesPerPurchase: quota };

  const db = createAdminClient();
  const table = worker ? "jobs" : "runs";
  const scoped = () => {
    let q = db.from(table).select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("machine_slug", machine.slug);
    if (worker) q = q.in("status", COUNTED_JOB_STATUSES);
    return q;
  };

  const [{ data: ent }, { count: trials }] = await Promise.all([
    db.from("entitlements").select("granted_at").eq("user_id", user.id).eq("machine_slug", machine.slug).maybeSingle(),
    scoped().eq("is_trial", true),
  ]);

  let usesLeft = 0;
  if (ent) {
    // الرصيد يُحسب من تاريخ آخر تفعيل — كل شراء جديد يحدّث granted_at
    const { count: used } = await scoped().eq("is_trial", false).gte("created_at", ent.granted_at as string);
    usesLeft = Math.max(0, quota - (used ?? 0));
  }

  return {
    owned: Boolean(ent),
    trialsLeft: Math.max(0, FREE_TRIALS_PER_MACHINE - (trials ?? 0)),
    usesLeft,
    usesPerPurchase: quota,
  };
}

/** هل يحق له تشغيل الماكينة الآن؟ وهل التشغيل تجربة مجانية؟ */
export function canRun(access: Access): { ok: true; isTrial: boolean } | { ok: false; reason: string } {
  if (access.owned) {
    return access.usesLeft > 0
      ? { ok: true, isTrial: false }
      : { ok: false, reason: `استخدمت كل الرصيد المشمول بالشراء (${access.usesPerPurchase}). جدّد الشراء لتكمل.` };
  }
  return access.trialsLeft > 0
    ? { ok: true, isTrial: true }
    : { ok: false, reason: "انتهت تجربتك المجانية — اشترِ الماكينة لتكمل" };
}

export async function getOwnedSlugs(user: User): Promise<string[]> {
  const db = createAdminClient();
  const { data } = await db.from("entitlements").select("machine_slug").eq("user_id", user.id);
  return (data ?? []).map((r) => r.machine_slug as string);
}
