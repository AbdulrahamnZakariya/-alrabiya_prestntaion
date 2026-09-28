import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** عدد التجارب المجانية لكل مستخدم في كل ماكينة */
export const FREE_TRIALS_PER_MACHINE = 1;

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
};

export async function getAccess(user: User | null, slug: string): Promise<Access> {
  if (!user) return { owned: false, trialsLeft: FREE_TRIALS_PER_MACHINE };
  if (isAdmin(user)) return { owned: true, trialsLeft: 0 };

  const db = createAdminClient();
  const [{ data: ent }, { count }] = await Promise.all([
    db
      .from("entitlements")
      .select("machine_slug")
      .eq("user_id", user.id)
      .eq("machine_slug", slug)
      .maybeSingle(),
    db
      .from("runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("machine_slug", slug)
      .eq("is_trial", true),
  ]);

  return {
    owned: Boolean(ent),
    trialsLeft: Math.max(0, FREE_TRIALS_PER_MACHINE - (count ?? 0)),
  };
}

export async function getOwnedSlugs(user: User): Promise<string[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("entitlements")
    .select("machine_slug")
    .eq("user_id", user.id);
  return (data ?? []).map((r) => r.machine_slug as string);
}
