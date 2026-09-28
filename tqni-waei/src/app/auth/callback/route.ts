import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// رابط الدخول القادم من الإيميل
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/account";
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
