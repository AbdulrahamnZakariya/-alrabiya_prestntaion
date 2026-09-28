import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** عميل Supabase بصلاحيات المستخدم الحالي (يحترم RLS) */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // يُستدعى من Server Component — الـ middleware يتكفل بتحديث الجلسة
          }
        },
      },
    },
  );
}
