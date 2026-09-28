import "server-only";
import { createClient } from "@supabase/supabase-js";

/** عميل بصلاحيات كاملة — للاستخدام في السيرفر فقط (لوحة المالك، التفعيل، رفع الإيصالات) */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
